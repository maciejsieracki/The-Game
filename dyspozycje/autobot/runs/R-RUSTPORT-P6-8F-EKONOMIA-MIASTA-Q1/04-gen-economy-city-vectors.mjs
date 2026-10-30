// Generator wektorow dla economy_city_fns.rs (R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1, runda 2).
// Uzywa BUNDLE zbudowanego esbuild z PLIKOW PINU 91dc998a (gra/src/game/economy.ts + production.ts),
// nie z recznie wyekstrahowanego kodu.
// Uzycie: node gen-economy-city-vectors.mjs <bundle.mjs> <wyjscie.json>
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [, , bundlePath, outPath] = process.argv;
const E = await import(pathToFileURL(bundlePath).href);

// Kodowanie liczb jako string (bez utraty bitow); -0 / NaN / Infinity jawnie.
const num = (x) => {
  if (typeof x !== 'number') throw new Error('num: ' + typeof x);
  if (Object.is(x, -0)) return '-0';
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  return String(x);
};

// Deterministyczny PRNG (mulberry32).
let seed = 0x5eed8f01;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const intIn = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const NUM_POOL = [0, -0, 1, -1, 2, 3, 4, 5, 0.5, 1.5, 2.5, -2.5, 3.9, -3.9, 10, 20, 100,
  NaN, Infinity, -Infinity, 1e-9, 2.0000001, 4.999, 5.0000001, 6, 0.3, 0.6, 0.7];
const numOrNaN = () => pick(NUM_POOL);

const ID_POOL = ['swiatynia', 'mury', 'spichlerz', 'sad', 'pretorium', 'palac', 'koszary', ''];
const BUILT_POOL = [...ID_POOL, 'nieznany', 'sad', 'palac'];

// Surowe wartosci pol JS (typy dynamiczne) jako tagowane obiekty.
const rawDaje = () => pick([
  { kind: 'true' }, { kind: 'true' }, { kind: 'false' }, { kind: 'absent' },
  { kind: 'null' }, { kind: 'str', v: 'true' }, { kind: 'str', v: 'tak' }, { kind: 'num', v: '1' }, { kind: 'num', v: '0' },
]);
const toRawDaje = (r) => {
  switch (r.kind) {
    case 'true': return true;
    case 'false': return false;
    case 'null': return null;
    case 'absent': return undefined;
    case 'str': return r.v;
    case 'num': return Number(r.v);
    default: throw new Error('kind');
  }
};
const rawZad = () => pick([
  { kind: 'absent' }, { kind: 'null' }, { kind: 'str', v: '2' }, { kind: 'num', v: num(numOrNaN()) },
  { kind: 'num', v: num(numOrNaN()) }, { kind: 'num', v: num(pick([0, -0, 2, 4, 1.5])) },
]);
const toRawZad = (r) => (r.kind === 'absent' ? undefined : r.kind === 'null' ? null
  : r.kind === 'str' ? r.v : Number(r.v));
const przyrostZad = () => pick([{ kind: 'absent' }, { kind: 'num', v: num(numOrNaN()) }, { kind: 'num', v: num(pick([0, 1, 2, 0.5])) }]);
const toPrzyrost = (r) => (r.kind === 'absent' ? undefined : Number(r.v));

const TECH_POOL = ['zelazo', 'pismo', 'kolo', 'Brak'];
const GATE_KEYS = ['1', '2', '3', '4', '5', 'abc', '0', '-1', '1.5', '2'];

const vectors = [];

