import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { catchMewsWebhook } from './lib/actions/catch-mews-webhook';
import { getResources } from './lib/actions/get-resources';
import { getRates } from './lib/actions/get-rateplan';
import { getProducts } from './lib/actions/get-products';
import { getResourceBlocks } from './lib/actions/get-resource-blocks';
import { getHotelConfig } from './lib/actions/get-hotel-config';
import { createContact } from './lib/actions/create-contact';
import { addPayment } from './lib/actions/add-payment';
import { createCompany } from './lib/actions/create-company';
import { deleteCompany } from './lib/actions/delete-company';
import { updateCompany } from './lib/actions/update-company';
import { getInventory } from './lib/actions/get-inventory';

export const MEWS = createPiece({
  displayName: 'MEWS',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl:
    'https://cdn.mews-demo.com/media/image/c78f414c-a653-4e3c-9cfb-b051008e0ba6?mode=5&width=48&height=48',
  authors: [],
  actions: [
    getInventory
  ],
  triggers: [],
});
