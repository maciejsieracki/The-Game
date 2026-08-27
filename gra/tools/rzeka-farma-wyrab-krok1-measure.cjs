'use strict';
/**
 * rzeka-farma-wyrab-krok1-measure.cjs — POMIAR (nie bramka), KROK 1 tematu
 * R-AI-WYRAB-PRZY-RZECE-FARMY-Q1.
 *
 * Pytanie dispatchu: czy na heksie PRZY RZECE Z LASEM oplaca sie wyrab pod farme,
 * skoro decyzja wlasciciela z 2026-07-21 pozwala postawic farme NA LESIE bez wyrebu.
 *
 * Warianty na TYM SAMYM heksie:
 *  (a) las zostaje + farma            — stan dzisiejszy
 *  (b) wyrab (las znika) + farma
 *  (c) jak (b), plus jednorazowe Drewno z wyrebu policzone jako zysk
 *
 * Plony liczone realna funkcja gry `tileYield` (game/economy.ts) — ta sama, ktora
 * liczy plon miasta. Kwalifikacja farmy realnym `buildImprovementQualifier`.
 *
 * Run: node tools/rzeka-farma-wyrab-krok1-measure.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.RZ_SRC_DIR || path.resolve(__dirname, '..', 'src');
const TAG = process.env.RZ_TAG || 'krok1';
const ENTRY = path.resolve(__dirname, `.rzeka-krok1-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.rzeka-krok1-${TAG}-bundle.cjs`);

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { tileYield } from ${JSON.stringify(SRC + '/game/economy')};
export { buildImprovementQualifier, isFarmBaseTerrain, isRiverAdjacent } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'warning',
});
const M = require(BUNDLE);
const { TerenBazowy, Nakladka, tileYield } = M;
const IMP = require(path.resolve(__dirname, '..', 'data', 'terrain-improvements.json'));

const KOSZT_FARMA = IMP.farma.koszt_praca;               // 20
const KOSZT_WYRAB = IMP.wyrab.koszt_praca;               // 2.5
const DREWNO_WYRAB = IMP.wyrab.wycinka.praca_per_tura * IMP.wyrab.wycinka.tury; // 25 x 1

const NAZWA_TERENU = {};
for (const k of Object.keys(TerenBazowy)) NAZWA_TERENU[TerenBazowy[k]] = k;

function y(teren, las, rzeka, keys) {
  return tileYield({
    terenBazowy: teren,
    nakladka: las ? Nakladka.Las : Nakladka.Brak,
    maRzeke: rzeka,
    ulepszeniaKeys: keys,
  });
}

function fmt(t) {
  return `zyw=${t.zywnosc} pieniadz=0 praca=${t.praca} handel=${t.handel} drewno=${t.drewno}`;
}

/**
 * Zbior heksow z rzeka NA heksie.
 * UWAGA: wygenerowany heks NIE ma pola `maRzeke` — rzeka zyje w `map.riverPaths`
 * (tak samo czyta ja gra: `buildRiverHexSet` w improvement-build.ts:614).
 */
function riverHexKeys(map) {
  const set = new Set();
  for (const path of (map.riverPaths || [])) for (const p of path) set.add(`${p.q},${p.r}`);
  return set;
}

const seeds = (process.env.RZ_SEEDS || '42,1337,2026').split(',').map(Number);

console.log('\n=== KROK 1 — plon heksa PRZY RZECE Z LASEM, trzy warianty ===');
console.log(`koszt Pracy: farma=${KOSZT_FARMA} · wyrab=${KOSZT_WYRAB} · Drewno z wyrebu (jednorazowo)=${DREWNO_WYRAB}`);

// --- A. tabela analityczna per teren bazowy (deterministyczna, niezalezna od ziarna) ---
const TERENY = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza];
console.log('\n--- A. Plon/ture wg terenu bazowego (rzeka NA heksie) ---');
for (const t of TERENY) {
  const nm = NAZWA_TERENU[t];
  const goly = y(t, true, true, []);
  const a = y(t, true, true, ['farma']);
  const b = y(t, false, true, ['farma']);
  const farmaOkLas = M.isFarmBaseTerrain(t, Nakladka.Las);
  const farmaOkBezLasu = M.isFarmBaseTerrain(t, Nakladka.Brak);
  console.log(`\n${nm}  (farma na lesie dozwolona: ${farmaOkLas} · farma bez lasu dozwolona: ${farmaOkBezLasu})`);
  console.log(`  las+rzeka, bez ulepszen : ${fmt(goly)}`);
  console.log(`  (a) las + farma         : ${fmt(a)}   koszt Pracy ${KOSZT_FARMA}   Drewno 0`);
  console.log(`  (b) wyrab + farma       : ${fmt(b)}   koszt Pracy ${KOSZT_FARMA + KOSZT_WYRAB}   Drewno 0`);
  console.log(`  (c) wyrab + farma +DR   : ${fmt(b)}   koszt Pracy ${KOSZT_FARMA + KOSZT_WYRAB}   Drewno +${DREWNO_WYRAB} jednorazowo`);
  const d = {
    zywnosc: b.zywnosc - a.zywnosc, praca: b.praca - a.praca,
    handel: b.handel - a.handel, drewno: b.drewno - a.drewno,
  };
  console.log(`  DELTA (b)-(a)/ture      : zyw=${d.zywnosc} praca=${d.praca} handel=${d.handel} drewno=${d.drewno}`);
  const turyZwrotu = (d.zywnosc + d.praca + d.handel) > 0
    ? (KOSZT_WYRAB / (d.zywnosc + d.praca + d.handel)).toFixed(1)
    : 'NIGDY (delta <= 0)';
  console.log(`  zwrot kosztu wyrebu     : ${turyZwrotu} tur (suma plonow/ture)`);
}

// --- B. ile takich heksow realnie istnieje na mapach ---
console.log('\n--- B. Ile heksow „rzeka NA heksie + Las" wystepuje realnie (mapa 36x28 kontynenty) ---');
let tot = 0;
for (const s of seeds) {
  const map = M.generateMap(36, 28, s, 'kontynenty');
  const riverSet = riverHexKeys(map);
  const perTeren = {};
  let zLasem = 0, bezLasu = 0;
  for (const hk of riverSet) {
    const h = map.hexes[hk];
    if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
    if (h.nakladka === Nakladka.Las) {
      zLasem++;
      const nm = NAZWA_TERENU[h.terenBazowy];
      perTeren[nm] = (perTeren[nm] ?? 0) + 1;
    } else bezLasu++;
  }
  tot += zLasem;
  console.log(`seed ${s}: heksow z rzeka=${riverSet.size} | rzeka+Las = ${zLasem} ${JSON.stringify(perTeren)} · rzeka bez lasu = ${bezLasu}`);
}
console.log(`RAZEM rzeka+Las na ${seeds.length} ziarnach: ${tot}`);

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}
