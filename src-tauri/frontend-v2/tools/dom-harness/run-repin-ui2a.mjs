#!/usr/bin/env node
/**
 * run-repin-ui2a.mjs — harness partii REPIN UI-2-A (R-RUSTPORT-REPIN-UI-2-A-Q1).
 *
 * Moduły partii (kopie bajtowe z aktualnego weba, `tools/repin-ui2-manifest.json`):
 *   formatCompactNumber.ts  (formatCompactNumber / formatCompactSigned / formatFullNumber / exactCompactNote)
 *   recruitHudLabel.ts      (recruitHudLabel)
 *   hudChip6c.ts            (chip6cHtml, chip6cSep — nowe pole `exact`)
 *   unitActionBarHtml.ts    (buildUnitActionBarHtml — ikony split/merge, przycisk `general-follow`)
 *
 * WEB:  te same moduły z URUCHOMIONEGO weba — katalog `git archive origin/main gra/src` (`--web-dir`), spakowane
 *       `build.mjs` (emulacja Vite) i WYKONANE w Chromium (Playwright, `/opt/node-tools`), serwowane po HTTP z localhost.
 * PORT: moduły `src/ui/**` frontend-v2 (`--src`), spakowane tym samym `build.mjs`, wykonane w TEJ SAMEJ instancji Chromium.
 *
 * Porównanie (EXIT 0 <=> wszystkie zgodne i pokrycie spełnione):
 *   VEC   każdy wektor wejściowy → wynik (string) web === port; wektory obejmują granice N−1/N/N+1 (999/1000/1001,
 *         999 949/999 950, 999 950 000), NaN/±Infinity/null/undefined/−0, 2^53, oraz 600 liczb z deterministycznego LCG;
 *   DOM   HTML chipów i paska akcji wstawiony do dokumentu (z `UNIT_ACTION_BAR_CSS`) → `innerHTML` po parsowaniu przeglądarki
 *         web === port;
 *   PIX   zrzut ekranu (PNG) tej samej sceny web vs port: bajty PNG równe (diff pikseli = 0; próg 0 — kopia bajtowa);
 *   COVER każda funkcja z listy ma >= 1 wektor, a wektory web nie są wszystkie równe (harness coś rozróżnia).
 * Zapis wektorów: `--out <plik.json>` (wektory WEB z hashem sha256 — niezależny weryfikator porównuje hash z 2 katalogów).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui2a.mjs --web-dir <WEB_DIR> [--src <katalog src>] [--out <plik>] [--tmp-dir <dir>]
 *        [--chromium <ścieżka>]
 * EXIT 0 <=> brak różnic; 1 <=> >= 1 różnica; 2 <=> błąd harnessu.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const WEB_DIR = argOf('--web-dir');
if (!WEB_DIR) {
  console.error('Użycie: node tools/dom-harness/run-repin-ui2a.mjs --web-dir <katalog z gra/src origin/main> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const OUT = argOf('--out');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';

const MODULES = ['formatCompactNumber', 'recruitHudLabel', 'hudChip6c', 'unitActionBarHtml'];
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui2a-'));

/** Wejście harnessu: wspólny moduł, który eksponuje funkcje partii na `globalThis.__ui2a`. */
function writeEntry(side, uiDir) {
  const p = join(TMP, `entry-${side}.ts`);
  const imp = (m) => JSON.stringify(join(uiDir, m));
  writeFileSync(p, [
    `import * as fc from ${imp('formatCompactNumber')};`,
    `import * as rh from ${imp('recruitHudLabel')};`,
    `import * as ch from ${imp('hudChip6c')};`,
    `import * as ab from ${imp('unitActionBarHtml')};`,
    `(globalThis as any).__ui2a = { fc, rh, ch, ab };`,
    '',
  ].join('\n'));
  return p;
}

for (const m of MODULES) {
  for (const dir of [join(SRC, 'ui'), join(WEB_SRC, 'ui')]) {
    if (!existsSync(join(dir, m + '.ts'))) {
      console.error(`BRAK modułu ${join(dir, m + '.ts')}`);
      process.exit(2);
    }
  }
}

/* ── Wektory wejściowe ──────────────────────────────────────────────────────────────────────────────────── */
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rnd = lcg(20261104);
const EDGE_NUMS = [0, -0, 1, -1, 0.5, 0.05, 0.04, 12.34, -12.36, 999, 999.4, 999.94, 999.95, 999.96, 1000, 1001, -999, -1000, -1001,
  1049, 1050, 1051, 1200, 1250, 1249.9, 3042, 9999, 9950, 9949, 10000, 20860, -1200, -20860, 99_949, 99_950, 999_949, 999_950,
  999_951, 1_000_000, 1_250_000, -1_250_000, 999_949_999, 999_950_000, 1_000_000_000, 1_250_000_000, 999_950_000_000, 1e12, 1e15,
  2 ** 53, 2 ** 53 - 1, -(2 ** 53), Number.MAX_VALUE, Number.MIN_VALUE, NaN, Infinity, -Infinity, null, undefined];
