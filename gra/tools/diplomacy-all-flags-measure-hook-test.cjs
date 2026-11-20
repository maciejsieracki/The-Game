'use strict';
/**
 * diplomacy-all-flags-measure-hook-test.cjs -- R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1: test haka, runnera i analizatora.
 * Bez przeglądarki. Uruchomienie: node tools/diplomacy-all-flags-measure-hook-test.cjs (z gra/).
 *
 * UWAGA: testy haka i runnera są TEKSTOWE (sprawdzenie obecności fragmentów źródła). Nie wykonują gry, więc nie
 * wykryją błędu logiki, która zachowuje tekst. Część behawioralna (uruchomienie gry i odczyt flag) wymaga przeglądarki
 * i w tym teście jest NIE_ZMIERZONO. Każda tekstowa kontrola ma mutację kopii, która MUSI dać czerwony wynik.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const wyniki = [];
const ok = (nazwa, warunek) => { wyniki.push(!!warunek); console.log((warunek ? 'ZIELONE ' : 'CZERWONE ') + nazwa); };

/** Kontrole tekstowe haka (main.ts) i runnera. Zwraca listę {nazwa, ok}. */
function checkHook(mainSrc, runnerSrc) {
  const out = [];
  const chk = (nazwa, warunek) => out.push({ nazwa, ok: !!warunek });
  const a = mainSrc.indexOf('window as any).__diploAllFlagsMeasure = {');
  const blok = a < 0 ? '' : mainSrc.slice(a, a + 1600);
  chk('hak: __diploAllFlagsMeasure istnieje w main.ts', blok.length > 0);
  // Wylaczenie daje jawne false (NIE null: dane maja ON), wlaczenie true. Tor NAP (torAktywny) poza pakietem.
  chk('setAll: const v: boolean = on===true (jawne false, nie null)', blok.includes('const v: boolean = on === true;'));
  chk('setAll NIE dotyka toru NAP (setAiAiTreatyTickEnabledForTest)', !blok.includes('setAiAiTreatyTickEnabledForTest('));
  for (const setter of ['setHarderDiplomacyEnabledForTest', 'setAiAiAllianceTickEnabledForTest',
    'setAiAiCoalitionEnabledForTest', 'setZeroTrustEnabledForTest', 'setWarByAllianceStrengthForTest', 'setWarLimitEnabledForTest']) {
    chk('setAll wywołuje ' + setter + '(v)', blok.includes(setter + '(v)'));
  }
  for (const getter of ['isHarderDiplomacyEnabled', 'isAiAiTreatyTickEnabled', 'isAiAiAllianceTickEnabled', 'isAiAiCoalitionEnabled',
    'isZeroTrustEnabled', 'isWarByAllianceStrengthEnabled', 'isWarLimitEnabled']) {
    chk('status czyta ' + getter, blok.includes(getter + '()'));
  }
  chk('runner: opcja --all-flags (ALL_FLAGS_ARG)', runnerSrc.includes("arg('all-flags', null)"));
  chk('runner: ustawienie przez __diploAllFlagsMeasure.setAll(on)', runnerSrc.includes('window.__diploAllFlagsMeasure.setAll(ALL_FLAGS') || runnerSrc.includes('window.__diploAllFlagsMeasure.setAll(on)'));
  // Kolejnosc: setAll PRZED pierwszym endTurn (endTurn wywolywany w petli tur, po starcie gry).
  const iSet = runnerSrc.indexOf('__diploAllFlagsMeasure.setAll(');
  const iEnd = runnerSrc.indexOf('__aiTradeWiringTestDebug.endTurn()');
  chk('runner: setAll wywoływany przed endTurn', iSet > 0 && iEnd > iSet);
  chk('runner: liczniki z licznikiZPar', runnerSrc.includes('licznikiZPar(m,'));
  chk('runner: plik seed<S>-all<0|1> (TAG)', runnerSrc.includes('`seed${SEED}-all${ALL_FLAGS ? 1 : 0}`'));
  chk('runner: --all-flags + --harder odrzucane', runnerSrc.includes('--all-flags nie łączy się z --harder'));
  return out;
}

const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const runnerSrc = fs.readFileSync(path.join(__dirname, 'diplomacy-harder-measure-run.cjs'), 'utf8');
for (const r of checkHook(mainSrc, runnerSrc)) ok(r.nazwa, r.ok);

