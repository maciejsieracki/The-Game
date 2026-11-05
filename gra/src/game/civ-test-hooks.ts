/**
 * R-WEB-AUTOIMPROVE-LIVE-HOOKS-Q1: hooki testowe zywej gry — `window.__civTest`.
 *
 * ZASADY BEZPIECZENSTWA:
 *  - obiekt powstaje WYLACZNIE przy parametrze URL `?civTest=1` (`isCivTestEnabled`); bez niego
 *    `window.__civTest === undefined` i zero kodu hooka sie nie wykonuje (produkcja bez wplywu);
 *  - tylko ODCZYT stanu + jawnie nazwane, kontrolowane ustawienie scenariusza (tech, Praca, polityka automatu,
 *    zalozenie miasta REALNA sciezka gracza, dodanie jednostki, koniec tury);
 *  - zero logiki gry tutaj: wszystko deleguje do closure'ow podanych z `main.ts` (`CivTestDeps`).
 *
 * Wolany z `main.ts` jednym wywolaniem `installCivTestHooks(...)` (sonda tekstowa: gra/tools/autoimprove-live-hooks-test.cjs).
 */

export interface CivTestHexLayers {
  q: number;
  r: number;
  layers: string[];
  nakladka: string | null;
  teren: string | null;
  naRzece: boolean;
  clearing: boolean;
  owner: number | null;
}

export interface CivTestPolicyPatch {
  focus?: 'zywnosc' | 'zrownowazone' | 'surowce' | 'infrastruktura';
  tryb?: 'auto' | 'reczny';
  onlyWorked?: boolean;
  pracaAutoPercent?: number;
}

export interface CivTestDeps {
  getTurn: () => number;
  getCities: () => ReadonlyArray<{ id: string; ownerId: number; q: number; r: number; population: number; name?: string }>;
  getUnits: () => ReadonlyArray<{ id: string; ownerId: number; q: number; r: number }>;
  getFortNodes: () => ReadonlyArray<{ q: number; r: number; ownerId: number; type: string; builtAtTurn?: number; seq?: number; }>;
  /** Wlasciciel terytorium na heksie (REALNE `territoryOwnerAtLive`). */
  territoryOwnerAt: (q: number, r: number) => number | null;
  getPlacedLayers: (q: number, r: number) => string[];
  getHexInfo: (q: number, r: number) => { nakladka: string | null; teren: string | null; naRzece: boolean; clearing: boolean } | null;
  hexesWithin: (q: number, r: number, radius: number) => Array<{ q: number; r: number }>;
  unlockAllTech: () => void;
  setPracaPool: (n: number) => void;
  getPracaPool: () => number;
  /** Ustawia polityke automatu ulepszen wlasciciela (scalanie z biezaca). */
  setUlepszeniaPolicy: (ownerId: number, patch: CivTestPolicyPatch) => void;
  getUlepszeniaPolicy: (ownerId: number) => unknown;
  foundCandidates: (limit: number) => Array<{ q: number; r: number }>;
  /** REALNE zalozenie miasta gracza (jak klik). */
  foundPlayerCity: (q: number, r: number) => boolean;
  /** Dodanie jednostki wlasciciela na heksie (szablon z istniejacej jednostki). Zwraca id albo null. */
  addUnit: (ownerId: number, q: number, r: number, civilian: boolean) => string | null;
  setWar: (a: number, b: number) => void;
  /** Koniec tury gracza — w nim uruchamia sie automat ulepszen (REALNY `triggerPlayerEndTurn`). */
  endTurn: () => void;
  meOwnerId: () => number;
  /** R-WEB-TEST-HOOK-SETCITYLIMIT-Q1: zapisuje bazowy limit miast gry (`_menuCityLimitBase`). */
  setCityLimitBase: (base: number) => void;
  /** Biezaca epoka (imperium) gracza — limit = baza + (epoka-1)*5. */
  meEra: () => number;
  /**
   * R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1: reczne obsadzenie heksow obywatelami (jak klik w panelu miasta):
   * `keys` = "q,r" po jednym obywatelu; `null` = powrot do auto. Zwraca liste faktycznie obsadzonych kluczy.
   */
  setCityWorkers: (cityId: string, keys: string[] | null) => string[];
  /** Klucze heksow obrabianych (z obywatelem) przez miasto — REALNA funkcja gry (`workedHexCoordsForCity`). */
  getCityWorkers: (cityId: string) => string[];
}

/**
 * R-WEB-TEST-HOOK-SETCITYLIMIT-Q1: baza, przy ktorej limit miast w danej epoce wynosi dokladnie `limit`.
 * Wzor limitu (cities.ts `canFoundCity`, auto-improvements.ts `isCityLimitExhausted`): baza + (max(1,epoka)-1)*5.
 */
export function cityLimitBaseForTarget(limit: number, era: number): number {
  return limit - (Math.max(1, era) - 1) * 5;
}

/** Czy tryb testowy jest wlaczony: tylko `?civTest=1` (dokladnie "1"). */
export function isCivTestEnabled(search: string | undefined | null): boolean {
  if (!search) return false;
  try {
    return new URLSearchParams(search).get('civTest') === '1';
  } catch {
    return false;
  }
}

