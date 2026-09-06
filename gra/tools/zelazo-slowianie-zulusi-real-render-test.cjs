'use strict';
/**
 * zelazo-slowianie-zulusi-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T10 — audyt dwoch jednostek:
 * **Druzynnik** (Slowianie) i **iButho z iklwa** (Zulusi).
 *   `gra/src/render/jednostki-z3-plemiona.ts` — buildDruzynnik, buildIButho
 *   `gra/src/render/units.ts`                 — WYLACZNIE linie dispatchu
 *
 * ZGLOSZENIE. Zaden z tych dwoch modeli nie nazywal ANI JEDNEGO mesh przed T10
 * (zmierzone: 0/32 Druzynnik, 0/37 iButho) i zaden nie mial `userData.anchors`.
 * Bez nazw zadna asercja nie moze zaadresowac czesci, a punkty odniesienia
 * musialyby byc wpisane liczbowo w test — czyli test mierzylby sam siebie.
 *
 * DLACZEGO PRAWDZIWA PRZEGLADARKA (R-PROC-AUTOBOT.md §9 poz. 6a): to sa modele
 * 3D (Three.js). Dwa z czterech defektow Druzynnika sa NIEWIDOCZNE bez
 * policzenia, ile pikseli danej czesci widac z kamery gry — pas i glowica
 * miecza istnialy w geometrii i mialy ZERO pikseli na ekranie.
 *
 * KAMERA GRY: `src/render/camera.ts` — staly azymut 0 (yaw nie zmienia sie
 * nigdy), elewacja 52 stopnie. Kierunek patrzenia (0; -sin52; -cos52). Baza
 * plaszczyzny obrazu: poziom (1;0;0), pion (0; cos52; -sin52).
 *
 * PROGI BIORA SIE Z RODZINY, NIE Z SUFITU. Modele odniesienia — Falangita (T3),
 * Thorakites (T6), Berserker i Wojownik germanski (T8) oraz Impi (P57, bratni
 * model iButho) — sa mierzone W TYM SAMYM RENDERZE co para T10, nie z pamieci.
 *
 * ZALEZNOSC WSTECZNA T4. `src/render/zelazo-jezdziec-oszczepami-opus5.ts`
 * POWTARZA LICZBOWO (nie importuje) szesc wartosci stylu Druzynnika. Sekcja (T4)
 * czyta OBA pliki i porownuje te wartosci, a dowod nietautologicznosci robi na
 * kopii tekstu w pamieci — bo tej asercji nie da sie zaczerwienic mutacja
 * bundla (czyta zrodlo, nie kod wykonywalny).
 *
 * DOWOD NIETAUTOLOGICZNOSCI — MACIERZ ABLACYJNA, POJEDYNCZA MUTACJA NA ASERCJE
 * (standard serii ustalony przez Evaluatora T4, utrzymany w T5-T8): kazdy
 * bundel M* rozni sie od zrodla DOKLADNIE JEDNYM podmienionym miejscem (M0
 * pilnuje tego mechanicznie). Egzekwowana asercja jest w kierunku PER-H:
 * KAZDA z H1-H12 ma co najmniej JEDNA mutacje, ktora ja SAMA czerwieni — nie
 * znaczy to, ze mutacja czerwieni WYLACZNIE jedna asercje. Pelna macierz jest
 * drukowana ponizej, nic nie jest ukryte. Wiekszosc mutacji odtwarza doslowny
 * stan sprzed audytu T10.
 *
 * Usage (z gra/): node tools/zelazo-slowianie-zulusi-real-render-test.cjs
 *   --shots <katalog>   zrzuty z kamery gry do <katalog>/*.png
 *   --dist <index.html> uzyj gotowego artefaktu vite zamiast budowac go w tescie
 *   --skip-vite         pomin sekcje (G) artefaktu produkcyjnego
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[zelazo-slowianie-zulusi-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-slowianie-zulusi-entry.ts');
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
const OUTDIR = path.resolve(os.tmpdir(), `civ-zelazo-t10-bundles-${TMPDIR_RUN_ID}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const Z3_TS = path.resolve(GRA, 'src', 'render', 'jednostki-z3-plemiona.ts');
const T4_TS = path.resolve(GRA, 'src', 'render', 'zelazo-jezdziec-oszczepami-opus5.ts');
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');
// C-001: jedyny dozwolony build to binarka vite z node_modules przez `node`,
// NIGDY `npm run build` ani `npx`; katalog wyjsciowy POZA drzewem repo.
const VITE_BIN = path.resolve(GRA, 'node_modules', 'vite', 'bin', 'vite.js');

const argOf = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const SKIP_VITE = process.argv.includes('--skip-vite');
const OWNER = 0x3366ee;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

// ── para tematu + jej prefiksy mesh ────────────────────────────────────────
const UNITS = [
  { key: 'druz',   pl: 'Drużynnik',      en: 'Druzhinnik',        pf: 'dr', cat: 'miecznik' },
  { key: 'ibutho', pl: 'iButho z iklwa', en: 'iButho with iklwa', pf: 'ib', cat: 'wlocznik' },
];
// Modele ODNIESIENIA — zaakceptowane, poza zakresem T10, mierzone w tym samym
// renderze. Nie wolno ich zmieniac; sluza za skale i za kontrole regresji.
const REF = [
  { key: 'falanga',    pl: 'Falanga',            cat: 'falangita', pf: 'falangita' },
  { key: 'thorakites', pl: 'Thorakites',         cat: 'wlocznik',  pf: 'th' },
  { key: 'bers',       pl: 'Berserker germański', cat: 'miecznik', pf: 'bs' },
  { key: 'gsup',       pl: 'Wojownik germański', cat: 'super',     pf: 'gw' },
];
// BRATNI model iButho (P57, epoka Brazu) — punkt odniesienia odroznialnosci.
// NIE jest w allowliscie T10 i ma z niego wyjsc bez zmian.
const IMPI = { key: 'impi', pl: 'Impi', cat: 'wlocznik' };
// SASIAD Z TEGO SAMEGO PLIKU poza zakresem T10 (Miecznik galijski, temat T9).
// Test NIE przypina jego liczby mesh ani wysokosci — T9 moze byc integrowany
// rownolegle. Pilnuje wylacznie tego, ze T10 nie wlal mu swoich nazw.
const GALIJ = { key: 'galij', pl: 'Miecznik galijski', cat: 'miecznik' };
// T4 (Jezdziec z oszczepami) — zalezny wstecznie od stalych Druzynnika.
const T4U = { key: 'jezdziec', pl: 'Jeździec z oszczepami', cat: 'konnica' };

// SZESC STALYCH STYLU wspolnych dla Druzynnika i jezdzca T4 (duplikacja
// LICZBOWA, nie import — patrz naglowek). Pary: nazwa w z3 -> nazwa w T4.
const T4_PARY = [
  ['TR_SKIN', 'SJ_SKIN'], ['TR_STEEL', 'SJ_STEEL'], ['TR_LEATHER', 'SJ_LEATHER'],
  ['TR_LINEN', 'SJ_LINEN'], ['TR_WOOL_DK', 'SJ_WOOL_DK'], ['TR_HAIR_SLAV', 'SJ_HAIR_SLAV'],
];
function stalaHex(src, nazwa) {
  const m = new RegExp('^const\\s+' + nazwa + '\\s*=\\s*(0x[0-9a-fA-F]+)\\s*;', 'm').exec(src);
  return m ? parseInt(m[1], 16) : NaN;
}

/**
 * (M) MACIERZ ABLACYJNA — jedna mutacja = jedno miejsce = jedna asercja.
 * `cel` mowi, KTORA asercja ma sie zaczerwienic; `plik` — w ktorym zrodle
 * podmiana ma trafic w DOKLADNIE jedno wystapienie.
 */
