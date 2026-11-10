'use strict';
/**
 * node tools/wonder-text-no-raw-ids-test.cjs — R-WEB-UI-RAW-IDS-IN-PLAYER-TEXT-Q1 (strażnik).
 *
 * Tekst dla gracza (modal „CUD UKOŃCZONY", karta cudu) nie zawiera surowych identyfikatorów
 * snake_case ani znanych id terenów/ulepszeń z danych. Nazwy idą przez JEDEN resolver
 * (src/game/text-names.ts → nazwaWyswietlana / nazwaCywilizacji).
 *
 * Sprawdza:
 *   1. wonderEffectsText dla WSZYSTKICH cudów z wonders.json: brak /\b[a-z]+_[a-z_]+\b/
 *      i brak znanego id terenu jako słowa.
 *   2. wonderAdapter (karta cudu) dla WSZYSTKICH cudów: etykiety i wartości sekcji
 *      (bez historia) bez snake_case i bez znanych id.
 *   3. Konkretne nazwy: piramidy → „Pustynia” i „Mała rzeka”; wiszace_ogrody → „Farma”;
 *      mundo_perdido → „Tropiki”; resolver: lowie_rybackie → „Łowiska rybackie”, laka → „Łąka”,
 *      farma → „Farma”; nieznany_id_x → „Nieznany id x” (bez snake_case).
 *   4. Kamień Ha'amonga (hamonga): tekst zawiera „Miasto +3 kultury, +3 żywności (× każde miasto)”
 *      i nie zawiera id; bez martwych wpisów terenu (decyzja R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1).
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.wonder-text-no-raw-ids-entry.ts');
const bundle = path.join(__dirname, '.wonder-text-no-raw-ids-bundle.cjs');

fs.writeFileSync(entry, `
export { wonderEffectsText } from '../src/game/wonders-effects-text';
export { nazwaWyswietlana, nazwaCywilizacji } from '../src/game/text-names';
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
const { wonderEffectsText, nazwaWyswietlana, nazwaCywilizacji, getWonderById, getWondersData, wonderAdapter } = M;

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
const cuda = wondersRaw.cuda;
const knownIdRe = new RegExp('\\b(' + KNOWN_IDS.join('|') + ')\\b');

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
ok(nazwaCywilizacji('egipt') === 'Egipt', 'resolver: egipt → „Egipt” (panstwa)');

console.log('4. Kamień Ha\'amonga (hamonga)');
const hamTxt = wonderEffectsText(getWonderById('hamonga'));
ok(hamTxt.includes('Miasto +3 kultury, +3 żywności (× każde miasto)'), 'hamonga: blok miasta z polskimi nazwami');
ok(!SNAKE.test(hamTxt), 'hamonga: brak snake_case');
ok(!(getWonderById('hamonga').bonusy.teren && getWonderById('hamonga').bonusy.teren.length), 'hamonga: bonusy.teren puste (R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1)');

console.log(`\nWYNIK: ${pass} ok, ${fail} FAIL`);
try { fs.unlinkSync(entry); } catch (_) { /* ignore */ }
try { fs.unlinkSync(bundle); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
}).catch((e) => { console.error(e); process.exit(1); });
