'use strict';
/**
 * live-verify-wave-650-664-fort-queue-r2.cjs
 *
 * TEMAT: R-WEB-LIVE-VERIFY-WAVE-650-664-Q1, runda 2, punkt 4 dispatchu (FALA 664, W32):
 * komunikat czyszczenia kolejki fortyfikacji po wczytaniu starego zapisu widoczny RAZ,
 * w kolejce zostaje najwyzszy etap.
 *
 * Metoda (zywa gra, Chromium na bundlu Vite zbudowanym POZA repo; src/ nietkniete):
 *  1. Hak testowy wstrzykiwany TYLKO w kopii bundla (plugin Vite, jak w save-r2):
 *     - fortFixtureForTest(cityId, ids): ustawia kolejke produkcji miasta gracza na ids
 *       (pozycje w ksztalcie ProductionItem z main.ts:4182);
 *     - cityProdIdsForTest / cityBuiltForTest: odczyt stanu do pomiaru;
 *     - persistForTest / loadForTest: PRAWDZIWA sciezka zapisu (persistSaveToSlot) i
 *       wczytania (loadGameFromSlot -> restoreGameFromSave -> collapseFortificationQueuesInCities).
 *  2. Fixture „starego zapisu”: kolejka [palisada, mury_kamienne, mury], zapis przez game save path.
 *     Zapis NIE sanityzuje kolejki (collapse wywolywany tylko w restoreGameFromSave), wiec
 *     w pliku zapisu leza trzy etapy -- dokladnie to, co widzi wczytanie starego zapisu.
 *  3. Przed wczytaniem kolejka w pamieci jest zerowana (zeby pomiar pokazal stan z zapisu).
 *  4. Wczytanie 1: komunikat „Usunięto 2 zbędne pozycje ...” -- liczony jako zbocza
 *     widocznosci #civ-hint-toast z tekstem „Usunięto” (obserwator DOM od poczatku sesji).
 *     Asercje: dokladnie 1 pojawienie, kolejka = [mury], zrzut obejrzany.
 *  5. Wczytanie 2 (ten sam stary zapis na dysku): znow 1 pojawienie (kazde wczytanie starego
 *     zapisu = jeden komunikat), kolejka [mury].
 *  6. Zapis po wczytaniu, potem wczytanie tego nowego zapisu: ZERO komunikatu (kolejka czysta).
 *  7. Bledy: pageerror / console.error, 404 i odpowiedzi HTML.
 *
 * Tryb mutacji (bez zmiany repo, tylko w kopii bundla):
 *   CIV_MUT=notice  -> wpiecie dziala, komunikat wylaczony (fortQueueCleanupNotice = 0 po collapse);
 *   CIV_MUT=wire    -> wpiecie wylaczone (collapse nie wywolany) -- kolejka nie czyszczona.
 *   Oczekiwane: asercje czerwone (exit 1).
 *
 * Uruchomienie (z gra/): CIV_R2_OUT=<katalog poza repo> node tools/live-verify-wave-650-664-fort-queue-r2.cjs
 * Wyjscie: 0 = wszystkie asercje PASS; 1 = co najmniej jedna FAIL.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MUT = process.env.CIV_MUT || '';
// CIV_HOLD_MS (domyslnie 0 = bez zmian): przedluza czas komunikatu czyszczenia W KOPII bundla, tylko do zrzutu.
const HOLD_MS = Number(process.env.CIV_HOLD_MS || 0);
const OUT = path.resolve(process.env.CIV_R2_OUT || path.join(os.tmpdir(), 'civ-r2-fortq-bundle' + (MUT ? '-' + MUT : '')));
const EVIDENCE = path.resolve(ROOT, '..', 'dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-650-664-Q1/evidence/fort-queue-r2');
const CHROME = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;
const NOTICE_TXT = 'Usunięto';
const SLOT_OLD = 'w32-stary-zapis';
const SLOT_NEW = 'w32-po-zapisie';
const FIXTURE = ['palisada', 'mury_kamienne', 'mury'];
const MAP_BOOT_MS = 180000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let pass = 0;
let fail = 0;
const results = [];
function check(label, ok, detail) {
  results.push({ label, ok: !!ok, detail: detail ?? null });
  if (ok) { pass++; console.log('PASS ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
  else { fail++; console.log('FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
function note(label, detail) {
  results.push({ label, info: true, detail: detail ?? null });
  console.log('INFO ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
}

/** Obserwator #civ-hint-toast: zbocza widocznosci z tekstem „Usunięto” (kazde pojawienie = jeden komunikat). */
const TOAST_SPY = `
  window.__noticeRise = 0; window.__noticePrev = false; window.__toastTexts = [];
  new MutationObserver(() => {
    const el = document.getElementById('civ-hint-toast');
    if (!el) return;
    const shown = el.style.display === 'block';
    const txt = (el.textContent || '').trim();
    const now = shown && txt.includes('${NOTICE_TXT}');
    if (now && !window.__noticePrev) {
      window.__noticeRise++;
      // Probe SYNCHRONICZNY w chwili pokazania (bez opoznienia Node): geometria i element na szczycie w srodku komunikatu.
      const r = el.getBoundingClientRect();
      const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
      const top = document.elementFromPoint(cx, cy);
      window.__riseProbe = { rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], center: [cx, cy], topTag: top ? top.tagName + '#' + (top.id || '') : null, topIsToastOrChild: !!top && (top === el || el.contains(top)), opacity: getComputedStyle(el).opacity, z: getComputedStyle(el).zIndex, pe: getComputedStyle(el).pointerEvents, cvPe: top && top.tagName === 'CANVAS' ? getComputedStyle(top).pointerEvents : null, parent: el.parentElement ? el.parentElement.tagName : null, bgColor: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, vis: getComputedStyle(el).visibility, disp: getComputedStyle(el).display, inViewport: r.width > 0 && r.bottom <= innerHeight, at: Date.now() };
    }
    if (now !== window.__noticePrev) { window.__noticeEdges = (window.__noticeEdges || []).concat([{ at: Date.now(), now, shown }]).slice(-40); }
    window.__noticePrev = now;
    if (shown && (!window.__toastTexts.length || window.__toastTexts[window.__toastTexts.length - 1].t !== txt)) {
      window.__toastTexts.push({ t: txt.slice(0, 160), at: Date.now() });
      if (window.__toastTexts.length > 200) window.__toastTexts.splice(0, 100);
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
`;

