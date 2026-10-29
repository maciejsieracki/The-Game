/**
 * K08E-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia `magazyn`): sekcja „Wyżywienie i wzrost"
 * (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`) — `renderMagazyn` (:5203-5472), `buildRacjeWzrostDetailCard`
 * (:5474-5579) i `buildGrowthProgressTooltipCard` (:1598-1635).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08e-port.mjs --batch magazyn` (bloki = pin, `k08e-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08e-copies.mjs`.
 * Reguły gry (`buildRationParams`, `cityLudnoscAbsolutna`, skala wzrostu/tury) = delegaty `k08e-deps.ts` (P5.13).
 */

import { el, appendDetailSection, appendDetailAlgo, gridDetailRow, setNoteHtml } from './k01b-dom';
import { appendDetailFormula, appendDetailGrid } from './k03-detail';
import { appendTabIndicators } from './k02-units';
import { attachHoverDetail } from '../hoverDetailDock';
import { formatLiczbaPl } from '../formatPl';
import type { CityView } from './k01b-t';
import {
  cityPanelChipIcon, effectiveGrowthPctForUi, fmtDecPl, growthBreakdownRow, loafIconHtml, pluralTur, signed,
  tury, type TabIndicatorChip,
} from './k01a-fundament';
import { buildGrowthProgressUi, clampedGrowthBreakdown, wyzwienieSummaryLabel } from './k01b-r';
import { resolveCityFedForUi } from './k01b-t';
import { cityFoodSplit } from './k03-model';
import { appendSectionTitleWithDetails } from './k08b-title';
import { gameData, type GameData } from './k05a-fundament';
import {
  appendIndywidualneToggle, cfg, formatManpower, isMeCity, rerender, type City,
  type EmpireFoodStateK08e as EmpireFoodState, type EmpireFoodTickK08e as EmpireFoodTick,
} from './k05b-host';
import { formatWyzwienieLabelK as formatWyzwienieLabel } from './k04c-model';
import {
  buildRationParams, cityLudnoscAbsolutna, growthGainPerTurnSlots, rationGrowthPercent, turnsUntilNextCitizen,
  WYZYWIENIE_MAX, WYZYWIENIE_MIN, WYZYWIENIE_STEP,
} from './k08e-deps';

