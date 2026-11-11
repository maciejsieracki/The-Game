'use strict';
/**
 * node tools/ids-leak-audit-test.cjs — R-WEB-UI-RAW-IDS-AUDIT-Q1 (strażnik, rozszerzenie
 * wonder-text-no-raw-ids-test.cjs na całą warstwę tekstu gracza).
 *
 * 1. Karty (budynki, ulepszenia terenu, odkrycia, jednostki, cuda) — przepuszczone przez adaptery dla WSZYSTKICH
 *    encji z danych: żadna etykieta/wartość/opis nie zawiera snake_case ani gołego id surowca/ulepszenia
 *    (np. „bydlo", „kon", „ruda_cyny", „droga").
 * 2. Resolver: nazwyZListyId, nazwaWyswietlana (surowce), improvementDisplayName (fallback bez snake_case),
 *    stripEncyMetadata (tabela metadanych hasła encyklopedii nie trafia do gracza).
 * 3. Encyklopedia/poradnik (src/data/wikiBundle.json): widok „pełny" po stripEncyMetadata bez tabeli metadanych
 *    (`poradnik_ref`/`json_ref`/`status_v1`), a wikiS/wikiM/poradnik bez snake_case w backtickach.
 * 4. Źródło: w audytowanych plikach brak gołego fallbacku `?? id|key` na tekście wyświetlanym.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.ids-leak-audit-entry.ts');
const bundle = path.join(__dirname, '.ids-leak-audit-bundle.cjs');

fs.writeFileSync(entry, `
export { buildingAdapter } from '../src/ui/entityCards/buildingAdapter';
export { improvementAdapter } from '../src/ui/entityCards/improvementAdapter';
export { technologyAdapter } from '../src/ui/entityCards/technologyAdapter';
export { unitAdapter } from '../src/ui/entityCards/unitAdapter';
export { wonderAdapter } from '../src/ui/entityCards/wonderAdapter';
export { resolveBuildingRow, resolveImprovementRow, resolveWonderRow } from '../src/ui/entityCards/registry';
export { nazwaWyswietlana, nazwyZListyId, humanizeId, stripEncyMetadata } from '../src/game/text-names';
export { improvementDisplayName } from '../src/game/terrain-improvements';
`, 'utf8');

esbuild.build({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl' },
  plugins: [{
    name: 'stub-import-meta-glob',
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        const src = fs.readFileSync(args.path, 'utf8');
        if (!src.includes('import.meta.glob')) return undefined;
        return { contents: src.replace(/import\.meta\.glob\(/g, '((_p, _o) => ({}))('), loader: 'ts' };
      });
    },
  }],
  outfile: bundle, logLevel: 'silent', absWorkingDir: GRA,
}).then(() => {
const M = require(bundle);
let pass = 0; let fail = 0;
function ok(cond, label) { if (cond) { pass++; } else { fail++; console.log('  FAIL ' + label); } }
const rd = (f) => JSON.parse(fs.readFileSync(path.join(GRA, 'data', f), 'utf8'));

const SNAKE = /\b[a-z]+(?:_[a-z0-9]+)+\b/;
const imp = rd('terrain-improvements.json');
const IMP_IDS = Object.keys(imp).filter((k) => !k.startsWith('_'));
const RES_IDS = ['bydlo', 'owce', 'lama', 'kon', 'glina', 'kamien', 'sol', 'zloto', 'drewno', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'krowa'];
const GOLE = new Set([...IMP_IDS, ...RES_IDS]);

function cardTexts(card) {
  const out = [card.title, card.subtitle, card.description, card.summary, card.footer].filter((x) => typeof x === 'string');
  const tokens = [];
  for (const s of card.sections || []) for (const r of s.rows || []) {
    out.push(String(r.label ?? ''), String(r.value ?? ''));
    for (const t of String(r.value ?? '').split(/[,;] */)) tokens.push(t.trim());
  }
  return { flat: out.join(' | '), tokens };
}
function check(kind, id, card) {
  const { flat, tokens } = cardTexts(card);
  ok(!SNAKE.test(flat), `${kind} ${id}: snake_case w karcie („${(flat.match(SNAKE) || [])[0]}")`);
  const gole = tokens.filter((t) => GOLE.has(t));
  ok(gole.length === 0, `${kind} ${id}: goły id w wartości (${gole.join(',')})`);
}

console.log('1. Karty — wszystkie encje z danych');
const bl = rd('buildings.json'); const BL = Array.isArray(bl) ? bl : Object.values(bl).find(Array.isArray);
for (const b of BL) { const r = M.resolveBuildingRow(b.id); if (r) check('budynek', b.id, M.buildingAdapter(r, {})); }
for (const k of IMP_IDS) check('ulepszenie', k, M.improvementAdapter(M.resolveImprovementRow(k) || imp[k], {}));
for (const t of rd('tech.json').technologie) check('odkrycie', t.Technologia, M.technologyAdapter(t, {}));
for (const u of rd('units.json')) check('jednostka', u.Jednostka, M.unitAdapter(u, {}));
for (const w of rd('wonders.json').cuda) check('cud', w.id, M.wonderAdapter(M.resolveWonderRow(w.id), {}));

