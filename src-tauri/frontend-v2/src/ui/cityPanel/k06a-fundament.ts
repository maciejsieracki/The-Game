/**
 * K06A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1, runda 2): jednostki K06 (kolejki i lista produkcji) bez DOM.
 *
 * Zakres: 16 jednostek nie-DOM bloku K06 wg `pomiar-r2.json` (blok 6, 37 jednostek, 1 439 LOC; DOM 21 → K06B).
 * Wybór: `tools/dom-harness/select-k06a.mjs` (wynik `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1/r2-logi/`).
 *
 * Konwencja (jak K05A r3, ZAŁOŻENIE K06A-Z4): ciało jednostki jest kopią pinu (`// pin edb8fb56 gra/src/...:A-B`),
 * a wywołania reguł/zależności z innych kawałków (cityPanelChipIconWrap, tileYield, axialToWorld, formatCityMapLabel,
 * CITY_TABS, switchCity, cfg) idą przez delegatory do `K06aDeps` / `K06aCfg`, których wartości przychodzą z DTO
 * (P5.13: UI nie liczy reguł gry). Importy wartości z K05A (`k05a-fundament.ts`) — bez duplikacji.
 *
 * Wyjątki udokumentowane w P5-8-K06A.md §3:
 *   K06A-Z5 — lokalne typy `CityK06` (pola pinu `City` używane przez jednostki K06), `HexK06`.
 *   K06A-Z6 — `IMPROVEMENT_KEY_TO_NAME` (const IIFE na danych JSON) → `buildImprovementKeyToName(rows)`; dane wstrzykiwane.
 *   K06A-Z7 — stan modułu pinu (`let activeCity`, `activeMap`, `activeOnClose`, `pinnedGarrisonCityId`) → zmienne
 *             modułu z akcesorami (pin: bez eksportu).
 */

import {
  improvementKeysForHex,
  type GameMap,
  type HexLike,
  type OkolicaTryb,
} from './k05a-fundament';

// ─── K06A-Z5: lokalne typy (kopie pól pinu) ──────────────────────────────────────────────────────────────────────────

/** K06A-Z5: lokalna kopia typu `City` z pinu (game/cities.ts) — pola używane przez jednostki K06A. */
export interface CityK06 {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  name: string;
  population: number;
}

/** K06A-Z5: lokalna kopia pól `Hex` używanych przez `tileYieldLabel` (pin: types/hex.ts). */
export interface HexK06 {
  terenBazowy: string;
  nakladka?: string;
  rzeka?: { obecna?: boolean };
  zloze?: string;
}

/** K06A-Z5: wartość `Nakladka.Brak` z pinu (types/hex.ts:30-31). */
const NAKLADKA_BRAK = 'brak';

/** K06A-Z5: wynik `tileYield` (pin: game/economy.ts `TileYield`) — pola czytane przez `formatTileYieldShort`. */
export interface TileYieldK06 {
  zywnosc: number;
  praca: number;
  handel: number;
}

/** K06A-Z5: zakładka panelu miasta (pin: `CityDrawerTab`, ui/cityPanel.ts) — identyfikator i skrót. */
export interface CityTabK06 {
  id: string;
  short: string;
}

/** K06A-Z5: stan zamówienia miasta z DTO (pin: `cfg.getOrderState`). */
export interface OrderStateK06 {
  szPct?: number | null;
  porPct?: number | null;
  revoltWarning?: boolean;
}

// ─── K06A-Z4: wejścia z DTO / delegatory ─────────────────────────────────────────────────────────────────────────────

/** K06A-Z4: metody `cfg` pinu używane przez jednostki K06A; wartości z DTO panelu (NIE_ZMIERZONO: wiring kontrolera). */
export interface K06aCfg {
  getOrderState?: (cityId: string) => OrderStateK06 | undefined;
  getCities?: () => readonly CityK06[] | undefined;
  onOkolicaTileAdjust?: (cityId: string, q: number, r: number, delta: number) => void;
}

/** K06A-Z4: zależności z innych kawałków pinu (blok 1, 9, reguły gry) — wartości z DTO / silnika, nie logika w UI. */
export interface K06aDeps {
  /** pin: `cityPanelChipIconWrap` (blok 1, poza K06A). */
  cityPanelChipIconWrap(name: string, px: number): string;
  /** pin: `tileYield` (game/economy.ts) — regula plonów, liczona w silniku. */
  tileYield(tile: {
    terenBazowy: string;
    nakladka: string;
    maRzeke: boolean;
    zloze: string | undefined;
    ulepszenieKey: string | undefined;
    ulepszeniaKeys: readonly string[] | undefined;
  }): TileYieldK06;
  /** pin: `formatCityMapLabel` (game/display-names.ts). */
  formatCityMapLabel(city: CityK06): string;
  /** pin: `axialToWorld` (render/hexutil.ts). */
  axialToWorld(q: number, r: number, R: number): { x: number; z: number };
  /** pin: `CITY_TABS` (ui/cityPanel.ts:1777). */
  cityTabs(): readonly CityTabK06[];
  /** pin: `activeDrawerTab` (ui/cityPanel.ts:1791). */
  activeDrawerTab(): string;
  /** pin: `cityTabIconHtml` (blok 1, poza K06A). */
  cityTabIconHtml(tabId: string): string;
  /** pin: `switchCity` (blok 9, poza K06A) — wiring w kontrolerze NIE_ZMIERZONO. */
  switchCity(dir: -1 | 1): void;
}

