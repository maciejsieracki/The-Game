'use strict';
/**
 * diplo-aggressor-marker-mutation-test.cjs — R-WEB-AGGRESSOR-MARKER-Q1 (mutacje znacznika „Agresor (N)").
 * Run: node tools/diplo-aggressor-marker-mutation-test.cjs
 *
 * Dla każdej mutacji: podmienia JEDEN fragment źródła, uruchamia unit-test znacznika i test wiązania
 * (main.ts -> panel), oczekuje FAIL któregokolwiek. Mutacja, która przeżyje = luka. Oryginały
 * przywracane zawsze (try/finally). Mutacje „brak znacznika w DOM" są dodatkowo pokryte live Chromium
 * (diplo-aggressor-marker-live-test.cjs; wynik w raporcie).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PANEL = path.resolve(ROOT, 'src', 'ui', 'diplomacyPanel.ts');
const MAIN = path.resolve(ROOT, 'src', 'main.ts');
const TESTS = [
  path.resolve(__dirname, 'diplo-aggressor-marker-unit-test.cjs'),
  path.resolve(__dirname, 'diplo-aggressor-wiring-test.cjs'),
];

const MUTATIONS = [
  ['panel: funkcja zawsze zwraca pusty znacznik', PANEL,
    "  if (pozostaleTury === undefined || !Number.isFinite(pozostaleTury)) return '';",
    "  return '';"],
  ['panel: brak licznika w tekście', PANEL, '">Agresor (\' + n + \')</span>\';', '">Agresor</span>\';'],
  ['panel: flaga wygasła (N<1) nadal pokazuje znacznik', PANEL, "  if (n < 1) return '';", ''],
  ['panel: tooltip bez licznika', PANEL, "'Wypowiedział wojnę — konsekwencje dyplomatyczne przez ' + n + ' tur'", "'Wypowiedział wojnę — konsekwencje dyplomatyczne'"],
  ['panel: renderRow nie wstawia znacznika', PANEL, '        agresorBadgeHtml(rel.agresorPozostaleTury) +\n', ''],
  ['panel: znacznik dostaje obwódkę (przesłania ramkę)', PANEL, 'padding:0 .45em;border-radius:3px;', 'padding:0 .45em;border:2px solid #fff;border-radius:3px;'],
  ['main: N = tura końca zamiast pozostałych tur', MAIN,
    '(doTuryFlagiAgresora(otherId, turn) ?? turn) - turn || undefined,', 'doTuryFlagiAgresora(otherId, turn),'],
  ['main: licznik nie maleje (stała)', MAIN,
    '(doTuryFlagiAgresora(otherId, turn) ?? turn) - turn || undefined,', '(doTuryFlagiAgresora(otherId, turn) ?? turn) - 1 || undefined,'],
];

let survived = 0;
for (const [name, file, from, to] of MUTATIONS) {
  const original = fs.readFileSync(file, 'utf8');
  const occ = original.split(from).length - 1;
  if (occ !== 1) { console.log(`BAD-ANCHOR ${name} (wystapien=${occ})`); survived++; continue; }
  try {
    fs.writeFileSync(file, original.replace(from, () => to), 'utf8');
    const killedBy = TESTS.find((t) => spawnSync(process.execPath, [t], { encoding: 'utf8', timeout: 240000 }).status !== 0);
    if (killedBy) console.log(`KILLED   ${name}  (przez ${path.basename(killedBy)})`);
    else { console.log(`SURVIVED ${name}`); survived++; }
  } finally {
    fs.writeFileSync(file, original, 'utf8');
  }
}
console.log(`diplo-aggressor-marker-mutation-test: ${MUTATIONS.length - survived}/${MUTATIONS.length} KILLED, ${survived} SURVIVED`);
process.exit(survived === 0 ? 0 : 1);
