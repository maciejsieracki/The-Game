'use strict';
/**
 * corruption-reduction-palace-tribunal-test.cjs -- R-WEB-CORRUPTION-REDUCTION-PALACE-TIERS-TRIBUNAL-Q1
 * Decyzja wlasciciela 2026-11-08: Palac II/III = -30% korupcji jak Palac I; Trybunal = -30% jak Pretorium.
 * Regula laczenia (istniejaca, bez zmian): ADDYTYWNIE po 30pp, sufit sumy 0.60, TYLKO budynki w danym miescie.
 * Uruchom z gra/: node tools/corruption-reduction-palace-tribunal-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.corrpt-entry.ts');
const BUNDLE = path.resolve(__dirname, '.corrpt-bundle.cjs');
fs.writeFileSync(ENTRY, `export { loadEconParams, corruptionRate, corruptionBuildingReduction, cityYieldPerTurn } from '../src/game/economy';\nexport { TerenBazowy, Nakladka } from '../src/types/hex';\n`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
} catch (e) { console.error(e.message || e); process.exit(1); }
const M = require(BUNDLE);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

let passed = 0, failed = 0;
function assert(c, m) { if (c) { passed++; console.log('  PASS: ' + m); } else { failed++; console.error('  FAIL: ' + m); } }
function close(a, b, m) { assert(Math.abs(a - b) < 1e-9, m + ' (got ' + a + ', want ' + b + ')'); }

const red = M.corruptionBuildingReduction;
const params = M.loadEconParams(JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'econ-params.json'), 'utf8')), 'normal');
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const list = Array.isArray(buildings) ? buildings : (buildings.budynki || Object.values(buildings));
const byId = Object.fromEntries(list.filter(b => b && b.id).map(b => [b.id, b]));

console.log('\n--- T1: dane -- identyfikatory istnieja, Palac II/III to ulepszenia (jeden tier w miescie) ---');
for (const id of ['palac', 'palac_ii', 'palac_iii', 'trybunal', 'sad', 'pretorium']) assert(!!byId[id], id + ' istnieje w buildings.json');
assert(byId.palac_ii.upgradeFrom === 'palac', 'palac_ii.upgradeFrom === palac');
assert(byId.palac_iii.upgradeFrom === 'palac_ii', 'palac_iii.upgradeFrom === palac_ii');

console.log('\n--- T2: pojedyncze budynki -> 30% ---');
for (const id of ['palac', 'palac_ii', 'palac_iii', 'trybunal', 'sad', 'pretorium']) close(red([id]), 0.30, id + ' -> 0.30');

console.log('\n--- T3: brak budynkow / nieistotne budynki -> 0 ---');
close(red([]), 0, 'puste miasto -> 0');
close(red(['mlyn', 'targowisko', 'garnizon']), 0, 'budynki bez efektu korupcji -> 0');

console.log('\n--- T4: kombinacje (addytywnie, sufit 0.60) ---');
close(red(['trybunal', 'pretorium']), 0.60, 'Trybunal + Pretorium = 0.60');
close(red(['palac_ii', 'trybunal']), 0.60, 'Palac II + Trybunal = 0.60');
close(red(['palac_iii', 'trybunal']), 0.60, 'Palac III + Trybunal = 0.60');
close(red(['palac', 'trybunal']), 0.60, 'Palac I + Trybunal = 0.60');
close(red(['sad', 'trybunal']), 0.60, 'Sad + Trybunal = 0.60');
close(red(['sad', 'trybunal', 'pretorium']), 0.60, 'Sad + Trybunal + Pretorium = sufit 0.60 (nie 0.90)');
close(red(['sad', 'palac_iii', 'trybunal']), 0.60, 'Sad + Palac III + Trybunal = sufit 0.60');
close(red(['palac_ii', 'palac_iii']), 0.60, 'Obrona: gdyby dane mialy oba tiery naraz, nadal <= sufit 0.60');

console.log('\n--- T5: wplyw na przychody (miasto 8 pol od stolicy, 5 miast, 10.5% bazowej straty) ---');
{
  const base = M.corruptionRate(8, 5, params);
  close(base, 0.105, 'strata bazowa 10.5%');
  const cases = [
    ['bez budynkow', [], 0.105], ['Palac II', ['palac_ii'], 0.0735], ['Palac III', ['palac_iii'], 0.0735],
    ['Trybunal', ['trybunal'], 0.0735], ['Trybunal + Pretorium', ['trybunal', 'pretorium'], 0.042],
  ];
  for (const [name, ids, want] of cases) close(base * (1 - red(ids)), want, name + ': strata po redukcji');
  const tiles = Array.from({ length: 20 }, () => ({ terenBazowy: M.TerenBazowy.Rownina, nakladka: M.Nakladka.Brak, maRzeke: false }));
  const city = {
    id: 'c', ludnosc: 3, zdrowie: 0, czyStolica: false, maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 0, procentPieniadz: 100, procentLuksus: 0 }, podziałPracy: { procentBudynki: 50 },
  };
  const ctx = (s) => ({
    wojskoZuzycieZywnosci: 0, maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maAkademia: false, maMennica: false, walutaOdkryta: false, civHandelMult: 1, civNaukaMult: 1, strataFraction: s,
  });
  const y0 = M.cityYieldPerTurn(city, tiles, [], params, ctx(base)).pieniadz;
  const y1 = M.cityYieldPerTurn(city, tiles, [], params, ctx(base * (1 - red(['trybunal'])))).pieniadz;
  console.log('  INFO: pieniadz przed (bez Trybunalu) = ' + y0 + ', po (Trybunal) = ' + y1);
  assert(y1 >= y0, 'Trybunal nie zmniejsza przychodu (pieniadz po >= przed)');
}

console.log('\n--- T6: parytet gracz/AI -- oba wywolania w turn-economy.ts uzywaja tej samej funkcji ---');
{
  const src = fs.readFileSync(path.join(GRA, 'src', 'game', 'turn-economy.ts'), 'utf8');
  const n = (src.match(/corruptionBuildingReduction\(builtIds\)/g) || []).length;
  assert(n === 2, 'dokladnie 2 wywolania corruptionBuildingReduction(builtIds) (advance + preview), got ' + n);
  assert(!/corruptionBuildingReduction\([^)]*(isPlayer|ownerId)/.test(src), 'brak rozgalezienia po graczu/AI w wywolaniu');
}

console.log('\n--- T7: stary zapis (brak nowych pol) -- czysta funkcja budynkow, nic do migracji ---');
close(red(['sad']), 0.30, 'zapis ze starym zestawem budynkow liczy jak dotad');

console.log('\nPASSED:', passed, '/ FAILED:', failed);
process.exit(failed ? 1 : 0);
