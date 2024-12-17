import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { dataDecode } from './lib/actions/data-decode';
import { dataEncode } from './lib/actions/data-encode';
import { dataModify } from './lib/actions/data-modify';
import { fetchhotelconfig } from './lib/actions/fetch-hotel-config';
import { fetchcompetitorrates } from './lib/actions/fetch-competitor-rates';

export const lighthouse = createPiece({
  displayName: 'Lighthouse',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/lighthouse.png',
  authors: [],
  actions: [
    dataDecode,
    dataEncode,
    dataModify,
    fetchhotelconfig,
    fetchcompetitorrates,
  ],
  triggers: [],
});
