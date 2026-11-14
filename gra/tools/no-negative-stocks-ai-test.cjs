'use strict';
/**
 * no-negative-stocks-ai-test.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (etap C1, czysta logika).
 *
 * Sprawdza src/game/no-negative-stocks.ts (buildAiLevers + planAiBalance):
 *  - kolejność: podatek -> wstrzymanie zakupów -> rozwiązanie jednostek wsparcia (od najdroższej),
 *  - jednostki obronne (ostatnie w mieście) nigdy nie trafiają do planu (brak eliminacji),
 *  - dźwignie z zyskiem <= 0 / NaN są pomijane,
 *  - plan pokrywa brak, gdy wystarczy dźwigni; przy braku dźwigni zwraca niepokryte,
 *  - deterministyczność (ta sama wejście -> ten sam plan).
 *
 * NIE testuje wpięcia w turę AI (main.ts/ai.ts) ani runnera headless — to etap C2.
 *
 * Run: node tools/no-negative-stocks-ai-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-ai-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-ai-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildAiLevers,
  planAiBalance,
} from '../src/game/no-negative-stocks';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

// 1) Kolejność dźwigni: podatek, wstrzymanie, potem rozwiązanie od najdroższej.
{
  const levers = M.buildAiLevers({
    podatekSkarbiec: 4,
    wstrzymania: [{ id: 'budowa-A', stock: 'skarbiec', zysk: 3 }],
    jednostkiWsparcia: [
      { id: 'tani', stock: 'skarbiec', zysk: 5, koszt: 10 },
      { id: 'drogi', stock: 'skarbiec', zysk: 5, koszt: 80 },
    ],
    jednostkiObronne: [],
  });
  const plan = M.planAiBalance([{ stock: 'skarbiec', ile: 100 }], levers);
  const kolejnosc = plan.akcje.map(a => a.leverId).join(',');
  ok(kolejnosc === 'podatek-skarbiec,budowa-A,drogi,tani', 'kolejność podatek->wstrzymanie->drogi->tani, była: ' + kolejnosc);
}

// 2) Jednostki obronne nie trafiają do planu, nawet gdy są jedyną dźwignią.
{
  const levers = M.buildAiLevers({
    podatekSkarbiec: 0,
    wstrzymania: [],
    jednostkiWsparcia: [],
    jednostkiObronne: [{ id: 'obrona-ostatnia', stock: 'spichlerz', zysk: 50, koszt: 40 }],
  });
  const plan = M.planAiBalance([{ stock: 'spichlerz', ile: 10 }], levers);
  ok(plan.akcje.length === 0, 'jednostka obronna nie jest rozwiązywana (brak eliminacji)');
  ok(plan.pokryte === false && plan.pozostalo.spichlerz === 10, 'brak dozwolonych dźwigni = niepokryte');
  ok(levers.length === 1 && levers[0].eliminujeCywilizacje === true, 'obronna ma eliminujeCywilizacje=true');
}

// 3) Dźwignie z zyskiem <= 0 lub NaN są pomijane.
{
  const levers = M.buildAiLevers({
    podatekSkarbiec: 0,
    wstrzymania: [{ id: 'zero', stock: 'skarbiec', zysk: 0 }, { id: 'nan', stock: 'skarbiec', zysk: NaN }],
    jednostkiWsparcia: [{ id: 'ujemny', stock: 'skarbiec', zysk: -3, koszt: 1 }],
    jednostkiObronne: [],
  });
  ok(levers.length === 0, 'zysk <=0 / NaN pominięte');
}

// 4) Pokrycie: wystarczy podatek + jedna jednostka; plan kończy po pokryciu.
{
  const levers = M.buildAiLevers({
    podatekSkarbiec: 6,
    wstrzymania: [],
    jednostkiWsparcia: [{ id: 'j1', stock: 'skarbiec', zysk: 10, koszt: 30 }],
    jednostkiObronne: [],
  });
  const plan = M.planAiBalance([{ stock: 'skarbiec', ile: 12 }], levers);
  ok(plan.pokryte === true, 'brak pokryty przez podatek i jednostkę');
  ok(plan.akcje.map(a => a.leverId).join(',') === 'podatek-skarbiec,j1', 'plan: podatek, potem j1');
}

// 5) Deterministyczność: to samo wejście -> identyczny plan.
{
  const input = {
    podatekSkarbiec: 2,
    wstrzymania: [{ id: 'w2', stock: 'spichlerz', zysk: 4 }, { id: 'w1', stock: 'spichlerz', zysk: 4 }],
    jednostkiWsparcia: [{ id: 'z', stock: 'spichlerz', zysk: 7, koszt: 20 }],
    jednostkiObronne: [],
  };
  const a = JSON.stringify(M.planAiBalance([{ stock: 'spichlerz', ile: 9 }], M.buildAiLevers(input)));
  const b = JSON.stringify(M.planAiBalance([{ stock: 'spichlerz', ile: 9 }], M.buildAiLevers(input)));
  ok(a === b, 'plan deterministyczny');
}

try { fs.unlinkSync(ENTRY); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`no-negative-stocks-ai-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
