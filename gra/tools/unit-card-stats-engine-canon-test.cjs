'use strict';

// R-WEB-UI-UNIT-CARD-STATS-ENGINE-CANON-Q1 — karty jednostek pokazują statystyki SILNIKA.
// ABC nr 8 = A (2026-11-14): wartości bojowe na karcie/tooltipie = to, czym liczy walka
// (combatUnitFromDef), a nie kolumny PL z units.json (Atak/Obrona/Health/Pancerz/Uderzenie).

const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const OUT = path.join(os.tmpdir(), `unit-card-stats-engine-canon-${process.pid}.cjs`);
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`OK ${message}`);
}

const UI_FILES = [
  'src/ui/entityCards/unitAdapter.ts',
  'src/ui/unitInfoCard.ts',
  'src/ui/cityPanel.ts',
];

// Odczyty kolumn PL (etykiet legacy) jako źródła wartości bojowych na karcie — zakazane.
const PL_COMBAT_READ = /\b(?:unit|u)\.(?:Atak|Obrona|Health|Pancerz|Przebicie|Uderzenie)\b|\b(?:unit|u)\[['"](?:Atak dystansowy)['"]\]/;

async function main() {
  await esbuild.build({
    stdin: {
      contents: `export { unitEngineStats } from ${JSON.stringify(path.join(GRA, 'src/ui/unitEngineStats.ts'))};\nexport { combatUnitFromDef } from ${JSON.stringify(path.join(GRA, 'src/game/combat.ts'))};`,
      resolveDir: GRA,
      sourcefile: 'unit-card-stats-engine-canon-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: OUT,
    logLevel: 'silent',
  });

  try {
    const { unitEngineStats, combatUnitFromDef } = require(OUT);

    // 1. Każda jednostka: wartości pokazywane na karcie = wartości combatUnitFromDef.
    let checked = 0;
    for (const unit of units) {
      const shown = unitEngineStats(unit);
      const engine = combatUnitFromDef(unit);
      const pairs = [
        ['atak', engine.meleeAttack],
        ['obrona', engine.meleeDefence],
        ['hp', engine.health],
        ['pancerz', engine.armor],
        ['przebicie', engine.piercing],
        ['obrazeniaBroni', engine.weaponDamage],
        ['atakDystansowy', engine.missileAttack],
      ];
      for (const [key, value] of pairs) {
        if (shown[key] !== value) {
          throw new Error(`${unit.Jednostka}: ${key} karta=${shown[key]} silnik=${value}`);
        }
      }
      checked += 1;
    }
    assert(checked === units.length && checked > 0, `all ${checked} units: card stats equal combatUnitFromDef values`);

    // 2. Przykład z dispatchu: Wojownik — silnik 4/4/22 (PL 6/6/60 to etykiety legacy).
    const wojownik = units.find(u => u.Jednostka === 'Wojownik');
    assert(Boolean(wojownik), 'Wojownik row exists in units.json');
    const w = unitEngineStats(wojownik);
    assert(w.atak === 4 && w.obrona === 4 && w.hp === 22 && w.pancerz === 2,
      `Wojownik card shows engine values atak=${w.atak} obrona=${w.obrona} hp=${w.hp} pancerz=${w.pancerz}`);
    assert(w.atak !== Number(wojownik.Atak), 'Wojownik card atak differs from legacy PL column (6)');

    // 3. Brak odczytów kolumn PL do wyświetlania statystyk bojowych w plikach UI.
    for (const rel of UI_FILES) {
      const lines = fs.readFileSync(path.join(GRA, rel), 'utf8').split('\n');
      const hits = lines
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => PL_COMBAT_READ.test(line) && !/^\s*\/\//.test(line));
      assert(hits.length === 0,
        `${rel}: no PL combat-column reads for display${hits.length ? ` (lines ${hits.map(h => h.n).join(',')})` : ''}`);
    }

    // 4. Silnik i dane nietknięte przez ten temat (sprawdzane w diffie Operatora, tu: obecność pliku).
    assert(fs.existsSync(path.join(GRA, 'src/ui/unitEngineStats.ts')), 'shared helper src/ui/unitEngineStats.ts present');
  } finally {
    try { fs.unlinkSync(OUT); } catch (_) { /* best effort */ }
  }
  console.log('PASS unit-card-stats-engine-canon-test');
}

main().catch((err) => {
  console.error(`FAIL unit-card-stats-engine-canon-test: ${err.message}`);
  process.exit(1);
});
