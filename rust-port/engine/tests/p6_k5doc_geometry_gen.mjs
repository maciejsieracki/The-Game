// K5DOC-T3 GEOMETRIA: generator wektorow dla move_target_for_unit (C9).
// Zrodlo: gra/src/battle/battleScene.ts przy pinie 07d2fbd72.
//   _moveTargetForUnit: battleScene.ts:11442-11448 (cialo WYCIAGANE z pinu i wykonywane, nie przepisywane)
//   BF_COLS = 68, BF_ROWS = 156: battleScene.ts:661-662 (wyciagane z pinu)
//   formationOffset: null (spawn): battleScene.ts:4575
// Uruchom: node rust-port/engine/tests/p6_k5doc_geometry_gen.mjs
// Wymaga repozytorium git z commitem pinu 07d2fbd72 (git show).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const PIN = '07d2fbd72';
const SRC_PATH = 'gra/src/battle/battleScene.ts';
const here = dirname(fileURLToPath(import.meta.url));

const pinSource = execFileSync('git', ['show', `${PIN}:${SRC_PATH}`], {
  cwd: here,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');

// Stale BF_COLS / BF_ROWS z pina (battleScene.ts:661-662).
function pinConst(name) {
  const re = new RegExp(`^const ${name} = (\\d+);`);
  for (const line of pinSource) {
    const m = re.exec(line);
    if (m) return Number(m[1]);
  }
  throw new Error(`brak stalej ${name} w pinie ${PIN}`);
}
const BF_COLS = pinConst('BF_COLS');
const BF_ROWS = pinConst('BF_ROWS');
if (BF_COLS !== 68 || BF_ROWS !== 156) {
  throw new Error(`nieoczekiwane BF_COLS/BF_ROWS z pina: ${BF_COLS}/${BF_ROWS}`);
}

// Cialo metody _moveTargetForUnit (pin :11442 header, body do domykajacego "  }" w tej samej kolumnie).
function pinMethodBody(headerRe) {
  const start = pinSource.findIndex(l => headerRe.test(l));
  if (start < 0) throw new Error(`brak naglowka metody w pinie ${PIN}`);
  const body = [];
  for (let i = start + 1; i < pinSource.length; i++) {
    if (pinSource[i] === '  }') return body.join('\n');
    body.push(pinSource[i]);
  }
  throw new Error('nie znaleziono konca metody w pinie');
}
const moveBody = pinMethodBody(/private _moveTargetForUnit\(/);
// Cialo jest czystym JS (bez adnotacji typow): wykonujemy je na parametrach u, col, row.
const moveTargetForUnit = new Function('u', 'col', 'row', 'BF_COLS', 'BF_ROWS', moveBody);

const cases = [
  { id: 'brak-offsetu-srodek', formationOffset: null, col: 10, row: 20 },
  { id: 'offset-dodatni-dr-ujemny', formationOffset: [2, -3], col: 10, row: 20 },
  { id: 'clamp-kolumny-dolny', formationOffset: [-5, 0], col: 2, row: 5 },
  { id: 'clamp-gorny-obu-osi', formationOffset: [100, 200], col: 60, row: 150 },
  { id: 'clamp-zero-obu-osi', formationOffset: [-1, -1], col: 0, row: 0 },
  { id: 'granica-gorna-bez-zmiany', formationOffset: [3, 3], col: 67, row: 155 },
  { id: 'offset-tylko-wiersz', formationOffset: [0, 1], col: 5, row: 155 },
  { id: 'clamp-zero-dr-ujemny-niezerowy', formationOffset: [0, -3], col: 10, row: 1 },
];

const out = {
  source: `gra/src/battle/battleScene.ts @ ${PIN}: _moveTargetForUnit :11442-11448 (wykonane); BF_COLS/BF_ROWS :661-662`,
  bf_cols: BF_COLS,
  bf_rows: BF_ROWS,
  cases: cases.map(c => {
    const u = { formationOffset: c.formationOffset === null ? null : { dc: c.formationOffset[0], dr: c.formationOffset[1] } };
    const expect = moveTargetForUnit(u, c.col, c.row, BF_COLS, BF_ROWS);
    return {
      id: c.id,
      formation_offset: c.formationOffset,
      col: c.col,
      row: c.row,
      expect_col: expect.col,
      expect_row: expect.row,
    };
  }),
};

const dir = join(here, 'p6_k5doc_geometry_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'move_target.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.cases.length} cases to ${join(dir, 'move_target.json')}`);
