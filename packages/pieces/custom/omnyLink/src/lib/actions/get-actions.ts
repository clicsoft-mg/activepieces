import { createAction, DynamicProp, DynamicPropsValue, Property, StoreScope } from '@activepieces/pieces-framework';
import { getAuthToken } from '../common/getAuthToken';
import { HttpMethod } from '@activepieces/pieces-common';
import { httpRequest } from '../common/httpRequestSender';
import { getConnectors } from '../common/getConnectors';
import { getMethod } from '../common/getMethod';

export const getActions = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getActions',
  displayName: 'Get Actions',
  description: '',
  props: {
    connectorType: Property.Dropdown({
      displayName: 'Connector Type',
      description: 'Select a connector type from the list.',
      refreshers: [],
      required: true,
      defaultValue: '',
      options: async (context) => {
        console.log('context', context)
        const connectorResponse = await getConnectors({ isActive: true });

        if (!connectorResponse || !Array.isArray(connectorResponse)) {
          throw new Error('Data is missing or invalid');
        }

        // Extract distinct connector types
        const uniqueConnectors = Array.from(
          new Set(connectorResponse.map((item: { connectorType: string }) => item.connectorType))
        );

        return {
          options: uniqueConnectors.map((connectorType: string) => ({
            label: connectorType,
            value: connectorType,
          })),
        };
      },
    }),

    connectorCode: Property.Dropdown({
      displayName: 'Connector',
      description: 'Select a connector from the list.',
      refreshers: ['connectorType'],
      required: true,
      defaultValue: '',
      options: async (propsValue) => {
        const { connectorType } = propsValue;
        if (!connectorType) {
          return { options: [] };
        }
        const connectorResponse = await getConnectors({ isActive: true, connectorType });

        if (!connectorResponse || !Array.isArray(connectorResponse)) {
          throw new Error('Data is missing or invalid');
        }

        const uniqueConnectors = Array.from(
          new Map(
            connectorResponse.map((item: { connectorCode: string }) => [item.connectorCode, item])
          ).values()
        );

        return {
          options: uniqueConnectors.map((item: { connectorCode: string }) => ({
            label: item.connectorCode,
            value: item.connectorCode,
          })),
        };
      },
    }),

    action: Property.Dropdown({
      displayName: 'Action',
      description: 'Select an action from the list.',
      refreshers: ['connectorCode'],
      required: true,
      defaultValue: '',
      options: async (propsValue) => {
        console.log("propsValue action", JSON.stringify(propsValue))

        const { connectorCode } = propsValue;

        if (!connectorCode) {
          return { options: [] };
        }

        const connectorResponse = await getConnectors({ isActive: true, connectorCode });

        if (!connectorResponse || !Array.isArray(connectorResponse)) {
          throw new Error('Data is missing or invalid');
        }

        const uniqueActions = Array.from(
          new Map(
            connectorResponse.map((item: { action: string }) => [item.action, item])
          ).values()
        );

        return {
          options: uniqueActions.map((item: any) => ({
            label: item.action,
            value: item,
          })),
        };
      },
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: true,
      defaultValue: 'none',
      options: {
        disabled: false,
        options: [
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
          case 'raw':
            fields['data'] = Property.LongText({
              displayName: 'Raw Body',
              required: true,
            });
            break;
        }
        return fields;
      },
    }),
  },
  async run(context: any) {
    const { connectorType, connectorCode, action, body } = context.propsValue
    console.log("connectorType, connectorCode, action,", connectorType, connectorCode, action, context.auth)
    const token = await getAuthToken(context.auth)
    if (!token) {
      return { message: 'unauthorised' }
    }
    if (action?.endpoint) {
      const baseUrl = context.auth?.baseUrl
      const url = baseUrl + action?.endpoint;

      if (body) {
        const reqHeaders = body["data"]["headers"]
        const reqQueryParams = body["data"]['queryParams']
        if (reqHeaders) {
          const { ref, reqparams } = reqHeaders
          if (ref && reqparams) {
            const headers = { Accept: 'application/json', connectWith: connectorCode, reqParams: reqparams, ref: ref, Authorization: `Bearer ${token}` }
            let httpResponse
            const method = getMethod(action.method)
            if (method) {
              if (reqQueryParams && Object.keys(reqQueryParams).length) {
                httpResponse = await httpRequest({ method: method, url, timeout: 5000, headers, queryParams: reqQueryParams })
              } else {
                httpResponse = await httpRequest({ method: method, url, timeout: 5000, headers })
              }
              if (httpResponse?.body) {
                return httpResponse?.body
              } else {
                return { message: "Send ReqHeaders in headers", data: body["data"] }
              }
            } else {
              return { message: "Method is Not Proper", data: action }
            }
          } else {
            return { message: "Send Proper Ref and reqParams in Headers", data: reqHeaders }
          }
        } else {
          return { message: "Send ReqHeaders in headers", data: body["data"] }
        }
      } else {
        return 'Send Body From Catch Webhook'
      }
    } else {
      return 'EndPoint Not Found'
    }
  },
});
