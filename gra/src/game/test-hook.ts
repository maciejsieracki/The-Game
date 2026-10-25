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
import { setDiploTickWarBrakeOverride } from './diplomacy-tick-war-brake';
import { setDiploSensibleDealsEnabled } from './diplomacy-sensible-deals';

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
  /** R-WEB-MEASURE-ROBOCZA-Q1: id gracza (ME()). */
  playerId: number;
  /** R-WEB-MEASURE-ROBOCZA-Q1: epoka (era) każdego właściciela major, klucz = id właściciela. */
  eras: Record<string, number>;
  /** R-WEB-MEASURE-ROBOCZA-Q1: liczniki kryzysu Zaufania per para (klucz diploPairKey). */
  crisis: Record<string, number>;
  /** R-WEB-MEASURE-ROBOCZA-Q1: id wpisów warEventLog gracza (`war-<tura>-<agresor>-<cel>`). */
  playerWarEvents: string[];
  /**
   * R-WEB-MEASURE-ROBOCZA-Q1: WSZYSTKIE wpisy stołu negocjacyjnego (negotiationTable), nie tylko
   * pendingDiplomacyInbox. `isTradeAwaitingPlayer` = oferta handlowa AI->gracz, która blokuje koniec tury.
   * `bilansPW` = aiProposalPlayerBenefitSurplus dla oferty AI (dodatnia = korzyść gracza), null gdy nie AI.
   */
  negotiations: Array<{
    id: string;
    actionId: string;
    proposerOwnerId: number;
    responderOwnerId: number;
    awaitingOwnerId: number;
    authorOwnerId: number;
    source: string;
    round: number;
    reason: string | null;
    goldOnce: number | null;
    isTradeAwaitingPlayer: boolean;
    bilansPW: number | null;
  }>;
}

export interface TestHookDeps {
  /** R-WEB-MEASURE-ROBOCZA-Q1: rozstrzyga wpis stołu (accept=true -> handleNegotiationAccept, inaczej Reject). */
  resolveNegotiation(id: string, accept: boolean): void;
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
  /** R-WEB-MEASURE-ROBOCZA-Q1: pary w stanie wojny po turze ([a,b], a<b). */
  warPairs: Array<[number, number]>;
  deals: number;
  offers: number;
  battlesAuto: number;
  hash: string;
  /** Identyfikatory ofert widocznych w tej turze (do liczenia unikalnych ofert w przebiegu). */
  offerIds: string[];
  /** R-WEB-MEASURE-ROBOCZA-Q1: Zaufanie par po turze ("a-b" -> wartość). */
  trust: Record<string, number>;
  /** R-WEB-MEASURE-ROBOCZA-Q1: pełne dane ofert widocznych po turze (reason, goldOnce). */
  offerDetail: Array<{ id: string; ownerId: number; cmdType: string; reason: string; goldOnce: number | null }>;
  /** Zakończenie tury nie nastąpiło (TIMEOUT) -- sygnał zablokowanego końca. */
  endBlocked: boolean;
  /** R-WEB-MEASURE-ROBOCZA-Q1: pierwsza próba końca tury odrzucona przez bramkę z wiszącą ofertą handlową AI. */
  blockedByOffer: boolean;
  /** Ile ofert handlowych AI->gracz rozpatrzono po blokadzie (wg polityki). */
  resolvedOnBlock: number;
  /** Po rozpatrzeniu ponowna próba końca tury się udała (true) / nie (false) / brak blokady (null). */
  releasedAfterResolve: boolean | null;
  /** Oferty handlowe AI->gracz widoczne przed końcem tury (bilans, reason, typ). */
  tradeOffers: TradeOfferView[];
  /** Epoki właścicieli w tej turze (po końcu tury). */
  eras: Record<string, number>;
  /** Liczniki kryzysu Zaufania po tej turze. */
  crisis: Record<string, number>;
  /** Znacznik czasu ściennego (ms) początku i końca iteracji (do mapowania logów konsoli na tury). */
  tStart: number;
  tEnd: number;
}

export interface TradeOfferView {
  id: string;
  actionId: string;
  ownerId: number;
  reason: string | null;
  goldOnce: number | null;
  bilansPW: number | null;
  round: number;
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
  /** R-WEB-MEASURE-ROBOCZA-Q1: id gracza, mapa "q,r" -> właściciel miasta (do liczenia zdobytych miast). */
  playerId: number;
  cityOwners: Record<string, number>;
  eras: Record<string, number>;
  crisis: Record<string, number>;
  playerWarEvents: string[];
}

