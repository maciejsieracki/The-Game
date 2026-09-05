'use strict';
/**
 * wpiecie-dispatch-check.cjs — uruchamia .wpiecie-dispatch-check-entry.ts w
 * chromium (units.ts wymaga DOM) i wypisuje wynik sprawdzenia dispatchu.
 * Uruchamiać z katalogu gra/:  node tools/wpiecie-dispatch-check.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const out = esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'tools', '.wpiecie-dispatch-check-entry.ts')],
  bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
  write: false, absWorkingDir: ROOT,
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, () => '<\\/script');
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}
const tmp = path.join(os.tmpdir(), `wpiecie-dispatch-check-${TMPDIR_RUN_ID}.html`);
fs.writeFileSync(tmp, `<!DOCTYPE html><meta charset="utf-8"><body><script>${js}</script></body>`);

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__check, { timeout: 20000 });
  const res = await page.evaluate(() => window.__check());
  await browser.close();
  for (const r of res.rows) console.log(r);
  if (errs.length) console.log('BLEDY STRONY:', errs.join(' | '));
  console.log(res.ok ? '\nDISPATCH OK' : '\nDISPATCH FAIL');
  process.exit(res.ok ? 0 : 1);
})().catch((e) => { console.error('FAIL:', (e && e.stack) || e); process.exit(1); });
