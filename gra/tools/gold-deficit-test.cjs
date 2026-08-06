'use strict';
/**
 * gold-deficit-test.cjs — regresja kary za deficyt Złota (R-DEFICYT-ZLOTA-KARA-Q1=A,
 * próg R-DEFICYT-ZLOTA-TRIGGER-Q1=B).
 *
 * PRÓG: wyczerpanie Skarbca (ownerTreasury(ownerId) < 0), NIE saldo bieżącej tury —
 * wierna analogia do głodu wojska (central < 0 w empire-food.ts), odrzucona pierwsza
 * wersja triggera (saldo tury<0) sprawdzana jest tu WPROST (scenariusz Ewaluatora:
 * Skarbiec=5000, saldo=-1/turę -> kara NIE uruchamia się przez ~5000 tur, dopóki
 * Skarbiec faktycznie nie spadnie poniżej zera).
 *
 * Osłabienie statów bojowych: 75% meleeAttack, meleeDefence, weaponDamage, piercing,
 * chargeBonus, health, missileAttack; armor bez zmian; Prog dezercji × (2 − mult).
 * Atrycja HP: max(1, floor(maxHp × frac)) po karencji N tur Z RZĘDU ze Skarbcem<0.
 *
 * Run: node tools/gold-deficit-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.gold-deficit-entry.ts');
const BUNDLE = path.resolve(__dirname, '.gold-deficit-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  applyGoldDeficitStatMultToCombatUnit,
  applyGoldDeficitHpLoss,
  buildGoldDeficitParams,
  freshGoldDeficitState,
  advanceGoldDeficit,
  isGoldDeficit,
  isGoldDeficitStarving,
  getGoldDeficitCountdown,
  clearLastGoldDeficitTicks,
} from '../src/game/gold-deficit';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}
function near(a, b, eps = 0.001) { return Math.abs(a - b) < eps; }

// ---------------------------------------------------------------------------
// 1) applyGoldDeficitStatMultToCombatUnit — identyczna matematyka co głód wojska.
// ---------------------------------------------------------------------------

const baseCu = {
  meleeAttack: 40,
  meleeDefence: 30,
  weaponDamage: 20,
  piercing: 5,
  chargeBonus: 10,
  health: 100,
  missileAttack: 0,
  armor: 15,
  'Prog dezercji (% health)': 0.4,
  rola: 'piechota',
  counterTyp: 'piechota',
};

const mult = 0.75;
const out = M.applyGoldDeficitStatMultToCombatUnit(baseCu, mult);

ok(near(out.meleeAttack, 30), 'meleeAttack × 0.75');
ok(near(out.meleeDefence, 22.5), 'meleeDefence × 0.75');
ok(near(out.weaponDamage, 15), 'weaponDamage × 0.75');
ok(near(out.piercing, 3.75), 'piercing × 0.75');
ok(near(out.chargeBonus, 7.5), 'chargeBonus × 0.75');
ok(near(out.health, 75), 'health × 0.75');
ok(near(out.missileAttack, 0), 'missileAttack × 0.75');
ok(out.armor === 15, 'armor unchanged');
ok(near(out['Prog dezercji (% health)'], 0.5), 'Prog dezercji × (2−0.75)=1.25 → 0.5');

const noop = M.applyGoldDeficitStatMultToCombatUnit(baseCu, 1);
ok(noop.meleeAttack === baseCu.meleeAttack, 'mult=1 → no change');

// ---------------------------------------------------------------------------
// 2) buildGoldDeficitParams — parametry osobne od Żywności (zloto_deficyt_*).
// ---------------------------------------------------------------------------

const params = M.buildGoldDeficitParams({
  ekonomia_miasta: {
    zloto_deficyt_stat_mult: { normal: 0.75 },
    zloto_deficyt_karencja_tur: { normal: 3 },
    zloto_deficyt_hp_frac: { normal: 0.08 },
  },
});
ok(params.zlotoDeficytStatMult === 0.75, 'buildGoldDeficitParams: zlotoDeficytStatMult');
ok(params.zlotoDeficytKarencjaTur === 3, 'buildGoldDeficitParams: zlotoDeficytKarencjaTur');
ok(params.zlotoDeficytHpFrac === 0.08, 'buildGoldDeficitParams: zlotoDeficytHpFrac');

const defaults = M.buildGoldDeficitParams({});
ok(defaults.zlotoDeficytStatMult === 0.75, 'default zlotoDeficytStatMult 0.75');
ok(defaults.zlotoDeficytKarencjaTur === 3, 'default zlotoDeficytKarencjaTur 3');
ok(defaults.zlotoDeficytHpFrac === 0.08, 'default zlotoDeficytHpFrac 0.08');

// ---------------------------------------------------------------------------
// 3) SCENARIUSZ EWALUATORA: Skarbiec=5000, saldo=-1/turę.
//    Próg SKARBCA (Q1=B): kara NIE uruchamia się dopóki Skarbiec (nie saldo) < 0.
//    Stary próg (saldo<0, ODRZUCONY) uruchomiłby karę natychmiast w turze 1 —
//    tu jawnie sprawdzamy, że NIE tak działa.
// ---------------------------------------------------------------------------

{
  M.clearLastGoldDeficitTicks();
  const states = new Map([[0, M.freshGoldDeficitState()]]);
  const karencja = 3;
  const p = M.buildGoldDeficitParams({ ekonomia_miasta: { zloto_deficyt_karencja_tur: { normal: karencja } } });

  let skarbiec = 5000;
  const saldoPerTurn = -1;
  let firstDeficitTurn = null;

  // Symulacja tur: Skarbiec spada o 1/turę (saldo=-1), aż faktycznie przekroczy 0.
  for (let t = 1; t <= 5002; t++) {
    skarbiec += saldoPerTurn; // "bankowanie" tej tury — analogiczne do main.ts (PO zbankowaniu)
    const tickResult = M.advanceGoldDeficit([0], states, () => skarbiec, p);
    const tick = tickResult.byOwner.get(0);
    if (tick.deficytZlota && firstDeficitTurn === null) firstDeficitTurn = t;
    // Przez każdą turę Skarbiec>=0 kara MUSI być wyłączona — to jest jądro Q1=B.
    if (skarbiec >= 0) {
      if (tick.deficytZlota) {
        failed++;
        console.error(`FAIL: tura ${t} skarbiec=${skarbiec} >= 0, ale deficytZlota=true (stary próg saldo<0 by tu odpalił błędnie)`);
      }
    }
  }
  ok(firstDeficitTurn === 5001, `deficyt startuje dokładnie gdy Skarbiec<0 (tura 5001, było ${firstDeficitTurn})`);
  ok(M.isGoldDeficit(0) === true, 'isGoldDeficit(0) true po 5001 turach (Skarbiec=-1)');
  // Karencja 3 tury: deficyt od tury 5001 -> atrycja aktywna od tury 5003.
  ok(M.isGoldDeficitStarving(0) === false, 'atrycja jeszcze NIEaktywna tuż po przekroczeniu progu (karencja w toku)');
}

// ---------------------------------------------------------------------------
// 4) Karencja + atrycja: dokładny licznik tur z rzędu ze Skarbcem<0.
// ---------------------------------------------------------------------------

{
  M.clearLastGoldDeficitTicks();
  const states = new Map([[0, M.freshGoldDeficitState()]]);
  const p = M.buildGoldDeficitParams({ ekonomia_miasta: { zloto_deficyt_karencja_tur: { normal: 3 } } });

  // Sekwencja Skarbca per tura: dodatni, dodatni, zero, ujemny×4, potem odbudowa.
  const seq = [10, 5, 0, -1, -2, -3, -4, 100];
  const expectDeficyt   = [false, false, false, true, true, true, true, false];
  const expectAtrycja   = [false, false, false, false, false, true, true, false];
  const expectTuryPo    = [0, 0, 0, 1, 2, 3, 4, 0];

  for (let i = 0; i < seq.length; i++) {
    const skarbiec = seq[i];
    const res = M.advanceGoldDeficit([0], states, () => skarbiec, p);
    const tick = res.byOwner.get(0);
    ok(tick.deficytZlota === expectDeficyt[i], `krok ${i}: Skarbiec=${skarbiec} deficytZlota=${expectDeficyt[i]}`);
    ok(tick.zlotoDeficytAtrycjaAktywna === expectAtrycja[i], `krok ${i}: Skarbiec=${skarbiec} atrycja=${expectAtrycja[i]}`);
    ok(tick.turyDeficytuZlotaPo === expectTuryPo[i], `krok ${i}: Skarbiec=${skarbiec} turyPo=${expectTuryPo[i]} (było ${tick.turyDeficytuZlotaPo})`);
  }
  ok(M.isGoldDeficit(0) === false, 'po odbudowie (Skarbiec=100) isGoldDeficit=false');
  ok(M.isGoldDeficitStarving(0) === false, 'po odbudowie atrycja=false');
}

// ---------------------------------------------------------------------------
// 5) getGoldDeficitCountdown — odliczanie do atrycji podczas karencji.
// ---------------------------------------------------------------------------

{
  M.clearLastGoldDeficitTicks();
  const states = new Map([[0, M.freshGoldDeficitState()]]);
  const p = M.buildGoldDeficitParams({ ekonomia_miasta: { zloto_deficyt_karencja_tur: { normal: 3 } } });
  M.advanceGoldDeficit([0], states, () => -5, p); // tura 1 deficytu
  ok(M.getGoldDeficitCountdown(0, 3) === 2, 'countdown po 1 turze deficytu (karencja 3) = 2');
  M.advanceGoldDeficit([0], states, () => -5, p); // tura 2
  ok(M.getGoldDeficitCountdown(0, 3) === 1, 'countdown po 2 turze deficytu = 1');
  M.advanceGoldDeficit([0], states, () => -5, p); // tura 3 -> atrycja aktywna, countdown = null
  ok(M.getGoldDeficitCountdown(0, 3) === null, 'countdown null gdy atrycja już aktywna');
}

// ---------------------------------------------------------------------------
// 6) applyGoldDeficitHpLoss — atrycja HP, jednostki cywilne pomijane, zgon przy hp<=0.
// ---------------------------------------------------------------------------

{
  const units = [
    { id: 'u1', ownerId: 0, typeId: 'legionista', category: 'wojskowa', hp: 100, hpMax: 100 },
    { id: 'u2', ownerId: 0, typeId: 'osadnik', category: 'osadnik', hp: 30, hpMax: 30 },
    { id: 'u3', ownerId: 0, typeId: 'legionista', category: 'wojskowa', hp: 5, hpMax: 100 },
    { id: 'u4', ownerId: 1, typeId: 'legionista', category: 'wojskowa', hp: 100, hpMax: 100 },
  ];
  const res = M.applyGoldDeficitHpLoss(units, 0, 0.08, () => 100);
  ok(res.damagedCount === 2, 'applyGoldDeficitHpLoss: 2 jednostki właściciela 0 dotknięte (osadnik i owner 1 pominięci)');
  const u1 = units.find(u => u.id === 'u1');
  ok(u1.hp === 92, `u1 hp 100 -> 92 (−8% maxHp=100), było ${u1.hp}`);
  const u2 = units.find(u => u.id === 'u2');
  ok(u2.hp === 30, 'u2 (osadnik, cywil) HP niezmienione');
  const u3 = units.find(u => u.id === 'u3');
  ok(u3.hp === 0, `u3 hp 5 -> 0 (clamp), było ${u3.hp}`);
  ok(res.destroyedIds.includes('u3'), 'u3 w destroyedIds (hp<=0)');
  ok(!res.destroyedIds.includes('u1'), 'u1 NIE w destroyedIds (hp>0)');
  const u4 = units.find(u => u.id === 'u4');
  ok(u4.hp === 100, 'u4 (inny właściciel) HP niezmienione');
}

console.log(`gold-deficit-test: ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
