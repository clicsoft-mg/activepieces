import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { decode } from '../common/common';
import { MewsRequest } from '../common/types';

export const getHotelConfig = createAction({
  name: 'getHotelConfig',
  displayName: 'Get Hotel Config',
  description: 'Fetches the hotel configuration',
  props: {
    headers: Property.Object({
      displayName: 'Headers',
      required: true,
    }),
    queryParams: Property.Object({
      displayName: 'Query params',
      required: true,
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: true,
      defaultValue: 'none',
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'none' },
          { label: 'Form Data', value: 'form_data' },
          { label: 'JSON', value: 'json' },
          { label: 'Raw', value: 'raw' },
        ],
      },
    }),

    body: Property.DynamicProperties({
      displayName: 'Body',
      refreshers: ['body_type'],
      required: true,
      props: async ({ body_type }) => {
        const bodyTypeInput = body_type as unknown as string;
        const fields: DynamicPropsValue = {};

        switch (bodyTypeInput) {
          case 'json':
            fields['data'] = Property.Json({
              displayName: 'JSON Body',
              required: true,
            });
            break;
          case 'raw':
            fields['data'] = Property.LongText({
              displayName: 'Raw Body',
              required: true,
            });
            break;
          case 'form_data':
            fields['data'] = Property.Object({
              displayName: 'Form Data',
              required: true,
            });
            break;
        }
        return fields;
      },
    }),
  },
  async run(context) {
    console.log('ctx', context.propsValue.body);
    const { body } = context.propsValue;

    if (!body) {
      return;
    }
    console.log(body);
    const reqBody = body?.['data']?.['body'];

    if (!reqBody) {
      throw new Error('Missing required data');
    }
    const decodedObject = await decode(reqBody.data);
    console.log(decodedObject, JSON.stringify(decodedObject));
    const data: MewsRequest = decodedObject;
    const creds = data?.['credentials'];
    if (
      !data?.url ||
      !creds?.accessToken ||
      !creds?.clientToken ||
      !creds?.client
    ) {
      throw new Error('Missing required data');
    }
    const { accessToken, clientToken, client } = creds;
    const origin = data.url;
    // Fetch data from API with response type as any
    const config = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${origin}/api/connector/v1/configuration/get`,
      body: {
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: client,
      },
    });
    const tax = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${origin}/api/connector/v1/taxations/getAll`,
      body: {
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: client,
        Limitation: {
          Cursor: null,
          Count: 999,
        },
      },
    });
    const bs = await httpClient.sendRequest<any>({
      method: HttpMethod.POST,
      url: `${origin}/api/connector/v1/businessSegments/getAll`,
      body: {
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: client,
      },
    });

    const hotelInfo = config.body;
    const taxes = tax.body;
    const businessSegments = bs.body;

    // Transform the data to the desired format
    const transformedData = {
      hotel: {
        hotelCode: hotelInfo.Enterprise?.Address?.Id || null,
        name: hotelInfo.Enterprise?.Name || null,
        language: hotelInfo.Enterprise?.DefaultLanguageCode || null,
        currency: hotelInfo.Enterprise?.Currencies?.find((c: any) => c.IsDefault)?.Currency || null,
        isActive: true,
        cityTaxCode: taxes.TaxRates?.[0]?.Code || null,
        address: {
          address1: hotelInfo.Enterprise?.Address?.Line1 || '',
          address2: hotelInfo.Enterprise?.Address?.Line2 || '',
          address3: hotelInfo.Enterprise?.Address?.Line3 || '',
          address4: hotelInfo.Enterprise?.Address?.Line4 || '',
          city: hotelInfo.Enterprise?.Address?.City || '',
          zipCode: hotelInfo.Enterprise?.Address?.PostalCode || '',
          country: hotelInfo.Enterprise?.Address?.CountryCode || '',
          email1: hotelInfo.Enterprise?.Email || '',
          email2: '',
          phone1: hotelInfo.Enterprise?.Phone || '',
          phone2: '',
          cell1: '',
          cell2: '',
        },
      },
      additionalInfo: {
        taxes: taxes.TaxRates?.map((tax: any) => {
          const taxName = taxes.Taxations?.find((t: any) => t.Code === tax.TaxationCode)?.Name || 'Name not found';
          return {
            code: tax.Code,
            name: taxName,
            value: tax.Value,
          };
        }),
        businessSegments: businessSegments.BusinessSegments?.map((segment: any) => ({
          id: segment.Id,
          name: segment.Name,
        })),
      },
    };
 
    return transformedData;
  },
});
