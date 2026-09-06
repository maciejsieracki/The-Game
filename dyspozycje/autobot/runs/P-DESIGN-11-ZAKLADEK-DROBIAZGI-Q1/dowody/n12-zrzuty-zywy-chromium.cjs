'use strict';
/**
 * P-DESIGN-11-ZAKLADEK-DROBIAZGI-Q1 / N12 — zrzuty z ŻYWEGO Chromium (§9 poz. 6a).
 *
 * Cztery zakładki panelu imperium (Surowce, Handel, Armia, Kultura) w PRAWDZIWEJ grze:
 * realny `vite build` (jedyna dozwolona komenda buildu, C-001, `--outDir` poza drzewem repo
 * z unikalnym sufiksem), realny headless Chromium, realny `doStartGame`, realny klik chipa HUD
 * (`[data-act=...]`) — ta sama ścieżka, którą klika gracz.
 *
 * Wariant PRZED budowany jest z LUSTRA `gra/` w `os.tmpdir()` (`src` = kopia, mutowana
 * wyłącznie tam) ze stanem sprzed naprawy N12: ikona eyebrow WYŁĄCZNIE w Surowcach.
 * Worktree nie jest mutowany ani przez chwilę.
 *
 * Użycie (z gra/): node <ten plik> --out <katalog na PNG>
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const REAL_GRA = fs.existsSync(path.join(GRA, 'src', 'main.ts'))
  ? GRA
  : '/home/user/wt-design-zakladki/gra';
const { chromium } = require(path.join('/home/user/The-Game/gra', 'node_modules', 'playwright'));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const outIdx = process.argv.indexOf('--out');
const OUT_DIR = outIdx > -1 ? path.resolve(process.argv[outIdx + 1]) : path.resolve('./n12-shots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const reuseIdx = process.argv.indexOf('--reuse');
const TMP_ROOT = reuseIdx > -1
  ? process.argv[reuseIdx + 1]
  : fs.mkdtempSync(path.join(os.tmpdir(), `n12-shots-${process.pid}-`));
fs.mkdirSync(TMP_ROOT, { recursive: true });
console.log('[n12-shots] TMP_ROOT=' + TMP_ROOT);

/** Ikony eyebrow dołożone naprawą N12 — usuwane w wariancie PRZED. */
const N12_ICONS = ['cp-trade', 'tb-army', 'cp-culture'];

/** Cztery zakładki: chip HUD `data-act` -> nazwa pliku. */
const TABS = [
  { act: 'surowce', name: 'surowce' },
  { act: 'handel', name: 'handel' },
  { act: 'armia', name: 'armia' },
  { act: 'kultura', name: 'kultura' },
];

function mirrorGra(dest, mutate) {
  if (fs.existsSync(dest)) return dest;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(REAL_GRA, 'src'), path.join(dest, 'src'), { recursive: true });
  for (const link of ['data', 'node_modules']) {
    fs.symlinkSync(path.join(REAL_GRA, link), path.join(dest, link));
  }
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) {
    fs.copyFileSync(path.join(REAL_GRA, f), path.join(dest, f));
  }
  if (mutate) {
    const p = path.join(dest, 'src', 'ui', 'empireDetailPanel.ts');
    let s = fs.readFileSync(p, 'utf8');
    for (const ic of N12_ICONS) {
      const span = `<span class="civ-emp-res-hdr-ic" aria-hidden="true">\${brandIconSvg('${ic}', 14)}</span>`;
      if (!s.includes(span)) throw new Error(`kotwica PRZED nieaktualna: ${ic}`);
      s = s.split(span).join('');
    }
    fs.writeFileSync(p, s, 'utf8');
  }
  return dest;
}

