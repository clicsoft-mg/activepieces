import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createHttpPostRequest } from '../common';

export interface RequestPayload {
  origin: string;
  clientToken: string;
  accessToken: string;
  client: string;
  enterpriseIds?: string[];
  resourceIds?: string[];
  createdUtc?: {
    startUtc: string; // ISO 8601 format date string
    endUtc: string; // ISO 8601 format date string
  };
  updatedUtc?: {
    startUtc: string; // ISO 8601 format date string
    endUtc: string; // ISO 8601 format date string
  };
  limit?: {
    count: number;
    cursor: string;
  };
}

export interface Resources {
  Id: string;
  EnterpriseId: string;
  IsActive: boolean;
  Name: string;
  ParentResourceId: string | null;
  State: string;
  Descriptions: Record<string, unknown>;
  Data: {
    Discriminator: string;
    Value: {
      FloorNumber: string;
      LocationNotes: string;
    };
  };
};

export const getRates = async (body: RequestPayload) => {
  if (!body) {
    throw new Error('Request body is missing');
  }
  console.log('Request body:', body);
  const {
    origin,
    clientToken,
    accessToken,
    client,
    enterpriseIds,
    resourceIds,
    createdUtc,
    updatedUtc,
    limit,
  } = body;
  // External API call to fetch rates
  const endpoint = `${origin}/api/connector/v1/rates/getAll`;

  const request = createHttpPostRequest('POST' as HttpMethod, endpoint, {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: client,
    Extent: {
      Resources: true,
      Inactive: false,
    },
  });

  // Add optional EnterpriseIds
  if (enterpriseIds !== undefined && enterpriseIds.length > 0) {
    request.body.EnterpriseIds = enterpriseIds;
  }
  if (resourceIds !== undefined && resourceIds.length > 0) {
    request.body.ResourceIds = resourceIds;
  }
  if (
    createdUtc !== undefined &&
    createdUtc.startUtc !== undefined &&
    createdUtc.endUtc !== undefined
  ) {
    request.body.CreatedUtc = {
      StartUtc: createdUtc.startUtc,
      EndUtc: createdUtc.endUtc,
    };
  }
  if (
    updatedUtc !== undefined &&
    updatedUtc.startUtc !== undefined &&
    updatedUtc.endUtc !== undefined
  ) {
    request.body.UpdatedUtc = {
      StartUtc: updatedUtc.startUtc,
      EndUtc: updatedUtc.endUtc,
    };
  }

  if (limit?.count !== undefined) {
    request.body.Limitation.Count = limit.count;
  }

  if (limit?.cursor !== undefined) {
    request.body.Limitation.Cursor = limit.cursor;
  }

  try {
    const response = await httpClient.sendRequest<{ Resources: Resources[]  }>(request);

    if (!response?.body?.Resources) {
      throw new Error('Failed to fetch resources or no resources found');
    }

    return response.body.Resources;
  } catch (error: any) {
    console.error('Error during resources fetch:', error);
    throw new Error(`Resources fetch failed: ${error.message}`);
  }
};
