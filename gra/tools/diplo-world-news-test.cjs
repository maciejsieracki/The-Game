'use strict';
/**
 * diplo-world-news-test.cjs — R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1.
 * Gracz widzi w dzienniku Wydarzeń wojnę / pokój między DWIEMA cywilizacjami AI, gdy ma odkryte obie.
 *
 * CZĘŚĆ A (behawioralna): moduł czysty src/game/diplo-world-news.ts (esbuild bundle):
 *   - rodzaj zmiany statusu (any→wojna = wojna; wojna→pokoj/neutralni = pokój; wojna→sojusz = sojusz;
 *     brak zmiany / pokój→rozejm-stan = null),
 *   - widoczność: tylko gdy OBIE cywilizacje pary są w zbiorze odkrytych (brak przecieku).
 * CZĘŚĆ B (źródłowa, mutacyjna): main.ts — jedyny punkt zmiany statusu (setDiploRelation) woła
 *   recordAiAiWarPeaceNews; funkcja ma bramki: pomija parę z graczem (isMe), barbarzyńców,
 *   nieodkrytą stronę; id wpisu zawiera turę + parę + rodzaj (brak duplikatów w turze).
 *   Cofnięcie hooka lub bramki → test CZERWONY.
 *
 * Run z gra/:  node tools/diplo-world-news-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

// ---- CZĘŚĆ A: moduł czysty ----
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'diplo-world-news-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(path.join(SRC, 'game', 'diplo-world-news'))};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts' }, absWorkingDir: GRA, logLevel: 'error' });
const M = require(bundle);

console.log('CZĘŚĆ A — rodzaj zmiany statusu');
ok(M.worldDiploNewsKind('neutralni', 'wojna') === 'wojna', 'neutralni→wojna = wojna');
ok(M.worldDiploNewsKind('pokoj', 'wojna') === 'wojna', 'pokój→wojna (wypowiedzenie / koniec rozejmu) = wojna');
ok(M.worldDiploNewsKind('sojusz', 'wojna') === 'wojna', 'sojusz→wojna = wojna');
ok(M.worldDiploNewsKind('wojna', 'pokoj') === 'pokoj', 'wojna→pokoj = pokój (w tym pokój wymuszony i rozejm)');
ok(M.worldDiploNewsKind('wojna', 'neutralni') === 'pokoj', 'wojna→neutralni = pokój (koniec wojny)');
ok(M.worldDiploNewsKind('wojna', 'sojusz') === 'sojusz', 'wojna→sojusz = sojusz');
ok(M.worldDiploNewsKind('pokoj', 'neutralni') === null, 'pokój→neutralni bez wojny = brak wpisu');
ok(M.worldDiploNewsKind('pokoj', 'sojusz') === null, 'pokój→sojusz bez wojny = brak wpisu');
ok(M.worldDiploNewsKind('wojna', 'wojna') === null, 'wojna→wojna (brak zmiany) = brak wpisu');
ok(M.worldDiploNewsKind(undefined, 'wojna') === null, 'brak poprzedniego statusu = brak wpisu (pierwsze ustawienie)');

console.log('CZĘŚĆ A — widoczność („obie odkryte”)');
const discovered = new Set([1, 2, 3]);
ok(M.worldDiploNewsVisible(1, 2, discovered) === true, 'obie odkryte → widoczne');
ok(M.worldDiploNewsVisible(1, 4, discovered) === false, 'jedna nieodkryta (4) → NIEwidoczne');
ok(M.worldDiploNewsVisible(4, 5, discovered) === false, 'obie nieodkryte → NIEwidoczne');
ok(M.worldDiploNewsVisible(3, 2, new Set()) === false, 'brak odkrytych → NIEwidoczne');

// ---- CZĘŚĆ B: źródło main.ts ----
console.log('CZĘŚĆ B — hook w main.ts (setDiploRelation)');
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const fnStart = mainSrc.indexOf('function setDiploRelation(a: number, b: number, rel: Relation): void {');
const fnEnd = fnStart < 0 ? -1 : mainSrc.indexOf('\n    }\n', fnStart);
const setBody = fnStart < 0 || fnEnd < 0 ? '' : mainSrc.slice(fnStart, fnEnd);
ok(fnStart >= 0, 'setDiploRelation istnieje');
ok(/prevStatus !== undefined && prevStatus !== rel\.status\)\s*recordAiAiWarPeaceNews\(a, b, prevStatus, rel\.status\)/.test(setBody),
  'setDiploRelation woła recordAiAiWarPeaceNews przy realnej zmianie statusu');

const recStart = mainSrc.indexOf('function recordAiAiWarPeaceNews(');
const recEnd = recStart < 0 ? -1 : mainSrc.indexOf('\n    }\n', recStart);
const recBody = recStart < 0 || recEnd < 0 ? '' : mainSrc.slice(recStart, recEnd);
ok(recStart >= 0, 'recordAiAiWarPeaceNews istnieje');
ok(/worldDiploNewsKind\(prevStatus, nextStatus\)/.test(recBody), 'używa worldDiploNewsKind');
ok(/if \(isMe\(a\) \|\| isMe\(b\)\) return;/.test(recBody), 'pomija parę z graczem (brak duplikatu)');
ok(/isBarbarian\(a\) \|\| isBarbarian\(b\)\) return;/.test(recBody), 'pomija barbarzyńców');
ok(/worldDiploNewsVisible\(a, b, getDiplomaticContacts\(\)\)/.test(recBody), 'widoczność: obie strony odkryte (getDiplomaticContacts)');
ok(/ai-diplo-news-\$\{turn\}-\$\{diploPairKey\(a, b\)\}-\$\{kind\}/.test(recBody), 'id wpisu: tura + para + rodzaj (dedup w turze)');
ok(/warEventLog\.some\(e => e\.id === evId\)\) return;/.test(recBody), 'dedup po id przed unshift');
ok(/warEventLog\.unshift\(\{/.test(recBody) && /trimWarEventLog\(\);/.test(recBody), 'wpis do warEventLog + przycięcie dziennika');

const imp = mainSrc.includes("from './game/diplo-world-news'") && mainSrc.includes('worldDiploNewsVisible');
ok(imp, 'main.ts importuje moduł diplo-world-news');

console.log(failed === 0 ? `\nWYNIK: PASS ${passed}/0` : `\nWYNIK: ${passed}/${failed}`);
process.exit(failed === 0 ? 0 : 1);
