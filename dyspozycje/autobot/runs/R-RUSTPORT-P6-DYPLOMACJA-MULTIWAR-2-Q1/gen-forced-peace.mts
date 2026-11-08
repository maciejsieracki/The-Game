// Generator wektorow: pokoj AI<->AI wymuszony (partia C, runda 4). Wola PRAWDZIWE funkcje weba
// (origin/main 5dd53e60f, gra/src/game/diplomacy-ai-forced-peace.ts). Zrodla weba bez zmian.
// Uruchomienie: OUT=<plik.json> node --experimental-strip-types --import <reg.mjs> <gen-forced-peace.mts>
import fs from 'node:fs';
import {
  registerAiPeaceRequest,
  turnsSincePeaceRequest,
  isForcedPeaceDue,
  isForcedPeaceEligiblePair,
  requesterShare,
  isClearlyLosing,
  isStillLosing,
  decideAiPeaceRequest,
  runAiAiPeaceTick,
  planPeacePayment,
  AI_PEACE_TURNS_AFTER_REQUEST,
  type AiPeaceKind,
  type AiPeaceRequest,
  type AiPeaceRequestStore,
  type AiPeaceDecision,
  type PeaceAsset,
  type PeacePaymentPlan,
} from '../web-src/gra/src/game/diplomacy-ai-forced-peace.ts';

const OUT = process.env.OUT!;

const N = (v: unknown): number => (v === 'NaN' ? NaN : (v as number));
const enc = (v: unknown): unknown => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);

type Shape =
  | { type: 'linear'; balance0: number; slope: number }
  | { type: 'kinked'; balance0: number; slope: number; knee: number; slope2: number };

const shapeFn = (s: Shape): ((c: number) => number) =>
  s.type === 'linear'
    ? (c: number) => s.balance0 + s.slope * c
    : (c: number) => (c <= s.knee ? s.balance0 + s.slope * c : s.balance0 + s.slope * s.knee + s.slope2 * (c - s.knee));

interface StoreEntryIn { key: string; requesterId: number; otherId: number; sinceTurn: unknown; kind?: AiPeaceKind }
interface AssetIn { kind: 'zloto' | 'surowiec_ilosc' | 'miasto'; id: string; amount: number; pn: number; forbidden?: boolean }
interface PriceIn { requiredPn: unknown; tolerancePn: unknown; shape: Shape }
interface Env {
  store0: StoreEntryIn[];
  limit?: number;
  eligibleNot?: string[];
  share?: Record<string, unknown>;
  gate?: Record<string, 'ok' | 'too_early' | 'stronger'>;
  price: Record<string, PriceIn>;
  assets?: Record<string, AssetIn[]>;
  cityFail?: string[];
  battlePending?: boolean;
  ticks: unknown[];
}

const reasonCode = (r: string): string => {
  if (r.startsWith('limit ')) return 'limit';
  if (r.startsWith('bramka zwycięzcy: ')) return 'gate:' + r.slice('bramka zwycięzcy: '.length);
  if (r === 'bilans zwycięzcy w tolerancji po zapłacie') return 'balance_in_tolerance';
  if (r === 'bilans zwycięzcy poniżej tolerancji (zapłata za mała)') return 'balance_below_tolerance';
  throw new Error('nieznany powod: ' + r);
};

const storeJson = (s: AiPeaceRequestStore) =>
  Array.from(s.entries()).map(([key, r]: [string, AiPeaceRequest]) => ({
    key, requesterId: r.requesterId, otherId: r.otherId, sinceTurn: enc(r.sinceTurn), kind: r.kind,
  }));

const planJson = (p: PeacePaymentPlan) => ({
  items: p.items.map(i => ({ kind: i.kind, id: i.id, amount: enc(i.amount), pn: enc(i.pn) })),
  covered: enc(p.coveredPn),
  shortfall: enc(p.shortfallPn),
  full: p.full,
  hist: [p.histogram.zloto, p.histogram.surowiec_ilosc, p.histogram.miasto],
});

const decJson = (d: AiPeaceDecision) => ({
  action: d.action,
  reason: reasonCode(d.reason),
  balanceBefore: enc(d.balanceBefore),
  balanceAfter: enc(d.balanceAfter),
  turnsSince: enc(d.turnsSince),
});