// ─── Jednostki K08E, partia k08e-magazyn.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:1598-1635
export function buildGrowthProgressTooltipCard(
  population: number,
  view: CityView,
  epoch: number,
  fed: boolean,
  atPopCap: boolean,
  growthPctOverride?: number,
): HTMLDivElement {
  const frac = view.wzrostUlamkowy;
  const osobNaObywatela = cityLudnoscAbsolutna(1, epoch);
  const growthPct = growthPctOverride ?? view.wzrostProcent;
  const gainSlots = growthGainPerTurnSlots(population, growthPct, fed, atPopCap);
  const fracPeople = Math.round(frac * osobNaObywatela);
  const gainPeople = Math.round(gainSlots * osobNaObywatela);

  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Wzrost ludności — szczegóły</span>'));
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Postęp (sloty)', `${fmtDecPl(frac)} / 1 obywatela`);
  gridDetailRow(
    g,
    'Skala absolutna',
    `≈ ${formatManpower(fracPeople)} / ${formatManpower(osobNaObywatela)} os.`,
  );
  if (gainSlots > 0) {
    gridDetailRow(
      g,
      'Tempo',
      `+${fmtDecPl(gainSlots)} obywatela/t (≈ +${formatManpower(gainPeople)}/t)`,
    );
  }
  const note = el('div', 'dc-note');
  note.textContent = fed
    ? 'Ułamek poniżej 1 zostaje w buforze (wzrostUlamkowy) i sumuje się co turę — tylko gdy miasto jest nakarmione.'
    : 'Brak wzrostu przy głodzie — bufor nie rośnie, dopóki bilans nie zostanie pokryty z magazynu centralnego.';
  card.appendChild(note);
  return card;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:5203-5472
export function renderMagazyn(mount: HTMLElement, city: City, view: CityView | null): void {
  mount.innerHTML = '';
  mount.style.display = '';
  const data = gameData() ?? null;
  appendSectionTitleWithDetails(mount, '<span>Wyżywienie i wzrost</span>', () => {
    const st = cfg.getEmpireFoodState?.(city.ownerId);
    const tick = cfg.getEmpireFoodTick?.(city.ownerId);
    return view ? buildRacjeWzrostDetailCard(city, view, st, tick, data) : el('div', 'muted', '—');
  });
  if (!view || !data) { mount.appendChild(el('div', 'muted', '—')); return; }

  const rationParams = buildRationParams(data.econParams, cfg.difficulty ?? 'normal');
  // Bug #2 (P-AUTO-WYZYWIENIE-PODWOJNY-BLAD): maxSafe policzony TU, PRZED foodSplit,
  // żeby wiersz Bilans użył tego samego przyciętego poziomu co suwak niżej w tej
  // funkcji (który już wcześniej liczył `Math.min(view.poziomRacji, maxSafe)`).
  // / EN: maxSafe computed HERE, BEFORE foodSplit, so the Balance row uses the same
  // clamped level the slider further down this function already used.
  const maxSafe = cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX;
  const foodSplit = cityFoodSplit(view, maxSafe);
  const bilansCls = foodSplit.total > 0 ? 'green' : foodSplit.total < 0 ? 'red' : 'gold';
  const bilansDisplayLevel = Math.min(view.poziomRacji, maxSafe);
  // P-WZROSTPROCENT-SUROWY-POZIOM: `bd`/WZROST% przycięte do TEGO SAMEGO maxSafe co Bilans
  // wyżej (e4155972) — wcześniej ten wiersz liczył z surowego, nieprzyciętego poziomu.
  // / EN: `bd`/WZROST% clamped to the SAME maxSafe as the Balance above (e4155972) --
  // previously this row was computed from the raw, unclamped level.
  const bd = clampedGrowthBreakdown(view, maxSafe);
  const wzrostProcentUi = bd.total;
  const atPopCap = view.atPopCap;
  const tick = cfg.getEmpireFoodTick?.(city.ownerId);
  const cityRow = tick?.perCityRows?.find(r => r.cityId === String(city.id));
  const fed = resolveCityFedForUi(String(city.id), foodSplit.total, tick);
  const growthPctUi = effectiveGrowthPctForUi(wzrostProcentUi, fed);
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const osobRazem = cityLudnoscAbsolutna(city.population, epoch);
  const osobNaObywatela = cityLudnoscAbsolutna(1, epoch);
  const growthUi = buildGrowthProgressUi(city.population, view, epoch, fed, atPopCap, growthPctUi);

  const popHero = el('div', 'food-pop-hero');
  popHero.innerHTML =
    `<div class="pop-slots">${cityPanelChipIcon('res-population', 14)} Ludność ${city.population}</div>` +
    `<div class="pop-abs">≈ ${formatManpower(osobRazem)} osób` +
    ` (1 obywatel = ${formatManpower(osobNaObywatela)})</div>`;
  mount.appendChild(popHero);

  const chips: TabIndicatorChip[] = [
    {
      icon: loafIconHtml('civ-v-loaf-chip'),
      label: 'Produkcja',
      value: `${signed(foodSplit.produkcja)}/t`,
      cls: foodSplit.produkcja > 0 ? 'green' : foodSplit.produkcja < 0 ? 'red' : 'muted',
      title: 'Uprawa i hodowla w tym mieście (brutto)',
    },
    {
      icon: loafIconHtml('civ-v-loaf-chip'),
      label: 'Racje',
      value: `−${foodSplit.racje}/t`,
      cls: 'red',
      title: `Koszt wyżywienia przy poziomie ${formatWyzwienieLabel(bilansDisplayLevel)}`,
    },
    {
      icon: loafIconHtml('civ-v-loaf-chip'),
      label: 'Bilans',
      value: `${signed(foodSplit.total)}/t`,
      cls: bilansCls,
      title: foodSplit.clamped
        ? `Produkcja − racje = bilans lokalny · już uwzględnia auto-korektę do limitu Spichlerza (Wyżywienie ${formatWyzwienieLabel(bilansDisplayLevel)} zamiast ustawionego ${formatWyzwienieLabel(view.poziomRacji)})`
        : 'Produkcja − racje = bilans lokalny',
    },
    {
      icon: cityPanelChipIcon('chip-map', 14),
      label: 'WZROST%',
      // P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD: przecinek polski, zgodnie z plakietką mapy
      // (formatCityGrowthPercentLabel w cityMapStatChip.ts) — ta sama liczba źródłowo
      // (view.wzrostProcent), więc oba miejsca UI mają pokazywać ten sam separator.
      // P-WZROSTPROCENT-SUROWY-POZIOM: `wzrostProcentUi` (przycięty do maxSafe) zamiast
      // surowego view.wzrostProcent -- plakietka mapy (cityGrowthLive) czyta TEN SAM
      // maxSafe z cache (cfg.getCachedMaxSafePoziomRacji), zapisany tu przy tym liczeniu
      // (P-WZROSTPROCENT-PLAKIETKA-ROZJAZD) -- poza świeżością cache oba miejsca się zgadzają.
      // / EN: P-ETYKIETA-WZROST-SEPARATOR-ROZJAZD: Polish comma separator, matching the map
      // badge (formatCityGrowthPercentLabel in cityMapStatChip.ts) -- same source number
      // (view.wzrostProcent), so both UI spots must show the same separator.
      // P-WZROSTPROCENT-SUROWY-POZIOM: `wzrostProcentUi` (clamped to maxSafe) instead of the
      // raw view.wzrostProcent -- the map badge (cityGrowthLive) reads the SAME maxSafe from
      // the cache (cfg.getCachedMaxSafePoziomRacji), written here at this very computation
      // (P-WZROSTPROCENT-PLAKIETKA-ROZJAZD) -- outside of cache freshness both spots agree.
      value: fed ? `${formatLiczbaPl(wzrostProcentUi)}%` : '—',
      cls: fed && wzrostProcentUi > 0 ? 'gold' : fed ? 'muted' : 'red',
      title: fed
        ? 'Łączny procent wzrostu ludności w tej turze'
        : 'Brak wzrostu — miasto nie jest w pełni nakarmione ze Spichlerza',
    },
  ];
  if (!fed) {
    chips.push({
      icon: cityPanelChipIcon('chip-warning', 14),
      label: 'Głód',
      value: 'brak dopłaty',
      cls: 'red',
      title: 'Miasto na minusie bez pokrycia z magazynu centralnego — brak wzrostu',
    });
  }
  if (atPopCap) {
    chips.push({
      icon: cityPanelChipIcon('cp-buildings', 14),
      label: 'Limit',
      value: `max ${view.popCapAktualny}`,
      cls: 'red',
      title: view.maAkwedukt
        ? `Cap ${view.popCapAktualny} z Akweduktem`
        : `Bez Akweduktu max ${view.popCapBezAkweduktu}`,
    });
  } else if (view.maAkwedukt) {
    chips.push({
      icon: cityPanelChipIcon('cp-buildings', 14),
      label: 'Akwedukt',
      value: `cap ${view.popCapZAkweduktem}`,
      cls: 'green',
    });
  }
  appendTabIndicators(mount, chips);

  const bilans = el('div', 'food-bilans-row');
  bilans.innerHTML =
    `<span>Produkcja <span class="pos">${signed(foodSplit.produkcja)}</span> − racje <span class="neg">−${foodSplit.racje}</span></span>` +
    `<span class="${bilansCls}">= ${signed(foodSplit.total)} 🍞/t</span>`;
  // Bug #2 (P-AUTO-WYZYWIENIE-PODWOJNY-BLAD): gdy Bilans już liczy z przyciętego
  // poziomu (auto-korekta na koniec tury), zasygnalizuj to w tooltipie -- analogicznie
  // do istniejącej podpowiedzi przy suwaku niżej ("poziom zostanie obniżony...").
  // / EN: when the Balance already uses the clamped level (end-of-turn
  // auto-correction), signal it in the tooltip -- analogous to the existing hint
  // next to the slider below ("level will be lowered...").
  if (foodSplit.clamped) {
    bilans.title = `Bilans uwzględnia auto-korektę Spichlerza: liczony przy Wyżywieniu ${formatWyzwienieLabel(bilansDisplayLevel)} (ustawione ${formatWyzwienieLabel(view.poziomRacji)} zostanie obniżone na koniec tury)`;
  }
  mount.appendChild(bilans);

  const player = isMeCity(city.ownerId);
  const rationEditable = player && !!cfg.onCityRationChange;
  // maxSafe już policzony wyżej (przed foodSplit) -- nie duplikuj wywołania.
  // / EN: maxSafe already computed above (before foodSplit) -- do not duplicate the call.
  const maxSlider = maxSafe / WYZYWIENIE_STEP;
  const sliderWrap = el('div', 'wyzwienie-w4-sliders');
  const sliderRow = el('div', 'slider-row');
  const sliderLabel = el('label');
  const displayLevel = Math.min(view.poziomRacji, maxSafe);
  const growPct = rationGrowthPercent(displayLevel, rationParams);
  const growTxt = growPct > 0 ? `+${growPct}` : String(growPct);
  sliderLabel.innerHTML =
    `<span>${loafIconHtml('civ-v-loaf-chip')} Wyżywienie</span>` +
    `<span>${formatWyzwienieLabel(displayLevel)} · ${growTxt}%</span>`;
  sliderRow.appendChild(sliderLabel);
  const inp = document.createElement('input');
  inp.type = 'range';
  inp.min = String(WYZYWIENIE_MIN / WYZYWIENIE_STEP);
  inp.max = String(maxSlider);
  inp.step = '1';
  inp.value = String(displayLevel / WYZYWIENIE_STEP);
  inp.disabled = !rationEditable;
  inp.title = maxSafe < WYZYWIENIE_MAX
    ? `Wyżywienie — limit Spichlerza: max ${formatWyzwienieLabel(maxSafe)}`
    : 'Wyżywienie — koszt żywności na mieszkańca i tempo wzrostu ludności';
  if (rationEditable) {
    inp.addEventListener('input', () => {
      const rawLevel = Number(inp.value) * WYZYWIENIE_STEP;
      const level = Math.min(rawLevel, maxSafe);
      if (level < rawLevel) {
        inp.value = String(level / WYZYWIENIE_STEP);
      }
      if (level === view.poziomRacji) return;
      cfg.onCityRationChange?.(city.id, level);
      rerender();
    });
  }
  sliderRow.appendChild(inp);
  sliderWrap.appendChild(sliderRow);
  if (rationEditable && cfg.onCityAutoWyzywienieChange) {
    const autoRow = el('div', 'slider-row auto-wyzywienie-row');
    const autoBtn = document.createElement('button');
    autoBtn.type = 'button';
    autoBtn.className = 'hbtn auto-wyzywienie-btn';
    autoBtn.textContent = 'Auto Wyżywienie';
    const autoWyzywienieOn = city.autoWyzywienie === true;
    // R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B — patrz appendIndywidualneToggle: ta sama
    // para klas dla obu polowek przelacznika wyzywienia, zeby „auto" i „indywidualne"
    // dalo sie odczytac z jednego spojrzenia. Zmiana WYLACZNIE prezentacyjna.
    autoBtn.classList.add(autoWyzywienieOn ? 'active' : 'off');
    autoBtn.dataset.stan = autoWyzywienieOn ? 'wl' : 'wyl';
    autoBtn.setAttribute('aria-pressed', String(autoWyzywienieOn));
    // Bug #1 (P-AUTO-WYZYWIENIE-PODWOJNY-BLAD) JEST naprawiony (runda 1, applyLiveSafeRationForCity):
    // obniżenie działa NA ŻYWO, w trakcie tury, przy każdej zmianie wpływającej na produkcję
    // żywności -- nie tylko na koniec tury. Podniesienie (autoRaiseRationsForGrowth) nadal
    // działa WYŁĄCZNIE na koniec tury -- silnik nigdy nie podnosi racji w trakcie tury. Tooltip
    // musi odróżniać te dwa kierunki, żeby nie sugerować, że obniżenie czeka do końca tury.
    // N2 (runda 4): fraza „WYŁ: ... bez auto-obniżenia przy deficycie" była NIEPRAWDZIWA --
    // clamp na koniec tury (Q3=A, main.ts triggerPlayerEndTurn) obniża poziom racji dla
    // WSZYSTKICH miast gracza NIEZALEŻNIE od tej flagi (to siatka bezpieczeństwa silnika, nie
    // funkcja Auto Wyżywienia). Różnica jest wyłącznie w tym, CZY obniżenie dzieje się też
    // W TRAKCIE tury (tylko przy Auto WŁ) czy TYLKO na końcu (zawsze, niezależnie od flagi).
    // / EN: Bug #1 IS fixed (round 1, applyLiveSafeRationForCity): lowering happens LIVE, during
    // the turn, on every change affecting food production -- not only at end of turn. Raising
    // (autoRaiseRationsForGrowth) still happens ONLY at end of turn -- the engine never raises
    // rations mid-turn. The tooltip must distinguish these two directions.
    // N2 (round 4): the phrase "WYŁ: ... bez auto-obniżenia przy deficycie" was UNTRUE -- the
    // end-of-turn clamp (Q3=A, main.ts triggerPlayerEndTurn) lowers the ration level for ALL
    // player cities REGARDLESS of this flag (it's an engine backstop, not an Auto Wyżywienie
    // feature). The only real difference is whether lowering also happens DURING the turn
    // (only when Auto is ON) or ONLY at the end (always, flag or not).
    autoBtn.title =
      'WŁ: obniża Wyżywienie NA ŻYWO w trakcie tury (przy spadku produkcji żywności), a podnosi na koniec tury (Spichlerz ≥ 0). ' +
      'WYŁ: w trakcie tury tylko ręczny suwak (bez auto-obniżania/podnoszenia na żywo) — ale na koniec KAŻDEJ tury silnik i tak przytnie poziom do bezpiecznego, niezależnie od tej flagi (siatka bezpieczeństwa, nie funkcja Auto Wyżywienia).' +
      (autoWyzywienieOn ? '' : ' Auto WYŁ — bez auto-obniżania/podnoszenia NA ŻYWO w trakcie tury; backstop końca tury działa zawsze.');
    autoRow.appendChild(autoBtn);
    autoBtn.addEventListener('click', () => {
      cfg.onCityAutoWyzywienieChange?.(city.id, !city.autoWyzywienie);
      rerender();
    });
    sliderWrap.appendChild(autoRow);
  }
  // R-USTAWIENIA-GLOBALNE-LOKALNE (grupa "Żywność", Maciej 2026-08-10): niezależny od
  // Auto Wyżywienie -- Indywidualne odpina poziom Racji od globalnego suwaka imperium
  // (panel cywilizacji na mapie świata), Auto Wyżywienie dalej auto-dostraja WEWNĄTRZ
  // tego, co ten przycisk aktualnie kontroluje (lokalne albo globalne).
  if (rationEditable && cfg.onPoziomRacjiOverrideToggle) {
    appendIndywidualneToggle(
      sliderWrap,
      cfg.getPoziomRacjiOverride?.(city.id) === true,
      () => cfg.onPoziomRacjiOverrideToggle?.(city.id),
      'indywidualne-row-zywnosc',
    );
  }
  const hint = el('div', 'wyzwienie-w4-hint');
  hint.textContent = wyzwienieSummaryLabel(displayLevel, rationParams);
  if (maxSafe < WYZYWIENIE_MAX && rationEditable) {
    hint.textContent += ` · Limit Spichlerza: ${formatWyzwienieLabel(maxSafe)}`;
  }
  if (view.poziomRacji > maxSafe) {
    hint.textContent += ' · poziom zostanie obniżony do limitu na koniec tury';
  }
  sliderWrap.appendChild(hint);
  mount.appendChild(sliderWrap);
  if (!rationEditable && player) {
    const ro = el('div', 'muted');
    ro.style.cssText = 'font-size:0.62em;text-align:center;';
    ro.textContent = 'Suwak Wyżywienie — po wpieciu silnika.';
    mount.appendChild(ro);
  }

  const growBlock = el('div', 'growth-bd-block');
  growBlock.innerHTML =
    `<div class="growth-bd-hd">WZROST ludności</div>` +
    `<div class="growth-bd-total">Łącznie ${fed ? wzrostProcentUi : 0}%${fed ? '' : ' <span class="muted">(brak — głód)</span>'}</div>` +
    growthBreakdownRow('Wyżywienie', bd.racje, true) +
    growthBreakdownRow('Małe miasto', bd.maleMiasto) +
    growthBreakdownRow('Spichlerz', bd.spichlerz) +
    growthBreakdownRow('Zdrowie', bd.zdrowie) +
    growthBreakdownRow('Szczęście', bd.szczescie) +
    growthBreakdownRow('Cywilizacja', bd.cywilizacja) +
    growthBreakdownRow('Zaopatrzenie obywateli', bd.zaopatrzenie) +
    `<div class="growth-progress-block">${growthUi.progressHtml}${growthUi.etaHtml}</div>`;
  mount.appendChild(growBlock);
  const progressBlock = growBlock.querySelector('.growth-progress-block') as HTMLElement | null;
  if (progressBlock) {
    attachHoverDetail(
      progressBlock,
      () => buildGrowthProgressTooltipCard(city.population, view, epoch, fed, atPopCap, growthPctUi),
      220,
      'left',
    );
  }
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:5474-5579
export function buildRacjeWzrostDetailCard(
  city: City,
  view: CityView,
  st: EmpireFoodState | null | undefined,
  tick: EmpireFoodTick | null | undefined,
  data: GameData | null,
): HTMLDivElement {
  const rationParams = data ? buildRationParams(data.econParams, cfg.difficulty ?? 'normal') : null;
  const maxSafe = cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX;
  const foodSplit = cityFoodSplit(view, maxSafe);
  const bilansDisplayLevel = Math.min(view.poziomRacji, maxSafe);
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const tickRow = tick?.perCityRows?.find(r => r.cityId === String(city.id));
  const fed = resolveCityFedForUi(String(city.id), foodSplit.total, tick);
  // P-WZROSTPROCENT-SUROWY-POZIOM: przycięte do maxSafe (spójne z Bilansem wyżej).
  // / EN: clamped to maxSafe (consistent with the Balance row above).
  const bd = clampedGrowthBreakdown(view, maxSafe);
  const growthPctUi = effectiveGrowthPctForUi(bd.total, fed);
  const card = el('div', 'detail-card');
  card.appendChild(el('div', 'dc-h', '<span>Wyżywienie i wzrost — szczegóły</span>'));
  const intro = el('div', 'dc-note');
  setNoteHtml(intro,
    'Lokalnie: produkcja żywności minus koszt racji = bilans miasta. Nadwyżka trafia do magazynu centralnego, niedobór jest pokrywany stamtąd.',
  );
  card.appendChild(intro);

  appendDetailSection(card, 'Ludność miasta');
  const g0 = appendDetailGrid(card);
  const osobRazem = cityLudnoscAbsolutna(city.population, epoch);
  gridDetailRow(g0, 'Obywatele (sloty)', String(city.population));
  gridDetailRow(g0, 'Ludność absolutna', `≈ ${formatManpower(osobRazem)} osób`);
  gridDetailRow(g0, 'Skala epoki', `1 obywatel = ${formatManpower(cityLudnoscAbsolutna(1, epoch))}`);

  appendDetailSection(card, 'Bilans lokalny (to miasto)');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Produkcja brutto', `${signed(foodSplit.produkcja)} 🍞/t`);
  gridDetailRow(g1, 'Koszt wyżywienia', `−${foodSplit.racje} 🍞/t (Wyżywienie ${formatWyzwienieLabel(bilansDisplayLevel)})`);
  gridDetailRow(g1, 'Bilans', `${signed(foodSplit.total)} 🍞/t`);
  if (foodSplit.clamped) {
    gridDetailRow(g1, 'Auto-korekta', `ustawione Wyżywienie ${formatWyzwienieLabel(view.poziomRacji)} przekracza limit Spichlerza — Bilans liczony przy ${formatWyzwienieLabel(bilansDisplayLevel)}, poziom zostanie obniżony na koniec tury`);
  }
  if (rationParams) {
    gridDetailRow(g1, 'Wyżywienie', wyzwienieSummaryLabel(view.poziomRacji, rationParams));
  }

  appendDetailSection(card, 'WZROST% — składniki');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, 'Wyżywienie', `${signed(bd.racje)}%`);
  gridDetailRow(g2, 'Małe miasto', `${signed(bd.maleMiasto)}%`);
  gridDetailRow(g2, 'Spichlerz', `${signed(bd.spichlerz)}%`);
  gridDetailRow(g2, 'Zdrowie', `${signed(bd.zdrowie)}%`);
  gridDetailRow(g2, 'Szczęście', `${signed(bd.szczescie)}%`);
  gridDetailRow(g2, 'Cywilizacja', `${signed(bd.cywilizacja)}%`);
  // R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10): 7. składnik WZROST% — kara za surowce
  // budowlane obywateli brakujące w magazynie centralnym (-1%/surowiec, ECHO Q3=A). Musi być
  // wypisany tu, inaczej „Łącznie” niżej zsumowałaby coś, czego karta nie pokazuje.
  gridDetailRow(g2, 'Zaopatrzenie obywateli', `${signed(bd.zaopatrzenie)}%`);
  // P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY: składniki nad tym wierszem (racje, małe miasto,
  // spichlerz, zdrowie, szczęście, cywilizacja, zaopatrzenie obywateli) idą przez signed()
  // (przecinek polski) -- suma musi iść tym samym formaterem, inaczej jedna karta miesza
  // separatory (przecinek vs kropka).
  gridDetailRow(g2, 'Łącznie', fed ? `${signed(bd.total)}%` : '— (głód)');
  gridDetailRow(g2, 'Postęp do +1 obywatela', `${fmtDecPl(view.wzrostUlamkowy)} / 1`);
  const gainSlots = growthGainPerTurnSlots(city.population, growthPctUi, fed, view.atPopCap);
  const turns = turnsUntilNextCitizen(view.wzrostUlamkowy, gainSlots);
  gridDetailRow(
    g2,
    'Kolejny obywatel',
    view.atPopCap ? 'limit ludności'
      : !fed ? 'brak — głód'
        : turns === 0 ? 'w tej turze'
          : turns != null ? `za ≈ ${turns} ${pluralTur(turns)}`
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
    gridDetailRow(g3, 'W magazynie', `${Math.round(st?.zapasyPanstwa ?? tick.zapasyPo)} / ${Math.round(tick.maxCap)} 🍞`);
  }

  appendDetailAlgo(card, 'Gdzie zarządzać', [
    'Suwak Wyżywienie (0–6) — koszt żywności i tempo wzrostu tego miasta.',
    'Magazyn centralny — panel imperium (Spichlerz stolicy).',
    'Pola 🌾 w okolicy — podnoszą produkcję brutto.',
  ]);
  return card;
}
// pin-end
