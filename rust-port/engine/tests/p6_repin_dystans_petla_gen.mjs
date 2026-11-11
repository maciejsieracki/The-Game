// R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1: generator wektorow fazy dystansowej `resolveCombat`
// z URUCHOMIONEGO weba (origin/main), nie z przepisanej kopii.
//
// Uzycie (Node 22, esbuild 0.24.2 zainstalowany poza repo):
//   node p6_repin_dystans_petla_gen.mjs <katalog-z-gra-src> <katalog-esbuild> <wyjscie.json>
// gdzie <katalog-z-gra-src> zawiera `gra/src` i `gra/data` (git archive origin/main gra/src gra/data).
// Scenariusze: deterministyczny PRNG (mulberry32, seed 6101); rng walki to zapisana sekwencja
// losowan, wiec Rust odtwarza dokladnie te same wartosci. Modyfikatory civ/budynkow/trudnosci
// sa neutralne; `defFinalObrona` = Obrona * (1 + structureDefBonusPct/100).
import { createRequire } from 'node:module';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const [webDir, esbuildDir, outPath] = process.argv.slice(2);
if (!webDir || !esbuildDir || !outPath) {
  console.error('uzycie: node p6_repin_dystans_petla_gen.mjs <web> <esbuild> <out.json>');
  process.exit(2);
}
const esbuild = createRequire(join(esbuildDir, 'x.js'))('esbuild');
const tmp = mkdtempSync(join(tmpdir(), 'dystans-petla-'));
const bundle = join(tmp, 'combat.mjs');
await esbuild.build({
  entryPoints: [join(webDir, 'gra/src/game/combat.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'error',
  loader: { '.json': 'json' },
});
const { resolveCombat } = await import(pathToFileURL(bundle).href);

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = mulberry32(6101);
const pick = (a) => a[Math.floor(r() * a.length)];
const ri = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

const SHOOTERS = [
  { counterTyp: 'Slinger', typNazwa: 'Procarz' },
  { counterTyp: 'Distance', typNazwa: 'Łucznik pieszy' },
  { counterTyp: 'Distance', typNazwa: 'Oszczepnik' },
  { counterTyp: 'Mount', typNazwa: 'Łucznik konny' },
  { counterTyp: 'Spearman', typNazwa: 'Hoplita' },
];
function unit() {
  const s = pick(SHOOTERS);
  const missile = s.counterTyp === 'Spearman' ? 0 : ri(0, 30);
  return {
    ...s, rola: 'Dystans',
    meleeAttack: ri(3, 40), meleeDefence: ri(3, 40), weaponDamage: ri(5, 30), armor: ri(0, 25),
    piercing: ri(0, 5), chargeBonus: ri(0, 8), health: ri(60, 200), missileAttack: missile,
    'Ilosc pociskow': pick([null, '---', '', 0, 3, 6, '8', 12]),
    'Prog dezercji (% health)': pick([null, 0.25, 0.4, 0.6]),
    unbreakable: r() < 0.15,
  };
}
const num = (s) => Number(s);
const LINE = /^R(\d+)\[Dyst-(ATK|DEF)\] (trafienie|chybienie) \(([\d.]+)(?:<|>=)([\d.e+-]+)%\)(?: -> (\d+) obra\. \w+ HP: (-?[\d.]+))?/;

const cases = [];
for (let i = 0; i < 600; i++) {
  const attacker = unit(); const defender = unit();
  if (i % 7 === 0) { attacker.missileAttack = 0; }
  if (i % 11 === 0) { defender.missileAttack = 0; }
  const structPct = pick([0, 0, 50, 100, 200]);
  const aAmmoOv = i % 5 === 0 ? ri(0, 10) : undefined;
  const dAmmoOv = i % 6 === 0 ? ri(0, 10) : undefined;
  const maxRounds = i % 9 === 0 ? ri(1, 4) : 200;
  const draws = [];
  const rngSrc = mulberry32(1000 + i);
  const rng = () => { const v = rngSrc(); draws.push(v); return v; };
  const res = resolveCombat(attacker, defender, {
    rng, maxRounds, attackerAmmo: aAmmoOv, defenderAmmo: dAmmoOv,
    structureDefBonusPct: structPct,
  });
  const idx = res.log.indexOf('=== Faza zwarczia ===');
  const ranged = idx < 0 ? res.log : res.log.slice(0, idx);
  const shots = [];
  let note = null;
  for (const line of ranged) {
    const m = LINE.exec(line);
    if (m) {
      shots.push({
        round: num(m[1]), side: m[2] === 'ATK' ? 'attacker' : 'defender',
        hit: m[3] === 'trafienie', hitPct: num(m[5]),
        damage: m[6] ? num(m[6]) : 0, targetHp: m[7] ? num(m[7]) : null,
      });
    } else if (/ucieka po ostrzale|zniszczony|Limit rund/.test(line)) {
      note = line;
    }
  }
  // draws po fazie dystansowej = liczba strzalow (jedno losowanie na strzal); reszta to zwarcie
  const parseAmmo = (u, ov) => {
    if (ov !== undefined) return ov;
    const raw = u['Ilosc pociskow'];
    if (raw === null || raw === '---' || raw === '') return 0;
    return typeof raw === 'string' ? parseInt(raw, 10) : raw;
  };
  cases.push({
    attacker, defender, structPct, maxRounds,
    attackerAmmo: parseAmmo(attacker, aAmmoOv), defenderAmmo: parseAmmo(defender, dAmmoOv),
    draws: draws.slice(0, shots.length),
    expected: {
      shots, note,
      routedHint: /ucieka po ostrzale|zniszczony/.test(note ?? ''),
      limit: /Limit rund/.test(note ?? ''),
    },
  });
}
writeFileSync(outPath, JSON.stringify({ seed: 6101, cases }));
console.log('cases', cases.length, 'shots', cases.reduce((s, c) => s + c.expected.shots.length, 0));

// --- fieldPower (unit-power.ts:122) ---
const up = join(tmp, 'unit-power.mjs');
await esbuild.build({
  entryPoints: [join(webDir, 'gra/src/game/unit-power.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: up, logLevel: 'error',
  loader: { '.json': 'json' },
});
const { fieldPower } = await import(pathToFileURL(up).href);
const fp = [];
for (let i = 0; i < 400; i++) {
  const s = pick(SHOOTERS);
  const u = {
    Typ: s.counterTyp, Jednostka: s.typNazwa,
    meleeAttack: ri(0, 40) + (r() < 0.3 ? 0.5 : 0), meleeDefence: ri(0, 40), weaponDamage: ri(0, 30),
    piercing: ri(0, 6), armor: ri(0, 30), chargeBonus: ri(0, 15) + (r() < 0.3 ? 0.25 : 0),
    health: ri(20, 250), missileAttack: ri(0, 35),
  };
  fp.push({ input: u, expected: fieldPower(u) });
}
writeFileSync(outPath.replace('petla', 'fieldpower'), JSON.stringify(fp));
console.log('fieldPower', fp.length);
