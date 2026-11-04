#!/usr/bin/env node
/**
 * run-repin-ui2g.mjs — harness partii REPIN UI-2-G r1 (R-RUSTPORT-REPIN-UI-2-G-Q1): bloki K przepięte na web `86d510c66`
 * z DRYFEM treści (P5-REPIN-UI-2 §3/§6) — nowe hunki webu vs port, w Chromium.
 *
 * Jednostki (hunk webu → co sprawdzają wektory):
 *   K01B queueItemCumulativeEta  4. parametr `buildingPracaPerTurn` (Praca budynków ≠ Praca jednostek; ≤0 → null)
 *   K01A formatBuildEtaLabel     (blok przepięty: zmiana wyłącznie komentarza następnej deklaracji; wektory kontrolne)
 *   K05A recruitManpowerCost     `cfg.getManpowerMultipliers` (maxMult/costMult) i 4. argument `unitManpowerCostForType`
 *   K05A unitStockCostChipsHtml  tekst „(brak)” w chipie brakującego surowca
 *   K05A formatBuildingCatalogLockHint  4. parametr `brakZasobow` („Brakuje: …”)
 *   K06A tileYieldLabel          2. parametr `ownerEra` → `wlascicielEra` reguły plonów (plony ulepszeń +1/epokę)
 *
 * WEB:  CAŁY moduł `gra/src/ui/cityPanel.ts` z `--web-dir` (`git archive 86d510c66 gra/src gra/data`), z `export` dopisanym
 *       do deklaracji najwyższego poziomu (treść bez zmian), spakowany `build.mjs` i WYKONANY w Chromium (Playwright).
 *       Konfiguracja webu = `configureCityPanel(cfg)` (ta sama funkcja, którą woła `main.ts`).
 * PORT: moduły `src/ui/cityPanel/k0*.ts` frontend-v2 w TEJ SAMEJ stronie Chromium. Wejścia reguł portu (setK05aRules,
 *       setK06aDeps, ustawRegulyKontrolera) = funkcje silnika webu z tego samego pakietu (port UI nie liczy reguł —
 *       K05A-Z4/K06A-Z4/K01B-Z3); cfg portu = ten sam obiekt cfg co po stronie webu.
 *
 * Bramki (EXIT 0 ⇔ wszystkie):
 *   VEC   każdy wektor: wynik web === port (string/JSON; wyjątek = 'THROW:<komunikat>' po obu stronach);
 *   HUNK  dla każdego nowego hunku istnieje wektor, w którym web rozróżnia wariant hunku (np. z/bez multipliers) —
 *         lista `HUNK_PROBES` (wynik webu dla pary wektorów różny);
 *   DOM   chipy i podpowiedzi blokady wstawione do `#host` (innerHTML po parsowaniu przeglądarki) web === port;
 *   PIX   zrzuty PNG sceny DOM w 1280×720 i 360×640: web vs port bajtowo równe;
 *   ERR   `pageerror` + `console.error` = 0.
 * `--out <plik.json>` zapisuje wektory WEB (+ sha256) — fixtura `fixtures/repin_ui2g-web-vectors.json`.
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui2g.mjs --web-dir <WEB 86d510c66> [--src <src>] [--out <plik>] [--png-dir <dir>]
 * EXIT 0 ⇔ 0 różnic; 1 ⇔ ≥1 różnica; 2 ⇔ błąd harnessu.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const WEB_DIR = argOf('--web-dir');
if (!WEB_DIR || !existsSync(join(WEB_DIR, 'gra/src/ui/cityPanel.ts'))) {
  console.error('Użycie: node tools/dom-harness/run-repin-ui2g.mjs --web-dir <katalog git archive 86d510c66 gra/src gra/data> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
const TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui2g-'));
const WEB_REF = join(WEB_SRC, 'ui/__ui2g_web_ref.ts');

/* ── Odniesienie webu: cityPanel.ts z `export` na deklaracjach najwyższego poziomu (treść bez zmian) ─────────────── */
const TOP_DECL = /^(const|let|var|function|class|type|interface|enum|async function)\s/;
const webLines = readFileSync(join(WEB_SRC, 'ui/cityPanel.ts'), 'utf8').split('\n');
const refBody = webLines.map((l) => (TOP_DECL.test(l) ? 'export ' + l : l));
// Funkcje silnika importowane przez sam moduł webu (te same wiązania) — wejścia reguł portu.
refBody.push('export const __engine = { tileYield, improvementKeysForHex, techIconHintSpan, isEmptyDataVal, naukaCostSuffix, getTechDef,'
  + ' loadGameData, civManpowerMaxMult, unitManpowerCostForType, etaTurns, unitStockCost, stockResourceLabel, isUnitRecruitStockChipMissing };');
