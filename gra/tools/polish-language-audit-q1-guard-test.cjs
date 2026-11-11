/**
 * polish-language-audit-q1-guard-test.cjs — strażnik poprawek R-WEB-POLISH-LANGUAGE-AUDIT-Q1.
 * Pilnuje, by naprawione frazy (zła -> dobra) nie wróciły w źródłach i w wikiBundle.json.
 * Uruchom: node gra/tools/polish-language-audit-q1-guard-test.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

const BAD = [
  [/\+1 kamien\/t/, 'kamien/t -> kamienia/t'],
  [/odblokowuje \*\*kamien\*\*/, 'kamien -> kamień'],
  [/Swiatynia/, 'Swiatynia -> Świątynia'],
  [/Wielki dzwón/, 'dzwón -> dzwon'],
  [/\+3 Zaufanie — wyrocznia/, 'Zaufanie -> Zaufania'],
  [/\+3 Pieniądz\/turę \(cywilizacja\)/, 'Pieniądz -> Pieniądza'],
  [/\+15% wzrost populacji/, 'wzrost -> wzrostu'],
  [/\+2 bazowe Zaufanie/, 'bazowe Zaufanie -> bazowego Zaufania'],
  [/Brama narodów/, 'Brama narodów -> Brama wszystkich narodów'],
];
const files = [
  ...walk('docs/encyklopedia').filter((f) => f.endsWith('.md')),
  'docs/PORADNIK-GRACZA/45-katalog-budynkow.md',
  'docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md',
  'gra/data/buildings.json', 'gra/data/wonders.json', 'gra/data/tech-cards-top5.json',
  'gra/tools/gen-tech-cards-top5.zdania.json', 'gra/src/data/wikiBundle.json',
  'dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv',
  'dyspozycje/analizy/karty-odkryc/narzedzia/techdata.py',
];
let pass = 0, fail = 0;
for (const f of files) {
  const t = rd(f);
  for (const [re, why] of BAD) {
    if (re.test(t)) { fail++; console.log('FAIL', f, why); } else pass++;
  }
}
console.log(`polish-language-audit-q1-guard: ${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
