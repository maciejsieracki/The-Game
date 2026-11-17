// R-WEB-MARCH-MULTITURN-NOT-RESUMED-LIVE-REPRO-Q1: konfiguracja vite do ZYWEGO testu marszu wieloturowego
// (gra/tools/march-multiturn-live-test.cjs). Build idzie POZA repo (MM_DIST); sonda `window.__mr` jest
// wstrzykiwana pluginem do main.ts W PAMIECI -- zadne zrodlo w repo nie jest zmieniane.
// MM_MUTANT=no-eot: w pamieci usuwa wywolanie koncowki marszu gracza (mutacja (b): test musi byc czerwony).
// Uzycie: MM_DIST=<katalog> vite build -c tools/march-multiturn-live-vite.config.ts
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const probe = `
    (window as any).__mr = {
      ready: true,
      start: (seed: number) => {
        const params = Object.assign({}, (globalThis as any).__mrBuildParams(), {
          seed, mapSize: 'Malenki', rivals: '1', civTypesCount: 2, cityStatesCount: 0,
        });
        return doStartGame(params);
      },
      foundCity: () => {
        if (!isAwaitingFirstPlayerCity()) return 'already';
        const start = playerStartHex;
        if (!start) return 'no-start';
        for (let rad = 0; rad <= Math.max(3, startRevealRadius); rad++) {
          for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
            const q = start.q + dq, r = start.r + dr;
            if (hexDistance(start.q, start.r, q, r) === rad && canFoundPlayerCityAt(q, r).ok)
              return tryFoundPlayerCityAt(q, r) ? 'ok' : 'found-failed';
          }
        }
        return 'no-valid-hex';
      },
      turn: () => turn,
      me: () => ME(),
      busy: () => ({ anim: isAnimating, pre: isPreBattleOpen(), scene: isBattleSceneOpen(), queue: marchExecQueue.slice(), awaitCity: isAwaitingFirstPlayerCity() }),
      units: () => units.map(u => ({ id: u.id, owner: u.ownerId, type: u.typeId, q: u.q, r: u.r, ruch: u.ruch, ruchLeft: u.ruchLeft, gen: !!u.isGeneral, garn: !!u.inGarnizon })),
      plans: () => Array.from(plannedMarches.entries()).map(([id, d]) => ({ id, d })),
      moved: () => Array.from(movedByPlayerThisTurn),
      stops: () => Array.from(marchStopDetail.entries()),
      dom: () => ({ sel: selectedId, uc: document.querySelectorAll('[class*="uc-"]').length, mq: document.querySelectorAll('.uc-march-queued').length, mp: document.querySelectorAll('.uc-march-paused').length, ash: document.querySelectorAll('.ash-status').length, asb: document.querySelectorAll('.ash-body').length, body: document.body.innerText.indexOf('marsz ruszy') }),
      city: () => cities.map(c => ({ id: c.id, owner: c.ownerId, q: c.q, r: c.r })),
      startHex: () => playerStartHex,
      isVisible: (q: number, r: number) => currentVisible().has(keyOf(q, r)),
      path: (uid: string, q: number, r: number) => {
        const u = units.find(x => x.id === uid); if (!u) return null;
        const occ = occupiedForMove(u.ownerId);
        const p = computePath(u, map, q, r, occ, moveCostFnForUnit(u));
        return p.map(h => h.q + ',' + h.r);
      },
      plan: (uid: string, q: number, r: number) => {
        const u = units.find(x => x.id === uid); if (!u) return 'no-unit';
        selectPlayerUnit(uid);
        return planMarchTo(q, r) ? 'ok' : 'refused';
      },
      move: (uid: string, q: number, r: number) => { selectPlayerUnit(uid); return beginMoveSelectedUnitTo(q, r); },
      endTurn: () => { triggerPlayerEndTurn(); return turn; },
      reloadSave: () => { const snap = buildSaveGameSnapshot('mm-live-reload'); restoreGameFromSave(snap); reapplyCityHexDecorHides(); return 'ok'; },
      blockers: () => ({
        canEnd: canPlayerInitiateEndTurn(), endInProg: endTurnInProgress,
        pre: isPreBattleOpen(), pendingPre: hasPendingAutoPreBattle(), nnsBlocked: nnsGateForPlayer().blokada,
      }),
    };
`;

const inject: Plugin = {
  name: 'mm-live-probe',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('/src/ui/newGameFlow.ts')) {
      const anchor = 'function buildParams(): NewGameParams {';
      if (!code.includes(anchor)) throw new Error('buildParams anchor missing');
      return code.replace(anchor, '(globalThis as any).__mrBuildParams = () => buildParams();\n' + anchor);
    }
    if (id.endsWith('/src/main.ts')) {
      const anchor = '    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);';
      if (!code.includes(anchor)) throw new Error('main anchor missing');
      let out = code.replace(anchor, anchor + '\n' + probe);
      if (process.env.MM_MUTANT === 'no-eot') {
        const eot = '        runPlannedMarchesAtPlayerEndTurn(humanOwnerId);';
        if (out.split(eot).length !== 2) throw new Error('EOT call anchor not unique');
        out = out.replace(eot, '        /* MM_MUTANT no-eot */');
      }
      return out;
    }
    return null;
  },
};

export default defineConfig({
  root: path.resolve(here, '..'),
  plugins: [inject, viteSingleFile()],
  build: { outDir: process.env.MM_DIST, emptyOutDir: true, minify: false },
  logLevel: 'warn',
});
