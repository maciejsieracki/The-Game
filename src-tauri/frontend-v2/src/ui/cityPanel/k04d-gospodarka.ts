/**
 * K04D (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1, runda 1): karty paska gornego — Praca, Pieniądz (Złoto), Nauka.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `buildTopBarPracaDetailCard` :5770-5822,
 * `buildTopBarZlotoDetailCard` :5824-5902, `buildTopBarNaukaDetailCard` :5904-5947. 1:1 DOM i tekst.
 *
 * ZALOZENIA K04D (rozstrzygniete w P5-8-K04D.md):
 * - K04D-Z1: podzial handlu (`readPodzialHandlu`) z `CityPanelK04DDto.podzialHandlu` (silnik).
 * - K04D-Z2: podzial pracy (`cityPracaSplit`, `readPodzialPracy`) z `CityPanelK04DDto.praca` (silnik; K04B
 *   nie jest zintegrowany). Zmienna `pctCfg` pina (:5772) nieczytana — nie portowana.
 * - K04D-Z3: snapshot pieniadza miasta z `CityPanelK04DDto.moneySnap` (null = galaz „Wpływ do skarbca”).
 * - K04D-Z4: `freshWealthState()` (pin :5831) -> `wealthPoziom` z silnika (domyslnie W0).
 * - Estymaty handlu (`estimateHandelChips`) — prezentacja jak w pinie (K01B).
 */
import type { CityView } from './k01b-t';
import { signed, type EmpireHudSnap, type PodzialHandluSplit } from './k01a-fundament';
import type { CityMoneySnapK04D, PracaSplitDto } from '../../viewmodel/types';
import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailGrid, appendDetailFormula } from './k03-detail';
import { estimateHandelChips } from './k01b-f';
import { PULA_LBL_PELNA, PULA_TIP } from './k01b-t';
import { formatResourceUpkeepSummary } from './k04-stock';

/** Wejscia karty Praca (pin :5770). */
export interface PracaCardInputK {
  view: CityView;
  empire: EmpireHudSnap;
  praca: PracaSplitDto;
}

/** Pin :5770-5822 `buildTopBarPracaDetailCard`. */
export function buildTopBarPracaDetailCardK(i: PracaCardInputK): HTMLDivElement {
  const { praca, empire } = i;
  const pctB = praca.pctBudynki;
  const pctU = praca.pctPuli;
  const pool = Math.round(empire.pracaPool ?? empire.pracaRate ?? 0);
  const empireSum = praca.sumaMiast ?? 0;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>🔨 Praca — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  // P-PRACA-PANEL-EMOJI-ZAMIAST-IKON-Q1: innerHTML (zmapowany 👤 ma sie renderowac jako ikona).
  setNoteHtml(intro,
    'Praca to surowiec z pól okolicy (👤). Duża liczba to pula imperium; złoty i niebieski dopisek to podział pracy tylko tego miasta.');
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 🔨', `${pool} — pula Pracy imperium (zapas / suma tur)`);
  gridDetailRow(g0, 'Złoty dopisek', `${signed(praca.doBudynkow)} — ten gród → kolejka budowy (${pctB}%)`);
  gridDetailRow(g0, 'Niebieski dopisek', `${signed(praca.doPuli)} — ten gród → pula imperium (${pctU}%)`);
  gridDetailRow(g0, 'Suma miast', empireSum > 0 ? `${signed(empireSum)} łącznie z wszystkich grodów` : '—');

  appendDetailSection(card, 'Skąd bierze się praca (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Praca brutto', `${signed(praca.total)} 🔨`);
  gridDetailRow(g1, '→ Budynki', `${signed(praca.doBudynkow)} — postęp w kolejce produkcji`);
  gridDetailRow(g1, `→ ${PULA_LBL_PELNA}`, `${signed(praca.doPuli)} — ${PULA_TIP}`);

  appendDetailFormula(card, 'doBudynkow = round(praca × %Budynki)');
  appendDetailFormula(card, 'doPuli = praca − doBudynkow  (nigdy nie gubi reszty)');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Lewa kolumna → „Podział pracy”: suwak 🏛 vs 📦 pula (per miasto).',
    'Mapa okolicy → przypisz 👤 na heksy z 🔨 (pola, lasy, kamieniołomy).',
    'Kolejka produkcji po lewej zużywa strumień „budynki”.',
  ]);
  return card;
}

/** Wejscia karty Zloto / Pieniadz (pin :5824). */
export interface ZlotoCardInputK {
  view: CityView;
  empire: EmpireHudSnap;
  podzialHandlu: PodzialHandluSplit;
  moneySnap: CityMoneySnapK04D | null;
  wealthPoziom: number;
  daninaLbl: string;
  daninaLblGen: string;
  /** Etykiety surowcow dla `formatResourceUpkeepSummary` (katalog; pin `RESOURCE_LABELS`). */
  stockLabels: Readonly<Record<string, string>>;
}

