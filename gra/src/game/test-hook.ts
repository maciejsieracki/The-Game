/**
 * test-hook.ts -- R-WEB-TEST-HOOK-HEADLESS-GAME-Q1 + R-WEB-TEST-HOOK-DETERMINISM-Q1.
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
 * Determinizm (R-WEB-TEST-HOOK-DETERMINISM-Q1), WYŁĄCZNIE pod `?testhook=1`:
 *  - czas wirtualny: `setTimeout`/`setInterval`/`requestAnimationFrame` działają na
 *    zegarze klatek; zegar ściany (`performance.now`) to czas wirtualny; timery i klatki
 *    wykonują się tylko podczas wywołania haka (`drive`), w stałych krokach 1/60 s.
 *    Dzięki temu kolejność wywołań zwrotnych względem logiki tury nie zależy od obciążenia
 *    maszyny (źródło 2 z README: progi czasu i wiszące klatki).
 *  - `Date.now` = baza + numer tury (1 ms na turę): progi 8000 ms nie zależą od czasu ściennego.
 *  - UUID three.js (`MathUtils.generateUUID`) to licznik, nie `Math.random` (źródło 1 z README):
 *    tworzenie obiektów three.js nie przesuwa już strumienia RNG logiki gry.
 *  - RNG `Math.random` seedowany mulberry32 w `startGame` (jak dotąd).
 * Bez `?testhook=1` żadne z powyższych nie jest instalowane.
 *
 * Źródła niedeterminizmu, których hak NIE eliminuje (opisane w gra/tools/README-sim-harness.md):
 * `Math.random` wołany z kodu audio/bitew w klatkach (strumień wspólny z logiką, ale kolejność
 * klatek jest już deterministyczna); hash (`hash`) pomija wszystkie ID.
 */

import * as THREE from 'three';
import { setWarRulesMultiwarOverride } from './war-rules-multiwar';
import { setWarAllInCapitalOverride } from './warAllInCapital';

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
}

/** Nazwy flag -> settery `setXOverride` (ta sama funkcja, którą woła kod produkcyjny). */
const FLAG_SETTERS: Record<string, (v: boolean | null) => void> = {
  warRulesMultiwar: setWarRulesMultiwarOverride,
  warAllInCapital: setWarAllInCapitalOverride,
};

const DIFFICULTY_PL: Record<string, string> = {
  easy: 'Łatwy', normal: 'Normalny', hard: 'Trudny',
  'Łatwy': 'Łatwy', 'Normalny': 'Normalny', 'Trudny': 'Trudny',
};

let installed = false;
let deps: TestHookDeps | null = null;

/** Prawdziwy zegar wydajności (przed nadpisaniem) -- tylko do limitów czasu samego haka. */
const nativePerfNow: () => number = typeof performance !== 'undefined'
  ? performance.now.bind(performance)
  : () => 0;

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

/** Stała baza zegara deterministycznego (pod hakiem, zamiast `Date.now`). */
const DET_EPOCH_MS = 1700000000000;

let detUuidSeq = 0;
/** UUID bez Math.random: licznik sekwencji w formacie UUID v4 (pod hakiem). */
function detUuid(): string {
  detUuidSeq++;
  return '00000000-0000-4000-8000-' + detUuidSeq.toString(16).padStart(12, '0');
}

/* ---------------------------------------------------------------------------
 * Czas wirtualny (pod hakiem). Zegar klatek: 1 tick = 1/60 s wirtualnej.
 * Timery (setTimeout/setInterval) i rAF są wykonywane przez sterownik `vTick`,
 * który działa WYŁĄCZNIE gdy trwa wywołanie haka (`drive`). Poza wywołaniem
 * nic się nie dzieje, więc stan gry nie zależy od czasu między wywołaniami.
 * ------------------------------------------------------------------------- */
const FRAME_MS = 1000 / 60;
/** Liczba klatek wyciszenia po starcie gry (patrz `startGame` w `installTestHook`). */
const SETTLE_FRAMES = 300;

interface VTask {
  id: number;
  due: number;
  seq: number;
  every: number | null;
  cb: () => void;
}

