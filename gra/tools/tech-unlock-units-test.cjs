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
 *
 * [3] (P-TEST-TECH-UNLOCK-UNITS-TRIPWIRE-PRZEPROJEKTOWAC-Q1) bunduje i FAKTYCZNIE
 * WYKONUJE `entityCards/technologyAdapter.ts` (prawdziwy kod produkcyjny karty
 * technologii, nie kopię logiki), z dwoma nieszkodliwymi zaślepkami esbuild na
 * moduły Vite-only nieużywane przez sekcję „Jednostki" (`icons/brandAssets` —
 * `import.meta.glob`/`?raw`; `sciencePicker` — łańcuch DOM-zależny), i sprawdza
 * SEMANTYKĘ sekcji „Jednostki" (dane/liczba/linkowanie) zamiast — jak poprzednio —
 * mechanicznego tripwire'u `git diff --stat` blokującego KAŻDĄ, nawet w pełni
 * poprawną edycję `technologyAdapter.ts` (Final Control tematu
 * P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1, commit `e5ecf4b6`).
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

// --- [3] SEMANTYKA sekcji „Jednostki" karty technologii (entityCards/technologyAdapter.ts) ---
// P-TEST-TECH-UNLOCK-UNITS-TRIPWIRE-PRZEPROJEKTOWAC-Q1: usunięty tu mechaniczny tripwire
// (`git diff --stat HEAD -- .../technologyAdapter.ts`), który blokował na czerwono KAŻDĄ,
// nawet w pełni poprawną edycję tego pliku (potwierdzone przez Final Control tematu
// P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1, commit e5ecf4b6 — legalne usunięcie
// `UNIT_PREVIEW`/paginacji). W jego miejsce: RZECZYWISTE wykonanie prawdziwego
// `technologyAdapter()` (nie regex, nie kopia logiki) i asercje o TREŚCI wynikowej sekcji
// „Jednostki" — dane, liczba, linkowanie. To wykrywa regresję w logice odblokowania (np.
// odwrócony warunek filtra `u.Tech === tech['Technologia']`), a NIE reaguje na dowolną inną,
// niezwiązaną edycję pliku (np. zmianę komentarza, reformatowanie, dodanie nowej sekcji).
//
// `technologyAdapter.ts` normalnie importuje `icons/brandAssets.ts`, które na poziomie
// modułu woła `import.meta.glob(...)` (konstrukcja Vite, wybucha przy esbuild→CJS/node —
// ten sam, już udokumentowany defekt harnessu, patrz nagłówek pliku) oraz (przez
// `entityCards/registry.ts` → `../sciencePicker`) długi łańcuch modułów DOM-zależnych.
// Żaden z tych dwóch modułów NIE wpływa na sekcję „Jednostki" (tylko na ikony/linki
// technologii) — podmieniamy je tu WYŁĄCZNIE na nieszkodliwe zaślepki przez plugin
// esbuild (tylko w tym pliku testowym, zero zmian w `gra/src/**`), żeby uruchomić
// prawdziwy, produkcyjny kod `technologyAdapter()` w node.
console.log('\n[3] Semantyka: technologyAdapter() — sekcja „Jednostki" (rzeczywiste wykonanie produkcyjnego kodu)');

const ADAPTER_ENTRY = path.resolve(__dirname, '.tech-unlock-adapter-entry.ts');
const ADAPTER_BUNDLE = path.resolve(__dirname, '.tech-unlock-adapter-bundle.cjs');
fs.writeFileSync(
  ADAPTER_ENTRY,
  `export { technologyAdapter } from '../src/ui/entityCards/technologyAdapter';\n`,
  'utf8',
);

const stubViteOnlyDeps = {
  name: 'stub-vite-only-deps',
  setup(build) {
    // `.../icons/brandAssets` (import.meta.glob + `?raw` — Vite-only). Sekcja „Jednostki"
    // używa stąd tylko `unitIconSvg(def, id)` — wynik idzie do `EntityCardRow.icon`, poza
    // zakresem asercji niżej (te sprawdzają `label`/`linkTo`, nie SVG ikon).
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'stub:brandAssets', namespace: 'stub' }));
    build.onLoad({ filter: /^stub:brandAssets$/, namespace: 'stub' }, () => ({
      contents: `
        export function buildingIconSvg() { return ''; }
        export function unitIconSvg() { return ''; }
        export function improvementIconSvg() { return ''; }
      `,
      loader: 'js',
    }));
    // `../sciencePicker` (przez `entityCards/registry.ts`) — łańcuch DOM-zależny
    // (scienceHubHud/techDiscoveryNotice/CSS `?raw`/`import.meta.glob`), NIEUŻYWANY przez
    // sekcję „Jednostki" (`resolveUnitRow`/`unitToSlug` w registry.ts są niezależne, patrz
    // `entityCards/slug.ts` — zero importu sciencePicker). Realny `techToSlug`/
    // `techNameFromSlug` dotyczy WYŁĄCZNIE technologii/linków, poza zakresem tego testu.
    build.onResolve({ filter: /\/sciencePicker$/ }, () => ({ path: 'stub:sciencePicker', namespace: 'stub' }));
    build.onLoad({ filter: /^stub:sciencePicker$/, namespace: 'stub' }, () => ({
      contents: `
        export function techToSlug(n) { return String(n ?? '').trim(); }
        export function techNameFromSlug(s) { return s ?? null; }
      `,
      loader: 'js',
    }));
  },
};

