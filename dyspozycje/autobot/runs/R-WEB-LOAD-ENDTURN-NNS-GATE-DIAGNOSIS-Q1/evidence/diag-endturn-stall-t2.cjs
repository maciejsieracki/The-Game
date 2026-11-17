const path = require('path');
const { chromium } = require('playwright');
const [, , BUILD, PROFILE] = process.argv;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true,
    executablePath: '/usr/bin/chromium',
    viewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', (m) => { if (m.type() === 'error' || /NNS|end|tur/i.test(m.text())) logs.push(m.type() + ': ' + m.text().slice(0, 160)); });
  p.on('pageerror', (e) => logs.push('PAGEERR ' + e.message.slice(0, 200)));
  await p.goto('file://' + path.join(BUILD, 'index.html') + '?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
  await p.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) { if ((await p.locator('text=Tworzenie świata').count()) === 0) break; await wait(1000); }
  await p.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__truceSaveLoadTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0, undefined, { timeout: 900000 });
  await p.evaluate((s) => window.__truceSaveLoadTestDebug.loadSlot(s), 'nns-B-cur');
  await wait(10000);
  const t0 = await p.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  const dlg = await p.evaluate(() => Array.from(document.querySelectorAll('[role=dialog],.modal,.civ-modal,[class*=modal],[class*=Modal]')).filter((e) => e.offsetParent !== null).map((e) => (e.className + ' | ' + (e.innerText || '').slice(0, 80))).slice(0, 6));
  console.log('turn after load', t0, 'dialogs', JSON.stringify(dlg));
  await p.evaluate(() => window.__aiTradeWiringTestDebug.setSpichlerzPanstwa(0, 400));
  const g = await p.evaluate(() => { const d = window.__aiTradeWiringTestDebug.nnsDiag(); return { gate: d.gate, msg: (d.komunikat || '').slice(0, 100), sp: d.spichlerz }; });
  console.log('gate', JSON.stringify(g));
  await p.evaluate(() => window.__eraTestDebug.endTurn());
  for (let k = 0; k < 6; k++) { await wait(5000); console.log('t+', (k + 1) * 5, 'turn', await p.evaluate(() => window.__eraTestDebug.getWorldState().turn)); }
  console.log(logs.slice(-15).join('\n'));
  await ctx.close();
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
