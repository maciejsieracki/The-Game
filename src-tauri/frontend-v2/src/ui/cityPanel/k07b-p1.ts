/**
 * K07B partia 1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1, runda 2): jednostki DOM bloku K07 (pin `edb8fb56`,
 * `gra/src/ui/cityPanel.ts`) — renderSpoleczenstwo, renderZdrowie, renderKultura, renderProd, renderBuildSplitPanel,
 * renderOkolica, CityPanelUxMounts, renderCityHeaderCompact (8 z 15).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k07b-port.mjs` (bloki = pin + `k07a-subs.mjs` PIN_TO_PORT_NAMES).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k07b-copies.mjs`.
 * Nagłówek (importy, delegaty `dep(…)`, `valueProxy(…)`) jest częścią ZAŁOŻEŃ K07B-Z1..Z5: `dyspozycje/rust-port/p5/P5-8-K07B.md`.
 */

import {
  PH, SCALES, cityPanelBrandIcon, cityPanelChipIcon, cpInlineIcons, effectiveGrowthPctForUi, fmtDecPl,
  formatBuildEtaLabel, loafIconHtml, pctSubheadHtml, pluralTur, signed,
  type BreakdownLine, type TabIndicatorChip,
} from './k01a-fundament';
import { clampedGrowthBreakdown } from './k01b-r';
import { resolveCityFedForUi, type CityView } from './k01b-t';
import { appendTabIndicators, appendW4PctMetricBlock } from './k02-units';
import { appendW4SignedBreakdownSections } from './k02-breakdown';
import { cityFoodSplit } from './k03-model';
import { okStat, ringsTiles, findBuildingDef } from './k05a-fundament';
import { dep, valueProxy } from './k07b-deps';

// ─── K07B-Z5: typy pinu (alias any; zgodność z viewmodel/types.ts — NIE_ZMIERZONO) ───────────────────────────────
type CityK07 = any;
type GameData = any;
type GameMap = any;

// ─── K07B-Z3: stała pinu `WYZYWIENIE_MAX = 6` (`game/population-growth-v85.ts:28`) ─────────────────────────────────
const WYZYWIENIE_MAX = 6;

/** K07B-Z4: kształt `cfg` pinu (`CityPanelConfig`) — tylko metody czytane przez partię 1; reszta jako any. */
interface CfgK07b {
  getCultureState?: (cityId: string) => { thresholds: any[]; kulturaMix: any[]; zrodla?: any[]; kulturaSuma: number; [k: string]: any } | undefined;
  getEmpireFoodTick?: (ownerId: number) => { perCityRows?: any[] } | undefined;
  getMaxSafePoziomRacji?: (cityId: string) => number | undefined;
  [k: string]: any;
}
const cfg = valueProxy('cfg') as CfgK07b;

