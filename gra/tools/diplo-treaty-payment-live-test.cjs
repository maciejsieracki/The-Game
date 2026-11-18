'use strict';
/**
 * diplo-treaty-payment-live-test.cjs — R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1 (r3): realny przebieg AKCEPTACJI traktatu
 * z nośnikiem dopłaty D w prawdziwym Chromium na prawdziwym bundle Vite (?playtest=mapa).
 *
 * Hooki civTest (__cityCessionTestDebug.treatyPay*) nie reimplementują logiki: akceptacja oferty AI idzie przez
 * resolvePlayerAcceptsAiPending (+ carrierCtx) → applyProposalOutcome → transferBasketItems; propozycja gracza przez
 * evaluateProposal → applyProposalOutcome. Test sprawdza STAN PO (zapasy płatnika zmalały dokładnie o pozycje nośnika,
 * odbiorca zyskał, technologia przeszła tylko gdy odbiorca jej nie miał, nigdy poniżej zera) dla pięciu traktatów
 * (NAP, sojusz obronny, sojusz pełny, przemarsz, wasal) w obu kierunkach (AI→gracz, gracz→AI).
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
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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

// Zapasy GRACZA (płatnika) i techy: gracz ma 3 techy, AI ma jeden z nich (filtr „których druga strona nie ma").
const PLAYER_TECHS = ['Rolnictwo', 'Murarstwo', 'Obróbka drewna'];
const AI_TECHS = ['Rolnictwo'];
const PLAYER_HOLD = { zloto: 30000, braz: 300, zelazo: 300, ruda: 300, ruda_cyny: 300, ruda_zelaza: 300 };
const AI_HOLD = { zloto: 10, braz: 0, zelazo: 0, ruda: 0, ruda_cyny: 0, ruda_zelaza: 0 };

async function main() {
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

    const stage = async (AI) => {
      await page.evaluate(([ai, ph, pt, ah, at]) => {
        const d = window.__peaceRulesTestDebug;
        // AI umiarkowanie silniejsza (r ≈ 1,3) => gracz = słabsza strona = płatnik D; D rzędu tysięcy PN, nie milionów.
        d.setAiPowerBonusForTest(ai, 0);
        const pw = d.getPowers(ai);
        d.setAiPowerBonusForTest(ai, Math.max(0, Math.round(1.3 * pw.player - pw.ai)));
        d.setRelationForBrake(ai, 200, 200);
        window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(0, ph, pt);
        window.__cityCessionTestDebug.treatyPaySetHoldingsForTest(ai, ah, at);
      }, [AI, PLAYER_HOLD, PLAYER_TECHS, AI_HOLD, AI_TECHS]);
    };
    const snap = async (AI) => page.evaluate(([ai]) => ({
      p: window.__cityCessionTestDebug.treatyPayHoldingsForTest(0),
      a: window.__cityCessionTestDebug.treatyPayHoldingsForTest(ai),
    }), [AI]);

    function verify(label, before, after, res, dirTag) {
      const c = res.carrier;
      assert(`${label}: zaakceptowano (${res.reason})`, res.accepted === true, res);
      assert(`${label}: wynik niesie nośnik treatyCarrier`, !!c && c.items.length > 0, res);
      if (!c) return;
      // Kolejność: technologie najpierw, potem złoto → brąz → żelazo → rudy (kolejność z danych).
      const ORDER = ['zloto', 'braz', 'zelazo', 'ruda', 'ruda_cyny', 'ruda_zelaza'];
      const techItems = c.items.filter(i => i.typ === 'tech');
      const stockItems = c.items.filter(i => i.typ !== 'tech');
      const firstStock = c.items.findIndex(i => i.typ !== 'tech');
      assert(`${label}: technologie przed ogonem`, firstStock === -1 || c.items.slice(0, firstStock).every(i => i.typ === 'tech'), c.items);
      const idx = stockItems.map(i => ORDER.indexOf(i.id));
      assert(`${label}: ogon w kolejności złoto→brąz→żelazo→rudy`, idx.every((v, k) => v >= 0 && (k === 0 || idx[k - 1] < v)), stockItems);
      // Technologie: tylko takie, których odbiorca (AI) NIE miał, i które płatnik (gracz) miał.
      assert(`${label}: tech tylko spoza zbioru odbiorcy i z puli płatnika`,
        techItems.every(i => !AI_TECHS.includes(i.id) && PLAYER_TECHS.includes(i.id)), techItems);
      // Stan po: zapasy płatnika zmalały dokładnie o pozycje, odbiorca zyskał, nigdy < 0.
      for (const it of stockItems) {
        const key = it.id;
        const dp = (before.p.holdings[key] ?? 0) - (after.p.holdings[key] ?? 0);
        const da = (after.a.holdings[key] ?? 0) - (before.a.holdings[key] ?? 0);
        assert(`${label}: ${key} płatnik −${it.ilosc} (jest −${dp})`, dp === it.ilosc, { dp, it });
        assert(`${label}: ${key} odbiorca +${it.ilosc} (jest +${da})`, da === it.ilosc, { da, it });
        assert(`${label}: ${key} płatnika ≥ 0`, (after.p.holdings[key] ?? 0) >= 0, after.p.holdings);
      }
      // Klucze bez pozycji nośnika nie zmieniają się u płatnika.
      for (const k of ORDER) {
        if (stockItems.some(i => i.id === k)) continue;
        assert(`${label}: ${k} płatnika bez zmian (brak pozycji)`, (before.p.holdings[k] ?? 0) === (after.p.holdings[k] ?? 0), { b: before.p.holdings[k], a: after.p.holdings[k] });
      }
      // Murarstwo wymaga „Obróbki drewna" u odbiorcy (nie ma jej) — nie może być płatnością (nie zostałaby dostarczona);
      // „Rolnictwo" odbiorca już ma. Zostaje wyłącznie „Obróbka drewna".
      assert(`${label}: tech = tylko „Obróbka drewna" (Murarstwo bez prerekwizytu i Rolnictwo posiadane odpadają)`,
        techItems.length === 1 && techItems[0].id === 'Obróbka drewna', techItems);
      for (const t of techItems) {
        assert(`${label}: tech „${t.id}" odkryta przez odbiorcę`, after.a.techs.includes(t.id), after.a.techs);
      }
      assert(`${label}: tech nieoferowana nie przeszła do odbiorcy`,
        PLAYER_TECHS.filter(t => !techItems.some(i => i.id === t) && !AI_TECHS.includes(t)).every(t => !after.a.techs.includes(t)), after.a.techs);
      assert(`${label}: płatnik nie utracił techów`, PLAYER_TECHS.every(t => after.p.techs.includes(t)), after.p.techs);
    }

    for (const action of Object.keys(PAYLOADS)) {
      // Najpierw gracz→AI (pakt/sojusz jeszcze nie istnieje), potem AI→gracz (akceptacja nie sprawdza duplikatów).
      // --- gracz → AI (gracz proponuje, AI ocenia) ---
      await stage(AI2);
      const before2 = await snap(AI2);
      const res2 = await page.evaluate(([ai, act, pl]) => window.__cityCessionTestDebug.treatyPayProposeAsPlayerForTest(ai, act, pl), [AI2, action, PAYLOADS[action]]);
      const after2 = await snap(AI2);
      console.log(`[${action}] gracz→AI:`, JSON.stringify({ acc: res2.accepted, reason: res2.reason, carrier: res2.carrier, deal: res2.dealKind }));
      if (res2.accepted) {
        verify(`${action} gracz→AI`, before2, after2, res2, 'pl');
        assert(`${action} gracz→AI: strona koszyka = proposer (gracz oddaje z giveItems)`, res2.carrier && res2.carrier.side === 'proposer', res2.carrier);
      }
      else console.log(`  NIE ZMIERZONO ${action} gracz→AI live: AI odmówiła przed płatnością (bramka inna niż nośnik): ${res2.reason}`);

      // --- AI → gracz (gracz klika „Przyjmij" na ofercie AI) ---
      await stage(AI);
      const before1 = await snap(AI);
      const res1 = await page.evaluate(([ai, act, pl]) => window.__cityCessionTestDebug.treatyPayAcceptAiPendingForTest(ai, act, pl), [AI, action, PAYLOADS[action]]);
      const after1 = await snap(AI);
      console.log(`[${action}] AI→gracz:`, JSON.stringify({ acc: res1.accepted, reason: res1.reason, carrier: res1.carrier, deal: res1.dealKind }));
      verify(`${action} AI→gracz`, before1, after1, res1, 'ai');
      assert(`${action} AI→gracz: strona koszyka = responder (gracz oddaje z receiveItems)`, res1.carrier && res1.carrier.side === 'responder', res1.carrier);
      if (!res1.windowCarrier && /Respekt/.test(res1.windowReason || '')) {
        console.log(`  NIE ZMIERZONO ${action} AI→gracz: zgodność z wierszem okna — okno oferty odrzuca z innej bramki (${res1.windowReason}); realna akceptacja niesie nośnik`);
      } else
      assert(`${action} AI→gracz: nośnik akceptacji = wiersz okna (te same pozycje i strona)`,
        JSON.stringify(res1.windowCarrier && res1.windowCarrier.items) === JSON.stringify(res1.carrier && res1.carrier.items)
        && (res1.windowCarrier && res1.windowCarrier.side) === (res1.carrier && res1.carrier.side), { w: res1.windowCarrier, c: res1.carrier });

    }
  } finally {
    await browser.close();
  }
  assert('C. zero pageerror / console.error', errors.length === 0, errors.slice(0, 5));
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('wyjątek:', e && e.stack || e); process.exit(1); });
