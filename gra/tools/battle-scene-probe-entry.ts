// R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1 r3: sonda PRAWDZIWEJ sceny walki (BattleScene)
// dla identycznych jednostek: oba kierunki ataku, tryby trafien, fort, kary gracza (glod/deficyt zlota),
// sciezki: 'pomin' (skip() = ta sama symulacja co AUTO sceniczne, przewinieta), 'auto' (czas rzeczywisty),
// 'instant' (computeInstantResult), 'manual-attack' / 'manual-hold' (tryb reczny gracza: rozkaz ataku / trzymaj).
// Uzycie: window.__probe.run(cfg) -> wynik jednej bitwy (patrz battle-scene-probe.cjs).
import { BattleScene } from '../src/battle/battleScene.ts';
import { setActiveHitMode } from '../src/game/hit-mode.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const row = (name: string): any => (units as any[]).find(u => u['Jednostka'] === name);
function bu(id: string, name: string, color: number, extra: Record<string, unknown> = {}): any {
  const r = row(name);
  const hp = Math.max(1, Math.round(Number(r.health ?? r['Health'] ?? 10)));
  return { id, nazwa: String(r['Nazwa EN'] ?? name), kategoria: 'miecznik', ownerColor: color, stats: r, hp, maxHp: hp, ...extra };
}
interface Cfg {
  unit: string; atkOwner: 'barb' | 'player'; hit: 'losowe' | 'pewne'; fortDef: boolean; fortAtk?: boolean;
  path: 'auto' | 'pomin' | 'instant' | 'manual-attack' | 'manual-hold'; seed: number; terrain?: string;
  playerHungry?: boolean; playerGoldDef?: boolean;
}
async function run(cfg: Cfg): Promise<any> {
  setActiveHitMode(cfg.hit);
  const atkBarb = cfg.atkOwner === 'barb';
  const atkPlayerPenalty = !atkBarb ? { armyHungry: cfg.playerHungry === true, goldDeficit: cfg.playerGoldDef === true } : {};
  const defPlayerPenalty = atkBarb ? { armyHungry: cfg.playerHungry === true, goldDeficit: cfg.playerGoldDef === true } : {};
  const A = bu('a0', cfg.unit, 0xc84040, { fortifiedInField: cfg.fortAtk === true, ...atkPlayerPenalty });
  const D = bu('d0', cfg.unit, 0xffd54a, { fortifiedInField: cfg.fortDef === true, ...defPlayerPenalty });
  const scene: any = new BattleScene({
    attacker: [A], defender: [D], teren: cfg.terrain ?? 'Rownina',
    data: { units, counters, terrainCombat, cywilizacje: [] },
    attackerIsBarbarian: atkBarb, defenderIsBarbarian: !atkBarb,
    attackerCivLabel: atkBarb ? 'Barbarzyncy' : 'Gracz', defenderCivLabel: atkBarb ? 'Gracz' : 'Barbarzyncy',
    deployPlayerSide: atkBarb ? 'def' : 'atk',
    combatRng: mulberry32(cfg.seed),
  } as any);
  scene.renderer.setPixelRatio(0.1);
  // Licznik uderzen per strona i kolejnosc (a=atakujacy, d=obronca, liczba = numer rundy).
  const blows: Record<string, number> = { atk: 0, def: 0 };
  const blowSeq: string[] = [];
  const origBlow = scene._singleBlow.bind(scene);
  scene._singleBlow = (a: any, d: any, r: boolean) => { blows[a.side]++; blowSeq.push(a.side[0] + scene.roundNo); return origBlow(a, d, r); };
  const startHp = { a: A.hp, d: D.hp };
  const startPos = { atk: [scene.atk[0]?.q, scene.atk[0]?.r], def: [scene.def[0]?.q, scene.def[0]?.r] };
  const wasManualAtStart = { v: null as null | boolean };
  let winner: string;
  const t0 = performance.now();
  const deadline = performance.now() + Number((window as any).__probeTimeoutMs || 120000);
  const waitDone = () => new Promise<void>((res) => {
    const iv = setInterval(() => { if (scene.finished || performance.now() > deadline) { clearInterval(iv); res(); } }, 25);
  });
  if (cfg.path === 'instant') {
    scene.deployPhase = false;
    scene._skipInstantFallback();
    winner = scene._endWinner;
  } else if (cfg.path === 'manual-attack' || cfg.path === 'manual-hold') {
    scene.play(() => {});
    scene._setSpeedIdx(9, { clamp: true });
    wasManualAtStart.v = scene._manualMode;
    const playerSide = atkBarb ? 'def' : 'atk';
    const player = scene[playerSide][0];
    const enemy = scene[playerSide === 'atk' ? 'def' : 'atk'][0];
    await new Promise<void>((res) => {
      const iv = setInterval(() => {
        if (scene.finished || performance.now() > deadline) { clearInterval(iv); res(); return; }
        if (scene._battleAwaitingOrders && !scene.busy) {
          player.playerOrder = cfg.path === 'manual-attack' ? { type: 'attack', targetId: enemy.bu.id } : { type: 'hold' };
          scene._kickoffBattleTurn();
        }
      }, 20);
    });
    winner = scene._endWinner;
  } else {
    scene.play(() => {});
    scene._setSpeedIdx(9, { clamp: true });
    wasManualAtStart.v = scene._manualMode;
    if (cfg.path === 'auto') { if (scene._manualMode) scene._toggleManualMode(); } else scene.skip();
    await waitDone();
    winner = scene._endWinner;
  }
  const res = {
    cfg, winner, finished: scene.finished, ms: Math.round(performance.now() - t0),
    atkHpLeft: scene.atk[0]?.bu.hp ?? null, defHpLeft: scene.def[0]?.bu.hp ?? null, startHp, startPos,
    manualAtStart: wasManualAtStart.v,
    firstBlows: (scene.log as string[]).filter(l => /trafia|chybia/.test(l)).slice(0, 4), tail: scene.log.slice(-12),
    rounds: scene.roundNo, blows, blowSeq: blowSeq.slice(0, 40).join(' '), routed: scene.routedUnits.map((x: any) => x.side),
    morale: { atk: [scene.atk[0]?.morale, scene.atk[0]?.fleeMorale, scene.atk[0]?.moraleMax], def: [scene.def[0]?.morale, scene.def[0]?.fleeMorale, scene.def[0]?.moraleMax] },
    pos: { atk: [scene.atk[0]?.q, scene.atk[0]?.r], def: [scene.def[0]?.q, scene.def[0]?.r] },
  };
  try { scene.dispose(); } catch { /* */ }
  return res;
}
(window as any).__probe = { run, ready: true };
