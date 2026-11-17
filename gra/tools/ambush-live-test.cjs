'use strict';
/**
 * R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (runda 4) -- ZYWY test zasadzki w Chromium (prawdziwy main.ts, build vite POZA repo).
 *   A) gracz -> AI: przycisk, znacznik (panel + zeton na mapie), wejscie gracza na zasadzke AI => ruch przerwany, bitwa.
 *   B) AI -> gracz: zasadzka GRACZA w korytarzu, AI w wojnie marsz => ruch AI przerwany, bitwa, wznowienie fazy AI.
 * Uzycie: node gra/tools/ambush-live-test.cjs [--keep] [--shots <katalog>]   (build: ~1-2 min; wymaga chromium w /opt/pw-browsers)
 * Zrzuty 1280x720 trafiaja do --shots (domyslnie: katalog tymczasowy, sciezka wypisana na koncu).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const GRA = path.resolve(__dirname, '..');
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const args = process.argv.slice(2);
const shotsDir = args.includes('--shots') ? path.resolve(args[args.indexOf('--shots') + 1]) : fs.mkdtempSync(path.join(os.tmpdir(), 'ambush-live-shots-'));
fs.mkdirSync(shotsDir, { recursive: true });
const REUSE = args.includes('--dist') ? path.resolve(args[args.indexOf('--dist') + 1]) : null;
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const DIST = REUSE || fs.mkdtempSync(path.join(os.tmpdir(), 'ambush-live-dist-'));
const PORT = 18000 + Math.floor(Math.random() * 1000);
const CHROMIUM = process.env.AMB_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const log = (...a) => console.log(...a);

const checks = [];
const ck = (name, ok, extra) => { checks.push({ name, ok }); log((ok ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); };

function build() {
  if (REUSE) { log('uzyto istniejacego builda', DIST); return; }
  log('build vite poza repo ->', DIST);
  const r = spawnSync(path.join(GRA, 'node_modules', '.bin', 'vite'), ['build', '-c', 'tools/ambush-live-vite.config.ts'], {
    cwd: GRA, env: Object.assign({}, process.env, { AMB_ROOT: GRA, AMB_DIST: DIST }), encoding: 'utf8', maxBuffer: 1 << 28, timeout: 540000,
  });
  if (r.status !== 0) { console.error(r.stdout.slice(-2000), r.stderr.slice(-2000)); throw new Error('vite build failed'); }
}

async function newPage(browser, query) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('dialog', d => d.accept());
  await page.addInitScript(() => {
    // Rejestr komunikatow o zasadzce: showHintMessage ustawia hintToast.innerHTML (ten sam zeton, tekst podmieniany).
    window.__seen = [];
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (desc && desc.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: true, enumerable: desc.enumerable, get: desc.get,
        set(v) { try { const t = String(v); if (/zasadzk/i.test(t) && t.length < 200) window.__seen.push(t); } catch (e) { /* brak */ } return desc.set.call(this, v); },
      });
    }
  });
  await page.goto('http://127.0.0.1:' + PORT + '/' + (query || ''), { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__amb && window.__amb.ready, undefined, { timeout: 30000 });
  await page.evaluate(() => window.__amb.start(981042));
  await page.waitForFunction(() => document.querySelector('canvas'), undefined, { timeout: 180000 });
  const f = await page.evaluate(() => window.__amb.foundCity());
  if (f !== 'ok' && f !== 'already') throw new Error('founding failed: ' + f);
  return { page, errs };
}
const hexDist = (aq, ar, bq, br) => { const dq = aq - bq, dr = ar - br; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };
const clearBlockers = async (page) => {
  const kind = await page.evaluate(() => {
    const c = document.querySelector('.sp-event.sp-blocking');
    if (!c) return null;
    if (/Kolejka pusta/i.test(c.innerText)) { const b = c.querySelector('.sp-action-btn'); if (b) b.click(); return 'queue'; }
    const x = c.querySelector('.sp-close'); if (x) { x.click(); return 'close'; }
    return 'stuck';
  });
  if (kind === 'queue') {
    await page.waitForTimeout(2500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('.btn.btn-sm.can-build')].find((x) => /Buduj/.test(x.innerText)); if (b) b.click(); });
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  } else if (kind === 'close') await page.waitForTimeout(800);
  return kind === 'queue' || kind === 'close';
};
const closeAudience = (page) => page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => /^Wróć$/.test((x.innerText || '').trim())); if (b) { b.click(); return true; } return false; });

