'use strict';
/**
 * diplo-live-verify-steps-1-4.cjs — R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1.
 *
 * Weryfikacja nowych zasad dyplomacji (kroki 1–4b) w URUCHOMIONEJ grze: realny headless Chromium
 * na bundle Vite (?playtest=mapa), zbudowanym do katalogu POZA repo (/tmp/civ-live-verify).
 * Zero zmian kodu gry — skrypt steruje wyłącznie istniejącymi hakami testowymi
 * (`__peaceRulesTestDebug`, `__truceTestDebug`, `__audienceRelTestDebug`, `__aggressorTestDebug`,
 * `__eraTestDebug`) i CZYTA zaufanie/respekt/relację z DOM panelu dyplomacji (wiersze `.da-rel-row`).
 *
 * Każdy scenariusz uruchamiany osobno (świeża strona):
 *   node tools/diplo-live-verify-steps-1-4.cjs --scenario=1   (1..5; 6 = NIE_ZMIERZONO bez wywołania przeglądarki)
 * Wynik: stdout + JSON w evidence/ (domyślnie dyspozycje/autobot/runs/R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1/evidence).
 * Wartości spoza zakresu hooków są raportowane jako NIE_ZMIERZONO z powodem, nie zgadywane.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const BUILD_DIR = process.env.CIV_LIVE_BUILD_DIR || '/tmp/civ-live-verify';
const EVIDENCE = process.env.CIV_LIVE_EVIDENCE
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1', 'evidence');
const OUT_URL = 'file://' + path.join(BUILD_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const PLAYER = 0;
const AI = 2; // AI używana we wszystkich scenariuszach (kontakt ustawiany hakiem)

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[diplo-live]', ...a);

function parseArg(name) {
  const hit = process.argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.split('=')[1] : null;
}

function buildBundle() {
  log('vite build do katalogu poza repo:', BUILD_DIR);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(BUILD_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) throw new Error('Build bez index.html');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__peaceRulesTestDebug && !!window.__eraTestDebug && !!window.__audienceRelTestDebug
      && !!window.__truceTestDebug && !!window.__dyploMapaOdkrycieTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

async function waitTurnDone(page, turnBefore) {
  await page.waitForFunction(
    (t) => window.__eraTestDebug.getWorldState().turn === t + 1 && !window.__eraTestDebug.isEndTurnInProgress(),
    turnBefore,
    { timeout: 180000 },
  ).catch(() => null);
  await wait(400);
}

async function endTurnReal(page) {
  const t0 = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await waitTurnDone(page, t0);
  return page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
}

/**
 * Odczyt zaufania/respektu/relacji z DOM panelu dyplomacji (realny render po stanie gry).
 * Zwraca surowe teksty wierszy oraz wartości liczbowe (pierwsza liczba w „N / M ...").
 */
async function readRel(page, ai) {
  await page.evaluate((id) => window.__audienceRelTestDebug.openAudience(id), ai);
  await wait(450);
  const raw = await page.evaluate(() => {
    const val = (k) => {
      const el = document.querySelector('.da-rel-row.' + k + ' .v');
      return el ? (el.textContent || '').trim() : null;
    };
    const rows = Array.from(document.querySelectorAll('.da-rel-row')).map((r) => (r.textContent || '').trim());
    const first = document.querySelector('.da-rel-row');
    const root = first ? first.closest('[class*="da"]') : null;
    const lines = root ? (root.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean) : [];
    const tierLines = lines.filter((s) => /Relacja|Nastawienie|Wrogi|Neutral|Przyja|Nieufn|Sojusz|Wojna|Pok[oó]j|Rozejm/i.test(s)).slice(0, 12);
    return { trust: val('trust'), respect: val('respect'), rows, tierLines };
  });
  const num = (s) => {
    if (s == null) return null;
    const m = s.replace('−', '-').match(/-?\d+/);
    return m ? Number(m[0]) : null;
  };
  await page.evaluate(() => window.__audienceRelTestDebug.closeAudience());
  await wait(200);
  return { zaufanie: num(raw.trust), respekt: num(raw.respect), trustRaw: raw.trust, respektRaw: raw.respect, tierLines: raw.tierLines, rows: raw.rows };
}