/** Nazwy flag -> settery `setXOverride` (ta sama funkcja, którą woła kod produkcyjny). */
const FLAG_SETTERS: Record<string, (v: boolean | null) => void> = {
  warRulesMultiwar: setWarRulesMultiwarOverride,
  warAllInCapital: setWarAllInCapitalOverride,
  // R-WEB-MEASURE-ROBOCZA-Q1: settery dyplomacji (null = wartość domyślna ON).
  diploTickWarBrake: setDiploTickWarBrakeOverride,
  diploSensibleDeals: (v: boolean | null) => setDiploSensibleDealsEnabled(v === null ? true : v),
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
    playerId: raw.playerId,
    cityOwners: Object.fromEntries(raw.cities.map(c => [`${c.q},${c.r}`, c.owner])),
    eras: raw.eras,
    crisis: raw.crisis,
    playerWarEvents: raw.playerWarEvents,
  };
}

/** Oferta handlowa AI->gracz widoczna w stole (do metryk i rozpatrywania). */
function isTradeAwaitingPlayer(n: TestRawState['negotiations'][number]): boolean {
  return n.isTradeAwaitingPlayer;
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
        const tStart = Date.now();
        const before = d.getTurn();
        let battlesAuto = 0;
        // Oferty pendingDiplomacyInbox (legacy) -> decyzja wg polityki (realna funkcja modala).
        if (policy !== 'pass') {
          const accept = policy === 'accept-all-offers';
          for (const o of d.readRaw().offers) d.resolvePendingDiplomacy(o.id, accept);
        }
        // Bitwy: realny przycisk „Auto" w oknie pre-bitwy, dopóki kolejka nie jest pusta.
        const deadline = t0 + timeout;
        while (d.isBattleBusy() && performance.now() < deadline) {
          if (!autoBattles) break;
          if (d.autoResolveOpenBattle()) battlesAuto++;
          else d.flushDeferredBattles();
          await sleep(30);
        }
        // R-WEB-MEASURE-ROBOCZA-Q1: najpierw realna próba końca tury; oferta handlowa AI na stole
        // (negotiationTable) jest rozpatrywana DOPIERO gdy bramka ją zablokowała (jak w grze:
        // gracz widzi modal i decyduje). Odrzucenie przez bramkę jest synchroniczne.
        const offersSeen = d.readRaw().negotiations.filter(isTradeAwaitingPlayer);
        const tradeOffers: TradeOfferView[] = offersSeen.map(toView);
        const tryEnd = async (): Promise<boolean> => {
          d.endTurn();
          // Odrzucone synchronicznie (bramka końca tury): nic nie wystartowało i nie czeka bitwa.
          if (!d.isEndTurnInProgress() && d.getTurn() === before && !d.isBattleBusy()) return false;
          while (performance.now() < deadline) {
            if (d.getTurn() > before && !d.isEndTurnInProgress() && !d.isBattleBusy()) return true;
            if (autoBattles && d.autoResolveOpenBattle()) battlesAuto++;
            await sleep(30);
          }
          return d.getTurn() > before && !d.isEndTurnInProgress();
        };
        let progressed = await tryEnd();
        let blockedByOffer = false;
        let resolvedOnBlock = 0;
        let releasedAfterResolve: boolean | null = null;
        if (!progressed) {
          const blocking = d.readRaw().negotiations.filter(isTradeAwaitingPlayer);
          if (blocking.length > 0) {
            blockedByOffer = true;
            for (const ng of blocking) {
              d.resolveNegotiation(ng.id, policy === 'accept-all-offers');
              resolvedOnBlock++;
            }
            progressed = await tryEnd();
            releasedAfterResolve = progressed;
          }
        }
        const ok = progressed;
        const rawAfter = d.readRaw();
        const s = summarizeRaw(rawAfter);
        // Oferty handlowe, które pojawiły się w trakcie tury (widoczne po końcu) -- dopisane do listy.
        for (const ng of rawAfter.negotiations.filter(isTradeAwaitingPlayer)) tradeOffers.push(toView(ng));
        out.push({
          turn: d.getTurn(),
          ms: Math.round(performance.now() - t0),
          wars: s.warCount,
          warPairs: s.wars,
          deals: s.deals,
          offers: s.offers.length,
          battlesAuto,
          hash: s.hash,
          offerIds: [...s.offers.map(o => o.id), ...tradeOffers.map(o => o.id)],
          trust: s.trust,
          offerDetail: s.offers.map(o => ({ id: o.id, ownerId: o.ownerId, cmdType: o.cmdType, reason: o.reason, goldOnce: o.goldOnce })),
          endBlocked: !ok,
          blockedByOffer,
          resolvedOnBlock,
          releasedAfterResolve,
          tradeOffers,
          eras: s.eras,
          crisis: s.crisis,
          tStart,
          tEnd: Date.now(),
        });
        if (!ok) {
          out[out.length - 1]!.hash = 'TIMEOUT:' + s.hash;
          break;
        }
      }
      return out;
    },
  };
  function toView(n: TestRawState['negotiations'][number]): TradeOfferView {
    return {
      id: n.id, actionId: n.actionId, ownerId: n.authorOwnerId, reason: n.reason,
      goldOnce: n.goldOnce, bilansPW: n.bilansPW, round: n.round,
    };
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
