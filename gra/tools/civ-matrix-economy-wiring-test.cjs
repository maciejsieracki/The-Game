const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const bundle = path.join(os.tmpdir(), `civ-matrix-economy-${process.pid}.cjs`);
const matrixBundle = path.join(os.tmpdir(), `civ-matrix-data-${process.pid}.cjs`);
const economySource = fs.readFileSync(path.join(root, 'src/game/economy.ts'), 'utf8');
const turnSource = fs.readFileSync(path.join(root, 'src/game/turn-economy.ts'), 'utf8');
const panelSource = fs.readFileSync(path.join(root, 'src/ui/cityPanel.ts'), 'utf8');

esbuild.buildSync({
  entryPoints: [path.join(root, 'src/game/economy.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: bundle,
  logLevel: 'silent',
});
esbuild.buildSync({
  entryPoints: [path.join(root, 'src/game/civ-matrix.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: matrixBundle,
  logLevel: 'silent',
});

const economy = require(bundle);
const matrix = require(matrixBundle);

const PARAMS = [
  'eko_praca_proc',
  'eko_pieniadz_proc',
  'eko_pieniadz_port_proc',
  'eko_zywnosc_proc',
  'eko_nauka_proc',
  'eko_kultura_proc',
  'eko_luksus_proc',
  'eko_zadowolenie_proc',
  'eko_handel_brutto_proc',
  'eko_korupcja_proc',
];
const FIELDS = {
  eko_praca_proc: 'praca',
  eko_pieniadz_proc: 'pieniadz',
  eko_pieniadz_port_proc: 'pieniadz',
  eko_zywnosc_proc: 'zywnoscBrutto',
  eko_nauka_proc: 'nauka',
  eko_kultura_proc: 'kultura',
  eko_luksus_proc: 'luksus',
  eko_zadowolenie_proc: 'zadowolenie',
  eko_handel_brutto_proc: 'handelBrutto',
  eko_korupcja_proc: 'pieniadz',
};

const params = {
  progWzrostuWspolczynnik: 16,
  spichlerzZachowaniePoPrzroscie: 0.5,
  akweduktProgLudnosci: 5,
  spichlerzProgLudnosci: 8,
  akweduktMaxLudnosci: 12,
  zywnoscZuzytkaPopulacja: 1,
  zdrowieModyfikatorWspolczynnik: 0.05,
  korupcjaWspolczynnikDystansu: 2,
  korupcjaWspolczynnikMiast: 1,
  korupcjaCap: 0.5,
  budynekMlynMnoznikPracy: 2,
  budynekMlynBonusPracy: 2,
  budynekCegielniBonusPracy: 0.25,
  budynekTargowiskoBonusHandlu: 0.5,
  budynekBibliotekaBonusNauki: 0.5,
  budynekAkademiaBonusNauki: 0.1,
  budynekGarncarniaBonusZywnosci: 0.1,
  budynekMennicaMnoznik: 1,
  mennicaMnoznikPoWalucie: 1,
  walutaMnoznik: 2,
  targowiskoPracaMnoznik: 2,
  suwaakHandelNaukaDefault: 34,
  suwaakHandelPieniadz: 33,
  suwaakHandelLuksus: 33,
  suwaakPracaBudynki: 50,
  suwaakPracaTeren: 50,
};

function makeCity(ownerId = 0) {
  return {
    id: `test-city-${ownerId}`,
    ludnosc: 1,
    zdrowie: 0,
    czyStolica: true,
    maSpichlerz: false,
    maAkwedukt: false,
    magazynZywnosci: 0,
    specjalisci: [],
    kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 34, procentPieniadz: 33, procentLuksus: 33 },
    podziałPracy: { procentBudynki: 50 },
  };
}
const tile = { terenBazowy: 'plytkie_morze', nakladka: 'brak', maRzeke: true };
const building = {
  id: 'port', nazwa: 'Test', kategoria: 'Test', epokaWejscia: 1,
  maksPoziom: 1,
  baza: { praca: 100, pieniadz: 100, zywnosc: 20, nauka: 20, kultura: 20, zadowolenie: 20, obrona: 0, mnoznik: 0 },
  przyrost: { praca: 0, pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0, obrona: 0, mnoznik: 0 },
  kosztBudowy: 1, przyrostKosztu: 0, utrzymanie: 0, przyrostUtrzymania: 0, techUnlock: '', dajeSzczescie: true,
};
const buildings = [{ record: building, level: 1 }];
const baseCtx = {
  civKey: null,
  strataFraction: 0,
  wojskoZuzycieZywnosci: 0,
  maMlyn: false,
  maCegielnia: false,
  maTargowisko: false,
  maPort: true,
  maMennica: false,
  walutaOdkryta: false,
};
function run(ctx = {}, ownerId = 0) {
  return economy.cityYieldPerTurn(makeCity(ownerId), [tile], buildings, params, { ...baseCtx, ...ctx });
}
function changed(field, id, value) {
  const common = id === 'eko_korupcja_proc' ? { strataFraction: 0.2 } : {};
  const before = run({ ...common, civEconomyOverrides: { [id]: 0 } })[field];
  const after = run({ ...common, civEconomyOverrides: { [id]: value } })[field];
  assert.notEqual(after, before, `${id} must change ${field}`);
}

const rows = matrix.loadCivMatrix().cywilizacje;
assert.equal(rows.length, 15, 'matrix must contain exactly 15 civilizations');
assert.deepEqual(new Set(rows.map(row => row.ikonaId)).size, 15, 'civilization keys must be unique');
for (const row of rows) {
  for (const id of PARAMS) {
    assert.equal(typeof row.params[id], 'number', `${row.ikonaId}.${id} must be numeric`);
  }
}
assert.equal(matrix.civMatrixParam('not-a-civ', 'eko_praca_proc'), 0);
assert.equal(matrix.civMatrixParam('grecy', 'eko_praca_proc'), 0.02);
assert.equal(matrix.civMatrixParam('fenicjanie', 'eko_pieniadz_port_proc'), 0.25);

for (const id of PARAMS) {
  assert.equal(typeof FIELDS[id], 'string');
  changed(FIELDS[id], id, id === 'eko_korupcja_proc' ? 0.5 : 0.1);
}

// At least one real matrix value must affect its named consumer, not only a test override.
assert.notEqual(run({ civKey: 'grecy' }).praca, run({ civKey: null }).praca, 'real matrix work value must be consumed');
assert.notEqual(run({ civKey: 'inkowie' }).nauka, run({ civKey: null }).nauka, 'real matrix science value must be consumed');
assert.notEqual(run({ civKey: 'fenicjanie' }).pieniadz, run({ civKey: 'rzymianie' }).pieniadz, 'real matrix money value must be consumed');

// The live city-panel merge must preserve the owner key even when an optional
// building-flags hook returns a stale/neutral key, and its result must reach
// the same shared consumer as preview/end-turn.
const panelCtx = economy.mergeCityYieldContextForOwner(
  { ...baseCtx, civKey: null },
  'grecy',
  { civKey: 'stale-hook-owner' },
);
assert.equal(panelCtx.civKey, 'grecy', 'city-panel context keeps the owner civilization key');
assert.notEqual(
  run(panelCtx).praca,
  run({ civKey: null }).praca,
  'city-panel context produces a matrix-specific yield result',
);

// Matrix-owner paths suppress legacy civs.json multipliers; old callers without a key retain fallback behavior.
const legacy = run({ civHandelMult: 1.5, civNaukaMult: 1.5 });
const matrixOwner = run({ civKey: 'rzymianie', civHandelMult: 1.5, civNaukaMult: 1.5 });
assert.notEqual(legacy.pieniadz, matrixOwner.pieniadz, 'legacy fallback must not override an explicit matrix owner');

// Unknown and neutral civs are exact neutral controls.
assert.deepEqual(run({ civKey: 'unknown-civ' }), run({ civKey: null }), 'unknown civ is neutral');
assert.deepEqual(run({ civKey: 'rzymianie' }), run({ civKey: 'not-a-civ' }), 'zero/unknown civs are neutral');

// Same inputs are owner-type agnostic: player, major AI, and city-state yield the same result.
const parity = [0, 1, 99].map(ownerId => run({ civKey: 'grecy' }, ownerId));
assert.deepEqual(parity[0], parity[1], 'player and major AI economy must be parity');
assert.deepEqual(parity[1], parity[2], 'major AI and city-state economy must be parity');

// +/-10% boundary is observable through the live consumer.
const plus = run({ civEconomyOverrides: { eko_praca_proc: 0.1 } }).praca;
const minus = run({ civEconomyOverrides: { eko_praca_proc: -0.1 } }).praca;
assert(plus > minus, 'positive and negative +/-10% boundaries must be observable');

// Source-level wiring guard: preview, end-of-turn, and city-panel contexts must carry both gates.
const preview = turnSource.slice(turnSource.indexOf('export function previewCityEconomy'), turnSource.indexOf('export function previewCityEconomy') + 50000);
const advance = turnSource.slice(turnSource.indexOf('export function advanceCityEconomy'), turnSource.indexOf('export function advanceCityEconomy') + 80000);
assert.match(preview, /civKey:\s*ownerCivKey/);
assert.match(preview, /maPort:\s*runtimeBuiltIds\.includes\('port'\)/);
assert.match(advance, /civKey:\s*ownerCivKey/);
assert.match(advance, /maPort:\s*runtimeBuiltIds\.includes\('port'\)/);
assert.match(panelSource, /mergeCityYieldContextForOwner\(base,\s*civKey,/);
assert.match(panelSource, /toEconomyCity\([\s\S]*?\bcivKey\s*,/);
assert.match(panelSource, /maPort:\s*built\.includes\('port'\)/);

fs.unlinkSync(bundle);
fs.unlinkSync(matrixBundle);
console.log('PASS civ-matrix economy wiring: 15x10, real consumers, neutral/unknown, +/-10%, owner parity, preview/end-turn/panel wiring');