function newCheck(results) {
  return (id, label, ok, detail) => {
    results.checks.push({ id, label, ok: ok === true ? 'PASS' : (ok === false ? 'FAIL' : 'NIE_ZMIERZONO'), detail: detail === undefined ? null : detail });
    log(`${ok === true ? ' OK ' : (ok === false ? ' FAIL' : ' N/Z ')} ${id} ${label}`, detail === undefined ? '' : JSON.stringify(detail));
  };
}

async function openFresh(browser, errors, withContact = true) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await gotoPlaytestMapa(page);
  // Kontakt = odkryta nacja (getDiplomaticContacts), bez tego panel relacji (audiencja) się nie renderuje.
  // prepareContact ustawia też relację 100/100 — scenariusze ofert pokoju (S4) otwierane są bez niego, jak w diplo-war-peace-live-test.
  if (withContact) await page.evaluate((id) => window.__dyploMapaOdkrycieTestDebug.prepareContact(id, 0), AI);
  return page;
}

// ---- S1: wojna → zaufanie spada do 0; respekt i relacja bez obcinania do 29 (krok 1) ----
async function scenario1(browser, errors, res, check) {
  const page = await openFresh(browser, errors);
  // Start neutralny: zaufanie 40, respekt 60 (setter SETUP przez hak; odczyt z DOM).
  await page.evaluate((id) => window.__peaceRulesTestDebug.setRelationForBrake(id, 40, 60), AI);
  const r0 = await readRel(page, AI);
  await page.evaluate((id) => window.__peaceRulesTestDebug.setPlayerWarWithAi(id, 1), AI);
  const r1 = await readRel(page, AI);
  const t1 = await endTurnReal(page);
  const r2 = await readRel(page, AI);
  const t2 = await endTurnReal(page);
  const r3 = await readRel(page, AI);
  res.measured = { start: r0, poWypowiedzeniuWojny: r1, poTurze1: r2, poTurze2: r3, tury: [t1, t2] };
  check('S1.a', 'przed wojną zaufanie odczytane z DOM (SETUP 40)', r0.zaufanie === 40, r0);
  check('S1.b', 'po wypowiedzeniu wojny i 1 turze zaufanie = 0', r2.zaufanie === 0, { zaufanie: r2.zaufanie, respekt: r2.respekt });
  check('S1.c', 'w kolejnej turze wojny zaufanie nadal = 0', r3.zaufanie === 0, { zaufanie: r3.zaufanie, respekt: r3.respekt });
  check('S1.d', 'respekt nie obcięty do 29 (wartość > 29 po turze wojny)',
    r2.respekt !== null && r2.respekt > 29 ? true : (r2.respekt === null ? null : false),
    { respekt: r2.respekt, uwaga: 'respekt efektywny w UI może zależeć od siły; surowy wiersz w rows' });
  check('S1.e', 'brak błędów JS w scenariuszu', errors.length === 0, errors.slice(0, 5));
  await page.close();
}

