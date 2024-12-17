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
  serviceIds?: string[];
  updatedUtc?: {
    startUtc?: string; // ISO 8601 format date string
    endUtc?: string; // ISO 8601 format date string
  };
  limit?:{
    count: number;
    cursor: string;
  }
}

export interface Service {
  Id: string; // UUID string for the service ID
  EnterpriseId: string; // UUID string for the enterprise ID
  CreatedUtc: string; // ISO 8601 formatted string for creation time
  UpdatedUtc: string; // ISO 8601 formatted string for last update time
  IsActive: boolean; // Indicates whether the service is active
  Name: string; // Name of the service
  Options: {
    BillAsPackage: boolean; // Indicates if the service is billed as a package
  };
  Data: {
    Discriminator: string; // Used to distinguish data types
    Value: {
      Promotions: {
        BeforeCheckIn: boolean; // Promotion before check-in
        AfterCheckIn: boolean; // Promotion after check-in
        DuringStay: boolean; // Promotion during the stay
        BeforeCheckOut: boolean; // Promotion before check-out
        AfterCheckOut: boolean; // Promotion after check-out
        DuringCheckOut: boolean; // Promotion during check-out
      };
    };
  };
  ExternalIdentifier: string; // External identifier for the service
}


export const getServices = async (body: RequestPayload) => {
  if (!body) {
    throw new Error('Request body is missing');
  }
  // console.log('Request body GetServices:', JSON.stringify(body));
  const {
    origin,
    clientToken,
    accessToken,
    client,
    enterpriseIds,
    serviceIds,
    updatedUtc,
    limit,
  } = body;

  // External API call to fetch rates
  const endpoint = `${origin}/api/connector/v1/services/getAll`;

  const request = createHttpPostRequest('POST' as HttpMethod, endpoint, {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: client,
  });

  if(serviceIds  && serviceIds.length > 0) {
    request.body.ServiceIds = serviceIds;
  }

  // Add optional EnterpriseIds
  if (enterpriseIds  && enterpriseIds.length > 0) {
    request.body.EnterpriseIds = enterpriseIds;
  }

  // if(updatedUtc ) {
  //   request.body.UpdatedUtc = {
  //     StartUtc: updatedUtc.startUtc,
  //     EndUtc: updatedUtc.endUtc,
  //   };
  // }

  if(limit  && limit?.count  && limit?.cursor ) {
    request.body.Limit = {
      Count: limit.count,
      Cursor: limit.cursor,
    };
  }

  try {
    // console.log('services', JSON.stringify(request))

    const response = await httpClient.sendRequest<{ Services: Service[] }>(
      request
    );
    // console.log('services', response, request)

    if (!response?.body?.Services) {
      throw new Error('Failed to fetch services');
    }


    return response.body.Services;
  } catch (error: any) {
    console.error('Error during services fetch:', error);
    throw new Error(`services fetch failed: ${error.message}`);
  }
};
