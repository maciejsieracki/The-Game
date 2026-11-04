'use strict';
/**
 * R-WEB-HUNTING-CAMP-HILL-NO-FLATTEN-Q1 — Obóz łowiecki NIE wypłaszcza wzgórza z lasem.
 *
 * Przyczyna (RED): obóz wymaga na tym samym heksie wcześniejszego tartaku, więc warstwy to
 * ['tartak','oboz_lowiecki']. `preservesHillRelief` (every) znało 'tartak', ale nie
 * 'oboz_lowiecki' -> false -> `keepsReliefUnderImprovement` false, a gałąź
 * `forestKeptUnderImprovement` w `syncImprovementDecorForHex` też false (tartak nie jest
 * żywnościowy) -> `hideDecorAtHex` chowało kopiec i las. Poprawka: wpis w
 * src/game/relief-preserving-improvements.ts.
 *
 * Część 1: prawdziwy predykat (esbuild, node). Część 2: prawdziwy render w Chromium
 * (vite build poza repo, WebGL swiftshader). Wariant „przed" = mutacja w pamięci transformu
 * Vite (usunięcie wpisu obozu) — pliki repo nietknięte.
 *
 * Uruchom z gra/: node tools/hunting-camp-hill-no-flatten-test.cjs --shots <katalog> [--outroot <katalog>]
 */
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const VITE_CFG = path.join(__dirname, `.hunting-camp-vite-${RUN_ID}.config.mts`);
const FALLBACK_CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium'
    : fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const argOf = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const OUTROOT = argOf('--outroot') || (fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir());
const SHOTS = argOf('--shots') || path.join(os.tmpdir(), `hunting-camp-shots-${RUN_ID}`);
const dirs = [];
process.on('exit', () => {
  for (const d of dirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ } }
  try { fs.unlinkSync(VITE_CFG); } catch { /* juz usunieta */ }
});

let pass = 0; let fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error(' FAIL  ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

// ---------------------------------------------------------------------------
// Część 1 — prawdziwy predykat (bez przeglądarki)
// ---------------------------------------------------------------------------
function predicateSection() {
  const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
  const tmp = fs.mkdtempSync(path.join(OUTROOT, `hunting-camp-pred-${RUN_ID}-`));
  dirs.push(tmp);
  const entry = path.join(tmp, 'entry.ts');
  const out = path.join(tmp, 'p.cjs');
  fs.writeFileSync(entry, `export { preservesHillRelief, preservesHillReliefKey } from ${JSON.stringify(path.join(GRA, 'src/game/relief-preserving-improvements.ts'))};`);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out, logLevel: 'silent' });
  const p = require(out);
  console.log('-- (1) predykat reliefu --');
  check('oboz_lowiecki zachowuje relief (klucz)', p.preservesHillReliefKey('oboz_lowiecki'));
  check("realne warstwy obozu ['tartak','oboz_lowiecki'] zachowuja relief", p.preservesHillRelief(['tartak', 'oboz_lowiecki']));
  check('obóz solo (stary zapis) zachowuje relief', p.preservesHillRelief(['oboz_lowiecki']));
  check('kontrola: tartak solo nadal zachowuje relief', p.preservesHillRelief(['tartak']));
  check('kontrola: obóz + droga (nie zachowuje) nadal wypłaszcza', !p.preservesHillRelief(['tartak', 'oboz_lowiecki', 'droga']));
  check('kontrola: farma/posterunek nadal nie zachowują', !p.preservesHillReliefKey('farma') && !p.preservesHillReliefKey('posterunek'));
}

