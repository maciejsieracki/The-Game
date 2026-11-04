'use strict';
/**
 * R-WEB-TEST-HOOK-SETCITYLIMIT-Q1 — bundle zywej gry POZA repo (esbuild; bez `npm run build`/vite) do testu Chromium.
 * Usage (z gra/): node tools/test-hook-setcitylimit-live-bundle.cjs <katalog-poza-repo>   -> <katalog>/Gra-LIVE.html
 * Wtyczka obsluguje tylko `?worker&inline` (genWorker); reszta jak w main.ts. Zero zmian w repo.
 */
const fs = require('node:fs');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esb = require(path.join(GRA, 'node_modules', 'esbuild'));
const out = process.argv[2];
if (!out || path.resolve(out).startsWith(path.resolve(GRA, '..'))) { console.error('Podaj katalog POZA repo'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const common = {
  bundle: true, absWorkingDir: GRA, logLevel: 'error',
  loader: { '.ts': 'ts', '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl', '.webp': 'dataurl', '.woff2': 'dataurl', '.mp3': 'dataurl', '.ogg': 'dataurl' },
  // import.meta.glob (audio/portrety/ikony brandu) -> pusty rekord: test nie potrzebuje assetow, tylko logiki gry.
  define: { 'import.meta.env': '{"DEV":false,"PROD":true,"MODE":"production","BASE_URL":"/"}', 'import.meta.glob': '__noGlob' },
};
const queryPlugin = {
  name: 'raw-url',
  setup(b) {
    b.onResolve({ filter: /\?(raw|url)$/ }, a => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?.*$/, '')), namespace: /\?raw$/.test(a.path) ? 'rawq' : 'urlq' }));
    b.onLoad({ filter: /.*/, namespace: 'rawq' }, a => ({ loader: 'text', contents: fs.readFileSync(a.path, 'utf8') }));
    b.onLoad({ filter: /.*/, namespace: 'urlq' }, a => ({ loader: 'dataurl', contents: fs.readFileSync(a.path) }));
  },
};
const workerPlugin = {
  name: 'worker-inline',
  setup(b) {
    b.onResolve({ filter: /\?worker(&inline)?$/ }, a => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?.*$/, '')), namespace: 'wk' }));
    b.onLoad({ filter: /.*/, namespace: 'wk' }, async a => {
      const r = await esb.build({ ...common, entryPoints: [a.path], format: 'iife', write: false, plugins: [queryPlugin] });
      return { loader: 'js', contents: `const code=${JSON.stringify(r.outputFiles[0].text)};export default function W(){return new Worker(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));}` };
    });
  },
};
esb.build({ ...common, entryPoints: [path.join(GRA, 'src/main.ts')], format: 'iife', banner: { js: 'var __noGlob=function(){return {};};' }, outfile: path.join(out, 'main.js'), plugins: [workerPlugin, queryPlugin] }).then(() => {
  fs.writeFileSync(path.join(out, 'Gra-LIVE.html'),
    '<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>LIVE</title>' +
    '<link rel="stylesheet" href="main.css"></head><body style="background:#1a1a2e"><div id="app"></div><script src="main.js"></script></body></html>');
  console.log('OK ' + path.join(out, 'Gra-LIVE.html'));
}).catch(e => { console.error('ERR', String(e).slice(0, 800)); process.exit(1); });
