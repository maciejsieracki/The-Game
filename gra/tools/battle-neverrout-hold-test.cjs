'use strict';
// R-WEB-BATTLE-NEVERROUT-HOLD-FIGHT-Q1: test regresyjny prawdziwej bitwy 3D w Chromium (Vite HTTP).
// Decyzja C: po zalamaniu morale armii jednostki "walczy do smierci" (neverRout) NIE uciekaja i walcza dalej,
// zwykli uciekinierzy schodza z pola (widoczna ucieczka), a bitwa konczy sie dopiero, gdy neverRout zgina,
// uciekinierzy zejda z pola albo minie limit PURSUIT_MAX_ROUNDS (30 tur).
//  - kryterium 2: neverRout nigdy nie zmienia stanu na routed (routed === false przez cala bitwe),
//  - kryterium 3: bitwa nie konczy sie w turze zalamania (round > collapseRound) i po jej koncu
//    przegrana strona nie ma zywych neverRout (chyba ze werdykt wymuszony: PAT / szturm / sufit),
//  - kryterium 1: po bitwie brak uciekinierow na polu, wszyscy uciekinierzy zeszli na krawedz wlasnej strony,
//  - kryterium 4: od poczatku poscigu nie minelo wiecej niz PURSUIT_MAX_ROUNDS (30) tur.
// Bitwa uruchamiana przez istniejacy wpis battle-rout-pursuit-browser-entry.html (tryb watch = AUTO przewijana).
// Usage (z gra/): TMPDIR=/dev/shm node tools/battle-neverrout-hold-test.cjs
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.HOLD_MAX_MS || 280000);
const PURSUIT_MAX_ROUNDS = 30;
const CHASKA = 'Wojownik z maczugą (Chaska)';

const CASES = [
  { name: 'Chaska trzyma, reszta ucieka (seed 1)', atk: `${CHASKA}:4,Wojownik:6`, def: 'Hastati:16', seed: 1, loser: 'atk' },
  { name: 'Chaska trzyma, reszta ucieka (seed 2)', atk: `${CHASKA}:4,Wojownik:6`, def: 'Hastati:16', seed: 2, loser: 'atk' },
  { name: 'Chaska po stronie obrony (seed 1)', atk: 'Hastati:16', def: `${CHASKA}:4,Wojownik:6`, seed: 1, loser: 'def' },
  // Dyskryminujace (czerwone na bazie 6a0cbba): sama Chaska, bez zwyklych jednostek do ucieczki. Po zalamaniu nie ma
  // uciekinierow na polu, wiec na bazie bitwa konczy sie w turze zalamania z zywa Chaska; na kandydacie walka trwa.
  { name: 'sama Chaska po zalamaniu (seed 1)', atk: `${CHASKA}:4`, def: 'Hastati:16', seed: 1, loser: 'atk', noFlee: true },
  { name: 'sama Chaska po zalamaniu (seed 2)', atk: `${CHASKA}:3`, def: 'Hastati:16', seed: 2, loser: 'atk', noFlee: true },
];

