/**
 * K08D-3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 3, partia `religia`): karta i panel „Religia" z pinu `edb8fb56`
 * (`gra/src/ui/cityPanel.ts`) — `renderReligia` (:4112-4220), `buildTopBarReligiaDetailCard` (:5992-6039),
 * `appendCompositionBlock` (:3814-3834).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08d-port.mjs --batch religia` (bloki = pin, `k08d-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08d-copies.mjs`.
 * Reguły (`religiaSzPunkty`, `religiaXRelTop`, `resolveEmpireSnap`) = delegaty `k08d-deps.ts` (P5.13).
 */

import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from './k01b-dom';
import { appendDetailGrid } from './k03-detail';
import {
  cityPanelChipIcon, cityPanelChipIconWrap, PH, pctSubheadHtml, shortIndLabel, signed,
  type BreakdownLine, type EmpireHudSnap, type TabIndicatorChip,
} from './k01a-fundament';
import { appendTabIndicators } from './k02-units';
import { appendW4SignedBreakdownSections } from './k02-breakdown';
import type { CityView } from './k01b-t';
import { cfg, type City, type GameData } from './k05b-host';
import { appendSectionTitleWithDetails } from './k08b-title';
import { religiaSzPunkty, religiaXRelTop, resolveEmpireSnap } from './k08d-deps';

