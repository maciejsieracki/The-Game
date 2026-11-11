'use strict';
/**
 * farm-assign-hint-camera-important-test.cjs -- R-WEB-UI-FARM-ASSIGN-HINT-CAMERA-IMPORTANT-Q1
 * Run z gra/:  node tools/farm-assign-hint-camera-important-test.cjs
 *
 * Sprawdza prawdziwe funkcje (esbuild bundle, bez atrap logiki):
 *  - zakładka: wpis podpowiedzi „Przydziel obywatela?” (important) trafia do „Ważne";
 *    regresja: zwykłe wpisy informacyjne nadal idą do „Inne", blokujące do „Ważne"
 *  - akcja: wpis podpowiedzi niesie action { kind:'centerCamera', q, r, cityId } z właściwymi
 *    współrzędnymi nowego pola (nie miasta)
 *  - kliknięcie: sidePanelEventActionOf(lista, id) zwraca współrzędne tego wpisu; nieznany id
 *    lub wpis bez akcji -> null (main.ts wtedy nie centruje kamery)
 *  - ogólność: akcja działa dla dowolnego wpisu z polem `action`, nie tylko farmy
 * Renderer i main.ts (camCtrl.focusAt) NIE są uruchamiane (boot przeglądarkowy) -> NIE_ZMIERZONO w Chromium.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = process.env.FAH_SRC_DIR || path.join(GRA, 'src');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fahcam-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { buildFarmAssignHintSidePanelEvent, farmAssignHintEventId } from ${JSON.stringify(path.join(SRC, 'game/farm-assign-hint'))};
export { eventTabOf } from ${JSON.stringify(path.join(SRC, 'ui/sidePanelEventTabs'))};
export { sidePanelEventActionOf, SIDE_PANEL_ACTION_LABEL } from ${JSON.stringify(path.join(SRC, 'game/side-panel-event-action'))};
`);
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: bundle,
  logLevel: 'silent',
});
const mod = require(bundle);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) {
    pass += 1;
    console.log('PASS  ' + name);
  } else {
    fail += 1;
    console.log('FAIL  ' + name + (detail !== undefined ? ' -> ' + JSON.stringify(detail) : ''));
  }
}

// Wpis podpowiedzi tak, jak go buduje applyFarmAssignHints (pola hintu jak w farmAssignHintFor).
const hint = {
  cityId: 'city-7',
  q: 12,
  r: -4,
  hexKey: '12,-4',
  improvementKey: 'farma',
  improvementLabel: 'Farma',
  terrainLabel: 'Łąka',
  reason: 'wolny_obywatel',
  freeCitizens: 2,
};
const turn = 41;
const ev = mod.buildFarmAssignHintSidePanelEvent(hint, 'Rzym', turn);

// --- zakładka ---
check('podpowiedź ma flagę important', ev.important === true, ev.important);
check('podpowiedź trafia do zakładki Ważne', mod.eventTabOf(ev) === 'wazne', mod.eventTabOf(ev));
check(
  'regresja: zwykły wpis informacyjny (chatka) nadal w Inne',
  mod.eventTabOf({ title: 'Odkryto chatkę', subtitle: '+20 złota', kind: 'city', blocking: false }) === 'inne',
);
check(
  'regresja: szlak zerwany nadal w Inne',
  mod.eventTabOf({ title: 'Szlak handlowy zerwany', subtitle: 'Rzym ↔ Egipt — brak połączenia', kind: 'city' }) === 'inne',
);
check(
  'regresja: karta blokująca nadal w Ważne',
  mod.eventTabOf({ title: 'Bunt: Ur', subtitle: 'Migracja', kind: 'city', blocking: true }) === 'wazne',
);
check(
  'regresja: dyplomacja nadal ma pierwszeństwo nad important',
  mod.eventTabOf({ title: 'Dyplomacja', subtitle: 'x', kind: 'diplo', important: true }) === 'dyplomacja',
);

// --- akcja ---
check('podpowiedź ma akcję', ev.action !== undefined, ev.action);
check('akcja to centerCamera', ev.action && ev.action.kind === 'centerCamera', ev.action);
check(
  'akcja celuje w NOWE POLE (q, r), nie w miasto',
  ev.action && ev.action.q === 12 && ev.action.r === -4,
  ev.action,
);
check('akcja niesie cityId', ev.action && ev.action.cityId === 'city-7', ev.action);
check('id wpisu zawiera miasto i turę', ev.id === mod.farmAssignHintEventId('city-7', turn), ev.id);
check('etykieta skrótu to Pokaż', mod.SIDE_PANEL_ACTION_LABEL === 'Pokaż', mod.SIDE_PANEL_ACTION_LABEL);

// --- kliknięcie ---
const list = [
  { id: 'inne-1', action: undefined },
  ev,
];
const clicked = mod.sidePanelEventActionOf(list, ev.id);
check('klik w podpowiedź zwraca współrzędne pola', clicked !== null && clicked.q === 12 && clicked.r === -4, clicked);
check('klik w wpis bez akcji zwraca null', mod.sidePanelEventActionOf(list, 'inne-1') === null);
check('klik w nieznany id zwraca null', mod.sidePanelEventActionOf(list, 'brak') === null);

// --- ogólność: dowolne powiadomienie z action działa tak samo ---
const generic = { id: 'cokolwiek-3', action: { kind: 'centerCamera', q: -3, r: 9 } };
const g = mod.sidePanelEventActionOf([generic], 'cokolwiek-3');
check('akcja ogólna (nie farmowa) też centruje na swoich q,r', g !== null && g.q === -3 && g.r === 9, g);

console.log('\nWYNIK: ' + pass + ' PASS / ' + fail + ' FAIL');
fs.rmSync(tmp, { recursive: true, force: true });
if (fail > 0) process.exit(1);
