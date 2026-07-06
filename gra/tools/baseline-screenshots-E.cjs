/**
 * Baseline screenshoty UX — Grupa E (menu, kreator, meta).
 * Uruchom: node tools/baseline-screenshots-E.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/ux/baseline/E');
const GAME_URL = process.env.BASELINE_GAME_URL || 'http://127.0.0.1:17876/Gra-podglad.html';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  if (!process.env.BASELINE_GAME_URL) {
    const htmlPath = path.join(ROOT, 'Gra-podglad.html');
    if (!fs.existsSync(htmlPath)) {
      console.error('Brak Gra-podglad.html:', htmlPath);
      process.exit(1);
    }
  }
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Otwieram', GAME_URL);
  await page.goto(GAME_URL, { waitUntil: 'load', timeout: 120000 });

  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(2500);

  await page.screenshot({ path: path.join(OUT, 'E-01_menu-glowne.png'), fullPage: false });
  console.log('OK E-01');

  await page.getByRole('button', { name: /Ustawienia/i }).click();
  await page.waitForSelector('#cm-settings.active', { timeout: 10000 });
  await wait(400);
  await page.screenshot({ path: path.join(OUT, 'E-03_ustawienia.png') });
  console.log('OK E-03');

  await page.locator('#cm-back').click();
  await page.waitForSelector('#cm-menu.active', { timeout: 10000 });

  await page.locator('.civ-menu .mbtn.primary').click();
  await page.waitForSelector('.civ-newgame', { timeout: 15000 });
  await wait(400);

  await page.locator('.civ-newgame button.cta').click();
  await page.waitForSelector('.civ-newgame .epoch-grid', { timeout: 10000 });
  await wait(500);
  await page.screenshot({ path: path.join(OUT, 'E-09_kreator-krok2-epoka.png') });
  console.log('OK E-09');

  await page.locator('.civ-newgame button.nb.next').click();
  await page.waitForSelector('.civ-newgame .civ-grid', { timeout: 10000 });
  await wait(500);
  await page.screenshot({ path: path.join(OUT, 'E-10_kreator-krok3-cywilizacja.png') });
  console.log('OK E-10');

  await page.locator('.civ-newgame button.nb.next').click();
  await page.waitForSelector('.civ-newgame .sett-grid', { timeout: 10000 });
  await wait(500);
  await page.screenshot({ path: path.join(OUT, 'E-11_kreator-krok4-ustawienia.png') });
  console.log('OK E-11');

  // E-15: overlay jak w main.ts showGameOverOverlay (nie da się szybko wywołać zwycięstwa w playteście)
  await page.evaluate(() => {
    const old = document.getElementById('__gameover_overlay__');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = '__gameover_overlay__';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.82)', 'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center', 'z-index:9000',
      'font:bold 20px/1.4 serif', 'color:#ffd700', 'text-align:center', 'padding:20px',
    ].join(';');
    const title = document.createElement('div');
    title.innerHTML = 'ZWYCIESTWO — dominacja typu';
    title.style.cssText = 'font-size:2em;margin-bottom:24px;text-shadow:0 0 20px currentColor';
    overlay.appendChild(title);
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:0.8em;color:#aaa;margin-bottom:32px';
    sub.textContent = 'Gratulacje! Zbudowales potezne imperium.';
    overlay.appendChild(sub);
    const btn = document.createElement('button');
    btn.textContent = 'Nowa gra';
    btn.style.cssText = 'padding:12px 32px;font:bold 16px serif;background:#ffd700;color:#111;border:none;border-radius:8px;cursor:pointer;letter-spacing:0.05em';
    overlay.appendChild(btn);
    document.body.appendChild(overlay);
  });
  await wait(300);
  await page.screenshot({ path: path.join(OUT, 'E-15_game-over.png') });
  console.log('OK E-15 (overlay wstrzyknięty — ten sam markup co silnik)');

  await browser.close();
  const count = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).length;
  console.log('Grupa E baseline:', count, 'plików w', OUT);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