// 1) sumBuildingHappinessFromBuiltIds: katalog TS (obiekty), levelFor po id.
for (let i = 0; i < 400; i++) {
  const cat = [];
  const cnt = intIn(0, 5);
  for (let k = 0; k < cnt; k++) cat.push({ id: pick(ID_POOL), dz: rawDaje(), bz: rawZad(), pz: przyrostZad() });
  const built = [];
  const bc = intIn(0, 6);
  for (let k = 0; k < bc; k++) built.push(pick(BUILT_POOL));
  const levelTable = {};
  for (const id of ID_POOL) levelTable[id] = num(numOrNaN());
  const catalog = cat.map((c) => {
    const o = { id: c.id, baza: {}, epokaWejscia: 1, maksPoziom: 1, przyrost: {} };
    const dz = toRawDaje(c.dz);
    if (dz !== undefined) o.dajeSzczescie = dz;
    const bz = toRawZad(c.bz);
    if (bz !== undefined) o.baza.zadowolenie = bz;
    const pz = toPrzyrost(c.pz);
    if (pz !== undefined) o.przyrost.zadowolenie = pz;
    return o;
  });
  const levelFor = (b) => Number(levelTable[b.id]);
  const out = E.sumBuildingHappinessFromBuiltIds(built, catalog, levelFor);
  vectors.push({
    fn: 'sumBuildingHappinessFromBuiltIds',
    in: { built, catalog: cat.map((c) => ({ id: c.id, dz: c.dz, bz: c.bz, pz: c.pz })), levelTable },
    out: num(out),
  });
}

// 2) sumBuildingHappiness: wpisy { record, level }.
for (let i = 0; i < 300; i++) {
  const cnt = intIn(0, 4);
  const ents = [];
  for (let k = 0; k < cnt; k++) ents.push({ dz: rawDaje(), bz: rawZad(), pz: przyrostZad(), level: numOrNaN() });
  const tsEnts = ents.map((e) => {
    const rec = { id: 'x', baza: {}, epokaWejscia: 1, maksPoziom: 1, przyrost: {} };
    const dz = toRawDaje(e.dz);
    if (dz !== undefined) rec.dajeSzczescie = dz;
    const bz = toRawZad(e.bz);
    if (bz !== undefined) rec.baza.zadowolenie = bz;
    const pz = toPrzyrost(e.pz);
    if (pz !== undefined) rec.przyrost.zadowolenie = pz;
    return { record: rec, level: e.level };
  });
  const out = E.sumBuildingHappiness(tsEnts);
  vectors.push({
    fn: 'sumBuildingHappiness',
    in: { entries: ents.map((e) => ({ dz: e.dz, bz: e.bz, pz: e.pz, level: num(e.level) })) },
    out: num(out),
  });
}

// 3) cityBuildingEntriesFromBuiltIds: katalog BuildingRecord (id, epokaWejscia, maksPoziom, poziomTechGate).
for (let i = 0; i < 400; i++) {
  const cat = [];
  const cnt = intIn(0, 5);
  for (let k = 0; k < cnt; k++) {
    const gateKind = pick(['none', 'null', 'obj', 'obj']);
    let gate;
    if (gateKind === 'obj') {
      gate = {};
      const gk = intIn(1, 3);
      for (let g = 0; g < gk; g++) gate[pick(GATE_KEYS)] = pick(TECH_POOL);
    } else if (gateKind === 'null') gate = null;
    cat.push({
      id: pick(ID_POOL),
      epokaWejscia: numOrNaN(),
      maksPoziom: pick([1, 2, 3, 4, 0, -1, 2.5, NaN, Infinity, 5]),
      gate: gateKind === 'none' ? undefined : gate,
    });
  }
  const built = [];
  const bc = intIn(0, 5);
  for (let k = 0; k < bc; k++) built.push(pick(BUILT_POOL));
  const cityEpoch = numOrNaN();
  const uKind = pick(['null', 'set', 'set', 'undef']);
  const unlocked = uKind === 'set' ? [...new Set([pick(TECH_POOL), pick(TECH_POOL)])] : uKind === 'null' ? null : undefined;
  const tsCat = cat.map((c) => {
    const r = { id: c.id, baza: {}, epokaWejscia: c.epokaWejscia, maksPoziom: c.maksPoziom, przyrost: {} };
    if (c.gate !== undefined) r.poziomTechGate = c.gate;
    return r;
  });
  const tsUnlocked = unlocked === undefined ? undefined : unlocked === null ? null : new Set(unlocked);
  const outEnts = E.cityBuildingEntriesFromBuiltIds(built, tsCat, cityEpoch, tsUnlocked);
  const out = outEnts.map((e) => [tsCat.indexOf(e.record), num(e.level)]);
  vectors.push({
    fn: 'cityBuildingEntriesFromBuiltIds',
    in: {
      built,
      catalog: cat.map((c) => ({
        id: c.id,
        epokaWejscia: num(c.epokaWejscia),
        maksPoziom: num(c.maksPoziom),
        gate: c.gate === undefined ? { kind: 'absent' } : c.gate === null ? { kind: 'null' }
          : { kind: 'obj', entries: Object.entries(c.gate) },
      })),
      cityEpoch: num(cityEpoch),
      unlocked: unlocked === undefined ? { kind: 'absent' } : unlocked === null ? { kind: 'null' } : { kind: 'set', items: unlocked },
    },
    out,
  });
}

