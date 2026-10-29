/**
 * K04C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1, runda 1, batch 4a): karta „Porządek — szczegóły”.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56) `buildPorzadekDetailCard` :3427-3549. 1:1 DOM i tekst.
 * Wartosci stanu porzadku (SzPct, PrawPct, maksima, pasmo) przychodza z `CityPanelK04CDto.porzadek` i `dto.order`
 * (K04C-Z1); pasmo `bandKey` z silnika zamiast lokalnego `porPctBand`. Zero reguł gry w tym module.
 */
import type { CityPanelK04CDto, OrderBandKeyDto, SocietyLineDto } from '../../viewmodel/types';
import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from './k01b-dom';
import { appendDetailGrid, appendDetailFormula } from './k03-detail';
import { cpInlineIcons, HANDEL_ZAMOZNOSC_LABEL } from './k01a-fundament';
import { szLinesDoWyswietlenia } from './k01b-t';

/** Wejscia karty Porzadek: stan z `dto.order` + pola `CityPanelK04CDto.porzadek` + podzial handlu + garnizon. */
export interface PorzadekCardInputK {
  /** `dto.order.porzadekPct` (pin `state.porPct`). */
  porPct: number;
  /** `dto.order.szczescie` (pin `state.szczescie`). */
  szczescie: number;
  /** `dto.order.bandLabel` (pin `state.bandLabel`). */
  bandLabel: string;
  /** `dto.order.lines` (pin `state.szLines`). */
  szLines: readonly SocietyLineDto[] | undefined;
  revoltWarning: boolean;
  revoltGraceRemaining: number | null;
  rebelActive: boolean;
  /** `dto.sliders.handel.procentLuksus` (pin `readPodzialHandlu(city).procentLuksus`). */
  procentLuksus: number;
  /** Liczba jednostek w garnizonie (pin `cfg.getUnitsAt(q,r).length`; DTO: `dto.garrison.length`). */
  gCount: number;
  /** `dto.labels.danina.mianownik` (pin `daninaLabelForCity`). */
  daninaLbl: string;
  porzadek: CityPanelK04CDto['porzadek'];
}

/** Pin :3427 — opisy pasm (kopia tekstu 1:1). */
const BAND_EXPLAIN: Record<OrderBandKeyDto, string> = {
  lad: '≥90% Porządku — bonus do pracy i handlu. Miasto w pełni stabilne.',
  spokoj: '70–89% — normalna gra, bez kar i bez bonusów.',
  napiecie: '50–69% — lekkie napięcie: praca spada o ~5%. Czas reagować, zanim spadnie dalej.',
  niepokoj: '30–49% — wyraźne kary na plony, wolniejszy wzrost. Możliwy chip niepokojów.',
  bunt: '10–29% — migracja ludności, ryzyko buntu. Pilna interwencja.',
  bunt_skrajny: '<10% — alert krytyczny, 2 tury grace → potem rebelia AI (odbicie wojskiem).',
};

/** Pin :3427-3549 `buildPorzadekDetailCard`. */
export function buildPorzadekDetailCardK(i: PorzadekCardInputK): HTMLDivElement {
  const p = i.porzadek;
  const por = i.porPct;
  const sz = p.szPct;
  const praw = p.prawPct;
  const bandName = i.bandLabel;
  const daninaLbl = i.daninaLbl;

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
    p.szMax != null
      ? `${Math.round(sz)}% (${Math.round(i.szczescie)}/${Math.round(p.szMax)} pkt)`
      : `${Math.round(sz)}%`,
  );
  // Pin :3455-3457 (evaluator R1 zarzut 1): `porzadek` to LEGACY pole = netto pkt PRAWA, nie „Porządek łącznie”.
  gridDetailRow(
    g0, 'Prawo',
    p.prawMax != null
      ? `${Math.round(praw)}% (${Math.round(p.prawPkt)}/${Math.round(p.prawMax)} pkt)`
      : `${Math.round(praw)}%`,
  );
  if (i.revoltWarning && i.revoltGraceRemaining != null) {
    gridDetailRow(g0, 'Alert buntu', `${i.revoltGraceRemaining} tur(y) na reakcję`);
  }
  if (i.rebelActive) {
    gridDetailRow(g0, 'Rebelia', 'Miasto pod kontrolą rebeliantów');
  }

  appendDetailSection(card, `Co znaczy „${bandName}”?`);
  const bandNote = el('div', 'dc-note');
  bandNote.style.fontStyle = 'normal';
  bandNote.textContent = BAND_EXPLAIN[p.bandKey] ?? 'Patrz tabela progów poniżej.';
  card.appendChild(bandNote);

  if (i.szLines && i.szLines.length > 0) {
    appendDetailSection(card, 'Składniki Szczęścia (+/−)');
    const gs = appendDetailGrid(card);
    // Pin :3489: to samo zaokrąglenie prezentacyjne co w karcie Religii i w bloku Szczęścia.
    for (const l of szLinesDoWyswietlenia([...i.szLines]) ?? []) {
      gridDetailRow(gs, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  if (p.prawLines.length > 0) {
    appendDetailSection(card, 'Składniki Prawa (+/−)');
    const gp = appendDetailGrid(card);
    for (const l of p.prawLines) {
      gridDetailRow(gp, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  appendDetailSection(card, 'Zależności — jak to się łączy');
  appendDetailFormula(card, 'PorPct ≈ waga_Sz × SzPct + waga_Prawo × PrawPct');
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
    `(obecnie ${i.procentLuksus}% — im wyżej, tym więcej zamożności z handlu zamiast skarbca/nauki). ` +
    'Długoterminowo: Teatr, Łaźnia, wyższe W.<br><br>' +
    `<b>Podnieś Prawo:</b> stacjonuj wojsko w mieście (obecnie ${i.gCount} jedn. w garnizonie) ` +
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
