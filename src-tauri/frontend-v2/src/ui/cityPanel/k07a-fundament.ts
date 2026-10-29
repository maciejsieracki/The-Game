/**
 * K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 3): jednostki K07 (pasek W3 i okolica) bez DOM — 8 z 8 jednostek
 * nie-DOM bloku K07 (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k07a-port.mjs` (bloki jednostek = pin + `k07a-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k07a-copies.mjs`.
 *
 * Jednostki: uxSectionRefresh, W3_STAT_RES_KEY, resolveActiveCity, w3CityChip, capitalBadgeOrButtonHtml (r2),
 * skeleton, buildCityOnlyW3FlankChips, buildCityResourceStatItems (r3).
 * NIEPORTOWANE: 15 jednostek DOM (1 074 LOC) → K07B (osobny temat).
 *
 * Konwencja: ciało jednostki = kopia pinu po TOKENS/LINE_SUBS (`k07a-subs.mjs`). Zależności pinu bez odpowiednika w v2
 * (`cfg.*`, `cityPracaSplit`, `readPodzialHandlu`, `resolveEmpireSnap`, `civWideSixStatsFromEmpireSnap`,
 * `resolveOrderState`, `ownerCities`, `cityPanelTitle`, `headerOrderBadge`, `drawerTabButtons`, `formatManpower`,
 * `daninaLabelForCity`, `isMeCity`, `WYZYWIENIE_MAX`) wchodzą przez adaptery K07A-Z4 (wrappery o nazwach pinu).
 * Czyste formatery i typy v2 (signed, cityPanelChipIcon, resLocalOnly, …) są importowane — NIE kopiowane.
 *
 * ZAŁOŻENIA (K07A-Z1..Z5) i tabela było/jest: `dyspozycje/rust-port/p5/P5-8-K07A.md`.
 */

import { resourceScopeClass, type ResourceColorKey } from '../resourceColors';
import { UI_PARAMS } from '../uiParams';
import {
  SCALES, PH, cityPanelBrandIcon, cityPanelChipIcon, loafIconHtml, resLocalOnly, resGlobalLocal, signed,
  type CityDrawerTab, type EmpireHudSnap, type PodzialHandluSplit,
} from './k01a-fundament';
import { estimateHandelChips, resPracaSplitBar } from './k01b-f';
import { clampedGrowthBreakdown } from './k01b-r';
import type { CityView } from './k01b-t';
import { cityFoodSplit } from './k03-model';
import type { GameData, GameMap } from './k05a-fundament';
import { scienceOwlIconHtml } from '../icons/scienceOwlIcon';

// ─── K07A-Z1: lokalne typy (pola pinu używane przez jednostki K07A) ──────────────────────────────────────────────

/** K07A-Z1: lokalna kopia pól `City` z pinu (game/cities.ts) używanych przez jednostki K07A. */
export interface CityK07 {
  id: string;
  ownerId: number;
  name: string;
  population: number;
  /** Pin: `city.oblegane` (`capitalBadgeOrButtonHtml`, `:10727`). */
  oblegane?: boolean;
}

/** K07A-Z1: kształt wyniku pinu `cityPracaSplit` (:1361) — pola czytane przez jednostki K07A. */
export interface PracaSplitK07 {
  total: number;
  doBudynkow: number;
  doPuli: number;
  pctBudynki: number;
  pctPuli: number;
}

/** K07A-Z1: kształt wyniku pinu `civWideSixStatsFromEmpireSnap` (game/empire-hud-totals) — sześć statystyk. */
export interface SixK07 {
  praca: number;
  zywnosc: number;
  zloto: number;
  nauka: number;
  kultura: number;
  religia: number;
}

// ─── K07A-Z2: wstrzykiwane zależności (wartości z DTO / adaptera) ───────────────────────────────────────────────────

