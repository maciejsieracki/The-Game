'use strict';
/**
 * diplo-war-character-threshold-test.cjs — R-WEB-DIPLO-WAR-CHARACTER-THRESHOLD-Q1.
 *
 * Próg przewagi siły militarnej do wypowiedzenia wojny przez AI (priorytet 4 decideAIDiplomacy)
 * = bazowy progPrzewagiProc (20%, diplomacy-military-strength-params.json) + przesunięcie charakteru
 * cywilizacji (bias.warSilaBonus), obcięte do [10%, 35%] (diplomacy-war-peace-params.json,
 * przesuniecieProguWojnyCharakter). Agresywna AI wypowiada przy mniejszej przewadze, ostrożna przy większej.
 *
 * Wartości wyjściowe (do akceptacji właściciela): agresywna 14%, neutralna 20%, ostrożna 28%.
 *
 * Sekcje:
 *  (0) parametry z JSON (baza 20, zakres 10–35, współczynnik 100 pp/jednostkę bonusu)
 *  (a) przesunięcie i clamp — funkcja progPrzewagiWypowiedzeniaWojnyProc (granice)
 *  (b) scenariusz wielu cywilizacji: przewaga 18% / 25% / 32% → wypowiedzenie tylko tam, gdzie próg dosięgnięty
 *  (c) granice klamry: skrajny bonus nie wychodzi poza [10, 35]
 *  (d) bez zmian poza progiem: zaufanie >= 30 blokuje także agresywną AI
 *  (e) słabsza strona nigdy nie wypowiada (agresywna przy przewadze −25%)
 *  (f) mutacja: ignorowanie przesunięcia (wspolczynnik = 0) czerwieni sekcję (b) zachowaniowo
 *
 * Run from gra/:  node tools/diplo-war-character-threshold-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.resolve(__dirname, '.diplo-war-character-threshold-bundle.cjs');
const entryFile = path.resolve(__dirname, '.diplo-war-character-threshold-entry.ts');

fs.writeFileSync(entryFile, `
export { decideAIDiplomacy, resolveDiplomacyCivBias } from '../src/game/ai.ts';
export { progPrzewagiWypowiedzeniaWojnyProc } from '../src/game/diplomacy-war-peace-profile.ts';
export { DEFAULT_MILITARY_STRENGTH_PARAMS } from '../src/game/diplomacy-military-strength.ts';
`, 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

const PARAMS_PATH = path.resolve(GRA, 'data', 'diplomacy-war-peace-params.json');

async function main() {
  const rawParams = fs.readFileSync(PARAMS_PATH, 'utf8');
  const params = JSON.parse(rawParams);

  // Mutacja (f) opcjonalna: MUTATE_SHIFT=1 podmienia współczynnik na 0 tylko w buildzie testu.
  const mutate = process.env.MUTATE_SHIFT === '1';
  const bundleSource = mutate
    ? rawParams.replace('"wspolczynnikPpNaJednostke": 100', '"wspolczynnikPpNaJednostke": 0')
    : null;
  if (mutate && bundleSource === rawParams) { console.error('mutacja: nie znaleziono współczynnika'); process.exit(1); }

  // W trybie mutacji plugin esbuild podstawia zmodyfikowaną treść JSON (bez zapisu na dysk).
  const esbuildOpts = {
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  };
  if (mutate) {
    esbuildOpts.plugins = [{
      name: 'mut-war-peace-json',
      setup(build) {
        build.onLoad({ filter: /diplomacy-war-peace-params\.json$/ }, () => ({
          contents: bundleSource, loader: 'json',
        }));
      },
    }];
  }
  await esbuild.build(esbuildOpts);

  const {
    decideAIDiplomacy, resolveDiplomacyCivBias, progPrzewagiWypowiedzeniaWojnyProc, DEFAULT_MILITARY_STRENGTH_PARAMS,
  } = require(BUNDLE);

  const wojny = (cmds) => cmds.filter(c => c.type === 'wypowiedz_wojne');
  const BAZA = DEFAULT_MILITARY_STRENGTH_PARAMS.progPrzewagiProc;

  // Relacja wrogiego partnera; AI silniejsza o `przewagaProc` (siła AI = partner × (1 + p/100)).
  function input({ typ, agresywnoscRaw, pod = 2, risk = 5, przewagaProc = 0, zaufanie = 25, extra = {} } = {}) {
    return {
      myPlayerId: 'ai-1',
      myTypCywilizacji: typ,
      agresja: 1.0,
      agresywnoscRaw,
      sklonnoscDoPodboju: pod,
      tolerancjaRyzyka: risk,
      currentTurn: 60,
      relacje: [{
        partnerId: 'rzym-1',
        partnerTypCywilizacji: 'rzymianie',
        relation: { zaufanie, respekt: 5, status: 'neutralni' },
        respektWzgledny: 0.55,
        silaMilitarnaAI: { sila: 100 + przewagaProc, armiaPkt: 100 + przewagaProc },
        silaMilitarnaPartner: { sila: 100, armiaPkt: 100 },
        stanWojny: false,
        peaceLocked: false,
        hasNapTreaty: false,
        turnsAtWar: 0,
        ...extra,
      }],
    };
  }

  // Profile charakteru (civ-ai): agresywna = agresywnoscRaw >= 7; ostrożna = agresywnoscRaw <= 3 && pod <= 2.
  const AGR = { typ: 'grecy', agresywnoscRaw: 9 };      // agresywna
  const NEU = { typ: 'grecy', agresywnoscRaw: 5 };      // neutralna
  const OST = { typ: 'grecy', agresywnoscRaw: 2 };      // ostrożna

  // ---- (0) parametry ----
  console.log('(0) parametry z JSON');
  const shift = params.przesuniecieProguWojnyCharakter;
  ok(BAZA === 20, `baza progu przewagi = 20% (diplomacy-military-strength-params.json, dziś ${BAZA})`);
  ok(shift && shift.min === 10 && shift.max === 35 && shift.wspolczynnikPpNaJednostke === 100,
    'przesuniecieProguWojnyCharakter: min 10, max 35, współczynnik 100 pp/jednostkę');
  const bAgr = resolveDiplomacyCivBias(1.0, 2, 9, 5).warSilaBonus;
  const bNeu = resolveDiplomacyCivBias(1.0, 2, 5, 5).warSilaBonus;
  const bOst = resolveDiplomacyCivBias(1.0, 2, 2, 5).warSilaBonus;
  ok(bAgr < 0 && bNeu === 0 && bOst > 0, `warSilaBonus: agresywna ${bAgr} < 0 = neutralna ${bNeu} < ostrożna ${bOst}`);

  // ---- (a) funkcja progu: granice i przesunięcie ----
  console.log('(a) progPrzewagiWypowiedzeniaWojnyProc: przesunięcie, clamp [10, 35]');
  const pAgr = progPrzewagiWypowiedzeniaWojnyProc(BAZA, bAgr);
  const pNeu = progPrzewagiWypowiedzeniaWojnyProc(BAZA, bNeu);
  const pOst = progPrzewagiWypowiedzeniaWojnyProc(BAZA, bOst);
  ok(Math.abs(pAgr - 14) < 1e-9, `agresywna: 20 + ${bAgr}×100 = ${pAgr.toFixed(2)}% (oczek. 14)`);
  ok(pNeu === 20, `neutralna: próg = 20% (${pNeu})`);
  ok(Math.abs(pOst - 28) < 1e-9, `ostrożna: 20 + ${bOst}×100 = ${pOst.toFixed(2)}% (oczek. 28)`);
  ok(progPrzewagiWypowiedzeniaWojnyProc(BAZA, -5) === 10, 'skrajny bonus ujemny (−5) → clamp do 10%');
  ok(progPrzewagiWypowiedzeniaWojnyProc(BAZA, 5) === 35, 'skrajny bonus dodatni (+5) → clamp do 35%');
  ok(progPrzewagiWypowiedzeniaWojnyProc(BAZA, Number.NaN) === BAZA, 'NaN bonusu → baza (bez przesunięcia)');

  // ---- (b) scenariusz wielu cywilizacji: przewaga 18% / 25% / 32% ----
  console.log('(b) scenariusz: przewaga 18% / 25% / 32% — agresywna 14%, neutralna 20%, ostrożna 28%');
  const fires = (cfg, przewaga) => wojny(decideAIDiplomacy(input({ ...cfg, przewagaProc: przewaga }), undefined, 1, 1, 'normal')).length === 1;
  ok(fires(AGR, 18) === true, 'agresywna + przewaga 18% (≥14) → wypowiedzenie');
  ok(fires(NEU, 18) === false, 'neutralna + przewaga 18% (<20) → brak');
  ok(fires(OST, 18) === false, 'ostrożna + przewaga 18% (<28) → brak');
  ok(fires(AGR, 25) === true, 'agresywna + przewaga 25% → wypowiedzenie');
  ok(fires(NEU, 25) === true, 'neutralna + przewaga 25% (≥20) → wypowiedzenie');
  ok(fires(OST, 25) === false, 'ostrożna + przewaga 25% (<28) → brak');
  ok(fires(AGR, 32) === true, 'agresywna + przewaga 32% → wypowiedzenie');
  ok(fires(NEU, 32) === true, 'neutralna + przewaga 32% → wypowiedzenie');
  ok(fires(OST, 32) === true, 'ostrożna + przewaga 32% (≥28) → wypowiedzenie');

  // ---- (c) granice klamry w silniku (ten sam scenariusz, skrajny charakter) ----
  console.log('(c) klamra: nawet skrajny charakter nie schodzi poniżej 10% ani nie wychodzi powyżej 35%');
  const bSkr = resolveDiplomacyCivBias(1.0, 5, 9, 9).warSilaBonus; // agresywna + pod>=4 + risk>=7
  ok(progPrzewagiWypowiedzeniaWojnyProc(BAZA, bSkr) >= 10, `skrajnie agresywna (bonus ${bSkr}) → próg ≥ 10%`);
  ok(wojny(decideAIDiplomacy(input({ typ: 'grecy', agresywnoscRaw: 9, pod: 5, risk: 9, przewagaProc: 9 }), undefined, 1, 1, 'normal')).length === 0,
    'skrajnie agresywna + przewaga 9% (< 10%) → brak (klamra dolna nie zanika do zera)');

  // ---- (d) zaufanie >= 30 blokuje także agresywną AI ----
  console.log('(d) zaufanie >= 30 blokuje mimo niższego progu agresywnej AI');
  ok(wojny(decideAIDiplomacy(input({ ...AGR, przewagaProc: 32, zaufanie: 30 }), undefined, 1, 1, 'normal')).length === 0,
    'agresywna + przewaga 32% + zaufanie 30 → brak (granica Zaufania nieruszona)');

  // ---- (e) słabsza strona nigdy nie wypowiada ----
  console.log('(e) słabsza agresywna AI (−25%) nie wypowiada');
  ok(wojny(decideAIDiplomacy(input({ ...AGR, przewagaProc: -25 }), undefined, 1, 1, 'normal')).length === 0,
    'agresywna AI słabsza o 25% → brak wypowiedzenia');

  // ---- (f) granice porównania: przewaga równa progowi = wypowiedzenie (>=), o jeden punkt niżej = brak ----
  console.log('(f) granice progu: przewaga równa progowi (≥) i o 1 pkt niżej');
  ok(fires(AGR, 14) === true, 'agresywna + przewaga dokładnie 14% (= próg) → wypowiedzenie (≥)');
  ok(fires(AGR, 13) === false, 'agresywna + przewaga 13% (< 14%) → brak');
  ok(fires(OST, 28) === true, 'ostrożna + przewaga dokładnie 28% (= próg) → wypowiedzenie (≥)');
  ok(fires(OST, 27) === false, 'ostrożna + przewaga 27% (< 28%) → brak');

  // ---- (g) realne cywilizacje z data/civ-ai.json: przesunięcie i efektywny próg (tabela z raportu) ----
  console.log('(g) realne cywilizacje z civ-ai.json → efektywny próg');
  const civList = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'civ-ai.json'), 'utf8')).cywilizacje;
  const oczekiwane = {
    'Chińczycy': 28, 'Sumerowie': 28, 'Harappa': 28, 'Fenicjanie': 28,
    'Grecy': 20, 'Inkowie': 20, 'Egipt': 20, 'Hetyci': 20, 'Słowianie': 20, 'Babilonia': 20,
    'Celtowie': 14, 'Germanie': 14, 'Asyria': 14,
    'Rzymianie': 10, 'Zulusi': 10,
  };
  const realne = Object.fromEntries(civList.map((c) => {
    const b = resolveDiplomacyCivBias(1.0, c.sklonnoscDoPodboju, c.agresywnosc, c.tolerancjaRyzyka).warSilaBonus;
    return [c.Cywilizacja, progPrzewagiWypowiedzeniaWojnyProc(BAZA, b)];
  }));
  ok(civList.length === Object.keys(oczekiwane).length, `civ-ai.json: ${civList.length} cywilizacji = ${Object.keys(oczekiwane).length} w tabeli`);
  for (const [nazwa, prog] of Object.entries(oczekiwane)) {
    ok(Math.abs((realne[nazwa] ?? NaN) - prog) < 1e-9, `${nazwa}: efektywny próg ${realne[nazwa]}% (oczek. ${prog}%)`);
  }

  console.log(`\ndiplo-war-character-threshold-test${mutate ? ' [MUTACJA]' : ''}: ${pass} OK, ${fail} FAIL`);
  try { fs.unlinkSync(entryFile); } catch { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