const MUTATIONS = [
  { id: 'M1', cel: 'H1', plik: Z3_TS,
    opis: 'klinga Druzynnika zakotwiczona w torsie zamiast w dloni',
    from: '  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.108 * HEX_R));',
    to:   '  blade.position.set(0, TR_TORSO_CTR, 0);' },

  // M2 podmienia TE SAMA linie co M1, ale w druga strone: M1 wyrywa klinge
  // z reki (H1), M2 cofa ja w RAMIE reki uzbrojonej (H2). Kazdy bundel nadal
  // ma dokladnie jedno podmienione miejsce.
  { id: 'M2', cel: 'H2', plik: Z3_TS,
    opis: 'klinga Druzynnika cofnieta w ramie wlasnej reki (klasa bledu T3/T7)',
    from: '  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.108 * HEX_R));',
    to:   '  blade.position.copy(armR.wrist.clone().addScaledVector(ax, -0.135 * HEX_R));' },

  { id: 'M3', cel: 'H3', plik: Z3_TS,
    opis: 'pas Druzynnika z powrotem w skali i polozeniu sprzed T10 (0 pikseli)',
    from: '  belt.scale.set(1.10, 1.0, 1.16);                       // 0.209 x 0.034 x 0.130\n'
        + '  belt.position.set(0, 0.2540 * HEX_R, 0);',
    to:   '  belt.position.set(0, 0.252 * HEX_R, 0);' },

  { id: 'M4', cel: 'H4', plik: Z3_TS,
    opis: 'glowica miecza z powrotem mniejsza od piesci — stan sprzed T10 (0 pikseli)',
    from: '  pommel.scale.set(2.10, 1.0, 2.40);                     // 0.063 x 0.024 x 0.058\n'
        + '  pommel.position.copy(armR.wrist.clone().addScaledVector(ax, -0.020 * HEX_R));',
    to:   '  pommel.position.copy(armR.wrist.clone().addScaledVector(ax, -0.016 * HEX_R));' },

  { id: 'M5', cel: 'H5', plik: Z3_TS,
    opis: 'iButho traci oczy — stan sprzed T10 (twarz odkryta i pusta)',
    from: '  trCore(group, mat, mSkin, TR_SKIN_ZULU, true, PF);',
    to:   '  trCore(group, mat, mSkin, TR_SKIN_ZULU, false, PF);' },

  { id: 'M6', cel: 'H6', plik: Z3_TS,
    opis: 'iklwa rozciagnieta do dlugosci broni MIOTANEJ (czubek wypchniety do przodu)',
    from: '  tipI.position.copy(armR.wrist.clone().addScaledVector(ax, 0.246 * HEX_R));',
    to:   '  tipI.position.copy(armR.wrist.clone().addScaledVector(ax, 0.400 * HEX_R));' },

  { id: 'M7', cel: 'H7', plik: Z3_TS,
    opis: 'tarcza iButho z powrotem w rozmiarze Impi — dwie jednostki, jedna figurka',
    from: '  const ISI = 1.25;',
    to:   '  const ISI = 1.00;' },

  { id: 'M8', cel: 'H8', plik: Z3_TS,
    opis: 'tarcza iButho poza obrys heksu (promien > 0.866)',
    from: '  shell.scale.set(ISI, ISI, 1.0);',
    to:   '  shell.scale.set(ISI * 4.2, ISI * 4.2, 1.0);' },

  { id: 'M9', cel: 'H9', plik: Z3_TS,
    opis: 'lewa reka iButho wyprostowana jak kij (klasa bledu T1)',
    from: "  const armL = trBuildArm(group, TR_SHLD_X, 0.72, 1.28, mSkin, mSkin, null, PF, 'left');",
    to:   "  const armL = trBuildArm(group, TR_SHLD_X, 1.28, 1.28, mSkin, mSkin, null, PF, 'left');" },

  { id: 'M10', cel: 'H10', plik: Z3_TS,
    opis: 'tarcza Druzynnika obrocona tylem do kamery gry (klasa bledu T2)',
    from: '  sh.rotation.y = -0.22;\n  const face = new THREE.Mesh(getGTRRndFace(), mOwner);   // POLE = KOLOR GRACZA',
    to:   '  sh.rotation.y = Math.PI - 0.22;\n  const face = new THREE.Mesh(getGTRRndFace(), mOwner);   // POLE = KOLOR GRACZA' },

  { id: 'M11', cel: 'H11', plik: Z3_TS,
    opis: 'iklwa polozona WZDLUZ osi patrzenia kamery gry (klasa bledu T6/A1)',
    from: "  const armR = trBuildArm(group, -TR_SHLD_X, 1.22, 1.62, mSkin, mSkin, mSkin, PF, 'right');",
    to:   "  const armR = trBuildArm(group, -TR_SHLD_X, 1.22, 2.40, mSkin, mSkin, mSkin, PF, 'right');" },

  { id: 'M12', cel: 'H12', plik: Z3_TS,
    opis: 'kly naszyjnika z powrotem symetrycznie — dwa z trzech znikaja za tarcza',
    from: '    t.position.set((s * 0.032 - 0.034) * HEX_R, TR_TORSO_TOP - 0.036 * HEX_R, TR_TORSO_D * 0.5 + 0.012 * HEX_R);',
    to:   '    t.position.set(s * 0.036 * HEX_R, TR_TORSO_TOP - 0.036 * HEX_R, TR_TORSO_D * 0.5 + 0.012 * HEX_R);' },

  { id: 'M13', cel: 'H13', plik: UNITS_TS,
    opis: 'Druzynnik dispatchowany do modelu iButho — dwie jednostki, jeden model',
    from: "  if (n.includes('druzynnik') || n.includes('druzhinnik')) return buildDruzynnik(ownerColor_);",
    to:   "  if (n.includes('druzynnik') || n.includes('druzhinnik')) return buildIButho(ownerColor_);" },
];

function makeMutPlugin(mut, stat) {
  const base = path.basename(mut.plik);
  return {
    name: 'mut-' + mut.id,
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== mut.plik) return null;
        let out = fs.readFileSync(args.path, 'utf8');
        const n = out.split(mut.from).length - 1;
        if (n === 1) { out = out.split(mut.from).join(mut.to); stat.applied++; }
        else { stat.bad.push(mut.id + ':' + base + ':' + n); }
        return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
}

