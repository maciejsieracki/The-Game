'use strict';
/**
 * ai5-z3-fc2-probe.cjs — SONDA DOWODOWA tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1, runda 5.
 *
 * Mierzy PRZED/PO dla dwoch napraw rundy 5, na PRAWDZIWYM tekscie `src/main.ts`
 * (nie na reimplementacji-kopii) — przez wspolny harness `ai5-zasada3-harness.cjs`,
 * ten sam, ktorego uzywa bramka `ai4-popyt-obywatele-test.cjs` (asercje Z3l/Z3m):
 *
 *   Z-3  — zapis `aiSurplusRedirectedOwners` do `meta` + odczyt w `restoreGameFromSave`.
 *          Scenariusz: tura z NADWYZKA -> save -> load w SWIEZEJ sesji -> tura BEZ
 *          nadwyzki. PRZED naprawa `procentBudynki` zostaje trwale na 100
 *          (procentPuliImperiumZBudynkow(100) = 0 -> zero Pracy do puli imperium ->
 *          zero ulepszen terenu). PO naprawie wraca do normalnego zachowania.
 *
 *   FC-2 — wykluczenie `opts.defensiveCopy` (MIASTA-PANSTWA) z bloku ZASADY 3.
 *          Pomiar na TRZECH ziarnach rosteru ownerow z aktywnymi miastami-panstwami,
 *          wszyscy w stanie nadwyzki.
 *
 * PRZED = ta sama sonda na kopii main.ts ZMUTOWANEJ W PAMIECI z powrotem do stanu
 * sprzed naprawy (zapis+odczyt wyciete / warunek `!opts.defensiveCopy` zniesiony).
 * To jest jednoczesnie dowod mutacyjny na poziomie sondy: gdyby naprawy nie bylo,
 * kolumna PO wygladalaby dokladnie jak PRZED. Dowod mutacyjny na poziomie BRAMKI
 * (czy asercje Z3l/Z3m faktycznie sie czerwienia) robi `tools/ai4-mutacje.cjs`, M16–M18.
 *
 * Run z gra/:  node tools/ai5-z3-fc2-probe.cjs
 * Env: AI5_SRC_DIR (drzewo zrodlowe), AI5_OUT (plik na zrzut raportu)
 */
const fs = require('fs');
const path = require('path');
const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const H = require(path.resolve(__dirname, 'ai5-zasada3-harness.cjs'));

const SRC = process.env.AI5_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const MAIN_TS = path.join(SRC, 'main.ts');
const realSrc = fs.readFileSync(MAIN_TS, 'utf8');

