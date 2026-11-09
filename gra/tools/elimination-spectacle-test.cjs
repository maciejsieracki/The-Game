'use strict';
/**
 * elimination-spectacle-test.cjs — R-WEB-ELIMINATION-SCREEN-SPECTACULAR-Q1.
 *
 * Pokrywa:
 *  1. kroniki: liczniki rosną po symulowanych bitwach / rekrutacji / zdobyciu miasta / cudzie,
 *     atrybucja per właściciel (kto kogo zniszczył), rekordy (maks. miasta, szczyt ludności),
 *     serializacja + wczytanie (stary zapis bez pola => pusta mapa, wadliwe wpisy ignorowane);
 *  2. dane ekranu: stary zapis (legacy) => „brak danych", nie zera i nie wymyślone liczby;
 *  3. render modalu (showCityCaptureNotice + showCaptureReportNotice) — wszystkie sekcje,
 *     dotychczasowy BILANS ZDOBYCIA zostaje, przycisk Zamknij / Wejdź / Wróć, brak NaN/undefined;
 *  4. regresja: bez `spectacle` modal wygląda jak dotąd (Miasto zdobyte / ELIMINACJA! w starej formie);
 *  5. prefers-reduced-motion: count-up wyłączony (wartość końcowa od razu) + CSS @media;
 *  6. progi docenienia (ZAŁOŻENIE) i polska odmiana „tura";
 *  7. strukturalnie main.ts: punkty zliczania (obie ścieżki rekrutacji, bitwa, zdobycie miasta w
 *     obu lejkach, cud, tick tury, zapis/wczytanie, budowa ekranu przed eliminateOwner).
 *
 * Usage (z gra/): node tools/elimination-spectacle-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const { JSDOM } = require(path.resolve(GRA, 'node_modules', 'jsdom'));

const ENTRY = path.resolve(__dirname, '.elimination-spectacle-entry.ts');
const BUNDLE = path.resolve(__dirname, '.elimination-spectacle-bundle.cjs');

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }

async function main() {
  fs.writeFileSync(ENTRY,
    "export * from '../src/ui/eliminationSpectacle.ts';\n"
    + "export { showCityCaptureNotice, showCaptureReportNotice, hideCityCaptureNotice } from '../src/ui/cityCaptureNotice.ts';\n", 'utf8');
  const stubBrand = {
    name: 'stub-brand',
    setup(b) {
      b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: 'brand-stub', namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
        contents: "export function brandIconSvg(){return '<svg></svg>';}", loader: 'ts',
      }));
    },
  };
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent', plugins: [stubBrand],
  });
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { pretendToBeVisual: true });
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  const M = require(BUNDLE);

  console.log('elimination-spectacle-test (R-WEB-ELIMINATION-SCREEN-SPECTACULAR-Q1)\n');

  // ---- 1. kroniki -------------------------------------------------------------------------
  console.log('[1] kroniki');
  const ch = new Map();
  M.noteUnitProduced(ch, 5, 3); M.noteUnitProduced(ch, 5, 3); M.noteUnitProduced(ch, 0, 3);
  ok(ch.get(5).produced === 2 && ch.get(0).produced === 1, 'rekrutacja: licznik per właściciel rośnie');
  M.noteBattleResult(ch, 0, 5, 1, 3, 10); // gracz atakuje: traci 1, AI traci 3
  M.noteBattleResult(ch, 5, 0, 2, 0, 11); // AI atakuje: traci 2, gracz 0
  ok(ch.get(0).lost === 1 + 0 && ch.get(0).destroyed === 3 + 2, 'bitwy: gracz stracił 1, zniszczył 5');
  ok(ch.get(5).lost === 3 + 2 && ch.get(5).destroyed === 1, 'bitwy: AI straciła 5, zniszczyła 1');
  ok(ch.get(0).battles === 2 && ch.get(5).battles === 2, 'bitwy: liczba bitew po obu stronach');
  ok(ch.get(0).vs[5].k === 5 && ch.get(5).vs[0].k === 1 && ch.get(5).vs[0].l === 5, 'atrybucja vs: kto kogo zniszczył');
  M.noteBattleResult(ch, 0, 0, 5, 5, 12);
  ok(ch.get(0).battles === 2, 'bitwa właściciela z samym sobą ignorowana');
  M.noteBattleResult(ch, 0, 5, NaN, undefined, 12);
  ok(Number.isFinite(ch.get(0).lost) && Number.isFinite(ch.get(5).lost), 'NaN w stratach nie psuje liczników');
  M.noteCityCapture(ch, 5, 0, 12);
  ok(ch.get(0).citiesTaken === 1 && ch.get(5).citiesLost === 1, 'zdobycie miasta: zdobyte/utracone');
  M.noteEmpireSize(ch, 5, 4, 20, 13); M.noteEmpireSize(ch, 5, 2, 9, 14);
  ok(ch.get(5).maxCities === 4 && ch.get(5).peakPop === 20, 'rekordy: maks. miasta i szczyt ludności nie maleją');
  M.noteWonderBuilt(ch, 5, 14);
  ok(ch.get(5).wonders === 1, 'cud świata zliczony');
  const ser = M.serializeChronicles(ch);
  const ch2 = new Map();
  M.restoreChronicles(ch2, JSON.parse(JSON.stringify(ser)));
  ok(JSON.stringify(M.serializeChronicles(ch2)) === JSON.stringify(ser), 'zapis -> wczytanie bez utraty');
  M.restoreChronicles(ch2, undefined);
  ok(ch2.size === 0, 'stary zapis bez pola => pusta mapa (bez migracji)');
  M.restoreChronicles(ch2, [[1, null], ['x', {}], [2, { produced: -4, lost: 'abc', vs: { 3: { k: NaN } } }]]);
  ok(ch2.size === 1 && ch2.get(2).produced === 0 && ch2.get(2).lost === 0 && ch2.get(2).vs[3].k === 0, 'wadliwe wpisy ignorowane / wyzerowane');

  // ---- 2. dane ekranu ---------------------------------------------------------------------
  console.log('[2] dane ekranu');
  const base = {
    civLabel: 'Rzymianie', iconSvg: '<svg viewBox="0 0 1 1"></svg>', colorHex: '#8B1A1A', era: 2, fallTurn: 120,
    rulerName: 'Kamilus', portraitUrl: 'data:image/png;base64,AAAA', capitalName: 'Rzym',
    elimOwner: 5, captorOwner: 0, captorLabel: 'Grecy', captorIsPlayer: true, chronicles: ch,
    currentCities: 1, currentPopulation: 6, wonders: 0, techs: 31, elimPower: 800, captorPower: 700, captorMaxCities: 4,
  };
  const d = M.buildEliminationSpectacle(base);
  ok(d.lifespanTurns === 118, 'czas istnienia = tura upadku - tura startu kroniki + 1 (' + d.lifespanTurns + ')');
  ok(d.achievements.some(a => a.label === 'Największa liczba miast' && a.value === '4'), 'dokonania: maks. miasta z licznika');
  ok(d.achievements.some(a => a.label === 'Zbudowane cuda świata' && a.value === '1'), 'dokonania: cuda z kroniki (historycznie)');
  ok(d.achievements.some(a => a.label === 'Osiągnięta epoka' && a.value === 'Brąz'), 'dokonania: epoka');
  const legacyMap = new Map([[5, M.newChronicle(undefined, true)], [0, M.newChronicle(1)]]);
  const dl = M.buildEliminationSpectacle({ ...base, chronicles: legacyMap });
  ok(dl.lifespanTurns === null, 'stary zapis: czas istnienia = brak danych');
  ok(!dl.achievements.some(a => a.label === 'Największa liczba miast' || a.label === 'Szczyt ludności'), 'stary zapis: brak wymyślonych rekordów');
  ok(dl.war.every(r => r.a === null), 'stary zapis: wiersze wojenne wyeliminowanej = null (brak danych)');
  const hl = M.eliminationSpectacleHtml(dl);
  ok(hl.includes('brak danych') && !/NaN|undefined|null/.test(hl.replace(/brak danych/g, '')), 'stary zapis: HTML bez NaN/undefined/null');
  const dEmpty = M.buildEliminationSpectacle({ ...base, chronicles: new Map(), elimPower: null, captorPower: null, captorMaxCities: null });
  ok(!/NaN|undefined/.test(M.eliminationSpectacleHtml(dEmpty)), 'brak kronik w ogóle: HTML bez NaN/undefined');

  // ---- 3. render --------------------------------------------------------------------------
  console.log('[3] render modalu');
  const rows = [
    { label: 'Ludność', value: '+6', tone: 'gain', group: 'przejete' },
    { label: 'Budynki', value: '+3', tone: 'gain', group: 'przejete' },
    { label: 'Żywność ze spichlerza', value: '+40', tone: 'gain', group: 'lup' },
    { label: 'Punkty nauki', value: '+12', tone: 'gain', group: 'lup' },
    { label: 'Moc', value: '+800', tone: 'gain', group: 'lup' },
    { label: 'Pula pracy', value: '+55', tone: 'gain', group: 'lup' },
  ];
  M.showCityCaptureNotice('Ancjum', { eliminatedCivLabel: 'Rzymianie', eliminatedDetails: 'x', reportRows: rows, spectacle: d });
  let html = document.body.innerHTML;
  for (const needle of ['ELIMINACJA!', 'Rzymianie', 'Kamilus', 'Rzym', 'Dokonania', 'Statystyki wojenne', 'Wyprodukowane jednostki',
    'Stracone jednostki', 'Zniszczone jednostki wroga', 'Zdobyte miasta', 'Utracone miasta', 'Stoczone bitwy', 'Brąz',
    'Upadek w turze', '118 tur', 'Bilans zdobycia', 'Żywność ze spichlerza', 'Punkty nauki', 'Pula pracy', 'Wejdź do miasta', 'Wróć na mapę',
    'Ancjum', 'civ-ccn-spectacle', 'elsp-bar']) {
    ok(html.includes(needle), 'sekcja/tekst obecny: ' + needle);
  }
  ok(!/NaN|undefined/.test(html), 'brak NaN/undefined w tekście modalu');
  ok(document.querySelectorAll('.elsp-wr').length >= 6, 'słupki porównawcze: co najmniej 6 wierszy statystyk');
  ok(d.appreciation && html.includes(d.appreciation.slice(0, 20)), 'zdanie docenienia widoczne');
  M.hideCityCaptureNotice();
  ok(document.querySelector('.civ-ccn-overlay') === null, 'zamknięcie usuwa modal');

  M.showCaptureReportNotice({ title: 'ELIMINACJA!', cityName: 'Ancjum', subtitle: 'x', rows, rowsTitle: 'Bilans zdobycia', spectacle: d });
  html = document.body.innerHTML;
  ok(html.includes('Statystyki wojenne') && html.includes('Bilans zdobycia') && html.includes('data-close'), 'karta wydarzeń: ekran + bilans + przycisk Zamknij');
  ok(html.includes('Zamknij'), 'przycisk Zamknij obecny');
  M.hideCityCaptureNotice();

  // ---- 4. regresja ------------------------------------------------------------------------
  console.log('[4] regresja (bez spectacle)');
  M.showCityCaptureNotice('Ancjum', { eliminatedCivLabel: 'Rzymianie', eliminatedDetails: 'Łup: 10 złota', reportRows: undefined });
  html = document.body.innerHTML;
  ok(html.includes('ELIMINACJA!') && html.includes('ostatnie miasto przejęte, cywilizacja wyeliminowana') && html.includes('Łup: 10 złota'), 'stara forma eliminacji bez zmian');
  ok(!html.includes('elsp'), 'bez spectacle nie ma elementów widowiska');
  M.hideCityCaptureNotice();
  M.showCityCaptureNotice('Ancjum');
  ok(document.body.innerHTML.includes('Miasto zdobyte'), 'zwykłe zdobycie: Miasto zdobyte');
  M.hideCityCaptureNotice();

  // ---- 5. prefers-reduced-motion ----------------------------------------------------------
  console.log('[5] prefers-reduced-motion');
  const css = document.getElementById('civ-elim-spectacle-css-v1').textContent;
  ok(/@media \(prefers-reduced-motion:reduce\)[\s\S]*animation:none/.test(css), 'CSS: reduced-motion wyłącza animacje');
  window.matchMedia = () => ({ matches: true });
  let raf = 0; global.requestAnimationFrame = () => { raf++; return 0; };
  M.showCityCaptureNotice('Ancjum', { eliminatedCivLabel: 'Rzymianie', spectacle: d });
  const first = document.querySelector('[data-countup]');
  ok(raf === 0 && first.textContent === first.getAttribute('data-countup'), 'reduced-motion: brak animacji, wartość końcowa od razu');
  M.hideCityCaptureNotice();
  window.matchMedia = () => ({ matches: false });
  let queued = null; global.requestAnimationFrame = (f) => { queued = f; return 1; };
  global.performance = { now: () => 0 };
  M.showCityCaptureNotice('Ancjum', { eliminatedCivLabel: 'Rzymianie', spectacle: d });
  const el = document.querySelector('[data-countup]');
  ok(el.textContent === '0' && typeof queued === 'function', 'bez reduced-motion: count-up startuje od 0');
  let guard = 0; const target = el.getAttribute('data-countup');
  while (queued && guard++ < 10) { const f = queued; queued = null; f(5000); }
  ok(el.textContent === target, 'count-up kończy na wartości końcowej (' + target + ')');
  M.hideCityCaptureNotice();

  // ---- 6. progi, odmiana ------------------------------------------------------------------
  console.log('[6] docenienie i odmiana');
  const T = M.APPRECIATION_THRESHOLDS;
  ok(T.stronger === 1.25 && T.equal === 0.75 && T.weaker === 0.35, 'progi docenienia (ZAŁOŻENIE do akceptacji): 1,25 / 0,75 / 0,35');
  const lines = [2, 1, 0.5, 0.1].map(r => M.appreciationLine(r, true, 'Grecy', 'Rzymianie'));
  ok(new Set(lines).size === 4, 'cztery różne zdania dla czterech progów');
  ok(!/NaN|undefined/.test(M.appreciationLine(null, false, 'Grecy', 'Rzymianie')), 'brak siły: neutralne zdanie');
  ok(M.turnsPl(1) === '1 tura' && M.turnsPl(2) === '2 tury' && M.turnsPl(5) === '5 tur' && M.turnsPl(12) === '12 tur' && M.turnsPl(22) === '22 tury', 'odmiana: tura/tury/tur');
  ok(M.epitaphForEra(1) !== M.epitaphForEra(2) && M.epitaphForEra(2) !== M.epitaphForEra(3), 'epitafium zależne od epoki');

  // ---- 7. strukturalnie main.ts -----------------------------------------------------------
  console.log('[7] main.ts — punkty zliczania');
  const main = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
  ok((main.match(/chronicleNoteProducedUnit\(units\[units\.length - 1\]\)/g) || []).length === 2, 'rekrutacja: oba miejsca narodzin jednostki');
  ok(/noteBattleResult\(civChronicleByOwner, chronAtkOwner, chronDefOwner/.test(main), 'bitwa: noteBattleResult w applyMapBattleOutcome');
  ok(/noteCityCapture\(civChronicleByOwner, oldOwner, atkOwner, turn\)/.test(main), 'zdobycie miasta (bitwa/szturm): noteCityCapture');
  ok(/noteCityCapture\(civChronicleByOwner, oldOwner, newOwner, turn\)/.test(main), 'zdobycie miasta (kapitulacja głodowa): noteCityCapture');
  ok(/noteWonderBuilt\(civChronicleByOwner, site\.ownerId, turn\)/.test(main), 'cud: noteWonderBuilt');
  ok(/turn\+\+;\s*\n\s*chronicleTickEmpireSizes\(\)/.test(main), 'tick rekordów tuż po turn++');
  ok(/civChronicleByOwner: serializeChronicles\(civChronicleByOwner\)/.test(main), 'zapis: meta.civChronicleByOwner');
  ok(/restoreChronicles\(civChronicleByOwner, saved\.meta\?\.civChronicleByOwner\)/.test(main) && /newChronicle\(undefined, true\)/.test(main), 'wczytanie: restore + legacy dla starych zapisów');
  const iBuild = main.indexOf('buildSpectacleForElimination(city, oldOwner, newOwner');
  const iElim = main.indexOf('eliminateOwner(oldOwner);', iBuild);
  ok(iBuild > 0 && iElim > iBuild, 'ekran budowany PRZED eliminateOwner (migawka stanu)');
  ok(/spectacle: elim \? eliminationSpectacleByLabel\.get\(elim\)/.test(main) && /spectacle: info\.spectacle/.test(main), 'karta wydarzeń niesie ekran i przekazuje go do modalu');
  ok(/withSpectacle/.test(main), 'modal zdobycia (showCityCaptureNoticeDeferred) dostaje ekran');
  ok((main.match(/civChronicleByOwner\.clear\(\)/g) || []).length >= 6, 'kroniki czyszczone przy nowej grze / wczytaniu');

  fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE);
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); try { fs.unlinkSync(ENTRY); } catch {} process.exit(1); });