async function buildBundle(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins, logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[zelazo-slowianie-zulusi-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

// ── geometria pomocnicza (Node) ────────────────────────────────────────────
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vlen = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const L = vlen(a); return [a[0] / L, a[1] / L, a[2] / L]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Bryla nieistniejacej czesci: zdegenerowana i odsunieta tak daleko, ze nie
// moze z niczym kolidowac. Kazda asercja, dla ktorej brak czesci jest sam
// w sobie bledem, sprawdza obecnosc JAWNIE.
const MISSING = { c: [1e6, 1e6, 1e6], u: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], h: [0, 0, 0] };
function obb(p) {
  if (!p) return MISSING;
  const lc = [0, 1, 2].map((i) => (p.localMin[i] + p.localMax[i]) / 2);
  const c = [0, 1, 2].map((j) => p.pos[j] + p.axX[j] * lc[0] + p.axY[j] * lc[1] + p.axZ[j] * lc[2]);
  const h = [0, 1, 2].map((i) => (p.localMax[i] - p.localMin[i]) / 2);
  return { c, u: [p.axX, p.axY, p.axZ], h };
}
/** Glebokosc penetracji dwoch OBB (SAT, 15 osi). 0 = brak kolizji. */
function satDepth(A, B) {
  const axes = [A.u[0], A.u[1], A.u[2], B.u[0], B.u[1], B.u[2]];
  for (const a of A.u) for (const b of B.u) { const c = cross(a, b); if (vlen(c) > 1e-6) axes.push(unit(c)); }
  let min = Infinity;
  const d = sub(B.c, A.c);
  for (const ax of axes) {
    const ra = A.h[0] * Math.abs(dot(ax, A.u[0])) + A.h[1] * Math.abs(dot(ax, A.u[1])) + A.h[2] * Math.abs(dot(ax, A.u[2]));
    const rb = B.h[0] * Math.abs(dot(ax, B.u[0])) + B.h[1] * Math.abs(dot(ax, B.u[1])) + B.h[2] * Math.abs(dot(ax, B.u[2]));
    const sep = Math.abs(dot(d, ax)) - (ra + rb);
    if (sep > 0) return 0;
    if (-sep < min) min = -sep;
  }
  return min;
}
const byName = (m) => { const o = {}; for (const p of m.parts) if (p.name) o[p.name] = p; return o; };
const sizeOf = (p) => (p ? [0, 1, 2].map((i) => p.localMax[i] - p.localMin[i]) : null);

// kierunek patrzenia kamery gry i baza jej plaszczyzny obrazu (camera.ts)
const EL = 52 * Math.PI / 180;
const CAM_VIEW = [0, -Math.sin(EL), -Math.cos(EL)];
const toImg = (p) => [p[0], p[1] * Math.cos(EL) - p[2] * Math.sin(EL)];

/** Widocznosc lamanej broni: dlugosc NA EKRANIE / dlugosc WLASNA w 3D. */
function weaponVisibility(m, names) {
  const n = byName(m);
  const pts3 = names.map((x) => n[x]).filter(Boolean).map((p) => p.pos);
  if (pts3.length < 2) return { vis: NaN, screen: NaN };
  let l3 = 0, l2 = 0;
  const p2 = pts3.map(toImg);
  for (let i = 1; i < pts3.length; i++) {
    l3 += vlen(sub(pts3[i], pts3[i - 1]));
    l2 += Math.hypot(p2[i][0] - p2[i - 1][0], p2[i][1] - p2[i - 1][1]);
  }
  return { vis: l3 > 1e-9 ? l2 / l3 : NaN, screen: l2 };
}

// ── zestawy czesci adresowane po NAZWIE (biora sie z modelu, nie z tabelki) ─
// CIALO na potrzeby H1. Reka UZBROJONA (prawa piesc i przedramie) jest
// wylaczona swiadomie — jej styk z bronia to CHWYT, pilnowany osobno w H2.
const BODY_RE = /-(torso|neck|head|eye-[a-z]+|kaftan|skirt|skirt-flap|belt|moustache-\d|helmet-(cone|band|nasal)|isicoco|plume-\d|necklace-(band|tooth-\d)|amashoba-[a-z]+|leg-(left|right)-(thigh|shin|foot)|arm-left-(upper|fore|fist)|arm-right-upper)$/;
const WEAPON = {
  druz:   ['dr-sword-guard', 'dr-sword-blade', 'dr-sword-tip', 'dr-sword-pommel'],
  ibutho: ['ib-iklwa-shaft', 'ib-iklwa-blade', 'ib-iklwa-tip'],
};
const WEAPON_MAIN = { druz: 'dr-sword-blade', ibutho: 'ib-iklwa-shaft' };
const WEAPON_CHAIN = {
  druz:   ['dr-arm-right-fist', 'dr-sword-guard', 'dr-sword-blade', 'dr-sword-tip'],
  ibutho: ['ib-arm-right-fist', 'ib-iklwa-shaft', 'ib-iklwa-blade', 'ib-iklwa-tip'],
};
const SHIELD_FACE = { druz: 'dr-shield-face', ibutho: 'ib-shield-face' };
const KOLIZJA_PROG = 0.006;
// Prog odroznialnosci: 0.558 to WYNIK naprawy T6 dla pary elita/liniowa i tak
// uzyl go T7 oraz T8 — liczba z rodziny, nie z sufitu. W T10 obowiazuje dla
// pary iButho/Impi (ta sama kultura, jednostka i jej zamiennik w drzewie).
// UWAGA na kontekst przy czytaniu wypisu [odroznialnosc]: para
// Druzynnik/Miecznik galijski byla na `main` sprzed T10 ponizej progu (0.509)
// i T10 podnosi ja do 0.521, nadal ponizej — to stan zastany, ktorego druga
// polowa (Miecznik galijski) jest przedmiotem OSOBNEGO tematu T9. T10 tej pary
// nie pogarsza i nie przypina jej asercja.
const PROG_PARA = 0.558;
// Zero pikseli maja u obu jednostek T10 WYLACZNIE czesci, ktore maja zero
// takze u bratniego Impi/rodziny: szyja (miedzy torsem a glowa), oba uda (pod
// spodnica) i lewe przedramie iButho (za tarcza). Kazda inna nazwa z 0 px
// oznacza martwa bryle — dokladnie ten defekt, ktory T10 naprawil na pasie
// i glowicy Druzynnika.
const ZERO_DOZWOLONE = new Set([
  'dr-neck', 'dr-leg-left-thigh', 'dr-leg-right-thigh',
  'ib-neck', 'ib-leg-left-thigh', 'ib-leg-right-thigh', 'ib-arm-left-fore',
]);

/** Pomiar w zywym Three.js: OBB + osie + kotwice dla kazdej nazwanej czesci. */
async function measureAll(page) {
  return page.evaluate(({ units, refs, extra, owner }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    function dump(g) {
      g.updateMatrixWorld(true);
      const parts = []; const names = [];
      let meshCount = 0, minY = Infinity, maxY = -Infinity, maxR = 0, ownerMeshes = 0;
      const v = new THREE.Vector3();
      g.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
        if (o.material && o.material.color && o.material.color.getHex() === owner) ownerMeshes++;
        const geo = o.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        const bb = geo.boundingBox;
        for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) {
          v.set(cx, cy, cz).applyMatrix4(o.matrixWorld);
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
          const r = Math.hypot(v.x, v.z);
          if (r > maxR) maxR = r;
        }
        if (!o.name) return;
        names.push(o.name);
        const wp = new THREE.Vector3(); o.getWorldPosition(wp);
        const q = new THREE.Quaternion(); o.getWorldQuaternion(q);
        const sc = new THREE.Vector3(); o.getWorldScale(sc);
        const ax = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(q).toArray();
        parts.push({
          name: o.name,
          localMin: [bb.min.x * sc.x, bb.min.y * sc.y, bb.min.z * sc.z],
          localMax: [bb.max.x * sc.x, bb.max.y * sc.y, bb.max.z * sc.z],
          pos: wp.toArray(), axX: ax(1, 0, 0), axY: ax(0, 1, 0), axZ: ax(0, 0, 1),
        });
      });
      return {
        meshCount, names, parts, minY, maxY, maxR, height: maxY - minY, ownerMeshes,
        anchors: g.userData['anchors'] || null,
        matCount: Array.isArray(g.userData['mats']) ? g.userData['mats'].length : -1,
      };
    }
    const out = { generic: {} };
    for (const u of units) {
      out[u.key] = dump(B(u.cat, owner, u.pl));
      out[u.key + '_en'] = dump(B(u.cat, owner, u.en));
    }
    for (const r of refs.concat(extra)) out[r.key] = dump(B(r.cat, owner, r.pl));
    out.generic.miecznik = dump(B('miecznik', owner));
    out.generic.wlocznik = dump(B('wlocznik', owner));
    return out;
  }, { units: UNITS, refs: REF, extra: [IMPI, GALIJ, T4U], owner: OWNER });
}

/**
 * WIDOCZNOSC KAZDEJ NAZWANEJ CZESCI Z KAMERY GRY, w PIKSELACH i z testem glebi
 * GPU. Wybrany mesh dostaje jednolity wyroznik, reszta modelu plaski ciemny
 * material; liczymy piksele wyroznika po renderze. To jedyny sposob odroznic
 * „element istnieje w 3D" od „element widac na ekranie" — pas i glowica miecza
 * Druzynnika przechodzily kazdy test geometryczny i mialy ZERO pikseli.
 */
async function measurePerMeshPixels(page, list) {
  return page.evaluate(({ owner, sets }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 512, el = 52 * Math.PI / 180;
    const mkCam = () => {
      const c = new THREE.OrthographicCamera(-0.60, 0.60, 0.72, -0.48, 0.01, 10);
      c.position.set(0, 0.30 + 3 * Math.sin(el), 3 * Math.cos(el));
      c.lookAt(0, 0.30, 0);
      return c;
    };
    const shoot = (cat, name, pick) => {
      document.body.innerHTML = '';
      const r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      r.setSize(S, S); r.setClearColor(0x000000, 1);
      document.body.appendChild(r.domElement);
      const s = new THREE.Scene();
      s.add(new THREE.AmbientLight(0xffffff, 1.0));
      const g = B(cat, owner, name);
      let tinted = 0;
      g.traverse((o) => {
        if (!o.isMesh) return;
        const hit = pick(o);
        if (hit) { tinted++; o.material = new THREE.MeshBasicMaterial({ color: 0xff00ff }); }
        else { o.material = new THREE.MeshBasicMaterial({ color: 0x303030 }); }
      });
      s.add(g);
      r.render(s, mkCam());
      const gl = r.getContext(); const px = new Uint8Array(S * S * 4);
      gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let vis = 0;
      for (let k = 0; k < S * S; k++) {
        if (px[k * 4] > 200 && px[k * 4 + 1] < 80 && px[k * 4 + 2] > 200) vis++;
      }
      r.dispose();
      return { vis, tinted };
    };
    const out = {};
    for (const q of sets) {
      if (q.mode === 'perMesh') {
        const g = B(q.cat, owner, q.pl);
        const names = [];
        g.traverse((o) => { if (o.isMesh) names.push(o.name || ''); });
        const map = {};
        names.forEach((nm, i) => {
          let seen = -1;
          map[nm || ('#' + i)] = shoot(q.cat, q.pl, (o) => { seen++; return seen === i; }).vis;
        });
        out[q.id] = map;
      } else if (q.mode === 'owner') {
        out[q.id] = shoot(q.cat, q.pl, (o) => !!(o.material && o.material.color && o.material.color.getHex() === owner));
      } else {
        out[q.id] = shoot(q.cat, q.pl, (o) => typeof o.name === 'string' && o.name !== '' && o.name.indexOf(q.sel) === 0);
      }
    }
    return out;
  }, { owner: OWNER, sets: list });
}