writeFileSync(WEB_REF, refBody.join('\n'));

const webEntry = join(TMP, 'entry-web.ts');
// `techPrereqChain` (data, nazwa) jest funkcją modułu cityPanel webu (nie game/tech-tree) — z odniesienia.
writeFileSync(webEntry, `import * as W from ${JSON.stringify(WEB_REF)};\n(globalThis as any).__web = { ...W, __engine: { ...W.__engine, techPrereqChain: W.techPrereqChain } };\n`);
const portEntry = join(TMP, 'entry-port.ts');
const cp = (m) => JSON.stringify(join(SRC, 'ui/cityPanel', m));
writeFileSync(portEntry, [
  `import { installStaticCatalog } from ${JSON.stringify(join(SRC, 'controller/staticCatalog'))};`,
  `(globalThis as any).__portInit = async (catalog: any) => {`,
  `  installStaticCatalog(catalog);`,
  `  const [k01a, k01br, k01breg, k05a, k06a] = await Promise.all([import(${cp('k01a-fundament')}), import(${cp('k01b-r')}), import(${cp('k01b-reguly')}), import(${cp('k05a-fundament')}), import(${cp('k06a-fundament')})]);`,
  `  (globalThis as any).__port = { k01a, k01br, k01breg, k05a, k06a };`,
  `};`,
  '',
].join('\n'));

