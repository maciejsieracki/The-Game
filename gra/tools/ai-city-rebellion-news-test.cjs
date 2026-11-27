'use strict';
/**
 * ai-city-rebellion-news-test.cjs — R-WEB-AI-REBEL-WORLD-NEWS-Q1.
 * Bunt miasta AI (nowe gry) dodaje wpis do TRWAŁEJ listy „Wydarzenia na świecie” w oknie dyplomacji,
 * widoczny tylko gdy właściciel miasta jest odkryty (ten sam predykat co dla wojen/pokojów AI).
 *
 * CZĘŚĆ A (behawioralna): moduł czysty src/game/diplo-world-news.ts (esbuild bundle):
 *   - worldDiploNewsRebellionEntry: wpis z newsKind 'rebelia', widoczność (nieznany właściciel → null),
 *   - worldDiploNewsPush: dedup i przycięcie listy,
 *   - round-trip zapisu: stary zapis bez wpisu się wczytuje; nowy zapis z 'rebelia' wczytuje się
 *     (worldDiploNewsSanitize) i zachowuje rodzaj; wpis z nieznanym rodzajem jest pomijany.
 * CZĘŚĆ B (źródłowa): main.ts — recordAiCityRebellionNews (jedyne miejsce wołane przy buntie AI)
 *   dopisuje wpis do worldDiploNewsList przed dziennikiem; diploListHud renderuje klasę rodzaju.
 *   Usunięcie dopisania → test CZERWONY.
 *
 * Run z gra/:  node tools/ai-city-rebellion-news-test.cjs
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
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-city-rebellion-news-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(path.join(SRC, 'game', 'diplo-world-news'))};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts' }, absWorkingDir: GRA, logLevel: 'error' });
const M = require(bundle);

function mkRebel(over) {
  return M.worldDiploNewsRebellionEntry(Object.assign({
    cityName: 'Hattusa', cityId: 'c-17', ownerId: 3, ownerLabel: 'Hetyci', turn: 88,
    discovered: new Set([3]),
  }, over));
}

console.log('CZĘŚĆ A — wpis o buncie (worldDiploNewsRebellionEntry)');
const e1 = mkRebel({});
ok(e1 !== null, 'właściciel odkryty → wpis powstaje');
ok(e1 && e1.newsKind === 'rebelia', "newsKind = 'rebelia'");
ok(e1 && e1.title === 'Bunt miasta: Hattusa', 'tytuł zawiera nazwę miasta');
ok(e1 && e1.subtitle === 'Miasto Hetyci zbuntowało się i ogłosiło niepodległość', 'treść jednym zdaniem z nazwą cywilizacji');
ok(e1 && e1.kind === 'diplo' && e1.turnCreated === 88 && e1.icon === '⚑', 'kind diplo, tura, ikona');
ok(e1 && e1.id === 'ai-city-rebel-world-88-c-17', 'id = tura + miasto (dedup)');
ok(mkRebel({ discovered: new Set([1, 2]) }) === null, 'właściciel nieodkryty (filtr widoczności) → brak wpisu');
ok(mkRebel({ discovered: new Set() }) === null, 'pusty zbiór odkrytych → brak wpisu');

console.log('CZĘŚĆ A — trwała lista (worldDiploNewsPush) i przycięcie');
const L1 = M.worldDiploNewsPush([], e1);
ok(L1.length === 1 && L1[0].newsKind === 'rebelia', 'wpis trafia na listę');
const L2 = M.worldDiploNewsPush(L1, e1);
ok(L2.length === 1, 'powtórne dopisanie tego samego id nie duplikuje');
let big = [];
for (let i = 0; i < M.WORLD_DIPLO_NEWS_MAX + 5; i++) big = M.worldDiploNewsPush(big, mkRebel({ turn: i, cityId: 'x' + i }));
ok(big.length === M.WORLD_DIPLO_NEWS_MAX, 'lista przycięta do WORLD_DIPLO_NEWS_MAX');

console.log('CZĘŚĆ A — round-trip zapisu (worldDiploNewsSanitize)');
const legacy = [{ id: 'ai-diplo-news-1-1-2-wojna', icon: '⚔', title: 'Wojna: A i B', subtitle: 's', kind: 'diplo', turnCreated: 1, a: 1, b: 2, newsKind: 'wojna' }];
ok(M.worldDiploNewsSanitize(legacy).length === 1, 'stary zapis (bez rebelii) wczytuje się bez zmian');
ok(M.worldDiploNewsSanitize(undefined).length === 0, 'brak pola w zapisie → pusta lista');
const saved = JSON.parse(JSON.stringify(L1));
const loaded = M.worldDiploNewsSanitize(saved);
ok(loaded.length === 1 && loaded[0].newsKind === 'rebelia' && loaded[0].title === 'Bunt miasta: Hattusa', 'nowy zapis z rebelią wczytuje się i zachowuje rodzaj');
ok(M.worldDiploNewsSanitize([{ ...saved[0], newsKind: 'nieznany' }]).length === 0, 'nieznany rodzaj jest pomijany (bez wywrócenia listy)');

console.log('CZĘŚĆ A — tryb zgodności: istniejące decyzje wojen/pokojów bez zmian');
ok(M.worldDiploNewsKind('neutralni', 'wojna') === 'wojna', 'worldDiploNewsKind nie zmieniony (wojna)');
ok(M.worldDiploNewsKind('wojna', 'pokoj') === 'pokoj', 'worldDiploNewsKind nie zmieniony (pokój)');

console.log('CZĘŚĆ B — źródło (main.ts, diploListHud.ts)');
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const hudSrc = fs.readFileSync(path.join(SRC, 'ui', 'diploListHud.ts'), 'utf8');
const startIdx = mainSrc.indexOf('function recordAiCityRebellionNews(');
const endIdx = mainSrc.indexOf('function logPeaceVazne(', startIdx);
const recBody = startIdx >= 0 && endIdx > startIdx ? mainSrc.slice(startIdx, endIdx) : '';
ok(recBody.length > 0, 'znaleziono recordAiCityRebellionNews');
ok(/worldDiploNewsRebellionEntry\(\{/.test(recBody), 'recordAiCityRebellionNews buduje wpis przez worldDiploNewsRebellionEntry');
ok(/if \(worldEntry !== null\) worldDiploNewsList = worldDiploNewsPush\(worldDiploNewsList, worldEntry\);/.test(recBody), 'wpis trafia do TRWAŁEJ listy (worldDiploNewsPush) — mutacja: usunięcie = CZERWONY');
ok(recBody.indexOf('worldDiploNewsPush') < recBody.indexOf('warEventLog.some'), 'dopisanie do trwałej listy przed dziennikiem (dziennik nie zastępuje listy)');
ok(/if \(!getDiplomaticContacts\(\)\.has\(prevOwnerId\)\) return;/.test(recBody), 'bramka odkrycia właściciela zachowana');
ok(/ai-city-rebel-world-/.test(fs.readFileSync(path.join(SRC, 'game', 'diplo-world-news.ts'), 'utf8')), 'id wpisu listy odróżnione od dziennika');
ok(/dl-wn-' \+ n\.newsKind/.test(hudSrc), 'diploListHud renderuje rodzaj wpisu (klasa dl-wn-<rodzaj>)');

console.log(failed === 0 ? `\nWYNIK: PASS ${passed}/0` : `\nWYNIK: ${passed}/${failed}`);
process.exit(failed === 0 ? 0 : 1);
