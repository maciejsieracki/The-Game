// R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1: prawdziwa bitwa 3D (AUTO przewijana / auto-rozstrzygniecie)
// w Chromium; zbiera los kazdej jednostki (zabita / uciekla / ocalala) i liczbe atakow na routed.
// Query: ?atk=Hastati:10,Lucznik:5 &def=Hastati:10 &seed=N &mode=skip|instant|watch|auto|manual &atkhp=1 &defhp=1 &pr=0.1
// R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1 r3: mode=auto (rozgrywka w czasie rzeczywistym, bez Pomin), mode=manual (scena czeka na UI;
// driver Playwright klika), telemetria: ruch uciekinierow per tura, pogon wg typu, ciosy na jednostke na ture, aktywacje z niewykorzystanym ruchem,
// migawki pozycji na poczatku kazdej rundy (rozrzut frontu).
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
  label: 'rout-pursuit', teren: q.get('teren') ?? 'Rownina',
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
const origRender = scene.renderer.render.bind(scene.renderer);
if (q.get('norender') === '1') scene.renderer.render = () => {}; // przyspieszenie pomiaru (bez rysowania klatek)

const api: any = { ready: true, done: false, result: null as any, attacksOnRouted: 0 };
(window as any).__e2e = api;
(window as any).__scene = scene;

api.setRender = (on: boolean) => { scene.renderer.render = on ? origRender : () => {}; }; // zrzuty ekranu: rysowanie wlaczane tylko na chwile
api.pursuit = [] as any[];            // ciosy w uciekiniera: {round, atk(typ), mounted, ranged}
api.hitCount = {} as Record<string, number>; // `${round}|${id}` -> liczba ciosow (wrecz + dystans)
api.fleeSteps = [] as any[];          // kazdy krok uciekiniera: {round,id,side,from,to}
api.activations = [] as any[];        // aktywacje zywych, nie-uciekajacych jednostek (prawdziwych, nie klonow planowania)
api.snapshots = [] as any[];          // migawki pozycji na poczatku rundy
api.unitInfo = {} as Record<string, any>;
const kindOf = (ru: any): string =>
  /Oblezn|Oblężn/.test(String(ru.bu?.stats?.['Rola (linia)'] ?? '')) ? 'siege'
  : ru.mounted ? 'mounted' : (ru.rangedBase || ru.primaryRanged) ? 'ranged' : 'infantry';
