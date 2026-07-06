'use strict';
/** Relacja sweep — wersja „na odwrót”: Respekt 0→100, Partner 100→0 */
const zLevels = [
  { label: 'Zauf 91', z: 91 },
  { label: 'Zauf 85', z: 85 },
  { label: 'Zauf 50', z: 50 },
];

function sojusz(rel, z) {
  // Tylko próg Relacji (128) — bez Mocy/hegmona (wariant Macieja)
  return rel >= 128 ? '✅ TAK' : '❌ NIE';
}

console.log('=== NA ODWRÓT: Respekt rośnie 0→100 · Partner spada 100→0 ===');
console.log('Relacja = Zaufanie + Respekt (tylko próg Relacji ≥128 na sojusz)\n');

for (const { label, z } of zLevels) {
  console.log(`--- ${label} (stałe) ---`);
  console.log('| Nasz Respekt ↑ | Partner ↓ | Relacja | Sojusz (Rel≥128)? |');
  console.log('|----------------|-----------|---------|-------------------|');
  for (let r = 0; r <= 100; r += 10) {
    const rel = z + r;
    console.log(
      `| ${String(r).padStart(3)}            | ${String(100 - r).padStart(3)}       | ${String(rel).padStart(3)}     | ${sojusz(rel, z).padEnd(17)} |`,
    );
  }
  const minR = Math.max(0, 128 - z);
  console.log(`| → min Respekt na sojusz: **${minR}** (Relacja = ${128})`);
  console.log('');
}

console.log('--- Punty Mocy (od słabości do dominacji) @ Zauf 91 ---');
console.log('| Sytuacja      | Nasz R | Partner | Relacja | Sojusz |');
console.log('|---------------|--------|---------|---------|--------|');
for (const [tag, ratio] of [
  ['Ty 5× słabszy', 1 / 5],
  ['Ty 3× słabszy', 1 / 3],
  ['Ty 2× słabszy', 1 / 2],
  ['Równowaga', 1],
  ['Ty 2× silniejszy', 2],
  ['Ty 3× silniejszy', 3],
  ['Ty 5× silniejszy', 5],
]) {
  const r = Math.round(100 * ratio / (ratio + 1));
  const rel = 91 + r;
  console.log(
    `| ${tag.padEnd(13)} | ${String(r).padStart(3)}    | ${String(100 - r).padStart(3)}     | ${String(rel).padStart(3)}     | ${sojusz(rel, 91)} |`,
  );
}
