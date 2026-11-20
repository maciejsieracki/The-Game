'use strict';
/**
 * diplo-all-windows-declutter-real-render-test.cjs -- R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2 (R6, obrona r2).
 *
 * Renderuje PRAWDZIWE moduly (src/ui/diplomacyAudience.ts, src/ui/diplomacyNegotiationModal.ts) w headless
 * Chromium (esbuild -> IIFE -> playwright) i sprawdza DOM:
 *   - widoczny tekst okna (textContent) NIE zawiera wyjaśnień (R2/R3),
 *   - wyjaśnienia istnieją jako atrybut title elementu, którego dotyczą (R1),
 *   - audiencja: brak bloku życiorys/bieżące, brak „(Zaufanie + Respekt)”, baner bez „zerwanie:” w tekście.
 *
 * MUTACJE (R6): każda mutacja przywraca JEDNO wyjaśnienie do widocznego tekstu (kopia źródła, podmieniana
 * w locie przez plugin esbuild; plik na dysku się nie zmienia). Test MUSI wykryć każdą mutację (czerwień).
 *
 * Zrzuty: env DIPLO_RR_TAG (np. PRZED / PO) + env DIPLO_RR_GRA (korzeń z katalogiem src/; domyślnie gra/).
 * Usage (z gra/): node tools/diplo-all-windows-declutter-real-render-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const SRC_ROOT = process.env.DIPLO_RR_GRA ? path.resolve(process.env.DIPLO_RR_GRA) : GRA;
const TAG = process.env.DIPLO_RR_TAG || '';
const SHOT_DIR = process.env.DIPLO_RR_SHOT_DIR || '';
const CHROME = process.env.CHROMIUM_PATH || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const AUD = path.join(SRC_ROOT, 'src/ui/diplomacyAudience.ts');
const NEG = path.join(SRC_ROOT, 'src/ui/diplomacyNegotiationModal.ts');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dip-q2-rr-'));
const ENTRY = path.join(tmp, 'entry.ts');
const MUSIC = path.join(tmp, 'music.ts');
fs.writeFileSync(MUSIC, 'export function startDiplomacyMusic(){} export function stopDiplomacyMusic(){}\n', 'utf8');
fs.writeFileSync(ENTRY, [
  `export { showWarConsentModal, showAllianceObligationModal, showWarConfirmModal, showBreakTreatyConfirmModal, showDiplomacyAudience, hideDiplomacyAudience } from ${JSON.stringify(AUD)};`,
  `export { showNegotiationModal, hideNegotiationModal } from ${JSON.stringify(NEG)};`,
  `export { installHudTitleTooltips } from ${JSON.stringify(path.join(SRC_ROOT, 'src/ui/hudTitleTooltip.ts'))};`,
  `export { resolveFormalDiplomaticStatus } from ${JSON.stringify(path.join(SRC_ROOT, 'src/game/diplomacy-display.ts'))};`,
  '',
].join('\n'), 'utf8');

const stubAssets = {
  name: 'stub-assets',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'stub-raw',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-raw' }, () => ({ contents: '', loader: 'text' }));
    build.onResolve({ filter: /\.(svg|mp3|jpg|png|webp|ogg|wav)$/ }, (args) => ({ path: args.path, namespace: 'stub-empty' }));
    build.onLoad({ filter: /.*/, namespace: 'stub-empty' }, () => ({ contents: 'export default ""', loader: 'js' }));
    build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: MUSIC }));
  },
};

