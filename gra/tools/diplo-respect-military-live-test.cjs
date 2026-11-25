'use strict';
/**
 * diplo-respect-military-live-test.cjs — R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1 (runda 2, punkt 2).
 *
 * TEST ZYWY (headless Chromium, zbudowany bundle vite POZA repo, `?playtest=mapa&civTest=1`), tury 1–30:
 *   Sila militarna jest sterowana REALNYMI jednostkami (__civTest.addUnit), tury idą REALNYM endTurn,
 *   a zdarzenia odpalają się w REALNYM ticku dyplomacji (applyMilitaryRespektEdgeTick w runDiplomacyTurnTick).
 *   Haki (__respektMilTest) tylko ODCZYTUJĄ stan (sila = diploMilitarySideOf readOnly, stan meta, offset,
 *   rejestr zdarzeń) oraz wykonują round-trip meta przez JSON i kasowanie pól (stary zapis).
 *
 * Scenariusz (para gracz 0 – pierwszy AI):
 *   T1  balans sil (ratio 0,9–1,1) -> tick: inicjalizacja stanu 'brak', bez zdarzenia
 *   T2  gracz ≥1,6× -> +15 raz (stan 'A', rejestr przewaga_militarna_respekt +15)
 *   T3–T6 utrzymanie przewagi -> bez ponownego naliczenia
 *   T7  spadek ratio do ~1,2 -> stan 'brak', bez zdarzenia
 *   T8  ponowne ≥1,6× -> +15 drugi raz
 *   T9  AI ≥1,6× gracza -> stan 'B', −10 raz (slabszy_militarnie_respekt)
 *   T10–T12 utrzymanie -> bez ponownego naliczenia
 *   T13 balans -> 'brak'
 *   T14 round-trip meta (JSON) zachowuje respektPrzewagaStan i respektMilOffset
 *   T15 stary zapis (brak pol stanu) -> inicjalizacja bez zdarzenia, offset bez zmian
 *   T16–T30 balans -> brak nowych zdarzen; zero console.error / pageerror
 *
 * Usage (z gra/):  node tools/diplo-respect-military-live-test.cjs
 *   BUNDLE_DIR=<abs>  bundle z gotowego builda (inaczej build vite do katalogu tymczasowego poza repo)
 *   SKIP_BUILD=1      pomija build (wymaga BUNDLE_DIR/index.html)
 *   RESPECT_EVIDENCE=<abs dir>  zrzuty ekranu;  RESPECT_RESULT=<abs file> JSON z liczbami.
 *
 * Mutacja M4 (kierunek zdarzen): zamiana 'A'↔'B' w applyMilitaryRespektEdgeTick -> test MUSI dac exit 1.
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const BUNDLE = process.env.BUNDLE_DIR || path.join(os.tmpdir(), `diplo-respect-military-live-dist-${TMPDIR_RUN_ID}`);
const EVIDENCE_DIR = process.env.RESPECT_EVIDENCE || '';
const RESULT_FILE = process.env.RESPECT_RESULT || '';
const URL_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const SYSTEM_CHROME = (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const ME = 0;

let pass = 0;
let fail = 0;
const out = { turns: [] };
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK   ${label}`); } else {
    fail++; console.error(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const ev = (page, fn, arg) => page.evaluate(fn, arg);

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  console.log(`[respect-live] build vite -> ${BUNDLE}`);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(BUNDLE)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  for (const exe of [undefined, SYSTEM_CHROME, FALLBACK_CHROME]) {
    try {
      return await chromium.launch(exe ? { headless: true, executablePath: exe, args } : { headless: true, args });
    } catch (_) { /* kolejna proba */ }
  }
  throw new Error('brak dzialajacej przegladarki Chromium');
}

async function shot(page, name) {
  if (!EVIDENCE_DIR) return;
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name) });
  console.log(`  [shot] ${path.join(EVIDENCE_DIR, name)}`);
}

