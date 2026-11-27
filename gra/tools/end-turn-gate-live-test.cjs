'use strict';
const { closeCivWelcome } = require('./_live-ready.cjs');
/**
 * end-turn-gate-live-test.cjs — R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1 (runda 3).
 *
 * Test ŻYWEJ GRY (Chromium, build poza repo, ?civTest=1 + __nnsMeasureDebug): zachowanie przycisku/tooltipu bramki
 * „Zakończ turę” w scenariuszach a–e (DODATEK 5 pkt 1) oraz tabela zgodności prognozy bramki z realnym endTurn
 * (tryb --table, ≥3 ziarna × tury 1–15).
 *
 * Użycie (z gra/):
 *   node tools/end-turn-gate-live-test.cjs --dist <d> --out <o> [--seed 11] [--label new|base] [--phase2turn 12]
 *   node tools/end-turn-gate-live-test.cjs --dist <d> --out <o> --table 1 --seeds 11,22,33 --turns 15
 *
 * Scenariusze (każdy w turze ≤ 10, potem powtórka a–c w turze --phase2turn):
 *   a) Skarbiec ujemny (−4) przy prognozie po turze ≥ 0           -> canEnd = true (przycisk bez blokady)
 *   b) prognoza po turze < 0                                      -> canEnd = false + tooltip „po zakończeniu tury” + propozycja podatku
 *   c) zastosowanie proponowanego podatku                         -> blokada znika BEZ końca tury; po endTurn realny Skarbiec >= 0
 *   d) Spichlerz ujemny, Auto-Żywienie koryguje                   -> canEnd = true; po endTurn zmierzony realny Spichlerz
 *   e) brak ręcznej dźwigni                                       -> tura się kończy (brak martwego punktu)
 * Kod wyjścia 0 = wszystkie asercje PASS; 1 = są FAIL (lista w wyniku JSON). NIE używa grantPlayerGold; stan wyjściowy
 * scenariusza ustawiają hooki setPlayerTreasury/setPlayerGranary/setTaxSplit (surowe ustawienie stanu, logikę liczy gra).
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
const OUT = arg('out');
const SEED = parseInt(arg('seed', '11'), 10);
const LABEL = arg('label', 'new');
const PHASE2 = parseInt(arg('phase2turn', '12'), 10);
const TABLE = arg('table', '0') === '1';
const SEEDS = arg('seeds', '11,22,33').split(',').map(x => parseInt(x, 10));
const TURNS = parseInt(arg('turns', '15'), 10);
const MAP = arg('map', 'Maly');
const NEG = arg('neg', '0') === '1'; // tabela: wymuszone prognozy Spichlerza < 0 przed automatem (racja 6, Auto-Żywienie, zapas 0)
const STRESS = arg('stress', '0') === '1'; // tabela: rotacja podatków/racji/Auto-Żywienia i dokładanie jednostek co 4. turę
const wait = ms => new Promise(r => setTimeout(r, ms));

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  try { return await chromium.launch({ headless: true, args }); } catch (_) {
    return await chromium.launch({ headless: true, executablePath: (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), args });
  }
}

async function openGame(browser, seed, errors) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', e => errors.push(String(e && e.message || e).slice(0, 200)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + seed, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed, mapSize: MAP, civTypes: 15, cityStates: 2 });
  await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
    await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
  });
  if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
    await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
  }
    await closeCivWelcome(page);
  await wait(800);
  return page;
}

function makeApi(page) {
  const D = fn => page.evaluate(fn);
  const this_closeOverlays = async () => {
    for (let i = 0; i < 4; i++) {
      const clicked = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find(x => /^(wróć|zamknij)$/i.test((x.textContent || '').trim()) && x.offsetParent !== null);
        if (b) { b.click(); return true; }
        return false;
      });
      if (!clicked) break;
      await wait(400);
    }
  };
  return {
    info: () => D(() => window.__nnsMeasureDebug.gateInfo()),
    turn: () => D(() => window.__nnsMeasureDebug.snapshot().turn),
    setFast: on => page.evaluate(o => window.__nnsMeasureDebug.setFast(o), on),
    setT: v => page.evaluate(o => window.__nnsMeasureDebug.setPlayerTreasury(o), v),
    setG: v => page.evaluate(o => window.__nnsMeasureDebug.setPlayerGranary(o), v),
    setSplit: (p, n, l) => page.evaluate(o => window.__nnsMeasureDebug.setTaxSplit(o[0], o[1], o[2]), [p, n, l]),
    setAuto: on => page.evaluate(o => window.__nnsMeasureDebug.setAutoWyz(o), on),
    setRation: lv => page.evaluate(o => window.__nnsMeasureDebug.setRationAll(o), lv),
    disband: n => page.evaluate(o => window.__nnsMeasureDebug.disbandPlayerUnits(o), n),
    fingerprint: () => D(() => window.__nnsMeasureDebug.gateStateFingerprint()),
    button: () => D(() => {
      const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || ''));
      if (!b) return null;
      return { title: b.getAttribute('title') || '', text: (b.textContent || '').replace(/\s+/g, ' ').trim(), disabled: !!b.disabled, cls: b.className };
    }),
    endTurn: async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
      await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
      await wait(250);
    },
    /** Render włączony na chwilę (tooltip/DOM odświeżają się tylko z renderem), potem szybki tryb z powrotem. */
    withRender: async fn => {
      await page.evaluate(() => window.__nnsMeasureDebug.setFast(false));
      await wait(1200);
      await page.evaluate(() => window.__nnsMeasureDebug.forceGateRecompute());
      await wait(900);
      await this_closeOverlays();
      const r = await fn();
      await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));
      return r;
    },
    closeOverlays: async () => {
      for (let i = 0; i < 4; i++) {
        const clicked = await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find(x => /^(wróć|zamknij)$/i.test((x.textContent || '').trim()) && x.offsetParent !== null);
          if (b) { b.click(); return true; }
          return false;
        });
        if (!clicked) break;
        await wait(400);
      }
    },
    shot: async (file) => { await page.screenshot({ path: file }); },
  };
}

