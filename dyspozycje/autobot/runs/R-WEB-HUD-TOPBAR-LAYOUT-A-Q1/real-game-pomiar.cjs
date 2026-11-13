const path = require('path');
const GRA = '/home/user/The-Game/.claude/worktrees/wf_98998876-dae-1/gra';
const { chromium } = require(path.join(GRA, 'node_modules/playwright'));
const OUT = '/home/user/The-Game/.claude/worktrees/wf_98998876-dae-1/dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-LAYOUT-A-Q1/zrzuty';
const URL = 'file:///tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/gamedist/index.html?playtest=mapa';
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--headless=new'] });
  for (const w of [1920, 1366, 1024]) {
    const page = await br.newPage({ viewport: { width: w, height: 768 } });
    await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('.civ-hud .civ-hud-banner-right', { timeout: 120000 });
    for (let i = 0; i < 120; i++) { if (await page.locator('.civ-map-load-overlay').count() === 0) break; await new Promise((r) => setTimeout(r, 1000)); }
    await new Promise((r) => setTimeout(r, 2000));
    const m = await page.evaluate(() => {
      const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
      const chips = [...document.querySelectorAll('.civ-hud-banner-right .civ-hud-chip')].map((c) => Math.round(c.getBoundingClientRect().top));
      return { left: R(document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell')), leftCls: document.querySelector('.civ-hud-banner-left').className, right: R(document.querySelector('.civ-hud-banner-right')), rightCls: document.querySelector('.civ-hud-banner-right').className, power: R(document.querySelector('.power-center')), chipTops: [...new Set(chips)], tbVar: document.documentElement.style.getPropertyValue('--civ-hud-toolbar-top'), toolbar: R(document.querySelector('.civ-map-toolbar')), overlay: document.querySelectorAll('.civ-map-load-overlay').length };
    });
    console.log(w, JSON.stringify(m));
    await page.screenshot({ path: OUT + '/gra-pelna-' + w + '.png', clip: { x: 0, y: 0, width: w, height: 220 } });
    await page.close();
  }
  await br.close();
})().catch((e) => { console.error(e); process.exit(1); });
