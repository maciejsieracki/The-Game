'use strict';
/**
 * side-panel-event-link-test.cjs — P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1.
 *
 * Szybka bramka kontraktowa dla `src/game/side-panel-event-link.ts` — czystej warstwy „po id"
 * decydującej, KTÓRA rodzina zdarzeń panelu WYDARZENIA ma miejsce docelowe. Runtime (czy cel
 * istnieje TERAZ) i faktyczne otwieranie widoków sprawdza żywy test w Chromium:
 * `tools/sidepanel-event-przekierowania-real-render-test.cjs`.
 *
 * Pilnuje trzech rzeczy, których żywy test nie złapie tanio:
 *  1. mapowania prefiks → rodzaj skrótu (regresja przy dopisywaniu nowych zdarzeń);
 *  2. że zdarzenia z kategorii „czysto informacyjne" oraz WSZYSTKIE blokujące zostają BEZ
 *     skrótu (to jest wynik audytu, nie przypadek — patrz nagłówek modułu);
 *  3. parsowania heksu z id chatki, łącznie z UJEMNYMI współrzędnymi axial (`village-7--3-4`),
 *     gdzie naiwny split po „-" daje zły wynik.
 *
 * Usage (z gra/): node tools/side-panel-event-link-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.sp-event-link-entry.ts');
const BUNDLE = path.resolve(__dirname, '.sp-event-link-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  sidePanelEventLinkKind,
  sidePanelEventLinkLabel,
  villageEventHex,
} from '../src/game/side-panel-event-link.ts';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
});
const B = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg, detail) {
  if (cond) { pass++; console.log('  OK:  ' + msg); }
  else { fail++; console.error('  FAIL:' + msg + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const eq = (got, want, msg) => ok(got === want, msg, { got, want });

console.log('side-panel-event-link-test');

// --- (1) rodziny Z miejscem docelowym ------------------------------------------------
console.log(' (1) rodziny ze skrotem');
eq(B.sidePanelEventLinkKind('border-march-violated'), 'map-focus', 'border-march-violated -> map-focus');
eq(B.sidePanelEventLinkKind('border-march-trespassing'), 'map-focus', 'border-march-trespassing -> map-focus');
eq(B.sidePanelEventLinkKind('village-12-3-4'), 'map-focus', 'village-* -> map-focus');
eq(B.sidePanelEventLinkKind('war-12-0-3'), 'diplo-wars', 'war-* -> diplo-wars');
eq(B.sidePanelEventLinkKind('elim-cs-12-7'), 'civ-elim', 'elim-cs-* -> civ-elim');
eq(B.sidePanelEventLinkKind('trade-new-12-r1'), 'city-panel', 'trade-new-* -> city-panel');
eq(B.sidePanelEventLinkKind('trade-lost-12-r1'), 'city-panel', 'trade-lost-* -> city-panel');
eq(B.sidePanelEventLinkKind('auto-ration-t12'), 'empire-spichlerz', 'auto-ration-t* -> empire-spichlerz');
eq(B.sidePanelEventLinkKind('era-12-1'), 'tech-tree', 'era-* -> tech-tree');

// --- (2) kategoria „czysto informacyjna" + wszystkie blokujace: BEZ skrotu -------------
console.log(' (2) bez skrotu (wynik audytu, nie przypadek)');
for (const id of [
  'eot-hint-12-0',            // generyczna kolejka konca tury — brak id bytu
  'edu-veteran-enemy-q3',     // porada celujaca w DOWOLNA obca jednostke
  'revolt-city3',             // blokujace: maja wlasny przycisk „Otworz ->"
  'revolt-warn-city3',
  'prod-empty-city3',
  'diplo-pend-7',
  'negot-4',
  '',                         // pusty id nie moze przypadkiem trafic w zadna rodzine
  'wartburg-12',              // NIE zaczyna sie od „war-" (myslnik jest czescia prefiksu)
  'erasmus-1',                // NIE zaczyna sie od „era-"
]) {
  eq(B.sidePanelEventLinkKind(id), null, 'brak skrotu dla id ' + JSON.stringify(id));
}

// --- (3) etykiety skrotow -------------------------------------------------------------
console.log(' (3) etykiety');
eq(B.sidePanelEventLinkLabel('map-focus'), 'Pokaż na mapie', 'etykieta map-focus');
eq(B.sidePanelEventLinkLabel('diplo-wars'), 'Dyplomacja', 'etykieta diplo-wars');
eq(B.sidePanelEventLinkLabel('civ-elim'), 'Szczegóły', 'etykieta civ-elim');
eq(B.sidePanelEventLinkLabel('city-panel'), 'Panel miasta', 'etykieta city-panel');
eq(B.sidePanelEventLinkLabel('empire-spichlerz'), 'Spichlerz', 'etykieta empire-spichlerz');
eq(B.sidePanelEventLinkLabel('tech-tree'), 'Drzewo technologii', 'etykieta tech-tree');
ok(new Set(['map-focus', 'diplo-wars', 'civ-elim', 'city-panel', 'empire-spichlerz', 'tech-tree']
  .map(k => B.sidePanelEventLinkLabel(k))).size === 6, 'kazda rodzina ma wlasna, unikalna etykiete');

// --- (4) heks chatki z id (w tym UJEMNE q/r) -----------------------------------------
console.log(' (4) heks chatki z id');
const h1 = B.villageEventHex('village-12-3-4');
ok(h1 !== null && h1.q === 3 && h1.r === 4, 'village-12-3-4 -> q=3 r=4', h1);
const h2 = B.villageEventHex('village-7--3-4');
ok(h2 !== null && h2.q === -3 && h2.r === 4, 'village-7--3-4 -> q=-3 r=4 (ujemne q)', h2);
const h3 = B.villageEventHex('village-7-3--4');
ok(h3 !== null && h3.q === 3 && h3.r === -4, 'village-7-3--4 -> q=3 r=-4 (ujemne r)', h3);
const h4 = B.villageEventHex('village-0--3--7');
ok(h4 !== null && h4.q === -3 && h4.r === -7, 'village-0--3--7 -> q=-3 r=-7 (oba ujemne)', h4);
ok(B.villageEventHex('village-12-3') === null, 'niepelne id chatki -> null');
ok(B.villageEventHex('village-12-3-4-5') === null, 'nadmiarowy czlon w id chatki -> null');
ok(B.villageEventHex('border-march-violated') === null, 'obcy prefiks -> null');
ok(B.villageEventHex('village-abc-def') === null, 'nieliczbowe czlony -> null');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log('\nside-panel-event-link-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
