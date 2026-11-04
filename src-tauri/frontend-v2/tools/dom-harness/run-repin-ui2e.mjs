#!/usr/bin/env node
/**
 * run-repin-ui2e.mjs — harness Chromium partii REPIN UI-2-E (`R-RUSTPORT-REPIN-UI-2-E-Q1`, `P5-REPIN-UI-2.md` §1 #18–#22).
 *
 * WEB:  `diploListHud.ts`, `diplomacyPanel.ts`, `diplomacyNegotiationModal.ts`, `diplomacyTradeBasket.ts`,
 *       `diplomacyAudience.ts` (r2, Z2: sceny `audiencja*` — karty bez listy bonusów cywilizacji) z URUCHOMIONEGO
 *       weba (`git archive origin/main gra/src gra/data`, `--web-dir`), pakowane `build.mjs` i wykonane w Chromium 141
 *       (Playwright `/opt/node-tools`), serwowane po HTTP z localhost.
 * PORT: te same moduły `src/ui/**` frontend-v2 (`--src`), z „Rust” = `repin-ui2e-rust.mjs` (StaticCatalogDto + provider
 *       koszyka z funkcji `game/*` TEGO webu) i liniami karty listy = web `formatDiploCivListLines` (P5.5 `DiploListDto.lines`).
 * Wspólny kod wektorów i scen: `repin-ui2e-scenes.mjs` (identyczny po obu stronach).
 *
 * Porównanie (EXIT 0 <=> wszystkie zgodne):
 *   VEC   każdy wektor funkcji (string/JSON) web === port (`agresorBadgeHtml`, `diploListEntryFromRelation`,
 *         `proposalActionIdFromPayload`, `dealDurationControlOptions`, `dealDurationHtml`, `DIPLO_LIST_RELATION_SHOW_MAX`);
 *   DOM   dla każdej sceny × viewport (1280×720, 360×640): `document.documentElement.outerHTML` po renderze + log callbacków
 *         web === port;
 *   PIX   zrzut PNG sceny × viewport: bajty PNG web === port (próg 0);
 *   ERR   `pageerror` + `console.error` = 0 po obu stronach;
 *   COVER każda funkcja ma > 1 różny wynik webu (harness rozróżnia przypadki), każda scena ma niepusty DOM i 0 brakujących
 *         selektorów kroków (`BRAK` w logu webu).
 * `--out <plik.json>` — wektory + DOM scen WEBU i sha256 (niezależny weryfikator: 2 katalogi `git archive` → ten sam hash).
 *
 * Użycie (z `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/run-repin-ui2e.mjs --web-dir <WEB_DIR> [--src <src>] [--out <plik>] [--png-dir <dir>] [--tmp-dir <dir>]
 * EXIT 0 <=> brak różnic; 1 <=> >= 1 różnica; 2 <=> błąd harnessu.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from './build.mjs';

// Z1 (r2): KAŻDY błąd poza ścieżką porównania (wyjątek/odrzucenie spoza `try`, np. `mkdtempSync` ENOENT) = EXIT 2,
// nigdy domyślne EXIT 1 Node — EXIT 1 jest zarezerwowane dla „≥ 1 różnica” (czytane przez `mutate-repin-ui2e.mjs`).
for (const ev of ['uncaughtException', 'unhandledRejection']) {
  process.on(ev, (e) => {
    console.error(`BŁĄD harnessu (${ev}):`, e && e.stack ? e.stack : e);
    process.exit(2);
  });
}

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const HERE = resolve(fileURLToPath(new URL('./', import.meta.url)));
const WEB_DIR = argOf('--web-dir');
if (!WEB_DIR) {
  console.error('Użycie: node tools/dom-harness/run-repin-ui2e.mjs --web-dir <katalog z gra/src i gra/data origin/main> [--src <src>] [--out <plik>]');
  process.exit(2);
}
const SRC = resolve(argOf('--src') ?? join(V2_ROOT, 'src'));
const WEB_SRC = join(resolve(WEB_DIR), 'gra/src');
const WEB_DATA = join(resolve(WEB_DIR), 'gra/data');
const OUT = argOf('--out');
const PNG_DIR = argOf('--png-dir');
const CHROMIUM = argOf('--chromium') ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW_DIR = argOf('--playwright') ?? '/opt/node-tools/node_modules/playwright';
let TMP = null;
const UI_MODS = ['diploListHud', 'diplomacyPanel', 'diplomacyNegotiationModal', 'diplomacyTradeBasket', 'diplomacyAudience'];
const VIEWPORTS = [[1280, 720], [360, 640]];
const SCENES = ['lista', 'panel', 'rozejm', 'rozejm-wyslij', 'rozejm-wojna-zloto', 'handel10-miasto', 'handel10-miasto-nan', 'pokoj-miasto', 'wasal-picker', 'pokoj-bez-miast', 'bezterminowo', 'bezterminowo-pole', 'wymiana-30', 'audiencja', 'audiencja-wojna'];

for (const m of UI_MODS) for (const dir of [join(SRC, 'ui'), join(WEB_SRC, 'ui')]) {
  if (!existsSync(join(dir, m + '.ts'))) {
    console.error(`BRAK modułu ${join(dir, m + '.ts')}`);
    process.exit(2);
  }
}

/** `RESOURCE_KEY_LABEL` (`game/diplomacy-display.ts`) nie jest eksportowany — odczyt literału z pliku webu (jak `run-cycles.mjs`). */
function writeResourceKeyLabels() {
  const ddSrc = readFileSync(join(WEB_SRC, 'game/diplomacy-display.ts'), 'utf8');
  const rklStart = ddSrc.indexOf('const RESOURCE_KEY_LABEL');
  if (rklStart < 0) throw new Error('brak RESOURCE_KEY_LABEL w game/diplomacy-display.ts webu');
  const rkl = ddSrc.slice(rklStart, ddSrc.indexOf('};', rklStart));
  const resourceKeyLabels = {};
  for (const mm of rkl.matchAll(/^\s*([a-z_]+):\s*'([^']*)',/gm)) resourceKeyLabels[mm[1]] = mm[2];
  writeFileSync(join(TMP, 'rkl.json'), JSON.stringify(resourceKeyLabels));
}

