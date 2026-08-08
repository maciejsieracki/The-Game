'use strict';
/**
 * unit-context-card-test.cjs — karta jednostki w panelu bocznym (HP, ruch, siły).
 * Run from gra/:  node tools/unit-context-card-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// N4 (BUG-TOOLTIP-MOC-NIEPELNA, Evaluator 2026-08-08): nazwa własna, NIE
// 'brandAssets-stub.ts' — ten plik jest współdzielony i ŚLEDZONY w gicie
// (patrz danina-podatek-tooltip-ui-test.cjs / army-merge-dismiss-bounce-test.cjs),
// a jego zawartość różni się między bramkami (ta bramka dopisuje unitIconSvg).
// Każde uruchomienie brudziło niezwiązany trackowany plik w git status. Osobna
// nazwa (wzorem pre-battle-brandAssets-stub.ts) trzyma stub tej bramki poza
// współdzielonym plikiem, więc nie trzeba go już w ogóle śledzić w gicie
// (patrz wpis w .gitignore).
const STUB_FILE = path.resolve(STUB_DIR, 'unit-context-card-brandAssets-stub.ts');
const ENTRY_FILE = path.resolve(__dirname, '.unit-context-card-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-context-card-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(STUB_FILE, `
export function brandIconSvg(_key, _size) { return ''; }
export function mapResourceIconSvg(_key, _size) { return ''; }
export function terrainIconSvg(_key, _size) { return ''; }
export function unitIconSvg(_key) { return ''; }
`, 'utf8');

fs.writeFileSync(ENTRY_FILE, `
export { buildUnitContextTooltipHtml } from '../src/ui/hexContextTooltip';
export { fieldPower } from '../src/game/unit-power';
export { unitCardCombatDisplay } from '../src/game/unit-card-stats';
`, 'utf8');

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
  },
};

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE_FILE,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[unit-context-card-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const M = require(BUNDLE_FILE);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const combat = {
    atakBase: 8,
    atakEffective: 10,
    obronaBase: 6,
    obronaEffective: 7,
    hpMaxBase: 20,
    hpMaxEffective: 22,
    pancerzBase: 2,
    pancerzEffective: 3,
    // BUG-TOOLTIP-MOC-NIEPELNA: pozostałe 4 pola wzoru fieldPower() (Łucznik-podobne,
    // niezerowy missileAttack -- łapie regresję na jednostce dystansowej).
    weaponDamageBase: 3,
    weaponDamageEffective: 4,
    piercingBase: 1,
    piercingEffective: 1,
    chargeBonusBase: 0,
    chargeBonusEffective: 0,
    missileAttackBase: 5,
    missileAttackEffective: 6,
  };

  const base = {
    displayName: 'Łucznik',
    q: 1,
    r: 2,
    ruchLeft: 1,
    ruchMax: 2,
    combat,
    zasieg: 2,
    esc,
  };

  let pass = 0;
  let fail = 0;
  function ok(c, m) {
    if (c) { pass++; console.log('  PASS:', m); }
    else { fail++; console.error('  FAIL:', m); }
  }

  // 1) HP fallback when u.hp undefined — shows effective max, not "—".
  {
    const html = M.buildUnitContextTooltipHtml({ ...base, hp: undefined });
    ok(html.includes('22/22'), '1) HP fallback -> hpMaxEffective when hp undefined');
    ok(!html.includes('>—<'), '1b) no dash HP placeholder');
    ok(html.includes('sp-unit-stack-bar-hp'), '1c) HP bar present');
  }

  // 2) Movement bar in compact view.
  {
    const html = M.buildUnitContextTooltipHtml({ ...base, hp: 18 });
    ok(html.includes('1/2') && html.includes('sp-unit-stack-bar-mov'), '2) movement bar + value');
    ok(html.includes('18/22'), '2b) explicit HP value');
  }

  // 3) readOnly hides movement row.
  {
    const html = M.buildUnitContextTooltipHtml({ ...base, readOnly: true });
    ok(!html.includes('sp-unit-stack-bar-mov'), '3) readOnly hides movement bar');
    ok(html.includes('sp-unit-stack-bar-hp'), '3b) HP bar still shown');
  }

  // 4) Siły zastosowane + Moc pola — MUSI liczyć z pełnych 8 pól fieldPower(),
  // nie tylko meleeAttack/meleeDefence/armor/health (BUG-TOOLTIP-MOC-NIEPELNA).
  {
    const html = M.buildUnitContextTooltipHtml({ ...base });
    const power = M.fieldPower({
      meleeAttack: combat.atakEffective,
      meleeDefence: combat.obronaEffective,
      armor: combat.pancerzEffective,
      health: combat.hpMaxEffective,
      weaponDamage: combat.weaponDamageEffective,
      piercing: combat.piercingEffective,
      chargeBonus: combat.chargeBonusEffective,
      missileAttack: combat.missileAttackEffective,
    });
    // attack = 10 + 4 + 1 + 0/2 + 6/2 = 18 ; defense = 7 + 3 + 22/2 = 21 ; total = 39.
    ok(power.attack === 18 && power.defense === 21 && power.total === 39,
      '4) fieldPower reference math sanity (attack=18 defense=21 total=39)');
    ok(html.includes('Siły zastosowane'), '4b) forces section header');
    ok(html.includes(`Atak ${power.attack}`) && html.includes(`Razem ${power.total}`), '4c) field power breakdown includes weaponDamage/piercing/chargeBonus/missileAttack');
    // Regresja: wersja z 4 polami (bug) dałaby Atak 10 · Razem 31 — upewnij się, że TEGO nie ma.
    ok(!html.includes('Atak 10 ·'), '4d) not the buggy 4-field total (would read "Atak 10")');
  }

  // 6) Moc pola — Konnica-podobna jednostka (niezerowy weaponDamage/piercing/chargeBonus,
  // missileAttack=0), świeży rekrut bez bonusów budynkowych/weterana (Base === Effective).
  // Referencja: gra/data/units.json "Konnica" ma precomputed fieldPower=49 dla tych statów.
  {
    const konnicaCombat = {
      atakBase: 8, atakEffective: 8,
      obronaBase: 5, obronaEffective: 5,
      hpMaxBase: 28, hpMaxEffective: 28,
      pancerzBase: 4, pancerzEffective: 4,
      weaponDamageBase: 7, weaponDamageEffective: 7,
      piercingBase: 6, piercingEffective: 6,
      chargeBonusBase: 10, chargeBonusEffective: 10,
      missileAttackBase: 0, missileAttackEffective: 0,
    };
    const html = M.buildUnitContextTooltipHtml({ ...base, displayName: 'Konnica', combat: konnicaCombat });
    // attack = 8+7+6+10/2+0/2 = 26 ; defense = 5+4+28/2 = 23 ; total = 49 (== units.json fieldPower).
    ok(html.includes('Atak 26') && html.includes('Obrona 23') && html.includes('Razem 49'),
      '6) Konnica rekrut Moc pola = 49 (matches units.json precomputed fieldPower, was 31 before fix)');
  }

  // 7) Moc pola — Łucznik-podobna jednostka dystansowa (niezerowy missileAttack,
  // chargeBonus=0), świeży rekrut. Referencja: gra/data/units.json "Łucznik" fieldPower=17.5.
  {
    const lucznikCombat = {
      atakBase: 2, atakEffective: 2,
      obronaBase: 2, obronaEffective: 2,
      hpMaxBase: 16, hpMaxEffective: 16,
      pancerzBase: 1, pancerzEffective: 1,
      weaponDamageBase: 2, weaponDamageEffective: 2,
      piercingBase: 1, piercingEffective: 1,
      chargeBonusBase: 0, chargeBonusEffective: 0,
      missileAttackBase: 3, missileAttackEffective: 3,
    };
    const html = M.buildUnitContextTooltipHtml({ ...base, displayName: 'Łucznik', combat: lucznikCombat });
    // attack = 2+2+1+0/2+3/2 = 6.5 ; defense = 2+1+16/2 = 11 ; total = 17.5 (== units.json precomputed).
    ok(html.includes('Atak 6.5') && html.includes('Obrona 11') && html.includes('Razem 17.5'),
      '7) Łucznik rekrut Moc pola = 17.5, missileAttack pokryty (regresja na jednostce dystansowej)');
  }

  // 8) unitCardCombatDisplay() PRAWDZIWA funkcja (nie ręczny literał combat jak
  // w blokach 1-4/6/7 powyżej) — łapie regresję w unit-card-stats.ts samo,
  // niezależnie od hexContextTooltip.ts. Mutacyjnie zweryfikowane przez
  // Evaluatora (BUG-TOOLTIP-MOC-NIEPELNA N3): wymuszenie `chargeBonusEffective: 0`
  // w unitCardCombatDisplay() przechodziło bramkę CICHO, bo test nigdy nie
  // wołał tej funkcji. Bases mają niezerowe weaponDamage/piercing/chargeBonus/
  // missileAttack (pola teraz WYMAGANE w UnitCardCombatBases, patrz komentarz
  // w unit-card-stats.ts -- to dodatkowo łapie main.ts::unitCardCombatFor
  // pomijający jedno z nich jako błąd tsc --noEmit, nie tylko tu w runtime).
  {
    const cardBases = {
      atak: 8, obrona: 6, hpMax: 20, pancerz: 3,
      weaponDamage: 5, piercing: 2, chargeBonus: 9, missileAttack: 4,
    };
    // 8a) bez progresu (unit=null) -> Effective === Base (softFrac=0, armorFrac=0).
    const noProgress = M.unitCardCombatDisplay(cardBases, null);
    ok(noProgress.weaponDamageBase === 5 && noProgress.weaponDamageEffective === 5,
      '8a) weaponDamage odzwierciedla wejście bases (base=effective=5, brak progresu)');
    ok(noProgress.piercingBase === 2 && noProgress.piercingEffective === 2,
      '8a) piercing odzwierciedla wejście bases (base=effective=2, brak progresu)');
    ok(noProgress.chargeBonusBase === 9 && noProgress.chargeBonusEffective === 9,
      '8a) chargeBonus odzwierciedla wejście bases (base=effective=9, brak progresu) — łapie mutację "chargeBonusEffective: 0" na sztywno');
    ok(noProgress.missileAttackBase === 4 && noProgress.missileAttackEffective === 4,
      '8a) missileAttack odzwierciedla wejście bases (base=effective=4, brak progresu)');

    // 8b) tylko budynek (+20%, brak weterana) -> BUG-TOOLTIP-MOC-BUDYNKI-Q1=A:
    // chargeBonus nadal skalowany softFrac (budynek działa), ale weaponDamage/
    // piercing MUSZĄ zostać na Base — silnik walki (unit-building-bonuses.ts:
    // 512-527) nie stosuje premii budynkowej do tych dwóch pól, więc tooltip
    // też nie powinien.
    const withBuildingOnly = M.unitCardCombatDisplay(cardBases, { parametryBonusProc: 20, pancerzBonusProc: 10 });
    ok(withBuildingOnly.weaponDamageBase === 5 && withBuildingOnly.weaponDamageEffective === 5,
      `8b) weaponDamage IGNORUJE premię budynkową bez weterana (base=effective=5, got ${withBuildingOnly.weaponDamageEffective})`);
    ok(withBuildingOnly.piercingBase === 2 && withBuildingOnly.piercingEffective === 2,
      `8b) piercing IGNORUJE premię budynkową bez weterana (base=effective=2, got ${withBuildingOnly.piercingEffective})`);
    ok(withBuildingOnly.chargeBonusBase === 9 && withBuildingOnly.chargeBonusEffective === 10.8,
      `8b) chargeBonus NADAL skalowany pełnym softFrac budynkowym (9*1.2=10.8, got ${withBuildingOnly.chargeBonusEffective})`);
    ok(withBuildingOnly.missileAttackBase === 4 && withBuildingOnly.missileAttackEffective === 4.8,
      `8b) missileAttack NADAL skalowany pełnym softFrac budynkowym (4*1.2=4.8, got ${withBuildingOnly.missileAttackEffective}) — łapie degradację softFrac->veteranFrac dla tego pola`);

    // 8c) budynek (+20%) + weteran ★★★ (+20%, battlesSurvived=3) -> softFrac=0.40,
    // ale weaponDamage/piercing mają rosnąć TYLKO o premię weterana (0.20), NIE
    // o pełny softFrac (0.40) — BUG-TOOLTIP-MOC-BUDYNKI-Q1=A, przykład Konnicy
    // z zadania Sędziego. chargeBonus w TYM SAMYM wywołaniu nadal rośnie z
    // pełnym softFrac (budynek+weteran) — to jest test różnicujący pola.
    const withBuildingAndVeteran = M.unitCardCombatDisplay(cardBases, {
      parametryBonusProc: 20, pancerzBonusProc: 10, battlesSurvived: 3,
    });
    ok(withBuildingAndVeteran.weaponDamageBase === 5 && withBuildingAndVeteran.weaponDamageEffective === 6,
      `8c) weaponDamage skalowany WYŁĄCZNIE premią weterana (5*1.2=6, NIE 5*1.4=7, got ${withBuildingAndVeteran.weaponDamageEffective})`);
    ok(withBuildingAndVeteran.piercingBase === 2 && withBuildingAndVeteran.piercingEffective === 2.4,
      `8c) piercing skalowany WYŁĄCZNIE premią weterana (2*1.2=2.4, NIE 2*1.4=2.8, got ${withBuildingAndVeteran.piercingEffective})`);
    ok(withBuildingAndVeteran.chargeBonusBase === 9 && withBuildingAndVeteran.chargeBonusEffective === 12.6,
      `8c) chargeBonus NADAL skalowany pełnym softFrac (budynek+weteran) (9*1.4=12.6, got ${withBuildingAndVeteran.chargeBonusEffective})`);
    ok(withBuildingAndVeteran.weaponDamageEffective < withBuildingAndVeteran.weaponDamageBase * 1.4 - 1e-9,
      `8c) weaponDamageEffective NIE osiąga pełnego softFrac (0.40) — musi być < ${(5 * 1.4).toFixed(2)}, got ${withBuildingAndVeteran.weaponDamageEffective}`);
    ok(withBuildingAndVeteran.missileAttackBase === 4 && withBuildingAndVeteran.missileAttackEffective === 5.6,
      `8c) missileAttack NADAL skalowany pełnym softFrac (budynek+weteran) (4*1.4=5.6, NIE 4*1.2=4.8, got ${withBuildingAndVeteran.missileAttackEffective}) — łapie degradację softFrac->veteranFrac dla tego pola`);
  }

  // 5) Expanded stats grid.
  {
    const html = M.buildUnitContextTooltipHtml({ ...base, expanded: true });
    ok(html.includes('Statystyki jednostki'), '5) expanded stats section');
    ok(html.includes('sp-unit-expanded-stats'), '5b) expanded stats grid');
    ok(html.includes('Zasięg') && html.includes('Ruch max'), '5c) range and move max rows');
  }

  console.log(`\nunit-context-card-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
