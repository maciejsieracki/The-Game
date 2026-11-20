'use strict';
/**
 * R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1 -- audyt pól zapisu gubionych przez JAWNĄ listę pól w `deserializeGame`
 * (gra/src/game/save.ts) oraz pól nieodtwarzanych po restoreGameFromSave. Narzędzie pomiarowe: NIE zmienia kodu gry.
 *
 * Dwie fazy porównania (rekurencyjnie po kluczach; tablice traktowane jako liście wartości):
 *  (a) raw A (serializeGame -> magazyn, ścieżka produkcyjna)  vs  deserializeGame(raw A)
 *      GUBIONE            -- pole jest w zapisie, deserializeGame go nie zwraca (NIEZALICZONE, exit 1)
 *      OK                 -- pole jest i zwrócone bez zmian
 *      ZMIENIONE          -- pole zwrócone, ale znormalizowane (informacyjne)
 *      DOMYSLNE           -- pole zwrócone, nieobecne w zapisie (wartość domyślna, informacyjne)
 *      OK_PUSTA           -- jak OK, ale wartość to pusta tablica (NIE dowodzi, że pole jest odtwarzane: pusta
 *                            i zgubiona tablica dają ten sam wynik; liczone osobno, informacyjne)
 *      NIEPRZETESTOWANE_BRAK_W_PROBCE -- klucz najwyższego poziomu zwracany przez deserializeGame, którego
 *                            w zapisie A nie ma (pole warunkowe, np. autoMarch/rallyPoints); ta próbka go NIE testuje
 *  (b) deserializeGame(raw A)  vs  raw B (NOWA strona: loadSlot -> restoreGameFromSave -> serializeGame -> magazyn)
 *      NIE_PRZYWROCONE    -- deserializeGame zwraca pole, runtime po wczytaniu go nie zapisuje (NIEZALICZONE, exit 1)
 *      GUBIONE_PO_RESTORE -- pole było w raw A, po restore zniknęło z zapisu (NIEZALICZONE, exit 1)
 *      OK / OK_PUSTA / ZMIENIONE_PO_RESTORE / EFEMERYCZNE (savedAt) -- informacyjne
 *
 * Pola z `JUSTIFIED` (niżej) są raportowane jako UZASADNIONE i nie wywracają wyniku -- lista jest celowo pusta;
 * każdy wpis wymaga pisemnego powodu w raporcie orkiestratora.
 *
 * Tryby:
 *  1) Pełny (live, Chromium z hakiem ?civTest=1; dist zbudowany POZA repo):
 *     node tools/save-load-deserialize-fields-audit.cjs --dist <abs-dist> [--chrome /usr/bin/chromium] [--turns 2] [--seed 4242]
 *  2) Porównanie gotowych zrzutów (bez przeglądarki):
 *     node tools/save-load-deserialize-fields-audit.cjs --raw-a <abs.json> --raw-b <abs.json> [--src <abs gra/src>]
 *  3) Mutacja (kontrola czułości): kopia gra/src z usuniętą linią `<pole>: Array.isArray(obj2.<pole>)` w save.ts;
 *     dodaj --mutate <pole> do trybu 1 lub 2. Wymagane: porównanie na oryginale ZIELONE (brak GUBIONE), na mutancie
 *     CZERWONE (GUBIONE dla <pole>). Inaczej exit 1.
 *
 * Wynik: JSON w <repo>/dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1/evidence/ (--out-dir nadpisuje),
 * zrzuty raw A/B zapisywane obok. Exit 0 = brak niezaliczonych pól; 1 = są GUBIONE/NIE_PRZYWROCONE/GUBIONE_PO_RESTORE
 * lub błąd narzędzia.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const RUN_ID = 'R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1';
const SRC = path.resolve(arg('src', path.join(GRA, 'src')));
const OUT_DIR = path.resolve(arg('out-dir', path.join(REPO, 'dyspozycje', 'autobot', 'runs', RUN_ID, 'evidence')));
const DIST = arg('dist', '') ? path.resolve(arg('dist', '')) : '';
const RAW_A_ARG = arg('raw-a', '') ? path.resolve(arg('raw-a', '')) : '';
const RAW_B_ARG = arg('raw-b', '') ? path.resolve(arg('raw-b', '')) : '';
const MUTATE = arg('mutate', '');
const CHROME = arg('chrome', (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'));
const SEED = Number(arg('seed', '4242'));
const TURNS = Number(arg('turns', '2'));
const SAVE_PREFIX = 'thegame.save.';
const SLOT_A = 'dfaudit-A-' + SEED;
const SLOT_B = 'dfaudit-B-' + SEED;
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'dfaudit-'));

/** Pola zwrócone/zapisywane, które są celowo inne (pusta lista; wpis = pisemny powód w raporcie). */
const JUSTIFIED = {};
/** Pola efemeryczne (znacznik czasu zapisu) -- nie oceniane jako gubione. */
const EFEMERYCZNE = new Set(['savedAt']);

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Spłaszcza obiekt do ścieżek -> wartość. Obiekty rekurencyjnie; tablice i prymitywy = liście; undefined pomijane. */
function flatten(obj, prefix = '', out = {}) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined) continue;
    const p = prefix ? prefix + '.' + k : k;
    if (isPlain(v) && Object.keys(v).length > 0) flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}
