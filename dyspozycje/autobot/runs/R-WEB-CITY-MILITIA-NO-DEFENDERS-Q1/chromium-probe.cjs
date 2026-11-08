'use strict';
/**
 * chromium-probe.cjs — pomiar PRZED/PO w Chromium na PRAWDZIWYCH funkcjach (esbuild IIFE -> page.addScriptTag).
 * Uruchom z gra/:  PROBE_ROOT=<gra z src+data> node ../dyspozycje/autobot/runs/R-WEB-CITY-MILITIA-NO-DEFENDERS-Q1/chromium-probe.cjs
 * To NIE jest pelna gra (brak buildu, zakaz) — to realne moduly gry (siegeDefenders, siege, units.json) w realnym Chromium.
 */
const fs = require('fs'), path = require('path');
const GRA = path.resolve(process.cwd());
const ROOT = process.env.PROBE_ROOT ? path.resolve(process.env.PROBE_ROOT) : GRA;
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
(async () => {
  const tmp = fs.mkdtempSync('/dev/shm/militia-probe-');
  const entry = path.join(tmp, 'e.ts');
  fs.writeFileSync(entry, `import * as SD from '${ROOT}/src/game/siegeDefenders'; import * as SG from '${ROOT}/src/game/siege';
(window as any).M = { SD, SG };`);
  const out = path.join(tmp, 'b.js');
  esbuild.buildSync({ entryPoints: [entry], bundle: true, format: 'iife', outfile: out, absWorkingDir: ROOT, logLevel: 'error', nodePaths: [path.join(GRA, 'node_modules')] });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ path: out });
  const rows = await page.evaluate(() => {
    const { SD } = window.M;
    const res = [];
    const real = { id: 'r1', ownerId: 1, typeId: 'Wojownik', category: 'miecznik', q: 4, r: 7, ruch: 2, ruchLeft: 0 };
    for (const pop of [3, 10, 30, 60]) for (const garBuilding of [false, true]) for (const counter of [0, 5]) for (const withUnit of [false, true]) {
      const city = { id: 'c1', ownerId: 1, q: 4, r: 7, name: 'M', maMur: false, population: pop, garnizon: counter };
      const opts = { completedBuildingIds: garBuilding ? ['garnizon'] : [], ownerEra: 2 };
      const units = withUnit ? [real] : [];
      const r = SD.collectCityDefRoster(city, units, opts);
      const has = SD.hasCityDefenders(city, units, opts);
      const cap = SD.canCaptureCityWithoutBattle(city, units, opts);
      const defs = [...r.militiaDefs.values()];
      const types = {};
      for (const u of r.roster) { const k = u.typeId + (u.isMilitia ? '(mil)' : ''); types[k] = (types[k] || 0) + 1; }
      res.push({ pop, garBuilding, counter, withUnit, rosterLen: r.roster.length, militia: r.roster.filter(u => u.isMilitia).length, types,
        hasDefenders: has, capturedWithoutBattle: cap,
        sample: defs.length ? { atk: defs[0].meleeAttack, def: defs[0].meleeDefence, hp: defs[0].health, morale: defs[0]['Morale bazowe'] } : null,
        title: SD.defenderSideTitle(city, r.roster) });
    }
    return res;
  });
  console.log(JSON.stringify(rows));
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch(e => { console.error(e); process.exit(1); });
