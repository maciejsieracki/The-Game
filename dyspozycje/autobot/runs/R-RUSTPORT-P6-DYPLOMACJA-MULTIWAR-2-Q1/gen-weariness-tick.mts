// Generator wektorow runWarWearinessTick (partia B, runda 3): wola PRAWDZIWE funkcje weba
// (origin/main 5dd53e60f, gra/src + gra/data wypakowane przez `git archive` POZA repo).
// Uruchomienie: node --experimental-strip-types --import <SCRATCH>/reg.mjs <SCRATCH>/gen-weariness-tick.mts
// reg.mjs/hooks.mjs: loader ESM dorzucajacy `.ts` do importow bez rozszerzenia i czytajacy `*.json` jako modul
// (bez zmian w zrodlach weba).
import fs from 'node:fs';
import {
  runWarWearinessTick,
  WAR_WEARINESS_PARAMS,
  type PeaceAsset,
  type WarWearinessStore,
  type WearinessTickDeps,
} from './web-src/gra/src/game/war-weariness.ts';

const OUT = process.env.OUT!;

const dec = (v: unknown): unknown => (v === 'NaN' ? NaN : v);
const enc = (v: unknown): unknown => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);

interface WarInfoIn {
  warStart: number;
  turnsAtWar: unknown;
  lostA: number;
  lostB: number;
  turnsSinceCityChange: unknown;
}
interface TickIn {
  turn: number;
  pairs: [number, number][];
  info: Record<string, WarInfoIn>;
  share: Record<string, unknown>;
  cities: Record<string, number>;
  price: Record<string, { requiredPn: number; tolerancePn: number; balance0: number; slope: number }>;
  assets: Record<string, PeaceAsset[]>;
  notOk: string[];
  battlePending: boolean;
}
interface Scenario {
  name: string;
  store0: { key: string; state: Record<string, unknown> }[];
  ticks: TickIn[];
}

const pairKey = (a: number, b: number): string => (a < b ? `${a}-${b}` : `${b}-${a}`);

const gold = (id: string, amount: number, pn: number): PeaceAsset => ({ kind: 'zloto', id, amount, pn });
const res = (id: string, amount: number, pn: number): PeaceAsset => ({ kind: 'surowiec_ilosc', id, amount, pn });
const city = (id: string, pn: number, forbidden = false): PeaceAsset =>
  ({ kind: 'miasto', id, amount: 1, pn, ...(forbidden ? { forbidden: true } : {}) });

const info = (turnsAtWar: unknown, lostA = 0, lostB = 0, since: unknown = undefined, warStart = 0): WarInfoIn =>
  ({ warStart, turnsAtWar, lostA, lostB, turnsSinceCityChange: since === undefined ? turnsAtWar : since });

const base = (over: Partial<TickIn>): TickIn => ({
  turn: 0, pairs: [[1, 2]], info: {}, share: {}, cities: {}, price: {}, assets: {}, notOk: [], battlePending: false, ...over,
});

