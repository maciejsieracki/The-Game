// Generator wektorow R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1 (pin weba 4bbef081d).
// Uruchamiane sa PRAWDZIWE funkcje weba (esbuild bundle modulow z `git archive` pinu, zero buildu w gra/):
//   diplomacy-peace-lock.ts, diplomacy-war-gates.ts, alliance-war-obligation.ts, diplomacy-treaties.ts,
//   diplomacy.ts (flaga agresora / casus belli / singleton stanu).
// Kodowanie liczb w JSON: NaN -> "NaN", Infinity -> "Infinity", -Infinity -> "-Infinity", undefined/null -> null, -0 -> 0.
// Uzycie: node gen-p6-dypl1-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_DIR>
// Wyjscie: katalog z plikami truce.json, gates.json, honor_treaties.json, aggressor.json (kazdy <= 6 MB).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outFile] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outFile) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_JSON>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '4bbef081d'], { encoding: 'utf8' }).trim();
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
mkdirSync(outFile, { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', workDir]);
const game = join(workDir, 'gra/src/game');
const esbuild = await import(pathToFileURL(esbuildMain).href);

const THREE_NAMES = ['ACESFilmicToneMapping', 'AmbientLight', 'Box3', 'BoxGeometry', 'BufferAttribute', 'BufferGeometry', 'Camera', 'CanvasTexture', 'CatmullRomCurve3', 'CircleGeometry', 'Color', 'ConeGeometry', 'CylinderGeometry', 'DirectionalLight', 'DodecahedronGeometry', 'DoubleSide', 'Euler', 'ExtrudeGeometry', 'Float32BufferAttribute', 'Fog', 'FogExp2', 'Group', 'HemisphereLight', 'IcosahedronGeometry', 'InstancedBufferAttribute', 'InstancedMesh', 'Intersection', 'Line', 'LineBasicMaterial', 'LineDashedMaterial', 'LineLoop', 'LineSegments', 'LinearFilter', 'LinearMipmapLinearFilter', 'Material', 'MathUtils', 'Matrix4', 'Mesh', 'MeshBasicMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial', 'Object3D', 'OctahedronGeometry', 'OrthographicCamera', 'PCFSoftShadowMap', 'Path', 'PerspectiveCamera', 'Plane', 'PlaneGeometry', 'QuadraticBezierCurve3', 'Quaternion', 'Raycaster', 'RingGeometry', 'SRGBColorSpace', 'Scene', 'Shape', 'ShapeGeometry', 'SphereGeometry', 'Sprite', 'SpriteMaterial', 'Texture', 'TorusGeometry', 'TubeGeometry', 'Vector2', 'Vector3', 'WebGLRenderer'];
const THREE_STUB = 'class S { constructor() { return new Proxy(this, { get: (t, k) => (k in t ? t[k] : () => {}) }); } }\n' + THREE_NAMES.map((n) => 'export const ' + n + ' = S;').join('\n');

const built = await esbuild.build({
  stdin: {
    contents: [
      "export { PEACE_TREATY_LOCK_TURNS, isPeaceTreatyLocked, startPeaceTreatyLock, filterAllianceObligationsRespectingPeaceLock, TRUCE_DURATION_OPTIONS, TRUCE_DEFAULT_TURNS, normalizeTruceDuration, truceUntilTurn, isTruceActive, truceExpiryAction, isTruceBreach } from './diplomacy-peace-lock';",
      "export { PEACE_CURRENCY_ACTION_IDS, isPeaceCurrencyAction, isNapBlockingWarDeclaration, payloadHasCurrencyPayment, isCurrencyProposalForbiddenDuringWar } from './diplomacy-war-gates';",
      "export { shouldHonorAllianceWarObligation } from './alliance-war-obligation';",
      "export { allianceObligationsForWarDeclaration, allianceObligations, isDefensiveAllianceWarObligation, treatiesBrokenByRefusal, treatiesBrokenByWar } from './diplomacy-treaties';",
      "export { AGGRESSOR_PARAMS, czyDajeFlageAgresora, przyczynaWypowiedzenia, ustawFlageAgresora, czyAgresor, mnoznikWillingnessAlly, deltaRelacjiSojusz, casusBelliKey, ustawCasusBelli, maCasusBelli, serializujMape, wczytajMape, pobierzStanAgresorow, pobierzStanCasusBelli, ustawStanAgresorow, ustawStanCasusBelli, resetStanAgresora, czyAgresorAktywny, doTuryFlagiAgresora, maCasusBelliAktywne, zarejestrujWypowiedzenie, zarejestrujCasusBelli } from './diplomacy';",
    ].join('\n'),
    resolveDir: game, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', loader: { '.json': 'json', '.png': 'dataurl' },
  plugins: [{ name: 'three-stub', setup(b) {
    b.onResolve({ filter: /^three(\/.*)?$/ }, (a) => ({ path: a.path, namespace: 'three-stub' }));
    b.onLoad({ filter: /.*/, namespace: 'three-stub' }, () => ({ contents: THREE_STUB, loader: 'js' }));
  } }],
});
const bundleFile = join(workDir, 'web-bundle.mjs');
writeFileSync(bundleFile, built.outputFiles[0].text);
const W = await import(pathToFileURL(bundleFile).href);

// ---- kodowanie ----
function E(x) {
  if (x === undefined || x === null) return null;
  if (typeof x === 'number') {
    if (Number.isNaN(x)) return 'NaN';
    if (x === Infinity) return 'Infinity';
    if (x === -Infinity) return '-Infinity';
    return x === 0 ? 0 : x;
  }
  if (Array.isArray(x)) return x.map(E);
  if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x)) { if (x[k] !== undefined) o[k] = E(x[k]); } return o; }
  return x;
}
// wynik metadanych pary: zachowanie JSON.stringify (NaN/Infinity -> null, undefined pomijane)
const J = (x) => JSON.parse(JSON.stringify(x));

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rng = mulberry32(0xD1B10001);
const ri = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (a) => a[Math.floor(rng() * a.length)];
const chance = (p) => rng() < p;

