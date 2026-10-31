'use strict';
/**
 * audit-autoimprove-blockers.cjs — R-WEB-AUTOIMPROVE-BLOCKERS-AUDIT-Q1 (audyt TYLKO DO ODCZYTU).
 * Headless symulacja petli auto-ulepszen GRACZA: picker (game/auto-improvements.ts) + wykonanie
 * odwzorowane 1:1 z main.ts ~35713-35855 (tech/civ/pool/territory/prevLayers/wycinka) + tick wycinki
 * (main.ts ~34390 + finalizeHexClearing ~15173). Zero zmian w gra/src.
 *
 * Uzycie:  AUDIT_NM=<katalog z node_modules (esbuild+three)> node tools/audit-autoimprove-blockers.cjs [--json]
 * (esbuild/three NIE sa instalowane w gra/ — scratch poza repo.)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const NM = process.env.AUDIT_NM;
if (!NM) { console.error('AUDIT_NM nie ustawione'); process.exit(2); }
const esbuild = require(path.join(NM, 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const TMP = fs.mkdtempSync(path.join(process.env.AUDIT_TMP || os.tmpdir(), 'audit-ai-'));
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');
fs.writeFileSync(ENTRY, `
export { pickAutoImprovements, hasNonFoodResourceDeficit, AUTO_ULEPSZENIA_PRACA_RESERVE } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { isImprovementTechUnlocked, getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export { isImprovementAllowedForCiv } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { detectOwnerResourceNeeds } from ${JSON.stringify(SRC + '/game/ai-resource-needs')};
export { diplomacyHandelSurowceCatalog, diplomacyHandelSurowcePakietWielkosc } from ${JSON.stringify(SRC + '/game/diplomacy-value-catalog')};
`);
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'error',
  nodePaths: [path.join(NM, 'node_modules')],
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.json': 'json' },
});
const L = require(BUNDLE);

// ---- mapa syntetyczna -------------------------------------------------------
function makeMap(w, h, terrain = 'rownina') {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: terrain, nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}
function addRiver(map, cells) {
  map.riverPaths.push(cells.map(([q, r]) => ({ q, r })));
  for (const [q, r] of cells) map.hexes[`${q},${r}`].rzeka = { obecna: true, krawedzie: [0, 3] };
}
const ALL_TECHS = ['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Łowiectwo', 'Obróbka drewna'];

/**
 * Symulacja N tur. cfg: { map, pop, techs:Set, civ, era, wolnoWycinacLas, onlyWorked, demandDriven,
 * stages (true=jak main.ts zrownowazone bez deficytu | false=bez etapow), focus, pracaPool0, pracaGain, N, deficit }
 */