export interface K07aDeps {
  /** Pin `cfg.isMe?.(ownerId) ?? (ownerId === 0)` (`isMeCity`, `cityPanel.ts:617-619`) — adapter liczy fallback. */
  isMe: (ownerId: number) => boolean;
  /** Pin `cfg.getCapitalCityId?.(ownerId) ?? null` (`:10720`) — adapter zwraca null, gdy brak. */
  getCapitalCityId: (ownerId: number) => string | null;
  /** Pin `cfg.getCities?.() ?? []` (`:10725`) — adapter zwraca [], gdy brak. */
  getCities: () => readonly CityK07[];
  /** Pin `!cfg.onSetCapital` (`:10724`) — true, gdy akcja ustawienia stolicy jest dostępna. */
  canSetCapital: boolean;
  /**
   * Pin `buildChipDeltaStockHtml(civRate, civStock)` (`game/empire-hud-totals`, import `cityPanel.ts:78`).
   * W v2 brak odpowiednika — dostarczany przez adapter DTO (K07A-Z2).
   */
  chipDeltaStockHtml: (civRate: number | undefined, civStock: number | undefined) => string;
}

let deps: K07aDeps | null = null;

/** Instaluje zależności K07A (most/kontroler). */
export function setK07aDeps(next: K07aDeps | null): void {
  deps = next;
}

/** K07A-Z2 (r3): brak `setK07aDeps` = wyjątek, NIE cicha utrata tempa/zapasu (pin zawsze dokleja te fragmenty). */
function requireK07aDeps(): K07aDeps {
  if (deps === null) throw new Error('K07A: brak setK07aDeps (tempo/zapas chipa W3 — pin zawsze je dokleja)');
  return deps;
}

// ─── K07A-Z3: stan modułu pinu (`let activeCity`, `let uxSectionRefresh`, `let activeDrawerTab`, `let scalePx`) ──────

/** Pin `let activeCity: City | null = null;` (`cityPanel.ts:10159`). */
let activeCity: CityK07 | null = null;

/** Akcesor K07A-Z3: ustawia `activeCity` (pin: przypisanie w `switchCity`/`openCityPanel`, poza K07A). */
export function setK07aActiveCity(city: CityK07 | null): void {
  activeCity = city;
}

/** Akcesor K07A-Z3: czyta `activeCity`. */
export function getK07aActiveCity(): CityK07 | null {
  return activeCity;
}

/** Akcesor K07A-Z3: rejestracja odświeżania sekcji ramki UX (pin `uxSectionRefresh = …`, `:11766`); `null` = wyrejestrowanie. */
export function setK07aUxSectionRefresh(refresh: (() => void) | null): void {
  uxSectionRefresh = refresh;
}

/** Akcesor K07A-Z3: czy zarejestrowano odświeżanie sekcji ramki UX. */
export function getK07aUxSectionRefresh(): (() => void) | null {
  return uxSectionRefresh;
}

/** K07A-Z3 (r3): pin `let activeDrawerTab: CityDrawerTab = 'plony';` (`cityPanel.ts:1791`). Wiąże kontroler (poza K07A). */
let activeDrawerTab: CityDrawerTab = 'plony';

export function setK07aDrawerTab(tab: CityDrawerTab): void {
  activeDrawerTab = tab;
}

export function getK07aDrawerTab(): CityDrawerTab {
  return activeDrawerTab;
}

/** K07A-Z3 (r3): pin `let scalePx = UI_PARAMS.panel_miasta.font_scale_domyslna_px;` (`cityPanel.ts:919`). */
let scalePx: number = UI_PARAMS.panel_miasta.font_scale_domyslna_px;

export function setK07aScalePx(px: number): void {
  scalePx = px;
}

// ─── K07A-Z4: adaptery zewnętrzne (r3) — `cfg` (akcesory pinu) i `ext` (wyniki reguł/DTO) ─────────────────────────────

/** K07A-Z4: akcesory `cfg.*` pinu używane przez jednostki K07A (kształt jak w pinie; brak = `undefined`). */
export interface K07aCfg {
  getEpoch?: (ownerId: number) => number;
  getMaxSafePoziomRacji?: (cityId: string) => number | undefined;
  getReligionState?: (cityId: string) => { przyrostWiernych?: number; dominujaca?: string; udzialPct?: number } | undefined;
  getManpowerSnapshot?: (cityId: string) => { manpowerBiezacy: number; manpowerMax: number; regenPerTurn: number } | undefined;
  getTreasury?: (ownerId: number) => number | undefined;
  getOrderState?: (cityId: string) => { porPct?: number } | undefined;
}