/* ── Kod w przeglądarce ───────────────────────────────────────────────────────────────────────────────────────── */
const EVAL = async (uiParamsStr) => {
  const W = globalThis.__web;
  const E = W.__engine;
  await globalThis.__portInit({ uiParams: JSON.parse(uiParamsStr), unitCategory: {}, unitCategoryNameOnly: {} });
  const P = globalThis.__port;
  const data = E.loadGameData();
  const safe = (f) => { try { const v = f(); return typeof v === 'string' ? v : JSON.stringify(v === undefined ? '__undef' : v); } catch (e) { return 'THROW:' + String(e && e.message); } };
  const out = { web: {}, port: {} };
  const put = (key, w, p) => { (out.web[key] ??= []).push(safe(w)); (out.port[key] ??= []).push(safe(p)); };

  // Wspólny cfg (web: configureCityPanel; port: setK05aCfg) — wariant przez zmienną `variant`.
  const cities = [
    { id: 1, ownerId: 0, q: 0, r: 0, name: 'A', population: 3, surowce: { drewno: 4, kamien: 0 } },
    { id: 2, ownerId: 0, q: 1, r: 0, name: 'B', population: 2, surowce: { drewno: 9, ruda: 2, glina: 1 } },
    { id: 3, ownerId: 1, q: 5, r: 0, name: 'C', population: 1, surowce: {} },
  ];
  let variant = 0;
  const cfg = {
    getEpoch: (o) => [undefined, 1, 2, 3, 5][(o + variant) % 5],
    getCivBonusy: (o) => (variant % 2 === 0 ? undefined : [{ typ: 'manpower', o }]),
    getManpowerMultipliers: (o) => (variant % 3 === 0 ? undefined : { maxMult: 1 + (o + variant) % 3 * 0.5, costMult: [0.5, 1, 1.25, 2][(o + variant) % 4] }),
    getCities: () => (variant % 4 === 3 ? undefined : cities),
  };
  W.configureCityPanel(cfg);
  P.k05a.setK05aCfg(cfg);
  P.k05a.setK05aRules({
    civManpowerMaxMult: E.civManpowerMaxMult,
    unitManpowerCostForType: E.unitManpowerCostForType,
    ownerSurowcePoolFor: W.ownerSurowcePoolFor,
    stockResourceLabel: E.stockResourceLabel,
    unitStockCost: E.unitStockCost,
    isUnitRecruitStockChipMissing: E.isUnitRecruitStockChipMissing,
    techPrereqChain: E.techPrereqChain,
    techIconHintSpan: E.techIconHintSpan,
    getTechDef: E.getTechDef,
    isEmptyDataVal: E.isEmptyDataVal,
    naukaCostSuffix: E.naukaCostSuffix,
    improvementKeysForHex: E.improvementKeysForHex,
  });
  P.k06a.setK06aDeps({ tileYield: E.tileYield, cityPanelChipIconWrap: W.cityPanelChipIconWrap });
  P.k01breg.ustawRegulyKontrolera({ etaTurns: E.etaTurns });

  // K01B queueItemCumulativeEta
  const it = (kind, koszt) => ({ id: kind + koszt, kind, koszt, nazwa: kind });
  const queues = [
    { kolejka: [it('budynek', 10), it('budynek', 7), it('jednostka', 5), it('budynek', 3)], postep: 2 },
    { kolejka: [it('jednostka', 6), it('budynek', 9), it('budynek', 4)], postep: 0 },
    { kolejka: [it('budynek', 1), it('jednostka', 1)], postep: 5 },
    { kolejka: [it('budynek', 10), it('budynek', 7)], postep: 1, wstrzymana: true },
    { kolejka: [it('cud', 30), it('budynek', 12), it('jednostka', 8)], postep: 29 },
  ];
  for (const q of queues) for (let i = 0; i < 4; i++) for (const pr of [0, 1, 3, 7, -1, NaN]) for (const bp of [undefined, 0, 2, 5, -2, NaN, 0.5]) {
    put('queueItemCumulativeEta', () => W.queueItemCumulativeEta(q, i, pr, bp), () => P.k01br.queueItemCumulativeEta(q, i, pr, bp));
  }
  // K01A formatBuildEtaLabel (kontrolnie)
  for (const t of [null, 0, 1, 2, 4, 5, 12, 22, 101]) for (const pre of [undefined, '~', '', 'za ']) {
    put('formatBuildEtaLabel', () => W.formatBuildEtaLabel(t, pre), () => P.k01a.formatBuildEtaLabel(t, pre));
  }
  // K05A recruitManpowerCost
  const unitIds = (data.units ?? []).map((u) => u.Jednostka).filter(Boolean);
  const typeIds = [...unitIds.slice(0, 40), 'nieznana', ''];
  for (variant = 0; variant < 12; variant++) for (const c of cities) for (const t of typeIds) {
    put('recruitManpowerCost', () => W.recruitManpowerCost(c, t), () => P.k05a.recruitManpowerCost(c, t));
  }
  // K05A unitStockCostChipsHtml
  const stockUnits = (data.units ?? []).filter((u) => Object.keys(E.unitStockCost(u)).length > 0);
  const dom = { web: [], port: [] };
  for (variant = 0; variant < 4; variant++) for (const c of cities) for (const u of stockUnits) {
    put('unitStockCostChipsHtml', () => W.unitStockCostChipsHtml(u, c), () => P.k05a.unitStockCostChipsHtml(u, c));
  }
  // K05A formatBuildingCatalogLockHint
  const techs = (data.techs ?? []).map((t) => t.nazwa ?? t.Nazwa ?? t.name).filter(Boolean);
  const entries = [];
  for (const status of ['built', 'queued', 'ready', 'locked', 'available']) {
    for (const lb of [undefined, 'stolica', 'region']) {
      for (const mt of [undefined, techs[3], techs[17], techs[techs.length - 1], 'NieznanaTech']) {
        for (const wym of [undefined, '', 'Wymaga rzeki', '-']) entries.push({ id: 'b', status, locationBlocked: lb, missingTech: mt, wymagania: wym });
      }
    }
  }
  const unlockedSets = [[], techs.slice(0, 5), techs.slice(0, 40)];
  const braki = [undefined, [], ['Drewno'], ['Glina', 'Ruda'], ['<b>&']];
  for (const e of entries) for (const un of unlockedSets) for (const br of braki) {
    put('formatBuildingCatalogLockHint', () => (br === undefined ? W.formatBuildingCatalogLockHint(e, data, un) : W.formatBuildingCatalogLockHint(e, data, un, br)),
      () => (br === undefined ? P.k05a.formatBuildingCatalogLockHint(e, data, un) : P.k05a.formatBuildingCatalogLockHint(e, data, un, br)));
  }
  // K06A tileYieldLabel
  const hexes = [];
  for (const terenBazowy of ['Równina', 'Wzgórza', 'Pustynia', 'Tundra', 'Łąka']) {
    for (const nakladka of [undefined, 'brak', 'las', 'dzungla']) {
      for (const rzeka of [undefined, { obecna: true }, { obecna: false }]) {
        for (const ul of [undefined, ['farma'], ['kopalnia', 'tartak'], ['nieznane']]) {
          hexes.push({ q: 0, r: 0, terenBazowy, nakladka, rzeka, ulepszenia: ul, ulepszenie: ul?.[ul.length - 1], zloze: ul ? 'zelazo' : undefined });
        }
      }
    }
  }
  for (const h of hexes) for (const era of [undefined, 1, 2, 3, 5, 0]) {
    put('tileYieldLabel', () => (era === undefined ? W.tileYieldLabel(h) : W.tileYieldLabel(h, era)), () => (era === undefined ? P.k06a.tileYieldLabel(h) : P.k06a.tileYieldLabel(h, era)));
  }

  // DOM: chipy + podpowiedzi w #host (innerHTML po parsowaniu) — scena do zrzutu.
  const host = document.getElementById('host');
  const scene = (side) => {
    host.innerHTML = '';
    const pick = (k, n) => out[side][k].filter((s) => s && !s.startsWith('THROW')).slice(0, n);
    for (const html of pick('unitStockCostChipsHtml', 24)) { const d = document.createElement('div'); d.className = 'row'; d.innerHTML = html; host.appendChild(d); }
    for (const t of [...new Set(pick('formatBuildingCatalogLockHint', 400))].slice(0, 30)) { const d = document.createElement('div'); d.className = 'hint'; d.innerHTML = t; host.appendChild(d); }
    for (const t of [...new Set(pick('tileYieldLabel', 400))].slice(0, 20)) { const d = document.createElement('span'); d.className = 'ty'; d.innerHTML = t; host.appendChild(d); }
    dom[side] = [...host.children].map((c) => c.outerHTML);
  };
  return { out, dom, scene: scene.toString() };
};

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
const CSS = 'body{margin:0;background:#fff;font:13px sans-serif}#host{padding:8px}.row{margin:2px 0}.hint{margin:2px 0;color:#333}'
  + '.bld-infocard-chip{display:inline-block;border:1px solid #889;border-radius:3px;padding:0 4px;margin-right:4px}'
  + '.stock-missing{border-color:#c33;color:#c33}.ty{display:inline-block;margin:2px 6px 2px 0}';