function simulate(cfg) {
  const map = cfg.map;
  const city = { id: 'c1', ownerId: 0, q: 15, r: 15, name: 'T', population: cfg.pop };
  const territoryNodes = [{ q: 15, r: 15, pop: cfg.pop, level: 1, ownerId: 0 }];
  const placed = new Map();
  const clearing = new Map(); // hexKey -> turnsLeft
  const techs = new Set(cfg.techs);
  let pool = cfg.pracaPool0 ?? 5000;
  const N = cfg.N ?? 40;
  const built = {}; // key -> count
  const firstTurn = {};
  const rejected = {}; // powod odrzucenia przez executor
  const emptyTurns = [];
  const log = [];
  const rej = (why) => { rejected[why] = (rejected[why] || 0) + 1; };
  for (let t = 1; t <= N; t++) {
    pool += cfg.pracaGain ?? 60;
    // tick wycinki (przed pickerem, jak main.ts:34390 < 35727)
    for (const [hk, left] of [...clearing]) {
      if (left - 1 <= 0) {
        clearing.delete(hk);
        const hex = map.hexes[hk];
        if (hex.nakladka === 'las') hex.nakladka = 'brak';
        const lay = (placed.get(hk) ?? []).filter(k => k !== 'tartak' && k !== 'oboz_lowiecki');
        if (lay.length) { placed.set(hk, lay); hex.ulepszenia = lay; } else { placed.delete(hk); delete hex.ulepszenia; }
      } else clearing.set(hk, left - 1);
    }
    const resource = cfg.deficit ? ['drewno'] : [];
    const picks = L.pickAutoImprovements({
      cities: [Object.assign({}, city, {
        ulepszeniaFocus: cfg.focus ?? 'zrownowazone', ulepszeniaOnlyWorked: cfg.onlyWorked ?? true,
      })],
      ownerId: 0, map, territoryNodes, placedImprovements: new Map(placed),
      pracaAvailable: pool, unlockedTechs: techs,
      pracaSurplusThreshold: L.AUTO_ULEPSZENIA_PRACA_RESERVE,
      skipWyrab: true, getSkipWyrab: () => !(cfg.wolnoWycinacLas ?? true),
      demandDriven: cfg.demandDriven ?? true, resourceDeficitKeys: resource,
      surplusReport: { demandActive: false, deficitActive: false, anyCandidate: false, surplus: false },
      civArchetype: cfg.civ ?? 'grecy', playerEra: cfg.passEra ? cfg.era : undefined,
      isImprovementAllowedForCiv: (k, c) => L.isImprovementAllowedForCiv(k, c),
      getFocus: () => cfg.focus ?? 'zrownowazone',
      getOnlyWorked: () => cfg.onlyWorked ?? true,
      pracaBudgetPercent: cfg.pct ?? 100, getPracaBudgetPercent: () => cfg.pct ?? 100,
      getWorkedHexKeys: c => new Set(L.workedHexCoordsForCity(c, map, territoryNodes).map(({ q, r }) => `${q},${r}`)),
      foodImprovementStages: () => (cfg.stages ?? true) && (cfg.focus === 'zywnosc'
        || ((cfg.focus ?? 'zrownowazone') === 'zrownowazone' && !L.hasNonFoodResourceDeficit(resource))),
    });
    let did = 0;
    for (const pick of picks) {
      // --- executor: main.ts 35776-35855 ---
      if (!L.isImprovementTechUnlocked(pick.key, techs)) { rej('tech'); continue; }
      if (!L.isImprovementAllowedForCiv(pick.key, cfg.civ ?? 'grecy')) { rej('civ'); continue; }
      if (pool < pick.kosztPraca) { rej('pool'); continue; }
      if (pool - pick.kosztPraca < L.AUTO_ULEPSZENIA_PRACA_RESERVE) { rej('reserve'); continue; }
      const hk = `${pick.q},${pick.r}`;
      const hex = map.hexes[hk];
      if (!hex) { rej('nohex'); continue; }
      const prev = placed.get(hk) ?? [];
      if (prev.includes(pick.key)) { rej('prevLayers'); continue; }
      if (L.getImprovementMeta(pick.key)?.typ === 'wycinka') {
        if (hex.nakladka !== 'las') { rej('wycinka-nie-las'); continue; }
        if (clearing.has(hk)) { rej('wycinka-w-toku'); continue; }
        pool -= pick.kosztPraca; clearing.set(hk, 1);
        built.wyrab = (built.wyrab || 0) + 1; firstTurn.wyrab = firstTurn.wyrab ?? t; did++;
        log.push(`t${t} wyrab ${hk}`);
        continue;
      }
      if ((pick.key === 'tartak' || pick.key === 'oboz_lowiecki') && hex.nakladka !== 'las') { rej('las-zniknal'); continue; }
      pool -= pick.kosztPraca;
      const next = [...prev, pick.key];
      placed.set(hk, next); hex.ulepszenia = next;
      built[pick.key] = (built[pick.key] || 0) + 1; firstTurn[pick.key] = firstTurn[pick.key] ?? t; did++;
      log.push(`t${t} ${pick.key} ${hk}`);
    }
    if (picks.length === 0) emptyTurns.push(t);
  }
  const worked = L.workedHexCoordsForCity(city, map, territoryNodes).map(({ q, r }) => `${q},${r}`);
  return { built, firstTurn, rejected, emptyTurns: emptyTurns.length, log, placed: Object.fromEntries(placed), worked };
}

function ok(n) { return n > 0 ? 'TAK' : 'NIE'; }

