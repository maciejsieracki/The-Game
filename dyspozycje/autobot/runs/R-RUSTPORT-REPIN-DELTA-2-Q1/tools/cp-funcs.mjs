// Function-level drift of gra/src/ui/cityPanel.ts: pin edb8fb56 vs origin/main (dc8a3adc).
import fs from 'node:fs';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const CP = 'gra/src/ui/cityPanel.ts';
const read = d => fs.readFileSync(`${S}/${d}/${CP}`, 'utf8').split(/\r?\n/).map(l => l.replace(/\s+$/, ''));
const pin = read('pin-edb'), head = read('webarch');
function funcs(lines) {
  const out = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = /^(export\s+)?function\s+(\w+)\s*\(/.exec(lines[i]);
    if (!m) continue;
    let b = i;
    while (b < lines.length && lines[b] !== '}') b++;
    out.set(m[2], { a: i + 1, b: b + 1, body: lines.slice(i, b + 1).join('\n') });
  }
  return out;
}
const P = funcs(pin), H = funcs(head);
let same = 0;
const drift = [], gone = [], added = [];
for (const [n, p] of P) {
  const h = H.get(n);
  if (!h) { gone.push(`${n} pin=${p.a}-${p.b}`); continue; }
  if (h.body === p.body) same++;
  else drift.push(`${n} pin=${p.a}-${p.b}(${p.b - p.a + 1}l) head=${h.a}-${h.b}(${h.b - h.a + 1}l)`);
}
for (const n of H.keys()) if (!P.has(n)) added.push(n);
console.log(`funkcje w pinie=${P.size} identyczne=${same} zmienione=${drift.length} usuniete=${gone.length} nowe_w_main=${added.length}`);
console.log('ZMIENIONE:'); for (const d of drift) console.log('  ' + d);
console.log('USUNIETE:'); for (const g of gone) console.log('  ' + g);
console.log('NOWE_W_MAIN:'); console.log('  ' + added.join(', '));
