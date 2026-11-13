'use strict';
/**
 * R-WEB-CITY-ADMINISTRATOR-Q1 — weryfikacja w Chromium: nagłówek miasta (stolica Pałac + miasto regionalne Dom Starszyzny),
 * przycisk „Administrator +/✓”, chip, stan „nie pracuje”, bramka autobudowy w REALNEJ turze, ikona (16/24 px, jasna/ciemna).
 * Usage: ROBOCZA_HTML=<index.html z vite build> EVID_DIR=<katalog> node tools/live-verify-city-administrator.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const fs = require('fs');
const path = require('path');
const { wait } = C;

async function openCityPanel(page, hexQ, hexR) {
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const bt = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Wróć|Zamknij)$/.test((x.textContent || '').trim())); if (bt) bt.click(); });
    await page.keyboard.press('Escape'); await wait(300);
  }
  await page.mouse.dblclick(800, 500); await wait(800);
  await page.keyboard.press('1'); await wait(1500);
  return page.evaluate(() => !!document.querySelector('#cs-manager, [id^=cs-]'));
}

const headerInfo = (page) => page.evaluate(() => {
  const btn = document.querySelector('#civ-v-administrator');
  const chip = document.querySelector('[data-adm-chip]');
  const cap = document.querySelector('.civ-v-w3-capital-badge, #civ-v-set-capital');
  return {
    name: (document.querySelector('.civ-v-w3-city-name') || {}).textContent || null,
    button: btn ? { text: btn.textContent.trim(), state: btn.getAttribute('data-adm-state'), disabled: btn.disabled, title: btn.getAttribute('title'), hasIcon: !!btn.querySelector('[data-adm-icon]'), warn: !!btn.querySelector('.civ-adm-ic-warn') } : null,
    chip: chip ? { state: chip.getAttribute('data-adm-chip'), text: chip.textContent.trim(), title: chip.getAttribute('title') } : null,
    capitalEl: cap ? cap.textContent.trim() : null,
  };
});

(async () => {
  const browser = await C.launch();
  const out = {};
  try {
    const s = await C.openMenu(browser);
    const page = s.page;
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(page);
    await C.foundCapital(page);
    await wait(1500);
    const st0 = await page.evaluate(() => window.__civTest.state());
    const cap = st0.cities.find((c) => c.ownerId === 0);
    out.capital = { id: cap.id, name: cap.name };
    await page.evaluate(() => window.__civTest.setAutoBuild(true));

    // 1) stolica: Pałac, skarbiec 500, tryb auto, BEZ administratora
    out.setup1 = await page.evaluate((id) => window.__civTest.adminSetup(id, ['palac'], 500, 'zrownowazone'), cap.id);
    out.open1 = await openCityPanel(page);
    await wait(500);
    out.hdr1 = await headerInfo(page);
    await page.screenshot({ path: C.EVID + '/01-stolica-administrator-plus.png' });
    console.log('1 stolica bez admina', JSON.stringify(out.hdr1));

    // 2) klik „Administrator +” -> zatrudniono (40 ze skarbca)
    const tBefore = out.setup1.treasury;
    await page.evaluate(() => document.querySelector('#civ-v-administrator').click());
    await wait(800);
    out.hdr2 = await headerInfo(page);
    out.state2 = await page.evaluate((id) => window.__civTest.adminState(id), cap.id);
    await page.screenshot({ path: C.EVID + '/02-stolica-administrator-zatrudniony.png' });
    console.log('2 po zatrudnieniu', JSON.stringify(out.hdr2), 'skarbiec', tBefore, '->', out.state2.treasury);

    // 3) panel produkcji: autobudowa odblokowana (admin pracuje)?
    out.lock3 = await page.evaluate(() => ({ locked: document.querySelectorAll('.auto-build-locked').length, hint: (document.querySelector('[data-auto-build-hint]') || {}).textContent || null }));
    console.log('3 blokada autobudowy (admin pracuje)', JSON.stringify(out.lock3));

    // 4) stan „nie pracuje” (skarbiec 0)
    out.setup4 = await page.evaluate((id) => window.__civTest.adminSetup(id, null, 0), cap.id);
    await page.keyboard.press('Escape'); await wait(300);
    out.open4 = await openCityPanel(page);
    await wait(600);
    out.hdr4 = await headerInfo(page);
    out.lock4 = await page.evaluate(() => ({ locked: document.querySelectorAll('.auto-build-locked').length, hint: (document.querySelector('[data-auto-build-hint]') || {}).textContent || null }));
    await page.screenshot({ path: C.EVID + '/03-stolica-administrator-nie-pracuje.png' });
    console.log('4 nie pracuje', JSON.stringify(out.hdr4), JSON.stringify(out.lock4));

    // 5) miasto regionalne: Dom Starszyzny (założone drugie miasto gracza)
    await page.evaluate(() => window.__civTest.unlockAllTech());
    await page.evaluate(() => window.__civTest.setCityLimit(5));
    const cands = await page.evaluate((c) => window.__civTest.foundCandidates(40).filter((h) => Math.max(Math.abs(h.q - c.q), Math.abs(h.r - c.r)) >= 3), cap);
    let second = null;
    for (const h of cands.slice(0, 15)) {
      const ok = await page.evaluate((hh) => window.__civTest.foundCity(hh.q, hh.r), h);
      if (ok) { second = h; break; }
    }
    out.second = second;
    await wait(1200);
    const st1 = await page.evaluate(() => window.__civTest.state());
    const reg = st1.cities.find((c) => c.ownerId === 0 && c.id !== cap.id);
    if (reg) {
      out.regional = { id: reg.id, name: reg.name };
      out.setup5 = await page.evaluate((id) => window.__civTest.adminSetup(id, ['dom_starszyzny'], 500, 'zrownowazone'), reg.id);
      await openCityPanel(page); await wait(500);
      await page.evaluate(() => { const b = document.querySelector('#civ-v-city-next'); if (b && !b.disabled) b.click(); });
      await wait(700);
      let hdr = await headerInfo(page);
      if (hdr.name && hdr.name.includes(cap.name)) { await page.evaluate(() => document.querySelector('#civ-v-city-next').click()); await wait(600); hdr = await headerInfo(page); }
      out.hdr5 = hdr;
      await page.screenshot({ path: C.EVID + '/04-miasto-regionalne-ustaw-stolice-administrator-plus.png' });
      console.log('5 regionalne', JSON.stringify(hdr));
      await page.evaluate(() => document.querySelector('#civ-v-administrator') && document.querySelector('#civ-v-administrator').click());
      await wait(700);
      out.hdr5b = await headerInfo(page);
      await page.screenshot({ path: C.EVID + '/05-miasto-regionalne-administrator-zatrudniony.png' });
      console.log('5b regionalne po zatrudnieniu', JSON.stringify(out.hdr5b));
    }

    // 6) autobudowa w REALNEJ turze: miasto regionalne BEZ admina (zwolnij) vs stolica Z adminem (skarbiec pokrywa)
    await page.keyboard.press('Escape'); await wait(300);
    if (reg) {
      await page.evaluate((id) => window.__civTest.adminSetup(id, ['dom_starszyzny'], 2000, 'zrownowazone'), reg.id);
      out.stateReg = await page.evaluate((id) => window.__civTest.adminState(id), reg.id);
      // dla porównania: stolica z administratorem (zatrudnij ponownie jeśli trzeba)
      out.stateCapPre = await page.evaluate((id) => window.__civTest.adminSetup(id, ['palac'], 2000, 'zrownowazone'), cap.id);
      if (!out.stateCapPre.hired) await page.evaluate((id) => window.__civTest.adminHire(id), cap.id);
      const e = await C.endTurnAndWait(s);
      out.endTurn = e;
      out.afterCap = await page.evaluate((id) => window.__civTest.adminState(id), cap.id);
      out.afterReg = await page.evaluate((id) => window.__civTest.adminState(id), reg.id);
      console.log('6 po turze: stolica(admin)', JSON.stringify({ q: out.afterCap.queueLen, working: out.afterCap.working, treasury: out.afterCap.treasury }), 'regionalne', JSON.stringify({ q: out.afterReg.queueLen, hired: out.afterReg.hired }));
    }

    // 7) ikona: arkusz stanów (16/24 px, ciemny/jasny motyw) z realnego pliku SVG pieczęci
    const svg = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'icons', 'brand', 'chip-administrator.svg'), 'utf8');
    const ctx2 = await browser.newContext({ viewport: { width: 760, height: 360 } });
    const p2 = await ctx2.newPage();
    const icon = (size, cls, extra = '') => `<span class="ic ${cls}">${svg.replace(/width="40"/, `width="${size}"`).replace(/height="40"/, `height="${size}"`).replace(/#e8d88a/g, 'currentColor')}${extra}</span>`;
    const pick = '<g stroke-width="1.6"><path d="M14.5 19.5 20 14"></path><path d="M16.5 13.2c1.6-.4 3.2.2 4.3 1.4"></path></g>';
    const iconImp = (size) => `<span class="ic ok">${svg.replace(/width="40"/, `width="${size}"`).replace(/height="40"/, `height="${size}"`).replace(/#e8d88a/g, 'currentColor').replace('</svg>', pick + '</svg>')}</span>`;
    const row = (theme, bg, fg) => `<div class="row" style="background:${bg};color:${fg};--c:${theme === 'dark' ? '#e8d88a' : '#7a5c10'}"><b>${theme}</b> ` +
      [16, 24].map((sz) => `${icon(sz, 'ok')} ${icon(sz, 'idle', '<i>!</i>')} ${icon(sz, 'off')} ${iconImp(sz)}`).join(' &nbsp; ') + '</div>';
    await p2.setContent(`<style>body{font:14px system-ui;margin:12px}.row{padding:14px;margin:8px 0;border-radius:8px}.ic{display:inline-flex;position:relative;color:var(--c);vertical-align:middle;margin:0 6px;line-height:0}.idle svg{filter:grayscale(1);opacity:.55}.off svg{opacity:.45}.ic i{position:absolute;right:-5px;top:-5px;width:12px;height:12px;border-radius:50%;background:#c0392b;color:#fff;font:800 9px/12px system-ui;text-align:center;font-style:normal}</style>` +
      `<div>Pieczęć administratora — stany: pracuje / nie pracuje (!) / brak / wariant ulepszeń (16 px i 24 px)</div>` + row('dark', '#161c28', '#f0e6d0') + row('light', '#f3ead6', '#2a2208'));
    await p2.screenshot({ path: C.EVID + '/06-ikona-stany-16-24-jasna-ciemna.png' });
    await ctx2.close();

    out.errors = s.errors.slice(0, 10);
    C.save('city-administrator-live.json', out);
    await s.ctx.close();
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('LIVE FAIL', e); process.exit(1); });
