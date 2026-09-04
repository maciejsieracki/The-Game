'use strict';
/**
 * auto-battle-przewaga-monotonicznosc-test.cjs
 * R-WALKA-PRZEWAGA-LICZEBNA-Q1-W1 — bramka na arytmetykę strat auto-bitwy mapy.
 *
 * Pilnuje DWÓCH rzeczy naraz (obie są warunkiem koniecznym naprawy):
 *  1. wykładnik p_atk/p_def = 1.20 — ŁĄCZNE straty zwycięzcy maleją z przewagą;
 *  2. L_MIN jako podłoga na SUMIE strat składu, a nie na każdej jednostce.
 *
 * Kluczowa własność: suma strat zwycięzcy = lossPct × r (procent na jednostkę
 * razy liczebność składu; r jest tu jednocześnie stosunkiem sił i liczbą
 * jednostko-równoważników zwycięzcy). Przy podłodze NA JEDNOSTCE suma zawraca
 * przy dużym r (10:1 → 0,500, 20:1 → 1,000) i ciąg PRZESTAJE być malejący,
 * nawet gdy wykładnik jest już poprawny — dlatego jest osobna asercja-pułapka.
 *
 * Run: node gra/tools/auto-battle-przewaga-monotonicznosc-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.auto-battle-przewaga-entry.ts');
const BUNDLE = path.join(__dirname, '.auto-battle-przewaga-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `
import { resolveAutoBattleByPower } from '../src/game/auto-battle-power';
import { loadAutoBattleParams } from '../src/game/auto-battle-params';
export { resolveAutoBattleByPower, loadAutoBattleParams };
`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const { resolveAutoBattleByPower, loadAutoBattleParams } = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}

const TOL = 0.005;
const RATIOS = [1.5, 2, 3, 5, 10, 20];

/** Tabela docelowa z GOAL dispatchu (przeliczona niezależnie). */
const OCZEKIWANE = {
  1.5: { sumaZwyciezca: 0.387, pctPrzegrany: 0.742 },
  2: { sumaZwyciezca: 0.366, pctPrzegrany: 0.817 },
  3: { sumaZwyciezca: 0.337, pctPrzegrany: 0.888 },
  5: { sumaZwyciezca: 0.304, pctPrzegrany: 0.939 },
  10: { sumaZwyciezca: 0.265, pctPrzegrany: 0.973 },
  20: { sumaZwyciezca: 0.231, pctPrzegrany: 0.988 },
};

const p = loadAutoBattleParams();

// --- 1. Parametry z JSON -----------------------------------------------------
assert(p.p_atk === 1.2, `p_atk === 1.2 (jest ${p.p_atk})`);
assert(p.p_def === 1.2, `p_def === 1.2 (jest ${p.p_def})`);
assert(p.L_MAX === 0.42, `L_MAX === 0.42 (jest ${p.L_MAX})`);
assert(p.L_MIN === 0.05, `L_MIN === 0.05 (jest ${p.L_MIN})`);

// --- 2. Przebieg realnego solvera -------------------------------------------
// rng: () => 1 wyklucza upset, więc atakujący z przewagą zawsze wygrywa.
const wyniki = RATIOS.map((r) => {
  const res = resolveAutoBattleByPower({ mAtk: 100 * r, mDef: 100, rng: () => 1 });
  return {
    r,
    winner: res.winner,
    pctZwyciezcaNaJednostke: res.lossAtkPct,
    sumaZwyciezca: res.lossAtkPct * r,
    pctPrzegrany: res.lossDefPct,
  };
});

for (const w of wyniki) {
  assert(w.winner === 'attacker', `r=${w.r}: atakujący z przewagą wygrywa`);
  const oczek = OCZEKIWANE[w.r];
  assert(
    Math.abs(w.sumaZwyciezca - oczek.sumaZwyciezca) <= TOL,
    `r=${w.r}: suma strat zwycięzcy ${w.sumaZwyciezca.toFixed(4)} ~ ${oczek.sumaZwyciezca} (±${TOL})`,
  );
  assert(
    Math.abs(w.pctPrzegrany - oczek.pctPrzegrany) <= TOL,
    `r=${w.r}: straty przegranego ${w.pctPrzegrany.toFixed(4)} ~ ${oczek.pctPrzegrany} (±${TOL})`,
  );
}

// --- 3. Ścisła monotoniczność łącznych strat zwycięzcy ------------------------
for (let i = 1; i < wyniki.length; i++) {
  const prev = wyniki[i - 1];
  const cur = wyniki[i];
  assert(
    cur.sumaZwyciezca < prev.sumaZwyciezca,
    `monotoniczność: suma strat przy r=${cur.r} (${cur.sumaZwyciezca.toFixed(4)}) < przy r=${prev.r} (${prev.sumaZwyciezca.toFixed(4)})`,
  );
}