console.log('2. Resolver');
ok(M.nazwyZListyId('krowa/byk, owce, bydlo, lama') === 'Trzoda, Owce, Lama', 'nazwyZListyId: id → nazwa, krowa/byk = Trzoda (bez duplikatu)');
ok(M.nazwyZListyId('ruda_cyny') === 'Ruda cyny' && M.nazwyZListyId('kon') === 'Koń', 'nazwyZListyId: surowce z resources.json');
ok(M.nazwyZListyId('stal (prereq)') === 'Stal', 'nazwyZListyId: znacznik „(prereq)" nie trafia do gracza');
ok(M.nazwyZListyId('Dostęp do drewna') === 'Dostęp do drewna', 'nazwyZListyId: zdanie bez zmian');
ok(!SNAKE.test(M.improvementDisplayName('nieznane_ulepszenie_x')), 'improvementDisplayName: fallback bez snake_case');
ok(M.improvementDisplayName('farma') === 'Farma', 'improvementDisplayName: farma → Farma');
const imprDroga = M.improvementAdapter(M.resolveImprovementRow('droga_brukowana') || imp.droga_brukowana, {});
ok(!JSON.stringify(imprDroga).includes('ROAD_BRUK_MOVE_SPEED_MULT') && JSON.stringify(imprDroga).includes('5× szybszy ruch'), 'karta drogi brukowanej: realny efekt ruchu zamiast martwego bonus_ruch');
const techRaw = fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8');
ok(!/"Dostęp do (glina|kamień|żelazo|krowa\/byk[^"]*)"/.test(techRaw), 'tech.json: „Dostęp do …" w dopełniaczu');
ok(M.stripEncyMetadata('|---|\n| **id** | `x` |\n| **json_ref** | `a.json` |\n\n---\n\n## Wiki‑S\n\ntekst') === '## Wiki‑S\n\ntekst', 'stripEncyMetadata: usuwa tabelę metadanych');
ok(M.stripEncyMetadata('## Bez tabeli\n\ntekst\n\n---\n\nreszta') === '## Bez tabeli\n\ntekst\n\n---\n\nreszta', 'stripEncyMetadata: hasło bez tabeli bez zmian');

console.log('3. Encyklopedia / poradnik (wikiBundle.json)');
const wiki = JSON.parse(fs.readFileSync(path.join(GRA, 'src', 'data', 'wikiBundle.json'), 'utf8'));
const META = /\*\*(poradnik_ref|json_ref|status_v1|decyzja_ref)\*\*/;
const BT_SNAKE = /`[a-z]+(?:_[a-z0-9]+)+`/;
for (const e of wiki.encyklopedia) {
  ok(!META.test(M.stripEncyMetadata(e.full)), `encyklopedia ${e.id}: tabela metadanych w widoku pełnym`);
  for (const k of ['wikiS', 'wikiM', 'historia']) {
    const v = e[k] || '';
    ok(!BT_SNAKE.test(v), `encyklopedia ${e.id}.${k}: snake_case w backtickach`);
    ok(!/\b[A-Z][a-z]+_[a-z]+\b/.test(v) && !/\b[a-z]+_[a-z]+ → [a-z]+\b/.test(v), `encyklopedia ${e.id}.${k}: id w tekście`);
  }
}
for (const p of wiki.poradnik) ok(!BT_SNAKE.test(p.content.replace(/```[\s\S]*?```/g, '')), `poradnik ${p.id}: snake_case w backtickach`);

console.log('4. Źródło — brak gołych fallbacków id na tekście');
const AUDYT = [
  'ui/hexContextTooltip.ts', 'ui/techDiscoveryNotice.ts', 'ui/diplomacyDealDisplay.ts', 'game/diplomacy-display.ts',
  'game/improvement-tech.ts', 'game/building-stock-cost.ts', 'game/era-gate-ui.ts', 'game/terrain-improvements.ts',
  'game/diplomacy-credibility.ts', 'ui/techTreeView.ts', 'ui/sciencePicker.ts',
];
const GOLY = /(\?\?|\|\|)\s*(esc\()?(String\()?(?:[A-Za-z_]+\.)*(?:key|id|typ|pid|terenBazowy)\)*\s*[;,)}`\]]/;
for (const f of AUDYT) {
  const lines = fs.readFileSync(path.join(GRA, 'src', f), 'utf8').split('\n')
    .map((l, i) => [i + 1, l]).filter(([, l]) => GOLY.test(l) && !/ownerId|nazwaWyswietlana|humanizeId|nazwaCywilizacji|\.get\(|hidden\.has|assetId|iconKey|\?\? *null|=== /.test(l));
  ok(lines.length === 0, `${f}: goły fallback id (${lines.map(([n]) => n).join(',')})`);
}
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
ok(!/nazwa \?\? pick\.key/.test(mainSrc), 'main.ts: toast wycinki/budowy bez „nazwa ?? pick.key"');
ok(!/techOfferId\}\)`/.test(mainSrc), 'main.ts: etykieta wymiany tech-za-tech bez surowego techOfferId');

console.log(`\nWYNIK: ${pass} ok, ${fail} FAIL`);
try { fs.unlinkSync(entry); } catch (_) { /* ignore */ }
try { fs.unlinkSync(bundle); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
}).catch((e) => { console.error(e); process.exit(1); });
