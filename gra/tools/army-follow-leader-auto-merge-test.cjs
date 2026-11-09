/** node gra/tools/army-follow-leader-auto-merge-test.cjs — R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1
 *  Decyzja automatycznego scalenia z wodzem (tryb „Idź do wodza”): scalenie bez monitu,
 *  reczne najechanie bez trybu → monit (brak automatu), limit armii → hint zamiast scalenia. */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(__dirname, '.army-follow-auto-merge-entry.ts');
const BUNDLE = path.join(__dirname, '.army-follow-auto-merge-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { followLeaderAutoMergeDecision } from '../src/game/army-follow-auto-merge';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  logLevel: 'silent',
});

const { followLeaderAutoMergeDecision } = require(BUNDLE);

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

const LIMIT = 4;
const wodz = { id: 'w', ownerId: 0, q: 5, r: 5, isGeneral: true };
const follower = { id: 'f', ownerId: 0, q: 3, r: 5, followGeneral: true };
const follower2 = { id: 'f2', ownerId: 0, q: 3, r: 5, followGeneral: true };
const manual = { id: 'm', ownerId: 0, q: 3, r: 5, followGeneral: false };

// 1) tryb ON, dotarcie na heks wodza → scalenie bez monitu
{
  const units = [wodz, { ...follower, q: 5, r: 5 }];
  const d = followLeaderAutoMergeDecision(units, [units[1]], [wodz], 5, 5, LIMIT);
  ok(d === 'merge', 'tryb ON + heks wodza → merge (bez monitu)');
}

// 2) tryb ON, grupa podazajaca (2 jednostki) → merge
{
  const f1 = { ...follower, q: 5, r: 5 };
  const f2 = { ...follower2, q: 5, r: 5 };
  const units = [wodz, f1, f2];
  const d = followLeaderAutoMergeDecision(units, [f1, f2], [wodz], 5, 5, LIMIT);
  ok(d === 'merge', 'dwie jednostki w trybie ON na heksie wodza → merge');
}

// 3) tryb OFF + reczne najechanie na wodza → brak automatu (monit jak dotad)
{
  const m = { ...manual, q: 5, r: 5 };
  const units = [wodz, m];
  const d = followLeaderAutoMergeDecision(units, [m], [wodz], 5, 5, LIMIT);
  ok(d === 'none', 'tryb OFF + reczny ruch → none (monit)');
}

// 4) tryb ON, ale na heksie nie ma wodza (zwykla wlasna jednostka) → brak automatu
{
  const other = { id: 'o', ownerId: 0, q: 5, r: 5 };
  const f = { ...follower, q: 5, r: 5 };
  const units = [other, f];
  const d = followLeaderAutoMergeDecision(units, [f], [other], 5, 5, LIMIT);
  ok(d === 'none', 'tryb ON, brak wodza na heksie → none (monit jak dotad)');
}

// 5) mieszany stos (jedna jednostka bez trybu) → brak automatu
{
  const f = { ...follower, q: 5, r: 5 };
  const m = { ...manual, q: 5, r: 5 };
  const units = [wodz, f, m];
  const d = followLeaderAutoMergeDecision(units, [f, m], [wodz], 5, 5, LIMIT);
  ok(d === 'none', 'mieszany przyjazd (tryb ON + OFF) → none');
}

// 6) limit armii: na heksie wodza 3 jednostki + 2 podazajace, limit 4 → limit-blocked (hint, bez scalania)
{
  const g = { id: 'g', ownerId: 0, q: 5, r: 5 };
  const a = { id: 'a', ownerId: 0, q: 5, r: 5 };
  const f1 = { ...follower, q: 5, r: 5 };
  const f2 = { ...follower2, q: 5, r: 5 };
  const units = [wodz, g, a, f1, f2];
  const d = followLeaderAutoMergeDecision(units, [f1, f2], [wodz, g, a], 5, 5, LIMIT);
  ok(d === 'limit-blocked', 'limit armii przekroczony → limit-blocked (hint zamiast scalenia)');
}

// 7) limit dokladnie osiagniety (3 na heksie + 1 wchodzaca = 4) → merge
{
  const g = { id: 'g', ownerId: 0, q: 5, r: 5 };
  const a = { id: 'a', ownerId: 0, q: 5, r: 5 };
  const f1 = { ...follower, q: 5, r: 5 };
  const units = [wodz, g, a, f1];
  const d = followLeaderAutoMergeDecision(units, [f1], [wodz, g, a], 5, 5, LIMIT);
  ok(d === 'merge', 'limit dokladnie osiagniety → merge');
}

// 8) puste wejscie / brak istniejacych → none
ok(followLeaderAutoMergeDecision([], [], [wodz], 5, 5, LIMIT) === 'none', 'brak wchodzacych → none');
ok(followLeaderAutoMergeDecision([wodz], [follower], [], 5, 5, LIMIT) === 'none', 'brak istniejacych na heksie → none');

// 9) wodz sam nie podaza za soba (isGeneral wchodzacy) → none
{
  const gw = { id: 'gw', ownerId: 0, q: 3, r: 5, isGeneral: true, followGeneral: true };
  const d = followLeaderAutoMergeDecision([wodz, gw], [gw], [wodz], 5, 5, LIMIT);
  ok(d === 'none', 'wchodzacy wodz (isGeneral) nie jest scalany automatycznie');
}

// 10) wiring w main.ts (asercja zrodlowa): decyzja podpieta w promptMergeIfCoLocated PRZED showArmyMergePanel;
//     gałąź merge omija panel (applyMerge(true)), limit-blocked pokazuje hint, ręczny onMerge = applyMerge(false)
{
  const src = fs.readFileSync(path.join(ROOT, 'src', 'main.ts'), 'utf8');
  const fnAt = src.indexOf('function promptMergeIfCoLocated(');
  const panelAt = src.indexOf('showArmyMergePanel({', fnAt);
  const decAt = src.indexOf('const followDecision = followLeaderAutoMergeDecision(', fnAt);
  const mergeAt = src.indexOf("if (followDecision === 'merge') {", fnAt);
  const limitAt = src.indexOf("if (followDecision === 'limit-blocked') {", fnAt);
  const hintAt = src.indexOf('Nie dołączono do armii wodza', fnAt);
  ok(fnAt >= 0 && decAt > fnAt && decAt < panelAt, 'main.ts: decyzja followLeader w promptMergeIfCoLocated przed showArmyMergePanel');
  ok(mergeAt > decAt && mergeAt < panelAt && src.slice(mergeAt, panelAt).includes('applyMerge(true)'),
    'main.ts: galaz merge wywoluje applyMerge(true) i omija panel');
  ok(limitAt > decAt && limitAt < panelAt && hintAt > limitAt && hintAt < panelAt,
    'main.ts: galaz limit-blocked pokazuje hint przed panelem');
  ok(src.indexOf('onMerge: () => applyMerge(false)', fnAt) > panelAt,
    'main.ts: reczny onMerge wspoldzieli applyMerge(false)');
}

console.log('\narmy-follow-leader-auto-merge-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
