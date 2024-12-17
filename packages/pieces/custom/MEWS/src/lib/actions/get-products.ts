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
import {
  AccountingCategories,
  MewsBody,
  MewsRequest,
  Product,
  Service,
} from '../common/types';
import { decode } from '../common/common';

export const getProducts = createAction({
  name: 'getProducts',
  displayName: 'Fetch Products',
  description: 'Fetch Products',

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
    const mewsBody: MewsBody = reqBody.body;
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
      services: `${origin}/api/connector/v1/services/getAll`,
      products: `${origin}/api/connector/v1/products/getAll`,
      accountingCategories: `${origin}/api/connector/v1/accountingCategories/getAll`,
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
      products: createHttpPostRequest(endpoints.products),
      accountingCategories: createHttpPostRequest(
        endpoints.accountingCategories
      ),
    };
    const responses: any = {};
    const serviceObj: any = {};
    let serviceIds: string[] = [];
    const serviceSet = new Set<string>();
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
        serviceSet.add(item.Id);
        Object.assign(serviceObj, {
          [item.Id]: item.Name,
        });
      }
    });
    serviceIds = Array.from(serviceSet);
    console.log('serviceIds', serviceIds.length);

    try {
      if (mewsBody?.productIds && mewsBody?.productIds.length > 0) {
        requests.products.body.ProductIds = mewsBody?.productIds;
      }
      requests.products.body.ServiceIds = serviceIds;
      responses['products'] = await httpClient.sendRequest<{
        Products: Product[];
      }>(requests.products);
      if (!responses?.['products']?.body?.Products) {
        throw new Error(`products data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch products ${JSON.stringify(error)}`);
    }

    const products = responses?.['products']?.body?.Products;
    console.log('products', products.length, products[0]);
    const productsRes: any = [];
    const acIds = new Set<string>();
    products.forEach((itm: Product) => {
      const keys = Object.keys(itm.Names);
      const obj = {
        productCode: itm.Id,
        productLabel: itm.Names[keys[0]],
        productShortLabel: itm.ShortNames[keys[0]],
        accountingCategory: itm.AccountingCategoryId,
        serviceId: itm.ServiceId,
        price: itm.Price.GrossValue,
        tax:{
          taxCode: itm.Price.TaxValues[0]?.Code || '',
          taxValue: itm.Price.TaxValues[0]?.Value
        },
        isActive: itm.IsActive,
        chargingMode: itm.ChargingMode
      };
      if (itm.AccountingCategoryId) acIds.add(itm.AccountingCategoryId);
      productsRes.push(obj);
    });

    try {
      if (Array.from(acIds).length > 0) {
        requests.accountingCategories.body.AccountingCategoryIds =
          Array.from(acIds);
      }
      responses['accountingCategories'] = await httpClient.sendRequest<{
        AccountingCategories: AccountingCategories[];
      }>(requests.accountingCategories);
      if (!responses?.['accountingCategories']?.body?.AccountingCategories) {
        throw new Error(`accountingCategories data not found`);
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch accountingCategories ${JSON.stringify(error)}`
      );
    }
    const acObj: any = {};
    console.log('accountingCategories',responses['accountingCategories'].body.AccountingCategories[0])
    responses['accountingCategories'].body.AccountingCategories.forEach(
      (itm: AccountingCategories) => {
        Object.assign(acObj, {
          [itm.Id]: {
            classification: itm.Classification,
            name: itm.Name,
            code: itm.Code,
          },
        });
      }
    );

    productsRes.forEach((itm: any) =>
      Object.assign(itm, {
        accountingCategory: itm.accountingCategory
          ? acObj?.[itm.accountingCategory]
          : {},
      })
    );

    console.log('success', productsRes[0]);
    return { products: productsRes};
  },
});
