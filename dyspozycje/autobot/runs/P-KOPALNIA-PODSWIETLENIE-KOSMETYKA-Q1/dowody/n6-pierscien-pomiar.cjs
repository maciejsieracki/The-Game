'use strict';
/**
 * n6-pierscien-pomiar.cjs — P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1, uwaga N6.
 * Dopisany w rundzie 1, faza OBRONY (zarzut 2 Evaluatora).
 *
 * PYTANIE: komentarz w `rangeOverlay.ts` twierdził, że po zasłonięciu przez bryłę reliefu
 * z płaskiego krążka 0,97·HEX_R zostaje „jedynie wąski pierścień". Evaluator zmierzył dla
 * Góry 29–46 % pola krążka i zakwestionował słowo „wąski". Ten skrypt liczy to niezależnie.
 *
 * METODA (bez WebGL — to czysta geometria, nie rasteryzacja):
 *   Płaski krążek leży na wysokości `yOffset` = 0,06 nad wierzchem pryzmu heksa.
 *   Bryła reliefu zasłania go wszędzie tam, gdzie jej powierzchnia jest WYŻEJ niż 0,06.
 *   Dla każdego z 5 wariantów × 2 typów szukamy największego promienia r, na którym
 *   `powierzchniaReliefuY` (raycast po PRODUKCYJNEJ geometrii z `teren-gory-wzgorza.ts`)
 *   przekracza 0,06 — to promień przesłaniania. Pierścień = pole krążka poza tym promieniem.
 *
 * Uruchamianie (z katalogu gra/):
 *   node ../dyspozycje/autobot/runs/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1/dowody/n6-pierscien-pomiar.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA = path.resolve(__dirname, '..', '..', '..', '..', '..', 'gra');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));

// Bundlujemy modul TS do pamieci. `--outDir` C-001 nie dotyczy: nic nie jest zapisywane
// do drzewa repo, a jedyny plik tymczasowy (entry) ma unikalny sufiks PID i jest kasowany.
const entry = path.join(os.tmpdir(), `n6-entry-${process.pid}.ts`);
fs.writeFileSync(entry, `
import * as TGW from '${GRA}/src/render/teren-gory-wzgorza';
(globalThis as any).TGW = TGW;
`, 'utf8');
let code;
try {
  const out = esbuild.buildSync({
    entryPoints: [entry], bundle: true, write: false, format: 'iife',
    platform: 'neutral', target: 'es2020', absWorkingDir: GRA,
  });
  code = Buffer.from(out.outputFiles[0].contents).toString('utf8');
} finally { fs.unlinkSync(entry); }
(0, eval)(code);
const TGW = globalThis.TGW;

const YOFF = 0.06;   // MINE_ELIGIBLE_STYLE.yOffset
const R_TINT = 0.97; // HUG_RELIEF_RADIUS_FRAC — promien plaskiego krazka
const DIRS = 720;
const STEPS = 4000;  // rozdzielczosc promienia 0,00025·R

const rows = [];
for (const typ of ['wzgorze', 'gora']) {
  for (let w = 0; w < TGW.LICZBA_WARIANTOW_TERENU; w++) {
    let rMax = 0;
    for (let d = 0; d < DIRS; d++) {
      const a = (d / DIRS) * Math.PI * 2;
      const cx = Math.cos(a), cz = Math.sin(a);
      for (let s = STEPS; s >= 1; s--) {
        const r = s / STEPS;
        if (TGW.powierzchniaReliefuY(typ, w, 0, r * cx, r * cz) > YOFF) {
          if (r > rMax) rMax = r;
          break;
        }
      }
    }
    const ring = (R_TINT ** 2 - Math.min(rMax, R_TINT) ** 2) / R_TINT ** 2;
    rows.push({ typ, w, rOccl: rMax, ringPct: ring * 100, width: Math.max(0, R_TINT - rMax) });
  }
}

console.log('=== POMIAR N6: pierscien odslonietego krazka (yOffset 0,06 · R_tint 0,97·HEX_R) ===');
for (const r of rows) {
  console.log(`${r.typ.padEnd(8)} wariant ${r.w}  r_przeslaniania=${r.rOccl.toFixed(3)}*R`
    + `  pierscien=${r.ringPct.toFixed(1)}% pola  szerokosc=${r.width.toFixed(3)}*R`);
}
const span = (a, f) => `${Math.min(...a.map(f)).toFixed(3)}-${Math.max(...a.map(f)).toFixed(3)}`;
const pct = (a) => `${Math.min(...a.map(r => r.ringPct)).toFixed(1)}-${Math.max(...a.map(r => r.ringPct)).toFixed(1)}%`;
const wz = rows.filter(r => r.typ === 'wzgorze'), go = rows.filter(r => r.typ === 'gora');
console.log(`\nWZGORZE r_przeslaniania ${span(wz, r => r.rOccl)}*R | pierscien ${pct(wz)} pola`);
console.log(`GORA    r_przeslaniania ${span(go, r => r.rOccl)}*R | pierscien ${pct(go)} pola`);
console.log(`\nWERDYKT: pierscien ${pct(rows)} pola krazka, szerokosc ${span(rows, r => r.width)}*R.`);
console.log('Dla Gory odslonieta czesc siega ~46% pola — okreslenie "jedynie waski pierscien"');
console.log('przeszacowywalo zaslonienie; komentarz w rangeOverlay.ts przepisany na te liczby.');