async function runScenarios(browser, outDir) {
  const errors = [];
  const res = { label: LABEL, seed: SEED, scenarios: [], fails: [], errors };
  const page = await openGame(browser, SEED, errors);
  const A = makeApi(page);
  await A.setFast(true);
  const rec = (id, turn, data, ok, why) => {
    res.scenarios.push({ id, turn, ok, why: why || '', ...data });
    if (!ok) res.fails.push(`${id}@t${turn}: ${why}`);
  };
  const reset = async () => {
    await A.setSplit(30, 60, 10); await A.setAuto(true); await A.setT(0); await A.setG(0);
    await wait(120);
  };
  const shotName = (id, turn) => path.join(outDir, `shots-${LABEL}-${id}-t${turn}.png`);

  async function phase(tag) {
    const turn0 = await A.turn();
    // ---------- a) Skarbiec ujemny, prognoza po turze >= 0 ----------
    await reset();
    await A.setSplit(90, 0, 10);              // maksymalny podatek
    await A.setT(0); await wait(120);
    let i0 = await A.info();
    const netMax = i0.forecast.skarbiecPo - i0.forecast.skarbiecObecny;
    if (netMax >= 1) {
      const T = -Math.min(4, Math.floor(netMax));
      await A.setT(T); await wait(120);
      const ia = await A.info();
      const btn = await A.withRender(async () => { await wait(300); return A.button(); });
      if (tag === 'p1') await A.shot(shotName('a-skarbiec-ujemny-prognoza-dodatnia', turn0));
      rec('a', turn0, { treasury: ia.treasury, forecastPo: ia.forecast.skarbiecPo, canEnd: ia.canEnd, button: btn, netMax },
        ia.treasury < 0 && ia.forecast.skarbiecPo >= 0 && ia.canEnd === true && !(btn && /po zakończeniu/i.test(btn.title)),
        'oczekiwano canEnd=true przy Skarbcu<0 i prognozie>=0');
    } else {
      rec('a', turn0, { netMax }, false, 'NIE_ZMIERZONO: nawet maksymalny podatek nie daje dodatniego przyrostu (netMax=' + netMax + ')');
    }
    // ---------- b) prognoza po turze < 0 -> blokada z tooltipem ----------
    await reset();
    await A.setT(-4); await wait(120);
    const fpB0 = await A.fingerprint();      // stan przed odczytem bramki (ta sama funkcja, co przy endTurn)
    const ib = await A.info();
    const fpB1 = await A.fingerprint();      // odczyt bramki NIE może zmienić stanu miast/podatków/skarbca/spichlerza
    const sideEffectFree = fpB0 === fpB1;
    const btnB = await A.withRender(async () => { await wait(300); return A.button(); });
    if (tag === 'p1') await A.shot(shotName('b-prognoza-ujemna-blokada', turn0));
    const tBefore = await A.turn();
    await A.endTurn();                          // próba zakończenia zablokowanej tury
    const tAfter = await A.turn();
    rec('b', turn0, {
      treasury: ib.treasury, forecastPo: ib.forecast.skarbiecPo, canEnd: ib.canEnd, gateZasob: ib.gate.zasob,
      gatePrognoza: ib.gate.prognoza, propozycja: ib.gate.propozycjaPodatku, niewystarczajace: ib.gate.niewystarczajace,
      komunikat: ib.gate.komunikat, buttonTitle: btnB && btnB.title, turnBefore: tBefore, turnAfter: tAfter,
      sideEffectFree, propozycjaSzacunek: ib.gate.propozycjaPodatku && ib.gate.propozycjaPodatku.szacunek,
    },
      ib.forecast.skarbiecPo < 0 && ib.canEnd === false && /po zakończeniu tury/i.test(ib.gate.komunikat)
        && btnB && /po zakończeniu tury/i.test(btnB.title) && ib.gate.propozycjaPodatku && tAfter === tBefore
        // krokowy (nie liniowy): asercja, która łapie wyłączenie wpięcia prognozaPoPodatku w nnsGateForPlayer
        && ib.gate.propozycjaPodatku.szacunek === 'krokowy' && ib.gate.propozycjaPodatku.punktyProcentowe > 0
        && sideEffectFree,
      'oczekiwano blokady (canEnd=false), tooltipu „po zakończeniu tury”, propozycji podatku krokowej, braku końca tury i braku efektów ubocznych odczytu bramki');
    // ---------- c) zastosowanie proponowanego podatku: blokada znika bez końca tury; po endTurn Skarbiec >= 0 ----------
    const prop = ib.gate.propozycjaPodatku;
    if (prop) {
      const sp = await page.evaluate(() => window.__nnsMeasureDebug.getTaxSplit());
      await A.setSplit(sp.procentPieniadz + prop.punktyProcentowe, sp.procentNauka - prop.punktyProcentowe, sp.procentLuksus);
      await wait(150);
      const ic = await A.info();
      const t1 = await A.turn();
      await A.setG(50); await wait(100);       // bufor Spichlerza: pomiar dotyczy Skarbca
      await A.endTurn();
      const t2 = await A.turn();
      const after = await A.info();
      rec('c', turn0, {
        proposedPkt: prop.punktyProcentowe, canEndAfterTax: ic.canEnd, forecastPoAfterTax: ic.forecast.skarbiecPo,
        treasuryBefore: ic.treasury, treasuryAfterEndTurn: after.treasury, turnBefore: t1, turnAfter: t2,
      },
        ic.canEnd === true && ic.forecast.skarbiecPo >= 0 && t2 === t1 + 1 && after.treasury >= 0 && Math.abs(after.treasury - ic.forecast.skarbiecPo) < 0.51,
        'oczekiwano: blokada znika po podatku, tura kończy się, realny Skarbiec >= 0 i zgodny z prognozą');
    } else {
      rec('c', turn0, {}, false, 'brak propozycji podatku (patrz b)');
    }
    return turn0;
  }

  const turn1 = await phase('p1');

  // ---------- d) Spichlerz ujemny, Auto-Żywienie koryguje ----------
  {
    await reset();
    await A.setSplit(90, 0, 10); await A.setT(100); await A.setG(0); await A.setAuto(true);
    // Racje wysokie (bazowa prognoza Spichlerza < 0), Auto-Żywienie włączone: automat obniża rację w ticku.
    let i0 = null; let poAuto0 = 0; let usedRation = null;
    for (const lv of [6, 5, 4, 3]) {
      await A.setRation(lv); await wait(150);
      const t = await A.info();
      const po = t.forecast.spichlerzPo + (t.autoSpichlerzDelta || 0);
      if (t.forecast.spichlerzPo < 0 && t.autoSpichlerzDelta !== null && po > 0.2) { i0 = t; poAuto0 = po; usedRation = lv; break; }
      if (!i0) i0 = t;
    }
    const turnD = await A.turn();
    if (usedRation !== null) {
      const G = -poAuto0 / 2;
      await A.setG(G); await wait(150);
      const id = await A.info();
      const btn = await A.withRender(async () => { await wait(300); return A.button(); });
      await A.shot(shotName('d-spichlerz-ujemny-auto-zywienie', turnD));
      const t1 = await A.turn();
      await A.endTurn();
      const t2 = await A.turn();
      const after = await A.info();
      rec('d', turnD, {
        usedRation, granaryBefore: id.granary, forecastBase: id.forecast.spichlerzPo, autoDelta: id.autoSpichlerzDelta, poAuto0,
        gatePoAutomacie: id.gate && id.gate.prognoza, canEnd: id.canEnd, granaryAfterEndTurn: after.granary, turnBefore: t1, turnAfter: t2,
        buttonTitle: btn && btn.title,
      },
        id.granary < 0 && id.canEnd === true && t2 === t1 + 1 && after.granary >= 0,
        'oczekiwano: Spichlerz<0, bazowa prognoza<0, canEnd=true (automat koryguje), po endTurn realny Spichlerz >= 0');
    } else {
      rec('d', turnD, { poAuto0, base: i0 && i0.forecast.spichlerzPo, autoDelta: i0 && i0.autoSpichlerzDelta }, false, 'NIE_ZMIERZONO: automat nie daje dodatniej prognozy w tym scenariuszu');
    }
    // d2) Auto-Żywienie WYŁĄCZONE + ujemna prognoza + dźwignia racji -> blokada
    await reset();
    await A.setSplit(90, 0, 10); await A.setT(100); await A.setAuto(false); await A.setG(-1); await wait(150);
    const i2 = await A.info();
    const turnD2 = await A.turn();
    rec('d2', turnD2, {
      granary: i2.granary, forecastPo: i2.forecast.spichlerzPo, racjeZysk: i2.racjeZysk, canEnd: i2.canEnd, komunikat: i2.gate.komunikat,
    },
      i2.forecast.spichlerzPo < 0 && i2.racjeZysk > 0 ? (i2.canEnd === false && /po zakończeniu tury/i.test(i2.gate.komunikat)) : false,
      'oczekiwano blokady przy Auto wyłączonym, prognozie Spichlerza<0 i dostępnej dźwigni racji');
    await A.setG(50); await A.setAuto(true); await A.setT(100);
    await A.endTurn();
  }

  // ---------- e) brak ręcznej dźwigni -> tura się kończy ----------
  {
    await reset();
    await A.disband(999);                    // brak jednostek do rozwiązania
    await A.setSplit(90, 0, 10);             // brak podatku do podniesienia
    await A.setAuto(false); await A.setRation(0);   // brak racji do obniżenia
    await A.setT(-100); await A.setG(-100); await wait(200);
    const ie = await A.info();
    const turnE = await A.turn();
    await A.withRender(async () => { await wait(300); return null; });
    await A.shot(shotName('e-brak-dzwigni-brak-blokady', turnE));
    const t1 = await A.turn();
    await A.endTurn();
    const t2 = await A.turn();
    const after = await A.info();
    rec('e', turnE, {
      treasury: ie.treasury, forecastPoSk: ie.forecast.skarbiecPo, forecastPoSp: ie.forecast.spichlerzPo, podatekZysk: ie.podatekZysk,
      racjeZysk: ie.racjeZysk, canEnd: ie.canEnd, turnBefore: t1, turnAfter: t2, treasuryAfter: after.treasury, granaryAfter: after.granary,
    },
      (ie.forecast.skarbiecPo < 0 || ie.forecast.spichlerzPo < 0) && ie.canEnd === true && t2 === t1 + 1,
      'oczekiwano: brak dźwigni = brak blokady (tura kończy się, brak martwego punktu)');
  }

  // ---------- powtórka a–c w turze >= PHASE2 ----------
  await A.setSplit(30, 60, 10); await A.setAuto(true);
  let guard = 0;
  while ((await A.turn()) < PHASE2 && guard++ < 40) {
    await A.setT(100); await A.setG(100); await A.setSplit(30, 60, 10);
    await A.endTurn();
  }
  res.phase2Turn = await A.turn();
  await phase('p2');

  // ---------- wynik ----------
  res.pass = res.fails.length === 0;
  res.turn1 = turn1;
  await A.setFast(false);
  fs.writeFileSync(path.join(outDir, `result-${LABEL}-seed${SEED}.json`), JSON.stringify(res, null, 2));
  return res;
}

