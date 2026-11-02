'use strict';
/**
 * live-verify-autoimprove-common.cjs — R-WEB-AUTOIMPROVE-LIVE-SCENARIOS-Q1 (kopia wspolnego sterownika z -Q1 + przechwyt snapshotu).
 * Wspólny sterownik PRAWDZIWEJ gry (gotowy bundle gra-robocza/Gra-ROBOCZA.html, Chromium + Playwright).
 * Zero zmian w gra/src; zero buildu. Kreator "Nowa gra" jest sterowany realnym DOM-em (jak gracz),
 * ziarno wymuszane jednorazowym podstawieniem Math.random (newGameFlow.ts:2134 losuje seed = floor(random*1e6)).
 */
const path = require('path');
const fs = require('fs');

const REPO = path.resolve(__dirname, '..', '..');
// Bundle = KOPIA gotowego Gra-ROBOCZA.html (MD5 8f59c5c2...) w katalogu tymczasowym; env ROBOCZA_HTML jest wymagane.
const BUNDLE = process.env.ROBOCZA_HTML;
if (!BUNDLE) throw new Error('Ustaw ROBOCZA_HTML=<sciezka do kopii Gra-ROBOCZA.html>');
const URL = 'file://' + BUNDLE + '?skipMenuRedirect=1&civTest=1';
const EVID = path.join(REPO, 'dyspozycje', 'autobot', 'runs', 'R-WEB-AUTOIMPROVE-LIVE-SCENARIOS-Q1', 'evidence');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const { chromium } = require('playwright');
  const args = ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'];
  try {
    return await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args });
  } catch (e) {
    return chromium.launch({ headless: true, args });
  }
}