/**
 * ODROZNIALNOSC z KAMERY GRY — piksele, nie binarna sylwetka (metoda T5/T6/T7/T8):
 * udzial pikseli rozniacych sie pokryciem albo barwa o >=40/255 w sumie obrysow
 * pary. Kontrola miary: ten sam model porownany sam ze soba musi dac ~0.
 */
async function pixelDistinctness(page) {
  return page.evaluate(({ all, owner }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 192, el = 52 * Math.PI / 180;
    const shot = (cat, name) => {
      document.body.innerHTML = '';
      const r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      r.setSize(S, S); r.setClearColor(0x000000, 1);
      document.body.appendChild(r.domElement);
      const s = new THREE.Scene();
      const cam = new THREE.OrthographicCamera(-0.60, 0.60, 0.72, -0.48, 0.01, 10);
      cam.position.set(0, 0.30 + 3 * Math.sin(el), 3 * Math.cos(el));
      cam.lookAt(0, 0.30, 0);
      s.add(new THREE.AmbientLight(0xffffff, 0.95));
      const d = new THREE.DirectionalLight(0xffffff, 0.8); d.position.set(2, 4, 3); s.add(d);
      s.add(B(cat, owner, name));
      r.render(s, cam);
      const gl = r.getContext(); const px = new Uint8Array(S * S * 4);
      gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
      r.dispose();
      return Array.from(px);
    };
    const diff = (A, B2, ignoreColor) => {
      let uni = 0, dif = 0;
      for (let i = 0; i < S * S; i++) {
        const ar = A[i * 4], ag = A[i * 4 + 1], ab = A[i * 4 + 2];
        const br = B2[i * 4], bg = B2[i * 4 + 1], bb = B2[i * 4 + 2];
        const aOn = (ar + ag + ab) > 24, bOn = (br + bg + bb) > 24;
        if (!aOn && !bOn) continue;
        uni++;
        if (aOn !== bOn) { dif++; continue; }
        if (ignoreColor) continue;
        if (Math.abs(ar - br) >= 40 || Math.abs(ag - bg) >= 40 || Math.abs(ab - bb) >= 40) dif++;
      }
      return uni ? dif / uni : 0;
    };
    const shots = all.map((u) => shot(u.cat, u.pl));
    const pairs = [], sylw = [];
    for (let a = 0; a < shots.length; a++) for (let b = a + 1; b < shots.length; b++) {
      pairs.push({ a: all[a].key, b: all[b].key, d: diff(shots[a], shots[b], false) });
      sylw.push({ a: all[a].key, b: all[b].key, d: diff(shots[a], shots[b], true) });
    }
    return { pairs, sylw, same: diff(shots[0], shot(all[0].cat, all[0].pl), false) };
  }, { all: UNITS.concat(REF).concat([IMPI, GALIJ]), owner: OWNER });
}