const NUMS = [undefined, null, NaN, Infinity, -Infinity, -1, 0, 1, 2, 4, 5, 6, 9, 10, 11, 14, 15, 16, 19, 20, 21, 0.5, 5.5, 10.0000001, 1e21, -0.5, 1e-7];
const TURNS = [NaN, Infinity, -Infinity, -1, 0, 1, 4, 5, 6, 9, 10, 11, 14, 15, 16, 19, 20, 21, 24, 25, 26, 100, 0.5, 5.5];
const out = { pin: PIN, params: { aggressor: J(W.AGGRESSOR_PARAMS), peaceLockTurns: W.PEACE_TREATY_LOCK_TURNS, truceOptions: [...W.TRUCE_DURATION_OPTIONS], truceDefault: W.TRUCE_DEFAULT_TURNS, peaceCurrencyIds: [...W.PEACE_CURRENCY_ACTION_IDS] } };

// ================= TRUCE =================
out.truce = { normalize: [], untilTurn: [], active: [], expiry: [], breach: [], locked: [], startLock: [], filter: [], saveRound: [] };
for (const t of NUMS) out.truce.normalize.push({ in: E(t), out: E(W.normalizeTruceDuration(t)) });
for (const s of [NaN, Infinity, -Infinity, -1, 0, 1, 5, 10.5, 99]) for (const d of NUMS) {
  if (d === undefined || d === null) continue; // sygnatura weba: durationTurns: number
  out.truce.untilTurn.push({ start: E(s), dur: E(d), out: E(W.truceUntilTurn(s, d)) });
}
for (const u of NUMS) for (const t of TURNS) {
  out.truce.active.push({ until: E(u), turn: E(t), out: W.isTruceActive(u, t) });
  out.truce.expiry.push({ until: E(u), turn: E(t), out: W.truceExpiryAction(u, t) });
  out.truce.breach.push({ until: E(u), turn: E(t), out: W.isTruceBreach(u, t) });
  out.truce.locked.push({ meta: 'peace', until: E(u), turn: E(t), out: W.isPeaceTreatyLocked({ trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0, peaceUntilTurn: u }, t) });
}
for (const t of TURNS) {
  out.truce.locked.push({ meta: 'undefined', until: null, turn: E(t), out: W.isPeaceTreatyLocked(undefined, t) });
  out.truce.locked.push({ meta: 'nofield', until: null, turn: E(t), out: W.isPeaceTreatyLocked({ trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0 }, t) });
  // pole truceUntilTurn NIE wplywa na blokade pokoju
  out.truce.locked.push({ meta: 'truceonly', until: null, turn: E(t), out: W.isPeaceTreatyLocked({ trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0, truceUntilTurn: 30 }, t) });
}
const META_VARIANTS = [
  { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0 },
  { trustPnGainedThisTurn: 3, dobraWolaRemainingTur: 2, wojnaOdTury: 4, n1Zastosowany: true },
  { trustPnGainedThisTurn: 1, dobraWolaRemainingTur: 0, peaceUntilTurn: 7, truceUntilTurn: 12, n3Window: { turn: 2, typ: 'bezterminowe', byOwnerId: 3, charged: true } },
  { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 5, ostatniePrzewinienieWobecNas: { turn: 3, typ: 'zlamanie_paktu_nap', byOwnerId: 1, againstOwnerId: 2 }, wojnaStartTura: 9 },
];
for (const m of META_VARIANTS) for (const t of [NaN, Infinity, -1, 0, 1, 7, 50, 2.5]) for (const lt of [undefined, NaN, Infinity, -Infinity, -5, 0, 0.9, 1, 1.9, 2, 10, 15.7, 1e9]) {
  const r = lt === undefined ? W.startPeaceTreatyLock(m, t) : W.startPeaceTreatyLock(m, t, lt);
  out.truce.startLock.push({ meta: m, turn: E(t), lockTurns: E(lt), out: J(r) });
}
// filterAllianceObligationsRespectingPeaceLock
for (let i = 0; i < 400; i++) {
  const nOb = ri(0, 4);
  const obs = [];
  for (let k = 0; k < nOb; k++) {
    const allies = []; for (let a = ri(0, 3); a > 0; a--) allies.push(ri(0, 5));
    obs.push({ mustDeclareWarOn: ri(0, 5), obligatedAllies: allies, treatyIdsToBreakOnRefusal: Array.from({ length: ri(0, 2) }, () => `t${ri(0, 9)}`) });
  }
  const locked = []; for (let k = ri(0, 8); k > 0; k--) locked.push([ri(0, 5), ri(0, 5)]);
  const set = new Set(locked.map(([a, b]) => `${a}>${b}`));
  const calls = [];
  const r = W.filterAllianceObligationsRespectingPeaceLock(obs, (a, b) => { calls.push([a, b]); return set.has(`${a}>${b}`); });
  out.truce.filter.push({ obligations: obs, locked, out: r, calls });
}
// serde pary: tablica [klucz, meta] zapisana jak main.ts:33540 (JSON.stringify)
for (let i = 0; i < 60; i++) {
  const entries = [];
  for (let k = ri(0, 4); k > 0; k--) {
    const m = { ...pick(META_VARIANTS) };
    if (chance(0.5)) m.truceUntilTurn = pick([5, 10, 15, 22]);
    if (chance(0.3)) m.peaceUntilTurn = pick([3, 8, 40]);
    if (chance(0.3)) m.wojnaOdTury = ri(0, 30);
    entries.push([`${ri(0, 3)}-${ri(4, 7)}`, m]);
  }
  out.truce.saveRound.push({ entries: J(entries) });
}

