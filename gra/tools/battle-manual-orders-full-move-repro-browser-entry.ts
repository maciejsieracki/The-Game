// R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-REPRO-Q1 (pomiar, bez zmian kodu gry): prawdziwa bitwa 3D w Chromium.
// Trzy tryby tej samej jednostki (ta sama armia, to samo ziarno):
//   auto  -- AUTO (pomin = skip, silnik sam steruje obiema stronami), jak w sondzie pursuit-pace;
//   move  -- RECZNIE: jednostki gracza (atk) dostaja rozkaz "marsz do pola X" (kolumna ru.q+6*kierunek, ten sam rzad);
//   attack-- RECZNIE: jednostki gracza dostaja rozkaz "atakuj cel" (najblizszy zywy wrog; przy zabiciu -- nastepny).
// Sonda NIE zmienia logiki gry: tylko owija metody (_doMove, _doMeleeAttack, _doRangedAttack, _beginTurn, acted),
// tak jak battle-pursuit-pace-browser-entry.ts. Zbiera per runda i per jednostka atk: liczbe krokow (_doMove poza
// planowaniem AUTO), liczbe ciosow, pule ruchu (movementPoints) i ruch niewykorzystany w chwili konca aktywacji.
// Query: ?mode=auto|move|attack &atk=Hastati:6 &def=Hastati:6 &seed=N &cap=12 (maks. liczba tur mierzonych)
import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies, PRESETS } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const q = new URLSearchParams(location.search);
const mode = q.get('mode') ?? 'auto';
const CAP = Number(q.get('cap') ?? '12');
const seed = Number(q.get('seed') ?? '1');
{
  let a = (seed >>> 0) || 1;
  Math.random = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const parse = (s: string) => s.split(',').filter(Boolean).map(p => { const [u, c] = p.split(':'); return { unitTypeId: u, count: Number(c) }; });
(PRESETS as any).maly = {
  label: 'manual-orders-repro', teren: q.get('teren') ?? 'Rownina',
  attacker: parse(q.get('atk') ?? 'Hastati:6'), defender: parse(q.get('def') ?? 'Hastati:6'),
};
const armies = buildTestArmies(units, 'maly');
const scene: any = new BattleScene({
  attacker: armies.attacker, defender: armies.defender, teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym', defenderCivLabel: 'Grecja',
} as any);
{
  let c = ((seed >>> 0) ^ 0x9E3779B9) >>> 0 || 1;
  scene._combatRng = () => {
    c = (c + 0x6D2B79F5) >>> 0;
    let t = c;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
scene.renderer.setPixelRatio(Number(q.get('pr') ?? '0.1'));
scene.play(() => {}); // jak w pursuit-pace: start fazy rozstawiania (bez tego skip() trafia w instant fallback)
// Przyspieszenie zegara wirtualnego tylko dla pomiaru (ta sama sciezka _advanceVClock, mnoznik SPEED_STEPS): bez tego
// klatki headless daja ~2,7 s wirtualnej bitwy na 15 s zegara scianowego. Logika walki/ruchu nie jest zmieniana.
scene.speedMul = Number(q.get('speed') ?? '8');

const api: any = {
  ready: true, done: false, result: null as any, rows: [] as any[], ends: [] as any[], rounds: [] as any[],
  orders: [] as any[], attackLog: [] as any[], seq: 0,
};
(window as any).__e2e = api;
(window as any).__scene = scene;

const alive = (u: any) => !u.dead && !u.fadingOut && !u.removed;
let curRound = -1;
let curRows = new Map<string, any>();

// Ruch niewykorzystany w chwili konca aktywacji (acted=true w tej rundzie, poza planowaniem AUTO).
function instrumentActed(ru: any, round: number): void {
  let val = !!ru.acted;
  Object.defineProperty(ru, 'acted', {
    configurable: true, enumerable: true,
    get() { return val; },
    set(v: boolean) {
      if (v && !val && !scene._autoBatchPlanning && scene.roundNo === round) {
        api.ends.push({ round, id: ru.bu.id, side: ru.side, moveLeft: Math.round(ru.moveLeft * 100) / 100, q: ru.q, r: ru.r, routed: !!ru.routed });
      }
      val = v;
    },
  });
}

function snapshot(): void {
  const r = scene.roundNo;
  if (r === curRound) return;
  curRound = r;
  curRows = new Map();
  for (const side of ['atk', 'def']) {
    for (const ru of (side === 'atk' ? scene.atk : scene.def)) {
      if (!alive(ru)) continue;
      const row = {
        round: r, side, id: ru.bu.id, nazwa: ru.bu.nazwa, mp: scene._movementPointsFor(ru.bu),
        q0: ru.q, r0: ru.r, q1: ru.q, steps: 0, attacks: 0, order: ru.playerOrder?.type ?? '',
      };
      curRows.set(ru.bu.id, row);
      api.rows.push(row);
      instrumentActed(ru, r);
    }
  }
  api.rounds.push({ round: r, nAtk: scene.atk.filter(alive).length, nDef: scene.def.filter(alive).length });
}

// Rozkazy gracza (tylko tryby reczne). Ustawiane przed kazda tura; "marsz" raz (po dojsciu zostaje 'none'),
// "atak" -- ponownie na najblizszego zywego wroga, gdy poprzedni cel zniknal.
function assignOrders(): void {
  if (mode === 'auto') return;
  const enemies = scene.def.filter(alive);
  if (enemies.length === 0) return;
  const avgDefQ = enemies.reduce((s: number, u: any) => s + u.q, 0) / enemies.length;
  for (const ru of scene.atk.filter(alive)) {
    if (ru.routed) continue;
    if (mode === 'move' && ru.playerOrder.type === 'none' && !ru.marchAssigned) {
      const dir = avgDefQ >= ru.q ? 1 : -1;
      const col = Math.max(0, Math.min(ru.q + 6 * dir, (scene.cols ?? 40) - 1));
      ru.playerOrder = { type: 'move', col, row: ru.r };
      ru.marchAssigned = true;
      api.orders.push({ round: scene.roundNo, id: ru.bu.id, type: 'move', col, row: ru.r });
    } else if (mode === 'attack') {
      const tgtOk = ru.playerOrder.type === 'attack' && enemies.some((e: any) => e.bu.id === ru.playerOrder.targetId);
      if (!tgtOk) {
        const near = [...enemies].sort((a: any, b: any) =>
          (Math.abs(a.q - ru.q) + Math.abs(a.r - ru.r)) - (Math.abs(b.q - ru.q) + Math.abs(b.r - ru.r)))[0];
        ru.playerOrder = { type: 'attack', targetId: near.bu.id };
        api.orders.push({ round: scene.roundNo, id: ru.bu.id, type: 'attack', targetId: near.bu.id });
      }
    }
  }
}

{
  const origBegin = scene._beginTurn.bind(scene);
  scene._beginTurn = (...args: any[]) => {
    if (!scene.finished && !scene._battleAwaitingOrders) {
      assignOrders();
      snapshot();
      if (scene.roundNo > CAP && !api.done) {
        api.done = true;
        api.result = { timedOut: false, capped: true, roundNo: scene.roundNo, finished: !!scene.finished };
        return undefined;
      }
    }
    return origBegin(...args);
  };
  const origMove = scene._doMove.bind(scene);
  scene._doMove = (ru: any, col: number, row: number, done: any) => {
    const rec = curRows.get(ru.bu.id);
    if (rec && !scene._autoBatchPlanning) { rec.steps++; rec.q1 = col; }
    return origMove(ru, col, row, done);
  };
  for (const fn of ['_doMeleeAttack', '_doRangedAttack']) {
    const orig = scene[fn].bind(scene);
    scene[fn] = (attacker: any, defender: any, done: any) => {
      const rec = curRows.get(attacker.bu.id);
      if (rec && !scene._autoBatchPlanning) rec.attacks++;
      if (!scene._autoBatchPlanning) api.attackLog.push({ round: scene.roundNo, id: attacker.bu.id, side: attacker.side, target: defender.bu.id, ranged: fn === '_doRangedAttack' });
      return orig(attacker, defender, done);
    };
  }
}

function finish(): void {
  if (!api.result) api.result = { timedOut: false, capped: false, roundNo: scene.roundNo, finished: !!scene.finished, winner: scene._endWinner ?? null };
  api.done = true;
}

// Przeciwnik (def) zostaje na doktrynie AUTO takze w trybie recznym. W produkcyjnym _activateUnit galaz doktryny jest
// pominieta, gdy _manualMode=true (dla wszystkich stron), wiec obrona nie wykonuje aktywacji i tura nie domyka sie
// (zmierzone: turIdx stoi na 7/12, busy=true, brak timerow). Sonda przelacza flage TYLKO na czas synchronicznego
// wejscia do _activateUnit dla strony def; strona atk (gracz) zostaje w trybie recznym i na rozkazach.
{
  const origAct = scene._activateUnit.bind(scene);
  scene._activateUnit = (ru: any, done: any) => {
    // Pomiar: ruch niewykorzystany = moveLeft w chwili konca aktywacji (kazda strona, tylko odczyt).
    const round = scene.roundNo;
    const done2 = () => {
      if (!scene._autoBatchPlanning) api.ends.push({ round, id: ru.bu.id, side: ru.side, moveLeft: Math.round(ru.moveLeft * 100) / 100, q: ru.q, r: ru.r, routed: !!ru.routed });
      done();
    };
    if (ru.side === 'atk' || !scene._manualMode) return origAct(ru, done2);
    scene._manualMode = false;
    try { origAct(ru, done2); } finally { scene._manualMode = true; }
  };
}

// Start: AUTO -> skip (jak w pursuit-pace); RECZNIE -> koniec wdrozenia, rozkazy, pierwsza tura bez skip.
if (mode === 'auto') {
  scene.skip();
  if (scene.finished) finish();
} else {
  if (scene.deployPhase) scene._endDeployPhase();
  assignOrders();
  scene._kickoffBattleTurn();
}
const watcher = setInterval(() => {
  if (api.done) { clearInterval(watcher); return; }
  if (scene.finished) { finish(); clearInterval(watcher); }
}, 200);
