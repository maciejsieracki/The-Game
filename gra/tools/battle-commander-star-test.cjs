'use strict';
/**
 * R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1 -- test stanu/jsdom-free dla jasnej gwiazdki
 * generała na polu bitwy (src/battle/battleCommanderStar.ts).
 *
 * Kryteria:
 *  (a) realna funkcja budujaca znacznik: dla armii z generalem dokladnie jedna
 *      jednostka dostaje sprite'a o nazwie BATTLE_COMMANDER_STAR_NAME jako dziecko
 *      grupy; armia bez generala i zwykle jednostki -- brak znacznika; martwy
 *      generał -- brak znacznika. Mutacja na KOPII zrodla (warunek celu zastapiony
 *      przez `true`) musi dac czerwony wynik.
 *  (c-stan) znacznik jest niezalezny od przelacznika paskow (brak odwolan do
 *      barsVisible w module) i nie przechwytuje klikniec (raycast no-op).
 *
 * Uruchomienie: node tools/battle-commander-star-test.cjs  (z katalogu gra/)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const THREE = require(path.resolve(__dirname, '..', 'node_modules', 'three'));

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/battle/battleCommanderStar.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'battle-commander-star-test-'));
let pass = 0;
let fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log('PASS:', label); }
  else { fail++; console.error('FAIL:', label, detail ?? ''); }
}

async function bundleModule(sourcePath, tag) {
  const entry = path.join(TMP, `entry-${tag}.ts`);
  const out = path.join(TMP, `out-${tag}.cjs`);
  fs.writeFileSync(entry, `export * from ${JSON.stringify(sourcePath)};\n`);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'es2020',
    outfile: out,
    nodePaths: [path.join(ROOT, 'node_modules')],
    logLevel: 'silent',
  });
  // Pakiet three ma wlasna kopie w bundlu -- ladujemy wlasny, zeby Sprite/Group byly spojne.
  return require(out);
}

function makeArmy() {
  return [
    { id: 'w1', isArmyCommander: false },
    { id: 'gen', isArmyCommander: true },
    { id: 'w2' },
    { id: 'w3', isArmyCommander: false },
  ];
}


/** Lokalizuje miejsca `group = buildUnitModel(...)` i sprawdza, czy po `scene.add(group)` jest gwiazdka. */
function findUnitGroupSites(src) {
  const lines = src.split('\n');
  const sites = [];
  let fn = '?';
  for (let i = 0; i < lines.length; i++) {
    const m = /^  (?:private |public |)(_[A-Za-z0-9_]+)\(/.exec(lines[i]);
    if (m) fn = m[1];
    if (/group = buildUnitModel\(/.test(lines[i])) {
      let addIdx = -1;
      for (let j = i; j < Math.min(lines.length, i + 25); j++) {
        if (/this\.scene\.add\(group\);/.test(lines[j])) { addIdx = j; break; }
      }
      const covered = addIdx >= 0 && /this\._attachCommanderStar\(group, bu\);/.test(lines.slice(addIdx, addIdx + 3).join('\n'));
      sites.push({ line: i + 1, fn, covered });
    }
  }
  return { sites, uncovered: sites.filter(s => !s.covered) };
}

function runChecks(mod, label) {
  const { battleCommanderStarIds, attachBattleCommanderStar, BATTLE_COMMANDER_STAR_NAME } = mod;
  const army = makeArmy();
  const ids = battleCommanderStarIds(army);
  check(`${label}: dla armii z generalem dokladnie jeden cel (gen)`,
    ids.length === 1 && ids[0] === 'gen', JSON.stringify(ids));

  const noGeneral = [{ id: 'a' }, { id: 'b', isArmyCommander: false }];
  check(`${label}: armia bez generala -- zero celow`,
    battleCommanderStarIds(noGeneral).length === 0);

  const dead = [{ id: 'g', isArmyCommander: true, dead: true }];
  check(`${label}: martwy generał nie dostaje gwiazdki`,
    battleCommanderStarIds(dead).length === 0);

  const build = (unit) => {
    const grp = new THREE.Group();
    const s = attachBattleCommanderStar(grp, unit, 1.2);
    const marks = grp.children.filter(c => c.name === BATTLE_COMMANDER_STAR_NAME);
    return { s, marks, grp };
  };

  const gen = build({ id: 'gen', isArmyCommander: true });
  check(`${label}: generał dostaje dokladnie jeden sprite gwiazdki jako dziecko grupy`,
    gen.s !== null && gen.marks.length === 1 && gen.s.isSprite === true);
  check(`${label}: gwiazdka lezy nad punktem stania (localY = 1.2)`,
    gen.s && Math.abs(gen.s.position.y - 1.2) < 1e-9 && gen.s.position.x === 0 && gen.s.position.z === 0);
  check(`${label}: gwiazdka nie przechwytuje klikniec (raycast no-op)`,
    gen.s && gen.s.raycast() === undefined && new THREE.Raycaster().intersectObject(gen.s, false).length === 0);
  check(`${label}: gwiazdka ma tekstury DataTexture (bez canvas) i depthTest wylaczony`,
    gen.s && gen.s.material.map && gen.s.material.map.isDataTexture === true && gen.s.material.depthTest === false);

  const plain = build({ id: 'w', isArmyCommander: false });
  check(`${label}: zwykla jednostka -- brak gwiazdki`, plain.s === null && plain.marks.length === 0);
  const absent = build({ id: 'x' });
  check(`${label}: jednostka bez pola isArmyCommander -- brak gwiazdki`, absent.s === null);
  const deadGen = build({ id: 'g', isArmyCommander: true, dead: true });
  check(`${label}: martwy generał -- brak gwiazdki przy budowie`, deadGen.s === null);

  // Oba strony: ta sama funkcja, bez wzgledu na ownerColor.
  const enemy = build({ id: 'eg', isArmyCommander: true, ownerColor: 0xff0000 });
  check(`${label}: generał strony przeciwnej dostaje ta sama gwiazdke`,
    enemy.s !== null && enemy.s.name === BATTLE_COMMANDER_STAR_NAME && enemy.s.scale.x === gen.s.scale.x);

  const tex = mod.getBattleCommanderStarTexture();
  let filled = 0;
  let outline = 0;
  let transparent = 0;
  for (let i = 0; i < tex.image.data.length; i += 4) {
    const a = tex.image.data[i + 3];
    if (a === 0) transparent++;
    else if (tex.image.data[i] === 255 && tex.image.data[i + 1] === 216) filled++;
    else outline++;
  }
  check(`${label}: tekstura gwiazdki ma wypelnienie zlote i przezroczyste tlo`,
    filled > 200 && transparent > 500 && outline > 0, JSON.stringify({ filled, outline, transparent }));
}

async function main() {
  try {
    const mod = await bundleModule(SRC, 'real');
    runChecks(mod, 'realny modul');

    // Mutacja na KOPII zrodla: warunek celu zastapiony przez true -> zwykle jednostki dostaja gwiazdke.
    const original = fs.readFileSync(SRC, 'utf8');
    const mutatedSrc = original.replace(
      'return unit.isArmyCommander === true && unit.dead !== true && unit.removed !== true;',
      'return true;',
    );
    if (mutatedSrc === original) {
      check('mutacja kopii: wzorzec warunku znaleziony w zrodle', false, 'wzorzec nie trafil');
    } else {
      const mutatedPath = path.join(TMP, 'battleCommanderStar.mutated.ts');
      fs.writeFileSync(mutatedPath, mutatedSrc);
      const mutMod = await bundleModule(mutatedPath, 'mut');
      const army = makeArmy();
      const mutIds = mutMod.battleCommanderStarIds(army);
      check('mutacja kopii (warunek = true) daje czerwono: zwykle jednostki dostaja gwiazdke',
        mutIds.length !== 1, JSON.stringify(mutIds));
    }


    // Pokrycie ścieżek tworzenia grup jednostek w scenie (R-WEB-...-Q1 runda 2):
    // każde miejsce `group = buildUnitModel(...)` w battleScene.ts musi po
    // `this.scene.add(group)` dołączać gwiazdkę przez _attachCommanderStar.
    // Obejmuje rozstawienie (_placeUnits), oblężenie (_placeSiegeDefenders) i
    // Reset rozstawiania (_placeUnitsOneSide).
    const sceneSrc = fs.readFileSync(path.join(ROOT, 'src/battle/battleScene.ts'), 'utf8');
    const coverage = findUnitGroupSites(sceneSrc);
    check(`pokrycie: ${coverage.sites.length} miejsc budowy grupy jednostki, wszystkie z gwiazdką`,
      coverage.sites.length === 4 && coverage.uncovered.length === 0,
      JSON.stringify(coverage));
    check('pokrycie: ścieżka Reset (_placeUnitsOneSide) ma gwiazdkę',
      coverage.sites.some(s => s.fn === '_placeUnitsOneSide' && s.covered));
    if (coverage.sites.length > 0) {
      // Mutacja na KOPII: usunięcie wywołania w _placeUnitsOneSide -> czerwono.
      const mutatedScene = sceneSrc.replace(
        /(private _placeUnitsOneSide[\s\S]*?this\.scene\.add\(group\);\n)\s*this\._attachCommanderStar\(group, bu\);\n/,
        '$1');
      const mutCov = findUnitGroupSites(mutatedScene);
      check('mutacja kopii (brak gwiazdki w _placeUnitsOneSide) daje czerwono',
        mutCov.uncovered.some(s => s.fn === '_placeUnitsOneSide'), JSON.stringify(mutCov));
    }

    // Zrodlo nie zalezy od przelacznika paskow i nie wiesza sie na barsVisible.
    check('modul nie zalezy od przelacznika paskow HP (barsVisible)',
      !/barsVisible/.test(original));
  } catch (err) {
    fail++;
    console.error('FAIL: wyjatek', err && err.stack ? err.stack : err);
  } finally {
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
