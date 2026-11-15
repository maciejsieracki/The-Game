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
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium', ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`) : [])].find(p => p && fs.existsSync(p));

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
    const early = st.find(s => s.id === 'wczesna');
    const late = st.find(s => s.id === 'pozna');
    const strong = st.find(s => s.id === 'silna');
    const ok1 = early && early.wearinessPw > 0 && late && late.wearinessPw > early.wearinessPw;
    const ok2 = strong && strong.wearinessPw === undefined && /wymaga miasta o wartości ≥ \d+ PW/.test(strong.reason || '');
    if (!ok1) { bad++; console.error('FAIL: wiersz Z nie rosnie z turą (wczesna vs poznа)'); }
    if (!ok2) { bad++; console.error('FAIL: silna AI bez wiersza Z i z komunikatem o cenie'); }
    for (const id of ['wczesna', 'pozna', 'silna']) {
      const el = await page.$(`section[data-state="${id}"]`);
      if (el) await el.screenshot({ path: path.join(outDir, `stol-${id}.png`) });
    }
    const rowTexts = await page.$$eval('.weariness', els => els.map(e => e.textContent + ' | ' + e.getAttribute('title')));
    console.log('wiersze Z w DOM:', JSON.stringify(rowTexts));
    const strongText = await page.$eval('section[data-state="silna"]', el => el.innerText);
    const ok3 = strongText.includes('zmęczenie nie obniża tej ceny');
    console.log('komunikat silnej AI widoczny w stole:', ok3);
    if (!ok3) { bad++; console.error('FAIL: komunikat o cenie silnej AI nie jest widoczny w stole'); }
    if (errors.length) { bad++; console.error('PAGE ERRORS', errors); }
    await page.close();
  } finally { await browser.close(); await server.close(); }
  console.log(bad ? 'BROWSER FAIL ' + bad : 'BROWSER PASS');
  process.exitCode = bad ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
