import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createHttpPostRequest } from '../common';

export interface GetAvailabilityRequestPayload {
  origin: string;
  clientToken: string;
  accessToken: string;
  client: string;
  serviceId: string;
  startUtc: string;
  endUtc: string;
}

export interface GetAvailabilityResponse {
  CategoryAvailabilities: {
    Availabilities: number[]; // Array of numbers indicating availabilities
    Adjustments: number[]; // Array of numbers indicating adjustments
    CategoryId: string; // UUID string for the category ID
  }[];
  TimeUnitStartsUtc: string[]; // Array of ISO 8601 date strings for time unit starts
}


export const getAvailability = async (body: GetAvailabilityRequestPayload) => {
  if (!body) {
    throw new Error('Request body is missing');
  }
  console.log('Request body:', body);
  const {
    origin,
    clientToken,
    accessToken,
    client,
    serviceId,
    startUtc,
    endUtc,
  } = body;

  // Validate required fields
  if (!serviceId ) {
    throw new Error('ServiceId is required');
  }

  const endpoint = `${origin}/api/connector/v1/services/getAvailability`;

  const request = createHttpPostRequest('POST' as HttpMethod, endpoint, {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: client,
    ServiceId: serviceId,
    StartUtc: startUtc,
    EndUtc: endUtc,
  });

  try {
    const response = await httpClient.sendRequest<GetAvailabilityResponse>(request);

    if (!response?.body) {
      throw new Error('Failed to fetch availability');
    }

    return response.body;
  } catch (error: any) {
    console.error('Error during availability fetch:', error);
    throw new Error(`Availability fetch failed: ${error}`);
  }
};
