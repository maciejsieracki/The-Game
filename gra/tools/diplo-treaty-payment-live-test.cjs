'use strict';
/**
 * diplo-treaty-payment-live-test.cjs — R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1 (r4): realny przebieg AKCEPTACJI traktatu
 * z nośnikiem dopłaty D w prawdziwym Chromium na prawdziwym bundle Vite (?playtest=mapa).
 *
 * Co jest sprawdzane:
 *  S (statycznie, main.ts): WSZYSTKIE akceptacje oferty AI przez gracza idą przez jedną funkcję
 *    resolvePlayerAcceptsAiPendingWired, która sama dołącza carrierCtx. Bezpośrednie wywołanie
 *    resolvePlayerAcceptsAiPending( w main.ts jest dozwolone tylko w tej funkcji i w AI↔AI (poza zakresem).
 *    Usunięcie kontekstu z któregokolwiek miejsca wywołania nie jest więc możliwe bez zmiany tej funkcji.
 *  L (live): pięć traktatów (NAP, sojusz obronny, sojusz pełny, przemarsz, wasal) w obu kierunkach
 *    (gracz→AI, AI→gracz). Hooki civTest nie reimplementują logiki: akceptacja oferty AI idzie przez
 *    resolvePlayerAcceptsAiPendingWired → applyProposalOutcome → transferBasketItems; propozycja gracza przez
 *    evaluateProposal → applyProposalOutcome. Sprawdzany jest STAN PO: zapasy płatnika zmalały dokładnie o pozycje
 *    nośnika, odbiorca zyskał to samo, technologia przeszła tylko gdy odbiorca jej nie miał i jej płatnik miał,
 *    nic nie schodzi poniżej zera, strona koszyka zgodna z płatnikiem.
 *  Precondycja respektu: przemarsz wymaga udziału siły gracza/AI ≥55%, wasal ≥70% — asertowane przed propozycją
 *    (nie ma cichego pominięcia przypadku).
 *
 * Płatnik = słabsza strona wg Power (FALA 826). Dla przemarszu/wasala strona wymuszająca Respekt jest silniejsza,
 * więc płatnikiem jest druga strona (AI przy propozycji gracza, gracz przy propozycji AI).
 *
 * Usage (z gra/):
 *   node ./node_modules/vite/bin/vite.js build --outDir <scratchAbs> --emptyOutDir
 *   SKIP_BUILD=1 node tools/diplo-treaty-payment-live-test.cjs <scratchAbs>
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-treaty-pay-live-' + process.pid);
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';

let pass = 0;
let fail = 0;
const knownGaps = [];
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sameSet = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

/** S: statyczna bramka okablowania (main.ts). */
function staticWiringCheck() {
  const src = fs.readFileSync(path.join(GRA_DIR, 'src', 'main.ts'), 'utf8');
  const direct = (src.match(/resolvePlayerAcceptsAiPending\(/g) || []).length;
  const ctxCount = (src.match(/carrierCtx:/g) || []).length;
  const wrapperStart = src.indexOf('function resolvePlayerAcceptsAiPendingWired(');
  const wrapperEnd = wrapperStart < 0 ? -1 : src.indexOf('\n    }\n', wrapperStart);
  const wrapper = wrapperStart < 0 || wrapperEnd < 0 ? '' : src.slice(wrapperStart, wrapperEnd);
  assert('S1 wrapper resolvePlayerAcceptsAiPendingWired istnieje i dołącza carrierCtx z buildProposalEvalContext',
    /carrierCtx: buildProposalEvalContext\(pending\.fromOwnerId, pending\.toOwnerId\)/.test(wrapper), wrapper.slice(0, 200));
  assert('S2 carrierCtx: wyłącznie w wrapperze (zero innych miejsc wywołania)', ctxCount === 1, ctxCount);
  assert('S3 bezpośrednie resolvePlayerAcceptsAiPending( = 2 (wrapper + AI↔AI poza zakresem)', direct === 2, direct);
  const aiAiAt = src.indexOf('resolvePlayerAcceptsAiPending(', src.indexOf('function applyAiAiHandelSurowiecCmd('));
  assert('S4 drugie bezpośrednie wywołanie stoi w applyAiAiHandelSurowiecCmd (AI↔AI)',
    aiAiAt > 0 && aiAiAt < src.indexOf('\n    }\n', src.indexOf('function applyAiAiHandelSurowiecCmd(')), aiAiAt);
  const wiredCalls = (src.match(/resolvePlayerAcceptsAiPendingWired\(/g) || []).length - 1; // minus definicja
  assert('S5 wywołania przez wrapper >= 7 (wszystkie realne ścieżki akceptacji)', wiredCalls >= 7, wiredCalls);
}

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
    () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 900000 },
  );
  await wait(300);
}

