'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const THREE = require(path.resolve(__dirname, '..', 'node_modules', 'three'));

const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'commander-star-test-'));
const ENTRY = path.join(TMP, 'entry.ts');
const OUT = path.join(TMP, 'entry.cjs');
let pass = 0;
let fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log('PASS:', label); }
  else { fail++; console.error('FAIL:', label, detail ?? ''); }
}

async function main() {
  try {
    const plateSource = fs.readFileSync(path.join(ROOT, 'src/render/unitStatPlate.ts'), 'utf8');
    const mergeSource = fs.readFileSync(path.join(ROOT, 'src/game/armyMerge.ts'), 'utf8');
    const unitsSource = fs.readFileSync(path.join(ROOT, 'src/render/units.ts'), 'utf8');
    const mainSource = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    check('emblemat cywilizacji ma dokładnie czterokrotny bok względem poprzedniego rozmiaru',
      /PLATE_OWNER_ICON_SIZE\s*=\s*0\.80\s*\*\s*HEX_R/.test(plateSource));
    check('środek emblematu wylicza położenie z nowego rozmiaru, zachowując przypięcie do tabliczki',
      /PLATE_OWNER_X\s*=\s*-\(PLATE_BG_W\s*\/\s*2\s*\+\s*PLATE_OWNER_GAP\s*\+\s*PLATE_OWNER_ICON_SIZE\s*\/\s*2\)/.test(plateSource));
    check('w stackVitals flaga wodza obejmuje dowolnego członka stosu',
      /hasCommander:\s*stack\.some\(unit\s*=>\s*unit\.isGeneral\s*===\s*true\)/.test(mergeSource));
    check('renderer uwzględnia zarówno dowódcę w reprezentancie, jak i w reszcie stosu',
      /applyUnitCommanderStar\(tokenObj,\s*vitals\s*\?\s*vitals\.hasCommander\s*:\s*unit\.isGeneral\s*===\s*true\)/.test(unitsSource));
    check('w epoce Kamienia wybór modelu dowódcy zależy od wynalezienia Koła',
      /const epoch = empireEpochForOwner\(ownerId\)[\s\S]*?if \(epoch === 1\)[\s\S]*?const hasWheel = techs\.includes\('Koło'\)[\s\S]*?stoneGeneralUnitId\(hasWheel\)/.test(mainSource));

    fs.writeFileSync(ENTRY,
      `export { applyUnitCommanderStar, applyUnitVeteranBadgeStarCount, COMMANDER_STAR_HIT_UD } from ${JSON.stringify(path.join(ROOT, 'src/render/unitVeteranBadges.ts'))};\n`
      + `export { VETERAN_BADGE_RESERVED_Y } from ${JSON.stringify(path.join(ROOT, 'src/render/unitUpgradeBadges.ts'))};\n`
      + `export { stoneGeneralUnitId } from ${JSON.stringify(path.join(ROOT, 'src/game/generals.ts'))};\n`
      + `export { stackVitals } from ${JSON.stringify(path.join(ROOT, 'src/game/armyMerge.ts'))};\n`);
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
      outfile: OUT, logLevel: 'silent',
    });
    const badges = require(OUT);
    check('przed Kołem wódz jest Wojownikiem, po Kole jest na Rydwanie (woły)',
      badges.stoneGeneralUnitId(false) === 'Wojownik'
        && badges.stoneGeneralUnitId(true) === 'Rydwan (woły)');
    const stack = new THREE.Group();
    badges.applyUnitVeteranBadgeStarCount(stack, 3);
    const representative = {
      id: 'representative', ownerId: 0, typeId: 'Wojownik', category: 'Wręcz',
      q: 0, r: 0, ruch: 1, ruchLeft: 1, isGeneral: false,
    };
    const commanderUnit = {
      id: 'commander', ownerId: 0, typeId: 'Wojownik', category: 'Wręcz',
      q: 0, r: 0, ruch: 1, ruchLeft: 1, isGeneral: true,
    };
    const vitalsDeps = {
      maxHpOf: () => 10,
      defOf: () => ({ meleeAttack: 1, meleeDefence: 1, health: 10 }),
    };
    const roster = [representative];
    const withoutCommander = badges.stackVitals(roster, vitalsDeps);
    badges.applyUnitCommanderStar(stack, withoutCommander.hasCommander);
    check('produkcyjne stackVitals bez dowódcy nie pokazuje gwiazdy na reprezentancie',
      withoutCommander.hasCommander === false && !stack.getObjectByName('commanderStarBadge'));
    roster.push(commanderUnit);
    const withNonRepresentativeCommander = badges.stackVitals(roster, vitalsDeps);
    badges.applyUnitCommanderStar(stack, withNonRepresentativeCommander.hasCommander);
    const commander = stack.getObjectByName('commanderStarBadge');
    check('produkcyjne stackVitals wykrywa dowódcę jako nie-reprezentanta i pokazuje gwiazdę na reprezentancie',
      withNonRepresentativeCommander.hasCommander === true
        && representative.id !== commanderUnit.id && !!commander);
    const veteran = stack.getObjectByName('veteranBadge');
    let commanderStarHits = 0;
    let veteranStarHits = 0;
    commander?.traverse(node => { if (node.userData[badges.COMMANDER_STAR_HIT_UD]) commanderStarHits++; });
    veteran?.traverse(node => { if (node.userData.veteranBadgeHit) veteranStarHits++; });
    check('wódz/generał ma osobną gwiazdę nad rzędem doświadczenia',
      !!commander && commander.position.y > badges.VETERAN_BADGE_RESERVED_Y,
      commander?.position.y);
    check('symbol wodza nie zmienia trzech gwiazdek doświadczenia',
      veteranStarHits === 6 && commanderStarHits === 2,
      { veteranStarHits, commanderStarHits });
    const originalCommander = commander;
    badges.applyUnitCommanderStar(stack, true);
    check('ponowne odświeżenie nie duplikuje symbolu dowódcy',
      stack.children.filter(node => node.name === 'commanderStarBadge').length === 1);
    roster.pop();
    const afterCommanderLoss = badges.stackVitals(roster, vitalsDeps);
    badges.applyUnitCommanderStar(stack, afterCommanderLoss.hasCommander);
    check('po usunięciu dowódcy produkcyjny stan stosu i symbol na reprezentancie znikają',
      afterCommanderLoss.hasCommander === false
        && !stack.getObjectByName('commanderStarBadge') && originalCommander.parent === null);
  } finally {
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`\ncommander-star-emblem-test: ${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exit(1); });