/** Kanoniczny JSON (klucze posortowane): kolejność kluczy obiektu nie jest różnicą danych. */
const canon = (v) => {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (isPlain(v)) return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
};
const eq = (a, b) => canon(a) === canon(b);
const lastSeg = (p) => p.slice(p.lastIndexOf('.') + 1);
/** Werdykt dla wartości zgodnej: pusta tablica osobno (nie dowodzi odtworzenia pola). */
const okVerdict = (v) => (Array.isArray(v) && v.length === 0 ? 'OK_PUSTA' : 'OK');

/** Ładuje deserializeGame z gra/src przez esbuild (bundle w katalogu roboczym poza repo). */
function loadDeserializer(srcDir, tag) {
  const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
  const out = path.join(WORK, 'save-bundle-' + tag + '.cjs');
  esbuild.buildSync({
    entryPoints: [path.join(srcDir, 'game', 'save.ts')], bundle: true, platform: 'node', format: 'cjs',
    outfile: out, logLevel: 'silent',
  });
  delete require.cache[out];
  return require(out);
}

/** Kopia gra/src z usuniętą linią przypisania pola w save.ts (kontrola czułości). Zwraca ścieżkę kopii src. */
function makeMutantSrc(field) {
  const dst = path.join(WORK, 'src-mutant-' + field);
  fs.cpSync(SRC, dst, { recursive: true });
  const f = path.join(dst, 'game', 'save.ts');
  const txt = fs.readFileSync(f, 'utf8');
  // Linia przypisania w deserializeGame: `<pole>: <cokolwiek z obj2.<pole>>` (Array.isArray(...), obj2.x, typeof...).
  // Pola złożone wieloliniowo (np. recruitGeneralId) nie są mutowalne tym wzorcem -- błąd składni = exit 1.
  const re = new RegExp('^[ \\t]*' + field + ': [^\\n]*obj2\\.' + field + '\\b[^\\n]*\\n', 'm');
  if (!re.test(txt)) throw new Error('mutacja: nie znaleziono jednoliniowego przypisania pola ' + field + ' w save.ts');
  fs.writeFileSync(f, txt.replace(re, ''));
  return dst;
}