const PAYLOADS = {
  nap: { turns: 15 },
  sojusz_defensywny: { allianceKind: 'defensywny' },
  sojusz_pelny: { allianceKind: 'pelny' },
  granice: { borderMilitary: true },
  wasal: {},
};

// Próg udziału siły WNIOSKODAWCY (proposerRespekt = 100·P_self/(P_self+P_partner)) — bramki Respektu w ocenie.
const SHARE_NEED = { granice: 55, wasal: 70 };
// Stosunek sił wymagany przez bramkę (z zapasem): 55% ⇔ 1,22; 70% ⇔ 2,33. Wybrane 1,3 i 2,5.
const RATIO_NEED = { granice: 1.3, wasal: 2.5 };
const DEFAULT_RATIO = 1.3; // AI silniejsza 1,3× (akcje bez bramki Respektu, jak w r3)

// Zapasy GRACZA i AI: gracz ma 3 techy, AI ma jeden z nich (filtr „których druga strona nie ma").
const PLAYER_TECHS = ['Rolnictwo', 'Murarstwo', 'Obróbka drewna'];
const AI_TECHS = ['Rolnictwo'];
const TECH_PREREQ = { Murarstwo: 'Obróbka drewna' }; // Murarstwo wymaga Obróbki drewna u odbiorcy
const PLAYER_HOLD = { zloto: 30000, braz: 300, zelazo: 300, ruda: 300, ruda_cyny: 300, ruda_zelaza: 300 };
const AI_HOLD = { zloto: 10, braz: 0, zelazo: 0, ruda: 0, ruda_cyny: 0, ruda_zelaza: 0 };
// Zapasy płatnika w przypadkach o dużej D (stosunek 2,5 albo płatnik AI): nie ma być ograniczeniem.
const RICH = { zloto: 5000000, braz: 50000, zelazo: 50000, ruda: 50000, ruda_cyny: 50000, ruda_zelaza: 50000 };
const ORDER = ['zloto', 'braz', 'zelazo', 'ruda', 'ruda_cyny', 'ruda_zelaza'];

/**
 * Konfiguracja przypadku. proposerIsPlayer=true: gracz→AI (gracz proponuje, AI ocenia i wysyła).
 * aiOverPlayer = P_AI / P_gracz. Strona wymuszająca Respekt (wnioskodawca) ma być silniejsza.
 */
function caseCfg(action, proposerIsPlayer) {
  const need = SHARE_NEED[action];
  const R = need ? RATIO_NEED[action] : DEFAULT_RATIO;
  const aiOverPlayer = !need ? DEFAULT_RATIO : (proposerIsPlayer ? 1 / R : R);
  const payerIsPlayer = aiOverPlayer >= 1; // słabsza strona płaci
  const rich = !payerIsPlayer || (need && R >= 2.5);
  return { need, aiOverPlayer, payerIsPlayer, rich };
}

