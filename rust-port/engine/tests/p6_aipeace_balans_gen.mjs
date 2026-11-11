// R-RUSTPORT-P6-AIPEACE-BALANS-Q1: generator wektorow z URUCHOMIONEGO weba na PINIE
// 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (gra/src/game/diplomacy-ai-forced-peace.ts, zrodla bez zmian).
//
// Zakres (regula nieujemnego bilansu AI<->AI, bramka peaceAllowed, loserBalanceFor):
//   * `decide`  - decideAiPeaceRequest z loserBalanceAfterPn / minBalancePn (kolejnosc: bilans przed limitem);
//   * `ticks`   - runAiAiPeaceTick z peaceAllowed i loserBalanceFor (wpisy wait bez planu, blokada bilansu);
//   * `helpers` - isAiAiPeaceBalanceAllowed, aiAiPeaceRequiredPn, aiAiPeaceMinBalance (JSON = 0).
//
// Uzycie (katalogi robocze POZA repo; Node 22; esbuild 0.25.0 w katalogu <esbuildDir>):
//   node rust-port/engine/tests/p6_aipeace_balans_gen.mjs <katalog gra/src+gra/data z pinu> <katalog z node_modules/esbuild> \
//     > rust-port/engine/tests/p6_aipeace_balans_vectors/vectors.json
// Katalog z pinu: `git archive --format=tar -o <plik.tar> 07d2fbd72f758705f8e1d59cc4968027ffbafe75 gra/src gra/data`,
// rozpakowany poza repo (katalog zawiera gra/src i gra/data).

import { createRequire } from 'node:module';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [webRoot, esbuildDir] = process.argv.slice(2);
if (!webRoot || !esbuildDir) throw new Error('podaj katalog z pinu (gra/src, gra/data) i katalog z esbuild');

const require = createRequire(path.join(esbuildDir, 'package.json'));
const { buildSync } = require('esbuild');
const outDir = mkdtempSync(path.join(tmpdir(), 'p6-aipeace-balans-'));

