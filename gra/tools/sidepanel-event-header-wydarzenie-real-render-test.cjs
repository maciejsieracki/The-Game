'use strict';
/**
 * sidepanel-event-header-wydarzenie-real-render-test.cjs
 *
 * TEMAT: P-WYDARZENIA-NAGLOWEK-KONIEC-TURY-ZBEDNY-Q1.
 *
 * ZGŁOSZENIE (właściciel, 2026-08-22): „Informacja «koniec tury» jest niepotrzebna.
 * Wystarczy «wydarzenie». Wiadomo, że ono następuje pod koniec tury, to tylko zamydla.
 * Dużą czcionką powinno być «wydarzenie», a nie «koniec tury»."
 *
 * STAN PRZED: karta informacyjna panelu bocznego renderowała DWA wiersze nagłówka —
 * mikroskopijny overline `.sp-kicker` „Wydarzenie" (8.5px) nad dużym `.sp-title`
 * (13.5px, font tytułowy), do którego `deferredHintsToSidePanelEvents()` wstawiała
 * generyczny placeholder „Koniec tury" dla KAŻDEGO zdarzenia końcowo-turowego bez
 * własnego tytułu — łącznie z eliminacjami miast-państw, które mają w pełni konkretną
 * treść w `subtitle` („Sumerowie · miasto-państwo — ELIMINACJA! …").
 *
 * STAN PO: karta ma DOKŁADNIE JEDEN dominujący wiersz nagłówka.
 *   • `title === ''` (generyczne zdarzenie EOT) → słowo „Wydarzenie" awansuje z overline
 *     do slotu tytułu i jedzie tą samą dużą czcionką; wiersz „Koniec tury" znika.
 *   • `title` niepusty (np. „Dyplomacja") → BEZ ZMIAN: mały overline + duży tytuł.
 *   • karty blokujące (`blocking:true`) → poza zakresem zgłoszenia, NIETKNIĘTE.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, A NIE SAM TEST JEDNOSTKOWY:
 * `tools/eot-event-defer-test.cjs` potwierdza tylko WARTOŚĆ pola `title`. Zgłoszenie jest
 * o WYGLĄDZIE: co gracz widzi dużą czcionką. Rozstrzyga to dopiero kaskada CSS na żywym
 * drzewie — `getComputedStyle(...).fontSize` mierzone w Chromium na realnie
 * wyrenderowanym `createSidePanelHud()`. Sam grep źródła nie odróżni „słowo jest w DOM"
 * od „słowo jest DOMINUJĄCE" i nie złapie np. przypadku, w którym reguła
 * `.sp-event:not(.sp-blocking) .sp-title` przestaje trafiać w awansowany wiersz.
 *
 * C-001 — ZERO DEV SERVERA. Dwa niezależne źródła dowodu, oba to PRODUKTY BUDOWANIA:
 *   (I)  render mierzony w Chromium na bundlu esbuild (`platform:'browser'`, minify),
 *        zbudowanym z NIEZMIENIONYCH plików `src/ui/sidePanelHud.ts` i
 *        `src/game/eot-event-defer.ts` — ten sam wzorzec co
 *        `tools/praca-panel-emoji-brand-icons-real-render-test.cjs`;
 *   (II) sekcja (E): asercje na FAKTYCZNYM artefakcie `vite build` (single-file
 *        `index.html`), dowodzące, że wersja, którą dostaje gracz, niesie tę samą
 *        gałąź renderu i NIE niesie już fallbacku „Koniec tury".
 *
 * MUTACJA (D) — dowód nietautologiczności: ten sam plik testowy buduje DRUGI bundel
 * z odwróconą poprawką (podmiana w `onLoad`, BEZ dotykania plików w repo: `title` z
 * powrotem na „Koniec tury" + stary, dwuwierszowy blok HTML) i wymaga, żeby asercje
 * A1–A4 zapaliły się na CZERWONO. Gdyby przeszły także na kodzie sprzed poprawki, nie
 * mierzyłyby niczego (precedens P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1).
 * Render zmutowany jest jednocześnie materiałem PRZED do zrzutów.
 *
 * Usage (z gra/): node tools/sidepanel-event-header-wydarzenie-real-render-test.cjs
 *   --shots <katalog>   zrzuca PRZED/PO do <katalog>/naglowek-{przed,po}.png
 *   --dist <index.html> użyj gotowego artefaktu vite zamiast budować go w teście
 *   --skip-vite         pomiń sekcję (E) (np. gdy bramka biegnie tuż po własnym buildzie)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

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

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[sidepanel-event-header-wydarzenie-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.sp-event-header-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.sp-event-header-bundle.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.sp-event-header-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SIDE_PANEL_HUD = path.resolve(GRA, 'src', 'ui', 'sidePanelHud.ts');
const EOT_DEFER = path.resolve(GRA, 'src', 'game', 'eot-event-defer.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

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

/** Treść zgłoszona przez właściciela jako przykład karty, która MA konkretny subtitle,
 * a dostawała bezużyteczny nagłówek „Koniec tury". */
