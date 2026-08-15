'use strict';
/**
 * sidepanel-hud-deadzone-test.cjs — P-BITWA-MARSZ-POTEM-ATAK-NIE-KOLEJKUJE, PRZYCZYNA A
 * (Operator Sonnet 5, 2026-08-15, worktree izolowany).
 *
 * ROOT CAUSE (potwierdzony żywym headless Chromium, `document.elementFromPoint` w dokładnym
 * miejscu kliku, PRZED naprawą): `.civ-side-panel` (panel „WYDARZENIA", sidePanelHud.ts) miał
 * `pointer-events:auto` na CAŁYM swoim prostokątnym kontenerze (`position:fixed`, rozciągnięty
 * od górnej do dolnej krawędzi ekranu, stała szerokość przy prawej krawędzi), niezależnie od
 * tego, czy w danym miejscu tego prostokąta faktycznie renderowała się widoczna treść (karta
 * wydarzenia / pasek narzędzi) czy tylko przezroczyste tło pokazujące canvas gry pod spodem.
 * Efekt: klik gracza na WIDOCZNY canvas (np. na wrogą jednostkę dystansową) w miejscu objętym
 * przez pusty "ogon" tego kontenera (poniżej ostatniej karty, aż do dolnej krawędzi ekranu)
 * ginął bez śladu — `elementFromPoint` zwracał DIV.civ-side-panel, nie CANVAS, mimo że
 * `pickHexAt` (raycasting canvasu) poprawnie wskazywał heks pod kursorem.
 *
 * DOWÓD ŻYWY (ten Operator, przed naprawą, `?playtest=mapa`, viewport 1600x1000):
 *   .civ-side-panel rect: top=102 bottom=816 (wysokość 714px)
 *   dzieci (sp-header/sp-toolbar/sp-placeholder): kończą się na bottom=184
 *   → 632px "ogona" kontenera to czyste tło (canvas widoczny), a mimo to
 *     elementFromPoint(1430,500) zwracał {tag:'DIV', cls:'civ-side-panel'} -- NIE canvas.
 * PO naprawie (ten sam punkt, ta sama geometria): elementFromPoint(1430,500) → {tag:'CANVAS'}.
 *
 * NAPRAWA (sidePanelHud.ts): `.civ-side-panel{pointer-events:none}` (zamiast auto) na
 * zewnętrznym kontenerze; `pointer-events:auto` dopisane z powrotem na faktycznie interaktywnej
 * treści (`.sp-event`, `.sp-toolbar`, oraz `.sp-ctx-card` wewnątrz `.civ-side-panel` — karta
 * kontekstu heksa, otwierana dblclick, poprzednio polegała na "dziedziczeniu" auto z kontenera).
 * `.civ-side-ctx-dock` (lewy dok karty jednostki) zweryfikowany OSOBNO tym samym żywym testem —
 * JUŻ PRZED tą naprawą miał `pointer-events:none` na kontenerze i `auto` wyłącznie na
 * `.sp-ctx-card` (dowód poniżej, sekcja D) — nie wymagał zmiany, geometria karty pokrywa się
 * z jej realnie malowaną treścią (brak "martwej strefy").
 *
 * DOWÓD MUTACYJNY (bez drugiego pełnego builda): po zebraniu asercji "PO naprawie", test na
 * ŻYWEJ stronie podmienia w locie tekst wstrzykniętego `<style id="...w10-ctx-passthrough">`,
 * przywracając WYŁĄCZNIE regułę `.civ-side-panel{...pointer-events:...}` do starego `auto` —
 * i potwierdza, że DOKŁADNIE ten sam punkt na ekranie ZNÓW łapie klik w panel, nie w canvas.
 * To dowodzi, że asercja rzeczywiście zależy od tej jednej reguły CSS, nie jest tautologią.
 *
 * Pokrycie:
 *  A. Martwa strefa .civ-side-panel → canvas (przed/po + mutacja).
 *  B. Pasek narzędzi (.sp-toolbar-chip "Inne cyw.") nadal klikalny prawdziwym kliknięciem myszy
 *     (regresja funkcjonalności — nie tylko brak zmiany, ale faktyczne działanie).
 *  C. Karta własnej jednostki w lewym doku (.civ-side-ctx-dock .sp-ctx-card) nadal w pełni
 *     klikalna (środek karty + przycisk strzałki cyklowania ▶).
 *  D. .civ-side-ctx-dock: kontener JUŻ MA pointer-events:none (baseline, bez zmian w tej
 *     naprawie) — udokumentowane jako dowód, że druga część zgłoszenia (przycz. A dla
 *     .sp-ctx-card) nie wymagała kodu, tylko weryfikacji.
 *  E. Karta kontekstu heksa (dblclick na terenie) wewnątrz .civ-side-panel nadal w pełni
 *     klikalna — to bezpośredni test drugiej zmienionej reguły CSS (usunięcie ograniczenia
 *     do .sp-ctx-interactive dla kart w .civ-side-panel).
 *
 * Bramka (z katalogu gra/): node tools/sidepanel-hud-deadzone-test.cjs — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-sidepanel-deadzone-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const STYLE_ID = 'civ-side-panel-hud-css-w10-ctx-passthrough';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

function buildBundle() {
  console.log('[sidepanel-hud-deadzone-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[sidepanel-hud-deadzone-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[sidepanel-hud-deadzone-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    const overlayCount = await page.locator('text=Tworzenie świata').count();
    if (overlayCount === 0) break;
    await wait(1000);
  }
  await wait(1500);
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[sidepanel-hud-deadzone-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- A. Martwa strefa .civ-side-panel -> canvas (przed mutacją = PO naprawie) --');
    await gotoPlaytestMapa(page);

    const geo = await page.evaluate(() => {
      const el = document.querySelector('.civ-side-panel');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const kids = Array.from(el.children).map(c => c.getBoundingClientRect().bottom);
      return {
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
        maxChildBottom: kids.length ? Math.max(...kids) : r.top,
      };
    });
    assert('.civ-side-panel znaleziony i ma niezerową geometrię', !!geo && geo.rect.bottom > geo.rect.top, geo);

    let deadPoint = null;
    if (geo) {
      const x = Math.round((geo.rect.left + geo.rect.right) / 2);
      const yCandidate = Math.round(geo.maxChildBottom + 40);
      const y = Math.min(yCandidate, Math.round(geo.rect.bottom - 10));
      deadPoint = { x, y };
      assert(
        'punkt martwej strefy leży WEWNĄTRZ prostokąta .civ-side-panel, ale POD wszystkimi dziećmi (realna pusta przestrzeń, nie tautologia)',
        y > geo.maxChildBottom && y < geo.rect.bottom && x > geo.rect.left && x < geo.rect.right,
        { deadPoint, geo },
      );
    }

    if (deadPoint) {
      const efpBefore = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tag: el.tagName, cls: el.className } : null;
      }, deadPoint);
      assert(
        'PO NAPRAWIE: klik w martwą strefę .civ-side-panel trafia w CANVAS, nie w panel',
        !!efpBefore && efpBefore.tag === 'CANVAS',
        efpBefore,
      );

      console.log('\n-- Dowód mutacyjny: przywrócenie .civ-side-panel{pointer-events:auto} NA ŻYWO --');
      const mutResult = await page.evaluate((styleId) => {
        const styleEl = document.getElementById(styleId);
        if (!styleEl) return { found: false };
        const orig = styleEl.textContent || '';
        // Podmiana WYŁĄCZNIE reguły .civ-side-panel{...} (kotwica na unikalny prefiks
        // "position:fixed;top:...;bottom:...;right:...;z-index:305" + "width:" + "px" nie
        // jest potrzebna -- selektor ".civ-side-panel{" jest sam w sobie unikalny w tym pliku
        // CSS (nie myli się z ".civ-side-panel .sp-event" itp., bo tam jest spacja przed klasą
        // potomka, nie "{" bezpośrednio po ".civ-side-panel").
        const re = /(\.civ-side-panel\{[^}]*pointer-events:)none(;)/;
        if (!re.test(orig)) return { found: true, patched: false };
        const mutated = orig.replace(re, '$1auto$2');
        styleEl.textContent = mutated;
        return { found: true, patched: true, orig };
      }, STYLE_ID);
      assert('mutacja: znaleziono wstrzyknięty <style> panelu HUD', mutResult.found, mutResult);
      assert('mutacja: reguła .civ-side-panel{pointer-events:none} znaleziona i podmieniona na auto', mutResult.patched, mutResult);

      if (mutResult.patched) {
        const efpAfterMutation = await page.evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el ? { tag: el.tagName, cls: el.className } : null;
        }, deadPoint);
        assert(
          'PO MUTACJI (cofnięcie naprawy): TEN SAM punkt ZNÓW łapie klik w DIV.civ-side-panel, nie w canvas -- dowód, że asercja wyżej naprawdę zależy od tej reguły CSS',
          !!efpAfterMutation && efpAfterMutation.tag === 'DIV' && efpAfterMutation.cls.includes('civ-side-panel'),
          efpAfterMutation,
        );

        // Przywróć oryginalny CSS przed kolejnymi scenariuszami (higiena testu).
        await page.evaluate(({ styleId, orig }) => {
          const styleEl = document.getElementById(styleId);
          if (styleEl) styleEl.textContent = orig;
        }, { styleId: STYLE_ID, orig: mutResult.orig });

        const efpRestored = await page.evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el ? { tag: el.tagName } : null;
        }, deadPoint);
        assert('CSS przywrócony do stanu naprawionego: punkt znów trafia w CANVAS', !!efpRestored && efpRestored.tag === 'CANVAS', efpRestored);
      }
    }

    console.log('\n-- B. Pasek narzędzi (.sp-toolbar-chip "Inne cyw.") nadal klikalny realnym kliknięciem --');
    const chip = page.locator('[data-sp-toggle-other-civs]').first();
    const chipCount = await chip.count();
    assert('chip "Inne cyw." istnieje w DOM', chipCount > 0);
    if (chipCount > 0) {
      const beforeActive = await chip.evaluate(el => el.className.includes('sp-toolbar-chip-active'));
      assert('chip domyślnie NIE ma klasy active', !beforeActive);
      const box = await chip.boundingBox();
      assert('chip ma niezerową geometrię (boundingBox)', !!box);
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await wait(200);
        const afterActive = await chip.evaluate(el => el.className.includes('sp-toolbar-chip-active'));
        assert('PRAWDZIWY klik myszy na chip przełącza klasę active (funkcjonalność panelu NIE ucierpiała)', afterActive);
        // Przywróć stan domyślny dla higieny kolejnych scenariuszy.
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await wait(150);
      }
    }

    console.log('\n-- C. Karta własnej jednostki (.civ-side-ctx-dock .sp-ctx-card) nadal w pełni klikalna --');
    await page.keyboard.press('Escape');
    await wait(150);
    // Środek canvasu w playtest=mapa (kamera skupiona na jednostce gracza) — trafia w Hastati.
    await page.mouse.click(800, 500);
    await wait(500);
    const cardInfo = await page.evaluate(() => {
      const card = document.querySelector('.civ-side-ctx-dock .sp-ctx-card.sp-ctx-interactive');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      const arrow = card.querySelector('[data-sp-cycle="1"]');
      const ar = arrow ? arrow.getBoundingClientRect() : null;
      return {
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
        arrowRect: ar ? { top: ar.top, bottom: ar.bottom, left: ar.left, right: ar.right } : null,
        arrowDisabled: arrow ? arrow.disabled : null,
      };
    });
    assert('klik na jednostkę gracza otwiera kartę .sp-ctx-card.sp-ctx-interactive w lewym doku', !!cardInfo, cardInfo);
    if (cardInfo) {
      const cx = Math.round((cardInfo.rect.left + cardInfo.rect.right) / 2);
      const cy = Math.round((cardInfo.rect.top + cardInfo.rect.bottom) / 2);
      const efpCard = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tag: el.tagName, cls: el.className, insideCard: !!el.closest('.sp-ctx-card') } : null;
      }, { x: cx, y: cy });
      assert(
        'środek karty własnej jednostki: elementFromPoint trafia W KARTĘ (nie w canvas) -- pełna klikalność zachowana',
        !!efpCard && efpCard.insideCard,
        efpCard,
      );
      if (cardInfo.arrowRect) {
        const ax = Math.round((cardInfo.arrowRect.left + cardInfo.arrowRect.right) / 2);
        const ay = Math.round((cardInfo.arrowRect.top + cardInfo.arrowRect.bottom) / 2);
        const efpArrow = await page.evaluate(({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el ? { tag: el.tagName, cls: el.className } : null;
        }, { x: ax, y: ay });
        assert(
          'przycisk strzałki cyklowania (▶) w karcie: elementFromPoint trafia w sam przycisk',
          !!efpArrow && efpArrow.tag === 'BUTTON' && efpArrow.cls.includes('sp-ctx-nav-arr'),
          efpArrow,
        );
      }
    }

    console.log('\n-- D. Baseline: .civ-side-ctx-dock (kontener) JUŻ MIAŁ pointer-events:none PRZED tą naprawą --');
    const dockPE = await page.evaluate(() => {
      const dock = document.querySelector('.civ-side-ctx-dock');
      return dock ? getComputedStyle(dock).pointerEvents : null;
    });
    assert('.civ-side-ctx-dock (kontener, NIE karta) ma pointer-events:none -- baseline bez zmian w tej naprawie', dockPE === 'none', dockPE);

    console.log('\n-- E. Karta kontekstu heksa (dblclick na terenie, wewnątrz .civ-side-panel) nadal w pełni klikalna --');
    await page.keyboard.press('Escape');
    await wait(150);
    // Punkt bez jednostki/miasta (weryfikowane ręcznie w diagnostyce Operatora) -- teren pusty.
    await page.mouse.dblclick(1000, 300);
    await wait(400);
    const hexCardInfo = await page.evaluate(() => {
      const card = document.querySelector('.civ-side-panel .sp-ctx-card');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      return {
        interactive: card.classList.contains('sp-ctx-interactive'),
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
      };
    });
    assert('dblclick na terenie otwiera kartę kontekstu heksa (.civ-side-panel .sp-ctx-card, BEZ klasy sp-ctx-interactive)', !!hexCardInfo && hexCardInfo.interactive === false, hexCardInfo);
    if (hexCardInfo) {
      const hx = Math.round((hexCardInfo.rect.left + hexCardInfo.rect.right) / 2);
      const hy = Math.round((hexCardInfo.rect.top + hexCardInfo.rect.bottom) / 2);
      const efpHex = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? { tag: el.tagName, insideCard: !!el.closest('.sp-ctx-card') } : null;
      }, { x: hx, y: hy });
      assert(
        'środek karty kontekstu heksa: elementFromPoint trafia W KARTĘ (nie w canvas) -- druga zmieniona reguła CSS (.civ-side-panel .sp-ctx-card{pointer-events:auto}) działa',
        !!efpHex && efpHex.insideCard,
        efpHex,
      );
    }

    assert('[konsola] zero console.error / pageerror w całym scenariuszu', consoleErrors.length === 0);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));

    await page.close();
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[sidepanel-hud-deadzone-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