const outFile = path.join(outDir, 'diplomacy-ai-forced-peace.mjs');
buildSync({
  entryPoints: [path.join(webRoot, 'gra/src/game/diplomacy-ai-forced-peace.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: true,
  outfile: outFile,
  logLevel: 'silent',
});
const W = await import(pathToFileURL(outFile).href);
for (const n of ['decideAiPeaceRequest', 'runAiAiPeaceTick', 'registerAiPeaceRequest', 'planPeacePayment',
  'isAiAiPeaceBalanceAllowed', 'aiAiPeaceRequiredPn', 'aiAiPeaceMinBalance']) {
  if (typeof W[n] !== 'function') throw new Error('brak ' + n);
}

// Deterministyczny PRNG (mulberry32).
const makeRnd = (initialSeed) => {
  let seed = initialSeed;
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const pick = (rnd, xs) => xs[Math.floor(rnd() * xs.length)];
const int = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const N = (v) => (v === 'NaN' ? NaN : v);
const enc = (v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);

const shapeFn = (s) =>
  s.type === 'linear'
    ? (c) => s.balance0 + s.slope * c
    : (c) => (c <= s.knee ? s.balance0 + s.slope * c : s.balance0 + s.slope * s.knee + s.slope2 * (c - s.knee));

const reasonCode = (r) => {
  if (r.startsWith('limit ')) return 'limit';
  if (r.startsWith('bramka zwycięzcy: ')) return 'gate:' + r.slice('bramka zwycięzcy: '.length);
  if (r === 'bilans zwycięzcy w tolerancji po zapłacie') return 'balance_in_tolerance';
  if (r === 'bilans zwycięzcy poniżej tolerancji (zapłata za mała)') return 'balance_below_tolerance';
  if (r === 'ujemny bilans PW jednej z AI (pokoj AI↔AI zablokowany)') return 'balance_blocked';
  throw new Error('nieznany powod: ' + r);
};

const planJson = (p) => ({
  items: p.items.map((i) => ({ kind: i.kind, id: i.id, amount: enc(i.amount), pn: enc(i.pn) })),
  covered: enc(p.coveredPn),
  shortfall: enc(p.shortfallPn),
  full: p.full,
  hist: [p.histogram.zloto, p.histogram.surowiec_ilosc, p.histogram.miasto],
});

const decJson = (d) => ({
  action: d.action,
  reason: reasonCode(d.reason),
  balanceBefore: enc(d.balanceBefore),
  balanceAfter: enc(d.balanceAfter),
  turnsSince: enc(d.turnsSince),
});

// ---------------------------------------------------------------------------
// Sekcja 1: decide (z regula bilansu AI<->AI).
// ---------------------------------------------------------------------------
function decideCase(name, i) {
  const assets = i.assets;
  const plan = W.planPeacePayment(N(i.requiredPn), assets);
  const input = {
    req: { requesterId: 1, otherId: 2, sinceTurn: N(i.sinceTurn), kind: i.kind },
    turn: N(i.turn),
    plan,
    balanceBeforePn: N(i.balanceBeforePn),
    balanceAfterPn: N(i.balanceAfterPn),
    tolerancePn: N(i.tolerancePn),
    winnerGateVerdict: i.gate,
  };
  if (i.limit !== undefined) input.limit = N(i.limit);
  if (i.loserBalanceAfterPn !== undefined) input.loserBalanceAfterPn = N(i.loserBalanceAfterPn);
  if (i.minBalancePn !== undefined) input.minBalancePn = N(i.minBalancePn);
  const d = W.decideAiPeaceRequest(input);
  return {
    name,
    in: {
      sinceTurn: enc(i.sinceTurn), turn: enc(i.turn), kind: i.kind,
      requiredPn: enc(i.requiredPn), assets: assets.map((a) => ({ ...a, amount: enc(a.amount), pn: enc(a.pn) })),
      balanceBeforePn: enc(i.balanceBeforePn), balanceAfterPn: enc(i.balanceAfterPn),
      tolerancePn: enc(i.tolerancePn), gate: i.gate,
      ...(i.limit !== undefined ? { limit: enc(i.limit) } : {}),
      ...(i.loserBalanceAfterPn !== undefined ? { loserBalanceAfterPn: enc(i.loserBalanceAfterPn) } : {}),
      ...(i.minBalancePn !== undefined ? { minBalancePn: enc(i.minBalancePn) } : {}),
    },
    plan: planJson(plan),
    out: decJson(d),
  };
}

const decideCases = [];
// Reczne przypadki: kolejnosc (bilans przed limitem), granice 0, NaN, brak loser / min.
const hand = [
  { name: 'winner_neg_after_limit_blocks', sinceTurn: 0, turn: 5, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -30, balanceAfterPn: -5, tolerancePn: 0, gate: 'ok', limit: 2 },
  { name: 'winner_zero_after_limit_forces', sinceTurn: 0, turn: 5, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -30, balanceAfterPn: 0, tolerancePn: 0, gate: 'ok', limit: 2 },
  { name: 'loser_neg_after_limit_blocks', sinceTurn: 0, turn: 5, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: 3, balanceAfterPn: 4, tolerancePn: 0, gate: 'ok', limit: 2, loserBalanceAfterPn: -0.5 },
  { name: 'loser_zero_after_limit_forces', sinceTurn: 0, turn: 5, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: 3, balanceAfterPn: 4, tolerancePn: 0, gate: 'ok', limit: 2, loserBalanceAfterPn: 0 },
  { name: 'loser_nan_blocks', sinceTurn: 0, turn: 0, requiredPn: 0, assets: [], balanceBeforePn: 3, balanceAfterPn: 4, tolerancePn: 0, gate: 'ok', limit: 2, loserBalanceAfterPn: 'NaN' },
  { name: 'winner_nan_blocks', sinceTurn: 0, turn: 9, requiredPn: 0, assets: [], balanceBeforePn: 3, balanceAfterPn: 'NaN', tolerancePn: 0, gate: 'ok', limit: 2 },
  { name: 'min_override_allows_negative', sinceTurn: 0, turn: 5, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -30, balanceAfterPn: -5, tolerancePn: 0, gate: 'ok', limit: 2, minBalancePn: -10, loserBalanceAfterPn: -3 },
  { name: 'min_override_blocks_at_edge', sinceTurn: 0, turn: 1, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: -30, balanceAfterPn: -10.5, tolerancePn: 0, gate: 'ok', limit: 2, minBalancePn: -10 },
  { name: 'blocked_before_gate', sinceTurn: 0, turn: 1, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: 1, balanceAfterPn: 2, tolerancePn: 0, gate: 'too_early', limit: 2, loserBalanceAfterPn: -1 },
  { name: 'gate_wait_no_balance_issue', sinceTurn: 0, turn: 1, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: 1, balanceAfterPn: 2, tolerancePn: 0, gate: 'stronger', limit: 2, loserBalanceAfterPn: 5 },
  { name: 'accept_when_balance_ok', sinceTurn: 0, turn: 1, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }], balanceBeforePn: 1, balanceAfterPn: 2, tolerancePn: 0, gate: 'ok', limit: 2, loserBalanceAfterPn: 5 },
  { name: 'accept_tolerance_negative_balance_blocked', sinceTurn: 0, turn: 1, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 4, pn: 4 }], balanceBeforePn: -30, balanceAfterPn: -4, tolerancePn: 5, gate: 'ok', limit: 2 },
  { name: 'accept_tolerance_nonneg', sinceTurn: 0, turn: 1, requiredPn: 10, assets: [{ kind: 'zloto', id: 'zloto', amount: 4, pn: 4 }], balanceBeforePn: -30, balanceAfterPn: 0, tolerancePn: 5, gate: 'ok', limit: 2 },
  { name: 'default_limit_forced_loser_ok', sinceTurn: 0, turn: 2, requiredPn: 0, assets: [], balanceBeforePn: 2.5, balanceAfterPn: 2.5, tolerancePn: 0, gate: 'ok', loserBalanceAfterPn: 0.4 },
];
for (const h of hand) decideCases.push(decideCase(h.name, h));

