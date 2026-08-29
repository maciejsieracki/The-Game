'use strict';
/** R-EOT-EVENT-DEFER-Q1=A — helper kolejki wydarzeń EOT */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.eot-defer-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eot-defer-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  shouldDeferEotEvents,
  deferredHintsToSidePanelEvents,
  mergeDeferredEotSideEvents,
} from '../src/game/eot-event-defer.ts';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const B = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('eot-event-defer-test');

ok(B.shouldDeferEotEvents(true), 'defer when EOT in progress');
ok(!B.shouldDeferEotEvents(false), 'no defer when player turn');

const evs = B.deferredHintsToSidePanelEvents([{ msg: '<b>Test</b> hint', durationMs: 3000 }], 42);
ok(evs.length === 1 && evs[0].id.startsWith('eot-hint-42'), 'hints → SidePanelEvent');
ok(!evs[0].subtitle.includes('<'), 'subtitle bez HTML');

// P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1 §Kryteria końca 1a-1e — scalanie identycznych kart info.

// 1a: 3 identyczne hinty (ten sam msg) → 1 SidePanelEvent, z widocznym licznikiem wystąpień.
{
  const dupHints = [
    { msg: 'Wyrąb: +25 Drewna (pozostało 0 tury)', durationMs: 3000 },
    { msg: 'Wyrąb: +25 Drewna (pozostało 0 tury)', durationMs: 3000 },
    { msg: 'Wyrąb: +25 Drewna (pozostało 0 tury)', durationMs: 3000 },
  ];
  const out = B.deferredHintsToSidePanelEvents(dupHints, 10);
  ok(out.length === 1, '1a: 3 identyczne hinty → 1 SidePanelEvent (got ' + out.length + ')');
  ok(out[0].kind === 'info', '1a: scalona karta ma kind info');
  ok(/3/.test(out[0].subtitle) && /wystąpien/i.test(out[0].subtitle),
    '1a: subtitle scalonej karty ma widoczny licznik wystąpień (got: ' + JSON.stringify(out[0].subtitle) + ')');
}

// 1b: 2 różne hinty → 2 osobne SidePanelEvent, bez zmian względem dziś.
{
  const diffHints = [
    { msg: 'Wyrąb: +25 Drewna (pozostało 0 tury)', durationMs: 3000 },
    { msg: 'Wyrąb: +12 Kamienia (pozostało 0 tury)', durationMs: 3000 },
  ];
  const out = B.deferredHintsToSidePanelEvents(diffHints, 11);
  ok(out.length === 2, '1b: 2 różne hinty → 2 osobne SidePanelEvent (got ' + out.length + ')');
  ok(out[0].subtitle === diffHints[0].msg && out[1].subtitle === diffHints[1].msg,
    '1b: subtitle bez dopisku licznika, gdy brak duplikatu');
}

// 1c: kolejność — grupa zajmuje pozycję PIERWSZEGO wystąpienia, nie ostatniego.
{
  const orderHints = [
    { msg: 'A', durationMs: 3000 },
    { msg: 'B', durationMs: 3000 },
    { msg: 'A', durationMs: 3000 },
    { msg: 'C', durationMs: 3000 },
  ];
  const out = B.deferredHintsToSidePanelEvents(orderHints, 12);
  ok(out.length === 3, '1c: 4 hinty (A,B,A,C), 1 duplikat → 3 karty (got ' + out.length + ')');
  ok(out[0].subtitle.startsWith('A') && out[1].subtitle === 'B' && out[2].subtitle === 'C',
    '1c: kolejność A,B,C — scalona grupa A zostaje na pozycji PIERWSZEGO wystąpienia (got '
    + JSON.stringify(out.map(e => e.subtitle)) + ')');
  ok(/2 wystąpienia/i.test(out[0].subtitle), '1c: karta A ma dopisek "2 wystąpienia" (got ' + JSON.stringify(out[0].subtitle) + ')');
}

