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
import { assertNotNullOrUndefined } from '@activepieces/shared';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

export const modifyData = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'modifyData',
  displayName: 'modifyData',
  description: '',

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
      const rates = body['rates'];
      const retObj = [];
      for (let i = 0; i < rates.length; i++) {
        const obj = {
          compHotelId: rates[i].hotelId,
          extractDateTime: rates[i].extractDateTime,
          date: rates[i].arrivalDate,
          currency: rates[i].currency,
          message: rates[i].message,
          roomName: rates[i].roomName,
          roomType: rates[i].roomType,
          amount: rates[i].value,
          hotelId: body['hotelId'],
          accountId: body['hotelId'].split('-')[0],
        };
        retObj.push(obj);
      }
      return retObj;
    } catch (error) {
      console.error('Error running fetchdata action:', error);
      throw error;
    }
  },
});
