// Kopie frontend-v2 (pin-manifest.json, sha256 wzgledem edb8fb56) vs zrodlo gra/... w 4bbef081d i dc8a3adc.
import fs from 'node:fs';
import crypto from 'node:crypto';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const man = JSON.parse(fs.readFileSync(`${S}/parity/src-tauri/frontend-v2/tools/pin-manifest.json`, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const stats = { wpisow: man.files.length, pin_rozne: {}, zrodla_poza_archiwum: 0 };
const res = { main: { same: 0, diff: [], missing: 0 }, dc8: { same: 0, diff: [], missing: 0 } };
for (const e of man.files) {
  const src = e.pin.split(':')[1]; // gra/...
  const rel = src.replace(/^gra\//, '');
  if (!/^(src|data)\//.test(rel)) { stats.zrodla_poza_archiwum++; continue; }
  for (const [k, dir] of [['main', 'pin-main'], ['dc8', 'pin-dc8']]) {
    const p = `${S}/${dir}/gra/${rel}`;
    if (!fs.existsSync(p)) { res[k].missing++; continue; }
    const h = sha(p);
    if (h === e.sha256) res[k].same++; else res[k].diff.push(`${e.path}`);
  }
}
console.log(JSON.stringify({ wpisow: stats.wpisow, zrodla_poza_src_data: stats.zrodla_poza_archiwum,
  vs_4bbef081d: { identyczne: res.main.same, rozjechane: res.main.diff.length, brak: res.main.missing, lista: res.main.diff },
  vs_dc8a3adc: { identyczne: res.dc8.same, rozjechane: res.dc8.diff.length, brak: res.dc8.missing, lista: res.dc8.diff } }, null, 1));
