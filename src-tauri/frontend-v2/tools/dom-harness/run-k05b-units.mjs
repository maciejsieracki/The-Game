#!/usr/bin/env node
/**
 * run-k05b-units.mjs — harness DOM porównania jednostek K05B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 2):
 * port (`src/ui/cityPanel/k05b-podzial.ts`, `k05b-widgety.ts`, `k05b-karty.ts`, `k05b-jednostki.ts`, `k05b-chipy.ts`,
 * `k05b-host.ts`) vs pin web `edb8fb56` (`gra/src/ui/cityPanel.ts`, jednostki wyciągane PO NAZWIE z tekstu pinu).
 *
 * Obie strony dostają TEN SAM fixture wejść (host: cfg, reguły `rules`, readPodzialHandlu, isMeCity, rerender,
 * openEntityCard, stockResourceLabel, …) i TE SAME prymitywy UI z portu (`el`, `statChipBrand`, `appendDetailGrid`,
 * `buildingIconHtml`, `renderEntityCard` (atrapa renderera), …; ich zgodność jest w harnessach K01A/K01B/K02/K03/K04),
 * więc różnica wyniku pochodzi wyłącznie z ciał jednostek i z wiring-u hosta. Pin: tekst jednostki + pin-owe zależności
 * (`appendIndywidualneToggle`, `formatResourceUpkeepSummary`, `daninaLabelForCity`, `buildingRequirementChips`,
 * `buildingStockCostChipsHtml`, `missingTechSteps`, stałe z `game/cities.ts`). Port: `setK05bHost(fixture)` + adaptery.
 *
 * Porównywane: outerHTML wyniku, zwracane wartości i sekwencja wywołań hosta/fixture (cfg, rerender, openEntityCard,
 * appendBuildActionButtons, …) po symulowanych zdarzeniach (`input` na suwakach, `click` na przyciskach).
 * Wektory: 4 warianty fixture (v=0..3) × sceny. Wektory trywialne (pusty wynik / THROW) = błąd harnessu.
 *
 * Mutacje portu: zmienna środowiskowa K05B_MUTANT='{"file":"k05b-karty.ts","from":"...","to":"..."}' podmienia
 * dokładnie jedno wystąpienie `from` w pliku portu (ładowanie przez plugin esbuild, bez zmian na dysku).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):  node tools/dom-harness/run-k05b-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> 0 różnic; 1 <=> >=1 różnica lub wektor trywialny; 2 <=> błąd harnessu.
 */
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { bundle } from './build.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/run-k05b-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');
const PIN = resolve(PIN_DIR);
const pinLines = readFileSync(join(PIN, 'gra/src/ui/cityPanel.ts'), 'utf8').split('\n');
const citiesLines = readFileSync(join(PIN, 'gra/src/game/cities.ts'), 'utf8').split('\n');
const PIN_UI_PARAMS = JSON.parse(readFileSync(join(PIN, 'gra/data/ui-params.json'), 'utf8'));
const MUT = process.env.K05B_MUTANT ? JSON.parse(process.env.K05B_MUTANT) : null;
/** Technologia testowa (wiersz katalogu atrapy + prereq w fixture): uruchamia link „Pełna karta technologii”. */
const PROBE_TECH = 'Rolnictwo';

/** Blok najwyższego poziomu z pinu (function → do `}`; const → do `;`), deklaracja jako `export`. */
function extractTop(name, lines = pinLines) {
  const re = new RegExp(`^(export )?(function|const) ${name}\\b`);
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) throw new Error(`pin: brak deklaracji ${name}`);
  let j = i;
  if (/^(export )?const /.test(lines[i]) && lines[i].trimEnd().endsWith(';')) {
    j = i;
  } else {
    while (lines[j] !== '}') j++;
  }
  return lines.slice(i, j + 1).join('\n').replace(/^(export )?(function|const) /m, (_m, _e, kw) => `export ${kw} `);
}
const daninaLines = readFileSync(join(PIN, 'gra/src/game/danina-nazwa.ts'), 'utf8').split('\n');

/** Stałe pinu z `game/cities.ts` (bez logiki): tekst linii deklaracji. */
function extractCityConst(name, line) {
  const t = citiesLines[line - 1];
  if (!new RegExp(`^export const ${name} = \\d+;`).test(t)) throw new Error(`pin cities.ts:${line} != ${name}`);
  return t.replace(/^export /, 'export ');
}

/** Jednostki K05B (pin-owe ciała, partie 1-3) + pin-owe zależności, które w porcie są adapterami/dopiskami. */
const PIN_UNITS = [
  // partia 1
  'renderEkonomiaStrip', 'appendPodzialHandlu', 'appendCitySkarbiecBalance', 'renderPodzialHandlu', 'buildTopBarZlotoDetailCard',
  'renderSplitPane', 'appendGarrisonUnitChip', 'improvementRangeRow',
  // partia 2
  'appendBuildingRequirementsBlock', 'buildBuildingInfocard', 'appendTechDetailBlock', 'ensureEntityCardBuildingStyles',
  'buildBuildingDetailCardViaEntityCard', 'buildBuildingDetailCard', '_legacyBuildBuildingDetailCard', 'buildBuildingBuildTabDetailCard',
  // partia 3
  '_legacyBuildUnitDetailCard', 'buildRecruitTabDetailCard', 'buildUpgradeBonusDetailCard',
  // wsparcie (ZADANIE 2: teksty i klasy chipów)
  'buildingLocationRequirementMet', 'buildingRequirementChips', 'missingTechSteps', 'buildingStockCostChipsHtml',
  // adaptery sygnatur (K05B-Z7)
  'daninaLabelForCity', 'appendIndywidualneToggle', 'formatResourceUpkeepSummary',
];