// ================= WAR GATES =================
out.gates = { peaceCurrency: [], payload: [], forbidden: [], nap: [] };
const IDS = ['pokoj', 'rozejm', 'trybut_oferta', 'handel', 'umowa_handlowa', '', 'Pokoj', 'pokoj ', 'POKOJ', 'ultimatum', 'trybut_zadanie', 'sojusz_pelny', 'namow_wojne'];
for (const id of IDS) out.gates.peaceCurrency.push({ id, out: W.isPeaceCurrencyAction(id) });
for (const b of [true, false]) out.gates.nap.push({ in: b, out: W.isNapBlockingWarDeclaration(b) });
const GOLD = [undefined, null, 0, -1, 1, 0.0001, NaN, Infinity, -Infinity];
const ITEMS = [undefined, null, [], [{ typ: 'zloto' }], [{ typ: 'praca' }], [{ typ: 'zasob' }], [{ typ: 'zloto', ilosc: 0 }], [{ typ: 'praca', ilosc: NaN }], [{ typ: 'zasob' }, { typ: 'praca', ilosc: 3 }], [{ typ: 'Zloto' }], [{ typ: 'miasto' }, { typ: 'tech' }]];
const payloads = [undefined, {}];
for (const go of GOLD) for (const gp of GOLD) for (const gi of ITEMS) for (const ri2 of ITEMS) {
  if (chance(0.55)) continue;
  payloads.push({ goldOnce: go, goldPerTurn: gp, giveItems: gi, receiveItems: ri2 });
}
// payload jako obiekt bez zmian (E koduje NaN/Infinity); undefined -> null
for (const p of payloads) out.gates.payload.push({ payload: p === undefined ? null : E(p), out: W.payloadHasCurrencyPayment(p) });
for (const p of payloads) for (const id of ['pokoj', 'rozejm', 'trybut_oferta', 'handel', 'ultimatum']) for (const aw of [undefined, true, false]) {
  if (chance(0.93)) continue;
  out.gates.forbidden.push({ id, payload: p === undefined ? null : E(p), atWar: aw === undefined ? null : aw, out: aw === undefined ? W.isCurrencyProposalForbiddenDuringWar(id, p) : W.isCurrencyProposalForbiddenDuringWar(id, p, aw) });
}

