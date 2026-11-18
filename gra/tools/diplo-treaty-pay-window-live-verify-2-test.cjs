'use strict';
/**
 * diplo-treaty-pay-window-live-verify-2-test.cjs -- R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1 (r3, cel (a)).
 * ŻYWY render wiersza „Dopłata traktatu" (D) w oknie audiencji (realny Chromium, bundle Vite, ?playtest=mapa&civTest=1).
 *
 * Ścieżka: oferta AI -> gracz (przemarsz 'granice', AI silniejsza 1,3x => płatnik = gracz) wystawiana na stół REALNĄ
 * funkcją createNegotiation (hak civTest __truceTestDebug.pushNegotiationForTest + opcjonalny payload) -> okno audiencji
 * (openAudience) -> pasek bilansu `.da-pn-balance-bar` -> tooltip środkowej komórki (wiersz D żyje w tooltipie z zasady
 * „najważniejsze na wierzchu"; natywny `title` NIE jest rysowany w zrzucie headless, więc dowodem jest DOM + zrzut okna).
 * Akceptacja = REALNY klik „Przyjmij" (data-negot-act=accept-package) w oknie.
 *
 * Asercje na przypadek:
 *  i)   wiersz D istnieje w oknie (paska bilansu z data-negot-id);
 *  ii)  polskie nazwy pozycji (złoto / brąz / technologia ...), brak surowych ID (City\d+, zloto, braz, ruda_zelaza, negot-);
 *  iii) wartość w wierszu == faktyczny przelew po akceptacji (skarbiec/zasoby gracza przed i po; odbiorca zyskuje to samo);
 *  iv)  (f-DOM) stosunek sił r odczytany z tooltipu okna ≈ 1,3 (±0,05);
 *  v)   zero pageerror / console.error.
 * Mutacja (poza tym plikiem): kopia źródła diplomacyAcceptanceBalance.ts z usuniętym wierszem D -> inny bundle -> ten test
 * musi zczerwienieć (patrz raport; źródło przywracane z kopii + cmp).
 *
 * Usage (z gra/): node ./node_modules/vite/bin/vite.js build --outDir <scratchAbs> --emptyOutDir
 *                 SKIP_BUILD=1 node tools/diplo-treaty-pay-window-live-verify-2-test.cjs <scratchAbs> [shotDir]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-pay-window-live-' + process.pid);
const SHOT_DIR = process.argv[3] || '';
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa&civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const R_TARGET = 1.3;
const STAGE_KEY = { 'złoto': 'zloto', 'brąz': 'braz', 'żelazo': 'zelazo', 'ruda miedzi': 'ruda', 'ruda cyny': 'ruda_cyny', 'ruda żelaza': 'ruda_zelaza' };

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else {
    fail++;
    console.log(`  FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail).slice(0, 700) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) return;
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe' });
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
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
    () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__cityCessionTestDebug
      && window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1
      && typeof window.__truceTestDebug.pushNegotiationForTest === 'function',
    undefined, { timeout: 900000 },
  );
  await wait(300);
}

/** Parsuje „606 złoto, technologia Murarstwo" -> [{qty,key} | {tech}] */
function parseLabel(label) {
  return label.split(', ').map((p) => {
    const t = /^technologia (.+)$/.exec(p);
    if (t) return { tech: t[1] };
    const m = /^(\d+) (.+)$/.exec(p);
    if (!m) return { raw: p };
    return { qty: Number(m[1]), name: m[2], key: STAGE_KEY[m[2]] };
  });
}

