'use strict';

/**
 * R-WEB-ECONOMY-UNIT-UPKEEP-COST-PACE-MULT-Q1 (decyzja właściciela 2026-11-19):
 * ustawienie kreatora „Koszty jednostek" (Niski ×1 / Normalny ×2 / Wysoki ×4)
 * mnoży też UTRZYMANIE jednostek: Pieniądz, surowce i żywność (także poza
 * własnym terytorium i w obozie) oraz wartości kart.
 *
 * Uruchomienie z gra/: node tools/unit-upkeep-cost-pace-test.cjs
 *
 * Wartości NISKI (×1) są pinami sprzed zmiany (te same co unit-epoch-cost-test.cjs):
 *   Pieniądz: Wojownik 4, Procarz 8, Falanga 32 / żywność: 4, 8, 16 /
 *   surowiec: Wojownik {drewno:3}, Procarz {drewno:10}, Falanga {zelazo:20}.
 * Normalny = ×2, Wysoki = ×4 względem Niskiego (mnożnik na końcu łańcucha).
 * Brak parametru (stare zapisy, stare wywołania) = Niski.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.unit-upkeep-cost-pace-entry.ts');
const BUNDLE = path.join(__dirname, '.unit-upkeep-cost-pace-bundle.cjs');

fs.writeFileSync(ENTRY, `
export * from '../src/game/economy-upkeep';
export * from '../src/game/unit-cost-tempo';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const units = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data', 'units.json'), 'utf8'));

let pass = 0;
let fail = 0;
function check(label, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${label}`);
  } catch (err) {
    fail++;
    console.log(`  FAIL ${label}\n       ${String(err && err.message).split('\n').slice(0, 4).join('\n       ')}`);
  }
}

const row = (name) => {
  const r = units.find(u => u.Jednostka === name);
  if (!r) throw new Error(`brak jednostki ${name} w units.json`);
  return r;
};

const SAMPLES = [
  // name, category (pieniądz fallback), niski: pieniądz, żywność, surowiec (klucz -> ilość)
  // Żywność niski = po UPKEEPMULT (epoka x1/x4/x16 + R_STAWKI x4): Kamień 4, Brąz 16, Żelazo 64.
  { name: 'Wojownik', category: 'miecznik', pieniadz: 4, zywnosc: 4, surowiec: { drewno: 3 } },
  { name: 'Procarz', category: 'procarz', pieniadz: 8, zywnosc: 16, surowiec: { drewno: 10 } },
  { name: 'Falanga', category: 'falanga', pieniadz: 32, zywnosc: 64, surowiec: { zelazo: 20 } },
];

const PACES = [
  ['niski', 1],
  ['normalny', 2],
  ['wysoki', 4],
];

const upkeepTbl = M.buildUnitUpkeepTable(units);
const foodTbl = M.buildUnitFoodTable(units);
const P = M.DEFAULT_UPKEEP_PARAMS;

console.log('-- mnoznikUtrzymaniaJednostek --');
check('niski=1, normalny=2, wysoki=4, brak/nieznane=1 (stare zapisy = Niski)', () => {
  assert.equal(M.mnoznikUtrzymaniaJednostek('niski'), 1);
  assert.equal(M.mnoznikUtrzymaniaJednostek('normalny'), 2);
  assert.equal(M.mnoznikUtrzymaniaJednostek('wysoki'), 4);
  assert.equal(M.mnoznikUtrzymaniaJednostek(undefined), 1);
  assert.equal(M.mnoznikUtrzymaniaJednostek(null), 1);
  assert.equal(M.mnoznikUtrzymaniaJednostek('bzdura'), 1);
});

console.log('-- Pieniądz (unitUpkeep / totalUnitUpkeep) --');
for (const s of SAMPLES) {
  for (const [pace, mult] of PACES) {
    check(`${s.name} Pieniądz ${pace}: ${s.pieniadz} x ${mult}`, () => {
      const u = { typeId: s.name, category: s.category };
      assert.equal(M.unitUpkeep(u, upkeepTbl, 1, pace), s.pieniadz * mult);
    });
  }
}
check('totalUnitUpkeep = suma unitUpkeep przy każdym tempie', () => {
  const list = SAMPLES.map(s => ({ typeId: s.name, category: s.category }));
  for (const [pace, mult] of PACES) {
    const expected = SAMPLES.reduce((acc, s) => acc + s.pieniadz * mult, 0);
    assert.equal(M.totalUnitUpkeep(list, upkeepTbl, 1, pace), expected);
  }
});
check('upkeepBalance: utrzymanieJednostki rośnie ×2 przy Normalnym (brak zmiany budynków)', () => {
  const list = SAMPLES.map(s => ({ typeId: s.name, category: s.category }));
  const niski = M.upkeepBalance(0, [], list, upkeepTbl, P, 'niski').utrzymanieJednostki;
  const normalny = M.upkeepBalance(0, [], list, upkeepTbl, P, 'normalny').utrzymanieJednostki;
  assert.equal(normalny, niski * 2);
});

console.log('-- Surowce (unitResourceUpkeep / totalUnitResourceUpkeep) --');
for (const s of SAMPLES) {
  for (const [pace, mult] of PACES) {
    check(`${s.name} surowiec ${pace}`, () => {
      const got = M.unitResourceUpkeep(row(s.name), pace);
      const expected = {};
      for (const [k, v] of Object.entries(s.surowiec)) expected[k] = v * mult;
      assert.deepEqual(got, expected);
    });
  }
}
check('totalUnitResourceUpkeep sumuje z mnożnikiem tempa', () => {
  const list = SAMPLES.map(s => ({ typeId: s.name }));
  const resolve = (id) => units.find(u => u.Jednostka === id);
  const niski = M.totalUnitResourceUpkeep(list, resolve, 'niski');
  const wysoki = M.totalUnitResourceUpkeep(list, resolve, 'wysoki');
  for (const k of Object.keys(niski)) assert.equal(wysoki[k], niski[k] * 4, k);
});

console.log('-- Żywność (unitFoodPerTurn / militaryFoodConsumption / karta) --');
for (const s of SAMPLES) {
  for (const [pace, mult] of PACES) {
    check(`${s.name} żywność ${pace}: własne terytorium, marsz`, () => {
      const v = M.unitFoodPerTurn({ typeId: s.name, camping: false, onOwnTerritory: true }, P, foodTbl, pace);
      assert.equal(v, s.zywnosc * mult);
    });
    check(`${s.name} żywność ${pace}: obóz (stosunek Obóz/Ruch bez zmian, ×tempo)`, () => {
      const niski = M.unitFoodPerTurn({ typeId: s.name, camping: true, onOwnTerritory: true }, P, foodTbl, 'niski');
      const v = M.unitFoodPerTurn({ typeId: s.name, camping: true, onOwnTerritory: true }, P, foodTbl, pace);
      assert.equal(v, niski * mult);
    });
    check(`${s.name} żywność ${pace}: poza własnym terytorium (x2 terytorium)`, () => {
      const niski = M.unitFoodPerTurn({ typeId: s.name, camping: false, onOwnTerritory: false }, P, foodTbl, 'niski');
      const v = M.unitFoodPerTurn({ typeId: s.name, camping: false, onOwnTerritory: false }, P, foodTbl, pace);
      assert.equal(v, niski * mult);
      assert.equal(niski, s.zywnosc * 2);
    });
    check(`${s.name} karta „Żywność/turę” ${pace} = wartość silnika (własne terytorium)`, () => {
      const card = M.unitFoodCardValue(row(s.name), pace);
      assert.equal(card, s.zywnosc * mult);
    });
  }
}
check('militaryFoodConsumption sumuje z tempem (wojsko na 2 terytoriach)', () => {
  const list = [
    { typeId: 'Wojownik', camping: false, onOwnTerritory: true },
    { typeId: 'Falanga', camping: true, onOwnTerritory: false },
  ];
  const niski = M.militaryFoodConsumption(list, P, foodTbl, 'niski');
  const normalny = M.militaryFoodConsumption(list, P, foodTbl, 'normalny');
  assert.equal(normalny, niski * 2);
});

console.log('-- Karty jednostek = wartość silnika (zarzut Evaluatora 1) --');
for (const s of SAMPLES) {
  for (const [pace, mult] of PACES) {
    check(`${s.name} karta „Utrzymanie Pieniądza/turę” ${pace} = unitUpkeep (${s.pieniadz * mult})`, () => {
      assert.equal(M.unitPieniadzUpkeepCardValue(row(s.name), pace), s.pieniadz * mult);
    });
    check(`${s.name} karta „Utrzymanie surowca/turę” ${pace} = unitResourceUpkeep`, () => {
      const expected = Object.values(s.surowiec)[0] * mult;
      assert.equal(M.unitResourceUpkeepCardAmount(row(s.name), pace), expected);
    });
  }
}
check('karta bez liczby Pieniądza zwraca surową wartość (brak wiersza, nie NaN)', () => {
  assert.equal(M.unitPieniadzUpkeepCardValue({ Jednostka: 'X', 'Utrzymanie (Pieniądz/turę)': undefined }, 'wysoki'), undefined);
  assert.equal(M.unitResourceUpkeepCardAmount({}, 'wysoki'), null);
});

console.log('-- Okablowanie: każde wywołanie silnika w main.ts i UI niesie tempo (zarzut Evaluatora 3) --');
{
  const PACE_FNS = ['unitUpkeep', 'totalUnitUpkeep', 'unitResourceUpkeep', 'totalUnitResourceUpkeep',
    'previewOwnerTotalResourceUpkeep', 'unitRecruitUpkeepReserve', 'upkeepBalance', 'unitFoodPerTurn',
    'militaryFoodConsumption', 'militaryFoodConsumptionWithSpichlerz', 'advanceEmpireFood', 'advanceCityEconomy'];
  const WIRED_FILES = ['src/main.ts', 'src/game/ai.ts', 'src/game/no-negative-stocks.ts', 'src/game/empire-food.ts',
    'src/ui/cityPanel.ts', 'src/ui/unitInfoCard.ts', 'src/ui/entityCards/unitAdapter.ts'];
  // Wywołania w turn-economy.ts (advanceCityEconomy w forecastNextTurnProduction) celowo bez tempa:
  // prognoza produkcji, nie utrzymanie (Evaluator: poza zakresem). Tu skanujemy tylko pliki konsumenckie.
  const callText = (src, start) => {
    let depth = 0;
    for (let i = start; i < src.length; i++) {
      if (src[i] === '(') depth++;
      else if (src[i] === ')') { depth--; if (depth === 0) return src.slice(start, i + 1); }
    }
    return src.slice(start);
  };
  const missing = [];
  let calls = 0;
  for (const rel of WIRED_FILES) {
    const src = fs.readFileSync(path.join(GRA_ROOT, rel), 'utf8');
    for (const fn of PACE_FNS) {
      const re = new RegExp(`(^|[^\\w.$])${fn}\\s*\\(`, 'gm');
      let m;
      while ((m = re.exec(src))) {
        const line = src.slice(src.lastIndexOf('\n', m.index) + 1, src.indexOf('\n', m.index));
        if (/^\s*(export\s+)?function\s/.test(line) || /^\s*\*|^\s*\/[/*]/.test(line)) continue;
        const startParen = m.index + m[0].length - 1;
        const text = callText(src, startParen);
        calls++;
        // Tempo niesie: bezpośrednio kosztJednostekPace*, lokalna zmienna `pace` (= kosztJednostekPaceUtrzymania())
        // albo owner-aware wrapper paceUtrzymaniaWlasciciela(owner, pace) (ai-free-unit-upkeep.ts; okno darmowe AI
        // i okno łaski gracza -> 0, inaczej pace). Wrapper przyjmuje tempo jako argument, więc jest tempem.
        if (!/kosztJednostekPace/.test(text) && !/Pace\b/.test(text) && !/paceUtrzymaniaWlasciciela\(/.test(text) && !/\bpace\b/.test(text)) {
          missing.push(`${rel}:${src.slice(0, m.index).split('\n').length} ${fn}`);
        }
      }
    }
  }
  check(`wszystkie wywołania silnika utrzymania w ${calls} miejscach niosą tempo`, () => {
    assert.ok(calls > 20, `za mało wywołań do skanu: ${calls}`);
    assert.deepEqual(missing, [], `bez tempa: ${missing.join('; ')}`);
  });
}

console.log('-- Stare wywołania i zapisy (brak parametru = Niski) --');
check('domyślny parametr = Niski (wartości sprzed zmiany)', () => {
  for (const s of SAMPLES) {
    assert.equal(M.unitUpkeep({ typeId: s.name, category: s.category }, upkeepTbl, 1), s.pieniadz);
    assert.deepEqual(M.unitResourceUpkeep(row(s.name)), s.surowiec);
    assert.equal(M.unitFoodPerTurn({ typeId: s.name, camping: false }, P, foodTbl), s.zywnosc);
  }
});
check('nieznane tempo (stary zapis) = Niski', () => {
  assert.equal(M.unitUpkeep({ typeId: 'Wojownik', category: 'miecznik' }, upkeepTbl, 1, 'stare'), 4);
});

console.log(`\nWYNIK: ${pass} ok, ${fail} FAIL`);
if (fail > 0) process.exit(1);
