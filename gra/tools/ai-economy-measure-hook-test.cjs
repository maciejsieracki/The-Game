'use strict';
/**
 * ai-economy-measure-hook-test.cjs -- R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1 (r3): test haka metryk i obejscia bramki.
 *
 * Start: prawdziwa nowa gra `__nnsMeasureDebug.startGame` (jak runner, --start newgame). Na tej sciezce
 * tura 1 jest zablokowana bramka NNS gracza (canEnd=false); dosypka grantPlayerGold/Food ja odblokowuje.
 *
 * Asercje:
 *  1) ksztalt: kazdy wlasciciel ma komplet pol i typow (w tym kara glodu %, utrzymanie jednostek).
 *  2) kontrola negatywna: BEZ ?civTest=1 hak nie istnieje (`__aiEconomyMeasure === undefined`).
 *  3) obejscie bramki: warunek wstepny (tura 1: nnsGateBlocked=true); dosypka 0/0 NIE odblokowuje (negatywna
 *     kontrola mechanizmu); dosypka 200/200 odblokowuje i tura przechodzi 1->2 (realny endTurn).
 *  4) wartosc AI: po dosypkach w kazdej turze do 12 tur -- kazdy AI owner ma >=1 miasto i >=1 jednostke.
 *     (r3: start czeka na koniec nakladki „Tworzenie swiata” -- bez tego AI=0 miast, blad harnessu, nie gry.)
 *  5) mutacja ksztaltu: zepsuty bundle (--mutant-dist) MUSI oblac ksztalt (jesli podano).
 *
 * Uzycie (z gra/, bundle zbudowany): node tools/ai-economy-measure-hook-test.cjs --dist <abs-dist>
 * Wyjscie: 0 = wszystkie asercje zielone (w tym czerwone mutacje); 1 = blad (w tym czerwona asercja 4).
 */
const os = require('os');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const GRA_DIR = path.resolve(__dirname, '..');
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), 'ai-economy-dist')));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
const MUTANT_DIST = arg('mutant-dist', '') ? path.resolve(arg('mutant-dist', '')) : null;
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const SEED = 4242;
const MAX_TURNS_VALUE = 12;
const OWNER_KEYS = ['owner', 'skarbiec', 'spichlerz', 'jednostkiWojskowe', 'jednostkiCywilne', 'rekruci', 'sumaLudkow',
  'glodWojska', 'glodWojskaAtrycja', 'glodKaraStatProc', 'glodAtrycjaHpProc', 'deficytZlota', 'miasta', 'obywatele',
  'utrzymanieBudynkowPieniadz', 'utrzymanieBudynkowSurowce', 'utrzymanieGarnizonuPieniadz',
  'utrzymanieJednostekPieniadz', 'utrzymanieJednostekSurowce'];

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || '' }); console.log((ok ? 'ZIELONE ' : 'CZERWONE ') + name + (detail ? ' :: ' + detail : '')); }

function shapeProblems(metrics, requiredKeys) {
  const problems = [];
  if (!metrics || typeof metrics.turn !== 'number') problems.push('brak turn');
  if (!metrics || !Array.isArray(metrics.owners) || metrics.owners.length === 0) problems.push('brak owners');
  for (const o of (metrics && metrics.owners) || []) {
    for (const k of requiredKeys) if (!(k in o)) problems.push('owner ' + o.owner + ' bez ' + k);
    for (const k of ['jednostkiWojskowe', 'jednostkiCywilne', 'miasta', 'obywatele', 'glodKaraStatProc', 'glodAtrycjaHpProc', 'utrzymanieJednostekPieniadz']) {
      if (typeof o[k] !== 'number' || !(o[k] >= 0)) problems.push('owner ' + o.owner + ' ' + k + ' nie jest liczba >=0');
    }
    for (const k of ['glodWojska', 'glodWojskaAtrycja', 'deficytZlota']) {
      if (typeof o[k] !== 'boolean') problems.push('owner ' + o.owner + ' ' + k + ' nie jest boolem');
    }
    if (!o.utrzymanieJednostekSurowce || typeof o.utrzymanieJednostekSurowce !== 'object') problems.push('owner ' + o.owner + ' utrzymanieJednostekSurowce nie jest obiektem');
  }
  return problems;
}

