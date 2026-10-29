/**
 * K08E-2b (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia `karty-b`): karty szczegółów górnego paska
 * z pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) — `buildTopBarNaukaDetailCard` (:5904-5947),
 * `buildTopBarKulturaDetailCard` (:5949-5990), `buildPorzadekDetailCard` (:3427-3549).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08e-port.mjs --batch karty-b` (bloki = pin, `k08e-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08e-copies.mjs`.
 */

import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import {
  cityPanelChipIcon, cpInlineIcons, fmtDecPl, HANDEL_ZAMOZNOSC_LABEL, loafIconHtml, pluralTur, signed, tury, type EmpireHudSnap,
} from './k01a-fundament';
import { estimateHandelChips } from './k01b-f';
import { szLinesDoWyswietlenia, type CityView } from './k01b-t';
import { appendSectionTitleWithDetails } from './k08b-title';
import { cfg, daninaLabelForCity, readPodzialHandlu, type City, type GameData } from './k05b-host';
import { gameData } from './k05a-fundament';
import type { OrderStateK08e as OrderState } from './k05b-host';
import { cityHasBibliotekaLine } from './k08d-deps';
import { porBandLabel, porPctBand } from './k08e-deps';

// ─── Jednostki K08E, partia k08e-karty-b.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:5904-5947
export function buildTopBarNaukaDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  data: GameData | null,
): HTMLDivElement {
  const isBank = empire.nauka != null;
  const mainVal = Math.round(isBank ? empire.nauka! : (empire.naukaRate ?? view.nauka));
  const cityNauka = Math.round(view.nauka);
  const split = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, split);
  const built = cfg.getBuiltBuildingIds?.(city.id) ?? [];
  const maBiblioteka = cityHasBibliotekaLine(built);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Nauka — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent = isBank
    ? 'Bank nauki to zebrane punkty na odblokowanie technologii. Dopisek +X to wkład tego miasta co turę.'
    : 'Duża liczba to suma nauki imperium. Dopisek +X to wkład tego grodu.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba (bank nauki)', isBank
    ? `${mainVal} — bank nauki (zebrane punkty)`
    : `${mainVal} — produkcja nauki imperium`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityNauka)} — ten gród`);

  appendDetailSection(card, 'Skąd bierze się nauka');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Pola i budynki', maBiblioteka ? 'Biblioteka + pola z nauką' : 'Głównie pola z nauką + budynki');
  gridDetailRow(g1, 'Udział handlu', `${split.procentNauka}% handlu netto → nauka`);
  if (est.nauka) gridDetailRow(g1, '→ z handlu (szac.)', `~+${est.nauka}`);

  appendDetailFormula(card, 'nauka += plony + budynki + % handlu');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Panel badań (mapa) — wydajesz bank na tech.',
    'Podział handlu → więcej % na Naukę = szybsze tech, mniej złota.',
    'Buduj Bibliotekę, przypisuj 👤 na pola z nauką.',
  ]);
  return card;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:5949-5990
export function buildTopBarKulturaDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
): HTMLDivElement {
  const empRate = Math.round(empire.kulturaRate ?? view.kultura);
  const cityKult = Math.round(view.kultura);
  const cultState = cfg.getCultureState?.(city.id);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🎭 Kultura — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Kultura poszerza granice miasta (więcej pól 👤) i wpływa na szczęście. Duża liczba to suma imperium; dopisek to ten gród.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🎭', `${empRate} — suma kultury imperium`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityKult)} — ten gród`);

  if (cultState) {
    appendDetailSection(card, 'Stan miasta (silnik)');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Suma kultury', String(cultState.kulturaSuma));
    gridDetailRow(g1, 'Przyrost', `+${cultState.przyrost}`);
    gridDetailRow(g1, 'Granice', `+${cultState.borderRadius} pierścieni wokół miasta`);
  } else {
    appendDetailSection(card, 'Skąd bierze się kultura');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Plony + budynki', 'Teatr, Świątynia, cuda — patrz karta miasta.');
    gridDetailRow(g1, 'Efekt', 'Więcej kultury → dalsze granice terytorium na mapie okolicy.');
  }

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → „Kultura i Religia”: pasek postępu granic.',
    'Mapa okolicy — fioletowe pierścienie = zasięg kultury.',
    'Budynki kulturalne w lewej kolumnie produkcji.',
  ]);
  return card;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:3427-3549