const RAND_NUMS = [];
for (let i = 0; i < 600; i++) {
  const mag = 10 ** Math.floor(rnd() * 13);
  const v = (rnd() - 0.3) * mag;
  RAND_NUMS.push(i % 3 === 0 ? Math.round(v) : Math.round(v * 100) / 100);
}
const NUMS = [...EDGE_NUMS, ...RAND_NUMS];
const NOTE_PAIRS = [];
for (const v of [undefined, 0, 999, 1000, 20860, -1200, NaN, 1.5, 1_250_000]) {
  for (const r of [undefined, 0, 5, -5, 999, 1257, -1257, 1000, NaN, 0.5]) NOTE_PAIRS.push([v, r]);
}
const RECRUIT = [];
for (const lbl of ['12', '0', '1,2k', 'Rekruci <b>&', '']) {
  for (const n of [undefined, null, 0, -1, 1, 2, 7, 2.5, NaN, Infinity, 2 ** 53 - 1, 2 ** 53, -(2 ** 53)]) RECRUIT.push([lbl, n]);
}
const CHIPS = [];
for (const iconId of ['res-treasury', 'res-science', 'res-food', 'res-resources']) {
  for (const exact of [undefined, '', 'Dokładnie: 20 860 (+1 257)', 'a"<&>b']) {
    for (const act of [undefined, 'treasury']) {
      CHIPS.push({ iconId, label: 'Skarbiec', value: '20,9k', rate: '+1,3k', exact, act, title: act ? 'Tytuł "x"' : undefined });
      CHIPS.push({ iconId, label: 'Nauka & <i>', value: '7', exact, act, researchProgress: iconId === 'res-science' ? 0.37 : undefined, rateWarn: true, medVariant: undefined });
    }
  }
}
CHIPS.push({ iconId: 'res-food', iconAssetId: 'cp-granary', label: 'Żywność', value: '3', rate: '−1', rateWarn: true, valClass: ' x', medVariant: 'science' });
const ACTION_IDS = ['fortify', 'unfortify-all', 'sentry', 'scout-explore', 'split', 'merge', 'replace', 'skip', 'siege-hold', 'march-stop', 'general-follow', 'disband', 'unknown-x'];
const ACTION_SETS = [[]];
for (const id of ACTION_IDS) {
  ACTION_SETS.push([{ id, label: `Akcja ${id} <&">` }]);
  ACTION_SETS.push([{ id, label: id, active: true }]);
  ACTION_SETS.push([{ id, label: id, disabled: true, danger: true }]);
}
ACTION_SETS.push(ACTION_IDS.map((id, i) => ({ id, label: 'L' + i, active: i % 2 === 0, disabled: i % 3 === 0 })));
ACTION_SETS.push([...ACTION_IDS].reverse().map((id) => ({ id, label: id, primary: true })));

const INPUT = { NUMS, NOTE_PAIRS, RECRUIT, CHIPS, ACTION_SETS };

