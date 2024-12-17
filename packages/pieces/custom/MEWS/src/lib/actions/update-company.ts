import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { MewsBody, MewsRequest, Service } from '../common/types';
import { decode } from '../common/common';

export const updateCompany = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateCompany',
  displayName: 'Update Company',
  description: 'Update Company',

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
  

    const reqBody = body?.['data']?.['body'];
    console.log(JSON.stringify(reqBody));

    if (!reqBody) {
      throw new Error('Missing required data');
    }

    const decodedObject = await decode(reqBody.data);
    const mewsBody:MewsBody = reqBody.body
    const data: MewsRequest = decodedObject;
    const creds = data?.['credentials'];
    if (
      !data?.url ||
      !creds?.accessToken ||
      !creds?.clientToken ||
      !creds?.client
    ) {
      throw new Error('Missing required data1');
    }

    const apiKeysToBody : Record<string, any> = {
      // Required Parameters.
        clienttoken: 'clientToken',
        accesstoken: 'accessToken',
        client: 'client',
        chainid: 'chainId',
        companyid: 'companyId',
        name: 'Name',
        mothercompanyid: 'MotherCompanyId',
        invoicingemail: 'InvoicingEmail',
        websiteurl: 'WebsiteUrl',
        invoicedueinterval: 'InvoiceDueInterval',
        options: 'Options',
        creditrating: 'CreditRating',
        department: 'Department',
        dunsnumber: 'DunsNumber',
        referenceidentifier: 'ReferenceIdentifier',
        accountingcode: 'AccountingCode',
        additionaltaxidentifier: 'AdditionalTaxIdentifier',
        billingcode: 'BillingCode',
        contact: 'Contact',
        contactperson: 'ContactPerson',
        identifier: 'Identifier',
        iata: 'Iata',
        notes: 'Notes',
        taxidentifier: 'TaxIdentifier',
        telephone: 'Telephone',
        externalidentifier: 'ExternalIdentifier'      
    }
  

    const credentailsObject = Object.entries(creds).reduce<Record<string, any>>((acc,[key,val])=> {
      let mewsKey :string;
      if(Object.keys(apiKeysToBody).includes(key)){
        mewsKey = apiKeysToBody[key] || "";
      } else {
        mewsKey = key ;
      }
      acc[mewsKey] = val;
      return acc;
    }, {})


    const endpoint = `${data?.url}/api/connector/v1/companies/update`;
    const createHttpPostRequest = (
      url: string,
      body: Record<string, any> = {}
    ): HttpRequest => ({
      method: 'POST' as HttpMethod,
      url,
      timeout: 5000,
      body: {
        ...credentailsObject,
        ...body
      },
    });

    // console.log("endpoint".repeat(1000));
    const parsedBody = Object.entries(mewsBody).reduce<Record<string, any>>((acc,[key,val])=> {
      let mewsKey :string;
      if(Object.keys(apiKeysToBody).includes(key)){
        mewsKey = apiKeysToBody[key] || "";
      } else {
        mewsKey = key ;
      }
      acc[mewsKey] = val;
      return acc;
    }, {})

    console.log("parsedBody",JSON.stringify(parsedBody))

    try {
      const request = createHttpPostRequest(endpoint, parsedBody);
      return await httpClient.sendRequest<{
        Services: Service
      }>(request);
    } catch(err: any){
      //console.log("Error occured while adding payment",err);
      return err?.response;
    }
  }
});

// url: /api/connector/v1/payments/addAlternative