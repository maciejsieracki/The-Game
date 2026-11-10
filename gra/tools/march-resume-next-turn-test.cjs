'use strict';
/**
 * march-resume-next-turn-test.cjs — R-WEB-MARCH-RESUME-NEXT-TURN-Q1.
 * Trasa zaplanowanego marszu (>= 3 tury) MA dojsc do celu bez ponownego klikania:
 * kazda tura gracza konczy sie segmentem (MP resetuja sie w runWorldEndTurn), a plan
 * przetrwa, dopoki jednostka nie dotrze do celu albo nie napotka zasadnej przeszkody.
 * Test: warstwa czysta (planned-march.ts) symuluje kolejne tury; bramki zrodla main.ts
 * pilnuja, ze EOT nie kasuje planu bez powodu.
 * Uruchomienie (z gra/): node tools/march-resume-next-turn-test.cjs   (kod != 0 = RED)
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.march-resume-entry.ts');
const BUNDLE = path.join(__dirname, '.march-resume-bundle.cjs');

(async () => {
fs.writeFileSync(
  ENTRY,
  `export { executeMarchStep, isNotifiableMarchStop, marchPausedLabel, registerMarchStop, clearMarchStop, plannedMarchesToSave, plannedMarchesFromSave } from '../src/game/planned-march';\n`
  + `export { buildUnitExtraStatusLinesHtml } from '../src/ui/unitCardStatus';\n`,
  'utf8',
);
await esbuild.build({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
  // brandAssets uzywa import ?raw / import.meta.glob (Vite) -- w ttescie node stubujemy ikony.
  plugins: [{
    name: 'stub-brand-assets',
    setup(b) {
      b.onResolve({ filter: /brandAssets$/ }, () => ({ path: 'brandAssets-stub', namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const brandIconSvg = () => "";', loader: 'js' }));
    },
  }],
});
const {
  executeMarchStep, isNotifiableMarchStop, marchPausedLabel, registerMarchStop, clearMarchStop,
  plannedMarchesToSave, plannedMarchesFromSave, buildUnitExtraStatusLinesHtml,
} = require(BUNDLE);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* sprzatanie best-effort */ }

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

function flatMap(q0, q1) {
  const hexes = {};
  for (let q = 0; q <= q1; q++) for (let r = -6; r <= 6; r++) hexes[q + ',' + r] = { terenBazowy: 'Rownina' };
  return { hexes };
}

/** Symulacja wielu tur: kazda tura = segment z dostepnym MP, potem reset MP (koniec tury). */
function simulate({ map, ruch, dest, occupied, maxTurns = 8, startQ = 0, startR = 0 }) {
  const u = { id: 'u1', ownerId: 0, q: startQ, r: startR, ruch, ruchLeft: ruch, typeId: 'zwiadowca', category: 'zwiadowca' };
  const turns = [];
  for (let t = 1; t <= maxTurns; t++) {
    const step = executeMarchStep(u, dest, map, occupied, u.ruchLeft, () => true, ruch);
    if (!step.ok || step.movePath.length === 0) {
      turns.push({ t, stop: step.stopReason || 'none' });
      break;
    }
    const last = step.movePath[step.movePath.length - 1];
    u.q = last.q;
    u.r = last.r;
    u.ruchLeft -= step.cost;
    turns.push({ t, at: last.q + ',' + last.r, arrived: step.arrived === true });
    if (step.arrived) break;
    u.ruchLeft = ruch; // koniec tury gracza + reset MP w runWorldEndTurn
  }
  return { turns, final: { q: u.q, r: u.r } };
}

// T1: trasa 8 heksow, zasieg 2 -> 4 tury, dojscie bez klikania (plan przetrwa miedzy turami).
{
  const r = simulate({ map: flatMap(0, 12), ruch: 2, dest: { destQ: 8, destR: 0 }, occupied: new Set() });
  const last = r.turns[r.turns.length - 1];
  ok(last && last.arrived === true, 'T1 trasa 3+ tur (zasieg 2) dociera do celu: ' + JSON.stringify(r.turns));
  ok(r.turns.length >= 3, 'T1 trasa wymaga >= 3 tur (test ma sens): ' + r.turns.length);
}

