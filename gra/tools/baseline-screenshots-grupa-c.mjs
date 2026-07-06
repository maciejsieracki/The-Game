/**
 * Baseline screenshoty UX — Grupa C (walka).
 * Uruchom: node tools/baseline-screenshots-grupa-c.mjs
 * Wyjście: docs/ux/baseline/C/*.png
 *
 * Uwaga: build Gra-podglad-BITWA.html pomija overlay deploymentu (deploy:false w praktyce).
 * C-06 robimy z Gra-podglad.html (T → Bitwa ręczna) — ten sam _buildDeployOverlay co BITWA.
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const OUT = join(ROOT, 'docs/ux/baseline/C');

const VIEWPORT = { width: 1280, height: 800 };

function fileUrl(relPath) {
  return 'file:///' + join(ROOT, relPath).replace(/\\/g, '/').replace(/ /g, '%20');
}

async function waitMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page, name, opts = {}) {
  const path = join(OUT, name);
  await page.screenshot({ path, type: 'png', ...opts });
  console.log('  OK', name);
}

async function startNewGame(page, html = 'Gra-podglad.html') {
  await page.goto(fileUrl(html), { waitUntil: 'load', timeout: 120_000 });
  if (html === 'Gra-podglad-BITWA.html') {
    await page.waitForSelector('canvas', { timeout: 120_000 });
    await waitMs(6000);
    return;
  }
  await page.waitForSelector('.civ-menu', { timeout: 120_000 });
  await waitMs(1500);
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
  await waitMs(6000);
}

async function openManualBattleFromMap(page) {
  await page.keyboard.press('t');
  await waitMs(1500);
  await page.locator('button').filter({ hasText: /POLE BITWY|Bitwa r/i }).first().click();
}

async function capturePreBattle(page) {
  console.log('C-01 pre-bitwa (Gra-podglad.html + T)');
  await startNewGame(page);
  await page.keyboard.press('t');
  await page.locator('button').filter({ hasText: /POLE BITWY|Bitwa r/i }).first().waitFor({ timeout: 20_000 });
  await waitMs(800);
  await shot(page, 'C-01_pre-bitwa.png');
}

async function captureDeployment(page) {
  console.log('C-06 deployment (Gra-podglad.html — BITWA.html pomija deploy)');
  await startNewGame(page);
  await openManualBattleFromMap(page);
  await page.locator('#deploy-overlay').waitFor({ state: 'visible', timeout: 45_000 });
  await waitMs(1000);
  await shot(page, 'C-06_deployment.png');
}

async function injectEndScreen(page) {
  await page.evaluate(() => {
    const old = document.getElementById('__baseline_end_screen__');
    if (old) old.remove();
    const panel = document.createElement('div');
    panel.id = '__baseline_end_screen__';
    Object.assign(panel.style, {
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      minWidth: '420px', padding: '24px 28px', background: 'rgba(18,16,14,0.96)',
      border: '2px solid #c8a050', borderRadius: '10px', boxShadow: '0 0 40px rgba(0,0,0,0.8)',
      color: '#f0e8d0', fontFamily: 'serif', textAlign: 'center', zIndex: '10002',
    });
    panel.innerHTML = '<div style="font-size:30px;font-weight:bold;color:#f0e060;text-shadow:0 0 16px #ff8800,2px 2px 4px #000;margin-bottom:18px;">Zwyciestwo ATAKUJACEGO!</div>'
      + '<div style="font-size:16px;line-height:1.5;margin-bottom:20px;text-align:left;">'
      + '<div style="margin:6px 0;"><span style="color:#ff6b6b;font-weight:bold;">Atakujacy</span> &mdash; padli/rozbici: <b>1</b>, pozostali na polu: <b>3</b> (z 4)<br><span style="opacity:.8;font-size:13px;">HP: 180 / 240</span></div>'
      + '<div style="margin:6px 0;"><span style="color:#6ba8ff;font-weight:bold;">Obronca</span> &mdash; padli/rozbici: <b>4</b>, pozostali na polu: <b>0</b> (z 4)<br><span style="opacity:.8;font-size:13px;">HP: 0 / 280</span></div>'
      + '</div>'
      + '<button type="button" style="font-size:15px;padding:10px 22px;margin-right:12px;background:#3a4a6a;color:#fff;border:none;border-radius:4px;cursor:pointer;">Szczegoly</button>'
      + '<button type="button" style="font-size:16px;padding:10px 26px;background:#2f6f4f;color:#fff;border:none;border-radius:4px;cursor:pointer;">Zakoncz bitwe</button>';
    document.body.appendChild(panel);
  });
}

async function captureBitwaPreset(page) {
  console.log('C-07…C-21 (Gra-podglad-BITWA.html + T → pole bitwy)');
  await startNewGame(page, 'Gra-podglad-BITWA.html');
  await openManualBattleFromMap(page);
  await waitMs(6000);

  await shot(page, 'C-07_pole-bitwy.png');
  await shot(page, 'C-08_hud-gora-bitwa.png', {
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: 72 },
  });
  await shot(page, 'C-09_pasek-komend.png', {
    clip: { x: 0, y: VIEWPORT.height - 88, width: VIEWPORT.width, height: 88 },
  });

  await injectEndScreen(page);
  await waitMs(400);
  await shot(page, 'C-21_ekran-konca-bitwy.png');
  console.log('  OK C-21 (panel wstrzyknięty — ten sam markup co battleScene._showEndScreen)');
}

async function captureOblezenieMurHud(page) {
  const url = fileUrl('Gra-podglad-OBLEZENIE-BITWA.html');
  console.log('C-19 (Gra-podglad-OBLEZENIE-BITWA.html):', url);
  await page.goto(url, { waitUntil: 'load', timeout: 120_000 });
  await waitMs(6000);

  await page.locator('#deploy-overlay').waitFor({ state: 'visible', timeout: 45_000 });
  await page.getByRole('button', { name: /Start walki/i }).click();
  await waitMs(6000);

  await page.locator('div').filter({ hasText: /^Brama:/ }).first().waitFor({ timeout: 20_000 });
  await waitMs(800);
  await shot(page, 'C-19_oblezenie-mur-hud.png');
}

async function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl'],
  });

  try {
    const page = await browser.newPage({ viewport: VIEWPORT });
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.warn('[page]', msg.text());
    });

    await capturePreBattle(page);
    await captureDeployment(page);
    await captureBitwaPreset(page);
    await captureOblezenieMurHud(page);

    console.log('\nBaseline Grupa C zapisany w:', OUT);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('baseline-screenshots-grupa-c FAILED:', err);
  process.exit(1);
});
