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
  MewsBody,
  MewsRequest,
  ResourceBlock,
  ResourceCategories,
  ResourceCategoryAssignments,
  Service,
} from '../common/types';
import { decode } from '../common/commonFunctions';

export const getResourceBlocks = createAction({
  name: 'getResourceBlocks',
  displayName: 'Fetch Resources Blocks',
  description: 'Fetch  Resources Blocks',

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
    let startDate = new Date(); // Today's date
    let endDate = new Date();

    endDate.setFullYear(startDate.getFullYear() + 1);
    console.log('reqBody', reqBody);
    const decodedObject = await decode(reqBody.data);
    console.log(decodedObject, JSON.stringify(decodedObject));
    const data: MewsRequest = decodedObject;
    const mewsBody: MewsBody = reqBody.body;
    const creds = data?.['credentials'];
    if (
      !data?.url ||
      !creds?.accessToken ||
      !creds?.clientToken ||
      !creds?.client
    ) {
      throw new Error('Missing required data');
    }
    if(data?.body?.startDate){
      startDate = new Date(data?.body?.startDate);
    }
    if(data?.body?.endDate){
      endDate = new Date(data.body.endDate);
    }
    endDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    const { accessToken, clientToken, client } = creds;
    const origin = data.url;
    const endpoints = {
      resourceCategoryAssignments: `${origin}api/connector/v1/resourceCategoryAssignments/getAll`,
      services: `${origin}api/connector/v1/services/getAll`,
      resourceCategories: `${origin}api/connector/v1/resourceCategories/getAll`,
      resources: `${origin}api/connector/v1/resources/getAll`,
      resourceBlocks: `${origin}api/connector/v1/resourceBlocks/getAll`,
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
      resourceBlocks: createHttpPostRequest(endpoints.resourceBlocks, {
        Extent: { Inactive: false },
      }),
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
      (item: Service) => item.Id
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

    const resourcesCategoryIds = responses[
      'resourceCategories'
    ]?.body?.ResourceCategories.map(
      (resourceCategory: ResourceCategories) => resourceCategory.Id
    );

    try {
      responses['resourceBlocks'] = await httpClient.sendRequest<{
        ResourceBlocks: ResourceBlock[];
      }>(requests.resourceBlocks);
      if (!responses?.['resourceBlocks']?.body?.ResourceBlocks) {
        throw new Error(`ResourceBlocks data not found`);
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch ResourceBlocks ${JSON.stringify(error)}`
      );
    }

    const resourceBlocks: any = [];
    async function fetchRes(cursor: string | null) {
      requests.resourceBlocks.body.Limitation.Cursor = cursor;

      try {
        responses['resourceBlocks'] = await httpClient.sendRequest<{
          ResourceBlocks: ResourceBlock[];
        }>(requests.resourceBlocks);
        if (!responses?.['resourceBlocks']?.body?.ResourceBlocks) {
          throw new Error(`ResourceBlocks data not found`);
        }
        resourceBlocks.push(...responses['resourceBlocks'].body.ResourceBlocks);
      } catch (error) {
        throw new Error(
          `Failed to fetch ResourceBlocks ${JSON.stringify(error)}`
        );
      }
      // console.log('resArr========> ', JSON.stringify(resArr))
      // return
      if (
        responses['resourceBlocks'].body.Cursor &&
        responses['resourceBlocks'].body.ResourceBlocks.length === 999
      ) {
        await fetchRes(responses['resourceBlocks'].body.Cursor);
      }
    }

    async function fetchData(startDate: Date, endDate: Date) {
      console.log('fetchData');
      const maxRange = 90;
      let currentDate = startDate;
      while (currentDate <= endDate) {
        const nextDate = new Date(
          currentDate.getTime() + maxRange * 24 * 60 * 60 * 1000
        );
        const limitedEndDate = nextDate > endDate ? endDate : nextDate;
        requests.resourceBlocks.body.CollidingUtc.StartUtc = currentDate;
        requests.resourceBlocks.body.CollidingUtc.EndUtc = limitedEndDate;
        await fetchRes(null);
        // return
        currentDate = new Date(limitedEndDate.getTime() + 1);
      }
    }

    await fetchData(new Date(startDate), new Date(endDate));

    const resourceBlocksArr: any = [];
    const resSet = new Set();
    resourceBlocks.forEach((itm: ResourceBlock) => {
      resSet.add(itm.AssignedResourceId);
      resourceBlocksArr.push({
        resourceId: itm.AssignedResourceId,
        name: itm.Name,
        start: itm.StartUtc,
        end: itm.EndUtc,
        type: itm.Type,
        description: itm.Notes,
        categoryId: null,
      });
    });

    try {
      requests.resourceCategoryAssignments.body.ResourceCategoryIds =
        resourcesCategoryIds;
      requests.resourceCategoryAssignments.body.ResourceCategoryAssignmentIds =
        Array.from(resSet);
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

    const resourceCategoryAssignmentsObj: any = {};
    responses[
      'resourceCategoryAssignments'
    ]?.body?.ResourceCategoryAssignments.forEach(
      (itm: ResourceCategoryAssignments) => {
        Object.assign(resourceCategoryAssignmentsObj, {
          [itm.ResourceId]: itm.CategoryId,
        });
      }
    );
    resourceBlocksArr.forEach((itm: any) => {
      itm.categoryId = resourceCategoryAssignmentsObj[itm.resourceId];
    });
    return resourceBlocksArr;
  },
});
