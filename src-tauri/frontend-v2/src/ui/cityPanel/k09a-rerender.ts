/**
 * K09A-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 1, partia `rerender`): jednostki orkiestracji K09 bloku
 * panelu miasta (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`) — `switchCity`, `rerender`, `renderCityIconRightRail`.
 * 3 jednostki = 127 LOC pinu (`P5-8-CITYPANEL-PODZIAL.md` §4, K09; cięcia §3: `rerender`/`switchCity`/`renderCityIconRightRail`).
 *
 * Markery `// pin edb8fb56 …` … `// pin-end` = bramka `tools/dom-harness/verify-k09a-copies.mjs`. Edycja ręczna bloku = FAIL.
 * Stan modułu pinu: `activeCity`/`activeMap`/`activeOnClose`/`pinnedGarrisonCityId` → akcesory K06A; `uxSectionRefresh`
 * → K07A; `scalePx` → K07A; `activeDrawerTab` → K07A; `activeCityPanelTab` → K08A; `rootEl` → K06B (K09A-Z1).
 * Cięcie cyklu `hideCityPanel` → `requireK09aDeps().hideCityPanel` (K09A-Z2). Haki `cfg` → `getK09aHooks()` (K09A-Z3).
 */
import { el } from './k01b-dom';
import { CITY_PANEL_ICONS_RIGHT, resolveK08aActiveCity } from './k08a-fundament';
import { renderCityIconRail } from './k08b-rail';
import { renderWealth } from './k08d-wealth';
import { renderPurchasableUnits } from './k08b-purchase';
import { renderBuildingsOwned } from './k08b-owned';
import { renderPodzialPracy } from './k08c-podzial';
import { renderMagazyn } from './k08e-magazyn';
import { renderReligia } from './k08d-religia';
import { renderBuildList } from './k06b-kolejki';
import { renderEkonomiaStrip } from './k05b-podzial';
import { renderImperiumZywnosc } from './k01b-dom';
import { renderSpoleczenstwo, renderZdrowie, renderKultura, renderProd, renderOkolica } from './k07b-p1';
import {
  skeleton, getK07aDrawerTab, setK07aDrawerTab, getK07aScalePx, setK07aScalePx, getK07aUxSectionRefresh,
  setK07aActiveCity, type CityK07,
} from './k07a-fundament';
import { getK06aState, setK06aActive, ownerCitiesForNav, type CityK06 } from './k06a-fundament';
import { getK06bRootEl, clearGarrisonPanel } from './k06b-garnizon';
import { cfg, daninaLabelForCity, daninaLabelGenitive, type City, type GameData } from './k05b-host';
import { gameData } from './k05a-fundament';
import type { CityDrawerTab } from './k01a-fundament';
import { computeView } from './k08c-deps';
import { getK09aHooks, requireK09aDeps } from './k09a-deps';

// ─── K09A-1: zapis aktywnego miasta (lustra K06A i K07A, pin `activeCity = …`) ─────────────────────────────────────────

/** K09A-Z7: `gameData()` pinu w dwóch typach v2 (`k05a` i `k05b-host`); jedno rzutowanie w jednym miejscu. */
export function readGameDataK09a(): GameData | null {
  return (gameData() ?? null) as unknown as GameData | null;
}

/** Odczyt `activeCity` (pin `let activeCity`; lustro K06A — zapisywane razem z K07A przez `writeActiveCityK09a`). */
function readActiveCityK09a(): City | null {
  return getK06aState().activeCity as unknown as City | null;
}

/** Zapis `activeCity` (pin `activeCity = next`): oba lustra, `activeMap`/`activeOnClose` bez zmian (K08A-Z3). */
function writeActiveCityK09a(city: City): void {
  const st = getK06aState();
  setK07aActiveCity(city as unknown as CityK07);
  setK06aActive(city as unknown as CityK06, st.activeMap, st.activeOnClose);
}