const PORT_ABS = (f) => join(CITY, f);
/** Reguły/pomocniki z hosta (K05B-Z8/Z9): w sondzie pinu — fixture (ta sama wartość co po stronie portu). */
const HOST_RULE_NAMES = [
  'etaTurns', 'formatManpower', 'itemCost', 'unitManpowerCost', 'civManpowerMaxMult', 'buildingWorkCost',
  'mnoznikRoleForBuildingId', 'cumulativeMnoznikForBuildingId', 'buildingStructuralDefenseBonusLine', 'upgradeChainSteps',
  'upgradeCompositionLines', 'buildingStockCost', 'buildingRequiredActiveLabels', 'empireResourceLabelSatisfied',
  'isBuildingSupersededByUpgrade', 'cityBuildingPrereqMet', 'buildingUiDisplayLevel', 'productionCtxForCity',
  'ownerSurowcePoolFor', 'getTechDef', 'techPrereqChain', 'naukaCostSuffix', 'unitResourceUpkeep', 'getProd',
  'appendBuildActionButtons',
];

const probeSrc = [
  `import { el, appendDetailSection, gridDetailRow, appendDetailAlgo } from ${JSON.stringify(PORT_ABS('k01b-dom.ts'))};`,
  `import { appendDetailGrid, appendDetailFormula, appendDetailGridIn, beginBuildingDetailTile } from ${JSON.stringify(PORT_ABS('k03-detail.ts'))};`,
  `import { estimateHandelChips, plonyChipRowHtml } from ${JSON.stringify(PORT_ABS('k01b-f.ts'))};`,
  `import { formatBuildingUpkeepRowHtml, formatBuildingUpkeepGridValue } from ${JSON.stringify(PORT_ABS('k01b-f.ts'))};`,
  `import { buildingBonusChipsHtml, buildingUpkeepDisplay, formatBuildingYieldDetailValue, formatBuildingYieldScaleRow } from ${JSON.stringify(PORT_ABS('k01b-r.ts'))};`,
  `import { YIELD_BRAND, buildingIconHtml, parentBuildingName, findBuildingDef } from ${JSON.stringify(PORT_ABS('k01b-t.ts'))};`,
  // Reguły K01B (port wstrzykiwany jak u kontrolera): przekazują do fixture wariantu (`globalThis.__K05B_K01B`).
  `import { ustawRegulyKontrolera as setK01bRules } from ${JSON.stringify(PORT_ABS('k01b-reguly.ts'))};`,
  `setK01bRules(new Proxy({}, { get: (_t, k) => (...a) => globalThis.__K05B_K01B[k](...a) }));`,
  `import { statChipBrand, signed, HANDEL_ZAMOZNOSC_LABEL, HANDEL_KORUPCJA_PCT_PLACEHOLDER, cityPanelChipIconWrap, BUILDING_REQ_SECTION_LABELS, BUILDING_UPKEEP_ZERO_LABEL, epochLabelNum, tury, yieldBrandIconHtml, buildingRequirementChipsHtml, isEmptyDataVal } from ${JSON.stringify(PORT_ABS('k01a-fundament.ts'))};`,
  `import { ENTITY_CARD_BUILDING_STYLE_ID } from ${JSON.stringify(PORT_ABS('k05a-fundament.ts'))};`,
  `import { appendBuildingRequirementChipSections as appendBuildingRequirementChipSectionsK02, fillIconElement, makeBuildingThumb as makeBuildingThumbK02, techIconHintSpan } from ${JSON.stringify(PORT_ABS('k02-units.ts'))};`,
  `import { playerFacingNote, unitExtraField } from ${JSON.stringify(PORT_ABS('k03-model.ts'))};`,
  `import { unitInfographicMedallionHtml } from ${JSON.stringify(join(CITY, '..', 'unitInfographic.ts'))};`,
  `import { resourceTextClass } from ${JSON.stringify(join(CITY, '..', 'resourceColors.ts'))};`,
  `import { buildingAdapter as buildingAdapterDto } from ${JSON.stringify(join(CITY, '..', 'entityCards', 'buildingAdapter.ts'))};`,
  `import { technologyIdFromName, resolveTechnologyRow } from ${JSON.stringify(join(CITY, '..', 'entityCards', 'registry.ts'))};`,
  `import { ENTITY_CARD_CSS, renderEntityCard } from ${JSON.stringify(join(CITY, '..', 'entityCards', 'renderer'))};`,
  // Wejścia hosta (K05B-Z1): ten sam fixture co po stronie portu.
  // Leniwy dostęp do fixture (ustawiany per wariant po załadowaniu modułu sondy).
  `const F = new Proxy({}, { get: (_t, k) => globalThis.__K05B_FIX[k] });`,
  `const cfg = new Proxy({}, { get: (_t, k) => F.cfg[k] });`,
  `const rerender = () => F.rerender();`,
  `const readPodzialHandlu = (c, d) => F.readPodzialHandlu(c, d);`,
  `const isMeCity = (o) => F.isMeCity(o);`,
  `const adjustHandelSplit = (s, k, v) => F.adjustHandelSplit(s, k, v);`,
  `const freshWealthState = () => F.freshWealthState();`,
  // Pin danina-nazwa.ts (stałe etykiety, bez logiki): definicje pinu, nie fixture.
  ...['daninaLabel', 'daninaLabelGenitive'].map((n) => extractTop(n, daninaLines)),
  `const stockResourceLabel = (k) => F.stockResourceLabel(k);`,
  `const openEntityCard = (...a) => F.openEntityCard(...a);`,
  ...HOST_RULE_NAMES.map((n) => `const ${n} = (...a) => F.rules.${n}(...a);`),
  `const CITY_BUILDING_PREREQ = new Proxy({}, { get: (_t, k) => (typeof k === 'string' ? F.rules.cityBuildingPrereqOf(k) : undefined) });`,
  `const WATER_ACCESS_BUILDING_IDS = { has: (id) => F.rules.isWaterAccessBuilding(id) };`,
  // Atrapa renderera (K05B harness): ta sama dla obu stron; wywołania openEntityCard idą do fixture.
  `const appendBuildingRequirementChipSections = (p, c) => appendBuildingRequirementChipSectionsK02(p, c, buildingRequirementChipsHtml);`,
  `const makeBuildingThumb = (def) => makeBuildingThumbK02(buildingIconHtml(def));`,
  `const buildingAdapter = (def, ctx) => buildingAdapterDto(def, ctx);`,
  extractCityConst('HANDEL_PCT_STEP', 578),
  extractCityConst('MAX_PROCENT_NAUKA', 581),
  ...PIN_UNITS.map((n) => extractTop(n)),
  '',
].join('\n');

