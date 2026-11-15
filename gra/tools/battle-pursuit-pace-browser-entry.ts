// R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 (ETAP 1, pomiar): prawdziwa bitwa 3D w Chromium
// (AUTO przewijane / pomin). Zbiera per runda i per jednostka: pule ruchu (movementPoints), faktycznie wykonane
// kroki (wywolania _doMove poza planowaniem AUTO), kontakt wrecz na poczatku rundy, paceCap i lineAdvanceCap.
// Query: ?atk=Hastati:10,Lucznik:5 &def=Hastati:10 &seed=N &mode=skip|watch|instant &atkhp=1 &defhp=1
import { BattleScene } from '../src/battle/battleScene.ts';
import { buildTestArmies, PRESETS } from '../src/battle/testBattle.ts';
import units from '../data/units.json';
import counters from '../data/counters.json';
import terrainCombat from '../data/terrain-combat.json';

const q = new URLSearchParams(location.search);
{
  let a = (Number(q.get('seed') ?? '1') >>> 0) || 1;
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
  label: 'pursuit-pace', teren: q.get('teren') ?? 'Rownina',
  attacker: parse(q.get('atk') ?? 'Hastati:10'), defender: parse(q.get('def') ?? 'Hastati:10'),
};
const mode = q.get('mode') ?? 'skip';
const armies = buildTestArmies(units, 'maly');
for (const [side, mul] of [[armies.attacker, Number(q.get('atkhp') ?? '1')], [armies.defender, Number(q.get('defhp') ?? '1')]] as const) {
  for (const bu of side as any[]) { bu.hp = Math.max(1, Math.round(bu.maxHp * mul)); }
}
const scene: any = new BattleScene({
  attacker: armies.attacker, defender: armies.defender, teren: armies.teren,
  data: { units, counters, terrainCombat, cywilizacje: [] },
  attackerCivLabel: 'Rzym', defenderCivLabel: 'Grecja',
} as any);
scene.renderer.setPixelRatio(Number(q.get('pr') ?? '0.1'));

type Row = {
  round: number; side: string; id: string; nazwa: string; formation: number; group: string;
  mp: number; q0: number; r0: number; contact0: boolean; routed0: boolean; mounted: boolean;
  paceCap: number | null; lineCap: number | null; doctrine: string; steps: number; stepsPlan: number; q1: number;
  attacks: number; leftover: number; dbg?: any;
};
let leftoverPrev = new Map<string, number>();
const api: any = { seq: 0, ready: true, done: false, result: null as any, rows: [] as Row[], rounds: [] as any[] };
(window as any).__e2e = api;
(window as any).__scene = scene;

const fmt = (v: number) => (Number.isFinite(v) ? v : null);
let curRows = new Map<string, Row>();
let curRound = -1;

// R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1 (runda 4): sonda KONCA aktywacji. W chwili, gdy silnik oznacza jednostke jako
// "acted" (koniec jej aktywacji w tej rundzie), zapisuje STAN SCENY: niewykorzystany ruch, liczba wolnych pol przyleglych,
// czy istnieje sciezka do pozycji ciosu i czy jednostka stoi w zasiegu ciosu. Podstawa twardego testu autentycznosci blokady (T3).
api.ends = [] as any[];
function instrumentActed(ru: any, round: number): void {
  let val = !!ru.acted;
  Object.defineProperty(ru, 'acted', {
    configurable: true, enumerable: true,
    get() { return val; },
    set(v: boolean) {
      if (v && !val && !scene._autoBatchPlanning && scene.roundNo === round) {
        let freeNb = 0; const freeCells: string[] = [];
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = ru.q + dc; const nr = ru.r + dr;
          if (nc < 0 || nr < 0) continue;
          if (scene.occByKey.has(`${nc},${nr}`)) continue;
          if (!scene._passableForUnit(ru, nc, nr)) continue;
          freeNb++; freeCells.push(`${nc},${nr}`);
        }
        let pathStep: string | null = null;
        try { pathStep = scene._firstStepAlongPathToAttack(ru); } catch { pathStep = null; }
        api.ends.push({
          round, id: ru.bu.id, mounted: !!ru.mounted, side: ru.side, routed: !!ru.routed,
          moveLeft: Math.round(ru.moveLeft * 100) / 100, freeNb, freeCells, pathExists: pathStep !== null,
          canStrike: scene._canAttackFrom(ru, ru.q, ru.r), struckRound: ru.struckRound === round,
          postStrikeBlocked: !!ru.postStrikeBlocked, q: ru.q, r: ru.r,
        });
      }
      val = v;
    },
  });
}

