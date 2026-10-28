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
      ownerCities: (ownerId: number) => cities.filter(c => c.ownerId === ownerId).map(c => ({ id: c.id, q: c.q, r: c.r, capital: c.id === capitalCityIdForOwner(ownerId) })),
      beginWarCampaign: (ownerId: number, targetId: number) => {
        // The production map can place the two capitals on separate continents.
        // This bounded live fixture asks about a land campaign, so make its map
        // explicitly land-connected before exercising the production turn path.
        for (const hex of Object.values(map.hexes)) {
          hex.terenBazowy = 'laka';
          hex.nakladka = 'brak';
        }
        const relation = getDiploRelation(ownerId, targetId);
        setDiploRelation(ownerId, targetId, { ...relation, status: 'wojna' });
        const capitalId = capitalCityIdForOwner(ownerId);
        const capital = cities.find(c => c.id === capitalId && c.ownerId === ownerId);
        if (!capital) return { error: 'missing-ai-capital', ownerId, targetId, availableOwners: [...new Set(cities.map(c => c.ownerId))] };
        setOwnerTreasury(ownerId, 1000000);
        capital.manpower = 1000000;
        const offer = bestGeneralUnitForOwner(ownerId);
        if (!offer) return { error: 'no-general-offer', ownerId, targetId, capitalId };
        const def = data.units.find(u => u.Jednostka === offer.id);
        capital.surowce = capital.surowce || {};
        for (const key of Object.keys(unitStockCost(def))) capital.surowce[key] = 1000000;
        const campaign = prepareAiGeneralWarCampaign(ownerId);
        return { ownerId, targetId, capitalId, offer, campaign,
          queue: (cityProd.get(capitalId)?.rekrutacja ?? []).map(x => ({ id: x.id, isGeneral: x.isGeneral === true })),
          treasury: ownerTreasury(ownerId), manpower: capital.manpower };
      },
      campaignState: (ownerId: number) => {
        const capitalId = capitalCityIdForOwner(ownerId);
        const campaign = aiGeneralWarCampaignByOwner.get(ownerId) ?? null;
        return { turn, campaign,
          capitalId, queue: (cityProd.get(capitalId)?.rekrutacja ?? []).map(x => ({ id: x.id, isGeneral: x.isGeneral === true })),
          generals: units.filter(u => u.ownerId === ownerId && u.isGeneral === true).map(u => ({ id: u.id, q: u.q, r: u.r })),
          targetCityId: campaign ? capitalCityIdForOwner(campaign.targetOwnerId) : null,
          troopCount: units.filter(u => u.ownerId === ownerId && u.isGeneral !== true).length };
      },
      refreshCampaign: (ownerId: number) => {
        const campaign = prepareAiGeneralWarCampaign(ownerId);
        return { campaign: campaign ?? null, state: (window as any).__generalRuntime.campaignState(ownerId) };
      },
      addMusterStackBeforeSetup: (ownerId: number) => {
        const campaign = aiGeneralWarCampaignByOwner.get(ownerId);
        const capitalId = capitalCityIdForOwner(ownerId);
        const capital = cities.find(c => c.id === capitalId && c.ownerId === ownerId);
        const def = data.units.find(u => u.Jednostka === 'Wojownik');
        if (!campaign || !capital || !def) return { error: 'missing-campaign-capital-or-unit' };
        const probe = { id: 'war-campaign-live-stack-probe', ownerId, typeId: def.Jednostka,
          isGeneral: false,
          category: categoryOf(def.Jednostka, String(def['Rola'] ?? def['Rola (linia)'] ?? ''),
            def['Super-jednostka'] === 'TAK', def['Typ']),
          q: capital.q, r: capital.r,
          ruch: applyRuchSwiataPace(normFieldVal(def['Ruch'], 2), player.ruchSwiataPace ?? 'krotki'),
          ruchLeft: 2, hp: 30, hpMax: 30 } as RuntimeUnit;
        const ids: string[] = [];
        for (let index = 1; index <= 3; index++) {
          const troop = { ...probe, id: 'war-campaign-live-stack-' + index };
          units.push(troop);
          ids.push(troop.id);
        }
        return { ids, start: { q: capital.q, r: capital.r } };
      },
      stackMusterUnitsAtGeneral: (ownerId: number, ids: string[]) => {
        const campaign = aiGeneralWarCampaignByOwner.get(ownerId);
        const general = campaign?.generalUnitId ? units.find(u => u.id === campaign.generalUnitId) : undefined;
        if (!general) return { error: 'missing-physical-general' };
        for (const id of ids) {
          const unit = units.find(u => u.id === id);
          if (!unit) return { error: 'missing-stack-unit', id };
          unit.q = general.q; unit.r = general.r;
        }
        return { start: { q: general.q, r: general.r }, general: { id: general.id, q: general.q, r: general.r } };
      },
      addCampaignStackForRealEndTurn: (ownerId: number) => {
        const campaign = aiGeneralWarCampaignByOwner.get(ownerId);
        const general = campaign?.generalUnitId
          ? units.find(u => u.ownerId === ownerId && u.id === campaign.generalUnitId && u.isGeneral === true)
          : undefined;
        const target = campaign && cities.find(c => c.ownerId === campaign.targetOwnerId
          && c.id === capitalCityIdForOwner(campaign.targetOwnerId));
        const capitalId = capitalCityIdForOwner(ownerId);
        const capital = cities.find(c => c.id === capitalId && c.ownerId === ownerId);
        const def = data.units.find(u => u.Jednostka === 'Wojownik');
        if (!campaign || !general || !target || !capital || !def) return { error: 'missing-campaign-target-or-unit' };
        const probe = { id: 'war-campaign-live-stack-probe', ownerId, typeId: def.Jednostka,
          isGeneral: false,
          category: categoryOf(def.Jednostka, String(def['Rola'] ?? def['Rola (linia)'] ?? ''),
            def['Super-jednostka'] === 'TAK', def['Typ']),
          q: general.q, r: general.r,
          ruch: applyRuchSwiataPace(normFieldVal(def['Ruch'], 2), player.ruchSwiataPace ?? 'krotki'),
          ruchLeft: 2, hp: 30, hpMax: 30 } as RuntimeUnit;
        const blocked = new Set(cities.filter(c => c.ownerId !== ownerId).map(c => String(c.q) + ',' + String(c.r)));
        const reachability = findAiWarLandReachability({ ...probe, q: capital.q, r: capital.r }, map, blocked);
        if (!aiWarTargetHasReachableLandNeighbor(reachability, target)) return { error: 'target-is-not-land-reachable' };
        const start = { q: general.q, r: general.r };
        const ids: string[] = [];
        for (let index = 1; index <= 3; index++) {
          const troop = { ...probe, id: 'war-campaign-live-stack-' + index, q: start.q, r: start.r };
          units.push(troop);
          ids.push(troop.id);
        }
        return {
          ids, start, target: { id: target.id, q: target.q, r: target.r },
          general: { id: general.id, q: general.q, r: general.r },
        };
      },
      runRealEndTurn: () => triggerPlayerEndTurn(),
      currentTurn: () => turn,
      endTurnInProgress: () => endTurnInProgress,
      aiCommandHistory: () => (window as any).__generalAiCommandHistory ?? [],
      positions: (ids: string[]) => ids.map(id => {
        const u = units.find(candidate => candidate.id === id);
        return u ? { id, q: u.q, r: u.r } : null;
      }),
      campaignSaveRoundTrip: (ownerId: number) => {
        const before = aiGeneralWarCampaignByOwner.get(ownerId);
        const saved = aiGeneralCampaignToSave(aiGeneralWarCampaignByOwner);
        const restored = restoreAiGeneralCampaigns(JSON.parse(JSON.stringify(saved)));
        const after = restored.get(ownerId);
        return { ok: !!before && JSON.stringify(before) === JSON.stringify(after), before: before ?? null, after: after ?? null };
      },
    };