/** Fixture wejść: deterministyczny, zależny od wariantu v. Zwraca obiekt hosta (K05bHost) i log wywołań. */
/** Reguły K01B (port K01B-Z3, wstrzykiwany): ta sama wartość po obu stronach dla danego wariantu v. */
function mkK01b(v) {
  return {
    etaTurns: (k, p, pr) => (pr > 0 ? Math.ceil((k - p) / pr) : null),
    buildingEffectAtLevel: (baza, przyrost, level) => baza + przyrost * (level - 1),
    stockResourceLabel: (k) => `K01B${v}:${k}`,
    buildingUpkeep: (def, level) => (def.id === 'farm_x' ? 2 : 0) + level + v,
    buildingResourceUpkeep: (def) => (def.id === 'farm_x' ? { drewno: 1 + v } : {}),
    addResourceCosts: (target, add) => {
      for (const k of Object.keys(add)) target[k] = (target[k] ?? 0) + add[k];
    },
    mnoznikRoleForBuildingId: (id) => (id.startsWith('farm') ? 'pancerz' : null),
    cumulativeMnoznikForBuildingId: (id, bs) => (bs ? bs.length : 0) + v,
    buildingStructuralDefenseBonusPercent: (id) => (id === 'wall' ? 2 + v : null),
    rationGrowthPercent: (level) => (level === 'normalny' ? 2 : 1) + v,
    rationFoodCostPerPop: () => 1 + v,
    growthGainPerTurnSlots: (pop, pct) => Math.round(pop * pct / 100) + v,
    turnsUntilNextCitizen: (u, gain) => (gain > 0 ? Math.ceil((1 - u) / gain) : null),
  };
}

function mkFix(v) {
  const log = [];
  const cfg = {
    getTreasury: (o) => (v === 2 ? undefined : 100 + o),
    getCityMoneySnap: (c) =>
      v === 1
        ? undefined
        : {
            pieniadzBrutto: 10 + v,
            wealthMnoznik: 1.25,
            handelZeSzlakow: 2,
            doSkarbca: v === 3 ? -4 : 6,
            utrzymanieBudynkow: 3,
            utrzymanieSurowcowBudynkow: v === 0 ? undefined : { drewno: 2, kamien: c % 2 ? 1 : 0 },
            utrzymanieGarnizonu: 0,
            nauka: 4,
          },
    getPodzialHandluOverride: (c) => (v % 2 === 0 ? true : c % 2 === 1),
    onPodzialHandluChange: (c, s) => log.push(['split', c, { ...s }]),
    onPodzialHandluOverrideToggle: (c) => log.push(['override', c]),
    onLeaveGarrison: (u) => log.push(['leave', u]),
    getUnlockedTechs: () => (v === 3 ? undefined : ['Rolnictwo', 'Pismo']),
    getBuildingCostPace: () => (v === 2 ? undefined : ['niski', 'wysoki', 'normalny', 'niski'][v]),
    getDifficulty: () => (v === 1 ? undefined : ['normal', 'trudny', 'latwy', 'normal'][v]),
    getEpoch: () => (v === 1 || v === 2 ? undefined : 2 + v),
    getCivBonusy: () => (v === 0 ? undefined : [{ k: 1 }, { k: 2 }].slice(0, v)),
    getManpowerSnapshot: (c) =>
      v === 1
        ? undefined
        : { manpowerBiezacy: 40 + c, manpowerMax: 120, kosztJednostki: 7 + v, epoka: 2 + v },
  };
  const split = (c) => ({ procentPieniadz: 50 + v, procentNauka: 30, procentLuksus: 20 - v + (c % 3) });
  const pool = { drewno: v === 2 ? 3 : 4 + v, kamien: v % 2 ? 0 : 3, zelazo: 1, glina: v };
  const rules = {
    etaTurns: (k, p, pr) => (pr > 0 ? Math.ceil((k - p) / pr) : null),
    formatManpower: (n) => `${n}·M${v}`,
    itemCost: (kind, id, data, lvl) => 10 + lvl * 3 + v + id.length + data.buildings.length,
    unitManpowerCost: (epoka, maxMult = 1) => Math.round(epoka * 2 * maxMult) + v,
    civManpowerMaxMult: (b) => 1 + (b ? b.length : 0) * 0.5 + v * 0.1,
    buildingWorkCost: (base, civ, pace, owner, diff) => base + (pace ? pace.length : 0) + (diff ? diff.length : 0) + owner + (civ ? civ.length : 0),
    mnoznikRoleForBuildingId: (id) => (id.startsWith('farm') ? 'pancerz' : id === 'port' ? 'parametry' : null),
    cumulativeMnoznikForBuildingId: (id, bs) => (bs ? bs.length * 5 : 0) + v,
    buildingStructuralDefenseBonusLine: (id) => (id === 'wall' ? `+${2 + v}% obrony` : null),
    // Łańcuch rozbudowy: od korzenia do `id` po polu upgradeFrom (jak w silniku: poprzednik musi być w katalogu).
    upgradeChainSteps: (id, bs) => {
      const chain = [];
      let cur = bs.find((b) => b.id === id);
      while (cur) {
        chain.unshift(cur);
        cur = cur.upgradeFrom ? bs.find((b) => b.id === cur.upgradeFrom) : undefined;
      }
      return chain;
    },
    upgradeCompositionLines: (id) => [`Linia ${id} v${v}`, 'Drugi wiersz'],
    buildingStockCost: (def) => (!def || !def.koszt_surowce ? {} : { ...def.koszt_surowce }),
    buildingRequiredActiveLabels: (def) => (def.id === 'farm_x' ? ['Węgiel', 'Miedź'] : []),
    empireResourceLabelSatisfied: (label, _act, built, stock) => (stock ? (stock.zelazo ?? 0) >= 1 + v : false) || label.length % 2 === 0,
    isBuildingSupersededByUpgrade: (id, built, bs) => bs.some((b) => b.upgradeFrom === id && built.includes(b.id)),
    cityBuildingPrereqMet: (prereq, built, bs, sup) => {
      if (!prereq) return true;
      const ids = typeof prereq === 'string' ? [prereq] : prereq;
      return ids.some((id) => built.includes(id) || sup(id, built, bs));
    },
    cityBuildingPrereqOf: (id) => (id === 'farm_x' ? ['koszary', 'ratusz'] : id === 'port' ? 'tartak' : id === 'wall' ? 'mur_bazowy' : undefined),
    isWaterAccessBuilding: (id) => id === 'port' || id === 'port_wielki',
    buildingUiDisplayLevel: (def, city) => (city ? 1 + v : 1),
    productionCtxForCity: (city) => ({
      epoch: 2 + v,
      // v=2: rozbudowa farmy spełniona przez budynek następczy (superseded), a nie przez `farm_0` wprost.
      builtBuildingIds: v === 0 ? ['koszary', 'farm_0'] : v === 2 ? ['koszary', 'farm_x'] : ['koszary', 'ratusz'],
      productionQueue: [],
      buildingLevel: 1,
      civBonusy: [],
      civUnitNacja: null,
      placedImprovements: null,
      hasKopalniaNaZlozuZelaza: false,
      aliveUnitTypeNames: undefined,
      buildingCostPace: 'niski',
      kosztJednostekPace: 'niski',
      ownerId: city.ownerId,
      difficulty: 'normal',
      activeResourceLabels: [],
      empireActiveResourceLabels: undefined,
      empireBuiltIds: v === 1 ? ['farm_0'] : ['koszary', 'farm_0', 'port'],
      // Pula państwa z kontekstu różni się od puli miasta (rozróżnia gałęzie `city !== undefined` w chipach).
      empireResourceStock: { ...pool, drewno: 1 },
      cityHasCoastOrRiver: v % 2 === 0,
      isCapital: v !== 1,
    }),
    ownerSurowcePoolFor: () => ({ ...pool }),
    getTechDef: (data, name) =>
      name === 'Rolnictwo'
        ? {
            Epoka: 'Starożytność',
            Poziom: v === 2 ? undefined : 1,
            'Koszt nauki': 20,
            'Wymaga (prereq)': v === 1 ? undefined : 'Pismo',
            'wymagany budynek': 'farm_x',
            'Dostęp do surowca.': 'Drewno',
            'Odblokowuje budynek': v === 3 ? '' : 'farm_x',
            'Odblokowuje surowiec.': 'Kamień',
            'Odblokowuje ulepszenie terenu': 'Pole',
            Uwagi: 'Uwaga do techu',
          }
        : name === 'Pismo'
          ? { Epoka: 'Antyk' }
          : undefined,
    techPrereqChain: (data, name) => (v === 0 ? [name] : ['Pismo', name]),
    naukaCostSuffix: () => ` (v${v})`,
    unitResourceUpkeep: (u) => (u.Surowiec ? { zelazo: 1 + v } : {}),
    getProd: () => ({ rekrutacja: v === 1 ? undefined : v === 3 ? [] : [{}, {}], kolejka: [] }),
    appendBuildActionButtons: (btnWrap, city, item, skarb, label, upgrade, opts) => {
      log.push(['btns', city.id, item.id, skarb, label, !!upgrade, opts ? JSON.stringify(opts) : '']);
      const b = document.createElement('button');
      b.textContent = `${label}${upgrade ? '+' : ''} ${item.koszt}/${skarb}`;
      b.addEventListener('click', () => log.push(['buildBtn', item.id]));
      btnWrap.appendChild(b);
    },
  };
  return {
    log,
    host: {
      cfg,
      readPodzialHandlu: (city) => split(city.id),
      isMeCity: (o) => o === 0,
      adjustHandelSplit: (s, key, value) => ({ ...s, [key]: value }),
      freshWealthState: () => ({ poziom: v }),
      stockResourceLabel: (k) => `L${v}:${k}`,
      rerender: () => log.push(['rr']),
      openEntityCard: (kind, id, opts) => log.push(['card', kind, id, opts && opts.mode]),
      rules,
    },
  };
}

