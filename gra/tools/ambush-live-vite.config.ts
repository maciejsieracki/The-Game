// R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (r4): konfiguracja vite do ZYWEGO testu zasadzki (gra/tools/ambush-live-test.cjs).
// Build idzie POZA repo (AMB_DIST), a sonda `window.__amb` jest wstrzykiwana pluginem do main.ts w pamieci --
// zadne zrodlo w repo nie jest zmieniane. Uzycie: AMB_ROOT=<gra> AMB_DIST=<katalog> vite build -c tools/ambush-live-vite.config.ts
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

const probe = `
    (window as any).__amb = {
      ready: true,
      start: (seed: number) => {
        const params = Object.assign({}, (globalThis as any).__ambBuildParams(), {
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
      mk: (id: string, ownerId: number, q: number, r: number, ruch = 8) => {
        const def = data.units.find(u => u.Jednostka === 'Wojownik')!;
        return {
          id, ownerId, typeId: 'Wojownik', isGeneral: false,
          category: categoryOf(def.Jednostka, String(def['Rola'] ?? def['Rola (linia)'] ?? ''), def['Super-jednostka'] === 'TAK', def['Typ']),
          q, r, ruch, ruchLeft: ruch, hp: 30, hpMax: 30,
        } as unknown as RuntimeUnit;
      },
      // Uklad gracz->AI (zasadzka AI, gracz wchodzi): jak w harnessie FC r3.
      setup: () => {
        const city = cities.find(c => c.ownerId === 0);
        const base = city ? { q: city.q, r: city.r } : playerStartHex;
        const mk = (window as any).__amb.mk;
        for (let rad = 2; rad <= 5; rad++) for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
          const p0q = base!.q + dq, p0r = base!.r + dr;
          if (hexDistance(base!.q, base!.r, p0q, p0r) !== rad) continue;
          if (!map.hexes[keyOf(p0q, p0r)] || cities.some(c => c.q === p0q && c.r === p0r)) continue;
          if (units.some(u => u.q === p0q && u.r === p0r)) continue;
          const probeU = mk('probe', 0, p0q, p0r);
          for (const n1 of hexNeighborCoords(p0q, p0r)) for (const e of hexNeighborCoords(n1.q, n1.r)) {
            if (hexDistance(p0q, p0r, e.q, e.r) !== 2) continue;
            if (!map.hexes[keyOf(e.q, e.r)] || cities.some(c => c.q === e.q && c.r === e.r)) continue;
            if (units.some(u => (u.q === e.q && u.r === e.r) || (u.q === n1.q && u.r === n1.r))) continue;
            const occ = occupiedForMove(0);
            const path = computePath(probeU, map, e.q, e.r, occ, moveCostFnForUnit(probeU));
            if (path.length !== 2) continue;
            let s: {q:number;r:number} | null = null;
            for (const c of hexNeighborCoords(p0q, p0r)) {
              if (c.q === n1.q && c.r === n1.r) continue;
              if (!map.hexes[keyOf(c.q, c.r)] || units.some(u => u.q === c.q && u.r === c.r)) continue;
              if (cities.some(ct => ct.q === c.q && ct.r === c.r)) continue;
              s = c; break;
            }
            if (!s) continue;
            units.push(mk('amb-m', 0, p0q, p0r));
            units.push(mk('amb-s1', 0, s.q, s.r));
            units.push(mk('amb-s2', 0, s.q, s.r));
            units.push(mk('amb-e1', 1, e.q, e.r));
            units.push(mk('amb-e2', 1, e.q, e.r));
            setDiploRelation(0, 1, { zaufanie: 0, respekt: 0, status: 'wojna' } as any);
            setAmbush(units.filter(u => u.id === 'amb-e1' || u.id === 'amb-e2'));
            syncUnitsRender();
            return { p0: { q: p0q, r: p0r }, n1, e, s };
          }
        }
        return { error: 'no-layout' };
      },
      // Uklad AI->gracz: korytarz (reszta sasiadow = gory), zasadzka GRACZA w srodku, AI z jednej strony, widoczny cel gracza z drugiej.
      setupAi: () => {
        const mk = (window as any).__amb.mk;
        const city = cities.find(c => c.ownerId === 0);
        const base = city ? { q: city.q, r: city.r } : playerStartHex;
        const okHex = (q: number, r: number) => {
          const h = map.hexes[keyOf(q, r)];
          return !!h && !isWaterTerrain(h.terenBazowy as any) && !cities.some(c => c.q === q && c.r === r)
            && !units.some(u => u.q === q && u.r === r);
        };
        for (let rad = 3; rad <= 9; rad++) for (let dq = -rad; dq <= rad; dq++) for (let dr = -rad; dr <= rad; dr++) {
          const q0 = base!.q + dq, r0 = base!.r + dr;
          if (hexDistance(base!.q, base!.r, q0, r0) !== rad) continue;
          const line = [0, 1, 2, 3, 4, 5].map(i => ({ q: q0 + i, r: r0 }));
          if (!line.every(h => okHex(h.q, h.r))) continue;
          const lineKeys = new Set(line.map(h => keyOf(h.q, h.r)));
          // sasiedzi linii (poza linia) -> gory (nieprzejezdne), o ile nie sa miastami/jednostkami
          const wall: string[] = [];
          let clash = false;
          for (const h of line) for (const n of hexNeighborCoords(h.q, h.r)) {
            const k = keyOf(n.q, n.r);
            if (lineKeys.has(k)) continue;
            if (!map.hexes[k]) continue;
            if (cities.some(c => c.q === n.q && c.r === n.r) || units.some(u => u.q === n.q && u.r === n.r)) { clash = true; }
            wall.push(k);
          }
          if (clash) continue;
          for (const k of wall) (map.hexes[k] as any).terenBazowy = TerenBazowy.Gory;
          units.push(mk('aiamb-e1', 1, line[0]!.q, line[0]!.r, 8));
          units.push(mk('aiamb-e2', 1, line[0]!.q, line[0]!.r, 8));
          units.push(mk('aiamb-s1', 0, line[3]!.q, line[3]!.r, 8));
          units.push(mk('aiamb-s2', 0, line[3]!.q, line[3]!.r, 8));
          units.push(mk('aiamb-t1', 0, line[5]!.q, line[5]!.r, 8));
          units.push(mk('aiamb-t2', 0, line[5]!.q, line[5]!.r, 8));
          units.push(mk('aiamb-t3', 0, line[5]!.q, line[5]!.r, 8));
          setDiploRelation(0, 1, { zaufanie: 0, respekt: 0, status: 'wojna' } as any);
          // Rownowazenie NNS-AI rozwiazuje jednostki AI przy ujemnym skarbcu/spichlerzu (uklad testowy jest sztuczny): bufor.
          setOwnerTreasury(1, 100000);
          const st1 = empireFoodStates.get(1);
          if (st1) st1.zapasyPanstwa = 100000;
          setAmbush(units.filter(u => u.id === 'aiamb-s1' || u.id === 'aiamb-s2'));
          for (const u of units) if (u.ownerId === 1 && u.id.startsWith('aiamb-')) u.ruchLeft = u.ruch;
          syncUnitsRender();
          return { line, wall: wall.length };
        }
        return { error: 'no-line' };
      },
      info: () => {
        const g = (id: string) => units.find(u => u.id === id);
        const pos = (id: string) => { const u = g(id); return u ? { q: u.q, r: u.r, ambush: u.ambush === true, ruchLeft: u.ruchLeft } : null; };
        return {
          m: pos('amb-m'), e1: pos('amb-e1'), e2: pos('amb-e2'), s1: pos('amb-s1'),
          ai: { e1: pos('aiamb-e1'), e2: pos('aiamb-e2'), s1: pos('aiamb-s1'), s2: pos('aiamb-s2'), t1: pos('aiamb-t1') },
          enemyVisibleToPlayer: units.filter(u => u.ownerId === 1 && (u.id.startsWith('amb-') ) && isUnitVisibleToViewer(u, 0)).length,
          preBattleOpen: isPreBattleOpen(), battleSceneOpen: isBattleSceneOpen(), turn,
          ambushMarkSprites: (unitRenderer as any).stackAmbushSprites ? (unitRenderer as any).stackAmbushSprites.size : -1,
          overlap: (() => { const k = new Map<string, Set<number>>(); for (const u of units) { if (u.inGarnizon) continue; const kk = u.q + ',' + u.r; if (!k.has(kk)) k.set(kk, new Set()); k.get(kk)!.add(u.ownerId); } return Array.from(k.values()).some(s => s.size > 1); })(),
        };
      },
      select: (id: string) => { selectPlayerUnit(id); return selectedId; },
      moveTo: (q: number, r: number) => beginMoveSelectedUnitTo(q, r),
      setRuch: (ids: string[], v: number) => { for (const u of units) if (ids.includes(u.id)) u.ruchLeft = v; refreshD1bHud(); },
      focus: (q: number, r: number) => { const { x, z } = axialToWorld(q, r, HEX_R); camCtrl.focusAt(x, z, 14); },
    };
`;

const inject: Plugin = {
  name: 'amb-live-probe',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('/src/ui/newGameFlow.ts')) {
      const anchor = 'function buildParams(): NewGameParams {';
      if (!code.includes(anchor)) throw new Error('buildParams anchor missing');
      return code.replace(anchor, '(globalThis as any).__ambBuildParams = () => buildParams();\n' + anchor);
    }
    if (id.endsWith('/src/main.ts')) {
      const anchor = '    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);';
      if (!code.includes(anchor)) throw new Error('main anchor missing');
      return code.replace(anchor, anchor + '\n' + probe);
    }
    return null;
  },
};

export default defineConfig({
  root: process.env.AMB_ROOT,
  plugins: [inject, viteSingleFile()],
  build: { outDir: process.env.AMB_DIST, emptyOutDir: true, minify: false },
});