function snapshot(): void {
  const r = scene.roundNo;
  if (r === curRound) return;
  curRound = r;
  const alive = (u: any) => !u.dead && !u.fadingOut && !u.removed;
  const contact0 = [...scene.atk, ...scene.def].some((u: any) => alive(u) && !u.routed && !u.rangedBase
    && scene._canAttackFrom(u, u.q, u.r));
  const enemiesRouted = {
    atk: scene.def.filter((u: any) => alive(u) && u.routed).length,
    def: scene.atk.filter((u: any) => alive(u) && u.routed).length,
  };
  curRows = new Map();
  for (const side of ['atk', 'def']) {
    for (const ru of (side === 'atk' ? scene.atk : scene.def)) {
      if (!alive(ru)) continue;
      const row: Row = {
        round: r, side, id: ru.bu.id, nazwa: ru.bu.nazwa, formation: Math.floor(ru.formationRank ?? 0),
        group: String(ru.groupId ?? ''), mp: scene._movementPointsFor(ru.bu), q0: ru.q, r0: ru.r,
        contact0, routed0: !!ru.routed, mounted: !!ru.mounted,
        paceCap: fmt(scene._paceCapFor(ru)), lineCap: fmt(scene._lineAdvanceCap(ru)),
        doctrine: String(scene._effectiveMetaForUnit(ru).doctrine), steps: 0, stepsPlan: 0, q1: ru.q,
        attacks: 0, leftover: leftoverPrev.get(ru.bu.id) ?? -1,
        dbg: { rb: !!ru.rangedBase, gid: String(ru.groupId), fr: ru.formationRank, sw: scene.siegeWallCol,
          lineRaw: scene._lineAdvanceCap(ru), mpRaw: scene._movementPointsFor(ru.bu), dock: scene._effectiveMetaForUnit(ru).doctrine },
      };
      curRows.set(ru.bu.id, row);
      api.rows.push(row);
      instrumentActed(ru, r);
    }
  }
  api.rounds.push({ round: r, contact0, enemiesRouted, nUnits: curRows.size });
}

{
  const origBegin = scene._beginTurn.bind(scene);
  scene._beginTurn = (...args: any[]) => {
    leftoverPrev = new Map();
    for (const ru of [...scene.atk, ...scene.def]) leftoverPrev.set(ru.bu.id, Math.round(ru.moveLeft * 100) / 100);
    const res = origBegin(...args);
    if (!scene.finished && !scene._battleAwaitingOrders) snapshot();
    return res;
  };
  const origMove = scene._doMove.bind(scene);
  scene._doMove = (ru: any, col: number, row: number, done: any) => {
    const rec = curRows.get(ru.bu.id);
    if (rec) { if (scene._autoBatchPlanning) rec.stepsPlan++; else rec.steps++; rec.q1 = col; }
    if (!scene._autoBatchPlanning) {
      const fr = (new Error().stack ?? '').split('\n').slice(2, 7).map(l => (/at (?:\w+\.)?(\w+)/.exec(l) ?? [])[1] ?? '?');
      (api.callers ??= []).push({ round: scene.roundNo, id: ru.bu.id, mounted: !!ru.mounted, col, row, seq: ++api.seq, via: fr.join('<') });
    }
    return origMove(ru, col, row, done);
  };
  for (const fn of ['_doMeleeAttack', '_doRangedAttack']) {
    const orig = scene[fn].bind(scene);
    scene[fn] = (attacker: any, defender: any, done: any) => {
      const rec = curRows.get(attacker.bu.id);
      if (rec && !scene._autoBatchPlanning) rec.attacks++;
      if (!scene._autoBatchPlanning) (api.attackLog ??= []).push({ round: scene.roundNo, id: attacker.bu.id, seq: ++api.seq, nazwa: attacker.bu.nazwa, mounted: !!attacker.mounted, ranged: fn === '_doRangedAttack', target: defender.bu.id });
      return orig(attacker, defender, done);
    };
  }
}

