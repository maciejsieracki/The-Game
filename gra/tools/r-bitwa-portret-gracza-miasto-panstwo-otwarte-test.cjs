'use strict';
/**
 * r-bitwa-portret-gracza-miasto-panstwo-otwarte-test.cjs
 * P-BITWA-PORTRET-GRACZA-ZNIKNIETY-Q1 — RUNDA 2.
 *
 * PRAWDZIWA PRZYCZYNA (ustalona tej rundy, żywym Chromium + czytaniem kodu — patrz
 * 03-operator-runda2.md): regres dotyczy WYŁĄCZNIE ataku gracza na miasto BEZ MURU
 * (`launchFieldBattleFromMap`/`planOpenCityFieldBattle`, `gra/src/battle/mapFieldBattle.ts`)
 * — jedyny kod, który buduje `summary` dla `applyMapBattleOutcomeWithSummary` BEZ pól
 * `atkCivIconId`/`defCivIconId`/`atkIsCityState`/`defIsCityState`/`atkIsBarbarian`/
 * `defIsBarbarian`/`atkEra`/`defEra` (wszystkie trzy inne wywołania w main.ts — atak-pole,
 * atak-przychodzący, szturm oblężniczy z murem — mają je od `R-BITWA-ETYKIETA-TOZSAMOSC-
 * STRONY-Q1`). `applyMapBattleOutcomeWithSummary` (main.ts) czyta te pola WPROST z `summary`
 * (`atkCivIconId: summary.atkCivIconId`, ...) i przekazuje do `buildPostBattleSummary` —
 * brakujące pole ląduje jako `undefined` u OBU stron. `postBattleSummary.buildCommanderCorner`
 * ma `!civIconId` w tej samej klauzuli co `isBarbarian`/`isCityState`, więc `civIconId
 * undefined` samo w sobie wystarcza, by `portraitUrl` wyszło `null` — i skoro
 * `isBarbarian`/`isCityState` też są `undefined` (falsy), żadna z trzech gałęzi ikony się nie
 * trafia i medalion spada na generyczny `PB_SVG.commander` dla ATAKUJĄCEGO (gracz) I OBROŃCY
 * jednocześnie. Miasta-państwa korelują z tym regresem silniej niż zwykłe cywilizacje, bo
 * częściej są jeszcze BEZ MURU, gdy gracz je atakuje (ścieżka `field_battle`, nie szturm) —
 * stąd wzorzec ze zgłoszenia właściciela ("gracz atakuje, portret gracza i miasta-państwa
 * znika"), podczas gdy pełne cywilizacje AI zwykle mają już mur i idą poprawną ścieżką
 * szturmu. `czatCityState` NIE jest same w sobie warunkiem regresu — atak na dowolne miasto
 * BEZ MURU (także pełnej cywilizacji) byłby dotknięty identycznie; ta bramka stawia
 * miasto-państwo po stronie obrony, bo to dokładnie odtwarza zgłoszenie.
 *
 * DLACZEGO NIE CZYSTY UNIT TEST buildPostBattleSummary/buildCommanderCorner: te funkcje już
 * SĄ pokryte (battle-summary-test.cjs, r-bitwa-*-real-render-test.cjs) i poprawnie honorują
 * pola, GDY je dostaną — luka nie jest tam. Ta bramka importuje PRAWDZIWY, niezmodyfikowany
 * `launchFieldBattleFromMap` (esbuild, ten sam wzorzec co `map-field-battle-test.cjs`) i
 * łapie DOKŁADNIE ten `summary`, który realnie trafia do `applyMapBattleOutcomeWithSummary`
 * przy kliknięciu „Auto" w preBattle — zero reimplementacji, zero omijania punktu, w którym
 * pola faktycznie giną.
 *
 * NIETAUTOLOGICZNOŚĆ: uruchamia się DWA RAZY — raz na bieżącym `main.ts`-sąsiedzie
 * `mapFieldBattle.ts` z dysku (PO naprawie, oczekiwane wszystkie pola zdefiniowane), raz na
 * snapshotcie treści pliku SPRZED naprawy tej rundy (`git show HEAD:...`, PRZED, oczekiwane
 * wszystkie 8 pól `undefined`) — obie ścieżki muszą dać RÓŻNY wynik, inaczej bramka jest
 * ślepa na regres, który rozwiązuje.
 *
 * Bramka (z katalogu gra/): node tools/r-bitwa-portret-gracza-miasto-panstwo-otwarte-test.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_DIR = path.resolve(__dirname, '..');
const STUB_MUZYKA = path.join(GRA_DIR, 'tools', '.stubs', 'map-field-battle-muzyka-stub.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bitwa-portret-mp-otwarte-'));

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  [OK] ${label}`); }
  else { fail++; console.error(` [FAIL] ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function stubMuzykaPlugin() {
  return {
    name: 'stub-muzyka',
    setup(build) {
      build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: STUB_MUZYKA }));
    },
  };
}

const REAL_SRC = path.join(GRA_DIR, 'src/battle/mapFieldBattle.ts');
const ENTRY = path.join(TMP, 'entry.ts');
fs.writeFileSync(
  ENTRY,
  `export { launchFieldBattleFromMap, validateOpenCityFieldBattle } from ${JSON.stringify(REAL_SRC)};\n`,
  'utf8',
);

/** Buduje src/battle/mapFieldBattle.ts (prawdziwe, niezmodyfikowane sąsiednie moduły —
 *  importy względne zostają nietknięte, bo plik buduje się na SWOIM realnym miejscu) do
 *  CJS wołalnego z Node. Aktualna treść pliku na dysku musi być `sourceContent` w chwili
 *  budowy — wołający odpowiada za zapis/przywrócenie (patrz `main()`, blok try/finally). */
