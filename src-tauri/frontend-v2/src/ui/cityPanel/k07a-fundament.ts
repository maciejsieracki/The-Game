/**
 * K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 1): jednostki K07 (pasek W3 i okolica) bez DOM — CZĘŚCIOWO.
 *
 * Zakres tej rundy: 5 jednostek nie-DOM bloku K07 z `pomiar-r2.json` (blok 7, 23 jednostki, 1 493 LOC, pin `edb8fb56`):
 *   - `uxSectionRefresh` (pin `cityPanel.ts:10365-10366`) → `setK07aUxSectionRefresh` / `getK07aUxSectionRefresh`,
 *   - `W3_STAT_RES_KEY` (pin `:10384-10392`) → `W3_STAT_RES_KEY_K07`,
 *   - `resolveActiveCity` (pin `:10329-10336`) → `resolveK07aActiveCity`,
 *   - `w3CityChip` (pin `:10393-10431`) → `w3CityChipK07`,
 *   - `capitalBadgeOrButtonHtml` (pin `:10719-10735`) → `capitalBadgeOrButtonHtmlK07`.
 * Wybór: `tools/dom-harness/select-k07a.mjs` (wynik `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1/r1-logi/`).
 *
 * NIEPORTOWANE W TEJ RUNDZIE (nie-DOM, zależności do domknięcia w r2): `skeleton` (`:10247-10328`, 82 LOC — powłoka
 * drawera, wiele helperów DOM-owych), `buildCityOnlyW3FlankChips` (`:10432-10580`, 149 LOC — `cityPracaSplit`,
 * `readPodzialHandlu`, `resolveEmpireSnap`), `buildCityResourceStatItems` (`:10581-10693`, 113 LOC).
 * Jednostki DOM (15, 1 074 LOC) → K07B (osobny temat).
 *
 * Konwencja (jak K05A/K06A): ciało jednostki jest kopią pinu; wywołania spoza K07A (`cfg.*`, `isMeCity`, zasób
 * `buildChipDeltaStockHtml` z `game/empire-hud-totals`) idą przez wstrzykiwane zależności `K07aDeps` (ZAŁOŻENIE K07A-Z2:
 * wartości z DTO / adaptera; UI nie liczy reguł gry — P5.13). Import `resourceScopeClass` z `../resourceColors` (już w v2).
 *
 * Wyjątki (ZAŁOŻENIA, do potwierdzenia w `P5-8-K07A.md`):
 *   K07A-Z1 — lokalna kopia typu `City` (pola pinu używane przez jednostki) → `CityK07`; `City` → `CityRefDto` w v2.
 *   K07A-Z2 — `cfg.*` i `isMeCity` → `K07aDeps`; `buildChipDeltaStockHtml` → `K07aDeps.chipDeltaStockHtml` (brak w v2).
 *   K07A-Z3 — `let activeCity` / `let uxSectionRefresh` (stan modułu pinu) → zmienne modułu z akcesorami.
 */

import { resourceScopeClass, type ResourceColorKey } from '../resourceColors';

// ─── K07A-Z1: lokalny typ miasta (pola pinu `City` używane przez jednostki K07A) ─────────────────────────────────────────

/** K07A-Z1: lokalna kopia pól `City` z pinu (game/cities.ts) używanych przez jednostki K07A. */
export interface CityK07 {
  id: string;
  ownerId: number;
  name: string;
  population: number;
  /** Pin: `city.oblegane` (`capitalBadgeOrButtonHtml`, `:10731`). */
  oblegane?: boolean;
}

// ─── K07A-Z2: wstrzykiwane zależności (wartości z DTO / adaptera) ───────────────────────────────────────────────────────

export interface K07aDeps {
  /** Pin `cfg.isMe?.(ownerId) ?? (ownerId === 0)` (`cityPanel.ts:617-619`). */
  isMe: (ownerId: number) => boolean;
  /** Pin `cfg.getCapitalCityId?.(ownerId) ?? null` (`:594`). */
  getCapitalCityId: (ownerId: number) => string | null;
  /** Pin `cfg.getCities?.() ?? []` (`:317`). */
  getCities: () => readonly CityK07[];
  /** Pin: czy `cfg.onSetCapital` jest podany (`:599`, `capitalBadgeOrButtonHtml` `:10722`). */
  canSetCapital: boolean;
  /**
   * Pin `buildChipDeltaStockHtml(civRate, civStock)` (`game/empire-hud-totals`, import `cityPanel.ts:78`).
   * W v2 brak odpowiednika — dostarczany przez adapter DTO (K07A-Z2).
   */
  chipDeltaStockHtml: (civRate: number | undefined, civStock: number | undefined) => string;
}

let deps: K07aDeps | null = null;

/** Instaluje zależności K07A (wywoływane przez most/kontroler; bez zależności jednostki zwracają wartości neutralne). */
export function setK07aDeps(next: K07aDeps | null): void {
  deps = next;
}

// ─── K07A-Z3: stan modułu pinu (`let activeCity`, `let uxSectionRefresh`) ───────────────────────────────────────────────

/** Pin `let activeCity: City | null = null;` (`cityPanel.ts:10159`). */
let activeCity: CityK07 | null = null;