const J = (p) => JSON.stringify(p);
const gw = (m) => J(join(WEB_SRC, m));
function writeEntries() {
  const scenes = J(join(HERE, 'repin-ui2e-scenes.mjs'));
  const common = (uiDir) => [
    ...UI_MODS.map((m, i) => `import * as M${i} from ${J(join(uiDir, m))};`),
    `import * as SC from ${scenes};`,
    `import techJson from ${J(join(WEB_DATA, 'tech.json'))};`,
    `import * as VCW from ${gw('game/diplomacy-value-catalog')};`,
  ];
  const expose = (entryFn, setCtx, audFn) => [
    `const api: any = { LH: M0, DP: M1, NM: M2, TB: M3, AU: M4, entryFromRelation: ${entryFn}, setScenarioCtx: ${setCtx}, audState: ${audFn}, qtyKeys: Object.keys(VCW.diplomacyHandelSurowceCatalog()) };`,
    `(globalThis as any).__ui2e = { api, SC, techIds: (techJson as any).technologie.map((t: any) => t.Technologia) };`,
    '',
  ];
  const web = join(TMP, 'entry-web.ts');
  writeFileSync(web, [...common(join(WEB_SRC, 'ui')), ...expose('(r: any) => M0.diploListEntryFromRelation(r)', '() => {}', '(st: any) => st')].join('\n'));
  const inst = join(TMP, 'install-port.ts');
  writeFileSync(inst, [
    `import * as VC from ${gw('game/diplomacy-value-catalog')};`,
    `import * as E from ${gw('game/diplomacy-pn-engine')};`,
    `import * as AP from ${gw('game/diplomacy-acceptance-points')};`,
    `import * as DD from ${gw('game/diplomacy-display')};`,
    `import * as PR from ${gw('game/diplomacy-proposals')};`,
    `import * as TV from ${gw('game/diplomacy-trade-validation')};`,
    `import * as AOB from ${gw('game/diplomacy-ai-offer-balance')};`,
    `import * as WG from ${gw('game/diplomacy-war-gates')};`,
    `import * as AA from ${gw('game/diplomacy-audience-actions')};`,
    `import * as BC from ${gw('game/diplomacy-barbarian-cooperation')};`,
    `import * as CR from ${gw('game/diplomacy-credibility')};`,
    `import * as AB from ${gw('ui/diplomacyAcceptanceBalance')};`,
    `import techJson from ${J(join(WEB_DATA, 'tech.json'))};`,
    `import civsJson from ${J(join(WEB_DATA, 'civs.json'))};`,
    `import rkl from ${J(join(TMP, 'rkl.json'))};`,
    `import { createUi2eRust } from ${J(join(HERE, 'repin-ui2e-rust.mjs'))};`,
    `import { installStaticCatalog } from ${J(join(SRC, 'controller/staticCatalog'))};`,
    `import { installDiplomacyQueries } from ${J(join(SRC, 'controller/diplomacyQueries'))};`,
    `const R = createUi2eRust({ VC, E, AP, DD, PR, TV, AOB, WG, AA, BC, CR, AB }, { tech: techJson, resourceKeyLabels: rkl, civs: civsJson });`,
    `installStaticCatalog(R.catalog as any);`,
    `installDiplomacyQueries(R.provider as any);`,
    `(globalThis as any).__ui2eRust = R;`,
    '',
  ].join('\n'));
  const port = join(TMP, 'entry-port.ts');
  writeFileSync(port, [
    `import ${J(inst)};`,
    ...common(join(SRC, 'ui')),
    `import { formatDiploCivListLines } from ${gw('game/diplomacy-display')};`,
    `import { tierLabel } from ${J(join(SRC, 'ui/diplomacyPanel'))};`,
    // P5.5: Rust podaje `lines` = web `formatDiploCivListLines` z tych samych pól (web `diploListHud.ts:518-527`).
    `const linesFor = (rel: any) => formatDiploCivListLines({ cultureLabel: rel.cultureLabel, epochLabel: rel.epochLabel, theirPopulation: rel.population,`,
    `  theirArmyCount: rel.armyCount, theirRespektTowardPlayer: rel.theirRespekt, ourRespektTowardThem: rel.respekt, zaufanie: rel.zaufanie, relationTierLabel: tierLabel(rel.tier) });`,
    // Z2 (r2): stan audiencji web → DTO „Rust” (`audienceState`, P5-0 §6.6); strona webu dostaje stan bez zmian.
    ...expose('(r: any) => M0.diploListEntryFromRelation({ ...r, lines: linesFor(r) })', '(c: any) => (globalThis as any).__ui2eRust.setScenarioCtx(c)', '(st: any) => (globalThis as any).__ui2eRust.audienceState(st)'),
  ].join('\n'));
  return { web, port };
}

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
const EVAL_VEC = (inputStr) => {
  const dec = (v) => (v && typeof v === 'object' && '__n' in v ? ({ NaN, Inf: Infinity, NInf: -Infinity, NZ: -0, U: undefined })[v.__n] : v);
  const I = JSON.parse(inputStr);
  I.AGRESOR_N = I.AGRESOR_N.map(dec);
  const { api, SC } = globalThis.__ui2e;
  return SC.vectors(api, I);
};
const EVAL_SCENE = (name) => {
  const { api, SC, techIds } = globalThis.__ui2e;
  // Bez czyszczenia `body`: moduły trzymają własne korzenie (np. `diplomacyPanel` `rootEl`); sprząta scena.
  const C = SC.ctxs(api.qtyKeys, techIds);
  const { S, log } = SC.scenes(api, C);
  const r = S[name]();
  globalThis.__ui2eCleanup = typeof r === 'function' ? r : r.cleanup;
  globalThis.__ui2eAfter = typeof r === 'function' ? undefined : r.after;
  globalThis.__ui2eLog = log;
  return log.slice();
};

