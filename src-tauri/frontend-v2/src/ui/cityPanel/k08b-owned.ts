/**
 * K08B-3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 3, partia `owned`): lista „Budynki w mieście" (pin `edb8fb56`,
 * `gra/src/ui/cityPanel.ts`) — `renderBuildingsOwned` i prawa karta `renderBuildingsOwnedRightPanel`.
 * Jednostki DOM: 2 z zbioru 24 (`P5-8-K08B.md` §3, wiersze `renderBuildingsOwned` i `renderBuildingsOwnedRightPanel`).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08b-port.mjs --batch owned` (bloki = pin + `k08b-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08b-copies.mjs --batch owned`.
 * Delegaty bez portu: `k08b-deps.ts` (K08B-Z7, wiring `setK06bDeps`: NIE_ZROBIONE).
 */

import { BUILDING_UPKEEP_ZERO_LABEL, PH, cityPanelChipIconWrap } from './k01a-fundament';
import { formatBuildingUpkeepTotalHtml } from './k01b-f';
import { formatResourceUpkeepText, sumOwnedBuildingsResourceUpkeep } from './k01b-r';
import { el } from './k01b-dom';
import { createScrollList } from './k02-units';
import { cfg, type City, type GameData } from './k05b-host';
import { appendOwnedBuildingRow } from './k06b-kolejki';
import { groupBuiltBuildingIds, sumOwnedBuildingsUpkeep } from './k08b-deps';
import { withW4TabCard } from './k08b-rail';

// ─── Jednostki K08B, partia k08b-owned.ts (kopie pinu wygenerowane; markery = bramka verify-k08b-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:9184-9255
export function renderBuildingsOwned(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  opts?: { visibleRows?: number; scrollFill?: boolean; compact?: boolean },
): void {
  mount.innerHTML = '';
  const compact = opts?.compact === true;
  if (compact) mount.classList.add('bld-owned-compact-mount');
  // P-PRODUKCJA-BUDYNKI-WYBUDOWANE-PRAWA-KOLUMNA, znalezisko Evaluatora (2026-08-12): mount
  // jest już w DOM w tym miejscu (withW4TabCard robi appendChild PRZED render(body)), więc
  // closest('.civ-ux-right') poprawnie rozstrzyga stronę -- karty szczegółów muszą dokować
  // po tej samej stronie co lista wywołująca, nie zawsze po lewej.
  const detailSide: 'left' | 'right' = mount.closest('.civ-ux-right') ? 'right' : 'left';
  const built = cfg.getBuiltBuildingIds?.(city.id);
  const builtCount = built?.length ?? 0;
  let titleHtml = compact
    ? `<span>Budynki (${builtCount})</span>`
    : `<span>Budynki w mieście${built ? ' (' + built.length + ')' : ''}</span>${built ? '' : PH()}`;
  if (built && data && built.length > 0 && compact) {
    const totalUpkeep = sumOwnedBuildingsUpkeep(built, data, city);
    const totalResUpkeep = sumOwnedBuildingsResourceUpkeep(built, data);
    if (totalUpkeep === 0 && Object.keys(totalResUpkeep).length === 0) {
      titleHtml += `<span class="bld-owned-title-upkeep">· ${BUILDING_UPKEEP_ZERO_LABEL}</span>`;
    } else {
      const parts: string[] = [];
      if (totalUpkeep > 0) parts.push(`−${totalUpkeep}${cityPanelChipIconWrap('res-treasury', 9)}`);
      const res = formatResourceUpkeepText(totalResUpkeep, true);
      if (res) parts.push(res);
      titleHtml += `<span class="bld-owned-title-upkeep">· ${parts.join(' ')}</span>`;
    }
  }
  mount.appendChild(el('div', 'ptitle', titleHtml));
  if (built && data) {
    if (built.length === 0) { mount.appendChild(el('div', 'muted', '(brak)')); return; }
    if (!compact) {
      const totalUpkeep = sumOwnedBuildingsUpkeep(built, data, city);
      const totalResUpkeep = sumOwnedBuildingsResourceUpkeep(built, data);
      const summary = el('div', 'bld-owned-summary');
      summary.innerHTML = formatBuildingUpkeepTotalHtml(totalUpkeep, totalResUpkeep);
      mount.appendChild(summary);
    }
    const scroll = opts?.scrollFill
      ? createScrollList('list-scroll', { fill: true })
      : opts?.visibleRows != null
        ? createScrollList('list-scroll', { visible: opts.visibleRows })
        : null;
    const target = scroll ?? mount;
    const groups = groupBuiltBuildingIds(built, data.buildings);
    for (const { grupa, ids } of groups) {
      const isEmpty = ids.length === 0;
      if (compact && isEmpty) continue;
      const details = el('details', `bld-group${isEmpty ? ' bld-group-empty' : ''}`);
      details.open = !isEmpty;
      const summary = el('summary', 'bld-group-h');
      summary.textContent = isEmpty ? `${grupa} —` : `${grupa} (${ids.length})`;
      details.appendChild(summary);
      if (isEmpty) {
        if (!compact) {
          details.appendChild(el('div', 'muted bld-group-empty-note', '(brak)'));
        }
      } else {
        for (const id of ids) appendOwnedBuildingRow(details, id, data, city, { compact, detailSide });
      }
      target.appendChild(details);
    }
    if (scroll) mount.appendChild(scroll);
  } else if (!compact) {
    ['Spichlerz', 'Cegielnia', 'Targowisko', 'Świątynia'].forEach(n =>
      mount.appendChild(el('div', 'bld', `${cityPanelChipIconWrap('cp-buildings', 14)}<span class="bn">${n}</span>`)));
  }
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:9341-9357
export function renderBuildingsOwnedRightPanel(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
): void {
  mount.innerHTML = '';
  withW4TabCard(mount, 'cs-owned-right', city, body => {
    // Bez scrollFill/visibleRows celowo — `target` w renderBuildingsOwned staje
    // się wtedy `mount` (bez wewnętrznego list-scroll o ograniczonej wysokości),
    // więc JEDYNY scroll to ten z `.civ-w4-tab-body--scroll` (cała karta), a nie
    // podwójny/zagnieżdżony pasek. / EN: intentionally no scrollFill/visibleRows
    // — this makes renderBuildingsOwned append groups straight into `mount`
    // (no capped-height inner list-scroll), so the card's own body scrollbar is
    // the single scroll region instead of a nested one.
    renderBuildingsOwned(body, city, data);
  }, { scrollable: true });
}
// pin-end