const isReal = (ru: any): boolean => !!ru && ru.mats && ru.mats.length > 0;
for (const ru of [...scene.atk, ...scene.def]) {
  api.unitInfo[String(ru.bu.id)] = {
    side: ru.side, type: String(ru.bu.stats?.['Jednostka'] ?? ru.bu.nazwa), kind: kindOf(ru), neverRout: !!ru.neverRout,
    q0: ru.q, r0: ru.r, move: scene._movementPointsFor(ru.bu), fleeMove: scene._fleeMovePointsFor(ru.bu),
  };
}
function snapshot(): void {
  const units: any[] = [];
  const prevSnap = api.snapshots.length ? api.snapshots[api.snapshots.length - 1] : null;
  const prevPos = new Map<string, [number, number]>();
  if (prevSnap) for (const u of prevSnap.units) prevPos.set(u[0], [u[1], u[2]]);
  const prevRound = prevSnap ? prevSnap.round : -1;
  for (const side of ['atk', 'def'] as const) {
    const enemies = (side === 'atk' ? scene.def : scene.atk).filter((e: any) => !e.dead && !e.removed && !e.fadingOut && !e.routed);
    for (const ru of (side === 'atk' ? scene.atk : scene.def)) {
      if (ru.dead || ru.removed || ru.fadingOut) continue;
      const id = String(ru.bu.id);
      const info = api.unitInfo[id];
      let unused = 0; let adjNow = 0; let disp = -1; let avail = -1;
      if (!ru.routed && prevSnap && enemies.length) {
        const pp = prevPos.get(id);
        disp = pp ? Math.abs(pp[0] - ru.q) + Math.abs(pp[1] - ru.r) : -1;
        let cap = Infinity; try { const c = scene._paceCapFor(ru); if (Number.isFinite(c)) cap = c; } catch { /* brak sufitu */ }
        avail = Math.min(info?.move ?? 0, cap);
        adjNow = enemies.some((e: any) => Math.abs(e.q - ru.q) + Math.abs(e.r - ru.r) === 1) ? 1 : 0;
        const hits = api.hitCount[`${prevRound}|${id}`] ?? 0;
        const d = (a: number, b: number) => Math.min(...enemies.map((e: any) => Math.abs(e.q - a) + Math.abs(e.r - b)));
        const here = d(ru.q, ru.r);
        let freeStep = false;
        for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nq = ru.q + dq, nr = ru.r + dr;
          if (nq < 0 || nr < 0 || scene.occByKey.has(`${nq},${nr}`)) continue;
          if (!scene._passableForUnit(ru, nq, nr)) continue;
          if (d(nq, nr) < here) { freeStep = true; break; }
        }
        const shooter = !!(ru.rangedBase || ru.primaryRanged) || info?.kind === 'siege';
        const holdsInRange = shooter && here <= Number(ru.range || 0); // strzelec/machina w zasiegu trzyma pozycje (nie jest to niewykorzystany ruch)
        unused = (disp >= 0 && disp < avail && hits === 0 && !adjNow && freeStep && !holdsInRange) ? 1 : 0;
      }
      units.push([id, ru.q, ru.r, ru.routed ? 1 : 0, unused, adjNow, disp, avail]);
    }
  }
  api.snapshots.push({ round: scene.roundNo, units });
}
{
  const origMove = scene._doMove.bind(scene);
  scene._doMove = (ru: any, q: number, r: number, done: any) => {
    if (ru.routed && isReal(ru) && !scene._autoBatchPlanning) {
      api.fleeSteps.push({ round: scene.roundNo, id: String(ru.bu.id), side: ru.side, from: [ru.q, ru.r], to: [q, r] });
    }
    return origMove(ru, q, r, done);
  };
  const origAct = scene._activateUnit.bind(scene);
  scene._activateUnit = (ru: any, done: any) => {
    if (!isReal(ru) || ru.routed || ru.dead || ru.fadingOut || scene._autoBatchPlanning) return origAct(ru, done);
    const enemies = (ru.side === 'atk' ? scene.def : scene.atk).filter((e: any) => !e.dead && !e.removed && !e.fadingOut);
    const adj = (u: any) => enemies.some((e: any) => !e.routed && Math.abs(e.q - u.q) + Math.abs(e.r - u.r) === 1);
    const rec: any = { round: scene.roundNo, id: String(ru.bu.id), side: ru.side, kind: kindOf(ru), from: [ru.q, ru.r], moveLeftStart: ru.moveLeft, adjBefore: adj(ru), hits: 0 };
    const hitsBefore = (key: string) => api.hitCount[key] ?? 0;
    const key = `${scene.roundNo}|${ru.bu.id}`;
    const h0 = hitsBefore(key);
    return origAct(ru, () => {
      rec.to = [ru.q, ru.r]; rec.moveLeftEnd = ru.moveLeft; rec.hits = hitsBefore(key) - h0; rec.adjAfter = adj(ru);
      rec.dead = !!(ru.dead || ru.removed);
      // niewykorzystany ruch przy wolnej drodze: koniec aktywacji z zapasem ruchu, bez ciosu, bez wroga w zasiegu wzwarcia,
      // a istnieje wolny, przechodni sasiedni heks BLIZEJ najblizszego zywego wroga
      let freePath = false;
      if (!rec.dead && rec.moveLeftEnd > 0 && rec.hits === 0 && !rec.adjAfter && enemies.some((e: any) => !e.routed)) {
        const live = enemies.filter((e: any) => !e.routed);
        const d = (a: number, b: number) => Math.min(...live.map((e: any) => Math.abs(e.q - a) + Math.abs(e.r - b)));
        const here = d(ru.q, ru.r);
        for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nq = ru.q + dq, nr = ru.r + dr;
          if (nq < 0 || nr < 0 || scene.occByKey.has(`${nq},${nr}`)) continue;
          if (!scene._passableForUnit(ru, nq, nr)) continue;
          if (d(nq, nr) < here) { freePath = true; break; }
        }
      }
      rec.unusedFreePath = freePath;
      api.activations.push(rec);
      done();
    });
  };
  let lastRound = -1;
  const origTick = () => { if (scene.roundNo !== lastRound) { lastRound = scene.roundNo; snapshot(); } };
  (api as any).tickSnap = origTick;
}
for (const fn of ['_doMeleeAttack', '_doRangedAttack']) {
  const orig = scene[fn].bind(scene);
  scene[fn] = (attacker: any, defender: any, done: any) => {
    if (defender.routed) {
      api.attacksOnRouted++;
      api.pursuit.push({ round: scene.roundNo, atk: String(attacker.bu.stats?.['Jednostka'] ?? attacker.bu.nazwa), mounted: !!attacker.mounted, ranged: fn === '_doRangedAttack', side: attacker.side });
    }
    if (!scene._autoBatchPlanning && isReal(attacker)) {
      const k = `${scene.roundNo}|${attacker.bu.id}`; api.hitCount[k] = (api.hitCount[k] ?? 0) + 1;
    }
    return orig(attacker, defender, done);
  };
}

