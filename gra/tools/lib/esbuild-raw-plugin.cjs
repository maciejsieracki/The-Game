'use strict';
// Wspolny plugin esbuild dla harnessow testowych w gra/tools.
// 1) Vite obsluguje import `plik.css?raw` (np. src/ui/brandTokenVars.ts -> tokens.css?raw),
//    esbuild nie. Plugin zastepuje taki import pustym modulem `export default ""`;
//    src/ nie jest zmieniany, a testy nie czytaja tresci CSS.
// 2) Vite obsluguje `import.meta.glob(...)` (np. src/ui/icons/brandAssets.ts,
//    src/ui/leaderPortraits.ts, src/audio/filePlayer.ts). Po bundlowaniu do CJS
//    `import.meta` jest pustym obiektem, wiec wywolanie `.glob` rzuca TypeError.
//    Plugin zamienia wywolanie `import.meta.glob(` na `((..._a) => ({}))(` -- pusty
//    slownik modulow. Dotyczy wylacznie plikow zawierajacych ten tekst; src/ bez zmian.
// Uzycie w tescie:  plugins: [require('./lib/esbuild-raw-plugin.cjs'), { ... }]
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'raw-css-stub',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({ path: args.path, namespace: 'raw-css-stub' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-css-stub' }, () => ({ contents: 'export default "";', loader: 'js' }));
    build.onLoad({ filter: /\.(ts|tsx|js|mjs)$/ }, (args) => {
      const src = fs.readFileSync(args.path, 'utf8');
      if (!src.includes('import.meta.glob(')) return undefined;
      let loader = 'js';
      if (args.path.endsWith('.tsx')) loader = 'tsx';
      else if (args.path.endsWith('.ts')) loader = 'ts';
      return {
        contents: src.split('import.meta.glob(').join('((..._a) => ({}))('),
        loader,
        resolveDir: path.dirname(args.path),
      };
    });
  },
};
