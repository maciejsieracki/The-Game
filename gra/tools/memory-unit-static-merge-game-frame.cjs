'use strict';
/**
 * memory-unit-static-merge-game-frame.cjs -- R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1: PELNA klatka gry (1600x1000, realny
 * bundle vite, `?playtest=mapa`, deterministyczny Math.random, zegar strony Playwright `page.clock`) w dwoch buildach:
 * A = przed tematem, B = ze scaleniem. KAZDY build uruchamiany DWA razy (A1, A2, B1, B2), zeby zmierzyc szum
 * (A1 vs A2, B1 vs B2) i pokazac, ze surowa miara "dowolny kanal rozny" jest na tej klatce sensowna.
 *
 * Kadry (wszystkie w realnej grze, realny UnitRenderer, realna petla renderu main.ts):
 *   K1 start       -- domyslna kamera po starcie;
 *   K2 zblizenie   -- 8 krokow kolkiem myszy na srodek ekranu;
 *   K3 wiele       -- + 60 dodatkowych zetonow (gracz i obca cywilizacja na przemian, `placeUnitAt`), kamera
 *                     ustawiona na zeton, ktory potem maszeruje (`__frozenTestDebug.focus`, dlatego URL ma `&civTest=1`);
 *   K4 marsz       -- REALNY ruch o 1 heks (`moveStep` -> startAnimatedMove -> setTokenWorldPosition w petli
 *                     renderu), klatka po 48 ms czasu gry (odcinek trwa 140 ms -- zeton w drodze miedzy heksami);
 *   K5 po marszu   -- jw. po kolejnych 600 ms (animacja zakonczona, zeton na nowym heksie; zegar wznowiony).
 * Od K3 zegar strony jest zatrzymany (`page.clock.pauseAt`) i petla renderu idzie tylko krokami `runFor`.
 *
 * Miary dla kazdego kadru: `any` = piksele, w ktorych DOWOLNY kanal rozni sie o > 0 (miara z dispatchu i z S3),
 * `over8` = > 8/255, `maxChannelDiff`.
 *   F0 -- szum A1 vs A2 i B1 vs B2 raportowany; warunek: szum przelacza sie miedzy tymi samymi stanami (AvA == BvB
 *         albo jedno z nich 0). Zmierzone zrodlo szumu: K1 313 px w kwadracie 20x20 px (x 539-559, y 439-459),
 *         maks. 2/255 -- w czesci przebiegow, takze A1 vs A2 (ten sam build); w przebiegu koncowym 0. Podpowiedz DOM `#civ-hint-toast` (znika po 18 s
 *         czasu strony, zaleznie od dlugosci ladowania; 55 414 px) jest schowana stylem przed kadrami;
 *   F1..F5 -- A vs B: `any` <= LIMIT (domyslnie 120 z 1,6 mln) SUROWO w najblizszej z 4 par przebiegow (A1/A2 x B1/B2)
 *         ORAZ A1 vs B1 poza maska szumu (suma pikseli roznych w A1 vs A2 i B1 vs B2) <= LIMIT.
 * Zrzuty przed/po/roznica = najblizsza para przebiegow.
 * Zrzuty (--shots): gra-K<n>-A-przed.png, gra-K<n>-B-po.png, gra-K<n>-roznica.png (magenta = dowolna roznica).
 *
 * Usage: node tools/memory-unit-static-merge-game-frame.cjs --a <dist A> --b <dist B> [--shots <katalog>] [--limit 120]
 *        [--cache <katalog> [--only A1,A2,B1,B2]]
 * Jeden przebieg (programowy GL) trwa ok. 3 min; z --cache kazdy przebieg zapisuje zrzuty/meta do katalogu i jest
 * pomijany, gdy juz tam jest. `--only` wykonuje tylko wskazane przebiegi i konczy (EXIT=3, CZESCIOWY) -- tak dzieli sie
 * caly test na kilka wywolan; ostatnie wywolanie bez --only porownuje komplet z cache.
 */
