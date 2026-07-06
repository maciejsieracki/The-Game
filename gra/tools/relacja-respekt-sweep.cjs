'use strict';
/** Relacja = Zaufanie + Respekt · sweep Respekt 0–100 */
const zaufanieLevels = [
  { label: 'Zauf 91 (równowaga)', z: 91 },
  { label: 'Zauf 85', z: 85 },
  { label: 'Zauf 50', z: 50 },
  { label: 'Zauf 20 (start)', z: 20 },
];

function tier(score) {
  if (score < 30) return 'Wrogi';
  if (score < 60) return 'Neutralny';
  if (score < 128) return 'Przyjazny';
  return 'Sojusz*';
}

console.log('=== RELACJA = Zaufanie + Respekt ===\n');
console.log('Respekt = udział TWOJEJ Mocy w parze (0 = jesteś niczym, 100 = monopol mocy).');
console.log('Partner: gdy ty masz Respekt R, on ma (100−R) — zero-sum.\n');

for (const { label, z } of zaufanieLevels) {
  console.log(`--- ${label} ---`);
  console.log('| Nasz Respekt | Partner Respekt | Relacja | Tier | Próg sojusz (128)? |');
  console.log('|--------------|-----------------|---------|------|---------------------|');
  for (let r = 100; r >= 0; r -= 10) {
    const rel = z + r;
    const sojusz = rel >= 128 ? '✅' : '❌';
    console.log(
      `| ${String(r).padStart(3)}          | ${String(100 - r).padStart(3)}             | ${String(rel).padStart(3)}     | ${tier(rel).padEnd(9)} | ${sojusz}                   |`,
    );
  }
  console.log('');
}

console.log('--- Kluczowe proporcje Mocy (Respekt z wzoru gry) ---');
console.log('| Ty silniejszy | Twój Respekt | Partner | Relacja @ Zauf 91 |');
console.log('|---------------|--------------|---------|-------------------|');
for (const [tag, ratio] of [['1:1', 1], ['1,5×', 1.5], ['2×', 2], ['3×', 3], ['5×', 5], ['10×', 10]]) {
  const r = Math.round(100 * ratio / (ratio + 1));
  console.log(`| ${tag.padEnd(13)} | ${String(r).padStart(3)}          | ${String(100 - r).padStart(3)}     | ${91 + r}               |`);
}
