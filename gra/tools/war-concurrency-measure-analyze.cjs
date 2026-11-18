'use strict';
/**
 * R-WEB-DIPLO-WAR-CONCURRENCY-MEASURE-Q1: analiza surowego JSONL z runnera war-concurrency-measure-run.cjs.
 * TYLKO ODCZYT pliku wynikowego. Wejscie: <plik.jsonl> (wiersze tur z polem `wars.pairs`, `wars.epochs`).
 * Wyjscie (stdout, JSON): epizody wojen (para, typ EPOKI/NATURALNA, tura startu, tura konca), liczniki (a)-(d),
 * zdarzenia (c): cywilizacja X w aktywnej wojnie EPOKI zostaje celem lub wypowiada wojne NATURALNA.
 * Uzycie: node tools/war-concurrency-measure-analyze.cjs <seedN.jsonl>
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) { console.error('uzycie: node tools/war-concurrency-measure-analyze.cjs <seedN.jsonl>'); process.exit(2); }
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const withWars = rows.filter(r => r.wars && Array.isArray(r.wars.pairs));
const turns = withWars.map(r => r.turn);
const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const playerOf = (a, b) => a === 0 || b === 0;

const episodes = new Map(); // key(pair)@startTurn -> epizod
const active = new Map();   // key(pair) -> epizod otwarty
const eventsC = [];
const perTurnByCiv = [];
const epochsByTurn = {};
let prevEpokiMap = null;    // civ -> wojna EPOKI aktywna w poprzedniej turze
for (const r of withWars) {
  const t = r.turn;
  epochsByTurn[t] = r.wars.epochs || {};
  const now = new Map();
  for (const p of r.wars.pairs) now.set(key(p.a, p.b), p);
  for (const [k, ep] of active) {
    if (!now.has(k)) { ep.endTurn = t - 1; active.delete(k); }
  }
  for (const [k, p] of now) {
    if (!active.has(k)) {
      const ep = { pair: k, a: p.a, b: p.b, startTurn: t, endTurn: null, typ: p.typ, epokaTag: p.epokaTag, wojnaStartTura: p.wojnaStartTura, gracz: playerOf(p.a, p.b) };
      active.set(k, ep);
      episodes.set(`${k}@${t}`, ep);
      // (c): nowa wojna NATURALNA z udzialem X, ktory w poprzedniej turze byl w aktywnej wojnie EPOKI.
      if (p.typ === 'NATURALNA' && prevEpokiMap) {
        for (const x of [p.a, p.b]) {
          const other = x === p.a ? p.b : p.a;
          const w = prevEpokiMap.get(x);
          if (w) eventsC.push({ tura: t, X: x, druga: other, typNowej: 'NATURALNA', wojnaEpokiX: w, czyGracz: playerOf(p.a, p.b) });
        }
      }
    }
  }
  const epokiMap = new Map();
  for (const p of now.values()) {
    if (p.typ === 'EPOKI') {
      epokiMap.set(p.a, { partner: p.b, tag: p.epokaTag });
      epokiMap.set(p.b, { partner: p.a, tag: p.epokaTag });
    }
  }
  prevEpokiMap = epokiMap;
  const per = {};
  for (const p of now.values()) {
    for (const x of [p.a, p.b]) {
      per[x] = per[x] || { epoki: 0, natural: 0 };
      if (p.typ === 'EPOKI') per[x].epoki++; else per[x].natural++;
    }
  }
  perTurnByCiv.push({ turn: t, per });
}

const allEps = [...episodes.values()];
const epoki = allEps.filter(e => e.typ === 'EPOKI');
const natural = allEps.filter(e => e.typ === 'NATURALNA');
const civSet = new Set();
for (const r of withWars) for (const id of Object.keys(r.wars.epochs || {})) civSet.add(Number(id));
const civs = [...civSet].sort((a, b) => a - b);
const epokiCivs = new Set();
for (const e of epoki) { epokiCivs.add(e.a); epokiCivs.add(e.b); }
const epokiPairs = new Set(epoki.map(e => e.pair));
const naturalPairs = new Set(natural.map(e => e.pair));

const maxConc = {}; const sumConc = {}; const cntConc = {};
let maxNatPerCiv = 0; let turnsWith2Nat = 0; const civ2Nat = new Set();
for (const { turn, per } of perTurnByCiv) {
  for (const id of Object.keys(per)) {
    const tot = per[id].epoki + per[id].natural;
    const k = `epoka${(epochsByTurn[turn] || {})[id]}`;
    maxConc[k] = Math.max(maxConc[k] || 0, tot);
    sumConc[k] = (sumConc[k] || 0) + tot;
    cntConc[k] = (cntConc[k] || 0) + 1;
    if (per[id].natural > maxNatPerCiv) maxNatPerCiv = per[id].natural;
    if (per[id].natural >= 2) { turnsWith2Nat++; civ2Nat.add(Number(id)); }
  }
}
const srednie = {};
for (const k of Object.keys(sumConc)) srednie[k] = Math.round((sumConc[k] / cntConc[k]) * 100) / 100;

// R-WEB-DIPLO-WAR-CONCURRENCY-MEASURE-Q1 (runda 2): miasta-państwa (z haka cityStateOwners) i probe bramki R2 (gate).
// Brak pola w wierszach (stare dowody) -> null = NIE ZMIERZONO.
const cityStateSet = new Set();
let haveCityStates = false;
for (const r of withWars) {
  if (Array.isArray(r.wars.cityStates)) { haveCityStates = true; for (const id of r.wars.cityStates) cityStateSet.add(id); }
}
const gateRows = withWars.filter(r => r.wars.gate && typeof r.wars.gate === 'object');
const gateBlockedTurns = gateRows.filter(r => (r.wars.gate.attackersBlockedByStoneLimit || []).length > 0);
const gateProbeSummary = gateRows.length === 0 ? null : {
  tur: gateRows.length,
  turyZAtakujacymBlokowanymR2Kamien: gateBlockedTurns.length,
  przykladTury: gateBlockedTurns.slice(0, 5).map(r => ({ tura: r.turn, napastnicy: r.wars.gate.attackersBlockedByStoneLimit })),
  uwaga: 'probe STANU: werdykt bramki dla hipotetycznego zwyklego wypowiedzenia; NIE liczba odrzuconych prob (e)',
};

const out = {
  plik: file,
  tury: { pierwsza: turns[0] ?? null, ostatnia: turns.length ? turns[turns.length - 1] : null, liczba: turns.length },
  cywilizacjeWDanych: civs,
  a_wojnyEpoki: {
    liczbaEpizodow: epoki.length,
    liczbaParUczestniczacychRozne: epokiPairs.size,
    epizody: epoki.map(e => ({ para: [e.a, e.b], start: e.startTurn, koniec: e.endTurn, tag: e.epokaTag, graczem: e.gracz })),
    cywilizacjeKiedykolwiekStronaEpoki: [...epokiCivs].sort((x, y) => x - y),
    cywilizacjeBezWojnyEpoki: civs.filter(c => !epokiCivs.has(c)),
    miastaPanstwa: haveCityStates ? [...cityStateSet].sort((x, y) => x - y) : null,
    glowneBezWojnyEpoki: haveCityStates ? civs.filter(c => !epokiCivs.has(c) && !cityStateSet.has(c)) : null,
    glowneKiedykolwiekStronaEpoki: haveCityStates ? [...epokiCivs].filter(c => !cityStateSet.has(c)).sort((x, y) => x - y) : null,
  },
  b_wojnyNaturalne: {
    liczbaEpizodow: natural.length,
    liczbaPar: naturalPairs.size,
    epizody: natural.map(e => ({ para: [e.a, e.b], start: e.startTurn, koniec: e.endTurn, graczem: e.gracz })),
  },
  c_zdarzeniaEpokiPotemNaturalna: eventsC,
  d_wspolbieznosc: {
    maksNaCywilizacjePerEpoka: maxConc,
    sredniaNaCywilizacjePerEpoka: srednie,
    maksNaturalnychNaCywilizacje: maxNatPerCiv,
    tur2NaturalneNaCywilizacje: turnsWith2Nat,
    cywilizacjeZ2Naturalnymi: [...civ2Nat].sort((x, y) => x - y),
  },
  e_probeBramkiKamien: gateProbeSummary,
  nieZmierzone: gateProbeSummary
    ? ['(e) liczba ODRZUCONYCH prob wypowiedzenia przez bramke stone_limit: hak nie liczy prob (tylko probe stanu w e_probeBramkiKamien)']
    : ['(e) odrzucone proby stone_limit: brak haka (dowody sprzed rundy 2)'],
};
console.log(JSON.stringify(out, null, 2));