// ─── Jednostki K09A-1 (kopie pinu wygenerowane ręcznie; markery = bramka verify-k09a-copies.mjs) ─────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:10209-10221
export function switchCity(dir: -1 | 1): void {
  const cur = readActiveCityK09a();
  if (cur === null) return;
  const list = ownerCitiesForNav(cur as unknown as CityK06) as unknown as City[];
  if (list.length < 2) return;
  const idx = list.findIndex(c => c.id === cur.id);
  if (idx < 0) return;
  const next = list[(idx + dir + list.length) % list.length];
  if (!next || next.id === cur.id) return;
  clearGarrisonPanel();
  writeActiveCityK09a(next);
  getK09aHooks().onSwitchCity?.(next.id);
  rerender();
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11855-11941
export function rerender(): void {
  const refresh = getK07aUxSectionRefresh();
  if (refresh) {
    refresh();
    return;
  }
  requireK09aDeps().setHoverDetailDocks(null);
  const root = getK06bRootEl();
  const mapNow = getK06aState().activeMap;
  if (root === null || mapNow === null) return;
  const city = resolveK08aActiveCity() as unknown as City | null;
  if (!city) return;
  const map = mapNow, data = readGameDataK09a();
  const view = data ? computeView(city, map, data) : null;

  root.style.fontSize = getK07aScalePx() + 'px';
  root.innerHTML = skeleton(city as unknown as CityK07, view);

  root.querySelectorAll('.civ-cs-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).getAttribute('data-tab') as CityDrawerTab | null;
      if (tab && tab !== getK07aDrawerTab()) {
        setK07aDrawerTab(tab);
        rerender();
      }
    });
  });

  const q = (id: string) => root.querySelector('#' + id) as HTMLElement | null;
  const eko = q('cs-ekonomia'); if (eko) renderEkonomiaStrip(eko, city, view, data);
  const wealth = q('cs-wealth'); if (wealth) renderWealth(wealth, city, data, view);
  const pracaEl = q('cs-praca');
  if (pracaEl) {
    if (cfg.onPodzialPracyChange) {
      pracaEl.style.display = '';
      renderPodzialPracy(pracaEl, city, view, data);
    } else {
      pracaEl.style.display = 'none';
      pracaEl.innerHTML = '';
    }
  }
  const mag = q('cs-magazyn'); if (mag) renderMagazyn(mag, city, view);
  const imp = q('cs-imperium'); if (imp) renderImperiumZywnosc(imp, city as unknown as Parameters<typeof renderImperiumZywnosc>[1]);
  const prod = q('cs-prod'); if (prod) renderProd(prod, city as unknown as CityK07, view);
  const build = q('cs-build'); if (build) renderBuildList(build, city, data, view);
  const units = q('cs-units'); if (units) renderPurchasableUnits(units, city, data);
  const owned = q('cs-owned'); if (owned) renderBuildingsOwned(owned, city, data);
  const spol = q('cs-spoleczenstwo'); if (spol && data) renderSpoleczenstwo(spol, city as unknown as CityK07, data);
  const zdr = q('cs-zdrowie'); if (zdr && data) renderZdrowie(zdr, city as unknown as CityK07, map, data);
  renderOkolica(root, city as unknown as CityK07, map);
  const kult = q('cs-kultura'); if (kult) renderKultura(kult, city as unknown as CityK07, view);
  const relig = q('cs-religia'); if (relig) renderReligia(relig, city, view, data);

  const close = q('cs-close'); if (close) close.addEventListener('click', () => { getK06aState().activeOnClose(); requireK09aDeps().hideCityPanel(); });
  const mapbtn = q('cs-mapbtn');
  if (mapbtn) {
    mapbtn.addEventListener('click', () => {
      const hooks = getK09aHooks();
      if (hooks.onOpenMapForOkolica) {
        hooks.onOpenMapForOkolica(city.id);
      } else {
        getK06aState().activeOnClose();
        requireK09aDeps().hideCityPanel();
      }
    });
  }
  const prev = q('cs-prev'); if (prev) prev.addEventListener('click', () => switchCity(-1));
  const next = q('cs-next'); if (next) next.addEventListener('click', () => switchCity(1));
  const rename = q('cs-rename'); if (rename) rename.addEventListener('click', () => {
    // K09A-Z6: `City.name` w v2 jest opcjonalne; pin ma pole zawsze (`?? ''` tylko dla typu).
    const nn = window.prompt('Nowa nazwa miasta:', city.name ?? '');
    if (nn && nn.trim()) { getK09aHooks().onRename?.(city.id, nn.trim()); rerender(); }
  });
  const manager = q('cs-manager');
  if (manager) {
    if (getK09aHooks().isAutoManageEnabled?.(city.id)) {
      manager.classList.add('active');
      manager.setAttribute('title', 'Zarządca automatyczny — WŁĄCZONY');
    } else {
      manager.classList.remove('active');
      manager.setAttribute('title', 'Zarządca automatyczny — wyłączony');
    }
    manager.addEventListener('click', () => { getK09aHooks().onAutoManage?.(city.id); rerender(); });
  }
  const artview = q('cs-artview'); if (artview) artview.addEventListener('click', () => { getK09aHooks().onArtView?.(city.id); });
  root.querySelectorAll('.fsbtn').forEach(b => {
    b.addEventListener('click', () => {
      const px = Number((b as HTMLElement).getAttribute('data-px'));
      if (Number.isFinite(px) && px > 0) { setK07aScalePx(px); rerender(); }
    });
  });
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10793-10809
export function renderCityIconRightRail(mount: HTMLElement, city: City): void {
  mount.innerHTML = '';
  const scope = el('div', 'civ-cs civ-ux-panel-scope');
  mount.appendChild(scope);
  const iconMount = el('div', 'civ-v-icon-rail-mount');
  iconMount.id = 'cs-icon-rail-right';
  scope.appendChild(iconMount);
  // Decyzje 65B/66B: tytul zakladki 'handel' (tooltip ikony) odzwierciedla
  // Danina/Podatek tej cywilizacji -- CITY_PANEL_ICONS_RIGHT jest stalym
  // modulowym configiem, wiec podmieniamy title per-render zamiast trzymac
  // dynamiczny tekst w stalej.
  const daninaLbl = daninaLabelForCity(city);
  const items = CITY_PANEL_ICONS_RIGHT.map(item => item.id === 'handel'
    ? { ...item, title: `Podział ${daninaLabelGenitive(daninaLbl)} i zamożność — suwaki Skarb / Nauka / Zamożność` }
    : item);
  renderCityIconRail(iconMount, items, true, true);
}
// pin-end
