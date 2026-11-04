'use strict';
/**
 * siege-surrender-forecast-live-test.cjs -- R-WEB-SIEGE-BADGE-TURNS-TO-SURRENDER-Q1 (Chromium, ?civTest=1).
 * ZYWA, zbudowana gra: ustawia stan oblezenia na zywym miescie (hak __siegeBadgeTestDebug), sprawdza napis licznika
 * w DOM plakietki (.civ-siege-html-label), robi REALNY koniec tury i sprawdza, ze licznik sie odswiezyl.
 * Usage (z gra/): node tools/siege-surrender-forecast-live-test.cjs --dist <katalog vite build> [--shots <katalog>]
 */
const fs = require('fs');
const path = require('path');
const argOf = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
const DIST = argOf('--dist');
const SHOTS = argOf('--shots');
if (DIST === null) { console.error('brak --dist <katalog>'); process.exit(2); }
const URL = 'file://' + path.resolve(DIST, 'index.html') + '?playtest=mapa&civTest=1';
const CHROME = process.env.CHROME_BIN || '/opt/pw-browsers/chromium';
let pass = 0; let fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
    for (let i = 0; i < 120; i++) {
      if (await page.locator('text=Tworzenie świata').count() === 0) break;
      await wait(1000);
    }
    await page.waitForFunction(() => window.__siegeBadgeTestDebug !== undefined && window.__civTest !== undefined, { timeout: 60000 });
    // overlay „Tworzenie swiata" musi zniknac na stale (3 kolejne odczyty), zanim cokolwiek inscenizujemy
    { let clear = 0;
      for (let i = 0; i < 400 && clear < 3; i++) {
        const busy = await page.evaluate(() => /Tworzenie \u015bwiata/.test(document.body.innerText));
        clear = busy ? 0 : clear + 1; await wait(1000);
      } }
    await wait(1500);

    let st = await page.evaluate(() => window.__civTest.state());
    if (st.cities.length === 0) {
      // sandbox ?playtest=mapa startuje bez miasta gracza: zaloz realne miasto przez hak civTest
      const cand = await page.evaluate(() => window.__civTest.foundCandidates(1));
      console.log('  kandydat zalozenia miasta: ' + JSON.stringify(cand));
      if (cand.length) await page.evaluate((c) => window.__civTest.foundCity(c.q, c.r), cand[0]);
      await wait(1500);
      st = await page.evaluate(() => window.__civTest.state());
    }
    const city = st.cities.find(c => c.ownerId === st.me) || st.cities[0];
    check('jest miasto do inscenizacji', !!city, st.cities.length);
    const pop = Math.max(1, city.pop);
    // zapasy = 3*pop + 1 => ceil/pop = 4 ticki do wyzerowania + 1 przejecie = 5 (garnizon 0 zakladamy; mierzymy po DOM)
    const food = pop * 3;
    await page.evaluate(({ id, food }) => window.__siegeBadgeTestDebug.setSiege(id, food, false), { id: city.id, food });
    await wait(500);
    const readLabel = () => page.evaluate(() => {
      const el = document.querySelector('.civ-siege-html-label');
      return el ? { text: el.innerText, badge: el.querySelector('.civ-siege-surrender')?.textContent ?? null, title: el.title } : null;
    });
    let lab = await readLabel();
    check('plakietka OBLEZENIE widoczna', !!lab && /OBŁĘŻENIE/.test(lab.text), lab);
    check('plakietka zawiera nazwe miasta', !!lab && lab.text.includes(city.name), lab);
    check('plakietka ZAWSZE zawiera licznik "poddanie za N tur..."', !!lab && /poddanie za \d+ tur/.test(lab.badge || ''), lab);
    check('tooltip wyjasnia licznik', !!lab && /Miasto podda się za/.test(lab.title), lab);
    const n0 = lab && /poddanie za (\d+)/.exec(lab.badge || '');
    if (SHOTS) {
      fs.mkdirSync(SHOTS, { recursive: true });
      // PRZED (odtworzenie wygladu sprzed zmiany: ten sam build z ukrytym licznikiem; NIE osobny build origin/main)
      const h = await page.addStyleTag({ content: '.civ-siege-surrender{display:none!important}' });
      await wait(300);
      await page.screenshot({ path: path.join(SHOTS, 'przed-ukryty-licznik.png') });
      await page.evaluate(() => document.querySelectorAll('style').forEach(s => { if (/civ-siege-surrender\{display:none/.test(s.textContent)) s.remove(); }));
      await wait(300);
      await page.screenshot({ path: path.join(SHOTS, 'po-3pop-zapasow.png') });
    }

    await page.evaluate(({ id }) => window.__siegeBadgeTestDebug.setSiege(id, 0, true), { id: city.id });
    await wait(700);
    lab = await readLabel();
    check('kapitulacja oczekuje -> "poddanie za 1 turę"', !!lab && lab.badge === 'poddanie za 1 turę', lab);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'po-pending.png') });

    // zmiana zapasow w trakcie (bez ponownego setSiege): licznik nadaza w kolejnych klatkach
    await page.evaluate(({ id, food }) => window.__siegeBadgeTestDebug.setSiege(id, food, false), { id: city.id, food: pop * 10 });
    await wait(700);
    const lab2 = await readLabel();
    const n2 = lab2 && /poddanie za (\d+)/.exec(lab2.badge || '');
    check('wieksze zapasy -> wiekszy licznik', !!n2 && !!n0 && Number(n2[1]) > Number(n0[1]), { n0: n0 && n0[1], n2: n2 && n2[1] });

    // REALNY koniec tury: licznik malejacy (zapasy zjadane przez tick ekonomii)
    const t0 = await page.evaluate(() => window.__civTest.state().turn);
    await page.evaluate(() => window.__civTest.endTurn());
    let t1 = t0;
    for (let i = 0; i < 180; i++) { await wait(1000); t1 = await page.evaluate(() => window.__civTest.state().turn); if (t1 > t0) break; }
    await wait(800);
    const lab3 = await readLabel();
    const n3 = lab3 && /poddanie za (\d+)/.exec(lab3.badge || '');
    check('tura posunela sie (realny endTurn)', t1 > t0, { t0, t1 });
    check('po turze licznik nie wiekszy niz przed (zapasy zjedzone) albo miasto przejete', !lab3 || (!!n3 && !!n2 && Number(n3[1]) <= Number(n2[1])), { before: n2 && n2[1], after: n3 && n3[1], lab3 });
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'po-po-turze.png') });
  } finally {
    await browser.close();
  }
  check('brak bledow strony', errors.length === 0, errors.slice(0, 3));
  console.log('RESULT pass=' + pass + ' fail=' + fail);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
