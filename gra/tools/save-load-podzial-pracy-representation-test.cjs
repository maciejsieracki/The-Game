'use strict';
/**
 * save-load-podzial-pracy-representation-test.cjs -- R-WEB-SAVE-LOAD-MATRIX-Q1 (SAVEMAT) r3, krok 1.
 *
 * DIAGNOZA bunt/t10 (r2: B!=A tylko cities[city3].podzialPracy -- w A brak pola, w B {procentBudynki:50}).
 * Teza: pole city.podzialPracy przy podzialPracyOverride=false JEST MARTWA REPREZENTACJA -- nie wplywa na zadna
 * wartosc stanu gry, bo resolveCityPodzialPracy (empire-city-defaults.ts) czyta je WYLACZNIE gdy override=true
 * albo gdy brak domyslnej wlasciciela. ensureCityPodzialDefaults (cities.ts, wywolywana przy wczytaniu) dopisuje to
 * pole, a przejecie miasta w ciaglej grze (main.ts: `delete c.podzialPracy`) je kasuje -- stad roznica w zrzucie
 * surowym, ale NIE w efektywnym podziale Pracy (ten sam resolver co silnik: turn-economy.ts -> econCity.podzialPracy).
 *
 * Scenariusze:
 *  S1 override=false + domyslna wlasciciela: resolve PRZED (pole brak) == resolve PO ensureCityPodzialDefaults, dla
 *     wielu wartosci domyslnych wlasciciela i dla roznych "wypelniaczy" pola.
 *  S2 override=true: pole jest zywe (resolve zwraca wartosc pola) -- ensureCityPodzialDefaults jej NIE zmienia.
 *  S3 MUTACJA (dowod nietautologicznosci): resolver z wycieta galezia domyslnej wlasciciela -- S1 MUSI wtedy padac.
 * Uruchom z gra/:  node tools/save-load-podzial-pracy-representation-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-podzial-repr-'));
let pass = 0; let fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };

function build(tag, mutate) {
  const entry = path.join(TMP, tag + '-entry.ts');
  const out = path.join(TMP, tag + '-bundle.cjs');
  fs.writeFileSync(entry,
    `export { ensureCityPodzialDefaults } from ${JSON.stringify(path.join(ROOT, 'src/game/cities.ts'))};\n` +
    `export { resolveCityPodzialPracy } from ${JSON.stringify(path.join(ROOT, 'src/game/empire-city-defaults.ts'))};\n`);
  const plugin = {
    name: 'mutate',
    setup(b) {
      if (!mutate) return;
      b.onLoad({ filter: /empire-city-defaults\.ts$/ }, (a) => {
        const src = fs.readFileSync(a.path, 'utf8');
        const needle = '  if (ownerDefault) {\n    return normalizePodzialPracy(ownerDefault);\n  }\n';
        if (!src.includes(needle)) throw new Error('mutacja: brak fragmentu do wyciecia');
        return { contents: src.replace(needle, ''), loader: 'ts' };
      });
    },
  };
  return esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, absWorkingDir: ROOT, logLevel: 'silent', plugins: [plugin] })
    .then(() => require(out));
}

const mkCity = (over, pp) => {
  const c = { id: 'c1', ownerId: 3, podzialPracyOverride: over };
  if (pp) c.podzialPracy = pp;
  return c;
};

function scenarios(M, label) {
  const results = [];
  for (const ownerPct of [50, 55, 60, 70, 80, 100]) {
    const ownerDefault = { procentBudynki: ownerPct };
    for (const fill of [undefined, { procentBudynki: 50 }, { procentBudynki: 70 }]) {
      // A: miasto bez pola (po przejeciu w ciaglej grze); B: po wczytaniu -> ensureCityPodzialDefaults dopisuje pole.
      const a = mkCity(false, fill);
      const before = M.resolveCityPodzialPracy(a, ownerDefault).procentBudynki;
      const b = mkCity(false, fill); delete b.podzialPracy; // zapis bez pola (jak A)
      M.ensureCityPodzialDefaults(b);
      const after = M.resolveCityPodzialPracy(b, ownerDefault).procentBudynki;
      results.push({ ownerPct, fill: fill ? fill.procentBudynki : null, before, after, fieldAfter: b.podzialPracy ? b.podzialPracy.procentBudynki : null, equal: before === after });
    }
  }
  return results;
}

(async () => {
  try {
    const M = await build('real', false);
    const r = scenarios(M, 'real');
    ok(r.every((x) => x.equal), `S1 override=false: efektywny podzial Pracy PRZED == PO ensureCityPodzialDefaults (${r.length} kombinacji)`);
    ok(r.every((x) => x.fieldAfter !== null), 'S1b ensureCityPodzialDefaults DOPISUJE pole (reprezentacja sie rozni: brak vs {procentBudynki:..})');
    ok(r.every((x) => x.after === x.ownerPct || (x.ownerPct < 50 ? x.after === 50 : false) || x.after === Math.min(Math.max(x.ownerPct, 50), 100)), 'S1c wynik == domyslna wlasciciela (po clampie), nie wartosc dopisanego pola');

    // S2: override=true -> pole zywe
    let s2 = true;
    for (const pct of [50, 60, 75, 100]) {
      const c = mkCity(true, { procentBudynki: pct });
      M.ensureCityPodzialDefaults(c);
      if (M.resolveCityPodzialPracy(c, { procentBudynki: 50 }).procentBudynki !== pct) s2 = false;
    }
    ok(s2, 'S2 override=true: pole zywe -- resolve zwraca wartosc pola, ensureCityPodzialDefaults jej nie zmienia');

    // S3: mutacja
    const MU = await build('mut', true);
    const rm = scenarios(MU, 'mut');
    ok(rm.some((x) => !x.equal), `S3 MUTACJA (wyciecie galezi domyslnej wlasciciela): S1 pada (${rm.filter((x) => !x.equal).length}/${rm.length} kombinacji rozne) -- test nie jest tautologia`);
  } catch (e) {
    fail++; console.log('FAIL wyjatek', e && e.stack || e);
  } finally {
    try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* */ }
  }
  console.log(`\nWYNIK: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();
