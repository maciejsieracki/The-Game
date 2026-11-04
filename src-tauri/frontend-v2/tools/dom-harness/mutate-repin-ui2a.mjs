#!/usr/bin/env node
/**
 * mutate-repin-ui2a.mjs — kontrola czułości `run-repin-ui2a.mjs` (R-RUSTPORT-REPIN-UI-2-A-Q1): wstrzykuje po jednej
 * mutacji do kopii portu (`src/ui/*`), uruchamia harness i oczekuje EXIT=1; po każdej mutacji przywraca plik
 * i sprawdza, że bajty są identyczne z oryginałem (asercja). Mutacje obejmują każdą gałąź sterującą partii.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-repin-ui2a.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>]   → EXIT 0 ⇔ każda mutacja wykryta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const webDir = argOf('--web-dir');
if (!webDir) {
  console.error('Użycie: node tools/dom-harness/mutate-repin-ui2a.mjs --web-dir <WEB_DIR> [--tmp-dir <dir>]');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const F = 'src/ui/formatCompactNumber.ts';
const R = 'src/ui/recruitHudLabel.ts';
const C = 'src/ui/hudChip6c.ts';
const A = 'src/ui/unitActionBarHtml.ts';
/** [nazwa, plik, przed, po] — „przed" musi wystąpić w pliku dokładnie raz. */
const MUTS = [
  ['F1 próg <1000 bez zaokrąglenia', F, 'if (Math.round(abs * 10) / 10 < 1000) return null;', 'if (abs < 1000) return null;'],
  ['F2 awans 1000k → M (>= na >)', F, 'if (tenths >= 10_000 && i < COMPACT_UNITS.length - 1) continue;', 'if (tenths > 10_000 && i < COMPACT_UNITS.length - 1) continue;'],
  ['F3 bez zbędnego ,0', F, "return (frac === 0 ? String(whole) : `${whole},${frac}`) + suffix;", "return `${whole},${frac}` + suffix;"],
  ['F4 znak minus skróconej', F, "return (n < 0 ? '-' : '') + body;", 'return body;'],
  ['F5 minus U+2212 w formatCompactSigned', F, "return (n < 0 ? '−' : '+') + body;", "return (n < 0 ? '-' : '+') + body;"],
  ['F6 grupowanie tysięcy', F, '/\\B(?=(\\d{3})+(?!\\d))/g', '/\\B(?=(\\d{4})+(?!\\d))/g'],
  ['F7 notatka gdy skrócona tylko rate', F, "if (!vCompact && !rCompact) return '';", "if (!vCompact) return '';"],
  ['F8 znak + rate w notatce', F, "parts.push(`(${rate > 0 ? '+' : ''}${full})`);", "parts.push(`(${rate >= 0 ? '+' : ''}${full})`);"],
  ['F9 NaN fallback compact', F, "export function formatCompactNumber(n: number | null | undefined): string {\n  if (typeof n !== 'number' || !Number.isFinite(n)) return '0';", "export function formatCompactNumber(n: number | null | undefined): string {\n  if (typeof n !== 'number') return '0';"],
  ['R1 próg pełnych jednostek', R, '(rekrutEkw ?? 0) > 0 ? rekrutEkw : 0', '(rekrutEkw ?? 0) > 1 ? rekrutEkw : 0'],
  ['R2 isSafeInteger → isFinite', R, 'Number.isSafeInteger(rekrutEkw)', 'Number.isFinite(rekrutEkw)'],
  ['C1 exact w title', C, "(opts.exact ? ' · ' + opts.exact : '')", "''"],
  ['C2 aria-label tylko z exact', C, 'const ariaAttr = opts.exact ?', 'const ariaAttr = opts.act ?'],
  ['C3 escHtml aria-label', C, '` aria-label="${escHtml(opts.label + \': \' + opts.exact)}"`', '` aria-label="${opts.label + \': \' + opts.exact}"`'],
  ['A1 general-follow aktywny', A, "${generalFollow.active ? ' uc-act-btn--on' : ''}", ''],
  ['A2 general-follow disabled', A, "+ (generalFollow.disabled ? ' disabled' : '')", ''],
  ['A3 ikona split = pin', A, "+ '<path d=\"M12 12H4M7 9 4 12l3 3\"/><path d=\"M12 12h8m-3-3 3 3-3 3\"/>'", "+ '<path d=\"M8 7 4 11l4 4\"/><path d=\"M16 7l4 4-4 4\"/>'"],
  ['A4 ikona merge = pin', A, "+ '<path d=\"M4 12h6M7 9l3 3-3 3\"/><path d=\"M20 12h-6m3-3-3 3 3 3\"/>'", ''],
  ['A5 general-follow pominięty', A, "const generalFollow = byId.get('general-follow');", "const generalFollow = byId.get('general-follow-x');"],
];
let missed = 0;
for (const [name, rel, before, after] of MUTS) {
  const file = join(ROOT, rel);
  const orig = readFileSync(file);
  const txt = orig.toString('utf8');
  const count = txt.split(before).length - 1;
  if (count !== 1) {
    console.error(`MUTACJA ${name}: wzorzec występuje ${count}× w ${rel} (wymagane 1)`);
    process.exit(2);
  }
  writeFileSync(file, txt.replace(before, after));
  let r;
  try {
    const hArgs = ['tools/dom-harness/run-repin-ui2a.mjs', '--web-dir', webDir];
    if (argOf('--tmp-dir')) hArgs.push('--tmp-dir', argOf('--tmp-dir'));
    r = spawnSync(process.execPath, hArgs, { cwd: ROOT, encoding: 'utf8', timeout: 240000 });
  } finally {
    writeFileSync(file, orig);
  }
  if (Buffer.compare(readFileSync(file), orig) !== 0) {
    console.error(`PRZYWRÓCENIE ${rel} nieudane`);
    process.exit(2);
  }
  const ok = r.status === 1;
  if (!ok) missed++;
  const line = (r.stdout ?? '').split('\n').find((l) => l.startsWith('run-repin-ui2a:')) ?? '';
  console.log(`${ok ? 'WYKRYTA ' : 'PRZEŻYŁA'} ${name} (EXIT=${r.status}) ${line.replace(/ webVectorsSha256=.*/, '')}`);
}
console.log(`mutate-repin-ui2a: mutacji=${MUTS.length} wykrytych=${MUTS.length - missed} przeżyło=${missed}`);
process.exitCode = missed === 0 ? 0 : 1;