// ─── K07B-Z5: kształt wyniku pinu `resolveCityHealth` (pin `cityPanel.ts:3281`) — pola czytane przez partię 1 ─────────
type CityHealthK07b = { total: number; lines: { label: string; value: number; [k: string]: any }[]; fromEngine: boolean };
const el = (...args: any[]): any => dep('el')(...args);
const gameData = (...args: any[]): any => dep('gameData')(...args);
const activeMap = (...args: any[]): any => dep('activeMap')(...args);
const attachInteractiveDetail = (...args: any[]): any => dep('attachInteractiveDetail')(...args);
const cityPanelChipIconWrap = (...args: any[]): any => dep('cityPanelChipIconWrap')(...args);
const cityPracaSplit = (...args: any[]): any => dep('cityPracaSplit')(...args);
const frontItem = (...args: any[]): any => dep('frontItem')(...args);
const getProd = (...args: any[]): any => dep('getProd')(...args);
const setProd = (...args: any[]): any => dep('setProd')(...args);
const setPaused = (...args: any[]): any => dep('setPaused')(...args);
const rerender = (...args: any[]): any => dep('rerender')(...args);
const rangeName = (...args: any[]): any => dep('rangeName')(...args);
const resourceTextClass = (...args: any[]): any => dep('resourceTextClass')(...args);
const tury = (...args: any[]): any => dep('tury')(...args);
const turnsUntilNextCitizen = (...args: any[]): any => dep('turnsUntilNextCitizen')(...args);
const etaTurns = (...args: any[]): any => dep('etaTurns')(...args);
const rushCost = (...args: any[]): any => dep('rushCost')(...args);
const productionCtxForCity = (...args: any[]): any => dep('productionCtxForCity')(...args);
const isMeCity = (...args: any[]): any => dep('isMeCity')(...args);
const isCityUxFrameOpen = (...args: any[]): any => dep('isCityUxFrameOpen')(...args);
const formatManpower = (...args: any[]): any => dep('formatManpower')(...args);
const formatWyzwienieLabel = (...args: any[]): any => dep('formatWyzwienieLabel')(...args);
const resolveCityHealth = (...args: any[]): CityHealthK07b => dep('resolveCityHealth')(...args);
const resolveEmpireSnap = (...args: any[]): any => dep('resolveEmpireSnap')(...args);
const resolveOrderState = (...args: any[]): any => dep('resolveOrderState')(...args);
const cityLudnoscAbsolutna = (...args: any[]): any => dep('cityLudnoscAbsolutna')(...args);
const growthGainPerTurnSlots = (...args: any[]): any => dep('growthGainPerTurnSlots')(...args);
const loadOrderParams = (...args: any[]): any => dep('loadOrderParams')(...args);
const orderBandEffectShort = (...args: any[]): any => dep('orderBandEffectShort')(...args);
const orderTierUi = (...args: any[]): any => dep('orderTierUi')(...args);
const POR_BAND_LABELS: Record<string, string> = valueProxy('POR_BAND_LABELS') as any;
const porPctBand = (...args: any[]): any => dep('porPctBand')(...args);
const postCaptureLawBannerLabel = (...args: any[]): any => dep('postCaptureLawBannerLabel')(...args);
const szLinesDoWyswietlenia = (...args: any[]): any => dep('szLinesDoWyswietlenia')(...args);
const cancelQueueItem = (...args: any[]): any => dep('cancelQueueItem')(...args);
const effectiveGrowthPctForUiPin = effectiveGrowthPctForUi;
const appendRecruitmentQueue = (...args: any[]): any => dep('appendRecruitmentQueue')(...args);
const appendProductionPicon = (...args: any[]): any => dep('appendProductionPicon')(...args);
const appendCompositionBlock = (...args: any[]): any => dep('appendCompositionBlock')(...args);
const appendCitizenUpkeepBlock = (...args: any[]): any => dep('appendCitizenUpkeepBlock')(...args);
const appendBuildQueueSection = (...args: any[]): any => dep('appendBuildQueueSection')(...args);
const appendSectionTitleWithDetails = (...args: any[]): any => dep('appendSectionTitleWithDetails')(...args);
const appendPanel = (...args: any[]): any => dep('appendPanel')(...args);
const appendBudowaListaBar = (...args: any[]): any => dep('appendBudowaListaBar')(...args);
const appendBudowaToolbarProfiles = (...args: any[]): any => dep('appendBudowaToolbarProfiles')(...args);
const appendOkolicaToolbarProfiles = (...args: any[]): any => dep('appendOkolicaToolbarProfiles')(...args);
const renderTopStatsBar = (...args: any[]): any => dep('renderTopStatsBar')(...args);
const resolveDetailSideHint = (...args: any[]): any => dep('resolveDetailSideHint')(...args);
const renderWorkedPreview = (...args: any[]): any => dep('renderWorkedPreview')(...args);
const renderSurowce = (...args: any[]): any => dep('renderSurowce')(...args);
const renderBuildList = (...args: any[]): any => dep('renderBuildList')(...args);
const buildZdrowieDetailCard = (...args: any[]): any => dep('buildZdrowieDetailCard')(...args);
const buildTopBarKulturaDetailCard = (...args: any[]): any => dep('buildTopBarKulturaDetailCard')(...args);
const buildPorzadekDetailCard = (...args: any[]): any => dep('buildPorzadekDetailCard')(...args);
const buildOkolicaDetailCard = (...args: any[]): any => dep('buildOkolicaDetailCard')(...args);
const buildKulturaDetailCard = (...args: any[]): any => dep('buildKulturaDetailCard')(...args);
const buildBuildingBuildTabDetailCard = (...args: any[]): any => dep('buildBuildingBuildTabDetailCard')(...args);

