/**
 * K08E-2a (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia `karty-a`): karty szczegółów górnego paska
 * z pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) — `buildTopBarZywnoscDetailCard` (:5582-5650),
 * `buildTopBarRekruciDetailCard` (:5652-5682), `buildTopBarLudnoscDetailCard` (:5684-5768).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08e-port.mjs --batch karty-a` (bloki = pin, `k08e-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08e-copies.mjs`.
 */

import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { cityPanelChipIcon, cityPanelChipIconWrap, effectiveGrowthPctForUi, fmtDecPl, loafIconHtml, pluralTur, signed, tury, type EmpireHudSnap } from './k01a-fundament';
import { resolveCityFedForUi, type CityView } from './k01b-t';
import { clampedGrowthBreakdown, wyzwienieSummaryLabel } from './k01b-r';
import { cityFoodSplit } from './k03-model';
import { cfg, formatManpower, type City, type GameData, type ManpowerSnapshotK05b as CityManpowerSnapshot } from './k05b-host';
import type { GameMap } from './k05a-fundament';
import { formatWyzwienieLabelK as formatWyzwienieLabel } from './k04c-model';
import {
  buildRationParams, cityLudnoscAbsolutna, growthGainPerTurnSlots, resolveCityHealth, turnsUntilNextCitizen, WYZYWIENIE_MAX,
} from './k08e-deps';