// ─── Jednostki K08D, partia k08d-religia.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:3814-3834
export function appendCompositionBlock(
  parent: HTMLElement,
  title: string,
  lines: { label: string; pct: number; note?: string }[],
  footnote?: string,
): void {
  if (!lines.length) return;
  appendDetailSection(parent, title);
  const g = appendDetailGrid(parent);
  for (const row of lines) {
    const val = row.note ? `${row.pct}% · ${row.note}` : `${row.pct}%`;
    gridDetailRow(g, row.label, val);
  }
  if (footnote) {
    const note = document.createElement('div');
    note.className = 'dc-note';
    note.style.fontStyle = 'normal';
    note.textContent = footnote;
    parent.appendChild(note);
  }
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:5992-6039
export function buildTopBarReligiaDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  data: GameData | null,
): HTMLDivElement {
  const relSt = cfg.getReligionState?.(city.id);
  const relName = empire.stateReligion ?? relSt?.dominujaca ?? '—';
  const relStock = Math.round(empire.religionStock ?? 0);
  const cityRel = Math.round(relSt?.przyrostWiernych ?? 0);
  const relRateEmp = Math.round(empire.religionRate ?? 0);
  const share = empire.religionSharePct ?? relSt?.udzialPct ?? 0;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🛕 Religia — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Religia państwowa to tożsamość cywilizacji. Duża liczba to wierni w imperium; dopisek to ile ten gród szerzy wiarę co turę.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🛕', `${relStock} — wierni „${relName}” w państwie`);
  gridDetailRow(g0, 'Udział wiary', `${share}% ludności`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityRel)} — ten gród szerzy religię`);
  gridDetailRow(g0, 'Imperium łącznie', `${signed(relRateEmp)}`);

  appendDetailSection(card, 'Po co religia w grze');
  const g1 = appendDetailGrid(card);
  const xRelTop = religiaXRelTop(city.ownerId, data);
  gridDetailRow(g1, 'Szczęście z wiary', `proporcjonalnie do udziału: 100% własnej +${xRelTop}, 50/50 = 0, 100% obcej −${xRelTop}`);
  gridDetailRow(g1, 'Szerzenie', 'Sąsiednie miasta + Świątynia przyspieszają konwersję');

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → ikona Religia.',
    'Buduj Świątynię — więcej presji religijnej.',
    'Podbój = stopniowa konwersja ku wierze właściciela.',
  ]);
  return card;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:4112-4220
export function renderReligia(mount: HTMLElement, city: City, view: CityView | null, data: GameData | null): void {
  mount.innerHTML = '';
  const relState = cfg.getReligionState?.(city.id) ?? null;
  const empire = resolveEmpireSnap(city, null, data);

  appendSectionTitleWithDetails(
    mount,
    `<span>Religia</span>${relState ? '' : PH()}`,
    () => {
      if (view) return buildTopBarReligiaDetailCard(city, view, empire, data);
      const card = el('div', 'detail-card');
      card.appendChild(el('div', 'dc-h', `<span>${cityPanelChipIconWrap('res-religion', 14)} Religia — szczegóły</span>`));
      if (relState) {
        const g = appendDetailGrid(card);
        gridDetailRow(g, 'Dominująca', relState.dominujaca);
        gridDetailRow(g, 'Udział', `${relState.udzialPct}%`);
        const szPkt = religiaSzPunkty(relState.wplywSzczescie, city.ownerId);
        gridDetailRow(g, 'Wpływ na Sz', `${szPkt >= 0 ? '+' : ''}${szPkt} pkt`);
      } else {
        card.appendChild(el('div', 'dc-note', 'Brak danych silnika (hak getReligionState).'));
      }
      return card;
    },
  );

  const relChips: TabIndicatorChip[] = [];
  // G4/G15: wskaźnik [-1,+1] z silnika → punkty Szczęścia tej epoki (ta sama funkcja,
  // którą liczy `computeHappinessBreakdown`).
  const relSzPkt = relState ? religiaSzPunkty(relState.wplywSzczescie, city.ownerId) : 0;
  if (relState) {
    relChips.push({
      icon: cityPanelChipIcon('res-religion', 14),
      label: shortIndLabel(relState.dominujaca, 12),
      value: `${relState.udzialPct}%`,
      cls: 'gold',
      title: relState.dominujaca,
    });
    relChips.push({
      icon: cityPanelChipIcon('chip-happiness', 14),
      label: 'Sz',
      value: `${relSzPkt >= 0 ? '+' : ''}${relSzPkt}`,
      cls: relSzPkt >= 0 ? 'green' : 'red',
      title: 'Wpływ na szczęście (pkt tej epoki)',
    });
    if (relState.przyrostWiernych != null) {
      relChips.push({
        icon: '✦',
        label: 'Wierni',
        value: `${signed(Math.round(relState.przyrostWiernych))}`,
        cls: relState.przyrostWiernych > 0 ? 'green' : 'muted',
      });
    }
  } else if (empire.stateReligion) {
    relChips.push({
      icon: cityPanelChipIcon('res-religion', 14),
      label: 'Państwo',
      value: shortIndLabel(empire.stateReligion, 14),
      cls: 'gold',
    });
  }
  appendTabIndicators(mount, relChips);

  if (relState?.stateReligion) {
    const stateNote = document.createElement('di' + 'v');
    stateNote.className = 'rsb';
    stateNote.innerHTML =
      `<span class="muted">Religia państwa:</span> <span class="gold">${relState.stateReligion}</span>`;
    mount.appendChild(stateNote);
  }
  if (relState?.sklad && relState.sklad.length > 0) {
    appendCompositionBlock(
      mount,
      'Skład wyznawców',
      relState.sklad.map(s => ({
        label: s.name,
        pct: s.pct,
        note: relState.stateReligion && s.name !== relState.stateReligion ? 'obca' : undefined,
      })),
    );
  }

  const relLines: BreakdownLine[] = relState?.zrodla?.map(z => ({ label: z.nazwa, value: z.wartosc })) ?? [];
  if (relState) {
    if (relSzPkt !== 0 && !relLines.some(l => /szczęście/i.test(l.label))) {
      relLines.push({ label: 'Wpływ na szczęście', value: relSzPkt });
    }
    if (relState.przyrostWiernych != null && relState.przyrostWiernych !== 0
        && !relLines.some(l => /szerzenie/i.test(l.label))) {
      relLines.push({ label: 'Szerzenie wiernych', value: relState.przyrostWiernych });
    }
  }
  appendW4SignedBreakdownSections(
    mount,
    pctSubheadHtml('res-religion', 'Religia — składniki'),
    relLines,
    'Brak rozpisanych składników religii w tym mieście.',
  );

  if (relState) {
    const sum = el('div', 'rsb civ-w4-rel-summary');
    sum.style.cssText = 'margin-top:0.35em;font-size:0.82em;display:flex;justify-content:space-between;align-items:center;gap:0.35em;flex-wrap:wrap;';
    const szCls = relSzPkt >= 0 ? 'green' : 'red';
    sum.innerHTML =
      `<span style="color:#e8e0c8;">${relState.dominujaca} / kult państwa</span>` +
      `<span class="${szCls} val">${relState.udzialPct}% · ${relSzPkt >= 0 ? '+' : ''}${relSzPkt}</span>`;
    mount.appendChild(sum);
  }
}
// pin-end
