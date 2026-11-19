'use strict';
/**
 * diplomacy-all-flags-measure-hook-test.cjs -- R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1: test haka, runnera i analizatora.
 * Bez przeglądarki. Uruchomienie: node tools/diplomacy-all-flags-measure-hook-test.cjs (z gra/).
 * Zawiera mutację kopii licznika: zmutowana kopia MUSI być czerwona (inaczej test jest bez mocy).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const wyniki = [];
const ok = (nazwa, warunek) => { wyniki.push(!!warunek); console.log((warunek ? 'ZIELONE ' : 'CZERWONE ') + nazwa); };

const main = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const runner = fs.readFileSync(path.join(__dirname, 'diplomacy-harder-measure-run.cjs'), 'utf8');
const blok = (() => {
  const a = main.indexOf('window as any).__diploAllFlagsMeasure = {');
  if (a < 0) return '';
  return main.slice(a, a + 1600);
})();

ok('hak: __diploAllFlagsMeasure istnieje w main.ts', blok.length > 0);
for (const setter of ['setHarderDiplomacyEnabledForTest', 'setAiAiTreatyTickEnabledForTest', 'setAiAiAllianceTickEnabledForTest',
  'setAiAiCoalitionEnabledForTest', 'setZeroTrustEnabledForTest', 'setWarByAllianceStrengthForTest', 'setWarLimitEnabledForTest']) {
  ok('setAll wywołuje ' + setter, blok.includes(setter + '(v)'));
}
for (const getter of ['isHarderDiplomacyEnabled', 'isAiAiTreatyTickEnabled', 'isAiAiAllianceTickEnabled', 'isAiAiCoalitionEnabled',
  'isZeroTrustEnabled', 'isWarByAllianceStrengthEnabled', 'isWarLimitEnabled']) {
  ok('status czyta ' + getter, blok.includes(getter + '()'));
}
ok('runner: opcja --all-flags (ALL_FLAGS_ARG)', runner.includes("arg('all-flags', null)"));
ok('runner: ustawienie przez __diploAllFlagsMeasure.setAll', runner.includes('window.__diploAllFlagsMeasure.setAll(on)'));
ok('runner: liczniki z licznikiZPar', runner.includes('licznikiZPar(m,'));
ok('runner: plik seed<S>-all<0|1> (TAG)', runner.includes('`seed${SEED}-all${ALL_FLAGS ? 1 : 0}`'));

// Samotesty modułów (zielone = zgodne).
for (const mod of ['diplomacy-all-flags-measure-counters.cjs', 'diplomacy-all-flags-measure-analyze.cjs']) {
  const r = spawnSync(process.execPath, [path.join(__dirname, mod), '--selftest'], { encoding: 'utf8' });
  ok('samotest ' + mod + ' zielony', r.status === 0);
}

// Mutacja kopii licznika: zmiana „wojen równoległych” na sumę wszystkich wojen musi dać CZERWONY samotest.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'allflags-mut-'));
const countersSrc = fs.readFileSync(path.join(__dirname, 'diplomacy-all-flags-measure-counters.cjs'), 'utf8');
const mutated = countersSrc.replace("(p.a === o || p.b === o)", "true");
ok('mutacja kopii zmieniła kod', mutated !== countersSrc);
fs.writeFileSync(path.join(scratch, 'counters-mut.cjs'), mutated);
const rm = spawnSync(process.execPath, [path.join(scratch, 'counters-mut.cjs'), '--selftest'], { encoding: 'utf8' });
ok('mutacja kopii licznika jest CZERWONA (test ma moc)', rm.status !== 0);

// Mutacja analizatora: odwrócenie typu pary (AI↔gracz <-> AI↔AI) musi dać czerwone.
const analyzeSrc = fs.readFileSync(path.join(__dirname, 'diplomacy-all-flags-measure-analyze.cjs'), 'utf8');
const mutA = analyzeSrc.replace("(p.a === gracz || p.b === gracz) ? 'ai-gracz' : 'ai-ai'", "(p.a === gracz || p.b === gracz) ? 'ai-ai' : 'ai-gracz'");
fs.writeFileSync(path.join(scratch, 'analyze-mut.cjs'), mutA);
const ra = spawnSync(process.execPath, [path.join(scratch, 'analyze-mut.cjs'), '--selftest'], { encoding: 'utf8' });
ok('mutacja kopii analizatora jest CZERWONA', mutA !== analyzeSrc && ra.status !== 0);

const bad = wyniki.filter(x => !x).length;
console.log('WYNIK TESTU: ' + (wyniki.length - bad) + ' zielonych, ' + bad + ' czerwonych');
process.exit(bad ? 1 : 0);
