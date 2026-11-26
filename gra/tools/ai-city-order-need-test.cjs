'use strict';
/**
 * ai-city-order-need-test.cjs -- R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1 (AICULT, #189).
 *
 * Kontrakt funkcji potrzeby garnizonu (gra/src/game/ai-city-order-need.ts):
 *   N1 poziom: normalny i trudny wlaczaja potrzebe; latwy i tryb zgodnosci (null) -- nie;
 *   N2 miasto juz poza buntem skrajnym -> 0 jednostek (nic nie dokladamy);
 *   N3 granica: PorPct rowno 12 (prog buntu) NIE jest buntem skrajnym -> 0;
 *   N4 minimalna liczba: 1 jednostka wystarcza, gdy 1 jednostka wyciaga Porzadek nad prog;
 *   N4b 2 jednostki, gdy 1 daje za malo;
 *   N5 brak drogi wyjscia (zero punktow za jednostke) -> zwraca capUnits;
 *   N6 wynik w zakresie [0, capUnits].
 * Mutacje (kopie bundla): M1 zwrot capUnits zamiast minimum, M2 porzadek ignorowany,
 * M3 latwy wlaczony -- kazda MUSI zlamac co najmniej jedna asercje.
 *
 * Uwaga: zgodnosc z tabela CULTMODEL2 (normalny 3/3, trudny 4 dla pop 5, epoka 1, obca kultura
 * i religia) wymaga pelnego wejscia z silnika miasta -- NIE jest tu sprawdzana.
 *
 * Run (z gra/): node tools/ai-city-order-need-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const WORK = fs.mkdtempSync(path.join(process.env.GARRISON_TMP || os.tmpdir(), 'aion-'));
const ENTRY = path.join(WORK, 'entry.ts');
fs.writeFileSync(ENTRY, `
export { aiCityGarrisonNeed, aiGarrisonNeedApplies } from ${JSON.stringify(path.join(SRC, 'game', 'ai-city-order-need.ts'))};
`);

let counter = 0;
async function buildBundle(mutation) {
  counter++;
  const out = path.join(WORK, `bundle-${counter}.cjs`);
  const plugin = {
    name: 'mutate-order-need',
    setup(b) {
      if (!mutation) return;
      b.onLoad({ filter: /ai-city-order-need\.ts$/ }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        const [find, repl] = mutation;
        if (text.split(find).length !== 2) throw new Error(`mutacja: brak dokladnie 1x "${find}"`);
        return { contents: text.replace(find, repl), loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: out,
    logLevel: 'silent', plugins: [plugin],
  });
  return require(out);
}

let pass = 0, fail = 0;
let quiet = false;
function check(name, cond, detail) {
  if (cond) { pass++; return; }
  fail++;
  if (!quiet) console.log(`FAIL ${name} ${detail || ''}`);
}

// Parametry testowe: wagi 0,5/0,5 (domyslne), prawPctCap 170, cap 5 jednostek, 20 pkt za jednostke.
const BASE = { szPct: 0, prawPctCap: 170, capUnits: 5, perUnit: 20 };

function runAll(m) {
  const { aiCityGarrisonNeed, aiGarrisonNeedApplies } = m;
  // N1
  check('N1 latwy nie wlacza', aiGarrisonNeedApplies('latwy') === false);
  check('N1 zgodnosc (null) nie wlacza', aiGarrisonNeedApplies(null) === false);
  check('N1 normalny wlacza', aiGarrisonNeedApplies('normalny') === true);
  check('N1 trudny wlacza', aiGarrisonNeedApplies('trudny') === true);
  // N2: 100% Szczescia + Prawo z budynkow -> PorPct >= 12 bez garnizonu
  check('N2 poza buntem -> 0',
    aiCityGarrisonNeed({ ...BASE, szPct: 100, prawoNettoBezGarnizonu: 50, prawMax: 100 }) === 0);
  // N3: PorPct = 0,5*0 + 0,5*24 = 12 -> prog buntu, nie skrajny -> 0
  check('N3 granica 12 -> 0',
    aiCityGarrisonNeed({ ...BASE, prawoNettoBezGarnizonu: 24, prawMax: 100 }) === 0);
  // N4: 0 pkt bazowych, mianownik 40, 1 jednostka = 50% Prawa -> PorPct 25 (bunt, nie skrajny)
  check('N4 minimum = 1',
    aiCityGarrisonNeed({ ...BASE, prawoNettoBezGarnizonu: 0, prawMax: 40 }) === 1);
  // N4b: mianownik 100: 1 jednostka = 20% Prawa -> PorPct 10 (skrajny), 2 jednostki -> 20
  check('N4b minimum = 2',
    aiCityGarrisonNeed({ ...BASE, prawoNettoBezGarnizonu: 0, prawMax: 100 }) === 2);
  // N5: brak punktow za jednostke -> capUnits
  check('N5 bez drogi -> cap',
    aiCityGarrisonNeed({ ...BASE, perUnit: 0, prawoNettoBezGarnizonu: 0, prawMax: 100 }) === 5);
  // N6: zakres
  const v = aiCityGarrisonNeed({ ...BASE, prawoNettoBezGarnizonu: -999, prawMax: 40 });
  check('N6 zakres [0,cap]', v >= 0 && v <= 5, `v=${v}`);
}

const MUTANTS = [
  ['M1 zwrot capUnits zamiast minimum',
    ['for (let n = 0; n <= capUnits; n++) {', 'for (let n = capUnits; n >= 0; n--) {']],
  ['M2 porzadek ignorowany',
    ["if (porbandPlaceholder)", 'x'], true],
  ['M3 latwy wlaczony',
    ["return level === 'normalny' || level === 'trudny';", 'return level !== null;']],
];

(async () => {
  runAll(await buildBundle(null));
  if (fail !== 0) { console.log(`ai-city-order-need-test: ${pass} passed, ${fail} failed`); process.exit(1); }

  // M2 osobno: zmiana warunku porzadku w petli na zawsze "poza buntem".
  const mutM2 = ["if (porPctBand(porPct, crit) !== 'bunt_skrajny') return n;", 'if (true) return n;'];
  for (const [label, mut] of [MUTANTS[0], [MUTANTS[1][0], mutM2], MUTANTS[2]]) {
    const m = await buildBundle(mut);
    const f0 = fail;
    quiet = true;
    runAll(m);
    quiet = false;
    const hit = fail - f0;
    fail = f0;
    check(`${label} wykryta`, hit > 0, `(asercji padlo: ${hit})`);
  }

  console.log(`ai-city-order-need-test: ${pass} passed, ${fail} failed (of ${pass + fail})`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