export function buildPorzadekDetailCard(city: City, state: OrderState): HTMLDivElement {
  const por = state.porPct ?? 0;
  const sz = state.szPct ?? 0;
  const praw = state.prawPct ?? 0;
  const band = porPctBand(por);
  const bandName = state.bandLabel ?? porBandLabel(band);
  const podzial = readPodzialHandlu(city, gameData() as GameData | null);
  const gCount = cfg.getUnitsAt?.(city.q, city.r)?.length ?? 0;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Porządek — szczegóły</span>'));

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Miasto ma trzy warstwy stabilności: Szczęście (czy ludzie są zadowoleni), Prawo (czy władza trzyma kontrolę) ' +
    'i Porządek łącznie (jedna liczba decydująca o karach i ryzyku buntu).';
  card.appendChild(intro);

  appendDetailSection(card, 'Stan tego miasta');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Porządek łącznie', `${Math.round(por)}% — ${bandName}`);
  gridDetailRow(
    g0, 'Szczęście',
    state.szMax != null
      ? `${Math.round(sz)}% (${Math.round(state.szczescie)}/${Math.round(state.szMax)} pkt)`
      : `${Math.round(sz)}%`,
  );
  // UWAGA nazewnicza (evaluator R1, zarzut 1): `state.porzadek` to LEGACY pole niosące netto
  // pkt PRAWA (`orderPanel.ts:18`), NIE to samo co `por`/`state.porPct` ("Porządek łącznie")
  // użyty wyżej w tej samej funkcji — nie mylić przy przyszłej edycji.
  gridDetailRow(
    g0, 'Prawo',
    state.prawMax != null
      ? `${Math.round(praw)}% (${Math.round(state.porzadek)}/${Math.round(state.prawMax)} pkt)`
      : `${Math.round(praw)}%`,
  );
  if (state.revoltWarning && state.revoltGraceRemaining != null) {
    gridDetailRow(g0, 'Alert buntu', `${state.revoltGraceRemaining} tur(y) na reakcję`);
  }
  if (state.rebelState) {
    gridDetailRow(g0, 'Rebelia', 'Miasto pod kontrolą rebeliantów');
  }

  appendDetailSection(card, `Co znaczy „${bandName}”?`);
  const bandNote = el('div', 'dc-note');
  bandNote.style.fontStyle = 'normal';
  const bandExplain: Record<string, string> = {
    lad: '≥90% Porządku — bonus do pracy i handlu. Miasto w pełni stabilne.',
    spokoj: '70–89% — normalna gra, bez kar i bez bonusów.',
    napiecie: '50–69% — lekkie napięcie: praca spada o ~5%. Czas reagować, zanim spadnie dalej.',
    niepokoj: '30–49% — wyraźne kary na plony, wolniejszy wzrost. Możliwy chip niepokojów.',
    bunt: '10–29% — migracja ludności, ryzyko buntu. Pilna interwencja.',
    bunt_skrajny: '<10% — alert krytyczny, 2 tury grace → potem rebelia AI (odbicie wojskiem).',
  };
  bandNote.textContent = bandExplain[band] ?? 'Patrz tabela progów poniżej.';
  card.appendChild(bandNote);

  if (state.szLines && state.szLines.length > 0) {
    appendDetailSection(card, 'Składniki Szczęścia (+/−)');
    const gs = appendDetailGrid(card);
    // zarzut 6: to samo zaokrąglenie prezentacyjne co w karcie Religii i w bloku Szczęścia
    for (const l of szLinesDoWyswietlenia(state.szLines) ?? []) {
      gridDetailRow(gs, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  if (state.prawLines && state.prawLines.length > 0) {
    appendDetailSection(card, 'Składniki Prawa (+/−)');
    const gp = appendDetailGrid(card);
    for (const l of state.prawLines) {
      gridDetailRow(gp, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  appendDetailSection(card, 'Zależności — jak to się łączy');
  appendDetailFormula(card, 'PorPct ≈ waga_Sz × SzPct + waga_Prawo × PrawPct');
  const daninaLbl = daninaLabelForCity(city);
  appendDetailAlgo(card, 'Łańcuch przyczynowy', [
    `Suwak Zamożność (${daninaLbl.toLowerCase()}) → wyższy udział zamożności → wyższe Szczęście (niskie podatki).`,
    'Budynki (Teatr, Łaźnia, Świątynia…) i kultura/religia → stały plus do Szczęścia.',
    'Zamożność W (poziom) → bonus zadowolenia z bogactwa obywateli.',
    'Garnizon w mieście → głównie Prawo (do 100% przy 5+ jednostkach), nie Szczęście.',
    'Dom Starszyzny / Dwór Zarządcy / Pretorium (region) lub Pałac (stolica), Trybunał, Sąd → trwały plus do Prawa.',
    'Duże miasto bez garnizonu → kara Prawa.',
    'PorPct spada → kary na pracę, pieniądz, naukę, wzrost; przy skrajnym spadku bunt.',
    'Sz i Prawo są niezależne — możesz podnieść jedno bez drugiego (np. wojsko bez obniżki podatków).',
  ]);

  appendDetailSection(card, 'Progi PorPct (efekty gameplay)');
  const gt = appendDetailGrid(card);
  gridDetailRow(gt, '≥90% Ład', `Bonus praca ×1,10, ${daninaLbl.toLowerCase()} ×1,10`);
  gridDetailRow(gt, '70–89% Spokój', 'Brak kar');
  gridDetailRow(gt, '50–69% Napięcie', 'Praca ×0,95');
  gridDetailRow(gt, '30–49% Niepokój', 'Kary ~×0,85 plony, wzrost ×0,75');
  gridDetailRow(gt, '10–29% Bunt', 'Kary + migracja ~5%');
  gridDetailRow(gt, '<10% Bunt skrajny', 'Kary max + grace 2 tury → rebelia');

  appendDetailSection(card, 'Szybkie działania (gdy spada Porządek)');
  const actions = el('div', 'dc-note');
  actions.style.fontStyle = 'normal';
  actions.innerHTML = cpInlineIcons(
    `<b>Podnieś Szczęście:</b> przesuń suwak handlu na <b>${HANDEL_ZAMOZNOSC_LABEL}</b> ` +
    `(obecnie ${podzial.procentLuksus}% — im wyżej, tym więcej zamożności z handlu zamiast skarbca/nauki). ` +
    'Długoterminowo: Teatr, Łaźnia, wyższe W.<br><br>' +
    `<b>Podnieś Prawo:</b> stacjonuj wojsko w mieście (obecnie ${gCount} jedn. w garnizonie) ` +
    'lub rozwijaj administrację lokalną (Dom Starszyzny → Dwór Zarządcy → Pretorium; ' +
    'Pałac w stolicy), Trybunał albo Sąd.<br><br>' +
    '<span class="muted">Kompromis: więcej zamożności = mniej 💰 i nauki teraz, ale spokojniejsze miasto. ' +
    'Wojsko w mieście = wyższe Prawo, ale koszt utrzymania armii.</span>',
  );
  card.appendChild(actions);

  appendDetailAlgo(card, 'Co robi silnik co turę', [
    'Liczy netto Sz i Prawo z rozpiski (budynki, garnizon, podatki, wojna…).',
    'Przelicza na SzPct i PrawPct (skala zależy od epoki).',
    'Liczy PorPct — od tego zależą mnożniki plonów i ryzyko buntu.',
    'Efekty zdejmują się od razu po poprawie PorPct (bez opóźnienia).',
    'PorPct <10%: licznik grace — brak reakcji → miasto może przejść pod rebeliantów (B2-Q12).',
  ]);

  return card;
}
// pin-end
