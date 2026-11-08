'use strict';
/**
 * live-verify-autoimprove-fort-limit-probe.cjs — R-WEB-AUTO-FORT-LIVE-U2-Q1.
 * Pomiar: czy "Limit miast (baza)=1" z preferencji kreatora FAKTYCZNIE obowiazuje w zywej grze (E-FORT wymaga
 * cityLimitExhausted===true). Metoda: ta sama konfiguracja co live-verify-autoimprove-fort.cjs; potem proba zalozenia
 * drugiego miasta na heksach w terytorium w dystansie 6..9 od stolicy (T.foundCity -> showHintMessage 'Nie mozna zalozyc: <powod>'),
 * w kolejnych momentach (po stolicy, po unlockAllTech, po N turach). Odczyt powodu z toastu (DOM).
 * Usage: ROBOCZA_HTML=... NODE_PATH=... EVID_DIR=... [SEED=18] [PREFS=1|none] node gra/tools/live-verify-autoimprove-fort-limit-probe.cjs [tury=6]
 * PREFS=none -> bez nadpisania limitu (kontrola: domyslne 10).
 */
const C = require('./live-verify-autoimprove-common.cjs');
const SEED = Number(process.env.SEED || 18);
const PREFS = process.env.PREFS || '1';

const PROBE = () => {
  const T = window.__civTest;
  const st = T.state();
  const cap = st.cities.find((c) => c.ownerId === st.me);
  const dist = (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r));
  // heksy w WLASNYM terytorium (promien miasta pop1 = 5), od najdalszych; powod odmowy odroznia "za blisko"/"poza terytorium"/"limit".
  const ring = T.around(cap.q, cap.r, 5, false).filter((h) => dist(h, cap) >= 2 && h.owner === st.me && h.teren !== 'morze' && h.teren !== 'plytkie_morze').sort((a, b) => dist(b, cap) - dist(a, cap));
  const toastText = () => {
    const el = document.getElementById('civ-hint-toast');
    return el && el.style.display !== 'none' ? el.textContent : null;
  };
  const era = window.__eraTestDebug && window.__eraTestDebug.getPlayerState ? window.__eraTestDebug.getPlayerState() : null; // player.era (main.ts:24837)
  const res = { turn: st.turn, playerEra: era && era.era, zbadaneSize: era && era.zbadaneSize, myCities: st.cities.filter((c) => c.ownerId === st.me).length, ownedRing: ring.length, tries: [] };
  for (const h of ring.slice(0, 40)) {
    const before = st.cities.length;
    const ok = T.foundCity(h.q, h.r);
    const now = T.state().cities.length;
    res.tries.push({ q: h.q, r: h.r, ok, toast: toastText(), cities: now });
    if (now > before) { res.founded = true; break; }
    if (res.tries.length >= 8) break;
  }
  return res;
};

(async () => {
  const turns = Number(process.argv[2] || 6);
  const browser = await C.launch();
  const prefs = PREFS === 'none' ? undefined : { v: 4, advanced: { cityLimitBase: Number(PREFS) } };
  const s = await C.openMenu(browser, prefs ? { newGamePrefs: prefs } : {});
  const out = { seed: SEED, prefs: PREFS, probes: [] };
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.wizardLimitText = await s.page.evaluate(() => (document.body.innerText.match(/Limit miast[^\n]*\n[^\n]*\n?[^\n]*/) || [null])[0]);
    out.start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    out.probes.push({ when: 'po stolicy (przed unlockAllTech)', ...(await s.page.evaluate(PROBE)) });
    if (process.env.UNLOCK !== '0') {
      await s.page.evaluate(() => { const T = window.__civTest; T.unlockAllTech(); T.setPraca(100000); });
      out.probes.push({ when: 'po unlockAllTech', ...(await s.page.evaluate(PROBE)) });
    } else {
      await s.page.evaluate(() => { window.__civTest.setPraca(100000); });
      out.probes.push({ when: 'bez unlockAllTech (UNLOCK=0), po setPraca', ...(await s.page.evaluate(PROBE)) });
    }
    for (let t = 0; t < turns; t++) {
      const r = await C.endTurnAndWait(s);
      if (!r.ok) break;
      if (t === 0 || t === turns - 1) out.probes.push({ when: `po ${t + 1} turach`, ...(await s.page.evaluate(PROBE)) });
    }
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 10);
  C.save(`limit-probe-p${PREFS}-s${SEED}-u${process.env.UNLOCK === '0' ? 0 : 1}.json`, out);
  console.log(JSON.stringify(out).slice(0, 6000));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(2); });