const rnd = makeRnd(20261111);
const kinds = ['pokoj', 'rozejm'];
for (let k = 0; k < 400; k++) {
  const nAssets = int(rnd, 0, 2);
  const assets = [];
  for (let a = 0; a < nAssets; a++) {
    const kind = pick(rnd, ['zloto', 'surowiec_ilosc']);
    assets.push({ kind, id: kind === 'zloto' ? 'zloto' : 'res' + a, amount: int(rnd, 1, 20), pn: int(rnd, 1, 15) });
  }
  const c = {
    sinceTurn: pick(rnd, [0, 1, 2, 3, 5]),
    turn: pick(rnd, [0, 1, 2, 3, 4, 6]),
    kind: pick(rnd, kinds),
    requiredPn: pick(rnd, [0, 5, 10, 20, 35]),
    assets,
    balanceBeforePn: pick(rnd, [-40, -10.5, -5, -0.5, 0, 0.5, 3, 12.5]),
    balanceAfterPn: pick(rnd, [-40, -10.5, -5, -0.5, 0, 0.5, 3, 12.5]),
    tolerancePn: pick(rnd, [0, 0.5, 5, 10]),
    gate: pick(rnd, ['ok', 'ok', 'too_early', 'stronger']),
  };
  if (rnd() < 0.8) c.limit = pick(rnd, [1, 2, 3]);
  if (rnd() < 0.7) c.loserBalanceAfterPn = pick(rnd, [-12, -0.5, 0, 0.5, 7, 'NaN']);
  if (rnd() < 0.3) c.minBalancePn = pick(rnd, [-10, 0, 5]);
  decideCases.push(decideCase('rnd' + k, c));
}

// ---------------------------------------------------------------------------
// Sekcja 2: helpers.
// ---------------------------------------------------------------------------
const helperCases = [];
for (const [w, l, m] of [[0, undefined, 0], [-0.5, 3, 0], [0, -1, 0], [-1, -1, 0], [5, undefined, 0], [3, 3, 5], [-3, -3, -3], ['NaN', 1, 0], [1, 'NaN', 0], [0, 0, -10]]) {
  const args = [N(w), l === undefined ? undefined : N(l), N(m)];
  const allowed = args[1] === undefined
    ? W.isAiAiPeaceBalanceAllowed(args[0], undefined, args[2])
    : W.isAiAiPeaceBalanceAllowed(args[0], args[1], args[2]);
  helperCases.push({ fn: 'isAiAiPeaceBalanceAllowed', winner: enc(args[0]), loser: args[1] === undefined ? null : enc(args[1]), min: enc(args[2]), out: allowed });
}
for (const [base, w0, m] of [[0, 0, 0], [10, 3, 0], [2, -4.5, 0], [0, -20, 5], [-7, 4, 0], [1, 'NaN', 0], [4, -2, -10], [0, 2.4, -3]]) {
  helperCases.push({ fn: 'aiAiPeaceRequiredPn', base: enc(N(base)), winnerAtZero: enc(N(w0)), min: enc(N(m)), out: enc(W.aiAiPeaceRequiredPn(N(base), N(w0), N(m))) });
}
const minFromJson = W.aiAiPeaceMinBalance();