// R-WEB-...-Q1 r2 (ETAP 1 r2): log powodu przerwania kazdego kroku wykonania AUTO (poza planowaniem).
// reason: go | occupied (kto zajmuje hex, czy juz zakonczyl swoj ruch) | impassable | plan_end.
const moveLog: any[] = [];
const goLog: any[] = [];
api.moves = moveLog;
api.goLog = goLog;
{
  const origRAM = scene._resolveAutoBatchMovement.bind(scene);
  scene._resolveAutoBatchMovement = function (ru: any, res: any, idx: number, done: any) {
    if (!scene._autoBatchPlanning) {
      let reason = 'go'; let occ = '';
      if (idx >= res.steps.length) reason = 'plan_end';
      else {
        const st = res.steps[idx];
        const o = scene.occByKey.get(`${st.col},${st.row}`);
        if (o && o !== ru) { reason = 'occupied'; occ = `${o.bu.id}/${o.side}/routed=${!!o.routed}/acted=${!!o.acted}/q=${o.q},${o.r}`; }
        else if (!scene._passableForUnit(ru, st.col, st.row)) reason = 'impassable';
      }
      // r2: po zakonczeniu planu -- czy jednostka stoi w zasiegu ciosu (zatrzymana przy wrogu) i kto obok.
      let adjInfo = '';
      if (reason === 'plan_end' || reason === 'go') {
        const can = scene._canAttackFrom(ru, ru.q, ru.r);
        const enemies = scene._enemiesOf(ru).filter((e: any) => !e.dead && !e.removed && !e.fadingOut);
        const adj = enemies.filter((e: any) => Math.abs(e.q - ru.q) + Math.abs(e.r - ru.r) <= 2);
        adjInfo = `can=${can};dir=${ru.attackDirection ?? ''};mounted=${!!ru.mounted};near2=${adj.map((e: any) => e.bu.id + (e.routed ? 'R' : '')).join('+')}`;
      }
      if (reason === 'go') goLog.push({ round: scene.roundNo, id: ru.bu.id, idx, plan: res.steps.length, ml: Math.round(ru.moveLeft * 100) / 100, routed: !!ru.routed, fin: !!scene.finished, susp: !!scene._autoBattleSuspended, man: !!scene._manualMode, normalPlan: !!(arguments as any)[4] });
      if (reason !== 'go') {
        moveLog.push({ round: scene.roundNo, id: ru.bu.id, side: ru.side, routed: !!ru.routed, idx, plan: res.steps.length,
          reason, occ, adjInfo, moveLeft: Math.round(ru.moveLeft * 100) / 100, mp: scene._movementPointsFor(ru.bu),
          pace: fmt(scene._paceCapFor(ru)), line: fmt(scene._lineAdvanceCap(ru)), q: ru.q, r: ru.r,
          nxt: idx < res.steps.length ? `${res.steps[idx].col},${res.steps[idx].row}` : '' });
      }
    }
    return origRAM(ru, res, idx, done, arguments[4]);
  };
}