/** Hak testowy wstrzykiwany do kopii bundla. */
const HOOKS = `
      fortFixtureForTest: (cityId: string, ids: string[]) => {
        cityProd.set(cityId, { kolejka: ids.map(id => ({ kind: 'budynek', id, nazwa: id, koszt: 10 })), postep: 0 } as any);
        return (cityProd.get(cityId)?.kolejka ?? []).map(i => i.id);
      },
      clearQueueForTest: (cityId: string) => { cityProd.set(cityId, { kolejka: [], postep: 0 } as any); },
      cityIdsForTest: () => cities.filter(c => c.ownerId === 0).map(c => c.id),
      cityProdIdsForTest: (cityId: string) => (cityProd.get(cityId)?.kolejka ?? []).map(i => i.id),
      cityBuiltForTest: (cityId: string) => (cityBuilt.get(cityId) ?? []).slice(),
      persistForTest: async (slot: string) => (await persistSaveToSlot(slot, 'w32-fort-queue-live')).ok,
      loadForTest: async (slot: string) => { await loadGameFromSlot(slot, false); },
`;

function makePlugin() {
  return {
    name: 'wave-650-664-fort-queue-r2',
    enforce: 'pre',
    transform(code, moduleId) {
      if (!moduleId.endsWith('/src/main.ts')) return null;
      let output = code;
      const debugMarker = '      getWorldState: () => ({ citiesLen: cities.length, unitsLen: units.length, turn }),';
      if (!output.includes(debugMarker)) throw new Error('Nie znaleziono markera __eraTestDebug');
      output = output.replace(debugMarker, `${debugMarker}${HOOKS}`);
      const wire = 'fortQueueCleanupNotice = collapseFortificationQueuesInCities(cityProd, cityBuilt, data.buildings);';
      if (!output.includes(wire)) throw new Error('Nie znaleziono wpiecia W32 (collapseFortificationQueuesInCities)');
      if (MUT === 'notice') {
        output = output.replace(wire, wire + ' fortQueueCleanupNotice = 0; /* MUT notice */');
      } else if (MUT === 'wire') {
        output = output.replace(wire, 'fortQueueCleanupNotice = 0; /* MUT wire */');
      } else if (MUT) {
        throw new Error('Nieznany CIV_MUT=' + MUT);
      }
      if (HOLD_MS > 0) {
        // Tylko do zrzutu (kopia bundla): czas komunikatu czyszczenia 6000 ms -> HOLD_MS, zeby zrzut
        // (Node + swiftshader, ~1-12 s opoznienia) trafil w okno widocznosci. Wartosc produkcyjna 6000
        // jest sprawdzana w tym samym przebiegu (throw, gdy wzorzec nie pasuje).
        const holdRe = /(zwrócone\.`,\s*)6000,/;
        if (!holdRe.test(output)) throw new Error('Nie znaleziono czasu komunikatu czyszczenia (6000 ms)');
        output = output.replace(holdRe, (_m, p1) => p1 + HOLD_MS + ',');
      }
      return { code: output, map: null };
    },
  };
}

async function build() {
  const { build: viteBuild, mergeConfig } = await import('vite');
  const base = (await import(pathToFileURL(path.join(ROOT, 'vite.config.ts')).href)).default;
  await viteBuild(mergeConfig(base, {
    root: ROOT,
    plugins: [makePlugin()],
    build: { outDir: OUT, emptyOutDir: true },
    logLevel: 'warn',
  }));
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

/** Serwer statyczny bez fallbacku na index.html; zbiera anomalie (404, HTML dla zasobu). */
function startStaticServer(anomalies) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      if (pathname === '/favicon.ico') { res.statusCode = 204; res.end(); return; }
      const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const file = path.resolve(OUT, rel);
      if (!file.startsWith(OUT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        if (pathname !== '/') anomalies.push({ url: pathname, status: 404 });
        res.statusCode = 404;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end('not found');
        return;
      }
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      if (type.startsWith('text/html') && pathname !== '/') anomalies.push({ url: pathname, status: 200, html: true });
      res.setHeader('content-type', type);
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const startedAt = Date.now();
  const suffix = MUT ? '-mut-' + MUT : '';
  const evidence = { mode: 'fort-queue-r2', mut: MUT || null, steps: [] };
  const errors = [];
  const anomalies = [];
  let browser = null;
  let server = null;
  try {
    await build();
    const indexPath = path.join(OUT, 'index.html');
    evidence.bundle = { bytes: fs.statSync(indexPath).size, mut: MUT || null };
    console.log('BUILD ' + JSON.stringify(evidence.bundle));

    browser = await chromium.launch({
      headless: true,
      executablePath: CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
    });
    server = await startStaticServer(anomalies);
    const url = `http://127.0.0.1:${server.address().port}/?playtest=mapa`;

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(TOAST_SPY);
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200)); });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => !!window.__eraTestDebug?.fortFixtureForTest, undefined, { timeout: 60000 });
    await page.waitForFunction(() => !document.querySelector('.civ-map-load-overlay'), undefined, { timeout: MAP_BOOT_MS, polling: 500 });
    await wait(1000);

    const cityId = await page.evaluate(() => window.__eraTestDebug.cityIdsForTest()[0] ?? null);
    check('F0 miasto gracza (ownerId 0) istnieje', !!cityId, { cityId });
    if (!cityId) throw new Error('brak miasta gracza');
    const builtBefore = await page.evaluate(id => window.__eraTestDebug.cityBuiltForTest(id), cityId);

    // Fixture starego zapisu: kolejka z trzema etapami lancucha fortyfikacji, zapis przez save path
    const fixtureIds = await page.evaluate(([id, ids]) => window.__eraTestDebug.fortFixtureForTest(id, ids), [cityId, FIXTURE]);
    check('F1 fixture: kolejka w pamieci = [palisada, mury_kamienne, mury]', JSON.stringify(fixtureIds) === JSON.stringify(FIXTURE), { fixtureIds, builtBefore });
    const savedOld = await page.evaluate(slot => window.__eraTestDebug.persistForTest(slot), SLOT_OLD);
    check('F2 zapis starego stanu (persistSaveToSlot) ok', savedOld === true, { savedOld });
    const afterSaveIds = await page.evaluate(id => window.__eraTestDebug.cityProdIdsForTest(id), cityId);
    check('F3 zapis nie sanityzuje kolejki (w pamieci nadal 3 etapy przed wczytaniem)', JSON.stringify(afterSaveIds) === JSON.stringify(FIXTURE), { afterSaveIds });
    await page.evaluate(id => window.__eraTestDebug.clearQueueForTest(id), cityId);

    // Wczytanie 1 starego zapisu
    let r0 = await page.evaluate(() => window.__noticeRise);
    await page.evaluate(slot => window.__eraTestDebug.loadForTest(slot), SLOT_OLD);
    const shot1 = path.join(EVIDENCE, 'W1-wczytanie-starego-zapisu-komunikat' + suffix + '.png');
    let shotTaken = false;
    let shotInfo = null;
    // Zlapanie komunikatu: waitForFunction (polling w przegladarce, bez rund Node na kazda probke),
    // od razu zrzut; widocznosc trwa kilka sekund, a kazde evaluate pod swiftshader trwa dlugo.
    const detected = await page.waitForFunction(() => {
      const d = document.getElementById('civ-hint-toast');
      if (!d || d.style.display !== 'block' || !(d.textContent || '').includes('Usunięto')) return null;
      const r = d.getBoundingClientRect();
      window.__shotProbe = { rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], opacity: getComputedStyle(d).opacity, text: d.textContent.trim().slice(0, 60), at: Date.now() };
      return true;
    }, undefined, { timeout: 60000, polling: 25 }).then(() => true, () => false);
    if (detected) {
      const probe = await page.evaluate(() => {
        const d = document.getElementById('civ-hint-toast');
        const r = d.getBoundingClientRect();
        const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
        const top = document.elementFromPoint(cx, cy);
        const cv = top && top.tagName === 'CANVAS' ? top : null;
        const cvCs = cv ? getComputedStyle(cv) : null;
        const chain = []; for (let e = d; e && chain.length < 6; e = e.parentElement) { const c = getComputedStyle(e); chain.push(e.tagName + '#' + (e.id || '') + ' z=' + c.zIndex + ' pos=' + c.position + ' tf=' + c.transform.slice(0, 20)); }
        const cvChain = []; for (let e = cv; e && cvChain.length < 4; e = e.parentElement) { const c = getComputedStyle(e); cvChain.push(e.tagName + '#' + (e.id || '') + '.' + String(e.className || '').slice(0, 30) + ' z=' + c.zIndex + ' pos=' + c.position); }
        const toastBox = d.getBoundingClientRect();
        const cvBox = cv ? cv.getBoundingClientRect() : null;
        const cvDiag = { cvChain, cvBox: cvBox ? [Math.round(cvBox.left), Math.round(cvBox.top), Math.round(cvBox.width), Math.round(cvBox.height)] : null, cvPointerEvents: cvCs ? cvCs.pointerEvents : null, toastChain: chain, toastBox: [Math.round(toastBox.left), Math.round(toastBox.top), Math.round(toastBox.width), Math.round(toastBox.height)] };
        return { ...window.__shotProbe, cvDiag, vis: document.visibilityState, hasFocus: document.hasFocus(), topAtCenter: top ? (top.id || top.className || top.tagName).toString().slice(0, 60) : null, toastInTop: !!top && !!d && (d === top || d.contains(top)), toastCls: d.className.toString().slice(0, 80), toastZ: getComputedStyle(d).zIndex, toastPos: getComputedStyle(d).position };
      });
      console.log('PROBE ' + JSON.stringify(probe));
      const shotErr = await page.screenshot({ path: shot1, timeout: 15000 }).then(() => null, e => String(e && e.message || e).slice(0, 300));
      shotTaken = !shotErr;
      // Dowod widocznosci W CHWILI ZRZUTU: stan toasta odczytany in-page zaraz po page.screenshot.
      const visAfter = await page.evaluate(() => {
        const d = document.getElementById('civ-hint-toast');
        const r = d.getBoundingClientRect();
        return { disp: d.style.display, text: (d.textContent || '').includes('Usunięto'), box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], opacity: getComputedStyle(d).opacity, at: Date.now() };
      }).catch(e => ({ error: String(e && e.message || e).slice(0, 200) }));
      shotInfo = { ...probe, shotErr, shotAtMs: Date.now(), probeToShotMs: Date.now() - probe.at, visAfter, holdMs: HOLD_MS || null };
      console.log('SHOT ' + JSON.stringify(shotInfo));
    }
    const shotVisible = !!(shotInfo && shotInfo.visAfter && shotInfo.visAfter.disp === 'block' && shotInfo.visAfter.text && shotInfo.visAfter.box && shotInfo.visAfter.box[2] > 0);
    await wait(7000);
    const rise1 = (await page.evaluate(() => window.__noticeRise)) - r0;
    const qAfter1 = await page.evaluate(id => window.__eraTestDebug.cityProdIdsForTest(id), cityId);
    const texts1 = await page.evaluate(() => window.__toastTexts.map(e => e.t));
    const notice1 = texts1.find(t => t.includes(NOTICE_TXT)) || null;
    const edges1 = await page.evaluate(() => window.__noticeEdges || []);
    const riseProbe1 = await page.evaluate(() => window.__riseProbe || null);
    console.log('RISE ' + JSON.stringify(riseProbe1));
    evidence.steps.push({ step: 'W1-load-old', rise: rise1, qAfter: qAfter1, texts: texts1, shot: shotTaken ? shot1 : null, shotInfo, edges1, riseProbe1 });
    check('W1a komunikat czyszczenia pojawil sie DOKLADNIE raz po wczytaniu starego zapisu', rise1 === 1, { rise: rise1 });
    check('W1b tresc komunikatu: „Usunięto 2 zbędne pozycje”, bez zwrotu kosztu', !!notice1 && /Usunięto 2 zbędne pozycje/.test(notice1) && /Koszt i postęp nie zostały zwrócone/.test(notice1), { notice1 });
    check('W1c w kolejce zostaje najwyzszy etap (mury), dwa nizsze usuniete', JSON.stringify(qAfter1) === JSON.stringify(['mury']), { qAfter1 });
    check('W1d zrzut ekranu komunikatu wykonany i komunikat widoczny w chwili zrzutu (in-page po zrzucie)', shotTaken && shotVisible, { shot: shotTaken ? shot1 : null, visAfter: shotInfo && shotInfo.visAfter, holdMs: HOLD_MS || null });

    // Wczytanie 2 tego samego starego zapisu (plik nadal stary): znow jedno pojawienie.
    // Przy CIV_HOLD_MS komunikat z W1 jeszcze wisi: zeruje toast osobnym zadaniem, zeby obserwator
    // zobaczyl nowe zbocze (bez tego obie wstawki w jednym zadaniu daja tylko stan koncowy).
    await page.evaluate(() => { const d = document.getElementById('civ-hint-toast'); if (d) { d.style.display = 'none'; d.textContent = ''; } });
    await page.evaluate(([id, ids]) => window.__eraTestDebug.fortFixtureForTest(id, ids), [cityId, FIXTURE]);
    await page.evaluate(id => window.__eraTestDebug.clearQueueForTest(id), cityId);
    r0 = await page.evaluate(() => window.__noticeRise);
    await page.evaluate(slot => window.__eraTestDebug.loadForTest(slot), SLOT_OLD);
    await wait(8000);
    const rise2 = (await page.evaluate(() => window.__noticeRise)) - r0;
    const qAfter2 = await page.evaluate(id => window.__eraTestDebug.cityProdIdsForTest(id), cityId);
    evidence.steps.push({ step: 'W2-load-old-again', rise: rise2, qAfter: qAfter2 });
    check('W2 ponowne wczytanie tego samego starego zapisu: dokladnie jedno pojawienie komunikatu', rise2 === 1, { rise: rise2, qAfter: qAfter2 });

    // Zapis po wczytaniu -> wczytanie nowego zapisu: kolejka czysta, zero komunikatu
    await page.evaluate(() => { const d = document.getElementById('civ-hint-toast'); if (d) { d.style.display = 'none'; d.textContent = ''; } });
    const savedNew = await page.evaluate(slot => window.__eraTestDebug.persistForTest(slot), SLOT_NEW);
    await page.evaluate(id => window.__eraTestDebug.clearQueueForTest(id), cityId);
    r0 = await page.evaluate(() => window.__noticeRise);
    await page.evaluate(slot => window.__eraTestDebug.loadForTest(slot), SLOT_NEW);
    await wait(8000);
    const rise3 = (await page.evaluate(() => window.__noticeRise)) - r0;
    const qAfter3 = await page.evaluate(id => window.__eraTestDebug.cityProdIdsForTest(id), cityId);
    evidence.steps.push({ step: 'W3-load-after-save', rise: rise3, qAfter: qAfter3, savedNew });
    check('W3a zapis po wczytaniu zapisany', savedNew === true, { savedNew });
    check('W3b wczytanie nowego zapisu: zero komunikatu czyszczenia (kolejka czysta)', rise3 === 0, { rise: rise3 });
    check('W3c kolejka po wczytaniu nowego zapisu = [mury]', JSON.stringify(qAfter3) === JSON.stringify(['mury']), { qAfter3 });

    evidence.errors = errors;
    evidence.anomalies = anomalies;
    check('C1 brak pageerror i console.error w sesji', errors.length === 0, { count: errors.length, errors: errors.slice(0, 10) });
    check('C2 brak 404 i odpowiedzi HTML dla zasobow', anomalies.length === 0, { count: anomalies.length, anomalies: anomalies.slice(0, 20) });
    note('C3 fixture builtBefore (cityBuilt miasta przed wczytaniem)', { builtBefore });
  } catch (err) {
    fail++;
    console.log('FAIL wyjatek: ' + (err && err.stack || err));
    results.push({ label: 'wyjatek', ok: false, detail: String(err && err.message || err) });
  } finally {
    evidence.checks = results;
    evidence.durationMs = Date.now() - startedAt;
    evidence.summary = { pass, fail };
    fs.writeFileSync(path.join(EVIDENCE, 'fort-queue-r2-result' + suffix + '.json'), JSON.stringify(evidence, null, 2));
    if (browser) await browser.close().catch(() => {});
    if (server) server.close();
    console.log(`Wynik${MUT ? ' (MUT=' + MUT + ')' : ''}: ${pass} PASS / ${fail} FAIL / czas ${Math.round((Date.now() - startedAt) / 1000)} s`);
    process.exit(fail === 0 ? 0 : 1);
  }
}

main();