// ═══ ASERCJE H1-H13 — kazda ma swoja POJEDYNCZA mutacje M1-M13 ═════════════
function assertGeometry(m, pix, dist, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };
  const nd = byName(m.druz), ni = byName(m.ibutho);

  // H1 — BRON nie tkwi w CIELE (klasa T1/T3/T5/T8). Reka uzbrojona wylaczona:
  // styk piesci i przedramienia z bronia to CHWYT, progi rodziny w H2.
  const h1 = [];
  for (const u of UNITS) {
    const mm = m[u.key];
    const bron = new Set(WEAPON[u.key]);
    const body = mm.parts.filter((p) => BODY_RE.test(p.name) && !bron.has(p.name));
    for (const wn of WEAPON[u.key]) {
      const w = byName(mm)[wn];
      if (!w) { h1.push({ u: u.key, brak: wn }); continue; }
      for (const b of body) {
        const d = satDepth(obb(w), obb(b));
        if (d > KOLIZJA_PROG) h1.push({ u: u.key, w: wn, b: b.name, d: +d.toFixed(4) });
      }
    }
  }
  t('H1', '(H1) ZADNA bron nie przenika ciala wlasnej figurki (2 jednostki, pelny SAT)', h1.length === 0, h1);

  // H2 — BRON nie przenika RAMIENIA reki uzbrojonej. Progi BIORA SIE Z RODZINY,
  // mierzonej w tym samym renderze (Falangita T3, Thorakites T6).
  const armPen = {}, fistPen = {};
  let brakCzesci = false;
  for (const u of UNITS) {
    const n = byName(m[u.key]);
    const w = n[WEAPON_MAIN[u.key]], up = n[u.pf + '-arm-right-upper'], fi = n[u.pf + '-arm-right-fist'];
    if (!w || !up || !fi) { brakCzesci = true; armPen[u.key] = NaN; fistPen[u.key] = NaN; continue; }
    armPen[u.key] = +satDepth(obb(w), obb(up)).toFixed(4);
    fistPen[u.key] = +satDepth(obb(w), obb(fi)).toFixed(4);
  }
  const nf = byName(m.falanga), nt = byName(m.thorakites);
  armPen.falangita = +satDepth(obb(nf['falangita-dory-shaft']), obb(nf['falangita-arm-right-upper'])).toFixed(4);
  armPen.thorakites = +satDepth(obb(nt['th-spear-shaft']), obb(nt['th-arm-right-upper'])).toFixed(4);
  fistPen.falangita = +satDepth(obb(nf['falangita-dory-shaft']), obb(nf['falangita-arm-right-fist'])).toFixed(4);
  fistPen.thorakites = +satDepth(obb(nt['th-spear-shaft']), obb(nt['th-arm-right-fist'])).toFixed(4);
  t('H2', '(H2) bron NIE przenika ramienia reki uzbrojonej — 0.0000 jak Falangita (T3) i Thorakites (T6); bron DOTYKA piesci',
    !brakCzesci
    && UNITS.every((u) => armPen[u.key] === 0) && armPen.falangita === 0 && armPen.thorakites === 0
    && UNITS.every((u) => fistPen[u.key] > 0),
    { ramie: armPen, piesc: fistPen, brak_czesci: brakCzesci });

  // H3 — PAS DRUZYNNIKA JEST NA EKRANIE. Przed T10: 0 pikseli, bo bryla byla
  // ZAMKNIETA miedzy kaftanem i dolem rubachy — wezsza i plytsza od obu.
  // Sprawdzamy PRZYCZYNE (rozmiary), nie tylko skutek (piksele).
  const belt = nd['dr-belt'], kaf = nd['dr-kaftan'], skr = nd['dr-skirt'];
  const sB = sizeOf(belt), sK = sizeOf(kaf), sS = sizeOf(skr);
  const beltPx = pix.druz_mesh['dr-belt'];
  t('H3', '(H3) pas Druzynnika jest SZERSZY i GLEBSZY od kaftana i dolu rubachy — i widac go z kamery gry',
    !!belt && !!kaf && !!skr && beltPx > 0
    && sB[0] > sK[0] && sB[0] > sS[0] && sB[2] > sK[2] && sB[2] > sS[2],
    { piksele: beltPx, przed_T10: 0, pas: sB && sB.map((x) => +x.toFixed(3)),
      kaftan: sK && sK.map((x) => +x.toFixed(3)), rubacha: sS && sS.map((x) => +x.toFixed(3)) });

  // H4 — GLOWICA MIECZA JEST NA EKRANIE. Przed T10: 0 pikseli, bo byla
  // mniejsza od piesci w KAZDYM wymiarze poprzecznym.
  const pom = nd['dr-sword-pommel'], fist = nd['dr-arm-right-fist'];
  const sP = sizeOf(pom), sF = sizeOf(fist);
  const pomPx = pix.druz_mesh['dr-sword-pommel'];
  t('H4', '(H4) glowica miecza wystaje poza obrys piesci w OBU osiach poprzecznych — i widac ja z kamery gry',
    !!pom && !!fist && pomPx > 0 && sP[0] > sF[0] && sP[2] > sF[2],
    { piksele: pomPx, przed_T10: 0, glowica: sP && sP.map((x) => +x.toFixed(3)),
      piesc: sF && sF.map((x) => +x.toFixed(3)) });

  // H5 — OCZY iBUTHO widoczne z kamery gry. Przed T10 model nie mial ich wcale,
  // choc twarz jest odkryta (isicoco to obrecz NAD glowa, nie helm). Prog:
  // szczelina helmu Falangity — najmniejszy detal twarzy w rodzinie.
  const oczy = m.ibutho.names.filter((n) => /^ib-eye-/.test(n));
  t('H5', '(H5) iButho ma DWOJE oczu i widac oba z kamery gry (>= szczeliny helmu Falangity z T3)',
    oczy.length === 2 && pix.ib_eyes.tinted === 2 && pix.ib_eyes.vis >= pix.ref_falanga_slit.vis,
    { ibutho: pix.ib_eyes.vis, falangita_szczelina: pix.ref_falanga_slit.vis,
      thorakites_T6: pix.ref_thorak_eyes.vis, przed_T10: 'brak mesh' });

  // H6 — IKLWA JEST BRONIA KLUJACA, NIE MIOTANA. Trzy niezalezne warunki:
  // (a) dane jednostki nie znaja broni miotanej, (b) cala bron jest KROTKA
  // wobec wzrostu figury (iklwa ok. 0.52 wzrostu wg zrodel; przed T10 model
  // mial 0.635), (c) chwyt jest przy PIETCE, nie w punkcie rownowagi.
  const shaft = ni['ib-iklwa-shaft'], tipI = ni['ib-iklwa-tip'], fistI = ni['ib-arm-right-fist'];
  let dlWzrost = NaN, udzialZaDlonia = NaN;
  if (shaft && tipI && fistI) {
    const axw = unit(shaft.axY);
    const Ls = sizeOf(shaft)[1];
    const zaDlonia = Ls / 2 - dot(sub(fistI.pos, shaft.pos), axw) * -1;
    const butt = dot(sub(shaft.pos, fistI.pos), axw) - Ls / 2;
    const apex = dot(sub(tipI.pos, fistI.pos), axw) + sizeOf(tipI)[1] / 2;
    const cala = apex - butt;
    dlWzrost = cala / m.ibutho.anchors.headTopY;
    udzialZaDlonia = -butt / cala;
    void zaDlonia;
  }
  const rowI = null;
  t('H6', '(H6) iklwa ma proporcje broni KLUJACEJ: <=0.58 wzrostu figury i chwyt w tylnej 1/3 drzewca',
    Number.isFinite(dlWzrost) && dlWzrost <= 0.58
    && Number.isFinite(udzialZaDlonia) && udzialZaDlonia <= 0.30
    && m.ibutho.anchors !== null && m.ibutho.anchors.weaponKind === 'iklwa-thrust'
    && m.ibutho.anchors.missileKind === 'none',
    { dlugosc_do_wzrostu: +(dlWzrost || 0).toFixed(3), przed_T10: 0.635, zrodlowa: 0.52,
      udzial_za_dlonia: +(udzialZaDlonia || 0).toFixed(3), rowI });

  // H7 — ODROZNIALNOSC OD BRATNIEGO IMPI. To jest glowne zgloszenie T10:
  // przed audytem para dawala 0.370 przy progu rodziny 0.558, a sama sylwetka
  // (bez koloru) roznila sie w 3.5%.
  const par = (a, b2) => dist.pairs.find((p) => (p.a === a && p.b === b2) || (p.a === b2 && p.b === a));
  const parS = (a, b2) => dist.sylw.find((p) => (p.a === a && p.b === b2) || (p.a === b2 && p.b === a));
  const paraII = par('ibutho', 'impi'), paraIIs = parS('ibutho', 'impi');
  const paraT10 = par('druz', 'ibutho');
  t('H7', '(H7) iButho i bratni Impi to DWIE rozne figurki (>= 0.558 progu rodziny z T6), a para T10 tym bardziej',
    dist.same < 0.01 && paraII && paraII.d >= PROG_PARA
    && paraIIs && paraIIs.d > 0.10
    && paraT10 && paraT10.d >= PROG_PARA,
    { kontrola_ten_sam_model: +dist.same.toFixed(4),
      ibutho_impi: paraII && +paraII.d.toFixed(3), przed_T10: 0.370,
      ibutho_impi_sylwetka: paraIIs && +paraIIs.d.toFixed(3), przed_T10_sylwetka: 0.035,
      druz_ibutho: paraT10 && +paraT10.d.toFixed(3) });

  // H8 — PROPORCJE: stopy na terenie, promien w limicie heksu, wysokosc
  // w pasmie rodziny.
  const prop = {};
  for (const u of UNITS) {
    const mm = m[u.key];
    prop[u.key] = { minY: +mm.minY.toFixed(4), maxR: +mm.maxR.toFixed(4), h: +mm.height.toFixed(4) };
  }
  t('H8', '(H8) obie jednostki: stopy na y>=0, promien <= 0.866 (limit heksu), wysokosc 0.55-0.90 x HEX_R',
    UNITS.every((u) => {
      const mm = m[u.key];
      return mm.minY > -1e-6 && mm.maxR <= 0.866 && mm.height > 0.55 && mm.height < 0.90;
    }), prop);

  // H9 — LOKCIE ZGIETE (klasa bledu T1: „reka prosta jak kij").
  const bends = {};
  for (const u of UNITS) for (const side of ['right', 'left']) {
    const n = byName(m[u.key]);
    const up = n[u.pf + '-arm-' + side + '-upper'], fo = n[u.pf + '-arm-' + side + '-fore'];
    bends[u.key + ':' + side] = (up && fo)
      ? +Math.acos(Math.max(-1, Math.min(1, dot(up.axY, fo.axY)))).toFixed(3) : NaN;
  }
  t('H9', '(H9) KAZDY z czterech lokci obu jednostek jest ZGIETY (>0.30 rad)',
    Object.values(bends).every((v) => Number.isFinite(v) && v > 0.30), bends);

  // H10 — POLE TARCZY zwrocone DO kamery gry (klasa bledu T2) i KOLOR GRACZA
  // faktycznie widoczny. Os normalnej bierze sie z BRYLY: pole Druzynnika to
  // walec (normalna = os Y), pole iButho to fasetowana skorupa (normalna = Z).
  const nDruz = nd[SHIELD_FACE.druz], nIb = ni[SHIELD_FACE.ibutho];
  const dotD = nDruz ? +dot(unit(nDruz.axY), CAM_VIEW).toFixed(3) : NaN;
  const dotI = nIb ? +dot(unit(nIb.axZ), CAM_VIEW).toFixed(3) : NaN;
  t('H10', '(H10) pole tarczy OBU jednostek zwrocone DO kamery gry, a kolor gracza jest WIDOCZNY',
    Number.isFinite(dotD) && dotD < -0.30 && Number.isFinite(dotI) && dotI < -0.30
    && m.druz.ownerMeshes >= 1 && pix.druz_owner.vis > 0
    && m.ibutho.ownerMeshes >= 1 && pix.ibutho_owner.vis > 0
    && m.druz.anchors.shieldKind === 'round-slavic'
    && m.ibutho.anchors.shieldKind === 'nguni-isihlangu',
    { druz_dot: dotD, ibutho_dot: dotI,
      kolor_gracza: { druz: pix.druz_owner.vis, ibutho: pix.ibutho_owner.vis } });

  // H11 — WIDOCZNOSC BRONI z kamery gry (klasa bledu T6/A1). Prog to 0.60
  // widocznosci dory Falangity policzonej W TYM SAMYM renderze.
  const visF = weaponVisibility(m.falanga, ['falangita-arm-right-fist', 'falangita-dory-shaft', 'falangita-dory-tip']).vis;
  const vis = {};
  for (const u of UNITS) vis[u.key] = +weaponVisibility(m[u.key], WEAPON_CHAIN[u.key]).vis.toFixed(3);
  t('H11', '(H11) bron OBU jednostek widoczna z kamery gry (>=0.60 widocznosci dory Falangity z T3)',
    Number.isFinite(visF) && UNITS.every((u) => Number.isFinite(vis[u.key]) && vis[u.key] >= 0.60 * visF),
    { falangita: +visF.toFixed(3), prog: +(0.60 * visF).toFixed(3), widocznosc: vis });

  // H12 — ZERO MARTWYCH BRYL. Kazda nazwana czesc obu jednostek ma z kamery
  // gry co najmniej jeden piksel — poza jawna, zamknieta lista czesci, ktore
  // maja zero takze u bratniego Impi i w calej rodzinie (szyja, uda, lewe
  // przedramie za tarcza). To jest asercja, ktora zlapala D1 i D2 tego audytu.
  const martwe = [];
  for (const u of UNITS) {
    const map = pix[u.key + '_mesh'];
    for (const nm of Object.keys(map)) {
      if (map[nm] === 0 && !ZERO_DOZWOLONE.has(nm)) martwe.push(nm);
    }
  }
  t('H12', '(H12) zadna nazwana czesc obu jednostek nie jest martwa bryla (0 px) poza zamknieta lista rodzinna',
    martwe.length === 0, { martwe, dozwolone: Array.from(ZERO_DOZWOLONE) });

  // H13 — DISPATCH: nazwa PL i EN trafia we WLASNY model, a obie jednostki
  // dostaja ROZNE modele. Kryterium NIE jest „inna liczba mesh" — rozstrzyga
  // to, ze kazda czesc ma nazwe z prefiksem SWOJEJ jednostki.
  let dispatchOk = true;
  const dysp = {};
  for (const u of UNITS) {
    const a = m[u.key], b = m[u.key + '_en'], g = m.generic[u.cat];
    const ok = a.names.length === a.meshCount && a.names.every((n) => n.startsWith(u.pf + '-'))
      && b.names.length === b.meshCount && b.names.every((n) => n.startsWith(u.pf + '-'))
      && g.names.length === 0 && a.anchors !== null && g.anchors === null;
    dysp[u.key] = { mesh: a.meshCount, nazwane: a.names.length, en_mesh: b.meshCount, generyk: g.meshCount };
    if (!ok) dispatchOk = false;
  }
  t('H13', '(H13) „Drużynnik"/„Druzhinnik" i „iButho z iklwa"/„iButho with iklwa" buduja WLASNE, ROZNE modele (nie generyk, nie siebie nawzajem)',
    dispatchOk, dysp);

  if (!soft) {
    console.log('  [relacje] widocznosc broni=' + JSON.stringify(vis) + ' (Falangita T3=' + visF.toFixed(3) + ')'
      + ' | bron w ramieniu=' + JSON.stringify(armPen) + ' | chwyt w piesci=' + JSON.stringify(fistPen)
      + ' | lokcie=' + JSON.stringify(bends) + ' | proporcje=' + JSON.stringify(prop));
  }
  return res;
}

