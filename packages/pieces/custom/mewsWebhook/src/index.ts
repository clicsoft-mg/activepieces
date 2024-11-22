import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { dataupdate } from './lib/actions/dataupdate';
import { gimmibookings } from './lib/actions/gimmibookings';
import { authAction } from './lib/actions/auth-action';

export const gimmyAuth = PieceAuth.CustomAuth({
  description: 'Enter authentication details',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'This is the Username you use to log into the server',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'This is the password you use to log into the server',
      required: true,
    }),
  },
  required: true,
});
export const mewsWebhook = createPiece({
  displayName: 'Mewswebhook',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mewsWebhook.png',
  authors: [],
  actions: [dataupdate, gimmibookings, authAction],
  triggers: [],
});