`;

const inject: Plugin = {
  name: 'ai-general-war-campaign-live-probe',
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
      const commandAnchor = '                commands = decideAITurn(ownerId, units, cities, map, data, opts);';
      if (!code.includes(commandAnchor)) throw new Error('General probe: AI command anchor missing');
      code = code.replace(commandAnchor, commandAnchor + "\n                const __campaignTurnEvidence = { ownerId, turn, commands: commands.map(command => ({ ...command })), moveResults: [] as unknown[] };\n                ((window as any).__generalAiCommandHistory ??= []).push(__campaignTurnEvidence);\n                (window as any).__generalCurrentAiTurnEvidence = __campaignTurnEvidence;");
      const moveAnchor = '                  if (moveResult.moved) {';
      if (!code.includes(moveAnchor)) throw new Error('General probe: AI movement result anchor missing');
      code = code.replace(moveAnchor, "                  (window as any).__generalCurrentAiTurnEvidence?.moveResults.push({ ownerId, unitId: u.id, command: { ...cmd }, moved: moveResult.moved, path: moveResult.path });\n" + moveAnchor);
      return code.replace(anchor, anchor + '\n' + probe);
    }
    return null;
  },
};

export default defineConfig({
  root: '.',
  plugins: [inject, viteSingleFile()],
  build: { outDir: '/tmp/civ-ai-general-war-campaign-live', emptyOutDir: true, minify: false },
});
