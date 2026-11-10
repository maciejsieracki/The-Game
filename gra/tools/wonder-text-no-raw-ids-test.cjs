'use strict';
/**
 * node tools/wonder-text-no-raw-ids-test.cjs — R-WEB-UI-RAW-IDS-IN-PLAYER-TEXT-Q1 (strażnik).
 *
 * Tekst dla gracza (modal „CUD UKOŃCZONY", karta cudu, karty ulepszeń/cudów/odkryć, panel miasta,
 * dyplomacja, nowa gra) nie zawiera surowych identyfikatorów snake_case ani znanych id terenów.
 * Nazwy idą przez JEDEN resolver (src/game/text-names.ts → nazwaWyswietlana / nazwaCywilizacji /
 * humanizeId jako fallback dla nieznanego id).
 *
 * Sprawdza:
 *   1. wonderEffectsText dla WSZYSTKICH cudów z wonders.json: brak /\b[a-z]+_[a-z_]+\b/
 *      i brak znanego id terenu jako słowa (lista ręczna + id wyprowadzone z danych).
 *   2. wonderAdapter (karta cudu) dla WSZYSTKICH cudów: etykiety i wartości bez snake_case i bez id.
 *   3. Konkretne nazwy: piramidy → „Pustynia” i „Mała rzeka”; wiszace_ogrody → „Farma”;
 *      mundo_perdido → „Tropiki”; resolver: lowie_rybackie → „Łowiska rybackie”, laka → „Łąka”;
 *      nieznany_id_x → „Nieznany id x” (bez snake_case).
 *   4. Kamień Ha'amonga (hamonga): blok miasta z polskimi nazwami, bez snake_case, bonusy.teren puste
 *      (decyzja R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1; kryterium „Łowiska/Łąka” z dispatchu
 *      zastąpione tą decyzją — patrz 01-operator-r2.md).
 *   5. Pokrycie danych: każdy id terenu/warunku użyty w wonders.json (typTerenu, wymagaTerenu, warunek)
 *      ma JAWNĄ nazwę (tabela resolvera lub terrain-improvements.json), nie tylko fallback; każdy id
 *      z terrain-improvements.json daje nazwę bez „_”.
 *   6. Źródło: w audytowanych plikach UI nie ma gołego fallbacku `?? id` / `?? k` / `?? key` /
 *      `label: key` / `|| x.id` na tekście wyświetlanym (wszystkie zamienione na humanizeId /
 *      nazwaCywilizacji / nazwaWyswietlana).
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.wonder-text-no-raw-ids-entry.ts');
const bundle = path.join(__dirname, '.wonder-text-no-raw-ids-bundle.cjs');

fs.writeFileSync(entry, `
export { wonderEffectsText } from '../src/game/wonders-effects-text';
export { nazwaWyswietlana, nazwaCywilizacji, humanizeId, maJawnaNazwe } from '../src/game/text-names';
export { getWonderById, getWondersData } from '../src/game/wonders-data';
export { wonderAdapter } from '../src/ui/entityCards/wonderAdapter';
`, 'utf8');

esbuild.build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl' },
  plugins: [{
    name: 'stub-import-meta-glob',
    setup(build) {
      // import.meta.glob (Vite) nie działa w bundlu cjs — podmieniamy na pusty obiekt (testy nie czytają ikon).
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        const src = fs.readFileSync(args.path, 'utf8');
        if (!src.includes('import.meta.glob')) return undefined;
        return { contents: src.replace(/import\.meta\.glob\(/g, '((_p, _o) => ({}))('), loader: 'ts' };
      });
    },
  }],
  outfile: bundle,
  logLevel: 'silent',
  absWorkingDir: GRA,
}).then(() => {
const M = require(bundle);
const { wonderEffectsText, nazwaWyswietlana, nazwaCywilizacji, humanizeId, maJawnaNazwe, getWonderById, getWondersData, wonderAdapter } = M;

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ok  ' + label); }
  else { fail++; console.log('  FAIL ' + label); }
}

const SNAKE = /\b[a-z]+_[a-z_]+\b/;
const KNOWN_IDS = [
  'pustynia', 'rzeka_mala', 'rzeka_sasiad', 'tropiki', 'farma', 'laka', 'lowie_rybackie',
  'plytkie_morze', 'wzgorze', 'trudny_teren', 'plaski_teren', 'przy_miescie', 'hex_sasiad_rzeka',
  'oboz_lowiecki', 'lodzie_rybackie', 'kopalnia_zelaza', 'kopalnia_miedzi', 'droga_brukowana',
];
const wondersRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'wonders.json'), 'utf8'));
const terrainImpRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'));
const cuda = wondersRaw.cuda;

// Id terenów/warunków wyprowadzone z danych (nie z ręcznej listy).
const DATA_TERRAIN_KEYS = new Set();
(function collect(node) {
  if (Array.isArray(node)) { node.forEach(collect); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'typTerenu' || k === 'warunek') { if (typeof v === 'string') DATA_TERRAIN_KEYS.add(v); }
      else if (k === 'wymagaTerenu') { (Array.isArray(v) ? v : [v]).forEach((x) => { if (typeof x === 'string') DATA_TERRAIN_KEYS.add(x); }); }
      collect(v);
    }
  }
})(wondersRaw);
const IMPROVEMENT_KEYS = Object.keys(terrainImpRaw).filter((k) => !k.startsWith('_'));
const allKnown = [...new Set([...KNOWN_IDS, ...DATA_TERRAIN_KEYS, ...IMPROVEMENT_KEYS])];
const knownIdRe = new RegExp('\\b(' + allKnown.join('|') + ')\\b');

console.log('1. wonderEffectsText — wszystkie cuda');
for (const w of cuda) {
  const def = getWonderById(w.id);
  const txt = wonderEffectsText(def);
  ok(!SNAKE.test(txt), `${w.id}: brak snake_case w tekście efektów`);
  ok(!knownIdRe.test(txt), `${w.id}: brak znanego id terenu w tekście efektów`);
}

console.log('2. wonderAdapter (karta cudu) — wszystkie cuda');
for (const w of cuda) {
  const card = wonderAdapter(getWonderById(w.id));
  const flat = [];
  for (const s of card.sections) for (const r of s.rows) flat.push(`${r.label} ${r.value}`);
  const joined = flat.join(' | ');
  ok(!SNAKE.test(joined), `${w.id}: karta bez snake_case (etykiety/wartości)`);
  ok(!knownIdRe.test(joined), `${w.id}: karta bez znanego id terenu`);
}

console.log('3. Konkretne nazwy');
const piramidy = wonderEffectsText(getWonderById('piramidy'));
ok(piramidy.includes('Pustynia +2 złota, +2 produkcji'), 'piramidy: „Pustynia +2 złota, +2 produkcji”');
ok(piramidy.includes('Mała rzeka +2 złota, +2 produkcji'), 'piramidy: „Mała rzeka +2 złota, +2 produkcji”');
ok(wonderEffectsText(getWonderById('wiszace_ogrody')).includes('Farma +2 żywności'), 'wiszace_ogrody: „Farma +2 żywności”');
ok(wonderEffectsText(getWonderById('mundo_perdido')).includes('Tropiki +2 nauki, +2 zadowolenia'), 'mundo_perdido: „Tropiki +2 nauki, +2 zadowolenia”');
ok(nazwaWyswietlana('lowie_rybackie') === 'Łowiska rybackie', 'resolver: lowie_rybackie → „Łowiska rybackie”');
ok(nazwaWyswietlana('laka') === 'Łąka', 'resolver: laka → „Łąka”');
ok(nazwaWyswietlana('farma') === 'Farma', 'resolver: farma → „Farma” (z terrain-improvements.json)');
ok(nazwaWyswietlana('nieznany_id_x') === 'Nieznany id x', 'resolver: fallback nieznany_id_x → „Nieznany id x”');
ok(humanizeId('jakis_id') === 'Jakis id', 'resolver: humanizeId jakis_id → „Jakis id”');
ok(nazwaCywilizacji('egipt') === 'Egipt', 'resolver: egipt → „Egipt” (panstwa)');
ok(nazwaCywilizacji('nieznana_cyw') === 'Nieznana cyw', 'resolver: nieznana cywilizacja → fallback bez snake_case');

console.log('4. Kamień Ha\'amonga (hamonga)');
const hamTxt = wonderEffectsText(getWonderById('hamonga'));
ok(hamTxt.includes('Miasto +3 kultury, +3 żywności (× każde miasto)'), 'hamonga: blok miasta z polskimi nazwami');
ok(!SNAKE.test(hamTxt), 'hamonga: brak snake_case');
ok(!(getWonderById('hamonga').bonusy.teren && getWonderById('hamonga').bonusy.teren.length), 'hamonga: bonusy.teren puste (R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1)');

console.log('5. Pokrycie danych');
for (const key of [...DATA_TERRAIN_KEYS].sort()) {
  ok(maJawnaNazwe(key), `wonders.json: id „${key}” ma jawną nazwę (nie tylko fallback)`);
}
for (const key of IMPROVEMENT_KEYS) {
  const n = nazwaWyswietlana(key);
  ok(!n.includes('_') && n.length > 0, `terrain-improvements: ${key} → „${n}” bez „_”`);
}

console.log('6. Źródło — brak gołych fallbacków na tekście wyświetlanym');
const AUDYT = [
  'ui/entityCards/wonderAdapter.ts', 'ui/entityCards/improvementAdapter.ts',
  'ui/entityCards/technologyAdapter.ts', 'ui/cityPanel.ts', 'ui/diplomacyTradeBasket.ts',
  'ui/newGameFlow.ts', 'game/wonders-effects-text.ts',
];
const GOLY_FALLBACK = /\?\?\s*(?:k|id|key|civType|wonder\.id|b\.id|w\.id|item\.id)\s*[;,)\]}]|\|\|\s*wonder\.id\b|label:\s*key\s*[,}]/;
for (const f of AUDYT) {
  const src = fs.readFileSync(path.join(GRA, 'src', f), 'utf8');
  const lines = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => GOLY_FALLBACK.test(l) && !/hidden\.has\(/.test(l));
  ok(lines.length === 0, `${f}: brak gołego fallbacku id${lines.length ? ' (' + lines.map(([n]) => n).join(',') + ')' : ''}`);
}

console.log(`\nWYNIK: ${pass} ok, ${fail} FAIL`);
try { fs.unlinkSync(entry); } catch (_) { /* ignore */ }
try { fs.unlinkSync(bundle); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
}).catch((e) => { console.error(e); process.exit(1); });