/** Mutacje: każda przywraca JEDNO wyjaśnienie do widocznego tekstu. from musi wystąpić dokładnie raz. */
const MUTANTS = [
  { name: 'M1 uzasadnienie kary wraca na widoczny tekst', file: AUD,
    from: "'<li title=\"' + esc(penaltyKindLabel(l.kind) + ': ' + l.reason) + '\"><b>' + esc(penaltyKindLabel(l.kind) + ' ' + signedDelta(l.delta)) + '</b></li>',",
    to: "'<li title=\"' + esc(penaltyKindLabel(l.kind) + ': ' + l.reason) + '\"><b>' + esc(penaltyKindLabel(l.kind) + ' ' + signedDelta(l.delta)) + '</b> — ' + esc(l.reason) + '</li>',"  },
  { name: 'M2 opis „bez ataku” wraca na widoczny tekst', file: AUD,
    from: "<strong>Wypowiedz wojnę</strong></p>'",
    to: "<strong>Wypowiedz wojnę</strong> — bez ataku w tej turze (karencja N1)</p>'" },
  { name: 'M3 lead „Nie jesteście w stanie wojny” widoczny', file: AUD,
    from: "'<p class=\"cd-war-lead\" title=\"Nie jesteście w stanie wojny. Wybierz, jak chcesz postąpić.\">Wybierz działanie:</p>'",
    to: "'<p class=\"cd-war-lead\">Nie jesteście w stanie wojny. Wybierz, jak chcesz postąpić:</p>'" },
  { name: 'M4 „kara Wiarygodności” widoczna w obowiązku sojuszu', file: AUD,
    from: "<strong>Odmowa</strong></p>'",
    to: "<strong>Odmowa</strong> — kara Wiarygodności i zerwanie sojuszu</p>'" },
  { name: 'M5 „zerwanie:” w tekście banera', file: AUD,
    from: "  const breakTip = detail?.breakPenaltyLabel ? ' title=\"' + esc('Zerwanie: ' + detail.breakPenaltyLabel) + '\"' : '';",
    to: "  if (detail?.breakPenaltyLabel) subParts.push('zerwanie: ' + detail.breakPenaltyLabel);\n  const breakTip = '';" },
  { name: 'M6 „(Zaufanie + Respekt)” widoczne przy Relacji', file: AUD,
    from: "+ '<span class=\"v\">' + relTotal + ' / 200' + formatPerTurnDelta(st.relacjaDeltaPerTurn) + '</span>'",
    to: "+ '<span class=\"v\">' + relTotal + ' / 200' + formatPerTurnDelta(st.relacjaDeltaPerTurn) + '</span>'\n    + '<span class=\"da-rel-sum-hint\">(Zaufanie + Respekt)</span>'" },
  { name: 'M7 blok życiorys/bieżące widoczny pod Wiarygodnością', file: AUD,
    from: "'<div class=\"da-rbar credibility\"><i style=\"width:' + pct + '%\"></i></div>'",
    to: "'<div class=\"da-rbar credibility\"><i style=\"width:' + pct + '%\"></i></div>' + '<div class=\"da-credibility-hint\">życiorys 1</div>'" },
  { name: 'M11 skutki złamania paktu widoczne (Pakt)', file: NEG,
    from: "'<label title=\"' + esc('Złamanie: −30 Relacja, −20 Zaufanie') + '\">Czas paktu</label>'",
    to: "'<label>Czas paktu</label><p class=\"cdn-sub\">Złamanie: −30 Relacja, −20 Zaufanie</p>'" },
  { name: 'M12 instrukcja „zamknij to okno” widoczna (Handel)', file: NEG,
    from: "'\">Użyj przycisku „'",
    to: "'\">Zamknij to okno i użyj przycisku „'" },
  { name: 'M13 instrukcja „zamknij to okno” widoczna (Dar)', file: NEG,
    from: "'\">Wybierz „Przekaż dar” na stole.</p>'",
    to: "'\">Zamknij to okno i wybierz „Przekaż dar” ponownie.</p>'" },
];

const TOOLTIP_WAR_OPT = 'Bez ataku w tej turze (karencja N1)';
const REASON_DECL = 'RSN-DEKL-KARENCJA';
const REASON_ATAK = 'RSN-ATAK-WOJNA';
const REASON_REFUSE = 'RSN-ODMOWA-WIARYGODNOSC';
const REASON_BREAK = 'RSN-ZERWANIE-TRAKTAT';

function preview(reason, kind) {
  return {
    lines: [{ kind: kind || 'wiarygodnosc', delta: -5, reason }],
    wiarygodnoscTotal: -5, zaufanieTotal: 0,
  };
}