// Straty przegranego rosną ściśle z przewagą (lustro tej samej własności).
for (let i = 1; i < wyniki.length; i++) {
  assert(
    wyniki[i].pctPrzegrany > wyniki[i - 1].pctPrzegrany,
    `straty przegranego rosną: r=${wyniki[i].r} > r=${wyniki[i - 1].r}`,
  );
}

// --- 4. PUŁAPKA: podłoga L_MIN liczona PO STAREMU (na jednostce) --------------
// Odtworzenie starej reguły wprost z parametrów, niezależnie od kodu źródłowego.
// Ma udowodnić, że bramka rzeczywiście rozróżnia oba warianty podłogi.
const cap = Math.min(1, p.coef_zwyciezca * p.L_MAX);
const poStaremu = RATIOS.map((r) => {
  const core = p.L_MAX / Math.pow(r, p.p_atk);
  const perUnit = Math.max(p.L_MIN, Math.min(cap, p.coef_zwyciezca * core));
  return { r, suma: perUnit * r };
});

const staryCiagMalejacy = poStaremu.every((x, i) => i === 0 || x.suma < poStaremu[i - 1].suma);
assert(
  !staryCiagMalejacy,
  'pułapka (C): przy L_MIN na jednostce ciąg NIE jest malejący — bramka musi to wykrywać',
);

const stare20 = poStaremu[poStaremu.length - 1].suma;
const stare5 = poStaremu.find((x) => x.r === 5).suma;
assert(
  stare20 > stare5,
  `pułapka (C): stara podłoga zawraca sumę (20:1 = ${stare20.toFixed(3)} > 5:1 = ${stare5.toFixed(3)})`,
);

// Realny solver MUSI się różnić od starej reguły tam, gdzie podłoga gryzła.
for (const r of [10, 20]) {
  const zywe = wyniki.find((w) => w.r === r).sumaZwyciezca;
  const stare = poStaremu.find((x) => x.r === r).suma;
  assert(
    stare - zywe > TOL,
    `r=${r}: solver nie stosuje już podłogi na jednostce (żywe ${zywe.toFixed(4)} << stare ${stare.toFixed(4)})`,
  );
}

// --- 5. L_MIN nadal działa jako podłoga na SUMIE ------------------------------
// Sonda musi być ROZSTRZYGAJĄCA: przy r=1000 samo `raw` (0,0001 × 1000 = 0,1)
// przechodzi bez udziału podłogi, więc taka asercja jest tautologiczna. Podłoga
// `L_MIN / r` przewyższa `raw` dopiero od r ≈ 41 821, ale już od r ≈ 1866
// zaokrąglenie `raw` do 4 miejsc daje 0 — i to tam podłoga jest jedynym, co
// trzyma sumę. Dlatego sondujemy r = 2000, 5000 i 50 000.
for (const rBig of [2000, 5000, 50000]) {
  const ekstremum = resolveAutoBattleByPower({ mAtk: 100 * rBig, mDef: 100, rng: () => 1 });
  const suma = ekstremum.lossAtkPct * rBig;
  assert(
    suma >= p.L_MIN - 1e-9,
    `podłoga na sumie: r=${rBig} suma strat zwycięzcy ${suma.toFixed(5)} >= L_MIN ${p.L_MIN}`,
  );
  // Bez podłogi (albo z podłogą zjedzoną przez zaokrąglenie) suma byłaby 0,00000.
  assert(
    suma > 1e-9,
    `podłoga na sumie: r=${rBig} suma NIE może być zerowa (zwycięzca bez strat)`,
  );
}
// Kontrola dolnej granicy zakresu grywalnego: podłoga nie może podnosić wartości
// z tabeli GOAL — przy r=20 rządzi `raw`, nie `L_MIN / r`.
const r20 = resolveAutoBattleByPower({ mAtk: 2000, mDef: 100, rng: () => 1 });
assert(
  r20.lossAtkPct > p.L_MIN / 20 + 1e-9,
  `w zakresie grywalnym (r=20) rządzi raw ${r20.lossAtkPct}, nie podłoga ${p.L_MIN / 20}`,
);

console.log('r     | %/jedn. zwycięzcy | suma strat zwycięzcy | % strat przegranego');
for (const w of wyniki) {
  console.log(
    `${String(w.r).padEnd(5)} | ${w.pctZwyciezcaNaJednostke.toFixed(4).padEnd(17)} | ${w.sumaZwyciezca.toFixed(4).padEnd(20)} | ${(w.pctPrzegrany * 100).toFixed(1)}%`,
  );
}
console.log(`auto-battle-przewaga-monotonicznosc-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
