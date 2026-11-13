'use strict';
/**
 * R-WEB-UI-RAW-HTML-IN-RECRUIT-PANEL-STOCK-Q1 — twardy test regresyjny: chipy surowców (ikona + liczba)
 * nie mogą trafiać do UI jako WIDOCZNY tekst HTML. Prawdziwe moduły UI ładowane przez Vite HTTP
 * (createServer, bez `npm run dev`), prawdziwe ikony (brandAssets), Chromium.
 *
 * Sprawdza textContent wyrenderowanych elementów: brak '<span', '&lt;span', 'class="bld-res-chip',
 * '<svg', '&lt;svg'; oraz że chip faktycznie jest elementem DOM z <svg> (ikona + liczba).
 * Sekcje: panel imperium → Rekrutacja (Magazyn), karta encji (resources + valueParts), same chipy.
 *
 * Run z gra/: node tools/ui-resource-chip-no-raw-html-test.cjs [--shot=<dir>]
 * Mutacja: przywrócenie `esc(stock)` w renderMassRecruitmentSection MUSI zaświecić test na czerwono.
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const { createServer } = require(path.join(GRA, 'node_modules', 'vite'));
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const shotArg = (process.argv.find(a => a.startsWith('--shot=')) || '').slice(7);

let pass = 0, fail = 0;
const ok = (c, n, d) => {
  if (c) { pass++; console.log('PASS: ' + n); }
  else { fail++; console.log('FAIL: ' + n + (d !== undefined ? ' — ' + JSON.stringify(d).slice(0, 400) : '')); }
};

(async () => {
  const server = await createServer({ root: GRA, logLevel: 'error', server: { port: 0, host: '127.0.0.1' }, appType: 'custom' });
  await server.listen();
  const addr = server.httpServer.address();
  const base = `http://127.0.0.1:${addr.port}`;
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--headless=new'] });
  try {
    const page = await browser.newPage({ viewport: { width: 520, height: 900 } });
    await page.route(base + '/__blank', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body style="background:#1b2230;color:#d8dee9"><div id="host" style="width:440px"></div></body></html>' }));
    await page.goto(base + '/__blank');
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));

    const res = await page.evaluate(async () => {
      const emp = await import('/src/ui/empireDetailPanel.ts');
      const chipMod = await import('/src/ui/resourceAmountChip.ts');
      const card = await import('/src/ui/entityCards/renderer.ts');
      const host = document.getElementById('host');
      const style = document.createElement('style');
      style.textContent = chipMod.RESOURCE_CHIP_CSS;
      document.head.appendChild(style);

      // 1) Panel imperium → Rekrutacja (to miejsce zgłoszone przez właściciela).
      const mass = { ownerId: 0, treasury: 48, manpower: 4000, stock: { glina: 364, drewno: 937, kamien: 4 }, queuedCount: 0, completedCount: 0 };
      const sec = document.createElement('div');
      sec.id = 'sec-mass';
      sec.innerHTML = emp.renderMassRecruitmentSection([], mass);
      host.appendChild(sec);

      // 2) Karta encji: wiersz z resources + valueParts (chip z danych adaptera).
      const cardEl = card.renderEntityCard({
        kind: 'building', id: 'x', title: 'Test', medallion: { kind: 'icon', svg: '' }, sections: [{ key: 'k', title: 'T', rows: [
          { label: 'Koszt', value: '', resources: [{ id: 'glina', amount: 12 }, { id: 'drewno', amount: '<b>7</b>' }] },
          { label: 'Utrzymanie', value: '', valueParts: ['Zużywa ', { id: 'kamien', amount: 3 }, ' na turę'] },
        ] }],
      });
      cardEl.id = 'sec-card';
      host.appendChild(cardEl);

      // 3) Same chipy: autor danych nie wstrzyknie znaczników przez kwotę/klucz.
      const raw = document.createElement('div');
      raw.id = 'sec-raw';
      raw.innerHTML = chipMod.resourceAmountChipHtml('glina', chipMod.escapeHtmlText('<img src=x onerror=1>')) + ' · ' + chipMod.resourceAmountChipHtml('"><x>', '1');
      host.appendChild(raw);

      const out = {};
      for (const id of ['sec-mass', 'sec-card', 'sec-raw']) {
        const e = document.getElementById(id);
        out[id] = {
          text: e ? e.textContent : null,
          chips: e ? e.querySelectorAll('.bld-res-chip').length : 0,
          chipSvgs: e ? e.querySelectorAll('.bld-res-chip svg').length : 0,
          injected: e ? e.querySelectorAll('img[src="x"], x').length : 0,
        };
      }
      const pool = document.querySelector('#sec-mass .civ-emp-mass-pool');
      out.pool = pool ? { text: pool.textContent, chips: pool.querySelectorAll('.bld-res-chip').length, svgs: pool.querySelectorAll('.bld-res-chip svg').length } : null;
      return out;
    });

    const BAD = ['<span', '&lt;span', 'class="bld-res-chip', '<svg', '&lt;svg'];
    for (const id of ['sec-mass', 'sec-card', 'sec-raw']) {
      const t = res[id].text || '';
      const hit = BAD.filter(b => t.includes(b));
      ok(res[id].text !== null && hit.length === 0, `${id}: textContent bez surowego HTML chipów`, { hit, t: t.slice(0, 200) });
    }
    ok(res.pool && res.pool.chips === 3, 'Rekrutacja/Magazyn: 3 chipy jako elementy DOM (Glina, Drewno, Kamień)', res.pool);
    ok(res.pool && res.pool.svgs === 3, 'Rekrutacja/Magazyn: każdy chip ma ikonę <svg>', res.pool);
    ok(res.pool && /364/.test(res.pool.text) && /937/.test(res.pool.text) && /Magazyn:/.test(res.pool.text), 'Rekrutacja/Magazyn: liczby 364/937 widoczne', res.pool && res.pool.text);
    ok(res['sec-card'].chips === 3 && res['sec-card'].chipSvgs === 3, 'karta encji: 3 chipy z ikonami', res['sec-card']);
    ok(res['sec-raw'].injected === 0, 'XSS: kwota i klucz escapowane raz (brak wstrzykniętych elementów)', res['sec-raw']);
    ok(errors.length === 0, 'brak błędów strony', errors);

    if (shotArg) {
      fs.mkdirSync(shotArg, { recursive: true });
      await page.locator('#sec-mass .civ-emp-mass-pool').screenshot({ path: path.join(shotArg, 'recruit-pool.png') });
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
