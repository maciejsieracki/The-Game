'use strict';

/** Live production-logic check for brightness and immediate highlight invalidation. */
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const GRA = path.resolve(__dirname, '..');
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join('/workspace', `tmp-improvement-highlight-live-${RUN_ID}`);
const CONFIG = path.join('/workspace', `tmp-improvement-highlight-live-${RUN_ID}.config.ts`);
const EVIDENCE = path.resolve(__dirname, '../../dyspozycje/autobot/runs/R-IMPROVEMENT-BUILD-HIGHLIGHT-LIFECYCLE-Q1/dowody');
const FAIL = [];
let PASS = 0;
function check(label, condition, detail) {
  if (condition) { PASS++; console.log(`  OK ${label}`); }
  else { FAIL.push({ label, detail }); console.error(` FAIL ${label}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`); }
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

function writeViteConfig() {
  const hooks = `      highlightLive: {
        activate: (key: string) => { buildModeOpen = true; foundCityMode = false; activeWonderId = null; activeImprovementKey = key as ImprovementKey; refreshBuildApi(); refreshBuildHighlight(); },
        eligible: (key: string) => buildApi?.getQualifyingHexes(key as ImprovementKey) ?? [],
        availableKeys: () => buildApi?.listTypes().map(x => x.key) ?? [],
        pending: () => [...pendingImprovementsTurn.getUndoKeySet()],
        state: () => {
          const generic = unitRenderer as any;
          const tint: any = mineEligibleGroup?.children.find((child: any) => child.isMesh);
          return { active: activeImprovementKey, genericCount: generic.highlightGroup?.children?.length ?? 0,
            genericOpacity: generic.highlightMaterials?.[0]?.opacity ?? null,
            mineCount: tint ? (tint.isInstancedMesh ? tint.count : Math.round((tint.geometry?.attributes?.position?.count ?? 0) / 288)) : 0,
            mineOpacity: tint?.material?.opacity ?? null };
        },
        focus: (q: number, r: number, dist: number) => { const p = axialToWorld(q, r, HEX_R); camCtrl.focusAt(p.x, p.z, dist); },
        seedMineAtHill: (key: string) => {
          const nodes = buildAllTerritoryNodes(); const city = cities.find(c => c.ownerId === ME());
          const picks = Object.values(map.hexes).filter((h: any) => h
            && (h.terenBazowy === TerenBazowy.Wzgorza || h.terenBazowy === TerenBazowy.Gory)
            && isTerritoryHexOwnedBy(h.coords.q, h.coords.r, ME(), nodes)
            && (placedImprovements.get(keyOf(h.coords.q, h.coords.r)) ?? []).length === 0)
            .sort((a: any, b: any) => Math.abs(a.coords.q-city.q)+Math.abs(a.coords.r-city.r)-Math.abs(b.coords.q-city.q)-Math.abs(b.coords.r-city.r));
          const h: any = picks[0]; if (!h) return null;
          h.zloze = key === 'kopalnia_miedzi' ? 'miedz' : key === 'kopalnia_zelaza' ? 'zelazo' : key === 'kopalnia_cyny' ? 'cyna' : 'zloto';
          refreshBuildApi(); return { q:h.coords.q, r:h.coords.r, terrain:String(h.terenBazowy), deposit:h.zloze };
        },
        build: (key: string, q: number, r: number) => {
          const req = buildApi?.createBuildRequest(key as ImprovementKey, q, r); if (!req) return null;
          applyBuildRequest(req); return req;
        },
        undo: (key: string, q: number, r: number) => applyBuildRequest({ type:'buildImprovement', key: key as ImprovementKey,
          q, r, hexKey:keyOf(q,r), kosztPraca:0, action:'ulepszenie' }),
        layers: (q: number, r: number) => placedImprovements.get(keyOf(q,r)) ?? [],
      },
`;
  const cfg = `
import base from ${JSON.stringify(path.join(GRA, 'vite.config.ts'))};
export default {
  ...base,
  plugins: [{
    name: 'improvement-highlight-live-hook', enforce: 'pre',
    transform(code: string, id: string) {
      if (!id.replace(/\\\\/g, '/').endsWith('/src/main.ts')) return null;
      const anchor = '      findTestHexes:';
      const at = code.indexOf(anchor);
      if (at < 0) throw new Error('highlight test hook anchor not found');
      return code.slice(0, at) + ${JSON.stringify(hooks)} + code.slice(at);
    },
  }, ...((base as any).plugins ?? [])],
};
`;
  fs.writeFileSync(CONFIG, cfg, 'utf8');
}

function build() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  writeViteConfig();
  console.log(`[live] build produkcyjny do ${OUT_DIR}`);
  execFileSync(process.execPath, ['./node_modules/vite/bin/vite.js', 'build', '--config', CONFIG,
    '--outDir', OUT_DIR, '--emptyOutDir'], { cwd: GRA, stdio: 'inherit' });
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('missing index.html');
}

