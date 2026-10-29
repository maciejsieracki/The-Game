/**
 * K07B partia 2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1, runda 2): jednostki DOM bloku K07 (pin `edb8fb56`,
 * `gra/src/ui/cityPanel.ts`) — appendOkolicaToolbarProfiles, appendBudowaToolbarProfiles, appendBudowaListaBar,
 * renderTopStatsBar, appendPanel, resolveDetailSideHint, appendSectionTitleWithDetails (7 z 15).
 * Pomocnicze stałe i funkcje pinu tego samego obszaru (ścieżki `// pin …` poniżej) są kopiowane z pinu jako bloki
 * z markerami (bramka `verify-k07b-copies.mjs`).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k07b-port.mjs` (bloki = pin + `k07a-subs.mjs` PIN_TO_PORT_NAMES).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k07b-copies.mjs`.
 * Zasady: `dyspozycje/rust-port/p5/P5-8-K07B.md` (K07B-Z1..Z6).
 */

import {
  PH, SCALES, cityPanelBrandIcon, cityPanelChipIcon, cpInlineIcons, effectiveGrowthPctForUi, fmtDecPl,
  formatBuildEtaLabel, loafIconHtml, pctSubheadHtml, pluralTur, signed,
  type BreakdownLine, type BudowaFocus, type OkolicaFocus, type TabIndicatorChip,
} from './k01a-fundament';
import type { OkolicaTryb } from './k05a-fundament';
import { clampedGrowthBreakdown } from './k01b-r';
import { resolveCityFedForUi, type CityView } from './k01b-t';
import { appendTabIndicators, appendW4PctMetricBlock } from './k02-units';
import { appendW4SignedBreakdownSections } from './k02-breakdown';
import { cityFoodSplit } from './k03-model';
import { okStat, ringsTiles, findBuildingDef } from './k05a-fundament';
import { dep, valueProxy } from './k07b-deps';
import type { BrandIconSize } from '../icons/brandAssets';

// ─── K07B-Z5: typy pinu (alias any; zgodność z viewmodel/types.ts — NIE_ZMIERZONO) ───────────────────────────────
type CityK07 = any;
type GameData = { buildings: any[]; [k: string]: any };
type GameMap = any;
/** K07B-Z5: kopia `game/cities.ts:69` (literał unii). */
type BudowaTryb = 'reczny' | 'priorytet' | 'lista' | 'zrownowazone';
/** K07B-Z5: kształt biblioteki listy budowy (`game/cities.ts:73`, `BudowaListaSzablon[]`) — pola czytane przez partię 2 jako any. */
type BudowaListaBiblioteka = any[];

// ─── K07B-Z3: stałe literalne z pinu (kopie `game/cities.ts:396-410`, dane bez reguł) ────────────────────────────────
const DEFAULT_BUDOWA_PRIORYTET_TYPOW: readonly BudowaFocus[] = ['wzrost', 'produkcja', 'wojsko', 'kultura', 'prawo'];
const BUDOWA_TYP_FOCUS: readonly BudowaFocus[] = ['wzrost', 'wojsko', 'kultura', 'prawo', 'produkcja'];

/** K07B-Z4: kształt `cfg` pinu (`CityPanelConfig`) — metody czytane przez partię 2; reszta jako any. */
interface CfgK07b {
  getEmpireFoodTick?: (ownerId: number) => { perCityRows?: any[] } | undefined;
  [k: string]: any;
}
const cfg = valueProxy('cfg') as CfgK07b;

