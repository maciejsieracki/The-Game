'use strict';
/**
 * stadnina-hex-candidates-test.cjs — BRAMKA TEMATU R-WEB-STADNINA-NO-HEX-FALSE-NEGATIVE-Q1.
 *
 * ZGŁOSZENIE WŁAŚCICIELA (2026-11-03): mimo złoża konia w terytorium panel ulepszeń pokazuje
 * przy Stadninie „Brak heksów w twoim terytorium".
 *
 * PRZYCZYNA (ustalona na dowodach): `createImprovementBuildApi` budował zbiór heksów-kandydatów
 * (`candidateHexKeys`) WYŁĄCZNIE z `state.cityNodes` (miasta), a od R-WEB-OUTPOST-FORT-TERRITORY-Q1
 * (2026-10-31) posterunek/fort tworzą twarde terytorium w `state.territoryNodes`. Złoże konia
 * w terytorium posterunku/fortu poza pierścieniem (zasięg miasta + 1) nie było kandydatem, choć
 * `inPlayerTerritory()` je akceptowało -> getQualifyingHexes('stadnina') = [] -> „Brak heksów".
 *
 * Dowód = realne funkcje gry (createImprovementBuildApi.listTypes/getQualifyingHexes,
 * getStadninaBuildBlockReason). Mutacja (usunięcie filtra węzłów terytorium) MUSI czerwienić test.
 * Bundle poza repo (/dev/shm). Uruchom z gra/:  node tools/stadnina-hex-candidates-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const TMP = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'stadnina-hex-'));
const IMPROVEMENT_BUILD = path.join(SRC, 'map', 'improvement-build.ts');

async function buildBundleAsync(tag, mutate) {
  const entry = path.join(TMP, `entry-${tag}.ts`);
  const out = path.join(TMP, `bundle-${tag}.cjs`);
  fs.writeFileSync(entry, `
export { createImprovementBuildApi, buildCandidateHexKeys, getStadninaBuildBlockReason } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');
  const plugin = {
    name: 'mutate',
    setup(b) {
      if (!mutate) return;
      b.onLoad({ filter: /improvement-build\.ts$/ }, (args) => {
        const src = fs.readFileSync(args.path, 'utf8');
        const mutated = mutate(src);
        if (mutated === src) throw new Error('mutacja nie zmieniła źródła');
        return { contents: mutated, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: out, resolveExtensions: ['.ts', '.js', '.json'], logLevel: 'silent', plugins: [plugin],
  });
  return out;
}

let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log(`  [OK] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''}`); }
};

function scenario(M) {
  const T = M.TerenBazowy, N = M.Nakladka;
  const mkHex = (q, r, teren = T.Laka, nakladka = N.Brak) => ({
    coords: { q, r }, terenBazowy: teren, nakladka,
    rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null,
  });
  const hexes = {};
  for (let q = -4; q <= 16; q++) for (let r = -6; r <= 6; r++) hexes[`${q},${r}`] = mkHex(q, r);
  const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
  // Miasto (0,0) pop 1 + posterunek (9,0) (r=3) gracza 0: terytorium posterunku sięga q=6..12.
  const cityNodes = [{ q: 0, r: 0, pop: 1, level: 1 }];
  const territoryNodes = [
    { q: 0, r: 0, pop: 1, level: 1, ownerId: 0 },
    { q: 9, r: 0, pop: 0, level: 1, isOutpost: true, ownerId: 0 },
    { q: 30, r: 30, pop: 0, level: 1, isOutpost: true, ownerId: 1 }, // obcy
  ];
  return { T, N, map, cityNodes, territoryNodes, mkHex };
}

function api(M, sc, extra = {}) {
  const state = {
    map: sc.map, cityNodes: sc.cityNodes, territoryNodes: sc.territoryNodes,
    playerOwnerIdNum: 0, playerCivArchetype: 'rzymianie', playerEra: 3, // R-WEB-STABLE-STADNINA-ONLY-ON-HORSE-DEPOSIT-EARLY-ERAS-Q1 (era>=3 dla ścieżki magazynu)
    researchedTechs: new Set(['Jeździectwo']),
    horseStockAvailable: 0, tradeRouteKonUnlocked: false, ...extra,
  };
  return { state, build: M.createImprovementBuildApi(state) };
}

const stadninaInfo = (b) => b.listTypes().find(t => t.key === 'stadnina');
const hasHex = (b, q, r) => b.getQualifyingHexes('stadnina').some(h => h.q === q && h.r === r);

async function main() {
  const good = require(await buildBundleAsync('good', null));
  const sc = scenario(good);
  const { T, N } = sc;

  console.log('\n--- (A) koń w terytorium MIASTA (kontrola: działało i przed) ---');
  {
    sc.map.hexes['1,0'] = sc.mkHex(1, 0, T.Rownina, N.ZlozeKonia);
    const { build } = api(good, sc);
    ok(hasHex(build, 1, 0), 'koń na równinie w terytorium miasta -> kandydat');
    delete sc.map.hexes['1,0'];
    sc.map.hexes['1,0'] = sc.mkHex(1, 0);
  }

  console.log('\n--- (B) koń w terytorium POSTERUNKU poza pierścieniem miasta (przyczyna fałszywego „Brak heksów") ---');
  {
    sc.map.hexes['10,0'] = sc.mkHex(10, 0, T.Rownina, N.ZlozeKonia);
    sc.map.hexes['10,1'] = sc.mkHex(10, 1, T.Laka, N.ZlozeKonia);
    const { state, build } = api(good, sc);
    ok(!good.buildCandidateHexKeys({ ...state, territoryNodes: sc.territoryNodes.filter(n => !n.isOutpost) }).has('10,0'),
      'dowód przyczyny: sam pierścień miast NIE obejmuje (10,0)');
    ok(hasHex(build, 10, 0), 'koń na równinie w terytorium posterunku -> kandydat');
    ok(hasHex(build, 10, 1), 'koń na łące w terytorium posterunku -> kandydat');
    const info = stadninaInfo(build);
    ok(info.techUnlocked === true, 'panel: Stadnina dostępna (techUnlocked)', info);
    ok(info.lockHint !== 'Brak heksów w twoim terytorium', 'panel: brak komunikatu „Brak heksów"', info.lockHint);
  }

  console.log('\n--- (C) koń POZA terytorium gracza ---');
  {
    sc.map.hexes['12,2'] = sc.mkHex(12, 2, T.Rownina, N.ZlozeKonia);
    const { build } = api(good, sc);
    ok(!hasHex(build, 12, 2), 'koń poza terytorium -> NIE kandydat');
  }

  console.log('\n--- (D) komunikaty odmowy zgodne z PRAWDZIWYM powodem ---');
  {
    // D1: brak złoża w ogóle
    for (const k of ['10,0', '10,1', '12,2']) sc.map.hexes[k] = sc.mkHex(...k.split(',').map(Number));
    let { build } = api(good, sc);
    let h = stadninaInfo(build);
    ok(h.techUnlocked === false && /Wymagane złoże konia na twoim terytorium/.test(h.lockHint), 'D1: brak złoża -> „Wymagane złoże konia…"', h.lockHint);
    ok(!/Brak heksów/.test(h.lockHint), 'D1: nie ogólne „Brak heksów"');
    // D2: złoże poza terytorium
    sc.map.hexes['12,2'] = sc.mkHex(12, 2, T.Rownina, N.ZlozeKonia);
    ({ build } = api(good, sc));
    h = stadninaInfo(build);
    ok(/poza twoim terytorium/.test(h.lockHint), 'D2: złoże poza terytorium -> komunikat o terytorium', h.lockHint);
    // D3: złoże w terytorium już ze stadniną
    sc.map.hexes['2,0'] = sc.mkHex(2, 0, T.Rownina, N.ZlozeKonia);
    ({ build } = api(good, sc, { placedKeys: new Set(['2,0']), placedImprovements: new Map([['2,0', ['stadnina']]]) }));
    h = stadninaInfo(build);
    ok(/mają już stadninę/.test(h.lockHint), 'D3: złoże już zabudowane -> „mają już stadninę"', h.lockHint);
    sc.map.hexes['2,0'] = sc.mkHex(2, 0);
    // D4: złoże na wzgórzu (stadnina: tylko łąka/równina) -> uczciwy powód, brak kandydata
    sc.map.hexes['2,1'] = sc.mkHex(2, 1, T.Wzgorza, N.ZlozeKonia);
    ({ build } = api(good, sc));
    h = stadninaInfo(build);
    ok(!hasHex(build, 2, 1) && /łąki lub równiny/.test(h.lockHint), 'D4: złoże na wzgórzu -> powód terenu (reguły terenu bez zmian)', h.lockHint);
    sc.map.hexes['2,1'] = sc.mkHex(2, 1);
    // D5: bez złoża, ale magazyn >= 50 -> kandydaci są (ścieżka magazynu bez zmian)
    ({ build } = api(good, sc, { horseStockAvailable: 50 }));
    ok(hasHex(build, 1, 0), 'D5: magazyn 50 koni -> stadnina poza złożem nadal możliwa (bez zmian)');
  }

  console.log('\n--- (E) MUTACJA: usunięcie węzłów terytorium z kandydatów MUSI czerwienić (B) ---');
  {
    const bad = require(await buildBundleAsync('mut', (src) =>
      src.replace('if (node.ownerId !== ownerNum) continue;', 'continue;')));
    const sc2 = scenario(bad);
    sc2.map.hexes['10,0'] = sc2.mkHex(10, 0, sc2.T.Rownina, sc2.N.ZlozeKonia);
    const { build } = api(bad, sc2);
    ok(!hasHex(build, 10, 0), 'mutacja: koń w terytorium posterunku NIE jest kandydatem (test (B) by padł)');
    ok(stadninaInfo(build).techUnlocked === false, 'mutacja: panel pokazuje blokadę (to dokładnie zgłoszony objaw)');
  }

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\nWYNIK: pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* */ } process.exit(2); });
