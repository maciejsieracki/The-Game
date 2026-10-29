'use strict';
/**
 * AutoBot real-render closeout for the sawmill-on-forested-hill contract.
 *
 * A deterministic in-game scenario records before/after screenshots in headless Chromium,
 * checks the forest overlay and visible decor instances, verifies the hill relief sampler
 * and improvement placement, then deliberately cuts the forest and confirms the sawmill
 * is removed. The "before" build mutates preservesHillRelief only in Vite's in-memory
 * transform, proving that the visual assertion detects the regression without changing
 * repository source files.
 *
 * Run from gra/: node tools/tartak-wzgorze-las-real-render-test.cjs --shots <directory>
 */

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const VITE_CFG = path.join(__dirname, '.tartak-hill-vite.config.mts');
const FALLBACK_CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();
const SHOTS = argOf('--shots') || path.join(os.tmpdir(), `tartak-hill-shots-${TMPDIR_RUN_ID}`);

let pass = 0;
let fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error(' FAIL  ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

// ---------------------------------------------------------------------------
// Haki testowe wstrzykiwane W LOCIE do `window.__buildRequestTestDebug` (main.ts).
// NIE dotykają plików repo — transform Vite'a widzi je tylko w pamięci procesu buildu.
// Czytają ten sam `map`/`placedImprovements`/`scene`/`camCtrl`, co żywa gra.
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
        sawmillInfo: (q: number, r: number): unknown => {
          const key = keyOf(q, r);
          const hex = map.hexes[key];
          const group = improvementMeshes.get(key);
          const layers = placedImprovements.get(key) ?? [];
          const opts = improvementReliefOpts(q, r, layers);
          const sample = opts.surfaceY ? opts.surfaceY(0.86 * HEX_R * Math.cos(4 * Math.PI / 3), 0.86 * HEX_R * Math.sin(4 * Math.PI / 3)) : null;
          return { terrain: hex ? String(hex.terenBazowy) : null, overlay: hex ? String(hex.nakladka) : null, layers: layers.slice(), hasMesh: !!group, groupY: group ? group.position.y : null, topY: unitRenderer.topYAt(q, r), sectorR: opts.sectorR ?? null, sectorSurfaceY: sample, hasSurfaceSampler: typeof opts.surfaceY === 'function' };
        },
        finishForestCut: (q: number, r: number): void => { finalizeHexClearing(keyOf(q, r)); },
        hexInfo: (q: number, r: number): unknown => {
          const h = map.hexes[keyOf(q, r)];
          if (!h) return null;
          return {
            teren: String(h.terenBazowy),
            nakladka: String(h.nakladka),
            layers: (placedImprovements.get(keyOf(q, r)) ?? []).slice(),
          };
        },
        /**
         * R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1, runda 1 (obrona zarzutu 2):
         * ile kluczy zywnosciowych przepuszcza SAM predykat isImprovementBlockedOnForest.
         * Liczone w ZYWYM bundlu, z DOKLADNIE tych samych dwoch symboli, ktorych uzywa
         * naprawiona galaz syncImprovementDecorForHex — zeby twierdzenie w komentarzu
         * przy tej galezi bylo weryfikowane zachowaniem, a nie recznym zliczeniem.
         * Oczekiwane PIEC (nie cztery): bydlo/owce/lama/oboz_lowiecki + lodzie_rybackie,
         * ktore z galezi wyklucza dopiero warunek terenu (elevated), nie ten predykat.
         */
        foodKeysPassingForestPredicate: (): string[] =>
          [...ULEPSZENIA_ZYWNOSCIOWE]
            .filter(k => !isImprovementBlockedOnForest(k, Nakladka.Las))
            .map(k => String(k))
            .sort(),
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
        diag: (q: number, r: number): unknown => {
          const c = axialToWorld(q, r, HEX_R);
          const m = new THREE.Matrix4();
          const p = new THREE.Vector3();
          const qt = new THREE.Quaternion();
          const s = new THREE.Vector3();
          let meshes = 0;
          let inst = 0;
          let nonZero = 0;
          let best = Infinity;
          let bestName = '';
          scene.updateMatrixWorld(true);
          scene.traverse((o: THREE.Object3D) => {
            const im = o as unknown as { isInstancedMesh?: boolean; count: number; getMatrixAt: (i: number, m: THREE.Matrix4) => void };
            if (!im.isInstancedMesh) return;
            meshes++;
            inst += im.count;
            for (let i = 0; i < im.count; i++) {
              im.getMatrixAt(i, m);
              m.decompose(p, qt, s);
              if (s.x === 0 && s.y === 0 && s.z === 0) continue;
              nonZero++;
              p.applyMatrix4(o.matrixWorld);
              const d = Math.hypot(p.x - c.x, p.z - c.z);
              if (d < best) { best = d; bestName = o.name || o.type; }
            }
          });
          return { hexX: c.x, hexZ: c.z, HEX_R, meshes, inst, nonZero, best, bestName };
        },
        focus: (q: number, r: number, dist: number): void => {
          const c = axialToWorld(q, r, HEX_R);
          camCtrl.focusAt(c.x, c.z, dist);
        },
      },
