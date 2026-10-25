'use strict';

/* Pomiar R-WEB-ARMY-CONSOLIDATION-Q1 w PRAWDZIWEJ grze (Chromium, hak ?testhook=1).
 * Jeden przebieg = jeden seed, jedna flaga (on|off), N tur po jednej turze naraz.
 * Po kazdej turze czyta surowe pozycje (window.__test.rawPositions, tylko odczyt) i liczy
 * dla kazdej cywilizacji (owner > 0): jednostki poza miastem wlasnym, grupy polowe
 * (laczenie <= 4 heksy, jak ARMY_CONCENTRATION_RADIUS), najwieksza grupe, udzial w miescie-proxy.
 * Uzycie (z gra/):  node tools/army-consolidation-measure.cjs --seed 101 --flag on --turns 20 --out <plik.json>
 * Wynik: JSON-lines, jedna linia na ture. Nic nie zapisuje do repo poza --out. */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const seed = Number(arg('seed', 101));
const turns = Number(arg('turns', 20));
const aiCount = Number(arg('ai', 5));
const flagOn = arg('flag', 'off') === 'on';
const outFile = arg('out', null);

// hexDistance z gry (ta sama definicja co w ai/army-concentration).
const entry = path.resolve(__dirname, '.army-consolidation-measure-entry.ts');
const bundle = path.resolve(__dirname, '.army-consolidation-measure-bundle.cjs');
fs.writeFileSync(entry, "export { hexDistance } from '../src/units/setup';\n");
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const { hexDistance } = require(bundle);
try { fs.unlinkSync(entry); } catch (e) { /* ignore */ }

const H = require('./lib/game-sim-harness.cjs');

function groupsOf(points, radius) {
  const n = points.length;
  const seen = new Array(n).fill(false);
  const groups = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const stack = [i];
    seen[i] = true;
    const members = [];
    while (stack.length) {
      const k = stack.pop();
      members.push(points[k]);
      for (let j = 0; j < n; j++) {
        if (seen[j]) continue;
        if (hexDistance(points[k].q, points[k].r, points[j].q, points[j].r) <= radius) {
          seen[j] = true;
          stack.push(j);
        }
      }
    }
    groups.push(members);
  }
  return groups;
}

function measureTurn(raw) {
  const perOwner = {};
  const owners = [...new Set(raw.units.map(u => u.owner))].filter(o => o > 0).sort((a, b) => a - b);
  for (const owner of owners) {
    const ownCities = raw.cities.filter(c => c.owner === owner);
    // Miasto-proxy stolicy: najludniejsze wlasne miasto (ZALOZENIE; prawdziwa stolica nie jest w raw).
    const proxy = [...ownCities].sort((a, b) => b.pop - a.pop || a.q - b.q || a.r - b.r)[0] || null;
    const cityHex = new Set(ownCities.map(c => c.q + ',' + c.r));
    const own = raw.units.filter(u => u.owner === owner);
    const field = own.filter(u => !cityHex.has(u.q + ',' + u.r));
    const groups = groupsOf(field, 4);
    const inProxy = proxy ? own.filter(u => u.q === proxy.q && u.r === proxy.r).length : 0;
    perOwner[owner] = {
      units: own.length,
      inCity: own.length - field.length,
      field: field.length,
      fieldGroups: groups.length,
      largestGroup: groups.reduce((m, g) => Math.max(m, g.length), 0),
      inProxyCapital: inProxy,
      cities: ownCities.length,
    };
  }
  return perOwner;
}

async function main() {
  await H.withSimBundle(async ({ bundleDir }) => {
    const browser = await H.launchBrowser();
    const out = [];
    try {
      const { page, context, pageErrors } = await H.openSimPage(browser, { bundleDir, testhook: true });
      await H.waitForHook(page);
      await page.evaluate(([v]) => window.__test.setFlag('armyConsolidation', v), [flagOn]);
      await H.startSimGame(page, { seed, aiCount, cityStates: 2, difficulty: 'normal', era: 'kamien', playerPassive: true });
      for (let t = 1; t <= turns; t++) {
        const t0 = Date.now();
        const metrics = await page.evaluate(([o]) => window.__test.runTurns(1, o), [{ autoResolveBattles: true, playerPolicy: 'pass' }]);
        const raw = await page.evaluate(() => window.__test.rawPositions());
        const last = metrics[metrics.length - 1] || {};
        const line = {
          seed, flag: flagOn ? 'on' : 'off', turn: raw.turn, wars: last.wars ?? null,
          turnMs: last.ms ?? (Date.now() - t0), hash: last.hash ?? null,
          pageErrors: pageErrors.length,
          owners: measureTurn(raw),
        };
        out.push(line);
        const txt = JSON.stringify(line);
        if (outFile) fs.appendFileSync(outFile, txt + '\n');
        console.log(txt.slice(0, 400));
        if (String(last.hash || '').startsWith('TIMEOUT')) break;
      }
      await context.close();
    } finally {
      await browser.close();
    }
  });
}

main().catch(e => { console.error('MEASURE_ERROR', e && e.stack || e); process.exit(1); });