let exitCode = 0;
let browser = null;
const servers = [];
try {
  TMP = mkdtempSync(join(argOf('--tmp-dir') ?? tmpdir(), 'repin-ui2e-'));
  writeResourceKeyLabels();
  const entries = writeEntries();
  const sides = {};
  for (const side of ['web', 'port']) {
    const outdir = join(TMP, 'out-' + side);
    const pad = join(TMP, `pad-${side}.ts`);
    writeFileSync(pad, 'export {};\n');
    await bundle([entries[side], pad], outdir);
    const entryJs = readdirSync(outdir, { recursive: true }).map(String).find((f) => f.split('/').pop() === `entry-${side}.js`);
    if (!entryJs) throw new Error(`${side}: brak entry-${side}.js`);
    writeFileSync(join(outdir, 'index.html'), `<!doctype html><html lang="pl"><head><meta charset="utf-8"><link rel="icon" href="data:,"></head><body style="margin:0;background:#1b1a17"><script type="module" src="./${entryJs}"></script></body></html>`);
    sides[side] = outdir;
  }
  const require = createRequire(join(PW_DIR, 'package.json'));
  const { chromium } = require(PW_DIR);
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu'] });
  const res = { web: { scenes: {} }, port: { scenes: {} } };
  const errors = [];
  const INPUT = { AGRESOR_N: (await import('./repin-ui2e-scenes.mjs')).AGRESOR_N };
  for (const side of ['web', 'port']) {
    const srv = await serve(sides[side]);
    servers.push(srv);
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => errors.push(`${side}: pageerror ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${side}: console.error ${m.text()}`); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
    try {
      await page.waitForFunction(() => globalThis.__ui2e !== undefined, null, { timeout: 60000 });
    } catch (e) {
      throw new Error(`${side}: moduły nie załadowane (${errors.join(' | ') || e.message})`);
    }
    res[side].vec = await page.evaluate(EVAL_VEC, enc(INPUT));
    res[side].ua = await page.evaluate(() => navigator.userAgent);
    // r2 (Z2): sceny `audiencja*` w OSOBNYM przebiegu po scenach r1 — audiencja wstrzykuje do `<head>` własny `<style>`
    // (`civ-diplo-aud-css-1e`), który inaczej trafiłby do `outerHTML` scen r1 z drugiego viewportu (fixtura r1 bez zmian).
    const PASSES = [SCENES.filter((n) => !n.startsWith('audiencja')), SCENES.filter((n) => n.startsWith('audiencja'))];
    for (const pass of PASSES) for (const [w, h] of VIEWPORTS) {
      await page.setViewportSize({ width: w, height: h });
      for (const name of pass) {
        const log = await page.evaluate(EVAL_SCENE, name);
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        // Znacznik `<script src="./entry-<strona>.js">` różni się nazwą pliku wejścia — usuwany przed porównaniem.
        const dom = (await page.evaluate(() => document.documentElement.outerHTML)).replace(/<script type="module" src="\.\/[^"]*"><\/script>/, '<script/>');
        const png = await page.screenshot({ animations: 'disabled' });
        const finalLog = await page.evaluate(() => {
          const l = globalThis.__ui2eLog;
          try { globalThis.__ui2eAfter?.(); } catch (e) { l.push('after-THROW:' + String(e && e.message)); }
          try { globalThis.__ui2eCleanup?.(); } catch (e) { l.push('cleanup-THROW'); }
          return l;
        });
        void log;
        res[side].scenes[`${name}@${w}x${h}`] = { dom, log: finalLog.join('\n'), png };
        if (PNG_DIR) {
          mkdirSync(PNG_DIR, { recursive: true });
          writeFileSync(join(PNG_DIR, `${side}-${name}-${w}x${h}.png`), png);
        }
      }
    }
    await page.close();
  }
  let diffs = 0;
  const rows = [];
  for (const key of Object.keys(res.web.vec)) {
    const w = res.web.vec[key];
    const p = res.port.vec[key] ?? [];
    let d = 0;
    let first = '';
    for (let i = 0; i < Math.max(w.length, p.length); i++) {
      if (w[i] !== p[i]) {
        d++;
        if (!first) first = ` #${i} web=${String(w[i]).slice(0, 200)} port=${String(p[i]).slice(0, 200)}`;
      }
    }
    const distinct = new Set(w).size;
    const coverOk = w.length === 1 || distinct > 1;
    diffs += d + (coverOk ? 0 : 1);
    rows.push(`VEC ${key.padEnd(30)} wektory=${String(w.length).padStart(4)} różne_wyniki=${String(distinct).padStart(4)} różnice=${d}${coverOk ? '' : ' COVER-FAIL'}${first}`);
  }
  for (const key of Object.keys(res.web.scenes)) {
    const w = res.web.scenes[key];
    const p = res.port.scenes[key];
    const domEq = w.dom === p.dom && w.log === p.log;
    const pixEq = Buffer.compare(w.png, p.png) === 0;
    const missing = (w.log.match(/BRAK/g) ?? []).length;
    const empty = !/<div/.test(w.dom.replace(/<script[\s\S]*?<\/script>/g, ''));
    let at = '';
    if (!domEq) {
      const a = w.dom + w.log;
      const b = p.dom + p.log;
      let i = 0;
      while (i < a.length && a[i] === b[i]) i++;
      at = ` @${i} web=…${a.slice(Math.max(0, i - 60), i + 120)} port=…${b.slice(Math.max(0, i - 60), i + 120)}`;
    }
    diffs += (domEq ? 0 : 1) + (pixEq ? 0 : 1) + (missing ? 1 : 0) + (empty ? 1 : 0);
    rows.push(`SCENA ${key.padEnd(26)} DOM=${domEq ? 'równy' : 'RÓŻNY'} PNG=${pixEq ? 'równy' : 'RÓŻNY'} (${w.png.length} B, sha256 ${createHash('sha256').update(w.png).digest('hex').slice(0, 12)}) brakujące_selektory=${missing}${empty ? ' PUSTY-DOM' : ''}${at}`);
  }
  if (errors.length) diffs += errors.length;
  for (const r of rows) console.log(r);
  if (errors.length) console.log('ERR: ' + errors.join(' | '));
  const webFixture = { vectors: res.web.vec, scenes: Object.fromEntries(Object.entries(res.web.scenes).map(([k, v]) => [k, { dom: v.dom, log: v.log }])) };
  const webHash = createHash('sha256').update(JSON.stringify(webFixture)).digest('hex');
  const pngHash = createHash('sha256').update(Buffer.concat(Object.values(res.web.scenes).map((v) => v.png))).digest('hex');
  console.log(`Chromium: ${res.web.ua}`);
  if (OUT) {
    writeFileSync(OUT, JSON.stringify({ topic: 'R-RUSTPORT-REPIN-UI-2-E-Q1', source: 'web origin/main (Chromium)', webFixtureSha256: webHash, webPngConcatSha256: pngHash, ...webFixture }, null, 1) + '\n');
  }
  const nVec = Object.values(res.web.vec).reduce((a, v) => a + v.length, 0);
  console.log(`run-repin-ui2e: modułów=${UI_MODS.length} funkcji=${Object.keys(res.web.vec).length} wektorów=${nVec} scen=${Object.keys(res.web.scenes).length} błędów_strony=${errors.length} różnic=${diffs} webFixtureSha256=${webHash} webPngSha256=${pngHash}`);
  exitCode = diffs === 0 ? 0 : 1;
} catch (e) {
  console.error('BŁĄD harnessu:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  if (browser) await browser.close();
  for (const s of servers) s.close();
  if (TMP) rmSync(TMP, { recursive: true, force: true });
}
process.exitCode = exitCode;
