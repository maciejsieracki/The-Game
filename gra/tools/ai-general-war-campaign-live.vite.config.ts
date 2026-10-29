import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

const probe = `
    let __lastRealAttackOrders: Array<{ unitId: string; targetCityId?: string; toQ: number; toR: number; allowFriendlyStack?: boolean }> = [];
    let __lastRealAttackCommands: Array<{ unitId: string; type: string }> = [];
    let __lastRealAiDecision: any = null;
    let __focusAiOwner: number | null = null;
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
      finishRecruitmentByTurn: async () => {
        const beforeTurn = turn;
        triggerPlayerEndTurn();
        const deadline = Date.now() + 120000;
        while (Date.now() < deadline && (turn <= beforeTurn || endTurnInProgress || activeWorldEndTurnPipeline)) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        return { beforeTurn, turn,
          timedOut: turn <= beforeTurn || endTurnInProgress || activeWorldEndTurnPipeline };
      },
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
      prepareSeaCorridor: (ownerId: number, targetId: number) => {
        const capital = cities.find(city => city.id === capitalCityIdForOwner(ownerId) && city.ownerId === ownerId);
        const target = cities.find(city => city.id === capitalCityIdForOwner(targetId) && city.ownerId === targetId);
        if (!capital || !target) return { error: 'missing-capital-or-target' };
        const coords = Object.values(map.hexes).map(hex => hex.coords);
        const start = coords.find(p => p.q >= 2 && p.r >= 2
          && map.hexes[String(p.q + 3) + ',' + String(p.r + 1)]
          && map.hexes[String(p.q + 1) + ',' + String(p.r)]
          && map.hexes[String(p.q + 2) + ',' + String(p.r)]
          && map.hexes[String(p.q + 2) + ',' + String(p.r + 1)]);
        if (!start) return { error: 'no-fixture-corridor-on-map' };
        const water = new Set([
          String(start.q + 1) + ',' + String(start.r),
          String(start.q + 2) + ',' + String(start.r),
        ]);
        const landing = { q: start.q + 2, r: start.r + 1 };
        const goal = { q: start.q + 3, r: start.r + 1 };
        // Deterministic water-only map with one embark/disembark corridor. The chosen path
        // requires existing Seafaring and leaves a land hex next to the city for the attack.
        for (const hex of Object.values(map.hexes)) {
          hex.terenBazowy = 'morze' as typeof hex.terenBazowy;
          hex.nakladka = 'brak';
          if (hex.rzeka) hex.rzeka.obecna = false;
        }
        capital.q = start.q; capital.r = start.r;
        target.q = goal.q; target.r = goal.r;
        map.hexes[String(start.q) + ',' + String(start.r)]!.terenBazowy = 'laka' as typeof map.hexes[string]['terenBazowy'];
        map.hexes[String(goal.q) + ',' + String(goal.r)]!.terenBazowy = 'laka' as typeof map.hexes[string]['terenBazowy'];
        map.hexes[String(landing.q) + ',' + String(landing.r)]!.terenBazowy = 'laka' as typeof map.hexes[string]['terenBazowy'];
        aiResearchDone.get(ownerId)?.add('Żegluga');
        return { start, water: [...water], landing, goal, hasSeafaring: ownerHasSeafaring(ownerId) };
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
      prepareOrganicLandCampaign: (ownerId: number) => {
        __focusAiOwner = ownerId;
        const capital = cities.find(city => city.id === capitalCityIdForOwner(ownerId) && city.ownerId === ownerId);
        const target = cities.find(city => city.id === capitalCityIdForOwner(0) && city.ownerId === 0);
        if (!capital || !target) return { error: 'missing-organic-capital-or-target' };
        // Select a deterministic reachable land target while preserving the generated terrain
        // and all troop coordinates. The test observes the real turn pipeline without moving
        // any fixture unit by hand.
        aiResearchDone.get(ownerId)?.delete('Żegluga');
        const blockedCityHexes = new Set(cities.filter(city => city.id !== target.id)
          .map(city => String(city.q) + ',' + String(city.r)));
        const visited = new Set<string>([String(capital.q) + ',' + String(capital.r)]);
        const reachableLand = [{ q: capital.q, r: capital.r }];
        for (let index = 0; index < reachableLand.length; index++) {
          const current = reachableLand[index]!;
          for (const next of hexNeighborCoords(current.q, current.r)) {
            const nextKey = String(next.q) + ',' + String(next.r);
            const hex = map.hexes[nextKey];
            if (!hex || visited.has(nextKey) || blockedCityHexes.has(nextKey)
                || isWaterTerrain(hex.terenBazowy) || terrainMoveCost(hex) === Infinity) continue;
            visited.add(nextKey);
            reachableLand.push(next);
          }
        }
        const targetHex = reachableLand.filter(p => hexDistance(capital.q, capital.r, p.q, p.r) >= 8)
          .sort((a, b) => hexDistance(capital.q, capital.r, a.q, a.r)
            - hexDistance(capital.q, capital.r, b.q, b.r))[0];
        if (!targetHex) return { error: 'no-organic-land-target-hex' };
        target.q = targetHex.q; target.r = targetHex.r;
        const army = units.filter(unit => unit.ownerId === ownerId && !isCivilianUnit(unit) && !isScoutUnit(unit));
        const before = army.map(unit => ({ id: unit.id, q: unit.q, r: unit.r, movement: unit.ruchLeft }));
        return { ownerId, capital: { id: capital.id, q: capital.q, r: capital.r },
          target: { id: target.id, q: target.q, r: target.r },
          army: before, noSeafaring: !ownerHasSeafaring(ownerId) };
      },
      organicArmySnapshot: (ownerId: number) => units.filter(unit => unit.ownerId === ownerId
        && !isCivilianUnit(unit) && !isScoutUnit(unit)).map(unit => ({
          id: unit.id, q: unit.q, r: unit.r, movement: unit.ruchLeft,
          general: unit.isGeneral === true, inGarrison: unit.inGarnizon === true,
        })),
      removeCampaignGeneralAfterBattle: (ownerId: number) => {
        const campaign = aiGeneralWarCampaignByOwner.get(ownerId);
        const index = units.findIndex(unit => unit.ownerId === ownerId && unit.isGeneral === true
          && (!campaign?.generalUnitId || unit.id === campaign.generalUnitId));
        if (index < 0) return { error: 'campaign-general-not-found', campaign: campaign ?? null };
        const [fallen] = units.splice(index, 1);
        return { removedId: fallen?.id, campaign: campaign ?? null };
      },
      campaignRecruitDiagnostics: (ownerId: number) => {
        const capitalId = capitalCityIdForOwner(ownerId);
        const capital = cities.find(city => city.id === capitalId && city.ownerId === ownerId);
        const offer = bestGeneralUnitForOwner(ownerId);
        const mpMults = civManpowerMultsForOwner(ownerId);
        const manpowerCost = offer
          ? unitManpowerCostForType(offer.id, empireEpochForOwner(ownerId), mpMults.maxMult, mpMults.costMult)
          : null;
        return { offer: bestGeneralUnitForOwner(ownerId), era: empireEpochForOwner(ownerId),
          manpowerCost, empireManpower: empireManpowerCurrent(cities, ownerId, empireEpochForOwner(ownerId), mpMults.maxMult),
          capitalId, capital: capital ? { population: capital.population, manpower: capital.manpower,
            stock: capital.surowce, production: cityProd.get(capital.id) } : null,
          treasury: ownerTreasury(ownerId),
          alive: units.filter(unit => unit.ownerId === ownerId && unit.isGeneral === true).map(unit => unit.id),
          queued: cities.filter(city => city.ownerId === ownerId)
            .flatMap(city => (cityProd.get(city.id)?.rekrutacja ?? []).filter(item => item.isGeneral === true)
              .map(item => ({ cityId: city.id, id: item.id, item }))) };
      },
      fundCampaignRecruitment: (ownerId: number) => {
        const capitalId = capitalCityIdForOwner(ownerId);
        const capital = cities.find(city => city.id === capitalId && city.ownerId === ownerId);
        if (!capital) return { error: 'capital-not-found' };
        capital.manpower = 1000000;
        capital.population = Math.max(capital.population, 500);
        capital.surowce = capital.surowce || {};
        const offer = bestGeneralUnitForOwner(ownerId);
        const definition = offer && data.units.find(unit => unit.Jednostka === offer.id);
        for (const key of Object.keys(unitStockCost(definition))) capital.surowce[key] = 1000000;
        setOwnerTreasury(ownerId, 1000000);
        return { capitalId, offer, manpower: capital.manpower, stock: capital.surowce };
      },
      prepareRealMarchFromCapital: (ownerId: number) => {
        __focusAiOwner = ownerId;
        const capitalId = capitalCityIdForOwner(ownerId);
        const capital = cities.find(city => city.id === capitalId && city.ownerId === ownerId);
        const general = units.find(unit => unit.ownerId === ownerId && unit.isGeneral === true);
        const targetId = capitalCityIdForOwner(0);
        const target = cities.find(city => city.id === targetId && city.ownerId === 0);
        if (!capital || !general || !target) return { error: 'missing-capital-general-or-target', capital: !!capital, general: !!general, target: !!target };
        // The land-muster scenario normalizes the map to grassland. Rebuild the
        // exact two-hex embarkation lane from the earlier production setup so this
        // second scenario measures real sea movement through the production planner.
        const seaHexes = [
          map.hexes[String(capital.q + 1) + ',' + String(capital.r)],
          map.hexes[String(capital.q + 2) + ',' + String(capital.r)],
        ];
        const landing = map.hexes[String(capital.q + 2) + ',' + String(capital.r + 1)];
        if (seaHexes.every(Boolean) && landing) {
          for (const hex of seaHexes) hex!.terenBazowy = 'morze' as typeof map.hexes[string]['terenBazowy'];
          landing.terenBazowy = 'laka' as typeof landing.terenBazowy;
        }
        // Preserve the deterministic embarkation corridor prepared before war onset.
        const startKey = String(capital.q) + ',' + String(capital.r);
        const goalKey = String(target.q) + ',' + String(target.r);
        const queue = [{ q: capital.q, r: capital.r }];
        const parent = new Map<string, string | null>([[startKey, null]]);
        for (let i = 0; i < queue.length && !parent.has(goalKey); i++) {
          const at = queue[i]!;
          for (const [dq, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]) {
            const next = { q: at.q + dq, r: at.r + dr };
            const nextKey = String(next.q) + ',' + String(next.r);
            if (!map.hexes[nextKey] || parent.has(nextKey)) continue;
            parent.set(nextKey, String(at.q) + ',' + String(at.r));
            queue.push(next);
          }
        }
        if (!parent.has(goalKey)) return { error: 'capitals-not-connected-on-map-grid', startKey, goalKey };
        const landRoute: string[] = [];
        for (let key: string | null = goalKey; key !== null; key = parent.get(key) ?? null) landRoute.push(key);
        if (!landRoute.some(key => isWaterTerrain(map.hexes[key]!.terenBazowy)))
          return { error: 'sea-corridor-was-not-preserved', startKey, goalKey };
        const army = units.filter(unit => unit.ownerId === ownerId && !isCivilianUnit(unit) && !isScoutUnit(unit));
        for (const unit of army) {
          unit.q = capital.q;
          unit.r = capital.r;
          unit.ruchLeft = unit.ruch;
        }
        aiGeneralWarCampaignByOwner.set(ownerId, {
          targetOwnerId: 0, stage: 'gathering', generalUnitId: general.id,
          gatherTurnsCompleted: 0,
        });
        return { ownerId, turn, capital: { id: capital.id, q: capital.q, r: capital.r }, routeHexes: landRoute,
          generalId: general.id, armyIds: army.map(unit => unit.id),
          targetCapital: target };
      },
      runRealWorldEndTurn: async (ownerId: number) => {
        const beforeTurn = turn;
        __lastRealAttackOrders = [];
        __lastRealAttackCommands = [];
        __lastRealAiDecision = null;
        (globalThis as any).__lastWarCampaignPlanDiagnostic = null;
        triggerPlayerEndTurn();
        const deadline = Date.now() + 120000;
        while (Date.now() < deadline && (turn <= beforeTurn || endTurnInProgress || activeWorldEndTurnPipeline)) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        const capitalId = capitalCityIdForOwner(ownerId);
        const capital = cities.find(city => city.id === capitalId && city.ownerId === ownerId);
        const targetId = capitalCityIdForOwner(0);
        const target = cities.find(city => city.id === targetId && city.ownerId === 0);
        const army = units.filter(unit => unit.ownerId === ownerId && !isCivilianUnit(unit) && !isScoutUnit(unit));
        return { beforeTurn, turn, timedOut: turn <= beforeTurn || endTurnInProgress || activeWorldEndTurnPipeline,
          campaign: aiGeneralWarCampaignByOwner.get(ownerId) ?? null,
          attackOrders: __lastRealAttackOrders,
          attackCommands: __lastRealAttackCommands,
          aiDecision: __lastRealAiDecision,
          warPlanDiagnostic: (globalThis as any).__lastWarCampaignPlanDiagnostic ?? null,
          capital: capital ? { id: capital.id, q: capital.q, r: capital.r } : null,
          targetCapital: target ? { id: target.id, q: target.q, r: target.r } : null,
          army: army.map(unit => ({ id: unit.id, q: unit.q, r: unit.r, movement: unit.ruchLeft, maxMovement: unit.ruch,
            embarked: unit.embarked === true, onWater: isWaterTerrain(map.hexes[String(unit.q) + ',' + String(unit.r)]?.terenBazowy) })) };
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
    if (id.endsWith('/src/game/ai.ts')) {
      const anchor = '    : [planWarAllInCapital(planned, ctx.targets, nav, warOpts)];';
      if (!code.includes(anchor)) throw new Error('General probe: war planner branch anchor missing');
      return code.replace(anchor, anchor + `\n  (globalThis as any).__lastWarCampaignPlanDiagnostic = {
    playerId, targets: ctx.targets, eligible: eligible.map(unit => ({ id: unit.id, q: unit.q, r: unit.r, ruchLeft: unit.ruchLeft })),
    plans: plans.map(plan => ({ orders: plan.orders, noPath: plan.noPath, held: plan.held })),
  };`);
    }
    if (id.endsWith('/src/main.ts')) {
      const anchor = '    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);';
      if (!code.includes(anchor)) throw new Error('General probe: main anchor missing');
      const call = 'commands = decideAITurn(ownerId, units, cities, map, data, opts);';
      if (!code.includes(call)) throw new Error('General probe: AI turn command anchor missing');
      let withProbe = code.replace(anchor, anchor + '\n' + probe);
      withProbe = withProbe.replace(call, call + `\n                const __campaignTurnEvidence = { ownerId, turn, commands: commands.map(command => ({ ...command })), moveResults: [] as unknown[] };
                ((window as any).__generalAiCommandHistory ??= []).push(__campaignTurnEvidence);
                (window as any).__generalCurrentAiTurnEvidence = __campaignTurnEvidence;
                if (ownerId === __focusAiOwner) {
                  __lastRealAiDecision = {
                    ownerId, stage: opts.aiGeneralWarCampaign?.stage ?? null,
                    campaign: opts.aiGeneralWarCampaign ?? null,
                    units: units.filter(unit => unit.ownerId === ownerId && !isCivilianUnit(unit) && !isScoutUnit(unit))
                      .map(unit => ({ id: unit.id, q: unit.q, r: unit.r, movement: unit.ruchLeft, isGeneral: unit.isGeneral === true })),
                    commands: commands.map(command => ({ ...command })),
                  };
                  if (opts.aiGeneralWarCampaign?.stage === 'attacking') {
                    __lastRealAttackOrders = commands.filter(command => command.type === 'move').map(command => ({
                      unitId: command.unitId, targetCityId: command.targetCityId, toQ: command.toQ, toR: command.toR,
                      allowFriendlyStack: command.allowFriendlyStack,
                    }));
                    __lastRealAttackCommands = commands.filter(command => command.type === 'attack').map(command => ({
                      unitId: command.unitId, type: command.type,
                    }));
                  }
                }`);
      const moveAnchor = '                  if (moveResult.moved) {';
      if (!withProbe.includes(moveAnchor)) throw new Error('General probe: AI movement result anchor missing');
      return withProbe.replace(moveAnchor,
        "                  (window as any).__generalCurrentAiTurnEvidence?.moveResults.push({ ownerId, unitId: u.id, command: { ...cmd }, moved: moveResult.moved, path: moveResult.path });\n" + moveAnchor);
    }
    return null;
  },
};

export default defineConfig({
  root: '.',
  plugins: [inject, viteSingleFile()],
  build: { outDir: '/tmp/civ-ai-general-war-campaign-live', emptyOutDir: true, minify: false },
});
