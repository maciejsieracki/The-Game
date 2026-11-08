// R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1 (runda 2): generator wektorow z URUCHOMIONEGO weba.
// Uzycie: node gen-multiwar-vectors.cjs <WEB_ROOT> <OUT_DIR>
//   WEB_ROOT = katalog z `git archive a61337844 gra/src gra/data` (pin origin/main).
//   OUT_DIR  = rust-port/engine/tests/p6_dyplo_multiwar_gates_data
// TS transpilowany typescript.transpileModule (CJS). Importy `diplomacy` i `diplomacy-ai-forced-peace`
// zastapione stubami (pola uzywane przez testowane funkcje: diplomacy.ts:1885 deltaRelacjiSojusz,
// ten sam wzor). `diplomacy-proposals` = wycinek weba diplomacy-proposals.ts:521,533,544-553 (1:1).
// Liczby: String(x) (NaN, Infinity, -0 zachowane); undefined -> "undefined".
const fs = require('fs');
const path = require('path');
const ts = require('/opt/node22/lib/node_modules/typescript');

const WEB = process.argv[2];
const OUT = process.argv[3];
const GAME = path.join(WEB, 'gra/src/game');
const DATA = path.join(WEB, 'gra/data');
const AGG = JSON.parse(fs.readFileSync(path.join(DATA, 'diplomacy-aggressor-params.json'), 'utf8'));
const NAPSNIP = path.join(OUT, 'napsnip.ts.tmp');

const SNIP_SRC = [
  "import { deltaRelacjiSojusz } from './diplomacy';",
  'const SWEETENER_PN_PER_EASE_POINT = 25;',
  fs.readFileSync(path.join(GAME, 'diplomacy-proposals.ts'), 'utf8').split('\n')
    .map((l, i) => ([521, 533].includes(i + 1) || (i + 1 >= 544 && i + 1 <= 553) ? l : null))
    .filter(l => l !== null).join('\n'),
  'export { napRelacjaProgEfektywny, NAP_GRANICA_RELACJA_NARZUT };',
].join('\n');

const stubs = {
  diplomacy: { deltaRelacjiSojusz: (flag) => (flag ? AGG.wplywNaAI.relacjaDeltaSojusz : 0) },
  'diplomacy-ai-forced-peace': { planPeacePayment: () => { throw new Error('nie uzywane'); } },
};
const cache = new Map();

function transpile(src, file) {
  return ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: file,
  }).outputText;
}

function loadSource(file, src) {
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const fn = new Function('exports', 'require', 'module', '__dirname', transpile(src, file));
  const dir = path.dirname(file);
  fn(mod.exports, (spec) => req(spec, dir), mod, dir);
  return mod.exports;
}

function req(spec, dir) {
  if (!spec.startsWith('.')) throw new Error('nieobslugiwany import ' + spec);
  if (spec.endsWith('.json')) return JSON.parse(fs.readFileSync(path.resolve(dir, spec), 'utf8'));
  const base = path.basename(spec);
  if (base === 'diplomacy-proposals') return loadSource(NAPSNIP, SNIP_SRC);
  if (stubs[base]) return stubs[base];
  const file = path.resolve(dir, spec.endsWith('.ts') ? spec : spec + '.ts');
  return loadSource(file, fs.readFileSync(file, 'utf8'));
}

const WW = loadSource(path.join(GAME, 'war-weariness.ts'), fs.readFileSync(path.join(GAME, 'war-weariness.ts'), 'utf8'));
const RM = loadSource(path.join(GAME, 'war-rules-multiwar.ts'), fs.readFileSync(path.join(GAME, 'war-rules-multiwar.ts'), 'utf8'));
const LK = loadSource(path.join(GAME, 'diplomacy-locks.ts'), fs.readFileSync(path.join(GAME, 'diplomacy-locks.ts'), 'utf8'));

const S = (v) => (v === undefined ? 'undefined' : String(v));
const enc = (v) => (v instanceof Map ? [...v.entries()] : v);

