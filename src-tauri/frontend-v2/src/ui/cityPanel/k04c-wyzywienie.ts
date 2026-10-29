/**
 * K04C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1, runda 1, batch 4a): karta „Wyżywienie i wzrost — szczegóły”.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56) `buildRacjeWzrostDetailCard` :5474-5579. 1:1 DOM i tekst.
 * ZALOZENIA K04C-Z5 (wejscia z silnika, nie liczone w UI):
 * - `fed` = `CityPanelDto.growth.fed` (pin `resolveCityFedForUi`, ktore czyta `tick.perCityRows`);
 * - `bd` = skladniki WZROST% juz przyciete do `maxSafe` (pin `clampedGrowthBreakdown(view, maxSafe)`,
 *   ktore wola `reguly().rationGrowthPercent` — w v2 wynik przychodzi jako argument);
 * - `turnsDoNastepnego` = `CityPanelDto.growth.turnsToNextCitizen` (pin `turnsUntilNextCitizen`);
 * - `wyzwienieSummary` = tekst silnika (pin `wyzwienieSummaryLabel`, ktore wola reguly());
 * - `ludnosc` = `cityLudnoscAbsolutna(pop, epoka)` i `(1, epoka)` z silnika (pin `manpower.ts:489`).
 * Sumy bilansu (`cityFoodSplit`) i formaty (`formatWyzwienieLabel`, `formatManpower`) sa prezentacja jak w pinie.
 */
import type { EmpireFoodTickDetailDto, CityPanelK04CDto } from '../../viewmodel/types';
import type { CityView } from './k01b-t';
import type { GrowthPercentBreakdownK } from './k01b-dto';
import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailGrid, appendDetailFormula } from './k03-detail';
import { fmtDecPl, pluralTur, signed } from './k01a-fundament';
import { cityFoodSplit } from './k03-model';
import { formatManpowerK } from './k03-cards';
import { formatWyzwienieLabelK, WYZYWIENIE_SKALA } from './k04c-model';

/** Wejscia karty Wyzywienie i wzrost. */
export interface WyzywienieCardInputK {
  /** Widok miasta z DTO (`cityViewFromDto`); pola: poziomRacji, wzrostUlamkowy, maSpichlerz, ...). */
  view: CityView;
  /** `CityRefDto.population` (pin `city.population`). */
  population: number;
  /** `CityPanelDto.food.maxSafePoziom` (pin `cfg.getMaxSafePoziomRacji`). */
  maxSafe: number;
  /** Skladniki WZROST% przyciete do maxSafe (K04C-Z5). */
  bd: GrowthPercentBreakdownK;
  /** `CityPanelDto.growth.fed` (K04C-Z5). */
  fed: boolean;
  /** `CityPanelDto.growth.turnsToNextCitizen` (K04C-Z5). */
  turnsDoNastepnego: number | null;
  wyzywienie: CityPanelK04CDto['wyzywienie'];
}

