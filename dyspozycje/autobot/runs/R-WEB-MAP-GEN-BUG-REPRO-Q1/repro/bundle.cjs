// Wspolny bundler: buduje CJS z gra/src do repro/ (nie zapisuje nic w gra/).
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
// Katalog gra/ wzgledem tego pliku: repro -> R-WEB-... -> runs -> autobot -> dyspozycje -> korzen repo (5x '..').
// Mozna nadpisac zmienna GRA_DIR (bezwzgledna sciezka do gra/ z node_modules).
const GRA = process.env.GRA_DIR || path.resolve(HERE, '..', '..', '..', '..', '..', 'gra');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
module.exports = function build(name, body) {
  const entry = path.join(HERE, '.entry-' + name + '.ts');
  const out = path.join(HERE, '.bundle-' + name + '.cjs');
  fs.writeFileSync(entry, body.split("'../src/").join("'" + GRA + "/src/"), 'utf8');
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: out, logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
  return require(out);
};
