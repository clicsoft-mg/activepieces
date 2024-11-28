import { CUSTOM_FIELD_TYPE } from './constants';

export type LightHouseRequest = {
  credentials: {
    accessToken: string; // 'B811B453B8144A73B80CAD6E00805D62-B7899D9C0F3C579C86621146C4C74A2';
    clientToken: string; // '9381AB282F844CD9A2F4AD200158E7BC-D27113FA792B0855F87D0F93E9E1D71';
    client: string; // 'Clicsoft'
  };
  url: string;
};

export type LightHouseBody = {
  serviceIds?: string[];
  rateIds?: string[];
  productIds?: string[];
  accountingCategoryIds?: string[];
};

