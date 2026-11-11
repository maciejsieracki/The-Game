'use strict';
/**
 * tech-discovery-notice-resource-chips-test.cjs — R-WEB-UI-RESOURCE-ICONS-TECH-DISCOVERY-NOTICE-Q1.
 *
 * Okno odkrycia technologii (`src/ui/techDiscoveryNotice.ts`, `showTechDiscoveryNotice`) renderowane
 * na PRAWDZIWYM kodzie (esbuild bundle + Chromium/Playwright), dla KAŻDEJ technologii z `tech.json`.
 * Kryteria:
 *   [P] tech.json ma technologie do sprawdzenia;
 *   [B] okno otwiera się dla każdej technologii i nie generuje błędów w konsoli / pageerror;
 *   [A] zero gołych nazw surowców/plonów w widocznym tekście okna (chipy `.bld-res-chip` są pomijane —
 *       ich nazwa żyje wyłącznie w title/aria-label ikony).
 *
 * Usage (z gra/): node tools/tech-discovery-notice-resource-chips-test.cjs
 * Diagnostyka: AUDIT_VERBOSE=1 node tools/tech-discovery-notice-resource-chips-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[tech-discovery-notice-resource-chips-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.tech-discovery-notice-resource-chips-entry.ts');
const OUTFILE = path.resolve(__dirname, '.tech-discovery-notice-resource-chips-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Ikony brandu zastąpione niepustym SVG (jak w grze), żeby chip z ikoną nie zawierał tekstu —
// test widzi wtedy dokładnie to, co zobaczy gracz (liczba + symbol, bez nazwy).
const BRAND_STUB_SRC = [
  "const svg = (id, size) => '<svg width=\"' + (size || 24) + '\" height=\"' + (size || 24) + '\" data-icon=\"' + (id || '') + '\"></svg>';",
  'export function brandIconSvg(id, size) { return svg(id, size); }',
  'export function mapResourceIconSvg(id, size) { return svg(id, size); }',
  "export function terrainIconSvg(id, size) { return svg(id, size); }",
  "export function buildingIconSvg(def, id) { return svg(id, 24); }",
  "export function unitIconSvg(u, id) { return svg(id, 24); }",
  "export function improvementIconSvg(key, size) { return svg(key, size); }",
  "export function civIconSvg(id, size) { return svg(id, size); }",
  "export function epochIconSvg(id, size) { return svg(id, size); }",
  "export function settingIconSvg(key, size) { return svg(key, size); }",
  "export function brandMenuComponentsCss() { return ''; }",
  "export function menuIconSvg(id, size) { return svg(id, size); }",
  "export function brandMenuEmblemSvg() { return ''; }",
  "export function newGameIntroEmblemSvg(size) { return ''; }",
  "export function brandMotionCss() { return ''; }",
  "export function brandMenuBackgroundCss() { return ''; }",
  "export function svgThumbHtml(s) { return s; }",
].join('\n');

const stubPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brand-assets-stub', namespace: 'stub' }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: BRAND_STUB_SRC, loader: 'ts' }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

// Gołe nazwy surowców i plonów (mianownik + odmiany), czyli wszystko, co ma chip w YIELD_CHIP
// albo STOCK_RESOURCE_LABEL. Dopasowanie po rdzeniu wyrazu z granicami słowa.
// Formy rzeczowników-surowców i plonów (mianownik, dopełniacz, biernik, miejscownik) — wyłącznie
// słowa, które w tekście okna oznaczają surowiec/plon, a nie technologię, epokę czy przymiotnik.
const BARE_RE = new RegExp(
  '(?<![\\p{L}])(' + [
    // plony
    'żywność', 'żywności', 'żywnością', 'praca', 'pracy', 'pracę', 'pracą',
    'kultura', 'kultury', 'kulturę', 'kulturze', 'nauka', 'nauki', 'naukę', 'nauce',
    'wiara', 'wiary', 'wiarę', 'wiarze',
    'podatek', 'podatku', 'podatki', 'podatków', 'podatkiem',
    'pieniądz', 'pieniądza', 'pieniędzy', 'pieniądze', 'pieniądzem',
    'wpływ', 'wpływu', 'wpływy', 'wpływów',
    // surowce magazynu
    'drewno', 'drewna', 'drewnem', 'kamień', 'kamienia', 'kamieniem',
    'glina', 'gliny', 'glinę', 'glinie',
    'ruda', 'rudy', 'rudę', 'rudzie',
    'cegła', 'cegły', 'cegłę', 'cegle', 'cegieł',
    'ceramika', 'ceramiki', 'ceramikę', 'ceramice',
    'sól', 'soli', 'solę', 'solą',
    'żelazo', 'żelaza', 'żelazem',
    'złoto', 'złota', 'złotem',
    'węgiel', 'węgla', 'węglem', 'węgle',
    'stal', 'stali', 'stalą',
    'koń', 'konia', 'koni', 'koniem',
    'bydło', 'bydła', 'bydłem',
    'owce', 'owiec', 'owcami', 'lama', 'lamy', 'lamę',
    'trzoda', 'trzody', 'trzodę', 'trzodą',
  ].join('|') + ')(?![\\p{L}])',
  'giu',
);

/** Nazwy własne z danych (technologie, budynki, ulepszenia terenu, jednostki), dłuższe najpierw. */
function properNamesFromData() {
  const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(GRA, rel), 'utf8'));
  const collect = (src) => {
    const rows = Array.isArray(src) ? src : Object.entries(src).filter(([k]) => !k.startsWith('_')).map(([k, v]) => ({ key: k, ...v }));
    return rows.flatMap((r) => [r.nazwa, r.Jednostka, r.Technologia, r.key].filter((x) => typeof x === 'string'));
  };
  const names = new Set([
    ...collect(readJson('data/tech.json').technologie),
    ...collect(readJson('data/buildings.json')),
    ...collect(readJson('data/terrain-improvements.json')),
    ...collect(readJson('data/units.json')),
  ]);
  return [...names].filter((n) => n.length >= 4 && /\p{L}/u.test(n)).sort((a, b) => b.length - a.length);
}

