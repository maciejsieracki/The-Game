// For each frontend-v2 byte copy (manifest pin edb8fb56), compare the sha of the web source at origin/main.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const S = '/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad';
const man = JSON.parse(fs.readFileSync(`${S}/v2/src-tauri/frontend-v2/tools/pin-manifest.json`, 'utf8'));
const stage2 = new Set(fs.readFileSync(`${S}/stage2-set.txt`, 'utf8').split('\n').filter(Boolean));
const sha = b => createHash('sha256').update(b).digest('hex');
let same = 0, drift = [], missing = [];
for (const f of man.files) {
  const src = f.pin.split(':')[1]; // gra/...
  const p = path.join(`${S}/webarch`, src);
  if (!fs.existsSync(p)) { missing.push(`${f.path} <- ${src}`); continue; }
  const h = sha(fs.readFileSync(p));
  if (h === f.sha256) same++;
  else drift.push(`${f.path} <- ${src}${stage2.has(src) ? ' [etap2]' : ''}`);
}
console.log(`manifest files=${man.files.length} pin=${man.pin}`);
console.log(`identyczne z origin/main=${same} rozjechane=${drift.length} brak_zrodla_w_main=${missing.length}`);
console.log('ROZJECHANE:');
for (const d of drift) console.log('  ' + d);
console.log('BRAK:');
for (const m of missing) console.log('  ' + m);