// Mutacje kopii: kazda MUSI dac co najmniej jeden czerwony wynik kontroli tekstowej.
const mutMain = [
  ['v stałe true', mainSrc.replace('const v: boolean = on === true;', 'const v: boolean = true;')],
  ['v null (dane ON)', mainSrc.replace('const v: boolean = on === true;', 'const v = on === true ? true : null;')],
  ['setter wojen pominięty', mainSrc.replace('setWarLimitEnabledForTest(v);', '')],
  ['getter pominięty', mainSrc.replace('isWarLimitEnabled() === true', 'false')],
];
for (const [nazwa, src] of mutMain) {
  ok('mutacja main.ts „' + nazwa + '” jest CZERWONA', src !== mainSrc && checkHook(src, runnerSrc).some(r => !r.ok));
}
const mutRunner = [
  ['setAll po endTurn (kolejność)', runnerSrc.replace('__diploAllFlagsMeasure.setAll(', '__diploAllFlagsMeasure.setAllX(')],
  ['brak odrzucania --harder', runnerSrc.replace('--all-flags nie łączy się z --harder', 'x')],
];
for (const [nazwa, src] of mutRunner) {
  ok('mutacja runnera „' + nazwa + '” jest CZERWONA', src !== runnerSrc && checkHook(mainSrc, src).some(r => !r.ok));
}

// Samotesty modułów (zielone = zgodne).
for (const mod of ['diplomacy-all-flags-measure-counters.cjs', 'diplomacy-all-flags-measure-analyze.cjs']) {
  const r = spawnSync(process.execPath, [path.join(__dirname, mod), '--selftest'], { encoding: 'utf8' });
  ok('samotest ' + mod + ' zielony', r.status === 0);
}

// Mutacja kopii licznika: zmiana „wojen równoległych” na sumę wszystkich wojen musi dać CZERWONY samotest.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'allflags-mut-'));
const countersSrc = fs.readFileSync(path.join(__dirname, 'diplomacy-all-flags-measure-counters.cjs'), 'utf8');
const mutated = countersSrc.replace('(p.a === o || p.b === o)', 'true');
ok('mutacja kopii licznika zmieniła kod', mutated !== countersSrc);
fs.writeFileSync(path.join(scratch, 'counters-mut.cjs'), mutated);
const rm = spawnSync(process.execPath, [path.join(scratch, 'counters-mut.cjs'), '--selftest'], { encoding: 'utf8' });
ok('mutacja kopii licznika jest CZERWONA (test ma moc)', rm.status !== 0);

// Mutacja analizatora: odwrocenie typu pary (AI↔gracz <-> AI↔AI) musi dac czerwone.
const analyzeSrc = fs.readFileSync(path.join(__dirname, 'diplomacy-all-flags-measure-analyze.cjs'), 'utf8');
const mutA = analyzeSrc.replace("(p.a === gracz || p.b === gracz) ? 'ai-gracz' : 'ai-ai'", "(p.a === gracz || p.b === gracz) ? 'ai-ai' : 'ai-gracz'");
fs.writeFileSync(path.join(scratch, 'analyze-mut.cjs'), mutA);
const ra = spawnSync(process.execPath, [path.join(scratch, 'analyze-mut.cjs'), '--selftest'], { encoding: 'utf8' });
ok('mutacja kopii analizatora (typ pary) jest CZERWONA', mutA !== analyzeSrc && ra.status !== 0);

// Mutacja analizatora: granica odsetka 50 -> 51 musi dac czerwone (test granicy).
const mutG = analyzeSrc.replace('p.zaufanie >= 50', 'p.zaufanie > 50');
fs.writeFileSync(path.join(scratch, 'analyze-gr.cjs'), mutG);
const rg = spawnSync(process.execPath, [path.join(scratch, 'analyze-gr.cjs'), '--selftest'], { encoding: 'utf8' });
ok('mutacja kopii analizatora (granica Zaufanie>=50 -> >50) jest CZERWONA', mutG !== analyzeSrc && rg.status !== 0);

// Mutacja analizatora: TURY 150 -> 140 musi dac czerwone.
const mutT = analyzeSrc.replace('const TURY = [25, 50, 75, 100, 125, 150];', 'const TURY = [25, 50, 75, 100, 125, 140];');
fs.writeFileSync(path.join(scratch, 'analyze-tury.cjs'), mutT);
const rt = spawnSync(process.execPath, [path.join(scratch, 'analyze-tury.cjs'), '--selftest'], { encoding: 'utf8' });
ok('mutacja kopii analizatora (TURY 150 -> 140) jest CZERWONA', mutT !== analyzeSrc && rt.status !== 0);

fs.rmSync(scratch, { recursive: true, force: true });
const bad = wyniki.filter(x => !x).length;
console.log('WYNIK TESTU: ' + (wyniki.length - bad) + ' zielonych, ' + bad + ' czerwonych');
process.exit(bad ? 1 : 0);