function buildStore(entries: StoreEntryIn[]): AiPeaceRequestStore {
  const s: AiPeaceRequestStore = new Map();
  for (const e of entries) {
    registerAiPeaceRequest(s, e.key, e.requesterId, e.otherId, N(e.sinceTurn), e.kind);
  }
  return s;
}

function runScenario(env: Env) {
  const store = buildStore(env.store0);
  const ticks = env.ticks.map(t => {
    const turn = N(t);
    const out = { pays: [] as unknown[], finalizes: [] as unknown[], logs: [] as string[] };
    const res = runAiAiPeaceTick({
      store,
      turn,
      ...(env.limit !== undefined ? { limit: env.limit } : {}),
      pairEligible: (a: number, b: number) => !(env.eligibleNot ?? []).includes(`${a}-${b}`),
      requesterShareOf: (r: number, o: number) => {
        const k = `${r}-${o}`;
        return env.share && k in env.share ? N(env.share[k]) : 0.5;
      },
      gateVerdict: (w: number, l: number) => env.gate?.[`${w}-${l}`] ?? 'ok',
      price: (w: number, l: number, kind: AiPeaceKind) => {
        const p = env.price[`${w}-${l}-${kind}`];
        if (!p) throw new Error(`brak wyceny ${w}-${l}-${kind}`);
        return { requiredPn: N(p.requiredPn), tolerancePn: N(p.tolerancePn), balanceFor: shapeFn(p.shape) };
      },
      assets: (l: number, w: number, skip: Set<string>): PeaceAsset[] =>
        (env.assets?.[`${l}-${w}`] ?? []).filter(a => !skip.has(a.id)).map(a => ({ ...a })),
      cityCessionOk: (cid: string) => !(env.cityFail ?? []).includes(cid),
      battlePending: env.battlePending ?? false,
      pay: (l: number, w: number, plan: PeacePaymentPlan) => { out.pays.push([l, w, enc(plan.coveredPn)]); },
      finalize: (l: number, w: number, kind: AiPeaceKind) => { out.finalizes.push([l, w, kind]); },
      log: (msg: string) => { out.logs.push(msg); },
    });
    return {
      turn: enc(turn),
      outcomes: res.map(o => ({
        pairKey: o.pairKey,
        action: o.action,
        kind: o.kind,
        plan: o.plan ? planJson(o.plan) : null,
        decision: o.decision ? decJson(o.decision) : null,
      })),
      ...out,
      store: storeJson(store),
    };
  });
  return { ticks };
}

// --- jednostkowe ---------------------------------------------------------------
const pricesFor = (w: number, l: number, kind: AiPeaceKind, p: PriceIn) => ({ [`${w}-${l}-${kind}`]: p });

const linear = (balance0: number, slope = 1): Shape => ({ type: 'linear', balance0, slope });

