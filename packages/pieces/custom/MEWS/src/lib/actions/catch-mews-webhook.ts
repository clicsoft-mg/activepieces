import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';

export const catchMewsWebhook = createAction({
  name: 'catchMewsWebhook',
  displayName: 'Catch Mews Webhook',
  description: 'Triggers when mews send any updates through webhooks',

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
    interface HttpRequest {
      method: HttpMethod;
      url: string;
      timeout: number;
      body: Record<string, any>;
    }
    interface PersonCounts {
      AgeCategoryId: string;
      Count: number;
    }

    interface Reservation {
      CancellationReason: any;
      ScheduledEndUtc: any;
      ScheduledStartUtc: any;
      GroupId: any;
      ServiceId: any;
      BookerId: string;
      Purpose: any;
      Origin: any;
      CancelledUtc: any;
      UpdatedUtc: any;
      CreatedUtc: any;
      EndUtc: any;
      StartUtc: any;
      RateId: any;
      PersonCounts: PersonCounts[];
      Id: any;
      RequestedResourceCategoryName: any;
      AssignedResourceName: any;
      OrderItems: any;
      RequestedResourceCategoryId: string;
      AccountId: string;
      AssignedResourceId: string;
    }

    interface Customer {
      Id: string;
    }

    interface ResourceCategory {
      Id: string;
    }
    interface Config {
      Id: string;
    }

    interface Resource {
      Id: string;
    }

    interface AgeCategories {
      Classification: any;
      Id: string;
    }

    interface RatesObj {
      Id: string;
      Name: string;
    }
    interface AccountingCategories {
      Id: string;
      Name: string;
    }
    interface RatesRes {
      Rates: RatesObj[];
    }

    interface OrderItem {
      Amount: any;
      CanceledUtc: any;
      UpdatedUtc: any;
      CreatedUtc: any;
      ConsumedUtc: any;
      AccountingCategoryId: string;
      ServiceOrderId: any;
      Id: string;
      BillingName: string;
      Type: string;
      UnitCount: string;
    }

    const { body } = context.propsValue;

    if (!body) return;

    const data = body['data'];
    const origin = `https://api.mews-demo.com/api/`;

    const endpoints = {
      reservations: `${origin}connector/v1/reservations/getAll/2023-06-06`,
      orderItems: `${origin}connector/v1/orderItems/getAll`,
      resourceCategoryAssignments: `${origin}connector/v1/resourceCategoryAssignments/getAll`,
      customers: `${origin}connector/v1/customers/getAll`,
      services: `${origin}connector/v1/services/getAll`,
      resourceCategories: `${origin}connector/v1/resourceCategories/getAll`,
      resources: `${origin}connector/v1/resources/getAll`,
      ageCategories: `${origin}connector/v1/ageCategories/getAll`,
      getPricing: `${origin}connector/v1/rates/getPricing`,
      getRates: `${origin}connector/v1/rates/getAll`,
      getConf: `${origin}connector/v1/configuration/get`,
      getAccountingCategories: `${origin}connector/v1/accountingCategories/getAll`,
    };

    // const ClientToken =
    //   '9381AB282F844CD9A2F4AD200158E7BC-D27113FA792B0855F87D0F93E9E1D71';
    // const AccessToken =
    //   'B811B453B8144A73B80CAD6E00805D62-B7899D9C0F3C579C86621146C4C74A2';
    const AccessToken =
      'CC150C355D6A4048A220AD20015483AB-B6D09C0C84B09538077CB8FFBB907B4';
    const ClientToken =
      'E916C341431C4D28A866AD200152DBD3-A046EB5583FFBE94DE1172237763712';
    const Client = 'Clicsoft';
    const createHttpPostRequest = (
      url: string,
      additionalBody: Record<string, any> = {}
    ): HttpRequest => ({
      method: 'POST' as HttpMethod,
      url,
      timeout: 5000,
      body: {
        ClientToken,
        AccessToken,
        Client,
        Limitation: {
          Cursor: null,
          Count: 999,
        },
        ...additionalBody,
      },
    });
    const reserveIds = data['Events']
      .filter((event: any) => event['Discriminator'] === 'ServiceOrderUpdated')
      .map((event: any) => event['Value']['Id']);
    if (!reserveIds || reserveIds.length === 0) {
      throw new Error('no res id found');
    }
    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    const requests = {
      reservations: createHttpPostRequest(endpoints.reservations, {
        ReservationIds: reserveIds,
      }),
      resources: createHttpPostRequest(endpoints.resources, {
        Extent: { Resources: true },
      }),
      orderItems: createHttpPostRequest(endpoints.orderItems, {
        ServiceOrderIds: reserveIds,
      }),
      resourceCategoryAssignments: createHttpPostRequest(
        endpoints.resourceCategoryAssignments
      ),
      customers: createHttpPostRequest(endpoints.customers),
      services: createHttpPostRequest(endpoints.services),
      resourceCategories: createHttpPostRequest(endpoints.resourceCategories),
      ageCategories: createHttpPostRequest(endpoints.ageCategories),
      getPricing: createHttpPostRequest(endpoints.getPricing),
      getRates: createHttpPostRequest(endpoints.getRates),
      getConf: createHttpPostRequest(endpoints.getConf),
      getAccountingCategories: createHttpPostRequest(
        endpoints.getAccountingCategories
      ),
    };
    const booker = '53c2c307-2004-4f04-b696-b21e00c0b07e';
    const responses: any = {};
    try {
      responses['reservationsRes'] = await httpClient.sendRequest<{
        Reservations: Reservation[];
      }>(requests.reservations);
      if (!responses?.['reservationsRes']?.body?.Reservations) {
        throw new Error(`reservations data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch reservations ${JSON.stringify(error)}`);
    }
    const reservations = responses['reservationsRes'].body.Reservations || [];
    let run = false;
    const requestedResourceCategoryIds = new Set<string>();

    const accountIds = new Set<string>();
    const serviceIds = new Set<string>();
    const resourcesIds = new Set<string>();
    const ageIds = new Set<string>();
    const rateIds = new Set<string>();
    reservations.forEach((reservation: Reservation) => {
      if (reservation?.BookerId === booker) {
        run = true;
        requestedResourceCategoryIds.add(
          reservation.RequestedResourceCategoryId
        );
        if (reservation?.AccountId) accountIds.add(reservation.AccountId);
        if (reservation?.AssignedResourceId)
          resourcesIds.add(reservation.AssignedResourceId);
        if (reservation?.PersonCounts) {
          const pc = reservation.PersonCounts;
          pc.forEach((p: any) => {
            ageIds.add(p.AgeCategoryId);
          });
        }
        if (reservation?.RateId) rateIds.add(reservation.RateId);
        if (reservation?.ServiceId) serviceIds.add(reservation.ServiceId);
      }
    });
    if (!run) {
      throw new Error(`invalid user`);
    }
    try {
      responses['orderItemsRes'] = await httpClient.sendRequest<{
        OrderItems: OrderItem[];
      }>(requests.orderItems);
      if (!responses?.['orderItemsRes']?.body?.OrderItems) {
        throw new Error(`orderItemsRes data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch orderItemsRes ${JSON.stringify(error)}`);
    }
    const orderItems = responses['orderItemsRes'].body.OrderItems || [];
    await sleep(1000);
    try {
      responses['configRes'] = await httpClient.sendRequest<{
        Enterprise: Config;
      }>(requests.getConf);
      if (!responses?.['configRes']?.body?.Enterprise) {
        throw new Error(`configRes data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch configRes ${JSON.stringify(error)}`);
    }
    const config = responses['configRes'].body.Enterprise || {};
    try {
      requests.customers.body['CustomerIds'] = Array.from(accountIds);
      responses['customersRes'] = await httpClient.sendRequest<{
        Customers: Customer[];
      }>(requests.customers);
      if (!responses?.['customersRes']?.body?.Customers) {
        throw new Error(`customersRes data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch customers ${JSON.stringify(error)}`);
    }

    const customers = responses['customersRes'].body.Customers || [];

    await sleep(1000);
    try {
      requests.resourceCategories.body['ServiceIds'] = Array.from(serviceIds);
      requests.resourceCategories.body['ResourceCategoryIds'] = Array.from(
        requestedResourceCategoryIds
      );
      responses['resourceCategoriesRes'] = await httpClient.sendRequest<{
        ResourceCategories: ResourceCategory[];
      }>(requests.resourceCategories);
      if (!responses?.['resourceCategoriesRes']?.body?.ResourceCategories) {
        throw new Error(`resourceCategoriesRes data not found`);
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch resourceCategories ${JSON.stringify(error)}`
      );
    }
    const resourceCategories =
      responses['resourceCategoriesRes'].body.ResourceCategories || [];
    await sleep(1000);
    const rIds = Array.from(resourcesIds);
    if (rIds.length) {
      try {
        requests.resources.body['ResourceIds'] = rIds;
        responses['resourcesRes'] = await httpClient.sendRequest<{
          Resources: Resource[];
        }>(requests.resources);
        if (!responses?.['resourcesRes']?.body?.Resources) {
          throw new Error(`resourcesRes data not found`);
        }
      } catch (error) {
        throw new Error(`Failed to fetch resources ${JSON.stringify(error)}`);
      }
    }
    const resources = responses?.['resourcesRes']
      ? responses['resourcesRes'].body.Resources
      : [];

    try {
      requests.ageCategories.body['AgeCategoryIds'] = Array.from(ageIds);

      responses['ageCategoriesRes'] = await httpClient.sendRequest<{
        AgeCategories: AgeCategories[];
      }>(requests.ageCategories);
      if (!responses?.['ageCategoriesRes']?.body?.AgeCategories) {
        throw new Error(`ageCategoriesRes data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch ageCategories ${JSON.stringify(error)}`);
    }
    const ageCategories =
      responses['ageCategoriesRes'].body.AgeCategories || [];

    try {
      requests.getRates.body['RateIds'] = Array.from(rateIds);
      requests.getRates.body['ServiceIds'] = Array.from(serviceIds);
      responses['ratesRes'] = await httpClient.sendRequest<{
        Rates: RatesObj[];
      }>(requests.getRates);
      if (!responses?.['ratesRes']?.body?.Rates) {
        throw new Error(`ratesRes data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch ratesRes ${JSON.stringify(error)}`);
    }
    const rates = responses['ratesRes'].body.Rates || [];
    const customersObj: any = {};
    const resourceCategoriesObj: any = {};
    const resourcesObj: any = {};
    const orderItemsObj: any = {};
    const ageCategoriesObj: any = {};
    const ratesObj: any = {};
    customers.forEach((cus: Customer) => {
      Object.assign(customersObj, { [cus.Id]: cus });
    });
    const gimmyObj: any = {
      nb_infants: 0,
      nb_children: 0,
      nb_adults: 0,
      pms_id: config?.Id,
      cm_id: null,
      ota_id: null,
    };
    rates.forEach((r: RatesObj) => {
      Object.assign(ratesObj, { [r.Id]: r });
    });
    resourceCategories.forEach((rc: ResourceCategory) => {
      Object.assign(resourceCategoriesObj, { [rc.Id]: rc });
    });
    resources.forEach((r: Resource) => {
      Object.assign(resourcesObj, { [r.Id]: r });
    });
    ageCategories.forEach((r: AgeCategories) => {
      Object.assign(ageCategoriesObj, { [r.Id]: r });
    });
    const accountingCatIds = new Set<string>();

    orderItems.forEach((o: OrderItem) => {
      const id: string = o?.ServiceOrderId;
      if (id) {
        if (orderItemsObj?.[id]) {
          orderItemsObj[id].push(o);
        } else {
          Object.assign(orderItemsObj, { [id]: [o] });
        }
      }
      if (o?.AccountingCategoryId) accountingCatIds.add(o.AccountingCategoryId);
    });
    const acArr = Array.from(accountingCatIds);
    if (acArr.length) {
      try {
        requests.getAccountingCategories.body['AccountingCategoryIds'] = acArr;
        responses['accountingCatRes'] = await httpClient.sendRequest<{
          AccountingCategories: AccountingCategories[];
        }>(requests.getAccountingCategories);
        if (!responses?.['accountingCatRes']?.body?.AccountingCategories) {
          throw new Error(`accountingCategories data not found`);
        }
      } catch (error) {
        throw new Error(
          `Failed to fetch accountingCategories ${JSON.stringify(error)}`
        );
      }
    }
    const accountingCatObj: any = {};
    const accountingCategories = responses?.['accountingCatRes']
      ? responses['accountingCatRes'].body.AccountingCategories
      : [];
    if (accountingCategories.length) {
      accountingCategories.forEach((ac: AccountingCategories) => {
        Object.assign(accountingCatObj, {
          [ac.Id]: ac,
        });
      });
    }
    const resArr: any = [];
    try {
      reservations.forEach((res: Reservation) => {
        const cust = customersObj[res.AccountId];
        const sales: any = [];
        orderItemsObj[res.Id].forEach((itm: OrderItem) => {
          const ac = accountingCatObj[itm.AccountingCategoryId];
          //ACCOMODATION / EXTRA / TOURIST_TAX / OTHER
          let type = 'OTHER';
          if (itm.Type === 'SpaceOrder') type = 'ACCOMODATION';
          else if (itm.Type === 'CityTax') type = 'TOURIST_TAX';
          sales.push({
            pms_id: itm.Id,
            type,
            label: itm?.BillingName || '',
            quantity: itm.UnitCount,
            category_label: ac?.Name ? ac.Name : '',
            category_id: ac?.Id ? ac.Id : '',
            product_label: '',
            product_id: '',
            is_offered: false,
            amount_incl: itm.Amount.GrossValue,
            amount_excl: itm.Amount.NetValue,
            currency: itm.Amount.Currency,
            consumed_at: itm.ConsumedUtc,
            created_at: itm.CreatedUtc,
            updated_at: itm.UpdatedUtc,
            canceled_at: itm.CanceledUtc,
          });
        });
        Object.assign(gimmyObj, {
          booking_group_pms_id: res?.GroupId,
          date_from: res.ScheduledStartUtc,
          date_to: res.ScheduledEndUtc,
          created_at: res.CreatedUtc,
          updated_at: res.UpdatedUtc,
          canceled_at: res?.CancelledUtc,
          no_show_at:
            res?.CancellationReason === 'NoShow' ? res?.CancelledUtc : null,
          booking_source: 'Option',
          booking_origin: res.Origin,
          booking_reason: res?.Purpose || '',
          room_id: res?.AssignedResourceId || '',
          room_label: res?.AssignedResourceId
            ? resourcesObj[res.AssignedResourceId].Name
            : '',
          room_type_id: res.RequestedResourceCategoryId,
          room_type_label:
            resourceCategoriesObj[res.RequestedResourceCategoryId]
              .Classification || 'Room',
          rate_id: res.RateId,
          rate_label: ratesObj[res.RateId].Name,
          customer: {
            pms_id: res.AccountId,
            type: cust?.CompanyId ? 'COMPANY' : 'PERSON',
            firstname: cust?.FirstName || '',
            lastname: cust.LastName,
            email: cust?.Email || '',
            phone: cust?.Phone || '',
            mobile: '',
            street_address: cust?.Address?.Line1 || '',
            postcode: cust?.Address?.PostalCode || '',
            city: cust?.Address?.City || '',
            country: cust?.Address?.CountryCode || '',
            travel_card: null,
            birth_date: cust?.BirthDateUtc || '',
            company: cust?.CompanyId || '',
            siren: '',
            siret: cust?.TaxIdentificationNumber || '', //TaxIdentifier
            civility: cust?.Title || 'M.',
            nationality: cust?.NationalityCode || 'FR',
            language: cust?.LanguageCode
              ? cust.LanguageCode.split('-')[1]
              : 'fr',
            customer_group: '',
            customer_category: '',
            customer_origin: '',
          },
          sales,
        });
        res.AccountId = customersObj[res.AccountId];
        res.RequestedResourceCategoryName =
          resourceCategoriesObj[res.RequestedResourceCategoryId] || '';
        res.AssignedResourceName = resourcesObj[res.AssignedResourceId] || '';
        res.OrderItems = orderItemsObj?.[res.Id];

        res.PersonCounts.forEach((pc: PersonCounts) => {
          const ageCat: AgeCategories = ageCategoriesObj[pc.AgeCategoryId];
          if (ageCat) {
            if (ageCat.Classification === 'Adult') {
              Object.assign(gimmyObj, { nb_adults: pc.Count });
            } else if (ageCat.Classification === 'Child') {
              Object.assign(gimmyObj, { nb_children: pc.Count });
            }
          }
        });
        resArr.push(gimmyObj);
      });
    } catch (error) {
      return { error };
    }
    console.log(resArr); 
    return {
      data: resArr,
      success: "false1"
    };
    // } catch (error) {
    //   console.error('Error running fetch competitor rates action:', error);
    //   return { error, data }; 
    // }
  },
});
