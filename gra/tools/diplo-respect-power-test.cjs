'use strict';
/**
 * diplo-respect-power-test.cjs — R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1 (runda 2)
 * Test charakteryzujący (bez zmiany mechaniki): trajektoria Respektu/Zaufania/Relacji
 * przy graczu ~8x silniejszym (surowe moce ze zrzutu) i 30 turach wojny, na PRAWDZIWYCH
 * funkcjach silnika (esbuild bundle).
 *
 * UWAGA (runda 2): panel audiencji (main.ts objectiveRespektPctTowardEffective,
 * audienceRelTotalEffective, ~24568) liczy Respekt z mocy EFEKTYWNYCH, nie surowych.
 * Surowe 14682/1854 dają Respekt 89; efektywny Respekt widoczny w panelu na zrzucie
 * to 67 (Relacja 67/200 przy Zaufaniu 0). Wartość 67 jest WEJŚCIEM testu ze zrzutu,
 * nie wynikiem obliczonym przez silnik (efektywnych mocy nie da się odtworzyć offline).
 *
 * Run: node tools/diplo-respect-power-test.cjs
 */
const fs = require('fs');
const path = require('path');

function loadEsbuild() {
  for (const candidate of [path.resolve(__dirname, '..', 'node_modules', 'esbuild'), 'esbuild']) {
    try { return require(candidate); } catch (_) { /* next */ }
  }
  console.error('[NIE_ZMIERZONO] brak esbuild: uruchom `npm ci` w katalogu gra/ (świeży worktree nie ma gra/node_modules).');
  process.exit(2);
}
const esbuild = loadEsbuild();

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-respect-power-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-respect-power-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { computeRespekt, tickDiplomacy, clampRelationForWar, computeTickZaufanieDelta, WAR_RELATION_SCORE_CAP } from './game/diplomacy';
export { effectiveNastawienieScores, formatPowerRelationLine } from './game/diplomacy-display';
`);
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, absWorkingDir: SRC, logLevel: 'silent' });
const m = require(BUNDLE);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error('[FAIL]', msg); } };

const PLR = 14682, AI = 1854; // zrzuty właściciela: SUROWE moce (nieużywane przez panel)
const RESPEKT_EFF_ZRZUT = 67; // WEJŚCIE ze zrzutu: efektywny Respekt gracza (Relacja 67/200 przy Z=0)

// (0) Ratio-share na surowych mocach (referencja, nie wartość widoczna w panelu).
const ratioPlr = m.computeRespekt(PLR, AI);   // 89
const ratioAi = m.computeRespekt(AI, PLR);    // 11
ok(ratioPlr === 89 && ratioAi === 11 && ratioPlr + ratioAi === 100, 'ratio-share surowe: silniejszy 89, słabszy 11, suma 100');

// (1) Kierunek: silniejszy ma WYŻSZY Respekt (brak odwróconego znaku).
ok(ratioPlr > 50 && ratioAi < 50, 'kierunek poprawny: przewaga mocy => Respekt > 50');
ok(m.formatPowerRelationLine(PLR, AI).respekt === ratioPlr, 'formatPowerRelationLine(gracz,AI) = computeRespekt(gracz,AI)');

// (1b) Efektywny Respekt z panelu NIE jest równy surowemu (dowód, że panel liczy inaczej).
ok(RESPEKT_EFF_ZRZUT !== ratioPlr, 'efektywny Respekt ze zrzutu (67) != surowy (89): panel używa mocy efektywnych');

// (1c) Moc zmienia się w czasie (bitwy wchodzą tylko przez Moc): Respekt gracza rośnie monotonicznie,
//      gdy moc AI spada. Test funkcji computeRespekt, NIE symulacji bitew (NIE_ZMIERZONO: bitwy).
let prev = -1, mono = true;
for (let aiP = AI; aiP >= 1000; aiP -= 100) {
  const v = m.computeRespekt(PLR, aiP);
  if (v < prev) mono = false;
  prev = v;
}
ok(mono && m.computeRespekt(PLR, 1000) > m.computeRespekt(PLR, AI), 'Respekt gracza monotonicznie rośnie, gdy moc AI spada');

// (2) Wojna 30 tur — wspólna granica (-2) + ta sama religia (+0,5) = -1,5/turę.
const ctx = (turn) => ({ turn, karaWspolnaGranica: true, wspolnaReligia: true, wiarygodnoscSelf: undefined });
ok(m.computeTickZaufanieDelta(ctx(1), true) === -1.5, 'wojna: Zaufanie -1,5/turę (granica -2 + religia +0,5)');
let rel = { zaufanie: 40, respekt: ratioAi, status: 'wojna' };
for (let t = 1; t <= 30; t++) {
  rel = m.tickDiplomacy({ ...rel, respekt: m.computeRespekt(AI, PLR) }, ctx(t));
}
ok(rel.zaufanie === 0, 'po 30 turach wojny Zaufanie = 0 (dno)');
ok(rel.respekt === ratioAi, 'respekt AI->gracz po wojnie = udział mocy AI (surowe 11)');

// (3) Wyświetlenie dla gracza. Panel przekazuje do effectiveNastawienieScores RESPEKT EFEKTYWNY
//     (main.ts respektNorm = powerLine.respekt z mocy efektywnych), nie surowy.
ok(m.WAR_RELATION_SCORE_CAP === 29, 'WAR_RELATION_SCORE_CAP = 29');
const shownWar = m.effectiveNastawienieScores(0, RESPEKT_EFF_ZRZUT, true);
ok(shownWar.respekt === 29 && shownWar.zaufanie === 0, 'wojna: pasek Respekt (efektywny 67, Z=0) wyświetlany jako 29');

// Relacja liczona przez panel bez ścięcia: Z + efektywny Respekt (main.ts audienceRelTotalEffective,
// zreplikowane tu, bo funkcja żyje w closure main.ts). Wejście: Z=0, Respekt efektywny ze zrzutu.
const relTotalEffective = Math.max(0, Math.min(200, 0 + RESPEKT_EFF_ZRZUT));
ok(relTotalEffective === 67, 'Relacja panelu (bez ścięcia) = Z + efektywny Respekt = 67 (zgodnie ze zrzutem)');
ok(relTotalEffective !== shownWar.zaufanie + shownWar.respekt, 'rozjazd wojenny: Relacja (67) != Zaufanie+Respekt z paska (29)');

// W pokoju brak ścięcia: pasek i Relacja zgodne.
const shownPeace = m.effectiveNastawienieScores(0, RESPEKT_EFF_ZRZUT, false);
ok(shownPeace.zaufanie + shownPeace.respekt === relTotalEffective, 'w pokoju pasek = Relacja (67), brak rozjazdu');

console.log(`diplo-respect-power-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