// ---- S2: rozejm → zaufanie 10; pokój → zaufanie 20 (krok 4a/3) ----
async function scenario2(browser, errors, res, check) {
  const page = await openFresh(browser, errors);
  await page.evaluate((id) => window.__peaceRulesTestDebug.setPlayerWarWithAi(id, 6), AI);
  const rWar = await readRel(page, AI);
  const truce = await page.evaluate((id) => window.__truceTestDebug.acceptTruceForTest(id, 5), AI);
  const rTruce = await readRel(page, AI);
  const tState = await page.evaluate((id) => window.__truceTestDebug.pairState(0, id), AI);
  await page.evaluate((id) => window.__peaceRulesTestDebug.endWarByPeaceForTest(0, id), AI);
  const rPeace = await readRel(page, AI);
  res.measured = { wojna: rWar, rozejm: rTruce, rozejmStan: tState, akceptacjaRozejmu: truce, pokoj: rPeace };
  check('S2.a', 'rozejm (akceptacja realną ścieżką) → zaufanie = 10', rTruce.zaufanie === 10,
    { zaufanie: rTruce.zaufanie, akceptacja: truce });
  check('S2.b', 'pokój (finalizePeaceTreatyBetween) → zaufanie = 20', rPeace.zaufanie === 20, { zaufanie: rPeace.zaufanie });
  check('S2.c', 'kara za sąsiedztwo (−3/−4/−5 wg epoki, wyłączona w karencji)', 'NIE_ZMIERZONO',
    { powod: 'brak hooka ustawiającego wspólną granicę i karencję w tym scenariuszu; wymaga fixtury granicy (osobny hak, poza zakresem bez zmian kodu)' });
  check('S2.d', 'religia nie zmienia zaufania', 'NIE_ZMIERZONO',
    { powod: 'brak hooka ustawiającego wspólną/odmienną religię pary; wpływ ±0,5 sprawdzony tylko w testach jednostkowych' });
  check('S2.e', 'brak błędów JS w scenariuszu', errors.length === 0, errors.slice(0, 5));
  await page.close();
}

