// Wspolny bundler: buduje CJS z gra/src do repro/ (nie zapisuje nic w gra/).
const fs = require('fs');
const path = require('path');
const GRA = '/home/user/The-Game/.claude/worktrees/wf_ee19efe9-055-1/gra';
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const HERE = __dirname;
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
