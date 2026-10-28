import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

const probe = `
    const __generalSnapshot = (cityId: string, itemId: string) => {
      const city = cities.find(c => c.id === cityId)!;
      return {
        treasury: ownerTreasury(0), manpower: empireManpowerCurrent(cities, 0, empireEpochForOwner(0), civManpowerMultsForOwner(0).maxMult),
        stock: ownerResourceStockAll(cities, 0), population: city.population,
        queue: (cityProd.get(cityId)?.rekrutacja ?? []).map(x => ({ id: x.id, cost: x.koszt, isGeneral: x.isGeneral === true })),
        generalCount: units.filter(u => u.ownerId === 0 && u.isGeneral === true).length,
        general: units.find(u => u.ownerId === 0 && u.isGeneral === true) || null,
        unitIds: units.filter(u => u.ownerId === 0).map(u => u.id),
        nonGeneralUnitIds: units.filter(u => u.ownerId === 0 && u.isGeneral !== true).map(u => u.id),
        marches: Object.fromEntries(plannedMarches), itemId,
      };
    };
    (window as any).__generalRuntime = {
      ready: true,
      start: (seed: number) => {
        const params = Object.assign({}, (globalThis as any).__generalBuildParams(), {
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
      prepare: () => {
        const capitalId = capitalCityIdForOwner(0);
        const capital = cities.find(c => c.id === capitalId)!;
        const offer = generalRecruitmentOfferForCity(capital.id);
        if (!offer?.item) return { error: 'no-general-offer', capitalId, offer };
        setOwnerTreasury(0, 1000000);
        for (const c of cities.filter(c => c.ownerId === 0)) {
          c.manpower = 1000000;
          c.population = Math.max(c.population, 500);
          c.surowce = c.surowce || {};
          for (const key of Object.keys(unitStockCost(data.units.find(u => u.Jednostka === offer.item!.id)))) c.surowce[key] = 1000000;
        }
        return { capitalId, offer, before: __generalSnapshot(capitalId, offer.item.id) };
      },
      addNonCapital: (capitalId: string) => {
        const c = cities.find(x => x.id === capitalId)!;
        const fake = { ...c, id: 'general-test-colony', name: 'General Test Colony', q: c.q + 1, manpower: 0, surowce: {} };
        cities.push(fake);
        cityProd.set(fake.id, { kolejka: [], postep: 0 });
        return fake.id;
      },
      purchase: (cityId: string, itemId: string, cost: number) => purchaseRecruitmentUnit(cityId, itemId, cost, 0, 1, { isGeneral: true }),
      snapshot: __generalSnapshot,
      finishRecruitmentByTurn: () => triggerPlayerEndTurn(),
      buyOrdinary: (cityId: string, itemId: string) => {
        const item = unitProductionItem(itemId, data, civBonusyForOwnerId(0), player.kosztJednostekPace ?? 'niski', 0, _menuDifficulty);
        if (!item) return { accepted: false, reason: 'no-unit-offer' };
        setOwnerTreasury(0, 1000000);
        const city = cities.find(c => c.id === cityId)!;
        city.manpower = 1000000;
        city.population = Math.max(city.population, 500);
        for (const key of Object.keys(unitStockCost(data.units.find(u => u.Jednostka === itemId)))) city.surowce[key] = 1000000;
        const accepted = purchaseRecruitmentUnit(cityId, itemId, item.koszt, 0);
        const prod = cityProd.get(cityId);
        return { accepted, cost: item.koszt, queued: prod?.rekrutacja?.length ?? 0 };
      },
      spawnRecruitThroughRuntime: (cityId: string, generalQ: number, generalR: number) => {
        const city = cities.find(c => c.id === cityId)!;
        const general = units.find(u => u.ownerId === city.ownerId && u.isGeneral === true);
        if (!general) return null;
        let target = { q: generalQ, r: generalR };
        if (!canOccupyHexForUnit(general, target.q, target.r)) {
          const nearby = Object.values(map.hexes).map(h => h.coords)
            .filter(p => hexDistance(city.q, city.r, p.q, p.r) >= 2 && hexDistance(city.q, city.r, p.q, p.r) <= 4)
            .find(p => canOccupyHexForUnit(general, p.q, p.r));
          if (nearby) target = { q: nearby.q, r: nearby.r };
        }
        general.q = target.q;
        general.r = target.r;
        const def = data.units.find(u => u.Jednostka === 'Taran') ?? data.units.find(u => u.Jednostka === general.typeId);
        if (!def) return null;
        const recruited = {
          id: 'runtime-recruit-follow-test', ownerId: city.ownerId, typeId: def.Jednostka,
          isGeneral: false, category: categoryOf(def.Jednostka, String(def['Rola'] ?? def['Rola (linia)'] ?? ''), def['Super-jednostka'] === 'TAK', def['Typ']),
          q: city.q, r: city.r, ruch: applyRuchSwiataPace(normFieldVal(def['Ruch'], 2), player.ruchSwiataPace ?? 'krotki'),
          ruchLeft: 0,
        } as RuntimeUnit;
        units.push(recruited);
        afterPlayerUnitSpawned(recruited.id);
        const dest = plannedMarches.get(recruited.id);
        return { recruited, general: { id: general.id, q: general.q, r: general.r }, dest: dest ?? null };
      },
    };
`;

const inject: Plugin = {
  name: 'generals-purchase-runtime-probe',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('/src/ui/newGameFlow.ts')) {
      const anchor = 'function buildParams(): NewGameParams {';
      if (!code.includes(anchor)) throw new Error('General probe: buildParams anchor missing');
      return code.replace(anchor, '(globalThis as any).__generalBuildParams = () => buildParams();\n' + anchor);
    }
    if (id.endsWith('/src/main.ts')) {
      const anchor = '    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);';
      if (!code.includes(anchor)) throw new Error('General probe: main anchor missing');
      return code.replace(anchor, anchor + '\n' + probe);
    }
    return null;
  },
};

export default defineConfig({
  root: '.',
  plugins: [inject, viteSingleFile()],
  build: { outDir: '/tmp/civ-general-purchase-runtime', emptyOutDir: true, minify: false },
});
