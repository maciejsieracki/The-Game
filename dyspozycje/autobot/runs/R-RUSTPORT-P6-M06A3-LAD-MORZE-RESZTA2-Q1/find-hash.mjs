// Szuka wejsc (q,r,seed=0) dla hashInt3 o dokladnie zadanych u = h*2^32 (progi 0.5/0.7/0.85, N-1/N/N+1).
// Logika hashInt3 skopiowana 1:1 z gra/src/map/gen-helpers.ts:899-904 (edb8fb56); wynik weryfikowany
// ppozniej przez prawdziwy modul weba (generator).
const K1 = 374761393, K2 = 668265263;
const hashInt3 = (a, b, c) => {
  let h = (a * K1) ^ (b * K2) ^ (c * 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
};
const inv = (k) => { let x = k; for (let i = 0; i < 6; i++) x = Math.imul(x, 2 - Math.imul(k, x)); return x; };
const unx = (y, s) => { let x = y; for (let i = 0; i < 5; i++) x = y ^ (x >>> s); return x; };
const invK1 = inv(1274126177);
const invK2 = inv(K2);
function preimageX(u) { // zwraca X (int32) takie, ze mix(X) = u
  const h1 = unx(u | 0, 16);
  const m = Math.imul(h1, invK1);
  return unx(m, 13);
}
const T = JSON.parse(process.argv[2]); // [{u:..., tag:...}]
const need = new Map(T.map((t) => [t.u, t]));
const targets = T.map((t) => ({ ...t, X: preimageX(t.u) }));
// Sprawdz odwrotnosc
for (const t of targets) {
  const h = hashInt3(0, 0, 0); void h;
}
const found = {};
const LIM = 1 << 23;
for (let a = 0; a < LIM; a++) {
  const T1 = (a * K1) | 0;
  for (const t of targets) {
    if (found[t.u] && found[t.u].length >= 3) continue;
    const T2 = (t.X ^ T1) | 0;
    const b = Math.imul(T2, invK2);
    if (b >= -LIM && b < LIM) {
      if (((b * K2) | 0) !== T2) continue;
      const q = a, r = b;
      const h = hashInt3(q, r, 0);
      if (Math.round(h * 4294967296) !== t.u) continue;
      (found[t.u] ||= []).push([q, r]);
    }
  }
}
console.log(JSON.stringify(found));