// ─── K07B-Z2/Z4: delegaty funkcji i wartości pinu spoza partii ──────────────────────────────────────────────────────
const el = (...args: any[]): any => dep('el')(...args);
const gameData = (...args: any[]): GameData | null => dep('gameData')(...args);
const activeMap = (...args: any[]): any => dep('activeMap')(...args);
const attachInteractiveDetail = (...args: any[]): any => dep('attachInteractiveDetail')(...args);
const buildableProduction = (...args: any[]): any[] => dep('buildableProduction')(...args);
const cityPanelChipIconWrap = (...args: any[]): any => dep('cityPanelChipIconWrap')(...args);
const cityPanelTitle = (...args: any[]): any => dep('cityPanelTitle')(...args);
const cityPracaSplit = (...args: any[]): any => dep('cityPracaSplit')(...args);
const dedupeBudowaLista = (...args: any[]): any => dep('dedupeBudowaLista')(...args);
const defaultBudowaListaNazwa = (...args: any[]): any => dep('defaultBudowaListaNazwa')(...args);
const sanitizeBudowaPriorytetTypow = (...args: any[]): any => dep('sanitizeBudowaPriorytetTypow')(...args);
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
const resolveCityHealth = (...args: any[]): any => dep('resolveCityHealth')(...args);
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
const appendRecruitmentQueue = (...args: any[]): any => dep('appendRecruitmentQueue')(...args);
const appendProductionPicon = (...args: any[]): any => dep('appendProductionPicon')(...args);
const appendCompositionBlock = (...args: any[]): any => dep('appendCompositionBlock')(...args);
const appendCitizenUpkeepBlock = (...args: any[]): any => dep('appendCitizenUpkeepBlock')(...args);
const appendBuildQueueSection = (...args: any[]): any => dep('appendBuildQueueSection')(...args);
const renderWorkedPreview = (...args: any[]): any => dep('renderWorkedPreview')(...args);
const renderSurowce = (...args: any[]): any => dep('renderSurowce')(...args);
const renderBuildList = (...args: any[]): any => dep('renderBuildList')(...args);
const buildZdrowieDetailCard = (...args: any[]): any => dep('buildZdrowieDetailCard')(...args);
const buildTopBarKulturaDetailCard = (...args: any[]): any => dep('buildTopBarKulturaDetailCard')(...args);
const buildPorzadekDetailCard = (...args: any[]): any => dep('buildPorzadekDetailCard')(...args);
const buildOkolicaDetailCard = (...args: any[]): any => dep('buildOkolicaDetailCard')(...args);
const buildKulturaDetailCard = (...args: any[]): any => dep('buildKulturaDetailCard')(...args);
const buildBuildingBuildTabDetailCard = (...args: any[]): any => dep('buildBuildingBuildTabDetailCard')(...args);

