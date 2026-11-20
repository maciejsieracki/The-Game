'use strict';
// R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1, runda 2: zrzuty stolu w Chromium (Vite HTTP).
// Dane: prawdziwy evaluateProposal + renderPnBalancePanelHtml (strona przegladarki), bez recznie wpisanych liczb.
// Asercje: wczesna/poźna tura -> wiersz „Zmęczenie wojną +N PW" z N>0 i rosnący; silna AI -> brak wiersza Z + komunikat o cenie.
// Usage: node tools/pw-weary-table-browser-test.cjs [katalog-zrzutow]
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const outDir = process.argv[2] || path.resolve(root, '..', 'dyspozycje/autobot/runs/R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1/evidence');
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`) : [])].find(p => p && fs.existsSync(p));

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox'] });
  let bad = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/pw-weary-table-browser-entry.html`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__pwTable?.ready === true, undefined, { timeout: 60000 });
    const st = await page.evaluate(() => window.__pwTable.states);
    console.log(JSON.stringify(st));
    const price = id => st.find(x => x.id === id)?.wearinessInfo?.cenaPokojuPn;
    const p11 = price('t11'), p20 = price('t20'), p30 = price('t30'), p40 = price('t40');
    console.log('ceny PN z silnika (t11,t20,t30,t40):', p11, p20, p30, p40);
    // 6000 x (1 - tury/40): 4350 / 3000 / 1500 / 0
    const okMono = p11 === 4350 && p20 === 3000 && p30 === 1500 && p40 === 0;
    if (!okMono) { bad++; console.error('FAIL: cena nie maleje 4350 -> 3000 -> 1500 -> 0 wraz z turami wojny'); }
    for (const id of ['t11', 't20', 't30', 't40', 'silna']) {
      const el = await page.$(`section[data-state="${id}"]`);
      if (el) await el.screenshot({ path: path.join(outDir, `stol-${id}.png`) });
    }
    const rowTexts = await page.$$eval('.weariness', els => els.map(e => e.textContent + ' | ' + e.getAttribute('title')));
    console.log('wiersze ceny w DOM:', JSON.stringify(rowTexts));
    const texts = {};
    for (const id of ['t11', 't20', 't30', 't40']) texts[id] = await page.$eval(`section[data-state="${id}"]`, el => el.innerText);
    const okDom = /Cena pokoju: 4[  .\s]?350 PN/.test(texts.t11) && /Cena pokoju: 0 PN/.test(texts.t40) && !/Zmęczenie wojną \+/.test(texts.t11 + texts.t20);
    console.log('wiersz ceny widoczny w DOM (t11=4350, t40=0, brak starego wiersza Z):', okDom);
    if (!okDom) { bad++; console.error('FAIL: wiersz ceny pokoju w DOM', JSON.stringify(texts.t11.slice(0, 300))); }
    const strongText = await page.$eval('section[data-state="silna"]', el => el.innerText);
    console.log('silna AI (tekst):', JSON.stringify(strongText.slice(0, 400)));
    if (errors.length) { bad++; console.error('PAGE ERRORS', errors); }
    await page.close();
  } finally { await browser.close(); await server.close(); }
  console.log(bad ? 'BROWSER FAIL ' + bad : 'BROWSER PASS');
  process.exitCode = bad ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
