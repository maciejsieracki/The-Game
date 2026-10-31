'use strict';
/**
 * diplo-war-peace-live-test.cjs — R-WEB-PEACE-RULES-Q1 (runda 3, kryterium 9: żywa weryfikacja).
 *
 * Realny headless Chromium na prawdziwym bundle Vite (?playtest=mapa), zbudowanym do katalogu
 * tymczasowego poza repo (bez `npm run build`). Scenariusze steruje hak testowy
 * `window.__peaceRulesTestDebug` (main.ts) — WYŁĄCZNIE stan wejściowy; logikę wykonuje realny silnik:
 *  A1. Wojna gracz↔AI (turnsAtWar=5), AI silniejsza (rw ≥ 0.55), bez utraty miasta:
 *      REALNE evaluateProposal('pokoj') zwraca odmowę „AI czuje się silniejsze" (R5b).
 *      + DOM (zarzut 1 Evaluatora r3): ścieżka WYSŁANIA z ekranu negocjacji (handleNegotiatedProposal →
 *      handleNegotiationAccept, ten sam handler co przycisk „Przyjmij w Punkty wymiany") pokazuje w
 *      #civ-hint-toast „Nie można wysłać — AI czuje się silniejsze…"; zrzut z tym komunikatem.
 *  A2. Ta sama para, turnsAtWar=10 (poza oknem R5b, <10 nie spełnione): odmowa „silniejsze"
 *      NIE występuje (dowód, że bramka jest wiekowa, a nie stała) — także w DOM.
 *  B1. Hamulec wojny (D2/R7): para gracz↔AI bez wojny, ŁĄCZNA Relacja ≤ próg, licznik tuż przed
 *      ostrzeżeniem, AI silniejsza (mayDeclare) → REALNY endTurn → w DOM (#civ-hint-toast)
 *      widoczne „Ryzyko wojny z …: N tur do wypowiedzenia (łączna Relacja ≤ P)".
 *      Wiring (zarzut 3 Evaluatora r3): prog = 15 i N = 6 (profil grecy: progWojnyRelacji 30 − 15, hamulecN 6),
 *      tekst dokładny „Ryzyko wojny z Grecy: 2 tur do wypowiedzenia (łączna Relacja ≤ 15)".
 *  B2. D7: ten sam scenariusz, ale GRACZ silniejszy → ostrzeżenie NIE pojawia się.
 *  C.  Zero pageerror / console.error w całym scenariuszu.
 * Zrzuty: dyspozycje/autobot/runs/R-WEB-PEACE-RULES-Q1/evidence/
 *
 * Usage (z gra/): node tools/diplo-war-peace-live-test.cjs [outDirAbs] [evidenceDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-peace-live-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-PEACE-RULES-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const PLAYER = 0;
const AI_WAR = 2;     // AI w wojnie z graczem (scenariusz A)
const AI_BRAKE = 1;   // AI z miastami (jedyna aktywna w mapa-playtest), bez wojny po setRelationForBrake
const BRAKE_REL = 0;  // Zaufanie = Respekt = 0 → łączna Relacja 0 ≤ próg hamulca

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Czeka, aż endTurn (asynchroniczny) zakończy turę: tura +1 i brak endTurnInProgress. */
async function waitTurnDone(page, turnBefore) {
  await page.waitForFunction(
    (t) => window.__eraTestDebug.getWorldState().turn === t + 1 && !window.__eraTestDebug.isEndTurnInProgress(),
    turnBefore,
    { timeout: 180000 },
  ).catch(() => null);
  await wait(500);
}

