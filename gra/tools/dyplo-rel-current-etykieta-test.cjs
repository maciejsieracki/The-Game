'use strict';
/**
 * dyplo-rel-current-etykieta-test.cjs
 *
 * TEMAT: R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1
 *
 * Bramka nietautologiczna (Node, bez przeglądarki — `computePlayerAcceptanceSides` jest
 * czystą logiką, nie dotyka DOM) na REALNEJ, produkcyjnej funkcji
 * `computePlayerAcceptanceSides` (diplomacy-acceptance-points.ts) z actionId='pokoj',
 * odtwarzającej dokładnie scenariusz ze zgłoszenia właściciela: relSigned=-71 →
 * relTotal = relSigned + 100 = 29, treatyBase=500 (z data/diplomacy-acceptance-points.json,
 * pole `traktaty.pokoj.punkty`).
 *
 * PRZED naprawą (P-DYPLO-RELACJA-ETYKIETA-BLEDNA): `buildPlayerSide`/`buildPartnerSide` w
 * `computePeaceAcceptanceSides()` nigdy nie ustawiały `relCurrent` na zwracanych obiektach
 * `AcceptanceSideBalance` — pole zostawało `undefined`, więc UI
 * (`relationRowFromBalance`/render, diplomacyAcceptanceBalance.ts) fallbackowało na stałe
 * 100 (`side.relCurrent ?? my?.relCurrent ?? 100`), niezależnie od realnej relacji użytej
 * do wyliczenia modyfikatora PW.
 *
 * Mutacja W LOCIE (kontrola nietautologiczna): przywraca dokładnie ten defekt (usuwa
 * `relCurrent: relTotal,` z obu `buildPlayerSide`/`buildPartnerSide`) na jednorazowym
 * bundlu — jeśli test PRZED tą mutacją i tak przechodzi (relCurrent===29 mimo cofniętej
 * naprawy), test jest tautologiczny. Nie dotyka repo.
 *
 * Kryterium końca (binarne, z dispatchu): `my.relCurrent === 29` I `their.relCurrent === 29`
 * (obie strony — patrz raport Operatora rundy 1 za uzasadnieniem, dlaczego partner też
 * dostaje realną wartość, nie 100 — zgodnie z analogicznym `computeSideBalance()`, gdzie
 * `relCurrent: relTotal` jest identyczne dla obu ról, bo `relTotal` nie zależy od roli).
 * `canAccept`/bramka bilansu dla pokoju NIE jest tu w ogóle sprawdzana — to świadomie poza
 * zakresem tego tematu (kanon P-DYPLO-BILANS-GATE runda 4 pozostaje nietknięty).
 *
 * Usage (z gra/): node tools/dyplo-rel-current-etykieta-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.dyplo-rel-current-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dyplo-rel-current-bundle.cjs');
const BUNDLE_MUT = path.resolve(__dirname, '.dyplo-rel-current-bundle-mut.cjs');
const ACCEPT_POINTS = path.resolve(GRA, 'src', 'game', 'diplomacy-acceptance-points.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function cleanup() {
  for (const f of [ENTRY, BUNDLE, BUNDLE_MUT]) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
}

function writeEntry() {
  fs.writeFileSync(ENTRY, [
    "/* GENEROWANY PRZEZ dyplo-rel-current-etykieta-test.cjs — nie edytowac recznie. */",
    "import { computePlayerAcceptanceSides } from '../src/game/diplomacy-acceptance-points';",
    "module.exports = { computePlayerAcceptanceSides };",
    "",
  ].join('\n'), 'utf8');
}

/* Cofnięcie naprawy — usuwa DOKŁADNIE te dwie linie dodane w tej rundzie. */
const FIX_LINE_A = 'relationModLabel: modLabel,\n    relCurrent: relTotal,\n    mode,\n    accepted: peaceAccepted';
const FIX_LINE_A_PRZED = 'relationModLabel: modLabel,\n    mode,\n    accepted: peaceAccepted';
const FIX_LINE_B = 'treatyEffectivePn: partnerTreatyPw,\n    relCurrent: relTotal,\n    mode,';
const FIX_LINE_B_PRZED = 'treatyEffectivePn: partnerTreatyPw,\n    mode,';
const mutation = { applied: 0 };
const revertRelCurrentFixPlugin = {
  name: 'revert-rel-current-fix',
  setup(build) {
    build.onLoad({ filter: /diplomacy-acceptance-points\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== ACCEPT_POINTS) return null;
      let src = fs.readFileSync(args.path, 'utf8');
      let out = src.replace(FIX_LINE_A, FIX_LINE_A_PRZED);
      if (out !== src) mutation.applied++;
      const out2 = out.replace(FIX_LINE_B, FIX_LINE_B_PRZED);
      if (out2 !== out) mutation.applied++;
      return { contents: out2, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile,
    absWorkingDir: GRA,
    plugins: mutate ? [revertRelCurrentFixPlugin] : [],
    loader: { '.json': 'json' },
  });
}

async function main() {
  writeEntry();
  try {
    await buildBundle(BUNDLE, false);
    await buildBundle(BUNDLE_MUT, true);
    check('mutacja W LOCIE zastosowana (2 podmiany)', mutation.applied === 2, { applied: mutation.applied });

    delete require.cache[BUNDLE];
    const mod = require(BUNDLE);
    const relSigned = -71;
    const relTotal = relSigned + 100; // = 29, ta sama konwersja co w silniku (relTotal = relSigned+100)
    check('scenariusz: relTotal wejsciowy = 29', relTotal === 29, { relTotal });

    const { my, their } = mod.computePlayerAcceptanceSides('pokoj', {}, relTotal, false);

    console.log('PO NAPRAWIE: my.relCurrent=' + my.relCurrent + ' their.relCurrent=' + their.relCurrent
      + ' (przed naprawa oba byly by 100 — patrz sekcja mutacji nizej)');

    check('my.relCurrent === 29 (nie 100)', my.relCurrent === 29, { relCurrent: my.relCurrent });
    check('their.relCurrent === 29 (nie 100 — zgodnie z computeSideBalance, relTotal niezalezny od roli)',
      their.relCurrent === 29, { relCurrent: their.relCurrent });

    delete require.cache[BUNDLE_MUT];
    const modMut = require(BUNDLE_MUT);
    const mutSides = modMut.computePlayerAcceptanceSides('pokoj', {}, relTotal, false);
    console.log('KONTROLA (mutacja cofajaca naprawe): my.relCurrent=' + mutSides.my.relCurrent
      + ' their.relCurrent=' + mutSides.their.relCurrent + ' (oczekiwane: undefined -> UI fallback 100)');
    check('nietautologiczne: bez naprawy relCurrent jest undefined (fallback UI = 100)',
      mutSides.my.relCurrent === undefined && mutSides.their.relCurrent === undefined,
      { my: mutSides.my.relCurrent, their: mutSides.their.relCurrent });
  } finally {
    cleanup();
  }

  console.log('---');
  console.log('PASS=' + pass + ' FAIL=' + fail);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); cleanup(); process.exit(1); });
