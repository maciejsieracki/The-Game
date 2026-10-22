// Szeroki przebieg (sweep) PRAWDZIWEGO kodu weba (gra/src/map/gen-helpers.ts @ edb8fb56) -> JSON na stdout.
// Uzycie: node --experimental-transform-types --import <register.mjs> sweep_web.mjs <WEB_ROOT> > sweep_web.json
// Porownanie z Rust: cmp_sweep.rs.txt (crate scratch poza repo, API publiczne civ-engine).
const root = process.argv[2];
const base = root + '/gra/src/map/';
const gh = await import(base + 'gen-helpers.ts');
const out = { climate: [], climateEarth: [], mulberry: [], dist: [] };
for (let h = 6; h <= 130; h++) {
  const row = [];
  const rowE = [];
  for (let r = 0; r < h; r++) {
    row.push(gh.climateBandAt(0, r, h, false));
    rowE.push(gh.climateBandAt(0, r, h, true));
  }
  out.climate.push([h, row]);
  out.climateEarth.push([h, rowE]);
}
for (let seed = 0; seed < 300; seed++) {
  const f = gh.mulberry32(seed);
  out.mulberry.push([seed, Array.from({ length: 64 }, () => f() * 4294967296)]); // wartosc = u32 dokladnie (f = u32/2^32)
}
for (let dq = -20; dq <= 20; dq++) {
  for (let dr = -20; dr <= 20; dr++) {
    out.dist.push([3, 4, 3 + dq, 4 + dr, gh.hexDistanceAxial(3, 4, 3 + dq, 4 + dr)]);
  }
}
process.stdout.write(JSON.stringify(out));
