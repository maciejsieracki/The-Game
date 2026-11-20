'use strict';
/**
 * ai-economy-measure-hook-test.cjs -- R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1 (r3) + R-WEB-HARNESS-CLOSE-DIPLO-AUDIENCE-Q1: test haka metryk i obejscia bramki.
 *
 * Start: prawdziwa nowa gra `__nnsMeasureDebug.startGame` (jak runner, --start newgame). Na tej sciezce
 * tura 1 jest zablokowana bramka NNS gracza (canEnd=false); dosypka grantPlayerGold/Food ja odblokowuje.
 *
 * Asercje:
 *  0) blokady modalne konca tury (bez gry, strona z atrapami DOM o tych samych klasach/id co gra): runner
 *     zamyka audiencje dyplomatyczna, panel laczenia armii i karte technologii przyciskiem i liczy kazde zamkniecie;
 *     bez otwartej blokady nic nie liczy. Uruchamiane zawsze, takze z --modal-only 1 (szybko, bez budowy gry).
 *  1) ksztalt: kazdy wlasciciel ma komplet pol i typow (w tym kara glodu %, utrzymanie jednostek).
 *  2) kontrola negatywna: BEZ ?civTest=1 hak nie istnieje (`__aiEconomyMeasure === undefined`).
 *  3) obejscie bramki: warunek wstepny (tura 1: nnsGateBlocked=true); dosypka 0/0 NIE odblokowuje (negatywna
 *     kontrola mechanizmu); dosypka 200/200 odblokowuje i tura przechodzi 1->2 (realny endTurn).
 *  4) wartosc AI: po dosypkach w kazdej turze do 12 tur -- kazdy AI owner ma >=1 miasto i >=1 jednostke.
 *     (r3: start czeka na koniec nakladki „Tworzenie swiata” -- bez tego AI=0 miast, blad harnessu, nie gry.)
 *  5) mutacja ksztaltu: zepsuty bundle (--mutant-dist) MUSI oblac ksztalt (jesli podano).
 *
 * OGRANICZENIE (r4, zarzut Evaluatora 1; mutacja forty=0 i hexyZMiast=0 przezyla 23/23): asercja 1 sprawdza TYLKO
 * ksztalt i typy nowych pol (number >= 0 / boolean), NIE ich wartosc. Poprawnosc liczb forty/posterunki/hexyZMiast/
 * hexyZFortowPosterunkow/hexySporne NIE jest testowana automatycznie; jest uzasadniona czytaniem kodu (plik:linia
 * w dyspozycje/analizy/AI-TERRITORY-RACE-DESIGN.md, sekcja 6a). Wartosciowa asercja (fort postawiony -> licznik 1)
 * wymaga biegu gry i jest poza zakresem tej rundy.
 *
 * Uzycie (z gra/, bundle zbudowany): node tools/ai-economy-measure-hook-test.cjs --dist <abs-dist>
 *   --modal-only 1  -- tylko asercja 0 (bez gry).
 *   --runner <abs-plik>  -- runner testowany w asercji 0 (domyslnie tools/ai-economy-measure-run.cjs; mutacja na KOPII).
 * Wyjscie: 0 = wszystkie asercje zielone (w tym czerwone mutacje); 1 = blad (w tym czerwona asercja 4).
 */
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const GRA_DIR = path.resolve(__dirname, '..');
const DIST_GIVEN = process.argv.includes('--dist');
let DIST = path.resolve(arg('dist', path.join(os.tmpdir(), 'ai-economy-dist')));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
const MUTANT_DIST = arg('mutant-dist', '') ? path.resolve(arg('mutant-dist', '')) : null;
const RUNNER = path.resolve(arg('runner', path.join(GRA_DIR, 'tools', 'ai-economy-measure-run.cjs')));
const MODAL_ONLY = arg('modal-only', '0') === '1';
const CHROME = process.env.CHROME_PATH || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const SEED = 4242;
const MAX_TURNS_VALUE = 12;
const OWNER_KEYS = ['owner', 'skarbiec', 'spichlerz', 'jednostkiWojskowe', 'jednostkiCywilne', 'rekruci', 'sumaLudkow',
  'glodWojska', 'glodWojskaAtrycja', 'glodKaraStatProc', 'glodAtrycjaHpProc', 'deficytZlota', 'miasta', 'obywatele',
  'utrzymanieBudynkowPieniadz', 'utrzymanieBudynkowSurowce', 'utrzymanieGarnizonuPieniadz',
  'utrzymanieJednostekPieniadz', 'utrzymanieJednostekSurowce',
  'forty', 'posterunki', 'hexyTerytorium', 'hexyZMiast', 'hexyZFortowPosterunkow', 'hexySporne', 'zywnoscArmiiTura'];

