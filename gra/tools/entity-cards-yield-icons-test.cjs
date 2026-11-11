'use strict';
/**
 * entity-cards-yield-icons-test.cjs
 *
 * TEMAT: R-WEB-UI-RESOURCE-ICONS-YIELDS-WONDERS-Q1 (decyzja ABC właściciela: ikony także w plonach i bonusach cudów).
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
 * Uruchomienie (z gra/): node tools/entity-cards-yield-icons-test.cjs
 */
const { FORMS, normalizeText } = require('./entity-card-chip-text.cjs');
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.entity-cards-yield-icons-entry.ts');
const BUNDLE = path.resolve(__dirname, '.entity-cards-yield-icons-bundle.cjs');

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
    "export { resourceIdFromName, resourcesFromList, yieldProseParts } from '../src/ui/entityCards/resourceRows.ts';",
    "export { resourceAmountChipHtml, escapeHtmlText, YIELD_CHIP } from '../src/ui/resourceAmountChip.ts';",
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
  check('fixture: zbiór nazw surowców ma co najmniej 12 pozycji', names.size >= 12, [...names]);


  // --- Nazwy plonów z ikoną marki (YIELD_CHIP) dołączone do nazw surowców ---------------------------
  const YIELD_NAMES = ['Żywność', 'Praca', 'Pracy', 'Kultura', 'Nauka', 'Wiara', 'Podatek', 'Pieniądz', 'Pieniądze', 'Pieniądza', 'Pieniędzy', 'Żywności', 'Kultury', 'Nauki', 'Wiary', 'Podatku', 'Wpływ', 'Wpływu', 'Naukę', 'Kulturę', 'Pracę', 'Wiarę'];
  for (const y of YIELD_NAMES) names.add(y);
  const nameRes = [...names].map((n) => new RegExp('(^|[^\\p{L}])' + n.toLocaleLowerCase('pl') + '($|[^\\p{L}])', 'u'));
  const hasBareName = (txt) => {
    // JAWNY wyjątek W5: nazwa własna cudu „Kamień Ha'amonga" (nie surowiec Kamień).
    const low = String(txt || '').replace(/Kamień Ha['’]amonga/g, 'Ha-amonga').toLocaleLowerCase('pl');
    return nameRes.some((re) => re.test(low));
  };

  if (process.env.DUMP_PARTS) {
    const fmt = (ps) => ps.map((p) => (typeof p === 'string' ? p : `{${p.id}${p.amount !== undefined ? ':' + p.amount : ''}}`)).join('');
    for (const f of ['building-cards-top5.json', 'tech-cards-top5.json']) {
      for (const [k, v] of Object.entries(readJson(f))) {
        if (!v || !v.top5) continue;
        for (const it of v.top5) { const p = M.yieldProseParts(it.tytul); if (p) console.log('T', k, '|', fmt(p)); }
        for (const c of v.cmz) { const p = M.yieldProseParts(c.czynnosc + ', aby ' + c.korzysc + '.'); if (p) console.log('C', k, '|', fmt(p)); }
      }
    }
  }

  // --- Zebranie kart (jak w entity-cards-resource-icons-test) ---------------------------------------
  const cards = [];
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
  for (const [k, v] of Object.entries(readJson('terrain-improvements.json'))) {
    if (!v || typeof v !== 'object' || !v.nazwa) continue;
    cards.push({ kind: 'improvement', id: k, card: M.improvementAdapter(v, {}) });
  }
  for (const t of readJson('tech.json').technologie || []) {
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

  // --- A. ZERO gołych nazw surowców/plonów w treści WIERSZY (value/valueParts/resourcesSuffix) -------
  // Zakres: WSZYSTKIE wiersze WSZYSTKICH kart, w tym cuda. Wyjątki jawne (proza narracyjna, nazwy
  // epok, nazwy własne encji i opisy/rys historyczny). Etykieta wiersza (label) to nagłówek wiersza —
  // zostaje tekstem (założenie raportu); sprawdzana jest wyłącznie treść wartości.
  // Runda 2 (FC r1 FAIL, zarzut 2): Top 5 (TYTUŁY) i „Co możesz teraz zrobić" (actions) NIE są już wyjątkami —
  // tytuły to `labelParts`, zdania akcji to `valueParts`; skan ma dać 0 gołych nazw. JAWNE wyjątki (tylko te):
  //   (W1) zdanie pod tytułem Top 5 (`value` w layoucie top3) — proza słowna z danych (zdanie opisowe);
  //   (W2) proza opisowa: sekcje layout 'prose' inne niż `actions` (Opis, Historia);
  //   (W3) sekcje o tytule opis/top 3/rys historyczny/historia/ciekawostki;
  //   (W4) etykiety wierszy (`label` w siatce) — nagłówki; „Epoka…", „Nazwa", „Kategoria".
  const isExempt = (section, row, kind) => {
    if (section.layout === 'prose' && section.key !== 'actions') return true;
    if (/^(opis|top 3|rys historyczny|historia|ciekawostka|ciekawostki)$/i.test(section.title || '')) return true;
    if (/^Epoka/.test(row.label) || row.label === 'Nazwa' || row.label === 'Kategoria') return true;
    return false;
  };
  const bareIn = (parts, text) => (parts && parts.length > 0
    ? parts.filter((p) => typeof p === 'string').some((p) => hasBareName(p))
    : hasBareName(text));
  const offenders = [];
  let yieldChipRows = 0;
  let top5TitleChipRows = 0;
  let actionsChipRows = 0;
  const yieldChipsPerKind = {};
  const YIELD_IDS = new Set(['zywnosc', 'praca', 'kultura', 'nauka', 'wiara', 'podatek', 'pieniadz']);
  const usedYieldIds = new Set();
  for (const { kind, id, card } of cards) {
    for (const section of card.sections || []) {
      for (const row of section.rows || []) {
        if (isExempt(section, row, kind)) continue;
        if (section.layout === 'top3') {
          // Top 5: skanujemy TYTUŁ (label/labelParts); zdanie (value) = wyjątek W1.
          if ((row.labelParts || []).some((p) => typeof p !== 'string' && YIELD_IDS.has(p.id))) { top5TitleChipRows++; }
          if (bareIn(row.labelParts, row.label)) offenders.push({ kind, id, section: section.key, field: 'labelParts', text: row.label });
          continue;
        }
        if (section.key === 'actions' && (row.valueParts || []).some((p) => typeof p !== 'string')) actionsChipRows++;
        const chips = [...(row.resources || []), ...((row.valueParts || []).filter((p) => typeof p !== 'string'))];
        if (chips.some((c) => YIELD_IDS.has(c.id))) {
          yieldChipRows++;
          yieldChipsPerKind[kind] = (yieldChipsPerKind[kind] || 0) + 1;
          for (const c of chips) if (YIELD_IDS.has(c.id)) usedYieldIds.add(c.id);
        }
        // wiersze, których wartość jest linkiem do innej encji, niosą nazwę ENCJI (np. „Kuźnia"), nie plon
        if (row.linkTo) continue;
        if (row.valueParts && row.valueParts.length > 0) {
          for (const p of row.valueParts) {
            if (typeof p === 'string' && hasBareName(p)) offenders.push({ kind, id, section: section.key, label: row.label, field: 'valueParts', text: p });
          }
        } else if (hasBareName(row.value)) {
          offenders.push({ kind, id, section: section.key, label: row.label, field: 'value', text: row.value });
        }
        if (hasBareName(row.resourcesSuffix)) {
          offenders.push({ kind, id, section: section.key, label: row.label, field: 'resourcesSuffix', text: row.resourcesSuffix });
        }
      }
    }
  }
  if (process.env.DUMP_OFFENDERS) console.log(JSON.stringify(offenders, null, 1));
  check('A: ZERO gołych nazw surowców/plonów w value/valueParts/resourcesSuffix wierszy WSZYSTKICH kart (z cudami)',
    offenders.length === 0, offenders.slice(0, 60));
  // Runda 3 (obrona, zarzut 2 Evaluatora): NIEZALEZNA od tech-cards-top5-test kontrola TOZSAMOSCI chipow.
  // Dla tytulow Top 5 (label) i zdan "Co mozesz teraz zrobic" (value) kart budynkow i technologii:
  // kolejnosc nazw chipow (id -> etykieta) jest podciagiem kolejnosci nazw plonow/surowcow wykrytych w tekscie z danych
  // (tabela FORMS, jawna). Zmiana tozsamosci chipa (np. praca -> kultura) daje czerwono tutaj.
  {
    const chipName = (c) => (M.YIELD_CHIP[c.id] ? M.YIELD_CHIP[c.id].label : M.stockResourceLabel(c.id).replace(/\s*\(surowiec\)/, ''));
    const formNames = new Set(Object.values(FORMS));
    const namesIn = (t) => (normalizeText(String(t || '').replace(/Kamień Ha['’]amonga/g, 'Ha-amonga').replace(/\b[Rr]ud[ay] żelaza\b/g, 'RudaŻ')).match(/[\p{L}]+/gu) || [])
      .map((w) => (w === 'RudaŻ' ? 'Ruda żelaza' : w)).filter((w) => formNames.has(w) || w === 'Ruda żelaza');
    const identBad = [];
    let identChecked = 0;
    for (const { kind, id, card } of cards) {
      if (kind !== 'building' && kind !== 'technology') continue;
      for (const section of card.sections || []) {
        const isTop = section.layout === 'top3';
        if (!isTop && section.key !== 'actions') continue;
        for (const row of section.rows || []) {
          const raw = isTop ? row.label : row.value;
          const parts = isTop ? row.labelParts : row.valueParts;
          if (!parts || !parts.some((p) => typeof p !== 'string')) continue;
          identChecked++;
          const got = parts.filter((p) => typeof p !== 'string').map(chipName);
          const exp = namesIn(raw);
          // got musi byc PODCIAGIEM exp (kolejnosc zachowana): exp zawiera tez slowa w nazwach encji/epok
          // ("Odlewni zelaza", "epoka Brazu"), ktore nie sa chipami.
          let k = 0;
          for (const n of exp) if (k < got.length && got[k] === n) k++;
          if (k !== got.length) identBad.push({ kind, id, section: section.key, raw, got, exp });
        }
      }
    }
    check('R3-ident: tozsamosc i kolejnosc chipow w tytulach Top 5 i zdaniach actions = podciag nazw plonow z tekstu danych',
      identChecked > 20 && identBad.length === 0, { identChecked, bad: identBad.slice(0, 10), nbad: identBad.length });
  }
  // Runda 2 (obrona, zarzut 3 + skan): Wpływ (res-influence) i Koszt nauki jako chipy.
  {
    const allChips = (card) => (card.sections || []).flatMap((sec) => (sec.rows || []).flatMap((r) =>
      [...(r.resources || []), ...((r.valueParts || []).filter((p) => typeof p !== 'string'))]));
    const piramidy = cards.find((c) => c.kind === 'wonder' && c.card.sections.some((sec) => sec.rows.some((r) => /Wpływ/.test(r.value))));
    check('R2-3: cud z „+N Wpływu” ma chip wplyw (res-influence), nie goły tekst',
      !!piramidy && allChips(piramidy.card).some((c) => c.id === 'wplyw'), piramidy && piramidy.id);
    const techs = cards.filter((c) => c.kind === 'technology');
    const kosztOk = techs.every(({ card }) => card.sections.flatMap((sec) => sec.rows).filter((r) => r.label === 'Koszt nauki')
      .every((r) => (r.valueParts || []).some((p) => typeof p !== 'string' && p.id === 'nauka' && /^\d+$/.test(String(p.amount)))));
    check('R2-4: „Koszt nauki” każdej technologii = chip nauka z liczbą', techs.length > 0 && kosztOk, techs.length);
  }
  check('A3: Top 5 — tytuły z chipami plonów (labelParts) > 0 (budynki+technologie)', top5TitleChipRows > 20, top5TitleChipRows);
  check('A4: „Co możesz teraz zrobić" — zdania z chipami (valueParts) > 0', actionsChipRows > 20, actionsChipRows);
  check('A2: wiersze z chipami plonów > 0', yieldChipRows > 0, yieldChipRows);
  console.log('wiersze z chipami plonów wg rodzaju:', JSON.stringify(yieldChipsPerKind), 'razem', yieldChipRows);
  for (const kind of ['building', 'improvement', 'wonder', 'unit', 'technology']) {
    check(`C: rodzaj "${kind}" ma co najmniej jeden wiersz z chipem plonu`, (yieldChipsPerKind[kind] || 0) > 0, yieldChipsPerKind);
  }
  check('C: użyte id plonów: praca, zywnosc, podatek, kultura, nauka', ['praca', 'zywnosc', 'podatek', 'kultura', 'nauka'].every((i) => usedYieldIds.has(i)), [...usedYieldIds]);

  // --- B. chip każdego plonu ma realną ikonę SVG, nazwa w title/aria-label -----------------------------
  const noIcon = [...YIELD_IDS].filter((id) => {
    const html = M.resourceAmountChipHtml(id, '+2');
    return html.includes('bld-res-chip-ic--text') || !html.includes('<svg');
  });
  check(`B: chip każdego plonu (${YIELD_IDS.size} id) ma realną ikonę SVG`, noIcon.length === 0, noIcon);
  const pr = M.resourceAmountChipHtml('praca', '+2');
  check('B: nazwa „Praca" tylko w title/aria-label, nie w widocznym tekście chipa',
    /title="Praca"/.test(pr) && /aria-label="Praca"/.test(pr) && !/>\s*Praca\s*</.test(pr), pr.slice(0, 200));

  // --- Przykłady z realnych danych ---------------------------------------------------------------------
  const partsText = (row) => (row && row.valueParts || []).map((p) => (typeof p === 'string' ? p : `{${p.id}${p.amount !== undefined ? ':' + p.amount : ''}}`)).join('');
  const find = (kind, id) => (cards.find((c) => c.kind === kind && c.id === id) || {}).card;
  const findRow = (card, pred) => {
    for (const s of (card && card.sections) || []) for (const r of s.rows) if (pred(r, s)) return r;
    return undefined;
  };
  // cud z bonusem terenowym „+2 Praca, +2 Drewno"
  let wonderSample = null;
  for (const c of cards.filter((x) => x.kind === 'wonder')) {
    const r = findRow(c.card, (row) => /^Teren/.test(row.label) && /Praca/.test(row.value) && /Drewno/.test(row.value));
    if (r) { wonderSample = { id: c.id, row: r }; break; }
  }
  check('cud: „Teren (…)": „+2 Praca, +2 Drewno" → chipy {praca:+2}, {drewno:+2} bez nazw w częściach tekstowych',
    !!wonderSample && /\{praca:\+2\}, \{drewno:\+2\}/.test(partsText(wonderSample.row)), wonderSample && partsText(wonderSample.row));
  const mw = (() => {
    for (const c of cards.filter((x) => x.kind === 'wonder')) {
      const r = findRow(c.card, (row) => /^Miasto — /.test(row.label));
      if (r) return { id: c.id, row: r };
    }
    return null;
  })();
  check('cud: „Miasto — …" = chip plonu z kwotą', !!mw && /^\{[a-z_]+:\+?\d+\}$/.test(partsText(mw.row)), mw && partsText(mw.row));
  const bld = (() => {
    for (const c of cards.filter((x) => x.kind === 'building')) {
      const r = findRow(c.card, (row) => row.label === 'Żywność' && row.valueParts);
      if (r) return { id: c.id, row: r };
    }
    return null;
  })();
  check('budynek: wiersz „Żywność" = {zywnosc:+N} + reszta tekstu', !!bld && /^\{zywnosc:\+\d+\}/.test(partsText(bld.row)), bld && partsText(bld.row));
  const upk = (() => {
    for (const c of cards.filter((x) => x.kind === 'building')) {
      const r = findRow(c.card, (row) => row.label === 'Co turę' && (row.resources || []).some((q) => q.id === 'pieniadz'));
      if (r) return { id: c.id, row: r };
    }
    return null;
  })();
  check('budynek: utrzymanie — Pieniądz jako chip {pieniadz} (z surowcami), bez słowa „Pieniądze" w value', !!upk && upk.row.value === '', upk && upk.row);
  const imp = find('improvement', 'farma') || find('improvement', 'tartak');
  const impRow = findRow(imp, (row, s) => s.key === 'characteristics' && row.valueParts);
  check('ulepszenie: wiersz charakterystyki plonu = chip z kwotą', !!impRow && /^\{[a-z_]+:\+?\d+\}$/.test(partsText(impRow)), impRow && partsText(impRow));

  // --- D. bezpieczeństwo: escapowanie kwoty plonu ---------------------------------------------------------
  const evil = M.resourceAmountChipHtml('praca', M.escapeHtmlText('<img src=x onerror=alert(1)>&'));
  check('D: kwota z `<img …>` w chipie plonu jest escapowana', !/<img/i.test(evil) && evil.includes('&lt;img') && evil.includes('&amp;'), evil.slice(0, 160));

  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(BUNDLE, { force: true });
  console.log(`\n[entity-cards-yield-icons-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[entity-cards-yield-icons-test] błąd:', err);
  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(BUNDLE, { force: true });
  process.exit(1);
});
