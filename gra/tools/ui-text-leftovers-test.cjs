'use strict';
/**
 * ui-text-leftovers-test.cjs
 *
 * TEMAT: R-WEB-UI-TEXT-LEFTOVERS-ADMIN-DISMISS-CIVPEDIA-Q1 (Operator, runda 1).
 * Statyczny test bez przeglądarki:
 *  (A) tekst okna potwierdzenia zwolnienia (administratorDismissConfirmText) używa TEGO SAMEGO
 *      rzeczownika co nagłówek panelu (titleFor) — dla administratora miasta („miasta”) i
 *      administratora ulepszeń/państwa (nagłówek „Administrator państwa”, tekst „państwa”);
 *  (B) w wikiBundle.json (Civpedia) i w docs/encyklopedia nie ma wyrażenia „jeszcze niewdrożone”
 *      (reguły z decyzji 2026-11-13 są wdrożone — patrz docs/encyklopedia/pojecia/zaufanie.md);
 *  (C) wikiBundle.json zawiera zaktualizowany nagłówek hasła Zaufanie (regeneracja narzędziem).
 *
 * Argumenty (opcjonalne, do dowodu „czerwony na bazie”):
 *   node tools/ui-text-leftovers-test.cjs [administratorPanel.ts] [wikiBundle.json] [zaufanie.md]
 * Uruchomienie (z gra/): node tools/ui-text-leftovers-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const ROOT = path.resolve(GRA, '..');
const PANEL = process.argv[2] ? path.resolve(process.argv[2]) : path.join(GRA, 'src', 'ui', 'administratorPanel.ts');
const BUNDLE = process.argv[3] ? path.resolve(process.argv[3]) : path.join(GRA, 'src', 'data', 'wikiBundle.json');
const ZAUFANIE = process.argv[4] ? path.resolve(process.argv[4]) : path.join(ROOT, 'docs', 'encyklopedia', 'pojecia', 'zaufanie.md');
const ENCY_DIR = path.join(ROOT, 'docs', 'encyklopedia');

const BANNED = 'jeszcze niewdrożone';
const failures = [];
const ok = (name, cond, detail) => {
  if (cond) console.log('PASS: ' + name);
  else { failures.push(name); console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
};

// ---- (A) nagłówek vs tekst potwierdzenia ----
const src = fs.readFileSync(PANEL, 'utf8');
const titleFn = (src.match(/function titleFor\([\s\S]*?\n\}/) || [''])[0];
const confirmFn = (src.match(/export function administratorDismissConfirmText[\s\S]*?\n\}/) || [''])[0];

// nagłówek: „Administrator miasta” dla city, „Administrator państwa” dla pozostałych
const headerCity = (titleFn.match(/'(Administrator [^']+)'\s*:\s*'(Administrator [^']+)'/) || []);
const headerCityTxt = headerCity[1] || null;
const headerOtherTxt = headerCity[2] || null;
// tekst: `const what = m.kind === 'city' ? 'X' : 'Y';`
const whatM = confirmFn.match(/const what = m\.kind === 'city' \? '([^']+)' : '([^']+)';/);
const confirmCityNoun = whatM ? whatM[1] : null;
const confirmOtherNoun = whatM ? whatM[2] : null;

ok('A0: nagłówek panelu (titleFor) czytelny: city/other', !!headerCityTxt && !!headerOtherTxt, { headerCityTxt, headerOtherTxt });
ok('A0: tekst potwierdzenia ma rozróżnienie city/other', !!whatM, whatM && whatM[0]);
if (headerCityTxt && whatM) {
  ok('A1: administrator miasta — nagłówek i tekst mówią to samo', headerCityTxt.replace(/^Administrator /, '') === confirmCityNoun,
    { header: headerCityTxt, confirm: confirmCityNoun });
}
if (headerOtherTxt && whatM) {
  ok('A2: administrator państwa/ulepszeń — nagłówek i tekst mówią to samo', headerOtherTxt.replace(/^Administrator /, '') === confirmOtherNoun,
    { header: headerOtherTxt, confirm: confirmOtherNoun });
  ok('A3: tekst potwierdzenia dla państwa nie mówi „ulepszeń”', !/ulepszeń/.test(confirmOtherNoun || ''), confirmOtherNoun);
}

// ---- (B) brak „jeszcze niewdrożone” w bundlu i w encyklopedii ----
// B1 dotyczy HASEŁ Civpedii (sekcja `encyklopedia` wikiBundle). Zdanie w poradniku (sekcja `poradnik`,
// źródło docs/PORADNIK-GRACZA/12-dyplomacja.md) leży poza allowlistą tematu i jest zgłoszone w raporcie.
const bundleTxt = fs.readFileSync(BUNDLE, 'utf8');
let bundleEnc = null;
try { bundleEnc = JSON.parse(bundleTxt).encyklopedia; } catch (e) { bundleEnc = null; }
ok('B1: sekcja encyklopedia wikiBundle.json bez „' + BANNED + '”',
  Array.isArray(bundleEnc) && !JSON.stringify(bundleEnc).includes(BANNED),
  Array.isArray(bundleEnc) ? (JSON.stringify(bundleEnc).match(new RegExp('.{0,60}' + BANNED + '.{0,20}')) || [null])[0] : 'brak sekcji');

const zaufTxt = fs.readFileSync(ZAUFANIE, 'utf8');
ok('B2: zaufanie.md bez „' + BANNED + '”', !zaufTxt.includes(BANNED));

const hits = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md') && fs.readFileSync(p, 'utf8').includes(BANNED)) hits.push(path.relative(ROOT, p));
  }
};
if (fs.existsSync(ENCY_DIR)) walk(ENCY_DIR);
ok('B3: docs/encyklopedia bez „' + BANNED + '”', hits.length === 0, hits);

// ---- (C) bundle zsynchronizowany z hasłem ----
let bundle = null;
try { bundle = JSON.parse(bundleTxt); } catch (e) { bundle = null; }
ok('C0: wikiBundle.json parsuje się jako JSON', bundle !== null);
if (bundle) {
  const flat = JSON.stringify(bundle);
  ok('C1: bundle zawiera nowy nagłówek zasad Zaufania',
    flat.includes('Zasady z decyzji właściciela 2026-11-13 (wdrożone)'));
}

console.log(failures.length === 0 ? '== WSZYSTKO ZIELONE ==' : '== FAIL: ' + failures.length + ' ==');
process.exit(failures.length === 0 ? 0 : 1);