// HOLD_CASES (JSON, opcjonalnie): nadpisuje liste scenariuszy, np. do strojenia bez edycji pliku.
if (process.env.HOLD_CASES) CASES.splice(0, CASES.length, ...JSON.parse(process.env.HOLD_CASES));

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let pass = 0; let fail = 0;
  const check = (name, ok, detail) => { if (ok) { pass++; console.log('PASS: ' + name); } else { fail++; console.log('FAIL: ' + name + ' -- ' + JSON.stringify(detail)); } };
  try {
    for (const c of CASES) {
      const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const qs = `mode=watch&seed=${c.seed}&atk=${encodeURIComponent(c.atk)}&def=${encodeURIComponent(c.def)}${c.extra ? "&" + c.extra : ""}`;
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-rout-pursuit-browser-entry.html?${qs}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
      // Instrumentacja po starcie: zapis rundy zalamania armii, w ktorej przy zyciu zostaja neverRout.
      await page.evaluate(() => {
        const s = window.__scene; const nr = (window.__nr = { collapseRound: -1, collapseSide: null, neverAtStart: 0 });
        const alive = (u) => !u.dead && !u.fadingOut && !u.removed;
        nr.neverAtStart = [...s.atk, ...s.def].filter(u => u.neverRout && alive(u)).length;
        const orig = s._routWholeArmy.bind(s);
        s._routWholeArmy = (roster) => {
          const hasNever = roster.some(u => u.neverRout && alive(u) && !u.routed);
          const r = orig(roster);
          if (hasNever && nr.collapseRound < 0) { nr.collapseRound = s.roundNo; nr.collapseSide = roster === s.atk ? 'atk' : 'def'; }
          return r;
        };
      });
      let timedOut = false;
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
      const r = await page.evaluate(() => {
        const s = window.__scene;
        const alive = (u) => !u.dead && !u.fadingOut && !u.removed;
        const lines = s.log.slice();
        return {
          ...window.__e2e.result,
          nr: window.__nr,
          neverRoutRouted: [...s.atk, ...s.def].filter(u => u.neverRout && u.routed).length,
          neverAliveAtEnd: { atk: s.atk.filter(u => u.neverRout && alive(u)).length, def: s.def.filter(u => u.neverRout && alive(u)).length },
          pursuitStartRound: s._pursuitStartRound,
          forcedEnd: lines.some(l => /PAT|SZTURM/.test(l)),
          capEnd: lines.some(l => /bez rozstrzygniecia|PAT \(przewijanie\)/.test(l)),
        };
      });
      await page.close();
      console.log(JSON.stringify({ case: c.name, timedOut, errors, r }));
      check(`[${c.name}] bitwa zakonczona bez bledow`, !timedOut && !errors.length && !!r, { timedOut, errors });
      if (!r) continue;
      const loser = c.loser;
      const t = r[loser];
      const collapsed = r.nr.collapseRound > 0;
      check(`[${c.name}] scenariusz: jednostki neverRout sa w bitwie`, r.nr.neverAtStart > 0, r.nr.neverAtStart);
      check(`[${c.name}] scenariusz: zalamanie morale z zywymi neverRout wystapilo (strona ${r.nr.collapseSide})`, collapsed && r.nr.collapseSide === loser, r.nr);
      check(`[${c.name}] kr.2: neverRout nie zmienia stanu na routed`, r.neverRoutRouted === 0, r.neverRoutRouted);
      check(`[${c.name}] kr.3: bitwa trwa PO turze zalamania (koniec ${r.round} > zalamanie ${r.nr.collapseRound})`, collapsed && r.round > r.nr.collapseRound, [r.round, r.nr.collapseRound]);
      if (!r.forcedEnd) {
        check(`[${c.name}] kr.3: przegrana strona nie ma zywych neverRout po koncu (zginely albo bitwa trwala)`, r.neverAliveAtEnd[loser] === 0, r.neverAliveAtEnd);
      }
      check(`[${c.name}] kr.1: po bitwie brak uciekinierow na polu`, r.atk.routedLeft === 0 && r.def.routedLeft === 0, [r.atk.routedLeft, r.def.routedLeft]);
      // Uciekinierzy PRZEGRANEJ strony (kryterium 1) musza schodzic na krawedz wlasnej strony. Wyjatek poza zakresem
      // tego tematu: zwyciezca z pojedynczym zwyklym zalamaniem (nie neverRout), usuwany przy koncu bitwy (_resolveRemainingRouted).
      check(`[${c.name}] kr.1: uciekinierzy przegranej strony schodza na krawedz wlasnej strony`, r.notEdge.filter(x => x[0] === loser).length === 0, [r.fledAtEdge, r.fledNotAtEdge, r.notEdge]);
      if (!c.noFlee) check(`[${c.name}] kr.1: przegrani uciekinierzy widocznie uciekaja (fledAtEdge > 0)`, t.fled > 0, t);
      check(`[${c.name}] kr.4: poscig nie trwa dluzej niz ${PURSUIT_MAX_ROUNDS} tur`, r.pursuitStartRound < 0 || r.round - r.pursuitStartRound <= PURSUIT_MAX_ROUNDS + 1, [r.round, r.pursuitStartRound]);
      for (const side of ['atk', 'def']) {
        const x = r[side];
        check(`[${c.name}] ${side}: zabici + uciekli + aktywni = liczba jednostek`, x.killed + x.fled + x.survived === x.total, x);
      }
    }
  } finally { await browser.close(); await server.close(); }
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
