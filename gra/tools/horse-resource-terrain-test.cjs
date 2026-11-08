'use strict';
/**
 * horse-resource-terrain-test.cjs — BRAMKA TEMATU R-WEB-HORSE-RESOURCE-TERRAIN-Q1.
 *
 * DECYZJA WŁAŚCICIELA (2026-11-03): złoże konia generowane TYLKO na równinach/łąkach/trawie,
 * NIGDY na lesie (ani pod nakładką Las). Zastępuje ECHO 2026-09-03 w zakresie „koń na lesie nie
 * przeszkadza" (dotyczy GENEROWANIA nowej mapy; wczytywane zapisy nietknięte).
 *
 * PRZYCZYNA (zmierzona): las jest nakładany PRZED złożami (generator.ts: forest -> deposits), a
 * `applyDepositToHex` na heksie z Nakladka.Las zapisywał koń jako `hex.zloze='konie'` (las
 * zostawał). Renderer rysuje wtedy konia (styleResources 'konie'), ale kwalifikator Stadniny
 * sprawdza tylko `nakladka === ZlozeKonia` -> koń widoczny na lesie, a Stadniny nie da się zbudować.
 *
 * SEKCJE:
 *   (A) szybkie testy jednostkowe prawdziwych `placeDeposits` + `relocateForestHorses` na syntetycznej siatce
 *       (0 koni na lesie, liczba koni zachowana, mutacja „zezwól na las" czerwieni sekcję),
 *   (B) prawdziwy generator: >= 8 ziaren x 3 typy x Standardowy — 0 koni na lesie, liczba koni
 *       zachowana (golden), hash mapy BEZ koni identyczny jak PRZED zmianą (golden), + histogram
 *       przyczyn odmowy Stadniny dla koni w terytorium miasta.
 *
 * Generacja Standardowej mapy trwa kilka minut -> sekcja (B) dzieli prace na procesy potomne
 * (równolegle) i przyjmuje filtry:   --types=kontynenty,pangea  --seeds=42,123   (domyślnie: wszystko).
 * Tryb --record wypisuje blok GOLDEN do wklejenia (uruchamiany na kodzie PRZED poprawką).
 * Bundle poza repo (/dev/shm). Uruchom z gra/:  node tools/horse-resource-terrain-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const SEEDS_ALL = [42, 123, 777, 7, 2026, 11, 99, 314];
const TYPES_ALL = ['kontynenty', 'pangea', 'wyspy'];
const ALLOWED_TERRAIN = new Set(['rownina', 'laka']);

// GOLDEN (zmierzone na kodzie PRZED poprawką, base 57a7ada40, rozmiar Standardowy, genOpts {}):
// klucz "typ:seed" -> { horses, forestBefore, noHorse, other }.  noHorse = hash heksów z
// wyzerowanym koniem (nakladka zloze_konia -> brak, zloze 'konie' usunięte); other = hash pól
// mapy poza heksami (rzeki, pozycje startowe...).
const GOLDEN = /*GOLDEN_BEGIN*/{
  "kontynenty:11": {"horses": 35, "forestBefore": 19, "noHorse": "5e178c23fbe74759b5e3cfc6c928e714", "other": "2cc32a0c20973c33e2686769735291b0"},
  "kontynenty:123": {"horses": 32, "forestBefore": 21, "noHorse": "df1f858ff3249f4d36776ee320592938", "other": "0589cafc5bc829cc091a2e453bd0ebf7"},
  "kontynenty:2026": {"horses": 33, "forestBefore": 20, "noHorse": "c19533bcbd0c0df1d84f17e5bca63609", "other": "ba61db2c0da74d9c01216a497b45d9b1"},
  "kontynenty:314": {"horses": 49, "forestBefore": 26, "noHorse": "784b2cee1e89fdd90276958cc3172f6d", "other": "b408b365024c0e470de23df37a9e7251"},
  "kontynenty:42": {"horses": 27, "forestBefore": 16, "noHorse": "577c887353ee7bcaffe006aa524f1837", "other": "b3d3acf84fe50f7fb098e3087a68e18f"},
  "kontynenty:7": {"horses": 33, "forestBefore": 22, "noHorse": "041b1f3444debe7efcd9f6d3cc3bd252", "other": "9b7375e15c14d652edc36db7409f8c23"},
  "kontynenty:777": {"horses": 35, "forestBefore": 21, "noHorse": "969a1383c0f4010ff81610e3338afc7a", "other": "899569a64c2a42705c93383cc9975078"},
  "kontynenty:99": {"horses": 42, "forestBefore": 23, "noHorse": "0d3fadc763ab79a59b4dfbd199a89055", "other": "2bc17a5043d614b1a85785fa7530701b"},
  "pangea:11": {"horses": 61, "forestBefore": 31, "noHorse": "bc951d072d356146a2b3511522ffad2a", "other": "0301460efd9f9154ab6af9a055729a78"},
  "pangea:123": {"horses": 56, "forestBefore": 35, "noHorse": "a4585ff7f5005e8cc81ef1a309ad52a3", "other": "53d061f14e751b0ac55be9145eb652ff"},
  "pangea:2026": {"horses": 60, "forestBefore": 37, "noHorse": "e911b094f492439d4f23a2948190465c", "other": "885aff5b151be378713ce3c682918aae"},
  "pangea:314": {"horses": 56, "forestBefore": 29, "noHorse": "10abaf96e9b69c16dcbf23dd70fa5c1e", "other": "8fc39e1376d54a3700e572dcb883e471"},
  "pangea:42": {"horses": 62, "forestBefore": 44, "noHorse": "1273e0c81058ac5e4123b6ba8d80b882", "other": "8eef192e4e35979f355ea7f277487f48"},
  "pangea:7": {"horses": 54, "forestBefore": 28, "noHorse": "f08a04e2151189ca276227871b36236c", "other": "1cc4bfab381eeb40da29ed5f306b1212"},
  "pangea:777": {"horses": 66, "forestBefore": 41, "noHorse": "7a6c5613e3014bea4ef6e492f8a9a217", "other": "7b4097e7255aba4b95e79706c4844a01"},
  "pangea:99": {"horses": 53, "forestBefore": 32, "noHorse": "e9e9a5e3c0fbb5f3f789f91e474cc36f", "other": "27e457195575c2c248d303c9517195e8"},
  "wyspy:11": {"horses": 66, "forestBefore": 36, "noHorse": "3cde04e80dc33094f2d5a4e448d2cb4e", "other": "959b494e8f542b952fef9359031f9775"},
  "wyspy:123": {"horses": 34, "forestBefore": 22, "noHorse": "ab74f795af701c3a83e274355e688b18", "other": "43ea07b67e10a5da4ae9d907181575d4"},
  "wyspy:42": {"horses": 45, "forestBefore": 23, "noHorse": "7fe2fade1d240a6210ff37afd711e819", "other": "5918ee19a349d5549f113d4b00df270b"},
  "wyspy:777": {"horses": 37, "forestBefore": 26, "noHorse": "f13184c4a44605979b5e35cd72860bb3", "other": "97c7fe7b67d4d5ea1004569b341a47f5"}
}/*GOLDEN_END*/;