const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || '' }); console.log((ok ? 'ZIELONE ' : 'CZERWONE ') + name + (detail ? ' :: ' + detail : '')); }

function shapeProblems(metrics, requiredKeys) {
  const problems = [];
  if (!metrics || typeof metrics.turn !== 'number') problems.push('brak turn');
  if (!metrics || !Array.isArray(metrics.owners) || metrics.owners.length === 0) problems.push('brak owners');
  for (const o of (metrics && metrics.owners) || []) {
    for (const k of requiredKeys) if (!(k in o)) problems.push('owner ' + o.owner + ' bez ' + k);
    for (const k of ['jednostkiWojskowe', 'jednostkiCywilne', 'miasta', 'obywatele', 'glodKaraStatProc', 'glodAtrycjaHpProc', 'utrzymanieJednostekPieniadz', 'forty', 'posterunki', 'hexyTerytorium', 'hexyZMiast', 'hexyZFortowPosterunkow', 'hexySporne']) {
      if (typeof o[k] !== 'number' || !(o[k] >= 0)) problems.push('owner ' + o.owner + ' ' + k + ' nie jest liczba >=0');
    }
    for (const k of ['glodWojska', 'glodWojskaAtrycja', 'deficytZlota']) {
      if (typeof o[k] !== 'boolean') problems.push('owner ' + o.owner + ' ' + k + ' nie jest boolem');
    }
    if (!o.utrzymanieJednostekSurowce || typeof o.utrzymanieJednostekSurowce !== 'object') problems.push('owner ' + o.owner + ' utrzymanieJednostekSurowce nie jest obiektem');
  }
  return problems;
}