/** Reszta: nazwy, kotwice, brak regresji, dane units.json, sekcje K, T4. */
function assertRest(m, pix, dist, src, unitRows) {
  // --- (N) kazdy mesh nazwany + kotwice (warunek mozliwosci audytu) ----------
  for (const u of UNITS) {
    const mm = m[u.key];
    check('(N:' + u.key + ') KAZDY mesh ma nazwe z prefiksem `' + u.pf + '-` i grupa ma `userData.anchors`',
      mm.names.length === mm.meshCount && mm.names.every((n) => n.startsWith(u.pf + '-')) && mm.anchors !== null,
      { mesh: mm.meshCount, nazwane: mm.names.length, anchors: mm.anchors !== null });
    check('(N:' + u.key + ':unikat) nazwy czesci sa UNIKALNE (zadna nie nadpisuje adresu innej)',
      new Set(mm.names).size === mm.names.length,
      mm.names.filter((n, i) => mm.names.indexOf(n) !== i));
    check('(N:' + u.key + ':kotwice) kotwice niosa rodzaj tarczy, rodzaj broni, rodzaj pocisku i punkt chwytu',
      mm.anchors !== null && typeof mm.anchors.shieldKind === 'string'
      && typeof mm.anchors.weaponKind === 'string' && typeof mm.anchors.missileKind === 'string'
      && Array.isArray(mm.anchors.grip),
      mm.anchors && { shieldKind: mm.anchors.shieldKind, weaponKind: mm.anchors.weaponKind });
  }

  // --- (R) BRAK REGRESJI poza para T10 --------------------------------------
  for (const r of REF) {
    const mm = m[r.key];
    check('(R:' + r.key + ') „' + r.pl + '" (T3/T6/T8) nadal w calosci nazwany i BEZ nazw pary T10',
      mm.names.length === mm.meshCount && mm.meshCount > 0
      && mm.names.every((n) => n.startsWith(r.pf + '-'))
      && !mm.names.some((n) => /^(dr|ib)-/.test(n)),
      { mesh: mm.meshCount, nazwane: mm.names.length });
  }
  // Impi (P57) i Miecznik galijski (temat T9) — poza allowlista T10. Liczby
  // mesh NIE sa przypinane: T9 moze byc integrowany rownolegle i ma prawo
  // zmienic swoja. Pilnujemy tego, czego T10 nie wolno bylo dotknac.
  for (const s of [IMPI, GALIJ]) {
    const mm = m[s.key];
    check('(R:' + s.key + ') „' + s.pl + '" (poza allowlista T10) nie dostal ANI JEDNEJ nazwy z prefiksow T10',
      !mm.names.some((n) => /^(dr|ib)-/.test(n)) && mm.meshCount > 0,
      { mesh: mm.meshCount, nazwane: mm.names.length });
  }
  check('(R:generyki) generyki `miecznik`/`wlocznik` nietkniete (brak nazw pary T10)',
    ['miecznik', 'wlocznik'].every((k) => !m.generic[k].names.some((n) => /^(dr|ib)-/.test(n))));

  // --- (0) KOTWICE W DANYCH — model musi zgadzac sie z units.json ------------
  const row = (nm) => unitRows.find((r) => r['Jednostka'] === nm);
  {
    const dr = row('Drużynnik');
    check('(0a) units.json: Druzynnik ma Typ „Swordsman" i Atak dystansowy 0 — model niesie MIECZ i ZERO broni miotanej',
      dr && dr['Typ'] === 'Swordsman' && dr['Atak dystansowy'] === 0
      && m.druz.anchors.weaponKind === 'sword-thrust' && m.druz.anchors.missileKind === 'none'
      && m.druz.names.filter((n) => /^dr-sword-/.test(n)).length === 4
      && !m.druz.names.some((n) => /spear|javelin|bow|arrow/.test(n)),
      dr && { typ: dr['Typ'], ad: dr['Atak dystansowy'] });
    check('(0b) units.json: Druzynnik ma Pancerz 3 — model ma kaftan skorzany i helm, ale NIE ma kolczugi',
      dr && dr['Pancerz'] === 3
      && m.druz.anchors.armorKind === 'leather-kaftan'
      && m.druz.names.some((n) => /^dr-helmet-/.test(n))
      && !m.druz.names.some((n) => /mail|cuirass|lorica|scale/.test(n)),
      dr && { pancerz: dr['Pancerz'] });
    check('(0c) units.json: Uwagi Druzynnika mowia o druzynie ksiecia — naglowek modelu odwoluje sie do tej samej ramy',
      dr && /drużyny księcia/.test(dr['Uwagi'])
      && /elitarny wojownik druzyny ksiecia/.test(src.z3));

    const ib = row('iButho z iklwa');
    check('(0d) units.json: iButho ma Atak dystansowy 0 oraz Ilosc pociskow „—" — model MUSI miec bron wylacznie do zwarcia',
      ib && ib['Atak dystansowy'] === 0 && ib['Ilość pocisków'] === '—'
      && ib['Zasięg ataku (hex)'] === '—'
      && m.ibutho.anchors.missileKind === 'none' && m.ibutho.anchors.weaponKind === 'iklwa-thrust',
      ib && { ad: ib['Atak dystansowy'], pociski: ib['Ilość pocisków'] });
    check('(0e) units.json: Uwagi iButho mowia wprost o „iklwa" — model niesie ja w nazwach mesh (drzewce+grot+czubek)',
      ib && /iklwa/i.test(ib['Uwagi'])
      && m.ibutho.names.filter((n) => /^ib-iklwa-/.test(n)).length === 3);
    check('(0f) units.json: iButho „W zamian za: Impi" i Obrona 7 wobec 6 Impi — model ma WIEKSZA tarcze niz Impi',
      ib && ib['W zamian za'] === 'Impi' && ib['Obrona'] === 7
      && row('Impi') && row('Impi')['Obrona'] === 6
      && m.ibutho.anchors.shieldKind === 'nguni-isihlangu',
      ib && { w_zamian: ib['W zamian za'], obrona: ib['Obrona'], impi_obrona: row('Impi') && row('Impi')['Obrona'] });
    check('(0g) units.json: iButho nie jest super i nie ma zbroi — model bez choragwi, helmu i pancerza',
      ib && ib['Super-jednostka'] !== 'TAK'
      && m.ibutho.anchors.helmetKind === 'none' && m.ibutho.anchors.armorKind === 'none'
      && !m.ibutho.names.some((n) => /-banner-|helmet|mail|cuirass/.test(n)));
  }
  {
    const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[Łł]/g, 'l').toLowerCase();
    for (const core of ['druzynnik', 'butho']) {
      const hits = unitRows.filter((r) => norm(r['Jednostka']).includes(core));
      check('(0h:' + core + ') rdzen dispatchu JEDNOZNACZNY w calym units.json (dokladnie 1 trafienie)',
        hits.length === 1, hits.map((r) => r['Jednostka']));
    }
  }

  // --- (T4) ZALEZNOSC WSTECZNA: Jezdziec z oszczepami --------------------
  // Plik T4 POWTARZA LICZBOWO szesc wartosci stylu Druzynnika. Gdyby audyt
  // T10 zmienil ktorakolwiek, oba modele rozjechalyby sie wizualnie BEZ
  // ostrzezenia kompilatora — bo to duplikacja, nie import.
  const rozjazd = [];
  for (const [a, b] of T4_PARY) {
    const va = stalaHex(src.z3, a), vb = stalaHex(src.t4, b);
    if (!(Number.isFinite(va) && Number.isFinite(vb) && va === vb)) {
      rozjazd.push(a + '=' + (Number.isFinite(va) ? '0x' + va.toString(16) : 'BRAK')
        + ' vs ' + b + '=' + (Number.isFinite(vb) ? '0x' + vb.toString(16) : 'BRAK'));
    }
  }
  check('(T4a) szesc stalych stylu Slowian jest IDENTYCZNE w `jednostki-z3-plemiona.ts` i `zelazo-jezdziec-oszczepami-opus5.ts`',
    rozjazd.length === 0, rozjazd);
  // Dowod nietautologicznosci (T4a): tej asercji nie da sie zaczerwienic
  // mutacja bundla, bo czyta ZRODLO, a nie kod wykonywalny — wiec mutujemy
  // kopie tekstu w pamieci i sprawdzamy, ze porownanie NAPRAWDE lapie roznice.
  {
    const zepsuty = src.z3.replace('const TR_LINEN      = 0xe8e0c8;', 'const TR_LINEN      = 0xe8e0c9;');
    const zmutowane = T4_PARY.filter(([a, b]) => stalaHex(zepsuty, a) !== stalaHex(src.t4, b));
    check('(T4a:mutacja) po podmianie JEDNEJ z szesciu wartosci w kopii zrodla porownanie (T4a) czerwienieje',
      zepsuty !== src.z3 && zmutowane.length === 1 && zmutowane[0][0] === 'TR_LINEN',
      { zlapane: zmutowane.map((p) => p[0]) });
  }
  {
    const mj = m.jezdziec;
    check('(T4b) „Jeździec z oszczepami" (T4) nadal sie buduje, stoi na terenie i NIE dostal nazw pary T10',
      mj && mj.meshCount > 0 && mj.minY > -1e-6 && mj.maxR <= 0.866
      && mj.ownerMeshes >= 1 && !mj.names.some((n) => /^(dr|ib)-/.test(n)),
      mj && { mesh: mj.meshCount, minY: +mj.minY.toFixed(4), maxR: +mj.maxR.toFixed(4),
        ownerMesh: mj.ownerMeshes });
    check('(T4c) tarcza Jezdzca nadal niesie KANON DRUZYNNIKA: pole = kolor gracza, umbo, rant',
      mj && mj.names.includes('sj-shield-back') && mj.names.includes('sj-shield-boss')
      && mj.names.includes('sj-shield-rim'),
      mj && mj.names.filter((n) => /shield/.test(n)));
  }

  // --- (K) SEKCJE HISTORYCZNE — obecnosc i KONKRET, nie sam naglowek --------
  const naglowki = (src.z3.match(/ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(/g) || []).length;
  check('(K0) plik ma sekcje ZGODNOSC HISTORYCZNA dla OBU jednostek T10 (obok sekcji z T8)',
    naglowki >= 4
    && /ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(Druzynnik\)/.test(src.z3)
    && /ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(iButho z iklwa\)/.test(src.z3),
    { naglowkow: naglowki });
  const K = [
    ['K:dr-czarna-mogila',  /Czarna Mogila w Czernihowie/],
    ['K:dr-samokwasow',     /Samokwasow/],
    ['K:dr-kirpicznikow',   /typologii\s*\n?\s*\/\/\s*A\. Kirpicznikowa|A\. Kirpicznikowa/],
    ['K:dr-wielkopolski',   /szyszakiem\s*\n?\s*\/\/\s*WIELKOPOLSKIM|szyszakiem WIELKOPOLSKIM/],
    ['K:dr-znaleziska',     /Giecz, okolice/],
    ['K:dr-cztery-blachy',  /CZTERECH nitowanych blach zelaznych/],
    ['K:dr-zlocona-miedz',  /ZLOCONEJ MIEDZI/],
    ['K:dr-nosal-korekta',  /NOSALA wsrod cech typu NIE MA/],
    ['K:dr-oczy-pomiar',    /powtorzylyby\s*\n?\s*\/\/\s*dokladnie blad B2|blad B2 Berserkera z T8/],
    ['K:dr-deski-zgloszenie', /ZNANY MANKAMENT, SWIADOMIE POZA ZAKRESEM T10/],
    ['K:dr-czego-nie',      /CZEGO SWIADOMIE NIE MA/],
    ['K:ib-szaka-daty',     /1816-1828/],
    ['K:ib-chronologia',    /NAJTRUDNIEJSZY PUNKT: CHRONOLOGIA/],
    ['K:ib-mzonjani',       /Mzonjani/],
    ['K:ib-silver-leaves',  /Silver Leaves\/Matola/],
    ['K:ib-iklwa-wymiary',  /610 mm \(24 cale\)/],
    ['K:ib-iklwa-onomat',   /onomatopeja/],
    ['K:ib-rozbieznosc',    /zamiast wybrania jednej\s*\n?\s*\/\/\s*liczby jako|zamiast wybrania jednej/],
    ['K:ib-isihlangu',      /`isihlangu` \(ok\. 5 stop/],
    ['K:ib-umbumbuluzo',    /`umbumbuluzo`/],
    ['K:ib-1856',           /1856 r\. w kampanii/],
    ['K:ib-barwa-korekta',  /ODWROCENIE tej zasady/],
    ['K:ib-isicoco-ranga',  /noszona\s*\n?\s*\/\/\s*przez mezczyzn zonatych|przez mezczyzn zonatych/],
    ['K:ib-czego-nie',      /CZEGO SWIADOMIE NIE MA/],
  ];
  for (const [id, re] of K) {
    check('(' + id + ') sekcja historyczna niesie konkret, nie sam naglowek', re.test(src.z3));
  }
  // Naglowek modelu NIE moze twierdzic czegos, co jest nieprawda — dokladnie
  // takie dwa zdania byly defektami tego audytu (nosal „czarnomogilski"
  // u Druzynnika, ciemna tarcza jako znak „starszego regimentu" u iButho).
  check('(K:sprostowanie-nosal) naglowek Druzynnika NIE twierdzi juz „helm stozkowy z NOSALEM (czarnomogilski)"',
    !/Helm stozkowy z NOSALEM \(czarnomogilski/.test(src.z3));
  check('(K:sprostowanie-tarcza) naglowek iButho NIE twierdzi juz, ze CIEMNA tarcza to znak starszego regimentu',
    !/roznice starszego regimentu/.test(src.z3)
    && !/amashoba tylko na ramionach \(dyscyplina\)/.test(src.z3));
  // Naglowek MODULU (gora pliku) opisuje charaktery wszystkich pieciu jednostek
  // i niosl te same dwa nieprawdziwe zdania co naglowki builderow. Poprawka
  // musiala dojsc do OBU miejsc — klasa bledu „poprawka nie dotarla do kopii"
  // (T3 -> T7). Ta asercja pilnuje, ze doszla.
  check('(K:modul-nosal) naglowek MODULU nie twierdzi juz „helm STOZKOWY z NOSALEM (typ czarnomogilski"',
    !/helm STOZKOWY z NOSALEM \(typ czarnomogilski/.test(src.z3)
    && /nosal NIE jest\s*\n?\s*\*\s*cecha tego typu/.test(src.z3));
  check('(K:modul-ibutho) naglowek MODULU nie twierdzi juz „ta sama anatomia i rynsztunek, ale wieksza dyscyplina"',
    !/ta sama anatomia\s*\n?\s*\*\s*i rynsztunek, ale wieksza dyscyplina/.test(src.z3)
    && /czyta sie jako pulk MLODY, nie starszy/.test(src.z3));
  check('(K:units-ts) units.ts faktycznie dispatchuje obie jednostki do modeli z serii Z3 (podstawa naglowka)',
    /return buildDruzynnik\(ownerColor_\);/.test(src.units)
    && /return buildIButho\(ownerColor_\);/.test(src.units));
}

async function main() {
  const src = {
    z3: fs.readFileSync(Z3_TS, 'utf8'),
    t4: fs.readFileSync(T4_TS, 'utf8'),
    units: fs.readFileSync(UNITS_TS, 'utf8'),
  };
  const unitsJson = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
  const unitRows = Array.isArray(unitsJson) ? unitsJson : Object.values(unitsJson);

  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(ENTRY, [
    "import * as THREE from 'three';",
    "import { buildUnitModel } from '../src/render/units.ts';",
    'window.__THREE = THREE;',
    'window.__buildUnitModel = buildUnitModel;',
    '',
  ].join('\n'), 'utf8');

  const BUNDLE_PO = path.join(OUTDIR, 'po.js');
  await buildBundle(BUNDLE_PO, []);

  const bundles = [];
  for (const mut of MUTATIONS) {
    const stat = { applied: 0, bad: [] };
    const out = path.join(OUTDIR, 'mut-' + mut.id + '.js');
    await buildBundle(out, [makeMutPlugin(mut, stat)]);
    bundles.push({ mut, out, stat });
  }
  const bad = bundles.filter((g) => g.stat.applied !== 1);
  check('(M0) kazda z ' + MUTATIONS.length + ' mutacji trafila w DOKLADNIE JEDNO miejsce w zrodle',
    bad.length === 0, bad.map((g) => g.mut.id + ' applied=' + g.stat.applied + ' ' + g.stat.bad.join(',')));
  if (bad.length > 0) {
    console.log('\nPRZERWANE: nie da sie odtworzyc stanu sprzed poprawki — kod sie przesunal, popraw MUTATIONS.');
    process.exit(1);
  }

  const PIX_SETS = [
    { id: 'druz_mesh',   mode: 'perMesh', cat: 'miecznik', pl: 'Drużynnik' },
    { id: 'ibutho_mesh', mode: 'perMesh', cat: 'wlocznik', pl: 'iButho z iklwa' },
    { id: 'ib_eyes',     mode: 'prefix',  cat: 'wlocznik', pl: 'iButho z iklwa', sel: 'ib-eye-' },
    { id: 'druz_owner',  mode: 'owner',   cat: 'miecznik', pl: 'Drużynnik' },
    { id: 'ibutho_owner', mode: 'owner',  cat: 'wlocznik', pl: 'iButho z iklwa' },
    { id: 'ref_falanga_slit', mode: 'prefix', cat: 'falangita', pl: 'Falanga', sel: 'falangita-helmet-slit' },
    { id: 'ref_thorak_eyes',  mode: 'prefix', cat: 'wlocznik',  pl: 'Thorakites', sel: 'th-eye-' },
  ];

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1200, height: 560 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function loadBundle(file) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
    await page.addScriptTag({ path: file });
  }

  const SHOT_SET = UNITS.map((u) => [u.pl, u.cat])
    .concat([['Impi', 'wlocznik'], ['Berserker germański', 'miecznik'], ['Falanga', 'falangita']]);
  const SHOT = async (file) => {
    await page.evaluate(({ set, owner }) => {
      const THREE = window.__THREE;
      const B = window.__buildUnitModel;
      document.body.innerHTML = '';
      const W = 1200, H = 560, halfW = (set.length * 0.95) / 2 + 0.15;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setClearColor(0x6f8f5f, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 0.78));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.05); d1.position.set(2, 4, 3); scene.add(d1);
      const el = 52 * Math.PI / 180;                 // KAMERA GRY (camera.ts)
      const cols = [owner, 0xcc4422, 0x22aa55, 0xbb33bb, 0xddaa22];
      set.forEach((p, i) => {
        const g = B(p[1], cols[i % 5], p[0]);
        g.position.x = (i - (set.length - 1) / 2) * 0.95;
        scene.add(g);
      });
      const cy = 0.22, halfH = halfW * H / W;
      const cam = new THREE.OrthographicCamera(-halfW, halfW, cy + halfH, cy - halfH, 0.01, 20);
      cam.position.set(0, cy + 6 * Math.sin(el), 6 * Math.cos(el));
      cam.lookAt(0, cy, 0);
      renderer.render(scene, cam);
      window.__ready = true;
    }, { set: SHOT_SET, owner: OWNER });
    await page.waitForFunction('window.__ready === true');
    await page.screenshot({ path: file });
    await page.evaluate(() => { window.__ready = false; });
  };

  const matrix = [];
  try {
    console.log('\n--- (H)-(K) pomiar PO audycie (bundel z niezmienionych zrodel) ---');
    await loadBundle(BUNDLE_PO);
    const after = await measureAll(page);
    const pixAfter = await measurePerMeshPixels(page, PIX_SETS);
    const distAfter = await pixelDistinctness(page);
    assertGeometry(after, pixAfter, distAfter, false);
    assertRest(after, pixAfter, distAfter, src, unitRows);
    console.log('  [odroznialnosc] kontrola „ten sam model" = ' + distAfter.same.toFixed(4)
      + ' | pary = ' + distAfter.pairs.slice().sort((a, b) => a.d - b.d)
        .map((r) => r.a + '/' + r.b + '=' + r.d.toFixed(3)).join(' '));

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await SHOT(path.join(SHOTS, 'po-slowianie-zulusi-kamera-gry.png'));
    }

    console.log('\n--- (M) MACIERZ ABLACYJNA: jedna mutacja = jedno miejsce = jedna asercja ---');
    const base = assertGeometry(after, pixAfter, distAfter, true);
    matrix.push({ label: 'BAZA'.padEnd(5) + ' (bez mutacji)'.padEnd(64), res: base });
    for (const g of bundles) {
      await loadBundle(g.out);
      const mm = await measureAll(page);
      const pp = await measurePerMeshPixels(page, PIX_SETS);
      const dd = await pixelDistinctness(page);
      matrix.push({ label: g.mut.id.padEnd(5) + ' ' + g.mut.opis.slice(0, 62).padEnd(64), res: assertGeometry(mm, pp, dd, true), mut: g.mut });
      if (SHOTS !== null && (g.mut.id === 'M3' || g.mut.id === 'M4' || g.mut.id === 'M7')) {
        await SHOT(path.join(SHOTS, 'przed-' + g.mut.id + '.png'));
      }
    }
    const ids = base.map((r) => r.id);
    console.log('       ' + ids.map((i) => i.padEnd(6)).join(''));
    for (const row of matrix) {
      const map = Object.fromEntries(row.res.map((r) => [r.id, r.cond]));
      console.log(row.label + ids.map((i) => (map[i] ? 'green' : 'RED  ').padEnd(6)).join(''));
    }
    const nieNosne = [];
    for (const row of matrix) {
      if (!row.mut) continue;
      const map = Object.fromEntries(row.res.map((r) => [r.id, r.cond]));
      if (map[row.mut.cel] !== false) nieNosne.push(row.mut.id + '→' + row.mut.cel);
    }
    check('(M1) KAZDA z H1-H' + ids.length + ' czerwienieje pod SWOJA pojedyncza mutacja — (H) nie jest tautologia',
      nieNosne.length === 0, { nienosne: nieNosne });
    check('(M2) na niezmienionym zrodle WSZYSTKIE asercje (H) sa zielone (baza macierzy)',
      base.every((r) => r.cond), base.filter((r) => !r.cond).map((r) => r.id));

    check('(F0) zero bledow konsoli/JS we wszystkich renderach', pageErrors.length === 0, pageErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  // --- (G) artefakt PRODUKCYJNY vite build (C-001) ---------------------------
  if (!SKIP_VITE) {
    let distDir = DIST_ARG !== null ? path.dirname(DIST_ARG) : null;
    if (distDir === null) {
      distDir = path.join(os.tmpdir(), `civ-zelazo-t10-render-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', distDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
    }
    const collect = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return collect(p);
      return /\.(html|js|css)$/.test(e.name) ? [fs.readFileSync(p, 'utf8')] : [];
    });
    const built = collect(distDir).join('\n');
    check('(G1) artefakt vite build niesie oba rdzenie dispatchu tematu',
      /druzynnik/i.test(built) && /butho/i.test(built));
    // UWAGA NA POSTAC KOTWICY (sprawdzone w artefakcie, nie zalozone): nazwy
    // powstaja jako `PF + '-czesc'`, wiec vite zostawia w bundlu SUFIKS
    // i OSOBNO staly prefiks. Pelna nazwa „dr-belt" NIE wystepuje w artefakcie
    // jako jeden ciag i szukanie jej dawaloby falszywy FAIL.
    const T10_ONLY = ['-belt', '-sword-pommel', '-shield-umbo', '-iklwa-shaft',
                      '-iklwa-blade', '-shield-mgobo', '-necklace-tooth-'];
    const brak = T10_ONLY.filter((n) => !built.includes(n));
    const prefiksy = ['"dr"', '"ib"'].filter((n) => !built.includes(n));
    check('(G2) artefakt vite build niesie czesci nazwane w T10 (naprawa jest w produkcji)',
      brak.length === 0 && prefiksy.length === 0, { brak, brak_prefiksow: prefiksy });
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominieta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch (_) {}

  console.log('\nzelazo-slowianie-zulusi-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
