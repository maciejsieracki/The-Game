/**
 * K04D (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1, runda 1): karty paska gornego — Żywność i Ludność.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `buildTopBarZywnoscDetailCard` :5582-5650,
 * `buildTopBarLudnoscDetailCard` :5684-5768. 1:1 DOM i tekst (te same helpery prezentacji co pin).
 *
 * ZALOZENIA K04D (rozstrzygniete w P5-8-K04D.md, nie pytania):
 * - K04D-Z5: `cfg.getEmpireFoodTick` / `getEmpireFoodState` -> `wyzywienie.tick` / `wyzywienie.zapasyPanstwa` (K04C-Z5).
 * - K04D-Z3: `turns` karty Ludnosc = `growth.turnsToNextCitizen` z silnika (ta sama wartosc co K04C-Z5),
 *   nie przeliczana lokalnie przez `growthGainPerTurnSlots`.
 * - Zmienna `tickRow` (pin :5672) nieczytana w pinie — nie portowana.
 * - `empire` (parametr pina :5586) nieczytany w karcie Żywności — usuniety z API.
 */
import type { CityPanelK04CDto } from '../../viewmodel/types';
import { el, appendDetailSection, appendDetailAlgo, gridDetailRow } from './k01b-dom';
import { appendDetailGrid, appendDetailFormula } from './k03-detail';
import { fmtDecPl, pluralTur, signed, loafIconHtml } from './k01a-fundament';
import type { CityView } from './k01b-t';
import { cityFoodSplit } from './k03-model';
import { clampedGrowthBreakdown } from './k01b-r';
import { formatManpowerK } from './k03-cards';
import { formatWyzwienieLabelK, WYZYWIENIE_SKALA, resolveCityHealthK } from './k04c-model';

/** Wejscia karty Żywność (pin :5582). */
export interface ZywnoscCardInputK {
  view: CityView;
  /** `CityPanelDto.food.maxSafePoziom` (pin `cfg.getMaxSafePoziomRacji`). */
  maxSafe: number;
  /** Wejscia K04C-Z5 (magazyn centralny, podsumowanie wyzywienia). */
  wyzywienie: CityPanelK04CDto['wyzywienie'];
}

/** Pin :5582-5650 `buildTopBarZywnoscDetailCard`. */
export function buildTopBarZywnoscDetailCardK(i: ZywnoscCardInputK): HTMLDivElement {
  const { view, maxSafe, wyzywienie } = i;
  const tick = wyzywienie.tick;
  const foodSplit = cityFoodSplit(view, maxSafe);
  const bilansDisplayLevel = Math.min(view.poziomRacji, maxSafe);
  const fmtLvl = (n: number): string => formatWyzwienieLabelK(n, WYZYWIENIE_SKALA);
  // P-WZROSTPROCENT-SUROWY-POZIOM: przyciete do maxSafe (spojne z Bilansem).
  const bd = clampedGrowthBreakdown(view, maxSafe);

  const card = el('div', 'detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = `<span>${loafIconHtml('civ-v-loaf-chip')} Żywność — co to znaczy</span>`;
  card.appendChild(head);

  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Bilans lokalny tego miasta: produkcja żywności minus koszt racji. Nadwyżka idzie do magazynu centralnego.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku miasta');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Zielony dopisek', `${signed(foodSplit.total)} — bilans lokalny (produkcja − racje)`);
  gridDetailRow(g0, 'WZROST%', `${bd.total}% — tempo wzrostu ludności`);

  appendDetailSection(card, 'Skąd bierze się żywność (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Produkcja brutto', `${signed(foodSplit.produkcja)} 🍞/t`);
  gridDetailRow(g1, 'Koszt wyżywienia', `−${foodSplit.racje} 🍞/t (Wyżywienie ${fmtLvl(bilansDisplayLevel)})`);
  gridDetailRow(g1, 'Bilans lokalny', `${signed(foodSplit.total)} 🍞/t`);
  if (foodSplit.clamped) {
    gridDetailRow(g1, 'Auto-korekta', `ustawione Wyżywienie ${fmtLvl(view.poziomRacji)} przekracza limit Spichlerza — Bilans liczony przy ${fmtLvl(bilansDisplayLevel)}, poziom zostanie obniżony na koniec tury`);
  }
  if (wyzywienie.wyzwienieSummary != null) {
    gridDetailRow(g1, 'Wyżywienie aktywne', wyzywienie.wyzwienieSummary);
  }

  appendDetailSection(card, 'WZROST ludności');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, 'Łącznie', `${signed(bd.total)}%`);
  gridDetailRow(g2, 'Ułamek', view.wzrostUlamkowy.toFixed(2));
  gridDetailRow(g2, 'Składniki', `racje ${signed(bd.racje)}% · małe miasto ${signed(bd.maleMiasto)}% · Spichlerz ${signed(bd.spichlerz)}%`);

  if (tick) {
    appendDetailSection(card, 'Magazyn centralny (ostatnia tura)');
    const g3 = appendDetailGrid(card);
    gridDetailRow(g3, 'W magazynie', `${Math.round(wyzywienie.zapasyPanstwa ?? tick.zapasyPo)} / ${Math.round(tick.maxCap)} 🍞`);
    gridDetailRow(g3, 'Pomoc miastom', `−${Math.round(tick.pomocMiastom)} 🍞`);
    gridDetailRow(g3, 'Wojsko', `−${Math.round(tick.wojsko)} 🍞`);
  }

  appendDetailFormula(card, 'bilans = produkcja_brutto − koszt_racji');
  appendDetailFormula(card, 'wzrost = ludność × WZROST% / 100');

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → Wyżywienie i wzrost: suwak Wyżywienie 0–6.',
    'Mapa okolicy → przypisz 👤 na pola żywnościowe (🌾).',
    'Magazyn centralny → panel imperium (Spichlerz stolicy).',
  ]);

  return card;
}

