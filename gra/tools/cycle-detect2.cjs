'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'src');
const re = /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  let base = path.resolve(path.dirname(fromFile), spec);
  for (const ext of ['', '.ts', '.tsx', '/index.ts']) {
    const cand = base + ext;
    if (fs.existsSync(cand)) return path.normalize(cand);
  }
  return null;
}

function fileImports(f) {
  const txt = fs.readFileSync(f, 'utf8');
  const out = [];
  let m;
  while ((m = re.exec(txt))) {
    const r = resolveImport(f, m[1]);
    if (r) out.push(r);
  }
  return out;
}

const graph = {};
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.tsx?$/.test(ent.name)) graph[path.normalize(p)] = fileImports(p);
  }
}
walk(root);

const pairs = new Set();
for (const [a, deps] of Object.entries(graph)) {
  for (const b of deps) {
    if (!graph[b]) continue;
    if (graph[b].includes(a) && a !== b) {
      const relA = path.relative(root, a).replace(/\\/g, '/');
      const relB = path.relative(root, b).replace(/\\/g, '/');
      const key = [relA, relB].sort().join(' <> ');
      pairs.add(key);
    }
  }
}
console.log('Mutual import pairs:', pairs.size);
for (const k of [...pairs].sort()) console.log(' ', k);