// ================= ALLIANCE WAR OBLIGATION =================
out.honor = [];
const RATIO = [-1, 0, 0.54, 0.55, 0.56, 0.74, 0.75, 0.76, 1, 2, NaN, Infinity, -Infinity];
function pushHonor(inp) { out.honor.push({ in: E(inp), out: W.shouldHonorAllianceWarObligation(inp) }); }
for (const ratio of RATIO) for (const aw of [0, 0.99, 1, 2, NaN]) for (const peaceful of [false, true]) for (const ally of [0, 1]) {
  pushHonor({ allyId: ally, mustDeclareWarOn: 2, attackerId: 3, victimId: 4, militaryRatio: ratio, activeWarCount: aw, peacefulArchetype: peaceful });
}
for (let i = 0; i < 6000; i++) {
  const inp = { allyId: pick([0, 0, 1, 2, 5, -0, NaN]), mustDeclareWarOn: ri(0, 5), attackerId: ri(0, 5), victimId: ri(0, 5),
    militaryRatio: chance(0.5) ? pick(RATIO) : ri(0, 120) / 100, activeWarCount: pick([0, 0, 1, 2, 3, NaN, 0.5]), peacefulArchetype: chance(0.5) };
  if (chance(0.4)) inp.minRatioHonor = pick([0.3, 0.55, 0.9, NaN, 0, 1]);
  if (chance(0.4)) inp.minRatioHonorPeaceful = pick([0.5, 0.75, 1, NaN, 0]);
  if (chance(0.4)) inp.maxWarsBeforeRefuse = pick([0, 1, 2, 5, NaN, Infinity]);
  if (chance(0.5)) inp.trustToRequestingAlly = pick([-5, 0, 19, 19.99, 20, 20.01, 21, 50, NaN, Infinity]);
  if (chance(0.4)) inp.minTrustHonor = pick([0, 10, 20, 30, NaN]);
  pushHonor(inp);
}
// trust boundary N-1/N/N+1 dla domyslnego i niestandardowego progu
for (const mt of [undefined, 25]) for (const tr of [-1, 0, 1].map((d) => (mt ?? 20) + d)) {
  const inp = { allyId: 1, mustDeclareWarOn: 2, attackerId: 3, victimId: 4, militaryRatio: 1, activeWarCount: 0, peacefulArchetype: false, trustToRequestingAlly: tr };
  if (mt !== undefined) inp.minTrustHonor = mt;
  pushHonor(inp);
}
// minTrustHonor nieskonczony / NaN (bez losowania: nie zmienia sekwencji PRNG pozostalych wektorow)
for (const mt of [Infinity, NaN]) for (const tr of [undefined, 5, 50, Infinity, NaN]) {
  const inp = { allyId: 1, mustDeclareWarOn: 2, attackerId: 3, victimId: 4, militaryRatio: 1, activeWarCount: 0, peacefulArchetype: false, minTrustHonor: mt };
  if (tr !== undefined) inp.trustToRequestingAlly = tr;
  pushHonor(inp);
}

