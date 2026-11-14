'use strict';
/**
 * diplo-trust-war-n6-cleanup-test.cjs — R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1.
 *
 * Sprawdza:
 *  1. gra/data/diplomacy-tick-params.json NIE zawiera martwego pola p6.kryzysTurDoWojny ani jego _uwagi;
 *  2. N hamulca wojny pochodzi z profilu: po rozlozeniu p6 z JSON i jawnym N (jak w main.ts)
 *     wyzwolenie wojny nastepuje dokladnie w N-tej turze kryzysu, dla N z profilu (4 i 7);
 *  3. Civpedia (docs/encyklopedia/pojecia/wypowiedzenie-wojny.md) opisuje: w wojnie Zaufanie tkwi na zerze,
 *     licznik kryzysu nie liczy, liczba tur zalezy od profilu; NIE podaje stalego N = 6 / „6 tur”;
 *  4. ten sam tekst jest w bundlu Civpedii (gra/src/data/wikiBundle.json, wygenerowany narzedziem).
 * Run: node tools/diplo-trust-war-n6-cleanup-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..');
const SRC = fs.readFileSync(path.resolve(ROOT, 'src', 'game', 'diplomacy-tick-war-brake.ts'), 'utf8');
const MAIN = fs.readFileSync(path.resolve(ROOT, 'src', 'main.ts'), 'utf8');
const PARAMS = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'data', 'diplomacy-tick-params.json'), 'utf8'));
const WIKI_MD = fs.readFileSync(path.resolve(REPO, 'docs', 'encyklopedia', 'pojecia', 'wypowiedzenie-wojny.md'), 'utf8');
const BUNDLE = fs.readFileSync(path.resolve(ROOT, 'src', 'data', 'wikiBundle.json'), 'utf8');

let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) pass++;
  else { fail++; console.log('FAIL ' + name); }
}

function loadModule(source) {
  const out = esbuild.buildSync({
    stdin: { contents: source, loader: 'ts', resolveDir: ROOT },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', out.outputFiles[0].text)(m, m.exports);
  return m.exports;
}

// 1. JSON bez martwego pola
check('1a: p6 nie ma kryzysTurDoWojny', !('kryzysTurDoWojny' in PARAMS.p6));
check('1b: p6 nie ma _uwagaKryzysTurDoWojny', !('_uwagaKryzysTurDoWojny' in PARAMS.p6));
check('1c: p6 zachowuje kryzysProgZaufania i kryzysOstrzezenieTurPrzed',
  PARAMS.p6.kryzysProgZaufania === 0 && PARAMS.p6.kryzysOstrzezenieTurPrzed === 2);
check('1d: main.ts podaje N z profilu jawnie (diploTickP6 + kryzysTurDoWojny: w.n)',
  MAIN.includes('{ ...diploTickP6, kryzysTurDoWojny: w.n }'));

// 2. N z profilu wygrywa: wojna dokladnie w N-tej turze, dla N=4 i N=7
const M = loadModule(SRC);
function warTurn(n) {
  // jak main.ts: { ...diploTickP6, kryzysTurDoWojny: w.n }
  const p = { ...PARAMS.p6, kryzysTurDoWojny: n };
  let cs = { counter: 0, warningActive: false, warTriggerReady: false };
  for (let t = 1; t <= 20; t++) {
    cs = M.crisisStepForPair(cs.counter, 0, false, p);
    if (cs.warTriggerReady) return t;
  }
  return null;
}
check('2a: N=4 z profilu -> wojna w 4. turze', warTurn(4) === 4);
check('2b: N=7 z profilu -> wojna w 7. turze', warTurn(7) === 7);

// 3. Civpedia: tekst o zerowym Zaufaniu w wojnie, bez stalego N
check('3a: Civpedia: w wojnie Zaufanie tkwi na zerze', /Zaufanie pary \*\*tkwi na zerze\*\*/.test(WIKI_MD));
check('3b: Civpedia: licznik kryzysu nie liczy w wojnie', /licznik kryzysu nie liczy/.test(WIKI_MD));
check('3c: Civpedia: liczba tur zalezy od profilu (od 3 do 7)', WIKI_MD.includes('od 3 do 7'));
check('3d: Civpedia: brak stalego N = 6', !/N\s*=\s*6/.test(WIKI_MD) && !/N=6/.test(WIKI_MD));
check('3e: Civpedia: brak „6 tur”', !/\b6 tur/.test(WIKI_MD));

// 4. bundle Civpedii zawiera to samo sformulowanie
check('4a: wikiBundle zawiera „tkwi na **zerze**”', BUNDLE.includes('Zaufanie pary **tkwi na zerze**'));
check('4b: wikiBundle bez stalego N = 6', !/N\s*=\s*6/.test(BUNDLE) && !/N=6/.test(BUNDLE));

console.log('');
console.log('diplo-trust-war-n6-cleanup-test: ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail === 0 ? 0 : 1);
