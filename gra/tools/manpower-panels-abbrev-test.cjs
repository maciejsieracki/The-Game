'use strict';
/**
 * manpower-panels-abbrev-test.cjs -- R-WEB-MANPOWER-ABBREV-PANELS-Q1
 * Run: cd gra && node tools/manpower-panels-abbrev-test.cjs [--mutate]  (SHOT=<dir> [TAG=przed|po] zapisuje zrzut)
 * Panele miasta/rekrutacji/imperium + etykiety z main.ts uzywaja wspolnego formattera k/M
 * (formatManpowerCompact -> formatCompactNumber), nie "tys./mln" (formatManpower zostaje w manpower.ts).
 * --mutate: wstrzykuje formatManpower( do kopii zrodla panelu; asercje zrodlowe musza wtedy FAIL.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const MUTATE = process.argv.includes('--mutate');
const OUT = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'mp-abbr-'));
let fails = 0;
function ok(c, m) { if (c) console.log('  ok  ' + m); else { fails++; console.log('  FAIL ' + m); } }
function eq(a, b, m) { ok(a === b, m + ' -> ' + JSON.stringify(a) + (a === b ? '' : ' (oczekiwano ' + JSON.stringify(b) + ')')); }

// 1) zrodlo: zadne z paneli nie wola formatManpower( (main.ts: tylko etykiety panelowe)
for (const f of ['src/ui/cityPanel.ts', 'src/ui/unitRecruitCard.ts', 'src/ui/empireDetailPanel.ts']) {
  let src = fs.readFileSync(path.join(GRA, f), 'utf8');
  if (MUTATE && f.endsWith('cityPanel.ts')) src += '\nconst __m = formatManpower(1);\n';
  // unitRecruitCard.ts: formatManpower zostaje WYLACZNIE w manpowerStatusTitle (kontrakt title: testy recruit-card-manpower-real-render / recruitment-panel-compact-row)
  const allowed = f.endsWith('unitRecruitCard.ts') ? 3 : 0;
  const uses = (src.match(/\bformatManpower\(/g) || []).length;
  ok(uses === allowed, f + ': formatManpower( uzyte ' + uses + 'x (dozwolone ' + allowed + ')');
  ok(/formatManpowerCompact/.test(src), f + ': uzywa formatManpowerCompact');
}
let main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
if (MUTATE) main = main.replace('rekruciMaxLabel: formatManpowerCompact(', 'rekruciMaxLabel: formatManpower(');
ok(/rekruciMaxLabel: formatManpowerCompact\(/.test(main), 'main.ts: rekruciMaxLabel przez formatManpowerCompact');
ok(/rekruciLabel: economy\.rekruciLabel \?\? formatManpowerCompact\(/.test(main), 'main.ts: rekruciLabel przez formatManpowerCompact');
ok(/ludnoscAbsLabel: formatManpowerCompact\(/.test(main), 'main.ts: ludnoscAbsLabel przez formatManpowerCompact');

// 2) wartosci
(async () => {
const entry = path.join(OUT, 'e.ts');
fs.writeFileSync(entry, `export { formatManpower${process.env.TAG === 'przed' ? '' : ', formatManpowerCompact'} } from ${JSON.stringify(path.join(GRA, 'src/game/manpower.ts'))};
export { manpowerStatusTitle } from ${JSON.stringify(path.join(GRA, 'src/ui/unitRecruitCard.ts'))};\n`);
const stub = (n) => path.join(__dirname, '.stubs', n);
await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(OUT, 'e.cjs'), logLevel: 'silent',
  loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' },
  plugins: [{ name: 's', setup(b) {
    b.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: stub('recruit-strip-brandAssets-stub.ts') }));
    b.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: stub('recruit-strip-scienceOwlIcon-stub.ts') }));
    b.onResolve({ filter: /(^|\/)leaderPortraits$/ }, () => ({ path: stub('recruit-strip-leaderPortraits-stub.ts') }));
    b.onResolve({ filter: /(^|\/)muzyka-antyczna$/ }, () => ({ path: stub('recruit-strip-muzyka-stub.ts') }));
  } }] });
const M = require(path.join(OUT, 'e.cjs'));
const CASES = [[999, '999'], [1000, '1k'], [12345, '12,3k'], [1234567, '1,2M']];
for (const [n, c] of CASES) {
  eq(M.formatManpowerCompact && M.formatManpowerCompact(n), c, 'formatManpowerCompact ' + n);
  const t = M.manpowerStatusTitle(n, n);
  eq(t, 'Rekruci: dostępne ' + M.formatManpower(n) + ' / potrzebne ' + M.formatManpower(n), 'tooltip karty bez zmian (formatManpower) ' + n);
}
eq(M.formatManpower(12345), '12.3 tys.', 'formatManpower bez zmian (12345)');
eq(M.formatManpower(1234567), '1.2 mln', 'formatManpower bez zmian (1234567)');

// 3) zrzut Chromium
  if (!process.env.SHOT) return;
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
  const page = await browser.newPage({ viewport: { width: 420, height: 150 } });
  const f = (n) => (process.env.TAG === 'przed' ? M.formatManpower(n) : M.formatManpowerCompact(n));
  await page.setContent('<meta charset="utf-8"><body style="background:#202936;color:#eee;font:15px sans-serif;padding:10px">'
    + CASES.map(([n]) => `<div>Koszt rekrutow: <b>${f(n)}</b> &middot; Pula: ${f(n * 3)}</div>`).join('')
    + `<div style="margin-top:6px;color:#aaa">tooltip: ${M.manpowerStatusTitle(12345, 20000)}</div>`);
  await page.screenshot({ path: path.join(process.env.SHOT, (process.env.TAG || 'po') + '.png') });
  await browser.close();
})().catch((e) => { fails++; console.log('  FAIL wyjatek: ' + (e && e.stack || e)); }).finally(() => {
  try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (_) {}
  console.log(fails ? `\nFAIL (${fails})` : '\nOK: manpower-panels-abbrev-test');
  process.exit(fails ? 1 : 0);
});