api.killedWhileRouted = 0; api.collapseRound = -1; api.fledAtEdge = 0; api.fledNotAtEdge = 0; api.events = { rout: [] as any[], flee: [] as any[] };
{
  const origFade = scene._startFade.bind(scene);
  scene._startFade = (ru: any) => { if (ru.routed && !ru.removed) api.killedWhileRouted++; return origFade(ru); };
  const origRout = scene._startRout.bind(scene);
  scene._startRout = (ru: any) => {
    // R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1 (N3): zdarzenie rozbicia z numerem rundy i flaga neverRout
    if (!ru.routed && !ru.dead && !ru.fadingOut) {
      api.events.rout.push({ round: scene.roundNo, side: ru.side, id: String(ru.bu.id), neverRout: !!ru.neverRout });
    }
    const r = origRout(ru);
    const roster = ru.side === 'atk' ? scene.atk : scene.def;
    if (api.collapseRound < 0 && roster.every((u: any) => u.dead || u.removed || u.routed)) api.collapseRound = scene.roundNo;
    return r;
  };
  if (typeof scene._resolveRemainingRouted === 'function') {
    const origEnd = scene._resolveRemainingRouted.bind(scene);
    scene._resolveRemainingRouted = () => { api.inEndResolve = true; try { return origEnd(); } finally { api.inEndResolve = false; } };
  }
  const origRemove = scene._removeUnitFromScene.bind(scene);
  scene._removeUnitFromScene = (ru: any) => {
    // klony planowania AUTO-batch nie maja wlasnych materialow (mats=[]) -- pomijamy je
    if (!ru.removed && ru.routed && ru.bu.hp > 0 && ru.mats.length > 0) {
      api.events.flee.push({ round: scene.roundNo, side: ru.side, id: String(ru.bu.id) });
      const edge = scene._fleeHomeCol ? scene._fleeHomeCol(ru) : -1;
      if (ru.q === edge) api.fledAtEdge++;
      else if (api.inEndResolve) api.fledAtEndResolve = (api.fledAtEndResolve ?? 0) + 1; // regula konca bitwy: _resolveRemainingRouted (poza zasiegiem = uciekl)
      else { api.fledNotAtEdge++; (api.notEdge ||= []).push([ru.side, ru.q, ru.r, ru.fleeStuck]); }
    }
    return origRemove(ru);
  };
}