/** Porównanie faz (a) i (b). Zwraca tabelę wierszy i liczniki. */
function compare(rawAText, rawBText, deserialize) {
  const rawA = JSON.parse(rawAText);
  const rawB = JSON.parse(rawBText);
  const des = deserialize(rawAText);
  const fRawA = flatten(rawA);
  const fDes = flatten(des);
  const fRawB = flatten(rawB);
  const rows = [];
  const add = (phase, p, verdict, extra = {}) => rows.push({ phase, pole: p, verdict, ...extra });
  const justified = (p) => (JUSTIFIED[p] ? ' (UZASADNIONE: ' + JUSTIFIED[p] + ')' : '');

  // (a) raw A vs deserializeGame(raw A)
  const keysA = new Set([...Object.keys(fRawA), ...Object.keys(fDes)]);
  for (const p of keysA) {
    const inR = p in fRawA; const inD = p in fDes;
    if (inR && !inD) add('a', p, JUSTIFIED[p] ? 'UZASADNIONE' : 'GUBIONE', { wZapisie: true, poDeserializacji: false, uwaga: justified(p) });
    else if (!inR && inD) add('a', p, 'DOMYSLNE', { wZapisie: false, poDeserializacji: true });
    else if (eq(fRawA[p], fDes[p])) add('a', p, okVerdict(fRawA[p]), { wZapisie: true, poDeserializacji: true });
    else add('a', p, 'ZMIENIONE', { wZapisie: true, poDeserializacji: true });
  }

  // (b) deserializeGame(raw A) vs raw B (po restoreGameFromSave + ponownym zapisie)
  const keysB = new Set([...Object.keys(fDes), ...Object.keys(fRawA), ...Object.keys(fRawB)]);
  for (const p of keysB) {
    const inD = p in fDes; const inA = p in fRawA; const inB = p in fRawB;
    if (EFEMERYCZNE.has(lastSeg(p))) { add('b', p, 'EFEMERYCZNE', { poDeserializacji: inD, poRestore: inB }); continue; }
    if (inD && !inB) add('b', p, JUSTIFIED[p] ? 'UZASADNIONE' : 'NIE_PRZYWROCONE', { poDeserializacji: true, poRestore: false, uwaga: justified(p) });
    else if (inA && !inB) add('b', p, JUSTIFIED[p] ? 'UZASADNIONE' : 'GUBIONE_PO_RESTORE', { poDeserializacji: inD, poRestore: false, uwaga: justified(p) });
    else if (!inD && inB) add('b', p, 'DODANE_PRZY_RESTORE', { poDeserializacji: false, poRestore: true });
    else if (eq(fDes[p], fRawB[p])) add('b', p, okVerdict(fDes[p]), { poDeserializacji: true, poRestore: true });
    else add('b', p, 'ZMIENIONE_PO_RESTORE', { poDeserializacji: true, poRestore: true });
  }

  // (c) klucze najwyższego poziomu zwracane przez deserializeGame, których w zapisie A nie ma
  // (np. pola warunkowe: autoMarch, plannedMarches, recruitGeneralId, rallyPoints). Ta próbka ich NIE testuje.
  for (const k of Object.keys(des)) {
    const present = Object.keys(fRawA).some((p) => p === k || p.startsWith(k + '.'));
    if (!present) add('a', k, 'NIEPRZETESTOWANE_BRAK_W_PROBCE', { wZapisie: false, poDeserializacji: des[k] !== undefined });
  }

  const counts = {};
  for (const r of rows) { const k = r.phase + ':' + r.verdict; counts[k] = (counts[k] || 0) + 1; }
  const failing = rows.filter((r) => r.verdict === 'GUBIONE' || r.verdict === 'NIE_PRZYWROCONE' || r.verdict === 'GUBIONE_PO_RESTORE');
  return {
    rows, counts, failing,
    keysComparedA: keysA.size, keysComparedB: keysB.size,
    rawAKeys: Object.keys(fRawA).length, rawBKeys: Object.keys(fRawB).length,
    rawALedgerEntries: Array.isArray(rawA.resourceLedgerHistory) ? rawA.resourceLedgerHistory.length : null,
  };
}

