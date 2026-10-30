// Generator wektorow P6.M06A7 (partia 1): pangeaAnnularMaxCorridorWidth (gen-helpers.ts :4329)
// i isPangeaBridgeWater (:4371) - obie prywatne, wiec uruchamiane z INSTRUMENTOWANEJ KOPII
// gen-helpers.ts (jedyna zmiana: `export` przed `function`). URUCHAMIA prawdziwy kod TS weba.
//
// Uzycie (z katalogu tego pliku; loader obok):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a7-annular-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>
// WEB_ROOT = `git archive edb8fb56 gra/src gra/data` rozpakowane POZA repo.
// NaN / Infinity zapisane jako napisy "NaN" / "Infinity".
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-m06a7-annular-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const originalSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');

let instrSrc = originalSrc;
for (const name of ['pangeaAnnularMaxCorridorWidth', 'isPangeaBridgeWater']) {
  const before = instrSrc;
  instrSrc = instrSrc.replace(`\nfunction ${name}(`, `\nexport function ${name}(`);
  if (instrSrc === before) throw new Error(`instrumentacja ${name} nie zadzialala`);
}
const instrPath = `${mapDir}/gen-helpers.m06a7-instr.ts`;
writeFileSync(instrPath, instrSrc);

const GI = await import(pathToFileURL(instrPath).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy } = H;

const TB_TO_RUST = {
  [TerenBazowy.Laka]: 'Laka',
  [TerenBazowy.Rownina]: 'Rownina',
  [TerenBazowy.Wzgorza]: 'Wzgorza',
  [TerenBazowy.Gory]: 'Gory',
  [TerenBazowy.PlytkieMorze]: 'PlytkieMorze',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Polarny]: 'Polarny',
};

const enc = (x) => (typeof x === 'number' && !Number.isFinite(x) ? String(x) : x);

// --- annular: pelna siatka 0..300 x 0..300 + duze mapy + przypadki graniczne progow ---
const annular = [];
const seen = new Set();
const push = (w, h) => {
  const key = `${w},${h}`;
  if (seen.has(key)) return;
  seen.add(key);
  annular.push([enc(w), enc(h), enc(GI.pangeaAnnularMaxCorridorWidth(w, h))]);
};
for (let w = 0; w <= 300; w++) for (let h = 0; h <= 300; h++) push(w, h);
for (const w of [400, 600, 700, 800, 873, 900, 1000, 1200, 1500, 2000, 4096]) {
  for (const h of [1, 16, 64, 128, 400, 873, 900, 1000, 2000, 4096]) push(w, h);
}
// Progi zaokraglenia: raw = 6 + sqrt(w*h/20160)*2.6 blisko k+0.5 dla k = 6..23 (oraz clamp 6/22).
// Dla kazdego k i kazdej szerokosci w <= 300 bierzemy h w oknie [h* - 2, h* + 2] wokol rozwiazania.
// Liczniki trafien granicznych (poprawiona definicja, runda Operator-obrona):
// pasmo = |frac(raw) - 0.5| < 0.05 (OBUSTRONNE wokol progu N+0.5; wczesniej Math.round dawal tylko strone dolna).
// Dolny/gorny clamp: wynik 6 / 22. Liczone osobno dla siatki (przed wierszami specjalnymi) i dla wszystkich wierszy.
const countBoundaryHits = (rows) => {
  const c = { pasmo_progu_N_plus_0_5: 0, dolny_clamp_6: 0, gorny_clamp_22: 0 };
  for (const [w, h, res] of rows) {
    if (typeof res !== 'number' || !Number.isFinite(res)) continue;
    const raw = 6 + Math.sqrt((Number(w) * Number(h)) / 20160) * 2.6;
    if (Number.isFinite(raw) && Math.abs(raw - Math.floor(raw) - 0.5) < 0.05) c.pasmo_progu_N_plus_0_5++;
    if (res === 6) c.dolny_clamp_6++;
    if (res === 22) c.gorny_clamp_22++;
  }
  return c;
};
for (let k = 6; k <= 23; k++) {
  const target = k + 0.5; // prog zaokraglenia Math.round
  const s = (target - 6) / 2.6;
  const area = s * s * 20160;
  for (let w = 1; w <= 300; w++) {
    const hs = Math.round(area / w);
    for (let h = hs - 2; h <= hs + 2; h++) if (h >= 0) push(w, h);
  }
}
const trafieniaSiatka = countBoundaryHits(annular);
const trafieniaSiatkaWiersze = annular.length;

// --- wejscia nie-liczbowe / brzegowe ---
const special = [
  [NaN, 10], [10, NaN], [NaN, NaN], [-1, 100], [100, -1], [-100, -100],
  [Infinity, 10], [10, Infinity], [0.5, 0.5], [1.5, 2.5], [2.5, 1.5],
];
for (const [w, h] of special) {
  annular.push([enc(w), enc(h), enc(GI.pangeaAnnularMaxCorridorWidth(w, h))]);
}
const trafieniaWszystkie = countBoundaryHits(annular);

// --- bridge: wszystkie wartosci TerenBazowy ---
const bridge = [];
for (const [tb, name] of Object.entries(TB_TO_RUST)) {
  bridge.push([name, GI.isPangeaBridgeWater(tb)]);
}

const annularOut = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1',
    zrodlo: 'gra/src/map/gen-helpers.ts pangeaAnnularMaxCorridorWidth :4329 (instr. copy)',
    zrodlo_sha256: sha(originalSrc),
    liczba_przypadkow: annular.length,
    trafienia_graniczne: {
      definicja: '|frac(raw) - 0.5| < 0.05, raw = 6 + sqrt(w*h/20160)*2.6 (obustronnie wokol N+0.5); clamp: wynik 6 / 22',
      siatka_przed_wierszami_specjalnymi: { wiersze: trafieniaSiatkaWiersze, ...trafieniaSiatka },
      wszystkie_wiersze: { wiersze: annular.length, ...trafieniaWszystkie },
    },
  },
  cases: { annular },
};
const bridgeOut = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1',
    zrodlo: 'gra/src/map/gen-helpers.ts isPangeaBridgeWater :4371 (instr. copy)',
    zrodlo_sha256: sha(originalSrc),
    liczba_przypadkow: bridge.length,
  },
  cases: { bridge },
};

mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/annular-vectors.json`, JSON.stringify(annularOut));
writeFileSync(`${outDir}/bridge-vectors.json`, JSON.stringify(bridgeOut, null, 1));
console.log(JSON.stringify({ annular: annular.length, bridge: bridge.length, siatka: trafieniaSiatka, wszystkie: trafieniaWszystkie }));
