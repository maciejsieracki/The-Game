'use strict';
/**
 * diplomacy-respect-true-value-real-render-test.cjs
 *
 * TEMAT: R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1 (runda 2).
 *
 * Dowód w żywym headless Chromium (nie jsdom): otwiera PRAWDZIWY `showDiplomacyAudience`
 * z bundla esbuild (z prawdziwym CSS i prawdziwym DOM), dla trzech stanów:
 *   A. wojna, Zaufanie 74 / Respekt 54 (suma 128 > limit wojenny) → panel pokazuje 74 i 54
 *      (prawdziwe wartości, bez obcięcia do 29), etykieta „Wrogi”, dopisek limitu z
 *      `WAR_RELATION_SCORE_CAP` (nie hardcoded 29), zrzut ekranu;
 *   B. pokój, te same wartości → brak dopisku, wartości 74 i 54, etykieta nie „Wrogi”;
 *   C. wojna, Zaufanie 10 / Respekt 10 (suma 20 ≤ limit) → brak dopisku.
 *
 * Test nietautologiczny: `--mutant=clamp` przywraca w LOCIE (tylko w bundlu, bez zmian w repo)
 * dawne obcinanie `effectiveNastawienieScores` do limitu; `--mutant=note` usuwa dopisek
 * (`warCapNoteHtml`). W obu wariantach asercje MUSZĄ czerwienieć (exit 1, „MUTANT WYKRYTY”).
 *
 * Usage (z gra/):
 *   node tools/diplomacy-respect-true-value-real-render-test.cjs
 *   node tools/diplomacy-respect-true-value-real-render-test.cjs --mutant=clamp
 *   node tools/diplomacy-respect-true-value-real-render-test.cjs --mutant=note
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[diplomacy-respect-true-value-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.rtv-stubs');
const ENTRY = path.resolve(__dirname, '.rtv-entry.ts');
const BUNDLE = path.resolve(__dirname, '.rtv-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DISP = path.resolve(GRA, 'src', 'game', 'diplomacy-display.ts');
const AUD = path.resolve(GRA, 'src', 'ui', 'diplomacyAudience.ts');
const SHOT_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1', 'dowody');
const MUTANT = ((process.argv.find((a) => a.startsWith('--mutant=')) || '').split('=')[1]) || '';
const TAG = '[diplomacy-respect-true-value-real-render-test]';

const stubs = {
  music: path.resolve(STUB_DIR, 'music-stub.ts'),
  diploUiSkin: path.resolve(STUB_DIR, 'diplouiskin-stub.ts'),
  negotiationModal: path.resolve(STUB_DIR, 'negotiationmodal-stub.ts'),
  tradeBasket: path.resolve(STUB_DIR, 'tradebasket-stub.ts'),
  leaderPortraits: path.resolve(STUB_DIR, 'leaderportraits-stub.ts'),
  civBrandDisplay: path.resolve(STUB_DIR, 'civbranddisplay-stub.ts'),
  brandAssets: path.resolve(STUB_DIR, 'brandassets-stub.ts'),
};

function writeStubs() {
  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(stubs.music, 'export function startDiplomacyMusic() {}\nexport function stopDiplomacyMusic() {}\n', 'utf8');
  fs.writeFileSync(stubs.diploUiSkin, [
    "export function civLeaderMedallionHtmlById() { return ''; }",
    "export function dipBrandIconHtml() { return ''; }",
    "export function dipCapitalLocateBtnHtml() { return ''; }",
    "export const DIPLO_1E_SHARED_CSS = '';",
    "export function ensureDiploBrandScope() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.negotiationModal, [
    "export function actionNeedsNegotiation() { return false; }",
    "export function showNegotiationModal() {}",
    "export function proposalActionIdFromPayload() { return undefined; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.tradeBasket, [
    "export function actionUsesTradeBasket() { return false; }",
    "export function getTradeBasketMode() { return 'trade'; }",
    "export function showTradeBasketModal() {}",
    "export function hideTradeBasketModal() {}",
    "export function openQuickDealBasket() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.leaderPortraits, [
    "export function civCardDisplayName(label) { return label; }",
    "export function leaderName() { return null; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(stubs.civBrandDisplay, "export function civBrandLineForKey() { return ''; }\n", 'utf8');
  fs.writeFileSync(stubs.brandAssets, [
    "export function brandIconSvg() { return ''; }",
    "export function mapResourceIconSvg() { return ''; }",
  ].join('\n'), 'utf8');
}

function cleanup() {
  for (const f of Object.values(stubs).concat([ENTRY])) {
    try { fs.unlinkSync(f); } catch (_) { /* ok */ }
  }
  try { fs.rmdirSync(STUB_DIR); } catch (_) { /* ok */ }
}

