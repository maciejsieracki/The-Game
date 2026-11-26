'use strict';
/**
 * ai-city-order-need-wiring-test.cjs -- R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1 (AICULT, #189), runda 3.
 *
 * Testy WPIECIA (nie tylko czystej funkcji):
 *   T1 tabela CULTMODEL2 na PELNYM wejsciu silnika (evaluateOrderFromBreakdown -> aiCityGarrisonNeedFromOrder):
 *      pop 5, epoka 1, obca kultura + obca religia, bez budynkow: normalny 3, trudny 4 (wyjscie z buntu skrajnego);
 *      z budynkiem Garnizon potrzeba spada (trudny 4 -> mniej).
 *   T2 rekrutacja (emptyCityGarrisonRecruitIds): bez opts.cityGarrisonNeed = jak dotad (1 jednostka na miasto);
 *      z polem: cel = max(1, need) -- miasto z 1 jednostka i need 3 rekrutuje, z 3 jednostkami juz nie.
 *   T3 pula armii (cityGarrisonPoolIds): bez pola 1 jednostka/miasto (dzis), z polem do `cel` najslabszych.
 *   T4 budynki (chooseCityProduction): miasto z need>=1 preferuje budynek Prawa/Szczescia; bez pola wybor bez zmian.
 * Mutacje (kopie bundla ai.ts / ai-city-order-need.ts): kazda MUSI zlamac co najmniej jedna asercje.
 *
 * Testy silnika na poziomie MAKSYMALNYM (trudny, 'hard') zgodnie z regula wlasciciela; normalny tylko jako wzorzec tabeli.
 *
 * Run (z gra/): node tools/ai-city-order-need-wiring-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const WORK = fs.mkdtempSync(path.join(process.env.GARRISON_TMP || os.tmpdir(), 'aiow-'));
const SOCIETY = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data', 'society-params.json'), 'utf8'));
const ENTRY = path.join(WORK, 'entry.ts');
fs.writeFileSync(ENTRY, `
export { emptyCityGarrisonRecruitIds, cityGarrisonPoolIds, aiCityGarrisonTarget, applyOrderDeficitBuildingBonus, AI_ORDER_DEFICIT_BUILDING_BONUS } from ${JSON.stringify(path.join(SRC, 'game', 'ai.ts'))};
export { aiCityGarrisonNeedFromOrder, aiGarrisonNeedApplies } from ${JSON.stringify(path.join(SRC, 'game', 'ai-city-order-need.ts'))};
export { evaluateOrderFromBreakdown } from ${JSON.stringify(path.join(SRC, 'game', 'society-breakdown.ts'))};
export { setCulturaReligiaLevel } from ${JSON.stringify(path.join(SRC, 'game', 'culture-religion-level.ts'))};
`);

let counter = 0;
async function buildBundle(mutations) {
  counter++;
  const out = path.join(WORK, `bundle-${counter}.cjs`);
  const plugin = {
    name: 'mutate-wiring',
    setup(b) {
      if (!mutations) return;
      b.onLoad({ filter: /game[\\/](ai|ai-city-order-need)\.ts$/ }, (args) => {
        let text = fs.readFileSync(args.path, 'utf8');
        for (const [file, find, repl] of mutations) {
          if (!args.path.endsWith(file)) continue;
          if (text.split(find).length !== 2) throw new Error(`mutacja: brak dokladnie 1x "${find}" w ${file}`);
          text = text.replace(find, repl);
        }
        return { contents: text, loader: 'ts' };
      });
    },
  };
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: out,
    logLevel: 'silent', plugins: [plugin], resolveExtensions: ['.ts', '.js', '.json'],
  });
  return require(out);
}

let pass = 0, fail = 0, quiet = false;
function check(name, cond, detail) {
  if (cond) { pass++; return; }
  fail++;
  if (!quiet) console.log(`FAIL ${name}`, detail === undefined ? '' : JSON.stringify(detail));
}
function eq(name, got, want) { check(name, got === want, { got, want }); }

const unit = (id, q, r, extra) => ({
  id, typeId: 'Wojownik', ownerId: 1, q, r, category: 'piechota', hp: 10, maxHp: 10, ...extra,
});
const CITY = { id: 'c1', ownerId: 1, q: 0, r: 0 };

function orderFor(M, level, diff, builtGarnizon, garn = 0) {
  M.setCulturaReligiaLevel(level);
  return M.evaluateOrderFromBreakdown(
    { difficulty: diff, era: 1, population: 5, buildingZadowolenie: 0, ownCultureShare: 0, ownReligionShare: 0 },
    { difficulty: diff, era: 1, population: 5, garnizonCount: garn, hasGarnizonBudynek: !!builtGarnizon },
    SOCIETY, diff,
  );
}

function runAll(M) {
  // T1 -- tabela CULTMODEL2 z pelnego wejscia silnika.
  const n3 = M.aiCityGarrisonNeedFromOrder(orderFor(M, 'normalny', 'normal', false), SOCIETY, 'normal');
  eq('T1 normalny pop5 ep1 obca+obca = 3', n3, 3);
  const n4 = M.aiCityGarrisonNeedFromOrder(orderFor(M, 'trudny', 'hard', false), SOCIETY, 'hard');
  eq('T1 trudny pop5 ep1 obca+obca = 4', n4, 4);
  const n4g = M.aiCityGarrisonNeedFromOrder(orderFor(M, 'trudny', 'hard', true), SOCIETY, 'hard');
  check('T1 trudny z budynkiem Garnizon < bez budynku', n4g < n4, { n4g, n4 });
  // T1b -- potrzeba nie zalezy od garnizonu, ktory juz stoi (linia garnizonu odjeta od netto Prawa).
  const n4w = M.aiCityGarrisonNeedFromOrder(orderFor(M, 'trudny', 'hard', false, 2), SOCIETY, 'hard');
  eq('T1b trudny: potrzeba taka sama przy 2 stojacych jednostkach', n4w, 4);
  M.setCulturaReligiaLevel(undefined);

  // T2 -- rekrutacja.
  const noOpts = {};
  const withNeed = { cityGarrisonNeed: { c1: 3 } };
  const u1 = [unit('a', 0, 0)];
  const u3 = [unit('a', 0, 0), unit('b', 0, 0), unit('c', 0, 0)];
  eq('T2 bez pola: 1 jednostka = nie rekrutuj', M.emptyCityGarrisonRecruitIds([CITY], u1, [], noOpts, {}).has('c1'), false);
  eq('T2 bez pola: 0 jednostek = rekrutuj', M.emptyCityGarrisonRecruitIds([CITY], [], [], noOpts, {}).has('c1'), true);
  eq('T2 need=3, 1 jednostka = rekrutuj', M.emptyCityGarrisonRecruitIds([CITY], u1, [], withNeed, {}).has('c1'), true);
  eq('T2 need=3, 3 jednostki = nie rekrutuj', M.emptyCityGarrisonRecruitIds([CITY], u3, [], withNeed, {}).has('c1'), false);
  eq('T2 need=0 -> cel min. 1 (0 jednostek = rekrutuj)',
    M.emptyCityGarrisonRecruitIds([CITY], [], [], { cityGarrisonNeed: { c1: 0 } }, {}).has('c1'), true);
  eq('T2 need=0 -> cel min. 1 (1 jednostka = nie)',
    M.emptyCityGarrisonRecruitIds([CITY], u1, [], { cityGarrisonNeed: { c1: 0 } }, {}).has('c1'), false);
  eq('T2 cel = max(1, need): need 4', M.aiCityGarrisonTarget('c1', { cityGarrisonNeed: { c1: 4 } }), 4);
  eq('T2 cel bez pola = 1', M.aiCityGarrisonTarget('c1', {}), 1);

  // T3 -- pula armii.
  const data = { units: [], buildings: [] };
  const poolOld = M.cityGarrisonPoolIds([CITY], u3, 1, data, {});
  eq('T3 bez pola: pula = 1 jednostka', poolOld.size, 1);
  const poolNew = M.cityGarrisonPoolIds([CITY], u3, 1, data, withNeed);
  eq('T3 need=3: pula = 3 jednostki', poolNew.size, 3);
  const poolTwo = M.cityGarrisonPoolIds([CITY], u3, 1, data, { cityGarrisonNeed: { c1: 2 } });
  eq('T3 need=2: pula = 2 jednostki', poolTwo.size, 2);
  const poolEmptyObj = M.cityGarrisonPoolIds([CITY], u3, 1, data, { cityGarrisonNeed: {} });
  eq('T3 puste pole = jak 1 jednostka', poolEmptyObj.size, 1);

  // T4 -- gating poziomu.
  eq('T4 gate normalny', M.aiGarrisonNeedApplies('normalny'), true);
  eq('T4 gate trudny', M.aiGarrisonNeedApplies('trudny'), true);
  eq('T4 gate latwy', M.aiGarrisonNeedApplies('latwy'), false);
  eq('T4 gate zgodnosc (null)', M.aiGarrisonNeedApplies(null), false);

  // T5 -- preferencja budynkow Prawa/Szczescia (applyOrderDeficitBuildingBonus, wywolywana z chooseCityProduction).
  const BLD = [
    { id: 'garnizon', grupa: 'Prawo i administracja' },
    { id: 'swiatynia', grupa: 'Religia', dajeSzczescie: true },
    { id: 'koszary', grupa: 'Wojsko i obrona' },
  ];
  const cands = () => [
    { id: 'garnizon', score: 100 }, { id: 'swiatynia', score: 100 }, { id: 'koszary', score: 100 },
  ];
  const scoreOf = (list, id) => list.find(c => c.id === id).score;
  const bonus5 = cands();
  M.applyOrderDeficitBuildingBonus(bonus5, BLD, 1, false);
  eq('T5 need=1: garnizon +40 (Prawo)', scoreOf(bonus5, 'garnizon'), 140);
  eq('T5 need=1: swiatynia +40 (Szczescie)', scoreOf(bonus5, 'swiatynia'), 140);
  eq('T5 need=1: koszary bez zmian (nie Prawo/Szczescie)', scoreOf(bonus5, 'koszary'), 100);
  const noNeed = cands();
  M.applyOrderDeficitBuildingBonus(noNeed, BLD, 0, false);
  eq('T5 need=0: bez zmian', scoreOf(noNeed, 'garnizon'), 100);
  const noField = cands();
  M.applyOrderDeficitBuildingBonus(noField, BLD, undefined, false);
  eq('T5 brak pola: bez zmian', scoreOf(noField, 'swiatynia'), 100);
  const copy = cands();
  M.applyOrderDeficitBuildingBonus(copy, BLD, 2, true);
  eq('T5 kopia defensywna: bez zmian', scoreOf(copy, 'garnizon'), 100);
}

const MUTANTS = [
  ['MW1 rekrutacja ignoruje cel (zawsze min 1)',
    [['ai.ts', 'if (cityGarrisonEligibleCount(city, myUnits, city.ownerId) < aiCityGarrisonTarget(city.id, opts)) out.add(city.id);',
      'if (cityGarrisonEligibleCount(city, myUnits, city.ownerId) < 1) out.add(city.id);']]],
  ['MW2 pula armii tylko 1 jednostka',
    [['ai.ts', 'return garrisonPoolUnitIds(cities, units, playerId, strengthOf, id => aiCityGarrisonTarget(id, opts));',
      'return garrisonUnitIdSet(getCityGarrisonUnitIds(cities, units, playerId, strengthOf));']]],
  ['MW3 cel nie ma minimum 1',
    [['ai.ts', 'Math.max(1, Math.floor(need))', 'Math.floor(need)']]],
  ['MW4 brak odjecia linii garnizonu od netto Prawa',
    [['ai-city-order-need.ts', 'order.prawo.netto - (garrLine ? garrLine.value : 0)', 'order.prawo.netto']]],
  ['MW5 pole cityGarrisonNeed ignorowane w rekrutacji (stary tor)',
    [['ai.ts', 'if (opts.cityGarrisonNeed !== undefined) {\n      // AICULT r3', 'if (false) {\n      // AICULT r3']]],  ['MW6 bonus budynkow Prawa/Szczescia 40->0',
    [['ai.ts', 'export const AI_ORDER_DEFICIT_BUILDING_BONUS = 40;', 'export const AI_ORDER_DEFICIT_BUILDING_BONUS = 0;']]],
  ['MW7 bonus budynkow ignoruje kopie defensywna',
    [['ai.ts', 'if (defensiveCopy || (need ?? 0) < 1) return;', 'if ((need ?? 0) < 1) return;']]],
  ['MW8 bonus budynkow przy zerowej potrzebie (gate >= 0)',
    [['ai.ts', 'if (defensiveCopy || (need ?? 0) < 1) return;', 'if (defensiveCopy || (need ?? 0) < 0) return;']]],
];

(async () => {
  runAll(await buildBundle(null));
  if (fail !== 0) { console.log(`ai-city-order-need-wiring-test: ${pass} passed, ${fail} failed`); process.exit(1); }
  for (const [label, mut] of MUTANTS) {
    const m = await buildBundle(mut);
    const f0 = fail;
    quiet = true;
    try { runAll(m); } catch (e) { fail++; }
    quiet = false;
    const hit = fail - f0;
    fail = f0;
    check(`${label} wykryta`, hit > 0, `(asercji padlo: ${hit})`);
  }
  console.log(`ai-city-order-need-wiring-test: ${pass} passed, ${fail} failed (of ${pass + fail})`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
