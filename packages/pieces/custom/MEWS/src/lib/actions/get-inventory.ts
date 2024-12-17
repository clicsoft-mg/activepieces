import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import {
  MewsBody,
  MewsRequest,
  ResourceCategories,
  ResourceCategoryAssignments,
  Resources,
  Service,
} from '../common/types';
import { decode, delay } from '../common/common';
import { getServices } from '../common/apis/get-services';
import { getResourceCategories } from '../common/apis/get-resource-categories';
import { getRates } from '../common/apis/get-rates';
import { getPricing, PriceResponse } from '../common/apis/get-pricing';
import { start } from 'node:repl';
import { getAvailability } from '../common/apis/get-availability';
import { it } from 'node:test';

export const getInventory = createAction({
  name: 'getInventory',
  displayName: 'Fetch Inventory',
  description: 'Fetch Hotel Inventory',

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
      throw new Error('Missing required data, req body');
    }
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
      throw new Error('Missing required data, creds');
    }
    const { accessToken, clientToken, client } = creds;
    const reqPayload = {
      origin: data.url,
      clientToken,
      accessToken,
      client,
    };

    const responses: any = {};
    let serviceIds: string[] = [];
    try {
      responses['services'] = await getServices({
        ...reqPayload,
        enterpriseIds: data?.enterpriseIds || null,
        updatedUtc:
          data?.startUtc && data?.endUtc
            ? {
                startUtc: data.startUtc,
                endUtc: data.endUtc,
              }
            : {},
      });
      // console.log('services===========',responses);
      if (!responses?.['services']?.length) {
        throw new Error(`services data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch services ${JSON.stringify(error)}`);
    }
    responses?.['services'].forEach((item: Service) => {
      if (item.IsActive) {
        serviceIds.push(item.Id);
      }
    });
    const availabilityRes: any = {};

    for (const serviceId of serviceIds) {
    }

    const resourceTypes: any = [];

    try {
      responses['resourceCategories'] = await getResourceCategories({
        ...reqPayload,
        enterpriseIds: data?.enterpriseIds || [],
        serviceIds,
        resourceCategoryIds: data?.resourceCategoryIds || [],
        status: data?.status || ['Active'],
      });
      if (!responses?.['resourceCategories']?.length) {
        throw new Error(`resourceCategories data not found`);
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch resource Categories ${JSON.stringify(error)}`
      );
    }

    const serArr: string[] = [];

    const resourceCategories = responses?.['resourceCategories'];
    for (const resourceCategory of resourceCategories) {
      const dt = {
        resourceCode: resourceCategory.Id,
        resourceLabel: resourceCategory.Names['en-US'],
        serviceId: resourceCategory.ServiceId,
        minOccupancy: 1,
        maxOccupancy: resourceCategory.Capacity,
      };
      try {
        const serviceId = resourceCategory.ServiceId;
        let aData;
        if (availabilityRes?.[serviceId]) {
          aData = availabilityRes[serviceId];
        } else {
          const av = await getAvailability({
            ...reqPayload,
            serviceId,
            startUtc: data?.startUtc,
            endUtc: data?.endUtc,
          });
          console.log('av getAvailability', Object.keys(av));
          if (av && av.CategoryAvailabilities) {
            console.log(
              'av CategoryAvailabilities',
              av.CategoryAvailabilities[0]
            );
            const avObj: any = {};
            av.CategoryAvailabilities.forEach((ca: any) => {
              // avObj[ca.CategoryId] = {
              //   availability: ca.Availabilities,
              //   adjustments: ca.Adjustments,
              // };
              Object.assign(avObj, {
                [ca.CategoryId]: {
                  availability: ca.Availabilities,
                  adjustments: ca.Adjustments
                },
              });
            });
            aData = {av:avObj, dates: av.TimeUnitStartsUtc};
            availabilityRes[serviceId] = avObj;

            Object.assign(availabilityRes, {
              [serviceId]: aData,
            });
          }
        }
        if (aData && aData?.av?.[resourceCategory.Id]) {
          //   Object.assign(dt, {
          //     rates: [
          //       {
          //         rateCode: '',
          //         dates: aData.TimeUnitStartsUtc,
          //         numberOfRooms:
          //           availabilityRes[serviceId][resourceCategory.Id].availability,
          //         numberOfAdjustments:
          //           availabilityRes[serviceId][resourceCategory.Id].adjustments,
          //         closed: Array(aData.length - 1).fill(0),
          //         minLOS: Array(aData.length - 1).fill(1),
          //       },
          //     ],
          //   });
          console.log(dt, aData)
          Object.assign(dt, {
            dates: aData.dates,
            numberOfRooms:
              aData.av[resourceCategory.Id].availability,
            numberOfAdjustments:
              aData.av[resourceCategory.Id].adjustments,
            closed: Array(aData.dates.length - 1).fill(0),
            minLOS: Array(aData.dates.length - 1).fill(1),
          });
          resourceTypes.push(dt); 
        }
        delay(500);
      } catch (error) {
        throw new Error(
          `Failed to fetch availability ${JSON.stringify(error)}`
        );
      }
    }

    try {
      responses['rates'] = await getRates({
        ...reqPayload,
        enterpriseIds: data?.enterpriseIds || [],
        serviceIds,
        rateIds: data?.rateIds || [],
        status: data?.status || ['Active'],
      });
      if (!responses?.['rates']?.length) {
        throw new Error(`rates data not found`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch rates ${JSON.stringify(error)}`);
    }

    const rates = responses?.['rates'];
    const pricingRes: any = {};
    let master: any = [];
    let i = 0;
    for (const rate of rates) {
      if (1 < 5 && rate?.IsActive && rate?.IsEnabled && rate?.IsPublic) {
        i++;
        const rateId = rate.Id;
        // master.push({
        //   code: rate.Id,
        //   servceId: rate.ServiceId,
        //   name: rate.Name,
        //   shortName:rate.ShortName
        // });
        const rates: PriceResponse = await getPricing({
          ...reqPayload,
          rateId,
          startDate: data?.startUtc,
          endDate: data?.endUtc,
        });
        const amtObj: any = {};
        rates.CategoryPrices.forEach((item: any) => {
          const nett: string[] = [];
          const gross: string[] = [];
          item.AmountPrices.forEach((aItem: any) => {
            nett.push(aItem.NetValue);
            gross.push(aItem.GrossValue);
          });
          // Object.assign(amtObj, {
          //   cat: item.CategoryId,
          //   nett,
          //   gross
          // });
          if(nett.length > 0) {
            master.push({
              code: rate.Id,
              servceId: rate.ServiceId,
              categoryId: item.CategoryId,
              name: rate.Name,
              shortName: rate.ShortName,
              currency:rates.Currency,
              // dates: rates.TimeUnitStartsUtc,
              rates: {
                netAmount: nett,
                grossAmount: gross,
                // amtObj
              }
            });
          }
        });
      }

      delay(500);
    }
    const r: any = {};
    master.forEach((item: any) => {
      if (r?.[item.categoryId]) {
        r[item.categoryId].push({
          priceName: item.name,
          priceShortName: item.shortName,
          currency: item.currency,
          amountBeforeTax: item.rates.netAmount,
          amountAfterTax: item.rates.grossAmount,
        });
      } else {
        Object.assign(r, { [item.categoryId]: [item] });
        // r[item.categoryId] = [item];
      }
    });
    const retObj: any = [];
    resourceTypes.forEach((rt: any) => {
      if (r?.[rt.resourceCode]) {
        retObj.push({
          ...rt,
          rates: r[rt.resourceCode],
        });
      }
    });
    return retObj;
  },
});