/** Pin `let uxSectionRefresh: (() => void) | null = null;` (`cityPanel.ts:10365`). */
let uxSectionRefresh: (() => void) | null = null;

/** Akcesor stanu K07A-Z3: ustawia `activeCity` (pin: przypisanie w `switchCity`/`openCityPanel`, poza K07A). */
export function setK07aActiveCity(city: CityK07 | null): void {
  activeCity = city;
}

/** Akcesor stanu K07A-Z3: czyta `activeCity` (pin: odczyt w `resolveActiveCity`). */
export function getK07aActiveCity(): CityK07 | null {
  return activeCity;
}

/**
 * Pin `uxSectionRefresh = …` (`cityPanel.ts:10365-10366`): rejestracja odświeżania sekcji ramki UX.
 * Akcesor zamiast zmiennej pinu (K07A-Z3); `null` = wyrejestrowanie (`clearCityPanelUxMode`, pin `:10367`).
 */
export function setK07aUxSectionRefresh(refresh: (() => void) | null): void {
  uxSectionRefresh = refresh;
}

/** Akcesor stanu K07A-Z3: czy zarejestrowano odświeżanie sekcji ramki UX. */
export function getK07aUxSectionRefresh(): (() => void) | null {
  return uxSectionRefresh;
}

// ─── Jednostki K07A (kopie pinu) ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * Pin `cityPanel.ts:10384-10392`: mapa `data-res-stat` → klucz koloru surowca (tożsamość chipa W3).
 * Kopia 1:1 (stała, bez zależności poza typem `ResourceColorKey`).
 */
export const W3_STAT_RES_KEY_K07: Record<string, ResourceColorKey | undefined> = {
  praca: 'praca',
  zywnosc: 'zywnosc',
  zloto: 'skarbiec',
  nauka: 'nauka',
  kultura: 'kultura',
  religia: 'religia',
};

/**
 * Pin `resolveActiveCity()` (`cityPanel.ts:10329-10336`): odświeża `activeCity` z listy miast (`getCities`).
 * Bez zależności (`deps` = null) zwraca bieżący `activeCity` bez odświeżenia.
 */
export function resolveK07aActiveCity(): CityK07 | null {
  if (activeCity === null) return null;
  const fresh = deps?.getCities().find(c => c.id === activeCity!.id);
  if (fresh) activeCity = fresh;
  return activeCity;
}

/**
 * Pin `w3CityChip(...)` (`cityPanel.ts:10393-10431`): chip paska W3 (ikona, etykieta, wartość, tempo, zapas).
 * Kolor tożsamości surowca wynika z `data-res-stat` (`W3_STAT_RES_KEY_K07`), nie z dodatkowego argumentu.
 * Tempo/zapas (`civRate`, `civStock`) renderuje `deps.chipDeltaStockHtml` (K07A-Z2).
 */
export function w3CityChipK07(
  icon: string,
  label: string,
  val: string,
  cls: string,
  statId: string,
  hint: string,
  civRate?: number,
  civStock?: number,
): string {
  const resKey = W3_STAT_RES_KEY_K07[statId];
  const resScope = resKey ? ` ${resourceScopeClass(resKey)}` : '';
  const delta = deps ? deps.chipDeltaStockHtml(civRate, civStock) : '';
  return `<button type="button" class="civ-v-w3-chip${resScope} civ-v-res-interactive" data-res-stat="${statId}" ` +
    `title="${hint.replace(/"/g, '&quot;')}" aria-label="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-w3-chip-icon">${icon}</span>` +
    `<span class="civ-v-w3-chip-lbl">${label}</span>` +
    `<span class="civ-v-w3-chip-val ${cls}">${val}</span>` +
    delta +
    `</button>`;
}

/**
 * Pin `capitalBadgeOrButtonHtml(city)` (`cityPanel.ts:10719-10735`): znacznik stolicy albo przycisk „Ustaw jako stolicę".
 * Stan „oblężona stolica" czytany z `city.oblegane` (pole DTO miasta, nie lokalne przeliczenie).
 */
export function capitalBadgeOrButtonHtmlK07(city: CityK07): string {
  const d = deps;
  const capitalId = d?.getCapitalCityId(city.ownerId) ?? null;
  if (capitalId != null && capitalId === city.id) {
    return `<span class="civ-v-w3-capital-badge" title="Stolica">★ Stolica</span>`;
  }
  if (!d || !d.isMe(city.ownerId) || !d.canSetCapital) return '';
  const allCitiesForCapital = d.getCities();
  const capitalCity = capitalId ? allCitiesForCapital.find(c => c.id === capitalId) : null;
  const besieged = !!capitalCity?.oblegane;
  if (besieged) {
    return `<button type="button" class="civ-v-w3-capital-btn" disabled ` +
      `title="Obecna stolica (${capitalCity?.name ?? '?'}) jest oblegana — nie można przenieść">Ustaw jako stolicę</button>`;
  }
  return `<button type="button" class="civ-v-w3-capital-btn" id="civ-v-set-capital" ` +
    `title="Przenieś stolicę do tego miasta (za darmo)">Ustaw jako stolicę</button>`;
}
