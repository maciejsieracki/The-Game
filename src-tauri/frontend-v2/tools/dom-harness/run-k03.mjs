#!/usr/bin/env node
/**
 * run-k03.mjs — harness kontraktu P5-8 K03 (R-RUSTPORT-P5-8-CITYPANEL-K03-Q1, runda 1):
 * `src/ui/cityPanel/k03-model.ts` (adaptery DTO) i `k03-detail.ts` (prymitywy kart).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/run-k03.mjs
 * EXIT 0 <=> wszystkie asercje zielone; 1 <=> >=1 asercja czerwona; 2 <=> blad harnessu.
 *
 * Co sprawdza (kontrakt, NIE porownanie z pinem — pin porownuje sie w run-k02/k01b):
 *  R1  porzadek (`order`) pochodzi z DTO: `resolveOrderStateFromDto` zwraca wartosci `dto.order`,
 *      a zmiana `dto.order.szczescie` zmienia wynik (mutacja pola DTO wykrywana).
 *  R2  `cityViewFromDto`: wzrost/racje/popCaps z DTO; mutacja `growth.pctPerTurn` zmienia
 *      `wzrostProcent` i `cityGrowthLiveFromDto().procentNaTure`.
 *  R3  `readPodzialHandluFromDto` czyta `sliders.handel`; brak pola -> domyslny K01A.
 *  R4  `isCapitalFromDto`, `isMeCityFromDto`, `activeTradeRouteCountFromDto` czytaja pola DTO.
 *  R5  `getProd`/`setProd`: lokalny cache kolejki, domyslnie pusta kolejka.
 *  D1  `beginBuildingDetailTile`, `appendDetailGridIn`, `appendDetailGrid`, `appendDetailFormula`
 *      buduja DOM o klasach pinu (`bld-detail-tile`, `dc-grid`, `dc-formula`).
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { bundle } from './build.mjs';
import { readdirSync, statSync } from 'node:fs';

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');

const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

let results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

const tmp = mkdtempSync(join(tmpdir(), 'p58k03-harness-'));
let exitCode = 0;
try {
  const out = join(tmp, 'v2');
  await bundle([join(CITY, 'k03-model.ts'), join(CITY, 'k03-detail.ts'), join(V2_ROOT, 'src/controller/mockCatalog.ts'), join(V2_ROOT, 'src/controller/staticCatalog.ts')], out);
  const entry = (name) => {
    const hit = walk(out).find((p) => p.endsWith('/' + name));
    if (!hit) throw new Error('brak bundla: ' + name + ' w ' + out);
    return hit;
  };
  // Katalog statyczny v2 przed ewaluacja modulow (ZALOZENIE P5.2-Z1); uiParams z mockCatalog (v2, nie pin).
  const SC = await import(pathToFileURL(entry('staticCatalog.js')).href);
  const MC = await import(pathToFileURL(entry('mockCatalog.js')).href);
  SC.installStaticCatalog(MC.MOCK_STATIC_CATALOG);
  const model = await import(pathToFileURL(entry('k03-model.js')).href);
  const detail = await import(pathToFileURL(entry('k03-detail.js')).href);

  const mkDto = () => ({
    city: { id: 7, owner: 0, q: 1, r: 2, name: 'Test', mapLabel: 'T', population: 4, isCapital: true, isMine: true },
    navOrder: [7],
    yields: { praca: 3, pieniadz: 2, nauka: 1, kultura: 1, zywnoscBrutto: 6 },
    food: { kosztRacji: 2, bilansLokalny: 1, poziomRacji: 2, maxSafePoziom: 3, autoWyzywienie: false, overrideLocal: false, rationLevels: [], empireFood: {} },
    growth: { pctPerTurn: 12, fed: true, breakdown: { total: 12 }, wzrostUlamkowy: 0.4, turnsToNextCitizen: 3, maxSafeRation: 3 },
    popCaps: { bezAkweduktu: 5, spichlerz: 8, zAkweduktem: 12, aktualny: 8, atCap: false, maSpichlerz: true, maAkwedukt: false },
    health: { total: 0, lines: [] },
    order: { szczescie: 4, porzadekPct: 55, band: 2, bandLabel: 'spokoj', lines: [{ id: 'a', label: 'x', value: 1 }], citizenUpkeep: { required: [], available: [], missing: [], happinessDelta: 0, growthPctDelta: 0 }, postCaptureLaw: null, revolt: { bunt: false, warning: false, graceRemaining: null, rebelState: null, postCaptureLawTurns: null } },
    culture: null, religion: null,
    wealth: { poziom: 0, cap: 0, prog: 0, mnoznik: 1, zadowolenie: 0, rownowaga: 0 },
    money: {}, manpower: {},
    sliders: { handel: { procentPieniadz: 40, procentNauka: 30, procentLuksus: 30 }, handelDefault: {}, handelOverride: false, pracaBudynkiPct: 70, pracaProcentPuli: 0, pracaOverride: false },
    production: { front: null, queue: [], paused: false, rekrutacja: [] },
    buildOptions: [], recruitOptions: [], built: [],
    okolica: { focus: 'zywnosc', tryb: 'auto', overrideLocal: false, range: 2, worked: [], excluded: [], illegalManual: [], tiles: [] },
    budowa: { tryb: 'auto', priorytetTypow: [], lista: [], biblioteka: [], overrideLocal: false },
    garrison: [],
    trade: { activeRoutes: 2, buildingBonus: 0, missingTreatyPartners: [] },
    labels: { danina: { mianownik: 'Podatek', dopelniacz: 'Podatku', biernik: 'Podatek' } },
    autoManage: false,
  });

  // R1 — porzadek z DTO
  {
    const dto = mkDto();
    const s = model.resolveOrderStateFromDto(dto);
    check('R1 order.szczescie = dto.order.szczescie', s.szczescie === 4);
    check('R1 order.bandLabel = dto', s.bandLabel === 'spokoj');
    check('R1 fromEngine = true', s.fromEngine === true);
    dto.order.szczescie = 9;
    check('R1 mutacja dto.order.szczescie wykryta', model.resolveOrderStateFromDto(dto).szczescie === 9);
  }

  // R2 — widok miasta i wzrost z DTO
  {
    const dto = mkDto();
    const v = model.cityViewFromDto(dto);
    check('R2 wzrostProcent = growth.pctPerTurn', v.wzrostProcent === 12);
    check('R2 popCapAktualny = popCaps.aktualny', v.popCapAktualny === 8);
    check('R2 maSpichlerz = popCaps.maSpichlerz', v.maSpichlerz === true);
    check('R2 zywnoscNetto = food.bilansLokalny', v.zywnoscNetto === 1);
    const g = model.cityGrowthLiveFromDto(dto);
    check('R2 procentNaTure = growth.pctPerTurn', g.procentNaTure === 12 && g.nakarmione === true);
    dto.growth.pctPerTurn = 5;
    check('R2 mutacja growth.pctPerTurn wykryta (view)', model.cityViewFromDto(dto).wzrostProcent === 5);
    check('R2 mutacja growth.pctPerTurn wykryta (live)', model.cityGrowthLiveFromDto(dto).procentNaTure === 5);
  }

  // R3 — podzial handlu
  {
    const dto = mkDto();
    const h = model.readPodzialHandluFromDto(dto);
    check('R3 podzial handlu z DTO', h.procentPieniadz === 40 && h.procentNauka === 30 && h.procentLuksus === 30);
    check('R3 podzial pracy z DTO', model.readPodzialPracyFromDto(dto).procentBudynki === 70);
    delete dto.sliders.handel.procentNauka;
    check('R3 brak pola -> wartosc domyslna (liczba)', typeof model.readPodzialHandluFromDto(dto).procentNauka === 'number');
  }

  // R4 — flagi i handel z DTO
  {
    const dto = mkDto();
    check('R4 isCapital z DTO', model.isCapitalFromDto(dto) === true);
    check('R4 isMeCity z DTO', model.isMeCityFromDto(dto) === true);
    check('R4 activeRoutes z DTO', model.activeTradeRouteCountFromDto(dto) === 2);
    dto.trade.activeRoutes = 0;
    check('R4 mutacja trade.activeRoutes wykryta', model.activeTradeRouteCountFromDto(dto) === 0);
  }

  // R5 — cache kolejki
  {
    check('R5 domyslna kolejka pusta', model.getProd('x1').kolejka.length === 0);
    model.setProd('x1', { kolejka: [{ kind: 'budynek', id: 'b', koszt: 1 }], postep: 0 });
    check('R5 setProd/getProd roundtrip', model.getProd('x1').kolejka.length === 1);
  }

  // D1 — prymitywy kart
  {
    const card = document.createElement('div');
    const bd = detail.beginBuildingDetailTile(card, 'Tytul');
    check('D1 kafel: bd w .bld-detail-tile-bd', bd.classList.contains('bld-detail-tile-bd') && card.querySelector('.bld-detail-tile') !== null);
    const g = detail.appendDetailGridIn(bd);
    check('D1 appendDetailGridIn: .dc-grid w kaflu', g.classList.contains('dc-grid') && bd.contains(g));
    const g2 = detail.appendDetailGrid(card);
    check('D1 appendDetailGrid: .dc-grid w karcie', g2.classList.contains('dc-grid') && card.contains(g2));
    detail.appendDetailFormula(card, 'a = b');
    check('D1 appendDetailFormula: .dc-formula', card.querySelector('.dc-formula')?.textContent === 'a = b');
  }

  // R6 — helpery 1:1 z pinu (runda 2): playerFacingNote, unitExtraField, cityFoodSplit
  {
    check('R6 playerFacingNote pusty -> null', model.playerFacingNote('   ') === null && model.playerFacingNote(null) === null);
    check('R6 playerFacingNote zwraca tekst przycieta', model.playerFacingNote('  Ok  ') === 'Ok');
    check('R6 unitExtraField brak pola -> null', model.unitExtraField({ a: 1 }, 'b') === null);
    check('R6 unitExtraField zwraca wartosc', model.unitExtraField({ a: 7 }, 'a') === 7);
    const dto = mkDto();
    const v = model.cityViewFromDto(dto);
    const f0 = model.cityFoodSplit(v);
    check('R6 cityFoodSplit bez przyciecia: total=bilans', f0.total === 1 && f0.produkcja === 6 && f0.racje === 2 && f0.clamped === false);
    const f1 = model.cityFoodSplit(v, 1);
    check('R6 cityFoodSplit przyciety do maxSafe=1', f1.clamped === true && f1.racje === 1 && f1.total === 5);
    dto.yields.zywnoscBrutto = 9;
    check('R6 mutacja yields.zywnoscBrutto wykryta', model.cityFoodSplit(model.cityViewFromDto(dto)).produkcja === 9);
  }
} catch (e) {
  console.error('run-k03: blad harnessu:', e?.stack ?? e);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (exitCode === 0) {
  const bad = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  console.log(`run-k03: asercji=${results.length} roznic=${bad.length}`);
  exitCode = bad.length ? 1 : 0;
}
process.exit(exitCode);