// r2: powod konca planowania AUTO (per jednostka) -- ktora galaz _advanceStep zwraca bez kroku.
const planWhy: any[] = [];
api.planWhy = planWhy;
{
  const why = (ru: any, tag: string, extra?: any) => {
    if (scene._autoBatchPlanning) planWhy.push({ round: scene.roundNo, id: ru?.bu?.id, side: ru?.side, tag, mpLeft: ru ? Math.round(ru.moveLeft * 100) / 100 : null, ...(extra ?? {}) });
  };
  const wrap = (name: string, fn: (ru: any, ...a: any[]) => any, falsy: (r: any) => boolean, tag: string) => {
    const orig = scene[name].bind(scene);
    scene[name] = (ru: any, ...a: any[]) => {
      const r = orig(ru, ...a);
      if (falsy(r)) why(ru, tag);
      return r;
    };
  };
  wrap('_lineAdvanceWithinCap', null as any, (r: any) => r === false, 'lineCapBlock');
  wrap('_compactAttackAllowsStep', null as any, (r: any) => r === false, 'compactBlock');
  wrap('_firstStepAlongPathToAttack', null as any, (r: any) => r == null, 'bfsNoPath');
  wrap('_stepToward', null as any, (r: any) => r == null, 'greedyNoStep');
  wrap('_nearestEnemy', null as any, (r: any) => r == null, 'noEnemy');
  const origAdv = scene._advanceStep.bind(scene);
  scene._advanceStep = (ru: any, done: any) => {
    if (scene._autoBatchPlanning && ru.moveLeft <= 0) why(ru, 'advance_mp0');
    if (scene._autoBatchPlanning && scene._canAttackFrom(ru, ru.q, ru.r)) why(ru, 'advance_adjacent');
    return origAdv(ru, done);
  };
}


// r3: arbitraz fali AUTO (resolveAutoBatchPhase) -- czy plan jednostki zostal UCIETY (accepted < planned) i przez kogo.
// kind: snapshot (hex zajety na starcie fazy przez jednostke) | path (hex zarezerwowany przez sciezke wczesniejszej jednostki fali) | other.
const arb: any[] = [];
api.arb = arb;
{
  let lastIntents: any[] | null = null;
  let occ0: Map<string, string> | null = null;
  const origSnap = scene._snapshotAutoBatchIntents.bind(scene);
  scene._snapshotAutoBatchIntents = (side: any, units: any, ...rest: any[]) => {
    const first = lastIntents === null; // r3: tylko 1. wywolanie fazy = plan poczatkowy (kolejne to przeplanowanie ucietych planow konnicy)
    const r = origSnap(side, units, ...rest);
    if (first) {
      lastIntents = r;
      occ0 = new Map();
      for (const [k, u] of scene.occByKey) occ0.set(k, `${u.bu.id}/${u.side}${u.routed ? 'R' : ''}`);
    }
    return r;
  };
  const origBegin = scene._beginAutoBatchPhase.bind(scene);
  scene._beginAutoBatchPhase = (side: any, units: any) => {
    lastIntents = null; occ0 = null;
    const round = scene.roundNo;
    const intents = (): any[] => lastIntents ?? [];
    const res = origBegin(side, units);
    if (lastIntents && occ0) {
      const resolutions: any[] = scene._autoBatchResolutions ?? [];
      const seen = new Map<string, string>();
      for (const rr of resolutions) {
        const it = intents().find((i: any) => i.unitId === rr.unitId);
        if (it && rr.blocked) { // r3: ostateczny wynik arbitrazu (po ewentualnym przeplanowaniu ucietych planow konnicy)
          const cell = it.steps[rr.steps.length] ?? { col: -1, row: -1 };
          const key = `${cell.col},${cell.row}`;
          let kind = 'other'; let who = '';
          const o = occ0.get(key);
          if (o && !o.startsWith(rr.unitId + '/')) { kind = 'snapshot'; who = o; }
          else if (seen.has(key)) { kind = 'path'; who = seen.get(key)!; }
          const u = scene._findUnitById(rr.unitId);
          arb.push({ round, side, id: rr.unitId, mounted: !!u?.mounted, planned: it.steps.length, accepted: rr.steps.length, cell: key, kind, who, finalBlocked: !!rr.blocked });
        }
        for (const st of rr.steps) seen.set(`${st.col},${st.row}`, rr.unitId);
      }
    }
    return res;
  };
}

