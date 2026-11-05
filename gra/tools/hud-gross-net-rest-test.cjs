'use strict';
/**
 * hud-gross-net-rest-test.cjs -- R-WEB-HUD-GROSS-NET-REST-Q1
 * Run (z gra/):  node tools/hud-gross-net-rest-test.cjs [--shots <katalog>] [--no-mutants] [--hud <plik hud.ts>]
 *
 * A (prawdziwy renderBarD1B + CSS w Chromium, motyw ciemny, 1280/1024/800/640 px, liczby male/ogromne):
 *   A1 lewy baner konczy sie PRZED medalionem Mocy (takze 640 px), A2 zaden tekst komorki nie jest przyciety,
 *   A3 brak poziomego przewijania, A4 ikony medalionow widoczne (>= 12 px), A5 dol banera <= 104 px (pasek narzedzi)
 * B tooltipy prawego banera (Kultura/Religia/Obywatele/Miasta) maja zapis BRUTTO -> NETTO ze wspolnej formatGrossNet
 * C wspolna funkcja formatGrossNet (hudChip6c.ts) -- test jednostkowy przez esbuild
 * D zrodlo: komunikat rozwiazania jednostki w main.ts uzywa formatManpowerCompact (skroty k/M jak HUD, nie "tys./mln"),
 *   karta miasta (cityPanel.ts) ma BRUTTO -> NETTO w tooltipach 6 chipow przez formatGrossNet
 * M mutacje: kazda zepsuta kopia MUSI czerwienic bramke.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const argOf = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const HUD_SRC = argOf('--hud');
const NO_MUTANTS = process.argv.includes('--no-mutants');
const CHROME = process.env.CHROMIUM || '/opt/pw-browsers/chromium';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'hud-gn-rest-'));

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}

const viteCompat = {
  name: 'vite-compat',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    b.onLoad({ filter: /\.ts$/ }, (a) => {
      const s = fs.readFileSync(a.path, 'utf8');
      if (!s.includes('import.meta.glob')) return null;
      return { contents: 'const __g=()=>({});\n' + s.replace(/import\.meta\.glob/g, '__g'), loader: 'ts', resolveDir: path.dirname(a.path) };
    });
  },
};
const LOADERS = { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' };

async function bundle(hudTsPath, outJs) {
  const entry = path.join(TMP, 'entry-' + path.basename(outJs) + '.ts');
  fs.writeFileSync(entry, `import { renderBarD1B, ensureStyles } from ${JSON.stringify(hudTsPath)};
(window as any).__r = (s: any) => { ensureStyles(); document.getElementById('r')!.innerHTML = '<div class="civ-hud">' + renderBarD1B(s) + '</div>'; const hr = document.querySelector('.hud-right'); if (hr) hr.innerHTML = '<button type="button" class="b-wiki"><span>Civpedia</span></button><button type="button" class="b-menu"><span>Menu</span></button>'; };`);
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', outfile: outJs, logLevel: 'silent', loader: LOADERS, plugins: [viteCompat] });
}

const BASE = {
  bogactwo: 999, bogactwoRate: -120, bogactwoWplywyBrutto: 480, bogactwoHandel: 82, bogactwoUtrzymanieBudynkow: 400, bogactwoUtrzymanieJednostek: 200,
  praca: 88, pracaRate: 22, pracaPrognoza: 20, pracaUpkeep: 3, pracaAutoUlepszeniaKoszt: 0, pracaCudaKoszt: 0,
  zywnoscLabel: '999', zywnoscRate: 5, zywnoscWplywMiast: 30, zywnoscKosztWojska: 25,
  nauka: 310, naukaRate: 15, kultura: 12, kulturaRate: 3, ludnosc: 12, ludnoscRate: 2, religionStock: 40, religionRate: 4,
  osiedla: 3, osiedlaMax: 6, tura: 42, epoka: 'Brąz', power: 100, handelIncome: 82, handelRouteCount: 2,
  surowceSummary: '7/9', surowceAlert: true, surowceBrutto: 120, surowceNetto: 40,
  surowceNiedoborLabels: ['Ceramika'], surowceBilans: [{ label: 'Drewno', brutto: 80, netto: 50 }, { label: 'Ceramika', brutto: 40, netto: -10 }],
  armyUnitsOnMap: 2, rekrutEkw: 5,
};
const STATES = {
  small: BASE,
  huge: { ...BASE, bogactwo: 1200000, bogactwoRate: -999900, bogactwoWplywyBrutto: 1234000, praca: 1200000, pracaRate: 1200000, zywnoscLabel: '1200000', zywnoscRate: 1200000, zywnoscWplywMiast: 1300000, nauka: 1200000, naukaRate: 1200000, handelIncome: 1200000, surowceBrutto: 1200000, surowceNetto: 1100000 },
};
const WIDTHS = [1280, 1024, 800, 640];

const MEASURE = () => {
  const cells = [...document.querySelectorAll('.civ-hud-banner-left .civ-hud-chip-cell')];
  const clip = cells.filter((c) => [...c.querySelectorAll('.civ-hud-chip-top, .civ-hud-chip-row3')].some((e) => e.scrollWidth > e.clientWidth + 0.5) || c.scrollWidth > c.clientWidth + 0.5)
    .map((c) => (c.querySelector('.civ-hud-chip-lbl') || {}).textContent);
  const med = cells.map((c) => c.querySelector('.civ-hud-chip-med').getBoundingClientRect().width);
  const sh = document.querySelector('.civ-hud-banner-left .civ-hud-banner-shell').getBoundingClientRect();
  const pc = document.querySelector('.power-center').getBoundingClientRect();
  const rs = document.querySelector('.civ-hud-banner-right');
  const rr = rs ? rs.getBoundingClientRect() : { x: 0, right: 0, width: 0, bottom: 0 };
  const rchips = rs ? [...rs.querySelectorAll('.civ-hud-chip')].map((c) => { const r = c.getBoundingClientRect(); return { x: r.x, right: r.right, w: r.width, h: r.height }; }) : [];
  const cl = document.querySelector('.hud-right-cluster');
  const clr = cl ? cl.getBoundingClientRect() : { x: 0, right: 0, bottom: 0 };
  const titles = {};
  document.querySelectorAll('.civ-hud [data-act]').forEach((e) => { titles[e.getAttribute('data-act')] = e.getAttribute('title') || ''; });
  return { n: cells.length, clip, minMed: Math.min(...med), shellRight: sh.right, shellBottom: sh.bottom, powerX: pc.x, powerRight: pc.right, rbX: rr.x, rbRight: rr.right, rbW: rr.width, rbBottom: rr.bottom, rchips, rchipClipped: rs ? rs.scrollWidth > rs.clientWidth + 0.5 : false, clX: clr.x, clRight: clr.right, clBottom: clr.bottom, btnX: (document.querySelector('.hud-right') || { getBoundingClientRect: () => ({ x: 0 }) }).getBoundingClientRect().x, btnN: document.querySelectorAll('.hud-right button').length, sw: document.documentElement.scrollWidth, vw: window.innerWidth, titles };
};

async function runChecks(chromium, jsPath, tag, shot) {
  const br = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--headless=new'] });
  const res = {};
  try {
    for (const w of WIDTHS) {
      for (const [name, st] of Object.entries(STATES)) {
        const page = await br.newPage({ viewport: { width: w, height: 200 }, colorScheme: 'dark' });
        await page.setContent('<!doctype html><html data-theme="dark"><meta charset="utf-8"><body style="margin:0;background:#1a1d24"><div id="r"></div>');
        await page.addScriptTag({ path: jsPath });
        res[w + '/' + name] = await page.evaluate(({ s, fn }) => { window.__r(s); return (new Function('return ' + fn))()(); }, { s: st, fn: MEASURE.toString() });
        if (SHOTS && shot) await page.screenshot({ path: path.join(SHOTS, `${tag}-${name}-${w}.png`), clip: { x: 0, y: 0, width: w, height: 125 } });
        await page.close();
      }
    }
  } finally { await br.close(); }
  return res;
}

function assertRender(res, label) {
  for (const w of WIDTHS) {
    for (const n of Object.keys(STATES)) {
      const m = res[w + '/' + n];
      ok(m.n === 6, `${label} ${w}px/${n}: 6 komorek banera`, m.n);
      ok(m.shellRight <= m.powerX + 0.5, `${label} ${w}px/${n}: baner (prawy brzeg ${Math.round(m.shellRight)}) konczy sie przed medalionem Mocy (x=${Math.round(m.powerX)})`);
      ok(m.clip.length === 0, `${label} ${w}px/${n}: zaden tekst komorki nie jest przyciety`, m.clip);
      ok(m.sw <= m.vw, `${label} ${w}px/${n}: brak poziomego przewijania`, { sw: m.sw, vw: m.vw });
      // R-WEB-HUD-TOPBAR-NO-LABELS-Q1: ≤700 px medalion baneru 9 px (zamiast 12) — kolumny 1fr musza
      // zmiescic „wartosc + dwa przyrosty" w ~50 px przy 640 px (baner 170 px). Prog 9 px dla ≤700 px.
      const medMin = 12;
      ok(m.minMed >= medMin, `${label} ${w}px/${n}: ikony medalionow widoczne (min ${m.minMed}px, prog ${medMin})`);
      // prawy baner (r2): wszystkie 5 chipow w obrebie banera i ekranu, baner nie wchodzi na Moc, nie jest zwezony do paska
      ok(m.rchips.length === 5, `${label} ${w}px/${n}: prawy baner ma 5 chipow`, m.rchips.length);
      ok(m.rbW >= 100, `${label} ${w}px/${n}: prawy baner nie zwezony do paska (szer. ${Math.round(m.rbW)}px >= 100)`);
      ok(m.rchips.every((c) => c.right <= m.rbRight + 0.5 && c.right <= m.vw + 0.5 && c.x >= 0), `${label} ${w}px/${n}: chipy prawego banera widoczne w banerze i na ekranie`, m.rchips.map((c) => [Math.round(c.x), Math.round(c.right)]));
      ok(m.rbX >= m.powerRight - 0.5 || m.rbX >= m.shellRight + 0.5 && m.rbBottom <= 0, `${label} ${w}px/${n}: prawy baner (x=${Math.round(m.rbX)}) nie nachodzi na medalion Mocy (prawy brzeg ${Math.round(m.powerRight)})`);
      ok(m.btnN === 2 && m.clBottom <= 160, `${label} ${w}px/${n}: klaster z przyciskami Civpedia+Menu (zasymulowane) konczy sie na y=${Math.round(m.clBottom)} <= 160`, m.clBottom);
      ok(m.shellBottom <= 104, `${label} ${w}px/${n}: dol banera (${Math.round(m.shellBottom)}px) nad paskiem narzedzi (104)`);
    }
  }
  const t = res['1280/small'].titles;
  for (const [act, unit] of [['kultura', 'Kultury'], ['religia', 'wiernych'], ['ludnosc', 'obyw.'], ['miasta', 'obyw.']]) {
    const x = t[act] || '';
    ok(/BRUTTO [+−-]?\d+ → NETTO [+−-]?\d+/.test(x) && x.includes(unit), `${label}: tooltip "${act}" ma zapis BRUTTO -> NETTO (${unit})`, x.slice(0, 160));
  }
}

async function unitFormat() {
  const entry = path.join(TMP, 'fmt.ts');
  fs.writeFileSync(entry, `import { formatGrossNet } from ${JSON.stringify(path.join(GRA, 'src/ui/hudChip6c.ts'))};
(globalThis as any).__f = formatGrossNet;`);
  const out = path.join(TMP, 'fmt.js');
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent', loader: LOADERS, plugins: [viteCompat] });
  require(out);
  const f = globalThis.__f;
  ok(typeof f === 'function', 'C: hudChip6c eksportuje formatGrossNet');
  ok(f(12, 9, 'pkt Pracy/turę') === 'BRUTTO +12 → NETTO +9 pkt Pracy/turę', 'C: konwencja "BRUTTO +12 -> NETTO +9 jednostka"', f(12, 9, 'pkt Pracy/turę'));
  const neg = f(5, -3);
  ok(/^BRUTTO \+5 → NETTO [−-]3$/.test(neg), 'C: ujemne netto ze znakiem minus, brak jednostki', neg);
}

function sourceChecks(files, label) {
  const { main, city, chip } = files;
  ok(/rozwiązany — \+' \+ formatManpowerCompact\(mpRefund\)/.test(main), `${label} D: komunikat rozwiazania jednostki uzywa formatManpowerCompact (skroty k/M jak HUD)`);
  ok(!/formatManpower\(mpRefund\)/.test(main), `${label} D: brak starego formatManpower("tys./mln") w komunikacie`);
  ok(/export function formatGrossNet\(/.test(chip), `${label} D: formatGrossNet wyeksportowana z hudChip6c.ts`);
  const n = (city.match(/formatGrossNet\(/g) || []).length;
  ok(n >= 10, `${label} D: karta miasta uzywa formatGrossNet w tooltipach 6 chipow (wywolan: ${n}, >= 10)`, n);
  for (const [k, ic] of [['Praca', 'res-work'], ['Żywność', 'res-food'], ['Skarbiec', 'res-treasury'], ['Nauka', 'res-science'], ['Kultura', 'res-culture'], ['Religia', 'res-religion']]) {
    const i = city.indexOf(`w3CityChip(\n      cityPanelChipIcon('${ic}', 20),\n      '${k}',`);
    const seg = i > -1 ? city.slice(i, i + 1800) : '';
    ok(i > -1 && /formatGrossNet\(/.test(seg), `${label} D: chip "${k}" w karcie miasta ma BRUTTO -> NETTO`);
  }
}

async function mutants(chromium) {
  const hudPath = HUD_SRC || path.join(GRA, 'src/ui/hud.ts');
  const hud = fs.readFileSync(hudPath, 'utf8');
  const HM = [
    ['szerokosc banera siega pod medalion Mocy (R-WEB-HUD-TOPBAR-NO-LABELS-Q1: calc(50vw - 150px) -> calc(50vw - 40px))', (s) => s.replace('.civ-hud .civ-hud-banner-left{width:calc(50vw - 150px);max-width:calc(50vw - 150px);}', '.civ-hud .civ-hud-banner-left{width:calc(50vw - 40px);max-width:calc(50vw - 40px);}')],
    ['medalion Mocy nie zmniejszony <=700 px', (s) => s.replace('.civ-hud .power-center{min-width:150px;', '.civ-hud .power-center{min-width:240px;')],
    ['prawy baner: stare max-width bez min 150 px i bez zawijania (zwezony pasek/chipy poza ekranem)', (s) => s.replace('max-width:max(150px,min(calc(50vw - 352px),780px));}\n.civ-hud .civ-hud-banner-right .hud-chip-row{flex-wrap:wrap;', 'max-width:min(calc(50vw - 340px),780px);}\n.civ-hud .civ-hud-banner-right .hud-chip-row{flex-wrap:nowrap;')],
    ['prawy baner: brak ukladu kolumnowego <=1100 px (nachodzi na Moc)', (s) => s.replace('.civ-hud .hud-right-cluster{flex-direction:column-reverse;', '.civ-hud .hud-right-cluster{flex-direction:row;')],
    ['Kultura bez BRUTTO -> NETTO', (s) => s.replace("${formatGrossNet(rate, rate, 'pkt Kultury/turę')}", 'Zielone ${signed(rate)}')],
    ['Religia bez BRUTTO -> NETTO', (s) => s.replace("${formatGrossNet(rate, rate, 'wiernych/turę')}", 'Zielone ${signed(rate)}')],
    ['Obywatele bez BRUTTO -> NETTO', (s) => s.replace("${formatGrossNet(rate, rate, 'obyw./turę')} (HUD nie", 'Zielone ${signed(rate)} (HUD nie')],
  ];
  for (const [name, fn] of HM) {
    const m = fn(hud);
    if (m === hud) { ok(false, `MUTANT "${name}": zamiana nie zadzialala`); continue; }
    const mutPath = path.join(GRA, 'src/ui/hud.__mut.ts');
    fs.writeFileSync(mutPath, m);
    try {
      const js = path.join(TMP, 'mut.js');
      await bundle(mutPath, js);
      const before = fails; const log = console.log; console.log = () => {};
      let mf;
      try { assertRender(await runChecks(chromium, js, 'mut', false), 'mut'); } finally { console.log = log; mf = fails - before; fails = before; }
      ok(mf > 0, `MUTANT "${name}" WYKRYTY (${mf} czerwonych asercji)`);
    } finally { try { fs.unlinkSync(mutPath); } catch (_) { /* best-effort */ } }
  }
  const base = {
    main: fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8'),
    city: fs.readFileSync(path.join(GRA, 'src/ui/cityPanel.ts'), 'utf8'),
    chip: fs.readFileSync(path.join(GRA, 'src/ui/hudChip6c.ts'), 'utf8'),
  };
  const SM = [
    ['main.ts: stary formatManpower w komunikacie', { ...base, main: base.main.replace('formatManpowerCompact(mpRefund) + \' rekrut', 'formatManpower(mpRefund) + \' rekrut') }],
    ['cityPanel.ts: Kultura bez BRUTTO', { ...base, city: base.city.split("formatGrossNet(chip.kultura.").join("String(chip.kultura.") }],
    ['cityPanel.ts: Praca bez BRUTTO', { ...base, city: base.city.split('formatGrossNet(').join('String(') }],
  ];
  for (const [name, files] of SM) {
    const changed = Object.keys(files).some((k) => files[k] !== base[k]);
    if (!changed) { ok(false, `MUTANT "${name}": zamiana nie zadzialala`); continue; }
    const before = fails; const log = console.log; console.log = () => {};
    let mf;
    try { sourceChecks(files, 'mut'); } finally { console.log = log; mf = fails - before; fails = before; }
    ok(mf > 0, `MUTANT "${name}" WYKRYTY (${mf} czerwonych asercji)`);
  }
}