// Kontekst, w którym słowo-surowiec jest częścią nazwy własnej (budynku, ulepszenia, technologii, cudu,
// epoki) albo nazwą ulepszenia terenu w zdaniu „Postaw …” — nie jest wtedy gołą nazwą surowca.
const NOT_BARE_BEFORE = new RegExp(
  '(?:Obróbk\\p{L}*|Hutnictw\\p{L}*|Odlew\\p{L}*|Kuźn\\p{L}*|Kopaln\\p{L}*|Kamieniołom\\p{L}*|'
  + 'Garncarn\\p{L}*|Glinian\\p{L}*|Warzeln\\p{L}*|Cegieln\\p{L}*|Murarstw\\p{L}*|Postaw|epok\\p{L}*|epoce|Wyścig|Cud)\\s+$',
  'u',
);
const NOT_BARE_AFTER = /^\s*(Ha'amonga|Ha’amonga)/u;

async function main() {
  const techs = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8')).technologie;
  check('[P] tech.json ma technologie do sprawdzenia', techs.length > 0, techs.length);

  fs.writeFileSync(ENTRY, [
    "import { showTechDiscoveryNotice, hideTechDiscoveryNotice } from '../src/ui/techDiscoveryNotice.ts';",
    "import { escapeHtmlText } from '../src/ui/resourceAmountChip.ts';",
    'window.__esc = escapeHtmlText;',
    'window.__show = (name, kind) => showTechDiscoveryNotice({ techName: name, kind: kind || "completion" });',
    'window.__hide = hideTechDiscoveryNotice;',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, plugins: [stubPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.setContent('<html><body style="margin:0;background:#0b0e14;color:#e8e0c8"></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

  const report = await page.evaluate((args) => {
    const names = args.techs;
    const out = [];
    for (const name of names) {
      window.__hide();
      window.__show(name, 'completion');
      const host = document.getElementById('civ-tech-discovery-notice-host');
      if (!host) { out.push({ name, missingHost: true }); continue; }
      // Tekst WIDOCZNY: węzły tekstowe poza <style>/<script>, ukrytymi ([hidden]) i chipami.
      // Nazwy epok („Epoka Kamień”, „Awans do epoki Brąz”) to nie surowce — wycinane przed dopasowaniem.
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      const parts = [];
      let node;
      while ((node = walker.nextNode())) {
        const p = node.parentElement;
        // „Rys historyczny” to proza historyczna (np. „podział pracy”), nie sekcja kart z plonami — poza zakresem.
        if (!p || p.closest('style,script,[hidden],.bld-res-chip,.entity-card-historia')) continue;
        parts.push(node.nodeValue);
      }
      let text = parts.join(' ')
        .replace(/\b(Epoka|epoka|epoki|Epoki|epoce|Epoce)\s+\S+/g, ' ')
        .replace(/Kamień milowy\s*—[^·]*/g, ' ')
        .replace(/Koszt nauki/g, ' ');
      // Nazwy własne (technologie, budynki, ulepszenia, jednostki) zawierające słowo-surowiec
      // („Obróbka drewna”, „Warzelnia soli”, „Brązownictwo”) to nie gołe nazwy surowców — wycinane.
      for (const nm of args.properNames) text = text.split(nm).join(' ');
      out.push({ name, text, chips: host.querySelectorAll('.bld-res-chip').length });
    }
    window.__hide();
    return out;
  }, { techs: techs.map((t) => t.Technologia), properNames: properNamesFromData() });

  let missingHost = 0;
  let chipTotal = 0;
  const hitsByTech = [];
  for (const row of report) {
    if (row.missingHost) { missingHost++; continue; }
    chipTotal += row.chips;
    const hits = [];
    for (const m of row.text.matchAll(BARE_RE)) {
      const at = m.index ?? 0;
      const before = row.text.slice(Math.max(0, at - 40), at);
      const after = row.text.slice(at + m[0].length, at + m[0].length + 20);
      // Poza zakresem (nie są gołymi nazwami surowców/plonów, lecz nazwami własnymi / epok / ulepszeń):
      if (NOT_BARE_BEFORE.test(before) || NOT_BARE_AFTER.test(after)) continue;
      // Wielka litera w środku zdania = nazwa epoki („Żelaza”) albo nazwa własna — jak w `resourceRows` (eraGuard).
      if (/\p{Lu}/u.test(m[0][0]) && /\S\s$/.test(before) && !/[.:!?]\s*$/.test(before)) continue;
      hits.push({ w: m[0], ctx: row.text.slice(Math.max(0, at - 45), at + m[0].length + 25).replace(/\s+/g, ' ') });
    }
    if (hits.length) hitsByTech.push({ name: row.name, hits });
  }
  if (process.env.AUDIT_VERBOSE) console.log(JSON.stringify({ chipTotal, hitsByTech }, null, 1));
  check('[B] okno otwiera się dla każdej technologii (brak hosta)', missingHost === 0, { missingHost });
  check('[B] brak błędów w konsoli/pageerror podczas renderu', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  check('[A] zero gołych nazw surowców/plonów w tekście okna (wszystkie technologie)', hitsByTech.length === 0,
    hitsByTech.slice(0, 20));

  // [X] Ekranowanie: nazwy i kwoty z danych nie tworzą elementów HTML w oknie; escapowanie tekstu działa.
  const xss = await page.evaluate((names) => {
    const injected = [];
    for (const name of names) {
      window.__hide();
      window.__show(name, 'completion');
      const host = document.getElementById('civ-tech-discovery-notice-host');
      if (host) injected.push(...Array.from(host.querySelectorAll('script, iframe, [onerror], [onload]')).map((el) => el.tagName));
    }
    window.__hide();
    return { injected, escaped: window.__esc('<img src=x onerror=alert(1)>') };
  }, techs.map((t) => t.Technologia));
  check('[X] okno nie zawiera wstrzykniętych elementów (script/iframe/onerror/onload)', xss.injected.length === 0, xss.injected.slice(0, 5));
  check('[X] escapeHtmlText zamienia znaczniki na encje', !xss.escaped.includes('<img'), xss.escaped);

  if (process.env.SCREENS) {
    const dir = path.resolve(process.env.SCREENS);
    fs.mkdirSync(dir, { recursive: true });
    for (const name of ['Garncarstwo', 'Rolnictwo']) {
      await page.evaluate((n) => { window.__hide(); window.__show(n, 'completion'); }, name);
      await page.locator('#civ-tech-discovery-notice-host .tdn-stage').screenshot({ path: path.join(dir, `okno-odkrycia-${name}.png`) });
    }
    await page.evaluate(() => window.__hide());
    console.log('[screens] ' + dir);
  }

  await browser.close();
  console.log(`\n${pass} pass, ${fail} fail (technologii: ${techs.length}, chipów łącznie: ${chipTotal})`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