function fate(ru: any): string {
  if (ru.bu.hp <= 0) return 'killed';
  if (ru.routed && ru.removed) return 'fled';
  if (ru.routed) return 'routedLeft';
  return 'survived';
}
const hpStart: any = { atk: 0, def: 0 };
for (const [k, side] of [['atk', armies.attacker], ['def', armies.defender]] as const) hpStart[k] = (side as any[]).reduce((s, bu) => s + bu.hp, 0);
function tally(roster: any[], key: string) {
  const t: any = { total: roster.length, killed: 0, fled: 0, routedLeft: 0, survived: 0 };
  for (const ru of roster) t[fate(ru)]++;
  // DODATEK 4: straty HP strony (zabici = 0 HP); hpLostPct wzgledem HP startowego
  t.hpStart = hpStart[key]; t.hpEnd = roster.reduce((s, ru) => s + Math.max(0, ru.bu.hp), 0);
  t.hpLostPct = Math.round(100 * (1 - t.hpEnd / t.hpStart));
  return t;
}
function finish(): void {
  api.result = {
    winner: scene._endWinner, round: scene.roundNo,
    atk: tally(scene.atk, 'atk'), def: tally(scene.def, 'def'),
    exported: (scene._endSurvivors ?? []).length,
    exportedAtk: (scene._endSurvivors ?? []).filter((s: any) => String(s.id).startsWith('atk')).length,
    exportedDef: (scene._endSurvivors ?? []).filter((s: any) => String(s.id).startsWith('def')).length,
    exportedHpAtk: (scene._endSurvivors ?? []).filter((s: any) => String(s.id).startsWith('atk')).reduce((a: number, s: any) => a + Math.max(0, s.hp ?? 0), 0),
    exportedHpDef: (scene._endSurvivors ?? []).filter((s: any) => String(s.id).startsWith('def')).reduce((a: number, s: any) => a + Math.max(0, s.hp ?? 0), 0),
    hpStartAtk: hpStart.atk, hpStartDef: hpStart.def,
    attacksOnRouted: api.attacksOnRouted, killedWhileRouted: api.killedWhileRouted, collapseRound: api.collapseRound,
    fledAtEdge: api.fledAtEdge, fledAtEndResolve: api.fledAtEndResolve ?? 0, fledNotAtEdge: api.fledNotAtEdge, notEdge: (api.notEdge ?? []).slice(0, 8),
    log: (scene.log as string[]).filter(l => /Koniec|zalamane|PAT/.test(l)).slice(-4),
    events: api.events,
    pursuit: api.pursuit, fleeSteps: api.fleeSteps, activations: api.activations, snapshots: api.snapshots, unitInfo: api.unitInfo,
    hitCount: api.hitCount, mode,
    finalFate: Object.fromEntries([...scene.atk, ...scene.def].map((ru: any) => [String(ru.bu.id), fate(ru)])),
  };
  api.done = true;
}
function loop(): void {
  api.tickSnap();
  if (scene.finished) { snapshot(); finish(); return; }
  requestAnimationFrame(loop);
}
scene.play(() => {});
scene._setSpeedIdx(9, { clamp: true });
if (mode === 'instant') scene._skipInstantFallback();
else if (mode === 'watch') { if (scene.deployPhase) scene._endDeployPhase(); scene._ffEnterAuto(); }
else if (mode === 'auto') {
  // AUTO w czasie rzeczywistym (jak w grze: Start walki + wylaczony tryb reczny), bez przycisku Pomin
  if (scene.deployPhase) scene._endDeployPhase();
  if (scene._manualMode) scene._toggleManualMode();
} else if (mode === 'manual') {
  // tryb reczny: scena czeka w fazie rozstawienia; driver Playwright klika UI (Start, R, roster, klik w wroga, Spacja)
  scene._manualCommanderGate = false; // brak generala w zestawie testowym (jak w istniejacych testach recznych)
  (window as any).__scene = scene;
} else scene.skip();
requestAnimationFrame(loop);