const scenarios: { name: string; env: Env }[] = [
  {
    name: 'przegrany_przyjety_po_oplacie_pelny',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 100, tolerancePn: 0, shape: linear(-50) }),
      share: { '1-2': 0.3 },
      assets: { '1-2': [
        { kind: 'zloto', id: 'zloto', amount: 60, pn: 60 },
        { kind: 'surowiec_ilosc', id: 'zelazo', amount: 10, pn: 40 },
      ] },
      ticks: [0],
    },
  },
  {
    name: 'bramka_too_early_wait_potem_force_przy_limicie',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 10 }],
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 300, tolerancePn: 0, shape: linear(-500) }),
      share: { '1-2': 0.3 },
      gate: { '2-1': 'too_early' },
      assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 50, pn: 50 }] },
      ticks: [10, 11, 12],
    },
  },
  {
    name: 'bilans_ponizej_tolerancji_wait_N_minus_1_force_N',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 5 }],
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 300, tolerancePn: 10, shape: linear(-200) }),
      share: { '1-2': 0.2 },
      assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 50, pn: 50 }] },
      ticks: [6, 7],
    },
  },
  {
    name: 'kinked_akceptacja_przez_tolerancje_bez_pelnej_zaplaty',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      price: pricesFor(2, 1, 'pokoj', {
        requiredPn: 120, tolerancePn: 50,
        shape: { type: 'kinked', balance0: -100, slope: 1, knee: 50, slope2: 0.5 },
      }),
      share: { '1-2': 0.4 },
      assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 60, pn: 60 }] },
      ticks: [0],
    },
  },
  {
    name: 'kinked_tolerancja_granica_wait',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      price: pricesFor(2, 1, 'pokoj', {
        requiredPn: 120, tolerancePn: 44,
        shape: { type: 'kinked', balance0: -100, slope: 1, knee: 50, slope2: 0.5 },
      }),
      share: { '1-2': 0.4 },
      assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 60, pn: 60 }] },
      ticks: [0],
    },
  },
  {
    name: 'nie_eligible_drop',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      eligibleNot: ['1-2'],
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 10, tolerancePn: 0, shape: linear(0) }),
      ticks: [0],
    },
  },
  {
    name: 'przestal_przegrywac_drop_granica_0_5',
    env: {
      store0: [
        { key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 },
        { key: '3-4', requesterId: 3, otherId: 4, sinceTurn: 0 },
      ],
      share: { '1-2': 0.5, '3-4': 0.5000001 },
      price: {
        ...pricesFor(2, 1, 'pokoj', { requiredPn: 10, tolerancePn: 0, shape: linear(100) }),
      },
      ticks: [0],
    },
  },
  {
    name: 'kolejnosc_wstawiania_i_usuwanie',
    env: {
      store0: [
        { key: '5-6', requesterId: 5, otherId: 6, sinceTurn: 0 },
        { key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 },
        { key: '3-4', requesterId: 3, otherId: 4, sinceTurn: 0 },
      ],
      eligibleNot: ['5-6'],
      share: { '1-2': 0.3, '3-4': 0.3 },
      price: {
        ...pricesFor(2, 1, 'pokoj', { requiredPn: 100, tolerancePn: 0, shape: linear(-400) }),
        ...pricesFor(4, 3, 'pokoj', { requiredPn: 50, tolerancePn: 0, shape: linear(0) }),
      },
      assets: {
        '1-2': [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }],
        '3-4': [{ kind: 'zloto', id: 'zloto', amount: 50, pn: 50 }],
      },
      gate: { '2-1': 'stronger' },
      ticks: [0, 1],
    },
  },
  {
    name: 'battle_pending_zakazuje_miast',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      battlePending: true,
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 100, tolerancePn: 0, shape: linear(-30) }),
      share: { '1-2': 0.3 },
      assets: { '1-2': [
        { kind: 'miasto', id: 'c1', amount: 1, pn: 30 },
        { kind: 'miasto', id: 'c2', amount: 1, pn: 200 },
      ] },
      ticks: [0, 2],
    },
  },
  {
    name: 'miasto_bez_battle_pending_cesja',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 100, tolerancePn: 0, shape: linear(-30) }),
      share: { '1-2': 0.3 },
      assets: { '1-2': [
        { kind: 'miasto', id: 'c1', amount: 1, pn: 30 },
        { kind: 'miasto', id: 'c2', amount: 1, pn: 200 },
      ] },
      ticks: [0],
    },
  },
  {
    name: 'cesja_miasta_odrzucona_przechodzi_do_nastepnego',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 100, tolerancePn: 0, shape: linear(-30) }),
      share: { '1-2': 0.3 },
      assets: { '1-2': [
        { kind: 'miasto', id: 'c1', amount: 1, pn: 150 },
        { kind: 'miasto', id: 'c2', amount: 1, pn: 300 },
      ] },
      cityFail: ['c1'],
      ticks: [0],
    },
  },
  {
    name: 'wszystkie_miasta_odrzucone_guard_force_zero',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 100, tolerancePn: 0, shape: linear(-300) }),
      share: { '1-2': 0.3 },
      assets: { '1-2': [
        { kind: 'miasto', id: 'c1', amount: 1, pn: 150 },
        { kind: 'miasto', id: 'c2', amount: 1, pn: 300 },
        { kind: 'miasto', id: 'c3', amount: 1, pn: 120 },
      ] },
      cityFail: ['c1', 'c2', 'c3'],
      ticks: [2],
    },
  },
  {
    name: 'nan_tura_akceptacja_i_log_nan',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 40, tolerancePn: 0, shape: linear(-10) }),
      share: { '1-2': 0.3 },
      assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 100, pn: 100 }] },
      ticks: ['NaN'],
    },
  },
  {
    name: 'rozejm_zachowuje_rodzaj',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'rozejm' }],
      price: pricesFor(2, 1, 'rozejm', { requiredPn: 20, tolerancePn: 0, shape: linear(5) }),
      share: { '1-2': 0.3 },
      assets: { '1-2': [{ kind: 'surowiec_ilosc', id: 'zelazo', amount: 5, pn: 8 }] },
      ticks: [0],
    },
  },
  {
    name: 'limit_nadpisany_jeden_tura',
    env: {
      store0: [{ key: '1-2', requesterId: 1, otherId: 2, sinceTurn: 0 }],
      limit: 1,
      price: pricesFor(2, 1, 'pokoj', { requiredPn: 100, tolerancePn: 0, shape: linear(-500) }),
      share: { '1-2': 0.3 },
      gate: { '2-1': 'too_early' },
      assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }] },
      ticks: [0, 1],
    },
  },
];

