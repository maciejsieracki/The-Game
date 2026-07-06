'use strict';
/** Audyt: jak gra NAPRAWDĘ używa Ataku i Obrony vs Obrażeń/Pancerza */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.join(os.tmpdir(), 'combat-audit.cjs');
const esbuild = path.join(GRA, 'node_modules', '.bin', 'esbuild');
execSync(
  `"${esbuild}" "${path.join(GRA, 'src/game/combat.ts')}" --bundle --platform=node --format=cjs --outfile="${BUNDLE}"`,
  { stdio: 'pipe' },
);
const { hitChanceMatrix, hitChance, matrixDamage, resolveCombat } = require(BUNDLE);

const U = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
const H = U.find((u) => u['Jednostka'] === 'Hastati');
const F = U.find((u) => u['Jednostka'] === 'Falanga');
const W = U.find((u) => u['Jednostka'] === 'Wojownik');

console.log('=== W JSON (tabela / Excel, skala 0–100) ===');
console.log('Legion:  Atak', H['Atak'], ' Obrona', H['Obrona'], ' Obrażenia', H['Obrażenia'], ' Pancerz', H['Pancerz']);
console.log('Falanga: Atak', F['Atak'], ' Obrona', F['Obrona'], ' Obrażenia', F['Obrażenia'], ' Pancerz', F['Pancerz']);
console.log('');

console.log('=== ATAK i OBRONA w walce (macierz v2 — Legion, Falanga) ===');
console.log('ŻADNEGO dzielenia. Wartość z JSON idzie 1:1 do wzoru na szansę trafienia.');
console.log('');
console.log('Wzór: szansa = clamp(35 + Atak + Szarża(runda1) − Obrona, 8, 90)');
const hitLeg = hitChanceMatrix(H['Atak'], F['Obrona'], 0, false);
const hitFal = hitChanceMatrix(F['Atak'], H['Obrona'], 0, false);
console.log('Legion → Falanga: 35 +', H['Atak'], '−', F['Obrona'], '=', hitLeg, '%');
console.log('Falanga → Legion: 35 +', F['Atak'], '−', H['Obrona'], '=', hitFal, '%');
console.log('');

console.log('=== OBRAŻENIA i PANCERZ (osobna ścieżka — NIE to samo co Atak/Obrona) ===');
console.log('Obrażenia, Przebicie, Szarża (dmg): ÷ 10');
console.log('Pancerz: mnożnik (1 − Pancerz/200) — tu jest „słynne 200”, NIE przy Obronie');
console.log('Wzór: dmg = (Obrażenia/10 + Szarża/10) × (1 − Pancerz/200) + Przebicie/10');
const dLeg = matrixDamage(H['Obrażenia'], F['Pancerz'], H['Przebicie'], 0, false);
const dFal = matrixDamage(F['Obrażenia'], H['Pancerz'], F['Przebicie'], 0, false);
console.log('Gdy Legion trafi: ~', dLeg.toFixed(2), 'pkt obrażeń');
console.log('Gdy Falanga trafi: ~', dFal.toFixed(2), 'pkt obrażeń');
console.log('');

console.log('=== PRE-BITWA (overlay przed walką — main.ts) ===');
console.log('INNY wzór niż walka! RAW Atak/Obrona z JSON:');
const preLeg = Math.max(10, Math.min(90, 50 + (H['Atak'] - F['Obrona']) * 5));
console.log('Szansa Legiona: clamp(50 + (', H['Atak'], '−', F['Obrona'], ')×5) =', preLeg, '%');
console.log('');

console.log('=== STARY tryb (Wojownik kamienny — bez pola Obrażenia) ===');
console.log('Trafienie: clamp(50 + (Atak−Obrona)×5) — też RAW');
console.log('Obrażenia: max(1, Atak − Pancerz + Przebicie) — Atak służy i do hit i do dmg!');
if (W) {
  console.log('Przykład Wojownik Atak', W['Atak'], 'Obrona', W['Obrona'], '→ hit vs Obrona 38:',
    hitChance(W['Atak'], 38), '%');
}
