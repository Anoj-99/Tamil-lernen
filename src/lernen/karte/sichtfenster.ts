// Viewport-Culling: nur was (großzügig) im Bild ist, kommt ins DOM.
// So bleibt die Karte auch mit vielen hundert Leveln flüssig.
import { CULLING } from "./kartenKonfig";

export interface SichtBereich {
  vonY: number;
  bisY: number;
}

export function sichtbarerBereich(
  ty: number,
  s: number,
  fensterHoehe: number,
): SichtBereich {
  return {
    vonY: -ty / s - CULLING.rand,
    bisY: (fensterHoehe - ty) / s + CULLING.rand,
  };
}

export function imBild(y: number, bereich: SichtBereich): boolean {
  return y >= bereich.vonY && y <= bereich.bisY;
}