// ---------------------------------------------------------------------------
// Sekcja 3: ticks (runAiAiPeaceTick z peaceAllowed / loserBalanceFor).
// ---------------------------------------------------------------------------
const tickScenarios = [];

function runScenario(name, env) {
  const store = new Map();
  for (const e of env.store0) {
    W.registerAiPeaceRequest(store, e.key, e.requesterId, e.otherId, N(e.sinceTurn), e.kind);
  }
  const shareOf = (r, o) => {
    const k = `${r}-${o}`;
    return env.share && k in env.share ? N(env.share[k]) : 0.5;
  };
  const ticks = env.ticks.map((t) => {
    const turn = N(t);
    const out = { pays: [], finalizes: [], logs: [] };
    const d = {
      store,
      turn,
      ...(env.limit !== undefined ? { limit: env.limit } : {}),
      pairEligible: (a, b) => !(env.eligibleNot ?? []).includes(`${a}-${b}`),
      requesterShareOf: shareOf,
      gateVerdict: (w, l) => env.gate?.[`${w}-${l}`] ?? 'ok',
      ...(env.peaceAllowed !== undefined
        ? { peaceAllowed: (l, w) => env.peaceAllowed[`${l}-${w}`] ?? true }
        : {}),
      price: (w, l, kind) => {
        const p = env.price[`${w}-${l}-${kind}`];
        if (!p) throw new Error(`brak wyceny ${w}-${l}-${kind}`);
        const q = { requiredPn: N(p.requiredPn), balanceFor: shapeFn(p.shape), tolerancePn: N(p.tolerancePn) };
        const lb = env.loserShape?.[`${w}-${l}`];
        if (lb) q.loserBalanceFor = shapeFn(lb);
        return q;
      },
      assets: (l, w, skip) => (env.assets?.[`${l}-${w}`] ?? []).filter((a) => !skip.has(a.id)).map((a) => ({ ...a })),
      cityCessionOk: (cid) => !(env.cityFail ?? []).includes(cid),
      battlePending: env.battlePending ?? false,
      pay: (l, w, plan) => { out.pays.push([l, w, enc(plan.coveredPn)]); },
      finalize: (l, w, kind) => { out.finalizes.push([l, w, kind]); },
      log: (msg) => { out.logs.push(msg); },
    };
    const res = W.runAiAiPeaceTick(d);
    out.outcomes = res.map((o) => ({
      pairKey: o.pairKey,
      action: o.action,
      kind: o.kind,
      plan: o.plan ? planJson(o.plan) : null,
      decision: o.decision ? decJson(o.decision) : null,
    }));
    return out;
  });
  return {
    name,
    env,
    store0: env.store0.map((e) => ({ ...e, sinceTurn: enc(N(e.sinceTurn)) })),
    storeEnd: Array.from(store.keys()),
    ticks,
  };
}