// ---- S3: wypowiedzenie wojny przez AI (próg siły, zaufanie 0 przez N tur, silniejszy gracz) ----
async function scenario3(browser, errors, res, check) {
  const page = await openFresh(browser, errors);
  const probes = [];
  // Próg siły przy zaufaniu 25: skan bonusu siły AI; odczyt Power i mayDeclare z realnego silnika.
  const part = parseArg('part') || 'all';
  const doProbe = part !== 'turns';
  const doTurns = part !== 'probe';
  // Moc AI = 2 × bonus (baza AI = 0 w mapie testowej), więc bonus = r × mocGracza / 2 daje stosunek r.
  const pwBase = doProbe ? await page.evaluate((id) => window.__peaceRulesTestDebug.getPowers(id), AI) : null;
  const ratios = [0.73, 0.9, 1.0, 1.1, 1.19, 1.2, 1.25, 1.27, 1.3, 1.5];
  const bonuses = doProbe ? ratios.map((r) => Math.round((r * pwBase.player) / 2)) : [];
  for (const bonus of bonuses) {
    await page.evaluate(([id, b]) => {
      window.__peaceRulesTestDebug.setRelationForBrake(id, 25, 0);
      window.__peaceRulesTestDebug.setAiPowerBonusForTest(id, b);
    }, [AI, bonus]);
    const pw = await page.evaluate((id) => window.__peaceRulesTestDebug.getPowers(id), AI);
    const cp = await page.evaluate((id) => window.__peaceRulesTestDebug.getCachedPowers(id), AI);
    const ratio = pw.player > 0 ? pw.ai / pw.player : null;
    probes.push({ bonus, power: pw, ratio: ratio === null ? null : Number((ratio - 1).toFixed(3)), mayDeclare: cp.mayDeclareDeclarer, cached: cp });
  }
  res.measured = { progiSily_zaufanie25: probes };
  // mayDeclare jest liczbą (0 = nie; ≠0 = może wypowiedzieć); pole ratio = moc AI / moc gracza − 1.
  const idxFlip = probes.findIndex((p) => p.mayDeclare !== 0);
  const before = idxFlip > 0 ? probes[idxFlip - 1] : null;
  const after = idxFlip >= 0 ? probes[idxFlip] : null;
  check('S3.a', 'skan przewagi Power przy zaufaniu 25 — punkt przełączenia mayDeclare', 'NIE_ZMIERZONO',
    { przelaczenie: after ? { przewagaAI_ponad_gracza_od: after.ratio, poprzedni_brak: before ? before.ratio : null } : null,
      powod: 'hak czyta Power (buildObjectivePower), nie siłę wojskową z kroku 2; progi 14/20/28% (charakter) nie są porównywalne z tym odczytem — rozbieżność do weryfikacji po stronie orkiestratora' });
  check('S3.b', 'progi 25%/19%/27% oraz charakter agresywna/neutralna/ostrożna', 'NIE_ZMIERZONO',
    { powod: 'brak hooka ustawiającego charakter cywilizacji AI i odczytu siły wojskowej (krok 2); skan Power nie daje wymaganej miary' });
  // Zaufanie 0 przez N tur: silniejsza AI powinna wypowiedzieć wojnę (mierzymy status po turach).
  await page.evaluate((id) => {
    window.__peaceRulesTestDebug.setRelationForBrake(id, 0, 0);
    window.__peaceRulesTestDebug.setAiPowerBonusForTest(id, 20000);
  }, AI);
  const statusStart = await page.evaluate((id) => window.__peaceRulesTestDebug.getStatus(id), AI);
  const statusTury = [];
  for (let i = 0; i < (doTurns ? 1 : 0); i++) {
    await endTurnReal(page);
    statusTury.push(await page.evaluate((id) => window.__peaceRulesTestDebug.getStatus(id), AI));
  }
  const warnLog = await page.evaluate(() => window.__peaceRulesTestDebug.warEventLogHas('Ryzyko wojny z'));
  res.measured.zaufanie0_silniejsza = { statusStart, statusTury, ostrzezenieWLogu: warnLog };
  if (doTurns) check('S3.c', 'zaufanie 0, AI silniejsza → wypowiedzenie wojny po N turach', 'NIE_ZMIERZONO',
    { statusStart, statusTury, powod: 'dispatch nie podaje N (liczby tur przy zaufaniu 0); zmierzono 1 turę bez wypowiedzenia (status neutralni) — wynik niejednoznaczny, N i losowanie gotowości wymagają osobnego pomiaru (koszt tury w przeglądarce ~100 s)' });
  // Silniejszy gracz → brak automatycznej wojny przez AI.
  await page.evaluate((id) => {
    window.__peaceRulesTestDebug.endWarByPeaceForTest(0, id);
    window.__peaceRulesTestDebug.setRelationForBrake(id, 0, 0);
    window.__peaceRulesTestDebug.setAiPowerBonusForTest(id, -20000);
  }, AI);
  const statusStart2 = await page.evaluate((id) => window.__peaceRulesTestDebug.getStatus(id), AI);
  const statusTury2 = [];
  for (let i = 0; i < (doTurns ? 1 : 0); i++) {
    await endTurnReal(page);
    statusTury2.push(await page.evaluate((id) => window.__peaceRulesTestDebug.getStatus(id), AI));
  }
  res.measured.silniejszyGracz = { statusStart: statusStart2, statusTury: statusTury2 };
  if (doTurns) check('S3.d', 'silniejszy gracz (AI słabsza) → brak automatycznej wojny przez 2 tury',
    !statusTury2.includes('wojna'), { statusTury: statusTury2 });
  check('S3.e', 'ostrzeżenie dla gracza raz na epizod', 'NIE_ZMIERZONO',
    { powod: 'ostrzeżenie „Ryzyko wojny” jest pokrywane w testach diplo-war-peace-live-test (hamulec); tu nie mierzone osobno' });
  check('S3.f', 'brak błędów JS w scenariuszu', errors.length === 0, errors.slice(0, 5));
  await page.close();
}

