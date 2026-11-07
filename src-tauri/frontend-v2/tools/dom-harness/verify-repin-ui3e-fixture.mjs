#!/usr/bin/env node
/**
 * verify-repin-ui3e-fixture.mjs — niezależny weryfikator wyjścia harnessu partii REPIN UI-3-E
 * (R-RUSTPORT-REPIN-WEB-UI-3-E-Q1). Wejście: DRUGI, niezależny `git archive 9b019a7d8 gra/src gra/data` (`--web-dir`).
 *
 * Sprawdza (EXIT 0 ⇔ wszystkie):
 *   F1 zacommitowana fixtura `fixtures/repin_ui3e-web-vectors.json` jest spójna: wektory odtworzone z `values`/`vectors`
 *      dają sha256 = `webVectorsSha256` (fixtura nie została ręcznie podmieniona);
 *   F2 źródło webu w drugim archiwum zawiera hunki partii (ownerEra/epoka, „Wymaga rzeki przy mieście”,
 *      AUTO_BUILD_DISABLED_HINT, isCityUnderSiege) — archiwum jest z właściwej rewizji, nie z pinu 86d510c66;
 *   F3 ponowny przebieg `run-repin-ui3e.mjs` na drugim archiwum (Chromium) kończy się EXIT 0 i daje
 *      wektory webu bajtowo równe fixturze (ten sam `webVectorsSha256`, te same `values`/`vectors`, te same PNG sha256).
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/verify-repin-ui3e-fixture.mjs --web-dir <drugi git archive 9b019a7d8> [--tmp-dir <dir>]
 * EXIT 0 ⇔ zgodne; 1 ⇔ niezgodność; 2 ⇔ błąd.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const WEB = argOf('--web-dir');
const TMPD = argOf('--tmp-dir');
const HERE = resolve(fileURLToPath(new URL('.', import.meta.url)));
const ROOT = resolve(HERE, '../..');
const FIX = join(HERE, 'fixtures/repin_ui3e-web-vectors.json');
if (!WEB || !existsSync(join(WEB, 'gra/src/ui/cityPanel.ts')) || !existsSync(FIX)) {
  console.error('Użycie: node tools/dom-harness/verify-repin-ui3e-fixture.mjs --web-dir <drugi git archive 9b019a7d8> [--tmp-dir <dir>]');
  process.exit(2);
}
let fails = 0;
const ok = (name, cond, extra = '') => { console.log(`${cond ? 'OK  ' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`); if (!cond) fails++; };
const sha = (s) => createHash('sha256').update(s).digest('hex');
const decode = (fx) => Object.fromEntries(Object.entries(fx.vectors).map(([k, idx]) => [k, idx.map((i) => fx.values[i])]));

// F1
const fix = JSON.parse(readFileSync(FIX, 'utf8'));
ok('F1 fixtura: temat', fix.topic === 'R-RUSTPORT-REPIN-WEB-UI-3-E-Q1');
ok('F1 fixtura: sha256(wektory odtworzone) = webVectorsSha256', sha(JSON.stringify(decode(fix))) === fix.webVectorsSha256, fix.webVectorsSha256.slice(0, 16));
ok('F1 fixtura: PNG 1280x720 i 360x640 równe web/port', Array.isArray(fix.png) && fix.png.length === 2 && fix.png.every((p) => p.eq === true));

// F2
const web = readFileSync(join(WEB, 'gra/src/ui/cityPanel.ts'), 'utf8');
for (const marker of ['ownerEra = 1): string {', "multTxt = mult === 1 ? '' :", 'AUTO_BUILD_DISABLED_HINT', 'isCityUnderSiege', 'cityHasRiver']) ok(`F2 web: hunk „${marker}”`, web.includes(marker));
const prod = existsSync(join(WEB, 'gra/src/game/production.ts')) ? readFileSync(join(WEB, 'gra/src/game/production.ts'), 'utf8') : '';
ok('F2 web: RIVER_ONLY_BUILDING_IDS w game/production.ts', prod.includes('RIVER_ONLY_BUILDING_IDS'));

// F3
let tmp;
try { tmp = mkdtempSync(join(TMPD ?? tmpdir(), 'verify-ui3e-')); } catch (e) { console.error('BŁĄD: mkdtemp', e.message); process.exit(2); }
const out = join(tmp, 'vectors.json');
const r = spawnSync('node', [join(HERE, 'run-repin-ui3e.mjs'), '--web-dir', WEB, '--out', out, ...(TMPD ? ['--tmp-dir', TMPD] : [])], { cwd: ROOT, encoding: 'utf8', timeout: 400000, maxBuffer: 64 * 1024 * 1024 });
ok('F3 run-repin-ui3e na drugim archiwum EXIT 0', r.status === 0, `EXIT ${r.status}`);
if (existsSync(out)) {
  const again = JSON.parse(readFileSync(out, 'utf8'));
  ok('F3 webVectorsSha256 = fixtura', again.webVectorsSha256 === fix.webVectorsSha256, again.webVectorsSha256.slice(0, 16));
  ok('F3 values/vectors = fixtura', JSON.stringify(again.values) === JSON.stringify(fix.values) && JSON.stringify(again.vectors) === JSON.stringify(fix.vectors));
  ok('F3 PNG sha256 = fixtura', JSON.stringify(again.png.map((p) => [p.size, p.sha])) === JSON.stringify(fix.png.map((p) => [p.size, p.sha])));
} else ok('F3 wyjście harnessu zapisane', false);
rmSync(tmp, { recursive: true, force: true });
console.log(`verify-repin-ui3e-fixture: niezgodności=${fails}`);
process.exit(fails ? 1 : 0);