// T2: zasieg 3 -> cel osiagniety w kolejnych turach bez przerwy.
{
  const r = simulate({ map: flatMap(0, 12), ruch: 3, dest: { destQ: 8, destR: 0 }, occupied: new Set() });
  const last = r.turns[r.turns.length - 1];
  ok(last && last.arrived === true, 'T2 zasieg 3 dociera do celu: ' + JSON.stringify(r.turns));
}

// T3: zasadna przeszkoda (mur obcych na calej szerokosci mapy) -> marsz MUSI sie zatrzymac z powodem
// no_path (test potrafi wykazac blad: gdyby marsz "przeszedl" przez mur, asercja czerwona).
function wall(q) {
  const w = new Set();
  for (let r = -6; r <= 6; r++) w.add(q + ',' + r);
  return w;
}
{
  const r = simulate({ map: flatMap(0, 12), ruch: 2, dest: { destQ: 8, destR: 0 }, occupied: wall(3) });
  const last = r.turns[r.turns.length - 1];
  ok(last && last.stop === 'no_path', 'T3 mur obcych -> zatrzymanie z powodem no_path: ' + JSON.stringify(r.turns));
  ok(!r.turns.some(t => t.arrived === true), 'T3 jednostka NIE dotarla do celu przez mur: ' + JSON.stringify(r.turns));
  ok(r.final.q < 3, 'T3 jednostka stoi przed murem (q=' + r.final.q + ')');
  ok(isNotifiableMarchStop(last.stop), 'T3 powod zatrzymania jest powiadamiany');
}

// T4: klasyfikacja przerwan -- powiadamiane sa tylko zasadne przeszkody; rutynowe pauzy nie.
{
  ok(isNotifiableMarchStop('obstacle') === true, 'T4 obstacle powiadamiane');
  ok(isNotifiableMarchStop('no_path') === true, 'T4 no_path powiadamiane');
  ok(isNotifiableMarchStop('blocked_city') === true, 'T4 blocked_city powiadamiane');
  ok(isNotifiableMarchStop('no_movement') === false, 'T4 no_movement (koniec MP) NIE powiadamiane');
  ok(isNotifiableMarchStop('fog') === false, 'T4 fog NIE powiadamiane (zwykla pauza)');
  ok(isNotifiableMarchStop(undefined) === false, 'T4 brak powodu NIE powiadamiane');
}

// T5: przeszkoda FAKTYCZNIE zatrzymuje marsz w turach 1-2, po zdjeciu plan wznawia i dochodzi.
{
  const map = flatMap(0, 12);
  const u = { id: 'u1', ownerId: 0, q: 0, r: 0, ruch: 2, ruchLeft: 2, typeId: 'zwiadowca', category: 'zwiadowca' };
  const dest = { destQ: 8, destR: 0 };
  const planned = new Map([[u.id, dest]]);
  const notified = new Map();
  let notices = 0;
  const blockedTurns = [];
  let arrived = false;
  let turnsRun = 0;
  for (let t = 1; t <= 12 && !arrived; t++) {
    turnsRun = t;
    const occ = t >= 2 && t <= 4 ? wall(3) : new Set();
    // tura 1: jednostka idzie (q 0 -> 2); tury 2-4: mur na q=3 (stoi); tura 5+: mur zdjety
    const step = executeMarchStep(u, planned.get(u.id), map, occ, u.ruchLeft, () => true, 2);
    if (step.ok && step.movePath.length > 0) {
      const last = step.movePath[step.movePath.length - 1];
      u.q = last.q; u.r = last.r; u.ruchLeft -= step.cost;
      clearMarchStop(notified, u.id); // postep = koniec epizodu przerwania
      if (step.arrived) { arrived = true; planned.delete(u.id); }
    } else {
      blockedTurns.push({ t, reason: step.stopReason, q: u.q });
      if (registerMarchStop(notified, u.id, step.stopReason)) notices++;
    }
    u.ruchLeft = 2;
  }
  ok(blockedTurns.length === 3 && blockedTurns.every(b => b.reason === 'no_path'),
    'T5 przeszkoda zatrzymala marsz w turach 2-4 (no_path): ' + JSON.stringify(blockedTurns));
  ok(blockedTurns.every(b => b.q === 2), 'T5 w czasie blokady jednostka stoi w miejscu (q=2)');
  ok(notices === 1, 'T5 3 tury blokady -> JEDNO powiadomienie, nie co ture (got ' + notices + ')');
  ok(arrived, 'T5 po zdjeciu przeszkody marsz wznawia sie sam i dochodzi (tury=' + turnsRun + ')');
  ok(turnsRun > 4, 'T5 dojscie dopiero po zdjeciu przeszkody (tury=' + turnsRun + ')');
  ok(!notified.has(u.id), 'T5 po wznowieniu stan powiadomien wyczyszczony (kolejna przeszkoda znow powiadomi)');
}