// ---- scenariusze ------------------------------------------------------------
const results = [];
function run(id, desc, cfg, extra) {
  let r;
  try { r = simulate(cfg); } catch (e) { r = { error: String(e && e.stack || e) }; }
  results.push({ id, desc, r, extra });
  return r;
}

// S-A: rownina, farma+trzoda+irygacja przy rzece, pop 5. Wszystkie techy.
function mapRiverPlain() {
  const m = makeMap(31, 31, 'rownina');
  addRiver(m, [[13, 13], [14, 14], [15, 14], [16, 14], [17, 13], [18, 13]]); // rzeka przy miescie (15,15)
  return m;
}
// S-C: rzeka+las przy miescie (heksy rzeki = las), reszta rownina.
function mapRiverForest() {
  const m = mapRiverPlain();
  for (const k of ['14,14', '15,14', '16,14']) m.hexes[k].nakladka = 'las'; // las NA rzece
  return m;
}
function mapOffRiverForest() {
  const m = makeMap(31, 31, 'rownina');
  for (const [q, r] of [[14, 16], [16, 15], [15, 17], [17, 16]]) m.hexes[`${q},${r}`].nakladka = 'las'; // las bez rzeki
  return m;
}

const base = { pop: 5, techs: new Set(ALL_TECHS), civ: 'grecy', N: 40, pct: 100 };
run('A1', 'rownina+rzeka, pop5, wszystkie techy, tryb zrownowazone, etapy ON (jak main.ts)', { ...base, map: mapRiverPlain() });
run('A2', 'jw., etapy OFF (foodImprovementStages=false)', { ...base, map: mapRiverPlain(), stages: false });
run('A3', 'jw., profil zywnosc, etapy ON', { ...base, map: mapRiverPlain(), focus: 'zywnosc' });
run('A4', 'jw., demandDriven=false, etapy OFF', { ...base, map: mapRiverPlain(), stages: false, demandDriven: false });
run('A5', 'jw. etapy ON, onlyWorked=false (bez "tylko z obywatelami")', { ...base, map: mapRiverPlain(), onlyWorked: false });
run('A6', 'jw. etapy ON, BRAK techu Oswojenie zwierzat (reszta jest)', { ...base, map: mapRiverPlain(), techs: new Set(['Rolnictwo', 'Gospodarka wodna', 'Łowiectwo']) });
run('A7', 'jw. etapy ON, BRAK techu Gospodarka wodna', { ...base, map: mapRiverPlain(), techs: new Set(['Rolnictwo', 'Oswojenie zwierząt', 'Łowiectwo']) });
run('A8', 'jw. etapy ON, civ=inkowie (era 1, playerEra NIE przekazane jak w main.ts)', { ...base, map: mapRiverPlain(), civ: 'inkowie' });
run('A9', 'jw. etapy ON, civ=inkowie, era 3 PRZEKAZANA do pickera (hipoteza naprawy)', { ...base, map: mapRiverPlain(), civ: 'inkowie', passEra: true, era: 3 });
run('A10', 'jw. etapy ON, pop 12 (wiecej heksow obrabianych)', { ...base, map: mapRiverPlain(), pop: 12 });
run('A11', 'jw. etapy ON, pct=33 (domyslne 33%)', { ...base, map: mapRiverPlain(), pct: 33 });

run('C1', 'rzeka+las NA rzece, wolno wycinac las ON, tylko z obywatelami, etapy ON', { ...base, map: mapRiverForest() });
run('C2', 'jw., wolno wycinac las OFF (etap 0 powinien dzialac mimo to)', { ...base, map: mapRiverForest(), wolnoWycinacLas: false });
run('C3', 'jw., etapy OFF', { ...base, map: mapRiverForest(), stages: false });
run('C4', 'jw., etapy OFF + wolno wycinac OFF', { ...base, map: mapRiverForest(), stages: false, wolnoWycinacLas: false });
run('C5', 'las BEZ rzeki, wolno wycinac ON, etapy ON, pop 5', { ...base, map: mapOffRiverForest() });
run('C6', 'las BEZ rzeki, wolno wycinac ON, etapy OFF', { ...base, map: mapOffRiverForest(), stages: false });
run('C7', 'las BEZ rzeki, etapy ON, techy BEZ Obrobki drewna', { ...base, map: mapOffRiverForest(), techs: new Set(['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna']) });


