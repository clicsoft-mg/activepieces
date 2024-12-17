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
  enterpriseIds?: string[];
  serviceIds: string[];
  rateIds?: string[];
  updatedUtc?: {
    startUtc?: string; // ISO 8601 format date string
    endUtc?: string; // ISO 8601 format date string
  };
  status?: string[];
  extent?: {
    rates: boolean;
    rateGroups: boolean;
    availabilityBlockAssignments: boolean;
  };
}

export interface Rates  {
  BaseRateId: string | null;
  BusinessSegmentId: string | null;
  GroupId: string;
  Id: string;
  ServiceId: string;
  IsActive: boolean;
  IsEnabled: boolean;
  IsPublic: boolean;
  Name: string;
  ShortName: string;
  ExternalNames: Record<string, string>; // Supports keys like "en-US" with string values
  ExternalIdentifier: string;
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
    serviceIds,
    rateIds,
    status,
    extent,
  } = body;

  // Add optional ServiceIds
  if (!serviceIds || serviceIds.length === 0) {
    throw new Error('ServiceIds are required');
  }
  // External API call to fetch rates
  const endpoint = `${origin}/api/connector/v1/rates/getAll`;

  const request = createHttpPostRequest('POST' as HttpMethod, endpoint, {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: client,
    ServiceIds: serviceIds,
    Extent: {
      Rates: true,
    },
  });

  // Add optional EnterpriseIds
  if (enterpriseIds !== undefined && enterpriseIds.length > 0) {
    request.body.EnterpriseIds = enterpriseIds;
  }

  // Add optional RateIds
  if (rateIds !== undefined && rateIds.length > 0) {
    request.body.RateIds = rateIds;
  }
  if (status && status.length > 0) {
    request.body.ActivityStates = status;
  } 
  if(extent !== undefined) {
    request.body.Extent = {
        Rates: extent.rates,
        AvailabilityBlockAssignments: extent.availabilityBlockAssignments,
    };
  }

  try {
    const response = await httpClient.sendRequest<{ Rates: Rates[] }>(request);

    if (!response?.body?.Rates) {
      throw new Error('Failed to fetch rates or no rates found');
    }

    return response.body.Rates;
  } catch (error: any) {
    console.error('Error during rate retrieval or saving:', error);
    throw new Error(`Rate retrieval failed: ${error.message}`);
  }
};