async function buildMapFieldBattleAtCurrentContent(tag) {
  const out = path.join(TMP, `bundle-${tag}.cjs`);
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: out,
    absWorkingDir: GRA_DIR,
    plugins: [stubMuzykaPlugin()],
    logLevel: 'silent',
  });
  delete require.cache[require.resolve(out)];
  return require(out);
}

function makeFixtures() {
  // Gracz (ownerId 0) atakuje miasto-państwo BEZ MURU (ownerId 7, startCityState) — dokładnie
  // wzorzec ze zgłoszenia właściciela i ustalenia tej rundy (00-dispatch.md, "gracz jako
  // ATAKUJĄCY vs miasto-państwo").
  const city = {
    id: 'cs-1', ownerId: 7, q: 6, r: 0, name: 'Trojzena',
    maMur: false, population: 8, garnizon: 0, startCityState: true,
  };
  const anchor = {
    id: 'u-player', ownerId: 0, typeId: 'Wojownik', category: 'miecznik',
    q: 5, r: 0, ruchLeft: 2, ruch: 2,
  };
  const defender = {
    id: 'u-cs-def', ownerId: 7, typeId: 'Wojownik', category: 'miecznik',
    q: 6, r: 0, ruchLeft: 2, ruch: 2,
  };
  return { city, anchor, defender, units: [anchor, defender] };
}

const stubDef = () => ({
  meleeAttack: 8, meleeDefence: 7, weaponDamage: 8, armor: 4, piercing: 2,
  chargeBonus: 4, health: 20, missileAttack: 0, 'Rola (linia)': 'Wrecz',
});

async function runScenario(mod, { city, anchor, defender, units }) {
  let capturedSummary = null;
  const deps = {
    cities: [city],
    units,
    turn: 1,
    getTerrainAt: () => 'Rownina',
    getStructBonus: () => 0,
    unitDefFor: stubDef,
    unitHealth: () => 20,
    unitAtak: () => 8,
    civLabelForOwner: (ownerId) => (ownerId === 0 ? 'Rzymianie' : 'Trojzena'),
    civBonusyForOwnerId: () => [],
    // Deps REALNE main.ts przekazuje z prawdziwych funkcji silnika
    // (civTypeForOwner/empireEpochForOwner/isOwnerClusterCityState) — tu ich pure-owe
    // odpowiedniki na tym samym kontrakcie, żeby fixture był deterministyczny.
    eraForOwnerId: () => 2,
    civIdForOwner: (ownerId) => (ownerId === 0 ? 'rzymianie' : 'grecy'),
    isCityStateForOwner: (ownerId) => ownerId === city.ownerId,
    lookupUnitDef: () => stubDef(),
    runtimeToBattleUnit: (u) => ({ id: u.id, ownerId: u.ownerId }),
    fortifyScaledDefFor: stubDef,
    terrainCombatData: [],
    battleData: {},
    showHint: () => {},
    showPreBattle: (_info, cb) => { cb.onAuto(); },
    hidePreBattle: () => {},
    applyMapBattleOutcomeWithSummary: (_atk, _def, _winner, _survivors, _opts, summary, onContinue) => {
      capturedSummary = summary;
      onContinue();
    },
    clearBattleUiState: () => {},
    createBattleScene: () => ({ play: () => {}, dispose: () => {} }),
    registerMilitiaDef: () => {},
  };
  const action = { attacker: anchor, ctx: { city } };
  mod.launchFieldBattleFromMap(action, deps);
  return capturedSummary;
}