/** K07A-Z4: funkcje pinu bez odpowiednika w v2 (wynik z DTO/silnika; adapter rozstrzyga fallbacki pinu). */
export interface K07aExt {
  cfg: K07aCfg;
  isMeCity: (ownerId: number) => boolean;
  ownerCities: (city: CityK07) => CityK07[];
  cityPanelTitle: (city: CityK07) => string;
  headerOrderBadge: (city: CityK07) => string;
  drawerTabButtons: (activeTab: CityDrawerTab) => string;
  formatManpower: (n: number) => string;
  daninaLabelForCity: (city: CityK07) => string;
  resolveEmpireSnap: (city: CityK07, map: GameMap | null, data: GameData | null) => EmpireHudSnap;
  cityPracaSplit: (city: CityK07, view: CityView, data: GameData | null) => PracaSplitK07;
  readPodzialHandlu: (city: CityK07, data: GameData | null) => PodzialHandluSplit;
  civWideSixStatsFromEmpireSnap: (empire: EmpireHudSnap, six: SixK07) => SixK07;
  resolveOrderState: (city: CityK07, data: GameData) => { state: { porPct?: number } };
}

let cfg: K07aCfg = {};
let ext: K07aExt | null = null;

/** K07A-Z4: instaluje adaptery (most/kontroler); `cfg` = `ext.cfg`. */
export function setK07aExt(next: K07aExt | null): void {
  ext = next;
  cfg = next?.cfg ?? {};
}

function requireK07aExt(): K07aExt {
  if (ext === null) throw new Error('K07A: brak setK07aExt (adaptery K07A-Z4)');
  return ext;
}

// Wrappery o nazwach pinu (K07A-Z4): ciała jednostek wołają je bez zmian tekstu.
function isMeCity(ownerId: number): boolean {
  return requireK07aExt().isMeCity(ownerId);
}
function ownerCities(city: CityK07): CityK07[] {
  return requireK07aExt().ownerCities(city);
}
function cityPanelTitle(city: CityK07): string {
  return requireK07aExt().cityPanelTitle(city);
}
function headerOrderBadge(city: CityK07): string {
  return requireK07aExt().headerOrderBadge(city);
}
function drawerTabButtons(): string {
  return requireK07aExt().drawerTabButtons(activeDrawerTab);
}
function formatManpower(n: number): string {
  return requireK07aExt().formatManpower(n);
}
function daninaLabelForCity(city: CityK07): string {
  return requireK07aExt().daninaLabelForCity(city);
}
function resolveEmpireSnap(city: CityK07, map: GameMap | null, data: GameData | null): EmpireHudSnap {
  return requireK07aExt().resolveEmpireSnap(city, map, data);
}
function cityPracaSplit(city: CityK07, view: CityView, data: GameData | null): PracaSplitK07 {
  return requireK07aExt().cityPracaSplit(city, view, data);
}
function readPodzialHandlu(city: CityK07, data: GameData | null): PodzialHandluSplit {
  return requireK07aExt().readPodzialHandlu(city, data);
}
function civWideSixStatsFromEmpireSnap(empire: EmpireHudSnap, six: SixK07): SixK07 {
  return requireK07aExt().civWideSixStatsFromEmpireSnap(empire, six);
}
function resolveOrderState(city: CityK07, data: GameData): { state: { porPct?: number } } {
  return requireK07aExt().resolveOrderState(city, data);
}

/** K07A-Z5: kopia stałej pinu `WYZYWIENIE_MAX = 6` (`game/population-growth-v85.ts:28`). */
const WYZYWIENIE_MAX = 6;