/** R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1 (DODATEK 2 Z4): ksztalt ledgerStats = {entries: liczba>=0, bytes: liczba>=2 ("[]")}. */
function ledgerShapeProblems(ls) {
  const problems = [];
  if (!ls || typeof ls.entries !== 'number' || !(ls.entries >= 0)) problems.push('entries nie jest liczba >=0');
  if (!ls || typeof ls.bytes !== 'number' || !(ls.bytes >= 2)) problems.push('bytes nie jest liczba >=2');
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

/**
 * Asercja 0: blokady modalne konca tury. Atrapy DOM maja te same klasy/id co gra (diplomacyAudience.ts,
 * armyMergePanel.ts, techDiscoveryNotice.ts) i te same przyciski zamkniecia. Bez gry (about:blank).
 */
async function modalCheck(browser) {
  const runner = require(RUNNER);
  const page = await browser.newPage();
  await page.setContent('<body></body>');
  const ctx = runner.newCtx(null);
  const countAll = () => runner.MODAL_KEYS.reduce((s, k) => s + ctx[k], 0);

  // 0a) brak otwartych blokad -> nic nie zamyka i nic nie liczy.
  await runner.closeEndTurnModals(page, ctx);
  check('blokady: bez otwartych modali nic nie jest zamykane ani liczone', countAll() === 0, 'suma=' + countAll());

  // 0b) audiencja dyplomatyczna (przycisk „Wróć” zamyka: display none).
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.className = 'civ-diplo-aud';
    d.innerHTML = '<div class="civ-diplo-aud-box"><button type="button" class="civ-diplo-aud-back">Wróć</button></div>';
    d.querySelector('button').addEventListener('click', () => { d.style.display = 'none'; });
    document.body.appendChild(d);
  });
  await runner.closeEndTurnModals(page, ctx);
  const audHidden = await page.evaluate(() => document.querySelector('.civ-diplo-aud').style.display === 'none');
  check('blokady: audiencja dyplomatyczna zamknieta przyciskiem i policzona (diploAudienceClosed)',
    ctx.diploAudienceClosed === 1 && audHidden, 'licznik=' + ctx.diploAudienceClosed + ' ukryta=' + audHidden);
  // Usuwamy atrape po 0b, zeby ewentualna niezamknieta audiencja nie kaskadowala na 0c-0e (izolacja diagnozy).
  await page.evaluate(() => document.querySelectorAll('.civ-diplo-aud').forEach(el => el.remove()));

  // 0c) panel laczenia armii (przycisk „Zostaw osobno” = zamyka, usuwa korzen panelu).
  await page.evaluate(() => {
    const root = document.createElement('div');
    root.id = 'civ-amp-root';
    root.innerHTML = '<div id="civ-amp-title">Połączenie armii</div><button type="button" class="civ-amp-btn civ-amp-btn-sep" data-act="sep">Zostaw osobno</button>';
    root.querySelector('.civ-amp-btn-sep').addEventListener('click', () => root.remove());
    document.body.appendChild(root);
  });
  await runner.closeEndTurnModals(page, ctx);
  const ampGone = await page.evaluate(() => !document.getElementById('civ-amp-title'));
  check('blokady: panel laczenia armii zamkniety przyciskiem i policzony (armyMergeClosed)',
    ctx.armyMergeClosed === 1 && ampGone, 'licznik=' + ctx.armyMergeClosed + ' usuniety=' + ampGone);

  // 0d) karta odkrycia technologii (✕ = data-act="close", usuwa host).
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'civ-tech-discovery-notice-host';
    host.innerHTML = '<div class="tdn-stage"><button type="button" class="tdn-close" data-act="close">✕</button></div>';
    host.querySelector('[data-act="close"]').addEventListener('click', () => host.remove());
    document.body.appendChild(host);
  });
  await runner.closeEndTurnModals(page, ctx);
  const tnGone = await page.evaluate(() => !document.getElementById('civ-tech-discovery-notice-host'));
  check('blokady: karta odkrycia technologii zamknieta przyciskiem i policzona (techNoticeClosed)',
    ctx.techNoticeClosed === 1 && tnGone, 'licznik=' + ctx.techNoticeClosed + ' usunieta=' + tnGone);

  // 0e) blokada bez przycisku zamkniecia NIE jest zamykana ani liczona (zostaje do zrzutu DOM). Osobny ctx (bez wplywu 0a-0d).
  const ctxE = runner.newCtx(null);
  await page.evaluate(() => { const d = document.createElement('div'); d.className = 'civ-diplo-aud'; d.innerHTML = '<p>brak przycisku</p>'; document.body.appendChild(d); });
  const stuckE = await runner.closeEndTurnModals(page, ctxE);
  const sumE = runner.MODAL_KEYS.reduce((s, k) => s + ctxE[k], 0);
  const stillE = await page.evaluate(() => !!document.querySelector('.civ-diplo-aud p'));
  check('blokady: audiencja bez przycisku nie jest liczona jako zamknieta (zostaje w DOM)', sumE === 0 && stillE && stuckE.length === 0, 'suma=' + sumE + ' zostala=' + stillE + ' niezamkniete=' + JSON.stringify(stuckE));
  await page.evaluate(() => document.querySelectorAll('.civ-diplo-aud').forEach(el => el.remove()));

  // 0f) przycisk, ktory NIE usuwa blokady (klik bez skutku): licznik NIE rosnie mimo kliknec (zawyzanie wykryte).
  const ctxF = runner.newCtx(null);
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'civ-tech-discovery-notice-host';
    host.innerHTML = '<button type="button" data-act="close">✕</button>';
    document.body.appendChild(host);
  });
  const stuckF = await runner.closeEndTurnModals(page, ctxF);
  check('blokady: klik bez skutku (blokada zostaje) nie podbija licznika i jest zglaszany jako niezamkniety',
    ctxF.techNoticeClosed === 0 && stuckF.includes('techNoticeClosed'), 'licznik=' + ctxF.techNoticeClosed + ' niezamkniete=' + JSON.stringify(stuckF));
  await page.evaluate(() => document.getElementById('civ-tech-discovery-notice-host') && document.getElementById('civ-tech-discovery-notice-host').remove());

  // 0g) wojny per tura (R-WEB-AI-UPKEEP-ONOFF-TOOLS-PORT-Q1): warsInPage zlicza pary o statusie 'wojna' z
  // `__truceTestDebug.pairState` (atrapa: wojny 0-3, 2-3, 1-2; reszta pokoj/neutralni); gracz = owner 0.
  await page.evaluate(() => {
    const war = new Set(['0-3', '2-3', '1-2']);
    window.__truceTestDebug = { pairState: (a, b) => ({ status: war.has(Math.min(a, b) + '-' + Math.max(a, b)) ? 'wojna' : (a + b === 5 ? 'pokoj' : 'neutralni') }) };
  });
  const w = await page.evaluate(runner.warsInPage, [0, 1, 2, 3]);
  check('wojny: warsInPage zlicza dokladnie pary o statusie wojna (3 z 6), w tym z graczem (1) i AI-AI (2)',
    !!w && w.active === 3 && w.withPlayer === 1 && w.aiAi === 2 && JSON.stringify(w.pairs) === JSON.stringify([[0, 3], [1, 2], [2, 3]]), JSON.stringify(w));
  await page.evaluate(() => { delete window.__truceTestDebug; });
  const wNone = await page.evaluate(runner.warsInPage, [0, 1, 2]);
  check('wojny: brak haka __truceTestDebug -> null (NIE ZMIERZONO, nie zero)', wNone === null, JSON.stringify(wNone));
  const gd = runner.gateDelta({ calls: 10, blocked: 3 }, { calls: 14, blocked: 5, flagOff: 0, noTickData: 1, allowed: 8 });
  const gdReset = runner.gateDelta({ calls: 50, blocked: 9 }, { calls: 2, blocked: 1 });
  check('bramka utrzymania: gateDelta = po - przed; po resecie licznika (nowa sesja) = po; brak licznika -> null',
    gd.calls === 4 && gd.blocked === 2 && gdReset.calls === 2 && gdReset.blocked === 1 && runner.gateDelta(null, null) === null,
    JSON.stringify([gd, gdReset]));
  await page.close();
}