async function runTable(browser, outDir) {
  const errors = [];
  const rows = [];
  for (const seed of SEEDS) {
    const page = await openGame(browser, seed, errors);
    const A = makeApi(page);
    await A.setFast(true);
    for (let k = 0; k < TURNS; k++) {
      const turn = await A.turn();
      if (turn > TURNS) break;
      if (STRESS) {
        const splits = [[30, 60, 10], [60, 30, 10], [90, 0, 10], [50, 40, 10]];
        const sp = splits[(k + seed) % splits.length];
        await A.setSplit(sp[0], sp[1], sp[2]);
        await A.setRation([6, 4, 2, 6][(k + seed) % 4]);
        await A.setAuto(((k + seed) % 3) !== 0);
        if (k % 4 === 3) await page.evaluate(() => window.__nnsMeasureDebug.spawnAiUnits(0, 2));
      }
      // Skarbiec: stały bufor +100 (pomiar przyrostu netto, bez blokady bramki). Spichlerz: 0, żeby prognoza <0 uruchamiała
      // projekcję automatu (Auto-Żywienie) — to ją porównujemy z rzeczywistością. Real <0 jest „podłogowany” do 0 przez grę.
      if (NEG) { await A.setSplit(30, 60, 10); await A.setRation(6); await A.setAuto(true); }
      await A.setT(100); await A.setG(0); await wait(120);
      let pre = await A.info();
      // Bramka potrafi zablokować turę (prognoza Spichlerza < 0 po automacie i jest dźwignia) — to poprawne zachowanie;
      // zapisujemy wiersz „blokada” (bez porównania) i dajemy bufor Spichlerza, żeby tura mogła się zakończyć.
      if (!pre.canEnd) {
        rows.push({ seed, turn, blocked: true, gateZasob: pre.gate.zasob, gatePrognoza: pre.gate.prognoza, komunikat: pre.gate.komunikat.slice(0, 140) });
        await A.setG(300); await wait(120);
        pre = await A.info();
      }
      const fingerPre = await A.fingerprint();
      const f = pre.forecast;
      const skFc = pre.treasury + (f.skarbiecPo - f.skarbiecObecny);
      const spBase = pre.granary + (f.spichlerzPo - f.spichlerzObecny);
      const spFc = spBase + (pre.autoSpichlerzDelta || 0);
      await A.endTurn();
      const post = await A.info();
      const t2 = await A.turn();
      if (t2 !== turn + 1) { rows.push({ seed, turn, notEnded: true, canEnd: pre.canEnd }); continue; }
      rows.push({
        seed, turn, endedTo: t2,
        skForecastPo: +skFc.toFixed(3), skReal: post.treasury, skDiff: +(post.treasury - skFc).toFixed(3),
        spBase: +spBase.toFixed(3), autoDelta: pre.autoSpichlerzDelta, spForecastPo: +spFc.toFixed(3), spReal: post.granary,
        spDiff: +(post.granary - spFc).toFixed(3), spFloored: spFc < 0 && post.granary === 0,
        fingerprintChangedByInfo: fingerPre !== (await A.fingerprint()) ? 'tak (po turze, oczekiwane)' : 'nie',
      });
    }
    await page.close();
  }
  fs.writeFileSync(path.join(outDir, `table-${LABEL}${NEG ? '-neg' : ''}${STRESS ? '-stress' : ''}.json`), JSON.stringify({ label: LABEL, rows, errors }, null, 2));
  const bad = rows.filter(r => !r.blocked && !r.notEnded && (Math.abs(r.skDiff) > 0.51 || (Math.abs(r.spDiff) > 0.51 && !r.spFloored)) || r.notEnded);
  console.log(`TABELA ${LABEL}: ${rows.length} wierszy, rozbieżnych (|diff|>0.5): ${bad.length}`);
  return { rows, bad };
}

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist --out'); process.exit(2); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
  const browser = await launch(chromium);
  try {
    if (TABLE) {
      const { rows, bad } = await runTable(browser, OUT);
      for (const r of rows) if (r.blocked || r.notEnded) console.log(`s${r.seed} t${r.turn}: ${r.blocked ? 'BLOKADA ' + r.gateZasob + ' prognoza ' + r.gatePrognoza : 'NIE ZAKOŃCZONO'}`); else console.log(`s${r.seed} t${r.turn}: sk ${r.skForecastPo}->${r.skReal} (d ${r.skDiff}) | sp base ${r.spBase} auto ${r.autoDelta} fc ${r.spForecastPo}->${r.spReal} (d ${r.spDiff}${r.spFloored ? ' podłoga' : ''})`);
      process.exit(bad.length === 0 ? 0 : 1);
    }
    const res = await runScenarios(browser, OUT);
    for (const s of res.scenarios) console.log(`${s.ok ? 'PASS' : 'FAIL'} ${s.id}@t${s.turn} ${s.ok ? '' : s.why}`);
    console.log(`WYNIK ${LABEL}: ${res.scenarios.filter(s => s.ok).length}/${res.scenarios.length} PASS; błędy strony: ${res.errors.length}`);
    process.exit(res.pass ? 0 : 1);
  } finally {
    await browser.close().catch(() => {});
  }
}
main().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(3); });
