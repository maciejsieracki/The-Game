'use strict';
// Wspolny plugin esbuild dla harnessow testowych w gra/tools.
// Vite obsluguje import `plik.css?raw` (np. src/ui/brandTokenVars.ts -> tokens.css?raw),
// esbuild nie. Plugin zastepuje taki import pustym modulem `export default ""`;
// src/ nie jest zmieniany, a testy nie czytaja tresci CSS.
// Uzycie w tescie:  plugins: [require('./lib/esbuild-raw-plugin.cjs'), { ... }]
module.exports = {
  name: 'raw-css-stub',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({ path: args.path, namespace: 'raw-css-stub' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-css-stub' }, () => ({ contents: 'export default "";', loader: 'js' }));
  },
};
