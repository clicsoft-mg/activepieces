import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createHttpPostRequest } from '../common';

 interface RequestPayload {
  origin: string;
  clientToken: string;
  accessToken: string;
  client: string;
  rateId: string;
  startDate: string;
  endDate: string;
  productId?: string;
}

export const getPricing = async (body: RequestPayload) => {
  if (!body) {
    throw new Error('Request body is missing');
  }
  console.log('Request body:', body);
  const {
    origin,
    clientToken,
    accessToken,
    client,
    rateId,
    startDate,
    endDate,
    productId
  } = body;

  // External API call to fetch rates
  const endpoint = `${origin}/api/connector/v1/rates/getPricing`;

  const request = createHttpPostRequest('POST' as HttpMethod, endpoint, {
    ClientToken: clientToken,
    AccessToken: accessToken,
    Client: client,
    RateId: rateId,
    StartUtc: startDate,
    EndUtc: endDate,
  });

  if(productId !== undefined) {
    request.body.ProductId = productId;
  }

  try {
    const response = await httpClient.sendRequest<any>(request);

    if (!response?.body) {
      throw new Error('Failed to fetch pricing or no pricing found');
    }

    return response.body;
  } catch (error: any) {
    console.error('Error during pricing retrieval:', error);
    throw new Error(`Pricing retrieval failed: ${error.message}`);
  }
};
export interface TaxValue {
  Code: string;
  Value: number;
}

export interface BreakdownItem {
  TaxRateCode: string;
  NetValue: number;
  TaxValue: number;
}

export interface Breakdown {
  Items: BreakdownItem[];
}

export interface AmountPrice {
  Currency: string;
  NetValue: number;
  GrossValue: number;
  TaxValues: TaxValue[];
  Breakdown: Breakdown;
}

export interface BaseAmountPrice extends AmountPrice {}

export interface CategoryAdjustment {
  AbsoluteValue: number;
  CategoryId: string;
  ParentCategoryId: string | null;
  RelativeValue: number;
}

export interface CategoryPrice {
  CategoryId: string;
  AmountPrices: AmountPrice[];
}

export interface PriceResponse {
  Currency: string;
  BaseAmountPrices: BaseAmountPrice[];
  CategoryAdjustments: CategoryAdjustment[];
  CategoryPrices: CategoryPrice[];
  TimeUnitStartsUtc: string[]; // ISO 8601 date strings
}

