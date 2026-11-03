'use strict';
/**
 * auto-improve-unspent-diag.cjs — DIAGNOZA NA ZYWEJ GRZE (nie bramka), R-WEB-AUTO-IMPROVE-BUDGET-UNSPENT-DIAG-Q1.
 *
 * Zero zmian w `gra/src`: tool kopiuje `gra/{src,data,index.html,...}` do SCRATCH (poza repo), wstawia do KOPII `main.ts`
 * (a) alias-importy, (b) hak `window.__impDiag` (tylko odczyt + fixture polityki/techow/puli), (c) owija wywolanie
 * `pickAutoImprovements(` automatu GRACZA w `window.__wrapPick` (log: pula na wejsciu, picki, SONDA z nieograniczona pula),
 * buduje vite do scratch i steruje REALNA gra w headless Chromium (REALNY endTurn, REALNA nowa gra).
 *
 *   node tools/auto-improve-unspent-diag.cjs build <scratchDir>
 *   node tools/auto-improve-unspent-diag.cjs run   <scratchDir> <evidenceDir> <json-spec>
 *      spec: {name,seed,typ,focus,onlyWorked,wolno,pct,praca0,turns,cities,techs:'all'|'natural',snapAt:[..]}
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MARKER = '(window as any).__cityForestTestDebug = {';
const CALL_MARK = 'const picks = pickAutoImprovements({';
const AI_CALL_MARK = 'const foodPicks = pickAutoImprovements({';
const IMPORT_MARK = "import { isInTerritory, territoryOwnerAt, isPlayerTerritoryHex, cityTerritoryRadius } from './map/territory';";

const IMPORTS = String.raw`import { buildImprovementQualifier as __bIQ } from './map/improvement-build';
import { deficitImprovementKeys as __dIK } from './game/auto-improvements';
`;

const HOOK = String.raw`
    (window as any).__impDiag = (() => {
      const evLog: any[] = [];
      const origSet = hexClearingStates.set.bind(hexClearingStates);
      (hexClearingStates as any).set = (k: string, v: any) => { evLog.push({ ev: 'clr-set', turn, k }); return origSet(k, v); };
      const origPlSet = placedImprovements.set.bind(placedImprovements);
      (placedImprovements as any).set = (k: string, v: any) => { evLog.push({ ev: 'layers-set', turn, k, layers: [...v] }); return origPlSet(k, v); };
      const pickLog: any[] = [];
      let lastProbe: Set<string> = new Set();
      const myCities = () => cities.filter(c => c.ownerId === 0);
      (window as any).__wrapPick = (fn: any, o: any) => {
        const t0 = performance.now();
        const picks = fn(o);
        const ms = performance.now() - t0;
        const hist: Record<string, number> = {};
        let cost = 0;
        for (const p of picks) { hist[p.key] = (hist[p.key] ?? 0) + 1; cost += p.kosztPraca; }
        const rec: any = {
          turn, owner: o.ownerId, pool: o.pracaAvailable, pct: o.pracaBudgetPercent, reserve: o.pracaSurplusThreshold,
          nCities: o.cities.length, maxItemsPerCity: o.maxItemsPerCity ?? null, improvementBudgetCap: o.improvementBudgetCap ?? null,
          picksN: picks.length, picksCost: cost, hist, ms: Math.round(ms),
        };
        try {
          const probe = fn({ ...o, pracaAvailable: 1e12, pracaBudgetPercent: 100, getPracaBudgetPercent: undefined, improvementBudgetCap: undefined, surplusReport: undefined });
          const ph: Record<string, number> = {}; let pc = 0;
          for (const p of probe) { ph[p.key] = (ph[p.key] ?? 0) + 1; pc += p.kosztPraca; }
          rec.probeN = probe.length; rec.probeCost = pc; rec.probeHist = ph;
          lastProbe = new Set(probe.map((p: any) => p.q + ',' + p.r));
        } catch (e) { rec.probeErr = String(e); }
        pickLog.push(rec);
        return picks;
      };
      const hexDist = (aq: number, ar: number, bq: number, br: number) => (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs((aq - bq) + (ar - br))) / 2;
      return {
        evLog: () => evLog.splice(0, evLog.length),
        pickLog: () => pickLog.splice(0, pickLog.length),
        startGame: (seed: number, typ: string, rivals: number, csCount: number): void => {
          const mqTier = mapQualityTierFromQuery('high');
          const mqBundle = bundledMapQualityPreset(mqTier);
          const advanced: NewGameAdvancedOptions = {
            barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja',
            buildingCostPace: 'niski', kosztJednostekPace: 'niski', wzrostLudnosciPace: 'wysoki',
            ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
            cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
          };
          const label = ({ kontynenty: 'Kontynenty', pangea: 'Pangea', wyspy: 'Wyspy', ziemia: 'Ziemia' } as any)[typ] || 'Kontynenty';
          void doStartGame({
            civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Normalny',
            mapSize: 'Maly', rivals: String(rivals), speed: 'Normalna', worldType: label, typSwiata: typ, seed,
            mapQualityLabel: qualityTierToLabel(mqTier), mapQuality: mqTier,
            renderQualityLabel: qualityTierToLabel(mqBundle.renderQuality),
            mapDetailQualityLabel: qualityTierToLabel(mqBundle.mapDetailQuality),
            renderQuality: mqBundle.renderQuality, mapDetailQuality: mqBundle.mapDetailQuality,
            civTypesCount: 3, cityStatesCount: clampMiastaPanstwaCount(csCount),
            worldDensity: { ...DEFAULT_WORLD_DENSITY },
            worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
            advanced, villageRewardsEnabled: true,
          } as NewGameParams);
        },
        world: () => ({ turn, awaiting: isAwaitingFirstPlayerCity(), startHex: playerStartHex ? { q: playerStartHex.q, r: playerStartHex.r } : null, myCities: myCities().length }),
        found: (q: number, r: number): boolean => tryFoundPlayerCityAt(q, r),
        foundCandidates: (limit: number) => {
          const out: Array<{ q: number; r: number }> = [];
          for (const h of Object.values(map.hexes)) {
            if (out.length >= limit) break;
            if (canFoundPlayerCityAt(h.coords.q, h.coords.r).ok) out.push({ q: h.coords.q, r: h.coords.r });
          }
          return out;
        },
        grantTechs: (names: string[]) => { for (const n of names) player.zbadane.add(n); return Array.from(player.zbadane).length; },
        techCount: () => Array.from(player.zbadane).length,
        setPolicy: (p: any) => {
          const pol: any = ulepszeniaEmpireByOwner.get(0);
          if (p.tryb) pol.tryb = p.tryb;
          if (p.focus) pol.focus = p.focus;
          if (p.onlyWorked !== undefined) pol.onlyWorked = p.onlyWorked;
          if (p.wolno !== undefined) pol.wolnoWycinacLas = p.wolno;
          if (p.pct !== undefined) pol.pracaAutoPercent = p.pct;
          return { ...pol };
        },
        effectivePolicy: () => myCities().map(c => ({ id: c.id, ...effectiveUlepszeniaForCity(c) })),
        setBuildMode: (mode: string) => {
          const d: any = ownerDefaultBudowaProfil.get(0);
          if (mode) { d.budowaTryb = mode; for (const c of myCities()) { (c as any).budowaTryb = mode; (c as any).budowaFocusOverride = false; } }
          return { ...d };
        },
        setPop: (n: number) => { const c = myCities()[0]; c.population = n; markCityStateDirty(); return c.population; },
        setPraca: (n: number) => { setOwnerPracaPool(0, n); return ownerPracaPool(0); },
        praca: () => ownerPracaPool(0),
        autoKoszt: () => ownerLastPracaAutoUlepszeniaKoszt(0),
        upkeep: () => ({ upkeep: _lastPracaUpkeep, rate: _lastPracaRate }),
        deficit: () => resourceDeficitKeysForOwner(0),
        cityInfo: () => myCities().map(c => ({ id: c.id, q: c.q, r: c.r, pop: c.population })),
        busy: () => (window as any).__eraTestDebug.isEndTurnInProgress(),
        /** Klasyfikacja KAZDEGO heksu w zasiegu miast gracza (promien terytorium + 1 jak w pickerze) wg pierwszej bramki, ktora go odrzuca. */
        classify: (focus: string, wolno: boolean, onlyWorked: boolean) => {
          const nodes = buildAllTerritoryNodes();
          const mine = myCities();
          const techs: Set<string> = player.zbadane as any;
          const placed = new Map<string, string[]>();
          for (const [k, v] of placedImprovements) placed.set(k, Array.isArray(v) ? [...(v as any)] : [v as any]);
          const food = ['farma', 'bydlo', 'owce', 'lama', 'tarasy', 'lodzie_rybackie', 'irygacja', 'warzelnia_soli'];
          let keys: string[] = [...food];
          if (wolno) keys.push('wyrab');
          const defKeys: string[] = focus === 'zrownowazone' ? (__dIK(resourceDeficitKeysForOwner(0)) as string[]) : [];
          if (focus === 'zrownowazone') keys.push('oboz_lowiecki');
          if (focus === 'surowce') keys = ['tartak', 'kamieniolom', 'glinianka', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'stadnina', 'warzelnia_soli'];
          if (focus === 'infrastruktura') keys = ['posterunek', 'droga', 'droga_brukowana', 'fort'];
          keys = [...new Set([...keys, ...defKeys])];
          const allTechs = new Set<string>(['Obróbka drewna', 'Murarstwo']);
          for (const k of [...keys, 'tartak']) { const m = getImprovementMeta(k); if (m && m.techId) allTechs.add(m.techId); }
          const civ = civTypeForOwner(0);
          const era = empireEpochForOwner(0);
          const mkQ = (tset: Set<string>) => __bIQ({
            map, cityNodes: mine.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 })), territoryNodes: nodes,
            playerOwnerIdNum: 0, placedImprovements: placed, researchedTechs: tset, playerCivArchetype: civ, playerEra: era,
            horseStockAvailable: 0, tradeRouteKonUnlocked: false,
          } as any);
          const qAll = mkQ(allTechs);
          const qReal = mkQ(techs);
          const riverKeys = new Set<string>();
          for (const path of (map as any).riverPaths ?? []) for (const p of path) riverKeys.add(p.q + ',' + p.r);
          const nb = (hk: string) => { const [a, b] = hk.split(',').map(Number); return [(a + 1) + ',' + b, (a - 1) + ',' + b, a + ',' + (b + 1), a + ',' + (b - 1), (a + 1) + ',' + (b - 1), (a - 1) + ',' + (b + 1)]; };
          const onRiver = (hk: string) => riverKeys.has(hk) || (map.hexes[hk] as any)?.rzeka?.obecna === true
            || nb(hk).some(n => riverKeys.has(n) || (map.hexes[n] as any)?.rzeka?.obecna === true);
          const worked = new Set<string>();
          const perCity: any[] = [];
          const seen = new Map<string, any>();
          for (const c of mine) {
            const w = workedHexCoordsForCity(c as any, map, nodes, siblingClaimedHexKeysForCity(c));
            worked.add(c.q + ',' + c.r);
            for (const x of w) worked.add(x.q + ',' + x.r);
            const rad = cityTerritoryRadius({ q: c.q, r: c.r, pop: c.population, level: 1 } as any) + 1;
            const hx = hexKeysWithinRadius(c.q, c.r, rad, map);
            perCity.push({ id: c.id, pop: c.population, workedN: w.length, radiusPicker: rad, hexesInRadius: hx.length });
            for (const hk of hx) if (!seen.has(hk)) seen.set(hk, c);
          }
          const classes: Record<string, number> = {};
          const terenInEmpty: Record<string, number> = {};
          const hasKeyCounts: Record<string, number> = {};
          const candidateInProbe = { inProbe: 0, notInProbe: 0 };
          const LV: Record<string, number> = { TEREN: 2, TECH: 3, OBYWATEL: 5, REGULA_RZEKA_FARMA: 6, KANDYDAT: 7 };
          let total = 0, owned = 0;
          for (const [hk] of seen) {
            const [q, r] = hk.split(',').map(Number);
            const hex: any = map.hexes[hk];
            total++;
            const mineHex = isTerritoryHexOwnedBy(q, r, 0, nodes);
            if (!mineHex) { classes['0_NIE_W_MOIM_TERYTORIUM'] = (classes['0_NIE_W_MOIM_TERYTORIUM'] ?? 0) + 1; continue; }
            owned++;
            const layers = placed.get(hk) ?? [];
            if (layers.length > 0) {
              classes['1_MA_ULEPSZENIE'] = (classes['1_MA_ULEPSZENIE'] ?? 0) + 1;
              for (const l of layers) hasKeyCounts[l] = (hasKeyCounts[l] ?? 0) + 1;
              continue;
            }
            let best = 'TEREN';
            let bestLv = 2;
            const consider = (name: string) => { const lv = LV[name]; if (lv > bestLv) { best = name; bestLv = lv; } };
            for (const key of keys) {
              if (!qAll(key as any, q, r)) continue;            // brak zastosowania terenu/warunku (nawet z pelnymi technologiami)
              if (!isImprovementTechUnlocked(key, techs) || !qReal(key as any, q, r)) { consider('TECH'); continue; }
              if (onlyWorked && !worked.has(hk)) { consider('OBYWATEL'); continue; }
              if ((key === 'bydlo' || key === 'owce' || key === 'lama') && !onRiver(hk)) { consider('REGULA_RZEKA_FARMA'); continue; }
              consider('KANDYDAT');
            }
            let cls = best;
            if (best === 'KANDYDAT') { if (lastProbe.has(hk)) { cls = 'KANDYDAT_W_SONDZIE'; candidateInProbe.inProbe++; } else { cls = 'KANDYDAT_POZA_SONDA'; candidateInProbe.notInProbe++; } }
            const order: Record<string, string> = { TEREN: '2_BRAK_ZASTOSOWANIA_TERENU', TECH: '3_BRAK_TECH', OBYWATEL: '4_FILTR_OBYWATELI', REGULA_RZEKA_FARMA: '5_REGULA_TRZODA_TYLKO_PRZY_RZECE', KANDYDAT_W_SONDZIE: '6a_KANDYDAT_W_SONDZIE', KANDYDAT_POZA_SONDA: '6b_KANDYDAT_POZA_SONDA' };
            const nm = order[cls];
            classes[nm] = (classes[nm] ?? 0) + 1;
            if (cls === 'TEREN') { const t = String(hex?.terenBazowy) + '/' + String(hex?.nakladka); terenInEmpty[t] = (terenInEmpty[t] ?? 0) + 1; }
          }
          return { keys, defKeys, total, owned, classes, terenInEmpty, hasKeyCounts, perCity, workedUnion: worked.size, nTechs: techs.size };
        },
      };
    })();

