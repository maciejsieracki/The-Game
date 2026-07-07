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

const cycles = [];
const seen = new Set();
function dfs(node, stack) {
  const key = stack.join('|') + '>' + node;
  if (seen.has(key)) return;
  seen.add(key);
  if (stack.includes(node)) {
    cycles.push([...stack.slice(stack.indexOf(node)), node]);
    return;
  }
  if (stack.length > 14) return;
  for (const n of graph[node] || []) {
    if (!graph[n]) continue;
    dfs(n, [...stack, node]);
  }
}
for (const k of Object.keys(graph)) dfs(k, [k]);

const uniq = new Map();
for (const c of cycles) {
  const min = c.slice(0, -1);
  const start = min.indexOf(Math.min(...min.map((_, i) => min[i])));
  const norm = [...min.slice(start), min[0], c[c.length - 1]].map((p) => path.relative(root, p)).join(' -> ');
  uniq.set(norm, c);
}
console.log('Cycles found:', uniq.size);
for (const k of [...uniq.keys()].sort()) console.log(k);