// 1d: wpisy dyplomatyczne NIE są scalane, nawet identyczne z innymi wpisami dyplomatycznymi.
{
  const diploHints = [
    { msg: 'CywA handluje z CywB: 10 Złota', durationMs: 3000 },
    { msg: 'CywA handluje z CywB: 10 Złota', durationMs: 3000 },
    { msg: 'Dyplomacja: propozycja wygasła — Sojusz', durationMs: 3000 },
    { msg: 'Dyplomacja: propozycja wygasła — Sojusz', durationMs: 3000 },
  ];
  const out = B.deferredHintsToSidePanelEvents(diploHints, 13);
  ok(out.length === 4, '1d: 4 wpisy dyplomatyczne (2 pary identycznych) → 4 osobne karty, ZERO scalania (got ' + out.length + ')');
  ok(out.every(e => e.kind === 'diplo'), '1d: wszystkie 4 wpisy mają kind diplo');
  ok(out.every(e => !/\(\d+ wystąpien/i.test(e.subtitle)),
    '1d: żadna karta diplo nie dostała dopisku licznika wystąpień');
}

// 1e: id wynikowych kart bez kolizji, format eot-hint-${turn}-${i}, i = indeks PO scaleniu.
{
  const mixHints = [
    { msg: 'Wyrąb: +25 Drewna (pozostało 0 tury)', durationMs: 3000 },
    { msg: 'Wyrąb: +25 Drewna (pozostało 0 tury)', durationMs: 3000 },
    { msg: 'Wyrąb: +12 Kamienia (pozostało 0 tury)', durationMs: 3000 },
    { msg: 'CywA handluje z CywB: 10 Złota', durationMs: 3000 },
  ];
  const out = B.deferredHintsToSidePanelEvents(mixHints, 20);
  const expectedIds = [0, 1, 2].map(i => `eot-hint-20-${i}`);
  ok(out.length === 3, '1e: 4 hinty (1 duplikat scalony) → 3 karty (got ' + out.length + ')');
  ok(out.map(e => e.id).join(',') === expectedIds.join(','),
    '1e: id-y bez dziur/kolizji, indeks PO scaleniu (got ' + JSON.stringify(out.map(e => e.id)) + ')');
  ok(new Set(out.map(e => e.id)).size === out.length, '1e: wszystkie id unikalne');
}

// ---------------------------------------------------------------------------------------
// P-WYDARZENIA-NAGLOWEK-KONIEC-TURY-ZBEDNY-Q1 — generyczny placeholder „Koniec tury" znika
// z `title`, specyficzne tytuły ZOSTAJĄ, a dedup nadal rozróżnia realnie różne zdarzenia.
// ---------------------------------------------------------------------------------------

// 2a: zdarzenie bez własnego tytułu (tu: realny przypadek zgłoszony przez właściciela —
// eliminacja miasta-państwa) → `title` PUSTY, cała treść nietknięta w `subtitle`.
{
  const msg = 'Sumerowie · miasto-państwo — ELIMINACJA! Ostatnie miasto zdobyte przez Rzym.';
  const out = B.deferredHintsToSidePanelEvents([{ msg, durationMs: 4000 }], 30);
  ok(out.length === 1, '2a: 1 hint → 1 karta');
  ok(out[0].title === '', `2a: generyczne zdarzenie EOT → title PUSTY '' (got ${JSON.stringify(out[0].title)})`);
  ok(out[0].title !== 'Koniec tury', '2a: placeholder „Koniec tury" NIE wraca do title');
  ok(out[0].subtitle === msg, '2a: konkretna treść w całości zachowana w subtitle (nic nie ginie)');
  ok(out[0].kind === 'info', '2a: kind info bez zmian');
}

// 2b: zdarzenie ze WŁASNYM, specyficznym tytułem („Dyplomacja") NIE traci go przy okazji —
// ten temat kasuje wyłącznie generyczny fallback, nie wszystkie tytuły.
{
  const out = B.deferredHintsToSidePanelEvents(
    [
      { msg: 'Dyplomacja: propozycja wygasła — wojna', durationMs: 4000 },
      { msg: 'Ateny handluje z Sparta', durationMs: 4000 },
    ],
    31,
  );
  ok(out.length === 2, '2b: 2 hinty dyplomatyczne → 2 karty');
  ok(out.every(e => e.title === 'Dyplomacja'),
    '2b: specyficzny tytuł „Dyplomacja" ZACHOWANY (got ' + JSON.stringify(out.map(e => e.title)) + ')');
  ok(out.every(e => e.kind === 'diplo'), '2b: kind diplo bez zmian');
}

// 2c: REGRESJA DEDUP (P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1) po zmianie klucza na sam `subtitle`.
// Dwie RÓŻNE eliminacje miast-państw w tej samej turze — dawniej rozróżniane parą
// (title, subtitle), gdzie title był stałą „Koniec tury"; dziś oba mają title === '', więc
// gdyby ktoś oparł klucz na `title`, zlałyby się w JEDNĄ kartę i właściciel straciłby
// informację o drugiej eliminacji. Muszą zostać DWIE osobne karty, bez licznika wystąpień.
{
  const elim = [
    { msg: 'Sumerowie · miasto-państwo — ELIMINACJA! Ostatnie miasto zdobyte przez Rzym.', durationMs: 4000 },
    { msg: 'Korynt · miasto-państwo — ELIMINACJA! Ostatnie miasto zdobyte przez Greków.', durationMs: 4000 },
  ];
  const out = B.deferredHintsToSidePanelEvents(elim, 32);
  ok(out.length === 2,
    '2c: 2 RÓŻNE eliminacje (oba title === "") → 2 osobne karty, ZERO błędnego scalania (got ' + out.length + ')');
  ok(out[0].subtitle === elim[0].msg && out[1].subtitle === elim[1].msg,
    '2c: obie treści dotarły w całości, bez dopisku licznika');
  ok(new Set(out.map(e => e.id)).size === 2, '2c: id-y obu kart unikalne');
}

// 2d: scalanie identycznych NADAL działa mimo pustego title (klucz = sam subtitle) —
// dopełnienie 2c od drugiej strony: 1a sprawdzało to jeszcze przy title „Koniec tury".
{
  const same = 'Wyrąb: +25 Drewna (pozostało 0 tury)';
  const out = B.deferredHintsToSidePanelEvents(
    [{ msg: same, durationMs: 3000 }, { msg: same, durationMs: 3000 }],
    33,
  );
  ok(out.length === 1, '2d: 2 identyczne hinty przy pustym title → nadal 1 scalona karta (got ' + out.length + ')');
  ok(out[0].title === '', '2d: scalona karta też ma pusty title');
  ok(/2 wystąpienia/i.test(out[0].subtitle),
    '2d: licznik wystąpień nadal dopisany (got ' + JSON.stringify(out[0].subtitle) + ')');
}

const log = [];
B.mergeDeferredEotSideEvents(log, [{ id: 'x', icon: 'i', title: 'T', subtitle: 'S', kind: 'info' }], 4);
ok(log.length === 1 && log[0].id === 'x', 'mergeDeferredEotSideEvents');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