export interface CivTestApi {
  version: 1;
  state: () => unknown;
  hex: (q: number, r: number) => CivTestHexLayers | null;
  around: (q: number, r: number, radius: number, onlyInteresting?: boolean) => CivTestHexLayers[];
  forts: () => Array<{ q: number; r: number; ownerId: number; type: string; builtAtTurn?: number; seq?: number }>;
  ownerAt: (q: number, r: number) => number | null;
  unlockAllTech: () => void;
  /** Nadpisuje limit miast GRACZA (w jego biezacej epoce) na `n` (>=0); wywolaj PO unlockAllTech (awans epoki zmienia limit). */
  setCityLimit: (n: number) => void;
  setPraca: (n: number) => void;
  setPolicy: (ownerId: number, patch: CivTestPolicyPatch) => unknown;
  foundCandidates: (limit: number) => Array<{ q: number; r: number }>;
  foundCity: (q: number, r: number) => boolean;
  addUnit: (ownerId: number, q: number, r: number, civilian?: boolean) => string | null;
  setWar: (a: number, b: number) => void;
  /** Wlacza log decyzji pickera (zbierany do bufora); zwraca nic. */
  debugOn: () => void;
  debugOff: () => void;
  /** Zwraca i czysci bufor zdarzen `onDecision` pickera. */
  drainDecisions: () => unknown[];
  /** Koniec tury (automat ulepszen dziala w turze gracza). */
  endTurn: () => void;
  /** Reczne obsadzenie heksow obywatelami (`null` = auto); zwraca obsadzone klucze "q,r". */
  setCityWorkers: (cityId: string, keys: string[] | null) => string[];
  /** Heksy z obywatelem danego miasta ("q,r"). */
  getCityWorkers: (cityId: string) => string[];
}

/** Instaluje `window.__civTest` TYLKO gdy `?civTest=1`. Zwraca true, gdy zainstalowano. */
export function installCivTestHooks(win: Record<string, unknown>, search: string | undefined | null, deps: CivTestDeps): boolean {
  if (!isCivTestEnabled(search)) return false;
  const buffer: unknown[] = [];
  const hexInfo = (q: number, r: number): CivTestHexLayers | null => {
    const info = deps.getHexInfo(q, r);
    if (!info) return null;
    return { q, r, layers: [...deps.getPlacedLayers(q, r)], ...info, owner: deps.territoryOwnerAt(q, r) };
  };
  const api: CivTestApi = {
    version: 1,
    state: () => ({
      turn: deps.getTurn(),
      me: deps.meOwnerId(),
      praca: deps.getPracaPool(),
      cities: deps.getCities().map(c => ({ id: c.id, ownerId: c.ownerId, q: c.q, r: c.r, pop: c.population, name: c.name })),
      units: deps.getUnits().length,
      forts: deps.getFortNodes().length,
      policyMe: deps.getUlepszeniaPolicy(deps.meOwnerId()),
    }),
    hex: hexInfo,
    around: (q, r, radius, onlyInteresting = false) => {
      const out: CivTestHexLayers[] = [];
      for (const h of deps.hexesWithin(q, r, radius)) {
        const x = hexInfo(h.q, h.r);
        if (!x) continue;
        if (onlyInteresting && x.layers.length === 0 && !x.clearing) continue;
        out.push(x);
      }
      return out;
    },
    forts: () => deps.getFortNodes().map(f => ({ q: f.q, r: f.r, ownerId: f.ownerId, type: f.type, builtAtTurn: f.builtAtTurn, seq: f.seq })),
    ownerAt: (q, r) => deps.territoryOwnerAt(q, r),
    unlockAllTech: () => deps.unlockAllTech(),
    setCityLimit: n => {
      if (!Number.isFinite(n) || n < 0) return;
      deps.setCityLimitBase(cityLimitBaseForTarget(Math.floor(n), deps.meEra()));
    },
    setPraca: n => deps.setPracaPool(n),
    setPolicy: (ownerId, patch) => { deps.setUlepszeniaPolicy(ownerId, patch); return deps.getUlepszeniaPolicy(ownerId); },
    foundCandidates: limit => deps.foundCandidates(limit),
    foundCity: (q, r) => deps.foundPlayerCity(q, r),
    addUnit: (ownerId, q, r, civilian = false) => deps.addUnit(ownerId, q, r, civilian),
    setWar: (a, b) => deps.setWar(a, b),
    debugOn: () => { win.__civAutoImproveDebug = (e: unknown) => { buffer.push(e); }; },
    debugOff: () => { delete win.__civAutoImproveDebug; },
    drainDecisions: () => buffer.splice(0, buffer.length),
    endTurn: () => deps.endTurn(),
    setCityWorkers: (cityId, keys) => deps.setCityWorkers(cityId, keys),
    getCityWorkers: cityId => deps.getCityWorkers(cityId),
  };
  win.__civTest = api;
  return true;
}