async function openMenu(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: process.env.LVR_VIEWPORT ? { width: Number(process.env.LVR_VIEWPORT.split('x')[0]), height: Number(process.env.LVR_VIEWPORT.split('x')[1]) } : { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  // Przechwyt snapshotu zapisu (tylko odczyt): hak roundTrip() serializuje buildSaveGameSnapshot przez JSON.stringify.
  await page.addInitScript(() => {
    const orig = JSON.stringify;
    window.__capSnap = null;
    JSON.stringify = function (v, ...a) {
      try { if (v && typeof v === 'object' && v.meta && typeof v.meta === 'object' && v.mapSnapshot) window.__capSnap = v; } catch (e) { /* ignore */ }
      return orig.call(this, v, ...a);
    };
  });
  const logs = [];
  const errors = [];
  page.on('console', (m) => { const t = m.text(); logs.push(t); if (m.type() === 'error') errors.push(t); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  // Opcjonalne zapisane preferencje kreatora (localStorage 'civ-newgame-prefs-v2', ten sam kanal co zapamietane ustawienia gracza).
  if (opts.newGamePrefs) {
    await page.addInitScript((p) => { try { localStorage.setItem('civ-newgame-prefs-v2', JSON.stringify(p)); } catch (e) { /* ignore */ } }, opts.newGamePrefs);
  }
  const url = opts.noHooks ? 'file://' + BUNDLE + '?skipMenuRedirect=1' : URL;
  await page.goto(url + (opts.query || ''), { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  await wait(300);
  return { ctx, page, logs, errors };
}

async function clickText(page, re) {
  const ok = await page.evaluate((src) => {
    const rx = new RegExp(src);
    const b = Array.from(document.querySelectorAll('button')).find((x) => rx.test(x.textContent || '') && x.offsetParent !== null);
    if (!b) return false; b.click(); return true;
  }, re.source);
  return ok;
}

async function activeStepLabel(page) {
  return ((await page.locator('.civ-newgame .stepbar .si.active .si-l').first().textContent().catch(() => '')) || '').trim();
}

async function gotoStep(page, label) {
  for (let i = 0; i < 10; i++) {
    const cur = await activeStepLabel(page);
    if (cur === label) return;
    if (cur === 'Intro') await page.locator('.civ-newgame .cta-hero').click();
    else await page.locator('.civ-newgame .nav .nb.next').click();
    await wait(200);
  }
  throw new Error('gotoStep ' + label + ' nieudane, aktywny: ' + (await activeStepLabel(page)));
}

async function gridRows(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow')).map((row) => ({
    lbl: (row.querySelector('.sl')?.textContent || '').trim(),
    val: (row.querySelector('.sv')?.textContent || '').trim(),
  })));
}

async function clickGridArrow(page, lbl, dir) {
  const ok = await page.evaluate(({ lbl, dir }) => {
    const row = Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow'))
      .find((r) => (r.querySelector('.sl')?.textContent || '').trim() === lbl);
    if (!row) return false;
    const arrows = row.querySelectorAll('.sctl .arr');
    const btn = dir < 0 ? arrows[0] : arrows[arrows.length - 1];
    if (!btn) return false;
    btn.click();
    return true;
  }, { lbl, dir });
  await wait(150);
  return ok;
}

const valueOf = (rows, lbl) => { const r = rows.find((x) => x.lbl === lbl); return r ? r.val : undefined; };

/** Ustawia "Typ świata" na zadany napis przez strzałki (kolejność Kontynenty -> Pangea -> Wyspy -> Ziemia). */
async function setWorldType(page, wanted) {
  for (let i = 0; i < 6; i++) {
    const rows = await gridRows(page);
    if (valueOf(rows, 'Typ świata') === wanted) return true;
    await clickGridArrow(page, 'Typ świata', 1);
  }
  return false;
}

/** Ustawia "Rozmiar mapy" na zadany napis (strzalki cyklicznie). */
async function setMapSize(page, wanted) {
  for (let i = 0; i < 8; i++) {
    const rows = await gridRows(page);
    if (valueOf(rows, 'Rozmiar mapy') === wanted) return true;
    await clickGridArrow(page, 'Rozmiar mapy', -1);
  }
  return false;
}

/**
 * Start gry z kreatora z ziarnem `seed` (podstawienie Math.random na czas kroku Start do logu "[NewGame] Mapa").
 * Zwraca { seedSeen, mapLog }.
 */
async function startFromWizard(sess, seed) {
  const { page, logs } = sess;
  const before = logs.length;
  await page.evaluate((s) => {
    window.__origRandom = Math.random;
    window.__seedRand = (s + 0.5) / 1000000;
    Math.random = () => window.__seedRand;
  }, seed);
  await gotoStep(page, 'Start');
  const t0 = Date.now();
  let mapLog = null;
  while (Date.now() - t0 < 480000) {
    mapLog = logs.slice(before).find((l) => /\[NewGame\] Mapa:/.test(l));
    if (mapLog) break;
    await wait(1000);
  }
  await page.evaluate(() => { if (window.__origRandom) Math.random = window.__origRandom; });
  const m = mapLog && mapLog.match(/seed=(\d+)/);
  return { seedSeen: m ? Number(m[1]) : null, mapLog, genMs: Date.now() - t0 };
}

async function waitAwaitingCity(page, timeoutMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const st = await page.evaluate(() => window.__cityStateStartUnitsTestDebug && window.__cityStateStartUnitsTestDebug.dumpState());
    const overlay = await page.evaluate(() => Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.children.length === 0 && el.offsetParent !== null));
    if (st && st.awaitingFirstPlayerCity === true && st.playerStartHex && !overlay) return st;
    await wait(1000);
  }
  throw new Error('waitAwaitingCity timeout');
}

async function foundCapital(page) {
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    const st = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    if (st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0)) return st;
    await wait(500);
  }
  throw new Error('foundCapital timeout');
}

function save(name, obj) {
  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(path.join(EVID, name), JSON.stringify(obj, null, 2));
}

/** Snapshot ZYWEJ gry (roundTrip = buildSaveGameSnapshot->JSON->restore) -> statystyki terenu liczone w stronie. */
async function snapshotStats(page, cityList) {
  return page.evaluate((cl) => {
    window.__capSnap = null;
    window.__pracaPoolSaveLoadTestDebug.roundTrip();
    const s = window.__capSnap; if (!s) return null;
    const m = s.mapSnapshot; const counts = {}; const idx = new Map(); const polar = [];
    for (let i = 0; i < m.n; i++) {
      const t = m.dict[m.terenIdx[i]]; counts[t] = (counts[t] || 0) + 1; idx.set(m.q[i] + ',' + m.r[i], i);
      if (t === 'polarny') polar.push(m.q[i] + ',' + m.r[i]);
    }
    const terrAt = (q, r) => { const i = idx.get(q + ',' + r); return i === undefined ? null : m.dict[m.terenIdx[i]]; };
    return { n: m.n, counts, polarN: polar.length, polarSample: polar.slice(0, 3), cityTerrain: cl.map((c) => terrAt(c.q, c.r)),
      snapCities: s.cities.map((c) => ({ o: c.ownerId, q: c.q, r: c.r, t: terrAt(c.q, c.r) })), turn: s.meta && s.meta.turn };
  }, cityList);
}