// --- prawdziwe helpery podzialu Pracy z cities.ts (zero kopii stalych w sondzie) ---
const ENTRY = path.resolve(__dirname, '.ai5-probe-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai5-probe-bundle.cjs');
fs.writeFileSync(ENTRY, `export * as CITIES from ${JSON.stringify(SRC + '/game/cities')};\n`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const CITIES = require(BUNDLE).CITIES;

// ===========================================================================
// MUTACJE W PAMIECI — powrot main.ts do stanu SPRZED naprawy
// ===========================================================================
/** PRZED Z-3: brak zapisu w `meta` i brak odczytu w `restoreGameFromSave`. */
function mutujBezPersist(src) {
  let m = src;
  const saveIdx = m.indexOf(H.SAVE_SIG);
  const mIdx = m.indexOf('aiSurplusRedirectedOwners:', saveIdx);
  if (mIdx >= 0) {
    m = m.slice(0, m.lastIndexOf('\n', mIdx) + 1) + m.slice(m.indexOf('\n', mIdx) + 1);
  }
  const cIdx = m.indexOf('aiSurplusRedirectedOwners.clear();', m.indexOf(H.RESTORE_SIG));
  if (cIdx >= 0) {
    const endMarker = 'aiSurplusRedirectedOwners.add(oid);';
    const close = m.indexOf('}', m.indexOf(endMarker, cIdx) + endMarker.length);
    m = m.slice(0, m.lastIndexOf('\n', cIdx) + 1) + m.slice(m.indexOf('\n', close) + 1);
  }
  return m;
}

/** PRZED FC-2: straznik `if (!opts.defensiveCopy) {` zniesiony (blok dotyka wszystkich). */
function mutujBezWykluczenia(src) {
  const anchor = src.indexOf(H.ZASADA3_ANCHOR);
  const ifIdx = src.slice(0, anchor).lastIndexOf('\n            if (!opts.defensiveCopy) {');
  if (ifIdx < 0) return src;
  return src.slice(0, ifIdx + 1) + '            if (true) {' + src.slice(src.indexOf('\n', ifIdx + 1));
}

// ===========================================================================
// RAPORT
// ===========================================================================
const out = [];
const say = (s) => { out.push(s); console.log(s); };

say('=== SONDA ai5-z3-fc2-probe — R-AI-WYRAB-PRZY-RZECE-FARMY-Q1 runda 5 ===');
say(`main.ts: ${MAIN_TS}`);
say('');

const srcPrzedZ3 = mutujBezPersist(realSrc);
const srcPrzedFC2 = mutujBezWykluczenia(realSrc);
say(`mutacja Z-3 (usun zapis+odczyt) zmienila tekst zrodla: ${srcPrzedZ3 !== realSrc}`);
say(`mutacja FC-2 (zdejmij straznik)  zmienila tekst zrodla: ${srcPrzedFC2 !== realSrc}`);
say('');

say('--- Z-3: save w turze z NADWYZKA -> load w swiezej sesji -> tura BEZ nadwyzki ---');
const z3Przed = H.scenariuszZ3(srcPrzedZ3, CITIES);
const z3Po = H.scenariuszZ3(realSrc, CITIES);
const wiersz = (tag, r) => say(
  `  ${tag.padEnd(5)} | zapis w meta: ${String(r.saveRhs ?? 'BRAK').padEnd(38)}`
  + ` | odczyt: ${(r.loadErr ? 'BRAK' : 'JEST').padEnd(4)}`
  + ` | znacznik po load: ${String(r.redirectedPoLoad).padEnd(5)}`
  + ` | procentBudynki ${r.procentWNadwyzce} -> ${r.procentPo}`
  + ` | pula imperium ${r.pulaImperiumPo}%`
  + ` | miasta [${r.miastaPo.join(',')}]`,
);
wiersz('PRZED', z3Przed);
wiersz('PO', z3Po);
say('');
say(`  PRZED: procentBudynki zostaje na ${z3Przed.procentPo}, pula imperium ${z3Przed.pulaImperiumPo}%`
  + ` — ${z3Przed.pulaImperiumPo === 0 ? 'ZERO Pracy do puli imperium = ZERO ulepszen terenu, TRWALE' : 'pula niezerowa'}`);
say(`  PO:    procentBudynki wraca do ${z3Po.procentPo}, pula imperium ${z3Po.pulaImperiumPo}%`
  + ` — ${z3Po.pulaImperiumPo > 0 ? 'Praca znowu plynie do puli imperium' : 'NADAL ZABLOKOWANE'}`);
say(`  NOTA (§13a): po wczytaniu podzial wraca do DEFAULT_PODZIAL_PRACY`
  + ` (${CITIES.DEFAULT_PODZIAL_PRACY.procentBudynki}), NIE do wartosci wybranej wczesniej przez AI (85),`
  + ` bo \`aiSliderStateByOwner\` tez nie jest persistowany. To OSOBNA sprawa, poza zakresem`
  + ` dispatchu rundy 5 — nie blokuje, bo nie jest trwalym zablokowaniem: decideAIEconomySliders`
  + ` przelicza suwaki dalej. Zgloszone, nie naprawione.`);
say('');

say('--- FC-2: miasta-panstwa (defensiveCopy) w stanie nadwyzki, 3 ziarna ---');
say(`  straznik bloku ZASADY 3 — PO:    ${H.extractZasada3(realSrc).guard}`);
say(`  straznik bloku ZASADY 3 — PRZED: ${H.extractZasada3(srcPrzedFC2).guard}`);
for (const seed of [1337, 4242, 90210]) {
  const przed = H.scenariuszFC2(srcPrzedFC2, seed, CITIES);
  const po = H.scenariuszFC2(realSrc, seed, CITIES);
  say(`  ziarno ${String(seed).padEnd(6)} PM=[${przed.pmIds.join(',')}] CIV=[${przed.civIds.join(',')}]`);
  say(`    PRZED: PM przekierowanych ${przed.pmPrzekierowane}/${przed.pmWszystkich}`
    + ` | miast PM na przekierowanej wartosci budynkow ${przed.pmMiastaNaMax}`
    + ` | AI CYWILIZACJI przekierowanych ${przed.civPrzekierowane}/${przed.civWszystkich}`
    + ` | znaczniki PM w Set: ${przed.pmZnaczniki}`);
  say(`    PO:    PM przekierowanych ${po.pmPrzekierowane}/${po.pmWszystkich}`
    + ` | miast PM na przekierowanej wartosci budynkow ${po.pmMiastaNaMax}`
    + ` | AI CYWILIZACJI przekierowanych ${po.civPrzekierowane}/${po.civWszystkich}`
    + ` | znaczniki PM w Set: ${po.pmZnaczniki}`);
}
say('');
say('=== KONIEC SONDY ===');

if (process.env.AI5_OUT) fs.writeFileSync(process.env.AI5_OUT, out.join('\n') + '\n', 'utf8');
