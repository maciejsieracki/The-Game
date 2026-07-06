/**
 * Baseline screenshoty UX — Grupa D (dyplomacja).
 * Uruchom: node tools/baseline-screenshots-grupa-d.cjs
 * Wyjście: docs/ux/baseline/D/*.png
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/ux/baseline/D');
const VIEWPORT = { width: 1280, height: 800 };

function fileUrl(relPath) {
  return 'file:///' + path.join(ROOT, relPath).replace(/\\/g, '/').replace(/ /g, '%20');
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page, name, opts = {}) {
  const outPath = path.join(OUT, name);
  await page.screenshot({ path: outPath, type: 'png', ...opts });
  console.log('  OK', name);
}

async function startNewGame(page) {
  await page.goto(fileUrl('Gra-podglad.html'), { waitUntil: 'load', timeout: 120_000 });
  await page.waitForSelector('.civ-menu', { timeout: 120_000 });
  await wait(1500);
  await page.locator('.civ-menu .mbtn.primary').click();
  await page.waitForSelector('.civ-newgame', { timeout: 15_000 });
  await page.locator('.civ-newgame button.cta').click();
  await page.waitForSelector('.civ-newgame .epoch-grid', { timeout: 10_000 });
  await page.locator('.civ-newgame button.nb.next').click();
  await page.waitForSelector('.civ-newgame .civ-grid', { timeout: 10_000 });
  await page.locator('.civ-newgame button.nb.next').click();
  await page.waitForSelector('.civ-newgame button.start', { timeout: 10_000 });
  await page.locator('.civ-newgame button.start').click();
  await page.waitForSelector('canvas', { timeout: 120_000 });
  await wait(6000);
}

async function openDiploList(page) {
  await page.locator('.tb[data-act="diplo"]').click();
  await page.waitForSelector('.civ-diplo-list-hud.open', { timeout: 10_000 });
  await wait(400);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });

  console.log('D-02…D-06 (Gra-podglad.html dyplomacja)');
  await startNewGame(page);

  await openDiploList(page);
  await shot(page, 'D-02_lista-dyplomacji.png');

  const firstEntry = page.locator('.civ-diplo-list-hud .dl-item').first();
  await firstEntry.waitFor({ state: 'visible', timeout: 10_000 });
  await firstEntry.click();
  await page.waitForSelector('.civ-diplo-aud', { timeout: 10_000 });
  await wait(600);
  await shot(page, 'D-03_audiencja.png');

  const grid = page.locator('.civ-diplo-aud-grid');
  await grid.waitFor({ state: 'visible', timeout: 10_000 });
  const gridBox = await grid.boundingBox();
  if (gridBox) {
    await shot(page, 'D-04_karty-akcji.png', { clip: gridBox });
  } else {
    await shot(page, 'D-04_karty-akcji.png');
  }

  const contactCard = page.locator('.civ-diplo-aud-card').filter({ hasText: /Nawi/i }).first();
  if (await contactCard.count() && !(await contactCard.evaluate((el) => el.classList.contains('locked')))) {
    await contactCard.click();
    await wait(800);
  }

  const warCard = page.locator('.civ-diplo-aud-card').filter({ hasText: /Wypowiedzenie wojny|wojny/i }).first();
  await warCard.waitFor({ state: 'visible', timeout: 10_000 });
  const warLocked = await warCard.evaluate((el) => el.classList.contains('locked'));
  if (!warLocked) {
    await warCard.click();
    await page.waitForSelector('.civ-diplo-modal-overlay', { timeout: 10_000 });
    await wait(400);
    await shot(page, 'D-05_modal-wojna.png');
  } else {
    console.warn('  WARN: karta wojny zablokowana — D-05 wstrzyknięty modal (markup showWarConfirmModal)');
    await page.evaluate(() => {
      const old = document.querySelector('.civ-diplo-modal-overlay');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.className = 'civ-diplo-modal-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML =
        '<div class="civ-diplo-modal" role="dialog" aria-modal="true" style="background:rgba(20,24,32,0.98);border:1px solid rgba(224,178,74,0.4);border-radius:8px;padding:16px 20px;max-width:320px;color:#e8ebf0;font:13px monospace;">'
        + '<h3 style="margin:0 0 10px;font-size:0.9em;color:#e0b24a;">Wypowiedzieć wojnę?</h3>'
        + '<p style="margin:0 0 14px;line-height:1.45;color:#c0c8d4;">Na pewno wypowiadasz wojnę <strong>Sparta</strong>?</p>'
        + '<div class="cd-modal-btns" style="display:flex;gap:8px;justify-content:flex-end;">'
        + '<button type="button" class="cd-modal-cancel" style="padding:5px 14px;border-radius:4px;font:12px monospace;border:1px solid rgba(224,178,74,0.35);background:rgba(80,90,100,0.3);color:#d0d6de;">Anuluj</button>'
        + '<button type="button" class="cd-modal-ok" style="padding:5px 14px;border-radius:4px;font:12px monospace;border:1px solid rgba(211,55,55,0.5);background:rgba(211,55,55,0.25);color:#ffd0cc;">Tak</button>'
        + '</div></div>';
      document.body.appendChild(overlay);
    });
    await wait(300);
    await shot(page, 'D-05_modal-wojna.png');
  }

  await page.evaluate(() => {
    const old = document.querySelector('.civ-dip-pend');
    if (old) old.remove();
    const root = document.createElement('div');
    root.className = 'civ-dip-pend';
    root.style.cssText = 'position:fixed;inset:0;z-index:820;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);font:13px Segoe UI,Tahoma,sans-serif;color:#e8ebf0;';
    const box = document.createElement('div');
    box.className = 'civ-dip-box';
    box.style.cssText = 'min-width:300px;max-width:420px;background:#1a2030;border:2px solid rgba(90,155,212,0.45);border-radius:10px;padding:16px 18px;box-shadow:0 12px 40px rgba(0,0,0,0.65);';
    box.innerHTML = '<h2 style="margin:0 0 6px;font-size:16px;color:#5a9bd4;">🤝 Propozycja handlu</h2>'
      + '<p style="margin:0 0 14px;font-size:12px;color:#b8c0cc;line-height:1.45;">Sparta proponuje umowę handlową: 20 Pracy za 15 Pieniędzy. Odpowiedź wymagana przed końcem tury.</p>'
      + '<div class="civ-dip-btns" style="display:flex;gap:8px;">'
      + '<button type="button" class="civ-dip-acc" style="flex:1;padding:9px;border-radius:6px;font-weight:600;border:none;background:#2a6a3a;color:#fff;">Akceptuj</button>'
      + '<button type="button" class="civ-dip-rej" style="flex:1;padding:9px;border-radius:6px;font-weight:600;border:none;background:#5a3030;color:#ffd0cc;">Odrzuć</button>'
      + '</div>';
    root.appendChild(box);
    document.body.appendChild(root);
  });
  await wait(300);
  await shot(page, 'D-06_modal-propozycja-ai.png');
  console.log('  OK D-06 (modal wstrzyknięty — ten sam markup co diplomacyPendingHud.ts)');

  await browser.close();
  const count = fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).length;
  console.log('\nBaseline Grupa D:', count, 'plików w', OUT);
}

main().catch((e) => {
  console.error('baseline-screenshots-grupa-d FAILED:', e);
  process.exit(1);
});