// r3: trace wyboru kroku w PLANOWANIU AUTO (BFS / greedy / najblizszy wrog) -- diagnostyka ping-pongu konnicy.
const planTrace: any[] = [];
api.planTrace = planTrace;
{
  const want = (ru: any): boolean => scene._autoBatchPlanning && ru?.mounted && ru.side === 'atk' && scene.roundNo >= 9 && scene.roundNo <= 16;
  const o1 = scene._firstStepAlongPathToAttack.bind(scene);
  scene._firstStepAlongPathToAttack = (ru: any, ...a: any[]) => {
    const r = o1(ru, ...a);
    if (want(ru)) planTrace.push({ round: scene.roundNo, id: ru.bu.id, fn: 'bfs', at: `${ru.q},${ru.r}`, res: r, ml: Math.round(ru.moveLeft * 100) / 100 });
    return r;
  };
  const o2 = scene._stepToward.bind(scene);
  scene._stepToward = (ru: any, target: any) => {
    const r = o2(ru, target);
    if (want(ru)) planTrace.push({ round: scene.roundNo, id: ru.bu.id, fn: 'greedy', at: `${ru.q},${ru.r}`, tgt: `${target?.bu?.id}@${target?.q},${target?.r}${target?.routed ? 'R' : ''}`, res: r });
    return r;
  };
  const o3 = scene._compactAttackAllowsStep.bind(scene);
  scene._compactAttackAllowsStep = (ru: any, c: number) => {
    const r = o3(ru, c);
    if (want(ru) && !r) planTrace.push({ round: scene.roundNo, id: ru.bu.id, fn: 'compactBlock', at: `${ru.q},${ru.r}`, col: c });
    return r;
  };
}

// r3: kontekst aktywacji konnicy w planowaniu (pozycja, cel, sasiedzi: zajeci/rezerwacja), by wyjasnic aktywacje bez kroku.
{
  const o4 = scene._cavalryAction.bind(scene);
  scene._cavalryAction = (ru: any, done: any) => {
    if (scene._autoBatchPlanning && ru.side === 'atk' && scene.roundNo >= 9 && scene.roundNo <= 16) {
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dr]) => {
        const k = `${ru.q + dc},${ru.r + dr}`;
        const o = scene.occByKey.get(k);
        return `${k}=${o ? (o.bu.id + (o.routed ? 'R' : '') + (o === ru ? 'self' : '')) : (scene._passableForUnit(ru, ru.q + dc, ru.r + dr) ? '.' : 'X')}`;
      });
      const tgt = scene._cavalryTarget(ru);
      const adj = scene._cavAdjacentNonSpear(ru);
      planTrace.push({ round: scene.roundNo, id: ru.bu.id, fn: 'cavAction', at: `${ru.q},${ru.r}`, ml: ru.moveLeft, tgt: tgt ? `${tgt.bu.id}@${tgt.q},${tgt.r}${tgt.routed ? 'R' : ''}` : null, adj: adj ? adj.bu.id : null, nb: nb.join(' '), nbFree: nb.filter(x => x.endsWith('=.')).length });
    }
    return o4(ru, done);
  };
}

function finish(): void {
  api.result = {
    winner: scene._endWinner, round: scene.roundNo,
    atkAlive: scene.atk.filter((u: any) => !u.dead && !u.removed).length,
    defAlive: scene.def.filter((u: any) => !u.dead && !u.removed).length,
    log: (scene.log as string[]).filter((l: string) => /Koniec|zalamane|PAT|ucieka|rozbit/i.test(l)).slice(-6),
  };
  api.done = true;
}
function loop(): void {
  if (scene.finished) { finish(); return; }
  requestAnimationFrame(loop);
}
scene.play(() => {});
scene._setSpeedIdx(9, { clamp: true });
if (mode === 'instant') scene._skipInstantFallback();
else if (mode === 'watch') { if (scene.deployPhase) scene._endDeployPhase(); scene._ffEnterAuto(); }
else scene.skip();
requestAnimationFrame(loop);