`;

const ANCHOR = '      findTestHexes: (): {';
const FIX_SRC = `      const forestKeptUnderImprovement = hex.nakladka === Nakladka.Las
        && layers.every(k => ULEPSZENIA_ZYWNOSCIOWE.has(k as ImprovementKey)
          && !isImprovementBlockedOnForest(k, hex.nakladka));`;
const FIX_REVERTED = '      const forestKeptUnderImprovement = false;';
const RELIEF_RETURN = '      return preservesHillRelief(layers);';
const RELIEF_RETURN_REVERTED = "      return layers.includes('tartak') ? false : preservesHillRelief(layers);";

function writeViteConfig() {
  const cfg = `
import base from '../vite.config';
import type { Plugin } from 'vite';

const VARIANT = process.env.OBOZ_LAS_VARIANT || 'po';
const HOOKS = ${JSON.stringify(HOOKS)};
const ANCHOR = ${JSON.stringify(ANCHOR)};
const FIX_SRC = ${JSON.stringify(FIX_SRC)};
const FIX_REVERTED = ${JSON.stringify(FIX_REVERTED)};
const RELIEF_RETURN = ${JSON.stringify(RELIEF_RETURN)};
const RELIEF_RETURN_REVERTED = ${JSON.stringify(RELIEF_RETURN_REVERTED)};

function patchMain(): Plugin {
  return {
    name: 'tartak-hill-patch',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!id.replace(/\\\\/g, '/').endsWith('/src/main.ts')) return null;
      if (!code.includes(ANCHOR)) throw new Error('[tartak-hill] kotwica haka testowego nie znaleziona w main.ts');
      let out = code.replace(ANCHOR, HOOKS + ANCHOR);
      if (VARIANT === 'przed') {
        if (!out.includes(RELIEF_RETURN)) throw new Error('[tartak-hill] relief mutation anchor missing');
        out = out.replace(RELIEF_RETURN, RELIEF_RETURN_REVERTED);
        if (!out.includes(FIX_SRC)) throw new Error('[tartak-hill] blok poprawki nie znaleziony w main.ts (mutacja niemozliwa)');
        out = out.replace(FIX_SRC, FIX_REVERTED);
      }
      return out;
    },
  };
}

