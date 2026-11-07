/**
 * K08B-4 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 3, partia `purchase`): panel „Rekrutuj jednostkę" (pin `edb8fb56`,
 * `gra/src/ui/cityPanel.ts`) — `renderPurchasableUnits` (zakładka Rekrutacja, kolumna lewa lub karta W4).
 * Jednostki DOM: 1 z zbioru 24 (`P5-8-K08B.md` §3, wiersz `renderPurchasableUnits`).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08b-port.mjs --batch purchase` (bloki = pin + `k08b-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08b-copies.mjs --batch purchase`.
 * Delegaty bez portu: `k08b-deps.ts` (K08B-Z7, wiring `setK06bDeps`: NIE_ZROBIONE).
 */

import { LIST_ROW_HEIGHT_COMPACT, LIST_SCROLL_VISIBLE_CATALOG, cityPanelChipIcon } from './k01a-fundament';
import { el } from './k01b-dom';
import { appendTabIndicators, createScrollList } from './k02-units';
import { buildRecruitTabDetailCard, buildUpgradeBonusDetailCard } from './k05b-jednostki';
import { cfg, getProd, isMeCity, productionCtxForCity, type City, type GameData } from './k05b-host';
import { appendUnitRecruitCompactRow } from './k06b-jednostki';
import { appendRecruitMilitaryResourceStrip, empireRekruciTotal, recruitPanelPurchasableUnits } from './k08b-deps';
// REPIN-UI-2-G r2: web 86d510c66 (R-WEB-HUD-NUMBER-ABBREV-Q1) — kopia bajtowa UI-2-A (#1), czysta prezentacja (nie reguła gry).
import { formatCompactNumber, formatFullNumber } from '../formatCompactNumber';
import { appendSectionTitleWithDetails } from './k08b-title';

// ─── Jednostki K08B, partia k08b-purchase.ts (kopie pinu wygenerowane; markery = bramka verify-k08b-copies.mjs) ─────────────

// pin 9b019a7d8 gra/src/ui/cityPanel.ts:9195-9292
export function renderPurchasableUnits(
  mount: HTMLElement,
  city: City,
  data: GameData | null,
  opts?: { visibleRows?: number; w4?: boolean; scrollFill?: boolean },
): void {
  mount.innerHTML = '';
  const w4 = opts?.w4 === true;
  if (w4) {
    appendSectionTitleWithDetails(
      mount,
      '<span>Rekrutacja</span>',
      () => {
        if (!data) {
          const c = el('div', 'detail-card');
          c.appendChild(el('div', 'dc-note', 'Brak danych gry'));
          return c;
        }
        const units = recruitPanelPurchasableUnits(city, data);
        return buildRecruitTabDetailCard(city, units.length, cfg.getTreasury?.(city.ownerId));
      },
    );
  } else {
    mount.appendChild(el('div', 'ptitle', '<span>Rekrutuj jednostkę (za Pieniądz)</span>'));
  }
  if (!data) { mount.appendChild(el('div', 'muted', 'Brak danych gry')); return; }
  if (!isMeCity(city.ownerId)) {
    mount.appendChild(el('div', 'muted', 'Miasto rywala — zakup niedostępny (podgląd).'));
    return;
  }
  // R-REKRUTACJA-PODGLAD-SUROWCOW-Q1: pasek surowców faktycznie uczestniczących
  // w koszcie/utrzymaniu jednostek dostępnych do rekrutacji w tym mieście/epoce
  // (dynamicznie, patrz appendRecruitMilitaryResourceStrip).
  const units = recruitPanelPurchasableUnits(city, data);
  appendRecruitMilitaryResourceStrip(mount, city, data, units);
  const skarb = cfg.getTreasury?.(city.ownerId);
  const rqLen = getProd(city.id).rekrutacja?.length ?? 0;

  if (w4) {
    appendTabIndicators(mount, [
      {
        icon: cityPanelChipIcon('res-treasury', 14),
        label: 'Skarb',
        value: skarb != null ? String(skarb) : '—',
        cls: 'gold',
      },
      {
        icon: cityPanelChipIcon('cp-recruit', 14),
        label: 'Dostępne',
        value: String(units.length),
        cls: units.length > 0 ? 'green' : 'muted',
      },
      {
        icon: cityPanelChipIcon('tb-army', 14),
        label: 'Kolejka',
        value: String(rqLen),
        cls: rqLen > 0 ? 'blue' : 'muted',
      },
    ]);
  }

  if (units.length === 0) {
    mount.appendChild(el('div', 'muted', '(brak jednostek do kupienia — zbadaj technologie / Koszary)'));
    return;
  }

  // R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1: pula rekrutów PAŃSTWA raz, jedną linią nad listą
  // (wcześniej powtarzana w każdej karcie); wiersz pokazuje już tylko „potrzebne” i „brak N”.
  const poolAvailable = empireRekruciTotal(city);
  if (poolAvailable != null && Number.isFinite(poolAvailable)) {
    const pool = el('div', 'unit-recruit-pool');
    const poolValue = Math.max(0, Math.floor(poolAvailable));
    pool.dataset.available = String(poolValue);
    pool.title = 'Pula rekrutów imperium — wspólna dla wszystkich jednostek; '
      + 'wiersz jednostki pokazuje, ile potrzebuje i ile brakuje'
      + ` · Dostępne dokładnie: ${formatFullNumber(poolValue)}`;
    pool.textContent = 'Rekruci: dostępne ';
    const b = document.createElement('b');
    // R-WEB-HUD-NUMBER-ABBREV-Q1: pula rekrutów skrócona do „71,7k" (pełna wartość w title/aria-label).
    b.textContent = formatCompactNumber(poolValue);
    pool.setAttribute('aria-label', `Rekruci: dostępne ${formatFullNumber(poolValue)}`);
    pool.appendChild(b);
    mount.appendChild(pool);
  }

  const scroll = createScrollList(
    'list-scroll',
    opts?.scrollFill
      ? { fill: true }
      : opts?.visibleRows != null
        ? { visible: opts.visibleRows, rowEm: LIST_ROW_HEIGHT_COMPACT }
        : { visible: LIST_SCROLL_VISIBLE_CATALOG, rowEm: LIST_ROW_HEIGHT_COMPACT },
  );
  for (const it of units) {
    appendUnitRecruitCompactRow(scroll, city, it, data, skarb);
  }
  mount.appendChild(scroll);
}
// pin-end
