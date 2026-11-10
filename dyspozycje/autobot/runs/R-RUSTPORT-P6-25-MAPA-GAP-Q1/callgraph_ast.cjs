// Domkniecie przechodnie identyfikatorow po deklaracjach top-level plikow gra/src/map/*.ts (AST TypeScript).
// Zastepuje regexowy callgraph_clusters.py (RUNDA-2, zarzut 2: regex gubil stale uzywane tylko w treści `const`/`type` oraz
// deklaracje z innych plikow map/, np. CLUSTER_CITY_STATE_MIN_HEX i MIN_DIST_START_CITY_STATE).
// Uzycie: node callgraph_ast.cjs <typescript.js> <katalog_map> <korzen[,korzen...]> [<tytul>]
// korzen = "plik.ts:nazwa". Wyjscie:
//   == <tytul>: <N> deklaracji, <M> LOC niepustych (a po plikach: "-- plik: n decl, m LOC")
//     <plik>:<start>-<koniec>\t<nazwa>\t<LOC niepuste>
// Przyblizenie: nazwa lokalna zasłaniajaca nazwe top-level moze dolaczyc nadmiarowa deklaracje (nadmiar bezpieczny).
const tsPath = process.argv[2];
const dir = process.argv[3];
const roots = process.argv[4].split(',');
const title = process.argv[5] || 'closure';
const ts = require(tsPath);
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(dir).filter((f) => /\.ts$/.test(f)).sort();
const decls = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const st of sf.statements) {
    const names = [];
    if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isEnumDeclaration(st)) {
      if (st.name) names.push(st.name.text);
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) names.push(d.name.text);
    }
    if (!names.length) continue;
    const start = sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1;
    const end = sf.getLineAndCharacterOfPosition(st.getEnd()).line + 1;
    const loc = st.getText(sf).split('\n').filter((l) => l.trim() !== '').length;
    for (const n of names) decls.set(f + ':' + n, { file: f, name: n, node: st, sf, start, end, loc });
  }
}
const byName = new Map();
for (const [k, d] of decls) {
  if (!byName.has(d.name)) byName.set(d.name, []);
  byName.get(d.name).push(k);
}
function idsIn(node) {
  const out = new Set();
  const visit = (n) => {
    if (ts.isIdentifier(n)) {
      const p = n.parent;
      const skip = p && ((ts.isPropertyAccessExpression(p) && p.name === n) || (ts.isPropertyAssignment(p) && p.name === n) ||
        (ts.isPropertySignature(p) && p.name === n) || (ts.isParameter(p) && p.name === n));
      if (!skip) out.add(n.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}
const seen = new Set();
const unresolved = [];
const queue = roots.slice();
while (queue.length) {
  const key = queue.shift();
  if (seen.has(key)) continue;
  seen.add(key);
  const d = decls.get(key);
  if (!d) { unresolved.push(key); continue; }
  for (const id of idsIn(d.node)) {
    const cands = byName.get(id);
    if (!cands) continue;
    const same = cands.filter((k) => decls.get(k).file === d.file);
    for (const k of same.length ? same : cands) if (!seen.has(k)) queue.push(k);
  }
}
const res = [...seen].filter((k) => decls.has(k)).map((k) => decls.get(k));
// deklaracje wielonazwowe (const a=..., b=...) licz raz
const uniq = new Map();
for (const r of res) uniq.set(r.file + ':' + r.start + ':' + r.end + ':' + r.name, r);
const list = [...uniq.values()].sort((a, b) => a.file.localeCompare(b.file) || a.start - b.start);
const byFile = new Map();
for (const r of list) {
  if (!byFile.has(r.file)) byFile.set(r.file, []);
  byFile.get(r.file).push(r);
}
const tot = list.reduce((s, r) => s + r.loc, 0);
console.log(`== ${title}: ${list.length} deklaracji, ${tot} LOC niepustych`);
for (const [f, arr] of byFile) {
  console.log(`-- ${f}: ${arr.length} deklaracji, ${arr.reduce((s, r) => s + r.loc, 0)} LOC`);
  for (const r of arr) console.log(`  ${f}:${r.start}-${r.end}\t${r.name}\t${r.loc}`);
}
console.log(`UNRESOLVED\t${unresolved.length ? unresolved.join(',') : '(brak)'}`);