// ─── Jednostki K08E, partia k08e-karty-a.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:5582-5650
export function buildTopBarZywnoscDetailCard(
  city: City,
  view: CityView,
  empire: EmpireHudSnap,
  data: GameData | null,
): HTMLDivElement {
  const tick = cfg.getEmpireFoodTick?.(city.ownerId);
  const st = cfg.getEmpireFoodState?.(city.ownerId);
  const maxSafe = cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX;
  const foodSplit = cityFoodSplit(view, maxSafe);
  const bilansDisplayLevel = Math.min(view.poziomRacji, maxSafe);
  const rationParams = data ? buildRationParams(data.econParams, cfg.difficulty ?? 'normal') : null;
  // P-WZROSTPROCENT-SUROWY-POZIOM: przycięte do maxSafe (spójne z Bilansem powyżej).
  // / EN: clamped to maxSafe (consistent with the Balance row above).
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
  gridDetailRow(g1, 'Koszt wyżywienia', `−${foodSplit.racje} 🍞/t (Wyżywienie ${formatWyzwienieLabel(bilansDisplayLevel)})`);
  gridDetailRow(g1, 'Bilans lokalny', `${signed(foodSplit.total)} 🍞/t`);
  if (foodSplit.clamped) {
    gridDetailRow(g1, 'Auto-korekta', `ustawione Wyżywienie ${formatWyzwienieLabel(view.poziomRacji)} przekracza limit Spichlerza — Bilans liczony przy ${formatWyzwienieLabel(bilansDisplayLevel)}, poziom zostanie obniżony na koniec tury`);
  }
  if (rationParams) {
    gridDetailRow(g1, 'Wyżywienie aktywne', wyzwienieSummaryLabel(view.poziomRacji, rationParams));
  }

  appendDetailSection(card, 'WZROST ludności');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, 'Łącznie', `${signed(bd.total)}%`);
  gridDetailRow(g2, 'Ułamek', view.wzrostUlamkowy.toFixed(2));
  gridDetailRow(g2, 'Składniki', `racje ${signed(bd.racje)}% · małe miasto ${signed(bd.maleMiasto)}% · Spichlerz ${signed(bd.spichlerz)}%`);

  if (tick) {
    appendDetailSection(card, 'Magazyn centralny (ostatnia tura)');
    const g3 = appendDetailGrid(card);
    gridDetailRow(g3, 'W magazynie', `${Math.round(st?.zapasyPanstwa ?? tick.zapasyPo)} / ${Math.round(tick.maxCap)} 🍞`);
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
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:5652-5682
export function buildTopBarRekruciDetailCard(
  city: City,
  mp: CityManpowerSnapshot,
): HTMLDivElement {
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>⚔ Rekruci (pobór wojskowy)</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Pula rekrutów tego miasta (składnik sumy imperium). Werb jednostki zużywa rekrutów ' +
    'z puli całej cywilizacji — ludność miasta nie spada. ' +
    'Zwiadowca — 0 kosztu Manpower. Co turę pula rośnie (regen), chyba że miasto jest oblężone.';
  card.appendChild(intro);

  appendDetailSection(card, 'Stan puli');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Bieżąca pula', formatManpower(mp.manpowerBiezacy));
  gridDetailRow(g, 'Maksimum', formatManpower(mp.manpowerMax));
  gridDetailRow(g, 'Odnowa', `+${formatManpower(mp.regenPerTurn)}`);
  gridDetailRow(g, 'Koszt 1 jednostki', formatManpower(mp.kosztJednostki));
  gridDetailRow(g, 'Werb przy pełnej puli', String(mp.werbMaxPrzyPelnejPuli));
  gridDetailRow(g, 'Ludność abs.', formatManpower(mp.ludnoscAbsolutna));
  gridDetailRow(g, 'Obywatele', `${mp.ludki} · epoka ${mp.epoka}`);

  appendDetailAlgo(card, 'Skąd bierze się pula', [
    'Max ≈ 10% ludności absolutnej miasta (tabela epok).',
    'Regen = % max (parametr balansu, patrz "Odnowa" wyżej) × bonus cywilizacji (np. Rzym ×2).',
    'Oblężenie blokuje odnowę do czasu zdjęcia oblężenia.',
  ]);
  return card;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:5684-5768
export function buildTopBarLudnoscDetailCard(
  city: City,
  view: CityView | null,
  data: GameData | null,
  map: GameMap | null,
): HTMLDivElement {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const health = data && map
    ? resolveCityHealth(city, map, data)
    : null;
  const osobRazem = cityLudnoscAbsolutna(city.population, epoch);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>👥 Ludność — co to znaczy</span>'));
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Liczba przy nazwie miasta to wyłącznie mieszkańcy tego grodu — nie całego państwa. ' +
    'Wpływa na koszt racji, limit pól do pracy (👤) i koszty utrzymania.';
  card.appendChild(intro);

  // P-WZROSTPROCENT-SUROWY-POZIOM: maxSafe/bd policzone TU (przed g0), żeby wiersz
  // WZROST% na pasku i w sekcji „Wzrost ludności" niżej używały tego samego przyciętego
  // poziomu co Bilans w innych kartach.
  // / EN: maxSafe/bd computed HERE (before g0), so the WZROST% row on the bar and in the
  // "Population growth" section below use the same clamped level as the Balance elsewhere.
  const maxSafe = view ? cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX : WYZYWIENIE_MAX;
  const bd = view ? clampedGrowthBreakdown(view, maxSafe) : null;

  appendDetailSection(card, 'Co widzisz na pasku');
  const g0 = appendDetailGrid(card);
  gridDetailRow(g0, 'Duża liczba 👥', `${city.population} — obywatele (sloty) tego miasta`);
  gridDetailRow(g0, 'Ludność absolutna', `≈ ${formatManpower(osobRazem)} osób`);
  gridDetailRow(g0, 'Epoka', String(epoch));
  gridDetailRow(g0, 'WZROST%', bd ? `${bd.total}%` : '—');

  if (view && bd) {
    const foodSplit = cityFoodSplit(view, maxSafe);
    const tick = cfg.getEmpireFoodTick?.(city.ownerId);
    const tickRow = tick?.perCityRows?.find(r => r.cityId === String(city.id));
    const fed = resolveCityFedForUi(String(city.id), foodSplit.total, tick);
    const growthPctUi = effectiveGrowthPctForUi(bd.total, fed);
    const gainSlots = growthGainPerTurnSlots(city.population, growthPctUi, fed, view.atPopCap);
    const turns = turnsUntilNextCitizen(view.wzrostUlamkowy, gainSlots);
    appendDetailSection(card, 'Wzrost ludności');
    const g1 = appendDetailGrid(card);
    gridDetailRow(g1, 'Wyżywienie', formatWyzwienieLabel(view.poziomRacji));
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
    // C-039 / P-WZROSTPROCENT-SUROWY-POZIOM: przycięty bilans (foodSplit.total, jak WZROST%
    // wyżej w tej samej karcie), nie surowy view.bilansLokalny — inaczej ten sam widok mieszał
    // przycięty WZROST% z surowym Bilansem żywności obok.
    // / EN: clamped balance (foodSplit.total, same as WZROST% above in this card), not the raw
    // view.bilansLokalny — otherwise this view mixed a clamped WZROST% with a raw food balance.
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
// pin-end
