
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { gimmyact } from "./lib/actions/gimmyact";
    
    export const gimmyC = createPiece({
      displayName: "Gimmy-c",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/gimmy-C.png",
      authors: [],
      actions: [gimmyact],
      triggers: [],
    });
    