// pin edb8fb56 gra/src/ui/cityPanel.ts:3295-3425
export function renderSpoleczenstwo(mount: HTMLElement, city: CityK07, data: GameData): void {
  const { state, fromEngine } = resolveOrderState(city, data);
  const badge = fromEngine ? '' : PH();
  mount.className = 'panel panel-tight cs-order';
  mount.innerHTML = '';
  appendSectionTitleWithDetails(
    mount,
    `<span>Porządek · ${city.population} mieszk.</span>${badge}`,
    () => buildPorzadekDetailCard(city, state),
  );
  const por = state.porPct ?? 0;
  const band = porPctBand(por);
  const bandName = state.bandLabel ?? POR_BAND_LABELS[band];
  const gCount = cfg.getUnitsAt?.(city.q, city.r)?.length ?? 0;
  const porCls = por >= 70 ? 'green' : por >= 50 ? 'gold' : 'red';
  const orderChips: TabIndicatorChip[] = [
    { icon: cityPanelChipIcon('cp-order', 14), label: 'Stan', value: bandName, cls: porCls },
    { icon: cityPanelChipIcon('chip-trend-up', 14), label: 'Efekt', value: orderBandEffectShort(band), cls: porCls },
    { icon: cityPanelChipIcon('chip-garrison', 14), label: 'Garnizon', value: `${gCount} jedn.`, cls: gCount >= 3 ? 'green' : gCount > 0 ? 'gold' : 'muted' },
  ];
  if (state.revoltWarning && state.revoltGraceRemaining != null) {
    orderChips.push({
      icon: cityPanelChipIcon('chip-warning', 14),
      label: 'Bunt',
      value: `${state.revoltGraceRemaining} tur`,
      cls: 'red',
      title: 'Brak reakcji — ryzyko rebelii',
    });
  } else if (state.rebelState) {
    orderChips.push({ icon: cityPanelChipIcon('chip-death', 14), label: 'Rebelia', value: 'aktywna', cls: 'red' });
  } else if (state.postCaptureLawTurnsRemaining != null && state.postCaptureLawTurnsRemaining > 0) {
    orderChips.push({
      icon: cityPanelChipIcon('chip-garrison', 14),
      label: 'Prawo',
      value: `${state.postCaptureLawTurnsRemaining} tur`,
      cls: 'green',
      title: postCaptureLawBannerLabel(city) ?? 'Bonus Prawa po podboju',
    });
  }
  appendTabIndicators(mount, orderChips);

  appendW4PctMetricBlock(
    mount,
    pctSubheadHtml('chip-heart', 'Szczęście'),
    state.szPct,
    'linear-gradient(90deg,#3a8a5a,#7ad0a0)',
    // zarzut 6: jedno zaokrąglenie prezentacyjne — ta sama liczba, którą pokazuje karta Religii
    szLinesDoWyswietlenia(state.szLines),
    'Brak składników wpływających na szczęście.',
    undefined,
    // `state.szczescie` = netto pkt Szczęścia (zgodnie z nazwą pola, bez pułapki nazewniczej).
    state.szMax != null ? `(${Math.round(state.szczescie)}/${Math.round(state.szMax)} pkt)` : undefined,
  );
  appendCitizenUpkeepBlock(mount, state.citizenUpkeep, city.population);
  appendW4PctMetricBlock(
    mount,
    pctSubheadHtml('tb-army', 'Prawo'),
    state.prawPct,
    'linear-gradient(90deg,#3a8a5a,#7ad0a0)',
    state.prawLines,
    'Brak składników wpływających na prawo.',
    undefined,
    // UWAGA nazewnicza (evaluator R1, zarzut 1): `state.porzadek` to LEGACY pole niosące
    // netto pkt PRAWA (`orderPanel.ts:18` — "Legacy pkt prawa / pole porzadek historyczne"),
    // NIE to samo co `state.porPct` ("Porządek łącznie" kilka linii niżej). Zweryfikowane
    // ręcznie na żywym silniku (debug-hook, runda 1: netto=9.4 → tu Math.round(9.4)=9).
    // Nie mylić przy przyszłej edycji tego bloku.
    state.prawMax != null ? `(${Math.round(state.porzadek)}/${Math.round(state.prawMax)} pkt)` : undefined,
  );

  appendW4PctMetricBlock(
    mount,
    pctSubheadHtml('cp-order', 'Porządek łącznie'),
    por,
    'linear-gradient(90deg,#a08030,#e8d88a)',
    undefined,
    '',
    (porBlock) => {
      // P-PORZADEK-PANEL-CZYTELNOSC-ROZBICIE (Maciej 2026-08-12): widoczny podział % wkładu
      // Szczęścia i Prawa do wyniku Porządku łącznie tej tury — jedna linia na składnik
      // (nie inline `" · "`), zgodnie z tą samą regułą formatu co pozostałe paski wyżej.
      if (state.szWkladPct != null && state.prawWkladPct != null) {
        const wkladBox = el('div', 'or-lines civ-w4-wklad');
        const szRow = el('div');
        szRow.textContent = `Szczęście: ${Math.round(state.szWkladPct)}% wkładu`;
        const prawRow = el('div');
        prawRow.textContent = `Prawo: ${Math.round(state.prawWkladPct)}% wkładu`;
        wkladBox.appendChild(szRow);
        wkladBox.appendChild(prawRow);
        // R-SZCZESCIE-AUDYT-E-ETYKIETY-PANELU-Q1: powyzsze % to WYNIK tej tury (zalezy od
        // biezacego Szczescia/Prawa w miescie, rosnie/maleje z turami) -- NIE stala regula
        // gry, mimo ze slowo "wkladu" juz odroznia to od "wagi". Realna, stala waga
        // mechanizmu (porzadek_waga_szczescie/porzadek_waga_prawo, society-params.json,
        // biezaca trudnosc) jest doklejona nizej jako punkt odniesienia -- odczyt przez TĘ
        // SAMĄ funkcję co silnik (`loadOrderParams`, juz zaimportowana, juz uzywana wyzej w
        // tym pliku przy `computeOrderStateLocal`), zero przeliczania formuly Porzadku tutaj.
        const difficultyDlaWagi = cfg.difficulty ?? 'normal';
        const wagaParams = loadOrderParams(data.societyParams, difficultyDlaWagi);
        const wagaSzPct = Math.round(wagaParams.wagaSzczescie * 100);
        const wagaPrawPct = Math.round(wagaParams.wagaPrawo * 100);
        const wkladWyjasnienie =
          `Powyższy % to wkład TEJ TURY do wyniku Porządku -- zależy od bieżącego ` +
          `Szczęścia/Prawa w mieście i zmienia się z turami, to NIE jest stała reguła gry. ` +
          `Stała waga bazowa mechanizmu (trudność: ${difficultyDlaWagi}): ` +
          `Szczęście ${wagaSzPct}% / Prawo ${wagaPrawPct}%.`;
        wkladBox.title = wkladWyjasnienie;
        const wkladHint = el('div', 'civ-w4-wklad-hint');
        wkladHint.textContent = `Waga bazowa (${difficultyDlaWagi}): Szczęście ${wagaSzPct}% / Prawo ${wagaPrawPct}%`;
        wkladHint.title = wkladWyjasnienie;
        wkladBox.appendChild(wkladHint);
        porBlock.appendChild(wkladBox);
      }
      if (state.revoltWarning && state.revoltGraceRemaining != null) {
        const st = el('div', 'civ-w4-order-banner crit');
        st.innerHTML = `${cityPanelChipIconWrap('chip-warning', 16)}<span>Grozi bunt · ${state.revoltGraceRemaining} tur</span>`;
        porBlock.appendChild(st);
      } else if (state.rebelState) {
        const st = el('div', 'civ-w4-order-banner rebel');
        st.innerHTML = `${cityPanelChipIconWrap('chip-rebellion', 16)}<span>Rebelia aktywna</span>`;
        porBlock.appendChild(st);
      } else {
        const tn = orderTierUi(state);
        const cls = tn === 0 ? 'ok' : 'warn';
        const ic = tn === 0 ? 'chip-star' : 'chip-warning';
        const st = el('div', `civ-w4-order-banner ${cls}`);
        st.innerHTML = `${cityPanelChipIconWrap(ic, 16)}<span>${bandName}</span>`;
        porBlock.appendChild(st);
      }
    },
  );
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:3551-3580
export function renderZdrowie(mount: HTMLElement, city: CityK07, map: GameMap, data: GameData): void {
  const { total, lines, fromEngine } = resolveCityHealth(city, map, data);
  const pos = lines.filter(l => l.value > 0);
  const neg = lines.filter(l => l.value < 0);
  const posSum = pos.reduce((s, l) => s + l.value, 0);
  const negSum = neg.reduce((s, l) => s + l.value, 0);
  mount.innerHTML = '';
  appendSectionTitleWithDetails(
    mount,
    `<span>Zdrowie miasta</span>${fromEngine ? '' : PH()}`,
    () => buildZdrowieDetailCard(total, lines, posSum, negSum),
  );
  const healthChips: TabIndicatorChip[] = [
    {
      icon: cityPanelChipIcon('cp-health', 14),
      label: '= Razem',
      value: signed(total),
      cls: total >= 5 ? 'green' : total >= 0 ? 'gold' : 'red',
    },
    { icon: cityPanelChipIcon('chip-heart', 14), label: 'Plusy', value: signed(posSum), cls: 'green' },
    { icon: cityPanelChipIcon('chip-death', 14), label: 'Minusy', value: String(negSum), cls: negSum < 0 ? 'red' : 'muted' },
  ];
  appendTabIndicators(mount, healthChips);
  appendW4SignedBreakdownSections(
    mount,
    pctSubheadHtml('chip-heart', 'Składniki zdrowia'),
    lines,
    'Brak modyfikatorów zdrowotnych w tym mieście.',
  );
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:3992-4110
export function renderKultura(mount: HTMLElement, city: CityK07, view: CityView | null): void {
  mount.innerHTML = '';
  const cultState = cfg.getCultureState?.(city.id) ?? undefined;
  const data = gameData();
  const empire = resolveEmpireSnap(city, activeMap, data);

  appendSectionTitleWithDetails(
    mount,
    '<span>Kultura</span>',
    () => view
      ? buildTopBarKulturaDetailCard(city, view, empire)
      : buildKulturaDetailCard(city, view, cultState ?? null, null, data),
  );

  const kultPerTurn = cultState?.przyrost ?? view?.kultura ?? 0;
  const cultChips: TabIndicatorChip[] = [
    {
      icon: cityPanelChipIcon('res-culture', 14),
      label: 'Przyrost',
      value: signed(Math.round(kultPerTurn)),
      cls: kultPerTurn > 0 ? 'gold' : 'muted',
    },
  ];

  if (cultState) {
    const thresholds = cultState.thresholds;
    const prev: number = thresholds.filter((t): t is number => t <= cultState.kulturaSuma).pop() ?? 0;
    const next: number | undefined = thresholds.find(t => t > cultState.kulturaSuma);
    if (next !== undefined && cultState.przyrost > 0) {
      const remain = next - cultState.kulturaSuma;
      const etaC = Math.max(1, Math.ceil(remain / cultState.przyrost));
      cultChips.push({
        icon: cityPanelChipIcon('chip-map', 14),
        label: 'Progi',
        value: `~${etaC} ${tury(etaC)}`,
        cls: 'gold',
        title: `Do kolejnego progu (${next} ${cityPanelChipIcon('res-culture', 14)})`,
      });
    }
    cultChips.push({
      icon: cityPanelChipIcon('chip-map', 14),
      label: 'Zasięg',
      value: `+${cultState.borderRadius}`,
      cls: 'green',
      title: 'Promień granic z kultury',
    });
  } else if (view && view.kultura !== 0) {
    cultChips.push({
      icon: cityPanelChipIcon('res-culture', 14),
      label: 'Zasięg',
      value: signed(view.kultura),
      cls: 'gold',
    });
  }

  appendTabIndicators(mount, cultChips);

  if (cultState?.kulturaMix && cultState.kulturaMix.length > 0) {
    appendCompositionBlock(
      mount,
      'Skład kultury',
      cultState.kulturaMix.map(m => ({
        label: m.label,
        pct: m.pct,
        note: !m.isOwner ? 'konwersja' : (m.pct >= 100 ? 'pełna zgodność' : undefined),
      })),
    );
  }

  const kultLines: BreakdownLine[] = cultState?.zrodla?.map(z => ({ label: z.nazwa, value: z.wartosc })) ?? [];
  if (kultLines.length === 0 && view && view.kultura !== 0) {
    kultLines.push({ label: 'Przyrost z miasta', value: view.kultura });
  }
  appendW4SignedBreakdownSections(
    mount,
    pctSubheadHtml('res-culture', 'Kultura — składniki'),
    kultLines,
    'Brak rozpisanych źródeł kultury (patrz przyrost powyżej).',
  );

  if (cultState) {
    const thresholds = cultState.thresholds;
    const prev: number = thresholds.filter((t): t is number => t <= cultState.kulturaSuma).pop() ?? 0;
    const next: number | undefined = thresholds.find(t => t > cultState.kulturaSuma);
    let pct = 100;
    if (next !== undefined) {
      const span = next - prev;
      pct = span > 0 ? Math.round(Math.min(100, Math.max(0, (cultState.kulturaSuma - prev) / span * 100))) : 0;
    }

    const block = el('div', 'food-grow-block');
    const track = el('div', 'food-grow-track');
    track.style.borderColor = '#503080';
    track.innerHTML =
      `<div class="food-grow-fill" style="width:${pct}%;background:linear-gradient(180deg,#c070ff,#6030a0);"></div>` +
      `<span class="food-grow-loaf" aria-hidden="true">${cityPanelChipIconWrap('res-culture', 14)}</span>`;
    block.appendChild(track);

    const pair = el('div', 'food-stat-pair');
    const statK = el('div', 'food-stat');
    statK.innerHTML =
      `<span class="food-stat-lbl">${cityPanelChipIconWrap('res-culture', 14)} Kultura</span>` +
      `<span class="food-stat-val gold">${cultState.kulturaSuma}${next !== undefined ? ` / ${next}` : ''}</span>`;
    const statG = el('div', 'food-stat');
    statG.style.textAlign = 'right';
    statG.innerHTML =
      `<span class="food-stat-lbl">Granice · +</span>` +
      `<span class="food-stat-val gold">+${cultState.borderRadius} · +${cultState.przyrost}</span>`;
    pair.appendChild(statK);
    pair.appendChild(statG);
    block.appendChild(pair);
    mount.appendChild(block);
  } else {
    const kult = view ? view.kultura : 0;
    const row = el('div', 'rsb');
    row.innerHTML = `<span class="${resourceTextClass('kultura')}">${cityPanelChipIconWrap('res-culture', 14)} ${signed(kult)}</span><span class="muted">podgląd</span>`;
    mount.appendChild(row);
  }
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:8429-8535
export function renderProd(mount: HTMLElement, city: CityK07, view: CityView | null): void {
  mount.innerHTML = '';
  const prod = getProd(city.id);
  const front = frontItem(prod);
  const data = gameData();
  const pracaSplit = view ? cityPracaSplit(city, view, data) : null;
  const pracaBud = pracaSplit?.doBudynkow ?? 0;
  const player = isMeCity(city.ownerId); // AI cities -> read-only (no build/queue controls)
  const hasBuildQueue = prod.kolejka.length > 1;
  const hasRecruitQueue = (prod.rekrutacja ?? []).length > 0;
  const hasAutoToolbar = !!(player && cfg.getBudowaState?.(city.id));
  if (!front && !hasBuildQueue && !hasRecruitQueue && !hasAutoToolbar) {
    mount.style.display = 'none';
    return;
  }
  mount.style.display = '';
  mount.appendChild(el('div', 'ptitle', '<span>Produkcja</span>'));

  if (player && cfg.getBudowaState) {
    const bState = cfg.getBudowaState(city.id);
    if (bState) {
      const bToolbar = el('div', 'okolica-toolbar budowa-toolbar');
      bToolbar.style.cssText = 'margin:0.06em 0 0.18em;';
      const bProfiles = el('div', 'okolica-toolbar-profiles');
      appendBudowaToolbarProfiles(bProfiles, city, bState.priorytetTypow, bState.tryb, bState.lista);
      bToolbar.appendChild(bProfiles);
      if (bState.tryb === 'lista') {
        appendBudowaListaBar(bToolbar, city, bState.lista, bState.biblioteka);
      }
      mount.appendChild(bToolbar);
    }
  }

  if (front) {
    const paused = getProd(city.id).wstrzymana === true;
    const e = paused ? null : etaTurns(front.koszt, prod.postep, pracaBud);
    const pct = front.koszt > 0 ? Math.round(Math.min(1, prod.postep / front.koszt) * 100) : 100;
    const workIc = cityPanelChipIconWrap('res-work', 12);
    const pauseBadge = paused
      ? ' <span style="font-size:0.7em;background:#7a4800;color:#ffd090;border:1px solid #c07020;border-radius:3px;padding:0 0.35em;vertical-align:middle;">wstrzymana</span>'
      : '';
    const row = el('div');
    row.style.cssText = 'display:flex;gap:0.55em;align-items:flex-start;';
    appendProductionPicon(row, data, front);
    if (data && front.kind === 'budynek') {
      const frontIcon = row.querySelector('.picon') as HTMLElement | null;
      const frontDef = findBuildingDef(data, front.id);
      if (frontIcon && frontDef) {
        // Read-only karta aktywnego budynku; podgląd nie dotyka `setProd`.
        attachInteractiveDetail(
          frontIcon,
          () => buildBuildingBuildTabDetailCard(frontDef, data, city, {
            ctx: productionCtxForCity(city),
            techs: cfg.getUnlockedTechs?.(city.ownerId) ?? [],
          }),
          { delayMs: 260, sideHint: 'auto' },
        );
      }
    }
    const body = el('div');
    body.style.flex = '1';
    body.innerHTML =
        `<div style="font-size:1.05em;font-weight:700;" class="gold">${front.nazwa}${pauseBadge}</div>` +
        `<div class="muted" style="font-size:0.78em;">${front.kind === 'budynek' ? 'Budynek' : 'Jednostka'} • Koszt: ${front.koszt} ${workIc}</div>` +
        `<div class="rsb" style="font-size:0.78em;margin:0.22em 0 0.15em;">` +
          `<span class="muted">Zebrana Praca: <span class="gold">${Math.round(prod.postep)} / ${front.koszt}</span> ${workIc}</span>` +
          (paused
            ? `<span style="color:#e08030;font-weight:600;">Wstrzymane — brak postępu</span>`
            : `<span class="blue">${formatBuildEtaLabel(e)}</span>`) +
        `</div>` +
        `<div class="bwrap"><div class="bfill" style="width:${pct}%;background:linear-gradient(90deg,#8a6418,var(--gold));"></div></div>`;
    row.appendChild(body);
    mount.appendChild(row);

    const actions = el('div');
    actions.style.cssText = 'margin-top:0.35em;display:flex;gap:0.3em;flex-wrap:wrap;';
    // Wykup (rush-buy) -- only when the engine exposes treasury + a spend hook.
    if (cfg.getTreasury && cfg.onRushBuy) {
      const koszt = rushCost(prod);
      const skarb = cfg.getTreasury(city.ownerId);
      const stac = skarb >= koszt;
      const wykup = el('button', 'btn btn-g');
      wykup.innerHTML = `${cityPanelChipIconWrap('res-treasury', 14)} Wykup (${koszt})`;
      (wykup as HTMLButtonElement).disabled = !stac;
      wykup.title = stac ? 'Zaplac zlotem i ukoncz natychmiast' : 'Za malo zlota (' + skarb + '/' + koszt + ')';
      wykup.addEventListener('click', () => { cfg.onRushBuy?.(city.id, front, koszt); rerender(); });
      actions.appendChild(wykup);
    }
    // Wstrzymaj / Wznów — przełącza flagę wstrzymana dla pozycji w budowie.
    const wstBtn = el('button', 'btn btn-sm', paused ? 'Wznów' : 'Wstrzymaj');
    wstBtn.title = paused ? 'Wznów produkcję' : 'Wstrzymaj produkcję (postęp zachowany)';
    wstBtn.addEventListener('click', () => {
      const cur = getProd(city.id);
      setProd(city.id, setPaused(cur, !cur.wstrzymana));
      rerender();
    });
    actions.appendChild(wstBtn);
    const usun = el('button', 'btn btn-sm', '✕ Usuń');
    usun.title = 'Usuń z kolejki (zwrot surowców do puli państwa)';
    usun.addEventListener('click', () => { cancelQueueItem(city, 0); });
    actions.appendChild(usun);
    if (player) mount.appendChild(actions);
  }

  appendBuildQueueSection(mount, city, player, prod, pracaBud);
  appendRecruitmentQueue(mount, city, player);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:9306-9324
export function renderBuildSplitPanel(
  mount: HTMLElement,
  city: CityK07,
  data: GameData | null,
  view: CityView | null,
): void {
  mount.innerHTML = '';
  const pane = el('div', 'civ-v-build-pane');
  const mainCol = el('div', 'civ-v-build-main');
  renderBuildList(
    appendPanel(mainCol, 'cs-build'),
    city,
    data,
    view,
    { scrollFill: true },
  );
  pane.appendChild(mainCol);
  mount.appendChild(pane);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10018-10152
export function renderOkolica(root: HTMLElement, city: CityK07, map: GameMap): void {
  const statsEl = root.querySelector('#cs-okstats') as HTMLElement | null;
  const gridEl = root.querySelector('#cs-okolica') as HTMLElement | null;
  const hintEl = root.querySelector('#cs-okhint') as HTMLElement | null;
  const uxMap = isCityUxFrameOpen();
  const toolbarEl = uxMap
    ? document.getElementById('cs-oktoolbar-ux')
    : (document.getElementById('cs-oktoolbar')
      ?? root.querySelector('#cs-oktoolbar') as HTMLElement | null);
  const modeEl = root.querySelector('#cs-okmode') as HTMLElement | null;
  const headEl = uxMap
    ? document.getElementById('cs-okhead-ux')
    : (document.getElementById('cs-okhead')
      ?? root.querySelector('#cs-okhead') as HTMLElement | null);
  const profEl = root.querySelector('#cs-okprof') as HTMLElement | null;
  const compactEl = root.querySelector('#cs-okcompact') as HTMLElement | null;

  const okState = cfg.getOkolicaState?.(city.id);
  const focus = okState?.focus ?? city.okolicaFocus ?? 'zrownowazone';
  const tryb  = okState?.tryb ?? city.okolicaTryb ?? 'auto';

  const Rwork = cfg.getCityWorkedRange?.(city.id);
  const worked = cfg.getWorkedTiles?.(city.id);
  const borderR = cfg.getCultureState?.(city.id)?.borderRadius ?? 0;
  const tilesInRange = Rwork !== undefined ? 1 + 3 * Rwork * (Rwork + 1) : undefined;
  const clickHint = cfg.onOkolicaTileAdjust
    ? 'Klik heks = przypisz/zabierz pracownika. Centrum daje plony bez pracownika. Scroll = zoom.'
    : '';

  const buildDetail = () => buildOkolicaDetailCard(city, {
    Rwork,
    workedCount: worked?.length,
    tilesInRange,
    borderR,
    focus,
    tryb,
    clickHint: Rwork !== undefined
      ? `Pełny zasięg (~${1 + 3 * Rwork * (Rwork + 1) + (borderR > 0 ? ringsTiles(Rwork, borderR) : 0)} pól) na mapie świata.${clickHint ? ' ' + clickHint : ''}`
      : clickHint,
    map,
  });

  if (headEl) {
    headEl.innerHTML = '';
    headEl.className = 'ptitle';
    headEl.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;gap:0.35em;';
    const left = el('span', '');
    left.textContent = 'Zarządzanie polami';
    headEl.appendChild(left);
    const infoLink = el('button', 'okolica-info-link gold');
    infoLink.type = 'button';
    infoLink.textContent = 'ℹ szczegóły';
    infoLink.setAttribute('aria-label', 'Pokaż szczegóły okolicy');
    headEl.appendChild(infoLink);
    attachInteractiveDetail(infoLink, buildDetail, { delayMs: 220, sideHint: 'right' });
  }

  const host = toolbarEl ?? compactEl;
  const useCompactStats = host !== null;

  if (host) {
    host.innerHTML = '';
    host.className = toolbarEl ? 'okolica-toolbar' : 'okolica-compact-row';
    if (profEl) {
      profEl.innerHTML = '';
      profEl.style.display = 'none';
    }

    const profilesWrap = el('div', 'okolica-toolbar-profiles');
    appendOkolicaToolbarProfiles(profilesWrap, city, focus, tryb);
    host.appendChild(profilesWrap);
  } else if (profEl) {
    profEl.style.display = '';
    profEl.innerHTML = '';
    const profilesWrap = el('div', 'okolica-toolbar-profiles');
    appendOkolicaToolbarProfiles(profilesWrap, city, focus, tryb);
    profEl.appendChild(profilesWrap);
    if (tryb === 'reczny') {
      const tag = el('span', 'muted');
      tag.style.cssText = 'font-size:0.72em;margin-left:0.35em;';
      tag.textContent = 'Tryb ręczny';
      profEl.appendChild(tag);
    }
  }

  if (modeEl) {
    if (uxMap) {
      modeEl.textContent = '';
      modeEl.style.display = 'none';
    } else {
      modeEl.style.display = '';
      modeEl.className = 'okolica-mode-hint';
      modeEl.innerHTML = cpInlineIcons(
        `${tryb === 'reczny' ? 'Ręczny' : 'Auto'} · ${worked?.length ?? 0}/${city.population} ${cityPanelChipIconWrap('chip-manpower', 14)}`,
      );
    }
  }

  if (useCompactStats) {
    if (statsEl) {
      statsEl.innerHTML = '';
      statsEl.classList.add('is-collapsed');
    }
    if (hintEl) {
      hintEl.textContent = '';
      hintEl.classList.add('is-collapsed');
    }
  } else if (statsEl) {
    statsEl.classList.remove('is-collapsed');
    statsEl.innerHTML = [
      okStat('Zasięg roboczy', Rwork !== undefined ? `r${Rwork}` : '—', Rwork !== undefined ? rangeName(Rwork) : 'gdy silnik dostarczy'),
      okStat('Pól w zasięgu', tilesInRange !== undefined ? String(tilesInRange) : '—', 'heksów'),
      okStat('Pól obrabianych', worked ? String(worked.length) : '—', cpInlineIcons(`${cityPanelChipIconWrap('chip-manpower', 12)} max ${city.population} obok + ${cityPanelChipIconWrap('cp-buildings', 12)} centrum`)),
      okStat('Granica kultury', borderR > 0 ? `+${borderR}` : '0', borderR > 0 ? 'pierścień(e)' : 'brak'),
    ].join('');
    if (hintEl) {
      hintEl.classList.remove('is-collapsed');
      const fullClick = cfg.onOkolicaTileAdjust
        ? cpInlineIcons(` ${cityPanelChipIconWrap('cp-buildings', 12)} = plony z terenu (bez ${cityPanelChipIconWrap('chip-manpower', 12)}). Max ${cityPanelChipIconWrap('chip-manpower', 12)} obok = ludność. Klik: przypisz/zabierz. Pełna pula + wolne pole = brak efektu. „↩ Przywróć auto”.`)
        : '';
      if (Rwork !== undefined) {
        const total = 1 + 3 * Rwork * (Rwork + 1) + (borderR > 0 ? ringsTiles(Rwork, borderR) : 0);
        hintEl.textContent = `Pełny zasięg (~${total} pól) i granice kultury widoczne na mapie świata.${fullClick}`;
      } else {
        hintEl.textContent = `Pełna okolica widoczna na mapie świata (render po stronie MAPY).${fullClick}`;
      }
    }
  }
  if (gridEl) renderWorkedPreview(gridEl, city, map, worked, okState?.reczne, tryb, okState?.illegalReczneKeys);

  const surowceHost = root.querySelector('#cs-oksurowce') as HTMLElement | null;
  if (surowceHost) {
    renderSurowce(surowceHost, city, true);
  }
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10349-10363
export interface CityPanelUxMounts {
  top: HTMLElement;
  left: HTMLElement;
  /** Pionowy pasek ikon produkcji (budowa, rekrutacja). */
  leftIconRail?: HTMLElement;
  /** Pionowy pasek ikon parametrów miasta (spichlerz, handel…). */
  rightIconRail?: HTMLElement;
  /** Panel szczegółów na prawo od lewej kolumny (garnizon, produkcja…). */
  leftDetailDock?: HTMLElement;
  /** Panel szczegółów na lewo od prawej kolumny (okolica, ekonomia…). */
  detailDock?: HTMLElement;
  right: HTMLElement;
  /** Pływające elementy na mapie (tabliczka miasta, przyciski u dołu). */
  mapChrome?: HTMLElement;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10812-10843
export function renderCityHeaderCompact(mount: HTMLElement, city: CityK07, view: CityView | null): void {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const osobRazem = cityLudnoscAbsolutna(city.population, epoch);
  mount.innerHTML =
    `<div class="civ-v-city-name">${city.name}</div>` +
    `<div class="civ-v-city-pop">${city.population} obywateli · ≈ ${formatManpower(osobRazem)} · epoka ${epoch}</div>`;
  if (!view) {
    mount.appendChild(el('div', 'muted', 'Brak danych ekonomii'));
    return;
  }
  const maxSafe = cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX;
  const foodSplit = cityFoodSplit(view, maxSafe);
  const tick = cfg.getEmpireFoodTick?.(city.ownerId);
  const tickRow = tick?.perCityRows?.find(r => r.cityId === city.id);
  const fed = resolveCityFedForUi(city.id, foodSplit.total, tick);
  // P-WZROSTPROCENT-SUROWY-POZIOM: przycięte do maxSafe (spójne z Bilansem w innych kartach).
  // / EN: clamped to maxSafe (consistent with the Balance shown in other cards).
  const wzrostProcentUi = clampedGrowthBreakdown(view, maxSafe).total;
  const growthPctUi = effectiveGrowthPctForUi(wzrostProcentUi, fed);
  const gainSlots = growthGainPerTurnSlots(city.population, growthPctUi, fed, view.atPopCap);
  const turns = turnsUntilNextCitizen(view.wzrostUlamkowy, gainSlots);
  const etaTxt = view.atPopCap ? 'limit'
    : !fed ? 'brak wzrostu'
      : turns === 0 ? 'w tej turze'
        : turns != null ? `za ≈ ${turns} ${pluralTur(turns)}`
          : '—';
  const grow = el('div', 'civ-v-growth');
  grow.innerHTML =
    `<div class="civ-v-growth-lbl">WZROST · ${fed ? wzrostProcentUi : '—'}% ${loafIconHtml('civ-v-loaf-chip')}</div>` +
    `<div class="muted" style="font-size:0.68em;margin-top:0.12em">Wyżywienie ${formatWyzwienieLabel(view.poziomRacji)} · postęp ${fmtDecPl(view.wzrostUlamkowy)}/1 · ${etaTxt}</div>`;
  mount.appendChild(grow);
}
// pin-end
