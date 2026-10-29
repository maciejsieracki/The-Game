/**
 * K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 2): jednostki K07 (pasek W3 i okolica) bez DOM — CZĘŚCIOWO.
 *
 * Zakres: 5 jednostek nie-DOM bloku K07 (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`):
 *   - `uxSectionRefresh` (:10365) → `setK07aUxSectionRefresh` / `getK07aUxSectionRefresh` (akcesory, K07A-Z3),
 *   - `W3_STAT_RES_KEY` (:10384-10391) → `W3_STAT_RES_KEY_K07`,
 *   - `resolveActiveCity` (:10329-10334) → `resolveK07aActiveCity`,
 *   - `w3CityChip` (:10393-10419) → `w3CityChipK07`,
 *   - `capitalBadgeOrButtonHtml` (:10719-10734) → `capitalBadgeOrButtonHtmlK07`.
 * Wybór: 2 jednostki z `select-k07a.mjs` (`r1-logi/wybrane.json`) + 3 ręcznie z klas odroczonych T/R (`P5-8-K07A.md` §2).
 *
 * NIEPORTOWANE W TEJ RUNDZIE: `skeleton` (:10247-10328), `buildCityOnlyW3FlankChips` (:10432-10580),
 * `buildCityResourceStatItems` (:10581-10693) — zależności `cityPracaSplit`, `readPodzialHandlu`, `resolveEmpireSnap`
 * nieobecne w v2 (r3). Jednostki DOM (15, 1 074 LOC) → K07B (osobny temat).
 *
 * Konwencja: ciało jednostki = kopia pinu, bramka `tools/dom-harness/verify-k07a-copies.mjs` (ORPHAN=0, TEXT).
 * Różnice są WYŁĄCZNIE tokeny nazw i LINE_SUBS tej bramki (każda jawnie wymieniona).
 *
 * Wyjątki (ZAŁOŻENIA, `P5-8-K07A.md`):
 *   K07A-Z1 — lokalna kopia typu `City` (pola używane przez jednostki) → `CityK07`; `City` → `CityRefDto` w v2.
 *   K07A-Z2 — `cfg.*`, `isMeCity` i `buildChipDeltaStockHtml` → `K07aDeps` (wartości z DTO / adaptera; P5.13).
 *   K07A-Z3 — `let activeCity` / `let uxSectionRefresh` (stan modułu pinu) → zmienne modułu z akcesorami.
 */

import { resourceScopeClass, type ResourceColorKey } from '../resourceColors';

// ─── K07A-Z1: lokalny typ miasta (pola pinu `City` używane przez jednostki K07A) ───────────────────────────────────────

/** K07A-Z1: lokalna kopia pól `City` z pinu (game/cities.ts) używanych przez jednostki K07A. */
export interface CityK07 {
  id: string;
  ownerId: number;
  name: string;
  population: number;
  /** Pin: `city.oblegane` (`capitalBadgeOrButtonHtml`, `:10727`). */
  oblegane?: boolean;
}

// ─── K07A-Z2: wstrzykiwane zależności (wartości z DTO / adaptera) ───────────────────────────────────────────────────────

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

/** Instaluje zależności K07A (most/kontroler). Bez zależności `w3CityChipK07` nie dokleja tempa/zapasu
 *  (różnica względem pinu, który zawsze go dokleja — zob. P5-8-K07A.md, ograniczenia). */
export function setK07aDeps(next: K07aDeps | null): void {
  deps = next;
}

// ─── K07A-Z3: stan modułu pinu (`let activeCity`, `let uxSectionRefresh`) ───────────────────────────────────────────────

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

// ─── Jednostki K07A (kopie pinu; markery = bramka verify-k07a-copies.mjs) ───────────────────────────────────────────────

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

// pin edb8fb56 gra/src/ui/cityPanel.ts:10329-10334
export function resolveK07aActiveCity(): CityK07 | null {
  if (activeCity === null) return null;
  const fresh = deps?.getCities().find(c => c.id === activeCity!.id);
  if (fresh) activeCity = fresh;
  return activeCity;
}
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
    (deps ? deps.chipDeltaStockHtml(civRate, civStock) : '') +
    `</button>`;
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
