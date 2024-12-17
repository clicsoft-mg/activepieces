import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { 
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  MewsRequestAddContact,
  MewsResponseAddContact,
  Resources,
} from '../common/types';
import { decode } from '../common/common';

export const createContact = createAction({
  name: 'createcontact',
  displayName: 'Create Contact',
  description: 'Creates a new contact',
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
          {
            label: 'None',
            value: 'none',
          },
          {
            label: 'Form Data',
            value: 'form_data',
          },
          {
            label: 'JSON',
            value: 'json',
          },
          {
            label: 'Raw',
            value: 'raw',
          },
        ],
      },
    }),

    body: Property.DynamicProperties({
      displayName: 'Body',
      refreshers: ['body_type'],
      required: true,
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
    console.log('ctx', context.propsValue.body);

    const { body } = context.propsValue;
    if (!body) {
      return;
    }
    console.log(body);
    const reqData = body?.['data']?.['body'];
    //const reqBody

    console.log('reqBody 8===================================D', reqData);

    if (!reqData) {
      throw new Error('Missing required data');
    }
    console.log('reqBody', reqData);
    const decodedObject = await decode(reqData.data);
    const contactBody = reqData.body;
    console.log(decodedObject, JSON.stringify(decodedObject));
    const data: MewsRequestAddContact = decodedObject;
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
      resourceContactCreate: `${origin}/api/connector/v1/customers/add`
    };

    const formattedCustomerData = {
      FirstName: contactBody.name,
      LastName: contactBody.surname,
      Email: contactBody.email,
      Phone: contactBody.phone,
      Address: {
        Line1: contactBody.address.address1 + " " + contactBody.address.address2,
        Line2: contactBody.address.address3 + " " + contactBody.address.address4,
        City: contactBody.address.city,
        State: contactBody.address.state,
        PostalCode: contactBody.address.zipCode,
        CountryCode: contactBody.address.country
      }
    };

    const createHttpPostRequest = (
      url: string,
      formattedCustomerData: Record<string, any> = {}
    ): HttpRequest => ({
      method: 'POST' as HttpMethod,
      url,
      timeout: 5000,
      body: {
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: client,
        ...formattedCustomerData,
      },
    });

    
    const requests = {
      contactCreate: createHttpPostRequest(endpoints.resourceContactCreate, formattedCustomerData)
    };
    
    console.log('formattedCustomerData', requests.contactCreate.body);
    const responses: any = {};

    try {
      responses['contactCreate'] = await httpClient.sendRequest<{
        MewsResponseAddContact: Resources[];
      }>(requests.contactCreate);
      if (!responses?.['contactCreate']?.body?.MewsResponseAddContact) {
        throw new Error(`Contact not created`);
      }
    } catch (error) {
      throw new Error(`Failed to create contact ${JSON.stringify(error)}`);
    }

    const resourcesCreateContact = responses?.['contactCreate']?.body?.MewsResponseAddContact;
    const resourcesCreateContactObj: any = {};
    resourcesCreateContact.forEach((itm: MewsResponseAddContact) => {
      Object.assign(resourcesCreateContactObj, {
        [itm.Id]: {
          id: itm.Id,
          name: itm.FirstName,
          surname: itm.LastName,
          email: itm.Email,
          phone: itm.Phone,
          address: {
            address1: itm.Address.Line1,
            address2: itm.Address.Line2,
            city: itm.Address.City,
            state: itm.Address.State,
            zipCode: itm.Address.PostalCode,
            country: itm.Address.CountryCode
          }
        },
      });
    });

    return resourcesCreateContactObj;

  },


});
