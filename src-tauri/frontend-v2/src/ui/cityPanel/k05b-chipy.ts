/**
 * K05B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 2): wsparcie wymagań budynku — kopie pinu `edb8fb56`
 * (`gra/src/ui/cityPanel.ts`) z zachowanymi komentarzami; bramka `tools/dom-harness/verify-k05b-copies.mjs`.
 *
 * Teksty i klasy chipów (`W mieście: …`, `Tylko stolica`, `… w magazynie (masz N)`, `Rozbudowa: …`) są w tej kopii
 * (ZADANIE 2 dispatchu, parytet w harnessie `run-k05b-units.mjs`). Reguły gry (spełnienie rozbudowy, prereq miasta,
 * koszt surowcowy, pula państwa, łańcuch technologii) idą przez `k05b-host.ts` (K05B-Z8/Z9); UI ich nie liczy.
 * `missingTechSteps` (pin :8537) jest kopią lokalną, bo wersja w `k05a-fundament.ts` wiąże się z regułami K05A.
 */
import { buildingRequirementChipsHtml, isEmptyDataVal } from './k01a-fundament';
import { findBuildingDef, parentBuildingName } from './k01b-t';
import { techIconHintSpan } from './k02-units';
import {
  CITY_BUILDING_PREREQ,
  WATER_ACCESS_BUILDING_IDS,
  buildingRequiredActiveLabels,
  buildingStockCost,
  cityBuildingPrereqMet,
  empireResourceLabelSatisfied,
  isBuildingSupersededByUpgrade,
  ownerSurowcePoolFor,
  stockResourceLabel,
  techPrereqChain,
} from './k05b-host';
import type { AvailabilityContext, BuildingDef, BuildingReqChip, City, GameData } from './k05b-host';
// pin edb8fb56 gra/src/ui/cityPanel.ts:6821-6828
export function buildingLocationRequirementMet(
  lokalizacja: 'stolica' | 'region' | undefined,
  isCapital: boolean | undefined,
): boolean {
  if (lokalizacja === 'stolica') return isCapital === true;
  if (lokalizacja === 'region') return isCapital === false;
  return true;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6830-6929
/** Warunki budowy z oceną spełnienia (niebieski = OK, czerwony = brak). */
export function buildingRequirementChips(
  def: BuildingDef,
  city: City | undefined,
  data: GameData,
  ctx: AvailabilityContext,
  unlockedTechs: readonly string[],
): BuildingReqChip[] {
  const chips: BuildingReqChip[] = [];
  const techSet = new Set(unlockedTechs);
  const built = ctx.builtBuildingIds ?? [];
  const buildings = data.buildings;
  const pool = city !== undefined
    ? ownerSurowcePoolFor(city)
    : (ctx.empireResourceStock ?? {});

  const tech = (def.techUnlock ?? '').trim();
  if (tech && tech !== '-' && tech !== '—') {
    const steps = missingTechSteps(data, tech, techSet);
    const met = steps.length === 0;
    chips.push({
      label: met ? tech : steps.join(' → '),
      met,
      iconHtml: techIconHintSpan(tech, 14, { inheritColor: true }),
      kind: 'tech',
    });
  }

  const parentId = def.upgradeFrom?.trim();
  if (parentId) {
    const parentName = parentBuildingName(data, parentId) ?? parentId;
    const met = built.includes(parentId)
      || isBuildingSupersededByUpgrade(parentId, built, buildings);
    chips.push({ label: `Rozbudowa: ${parentName}`, met, kind: 'other' });
  }

  const cityPrereq = CITY_BUILDING_PREREQ[def.id];
  if (cityPrereq) {
    const ids = typeof cityPrereq === 'string' ? [cityPrereq] : [...cityPrereq];
    const names = ids.map(id => findBuildingDef(data, id)?.nazwa ?? id);
    const met = cityBuildingPrereqMet(
      cityPrereq, built, buildings, isBuildingSupersededByUpgrade,
    );
    const label = names.length > 1
      ? `W mieście: ${names.join(' lub ')}`
      : `W mieście: ${names[0]}`;
    chips.push({ label, met, kind: 'other' });
  }

  if (WATER_ACCESS_BUILDING_IDS.has(def.id)) {
    chips.push({
      label: 'Wybrzeże lub rzeka przy mieście',
      met: ctx.cityHasCoastOrRiver === true,
      kind: 'other',
    });
  }

  if (def.lokalizacja === 'stolica' || def.lokalizacja === 'region') {
    chips.push({
      label: def.lokalizacja === 'stolica' ? 'Tylko stolica' : 'Tylko poza stolicą',
      met: buildingLocationRequirementMet(def.lokalizacja, ctx.isCapital),
      kind: 'other',
    });
  }

  const stockCost = buildingStockCost(def);
  for (const [k, need] of Object.entries(stockCost)) {
    const have = pool[k] ?? 0;
    chips.push({
      label: `${need} ${stockResourceLabel(k)} w magazynie (masz ${have})`,
      met: have >= need,
      kind: 'stock',
    });
  }

  const LABEL_STOCK_KEY: Record<string, string> = {
    Drewno: 'drewno', Kamień: 'kamien', Glina: 'glina', Ruda: 'ruda',
    Żelazo: 'zelazo', Stal: 'stal', Brąz: 'braz', Sól: 'sol', Cegła: 'cegla',
    Ceramika: 'ceramika', Złoto: 'zloto', Koń: 'kon',
  };
  for (const label of buildingRequiredActiveLabels(def)) {
    const asciiKey = LABEL_STOCK_KEY[label];
    const have = asciiKey ? (pool[asciiKey] ?? 0) : 0;
    const met = empireResourceLabelSatisfied(
      label, undefined, ctx.empireBuiltIds ?? built, pool, def.id,
    );
    chips.push({
      label: `${label} w magazynie państwa (masz ${have})`,
      met,
      kind: 'stock',
    });
  }

  const accessReq = (def.wymagania && !isEmptyDataVal(def.wymagania)) ? String(def.wymagania) : '';
  if (accessReq && chips.length === 0) {
    chips.push({ label: accessReq, met: false, kind: 'other' });
  }

  return chips;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8537-8540
export function missingTechSteps(data: GameData, techName: string, unlocked: ReadonlySet<string>): string[] {
  const chain = techPrereqChain(data, techName);
  return chain.filter(t => !unlocked.has(t));
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6609-6633
/**
 * TEMAT #6 / SUROW-CIV-01: chip(y) kosztu surowcowego budynku (koszt_surowce w
 * buildings.json, np. cegła/ceramika) obok kosztów Pracy/Pieniądza — czerwony gdy
 * pula PAŃSTWA ownera (suma City.surowce po wszystkich miastach) nie starcza.
 * Pusty string gdy budynek nie ma kosztu surowcowego.
 */
export function buildingStockCostChipsHtml(def: BuildingDef, city: City | undefined): string {
  const cost = buildingStockCost(def);
  const keys = Object.keys(cost);
  if (keys.length === 0) return '';
  const pool = city !== undefined ? ownerSurowcePoolFor(city) : undefined;
  const chips: BuildingReqChip[] = keys.map(k => {
    const need = cost[k]!;
    const have = pool?.[k] ?? 0;
    const met = pool !== undefined && have >= need;
    return {
      label: pool !== undefined
        ? `${need} ${stockResourceLabel(k)} (masz ${have})`
        : `${need} ${stockResourceLabel(k)}`,
      met,
      kind: 'stock' as const,
    };
  });
  return buildingRequirementChipsHtml(chips);
}

