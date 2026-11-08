// Generator wektorow ERADELAY/ERAIGN: wola PRAWDZIWE funkcje weba (origin/main, patch tylko importu JSON).
import fs from 'node:fs';
import {
  evaluateInterCivWarGate,
  isEraForcedWarIgnoringR1,
  isWarTreatyBlocked,
  WAR_RULES_PARAMS,
} from './web-src/gra/src/game/war-rules-multiwar.ts';

type Tag = 'bronze' | 'stone' | 'iron' | null | undefined;
const out: Array<{ fn: string; in: Record<string, unknown>; out: string }> = [];

const turns = [0, 19, 20, 39, 40, 41, NaN, 'undefined'] as const;
const tags: Tag[] = ['bronze', 'iron', 'stone', null, undefined];
const tagJson = (t: Tag) => (t === undefined ? 'undefined' : t === null ? null : t);

for (const turn of turns) {
  for (const tag of tags) {
    for (const attackerWarCount of [0, 1]) {
      for (const targetIsPlayer of [false, true]) {
        const inp = {
          turn: turn === 'undefined' ? (undefined as unknown as number) : turn,
          attackerEra: 1,
          attackerWarCount,
          targetIsPlayer,
          targetEra: 2,
          targetWarCount: 0,
          eraTag: tag,
        };
        const res = evaluateInterCivWarGate(inp as Parameters<typeof evaluateInterCivWarGate>[0]);
        out.push({
          fn: 'evaluateInterCivWarGate',
          in: {
            turn: String(turn),
            attackerEra: '1',
            attackerWarCount: String(attackerWarCount),
            targetIsPlayer,
            targetEra: '2',
            targetWarCount: '0',
            eraTag: tagJson(tag),
          },
          out: res,
        });
      }
    }
  }
}

for (const tag of tags) {
  out.push({
    fn: 'isEraForcedWarIgnoringR1',
    in: { eraTag: tagJson(tag) },
    out: String(isEraForcedWarIgnoringR1(tag as 'bronze' | 'stone' | 'iron' | null | undefined)),
  });
}

for (const eraWar of [false, true])
  for (const hasNap of [false, true])
    for (const peaceLocked of [false, true])
      for (const hasAlliance of [false, true])
        out.push({
          fn: 'isWarTreatyBlocked',
          in: { eraWar, hasNap, peaceLocked, hasAlliance },
          out: String(isWarTreatyBlocked({ eraWar, hasNap, peaceLocked, hasAlliance })),
        });

out.push({
  fn: 'eraForcedWarStartTurnsFromEra',
  in: { tag: 'bronze' },
  out: String(WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.bronze),
});
out.push({
  fn: 'eraForcedWarStartTurnsFromEra',
  in: { tag: 'iron' },
  out: String(WAR_RULES_PARAMS.eraForcedWarStartTurnsFromEra.iron),
});

const dest = '/home/user/The-Game/.claude/worktrees/wf_f19bc1bd-48c-1/rust-port/engine/tests/p6_dyplo_multiwar_gates_data/eraign.json';
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
console.log('wrote', out.length, 'vectors');
