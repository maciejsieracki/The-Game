// P6.M12 runda 2: sklada plik `m12-r2-extra.json` ({maps, compute, spawn}) z wynikow polowan (`hunt-m12-mutants.mjs`).
// Dla kazdej mutacji, ktora przezyla w R1, a polowanie znalazlo wejscie ROZNIACE mutanta TS od oryginalu, bierze
// co najwyzej K najmniejszych map (rozne mapy, rozne wejscia). Wejscia sa potem uruchamiane na ORYGINALNYM webie
// przez `gen-m12-vectors.mjs` (zmienna `M12_R2_EXTRA`) - tu NIE ma zadnych wynikow.
//
// Dodatkowo (`--branches=a,b,spawn:c` + `--kb=N`): wejscia, ktore TRAFIAJA w galezie weba bez nagrania w R1
// (sondy `hitCases` z polowania), po N najmniejszych map na galaz; tag `branch:<sonda>`.
//
// Uzycie: node build-r2-extra.mjs <WYJSCIE_JSON> <K> [--branches=...] [--kb=N] <hunt1.json> [hunt2.json ...]
import { readFileSync, writeFileSync } from 'node:fs';

const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
const flag = (n, d) => (flags.find((f) => f.startsWith(`--${n}=`)) ?? `--${n}=${d}`).slice(n.length + 3);
const BRANCHES = flag('branches', '').split(',').filter(Boolean);
const KB = Number(flag('kb', 3));
const [, , outArg, kArg, ...huntArgs] = [process.argv[0], process.argv[1], ...process.argv.slice(2).filter((a) => !a.startsWith('--'))];
const huntFiles = huntArgs;
if (!outArg || !kArg || huntFiles.length === 0) {
  console.error('usage: <OUT_JSON> <K> <hunt.json ...>');
  process.exit(2);
}
const K = Number(kArg);
const rows = {}; // mutacja -> wiersze z dodatkowa mapa
for (const f of huntFiles) {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  for (const [id, list] of Object.entries(j.found)) {
    for (const r of list) {
      const rep = j.maps[r.map];
      if (!rep) continue;
      (rows[id] ??= []).push({ ...r, rep, file: f });
    }
  }
}

const branchRows = {};
for (const f of huntFiles) {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  for (const b of BRANCHES) {
    for (const r of j.hitCases?.[b] ?? []) {
      const rep = j.maps[r.map];
      if (!rep) continue;
      (branchRows[b] ??= []).push({ ...r, kind: b.startsWith('spawn:') ? 'spawn' : 'compute', rep, file: f, w: rep.w, h: rep.h });
    }
  }
}

const maps = {};
const compute = [];
const spawn = [];
const chosen = {};
const seen = new Set();
for (const [id, list] of Object.entries(rows).sort((a, b) => a[0].localeCompare(b[0]))) {
  list.sort((a, b) => a.w * a.h - b.w * b.h);
  const picked = [];
  const usedMaps = new Set();
  for (const r of list) {
    if (picked.length >= K) break;
    const key = `${r.kind}|${r.rep.hexesFnv}|${JSON.stringify(r.spec)}`;
    if (seen.has(key)) {
      picked.push(r); // juz wybrany dla innej mutacji - zaliczamy, nie dublujemy
      continue;
    }
    if (usedMaps.has(r.rep.hexesFnv) && list.length > K) continue;
    usedMaps.add(r.rep.hexesFnv);
    picked.push(r);
  }
  chosen[id] = picked.length;
  for (const r of picked) {
    const key = `${r.kind}|${r.rep.hexesFnv}|${JSON.stringify(r.spec)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // identyfikator mapy z polowania moze kolidowac miedzy plikami (h11_3 itd. sa unikalne dzieki ziarnu polowania)
    const mapId = 'x_' + r.rep.id;
    if (!maps[mapId]) maps[mapId] = { ...r.rep, id: mapId };
    const spec = { ...r.spec };
    if (r.kind === 'compute') compute.push({ map: mapId, spec, for: id });
    else spawn.push({ map: mapId, spec, for: id });
  }
}
for (const b of BRANCHES) {
  const list = (branchRows[b] ?? []).sort((a, c) => a.w * a.h - c.w * c.h);
  let n = 0;
  const usedSpec = new Set();
  for (const r of list) {
    if (n >= KB) break;
    const spec = { ...r.spec };
    if (r.kind === 'spawn') spec.playerTyp ??= 'grecy';
    const key = `${r.kind}|${r.rep.hexesFnv}|${JSON.stringify(spec)}`;
    if (usedSpec.has(key)) continue;
    usedSpec.add(key);
    const mapId = 'x_' + r.rep.id;
    if (!maps[mapId]) maps[mapId] = { ...r.rep, id: mapId };
    (r.kind === 'compute' ? compute : spawn).push({ map: mapId, spec, for: `branch:${b}` });
    n++;
  }
  chosen[`branch:${b}`] = n;
}
writeFileSync(outArg, JSON.stringify({ maps, compute, spawn, chosen }));
console.error(JSON.stringify({ maps: Object.keys(maps).length, compute: compute.length, spawn: spawn.length, chosen }));