// ---------- 1. war-weariness ----------
const wwCases = [];
const levelInputs = [
  { turnsAtWar: 0, lostCitiesTotal: 0 },
  { turnsAtWar: 199, lostCitiesTotal: 0 },
  { turnsAtWar: 200, lostCitiesTotal: 0 },
  { turnsAtWar: 201, lostCitiesTotal: 0 },
  { turnsAtWar: 100, lostCitiesTotal: 3, turnsSinceCityChange: 0 },
  { turnsAtWar: 100, lostCitiesTotal: 0, turnsSinceCityChange: 30 },
  { turnsAtWar: 100, lostCitiesTotal: 0, turnsSinceCityChange: 31 },
  { turnsAtWar: 100, lostCitiesTotal: 0, turnsSinceCityChange: 130 },
  { turnsAtWar: 100, lostCitiesTotal: 0, turnsSinceCityChange: 131 },
  { turnsAtWar: 300, lostCitiesTotal: 50 },
  { turnsAtWar: -5, lostCitiesTotal: -2 },
  { turnsAtWar: NaN, lostCitiesTotal: 0 },
  { turnsAtWar: 50, lostCitiesTotal: NaN },
  { turnsAtWar: 50, lostCitiesTotal: 0, turnsSinceCityChange: NaN },
];
for (const inp of levelInputs) {
  wwCases.push({ fn: 'warWearinessLevel', in: { turnsAtWar: S(inp.turnsAtWar), lostCitiesTotal: S(inp.lostCitiesTotal), turnsSinceCityChange: S(inp.turnsSinceCityChange) },
    out: S(WW.warWearinessLevel(inp)) });
}
for (const lv of [0, 0.49, 0.5, 0.51, 0.8, 1, 0.75, NaN]) {
  wwCases.push({ fn: 'wearinessPeacePriceFactor', in: { level: S(lv) }, out: S(WW.wearinessPeacePriceFactor(lv)) });
  wwCases.push({ fn: 'isWarWeary', in: { level: S(lv) }, out: S(WW.isWarWeary(lv)) });
}
const despairInputs = [
  [0.9, 0.45, 0], [0.9, 0.46, 0], [0, 0.2, 0], [0.4, 0.3, 1], [1, 0.1, 3], [1, 0.1, 10], [0.5, 0.0, 0], [0, 0.45, 0], [NaN, 0.2, 0], [0.5, NaN, 0],
];
for (const [level, share, lost] of despairInputs) {
  wwCases.push({ fn: 'loserDespair', in: { level: S(level), share: S(share), lostCities: S(lost) },
    out: S(WW.loserDespair({ level, share, lostCities: lost })) });
}
for (const d of [0, 0.24999, 0.25, 0.44, 0.45, 0.64, 0.65, 1, NaN]) {
  wwCases.push({ fn: 'despairStage', in: { despair: S(d) }, out: S(WW.despairStage(d)) });
}
for (const st of [0, 1, 2, 3, 4]) {
  wwCases.push({ fn: 'stageCityLimit', in: { stage: S(st) }, out: S(WW.stageCityLimit(st)) });
}
for (const [st, rej] of [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, 1], [3, 2], [2, -1], [0, NaN], [2, NaN]]) {
  wwCases.push({ fn: 'offerMultiplier', in: { stage: S(st), rejectedOffers: S(rej) }, out: S(WW.offerMultiplier(st, rej)) });
}

