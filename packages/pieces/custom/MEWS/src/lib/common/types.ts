import { CUSTOM_FIELD_TYPE } from './constants';

export type MewsRequest = {
  credentials: {
    accessToken: string; // 'B811B453B8144A73B80CAD6E00805D62-B7899D9C0F3C579C86621146C4C74A2';
    clientToken: string; // '9381AB282F844CD9A2F4AD200158E7BC-D27113FA792B0855F87D0F93E9E1D71';
    client: string; // 'Clicsoft'
  };
  url: string;
};

export type MewsBody = {
  serviceIds?: string[];
  rateIds?: string[];
  productIds?: string[];
  accountingCategoryIds?: string[];
};

export type Service = {
  Id: string;
  IsActive: boolean;
  Name: string;
};
export type Resources = {
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

export type Rates = {
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

export type ResourceCategories = {
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

export type Product = {
  Id: string;
  ServiceId: string;
  CreatedUtc: string; // ISO date format
  UpdatedUtc: string; // ISO date format
  CategoryId: string | null;
  AccountingCategoryId: string | null;
  IsActive: boolean;
  Names: Record<string, string>; // e.g., { "en-US": "Breakfast" }
  ExternalNames: Record<string, string>;
  ShortNames: Record<string, string>;
  Descriptions: Record<string, string>;
  ChargingMode: string; // Could be a union type if specific values are known
  PostingMode: string; // Could be a union type if specific values are known
  Options: {
    BillAsPackage: boolean;
  };
  Promotions: {
    BeforeCheckIn: boolean;
    AfterCheckIn: boolean;
    DuringStay: boolean;
    BeforeCheckOut: boolean;
    AfterCheckOut: boolean;
    DuringCheckOut: boolean;
  };
  Classifications: {
    Food: boolean;
    Beverage: boolean;
    Wellness: boolean;
    CityTax: boolean;
  };
  Price: {
    GrossValue: number;
    Currency: string;
    TaxValues: {
      Code: string;
      Value: number
    }[];
  };
  ExternalIdentifier: string;
}

export type AccountingCategories =  {
  Classification: string; // Could be a union type if predefined values exist (e.g., "Accommodation")
  EnterpriseId: string;
  Code: string;
  CostCenterCode: string;
  ExternalCode: string;
  Id: string;
  IsActive: boolean;
  LedgerAccountCode: string;
  Name: string;
  PostingAccountCode: string;
  CreatedUtc: string; // ISO date format
  UpdatedUtc: string; // ISO date format
}

export type ResourceCategoryAssignments = {
  Id: string; // UUID string for the ID
  ResourceId: string; // UUID string for the Resource ID
  CategoryId: string; // UUID string for the Category ID
  IsActive: boolean; // Boolean indicating if the resource category is active
  CreatedUtc: string; // ISO 8601 formatted date string for when the resource category was created
  UpdatedUtc: string; // ISO 8601 formatted date string for when the resource category was last updated
};

export type AccountCustomFieldsResponse = {
  id: string;
  fieldLabel: string;
  fieldType: CUSTOM_FIELD_TYPE;
  fieldOptions?: string[];
  fieldDefaultCurrency?: string;
  fieldDefault?: number | string | string[];
};

export type ContactCustomFieldsResponse = {
  fieldOptions: { field: string; value: string; label: string; id: string }[];
  fields: {
    id: string;
    title: string;
    type: CUSTOM_FIELD_TYPE;
    options: string[];
  }[];
};