// ================= TREATIES =================
const KINDS = ['pakt_nieagresji', 'sojusz_defensywny', 'sojusz_pelny', 'sojusz_wojskowy', 'otwarte_granice', 'prawo_wojskowe_przemarszu', 'wspolna_walka_barbarzyncy', 'umowa_handlowa', 'umowa_szlakow', 'umowa_wymiany', 'wasalizacja'];
out.treaties = { obligations: [], refusal: [], defensive: [] };
function genDeals() {
  const n = ri(0, 9);
  const deals = [];
  for (let i = 0; i < n; i++) {
    let a = ri(0, 4), b = ri(0, 4);
    if (chance(0.95) && a === b) b = (a + 1) % 5;
    const lo = Math.min(a, b), hi = Math.max(a, b);
    deals.push({ id: chance(0.1) && deals.length ? deals[0].id : `d${i}`, rodzaj: pick(KINDS), strony: [lo, hi], wygasaTura: chance(0.5) ? null : ri(5, 40), zawartaTura: ri(0, 20) });
  }
  return deals;
}
for (let i = 0; i < 700; i++) {
  const deals = genDeals();
  const a = ri(0, 4), b = ri(0, 4);
  const rec = {
    deals, a, b,
    declared: W.allianceObligations(deals, { type: 'declared_war', declarerOwnerId: a, targetOwnerId: b }),
    attacked: W.allianceObligations(deals, { type: 'attacked', victimOwnerId: a, aggressorOwnerId: b }),
    forDeclaration: W.allianceObligationsForWarDeclaration(deals, a, b),
    brokenByWar: W.treatiesBrokenByWar(deals, a, b),
  };
  out.treaties.obligations.push(rec);
  const joined = []; for (let k = ri(0, 3); k > 0; k--) joined.push(ri(0, 4));
  out.treaties.refusal.push({ obligations: rec.forDeclaration, joined, out: W.treatiesBrokenByRefusal(rec.forDeclaration, joined) });
}
for (let i = 0; i < 80; i++) {
  const obs = [];
  for (let k = ri(0, 4); k > 0; k--) obs.push({ mustDeclareWarOn: ri(0, 4), obligatedAllies: Array.from({ length: ri(0, 3) }, () => ri(0, 4)), treatyIdsToBreakOnRefusal: Array.from({ length: ri(0, 3) }, () => `x${ri(0, 4)}`) });
  const joined = []; for (let k = ri(0, 3); k > 0; k--) joined.push(ri(0, 4));
  out.treaties.refusal.push({ obligations: obs, joined, out: W.treatiesBrokenByRefusal(obs, joined) });
}
for (let m = 0; m < 5; m++) for (let at = 0; at < 5; at++) out.treaties.defensive.push({ must: m, attacker: at, out: W.isDefensiveAllianceWarObligation(m, at) });