// ---------------------------------------------------------------------------
// Część 2 — Chromium
// ---------------------------------------------------------------------------
const HOOKS = `
      obozLas: {
        find: (kind: 'hillForest' | 'hillBare' | 'flatForest'): { q: number; r: number }[] => {
          const out: { q: number; r: number }[] = [];
          // applyBuildRequest ma wlasna bramke terytorium ("Poza terytorium — rozszerz
          // okolice miasta") — kandydat MUSI lezec w terytorium gracza, inaczej mierzylibysmy
          // odrzucona budowe zamiast renderu.
          for (const k of Object.keys(map.hexes)) {
            const h = map.hexes[k];
            if (!h) continue;
            if ((placedImprovements.get(k) ?? []).length > 0) continue;
            const hill = h.terenBazowy === TerenBazowy.Wzgorza;
            const forest = h.nakladka === Nakladka.Las;
            const bare = h.nakladka === Nakladka.Brak;
            const flat = h.terenBazowy === TerenBazowy.Laka || h.terenBazowy === TerenBazowy.Rownina;
            const ok = kind === 'hillForest' ? (hill && forest)
              : kind === 'hillBare' ? (hill && bare)
              : (flat && forest);
            if (ok) out.push({ q: h.coords.q, r: h.coords.r });
          }
          // Mgla wojny zeruje dekor na nieodkrytych heksach (applyZoomLodDecor,
          // render/scene.ts) — kandydaci MUSZA isc od najblizszych stolicy gracza,
          // inaczej pomiar mierzyłby mgłę, nie tę poprawkę.
          const c0 = cities.find(c => c.ownerId === 0);
          if (c0) {
            const d = (h: { q: number; r: number }) =>
              (Math.abs(h.q - c0.q) + Math.abs(h.r - c0.r) + Math.abs((h.q - c0.q) + (h.r - c0.r))) / 2;
            out.sort((a, b) => d(a) - d(b) || a.q - b.q || a.r - b.r);
          }
          return out;
        },
        /**
         * Postawienie ulepszenia DOKLADNIE ta sama trojka wywolan, ktora wykonuje silnik po
         * zatwierdzeniu budowy (main.ts, commit auto-ulepszen gracza:
         * placedImprovements.set -> syncHexUlepszenieFields -> spawnImprovementMesh; ta ostatnia
         * wola syncImprovementDecorForHex, czyli TESTOWANA funkcje). Uzywane zamiast
         * applyBuildRequest wylacznie dlatego, ze applyBuildRequest ma dodatkowa bramke
         * TERYTORIUM ("Poza terytorium — rozszerz okolice miasta"), a wylosowane terytorium
         * gracza na starcie nie zawiera heksa Wzgorza+Las. Bramki budowy sa testowane osobno,
         * sekcja (E), REALNYM applyBuildRequest.
         */
        placeViaEngine: (key: string, q: number, r: number): string[] => {
          const hexKey = keyOf(q, r);
          const prev = placedImprovements.get(hexKey) ?? [];
          const next = [...prev, key] as unknown as typeof prev;
          placedImprovements.set(hexKey, next);
          syncHexUlepszenieFields(hexKey, next);
          spawnImprovementMesh(hexKey);
          syncResourceOverlayAtHex(hexKey);
          return (placedImprovements.get(hexKey) ?? []).slice();
        },
        campInfo: (q: number, r: number): unknown => {
          const key = keyOf(q, r);
          const hex = map.hexes[key];
          const group = improvementMeshes.get(key);
          const layers = placedImprovements.get(key) ?? [];
          const opts = improvementReliefOpts(q, r, layers);
          const sample = opts.surfaceY ? opts.surfaceY(0.86 * HEX_R * Math.cos(4 * Math.PI / 3), 0.86 * HEX_R * Math.sin(4 * Math.PI / 3)) : null;
          return { terrain: hex ? String(hex.terenBazowy) : null, overlay: hex ? String(hex.nakladka) : null, layers: layers.slice(), hasMesh: !!group, groupY: group ? group.position.y : null, topY: unitRenderer.topYAt(q, r), sectorR: opts.sectorR ?? null, sectorSurfaceY: sample, hasSurfaceSampler: typeof opts.surfaceY === 'function', keeps: keepsReliefUnderImprovement(key, layers.slice()) };
        },
                hexInfo: (q: number, r: number): unknown => {
          const h = map.hexes[keyOf(q, r)];
          if (!h) return null;
          return {
            teren: String(h.terenBazowy),
            nakladka: String(h.nakladka),
            layers: (placedImprovements.get(keyOf(q, r)) ?? []).slice(),
          };
        },
        /** Widoczne (skala != 0) instancje DOWOLNEGO InstancedMesh nad tym heksem. */
        decorCount: (q: number, r: number): number => {
          const c = axialToWorld(q, r, HEX_R);
          // 0.65×HEX_R: wnętrze heksa. Szerszy promień łapie dekor SĄSIADA (kępy stoją blisko
          // ścianek), przez co „schowany” heks nigdy nie schodził do zera.
          const lim = HEX_R * 0.65;
          const m = new THREE.Matrix4();
          const p = new THREE.Vector3();
          const qt = new THREE.Quaternion();
          const s = new THREE.Vector3();
          let visible = 0;
          scene.updateMatrixWorld(true);
          scene.traverse((o: THREE.Object3D) => {
            const im = o as unknown as { isInstancedMesh?: boolean; count: number; getMatrixAt: (i: number, m: THREE.Matrix4) => void };
            if (!im.isInstancedMesh) return;
            for (let i = 0; i < im.count; i++) {
              im.getMatrixAt(i, m);
              m.decompose(p, qt, s);
              if (s.x === 0 && s.y === 0 && s.z === 0) continue;
              p.applyMatrix4(o.matrixWorld);
              const dx = p.x - c.x;
              const dz = p.z - c.z;
              if (dx * dx + dz * dz > lim * lim) continue;
              visible++;
            }
          });
          return visible;
        },
        focus: (q: number, r: number, dist: number): void => {
          const c = axialToWorld(q, r, HEX_R);
          camCtrl.focusAt(c.x, c.z, dist);
        },
      },
`;