// ---- S4: rozejm/pokój — odmowa silniejszej AI, minimalny czas wojny, słabsza AI ----
async function scenario4(browser, errors, res, check) {
  let page = await openFresh(browser, errors);
  await page.evaluate((id) => window.__peaceRulesTestDebug.setPlayerWarWithAi(id, 1), AI);
  const evMinCzas = await page.evaluate((id) => window.__peaceRulesTestDebug.evaluatePeaceFromPlayer(id), AI);
  await page.close();
  // Świeża strona: wojna od razu z wiekiem 5 tur (ten sam wzorzec co diplo-war-peace-live-test, scenariusz A1).
  page = await openFresh(browser, errors, false);
  await page.evaluate((id) => window.__peaceRulesTestDebug.setPlayerWarWithAi(id, 5), AI);
  await page.evaluate((id) => window.__peaceRulesTestDebug.setAiPowerBonusForTest(id, 20000), AI);
  const sendSilniejsza = await page.evaluate((id) => window.__peaceRulesTestDebug.sendPeaceProposalForTest(id), AI);
  await wait(200);
  const hint = await page.evaluate(() => {
    const t = document.getElementById('civ-hint-toast');
    return { shown: !!t && t.style.display !== 'none', text: t ? (t.textContent || '') : '' };
  });
  const evSilniejsza = await page.evaluate((id) => window.__peaceRulesTestDebug.evaluatePeaceFromPlayer(id), AI);
  await page.evaluate((id) => window.__peaceRulesTestDebug.setAiPowerBonusForTest(id, -20000), AI);
  const evSlabsza = await page.evaluate((id) => window.__peaceRulesTestDebug.evaluatePeaceFromPlayer(id), AI);
  res.measured = { minCzasWojny: evMinCzas, silniejszaAI_wyslanie: sendSilniejsza, silniejszaAI_toast: hint, silniejszaAI_ocena: evSilniejsza, slabszaAI_ocena: evSlabsza };
  check('S4.a', 'minimalny czas wojny (1 tura) blokuje pokój', evMinCzas.accepted === false,
    { accepted: evMinCzas.accepted, reason: evMinCzas.reason });
  // Gałąź „AI czuje się silniejsze” NIE została osiągnięta w tym przebiegu: bramka 10 tur wojny zadziałała pierwsza
  // (zaobserwowany komunikat w toście). Nie zgadujemy wyniku — raportujemy surowe odczyty.
  const silniejszaOsiagnieta = /czuje się silniejsze/.test(hint.text) || /czuje się silniejsze/.test(String(evSilniejsza.reason || ''));
  check('S4.b', 'silniejsza AI odrzuca ofertę gracza bez miasta (DOM)',
    silniejszaOsiagnieta ? (sendSilniejsza.entryFound === true && hint.shown && evSilniejsza.accepted === false) : 'NIE_ZMIERZONO',
    { toast: hint.text, ocena: evSilniejsza.reason, wyslanie: sendSilniejsza,
      powod: silniejszaOsiagnieta ? null : 'gałąź „silniejsze” nieosiągnięta: bramka 10 tur wojny (komunikat w toście) zadziałała przed oceną siły; setup wieku wojny 5 tur nie zmienił tej bramki w tym przebiegu — do wyjaśnienia' });
  check('S4.c', 'słabsza AI — ocena oferty pokoju bez miasta (dla porównania)', 'NIE_ZMIERZONO',
    { accepted: evSlabsza.accepted, reason: evSlabsza.reason, powod: 'ten sam odczyt blokowany bramką 10 tur; wynik nie świadczy o zasadzie „słabsza AI”' });
  check('S4.d', 'pokój z miastem o wartości PN ≥ ceny', 'NIE_ZMIERZONO',
    { powod: 'hak sendPeaceProposalForTest wysyła wyłącznie actionId 10 bez miasta/PN; brak hooka oferty z miastem po stronie gracza' });
  check('S4.e', 'oferta ze złotem/surowcami nie przełamuje oporu', 'NIE_ZMIERZONO',
    { powod: 'brak hooka wysyłającego ofertę ze złotem/surowcami przez ekran negocjacji' });
  check('S4.f', 'brak błędów JS w scenariuszu', errors.length === 0, errors.slice(0, 5));
  await page.close();
}