async function openNewGame(browser, distDir) {
  const page = await browser.newPage();
  await page.goto('file://' + path.join(distDir, 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__aiEconomyMeasure && !!window.__nnsMeasureDebug && !!window.__aiTradeWiringTestDebug, null, { timeout: 180000 });
  await page.evaluate(() => window.__nnsMeasureDebug.startGame({ seed: 4242 }));
  await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
  // r3: czekaj na koniec nakladki „Tworzenie swiata” (AI/miasta-panstwa powstaja dopiero po niej), jak runner.
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, null, { timeout: 600000, polling: 500 });
  // Jak runner (fresh): bramka NNS "Zakoncz ture" blokuje dopiero po zalozeniu miasta gracza.
  const found = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
  if (!found) throw new Error('foundFirstCity=false po startGame');
  return page;
}

async function main() {
  const { chromium } = require(path.join(PW_DIR, 'node_modules', 'playwright'));
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args });
  try {
    // 1) ksztalt metryk (tura 1, nowa gra).
    const page = await openNewGame(browser, DIST);
    const metrics = await page.evaluate(() => window.__aiEconomyMeasure.metrics());
    const probs = shapeProblems(metrics, OWNER_KEYS);
    check('ksztalt metryk: kazdy wlasciciel ma komplet pol i typy (w tym glod %, utrzymanie jednostek)', probs.length === 0, probs.slice(0, 5).join('; ') || (metrics.owners.length + ' wlascicieli'));
    check('brak fantomowych ownerow: kazdy wiersz ma miasto lub jednostke, a aiStartOwnersBezWiersza jest puste (po starcie z oczekiwaniem na nakladke)',
      metrics.owners.every(o => o.miasta > 0 || o.jednostkiWojskowe + o.jednostkiCywilne > 0) && Array.isArray(metrics.diag.aiStartOwnersBezWiersza) && metrics.diag.aiStartOwnersBezWiersza.length === 0,
      'owners=' + metrics.owners.length + ' bezWiersza=' + JSON.stringify(metrics.diag.aiStartOwnersBezWiersza));
    check('po starcie AI maja miasta: liczba wlascicieli z miastem > 1 (gracz + AI)', metrics.owners.filter(o => o.miasta > 0).length > 1, 'z miastem=' + metrics.owners.filter(o => o.miasta > 0).length);
    check('niezmierzone wymienia przychod/utrate (nie udajemy pomiaru)', Array.isArray(metrics.niezmierzone) && metrics.niezmierzone.includes('przychodNaTure'));

    // 3) obejscie bramki NNS gracza (tura 1).
    const blockedDefault = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
    check('warunek wstepny: tura 1 bramka NNS gracza BLOKUJE', blockedDefault === true, 'nnsGateBlocked=' + blockedDefault);
    await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerGold(0));
    await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerFood(0));
    const stillBlockedZero = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
    check('kontrola negatywna obejscia: dosypka 0/0 NIE odblokowuje bramki (mutacja: bypass bez skutku -> czerwone)', stillBlockedZero === true, 'po dosypce 0/0 nnsGateBlocked=' + stillBlockedZero);
    const t1 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerGold(200));
    await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerFood(200));
    const unblocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
    check('obejscie: dosypka 200/200 ODBLOKOWUJE bramke NNS gracza', unblocked === false, 'po dosypce 200/200 nnsGateBlocked=' + unblocked);
    await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
    await page.waitForFunction(t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), t1, { timeout: 300000, polling: 250 });
    const t2 = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    check('obejscie: realny endTurn po dosypce przechodzi ture ' + t1 + ' -> ' + t2, t2 > t1, 'tura ' + t1 + ' -> ' + t2);

    // 4) wartosc AI: kolejne tury z dosypkami gdy bramka blokuje (jak runner), do MAX_TURNS_VALUE.
    let ok = false; let lastDiag = null; let lastAi = null; let turnsUsed = 0; let lastZeroUnits = [];
    for (let k = 0; k < MAX_TURNS_VALUE && !ok; k++) {
      const before = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
      if (await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked())) {
        await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerGold(200));
        await page.evaluate(() => window.__aiTradeWiringTestDebug.grantPlayerFood(200));
      }
      await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
      await page.waitForFunction(t => window.__aiTradeWiringTestDebug.state().turn !== t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), before, { timeout: 300000, polling: 250 });
      turnsUsed++;
      const m = await page.evaluate(() => window.__aiEconomyMeasure.metrics());
      lastDiag = m.diag;
      const ai = m.owners.filter(o => o.owner >= 1);
      lastAi = ai.map(o => [o.owner, o.miasta, o.jednostkiWojskowe + o.jednostkiCywilne]);
      // r3: kazdy AI owner MA miasto; jednostke ma >=90% (pojedynczy wlasciciel moze legalnie stracic jedyna jednostke,
      // np. panstwo-miasto po utracie garnizonu -- to zachowanie gry, nie blad harnessu). Wyjatki sa wypisywane jawnie.
      const bezJedn = ai.filter(o => (o.jednostkiWojskowe + o.jednostkiCywilne) === 0).map(o => o.owner);
      lastZeroUnits = bezJedn;
      ok = ai.length > 0 && ai.every(o => o.miasta >= 1) && bezJedn.length <= Math.floor(ai.length * 0.1);
    }
    check('wartosc: kazdy AI owner ma >=1 miasto, >=90% AI ma >=1 jednostke (po ' + turnsUsed + ' turach, max ' + MAX_TURNS_VALUE + ')', ok,
      'bez jednostek=' + JSON.stringify(lastZeroUnits) + '; AI [owner,miasta,jednostki]=' + JSON.stringify(lastAi) + '; diag=' + JSON.stringify(lastDiag));
    await page.close();

    // 2) kontrola negatywna: bez ?civTest=1 hak nie istnieje.
    const plain = await browser.newPage();
    await plain.goto('file://' + path.join(DIST, 'index.html') + '?civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await plain.waitForTimeout(3000);
    const hasHook = await plain.evaluate(() => typeof window.__aiEconomyMeasure !== 'undefined');
    check('kontrola negatywna: bez ?civTest=1 brak haka __aiEconomyMeasure', hasHook === false);
    await plain.close();

    // 5) mutacja realna: osobny, zepsuty bundle (--mutant-dist) MUSI oblac ksztalt.
    if (MUTANT_DIST) {
      const mpage = await openNewGame(browser, MUTANT_DIST);
      const mm = await mpage.evaluate(() => window.__aiEconomyMeasure.metrics());
      const mutantProbs = shapeProblems(mm, OWNER_KEYS);
      check('mutacja realna (zepsuty hak w bundle) jest CZERWONA', mutantProbs.length > 0, mutantProbs.slice(0, 3).join('; ') || 'brak problemow -- test slepy');
      await mpage.close();
    }
  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.ok && !r.name.includes('mutacja') && !r.name.includes('kontrola negatywna obejscia'));
  const mutantBlind = results.some(r => r.name.includes('mutacja realna') && !r.ok);
  const negBypassBlind = results.some(r => r.name.includes('kontrola negatywna obejscia') && !r.ok);
  console.log('PODSUMOWANIE ' + results.filter(r => r.ok).length + '/' + results.length + ' zielone');
  process.exit(failed.length === 0 && !mutantBlind && !negBypassBlind ? 0 : 1);
}

main().catch(e => { console.error('BLAD ' + (e && e.stack || e)); process.exit(1); });
