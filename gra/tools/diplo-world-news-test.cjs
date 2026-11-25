'use strict';
/**
 * diplo-world-news-test.cjs — R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1.
 * Gracz widzi w dzienniku Wydarzeń wojnę / pokój między DWIEMA cywilizacjami AI, gdy ma odkryte obie.
 *
 * CZĘŚĆ A (behawioralna, wykonanie): moduł czysty src/game/diplo-world-news.ts (esbuild bundle).
 *   Funkcja worldDiploNewsEntry — ta sama, którą woła main.ts — jest WYKONYWANA na danych:
 *   - rodzaj zmiany statusu (any→wojna = wojna; wojna→pokoj/neutralni = pokój; wojna→sojusz = sojusz;
 *     brak zmiany / pokój→neutralni bez wojny = null),
 *   - widoczność: wpis tylko gdy OBIE cywilizacje pary są w zbiorze odkrytych (brak przecieku),
 *   - pominięcie pary z graczem / barbarzyńcą (skip) → null,
 *   - treść wpisu: id = tura + para + rodzaj (dedup), tytuł z nazwami cywilizacji, ikona, kind 'diplo'.
 * CZĘŚĆ B (źródłowa): main.ts — jedyny punkt zmiany statusu (setDiploRelation) woła
 *   recordAiAiWarPeaceNews, która przekazuje do worldDiploNewsEntry bramki isMe/isBarbarian
 *   i getDiplomaticContacts(), a następnie robi dedup po id i unshift do warEventLog.
 *   Cofnięcie hooka lub bramki w main.ts → test CZERWONY.
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

// ---- CZĘŚĆ A: moduł czysty (wykonanie) ----
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'diplo-world-news-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(path.join(SRC, 'game', 'diplo-world-news'))};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts' }, absWorkingDir: GRA, logLevel: 'error' });
const M = require(bundle);

const ALL = new Set([1, 2, 3]);
/** Pomocnik: wpis dla pary (a,b) przy zmianie prev→next, odkrytych ALL, bez pominięcia. */
function mk(over) {
  return M.worldDiploNewsEntry(Object.assign({
    a: 1, b: 2, prevStatus: 'neutralni', nextStatus: 'wojna', turn: 40, pairKey: '1-2',
    labelA: 'Alfa', labelB: 'Beta', discovered: ALL, skip: false,
  }, over));
}

console.log('CZĘŚĆ A — rodzaj zmiany statusu (funkcja worldDiploNewsKind)');
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

console.log('CZĘŚĆ A — widoczność („obie odkryte”, worldDiploNewsVisible)');
const discovered = new Set([1, 2, 3]);
ok(M.worldDiploNewsVisible(1, 2, discovered) === true, 'obie odkryte → widoczne');
ok(M.worldDiploNewsVisible(1, 4, discovered) === false, 'jedna nieodkryta (4) → NIEwidoczne');
ok(M.worldDiploNewsVisible(4, 5, discovered) === false, 'obie nieodkryte → NIEwidoczne');
ok(M.worldDiploNewsVisible(3, 2, new Set()) === false, 'brak odkrytych → NIEwidoczne');

console.log('CZĘŚĆ A — wykonanie worldDiploNewsEntry (wpis dla gracza-obserwatora)');
const e1 = mk({});
ok(e1 !== null, 'obie odkryte, neutralni→wojna → wpis powstaje');
ok(e1 && e1.id === 'ai-diplo-news-40-1-2-wojna', 'id = tura + para + rodzaj (dedup w turze)');
ok(e1 && e1.kind === 'diplo' && e1.turnCreated === 40, 'kind=diplo, turnCreated = tura');
ok(e1 && e1.title === 'Wojna: Alfa i Beta', 'tytuł wojny zawiera obie nazwy cywilizacji');
ok(e1 && e1.icon === '⚔', 'ikona wojny');
const ePeace = mk({ prevStatus: 'wojna', nextStatus: 'pokoj' });
ok(ePeace && ePeace.title === 'Pokój: Alfa i Beta' && ePeace.id === 'ai-diplo-news-40-1-2-pokoj', 'wojna→pokoj: wpis pokoju, id z rodzajem pokoj');
ok(ePeace && ePeace.icon === '☮', 'ikona pokoju');
const eAlly = mk({ prevStatus: 'wojna', nextStatus: 'sojusz' });
ok(eAlly && eAlly.title === 'Sojusz: Alfa i Beta', 'wojna→sojusz: wpis sojuszu po wojnie');
ok(mk({ prevStatus: 'wojna', nextStatus: 'wojna' }) === null, 'brak zmiany statusu → brak wpisu');
ok(mk({ discovered: new Set([1]) }) === null, 'jedna strona nieodkryta (b=2) → BRAK wpisu (brak przecieku)');
ok(mk({ discovered: new Set([2]) }) === null, 'jedna strona nieodkryta (a=1) → BRAK wpisu');
ok(mk({ discovered: new Set() }) === null, 'obie nieodkryte → BRAK wpisu');
ok(mk({ skip: true }) === null, 'para z graczem / barbarzyńcą (skip) → BRAK wpisu (brak duplikatu)');
const eTurn41 = mk({ turn: 41 });
ok(eTurn41 && eTurn41.id !== e1.id, 'inna tura → inne id (dedup tylko w obrębie tury)');
const eOtherPair = mk({ pairKey: '1-3', b: 3, discovered: ALL });
ok(eOtherPair && eOtherPair.id !== e1.id, 'inna para → inne id');

