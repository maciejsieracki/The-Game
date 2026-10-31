'use strict';
/**
 * clearing-deficit-live-measure.cjs — POMIAR NA ZYWEJ GRZE (nie bramka), R-WEB-LIVE-MEASURE-CLEARING-DEFICIT-Q1.
 *
 * Zero zmian w repo: tool kopiuje `gra/{src,data,index.html,...}` do katalogu SCRATCH (poza repo), wstawia tam do
 * KOPII `main.ts` hak odczytu `window.__measDebug` (tylko odczyt + fixture stanu), buduje vite do scratch
 * i steruje REALNA gra w headless Chromium (REALNY endTurn, REALNA nowa gra).
 *
 *   node tools/clearing-deficit-live-measure.cjs build  <scratchDir>
 *   node tools/clearing-deficit-live-measure.cjs A      <scratchDir> <evidenceDir> [focus=zrownowazone|zywnosc] [seed] [fill]   (fill = stan magazynu 200 co ture => brak niedoboru surowcow)
 *   node tools/clearing-deficit-live-measure.cjs A-save <scratchDir> <evidenceDir> [focus] [seed] [fill]   (zapis/odczyt w trakcie wycinki)
 *   node tools/clearing-deficit-live-measure.cjs B      <scratchDir> <evidenceDir> <seed> <typSwiata> <budowa=reczny|auto> [turns=60] [extraCities=0]
 *
 * ZADANIE A: wycinka gracza (auto-ulepszenia, `wyrab` = typ `wycinka`, `hexClearingStates`/`tickHexClearing`).
 * ZADANIE B: `resourceDeficitKeysForOwner(0)` + magazyn 15 wycenionych surowcow co ture.
 * Wynik: JSON do <evidenceDir>, jedna linia `RESULT_FILE=`.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MARKER = '(window as any).__cityForestTestDebug = {';

const HOOK = String.raw`
    (window as any).__measDebug = (() => {
      const evLog: any[] = [];
      const origSet = hexClearingStates.set.bind(hexClearingStates);
      const origDel = hexClearingStates.delete.bind(hexClearingStates);
      (hexClearingStates as any).set = (k: string, v: any) => { evLog.push({ ev: 'clr-set', turn, k, v: { ...v } }); return origSet(k, v); };
      (hexClearingStates as any).delete = (k: string) => { evLog.push({ ev: 'clr-del', turn, k }); return origDel(k); };
      const origPlSet = placedImprovements.set.bind(placedImprovements);
      (placedImprovements as any).set = (k: string, v: any) => { evLog.push({ ev: 'layers-set', turn, k, layers: [...v] }); return origPlSet(k, v); };
      const myCities = () => cities.filter(c => c.ownerId === 0);
      return {
        evLog: () => evLog.splice(0, evLog.length),
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
        world: () => ({
          turn, awaiting: isAwaitingFirstPlayerCity(), startHex: playerStartHex ? { q: playerStartHex.q, r: playerStartHex.r } : null,
          myCities: myCities().length, endTurnBusy: false,
        }),
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
          const before = { ...d };
          if (mode) { d.budowaTryb = mode; for (const c of myCities()) { (c as any).budowaTryb = mode; (c as any).budowaFocusOverride = false; } }
          return { before, after: { ...d }, perCity: myCities().map(c => effectiveBudowaProfil(c)) };
        },
        fillStock: (amount: number) => {
          const priced = Object.keys(diplomacyHandelSurowceCatalog());
          const out: Record<string, number> = {};
          for (const k of priced) out[k] = creditOwnerResourceStock(cities, 0, k, amount, 1_000_000);
          return out;
        },
        drewno: () => { const g = tradableGoodsIndexForOwner(0).find(x => x.key === 'drewno'); return g?.ilosc ?? 0; },
        improvements: () => { let n = 0; const nodes = buildAllTerritoryNodes(); for (const [hk, l] of placedImprovements) { if (isTerritoryHexOwnedBy(Number(hk.split(',')[0]), Number(hk.split(',')[1]), 0, nodes)) n += l.length; } return n; },
        setPop: (n: number) => { const c = myCities()[0]; c.population = n; markCityStateDirty(); return c.population; },
        setPraca: (n: number) => { setOwnerPracaPool(0, n); return ownerPracaPool(0); },
        praca: () => ownerPracaPool(0),
        autoKoszt: () => ownerLastPracaAutoUlepszeniaKoszt(0),
        needs: () => {
          const priced = Object.keys(diplomacyHandelSurowceCatalog());
          const goods = tradableGoodsIndexForOwner(0);
          const pakiet = diplomacyHandelSurowcePakietWielkosc();
          const stock: Record<string, number> = {};
          for (const k of priced) stock[k] = goods.find(g => g.key === k)?.ilosc ?? 0;
          return {
            turn, pakiet, pricedKeys: priced, stock,
            deficit: resourceDeficitKeysForOwner(0),
            stockDeficit: priced.filter(k => stock[k] < pakiet),
            queuedB: queuedBuildingIdsForOwner(0), queuedU: queuedUnitTypeIdsForOwner(0),
            food: getEmpireFoodReserve(0),
            cities: myCities().length, pop: myCities().map(c => c.population),
            built: myCities().reduce((s, c) => s + (cityBuilt.get(c.id) ?? []).length, 0),
            imp: (window as any).__measDebug.improvements(),
          };
        },
        /** FIXTURE A: znajdz heks roboczy stolicy z rzeka i terenem pod farme; wstaw Las (jak naturalny las pod wyrab). */
        scenarioHex: (requireRiver: boolean) => {
          const city = myCities()[0];
          if (!city) return null;
          const nodes = buildAllTerritoryNodes();
          const cand: any[] = [];
          for (const h of Object.values(map.hexes) as any[]) {
            const q = h.coords.q, r = h.coords.r;
            const dq = q - city.q, dr = r - city.r;
            const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
            if (dist < 1 || dist > 3) continue;
            const hk = keyOf(q, r);
            if (h.terenBazowy !== TerenBazowy.Laka && h.terenBazowy !== TerenBazowy.Rownina) continue;
            if (h.nakladka !== Nakladka.Brak && h.nakladka !== Nakladka.Las) continue;
            if ((placedImprovements.get(hk) ?? []).length > 0) continue;
            if (!isTerritoryHexOwnedBy(q, r, 0, nodes)) continue;
            const river = !!h.rzeka?.obecna;
            if (requireRiver && !river) continue;
            cand.push({ q, r, dist, river, teren: String(h.terenBazowy), nakladkaBefore: String(h.nakladka) });
          }
          cand.sort((a, b) => (Number(b.river) - Number(a.river)) || (a.dist - b.dist));
          return { cand: cand.slice(0, 12), nCand: cand.length };
        },
        /** FIXTURE = akcja gracza "obywatel na heksie" (okolica reczna) — REALNY mechanizm okolicaReczne. */
        assignCitizen: (q: number, r: number) => {
          const c: any = myCities()[0];
          c.okolicaTryb = 'reczny';
          c.okolicaReczne = { [keyOf(q, r)]: 1 };
          markCityStateDirty();
          return { tryb: c.okolicaTryb, reczne: c.okolicaReczne };
        },
        plantForest: (q: number, r: number): boolean => {
          const h: any = map.hexes[keyOf(q, r)];
          if (!h) return false;
          h.nakladka = Nakladka.Las;
          syncResourceOverlayAtHex(keyOf(q, r));
          return true;
        },
        hex: (q: number, r: number) => {
          const hk = keyOf(q, r);
          const h: any = map.hexes[hk];
          const city = myCities()[0];
          const worked = city ? workedHexCoordsForCity(city, map, buildAllTerritoryNodes(), siblingClaimedHexKeysForCity(city)).some(w => w.q === q && w.r === r) : false;
          return {
            hk, nakladka: h ? String(h.nakladka) : null, teren: h ? String(h.terenBazowy) : null, river: !!h?.rzeka?.obecna,
            layers: [...(placedImprovements.get(hk) ?? [])] as string[],
            clearing: hexClearingStates.has(hk) ? { ...(hexClearingStates.get(hk) as any) } : null,
            worked,
          };
        },
        clearingAll: () => Array.from(hexClearingStates.entries()).map(([k, v]) => [k, { ...(v as any) }]),
        reload: (): void => {
          const snap = buildSaveGameSnapshot('meas-clearing');
          restoreGameFromSave(snap);
          reapplyCityHexDecorHides();
        },
        busy: () => (window as any).__eraTestDebug.isEndTurnInProgress(),
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
  const txt = fs.readFileSync(mainPath, 'utf8');
  const idx = txt.indexOf(MARKER);
  if (idx < 0) throw new Error('marker __cityForestTestDebug nie znaleziony');
  // wstaw tuz przed linia z markerem (zachowaj wciecie)
  const lineStart = txt.lastIndexOf('\n', idx) + 1;
  fs.writeFileSync(mainPath, txt.slice(0, lineStart) + HOOK + txt.slice(lineStart), 'utf8');
  const out = path.join(scratch, 'dist');
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(out)} --emptyOutDir`, { cwd: g, stdio: 'pipe', maxBuffer: 1 << 28 });
  console.log('BUILD_OK ' + path.join(out, 'index.html'));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}

async function openGame(scratch, seed, typ) {
  const { chromium } = require('playwright');
  const browser = await launch(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: Number(process.env.MEAS_W || 640), height: Number(process.env.MEAS_H || 400) } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.goto('file://' + path.join(scratch, 'dist', 'index.html'), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__measDebug && !!window.__eraTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await page.evaluate(([s, t]) => window.__measDebug.startGame(s, t, 3, 4), [seed, typ]);
  const t0 = Date.now();
  while (Date.now() - t0 < 300000) {
    const w = await page.evaluate(() => window.__measDebug.world());
    const overlay = await page.evaluate(() => Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null));
    if (!overlay && w.awaiting && w.startHex) break;
    await wait(500);
  }
  const ok = await page.evaluate(() => window.__measDebug.found(window.__measDebug.world().startHex.q, window.__measDebug.world().startHex.r));
  if (!ok) throw new Error('foundPlayerStartCity false');
  await wait(800);
  return { browser, page, errors };
}

async function endTurn(page) {
  const t0 = await page.evaluate(() => window.__measDebug.world().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const s = Date.now();
  while (Date.now() - s < 120000) {
    const busy = await page.evaluate(() => window.__measDebug.busy());
    const t = await page.evaluate(() => window.__measDebug.world().turn);
    if (!busy && t > t0) return t;
    await wait(100);
  }
  throw new Error('endTurn timeout from turn ' + t0);
}

async function modeA(scratch, evidence, focus, seed, withSave, fill) {
  fs.mkdirSync(evidence, { recursive: true });
  const { browser, page, errors } = await openGame(scratch, seed, 'kontynenty');
  const rows = [];
  const PRACA = Number(process.env.MEAS_PRACA || 400);
  const tag = (withSave ? 'A-save-' : 'A-') + focus + (fill ? '-fill' : '') + (PRACA !== 400 ? '-praca' + PRACA : '') + '-seed' + seed;
  const snapHex = (h) => page.evaluate(([q, r]) => window.__measDebug.hex(q, r), [h.q, h.r]);
  let w = await page.evaluate(() => window.__measDebug.world());
  const info = { tag, seed, focus, startTurn: w.turn };
  // 3 tury "nagrzewania" aby miasto mialo obywateli/Prace; potem fixture: techy + polityka + las
  info.techs = await page.evaluate(() => window.__measDebug.grantTechs(['Rolnictwo', 'Oswojenie zwierząt', 'Irygacja', 'Obróbka drewna', 'Łowiectwo']));
  info.policy = await page.evaluate((f) => window.__measDebug.setPolicy({ tryb: 'auto', focus: f, onlyWorked: true, wolno: true, pct: 100 }), focus);
  info.build = await page.evaluate(() => window.__measDebug.setBuildMode('reczny'));
  for (let i = 0; i < 2; i++) await endTurn(page);
  info.popFixture = await page.evaluate(() => window.__measDebug.setPop(9));
  await endTurn(page);
  info.scen = await page.evaluate(() => window.__measDebug.scenarioHex(false));
  let target = info.scen && info.scen.cand.find((c) => c.river);
  info.riverFound = !!target;
  if (!target && info.scen && info.scen.cand.length) target = info.scen.cand[0];
  if (!target) { info.error = 'brak kandydata'; fs.writeFileSync(path.join(evidence, tag + '.json'), JSON.stringify(info, null, 1)); await browser.close(); return; }
  info.target = target;
  await page.evaluate(([q, r]) => window.__measDebug.plantForest(q, r), [target.q, target.r]);
  info.assign = await page.evaluate(([q, r]) => window.__measDebug.assignCitizen(q, r), [target.q, target.r]);
  await page.evaluate(() => window.__measDebug.evLog());
  await page.evaluate((n) => window.__measDebug.setPraca(n), PRACA);
  info.hexAfterPlant = await snapHex(target);
  fs.mkdirSync(evidence, { recursive: true });
  await page.screenshot({ path: path.join(evidence, tag + '-t0-las.png') });
  let reloaded = false;
  for (let i = 0; i < 40; i++) {
    if (fill) await page.evaluate(() => window.__measDebug.fillStock(200));
    const before = await snapHex(target);
    const drewnoBefore = await page.evaluate(() => window.__measDebug.drewno());
    const pracaBefore = await page.evaluate(() => window.__measDebug.praca());
    const tNew = await endTurn(page);
    const after = await snapHex(target);
    const pracaAfter = await page.evaluate(() => window.__measDebug.praca());
    const kosztAuto = await page.evaluate(() => window.__measDebug.autoKoszt());
    const ev = await page.evaluate(() => window.__measDebug.evLog());
    const all = await page.evaluate(() => window.__measDebug.clearingAll());
    const drewnoAfter = await page.evaluate(() => window.__measDebug.drewno());
    const row = { turnAfter: tNew, drewnoBefore, drewnoAfter, pracaBefore, pracaAfter, kosztAutoUlepszen: kosztAuto, before, after, ev, clearingAll: all };
    rows.push(row);
    if (withSave && !reloaded && after.clearing) {
      const pre = await page.evaluate(() => window.__measDebug.clearingAll());
      await page.evaluate(() => window.__measDebug.reload());
      await wait(500);
      const post = await page.evaluate(() => window.__measDebug.clearingAll());
      const hexPost = await snapHex(target);
      info.reload = { turn: tNew, pre, post, hexPost, evAfterReload: await page.evaluate(() => window.__measDebug.evLog()) };
      reloaded = true;
    }
    if (i === 6 || (after.layers.includes('farma') && !info.shotFarm)) {
      if (after.layers.includes('farma')) { info.shotFarm = true; await page.screenshot({ path: path.join(evidence, tag + '-farma.png') }); }
    }
    // koniec gdy wszystkie etapy zrobione albo 40 tur
    const l = after.layers;
    if (i >= 12 && !after.clearing && after.nakladka !== 'las' && l.length >= 2 && l.includes('irygacja')) break;
    if (i >= 14 && after.nakladka === 'las' && !after.clearing) break;
  }
  info.rows = rows;
  info.final = await snapHex(target);
  info.errors = errors.slice(0, 10);
  const file = path.join(evidence, tag + '.json');
  fs.writeFileSync(file, JSON.stringify(info, null, 1));
  console.log('RESULT_FILE=' + file);
  await browser.close();
}

async function modeB(scratch, evidence, seed, typ, budowa, turns, extraCities) {
  const { browser, page, errors } = await openGame(scratch, seed, typ);
  const ACTIVE = process.env.MEAS_ACTIVE === '1';
  const tag = `B-${typ}-seed${seed}-${budowa}-c${1 + extraCities}${ACTIVE ? '-aktywny' : ''}`;
  const info = { tag, seed, typ, budowa, turns, extraCities, active: ACTIVE };
  info.build = await page.evaluate((m) => window.__measDebug.setBuildMode(m), budowa);
  if (ACTIVE) {
    // gracz AKTYWNY: wczesne technologie (jak po zbadaniu) + auto-ulepszenia terenu wlaczone (profil zrownowazone, 100% budzetu)
    info.techs = await page.evaluate(() => window.__measDebug.grantTechs(['Rolnictwo', 'Garncarstwo', 'Murarstwo', 'Obróbka drewna', 'Brązownictwo', 'Łowiectwo', 'Oswojenie zwierząt']));
    info.activePolicy = await page.evaluate(() => window.__measDebug.setPolicy({ tryb: 'auto', focus: 'zrownowazone', onlyWorked: true, wolno: false, pct: 100 }));
  }
  info.policy = await page.evaluate(() => window.__measDebug.effectivePolicy());
  const rows = [];
  rows.push(await page.evaluate(() => window.__measDebug.needs()));
  const foundAt = {};
  for (let i = 0; i < turns; i++) {
    const tNew = await endTurn(page);
    if (extraCities > 0) {
      const have = (await page.evaluate(() => window.__measDebug.needs())).cities;
      const want = 1 + Math.min(extraCities, Math.floor(tNew / 12));
      if (have < want && tNew % 3 === 0) {
        const cands = await page.evaluate(() => window.__measDebug.foundCandidates(40));
        // wez kandydata najblizej stolicy (lista idzie po mapie, filtruj dystansem w stronie)
        const pick = await page.evaluate((cs) => {
          const c0 = window.__measDebug.world().startHex;
          let best = null, bd = 1e9;
          for (const c of cs) { const d = Math.abs(c.q - c0.q) + Math.abs(c.r - c0.r); if (d >= 4 && d < bd) { bd = d; best = c; } }
          return best;
        }, cands);
        if (pick) { const ok = await page.evaluate(([q, r]) => { window.__measDebug.setPraca(Math.max(window.__measDebug.praca(), 500)); return window.__measDebug.found(q, r); }, [pick.q, pick.r]); foundAt[tNew] = ok; }
      }
    }
    rows.push(await page.evaluate(() => window.__measDebug.needs()));
    if (i % 10 === 9) { fs.mkdirSync(evidence, { recursive: true }); fs.writeFileSync(path.join(evidence, tag + '.partial.json'), JSON.stringify({ ...info, foundAt, rows })); }
  }
  info.foundAt = foundAt;
  info.rows = rows;
  info.errors = errors.slice(0, 10);
  fs.mkdirSync(evidence, { recursive: true });
  const file = path.join(evidence, tag + '.json');
  fs.writeFileSync(file, JSON.stringify(info));
  console.log('RESULT_FILE=' + file);
  await browser.close();
}

(async () => {
  const [mode, scratch, evidence, a1, a2, a3, a4, a5] = process.argv.slice(2);
  if (!mode || !scratch) { console.error('usage: see header'); process.exit(2); }
  fs.mkdirSync(scratch, { recursive: true });
  if (mode === 'build') return build(scratch);
  if (mode === 'A') return modeA(scratch, evidence, a1 || 'zrownowazone', Number(a2 || 778899), false, a3 === 'fill');
  if (mode === 'A-save') return modeA(scratch, evidence, a1 || 'zywnosc', Number(a2 || 778899), true, a3 === 'fill');
  if (mode === 'B') return modeB(scratch, evidence, Number(a1), a2, a3, Number(a4 || 60), Number(a5 || 0));
  console.error('nieznany tryb'); process.exit(2);
})().then(() => process.exit(0)).catch((e) => { console.error('BLAD:', e && e.stack || e); process.exit(1); });
