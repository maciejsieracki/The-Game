const { chromium } = require('/home/user/The-Game/.claude/worktrees/wf_4474cbc6-012-1/gra/node_modules/playwright');
const URL = 'file:///tmp/r1lv/index.html?playtest=mapa';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (e) { browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); }
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) { if ((await page.locator('text=Tworzenie świata').count()) === 0) break; await wait(1000); }
  await page.waitForFunction(() => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__cityCessionTestDebug && window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1, undefined, { timeout: 900000 });
  await wait(300);
  const out = await page.evaluate(() => {
    const d = window.__peaceRulesTestDebug;
    const ai = d.listAiOwnerIds()[0];
    const log = [];
    const snap = (tag) => { const p = d.getPowers(ai); log.push({ tag, ai: p.ai, player: p.player }); };
    d.setAiPowerBonusForTest(ai, 0); snap('after bonus0 (ai)');
    d.setAiPowerBonusForTest(0, 0); snap('after bonus0 (player)');
    const pw0 = d.getPowers(ai);
    d.setAiPowerBonusForTest(ai, Math.max(0, Math.round(1.3 * pw0.player - pw0.ai))); snap('after set 1.3 target');
    d.setRelationForBrake(ai, 200, 200); snap('after setRelationForBrake');
    return { ai, log };
  });
  console.log(JSON.stringify(out));
  await browser.close();
})().catch((e) => { console.error('PROBE_ERR', e.message); process.exit(1); });
