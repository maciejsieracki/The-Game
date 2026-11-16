// K5DOC-T3 GEOMETRIA: generator wektorow dla move_target_for_unit (C9).
// Zrodlo: gra/src/battle/battleScene.ts przy pinie 07d2fbd72.
//   _moveTargetForUnit: battleScene.ts:11442-11448 (replika 1:1 ponizej)
//   BF_COLS = 68, BF_ROWS = 156: battleScene.ts:661-662
//   formationOffset: null (spawn): battleScene.ts:4575
// Uruchom: node rust-port/engine/tests/p6_k5doc_geometry_gen.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BF_COLS = 68; // battleScene.ts:661
const BF_ROWS = 156; // battleScene.ts:662

// Replika 1:1 z battleScene.ts:11442-11448.
function moveTargetForUnit(u, col, row) {
  const off = u.formationOffset ?? { dc: 0, dr: 0 };
  return {
    col: Math.max(0, Math.min(BF_COLS - 1, col + off.dc)),
    row: Math.max(0, Math.min(BF_ROWS - 1, row + off.dr)),
  };
}

const cases = [
  { id: 'brak-offsetu-srodek', formationOffset: null, col: 10, row: 20 },
  { id: 'offset-dodatni-dr-ujemny', formationOffset: [2, -3], col: 10, row: 20 },
  { id: 'clamp-kolumny-dolny', formationOffset: [-5, 0], col: 2, row: 5 },
  { id: 'clamp-gorny-obu-osi', formationOffset: [100, 200], col: 60, row: 150 },
  { id: 'clamp-zero-obu-osi', formationOffset: [-1, -1], col: 0, row: 0 },
  { id: 'granica-gorna-bez-zmiany', formationOffset: [3, 3], col: 67, row: 155 },
  { id: 'offset-tylko-wiersz', formationOffset: [0, 1], col: 5, row: 155 },
];

const out = {
  source: 'gra/src/battle/battleScene.ts @ 07d2fbd72: _moveTargetForUnit :11442-11448; BF_COLS/BF_ROWS :661-662',
  bf_cols: BF_COLS,
  bf_rows: BF_ROWS,
  cases: cases.map(c => {
    const u = { formationOffset: c.formationOffset === null ? null : { dc: c.formationOffset[0], dr: c.formationOffset[1] } };
    const expect = moveTargetForUnit(u, c.col, c.row);
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

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'p6_k5doc_geometry_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'move_target.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${out.cases.length} cases to ${join(dir, 'move_target.json')}`);