async function fullChecks(browser) {
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
  // R-WEB-ECONOMY-MEASURE-EXTEND-INCOME-STOCKS-Q1: pola HUD per wlasciciel (kształt; wartosc null = NIE ZMIERZONE, jawnie).
  const finNum = v => typeof v === 'number' && Number.isFinite(v);
  const hudBad = metrics.owners.filter(o => !o.hud || !finNum(o.hud.epoka) || !finNum(o.hud.surowceBrutto) || !finNum(o.hud.surowceNetto)
    || !Array.isArray(o.hud.surowceTyp) || !o.hud.budynkiPerTyp || typeof o.hud.budynkiPerTyp !== 'object').map(o => o.owner);
  check('pola HUD per wlasciciel: epoka, surowceBrutto/Netto liczbowe, surowceTyp[], budynkiPerTyp{}', hudBad.length === 0, 'bledne=' + JSON.stringify(hudBad.slice(0, 5)));
  // R-WEB-VERIFY-LIVE-A (r2, zarzut Evaluatora 4): przypiecie haka tempa „Koszty jednostek" i pola zywnoscArmiiTura.
  // Hak ustawia player.kosztJednostekPace; zywnosc armii (unitFoodPerTurn) MUSI rosnac przy tempie wysoki wzgledem niski.
  const paceRes = await page.evaluate(() => {
    const h = window.__aiEconomyMeasure;
    const food = () => h.metrics().owners.reduce((s, o) => s + (typeof o.zywnoscArmiiTura === 'number' ? o.zywnoscArmiiTura : 0), 0);
    const a = h.setUnitCostPace('niski');
    const zN = food();
    const b = h.setUnitCostPace('wysoki');
    const zW = food();
    const c = h.setUnitCostPace('bzdura');
    const d = h.unitCostPaceState();
    h.setUnitCostPace('normalny');
    return { a, b, c, d, zN, zW, potem: h.unitCostPaceState() };
  });
  check('hak tempa: setUnitCostPace ustawia niski/wysoki, odrzuca wartosc spoza zbioru, unitCostPaceState czyta stan',
    paceRes.a === 'niski' && paceRes.b === 'wysoki' && paceRes.c === 'wysoki' && paceRes.d === 'wysoki' && paceRes.potem === 'normalny', JSON.stringify(paceRes));
  check('zywnoscArmiiTura: tempo wysoki zwieksza zywnosc armii wzgledem niski (pole zalezy od tempa; mutacja ignorujaca tempo -> czerwone)',
    paceRes.zN > 0 && paceRes.zW > paceRes.zN, 'niski=' + paceRes.zN + ' wysoki=' + paceRes.zW);
  const hudGr = metrics.owners.find(o => o.owner === 0);
  const hudGrVals = hudGr && hudGr.hud ? [hudGr.hud.naukaRate, hudGr.hud.handelIncome, hudGr.hud.spichlerzRate, hudGr.hud.skarbiecRate] : [];
  check('pola HUD gracza (owner 0): naukaRate, handelIncome, spichlerzRate, skarbiecRate sa liczbami (buildHudState(0))',
    hudGrVals.length === 4 && hudGrVals.every(finNum), JSON.stringify(hudGrVals));
  const hudTypOk = hudGr && hudGr.hud.surowceTyp.every(r => finNum(r.stan) && finNum(r.brutto) && finNum(r.netto) && (r.cap === null || finNum(r.cap)));
  check('surowceTyp gracza: stan/brutto/netto liczbowe, cap liczbowy lub null', !!hudTypOk, JSON.stringify(hudGr && hudGr.hud.surowceTyp.slice(0, 2)));
  const ls0 = await page.evaluate(() => window.__aiEconomyMeasure.ledgerStats());
  const lsProbs = ledgerShapeProblems(ls0);
  check('ksztalt ledgerStats: {entries, bytes} liczbowe (rozmiar ksiegi N=10, hak civTest)', lsProbs.length === 0, lsProbs.join('; ') || JSON.stringify(ls0));

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
    const mls = await mpage.evaluate(() => window.__aiEconomyMeasure.ledgerStats());
    const mlsProbs = ledgerShapeProblems(mls);
    check('mutacja realna ledgerStats (zepsuty hak w bundle) jest CZERWONA', mlsProbs.length > 0, mlsProbs.join('; ') || 'brak problemow -- test slepy (ledgerStats=' + JSON.stringify(mls) + ')');
    await mpage.close();
  }
}

/** Bez --dist: buduje bundle `vite build` (tylko npx vite, bez prebuild) do katalogu poza repo, jak sidepanel-event-header-wydarzenie-real-render-test. */
function ensureDist() {
  if (DIST_GIVEN) return;
  const outDir = path.join(os.tmpdir(), `ai-economy-dist-${process.pid}-${Date.now()}`);
  execFileSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], { cwd: GRA_DIR, stdio: 'ignore' });
  DIST = outDir;
}

async function main() {
  if (!MODAL_ONLY) ensureDist();
  const { chromium } = require(path.join(PW_DIR, 'node_modules', 'playwright'));
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args });
  try {
    await modalCheck(browser);
    if (!MODAL_ONLY) await fullChecks(browser);
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
