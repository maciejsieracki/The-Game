'use strict';
/**
 * ai-ai-treaty-live-proof-breach-test.cjs — R-WEB-AI-AI-TREATIES-LIVE-PROOF-INERT-Q1, punkt (3): kara za zerwanie NAP AI↔AI.
 *
 * Żywy Chromium na bundle Vite (?playtest=mapa&civTest=1&civSeed=4242). Bundle budowany POZA repo
 * (argument SCRATCH). Pary AI (nie gracz):
 *   ON   (1,2): tor WŁĄCZONY (setAiAiTreatyTickEnabledForTest(true)), Zaufanie 60, Respekt 50  -> kara P-4 aktywna
 *   OFF  (3,4): tor WYŁĄCZONY, Zaufanie 60, Respekt 50                                         -> kontrola bez kary
 *   LOW  (5,6): tor WŁĄCZONY, Zaufanie 60, Respekt 20                                          -> przypadek Respekt<30
 * Każda para: NAP zawarty hakiem (ta sama końcówka co akceptacja ticku), potem REALNE declareWar.
 *
 * Asercje:
 *   A1  przed wojną: NAP obecny, status 'pokoj'
 *   A2  po wojnie: status 'wojna', NAP usunięty
 *   A3  Zaufanie: ON i OFF identyczne po wojnie (wojna zeruje Zaufanie 100 -> 0 w obu).
 *   A3b/A3c  −20 Zaufania z 'zlamana_obietnica_ai' izolowane z REJESTRU ZDARZEŃ pary (state.factors, delta zastosowana
 *       w breakTreatiesOnWar przed zerowaniem przez wojnę); ON i OFF mają tę samą karę −20 (flaga dotyczy tylko Respektu).
 *   A4  Respekt: różnica Δ(ON) − Δ(OFF) = −30 (zerwanie_relacja / mnoznikRespektu, mnoznik=1)
 *   A5  przypadek Respekt<30 (LOW): wynik w 0..100 i zgodny z clampem: clamp(20 + Δ(OFF) − 30)
 *   A6  zero pageerror / console.error w scenariuszu
 *
 * Usage (z gra/):  SKIP_BUILD=1 node tools/ai-ai-treaty-live-proof-breach-test.cjs <distAbs> <outJsonAbs> [--flag-off]
 *   (bez dodatkowych flag; mutacja = osobny bundle, patrz raport)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const DIST = process.argv[2];
const OUT_JSON = process.argv[3] || path.join(os.tmpdir(), 'breach-proof-' + process.pid + '.json');
const SEED = 4242;
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
  else { fail++; console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
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

async function main() {
  if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Brak bundle (index.html) w: ' + DIST);
  const { chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  const browser = await launchBrowser(chromium);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  const url = 'file://' + path.join(DIST, 'index.html') + `?playtest=mapa&civTest=1&civSeed=${SEED}`;
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__truceTestDebug && !!window.__truceTestDebug.aiAiNapLiveProof && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 600000, polling: 500 },
  );

  // R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1: limit wojen domyślnie ON w danych blokuje deklarację wojny w tym scenariuszu
  // (para 1-2 odmówiona przez warLimitAllowsDeclaration). Ten test dotyczy wyłącznie toru NAP (Zaufanie/Respekt),
  // więc limit wojen pinujemy jawnie OFF (hak testowy, nie zmiana danych); zachowanie limitu pokrywa diplomacy-war-limit-unit-test.
  await page.evaluate(() => window.__diploHarderMeasure.setWarLimitEnabled(false));
  const pairs = [
    { name: 'ON', a: 1, b: 2, flag: true, z: 100, r: 50 },
    { name: 'OFF', a: 3, b: 4, flag: false, z: 100, r: 50 },
    { name: 'LOW', a: 5, b: 6, flag: true, z: 100, r: 20 },
  ];
  const result = { seed: SEED, pairs: {} };

  for (const p of pairs) {
    await page.evaluate(({ a, b, z, r }) => {
      const h = window.__truceTestDebug.aiAiNapLiveProof;
      h.setRelation(a, b, z, r);
    }, p);
    await page.evaluate((flag) => window.__truceTestDebug.aiAiTreatyTickForTest.setEnabled(flag), p.flag);
    const napId = await page.evaluate(({ a, b }) => window.__truceTestDebug.aiAiNapLiveProof.concludeNap(a, b), p);
    const s0 = await page.evaluate(({ a, b }) => window.__truceTestDebug.aiAiNapLiveProof.state(a, b), p);
    await page.evaluate(({ a, b }) => window.__truceTestDebug.declareWar(a, b), p);
    const s1 = await page.evaluate(({ a, b }) => window.__truceTestDebug.aiAiNapLiveProof.state(a, b), p);
    result.pairs[p.name] = { ...p, napId, before: s0, after: s1,
      dZaufanie: s1.zaufanie - s0.zaufanie, dRespekt: s1.respekt - s0.respekt };
    console.log(`[${p.name}] ${JSON.stringify(result.pairs[p.name])}`);
  }
  await page.evaluate(() => window.__truceTestDebug.aiAiTreatyTickForTest.setEnabled(null));

  const on = result.pairs.ON; const off = result.pairs.OFF; const low = result.pairs.LOW;
  console.log('\nAsercje:');
  for (const k of ['ON', 'OFF', 'LOW']) {
    const q = result.pairs[k];
    assert(`A1 ${k}: przed wojną NAP i status 'pokoj'`, q.before.hasNap === true && q.before.status === 'pokoj', q.before);
    assert(`A2 ${k}: po wojnie status 'wojna', NAP usunięty`, q.after.status === 'wojna' && q.after.hasNap === false, q.after);
  }
  assert('A3 Zaufanie po wojnie identyczne ON i OFF (−20 NIE izolowane: wojna zeruje Zaufanie)',
    on.after.zaufanie === off.after.zaufanie, { on: on.dZaufanie, off: off.dZaufanie });
  // A3b: −20 Zaufania izolowane z rejestru zdarzeń pary (delta faktycznie zastosowana), nie z Zaufania po wojnie.
  const trustEv = (q) => (q.after.factors || []).filter(f => f.eventKey === 'zlamana_obietnica_ai' && f.tura === q.after.turn);
  assert('A3b ON: zdarzenie zlamana_obietnica_ai z deltą −20 w rejestrze pary', trustEv(on).some(f => f.delta === -20) && trustEv(on).length === 1,
    trustEv(on));
  // Zaufanie −20 jest istniejącą karą (breakTreatiesOnWar nalicza ją przy każdej wojnie, flaga dotyczy tylko Respektu):
  // kontrola OFF musi mieć TĘ SAMĄ deltę −20, a nie zero.
  assert('A3c OFF (kontrola): ta sama kara −20 zlamana_obietnica_ai (flaga nie zmienia Zaufania)', trustEv(off).length === 1 && trustEv(off).some(f => f.delta === -20),
    trustEv(off));
  const kara = on.dRespekt - off.dRespekt;
  assert('A4 Respekt: Δ(ON) − Δ(OFF) = −30 (zerwanie_relacja / mnoznikRespektu=1)', kara === -30, { kara, dON: on.dRespekt, dOFF: off.dRespekt });
  const expLow = Math.min(100, Math.max(0, low.before.respekt + off.dRespekt - 30));
  assert('A5 Respekt<30 (LOW): wynik zgodny z clampem 0..100',
    low.after.respekt === expLow && low.after.respekt < 30, { after: low.after.respekt, expected: expLow });
  assert('A6 zero pageerror / console.error', errors.length === 0, errors.slice(0, 5));

  result.asercje = { pass, fail, kara, errors: errors.length };
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
  console.log(`\nWynik: ${pass} OK / ${fail} FAIL  -> ${OUT_JSON}`);
  await browser.close();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('BLAD', e && e.stack || e); process.exit(2); });
