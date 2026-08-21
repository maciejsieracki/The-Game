'use strict';
/**
 * tech-unlock-units-test.cjs — R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1
 * Run: cd gra && node tools/tech-unlock-units-test.cjs
 *
 * Kontekst: `techTreeView.ts` (hover-karta węzła) i `sciencePicker.ts` (tooltip
 * drzewka) czytały listę jednostek odblokowywanych przez technologię z
 * OSADZONEGO, przestarzałego tekstu `tech.json`'s pola „Odblokowuje budynek"
 * (segment „Jednostki: A, B, ..."), zamiast z `units.json`'s pola `Tech`
 * (jedyne poprawne, kompletne źródło — patrz `entityCards/technologyAdapter.ts:100`).
 * Naprawa wydzieliła wspólną logikę do `src/ui/techUnlockParse.ts`
 * (`parseUnlockBuildings` + `unitsUnlockedByTech`), używaną przez oba pliki.
 *
 * Ten test bunduje TYLKO `techUnlockParse.ts` (bez DOM-zależnych importów —
 * `techTreeView.ts`/`sciencePicker.ts` importują `icons/brandAssets.ts`, które
 * na poziomie modułu woła `import.meta.glob(...)` (konstrukcja Vite) — wybucha
 * przy esbuild-bundlowaniu do CJS/node, ten sam, już udokumentowany defekt
 * harnessu co w `building-tech-gate-test.cjs`/`technology-discovery-card-visual-test.cjs`).
 * [1] weryfikuje realną logikę modułu współdzielonego dla KILKU różnych
 * technologii (nie tylko Brązownictwa — Łucznictwo, Koło, Żegluga, Jeździectwo,
 * Hutnictwo żelaza, Oblężnictwo, Obróbka żelaza — wszystkie z osadzonym
 * segmentem „Jednostki:" w tech.json); [2] regexem przypina, że
 * `techTreeView.ts` i `sciencePicker.ts` faktycznie WOŁAJĄ `unitsUnlockedByTech`
 * (a nie z powrotem osadzony tekst) — chroni przed cichym cofnięciem naprawy.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch {
    console.error('[tech-unlock-units-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.tech-unlock-units-entry.ts');
const BUNDLE = path.resolve(__dirname, '.tech-unlock-units-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { parseUnlockBuildings, unitsUnlockedByTech, splitList } from '../src/ui/techUnlockParse';\n`,
  'utf8',
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[tech-unlock-units-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const P = require(BUNDLE);
const techRoot = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data', 'tech.json'), 'utf8'));
const techs = techRoot.technologie;
const units = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data', 'units.json'), 'utf8'));

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('PASS:', msg); }
  else { fail++; console.error('FAIL:', msg); }
}

console.log('tech-unlock-units-test (R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1)\n');

// --- [1] Techy z osadzonym segmentem "Jednostki:" w tech.json's "Odblokowuje budynek" ---
const techsWithEmbeddedUnits = techs.filter(t => /Jednostki:/i.test(t['Odblokowuje budynek'] ?? ''));
ok(techsWithEmbeddedUnits.length >= 5, `co najmniej 5 technologii z osadzonym „Jednostki:" (got=${techsWithEmbeddedUnits.length})`);

let anyDiscrepancy = false;
for (const t of techsWithEmbeddedUnits) {
  const name = t['Technologia'];
  const raw = t['Odblokowuje budynek'];
  const { budynki, jednostki: embeddedJednostki } = P.parseUnlockBuildings(raw);
  const realJednostki = P.unitsUnlockedByTech(name);
  const expectedReal = units.filter(u => u.Tech === name).map(u => u.Jednostka);

  ok(
    JSON.stringify([...realJednostki].sort()) === JSON.stringify([...expectedReal].sort()),
    `${name}: unitsUnlockedByTech() zwraca dokładnie units.json's Tech=${JSON.stringify(name)} (${realJednostki.length} jednostek)`,
  );
  ok(
    realJednostki.length >= embeddedJednostki.length,
    `${name}: real (units.json, ${realJednostki.length}) >= embedded osadzony tekst (${embeddedJednostki.length})`,
  );
  ok(
    !budynki.some(b => /^Jednostki:/i.test(b)),
    `${name}: budynki (po rozdzieleniu) NIE zawierają segmentu "Jednostki:" jako pozycji`,
  );
  if (realJednostki.length > embeddedJednostki.length) {
    anyDiscrepancy = true;
    console.log(`  (rozbieżność ${name}: embedded=${embeddedJednostki.length} vs real=${realJednostki.length})`);
  }
}
ok(anyDiscrepancy, 'przynajmniej jedna technologia poza Brązownictwem ma rozbieżność embedded < real (dowód, że problem nie jest odosobniony)');

// --- [1b] Brązownictwo dokładnie: 20 jednostek (nie 12 z osadzonego tekstu) ---
const bronzeReal = P.unitsUnlockedByTech('Brązownictwo');
ok(bronzeReal.length === 20, `Brązownictwo: unitsUnlockedByTech() = 20 jednostek (got=${bronzeReal.length})`);
ok(bronzeReal.includes('Strażnik bram Harappy'), 'Brązownictwo: zawiera "Strażnik bram Harappy" (brak w osadzonym tekście 12-elementowym)');
ok(bronzeReal.includes('Taran okuty'), 'Brązownictwo: zawiera "Taran okuty"');
const bronzeNode = techs.find(t => t['Technologia'] === 'Brązownictwo');
ok(bronzeNode !== undefined, 'Brązownictwo istnieje w tech.json');
if (bronzeNode) {
  const { budynki } = P.parseUnlockBuildings(bronzeNode['Odblokowuje budynek']);
  ok(
    budynki.length === 2 && budynki.includes('Odlewnia brązu') && budynki.includes('Kuźnia brązu'),
    `Brązownictwo: budynki (po odjęciu jednostek) = ["Odlewnia brązu","Kuźnia brązu"] (got=${JSON.stringify(budynki)})`,
  );
}

// --- [1c] Techy BEZ rozbieżności (Koło, Żegluga, Oblężnictwo, Obróbka żelaza) — jawnie sprawdzone ---
for (const name of ['Koło', 'Żegluga', 'Oblężnictwo', 'Obróbka żelaza']) {
  const t = techs.find(x => x['Technologia'] === name);
  if (!t) continue;
  const { jednostki: embedded } = P.parseUnlockBuildings(t['Odblokowuje budynek']);
  const real = P.unitsUnlockedByTech(name);
  ok(real.length === embedded.length, `${name}: real (${real.length}) == embedded (${embedded.length}) — dane bez rozbieżności, oba źródła zgodne dla tej technologii`);
}

// --- [2] Regexowe przypięcie: techTreeView.ts i sciencePicker.ts faktycznie wołają unitsUnlockedByTech ---
console.log('\n[2] Przypięcie w źródle: techTreeView.ts / sciencePicker.ts wołają unitsUnlockedByTech (nie z powrotem osadzony tekst)');
const ttvSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'ui', 'techTreeView.ts'), 'utf8');
const spSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'ui', 'sciencePicker.ts'), 'utf8');

ok(/unitsUnlockedByTech/.test(ttvSrc), 'techTreeView.ts importuje/woła unitsUnlockedByTech()');
ok(/const jednostki = unitsUnlockedByTech\(/.test(ttvSrc), 'techTreeView.ts: `jednostki` przypisane z unitsUnlockedByTech(), nie z parseUnlockBuildings()');
ok(/unitsUnlockedByTech/.test(spSrc), 'sciencePicker.ts importuje/woła unitsUnlockedByTech()');
ok(/odblokujeJednostki: unitsUnlockedByTech\(/.test(spSrc), 'sciencePicker.ts: TechNode.odblokujeJednostki przypisane z unitsUnlockedByTech()');
ok(/Odblokowuje jednostki:/.test(spSrc), 'sciencePicker.ts: tooltip ma sekcję "Odblokowuje jednostki:"');

// Zero zmian w tech.json i entityCards/technologyAdapter.ts (allowlista dyspozycji).
const { execSync } = require('child_process');
try {
  const diffStat = execSync('git diff --stat HEAD -- data/tech.json src/ui/entityCards/technologyAdapter.ts', { cwd: GRA_ROOT, encoding: 'utf8' });
  ok(diffStat.trim() === '', `zero zmian w data/tech.json i entityCards/technologyAdapter.ts wg git diff (got=${JSON.stringify(diffStat.trim())})`);
} catch (e) {
  console.warn('[tech-unlock-units-test] git diff check pominięty:', e.message || e);
}

console.log(`\ntech-unlock-units-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