const scenarios: Scenario[] = [
  {
    name: 'nie_wyrazni_nie_zmeczeni',
    store0: [],
    ticks: [base({ turn: 50, info: { '1:2': info(50), '2:1': info(50) }, share: { '1:2': 0.5, '2:1': 0.5 } })],
  },
  {
    name: 'zmeczenie_ponizej_progu_pokoju',
    store0: [],
    ticks: [base({ turn: 130, info: { '1:2': info(130, 0, 0, 10), '2:1': info(130, 0, 0, 10) }, share: { '1:2': 0.5, '2:1': 0.5 } })],
  },
  {
    name: 'wzajemne_wyczerpanie_bez_zaplaty',
    store0: [],
    ticks: [base({ turn: 200, info: { '1:2': info(200), '2:1': info(200) }, share: { '1:2': 0.5, '2:1': 0.5 } })],
  },
  {
    name: 'wyrazny_przegrany_za_wczesnie',
    store0: [],
    ticks: [base({ turn: 5, info: { '1:2': info(5), '2:1': info(5) }, share: { '1:2': 0.3, '2:1': 0.7 } })],
  },
  {
    name: 'wyrazny_bez_strat_przed_25',
    store0: [],
    ticks: [base({ turn: 20, info: { '1:2': info(20), '2:1': info(20) }, share: { '1:2': 0.3, '2:1': 0.7 } })],
  },
  {
    name: 'oferta_przyjeta_stopien1',
    store0: [],
    ticks: [base({
      turn: 30,
      info: { '1:2': info(30, 1, 0), '2:1': info(30, 0, 1) },
      share: { '1:2': 0.3, '2:1': 0.7 },
      cities: { '1': 6, '2': 6 },
      price: { '2:1': { requiredPn: 100, tolerancePn: 0, balance0: -100, slope: 1 } },
      assets: { '1:2': [gold('g1', 200, 200), city('c1', 50), city('c2', 60)] },
    })],
  },
  {
    name: 'oferta_odrzucona_cooldown_eskalacja',
    store0: [],
    ticks: [0, 1, 3, 6].map((dt) => base({
      turn: 30 + dt,
      info: { '1:2': info(30 + dt, 1, 0), '2:1': info(30 + dt, 0, 1) },
      share: { '1:2': 0.3, '2:1': 0.7 },
      cities: { '1': 6, '2': 6 },
      price: { '2:1': { requiredPn: 100, tolerancePn: 0, balance0: -400, slope: 1 } },
      assets: { '1:2': [gold('g1', 200, 200), city('c1', 50), city('c2', 60)] },
    })),
  },
  {
    name: 'wyczerpanie_po_trzech_odrzuceniach',
    store0: [],
    ticks: [0, 3, 6, 9, 12].map((dt) => base({
      turn: 200 + dt,
      info: { '1:2': info(200 + dt, 2, 0), '2:1': info(200 + dt, 0, 2) },
      share: { '1:2': 0.3, '2:1': 0.7 },
      cities: { '1': 6, '2': 6 },
      price: { '2:1': { requiredPn: 100, tolerancePn: 0, balance0: -1000000, slope: 1 } },
      assets: { '1:2': [gold('g1', 50, 50), res('r1', 10, 30), city('c1', 80), city('c2', 120), city('c3', 40), city('c4', 500, true)] },
    })),
  },
  {
    name: 'chroniony_przegrany_musi_przyjac',
    store0: [],
    ticks: [base({
      turn: 30,
      info: { '1:2': info(30, 1, 0), '2:1': info(30, 0, 1) },
      share: { '1:2': 0.3, '2:1': 0.7 },
      cities: { '1': 2, '2': 6 },
      price: { '2:1': { requiredPn: 500, tolerancePn: 0, balance0: -100000, slope: 1 } },
      assets: { '1:2': [gold('g1', 40, 40), city('c1', 30)] },
    })],
  },
  {
    name: 'bitwa_w_toku_bez_miast',
    store0: [],
    ticks: [base({
      turn: 200,
      info: { '1:2': info(200, 2, 0), '2:1': info(200, 0, 2) },
      share: { '1:2': 0.3, '2:1': 0.7 },
      cities: { '1': 6, '2': 6 },
      price: { '2:1': { requiredPn: 100, tolerancePn: 0, balance0: -1000000, slope: 1 } },
      assets: { '1:2': [gold('g1', 10, 10), city('c1', 80), city('c2', 120)] },
      battlePending: true,
    })],
  },
  {
    name: 'miasto_niedopuszczone_pominiete',
    store0: [],
    ticks: [base({
      turn: 200,
      info: { '1:2': info(200, 2, 0), '2:1': info(200, 0, 2) },
      share: { '1:2': 0.3, '2:1': 0.7 },
      cities: { '1': 6, '2': 6 },
      price: { '2:1': { requiredPn: 100, tolerancePn: 0, balance0: -100, slope: 1 } },
      assets: { '1:2': [gold('g1', 10, 10), city('c1', 80), city('c2', 90)] },
      notOk: ['c1'],
    })],
  },
  {
    name: 'nowa_wojna_resetuje_stan',
    store0: [{ key: '1-2', state: { warStart: 10, peak: 0.9, stage: 2, rejectedOffers: 2, lastOfferTurn: 100 } }],
    ticks: [base({ turn: 43, info: { '1:2': info(3, 0, 0, 3, 40), '2:1': info(3, 0, 0, 3, 40) }, share: { '1:2': 0.5, '2:1': 0.5 } })],
  },
  {
    name: 'sprzatanie_nieaktywnych_par',
    store0: [
      { key: '5-6', state: { warStart: 1, peak: 0.6, stage: 1, rejectedOffers: 0, lastOfferTurn: -1 } },
      { key: '1-2', state: { warStart: 0, peak: 0.1, stage: 0, rejectedOffers: 0, lastOfferTurn: -1 } },
    ],
    ticks: [base({ turn: 40, info: { '1:2': info(40), '2:1': info(40) }, share: { '1:2': 0.5, '2:1': 0.5 } })],
  },
  {
    name: 'nan_tury_wojny',
    store0: [],
    ticks: [base({ turn: 60, info: { '1:2': info('NaN'), '2:1': info('NaN') }, share: { '1:2': 0.5, '2:1': 0.5 } })],
  },
  {
    name: 'nan_udzial_zwyciezca_b',
    store0: [],
    ticks: [base({
      turn: 200,
      info: { '1:2': info(200), '2:1': info(200) },
      share: { '1:2': 'NaN', '2:1': 'NaN' },
    })],
  },
  {
    name: 'dwie_pary_w_jednym_ticku',
    store0: [],
    ticks: [base({
      turn: 200,
      pairs: [[1, 2], [3, 4]],
      info: {
        '1:2': info(200), '2:1': info(200),
        '3:4': info(200), '4:3': info(200),
      },
      share: { '1:2': 0.5, '2:1': 0.5, '3:4': 0.3, '4:3': 0.7 },
      cities: { '3': 6, '4': 6 },
      price: { '4:3': { requiredPn: 100, tolerancePn: 0, balance0: -100, slope: 1 } },
      assets: { '3:4': [gold('g1', 200, 200)] },
    })],
  },
];

