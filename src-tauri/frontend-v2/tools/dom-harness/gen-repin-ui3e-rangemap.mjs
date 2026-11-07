#!/usr/bin/env node
/**
 * gen-repin-ui3e-rangemap.mjs — R-RUSTPORT-REPIN-WEB-UI-3-E-Q1: zamrożona mapa zakresów pinu `edb8fb56` → web `9b019a7d8`
 * (`repin-ui3e-rangemap.json`) dla weryfikatorów/harnessów partii K, które czytają zakresy pinu z zamrożonych logów.
 * Złożenie: `repin-ui2g-rangemap.json` (edb8fb56 → 86d510c66) ∘ mapa Myersa `cityPanel.ts` 86d510c66 → 9b019a7d8
 * (`rangeMapper`, jak `repin-ui3e-kblocks.mjs`); bloki MANUAL (dryf, przepięte ręcznie) — jawna tabela poniżej.
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/gen-repin-ui3e-rangemap.mjs --web86-dir <WEB86> --web3-dir <WEB3> [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { rangeMapper } from './repin-ui2g-rev.mjs';

const args = process.argv.slice(2);
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const W86 = argOf('--web86-dir'), W3 = argOf('--web3-dir');
if (!W86 || !W3) { console.error('Użycie: --web86-dir <WEB86> --web3-dir <WEB3> [--write]'); process.exit(2); }
const REL = 'gra/src/ui/cityPanel.ts';
const A = readFileSync(join(W86, REL), 'utf8').split(/\r?\n/);
const B = readFileSync(join(W3, REL), 'utf8').split(/\r?\n/);
const { mapRange } = rangeMapper(A, B);
/** Bloki z dryfem 86d→9b0, których granice ustalono ręcznie (MANUAL w repin-ui3e-kblocks, P5-REPIN-UI-2 §12). */
const MANUAL = { '1498-1503': '1523-1532', '6901-7000': '6930-7038', '8232-8282': '8281-8336', '12096-12182': '12191-12289' };
const prev = JSON.parse(readFileSync(new URL('./repin-ui2g-rangemap.json', import.meta.url), 'utf8'));
const map = {};
for (const [pinR, w86] of Object.entries(prev.map)) {
  if (MANUAL[w86]) { map[pinR] = MANUAL[w86]; continue; }
  const [a, b] = w86.split('-').map(Number);
  const [a2, b2] = mapRange(a, b);
  map[pinR] = `${a2}-${b2}`;
}
const out = {
  topic: 'R-RUSTPORT-REPIN-WEB-UI-3-E-Q1',
  runda: 1,
  from: 'edb8fb56',
  to: '9b019a7d8',
  file: REL,
  note: 'Złożenie repin-ui2g-rangemap.json (edb8fb56→86d510c66) z mapą Myersa cityPanel.ts 86d510c66→9b019a7d8; MANUAL = bloki z dryfem przepięte ręcznie. Generator: gen-repin-ui3e-rangemap.mjs.',
  map,
};
const txt = JSON.stringify(out, null, 1) + '\n';
if (args.includes('--write')) writeFileSync(new URL('./repin-ui3e-rangemap.json', import.meta.url), txt);
console.log(`gen-repin-ui3e-rangemap: zakresów=${Object.keys(map).length} (MANUAL trafień=${Object.values(prev.map).filter((v) => MANUAL[v]).length})${args.includes('--write') ? ' zapisano' : ''}`);