// S-D: niedobor surowca (realna gra: detectPricedResourceDeficits liczy KAZDY z 15 wycenionych surowcow < 10 szt.)
run('D1', 'rownina+rzeka, NIEDOBOR surowca (etapy OFF, foodOnly OFF — jak main.ts przy deficit)', { ...base, map: mapRiverPlain(), deficit: true });
run('D2', 'rzeka+las NA rzece, NIEDOBOR, wolno wycinac ON', { ...base, map: mapRiverForest(), deficit: true });
run('D3', 'rzeka+las NA rzece, NIEDOBOR, wolno wycinac OFF', { ...base, map: mapRiverForest(), deficit: true, wolnoWycinacLas: false });
run('D4', 'rzeka+las NA rzece, NIEDOBOR, techy BEZ Obrobki drewna/Lowiectwa (tartak/oboz niedostepne)', { ...base, map: mapRiverForest(), deficit: true, techs: new Set(['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna']) });
run('D5', 'las BEZ rzeki, NIEDOBOR, wolno wycinac ON', { ...base, map: mapOffRiverForest(), deficit: true });

// S-E: mapa mieszana (seed), rzeka + las losowo; pop 6; N=40
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function mapMixed(seed) {
  const R = rng(seed);
  const m = makeMap(31, 31, 'rownina');
  for (const h of Object.values(m.hexes)) {
    const x = R();
    if (x < 0.12) h.terenBazowy = 'wzgorza';
    else if (x < 0.55) h.terenBazowy = 'laka';
    if (h.terenBazowy !== 'wzgorza' && R() < 0.30) h.nakladka = 'las';
  }
  addRiver(m, [[11, 12], [12, 13], [13, 14], [14, 14], [15, 14], [16, 15], [17, 15], [18, 16], [19, 16]]);
  return m;
}
for (const seed of [1, 2, 3]) {
  const m = () => mapMixed(seed);
  run('E' + seed + 'a', `mapa mieszana seed${seed}, pop6, wolno ON, bez niedoboru (etapy ON)`, { ...base, pop: 6, map: m(), N: 40 });
  run('E' + seed + 'b', `mapa mieszana seed${seed}, pop6, wolno ON, z niedoborem (etapy OFF)`, { ...base, pop: 6, map: m(), N: 40, deficit: true });
}


// S-F: las BEZ rzeki, heksy lasu OBSADZONE (las wokol miasta; pop 6 => las jest wsrod obrabianych)
function mapForestRing() {
  const m = makeMap(31, 31, 'rownina');
  for (const h of Object.values(m.hexes)) {
    const dq = h.coords.q - 15, dr = h.coords.r - 15;
    const d = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
    if (d >= 1 && d <= 40) h.nakladka = "las";
  }
  m.hexes['16,15'].nakladka = 'brak'; m.hexes['14,15'].nakladka = 'brak'; // 2 otwarte heksy
  return m;
}
run('F1', 'las wokol miasta BEZ rzeki, heksy lasu obrabiane, wolno ON, bez niedoboru (etapy ON)', { ...base, pop: 8, map: mapForestRing() });
run('F2', 'jw., z niedoborem surowca (etapy OFF)', { ...base, pop: 8, map: mapForestRing(), deficit: true });
run('F3', 'jw. bez niedoboru, wolno OFF', { ...base, pop: 8, map: mapForestRing(), wolnoWycinacLas: false });
run('F4', 'jw. etapy ON, techy BEZ Obrobki drewna i Lowiectwa (tartak/oboz niedostepne)', { ...base, pop: 8, map: mapForestRing(), techs: new Set(['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna']) });



