#!/usr/bin/env node
/**
 * Profil CPU procesu Node z generacją (CDP przez --inspect; działa mimo synchronicznej pętli w głównym wątku).
 * Użycie: node mapgen-rivers-seed22-diag-prof.cjs <gen.js> <port> <sekundy> <out.cpuprofile> <args generacji...>
 * Wypisuje top-N funkcji (self time) z numerami linii bundla.
 */
const { spawn } = require('child_process'); const fs = require('fs'); const http = require('http');
const [gen, port, secs, outFile, ...genArgs] = process.argv.slice(2);
const child = spawn(process.execPath, [`--inspect=127.0.0.1:${port}`, gen, ...genArgs], { stdio: ['ignore', 'inherit', 'inherit'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = (u) => new Promise((res, rej) => http.get(u, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej));
(async () => {
  let ws = null;
  for (let i = 0; i < 50 && !ws; i++) {
    try { const j = await getJson(`http://127.0.0.1:${port}/json`); ws = j[0].webSocketDebuggerUrl; } catch { await sleep(200); }
  }
  if (!ws) { console.error('brak inspektora'); child.kill(); process.exit(2); }
  const sock = new WebSocket(ws); await new Promise((r) => (sock.onopen = r));
  let id = 0; const pend = new Map();
  sock.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const call = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
  await call('Profiler.enable');
  await sleep(parseFloat(process.env.PROF_DELAY || '0') * 1000); // opóźnienie startu profilu (np. pominięcie fazy "główne")
  await call('Profiler.start');
  await sleep(parseFloat(secs) * 1000);
  const res = await call('Profiler.stop');
  fs.writeFileSync(outFile, JSON.stringify(res.result.profile));
  const p = res.result.profile; const self = new Map(); const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const dt = p.timeDeltas; let tot = 0;
  p.samples.forEach((sid, i) => { const n = byId.get(sid); const k = `${n.callFrame.functionName || '(anon)'}:${n.callFrame.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + dt[i]); tot += dt[i]; });
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  console.log('PROFILE_TOP (self, % of ' + (tot / 1e6).toFixed(1) + 's)');
  for (const [k, v] of top) console.log(`  ${(100 * v / tot).toFixed(1)}%  ${k}`);
  child.kill('SIGKILL'); process.exit(0);
})();
