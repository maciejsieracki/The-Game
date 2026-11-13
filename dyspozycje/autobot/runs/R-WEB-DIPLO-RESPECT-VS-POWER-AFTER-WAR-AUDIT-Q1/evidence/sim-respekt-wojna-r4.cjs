'use strict';
/* Pomiar R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1 (runda 4, odpowiedz na zarzuty 3 i 4 Evaluatora).
 * Uruchom: node dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/evidence/sim-respekt-wojna-r4.cjs
 * Bundluje silnik (gra/src/game/diplomacy.ts) esbuildem z gra/node_modules (entry.ts z r3, bez zmian). */
const path = require('path');
const fs = require('fs');
const RUN = __dirname;
const WT = path.resolve(RUN, '..', '..', '..', '..', '..');
const esbuild = require(path.join(WT, 'gra', 'node_modules', 'esbuild'));
const BUNDLE = path.join(RUN, '.sim-bundle-r4.cjs');
esbuild.buildSync({
  entryPoints: [path.join(RUN, 'entry.ts')], bundle: true, platform: 'node', format: 'cjs',
  outfile: BUNDLE, logLevel: 'silent',
});
const E = require(BUNDLE);
const out = [];
const log = (s = '') => { out.push(s); console.log(s); };

// Skład pary Grecy (Politeizm olimpijski, typ „grecy”) – Chińczycy (Konfucjanizm/Taoizm, typ „chinczycy”):
// sameCultureCircle = false -> wspolnaReligia = false; religie różne -> odmiennaReligia = true (−0,5).
// Wspólny wróg (+1) i epoka granicy (−2 dla epok <Brąz) to flagi ZAŁOŻONE, NIE_ZMIERZONO w grze.
const PARA_REALNA = { karaWspolnaGranica: true, karaWspolnaGranicaDelta: -2, wspolnyWrog: true,
  wspolnaReligia: false, odmiennaReligia: true, wiarygodnoscSelf: undefined };
const PARA_R3 = { karaWspolnaGranica: true, karaWspolnaGranicaDelta: -2, wspolnaReligia: true,
  wiarygodnoscSelf: undefined };

// --- A. Składowe ΔZaufania/turę w wojnie, skład realny vs skład z r3 ---
log('## A. Składowe ΔZaufania/turę w wojnie (computeTickZaufanieDelta, atWar=true)');
const base = { turn: 10, aktywnyHandel: false, dobraWolaAktywna: false, wspolnyWrog: false,
  wspolnaReligia: false, odmiennaReligia: false, karaWspolnaGranica: false, wiarygodnoscSelf: undefined };
const cases = [
  ['granica −2 (epoka <Brąz) + wspólny wróg +1 + odmienna religia −0,5 (SKŁAD REALNY, założony)', PARA_REALNA],
  ['granica −2 + odmienna religia −0,5 (bez wspólnego wroga)', { ...PARA_REALNA, wspolnyWrog: false }],
  ['granica −2 + wspólna religia +0,5 (SKŁAD r3, NIEOSIĄGALNY dla pary)', PARA_R3],
  ['granica −3 (Brąz) + wspólny wróg +1 + odmienna −0,5', { ...PARA_REALNA, karaWspolnaGranicaDelta: -3 }],
  ['granica −4 (Żelazo) + wspólny wróg +1 + odmienna −0,5', { ...PARA_REALNA, karaWspolnaGranicaDelta: -4 }],
];
for (const [label, patch] of cases) {
  const dz = E.computeTickZaufanieDelta({ ...base, ...patch }, true);
  log(`- ${label}: ΔZ = ${dz}`);
}
log(`- sharedBorderPenaltyForEpochs(0,0)=${E.sharedBorderPenaltyForEpochs(0, 0)}, (2,0)=${E.sharedBorderPenaltyForEpochs(2, 0)}, (3,1)=${E.sharedBorderPenaltyForEpochs(3, 1)}`);
log('');

