#!/usr/bin/env node
/**
 * run-k05b-units.mjs — harness DOM porównania jednostek K05B partii 1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 1):
 * port (`src/ui/cityPanel/k05b-podzial.ts`, `k05b-widgety.ts`, `k05b-host.ts`) vs pin web `edb8fb56`
 * (`gra/src/ui/cityPanel.ts`, jednostki wyciągane PO NAZWIE z tekstu pinu).
 *
 * Obie strony dostają TEN SAM fixture wejść (host: cfg, readPodzialHandlu, isMeCity, rerender, openEntityCard, ...)
 * i TE SAME prymitywy UI z portu (`el`, `statChipBrand`, ... — ich zgodność jest w harnessach K01A/K01B/K03),
 * więc różnica wyniku pochodzi wyłącznie z ciał jednostek i z wiring-u hosta. Pin: tekst jednostki + pin-owe
 * `appendIndywidualneToggle`, `formatResourceUpkeepSummary`, `daninaLabelForCity`, stałe z `game/cities.ts`.
 * Port: `setK05bHost(fixture)` + adaptery sygnatur z k05b-host.ts.
 *
 * Porównywane: outerHTML wyniku, sekwencja wywołań hosta (cfg, rerender, openEntityCard) po symulowanych zdarzeniach
 * (`input` na suwakach, `click` na przyciskach). Wektory: 4 warianty fixture (v=0..3) × sceny.
 *
 * Mutacje portu: zmienna środowiskowa K05B_MUTANT='{"file":"k05b-podzial.ts","from":"...","to":"..."}' podmienia
 * dokładnie jedno wystąpienie `from` w pliku portu (ładowanie przez plugin esbuild, bez zmian na dysku).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):  node tools/dom-harness/run-k05b-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> 0 różnic; 1 <=> >=1 różnica; 2 <=> błąd harnessu.
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

/** Jednostki K05B partii 1 (pin-owe ciała) + pin-owe zależności, które w porcie są adapterami/dopiskami. */
const PIN_UNITS = [
  'renderEkonomiaStrip', 'appendPodzialHandlu', 'appendCitySkarbiecBalance', 'renderPodzialHandlu', 'buildTopBarZlotoDetailCard',
  'renderSplitPane', 'appendGarrisonUnitChip', 'improvementRangeRow',
  'daninaLabelForCity', 'appendIndywidualneToggle', 'formatResourceUpkeepSummary',
];

const PORT_ABS = (f) => join(CITY, f);
const probeSrc = [
  `import { el, appendDetailSection, gridDetailRow, appendDetailAlgo } from ${JSON.stringify(PORT_ABS('k01b-dom.ts'))};`,
  `import { appendDetailGrid, appendDetailFormula } from ${JSON.stringify(PORT_ABS('k03-detail.ts'))};`,
  `import { estimateHandelChips, plonyChipRowHtml } from ${JSON.stringify(PORT_ABS('k01b-f.ts'))};`,
  `import { statChipBrand, signed, HANDEL_ZAMOZNOSC_LABEL, HANDEL_KORUPCJA_PCT_PLACEHOLDER, cityPanelChipIconWrap } from ${JSON.stringify(PORT_ABS('k01a-fundament.ts'))};`,
  `import { resourceTextClass } from ${JSON.stringify(join(CITY, '..', 'resourceColors.ts'))};`,
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
  extractCityConst('HANDEL_PCT_STEP', 578),
  extractCityConst('MAX_PROCENT_NAUKA', 581),
  ...PIN_UNITS.map((n) => extractTop(n)),
  '',
].join('\n');

/** Fixture wejść: deterministyczny, zależny od wariantu v. Zwraca obiekt hosta (K05bHost) i log wywołań. */
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
    getUnlockedTechs: () => undefined,
  };
  const split = (c) => ({ procentPieniadz: 50 + v, procentNauka: 30, procentLuksus: 20 - v + (c % 3) });
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

