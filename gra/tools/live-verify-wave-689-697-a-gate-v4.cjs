'use strict';
/**
 * live-verify-wave-689-697-a-gate-v4.cjs — R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1, runda 4 (obrona na zarzuty FC/Evaluatora).
 *
 * Zarzut 1 (DODATEK pkt 1): v3 budował deficyt dużymi dosypkami grantPlayerGold — ZAKAZANA ścieżka. v4 NIE używa
 * grantPlayerGold ani żadnej dosypki skarbca. Deficyt budowany REALNIE: miasto gracza (refoundPlayerAnywhere),
 * tura ≥ 11 (endTurn w trybie przyspieszonym), jednostki utrzymania gracza (spawnAiUnits(ME=0, n) — realne
 * jednostki w tablicy `units`, koszt utrzymania liczony przez grę). Po każdej partii jednostek
 * disbandPlayerUnits(0) (zero usunięć, tylko markCityStateDirty), żeby prognoza bramki została przeliczona.
 *
 * Tryb sweep: tura 11, krok = 1 jednostka; zapisuje moment pierwszego przejścia canEnd true→false (blokada).
 * Po blokadzie: odczyt title przycisku „Zakończ turę” (pkt 2), klik (ma NIE zakończyć tury).
 * Dźwignie UI (podatek/racje) — NIE w tym pliku (patrz BLOKADY w raporcie).
 *
 * Użycie (z gra/): node tools/live-verify-wave-689-697-a-gate-v4.cjs --dist <d> --out <o> [--seed 11] [--step 1] [--maxsteps 400]
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
const OUT = arg('out');
const SEED = parseInt(arg('seed', '11'), 10);
const MAP = arg('map', 'Maly');
const STEP = parseInt(arg('step', '1'), 10);
const MAX_STEPS = parseInt(arg('maxsteps', '400'), 10);
const CHECK10 = arg('check10', '0') === '1'; // pkt 3: tury 1–10 z deficytem (jednostki utrzymania w każdej turze)
const CHECK10_UNITS = parseInt(arg('check10units', '2'), 10);
const ME = 0; // HUMAN_OWNER_PRIMARY (main.ts: ME() === 0)
const wait = ms => new Promise(r => setTimeout(r, ms));
const FALLBACK_CHROME = '/usr/bin/chromium';

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist --out'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
  const browser = await launch(chromium);
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
  const res = { mode: 'sweep-v4', seed: SEED, map: MAP, step: STEP, log: [], errors: [], grantCalls: 0 };
  const log = (k, v) => res.log.push({ k, v });
  page.on('pageerror', e => res.errors.push(String(e && e.message || e).slice(0, 200)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  const endWarns = [];
  page.on('console', m => { if (/EndTurn|NNS|blokad|bramk/i.test(m.text())) endWarns.push(m.text().slice(0, 240)); });
  const outFile = path.join(OUT, `result-v4-seed${SEED}.json`);
  const S = {
    turn: () => page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn),
    canEnd: () => page.evaluate(() => window.__nnsMeasureDebug.canEnd()),
    awaiting: () => page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity()),
    button: () => page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || ''));
      if (!b) return null;
      return { title: b.getAttribute('title') || '', text: (b.textContent || '').replace(/\s+/g, ' ').trim(), disabled: !!b.disabled };
    }),
    click: () => page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || ''));
      if (!b) return false; b.click(); return true;
    }),
    endTurnOnce: async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
      await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
      await wait(150);
    },
  };
  try {
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: MAP, civTypes: 15, cityStates: 2 });
    await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    });
    if (await S.awaiting()) {
      const r = await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
      log('refoundPlayerAnywhere', r);
    }
    log('playerCitiesAfterFound', await page.evaluate(() => window.__nnsMeasureDebug.playerCities()));
    await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));
    // Tury 1–10 bez deficytu (naturalna gra, zero grantów); tura 11 jako warunek pomiaru.
    while ((await S.turn()) < 11) {
      const tt = await S.turn();
      if (CHECK10) {
        const sp = await page.evaluate(n => window.__nnsMeasureDebug.spawnAiUnits(0, n), CHECK10_UNITS);
        await page.evaluate(() => window.__nnsMeasureDebug.disbandPlayerUnits(0));
        await wait(60);
        log('turn' + tt + '_deficitUnitsAdded', sp && sp.added);
        log('turn' + tt + '_canEndAtDeficit', await S.canEnd());
        await S.endTurnOnce();
        log('turn' + tt + '_endedTo', await S.turn());
        continue;
      }
      await S.endTurnOnce();
    }
    log('reachedTurn', await S.turn());
    log('turn11_awaitingFirstCity', await S.awaiting());
    log('turn11_canEndNatural', await S.canEnd());
    // Sweep: jednostki utrzymania gracza, krok STEP, aż do pierwszego przejścia canEnd true -> false.
    let prev = await S.canEnd();
    let added = 0;
    const transitions = [{ units: 0, canEnd: prev, turn: await S.turn() }];
    let blockedAt = null;
    for (let k = 0; k < MAX_STEPS && blockedAt === null; k++) {
      const sp = await page.evaluate(n => window.__nnsMeasureDebug.spawnAiUnits(0, n), STEP);
      if (!sp || sp.added !== STEP) { log('spawnStop', sp); break; }
      added += STEP;
      await page.evaluate(() => window.__nnsMeasureDebug.disbandPlayerUnits(0)); // tylko odświeża prognozę bramki
      await wait(60);
      const now = await S.canEnd();
      const tn = await S.turn();
      if (added % 50 === 0 || added <= 3) {
        const hud = await page.evaluate(() => { const t = (document.body.innerText || '').replace(/\s+/g, ' '); const m = t.match(/Skarbiec [^M]{0,24}/); return m ? m[0] : null; });
        const uc = await page.evaluate(() => window.__nnsMeasureDebug.unitCount(0));
        log('probe_units' + added, { canEnd: now, turn: tn, unitCount0: uc, hud });
      }
      if (now !== prev || tn !== 11) {
        transitions.push({ units: added, canEnd: now, turn: tn, upkeepEach: sp.upkeepEach, typeId: sp.typeId });
        prev = now;
        if (!now) blockedAt = added;
        if (tn !== 11) break;
      }
    }
    log('transitions', transitions);
    log('firstBlockedUnits', blockedAt);
    if (blockedAt !== null) {
      // Render przywrócony PRZED odczytem title (w trybie przyspieszonym renderer nie odświeża DOM).
      await page.evaluate(() => window.__nnsMeasureDebug.setFast(false));
      await wait(2500);
      // Diagnoza tooltipu: czy title pojawia się po czasie / po wymuszonym odświeżeniu HUD (resize), nie tylko po renderze.
      const titlePoll = [];
      for (let i = 0; i < 6; i++) { await wait(1500); titlePoll.push((await S.button() || {}).title || ''); }
      log('blocked_title_poll_9s', titlePoll);
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      await wait(1500);
      log('blocked_title_after_resize', (await S.button() || {}).title || '');
      // Zdarzenie gry bez zmiany bramki (klik na mapę) — wywołuje updateHud w normalnym toku UI.
      await page.mouse.click(640, 400); await wait(1500); await page.mouse.move(700, 420); await wait(800);
      log('blocked_title_after_mapclick', (await S.button() || {}).title || '');
      log('blocked_endButtonAttrs', await page.evaluate(() => [...document.querySelectorAll('[data-end]')].map(el => ({ tag: el.tagName, attrs: el.getAttributeNames().map(n => n + '=' + String(el.getAttribute(n)).slice(0, 90)), inTree: document.body.contains(el) }))));
      log('blocked_titledNodes', await page.evaluate(() => [...document.querySelectorAll('[title]')].filter(el => /Nie można|Pomogą/.test(el.getAttribute('title') || '')).length));
      log('blocked_turn', await S.turn());
      log('blocked_endTurnConsole', endWarns.slice(-6));
      log('blocked_gateDiag', await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || '')); return { outer: b ? b.outerHTML.slice(0, 300) : null, hudText: (document.querySelector('.hud, #hud, .bottom-bar') || document.body).innerText.slice(0, 200) }; }));
      log('blocked_button', await S.button());
      const t0 = await S.turn();
      log('blocked_click_clicked', await S.click());
      await wait(800);
      log('blocked_click_turnBefore', t0);
      log('blocked_click_turnAfter', await S.turn());
      await page.screenshot({ path: path.join(OUT, `v4-blocked-units${blockedAt}.png`) });
      // Dźwignia (rozwiązanie jednostki gracza, ścieżka haka disbandPlayerUnits): po każdej partii canEnd.
      let lever = 0; let canAfter = await S.canEnd();
      while (!canAfter && lever < blockedAt + 5) {
        await page.evaluate(() => window.__nnsMeasureDebug.disbandPlayerUnits(1));
        lever++; await wait(60); canAfter = await S.canEnd();
      }
      log('lever_unitsDisbanded', lever);
      log('lever_canEndAfter', canAfter);
      log('lever_button', await S.button());
      const t1 = await S.turn();
      await S.click();
      await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
      await wait(300);
      log('lever_click_turnBefore', t1);
      log('lever_click_turnAfter', await S.turn());
    }
    log('unitsAddedTotal', added);
  } catch (e) {
    res.fatal = String(e && e.stack || e).slice(0, 800);
  } finally {
    fs.writeFileSync(outFile, JSON.stringify(res, null, 2));
    await browser.close();
    console.log(JSON.stringify(res.log, null, 1));
    console.log('errors', JSON.stringify(res.errors), 'fatal', res.fatal || '-');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
