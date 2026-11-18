'use strict';
/**
 * notif-other-civ-diplo-tab-test.cjs
 * R-WEB-UI-NOTIF-OTHER-CIV-EVENTS-TO-DIPLOMACY-TAB-Q1 — wydarzenia MIĘDZY innymi cywilizacjami
 * (gracz nie jest stroną, np. kapitulacja z głodu Chengdu przejęte przez Rzymian) trafiają do
 * zakładki „Dyplomacja”, a wydarzenia z udziałem gracza zostają w „Ważne”.
 *
 * POKRYCIE:
 *  (1) deferredHintsToSidePanelEvents: hint z origin 'other-civs' niesie origin na wpisie panelu
 *  (2) eventTabOf: wpis origin 'other-civs' (kapitulacja między innymi) -> 'dyplomacja'
 *  (3) bez origin ta sama treść -> 'wazne' (kontrola)
 *  (4) main.ts: origin 'other-civs' przekazany do showHintMessage tylko gdy !isHuman(oldOwner) && !isHuman(newOwner)
 *  (5) mutacja (w pamięci, bez zapisu do src/): cofnięcie propagacji origin -> wpis wraca do 'wazne'
 *
 * Usage (z gra/): node tools/notif-other-civ-diplo-tab-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.notif-other-civ-entry.ts');
const BUNDLE = path.join(__dirname, '.notif-other-civ-bundle.cjs');
const MUT_BUNDLE = path.join(__dirname, '.notif-other-civ-mut-bundle.cjs');

let pass = 0;
let fail = 0;
function check(cond, msg, extra) {
  if (cond) { pass++; console.log('  [OK]', msg); }
  else { fail++; console.error('  [FAIL]', msg, extra !== undefined ? JSON.stringify(extra) : ''); }
}

const CHENGDU = 'Chengdu — kapitulacja z głodu! Miasto przejęte przez Rzymian. Ludność: +6 · Budynki: +13 · Łup: brak · Ludność: −1 (straty zdobycia)';

fs.writeFileSync(
  ENTRY,
  "export { eventTabOf, captureEventOrigin } from '../src/ui/sidePanelEventTabs';\n"
    + "export { deferredHintsToSidePanelEvents } from '../src/game/eot-event-defer';\n",
);
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
});
const { eventTabOf, deferredHintsToSidePanelEvents, captureEventOrigin } = require(BUNDLE);

console.log('notif-other-civ-diplo-tab-test (R-WEB-UI-NOTIF-OTHER-CIV-EVENTS-TO-DIPLOMACY-TAB-Q1)\n');

// (1)-(3) klasyfikacja przez prawdziwą ścieżkę hint -> wpis panelu -> zakładka
const withOrigin = deferredHintsToSidePanelEvents([{ msg: CHENGDU, durationMs: 6000, cityId: 'c1', ownerId: 2, origin: 'other-civs' }], 7);
const noOrigin = deferredHintsToSidePanelEvents([{ msg: CHENGDU, durationMs: 6000, cityId: 'c1', ownerId: 2 }], 7);
check(withOrigin.length === 1 && withOrigin[0].origin === 'other-civs', '(1) origin propagowany na wpis panelu', withOrigin);
check(noOrigin.length === 1 && noOrigin[0].origin === undefined, '(1b) bez origin wpis bez origin', noOrigin);
check(eventTabOf(withOrigin[0]) === 'dyplomacja', '(2) kapitulacja między innymi (origin) -> dyplomacja', eventTabOf(withOrigin[0]));
check(eventTabOf(noOrigin[0]) === 'wazne', '(3) ta sama treść bez origin -> wazne (kontrola)', eventTabOf(noOrigin[0]));

// Gracz-strona: origin nie jest ustawiany (main.ts) -> pozostaje w „Ważne”
const playerSide = deferredHintsToSidePanelEvents([{ msg: 'Ur — kapitulacja z głodu! Miasto przejęte przez Rzymian.', durationMs: 5500, ownerId: 0 }], 7);
check(eventTabOf(playerSide[0]) === 'wazne', '(3b) kapitulacja z udziałem gracza -> wazne', eventTabOf(playerSide[0]));

// (4) predykat zachowaniowy: origin tylko gdy gracz nie jest ani starym, ani nowym właścicielem
check(captureEventOrigin(false, false) === 'other-civs', '(4a) AI→AI (gracz poza stronami) -> other-civs', captureEventOrigin(false, false));
check(captureEventOrigin(true, false) === undefined, '(4b) gracz = poprzedni właściciel -> brak origin', captureEventOrigin(true, false));
check(captureEventOrigin(false, true) === undefined, '(4c) gracz = zdobywca -> brak origin', captureEventOrigin(false, true));
check(captureEventOrigin(true, true) === undefined, '(4d) gracz po obu stronach -> brak origin', captureEventOrigin(true, true));
// (4e) strażnik wiringu: main.ts wywołuje predykat i przekazuje origin do showHintMessage
const mainTs = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
check(mainTs.includes('const capitulationOrigin = captureEventOrigin(isHuman(oldOwner), isHuman(newOwner));'),
  '(4e) main.ts: origin liczony predykatem captureEventOrigin(isHuman(oldOwner), isHuman(newOwner))');
check(mainTs.includes("...(capitulationOrigin ? { origin: capitulationOrigin } : {}),"),
  '(4f) main.ts: origin przekazany do showHintMessage gdy ustawiony');

// (5) mutacja w pamięci: cofnięcie propagacji origin w eot-event-defer.ts (nic nie zapisuje do src/)
const defSrc = fs.readFileSync(path.join(GRA, 'src', 'game', 'eot-event-defer.ts'), 'utf8');
const needle = "isAiAiTrade || h.origin === 'other-civs'";
check(defSrc.includes(needle), '(5) mutacja: wzorzec propagacji obecny w źródle');
const mutated = defSrc.replace(needle, 'isAiAiTrade');
esbuild.buildSync({
  stdin: { contents: mutated, resolveDir: path.join(GRA, 'src', 'game'), loader: 'ts', sourcefile: 'eot-event-defer-mut.ts' },
  bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: MUT_BUNDLE, logLevel: 'silent',
});
const sidePanelMut = require(MUT_BUNDLE);
const mutEv = sidePanelMut.deferredHintsToSidePanelEvents([{ msg: CHENGDU, durationMs: 6000, ownerId: 2, origin: 'other-civs' }], 7);
check(eventTabOf(mutEv[0]) === 'wazne', '(5b) mutacja cofa klasyfikację do wazne (test (2) byłby czerwony)', eventTabOf(mutEv[0]));

console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
