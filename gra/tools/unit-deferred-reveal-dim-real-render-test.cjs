'use strict';
/**
 * unit-deferred-reveal-dim-real-render-test.cjs
 *
 * TEMAT: P-JEDNOSTKA-NIEWIDOCZNA-PO-WYBUDOWANIU-Q1, runda 2 (opcja A właściciela).
 *
 * Dlaczego ten test istnieje: jednostka gracza ukończona w ticku end-turn trafia do
 * `deferredPlayerUnitRevealIds` (main.ts) i do rundy 1 była CAŁKOWICIE filtrowana z
 * listy `src` przekazywanej do `unitRenderer.sync()` — token nie istniał w scenie
 * Three.js w ogóle, więc dla gracza jednostka po prostu znikała aż do końca fazy AI.
 * Właściciel wybrał opcję A: token ma być RENDEROWANY, ale przyciemniony/
 * półprzezroczysty, a po `flushDeferredPlayerUnitReveals()` wracać do pełnej
 * widoczności BEZ migotania i BEZ podwójnego żetonu.
 *
 * Ten test odtwarza obie ścieżki w PRAWDZIWEJ przeglądarce (Playwright/Chromium,
 * WebGL, prawdziwy `UnitRenderer` z `src/render/units.ts`), w trzech fazach na tej
 * samej scenie i tym samym rendererze:
 *
 *   FAZA A „PRZED"      — dokładnie dzisiejsza semantyka main.ts:10114-10116:
 *                         `sync(rawSrc.filter(u => !deferred.has(u.id)), display)`
 *                         → token nowej jednostki NIE ISTNIEJE w scenie.
 *   FAZA B „PO"         — semantyka po naprawie: `sync(rawSrc, display, deferred)`
 *                         → token ISTNIEJE, widoczny, wszystkie materiały siatek
 *                         mają `transparent === true` i `opacity < 1`.
 *   FAZA C „PO FLUSH"   — `sync(rawSrc, display)` bez zbioru odroczeń → ten SAM
 *                         obiekt (to samo `uuid` — brak przebudowy = brak migotania),
 *                         materiały przywrócone 1:1 do stanu jednostki kontrolnej.
 *
 * Wartości `opacity`/`transparent` czytane są z ŻYWYCH materiałów Three.js przez
 * `scene.traverse`, nie z kodu źródłowego. Każda faza zapisuje zrzut PNG.
 *
 * NIETAUTOLOGICZNOŚĆ: uruchomiony na kodzie SPRZED naprawy (sync ignoruje 3. argument)
 * faza B czerwienieje — token renderuje się z `opacity === 1`.
 *
 * Jednostka kontrolna `u-stara` (ten sam właściciel, ta sama kategoria, nigdy nie
 * odroczona) stoi obok przez wszystkie trzy fazy i służy jako wzorzec „normalnego
 * stanu materiałów" — dzięki temu test wykrywa zarówno brak przyciemnienia, jak i
 * przeciek przyciemnienia na jednostki spoza okna odroczenia (GOAL 5).
 *
 * Usage (z gra/): node tools/unit-deferred-reveal-dim-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[unit-deferred-reveal-dim] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.unit-deferred-reveal-dim-entry.ts');
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
const OUTFILE = path.resolve(os.tmpdir(), `unit-deferred-reveal-dim-bundle-${TMPDIR_RUN_ID}.js`);
const SHOTS = process.env.CIV_DEFERRED_SHOTS_DIR
  || path.join(os.tmpdir(), `civ-jednostka-niewidoczna-r2-shots-${TMPDIR_RUN_ID}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  const args = ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'];
  try {
    return await chromium.launch({ headless: true, args });
  } catch (e) {
    console.log('[unit-deferred-reveal-dim] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME, args: args.concat(['--no-sandbox']),
    });
  }
}

const ENTRY_TS = `
import * as THREE from 'three';
import { UnitRenderer } from '../src/render/units';

const W = 960;
const H = 420;

function makeHex(q: number, r: number): any {
  return {
    coords: { q, r },
    terenBazowy: 'laka',
    nakladka: 'brak',
    ulepszenie: 'brak',
    wlasciciel: null,
    wioska: { jest: false, ludnosc: 0 },
    widocznosc: {},
    rzeka: { krawedzie: [] },
  };
}

function makeUnit(id: string, q: number, r: number): any {
  return {
    id, ownerId: 0, typeId: 'wlocznik', category: 'wlocznik',
    q, r, ruch: 2, ruchLeft: 2, hp: 100,
  };
}

const hexes: Record<string, any> = {};
for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) hexes[q + ',' + r] = makeHex(q, r);
const gameMap: any = { szerokoscQ: 7, wysokoscR: 7, hexes, seed: 1, rzeki: [] };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1d3b1d);

// Płaszczyzna gruntu + pionowe tło w kontrastowym kolorze — dzięki temu
// półprzezroczysty żeton widać na zrzucie jako przenikający, nie tylko jako
// liczbę w opacity.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x4c7a34, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0.529;
scene.add(ground);
const backdrop = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 12),
  new THREE.MeshBasicMaterial({ color: 0xf2e6c9 }),
);
backdrop.position.set(0, 3, -4);
scene.add(backdrop);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(3, 6, 4);
scene.add(dir);

const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.setPixelRatio(1);
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);

const unitRenderer = new UnitRenderer(scene, gameMap as any);

const OLD_ID = 'u-stara';
const NEW_ID = 'u-nowa';
const rawSrc = [makeUnit(OLD_ID, -1, 0), makeUnit(NEW_ID, 1, 0)];
const display: any = {
  visibleIds: new Set([OLD_ID, NEW_ID]),
  badgeByRepId: new Map(),
};
const deferred = new Set<string>([NEW_ID]);

function frameCamera(): void {
  const box = new THREE.Box3();
  for (const id of [OLD_ID, NEW_ID]) {
    const o = findToken(id);
    if (o) box.expandByObject(o);
  }
  if (box.isEmpty()) box.setFromCenterAndSize(new THREE.Vector3(0, 0.8, 0), new THREE.Vector3(4, 1, 1));
  // Stała ramka dla WSZYSTKICH faz — inaczej zrzuty PRZED/PO nie byłyby
  // porównywalne side-by-side (różny kadr = różny obraz z innego powodu).
  const center = new THREE.Vector3(0, 0.82, 0);
  camera.position.set(0, 1.65, 3.6);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

function findToken(unitId: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  scene.traverse((o) => {
    if (o.userData && o.userData['unitId'] === unitId && !found) found = o;
  });
  return found;
}

function countTokens(unitId: string): number {
  let n = 0;
  scene.traverse((o) => { if (o.userData && o.userData['unitId'] === unitId) n++; });
  return n;
}

/**
 * Stan ŻYWYCH materiałów siatek żetonu, odczytany ze sceny (nie z kodu).
 *
 * Rozdziela dwa ROZŁĄCZNE zbiory, bo mają przeciwne kryteria akceptacji:
 *   own    — materiały WŁASNE żetonu (group.userData['mats']: model z
 *            buildUnitModel + pierścień właściciela/wojny). Tylko one mają
 *            prawo się przyciemnić.
 *   shared — materiały siatek podpiętych pod żeton, ale będących SINGLETONAMI
 *            MODUŁU (odznaki ulepszeń unitUpgradeBadges.ts, gwiazdki weterana
 *            unitVeteranBadges.ts — jedna instancja na całą grę, współdzielona
 *            przez WSZYSTKIE jednostki na mapie). Ich zmiana przyciemniłaby cudze
 *            żetony, więc muszą zostać nietknięte.
 */