const runTick = (store: WarWearinessStore, t: TickIn, log: { n: number }) => {
  const pay: { loser: number; winner: number; ids: string[]; coveredPn: number }[] = [];
  const fin: { loser: number; winner: number; lockTurns: number }[] = [];
  const deps: WearinessTickDeps = {
    store,
    turn: t.turn,
    pairs: t.pairs.map(([a, b]) => ({ a, b })),
    pairKey,
    warInfo: (a, b) => {
      const w = t.info[`${a}:${b}`]!;
      return {
        warStart: w.warStart,
        turnsAtWar: dec(w.turnsAtWar) as number,
        lostA: w.lostA,
        lostB: w.lostB,
        turnsSinceCityChange: dec(w.turnsSinceCityChange) as number,
      };
    },
    shareOf: (x, y) => dec(t.share[`${x}:${y}`]) as number,
    cityCountOf: (o) => t.cities[String(o)]!,
    price: (w, l) => {
      const p = t.price[`${w}:${l}`]!;
      return { requiredPn: p.requiredPn, tolerancePn: p.tolerancePn, balanceFor: (c: number) => p.balance0 + p.slope * c };
    },
    assets: (l, w, skip) => (t.assets[`${l}:${w}`] ?? []).filter((a) => !skip.has(a.id)),
    cityCessionOk: (id) => !t.notOk.includes(id),
    battlePending: t.battlePending,
    pay: (loser, winner, plan) => {
      pay.push({ loser, winner, ids: plan.items.map((i) => i.id), coveredPn: plan.coveredPn });
    },
    finalize: (loser, winner, lockTurns) => {
      fin.push({ loser, winner, lockTurns });
    },
    log: () => { log.n++; },
  };
  const outs = runWarWearinessTick(deps);
  const outcomes = outs.map((o) => ({
    pairKey: o.pairKey,
    action: o.action,
    level: enc(o.level),
    stage: o.stage,
    plan: o.plan
      ? { ids: o.plan.items.map((i) => i.id), coveredPn: o.plan.coveredPn, full: o.plan.full,
          histogram: o.plan.histogram }
      : null,
  }));
  const snap = [...store.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([key, s]) => ({
    key,
    warStart: enc(s.warStart),
    peak: enc(s.peak),
    stage: s.stage,
    rejectedOffers: s.rejectedOffers,
    lastOfferTurn: s.lastOfferTurn,
  }));
  return { turn: t.turn, outcomes, pays: pay, finalizes: fin, logs: log.n, store: snap };
};

const out = scenarios.map((sc) => {
  const store: WarWearinessStore = new Map();
  for (const e of sc.store0) store.set(e.key, e.state as never);
  const ticks = sc.ticks.map((t) => runTick(store, t, { n: 0 }));
  return { name: sc.name, store0: sc.store0, ticks: sc.ticks, expect: ticks };
});

const doc = {
  _opis: 'Wektory runWarWearinessTick (R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 partia B). Wejscia i wyniki z prawdziwego weba origin/main 5dd53e60f (war-weariness.ts). Pole logs = liczba wywolan d.log (tekst pominiety: toFixed).',
  _pin: 'origin/main 5dd53e60f',
  _karencja_po_pokoju_tur: WAR_WEARINESS_PARAMS.przegrywajacy.karencjaPoPokojuTur,
  scenarios: out,
};
fs.writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
console.log('scenarios', out.length, 'ticks', out.reduce((n, s) => n + s.ticks.length, 0));
