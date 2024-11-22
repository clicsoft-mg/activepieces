import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { MewsBody, MewsRequest, Rates, Service } from '../common/types';
import { decode } from '../common/commonFunctions';

export const getRates = createAction({
  name: 'getRates',
  displayName: 'Fetch Rates',
  description: 'Fetch Rates',

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
      required: false,
      props: async ({ body_type }) => {
        if (!body_type) return {};

        const bodyTypeInput = body_type as unknown as string;

        const fields: DynamicPropsValue = {};

        switch (bodyTypeInput) {
          case 'none':
            break;
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
    const { body } = context.propsValue;

    if (!body) {
      return;
    }
    console.log(body);
    const reqBody = body?.['data']?.['body'];

    if (!reqBody) {
      throw new Error('Missing required data');
    }
    console.log('reqBody', reqBody);
    const decodedObject = await decode(reqBody.data);
    const mewsBody:MewsBody = reqBody.body
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
    const endpoints = {
      services: `${origin}api/connector/v1/services/getAll`,
      rates: `${origin}api/connector/v1/rates/getAll`,
    };
    const createHttpPostRequest = (
      url: string,
      additionalBody: Record<string, any> = {}
    ): HttpRequest => ({
      method: 'POST' as HttpMethod,
      url,
      timeout: 5000,
      body: {
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: client,
        Limitation: {
          Cursor: null,
          Count: 999,
        },
        ...additionalBody,
      },
    });
    const requests = {
      services: createHttpPostRequest(endpoints.services),
      rates: createHttpPostRequest(endpoints.rates),
    };
    const responses: any = {};
    const serviceObj: any = {};
    const serviceIds: string[] = [];
    if (mewsBody?.serviceIds && mewsBody?.serviceIds.length > 0) {
      requests.services.body.ServiceIds = mewsBody?.serviceIds;
    }
    try {
      responses['services'] = await httpClient.sendRequest<{
        Services: Service[];
      }>(requests.services);
      if (!responses?.['services']?.body?.Services) {
        throw new Error(`services data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch services ${JSON.stringify(error)}`);
    }
    responses?.['services']?.body?.Services.forEach((item: Service) => {
      if (item.IsActive) {
        serviceIds.push(item.Id);
        Object.assign(serviceObj, {
          [item.Id]: item.Name,
        });
      }
    });

    try {
      requests.rates.body.ServiceIds = serviceIds;
      if (mewsBody?.rateIds && mewsBody?.rateIds.length > 0) {
        requests.rates.body.RateIds = mewsBody?.rateIds;
      }
      responses['rates'] = await httpClient.sendRequest<{
        Rates: Rates[];
      }>(requests.rates);
      if (!responses?.['rates']?.body?.Rates) {
        throw new Error(`rates data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch rates ${JSON.stringify(error)}`);
    }

    const rates = responses?.['rates']?.body?.Rates;
    const ratesRes: any = [];
    rates.forEach((itm: Rates) => {
      const obj = {
        rateCode: itm.Id,
        rateLabel: itm.Name,
        rateShortLabel: itm.ShortName,
        priceType: serviceObj[itm.ServiceId],
        isActive: itm.IsActive,
        isEnabled: itm.IsEnabled,
        isPublic: itm.IsPublic,
      };
      ratesRes.push(obj);
    });

    console.log('success');
    return ratesRes;
  },
});