// ---------- 2. era gates (war-rules-multiwar.ts) ----------
const RM_DEFAULT = RM.WAR_RULES_PARAMS;
const eraCases = [];
for (const powod of [
  'R-EPOKA-KAMIEN-WYMUSZONA-WOJNA: x', 'R-EPOKA-BRAZU-WYMUSZONA-WOJNA:', 'R-EPOKA-ZELAZO-WYMUSZONA-WOJNA:y',
  'R-EPOKA-KAMIEN-WYMUSZONA-WOJNA', 'R-EPOKA-XYZ-WYMUSZONA-WOJNA:', ' R-EPOKA-KAMIEN-WYMUSZONA-WOJNA:', 'inne', '', undefined,
]) {
  eraCases.push({ fn: 'forcedEraTagFromPowod', in: { powod: S(powod) }, out: S(RM.forcedEraTagFromPowod(powod)) });
}
const enabledSets = [['stone', 'bronze', 'iron'], ['stone'], ['stone', 'bronze'], ['bronze', 'iron'], []];
for (const en of enabledSets) {
  for (const tag of ['stone', 'bronze', 'iron']) {
    const p = { ...RM_DEFAULT, enabledForcedWarEras: en };
    eraCases.push({ fn: 'isForcedEraWarEnabled', in: { enabled: en, tag }, out: S(RM.isForcedEraWarEnabled(tag, p)) });
  }
}
// canDeclareEraForcedWar: limit per era null = bez limitu; 1 = N-1/N/N+1 w zakresie 0..2
for (const cap of [null, 0, 1, 2]) {
  for (const cnt of [0, 1, 2, 3]) {
    const p = { ...RM_DEFAULT, maxEraForcedWarsPerEra: cap };
    eraCases.push({ fn: 'canDeclareEraForcedWar', in: { cap: S(cap), declared: S(cnt) },
      out: S(RM.canDeclareEraForcedWar('stone', new Map([['stone', cnt]]), p)) });
  }
}
// canCivJoinEraForcedWar: limit per civ
for (const cap of [null, 0, 1, 2]) {
  for (const cnt of [0, 1, 2]) {
    const p = { ...RM_DEFAULT, maxEraForcedWarsPerCivPerEra: cap };
    eraCases.push({ fn: 'canCivJoinEraForcedWar', in: { cap: S(cap), count: S(cnt) },
      out: S(RM.canCivJoinEraForcedWar(new Map([['7:2', cnt]]), 7, 2, p)) });
  }
}
// evaluateEraForcedWarGate: kolejnosc (era-disabled > era-cap > civ-cap-attacker > civ-cap-target)
const gateCases = [
  { multiwarEnabled: true, tag: null, enabled: ['stone', 'bronze', 'iron'], cap: null, declared: 0, counts: [], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: true, tag: 'iron', enabled: ['stone'], cap: null, declared: 0, counts: [], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: false, tag: 'iron', enabled: ['stone'], cap: null, declared: 0, counts: [], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: false, tag: 'stone', enabled: ['stone'], cap: 0, declared: 5, counts: [['1:1', 9]], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: true, tag: 'stone', enabled: ['stone'], cap: 1, declared: 1, counts: [], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: true, tag: 'stone', enabled: ['stone'], cap: 1, declared: 0, counts: [], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: true, tag: 'stone', enabled: ['stone'], cap: null, declared: 9, counts: [['1:1', 1]], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: true, tag: 'stone', enabled: ['stone'], cap: null, declared: 9, counts: [['1:1', 0], ['2:1', 1]], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: true, tag: 'stone', enabled: ['stone'], cap: null, declared: 9, counts: [['2:1', 1]], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: 1 },
  { multiwarEnabled: true, tag: 'stone', enabled: ['stone'], cap: null, declared: 9, counts: [['1:1', 2]], att: 1, attE: 1, tgt: 2, tgtE: 1, civCap: null },
  { multiwarEnabled: true, tag: 'bronze', enabled: ['bronze'], cap: null, declared: 0, counts: [['1:2', 1], ['2:1', 0]], att: 1, attE: 2, tgt: 2, tgtE: 1, civCap: 1 },
];
for (const g of gateCases) {
  const p = { ...RM_DEFAULT, enabledForcedWarEras: g.enabled, maxEraForcedWarsPerEra: g.cap, maxEraForcedWarsPerCivPerEra: g.civCap };
  const verdict = RM.evaluateEraForcedWarGate({
    multiwarEnabled: g.multiwarEnabled, tag: g.tag, declaredByTag: new Map(g.tag ? [[g.tag, g.declared]] : []),
    counts: new Map(g.counts), attackerId: g.att, attackerEpoch: g.attE, targetId: g.tgt, targetEpoch: g.tgtE,
  }, p);
  eraCases.push({ fn: 'evaluateEraForcedWarGate', in: g, out: verdict });
}