function report(label, res) {
  log('== ' + label + ' ==');
  log('kluczy porownanych: faza a=' + res.keysComparedA + ', faza b=' + res.keysComparedB + '; liscie raw A=' + res.rawAKeys + ', raw B=' + res.rawBKeys);
  log('liczniki: ' + JSON.stringify(res.counts));
  for (const r of res.failing) log('  NIEZALICZONE ' + r.verdict + ' ' + r.pole + ' (faza ' + r.phase + ')');
  log('wynik ' + label + ': ' + (res.failing.length === 0 ? 'ZIELONY (brak zgubionych pol)' : 'CZERWONY (' + res.failing.length + ' pol)'));
}

// ---------------------------------------------------------------- live (Chromium)
async function captureLive() {
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const launchOpts = { headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
  if (CHROME) launchOpts.executablePath = CHROME;
  const browser = await chromium.launch(launchOpts);
  const bootPage = async (page) => {
    await page.goto('file://' + path.join(DIST, 'index.html') + `?civTest=1&civSeed=${SEED}`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__nnsMeasureDebug && !!window.__ledgerRealPathDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
  };
  // Odczyt surowego zapisu z magazynu produkcyjnego (IndexedDB 'thegame-saves'/'kv', fallback localStorage).
  const readRaw = (page, slot) => page.evaluate(async (key) => {
    const idbGet = () => new Promise((res) => {
      const r = indexedDB.open('thegame-saves');
      r.onerror = () => res(null);
      r.onsuccess = () => {
        const db = r.result;
        try {
          const g = db.transaction('kv', 'readonly').objectStore('kv').get(key);
          g.onsuccess = () => { db.close(); res(typeof g.result === 'string' ? g.result : null); };
          g.onerror = () => { db.close(); res(null); };
        } catch (e) { db.close(); res(null); }
      };
    });
    const v = await idbGet();
    if (v !== null) return v;
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }, SAVE_PREFIX + slot);
  const endTurnAndWait = async (page) => {
    const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    const blocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
    if (blocked) {
      await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerGold(500));
      await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerFood(500));
    }
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    const t1 = Date.now();
    for (;;) {
      const s = await page.evaluate(() => ({ ip: window.__eraTestDebug.isEndTurnInProgress(), turn: window.__eraTestDebug.getWorldState().turn }));
      if (!s.ip && s.turn > before) return s.turn;
      if (Date.now() - t1 > 400000) throw new Error('endTurn timeout at turn ' + before);
      await wait(300);
    }
  };
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p1 = await context.newPage();
    p1.on('dialog', (d) => d.dismiss().catch(() => {}));
    await bootPage(p1);
    await p1.evaluate((s) => window.__aiBuildingsTestDebug.startNewGame({ seed: s }), SEED);
    const t0 = Date.now();
    for (;;) {
      const ok = await p1.evaluate(() => { try { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return d.awaitingFirstPlayerCity === true && d.playerStartHex !== null; } catch (e) { return false; } });
      if (ok) break;
      if (Date.now() - t0 > 900000) throw new Error('timeout awaitingFirstPlayerCity');
      await wait(500);
    }
    if (!(await p1.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity false');
    await wait(500);
    try { await p1.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest()); } catch (e) { log('disableVictoryCheck: ' + String(e).slice(0, 120)); }
    for (let i = 0; i < TURNS; i++) log('sesja1 endTurn -> tura ' + (await endTurnAndWait(p1)));
    const okSave = await p1.evaluate((s) => window.__nnsMeasureDebug.quickSave(s), SLOT_A);
    const rawA = await readRaw(p1, SLOT_A);
    if (!rawA) throw new Error('brak zapisu A w magazynie (klucz ' + SAVE_PREFIX + SLOT_A + ', quickSave=' + okSave + ')');
    log('sesja1 zapis A: ' + rawA.length + ' B');

    const p2 = await context.newPage();
    p2.on('dialog', (d) => d.dismiss().catch(() => {}));
    await bootPage(p2);
    await p2.evaluate((s) => window.__nnsMeasureDebug.loadSlot(s), SLOT_A);
    await p2.waitForFunction(() => { try { return window.__nnsMeasureDebug.worldReady(); } catch (e) { return false; } }, undefined, { timeout: 300000 });
    await wait(800);
    await p2.evaluate((s) => window.__nnsMeasureDebug.quickSave(s), SLOT_B);
    const rawB = await readRaw(p2, SLOT_B);
    if (!rawB) throw new Error('brak zapisu B po wczytaniu (klucz ' + SAVE_PREFIX + SLOT_B + ')');
    log('sesja2 zapis B po wczytaniu: ' + rawB.length + ' B');
    return { rawA, rawB };
  } finally {
    await browser.close();
  }
}