// ---- CZĘŚĆ B: źródło main.ts ----
// ---- CZĘŚĆ A2 (R-WEB-DIPLO-WORLD-NEWS-IN-DIPLOMACY-WINDOW-Q1): trwała lista w oknie dyplomacji ----
console.log('CZĘŚĆ A2 — rozejm vs pokój (truce) i trwała lista');
const eTruce = mk({ prevStatus: 'wojna', nextStatus: 'pokoj', truce: true });
ok(eTruce && eTruce.title === 'Rozejm: Alfa i Beta' && eTruce.newsKind === 'rozejm', 'wojna→pokoj z truce = „Rozejm”, newsKind rozejm');
ok(ePeace && ePeace.newsKind === 'pokoj' && ePeace.title.startsWith('Pokój:'), 'wojna→pokoj bez truce = „Pokój”, newsKind pokoj');
ok(e1 && e1.a === 1 && e1.b === 2 && e1.newsKind === 'wojna', 'wpis niesie strony pary (a,b) i newsKind wojna');
ok(eAlly && eAlly.newsKind === 'sojusz', 'sojusz: newsKind sojusz');

const mkList = (n) => Array.from({ length: n }, (_, i) => mk({ turn: 100 + i, pairKey: '1-2' }));
let lst = [];
for (const e of mkList(3)) lst = M.worldDiploNewsPush(lst, e);
ok(lst.length === 3 && lst[0].turnCreated === 102, 'push: najnowszy wpis na początku listy');
const dup = M.worldDiploNewsPush(lst, lst[0]);
ok(dup.length === 3, 'push: duplikat id nie dubluje wpisu');
let big = [];
for (let i = 0; i < 30; i++) big = M.worldDiploNewsPush(big, mk({ turn: i, pairKey: '1-2' }));
ok(big.length === M.WORLD_DIPLO_NEWS_MAX && M.WORLD_DIPLO_NEWS_MAX === 20, 'lista przycinana do 20 ostatnich wpisów');
ok(big[0].turnCreated === 29 && big[19].turnCreated === 10, 'przycięcie zachowuje najnowsze (tury 29…10)');
const orig = lst.slice();
M.worldDiploNewsPush(lst, mk({ turn: 999 }));
ok(lst.length === orig.length && lst.every((e, i) => e === orig[i]), 'push nie modyfikuje wejściowej tablicy');

const visList = M.worldDiploNewsVisibleList([mk({ turn: 1 }), mk({ turn: 2, discovered: ALL }), { ...mk({ turn: 3 }), a: 1, b: 9 }], new Set([1, 2, 3]));
ok(visList.length === 2 && visList.every(e => e.b === 2), 'widok listy: pozycja z nieodkrytą stroną (b=9) ukryta przy wyświetlaniu');
const hidden = M.worldDiploNewsVisibleList([{ ...mk({ turn: 5 }), a: 4, b: 5 }], ALL);
ok(hidden.length === 0, 'wpis dwóch nieodkrytych cywilizacji nie trafia na listę');

console.log('CZĘŚĆ A2 — zapis/wczytanie (worldDiploNewsSanitize)');
ok(Array.isArray(M.worldDiploNewsSanitize(undefined)) && M.worldDiploNewsSanitize(undefined).length === 0, 'brak pola w starym zapisie → pusta lista');
ok(M.worldDiploNewsSanitize('zły typ').length === 0 && M.worldDiploNewsSanitize({}).length === 0, 'zły typ → pusta lista');
const roundTrip = JSON.parse(JSON.stringify(lst));
const back = M.worldDiploNewsSanitize(roundTrip);
ok(back.length === lst.length && back.every((e, i) => e.id === lst[i].id && e.title === lst[i].title && e.newsKind === lst[i].newsKind && e.a === lst[i].a && e.b === lst[i].b), 'round-trip JSON zachowuje listę 1:1');
const cut = M.worldDiploNewsSanitize([...roundTrip, { id: 'x' }, null, 7, { ...roundTrip[0], newsKind: 'zle' }]);
ok(cut.length === lst.length, 'niepełne / błędne pozycje pomijane');
ok(M.worldDiploNewsSanitize(big.concat(big)).length === 20, 'odczyt przycina do 20 pozycji');

