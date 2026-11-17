const { chromium } = require('/home/user/The-Game/.claude/worktrees/wf_4b0e8871-fcc-1/gra/node_modules/playwright');
const URL = 'file:///tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/nns-build/index.html?playtest=mapa&civTest=1';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const logs = [];
  p.on('console', m => { if (/NNS|EndTurn|blocked/i.test(m.text())) logs.push(m.type() + ': ' + m.text().slice(0, 240)); });
  await p.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await p.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) { if ((await p.locator('text=Tworzenie świata').count()) === 0) break; await wait(1000); }
  await p.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__defeatTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1, undefined, { timeout: 900000 });
  await p.evaluate(() => window.__defeatTestDebug.setPlayerEraForTest(1)); await wait(300);
  const st = () => p.evaluate(() => {
    const d = window.__aiTradeWiringTestDebug.nnsDiag();
    return { turn: window.__eraTestDebug.getWorldState().turn, gate: d.gate, sp: d.spichlerz, fc: d.forecast && [d.forecast.spichlerzObecny, d.forecast.spichlerzPo] };
  });
  const endt = async () => { await p.evaluate(() => window.__eraTestDebug.endTurn()); await wait(5000); };
  console.log('t1', JSON.stringify(await st()));
  await endt();
  console.log('after endTurn (t1->?)', JSON.stringify(await st()));
  await endt();
  console.log('after endTurn 2', JSON.stringify(await st()));
  const r = await p.evaluate(() => window.__aiTradeWiringTestDebug.setSpichlerzPanstwa(0, 400));
  console.log('setSpichlerz(0,400) ret', r, JSON.stringify(await st()));
  await endt();
  console.log('after top-up endTurn', JSON.stringify(await st()));
  console.log(logs.slice(0, 12).join('\n'));
  await b.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
