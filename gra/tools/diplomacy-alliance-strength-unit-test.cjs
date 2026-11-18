'use strict';
/**
 * diplomacy-alliance-strength-unit-test.cjs — R-WEB-DIPLO-WAR-BY-ALLIANCE-STRENGTH-Q1 (etap C, część 2).
 *
 * Czyste testy na prawdziwych funkcjach (esbuild): blockStrength / blockHasAdvantage oraz decideAIDiplomacy
 * (ai.ts P4) z flagą wojnaSilaSojuszuAktywna OFF/ON.
 *  (1) flaga domyślnie OFF; hak testowy wraca do danych
 *  (2) blockStrength: sumowanie, wykluczenia (wasal, wojna z AI po stronie AI, partner-cel, duplikaty, NaN)
 *  (3) słaba AI bez sojuszników = brak wojny (flaga ON i OFF)
 *  (4) flaga OFF = parytet: sojusznicy w danych nie zmieniają decyzji
 *  (5) flaga ON: słaba AI + silny sojusznik = wojna (blok ≥ 20%)
 *  (6) próg 20% na bloku: 119 → brak, 120 → wojna
 *  (7) sojusznik w wojnie z AI / będący celem / wasal nie liczy się
 *  (8) blok partnera: silni sojusznicy partnera blokują wojnę, której sama AI by dokonała
 *  (9) brak sojuszników w ON = parytet z OFF (ta sama decyzja)
 *
 * Run from gra/:  node tools/diplomacy-alliance-strength-unit-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.resolve(__dirname, '.diplomacy-alliance-strength-bundle.cjs');
const entryFile = path.resolve(__dirname, '.diplomacy-alliance-strength-entry.ts');

fs.writeFileSync(entryFile, `
export { decideAIDiplomacy } from '../src/game/ai.ts';
export {
  blockStrength, blockHasAdvantage, isWarByAllianceStrengthEnabled, setWarByAllianceStrengthForTest, ALLIANCE_WAR_PARAMS,
} from '../src/game/diplomacy-alliance-strength.ts';
export { DEFAULT_MILITARY_STRENGTH_PARAMS } from '../src/game/diplomacy-military-strength.ts';
`, 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

async function main() {
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  });
  const {
    decideAIDiplomacy, blockStrength, blockHasAdvantage, isWarByAllianceStrengthEnabled,
    setWarByAllianceStrengthForTest, ALLIANCE_WAR_PARAMS,
  } = require(BUNDLE);

  const wojny = (cmds) => cmds.filter(c => c.type === 'wypowiedz_wojne');
  const ws = (sila) => ({ sila, armiaPkt: sila });

  // Scenariusz P4 jak w diplo-war-declare-zero-trust-test.cjs (sekcja a): zaufanie 25, agresja 0.8, grecy vs rzym-1.
  // Opcje: aiSila/partnerSila, sojusznicy AI/partnera, wartości wejściowe relacji.
  function input({ aiSila = 60, partnerSila = 100, blokAI, blokPartnera } = {}) {
    return {
      myPlayerId: 'ai-1',
      myTypCywilizacji: 'grecy',
      agresja: 0.8,
      currentTurn: 30,
      relacje: [{
        partnerId: 'rzym-1',
        partnerTypCywilizacji: 'rzymianie',
        relation: { zaufanie: 25, respekt: 5, status: 'neutralni' },
        respektWzgledny: 0.55,
        silaMilitarnaAI: ws(aiSila),
        silaMilitarnaPartner: ws(partnerSila),
        stanWojny: false,
        peaceLocked: false,
        hasNapTreaty: false,
        ...(blokAI !== undefined ? { blokSojusznicyAI: blokAI } : {}),
        ...(blokPartnera !== undefined ? { blokSojusznicyPartnera: blokPartnera } : {}),
      }],
    };
  }
  const sojusznik = (id, sila, extra = {}) => ({ id, sila, armiaPkt: sila, wasal: false, wojnaZAI: false, ...extra });
  const decyzja = (inp) => wojny(decideAIDiplomacy(inp, undefined, 1, 1, 'normal')).length;

  // ---- (1) flaga ----
  console.log('(1) flaga domyslnie OFF, hak testowy');
  ok(ALLIANCE_WAR_PARAMS.wojnaSilaSojuszuAktywna === false, 'dane: wojnaSilaSojuszuAktywna = false');
  ok(isWarByAllianceStrengthEnabled() === false, 'flaga domyslnie OFF');
  setWarByAllianceStrengthForTest(true);
  ok(isWarByAllianceStrengthEnabled() === true, 'hak ON');
  setWarByAllianceStrengthForTest(null);
  ok(isWarByAllianceStrengthEnabled() === false, 'hak null wraca do danych (OFF)');

  // ---- (2) blockStrength ----
  console.log('(2) blockStrength: sumowanie i wykluczenia');
  const bAI = (allies, wyk = ['rzym-1']) => blockStrength('ai', ws(60), allies, new Set(wyk));
  ok(bAI([]).sila === 60, 'AI bez sojusznikow: blok = sam AI');
  ok(bAI([sojusznik('s1', 40), sojusznik('s2', 20)]).sila === 120, 'AI + 2 sojusznikow: 60+40+20 = 120');
  ok(bAI([sojusznik('s1', 40, { wasal: true })]).sila === 60, 'wasal nie liczy sie do bloku AI');
  ok(bAI([sojusznik('s1', 40, { wojnaZAI: true })]).sila === 60, 'sojusznik w wojnie z AI nie liczy sie (strona AI)');
  ok(bAI([sojusznik('rzym-1', 80)]).sila === 60, 'partner-cel nie liczy sie do bloku AI');
  ok(bAI([sojusznik('s1', 40), sojusznik('s1', 40)]).sila === 100, 'duplikat id liczony raz');
  ok(bAI([sojusznik('s1', NaN)]).sila === 60, 'sojusznik bez danych sily nie wnosi nic');
  ok(blockStrength('ai', ws(60), [sojusznik('s1', 40, { wojnaZAI: true })], new Set(['rzym-1'])).armiaPkt === 60,
    'armiaPkt: wasal/wojna nie wnosi');
  const bP = blockStrength('partner', ws(100), [sojusznik('s1', 30, { wojnaZAI: true }), sojusznik('ai-1', 90), sojusznik('w', 50, { wasal: true })], new Set(['ai-1']));
  ok(bP.sila === 130, 'partner: wojna z AI NIE wyklucza (130 = 100+30), AI-id i wasal wykluczeni');

  // ---- (2b) blockHasAdvantage ----
  console.log('(2b) blockHasAdvantage: prog 20%');
  ok(blockHasAdvantage(ws(120), ws(100), 20) === true, '120 vs 100 przy progu 20% → przewaga');
  ok(blockHasAdvantage(ws(119), ws(100), 20) === false, '119 vs 100 przy progu 20% → brak');

  // ---- (3)-(4) slaba AI bez sojusznikow i parytet OFF ----
  console.log('(3) slaba AI bez sojusznikow: brak wojny (ON i OFF)');
  setWarByAllianceStrengthForTest(false);
  ok(decyzja(input({ aiSila: 60 })) === 0, 'OFF: AI 60 vs 100, bez sojusznikow → brak wojny');
  setWarByAllianceStrengthForTest(true);
  ok(decyzja(input({ aiSila: 60 })) === 0, 'ON: AI 60 vs 100, bez sojusznikow → brak wojny (parytet)');
  ok(decyzja(input({ aiSila: 60, blokAI: [] })) === 0, 'ON: pusta lista sojusznikow → brak wojny');

  console.log('(4) flaga OFF = parytet: sojusznicy w danych nie zmieniaja decyzji');
  setWarByAllianceStrengthForTest(false);
  ok(decyzja(input({ aiSila: 60, blokAI: [sojusznik('s1', 200)] })) === 0, 'OFF: silny sojusznik AI ignorowany → brak wojny');
  ok(decyzja(input({ aiSila: 125, blokPartnera: [sojusznik('p1', 500)] })) === 1, 'OFF: sojusznik partnera ignorowany → wojna (AI 125 vs 100)');
  ok(decyzja(input({ aiSila: 125 })) === 1, 'OFF: AI 125 vs 100 bez sojusznikow → wojna (kontrola)');

  // ---- (5) silny sojusznik ----
  console.log('(5) flaga ON: slaba AI + silny sojusznik = wojna');
  setWarByAllianceStrengthForTest(true);
  ok(decyzja(input({ aiSila: 60, blokAI: [sojusznik('s1', 80)] })) === 1,
    'ON: AI 60 + sojusznik 80 = blok 140 vs 100 (>= 20%) → wojna');

  // ---- (6) prog 20% na bloku ----
  console.log('(6) prog 20% na bloku AI');
  ok(decyzja(input({ aiSila: 60, blokAI: [sojusznik('s1', 59)] })) === 0, 'ON: blok 119 vs 100 → brak wojny');
  ok(decyzja(input({ aiSila: 60, blokAI: [sojusznik('s1', 60)] })) === 1, 'ON: blok 120 vs 100 → wojna');

  // ---- (7) wykluczenia po stronie AI ----
  console.log('(7) sojusznik w wojnie z AI / cel / wasal nie liczy sie');
  ok(decyzja(input({ aiSila: 60, blokAI: [sojusznik('s1', 80, { wojnaZAI: true })] })) === 0, 'ON: sojusznik w wojnie z AI → brak wojny');
  ok(decyzja(input({ aiSila: 60, blokAI: [sojusznik('rzym-1', 80)] })) === 0, 'ON: sojusznik = partner-cel → brak wojny');
  ok(decyzja(input({ aiSila: 60, blokAI: [sojusznik('s1', 80, { wasal: true })] })) === 0, 'ON: wasal AI → brak wojny');

  // ---- (8) blok partnera ----
  console.log('(8) blok partnera: silni sojusznicy partnera blokuja wojne');
  ok(decyzja(input({ aiSila: 125 })) === 1, 'ON: AI 125 vs 100 bez sojusznikow → wojna (kontrola)');
  ok(decyzja(input({ aiSila: 125, blokPartnera: [sojusznik('p1', 60)] })) === 0,
    'ON: partner 100 + sojusznik 60 = blok 160 > AI 125 → brak wojny');
  ok(decyzja(input({ aiSila: 125, blokPartnera: [sojusznik('ai-1', 500)] })) === 1,
    'ON: AI-id wsrod sojusznikow partnera pominiete → wojna');
  ok(decyzja(input({ aiSila: 125, blokPartnera: [sojusznik('p1', 500, { wasal: true })] })) === 1,
    'ON: wasal partnera nie liczy sie → wojna');

  // ---- (9) parytet ON bez sojusznikow z flaga OFF (ta sama liczba komend) ----
  console.log('(9) parytet ON/OFF bez sojusznikow');
  // Porównanie decyzji po typie i celu (pole powod celowo różni się: ON dopisuje opis bloku w logu).
  const cmdsKey = (inp) => JSON.stringify(decideAIDiplomacy(inp, undefined, 1, 1, 'normal')
    .map(c => ({ type: c.type, targetId: c.targetId ?? null })));
  setWarByAllianceStrengthForTest(false);
  const offA = cmdsKey(input({ aiSila: 125 }));
  const offB = cmdsKey(input({ aiSila: 60 }));
  setWarByAllianceStrengthForTest(true);
  ok(cmdsKey(input({ aiSila: 125 })) === offA, 'AI 125 bez sojusznikow: komendy ON == OFF');
  ok(cmdsKey(input({ aiSila: 60 })) === offB, 'AI 60 bez sojusznikow: komendy ON == OFF');
  setWarByAllianceStrengthForTest(null);

  console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
  try { fs.unlinkSync(entryFile); } catch (_) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