// 4) productionProgress.
for (let i = 0; i < 400; i++) {
  const cost = numOrNaN(); const prog = numOrNaN(); const praca = numOrNaN();
  const r = E.productionProgress(cost, prog, praca);
  vectors.push({
    fn: 'productionProgress',
    in: { cost: num(cost), progress: num(prog), praca: num(praca) },
    out: { completed: r.completed, newZebranaPraca: num(r.newZebranaPraca), remainder: num(r.remainder) },
  });
}

// 5) corruptionRate.
for (let i = 0; i < 400; i++) {
  const d = numOrNaN(); const m = numOrNaN();
  const p = { korupcjaWspolczynnikDystansu: numOrNaN(), korupcjaWspolczynnikMiast: numOrNaN(), korupcjaCap: pick([0.5, 0.6, 1, 0, NaN, -0.1, 0.25, 2]) };
  const out = E.corruptionRate(d, m, p);
  vectors.push({
    fn: 'corruptionRate',
    in: { dystans: num(d), miasta: num(m), wd: num(p.korupcjaWspolczynnikDystansu), wm: num(p.korupcjaWspolczynnikMiast), cap: num(p.korupcjaCap) },
    out: num(out),
  });
}

// 6) corruptionBuildingReduction.
for (let i = 0; i < 200; i++) {
  const built = [];
  const bc = intIn(0, 6);
  for (let k = 0; k < bc; k++) built.push(pick(BUILT_POOL));
  vectors.push({ fn: 'corruptionBuildingReduction', in: { built }, out: num(E.corruptionBuildingReduction(built)) });
}

// 7) cityPopulationCap (runda 2: dowod dla istniejacego portu city_growth::p6_7a::r_stawki).
for (let i = 0; i < 400; i++) {
  const p = { akwedukt_prog_ludnosci: numOrNaN(), spichlerz_prog_ludnosci: numOrNaN(), akwedukt_max_ludnosci: numOrNaN() };
  const akw = pick([true, false]); const sp = pick([true, false]);
  const delta = pick([-1, 0, 1, 2, 0.5, NaN, 3, -2, -0, 1.5, Infinity, -1, 2, 0]);
  const out = E.cityPopulationCap(akw, sp, { akweduktProgLudnosci: p.akwedukt_prog_ludnosci, spichlerzProgLudnosci: p.spichlerz_prog_ludnosci, akweduktMaxLudnosci: p.akwedukt_max_ludnosci }, delta);
  vectors.push({
    fn: 'cityPopulationCap',
    in: { akw, sp, akwProg: num(p.akwedukt_prog_ludnosci), spProg: num(p.spichlerz_prog_ludnosci), akwMax: num(p.akwedukt_max_ludnosci), delta: num(delta) },
    out: num(out),
  });
}

writeFileSync(outPath,JSON.stringify({ pin: '91dc998a', source: 'gra/src/game/economy.ts + production.ts via esbuild bundle', count: vectors.length, vectors }));
console.log('vectors=' + vectors.length);
