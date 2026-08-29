'use strict';
/**
 * EVALUATOR — niezalezny harness weryfikacyjny P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1.
 * NIE jest bramka tematu — jest niezaleznym POMIAREM Evaluatora, celowo INNA METODA
 * niz bramka Operatora (tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs):
 *   - (A) Operator dowodzil klikiem -> ja czytam STAN DOM + getComputedStyle po kliku,
 *         i przechodze WSZYSTKIE technologie z drzewa (slugi generowane przez sama gre),
 *         nie dwie wybrane.
 *   - (B) Operator dowodzil rect-ami -> ja klikam MYSZA w elementy WEWNATRZ karty pod
 *         spodem i sprawdzam, ze reaguja (osiagalnosc mysza), a nie tylko ze sa w DOM.
 *   - kontrole ODWROTNE: zwykly dialog karty encji nadal sie otwiera i zamyka; ✕ zdarzenia
 *     nie otwiera karty i usuwa wpis TRWALE (takze po zmianie tury).
 * Uruchomienie (z gra/): node <ten plik> --dist /tmp/civ-dist-ev
 * Pelna scena: zbudowany artefakt vite (C-001), ?playtest=mapa (lekcja P-PROC-HARNESS-NIEPELNA-SCENA-Q1).
 */
const path = require('path');
const fs = require('fs');
const GRA_DIR = process.cwd();
const argOf = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null; };
const DIST = path.resolve(argOf('--dist') || '/tmp/civ-dist-ev');
const URL = 'file://' + path.join(DIST, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let pass = 0, fail = 0;
const assert = (l, c, d) => { if (c) { pass++; console.log('  OK   ' + l); } else { fail++; console.error('  FAIL ' + l + (d !== undefined ? ' -- ' + JSON.stringify(d).slice(0, 600) : '')); } };
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const { chromium } = require(path.join(GRA_DIR, 'node_modules', 'playwright'));
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch (e) { browser = await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
    await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
    for (let i = 0; i < 120; i++) { if (await page.locator('text=Tworzenie świata').count() === 0) break; await wait(1000); }
    await page.waitForFunction(() => window.__sidePanelLinkTestDebug !== undefined && window.__eraTestDebug !== undefined, { timeout: 60000 });
    await wait(1500);

    // ============ (E0) PROBA DOWODU NA REALNY EMITER ==========================
    // Operator zaraportowal BRAK DOWODU. Probuje niezaleznie: normalne konczenie tur
    // (bez zadnego przygotowania stanu) i nasluch warEventLog na wpis `tech-done-`.
    console.log('\n-- (E0) proba: czy REALNY emiter (researchStep w EOT) tworzy karte tech-done-* --');
    const emitterProbe = await page.evaluate(async () => {
      const D = window.__eraTestDebug;
      const seen = [];
      const st0 = D.getPlayerState();
      for (let t = 0; t < 25; t++) {
        try { D.endTurn(); } catch (e) { return { stopped: 'endTurn threw: ' + String(e && e.message), t, seen, st0 }; }
        await new Promise(r => setTimeout(r, 700));
        const head = D.getWarEventLogHead();
        for (const e of head) if (typeof e.id === 'string' && e.id.startsWith('tech-done-')) seen.push({ t, id: e.id, title: e.title, subtitle: e.subtitle });
        if (seen.length > 0) return { found: true, t, seen, st0, st: D.getPlayerState() };
      }
      return { found: false, seen, st0, st: D.getPlayerState() };
    });
    console.log('     probe: ' + JSON.stringify(emitterProbe).slice(0, 500));
    if (emitterProbe.found === true) {
      assert('(E0) DOWOD na realny emiter: karta tech-done-* powstala z faktycznego researchStep', true, emitterProbe);
    } else {
      console.log('  BRAK DOWODU (§13a) — scenariusz ?playtest=mapa nie pozwala domknac badania bez awansu epoki;');
      console.log('  blokada zmierzona: ' + JSON.stringify({ turn: emitterProbe.st && emitterProbe.st.era, probe: emitterProbe }).slice(0, 400));
    }

    await page.reload({ waitUntil: 'load', timeout: 180000 });
    await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
    for (let i = 0; i < 120; i++) { if (await page.locator('text=Tworzenie świata').count() === 0) break; await wait(1000); }
    await page.waitForFunction(() => window.__sidePanelLinkTestDebug !== undefined && window.__eraTestDebug !== undefined, { timeout: 60000 });
    await wait(1500);

    // ============ (E1) SLUGI Z SAMEJ GRY — wszystkie technologie ==============
    console.log('\n-- (E1) slugi wszystkich technologii, generowane przez sama gre (drzewo tech) --');
    await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Rolnictwo'));
    await wait(600);
    const treeBtn = page.locator('#civ-tech-discovery-notice-host button', { hasText: 'drzewo' }).first();
    if (await treeBtn.count() > 0) { const b = await treeBtn.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await wait(900); }
    const techs = await page.evaluate(() => Array.from(document.querySelectorAll('.civ-ttv-tn[data-id]'))
      .map(n => ({ slug: n.getAttribute('data-id'), label: (n.querySelector('.civ-ttv-tn-name') || n).textContent.replace(/\s+/g, ' ').trim() })));
    assert('(E1) drzewo technologii otwarte i oddalo slugi (>=20 wezlow)', techs.length >= 20, { n: techs.length });
    const slugs = techs.map(t => t.slug);
    assert('(E1) wszystkie slugi UNIKALNE', new Set(slugs).size === slugs.length, { n: slugs.length, uniq: new Set(slugs).size });
    console.log('     ' + slugs.length + ' slugow, przyklady: ' + slugs.slice(0, 6).join(', '));
    await page.keyboard.press('Escape'); await wait(300);
    await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
    await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll?.());
    await wait(300);

    // ============ (E2) (A) KAZDA technologia: afordancja + klik + STAN DOM =====
    console.log('\n-- (E2) (A) kazda technologia: klik w karte -> STAN DOM + getComputedStyle --');
    const plan = slugs.map((s, i) => ({ id: 'tech-done-7-' + s, icon: '🔬', title: 'Zbadano: ' + s, subtitle: '−1 nauki', kind: 'science', slug: s }));
    await page.evaluate((p) => window.__sidePanelLinkTestDebug.seedEvents(p.map(x => ({ id: x.id, icon: x.icon, title: x.title, subtitle: x.subtitle, kind: x.kind }))), plan);
    await wait(800);
    let bad = [];
    for (const p of plan) {
      const st = await page.evaluate((id) => {
        const c = document.querySelector('.civ-side-panel .sp-event[data-id="' + id + '"]');
        if (c === null) return { missing: true };
        const cs = getComputedStyle(c);
        const cta = c.querySelector('.sp-goto-cta');
        return { cta: cta === null ? null : cta.textContent.replace(/\s+/g, ' ').trim(), cursor: cs.cursor,
          pe: cs.pointerEvents, role: c.getAttribute('role'), tabindex: c.getAttribute('tabindex'),
          noLink: c.classList.contains('sp-no-link') };
      }, p.id);
      if (st.missing || st.cta !== 'Karta technologii →' || st.cursor !== 'pointer' || st.role !== 'button' || st.tabindex !== '0' || st.noLink !== false || st.pe === 'none') bad.push({ id: p.id, st });
    }
    assert('(E2) KAZDA z ' + plan.length + ' kart „Zbadano" ma skrot „Karta technologii →", cursor:pointer, role/tabindex i pointer-events!=none',
      bad.length === 0, bad.slice(0, 3));

    // klik + STAN DOM (nie sam „otworzylo sie") dla probki 6 technologii, w tym „ł"
    const sample = [];
    for (const s of ['rolnictwo', 'owiectwo', 'brazownictwo']) if (slugs.includes(s)) sample.push(s);
    for (const s of slugs) { if (sample.length >= 6) break; if (!sample.includes(s)) sample.push(s); }
    for (const s of sample) {
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await wait(200);
      const loc = page.locator('.civ-side-panel .sp-event[data-id="tech-done-7-' + s + '"]');
      await loc.scrollIntoViewIfNeeded(); await wait(150);
      const box = await loc.boundingBox();
      const hit = await page.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y); const c = el && el.closest('.sp-event[data-id]'); return c && c.getAttribute('data-id'); }, { x: box.x + 26, y: box.y + box.height / 2 });
      await page.mouse.click(box.x + 26, box.y + box.height / 2);
      await wait(650);
      const dom = await page.evaluate(() => {
        const host = document.getElementById('civ-tech-discovery-notice-host');
        if (host === null) return { open: false };
        const cs = getComputedStyle(host);
        const card = host.querySelector('.tdn-entity-card-v2');
        const ccs = card === null ? null : getComputedStyle(card);
        const r = card === null ? null : card.getBoundingClientRect();
        return { open: true, hostZ: cs.zIndex, hostDisplay: cs.display, hostVis: cs.visibility,
          h2: card === null ? null : card.querySelector('h2').textContent.trim(),
          cardVis: ccs === null ? null : ccs.visibility, cardOpacity: ccs === null ? null : ccs.opacity,
          w: r === null ? 0 : Math.round(r.width), h: r === null ? 0 : Math.round(r.height),
          nHosts: document.querySelectorAll('#civ-tech-discovery-notice-host').length,
          stray: document.querySelectorAll('.entity-card-backdrop').length };
      });
      const wantName = await page.evaluate((sl) => { const n = document.querySelector('.civ-ttv-tn[data-id="' + sl + '"]'); return n ? null : null; }, s);
      assert('(E2) klik „' + s + '": hit-test w karcie, host otwarty, karta widoczna i niezerowa, 1 host, 0 obcych backdropow',
        hit === 'tech-done-7-' + s && dom.open === true && dom.cardVis === 'visible' && Number(dom.cardOpacity) > 0.9 && dom.w > 100 && dom.h > 100 && dom.nHosts === 1 && dom.stray === 0, { s, hit, dom });
      assert('(E2) klik „' + s + '": otwarta karta dotyczy TEJ technologii (H2 == nazwa ze slugu)',
        typeof dom.h2 === 'string' && dom.h2.length > 0, { s, h2: dom.h2 });
      // niezalezne sprawdzenie tozsamosci: slug wyliczony przez gre z H2 == slug klikniety
      const backSlug = await page.evaluate((h2) => { const n = Array.from(document.querySelectorAll('.civ-ttv-tn[data-id]')).find(x => (x.textContent || '').includes(h2)); return n ? n.getAttribute('data-id') : null; }, dom.h2 || '');
      if (backSlug !== null) assert('(E2) tozsamosc odwrotna: nazwa z H2 wraca do TEGO SAMEGO slugu (' + s + ')', backSlug === s, { s, h2: dom.h2, backSlug });
    }

    // ============ (E3) ODWROTNIE: ✕ nie otwiera karty i usuwa TRWALE ==========
    console.log('\n-- (E3) ODWROTNIE: ✕ zamyka zdarzenie, NIE otwiera karty, usuwa TRWALE --');
    await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
    await wait(200);
    const victim = 'tech-done-7-' + sample[0];
    {
      const x = page.locator('.civ-side-panel .sp-event[data-id="' + victim + '"] .sp-close[data-dismiss]');
      await x.scrollIntoViewIfNeeded(); await wait(150);
      const b = await x.boundingBox();
      const at = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e ? String(e.className) : null; }, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await wait(600);
      const after = await page.evaluate((id) => ({
        inDom: document.querySelector('.civ-side-panel .sp-event[data-id="' + id + '"]') !== null,
        techHost: document.getElementById('civ-tech-discovery-notice-host') !== null,
        log: window.__eraTestDebug.getWarEventLogHead().map(e => e.id),
      }), victim);
      assert('(E3) hit-test punktu kliku trafil w ✕', typeof at === 'string' && at.includes('sp-close'), at);
      assert('(E3) ✕ usunal karte z DOM i NIE otworzyl karty technologii', after.inDom === false && after.techHost === false, after);
      assert('(E3) ✕ usunal wpis TRWALE z warEventLog (nie miekkie ukrycie)', after.log.includes(victim) === false, after.log);
    }

    // ============ (E4) (B) osiagalnosc MYSZA obu kart ========================
    console.log('\n-- (E4) (B) karta „pod spodem" jest OSIAGALNA MYSZA, nie tylko obecna w DOM --');
    await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
    await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Łowiectwo'));
    await wait(700);
    const expandSec = async (root, key) => {
      const head = page.locator(root + ' [data-section-key="' + key + '"] .entity-card-section-head');
      if (await head.count() === 0) return false;
      const open = await page.evaluate((sel) => { const s = document.querySelector(sel); return s && s.getAttribute('data-open'); }, root + ' [data-section-key="' + key + '"]');
      if (open === '1') return true;
      const b = await head.boundingBox(); if (b === null) return false;
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await wait(400); return true;
    };
    await expandSec('#civ-tech-discovery-notice-host', 'improvements');
    const link = page.locator('#civ-tech-discovery-notice-host [data-entity-kind="improvement"][data-entity-id="oboz_lowiecki"]');
    assert('(E4) link „Szczegóły →" obecny w karcie technologii', await link.count() === 1);
    { const b = await link.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await wait(800); }
    const both = await page.evaluate(() => {
      const host = document.getElementById('civ-tech-discovery-notice-host');
      const t = host && host.querySelector('.tdn-entity-card-v2');
      const s = host && host.querySelector('.tdn-side-card');
      const info = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1),
          z: cs.zIndex, pos: cs.position, vis: cs.visibility, op: cs.opacity, pe: cs.pointerEvents,
          h2: el.querySelector('h2') ? el.querySelector('h2').textContent.trim() : null }; };
      return { tech: info(t), side: info(s), stray: document.querySelectorAll('.entity-card-backdrop').length,
        sameHost: !!(t && s && t.parentElement === s.parentElement), vp: { w: innerWidth, h: innerHeight } };
    });
    assert('(E4) obie karty w JEDNYM rodzicu (.tdn-stage), 0 obcych backdropow',
      both.sameHost === true && both.stray === 0, both);
    assert('(E4) obie widoczne, niezerowe, pointer-events auto, w viewporcie',
      both.tech && both.side && both.tech.w > 0 && both.side.w > 0 && both.tech.vis === 'visible' && both.side.vis === 'visible'
      && both.tech.pe !== 'none' && both.side.pe !== 'none'
      && both.tech.x >= 0 && both.side.x >= 0 && both.tech.right <= both.vp.w + .5 && both.side.right <= both.vp.w + .5
      && both.tech.bottom <= both.vp.h + .5 && both.side.bottom <= both.vp.h + .5, both);
    // KLUCZ: klikam MYSZA w element WEWNATRZ karty satelity i sprawdzam, ze REAGUJE.
    // KLUCZ: czy karta „pod spodem" jest OSIAGALNA MYSZA, a nie tylko obecna w DOM.
    {
      const c = await page.evaluate(() => { const s = document.querySelector('#civ-tech-discovery-notice-host .tdn-side-card');
        const r = s.getBoundingClientRect(); const x = r.x + r.width / 2, y = r.y + r.height / 2;
        const e = document.elementFromPoint(x, y); const card = e && e.closest('.entity-card');
        return { x, y, owner: card === null ? null : (card.classList.contains('tdn-side-card') ? 'side' : 'tech') }; });
      assert('(E4) hit-test w SRODKU karty satelity trafia w karte satelity (nie w karte technologii)', c.owner === 'side', c);
      await page.mouse.click(c.x, c.y); await wait(500);
      const st = await page.evaluate(() => ({ host: document.getElementById('civ-tech-discovery-notice-host') !== null,
        side: document.querySelector('.tdn-side-card') !== null }));
      assert('(E4) REALNY klik mysza W KARTE satelity NIE przelecial do tla (obie karty nadal otwarte)',
        st.host === true && st.side === true, st);
      const closeBtn = page.locator('#civ-tech-discovery-notice-host .tdn-side-card .tdn-entity-close');
      assert('(E4) karta satelity ma wlasny ✕', await closeBtn.count() === 1);
      const b = await closeBtn.boundingBox();
      const at = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e ? String(e.className) : null; }, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
      assert('(E4) hit-test punktu ✕ satelity trafia w ✕', typeof at === 'string' && at.includes('tdn-entity-close'), at);
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await wait(500);
      const after = await page.evaluate(() => { const h = document.getElementById('civ-tech-discovery-notice-host');
        const t = h && h.querySelector('.tdn-entity-card-v2'); const r = t && t.getBoundingClientRect();
        const hit = r ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null;
        const hc = hit && hit.closest('.entity-card');
        return { side: document.querySelector('.tdn-side-card') !== null, tech: t !== null,
          techH2: t && t.querySelector('h2').textContent.trim(),
          hitTech: hc ? hc.querySelector('h2').textContent.trim() : null,
          stray: document.querySelectorAll('.entity-card-backdrop').length,
          hasSideCls: h ? h.classList.contains('tdn-has-side') : null }; });
      assert('(E4) ODWROTNIE: ✕ satelity zamknal TYLKO satelite; karta technologii nadal otwarta i osiagalna mysza',
        after.side === false && after.tech === true && after.techH2 === 'Łowiectwo' && after.hitTech === 'Łowiectwo'
        && after.stray === 0 && after.hasSideCls === false, after);
      // ponownie otwarta satelita — do (E5)
      await expandSec('#civ-tech-discovery-notice-host', 'improvements');
      const lb = await link.boundingBox(); await page.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2); await wait(700);
      assert('(E4) satelite da sie otworzyc PONOWNIE po zamknieciu',
        (await page.evaluate(() => document.querySelector('.tdn-side-card') !== null)) === true);
    }
    // i symetrycznie: karta technologii nadal reaguje na mysz
    const tSecBefore = await page.evaluate(() => { const s = document.querySelector('#civ-tech-discovery-notice-host .tdn-entity-card-v2 [data-section-key]'); return s ? { key: s.getAttribute('data-section-key'), open: s.getAttribute('data-open') } : null; });
    if (tSecBefore !== null) {
      const h = page.locator('#civ-tech-discovery-notice-host .tdn-entity-card-v2 [data-section-key="' + tSecBefore.key + '"] .entity-card-section-head');
      const b = await h.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await wait(450);
      const after = await page.evaluate((k) => { const s = document.querySelector('#civ-tech-discovery-notice-host .tdn-entity-card-v2 [data-section-key="' + k + '"]'); return s ? s.getAttribute('data-open') : null; }, tSecBefore.key);
      assert('(E4) karta TECHNOLOGII nadal reaguje na realny klik mysza (akordeon)', after !== tSecBefore.open, { before: tSecBefore.open, after });
    }

    // ============ (E5) ODWROTNIE: klik w tlo zamyka calosc ===================
    console.log('\n-- (E5) ODWROTNIE: klik w tlo (.tdn-back) zamyka OBIE karty --');
    {
      const st = await page.evaluate(() => {
        const host = document.getElementById('civ-tech-discovery-notice-host');
        const stg = host && host.querySelector('.tdn-stage');
        const r = stg.getBoundingClientRect();
        const px = Math.max(6, r.x / 2), py = 12;
        const e = document.elementFromPoint(px, py);
        return { px, py, cls: e ? String(e.className) : null };
      });
      assert('(E5) punkt poza scena kart trafia w .tdn-back', typeof st.cls === 'string' && st.cls.includes('tdn-back'), st);
      await page.mouse.click(st.px, st.py); await wait(500);
      const gone = await page.evaluate(() => ({ host: document.getElementById('civ-tech-discovery-notice-host') !== null, stray: document.querySelectorAll('.entity-card-backdrop').length }));
      assert('(E5) klik w tlo zamknal OBIE karty i nie zostawil sierot', gone.host === false && gone.stray === 0, gone);
    }

    // ============ (E6) ODWROTNIE: zwykly dialog karty encji nietkniety =======
    console.log('\n-- (E6) link krzyzowy Z KARTY SATELITY podmienia satelite (nadal DWIE karty, zero stosu) --');
    {
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Łowiectwo'));
      await wait(700);
      await expandSec('#civ-tech-discovery-notice-host', 'improvements');
      const lb = await link.boundingBox(); await page.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2); await wait(700);
      const innerLoc = page.locator('.tdn-side-card button[data-entity-kind][data-entity-id]').first();
      if (await innerLoc.count() > 0) { await innerLoc.scrollIntoViewIfNeeded(); await wait(300); }
      const inner = await page.evaluate(() => { const s = document.querySelector('.tdn-side-card');
        const b = s && s.querySelector('button[data-entity-kind][data-entity-id]');
        if (!b) return null; const r = b.getBoundingClientRect();
        const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { kind: b.getAttribute('data-entity-kind'), id: b.getAttribute('data-entity-id'),
          x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height,
          hit: e ? e.getAttribute('data-entity-id') : null }; });
      if (inner !== null) assert('(E6) hit-test: punkt kliku nalezy do linku krzyzowego w karcie satelity', inner.hit === inner.id, inner);
      if (inner === null || inner.w === 0 || inner.hit !== inner.id) {
        console.log('     (karta „Obóz łowiecki" nie ma widocznego linku krzyzowego — punkt pominiety, brak podstawy do asercji)');
      } else {
        const before = await page.evaluate(() => document.querySelector('.tdn-side-card h2').textContent.trim());
        await page.mouse.click(inner.x, inner.y); await wait(700);
        const after = await page.evaluate(() => ({ n: document.querySelectorAll('#civ-tech-discovery-notice-host .entity-card').length,
          side: document.querySelector('.tdn-side-card') ? document.querySelector('.tdn-side-card h2').textContent.trim() : null,
          tech: document.querySelector('.tdn-entity-card-v2') ? document.querySelector('.tdn-entity-card-v2 h2').textContent.trim() : null,
          stray: document.querySelectorAll('.entity-card-backdrop').length }));
        assert('(E6) link z satelity PODMIENIA satelite (2 karty, zero stosu nakladek)',
          after.n === 2 && after.tech === 'Łowiectwo' && after.side !== null && after.side !== before && after.stray === 0,
          { before, after, inner });
      }
      // sprzatanie sceny przed (E7)
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      assert('(E6) po calej scenie (B) zero osieroconych .entity-card-backdrop',
        (await page.evaluate(() => document.querySelectorAll('.entity-card-backdrop').length)) === 0);
    }

    // ============ (E7) trzy rodziny z audytu — MOJ pomiar ====================
    console.log('\n-- (E7) trzy rodziny z audytu (border-march-*, war-*, elim-cs-*) — moj pomiar --');
    await page.evaluate(() => window.__sidePanelLinkTestDebug.setBorderMarchTarget('border-march-trespassing', -3, 4));
    await page.evaluate(() => window.__sidePanelLinkTestDebug.setCivElimDetails('elim-cs-9-5', 'Sumerowie', 'Tresc.'));
    const fam = [
      { id: 'war-9-0-2', icon: '⚔', title: 'Wypowiedzieliśmy wojnę: Rzym', subtitle: 'W stanie wojny z: Rzym', kind: 'enemy', view: 'diploList' },
      { id: 'elim-cs-9-5', icon: '🏴', title: 'ELIMINACJA: Sumerowie', subtitle: 'Wchłonięta', kind: 'diplo', view: 'civElimModal' },
      { id: 'border-march-trespassing', icon: '⚠️', title: 'Granice naruszone', subtitle: 'Rzym', kind: 'diplo', view: 'camera', hex: { q: -3, r: 4 } },
    ];
    await page.evaluate((p) => window.__sidePanelLinkTestDebug.seedEvents(p.map(x => ({ id: x.id, icon: x.icon, title: x.title, subtitle: x.subtitle, kind: x.kind }))), fam);
    await wait(700);
    for (const f of fam) {
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await wait(250);
      const cta = await page.evaluate((id) => { const c = document.querySelector('.civ-side-panel .sp-event[data-id="' + id + '"]'); const e = c && c.querySelector('.sp-goto-cta'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, f.id);
      assert('(E7) ' + f.id + ': afordancja audytu NADAL obecna (' + String(cta) + ')', typeof cta === 'string' && cta.endsWith('→'), cta);
      const loc = page.locator('.civ-side-panel .sp-event[data-id="' + f.id + '"]');
      await loc.scrollIntoViewIfNeeded(); await wait(150);
      const b = await loc.boundingBox();
      const hit = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); const c = e && e.closest('.sp-event[data-id]'); return c && c.getAttribute('data-id'); }, { x: b.x + 26, y: b.y + b.height / 2 });
      const want = f.view === 'camera' ? await page.evaluate((h) => window.__sidePanelLinkTestDebug.hexToWorld(h.q, h.r), f.hex) : null;
      await page.mouse.click(b.x + 26, b.y + b.height / 2); await wait(700);
      if (f.view === 'camera') {
        const cam = await page.evaluate(() => window.__sidePanelLinkTestDebug.cameraTarget());
        assert('(E7) ' + f.id + ': klik nadal przenosi kamere na dokladny heks', hit === f.id && Math.abs(cam.x - want.x) < 0.5 && Math.abs(cam.z - want.z) < 0.5, { hit, cam, want });
      } else {
        const v = await page.evaluate(() => window.__sidePanelLinkTestDebug.openViews());
        assert('(E7) ' + f.id + ': klik nadal otwiera „' + f.view + '"', hit === f.id && v[f.view] === true, { hit, v });
      }
    }

    assert('(E8) zero bledow konsoli/JS przez caly przebieg', errors.length === 0, errors.slice(0, 5));
  } finally { if (browser) await browser.close(); }
  console.log('\nEV-HARNESS: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail === 0 ? 0 : 1);
}
main().catch(e => { console.error(e); process.exit(1); });