const priceLinear = (b0, s) => ({ type: 'linear', balance0: b0, slope: s });
tickScenarios.push(runScenario('blokada_przegranego_nie_wymusza', {
  store0: [{ key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'pokoj' }],
  limit: 2,
  share: { '1-2': 0.3 },
  price: { '2-1-pokoj': { requiredPn: 10, tolerancePn: 0, shape: priceLinear(-4, 1) } },
  loserShape: { '2-1': priceLinear(-2, 0.1) },
  assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }] },
  ticks: [1, 2, 3, 6],
}));
tickScenarios.push(runScenario('zwyciezca_ujemny_po_limicie_nadal_czeka', {
  store0: [{ key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'rozejm' }],
  limit: 2,
  share: { '1-2': 0.3 },
  price: { '2-1-rozejm': { requiredPn: 10, tolerancePn: 0, shape: priceLinear(-30, 1) } },
  assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 10, pn: 10 }] },
  ticks: [1, 2, 4],
}));
tickScenarios.push(runScenario('peace_allowed_false_wait_bez_planu_then_accept', {
  store0: [{ key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'pokoj' }],
  limit: 5,
  share: { '1-2': 0.2 },
  peaceAllowed: { '1-2': false },
  price: { '2-1-pokoj': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(1, 0.5) } },
  assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 5, pn: 5 }] },
  ticks: [1, 2],
}));
tickScenarios.push(runScenario('peace_allowed_true_potem_blokada_bilansu', {
  store0: [{ key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'pokoj' }],
  limit: 5,
  share: { '1-2': 0.2 },
  peaceAllowed: { '1-2': true },
  price: { '2-1-pokoj': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(1, 0.5) } },
  loserShape: { '2-1': priceLinear(0, -1) },
  assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 5, pn: 5 }] },
  ticks: [1],
}));
tickScenarios.push(runScenario('loser_nan_blokuje_tick_i_zostaje_w_magazynie', {
  store0: [{ key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'pokoj' }],
  limit: 1,
  share: { '1-2': 0.2 },
  price: { '2-1-pokoj': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(1, 0.5) } },
  loserShape: { '2-1': { type: 'linear', balance0: 'NaN', slope: 0 } },
  assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 5, pn: 5 }] },
  ticks: [3],
}));
tickScenarios.push(runScenario('bez_loser_shape_jak_v1_force_po_limicie', {
  store0: [{ key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'pokoj' }],
  limit: 2,
  share: { '1-2': 0.2 },
  price: { '2-1-pokoj': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(-9, 0.5) } },
  assets: { '1-2': [{ kind: 'zloto', id: 'zloto', amount: 5, pn: 5 }] },
  ticks: [1, 2],
}));
tickScenarios.push(runScenario('dwie_pary_kolejnosc_i_blokada_jednej', {
  store0: [
    { key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'pokoj' },
    { key: 'C-D', requesterId: 3, otherId: 4, sinceTurn: 0, kind: 'pokoj' },
    { key: 'E-F', requesterId: 5, otherId: 6, sinceTurn: 0, kind: 'rozejm' },
  ],
  limit: 2,
  share: { '1-2': 0.2, '3-4': 0.4, '5-6': 0.1 },
  peaceAllowed: { '1-2': true, '3-4': true, '5-6': false },
  price: {
    '2-1-pokoj': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(2, 0.5) },
    '4-3-pokoj': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(-20, 0.5) },
    '6-5-rozejm': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(2, 0.5) },
  },
  loserShape: { '2-1': priceLinear(1, 0), '4-3': priceLinear(1, 0) },
  assets: {
    '1-2': [{ kind: 'zloto', id: 'zloto', amount: 5, pn: 5 }],
    '3-4': [{ kind: 'zloto', id: 'zloto', amount: 5, pn: 5 }],
    '5-6': [{ kind: 'zloto', id: 'zloto', amount: 5, pn: 5 }],
  },
  ticks: [1, 2],
}));
tickScenarios.push(runScenario('battle_pending_miasto_zakazane_blokada', {
  store0: [{ key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'pokoj' }],
  limit: 1,
  share: { '1-2': 0.2 },
  price: { '2-1-pokoj': { requiredPn: 12, tolerancePn: 0, shape: priceLinear(-1, 0.5) } },
  loserShape: { '2-1': priceLinear(0, 0.2) },
  assets: { '1-2': [
    { kind: 'zloto', id: 'zloto', amount: 4, pn: 4 },
    { kind: 'miasto', id: 'c1', amount: 1, pn: 6 },
  ] },
  battlePending: true,
  ticks: [1],
}));
tickScenarios.push(runScenario('ineligible_i_not_losing_dropy_bez_zmian', {
  store0: [
    { key: 'A-B', requesterId: 1, otherId: 2, sinceTurn: 0, kind: 'pokoj' },
    { key: 'C-D', requesterId: 3, otherId: 4, sinceTurn: 0, kind: 'pokoj' },
  ],
  limit: 2,
  eligibleNot: ['1-2'],
  share: { '3-4': 0.9 },
  price: { '2-1-pokoj': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(1, 0.5) }, '4-3-pokoj': { requiredPn: 5, tolerancePn: 0, shape: priceLinear(1, 0.5) } },
  assets: {},
  ticks: [1],
}));

const out = {
  _zrodlo: 'gra/src/game/diplomacy-ai-forced-peace.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (esbuild bundle, uruchomiony)',
  minBalanceFromJson: enc(minFromJson),
  decide: decideCases,
  helpers: helperCases,
  ticks: tickScenarios,
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