async function main() {
  if (!fs.existsSync(path.join(SRC, 'game', 'save.ts'))) throw new Error('brak ' + path.join(SRC, 'game', 'save.ts'));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let rawAText; let rawBText;
  if (DIST) {
    const cap = await captureLive();
    rawAText = cap.rawA; rawBText = cap.rawB;
  } else if (RAW_A_ARG && RAW_B_ARG) {
    rawAText = fs.readFileSync(RAW_A_ARG, 'utf8'); rawBText = fs.readFileSync(RAW_B_ARG, 'utf8');
  } else {
    throw new Error('podaj --dist <abs> (tryb live) albo --raw-a i --raw-b (porownanie zrzutow)');
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(OUT_DIR, 'raw-A-' + stamp + '.json'), rawAText);
  fs.writeFileSync(path.join(OUT_DIR, 'raw-B-' + stamp + '.json'), rawBText);

  const deser = loadDeserializer(SRC, 'orig');
  const real = compare(rawAText, rawBText, deser.deserializeGame);
  report('ORYGINAL gra/src', real);

  let mut = null;
  let verdictOk = real.failing.length === 0;
  if (MUTATE) {
    const mSrc = makeMutantSrc(MUTATE);
    const mDeser = loadDeserializer(mSrc, 'mut');
    mut = compare(rawAText, rawBText, mDeser.deserializeGame);
    report('MUTANT (usunieta linia ' + MUTATE + ')', mut);
    // Pole obiektowe (np. cityProd) ma w tabeli ścieżki podrzędne: cityProd.<...>; liczy się każda z nich.
    const detected = mut.failing.some((r) => r.pole === MUTATE || r.pole.startsWith(MUTATE + '.'));
    // Pole musi być w zapisie A, inaczej kontrola czułości nie ma czego wykryć (wcześniej: prawie zawsze true).
    const observable = rawAText.includes('"' + MUTATE + '"');
    log('kontrola czulosci: pole ' + MUTATE + ' wykryte na mutancie=' + detected + ', obecne w zapisie A=' + rawAText.includes('"' + MUTATE + '"'));
    verdictOk = verdictOk && detected && observable;
  }
  const evidence = {
    runId: RUN_ID, stamp, src: SRC, seed: SEED, mode: DIST ? 'live' : 'raw',
    rawA: path.join(OUT_DIR, 'raw-A-' + stamp + '.json'), rawB: path.join(OUT_DIR, 'raw-B-' + stamp + '.json'),
    original: { counts: real.counts, failing: real.failing, keysComparedA: real.keysComparedA, keysComparedB: real.keysComparedB, rawAKeys: real.rawAKeys, rawBKeys: real.rawBKeys, rows: real.rows },
    mutant: mut ? { field: MUTATE, counts: mut.counts, failing: mut.failing } : null,
    justified: JUSTIFIED, pass: verdictOk,
  };
  const evPath = path.join(OUT_DIR, 'audit-' + stamp + '.json');
  fs.writeFileSync(evPath, JSON.stringify(evidence, null, 1));
  log('dowod: ' + evPath);
  log(verdictOk ? 'WYNIK: ZIELONY' : 'WYNIK: CZERWONY');
  process.exitCode = verdictOk ? 0 : 1;
}

main()
  .catch((e) => { console.error('FATAL', String(e && e.stack || e).slice(0, 800)); process.exitCode = 1; })
  .finally(() => { try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) { /* sprzatanie best-effort */ } });