// esbuild plugins wymagają asynchronicznego `build()` (buildSync nie wspiera pluginów)
// — reszta tego pliku jest synchroniczna, więc IIFE tylko dla tego jednego bundlowania.
(async () => {

let AdapterModule = null;
try {
  await esbuild.build({
    entryPoints: [ADAPTER_ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: ADAPTER_BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
    plugins: [stubViteOnlyDeps],
  });
  delete require.cache[ADAPTER_BUNDLE];
  AdapterModule = require(ADAPTER_BUNDLE);
} catch (e) {
  console.error('[tech-unlock-units-test] bundlowanie technologyAdapter.ts nie powiodło się:', e.message || e);
}

ok(typeof AdapterModule?.technologyAdapter === 'function', 'technologyAdapter.ts bunduje się i eksportuje technologyAdapter() (realny kod produkcyjny)');

if (typeof AdapterModule?.technologyAdapter === 'function') {
  const adapter = AdapterModule.technologyAdapter;
  // Kilka różnych technologii (nie tylko Brązownictwo) — spójnie z resztą tego pliku.
  const sampleTechNames = ['Brązownictwo', 'Łucznictwo', 'Koło', 'Żegluga', 'Jeździectwo'];
  for (const name of sampleTechNames) {
    const techRow = techs.find((t) => t['Technologia'] === name);
    if (!techRow) continue;
    const card = adapter(techRow);
    const unitsSection = card.sections.find((s) => s.key === 'units');
    const expectedUnits = units.filter((u) => u.Tech === name).map((u) => u.Jednostka);

    ok(unitsSection !== undefined, `${name}: karta ma sekcję 'units'`);
    const gotLabels = (unitsSection?.rows ?? []).map((r) => r.label);
    ok(
      JSON.stringify([...gotLabels].sort()) === JSON.stringify([...expectedUnits].sort()),
      `${name}: sekcja „Jednostki" karty = dokładnie jednostki z units.json's Tech=${JSON.stringify(name)} (${gotLabels.length} vs oczekiwane ${expectedUnits.length})`,
    );
    // Tytuł sekcji nietknięty — regres tytułu jest tak samo widoczny dla gracza jak zła treść.
    ok(unitsSection?.title === 'Jednostki', `${name}: tytuł sekcji = "Jednostki" (got=${JSON.stringify(unitsSection?.title)})`);
    // Linkowanie: każda jednostka, którą `resolveUnitRow` potrafi rozwiązać po slugu,
    // MUSI dostać `linkTo` typu 'unit' na ten sam slug — inaczej klik w kartę jest martwy
    // (P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1, cytowany w nagłówku technologyAdapter.ts).
    for (const row of unitsSection?.rows ?? []) {
      ok(
        row.linkTo === undefined || (row.linkTo.kind === 'unit' && typeof row.linkTo.id === 'string' && row.linkTo.id !== ''),
        `${name}: wiersz „${row.label}" — linkTo albo brak, albo poprawny kind='unit' z niepustym id (got=${JSON.stringify(row.linkTo)})`,
      );
      ok(row.linkAnchor === 'label', `${name}: wiersz „${row.label}" — linkAnchor='label' (przycisk to nazwa jednostki)`);
    }
  }
  // Brązownictwo dokładnie 20 (spójnie z [1b] wyżej, ale teraz przez realny adapter, nie
  // przez techUnlockParse.ts) — dowód, że karta pokazuje WSZYSTKIE jednostki bez limitu.
  const bronzeCard = adapter(techs.find((t) => t['Technologia'] === 'Brązownictwo'));
  const bronzeUnitsSection = bronzeCard.sections.find((s) => s.key === 'units');
  ok(bronzeUnitsSection?.rows?.length === 20, `Brązownictwo: karta pokazuje 20 jednostek bez paginacji/limitu (got=${bronzeUnitsSection?.rows?.length})`);
}

console.log(`\ntech-unlock-units-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);

})();
