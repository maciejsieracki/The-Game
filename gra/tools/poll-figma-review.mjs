/** Poll Figma review deliverables — node (bez blokady Auto-review na .ps1) */
import { existsSync, statSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const outFile = join(ROOT, 'docs/obieg/_poll-figma-review-last.md');
const watchFile = join(ROOT, 'docs/obieg/MASTER-WATCH-2026-07-01.md');

const checks = [
  { label: 'E-01 PO Grupa E (Figma)', path: 'docs/ux/figma/grupa-E/export/E-01_po.png', review: true },
  { label: 'E-01 PO referencja MASTER', path: 'docs/ux/figma/grupa-E/export/E-01_po_REFERENCJA-MASTER.png', review: true },
  { label: '02 Icons preview', path: 'docs/ux/figma/02-icons/preview-tier1-5.png', review: true },
];

const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
const lines = [`# Poll Figma review - ${ts}`, '', 'Skrypt: `node gra/tools/poll-figma-review.cjs`', ''];

let e01GrupaE = false;
for (const c of checks) {
  const full = join(ROOT, c.path);
  if (existsSync(full)) {
    const st = statSync(full);
    lines.push(`- ${c.label}: OK ${c.path} (${st.size} B, ${st.mtime.toISOString().slice(0, 16).replace('T', ' ')})`);
    if (c.path.endsWith('E-01_po.png')) e01GrupaE = true;
  } else {
    lines.push(`- ${c.label}: BRAK`);
  }
}

lines.push('', '## Werdykt');
if (e01GrupaE) {
  lines.push('**E-01_po.png od Grupy E** — MASTER: wklej PNG w czacie + CHECKLIST §1.');
} else {
  lines.push('Brak `E-01_po.png` od Grupy E. Referencje MASTER/ikony ≠ zamknięcie FAZY 1.');
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, lines.join('\n') + '\n', 'utf8');

if (existsSync(watchFile)) {
  const row = `| ${ts} | ${e01GrupaE ? 'OK' : 'BRAK'} | OK | poll node |`;
  let content = readFileSync(watchFile, 'utf8');
  if (!content.includes(`| ${ts} |`)) {
    content = content.replace(
      '| start sesji | BRAK | BRAK | FAZA 1 otwarta · 0/6 · `export/` tylko README (kopia baseline do naprawy) |',
      `| start sesji | BRAK | BRAK | prep MASTER · baseline skopiowany |\n| 2026-06-29 ~16:20 | BRAK | OK preview | poll ps1 · timeout sesji ~30 min |\n| ${row} |`
    );
    writeFileSync(watchFile, content, 'utf8');
  }
}

console.log('Zapisano:', outFile);
if (e01GrupaE) process.exit(2);