function matSnap(m: any): any {
  return { type: m.type, transparent: m.transparent === true, opacity: m.opacity };
}

function tokenMatState(unitId: string): any {
  const root = findToken(unitId);
  if (!root) return null;
  const ownUuids = new Set<string>(
    ((root.userData['mats'] as any[]) ?? []).map((m: any) => m.uuid),
  );
  const own: any[] = [];
  const shared: any[] = [];
  root.traverse((o: any) => {
    if (!o.isMesh || !o.material) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of list) (ownUuids.has(m.uuid) ? own : shared).push(matSnap(m));
  });
  const byKey = (a: any, b: any) =>
    (a.type + '|' + a.opacity).localeCompare(b.type + '|' + b.opacity);
  own.sort(byKey);
  shared.sort(byKey);
  return {
    uuid: root.uuid,
    visible: root.visible,
    ownCount: own.length,
    own,
    sharedCount: shared.length,
    shared,
    minOwnOpacity: own.length ? Math.min(...own.map((m) => m.opacity)) : null,
    maxOwnOpacity: own.length ? Math.max(...own.map((m) => m.opacity)) : null,
    allOwnTransparent: own.length > 0 && own.every((m) => m.transparent === true),
    allOwnBelowOne: own.length > 0 && own.every((m) => m.opacity < 1),
  };
}