// T6: dedup -- jeden epizod = jedno powiadomienie; zmiana powodu / nowy epizod = nowe.
{
  const n = new Map();
  ok(registerMarchStop(n, 'a', 'no_path') === true, 'T6 pierwsze przerwanie powiadamia');
  ok(registerMarchStop(n, 'a', 'no_path') === false, 'T6 powtorzone ten sam powod NIE powiadamia');
  ok(registerMarchStop(n, 'a', 'no_path') === false, 'T6 trzecia tura tez nie');
  ok(registerMarchStop(n, 'a', 'obstacle') === true, 'T6 zmiana powodu powiadamia ponownie');
  ok(registerMarchStop(n, 'b', 'obstacle') === true, 'T6 inna jednostka ma wlasny epizod');
  ok(registerMarchStop(n, 'a', 'no_movement') === false && registerMarchStop(n, 'a', 'fog') === false,
    'T6 rutynowe pauzy (no_movement/fog) nie powiadamiaja i nie psuja dedupu');
  clearMarchStop(n, 'a');
  ok(registerMarchStop(n, 'a', 'obstacle') === true, 'T6 po wznowieniu (clear) nowy epizod powiadamia');
}

// T7: plan trasy przetrwa zapis/wczytanie (≥ 3 tury od celu) i dalej prowadzi do celu.
{
  const units = [{ id: 'u1', ownerId: 0, q: 2, r: 0 }];
  const marches = new Map([['u1', { destQ: 8, destR: 0 }]]);
  const saved = JSON.parse(JSON.stringify(plannedMarchesToSave(marches)));
  const loaded = plannedMarchesFromSave(saved.autoMarch, saved.plannedMarches, units, 0);
  const dest = loaded.get('u1');
  ok(dest && dest.destQ === 8 && dest.destR === 0, 'T7 trasa po zapisie/wczytaniu zachowana: ' + JSON.stringify(saved));
  const r = simulate({ map: flatMap(0, 12), ruch: 2, dest, occupied: new Set(), startQ: 2 });
  ok(r.turns[r.turns.length - 1].arrived === true, 'T7 wczytana trasa dochodzi do celu bez klikania');
}

// T8: wskaznik "trasa wstrzymana" -- etykieta powodu + wiersz statusu w panelu jednostki.
{
  ok(marchPausedLabel('no_path') === 'brak trasy do celu', 'T8 etykieta no_path');
  ok(marchPausedLabel('obstacle', 'zablokowany heks na trasie') === 'zablokowany heks na trasie', 'T8 etykieta ze szczegolem');
  ok(marchPausedLabel('fog') === undefined && marchPausedLabel('no_movement') === undefined, 'T8 rutynowe pauzy bez wskaznika');
  const esc = (x) => String(x);
  const withBadge = buildUnitExtraStatusLinesHtml({ marchPausedReason: 'brak trasy do celu', esc });
  ok(/trasa wstrzymana/.test(withBadge) && /brak trasy do celu/.test(withBadge), 'T8 panel pokazuje "trasa wstrzymana" + powod: ' + withBadge);
  const without = buildUnitExtraStatusLinesHtml({ esc });
  ok(!/trasa wstrzymana/.test(without), 'T8 bez powodu brak wskaznika');
}

