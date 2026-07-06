/**
 * battle-summary-test.cjs
 */
function pct(hp, maxHp) {
  if (maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
}

const before = [
  { id: '1', typeId: 'Hastati', hp: 40, maxHp: 40 },
  { id: '2', typeId: 'Hastati', hp: 40, maxHp: 40 },
  { id: '3', typeId: 'Lucznik', hp: 30, maxHp: 30 },
];
const lookup = (id) => (id === '3' ? null : id === '2' ? 15 : 40);

let dead = 0;
let lossOk = true;
for (const s of before) {
  const afterRaw = lookup(s.id);
  const deadU = afterRaw === null || afterRaw <= 0;
  const hpAfter = deadU ? 0 : afterRaw;
  const lossPct = deadU ? 100 : pct(s.hp - hpAfter, s.maxHp);
  if (s.id === '3' && (!deadU || lossPct !== 100)) lossOk = false;
  if (s.id === '2' && lossPct !== 63) lossOk = false;
  if (deadU) dead++;
}
if (dead !== 1 || !lossOk) throw new Error('per-unit loss sanity failed');
console.log('battle-summary-test: OK');