/** Wejscia karty Ludnosc (pin :5684). */
export interface LudnoscCardInputK {
  /** Pin `cfg.getEpoch?.(ownerId) ?? 1`. */
  epoka: number;
  /** `CityRefDto.population` (pin `city.population`). */
  population: number;
  /** Widok miasta (`null` = brak podgladu tury: sekcje wzrostu pominiete). */
  view: CityView | null;
  /** `CityPanelDto.food.maxSafePoziom`. */
  maxSafe: number;
  /** `CityPanelDto.growth.fed` (K04C-Z5; pin `resolveCityFedForUi`). */
  fed: boolean;
  /** `CityPanelDto.growth.turnsToNextCitizen` (K04D-Z3). */
  turnsDoNastepnego: number | null;
  /** `CityPanelDto.health` (pin `resolveCityHealth`, `null` = brak). */
  health: { total: number; lines: readonly { label: string; value: number }[] } | null;
  /** Ludnosc absolutna miasta z silnika (K04C-Z5 `wyzywienie.ludnoscAbsolutna`). */
  ludnoscAbsolutna: number;
}

/** Pin :5684-5768 `buildTopBarLudnoscDetailCard`. */
export function buildTopBarLudnoscDetailCardK(i: LudnoscCardInputK): HTMLDivElement {
  const view = i.view;
  const maxSafe = i.maxSafe;
  const fmtLvl = (n: number): string => formatWyzwienieLabelK(n, WYZYWIENIE_SKALA);
  const bd = view ? clampedGrowthBreakdown(view, maxSafe) : null;
  const health = i.health ? resolveCityHealthK(i.health) : null;
  const osobRazem = i.ludnoscAbsolutna;

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>👥 Ludność — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Liczba przy nazwie miasta to wyłącznie mieszkańcy tego grodu — nie całego państwa. ' +
    'Wpływa na koszt racji, limit pól do pracy (👤) i koszty utrzymania.';
  card.appendChild(intro);

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 👥', `${i.population} — obywatele (sloty) tego miasta`);
  gridDetailRow(g0, 'Ludność absolutna', `≈ ${formatManpowerK(osobRazem)} osób`);
  gridDetailRow(g0, 'Epoka', String(i.epoka));
  gridDetailRow(g0, 'WZROST%', bd ? `${bd.total}%` : '—');

  if (view && bd) {
    const foodSplit = cityFoodSplit(view, maxSafe);
    const fed = i.fed;
    const turns = i.turnsDoNastepnego;
    appendDetailSection(card, 'Wzrost ludności');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Wyżywienie', fmtLvl(view.poziomRacji));
    gridDetailRow(g1, 'WZROST%', fed ? `${bd.total}%` : '— (głód)');
    gridDetailRow(g1, 'Postęp do +1', `${fmtDecPl(view.wzrostUlamkowy)} / 1 obywatela`);
    gridDetailRow(
      g1,
      'Kolejny obywatel',
      view.atPopCap ? 'limit ludności'
        : !fed ? 'brak — głód'
          : turns === 0 ? 'w tej turze'
            : turns != null ? `za ≈ ${turns} ${pluralTur(turns)}`
              : '—',
    );
    // C-039 / P-WZROSTPROCENT-SUROWY-POZIOM: przycięty bilans (foodSplit.total), nie surowy bilansLokalny.
    gridDetailRow(g1, 'Bilans żywności', `${signed(foodSplit.total)} 🍞/t`);
    if (view.atPopCap) {
      gridDetailRow(g1, 'Limit', `max ${view.popCapAktualny} mieszkańców`);
    }
  }

  if (health) {
    appendDetailSection(card, 'Zdrowie (wpływ na wzrost)');
    const gh = appendDetailGrid(card);
    gridDetailRow(gh, 'Zdrowie łącznie', `${health.total >= 0 ? '+' : ''}${health.total}`);
    for (const l of health.lines.slice(0, 6)) {
      gridDetailRow(gh, l.label, `${l.value >= 0 ? '+' : ''}${l.value}`);
    }
  }

  appendDetailFormula(card, 'wzrost = ludność × WZROST% / 100 — ułamek <1 zostaje w buforze');
  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Prawa kolumna → Wyżywienie i wzrost: suwak Wyżywienie 0–6.',
    'Mapa okolicy → max 👤 obok centrum = populacja (kto pracuje pola).',
  ]);
  return card;
}
