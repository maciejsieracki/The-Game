'use strict';
/**
 * diplo-respect-power-test.cjs — R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1
 * Test charakteryzujący (bez zmiany mechaniki): trajektoria Respektu/Zaufania/Relacji
 * przy graczu ~8x silniejszym i 30 turach wojny, na PRAWDZIWYCH funkcjach silnika.
 * Run: node tools/diplo-respect-power-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

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

const PLR = 14682, AI = 1854; // zrzuty właściciela
const ratioPlr = m.computeRespekt(PLR, AI);   // "Nasz respekt" / pasek w audiencji
const ratioAi = m.computeRespekt(AI, PLR);    // "Ich respekt" / rel.respekt AI->gracz w pętli AI
ok(ratioPlr === 89 && ratioAi === 11 && ratioPlr + ratioAi === 100, 'ratio-share: silniejszy 89, słabszy 11, suma 100');

// (1) Kierunek: silniejszy ma WYŻSZY Respekt (brak odwróconego znaku).
ok(ratioPlr > 50 && ratioAi < 50, 'kierunek poprawny: przewaga mocy => Respekt > 50');
ok(m.formatPowerRelationLine(PLR, AI).respekt === 89, 'formatPowerRelationLine(gracz,AI)=89');

// (2) Wojna 30 tur — wspólna granica (-2) + ta sama religia (+0,5) = -1,5/turę.
const ctx = (turn) => ({ turn, karaWspolnaGranica: true, wspolnaReligia: true, wiarygodnoscSelf: undefined });
ok(m.computeTickZaufanieDelta(ctx(1), true) === -1.5, 'wojna: Zaufanie -1,5/turę (granica -2 + religia +0,5)');
let rel = { zaufanie: 40, respekt: ratioAi, status: 'wojna' };
for (let t = 1; t <= 30; t++) {
  rel = m.tickDiplomacy({ ...rel, respekt: m.computeRespekt(AI, PLR) }, ctx(t));
}
ok(rel.zaufanie === 0, 'po 30 turach wojny Zaufanie = 0 (dno)');
ok(rel.respekt === 11, 'respekt AI->gracz po wojnie = 11 (moc AI / suma); brak składnika za wygrane bitwy');

// (3) Wyświetlenie dla gracza: pasek Respekt ścięty do 29 w wojnie (WAR_RELATION_SCORE_CAP),
//     a "Relacja X/200" liczona bez ścięcia => rozjazd widoczny na zrzutach (Respekt 29 vs Relacja 67).
ok(m.WAR_RELATION_SCORE_CAP === 29, 'WAR_RELATION_SCORE_CAP = 29');
const shown = m.effectiveNastawienieScores(0, ratioPlr, true);
ok(shown.respekt === 29 && shown.zaufanie === 0, 'wojna: pasek Respekt (rzeczywiście 89) wyświetlany jako 29');
const relTotalUnclamped = 0 + 67; // main.ts audienceRelTotalEffective = Z + respekt efektywny (bez ścięcia)
ok(relTotalUnclamped !== shown.zaufanie + shown.respekt, 'rozjazd: Relacja (bez ścięcia) != Zaufanie+Respekt z paska');
ok(m.effectiveNastawienieScores(0, ratioPlr, false).respekt === 89, 'w pokoju pasek pokazuje prawdziwe 89');

console.log(`diplo-respect-power-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
