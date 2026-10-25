/**
 * test-hook.ts -- R-WEB-TEST-HOOK-HEADLESS-GAME-Q1.
 *
 * Hak testowy do headless pomiarów PRAWDZIWEJ gry (Chromium/Playwright).
 *
 * BRAMKA: hak istnieje WYŁĄCZNIE gdy URL zawiera `?testhook=1`. Bez tego parametru
 * `window.__test` nie jest tworzony, nic nie jest nadpisywane i zachowanie gry jest
 * identyczne jak przed tym plikiem (test: tools/test-hook-guard-test.cjs).
 *
 * Moduł NIE zna logiki gry. Dostaje od main.ts zestaw domknięć (`TestHookDeps`), które
 * wołają te same funkcje co UI: start gry = `doStartGame` (ta sama ścieżka co kreator
 * „Nowa Gra"), koniec tury = `advanceSeat` (ten sam kod co przycisk „Zakończ turę"),
 * bitwa = klik przycisku „Auto" w realnym oknie pre-bitwy, oferty = `resolvePendingDiplomacy`
 * (ta sama funkcja, którą woła modal dyplomacji).
 *
 * Determinizm: przy starcie gry RNG `Math.random` jest zastępowany generatorem
 * mulberry32 z seedem podanym w `startGame` (tylko pod hakiem). Źródła niedeterminizmu,
 * których hak NIE eliminuje (opisane w gra/tools/README-sim-harness.md): `Date.now()`
 * w identyfikatorach (armyMerge, cities/budowa-lista, save) -- trafiają tylko do ID,
 * nie do decyzji; skrót stanu (`hash`) pomija wszystkie ID.
 */

import { setWarRulesMultiwarOverride } from './war-rules-multiwar';
import { setWarAllInCapitalOverride } from './warAllInCapital';
import { setAiUpkeepAwareRecruitmentOverride } from './ai-upkeep-gate';

/** Dane surowe stanu czytane z closure main.ts (zero logiki decyzyjnej po stronie hooka). */
export interface TestRawState {
  turn: number;
  /** Właściciele miast/jednostek (bez barbarzyńców). */
  cities: Array<{ owner: number; q: number; r: number; pop: number }>;
  units: Array<{ owner: number; typ: string; q: number; r: number; hp: number }>;
  /** Relacje dyplomatyczne par major (bez barbarzyńców), posortowane po kluczu. */
  relations: Array<{ a: number; b: number; status: string; zaufanie: number }>;
  /** Liczba aktywnych umów (activeDeals). */
  deals: number;
  /** Oczekujące propozycje (pendingDiplomacyInbox) -- surowo, z polami z kolejki. */
  offers: Array<{ id: string; ownerId: number; cmdType: string; reason: string; goldOnce: number | null }>;
  /** Zapas i wojsko per właściciel (diagnostyka R-WEB-AI-ARMY-UPKEEP-Q1; NIE wchodzi do hasha). */
  ownerEcon?: OwnerEconSample[];
}

/** Próbka zapasu jednego właściciela w danej turze (diagnostyka, poza hashem). */
export interface OwnerEconSample {
  owner: number;
  human: boolean;
  /** Skarbiec złota (może być ujemny przy deficycie). */
  treasury: number;
  /** Spichlerz państwa (zapas żywności). */
  foodReserve: number;
  /** Przyrost zapasu żywności ostatniej tury (netto, ze znakiem). */
  foodNet: number;
  /** Ikona deficytu złota (isGoldDeficit). */
  goldDeficit: boolean;
  /** Głód wojska: zapas żywności < 0 (isArmyHungry). */
  hungry: boolean;
  /** Atrycja HP z głodu aktywna (isArmyStarving). */
  starving: boolean;
  /** Liczba jednostek wojskowych (bez cywilnych). */
  militaryUnits: number;
  cities: number;
}

export interface TestHookDeps {
  /** Start nowej gry przez REALNE doStartGame; zwraca obietnicę po wygenerowaniu świata. */
  startGame(opts: TestStartOpts): Promise<void>;
  /** Realny koniec tury (advanceSeat). */
  endTurn(): void;
  getTurn(): number;
  isEndTurnInProgress(): boolean;
  /** true gdy otwarte jest okno pre-bitwy LUB bitwa czeka w kolejce. */
  isBattleBusy(): boolean;
  /** Klika „Auto" w realnym oknie pre-bitwy; zwraca true gdy coś kliknięto. */
  autoResolveOpenBattle(): boolean;
  /** Wypycha kolejkę odłożonych pre-bitew, gdy żadne okno nie jest otwarte. */
  flushDeferredBattles(): void;
  readRaw(): TestRawState;
  resolvePendingDiplomacy(id: string, accept: boolean): void;
  /** Stan „czekamy na pierwsze miasto gracza" (ta sama funkcja co bramka końca tury). */
  isAwaitingFirstPlayerCity(): boolean;
  /** Zakłada stolicę gracza na `playerStartHex` przez tę samą funkcję co klik w heks. */
  foundPlayerStartCity(): boolean;
}

