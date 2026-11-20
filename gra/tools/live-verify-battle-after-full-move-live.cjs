'use strict';
/**
 * R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1 (runda 3) -- pomiary NA ZYWO w Chromium (prawdziwy BattleScene, vite dev server
 * na drzewie, NIE zmieniamy gra/src). Dwa pomiary w jednym poleceniu, kod wyjscia 1 przy niespelnionym kryterium:
 *
 *  N2  Mieszana armia (piechota + strzelcy + konnica [+ machiny]) w trybie AUTO w czasie rzeczywistym (bez przycisku Pomin):
 *      A1 rozrzut frontu (jednostki wrecz: piechota + konnica, przebyte kolumny od pozycji startowej) <= 2 do pierwszego zderzenia wrecz;
 *      A2 cios na jednostke na ture <= 1 (liczone na prawdziwych jednostkach, bez klonow planowania AUTO);
 *      A3 odsetek obserwacji (jednostka x tura po pierwszym zderzeniu) z NIEWYKORZYSTANYM ruchem przy wolnej drodze <= UNUSED_MAX_PCT
 *         (domyslnie 10; zalozenie Operatora -- dispatch nie podaje progu; tabela per typ jest dowodem, prog tylko asercja).
 *  N3  Ucieczka i poscig: scenariusz z jednostkami "walczy do smierci" (Wojownik z maczuga (Chaska)) -- zbior NIEPUSTY:
 *      B1 neverRout nie sa rozbijane, nie uciekaja, a po pierwszym rozbiciu innych nadal walcza (ciosy) lub gina walczac;
 *      B2 uciekinierzy: <= 50% normalnego ruchu na ture (mnoznik z data/combat-params.json), krok w strone wlasnej krawedzi;
 *      B3 poscig: gdy po stronie zwyciezcy jest konnica i ktos uciekal, konnica zadaje ciosy uciekinierom;
 *      B4 K1-K5 jak w live-verify-battle-after-full-move-rout-check.cjs (timeout/pageerror, krawedz, brak routedLeft, bilans); K2 nie liczy uciekinierow rozstrzyganych regula konca bitwy (_resolveRemainingRouted: poza zasiegiem wroga = uciekl) -- osobny licznik fledAtEndResolve.
 *  INFO (nie kryterium): odwrot ARMII po bitwie (battle-retreat-limit.ts, FALA 732) -- NIE MIERZONY w scenie bitwy (dotyczy kampanii).
 *
 * Uzycie (z gra/):
 *   node tools/live-verify-battle-after-full-move-live.cjs [--out <katalog>] [--part n2|n3|all] [--seeds 1,2,3] [--shots]
 *   node tools/live-verify-battle-after-full-move-live.cjs --check <plik.jsonl> [...]   (tylko asercje na zapisanych danych)
 * Wyniki: <out>/live-n2-n3.jsonl (1 wiersz = 1 bitwa), tabele na stdout; --shots zapisuje <out>/live-shot-*.png.
 * Env: UNUSED_MAX_PCT, CHROMIUM_PATH.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUT = path.resolve(ROOT, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1', 'evidence');
const UNUSED_MAX_PCT = Number(process.env.UNUSED_MAX_PCT || 10);
const SPREAD_MAX = 2;
const HITS_MAX = 1;
const combatParams = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'combat-params.json'), 'utf8'));
const FLEE_MULT = Number(combatParams.ucieczka.mnoznik_ruchu);

const SCENARIOS = [
  // N2: mieszana armia. Hastati celowo NIE uzyty jako "piechota" (ma pile = liczy sie jako strzelec); Wojownik = czysta piechota.
  { id: 'M1', part: 'n2', name: 'mieszana: piechota+strzelcy+konnica (lustro)', atk: 'Wojownik:10,Lucznik:6,Konnica:4', def: 'Wojownik:10,Lucznik:6,Konnica:4', modes: ['auto'] },
  { id: 'M2', part: 'n2', name: 'mieszana z machinami (Katapulta)', atk: 'Wojownik:8,Lucznik:6,Konnica:4,Katapulta:2', def: 'Wojownik:10,Lucznik:6,Konnica:2', modes: ['auto'] },
  // M3 (RE-MEASURE-Q1): trzeci sklad mieszany, asymetryczny (atakujacy strzelcy/konnica, obronca ciezsza piechota) -- dispatch wymaga >= 3 skladow
  { id: 'M3', part: 'n2', name: 'mieszana asymetryczna: piechota slaba + strzelcy + konnica (atak) vs piechota mocna', atk: 'Wojownik:6,Lucznik:8,Konnica:6', def: 'Wojownik:12,Lucznik:4,Konnica:4', modes: ['auto'] },
  // N3: neverRout w scenariuszu (Chaska = "walczy do smierci"), przewaga przeciwnika z konnica -> rozbicie, ucieczka, poscig
  { id: 'R1', part: 'n3', name: 'neverRout (Chaska x4) + piechota vs piechota+konnica', atk: 'Wojownik z maczugą (Chaska):4,Wojownik:12', def: 'Wojownik:16,Konnica:8', modes: ['auto', 'skip'] },
  { id: 'R2', part: 'n3', name: 'wrecz 12v12 (Hastati) -- anomalia instant/skip', atk: 'Hastati:12', def: 'Hastati:12', modes: ['auto', 'skip', 'instant'] },
  { id: 'R3', part: 'n3', name: 'konnica vs piechota', atk: 'Konnica:8', def: 'Wojownik:14', modes: ['auto', 'skip'] },
];

// ---------------------------------------------------------------------------------------------- analiza (czysta, bez przegladarki)
const MELEE_KINDS = new Set(['infantry', 'mounted']);

function analyzeRow(row) {
  const r = row.r;
  const out = { id: `${row.scen}|s${row.seed}|${row.mode}`, bad: [], info: {} };
  if (!r) { out.bad.push('brak wyniku (r)'); return out; }
  const bad = out.bad;
  if (row.timedOut) bad.push('K1 timeout');
  if (row.errors && row.errors.length) bad.push(`K1 pageerror x${row.errors.length}`);
  if (row.mode === 'instant') { out.info.instant = true; return out; } // rozstrzygniecie bez rozgrywania bitwy (patrz INFO)
  if (r.fledNotAtEdge !== 0) bad.push(`K2 fledNotAtEdge=${r.fledNotAtEdge}`);
  if (r.def.routedLeft !== 0 || r.atk.routedLeft !== 0) bad.push(`K3 routedLeft def=${r.def.routedLeft} atk=${r.atk.routedLeft}`);
  for (const [side, s] of [['atk', r.atk], ['def', r.def]]) {
    if (s.killed + s.fled + s.survived !== s.total) bad.push(`K5 ${side} bilans ${s.killed}+${s.fled}+${s.survived}!=${s.total}`);
  }
  const info = r.unitInfo || {};
  const snaps = r.snapshots || [];

  // --- N2 (tylko wiersze z part n2): front, ciosy, niewykorzystany ruch
  if (row.part === 'n2' && row.mode === 'auto') {
    if (!snaps.length) { bad.push('A* brak migawek'); return out; }
    const q0 = {};
    for (const u of snaps[0].units) q0[u[0]] = u[1];
    let contactIdx = -1;
    for (let k = 0; k < snaps.length && contactIdx < 0; k++) {
      if (snaps[k].units.some(u => u[5] === 1 && MELEE_KINDS.has(info[u[0]].kind))) contactIdx = k;
    }
    out.info.contactIdx = contactIdx;
    out.info.contactRound = contactIdx >= 0 ? snaps[contactIdx].round : null;
    if (contactIdx < 0) bad.push('A1 brak zderzenia wrecz w bitwie (NIE_ZMIERZONO)');
    const spreads = [];
    for (let k = 0; k <= Math.max(contactIdx, 0); k++) {
      for (const side of ['atk', 'def']) {
        const adv = snaps[k].units.filter(u => info[u[0]].side === side && !u[3] && MELEE_KINDS.has(info[u[0]].kind)).map(u => Math.abs(u[1] - q0[u[0]]));
        if (adv.length >= 2) spreads.push({ k, round: snaps[k].round, side, spread: Math.max(...adv) - Math.min(...adv), n: adv.length });
      }
    }
    out.info.spreads = spreads;
    out.info.maxSpread = spreads.length ? Math.max(...spreads.map(s => s.spread)) : null;
    if (!spreads.length) bad.push('A1 brak pomiaru rozrzutu (NIE_ZMIERZONO)');
    else if (out.info.maxSpread > SPREAD_MAX) bad.push(`A1 rozrzut frontu ${out.info.maxSpread} > ${SPREAD_MAX}`);
    // A2
    const hits = r.hitCount || {};
    out.info.maxHits = Math.max(0, ...Object.values(hits));
    if (out.info.maxHits > HITS_MAX) bad.push(`A2 ciosy na jednostke na ture max=${out.info.maxHits} > ${HITS_MAX}`);
    // A3
    const perKind = {};
    for (let k = Math.max(contactIdx, 0) + 1; k < snaps.length; k++) {
      for (const u of snaps[k].units) {
        if (u[3]) continue; // uciekinier
        const kind = info[u[0]].kind;
        const e = (perKind[kind] = perKind[kind] || { obs: 0, unused: 0, adj: 0 });
        e.obs++; e.unused += u[4]; e.adj += u[5];
      }
    }
    out.info.perKind = perKind;
    for (const [kind, e] of Object.entries(perKind)) {
      const pct = e.obs ? 100 * e.unused / e.obs : 0;
      e.pct = Math.round(pct * 10) / 10;
      if (e.obs < 3) bad.push(`A3 ${kind}: za malo obserwacji (${e.obs}) -- NIE_ZMIERZONO`);
      else if (pct > UNUSED_MAX_PCT) bad.push(`A3 ${kind}: niewykorzystany ruch ${e.pct}% > ${UNUSED_MAX_PCT}%`);
    }
  }

  // --- N3: neverRout, flee 50%, poscig (tylko wiersze part n3, tryb auto/skip)
  if (row.part === 'n3') {
    const nr = Object.entries(info).filter(([, i]) => i.neverRout).map(([id]) => id);
    out.info.neverRoutCount = nr.length;
    const routEv = (r.events && r.events.rout) || [];
    const firstRout = routEv.length ? Math.min(...routEv.map(e => e.round)) : null;
    out.info.firstRoutRound = firstRout;
    out.info.routEvents = routEv.length;
    if (row.scen.includes('neverRout')) {
      if (!nr.length) bad.push('B1 scenariusz neverRout bez jednostek neverRout (zbior pusty = NIE_ZMIERZONO)');
      for (const id of nr) {
        if (routEv.some(e => e.id === id)) bad.push(`B1 neverRout ${id} rozbity`);
        if (r.finalFate[id] === 'fled' || r.finalFate[id] === 'routedLeft') bad.push(`B1 neverRout ${id} los=${r.finalFate[id]}`);
      }
      const hitsAfter = nr.reduce((n, id) => {
        let h = 0;
        for (const [k, v] of Object.entries(r.hitCount || {})) { const [rd, uid] = k.split('|'); if (uid === id && firstRout !== null && Number(rd) >= firstRout) h += v; }
        return n + h;
      }, 0);
      out.info.neverRoutHitsAfterFirstRout = hitsAfter;
      if (firstRout !== null && row.mode === 'auto' && hitsAfter === 0 && nr.some(id => r.finalFate[id] === 'survived')) {
        bad.push('B1 neverRout przezyl, ale po pierwszym rozbiciu nie zadal ani jednego ciosu');
      }
      out.info.neverRoutFates = Object.fromEntries(nr.map(id => [id, r.finalFate[id]]));
    }
    // B2 ucieczka 50% ruchu
    const steps = r.fleeSteps || [];
    const perUnitRound = {};
    for (const s of steps) { const k = `${s.round}|${s.id}`; perUnitRound[k] = (perUnitRound[k] || 0) + 1; }
    let maxRatio = 0; const fleeRows = [];
    for (const [k, n] of Object.entries(perUnitRound)) {
      const [rd, id] = k.split('|'); const i = info[id];
      const expected = Math.max(1, Math.floor(i.move * FLEE_MULT));
      if (i.fleeMove !== expected) bad.push(`B2 ${id} fleeMove=${i.fleeMove} != floor(${i.move}*${FLEE_MULT})=${expected}`);
      if (n > i.fleeMove) bad.push(`B2 ${id} tura ${rd}: ${n} krokow > limit ucieczki ${i.fleeMove}`);
      if (i.fleeMove > i.move) bad.push(`B2 ${id} ucieczka szybsza niz zwykly ruch`);
      maxRatio = Math.max(maxRatio, n / i.move);
      fleeRows.push({ round: Number(rd), id, side: i.side, type: i.type, steps: n, fleeLimit: i.fleeMove, move: i.move });
    }
    out.info.fleeRows = fleeRows.sort((a, b) => a.round - b.round);
    out.info.maxFleeRatio = Math.round(maxRatio * 100) / 100;
    for (const s of steps) {
      const home = s.side === 'atk' ? -1 : 1; // kierunek kolumn do wlasnej krawedzi
      if ((s.to[0] - s.from[0]) * home < 0) bad.push(`B2 krok ${s.id} tura ${s.round} w strone WROGA (${s.from}->${s.to})`);
    }
    // B3 poscig konnicy
    const pur = r.pursuit || [];
    const fledOrRouted = routEv.length;
    const winnerHasCav = Object.values(info).some(i => i.kind === 'mounted' && (r.winner === 'atakujacy' ? i.side === 'atk' : i.side === 'def'));
    out.info.pursuit = { total: pur.length, mounted: pur.filter(p => p.mounted).length, ranged: pur.filter(p => p.ranged).length };
    if (fledOrRouted > 0 && !(pur.length > 0)) bad.push(`B3 byli rozbici (${fledOrRouted}), brak jakiegokolwiek poscigu (ciosow w uciekinierow)`);
    if (fledOrRouted > 0 && winnerHasCav && row.mode === 'auto' && out.info.pursuit.mounted === 0 && row.scen.includes('konnica')) {
      bad.push('B3 zwyciezca ma konnice, ktos uciekal, a konnica nie zadala ciosu uciekinierowi');
    }
  }
  return out;
}

function printReport(rows) {
  const results = rows.map(analyzeRow);
  let fails = 0;
  const L = [];
  L.push('=== TABELA N2: mieszana armia (AUTO, czas rzeczywisty) ===');
  L.push('scenariusz | ziarno | zderzenie(runda) | max rozrzut frontu | max ciosow/jedn./ture | niewykorzystany ruch % (obs) per typ | werdykt');
  for (let i = 0; i < rows.length; i++) {
    const a = results[i], row = rows[i];
    if (!(row.part === 'n2' && row.mode === 'auto')) continue;
    const pk = Object.entries(a.info.perKind || {}).map(([k, e]) => `${k}=${e.pct}%(${e.obs})`).join(' ');
    L.push(`${row.scen} | s${row.seed} | r${a.info.contactRound} | ${a.info.maxSpread} | ${a.info.maxHits} | ${pk} | ${a.bad.length ? 'FAIL: ' + a.bad.join('; ') : 'PASS'}`);
  }
  L.push('');
  L.push('=== TABELA N3: ucieczka, poscig, neverRout ===');
  L.push('scenariusz | ziarno | tryb | zwyciezca | rozbici(zdarz.) | pierwsze rozbicie(runda) | neverRout (liczba / losy) | ciosy neverRout po 1. rozbiciu | poscig (razem/konnica/strzelcy) | max kroki ucieczki/ruch | werdykt');
  for (let i = 0; i < rows.length; i++) {
    const a = results[i], row = rows[i];
    if (row.part !== 'n3') continue;
    if (a.info.instant) { L.push(`${row.scen} | s${row.seed} | instant | -- | INFO: rozstrzygniecie bez rozgrywania bitwy (_skipInstantFallback; runda=${row.r.round}, killed/fled=0 oczekiwane) | ${a.bad.length ? 'FAIL: ' + a.bad.join('; ') : 'PASS (K1)'}`); continue; }
    const p = a.info.pursuit || {};
    L.push(`${row.scen} | s${row.seed} | ${row.mode} | ${row.r.winner} | ${a.info.routEvents} | ${a.info.firstRoutRound} | ${a.info.neverRoutCount}/${JSON.stringify(a.info.neverRoutFates || {})} | ${a.info.neverRoutHitsAfterFirstRout ?? '-'} | ${p.total}/${p.mounted}/${p.ranged} | ${a.info.maxFleeRatio} | ${a.bad.length ? 'FAIL: ' + a.bad.join('; ') : 'PASS'}`);
  }
  L.push('');
  L.push('=== N3: ruch uciekinierow per tura (tura/runda | jednostka | strona | typ | kroki w turze | limit ucieczki (50% ruchu) | zwykly ruch) ===');
  for (let i = 0; i < rows.length; i++) {
    const a = results[i], row = rows[i];
    if (row.part !== 'n3' || row.mode !== 'auto' || !a.info.fleeRows) continue;
    L.push(`-- ${row.scen} s${row.seed}: ${a.info.fleeRows.length} wpisow (uciekinier x tura)`);
    for (const f of a.info.fleeRows.slice(0, 14)) L.push(`   r${f.round} | ${f.id} | ${f.side} | ${f.type} | ${f.steps} | ${f.fleeLimit} | ${f.move}`);
    if (a.info.fleeRows.length > 14) L.push(`   ... (+${a.info.fleeRows.length - 14} wpisow w JSONL)`);
  }
  L.push('');
  for (const a of results) if (a.bad.length) fails++;
  L.push('INFO: odwrot ARMII po bitwie (limit 3/ture, czwarty = unicestwienie; battle-retreat-limit.ts / post-battle-map.ts) NIE jest mierzony w scenie bitwy -- NIE_ZMIERZONO (wymaga kampanii).');
  L.push(`=== live-verify-battle-after-full-move-live: ${rows.length} bitew, ${fails} z naruszeniem, progi: rozrzut<=${SPREAD_MAX}, ciosy<=${HITS_MAX}, niewykorzystany ruch<=${UNUSED_MAX_PCT}% ===`);
  console.log(L.join('\n'));
  return fails;
}

// ---------------------------------------------------------------------------------------------- przegladarka
async function measure(opts) {
  const { chromium } = require('playwright');
  const { createServer } = require('vite');
  const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
  const server = await createServer({ root: ROOT, configFile: path.join(ROOT, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const base = `http://127.0.0.1:${server.httpServer.address().port}/tools/battle-rout-pursuit-browser-entry.html`;
  const rows = [];
  const outFile = path.join(opts.out, 'live-n2-n3.jsonl');
  fs.mkdirSync(opts.out, { recursive: true });
  const done = new Set();
  if (fs.existsSync(outFile)) for (const l of fs.readFileSync(outFile, 'utf8').split('\n')) { if (l.trim()) { const r = JSON.parse(l); done.add(`${r.id}|${r.seed}|${r.mode}`); rows.push(r); } }
  try {
    for (const sc of SCENARIOS) {
      if (opts.part !== 'all' && sc.part !== opts.part) continue;
      for (const seed of opts.seeds) {
        for (const mode of sc.modes) {
          const key = `${sc.id}|${seed}|${mode}`;
          if (done.has(key)) continue;
          const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
          const errors = []; page.on('pageerror', e => errors.push(e.message));
          const url = `${base}?mode=${mode}&seed=${seed}&norender=1&atk=${encodeURIComponent(sc.atk)}&def=${encodeURIComponent(sc.def)}`;
          await page.goto(url, { waitUntil: 'load', timeout: 60000 });
          await page.waitForFunction(() => window.__e2e && window.__e2e.ready === true, undefined, { timeout: 60000 });
          let timedOut = false;
          try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: 280000, polling: 500 }); } catch { timedOut = true; }
          const r = timedOut ? null : await page.evaluate(() => window.__e2e.result);
          await page.close();
          const row = { id: sc.id, part: sc.part, scen: `${sc.id} ${sc.name}`, atk: sc.atk, def: sc.def, seed, mode, timedOut, errors, r };
          rows.push(row);
          fs.appendFileSync(outFile, JSON.stringify(row) + '\n');
          console.log(`DONE ${key} winner=${r && r.winner} round=${r && r.round} timedOut=${timedOut} errors=${errors.length}`);
        }
      }
    }
    if (opts.shots) await takeShots(browser, base, opts.out);
  } finally { await browser.close(); await server.close(); }
  return rows;
}

/** Zrzuty ekranu: pauza klawiszem P (UI), rysowanie wlaczane na chwile, zrzut, wznowienie klawiszem P. */
async function takeShots(browser, base, out) {
  const sc = SCENARIOS.find(s => s.id === 'R1');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const url = `${base}?mode=auto&seed=1&norender=1&pr=1&atk=${encodeURIComponent(sc.atk)}&def=${encodeURIComponent(sc.def)}`;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__e2e && window.__e2e.ready === true, undefined, { timeout: 60000 });
  const shots = [
    { name: 'live-shot-1-pierwsze-rozbicie.png', cond: () => window.__e2e.events.rout.length > 0 },
    { name: 'live-shot-2-neverRout-walczy.png', cond: () => { const s = window.__scene; return s.atk.some(u => u.neverRout && !u.dead && !u.routed && !u.removed) && window.__e2e.events.rout.length >= 3; } },
    { name: 'live-shot-3-poscig-konnica.png', cond: () => window.__e2e.pursuit.some(p => p.mounted) && window.__e2e.fleeSteps.length > 0 },
  ];
  let idx = 0; const t0 = Date.now();
  while (idx < shots.length && Date.now() - t0 < 240000) {
    const finished = await page.evaluate(() => window.__e2e.done === true);
    const hit = finished ? false : await page.evaluate(`(${shots[idx].cond.toString()})()`);
    if (hit) {
      await page.keyboard.press('p'); // pauza przez UI (klawisz P)
      await page.evaluate(() => window.__e2e.setRender(true));
      // przyblizenie kamery kolem pola walki (kolko myszy nad canvasem = zoom w UI)
      const c = await page.evaluate(() => {
        const sc = window.__scene; const us = [...sc.atk, ...sc.def].filter(u => !u.dead && !u.removed);
        const x = us.reduce((a, u) => a + u.group.position.x, 0) / us.length, z = us.reduce((a, u) => a + u.group.position.z, 0) / us.length;
        sc.camera.updateMatrixWorld(true);
        const v = sc.camera.matrixWorldInverse.elements, p = sc.camera.projectionMatrix.elements, y = 0.3;
        const vx = v[0]*x+v[4]*y+v[8]*z+v[12], vy = v[1]*x+v[5]*y+v[9]*z+v[13], vz = v[2]*x+v[6]*y+v[10]*z+v[14], vw = v[3]*x+v[7]*y+v[11]*z+v[15];
        const cx = p[0]*vx+p[4]*vy+p[8]*vz+p[12]*vw, cy = p[1]*vx+p[5]*vy+p[9]*vz+p[13]*vw, cw = p[3]*vx+p[7]*vy+p[11]*vz+p[15]*vw;
        const r = sc.canvas.getBoundingClientRect(); return { x: r.left + (cx / cw + 1) * r.width / 2, y: r.top + (1 - cy / cw) * r.height / 2 };
      });
      await page.mouse.move(c.x, c.y);
      for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, -400); await page.waitForTimeout(80); }
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(out, shots[idx].name) });
      await page.evaluate(() => window.__e2e.setRender(false));
      await page.keyboard.press('p');
      console.log('SHOT', shots[idx].name, await page.evaluate(() => ({ round: window.__scene.roundNo, routed: window.__e2e.events.rout.length })));
      idx++;
    } else if (finished) break;
    else await page.waitForTimeout(40);
  }
  await page.close();
  if (idx < shots.length) console.log(`UWAGA: wykonano ${idx}/${shots.length} zrzutow (warunek nie wystapil)`);
}

// ---------------------------------------------------------------------------------------------- main
function parseArgs(argv) {
  const o = { out: DEFAULT_OUT, part: 'all', seeds: [1, 2, 3], shots: false, check: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = path.resolve(argv[++i]);
    else if (a === '--part') o.part = argv[++i];
    else if (a === '--seeds') o.seeds = argv[++i].split(',').map(Number);
    else if (a === '--shots') o.shots = true;
    else if (a === '--check') { o.check = []; while (argv[i + 1] && !argv[i + 1].startsWith('--')) o.check.push(argv[++i]); }
  }
  return o;
}

module.exports = { analyzeRow, printReport, SCENARIOS };

if (require.main === module) {
  (async () => {
    const o = parseArgs(process.argv.slice(2));
    let rows;
    if (o.check) {
      rows = [];
      for (const f of o.check) for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l.trim()) rows.push(JSON.parse(l));
    } else {
      rows = await measure(o);
    }
    if (o.part !== 'all') rows = rows.filter(r => r.part === o.part);
    const fails = printReport(rows);
    process.exitCode = fails > 0 || rows.length === 0 ? 1 : 0;
  })().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
}
