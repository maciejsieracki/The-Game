'use strict';
/**
 * diplomacy-audience-status-banner-test.cjs — R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1.
 * Baner formalnego statusu w audiencji dyplomatycznej ma zawsze prefiks „Stan: ” i tooltip
 * „Aktualny formalny stan umów między wami. To nie jest propozycja.” — nie wygląda jak propozycja.
 * Stan pary liczy resolveFormalDiplomaticStatus (ta sama funkcja co main.ts), baner renderuje formalBannerHtml.
 * Para w WOJNIE nie może dać banera „POKÓJ”.
 * Run: node tools/diplomacy-audience-status-banner-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dip-audience-banner-'));
const ENTRY = path.join(SRC, '.dip-audience-banner-entry.ts');
const BUNDLE = path.join(tmp, 'bundle.cjs');

function cleanup() {
  try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(128));

fs.writeFileSync(ENTRY, [
  "export { formalBannerHtml } from './ui/diplomacyAudience';",
  "export { resolveFormalDiplomaticStatus } from './game/diplomacy-display';",
  '',
].join('\n'));

// Zasoby (SVG ?raw, mp3, jpg, json) nie są potrzebne do renderu banera — puste lub tekstowe stuby.
const stubAssets = {
  name: 'stub-assets',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'stub-raw',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-raw' }, () => ({ contents: '', loader: 'text' }));
    build.onResolve({ filter: /\.(svg|mp3|jpg|png|webp|ogg|wav|css)$/ }, (args) => ({
      path: args.path, namespace: 'stub-empty',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-empty' }, () => ({ contents: 'export default ""', loader: 'js' }));
  },
};

esbuild.build({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
  loader: { '.json': 'json' },
  // import.meta.glob (Vite) — w bundlu CJS zastąpiony pustą mapą; baner go nie używa.
  define: { 'import.meta.glob': '__mockImportMetaGlob' },
  banner: { js: 'var __mockImportMetaGlob = function () { return {}; };' },
  plugins: [stubAssets],
}).then(runTests, (err) => { console.error(err); process.exit(2); });

function runTests() {
const mod = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(cond, msg, detail) {
  if (cond) { pass++; console.log('PASS: ' + msg); }
  else { fail++; console.log('FAIL: ' + msg + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

/** Stan pary jak w main.ts: relationStatus z rel.status, traktaty jako flagi. */
function pairState(relationStatus, extra) {
  const e = extra || {};
  const formalStatus = mod.resolveFormalDiplomaticStatus({
    relationStatus,
    allianceFormalKind: e.allianceFormalKind ?? null,
    hasNap: !!e.hasNap,
    hasTrade: !!e.hasTrade,
    contactEstablished: e.contact !== false,
  });
  return {
    formalStatus,
    formalStatusDetail: e.detail,
    truceUntilTurn: e.truceUntilTurn ?? null,
    currentTurn: e.currentTurn ?? 10,
  };
}

function bannerOf(relationStatus, extra) {
  return mod.formalBannerHtml(pairState(relationStatus, extra));
}

const TOOLTIP = 'Aktualny formalny stan umów między wami. To nie jest propozycja.';

// 1. Para w WOJNIE (sprawa właściciela) — baner „Stan: WOJNA”, ton wojna, nie „POKÓJ”.
const war = bannerOf('wojna', { contact: true, hasNap: true, detail: { sinceTurns: 3 } });
ok(war.includes('Stan: WOJNA'), 'wojna: baner mówi „Stan: WOJNA”', war);
ok(war.includes('da-tone-wojna'), 'wojna: ton da-tone-wojna zachowany', war);
ok(!/POK[ÓO]J/.test(war), 'przy aktywnej wojnie baner nie mówi „POKÓJ”', war);
ok(war.includes(TOOLTIP), 'wojna: tooltip „to nie jest propozycja”', war);

// 2. Pokój — „Stan: POKÓJ”.
const peace = bannerOf('pokoj', { contact: true });
ok(peace.includes('Stan: POKÓJ'), 'pokój: baner mówi „Stan: POKÓJ”', peace);
ok(peace.includes('da-tone-pokoj'), 'pokój: ton da-tone-pokoj zachowany', peace);
ok(peace.includes(TOOLTIP), 'pokój: tooltip „to nie jest propozycja”', peace);

// 3. Rozejm — prefiks i podpis „Rozejm do tury N” zachowane.
const truce = bannerOf('pokoj', { contact: true, truceUntilTurn: 15, currentTurn: 10 });
ok(truce.includes('Stan: POKÓJ') && truce.includes('Rozejm do tury 15'), 'rozejm: „Stan: POKÓJ” + „Rozejm do tury 15”', truce);

// 4. Sojusz, pakt, handel, brak — prefiks na każdym statusie.
ok(bannerOf('sojusz', { allianceFormalKind: 'wojskowy' }).includes('Stan: '), 'sojusz: prefiks „Stan: ”');
ok(bannerOf('pokoj', { hasNap: true }).includes('Stan: PAKT O NIEAGRESJI'), 'pakt: „Stan: PAKT O NIEAGRESJI”');
ok(bannerOf('pokoj', { hasTrade: true }).includes('Stan: '), 'handel: prefiks „Stan: ”');
ok(bannerOf('pokoj', { contact: false }).includes('Stan: BRAK KONTAKTU'), 'brak: „Stan: BRAK KONTAKTU”');

// 5. Każdy baner ma etykietę zaczynającą się od „Stan: ”.
const all = [war, peace, truce];
ok(all.every((b) => /class="da-b-lbl">Stan: /.test(b)), 'każdy baner ma etykietę zaczynającą się od „Stan: ”');

// 6. Brak formalStatus — brak banera (bez zmian).
ok(mod.formalBannerHtml({ formalStatus: undefined }) === '', 'bez formalStatus brak banera');

console.log('=== diplomacy-audience-status-banner-test: ' + pass + ' pass, ' + fail + ' fail ===');
process.exit(fail === 0 ? 0 : 1);
}
