#!/usr/bin/env node
/**
 * run-repin-ui3e.mjs — harness partii REPIN UI-3-E (R-RUSTPORT-REPIN-WEB-UI-3-E-Q1): bloki K `cityPanel` przepięte
 * z webu 86d510c66 na web `9b019a7d8` (FALA 509–532) — nowe hunki webu vs port, w Chromium.
 *
 * Jednostki (hunk webu → wektory):
 *   K01B wyzwienieSummaryLabel     3. parametr `ownerEra` → mnożnik epoki zużycia obywateli (R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1)
 *   K05B buildingRequirementChips  chip „Wymaga rzeki przy mieście” (`RIVER_ONLY_BUILDING_IDS`, `ctx.cityHasRiver`, R-WEB-MILL-RIVER-ONLY-GATE-Q1)
 *   ADAPTER k-ui3e-web             formatManpowerCompact, citizenConsumptionEraMultiplier/Mult/Number, isCityUnderSiege (+ host id),
 *                                  stałe AUTO_BUILD_DISABLED_HINT / CITY_SIEGE_RECRUIT_BLOCK_PL / RIVER_ONLY_BUILDING_IDS
 *   (K05A recruitUnit + oblężenie, K06B appendUnitRecruitCompactRow, K07A/K07B/K08E/K09A — jsdom pin-exec `run-k0*` na webie 9b019a7d8.)
 *
 * WEB:  CAŁY moduł `gra/src/ui/cityPanel.ts` z `--web-dir` (`git archive 9b019a7d8 gra/src gra/data`), z `export` na deklaracjach
 *       najwyższego poziomu (treść bez zmian), spakowany `build.mjs`, wykonany w Chromium. Silnik webu = funkcje game/* z tego pakietu.
 * PORT: moduły `src/ui/cityPanel/*.ts` w TEJ SAMEJ stronie; wejścia reguł portu = funkcje silnika webu (port UI nie liczy reguł).
 *
 * Bramki (EXIT 0 ⇔ wszystkie): VEC web === port; HUNK web rozróżnia warianty hunku; DOM web === port; PIX PNG 1280×720 i 360×640
 * bajtowo równe; ERR `pageerror` + `console.error` = 0. `--out <plik.json>` = fixtura wektorów webu (+ sha256).
 *
 * Użycie (z `src-tauri/frontend-v2/`): node tools/dom-harness/run-repin-ui3e.mjs --web-dir <WEB 9b019a7d8> [--src <src>] [--out <plik>] [--png-dir <dir>]
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
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const WEB_DIR = argOf('--web-dir');
if (!WEB_DIR || !existsSync(join(WEB_DIR, 'gra/src/ui/cityPanel.ts')) || !existsSync(join(WEB_DIR, 'gra/src/game/city-siege-state.ts'))) {
  console.error('Użycie: node tools/dom-harness/run-repin-ui3e.mjs --web-dir <git archive 9b019a7d8 gra/src gra/data> [--src <src>] [--out <plik>] [--png-dir <dir>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
let TMP;
try { TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui3e-')); } catch (e) { console.error('BŁĄD harnessu: mkdtemp', e.message); process.exit(2); }
const WEB_REF = join(WEB_SRC, 'ui/__ui3e_web_ref.ts');
process.on('uncaughtException', (e) => { console.error('BŁĄD harnessu (uncaught):', e?.stack ?? e); try { rmSync(TMP, { recursive: true, force: true }); rmSync(WEB_REF, { force: true }); } catch { /* */ } process.exit(2); });