// S-G: niski przychod Pracy (starvation drogiej irygacji=60 przez tanie farma/trzoda=20; `continue` zamiast `break`)
run('G1', 'rownina+rzeka pop8, etapy ON, pula0=40, +25 Pracy/ture', { ...base, pop: 8, map: mapRiverPlain(), pracaPool0: 40, pracaGain: 25, N: 40 });
run('G2', 'jw., z niedoborem (etapy OFF, hex-po-hexie, pelna lista typow)', { ...base, pop: 8, map: mapRiverPlain(), pracaPool0: 40, pracaGain: 25, N: 40, deficit: true });
run('G3', 'jw. G2 ale +10 Pracy/ture (upkeep zjada przychod)', { ...base, pop: 8, map: mapRiverPlain(), pracaPool0: 40, pracaGain: 10, N: 40, deficit: true });


// S-H: N6 (trzoda/irygacja poza limitem % budzetu) — czy cap % ogranicza takze trzode/irygacje
run('H1', 'rownina+rzeka pop8, etapy ON, pct=20, pula0=1000, +0 Pracy/ture, N=10', { ...base, pop: 8, map: mapRiverPlain(), pct: 20, pracaPool0: 1000, pracaGain: 0, N: 10 });
run('H2', 'jw., pct=100 (kontrola)', { ...base, pop: 8, map: mapRiverPlain(), pct: 100, pracaPool0: 1000, pracaGain: 0, N: 10 });

// ---- M: jak czesto "niedobor surowca" (wylacza etapy zywnosciowe + foodOnly) ------------------
{
  const priced = Object.keys(L.diplomacyHandelSurowceCatalog());
  const pak = L.diplomacyHandelSurowcePakietWielkosc();
  const mk = stock => priced.filter(k => stock[k] !== undefined).map(k => ({ key: k, ilosc: stock[k], label: k }));
  const early = { drewno: 200, kamien: 100, glina: 50 };
  const mid = { drewno: 500, kamien: 400, glina: 300, cegla: 100, ruda: 60, sol: 30, kon: 20, ceramika: 20 };
  const rich = Object.fromEntries(priced.map(k => [k, 50]));
  const one = (nm, st) => {
    const n = L.detectOwnerResourceNeeds({ goods: mk(st), pricedKeys: priced, pakietWielkosc: pak, foodReserve: 100 });
    const nf = n.deficitKeys.filter(k => k !== 'zywnosc');
    results.push({ id: 'M-' + nm, desc: `deficitKeys przy magazynie "${nm}" (wycenionych kluczy=${priced.length}, prog=${pak})`, r: { mdef: n.deficitKeys, nonFood: nf.length > 0 } });
  };
  one('start', early); one('srodek-gry', mid); one('bogaty-wszystkie>=10', rich);
  for (const k of ['farma', 'bydlo', 'irygacja', 'wyrab', 'tartak', 'oboz_lowiecki']) {
    const m = L.getImprovementMeta(k);
    results.push({ id: 'K-' + k, desc: `koszt Pracy / tech`, r: { koszt: m && m.kosztPraca, tech: m && m.techId } });
  }
}

// ---- raport -----------------------------------------------------------------
const lines = [];
for (const x of results) {
  if (x.r.mdef || x.r.koszt !== undefined) { lines.push(`${x.id} | ${x.desc} | ${JSON.stringify(x.r)}`); continue; }
  if (x.r.error) { lines.push(`${x.id} | ${x.desc} | BLAD: ${x.r.error.split('\n')[0]}`); continue; }
  const b = x.r.built;
  lines.push(`${x.id} | ${x.desc}\n   built=${JSON.stringify(b)} first=${JSON.stringify(x.r.firstTurn)} executor-odrzuca=${JSON.stringify(x.r.rejected)} pustych_tur=${x.r.emptyTurns}/40 worked=${x.r.worked.length}`);
}
const out = lines.join('\n');
console.log(out);
if (process.argv.includes('--json')) fs.writeFileSync(path.join(TMP, 'results.json'), JSON.stringify(results, null, 1));
if (process.env.AUDIT_VERBOSE) for (const x of results) if (!x.r.error && x.r.log) console.log(`\n== ${x.id} log\n` + x.r.log.join('\n'));
console.log('\nTMP=' + TMP);
fs.rmSync(BUNDLE, { force: true });