const ANCHOR = '      findTestHexes: (): {';
const MUT_FILE = '/src/game/relief-preserving-improvements.ts';
const MUT_SRC = ", 'oboz_lowiecki']);";
const MUT_REVERTED = ']);';

function writeViteConfig() {
  fs.writeFileSync(VITE_CFG, `
import base from '../vite.config';
import type { Plugin } from 'vite';
const VARIANT = process.env.CAMP_VARIANT || 'po';
const HOOKS = ${JSON.stringify(HOOKS)};
const ANCHOR = ${JSON.stringify(ANCHOR)};
const MUT_FILE = ${JSON.stringify(MUT_FILE)};
const MUT_SRC = ${JSON.stringify(MUT_SRC)};
const MUT_REVERTED = ${JSON.stringify(MUT_REVERTED)};
function patch(): Plugin {
  return {
    name: 'hunting-camp-patch',
    enforce: 'pre',
    transform(code: string, id: string) {
      const norm = id.replace(/\\\\/g, '/');
      if (norm.endsWith('/src/main.ts')) {
        if (!code.includes(ANCHOR)) throw new Error('[camp] kotwica haka nie znaleziona');
        return code.replace(ANCHOR, HOOKS + ANCHOR);
      }
      if (VARIANT === 'przed' && norm.endsWith(MUT_FILE)) {
        if (!code.includes(MUT_SRC)) throw new Error('[camp] kotwica mutacji nie znaleziona');
        return code.replace(MUT_SRC, MUT_REVERTED);
      }
      return null;
    },
  };
}
export default { ...base, plugins: [patch(), ...((base as { plugins?: unknown[] }).plugins ?? [])] };
`, 'utf8');
}

function build(variant) {
  const outDir = path.join(OUTROOT, `civ-dist-camp-${variant}-${RUN_ID}`);
  dirs.push(outDir);
  console.log('[camp] vite build (' + variant + ') -> ' + outDir);
  execSync('node ./node_modules/vite/bin/vite.js build --config ' + JSON.stringify(VITE_CFG)
    + ' --outDir ' + JSON.stringify(outDir) + ' --emptyOutDir',
  { cwd: GRA, stdio: 'pipe', env: { ...process.env, CAMP_VARIANT: variant } });
  const html = path.join(outDir, 'index.html');
  if (!fs.existsSync(html)) throw new Error('brak index.html w ' + outDir);
  return html;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'];
  try { return await chromium.launch({ headless: true, args }); }
  catch { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args }); }
}
async function boot(page, url) {
  await page.goto(url + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__buildRequestTestDebug
    && window.__buildRequestTestDebug.getWorldState().citiesLen > 0
    && window.__buildRequestTestDebug.getWorldState().turn === 1, undefined, { timeout: 180000 });
  await page.evaluate(() => { window.__buildRequestTestDebug.unlockAllTech(); window.__buildRequestTestDebug.setPlayerPracaPool(1000000); });
  await wait(500);
}
const D = (page, fn, arg) => page.evaluate(({ fn, arg }) => window.__buildRequestTestDebug.obozLas[fn](...arg), { fn, arg });
const place = (page, key, q, r) => D(page, 'placeViaEngine', [key, q, r]);
const decor = async (page, q, r) => { await D(page, 'focus', [q, r, 12]); await wait(250); return D(page, 'decorCount', [q, r]); };
async function shot(page, q, r, dist, file) {
  await D(page, 'focus', [q, r, dist]); await wait(900);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
}