const CITY_ = (v) => ({ id: 3 + v, ownerId: v % 2 ? 0 : 1, wealthState: v === 1 ? undefined : { poziom: 2 + v } });
const VIEW = (v) => ({
  praca: 5, pieniadz: 7 + v, nauka: 3, kultura: 2, zywnoscNetto: v === 3 ? -2 : 4, zywnoscBrutto: 9, kosztRacji: 3,
  bilansLokalny: 1, poziomRacji: 'normalny', wzrostProcent: 2, growthBreakdown: {}, wzrostUlamkowy: 0.5,
  maSpichlerz: true, maAkwedukt: false, popCapBezAkweduktu: 5, popCapSpichlerz: 8, popCapZAkweduktem: 12,
  popCapAktualny: 8, atPopCap: false, citizenUpkeep: {},
});
const EMP = (v) => ({
  zloto: v === 0 ? undefined : 500 + v, zlotoRate: 4, bogactwoWplywyBrutto: 30, bogactwoHandel: 8,
  bogactwoUtrzymanieBudynkow: 5, bogactwoUtrzymanieSurowcowBudynkow: { drewno: 1 }, bogactwoUtrzymanieJednostek: 2,
  bogactwoRate: v === 2 ? undefined : 9,
});
const GARRISON = [
  { id: 'u1', nazwa: 'Łucznik', health: 45, maxHealth: 100, inGarnizon: true },
  { id: 'u2', nazwa: 'Miecznik', health: 80, maxHealth: 100, inGarnizon: false },
  { id: 'u3', nazwa: 'Wóz', health: undefined, maxHealth: undefined },
];