// ================= AGGRESSOR =================
out.agg = { cause: [], daje: [], ustawFlage: [], czyAgresor: [], mnoznik: [], delta: [], key: [], ustawCasus: [], maCasus: [], serializuj: [], wczytaj: [], seq: [] };
for (const c of ['bez_powodu', 'casus_belli', 'wymuszona_epoka', 'hamulec', 'wymuszona_inna']) out.agg.daje.push({ cause: c, out: W.czyDajeFlageAgresora(c) });
for (let mask = 0; mask < 32; mask++) {
  const inp = {}; const names = ['hamulec', 'wymuszonaEpoka', 'wymuszonaInna', 'casusBelliAktywny', 'zlamanieRozejmu'];
  names.forEach((n, k) => { if (mask & (1 << k)) inp[n] = true; else if (chance(0.5)) inp[n] = false; });
  out.agg.cause.push({ in: inp, out: W.przyczynaWypowiedzenia(inp) });
}
out.agg.cause.push({ in: {}, out: W.przyczynaWypowiedzenia({}) });
const CAUSES = ['bez_powodu', 'casus_belli', 'wymuszona_epoka', 'hamulec', 'wymuszona_inna'];
const PARAMS = [null, { flagaAgresora: { trwaTur: 3 }, wplywNaAI: { relacjaDeltaSojusz: 7, willingnessAllyMnoznik: 0.25 }, casusBelli: { trwaTur: 6 } },
  { flagaAgresora: { trwaTur: 0 }, wplywNaAI: { relacjaDeltaSojusz: -2, willingnessAllyMnoznik: 1 }, casusBelli: { trwaTur: 0 } },
  { flagaAgresora: { trwaTur: NaN }, wplywNaAI: { relacjaDeltaSojusz: NaN, willingnessAllyMnoznik: NaN }, casusBelli: { trwaTur: NaN } }];
const OWNERS = [0, 1, 2, 3, -1, -0, 1.5, NaN, Infinity, -Infinity, 100, 1e21];
function genMap(keyFn, n) { const m = {}; for (let i = 0; i < n; i++) m[keyFn()] = pick([5, 10, 20, 21, 22, 25, 30, NaN, Infinity, -Infinity, 0, -3]); return m; }
const ownerKey = () => String(pick([0, 1, 2, 3, -1, 1.5, 100]));
const pairKeyFn = () => `${pick([0, 1, 2, 3])}>${pick([0, 1, 2, 3])}`;
for (let i = 0; i < 1500; i++) {
  const st = genMap(ownerKey, ri(0, 3));
  const o = pick(OWNERS), t = pick(TURNS), c = pick(CAUSES), p = pick(PARAMS);
  const r = p ? W.ustawFlageAgresora(st, o, t, c, p) : W.ustawFlageAgresora(st, o, t, c);
  out.agg.ustawFlage.push({ state: E(st), owner: E(o), turn: E(t), cause: c, params: E(p), out: E(r) });
}
for (let i = 0; i < 1200; i++) {
  const o = pick(OWNERS);
  const st = chance(0.2) ? {} : { [String(o)]: pick([5, 10, 20, NaN, Infinity, -Infinity, 0]), [ownerKey()]: 7 };
  const t = pick(TURNS);
  out.agg.czyAgresor.push({ state: E(st), owner: E(o), turn: E(t), out: W.czyAgresor(st, o, t) });
}
for (const p of PARAMS) for (const f of [true, false]) {
  out.agg.mnoznik.push({ flag: f, params: E(p), out: E(p ? W.mnoznikWillingnessAlly(f, p) : W.mnoznikWillingnessAlly(f)) });
  out.agg.delta.push({ flag: f, params: E(p), out: E(p ? W.deltaRelacjiSojusz(f, p) : W.deltaRelacjiSojusz(f)) });
}
for (const a of OWNERS) for (const b of OWNERS) out.agg.key.push({ a: E(a), b: E(b), out: W.casusBelliKey(a, b) });
for (let i = 0; i < 1500; i++) {
  const st = genMap(pairKeyFn, ri(0, 3));
  const r1 = pick([0, 1, 2, 3, NaN, Infinity, -1]), r2 = chance(0.15) ? r1 : pick([0, 1, 2, 3, NaN, Infinity, -1]);
  const t = pick(TURNS), p = pick(PARAMS);
  const r = p ? W.ustawCasusBelli(st, r1, r2, t, p) : W.ustawCasusBelli(st, r1, r2, t);
  out.agg.ustawCasus.push({ state: E(st), req: E(r1), tgt: E(r2), turn: E(t), params: E(p), out: E(r) });
}
for (let i = 0; i < 1200; i++) {
  const r1 = pick([0, 1, 2, 3, NaN]), r2 = pick([0, 1, 2, 3, NaN, Infinity]);
  const st = chance(0.15) ? {} : { [`${r1}>${r2}`]: pick([5, 10, 15, NaN, Infinity, -Infinity, 0]), [pairKeyFn()]: 9 };
  const t = pick(TURNS);
  out.agg.maCasus.push({ state: E(st), req: E(r1), tgt: E(r2), turn: E(t), out: W.maCasusBelli(st, r1, r2, t) });
}
for (let i = 0; i < 200; i++) {
  const st = genMap(ownerKey, ri(0, 4));
  out.agg.serializuj.push({ state: E(st), out: E(W.serializujMape(st)) });
}
const RAWS = [null, 0, 5, '', 'x', true, false, [], [1, 2], {}, { '1': 5, '2': 10 }, { '1': '5', '2': null, '3': true, '4': [1], '5': { a: 1 }, '6': 7 }, { a: -3, b: 1.5, c: 1e300, d: 0, e: -0 },
  { '0': 20, '1': 'x' }, [{ '1': 5 }], { '1': 5, '1x': 6 }];