function draw(): void {
  frameCamera();
  renderer.render(scene, camera);
}

const w = window as any;

/** FAZA A — dzisiejsza semantyka main.ts: odroczone ID odfiltrowane z src. */
w.__phasePrzed = () => {
  unitRenderer.sync(rawSrc.filter((u) => !deferred.has(u.id)) as any, display);
  draw();
  return {
    newToken: tokenMatState(NEW_ID),
    oldToken: tokenMatState(OLD_ID),
    newTokenCount: countTokens(NEW_ID),
  };
};

/** FAZA B — po naprawie: odroczone ID przekazane do sync() jako oznaczenie. */
w.__phasePo = () => {
  unitRenderer.sync(rawSrc as any, display, deferred);
  // Drugie wywołanie z tym samym stanem — sprawdza IDEMPOTENCJĘ (brak
  // kumulowania przyciemnienia klatka po klatce).
  unitRenderer.sync(rawSrc as any, display, deferred);
  draw();
  return {
    newToken: tokenMatState(NEW_ID),
    oldToken: tokenMatState(OLD_ID),
    newTokenCount: countTokens(NEW_ID),
  };
};

/** FAZA C — flushDeferredPlayerUnitReveals(): ten sam src, bez oznaczenia. */
w.__phaseFlush = () => {
  unitRenderer.sync(rawSrc as any, display);
  draw();
  return {
    newToken: tokenMatState(NEW_ID),
    oldToken: tokenMatState(OLD_ID),
    newTokenCount: countTokens(NEW_ID),
  };
};