(async () => {
  build();
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', DIST, '--bind', '127.0.0.1'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 600));
  const browser = await chromium.launch({ headless: true, executablePath: CHROMIUM, args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  try {
    // ================= A) gracz -> AI =================
    if (ONLY !== 'B') {
      const { page, errs } = await newPage(browser);
      const lay = await page.evaluate(() => window.__amb.setup());
      ck('A0 uklad gracz->AI ustawiony', !lay.error, lay.error ? lay : undefined);
      if (lay.error) throw new Error('layout');
      let info = await page.evaluate(() => window.__amb.info());
      ck('A1 zasadzka AI niewidoczna dla gracza', info.enemyVisibleToPlayer === 0, info.enemyVisibleToPlayer);
      await page.evaluate(() => window.__amb.select('amb-s1'));
      await page.waitForTimeout(500);
      const t0 = await page.locator('[data-act="ambush"]').first().getAttribute('title');
      ck('A2 przycisk Zasadzka w panelu armii', t0 === 'Zasadzka', t0);
      await page.evaluate(() => window.__amb.setRuch(['amb-s1', 'amb-s2'], 0));
      await page.waitForTimeout(300);
      const dis = page.locator('[data-act="ambush"]').first();
      const t1 = await dis.getAttribute('title');
      ck('A3 blokada przy 0 ruchu: disabled + powod w title', (await dis.isDisabled()) && t1 && t1 !== 'Zasadzka', t1);
      await page.evaluate(() => window.__amb.setRuch(['amb-s1', 'amb-s2'], 3));
      await page.waitForTimeout(300);
      await page.locator('[data-act="ambush"]').first().click();
      await page.waitForTimeout(600);
      await page.evaluate(() => window.__amb.select('amb-s1'));
      await page.waitForTimeout(600);
      info = await page.evaluate(() => window.__amb.info());
      ck('A4 klik: ambush=true, ruch zuzyty', info.s1 && info.s1.ambush === true && info.s1.ruchLeft === 0, info.s1);
      const mark = await page.locator('.uc-ambush-chip, .ash-ambush-mark').count();
      const markText = mark ? await page.locator('.uc-ambush-chip, .ash-ambush-mark').first().innerText() : '';
      ck('A5 znacznik W ZASADZCE w panelu armii (produkcyjne UI)', mark > 0 && /zasadzce/i.test(markText), { mark, markText });
      ck('A6 znacznik (oko) na zetonie stosu na mapie', info.ambushMarkSprites >= 1, info.ambushMarkSprites);
      await page.evaluate(([q, r]) => window.__amb.focus(q, r), [lay.s.q, lay.s.r]);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(shotsDir, 'A-znacznik-panel-mapa-1280x720.png') });
      // lista armii: odznaka
      const listOpened = await page.evaluate(() => { const b = document.querySelector('[data-hud-action="army-list"], #btn-army-list, [data-act="army-list"]'); if (b) { b.click(); return true; } return false; });
      log('INFO lista armii otwarta przyciskiem:', listOpened);
      // odwolanie i wyzwalacz
      await page.locator('[data-act="ambush"]').first().click();
      await page.waitForTimeout(400);
      info = await page.evaluate(() => window.__amb.info());
      ck('A7 odwolanie zasadzki zdejmuje stan i znacznik', info.s1 && info.s1.ambush === false && info.ambushMarkSprites === 0, { s1: info.s1, sprites: info.ambushMarkSprites });
      await page.evaluate(() => window.__amb.select('amb-m'));
      await page.waitForTimeout(300);
      const started = await page.evaluate(([q, r]) => window.__amb.moveTo(q, r), [lay.e.q, lay.e.r]);
      ck('A8 ruch na heks zasadzki AI zaakceptowany', started === true, started);
      let opened = false;
      for (let i = 0; i < 90; i++) {
        await page.waitForTimeout(250);
        info = await page.evaluate(() => window.__amb.info());
        await closeAudience(page);
        if (info.preBattleOpen) { opened = true; break; }
      }
      const seen = await page.evaluate(() => window.__seen);
      ck('A9 ruch przerwany -> okno bitwy (preBattle)', opened, info);
      ck('A10 gracz stanal PRZED zasadzka, zasadzka ujawniona, brak nakladania', info.m && info.e1 && !(info.m.q === info.e1.q && info.m.r === info.e1.r) && hexDist(info.m.q, info.m.r, info.e1.q, info.e1.r) === 1 && info.e1.ambush === false && info.overlap === false, { m: info.m, e: lay.e, overlap: info.overlap });
      ck('A11 komunikat „Wpadłeś w zasadzkę!” zaobserwowany w DOM', seen.some(t => /Wpadłeś w zasadzkę/.test(t)), seen.slice(0, 4));
      await page.screenshot({ path: path.join(shotsDir, 'A-bitwa-po-wejsciu-1280x720.png') });
      ck('A12 brak bledow strony', errs.length === 0, errs.slice(0, 2));
      await page.close();
    }

    // ================= N) armia BEZ generała: zasadzka zablokowana z powodem =================
    // R-WEB-ARMY-AMBUSH-REQUIRES-GENERAL-Q1 (zarzut 1 Evaluatora, kryterium f): zrzut przycisku dla stosu bez generała.
    if (ONLY !== 'B') {
      const { page, errs } = await newPage(browser);
      const lay = await page.evaluate(() => window.__amb.setup());
      if (lay.error) throw new Error('layout N');
      const noGen = await page.evaluate(() => window.__amb.noGeneral('amb-s1'));
      ck('N0 generał zdjęty z jednostki gracza (stos bez generała)', noGen === true, noGen);
      await page.evaluate(() => window.__amb.select('amb-s1'));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.__amb.setRuch(['amb-s1', 'amb-s2'], 3));
      await page.waitForTimeout(400);
      const nb = page.locator('[data-act="ambush"]').first();
      const nTitle = await nb.getAttribute('title');
      ck('N1 przycisk Zasadzka zablokowany dla armii bez generała', (await nb.isDisabled()) === true, nTitle);
      ck('N2 powód po polsku w title przycisku', nTitle === 'Zasadzkę może zastawić tylko armia z generałem.', nTitle);
      await nb.screenshot({ path: path.join(shotsDir, 'N-przycisk-zasadzka-zablokowany-bez-generala.png') });
      await page.evaluate(() => { const b = document.querySelector('[data-act="ambush"]'); if (b) b.click(); });
      await page.waitForTimeout(400);
      const infoN = await page.evaluate(() => window.__amb.info());
      ck('N3 kliknięcie zablokowanego przycisku nie zastawia zasadzki', !(infoN.s1 && infoN.s1.ambush === true), infoN.s1);
      await page.evaluate(([q, r]) => window.__amb.focus(q, r), [lay.s.q, lay.s.r]);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(shotsDir, 'N-zasadzka-bez-generala-zablokowana-1280x720.png') });
      ck('N4 brak bledow strony', errs.length === 0, errs.slice(0, 2));
      await page.close();
    }

    // ================= B) AI -> gracz =================
    if (ONLY !== 'A') {
      const { page, errs } = await newPage(browser, '?civTest=1');
      const lay = await page.evaluate(() => window.__amb.setupAi());
      ck('B0 uklad AI->gracz (korytarz; zasadzka na trasie AI do miasta) ustawiony', !lay.error, lay.error ? lay : { wall: lay.wall, ambHex: lay.ambHex, toCity: lay.toCity });
      if (!lay.error) {
        await page.evaluate(([q, r]) => window.__amb.focus(q, r), [lay.ambHex.q, lay.ambHex.r]);
        let info = await page.evaluate(() => window.__amb.info());
        ck('B1 zasadzka gracza zastawiona, AI jej nie widzi', info.ai.s1 && info.ai.s1.ambush === true, info.ai);
        await page.screenshot({ path: path.join(shotsDir, 'B-przed-faza-AI-1280x720.png') });
        await page.evaluate(() => { try { window.__aiTradeWiringTestDebug.grantPlayerGold(5000); window.__aiTradeWiringTestDebug.grantPlayerFood(5000); } catch (e) { /* brak */ } });
        let ended = 0; let battle = false; let last = info;
        for (let turnTry = 0; turnTry < 4 && !battle; turnTry++) {
          for (let k = 0; k < 6; k++) { if (!(await clearBlockers(page))) break; }
          const t0 = await page.evaluate(() => window.__civTest.state().turn);
          await page.evaluate(() => { try { window.__aiTradeWiringTestDebug.grantPlayerGold(2000); window.__aiTradeWiringTestDebug.grantPlayerFood(2000); window.__civTest.endTurn(); } catch (e) { /* brak */ } });
          ended++;
          await page.waitForTimeout(1500);
          const diag = await page.evaluate(() => ({ nns: (() => { try { return window.__aiTradeWiringTestDebug.nnsGateBlocked(); } catch (e) { return 'n/a'; } })(),
            blocking: Array.from(document.querySelectorAll('.sp-blocking, .sp-event.sp-blocking, [role="dialog"], .modal, .civ-modal')).filter(e => e.offsetParent).map(e => (e.innerText || '').slice(0, 160)),
            turn: window.__amb.info().turn }));
          log('DIAG po endTurn:', JSON.stringify(diag));
          for (let i = 0; i < 40; i++) {
            await page.waitForTimeout(500);
            await closeAudience(page);
            await clearBlockers(page);
            last = await page.evaluate(() => window.__amb.info());
            const tNow = await page.evaluate(() => window.__civTest.state().turn);
            last.turn = tNow;
            if (last.preBattleOpen || last.battleSceneOpen) { battle = true; break; }
            if (tNow > t0 && i > 6) break;
            if (i % 8 === 7) await page.evaluate(() => window.__civTest.endTurn());
          }
        }
        log('INFO po', ended, 'zakonczonych turach:', JSON.stringify(last));
        const seen = await page.evaluate(() => window.__seen);
        ck('B2 AI weszlo w zasadzke: otwarte okno bitwy dla gracza', battle, { ai: last.ai, preBattleOpen: last.preBattleOpen });
        ck('B3 zasadzka ujawniona (ambush zdjete), brak nakladania jednostek', last.ai.s1 && last.ai.s1.ambush === false && last.overlap === false, { s1: last.ai.s1, overlap: last.overlap });
        ck('B4 AI zatrzymalo sie PRZED heksem zasadzki (nie na nim)', last.ai.e1 && last.ai.s1 && !(last.ai.e1.q === last.ai.s1.q && last.ai.e1.r === last.ai.s1.r), { e1: last.ai.e1, s1: last.ai.s1 });
        ck('B5 komunikat „Zasadzka się powiodła”', seen.some(t => /Zasadzka się powiodła/.test(t)), seen.slice(0, 4));
        await page.screenshot({ path: path.join(shotsDir, 'B-bitwa-AI-wpadlo-1280x720.png') });
        // wznowienie fazy AI po bitwie: automatyczne rozstrzygniecie i dalsze tury
        if (battle) {
          const resolved = await page.evaluate(() => {
            // R-WEB-TEST-DEBT-AMBUSH-LIVE-B3-B5-B6-Q1 (B6): w oknie przedbitewnym przycisk „AUTO” rozstrzyga bitwę;
            // dopasowanie „szybk” trafiało w „SZYBKA WYMIANA” (nie zamyka okna -> preBattleOpen zostaje true).
            const btn = Array.from(document.querySelectorAll('button')).find(b => /^AUTO$/.test((b.innerText || '').trim()))
              || Array.from(document.querySelectorAll('button')).find(b => /auto|automat|szybk|rozstrzyg/i.test((b.innerText || '')));
            if (btn) { btn.click(); return btn.innerText; }
            return null;
          });
          log('INFO klik rozstrzygniecia bitwy:', resolved);
          for (let i = 0; i < 80; i++) {
            await page.waitForTimeout(500);
            await page.evaluate(() => { try { window.__civTest.closeBattleSummary(); } catch (e) { /* brak */ } });
            await closeAudience(page);
          }
          const after = await page.evaluate(() => window.__amb.info());
          ck('B6 faza AI wznowiona po bitwie: gra nie zawisla, brak nakladania', !after.preBattleOpen && !after.battleSceneOpen && after.overlap === false, { turn: after.turn, preBattleOpen: after.preBattleOpen, battleSceneOpen: after.battleSceneOpen, overlap: after.overlap });
          await page.screenshot({ path: path.join(shotsDir, 'B-po-bitwie-1280x720.png') });
        }
      }
      ck('B7 brak bledow strony', errs.length === 0, errs.slice(0, 2));
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
    if (!args.includes('--keep') && !REUSE) fs.rmSync(DIST, { recursive: true, force: true });
  }
  const bad = checks.filter(c => !c.ok).length;
  log(`\nWYNIK: ${checks.length - bad} PASS / ${bad} FAIL   zrzuty: ${shotsDir}`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('ERR', e && e.message ? e.message : e); process.exit(2); });