/** Pin :5824-5902 `buildTopBarZlotoDetailCard`. */
export function buildTopBarZlotoDetailCardK(i: ZlotoCardInputK): HTMLDivElement {
  const { view, empire, moneySnap, daninaLbl, daninaLblGen, stockLabels } = i;
  const skarb = Math.round(empire.zloto ?? 0);
  const cityMoney = Math.round(view.pieniadz);
  const est = estimateHandelChips(view, i.podzialHandlu);
  const split = i.podzialHandlu;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>💰 Pieniądz — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Skarbiec imperium to gotówka na wykupy, rekrutację za złoto i utrzymanie. Poniżej: bilans całego państwa oraz wpływ tego miasta.';
  card.appendChild(intro);

  appendDetailSection(card, 'Skarbiec imperium (bilans / turę)');
  const gImp = appendDetailGrid(card);
  const wplywy = empire.bogactwoWplywyBrutto ?? 0;
  const handel = empire.bogactwoHandel ?? 0;
  const utrzB = empire.bogactwoUtrzymanieBudynkow ?? 0;
  const utrzRes = empire.bogactwoUtrzymanieSurowcowBudynkow ?? {};
  const utrzJ = empire.bogactwoUtrzymanieJednostek ?? 0;
  const netto = empire.bogactwoRate ?? empire.zlotoRate ?? 0;
  gridDetailRow(gImp, 'Stan skarbca', `${skarb}`);
  gridDetailRow(gImp, 'Wpływy brutto', signed(wplywy - handel));
  gridDetailRow(gImp, 'Handel ze szlaków', signed(handel));
  gridDetailRow(gImp, 'Utrzymanie budynków', utrzB > 0 ? `−${utrzB}` : '—');
  gridDetailRow(gImp, 'Utrzymanie surowców budynków', formatResourceUpkeepSummary(utrzRes, stockLabels));
  gridDetailRow(gImp, 'Utrzymanie jednostek', utrzJ > 0 ? `−${utrzJ}` : '—');
  gridDetailRow(gImp, 'Netto / turę', signed(netto));

  appendDetailSection(card, 'Ten gród — przychody i koszty lokalne');
  const gCity = appendDetailGrid(card);
  if (moneySnap) {
    gridDetailRow(gCity, 'Pieniądz brutto', signed(moneySnap.pieniadzBrutto));
    gridDetailRow(gCity, 'Mnożnik zamożności W', `×${moneySnap.wealthMnoznik.toFixed(2)}`);
    gridDetailRow(gCity, 'Handel ze szlaków', signed(moneySnap.handelZeSzlakow));
    gridDetailRow(gCity, '→ Do skarbca imperium', signed(moneySnap.doSkarbca));
    gridDetailRow(gCity, 'Utrzymanie budynków', moneySnap.utrzymanieBudynkow > 0 ? `−${moneySnap.utrzymanieBudynkow}` : '—');
    gridDetailRow(gCity, 'Utrzymanie surowców budynków', formatResourceUpkeepSummary(moneySnap.utrzymanieSurowcowBudynkow ?? {}, stockLabels));
    gridDetailRow(gCity, 'Utrzymanie garnizonu', moneySnap.utrzymanieGarnizonu > 0 ? `−${moneySnap.utrzymanieGarnizonu}` : '—');
    gridDetailRow(gCity, 'Nauka (osobny bank)', signed(moneySnap.nauka));
  } else {
    gridDetailRow(gCity, 'Wpływ do skarbca', signed(cityMoney));
  }

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 💰', `${skarb} — skarbiec całego państwa`);
  gridDetailRow(g0, 'Dopisek +X', `${signed(cityMoney)} — netto z tego grodu do skarbca`);

  appendDetailSection(card, 'Skąd bierze się pieniądz (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Plony + budynki', 'Targowisko, Mennica, podatki z pól — patrz okolica.');
  gridDetailRow(g1, `Podział ${daninaLblGen}`, `${split.procentPieniadz}% Skarb · ${split.procentNauka}% Nauka · ${split.procentLuksus}% Zamożność`);
  if (est.netto) {
    gridDetailRow(g1, `${daninaLbl} netto (szac.)`, `~${est.netto} → split suwaków`);
    gridDetailRow(g1, '→ do Skarbu', est.skarb ? `~+${est.skarb}` : '—');
  }
  gridDetailRow(g1, 'Zamożność W', `W${i.wealthPoziom} — część ${daninaLblGen} karmi pulę W (mnożnik podatków)`);

  appendDetailFormula(card, 'pieniadzNetto = podatki + handel_netto + budynki − utrzymanie');
  appendDetailFormula(card, 'Skarbiec += Σ pieniadzNetto_miast − wydatki');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    `Prawa kolumna → „Podział ${daninaLblGen}”: Skarb vs Nauka vs Zamożność.`,
    'Prawa kolumna → „Zamożność”: pasek puli W.',
    'Lewa kolumna → Wykup / Rekrutuj za złoto ze skarbca.',
  ]);
  return card;
}

/** Wejscia karty Nauka (pin :5904). */
export interface NaukaCardInputK {
  view: CityView;
  empire: EmpireHudSnap;
  podzialHandlu: PodzialHandluSplit;
  /** `CityPanelDto.inputs.handel.maBiblioteka` (pin `cityHasBibliotekaLine(built)`, K04D-Z4). */
  maBiblioteka: boolean;
}

/** Pin :5904-5947 `buildTopBarNaukaDetailCard`. */
export function buildTopBarNaukaDetailCardK(i: NaukaCardInputK): HTMLDivElement {
  const { view, empire, podzialHandlu: split } = i;
  const isBank = empire.nauka != null;
  const mainVal = Math.round(isBank ? empire.nauka! : (empire.naukaRate ?? view.nauka));
  const cityNauka = Math.round(view.nauka);
  const est = estimateHandelChips(view, split);

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
  gridDetailRow(g1, 'Pola i budynki', i.maBiblioteka ? 'Biblioteka + pola z nauką' : 'Głównie pola z nauką + budynki');
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
