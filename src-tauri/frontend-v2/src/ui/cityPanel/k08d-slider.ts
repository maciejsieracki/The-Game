/**
 * K08D-2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1, partia `slider`): panel suwaków „Podział Daniny"
 * (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`) — `renderHandelSlidersPanel` (:11007-11033).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08d-port.mjs --batch slider` (bloki = pin, `k08d-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08d-copies.mjs`.
 */

import { cityPanelChipIcon, signed } from './k01a-fundament';
import { estimateHandelChips } from './k01b-f';
import type { CityView } from './k01b-t';
import { appendTabIndicators } from './k02-units';
import { appendPodzialHandlu } from './k05b-podzial';
import { daninaLabelForCity, daninaLabelGenitive, readPodzialHandlu, type City, type GameData } from './k05b-host';
import { appendSectionTitleWithDetails } from './k08b-title';
import { resourceTextClass } from '../resourceColors';
import { buildHandelDetailCard } from './k08d-handel';

// ─── Jednostki K08D, partia k08d-slider.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:11007-11033
export function renderHandelSlidersPanel(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {
  mount.innerHTML = '';
  const daninaLbl = daninaLabelForCity(city);
  appendSectionTitleWithDetails(mount, `<span>Podział ${daninaLabelGenitive(daninaLbl)}</span>`, () => buildHandelDetailCard(city, view, data));
  const split = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, split);
  if (view) {
    appendTabIndicators(mount, [
      {
        icon: cityPanelChipIcon('cp-trade', 14),
        label: daninaLbl,
        value: `${est.netto}`,
        cls: 'gold',
        title: `Brutto ~${est.brutto} · korupcja −${est.korupcja}`,
      },
      { icon: cityPanelChipIcon('res-treasury', 14), label: 'Pieniądz', value: `${signed(view.pieniadz)}`, cls: resourceTextClass('skarbiec') },
      { icon: cityPanelChipIcon('res-science', 14), label: 'Nauka', value: `${signed(view.nauka)}`, cls: resourceTextClass('nauka') },
      {
        icon: cityPanelChipIcon('res-culture', 14),
        label: 'Kultura',
        value: `${signed(view.kultura)}`,
        cls: resourceTextClass('kultura'),
      },
    ]);
  }
  appendPodzialHandlu(mount, city, view, data, { skipSubhd: true });
}
// pin-end