const tickOut = scenarios.map(s => ({ name: s.name, op: 'tick', env: s.env, out: runScenario(s.env) }));

// Jednostkowe: rejestracja, czas, due, kwalifikacja, udział, decyzja.
const reg = (() => {
  const s: AiPeaceRequestStore = new Map();
  const r1 = registerAiPeaceRequest(s, '1-2', 1, 2, 10);
  const r2 = registerAiPeaceRequest(s, '1-2', 1, 2, 12, 'rozejm');
  const r3 = registerAiPeaceRequest(s, '3-4', 3, 4, 12, 'rozejm');
  return { results: [r1, r2, r3], store: storeJson(s) };
})();

const req = (sinceTurn: unknown, kind: AiPeaceKind = 'pokoj'): AiPeaceRequest =>
  ({ requesterId: 1, otherId: 2, sinceTurn: N(sinceTurn), kind });

const unit = {
  register: reg,
  turns: [
    { in: { sinceTurn: 10, turn: 9 }, out: enc(turnsSincePeaceRequest(req(10), 9)) },
    { in: { sinceTurn: 10, turn: 10 }, out: enc(turnsSincePeaceRequest(req(10), 10)) },
    { in: { sinceTurn: 10, turn: 'NaN' }, out: enc(turnsSincePeaceRequest(req(10), N('NaN'))) },
  ],
  due: [
    { in: { sinceTurn: 0, turn: 1 }, out: isForcedPeaceDue(req(0), 1) },
    { in: { sinceTurn: 0, turn: 2 }, out: isForcedPeaceDue(req(0), 2) },
    { in: { sinceTurn: 0, turn: 3 }, out: isForcedPeaceDue(req(0), 3) },
    { in: { sinceTurn: 0, turn: 0, limit: 0 }, out: isForcedPeaceDue(req(0), 0, 0) },
    { in: { sinceTurn: 0, turn: 5, limit: 6 }, out: isForcedPeaceDue(req(0), 5, 6) },
    { in: { sinceTurn: 0, turn: 'NaN' }, out: isForcedPeaceDue(req(0), N('NaN')) },
    { in: { sinceTurn: 0, turn: 1, limit: 'NaN' }, out: isForcedPeaceDue(req(0), 1, N('NaN')) },
  ],
  limit: AI_PEACE_TURNS_AFTER_REQUEST,
  eligible: [
    { in: { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: false, atWar: true }, out: isForcedPeaceEligiblePair({ aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: false, atWar: true }) },
    { in: { aIsHuman: true, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: false, atWar: true }, out: false },
    { in: { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: false, eliminated: false, forcedEpochWar: false, atWar: true }, out: false },
    { in: { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: true, forcedEpochWar: false, atWar: true }, out: false },
    { in: { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: true, atWar: true }, out: false },
    { in: { aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true, eliminated: false, forcedEpochWar: false, atWar: false }, out: false },
  ],
  share: [
    { in: { rp: 1, op: 1 }, out: { share: enc(requesterShare(1, 1)), clearly: isClearlyLosing(requesterShare(1, 1)), still: isStillLosing(requesterShare(1, 1)) } },
    { in: { rp: 45, op: 55 }, out: { share: enc(requesterShare(45, 55)), clearly: isClearlyLosing(requesterShare(45, 55)), still: isStillLosing(requesterShare(45, 55)) } },
    { in: { rp: 46, op: 54 }, out: { share: enc(requesterShare(46, 54)), clearly: isClearlyLosing(requesterShare(46, 54)), still: isStillLosing(requesterShare(46, 54)) } },
    { in: { rp: 50, op: 50 }, out: { share: enc(requesterShare(50, 50)), clearly: isClearlyLosing(requesterShare(50, 50)), still: isStillLosing(requesterShare(50, 50)) } },
    { in: { rp: 51, op: 49 }, out: { share: enc(requesterShare(51, 49)), clearly: isClearlyLosing(requesterShare(51, 49)), still: isStillLosing(requesterShare(51, 49)) } },
    { in: { rp: 0, op: 0 }, out: { share: enc(requesterShare(0, 0)), clearly: isClearlyLosing(requesterShare(0, 0)), still: isStillLosing(requesterShare(0, 0)) } },
    { in: { rp: 'NaN', op: 3 }, out: { share: enc(requesterShare(N('NaN'), 3)), clearly: isClearlyLosing(requesterShare(N('NaN'), 3)), still: isStillLosing(requesterShare(N('NaN'), 3)) } },
  ],
  decide: [] as unknown[],
};

