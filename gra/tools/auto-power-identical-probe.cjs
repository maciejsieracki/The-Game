'use strict';
// R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1 r3 -- sciezka AUTO "na mocy M" (auto-battle-power.ts)
// dla identycznych jednostek, fort ON/OFF po stronie obroncy, tryb losowe/pewne. Prawdziwe funkcje silnika
// (esbuild). Odtwarza rachunek main.ts doMapAutoResolveIncoming/effectiveDefenderM dla bitwy w polu (teren
// Rownina: terrMult z terrainDefenseMultiplier; fort = +50% Obrony przez fieldFortifyDefenseBonus).
// Uzycie (z gra/): N=300 node tools/auto-power-identical-probe.cjs [NazwaJednostki]
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const GRA = path.resolve(__dirname, '..');
const N = Number(process.env.N || 300);
const UNIT = process.argv[2] || 'Wojownik';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'autopow-'));
const entry = path.join(tmp, 'e.ts');
const bundle = path.join(tmp, 'b.cjs');
fs.writeFileSync(entry, [
  `export { resolveAutoBattleByPower } from ${JSON.stringify(path.join(GRA, 'src/game/auto-battle-power.ts'))};`,
  `export { armyFieldPower, armyFieldPowerSplit } from ${JSON.stringify(path.join(GRA, 'src/game/unit-power.ts'))};`,
  `export { setActiveHitMode } from ${JSON.stringify(path.join(GRA, 'src/game/hit-mode.ts'))};`,
  `export { fieldFortifyDefenseBonus } from ${JSON.stringify(path.join(GRA, 'src/game/city-defense.ts'))};`,
  '',
].join('\n'));
execFileSync(path.join(GRA, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node', '--format=cjs', `--outfile=${bundle}`, '--log-level=error'], { cwd: GRA });
const eng = require(bundle);
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data/units.json'), 'utf8'));
const def = units.find((u) => u['Jednostka'] === UNIT);
const FORT = JSON.parse(fs.readFileSync(path.join(GRA, 'data/combat-params.json'), 'utf8'))['oblężenie'].fortify_obrona_proc;
function lcg(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const split = eng.armyFieldPowerSplit(def);
const rows = [];
for (const hit of ['losowe', 'pewne']) {
  eng.setActiveHitMode(hit);
  for (const fort of [false, true]) {
    const mAtk = Math.round((split.attack + split.defense) * 10) / 10;
    const defScaled = fort ? split.defense * (1 + FORT / 100) : split.defense;
    const mDef = Math.round((split.attack + defScaled) * 10) / 10;
    let atk = 0, def_ = 0, tie = 0, lAtk = 0, lDef = 0;
    for (let i = 0; i < N; i++) {
      const r = eng.resolveAutoBattleByPower({ mAtk, mDef, rng: lcg(7 + i) });
      if (r.winner === 'attacker') atk++; else if (r.winner === 'defender') def_++; else tie++;
      lAtk += r.lossAtkPct; lDef += r.lossDefPct;
    }
    const row = { path: 'AUTO-moc-M', hit, fortDef: fort, unit: UNIT, mAtk, mDef, attackerPct: +(100 * atk / N).toFixed(1), defenderPct: +(100 * def_ / N).toFixed(1), tiePct: +(100 * tie / N).toFixed(1), avgLossAtk: +(lAtk / N).toFixed(3), avgLossDef: +(lDef / N).toFixed(3) };
    rows.push(row); console.log(JSON.stringify(row));
  }
}
fs.rmSync(tmp, { recursive: true, force: true });