// Bramki zrodla: EOT nie kasuje planu, a zatrzymanie nie czysci wpisu (poza przycieciem stosu).
{
  const mainTs = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  const fnBody = (header) => {
    const i = mainTs.indexOf(header);
    if (i < 0) return '';
    const b = mainTs.indexOf('{', mainTs.indexOf(')', i));
    let d = 0;
    for (let k = b; k < mainTs.length; k++) {
      if (mainTs[k] === '{') d++;
      else if (mainTs[k] === '}' && --d === 0) return mainTs.slice(i, k + 1);
    }
    return '';
  };
  const seg = fnBody('function applyMarchSegmentInstant(');
  ok(seg.length > 0, 'G1 applyMarchSegmentInstant istnieje');
  const deletes = (seg.match(/plannedMarches\.delete\(/g) || []).length;
  ok(deletes === 1, 'G2 applyMarchSegmentInstant kasuje plan tylko przy przycieciu stosu (got ' + deletes + ')');
  const run = fnBody('function runPlannedMarchesAtPlayerEndTurn(');
  ok(/movedByPlayerThisTurn\.has\(id\)/.test(run), 'G3 koniec tury pomija jednostki ruszone recznie');
  const noteBody = fnBody('function noteMarchStop(');
  ok(noteBody.length > 0 && /registerMarchStop\(/.test(noteBody), 'G4 noteMarchStop filtruje/dedupuje przez registerMarchStop (isNotifiableMarchStop)');
  ok(/noteMarchStop\(unitId, result\.stopReason/.test(seg), 'G5 pusty krok koniec tury zglasza przerwanie (nie cicho)');
  const clr = fnBody('function clearPlannedMarch(');
  ok(/marchStopNotified\.delete\(unitId\)/.test(clr) && /marchStopNotified\.clear\(\)/.test(clr), 'G6 clearPlannedMarch czysci stan powiadomien');
  ok(/marchStopDetail\.delete\(unitId\)/.test(clr) && /marchStopDetail\.clear\(\)/.test(clr), 'G7 clearPlannedMarch czysci powod wskaznika');
  const plan = fnBody('function planMarchTo(');
  const setIdx = plan.indexOf('plannedMarches.set(u.id, marchDest)');
  const clrIdx = plan.indexOf('marchStopNotified.delete(u.id)');
  ok(setIdx > 0 && clrIdx > setIdx && /marchStopDetail\.delete\(u\.id\)/.test(plan),
    'G12 nowy plan (planMarchTo) zeruje dedup i powod wskaznika (zarzut NOTATKA 1)');
  ok(/registerMarchStop\(marchStopNotified/.test(noteBody), 'G8 noteMarchStop dedupuje przez registerMarchStop');
  const fin = fnBody('function finishMarchSegmentHints(');
  ok(/clearMarchStop\(marchStopNotified, unitId\)/.test(fin), 'G9 ruch/dojscie konczy epizod przerwania (wznowienie)');
  ok(/marchPausedReason: plannedMarches\.has\(active\.id\)/.test(mainTs), 'G10 panel armii dostaje powod wstrzymania trasy');
  const hud = fs.readFileSync(path.join(GRA, 'src', 'ui', 'armyStackHud.ts'), 'utf8');
  ok(/marchPausedReason: st\.marchPausedReason/.test(hud), 'G11 armyStackHud przekazuje powod do panelu statusu');
}

console.log('march-resume-next-turn-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