/** Każdy scenariusz zwraca snapshot DOM; asercje są po stronie Node. */
const SCAN = {
  war: () => {
    const DAR = window.DAR;
    DAR.showWarConsentModal({
      civName: 'Sumerowie',
      previewDeclareOnly: { lines: [{ kind: 'wiarygodnosc', delta: -5, reason: 'RSN-DEKL-KARENCJA' }], wiarygodnoscTotal: -5, zaufanieTotal: 0 },
      previewDeclareAndAttack: { lines: [{ kind: 'zaufanie', delta: -10, reason: 'RSN-ATAK-WOJNA' }], wiarygodnoscTotal: 0, zaufanieTotal: -10 },
      onDeclareOnly: () => {}, onDeclareAndAttack: () => {},
    });
    const root = document.querySelector('.cd-war-consent-modal');
    return { text: root.textContent, titles: [...root.querySelectorAll('[title]')].map(e => e.getAttribute('title')) };
  },
  alliance: () => {
    const DAR = window.DAR;
    DAR.showAllianceObligationModal({
      allyName: 'Egipt', targetName: 'Persja',
      previewRefuse: { lines: [{ kind: 'wiarygodnosc', delta: -5, reason: 'RSN-ODMOWA-WIARYGODNOSC' }], wiarygodnoscTotal: -5, zaufanieTotal: 0 },
      onFulfill: () => {}, onRefuse: () => {},
    });
    const root = document.querySelector('.cd-war-consent-modal');
    return { text: root.textContent, titles: [...root.querySelectorAll('[title]')].map(e => e.getAttribute('title')) };
  },
  breakTreaty: () => {
    const DAR = window.DAR;
    DAR.showBreakTreatyConfirmModal('Pakt o nieagresji',
      { lines: [{ kind: 'wiarygodnosc', delta: -5, reason: 'RSN-ZERWANIE-TRAKTAT' }, { kind: 'info', delta: 0, reason: 'brak kary Wiarygodności za samo zerwanie; przez 3 tury atak na tego partnera kosztuje -5 Wiarygodności' }], wiarygodnoscTotal: -5, zaufanieTotal: 0 },
      () => {});
    const root = document.querySelector('.civ-diplo-modal');
    return { text: root.textContent, titles: [...root.querySelectorAll('[title]')].map(e => e.getAttribute('title')) };
  },
  pact: () => {
    const DAR = window.DAR;
    DAR.showNegotiationModal({ id: '2', label: 'Pakt o nieagresji', enabled: true, locked: false },
      { civName: 'Sumerowie' }, () => ({ accepted: true }), () => {}, () => {});
    const root = document.querySelector('.civ-diplo-neg');
    return { text: root.textContent, titles: [...root.querySelectorAll('[title]')].map(e => e.getAttribute('title')) };
  },
  trade: () => {
    const DAR = window.DAR;
    DAR.showNegotiationModal({ id: '5', label: 'Traktat handlowy', enabled: true, locked: false },
      { civName: 'Sumerowie' }, () => ({ accepted: true }), () => {}, () => {});
    const root = document.querySelector('.civ-diplo-neg');
    return { text: root.textContent, titles: [...root.querySelectorAll('[title]')].map(e => e.getAttribute('title')) };
  },
  gift: () => {
    const DAR = window.DAR;
    DAR.showNegotiationModal({ id: '13', label: 'Dar PW', enabled: true, locked: false },
      { civName: 'Sumerowie' }, () => ({ accepted: true }), () => {}, () => {});
    const root = document.querySelector('.civ-diplo-neg');
    return { text: root.textContent, titles: [...root.querySelectorAll('[title]')].map(e => e.getAttribute('title')) };
  },
  audience: () => {
    const DAR = window.DAR;
    const formalStatus = DAR.resolveFormalDiplomaticStatus({
      relationStatus: 'pokoj', allianceFormalKind: null, hasNap: false, hasTrade: false, contactEstablished: true,
    });
    const state = {
      playerTitle: 'Władca · Starożytność', playerCivName: 'Rzym', otherTitle: 'Przedstawiciel', otherCivName: 'Sumerowie',
      zaufanie: 26, respekt: 40, tier: 1, layer: 'full', contactEstablished: true,
      playerWiarygodnosc: -20, playerWiarygodnoscRozbicie: { trwalyZyciorys: -10, biezaceUczynki: -10 },
      formalStatus, formalStatusDetail: { sinceTurns: 3, breakPenaltyLabel: 'Pakt o nieagresji (−30 Rel.)' },
      truceUntilTurn: null, currentTurn: 10,
      actions: [
        { id: '2', label: 'Pakt o nieagresji', enabled: true, locked: false },
        { id: '5', label: 'Traktat handlowy', enabled: true, locked: false },
        { id: '9', label: 'Wypowiedzenie wojny', enabled: true, locked: false },
      ],
      pendingNegotiations: [],
    };
    DAR.showDiplomacyAudience({ ownerId: 2, getState: () => state, onAction: () => {}, onBack: () => {}, backLabel: 'Wróć' });
    const root = document.querySelector('.civ-diplo-aud');
    const banner = document.querySelector('.da-banner');
    return {
      text: root ? root.textContent : '',
      bannerText: banner ? banner.textContent : '',
      bannerLblTitle: document.querySelector('.da-banner .da-b-lbl') ? document.querySelector('.da-banner .da-b-lbl').getAttribute('title') : null,
      hint: !!document.querySelector('.da-credibility-hint'),
      titles: root ? [...root.querySelectorAll('[title]')].map(e => e.getAttribute('title')) : [],
    };
  },
};