async function runVariant(chromium, variant, html) {
  const root = path.dirname(html);
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const cand = path.resolve(root, '.' + pathname);
    if (!cand.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(cand, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      const ext = path.extname(cand);
      res.writeHead(200, { 'content-type': ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : ext === '.json' ? 'application/json' : 'text/html' });
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await launch(chromium);
  const errors = []; const out = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    await boot(page, url);
    const hillForest = await D(page, 'find', ['hillForest']);
    out.hillForestCount = hillForest.length;
    const visible = [];
    for (const h of hillForest.slice(0, 60)) { if (await decor(page, h.q, h.r) > 0) visible.push(h); if (visible.length >= 6) break; }
    out.visible = visible;
    if (visible.length < 5) { out.skipped = true; return { out, errors }; }

    // S1: tartak solo (kontrola)
    const [sawH, campH, c1, c2, c3] = visible;
    out.sawBefore = await decor(page, sawH.q, sawH.r);
    await place(page, 'tartak', sawH.q, sawH.r); await wait(300);
    out.sawAfter = await decor(page, sawH.q, sawH.r);
    out.sawInfo = await D(page, 'campInfo', [sawH.q, sawH.r]);
    // Zrzut referencyjny TARTAKU (R2): to samo ujęcie (zbliżenie dist=14) co zrzuty obozu 1/2.
    await shot(page, sawH.q, sawH.r, 14, path.join(SHOTS, variant + '-0-tartak-referencja-zblizenie-1280x720.png'));

    // S2: tartak + obóz (realne warstwy) — jedno wzgórze, zrzuty PRZED/PO
    await place(page, 'tartak', campH.q, campH.r); await wait(300);
    out.campBefore = await decor(page, campH.q, campH.r);
    out.campHexBefore = await D(page, 'hexInfo', [campH.q, campH.r]);
    await shot(page, campH.q, campH.r, 14, path.join(SHOTS, variant + '-1-zbliz-przed-obozem-1280x720.png'));
    await place(page, 'oboz_lowiecki', campH.q, campH.r); await wait(400);
    out.campAfter = await decor(page, campH.q, campH.r);
    out.campHexAfter = await D(page, 'hexInfo', [campH.q, campH.r]);
    out.campInfo = await D(page, 'campInfo', [campH.q, campH.r]);
    await shot(page, campH.q, campH.r, 14, path.join(SHOTS, variant + '-2-zbliz-po-obozie-1280x720.png'));

    // S3: trzy obozy (jak na zrzucie właściciela)
    out.tri = [];
    for (const h of [c1, c2, c3]) {
      await place(page, 'tartak', h.q, h.r);
      const before = await decor(page, h.q, h.r);
      await place(page, 'oboz_lowiecki', h.q, h.r); await wait(250);
      const after = await decor(page, h.q, h.r);
      out.tri.push({ h, before, after, info: await D(page, 'campInfo', [h.q, h.r]) });
    }
    await shot(page, c2.q, c2.r, 40, path.join(SHOTS, variant + '-3-trzy-obozy-widok-z-gory-1280x720.png'));

    // S4: obóz solo (stary zapis bez tartaku)
    const more = await D(page, 'find', ['hillForest']);
    let solo = null;
    for (const h of more) { if (await decor(page, h.q, h.r) > 0) { solo = h; break; } }
    if (solo) {
      out.soloBefore = await decor(page, solo.q, solo.r);
      await place(page, 'oboz_lowiecki', solo.q, solo.r); await wait(300);
      out.soloAfter = await decor(page, solo.q, solo.r);
      out.soloInfo = await D(page, 'campInfo', [solo.q, solo.r]);
    }

    // S5: płaski heks z lasem — bez zmian
    const flat = await D(page, 'find', ['flatForest']);
    let fh = null;
    for (const h of flat) { if (await decor(page, h.q, h.r) > 0) { fh = h; break; } }
    if (fh) {
      await place(page, 'tartak', fh.q, fh.r);
      out.flatBefore = await decor(page, fh.q, fh.r);
      await place(page, 'oboz_lowiecki', fh.q, fh.r); await wait(300);
      out.flatAfter = await decor(page, fh.q, fh.r);
      out.flatInfo = await D(page, 'campInfo', [fh.q, fh.r]);
    }
    return { out, errors };
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
}

async function main() {
  predicateSection();
  let chromium;
  try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
  catch { console.error('[camp] playwright missing'); process.exit(1); }
  writeViteConfig();
  const htmlPo = build('po');
  const htmlPrzed = build('przed');
  console.log('\n== WARIANT PRZED (wpis obozu cofniety w locie) ==');
  const przed = await runVariant(chromium, 'przed', htmlPrzed);
  console.log('   ' + JSON.stringify(przed.out));
  console.log('\n== WARIANT PO (kod z repo) ==');
  const po = await runVariant(chromium, 'po', htmlPo);
  console.log('   ' + JSON.stringify(po.out));

  console.log('\n-- (2) render w Chromium --');
  check('znaleziono >=5 wzgorz z widoczna kepa lasu (PO i PRZED)', !po.out.skipped && !przed.out.skipped, { po: po.out.visible, przed: przed.out.visible });
  const P = po.out; const B = przed.out;
  if (P.skipped || B.skipped) { console.log('===== ' + pass + ' PASS / ' + fail + ' FAIL ====='); process.exit(1); }
  check('PO: tartak solo zachowuje las (kontrola)', P.sawAfter === P.sawBefore && P.sawAfter > 0, [P.sawBefore, P.sawAfter]);
  check('PO: obóz na wzgórzu z lasem - dekor lasu bez zmiany', P.campAfter === P.campBefore && P.campAfter > 0, [P.campBefore, P.campAfter]);
  check('PO: dane nietknięte - teren i nakladka Las przed i po', P.campHexBefore.teren === P.campHexAfter.teren
    && P.campHexAfter.nakladka === P.campHexBefore.nakladka && P.campHexAfter.nakladka === 'las' && P.campHexAfter.layers.includes('oboz_lowiecki'), [P.campHexBefore, P.campHexAfter]);
  check('PO: relief zachowany (keeps) + sektor na probce stoku + mesh obozu', P.campInfo.keeps === true && P.campInfo.sectorR === 0.86 && P.campInfo.hasSurfaceSampler && P.campInfo.hasMesh, P.campInfo);
  check('PO: model obozu na wierzchu heksa, probka stoku skonczona', Math.abs(P.campInfo.groupY - (P.campInfo.topY + 0.01)) < 1e-8 && Number.isFinite(P.campInfo.sectorSurfaceY), P.campInfo);
  check('PO: osadzenie obozu identyczne jak tartaku (sectorR i sampler)', P.campInfo.sectorR === P.sawInfo.sectorR && P.campInfo.hasSurfaceSampler === P.sawInfo.hasSurfaceSampler, [P.campInfo, P.sawInfo]);
  check('PO: 3 obozy obok siebie - kazdy zachowuje las i relief', P.tri.length === 3 && P.tri.every(t => t.after === t.before && t.after > 0 && t.info.keeps && t.info.sectorR === 0.86), P.tri);
  check('PO: obóz solo (stary zapis) zachowuje las i relief', P.soloAfter === P.soloBefore && P.soloAfter > 0 && P.soloInfo.keeps, [P.soloBefore, P.soloAfter, P.soloInfo]);
  check('PO: plaski heks z lasem - bez zmian (las zostaje)', P.flatAfter === P.flatBefore && P.flatAfter > 0 && P.flatInfo.keeps === false, [P.flatBefore, P.flatAfter, P.flatInfo]);
  check('PRZED (mutacja): obóz wypłaszcza - las znika i relief niezachowany (RED)', B.campAfter < B.campBefore && B.campInfo.keeps === false, [B.campBefore, B.campAfter, B.campInfo]);
  check('PRZED (mutacja): trzy obozy wypłaszczają', B.tri.every(t => t.after < t.before), B.tri);
  check('PRZED: plaski heks z lasem bez zmian jak PO', B.flatAfter === B.flatBefore, [B.flatBefore, B.flatAfter]);
  check('brak pageerror w obu sesjach', !przed.errors.some(e => e.startsWith('[pageerror]')) && !po.errors.some(e => e.startsWith('[pageerror]')), { przed: przed.errors, po: po.errors });
  console.log('\n===== ' + pass + ' PASS / ' + fail + ' FAIL =====');
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify({ przed: przed.out, po: po.out, errors: { przed: przed.errors, po: po.errors }, checks: { pass, fail } }, null, 2) + '\n');
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
