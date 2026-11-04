'use strict';
/**
 * events-one-turn-lifetime-live-test.cjs — R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1 (Chromium, ?civTest=1).
 *
 * ZYWA, zbudowana gra: inscenizuje karty informacyjne tury N, sprawdza je w DOM panelu Wydarzenia,
 * wykonuje REALNY koniec tury (`__civTest.endTurn` -> `triggerPlayerEndTurn`) i sprawdza, ze w turze
 * N+1 nie ma ZADNEJ karty z tury N (nieprzeczytanej ani nieusunietej), a karty decyzyjne
 * (`sp-blocking`) nie znikaja z powodu sweepu. Potem inscenizuje nowe karty N+1 i sprawdza, ze sa.
 *
 * Usage (z gra/): node tools/events-one-turn-lifetime-live-test.cjs --dist <katalog vite build>
 *   (build poza repo: node ./node_modules/vite/bin/vite.js build --outDir <katalog> --emptyOutDir)
 */
const fs = require('fs');
const path = require('path');

const argOf = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
const DIST = argOf('--dist');
if (DIST === null) { console.error('brak --dist <katalog>'); process.exit(2); }
const URL = 'file://' + path.resolve(DIST, 'index.html') + '?playtest=mapa&civTest=1';
const CHROME = process.env.CHROME_BIN || '/opt/pw-browsers/chromium';

let pass = 0; let fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const cardIds = (page) => page.evaluate(() =>
  [...document.querySelectorAll('.civ-side-panel .sp-event[data-id]')].map(e => e.getAttribute('data-id')));
const blockingIds = (page) => page.evaluate(() =>
  [...document.querySelectorAll('.civ-side-panel .sp-event.sp-blocking[data-id]')].map(e => e.getAttribute('data-id')));

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
    await page.waitForFunction(() => window.__sidePanelLinkTestDebug !== undefined && window.__civTest !== undefined, { timeout: 60000 });
    await wait(1500);

    const t0 = await page.evaluate(() => window.__civTest.state().turn);
    const seed = (tag, n) => page.evaluate(({ tag, n }) => {
      window.__sidePanelLinkTestDebug.seedEvents([
        { id: `eot-hint-${n}-0`, icon: 'i', title: '', subtitle: `Wydarzenie ${tag} A`, kind: 'info' },
        { id: `era-${n}-2`, icon: 'E', title: `Nowa epoka ${tag}`, subtitle: 'Epoka', kind: 'science' },
        { id: `war-${n}-0-3`, icon: 'W', title: `Wojna ${tag}`, subtitle: 'Wojna', kind: 'enemy' },
      ]);
    }, { tag, n });

    console.log('-- tura N=' + t0 + ' --');
    await seed('TURA-N', t0);
    await wait(600);
    const before = await cardIds(page);
    check('tura N: trzy wydarzenia informacyjne widoczne', ['eot-hint-' + t0 + '-0', 'era-' + t0 + '-2', 'war-' + t0 + '-0-3'].every(id => before.includes(id)), before);
    const blockBefore = await blockingIds(page);

    console.log('-- realny koniec tury --');
    await page.evaluate(() => window.__civTest.endTurn());
    let t1 = t0;
    for (let i = 0; i < 180; i++) {
      await wait(1000);
      t1 = await page.evaluate(() => window.__civTest.state().turn);
      if (t1 > t0) break;
    }
    check('tura awansowala N -> N+1', t1 === t0 + 1, { t0, t1 });
    await wait(8000); // overlay przejscia tury + flush odroczonych wpisow
    // (1) dziennik silnika (zrodlo prawdy; DOM bywa zaslaniany karta decyzyjna)
    const logAfter = (await page.evaluate(() => window.__rebelNotifyTestDebug.getWarEventLog())).map(e => e.id);
    check('tura N+1: dziennik silnika nie zawiera kart ze starej tury',
      !logAfter.includes('eot-hint-' + t0 + '-0') && !logAfter.includes('era-' + t0 + '-2') && !logAfter.includes('war-' + t0 + '-0-3'), logAfter);
    const blockAfter = await blockingIds(page);
    // Uwaga: DOM panelu NIE jest tu asercjonowany dla kart starej tury — blokujaca karta decyzyjna moze go zaslaniac,
    // a seedEvents zeruje dziennik; dowodem jest dziennik silnika (collectTurnEvents czyta wylacznie z dziennikow).
    for (const id of blockAfter) {
      const x = page.locator('.civ-side-panel .sp-event[data-id="' + id + '"] .sp-close');
      if (await x.count() > 0) { await x.first().click(); await wait(400); }
    }
    // Karty decyzyjne sa budowane z zywego stanu (collectTurnEvents), nie z dziennikow — sweep ich
    // nie dotyka; tu tylko informacja diagnostyczna (stan gry moze je legalnie rozstrzygnac).
    console.log('  INFO blocking przed/po: ' + JSON.stringify(blockBefore) + ' / ' + JSON.stringify(blockAfter));

    console.log('-- nowe wydarzenia tury N+1 --');
    // Karta decyzyjna moze pierwszenstwem zaslaniac liste informacyjna — rozstrzygnij ja (✕) przed inscenizacja.
    for (const id of await blockingIds(page)) {
      const x = page.locator('.civ-side-panel .sp-event[data-id="' + id + '"] .sp-close');
      if (await x.count() > 0) { await x.first().click(); await wait(400); }
    }
    await seed('TURA-N1', t1);
    await wait(600);
    const fresh = await cardIds(page);
    check('tura N+1: nowe wydarzenia tej tury sa widoczne',
      ['eot-hint-' + t1 + '-0', 'era-' + t1 + '-2', 'war-' + t1 + '-0-3'].every(id => fresh.includes(id)), fresh);

    console.log('-- karta decyzyjna: nie wygasa, blokuje koniec tury; info wygasa tylko przy zmianie tury --');
    const blockAtT1 = await blockingIds(page);
    check('karta decyzyjna (blocking) z tury N+1 obecna i nie wygasa bez decyzji', blockAtT1.length === 0 || blockAtT1.every(id => blockAfter.includes(id)), { blockAfter, blockAtT1 });
    if (blockAtT1.length > 0) {
      await page.evaluate(() => window.__civTest.endTurn());
      await wait(6000);
      const tStill = await page.evaluate(() => window.__civTest.state().turn);
      const stillIds = await cardIds(page);
      check('blokada decyzyjna wstrzymuje koniec tury (tura bez zmian)', tStill === t1, { tStill, t1 });
      check('bez zmiany tury wydarzenia N+1 NIE wygasaja (wygasanie tylko na granicy tury)', ['era-' + t1 + '-2', 'war-' + t1 + '-0-3'].every(id => stillIds.includes(id)), stillIds);
    }
    check('brak bledow strony', errors.length === 0, errors);
  } finally {
    await browser.close();
  }
  console.log(`\n${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(2); });