// pin edb8fb56 gra/src/ui/cityPanel.ts:1889-1894
export const OKOLICA_FOCUS_BRAND: Record<OkolicaFocus, string> = {
  zywnosc: 'field-food',
  produkcja: 'field-production',
  podatki: 'field-tax',
  zrownowazone: 'field-balanced',
};
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:1896-1901
export const OKOLICA_FOCUS_SHORT: Record<OkolicaFocus, string> = {
  zywnosc: 'Żyw.',
  produkcja: 'Prod.',
  podatki: 'Podat.',
  zrownowazone: 'Zrówn.',
};
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:1903-1910
export const BUDOWA_FOCUS_BRAND: Record<BudowaFocus, string> = {
  wzrost: 'field-food',
  wojsko: 'tb-army',
  kultura: 'res-culture',
  prawo: 'cp-order',
  produkcja: 'res-work',
  zrownowazone: 'field-balanced',
};
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:1912-1919
export const BUDOWA_FOCUS_SHORT: Record<BudowaFocus, string> = {
  wzrost: 'Wzrost',
  wojsko: 'Wojsko',
  kultura: 'Kultura',
  prawo: 'Prawo',
  produkcja: 'Prod.',
  zrownowazone: 'Zrówn.',
};
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:1921-1928
export const BUDOWA_FOCUS_TITLE: Record<BudowaFocus, string> = {
  wzrost: 'Wzrost — żywność i zdrowie',
  wojsko: 'Wojsko — koszary, obrona',
  kultura: 'Kultura — pomniki i kultura',
  prawo: 'Prawo — administracja i porządek',
  produkcja: 'Produkcja — Praca i warsztaty',
  zrownowazone: 'Zrównoważony rozwój',
};
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:1930-1932
export function okolicaProfileIconHtml(iconId: string, size: BrandIconSize = 24): string {
  return cityPanelBrandIcon(iconId, size, 'okolica-profile-ic');
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:1934-1940
export function setOkolicaProfileButtonContent(btn: HTMLButtonElement, iconId: string, label: string): void {
  btn.classList.add('okolica-profile-btn');
  const ic = okolicaProfileIconHtml(iconId, 24);
  btn.innerHTML = ic
    ? `<span class="okolica-profile-glyph">${ic}</span><span class="okolica-profile-lbl">${label}</span>`
    : label;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:1942-1946
export function setOkolicaProfileButtonIconOnly(btn: HTMLButtonElement, iconId: string, size: BrandIconSize = 20): void {
  btn.classList.add('okolica-profile-btn', 'okolica-profile-btn-ic-only');
  const ic = okolicaProfileIconHtml(iconId, size);
  btn.innerHTML = ic ? `<span class="okolica-profile-glyph">${ic}</span>` : '?';
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11081-11121
export function appendOkolicaToolbarProfiles(
  wrap: HTMLElement,
  city: CityK07,
  focus: OkolicaFocus,
  tryb: OkolicaTryb,
): void {
  const profiles: { id: OkolicaFocus; title: string }[] = [
    { id: 'zywnosc', title: 'Żywność' },
    { id: 'produkcja', title: 'Produkcja' },
    { id: 'podatki', title: 'Podatki' },
    { id: 'zrownowazone', title: 'Zrównoważone' },
  ];
  for (const p of profiles) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = tryb !== 'reczny' && p.id === focus ? 'on' : '';
    setOkolicaProfileButtonContent(b, OKOLICA_FOCUS_BRAND[p.id], OKOLICA_FOCUS_SHORT[p.id]);
    b.title = p.title;
    b.disabled = !cfg.onOkolicaFocusChange;
    b.addEventListener('click', () => { cfg.onOkolicaFocusChange?.(city.id, p.id); rerender(); });
    wrap.appendChild(b);
  }
  if (cfg.onOkolicaEnterManual) {
    const recBtn = document.createElement('button');
    recBtn.type = 'button';
    recBtn.className = 'reczny' + (tryb === 'reczny' ? ' on' : '');
    setOkolicaProfileButtonContent(recBtn, 'chip-manpower', 'Ręczny');
    recBtn.title = 'Ręczne przypisywanie pól na mapie';
    recBtn.addEventListener('click', () => { cfg.onOkolicaEnterManual?.(city.id); rerender(); });
    wrap.appendChild(recBtn);
  }
  if (tryb === 'reczny' && cfg.onOkolicaRestoreAuto) {
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'okolica-restore-btn';
    reset.textContent = '↩';
    reset.title = 'Przywróć auto';
    reset.addEventListener('click', () => { cfg.onOkolicaRestoreAuto?.(city.id); rerender(); });
    wrap.appendChild(reset);
  }
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11123-11236
export function appendBudowaToolbarProfiles(
  wrap: HTMLElement,
  city: CityK07,
  priorytetTypow: BudowaFocus[],
  tryb: BudowaTryb,
  lista: string[],
): void {
  const profiles = BUDOWA_TYP_FOCUS;
  const active = tryb === 'priorytet' ? priorytetTypow : [];
  for (const id of profiles) {
    const idx = active.indexOf(id);
    const inList = idx >= 0;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = tryb === 'priorytet' && inList ? 'on' : '';
    setOkolicaProfileButtonIconOnly(b, BUDOWA_FOCUS_BRAND[id]);
    const prioLabel = inList ? `${idx + 1}. ` : '';
    b.title = `${prioLabel}${BUDOWA_FOCUS_TITLE[id]}${inList ? ` (priorytet ${idx + 1})` : ''}`;
    b.disabled = !cfg.onBudowaPriorytetChange;
    if (inList && tryb === 'priorytet') {
      const badge = document.createElement('span');
      badge.className = 'budowa-prio-badge';
      badge.textContent = String(idx + 1);
      badge.style.cssText =
        'position:absolute;top:-0.15em;right:-0.15em;font-size:0.62em;font-weight:700;' +
        'background:var(--gold);color:#1a1208;border-radius:50%;min-width:1.1em;height:1.1em;' +
        'line-height:1.1em;text-align:center;pointer-events:none;';
      b.style.position = 'relative';
      b.appendChild(badge);
    }
    if (tryb === 'lista') {
      b.title = `Wyjdź z Listy → Priorytet: ${BUDOWA_FOCUS_TITLE[id]}`;
    }
    b.addEventListener('click', () => {
      if (!cfg.onBudowaPriorytetChange) return;
      let next: BudowaFocus[];
      let nextTryb: BudowaTryb;
      if (tryb === 'lista') {
        // Wyjście z Listy — bez duplikowania typów w priorytecie.
        nextTryb = 'priorytet';
        next = priorytetTypow.includes(id) ? [...priorytetTypow] : [...priorytetTypow, id];
        if (next.length === 0) next = [id];
      } else if (tryb === 'zrownowazone') {
        // Wyjście ze zrównoważonego: start od klikniętego typu (nie włączaj całej zapisanej piątki).
        nextTryb = 'priorytet';
        next = [id];
      } else if (tryb === 'reczny') {
        nextTryb = 'priorytet';
        next = priorytetTypow.includes(id) ? [...priorytetTypow] : [...priorytetTypow, id];
        if (next.length === 0) next = [id];
      } else if (inList) {
        nextTryb = 'priorytet';
        next = priorytetTypow.filter(f => f !== id);
        if (next.length === 0) next = [id];
      } else {
        nextTryb = 'priorytet';
        next = [...priorytetTypow, id];
      }
      cfg.onBudowaPriorytetChange?.(city.id, sanitizeBudowaPriorytetTypow(next), nextTryb);
      rerender();
    });
    wrap.appendChild(b);
  }
  if (cfg.onBudowaPriorytetChange) {
    const zrownBtn = document.createElement('button');
    zrownBtn.type = 'button';
    zrownBtn.className = tryb === 'zrownowazone' ? 'on' : '';
    setOkolicaProfileButtonIconOnly(zrownBtn, BUDOWA_FOCUS_BRAND.zrownowazone);
    zrownBtn.title = tryb === 'zrownowazone'
      ? 'Auto zrównoważone (wszystkie kategorie)'
      : BUDOWA_FOCUS_TITLE.zrownowazone;
    zrownBtn.addEventListener('click', () => {
      cfg.onBudowaPriorytetChange?.(
        city.id,
        sanitizeBudowaPriorytetTypow(priorytetTypow),
        'zrownowazone',
      );
      rerender();
    });
    wrap.appendChild(zrownBtn);
  }
  if (cfg.onBudowaListaChange) {
    const listaBtn = document.createElement('button');
    listaBtn.type = 'button';
    listaBtn.className = tryb === 'lista' ? 'on' : '';
    listaBtn.textContent = 'Lista';
    listaBtn.title = tryb === 'lista'
      ? 'Wyjdź z Listy (wróć do Priorytetu) — albo kliknij Ręczny / ikonę typu'
      : 'Lista nazwana — buduj wg kolejności';
    listaBtn.style.cssText = 'font-size:0.68em;padding:0.15em 0.45em;min-width:auto;';
    listaBtn.addEventListener('click', () => {
      if (tryb === 'lista') {
        // Ponowne kliknięcie „Lista” zamyka edytor → Priorytet.
        const next = sanitizeBudowaPriorytetTypow(priorytetTypow);
        cfg.onBudowaPriorytetChange?.(city.id, next, 'priorytet');
      } else {
        cfg.onBudowaListaChange?.(city.id, [...lista], 'lista');
      }
      rerender();
    });
    wrap.appendChild(listaBtn);
  }
  if (cfg.onBudowaEnterManual) {
    const recBtn = document.createElement('button');
    recBtn.type = 'button';
    recBtn.className = 'reczny' + (tryb === 'reczny' ? ' on' : '');
    setOkolicaProfileButtonIconOnly(recBtn, 'chip-manpower');
    recBtn.title = tryb === 'lista'
      ? 'Wyjdź z Listy → Ręczny (własna kolejka budynków)'
      : 'Ręczny — własny wybór budynków w kolejce';
    recBtn.addEventListener('click', () => { cfg.onBudowaEnterManual?.(city.id); rerender(); });
    wrap.appendChild(recBtn);
  }
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11238-11473
export function appendBudowaListaBar(
  parent: HTMLElement,
  city: CityK07,
  lista: string[],
  biblioteka?: BudowaListaBiblioteka,
): void {
  const data = gameData();
  const bar = el('div', 'budowa-lista-bar');
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const buildingName = (id: string): string => {
    const def = data?.buildings.find(b => b.id === id);
    return def?.nazwa ?? id;
  };

  // Jawne wyjście z edytora Listy (Maciej 2026-08-04) — profil typów / Ręczny też działają.
  const head = el('div');
  head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:0.4em;margin-bottom:0.12em;';
  const headLbl = el('span', 'muted');
  headLbl.style.fontSize = '0.72em';
  headLbl.textContent = 'Edycja listy budowy';
  head.appendChild(headLbl);
  if (cfg.onBudowaPriorytetChange || cfg.onBudowaEnterManual) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Zamknij listę';
    closeBtn.title = 'Wyjdź z Listy — wróć do Priorytetu typów (albo Ręczny obok)';
    closeBtn.style.cssText = 'font-size:0.68em;padding:0.12em 0.4em;cursor:pointer;';
    closeBtn.addEventListener('click', () => {
      if (cfg.onBudowaPriorytetChange) {
        const prio = sanitizeBudowaPriorytetTypow(
          city.budowaPriorytetTypow?.length
            ? city.budowaPriorytetTypow
            : DEFAULT_BUDOWA_PRIORYTET_TYPOW,
        );
        cfg.onBudowaPriorytetChange(city.id, prio, 'priorytet');
      } else {
        cfg.onBudowaEnterManual?.(city.id);
      }
      rerender();
    });
    head.appendChild(closeBtn);
  }
  bar.appendChild(head);

  if (lista.length === 0) {
    bar.appendChild(el('div', 'muted', 'Lista pusta — dodaj budynki (+)'));
  } else {
    for (let i = 0; i < lista.length; i++) {
      const id = lista[i];
      if (!id) continue;
      const def = data?.buildings.find(b => b.id === id);
      const bEpoch = def?.epokaWejscia ?? 1;
      const epochLocked = bEpoch > epoch;
      const row = el('div', 'budowa-lista-row');
      if (epochLocked) row.style.opacity = '0.55';
      const name = el('span', 'budowa-lista-name');
      name.textContent = `${i + 1}. ${buildingName(id)}${epochLocked ? ' 🔒' : ''}`;
      row.appendChild(name);
      if (cfg.onBudowaListaChange) {
        const up = document.createElement('button');
        up.type = 'button';
        up.textContent = '↑';
        up.title = 'Wyżej';
        up.disabled = i === 0;
        up.addEventListener('click', () => {
          const next = [...lista];
          const a = next[i - 1];
          const b = next[i];
          if (!a || !b) return;
          next[i - 1] = b;
          next[i] = a;
          cfg.onBudowaListaChange?.(city.id, next, 'lista');
          rerender();
        });
        row.appendChild(up);
        const down = document.createElement('button');
        down.type = 'button';
        down.textContent = '↓';
        down.title = 'Niżej';
        down.disabled = i === lista.length - 1;
        down.addEventListener('click', () => {
          const next = [...lista];
          const a = next[i];
          const b = next[i + 1];
          if (!a || !b) return;
          next[i] = b;
          next[i + 1] = a;
          cfg.onBudowaListaChange?.(city.id, next, 'lista');
          rerender();
        });
        row.appendChild(down);
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.textContent = '✕';
        rm.title = 'Usuń z listy';
        rm.addEventListener('click', () => {
          const next = lista.filter((_, j) => j !== i);
          cfg.onBudowaListaChange?.(city.id, next, 'lista');
          rerender();
        });
        row.appendChild(rm);
      }
      bar.appendChild(row);
    }
  }

  const addRow = el('div');
  addRow.style.cssText = 'display:flex;gap:0.3em;align-items:center;margin-top:0.12em;flex-wrap:wrap;';
  if (cfg.onBudowaListaChange && data) {
    const sel = document.createElement('select');
    sel.style.cssText = 'font-size:0.68em;max-width:9em;';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = '+ dodaj…';
    sel.appendChild(ph);
    const techs = cfg.getUnlockedTechs?.(city.ownerId) ?? [];
    const prodCtx = productionCtxForCity(city);
    const buildableIds = new Set(
      buildableProduction(city, data, techs, prodCtx).map(it => it.id),
    );
    const allBuildings = [...data.buildings].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));
    for (const b of allBuildings) {
      if (lista.includes(b.id)) continue;
      const epochLocked = (b.epokaWejscia ?? 1) > epoch;
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.nazwa;
      if (epochLocked) {
        opt.style.color = '#888';
        opt.textContent += ' 🔒';
      } else if (!buildableIds.has(b.id)) {
        opt.style.color = '#888';
        opt.textContent += ' (zabl.)';
      }
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => {
      const id = sel.value;
      if (!id || lista.includes(id)) return;
      cfg.onBudowaListaChange?.(city.id, dedupeBudowaLista([...lista, id]), 'lista');
      sel.value = '';
      rerender();
    });
    addRow.appendChild(sel);
  }
  bar.appendChild(addRow);

  if (
    cfg.onBudowaListaCreateTemplate
    || cfg.onBudowaListaLoadTemplate
    || cfg.onBudowaListaRenameTemplate
    || cfg.onBudowaListaDeleteTemplate
    || cfg.onBudowaListaLoadAllCities
  ) {
    const tplBar = el('div', 'budowa-lista-slots');
    tplBar.style.cssText = 'display:flex;flex-direction:column;gap:0.2em;margin-top:0.2em;';

    if (cfg.onBudowaListaCreateTemplate && lista.length > 0) {
      const createBtn = document.createElement('button');
      createBtn.type = 'button';
      createBtn.textContent = 'Stwórz listę';
      createBtn.title = 'Zapisz bieżącą listę budynków jako nowy szablon';
      createBtn.addEventListener('click', () => {
        const defaultName = defaultBudowaListaNazwa(biblioteka ?? []);
        const nazwa = window.prompt('Nazwa listy:', defaultName)?.trim();
        if (!nazwa) return;
        cfg.onBudowaListaCreateTemplate?.(city.id, nazwa);
        rerender();
      });
      tplBar.appendChild(createBtn);
    }

    for (const tpl of biblioteka ?? []) {
      const row = el('div');
      row.style.cssText = 'display:flex;gap:0.25em;align-items:center;flex-wrap:wrap;';
      const label = el('span');
      label.textContent = tpl.nazwa;
      label.style.cssText = 'font-size:0.68em;min-width:4em;';
      row.appendChild(label);
      if (cfg.onBudowaListaLoadTemplate) {
        const loadBtn = document.createElement('button');
        loadBtn.type = 'button';
        loadBtn.textContent = 'Wgraj';
        loadBtn.title = `Wgraj „${tpl.nazwa}” (${tpl.budynki.length} pozycji)`;
        loadBtn.addEventListener('click', () => {
          cfg.onBudowaListaLoadTemplate?.(city.id, tpl.id);
          rerender();
        });
        row.appendChild(loadBtn);
      }
      if (cfg.onBudowaListaRenameTemplate) {
        const renameBtn = document.createElement('button');
        renameBtn.type = 'button';
        renameBtn.textContent = 'Zmień nazwę';
        renameBtn.title = `Zmień nazwę „${tpl.nazwa}”`;
        renameBtn.addEventListener('click', () => {
          const nazwa = window.prompt('Nowa nazwa listy:', tpl.nazwa)?.trim();
          if (!nazwa || nazwa === tpl.nazwa) return;
          cfg.onBudowaListaRenameTemplate?.(tpl.id, nazwa);
          rerender();
        });
        row.appendChild(renameBtn);
      }
      if (cfg.onBudowaListaDeleteTemplate) {
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.textContent = 'Usuń';
        delBtn.title = `Usuń szablon „${tpl.nazwa}”`;
        delBtn.addEventListener('click', () => {
          if (!window.confirm(`Usunąć listę „${tpl.nazwa}”?`)) return;
          cfg.onBudowaListaDeleteTemplate?.(tpl.id);
          rerender();
        });
        row.appendChild(delBtn);
      }
      tplBar.appendChild(row);
    }

    if (cfg.onBudowaListaLoadAllCities && lista.length > 0) {
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.textContent = 'Wgraj do wszystkich miast';
      allBtn.title = 'Nadpisze Listę i tryb Lista we wszystkich twoich miastach';
      allBtn.addEventListener('click', () => {
        cfg.onBudowaListaLoadAllCities?.(city.id, [...lista]);
        rerender();
      });
      tplBar.appendChild(allBtn);
    }

    if (tplBar.childNodes.length > 0) {
      bar.appendChild(tplBar);
    }
  }
  parent.appendChild(bar);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11475-11503
export function renderTopStatsBar(mount: HTMLElement, city: CityK07, view: CityView | null): void {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const skarb = cfg.getTreasury?.(city.ownerId);
  const orderSt = cfg.getOrderState?.(city.id);
  const por = orderSt?.porPct;
  const cell = (iconId: string, label: string, val: string, cls = '') =>
    `<td class="civ-ux-td"><span class="civ-ux-tl">${cityPanelChipIconWrap(iconId, 14)}<span>${label}</span></span><span class="civ-ux-tv ${cls}">${val}</span></td>`;

  const rows = view
    ? [
        cell('res-population', 'Ludność', String(city.population)),
        cell('cp-order', 'Epoka', String(epoch)),
        cell('field-food', 'Żywność', signed(view.zywnoscNetto), view.zywnoscNetto >= 0 ? 'green' : 'red'),
        cell('res-work', 'Praca', signed(view.praca), resourceTextClass('praca')),
        cell('res-treasury', 'Pieniądz', signed(view.pieniadz), resourceTextClass('skarbiec')),
        cell('res-science', 'Nauka', signed(view.nauka), resourceTextClass('nauka')),
        cell('res-culture', 'Kultura', signed(view.kultura), resourceTextClass('kultura')),
        por != null ? cell('cp-order', 'Porządek', `${por.toFixed(0)}%`, por >= 60 ? 'green' : por >= 30 ? 'gold' : 'red') : '',
        skarb != null ? cell('res-treasury', 'Skarb', String(skarb), resourceTextClass('skarbiec')) : '',
      ].join('')
    : cell('cp-order', '—', 'Brak danych', 'muted');

  mount.innerHTML =
    `<div class="civ-ux-top-bar">` +
    `<span class="civ-ux-top-city">${cityPanelChipIconWrap('chip-star', 14)} ${cityPanelTitle(city)}</span>` +
    `<table class="civ-ux-top-table"><tr>${rows}</tr></table>` +
    `<button type="button" class="civ-ux-top-close" id="civ-ux-close" title="Zamknij (Esc)">✕</button>` +
    `</div>`;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11505-11510
export function appendPanel(parent: HTMLElement, id?: string): HTMLElement {
  const p = el('div', 'panel panel-tight');
  if (id) p.id = id;
  parent.appendChild(p);
  return p;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11512-11516
export function resolveDetailSideHint(mount: HTMLElement): 'left' | 'right' | 'auto' {
  if (mount.closest('.civ-ux-left')) return 'left';
  if (mount.closest('.civ-ux-right')) return 'right';
  return 'auto';
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11518-11537
export function appendSectionTitleWithDetails(
  mount: HTMLElement,
  titleHtml: string,
  buildDetail: () => HTMLElement,
): void {
  const head = el('div', 'ptitle');
  const left = el('span', '');
  left.innerHTML = titleHtml;
  head.appendChild(left);
  const infoLink = el('button', 'okolica-info-link civ-w4-panel-detail gold');
  infoLink.type = 'button';
  infoLink.textContent = 'i szczegóły';
  infoLink.setAttribute('aria-label', 'Pokaż szczegóły sekcji');
  head.appendChild(infoLink);
  mount.appendChild(head);
  attachInteractiveDetail(infoLink, buildDetail, {
    delayMs: 220,
    sideHint: resolveDetailSideHint(mount),
  });
}
// pin-end
