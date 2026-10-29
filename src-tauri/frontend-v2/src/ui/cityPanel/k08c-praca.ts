/**
 * K08C-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 1, partia `praca`): karty szczegółów „Praca" (pin `edb8fb56`,
 * `gra/src/ui/cityPanel.ts`) — `buildPracaDetailCard` (karta „Podział pracy", ściąga) i `buildTopBarPracaDetailCard`
 * (karta paska u góry „🔨 Praca — co to znaczy"). Jednostki DOM: 2 z zbioru K08C (`P5-8-K08C.md` §0).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08c-port.mjs --batch praca` (bloki = pin, `k08c-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08c-copies.mjs`.
 * Delegaty bez portu: `k08c-deps.ts` (readPodzialPracy, cityPracaSplit, procentPuliImperiumZBudynkow, computeView);
 * wiring: `controller/k08cWiring.ts` (NIE_ZROBIONE w produkcji: wywołujący = K09).
 */

import { cityPanelChipIconWrap, signed, type EmpireHudSnap } from './k01a-fundament';
import { appendDetailAlgo, appendDetailSection, el, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { cfg, type City, type GameData } from './k05b-host';
import type { CityView } from './k01b-t';
import { PULA_LBL_PELNA, PULA_TIP } from './k01b-t';
import type { GameMap } from './k05a-fundament';
import {
  cityPracaSplit, computeView, procentPuliImperiumZBudynkow, readPodzialPracy,
} from './k08c-deps';

// ─── Jednostki K08C, partia k08c-praca.ts (kopie pinu wygenerowane; markery = bramka verify-k08c-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:4946-5018
export function buildPracaDetailCard(
  city: City,
  view: CityView | null,
  data: GameData | null,
): HTMLDivElement {
  const pctCfg = readPodzialPracy(city, data);
  const praca = view ? cityPracaSplit(city, view, data) : null;
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const maTargowisko = built.includes('targowisko');

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Lokalny przyrost Pracy — ściąga</span>';
  card.appendChild(head);

  const pctB = praca?.pctBudynki ?? pctCfg.procentBudynki;
  const pctU = praca?.pctPuli ?? procentPuliImperiumZBudynkow(pctB);
  const summary = el('div', 'dc-summary muted');
  summary.style.cssText = 'font-size:0.88em;margin-bottom:0.35em;';
  summary.innerHTML = praca
    ? `${pctB}% ${cityPanelChipIconWrap('cp-buildings', 14)} budynki · ${pctU}% ${cityPanelChipIconWrap('chip-crate', 14)} pula · ${signed(praca.total)} ${cityPanelChipIconWrap('res-work', 14)}`
    : `${pctB}% ${cityPanelChipIconWrap('cp-buildings', 14)} · ${pctU}% ${cityPanelChipIconWrap('chip-crate', 14)} (brak podglądu tury)`;
  card.appendChild(summary);

  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    'Praca 🔨 to surowiec z pól okolicy (👤 na heksach). Lokalny suwak dzieli przyrost między ' +
    'kolejkę budowy/rekrutacji a pulę imperium. Nadrzędny podział puli na budynki i ulepszenia jest ustawiany osobno.',
  );
  card.appendChild(intro);

  appendDetailSection(card, 'Co widać w panelu');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Suwak (jak Wyżywienie)', `Etykieta: ${pctB}% 🏛 · ${pctU}% 📦 — jeden pasek przesuwania, bez osobnego paska podglądu.`);
  gridDetailRow(g0, 'Lewo / prawo', 'W lewo → więcej do puli imperium; w prawo → szybsza kolejka budowy. Kroki co 10%.');
  gridDetailRow(g0, 'Dlaczego tu, po lewej', 'Podział pracy karmi produkcję i budowę — garnizon jest w pasku u góry obok nazwy miasta.');

  appendDetailSection(card, 'Aktualny podział');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Praca', praca ? `${signed(praca.total)} 🔨` : '—');
  gridDetailRow(g1, '→ Budynki', praca ? `${signed(praca.doBudynkow)} (${praca.pctBudynki}%)` : '—');
  gridDetailRow(g1, `→ ${PULA_LBL_PELNA}`, praca ? `${signed(praca.doPuli)} (${praca.pctPuli}%)` : '—');

  appendDetailFormula(card, 'doBudynkow = round(praca × %Budynki)');
  appendDetailFormula(card, 'doPuli = praca − doBudynkow  (nigdy nie gubi reszty)');

  appendDetailSection(card, 'Trade-off (po co ten wybór)');
  const gt = appendDetailGrid(card);
  gridDetailRow(gt, 'Więcej 🏛', 'Szybciej kończysz budynki i rekrutację w kolejce — miasto rośnie „w pionie”.');
  gridDetailRow(gt, 'Więcej 📦', 'Szybciej kumulujesz pulę Pracy imperium — załóż miasto i finansuj nadrzędnie limitowane ulepszenia terenu.');
  gridDetailRow(gt, 'Skrajności', '100% 🏛 = zero wpływu do puli. 100% 📦 = kolejka stoi w miejscu; to lokalny podział przyrostu, nie limit automatu.');
  gridDetailRow(gt, 'Brak pracy', 'Gdy 🔨 = 0, suwak nic nie da — przypisz 👤 w okolicy (prawa kolumna).');

  appendDetailAlgo(card, 'Algorytm (splitPraca + productionProgress)', [
    'Praca netto = suma z obrabianych pól + budynki − strata (korupcja).',
    'doBudynkow idzie do kolejki produkcji (budynki, jednostki) co turę.',
    'doPuli trafia do zapasu Pracy imperium (nie oznacza automatycznie wydatku na ulepszenia pól).',
    'Kolejka pusta: cała Praca miasta (doBudynkow + doPuli) idzie do puli imperium.',
    'Kolejka zajęta: postęp += doBudynkow; gdy postęp ≥ koszt → budynek gotowy; reszta → doPuli.',
    maTargowisko
      ? 'Część pracy (doPuli) + Waluta + Targowisko → dodatkowy pieniądz (osobny strumień).'
      : 'Bez Targowiska doPuli nie konwertuje się na pieniądz.',
    'Brak pracy = brak postępu budowy i brak wpływu do puli — przypisz 👤 w okolicy.',
  ]);

  appendDetailAlgo(card, 'Suwak UI', [
    'Kroki co 10%. Zmiana %Budynki automatycznie ustawia resztę na pulę Pracy imperium.',
    'Per miasto — każde miasto może mieć inny podział.',
    'Brak pracy w turze — przypisz 👤 na mapie okolicy. Miasto rywala: tylko podgląd.',
  ]);

  return card;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:5770-5822
export function buildTopBarPracaDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  map: GameMap | null,
  data: GameData | null,
): HTMLDivElement {
  const pracaSplit = cityPracaSplit(city, view, data);
  const pctCfg = readPodzialPracy(city, data);
  const pctB = pracaSplit.pctBudynki;
  const pctU = pracaSplit.pctPuli;
  const pool = Math.round(empire.pracaPool ?? empire.pracaRate ?? 0);
  let empireSum = 0;
  if (map && data) {
    for (const c of (cfg.getCities?.() ?? []).filter(x => x.ownerId === city.ownerId)) {
      const v = computeView(c, map, data);
      if (v) empireSum += v.praca;
    }
  }

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🔨 Praca — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  // P-PRACA-PANEL-EMOJI-ZAMIAST-IKON-Q1: było `.textContent =`, które z definicji NIE renderuje
  // HTML — nawet zmapowany 👤 lądował u gracza jako goły glif. `setNoteHtml` to ten sam helper
  // (`fontStyle:'normal'` + `innerHTML = cpInlineIcons(...)`), którym intro karty „Podział pracy"
  // już jest ustawiane w `buildPracaDetailCard`.
  setNoteHtml(intro,
    'Praca to surowiec z pól okolicy (👤). Duża liczba to pula imperium; złoty i niebieski dopisek to podział pracy tylko tego miasta.');
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🔨', `${pool} — pula Pracy imperium (zapas / suma tur)`);
  gridDetailRow(g0, 'Złoty dopisek', `${signed(pracaSplit.doBudynkow)} — ten gród → kolejka budowy (${pctB}%)`);
  gridDetailRow(g0, 'Niebieski dopisek', `${signed(pracaSplit.doPuli)} — ten gród → pula imperium (${pctU}%)`);
  gridDetailRow(g0, 'Suma miast', empireSum > 0 ? `${signed(empireSum)} łącznie z wszystkich grodów` : '—');

  appendDetailSection(card, 'Skąd bierze się praca (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Praca brutto', `${signed(pracaSplit.total)} 🔨`);
  gridDetailRow(g1, '→ Budynki', `${signed(pracaSplit.doBudynkow)} — postęp w kolejce produkcji`);
  gridDetailRow(g1, `→ ${PULA_LBL_PELNA}`, `${signed(pracaSplit.doPuli)} — ${PULA_TIP}`);

  appendDetailFormula(card, 'doBudynkow = round(praca × %Budynki)');
  appendDetailFormula(card, 'doPuli = praca − doBudynkow  (nigdy nie gubi reszty)');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Lewa kolumna → „Podział pracy”: suwak 🏛 vs 📦 pula (per miasto).',
    'Mapa okolicy → przypisz 👤 na heksy z 🔨 (pola, lasy, kamieniołomy).',
    'Kolejka produkcji po lewej zużywa strumień „budynki”.',
  ]);
  return card;
}
// pin-end