/** Kod wykonywany w przeglądarce: wylicza wszystkie wektory dla `globalThis.__ui2a`. Specjalne liczby przez znaczniki. */
const EVAL = (inputStr) => {
  const dec = (v) => (v && typeof v === 'object' && '__n' in v ? ({ NaN, Inf: Infinity, NInf: -Infinity, NZ: -0, U: undefined })[v.__n] : v);
  const deep = (x) => (Array.isArray(x) ? x.map(deep) : x && typeof x === 'object' && !('__n' in x)
    ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, deep(v)])) : dec(x));
  const I = deep(JSON.parse(inputStr));
  const { fc, rh, ch, ab } = globalThis.__ui2a;
  const out = {};
  const safe = (f) => { try { return f(); } catch (e) { return 'THROW:' + String(e && e.message); } };
  out.formatCompactNumber = I.NUMS.map((n) => safe(() => fc.formatCompactNumber(n)));
  out.formatCompactSigned = I.NUMS.map((n) => safe(() => fc.formatCompactSigned(n)));
  out.formatFullNumber = I.NUMS.map((n) => safe(() => fc.formatFullNumber(n)));
  out.exactCompactNote = I.NOTE_PAIRS.map(([v, r]) => safe(() => fc.exactCompactNote(v, r)));
  out.recruitHudLabel = I.RECRUIT.map(([l, n]) => safe(() => rh.recruitHudLabel(l, n === null ? undefined : n)));
  out.chip6cHtml = I.CHIPS.map((o) => safe(() => ch.chip6cHtml(o)));
  out.chip6cSep = [safe(() => ch.chip6cSep())];
  out.buildUnitActionBarHtml = I.ACTION_SETS.map((s) => safe(() => ab.buildUnitActionBarHtml(s)));
  out.UNIT_ACTION_BAR_CSS = [ab.UNIT_ACTION_BAR_CSS];
  // DOM: wstaw do dokumentu, odczytaj po parsowaniu przeglądarki.
  const host = document.getElementById('host');
  host.innerHTML = '';
  const style = document.createElement('style');
  style.textContent = ab.UNIT_ACTION_BAR_CSS + '\n.civ-hud-chip{display:inline-flex;gap:4px;font:14px sans-serif;margin:2px}';
  document.head.appendChild(style);
  const dom = [];
  for (const html of [...out.chip6cHtml.slice(0, 12), ...out.buildUnitActionBarHtml]) {
    const d = document.createElement('div');
    d.innerHTML = html;
    host.appendChild(d);
    dom.push(d.innerHTML);
  }
  out.DOM = dom;
  return out;
};
const enc = (x) => JSON.stringify(x, (_k, v) => {
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { __n: 'NaN' };
    if (v === Infinity) return { __n: 'Inf' };
    if (v === -Infinity) return { __n: 'NInf' };
    if (Object.is(v, -0)) return { __n: 'NZ' };
  }
  if (v === undefined) return { __n: 'U' };
  return v;
});
// Tablice z `undefined` — JSON.stringify zamienia na null przed replacerem tylko w tablicach; replacer dostaje undefined → znacznik.

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
function serve(dir) {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      const p = join(dir, decodeURIComponent((req.url ?? '/').split('?')[0]));
      if (!p.startsWith(dir) || !existsSync(p)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

let exitCode = 0;
let browser = null;
const servers = [];
try {
  const sides = {};
  for (const [side, uiDir] of [['web', join(WEB_SRC, 'ui')], ['port', join(SRC, 'ui')]]) {
    const outdir = join(TMP, side);
    // `build.mjs` liczy `outbase` jako wspólny prefiks wejść — drugi (pusty) plik w tym samym katalogu ustala go na TMP.
    const pad = join(TMP, `pad-${side}.ts`);
    writeFileSync(pad, 'export {};\n');
    await bundle([writeEntry(side, uiDir), pad], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${side}.js`);
    if (!entryJs) throw new Error(`${side}: brak entry-${side}.js w ${outdir}`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><body style="margin:0;background:#fff"><div id="host" style="width:900px"></div><script type="module" src="./${entryJs}"></script>`);
    sides[side] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu'] });
  const res = {};
  const consoleErrors = [];
  for (const side of ['web', 'port']) {
    const srv = await serve(sides[side]);
    servers.push(srv);
    const page = await browser.newPage({ viewport: { width: 900, height: 1400 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => consoleErrors.push(`${side}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${side}: ${m.text()}`); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
    try {
      await page.waitForFunction(() => globalThis.__ui2a !== undefined, null, { timeout: 60000 });
    } catch (e) {
      throw new Error(`${side}: moduły nie załadowane (${consoleErrors.join(' | ') || e.message})`);
    }
    const vec = await page.evaluate(EVAL, enc(INPUT));
    const ua = await page.evaluate(() => navigator.userAgent);
    const png = await page.screenshot({ fullPage: true });
    res[side] = { vec, png, ua };
    await page.close();
  }
  const results = [];
  let diffs = 0;
  for (const key of Object.keys(res.web.vec)) {
    const w = res.web.vec[key];
    const p = res.port.vec[key] ?? [];
    let d = 0;
    let first = '';
    for (let i = 0; i < Math.max(w.length, p.length); i++) {
      if (w[i] !== p[i]) {
        d++;
        if (!first) first = `#${i} web=${JSON.stringify(w[i]).slice(0, 160)} port=${JSON.stringify(p[i]).slice(0, 160)}`;
      }
    }
    const distinct = new Set(w).size;
    const coverOk = w.length >= 1 && (w.length === 1 || distinct > 1);
    diffs += d + (coverOk ? 0 : 1);
    results.push({ key, n: w.length, distinct, diffs: d, coverOk, first });
  }
  const pixEq = Buffer.compare(res.web.png, res.port.png) === 0;
  if (!pixEq) diffs++;
  if (consoleErrors.length) diffs++;
  for (const r of results) {
    console.log(`${r.key.padEnd(24)} wektory=${String(r.n).padStart(5)} różne_wyniki=${String(r.distinct).padStart(5)} różnice=${r.diffs}${r.coverOk ? '' : ' COVER-FAIL'}${r.first ? ' ' + r.first : ''}`);
  }
  const webHash = createHash('sha256').update(JSON.stringify(res.web.vec)).digest('hex');
  const pngHash = createHash('sha256').update(res.web.png).digest('hex');
  console.log(`PIX zrzut web vs port: ${pixEq ? 'identyczny' : 'RÓŻNY'} (PNG ${res.web.png.length} B, sha256 ${pngHash.slice(0, 16)}…)`);
  if (consoleErrors.length) console.log('consoleErrors:', consoleErrors.join(' | '));
  console.log(`Chromium: ${res.web.ua}`);
  if (OUT) {
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-UI-2-A-Q1', source: 'web origin/main (Chromium)', webVectorsSha256: webHash, pngSha256: pngHash, vectors: res.web.vec }, null, 1) + '\n');
  }
  console.log(`run-repin-ui2a: modułów=${MODULES.length} funkcji=${results.length} wektorów=${results.reduce((a, r) => a + r.n, 0)} różnic=${diffs} webVectorsSha256=${webHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  for (const s of servers) s.close();
  rmSync(TMP, { recursive: true, force: true });
}
process.exitCode = exitCode;
void dirname;
