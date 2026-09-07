'use strict';
/**
 * zrzuty-zywy-chromium.cjs — dowody wizualne tematu P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1.
 *
 * §9 poz. 6b: temat WIZUALNY bez zrzutu z zywej przegladarki jest niedomkniety.
 * Skrypt buduje REALNY `renderer.ts` + REALNY `wikiHubHud.ts` (esbuild), montuje
 * karte i hub w zywym Chromium (playwright), robi zrzut PRZED klikiem, wykonuje
 * REALNY klik myszy w przycisk "Wiecej informacji (Civpedia)" i robi zrzut PO kliku.
 *
 * Mierzy `wikiOpen` jako: `.civ-wiki-hub` ma klase `open` ORAZ jest widoczny w
 * getComputedStyle ORAZ `.wh-dtitle` niesie niepusty tytul. Sam atrybut nie jest
 * dowodem (to dokladnie ten blad, ktory zostawil defekt niewykryty).
 *
 * Usage: node zrzuty-zywy-chromium.cjs [--suffix po]
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = '/home/user/wt-civpedia-klik/gra';
const OUT = __dirname;
const SUFFIX = (() => {
  const i = process.argv.indexOf('--suffix');
  return i >= 0 ? process.argv[i + 1] : 'po';
})();

const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const SRC = path.join(GRA, 'src');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civpedia-klik-shot-'));
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.js');

/** `?raw` / `import.meta.glob` to skladnia WYLACZNIE Vite — esbuild ich nie zna. */
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'), loader: 'text',
    }));
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const src = fs.readFileSync(args.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

/** Piec scenariuszy — te same pliki co w `_pomiar-przed.json`, zeby zrzuty
 *  "przed" i "po" byly porownywalne para w pare. */
const CASES = [
  { file: '01-budynek-z-haslem', kind: 'building', name: 'Biblioteka', id: 'biblioteka' },
  { file: '02-jednostka', kind: 'unit', name: 'Wlocznik', unitName: 'Włócznik' },
  { file: '03-technologia', kind: 'technology', name: 'Brazownictwo', techName: 'Brązownictwo' },
  { file: '04-ulepszenie-terenu', kind: 'improvement', name: 'Farma', id: 'farma' },
  { file: '05-budynek-brak-hasla', kind: 'building', name: 'Akwedukt', id: 'akwedukt' },
];

const PAGE_HTML = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>civpedia-klik</title></head><body></body></html>';

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  fs.writeFileSync(ENTRY, [
    `import { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS } from '${SRC}/ui/entityCards/renderer.ts';`,
    `import { createWikiHubHud } from '${SRC}/ui/wikiHubHud.ts';`,
    `import { unitToSlug, technologyIdFromName } from '${SRC}/ui/entityCards/registry.ts';`,
    'window.__ec = { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS, createWikiHubHud, unitToSlug, technologyIdFromName };',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: BUNDLE, absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },
    plugins: [viteCompatPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  // WYSOKOSC OKNA NIE JEST KOSMETYKA. Karty encji nie maja `max-height` ani
  // wlasnego scrolla (`overflow:hidden`), a przycisk CivPedii siedzi w STOPCE —
  // zmierzone: 672 px (Farma) do 1119 px (Wlocznik) od gory. Przy oknie 900 px
  // klik w dwie najwyzsze karty trafial POZA viewport i pomiar pokazywal
  // `wikiOpen:false` dla dzialajacego kodu. To jest artefakt pomiaru, nie defekt
  // produktu — dlatego okno musi pomiescic najwyzsza karte, a `assertClickable`
  // nizej twardo przerywa przebieg, gdyby kiedys znowu przestalo miescic.
  const page = await browser.newPage({ viewport: { width: 1400, height: 1240 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));

  const pomiar = [];

  for (const c of CASES) {
    // Swieza strona per scenariusz — hub jest singletonem, wspolny stan miedzy
    // przypadkami zamienilby pomiar w pomiar poprzedniego kliku.
    await page.setContent(PAGE_HTML);
    await page.addScriptTag({ path: BUNDLE });

    const setup = await page.evaluate(({ kind, id, unitName, techName }) => {
      const api = window.__ec;
      const style = document.createElement('style');
      style.textContent = api.ENTITY_CARD_CSS;
      document.head.appendChild(style);
      document.body.style.cssText = 'margin:0;min-height:100vh;background:#0a0f1c;';

      api.createWikiHubHud({});

      const realId = id != null ? id
        : unitName != null ? api.unitToSlug(unitName)
        : api.technologyIdFromName(techName);

      const data = api.buildEntityCardData(kind, realId, {});
      if (data == null) return { ok: false, realId };

      const host = document.createElement('div');
      host.style.cssText = 'position:fixed;left:660px;top:20px;width:420px;';
      document.body.appendChild(host);
      host.appendChild(api.renderEntityCard(data));

      const btn = host.querySelector('.entity-card-civpedia-link');
      if (btn != null) btn.scrollIntoView({ block: 'center' });
      const r = btn ? btn.getBoundingClientRect() : null;
      return {
        ok: true, realId, title: data.title,
        hasButton: btn != null,
        folder: data.civpediaLink ? data.civpediaLink.folder : null,
        slug: data.civpediaLink ? data.civpediaLink.slug : null,
        cx: r ? r.left + r.width / 2 : null,
        cy: r ? r.top + r.height / 2 : null,
      };
    }, c);

    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, `${c.file}-${SUFFIX}-przed-klikiem.png`) });

    // GUARD PRZECIW FALSZYWEMU "NIE DZIALA": klik poza viewportem nic nie trafia,
    // a pomiar wyglada wtedy identycznie jak martwy przycisk. Przerwij glosno.
    if (setup.ok && setup.hasButton && (setup.cy < 0 || setup.cy > 1240 || setup.cx < 0 || setup.cx > 1400)) {
      throw new Error(`[${c.file}] przycisk poza viewportem (cx=${setup.cx}, cy=${setup.cy}) — zwieksz okno, nie raportuj tego jako defektu produktu`);
    }
    // Hit-test: czy w srodku przycisku faktycznie lezy TEN przycisk (nie tlo, nie hub).
    const hitsSelf = setup.ok && setup.hasButton ? await page.evaluate(({ cx, cy }) => {
      const hit = document.elementFromPoint(cx, cy);
      return hit != null && hit.closest('.entity-card-civpedia-link') != null;
    }, { cx: setup.cx, cy: setup.cy }) : null;
    if (setup.hasButton && hitsSelf === false) {
      throw new Error(`[${c.file}] elementFromPoint w srodku przycisku nie trafia w przycisk — artefakt pomiaru`);
    }

    let clicked = false;
    if (setup.ok && setup.hasButton) {
      await page.mouse.click(setup.cx, setup.cy);
      clicked = true;
      await page.waitForTimeout(350);
    }
    await page.screenshot({ path: path.join(OUT, `${c.file}-${SUFFIX}-po-kliku.png`) });

    const after = await page.evaluate(() => {
      const hub = document.querySelector('.civ-wiki-hub');
      const visible = hub != null
        && hub.classList.contains('open')
        && getComputedStyle(hub).display !== 'none';
      const dt = document.querySelector('.wh-dtitle');
      const title = dt ? dt.textContent.trim() : null;
      const note = document.querySelector('.entity-card-civpedia-note');
      return {
        wikiOpen: visible && title != null && title.length > 0,
        wikiTitle: visible && title ? title : null,
        note: note != null && note.hidden === false ? note.textContent.trim() : null,
      };
    });

    pomiar.push({
      file: c.file, kind: c.kind, id: setup.realId, title: setup.title ?? null,
      hasButton: setup.hasButton === true,
      folder: setup.folder ?? null, slug: setup.slug ?? null,
      clicked, hitsSelf, wikiOpen: after.wikiOpen, wikiTitle: after.wikiTitle, note: after.note,
    });
    console.log(`${c.file}: hasButton=${setup.hasButton} wikiOpen=${after.wikiOpen} wikiTitle=${JSON.stringify(after.wikiTitle)} note=${JSON.stringify(after.note)}`);
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, `_pomiar-${SUFFIX}.json`), JSON.stringify(pomiar, null, 2) + '\n', 'utf8');
  if (errors.length > 0) console.log('PAGE ERRORS: ' + JSON.stringify(errors));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best-effort */ }
}

main().catch((e) => { console.error(e); process.exit(1); });