async function endTurnAndWait(sess, timeoutMs = 420000) {
  const { page } = sess;
  const before = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn);
  const t0 = Date.now();
  for (let k = 0; k < 4; k++) {
    const closed = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.offsetParent !== null && /^(Wróć|Zamknij|OK)$/.test((b.textContent || '').trim()));
      if (btn) { btn.click(); return true; } return false;
    });
    await page.keyboard.press('Escape'); await wait(150);
    if (!closed) break;
  }
  const doneN = () => sess.logs.filter((l) => /triggerPlayerEndTurn: DONE tura/.test(l)).length;
  const done0 = doneN();
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  let after = before;
  while (Date.now() - t0 < timeoutMs) {
    await wait(250);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.offsetParent !== null && /^(Wróć|Zamknij|OK|Wyjście)$/.test((b.textContent || '').trim()));
      if (btn) btn.click();
    });
    after = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState().turn);
    if (after > before && doneN() > done0) break;
  }
  const res = { before, after, ms: Date.now() - t0, ok: after > before && doneN() > done0 };
  if (!res.ok) {
    res.endTurnLogs = sess.logs.filter((l) => /EndTurn|blocked|Błąd|error/i.test(l)).slice(-8).map((l) => l.slice(0, 240));
    res.visible = await page.evaluate(() => Array.from(document.querySelectorAll('button, [role=dialog], .civ-modal, .modal, .toast, .hint'))
      .filter((el) => el.offsetParent !== null).map((el) => ((el.id || el.className || el.tagName) + ':' + (el.textContent || '').trim().slice(0, 50))).slice(0, 30));
  }
  return res;
}

const D = (a, b) => { const dq = a.q - b.q, dr = a.r - b.r; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };

function analyse(st, stats) {
  const cities = st.cities;
  const player = cities.find((c) => c.ownerId === 0);
  const firstOfOwner = new Map();
  for (const c of cities) if (c.ownerId !== 0 && !c.startCityState && !firstOfOwner.has(c.ownerId)) firstOfOwner.set(c.ownerId, c);
  const caps = [{ id: 'gracz', q: player.q, r: player.r }];
  for (const [oid, c] of firstOfOwner) caps.push({ id: (c.civTypeId || '?') + '#' + oid, q: c.q, r: c.r });
  let capMin = Infinity, capPair = null;
  for (let i = 0; i < caps.length; i++) for (let j = i + 1; j < caps.length; j++) {
    const d = D(caps[i], caps[j]); if (d < capMin) { capMin = d; capPair = [caps[i].id, caps[j].id]; }
  }
  const terr = new Map(stats.snapCities.map((c) => [c.q + ',' + c.r, c.t]));
  const tAt = (c) => terr.get(c.q + ',' + c.r) || null;
  const aiCities = cities.filter((c) => c.ownerId !== 0);
  const WATER = ['morze', 'plytkie_morze'];
  const water = WATER.reduce((a, k) => a + (stats.counts[k] || 0), 0);
  const land = stats.n - water;
  const landNoCoast = land - (stats.counts.wybrzeze || 0);
  return {
    turn: st.turn, hexes: stats.n, landHexes: land, waterHexes: water,
    landPct: +(100 * land / stats.n).toFixed(2), landNoCoastPct: +(100 * landNoCoast / stats.n).toFixed(2),
    terrainCounts: stats.counts, polarHexes: stats.polarN,
    citiesTotal: cities.length, aiCitiesTotal: aiCities.length,
    capsCount: caps.length, capMin, capPair, caps: caps.map((c) => `${c.id}@${c.q},${c.r}`),
    polarCaps: caps.filter((c) => c.id !== 'gracz' && tAt(c) === 'polarny').map((c) => c.id),
    polarAiCities: aiCities.filter((c) => tAt(c) === 'polarny').map((c) => `${c.civTypeId}#${c.ownerId}@${c.q},${c.r}${c.startCityState ? ' MP' : ''}`),
    playerPolar: tAt(player) === 'polarny', cityTerrainResolved: aiCities.filter((c) => tAt(c) !== null).length + '/' + aiCities.length,
  };
}


module.exports = {
  analyse, snapshotStats, endTurnAndWait,
  REPO, BUNDLE, URL, EVID, wait, launch, openMenu, clickText, gotoStep, gridRows, clickGridArrow, valueOf,
  setWorldType, setMapSize, startFromWizard, waitAwaitingCity, foundCapital, save,
};