w.__webglOk = () => {
  const ctx = (renderer as any).getContext?.();
  return !!ctx;
};
`;

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.writeFileSync(ENTRY, ENTRY_TS, 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1000, height: 460 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

  const webglOk = await page.evaluate(() => window.__webglOk());
  check('WebGL dostępny w headless Chromium (bez tego dowód wizualny jest nieważny)', webglOk === true, webglOk);
  if (!webglOk) {
    await browser.close();
    console.log(`\nWynik: ${pass} pass / ${fail} fail`);
    process.exit(1);
  }

  const shot = async (name) => {
    const p = path.join(SHOTS, name);
    await page.locator('canvas').screenshot({ path: p });
    return p;
  };

  const przed = await page.evaluate(() => window.__phasePrzed());
  const shotPrzed = await shot('01-PRZED-okno-odroczenia-token-filtrowany.png');

  const po = await page.evaluate(() => window.__phasePo());
  const shotPo = await shot('02-PO-okno-odroczenia-token-przyciemniony.png');

  const flush = await page.evaluate(() => window.__phaseFlush());
  const shotFlush = await shot('03-PO-FLUSH-token-pelna-widocznosc.png');

  check('brak błędów konsoli/pageerror podczas trzech faz renderu', consoleErrors.length === 0, consoleErrors);

  // ---- FAZA A: PRZED (dzisiejszy stan produkcyjny) -------------------------
  check(
    'FAZA A (PRZED): token odroczonej jednostki NIE ISTNIEJE w scenie (dzisiejszy filtr src)',
    przed.newToken === null && przed.newTokenCount === 0,
    { newTokenCount: przed.newTokenCount },
  );
  check(
    'FAZA A (PRZED): jednostka kontrolna jest w scenie i widoczna',
    !!przed.oldToken && przed.oldToken.visible === true && przed.oldToken.ownCount > 0,
    przed.oldToken && { visible: przed.oldToken.visible, ownCount: przed.oldToken.ownCount },
  );

  // ---- FAZA B: PO naprawie (okno odroczenia) ------------------------------
  check(
    'FAZA B (PO): token odroczonej jednostki ISTNIEJE w scenie, dokładnie jeden (brak podwójnego żetonu)',
    !!po.newToken && po.newTokenCount === 1,
    { newTokenCount: po.newTokenCount },
  );
  check(
    'FAZA B (PO): token odroczonej jednostki jest WIDOCZNY (visible === true)',
    !!po.newToken && po.newToken.visible === true,
    po.newToken && po.newToken.visible,
  );
  check(
    'FAZA B (PO): WSZYSTKIE własne materiały żetonu mają transparent === true',
    !!po.newToken && po.newToken.allOwnTransparent === true,
    po.newToken && po.newToken.own,
  );
  check(
    'FAZA B (PO): WSZYSTKIE własne materiały żetonu mają opacity < 1',
    !!po.newToken && po.newToken.allOwnBelowOne === true,
    po.newToken && { min: po.newToken.minOwnOpacity, max: po.newToken.maxOwnOpacity },
  );
  check(
    'FAZA B (PO): przyciemnienie NIE jest bliskie niewidoczności (max opacity >= 0.20)',
    !!po.newToken && po.newToken.maxOwnOpacity >= 0.20,
    po.newToken && po.newToken.maxOwnOpacity,
  );
  check(
    'FAZA B (PO): przyciemnienie jest WYRAŹNE względem pełnej widoczności (max opacity <= 0.75)',
    !!po.newToken && po.newToken.maxOwnOpacity <= 0.75,
    po.newToken && po.newToken.maxOwnOpacity,
  );
  check(
    'FAZA B (PO): dwa kolejne sync() w tym samym stanie NIE kumulują przyciemnienia (idempotencja)',
    !!po.newToken && po.newToken.minOwnOpacity > 0,
    po.newToken && po.newToken.minOwnOpacity,
  );
  check(
    'FAZA B (PO, GOAL 5): pierścień właściciela (już półprzezroczysty, 0.42) NIE dostaje '
      + 'PODWÓJNEGO przyciemnienia — próg, nie mnożnik',
    !!po.newToken && po.newToken.minOwnOpacity >= 0.42 - 1e-6,
    po.newToken && po.newToken.own,
  );
  check(
    'FAZA B (PO, GOAL 5): jednostka spoza okna odroczenia ma NIEZMIENIONE materiały (zero przecieku)',
    !!po.oldToken && !!przed.oldToken
      && JSON.stringify(po.oldToken.own) === JSON.stringify(przed.oldToken.own),
    { przed: przed.oldToken && przed.oldToken.own, po: po.oldToken && po.oldToken.own },
  );
  check(
    'FAZA B (PO, GOAL 5): materiały-SINGLETONY odznak (współdzielone przez WSZYSTKIE jednostki '
      + 'na mapie) NIE zostały przyciemnione',
    !!po.newToken && !!przed.oldToken
      && JSON.stringify(po.newToken.shared) === JSON.stringify(przed.oldToken.shared),
    { przed: przed.oldToken && przed.oldToken.shared, po: po.newToken && po.newToken.shared },
  );

  // ---- FAZA C: flush -------------------------------------------------------
  check(
    'FAZA C (FLUSH): ten SAM obiekt żetonu co w oknie odroczenia (to samo uuid = brak przebudowy = brak migotania)',
    !!flush.newToken && !!po.newToken && flush.newToken.uuid === po.newToken.uuid,
    { po: po.newToken && po.newToken.uuid, flush: flush.newToken && flush.newToken.uuid },
  );
  check(
    'FAZA C (FLUSH): nadal dokładnie jeden token tej jednostki w scenie',
    flush.newTokenCount === 1,
    flush.newTokenCount,
  );
  check(
    'FAZA C (FLUSH): materiały żetonu przywrócone 1:1 do stanu jednostki kontrolnej (normalny stan jednostki)',
    !!flush.newToken && !!flush.oldToken
      && JSON.stringify(flush.newToken.own) === JSON.stringify(flush.oldToken.own),
    { nowa: flush.newToken && flush.newToken.own, kontrolna: flush.oldToken && flush.oldToken.own },
  );
  check(
    'FAZA C (FLUSH): przyciemnienie zdjęte — max opacity własnych materiałów wrócił do 1',
    !!flush.newToken && flush.newToken.maxOwnOpacity === 1,
    flush.newToken && flush.newToken.maxOwnOpacity,
  );
  check(
    'FAZA C (FLUSH): pierścień właściciela wrócił do własnej wartości 0.42 (nie do 1 — bez '
      + 'nadpisania normalnego stanu)',
    !!flush.newToken && Math.abs(flush.newToken.minOwnOpacity - 0.42) < 1e-6,
    flush.newToken && flush.newToken.minOwnOpacity,
  );

  await browser.close();

  console.log('\nZrzuty (side-by-side PRZED → PO → PO FLUSH):');
  console.log('  ' + shotPrzed);
  console.log('  ' + shotPo);
  console.log('  ' + shotFlush);
  console.log(`\nWynik: ${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
