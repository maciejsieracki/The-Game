// R-WEB-UI-ARMY-PANEL-GENERAL-LABEL-MULTISELECT-Q1 — zywy harness: prawdziwa gra (main.ts) z sonda
// testowa wstrzykniętą przez plugin (tylko w buildzie testowym, poza repo; outDir z ARMY_LIVE_DIST).
// Sonda NIE zmienia logiki gry: ustawia stan fixture (stos 12 jednostek na heksie gracza) i zwraca odczyty.
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

const probe = `
    (window as any).__armyLive = {
      ready: true,
      start: (seed: number) => {
        const params = Object.assign({}, (globalThis as any).__armyBuildParams(), {
          seed, mapSize: 'Malenki', rivals: '1', civTypesCount: 2, cityStatesCount: 0,
        });
        return doStartGame(params);
      },
      /** Start: gracz musi założyć stolicę, zanim akcje panelu jednostki zadziałają (isAwaitingFirstPlayerCity). */
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
      /** Fixture: usuwa obce jednostki gracza z heksu i stawia generala + 11 Wojownikow. */
      setupStack: () => {
        const base = units.find(u => u.ownerId === 0 && u.isGeneral !== true) ?? units.find(u => u.ownerId === 0) ?? null;
        const def = data.units.find(u => u.Jednostka === 'Wojownik');
        if (!def) return { error: 'no-warrior-def' };
        const start = base ?? playerStartHex;
        if (!start) return { error: 'no-start-hex', owner0: units.filter(u => u.ownerId === 0).length };
        const q = start.q, r = start.r;
        for (let i = units.length - 1; i >= 0; i--) {
          const x = units[i]!;
          if (x.ownerId === 0 && x.q === q && x.r === r) units.splice(i, 1);
        }
        const mk = (id: string, isGeneral: boolean) => ({
          id, ownerId: 0, typeId: 'Wojownik', isGeneral,
          category: categoryOf(def.Jednostka, String(def['Rola'] ?? def['Rola (linia)'] ?? ''), def['Super-jednostka'] === 'TAK', def['Typ']),
          q, r, ruch: applyRuchSwiataPace(normFieldVal(def['Ruch'], 2), player.ruchSwiataPace ?? 'krotki'),
          ruchLeft: 2, hp: 30, hpMax: 30,
        }) as unknown as RuntimeUnit;
        // Generał w środku listy wstawienia (indeks 7): sortowanie na pierwsze miejsce ma być realnym testem.
        const ids: string[] = [];
        for (let i = 0; i < 12; i++) {
          const id = i === 7 ? 'live-general' : 'live-w' + i;
          units.push(mk(id, i === 7));
          ids.push(id);
        }
        return { q, r, ids };
      },
      stackIds: (q: number, r: number) => units.filter(u => u.ownerId === 0 && u.q === q && u.r === r).map(u => u.id),
      selectUnit: (id: string) => { selectPlayerUnit(id); return selectedId; },
    };
`;

const inject: Plugin = {
  name: 'army-panel-general-label-multiselect-live-probe',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('/src/ui/newGameFlow.ts')) {
      const anchor = 'function buildParams(): NewGameParams {';
      if (!code.includes(anchor)) throw new Error('Army live probe: buildParams anchor missing');
      return code.replace(anchor, '(globalThis as any).__armyBuildParams = () => buildParams();\n' + anchor);
    }
    if (id.endsWith('/src/main.ts')) {
      const anchor = '    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);';
      if (!code.includes(anchor)) throw new Error('Army live probe: main anchor missing');
      return code.replace(anchor, anchor + '\n' + probe);
    }
    return null;
  },
};

export default defineConfig({
  root: '.',
  plugins: [inject, viteSingleFile()],
  build: {
    outDir: process.env.ARMY_LIVE_DIST || '/tmp/army-panel-live',
    emptyOutDir: true,
    minify: false,
  },
});
