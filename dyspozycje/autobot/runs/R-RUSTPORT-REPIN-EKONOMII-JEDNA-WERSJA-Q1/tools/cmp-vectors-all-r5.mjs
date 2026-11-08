import { readFileSync } from 'node:fs';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/';
const T = '/home/user/The-Game/.claude/worktrees/wf_107919b4-5d6-1/rust-port/engine/tests/';
const pairs = [
  ['q2a', T + 'p6_adv_q2a_vectors/q2a.json', S + 'vec-regen-h2/q2a/q2a.json'],
  ['q4', T + 'p6_adv_q4_vectors/q4.json', S + 'vec-regen-h2/q4/q4.json'],
  ['q4b', T + 'p6_adv_q4_vectors/q4b.json', S + 'vec-regen-h2/q4b/q4b.json'],
  ['q4c', T + 'p6_adv_q4_vectors/q4c.json', S + 'vec-regen-h2/q4b/q4c.json'],
  ['q6', T + 'p6_adv_q6_vectors/q6.json', S + 'vec-regen-h2/q6/q6.json'],
  ['empirefood', T + 'p6_empirefood_vectors/empirefood.json', S + 'vec-regen-h2/empirefood/empirefood.json'],
];
for (const [name, fa, fb] of pairs) {
  const a = JSON.parse(readFileSync(fa, 'utf8'));
  const b = JSON.parse(readFileSync(fb, 'utf8'));
  const counts = {};
  let total = 0;
  function walk(x, y, p) {
    if (typeof x !== typeof y || (x === null) !== (y === null)) { const k = p.replace(/\[\d+\]/g, '[]'); counts[k] = (counts[k] || 0) + 1; total++; return; }
    if (x && typeof x === 'object') {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y || {})])) walk(x[k], y?.[k], p + '.' + k);
    } else if (x !== y) { const k = p.replace(/\[\d+\]/g, '[]'); counts[k] = (counts[k] || 0) + 1; total++; }
  }
  walk(a, b, '');
  console.log('==', name, 'pin', a.pin?.slice(0, 9), '->', b.pin?.slice(0, 9), 'diffs', total);
  for (const [k, v] of Object.entries(counts).sort((x, y) => y[1] - x[1]).slice(0, 12)) console.log('  ', v, k);
}
