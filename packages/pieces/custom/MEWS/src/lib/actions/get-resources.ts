import {
  httpClient,
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
import {
  MewsBody,
  MewsRequest,
  ResourceCategories,
  ResourceCategoryAssignments,
  Resources,
  Service,
} from '../common/types';
import { decode } from '../common/common';

export const getResources = createAction({
  name: 'getResources',
  displayName: 'Fetch Resources',
  description: 'Fetch Hotel Resources/Rooms',

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
    console.log(decodedObject, JSON.stringify(decodedObject));
    const data: MewsRequest = decodedObject;
    const mewsBody:MewsBody = reqBody.body
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
      resourceCategoryAssignments: `${origin}/api/connector/v1/resourceCategoryAssignments/getAll`,
      services: `${origin}/api/connector/v1/services/getAll`,
      resourceCategories: `${origin}/api/connector/v1/resourceCategories/getAll`,
      resources: `${origin}/api/connector/v1/resources/getAll`,
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
      resources: createHttpPostRequest(endpoints.resources, {
        Extent: { Resources: true },
      }),
      resourceCategoryAssignments: createHttpPostRequest(
        endpoints.resourceCategoryAssignments,
        {
          ActivityStates: ['Active'],
        }
      ),
      services: createHttpPostRequest(endpoints.services),
      resourceCategories: createHttpPostRequest(endpoints.resourceCategories),
    };
    const responses: any = {};
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
    const serviceIds = responses?.['services']?.body?.Services.map(
      (item: any) => item.Id
    );

    try {
      requests.resourceCategories.body.ServiceIds = serviceIds;
      responses['resourceCategories'] = await httpClient.sendRequest<{
        ResourceCategories: ResourceCategories[];
      }>(requests.resourceCategories);
      if (!responses?.['resourceCategories']?.body?.ResourceCategories) {
        throw new Error(`resourceCategories data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch services ${JSON.stringify(error)}`);
    }

    try {
      responses['resources'] = await httpClient.sendRequest<{
        Resources: Resources[];
      }>(requests.resources);
      if (!responses?.['resources']?.body?.Resources) {
        throw new Error(`resources data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch Resources ${JSON.stringify(error)}`);
    }

    const resources = responses?.['resources']?.body?.Resources;
    const resourcesObj: any = {};
    resources.forEach((itm: Resources) => {
      Object.assign(resourcesObj, {
        [itm.Id]: {
          label: itm.Name,
          parent: itm.ParentResourceId,
          state: itm.State,
          id: itm.Id,
        },
      });
    });

    const rcIds = responses?.[
      'resourceCategories'
    ]?.body?.ResourceCategories.map((item: any) => item.Id);
    const resourceCategoriesObj: any = {};
    const resourceCategories =
      responses?.['resourceCategories']?.body?.ResourceCategories;
    resourceCategories.forEach((itm: ResourceCategories) => {
      const keys = Object.keys(itm.Names);
      Object.assign(resourceCategoriesObj, {
        [itm.Id]: {
          resourceLabel: itm.Names[keys[0]] || '',
          resourceCode: itm.Id || '',
          minOccupancy: 1,
          maxOccupancy: itm.Capacity,
          resourceType: itm.Type,
          isActive: itm.IsActive !== undefined ? itm.IsActive : true,
          slots: {},
          pmsFields: {
            serviceIds: itm.EnterpriseId || '',
            ageCategory: {},
            resources: [],
          },
        },
      });
    });

    try {
      requests.resourceCategoryAssignments.body.ResourceCategoryIds = rcIds;
      responses['resourceCategoryAssignments'] = await httpClient.sendRequest<{
        ResourceCategoryAssignments: ResourceCategoryAssignments[];
      }>(requests.resourceCategoryAssignments);
      if (
        !responses?.['resourceCategoryAssignments']?.body
          ?.ResourceCategoryAssignments
      ) {
        throw new Error(`resourceCategoryAssignments data not found`);
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch ResourceCategoryAssignments ${JSON.stringify(error)}`
      );
    }

    const resourceCategoryAssignments =
      responses?.['resourceCategoryAssignments']?.body
        ?.ResourceCategoryAssignments;
    resourceCategoryAssignments.forEach((itm: ResourceCategoryAssignments) => {
      if (
        resourceCategoriesObj?.[itm.CategoryId] &&
        resourcesObj?.[itm.ResourceId]
      ) {
        resourceCategoriesObj[itm.CategoryId].pmsFields.resources.push(
          resourcesObj[itm.ResourceId]
        );
      }
    });
    console.log('success');
    return Object.values(resourceCategoriesObj);
  },
});
