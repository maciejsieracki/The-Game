'use strict';
/**
 * oboz-lowiecki-evaluator-probe.cjs — NIEZALEŻNA sonda Evaluatora (runda 1)
 * dla R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1.
 *
 * NIE jest kopią bramki Operatora. Inwentaryzacja idzie OD STRONY ŚCIEŻEK
 * WYKONANIA, nie od grepa po kluczu:
 *   P1 gracz-panel     : createImprovementBuildApi().canBuild / getQualifyingHexes
 *   P2 gracz-commit    : computeImprovementBuildImpact (applyBuildRequest, main.ts:11707)
 *   P3 automat + AI    : pickAutoImprovements (ai.ts planCityImprovements -> ta sama fn)
 *   P4 tooltip heksu   : buildHexContextTooltipHtml (realny render)
 *   P5 dostęp surowca  : improvementUnlockActiveOnHex (resource-access.ts:204)
 *   P6 wczytanie zapisu: migrateImprovementLayers
 *   P7 WYRĄB LASU      : stripImprovementsWhenForestRemoved (main.ts:11895/28906)
 *
 * Uruchamiaj z gra/:  node tools/oboz-lowiecki-evaluator-probe.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.OBOZ_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.oboz-ev-probe-entry.ts');
const BUNDLE = path.resolve(__dirname, '.oboz-ev-probe-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  buildImprovementQualifier, createImprovementBuildApi, computeImprovementBuildImpact,
  stripImprovementsWhenForestRemoved, galleryTerrainEligible,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { migrateImprovementLayers } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { improvementUnlockActiveOnHex } from ${JSON.stringify(SRC + '/game/resource-access')};
export { buildHexContextTooltipHtml } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
const stubBrand = { name: 'stub-brand', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); } };

let M, T, N;
let pass = 0, fail = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  [OK] ' + name); } else { fail++; console.log('  [FAIL] ' + name + (extra ? ' :: ' + extra : '')); } };

function mkMap(cells) {
  const hexes = {};
  cells.forEach((c, i) => {
    hexes[i + ',0'] = {
      coords: { q: i, r: 0 }, terenBazowy: c.t, nakladka: c.n ?? N.Brak,
      zloze: c.z, wysokosc: 0.5, rzeka: { obecna: false },
    };
  });
  return { hexes, width: cells.length, height: 1, riverPaths: [], starts: [] };
}
function stateFor(map, extra) {
  const nodes = [];
  for (const k of Object.keys(map.hexes)) {
    const h = map.hexes[k];
    if (!h || h.terenBazowy === T.Morze) continue;
    nodes.push({ q: h.coords.q, r: h.coords.r, ownerId: 0, cityId: 'c0' });
  }
  return Object.assign({
    map, cityNodes: [{ q: 0, r: 0, pop: 1, level: 1 }], territoryNodes: nodes,
    playerOwnerIdNum: 0, placedImprovements: new Map(),
    researchedTechs: new Set(['lowiectwo', 'Łowiectwo']), playerEra: 1,
  }, extra || {});
}
/** P3 — automat/AI: czy picker wybierze obóz na TYM heksie. */
function pickerBuilds(map, hex, placed) {
  const picks = M.pickAutoImprovements({
    cities: [{ id: 'c0', ownerId: 0, q: hex.coords.q, r: hex.coords.r, population: 1 }],
    ownerId: 0, map,
    territoryNodes: [{ q: hex.coords.q, r: hex.coords.r, ownerId: 0, cityId: 'c0' }],
    placedImprovements: placed ?? new Map(), pracaAvailable: 1e6,
    unlockedTechs: new Set(['lowiectwo', 'Łowiectwo']),
    pracaSurplusThreshold: 0, pracaBudgetPercent: 100, maxItemsPerCity: 8,
    skipWyrab: true, playerEra: 1, priorityOverride: ['oboz_lowiecki'],
  });
  return picks.some(p => p.key === 'oboz_lowiecki' && p.q === hex.coords.q && p.r === hex.coords.r);
}
/** P4 — tooltip: czy „Obóz łowiecki" pada w sekcji „Możliwe ulepszenia (teren)". */
function tooltipLists(map, hex) {
  const html = M.buildHexContextTooltipHtml({
    q: hex.coords.q, r: hex.coords.r, hex, esc: x => String(x), currentEra: 99, map,
  });
  const i = html.indexOf('Możliwe ulepszenia (teren)');
  return i >= 0 && html.slice(i).includes('Obóz łowiecki');
}
/** Wszystkie 4 ścieżki naraz — jedna odpowiedź na heks. */
function allPaths(map, hex) {
  const q = M.buildImprovementQualifier(stateFor(map));
  return {
    panel: q('oboz_lowiecki', hex.coords.q, hex.coords.r),
    commit: M.computeImprovementBuildImpact('oboz_lowiecki', hex, []) !== null,
    picker: pickerBuilds(map, hex),
    tooltip: tooltipLists(map, hex),
  };
}
const expectAll = (map, hex, want, label) => {
  const r = allPaths(map, hex);
  for (const p of ['panel', 'commit', 'picker', 'tooltip']) {
    ok(r[p] === want, `${label} :: ${p} -> ${want ? 'DOSTĘPNY' : 'NIEDOSTĘPNY'}`, JSON.stringify(r));
  }
};

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
    absWorkingDir: path.resolve(__dirname, '..'), plugins: [stubBrand], logLevel: 'warning',
  });
  delete require.cache[require.resolve(BUNDLE)];
  M = require(BUNDLE); T = M.TerenBazowy; N = M.Nakladka;

  console.log('\n=== A. PUŁAPKA „p-LAS-kie" — WŁASNY przypadek na równinie ===');
  // Dowód istotności: bierzemy nazwę bojową równiny WPROST ze źródła (battle-terrain.ts),
  // nie z ręki, i pokazujemy że po normalizacji zawiera podciąg „las".
  const bt = fs.readFileSync(path.resolve(SRC, 'battle', 'battle-terrain.ts'), 'utf8');
  const m = bt.match(/Plaskie \(rownina\/laka\)/);
  ok(!!m, 'A0 nazwa bojowa równiny „Plaskie (rownina/laka)" istnieje w battle-terrain.ts');
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  ok(norm('Plaskie (rownina/laka)').includes('las'),
    'A1 znormalizowana nazwa równiny FAKTYCZNIE zawiera podciąg „las" (warunek istotności)');
  // Zachowanie: równina bez lasu — w 4 wariantach złoża — musi być odrzucona na KAŻDEJ ścieżce.
  for (const [nz, z, nk] of [['bez złoża', undefined, N.Brak], ['zloze=konie (string)', 'konie', N.Brak],
    ['nakładka ZlozeKonia', undefined, N.ZlozeKonia], ['nakładka ZlozeBydla', undefined, N.ZlozeBydla]]) {
    const mp = mkMap([{ t: T.Rownina, n: nk, z }]);
    expectAll(mp, mp.hexes['0,0'], false, `A2 RÓWNINA bez lasu (${nz})`);
  }
  // Łąka („laka") — druga połowa tej samej nazwy, osobny przypadek.
  {
    const mp = mkMap([{ t: T.Laka, n: N.Brak }]);
    expectAll(mp, mp.hexes['0,0'], false, 'A3 ŁĄKA bez lasu');
  }

  console.log('\n=== B. LAS NA WZGÓRZU (ma DZIAŁAĆ) / WZGÓRZE BEZ LASU ZE ZŁOŻEM (ma NIE działać) ===');
  {
    const mp = mkMap([{ t: T.Wzgorza, n: N.Las }]);
    expectAll(mp, mp.hexes['0,0'], true, 'B1 LAS NA WZGÓRZU');
  }
  for (const [nz, nk] of [['ZlozeKonia', N.ZlozeKonia], ['ZlozeOwiec', N.ZlozeOwiec],
    ['ZlozeBydla', N.ZlozeBydla], ['ZlozeLamy', N.ZlozeLamy]]) {
    const mp = mkMap([{ t: T.Wzgorza, n: nk }]);
    expectAll(mp, mp.hexes['0,0'], false, `B2 WZGÓRZE bez lasu + ${nz}`);
  }
  { // złoże zapisane jako string w hex.zloze, nakładka Brak — drugi odczyt złoża
    const mp = mkMap([{ t: T.Wzgorza, n: N.Brak, z: 'owce' }]);
    expectAll(mp, mp.hexes['0,0'], false, 'B3 WZGÓRZE bez lasu + hex.zloze="owce"');
  }

  console.log('\n=== C. HEKSY Z generateMap (nie syntetyk) — ziarna Evaluatora ===');
  for (const seed of [5150, 31337]) {
    const g = M.generateMap(36, 28, seed, 'kontynenty');
    const keys = Object.keys(g.hexes).sort();
    const find = p => { for (const k of keys) { const h = g.hexes[k]; if (h && p(h)) return h; } return null; };
    const cases = [
      ['LAS NA WZGÓRZU', h => h.nakladka === N.Las && h.terenBazowy === T.Wzgorza, true],
      ['las na równinie', h => h.nakladka === N.Las && h.terenBazowy === T.Rownina, true],
      ['RÓWNINA bez lasu', h => h.nakladka === N.Brak && h.terenBazowy === T.Rownina, false],
      ['gołe wzgórze', h => h.nakladka === N.Brak && h.terenBazowy === T.Wzgorza, false],
      ['dowolne złoże zwierzęce bez lasu', h => h.nakladka !== N.Las
        && [N.ZlozeKonia, N.ZlozeOwiec, N.ZlozeBydla, N.ZlozeLamy].includes(h.nakladka), false],
    ];
    for (const [nz, pred, want] of cases) {
      const h = find(pred);
      if (!h) { console.log(`  [--] ziarno ${seed}: brak heksa „${nz}" (przypadek pominięty)`); continue; }
      expectAll(g, h, want, `C ziarno ${seed} (${h.coords.q},${h.coords.r}) „${nz}"`);
    }
  }

  console.log('\n=== D. DOSTĘP DO SUROWCA (resource-access) — brak regresji ===');
  {
    const mp = mkMap([{ t: T.Wzgorza, n: N.ZlozeKonia }, { t: T.Wzgorza, n: N.Las }]);
    ok(M.improvementUnlockActiveOnHex('oboz_lowiecki', mp.hexes['0,0']) === true,
      'D1 stary obóz poza lasem NIE traci aktywnego dostępu (obóz nie jest DEPOSIT_LINKED)');
    ok(M.improvementUnlockActiveOnHex('oboz_lowiecki', mp.hexes['1,0']) === true,
      'D2 obóz na lesie ma aktywny dostęp');
    ok(M.improvementUnlockActiveOnHex('stadnina', mp.hexes['0,0']) === true,
      'D3 kontrola: stadnina na złożu koni nadal ma dostęp (zmiana depositAllows nie ruszyła sąsiadów)');
  }

  console.log('\n=== E. STARE ZAPISY (kryt. 6) ===');
  ok(M.migrateImprovementLayers(['oboz_lowiecki'], { nakladka: N.ZlozeKonia, zloze: 'konie' }).includes('oboz_lowiecki'),
    'E1 wczytanie zapisu NIE kasuje obozu stojącego poza lasem');

  console.log('\n=== F. WYRĄB LASU POD OBOZEM — czy „nigdy poza lasem" trzyma się w grze ===');
  {
    const mp = mkMap([{ t: T.Wzgorza, n: N.Las }]);
    const hex = mp.hexes['0,0'];
    const st = stateFor(mp);
    const q = M.buildImprovementQualifier(st);
    ok(q('oboz_lowiecki', 0, 0) === true, 'F1 obóz postawiony legalnie na lesie na wzgórzu');
    // Ten sam heks, obóz już stoi: czy WYRĄB jest dostępny?
    const st2 = stateFor(mp, { placedImprovements: new Map([['0,0', ['oboz_lowiecki']]]) });
    const q2 = M.buildImprovementQualifier(st2);
    const wyrabOk = q2('wyrab', 0, 0);
    console.log('     wyrąb dostępny na heksie z obozem? -> ' + wyrabOk);
    // Egzekucja wyrębu (main.ts finalizeHexClearing / AI ~:28906):
    const layersAfter = M.stripImprovementsWhenForestRemoved(['oboz_lowiecki']);
    hex.nakladka = N.Brak;
    const stillThere = layersAfter.includes('oboz_lowiecki');
    console.log('     warstwy po stripImprovementsWhenForestRemoved -> ' + JSON.stringify(layersAfter));
    ok(!(wyrabOk && stillThere && hex.nakladka !== N.Las),
      'F2 po wyrębie lasu pod obozem obóz NIE zostaje na heksie bez lasu',
      `wyrab=${wyrabOk} obozZostaje=${stillThere} nakladka=${hex.nakladka}`);
  }

  console.log(`\noboz-lowiecki-evaluator-probe: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}
main().catch(e => { console.error(e); process.exit(1); });
