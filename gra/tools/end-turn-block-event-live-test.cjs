'use strict';
/**
 * end-turn-block-event-live-test.cjs — R-WEB-UI-END-TURN-BLOCK-EVENT-Q1 (runda 2).
 *
 * Test ŻYWEJ GRY (Chromium, build poza repo, ?civTest=1 + __nnsMeasureDebug). Scenariusz na realnym stanie:
 *  1) skarbiec po turze < 0 -> bramka blokuje „Zakończ turę”;
 *  2) próba zakończenia tury -> dokładnie JEDNO wydarzenie „Nie można zakończyć tury” w panelu (zakładka Ważne)
 *     z przyciskiem „Zwiększ podatek do X%” i „Zmienię sam”; ponowna próba nie duplikuje karty;
 *  3) klik „Zwiększ podatek do X%” ustawia podział (Pieniądz = X) przez istniejącą zmianę podziału;
 *     bramka puszcza turę (canEnd = true), karta blokady znika, tura może się zakończyć;
 *  4) kontrola: bez blokady brak karty; zrzut panelu z blokadą -> evidence.
 *
 * Użycie (z gra/): node tools/end-turn-block-event-live-test.cjs --dist <d> --out <o> [--seed 11]
 * Kod wyjścia 0 = wszystkie asercje PASS; 1 = FAIL; 2 = zły argument; 3 = błąd uruchomienia.
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
const wait = ms => new Promise(r => setTimeout(r, ms));

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    return await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args });
  }
}

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist --out'); process.exit(2); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
  const browser = await launch(chromium);
  const errors = [];
  const checks = [];
  const ok = (cond, label, data) => { checks.push({ ok: !!cond, label, data: data === undefined ? null : data }); };
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
    page.on('pageerror', e => errors.push(String(e && e.message || e).slice(0, 200)));
    page.on('dialog', d => d.dismiss().catch(() => {}));
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: MAP, civTypes: 15, cityStates: 2 });
    await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    });
    if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
      await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
    }
    await wait(800);
    const D = fn => page.evaluate(fn);
    const api = {
      info: () => D(() => window.__nnsMeasureDebug.gateInfo()),
      turn: () => D(() => window.__nnsMeasureDebug.snapshot().turn),
      setFast: on => page.evaluate(o => window.__nnsMeasureDebug.setFast(o), on),
      setT: v => page.evaluate(o => window.__nnsMeasureDebug.setPlayerTreasury(o), v),
      setSplit: (p, n, l) => page.evaluate(o => window.__nnsMeasureDebug.setTaxSplit(o[0], o[1], o[2]), [p, n, l]),
      setAuto: on => page.evaluate(o => window.__nnsMeasureDebug.setAutoWyz(o), on),
      split: () => D(() => window.__nnsMeasureDebug.getTaxSplit()),
      endTurn: async () => {
        await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
        await wait(400);
      },
      /** Render włączony na chwilę (karta wydarzeń odświeża się z renderem), potem szybki tryb z powrotem. */
      withRender: async fn => {
        await page.evaluate(() => window.__nnsMeasureDebug.setFast(false));
        await wait(1200);
        await page.evaluate(() => window.__nnsMeasureDebug.forceGateRecompute());
        await wait(900);
        // zamknij nakładki (np. audiencja dyplomatyczna), żeby panel wydarzeń był widoczny
        for (let i = 0; i < 4; i++) {
          const clicked = await page.evaluate(() => {
            const b = [...document.querySelectorAll('button')].find(x => /^(wróć|zamknij)$/i.test((x.textContent || '').trim()) && x.offsetParent !== null);
            if (b) { b.click(); return true; }
            return false;
          });
          if (!clicked) break;
          await wait(400);
        }
        const r = await fn();
        await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));
        return r;
      },
    };
    const cardInfo = () => page.evaluate(() => {
      const cards = [...document.querySelectorAll('.sp-event[data-id^="end-turn-block-"]')];
      return {
        count: cards.length,
        ids: cards.map(c => c.getAttribute('data-id')),
        buttons: [...document.querySelectorAll('.sp-act-btn')].map(b => ({ text: (b.textContent || '').trim(), act: b.getAttribute('data-sp-act-key') })),
        subtitle: cards[0] ? ((cards[0].querySelector('.sp-sub') || {}).textContent || '') : '',
      };
    });
    const openWazne = () => page.evaluate(() => {
      const t = [...document.querySelectorAll('button, [role="tab"], .sp-tab')].find(x => /^ważne/i.test((x.textContent || '').trim()));
      if (t) t.click();
      return !!t;
    });

    await api.setFast(true);
    await api.setSplit(30, 60, 10);
    await api.setAuto(true);
    await api.setT(-4);
    await wait(150);
    const i0 = await api.info();
    ok(i0.gate.blokada === true && i0.canEnd === false, 'bramka blokuje przy skarbcu po turze < 0', { canEnd: i0.canEnd, blokada: i0.gate.blokada });
    const prop = i0.gate.propozycjaPodatku;
    ok(prop && prop.punktyProcentowe > 0, 'bramka podaje propozycję podatku', prop);
    const sp0 = await api.split();

    const beforeAttempt = await api.withRender(async () => cardInfo());
    ok(beforeAttempt.count === 0 && beforeAttempt.buttons.length === 0, 'przed próbą zakończenia tury brak karty blokady', beforeAttempt);

    const t0 = await api.turn();
    await api.endTurn();
    await api.endTurn(); // ponowna próba w tej samej turze
    const t1 = await api.turn();
    ok(t1 === t0, 'zablokowana tura się nie kończy', { t0, t1 });

    const shown = await api.withRender(async () => {
      await openWazne();
      await wait(400);
      return cardInfo();
    });
    ok(shown.count === 1, 'po próbie: dokładnie jedna karta blokady (bez duplikatu przy ponownej próbie)', shown);
    const expectedBtn = prop ? `Zwiększ podatek do ${sp0.procentPieniadz + prop.punktyProcentowe}%` : null;
    ok(expectedBtn && shown.buttons.some(b => b.text === expectedBtn && b.act === 'tax-raise'),
      'karta ma przycisk „' + expectedBtn + '”', shown.buttons);
    ok(shown.buttons.some(b => b.text === 'Zmienię sam' && b.act === 'open-tax'), 'karta ma przycisk „Zmienię sam”', shown.buttons);
    ok(/skarbiec/i.test(shown.subtitle), 'karta niesie pełny komunikat bramki', shown.subtitle.slice(0, 160));
    await page.screenshot({ path: path.join(OUT, 'blokada-wydarzenie-wazne.png') });

    // Klik przycisku „Zwiększ podatek do X%”
    const clicked = await page.evaluate(txt => {
      const b = [...document.querySelectorAll('.sp-act-btn')].find(x => (x.textContent || '').trim() === txt);
      if (!b) return false;
      b.click();
      return true;
    }, expectedBtn);
    ok(clicked, 'klik przycisku „Zwiększ podatek” wykonany');
    await wait(300);
    const sp1 = await api.split();
    ok(prop && sp1.procentPieniadz === sp0.procentPieniadz + prop.punktyProcentowe,
      'po kliku podatek = proponowana wartość (Pieniądz +pkt)', { before: sp0, after: sp1, pkt: prop && prop.punktyProcentowe });
    const i2 = await api.withRender(async () => api.info());
    ok(i2.canEnd === true, 'po kliku bramka puszcza turę (canEnd = true)', { canEnd: i2.canEnd, prognoza: i2.forecast && i2.forecast.skarbiecPo });
    const after = await api.withRender(async () => { await openWazne(); await wait(300); return cardInfo(); });
    ok(after.count === 0, 'po zniesieniu blokady karta znika', after);
    const t2 = await api.turn();
    await api.endTurn();
    const t3 = await api.turn();
    ok(t3 === t2 + 1, 'tura może zostać zakończona po akcji', { t2, t3 });

    // Kontrola negatywna: bez blokady brak karty
    await api.setT(0);
    await wait(150);
    const ctrl = await api.withRender(async () => { await openWazne(); await wait(300); return cardInfo(); });
    ok(ctrl.count === 0, 'bez blokady brak karty (kontrola)', ctrl);
  } catch (e) {
    checks.push({ ok: false, label: 'wyjątek testu: ' + String(e && e.message || e).slice(0, 200), data: null });
  } finally {
    await browser.close();
  }
  const fails = checks.filter(c => !c.ok);
  const result = { checks, fails: fails.map(f => f.label), errors };
  fs.writeFileSync(path.join(OUT, 'end-turn-block-event-live.json'), JSON.stringify(result, null, 2));
  for (const c of checks) console.log((c.ok ? 'PASS ' : 'FAIL ') + c.label);
  console.log(`end-turn-block-event-live-test: passed=${checks.length - fails.length} failed=${fails.length} pageerrors=${errors.length}`);
  process.exit(fails.length === 0 ? 0 : 1);
}

main().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(3); });
