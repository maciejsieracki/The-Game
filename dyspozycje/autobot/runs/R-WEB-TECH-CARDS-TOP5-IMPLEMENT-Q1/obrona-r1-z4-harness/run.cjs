const path = require('path');
const GRA = process.argv[2];
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
(async () => {
  const STUB = path.join(GRA, 'tools', '.stubs');
  const r = await esbuild.build({
    entryPoints: [path.join(__dirname, 'entry.ts')], bundle: true, write: false, format: 'iife',
    loader: { '.json': 'json', '.svg': 'text', '.png': 'dataurl' }, logLevel: 'error',
    nodePaths: [path.join(GRA, 'node_modules')],
    plugins: [{ name: 's', setup(b) {
      b.onResolve({ filter: /^GRA\// }, (a) => ({ path: path.join(GRA, a.path.slice(4)) + '.ts' }));
      b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: path.join(STUB, 'entity-card-contract-brandAssets-stub.ts') }));
      b.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: path.join(STUB, 'entity-card-contract-scienceOwlIcon-stub.ts') }));
      b.onResolve({ filter: /entityCards\/renderer$/ }, (a) => (a.importer.endsWith('techDiscoveryNotice.ts') ? { path: path.join(__dirname, 'renderer-stub.ts') } : undefined));
    } }],
  });
  let br;
  try { br = await chromium.launch({ headless: true }); }
  catch (e) { br = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }); }
  const p = await br.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.setContent('<html><body></body></html>');
  await p.addScriptTag({ content: r.outputFiles[0].text });
  const cases = { 'Filozofia': ['Teatr'], 'Obróbka żelaza': ['Wielka odlewnia', 'Wielka Kuźnia'], 'Medycyna': ['Lazaret'], 'Astronomia': ['Obserwatorium'], 'Waluta': [] };
  let fail = 0; let pass = 0;
  for (const [t, dead] of Object.entries(cases)) {
    const txt = await p.evaluate((n) => { window.__show(n); const h = document.querySelector('.tdn-card'); return h ? h.textContent : ''; }, t);
    if (!txt) { fail++; console.log('FAIL brak karty fallback', t); continue; }
    pass++;
    for (const d of dead) { if (txt.includes(d)) { fail++; console.log('FAIL', t, 'zawiera', d); } else pass++; }
    console.log(t, '| tdn-card len', txt.length, '| Top 5:', txt.includes('Top 5 korzyści'), '| Mennica:', txt.includes('Mennica'));
  }
  console.log('pageerrors', errs.length ? errs.slice(0, 2) : 0);
  console.log(`Z4-harness ${pass} pass, ${fail} fail`);
  await br.close();
})();
