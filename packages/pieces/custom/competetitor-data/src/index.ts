import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { fetchdata } from './lib/actions/fetchdata';

export const competetitorData = createPiece({
  displayName: 'Competetitor-data',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/competetitor-data.png',
  authors: [],
  actions: [fetchdata],
  triggers: [],
});
