'use strict';
/**
 * brick-live-measure.cjs -- POMIAR NA ZYWEJ GRZE (nie bramka), R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1.
 * Wzor: tools/citizen-consumption-era-live-measure.cjs. Zero zmian w repo: kopia zrodel do SCRATCH,
 * w kopii converters.ts/turn-economy.ts/main.ts hak ODCZYTU (log cykli Cegielni z realnego
 * advanceCityEconomy, stan magazynu cegly, budynki zablokowane brakiem cegly), vite build do scratch,
 * realny endTurn w headless Chromium.
 *   GRA_DIR=<abs gra> node brick-live-measure.cjs build <scratch> <work|main>
 *   node brick-live-measure.cjs sim <scratch> <evidenceDir> <seed> <turns> <forcedEra 0=naturalna> <label>
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(process.env.GRA_DIR || path.join(__dirname, '..', '..', '..', '..', 'gra'));
const MARKER = '(window as any).__cityForestTestDebug = {';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function startGameSource() {
  const t = fs.readFileSync(path.join(GRA_DIR, 'tools', 'clearing-deficit-live-measure.cjs'), 'utf8');
  const a = t.indexOf('        startGame: (seed');
  const b = t.indexOf('        world: () => ({');
  if (a < 0 || b < 0) throw new Error('nie znaleziono startGame w clearing-deficit-live-measure.cjs');
  return t.slice(a, b);
}

function hookSource() {
  return String.raw`
    (window as any).__ccMeas = (() => {
      const mine = () => cities.filter(c => c.ownerId === 0);
      return {
` + startGameSource() + String.raw`
        world: () => ({ turn, awaiting: isAwaitingFirstPlayerCity(), startHex: playerStartHex ? { q: playerStartHex.q, r: playerStartHex.r } : null }),
        found: (q: number, r: number): boolean => tryFoundPlayerCityAt(q, r),
        busy: () => endTurnInProgress,
        setEraAll: (era: number) => {
          (window as any).__ccForceEra = era;
          player.era = era;
          const ps: any = playerStateByHuman.get(0); if (ps) ps.era = era;
          for (const k of Array.from(ownerEraByOwner.keys())) ownerEraByOwner.set(k, era);
          return { me: empireEpochForOwner(0), ai: Array.from(ownerEraByOwner.entries()) };
        },
        giveBrickworks: () => { const c = mine()[0]; if (!c) return false; const b = cityBuilt.get(c.id) ?? []; if (!b.includes('cegielnia')) cityBuilt.set(c.id, [...b, 'cegielnia']); markCityStateDirty(); return true; },
        drainLog: () => { const l = ((globalThis as any).__brkLog ?? []) as any[]; (globalThis as any).__brkLog = []; return l; },
        owners: () => {
          const out: any[] = [];
          const ids = Array.from(new Set(cities.map(c => c.ownerId)));
          for (const o of ids) {
            if (o >= 90) continue;
            const st: Record<string, number> = { ...ownerResourceStockAll(cities, o) };
            const era = empireEpochForOwner(o);
            const nCities = cities.filter(c => c.ownerId === o).length;
            const nBrick = cities.filter(c => c.ownerId === o && (cityBuilt.get(c.id) ?? []).includes('cegielnia')).length;
            const builtAll = new Set<string>(); for (const c of cities) if (c.ownerId === o) for (const b of (cityBuilt.get(c.id) ?? [])) builtAll.add(b);
            let blockedOnlyBrick = 0, blockedBrickAny = 0, candidates = 0;
            for (const b of (data.buildings as any[])) {
              if (!b || builtAll.has(b.id) || (b.epokaWejscia ?? 1) > era) continue;
              const cost = buildingStockCost(b);
              if (!((cost as any).cegla > 0)) continue;
              candidates++;
              const miss = Object.keys(missingStockFor(st as any, cost as any));
              if (miss.includes('cegla')) { blockedBrickAny++; if (miss.length === 1) blockedOnlyBrick++; }
            }
            out.push({ owner: o, era, nCities, nBrick, pop: cities.filter(c => c.ownerId === o).reduce((s, c) => s + c.population, 0),
              cegla: st.cegla ?? 0, glina: st.glina ?? 0, drewno: st.drewno ?? 0, kamien: st.kamien ?? 0, candidates, blockedBrickAny, blockedOnlyBrick });
          }
          return out;
        },
      };
    })();
`;
}

function patchSrc(file, anchor, repl) {
  const t = fs.readFileSync(file, 'utf8');
  if (t.split(anchor).length !== 2) throw new Error('kotwica nie jest unikalna: ' + anchor);
  fs.writeFileSync(file, t.replace(anchor, () => repl), 'utf8');
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d); else fs.copyFileSync(s, d);
  }
}

function build(scratch, mode) {
  const g = path.join(scratch, 'gra');
  fs.rmSync(scratch, { recursive: true, force: true });
  fs.mkdirSync(g, { recursive: true });
  if (mode === 'main') {
    execSync('git archive origin/main gra/src gra/data gra/index.html gra/tsconfig.json gra/vite.config.ts gra/package.json | tar -x -C ' + JSON.stringify(scratch), { cwd: path.resolve(GRA_DIR, '..'), stdio: 'pipe', shell: '/bin/bash' });
  } else {
    copyTree(path.join(GRA_DIR, 'src'), path.join(g, 'src'));
    copyTree(path.join(GRA_DIR, 'data'), path.join(g, 'data'));
    for (const f of ['index.html', 'tsconfig.json', 'vite.config.ts', 'package.json']) fs.copyFileSync(path.join(GRA_DIR, f), path.join(g, f));
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(g, 'node_modules'), 'dir');
  patchSrc(path.join(g, 'src/game/converters.ts'),
    '  const cykle = Math.max(0, Math.min(tput, limitWejscia, limitWyjscia));',
    '  const cykle = Math.max(0, Math.min(tput, limitWejscia, limitWyjscia));\n' +
    "  if (recipe.id === 'cegielnia' && (globalThis as any).__brkReal) { ((globalThis as any).__brkLog ??= []).push({ owner: (globalThis as any).__brkOwner, tput, limitWejscia, limitWyjscia, cykle, glina: have('glina'), drewno: have('drewno'), cegla: have('cegla'), cap: outputCapacity, wyjscie: cykle * recipe.outputAmount, glinaZuzyta: cykle * (recipe.inputs.glina ?? 0), drewnoZuzyte: cykle * (recipe.inputs.drewno ?? 0) }); }");
  patchSrc(path.join(g, 'src/game/turn-economy.ts'),
    '      const convResult = runConverters(\n        activeRecipes,\n        pool,\n        ownerThroughputs,\n        () => cap,\n      );',
    '      (globalThis as any).__brkReal = true; (globalThis as any).__brkOwner = ownerId;\n      const convResult = runConverters(\n        activeRecipes,\n        pool,\n        ownerThroughputs,\n        () => cap,\n      );\n      (globalThis as any).__brkReal = false;');
  const mainPath = path.join(g, 'src', 'main.ts');
  let txt = fs.readFileSync(mainPath, 'utf8');
  const ERA_ANCHOR = '      player.era = next;';
  for (const a of [MARKER, ERA_ANCHOR]) if (txt.split(a).length !== 2) throw new Error('kotwica nie jest unikalna: ' + a);
  txt = txt.replace(ERA_ANCHOR, () => '      player.era = (window as any).__ccForceEra ?? next;');
  const idx = txt.indexOf(MARKER);
  const lineStart = txt.lastIndexOf('\n', idx) + 1;
  txt = txt.slice(0, lineStart) + hookSource() + txt.slice(lineStart);
  fs.writeFileSync(mainPath, txt, 'utf8');
  const out = path.join(scratch, 'dist');
  execSync('node ./node_modules/vite/bin/vite.js build --outDir ' + JSON.stringify(out) + ' --emptyOutDir', { cwd: g, stdio: 'pipe', maxBuffer: 1 << 28 });
  console.log('BUILD_OK ' + path.join(out, 'index.html'));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(chromium) {
  try { return await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] }); }
  catch (e) { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); }
}

async function openGame(scratch, seed) {
  const { chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  const browser = await launch(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.join(scratch, 'dist', 'index.html'), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__ccMeas && !!window.__eraTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await page.evaluate((s) => window.__ccMeas.startGame(s, 'kontynenty', 3, 4), seed);
  const t0 = Date.now();
  while (Date.now() - t0 < 300000) {
    const w = await page.evaluate(() => window.__ccMeas.world());
    const overlay = await page.evaluate(() => Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null));
    if (!overlay && w.awaiting && w.startHex) break;
    await wait(500);
  }
  const ok = await page.evaluate(() => window.__ccMeas.found(window.__ccMeas.world().startHex.q, window.__ccMeas.world().startHex.r));
  if (!ok) throw new Error('found false');
  await wait(800);
  return { browser, page, errors };
}

async function endTurn(page) {
  const t0 = await page.evaluate(() => window.__ccMeas.world().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const s = Date.now();
  while (Date.now() - s < 120000) {
    const busy = await page.evaluate(() => window.__ccMeas.busy());
    const t = await page.evaluate(() => window.__ccMeas.world().turn);
    if (!busy && t > t0) return t;
    await wait(100);
  }
  throw new Error('endTurn timeout from turn ' + t0);
}

async function modeSim(scratch, evidence, seed, turns, forcedEra, label) {
  fs.mkdirSync(evidence, { recursive: true });
  const { browser, page, errors } = await openGame(scratch, seed);
  const per = [];
  try {
    if (forcedEra > 0) await page.evaluate((e) => window.__ccMeas.setEraAll(e), forcedEra);
    await page.evaluate(() => window.__ccMeas.giveBrickworks());
    for (let i = 0; i < turns; i++) {
      await endTurn(page);
      const log = await page.evaluate(() => window.__ccMeas.drainLog());
      const owners = await page.evaluate(() => window.__ccMeas.owners());
      per.push({ turn: i + 1, log, owners });
    }
  } finally { await browser.close(); }
  const agg = { calls: 0, cykle: 0, wyjscie: 0, glinaZuzyta: 0, drewnoZuzyte: 0, bind: { tput: 0, glina: 0, drewno: 0, wyjscie: 0 }, zeroCycle: 0 };
  const ownerAgg = {};
  for (const p of per) for (const l of p.log) {
    agg.calls++; agg.cykle += l.cykle; agg.wyjscie += l.wyjscie; agg.glinaZuzyta += l.glinaZuzyta; agg.drewnoZuzyte += l.drewnoZuzyte;
    const inGlina = Math.floor(l.glina / 2), inDrewno = l.drewno;
    let b;
    if (l.limitWyjscia < l.tput && l.limitWyjscia < l.limitWejscia) b = 'wyjscie';
    else if (l.tput <= l.limitWejscia) b = 'tput';
    else b = inGlina <= inDrewno ? 'glina' : 'drewno';
    agg.bind[b]++;
    if (l.cykle === 0) agg.zeroCycle++;
    const k = l.owner === 0 ? 'player' : 'ai';
    const o = ownerAgg[k] || (ownerAgg[k] = { calls: 0, cykle: 0, tputSum: 0, bind: { tput: 0, glina: 0, drewno: 0, wyjscie: 0 } });
    o.calls++; o.cykle += l.cykle; o.tputSum += l.tput; o.bind[b]++;
  }
  const sum = (f) => per.reduce((s, p) => s + p.owners.reduce((q, o) => q + f(o), 0), 0);
  const cnt = (f) => per.reduce((s, p) => s + p.owners.filter(f).length, 0);
  const brickOwners = per.reduce((s, p) => s + p.owners.filter(o => o.nBrick > 0).length, 0);
  const summary = {
    label, seed, turns, forcedEra, agg, ownerAgg,
    ownerTurnsWithBrickworks: brickOwners,
    meanCeglaStockBrickOwners: brickOwners ? per.reduce((s, p) => s + p.owners.filter(o => o.nBrick > 0).reduce((q, o) => q + o.cegla, 0), 0) / brickOwners : null,
    ownerTurnsCeglaLt5: cnt(o => o.nBrick > 0 && o.cegla < 5),
    blockedOnlyBrickBuildingTurns: sum(o => o.blockedOnlyBrick),
    blockedBrickAnyBuildingTurns: sum(o => o.blockedBrickAny),
    candidateBuildingTurns: sum(o => o.candidates),
    finalOwners: per[per.length - 1].owners, errors: errors.slice(0, 5),
  };
  const file = path.join(evidence, 'sim-' + label + '-seed' + seed + '.json');
  fs.writeFileSync(file, JSON.stringify({ summary, per }));
  console.log('RESULT_FILE=' + file);
  console.log(JSON.stringify({ ...summary, finalOwners: undefined }));
}

(async () => {
  const [cmd, scratch, a3, a4, a5, a6, a7] = process.argv.slice(2);
  if (cmd === 'build') build(scratch, a3 || 'work');
  else if (cmd === 'sim') await modeSim(scratch, a3, Number(a4 || 7), Number(a5 || 40), Number(a6 || 0), a7 || 'run');
  else { console.error('uzycie: build|sim'); process.exit(2); }
})().catch((e) => { console.error(e); process.exit(1); });
