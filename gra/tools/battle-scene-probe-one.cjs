'use strict';
// Pojedynczy przebieg sondy sceny: node tools/battle-scene-probe-one.cjs <instant|pomin|auto> [barb|player] [losowe|pewne] [fort]
const path = require('path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
(async () => {
  const s = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
  await s.listen();
  const b = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://127.0.0.1:${s.httpServer.address().port}/tools/battle-scene-probe-entry.html`);
  await p.waitForFunction(() => window.__probe?.ready === true);
  await p.evaluate((t) => { window.__probeTimeoutMs = t; }, Number(process.env.TMO || 40000));
  const r = await p.evaluate(c => window.__probe.run(c), { unit: 'Wojownik', atkOwner: process.argv[3] || 'barb', hit: process.argv[4] || 'pewne', fortDef: process.argv[5] === 'fort', path: process.argv[2], seed: 5, ...JSON.parse(process.env.CFG || '{}') });
  console.log(JSON.stringify(r));
  await b.close(); await s.close();
})();
