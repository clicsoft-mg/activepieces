import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { catchMewsWebhook } from './lib/actions/catch-mews-webhook';
import { getResources } from './lib/actions/getResources';
import { getRates } from './lib/actions/getRatePlan';
import { getProducts } from './lib/actions/getProducts';
import { getResourceBlocks } from './lib/actions/get-resource-blocks';

export const MEWS = createPiece({
  displayName: 'MEWS',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl:
    'https://cdn.mews-demo.com/media/image/c78f414c-a653-4e3c-9cfb-b051008e0ba6?mode=5&width=48&height=48',
  authors: [],
  actions: [catchMewsWebhook, getResources, getRates, getProducts, getResourceBlocks],
  triggers: [],
});