/** Mutanty działają WYŁĄCZNIE w bundlu tego testu — pliki w repo pozostają nietknięte. */
const mutantPlugin = {
  name: 'rtv-mutant',
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      if (!MUTANT) return null;
      const p = path.resolve(args.path);
      if (p !== DISP && p !== AUD) return null;
      const src = fs.readFileSync(p, 'utf8');
      let out = src;
      if (MUTANT === 'clamp' && p === DISP) {
        out = src.replace(
          '  return { zaufanie, respekt };\n}\n\n/** True',
          "  const c = clampRelationForWar({ zaufanie, respekt, status: 'wojna' });\n"
          + '  return { zaufanie: c.zaufanie, respekt: c.respekt };\n}\n\n/** True',
        );
      } else if (MUTANT === 'note' && p === AUD) {
        out = src.replace(
          "if (!warRelationCapApplies(st.zaufanie, st.respekt, audienceAtWar(st))) return '';",
          "return '';",
        );
      } else {
        return null;
      }
      if (out === src) throw new Error(TAG + ': mutant ' + MUTANT + ' did not apply to ' + p);
      return { contents: out, loader: 'ts', resolveDir: path.dirname(p) };
    });
  },
};

async function buildBundle() {
  writeStubs();
  fs.writeFileSync(ENTRY, [
    "import { showDiplomacyAudience } from '../src/ui/diplomacyAudience.ts';",
    "import { WAR_RELATION_SCORE_CAP } from '../src/game/diplomacy.ts';",
    "import { warRelationCapApplies, effectiveNastawienieScores, nastawienieLabelFromScore } from '../src/game/diplomacy-display.ts';",
    'window.showDiplomacyAudience = showDiplomacyAudience;',
    'window.RTV = { WAR_RELATION_SCORE_CAP, warRelationCapApplies, effectiveNastawienieScores, nastawienieLabelFromScore };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins: [
      mutantPlugin,
      {
        name: 'stub-diplomacy-audience-deps',
        setup(build) {
          build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubs.music }));
          build.onResolve({ filter: /diploUiSkin$/ }, () => ({ path: stubs.diploUiSkin }));
          build.onResolve({ filter: /diplomacyNegotiationModal$/ }, () => ({ path: stubs.negotiationModal }));
          build.onResolve({ filter: /diplomacyTradeBasket$/ }, () => ({ path: stubs.tradeBasket }));
          build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: stubs.leaderPortraits }));
          build.onResolve({ filter: /civBrandDisplay$/ }, () => ({ path: stubs.civBrandDisplay }));
          build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: stubs.brandAssets }));
        },
      },
    ],
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log(TAG + ': domyslny Chromium niedostepny, fallback na ' + FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Stan audiencji: wartości surowe Zaufania/Respektu oraz to, czy formalnie trwa wojna. */
function audienceState(zaufanie, respekt, war) {
  return {
    playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Rozmowca', otherCivName: 'Grecja',
    zaufanie, respekt, relacjaTotal: zaufanie + respekt, tier: 1, layer: 'full', contactEstablished: true,
    formalStatus: war ? { kind: 'wojna', label: 'Wojna' } : { kind: 'pokoj', label: 'Pokój' },
    actions: [], activeTreaties: [], pendingNegotiations: [],
    playerPower: 100, otherPower: 100,
  };
}

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function openAudience(page, st) {
  await page.evaluate((s) => {
    window.showDiplomacyAudience({ ownerId: 1, getState: () => s, onAction: () => {}, onBack: () => {} });
  }, st);
  await page.waitForSelector('.da-stance-badge');
}

/** Odczyt z DOM: etykieta, dopisek limitu i tekst karty (wiersze Zaufania/Respektu/Relacji). */
async function readPanel(page) {
  return page.evaluate(() => {
    const note = document.querySelector('.da-war-cap-note');
    const card = document.querySelector('.da-card.them');
    const relRow = document.querySelector('.relacja-total');
    return {
      badge: (document.querySelector('.da-stance-badge') || {}).textContent || null,
      noteText: note ? note.textContent : null,
      noteTitle: note ? note.getAttribute('title') : null,
      cardText: card ? card.innerText : '',
      relacja: relRow ? relRow.innerText : '',
    };
  });
}

/** Wartość z wiersza paska („Zaufanie\n74 / 100”) — parsowana z innerText karty. */
function barValue(text, label) {
  const m = new RegExp(label + '\\n\\s*(\\d+) / 100').exec(text);
  return m ? Number(m[1]) : null;
}

/** Każdy scenariusz na świeżej stronie: brak stanu z poprzedniego panelu. */
async function freshPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e && e.message)));
  await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
  await page.addScriptTag({ path: BUNDLE });
  return page;
}

