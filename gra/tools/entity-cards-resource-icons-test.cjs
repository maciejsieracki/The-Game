'use strict';
/**
 * entity-cards-resource-icons-test.cjs
 *
 * TEMAT: R-WEB-UI-RESOURCE-ICONS-ENTITYCARDS-Q1 (decyzja właściciela: ikony surowców wszędzie).
 *
 * Wiersze kart encji (budynki, ulepszenia terenu, jednostki, technologie, cuda) z kosztem /
 * utrzymaniem / wymaganiem surowców niosą surowce jako DANE (`EntityCardRow.resources`),
 * a wspólny renderer rysuje z nich chipy „liczba + ikona". Ten test pilnuje kontraktu na
 * wyjściu WSZYSTKICH adapterów, dla WSZYSTKICH encji z danych:
 *
 *  A. Zero gołych nazw surowców (STOCK_RESOURCE_LABEL + resources.json) w `value`,
 *     `resourcesSuffix` ani `label` wierszy surowcowych (lista etykiet niżej) ani w żadnym
 *     wierszu, który niesie `resources`.
 *  B. Każdy surowiec z danych (units.json Surowiec/Utrzymanie surowiec, tech.json
 *     „Dostęp do surowca.” / „Odblokowuje surowiec.”, terrain-improvements.json
 *     surowiecOdblokowany, buildings.json koszt_surowce) rozwiązuje się do id z ikoną
 *     (`resourceIdFromName`), a chip ma realną ikonę SVG (nie fallback tekstowy).
 *  C. Pokrycie: każdy rodzaj karty (jednostka/budynek/ulepszenie/technologia) ma co najmniej
 *     jeden wiersz `resources`; żaden wiersz `resources` nie ma pustego `id`.
 *  D. Kontrakt bezpieczeństwa: kwoty (`amount`) nie są HTML-em — chip escapuje `<`/`&`
 *     (`escapeHtmlText`), więc wartość z danych nie może wstrzyknąć znacznika.
 *
 * Realny render w Chromium: tools/entity-cards-resource-icons-real-render-test.cjs.
 * Uruchomienie (z gra/): node tools/entity-cards-resource-icons-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.entity-cards-resource-icons-entry.ts');
const BUNDLE = path.resolve(__dirname, '.entity-cards-resource-icons-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function listSvgs(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) listSvgs(file, prefix + entry.name + '/', out);
    else if (entry.name.endsWith('.svg')) out[prefix + entry.name] = fs.readFileSync(file, 'utf8');
  }
  return out;
}

// Adaptery Vite (?raw, import.meta.glob) — prawdziwe SVG z repo, bez zmian źródeł.
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'),
      loader: 'text',
    }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      const expected = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
      if (path.resolve(args.path) !== expected) return null;
      const source = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(path.resolve(GRA, 'src', 'ui', 'icons', 'brand'), './brand/', {})),
      );
      return { contents: source, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const source = fs.readFileSync(args.path, 'utf8');
      if (!source.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + source.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

// Etykiety wierszy, które z definicji niosą surowce (kontrakt kart encji).
const RESOURCE_ROW_LABELS = new Set([
  'Koszt surowca', 'Utrzymanie surowca/turę', 'Surowce (jednorazowo)', 'Co turę',
  'Odblokowuje surowiec', 'Produkcja surowca', 'Dostęp do surowca', 'Surowiec (wymóg badania)',
]);

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));

async function main() {
  fs.writeFileSync(ENTRY, [
    "export { resolveUnitRow, resolveBuildingRow, resolveImprovementRow, resolveTechnologyRow, resolveWonderRow, unitToSlug, technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
    "export { unitAdapter } from '../src/ui/entityCards/unitAdapter.ts';",
    "export { buildingAdapter } from '../src/ui/entityCards/buildingAdapter.ts';",
    "export { improvementAdapter } from '../src/ui/entityCards/improvementAdapter.ts';",
    "export { technologyAdapter } from '../src/ui/entityCards/technologyAdapter.ts';",
    "export { wonderAdapter } from '../src/ui/entityCards/wonderAdapter.ts';",
    "export { resourceIdFromName, resourcesFromList } from '../src/ui/entityCards/resourceRows.ts';",
    "export { resourceAmountChipHtml, escapeHtmlText } from '../src/ui/resourceAmountChip.ts';",
    "export { STOCK_RESOURCE_LABEL, stockResourceLabel } from '../src/game/building-stock-cost.ts';",
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: [viteCompatPlugin], logLevel: 'silent',
  });
  delete require.cache[BUNDLE];
  const M = require(BUNDLE);

  // --- Zbiór nazw surowców z ikoną (do wykrywania „gołych nazw") ---------------------------------
  const names = new Set(Object.values(M.STOCK_RESOURCE_LABEL).map((s) => s.replace(/\s*\(surowiec\)/, '')));
  for (const r of readJson('resources.json')) if (r.Surowiec) names.add(r.Surowiec);
  names.delete('Żywność'); // strumień plonów (wiersze „Żywność"/„Plony"), nie pozycja kosztów/wymagań
  const nameRes = [...names].map((n) => new RegExp('(^|[^\\p{L}])' + n.toLocaleLowerCase('pl') + '($|[^\\p{L}])', 'u'));
  const hasBareName = (txt) => {
    const low = String(txt || '').toLocaleLowerCase('pl');
    return nameRes.some((re) => re.test(low));
  };
  check('fixture: zbiór nazw surowców ma co najmniej 12 pozycji', names.size >= 12, [...names]);

  // --- Zebranie wszystkich kart z danych ----------------------------------------------------------
  const cards = []; // { kind, id, card }
  const unitsJson = readJson('units.json');
  const unitRows = Array.isArray(unitsJson) ? unitsJson : (unitsJson.jednostki || Object.values(unitsJson).find(Array.isArray) || []);
  for (const u of unitRows) {
    const name = u['Jednostka'] || u['Nazwa'] || u['nazwa'];
    if (!name) continue;
    const row = M.resolveUnitRow(M.unitToSlug(name));
    if (row) cards.push({ kind: 'unit', id: name, card: M.unitAdapter(row, {}) });
  }
  for (const b of readJson('buildings.json')) {
    const row = M.resolveBuildingRow(b.id);
    if (row) cards.push({ kind: 'building', id: b.id, card: M.buildingAdapter(row, {}) });
  }
  const impJson = readJson('terrain-improvements.json');
  for (const [k, v] of Object.entries(impJson)) {
    if (!v || typeof v !== 'object' || !v.nazwa) continue;
    cards.push({ kind: 'improvement', id: k, card: M.improvementAdapter(v, {}) });
  }
  const techJson = readJson('tech.json');
  const techRows = techJson.technologie || [];
  for (const t of techRows) {
    const row = M.resolveTechnologyRow(M.technologyIdFromName(t.Technologia));
    if (row) cards.push({ kind: 'technology', id: t.Technologia, card: M.technologyAdapter(row, {}) });
  }
  for (const w of readJson('wonders.json').cuda || []) {
    const row = M.resolveWonderRow(w.id);
    if (row) cards.push({ kind: 'wonder', id: w.id, card: M.wonderAdapter(row, {}) });
  }
  const perKind = {};
  for (const c of cards) perKind[c.kind] = (perKind[c.kind] || 0) + 1;
  console.log('karty:', JSON.stringify(perKind));
  for (const kind of ['unit', 'building', 'improvement', 'technology', 'wonder']) {
    check(`fixture: zbudowano karty rodzaju "${kind}" (>0)`, (perKind[kind] || 0) > 0, perKind);
  }

  // --- A. zero gołych nazw w wierszach surowcowych ------------------------------------------------
  const offenders = [];
  const resourceRowsPerKind = {};
  let emptyIds = 0;
  let chipRows = 0;
  let proseChipRows = 0;
  let exemptCount = 0;
  // Wyjątki (jawne): opisy/proza narracyjna i epoka — to tekst opowieści, nie koszt/wymóg surowca;
  // karty cudów — bonusy plonów („+2 Praca, +2 Drewno" = oś plonów, osobny adapter, decyzja
  // udokumentowana w 30-obrona-claude.md, zarzut 4).
  const isExempt = (kind, section, row) => {
    if (kind === 'wonder') return true;
    if (section.layout === 'prose' || section.layout === 'top3') return true;
    if (/^(opis|top 3|rys historyczny|historia|ciekawostka|ciekawostki)$/i.test(section.title || '')) return true;
    // „Epoka wejścia: Kamień/Brąz/Żelazo" to nazwa epoki (Epoka Kamienia…), nie surowiec.
    if (/^Epoka/.test(row.label) || row.label === 'Nazwa') return true;
    return false;
  };
  for (const { kind, id, card } of cards) {
    for (const section of card.sections || []) {
      for (const row of section.rows || []) {
        // ZAKRES PEŁNY (obrona r1, zarzuty 1-3): KAŻDY wiersz każdej karty jest sprawdzany; wyjątki
        // tylko jawne, z powodem (EXEMPT_*). Dawny filtr RESOURCE_ROW_LABELS był ślepy na wiersze
        // „Odblokowuje"/„Warunek"/„Dodatkowe warunki".
        const exempt = isExempt(kind, section, row);
        if (exempt) { exemptCount++; continue; }
        if (row.resources && row.resources.length > 0) {
          chipRows++;
          resourceRowsPerKind[kind] = (resourceRowsPerKind[kind] || 0) + 1;
          for (const r of row.resources) if (!r.id) emptyIds++;
        }
        if (row.valueParts && row.valueParts.length > 0) {
          proseChipRows++;
          if (process.env.DUMP_PARTS) console.log('PARTS', kind, id, '|', row.label, '|', JSON.stringify(row.valueParts));
          for (const p of row.valueParts) {
            if (typeof p === 'string') {
              if (hasBareName(p)) offenders.push({ kind, id, section: section.key, label: row.label, field: 'valueParts', text: p });
            } else if (!p.id) emptyIds++;
          }
        } else if (hasBareName(row.value)) {
          offenders.push({ kind, id, section: section.key, label: row.label, field: 'value', text: row.value });
        }
        if (hasBareName(row.resourcesSuffix)) {
          offenders.push({ kind, id, section: section.key, label: row.label, field: 'resourcesSuffix', text: row.resourcesSuffix });
        }
        if (row.resources && row.resources.length > 0 && hasBareName(row.label)) {
          offenders.push({ kind, id, section: section.key, label: row.label, field: 'label', text: row.label });
        }
      }
    }
  }
  check('A: ZERO gołych nazw surowców w value/resourcesSuffix/label wierszy surowcowych (wszystkie karty z danych)',
    offenders.length === 0, offenders.slice(0, 80));
  check('A2: liczba wierszy z chipami surowców > 0', chipRows > 0, chipRows);
  console.log('wiersze z resources wg rodzaju:', JSON.stringify(resourceRowsPerKind), 'razem', chipRows);

  // --- C. pokrycie rodzajów -----------------------------------------------------------------------
  for (const kind of ['unit', 'building', 'improvement', 'technology']) {
    check(`C: rodzaj "${kind}" ma co najmniej jeden wiersz z chipami surowców`, (resourceRowsPerKind[kind] || 0) > 0, resourceRowsPerKind);
  }
  check('C: żaden wiersz resources nie ma pustego id', emptyIds === 0, emptyIds);

  // --- B. każdy surowiec z danych ma id i realną ikonę -------------------------------------------
  const tokens = new Set();
  for (const u of unitRows) {
    for (const f of ['Surowiec', 'Utrzymanie surowiec']) if (u[f]) tokens.add(String(u[f]));
  }
  for (const t of techRows) {
    for (const f of ['Dostęp do surowca.', 'Odblokowuje surowiec.']) if (t[f]) String(t[f]).split(/\s*[,;]\s*/).forEach((x) => x && tokens.add(x));
  }
  for (const v of Object.values(impJson)) if (v && v.surowiecOdblokowany) String(v.surowiecOdblokowany).split(/\s*[,;]\s*/).forEach((x) => x && tokens.add(x));
  const unresolved = [...tokens].filter((t) => !M.resourceIdFromName(t));
  // „handel” w „Dostęp do surowca.” to strumień handlu (nie surowiec magazynu) — zostaje tekstem.
  const NON_RESOURCE_TOKENS = new Set(['handel']);
  check('B: każdy surowiec z units/tech/ulepszeń z danych rozwiązuje się do id z ikoną (poza „handel")',
    unresolved.every((t) => NON_RESOURCE_TOKENS.has(t.toLowerCase())), unresolved);
  const ids = new Set();
  for (const t of tokens) { const id = M.resourceIdFromName(t); if (id) ids.add(id); }
  for (const b of readJson('buildings.json')) for (const k of Object.keys(b.koszt_surowce || {})) ids.add(k);
  for (const k of Object.keys(M.STOCK_RESOURCE_LABEL)) ids.add(k);
  const noIcon = [...ids].filter((id) => {
    const html = M.resourceAmountChipHtml(id, '5');
    return html.includes('bld-res-chip-ic--text') || !html.includes('<svg');
  });
  check(`B: chip każdego surowca (${ids.size} id) ma realną ikonę SVG, nie fallback tekstowy`, noIcon.length === 0, noIcon);
  const sample = M.resourceAmountChipHtml('drewno', '5');
  check('B: nazwa surowca jest w title i aria-label ikony, a nie w widocznym tekście chipa',
    /title="Drewno"/.test(sample) && /aria-label="Drewno"/.test(sample) && !/>\s*Drewno\s*</.test(sample), sample.slice(0, 200));

  // --- Przykłady z realnych danych (jawne, niezależne od pętli wyżej) -------------------------------
  const find = (kind, id) => (cards.find((c) => c.kind === kind && c.id === id) || {}).card;
  const rowOf = (card, label) => {
    for (const s of (card && card.sections) || []) for (const r of s.rows) if (r.label === label) return r;
    return undefined;
  };
  const wojownik = find('unit', 'Wojownik');
  const wRow = rowOf(wojownik, 'Koszt surowca');
  check('Wojownik: „Koszt surowca" = chip {drewno, ilość} bez nazwy w tekście',
    !!wRow && wRow.resources && wRow.resources[0].id === 'drewno' && wRow.value === '' && wRow.resources[0].amount !== '', wRow);
  const tartak = find('improvement', 'tartak');
  const tRow = rowOf(tartak, 'Odblokowuje surowiec');
  check('tartak: „Odblokowuje surowiec" = chip {drewno} (sama ikona)',
    !!tRow && tRow.resources && tRow.resources[0].id === 'drewno' && tRow.value === '', tRow);
  const withStock = cards.find((c) => c.kind === 'building' && rowOf(c.card, 'Surowce (jednorazowo)'));
  check('budynek z koszt_surowce: „Surowce (jednorazowo)" = chipy + sufiks „— z magazynu państwa"',
    !!withStock && rowOf(withStock.card, 'Surowce (jednorazowo)').resourcesSuffix === '— z magazynu państwa', withStock && withStock.id);

  // --- Proza z surowcami (obrona r1, zarzuty 1-2): „Odblokowuje", „Warunek", „Dodatkowe warunki" ----
  const partsText = (row) => (row && row.valueParts || []).map((p) => (typeof p === 'string' ? p : `{${p.id}}`)).join('');
  const tOdbl = rowOf(find('improvement', 'tartak'), 'Odblokowuje');
  check('tartak: „Odblokowuje" = {drewno} bez notatki deweloperskiej (TYP 1 / B-SUROW-BUD-03)',
    !!tOdbl && partsText(tOdbl) === '{drewno}' && !/TYP|B-SUROW/.test(tOdbl.value), tOdbl);
  const sOdbl = rowOf(find('improvement', 'stadnina'), 'Odblokowuje');
  check('stadnina: „Odblokowuje" = {kon} (jednostki konne)', !!sOdbl && partsText(sOdbl) === '{kon} (jednostki konne)', sOdbl);
  const stol = rowOf(find('building', 'stolarnia'), 'Dodatkowe warunki');
  check('stolarnia: „Dodatkowe warunki" niesie ikonę drewna (valueParts)',
    !!stol && partsText(stol).startsWith('{drewno} w magazynie państwa'), stol);
  const mennica = rowOf(find('building', 'mennica'), 'Dodatkowe warunki');
  check('mennica: „Dostęp do {zloto}", a „Kopalnia złota" zostaje tekstem (budynek, nie surowiec)',
    !!mennica && partsText(mennica).includes('Dostęp do {zloto}') && /Kopalnia złota/.test(partsText(mennica)), partsText(mennica));
  const kz = rowOf(find('improvement', 'kopalnia_zelaza'), 'Warunek');
  check('kopalnia żelaza: „Warunek" = {ruda_zelaza} jedną ikoną, „Odlewnia żelaza" zostaje tekstem',
    !!kz && partsText(kz).startsWith('{ruda_zelaza}') && /Odlewnia żelaza/.test(partsText(kz)), partsText(kz));
  check('proza: liczba wierszy valueParts > 0 (ikony w treści wymagań/odblokowań)', proseChipRows > 0, proseChipRows);
  console.log('wiersze z valueParts:', proseChipRows, '| wyjątki jawne (opis/epoka/cuda):', exemptCount);

  // --- D. bezpieczeństwo: escapowanie kwoty ----------------------------------------------------------
  const evil = M.resourceAmountChipHtml('drewno', M.escapeHtmlText('<img src=x onerror=alert(1)>&'));
  check('D: kwota z `<img …>` jest escapowana — brak surowego znacznika w chipie',
    !/<img/i.test(evil) && evil.includes('&lt;img') && evil.includes('&amp;'), evil.slice(0, 160));

  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(BUNDLE, { force: true });
  console.log(`\n[entity-cards-resource-icons-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[entity-cards-resource-icons-test] błąd:', err);
  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(BUNDLE, { force: true });
  process.exit(1);
});
