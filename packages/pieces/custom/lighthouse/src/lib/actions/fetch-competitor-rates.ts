import {
  httpClient,
  HttpError,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { decode } from '../common/common';

export const fetchcompetitorrates = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'fetchcompetitorrates',
  displayName: 'Fetch Competitor Rates',
  description: "Fetches Hotels's Competitors' Rates",

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
    try {
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
      if(!decodedObject.url || !decodedObject.headers || !decodedObject.queryParams){
        throw new Error('Invalid request');
      }

      const request: HttpRequest = {
        method: 'GET' as HttpMethod,
        url:`${decodedObject.url}/hotels`,
        headers: decodedObject.headers as HttpHeaders,
        queryParams: {
          page: "1",
          par_page: "100",
        } as QueryParams,
        timeout: 0,
      };

      const ratesRequest: HttpRequest = {
        method: 'GET' as HttpMethod,
        url:`${decodedObject.url}/rates`,
        headers: decodedObject.headers as HttpHeaders,
        queryParams: decodedObject.queryParams as QueryParams,
        timeout: 0,
      };
      const[rates,hotelConfig] = await Promise.all([httpClient.sendRequest(request),httpClient.sendRequest(ratesRequest)]);
      console.log(rates);
      console.log(hotelConfig);
      return {...rates.body,...hotelConfig.body};
    } catch (error) {
      console.error('Error running fetch competitor rates action:', error);
      throw error;
    }
  },
});