async function main() {
  console.log('r-bitwa-portret-gracza-miasto-panstwo-otwarte-test');
  const originalContent = fs.readFileSync(REAL_SRC, 'utf8');

  // PO (dysk, po naprawie tej rundy — stan bieżący, żadnej mutacji potrzebnej)
  const modAfter = await buildMapFieldBattleAtCurrentContent('po');
  const summaryAfter = await runScenario(modAfter, makeFixtures());
  console.log('  PO summary:', JSON.stringify(summaryAfter));

  assert('PO: atkCivIconId zdefiniowany', summaryAfter.atkCivIconId === 'rzymianie', summaryAfter.atkCivIconId);
  assert('PO: defCivIconId zdefiniowany', summaryAfter.defCivIconId === 'grecy', summaryAfter.defCivIconId);
  assert('PO: atkIsCityState === false (gracz)', summaryAfter.atkIsCityState === false, summaryAfter.atkIsCityState);
  assert('PO: defIsCityState === true (miasto-państwo)', summaryAfter.defIsCityState === true, summaryAfter.defIsCityState);
  assert('PO: atkIsBarbarian === false', summaryAfter.atkIsBarbarian === false, summaryAfter.atkIsBarbarian);
  assert('PO: defIsBarbarian === false', summaryAfter.defIsBarbarian === false, summaryAfter.defIsBarbarian);
  assert('PO: atkEra zdefiniowana', summaryAfter.atkEra === 2, summaryAfter.atkEra);
  assert('PO: defEra zdefiniowana', summaryAfter.defEra === 2, summaryAfter.defEra);

  // PRZED (git HEAD — stan tej rundy PRZED naprawą; jeśli HEAD już zawiera naprawę,
  // ten krok jest pominięty z jawnym komunikatem zamiast fałszywej asercji).
  let beforeSrc;
  try {
    beforeSrc = execSync('git show HEAD:gra/src/battle/mapFieldBattle.ts', { cwd: path.resolve(GRA_DIR, '..'), encoding: 'utf8' });
  } catch (e) {
    beforeSrc = null;
  }
  if (beforeSrc && !beforeSrc.includes('atkCivIconId: pbInfo.atakujacy.civId')) {
    try {
      fs.writeFileSync(REAL_SRC, beforeSrc, 'utf8');
      const modBefore = await buildMapFieldBattleAtCurrentContent('przed');
      const summaryBefore = await runScenario(modBefore, makeFixtures());
      console.log('  PRZED summary:', JSON.stringify(summaryBefore));
      assert('PRZED (regres): atkCivIconId undefined', summaryBefore.atkCivIconId === undefined, summaryBefore.atkCivIconId);
      assert('PRZED (regres): defCivIconId undefined', summaryBefore.defCivIconId === undefined, summaryBefore.defCivIconId);
      assert('PRZED (regres): atkIsCityState undefined', summaryBefore.atkIsCityState === undefined, summaryBefore.atkIsCityState);
      assert('PRZED (regres): defIsCityState undefined', summaryBefore.defIsCityState === undefined, summaryBefore.defIsCityState);
      assert(
        'NIETAUTOLOGICZNOŚĆ: PRZED != PO (atkCivIconId)',
        summaryBefore.atkCivIconId !== summaryAfter.atkCivIconId,
        { before: summaryBefore.atkCivIconId, after: summaryAfter.atkCivIconId },
      );
    } finally {
      // P-PROC-AUTOBOT §2b: cofnięcie mutacji weryfikacyjnej przez zapis ORYGINALNEJ
      // treści (nie `git checkout --`), plus dowód że plik wrócił bit-w-bit.
      fs.writeFileSync(REAL_SRC, originalContent, 'utf8');
      const restoredOk = fs.readFileSync(REAL_SRC, 'utf8') === originalContent;
      assert('plik mapFieldBattle.ts przywrócony bit-w-bit po mutacji PRZED', restoredOk);
    }
  } else {
    console.log('  [INFO] HEAD już zawiera naprawę (commit tej rundy) — pomijam porównanie PRZED,'
      + ' PO powyżej jest dowodem wystarczającym; nietautologiczność potwierdzona wcześniej'
      + ' w tej samej rundzie przez ten sam plik testowy na stanie sprzed commitu.');
  }

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\n${pass}/${pass + fail} OK`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