(async () => {
  let chromium;
  try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); } catch (e) { console.log('FAIL brak playwright'); process.exit(1); }
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  console.log('[A,B] render prawdziwego renderBarD1B + CSS w Chromium (ciemny motyw)');
  const js = path.join(TMP, 'real.js');
  await bundle(HUD_SRC || path.join(GRA, 'src/ui/hud.ts'), js);
  { const R = await runChecks(chromium, js, argOf('--tag') || 'po', true); if (process.env.DUMP) for (const k of Object.keys(R)) { const m = R[k]; console.log(k, 'power', Math.round(m.powerX), Math.round(m.powerRight), 'rb', Math.round(m.rbX), Math.round(m.rbRight), 'bottom', Math.round(m.rbBottom), 'cl', Math.round(m.clX), JSON.stringify(m.rchips.map((c) => [Math.round(c.x), Math.round(c.w), Math.round(c.h)]))); } assertRender(R, 'real'); }
  if (!HUD_SRC) {
    console.log('[C] formatGrossNet'); await unitFormat();
    console.log('[D] zrodla');
    sourceChecks({
      main: fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8'),
      city: fs.readFileSync(path.join(GRA, 'src/ui/cityPanel.ts'), 'utf8'),
      chip: fs.readFileSync(path.join(GRA, 'src/ui/hudChip6c.ts'), 'utf8'),
    }, 'real');
    if (!NO_MUTANTS) { console.log('[M] mutacje'); await mutants(chromium); }
  }
})().catch((e) => { fails++; console.log('  FAIL wyjatek: ' + (e && e.stack || e)); }).finally(() => {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* best-effort */ }
  console.log(`\n${fails ? 'FAIL' : 'OK'}: hud-gross-net-rest-test (${passes} ok, ${fails} fail)`);
  process.exit(fails ? 1 : 0);
});