console.log('CZĘŚĆ B — hook w main.ts (setDiploRelation → recordAiAiWarPeaceNews)');
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const fnStart = mainSrc.indexOf('function setDiploRelation(a: number, b: number, rel: Relation, newsOpts?: { truce?: boolean }): void {');
const fnEnd = fnStart < 0 ? -1 : mainSrc.indexOf('\n    }\n', fnStart);
const setBody = fnStart < 0 || fnEnd < 0 ? '' : mainSrc.slice(fnStart, fnEnd);
ok(fnStart >= 0, 'setDiploRelation istnieje');
ok(/prevStatus !== undefined && prevStatus !== rel\.status\)\s*\{\s*recordAiAiWarPeaceNews\(a, b, prevStatus, rel\.status, /.test(setBody),
  'setDiploRelation woła recordAiAiWarPeaceNews przy realnej zmianie statusu');
ok(/prevStatus !== undefined && prevStatus !== rel\.status\)\s*\{\s*recordAiAiWarPeaceNews\(a, b, prevStatus, rel\.status, newsOpts\?\.truce === true\)/.test(setBody),
  'setDiploRelation przekazuje flagę rozejmu (newsOpts.truce) do hooka');
ok(/function setDiploRelation\(a: number, b: number, rel: Relation, newsOpts\?: \{ truce\?: boolean \}\): void \{/.test(mainSrc),
  'setDiploRelation przyjmuje opcjonalny newsOpts (rozejm)');
ok(/setDiploRelation\(proposerId, responderId, \{ \.\.\.cur, status: 'pokoj' \}, \{ truce: true \}\);/.test(mainSrc),
  'akceptacja rozejmu (gałąź isTruce) woła setDiploRelation z { truce: true }');

const recStart = mainSrc.indexOf('function recordAiAiWarPeaceNews(');
const recEnd = recStart < 0 ? -1 : mainSrc.indexOf('\n    }\n', recStart);
const recBody = recStart < 0 || recEnd < 0 ? '' : mainSrc.slice(recStart, recEnd);
ok(recStart >= 0, 'recordAiAiWarPeaceNews istnieje');
ok(/worldDiploNewsEntry\(\{/.test(recBody), 'używa worldDiploNewsEntry (ta sama funkcja, którą wykonuje część A)');
ok(/skip: isMe\(a\) \|\| isMe\(b\) \|\| isBarbarian\(a\) \|\| isBarbarian\(b\)/.test(recBody), 'przekazuje bramkę: pomija parę z graczem i barbarzyńców');
ok(/discovered: getDiplomaticContacts\(\)/.test(recBody), 'widoczność: zbiór odkrytych z getDiplomaticContacts');
ok(/pairKey: diploPairKey\(a, b\)/.test(recBody), 'klucz pary z diploPairKey (część id)');
ok(/if \(entry === null\) return;/.test(recBody), 'brak wpisu dla null (brak wpisu w trwałej liście)');
ok(/worldDiploNewsList = worldDiploNewsPush\(worldDiploNewsList, entry\);/.test(recBody), 'wpis trafia do TRWAŁEJ listy (worldDiploNewsPush) niezależnie od dziennika');
ok(/if \(warEventLog\.some\(e => e\.id === entry\.id\)\) return;/.test(recBody), 'dedup po id w dzienniku Wydarzeń przed unshift');
ok(/let worldDiploNewsList: WorldDiploNewsEntry\[\] = \[\];/.test(mainSrc), 'trwała lista zadeklarowana w main.ts');
ok((mainSrc.match(/worldDiploNewsList = \[\];/g) || []).length >= 1, 'nowa gra czyści trwałą listę');
ok(/worldDiploNews: worldDiploNewsList\.map/.test(mainSrc), 'zapis: lista w meta save');
ok(/worldDiploNewsList = worldDiploNewsSanitize\(saved\.meta\?\.worldDiploNews\);/.test(mainSrc), 'wczytanie: migracja przez worldDiploNewsSanitize (brak pola = pusta)');
ok(/getWorldNews: \(\) => worldDiploNewsVisibleList\(worldDiploNewsList, getDiplomaticContacts\(\)\)/.test(mainSrc), 'okno dyplomacji dostaje listę przefiltrowaną po odkryciu');
const hudSrc = fs.readFileSync(path.join(SRC, 'ui', 'diploListHud.ts'), 'utf8');
ok(/config\.getWorldNews\?\.\(\)/.test(hudSrc) && /'Wydarzenia na świecie'/.test(hudSrc), 'okno dyplomacji renderuje sekcję „Wydarzenia na świecie”');
ok(/const worldNews = listFilter === 'all' \? \(config\.getWorldNews\?\.\(\) \?\? \[\]\) : \[\];/.test(hudSrc), 'sekcja „Wydarzenia na świecie” tylko w widoku „Dyplomacja” (listFilter === \'all\'), nie w filtrze „Wojna”');
ok(/warEventLog\.unshift\(entry\);/.test(recBody) && /trimWarEventLog\(\);/.test(recBody), 'wpis do warEventLog + przycięcie dziennika');
ok(mainSrc.includes("from './game/diplo-world-news'") && mainSrc.includes('worldDiploNewsEntry'), 'main.ts importuje worldDiploNewsEntry');

console.log(failed === 0 ? `\nWYNIK: PASS ${passed}/0` : `\nWYNIK: ${passed}/${failed}`);
process.exit(failed === 0 ? 0 : 1);