let vNow = 0;
let vSeq = 0;
let vDriving = 0;
/** Do pierwszego `startGame` zegar działa swobodnie (inicjalizacja gry czeka na klatki). */
let vFreeRun = true;
let vArmed = false;
const vTasks = new Map<number, VTask>();
const vRaf = new Map<number, (t: number) => void>();
/** Natywny `setTimeout` zapamiętany PRZED nadpisaniem (sterownik zegara jedzie na nim). */
const nativeSetTimeout: (cb: () => void, ms: number) => unknown =
  (globalThis as unknown as { setTimeout: (f: () => void, m: number) => unknown }).setTimeout.bind(globalThis);

function vArm(): void {
  if (vArmed || (vDriving <= 0 && !vFreeRun)) return;
  if (vTasks.size === 0 && vRaf.size === 0) return;
  vArmed = true;
  // Krok klatki co ~16 ms czasu rzeczywistego (jak vsync): bez tego sterownik zalewa
  // proces GPU niezsynchronizowanymi klatkami. Czas wirtualny nie zależy od tego odstępu.
  nativeSetTimeout(vTick, 16);
}

function vTick(): void {
  vArmed = false;
  if (vDriving <= 0 && !vFreeRun) return;
  vNow += FRAME_MS;
  const due = [...vTasks.values()]
    .filter(t => t.due <= vNow)
    .sort((a, b) => (a.due - b.due) || (a.seq - b.seq));
  for (const t of due) {
    if (!vTasks.has(t.id)) continue;
    if (t.every !== null) {
      t.due = vNow + t.every;
      t.seq = ++vSeq;
    } else {
      vTasks.delete(t.id);
    }
    runSafely(t.cb);
  }
  const frames = [...vRaf.entries()];
  vRaf.clear();
  for (const [, cb] of frames) runSafely(() => cb(vNow));
  vArm();
}

/** Wyjątek z wywołania zwrotnego gry nie ginie cicho: wraca jako błąd strony (pageerror). */
function runSafely(fn: () => void): void {
  try {
    fn();
  } catch (e) {
    nativeSetTimeout(() => { throw e; }, 0);
  }
}

function vSetTimeout(cb: unknown, delay?: number, ...args: unknown[]): number {
  const id = ++vSeq;
  const d = Math.max(0, Number(delay) || 0);
  const fn = typeof cb === 'function' ? (cb as (...a: unknown[]) => void) : null;
  vTasks.set(id, { id, due: vNow + d, seq: id, every: null, cb: () => { fn?.(...args); } });
  vArm();
  return id;
}

function vSetInterval(cb: unknown, delay?: number, ...args: unknown[]): number {
  const id = ++vSeq;
  const every = Math.max(1, Number(delay) || 0);
  const fn = typeof cb === 'function' ? (cb as (...a: unknown[]) => void) : null;
  vTasks.set(id, { id, due: vNow + every, seq: id, every, cb: () => { fn?.(...args); } });
  vArm();
  return id;
}

function vClear(id: number): void {
  vTasks.delete(id);
}

function vRequestAnimationFrame(cb: (t: number) => void): number {
  const id = ++vSeq;
  vRaf.set(id, cb);
  vArm();
  return id;
}

function vCancelAnimationFrame(id: number): void {
  vRaf.delete(id);
}

/** Wywołanie haka, które napędza zegar wirtualny do końca swojej pracy. */
function drive<T>(fn: () => Promise<T>): Promise<T> {
  vDriving++;
  vArm();
  return fn().finally(() => { vDriving--; });
}

/** Czekanie w czasie wirtualnym (działa tylko wewnątrz `drive`). */
function vSleep(ms: number): Promise<void> {
  return new Promise<void>(res => { vSetTimeout(res, ms); });
}

