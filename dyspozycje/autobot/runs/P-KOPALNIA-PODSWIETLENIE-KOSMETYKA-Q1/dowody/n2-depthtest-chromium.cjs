'use strict';
/**
 * n2-depthtest-chromium.cjs — P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1, uwaga N2.
 *
 * PYTANIE N2 (Evaluator): `depthTest:false` maluje warstwę podświetlenia kopalni PRZEZ bryłę
 * terenu GLOBALNIE — heks zasłonięty grzbietem góry i tak dostaje krążek, a modele jednostek
 * stojących na podświetlonym terenie dostają niebieską poświatę od spodu. Czy istnieje wariant
 * celowany, który zachowuje widoczność pod bryłą BEZ globalnego wyłączenia testu głębi?
 *
 * DLACZEGO ŻYWY CHROMIUM, NIE ROZUMOWANIE: R-PROC-AUTOBOT §9 poz. 6b — temat wizualny bez
 * realnej weryfikacji w przeglądarce jest FAIL. `depthTest` jest flagą materiału WebGL;
 * jej skutek istnieje wyłącznie w rasteryzatorze, więc jsdom i test kontraktowy mogą co
 * najwyżej potwierdzić, że flaga ma zadaną wartość — nie co gracz zobaczy.
 *
 * CO JEST MIERZONE (nie deklarowane): scena z PRODUKCYJNEJ geometrii —
 *   `wzgorzeGeometria`/`goraGeometria` + `wariantDlaHeksa`/`rotacjaDlaHeksa`
 *   (src/render/teren-gory-wzgorza.ts, ta sama, którą `scene.ts` instancjonuje na mapie),
 *   `terrainSurfaceTopY` (src/render/mapRenderStyle.ts) i `buildRangeOverlayGroup`
 *   (src/render/rangeOverlay.ts) — renderowana realnym WebGL w headless Chromium.
 *
 * DWA WARIANTY, JEDNA SCENA I JEDNA KAMERA:
 *   PRZED = historyczne `alwaysOnTop` (b0f9bcb9): płaski krążek 0,97·HEX_R + `depthTest=false`
 *           na materiałach + renderOrder 8/9 — dokładnie to, co robiło `applyAlwaysOnTop()`.
 *   PO    = stan HEAD: `MINE_ELIGIBLE_STYLE` z `hugTerrainRelief:true` (siatka oblekająca
 *           bryłę, `depthTest` domyślne `true`, `polygonOffset`).
 *
 * POMIAR (różnicowy, bez heurystyk kolorystycznych): dla każdego wariantu renderowane są
 * dwa ujęcia tej samej sceny — BEZ warstwy i Z warstwą. Piksel, który się zmienił, to piksel
 * pomalowany przez warstwę. Maski regionów pochodzą z osobnego przebiegu ID (jednostka na
 * czysto czerwono, góra-przesłona na czysto zielono), więc przypisanie piksela do regionu
 * nie zależy od koloru tinta.
 *
 *   REGION U (jednostka)  — pikseli warstwy > 0 znaczy „poświata na modelu jednostki".
 *   REGION G (góra-przesłona, heks NIEpodświetlony, stoi między kamerą a podświetlonym
 *             heksem D) — pikseli warstwy > 0 znaczy „warstwa przebija przez bryłę terenu".
 *   WIDOCZNOŚĆ — łączna liczba pikseli warstwy; wariant, który niczego nie pokazuje,
 *             jest bezużyteczny niezależnie od czystości przesłaniania.
 *
 * Zrzuty PRZED/PO zapisywane obok, w tym samym katalogu `dowody/`.
 *
 * Uruchamianie (z katalogu gra/):
 *   node ../dyspozycje/autobot/runs/P-KOPALNIA-PODSWIETLENIE-KOSMETYKA-Q1/dowody/n2-depthtest-chromium.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const GRA = path.resolve(__dirname, '..', '..', '..', '..', '..', 'gra');
const OUT_DIR = __dirname;

const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[n2] playwright niedostępny:', e.message);
  process.exit(1);
}
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// ── 1. Bundle produkcyjnych modułów do przeglądarki ─────────────────────────────
// stdin + resolveDir: nic nie ląduje w drzewie repo (ani na chwilę), więc bramka nie
// może zostawić po sobie śladu w `git status` nawet po zabiciu procesu.
const ENTRY_SRC = `
import * as THREE from 'three';
import { buildRangeOverlayGroup, MINE_ELIGIBLE_STYLE } from '../src/render/rangeOverlay';
import {
  wzgorzeGeometria, goraGeometria, wariantDlaHeksa, rotacjaDlaHeksa,
  TEREN_MATERIAL, LICZBA_WARIANTOW_TERENU,
  WZGORZE_FOOTPRINT_R, GORA_FOOTPRINT_R, WZGORZE_SZCZYT_Y, GORA_APEX_Y,
} from '../src/render/teren-gory-wzgorza';
import { terrainSurfaceTopY, GAME_MAP_RENDER_STYLE } from '../src/render/mapRenderStyle';
import { axialToWorld, HEX_R } from '../src/render/hexutil';
import { TerenBazowy } from '../src/types/hex';
window.H = {
  THREE, buildRangeOverlayGroup, MINE_ELIGIBLE_STYLE,
  wzgorzeGeometria, goraGeometria, wariantDlaHeksa, rotacjaDlaHeksa,
  TEREN_MATERIAL, LICZBA_WARIANTOW_TERENU,
  WZGORZE_FOOTPRINT_R, GORA_FOOTPRINT_R, WZGORZE_SZCZYT_Y, GORA_APEX_Y,
  terrainSurfaceTopY, GAME_MAP_RENDER_STYLE, axialToWorld, HEX_R, TerenBazowy,
};
`;

const built = esbuild.buildSync({
  stdin: { contents: ENTRY_SRC, resolveDir: path.join(GRA, 'tools'), loader: 'ts' },
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  write: false,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});
const BUNDLE_JS = built.outputFiles[0].text;

// ── 2. Strona z realną sceną WebGL ─────────────────────────────────────────────
const PAGE_JS = String.raw`
const W = 900, HGT = 640;

function makeScene(H, opts) {
  const T = H.THREE;
  const scene = new T.Scene();
  scene.background = new T.Color(0x223344);
  const cam = new T.PerspectiveCamera(38, W / HGT, 0.1, 200);
  // Kamera nisko nad horyzontem — dokładnie ten kadr, w którym grzbiet góry realnie
  // przesłania heks za nim (przy widoku z góry nic by nie przesłaniało i pomiar
  // byłby fałszywie zielony dla obu wariantów).
  cam.position.set(0.2, 2.35, 6.4);
  cam.lookAt(0.2, 0.35, 0.2);
  scene.add(new T.AmbientLight(0xffffff, 0.75));
  const dl = new T.DirectionalLight(0xffffff, 0.75); dl.position.set(4, 8, 5); scene.add(dl);

  // Heksy: A/B/D kwalifikują się pod kopalnię, C to GÓRA-PRZESŁONA (niepodświetlona),
  // stojąca między kamerą a podświetlonym heksem D.
  const TB = H.TerenBazowy;
  const plan = [
    { key: '0,0',  q: 0,  r: 0,  teren: TB.Wzgorza, lit: true  },  // A — wzgórze, na nim jednostka
    { key: '-1,0', q: -1, r: 0,  teren: TB.Gory,    lit: true  },  // B — góra podświetlona
    { key: '0,1',  q: 0,  r: 1,  teren: TB.Gory,    lit: false },  // C — GÓRA-PRZESŁONA
    { key: '0,-1', q: 0,  r: -1, teren: TB.Wzgorza, lit: true  },  // D — za przesłoną C
    { key: '1,-1', q: 1,  r: -1, teren: TB.Gory,    lit: true  },  // E — góra podświetlona
  ];
  const hexes = {};
  for (const p of plan) hexes[p.key] = { coords: { q: p.q, r: p.r }, terenBazowy: p.teren };
  const map = { hexes, seed: 7 };

  const litKeys = new Set(plan.filter((p) => p.lit).map((p) => p.key));
  const maskTargets = [];

  for (const p of plan) {
    const { x, z } = H.axialToWorld(p.q, p.r, H.HEX_R);
    const topY = H.terrainSurfaceTopY(p.teren, H.GAME_MAP_RENDER_STYLE, 0);
    // Pryzm heksa od y=0 do topY — jak w scene.ts (walec 6-boczny o promieniu HEX_R).
    const prism = new T.Mesh(
      new T.CylinderGeometry(H.HEX_R, H.HEX_R, Math.max(topY, 0.04), 6),
      new T.MeshLambertMaterial({ color: p.teren === TB.Gory ? 0x7d7f86 : 0x5f8f4a, flatShading: true }),
    );
    prism.position.set(x, Math.max(topY, 0.04) / 2, z);
    scene.add(prism);

    // Bryła reliefu — PRODUKCYJNA geometria, wariant i rotacja jak w scene.ts (skala 1, R=1).
    const v = H.wariantDlaHeksa(p.q, p.r, H.LICZBA_WARIANTOW_TERENU, map.seed);
    const geo = p.teren === TB.Gory ? H.goraGeometria(v) : H.wzgorzeGeometria(v);
    const relief = new T.Mesh(geo, H.TEREN_MATERIAL);
    relief.position.set(x, topY, z);
    relief.rotation.y = H.rotacjaDlaHeksa(p.q, p.r, map.seed);
    scene.add(relief);
    if (p.key === '0,1') maskTargets.push({ obj: relief, mask: 0x00ff00 });  // REGION G
  }

  // Jednostka na podświetlonym wzgórzu A — proxy o gabarycie żetonu jednostki.
  const unit = new T.Mesh(
    new T.BoxGeometry(0.34, 0.62, 0.34),
    new T.MeshLambertMaterial({ color: 0xdddddd, flatShading: true }),
  );
  const a = H.axialToWorld(0, 0, H.HEX_R);
  unit.position.set(a.x + 0.12, H.terrainSurfaceTopY(TB.Wzgorza, H.GAME_MAP_RENDER_STYLE, 0) + H.WZGORZE_SZCZYT_Y + 0.31, a.z + 0.10);
  scene.add(unit);
  maskTargets.push({ obj: unit, mask: 0xff0000 });  // REGION U

  // ── Warstwa podświetlenia ──
  let overlay = null;
  if (opts.variant === 'po') {
    overlay = H.buildRangeOverlayGroup(map, litKeys, H.MINE_ELIGIBLE_STYLE);
  } else if (opts.variant === 'przed') {
    // Rekonstrukcja historycznego alwaysOnTop (b0f9bcb9): ten sam builder, ale ŚCIEŻKA
    // PŁASKA (bez hugTerrainRelief) + depthTest=false i renderOrder 8/9 — czyli 1:1 to,
    // co robiła usunięta funkcja applyAlwaysOnTop().
    const flat = Object.assign({}, H.MINE_ELIGIBLE_STYLE);
    delete flat.hugTerrainRelief;
    overlay = H.buildRangeOverlayGroup(map, litKeys, flat);
    overlay.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      for (const m of mats) m.depthTest = false;
      if (o.isMesh) o.renderOrder = 8;
      if (o.isLineSegments) o.renderOrder = 9;
    });
  }
  return { scene, cam, overlay, maskTargets };
}

window.__run = function (variantName) {
  const H = window.H, T = H.THREE;
  const canvas = document.getElementById('gl');
  const renderer = new T.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, HGT, false);

  const built = makeScene(H, { variant: variantName });
  const { scene, cam, overlay, maskTargets } = built;

  const c2 = document.createElement('canvas'); c2.width = W; c2.height = HGT;
  const ctx = c2.getContext('2d', { willReadFrequently: true });
  const grab = () => { ctx.clearRect(0, 0, W, HGT); ctx.drawImage(canvas, 0, 0); return ctx.getImageData(0, 0, W, HGT).data; };

  // (1) BEZ warstwy
  const noOverlay = (() => { renderer.render(scene, cam); return grab(); })();

  // (2) MASKI regionów — wszystko czarne (MeshBasic, bez światła), regiony w czystym kolorze
  const saved = [];
  scene.traverse((o) => { if (o.isMesh || o.isLineSegments) { saved.push([o, o.material]); o.material = new T.MeshBasicMaterial({ color: 0x000000 }); } });
  for (const t of maskTargets) t.obj.material = new T.MeshBasicMaterial({ color: t.mask });
  const bg = scene.background; scene.background = new T.Color(0x000000);
  renderer.render(scene, cam);
  const maskPix = grab();
  scene.background = bg;
  for (const [o, m] of saved) o.material = m;

  // (3) Z warstwą
  let withOverlay = noOverlay;
  if (overlay) { scene.add(overlay); renderer.render(scene, cam); withOverlay = grab(); }

  // Zliczanie pikseli zmienionych przez warstwę, w podziale na regiony.
  let paintedTotal = 0, paintedUnit = 0, paintedMountain = 0, unitPx = 0, mountainPx = 0;
  for (let i = 0; i < noOverlay.length; i += 4) {
    const isUnit = maskPix[i] > 120 && maskPix[i + 1] < 80;
    const isMnt  = maskPix[i + 1] > 120 && maskPix[i] < 80;
    if (isUnit) unitPx++;
    if (isMnt) mountainPx++;
    const d = Math.abs(noOverlay[i] - withOverlay[i])
            + Math.abs(noOverlay[i + 1] - withOverlay[i + 1])
            + Math.abs(noOverlay[i + 2] - withOverlay[i + 2]);
    if (d > 8) {
      paintedTotal++;
      if (isUnit) paintedUnit++;
      if (isMnt) paintedMountain++;
    }
  }
  // Ostatni render zostaje na ekranie do zrzutu. Renderujemy BEZWARUNKOWO: materiały
  // i tło są już przywrócone po przebiegu masek, więc dla wariantów 'przed'/'po' na
  // ekranie ląduje pełna scena z warstwą, a dla wariantu 'brak' (overlay === null) —
  // czysta scena referencyjna. Bez tego renderu zrzut wariantu 'brak' pokazywał
  // ostatni przebieg MASEK ID, a nie scenę referencyjną (zarzut 1 Evaluatora, runda 1).
  renderer.render(scene, cam);
  return { variant: variantName, paintedTotal, paintedUnit, unitPx, paintedMountain, mountainPx };
};
`;

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#111}canvas{display:block}
</style></head><body><canvas id="gl" width="900" height="640"></canvas>
<script>${BUNDLE_JS}<\/script><script>${PAGE_JS}<\/script></body></html>`;

// ── 3. Uruchomienie ────────────────────────────────────────────────────────────
(async () => {
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--no-sandbox'];
  let browser;
  try { browser = await chromium.launch({ args }); }
  catch (e) {
    if (!fs.existsSync(FALLBACK_CHROME)) { console.error('[n2] brak Chromium:', e.message); process.exit(1); }
    browser = await chromium.launch({ executablePath: FALLBACK_CHROME, args });
  }
  const page = await browser.newPage({ viewport: { width: 960, height: 700 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

  const tmpHtml = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'n2-kopalnia-')), 'n2.html');
  fs.writeFileSync(tmpHtml, HTML, 'utf8');
  await page.goto('file://' + tmpHtml, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.H && !!window.__run, undefined, { timeout: 120000 });

  const out = {};
  for (const v of ['przed', 'po']) {
    out[v] = await page.evaluate((vv) => window.__run(vv), v);
    const shot = path.join(OUT_DIR, v === 'przed'
      ? 'n2-przed-depthtest-false.png'
      : 'n2-po-hugterrainrelief.png');
    await page.locator('#gl').screenshot({ path: shot });
    console.log(`[n2] zrzut: ${shot}`);
  }
  // Scena referencyjna bez warstwy (overlay === null) — kontrola, że przesłona i jednostka
  // są tam, gdzie mają być. __run kończy bezwarunkowym renderem przywróconych materiałów,
  // więc zrzut trzyma scenę referencyjną, a nie przebieg masek ID.
  await page.evaluate(() => window.__run('brak'));
  await page.locator('#gl').screenshot({ path: path.join(OUT_DIR, 'n2-scena-bez-warstwy.png') });

  await browser.close();
  if (errs.length) console.log('[n2] BŁĘDY STRONY:', errs.slice(0, 5));

  const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : '0.0');
  console.log('\n=== POMIAR N2 (żywy Chromium, WebGL) ===');
  for (const v of ['przed', 'po']) {
    const m = out[v];
    console.log(`${v.toUpperCase().padEnd(6)} | warstwa maluje ${String(m.paintedTotal).padStart(6)} px |`
      + ` na jednostce ${String(m.paintedUnit).padStart(5)}/${String(m.unitPx).padEnd(5)} (${pct(m.paintedUnit, m.unitPx)}%) |`
      + ` na górze-przesłonie ${String(m.paintedMountain).padStart(6)}/${String(m.mountainPx).padEnd(6)} (${pct(m.paintedMountain, m.mountainPx)}%)`);
  }
  const p = out.przed, o = out.po;
  const czysty = o.paintedUnit === 0 && o.paintedMountain === 0;
  const widoczny = o.paintedTotal > 0;
  console.log('\nWERDYKT:');
  console.log(`  artefakt N2 w wariancie PRZED: ${p.paintedUnit > 0 || p.paintedMountain > 0 ? 'POTWIERDZONY' : 'NIE odtworzony'}`);
  console.log(`  wariant PO — przesłanianie czyste: ${czysty ? 'TAK' : 'NIE'}; warstwa nadal widoczna: ${widoczny ? 'TAK' : 'NIE'}`);
  console.log(`  utrzymana widoczność PO/PRZED: ${p.paintedTotal ? ((o.paintedTotal / p.paintedTotal) * 100).toFixed(0) : '—'}%`);
  process.exit(czysty && widoczny ? 0 : 1);
})();
