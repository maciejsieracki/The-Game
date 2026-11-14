// Generuje wektory z URUCHOMIONEGO kodu weba (origin/main 638e90bea, gra/src/game/diplomacy-peace-lock.ts).
const m = await import(process.env.SCR + '/webarch/gra/src/game/diplomacy-peace-lock.ts');
const out = [];
const lit = (x) => {
  if (x === null || x === undefined) return 'None';
  if (typeof x === 'number') {
    if (Number.isNaN(x)) return 'f64::NAN';
    if (x === Infinity) return 'f64::INFINITY';
    if (x === -Infinity) return 'f64::NEG_INFINITY';
    const s = String(x);
    return /[.eE]/.test(s) ? s : s + '.0';
  }
  return String(x);
};
const opt = (x) => (x === null || x === undefined ? 'None' : `Some(${lit(x)})`);

// 1. truceEndAiAccepts (prog domyslny 0.20 z WAR_PEACE_PARAMS)
const nums = [0, 1, 5, 10, 79.999, 80, 80.0000001, 80.001, 100, 150, 1000, -1, NaN, Infinity];
const aiRows = [];
for (const p of nums) for (const a of nums) {
  aiRows.push([p, a, m.truceEndAiAccepts(p, a)]);
}
out.push('const WEB_AI_ACCEPTS: &[(f64, f64, bool)] = &[');
for (const [p, a, r] of aiRows) out.push(`    (${lit(p)}, ${lit(a)}, ${r}),`);
out.push('];');

// 2. truceEndOfferTarget
const tgtRows = [];
for (const init of [null, undefined, 1, 2, 3]) tgtRows.push([init, m.truceEndOfferTarget(init, 1, 2)]);
out.push('const WEB_OFFER_TARGET: &[(Option<u32>, Option<u32>)] = &[');
for (const [i, r] of tgtRows) out.push(`    (${i == null ? 'None' : 'Some(' + i + ')'}, ${r == null ? 'None' : 'Some(' + r + ')'}),`);
out.push('];');

// 3. truceEndOfferExpired
const expRows = [];
for (const o of [5, 10]) for (const c of [4, 5, 6, 11]) expRows.push([o, c, m.truceEndOfferExpired(o, c)]);
out.push('const WEB_OFFER_EXPIRED: &[(f64, f64, bool)] = &[');
for (const [o, c, r] of expRows) out.push(`    (${lit(o)}, ${lit(c)}, ${r}),`);
out.push('];');

// 4. isTruceWindowBreach(meta, turn)
const brRows = [];
const metas = [
  [undefined, null],
  [{}, 5],
  [{ truceUntilTurn: 15, truceEndOffer: null }, 14],
  [{ truceUntilTurn: 15, truceEndOffer: null }, 15],
  [{ truceUntilTurn: null, truceEndOffer: { turn: 3 } }, 4],
  [{ truceUntilTurn: undefined, truceEndOffer: undefined }, 4],
];
for (const [meta, t] of metas) brRows.push([meta === undefined ? null : meta, t, m.isTruceWindowBreach(meta, t)]);
out.push('const WEB_WINDOW_BREACH: &[(Option<f64>, bool, f64, bool)] = &[');
for (const [meta, t, r] of brRows) {
  const until = meta && meta.truceUntilTurn != null ? meta.truceUntilTurn : null;
  const hasOffer = !!(meta && meta.truceEndOffer != null);
  out.push(`    (${opt(until)}, ${hasOffer}, ${lit(t)}, ${r}),`);
}
out.push('];');

// 5. normalizeTruceDuration / truceUntilTurn
const durRows = [5, 10, 15, 7, 0, 5.5, null, undefined, NaN, Infinity, -5];
out.push('const WEB_DURATION: &[(Option<f64>, Option<f64>)] = &[');
for (const d of durRows) {
  const r = m.normalizeTruceDuration(d);
  out.push(`    (${d == null || Number.isNaN(d) || d === Infinity ? (d === Infinity ? 'Some(f64::INFINITY)' : (Number.isNaN(d) ? 'Some(f64::NAN)' : 'None')) : 'Some(' + lit(d) + ')'}, ${opt(r)}),`);
}
out.push('];');

// 6. aiTruceOrPeaceMode grid
const modeRows = [];
for (const fat of [0, 0.99, 1, 1.2])
  for (const will of [0.5, 0.69, 0.7])
    for (const z of [59, 60])
      for (const weaker of [false, true])
        for (const fb of ['pokoj', 'rozejm']) {
          const r = m.aiTruceOrPeaceMode({ fatigueFraction: fat, willingnessPeace: will, zaufanie: z, weaker, fallbackKind: fb });
          modeRows.push([fat, will, z, weaker, fb, r]);
        }
out.push('const WEB_MODE: &[(f64, f64, f64, bool, bool, bool)] = &[');
for (const [fat, will, z, w, fb, r] of modeRows) out.push(`    (${lit(fat)}, ${lit(will)}, ${lit(z)}, ${w}, ${fb === 'pokoj'}, ${r === 'pokoj'}),`);
out.push('];');

// 7. peaceFinalizeTrustEvent
out.push('const WEB_TRUST_EVENT: &[(Option<f64>, bool)] = &[');
for (const t of [5, 10, 15, 7, 0, null, undefined]) {
  const r = m.peaceFinalizeTrustEvent(t);
  out.push(`    (${t == null ? 'None' : 'Some(' + lit(t) + ')'}, ${r === 'pokoj'}),`);
}
out.push('];');

console.log(out.join('\n'));