// ---------- 3. NAP trust (diplomacy-locks.ts case '2' + napRelacjaProgEfektywny) ----------
const napCases = [];
for (const [prog, kara, agr, ease] of [
  [30, false, false, undefined], [30, true, false, undefined], [30, false, true, undefined], [30, true, true, undefined],
  [30, true, false, 5], [10, false, false, 40], [0, false, false, 0], [40, false, false, 25.5],
]) {
  napCases.push({ fn: 'napRelacjaProgEfektywny', in: { prog: S(prog), kara, agr, ease: S(ease) },
    out: S(LK && require_napsnip().napRelacjaProgEfektywny(prog, { karaWspolnaGranica: kara, proponentAgresor: agr, napEase: ease })) });
}
function require_napsnip() { return loadSource(NAPSNIP, SNIP_SRC); }

function ctxFor(o) {
  return {
    actionId: '2', contact: true, atWar: o.atWar, relTotal: o.rel, zaufanie: o.zauf, respekt: 0, hasNap: o.hasNap,
    hasHandel: false, hasTradeConnection: true, hasSojusz: false, sellableTechCount: 0, buyableTechCount: 0,
    knownRivalsCount: 0, progNapRelacja: o.progRel, progNapZaufanie: o.progZauf, karaWspolnaGranica: o.kara,
    napAgresorAktywny: o.agr, progHandelRelacja: 0, progSojuszRelacja: 0, progSojuszZaufanie: 0, progGraniceRelacja: 0,
    progGraniceZaufanie: 0, progWymianaTechZaufanie: 0, progNamowWojneZaufanie: 0, progWasalizacjaRespekt: 0,
    progTrybutZadanieMinRespekt: 0, progDarRelacja: 0,
  };
}
const napInputs = [];
for (const progRel of [30, 0]) for (const progZauf of [30, undefined]) for (const kara of [false, true]) for (const agr of [false, true]) {
  napInputs.push({ atWar: false, hasNap: false, rel: 50, zauf: 30, progRel, progZauf, kara, agr });
}
// N-1 / N / N+1 wokol progu Zaufania (30) i progu Relacji (30 + narzut)
for (const zauf of [29, 30, 31]) for (const rel of [49, 50, 51, 54, 55, 56]) {
  napInputs.push({ atWar: false, hasNap: false, rel, zauf, progRel: 30, progZauf: 30, kara: true, agr: false });
  napInputs.push({ atWar: false, hasNap: false, rel, zauf, progRel: 30, progZauf: 30, kara: false, agr: true });
}
napInputs.push({ atWar: true, hasNap: false, rel: 100, zauf: 100, progRel: 30, progZauf: 30, kara: false, agr: false });
napInputs.push({ atWar: false, hasNap: true, rel: 0, zauf: 0, progRel: 30, progZauf: 30, kara: false, agr: false });
napInputs.push({ atWar: false, hasNap: false, rel: 0, zauf: 0, progRel: 30, progZauf: 30, kara: false, agr: false });
napInputs.push({ atWar: false, hasNap: false, rel: 20, zauf: 5, progRel: 10, progZauf: 10, kara: true, agr: true });
for (const o of napInputs) {
  const res = LK.resolveDiplomacyActionLock(ctxFor(o));
  napCases.push({
    fn: 'resolveDiplomacyActionLock2', in: o,
    out: { locked: res.locked === true, active: res.active === true, note: res.note ?? '',
      requirement: res.requirement ? { kind: res.requirement.kind, prog: S(res.requirement.prog), masz: S(res.requirement.masz) } : null },
  });
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'weariness.json'), JSON.stringify(wwCases, null, 1) + '\n');
fs.writeFileSync(path.join(OUT, 'era.json'), JSON.stringify(eraCases, null, 1) + '\n');
fs.writeFileSync(path.join(OUT, 'nap.json'), JSON.stringify(napCases, null, 1) + '\n');
try { fs.unlinkSync(NAPSNIP); } catch (e) { /* brak pliku */ }
console.log('weariness', wwCases.length, 'era', eraCases.length, 'nap', napCases.length);