async function runCase(chromium, c, ordinal) {
  console.log(`\n[${c.name}] AI→gracz, przemarsz (płatnik: gracz), okno audiencji`);
  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    const AI = (await page.evaluate(() => window.__peaceRulesTestDebug.listAiOwnerIds()))[0];
    // Siła: AI/gracz = 1,3 (składnik zdobyczy ma nachylenie 2 => bonus = (r·gracz − ai)/2); Relacja 200/200 (bramka Respektu).
    await page.evaluate(([aiId, r]) => {
      const d = window.__peaceRulesTestDebug;
      d.setAiPowerBonusForTest(aiId, 0);
      const pw0 = d.getPowers(aiId);
      d.setAiPowerBonusForTest(aiId, Math.max(0, Math.round((r * pw0.player - pw0.ai) / 2)));
      d.setRelationForBrake(aiId, 200, 200);
    }, [AI, R_TARGET]);
    await page.evaluate(([aiId, h, pt, at]) => {
      window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(0, h, pt);
      window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(aiId, { zloto: 5000000, braz: 50000, zelazo: 50000, ruda: 50000 }, at);
    }, [AI, c.hold, c.playerTechs, c.aiTechs]);
    const before = await page.evaluate(([aiId]) => ({
      p: window.__cityCessionTestDebug.treatyPayHoldingsForTest(0),
      a: window.__cityCessionTestDebug.treatyPayHoldingsForTest(aiId),
    }), [AI]);

    const negId = await page.evaluate(([aiId]) => window.__truceTestDebug.pushNegotiationForTest('granice', aiId, 0, 0, null, null, { borderMilitary: true }), [AI]);
    await page.evaluate(([aiId]) => window.__truceTestDebug.openAudience(aiId), [AI]);
    await page.waitForSelector(`.da-pn-balance-bar[data-negot-id="${negId}"]`, { timeout: 20000 }).catch(() => {});
    await wait(500);

    const win = await page.evaluate((id) => {
      const bar = document.querySelector(`.da-pn-balance-bar[data-negot-id="${id}"]`);
      if (!bar) return { bar: false };
      const nums = Array.from(bar.querySelectorAll('.da-pn-bal-num')).map((n) => n.getAttribute('title') || '');
      const tip = nums.join('\n');
      const accept = document.querySelector('[data-negot-act="accept-package"]');
      return { bar: true, tip, deal: (bar.querySelector('.da-pn-bal-deal') || {}).textContent || '', accept: !!accept, acceptDisabled: accept ? accept.disabled : null };
    }, negId);
    assert(`${c.name} i: pasek bilansu oferty w oknie audiencji + wiersz D w tooltipie`, win.bar === true && /Dopłata traktatu:/.test(win.tip || ''), { bar: win.bar, deal: win.deal });
    if (!win.bar || !/Dopłata traktatu:/.test(win.tip || '')) { console.log('  tip:', (win.tip || '').slice(0, 400)); await browser.close(); return errors; }
    const rowM = /Dopłata traktatu: (.+?) \(pokrywa ([\d\s .,]+) PN; oddane razem z zawarciem traktatu\)/.exec(win.tip);
    assert(`${c.name} i2: wiersz D ma pełną formę „… (pokrywa N PN; oddane razem z zawarciem traktatu)"`, !!rowM, win.tip.slice(0, 500));
    if (!rowM) { await browser.close(); return errors; }
    const rowText = rowM[0];
    const items = parseLabel(rowM[1]);
    console.log('  WIERSZ D:', rowText);
    console.log('  okno: akcja =', win.deal, '| Przyjmij dostępne =', win.accept && !win.acceptDisabled);

    // ii) polskie nazwy, brak surowych ID
    const rawIds = /City\d+|\b(zloto|braz|zelazo|ruda_cyny|ruda_zelaza)\b|negot-|undefined|\[object/.test(rowText);
    assert(`${c.name} ii: brak surowych ID w wierszu D`, !rawIds, rowText);
    const known = items.every((i) => i.tech || (i.key && i.qty > 0));
    assert(`${c.name} ii2: każda pozycja ma polską nazwę ze słownika (złoto/brąz/żelazo/ruda…/technologia …)`, known, items);
    for (const w of c.expectWords) assert(`${c.name} ii3: wiersz zawiera „${w}"`, rowText.includes(w), rowText);

    // iv) f-DOM
    const rM = /r = ([\d,]+)/.exec(win.tip);
    const rDom = rM ? Number(rM[1].replace(',', '.')) : NaN;
    assert(`${c.name} iv: r z tooltipu okna ≈ ${R_TARGET} (±0,05)`, Math.abs(rDom - R_TARGET) <= 0.05, { rDom });

    // zrzut okna (przed akceptacją)
    if (SHOT_DIR) {
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(SHOT_DIR, `pay-window-D-case${ordinal}.png`) });
    }

    // iii) akceptacja REALNYM klikiem + stan po
    // Przycisk Przyjmij MUSI być aktywny; brak => FAIL (bez cichego przejścia na hak — to osłabiałoby dowód).
    assert(`${c.name} iii0: przycisk Przyjmij aktywny w oknie (akceptacja realnym klikiem)`, win.accept === true && win.acceptDisabled === false, { accept: win.accept, acceptDisabled: win.acceptDisabled });
    if (win.accept && !win.acceptDisabled) {
      await page.click('[data-negot-act="accept-package"]');
      await wait(800);
    }
    const after = await page.evaluate(([aiId]) => ({
      p: window.__cityCessionTestDebug.treatyPayHoldingsForTest(0),
      a: window.__cityCessionTestDebug.treatyPayHoldingsForTest(aiId),
      table: window.__truceTestDebug.tableSummaryForTest(),
    }), [AI]);
    let l = true;
    const detail = [];
    for (const it of items) {
      if (it.tech) {
        const got = after.a.techs.includes(it.tech) && !before.a.techs.includes(it.tech);
        const gone = before.p.techs.includes(it.tech);
        detail.push({ tech: it.tech, aiGot: got, playerHadIt: gone });
        if (!got || !gone) l = false;
        continue;
      }
      const dp = (before.p.holdings[it.key] ?? 0) - (after.p.holdings[it.key] ?? 0);
      const dr = (after.a.holdings[it.key] ?? 0) - (before.a.holdings[it.key] ?? 0);
      detail.push({ key: it.key, wiersz: it.qty, platnikMinus: dp, odbiorcaPlus: dr });
      if (dp !== it.qty || dr !== it.qty) l = false;
      if ((after.p.holdings[it.key] ?? 0) < 0) l = false;
    }
    console.log('  PRZELEW:', JSON.stringify(detail));
    assert(`${c.name} iii: wartość w wierszu D == faktyczny przelew po akceptacji (płatnik −, odbiorca +)`, l, detail);
    assert(`${c.name} iii2: oferta zeszła ze stołu po akceptacji`, !after.table.some((e) => e.id === negId), after.table);
  } finally {
    await browser.close();
  }
  return errors;
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { console.error('playwright nie znaleziony'); process.exit(1); }
  buildBundle();
  const cases = [
    { name: 'W-A złoto', hold: { zloto: 30000, braz: 0, zelazo: 0, ruda: 0 }, playerTechs: [], aiTechs: [], expectWords: ['złoto'] },
    { name: 'W-B złoto 100 + brąz', hold: { zloto: 100, braz: 20000, zelazo: 0, ruda: 0 }, playerTechs: [], aiTechs: [], expectWords: ['złoto', 'brąz'] },
    { name: 'W-C technologia + złoto', hold: { zloto: 30000, braz: 0, zelazo: 0, ruda: 0 }, playerTechs: ['Rolnictwo', 'Murarstwo', 'Obróbka drewna'], aiTechs: ['Rolnictwo'], expectWords: ['technologia'] },
  ];
  const allErrors = [];
  let n = 0;
  for (const c of cases) { n++; allErrors.push(...await runCase(chromium, c, n)); }
  assert('v: zero pageerror / console.error', allErrors.length === 0, allErrors.slice(0, 5));
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('wyjątek:', e && e.stack || e); process.exit(1); });