function buildBundle() {
  console.log('[peace-live] vite build do katalogu tymczasowego:', SCRATCH);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
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
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__peaceRulesTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  await wait(300);
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[peace-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  // Każdy scenariusz na świeżej stronie: po jednym realnym endTurn gra blokuje kolejne (bitwa w kolejce).
  async function openFresh() {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
    await gotoPlaytestMapa(page);
    return page;
  }
  const dOn = (page) => (fn, ...args) => page.evaluate(([name, a]) => window.__peaceRulesTestDebug[name](...a), [fn, args]);

  try {
    // ---- A: odmowa pokoju „AI czuje się silniejsze" (realny evaluateProposal) ----
    const pageA = await openFresh();
    const d = dOn(pageA);
    const page = pageA;
    console.log('[peace-live] A: odmowa pokoju przez silniejszą AI');
    await page.evaluate(() => window.__peaceRulesTestDebug.setPlayerWarWithAi(2, 5));
    await page.evaluate(() => window.__peaceRulesTestDebug.setAiPowerBonusForTest(2, 20000));
    const powersA = await d('getPowers', AI_WAR);
    const warA = await d('getWarTurns', AI_WAR);
    const evA1 = await d('evaluatePeaceFromPlayer', AI_WAR);
    const sendA1 = await page.evaluate(() => window.__peaceRulesTestDebug.sendPeaceProposalForTest(2));
    await wait(200);
    const hintA1 = await page.evaluate(() => {
      const t = document.getElementById('civ-hint-toast');
      return { shown: !!t && t.style.display !== 'none', text: t ? (t.textContent || '') : '' };
    });
    await page.screenshot({ path: path.join(EVIDENCE, 'live-A-odmowa-pokoju-komunikat.png') });
    console.log('      wysłanie z ekranu negocjacji:', JSON.stringify(sendA1), 'komunikat DOM:', JSON.stringify(hintA1));
    console.log('      powers', JSON.stringify(powersA), 'war', JSON.stringify(warA), 'eval', JSON.stringify(evA1));
    assert('A1 AI silniejsza: rw ≥ 0.55', evA1.rw !== null && evA1.rw >= 0.55, evA1);
    assert('A1 pokój odrzucony', evA1.accepted === false, evA1);
    assert('A1 powód „AI czuje się silniejsze"', typeof evA1.reason === 'string' && evA1.reason.includes('czuje się silniejsze'), evA1);
    assert('A1 brak utraconego miasta', warA.lostCities === 0, warA);
    assert('A1 DOM: wpis pokoju wysłany realnym handlerem negocjacji', sendA1.entryFound === true, sendA1);
    assert('A1 DOM: #civ-hint-toast widoczny z odmową „Nie można wysłać — … czuje się silniejsze"',
      hintA1.shown && /Nie można wysłać — .*czuje się silniejsze/.test(hintA1.text), hintA1);

    await page.evaluate(() => window.__peaceRulesTestDebug.setPlayerWarWithAi(2, 10));
    const evA2 = await d('evaluatePeaceFromPlayer', AI_WAR);
    const warA2 = await d('getWarTurns', AI_WAR);
    console.log('      po 10 turach eval', JSON.stringify(evA2), 'war', JSON.stringify(warA2));
    assert('A2 po 10 turach odmowa „silniejsze" nieobowiązuje', !(evA2.reason || '').includes('czuje się silniejsze'), evA2);
    await page.evaluate(() => {
      const t = document.getElementById('civ-hint-toast');
      if (t) { t.textContent = ''; t.style.display = 'none'; }
    });
    const sendA2 = await page.evaluate(() => window.__peaceRulesTestDebug.sendPeaceProposalForTest(2));
    await wait(200);
    const hintA2 = await page.evaluate(() => {
      const t = document.getElementById('civ-hint-toast');
      return { shown: !!t && t.style.display !== 'none', text: t ? (t.textContent || '') : '' };
    });
    assert('A2 DOM: po 10 turach komunikat „czuje się silniejsze" NIE pojawia się na ekranie',
      sendA2.entryFound === true && !hintA2.text.includes('czuje się silniejsze'), { sendA2, hintA2 });

    await page.evaluate(() => window.__peaceRulesTestDebug.setPlayerWarWithAi(2, 5));
    const evA3 = await d('evaluatePeaceFromPlayer', AI_WAR);
    console.log('      stan po przywróceniu 5 tur wojny:', evA3.reason);
    await pageA.close();

    // ---- B: hamulec wojny — ostrzeżenie gdy AI silniejsza; brak gdy gracz silniejszy (D7) ----
    const pageB1 = await openFresh();
    const dB1 = dOn(pageB1);
    console.log('[peace-live] B1: hamulec, AI silniejsza → ostrzeżenie w DOM');
    const brake = await dB1('getBrakeParams', AI_BRAKE);
    const warnAt = brake.n - 2;
    await pageB1.evaluate(([a, w]) => {
      window.__peaceRulesTestDebug.setRelationForBrake(a, 0, 0);
      window.__peaceRulesTestDebug.setAiPowerBonusForTest(a, 20000);
      window.__peaceRulesTestDebug.setCrisisCounter(a, w - 1);
    }, [AI_BRAKE, warnAt]);
    const relB1 = await dB1('getRelationTotal', AI_BRAKE);
    console.log('      próg hamulca', JSON.stringify(brake), 'warnAt', warnAt, 'łączna Relacja', relB1);
    const turnB1Before = (await pageB1.evaluate(() => window.__eraTestDebug.getWorldState().turn));
    await pageB1.evaluate(() => window.__eraTestDebug.endTurn());
    await waitTurnDone(pageB1, turnB1Before);
    const turnB1After = (await pageB1.evaluate(() => window.__eraTestDebug.getWorldState().turn));
    const counterB1 = await dB1('getCrisisCounter', AI_BRAKE);
    const logB1 = await dB1('warEventLogHas', 'Ryzyko wojny z');
    await wait(800);
    // Domyślnie chip „🌍 Inne cyw." jest OFF i ukrywa wpis hamulca (patrz ustalenia w raporcie).
    // Test włącza ten sam chip, którym gracz może to zobaczyć, i sprawdza widoczność w DOM.
    const chipClicked = await pageB1.locator('.civ-side-panel').getByText('Inne cyw.', { exact: false }).first().click({ timeout: 5000 }).then(() => true).catch((e) => String(e.message).slice(0, 120));
    await wait(400);
    const domB1 = await pageB1.evaluate(() => {
      const sp = document.querySelector('.civ-side-panel');
      return { panel: !!sp, hit: !!sp && (sp.textContent || '').includes('Ryzyko wojny z'), n: sp ? sp.querySelectorAll('.sp-event').length : 0, txt: sp ? (sp.textContent || '').slice(0, 400) : '', cls: sp ? sp.className : '' };
    });
    await pageB1.screenshot({ path: path.join(EVIDENCE, 'live-B1-ostrzezenie-hamulca.png') });
    console.log('      chip „Inne cyw." kliknięty:', chipClicked);
    console.log('      counter', counterB1, 'tura', turnB1Before, '->', turnB1After, 'dziennik', JSON.stringify(logB1), 'DOM innerText', domB1);
    assert('B1 tura się przelicza (endTurn wykonany)', turnB1After === turnB1Before + 1, { turnB1Before, turnB1After });
    assert('B1 licznik dobił do progu ostrzeżenia realnym tickiem', counterB1 >= warnAt, { counterB1, warnAt });
    assert('B1 ostrzeżenie widoczne w panelu wydarzeń (DOM, po włączeniu chipu „Inne cyw.")', domB1.hit, domB1);
    assert('B1 ostrzeżenie „Ryzyko wojny z …" w dzienniku wydarzeń (realny endTurn)',
      logB1.found && /Ryzyko wojny z .*tur do wypowiedzenia.*łączna Relacja ≤/.test(logB1.texts.join(' ')), logB1);
    assert('B1 wiring hamulca: prog = 15 i N = 6 (profil grecy) + tekst dokładny w DOM',
      brake.prog === 15 && brake.n === 6 && (domB1.txt || '').includes('Ryzyko wojny z Grecy: 2 tur do wypowiedzenia (łączna Relacja ≤ 15)'),
      { brake, dom: (domB1.txt || '').slice(0, 200) });
    await pageB1.close();

    console.log('[peace-live] B2 (D7): gracz silniejszy → brak ostrzeżenia');
    const pageB2 = await openFresh();
    const dB2 = dOn(pageB2);
    const AI_D7 = AI_BRAKE;
    await pageB2.evaluate(([a, w]) => {
      window.__peaceRulesTestDebug.setRelationForBrake(a, 0, 0);
      window.__peaceRulesTestDebug.setCrisisCounter(a, w - 1);
    }, [AI_D7, warnAt]);
    const powersB2 = await dB2('getPowers', AI_D7);
    const turnB2Before = (await pageB2.evaluate(() => window.__eraTestDebug.getWorldState().turn));
    await pageB2.evaluate(() => window.__eraTestDebug.endTurn());
    await waitTurnDone(pageB2, turnB2Before);
    const turnB2After = (await pageB2.evaluate(() => window.__eraTestDebug.getWorldState().turn));
    const counterB2 = await dB2('getCrisisCounter', AI_D7);
    const logB2 = await dB2('warEventLogHas', 'Ryzyko wojny');
    console.log('      powers', JSON.stringify(powersB2), 'counter', counterB2, 'tura', turnB2Before, '->', turnB2After, 'dziennik', JSON.stringify(logB2));
    assert('B2 tura się przelicza (endTurn wykonany)', turnB2After === turnB2Before + 1, { turnB2Before, turnB2After });
    assert('B2 licznik dobił do progu ostrzeżenia (tick działał, bez wpływu mocy)', counterB2 >= warnAt, { counterB2, warnAt });
    assert('B2 gracz silniejszy: brak „Ryzyko wojny" w dzienniku (D7)', !logB2.found, logB2);
    await pageB2.close();

    assert('C zero pageerror / console.error', errors.length === 0, errors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log(`diplo-war-peace-live-test: ${pass} pass / ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('diplo-war-peace-live-test: CRASH', e);
  process.exit(1);
});
