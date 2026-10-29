// Niezalezny weryfikator K01B (Operator-pomiary). Porownuje bloki `// pin edb8fb56 ...:A-B`
// w src/ui/cityPanel/k01b-*.ts z liniami pinu A..B. Raportuje pokrycie zbioru 57 jednostek
// i roznice linii po normalizacji (bez `export `, bez spacji brzegowych, bez pustych linii).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const V2 = '/home/user/The-Game/.claude/worktrees/wf_4e66ea20-909-2/src-tauri/frontend-v2/src/ui/cityPanel';
const PIN = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/k01b/pin-cityPanel.ts';
const ODR = "/home/user/The-Game/.claude/worktrees/wf_4e66ea20-909-2/dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi/odroczone.json";

const pin = readFileSync(PIN, 'utf8').split(/\r?\n/);
const odr = JSON.parse(readFileSync(ODR, 'utf8'));
const norm = (l) => l.replace(/^\s*export /, '').replace(/\s+/g, ' ').trim();

const MARK = /^\/\/ pin edb8fb56 gra\/src\/ui\/cityPanel\.ts:(\d+)-(\d+)/;
const blocks = [];
for (const f of readdirSync(V2).filter((n) => /^k01b-.*\.ts$/.test(n))) {
  const lines = readFileSync(join(V2, f), 'utf8').split(/\r?\n/);
  lines.forEach((l, i) => {
    const m = MARK.exec(l);
    if (!m) return;
    // blok = linie po markerze do nastepnego markera / konca pliku
    let j = i + 1;
    const body = [];
    while (j < lines.length && !/^\/\/ pin edb8fb56/.test(lines[j])) {
      body.push(lines[j]);
      j++;
    }
    blocks.push({ file: f, a: +m[1], b: +m[2], line: i + 1, body });
  });
}

const key = (a, b) => `${a}-${b}`;
const oset = new Set(odr.map((u) => key(u.a, u.b)));
const bset = new Set(blocks.map((x) => key(x.a, x.b)));
const onlyOdr = [...oset].filter((k) => !bset.has(k));
const onlyBlk = [...bset].filter((k) => !oset.has(k));

let totalPinLines = 0;
let unitsWithDiff = 0;
let totalMissing = 0;
let totalExtra = 0;
const rows = [];
for (const blk of blocks) {
  const pinBlk = pin.slice(blk.a - 1, blk.b).map(norm).filter((x) => x !== '');
  const v2Blk = blk.body.map(norm).filter((x) => x !== '');
  totalPinLines += pinBlk.length;
  // multiset diff
  const cnt = new Map();
  for (const l of pinBlk) cnt.set(l, (cnt.get(l) ?? 0) + 1);
  for (const l of v2Blk) cnt.set(l, (cnt.get(l) ?? 0) - 1);
  let missing = 0;
  let extra = 0;
  const missList = [];
  const extraList = [];
  for (const [l, c] of cnt) {
    if (c > 0) { missing += c; missList.push(l); }
    if (c < 0) { extra += -c; extraList.push(l); }
  }
  if (missing || extra) unitsWithDiff++;
  totalMissing += missing;
  totalExtra += extra;
  rows.push({ file: blk.file, range: key(blk.a, blk.b), pinLines: pinBlk.length, missing, extra, missSample: missList.slice(0, 2), extraSample: extraList.slice(0, 2) });
}

console.log(JSON.stringify({
  markerBlocks: blocks.length,
  odroczoneUnits: odr.length,
  rangesInOdrNotInBlocks: onlyOdr,
  rangesInBlocksNotInOdr: onlyBlk,
  totalPinLinesNonEmpty: totalPinLines,
  blocksWithAnyLineDiff: unitsWithDiff,
  totalMissingLines: totalMissing,
  totalExtraLines: totalExtra,
}, null, 1));
for (const r of rows) if (r.missing || r.extra) console.log(JSON.stringify(r));