// --- B. Trajektoria 30 tur wojny, skład realny, R zapisany z ticku (bez wejścia mocy) ---
log('## B. Trajektoria 30 tur wojny, skład realny, start Z=40 R=30 (jak r3, tylko zapisany R, BEZ wejścia mocy)');
log('| tura | Z | R (zapisany) | Z+R | ΔZ/turę |');
log('|---|---|---|---|---|');
let relB = { zaufanie: 40, respekt: 30, status: 'wojna' };
const ctxB = t => ({ turn: t, ...PARA_REALNA });
for (let t = 1; t <= 30; t++) {
  const dz = E.computeTickZaufanieDelta(ctxB(t), true);
  relB = E.tickDiplomacy(relB, ctxB(t));
  if (t <= 3 || t % 5 === 0) log(`| ${t} | ${relB.zaufanie} | ${relB.respekt} | ${relB.zaufanie + relB.respekt} | ${dz} |`);
}
log('');

// --- C. Ścieżka SILNIKA z mocą: main.ts ~41900-41934 przed KAŻDYM tickDiplomacy ustawia respekt = computeRespekt(potAI, potPlr) ---
// potAI = objectivePowerByOwner(AI), potPlr = objectivePowerByOwner(gracz) (moc NOMINALNA, nie efektywna).
// Zapisany respekt pary = udział MOCY AI (AI-share). Panel (diplomacyAudience/respektNorm) pokazuje udział GRACZA
// (computeRespekt(ME, other), RESPEKT_TOOLTIP_PL: „jak duża jest wasza Moc”). Dwie perspektywy, ta sama nazwa.
log('## C. Ścieżka silnika z wejściem mocy (AI-share zapisywany co turę, wojna, 30 tur)');
log('Scenariusz: gracz 10× silniejszy (potPlr=100, potAI=10); skład realny; start Z=40.');
log('| tura | Z (silnik) | R zapisany = AI-share | R panelu = udział GRACZA (computeRespekt(100,10)) | Z+R zapisany |');
log('|---|---|---|---|---|');
let relC = { zaufanie: 40, respekt: 30, status: 'wojna' };
const potAI = 10, potPlr = 100;
for (let t = 1; t <= 30; t++) {
  const rAI = E.computeRespekt(potAI, potPlr); // jak main.ts:41900-41901
  relC = { ...relC, respekt: rAI };
  relC = E.tickDiplomacy(relC, ctxB(t));
  if (t <= 3 || t % 5 === 0) {
    log(`| ${t} | ${relC.zaufanie} | ${relC.respekt} | ${E.computeRespekt(potPlr, potAI)} | ${relC.zaufanie + relC.respekt} |`);
  }
}
log('');
// Odwrotna perspektywa nie wpływa na clamp: w wojnie Z+R<=29, więc przy AI-share 9 Z musi spaść do ~20 zanim clamp zadziała na R.
log(`- computeRespekt(10,100)=${E.computeRespekt(10, 100)} (AI-share), computeRespekt(100,10)=${E.computeRespekt(100, 10)} (udział gracza).`);
log('');

// --- D. Zdarzenia militarne (wygrana_bitwa +5 / przewaga_militarna +15) w wojnie: wyłącznie prawdziwe wartości silnika ---
log('## D. Zdarzenia militarne w wojnie (applyDiplomaticEvent + tick, skład realny)');
for (const [ev, lbl] of [['wygrana_bitwa', '+5'], ['przewaga_militarna', '+15']]) {
  const after = E.applyDiplomaticEvent({ zaufanie: 0, respekt: 29, status: 'wojna' }, ev, undefined, undefined);
  const ticked = E.tickDiplomacy(after, ctxB(1));
  log(`- ${ev} (Respekt ${lbl}): po zdarzeniu R=${after.respekt}, po ticku R=${ticked.respekt}, Z=${ticked.zaufanie}`);
}
log('');
fs.writeFileSync(path.join(RUN, 'wynik-pomiaru-r4.txt'), out.join('\n') + '\n');
