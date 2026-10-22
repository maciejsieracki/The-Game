// Zakresy linii (AST TypeScript) wszystkich instrukcji top-level plikow gra/src/map/*.ts, poza `import`.
// Uzycie: node decl_spans.cjs <typescript.js> <katalog_map> > decl-spans.tsv
// Kolumny: plik, start (pierwsza linia instrukcji, bez JSDoc), end, doc_start (pierwsza linia ciaglego bloku komentarzy
// tuz nad instrukcja albo = start), rodzaj, nazwy (po przecinku).
// Uzywane przez build_gap.py do (a) LOC deklaracji, (b) wlasnosci linii przez tematy backlogu (zakresy bez nakladania).
const ts = require(process.argv[2]);
const fs = require('fs');
const path = require('path');
const dir = process.argv[3];
console.log(['plik', 'start', 'end', 'doc_start', 'rodzaj', 'nazwy'].join('\t'));
for (const f of fs.readdirSync(dir).filter((x) => /\.ts$/.test(x)).sort()) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = src.split('\n');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) || ts.isImportEqualsDeclaration(st)) continue;
    const start = sf.getLineAndCharacterOfPosition(st.getStart(sf)).line + 1;
    const end = sf.getLineAndCharacterOfPosition(st.getEnd()).line + 1;
    let ds = start;
    while (ds > 1) {
      const t = lines[ds - 2].trim();
      if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) ds--;
      else break;
    }
    let names = [];
    if (ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isEnumDeclaration(st)) {
      if (st.name) names.push(st.name.text);
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) names.push(d.name.getText(sf));
    } else if (ts.isExportDeclaration(st)) {
      if (st.exportClause && ts.isNamedExports(st.exportClause)) for (const e of st.exportClause.elements) names.push(e.name.text);
      else names.push('*');
    }
    console.log([f, start, end, ds, ts.SyntaxKind[st.kind], names.length ? names.join(',') : '-'].join('\t'));
  }
}