/** Dodaje jednostke wojskowa wlasciciela NA JEGO MIESCIE (REALNE __civTest.addUnit; bez walk na granicy mapy). */
async function addUnitAtCity(page, owner) {
  return ev(page, o => {
    const st = window.__civTest.state();
    const c = st.cities.find(x => x.ownerId === o) || st.cities[0];
    return window.__civTest.addUnit(o, c.q, c.r, false);
  }, owner);
}

/** Kolejka ostrzezen konsoli [EndTurn] (diagnostyka blokady zakonczenia tury). */
const endTurnWarnings = [];
/** Partner AI aktywnego scenariusza (do diagnostyki). */
let curAi = null;

async function endTurnWait(page) {
  const t0 = await ev(page, () => window.__civTest.state().turn);
  // Utrzymanie jednostek testowych nie moze blokowac zakonczenia tury (bramka NNS: skarbiec/spichlerz < 0).
  await ev(page, () => {
    const st = window.__civTest.state();
    const c = st.cities.find(x => x.ownerId === st.me);
    if (c) window.__civTest.adminSetup(c.id, null, 999999, null, null);
    window.__respektMilTest.setZapasy(st.me, 999999);
  });
  await ev(page, () => window.__civTest.endTurn());
  try {
    await page.waitForFunction(t => window.__civTest.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), t0, { timeout: 240000 });
  } catch (e) {
    const st = await ev(page, ([me, a]) => ({ turn: window.__civTest.state().turn, rel: window.__respektMilTest.stan(me, a) }), [ME, curAi]).catch(() => null);
    console.error(`  [diag] tura ${t0} nie zakonczyla sie; stan=${JSON.stringify(st)}; ostrzezenia [EndTurn]: ${JSON.stringify(endTurnWarnings.slice(-5))}`);
    throw e;
  }
  await wait(150);
  return t0 + 1;
}

/** Odczyt: sila gracza i partnera oraz stosunek (gracz/partner). */
async function readRatio(page, ai) {
  return ev(page, ([me, a]) => {
    const g = window.__respektMilTest.sila(me, a).sila;
    const p = window.__respektMilTest.sila(a, me).sila;
    return { gracz: g, partner: p, ratio: p > 0 ? g / p : Infinity };
  }, [ME, ai]);
}

/** Dodaje jednostki wojskowe wlasciciela (REALNE __civTest.addUnit) az do osiagniecia warunku ratio (max krokow). */
async function pushUntil(page, ai, owner, target, mode) {
  // mode 'gracz' -> doklada graczowi, az ratio gracz/partner >= target
  // mode 'ai'    -> doklada partnerowi, az ratio partner/gracz >= target (gracz slabszy)
  // mode 'balans'-> doklada slabszej stronie, az ratio miesci sie w [0.9, 1.1]
  for (let i = 0; i < 400; i++) {
    const r = await readRatio(page, ai);
    const ratio = mode === 'ai' ? (r.gracz > 0 ? r.partner / r.gracz : Infinity) : r.ratio;
    if (mode === 'gracz' && ratio >= target) return { ok: true, adds: i, ...r };
    if (mode === 'ai' && ratio >= target) return { ok: true, adds: i, ...r };
    if (mode === 'balans' && ratio >= 0.9 && ratio <= 1.1) return { ok: true, adds: i, ...r };
    // Wybor strony, ktorej dokladamy jednostke (REALNE addUnit przy wlasnym miescie wlasciciela).
    let target2Add;
    if (mode === 'balans') target2Add = r.gracz < r.partner ? ME : ai;
    else if (mode === 'ai') target2Add = ai;
    else target2Add = ME;
    await addUnitAtCity(page, target2Add);
  }
  return { ok: false, adds: 400, ...(await readRatio(page, ai)) };
}