for (const raw of RAWS) out.agg.wczytaj.push({ raw, out: E(W.wczytajMape(raw)) });
// sekwencje singletonu + zapis/odczyt (main.ts:33615, :42525)
const OPS = ['wyp', 'cb', 'wyp', 'cb', 'reset', 'save'];
for (let s = 0; s < 150; s++) {
  W.resetStanAgresora();
  const ops = []; const snaps = [];
  for (let k = ri(2, 10); k > 0; k--) {
    const kind = pick(OPS);
    let op;
    if (kind === 'wyp') { op = { op: 'wyp', attacker: pick([0, 1, 2, 3, NaN]), turn: pick([0, 3, 5, 10, 25, NaN, 40]), cause: pick(CAUSES) }; W.zarejestrujWypowiedzenie(op.attacker, op.turn, op.cause); }
    else if (kind === 'cb') { op = { op: 'cb', req: pick([0, 1, 2, 3]), tgt: pick([0, 1, 2, 3]), turn: pick([0, 3, 5, 10, 25, 40]) }; W.zarejestrujCasusBelli(op.req, op.tgt, op.turn); }
    else if (kind === 'reset') { op = { op: 'reset' }; W.resetStanAgresora(); }
    else {
      // zapis -> JSON -> odczyt (jak persist + load)
      const saved = J({ aggressorFlagUntilByOwner: W.pobierzStanAgresorow(), casusBelliUntilByPair: W.pobierzStanCasusBelli() });
      op = { op: 'save', saved };
      W.ustawStanAgresorow(W.wczytajMape(saved.aggressorFlagUntilByOwner)); W.ustawStanCasusBelli(W.wczytajMape(saved.casusBelliUntilByPair));
    }
    ops.push(E(op));
    const q = [];
    for (const o of [0, 1, 2, 3]) for (const t of [0, 4, 5, 9, 10, 24, 25, 30, 44]) q.push([o, t, W.czyAgresorAktywny(o, t), E(W.doTuryFlagiAgresora(o, t))]);
    for (const a of [0, 1, 2]) for (const b of [0, 1, 3]) for (const t of [0, 5, 14, 15, 20, 40]) q.push([a, b, t, W.maCasusBelliAktywne(a, b, t)]);
    snaps.push({ q, agg: E(W.pobierzStanAgresorow()), cb: E(W.pobierzStanCasusBelli()) });
  }
  out.agg.seq.push({ ops, snaps });
}
W.resetStanAgresora();

const meta = { pin: out.pin, params: out.params };
writeFileSync(join(outFile, 'truce.json'), JSON.stringify({ ...meta, truce: out.truce }));
writeFileSync(join(outFile, 'gates.json'), JSON.stringify({ ...meta, gates: out.gates }));
writeFileSync(join(outFile, 'honor_treaties.json'), JSON.stringify({ ...meta, honor: out.honor, treaties: out.treaties }));
writeFileSync(join(outFile, 'aggressor.json'), JSON.stringify({ ...meta, agg: out.agg }));
const counts = {};
for (const g of Object.keys(out)) {
  if (Array.isArray(out[g])) counts[g] = out[g].length;
  else if (out[g] && typeof out[g] === 'object' && g !== 'params') for (const k of Object.keys(out[g])) counts[g + '.' + k] = out[g][k].length;
}
console.log(JSON.stringify(counts));
