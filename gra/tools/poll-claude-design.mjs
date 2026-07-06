/** Poll Claude Design propozycje — node */
import { existsSync, statSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const watchDir = join(ROOT, 'docs/ux/claude-design/01-propozycje-z-design/brand-book');
const wejscieE = join(ROOT, 'docs/ux/pipeline/01-wejscie/grupa-E');
const outFile = join(ROOT, 'docs/obieg/_poll-claude-design-last.md');

const SKIP = new Set(['readme.md', '.gitkeep', 'status.md']);

function listFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) listFiles(full, acc);
    else if (!SKIP.has(name.name.toLowerCase())) acc.push(full);
  }
  return acc;
}

const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
const propozycje = listFiles(watchDir);
const wejscie = listFiles(wejscieE).filter((f) => f.endsWith('_przed.png'));

const lines = [
  `# Poll Claude Design — ${ts}`,
  '',
  'Skrypt: `node gra/tools/poll-claude-design.mjs`',
  '',
  '## Propozycje z Design (Maciej)',
  `Folder: docs/ux/claude-design/01-propozycje-z-design/brand-book/`,
  '',
];

if (propozycje.length === 0) {
  lines.push('- **BRAK** plików (poza README/.gitkeep)');
} else {
  for (const f of propozycje) {
    const st = statSync(f);
    lines.push(`- OK \`${relative(ROOT, f).replace(/\\/g, '/')}\` (${st.size} B)`);
  }
}

lines.push('', '## Wejście Grupa E (pipeline)', '');
if (wejscie.length === 0) {
  lines.push('- **BRAK** `*_przed.png` w 01-wejscie/grupa-E/');
} else {
  for (const f of wejscie) {
    const st = statSync(f);
    lines.push(`- OK \`${relative(ROOT, f).replace(/\\/g, '/')}\` (${st.size} B)`);
  }
}

lines.push('', '## Werdykt');
if (propozycje.some((f) => /brand-book/i.test(f))) {
  lines.push('**Brand book w propozycjach** — lane UI: review + STATUS.');
} else if (propozycje.length > 0) {
  lines.push('**Nowe pliki w propozycjach** — lane UI: review PO vs baseline.');
} else {
  lines.push('Czekamy: Maciej → Brand Book w `01-propozycje-z-design/brand-book/` · Grupa E → `01-wejscie/grupa-E/`.');
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, lines.join('\n') + '\n', 'utf8');
console.log('Zapisano:', outFile);
console.log(`Propozycje: ${propozycje.length} · Wejście E: ${wejscie.length}`);