/** Okno audiencji z realnego UI (lewy pasek / karta HUD -> wiersz cywilizacji) + odczyt paska Respektu i rejestru. */
async function panelRespektBar(page, ai, shotName) {
  const audience = await ev(page, () => {
    const cands = Array.from(document.querySelectorAll('button, [role="button"], [data-tip], [title], [aria-label]'));
    const hit = cands.find(x => /yplomac/i.test((x.getAttribute('title') || '') + ' ' + (x.getAttribute('aria-label') || '') + ' ' + (x.getAttribute('data-tip') || '')));
    if (hit) { hit.click(); return { clicked: true, via: 'pasek' }; }
    const e = Array.from(document.querySelectorAll('.sp-event[data-id]')).find(x => /Dyplomacja/.test(x.textContent || ''));
    if (e) { e.click(); return { clicked: true, via: 'karta HUD' }; }
    return { clicked: false };
  });
  await wait(1500);
  const rowClicked = await ev(page, () => {
    const card = Array.from(document.querySelectorAll('*')).find(x => x.children.length > 0 && /Nasz respekt/.test(x.textContent || '') && (x.textContent || '').length < 400);
    if (!card) return false;
    const name = Array.from(card.querySelectorAll('*')).find(x => x.children.length === 0 && (x.textContent || '').trim().length >= 3 && (x.textContent || '').trim().length <= 20 && !/respekt|Zaufanie|Relacja|Wojny|Sojusze|Handel|Obywatele|Armia|Rekruci/i.test(x.textContent || ''));
    (name || card).click();
    return true;
  });
  await wait(1500);
  const panel = await ev(page, () => {
    const el = document.querySelector('.da-rel-row.respect .v');
    const m = el ? /^\s*(-?\d+)/.exec(el.textContent || '') : null;
    return { bar: m ? parseInt(m[1], 10) : null, text: document.body.innerText || '' };
  });
  const base = await ev(page, a => window.__respektMilTest.bazaPaskaAudiencji(a), ai);
  const st = await pairState(page, ai);
  const expect = base;
  // Relacja AI→gracz po korekcie (st.respekt) minus korekta = wartość bazowa tej strony (computeRespekt(AI, gracz)).
  const relacjaAIBazowa = (st.respekt ?? 0) - (st.offset ?? 0);
  await shot(page, shotName);
  return {
    panelOpened: audience.clicked, via: audience.via || null, rowClicked,
    bar: panel.bar, base, offset: st.offset ?? 0, expect, relacjaAIBazowa, relacjaAI: st.respekt ?? null,
    hasNaszRespekt: /Nasz respekt/i.test(panel.text),
    hasPrzewaga: /Przewaga militarna/.test(panel.text),
    hasSlabszy: /Słabszy militarnie/.test(panel.text),
  };
}