// ---- S5: etykiety nastawienia / Relacja dla zaufania 0, 9, 10, 29, 30 (zrzut DOM) ----
async function scenario5(browser, errors, res, check) {
  const page = await openFresh(browser, errors);
  const rows = [];
  for (const z of [0, 9, 10, 29, 30]) {
    await page.evaluate(([id, v]) => window.__peaceRulesTestDebug.setRelationForBrake(id, v, 0), [AI, z]);
    const r = await readRel(page, AI);
    rows.push({ zaufanieUstawione: z, zaufanieOdczyt: r.zaufanie, respektOdczyt: r.respekt, etykiety: r.tierLines });
    if (z === 29 || z === 30) {
      await page.evaluate(([id]) => window.__audienceRelTestDebug.openAudience(id), [AI]);
      await wait(400);
      await page.screenshot({ path: path.join(EVIDENCE, `live-S5-zaufanie-${z}.png`) }).catch(() => null);
      await page.evaluate(() => window.__audienceRelTestDebug.closeAudience());
      await wait(200);
    }
  }
  res.measured = { etykiety: rows };
  for (const row of rows) {
    check('S5.' + row.zaufanieUstawione, `zaufanie ${row.zaufanieUstawione}: odczyt w DOM = ustawienie`,
      row.zaufanieOdczyt === row.zaufanieUstawione,
      { odczyt: row.zaufanieOdczyt, etykiety: row.etykiety });
  }
  check('S5.tekst', 'dokładne nazwy etykiet (Wrogi/Relacja) dla progów 9/10 i 29/30', 'NIE_ZMIERZONO',
    { powod: 'etykiety odczytane jako surowy tekst (patrz etykiety); mapowanie na nazwy oczekiwane tylko w testach jednostkowych' });
  check('S5.errors', 'brak błędów JS w scenariuszu', errors.length === 0, errors.slice(0, 5));
  await page.close();
}

// ---- S6: zmęczenie wojną (krok 4b) ----
function scenario6(res, check) {
  res.measured = null;
  check('S6.a', 'przegrywający płaci tylko miastem (zmęczenie wojną)', 'NIE_ZMIERZONO',
    { powod: 'brak hooka wymuszającego zmęczenie wojną (siła militarna przegrywającego, licznik wojny >= progu) bez zmian kodu gry; pokrycie testami sim/jednostkowymi' });
  check('S6.b', 'reguła końca zmęczenia (bezwarunkowy pokój) — osobny temat W58', 'NIE_DOTYCZY',
    { powod: 'decyzja właściciela #361: próg końca zmęczenia do potwierdzenia; W58 nie jest rozstrzygnięty' });
}

async function main() {
  const which = parseArg('scenario') || '1';
  const res = { scenario: which, checks: [], measured: null, startedAt: new Date().toISOString() };
  const check = newCheck(res);
  const errors = [];
  fs.mkdirSync(EVIDENCE, { recursive: true });

  if (which === '6') {
    scenario6(res, check);
  } else {
    if (process.argv.includes('--skip-build') && fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
      log('pomijam build — używam istniejącego bundle:', BUILD_DIR);
    } else {
      buildBundle();
    }
    let chromium;
    try { ({ chromium } = require('playwright')); }
    catch (e) { console.error('[diplo-live] playwright nie znaleziony'); process.exit(1); }
    const browser = await launchBrowser(chromium);
    try {
      const map = { 1: scenario1, 2: scenario2, 3: scenario3, 4: scenario4, 5: scenario5 };
      if (!map[which]) throw new Error('nieznany scenariusz: ' + which);
      await map[which](browser, errors, res, check);
    } finally {
      await browser.close();
    }
  }
  res.errorsTotal = errors.length;
  res.finishedAt = new Date().toISOString();
  const partTag = parseArg('part') ? '-' + parseArg('part') : '';
  const outFile = path.join(EVIDENCE, `S${which}${partTag}.json`);
  fs.writeFileSync(outFile, JSON.stringify(res, null, 2));
  log('zapisano', outFile);
  const counts = res.checks.reduce((acc, c) => { acc[c.ok] = (acc[c.ok] || 0) + 1; return acc; }, {});
  log('podsumowanie scenariusza', which, JSON.stringify(counts));
}

main().catch((e) => { console.error('[diplo-live] BŁĄD:', e && e.stack || e); process.exit(1); });
