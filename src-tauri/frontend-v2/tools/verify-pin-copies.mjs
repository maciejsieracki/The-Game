#!/usr/bin/env node
/**
 * verify-pin-copies.mjs — sprawdza, że pliki skopiowane z pinu `edb8fb56` są bajtowo
 * identyczne z manifestem `tools/pin-manifest.json` (sha256 wyliczone z `git show <pin>:<ścieżka>`
 * w chwili kopiowania). Bez gita w czasie działania — porównuje drzewo z manifestem.
 * Niezależne porównanie z gitem: tabela w `dyspozycje/rust-port/p5/P5-1-UI-SHELL-SKELETON.md`.
 *
 * Użycie: node tools/verify-pin-copies.mjs   → EXIT 0 gdy wszystkie zgodne, 1 w p.p.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('./pin-manifest.json', import.meta.url), 'utf8'));
const root = new URL('../', import.meta.url);
let bad = 0;
for (const f of manifest.files) {
  const url = new URL(f.path, root);
  if (!existsSync(url)) {
    bad++;
    console.error(`BRAK ${f.path}`);
    continue;
  }
  const sha = createHash('sha256').update(readFileSync(url)).digest('hex');
  if (sha !== f.sha256) {
    bad++;
    console.error(`RÓŻNY ${f.path} oczekiwano ${f.sha256} jest ${sha}`);
  }
}
console.log(`verify-pin-copies: pin=${manifest.pin} plików=${manifest.files.length} niezgodnych=${bad}`);
process.exitCode = bad === 0 ? 0 : 1;
