'use strict';
/**
 * zelazo-jezdziec-oszczepami-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T4.
 *
 * ZGŁOSZENIE: jednostka Żelaza „Jeździec z oszczepami" (Słowianie, EN „Slavic
 * Javelin Cavalry") NIE MIAŁA własnego modelu. `categoryOf()` łapie ją słowem
 * `jezdz` i zwraca kategorię `konnica`, więc dostawała generyczny `case
 * 'konnica'` z KOPIĄ/LANCĄ trzymaną nadręcznie i proporczykiem — mimo że w
 * units.json ma `Atak dystansowy: 2`, `Zasięg ataku (hex): 2`, `Ilość
 * pocisków: 5` i `Uwagi: „rzut oszczepami… przed walką wręcz"`. To ta sama
 * klasa błędu, którą T1 naprawił dla asyryjskiej konnicy łuczniczej.
 * Naprawa: `zelazo-jezdziec-oszczepami-opus5.ts` + JEDNA nowa gałąź nazwana
 * w `buildNamedUnit()` (`units.ts`), stojąca PRZED generycznym `case 'konnica'`.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA (R-PROC-AUTOBOT.md §9 poz. 6a): to jest model
 * 3D (Three.js). Jedynym sposobem sprawdzenia, że jeździec faktycznie DZIERŻY
 * OSZCZEP GOTOWY DO RZUTU (a nie że kod się kompiluje), jest zbudowanie grupy
 * w żywym silniku i ZMIERZENIE jej faktycznej struktury — nie odczyt źródła.
 *
 * LEKCJA T1/T3 WBUDOWANA W TEN TEST. W rundzie 1 tematu T1 sekcje mierzące
 * NAZWY mesh i pudełko ZBIORCZE świeciły 25/25 na zielono, a model miał cztery
 * twarde błędy geometrii (lanca na wylot przez udo, dolne ramię łuku w grzbiecie
 * konia, dłoń mijająca cel o 0.17×HEX_R przy prostym ramieniu, obręcz tarczy
 * prostopadle do tarczy). T3 znalazł błąd geometrii w kodzie, który „wyglądał"
 * gotowy — dopiero POMIAREM. Dlatego sekcja (H) niżej mierzy RELACJE MIĘDZY
 * CZĘŚCIAMI, a punkty odniesienia (linia grzbietu, linia brzucha, oś przód-tył,
 * bark, głowa) bierze Z SAMEGO MODELU, nie z wpisanych liczb.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI — DWUSTOPNIOWY:
 *   (D) dispatch: drugi bundle z usuniętą DOKŁADNIE jedną linią dispatchu
 *       w `units.ts` (mutacja W LOCIE, plików w repo nie dotyka) — asercje
 *       rozstrzygające (A1-A5) MUSZĄ zapalić się na czerwono, bo jednostka
 *       spada z powrotem do generycznego `case 'konnica'`.
 *   (M) geometria: trzeci bundle z odwróconymi SAMYMI STAŁYMI POZY w
 *       `zelazo-jezdziec-oszczepami-opus5.ts` (chwyt rzutu na wysokość barku
 *       zamiast nad barkiem, pęk zapasu wzdłuż osi uda, zaczep puśliska
 *       przesunięty na tył siodła) — asercje (H) MUSZĄ zapalić się na czerwono
 *       przy NIEZMIENIONYM dispatchu. Bez tego stopnia (H) byłoby tautologią:
 *       „mierzę to, co sam przed chwilą zbudowałem".
 *
 * Usage (z gra/): node tools/zelazo-jezdziec-oszczepami-real-render-test.cjs
 *   --shots <katalog>   zrzuca PRZED/PO do <katalog>/*.png
 *   --dist <index.html> użyj gotowego artefaktu vite zamiast budować go w teście
 *   --skip-vite         pomiń sekcję (G) artefaktu produkcyjnego
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[zelazo-jezdziec-oszczepami-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-jezdziec-oszczepami-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.zelazo-jezdziec-oszczepami-bundle.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.zelazo-jezdziec-oszczepami-bundle-przed.js');
const BUNDLE_GEOM = path.resolve(__dirname, '.zelazo-jezdziec-oszczepami-bundle-geom.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const RENDER_TS = path.resolve(GRA, 'src', 'render', 'zelazo-jezdziec-oszczepami-opus5.ts');
const PLEMIONA_TS = path.resolve(GRA, 'src', 'render', 'jednostki-z3-plemiona.ts');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');
// C-001: jedyny dozwolony build to binarka vite z node_modules przez `node`,
// NIGDY `npm run build` ani `npx`; katalog wyjściowy POZA drzewem repo.
const VITE_BIN = path.resolve(GRA, 'node_modules', 'vite', 'bin', 'vite.js');

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const SKIP_VITE = process.argv.includes('--skip-vite');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const NAME_JEZDZIEC = 'Jeździec z oszczepami';
const NAME_JEZDZIEC_EN = 'Slavic Javelin Cavalry';
const NAME_LANCOWA = 'Konnica lancowa asyryjska';
const NAME_BRONZE = 'Konnica';
const NAME_DRUZYNNIK = 'Drużynnik';

const LINE_DISPATCH = "  if (n.includes('jezdziec z oszczepami') || n.includes('slavic javelin cavalry')) return buildZelazoJezdziecOszczepami(ownerColor_);\n";

/** (D) Odwrócenie DISPATCHU w locie. Nie dotyka plików w repo. */
const mutD = { applied: 0 };
const revertDispatchPlugin = {
  name: 'revert-dispatch',
  setup(build) {
    build.onLoad({ filter: /units\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== UNITS_TS) return null;
      let out = fs.readFileSync(args.path, 'utf8');
      if (out.includes(LINE_DISPATCH)) { out = out.replace(LINE_DISPATCH, ''); mutD.applied++; }
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

/**
 * (M) Odwrócenie SAMYCH STAŁYCH POZY w locie — dispatch zostaje nietknięty.
 * Każde podstawienie odtwarza konkretny, prawdopodobny błąd konstrukcyjny:
 *   1. chwyt rzutu na wysokości barku i przed nim = oszczep trzymany „jak
 *      kopia", nie w zamachu (dokładnie błąd, który ten temat naprawia) → H1;
 *   2. pęk zapasu przesunięty na oś uda i obniżony = drzewca przechodzą przez
 *      siodło i grzbiet konia (błąd rundy 1 lancy w T1, przeniesiony na pęk) → H6;
 *   3. zaczep puśliska przesunięty na tył siodła = strzemię wisi ukośnie,
 *      oderwane od stopy → H5;
 *   4. odwrócony znak nachylenia drzewca = grot w TYŁ zamiast w przód (klasa
 *      błędu, którą T3 znalazł w dory Falangi) → H2;
 *   5. `sjArmIK` z pominiętym wektorem bieguna = ramię z dwóch odcinków o TYM
 *      SAMYM kierunku, proste jak kij i przestrzeliwujące swój cel — DOKŁADNIE
 *      defekt rundy 1 tematu T1 → H4 (łokieć) i H3 (dłoń mija drzewce).
 *
 * PIERWSZE PODEJŚCIE MIAŁO TYLKO MUTACJE 1-3 i wtedy H2/H3/H4 zostawały
 * ZIELONE — czyli ta część (H) była jeszcze tautologią. Mutacje 4-5 zostały
 * dopisane właśnie po tym pomiarze, a próg H3 zaostrzono z 0.045 na 0.025
 * (wartość faktyczna ≈ 0.009, przestrzelenie przy mutacji 5 ≈ 0.054).
 */
const GEOM_MUTATIONS = [
  ["new THREE.Vector3(-0.040, 0.104, -0.026)", "new THREE.Vector3(-0.040, 0.004, 0.086)"],
  ["const SJ_SHEAF_GRIP = new THREE.Vector3(0.148, 0.535, 0.060);",
    "const SJ_SHEAF_GRIP = new THREE.Vector3(0.098, 0.430, 0.010);"],
  ["const SJ_STIRRUP_ANCHOR_Z = SJ_SEAT_ZA + 0.072;",
    "const SJ_STIRRUP_ANCHOR_Z = SJ_SEAT_ZA - 0.130;"],
  ["const SJ_JAV_TILT   = 1.15;", "const SJ_JAV_TILT   = -0.30;"],
  ["const elbow = C.clone().addScaledVector(pp, h);", "const elbow = C.clone();"],
];
const mutM = { applied: 0 };
const revertGeometryPlugin = {
  name: 'revert-geometry',
  setup(build) {
    build.onLoad({ filter: /zelazo-jezdziec-oszczepami-opus5\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== RENDER_TS) return null;
      let out = fs.readFileSync(args.path, 'utf8');
      for (const [from, to] of GEOM_MUTATIONS) {
        if (out.includes(from)) { out = out.split(from).join(to); mutM.applied++; }
      }
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins,
    logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[zelazo-jezdziec-oszczepami-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Buduje warianty i mierzy je w żywym Three.js. */
async function measureAll(page) {
  return page.evaluate(({ nameJezdziec, nameJezdziecEn, nameLancowa, nameBronze, nameDruzynnik, sjCoat }) => {
    const THREE = window.__THREE;
    const buildUnitModel = window.__buildUnitModel;
    const CORNERS = (bb) => [
      [bb.min.x, bb.min.y, bb.min.z], [bb.max.x, bb.min.y, bb.min.z],
      [bb.min.x, bb.max.y, bb.min.z], [bb.max.x, bb.max.y, bb.min.z],
      [bb.min.x, bb.min.y, bb.max.z], [bb.max.x, bb.min.y, bb.max.z],
      [bb.min.x, bb.max.y, bb.max.z], [bb.max.x, bb.max.y, bb.max.z],
    ];

    function measureGroup(obj) {
      obj.updateMatrixWorld(true);
      let minY = Infinity, maxY = -Infinity, maxR = 0;
      let meshCount = 0;
      const names = [];
      const nameCount = {};
      const v = new THREE.Vector3();
      // pomiary po NAZWANYCH częściach — pudełko zbiorcze nie wykryje broni
      // przechodzącej na wylot przez własnego konia.
      const partMinY = {};
      const partMaxY = {};
      const partAxis = {};
      const partPos = {};
      const qw = new THREE.Quaternion();

      obj.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
        const geo = o.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        const bb = geo.boundingBox;
        for (const c of CORNERS(bb)) {
          v.set(c[0], c[1], c[2]).applyMatrix4(o.matrixWorld);
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
          const r = Math.hypot(v.x, v.z);
          if (r > maxR) maxR = r;
        }
        if (!o.name) return;
        names.push(o.name);
        nameCount[o.name] = (nameCount[o.name] || 0) + 1;
        for (const c of CORNERS(bb)) {
          v.set(c[0], c[1], c[2]).applyMatrix4(o.matrixWorld);
          if (partMinY[o.name] === undefined || v.y < partMinY[o.name]) partMinY[o.name] = v.y;
          if (partMaxY[o.name] === undefined || v.y > partMaxY[o.name]) partMaxY[o.name] = v.y;
        }
        o.getWorldQuaternion(qw);
        partAxis[o.name] = new THREE.Vector3(0, 1, 0).applyQuaternion(qw).toArray();
        const wp = new THREE.Vector3();
        o.getWorldPosition(wp);
        partPos[o.name] = wp.toArray();
      });

      // Skrajne punkty oszczepu rzutowego: grot i pięta, po pozycji świata.
      const extremes = {};
      obj.traverse((o) => {
        if (!o.isMesh || !o.name) return;
        const geo = o.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        for (const c of CORNERS(geo.boundingBox)) {
          v.set(c[0], c[1], c[2]).applyMatrix4(o.matrixWorld);
          const e = extremes[o.name] || (extremes[o.name] = { minZ: Infinity, maxZ: -Infinity, minX: Infinity, maxX: -Infinity });
          if (v.z < e.minZ) e.minZ = v.z;
          if (v.z > e.maxZ) e.maxZ = v.z;
          if (v.x < e.minX) e.minX = v.x;
          if (v.x > e.maxX) e.maxX = v.x;
        }
      });

      const matCount = Array.isArray(obj.userData['mats']) ? obj.userData['mats'].length : -1;
      const coatHexes = (obj.userData['mats'] || [])
        .filter((mm) => mm && mm.color)
        .map((mm) => mm.color.getHex());
      return {
        meshCount, matCount, names, nameCount, minY, maxY, maxR,
        height: maxY - minY,
        hasSjCoat: coatHexes.includes(sjCoat),
        partMinY, partMaxY, partAxis, partPos, extremes,
      };
    }

    const OWNER = 0x3366ee;
    return {
      jezdziec: measureGroup(buildUnitModel('konnica', OWNER, nameJezdziec)),
      jezdziecEn: measureGroup(buildUnitModel('konnica', OWNER, nameJezdziecEn)),
      generic: measureGroup(buildUnitModel('konnica', OWNER)),
      bronze: measureGroup(buildUnitModel('konnica', OWNER, nameBronze)),
      lancowa: measureGroup(buildUnitModel('konnica', OWNER, nameLancowa)),
      druzynnik: measureGroup(buildUnitModel('miecznik', OWNER, nameDruzynnik)),
    };
  }, {
    nameJezdziec: NAME_JEZDZIEC, nameJezdziecEn: NAME_JEZDZIEC_EN,
    nameLancowa: NAME_LANCOWA, nameBronze: NAME_BRONZE, nameDruzynnik: NAME_DRUZYNNIK,
    sjCoat: 0x7d6247,
  });
}

const dot3 = (a, b) => (a && b ? a[0] * b[0] + a[1] * b[1] + a[2] * b[2] : NaN);
const dist3 = (a, b) => (a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : NaN);
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm3 = (a) => { const L = Math.hypot(a[0], a[1], a[2]); return [a[0] / L, a[1] / L, a[2] / L]; };

/** Odległość punktu P od PROSTEJ przechodzącej przez A o kierunku jednostkowym D. */
function distPointLine(P, A, D) {
  const w = sub3(P, A);
  const t = dot3(w, D);
  const proj = [A[0] + D[0] * t, A[1] + D[1] * t, A[2] + D[2] * t];
  return dist3(P, proj);
}

/**
 * Asercje ROZSTRZYGAJĄCE — mają padać na bundlu z odwróconym dispatchem (D).
 * `soft` = tylko zbierz wynik, nie licz do pass/fail.
 */
function assertDispatch(m, soft) {
  const results = [];
  const t = (id, name, cond, detail) => {
    results.push({ id, name, cond: !!cond });
    if (!soft) check(name, cond, detail);
  };
  const j = m.jezdziec;

  t('A1', '(A1) Jeździec ma drzewce i grot OSZCZEPU RZUTOWEGO (broń dystansowa, nie kopia)',
    j.names.includes('sj-jav-shaft') && j.names.includes('sj-jav-head'), j.names);
  t('A2', '(A2) Jeździec ma PĘK OSZCZEPÓW ZAPASOWYCH w drugiej dłoni',
    (j.nameCount['sj-spare-jav-shaft'] || 0) >= 2, j.nameCount);
  t('A3', '(A3) łączna liczba drzewc = units.json „Ilość pocisków" (5)',
    (j.nameCount['sj-jav-shaft'] || 0) + (j.nameCount['sj-spare-jav-shaft'] || 0) === 5,
    { rzutowy: j.nameCount['sj-jav-shaft'], zapas: j.nameCount['sj-spare-jav-shaft'] });
  t('A4', '(A4) Jeździec ma STRZEMIONA i siodło z łękami (inna rama czasowa niż Brąz/Asyria)',
    j.names.includes('sj-stirrup-tread') && j.names.includes('sj-stirrup-leather')
    && j.names.includes('sj-saddle-arch-front') && j.names.includes('sj-saddle-arch-rear'),
    j.names);
  t('A5', '(A5) model ma WIĘCEJ mesh niż generyczny fallback `case \'konnica\'`',
    j.meshCount > m.generic.meshCount,
    { jezdziec: j.meshCount, generic: m.generic.meshCount });
  return results;
}

/**
 * Asercje GEOMETRYCZNE (H) — mają padać na bundlu z odwróconymi stałymi pozy (M).
 * Punkty odniesienia brane Z MODELU: linia grzbietu (derka), linia brzucha
 * (poprąg), oś przód-tył (łeb − zad), bark (ramię rzutu), stopa (podeszwa).
 */
function assertGeometry(m, soft) {
  const results = [];
  const t = (id, name, cond, detail) => {
    results.push({ id, name, cond: !!cond });
    if (!soft) check(name, cond, detail);
  };
  const j = m.jezdziec;
  const hh = (v) => (v === undefined ? NaN : v);

  // oś PRZÓD (+) — z samego modelu, po yaw: od zadu do łba, rzut na XZ
  const skull = j.partPos['sj-horse-skull'];
  const rumpP = j.partPos['sj-horse-rump'];
  const fwd = skull && rumpP ? norm3([skull[0] - rumpP[0], 0, skull[2] - rumpP[2]]) : null;

  const backY = hh(j.partMaxY['sj-horse-pad']);      // linia GRZBIETU (góra derki)
  const bellyY = hh(j.partMinY['sj-horse-girth']);   // linia BRZUCHA (dół poprągu)
  const shldMidY = hh(j.partMaxY['sj-rider-torso']); // linia BARKÓW (góra torsu)

  // H1 — oszczep rzutowy jest NAD linią barków: chwyt górny, nie nadręczny.
  const javMinY = Math.min(hh(j.partMinY['sj-jav-shaft']), hh(j.partMinY['sj-jav-butt']));
  t('H1', '(H1) oszczep rzutowy w całości NAD linią barków jeźdźca (chwyt górny, nie kopia nadręczna)',
    Number.isFinite(javMinY) && Number.isFinite(shldMidY) && javMinY > shldMidY,
    { javMinY: +javMinY.toFixed(4), barkY: +shldMidY.toFixed(4) });

  // H2 — grot skierowany W PRZÓD i W GÓRĘ względem pięty drzewca.
  const headP = j.partPos['sj-jav-head'];
  const buttP = j.partPos['sj-jav-butt'];
  const fwdGain = fwd && headP && buttP ? dot3(sub3(headP, buttP), fwd) : NaN;
  const upGain = headP && buttP ? headP[1] - buttP[1] : NaN;
  t('H2', '(H2) grot oszczepu jest PRZED piętą drzewca i WYŻEJ od niej (poza rzutu, nie „na ramieniu")',
    Number.isFinite(fwdGain) && fwdGain > 0.15 && Number.isFinite(upGain) && upGain > 0.05,
    { doPrzodu: +(+fwdGain).toFixed(4), doGory: +(+upGain).toFixed(4) });

  // H3 — dłoń rzutu FAKTYCZNIE trzyma drzewce (leży na jego osi).
  const fistP = j.partPos['sj-throw-fist'];
  const shaftP = j.partPos['sj-jav-shaft'];
  const shaftAxis = j.partAxis['sj-jav-shaft'];
  const dOff = fistP && shaftP && shaftAxis ? distPointLine(fistP, shaftP, norm3(shaftAxis)) : NaN;
  t('H3', '(H3) dłoń rzutu leży NA OSI drzewca (<0.025×HEX_R) — trzyma oszczep, nie mija go',
    Number.isFinite(dOff) && dOff < 0.025, { odchylenieOdOsi: +(+dOff).toFixed(4) });

  // H4 — ramię rzutu ZGIĘTE w łokciu (lekcja T1: dwa odcinki o tym samym
  // kierunku dają rękę prostą jak kij).
  const upA = j.partAxis['sj-throw-uparm'];
  const foA = j.partAxis['sj-throw-forearm'];
  const bend = Math.acos(Math.max(-1, Math.min(1, dot3(upA, foA))));
  t('H4', '(H4) ramię rzutu jest ZGIĘTE w łokciu (>0.40 rad) — zamach, nie wyprostowany kij',
    Number.isFinite(bend) && bend > 0.40, { katLokcia: +(+bend).toFixed(3) });

  // H5 — puślisko wisi PIONOWO od siodła do strzemienia. Zaczep na siodle jest
  // stały, kabłąk wyprowadzony z faktycznej pozycji stopy — rozjazd pozy nogi
  // natychmiast kładzie puślisko skośnie.
  const leatherAx = j.partAxis['sj-stirrup-leather'];
  const tiltFromVert = leatherAx
    ? Math.acos(Math.max(-1, Math.min(1, Math.abs(dot3(leatherAx, [0, 1, 0])))))
    : NaN;
  t('H5', '(H5) puślisko wisi niemal PIONOWO (<0.18 rad od pionu) — strzemię pod stopą, nie odciągnięte',
    Number.isFinite(tiltFromVert) && tiltFromVert < 0.18, { odchylenieOdPionu: +(+tiltFromVert).toFixed(3) });

  // H6 — pęk zapasowy MIJA konia: pięty drzewc nad linią grzbietu.
  const spareMinY = hh(j.partMinY['sj-spare-jav-shaft']);
  t('H6', '(H6) pęk oszczepów zapasowych w całości NAD linią grzbietu konia (nie przez siodło)',
    Number.isFinite(spareMinY) && Number.isFinite(backY) && spareMinY > backY,
    { spareMinY: +spareMinY.toFixed(4), backY: +backY.toFixed(4) });

  if (soft) return results;

  // --- poniższe NIE są częścią dowodu (M), więc tylko w przebiegu głównym ---

  // H7 — stopa OPARTA w strzemieniu: podeszwa tuż nad stopką kabłąka.
  const soleMinY = hh(j.partMinY['sj-boot-sole']);
  const treadMaxY = hh(j.partMaxY['sj-stirrup-tread']);
  check('(H7) podeszwa spoczywa NA stopce strzemienia (szczelina < 0.02×HEX_R, bez przenikania w dół)',
    Number.isFinite(soleMinY) && Number.isFinite(treadMaxY)
    && soleMinY >= treadMaxY - 0.004 && soleMinY - treadMaxY < 0.02,
    { soleMinY: +soleMinY.toFixed(4), treadMaxY: +treadMaxY.toFixed(4) });

  // H8 — kolano ZGIĘTE (dosiad ze strzemieniem, K4): udo i goleń nie są
  // współliniowe. Jeździec asyryjski (bez strzemion) ma tu ~0.40 rad.
  const thighA = j.partAxis['sj-leg-thigh'];
  const shinA = j.partAxis['sj-leg-shin'];
  const knee = Math.acos(Math.max(-1, Math.min(1, dot3(thighA, shinA))));
  check('(H8) kolano wyraźnie ZGIĘTE (>0.60 rad) — dosiad ze strzemieniem, nie noga zwisająca swobodnie',
    Number.isFinite(knee) && knee > 0.60, { katKolana: +(+knee).toFixed(3) });

  // H9 — strzemię wisi MIĘDZY grzbietem a kopytami i nie sięga ziemi.
  const treadMinY = hh(j.partMinY['sj-stirrup-tread']);
  check('(H9) strzemię wisi między linią grzbietu a ziemią (0.05 < y < linia grzbietu)',
    Number.isFinite(treadMinY) && treadMinY > 0.05 && treadMinY < backY,
    { treadMinY: +treadMinY.toFixed(4), backY: +backY.toFixed(4) });

  // H10 — tarcza jest NA PLECACH: za torsem wzdłuż osi przód-tył (K8).
  const shieldP = j.partPos['sj-shield-back'];
  const torsoP = j.partPos['sj-rider-torso'];
  const behind = fwd && shieldP && torsoP ? dot3(sub3(shieldP, torsoP), fwd) : NaN;
  check('(H10) tarcza jest ZA torsem wzdłuż osi przód-tył (niesiona na plecach, nie na przedramieniu)',
    Number.isFinite(behind) && behind < -0.03, { rzutNaOsPrzodu: +(+behind).toFixed(4) });

  // H11 — tarcza nie wjeżdża w zad konia ani w derkę.
  const shieldMinY = hh(j.partMinY['sj-shield-back']);
  check('(H11) dolna krawędź tarczy NAD linią grzbietu konia',
    Number.isFinite(shieldMinY) && shieldMinY > backY,
    { shieldMinY: +shieldMinY.toFixed(4), backY: +backY.toFixed(4) });

  // H12 — wodze FAKTYCZNIE zaczynają się na wędzidle (lekcja T1 runda 1).
  const reinP = j.partPos['sj-rein-strap'];
  const bitP = j.partPos['sj-bit'];
  const reinAx = j.partAxis['sj-rein-strap'];
  const reinHalf = reinP && bitP && reinAx ? null : null;
  void reinHalf;
  const reinToBit = reinP && bitP ? distPointLine(bitP, reinP, norm3(reinAx)) : NaN;
  check('(H12) wodze biegną PRZEZ pierścień wędzidła (odległość wędzidła od osi wodzy < 0.03×HEX_R)',
    Number.isFinite(reinToBit) && reinToBit < 0.03, { odlegloscOdOsi: +(+reinToBit).toFixed(4) });

  // H13 — wodze kończą się w dłoni wodzy (a nie w powietrzu).
  const reinFist = j.partPos['sj-rein-fist'];
  const dReinHand = reinFist && reinP && bitP
    ? dist3(reinFist, [2 * reinP[0] - bitP[0], 2 * reinP[1] - bitP[1], 2 * reinP[2] - bitP[2]])
    : NaN;
  check('(H13) drugi koniec wodzy jest w dłoni wodzy (<0.05×HEX_R od dłoni)',
    Number.isFinite(dReinHand) && dReinHand < 0.05, { odlegloscOdDloni: +(+dReinHand).toFixed(4) });

  // H14 — dłoń wodzy trzyma także PĘK: leży na osi drzewc zapasowych.
  const spareP = j.partPos['sj-spare-jav-shaft'];
  const spareAx = j.partAxis['sj-spare-jav-shaft'];
  const dSheaf = reinFist && spareP && spareAx ? distPointLine(reinFist, spareP, norm3(spareAx)) : NaN;
  check('(H14) dłoń wodzy leży NA OSI pęku zapasowego (trzyma jedno i drugie, <0.06×HEX_R)',
    Number.isFinite(dSheaf) && dSheaf < 0.06, { odchylenieOdOsi: +(+dSheaf).toFixed(4) });

  // H15 — oszczep rzutowy i pęk są po PRZECIWNYCH stronach jeźdźca.
  const eJav = j.extremes['sj-jav-shaft'];
  const eSpare = j.extremes['sj-spare-jav-shaft'];
  // strona = znak rzutu na oś BOCZNĄ modelu (prostopadła do fwd w płaszczyźnie XZ)
  const side = fwd ? [fwd[2], 0, -fwd[0]] : null;
  const javSide = side && shaftP && torsoP ? dot3(sub3(shaftP, torsoP), side) : NaN;
  const spareSide = side && spareP && torsoP ? dot3(sub3(spareP, torsoP), side) : NaN;
  check('(H15) oszczep rzutowy i pęk zapasowy są po PRZECIWNYCH bokach jeźdźca (ręce się nie zlewają)',
    Number.isFinite(javSide) && Number.isFinite(spareSide) && javSide * spareSide < 0
    && Math.abs(javSide) > 0.03 && Math.abs(spareSide) > 0.03,
    { rzutowy: +(+javSide).toFixed(4), zapas: +(+spareSide).toFixed(4) });
  void eJav; void eSpare;

  console.log('  [relacje] grzbiet=' + (+backY).toFixed(4) + ' brzuch=' + (+bellyY).toFixed(4)
    + ' bark=' + (+shldMidY).toFixed(4) + ' | oszczepMinY=' + (+javMinY).toFixed(4)
    + ' pekMinY=' + (+spareMinY).toFixed(4) + ' | dlonNaOsi=' + (+dOff).toFixed(4)
    + ' lokiec=' + (+bend).toFixed(3) + ' kolano=' + (+knee).toFixed(3)
    + ' puslisko=' + (+tiltFromVert).toFixed(3) + ' rad');

  return results;
}

function assertRest(m, plemionaSrc, renderSrc) {
  const j = m.jezdziec;

  // --- (B) tożsamość modelu dla nazwy PL i EN --------------------------------
  check('(B1) nazwa EN „Slavic Javelin Cavalry" trafia w TEN SAM model co nazwa PL',
    m.jezdziecEn.meshCount === j.meshCount && m.jezdziecEn.hasSjCoat === j.hasSjCoat,
    { pl: j.meshCount, en: m.jezdziecEn.meshCount });

  // --- (C) ODRÓŻNIALNOŚĆ (kryterium 3 dispatchu) ----------------------------
  check('(C1) ZERO mesh kopii/lancy i proporczyka (odróżnienie od generyka i od lancera T1)',
    !j.names.some((n) => n.includes('lance') || n.includes('pennon') || n.includes('bow') || n.includes('quiver')),
    j.names.filter((n) => n.includes('lance') || n.includes('pennon') || n.includes('bow') || n.includes('quiver')));
  check('(C2) maść konia (SJ_COAT) NIE występuje w Konnicy Brązu ani w lancerze asyryjskim',
    !m.bronze.hasSjCoat && !m.lancowa.hasSjCoat,
    { bronze: m.bronze.hasSjCoat, lancowa: m.lancowa.hasSjCoat });
  check('(C3) Jeździec NIESIE własną maść SJ_COAT', j.hasSjCoat);
  // koń MNIEJSZY niż asyryjski (K9) — mierzone na linii grzbietu, nie na
  // pudełku zbiorczym (tam dominuje uniesiony oszczep).
  const backSJ = j.partMaxY['sj-horse-pad'];
  const backAC = m.lancowa.partMaxY['ac-horse-pad'];
  check('(C4) linia grzbietu konia jest NIŻSZA niż u konnicy asyryjskiej (K9: mały koń leśny)',
    Number.isFinite(backSJ) && Number.isFinite(backAC) && backSJ < backAC - 0.02,
    { slowianski: +(+backSJ).toFixed(4), asyryjski: +(+backAC).toFixed(4) });
  check('(C5) Jeździec i lancer asyryjski mają różną liczbę mesh (różne modele, nie alias)',
    j.meshCount !== m.lancowa.meshCount, { jezdziec: j.meshCount, lancowa: m.lancowa.meshCount });

  // --- (E) proporcje względem HEX_R -----------------------------------------
  check('(E1) kopyta na y≈0 (minY < 0.02×HEX_R)', j.minY < 0.02, j.minY);
  check('(E2) promień poziomy w twardym limicie heksu (≤0.866×HEX_R)', j.maxR <= 0.866, j.maxR);
  check('(E3) wysokość tokenu w zakresie serii konnej (0.60–1.05×HEX_R)',
    j.height > 0.60 && j.height < 1.05, j.height);
  console.log('  [wymiary] jeździec: wysokość=' + j.height.toFixed(3) + '×HEX_R, promień='
    + j.maxR.toFixed(3) + '×HEX_R, minY=' + j.minY.toFixed(4) + ', mesh=' + j.meshCount);

  // --- (K) SPÓJNOŚĆ KULTUROWA z Drużynnikiem — MIERZONA, nie deklarowana ----
  // K12 pliku modelu: wartości kolorów są powtórzone liczbowo (nie
  // zaimportowane, bo plik Drużynnika jest poza allowlistą tematu), więc
  // rozjazd musi zapalać się na czerwono, a nie przechodzić po cichu.
  const grab = (src, name) => {
    const mm = new RegExp('const\\s+' + name + '\\s*=\\s*(0x[0-9a-fA-F]+)').exec(src);
    return mm ? mm[1].toLowerCase() : null;
  };
  const pairs = [
    ['TR_HAIR_SLAV', 'SJ_HAIR_SLAV'],
    ['TR_LINEN', 'SJ_LINEN'],
    ['TR_LEATHER', 'SJ_LEATHER'],
    ['TR_WOOL_DK', 'SJ_WOOL_DK'],
    ['TR_STEEL', 'SJ_STEEL'],
    ['TR_SKIN', 'SJ_SKIN'],
  ];
  for (const [tr, sj] of pairs) {
    const a = grab(plemionaSrc, tr);
    const b = grab(renderSrc, sj);
    check('(K:' + sj + ') wartość zgodna z ' + tr + ' u Drużynnika (ta sama kultura)',
      a !== null && b !== null && a === b, { druzynnik: a, jezdziec: b });
  }
  check('(K7) Drużynnik dalej się buduje i NIE dostał mesh tego modelu (zero regresji)',
    m.druzynnik.meshCount > 20 && !m.druzynnik.names.some((n) => n.startsWith('sj-')),
    { mesh: m.druzynnik.meshCount });
}

async function main() {
  // --- (0) statyczne kotwice w źródle -------------------------------------
  const unitsSrc = fs.readFileSync(UNITS_TS, 'utf8');
  const renderSrc = fs.readFileSync(RENDER_TS, 'utf8');
  const plemionaSrc = fs.readFileSync(PLEMIONA_TS, 'utf8');
  const unitsJson = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
  const unitRows = Array.isArray(unitsJson) ? unitsJson : Object.values(unitsJson);

  check('(0a) units.ts zawiera dispatch nazwany „Jeździec z oszczepami"',
    unitsSrc.includes(LINE_DISPATCH.trim()));
  const idxDispatch = unitsSrc.indexOf(LINE_DISPATCH.trim());
  const idxGenericKonnica = unitsSrc.indexOf("case 'konnica': {");
  check('(0b) dispatch nazwany stoi PRZED generycznym `case \'konnica\'` (kolejność w pliku)',
    idxDispatch > -1 && idxGenericKonnica > -1 && idxDispatch < idxGenericKonnica,
    { idxDispatch, idxGenericKonnica });
  check('(0c) generyczny `case \'konnica\'` NIE został zmieniony przez ten temat (nadal ma lancę i proporczyk)',
    unitsSrc.includes('Couched cavalry lance') && unitsSrc.includes('Owner-colour pennon'));
  check('(0d) render zawiera sekcję ZGODNOŚĆ HISTORYCZNA z punktami K1-K13',
    /K1\./.test(renderSrc) && /K4\./.test(renderSrc) && /K8\./.test(renderSrc)
    && /K12\./.test(renderSrc) && /K13\./.test(renderSrc));
  check('(0e) K4 uzasadnia OBECNOŚĆ strzemion i nazywa ramę czasową (Strategikon / Awarowie)',
    /STRZEMIONA/.test(renderSrc) && /Strategikon/.test(renderSrc) && /Awar/.test(renderSrc));
  check('(0f) K3 nazywa WPROST problem „Słowianin na koniu" i rozstrzyga go warstwą IX-X w.',
    /without many horsemen/.test(renderSrc) && /Mikul/.test(renderSrc));
  check('(0g) K10 zapisuje WPROST, że maść jest wyborem (źródła jej nie rozstrzygają)',
    /źródła jej NIE rozstrzygają/.test(renderSrc) || /NIE rozstrzygaj/.test(renderSrc));

  const jRow = unitRows.find((u) => u['Jednostka'] === NAME_JEZDZIEC);
  check('(0h) units.json: jednostka istnieje, Epoka=Żelazo, Kultura=Słowianie, Typ=Mount',
    jRow !== undefined && jRow['Epoka'] === 'Żelazo' && jRow['Kultura'] === 'Słowianie'
    && jRow['Typ'] === 'Mount',
    jRow && { e: jRow['Epoka'], k: jRow['Kultura'], t: jRow['Typ'] });
  check('(0i) units.json: Atak dystansowy=2, Zasięg=2, Ilość pocisków=5 (jednostka DYSTANSOWA)',
    jRow !== undefined && jRow['Atak dystansowy'] === 2 && jRow['Zasięg ataku (hex)'] === 2
    && jRow['Ilość pocisków'] === 5,
    jRow && { ad: jRow['Atak dystansowy'], z: jRow['Zasięg ataku (hex)'], p: jRow['Ilość pocisków'] });
  check('(0j) units.json: Pancerz=3 — najlżejszy z trójki konnicy (Brąz 4, Asyria lancowa 5)',
    jRow !== undefined && jRow['Pancerz'] === 3
    && (unitRows.find((u) => u['Jednostka'] === NAME_BRONZE) || {})['Pancerz'] === 4
    && (unitRows.find((u) => u['Jednostka'] === NAME_LANCOWA) || {})['Pancerz'] === 5,
    jRow && jRow['Pancerz']);
  check('(0k) units.json: nazwa EN = „Slavic Javelin Cavalry" (kotwica dispatchu EN)',
    jRow !== undefined && jRow['Nazwa EN'] === NAME_JEZDZIEC_EN, jRow && jRow['Nazwa EN']);
  // jednoznaczność rdzenia dispatchu w CAŁYM units.json (nie „na oko")
  const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[Łł]/g, 'l').toLowerCase();
  const collide = unitRows.filter((u) =>
    norm(u['Jednostka']).includes('jezdziec z oszczepami')
    || norm(u['Nazwa EN'] || '').includes('slavic javelin cavalry'));
  check('(0l) rdzeń dispatchu jest JEDNOZNACZNY w całym units.json (dokładnie 1 trafienie)',
    collide.length === 1, collide.map((u) => u['Jednostka']));

  fs.writeFileSync(ENTRY, [
    "import * as THREE from 'three';",
    "import { buildUnitModel } from '../src/render/units.ts';",
    'window.__THREE = THREE;',
    'window.__buildUnitModel = buildUnitModel;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, []);
  await buildBundle(BUNDLE_PRZED, [revertDispatchPlugin]);
  await buildBundle(BUNDLE_GEOM, [revertGeometryPlugin]);
  check('(D0) mutacja (D) faktycznie usunęła linię dispatchu (test nie jest pusty)',
    mutD.applied === 1, mutD.applied);
  check('(M0) mutacja (M) faktycznie podmieniła WSZYSTKIE 3 stałe pozy (test nie jest pusty)',
    mutM.applied === GEOM_MUTATIONS.length, { applied: mutM.applied, expected: GEOM_MUTATIONS.length });
  if (mutD.applied !== 1 || mutM.applied !== GEOM_MUTATIONS.length) {
    console.log('\nPRZERWANE: nie udało się odtworzyć stanu sprzed poprawki — kod się przesunął, popraw LINE_DISPATCH/GEOM_MUTATIONS.');
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function renderWith(bundleFile) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
    await page.addScriptTag({ path: bundleFile });
    return measureAll(page);
  }

  const SHOT = async (file, names, colors) => {
    await page.evaluate(({ nm, cl }) => {
      const THREE = window.__THREE;
      const buildUnitModel = window.__buildUnitModel;
      document.body.innerHTML = '';
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(960, 460);
      renderer.setClearColor(0x78a7ff, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 960 / 460, 0.1, 20);
      camera.position.set(0, 1.7, 2.0);
      camera.lookAt(0.0, 0.38, 0);
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      const dir = new THREE.DirectionalLight(0xffffff, 1.0);
      dir.position.set(2, 3, 2);
      scene.add(dir);
      nm.forEach((n, i) => {
        const g = buildUnitModel('konnica', cl[i], n);
        g.position.x = (i - (nm.length - 1) / 2) * 1.05;
        scene.add(g);
      });
      renderer.render(scene, camera);
      window.__shotReady = true;
    }, { nm: names, cl: colors });
    await page.waitForFunction('window.__shotReady === true');
    await page.screenshot({ path: file });
    await page.evaluate(() => { window.__shotReady = false; });
  };

  try {
    console.log('\n--- (0)-(K) render PO poprawce (bundel z niezmienionych źródeł) ---');
    const after = await renderWith(BUNDLE_PO);
    assertDispatch(after, false);
    assertGeometry(after, false);
    assertRest(after, plemionaSrc, renderSrc);

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await SHOT(path.join(SHOTS, 'po-jezdziec-oszczepami.png'),
        [NAME_JEZDZIEC, NAME_LANCOWA, NAME_BRONZE], [0x3366ee, 0xcc4422, 0x22aa55]);
    }

    console.log('\n--- (D) mutacja DISPATCHU: ta sama jednostka PRZED naprawą ---');
    const beforeD = await renderWith(BUNDLE_PRZED);
    const softD = assertDispatch(beforeD, true);
    const stillGreenD = softD.filter((r) => r.cond).map((r) => r.id);
    check('(D1) na kodzie sprzed poprawki KAŻDA asercja rozstrzygająca (A1-A5) pada',
      stillGreenD.length === 0, { nadal_zielone: stillGreenD });
    check('(D2) PRZED poprawką jednostka ma DOKŁADNIE tyle mesh co generyczny fallback',
      beforeD.jezdziec.meshCount === beforeD.generic.meshCount,
      { jezdziec: beforeD.jezdziec.meshCount, generic: beforeD.generic.meshCount });

    if (SHOTS !== null) {
      await SHOT(path.join(SHOTS, 'przed-generyczna-konnica.png'),
        [NAME_JEZDZIEC, NAME_LANCOWA, NAME_BRONZE], [0x3366ee, 0xcc4422, 0x22aa55]);
    }

    console.log('\n--- (M) mutacja SAMYCH STAŁYCH POZY: dispatch nietknięty, geometria zepsuta ---');
    const beforeM = await renderWith(BUNDLE_GEOM);
    const softDM = assertDispatch(beforeM, true);
    check('(M1) mutacja (M) NIE rusza dispatchu — model dedykowany nadal się buduje',
      softDM.every((r) => r.cond), softDM.filter((r) => !r.cond).map((r) => r.id));
    const softM = assertGeometry(beforeM, true);
    const stillGreenM = softM.filter((r) => r.cond).map((r) => r.id);
    console.log('  [mutacja M] wyniki (H): ' + softM.map((r) => r.id + '=' + (r.cond ? 'green' : 'RED')).join(' '));
    check('(M2) po zepsuciu stałych pozy asercje geometryczne (H1-H6) PADAJĄ — (H) nie jest tautologią',
      stillGreenM.length === 0, { nadal_zielone: stillGreenM });

    if (SHOTS !== null) {
      await SHOT(path.join(SHOTS, 'mutacja-geometria.png'),
        [NAME_JEZDZIEC], [0x3366ee]);
    }

    check('(F0) zero błędów konsoli/JS we wszystkich trzech renderach', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close();
  }

  // --- (G) artefakt PRODUKCYJNY vite build (C-001) ------------------------
  if (!SKIP_VITE) {
    let dist = DIST_ARG;
    if (dist === null) {
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
      const outDir = path.join(os.tmpdir(), `civ-zelazo-t4-render-dist-${TMPDIR_RUN_ID}`);
      // C-001: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(G1) artefakt vite build niesie ciąg rozpoznawania „jezdziec z oszczepami"',
      /jezdziec z oszczepami/i.test(built));
    check('(G2) artefakt vite build niesie ciąg rozpoznawania „slavic javelin cavalry"',
      /slavic javelin cavalry/i.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_PO); fs.unlinkSync(BUNDLE_PRZED); fs.unlinkSync(BUNDLE_GEOM); } catch (_) {}

  console.log('\nzelazo-jezdziec-oszczepami-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