/** Instaluje zegar wirtualny, licznik UUID i zegar tury. Tylko pod `?testhook=1`. */
function installDeterministicRuntime(): void {
  const w = window as unknown as Record<string, unknown>;
  w.setTimeout = vSetTimeout;
  w.setInterval = vSetInterval;
  w.clearTimeout = vClear;
  w.clearInterval = vClear;
  w.requestAnimationFrame = vRequestAnimationFrame;
  w.cancelAnimationFrame = vCancelAnimationFrame;
  (performance as unknown as { now: () => number }).now = () => vNow;
  THREE.MathUtils.generateUUID = detUuid;
  Date.now = () => DET_EPOCH_MS + (deps ? deps.getTurn() : 0);
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
  };
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
  // Od tej chwili klatki idą WYŁĄCZNIE na żądanie haka (`drive`). Liczba klatek wykonanych
  // przed instalacją wynika z logiki inicjalizacji, nie z czasu ściennego (sterownik jedzie
  // swobodnie tylko do tego momentu), więc stan przed startem nie zależy od obciążenia.
  vFreeRun = false;
  // Bez `Math.random` seedowanego przed startem gra zachowuje się jak zwykle do momentu
  // wywołania startGame; reseed następuje dopiero tam.
  const api = {
    startGame: (input: Partial<TestStartOpts> & { seed: number }): Promise<void> => drive(async () => {
      const opts = normalizeStartOpts(input);
      Math.random = mulberry32(opts.seed);
      await deps!.startGame(opts);
      // Gracz musi założyć stolicę, zanim tura się zamknie (bramka awaitingFirstPlayerCity).
      // Hak „klika" startowy heks tą samą ścieżką co realny gracz; `playerPassive` oznacza,
      // że potem nie ma już żadnych akcji gracza poza kończeniem tur.
      const until = nativePerfNow() + 30000;
      while (nativePerfNow() < until) {
        if (!deps!.isAwaitingFirstPlayerCity()) break;
        deps!.foundPlayerStartCity();
        await vSleep(100);
      }
      // Ustalone okno wyciszenia po starcie: kontynuacje natywne (worker mapy, ładowanie)
      // kończą się w różnym momencie czasu ściennego, ale ich timery mają się wykonać w
      // STAŁEJ liczbie klatek wirtualnych -- stan przed pierwszą turą nie zależy od tego momentu.
      for (let i = 0; i < SETTLE_FRAMES; i++) await vSleep(FRAME_MS);
    }),
    setFlag: (name: string, value: boolean | null): void => {
      const setter = FLAG_SETTERS[name];
      if (!setter) throw new Error(`test-hook: brak nadpisania flagi "${name}"`);
      setter(value);
    },
    snapshot: (): TestSnapshot => summarizeRaw(deps!.readRaw()),
    runTurns: (n: number, opts: TestRunOpts = {}): Promise<TestTurnMetric[]> => drive(async () => {
      const d = deps!;
      const policy: TestPolicy = opts.playerPolicy ?? 'pass';
      const autoBattles = opts.autoResolveBattles !== false;
      const timeout = opts.turnTimeoutMs ?? 60000;
      const out: TestTurnMetric[] = [];
      for (let i = 0; i < n; i++) {
        const t0 = nativePerfNow();
        const before = d.getTurn();
        let battlesAuto = 0;
        // Oferty AI -> gracz: decyzja wg polityki (realna funkcja modala).
        if (policy !== 'pass') {
          const accept = policy === 'accept-all-offers';
          for (const o of readOffers()) d.resolvePendingDiplomacy(o.id, accept);
        }
        // Bitwy: realny przycisk „Auto" w oknie pre-bitwy, dopóki kolejka nie jest pusta.
        const deadline = t0 + timeout;
        while (d.isBattleBusy() && nativePerfNow() < deadline) {
          if (!autoBattles) break;
          if (d.autoResolveOpenBattle()) battlesAuto++;
          else d.flushDeferredBattles();
          await vSleep(30);
        }
        d.endTurn();
        while (nativePerfNow() < deadline) {
          if (d.getTurn() > before && !d.isEndTurnInProgress() && !d.isBattleBusy()) break;
          if (autoBattles && d.autoResolveOpenBattle()) battlesAuto++;
          await vSleep(30);
        }
        const ok = d.getTurn() > before && !d.isEndTurnInProgress();
        const s = summarizeRaw(d.readRaw());
        out.push({
          turn: d.getTurn(),
          ms: Math.round(nativePerfNow() - t0),
          wars: s.warCount,
          deals: s.deals,
          offers: s.offers.length,
          battlesAuto,
          hash: s.hash,
          offerIds: s.offers.map(o => o.id),
        });
        if (!ok) {
          out[out.length - 1]!.hash = 'TIMEOUT:' + s.hash;
          break;
        }
      }
      return out;
    }),
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

// Zegar i UUID muszą działać od PIERWSZEGO timera gry, czyli od ładowania modułu
// (main.ts importuje ten moduł przed własną inicjalizacją). Bez `?testhook=1` no-op.
if (typeof window !== 'undefined' && isTestHookRequested()) {
  installDeterministicRuntime();
}
