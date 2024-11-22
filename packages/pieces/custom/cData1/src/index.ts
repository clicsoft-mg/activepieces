import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { caction1 } from './lib/actions/caction1';
import { decode } from './lib/actions/decode';
import { encode } from './lib/actions/encode';
import { modifyData } from './lib/actions/modifydata';
import { fetch } from './lib/actions/fetch';

export const cData1 = createPiece({
  displayName: 'Cdata1',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cData1.png',
  authors: [],
  actions: [caction1, decode, encode, modifyData, fetch],
  triggers: [],
});