async function main() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await buildBundle();
  const browser = await launchBrowser();
  try {
    const errors = [];
    let page = await freshPage(browser);
    errors.push(...page.errors);
    const cap = await page.evaluate(() => window.RTV.WAR_RELATION_SCORE_CAP);
    const capPoints = Number(cap);
    check('limit wojenny to WAR_RELATION_SCORE_CAP (29), nie hardcoded', capPoints === 29, capPoints);
    check('stan funkcji: wojna, suma 128 > limit → dopisek', await page.evaluate(() => window.RTV.warRelationCapApplies(74, 54, true) === true));
    check('stan funkcji: pokój → brak dopisku', await page.evaluate(() => window.RTV.warRelationCapApplies(74, 54, false) === false));
    check('stan funkcji: wojna, suma 20 ≤ limit → brak dopisku', await page.evaluate(() => window.RTV.warRelationCapApplies(10, 10, true) === false));
    check('effectiveNastawienieScores zwraca wartości prawdziwe (bez obcięcia)', await page.evaluate(() => {
      const r = window.RTV.effectiveNastawienieScores(74, 54);
      return r.zaufanie === 74 && r.respekt === 54;
    }));
    check('etykieta wojenna nadal „Wrogi”', await page.evaluate(() => window.RTV.nastawienieLabelFromScore(74, 54, { atWar: true }) === 'Wrogi'));

    // A. wojna, prawdziwe wartości powyżej limitu
    page = await freshPage(browser);
    await openAudience(page, audienceState(74, 54, true));
    const a = await readPanel(page);
    const aZ = barValue(a.cardText, 'Zaufanie');
    const aR = barValue(a.cardText, 'Respekt');
    console.log('  [A] badge=' + a.badge + ' note=' + a.noteText + ' Z=' + aZ + ' R=' + aR + ' relacja=' + JSON.stringify(a.relacja));
    check('A: etykieta nastawienia „Wrogi” w wojnie', a.badge === 'Wrogi', a.badge);
    check('A: dopisek limitu obecny, tekst z WAR_RELATION_SCORE_CAP', a.noteText === '(limit wojenny ' + capPoints + ')', a.noteText);
    check('A: dopisek ma tooltip wyjaśniający sumę Zaufania i Respektu',
      typeof a.noteTitle === 'string' && a.noteTitle.indexOf('suma Zaufania i Respektu') !== -1, a.noteTitle);
    check('A: pasek Zaufania pokazuje prawdziwe 74', aZ === 74, aZ);
    check('A: pasek Respektu pokazuje prawdziwe 54 (nie obcięte do 29)', aR === 54, aR);
    check('A: wiersz Relacja pokazuje sumę 128 / 200 i dopisek', /128 \/ 200/.test(a.relacja) && a.relacja.indexOf('limit wojenny ' + capPoints) !== -1, a.relacja);
    await page.screenshot({ path: path.join(SHOT_DIR, MUTANT ? 'mutant-' + MUTANT + '-A.png' : '01-wojna-respekt-prawda-74-54.png') });
    errors.push(...page.errors);
    await page.close();

    // B. pokój, te same wartości
    page = await freshPage(browser);
    await openAudience(page, audienceState(74, 54, false));
    const b = await readPanel(page);
    const bZ = barValue(b.cardText, 'Zaufanie');
    const bR = barValue(b.cardText, 'Respekt');
    console.log('  [B] badge=' + b.badge + ' note=' + b.noteText + ' Z=' + bZ + ' R=' + bR);
    check('B: brak dopisku limitu w pokoju', b.noteText === null, b.noteText);
    check('B: w pokoju pasek Zaufania 74 i Respektu 54', bZ === 74 && bR === 54, [bZ, bR]);
    check('B: w pokoju etykieta nie „Wrogi”', b.badge !== 'Wrogi', b.badge);
    if (!MUTANT) await page.screenshot({ path: path.join(SHOT_DIR, '02-pokoj-bez-dopisku-74-54.png') });
    errors.push(...page.errors);
    await page.close();

    // C. wojna, suma poniżej limitu
    page = await freshPage(browser);
    await openAudience(page, audienceState(10, 10, true));
    const c = await readPanel(page);
    console.log('  [C] badge=' + c.badge + ' note=' + c.noteText);
    check('C: wojna, suma 20 ≤ limit → brak dopisku', c.noteText === null, c.noteText);
    errors.push(...page.errors);
    await page.close();

    check('brak błędów JS na stronie', errors.length === 0, errors);
  } finally {
    await browser.close();
    cleanup();
    try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }
  }
  console.log('\n' + TAG + (MUTANT ? ' [mutant=' + MUTANT + ']' : '') + ': ' + pass + ' OK, ' + fail + ' FAIL');
  if (MUTANT) {
    console.log(fail > 0 ? 'MUTANT WYKRYTY (asercje czerwienieją)' : 'MUTANT NIE WYKRYTY — test tautologiczny');
    process.exit(fail > 0 ? 0 : 1);
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(TAG + ' crash: ' + (e && e.stack || e)); cleanup(); process.exit(2); });