/** Budynki i jednostki fixture (partia 2-3, wsparcie): pełne i skrajne przypadki pól czytanych przez jednostki. */
const B_FULL = (v) => ({
  id: 'farm_x', nazwa: 'Farma', kategoria: 'Żywność', epokaWejscia: 2, wielokrotny: v === 1, maksPoziom: 3,
  baza: { praca: 2, zadowolenie: 1 }, przyrost: { praca: 1, pieniadz: v === 2 ? 0 : 2 }, przyrostKosztu: 5, przyrostUtrzymania: 1,
  nazwyPoziomow: ['Mała', 'Średnia', 'Duża'], techUnlock: 'Rolnictwo', upgradeFrom: v === 3 ? undefined : 'farm_0',
  lokalizacja: v === 2 ? 'stolica' : 'region', wymagania: v === 0 ? 'Wymaga: góry' : null,
  koszt_surowce: { drewno: 3, kamien: 1 },
});
/** Poprzednik rozbudowy farmy (łańcuch farm_0 → farm_x w katalogu fixture). */
const B_FARM0 = {
  id: 'farm_0', nazwa: 'Zagroda', kategoria: 'Żywność', epokaWejscia: 1, maksPoziom: 1, baza: { praca: 1 }, przyrost: {},
  nazwyPoziomow: [], techUnlock: undefined, upgradeFrom: undefined, wymagania: null,
};
const B_WALL = (v) => ({
  id: 'wall', nazwa: 'Mur', epokaWejscia: 1, maksPoziom: 1, baza: {}, przyrost: {}, nazwyPoziomow: [],
  techUnlock: v === 1 ? '-' : undefined, upgradeFrom: undefined, wymagania: v === 2 ? 'Brzeg' : null,
});
const B_PORT = (v) => ({
  id: 'port', nazwa: 'Port', kategoria: 'Handel', epokaWejscia: 3, maksPoziom: 2, baza: { pieniadz: 3 }, przyrost: { pieniadz: 1 },
  nazwyPoziomow: ['Port', 'Port wielki'], techUnlock: 'Żegluga', upgradeFrom: 'port_0', lokalizacja: 'region', koszt_surowce: v === 0 ? undefined : { drewno: 2 },
});
const UNIT_FULL = {
  id: 'lucznik', Jednostka: 'Łucznik', 'Rola (linia)': 'Strzelec', Epoka: 'Starożytność', Kultura: 'Wojna', Typ: 'Lekka',
  Atak: 4, Obrona: 2, Uderzenie: 3, Pancerz: 1, Przebicie: 2, 'Atak dystansowy': 5, Health: 10, Ruch: 3,
  'Ruch w bitwie (heksy)': 2, 'Zasięg ataku (hex)': 2, 'Ilość pocisków': 4, 'Widok pola': 2,
  'Kara obrony z flanki (%)': 10, 'Kara obrony z tyłu (%)': 20, 'Próg dezercji (% health)': 0.2,
  'Pieniądz (koszt)': 12, 'Utrzymanie (Pieniądz/turę)': 1, 'żywność/turę': 1, Ludność: 1, Surowiec: 'Drewno', 'Surowiec (ilość)': 2,
  Tech: 'Rolnictwo', 'Super-jednostka': 'TAK', 'W zamian za': 'Miecznik', Morale: 5,
};
const UNIT_MIN = { id: 'woz', Jednostka: 'Wóz', Ruch: 1, Health: undefined, Tech: null, Surowiec: null, 'Super-jednostka': 'NIE' };