/** Pin :5474-5579 `buildRacjeWzrostDetailCard`. */
export function buildWyzywienieDetailCardK(i: WyzywienieCardInputK): HTMLDivElement {
  const view = i.view;
  const maxSafe = i.maxSafe;
  const bd = i.bd;
  const fed = i.fed;
  const w = i.wyzywienie;
  const foodSplit = cityFoodSplit(view, maxSafe);
  const bilansDisplayLevel = Math.min(view.poziomRacji, maxSafe);
  const fmtLvl = (n: number): string => formatWyzwienieLabelK(n, WYZYWIENIE_SKALA);
  const tick: EmpireFoodTickDetailDto | null = w.tick;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Wyżywienie i wzrost — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    'Lokalnie: produkcja żywności minus koszt racji = bilans miasta. Nadwyżka trafia do magazynu centralnego, niedobór jest pokrywany stamtąd.',
  );
  card.appendChild(intro);

  appendDetailSection(card, 'Ludność miasta');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Obywatele (sloty)', String(i.population));
  gridDetailRow(g0, 'Ludność absolutna', `≈ ${formatManpowerK(w.ludnoscAbsolutna)} osób`);
  gridDetailRow(g0, 'Skala epoki', `1 obywatel = ${formatManpowerK(w.ludnoscNaObywatela)}`);

  appendDetailSection(card, 'Bilans lokalny (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Produkcja brutto', `${signed(foodSplit.produkcja)} 🍞/t`);
  gridDetailRow(g1, 'Koszt wyżywienia', `−${foodSplit.racje} 🍞/t (Wyżywienie ${fmtLvl(bilansDisplayLevel)})`);
  gridDetailRow(g1, 'Bilans', `${signed(foodSplit.total)} 🍞/t`);
  if (foodSplit.clamped) {
    gridDetailRow(g1, 'Auto-korekta', `ustawione Wyżywienie ${fmtLvl(view.poziomRacji)} przekracza limit Spichlerza — Bilans liczony przy ${fmtLvl(bilansDisplayLevel)}, poziom zostanie obniżony na koniec tury`);
  }
  if (w.wyzwienieSummary !== null) {
    gridDetailRow(g1, 'Wyżywienie', w.wyzwienieSummary);
  }

  appendDetailSection(card, 'WZROST% — składniki');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, 'Wyżywienie', `${signed(bd.racje)}%`);
  gridDetailRow(g2, 'Małe miasto', `${signed(bd.maleMiasto)}%`);
  gridDetailRow(g2, 'Spichlerz', `${signed(bd.spichlerz)}%`);
  gridDetailRow(g2, 'Zdrowie', `${signed(bd.zdrowie)}%`);
  gridDetailRow(g2, 'Szczęście', `${signed(bd.szczescie)}%`);
  gridDetailRow(g2, 'Cywilizacja', `${signed(bd.cywilizacja)}%`);
  // R-ZUZYCIE-SUROWCOW-OBYWATELE: 7. składnik WZROST% (pin :5527-5530).
  gridDetailRow(g2, 'Zaopatrzenie obywateli', `${signed(bd.zaopatrzenie)}%`);
  // P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY (pin :5531-5535): suma tym samym formaterem co składniki.
  gridDetailRow(g2, 'Łącznie', fed ? `${signed(bd.total)}%` : '— (głód)');
  gridDetailRow(g2, 'Postęp do +1 obywatela', `${fmtDecPl(view.wzrostUlamkowy)} / 1`);
  gridDetailRow(
    g2,
    'Kolejny obywatel',
    view.atPopCap ? 'limit ludności'
      : !fed ? 'brak — głód'
        : i.turnsDoNastepnego === 0 ? 'w tej turze'
          : i.turnsDoNastepnego != null ? `za ≈ ${i.turnsDoNastepnego} ${pluralTur(i.turnsDoNastepnego)}`
            : '—',
  );

  appendDetailFormula(card, 'bilans = produkcja_brutto − (ludność × koszt_racji)');
  appendDetailFormula(card, 'wzrost = ludność × WZROST% / 100 — ułamek <1 zostaje w buforze na kolejną turę');

  if (view.maSpichlerz || view.maAkwedukt) {
    appendDetailSection(card, 'Budynki wpływające na wzrost');
    const gB = appendDetailGrid(card);
    if (view.maSpichlerz) {
      gridDetailRow(gB, 'Spichlerz', `+${bd.spichlerz}% WZROST · limit ludności ${view.popCapSpichlerz} bez Akweduktu · niższy koszt racji (Ceramika −25%, pełny II −50%)`);
    }
    if (view.maAkwedukt) {
      gridDetailRow(gB, 'Akwedukt', `Limit ludności ${view.popCapZAkweduktem} (bez niego max ${view.popCapBezAkweduktu})`);
    }
  }

  if (tick) {
    appendDetailSection(card, 'Magazyn centralny (ostatnia tura)');
    const g3 = appendDetailGrid(card);
    gridDetailRow(g3, 'Uprawa i hodowla', `+${Math.round(tick.uprawaHodowla)} 🍞`);
    gridDetailRow(g3, 'Wyżywienie ludności', `−${Math.round(tick.wyzwienieLudnosci)} 🍞`);
    gridDetailRow(g3, 'Pomoc miastom', `−${Math.round(tick.pomocMiastom)} 🍞`);
    gridDetailRow(g3, 'Wojsko', `−${Math.round(tick.wojsko)} 🍞`);
    gridDetailRow(g3, 'W magazynie', `${Math.round(w.zapasyPanstwa ?? tick.zapasyPo)} / ${Math.round(tick.maxCap)} 🍞`);
  }

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Suwak Wyżywienie (0–6) — koszt żywności i tempo wzrostu tego miasta.',
    'Magazyn centralny — panel imperium (Spichlerz stolicy).',
    'Pola 🌾 w okolicy — podnoszą produkcję brutto.',
  ]);
  return card;
}
