const { chromium } = require('../../../../gra/node_modules/playwright');
(async () => {
  const dist = process.argv[2];
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
  const page = await b.newPage({ viewport: { width: 1024, height: 768 } });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('file://' + dist + '/index.html?playtest=oblezenie-duze', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__lastBattleScene, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => new Promise((resolve) => {
    const bs = window.__lastBattleScene;
    const arch = bs.def.find((u) => !u.dead && u.onWallWalkway && u.rangedBase && !bs._isCatapult(u.bu));
    const out = {};
    const atks = bs.atk.filter((u) => !u.dead);
    const tgt = atks[0];
    atks.slice(1).forEach((u) => { u.q = 0; u.r = 0; });
    tgt.onWallWalkway = false; tgt.q = arch.q - 5; tgt.r = arch.r;
    out.dist = Math.abs(arch.q - tgt.q) + Math.abs(arch.r - tgt.r);
    out.archer = { rangeBase: arch.rangeBase, startRange: arch.range, ammo: arch.ammoLeft };
    out.tgtKeys = Object.keys(tgt).filter((k) => /^(hp|soldiers|count|men|alive|size)/i.test(k) && typeof tgt[k] === 'number');
    out.tgtBefore = JSON.stringify(out.tgtKeys.map((k) => tgt[k]));
    try { bs._applyTerrainRange(arch); } catch (e) { out.applyErr = String(e); }
    out.rangeAfterApply = arch.range;
    out.picked = !!bs._rangedTargetInRange(arch);
    let done = false;
    try { bs._activateUnit(arch, () => { done = true; }); } catch (e) { out.err = String(e); }
    setTimeout(() => {
      out.done = done; out.ammoAfter = arch.ammoLeft;
      out.tgtAfter = JSON.stringify(out.tgtKeys.map((k) => tgt[k]));
      resolve(out);
    }, 8000);
  }));
  console.log(JSON.stringify({ r, errs }));
  await b.close();
})();
