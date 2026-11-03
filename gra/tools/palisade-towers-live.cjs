'use strict';
/**
 * palisade-towers-live.cjs -- dowod ZYWY (Chromium headless + prawdziwa BattleScene)
 * dla R-WEB-PALISADE-BATTLE-WALL-RULES-Q1 runda 2 (faza B + R4).
 *
 * Usage: node tools/palisade-towers-live.cjs <distDir> <outDir> <label> <fort: palisada|mury> [--probe]
 *   distDir : zbudowany vite bundle gry (poza repo, np. /dev/shm/...)
 *   --probe : dodatkowo zmierz ostrzal wiezyczek (liczba wiezyczek, zasieg, HP celu, log).
 * Env DEFERA=1..3 -- epoka obroncy (pomiar ostrzalu w epokach 2-3; domyslnie epoka gracza).
 * Zrzuty: <outDir>/<label>-<fort>-{daleko,blisko}.png (JPEG-owe kompresje nie sa uzywane; <= 1 MB).
 * Wynik JSON na stdout (ostatnia linia).
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

(async () => {
  const [dist, outDir, label, fort, flag] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  }).catch(() => chromium.launch({ headless: true, args: ['--no-sandbox'] }));
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('file://' + path.join(dist, 'index.html') + '?playtest=oblezenie-duze&fort=' + fort + (process.env.DEFERA ? '&defera=' + process.env.DEFERA : ''), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__lastBattleScene, { timeout: 40000 });
  await page.evaluate(() => { window.__lastBattleScene._endDeployPhase(); });
  const info = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    const towers = (bs.siegeTowers || []).map((t) => t.row);
    const mid = 86;
    const w = bs.siegeWallCol;
    return { fortKind: bs.fortKind, wallCol: w, towers: towers.length, towerRows: towers.slice(0, 8), mid, range: bs.towerRange,
      shooter: bs.towerShooterRow ? bs.towerShooterRow['Jednostka'] : null, gateRow: bs.siegeGateRow };
  });
  const ROW = 86; // wiezyczka (2 + 4k) w polowie dolnej czesci muru -- ten sam rzad PRZED i PO
  const look = async (suffix, dist) => {
    await page.evaluate(({ dist, ROW }) => {
      const bs = window.__lastBattleScene;
      bs.camTarget.set(bs.siegeWallCol - 1, 0, ROW);
      const cv = bs.renderer && bs.renderer.domElement;
      if (bs.overlay && cv) {
        for (const el of Array.from(bs.overlay.children)) {
          if (el === cv || el.contains(cv)) continue;
          el.style.display = 'none'; // HUD/panele -- zostaje tylko plansza 3D
        }
      }
      bs.camDir.set(-0.62, 0.5, 0.45).normalize();
      bs.camDistTarget = dist; bs.camDist = dist; bs._applyCamera();
    }, { dist, ROW });
    await page.waitForTimeout(900);
    const f = path.join(outDir, `${label}-${fort}${process.env.DEFERA ? '-e' + process.env.DEFERA : ''}-${suffix}.png`);
    await page.screenshot({ path: f });
    return f;
  };
  const shots = [await look('daleko', 34), await look('blisko', 11)];
  let probe = null;
  if (flag === '--probe') {
    probe = await page.evaluate(async () => {
      const bs = window.__lastBattleScene;
      const t = bs.siegeTowers.find((x) => x.row === 86) || bs.siegeTowers[0];
      const target = bs.atk.find((u) => !u.dead);
      const q = bs.siegeWallCol - 2;
      bs.occByKey.delete(target.q + ',' + target.r);
      target.q = q; target.r = t.row;
      const hp0 = target.bu.hp;
      const logN = bs.log.length;
      bs.towerRange = bs.towerRange; // jak w grze
      bs.speedMul = 8; // headless/swiftshader renderuje kilka klatek/s -- czas wirtualny skalujemy
      const v0 = bs.vNow;
      bs._fireSiegeTowers();
      for (let i = 0; i < 80 && bs.vNow - v0 < 6000; i++) await new Promise((r) => setTimeout(r, 250));
      return {
        hp0, hp1: target.bu.hp, dead: target.dead, logNew: bs.log.slice(logN).filter((l) => /Wieza/.test(l)).slice(0, 4),
        towerFiredAtMost: bs.log.slice(logN).filter((l) => /Wieza strzelnicza/.test(l)).length,
      };
    });
  }
  console.log(JSON.stringify({ label, fort, info, shots, probe, errors }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