export type TestPolicy = 'pass' | 'accept-all-offers' | 'reject-all-offers';

export interface TestStartOpts {
  seed: number;
  /** Liczba AI-cywilizacji wielkich (4–6). */
  aiCount: number;
  /** Liczba miast-państw. */
  cityStates: number;
  /** 'easy' | 'normal' | 'hard' (lub etykiety PL 'Łatwy' | 'Normalny' | 'Trudny'). */
  difficulty: string;
  /** 'kamien' | 'braz' | 'zelazo'. */
  era: string;
  /** Gracz pasywny: tury kończone bez żadnych akcji (domyślnie true). */
  playerPassive: boolean;
}

export interface TestTurnMetric {
  turn: number;
  ms: number;
  wars: number;
  deals: number;
  offers: number;
  battlesAuto: number;
  hash: string;
  /** Identyfikatory ofert widocznych w tej turze (do liczenia unikalnych ofert w przebiegu). */
  offerIds: string[];
  /** Zapas i wojsko per właściciel po tej turze (diagnostyka). */
  ownerEcon?: OwnerEconSample[];
}

export interface TestRunOpts {
  autoResolveBattles?: boolean;
  playerPolicy?: TestPolicy;
  /** Limit czasu czekania na jedną turę (ms). */
  turnTimeoutMs?: number;
}

export interface TestSnapshot {
  turn: number;
  wars: Array<[number, number]>;
  warCount: number;
  deals: number;
  trust: Record<string, number>;
  cities: number;
  /** Liczba różnych właścicieli z miastem (bez barbarzyńców) -- proxy liczby cywilizacji. */
  owners: number;
  units: number;
  offers: Array<{ id: string; ownerId: number; cmdType: string; reason: string; goldOnce: number | null }>;
  hash: string;
  /** Zapas i wojsko per właściciel (diagnostyka; poza hashem). */
  ownerEcon: OwnerEconSample[];
}

/** Nazwy flag -> settery `setXOverride` (ta sama funkcja, którą woła kod produkcyjny). */
const FLAG_SETTERS: Record<string, (v: boolean | null) => void> = {
  warRulesMultiwar: setWarRulesMultiwarOverride,
  warAllInCapital: setWarAllInCapitalOverride,
  aiUpkeepAwareRecruitment: setAiUpkeepAwareRecruitmentOverride,
};

const DIFFICULTY_PL: Record<string, string> = {
  easy: 'Łatwy', normal: 'Normalny', hard: 'Trudny',
  'Łatwy': 'Łatwy', 'Normalny': 'Normalny', 'Trudny': 'Trudny',
};

let installed = false;
let deps: TestHookDeps | null = null;

/** Czy URL prosi o hak (`?testhook=1`). Odporne na brak `location` (np. Node). */
export function isTestHookRequested(search?: string): boolean {
  try {
    const s = search ?? (typeof location !== 'undefined' ? location.search : '');
    return new URLSearchParams(s).get('testhook') === '1';
  } catch {
    return false;
  }
}

/** Generator PRNG mulberry32 (deterministyczny, 32-bit). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stabilny JSON (klucze posortowane) -> FNV-1a 32-bit jako hex. */
export function stableHash(value: unknown): string {
  const json = stableJson(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function stableJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return '[' + v.map(stableJson).join(',') + ']';
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableJson((v as Record<string, unknown>)[k])).join(',') + '}';
}