`;

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d); else fs.copyFileSync(s, d);
  }
}

function build(scratch) {
  const g = path.join(scratch, 'gra');
  fs.rmSync(g, { recursive: true, force: true });
  fs.mkdirSync(g, { recursive: true });
  copyTree(path.join(GRA_DIR, 'src'), path.join(g, 'src'));
  copyTree(path.join(GRA_DIR, 'data'), path.join(g, 'data'));
  for (const f of ['index.html', 'tsconfig.json', 'vite.config.ts', 'package.json']) fs.copyFileSync(path.join(GRA_DIR, f), path.join(g, f));
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(g, 'node_modules'), 'dir');
  const mainPath = path.join(g, 'src', 'main.ts');
  let txt = fs.readFileSync(mainPath, 'utf8');
  if (!txt.includes(IMPORT_MARK)) throw new Error('IMPORT_MARK nie znaleziony');
  txt = txt.replace(IMPORT_MARK, IMPORTS + IMPORT_MARK);
  if (txt.split(CALL_MARK).length !== 2) throw new Error('CALL_MARK ma byc dokladnie 1: ' + (txt.split(CALL_MARK).length - 1));
  txt = txt.replace(CALL_MARK, 'const picks = (window as any).__wrapPick(pickAutoImprovements, {');
  const aiPath = path.join(g, 'src', 'game', 'ai.ts');
  let aiTxt = fs.readFileSync(aiPath, 'utf8');
  if (aiTxt.split(AI_CALL_MARK).length !== 2) throw new Error('AI_CALL_MARK ma byc dokladnie 1');
  aiTxt = aiTxt.replace(AI_CALL_MARK, 'const foodPicks = (globalThis as any).__wrapPick(pickAutoImprovements, {');
  fs.writeFileSync(aiPath, aiTxt, 'utf8');
  const idx = txt.indexOf(MARKER);
  if (idx < 0) throw new Error('marker __cityForestTestDebug nie znaleziony');
  const lineStart = txt.lastIndexOf('\n', idx) + 1;
  txt = txt.slice(0, lineStart) + HOOK + txt.slice(lineStart);
  fs.writeFileSync(mainPath, txt, 'utf8');
  const out = path.join(scratch, 'dist');
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(out)} --emptyOutDir`, { cwd: g, stdio: 'pipe', maxBuffer: 1 << 28 });
  console.log('BUILD_OK ' + path.join(out, 'index.html'));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launchCtx(chromium, userDir) {
  const opts = { headless: true, viewport: { width: 640, height: 400 }, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  try { return await chromium.launchPersistentContext(userDir, opts); }
  catch (e) { return await chromium.launchPersistentContext(userDir, { ...opts, executablePath: FALLBACK_CHROME }); }
}

const T0 = Date.now();
const log = (m) => console.error('[' + Math.round((Date.now() - T0) / 1000) + 's] ' + m);

async function openGame(scratch, spec, resume) {
  const { chromium } = require('playwright');
  const userDir = path.join(scratch, 'profile-' + spec.name);
  const ctx = await launchCtx(chromium, userDir);
  const browser = { close: () => ctx.close() };
  const errors = [];
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.goto('file://' + path.join(scratch, 'dist', 'index.html'), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__impDiag && !!window.__eraTestDebug && !!window.__truceSaveLoadTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  if (resume) {
    await page.evaluate(() => window.__truceSaveLoadTestDebug.loadSlot('diag'));
    const t1 = Date.now();
    while (Date.now() - t1 < 240000) {
      const w = await page.evaluate(() => window.__impDiag.world());
      if (w.myCities > 0 && w.turn === resume.turn) break;
      await wait(500);
    }
    log('resumed at turn ' + resume.turn);
    return { browser, page, errors };
  }
  await page.evaluate(([s, t, rv, cs]) => window.__impDiag.startGame(s, t, rv, cs), [spec.seed, spec.typ, spec.rivals ?? 3, spec.cityStates ?? 4]);
  const t0 = Date.now();
  while (Date.now() - t0 < 400000) {
    const w = await page.evaluate(() => window.__impDiag.world());
    const overlay = await page.evaluate(() => Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null));
    if (!overlay && w.awaiting && w.startHex) break;
    await wait(500);
  }
  log('world ready');
  const ok = await page.evaluate(() => window.__impDiag.found(window.__impDiag.world().startHex.q, window.__impDiag.world().startHex.r));
  if (!ok) throw new Error('foundPlayerStartCity false');
  await wait(800);
  return { browser, page, errors };
}

async function endTurn(page) {
  const t0 = await page.evaluate(() => window.__impDiag.world().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const s = Date.now();
  while (Date.now() - s < 180000) {
    const busy = await page.evaluate(() => window.__impDiag.busy());
    const t = await page.evaluate(() => window.__impDiag.world().turn);
    if (!busy && t > t0) return t;
    await wait(100);
  }
  throw new Error('endTurn timeout from turn ' + t0);
}

const ALL_TECHS = ['Rolnictwo', 'Oswojenie zwierząt', 'Irygacja', 'Gospodarka wodna', 'Obróbka drewna', 'Łowiectwo', 'Garncarstwo', 'Murarstwo',
  'Brązownictwo', 'Żegluga', 'Koło', 'Jeździectwo', 'Waluta', 'Wojskowość', 'Hutnictwo żelaza', 'Drogi brukowane'];

async function run(scratch, evidence, spec) {
  fs.mkdirSync(evidence, { recursive: true });
  const stateFile = path.join(scratch, 'state-' + spec.name + '.json');
  const resume = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : null;
  const tStart = Date.now();
  let openArg = resume;
  if (!resume && spec.base) {
    const src = path.join(scratch, 'profile-' + spec.base);
    const dst = path.join(scratch, 'profile-' + spec.name);
    fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(src, dst, { recursive: true });
    openArg = JSON.parse(fs.readFileSync(path.join(scratch, 'base-' + spec.base + '.json'), 'utf8'));
  }
  const { browser, page, errors } = await openGame(scratch, spec, openArg);
  const tag = spec.name;
  const info = resume ? resume.info : { spec };
  const rows = resume ? resume.rows : [];
  const snaps = resume ? resume.snaps : {};
  const foundAt = resume ? resume.foundAt : {};
  info.chunks = (info.chunks || 0) + 1;
  if (resume) {
    await page.evaluate((s) => window.__impDiag.setPolicy({ tryb: 'auto', focus: s.focus, onlyWorked: s.onlyWorked, wolno: s.wolno, pct: s.pct }), spec);
    await page.evaluate(() => window.__impDiag.setBuildMode('reczny'));
    await page.evaluate((n) => window.__impDiag.setPraca(n), resume.pool);
    info.effectivePolicyAfterResume = await page.evaluate(() => window.__impDiag.effectivePolicy());
  } else {
    if (spec.techs === 'all') info.techs = await page.evaluate((t) => window.__impDiag.grantTechs(t), ALL_TECHS);
    else info.techs = await page.evaluate(() => window.__impDiag.techCount());
    info.policy = await page.evaluate((s) => window.__impDiag.setPolicy({ tryb: 'auto', focus: s.focus, onlyWorked: s.onlyWorked, wolno: s.wolno, pct: s.pct }), spec);
    await page.evaluate(() => window.__impDiag.setBuildMode('reczny'));
    if (spec.pop != null) info.popSet = await page.evaluate((n) => window.__impDiag.setPop(n), spec.pop);
    if (spec.praca0 != null) info.praca0set = await page.evaluate((n) => window.__impDiag.setPraca(n), spec.praca0);
    info.effectivePolicy0 = await page.evaluate(() => window.__impDiag.effectivePolicy());
  }
  const snapAt = new Set(spec.snapAt || []);
  const budgetMs = (spec.budgetSec || 400) * 1000;
  while (rows.length < spec.turns) {
    if (Date.now() - tStart > budgetMs) break;
    const poolBefore = await page.evaluate(() => window.__impDiag.praca());
    await page.evaluate(() => { window.__impDiag.pickLog(); window.__impDiag.evLog(); });
    const tNew = await endTurn(page);
    log('turn ' + tNew);
    const poolAfter = await page.evaluate(() => window.__impDiag.praca());
    const kosztAuto = await page.evaluate(() => window.__impDiag.autoKoszt());
    const upk = await page.evaluate(() => window.__impDiag.upkeep());
    const allCalls = await page.evaluate(() => window.__impDiag.pickLog());
    const calls = allCalls.filter((c) => c.owner === 0);
    const aiCalls = allCalls.filter((c) => c.owner !== 0).map((c) => ({ owner: c.owner, pool: c.pool, cap: c.improvementBudgetCap, pct: c.pct, n: c.picksN, cost: c.picksCost, hist: c.hist, probeN: c.probeN, probeCost: c.probeCost, nCities: c.nCities, maxItems: c.maxItemsPerCity }));
    const ev = await page.evaluate(() => window.__impDiag.evLog());
    const cityInfo = await page.evaluate(() => window.__impDiag.cityInfo());
    const deficit = await page.evaluate(() => window.__impDiag.deficit());
    const picksN = calls.reduce((n, c) => n + c.picksN, 0);
    rows.push({ upk, aiCalls, turnAfter: tNew, poolBefore, poolAfter, kosztAuto, calls, evN: ev.length, picksN, cities: cityInfo, deficitN: deficit.length, deficit });
    if (cityInfo.length < spec.cities && tNew % 4 === 0) {
      const cands = await page.evaluate(() => window.__impDiag.foundCandidates(60));
      const pick = await page.evaluate((cs) => {
        const c0 = window.__impDiag.world().startHex; let best = null, bd = 1e9;
        for (const c of cs) { const d = Math.abs(c.q - c0.q) + Math.abs(c.r - c0.r); if (d >= 4 && d < bd) { bd = d; best = c; } }
        return best;
      }, cands);
      if (pick) {
        let ok = await page.evaluate(([q, r]) => window.__impDiag.found(q, r), [pick.q, pick.r]);
        if (!ok) { ok = await page.evaluate(([q, r]) => { const p = window.__impDiag.praca(); window.__impDiag.setPraca(p + 500); const k = window.__impDiag.found(q, r); window.__impDiag.setPraca(p); return k; }, [pick.q, pick.r]); foundAt[tNew] = 'retry-with-500:' + ok; }
        else foundAt[tNew] = true;
      }
    }
    if (snapAt.has(tNew) || rows.length === spec.turns) {
      snaps[tNew] = await page.evaluate((s) => window.__impDiag.classify(s.focus, s.wolno, s.onlyWorked), spec);
    }
  }
  info.errors = (info.errors || []).concat(errors.slice(0, 10));
  if (rows.length < spec.turns) {
    const lastTurn = await page.evaluate(() => window.__impDiag.world().turn);
    const pool = await page.evaluate(() => window.__impDiag.praca());
    const saved = await page.evaluate(() => window.__truceSaveLoadTestDebug.quickSave('diag'));
    fs.writeFileSync(stateFile, JSON.stringify({ info, rows, snaps, foundAt, turn: lastTurn, pool }));
    console.log('CHUNK_DONE name=' + tag + ' rows=' + rows.length + '/' + spec.turns + ' turn=' + lastTurn + ' saved=' + saved);
  } else {
    info.rows = rows; info.snaps = snaps; info.foundAt = foundAt;
    const file = path.join(evidence, tag + '.json');
    fs.writeFileSync(file, JSON.stringify(info));
    try { fs.unlinkSync(stateFile); } catch (e) { /* brak */ }
    console.log('RESULT_FILE=' + file);
  }
  await browser.close();
}

(async () => {
  const [mode, scratch, evidence, specJson] = process.argv.slice(2);
  if (!mode || !scratch) { console.error('usage: see header'); process.exit(2); }
  fs.mkdirSync(scratch, { recursive: true });
  if (mode === 'build') return build(scratch);
  if (mode === 'mkbase') {
    const spec = JSON.parse(specJson);
    const { browser, page } = await openGame(scratch, spec, null);
    const turn = await page.evaluate(() => window.__impDiag.world().turn);
    const saved = await page.evaluate(() => window.__truceSaveLoadTestDebug.quickSave('diag'));
    fs.writeFileSync(path.join(scratch, 'base-' + spec.name + '.json'), JSON.stringify({ turn, saved }));
    console.log('BASE_DONE ' + spec.name + ' turn=' + turn + ' saved=' + saved);
    await browser.close();
    return;
  }
  if (mode === 'run') return run(scratch, evidence, JSON.parse(specJson));
  console.error('nieznany tryb'); process.exit(2);
})().then(() => process.exit(0)).catch((e) => { console.error('BLAD:', e && e.stack || e); process.exit(1); });