let exitCode = 0;
let browser = null;
let srv = null;
try {
  const outdir = join(TMP, 'out');
  await bundle([webEntry, portEntry], outdir);
  const files = readdirSync(outdir, { recursive: true }).map(String);
  const ej = (n) => files.find((f) => f.split('/').pop() === n);
  if (!ej('entry-web.js') || !ej('entry-port.js')) throw new Error('brak entry-web.js/entry-port.js: ' + files.join(','));
  writeFileSync(join(outdir, 'index.html'), `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><style>${CSS}</style><body><div id="host"></div>`
    + `<script type="module">import './${ej('entry-web.js')}'; import './${ej('entry-port.js')}'; globalThis.__ready = true;</script>`);
  srv = await serve(outdir);
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu'] });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
  try {
    await page.waitForFunction(() => globalThis.__ready === true && globalThis.__web && globalThis.__portInit, null, { timeout: 120000 });
  } catch (e) {
    throw new Error(`moduły nie załadowane (${errors.join(' | ') || e.message})`);
  }
  const uiParams = readFileSync(join(resolve(WEB_DIR), 'gra/data/ui-params.json'), 'utf8');
  const res = await page.evaluate(EVAL, uiParams);
  const ua = await page.evaluate(() => navigator.userAgent);

  // VEC
  let diffs = 0;
  const rows = [];
  for (const key of Object.keys(res.out.web)) {
    const w = res.out.web[key], p = res.out.port[key];
    let d = 0, first = '';
    for (let i = 0; i < Math.max(w.length, p.length); i++) if (w[i] !== p[i]) { d++; if (!first) first = `#${i} web=${String(w[i]).slice(0, 140)} port=${String(p[i]).slice(0, 140)}`; }
    const distinct = new Set(w).size;
    const throws = w.filter((x) => x.startsWith('THROW')).length;
    diffs += d;
    rows.push({ key, n: w.length, distinct, throws, d, first });
  }
  // HUNK: web rozróżnia warianty nowych hunków (wektory nie są ślepe na zmianę webu).
  const W = res.out.web;
  const has = (k, pred) => W[k].some(pred);
  const HUNK_PROBES = [
    ['K01B buildingPracaPerTurn ≠ pracaPerTurn', new Set(W.queueItemCumulativeEta).size > 3 && has('queueItemCumulativeEta', (x) => x === 'null')],
    ['K05A getManpowerMultipliers.costMult', new Set(W.recruitManpowerCost).size > 2],
    ['K05A chip „(brak)”', has('unitStockCostChipsHtml', (x) => x.includes('(brak)')) && has('unitStockCostChipsHtml', (x) => x.length > 0 && !x.includes('(brak)'))],
    ['K05A „Brakuje: …”', has('formatBuildingCatalogLockHint', (x) => x.includes('Brakuje: Glina · Ruda')) && has('formatBuildingCatalogLockHint', (x) => x.includes('&lt;b&gt;') || x.includes('<b>&'))],
    ['K06A ownerEra → wlascicielEra', (() => { const t = W.tileYieldLabel; let n = 0; for (let i = 0; i + 5 < t.length; i += 6) if (new Set(t.slice(i, i + 6)).size > 1) n++; return n > 0; })()],
  ];
  const hunkFail = HUNK_PROBES.filter(([, ok]) => !ok);
  diffs += hunkFail.length;

  // DOM + PIX (dwa rozmiary)
  const pix = [];
  let domDiff = 0;
  for (const [vw, vh] of [[1280, 720], [360, 640]]) {
    const shots = {};
    const doms = {};
    // Każda strona (web/port) w ŚWIEŻEJ karcie o docelowym viewporcie: ta sama strona startowa (CSS + #host), ta sama
    // funkcja sceny; scena wstawia wyniki danej strony (wektory z modułów wykonanych wyżej w Chromium).
    for (const side of ['web', 'port']) {
      const sp = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
      sp.on('pageerror', (e) => errors.push(`pageerror(${side} ${vw}): ${e.message}`));
      sp.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error(${side} ${vw}): ${m.text()}`); });
      await sp.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}</style><body><div id="host"></div>`);
      doms[side] = await sp.evaluate(([sideArg, outArg, sceneSrc]) => {
        const dom = {};
        const host = document.getElementById('host');
        // Ta sama funkcja sceny co w EVAL (źródło przekazane jako tekst).
        const f = new Function('host', 'out', 'dom', 'return (' + sceneSrc + ')')(host, outArg, dom);
        f(sideArg);
        return dom[sideArg];
      }, [side, res.out, res.scene]);
      await sp.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      shots[side] = await sp.screenshot({ fullPage: false });
      if (PNG_DIR) writeFileSync(join(PNG_DIR, `repin_ui2g-${side}-${vw}x${vh}.png`), shots[side]);
      await sp.close();
    }
    const sameDom = JSON.stringify(doms.web) === JSON.stringify(doms.port);
    if (!sameDom) domDiff++;
    const eq = Buffer.compare(shots.web, shots.port) === 0;
    // Diff pikseli (dekodowanie PNG w Chromium): liczba różnych pikseli i ich obwiednia — diagnostyka przy RÓŻNY.
    const pxDiff = eq ? { n: 0 } : await page.evaluate(async ([a, b]) => {
      const dec = async (b64) => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob()); const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
      const A = await dec(a), B = await dec(b);
      if (A.width !== B.width || A.height !== B.height) return { n: -1, size: [A.width, A.height, B.width, B.height] };
      let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let i = 0; i < A.data.length; i += 4) if (A.data[i] !== B.data[i] || A.data[i + 1] !== B.data[i + 1] || A.data[i + 2] !== B.data[i + 2] || A.data[i + 3] !== B.data[i + 3]) { n++; const px = (i / 4) % A.width, py = Math.floor(i / 4 / A.width); x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
      return { n, box: [x0, y0, x1, y1] };
    }, [shots.web.toString('base64'), shots.port.toString('base64')]);
    pix.push({ size: `${vw}x${vh}`, eq, pxDiff, bytes: shots.web.length, sha: createHash('sha256').update(shots.web).digest('hex'), domNodes: doms.web.length });
    if (!eq) diffs++;
  }
  diffs += domDiff;
  if (errors.length) diffs++;

  for (const r of rows) console.log(`${r.key.padEnd(32)} wektory=${String(r.n).padStart(5)} różne_wyniki=${String(r.distinct).padStart(4)} wyjątki=${String(r.throws).padStart(4)} różnice=${r.d}${r.first ? ' ' + r.first : ''}`);
  for (const [name, ok] of HUNK_PROBES) console.log(`HUNK ${ok ? 'OK  ' : 'FAIL'} ${name}`);
  for (const p of pix) console.log(`PIX ${p.size}: ${p.eq ? 'identyczny' : 'RÓŻNY pikseli=' + p.pxDiff.n + ' obwiednia=' + JSON.stringify(p.pxDiff.box ?? p.pxDiff.size)} (PNG ${p.bytes} B, sha256 ${p.sha.slice(0, 16)}…, węzłów DOM ${p.domNodes})`);
  console.log(`DOM web vs port: ${domDiff === 0 ? 'identyczny' : 'RÓŻNY'}`);
  console.log(`ERR pageerror+console.error: ${errors.length}${errors.length ? ' ' + errors.slice(0, 5).join(' | ') : ''}`);
  console.log(`Chromium: ${ua}`);
  const webHash = createHash('sha256').update(JSON.stringify(res.out.web)).digest('hex');
  if (OUT) {
    // Zapis zwarty: tabela unikalnych wyników + indeksy per wektor (wynik i = values[vectors[key][i]]); hash liczony z pełnych wektorów.
    const values = [...new Set(Object.values(res.out.web).flat())];
    const at = new Map(values.map((v, i) => [v, i]));
    const vectors = Object.fromEntries(Object.entries(res.out.web).map(([k, arr]) => [k, arr.map((v) => at.get(v))]));
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-UI-2-G-Q1', source: 'web 86d510c66 gra/src/ui/cityPanel.ts (Chromium)', webVectorsSha256: webHash, png: pix, values, vectors }) + '\n');
  }
  console.log(`run-repin-ui2g: jednostek=${rows.length} wektorów=${rows.reduce((a, r) => a + r.n, 0)} różnic=${diffs} webVectorsSha256=${webHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  if (srv) srv.close();
  rmSync(TMP, { recursive: true, force: true });
  rmSync(WEB_REF, { force: true });
}
process.exitCode = exitCode;
