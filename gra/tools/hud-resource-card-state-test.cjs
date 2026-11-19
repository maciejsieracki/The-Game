'use strict';
/**
 * hud-resource-card-state-test.cjs — R-WEB-UI-HUD-RESOURCE-CARD-STATE-NET-Q1.
 *
 * Run from gra/:  node tools/hud-resource-card-state-test.cjs
 *
 * Karta surowca (resStateOf w empireDetailPanel.ts) ma używać tej samej definicji niedoboru co
 * alert i chip „Surowce” (resourceIsShortage = netto HUD < 0), a nie surowego ratePerTurn < 0.
 * Test bundluje PRAWDZIWY moduł empireDetailPanel.ts (esbuild) i sprawdza:
 *   A. surowiec z konwerterem: ratePerTurn >= 0, netto < 0 po wejściach -> 'bad' (niedobór).
 *   B. ułamkowy deficyt −0,4 (netto zaokrąglone do 0) -> NIE 'bad' (zgodnie z chipem).
 *   C. zwykły niedobór z zużyciem (zużycie > produkcja) -> 'bad'.
 *   D. nadwyżka -> 'good'; pełny magazyn -> 'warn' (bez zmiany).
 *   E. zgodność: karta 'bad' <=> resourceIsShortage na siatce wartości.
 *   M. mutant: wersja z `r.ratePerTurn < 0` MUSI dać inny wynik w przypadku A.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const NO_MUTANTS = process.argv.includes('--no-mutants');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-rcard-'));
const PANEL = path.join(SRC, 'ui', 'empireDetailPanel.ts');
const RGN = path.join(SRC, 'game', 'resource-gross-net.ts');
const OLD_RULE = "if (resourceIsShortage(r)) return 'bad';";
const MUT_RULE = "if (r.ratePerTurn < 0) return 'bad';";

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}

// Moduł panelu wykonuje przy imporcie kilka rejestracji DOM (np. delegacja zdarzeń). Test czysty
// stanu karty nie rysuje — dajemy bezpieczne atrapy globali, żeby sam import się powiódł.
function domStub() {
  const stub = new Proxy(function () {}, {
    get: (t, p) => (p === Symbol.toPrimitive ? () => '' : p === 'length' ? 0 : stub),
    apply: () => stub,
    construct: () => stub,
  });
  return stub;
}
if (typeof globalThis.document === 'undefined') globalThis.document = domStub();
if (typeof globalThis.window === 'undefined') globalThis.window = domStub();
if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = domStub();
if (typeof globalThis.navigator === 'undefined') globalThis.navigator = domStub();

const viteCompat = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw-file' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
  },
};

async function bundlePanel(outName, mutant) {
  const outFile = path.join(TMP, outName + '.cjs');
  const entry = path.join(TMP, outName + '-entry.ts');
  fs.writeFileSync(entry, 'export { resStateOf } from ' + JSON.stringify(PANEL) + ';\n');
  const plugins = [viteCompat];
  if (mutant) {
    plugins.unshift({
      name: 'mutant-rule',
      setup(build) {
        build.onLoad({ filter: /empireDetailPanel\.ts$/ }, (a) => {
          const src = fs.readFileSync(a.path, 'utf8');
          if (!src.includes(OLD_RULE)) throw new Error('mutant anchor not found');
          return { contents: src.replace(OLD_RULE, MUT_RULE), loader: 'ts', resolveDir: path.dirname(a.path) };
        });
      },
    });
  }
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: outFile, logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text' }, plugins,
    // Transitywne moduły UI używają import.meta.glob (Vite); w teście to pusta mapa — nie dotyczy stanu karty.
    define: { 'import.meta.glob': '__ImportMetaGlob' },
    banner: { js: 'var __ImportMetaGlob = function () { return {}; };' },
  });
  return require(outFile);
}

async function bundleRgn() {
  const outFile = path.join(TMP, 'rgn.cjs');
  await esbuild.build({
    entryPoints: [RGN], bundle: true, platform: 'node', format: 'cjs',
    outfile: outFile, logLevel: 'silent', loader: { '.ts': 'ts' },
  });
  return require(outFile);
}

// Wiersz w kształcie EmpireResourceRow (podzbiór potrzebny do stanu i netto).
function row(over) {
  return Object.assign({
    label: 'Test', typ: 'Surowiec', icon: '', stock: 50, ratePerTurn: 0, cap: undefined,
    rateProductionPerTurn: undefined, rateDiploInPerTurn: 0, usage: { buildings: 0, citizens: 0, units: 0 },
    rateConverterInputPerTurn: 0,
  }, over);
}

const CASES = [
  // A: konwerter zjada surowiec — produkcja dodatnia, ale wejścia > produkcja.
  { name: 'A konwerter: rate>=0, netto<0', r: row({ ratePerTurn: 2, rateConverterInputPerTurn: 5 }), want: 'bad' },
  // B: ułamkowy deficyt — netto po zaokrągleniu 0 (chip też nie zgłasza niedoboru).
  { name: 'B ulamkowy deficyt -0.4', r: row({ ratePerTurn: -0.4 }), want: 'good' },
  // C: zwykły niedobór z zużyciem.
  { name: 'C zuzycie > produkcja', r: row({ ratePerTurn: 3, usage: { buildings: 2, citizens: 4, units: 0 } }), want: 'bad' },
  // D: nadwyżka i cap.
  { name: 'D nadwyzka', r: row({ ratePerTurn: 4 }), want: 'good' },
  { name: 'D pelny magazyn', r: row({ ratePerTurn: 4, stock: 100, cap: 100 }), want: 'warn' },
];

(async () => {
  console.log('== A-E. resStateOf (prawdziwy empireDetailPanel.ts)');
  const mod = await bundlePanel('panel', false);
  const rgn = await bundleRgn();
  for (const c of CASES) {
    const got = mod.resStateOf(c.r);
    ok(got === c.want, c.name + ' -> ' + c.want, { got });
  }
  let mism = 0, n = 0;
  for (const rate of [-3, -0.4, 0, 0.4, 1, 2.5, 5]) {
    for (const conv of [0, 0.4, 1, 3, 6]) {
      for (const cit of [0, 1, 2.6]) {
        const r = row({ ratePerTurn: rate, rateConverterInputPerTurn: conv, usage: { buildings: 0, citizens: cit, units: 0 } });
        n++;
        if ((mod.resStateOf(r) === 'bad') !== rgn.resourceIsShortage(r)) mism++;
      }
    }
  }
  ok(mism === 0, 'E siatka ' + n + ' przypadkow: karta bad == resourceIsShortage', { mism });

  if (!NO_MUTANTS) {
    console.log('== M. mutant (ratePerTurn < 0)');
    const mut = await bundlePanel('panel-mut', true);
    ok(mut.resStateOf(CASES[0].r) !== 'bad', 'M mutant: przypadek A NIE jest niedoborem (test A wykrywa mutanta)', { got: mut.resStateOf(CASES[0].r) });
  }

  console.log('\nWYNIK: ' + passes + ' ok, ' + fails + ' FAIL');
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