/** Stan pary po ticku: stan przewagi, offset, rejestr zdarzen militarnych (delta). */
async function pairState(page, ai) {
  return ev(page, ([me, a]) => {
    const st = window.__respektMilTest.stan(me, a);
    const log = window.__respektMilTest.log(me, a);
    const sumBy = key => log.filter(x => x.eventKey === key).reduce((s, x) => s + x.delta, 0);
    const count = key => log.filter(x => x.eventKey === key).length;
    return {
      stan: st.respektPrzewagaStan,
      offset: st.respektMilOffset,
      respekt: st.respekt,
      przewagaN: count('przewaga_militarna_respekt'),
      przewagaSum: sumBy('przewaga_militarna_respekt'),
      slabszyN: count('slabszy_militarnie_respekt'),
      slabszySum: sumBy('slabszy_militarnie_respekt'),
    };
  }, [ME, ai]);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) {
    console.error('[respect-live] playwright nie znaleziony (npm ci --ignore-scripts w gra/).'); process.exit(1);
  }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', m => {
      if (m.type() === 'error') consoleErrors.push(m.text());
      if (/\[EndTurn\]/.test(m.text())) endTurnWarnings.push(m.text().slice(0, 160));
    });
    page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));
    await page.goto(URL_HTML, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () => !!window.__respektMilTest && !!window.__civTest && window.__civTest.state().cities.length > 0,
      undefined, { timeout: 180000 },
    );
    // Jak w innych zywych testach: wygrana/przegrana nie moze konczyc gry w trakcie 30 tur (blokada gameOver).
    await ev(page, () => window.__truceTestDebug && window.__truceTestDebug.suppressVictoryForTest());
    const owners = await ev(page, () => window.__respektMilTest.owners());
    assert('sandbox: jest co najmniej jeden partner AI', owners.length >= 1, owners);
    const ai = owners[0];
    curAi = ai;
    out.ai = ai;
    out.progRespektProc = await ev(page, () => window.__respektMilTest.progRespektProc());
    assert('prog Respektu = 50% (jedno zrodlo: progRespektProc)', out.progRespektProc === 50, out.progRespektProc);

    // Scenariusz: pokoj z partnerem (startowa wojna AI dawala bitwy blokujace zakonczenie tury).
    const statusPokoj = await ev(page, a => window.__respektMilTest.setPokoj(a), ai);
    assert('scenariusz: pokoj z partnerem AI', statusPokoj === 'pokoj', statusPokoj);

    // T1: balans, pierwszy tick -> inicjalizacja bez zdarzenia
    let r = await pushUntil(page, ai, ME, 0, 'balans');
    assert('T1: balans sil (ratio 0,9-1,1) osiagniety', r.ok, r);
    let turn = await endTurnWait(page);
    let s = await pairState(page, ai);
    out.turns.push({ turn, faza: 'T1 balans', ratio: r.ratio, ...s });
    assert('T1: stan po pierwszym ticku = brak, bez zdarzen', s.stan === 'brak' && s.przewagaN === 0 && s.slabszyN === 0 && (s.offset ?? 0) === 0, s);

    // T2: gracz >= 1,6x -> +15 raz
    r = await pushUntil(page, ai, ME, 1.6, 'gracz');
    assert('T2: gracz >= 1,6x partnera (sila wojskowa)', r.ok, r);
    turn = await endTurnWait(page);
    const s2 = await pairState(page, ai);
    out.turns.push({ turn, faza: 'T2 gracz>=1.6x', ratio: r.ratio, ...s2 });
    assert('T2: przejscie progu -> stan A', s2.stan === 'A', s2);
    assert('T2: +15 Respektu z rejestru (raz)', s2.przewagaN === 1 && s2.przewagaSum === 15, s2);
    assert('T2: korekta offsetu = +15', (s2.offset ?? 0) === 15, s2);

    // Panel dyplomacji (T2, offset +15): REALNE okno audiencji; pasek Respektu = baza Mocy + korekta (ta sama korekta co w pętli AI).
    const pb = await panelRespektBar(page, ai, 'respekt-live-t2.png');
    out.panelT2 = pb;
    out.panelOpened = pb.panelOpened;
    out.panelRowClicked = pb.rowClicked;
    out.panelHasNaszRespekt = pb.hasNaszRespekt;
    out.panelHasPrzewaga = pb.hasPrzewaga;
    out.panelHasSlabszy = pb.hasSlabszy;
    assert('T2 panel: okno audiencji otwarte i wiersz cywilizacji kliknięty', pb.panelOpened && pb.rowClicked, pb);
    assert('T2 panel: rejestr pokazuje „Przewaga militarna”', pb.hasPrzewaga, pb);
    // Pasek w audiencji = udział GRACZA: baza Mocy + korekta militarna (+15), obciete do [0,100] (r4: korekta uwzgledniona).
    assert('T2 panel: pasek Respektu = clamp(baza + offset) (korekta +15 uwzgledniona)',
      pb.bar !== null && pb.bar === Math.max(0, Math.min(100, pb.base + pb.offset)), pb);
    out.t2ClampMaskuje = pb.base + pb.offset > 100;
    if (pb.base + pb.offset <= 100) {
      assert('T2 panel: baza+offset <= 100 => pasek PRZESUNIETY o +15 wzgledem bazy', pb.bar === pb.base + 15, pb);
    }

    // T3–T6: utrzymanie przewagi -> bez ponownego naliczenia
    for (let t = 3; t <= 6; t++) {
      r = await pushUntil(page, ai, ME, 1.6, 'gracz');
      turn = await endTurnWait(page);
      const st = await pairState(page, ai);
      out.turns.push({ turn, faza: 'T3-6 utrzymanie', ratio: r.ratio, ...st });
      assert(`T${t}: utrzymanie przewagi bez ponownego +15 (ratio ${r.ratio.toFixed(2)})`, st.stan === 'A' && st.przewagaN === 1 && (st.offset ?? 0) === 15, st);
    }

    // T7: spadek ponizej progu (ratio ~1,2) -> brak zdarzenia
    // doklad partnerowi, az gracz/partner spadnie do ~1,2 (ratio gracz/partner)
    r = { ok: false, ratio: Infinity };
    for (let i = 0; i < 400; i++) {
      const rr = await readRatio(page, ai);
      if (rr.ratio < 1.25) { r = { ok: true, ...rr }; break; }
      await addUnitAtCity(page, ai);
    }
    assert('T7: ratio spadlo ponizej 1,25 (przed tickiem)', r.ok, r);
    turn = await endTurnWait(page);
    const s7 = await pairState(page, ai);
    out.turns.push({ turn, faza: 'T7 spadek ponizej progu', ratio: r.ratio, ...s7 });
    assert(`T7: spadek ponizej progu -> stan brak, bez zdarzenia, korekta zdjeta (ratio ${r.ratio.toFixed(2)})`, s7.stan === 'brak' && s7.przewagaN === 1 && (s7.offset ?? 0) === 0, s7);

    // T8: ponowne przekroczenie -> +15 drugi raz
    r = await pushUntil(page, ai, ME, 1.6, 'gracz');
    turn = await endTurnWait(page);
    const s8 = await pairState(page, ai);
    out.turns.push({ turn, faza: 'T8 ponowne przekroczenie', ratio: r.ratio, ...s8 });
    assert('T8: ponowne przejscie progu -> drugie +15 (korekta zastepuje, offset 15)', s8.stan === 'A' && s8.przewagaN === 2 && s8.przewagaSum === 30 && (s8.offset ?? 0) === 15, s8);
    const pb8 = await panelRespektBar(page, ai, 'respekt-live-t8.png');
    out.panelT8 = pb8;
    assert('T8 panel: pasek = clamp(baza + offset)', pb8.bar !== null && pb8.bar === Math.max(0, Math.min(100, pb8.base + pb8.offset)), pb8);

    // T9: AI >= 1,6x gracza -> −10 raz (slabszy)
    r = await pushUntil(page, ai, ME, 1.6, 'ai');
    assert('T9: partner >= 1,6x gracza', r.ok, r);
    turn = await endTurnWait(page);
    const s9 = await pairState(page, ai);
    out.turns.push({ turn, faza: 'T9 gracz slabszy', ratio: r.ratio, ...s9 });
    assert('T9: stan B (gracz slabszy)', s9.stan === 'B', s9);
    assert('T9: −10 „Słabszy militarnie” z rejestru (raz)', s9.slabszyN === 1 && s9.slabszySum === -10, s9);
    assert('T9: korekta offsetu = −10 (zastepuje +15, nie kumuluje)', (s9.offset ?? 0) === -10, s9);
    const pb9 = await panelRespektBar(page, ai, 'respekt-live-t9.png');
    out.panelT9 = pb9;
    assert('T9 panel: pasek = clamp(baza − 10); rejestr „Słabszy militarnie”', pb9.bar !== null && pb9.bar === Math.max(0, Math.min(100, pb9.base + pb9.offset)) && pb9.hasSlabszy, pb9);
    if (pb9.base >= 10) assert('T9 panel: pasek OBNIZONY o 10 wzgledem bazy', pb9.bar === pb9.base - 10, pb9);
    const rt9 = await ev(page, ([me, a]) => window.__respektMilTest.metaRoundTrip(me, a), [ME, ai]);
    out.roundTripT9 = rt9;
    assert('T9: round-trip meta przy niezerowej korekcie zachowuje stan B i offset −10', rt9.respektPrzewagaStan === 'B' && rt9.respektMilOffset === -10, rt9);

    // T10–T12: utrzymanie slabszego -> bez ponownego −10
    for (let t = 10; t <= 12; t++) {
      r = await pushUntil(page, ai, ME, 1.6, 'ai');
      turn = await endTurnWait(page);
      const st = await pairState(page, ai);
      out.turns.push({ turn, faza: 'T10-12 utrzymanie slabszego', ratio: r.ratio, ...st });
      assert(`T${t}: utrzymanie slabszego bez ponownego −10`, st.stan === 'B' && st.slabszyN === 1 && (st.offset ?? 0) === -10, st);
    }

    // T13: balans -> brak
    r = await pushUntil(page, ai, ME, 0, 'balans');
    turn = await endTurnWait(page);
    const s13 = await pairState(page, ai);
    out.turns.push({ turn, faza: 'T13 balans', ratio: r.ratio, ...s13 });
    assert('T13: balans -> stan brak, bez nowych zdarzen', s13.stan === 'brak' && s13.slabszyN === 1 && s13.przewagaN === 2 && (s13.offset ?? 0) === 0, s13);

    // T14: round-trip meta (JSON) zachowuje pola
    const rt = await ev(page, ([me, a]) => window.__respektMilTest.metaRoundTrip(me, a), [ME, ai]);
    r = await pushUntil(page, ai, ME, 0, 'balans');
    turn = await endTurnWait(page);
    const s14 = await pairState(page, ai);
    out.turns.push({ turn, faza: 'T14 round-trip', roundTrip: rt, ratio: r.ratio, ...s14 });
    assert('T14: round-trip meta zachowuje respektPrzewagaStan i respektMilOffset', rt.respektPrzewagaStan === 'brak' && rt.respektMilOffset === 0, rt);
    assert('T14: po round-trip tick (balans) nie zmienia stanu ani offsetu, bez nowych zdarzen', s14.stan === 'brak' && (s14.offset ?? 0) === 0 && s14.przewagaN === 2 && s14.slabszyN === 1, s14);

    // T15: stary zapis (brak pol stanu) -> inicjalizacja bez zdarzenia. Stary zapis nie ma offsetu (brak pola = 0),
    // wiec korekta z przeszlosci nie jest odtwarzana; kluczowe: brak NOWEGO zdarzenia przy inicjalizacji.
    const before15 = s14;
    await ev(page, ([me, a]) => window.__respektMilTest.stripStan(me, a), [ME, ai]);
    r = await pushUntil(page, ai, ME, 1.6, 'gracz');
    turn = await endTurnWait(page);
    const s15 = await pairState(page, ai);
    out.turns.push({ turn, faza: 'T15 stary zapis', ratio: r.ratio, ...s15 });
    assert('T15: stary zapis bez pol -> inicjalizacja bez zdarzenia (liczba wpisow bez zmian)',
      s15.przewagaN === before15.przewagaN && s15.slabszyN === before15.slabszyN, { before: before15, after: s15 });
    assert('T15: brak pola offsetu w starym zapisie = 0 (zgodnie z kontraktem)', (s15.offset ?? 0) === 0, s15);
    assert('T15: po inicjalizacji stan zapisany (A przy ratio >=1,6)', s15.stan === 'A', s15);


    // T16–T30: balans -> bez nowych zdarzen
    let lastCount = s15.przewagaN + s15.slabszyN;
    for (let t = 16; t <= 30; t++) {
      r = await pushUntil(page, ai, ME, 0, 'balans');
      turn = await endTurnWait(page);
      const st = await pairState(page, ai);
      out.turns.push({ turn, faza: 'T16-30 balans', ratio: r.ratio, ...st });
      const cnt = st.przewagaN + st.slabszyN;
      if (t === 16) lastCount = cnt;
      if (t === 30) {
        assert(`T16-30: balans/utrzymanie bez nowych zdarzen (liczba wpisow ${cnt}, bazowo ${lastCount})`, cnt === lastCount, st);
      }
    }
    out.finalTurn = turn;
    assert('tury 1-30: gra doszla do tury 30', turn >= 30, { turn });

    const errs = consoleErrors.filter(x => !/ResizeObserver/.test(x));
    assert('zero console.error / pageerror', errs.length === 0, errs.slice(0, 5));
    out.consoleErrors = consoleErrors.length;
  } finally {
    await browser.close();
  }
  console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
  if (RESULT_FILE) fs.writeFileSync(RESULT_FILE, JSON.stringify({ pass, fail, ...out }, null, 2));
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error('[respect-live] wyjatek:', e && e.stack || e); process.exit(1); });