const path = require('path');
const fs = require('fs');
const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const A = opt('a'); const B = opt('b'); const SHOTS = opt('shots'); const LIMIT = Number(opt('limit') || '120');
if (!A || !B) { console.error('podaj --a <dist> --b <dist>'); process.exit(2); }
const GRA = path.resolve(__dirname, '..');
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const { PNG } = require(path.join(GRA, 'node_modules', 'pngjs'));
const W = 1600; const H = 1000; const EXTRA = 60;
const KADRY = ['K1', 'K2', 'K3', 'K4', 'K5'];
const OPIS = { K1: 'start', K2: 'zblizenie', K3: 'wiele zetonow', K4: 'marsz (w polowie)', K5: 'po marszu' };
let pass = 0; let fail = 0;
const ok = (label, cond, d) => { if (cond) { pass++; console.log('  OK  ' + label + ' -- ' + JSON.stringify(d)); } else { fail++; console.error(' FAIL ' + label + ' -- ' + JSON.stringify(d)); } };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function frames(browser, dist) {
  const T0 = Date.now(); const lg = (m) => console.log('  [' + path.basename(dist) + '] ' + m + ' ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.addInitScript(() => { let s = 12345; Math.random = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; }; });
  await page.goto('file://' + path.join(path.resolve(dist), 'index.html') + '?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__fortTerritoryTestDebug && window.__fortTerritoryTestDebug.state().citiesLen > 0, undefined, { timeout: 180000 });
  await wait(3000);
  // Podpowiedz DOM `#civ-hint-toast` ("PLAYTEST MAPA", showHintMessage 18 s) znika wg czasu zaleznego od dlugosci
  // ladowania -- w pierwszej wersji K3-K5 dawala szum 55 414 px (A1 vs A2) i rozjazd A/B. To element UI bez zwiazku
  // z zetonami: chowamy go stylem (visibility:hidden) przed wszystkimi kadrami.
  await page.addStyleTag({ content: '#civ-hint-toast{visibility:hidden !important}' });
  const hintHidden = await page.evaluate(() => { const e = document.getElementById('civ-hint-toast'); return !!e && getComputedStyle(e).visibility === 'hidden'; });
  const out = {};
  // zrzut przez CDP (Page.captureScreenshot): page.screenshot() czeka na requestAnimationFrame, ktory przy
  // zatrzymanym zegarze strony (K4/K5) nie nadchodzi
  const cdp = await page.context().newCDPSession(page);
  const shot = async () => Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64');
  out.K1 = await shot(); lg('K1');
  await page.mouse.move(W / 2, H / 2);
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -240); await wait(150); }
  await wait(2500);
  out.K2 = await shot(); lg('K2');
  // od tego miejsca zegar strony zatrzymany (K3 bez zatrzymania mial szum A1 vs A2 ~55 tys. px: nowe zetony
  // pojawiaja sie w zaleznosci od czasu rzeczywistego); petla renderu idzie tylko krokami runFor
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1000);
  await page.clock.runFor(200);
  // K3: blob zetonow wokol miasta gracza (BFS po wolnych sasiadach ladowych), wlasciciele na przemian
  const info = await page.evaluate((n) => {
    const d = window.__fortTerritoryTestDebug; const st = d.state();
    const owners = [st.myOwnerId, st.foreignOwnerId == null ? st.myOwnerId : st.foreignOwnerId];
    const frontier = [{ q: st.myCity.q, r: st.myCity.r }]; const ids = []; let guard = 0;
    while (ids.length < n && frontier.length && guard++ < 2000) {
      const c = frontier[0]; const nb = d.landNeighbor(c.q, c.r);
      if (!nb) { frontier.shift(); continue; }
      const owner = owners[ids.length % 2];
      const id = d.placeUnitAt(owner, nb.q, nb.r, false);
      if (!id) break;
      ids.push({ id, q: nb.q, r: nb.r, owner }); frontier.push(nb);
    }
    return { placed: ids.length, ids, city: st.myCity, my: st.myOwnerId };
  }, EXTRA);
  // zeton do marszu: pierwszy z bloba z wolnym sasiadem ladowym; kamera na niego (realny camCtrl.focusAt)
  const cand = await page.evaluate((list) => {
    const d = window.__fortTerritoryTestDebug;
    for (const u of list) { const nb = d.landNeighbor(u.q, u.r); if (nb) return { id: u.id, q: u.q, r: u.r, to: nb }; }
    return null;
  }, info.ids);
  if (cand) await page.evaluate((c) => window.__frozenTestDebug.focus(c.q, c.r), cand);
  await page.clock.runFor(1500);
  out.K3 = await shot(); lg('K3');
  // K4/K5: realny ruch o 1 heks (odcinek ANIM_SEG_DUR = 140 ms) -> klatka po 48 ms (3 klatki, t ~ 0,34) i po zakonczeniu
  await page.clock.runFor(100);
  const mv = cand ? await page.evaluate((c) => {
    const d = window.__fortTerritoryTestDebug; const f = window.__frozenTestDebug;
    const ok = d.moveStep(c.id, c.to.q, c.to.r);
    return ok ? { id: c.id, from: { q: c.q, r: c.r }, to: c.to, animating: d.isAnimating(), screenFrom: f.screenOf(c.q, c.r), screenTo: f.screenOf(c.to.q, c.to.r) } : null;
  }, cand) : null;
  if (mv) for (const k of ['screenFrom', 'screenTo']) mv[k] = { x: Math.round(mv[k].x), y: Math.round(mv[k].y) };
  await page.clock.runFor(48);
  out.K4 = await shot(); lg('K4');
  const midAnim = await page.evaluate(() => window.__fortTerritoryTestDebug.isAnimating());
  await page.clock.runFor(600);
  const endAnim = await page.evaluate(() => window.__fortTerritoryTestDebug.isAnimating());
  // po zakonczeniu animacji scena jest statyczna: zegar wraca do biegu naturalnego (jak K1-K3), zeby kompozytor
  // oddal nowa klatke (zrzut przy zatrzymanym zegarze po dluzszym runFor nie wracal)
  await page.clock.resume();
  await wait(2000);
  out.K5 = await shot(); lg('K5');
  const pos = mv ? await page.evaluate((id) => window.__fortTerritoryTestDebug.unitPos(id), mv.id) : null;
  await page.close();
  return { shots: out, meta: { hintHidden, placed: info.placed, move: mv, midAnim, endAnim, posAfter: pos } };
}

