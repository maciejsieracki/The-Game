'use strict';
// Podsumowanie evidence/abc-<wariant>.json: per tura — decyzje miasta site wg etapu x powod + zmiany warstw heksow.
const fs = require('fs'); const path = require('path');
const EVID = path.join(__dirname, '..', '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-AUTOIMPROVE-LIVE-SCENARIOS-Q1', 'evidence');
const v = process.argv[2]; const d = JSON.parse(fs.readFileSync(path.join(EVID, `abc-${v}.json`), 'utf8'));
const site = d.site; const cityIdOf = (st) => { const c = st.cities.find((x) => x.ownerId === 0 && x.q === site[0] && x.r === site[1]); return c ? c.id : null; };
console.log(`# wariant=${v} wolnoWycinacLas=${d.wolnoWycinacLas} seed=${d.seed} site=${site} foundOk=${d.setup && d.setup.foundOk}`);
const keyOf = (h) => h[0] + ',' + h[1];
let prev = new Map((d.setup.hexes0 || []).map((h) => [keyOf(h), h]));
const forestOffRiver0 = (d.setup.hexes0 || []).filter((h) => h[3] === 'las' && !h[4]).map(keyOf);
console.log('las POZA rzeka (start):', forestOffRiver0.join(' ') || '-', '| las przy rzece:', (d.setup.hexes0 || []).filter((h) => h[3] === 'las' && h[4]).length);
for (const t of d.turns) {
  const cid = cityIdOf(t.state);
  console.log(`\n## po tury ${t.state.turn - 1}->${t.state.turn} (subiektem decyzji sa miasta gracza: city0=stolica, ${cid}=nowe)`);
  const inSite = new Set(t.hexes.map(keyOf));
  const seq = [];
  const agg = new Map();
  for (const x of t.decisions) {
    if (x.scope === "las" && !inSite.has(x.hex)) continue; if (x.scope !== "las") continue;
    const et = (x.detail && x.detail.etap) || '?';
    if (!agg.has(et)) { agg.set(et, new Map()); seq.push(et); }
    if (x.scope === 'las') {
      const k = `${x.verdict}: ${x.reason} [naRzece=${x.detail && x.detail.naRzece}]`;
      const m = agg.get(et); m.set(k, (m.get(k) || 0) + 1);
    }
  }
  let i = 1; for (const et of seq) { console.log(` etap#${i++} ${et}`); for (const [k, n] of agg.get(et)) console.log(`    ${n} x ${k}`); }
  const chosen = t.decisions.filter((x) => x.verdict === 'wybrany' && inSite.has(x.hex)).map((x) => `${x.cityId}:${x.hex} ${x.reason}`);
  console.log(' wybrane (las):', chosen.join(' | ') || '-');
  const bramki = t.decisions.filter((x) => x.cityId === cid && x.reason === 'bramki wycinki').slice(0, 1).map((x) => JSON.stringify(x.detail));
  console.log(' bramki(1.):', bramki.join(''));
  const cur = new Map(t.hexes.map((h) => [keyOf(h), h]));
  const diffs = [];
  for (const [k, h] of cur) { const p = prev.get(k); if (!p || p[3] !== h[3] || p[5] !== h[5] || p[6] !== h[6]) diffs.push(`${k}[${h[2]},${h[4] ? 'rz' : 'bez-rz'}] ${p ? p[3] + '/' + (p[5] || '-') : '?'} -> ${h[3]}/${h[5] || '-'}${h[6] ? ' (clearing)' : ''}`); }
  console.log(' zmiany heksow:', diffs.length ? '\n    ' + diffs.join('\n    ') : '-');
  prev = cur;
}

// --- Podsumowania ---
{
  const last = d.turns[d.turns.length - 1];
  const cnt = {};
  for (const h of last.hexes) for (const l of (h[5] ? h[5].split('+') : [])) { cnt[l] = cnt[l] || { rz: 0, bezRz: 0 }; cnt[l][h[4] ? 'rz' : 'bezRz']++; }
  console.log('\n## Stan koncowy (r=3 wokol miasta): warstwy na heksach rzeka(rz)/poza-rzeka(bezRz):', JSON.stringify(cnt));
  const forestLeft = last.hexes.filter((h) => h[3] === 'las').map((h) => `${keyOf(h)}${h[4] ? '(rz)' : '(bez-rz)'}[${h[5] || '-'}]`);
  console.log('las pozostaly:', forestLeft.length, forestLeft.join(' ') || '-');
  // zgodnosc hooka naRzece z pickerem (detail.naRzece w logu decyzji dla heksow lasu r=3)
  let cmp = 0, mism = 0; const bad = [];
  for (const t of d.turns) {
    const hx = new Map(t.hexes.map((h) => [keyOf(h), h[4] === 1]));
    for (const x of t.decisions) {
      if (x.scope !== 'las' || !x.detail || typeof x.detail.naRzece !== 'boolean') continue;
      if (!hx.has(x.hex)) continue;
      cmp++; if (hx.get(x.hex) !== x.detail.naRzece) { mism++; if (bad.length < 5) bad.push(x.hex); }
    }
  }
  console.log(`zgodnosc hook.naRzece vs picker detail.naRzece: porownan=${cmp} niezgodnych=${mism} ${bad.join(' ')}`);
}
