#!/usr/bin/env node
/**
 * selftest-verify-repin-ui3d.mjs — odtwarzalna kontrola negatywna bramki PORT-D/DISJ/DUP/DEPS w
 * `tools/verify-repin-ui3-copies.mjs` (R-RUSTPORT-REPIN-WEB-UI-3-D-Q1, obrona r1 — Evaluator r1 Z2).
 *
 * Dla każdego przypadku buduje OSOBNĄ kopię roboczą (`src/` + `tools/*.json` + `tools/repin-ui2-overlay-ports/` +
 * weryfikator) w katalogu tymczasowym, wstrzykuje JEDNO sztuczne naruszenie (plik portu albo manifest) i uruchamia
 * weryfikator z `--web-dir`. Najpierw przypadek KONTROLNY bez naruszenia (wymagane EXIT 0), potem każdy przypadek:
 * wymagane EXIT 1 ORAZ komunikat z oczekiwanym prefiksem (wykrycie przez właściwą regułę, nie przypadkowe).
 * Repozytorium nie jest modyfikowane.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/selftest-verify-repin-ui3d.mjs --web-dir <WEB3 = git archive 9b019a7d8 gra/src gra/data> [--tmp-dir <dir>]
 * EXIT 0 <=> kontrola zaliczona i każde naruszenie wykryte właściwą regułą; 1 <=> ≥ 1 przeżyło; 2 <=> błąd/kontrola.
 */
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const webDir = argOf('--web-dir');
if (!webDir) {
  console.error('Użycie: node tools/selftest-verify-repin-ui3d.mjs --web-dir <WEB3> [--tmp-dir <dir>]');
  process.exit(2);
}
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const TOOL_FILES = [
  'verify-repin-ui3-copies.mjs',
  'repin-ui3-manifest.json',
  'pin-manifest.json',
  'repin-ui2-manifest.json',
  'repin-ui2f-ported.json',
];
const HU = 'src/ui/hud.ts';
const MM = 'src/ui/minimapHud.ts';
const MAN = 'tools/repin-ui3-manifest.json';

const editText = (rel, before, after) => (dir) => {
  const p = join(dir, rel);
  const t = readFileSync(p, 'utf8');
  if (t.split(before).length !== 2) throw new Error(`wzorzec ${JSON.stringify(before).slice(0, 60)} nie występuje 1× w ${rel}`);
  writeFileSync(p, t.replace(before, () => after));
};
const editJson = (rel, fn) => (dir) => {
  const p = join(dir, rel);
  const j = JSON.parse(readFileSync(p, 'utf8'));
  fn(j);
  writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
};
const hudEntry = (m) => m.ui3d.portDom.find((f) => f.path === HU);

/** [nazwa, mutacja(dir), oczekiwany prefiks komunikatu w stderr] */
const CASES = [
  ['N1 1 bajt w bloku adaptera frame-memo (hud.ts)', editText(HU, 'if (!has) { frame = getState(); has = true; }', 'if (!has) { frame = getState(); has = !0; }'), 'PORT-D src/ui/hud.ts:18 blok'],
  ['N2 1 bajt poza adapterem (minimapHud.ts)', editText(MM, 'staticCatalog().constants.fogExploredBrightness', 'staticCatalog().constants.fogExploredBrightness '), 'PORT-D src/ui/minimapHud.ts: web'],
  ['N3 manifest: zła rewizja markera (hud.ts)', editText(HU, '// pin-adapter 9b019a7d8 gra/src/game/frame-memo.ts:37-67', '// pin-adapter 86d510c66 gra/src/game/frame-memo.ts:37-67'), 'PORT-D src/ui/hud.ts:18 rewizja'],
  ['N4 manifest: liczba markerów 1 → 2', editJson(MAN, (m) => { hudEntry(m).markers = 2; }), 'PORT-D src/ui/hud.ts: markerów'],
  ['N5 manifest: edycja #0 nie występuje w webie', editJson(MAN, (m) => { hudEntry(m).edits[0].web += ' '; }), 'PORT-D src/ui/hud.ts: edycja #0'],
  ['N6 manifest: webSha256 źródła ≠ web', editJson(MAN, (m) => { hudEntry(m).webSha256 = '0'.repeat(64); }), 'PORT-D src/ui/hud.ts: źródło weba'],
  ['N7 DISJ: hud.ts z powrotem w ui2c.json', editJson('tools/repin-ui2-overlay-ports/ui2c.json', (j) => { j.files.push({ src: 'gra/src/ui/hud.ts' }); }), 'DISJ src/ui/hud.ts'],
  ['N8 DUP: hud.ts dwa razy w ui3d.portDom', editJson(MAN, (m) => { m.ui3d.portDom.push({ ...hudEntry(m) }); }), 'DUP src/ui/hud.ts'],
  ['N9 DEPS(ui3d): sha256 frame-memo ≠ web', editJson(MAN, (m) => { m.ui3d.overlayDeps[0].sha256 = 'f'.repeat(64); }), 'DEPS(ui3d) gra/src/game/frame-memo.ts'],
  ['N10 SHA: rozmiar pliku hud.ts w manifeście ≠ drzewo', editJson(MAN, (m) => { hudEntry(m).bytes += 1; }), 'SHA src/ui/hud.ts'],
];