let cfg: K06aCfg = {};
let deps: K06aDeps | null = null;

/** Wejście z DTO panelu dla K06A (wiring w kontrolerze poza zakresem K06A, NIE_ZMIERZONO). */
export function setK06aCfg(next: K06aCfg): void {
  cfg = next;
}

/** Zależności zewnętrzne K06A (wiring w kontrolerze poza zakresem K06A, NIE_ZMIERZONO). */
export function setK06aDeps(next: K06aDeps): void {
  deps = next;
}

function dep(): K06aDeps {
  if (deps === null) throw new Error('K06A: brak zależności (setK06aDeps)');
  return deps;
}

function cityPanelChipIconWrap(name: string, px: number): string {
  return dep().cityPanelChipIconWrap(name, px);
}

function tileYield(tile: Parameters<K06aDeps['tileYield']>[0]): TileYieldK06 {
  return dep().tileYield(tile);
}

function formatCityMapLabel(city: CityK06): string {
  return dep().formatCityMapLabel(city);
}

function axialToWorld(q: number, r: number, R: number): { x: number; z: number } {
  return dep().axialToWorld(q, r, R);
}

function switchCity(dir: -1 | 1): void {
  dep().switchCity(dir);
}

/** K06A-Z4: `HEX_R = 1.0` z pinu (render/hexutil.ts:24, promień zewnętrzny heksa). */
const HEX_R = 1.0;

// ─── K06A-Z7: stan modułu (pin: ui/cityPanel.ts:10158-10163) ─────────────────────────────────────────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:10159-10159
let activeCity: CityK06 | null = null;
// pin edb8fb56 gra/src/ui/cityPanel.ts:10160-10160
let activeMap: GameMap | null = null;
// pin edb8fb56 gra/src/ui/cityPanel.ts:10161-10161
let activeOnClose: () => void = () => {};
// pin edb8fb56 gra/src/ui/cityPanel.ts:10162-10163
/** City id whose garrison detail is explicitly selected by click/keyboard. */
let pinnedGarrisonCityId: number | null = null;
// pin-end

/** K06A-Z7: ustawienie stanu panelu (wiring w kontrolerze NIE_ZMIERZONO). */
export function setK06aActive(city: CityK06 | null, map: GameMap | null, onClose: () => void): void {
  activeCity = city;
  activeMap = map;
  activeOnClose = onClose;
}

/** K06A-Z7: odczyt stanu panelu (pin: `activeCity`, `activeMap`, `activeOnClose`, `pinnedGarrisonCityId`). */
export function getK06aState(): {
  activeCity: CityK06 | null;
  activeMap: GameMap | null;
  activeOnClose: () => void;
  pinnedGarrisonCityId: number | null;
} {
  return { activeCity, activeMap, activeOnClose, pinnedGarrisonCityId };
}

/** K06A-Z7: ustawienie przypiętego garnizonu (pin: `pinnedGarrisonCityId`). */
export function setK06aPinnedGarrisonCityId(id: number | null): void {
  pinnedGarrisonCityId = id;
}

/** K06A-Z7: odczyt aktywnego miasta dla nawigacji (pin: `switchCity` czyta `activeCity`). */
export function getK06aActiveCity(): CityK06 | null {
  return activeCity;
}

// ─── Jednostki K06A (kopie pinu) ─────────────────────────────────────────────────────────────────────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:9729-9736
export function okolicaHexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (60 * i - 30) * Math.PI / 180;
    pts.push((cx + size * Math.cos(ang)).toFixed(1) + ',' + (cy + size * Math.sin(ang)).toFixed(1));
  }
  return pts.join(' ');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9738-9750
