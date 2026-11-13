'use strict';
/**
 * fishing-boats-666-test.cjs -- R-WEB-FISHING-BOATS-YIELD-6-6-6-Q1 (decyzja wlasciciela 2026-11-09)
 *
 * Ulepszenie „Łodzie rybackie” (lodzie_rybackie) daje +6 żywności, +6 Pracy, +6 podatku (klucz danych
 * `handel` = podatek; NIE zmieniamy nazwy klucza). Test sprawdza:
 *  (A) dane: gra/data/terrain-improvements.json bonus = {zywnosc:6, praca:6, handel:6}, epoka 1;
 *  (B) silnik: improvementBonusForKey(Kamień) = 6/6/6; Brąz/Żelazo = +1/+2 (skalowanie epoki, jak reszta);
 *  (C) silnik: tileYield (delta ulepszenia na heksie morza/wybrzeża) = dokładnie 6/6/6 w epoce Kamienia;
 *  (D) karta odkrycia Żegluga (gra/data/tech-cards-top5.json): tytuł, liczba i CMZ mówią +6/+6/+6,
 *      a w pliku nie ma już starych „+2 żywności, +3 Pracy” przy Łodzi rybackiej;
 *  (E) opisy: encyklopedia lodzie_rybackie.md, poradnik 28-katalog-ulepszen.md i wikiBundle.json
 *      mówią +6/+6/+6 (bez starych +2/+3).
 * Prawdziwe funkcje silnika (esbuild). Run: cd gra && node tools/fishing-boats-666-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const TMP = fs.mkdtempSync('/dev/shm/fishing-boats-666-');
const ENTRY = path.join(__dirname, '.fishing-boats-666-entry.ts');
const cleanup = () => {
  if (fs.existsSync(ENTRY)) fs.unlinkSync(ENTRY);
  fs.rmSync(TMP, { recursive: true, force: true });
};
process.on('exit', cleanup);

let passed = 0;
let failed = 0;
function ok(c, m) { if (c) { passed++; console.log('PASS:', m); } else { failed++; console.error('FAIL:', m); } }
function eq(a, e, m) { ok(JSON.stringify(a) === JSON.stringify(e), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(e)})`); }

fs.writeFileSync(ENTRY, `
export { improvementBonusForKey, improvementYieldForEra } from '../src/game/terrain-improvements';
export { tileYield } from '../src/game/economy';
`, 'utf8');
const BUNDLE = path.join(TMP, 'bundle.cjs');

(async () => {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
    plugins: [{ name: 'stub-brand', setup(b) {
      b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: path.join(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts') }));
    } }],
  });
  const M = require(BUNDLE);
  const data = require('../data/terrain-improvements.json');

  console.log('-- (A) dane terrain-improvements.json --');
  eq(data.lodzie_rybackie.bonus, { zywnosc: 6, praca: 6, handel: 6 }, 'lodzie_rybackie.bonus = 6/6/6 (handel = podatek)');
  eq(data.lodzie_rybackie.epoka, 1, 'lodzie_rybackie epoka 1 (Kamień) bez zmian');

  console.log('-- (B) improvementBonusForKey + skalowanie epoki --');
  eq(M.improvementBonusForKey('lodzie_rybackie', 1), { zywnosc: 6, praca: 6, handel: 6 }, 'Kamień = 6/6/6');
  eq(M.improvementBonusForKey('lodzie_rybackie'), { zywnosc: 6, praca: 6, handel: 6 }, 'brak epoki = Kamień = 6/6/6');
  eq(M.improvementBonusForKey('lodzie_rybackie', 2), { zywnosc: 7, praca: 7, handel: 7 }, 'Brąz = 7/7/7 (+1 za epokę)');
  eq(M.improvementBonusForKey('lodzie_rybackie', 3), { zywnosc: 8, praca: 8, handel: 8 }, 'Żelazo = 8/8/8 (+2 za epokę)');

  console.log('-- (C) tileYield na heksie z lodzie_rybackie (morze/wybrzeże) --');
  const SEA = { terenBazowy: 'morze', nakladka: 'brak', maRzeke: false };
  const base = M.tileYield({ ...SEA });
  const withBoats = (era) => M.tileYield({ ...SEA, ulepszeniaKeys: ['lodzie_rybackie'], ulepszenieKey: 'lodzie_rybackie', wlascicielEra: era });
  const delta = (era) => {
    const w = withBoats(era);
    return { zywnosc: w.zywnosc - base.zywnosc, praca: w.praca - base.praca, handel: w.handel - base.handel };
  };
  eq(delta(1), { zywnosc: 6, praca: 6, handel: 6 }, 'silnik: delta heksu Kamień = +6 żywn / +6 praca / +6 podatku');
  eq(delta(undefined), { zywnosc: 6, praca: 6, handel: 6 }, 'silnik: delta bez epoki właściciela = 6/6/6');
  eq(delta(2), { zywnosc: 7, praca: 7, handel: 7 }, 'silnik: delta Brąz = 7/7/7');
  eq(delta(3), { zywnosc: 8, praca: 8, handel: 8 }, 'silnik: delta Żelazo = 8/8/8');

  console.log('-- (D) karta odkrycia Żegluga (tech-cards-top5.json) --');
  const cards = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech-cards-top5.json'), 'utf8'));
  const zegluga = cards['Żegluga'];
  const top = zegluga.top5.find(t => /Łodzie rybackie/.test(t.tytul));
  ok(!!top, 'Żegluga: pozycja „Łodzie rybackie” istnieje na karcie');
  eq(top && top.tytul, 'Łodzie rybackie: +6 żywności, +6 Pracy, +6 podatku', 'tytuł karty Żegluga = +6/+6/+6');
  eq(top && top.liczba, '+6', 'liczba karty Żegluga = +6');
  const cmz = zegluga.cmz.find(c => /ławicy/.test(c.czynnosc));
  ok(!!cmz && /\(\+6 żywności, \+6 Pracy\)/.test(cmz.korzysc), 'CMZ Żegluga: „wykorzystać morze (+6 żywności, +6 Pracy)”');
  const cardsTxt = fs.readFileSync(path.join(GRA, 'data', 'tech-cards-top5.json'), 'utf8');
  ok(!/Łodzie rybackie[^"]*\+[23] (żywno|Prac|podat|handl)/.test(cardsTxt), 'tech-cards-top5.json: brak starych +2/+3 przy Łodzi rybackiej');

  console.log('-- (E) opisy: encyklopedia, poradnik, wikiBundle --');
  const enc = fs.readFileSync(path.join(REPO, 'docs/encyklopedia/ulepszenia/lodzie_rybackie.md'), 'utf8');
  ok(enc.includes('+6 żywność/t, +6 praca/t, +6 podatek/t'), 'encyklopedia lodzie_rybackie.md: +6/+6/+6');
  ok(!enc.includes('+2 żywność/t, +3 praca/t'), 'encyklopedia lodzie_rybackie.md: brak starego +2/+3');
  const cat = fs.readFileSync(path.join(REPO, 'docs/PORADNIK-GRACZA/28-katalog-ulepszen.md'), 'utf8');
  ok(cat.includes('| Łodzie rybackie | Kamień | 20 | +6 żywność, +6 praca, +6 podatek |'), 'poradnik 28-katalog: wiersz tabeli +6/+6/+6');
  ok(cat.includes('Daje: **+6 żywność, +6 praca, +6 podatek**.'), 'poradnik 28-katalog: opis +6/+6/+6');
  const bundleObj = JSON.parse(fs.readFileSync(path.join(GRA, 'src/data/wikiBundle.json'), 'utf8'));
  const boatsPage = bundleObj.encyklopedia.find(e => e.id === 'ulepszenia/lodzie_rybackie');
  ok(!!boatsPage, 'wikiBundle.json: hasło ulepszenia/lodzie_rybackie istnieje');
  const boatsTxt = JSON.stringify(boatsPage || {});
  ok(boatsTxt.includes('+6 żywność/t, +6 praca/t, +6 podatek/t'), 'wikiBundle.json: hasło Łodzie rybackie = +6/+6/+6');
  ok(!boatsTxt.includes('+2 żywność/t, +3 praca/t'), 'wikiBundle.json: hasło Łodzie rybackie bez starego +2/+3');

  console.log(`\n--- fishing-boats-666-test: ${passed} OK, ${failed} FAIL ---`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