// ─── Jednostki K07A (kopie pinu wygenerowane; markery = bramka verify-k07a-copies.mjs) ─────────────────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:10247-10327
export function skeleton(city: CityK07, view: CityView | null): string {
  const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;
  const owner = isMeCity(city.ownerId) ? 'Gracz' : 'AI';
  const multi = ownerCities(city).length > 1;
  const navDis = multi ? '' : 'disabled';
  const fsbtns = SCALES.map(s =>
    `<button class="fsbtn ${s.px === scalePx ? 'active' : ''}" data-px="${s.px}">${s.label}</button>`).join('');
  const tabPanel = (id: CityDrawerTab, inner: string) =>
    `<div class="civ-cs-tab-panel" data-tab="${id}" role="tabpanel"${activeDrawerTab === id ? '' : ' hidden'}>${inner}</div>`;
  return `
  <div class="civ-cs-backdrop" aria-hidden="true"></div>
  <div class="civ-cs-drawer" role="dialog" aria-label="Panel miasta">
    <div id="hdr">
      <button class="nav-arr" id="cs-prev" ${navDis} title="Poprzednie miasto">◀</button>
      <span class="hdr-ic">${cityPanelBrandIcon('chip-star', 18)}</span>
      <span id="cname">${cityPanelTitle(city)}</span>
      <button class="nav-arr" id="cs-next" ${navDis} title="Następne miasto">▶</button>
      <div class="mbadge"><span class="hdr-ic">${cityPanelBrandIcon('res-population', 18)}</span> <b>${city.population}</b></div>
      <div class="era-b">Epoka ${epoch}</div>
      ${headerOrderBadge(city)}
      <div id="hdr-r">
        <button class="hbtn" id="cs-rename" title="Zmień nazwę miasta">✏</button>
        <button class="hbtn" id="cs-manager" title="Zarządca automatyczny"><span class="hdr-ic">${cityPanelBrandIcon('menu-settings', 18)}</span></button>
        <button class="hbtn" id="cs-artview" title="Widok artystyczny"><span class="hdr-ic">${cityPanelBrandIcon('cp-buildings', 18)}</span></button>
        <span class="muted" style="font-size:0.68em;">Aa</span> ${fsbtns}
        <button class="closeb" id="cs-close" title="Zamknij (Esc)"><span class="hdr-ic">${cityPanelBrandIcon('ui-close', 20)}</span></button>
      </div>
    </div>
    <div class="civ-cs-tabs" role="tablist">${drawerTabButtons()}</div>
    <div class="civ-cs-drawer-scroll">
      ${tabPanel('plony', `
        <div class="panel panel-tight" id="cs-magazyn"></div>
        <div class="panel panel-tight" id="cs-ekonomia"></div>
        <div class="panel panel-tight" id="cs-wealth"></div>
        <div class="panel panel-tight" id="cs-imperium"></div>
      `)}
      ${tabPanel('produkcja', `
        <div class="panel panel-tight" id="cs-praca"></div>
        <div class="panel" id="cs-prod"></div>
        <div class="panel" id="cs-build"></div>
        <div class="panel" id="cs-units"></div>
      `)}
      ${tabPanel('miasto', `
        <div class="panel panel-tight" id="cs-spoleczenstwo"></div>
        <div class="panel" id="cs-zdrowie"></div>
        <div class="panel" id="cs-owned"></div>
        <div class="panel" id="cs-kultura"></div>
        <div class="panel" id="cs-religia"></div>
        <div class="mbadge muted" style="align-self:flex-start;">Właściciel: <b class="gold">${owner}</b></div>
      `)}
      ${tabPanel('okolica', `
        <div class="okolica">
          <div id="cs-okhead" class="ptitle"></div>
          <div id="cs-oktoolbar" class="okolica-toolbar"></div>
          <div id="cs-oksurowce" class="okolica-surowce-host"></div>
          <div id="cs-okstats" class="okstats"></div>
          <div class="okwrap">
            <div id="cs-okolica" style="background:var(--panel2);border:1px solid var(--border);border-radius:4px;padding:6px;"></div>
            <div class="oklegend">
              <div class="gold" style="font-weight:700;">Podgląd — pola obrabiane</div>
              <div><span class="sw" style="background:#243a24;"></span>Łąka</div>
              <div><span class="sw" style="background:#3f3815;"></span>Równina</div>
              <div><span class="sw" style="background:#3a2f18;"></span>Wzgórza</div>
              <div><span class="sw" style="background:#142714;"></span>Las</div>
              <div><span class="sw" style="background:#2e2e2e;"></span>Góry</div>
              <div><span class="sw" style="background:#0d2236;"></span>Woda</div>
              <div><span class="sw" style="outline:2px solid #66aaff;"></span>Centrum miasta</div>
              <div style="margin-top:0.3em;"><span class="sw" style="outline:2px solid rgba(107,191,89,.9);"></span>Obrabiane (W = ludność N)</div>
              <div><span class="sw" style="outline:2px solid #e0b24a;"></span>Centrum — plony z terenu (bez W)</div>
            </div>
            <div id="cs-okhint" class="okhint"></div>
          </div>
        </div>
      `)}
    </div>
    <div id="ftr">
      <button class="btn" title="Wróć do mapy" id="cs-mapbtn"><span class="hdr-ic">${cityPanelBrandIcon('chip-map', 18)}</span> Mapa</button>
      <div id="ftr-r"><span class="muted">Esc — zamknij</span><span>Skarb: <span class="gold">${PH()}</span></span></div>
    </div>
  </div>`;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10329-10334
export function resolveK07aActiveCity(): CityK07 | null {
  if (activeCity === null) return null;
  const fresh = deps?.getCities().find(c => c.id === activeCity!.id);
  if (fresh) activeCity = fresh;
  return activeCity;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10365-10365
let uxSectionRefresh: (() => void) | null = null;
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10384-10391
export const W3_STAT_RES_KEY_K07: Record<string, ResourceColorKey | undefined> = {
  praca: 'praca',
  zywnosc: 'zywnosc',
  zloto: 'skarbiec',
  nauka: 'nauka',
  kultura: 'kultura',
  religia: 'religia',
};
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10393-10419
export function w3CityChipK07(
  icon: string,
  label: string,
  val: string,
  cls: string,
  statId: string,
  hint: string,
  /** R-HUD-MIASTO-STOCK-TEMPO-TRZY-ELEMENTY: mała liczba (+N) = tempo CAŁEJ
   *  cywilizacji (suma wszystkich miast). Duża liczba (`val`) = tempo TEGO miasta.
   *  / EN: small number = civ-wide rate; big number (`val`) = this city's rate. */
  civRate?: number,
  /** Trzeci element `(N)`: realny ZAPAS całej cywilizacji — ta sama wielkość co duża
   *  liczba na głównym HUD mapy, więc od P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1 nosi ten sam
   *  kolor TOŻSAMOŚCI surowca co tam (paleta), a nie własny odcień złota.
   *  / EN: civ-wide stock — same quantity as the map HUD big number, same palette color. */
  civStock?: number,
): string {
  const resKey = W3_STAT_RES_KEY_K07[statId];
  const resScope = resKey ? ` ${resourceScopeClass(resKey)}` : '';
  return `<button type="button" class="civ-v-w3-chip${resScope} civ-v-res-interactive" data-res-stat="${statId}" ` +
    `title="${hint.replace(/"/g, '&quot;')}" aria-label="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-w3-chip-icon">${icon}</span>` +
    `<span class="civ-v-w3-chip-lbl">${label}</span>` +
    `<span class="civ-v-w3-chip-val ${cls}">${val}</span>` +
    requireK07aDeps().chipDeltaStockHtml(civRate, civStock) +
    `</button>`;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10432-10579
export function buildCityOnlyW3FlankChips(
  city: CityK07,
  view: CityView,
  data: GameData | null,
  map: GameMap | null,
): { left: string; right: string } {
  const pracaSplit = cityPracaSplit(city, view, data);

  const splitHandel = readPodzialHandlu(city, data);
  const est = estimateHandelChips(view, splitHandel);
  const skarbHandel = est.skarb;
  const wealthHandel = est.zam;
  const daninaLblChip = daninaLabelForCity(city);

  const maxSafe = cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX;
  const foodSplit = cityFoodSplit(view, maxSafe);
  // P-WZROSTPROCENT-SUROWY-POZIOM: WZROST% w tooltipie chipu Żywność przycięty do maxSafe.
  // / EN: WZROST% in the Food chip tooltip, clamped to maxSafe.
  const wzrostProcentUi = clampedGrowthBreakdown(view, maxSafe).total;

  const relSt = cfg.getReligionState?.(city.id);
  const cityRel = Math.round(relSt?.przyrostWiernych ?? 0);

  const empire = resolveEmpireSnap(city, map, data);
  const civ = civWideSixStatsFromEmpireSnap(empire, {
    praca: pracaSplit.total,
    zywnosc: foodSplit.total,
    zloto: view.pieniadz,
    nauka: view.nauka,
    kultura: view.kultura,
    religia: cityRel,
  });
  /**
   * Trzy elementy każdego chipu, zebrane per surowiec, żeby 7. i 8. argument
   * `w3CityChipK07(...)` NIGDY nie rozjechały się na różne surowce.
   * `big`   — tempo TEGO miasta (duża liczba);
   * `small` — tempo CAŁEJ cywilizacji (mała liczba `+N`);
   * `stock` — realny ZAPAS całej cywilizacji (trzeci element, złoty, w nawiasie).
   * / EN: per-resource triple (this-city rate, civ-wide rate, civ-wide stock).
   *
   * ⚠ Zastrzeżenie (N3 z R-HUD-MIASTO-KOREKTA-ZAPAS-VS-TEMPO, przeniesione 1:1):
   * dla Pracy i Żywności `big` (tempo tego miasta) NIE jest w całości tym, co
   * dolicza się do `stock` — Praca dzieli się na `doBudynkow` (kolejka budowy
   * tego miasta) i `doPuli` (pula imperium); `doBudynkow` NIE trafia do puli,
   * DOPÓKI kolejka budowy nie jest pusta (`game/production.ts`, przelew reszty
   * do puli przy pustej kolejce). Analogicznie Żywność: `big` to netto miasta,
   * `stock` to zapasy państwa. Obie liczby są uczciwie nazwane w podpowiedzi.
   */
  const chip = {
    praca:   { big: pracaSplit.total, small: civ.praca,   stock: empire.pracaPool ?? 0 },
    zywnosc: { big: foodSplit.total,  small: civ.zywnosc, stock: empire.zywnoscReserve ?? 0 },
    zloto:   { big: view.pieniadz,    small: civ.zloto,   stock: empire.zloto ?? 0 },
    nauka:   { big: view.nauka,       small: civ.nauka,   stock: empire.nauka ?? 0 },
    kultura: { big: view.kultura,     small: civ.kultura, stock: empire.kultura ?? 0 },
    religia: { big: cityRel,          small: civ.religia, stock: empire.religionStock ?? 0 },
  };
  const pracaCls = chip.praca.big > 0 ? 'green' : chip.praca.big < 0 ? 'red' : '';
  const foodCls = chip.zywnosc.big > 0 ? 'green' : chip.zywnosc.big < 0 ? 'red' : '';
  const goldCls = chip.zloto.big > 0 ? 'green' : chip.zloto.big < 0 ? 'red' : '';
  // P-KOLOR-SUROWCE-MIASTO-VS-MAPA-Q1: klasa niesie już WYŁĄCZNIE stan (deficyt),
  // tożsamość surowca daje paleta przez `--civ-res-self`. Wcześniej Nauka wpisywała tu
  // 'blue', a Kultura/Religia 'gold' — dwa literały tożsamości poza jakimkolwiek kanonem.
  const naukaCls = chip.nauka.big < 0 ? 'red' : '';
  const kultCls = chip.kultura.big < 0 ? 'red' : '';
  const relCls = chip.religia.big < 0 ? 'red' : '';

  const economyRow = [
    w3CityChipK07(
      cityPanelChipIcon('res-work', 20),
      'Praca',
      signed(chip.praca.big),
      pracaCls,
      'praca',
      `Praca TEGO miasta ${signed(chip.praca.big)} ` +
        `(budynki ${signed(pracaSplit.doBudynkow)} · pula ${signed(pracaSplit.doPuli)}) · ` +
        `cała cywilizacja ${signed(chip.praca.small)} / turę netto` +
        (empire.pracaUpkeep != null
          ? ` (wpływ do puli ${signed((chip.praca.small ?? 0) + empire.pracaUpkeep)} ` +
            `− utrzymanie ulepszeń surowcowych ${empire.pracaUpkeep} pkt Pracy/turę)`
          : '') +
        ` · zapas cywilizacji ${chip.praca.stock}`,
      chip.praca.small,
      chip.praca.stock,
    ),
    w3CityChipK07(
      cityPanelChipIcon('res-food', 20),
      'Żywność',
      signed(chip.zywnosc.big),
      foodCls,
      'zywnosc',
      `Żywność TEGO miasta: produkcja ${signed(foodSplit.produkcja)} − racje ${foodSplit.racje} = ` +
        `${signed(chip.zywnosc.big)} · WZROST ${wzrostProcentUi}% · cała cywilizacja ` +
        `${signed(chip.zywnosc.small)} / turę · zapas cywilizacji ${chip.zywnosc.stock}`,
      chip.zywnosc.small,
      chip.zywnosc.stock,
    ),
    w3CityChipK07(
      cityPanelChipIcon('res-treasury', 20),
      'Skarbiec',
      signed(chip.zloto.big),
      goldCls,
      'zloto',
      `Netto pieniędzy TEGO miasta ${signed(chip.zloto.big)} → skarbiec · ` +
        `${daninaLblChip.toLowerCase()} → skarb ${signed(skarbHandel)} · zamożność ${signed(wealthHandel)} · ` +
        `cała cywilizacja ${signed(chip.zloto.small)} / turę · zapas skarbca ${chip.zloto.stock}`,
      chip.zloto.small,
      chip.zloto.stock,
    ),
  ].join('');

  const cultureRow = [
    w3CityChipK07(
      cityPanelChipIcon('res-science', 20),
      'Nauka',
      signed(chip.nauka.big),
      naukaCls,
      'nauka',
      `Nauka TEGO miasta ${signed(chip.nauka.big)} / turę · cała cywilizacja ` +
        `${signed(chip.nauka.small)} / turę · nauka nagromadzona cywilizacji ${chip.nauka.stock}`,
      chip.nauka.small,
      chip.nauka.stock,
    ),
    w3CityChipK07(
      cityPanelChipIcon('res-culture', 20),
      'Kultura',
      signed(chip.kultura.big),
      kultCls,
      'kultura',
      `Kultura TEGO miasta ${signed(chip.kultura.big)} / turę · cała cywilizacja ` +
        `${signed(chip.kultura.small)} / turę · kultura nagromadzona cywilizacji ${chip.kultura.stock}`,
      chip.kultura.small,
      chip.kultura.stock,
    ),
    w3CityChipK07(
      cityPanelChipIcon('res-religion', 20),
      'Religia',
      signed(chip.religia.big),
      relCls,
      'religia',
      `Przyrost wiernych TEGO miasta ${signed(chip.religia.big)} / turę · cała cywilizacja ` +
        `${signed(chip.religia.small)} / turę · wierni religii państwa ${chip.religia.stock}`,
      chip.religia.small,
      chip.religia.stock,
    ),
  ].join('');

  return { left: economyRow, right: cultureRow };
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10581-10692
export function buildCityResourceStatItems(
  city: CityK07,
  view: CityView | null,
  map: GameMap | null,
  data: GameData | null,
  w3 = false,
): string {
  const empire = resolveEmpireSnap(city, map, data);
  if (w3) {
    return '';
  }

  let items = resLocalOnly(
    cityPanelChipIcon('res-population', 20),
    String(city.population),
    'muted',
    'Ludność tego miasta — kliknij po szczegóły',
    'ludnosc',
  );

  const mpSnap = cfg.getManpowerSnapshot?.(city.id);
  if (mpSnap) {
    items += `<span class="civ-v-res-sep"></span>`;
    items += resLocalOnly(
      cityPanelChipIcon('tb-army', 20),
      `${formatManpower(mpSnap.manpowerBiezacy)}/${formatManpower(mpSnap.manpowerMax)}`,
      'gold',
      `Rekruci (Manpower) · +${formatManpower(mpSnap.regenPerTurn)} · kliknij po szczegóły`,
      'rekruci',
    );
  }

  if (view) {
    const pracaPool = empire.pracaPool ?? empire.pracaRate ?? 0;
    const pracaSplit = cityPracaSplit(city, view, data);
    items += `<span class="civ-v-res-sep"></span>`;
    const foodCls = view.zywnoscNetto > 0 ? 'green' : view.zywnoscNetto < 0 ? 'red' : 'gold';
    items += resLocalOnly(
      loafIconHtml(),
      signed(view.zywnoscNetto),
      foodCls,
      `Netto żywności tego miasta · zapasy armii na HUD mapy · kliknij po szczegóły`,
      'zywnosc',
    );
    items += resPracaSplitBar(
      String(Math.round(pracaPool)),
      pracaSplit.doBudynkow,
      pracaSplit.doPuli,
      `Pula Pracy imperium · to miasto ${signed(pracaSplit.total)} · kliknij po szczegóły`,
      'praca',
    );
    items += resGlobalLocal(
      cityPanelChipIcon('res-treasury', 20),
      String(Math.round(empire.zloto ?? cfg.getTreasury?.(city.ownerId) ?? 0)),
      view.pieniadz,
      'gold',
      `Skarbiec imperium · ten gród: ${signed(view.pieniadz)} · kliknij po szczegóły`,
      'zloto',
    );
    if (empire.nauka != null) {
      items += resGlobalLocal(
        scienceOwlIconHtml(),
        String(Math.round(empire.nauka)),
        view.nauka,
        'blue',
        `Bank nauki imperium · ten gród: ${signed(view.nauka)} · kliknij po szczegóły`,
        'nauka',
      );
    } else {
      items += resGlobalLocal(
        scienceOwlIconHtml(),
        String(Math.round(empire.naukaRate ?? view.nauka)),
        view.nauka,
        'blue',
        `Nauka imperium · ten gród: ${signed(view.nauka)} · kliknij po szczegóły`,
        'nauka',
      );
    }
    items += resGlobalLocal(
      cityPanelChipIcon('res-culture', 20),
      String(Math.round(empire.kulturaRate ?? view.kultura)),
      view.kultura,
      'gold',
      `Kultura imperium · ten gród: ${signed(view.kultura)} · kliknij po szczegóły`,
      'kultura',
    );
    const relSt = cfg.getReligionState?.(city.id);
    const relName = empire.stateReligion ?? relSt?.dominujaca ?? '—';
    const relStock = empire.religionStock ?? 0;
    const cityRelDelta = relSt?.przyrostWiernych ?? 0;
    items += resGlobalLocal(
      cityPanelChipIcon('res-religion', 20),
      String(Math.round(relStock)),
      cityRelDelta,
      'gold',
      `Wierni „${relName}” (${empire.religionSharePct ?? relSt?.udzialPct ?? 0}%) · kliknij po szczegóły`,
      'religia',
    );
  }
  const orderSt = cfg.getOrderState?.(city.id);
  const porPct = orderSt?.porPct ?? (data ? resolveOrderState(city, data).state.porPct : null);
  if (porPct != null) {
    items += resLocalOnly(
      cityPanelChipIcon('cp-order', 20),
      `${porPct.toFixed(0)}%`,
      porPct >= 60 ? 'green' : 'gold',
      'Porządek w tym mieście — kliknij po szczegóły',
      'porzadek',
    );
  }
  return items;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10719-10734
export function capitalBadgeOrButtonHtmlK07(city: CityK07): string {
  const capitalId = deps?.getCapitalCityId(city.ownerId) ?? null;
  if (capitalId != null && capitalId === city.id) {
    return `<span class="civ-v-w3-capital-badge" title="Stolica">★ Stolica</span>`;
  }
  if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return '';
  const allCitiesForCapital = deps?.getCities() ?? [];
  const capitalCity = capitalId ? allCitiesForCapital.find(c => c.id === capitalId) : null;
  const besieged = !!capitalCity?.oblegane;
  if (besieged) {
    return `<button type="button" class="civ-v-w3-capital-btn" disabled ` +
      `title="Obecna stolica (${capitalCity?.name ?? '?'}) jest oblegana — nie można przenieść">Ustaw jako stolicę</button>`;
  }
  return `<button type="button" class="civ-v-w3-capital-btn" id="civ-v-set-capital" ` +
    `title="Przenieś stolicę do tego miasta (za darmo)">Ustaw jako stolicę</button>`;
}
// pin-end
