'use strict';
/**
 * memory-static-ascii-bundle-test.cjs -- R-WEB-MEMORY-STATIC-FOOTPRINT-Q1 (A): bundle JS zapisany wylacznie w ASCII.
 *
 * Porownuje dwa buildy vite (poza repo): --a PRZED (bez wtyczki ascii-only-js), --b PO (z wtyczka).
 *   S1 -- glowny skrypt (i kazdy inny <script>) w PO ma wylacznie znaki ASCII (zrodlo trzymane jako 1-bajtowy string);
 *   S2 -- wzrost rozmiaru index.html <= 5% (ucieczki \uXXXX zamiast 2-4 bajtow UTF-8);
 *   S3 -- escapeNonAsciiForJs (z vite.config.ts) na przypadkach brzegowych: literal tekstowy, szablon, regex z flaga u
 *         i bez, klasa znakow, ucieczka tozsamosciowa `\ł`, znaki spoza BMP, identyfikator -- wartosc po eval identyczna;
 *   S4 -- rownowaznosc semantyczna calego skryptu: esbuild (parser) wypisuje oba skrypty z charset ascii; jedyne roznice
 *         to literaly regex (esbuild ich nie przepisuje), a po zastosowaniu escapeNonAsciiForJs do wyniku PRZED teksty
 *         sa identyczne bajt w bajt;
 *   S5 -- (--chromium) DOM: pelny textContent strony menu i `?playtest=mapa` (bez <script>/<style>), tekst widoczny
 *         (innerText) oraz atrybuty title/placeholder/aria-label identyczne w PRZED i PO (polskie litery dzialaja tak
 *         samo), w tym liczba znakow spoza ASCII;
 *   S6 -- (--chromium) Cywilopedia otwarta przyciskiem paska, przejscie po pozycjach: tekst artykulow identyczny.
 * Usage: node tools/memory-static-ascii-bundle-test.cjs --a <dist PRZED> --b <dist PO> --gra <kopia gra z node_modules>
 *          [--chromium]
 */