/** Scena: wszystkie wywołania jednostek K05B dla danego wariantu; zwraca { name, html, log }. */
function scenes(v, U, F) {
  const out = [];
  const mkMount = () => document.createElement('div');
  const city = CITY_(v);
  const view = v === 2 ? null : VIEW(v);
  const data = v % 3 ? { buildings: [] } : null;
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
/** Stub renderera kart: wywołania trafiają do logu fixture (ta sama ścieżka co po stronie pinu). */
const rendererStub = {
  name: 'renderer-stub',
  setup(b) {
    b.onResolve({ filter: /entityCards\/renderer$/ }, (a) => ({ path: a.path, namespace: 'rstub' }));
    b.onLoad({ filter: /.*/, namespace: 'rstub' }, () => ({
      contents: 'export function openEntityCard(...a) { return globalThis.__K05B_FIX.openEntityCard(...a); }',
      loader: 'js',
    }));
  },
};
/** Mutacja portu w pamięci (pojedyncze wystąpienie `from`). */
const mutantPlugin = {
  name: 'k05b-mutant',
  setup(b) {
    if (!MUT) return;
    b.onLoad({ filter: /k05b-(podzial|widgety|host)\.ts$/ }, (a) => {
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
  writeFileSync(pinProbe, probeSrc);
  const pinOut = join(tmp, 'pin-out');
  // Dwa wejścia (sonda + moduł hosta), by bundler zachował nazwę pliku sondy (przy jednym wejściu nazwa się zeruje).
  await bundle([pinProbe, PORT_ABS('k05b-host.ts')], pinOut, { extraPlugins: [uiParamsStub, rendererStub] });
  // Port: pakowanie jak w pozostałych harnessach DOM (`build.mjs`: ?raw, import.meta.glob), z wtyczkami stubów.
  const v2Out = join(tmp, 'v2');
  await bundle(
    [PORT_ABS('k05b-podzial.ts'), PORT_ABS('k05b-widgety.ts'), PORT_ABS('k05b-host.ts')],
    v2Out,
    { extraPlugins: [uiParamsStub, rendererStub, mutantPlugin] },
  );

  const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
  for (const k of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLButtonElement', 'Event', 'MouseEvent', 'Node']) {
    globalThis[k] = dom.window[k] ?? globalThis[k];
  }
  globalThis.window = dom.window;
  const PIN = await import(pathToFileURL(findJs(pinOut, 'pin-probe.js')).href);
  const P_MOD = await import(pathToFileURL(findJs(v2Out, 'k05b-podzial.js')).href);
  const W_MOD = await import(pathToFileURL(findJs(v2Out, 'k05b-widgety.js')).href);
  const H_MOD = await import(pathToFileURL(findJs(v2Out, 'k05b-host.js')).href);
  const PORT = { P: P_MOD, W: W_MOD, H: H_MOD };
  const U_PORT = { ...PORT.P, ...PORT.W };
  // Pin-owe nazwy wywoływane przez jednostki K05B: fixture po stronie pinu = ten sam obiekt hosta co po stronie portu.
  const U_PIN = {
    renderEkonomiaStrip: PIN.renderEkonomiaStrip, appendPodzialHandlu: PIN.appendPodzialHandlu,
    appendCitySkarbiecBalance: PIN.appendCitySkarbiecBalance, renderPodzialHandlu: PIN.renderPodzialHandlu,
    buildTopBarZlotoDetailCard: PIN.buildTopBarZlotoDetailCard, renderSplitPane: PIN.renderSplitPane,
    appendGarrisonUnitChip: PIN.appendGarrisonUnitChip, improvementRangeRow: PIN.improvementRangeRow,
  };

  const results = [];
  for (let v = 0; v < 4; v++) {
    const fPin = mkFix(v);
    const fPort = mkFix(v);
    globalThis.__K05B_FIX = fPin.host;
    const pinScenes = scenes(v, U_PIN, { ...fPin, log: fPin.log });
    PORT.H.setK05bHost(fPort.host);
    globalThis.__K05B_FIX = fPort.host;
    const portScenes = scenes(v, U_PORT, { ...fPort, log: fPort.log });
    pinScenes.forEach((sa, i) => {
      const sb = portScenes[i];
      const ja = JSON.stringify({ html: sa.html, after: sa.after, log: sa.log });
      const jb = JSON.stringify({ html: sb.html, after: sb.after, log: sb.log });
      // Pusty wynik jest oczekiwany tylko tam, gdzie pin wychodzi wcześnie (brak `cityMoneySnap`, v=1).
      const expectEmpty = sa.name === 'appendCitySkarbiecBalance' && v === 1;
      const nonTrivial = expectEmpty ? sa.html === '' : sa.html.length > 20 && !sa.html.startsWith('THROW');
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
  }
  exitCode = bad === 0 && trivial === 0 ? 0 : 1;
} catch (e) {
  console.error('BLAD HARNESSU:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(exitCode);
