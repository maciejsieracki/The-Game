const { chromium } = require('/home/user/The-Game/.claude/worktrees/wf_4b0e8871-fcc-1/gra/node_modules/playwright');
const URL = 'file:///tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/nns-build/index.html?playtest=mapa&civTest=1';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', m => { if (/NNS|nie powiod|refresh|prognoz/i.test(m.text()) || m.type() === 'error') logs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  p.on('pageerror', e => logs.push('PAGEERROR: ' + e.message.slice(0, 300)));
  await p.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await p.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) { if ((await p.locator('text=Tworzenie świata').count()) === 0) break; await wait(1000); }
  await p.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__defeatTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1, undefined, { timeout: 900000 });
  await p.evaluate(() => window.__defeatTestDebug.setPlayerEraForTest(1)); await wait(300);
  const r = await p.evaluate(() => { const a = window.__aiTradeWiringTestDebug.nnsDiag(); const b2 = window.__aiTradeWiringTestDebug.nnsDiag(); return { a: a.forecast, b: b2.forecast, gate: b2.gate, cities: window.__eraTestDebug.getWorldState().citiesLen }; });
  console.log('fresh turn1 forecast reads', JSON.stringify(r));
  console.log(logs.slice(0, 20).join('\n') || '(brak logow NNS/error)');
  await b.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