function parseArgs() {
  const a = { baselineRef: null, worker: null, record: false, types: TYPES_ALL, seeds: SEEDS_ALL, bundle: null };
  for (const x of process.argv.slice(2)) {
    if (x === '--record') a.record = true;
    else if (x.startsWith('--types=')) a.types = x.slice(8).split(',');
    else if (x.startsWith('--seeds=')) a.seeds = x.slice(8).split(',').map(Number);
    else if (x.startsWith('--worker=')) a.worker = x.slice(9);
    else if (x.startsWith('--bundle=')) a.bundle = x.slice(9);
    else if (x.startsWith('--baseline-ref=')) a.baselineRef = x.slice(15);
  }
  return a;
}
const args = parseArgs();

/** Tryb PRZED: gen-helpers.ts z wskazanego commitu (nagranie GOLDEN i dowód RED). */
function baselineMutator(ref) {
  const rel = 'gra/src/map/gen-helpers.ts';
  const base = execFileSync('git', ['show', `${ref}:${rel}`], { cwd: path.resolve(__dirname, '..', '..'), maxBuffer: 1 << 28 }).toString('utf8');
  return () => base;
}

async function buildBundle(tmp, tag, mutate) {
  const entry = path.join(tmp, `entry-${tag}.ts`);
  const out = path.join(tmp, `bundle-${tag}.cjs`);
  fs.writeFileSync(entry, `
export { generujSwiat } from ${JSON.stringify(SRC + '/map/generator')};
export { placeDeposits, relocateForestHorses, DEPOSIT_RULES } from ${JSON.stringify(SRC + '/map/gen-helpers')};
export { createImprovementBuildApi } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');
  const plugin = {
    name: 'mutate',
    setup(b) {
      if (!mutate) return;
      b.onLoad({ filter: /gen-helpers\.ts$/ }, (a) => {
        const src = fs.readFileSync(a.path, 'utf8');
        const mutated = mutate(src);
        if (mutated === src && !args.baselineRef) throw new Error('mutacja nie zmieniła źródła');
        return { contents: mutated, loader: 'ts', resolveDir: path.dirname(a.path) };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: out, resolveExtensions: ['.ts', '.js', '.json'], logLevel: 'silent', plugins: [plugin],
  });
  return out;
}

// ---------------------------------------------------------------- worker (jedna mapa)
function runWorker(typ, seed, bundlePath) {
  const M = require(bundlePath);
  const T0 = Date.now();
  const origLog = console.log;
  console.log = () => {}; // generator loguje fazy
  const map = M.generujSwiat(seed, 'standardowy', typ, {});
  console.log = origLog;
  const tGen = Date.now() - T0;
  const hexes = map.hexes;
  const keys = Object.keys(hexes).sort();
  const isHorse = (h) => h.nakladka === 'zloze_konia' || h.zloze === 'konie';
  let horses = 0, forest = 0;
  const byTer = {}, byKind = {};
  const horseKeys = [];
  const hNo = crypto.createHash('md5');
  for (const k of keys) {
    const h = hexes[k];
    if (isHorse(h)) {
      horses++; horseKeys.push(k);
      if (h.nakladka === 'las') forest++;
      byTer[h.terenBazowy] = (byTer[h.terenBazowy] || 0) + 1;
      const kind = h.nakladka === 'zloze_konia' ? 'nakladka' : `zloze+${h.nakladka}`;
      byKind[kind] = (byKind[kind] || 0) + 1;
    }
    const c = JSON.parse(JSON.stringify(h));
    if (c.nakladka === 'zloze_konia') c.nakladka = 'brak';
    if (c.zloze === 'konie') delete c.zloze;
    hNo.update(k + JSON.stringify(c));
  }
  const other = {};
  for (const kk of Object.keys(map)) {
    if (kk === 'hexes' || kk === 'mapGenTimings') continue;
    other[kk] = map[kk];
  }
  const otherHash = crypto.createHash('md5').update(JSON.stringify(other)).digest('hex');

  // Histogram przyczyn odmowy Stadniny: miasto na lądowym sąsiedzie złoża (albo na samym złożu).
  const reasons = {};
  const bump = (k) => { reasons[k] = (reasons[k] || 0) + 1; };
  for (const hk of horseKeys) {
    const hex = hexes[hk];
    const [q, r] = hk.split(',').map(Number);
    let cq = q, cr = r;
    for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
      const nb = hexes[`${q + dq},${r + dr}`];
      if (nb && nb.terenBazowy !== 'morze' && nb.terenBazowy !== 'plytkie_morze') { cq = q + dq; cr = r + dr; break; }
    }
    const node = { q: cq, r: cr, pop: 1, level: 1, ownerId: 0 };
    const state = {
      map, cityNodes: [{ q: cq, r: cr, pop: 1, level: 1 }], territoryNodes: [node],
      playerOwnerIdNum: 0, playerCivArchetype: 'rzymianie', playerEra: 1,
      researchedTechs: new Set(['Jeździectwo']), horseStockAvailable: 0, tradeRouteKonUnlocked: false,
    };
    let ok = false;
    try { ok = M.createImprovementBuildApi(state).getQualifyingHexes('stadnina').some((x) => x.q === q && x.r === r); } catch (e) { bump('WYJATEK:' + e.message); continue; }
    if (ok) { bump('OK_mozna_budowac'); continue; }
    if (hex.nakladka === 'las' && hex.zloze === 'konie') bump('ODMOWA_kon_pod_lasem(zloze=konie,nakladka=las)');
    else if (!ALLOWED_TERRAIN.has(hex.terenBazowy)) bump('ODMOWA_zly_teren:' + hex.terenBazowy);
    else bump('ODMOWA_inna');
  }
  process.stdout.write('RESULT ' + JSON.stringify({
    typ, seed, msGen: tGen, msTotal: Date.now() - T0, horses, forest, byTer, byKind, noHorse: hNo.digest('hex'), other: otherHash, reasons,
  }) + '\n');
}

if (args.worker) {
  runWorker(args.worker.split(':')[0], Number(args.worker.split(':')[1]), args.bundle);
  process.exit(0);
}

// ---------------------------------------------------------------- parent
let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log(`  [OK] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''}`); }
};

function syntheticGrid(M, forestFrac, size) {
  const T = M.TerenBazowy, N = M.Nakladka;
  const hexes = {};
  let i = 0;
  for (let q = 0; q < size; q++) {
    for (let r = 0; r < size; r++) {
      i++;
      const forest = ((i * 2654435761) >>> 0) % 100 < forestFrac * 100;
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: T.Rownina, nakladka: forest ? N.Las : N.Brak,
        rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak',
        wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null,
      };
    }
  }
  return hexes;
}

function unitSection(M, label) {
  console.log(`\n--- (A) placeDeposits na syntetycznej siatce [${label}] ---`);
  const rules = M.DEPOSIT_RULES.filter((r) => r.id === 'konie').map((r) => ({ ...r, rarity: 0.3 }));
  let forestHorses = 0, lost = 0, baseTotal = 0, gotTotal = 0;
  for (const seed of [1, 2, 3, 42, 777]) {
    const hexes = syntheticGrid(M, 0.5, 30);
    const noForest = syntheticGrid(M, 0.5, 30);
    for (const h of Object.values(noForest)) h.nakladka = 'brak';
    const expected = M.placeDeposits(noForest, seed, rules, 1, 1).konie;
    M.placeDeposits(hexes, seed, rules, 1, 1);
    const moved = M.relocateForestHorses(hexes); // jak generator.ts: raz, na finalnym stanie
    const got = Object.values(hexes).filter((h) => h.nakladka === 'zloze_konia' || h.zloze === 'konie').length;
    baseTotal += expected; gotTotal += got;
    if (moved === 0) lost += 1000; // kontrola: przy 50% lasu przesunięcia MUSZĄ wystąpić
    for (const h of Object.values(hexes)) {
      const horse = h.nakladka === 'zloze_konia' || h.zloze === 'konie';
      if (horse && h.nakladka === 'las') forestHorses++;
      if (horse && h.terenBazowy !== 'rownina') lost++;
    }
    const placed = Object.values(hexes).filter((h) => h.nakladka === 'zloze_konia' || h.zloze === 'konie').length;
    if (placed !== expected) lost += Math.abs(placed - expected);
  }
  ok(forestHorses === 0, 'A1: 0 koni na lesie (siatka 50% lasu)', forestHorses);
  ok(lost === 0, 'A2: liczba koni zachowana (=== liczba bez lasu) i wszystkie na Równinie', { lost, baseTotal, gotTotal });
  ok(baseTotal > 100, 'A3: kontrola — test faktycznie generuje konie', baseTotal);
  return forestHorses === 0 && lost === 0;
}

async function runWorkers(bundlePath, jobs) {
  const results = [];
  let next = 0;
  const par = Math.min(Number(process.env.HORSE_PAR) || 3, jobs.length);
  await Promise.all(Array.from({ length: par }, async () => {
    while (next < jobs.length) {
      const [typ, seed] = jobs[next++];
      const res = await new Promise((resolve) => {
        const p = spawn(process.execPath, [__filename, `--worker=${typ}:${seed}`, `--bundle=${bundlePath}`], { stdio: ['ignore', 'pipe', 'inherit'] });
        let out = '';
        p.stdout.on('data', (d) => { out += d; });
        p.on('close', (code) => {
          const line = out.split('\n').find((l) => l.startsWith('RESULT '));
          resolve(line ? JSON.parse(line.slice(7)) : { typ, seed, error: 'worker exit ' + code });
        });
      });
      results.push(res);
      if (!res.error) console.log(`GOLDEN_ROW ${JSON.stringify({ [`${res.typ}:${res.seed}`]: { horses: res.horses, forestBefore: res.forest, noHorse: res.noHorse, other: res.other } })}`);
      console.log(`  [mapa] ${typ}:${seed} horses=${res.horses} forest=${res.forest} msGen=${res.msGen} msTotal=${res.msTotal}`);
    }
  }));
  return results;
}

async function main() {
  const tmp = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'horse-terrain-'));
  try {
    const good = await buildBundle(tmp, 'good', args.baselineRef ? baselineMutator(args.baselineRef) : null);
    const GM = require(good);
    const unitGood = unitSection(GM, 'kod bieżący');
    if (!args.record && !args.baselineRef) {
      // Mutacja: zezwól na konia na lesie (relocateForestHorses nic nie przesuwa) -> sekcja (A) MUSI zczerwienieć.
      const mut = await buildBundle(tmp, 'mut', (src) =>
        src.replace("if (h.nakladka === Nakladka.Las && h.zloze === 'konie') { displaced.push(k); continue; }", 'if (false) { displaced.push(k); continue; }'));
      const MM = require(mut);
      const before = { pass, fail };
      const unitMut = (() => { const o = console.log; console.log = () => {}; const r = unitSection(MM, 'mutacja'); console.log = o; return r; })();
      pass = before.pass; fail = before.fail;
      ok(unitMut === false, 'A4: mutacja „zezwól na las" łamie sekcję (A) (test nie jest tautologią)');
    }

    console.log('\n--- (B) prawdziwy generator, Standardowy ---');
    const jobs = [];
    for (const t of args.types) for (const s of args.seeds) jobs.push([t, s]);
    const results = (await runWorkers(good, jobs)).sort((a, b) => (a.typ + a.seed).localeCompare(b.typ + b.seed));
    const agg = {};
    const golden = {};
    for (const r of results) {
      if (r.error) { ok(false, `${r.typ}:${r.seed} generacja`, r.error); continue; }
      golden[`${r.typ}:${r.seed}`] = { horses: r.horses, forestBefore: r.forest, noHorse: r.noHorse, other: r.other };
      for (const [k, v] of Object.entries(r.reasons)) agg[k] = (agg[k] || 0) + v;
      const badTer = Object.keys(r.byTer).filter((t) => !ALLOWED_TERRAIN.has(t));
      console.log(`  ${r.typ}:${r.seed} konie=${r.horses} naLesie=${r.forest} tereny=${JSON.stringify(r.byTer)} rodzaj=${JSON.stringify(r.byKind)}`);
      ok(r.forest === 0 && !r.byKind['zloze+las'], `B1 ${r.typ}:${r.seed}: 0 koni na lesie`, r.forest);
      ok(badTer.length === 0, `B2 ${r.typ}:${r.seed}: konie tylko na równinie/łące`, r.byTer);
      if (!args.record) {
        const g = GOLDEN[`${r.typ}:${r.seed}`];
        if (!g) { ok(false, `B3 ${r.typ}:${r.seed}: brak GOLDEN`); continue; }
        ok(r.horses === g.horses, `B3 ${r.typ}:${r.seed}: liczba koni zachowana (±0)`, { po: r.horses, przed: g.horses });
        ok(r.noHorse === g.noHorse, `B4 ${r.typ}:${r.seed}: hash mapy BEZ koni identyczny jak PRZED`, { po: r.noHorse, przed: g.noHorse });
        ok(r.other === g.other, `B5 ${r.typ}:${r.seed}: rzeki/startowe bez zmian`, { po: r.other, przed: g.other });
      }
    }
    console.log('\nHISTOGRAM przyczyn (Stadnina, miasto przy każdym koniu):', JSON.stringify(agg));
    if (args.record) {
      console.log('GOLDEN_RECORD ' + JSON.stringify(golden));
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
