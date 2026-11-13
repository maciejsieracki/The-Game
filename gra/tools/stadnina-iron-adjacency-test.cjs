'use strict';
/**
 * stadnina-iron-adjacency-test.cjs -- BRAMKA TEMATU R-WEB-IRON-STUD-ADJACENCY-Q1 (2026-11-11).
 *
 * GOAL (właściciel): naturalna stadnina na złożu konia bez zmian. Poza złożem (epoka Żelaza, 3+,
 * odblokowany Koń) stadnina wolno TYLKO na BEZPOŚREDNIM sąsiedzie (6 kierunków) już ZBUDOWANEJ
 * stadniny w terytorium gracza. Dystans 2 odrzucony, brak sąsiada odrzucony, kolejka tury nie liczy
 * się jako istniejąca, obca stadnina nie wlicza się, stare zapisy zostają, tooltip zgodny z silnikiem.
 *
 * Uruchamiaj z gra/:  node tools/stadnina-iron-adjacency-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.stadnina-iron-adjacency-entry.ts');
const BUNDLE = path.resolve(__dirname, '.stadnina-iron-adjacency-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildImprovementQualifier, hasBuiltOwnStudNeighbor, builtStudHexKeys } from ${JSON.stringify(SRC + '/map/improvement-build')};
export {
  isLivestockUnlockedForPlacement,
  STADNINA_FREE_FROM_ERA,
} from ${JSON.stringify(SRC + '/game/livestock-unlock')};
export { buildHexContextTooltipHtml } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
  },
};

const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, resolveExtensions: ['.ts', '.js', '.json'], logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json' }, plugins: [stubBrandAssetsPlugin],
  });

  const M = require(BUNDLE);
  const T = M.TerenBazowy;
  const N = M.Nakladka;
  let pass = 0, fail = 0;
  const ok = (cond, name, extra) => {
    if (cond) { pass++; console.log(`  [OK] ${name}`); }
    else { fail++; console.log(`  [FAIL] ${name}${extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''}`); }
  };

  function mkHex(q, r, teren, nakladka = N.Brak) {
    return {
      coords: { q, r }, terenBazowy: teren, nakladka,
      rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak',
      wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null,
    };
  }

  // Siatka: złoże konia w (0,0) z zbudowaną stadniną; pozostałe heksy w promieniu 3 to Łąka (bez złoża).
  const hexes = {};
  const hexKeys = [];
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      if (Math.abs(q + r) > 3) continue;
      const k = `${q},${r}`;
      hexes[k] = (q === 0 && r === 0)
        ? mkHex(0, 0, T.Rownina, N.ZlozeKonia)
        : mkHex(q, r, T.Laka);
      hexKeys.push(k);
    }
  }
  const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
  const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
  const ownTerritory = (foreign = new Set()) => hexKeys
    .filter(k => !foreign.has(k))
    .map(k => { const [q, r] = k.split(',').map(Number); return { q, r, pop: 10, level: 1, ownerId: 0 }; });
  const territoryNodes = ownTerritory();
  const STUD_AT_CENTER = new Map([['0,0', ['stadnina']]]);

  function qual(era, horseStockAvailable, tradeRouteKonUnlocked, placedImprovements, pendingUndoKeys, terr = territoryNodes) {
    return M.buildImprovementQualifier({
      map, cityNodes, territoryNodes: terr, playerOwnerIdNum: 0,
      playerCivArchetype: 'rzym', playerEra: era,
      horseStockAvailable, tradeRouteKonUnlocked,
      placedImprovements, pendingUndoKeys,
    });
  }

  console.log('\n--- (1) sześć kierunków sąsiedztwa: zbudowana stadnina obok -> TAK (era 3, magazyn 50) ---');
  {
    const q = qual(3, 50, false, STUD_AT_CENTER);
    for (const [dq, dr] of DIRS) {
      ok(q('stadnina', dq, dr) === true, `sąsiad (${dq},${dr}) od stadniny -> dozwolone`);
    }
  }

  console.log('\n--- (2) dystans 2 i dalej -> NIE; brak zbudowanej stadniny -> NIE ---');
  {
    const q = qual(3, 50, false, STUD_AT_CENTER);
    ok(q('stadnina', 2, 0) === false, 'dystans 2 (2,0) -> NIE');
    ok(q('stadnina', -2, 0) === false, 'dystans 2 (-2,0) -> NIE');
    ok(q('stadnina', 1, 1) === false, 'dystans 2 (1,1) -> NIE (poza 6 kierunkami)');
    ok(q('stadnina', -2, 2) === false, 'dystans 2 (-2,2) -> NIE');
    const none = qual(3, 50, false, undefined);
    ok(none('stadnina', 1, 0) === false, 'brak zbudowanej stadniny (bez placedImprovements) -> NIE');
  }

  console.log('\n--- (3) bramka epoki i magazynu nadal obowiązuje obok sąsiada ---');
  {
    ok(qual(2, 50, false, STUD_AT_CENTER)('stadnina', 1, 0) === false, 'epoka 2 + sąsiad + magazyn 50 -> NIE (era gate)');
    ok(qual(3, 49, false, STUD_AT_CENTER)('stadnina', 1, 0) === false, 'epoka 3 + sąsiad + magazyn 49 -> NIE (próg 50)');
    ok(qual(3, 50, false, STUD_AT_CENTER)('stadnina', 1, 0) === true, 'epoka 3 + sąsiad + magazyn DOKŁADNIE 50 -> TAK (próg >=)');
    ok(qual(3, 0, true, STUD_AT_CENTER)('stadnina', 1, 0) === true, 'epoka 3 + sąsiad + trasa handlowa (magazyn 0) -> TAK');
    ok(qual(4, 50, false, STUD_AT_CENTER)('stadnina', 1, 0) === true, 'epoka 4 + sąsiad + magazyn 50 -> TAK');
    ok(qual(3, 0, false, STUD_AT_CENTER)('stadnina', 1, 0) === false, 'epoka 3 + sąsiad, bez odblokowania Konia -> NIE');
  }

  console.log('\n--- (4) kolejka tury (pending) nie liczy się jako istniejąca stadnina ---');
  {
    const pending = new Set(['0,0:stadnina']);
    const q = qual(3, 50, false, STUD_AT_CENTER, pending);
    ok(q('stadnina', 1, 0) === false, 'stadnina tylko w kolejce tury (0,0:stadnina pending) -> sąsiad NIE');
    ok(M.hasBuiltOwnStudNeighbor({ map, cityNodes, territoryNodes, playerOwnerIdNum: 0,
      placedImprovements: STUD_AT_CENTER, pendingUndoKeys: pending }, 1, 0) === false,
      'hasBuiltOwnStudNeighbor: pending nie liczy się');
    ok(M.builtStudHexKeys(STUD_AT_CENTER, pending).has('0,0') === false, 'builtStudHexKeys wyklucza pending');
    ok(M.builtStudHexKeys(STUD_AT_CENTER).has('0,0') === true, 'builtStudHexKeys zawiera zbudowaną');
  }

  console.log('\n--- (5) własność: obca stadnina na sąsiedzie nie wlicza się ---');
  {
    // Sąsiad (1,0) należy do obcego właściciela (ownerId 1): usuwamy go z terytorium gracza 0.
    const terr = ownTerritory(new Set(['1,0']));
    terr.push({ q: 1, r: 0, pop: 10, level: 1, ownerId: 1 });
    const q = qual(3, 50, false, STUD_AT_CENTER, undefined, terr);
    ok(q('stadnina', 1, 0) === false, 'obca stadnina (sąsiad poza terytorium gracza) -> NIE');
    ok(q('stadnina', 0, 1) === true, 'własna stadnina (sąsiad (0,1) w terytorium gracza) -> TAK (kontrola)');
  }

  console.log('\n--- (5b) własność sąsiada: heks CELU własny, stadnina sąsiada w OBCYM terytorium -> NIE (kontrola: własny -> TAK) ---');
  {
    // Stadnina zbudowana na (1,0); (1,0) należy do obcego właściciela. Cel (0,1) jest w terytorium gracza
    // i sąsiaduje z (1,0) — wynik zależy WYŁĄCZNIE od własności sąsiada (inPlayerTerritory(cel) = true).
    const studAt10 = new Map([['1,0', ['stadnina']]]);
    const terrForeign = ownTerritory(new Set(['1,0']));
    terrForeign.push({ q: 1, r: 0, pop: 10, level: 1, ownerId: 1 });
    ok(qual(3, 50, false, studAt10, undefined, terrForeign)('stadnina', 0, 1) === false,
      'cel (0,1) własny, stadnina sąsiada (1,0) w obcym terytorium -> NIE (własność sąsiada)');
    ok(M.hasBuiltOwnStudNeighbor({ map, cityNodes, territoryNodes: terrForeign, playerOwnerIdNum: 0,
      placedImprovements: studAt10, pendingUndoKeys: undefined }, 0, 1) === false,
      'hasBuiltOwnStudNeighbor: obca stadnina sąsiada nie wlicza się (cel własny)');
    ok(qual(3, 50, false, studAt10, undefined, territoryNodes)('stadnina', 0, 1) === true,
      'kontrola: ta sama stadnina (1,0) w terytorium gracza -> TAK');
  }

  console.log('\n--- (6) złoże konia: naturalne złoże bez zmian (bez sąsiada, epoka 1) ---');
  {
    const q = qual(1, 0, false, undefined);
    ok(q('stadnina', 0, 0) === true, 'epoka 1, stadnina NA złożu konia (0,0) bez sąsiadów -> TAK (bez zmian)');
    ok(M.isLivestockUnlockedForPlacement('stadnina', hexes['0,0'], false, 0, 1) === true,
      'predykat: złoże konia zawsze dozwolone');
  }

  console.log('\n--- (7) predykat isLivestockUnlockedForPlacement (szósty argument = sąsiad) ---');
  {
    const open = hexes['1,0'];
    ok(M.isLivestockUnlockedForPlacement('stadnina', open, false, 50, 3, true) === true, 'sąsiad + magazyn 50 + era 3 -> true');
    ok(M.isLivestockUnlockedForPlacement('stadnina', open, false, 50, 3, false) === false, 'bez sąsiada -> false');
    ok(M.isLivestockUnlockedForPlacement('stadnina', open, false, 50, 2, true) === false, 'era 2 -> false nawet z sąsiadem');
    ok(M.isLivestockUnlockedForPlacement('bydlo', open, false, 0, 1) === true, 'bydło nie objęte szóstym argumentem');
  }

  console.log('\n--- (8) tooltip „Możliwe ulepszenia” zgodny z silnikiem (sąsiad jako wejście) ---');
  {
    const open = hexes['1,0'];
    const hasStadnina = (extra) => {
      const html = M.buildHexContextTooltipHtml({ q: 1, r: 0, hex: open, esc: (x) => x, ...extra });
      const i = html.indexOf('Możliwe ulepszenia');
      return i >= 0 && html.slice(i).includes('<b>Stadnina</b>');
    };
    ok(hasStadnina({ currentEra: 3, konImperialUnlocked: true, hasBuiltOwnStudNeighbor: true }) === true,
      'tooltip era 3 + Koń + sąsiad -> Stadnina TAK');
    ok(hasStadnina({ currentEra: 3, konImperialUnlocked: true, hasBuiltOwnStudNeighbor: false }) === false,
      'tooltip era 3 + Koń, bez sąsiada -> Stadnina NIE');
    ok(hasStadnina({ currentEra: 3, konImperialUnlocked: true }) === false,
      'tooltip era 3 + Koń (pole sąsiada nieprzekazane) -> Stadnina NIE (bezpieczny domyślny)');
  }

  console.log('\n--- (9) stare zapisy: stadnina już zbudowana poza złożem jest widziana jako istniejąca ---');
  {
    const oldSave = new Map([['1,0', ['stadnina']]]);
    ok(qual(3, 50, false, oldSave)('stadnina', 1, 0) === false, 'już zbudowana na (1,0): kwalifikator nie buduje dubla (existing)');
    ok(M.builtStudHexKeys(oldSave).has('1,0') === true, 'stary zapis: stadnina poza złożem widziana jako zbudowana');
  }

  console.log(`\n=== stadnina-iron-adjacency: ${pass} OK, ${fail} FAIL ===`);
  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(2); });
