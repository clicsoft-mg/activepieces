import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createHttpPostRequest } from '../common';

export interface RequestPayload {
  origin: string;
  clientToken: string;
  accessToken: string;
  client: string;
  serviceIds: string[];
  enterpriseIds?: string[];
  resourceCategoryIds?: string[];
  updatedUtc?: {
    startUtc?: string; // ISO 8601 format date string
    endUtc?: string; // ISO 8601 format date string
  };
  status?: string[];
}

export interface ResourceCategories {
  Id: string; // UUID string for the ID
  EnterpriseId: string; // UUID string for the Enterprise ID
  ServiceId: string; // UUID string for the Service ID
  IsActive: boolean; // Boolean indicating if the item is active
  Type: string; // Type of the service, in this case "Bed"
  Names: Record<string, string>; // Dictionary for names, with locale as key (e.g., 'en-US')
  ShortNames: Record<string, string>; // Dictionary for short names, with locale as key (e.g., 'en-US')
  Descriptions: Record<string, string>; // Dictionary for descriptions, can be empty
  Ordering: number; // Integer value for ordering
  Capacity: number; // Integer value for capacity
  ExtraCapacity: number; // Integer value for extra capacity
  ExternalIdentifier: string | null; // External identifier, can be null
};

export const getResourceCategories = async (body: RequestPayload) => {
  if (!body) {
    throw new Error('Request body is missing');
  }
  console.log('Request body:', body.serviceIds.length);
  const {
    origin,
    clientToken,
    accessToken,
    client,
    enterpriseIds,
    serviceIds,
    resourceCategoryIds,
    updatedUtc,
    status,
  } = body;
  // console.log('service ids', serviceIds)

  // Add optional ServiceIds
  if (!serviceIds || serviceIds.length === 0) {
    // console.log('service ids not found')
    throw new Error('ServiceIds are required');
  }
  // External API call to fetch rates
  const endpoint = `${origin}/api/connector/v1/resourceCategories/getAll`;

  const request = createHttpPostRequest('POST' as HttpMethod, endpoint, {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: client,
    ServiceIds: serviceIds,
  });
  // console.log(request)

  // Add optional EnterpriseIds
  if (enterpriseIds && enterpriseIds.length > 0) {
    request.body.EnterpriseIds = enterpriseIds;
  }
  if (status && status.length > 0) {
    request.body.ActivityStates = status;
  }
  // if(updatedUtc ) {
  //   request.body.UpdatedUtc = {
  //     StartUtc: updatedUtc.startUtc,
  //     EndUtc: updatedUtc.endUtc,
  //   };
  // }

  // Add optional ResourceCategoryIds
  if (resourceCategoryIds && resourceCategoryIds.length > 0) {
    request.body.ResourceCategoryIds = resourceCategoryIds;
  }

  // console.log('resource cat', JSON.stringify(request))
  try {
    const response = await httpClient.sendRequest<{ ResourceCategories: ResourceCategories[] }>(
      request
    );
    // console.log('ResourceCategories response', response)
    if (!response?.body?.ResourceCategories) {
      throw new Error('Failed to fetch resource categories');
    }

    return response.body.ResourceCategories;
  } catch (error: any) {
    console.error('Error during resource categories fetch:', error);
    throw new Error(`resource categories fetch failed: ${error.message}`);
  }
};
