/**
 * Podgląd koszyka wymiany surowców (screenshot UX D-DYPLO-KOSZYK-UX).
 */
import { showTradeBasketModal } from '../src/ui/diplomacyTradeBasket';
import type { AudienceAction } from '../src/ui/diplomacyAudience';
import type { NegotiationModalContext } from '../src/ui/diplomacyNegotiationModal';

const action: AudienceAction = {
  id: '14',
  label: 'Wymiana surowców',
  enabled: true,
};

const ctx: NegotiationModalContext = {
  civName: 'Sparta',
  relacjaTotal: 120,
  progHandelRelacja: 100,
  progDarRelacja: 80,
  difficulty: 'normal',
  tempoGry: 'standardowa',
  cityOptions: [
    { id: 'city-athens', label: 'Ateny' },
    { id: 'city-corinth', label: 'Korynt' },
  ],
  giveQuantityResourceOptions: [
    { id: 'drewno', label: 'Drewno ×36 (pakiet)', maxPakiety: 12 },
    { id: 'kamien', label: 'Kamień ×36 (pakiet)', maxPakiety: 8 },
    { id: 'glina', label: 'Glina ×36 (pakiet)', maxPakiety: 6 },
    { id: 'cegla', label: 'Cegła ×36 (pakiet)', maxPakiety: 4 },
  ],
  receiveQuantityResourceOptions: [
    { id: 'drewno', label: 'Drewno ×36 (pakiet)', maxPakiety: 10 },
    { id: 'ruda', label: 'Ruda ×36 (pakiet)', maxPakiety: 5 },
    { id: 'braz', label: 'Brąz ×36 (pakiet)', maxPakiety: 3 },
  ],
  techOptions: [
    { id: 'Obróbka kamienia', label: 'Obróbka kamienia', suggestedPrice: 80 },
    { id: 'Rolnictwo', label: 'Rolnictwo', suggestedPrice: 60 },
  ],
  playerSkarbiec: 500,
  trustPnGainedThisTurn: 0,
};

export function mountTradeBasketPreview(): void {
  showTradeBasketModal(
    'trade',
    action,
    ctx,
    () => { /* preview — bez submit */ },
    () => { /* preview — bez cancel */ },
    {
      giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 50 }],
      receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 2 }],
      resourceTradeMode: 'per_turn',
      turns: 10,
    },
  );
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => mountTradeBasketPreview());
}
