'use strict';
/**
 * ai-move-range-collision-test.cjs -- R-WEB-AI-MOVE-RANGE-Q1 (runda 5).
 * Uruchom z gra/:  node tools/ai-move-range-collision-test.cjs
 *
 * Dowodzi, ze w JEDNEJ turze dwoch barbarzyncow nie wchodzi na ten sam heks:
 *  A. PRAWDZIWE zrodlo ai-move-range.ts (claimHexForMove / buildHexOccupancy), ktore
 *     gałąź `move` i `raid` barbarzyncow w main.ts wola przed zmiana pozycji.
 *  B. Scenariusz tury: dwie komendy `move` na ten sam heks -> druga odrzucona; ruch na
 *     heks zwolniony wczesniej w tej turze -> dozwolony; stos (2 jednostki na heksie)
 *     zwalnia heks dopiero po wyjsciu obu.
 *  C. Mutacja: guard usuniety (claimHexForMove zawsze true) -> test musi CZERWIENIC.
 *  D. Wiazanie: main.ts woła guard w obu galeziach (move i raid) i buduje licznik per tura.
 *
 * Mutacja podmienia tekst PRAWDZIWEGO zrodla w pamieci (esbuild plugin), plikow nie zmienia.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const abs = (rel) => path.join(SRC, rel);

const MUT_GUARD = {
  name: 'guard zajetosci usuniety (claimHexForMove zawsze true)',
  rel: 'game/ai-move-range.ts',
  from: 'if ((occ.get(toKey) ?? 0) > 0) return false;',
  to: 'if (false) return false;',
};

async function makeBundle(tag, mutations) {
  const entry = path.resolve(__dirname, `.ai-collision-${tag}-entry.ts`);
  const bundle = path.resolve(__dirname, `.ai-collision-${tag}-bundle.cjs`);
  fs.writeFileSync(entry, [
    `export { buildHexOccupancy, claimHexForMove } from ${JSON.stringify(abs('game/ai-move-range.ts'))};`,
    `export { keyOf } from ${JSON.stringify(abs('units/setup.ts'))};`,
    '',
  ].join('\n'), 'utf8');
  const muts = mutations.map((m) => ({ ...m, abs: abs(m.rel) }));
  const plugin = {
    name: 'ai-collision-probe',
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        if (!args.path.startsWith(SRC + path.sep)) return undefined;
        let text = fs.readFileSync(args.path, 'utf8');
        for (const m of muts) {
          if (args.path !== m.abs) continue;
          const n = text.split(m.from).length - 1;
          if (n !== 1) throw new Error(`mutacja "${m.name}": wzorzec znaleziony ${n} razy w ${m.rel}`);
          text = text.split(m.from).join(m.to);
        }
        return { contents: text, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
  try {
    await esbuild.build({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: bundle, absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin],
    });
    return require(bundle);
  } finally {
    for (const f of [entry, bundle]) { try { fs.unlinkSync(f); } catch (_) { /* brak */ } }
  }
}

let ok = 0;
let fail = 0;
function assert(c, m) { if (c) { ok++; console.log('  [OK] ' + m); } else { fail++; console.error('  [FAIL] ' + m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

/** Symulacja tury: komendy move w kolejnosci; zwraca [mozliwe ruchy, pozycje]. */
function runTick(M, units, moves) {
  const occ = M.buildHexOccupancy(units, M.keyOf);
  const pos = units.map((u) => ({ ...u }));
  const done = [];
  for (const [idx, to] of moves) {
    const u = pos[idx];
    const from = M.keyOf(u.q, u.r);
    const toKey = M.keyOf(to.q, to.r);
    if (!M.claimHexForMove(occ, from, toKey)) { done.push(false); continue; }
    u.q = to.q; u.r = to.r;
    done.push(true);
  }
  return { done, pos };
}

async function main() {
  console.log('== collision-test (R-WEB-AI-MOVE-RANGE-Q1 r5) ==');
  const M = await makeBundle('main', []);
  const M_MUT = await makeBundle('mut-guard', [MUT_GUARD]);

  console.log('A. dwa barbarzyncy, ten sam heks docelowy');
  {
    const units = [{ q: 1, r: 0 }, { q: 3, r: 0 }];
    const { done, pos } = runTick(M, units, [[0, { q: 2, r: 0 }], [1, { q: 2, r: 0 }]]);
    eq(done[0], true, 'pierwszy barbarzynca wchodzi na (2,0)');
    eq(done[1], false, 'drugi barbarzynca NIE wchodzi na (2,0) zajety w tej turze');
    eq(pos[1].q === 3 && pos[1].r === 0, true, 'drugi barbarzynca stoi na swoim heksie (3,0)');
  }

  console.log('B. heks zwolniony wczesniej w tej turze jest dostepny');
  {
    const units = [{ q: 1, r: 0 }, { q: 2, r: 1 }];
    // A: (1,0)->(2,0); B: (2,1)->(1,0) (zwolnione przez A) -> dozwolone
    const { done } = runTick(M, units, [[0, { q: 2, r: 0 }], [1, { q: 1, r: 0 }]]);
    eq(done[0], true, 'A wchodzi na (2,0)');
    eq(done[1], true, 'B wchodzi na (1,0), ktore A zwolnil w tej turze');
  }

  console.log('C. stos: heks zwalnia sie dopiero po wyjsciu obu jednostek');
  {
    const units = [{ q: 1, r: 0 }, { q: 1, r: 0 }, { q: 4, r: 0 }];
    const { done } = runTick(M, units, [
      [0, { q: 2, r: 0 }], // jeden z dwoch wychodzi -> (1,0) nadal zajety przez drugiego
      [2, { q: 1, r: 0 }], // proba wejscia na (1,0) -> odrzucona
      [1, { q: 3, r: 0 }], // drugi wychodzi -> (1,0) wolny
      [2, { q: 1, r: 0 }], // ponowna proba -> dozwolona
    ]);
    eq(done[0], true, 'pierwszy z stosu wychodzi');
    eq(done[1], false, 'wejscie na heks wciaz zajety przez drugiego z stosu odrzucone');
    eq(done[2], true, 'drugi z stosu wychodzi');
    eq(done[3], true, 'po opuszczeniu heksu wejscie dozwolone');
  }

  console.log('D. wiazanie w main.ts: guard w galeziach move i raid, licznik per tura');
  {
    const mainSrc = fs.readFileSync(abs('main.ts'), 'utf8');
    const calls = mainSrc.split('claimHexForMove(barbOcc,').length - 1;
    eq(calls, 2, 'main.ts: claimHexForMove(barbOcc, ...) w galeziach move i raid (2 wywolania)');
    eq(mainSrc.split('const barbOcc = buildHexOccupancy(units, keyOf);').length - 1, 1,
      'main.ts: licznik barbOcc budowany raz per tura przed petla komend');
  }

  console.log('E. mutacja: guard usuniety musi czerwienic test A');
  {
    const units = [{ q: 1, r: 0 }, { q: 3, r: 0 }];
    const { done } = runTick(M_MUT, units, [[0, { q: 2, r: 0 }], [1, { q: 2, r: 0 }]]);
    // Dowod czerwienienia: asercja A wymaga done[1] === false; mutacja daje true -> FAIL w A.
    eq(done[1], true, 'mutacja: drugi barbarzynca wchodzi na zajety heks (asercja A by tu czerwienila)');
  }

  console.log(`\nWYNIK: ${ok} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