function buildVariant(srcDir, label) {
  const outDir = path.join(TMP_ROOT, `dist-${label}`);
  if (fs.existsSync(path.join(outDir, 'index.html'))) {
    console.log(`[n12-shots] build (${label}) juz istnieje -> ${outDir}`);
    return path.join(outDir, 'index.html');
  }
  console.log(`[n12-shots] vite build (${label}) -> ${outDir}`);
  execSync(
    `node ${JSON.stringify(path.join(REAL_GRA, 'node_modules/vite/bin/vite.js'))} build`
    + ` --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: srcDir, stdio: ['ignore', 'ignore', 'inherit'], timeout: 20 * 60 * 1000 },
  );
  const idx = path.join(outDir, 'index.html');
  if (!fs.existsSync(idx)) throw new Error(`build ${label} nie wyprodukowal index.html`);
  return idx;
}

async function launch() {
  // Te same argumenty co `ai-buduje-budynki-test.cjs` — bez programowego GL generacja mapy
  // nigdy nie konczy sie w headless (nakladka „Tworzenie swiata" zostaje na ekranie).
  return await chromium.launch({
    headless: true, executablePath: FALLBACK_CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
}

async function pollUntil(page, checkFn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(checkFn);
    if (last && last.ready) return last;
    await page.waitForTimeout(1000);
  }
  throw new Error(`timeout czekajac na ${what}: ${JSON.stringify(last)}`);
}

async function shootVariant(browser, indexHtml, label) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto('file://' + indexHtml, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(
    () => !!window.__aiBuildingsTestDebug && !!window.__cityStateStartUnitsTestDebug,
    null, { timeout: 180000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  await page.evaluate(() => window.__aiBuildingsTestDebug.startNewGame({ rivals: '4', cityStates: 1, civTypes: 3 }));

  // Sekwencja 1:1 z `ai-buduje-budynki-test.cjs`: generacja mapy -> zalozenie pierwszego
  // miasta gracza -> dopiero wtedy panel imperium ma czym wypelnic zakladki.
  await pollUntil(page, () => {
    const dbg = window.__cityStateStartUnitsTestDebug;
    if (!dbg) return { ready: false };
    const overlayVisible = Array.from(document.querySelectorAll('*')).some(
      (el) => el.textContent && el.textContent.includes('Tworzenie \u015bwiata') && el.offsetParent !== null,
    );
    const st = dbg.dumpState();
    return { ready: !overlayVisible && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 600000, 'awaitingFirstPlayerCity');
  const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  if (!founded) throw new Error(`(${label}) foundPlayerStartCity() zwrocilo false`);
  await pollUntil(page, () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
  }, 120000, 'playerCity');
  await page.waitForSelector('[data-act="surowce"]', { timeout: 120000 });
  await page.waitForTimeout(1500);

  const chipInventory = await page.evaluate(() => Array.from(document.querySelectorAll('[data-act]'))
    .map((el) => ({ act: el.getAttribute('data-act'), widoczny: el.getBoundingClientRect().width > 0 })));
  console.log(`  [${label}] chipy HUD: ` + chipInventory.map((c) => c.act + (c.widoczny ? '' : '(ukryty)')).join(', '));

  const results = [];
  for (const tab of TABS) {
    // Sandbox startowy potrafi otworzyc audiencje dyplomatyczna zaraz po zalozeniu miasta;
    // modal `.civ-diplo-aud` (position:fixed, inset:0) przechwytuje klikniecia w chip HUD.
    // Usuwamy WYLACZNIE ten wezel z DOM harnessu (zero zmian w kodzie gry) i klikamy chip
    // REALNYM klikiem myszy — ta sama sciezka, ktora klika gracz.
    // Chip HUD bywa zaslonięty przez nakladki sandboxu startowego (audiencja dyplomatyczna,
    // nakladka generacji mapy) oraz przez `.civ-emp-backdrop` panelu otwartego dla POPRZEDNIEJ
    // zakladki. Zdejmujemy WYLACZNIE te przeszkody w DOM harnessu (zero zmian w kodzie gry)
    // i klikamy chip REALNYM klikiem myszy — ta sama sciezka co u gracza. Escape jest tu
    // ZAKAZANY: bez otwartego panelu otwiera menu gry, ktore zaslania caly HUD.
    let ok = false;
    let lastClickErr = null;
    for (let attempt = 0; attempt < 5 && !ok; attempt++) {
      // Panel otwarty dla POPRZEDNIEJ zakladki (wraz z backdropem) zaslania chipy HUD —
      // zamykamy go PRZYCISKIEM „Zamknij" panelu, czyli tak jak gracz.
      await page.evaluate(() => {
        for (const el of Array.from(document.querySelectorAll('.civ-diplo-aud, .civ-map-load-overlay'))) el.remove();
        const close = document.querySelector('.civ-emp-panel .civ-emp-close[data-close]');
        if (close) close.click();
        for (const el of Array.from(document.querySelectorAll('.civ-emp-backdrop'))) el.style.pointerEvents = 'none';
      });
      await page.waitForTimeout(500);
      try {
        await page.click(`[data-act="${tab.act}"]`, { timeout: 8000 });
      } catch (e) {
        lastClickErr = String(e.message || e).split('\n')[0];
        // Diagnoza + obejscie: co FAKTYCZNIE lezy na wierzchu nad chipem i klik syntetyczny
        // (bąbelkujący) na tym samym wezle DOM — delegowany handler HUD, zero zmian w kodzie gry.
        const diag = await page.evaluate((a) => {
          const el = document.querySelector(`[data-act="${a}"]`);
          if (!el) return { brakChipa: true };
          const r = el.getBoundingClientRect();
          const top = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2));
          const opis = top ? `${top.tagName.toLowerCase()}.${(top.className || '').toString().split(' ').join('.')}` : '(null)';
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return { naWierzchu: opis, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
        }, tab.act);
        lastClickErr += ' | na wierzchu: ' + JSON.stringify(diag);
      }
      try {
        await page.waitForFunction(
          (sec) => !!document.querySelector(`.civ-emp-panel [data-section="${sec}"]`),
          tab.act, { timeout: 6000 },
        );
        ok = true;
      } catch (e) { await page.waitForTimeout(700); }
    }
    if (!ok) {
      console.log(`  ${label}/${tab.name}: NIE UDALO SIE otworzyc zakladki (chip obecny: `
        + `${chipInventory.some((c) => c.act === tab.act)}; ostatni blad klikniecia: ${lastClickErr})`);
      results.push({ tab: tab.name, file: null, nieotwarta: true,
        chipObecny: chipInventory.some((c) => c.act === tab.act) });
      continue;
    }
    // Kursor zostawiony nad chipem trzyma otwarty tooltip HUD, ktory wchodzi na zrzut —
    // odsuwamy go w pusty rog, dokladnie tak jak gracz cofajacy myszke.
    await page.mouse.move(1400, 860);
    await page.waitForTimeout(700);
    // Pomiar SCOPOWANY do sekcji tej zakladki — nie do calego panelu.
    const info = await page.evaluate((sec) => {
      const sect = document.querySelector(`.civ-emp-panel [data-section="${sec}"]`);
      if (!sect) return { missing: true };
      const row = sect.querySelector('.civ-emp-res-hdr-row');
      const ic = sect.querySelector('.civ-emp-res-hdr-ic svg');
      const eyebrow = ((row || sect).querySelector('.civ-emp-eyebrow')?.textContent || '').trim();
      return {
        eyebrow,
        hasHdrRow: !!row,
        hasIconSvg: !!ic,
        iconBox: ic ? { w: Math.round(ic.getBoundingClientRect().width), h: Math.round(ic.getBoundingClientRect().height) } : null,
      };
    }, tab.act);
    const file = path.join(OUT_DIR, `${label}-${tab.name}.png`);
    const el = await page.$('.civ-emp-panel');
    if (el) await el.screenshot({ path: file });
    results.push({ tab: tab.name, file: path.basename(file), ...info });
    console.log(`  ${label}/${tab.name}: eyebrow=${JSON.stringify(info.eyebrow)} ikona=${info.hasIconSvg ? 'JEST ' + JSON.stringify(info.iconBox) : 'BRAK'}`);
  }
  await page.close();
  if (errs.length) console.log(`  [${label}] bledy strony: ${errs.slice(0, 3).join(' | ')}`);
  return results;
}

(async () => {
  const before = buildVariant(mirrorGra(path.join(TMP_ROOT, 'src-przed'), true), 'przed');
  const after = buildVariant(mirrorGra(path.join(TMP_ROOT, 'src-po'), false), 'po');
  const browser = await launch();
  const resPrzed = await shootVariant(browser, before, 'PRZED');
  const resPo = await shootVariant(browser, after, 'PO');
  await browser.close();
  fs.writeFileSync(
    path.join(OUT_DIR, 'N12-pomiar.json'),
    JSON.stringify({ przed: resPrzed, po: resPo }, null, 2), 'utf8',
  );
  const okPrzed = resPrzed.filter((r) => r.hasIconSvg).map((r) => r.tab);
  const okPo = resPo.filter((r) => r.hasIconSvg).map((r) => r.tab);
  console.log(`\nPRZED — ikona eyebrow w: ${okPrzed.join(', ') || '(nigdzie)'}`);
  console.log(`PO    — ikona eyebrow w: ${okPo.join(', ') || '(nigdzie)'}`);
  console.log(okPo.length === 4 && okPrzed.length === 1 ? 'WYNIK: N12 potwierdzone (1 -> 4)' : 'WYNIK: NIEZGODNE Z OCZEKIWANIEM');
})().catch((e) => { console.error(e); process.exit(1); });