/** Czysta redukcja surowego stanu do snapshotu (testowalna bez przeglądarki). */
export function summarizeRaw(raw: TestRawState): TestSnapshot {
  const wars: Array<[number, number]> = [];
  const trust: Record<string, number> = {};
  for (const r of raw.relations) {
    const key = r.a < r.b ? `${r.a}-${r.b}` : `${r.b}-${r.a}`;
    trust[key] = r.zaufanie;
    if (r.status === 'wojna') wars.push(r.a < r.b ? [r.a, r.b] : [r.b, r.a]);
  }
  // Hash liczy WYŁĄCZNIE stan gry: bez identyfikatorów jednostek (zawierają Math.random/Date.now).
  const hash = stableHash({
    turn: raw.turn,
    cities: raw.cities,
    units: raw.units,
    relations: raw.relations,
    deals: raw.deals,
    offers: raw.offers.map(o => ({ ownerId: o.ownerId, cmdType: o.cmdType, reason: o.reason, goldOnce: o.goldOnce })),
  });
  return {
    turn: raw.turn,
    wars,
    warCount: wars.length,
    deals: raw.deals,
    trust,
    cities: raw.cities.length,
    owners: new Set(raw.cities.map(c => c.owner)).size,
    units: raw.units.length,
    offers: raw.offers,
    hash,
    ownerEcon: raw.ownerEcon ?? [],
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

/** Parametry startu -> format przyjmowany przez main.ts (bez zgadywania po stronie gry). */
export function normalizeStartOpts(input: Partial<TestStartOpts> & { seed: number }): TestStartOpts {
  const diff = DIFFICULTY_PL[input.difficulty ?? 'normal'];
  if (!diff) throw new Error(`test-hook: nieznana trudność "${input.difficulty}"`);
  const aiCount = input.aiCount ?? 5;
  if (!Number.isInteger(aiCount) || aiCount < 4 || aiCount > 6) {
    throw new Error(`test-hook: aiCount musi być 4–6, jest ${aiCount}`);
  }
  const era = input.era ?? 'kamien';
  if (!['kamien', 'braz', 'zelazo'].includes(era)) throw new Error(`test-hook: nieznana epoka "${era}"`);
  return {
    seed: input.seed >>> 0 || 1,
    aiCount,
    cityStates: input.cityStates ?? 2,
    difficulty: diff,
    era,
    playerPassive: input.playerPassive ?? true,
  };
}

/** Instaluje `window.__test` WYŁĄCZNIE przy `?testhook=1`. Bez parametru -- no-op. */
export function installTestHook(d: TestHookDeps): void {
  if (installed || !isTestHookRequested()) return;
  installed = true;
  deps = d;
  // Bez `Math.random` seedowanego przed startem gra zachowuje się jak zwykle do momentu
  // wywołania startGame; reseed następuje dopiero tam.
  const api = {
    startGame: async (input: Partial<TestStartOpts> & { seed: number }): Promise<void> => {
      const opts = normalizeStartOpts(input);
      Math.random = mulberry32(opts.seed);
      await deps!.startGame(opts);
      // Gracz musi założyć stolicę, zanim tura się zamknie (bramka awaitingFirstPlayerCity).
      // Hak „klika" startowy heks tą samą ścieżką co realny gracz; `playerPassive` oznacza,
      // że potem nie ma już żadnych akcji gracza poza kończeniem tur.
      const until = performance.now() + 30000;
      while (performance.now() < until) {
        if (!deps!.isAwaitingFirstPlayerCity()) break;
        deps!.foundPlayerStartCity();
        await sleep(100);
      }
    },
    setFlag: (name: string, value: boolean | null): void => {
      const setter = FLAG_SETTERS[name];
      if (!setter) throw new Error(`test-hook: brak nadpisania flagi "${name}"`);
      setter(value);
    },
    snapshot: (): TestSnapshot => summarizeRaw(deps!.readRaw()),
    runTurns: async (n: number, opts: TestRunOpts = {}): Promise<TestTurnMetric[]> => {
      const d = deps!;
      const policy: TestPolicy = opts.playerPolicy ?? 'pass';
      const autoBattles = opts.autoResolveBattles !== false;
      const timeout = opts.turnTimeoutMs ?? 60000;
      const out: TestTurnMetric[] = [];
      for (let i = 0; i < n; i++) {
        const t0 = performance.now();
        const before = d.getTurn();
        let battlesAuto = 0;
        // Oferty AI -> gracz: decyzja wg polityki (realna funkcja modala).
        if (policy !== 'pass') {
          const accept = policy === 'accept-all-offers';
          for (const o of readOffers()) d.resolvePendingDiplomacy(o.id, accept);
        }
        // Bitwy: realny przycisk „Auto" w oknie pre-bitwy, dopóki kolejka nie jest pusta.
        const deadline = t0 + timeout;
        while (d.isBattleBusy() && performance.now() < deadline) {
          if (!autoBattles) break;
          if (d.autoResolveOpenBattle()) battlesAuto++;
          else d.flushDeferredBattles();
          await sleep(30);
        }
        d.endTurn();
        while (performance.now() < deadline) {
          if (d.getTurn() > before && !d.isEndTurnInProgress() && !d.isBattleBusy()) break;
          if (autoBattles && d.autoResolveOpenBattle()) battlesAuto++;
          await sleep(30);
        }
        const ok = d.getTurn() > before && !d.isEndTurnInProgress();
        const s = summarizeRaw(d.readRaw());
        out.push({
          turn: d.getTurn(),
          ms: Math.round(performance.now() - t0),
          wars: s.warCount,
          deals: s.deals,
          offers: s.offers.length,
          battlesAuto,
          hash: s.hash,
          offerIds: s.offers.map(o => o.id),
          ownerEcon: s.ownerEcon,
        });
        if (!ok) {
          out[out.length - 1]!.hash = 'TIMEOUT:' + s.hash;
          break;
        }
      }
      return out;
    },
  };
  function readOffers(): TestRawState['offers'] {
    return deps!.readRaw().offers;
  }
  try {
    (window as unknown as { __test: typeof api }).__test = api;
  } catch {
    /* brak window (np. Node) -- hak nieaktywny */
  }
}

/** Test/diagnostyka: czy hak jest zainstalowany w tym świecie. */
export function isTestHookInstalled(): boolean {
  return installed;
}