const fs = require('fs');
const path = require('path');
const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const A = opt('a'); const B = opt('b'); const GRA = opt('gra');
if (!A || !B || !GRA) { console.error('podaj --a <dist> --b <dist> --gra <kopia gra z node_modules>'); process.exit(2); }
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
let pass = 0; let fail = 0;
const ok = (label, cond, detail) => { if (cond) { pass++; console.log('  OK  ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } };

function scripts(html) {
  const out = []; const re = /<script\b[^>]*>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}
const nonAscii = (s) => { let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 127) n++; return n; };

async function main() {
  const htmlA = fs.readFileSync(path.join(A, 'index.html'), 'utf8');
  const htmlB = fs.readFileSync(path.join(B, 'index.html'), 'utf8');
  const sA = scripts(htmlA); const sB = scripts(htmlB);
  const mainA = sA.reduce((x, y) => (y.length > x.length ? y : x), '');
  const mainB = sB.reduce((x, y) => (y.length > x.length ? y : x), '');
  ok('S0 PRZED ma znaki spoza ASCII w glownym skrypcie (inaczej test nic nie mierzy)', nonAscii(mainA) > 1000, { nonAscii: nonAscii(mainA), chars: mainA.length });
  ok('S1 PO: glowny skrypt tylko ASCII', nonAscii(mainB) === 0, { nonAscii: nonAscii(mainB), chars: mainB.length });
  const bytesA = Buffer.byteLength(htmlA); const bytesB = Buffer.byteLength(htmlB);
  const grow = (bytesB - bytesA) / bytesA;
  ok('S2 wzrost index.html <= 5%', grow <= 0.05, { bytesA, bytesB, growPct: Math.round(grow * 10000) / 100 });

  // S3: funkcja z vite.config.ts (transpilacja esbuild; importy vite/wtyczki rozwiazywane z kopii gra)
  const esbuild = require(path.join(path.resolve(GRA), 'node_modules', 'esbuild'));
  const cfgSrc = fs.readFileSync(path.join(__dirname, '..', 'vite.config.ts'), 'utf8');
  const cjs = esbuild.transformSync(cfgSrc, { loader: 'ts', format: 'cjs' }).code;
  const tmp = path.join(path.resolve(GRA), '.ascii-test-vite-config.cjs');
  fs.writeFileSync(tmp, cjs);
  let esc;
  try { esc = require(tmp).escapeNonAsciiForJs; } finally { fs.unlinkSync(tmp); }
  ok('S3 escapeNonAsciiForJs eksportowane', typeof esc === 'function');
  const cases = [
    "'Zażółć gęślą jaźń'",
    '`Łódź ${1 + 1} — „cytat”`',
    "'\\ł\\\\ł'",
    "/[ąćęłńóśźż]+/g.test('źdźbło')",
    "/^(OK|Wróć|Pomiń)$/i.test('wróć')",
    "/\\ł/.test('ł')",
    "/[🍞✅]/u.test('🍞')",
    "'🍞👤'.length",
    "/🍞/.exec('a🍞')[0]",
    "(function(){ var zażółć = 3; return zażółć * 2; })()",
    "JSON.stringify({ 'klucz ą': 'wartość ę' })",
    "'a\\u2028b'.length + ' '.length",
  ];
  for (const c of cases) {
    const e = esc(c);
    let va; let vb; let err = null;
    try { va = (0, eval)(c); vb = (0, eval)(e); } catch (x) { err = String(x); }
    ok('S3 ' + c.slice(0, 40), !err && nonAscii(e) === 0 && JSON.stringify(va) === JSON.stringify(vb), err ? { err } : { escaped: e.slice(0, 60) });
  }

  // S4: rownowaznosc semantyczna calego skryptu
  const norm = (code) => esbuild.transformSync(code, { charset: 'ascii', minify: false, loader: 'js' }).code;
  const nA = norm(mainA); const nB = norm(mainB);
  const nAesc = esc(nA);
  let firstDiff = -1;
  if (nAesc !== nB) { const L = Math.min(nAesc.length, nB.length); for (let i = 0; i < L; i++) if (nAesc[i] !== nB[i]) { firstDiff = i; break; } if (firstDiff < 0) firstDiff = L; }
  ok('S4 esbuild(PRZED)+ucieczki === esbuild(PO) (jedyna roznica: literaly regex)', nAesc === nB,
    firstDiff >= 0 ? { firstDiff, a: nAesc.slice(firstDiff - 40, firstDiff + 40), b: nB.slice(firstDiff - 40, firstDiff + 40) } : { chars: nB.length, regexOnlyDiffs: nA !== nB });

  if (argv.includes('--chromium')) {
    const { chromium } = require(path.join(path.resolve(GRA), 'node_modules', 'playwright'));
    const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
      args: ['--no-sandbox', '--headless=new', '--js-flags=--expose-gc', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    try {
      const dump = async (dist, query, readyFn) => {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
        await page.addInitScript(() => { let s = 12345; Math.random = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; }; });
        await page.goto('file://' + path.join(path.resolve(dist), 'index.html') + query, { waitUntil: 'load', timeout: 180000 });
        await page.waitForFunction(readyFn, undefined, { timeout: 240000 });
        await new Promise((r) => setTimeout(r, 2500));
        const d = await page.evaluate(() => {
          // tekst DOM bez <script>/<style> (zrodlo skryptu z definicji rozni sie zapisem \uXXXX)
          const clone = document.documentElement.cloneNode(true);
          for (const el of Array.from(clone.querySelectorAll('script,style'))) el.remove();
          const t = clone.textContent || '';
          const vis = document.body.innerText || '';
          const attrs = []; for (const el of Array.from(document.querySelectorAll('[title],[placeholder],[aria-label]'))) attrs.push((el.getAttribute('title') || '') + '|' + (el.getAttribute('placeholder') || '') + '|' + (el.getAttribute('aria-label') || ''));
          let na = 0; for (let i = 0; i < t.length; i++) if (t.charCodeAt(i) > 127) na++;
          return { text: t.replace(/\s+/g, ' '), vis: vis.replace(/\s+/g, ' '), attrs: attrs.join('\n'), nonAscii: na, title: document.title };
        });
        // S6: Cywilopedia -- otworz przyciskiem paska i przejdz po pozycjach (tekst artykulow pochodzi z bundla)
        d.wiki = await page.evaluate(async () => {
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          const btn = Array.from(document.querySelectorAll('button')).find((el) => el.offsetParent !== null
            && /civpedia|cywilopedi|encyklopedi/i.test((el.getAttribute('title') || '') + ' ' + (el.getAttribute('aria-label') || '')));
          if (!btn) return { opened: false };
          btn.click(); await sleep(600);
          const hub = document.querySelector('.civ-wiki-hub');
          if (!hub) return { opened: false, clicked: true };
          const parts = [hub.textContent || ''];
          const items = Array.from(hub.querySelectorAll('.wh-item')).slice(0, 80);
          for (const it of items) { it.click(); await sleep(40); const c = hub.querySelector('.wh-content'); parts.push(c ? c.textContent || '' : ''); }
          return { opened: true, items: items.length, text: parts.join('\n').replace(/\s+/g, ' ') };
        });
        await page.close();
        return { ...d, errs };
      };
      for (const [q, label, fn] of [
        ['', 'menu', () => !!document.querySelector('.civ-menu')],
        ['?playtest=mapa', 'playtest=mapa', () => !!window.__fortTerritoryTestDebug && window.__fortTerritoryTestDebug.state().citiesLen > 0],
      ]) {
        const da = await dump(A, q, fn); const db = await dump(B, q, fn);
        let fd = -1; if (da.text !== db.text) { for (let i = 0; i < Math.min(da.text.length, db.text.length); i++) if (da.text[i] !== db.text[i]) { fd = i; break; } }
        ok(`S5 ${label}: textContent identyczny`, da.text === db.text && da.attrs === db.attrs && da.title === db.title,
          { chars: db.text.length, nonAscii: [da.nonAscii, db.nonAscii], firstDiff: fd, a: fd >= 0 ? da.text.slice(fd - 30, fd + 30) : undefined, b: fd >= 0 ? db.text.slice(fd - 30, fd + 30) : undefined });
        ok(`S5 ${label}: tekst widoczny identyczny i z polskimi literami`, da.vis === db.vis && /[ąćęłńóśźżŁŚŻ]/.test(db.vis), { visChars: db.vis.length, sample: db.vis.slice(0, 80) });
        ok(`S5 ${label}: brak bledow strony w PO (jak w PRZED)`, db.errs.length === da.errs.length, { a: da.errs, b: db.errs });
        if (label === 'playtest=mapa') {
          ok('S6 Cywilopedia otwarta i przegladana w obu buildach', da.wiki.opened && db.wiki.opened && db.wiki.items > 10, { a: { opened: da.wiki.opened, items: da.wiki.items }, b: { opened: db.wiki.opened, items: db.wiki.items } });
          ok('S6 Cywilopedia: tekst artykulow identyczny i z polskimi literami', da.wiki.opened && da.wiki.text === db.wiki.text && /[ąćęłńóśźż]/.test(db.wiki.text || ''), { chars: (db.wiki.text || '').length });
        }
      }
    } finally { await browser.close(); }
  }
  console.log(`\nWYNIK: ${pass} OK / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
