'use strict';
/**
 * oboz-lowiecki-las-znika-render-test.cjs
 * TEMAT: R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1 (Operator, runda 1).
 *
 * ZGŁOSZENIE (właściciel, 2026-09-02, kilka zrzutów mapy 3D): „po wybudowaniu czegokolwiek
 * na wzgórzu, jeżeli jest tam las, to ten las jakby znika i ja go przynajmniej nie widzę”
 * oraz „widzę budowanie tych obozów, także na łąkach, na których nie ma lasu”.
 *
 * CZĘŚĆ A — PRZYCZYNA. `syncImprovementDecorForHex` (main.ts) kończyła się gałęzią
 * `if (elevated) hideDecorAtHex(hexKey)`, która NIE pytała o las: każde ulepszenie spoza
 * `farma`/`bydlo`, które nie zachowuje reliefu, kasowało CAŁY dekor heksa — w tym kępę
 * drzew. Obóz łowiecki może stać WYŁĄCZNIE na nakładce Las (twardy gate
 * `computeImprovementBuildImpact`, map/improvement-build.ts), więc render kasował las
 * będący warunkiem jego istnienia i zostawiał goły, spłaszczony heks.
 *
 * CZĘŚĆ B — „obozy na łące bez lasu”. Ten sam test mierzy `hex.nakladka` W DANYCH dla
 * heksa, który po postawieniu obozu WYGLĄDA jak bezleśna łąka. Sekcja (E) dowodzi, że
 * dane pozostają `Las` — czyli „łąka z obozami” ze zrzutu właściciela to SKUTEK błędu
 * renderu z Części A (zniknięta kępa + spłaszczony kopiec wzgórza), a nie obóz postawiony
 * poza lasem. Sekcja (F) niezależnie potwierdza, że twardy gate nie przecieka.
 *
 * DLACZEGO ŻYWA PRZEGLĄDARKA (R-PROC-AUTOBOT.md §9 poz. 6a). Zniknięcie kępy to
 * wyzerowanie macierzy instancji `InstancedMesh` w `hideDecorAtHex` (render/scene.ts) —
 * ani test kontraktowy, ani jsdom tego nie widzą. Test buduje grę DOZWOLONĄ komendą
 * (`node ./node_modules/vite/bin/vite.js build`, C-001 — nigdy `npm run build`), ładuje ją
 * w headless Chromium (Playwright), stawia obóz REALNĄ ścieżką `applyBuildRequest`
 * i LICZY widoczne instancje dekoru nad heksem + zrzuca `page.screenshot()`.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI. Test buduje DWA bundle. Wariant `przed` ma poprawkę cofniętą
 * W LOCIE (transform w konfiguracji Vite, BEZ dotykania plików w repo:
 * `forestKeptUnderImprovement` → `false`) i MUSI pokazać kępę zniknioną (0 instancji).
 * Wariant `po` MUSI pokazać kępę widoczną. Gdyby asercja przechodziła w obu — nie mierzyłaby
 * niczego. Zrzut z wariantu `przed` jest jednocześnie materiałem PRZED.
 *
 * Bramka (z katalogu gra/): node tools/oboz-lowiecki-las-znika-render-test.cjs
 *   --shots <katalog>   zrzuty PRZED/PO (domyślnie: <os.tmpdir()>/oboz-las-shots)
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const VITE_CFG = path.join(__dirname, '.oboz-las-vite.config.mts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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
const SHOTS = argOf('--shots') || path.join(os.tmpdir(), `oboz-las-shots-${TMPDIR_RUN_ID}`);

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

function writeViteConfig() {
  const cfg = `
import base from '../vite.config';
import type { Plugin } from 'vite';

const VARIANT = process.env.OBOZ_LAS_VARIANT || 'po';
const HOOKS = ${JSON.stringify(HOOKS)};
const ANCHOR = ${JSON.stringify(ANCHOR)};
const FIX_SRC = ${JSON.stringify(FIX_SRC)};
const FIX_REVERTED = ${JSON.stringify(FIX_REVERTED)};

function patchMain(): Plugin {
  return {
    name: 'oboz-las-patch',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!id.replace(/\\\\/g, '/').endsWith('/src/main.ts')) return null;
      if (!code.includes(ANCHOR)) throw new Error('[oboz-las] kotwica haka testowego nie znaleziona w main.ts');
      let out = code.replace(ANCHOR, HOOKS + ANCHOR);
      if (VARIANT === 'przed') {
        if (!out.includes(FIX_SRC)) throw new Error('[oboz-las] blok poprawki nie znaleziony w main.ts (mutacja niemozliwa)');
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
  console.log('[oboz-las] vite build (' + variant + ') -> ' + outDir);
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

async function boot(page, html) {
  await page.goto('file://' + html + '?playtest=mapa', { waitUntil: 'load', timeout: 180000 });
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
  const browser = await launch(chromium);
  const errors = [];
  const out = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    await boot(page, html);

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
  }
}

async function main() {
  let chromium;
  try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
  catch (e) { console.error('[oboz-las] playwright missing'); process.exit(1); }

  writeViteConfig();
  const htmlPo = build('po', path.join(os.tmpdir(), `civ-dist-oboz-las-po-${TMPDIR_RUN_ID}`));
  const htmlPrzed = build('przed', path.join(os.tmpdir(), `civ-dist-oboz-las-przed-${TMPDIR_RUN_ID}`));

  console.log('\n== WARIANT PRZED (poprawka cofnieta w locie) ==');
  const przed = await runVariant(chromium, 'przed', htmlPrzed);
  console.log('   ' + JSON.stringify(przed.out));
  console.log('\n== WARIANT PO (kod z repo) ==');
  const po = await runVariant(chromium, 'po', htmlPo);
  console.log('   ' + JSON.stringify(po.out));

  console.log('\n-- (A) KRYTERIUM 1 (PRZED): oboz lowiecki na Wzgorzu z Lasem KASUJE kepe --');
  check('PRZED: znaleziono heks Wzgorza+Las z widoczna kepa', !przed.out.skipped && przed.out.campBefore > 0, przed.out);
  check('PRZED: nakladka przed budowa === Las', przed.out.campInfoBefore && przed.out.campInfoBefore.nakladka === 'las', przed.out.campInfoBefore);
  check('PRZED: oboz faktycznie postawiony', !!przed.out.campInfoAfter && przed.out.campInfoAfter.layers.includes('oboz_lowiecki'), przed.out.campInfoAfter);
  // UWAGA DO LICZB: `decorCount` liczy KAŻDĄ widoczną instancję nad heksem, więc obejmuje też
  // kafelek gruntu — `hideDecorAtHex` celowo go NIE chowa („nie rób dziury z oceanem”,
  // render/scene.ts, F-CITY-HEX). Dlatego „kępa schowana” = SPADEK liczby, nie zero.
  check('PRZED: dekor heksa ZNIKA (spadek liczby widocznych instancji) — objaw zgloszony przez wlasciciela',
    przed.out.campAfter < przed.out.campBefore, { przed: przed.out.campBefore, po: przed.out.campAfter });
  check('PRZED: mimo zniknietego lasu dane heksu NADAL Las (to byl wylacznie render)',
    przed.out.campInfoAfter && przed.out.campInfoAfter.nakladka === 'las', przed.out.campInfoAfter);

  console.log('\n-- (B) KRYTERIUM 2 (PO): ta sama sytuacja — kepa ZOSTAJE widoczna --');
  check('PO: znaleziono heks Wzgorza+Las z widoczna kepa', !po.out.skipped && po.out.campBefore > 0, po.out);
  check('PO: oboz faktycznie postawiony', !!po.out.campInfoAfter && po.out.campInfoAfter.layers.includes('oboz_lowiecki'), po.out.campInfoAfter);
  check('PO: dekor heksa NADAL widoczny (>0 instancji)', po.out.campAfter > 0, { przed: po.out.campBefore, po: po.out.campAfter });
  check('PO: liczba widocznych instancji dekoru bez zmian', po.out.campAfter === po.out.campBefore, { przed: po.out.campBefore, po: po.out.campAfter });
  check('PO: nakladka nadal Las (ZERO zmian w danych)', po.out.campInfoAfter && po.out.campInfoAfter.nakladka === 'las', po.out.campInfoAfter);

  console.log('\n-- (C) NIETAUTOLOGICZNOSC: ta sama asercja czerwienieje na kodzie sprzed poprawki --');
  check('mutacja dziala: PRZED gubi dekor, PO zachowuje go co do jednej instancji',
    przed.out.campAfter < przed.out.campBefore && po.out.campAfter === po.out.campBefore
      && przed.out.campBefore === po.out.campBefore,
    { przed: [przed.out.campBefore, przed.out.campAfter], po: [po.out.campBefore, po.out.campAfter] });

  console.log('\n-- (D) KRYTERIUM 3: brak regresu --');
  check('bydlo na Wzgorzu z Lasem NADAL chowa kepe (decyzja Macieja 2026-07-21 nietknieta)',
    !!po.out.cowInfoAfter && po.out.cowInfoAfter.layers.includes('bydlo') && po.out.cowAfter < po.out.cowBefore,
    { before: po.out.cowBefore, after: po.out.cowAfter, layers: po.out.cowInfoAfter && po.out.cowInfoAfter.layers });
  check('bydlo: identycznie PRZED i PO poprawce', przed.out.cowBefore === po.out.cowBefore && przed.out.cowAfter === po.out.cowAfter,
    { przed: [przed.out.cowBefore, przed.out.cowAfter], po: [po.out.cowBefore, po.out.cowAfter] });
  check('kamieniolom (zachowuje relief) na golym Wzgorzu NADAL nie chowa dekoru',
    Array.isArray(po.out.quarryLayers) && po.out.quarryLayers.includes('kamieniolom')
      && po.out.quarryAfter === po.out.quarryBefore,
    { before: po.out.quarryBefore, after: po.out.quarryAfter, layers: po.out.quarryLayers });
  check('tarasy na golym Wzgorzu NADAL chowaja dekor',
    Array.isArray(po.out.terraceLayers) && po.out.terraceLayers.includes('tarasy')
      && po.out.terraceAfter < po.out.terraceBefore,
    { before: po.out.terraceBefore, after: po.out.terraceAfter, layers: po.out.terraceLayers });
  check('zachowanie regresyjne identyczne w obu wariantach (poprawka nic wiecej nie rusza)',
    przed.out.quarryAfter === po.out.quarryAfter && przed.out.terraceAfter === po.out.terraceAfter,
    { przed: [przed.out.quarryAfter, przed.out.terraceAfter], po: [po.out.quarryAfter, po.out.terraceAfter] });

  console.log('\n-- (E) KRYTERIUM 4 (Czesc B): oboz NIE powstaje na terenie bez lasu --');
  check('PO: heks docelowy jest BEZ lasu', po.out.bareInfoBefore && po.out.bareInfoBefore.nakladka !== 'las', po.out.bareInfoBefore);
  check('PO: applyBuildRequest("oboz_lowiecki") na heksie bez lasu NIE stawia obozu (twardy gate trzyma)',
    po.out.bareInfoAfter && !po.out.bareInfoAfter.layers.includes('oboz_lowiecki'), po.out.bareInfoAfter);
  check('PRZED: ten sam wynik (gate niezalezny od tej poprawki)',
    przed.out.bareInfoAfter && !przed.out.bareInfoAfter.layers.includes('oboz_lowiecki'), przed.out.bareInfoAfter);
  check('kontrola pozytywna: TEN SAM heks przyjmuje ulepszenie nielesne (odrzucenie to bramka lasu, nie martwa sciezka)',
    Array.isArray(po.out.bareControl) && po.out.bareControl.includes('posterunek'), po.out.bareControl);

  // -------------------------------------------------------------------------
  // (G) ZGODNOSC KOMENTARZA Z ZACHOWANIEM — obrona zarzutu 2 rundy 1.
  // Evaluator wykazal, ze twierdzenie „predykat przepuszcza DOKLADNIE cztery klucze" bylo
  // niescisle: `lodzie_rybackie` nie jest ani w FOREST_COEXIST_IMPROVEMENT_KEYS, ani w
  // FOREST_BLOCKED_IMPROVEMENT_KEYS, ani w isStadninaBlockedOnForest, wiec predykat zwraca
  // dla niego `false` — przepuszcza PIEC. Wyklucza je z tej galezi dopiero warunek TERENU.
  // Ponizsze asercje pilnuja, zeby opis przy poprawce nie rozjechal sie z kodem ponownie.
  // -------------------------------------------------------------------------
  console.log('\n-- (G) opis == zachowanie: predykat lasu vs. warunek terenu --');
  const OCZEKIWANE_PRZEPUSZCZONE = ['bydlo', 'lama', 'lodzie_rybackie', 'oboz_lowiecki', 'owce'];
  check('ZYWY predykat przepuszcza DOKLADNIE 5 kluczy zywnosciowych (nie 4)',
    Array.isArray(po.out.foodKeysOnForest)
      && po.out.foodKeysOnForest.length === OCZEKIWANE_PRZEPUSZCZONE.length
      && OCZEKIWANE_PRZEPUSZCZONE.every((k, i) => po.out.foodKeysOnForest[i] === k),
    po.out.foodKeysOnForest);
  check('w tym `lodzie_rybackie` — predykat go NIE blokuje (wbrew opisowi z rundy 1)',
    Array.isArray(po.out.foodKeysOnForest) && po.out.foodKeysOnForest.includes('lodzie_rybackie'),
    po.out.foodKeysOnForest);
  check('oba warianty bundla widza ten sam zbior (wariant „przed" cofa UZYCIE, nie predykat)',
    JSON.stringify(przed.out.foodKeysOnForest) === JSON.stringify(po.out.foodKeysOnForest),
    { przed: przed.out.foodKeysOnForest, po: po.out.foodKeysOnForest });

  // Z galezi wyklucza `lodzie_rybackie` warunek terenu `elevated` (Wzgorza/Gory), bo TERRAIN_ALLOW
  // dopuszcza lodzie WYLACZNIE na Wybrzezu/Morzu — zbiory rozlaczne, wiec kombinacja jest tu
  // strukturalnie nieosiagalna i jawny warunek terenu w renderze bylby martwym kodem.
  const IB_SRC = fs.readFileSync(path.join(GRA, 'src', 'map', 'improvement-build.ts'), 'utf8');
  const lodzieAllow = /lodzie_rybackie:\s*new Set\(\[([^\]]*)\]\)/.exec(IB_SRC);
  check('TERRAIN_ALLOW.lodzie_rybackie === {Wybrzeze, Morze} (rozlaczne z Wzgorza/Gory)',
    !!lodzieAllow && /Wybrzeze/.test(lodzieAllow[1]) && /Morze/.test(lodzieAllow[1])
      && !/Wzgorza|Gory/.test(lodzieAllow[1]), lodzieAllow && lodzieAllow[1]);

  const MAIN_SRC = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
  const opis = MAIN_SRC.slice(
    MAIN_SRC.indexOf('R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1 (zgłoszenie'),
    MAIN_SRC.indexOf('const forestKeptUnderImprovement'));
  check('komentarz przy poprawce NIE twierdzi juz „przechodzą DOKŁADNIE cztery"',
    opis.length > 0 && !/przechodzą DOKŁADNIE cztery/.test(opis));
  check('komentarz nazywa `lodzie_rybackie` przepuszczonym przez predykat i wykluczonym TERENEM',
    /PIEC|PIĘĆ/.test(opis) && /lodzie_rybackie/.test(opis) && /WARUNEK TERENU/.test(opis));

  console.log('\n-- (F) brak bledow konsoli --');
  check('PO: zero console.error/pageerror', po.errors.length === 0, po.errors.slice(0, 5));

  // Tymczasowa konfiguracja Vite'a musi POWSTAC w gra/ (rozwiazywanie `vite`/pluginow idzie
  // przez gra/node_modules), wiec sprzatamy ja jawnie — drzewo Gita zostaje czyste.
  try { fs.unlinkSync(VITE_CFG); } catch { /* juz usunieta */ }

  console.log('\n===== ' + pass + ' PASS / ' + fail + ' FAIL =====');
  console.log('zrzuty: ' + SHOTS);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  try { fs.unlinkSync(VITE_CFG); } catch { /* juz usunieta */ }
  console.error(e);
  process.exit(1);
});
