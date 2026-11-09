'use strict';
/**
 * stadnina-early-eras-deposit-only-test.cjs -- BRAMKA TEMATU
 * R-WEB-STABLE-STADNINA-ONLY-ON-HORSE-DEPOSIT-EARLY-ERAS-Q1 (2026-11-09).
 *
 * GOAL (polecenie właściciela): w epokach 1–2 (Kamień, Brąz) stadninę wolno budować WYŁĄCZNIE na
 * heksie ze złożem konia. Od epoki 3 (Żelaza) obowiązuje dotychczasowa reguła: po imperialnym
 * odblokowaniu Konia (trasa handlowa LUB magazyn 'kon' >= 50) stadninę można postawić na dowolnej
 * Łące/Równinie bez złoża. Dotyczy gracza, AI i auto-ulepszeń (ta sama funkcja dostępności) oraz
 * tooltipa „Możliwe ulepszenia” (zgodność z silnikiem w obie strony).
 *
 * ŻYWY DOWÓD -- woła DOKŁADNIE te same funkcje co silnik i tooltip (zbundlowane przez esbuild):
 *   • bramka kwalifikacji   -> buildImprovementQualifier (map/improvement-build.ts)
 *   • predykat stadniny     -> isLivestockUnlockedForPlacement (game/livestock-unlock.ts)
 *   • tooltip               -> buildHexContextTooltipHtml (ui/hexContextTooltip.ts)
 *
 * Uruchamiaj z gra/:  node tools/stadnina-early-eras-deposit-only-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.stadnina-early-eras-entry.ts');
const BUNDLE = path.resolve(__dirname, '.stadnina-early-eras-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export {
  isLivestockUnlockedForPlacement,
  STADNINA_FREE_FROM_ERA,
  STADNINA_HORSE_COST,
  stadninaImperialKonUnlocked,
} from ${JSON.stringify(SRC + '/game/livestock-unlock')};
export { buildHexContextTooltipHtml } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

// Stub ikon marki (tak jak w hex-tooltip-stadnina-kopalnia-cyny-test.cjs): tooltip importuje
// icons/brandAssets (SVG ?raw), a tu liczy się wyłącznie logika bramki, nie grafika.
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
  },
};

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
      coords: { q, r },
      terenBazowy: teren,
      nakladka,
      rzeka: { obecna: false, krawedzie: [] },
      ulepszenie: 'brak',
      wioska: { istnieje: false, ludnosc: 0 },
      wlasciciel: null,
    };
  }

  // Mapa: heks ze złożem konia (0,0, miasto) + heks Łąka BEZ złoża (1,0) + heks Równina BEZ złoża (2,0).
  const DEPOSIT_HEX = mkHex(0, 0, T.Rownina, N.ZlozeKonia);
  const OPEN_LAKA = mkHex(1, 0, T.Laka);
  const OPEN_ROWNINA = mkHex(2, 0, T.Rownina);
  const hexes = { '0,0': DEPOSIT_HEX, '1,0': OPEN_LAKA, '2,0': OPEN_ROWNINA };
  const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
  const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
  const territoryNodes = Object.values(hexes).map(h => ({ q: h.coords.q, r: h.coords.r, pop: 10, level: 1, ownerId: 0 }));

  function qual(era, horseStockAvailable, tradeRouteKonUnlocked) {
    return M.buildImprovementQualifier({
      map, cityNodes, territoryNodes, playerOwnerIdNum: 0,
      playerCivArchetype: 'rzym', playerEra: era,
      horseStockAvailable, tradeRouteKonUnlocked,
    });
  }

  console.log('\n--- stała i predykat konia (kontrakt) ---');
  ok(M.STADNINA_FREE_FROM_ERA === 3, 'STADNINA_FREE_FROM_ERA === 3 (epoka Żelaza)');
  ok(M.stadninaImperialKonUnlocked(true, 0) === true, 'imperialne odblokowanie: sama trasa handlowa');
  ok(M.stadninaImperialKonUnlocked(false, 50) === true, 'imperialne odblokowanie: magazyn 50 (próg >=)');
  ok(M.stadninaImperialKonUnlocked(false, 49) === false, 'imperialne odblokowanie: magazyn 49 -> brak');

  console.log('\n--- (A) epoka 1 i 2: stadnina POZA złożem NIE, nawet przy odblokowanym Koniu ---');
  for (const era of [1, 2]) {
    const q = qual(era, 50, true);
    ok(q('stadnina', 1, 0) === false, `epoka ${era}: Łąka bez złoża + trasa handlowa + magazyn 50 -> NIE`);
    ok(q('stadnina', 2, 0) === false, `epoka ${era}: Równina bez złoża + trasa handlowa + magazyn 50 -> NIE`);
    ok(M.isLivestockUnlockedForPlacement('stadnina', OPEN_LAKA, true, 50, era) === false,
      `epoka ${era}: isLivestockUnlockedForPlacement bez złoża przy odblokowaniu -> false`);
    ok(qual(era, 0, false)('stadnina', 1, 0) === false, `epoka ${era}: bez odblokowania -> NIE (bez zmian)`);
  }

  console.log('\n--- (B) epoka 1 i 2: stadnina NA złożu konia -- TAK (bez zmian) ---');
  for (const era of [1, 2]) {
    const q = qual(era, 0, false);
    ok(q('stadnina', 0, 0) === true, `epoka ${era}: stadnina na złożu konia, magazyn 0, bez trasy -> TAK`);
    ok(M.isLivestockUnlockedForPlacement('stadnina', DEPOSIT_HEX, false, 0, era) === true,
      `epoka ${era}: isLivestockUnlockedForPlacement na złożu -> true`);
  }

  console.log('\n--- (C) epoka 3 (Żelaza) i wyżej: po imperialnym odblokowaniu -- TAK bez złoża ---');
  {
    const q3 = qual(3, 50, false);
    ok(q3('stadnina', 1, 0) === true, 'epoka 3: Łąka bez złoża + magazyn 50 -> TAK');
    ok(q3('stadnina', 2, 0) === true, 'epoka 3: Równina bez złoża + magazyn 50 -> TAK');
    ok(qual(3, 0, true)('stadnina', 1, 0) === true, 'epoka 3: Łąka bez złoża + trasa handlowa -> TAK');
    ok(qual(4, 50, false)('stadnina', 1, 0) === true, 'epoka 4: magazyn 50 bez złoża -> TAK (epoki >= 3)');
    ok(qual(3, 0, false)('stadnina', 1, 0) === false, 'epoka 3: bez odblokowania Konia, bez złoża -> NIE');
    ok(qual(3, 49, false)('stadnina', 1, 0) === false, 'epoka 3: magazyn 49 (poniżej progu) -> NIE');
    ok(M.isLivestockUnlockedForPlacement('stadnina', OPEN_LAKA, false, 50, 3) === true,
      'epoka 3: isLivestockUnlockedForPlacement bez złoża przy magazynie 50 -> true');
  }

  console.log('\n--- (D) regresja: bydło/owce/lama nie są objęte bramką stadniny ---');
  {
    const q1 = qual(1, 0, false);
    const pasture = mkHex(3, 0, T.Laka, N.ZlozeBydla);
    ok(M.isLivestockUnlockedForPlacement('bydlo', pasture, false, 0, 1) === true,
      'bydlo: zawsze dozwolone (epoka 1, bez odblokowania)');
    ok(M.isLivestockUnlockedForPlacement('owce', OPEN_LAKA, false, 0, 1) === true,
      'owce: zawsze dozwolone (epoka 1)');
    ok(M.isLivestockUnlockedForPlacement('lama', OPEN_ROWNINA, false, 0, 2) === true,
      'lama: zawsze dozwolona (epoka 2)');
    void q1;
  }

  console.log('\n--- (E) tooltip „Możliwe ulepszenia” zgodny z silnikiem w obie strony ---');
  function tooltipPossibleHas(hex, label, extra) {
    const html = M.buildHexContextTooltipHtml({
      q: hex.coords.q, r: hex.coords.r, hex, esc: (x) => x, ...extra,
    });
    const i = html.indexOf('Możliwe ulepszenia');
    if (i < 0) return false;
    return html.slice(i).includes(`<b>${label}</b>`);
  }
  {
    const open = mkHex(7, 0, T.Laka);
    ok(tooltipPossibleHas(open, 'Stadnina', { currentEra: 1, konImperialUnlocked: true }) === false,
      'tooltip epoka 1 + odblokowany Koń -> Stadnina NIE na heksie bez złoża (zgodnie z silnikiem)');
    ok(tooltipPossibleHas(open, 'Stadnina', { currentEra: 2, konImperialUnlocked: true }) === false,
      'tooltip epoka 2 + odblokowany Koń -> Stadnina NIE na heksie bez złoża (zgodnie z silnikiem)');
    ok(tooltipPossibleHas(open, 'Stadnina', { currentEra: 3, konImperialUnlocked: true }) === true,
      'tooltip epoka 3 + odblokowany Koń -> Stadnina NA heksie bez złoża (zgodnie z silnikiem)');
    ok(tooltipPossibleHas(open, 'Stadnina', { currentEra: 3, konImperialUnlocked: false }) === false,
      'tooltip epoka 3 bez odblokowania Konia -> Stadnina NIE na heksie bez złoża');
    const deposit = mkHex(8, 0, T.Rownina, N.ZlozeKonia);
    ok(tooltipPossibleHas(deposit, 'Stadnina', { currentEra: 1 }) === true,
      'tooltip epoka 1 na złożu konia -> Stadnina TAK (bez zmian)');
  }

  console.log('\n--- (F) spójność kodu: engine przekazuje epokę; auto-ulepszenia i AI używają tej samej bramki ---');
  {
    const fs2 = require('fs');
    const imp = fs2.readFileSync(path.resolve(SRC, 'map', 'improvement-build.ts'), 'utf8');
    const callCount = (imp.match(/isLivestockUnlockedForPlacement\([^)]*playerEra\)/g) || []).length;
    ok(callCount === 4, `improvement-build.ts: 4 wywołania isLivestockUnlockedForPlacement przekazują playerEra (jest ${callCount})`);
    const auto = fs2.readFileSync(path.resolve(SRC, 'game', 'auto-improvements.ts'), 'utf8');
    ok(/buildImprovementQualifier\(state\)/.test(auto) && /playerEra,/.test(auto),
      'auto-improvements.ts: stan dla buildImprovementQualifier niesie playerEra');
    const tip = fs2.readFileSync(path.resolve(SRC, 'ui', 'hexContextTooltip.ts'), 'utf8');
    ok(tip.includes("if (key === 'stadnina' && !hexHasHorseDeposit({ nakladka, zloze })) {"),
      'hexContextTooltip.ts: bramka stadniny poza złożem obecna');
    const json = fs2.readFileSync(path.resolve(__dirname, '..', 'data', 'terrain-improvements.json'), 'utf8');
    ok(json.includes('od epoki Żelaza (3) także bez złoża'),
      'terrain-improvements.json: warunek stadniny podaje epokę Żelaza (3)');
  }

  try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

  console.log(`\nstadnina-early-eras-deposit-only-test: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