async function main() {
  staticWiringCheck();
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { console.error('playwright nie znaleziony'); process.exit(1); }
  buildBundle();
  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

  try {
    await gotoPlaytestMapa(page);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    const ais = await page.evaluate(() => window.__peaceRulesTestDebug.listAiOwnerIds());
    const AI = ais[0]; // AI→gracz
    const AI2 = ais[1]; // gracz→AI (osobna para: bez kolizji z już zawartym traktatem)
    console.log('AI owner:', AI, 'wszystkie:', JSON.stringify(ais));

    // Ustawia siłę (aiOverPlayer), zapasy i techy; zwraca moce i udział wnioskodawcy.
    const stage = async (ai, cfg) => page.evaluate(([aiId, c, ph, pt, ah, at, rich, payerIsPlayer]) => {
      const d = window.__peaceRulesTestDebug;
      d.setAiPowerBonusForTest(aiId, 0);
      d.setAiPowerBonusForTest(0, 0);
      const pw0 = d.getPowers(aiId);
      if (c.aiOverPlayer >= 1) d.setAiPowerBonusForTest(aiId, Math.max(0, Math.round(c.aiOverPlayer * pw0.player - pw0.ai)));
      else d.setAiPowerBonusForTest(0, Math.max(0, Math.round(pw0.ai / c.aiOverPlayer - pw0.player)));
      d.setRelationForBrake(aiId, 200, 200);
      const pwr = d.getPowers(aiId);
      const ph2 = payerIsPlayer && rich ? rich.RICH : ph;
      const ah2 = !payerIsPlayer && rich ? rich.RICH : ah;
      window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(0, ph2, pt);
      window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(aiId, ah2, at);
      return pwr;
    }, [ai, cfg, PLAYER_HOLD, PLAYER_TECHS, AI_HOLD, AI_TECHS, cfg.rich ? { RICH } : null, cfg.payerIsPlayer]);

    const snap = async (ai) => page.evaluate(([aiId]) => ({
      p: window.__cityCessionTestDebug.treatyPayHoldingsForTest(0),
      a: window.__cityCessionTestDebug.treatyPayHoldingsForTest(aiId),
    }), [ai]);

    /**
     * Sprawdza STAN PO akceptacji. payerIsPlayer: kto płaci D. proposerIsPlayer: kto wnioskuje (strona koszyka).
     */
    function verify(label, before, after, res, cfg, proposerIsPlayer) {
      const payerB = cfg.payerIsPlayer ? before.p : before.a;
      const payerA = cfg.payerIsPlayer ? after.p : after.a;
      const recvB = cfg.payerIsPlayer ? before.a : before.p;
      const recvA = cfg.payerIsPlayer ? after.a : after.p;
      const payerTechs = cfg.payerIsPlayer ? PLAYER_TECHS : AI_TECHS;
      const recvTechs = cfg.payerIsPlayer ? AI_TECHS : PLAYER_TECHS;
      const c = res.carrier;
      assert(`${label}: zaakceptowano (${res.reason})`, res.accepted === true, res);
      assert(`${label}: wynik niesie nośnik treatyCarrier`, !!c && c.items.length > 0, res);
      if (!c) return;
      const techItems = c.items.filter(i => i.typ === 'tech');
      const stockItems = c.items.filter(i => i.typ !== 'tech');
      const firstStock = c.items.findIndex(i => i.typ !== 'tech');
      assert(`${label}: technologie przed ogonem`, firstStock === -1 || c.items.slice(0, firstStock).every(i => i.typ === 'tech'), c.items);
      const idx = stockItems.map(i => ORDER.indexOf(i.id));
      assert(`${label}: ogon w kolejności złoto→brąz→żelazo→rudy`, idx.every((v, k) => v >= 0 && (k === 0 || idx[k - 1] < v)), stockItems);
      // Technologie: dokładnie te, które płatnik MA, a odbiorca NIE ma (i prerekwizyt odbiorcy spełniony).
      const expectTech = payerTechs.filter(t => !recvTechs.includes(t) && (!TECH_PREREQ[t] || recvTechs.includes(TECH_PREREQ[t])));
      assert(`${label}: technologie = dokładnie ${JSON.stringify(expectTech)} (płatnik ma, odbiorca nie ma)`,
        sameSet(techItems.map(i => i.id), expectTech), techItems);
      // Stan po — zapasy: płatnik −ilość, odbiorca +ilość, nigdy < 0.
      for (const it of stockItems) {
        const dp = (payerB.holdings[it.id] ?? 0) - (payerA.holdings[it.id] ?? 0);
        const dr = (recvA.holdings[it.id] ?? 0) - (recvB.holdings[it.id] ?? 0);
        assert(`${label}: ${it.id} płatnik −${it.ilosc} (jest −${dp})`, dp === it.ilosc, { dp, it });
        assert(`${label}: ${it.id} odbiorca +${it.ilosc} (jest +${dr})`, dr === it.ilosc, { dr, it });
        assert(`${label}: ${it.id} płatnika ≥ 0`, (payerA.holdings[it.id] ?? 0) >= 0, payerA.holdings);
      }
      for (const k of ORDER) {
        if (stockItems.some(i => i.id === k)) continue;
        assert(`${label}: ${k} płatnika bez zmian (brak pozycji)`, (payerB.holdings[k] ?? 0) === (payerA.holdings[k] ?? 0),
          { b: payerB.holdings[k], a: payerA.holdings[k] });
      }
      // Technologie: odbiorca zyskuje dokładnie te pozycje; płatnik nie traci żadnej.
      const expectRecvTechs = [...recvB.techs, ...techItems.map(i => i.id)];
      assert(`${label}: odbiorca dostał dokładnie technologie z nośnika`, sameSet(recvA.techs, expectRecvTechs), { after: recvA.techs, expect: expectRecvTechs });
      assert(`${label}: płatnik nie utracił ani nie zyskał technologii`, sameSet(payerA.techs, payerB.techs), { b: payerB.techs, a: payerA.techs });
      // Strona koszyka: wnioskodawca = „proposer”; płatnik = wnioskodawca → proposer, inaczej responder.
      const wantSide = (cfg.payerIsPlayer === proposerIsPlayer) ? 'proposer' : 'responder';
      assert(`${label}: strona koszyka = ${wantSide} (płatnik ${cfg.payerIsPlayer ? 'gracz' : 'AI'})`, c.side === wantSide, c);
    }

    const share = (pwr, cfg, proposerIsPlayer) => {
      const proposerPower = proposerIsPlayer ? pwr.player : pwr.ai;
      const sum = pwr.player + pwr.ai;
      return sum > 0 ? Math.round(100 * proposerPower / sum) : 50;
    };

    for (const action of Object.keys(PAYLOADS)) {
      // --- gracz → AI (gracz proponuje, AI ocenia, akceptacja po stronie AI) ---
      const cfgP = caseCfg(action, true);
      const pwrP = await stage(AI2, cfgP);
      const shP = share(pwrP, cfgP, true);
      console.log(`[${action}] gracz→AI: udział siły gracza ${shP}% (płatnik: ${cfgP.payerIsPlayer ? 'gracz' : 'AI'}${cfgP.rich ? ', zapasy bogate' : ''})`);
      if (SHARE_NEED[action]) assert(`${action} gracz→AI: precondycja Respekt gracza ≥ ${SHARE_NEED[action]}% (jest ${shP}%)`, shP >= SHARE_NEED[action], pwrP);
      const beforeP = await snap(AI2);
      const resP = await page.evaluate(([ai, act, pl]) => window.__cityCessionTestDebug.treatyPayProposeAsPlayerForTest(ai, act, pl), [AI2, action, PAYLOADS[action]]);
      const afterP = await snap(AI2);
      console.log(`[${action}] gracz→AI:`, JSON.stringify({ acc: resP.accepted, reason: resP.reason, carrier: resP.carrier, deal: resP.dealKind }));
      if (cfgP.payerIsPlayer) {
        verify(`${action} gracz→AI`, beforeP, afterP, resP, cfgP, true);
      } else {
        // ZNANA LUKA (NIE ZALICZANA jako PASS): gracz silniejszy ⇒ płatnikiem jest AI. treatyCarrierPlanForPlayerPayer
        // zwraca null (split.strongerSide === 'a'), więc nośnik nie jest dołączany ani przelewany. Test PRZYPINA ten stan,
        // żeby luka była widoczna; decyzja właściciela: czy płatnik-AI ma dostać nośnik (osobny temat).
        knownGaps.push(`${action} gracz→AI: płatnik AI (gracz silniejszy) — nośnik nie podłączony`);
        assert(`${action} gracz→AI [znana luka]: akceptacja przechodzi bramkę Respektu`, resP.accepted === true, resP);
        assert(`${action} gracz→AI [znana luka]: brak nośnika (carrier=null) — przelewu nie ma`, resP.carrier === null, resP.carrier);
        assert(`${action} gracz→AI [znana luka]: zapasy AI nietknięte`,
          JSON.stringify(beforeP.a.holdings) === JSON.stringify(afterP.a.holdings), { b: beforeP.a.holdings, a: afterP.a.holdings });
      }

      // --- AI → gracz (gracz klika „Przyjmij" na ofercie AI) ---
      const cfgA = caseCfg(action, false);
      const pwrA = await stage(AI, cfgA);
      const shA = share(pwrA, cfgA, false);
      console.log(`[${action}] AI→gracz: udział siły AI ${shA}% (płatnik: ${cfgA.payerIsPlayer ? 'gracz' : 'AI'}${cfgA.rich ? ', zapasy bogate' : ''})`);
      if (SHARE_NEED[action]) assert(`${action} AI→gracz: precondycja Respekt AI ≥ ${SHARE_NEED[action]}% (jest ${shA}%)`, shA >= SHARE_NEED[action], pwrA);
      const beforeA = await snap(AI);
      const resA = await page.evaluate(([ai, act, pl]) => window.__cityCessionTestDebug.treatyPayAcceptAiPendingForTest(ai, act, pl), [AI, action, PAYLOADS[action]]);
      const afterA = await snap(AI);
      console.log(`[${action}] AI→gracz:`, JSON.stringify({ acc: resA.accepted, reason: resA.reason, carrier: resA.carrier, deal: resA.dealKind }));
      verify(`${action} AI→gracz`, beforeA, afterA, resA, cfgA, false);
      assert(`${action} AI→gracz: nośnik akceptacji = wiersz okna (te same pozycje i strona)`,
        JSON.stringify(resA.windowCarrier && resA.windowCarrier.items) === JSON.stringify(resA.carrier && resA.carrier.items)
        && (resA.windowCarrier && resA.windowCarrier.side) === (resA.carrier && resA.carrier.side),
        { w: resA.windowCarrier, c: resA.carrier, windowReason: resA.windowReason });
    }
  } finally {
    await browser.close();
  }
  assert('C. zero pageerror / console.error', errors.length === 0, errors.slice(0, 5));
  if (knownGaps.length) {
    console.log(`NIE ZMIERZONO przelewu (znane luki, nie PASS): ${knownGaps.length}`);
    for (const g of knownGaps) console.log('  - ' + g);
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('wyjątek:', e && e.stack || e); process.exit(1); });