/** Porównanie bez wielkości liter: mutacja może zmienić wielkość pierwszej litery. */
function vis(text, s) { return text.toLowerCase().indexOf(s.toLowerCase()) !== -1; }

/** Zwraca listę porażek dla wariantu (pusta = zielono). */
async function runVariant(browser, label, mutant) {
  const bundle = path.join(tmp, 'bundle-' + label.replace(/[^A-Za-z0-9]/g, '_') + '.js');
  const overrides = mutant ? [mutant] : [];
  const plugins = [stubAssets, {
    name: 'mutant-override',
    setup(build) {
      if (!overrides.length) return;
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        const m = overrides.find(o => path.resolve(o.file) === path.resolve(args.path));
        if (!m) return undefined;
        const src = fs.readFileSync(args.path, 'utf8');
        const count = src.split(m.from).length - 1;
        if (count !== 1) throw new Error('kotwica mutacji nie występuje dokładnie raz (' + count + '): ' + m.name);
        return { contents: src.replace(m.from, m.to), loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  }];
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', globalName: 'DAR',
    target: 'es2020', outfile: bundle, absWorkingDir: SRC_ROOT, loader: { '.ts': 'ts', '.json': 'json' },
    define: { 'import.meta.glob': '__noGlob' },
    banner: { js: 'var __noGlob = function () { return {}; };' }, logLevel: 'silent', plugins,
  });
  const fails = [];
  const ok = (name, cond, detail) => {
    if (cond) console.log('  PASS [' + label + ']: ' + name);
    else { fails.push(name); console.log('  FAIL [' + label + ']: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail).slice(0, 300) : '')); }
  };
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#101218"></body></html>');
  await page.addScriptTag({ path: bundle });
  // Q2 r3: dymki gry (hudTitleTooltip) zainstalowane — hover pokazuje tooltip wyjaśnienia.
  await page.evaluate(() => { window.DAR.installHudTitleTooltips(); });

  const shot = async (name) => {
    if (!SHOT_DIR || !TAG) return;
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    const p = path.join(SHOT_DIR, TAG + '-' + name + '.png');
    await page.screenshot({ path: p });
    console.log('  zrzut: ' + p);
  };
  // Scenariusze (kolejność: modale zamykane między sobą).
  const scenarios = ['war', 'alliance', 'breakTreaty', 'pact', 'trade', 'gift', 'audience'];
  const SNAP = {};
  for (const sc of scenarios) {
    await page.evaluate(() => { document.querySelectorAll('.civ-diplo-modal-overlay, .civ-diplo-neg-overlay').forEach(e => e.remove()); });
    SNAP[sc] = await page.evaluate(SCAN[sc]).catch((e) => ({ error: String(e) }));
    if (SNAP[sc].error) { ok(sc + ': render bez wyjątku', false, SNAP[sc].error); continue; }
    await page.waitForTimeout(120);
    await shot(sc);
    // Q2 r3: zrzut z WIDOCZNYM dymkiem (hover na elemencie z title) dla okien war/alliance.
    if ((sc === 'war' || sc === 'alliance') && SHOT_DIR && TAG) {
      const el = await page.$('.cd-war-opt[title], .cd-war-lead[title]');
      if (el) {
        const bb = await el.boundingBox();
        await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
        await page.waitForTimeout(900);
        await shot('hover-' + sc);
        const tipText = await page.evaluate(() => { const t = document.querySelector('#civ-hud-title-tip-el'); return t ? (t.textContent || '') : ''; });
        ok('hover ' + sc + ': dymek gry pokazuje treść z title', tipText.trim().length > 0, tipText);
      } else {
        ok('hover ' + sc + ': element z title znaleziony', false);
      }
    }
    // Zamknięcie przed następnym: usuwa overlaye (window.DAR nie eksportuje closeAll).
    await page.evaluate(() => { document.querySelectorAll('.civ-diplo-modal-overlay, .civ-diplo-neg-overlay').forEach(e => e.remove()); });
    if (sc === 'audience') await page.evaluate(() => { window.DAR.hideDiplomacyAudience(); });
  }

  const hasTitle = (arr, sub) => arr.some(t => t && t.toLowerCase().indexOf(sub.toLowerCase()) !== -1);

  // Okno wojny
  const w = SNAP.war;
  if (!w.error) {
    ok('wojna: wyjaśnienie „' + TOOLTIP_WAR_OPT + '” jest w title (nie w tekście)', hasTitle(w.titles, TOOLTIP_WAR_OPT) && !vis(w.text, TOOLTIP_WAR_OPT), { t: w.titles });
    ok('wojna: uzasadnienie kary (' + REASON_DECL + ') tylko w title', !vis(w.text, REASON_DECL) && hasTitle(w.titles, REASON_DECL));
    ok('wojna: uzasadnienie „atak” (' + REASON_ATAK + ') tylko w title', !vis(w.text, REASON_ATAK) && hasTitle(w.titles, REASON_ATAK));
    ok('wojna: lead „Nie jesteście w stanie wojny” nie jest widoczny', !vis(w.text, 'Nie jesteście w stanie wojny'));
    ok('wojna: opis „wojna od razu” nie jest widoczny', !vis(w.text, 'Wojna od razu i atak w tej turze'));
    ok('wojna: przyciski akcji zostają (Wypowiedz wojnę / Anuluj)', w.text.includes('Wypowiedz wojnę') && w.text.includes('Anuluj'));
  }
  // Sojusz
  const a = SNAP.alliance;
  if (!a.error) {
    ok('sojusz: „Kara Wiarygodności i zerwanie sojuszu” tylko w title', !vis(a.text, 'Kara Wiarygodności') && hasTitle(a.titles, 'Kara Wiarygodności i zerwanie sojuszu'));
    ok('sojusz: uzasadnienie kary (' + REASON_REFUSE + ') tylko w title', !vis(a.text, REASON_REFUSE) && hasTitle(a.titles, REASON_REFUSE));
    ok('sojusz: przyciski Wypełnij sojusz / Odmów zostają', a.text.includes('Wypełnij sojusz') && a.text.includes('Odmów'));
  }
  // Zerwanie traktatu
  const b = SNAP.breakTreaty;
  if (!b.error) {
    ok('zerwanie: uzasadnienie (' + REASON_BREAK + ') tylko w title', !vis(b.text, REASON_BREAK) && hasTitle(b.titles, REASON_BREAK));
    ok('zerwanie: pytanie „Zerwać traktat?” zostaje (komunikat decyzji)', b.text.includes('Zerwać traktat?'));
    ok('zerwanie: werdykt decyzyjny „brak kary Wiarygodności za samo zerwanie” widoczny', vis(b.text, 'brak kary Wiarygodności za samo zerwanie'));
    ok('zerwanie: uzasadnienie linii info (po średniku) tylko w title', !vis(b.text, 'atak na tego partnera kosztuje') && hasTitle(b.titles, 'atak na tego partnera kosztuje'));
  }
  // Pakt
  const p = SNAP.pact;
  if (!p.error) {
    ok('pakt: „Złamanie: −30 Relacja, −20 Zaufanie” nie jest widoczne', !vis(p.text, 'Złamanie: −30'));
    ok('pakt: skutek złamania w title etykiety „Czas paktu”', hasTitle(p.titles, 'Złamanie: −30 Relacja, −20 Zaufanie'));
    ok('pakt: etykieta „Czas paktu” zostaje widoczna', p.text.includes('Czas paktu'));
  }
  // Handel
  const t = SNAP.trade;
  if (!t.error) {
    ok('handel: „zamknij to okno” nie jest widoczne', !vis(t.text, 'zamknij to okno'));
    ok('handel: pełna instrukcja w title', hasTitle(t.titles, 'zamknij to okno i użyj przycisku'));
  }
  // Dar
  const g = SNAP.gift;
  if (!g.error) {
    ok('dar: „zamknij to okno” nie jest widoczne', !vis(g.text, 'zamknij to okno'));
    ok('dar: pełna instrukcja w title', hasTitle(g.titles, 'Dar PW otwiera się w koszyku'));
  }
  // Audiencja
  const d = SNAP.audience;
  if (!d.error) {
    ok('audiencja: „(Zaufanie + Respekt)” nie jest widoczne', !vis(d.text, '(Zaufanie + Respekt)'));
    ok('audiencja: brak widocznego bloku „życiorys/bieżące”', d.hint === false && !vis(d.text, 'życiorys'));
    ok('audiencja: baner nie zawiera „zerwanie:” jako tekst', !/zerwanie:/.test(d.bannerText));
    ok('audiencja: kara zerwania w title etykiety banera', d.bannerLblTitle !== null && d.bannerLblTitle.indexOf('Pakt o nieagresji') !== -1);
    ok('audiencja: baner nadal „Stan: POKÓJ”', d.bannerText.indexOf('Stan: POKÓJ') !== -1);
  }
  ok('brak błędów strony [' + label + ']', errors.length === 0, errors);
  await page.close();
  return fails;
}

async function main() {
  console.log('diplo-all-windows-declutter-real-render-test -- start (SRC_ROOT=' + SRC_ROOT + ', TAG=' + (TAG || '-') + ')');
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  let baselineFails = -1;
  const mutantResults = [];
  try {
    const base = await runVariant(browser, 'baza', null);
    baselineFails = base.length;
    if (process.env.DIPLO_RR_ONLY_BASE !== '1') {
      for (const m of MUTANTS) {
        const f = await runVariant(browser, m.name.split(' ')[0], m);
        mutantResults.push({ name: m.name, detected: f.length > 0, n: f.length });
      }
    }
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log('');
  console.log('Mutacje (czerwień wymagana):');
  for (const r of mutantResults) console.log('  ' + (r.detected ? 'WYKRYTA' : 'NIE WYKRYTA') + ' (' + r.n + ' fail): ' + r.name);
  const allDetected = mutantResults.every(r => r.detected);
  const pass = baselineFails === 0 && (process.env.DIPLO_RR_ONLY_BASE === '1' || allDetected);
  console.log('');
  console.log('=== diplo-all-windows-declutter-real-render-test: baza fail=' + baselineFails + ', mutacje wykryte ' +
    mutantResults.filter(r => r.detected).length + '/' + mutantResults.length + ' => ' + (pass ? 'PASS' : 'FAIL') + ' ===');
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