const base = argOf('--tmp-dir') ? resolve(argOf('--tmp-dir')) : tmpdir();
mkdirSync(base, { recursive: true });
const work = mkdtempSync(join(base, 'selftest-ui3d-'));
const mkCopy = (name) => {
  const dir = join(work, name);
  cpSync(join(ROOT, 'src'), join(dir, 'src'), { recursive: true });
  mkdirSync(join(dir, 'tools'), { recursive: true });
  for (const f of TOOL_FILES) cpSync(join(ROOT, 'tools', f), join(dir, 'tools', f));
  cpSync(join(ROOT, 'tools/repin-ui2-overlay-ports'), join(dir, 'tools/repin-ui2-overlay-ports'), { recursive: true });
  return dir;
};
// R-RUSTPORT-REPIN-WEB-UI-3-INTEGRACJA-Q1: po scaleniu z UI-3-B weryfikator wymaga historii git (bramka WEB/DELTA
// portDomUI3B: brak historii = błąd, obrona UI-3-B N3). Kopia robocza nie jest repozytorium — `git show <rev>:<ścieżka>`
// czyta obiekty prawdziwego repo przez GIT_DIR (tylko odczyt; drzewo robocze = kopia z wstrzykniętym naruszeniem).
const GIT_DIR = spawnSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: ROOT, encoding: 'utf8' }).stdout?.trim();
if (!GIT_DIR) {
  console.error('selftest-verify-repin-ui3d: brak repozytorium git dla ROOT (wymagane przez bramkę WEB/DELTA UI-3-B)');
  process.exit(2);
}
const runVerify = (dir) => spawnSync(process.execPath, [join(dir, 'tools/verify-repin-ui3-copies.mjs'), '--web-dir', resolve(webDir)], { cwd: dir, encoding: 'utf8', timeout: 120000, env: { ...process.env, GIT_DIR } });

let code = 0;
try {
  const ctl = runVerify(mkCopy('kontrola'));
  const ctlLine = (ctl.stdout ?? '').trim().split('\n').pop();
  if (ctl.status !== 0) {
    console.error(`KONTROLA NIEZALICZONA (EXIT=${ctl.status}):\n${ctl.stderr}${ctl.stdout}`);
    process.exitCode = 2;
    throw null;
  }
  console.log(`KONTROLA EXIT=0 ${ctlLine}`);
  let missed = 0;
  for (const [i, [name, mutate, want]] of CASES.entries()) {
    const dir = mkCopy(`n${i + 1}`);
    mutate(dir);
    const r = runVerify(dir);
    const errs = (r.stderr ?? '').trim().split('\n').filter(Boolean);
    const ok = r.status === 1 && errs.some((l) => l.startsWith(want));
    if (!ok) missed++;
    console.log(`${ok ? 'WYKRYTE  ' : 'PRZEŻYŁO '} ${name} (EXIT=${r.status}, niezgodności=${errs.length}; oczekiwano „${want}…”)${ok ? '' : '\n    ' + errs.join('\n    ')}`);
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`selftest-verify-repin-ui3d: przypadków=${CASES.length} wykrytych=${CASES.length - missed} przeżyło=${missed}`);
  code = missed === 0 ? 0 : 1;
  process.exitCode = code;
} catch (e) {
  if (e) {
    console.error(String(e?.stack ?? e));
    process.exitCode = 2;
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