/* ── Odniesienie webu: cityPanel.ts z `export` na deklaracjach najwyższego poziomu (treść bez zmian) + silnik ─────────── */
const TOP_DECL = /^(const|let|var|function|class|type|interface|enum|async function)\s/;
const webLines = readFileSync(join(WEB_SRC, 'ui/cityPanel.ts'), 'utf8').split('\n');
const refBody = webLines.map((l) => (TOP_DECL.test(l) ? 'export ' + l : l));
refBody.push('import * as __siege from "../game/city-siege-state";');
refBody.push('import * as __cce from "../game/citizen-consumption-era";');
refBody.push('import * as __abg from "../game/auto-build-gate";');
refBody.push('import * as __mp from "../game/manpower";');
refBody.push('import * as __prod from "../game/production";');
refBody.push('export const __engine = { loadGameData, buildRationParams, rationFoodCostPerPop, rationGrowthPercent, buildingRequiredActiveLabels,'
  + ' empireResourceLabelSatisfied, isBuildingSupersededByUpgrade, cityBuildingPrereqMet, CITY_BUILDING_PREREQ, WATER_ACCESS_BUILDING_IDS,'
  + ' buildingStockCost, stockResourceLabel, techIconHintSpan, siege: __siege, cce: __cce, abg: __abg, mp: __mp, prod: __prod };');
writeFileSync(WEB_REF, refBody.join('\n'));

