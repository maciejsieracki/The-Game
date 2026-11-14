'use strict';
/**
 * live-verify-wave-689-697-a-gate-v3.cjs — R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1, runda 3 (DODATEK: kryteria 1–4, 7).
 * Headless Chromium, bundle vite z ?civTest=1. Deterministyczny seed. ZERO grantów przed turą 11 (brak
 * sztucznego zapasu). Deficyt budowany małymi, przyrostowymi dosypkami ujemnymi (krok --step) od stanu naturalnego
 * i zatrzymywany na pierwszym przejściu canEnd true→false. Brak dużych ujemnych wartości (kryterium 1 DODATKU).
 *
 * Tryby:
 *  --mode sweep            : tura 11 — schodzenie skarbca krokami aż do pierwszej blokady; zapisuje T (deficyt progowy).
 *  --mode check --deficit T: tury 1–10 przy deficycie T (canEnd musi być true w każdej turze, klik kończy turę),
 *                            tura 11 przy tym samym T (canEnd musi być false), odczyt title, klik NIE kończy tury,
 *                            naprawa (+T+zapas, hak — dźwignie UI NIE klikane, patrz BLOKADY), klik kończy turę.
 * Użycie (z gra/): node tools/live-verify-wave-689-697-a-gate-v3.cjs --mode sweep --dist <d> --out <o> [--seed 11]
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
const MODE = arg('mode', 'sweep');
const DEFICIT = Number(arg('deficit', '0'));
const STEP = Number(arg('step', '250'));
const MAX_STEPS = Number(arg('maxsteps', '200'));
const PRE = Number(arg('pre', '0')); // ujemny start-sweep (dosypka przed krokami) — tylko do zawężenia okna progu
const wait = ms => new Promise(r => setTimeout(r, ms));

async function launch(chromium, profileDir) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  const o = { headless: true, args, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
  try { return await chromium.launchPersistentContext(profileDir, o); } catch (_) {
    return await chromium.launchPersistentContext(profileDir, { ...o, executablePath: '/usr/bin/chromium' });
  }
}
const S = {
  turn: p => p.evaluate(() => window.__nnsMeasureDebug.snapshot().turn),
  canEnd: p => p.evaluate(() => window.__nnsMeasureDebug.canEnd()),
  grant: (p, n) => p.evaluate(x => window.__nnsMeasureDebug.grantPlayerGold(x), n),
  fast: (p, on) => p.evaluate(v => window.__nnsMeasureDebug.setFast(v), on),
  awaiting: p => p.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity()),
  endTurnOnce: async p => {
    await p.evaluate(() => window.__nnsMeasureDebug.endTurn());
    await p.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
    await wait(150);
  },
  button: p => p.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || ''));
    if (!b) return null;
    return { title: b.getAttribute('title') || '', text: (b.textContent || '').replace(/\s+/g, ' ').trim(), disabled: !!b.disabled };
  }),
  hudTreasury: p => p.evaluate(() => {
    const hits = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode()) && hits.length < 6) {
      const t = (n.textContent || '').trim();
      if (/Skarbiec/i.test(t)) hits.push(t.slice(0, 80));
    }
    return hits;
  }),
  click: p => p.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || ''));
    if (!b) return false; b.click(); return true;
  }),
};

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist --out'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
  const ctx = await launch(chromium, path.join(OUT, 'profile-' + MODE + '-' + SEED));
  const p = ctx.pages()[0] || await ctx.newPage();
  const res = { mode: MODE, seed: SEED, deficit: DEFICIT, step: STEP, log: [], errors: [] };
  const log = (k, v) => res.log.push({ k, v });
  p.on('pageerror', e => res.errors.push(String(e && e.message || e).slice(0, 200)));
  const outFile = path.join(OUT, `result-${MODE}-seed${SEED}.json`);
  try {
    await p.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await p.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: 'Standardowy', civTypes: 15, cityStates: 2 });
    await p.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
      await p.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    });
    if (await S.awaiting(p)) await p.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
    await S.fast(p, true);
    log('startTurn', await S.turn(p));
    log('startHud', await S.hudTreasury(p));
    // Tury 1–10. Sweep: BEZ grantów (naturalny skarbiec). Check: deficyt T w każdej turze 1–10 (bramka NIE może blokować).
    while ((await S.turn(p)) < 11) {
      const t = await S.turn(p);
      if (MODE === 'check') {
        await S.grant(p, -DEFICIT); await wait(200);
        log('turn' + t + '_canEndAtDeficit', await S.canEnd(p));
        await S.grant(p, DEFICIT);
      }
      await S.endTurnOnce(p);
      if (MODE === 'check') log('turn' + t + '_endedTo', await S.turn(p));
    }
    log('reachedTurn', await S.turn(p));
    log('turn11_awaitingFirstCity', await S.awaiting(p));
    log('turn11_hud_natural', await S.hudTreasury(p));

    if (MODE === 'check') {
      // Tura 11 przy deficycie T (tury 1–10 już przeszły z deficytem T w pętli powyżej).
      await S.grant(p, -DEFICIT); await wait(200);
      log('turn11_canEndAtDeficit', await S.canEnd(p));
      await S.fast(p, false); await wait(2500);
      log('turn11_afterRenderOn_turn', await S.turn(p));
      log('turn11_button', await S.button(p));
      log('turn11_hud', await S.hudTreasury(p));
      const before = await S.turn(p);
      log('turn11_click_clicked', await S.click(p));
      await wait(800);
      log('turn11_click_turnBefore', before);
      log('turn11_click_turnAfter', await S.turn(p));
      await p.screenshot({ path: path.join(OUT, `gate-turn11-deficit${DEFICIT}.png`) });
      await S.grant(p, DEFICIT + 1000); await S.fast(p, true); await wait(300);
      const bef = await S.turn(p);
      log('fix_canEnd', await S.canEnd(p));
      await S.click(p);
      await p.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
      await wait(300);
      log('fix_turnBefore', bef); log('fix_turnAfter', await S.turn(p));
    } else {
      // SWEEP: tura 11, małe dosypki ujemne aż do pierwszej blokady.
      log('sweepTurn', await S.turn(p));
      log('sweepStartHud', await S.hudTreasury(p));
      log('sweepStartCanEnd', await S.canEnd(p));
      await p.evaluate(() => { window.__obrMarker = 'set-' + Date.now(); });
      let total = 0;
      if (PRE) { await S.grant(p, -PRE); total = PRE; await wait(300); log('preGrantNegative', -PRE); log('preCanEnd', await S.canEnd(p)); } let blockedAt = null; let prev = await S.canEnd(p); let turnPrev = await S.turn(p);
      const transitions = [{ total: 0, canEnd: prev, turn: turnPrev }];
      for (let k = 0; k < MAX_STEPS; k++) {
        await S.grant(p, -STEP); total += STEP; await wait(120);
        const now = await S.canEnd(p);
        const tn = await S.turn(p);
        const aw = await S.awaiting(p);
        if (now !== prev || tn !== turnPrev || aw) {
          const marker = await p.evaluate(() => (window.__obrMarker || null));
          const dom = await p.evaluate(() => {
            const t = (document.body.innerText || '').replace(/\s+/g, ' ');
            const m = t.match(/.{0,60}(Przegran|Porażk|Koniec gry|Zwycięst|Tworzenie świata).{0,60}/i);
            return m ? m[0] : null;
          });
          transitions.push({ total, canEnd: now, turn: tn, awaitingFirstCity: aw, domHit: dom, marker });
          prev = now; turnPrev = tn;
          if (!now && blockedAt === null) blockedAt = total;
          if (aw || tn !== 11 || blockedAt !== null) break;
        }
      }
      log('transitions', transitions);
      log('firstBlockedDeficit', blockedAt);
      if (blockedAt !== null) {
        log('blocked_turn_before_render', await S.turn(p));
        await S.fast(p, false); await wait(2500);
        log('blocked_turn_after_render', await S.turn(p));
        log('blocked_button', await S.button(p));
        log('blocked_hud', await S.hudTreasury(p));
        await p.screenshot({ path: path.join(OUT, `sweep-blocked-${blockedAt}.png`) });
      }
    }
  } catch (e) {
    res.fatal = String(e && e.stack || e).slice(0, 800);
  } finally {
    fs.writeFileSync(outFile, JSON.stringify(res, null, 2));
    await ctx.close();
    console.log(JSON.stringify(res.log, null, 1));
    console.log('errors', JSON.stringify(res.errors), 'fatal', res.fatal || '-');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