/** Roznica dwoch zrzutow. `mask` (Uint8Array, 1 = piksel szumu) -- `anyOutsideNoise` liczy tylko piksele poza szumem. */
function cmp(a, b, out, mask) {
  const pa = PNG.sync.read(a); const pb = PNG.sync.read(b);
  const d = new PNG({ width: pa.width, height: pa.height });
  let any = 0; let bad = 0; let maxCh = 0; let outside = 0;
  const diffMask = new Uint8Array(pa.width * pa.height);
  for (let i = 0; i < pa.data.length; i += 4) {
    const m = Math.max(Math.abs(pa.data[i] - pb.data[i]), Math.abs(pa.data[i + 1] - pb.data[i + 1]), Math.abs(pa.data[i + 2] - pb.data[i + 2]));
    if (m > 0) { any++; diffMask[i >> 2] = 1; if (!mask || !mask[i >> 2]) outside++; } if (m > 8) bad++; if (m > maxCh) maxCh = m;
    if (m > 0) { d.data[i] = 255; d.data[i + 1] = 0; d.data[i + 2] = 255; } else { d.data[i] = pb.data[i] >> 2; d.data[i + 1] = pb.data[i + 1] >> 2; d.data[i + 2] = pb.data[i + 2] >> 2; }
    d.data[i + 3] = 255;
  }
  if (out) fs.writeFileSync(out, PNG.sync.write(d));
  return { px: pa.width * pa.height, any, over8: bad, maxChannelDiff: maxCh, anyOutsideNoise: outside, diffMask };
}
const strip = (r) => { const { diffMask, ...rest } = r; return rest; };

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const CACHE = opt('cache'); const ONLY = opt('only') ? opt('only').split(',') : null;
    const run = async (tag, dist) => {
      const mf = CACHE && path.join(CACHE, tag + '-meta.json');
      if (mf && fs.existsSync(mf)) {
        const shots = {}; for (const k of KADRY) shots[k] = fs.readFileSync(path.join(CACHE, tag + '-' + k + '.png'));
        return { shots, meta: JSON.parse(fs.readFileSync(mf, 'utf8')) };
      }
      if (ONLY && !ONLY.includes(tag)) return null;
      const r = await frames(browser, dist);
      if (CACHE) {
        fs.mkdirSync(CACHE, { recursive: true });
        for (const k of KADRY) fs.writeFileSync(path.join(CACHE, tag + '-' + k + '.png'), r.shots[k]);
        fs.writeFileSync(mf, JSON.stringify(r.meta));
      }
      return r;
    };
    const a1 = await run('A1', A); const a2 = await run('A2', A); const b1 = await run('B1', B); const b2 = await run('B2', B);
    if (!a1 || !a2 || !b1 || !b2) { console.log('CZESCIOWY: brak przebiegow ' + ['A1', 'A2', 'B1', 'B2'].filter((t, i) => ![a1, a2, b1, b2][i]).join(',')); await browser.close(); process.exit(3); }
    console.log('meta A1 ' + JSON.stringify(a1.meta));
    console.log('meta B1 ' + JSON.stringify(b1.meta));
    const inFrame = (p) => p && p.x > 100 && p.x < W - 100 && p.y > 100 && p.y < H - 100;
    ok('M0 scenariusz: podpowiedz DOM schowana, ' + EXTRA + ' zetonow dodanych, ruch wystartowal (heks startowy i docelowy w kadrze), w K4 animacja trwa, w K5 zakonczona, zeton na heksie docelowym (A i B)',
      [a1, b1].every((r) => r.meta.hintHidden === true && r.meta.placed === EXTRA && r.meta.move && r.meta.move.animating && r.meta.midAnim === true && r.meta.endAnim === false
        && inFrame(r.meta.move.screenFrom) && inFrame(r.meta.move.screenTo)
        && r.meta.posAfter && r.meta.posAfter.q === r.meta.move.to.q && r.meta.posAfter.r === r.meta.move.to.r)
      && JSON.stringify(a1.meta) === JSON.stringify(b1.meta), { A: a1.meta.move, B: b1.meta.move });
    // Szum: A1 vs A2 i B1 vs B2 (ten sam build, ten sam scenariusz). Maska szumu = suma pikseli roznych w obu parach.
    const noise = {}; const masks = {};
    for (const k of KADRY) {
      const aa = cmp(a1.shots[k], a2.shots[k]); const bb = cmp(b1.shots[k], b2.shots[k]);
      const m = new Uint8Array(aa.diffMask.length); for (let i = 0; i < m.length; i++) m[i] = aa.diffMask[i] | bb.diffMask[i];
      masks[k] = m; noise[k] = { AvA: aa.any, BvB: bb.any };
    }
    console.log('SZUM (A1 vs A2, B1 vs B2; px rozne w dowolnym kanale): ' + JSON.stringify(noise));
    ok('F0 szum ograniczony: w kazdym kadrze A1 vs A2 == B1 vs B2 albo jeden z nich 0 (szum to przelaczanie miedzy tymi samymi stanami, nie losowosc renderu)',
      KADRY.every((k) => noise[k].AvA === noise[k].BvB || noise[k].AvA === 0 || noise[k].BvB === 0), noise);
    if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
    KADRY.forEach((k, i) => {
      const pairs = { A1B1: [a1, b1], A1B2: [a1, b2], A2B1: [a2, b1], A2B2: [a2, b2] };
      const cross = {}; let best = null;
      for (const [nm, [x, y]] of Object.entries(pairs)) { cross[nm] = cmp(x.shots[k], y.shots[k]).any; if (best === null || cross[nm] < cross[best]) best = nm; }
      const [xa, xb] = pairs[best];
      if (SHOTS) {
        fs.writeFileSync(path.join(SHOTS, 'gra-' + k + '-A-przed.png'), xa.shots[k]);
        fs.writeFileSync(path.join(SHOTS, 'gra-' + k + '-B-po.png'), xb.shots[k]);
      }
      const d = strip(cmp(xa.shots[k], xb.shots[k], SHOTS && path.join(SHOTS, 'gra-' + k + '-roznica.png'), masks[k]));
      const d11 = strip(cmp(a1.shots[k], b1.shots[k], null, masks[k]));
      ok('F' + (i + 1) + ' ' + k + ' ' + OPIS[k] + ': A vs B piksele rozne (dowolny kanal, surowo) <= ' + LIMIT + ' w najblizszej parze przebiegow ORAZ A1 vs B1 poza maska szumu <= ' + LIMIT,
        d.any <= LIMIT && d11.anyOutsideNoise <= LIMIT, { pary: cross, najblizsza: best, roznica: d, A1B1: d11 });
    });
  } finally { await browser.close(); }
  console.log(`\nmemory-unit-static-merge-game-frame: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