const ELIM_MSG = 'Sumerowie · miasto-państwo — ELIMINACJA! Ostatnie miasto zdobyte przez Rzym.';
const DIPLO_MSG = 'Dyplomacja: propozycja wygasła — wojna';

function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

/** Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`) nie istnieją w gołym esbuildzie.
 * Inline'ujemy PRAWDZIWE pliki SVG, żeby medaliony ikon w zrzutach były tymi, które widzi
 * gracz (ten sam wzorzec co praca-panel-emoji-brand-icons-real-render-test.cjs). */
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'), loader: 'text',
    }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== BRAND_ASSETS_TS) return null;
      const src = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(BRAND_DIR, './brand/', {})),
      );
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const src = fs.readFileSync(args.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

/** Odwrócenie poprawki W LOCIE (tylko dla bundla PRZED). Nie dotyka plików w repo.
 * `applied` liczy faktyczne podmiany — jeśli któraś nie trafi (bo kod się przesunął),
 * test przerywa, zamiast po cichu porównywać dwa identyczne bundle. */
const mutation = { applied: 0 };
const revertFixPlugin = {
  name: 'revert-fix',
  setup(build) {
    build.onLoad({ filter: /eot-event-defer\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== EOT_DEFER) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(
        "title: isDiplomacy ? 'Dyplomacja' : '',",
        "title: isDiplomacy ? 'Dyplomacja' : 'Koniec tury',",
      );
      if (out !== src) mutation.applied++;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /sidePanelHud\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== SIDE_PANEL_HUD) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(
        /\+ \(hasOwnTitle\s*\n\s*\? '<span class="sp-kicker">Wydarzenie<\/span><div class="sp-title">' \+ ev\.title \+ '<\/div>'\s*\n\s*: '<div class="sp-title sp-title-generic">Wydarzenie<\/div>'\)/,
        "+ '<span class=\"sp-kicker\">Wydarzenie</span><div class=\"sp-title\">' + ev.title + '</div>'",
      );
      if (out !== src) mutation.applied++;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: mutate ? [revertFixPlugin, viteCompatPlugin] : [viteCompatPlugin],
    logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[sidepanel-event-header-wydarzenie-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Renderuje PRAWDZIWY `createSidePanelHud` na trzech kartach i zbiera z ŻYWEGO DOM-u
 * to, czego nie widać w źródle: teksty wierszy nagłówka + ich EFEKTYWNY `font-size`. */
async function measure(page, elimMsg, diploMsg) {
  return page.evaluate(({ elimMsg, diploMsg }) => {
    const [elim, diplo] = window.__deferredHintsToSidePanelEvents(
      [{ msg: elimMsg, durationMs: 4000 }, { msg: diploMsg, durationMs: 4000 }],
      12,
    );
    const blocking = {
      id: 'revolt-city3',
      icon: '⚠',
      title: 'Bunt w miescie: Teby',
      subtitle: 'Ludnosc zada zmiany praw.',
      kind: 'enemy',
      blocking: true,
    };
    const host = document.getElementById('host');
    host.innerHTML = '';
    const api = window.__createSidePanelHud({ getEvents: () => [elim, diplo, blocking] });
    host.appendChild(api.el);

    const px = (el) => (el === null ? null : parseFloat(getComputedStyle(el).fontSize));
    const txt = (el) => (el === null ? null : (el.textContent || '').replace(/\s+/g, ' ').trim());
    const card = (id) => {
      const c = api.el.querySelector('.sp-event[data-id="' + id + '"]');
      if (c === null) return { missing: true };
      // Wiersz DOMINUJĄCY = ten o największym font-size wśród elementów nagłówka karty.
      // Liczymy go z DOM-u, a nie z nazwy klasy — dokładnie o to pyta zgłoszenie
      // („dużą czcionką ma być «wydarzenie»"), i to przetrwa też zmianę nazw klas.
      const rows = [...c.querySelectorAll('.sp-kicker, .sp-title, .sp-sub, .sp-badge-decision')]
        .map((el) => ({ cls: el.className, text: txt(el), size: px(el) }));
      const top = rows.slice().sort((a, b) => b.size - a.size)[0] || null;
      return {
        text: txt(c),
        rows,
        dominant: top,
        kickerCount: c.querySelectorAll('.sp-kicker').length,
        titleCount: c.querySelectorAll('.sp-title').length,
        genericCount: c.querySelectorAll('.sp-title-generic').length,
        badgeText: txt(c.querySelector('.sp-badge-decision')),
        subText: txt(c.querySelector('.sp-sub')),
      };
    };
    return { elim: card(elim.id), diplo: card(diplo.id), blocking: card('revolt-city3') };
  }, { elimMsg, diploMsg });
}

/** Asercje zgłoszenia. `soft:true` → nie zapisuje wyniku globalnie, tylko zwraca mapę
 * id→wynik (używane przez mutację D).
 *
 * Rozróżnienie WAŻNE dla uczciwości mutacji: A1–A3 to asercje ROZSTRZYGAJĄCE (opisują
 * dokładnie to, co zmieniło zgłoszenie — który wyraz stoi w slocie dominującym) i na
 * kodzie sprzed poprawki MUSZĄ paść. A4 to INWARIANT ROZMIARU: slot dominujący ma ten
 * sam font-size co tytuł zwykłej karty. Przed poprawką stało w nim „Koniec tury", po
 * poprawce „Wydarzenie" — rozmiar był i jest ten sam, więc A4 z definicji zielone w OBU
 * stanach. To nie luka: A4 pilnuje, że awansowany wyraz nie wylądował przypadkiem na
 * rozmiarze overline'u (8.5px), i tego pilnuje wyłącznie w stanie PO. */
const DISCRIMINATING = ['A1', 'A2', 'A3'];
function assertReport(m, soft) {
  const results = [];
  const t = (id, name, cond, detail) => {
    results.push({ id, name, cond: !!cond });
    if (!soft) check(name, cond, detail);
  };

  const bigTitlePx = m.diplo.rows.filter(r => /sp-title/.test(r.cls)).map(r => r.size)[0];

  // --- (A) karta generyczna (dawniej „Koniec tury") ---------------------------------
  t('A1', '(A1) karta generyczna NIE zawiera juz nigdzie tekstu „Koniec tury"',
    m.elim.text !== null && !m.elim.text.includes('Koniec tury'), m.elim.text);
  t('A2', '(A2) dominujacy (najwiekszy) wiersz karty generycznej to doslownie „Wydarzenie"',
    m.elim.dominant !== null && m.elim.dominant.text === 'Wydarzenie', m.elim.dominant);
  t('A3', '(A3) „Wydarzenie" jest w slocie tytulu (.sp-title), a overline .sp-kicker znika (zero duplikacji slowa)',
    m.elim.titleCount === 1 && m.elim.genericCount === 1 && m.elim.kickerCount === 0,
    { titleCount: m.elim.titleCount, kickerCount: m.elim.kickerCount, genericCount: m.elim.genericCount });
  t('A4', '(A4) slot dominujacy karty generycznej ma DOKLADNIE rozmiar tytulu zwyklej karty (inwariant, patrz nota nad funkcja)',
    m.elim.dominant !== null && bigTitlePx !== undefined && m.elim.dominant.size === bigTitlePx,
    { dominujacy: m.elim.dominant && m.elim.dominant.size, tytul: bigTitlePx });

  if (soft) return results;

  // (A5) nic nie ginie informacyjnie — konkretna tresc nadal w subtitle.
  check('(A5) pelna tresc zdarzenia (eliminacja miasta-panstwa) nadal widoczna w .sp-sub',
    m.elim.subText === ELIM_MSG, m.elim.subText);

  // --- (B) karta z WLASNYM tytulem — nie moze stracic tytulu przy okazji -------------
  check('(B1) karta „Dyplomacja" nadal pokazuje swoj wlasny tytul',
    m.diplo.rows.some(r => /sp-title/.test(r.cls) && r.text === 'Dyplomacja'), m.diplo.rows);
  check('(B2) karta z wlasnym tytulem zachowuje maly overline „Wydarzenie" (uklad jak dotad)',
    m.diplo.kickerCount === 1 && m.diplo.rows.some(r => /sp-kicker/.test(r.cls) && r.text === 'Wydarzenie'),
    m.diplo.rows);
  const kickerPx = m.diplo.rows.filter(r => /sp-kicker/.test(r.cls)).map(r => r.size)[0];
  check('(B3) na karcie z wlasnym tytulem overline jest MNIEJSZY od tytulu (hierarchia bez zmian)',
    kickerPx !== undefined && bigTitlePx !== undefined && kickerPx < bigTitlePx,
    { kicker: kickerPx, tytul: bigTitlePx });
  check('(B4) karta „Dyplomacja" NIE dostala klasy generycznej',
    m.diplo.genericCount === 0, m.diplo.genericCount);

  // --- (C) karta blokujaca — poza zakresem zgloszenia, ma zostac nietknieta ----------
  check('(C1) karta blokujaca zachowuje badge „Wymaga decyzji"',
    m.blocking.badgeText === 'Wymaga decyzji', m.blocking.badgeText);
  check('(C2) karta blokujaca zachowuje swoj wlasny tytul w .sp-title',
    m.blocking.rows.some(r => /sp-title/.test(r.cls) && r.text === 'Bunt w miescie: Teby'), m.blocking.rows);
  check('(C3) karta blokujaca NIE przeszla przez nowa galaz (brak .sp-title-generic, brak slowa „Wydarzenie")',
    m.blocking.genericCount === 0 && !/Wydarzenie/.test(m.blocking.text || ''), m.blocking.text);

  return results;
}

async function main() {
  // --- (0) statyczne kotwice w zrodle — czytelny sygnal, gdy poprawka zniknie --------
  const eotSrc = fs.readFileSync(EOT_DEFER, 'utf8');
  const hudSrc = fs.readFileSync(SIDE_PANEL_HUD, 'utf8');
  check('(0) deferredHintsToSidePanelEvents nie wstawia juz literalu „Koniec tury" do title',
    !/title:\s*isDiplomacy\s*\?\s*'Dyplomacja'\s*:\s*'Koniec tury'/.test(eotSrc));
  check('(0) fallbackiem title jest pusty lancuch',
    /title:\s*isDiplomacy\s*\?\s*'Dyplomacja'\s*:\s*''/.test(eotSrc));
  check('(0) klucz deduplikacji opiera sie na samym subtitle (nie na title)',
    /const key = d\.subtitle;/.test(eotSrc));
  check('(0) render rozroznia karty po PUSTYM title, nie po tresci lancucha',
    /const hasOwnTitle = ev\.title\.trim\(\) !== '';/.test(hudSrc));

  fs.writeFileSync(ENTRY, [
    "import { createSidePanelHud } from '../src/ui/sidePanelHud.ts';",
    "import { deferredHintsToSidePanelEvents } from '../src/game/eot-event-defer.ts';",
    'window.__createSidePanelHud = createSidePanelHud;',
    'window.__deferredHintsToSidePanelEvents = deferredHintsToSidePanelEvents;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_PRZED, true);
  check('(D0) mutacja PRZED faktycznie podmienila obie polowy poprawki (test nie jest pusty)',
    mutation.applied === 2, mutation.applied);
  if (mutation.applied !== 2) {
    console.log('\nPRZERWANE: nie udalo sie odtworzyc stanu sprzed poprawki — kod sie przesunal, popraw wzorce w revertFixPlugin.');
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 520, height: 640 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  async function renderWith(bundleFile, shotName) {
    // Tlo 1:1 z gra/index.html — panel dziedziczy po nim box-sizing i kolor podkladu.
    await page.setContent(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#0b0d12;}'
      + '#host{position:relative;width:520px;height:640px;}'
      + '</style></head><body><div id="host"></div></body></html>',
    );
    await page.addScriptTag({ path: bundleFile });
    const m = await measure(page, ELIM_MSG, DIPLO_MSG);
    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      const target = await page.$('#host .civ-side-panel') || await page.$('#host');
      await target.screenshot({ path: path.join(SHOTS, shotName) });
    }
    return m;
  }

  try {
    console.log('\n--- (A)-(C) render PO poprawce (bundel z niezmienionych zrodel) ---');
    const after = await renderWith(BUNDLE_PO, 'naglowek-po.png');
    assertReport(after, false);

    console.log('\n--- (D) mutacja: ten sam render na kodzie SPRZED poprawki ---');
    const before = await renderWith(BUNDLE_PRZED, 'naglowek-przed.png');
    const soft = assertReport(before, true);
    const stillGreen = soft.filter(r => r.cond && DISCRIMINATING.includes(r.id)).map(r => r.id);
    check('(D1) na kodzie sprzed poprawki KAZDA asercja rozstrzygajaca (A1-A3) pada — test nie jest tautologiczny',
      stillGreen.length === 0, { nadal_zielone: stillGreen });
    check('(D2) render PRZED faktycznie pokazywal „Koniec tury" duza czcionka (kontrast do A2)',
      before.elim.dominant !== null && before.elim.dominant.text === 'Koniec tury', before.elim.dominant);

    check('(E0) zero bledow konsoli/JS w obu renderach', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close();
  }

  // --- (E) artefakt PRODUKCYJNY vite build (C-001: dowod na produkcie budowania) -----
  if (!SKIP_VITE) {
    let dist = DIST_ARG;
    if (dist === null) {
      // Poza drzewem repo (os.tmpdir), żeby bramka nie zostawiała 37 MB artefaktu w
      // `git status` — kanon C-001 buduje dokładnie tak: `vite build --outDir <tmp>
      // --emptyOutDir`, nigdy `npm run build` (ten przepuszcza export-data.py po tech.json).
      const outDir = path.join(os.tmpdir(), `civ-sp-event-header-dist-${TMPDIR_RUN_ID}`);
      execFileSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(E1) artefakt vite build niesie regule CSS awansowanego tytulu (.sp-title-generic)',
      built.includes('sp-title-generic'));
    check('(E2) artefakt vite build NIE niesie juz fallbacku title „Koniec tury" w sciezce EOT',
      !/isDiplomacy\s*\?\s*"Dyplomacja"\s*:\s*"Koniec tury"/.test(built)
      && !/isDiplomacy\s*\?\s*'Dyplomacja'\s*:\s*'Koniec tury'/.test(built));
    check('(E3) artefakt vite build nadal niesie specyficzny tytul „Dyplomacja"',
      built.includes('Dyplomacja'));
  } else {
    console.log('SKIP: (E) sekcja artefaktu vite build pominieta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_PO); fs.unlinkSync(BUNDLE_PRZED); } catch (_) {}

  console.log('\nsidepanel-event-header-wydarzenie-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty PRZED/PO: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