const webEntry = join(TMP, 'entry-web.ts');
writeFileSync(webEntry, `import * as W from ${JSON.stringify(WEB_REF)};\n(globalThis as any).__web = W;\n`);
const portEntry = join(TMP, 'entry-port.ts');
const cp = (m) => JSON.stringify(join(SRC, 'ui/cityPanel', m));
writeFileSync(portEntry, [
  `import { installStaticCatalog } from ${JSON.stringify(join(SRC, 'controller/staticCatalog'))};`,
  `(globalThis as any).__portInit = async (catalog: any) => {`,
  `  installStaticCatalog(catalog);`,
  `  const [k01a, k01br, k01breg, k05bh, k05bc, ad, host] = await Promise.all([import(${cp('k01a-fundament')}), import(${cp('k01b-r')}), import(${cp('k01b-reguly')}),`,
  `    import(${cp('k05b-host')}), import(${cp('k05b-chipy')}), import(${cp('k-ui3e-web')}), import(${cp('k-ui3e-host')})]);`,
  `  (globalThis as any).__port = { k01a, k01br, k01breg, k05bh, k05bc, ad, host };`,
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

  // Reguły portu (K01B-Z3, K05B host) = silnik webu.
  P.k01breg.ustawRegulyKontrolera(new Proxy({}, { get: (_t, k) => (...a) => { if (k === 'rationFoodCostPerPop') return E.rationFoodCostPerPop(...a); if (k === 'rationGrowthPercent') return E.rationGrowthPercent(...a); throw new Error('stub-k01b:' + String(k)); } }));
  const cities = [
    { id: 'm1', ownerId: 0, q: 0, r: 0, name: 'A', population: 3, surowce: { drewno: 4 } },
    { id: 'm2', ownerId: 0, q: 1, r: 0, name: 'B', population: 2, surowce: { drewno: 9, glina: 1 }, oblegane: true },
    { id: 'm3', ownerId: 1, q: 5, r: 0, name: 'C', population: 1, surowce: {}, oblegane: false },
  ];
  const cfg = { difficulty: 'normal', getCities: () => cities, getEpoch: () => 1, getEmpireStock: () => ({ drewno: 5 }), getBuiltBuildingIds: () => [] };
  W.configureCityPanel(cfg);
  P.k05bh.setK05bHost({
    cfg,
    readPodzialHandlu: () => ({ procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 }),
    isMeCity: (o) => o === 0, adjustHandelSplit: (s) => s, freshWealthState: () => ({ poziom: 0, pula: 0 }),
    stockResourceLabel: E.stockResourceLabel, rerender: () => undefined, openEntityCard: () => undefined,
    rules: new Proxy({
      buildingRequiredActiveLabels: E.buildingRequiredActiveLabels,
      empireResourceLabelSatisfied: E.empireResourceLabelSatisfied,
      isBuildingSupersededByUpgrade: E.isBuildingSupersededByUpgrade,
      cityBuildingPrereqMet: E.cityBuildingPrereqMet,
      cityBuildingPrereqOf: (k) => E.CITY_BUILDING_PREREQ[k],
      isWaterAccessBuilding: (id) => E.WATER_ACCESS_BUILDING_IDS.has(id),
      buildingStockCost: E.buildingStockCost,
      ownerSurowcePoolFor: W.ownerSurowcePoolFor,
      techPrereqChain: W.techPrereqChain,
      stockResourceLabel: E.stockResourceLabel,
    }, { get: (t, k) => t[k] ?? (() => { throw new Error('stub-k05b:' + String(k)); }) }),
  });

  // K01B wyzwienieSummaryLabel (ownerEra)
  const rp = E.buildRationParams(data.econParams, 'normal');
  for (const lvl of [-2, -1, 0, 1, 2, 3, 4, 5, 6]) for (const era of [undefined, 0, 1, 2, 3, 4, 5, 2.7, -1, NaN]) {
    put('wyzwienieSummaryLabel', () => (era === undefined ? W.wyzwienieSummaryLabel(lvl, rp) : W.wyzwienieSummaryLabel(lvl, rp, era)),
      () => (era === undefined ? P.k01br.wyzwienieSummaryLabel(lvl, rp) : P.k01br.wyzwienieSummaryLabel(lvl, rp, era)));
  }
  // ADAPTER: czyste funkcje webu (silnik) vs kopie portu
  const nums = [0, 1, 7, 999, 1000, 1499, 1500, 12345, 99999, 100000, 999999, 1000000, 1234567, 25000000, -1, -2500, 0.5, 1.75, NaN, Infinity];
  for (const n of nums) {
    put('formatManpowerCompact', () => E.mp.formatManpowerCompact(n), () => P.ad.formatManpowerCompact(n));
    put('formatCitizenConsumptionNumber', () => E.cce.formatCitizenConsumptionNumber(n), () => P.ad.formatCitizenConsumptionNumber(n));
  }
  for (const era of [undefined, null, 0, 0.5, 1, 1.9, 2, 3, 4, 5, 6, -3, NaN, '2']) {
    put('citizenConsumptionEraMultiplier', () => E.cce.citizenConsumptionEraMultiplier(era), () => P.ad.citizenConsumptionEraMultiplier(era));
    put('formatCitizenConsumptionMult', () => E.cce.formatCitizenConsumptionMult(era), () => P.ad.formatCitizenConsumptionMult(era));
  }
  const targets = [cities[0], cities[1], cities[2], 'm1', 'm2', 'xx', { q: 1, r: 0 }, { q: 0, r: 0 }, { q: 9, r: 9 }, { id: 'm2', ownerId: 0, q: 1, r: 0 }, { id: 'zz', ownerId: 0, q: 0, r: 0, oblegane: true }];
  for (const list of [cities, [], [cities[1]]]) for (const t of targets) {
    put('isCityUnderSiege', () => E.siege.isCityUnderSiege(list, t), () => P.ad.isCityUnderSiege(list, t));
  }
  // host portu: id miasta number (DTO) — ten sam wynik co web dla id string
  for (const c of cities) put('isCityUnderSiegeK', () => E.siege.isCityUnderSiege([c], c), () => P.host.isCityUnderSiegeK([{ ...c, id: Number(c.id.slice(1)) }], { ...c, id: Number(c.id.slice(1)) }));
  put('constants', () => [E.abg.AUTO_BUILD_DISABLED_HINT, E.siege.CITY_SIEGE_RECRUIT_BLOCK_PL, [...E.prod.RIVER_ONLY_BUILDING_IDS], E.cce.CITIZEN_CONSUMPTION_ERA_STEP],
    () => [P.ad.AUTO_BUILD_DISABLED_HINT, P.ad.CITY_SIEGE_RECRUIT_BLOCK_PL, [...P.ad.RIVER_ONLY_BUILDING_IDS], P.ad.CITIZEN_CONSUMPTION_ERA_STEP]);

  // K05B buildingRequirementChips: młyn (definicja syntetyczna — brak w buildings.json 9b019a7d8) i budynki z danych
  const ctxBase = { epoch: 1, builtBuildingIds: [], productionQueue: [], buildingLevel: 1, civBonusy: [], ownerId: 0, isCapital: true, activeResourceLabels: [], empireActiveResourceLabels: [], empireBuiltIds: [], empireResourceStock: { drewno: 5 }, cityHasCoastOrRiver: false };
  const mill = { id: 'mlyn', nazwa: 'Młyn', epokaWejscia: 1, koszt: 40, koszt_surowce: { drewno: 2 } };
  const defs = [mill, { ...mill, lokalizacja: 'region' }, ...(data.buildings ?? []).slice(0, 24)];
  for (const def of defs) for (const river of [undefined, true, false]) for (const coast of [false, true]) {
    const ctx = { ...ctxBase, cityHasCoastOrRiver: coast, ...(river === undefined ? {} : { cityHasRiver: river }) };
    put('buildingRequirementChips', () => W.buildingRequirementChips(def, cities[0], data, ctx, []), () => P.k05bc.buildingRequirementChips(def, cities[0], data, ctx, []));
    put('buildingRequirementChipsHtml', () => W.buildingRequirementChipsHtml(W.buildingRequirementChips(def, cities[0], data, ctx, [])),
      () => P.k01a.buildingRequirementChipsHtml(P.k05bc.buildingRequirementChips(def, cities[0], data, ctx, [])));
  }

  const scene = (side) => {
    const host = document.getElementById('host');
    host.innerHTML = '';
    const pick = (k, n) => [...new Set(out[side][k].filter((s) => s && !s.startsWith('THROW')))].slice(0, n);
    for (const html of pick('buildingRequirementChipsHtml', 12)) { const d = document.createElement('div'); d.className = 'row'; d.innerHTML = html; host.appendChild(d); }
    for (const t of pick('wyzwienieSummaryLabel', 18)) { const d = document.createElement('div'); d.className = 'hint'; d.textContent = t; host.appendChild(d); }
    for (const t of pick('formatManpowerCompact', 20)) { const d = document.createElement('span'); d.className = 'ty'; d.textContent = t; host.appendChild(d); }
    const c = JSON.parse(out[side].constants[0]);
    for (const t of [c[0], c[1]]) { const d = document.createElement('div'); d.className = 'hint'; d.textContent = t; host.appendChild(d); }
    return [...host.children].map((x) => x.outerHTML);
  };
  return { out, scene: scene.toString() };
};

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
function serve(dir) {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      const p = join(dir, decodeURIComponent((req.url ?? '/').split('?')[0]));
      if (!p.startsWith(dir) || !existsSync(p)) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }).end(readFileSync(p));
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}
const CSS = 'body{margin:0;background:#fff;font:13px sans-serif}#host{padding:8px}.row{margin:2px 0}.hint{margin:2px 0;color:#333}'
  + '.bld-req-chip,.bld-infocard-chip{display:inline-block;border:1px solid #889;border-radius:3px;padding:0 4px;margin-right:4px}'
  + '.met{border-color:#36c;color:#36c}.unmet{border-color:#c33;color:#c33}.ty{display:inline-block;margin:2px 6px 2px 0}';

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

  let diffs = 0;
  const rows = [];
  for (const key of Object.keys(res.out.web)) {
    const w = res.out.web[key], p = res.out.port[key];
    let d = 0, first = '';
    for (let i = 0; i < Math.max(w.length, p.length); i++) if (w[i] !== p[i]) { d++; if (!first) first = `#${i} web=${String(w[i]).slice(0, 160)} port=${String(p[i]).slice(0, 160)}`; }
    diffs += d;
    rows.push({ key, n: w.length, distinct: new Set(w).size, throws: w.filter((x) => x.startsWith('THROW')).length, d, first });
  }
  const W = res.out.web;
  const has = (k, pred) => W[k].some(pred);
  const HUNK_PROBES = [
    ['K01B ownerEra: „(epoka ×1,5)” i brak dopisku dla ×1', has('wyzwienieSummaryLabel', (x) => x.includes('(epoka ×1,5)')) && has('wyzwienieSummaryLabel', (x) => x.includes('/turę ·') && !x.includes('epoka'))],
    ['K01B stawka × mnożnik (2 × 1,5 = 3)', has('wyzwienieSummaryLabel', (x) => x.startsWith('3 🍞/miesz./turę (epoka ×1,5)'))],
    ['ADAPTER formatCitizenConsumptionNumber przecinek', has('formatCitizenConsumptionNumber', (x) => /^\d+,\d+$/.test(x))],
    ['K05B młyn: chip „Wymaga rzeki” met=true i met=false', has('buildingRequirementChips', (x) => x.includes('"Wymaga rzeki przy mieście","met":true')) && has('buildingRequirementChips', (x) => x.includes('"Wymaga rzeki przy mieście","met":false'))],
    ['K05B budynek spoza RIVER_ONLY bez chipu rzeki', has('buildingRequirementChips', (x) => !x.includes('Wymaga rzeki'))],
    ['ADAPTER formatManpowerCompact k/M', has('formatManpowerCompact', (x) => /k$/.test(x)) && has('formatManpowerCompact', (x) => /M$/.test(x))],
    ['ADAPTER isCityUnderSiege true i false', has('isCityUnderSiege', (x) => x === 'true') && has('isCityUnderSiege', (x) => x === 'false')],
  ];
  const hunkFail = HUNK_PROBES.filter(([, ok]) => !ok);
  diffs += hunkFail.length;

  const pix = [];
  let domDiff = 0;
  for (const [vw, vh] of [[1280, 720], [360, 640]]) {
    const shots = {};
    const doms = {};
    for (const side of ['web', 'port']) {
      const sp = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
      sp.on('pageerror', (e) => errors.push(`pageerror(${side} ${vw}): ${e.message}`));
      sp.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error(${side} ${vw}): ${m.text()}`); });
      await sp.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}</style><body><div id="host"></div>`);
      doms[side] = await sp.evaluate(([sideArg, outArg, sceneSrc]) => {
        const f = new Function('out', 'return (' + sceneSrc + ')')(outArg);
        return f(sideArg);
      }, [side, res.out, res.scene]);
      await sp.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      shots[side] = await sp.screenshot({ fullPage: false });
      if (PNG_DIR) writeFileSync(join(PNG_DIR, `repin_ui3e-${side}-${vw}x${vh}.png`), shots[side]);
      await sp.close();
    }
    if (JSON.stringify(doms.web) !== JSON.stringify(doms.port)) domDiff++;
    const eq = Buffer.compare(shots.web, shots.port) === 0;
    pix.push({ size: `${vw}x${vh}`, eq, bytes: shots.web.length, sha: createHash('sha256').update(shots.web).digest('hex'), domNodes: doms.web.length });
    if (!eq) diffs++;
  }
  diffs += domDiff;
  if (errors.length) diffs++;

  for (const r of rows) console.log(`${r.key.padEnd(32)} wektory=${String(r.n).padStart(5)} różne_wyniki=${String(r.distinct).padStart(4)} wyjątki=${String(r.throws).padStart(4)} różnice=${r.d}${r.first ? ' ' + r.first : ''}`);
  for (const [name, ok] of HUNK_PROBES) console.log(`HUNK ${ok ? 'OK  ' : 'FAIL'} ${name}`);
  for (const p of pix) console.log(`PIX ${p.size}: ${p.eq ? 'identyczny' : 'RÓŻNY'} (PNG ${p.bytes} B, sha256 ${p.sha.slice(0, 16)}…, węzłów DOM ${p.domNodes})`);
  console.log(`DOM web vs port: ${domDiff === 0 ? 'identyczny' : 'RÓŻNY'}`);
  console.log(`ERR pageerror+console.error: ${errors.length}${errors.length ? ' ' + errors.slice(0, 5).join(' | ') : ''}`);
  console.log(`Chromium: ${ua}`);
  const webHash = createHash('sha256').update(JSON.stringify(res.out.web)).digest('hex');
  if (OUT) {
    const values = [...new Set(Object.values(res.out.web).flat())];
    const at = new Map(values.map((v, i) => [v, i]));
    const vectors = Object.fromEntries(Object.entries(res.out.web).map(([k, arr]) => [k, arr.map((v) => at.get(v))]));
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-WEB-UI-3-E-Q1', source: 'web 9b019a7d8 gra/src/ui/cityPanel.ts (Chromium)', webVectorsSha256: webHash, png: pix, values, vectors }) + '\n');
  }
  console.log(`run-repin-ui3e: jednostek=${rows.length} wektorów=${rows.reduce((a, r) => a + r.n, 0)} różnic=${diffs} webVectorsSha256=${webHash}`);
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