function startServer() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const target = pathname === '/' ? path.join(OUT_DIR, 'index.html') : path.resolve(OUT_DIR, `.${pathname}`);
    if (!target.startsWith(OUT_DIR + path.sep) && target !== path.join(OUT_DIR, 'index.html')) { res.writeHead(403).end(); return; }
    fs.readFile(target, (error, data) => {
      if (error) { res.writeHead(204).end(); return; }
      res.setHeader('content-type', 'text/html; charset=utf-8'); res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function takeShot(page, q, r, file) {
  await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.highlightLive.focus(q, r, 5), { q, r });
  await pause(800);
  await page.screenshot({ path: path.join(EVIDENCE, file) });
}

async function main() {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  build();
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:${port}/?playtest=mapa`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__buildRequestTestDebug?.highlightLive
      && window.__buildRequestTestDebug.getWorldState().citiesLen > 0
      && window.__buildRequestTestDebug.getWorldState().turn === 1, undefined, { timeout: 180000 });
    await page.evaluate(() => { window.__buildRequestTestDebug.unlockAllTech(); window.__buildRequestTestDebug.setPlayerPracaPool(1000000); });

    console.log('\n-- pełny zestaw widocznych typów ulepszeń --');
    const available = await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.availableKeys());
    check('panel udostępnia typy ulepszeń do pomiaru', available.length > 0, available);
    for (const key of available) {
      await page.evaluate(key => window.__buildRequestTestDebug.highlightLive.activate(key), key);
      const [eligible, state, pending] = await page.evaluate(key => [
        window.__buildRequestTestDebug.highlightLive.eligible(key),
        window.__buildRequestTestDebug.highlightLive.state(),
        window.__buildRequestTestDebug.highlightLive.pending(),
      ], key);
      const pendingCount = eligible.filter(({q,r}) => pending.includes(`${q},${r}:${key}`)).length;
      const expectedCount = eligible.length - pendingCount;
      if (key.startsWith('kopalnia_')) {
        check(`${key}: relief overlay pokazuje tylko kwalifikujące pola`, state.mineCount === expectedCount, { expectedCount, state });
        if (expectedCount > 0) check(`${key}: krycie kopalni 0.36`, Math.abs(state.mineOpacity - 0.36) < 1e-8, state);
      } else {
        check(`${key}: standardowy overlay pokazuje tylko kwalifikujące pola`, state.genericCount === expectedCount, { expectedCount, state });
        if (expectedCount > 0) check(`${key}: krycie budowy 0.42`, Math.abs(state.genericOpacity - 0.42) < 1e-8, state);
      }
    }

    console.log('\n-- nieudana budowa pozostawia overlay, udana usuwa pending tile, undo przywraca --');
    const farm = await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.eligible('farma'));
    const farmHex = farm[0];
    check('znaleziono pole farmy', !!farmHex, farm.length);
    if (farmHex) {
      await page.evaluate(() => { window.__buildRequestTestDebug.setPlayerPracaPool(0); window.__buildRequestTestDebug.highlightLive.activate('farma'); });
      const countBeforeFail = (await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.state())).genericCount;
      await page.evaluate(({q,r}) => window.__buildRequestTestDebug.highlightLive.build('farma',q,r), farmHex);
      const afterFail = await page.evaluate(({q,r}) => ({ layers:window.__buildRequestTestDebug.highlightLive.layers(q,r),
        state:window.__buildRequestTestDebug.highlightLive.state() }), farmHex);
      check('brak zasobów nie stawia ulepszenia', !afterFail.layers.includes('farma'), afterFail.layers);
      check('brak zasobów nie usuwa pola z overlay', afterFail.state.genericCount === countBeforeFail, afterFail.state);
      await page.evaluate(() => window.__buildRequestTestDebug.setPlayerPracaPool(1000000));
      await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.activate('farma'));
      await takeShot(page, farmHex.q, farmHex.r, 'farm-before.png');
      await page.evaluate(({q,r}) => window.__buildRequestTestDebug.highlightLive.build('farma',q,r), farmHex);
      if (await page.locator('.civ-imp-build-ok').count()) await page.locator('.civ-imp-build-ok').click();
      const afterFarm = await page.evaluate(({q,r}) => ({ layers:window.__buildRequestTestDebug.highlightLive.layers(q,r),
        state:window.__buildRequestTestDebug.highlightLive.state(), eligible:window.__buildRequestTestDebug.highlightLive.eligible('farma') }), farmHex);
      check('farma faktycznie zbudowana', afterFarm.layers.includes('farma'), afterFarm.layers);
      const pendingFarmId = `${farmHex.q},${farmHex.r}:farma`;
      const pendingAfterFarm = await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.pending());
      check('zbudowana farma znika z overlay, ale pozostaje cofana w bieżącej turze',
        afterFarm.eligible.some(h=>h.q===farmHex.q&&h.r===farmHex.r)
          && pendingAfterFarm.includes(pendingFarmId)
          && afterFarm.state.genericCount === afterFarm.eligible.length - 1, { state:afterFarm.state, eligible:afterFarm.eligible.length, pendingAfterFarm });
      await takeShot(page, farmHex.q, farmHex.r, 'farm-after.png');
      await page.evaluate(({q,r}) => { window.__buildRequestTestDebug.highlightLive.activate('bydlo'); window.__buildRequestTestDebug.highlightLive.activate('farma'); }, farmHex);
      const afterReselect = await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.state());
      check('przełączenie zaznaczenia nie przywraca wybudowanego pola', afterReselect.genericCount === countBeforeFail - 1, afterReselect);
      await page.evaluate(({q,r}) => window.__buildRequestTestDebug.highlightLive.undo('farma',q,r), farmHex);
      const afterUndo = await page.evaluate(({q,r}) => ({layers:window.__buildRequestTestDebug.highlightLive.layers(q,r),
        eligible:window.__buildRequestTestDebug.highlightLive.eligible('farma'), state:window.__buildRequestTestDebug.highlightLive.state()}), farmHex);
      check('cofnięcie budowy przywraca niezbudowane pole do overlay', !afterUndo.layers.includes('farma')
        && afterUndo.eligible.some(h=>h.q===farmHex.q&&h.r===farmHex.r), afterUndo);

      // Integrated lifecycle: a same-turn undo restores eligibility, a replacement build
      // becomes pending again, and the real game end-turn path commits it without restoring
      // the used tile to the candidate overlay.
      await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.activate('farma'));
      const beforeTurn = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
      await page.evaluate(({q,r}) => window.__buildRequestTestDebug.highlightLive.build('farma',q,r), farmHex);
      if (await page.locator('.civ-imp-build-ok').count()) await page.locator('.civ-imp-build-ok').click();
      const rebuiltFarm = await page.evaluate(({q,r}) => ({ layers:window.__buildRequestTestDebug.highlightLive.layers(q,r),
        pending:window.__buildRequestTestDebug.highlightLive.pending(),
        state:window.__buildRequestTestDebug.highlightLive.state() }), farmHex);
      const rebuiltFarmId = `${farmHex.q},${farmHex.r}:farma`;
      check('po cofnięciu ponowna budowa ponownie rejestruje pending',
        rebuiltFarm.layers.includes('farma') && rebuiltFarm.pending.includes(rebuiltFarmId), rebuiltFarm);
      await page.evaluate(() => window.__eraTestDebug.endTurn());
      await page.waitForFunction(({ beforeTurn }) => window.__eraTestDebug.getWorldState().turn > beforeTurn
        && !window.__eraTestDebug.isEndTurnInProgress(), { beforeTurn }, { timeout:180000, polling:250 });
      const afterTurn = await page.evaluate(({q,r}) => ({ turn:window.__eraTestDebug.getWorldState().turn,
        layers:window.__buildRequestTestDebug.highlightLive.layers(q,r),
        pending:window.__buildRequestTestDebug.highlightLive.pending(),
        eligible:window.__buildRequestTestDebug.highlightLive.eligible('farma'),
        state:window.__buildRequestTestDebug.highlightLive.state() }), farmHex);
      check('realna zmiana tury commitowała farmę i czyści overlay trybu budowy',
        afterTurn.turn > beforeTurn && afterTurn.layers.includes('farma')
          && !afterTurn.pending.includes(rebuiltFarmId)
          && afterTurn.state.genericCount === 0 && afterTurn.state.mineCount === 0, afterTurn);
    }

    console.log('\n-- kopalnia na reliefie: dokładny test zbudowanej góry --');
    const mineHex = await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.seedMineAtHill('kopalnia_miedzi'));
    check('znaleziono wzgórze/górę w zasięgu terytorium', !!mineHex, mineHex);
    if (mineHex) {
      await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.activate('kopalnia_miedzi'));
      const before = await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.state());
      check('widoczny mine tint ma krycie 0.36', Math.abs(before.mineOpacity - 0.36) < 1e-8, before);
      check('kandydat mine podświetlony przed budową', before.mineCount > 0, before);
      await takeShot(page, mineHex.q, mineHex.r, 'mine-before.png');
      await page.evaluate(({q,r}) => window.__buildRequestTestDebug.highlightLive.build('kopalnia_miedzi',q,r), mineHex);
      if (await page.locator('.civ-imp-build-ok').count()) await page.locator('.civ-imp-build-ok').click();
      const after = await page.evaluate(({q,r}) => ({layers:window.__buildRequestTestDebug.highlightLive.layers(q,r),
        eligible:window.__buildRequestTestDebug.highlightLive.eligible('kopalnia_miedzi'), state:window.__buildRequestTestDebug.highlightLive.state()}), mineHex);
      check('kopalnia faktycznie zbudowana', after.layers.includes('kopalnia_miedzi'), after.layers);
      const pendingMineId = `${mineHex.q},${mineHex.r}:kopalnia_miedzi`;
      const pendingMine = await page.evaluate(() => window.__buildRequestTestDebug.highlightLive.pending());
      check('zbudowane wzgórze znika z cyan mine overlay natychmiast',
        after.eligible.some(h=>h.q===mineHex.q&&h.r===mineHex.r)
          && pendingMine.includes(pendingMineId)
          && after.state.mineCount === after.eligible.length - 1
          && after.state.mineCount === before.mineCount - 1, { after, before, pendingMine });
      await takeShot(page, mineHex.q, mineHex.r, 'mine-after.png');
      await page.evaluate(({q,r}) => window.__buildRequestTestDebug.highlightLive.undo('kopalnia_miedzi',q,r), mineHex);
      const undone = await page.evaluate(({q,r}) => ({layers:window.__buildRequestTestDebug.highlightLive.layers(q,r),
        eligible:window.__buildRequestTestDebug.highlightLive.eligible('kopalnia_miedzi'), state:window.__buildRequestTestDebug.highlightLive.state()}), mineHex);
      check('undo kopalni przywraca pole jako niezbudowane', !undone.layers.includes('kopalnia_miedzi')
        && undone.eligible.some(h=>h.q===mineHex.q&&h.r===mineHex.r), undone);
    }
    check('brak błędów JS/konsoli', errors.length === 0, errors);
    await page.close();
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    fs.rmSync(CONFIG, { force: true });
  }
  console.log(`\n${PASS} passed, ${FAIL.length} failed`);
  if (FAIL.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