/** Scena: wszystkie wywołania jednostek K05B dla danego wariantu; zwraca [{ name, html, after, log }]. */
function scenes(v, U, F) {
  const out = [];
  const mkMount = () => document.createElement('div');
  const city = CITY_(v);
  const view = v === 2 ? null : VIEW(v);
  const data = v % 3
    ? { buildings: [B_FARM0, B_FULL(v), B_WALL(v), B_PORT(v)], units: [UNIT_FULL, UNIT_MIN] }
    : { buildings: [], units: [] };
  const slide = (root) => {
    // symulacja zdarzeń: suwaki (input) i przyciski (click), w kolejności dokumentu
    const ins = [...root.querySelectorAll('input[type="range"]')];
    ins.forEach((inp, i) => {
      inp.value = String((Number(inp.value) + 10 + i) % 100);
      inp.dispatchEvent(new window.Event('input'));
    });
    [...root.querySelectorAll('button')].forEach((b) => b.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
  };
  const rec = (name, root, fn) => {
    F.log.length = 0;
    let html;
    try {
      html = fn();
    } catch (e) {
      html = `THROW:${e.message}`;
    }
    const before = root ? root.innerHTML : '';
    if (root) slide(root);
    out.push({ name, html: html ?? before, after: root ? root.innerHTML : '', log: F.log.map((x) => JSON.stringify(x)) });
  };
  /** Scena zwracająca element (karta): html = outerHTML, zdarzenia na całym elemencie. */
  const recEl = (name, fn) => {
    F.log.length = 0;
    let el = null;
    let html;
    try {
      el = fn();
      html = el instanceof window.Element ? el.outerHTML : String(el);
    } catch (e) {
      html = `THROW:${e.message}`;
    }
    if (el instanceof window.Element) slide(el);
    out.push({ name, html, after: el instanceof window.Element ? el.outerHTML : '', log: F.log.map((x) => JSON.stringify(x)) });
  };
  // Identyfikator stylu z pinu (cityPanel.ts:7465, stała pinu — ta sama wartość w porcie: k05a-fundament.ts:381).
  const STYLE_ID = 'civ-city-panel-entity-card-css-v1';
  const resetStyle = () => document.getElementById(STYLE_ID)?.remove();

  let m = mkMount();
  rec('renderEkonomiaStrip', m, () => { U.renderEkonomiaStrip(m, city, view, data); return m.innerHTML; });
  m = mkMount();
  rec('appendPodzialHandlu', m, () => { U.appendPodzialHandlu(m, city, view, data, { skipSubhd: v === 2 }); return m.innerHTML; });
  m = mkMount();
  rec('appendCitySkarbiecBalance', m, () => { U.appendCitySkarbiecBalance(m, city); return m.innerHTML; });
  m = mkMount();
  rec('renderPodzialHandlu', m, () => { U.renderPodzialHandlu(m, city, view, data); return m.innerHTML; });
  rec('buildTopBarZlotoDetailCard', null, () => U.buildTopBarZlotoDetailCard(city, view ?? VIEW(v), EMP(v), data).outerHTML);
  m = mkMount();
  rec('renderSplitPane', m, () => {
    U.renderSplitPane(m, (row) => { row.textContent = `top${v}`; }, (row) => { row.textContent = `bot${v}`; });
    return m.innerHTML;
  });
  for (const unit of GARRISON) {
    m = mkMount();
    rec(`appendGarrisonUnitChip:${unit.id}`, m, () => { U.appendGarrisonUnitChip(m, unit); return m.innerHTML; });
  }
  m = mkMount();
  rec('improvementRangeRow', m, () => {
    const grid = document.createElement('div');
    U.improvementRangeRow(grid, 'farm', 'Farma', 2 + v);
    m.appendChild(grid);
    return m.innerHTML;
  });

  // ─── partia 2 ───────────────────────────────────────────────────────────────────────────────────────────────────
  const defs = [B_FULL(v), B_WALL(v), B_PORT(v)];
  const ctx = F.rules.productionCtxForCity(city);
  const techsOf = () => (v === 3 ? [] : ['Rolnictwo', 'Pismo']);
  for (const def of defs) {
    for (const withCity of [true, false]) {
      const cty = withCity ? city : undefined;
      m = mkMount();
      rec(`appendBuildingRequirementsBlock:${def.id}:${withCity}`, m, () => {
        const r = U.appendBuildingRequirementsBlock(m, def, cty, data, F.rules.productionCtxForCity(city), techsOf());
        return `${r}|${m.innerHTML}`;
      });
      rec(`buildingRequirementChips:${def.id}:${withCity}`, null, () =>
        JSON.stringify(U.buildingRequirementChips(def, cty, data, ctx, techsOf())));
      rec(`buildingStockCostChipsHtml:${def.id}:${withCity}`, null, () => U.buildingStockCostChipsHtml(def, cty));
    }
    rec(`buildingLocationRequirementMet:${def.id}`, null, () => String([U.buildingLocationRequirementMet(def.lokalizacja, v === 1), U.buildingLocationRequirementMet(def.lokalizacja, v !== 1)]));
    rec(`missingTechSteps:${def.id}`, null, () => JSON.stringify(U.missingTechSteps(data, 'Rolnictwo', new Set(v === 2 ? [] : ['Pismo']))));
  }
  for (const def of defs) {
    for (const opts of [
      {},
      { locked: true, lockHint: '<b>Brak</b> surowca', techs: ['Rolnictwo'] },
      { item: { id: def.id, koszt: 40 + v, kind: 'budynek' }, city, praca: 5, skarb: 100, buildLabel: 'Buduj' },
      { item: { id: def.id, koszt: 9, kind: 'budynek' }, city, praca: 0, skarb: 7, buildLabel: 'Ulepsz', upgrade: true },
      { readyTag: 'Gotowe do budowy', city: undefined },
    ]) {
      recEl(`buildBuildingInfocard:${def.id}:${Object.keys(opts).join('+')}`, () => U.buildBuildingInfocard(def, data, opts));
    }
  }
  for (const tech of [null, 'Rolnictwo', 'Brak', '']) {
    m = mkMount();
    rec(`appendTechDetailBlock:${tech}`, m, () => { U.appendTechDetailBlock(m, data, tech); return m.innerHTML; });
  }
  rec('ensureEntityCardBuildingStyles', null, () => {
    resetStyle();
    U.ensureEntityCardBuildingStyles();
    U.ensureEntityCardBuildingStyles();
    // Liczba elementów stylu (duplikat = błąd) + treść pierwszego.
    return `${document.querySelectorAll(`style#${STYLE_ID}`).length}|${document.getElementById(STYLE_ID)?.textContent ?? ''}`;
  });
  for (const def of defs) {
    recEl(`buildBuildingDetailCardViaEntityCard:${def.id}`, () => { resetStyle(); return U.buildBuildingDetailCardViaEntityCard(def, data, city); });
    recEl(`buildBuildingDetailCardViaEntityCard:${def.id}:noCity`, () => U.buildBuildingDetailCardViaEntityCard(def, data));
    recEl(`buildBuildingDetailCard:${def.id}`, () => U.buildBuildingDetailCard(def, data, city));
    recEl(`_legacyBuildBuildingDetailCard:${def.id}`, () => U._legacyBuildBuildingDetailCard(def, data, city));
    recEl(`_legacyBuildBuildingDetailCard:${def.id}:noCity`, () => U._legacyBuildBuildingDetailCard(def, data));
    for (const opts of [
      {},
      { item: { id: def.id, koszt: 30, kind: 'budynek' }, praca: 4, skarb: 50, buildLabel: 'Buduj' },
      { lockHint: 'Zablokowane', locked: false, ctx, techs: ['Rolnictwo'] },
      { item: { id: def.id, koszt: 11, kind: 'budynek' }, locked: true, upgrade: true, buildLabel: 'Ulepsz' },
    ]) {
      recEl(`buildBuildingBuildTabDetailCard:${def.id}:${Object.keys(opts).join('+')}`, () =>
        U.buildBuildingBuildTabDetailCard(def, data, city, opts));
    }
  }

  // ─── partia 3 ───────────────────────────────────────────────────────────────────────────────────────────────────
  for (const u of [UNIT_FULL, UNIT_MIN]) {
    recEl(`_legacyBuildUnitDetailCard:${u.id}`, () => U._legacyBuildUnitDetailCard(u, data));
  }
  for (const skarb of [undefined, 250 + v]) {
    recEl(`buildRecruitTabDetailCard:${skarb}`, () => U.buildRecruitTabDetailCard(city, 3 + v, skarb));
  }
  for (const def of [...defs, B_FULL(3)]) {
    recEl(`buildUpgradeBonusDetailCard:${def.id}:${def.upgradeFrom ?? '-'}`, () => U.buildUpgradeBonusDetailCard(def, data, city));
    recEl(`buildUpgradeBonusDetailCard:${def.id}:noCity`, () => U.buildUpgradeBonusDetailCard(def, data));
  }
  return out;
}

/** Plik wyjściowy bundla po nazwie (bundle z podziałem na chunki zachowuje podkatalogi). */
function findJs(outdir, name) {
  const walk = (d) => readdirSync(d).flatMap((x) => { const p = join(d, x); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const hit = walk(outdir).find((p) => p.endsWith('/' + name));
  if (!hit) throw new Error(`brak bundla: ${name} w ${outdir}: ${walk(outdir).join(', ')}`);
  return hit;
}

const tmp = mkdtempSync(join(tmpdir(), 'k05b-harness-'));
const uiParamsStub = {
  name: 'uiparams-stub',
  setup(b) {
    b.onResolve({ filter: /(^|\/)uiParams$/ }, (a) => ({ path: a.path, namespace: 'uistub' }));
    b.onLoad({ filter: /.*/, namespace: 'uistub' }, () => ({ contents: `export const UI_PARAMS = ${JSON.stringify(PIN_UI_PARAMS)};`, loader: 'js' }));
  },
};
/**
 * Atrapa renderera kart (K05B harness): `openEntityCard` idzie do logu fixture; `renderEntityCard` buduje deterministyczny
 * element z zawartości wejścia (ta sama dla obu stron — porównujemy wywołania jednostek, nie renderer K-kart).
 */
const rendererStub = {
  name: 'renderer-stub',
  setup(b) {
    b.onResolve({ filter: /entityCards\/renderer$/ }, (a) => ({ path: a.path, namespace: 'rstub' }));
    b.onLoad({ filter: /.*/, namespace: 'rstub' }, () => ({
      contents: `
export * from ${JSON.stringify(join(CITY, '..', 'entityCards', 'renderer.ts'))};
export const ENTITY_CARD_CSS = '.entity-card{display:block}';
export function openEntityCard(...a) { return globalThis.__K05B_FIX.openEntityCard(...a); }
export function renderEntityCard(built) {
  const d = document.createElement('div');
  d.className = 'entity-card';
  let s = '';
  try { s = JSON.stringify(built, (k, v) => (typeof v === 'function' ? '[fn]' : v)); } catch (e) { s = 'NOJSON'; }
  d.setAttribute('data-built', s);
  return d;
}`,
      loader: 'js',
      resolveDir: join(CITY, '..', 'entityCards'),
    }));
  },
};
/** Mutacja portu w pamięci (pojedyncze wystąpienie `from`). */
const mutantPlugin = {
  name: 'k05b-mutant',
  setup(b) {
    if (!MUT) return;
    b.onLoad({ filter: /k05b-(podzial|widgety|host|karty|jednostki|chipy)\.ts$/ }, (a) => {
      if (!a.path.endsWith(MUT.file)) return undefined;
      const src = readFileSync(a.path, 'utf8');
      const n = src.split(MUT.from).length - 1;
      if (n !== 1) throw new Error(`mutant: oczekiwano 1 trafienia, jest ${n}: ${MUT.from}`);
      return { contents: src.replace(MUT.from, MUT.to), loader: 'ts' };
    });
  },
};

let exitCode = 0;
try {
  const pinProbe = join(tmp, 'pin-probe.ts');
  // Katalog statyczny (ZAŁOŻENIE P5.2-Z1): instalowany PIERWSZYM importem w każdej paczce (przed modułami czytającymi go na poziomie modułu).
  const installEntry = join(tmp, 'install-catalog.ts');
  writeFileSync(pinProbe, `import ${JSON.stringify(installEntry)};\n` + probeSrc);
  writeFileSync(
    installEntry,
    [
      `import { installStaticCatalog } from ${JSON.stringify(join(V2_ROOT, 'src/controller/staticCatalog.ts'))};`,
      `import { MOCK_STATIC_CATALOG } from ${JSON.stringify(join(V2_ROOT, 'src/controller/mockCatalog.ts'))};`,
      // Katalog atrapy z jedną technologią (ścieżka „Pełna karta technologii” w appendTechDetailBlock wymaga wiersza techu).
      `installStaticCatalog({ ...MOCK_STATIC_CATALOG, tech: { technologie: [{ Technologia: ${JSON.stringify(PROBE_TECH)}, Epoka: 'Starożytność' }] } });`,
      '',
    ].join('\n'),
  );
  const pinOut = join(tmp, 'pin-out');
  // Dwa wejścia (sonda + moduł hosta), by bundler zachował nazwę pliku sondy (przy jednym wejściu nazwa się zeruje).
  await bundle([pinProbe, PORT_ABS('k05b-host.ts')], pinOut, { extraPlugins: [uiParamsStub, rendererStub] });
  // Port: jedna paczka z wejściem `port-entry.ts` (katalog statyczny pierwszy, potem moduły K05B).
  const portEntry = join(tmp, 'port-entry.ts');
  writeFileSync(
    portEntry,
    [
      `import ${JSON.stringify(installEntry)};`,
      `import { ustawRegulyKontrolera as setK01bRules } from ${JSON.stringify(PORT_ABS('k01b-reguly.ts'))};`,
      `setK01bRules(new Proxy({}, { get: (_t, k) => (...a) => globalThis.__K05B_K01B[k](...a) }));`,
      ...['k05b-podzial', 'k05b-widgety', 'k05b-karty', 'k05b-jednostki', 'k05b-chipy', 'k05b-host'].map((f) => `export * from ${JSON.stringify(PORT_ABS(f + '.ts'))};`),
      '',
    ].join('\n'),
  );
  // Port: pakowanie jak w pozostałych harnessach DOM (`build.mjs`: ?raw, import.meta.glob), z wtyczkami stubów.
  const v2Out = join(tmp, 'v2');
  // Drugie wejście (host) tylko po to, by bundler zachował nazwy plików wejściowych (przy jednym wejściu nazwa się zeruje).
  await bundle([portEntry, PORT_ABS('k05b-host.ts')], v2Out, { extraPlugins: [uiParamsStub, rendererStub, mutantPlugin] });

  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  for (const k of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLButtonElement', 'Event', 'MouseEvent', 'Node', 'Element']) {
    globalThis[k] = dom.window[k] ?? globalThis[k];
  }
  globalThis.window = dom.window;
  const PIN = await import(pathToFileURL(findJs(pinOut, 'pin-probe.js')).href);
  const PORT_ALL = await import(pathToFileURL(findJs(v2Out, 'port-entry.js')).href);
  const PORT = { P: PORT_ALL, W: PORT_ALL, K: PORT_ALL, J: PORT_ALL, C: PORT_ALL, H: PORT_ALL };
  const U_PORT = PORT_ALL;
  // Pin-owe nazwy wywoływane przez jednostki K05B: fixture po stronie pinu = ten sam obiekt hosta co po stronie portu.
  const U_PIN = Object.fromEntries(
    [
      'renderEkonomiaStrip', 'appendPodzialHandlu', 'appendCitySkarbiecBalance', 'renderPodzialHandlu', 'buildTopBarZlotoDetailCard',
      'renderSplitPane', 'appendGarrisonUnitChip', 'improvementRangeRow',
      'appendBuildingRequirementsBlock', 'buildBuildingInfocard', 'appendTechDetailBlock', 'ensureEntityCardBuildingStyles',
      'buildBuildingDetailCardViaEntityCard', 'buildBuildingDetailCard', '_legacyBuildBuildingDetailCard', 'buildBuildingBuildTabDetailCard',
      '_legacyBuildUnitDetailCard', 'buildRecruitTabDetailCard', 'buildUpgradeBonusDetailCard',
      'buildingLocationRequirementMet', 'buildingRequirementChips', 'missingTechSteps', 'buildingStockCostChipsHtml',
    ].map((n) => [n, PIN[n]]),
  );

  const results = [];
  for (let v = 0; v < 4; v++) {
    const fPin = mkFix(v);
    const fPort = mkFix(v);
    globalThis.__K05B_FIX = fPin.host;
    globalThis.__K05B_K01B = mkK01b(v);
    const pinScenes = scenes(v, U_PIN, { ...fPin, rules: fPin.host.rules });
    PORT.H.setK05bHost(fPort.host);
    globalThis.__K05B_FIX = fPort.host;
    globalThis.__K05B_K01B = mkK01b(v);
    const portScenes = scenes(v, U_PORT, { ...fPort, rules: fPort.host.rules });
    pinScenes.forEach((sa, i) => {
      const sb = portScenes[i];
      const ja = JSON.stringify({ html: sa.html, after: sa.after, log: sa.log });
      const jb = JSON.stringify({ html: sb.html, after: sb.after, log: sb.log });
      // Pusty wynik jest oczekiwany tylko tam, gdzie pin wychodzi wcześnie (brak `cityMoneySnap`, v=1).
      // Pusty wynik dozwolony tylko tam, gdzie wejście go wymusza: brak kosztu surowcowego (`buildingStockCostChipsHtml`)
      // albo brak `cityMoneySnap` (appendCitySkarbiecBalance, v=1). Wynik THROW nigdy nie jest dowodem.
      const expectEmpty = (sa.name === 'appendCitySkarbiecBalance' && v === 1) || sa.name.startsWith('buildingStockCostChipsHtml');
      const nonTrivial = !sa.html.startsWith('THROW') && (expectEmpty || sa.html.length > 0) && (expectEmpty || sa.html.length > 2);
      results.push({ name: `${sa.name} v=${v}`, ok: ja === jb, pin: ja, port: jb, nonTrivial });
    });
  }
  // Adaptery sygnatur (K05B-Z7): wynik portu porównany z pinem na tym samym wejściu.
  for (let v = 0; v < 4; v++) {
    const fPin = mkFix(v);
    const fPort = mkFix(v);
    // Strona pinu: wywołanie i kliknięcie PRZED przełączeniem fixture na port (rerender w pinie loguje do fixture pinu).
    globalThis.__K05B_FIX = fPin.host;
    const pa = PIN.formatResourceUpkeepSummary({ drewno: 2, kamien: v });
    const pd = PIN.daninaLabelForCity({ id: 1 });
    const m1 = document.createElement('div');
    PIN.appendIndywidualneToggle(m1, v % 2 === 0, () => fPin.log.push(['tog']), 'r');
    m1.querySelectorAll('button').forEach((b) => b.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
    PORT.H.setK05bHost(fPort.host);
    globalThis.__K05B_FIX = fPort.host;
    const ra = PORT.H.formatResourceUpkeepSummary({ drewno: 2, kamien: v });
    const rd = PORT.H.daninaLabelForCity({ id: 1, ownerId: 0 });
    const m2 = document.createElement('div');
    PORT.H.appendIndywidualneToggle(m2, v % 2 === 0, () => fPort.log.push(['tog']), 'r');
    m2.querySelectorAll('button').forEach((b) => b.dispatchEvent(new window.MouseEvent('click', { bubbles: true })));
    results.push({ name: `adapter:formatResourceUpkeepSummary v=${v}`, ok: pa === ra, pin: pa, port: ra, nonTrivial: true });
    results.push({ name: `adapter:daninaLabelForCity v=${v}`, ok: pd === rd, pin: pd, port: rd, nonTrivial: true });
    results.push({
      name: `adapter:appendIndywidualneToggle v=${v}`,
      ok: m1.innerHTML === m2.innerHTML && JSON.stringify(fPin.log) === JSON.stringify(fPort.log),
      pin: m1.innerHTML + JSON.stringify(fPin.log),
      port: m2.innerHTML + JSON.stringify(fPort.log),
      nonTrivial: m1.innerHTML.length > 20,
    });
  }

  let bad = 0;
  let trivial = 0;
  for (const r of results) {
    if (!r.ok) bad++;
    if (!r.nonTrivial) trivial++;
    console.log(`${r.ok ? 'OK ' : 'ROZNICA'} ${r.name}${r.ok ? '' : `\n     pin=${r.pin.slice(0, 300)}\n     v2 =${r.port.slice(0, 300)}`}`);
  }
  const summary = `porównań ${results.length}, różnic ${bad}, bez treści (trywialnych) ${trivial}`;
  console.log(summary);
  if (trivial > 0) {
    console.log('UWAGA: część wektorów ma pusty wynik lub THROW — wynik nie jest dowodem dla tych wektorów.');
    for (const r of results.filter((x) => !x.nonTrivial)) console.log(`  trywialny: ${r.name} pin=${r.pin.slice(0, 160)}`);
  }
  exitCode = bad === 0 && trivial === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD HARNESSU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