export default {
  ...base,
  plugins: [patchMain(), ...((base as { plugins?: unknown[] }).plugins ?? [])],
};
`;
  fs.writeFileSync(VITE_CFG, cfg, 'utf8');
}

function build(variant, outDir) {
  console.log('[tartak-hill] vite build (' + variant + ') -> ' + outDir);
  execSync(
    'node ./node_modules/vite/bin/vite.js build --config ' + JSON.stringify(VITE_CFG)
      + ' --outDir ' + JSON.stringify(outDir) + ' --emptyOutDir',
    { cwd: GRA, stdio: 'pipe', env: { ...process.env, OBOZ_LAS_VARIANT: variant } },
  );
  const html = path.join(outDir, 'index.html');
  if (!fs.existsSync(html)) throw new Error('build nie wyprodukowal index.html w ' + outDir);
  return html;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch(chromium) {
  try {
    return await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  } catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function boot(page, url) {
  await page.goto(url + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => !!window.__buildRequestTestDebug
      && window.__buildRequestTestDebug.getWorldState().citiesLen > 0
      && window.__buildRequestTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 180000 },
  );
  await page.evaluate(() => {
    window.__buildRequestTestDebug.unlockAllTech();
    window.__buildRequestTestDebug.setPlayerPracaPool(1000000);
  });
  await wait(500);
}

/** Sciezka RENDERU: ta sama trojka wywolan silnika co przy zatwierdzonej budowie. */
const placeAt = (page, key, q, r) => page.evaluate(({ key, q, r }) =>
  window.__buildRequestTestDebug.obozLas.placeViaEngine(key, q, r), { key, q, r });

/** Sciezka BUDOWY: REALNY applyBuildRequest (wszystkie bramki gry) — sekcja (E). */
const buildAt = (page, key, q, r) => page.evaluate(({ key, q, r }) => {
  window.__buildRequestTestDebug.applyBuildRequest({
    type: 'buildImprovement', key, q, r, hexKey: `${q},${r}`, kosztPraca: 5, action: 'ulepszenie',
  });
}, { key, q, r });

/**
 * Zoom-LOD (`applyZoomLodDecor`, render/scene.ts) zeruje instancje dekoru przy oddalonej
 * kamerze — pomiar MUSI iść z kamerą dosuniętą do heksa, inaczej mierzy LOD, nie poprawkę.
 */
const decor = async (page, q, r) => {
  await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.focus(q, r, 12), { q, r });
  await wait(250);
  return page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.decorCount(q, r), { q, r });
};
const info = (page, q, r) => page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.hexInfo(q, r), { q, r });
const findHexes = (page, kind) => page.evaluate((kind) => window.__buildRequestTestDebug.obozLas.find(kind), kind);

async function shot(page, q, r, file) {
  await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.focus(q, r, 5), { q, r });
  await wait(900);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  console.log('       zrzut: ' + file);
}

/** Jeden pelny przebieg scenariusza na jednym wariancie bundla. Zwraca zmierzone liczby. */
async function runVariant(chromium, variant, html) {
  const root = path.dirname(html);
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    const candidate = path.resolve(root, '.' + pathname);
    if (!candidate.startsWith(root + path.sep) && candidate !== path.join(root, 'index.html')) {
      res.writeHead(403); res.end(); return;
    }
    fs.readFile(candidate, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      const ext = path.extname(candidate);
      const mime = ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : ext === '.json' ? 'application/json' : 'text/html';
      res.writeHead(200, { 'content-type': mime }); res.end(data);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await launch(chromium);
  const errors = [];
  const out = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    await boot(page, url);

    // Zbiór kluczy przepuszczanych przez sam predykat (obrona zarzutu 2 rundy 1) —
    // ten sam w obu wariantach bundla, bo wariant „przed" cofa tylko UŻYCIE predykatu.
    out.foodKeysOnForest = await page.evaluate(
      () => window.__buildRequestTestDebug.obozLas.foodKeysPassingForestPredicate());

    // --- (A) obóz łowiecki na WZGÓRZU Z LASEM -------------------------------
    const hillForest = await findHexes(page, 'hillForest');
    out.hillForestCount = hillForest.length;
    if (hillForest.length === 0) { out.skipped = true; return { out, errors }; }
    if (process.env.OBOZ_LAS_DIAG) {
      const h0 = hillForest[0];
      await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.focus(q, r, 12), h0);
      await wait(600);
      console.log('   DIAG ' + JSON.stringify(h0) + ' -> ' + JSON.stringify(
        await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.diag(q, r), h0)));
    }
    // heks z widoczną kępą: bierz pierwszy o decorCount > 0
    let camp = null;
    for (const h of hillForest.slice(0, 40)) {
      if (await decor(page, h.q, h.r) > 0) { camp = h; break; }
    }
    out.camp = camp;
    if (!camp) { out.skipped = true; return { out, errors }; }
    out.campBefore = await decor(page, camp.q, camp.r);
    out.campInfoBefore = await info(page, camp.q, camp.r);
    await shot(page, camp.q, camp.r, path.join(SHOTS, variant + '-1-wzgorze-las-przed-budowa.png'));
    await placeAt(page, 'oboz_lowiecki', camp.q, camp.r);
    await wait(400);
    out.campAfter = await decor(page, camp.q, camp.r);
    out.campInfoAfter = await info(page, camp.q, camp.r);
    out.campToast = await page.evaluate(() => window.__buildRequestTestDebug.getToast());
    await shot(page, camp.q, camp.r, path.join(SHOTS, variant + '-2-wzgorze-las-po-obozie.png'));

    // --- (A2) TARTAK na osobnym lesnym wzgorzu: drzewa + relief + wysokosc modelu ---
    const remainingHills = await findHexes(page, 'hillForest');
    let sawmill = null;
    for (const h of remainingHills) { if (await decor(page, h.q, h.r) > 0) { sawmill = h; break; } }
    out.sawmill = sawmill;
    if (sawmill) {
      out.sawmillBefore = await decor(page, sawmill.q, sawmill.r);
      out.sawmillInfoBefore = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.sawmillInfo(q, r), sawmill);
      await shot(page, sawmill.q, sawmill.r, path.join(SHOTS, variant + '-3-tartak-wzgorze-przed.png'));
      await placeAt(page, 'tartak', sawmill.q, sawmill.r);
      await wait(400);
      out.sawmillAfter = await decor(page, sawmill.q, sawmill.r);
      out.sawmillInfoAfter = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.sawmillInfo(q, r), sawmill);
      await shot(page, sawmill.q, sawmill.r, path.join(SHOTS, variant + '-4-tartak-wzgorze-po.png'));
      await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.finishForestCut(q, r), sawmill);
      await wait(350);
      out.sawmillAfterCut = await page.evaluate(({ q, r }) => window.__buildRequestTestDebug.obozLas.sawmillInfo(q, r), sawmill);
      out.sawmillForestAfterCut = await decor(page, sawmill.q, sawmill.r);
      return { out, errors };
    }

    // --- (B) REGRES: bydlo na wzgórzu z lasem NADAL chowa kępę --------------
    let cow = null;
    for (const h of hillForest) {
      if (camp && h.q === camp.q && h.r === camp.r) continue;
      if (await decor(page, h.q, h.r) > 0) { cow = h; break; }
    }
    if (cow) {
      out.cow = cow;
      out.cowBefore = await decor(page, cow.q, cow.r);
      await placeAt(page, 'bydlo', cow.q, cow.r);
      await wait(300);
      out.cowInfoAfter = await info(page, cow.q, cow.r);
      out.cowAfter = await decor(page, cow.q, cow.r);
    }

    // --- (C) REGRES: kamieniolom (zachowuje relief) na gołym wzgórzu -------
    const hillBare = await findHexes(page, 'hillBare');
    let quarry = null;
    for (const h of hillBare) { if (await decor(page, h.q, h.r) > 0) { quarry = h; break; } }
    if (quarry) {
      out.quarryBefore = await decor(page, quarry.q, quarry.r);
      await placeAt(page, 'kamieniolom', quarry.q, quarry.r);
      await wait(300);
      out.quarryAfter = await decor(page, quarry.q, quarry.r);
      out.quarryLayers = (await info(page, quarry.q, quarry.r)).layers;
    }

    // --- (D) REGRES: tarasy na gołym wzgórzu NADAL chowają dekor -----------
    let terrace = null;
    for (const h of hillBare) {
      if (quarry && h.q === quarry.q && h.r === quarry.r) continue;
      if (await decor(page, h.q, h.r) > 0) { terrace = h; break; }
    }
    if (terrace) {
      out.terraceBefore = await decor(page, terrace.q, terrace.r);
      await placeAt(page, 'tarasy', terrace.q, terrace.r);
      await wait(300);
      out.terraceAfter = await decor(page, terrace.q, terrace.r);
      out.terraceLayers = (await info(page, terrace.q, terrace.r)).layers;
    }

    // --- (E) CZĘŚĆ B: REALNY applyBuildRequest — obóz na terenie BEZ lasu ---
    // Heks w TERYTORIUM gracza (te same funkcje co panel budowy), więc bramka terytorium
    // przepuszcza i mierzymy WYŁĄCZNIE bramkę „obóz tylko na lesie”.
    const t = await page.evaluate(() => window.__buildRequestTestDebug.findFreshUnworkedHex());
    if (t) {
      out.bareTarget = t;
      out.bareInfoBefore = await info(page, t.q, t.r);
      await buildAt(page, 'oboz_lowiecki', t.q, t.r);
      await wait(250);
      out.bareInfoAfter = await info(page, t.q, t.r);
      out.bareToast = await page.evaluate(() => window.__buildRequestTestDebug.getToast());
      // kontrola pozytywna: TEN SAM heks przyjmuje ulepszenie nieleśne — dowód, że powyższe
      // odrzucenie to bramka lasu, a nie martwa ścieżka/inna blokada.
      await buildAt(page, 'posterunek', t.q, t.r);
      await wait(250);
      out.bareControl = (await info(page, t.q, t.r)).layers;
    }
    return { out, errors };
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  let chromium;
  try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.error('[tartak-hill] playwright missing'); process.exit(1); }

  writeViteConfig();
  const htmlPo = build('po', path.join(os.tmpdir(), `civ-dist-tartak-hill-po-${TMPDIR_RUN_ID}`));
  const htmlPrzed = build('przed', path.join(os.tmpdir(), `civ-dist-tartak-hill-przed-${TMPDIR_RUN_ID}`));

  console.log('\n== WARIANT PRZED (poprawka cofnieta w locie) ==');
  const przed = await runVariant(chromium, 'przed', htmlPrzed);
  console.log('   ' + JSON.stringify(przed.out));
  console.log('\n== WARIANT PO (kod z repo) ==');
  const po = await runVariant(chromium, 'po', htmlPo);
  console.log('   ' + JSON.stringify(po.out));

  console.log('\n-- TARTAK: zachowuje las i relief, a wyrab usuwa tartak --');
  check('PRZED: znaleziono heks Wzgorza+Las z widoczna kepa', !!przed.out.sawmill && przed.out.sawmillBefore > 0, przed.out.sawmill);
  check('PO: tartak zachowuje widoczny dekor lasu bez zmiany liczby instancji', po.out.sawmillAfter === po.out.sawmillBefore && po.out.sawmillAfter > 0, { before: po.out.sawmillBefore, after: po.out.sawmillAfter });
  check('PO: nakladka nadal Las i tartak jest warstwa', po.out.sawmillInfoAfter && po.out.sawmillInfoAfter.overlay === 'las' && po.out.sawmillInfoAfter.layers.includes('tartak'), po.out.sawmillInfoAfter);
  check('PO: silnik utrzymuje mesh, relief i sampler powierzchni stoku', po.out.sawmillInfoAfter && po.out.sawmillInfoAfter.hasMesh && po.out.sawmillInfoAfter.sectorR === 0.86 && po.out.sawmillInfoAfter.hasSurfaceSampler, po.out.sawmillInfoAfter);
  check('PO: grupa tartaku jest osadzona na wierzchu heksa, a sektor dostaje probke stoku', po.out.sawmillInfoAfter && Math.abs(po.out.sawmillInfoAfter.groupY - (po.out.sawmillInfoAfter.topY + 0.01)) < 1e-8 && Number.isFinite(po.out.sawmillInfoAfter.sectorSurfaceY), po.out.sawmillInfoAfter);
  check('PRZED: cofniecie poprawki w buildzie powoduje utrate dekoru pod tartakiem', przed.out.sawmillAfter < przed.out.sawmillBefore, { before: przed.out.sawmillBefore, after: przed.out.sawmillAfter });
  check('PO: po swiadomym wyrebie tartak znika, a nakladka przechodzi na Brak', po.out.sawmillAfterCut && !po.out.sawmillAfterCut.layers.includes('tartak') && po.out.sawmillAfterCut.overlay === 'brak', po.out.sawmillAfterCut);
  check('obie sesje real-render koncza sie bez pageerror', !przed.errors.some(e => e.startsWith('[pageerror]')) && !po.errors.some(e => e.startsWith('[pageerror]')), { before: przed.errors, after: po.errors });

  // Tymczasowa konfiguracja Vite'a musi POWSTAC w gra/ (rozwiazywanie `vite`/pluginow idzie
  // przez gra/node_modules), wiec sprzatamy ja jawnie — drzewo Gita zostaje czyste.
  try { fs.unlinkSync(VITE_CFG); } catch { /* juz usunieta */ }

  console.log('\n===== ' + pass + ' PASS / ' + fail + ' FAIL =====');
  console.log('zrzuty: ' + SHOTS);
  fs.writeFileSync(path.join(SHOTS, 'results.json'), JSON.stringify({ before: przed.out, after: po.out, browserErrors: { before: przed.errors, after: po.errors }, checks: { pass, fail } }, null, 2) + '\n');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  try { fs.unlinkSync(VITE_CFG); } catch { /* juz usunieta */ }
  console.error(e);
  process.exit(1);
});
