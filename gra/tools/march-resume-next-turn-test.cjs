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

fs.writeFileSync(
  ENTRY,
  `export { executeMarchStep, isNotifiableMarchStop } from '../src/game/planned-march';\n`,
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});
const { executeMarchStep, isNotifiableMarchStop } = require(BUNDLE);
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

// T3: zasadna przeszkoda (obcy na trasie) -> marsz zatrzymuje sie z powodem (nie cichy restart).
{
  const r = simulate({ map: flatMap(0, 12), ruch: 2, dest: { destQ: 8, destR: 0 }, occupied: new Set(['4,0']) });
  const last = r.turns[r.turns.length - 1];
  // Obcego omija trasa (dojscie objazdem) albo marsz zatrzymuje sie z powodem; nie moze stanac bez wyjasnienia.
  const notifiable = typeof last.stop === 'string' && isNotifiableMarchStop(last.stop);
  ok(last && (last.arrived === true || notifiable),
    'T3 przeszkoda: dojscie lub zasadne zatrzymanie (obstacle/no_path/blocked_city): ' + JSON.stringify(r.turns));
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

// T5: przeszkoda znika po kilku turach -> plan przetrwal, marsz dochodzi bez klikania.
{
  const map = flatMap(0, 12);
  const u = { id: 'u1', ownerId: 0, q: 0, r: 0, ruch: 2, ruchLeft: 2, typeId: 'zwiadowca', category: 'zwiadowca' };
  const dest = { destQ: 8, destR: 0 };
  const blocked = new Set(['1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0', '1,-1', '2,-1', '3,-1', '4,-1', '5,-1', '6,-1', '7,-1']);
  let arrived = false;
  let turnsRun = 0;
  for (let t = 1; t <= 10 && !arrived; t++) {
    turnsRun = t;
    const occ = t <= 2 ? blocked : new Set();
    const step = executeMarchStep(u, dest, map, occ, u.ruchLeft, () => true, 2);
    if (step.ok && step.movePath.length > 0) {
      const last = step.movePath[step.movePath.length - 1];
      u.q = last.q; u.r = last.r; u.ruchLeft -= step.cost;
      if (step.arrived) arrived = true;
    }
    u.ruchLeft = 2;
  }
  ok(arrived, 'T5 po zdjeciu przeszkody marsz dochodzi bez klikania (tury=' + turnsRun + ')');
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
  ok(noteBody.length > 0 && /isNotifiableMarchStop\(/.test(noteBody), 'G4 noteMarchStop filtruje przez isNotifiableMarchStop');
  ok(/noteMarchStop\(unitId, result\.stopReason/.test(seg), 'G5 pusty krok koniec tury zglasza przerwanie (nie cicho)');
  const clr = fnBody('function clearPlannedMarch(');
  ok(/marchStopNotified\.delete\(unitId\)/.test(clr) && /marchStopNotified\.clear\(\)/.test(clr), 'G6 clearPlannedMarch czysci stan powiadomien');
}

console.log('march-resume-next-turn-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