const decideCase = (name: string, p: {
  sinceTurn: unknown; turn: unknown; requiredPn: unknown; assets: AssetIn[];
  balanceBeforePn: unknown; balanceAfterPn: unknown; tolerancePn: unknown; gate: 'ok' | 'too_early' | 'stronger';
  limit?: unknown;
}) => {
  const plan = planPeacePayment(N(p.requiredPn), p.assets.map(a => ({ ...a })) as PeaceAsset[]);
  const r = req(p.sinceTurn);
  const d = decideAiPeaceRequest({
    req: r,
    turn: N(p.turn),
    plan,
    balanceBeforePn: N(p.balanceBeforePn),
    balanceAfterPn: N(p.balanceAfterPn),
    tolerancePn: N(p.tolerancePn),
    winnerGateVerdict: p.gate,
    ...(p.limit !== undefined ? { limit: N(p.limit) } : {}),
  });
  return { name, in: p, out: decJson(d), plan: planJson(plan) };
};

unit.decide = [
  decideCase('force_limit_mimo_bramki', { sinceTurn: 0, turn: 2, requiredPn: 100, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -50, balanceAfterPn: -40, tolerancePn: 0, gate: 'stronger' }),
  decideCase('wait_limit_minus_1', { sinceTurn: 0, turn: 1, requiredPn: 100, assets: [{ kind: 'zloto', id: 'zloto', amount: 100, pn: 100 }], balanceBeforePn: -50, balanceAfterPn: 50, tolerancePn: 0, gate: 'ok' }),
  decideCase('gate_too_early_pelna_zaplata', { sinceTurn: 0, turn: 1, requiredPn: 100, assets: [{ kind: 'zloto', id: 'zloto', amount: 100, pn: 100 }], balanceBeforePn: -50, balanceAfterPn: 50, tolerancePn: 0, gate: 'too_early' }),
  decideCase('accept_tolerancja_granica', { sinceTurn: 0, turn: 1, requiredPn: 100, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -50, balanceAfterPn: -50, tolerancePn: 50, gate: 'ok' }),
  decideCase('wait_ponizej_tolerancji', { sinceTurn: 0, turn: 1, requiredPn: 100, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -50, balanceAfterPn: -51, tolerancePn: 50, gate: 'ok' }),
  decideCase('zaokraglenie_polowki', { sinceTurn: 0, turn: 1, requiredPn: 100, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -50.5, balanceAfterPn: -49.5, tolerancePn: 0, gate: 'ok' }),
  decideCase('limit_jawny_nan_nie_wymusza', { sinceTurn: 0, turn: 5, requiredPn: 100, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -50, balanceAfterPn: -50, tolerancePn: 0, gate: 'ok', limit: 'NaN' }),
  decideCase('limit_jawny_6_wait', { sinceTurn: 0, turn: 5, requiredPn: 100, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -50, balanceAfterPn: -50, tolerancePn: 0, gate: 'ok', limit: 6 }),
];

const out = {
  meta: {
    pin: 'origin/main 5dd53e60f',
    source: 'gra/src/game/diplomacy-ai-forced-peace.ts',
    limitDefault: AI_PEACE_TURNS_AFTER_REQUEST,
  },
  unit,
  ticks: tickOut,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log('zapisano', OUT, 'scenariuszy tick:', tickOut.length, 'decide:', unit.decide.length);