export function okolicaTileHasWorkerAt(
  city: CityK06,
  q: number,
  r: number,
  tryb: OkolicaTryb,
  reczne?: Record<string, number>,
  workedSet?: Set<string> | null,
  distFromCity?: number,
): boolean {
  const key = `${q},${r}`;
  if (tryb === 'reczny') return (reczne?.[key] ?? 0) > 0;
  return workedSet ? workedSet.has(key) : (distFromCity ?? 1) <= 1;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9752-9755
export function fireOkolicaTileToggle(city: CityK06, q: number, r: number): void {
  if (!cfg.onOkolicaTileAdjust) return;
  cfg.onOkolicaTileAdjust(city.id, q, r, 0);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9757-9763
export function formatTileYieldShort(y: TileYieldK06): string {
  const parts: string[] = [];
  if (y.zywnosc !== 0) parts.push(`${y.zywnosc > 0 ? '+' : ''}${y.zywnosc} ${cityPanelChipIconWrap('chip-grain', 12)}`);
  if (y.praca !== 0) parts.push(`${y.praca > 0 ? '+' : ''}${y.praca} ${cityPanelChipIconWrap('res-work', 12)}`);
  if (y.handel !== 0) parts.push(`${y.handel > 0 ? '+' : ''}${y.handel} ${cityPanelChipIconWrap('res-treasury', 12)}`);
  return parts.length ? parts.join(' ') : '0';
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9556-9569
/** Mapa `ImprovementKey` (klucz obiektu w `terrain-improvements.json`) → nazwa gracza
 * (`row.nazwa`) — T7b (KARTA-ULEPSZENIA-TERENU), call-site 3/3, sekcja „Ulepszenia
 * w zasięgu". Ten sam wzorzec odwrotny co `IMPROVEMENT_NAME_TO_KEY` w
 * `techDiscoveryNotice.ts`/`technologyAdapter.ts` (Bug B, R-TECH-ULEPSZENIA-TERENU-SYNC-Q1),
 * tylko w drugą stronę (tu KLUCZ jest już znany — z `improvementKeysForHex` — brakuje
 * tylko etykiety do wyświetlenia w wierszu). */
export function buildImprovementKeyToName(rows: Record<string, { nazwa?: string }>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [key, row] of Object.entries(rows)) {
    if (key.startsWith('_')) continue;
    if (typeof row?.nazwa === 'string' && row.nazwa) map[key] = row.nazwa;
  }
  return map;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9765-9783
/**
 * P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA (2026-08-09): musi czytać WSZYSTKIE warstwy
 * ulepszeń (`hex.ulepszenia`) przez `improvementKeysForHex`, tak jak silnik
 * (`hexToWorkedTile` w turn-economy.ts) i naprawione już `yieldOfMapHex` /
 * `foodPotentialOfMapHex` w okolica.ts — nie tylko legacy pojedyncze pole
 * `hex.ulepszenie` (ostatnia postawiona warstwa).
 */
export function tileYieldLabel(hex: HexK06): string {
  const ulepszeniaKeys = improvementKeysForHex(hex as HexLike);
  const y = tileYield({
    terenBazowy: hex.terenBazowy,
    nakladka: hex.nakladka ?? NAKLADKA_BRAK,
    maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
    zloze: (hex as { zloze?: string }).zloze,
    ulepszenieKey: ulepszeniaKeys[0],
    ulepszeniaKeys: ulepszeniaKeys.length ? ulepszeniaKeys : undefined,
  });
  return formatTileYieldShort(y);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:10228-10237
export function headerOrderBadge(city: CityK06): string {
  const st = cfg.getOrderState?.(city.id);
  if (!st || st.szPct == null) {
    return `<div class="mbadge muted" style="font-size:0.78em;">Porządek — szczegóły poniżej</div>`;
  }
  const por = st.porPct ?? 0;
  const cls = por >= 60 ? 'green' : por >= 30 ? 'gold' : 'red';
  const warn = st.revoltWarning ? ' \u26a0\ufe0f' : '';
  return `<div class="mbadge"><span class="muted">Porządek:</span> <b class="${cls}">${por.toFixed(0)}%</b>${warn}</div>`;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:10239-10245
export function drawerTabButtons(): string {
  return dep().cityTabs().map(t => {
    const on = dep().activeDrawerTab() === t.id;
    return `<button type="button" class="civ-cs-tab${on ? ' on' : ''}" data-tab="${t.id}" role="tab" aria-selected="${on}">`
      + `<span class="civ-cs-tab-inner">${dep().cityTabIconHtml(t.id)}<span class="civ-cs-tab-lbl">${t.short}</span></span></button>`;
  }).join('');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:10183-10189
/** Cities of the active city's owner (for prev/next navigation). */
export function ownerCities(city: CityK06): CityK06[] {
  const all = cfg.getCities?.();
  if (!all) return [city];
  const list = all.filter(c => c.ownerId === city.ownerId);
  return list.length > 0 ? list : [city];
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:10191-10202
/** Kolejność nawigacji między miastami — od lewej do prawej na mapie (świat X, potem Z). */
export function ownerCitiesForNav(city: CityK06): CityK06[] {
  const list = ownerCities(city);
  if (list.length < 2) return list;
  return [...list].sort((a, b) => {
    const aw = axialToWorld(a.q, a.r, HEX_R);
    const bw = axialToWorld(b.q, b.r, HEX_R);
    if (Math.abs(aw.x - bw.x) > 0.01) return aw.x - bw.x;
    if (Math.abs(aw.z - bw.z) > 0.01) return aw.z - bw.z;
    return a.name.localeCompare(b.name, 'pl');
  });
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:10204-10207
/** Tytuł miasta w panelu — dopisek miasto-państwo dla obcych klastrowych (Maciej 2026-07-07). */
export function cityPanelTitle(city: CityK06): string {
  return formatCityMapLabel(city);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:10223-10226
/** Nawigacja ← → — eksport dla skrótów klawiszowych w cityUxFrame. */
export function navigateCityPanel(dir: -1 | 1): void {
  switchCity(dir);
}
