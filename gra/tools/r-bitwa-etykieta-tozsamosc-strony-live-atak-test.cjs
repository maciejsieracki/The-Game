'use strict';
/**
 * r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs
 * R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1 — RUNDA 2, dowód ZYWY z PRAWDZIWEGO ATAKU.
 *
 * DLACZEGO TA BRAMKA ISTNIEJE (Evaluator, runda 1, FAIL):
 * `r-bitwa-etykieta-tozsamosc-strony-real-render-test.cjs` wstrzykiwal dane wprost do
 * `buildPostBattleSummary()` przez hak `__postBattleSummaryTestDebug` — omijal wiec
 * CALA sciezke, ktora ustawia `attackerSideLabel`/`defenderSideLabel` (nazwa typu
 * jednostki) i nie mogl zlapac buga priorytetu w `_sideDisplayLabel()`. Ta bramka NIE
 * wstrzykuje nic: klika PRAWDZIWA mape, w PRAWDZIWEJ grze, i sprawdza to, co gracz widzi.
 *
 * SCIEZKA (zero hakow sterujacych, zero wstrzykiwania danych bitwy):
 *  1. `?playtest=walka` — realny sandbox z main.ts (`doStartPlaytestWalkaMapy` →
 *     `buildPlaytestWalkaMapy`, seed PLAYTEST_WALKA_SEED=424242, wiec swiat jest
 *     DETERMINISTYCZNY): Rzym = gracz (ownerId 0, `u0` Hastati), Grecja = wrog
 *     (ownerId 1, `u-ai-1` Lucznik) na sasiednim heksie. RUNDA 3, zarzut Evaluatora
 *     5b: naglowek deklarowal wczesniej `?playtest=mapa`, a kod szedl na
 *     `?playtest=walka` — niespojnosc naprawiona po stronie naglowka, bo to
 *     `?playtest=walka` daje deterministyczna, nazwana pare cywilizacji
 *     (Rzymianie vs Grecy), na ktorej mozna postawic asercje na DOKLADNY string.
 *  2. Test rzutuje heks → piksel TA SAMA matematyka co gra (kamera: elewacja 52°,
 *     yaw 0, fov 50 — `render/camera.ts:_syncCamera`, `render/scene.ts:3080`;
 *     `axialToWorld` z `render/hexutil.ts`), stan kamery czyta z gry
 *     (`__sidePanelLinkTestDebug.cameraTarget()`), wspolrzedne jednostek z
 *     `__cityStateStartUnitsTestDebug.dumpState()` (surowy odczyt `units`).
 *  3. PRAWDZIWY klik myszy w canvas na heksie jednostki gracza (zaznaczenie) →
 *     PRAWDZIWY klik na heksie wroga → realny handler mapy (main.ts:22932 `pickHexAt`
 *     → `openPlayerMapUnitAttack`) → zgoda na wojne (klik w dialogu) → preBattle →
 *     klik "Pole bitwy" (`[data-act="deploy"]`) → REALNY `new BattleScene(...)` z
 *     `attackerSideLabel`/`defenderSideLabel` ustawionymi na NAZWE TYPU JEDNOSTKI.
 *  4. Asercja na DOM paska naglowka bitwy: bold nazwa strony = DOKLADNY string
 *     z `ownerDiploLabel` — "Rzymianie" po lewej, "Grecy" po prawej. RUNDA 3,
 *     zarzut Evaluatora 5a: poprzednia asercja prawej strony brzmiala "dowolne
 *     slowo 4+ liter, ktore nie jest nazwa typu jednostki" — przechodzila takze na
 *     "Przeciwnik" i na "rzymianie" (male litery, SUROWE id cywilizacji z
 *     `civLabelForOwner`, czyli dokladnie bug z zarzutu 2). Teraz obie strony sa
 *     porownywane na rownosc ze stringiem oczekiwanym, plus jawna czarna lista
 *     ('Gracz'/'Przeciwnik'/'Wrog'/surowe id malymi literami).
 *
 * CZEGO TA BRAMKA NIE DOWODZI (uczciwie, REGULA PRZECIW SAMOOSZUKIWANIU): obie
 * strony w tym sandboxie to PELNE cywilizacje, wiec kryteria konca 3 (ikona
 * miasta-panstwa) i 5 (ikona barbarzyncy) NIE sa tu pokryte. Pokryta zywo jest
 * polowa kryterium 3 dotyczaca atakujacego (pelna cywilizacja -> portret wladcy,
 * `<img>`, NIE generyczny PB_SVG.commander) — asercja "medalion" nizej. Patrz
 * raport rundy 3, zarzut 3.
 *
 * NIETAUTOLOGICZNOSC (dwie niezalezne mutacje, obie musza dac CZERWONY wynik):
 *  `LIVE_ATAK_MUTACJA=1` — odwraca priorytet w `_sideDisplayLabel` (custom przed
 *    civLabel = stan sprzed naprawy GOAL 1); bold ma wtedy pokazac nazwe jednostki.
 *  `LIVE_ATAK_MUTACJA=2` — RUNDA 3, zarzut Evaluatora 5a: przywraca
 *    `civLabelForOwner(0)` zwracajace SUROWE id cywilizacji ("rzymianie") zamiast
 *    `ownerDiploLabel(0)` ("Rzymianie") — dokladnie bug z zarzutu 2, ktorego stara,
 *    slaba asercja ("dowolne slowo 4+ liter") NIE lapala. Mutacja buduje bundel ze
 *    zmienionym zrodlem i oczekuje CZERWONEGO wyniku.
 *
 * Bramka (z katalogu gra/): node tools/r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
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
const OUT_DIR = path.join(os.tmpdir(), `civ-dist-bitwa-etykieta-live-atak-${TMPDIR_RUN_ID}`);
const SRC_BATTLE = path.join(GRA_DIR, 'src/battle/battleScene.ts');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MUTACJA = ['1', '2', '3'].includes(String(process.env.LIVE_ATAK_MUTACJA))
  ? String(process.env.LIVE_ATAK_MUTACJA) : null;

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  [OK] ${label}`); }
  else { fail++; console.error(` [FAIL] ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ── Mutacje zrodla (dowod nietautologicznosci) ───────────────────────────────
const SRC_MAIN = path.join(GRA_DIR, 'src/main.ts');
const ORIG = fs.readFileSync(SRC_BATTLE, 'utf8');
const ORIG_MAIN = fs.readFileSync(SRC_MAIN, 'utf8');
const GOOD = `    const civLabel = this._civLabelForSideExplicit(side);
    if (civLabel) return civLabel;
    const custom = side === 'atk' ? this._attackerSideLabel : this._defenderSideLabel;
    if (custom) return custom;`;
const BAD = `    const custom = side === 'atk' ? this._attackerSideLabel : this._defenderSideLabel;
    if (custom) return custom;
    const civLabel = this._civLabelForSideExplicit(side);
    if (civLabel) return civLabel;`;
// Mutacja 2 (zarzut Evaluatora 2): civLabelForOwner(0) znowu zwraca SUROWE id.
const GOOD_MAIN = `      if (ownerId === 0) {
        const diplo = ownerDiploLabel(0).trim();
        if (diplo) return diplo;
        return String(player.civType || _menuCivId || 'Gracz');
      }`;
const BAD_MAIN = `      if (ownerId === 0) {
        return String(player.civType || _menuCivId || 'Gracz');
      }`;
// Mutacja 3 (runda 3, zarzut Evaluatora 3): mapowe podsumowanie znowu bierze bold/werdykt
// z NAZWY TYPU JEDNOSTKI zamiast z civLabel -- stan sprzed naprawy w
// `applyMapBattleOutcomeWithSummary`, ktory dal zywo „Hastati wygrywa".
const GOOD_MAP_SUMMARY = `        atkLabel: (summary.atkCivLabel ?? '').trim() || summary.atkLabel,
        defLabel: (summary.defCivLabel ?? '').trim() || summary.defLabel,`;
const BAD_MAP_SUMMARY = `        atkLabel: summary.atkLabel,
        defLabel: summary.defLabel,`;
function applyMutation() {
  if (MUTACJA === '3') {
    if (!ORIG_MAIN.includes(GOOD_MAP_SUMMARY)) throw new Error('Nie znaleziono wzorca mapowego podsumowania do mutacji 3.');
    fs.writeFileSync(SRC_MAIN, ORIG_MAIN.replace(GOOD_MAP_SUMMARY, BAD_MAP_SUMMARY), 'utf8');
    return;
  }
  if (MUTACJA === '2') {
    if (!ORIG_MAIN.includes(GOOD_MAIN)) throw new Error('Nie znaleziono wzorca civLabelForOwner do mutacji 2.');
    fs.writeFileSync(SRC_MAIN, ORIG_MAIN.replace(GOOD_MAIN, BAD_MAIN), 'utf8');
    return;
  }
  if (!ORIG.includes(GOOD)) throw new Error('Nie znaleziono wzorca _sideDisplayLabel do mutacji 1.');
  fs.writeFileSync(SRC_BATTLE, ORIG.replace(GOOD, BAD), 'utf8');
}
/**
 * RUNDA 3 (obrona, znalezisko wlasne): przywracanie MUSI byc zawezone do biegu z mutacja.
 * Wczesniej `restoreSource()` bylo wolane BEZWARUNKOWO z `.catch` na koncu pliku, wiec
 * KAZDY blad biegu bez mutacji (takze zabicie procesu w trakcie) nadpisywal
 * `src/main.ts` i `src/battle/battleScene.ts` snapshotem zrobionym przy STARCIE testu —
 * czyli po cichu cofal zmiany zapisane w tych plikach juz po starcie bramki. Zdarzylo
 * sie to realnie w tej rundzie (naprawa mapowego podsumowania zniknela z main.ts).
 * Bez mutacji bramka NIE MA POWODU pisac do zrodel — i teraz tego nie robi.
 */
function restoreSource() {
  if (!MUTACJA) return;
  fs.writeFileSync(SRC_BATTLE, ORIG, 'utf8');
  fs.writeFileSync(SRC_MAIN, ORIG_MAIN, 'utf8');
}

function buildBundle() {
  console.log('[live-atak] vite build (dozwolona komenda C-001, outDir poza repo)...');
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Brak index.html w ' + OUT_DIR);
}

// ── Rzut heks → piksel: DOKLADNIE ta sama kamera co gra ──────────────────────
const SQRT3 = Math.sqrt(3);
const HEX_R = 1.0;
const ELEV_DEG = 52;   // render/camera.ts:_syncCamera
const FOV_DEG = 50;    // render/scene.ts:3080
function axialToWorld(q, r) { return { x: HEX_R * SQRT3 * (q + r * 0.5), z: HEX_R * 1.5 * r }; }
function hexToPixel(q, r, cam, W, H, yTerrain) {
  const el = ELEV_DEG * Math.PI / 180;
  // Kamera: target + dist*(cosEl*sin(yaw), sinEl, cosEl*cos(yaw)), yaw = 0.
  const C = { x: cam.x, y: cam.dist * Math.sin(el), z: cam.z + cam.dist * Math.cos(el) };
  const T = { x: cam.x, y: 0, z: cam.z };
  const norm = (v) => { const l = Math.hypot(v.x, v.y, v.z); return { x: v.x / l, y: v.y / l, z: v.z / l }; };
  const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const fwd = norm(sub(T, C));                      // -Z kamery
  const right = norm(cross(fwd, { x: 0, y: 1, z: 0 }));
  const up = cross(right, fwd);
  const w = axialToWorld(q, r);
  const P = sub({ x: w.x, y: yTerrain || 0, z: w.z }, C);
  const xv = dot(P, right), yv = dot(P, up), zv = dot(P, fwd); // zv > 0 = przed kamera
  const f = 1 / Math.tan((FOV_DEG * Math.PI / 180) / 2);
  const aspect = W / H;
  const ndcX = (f / aspect) * xv / zv;
  const ndcY = f * yv / zv;
  return { x: (ndcX * 0.5 + 0.5) * W, y: (-ndcY * 0.5 + 0.5) * H, ok: zv > 0.1 };
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch {
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function run(MODE) {
  const { chromium } = require('playwright');
  const browser = await launchBrowser(chromium);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const shots = fs.mkdtempSync(path.join(os.tmpdir(), 'live-atak-'));
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  try {
    console.log('\n=== SANDBOX ?playtest=' + MODE + ' ===');
    await page.goto('file://' + path.join(OUT_DIR, 'index.html') + '?playtest=' + MODE,
      { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(
      () => !!window.__cityStateStartUnitsTestDebug && !!window.__sidePanelLinkTestDebug,
      undefined, { timeout: 180000 });
    // Realny sandbox startuje sam (main.ts: playtestMapaUrl -> doStartPlaytestMapaSwiata).
    await page.waitForFunction(() => {
      try {
        const s = window.__cityStateStartUnitsTestDebug.dumpState();
        return s.units.some(u => u.ownerId === 0) && s.units.some(u => u.ownerId === 1);
      } catch { return false; }
    }, undefined, { timeout: 180000 });
    await wait(3000); // dojechanie kamery / render

    const st = await page.evaluate(() => ({
      units: window.__cityStateStartUnitsTestDebug.dumpState().units,
      cam: window.__sidePanelLinkTestDebug.cameraTarget(),
      W: window.innerWidth, H: window.innerHeight,
    }));
    const mine = st.units.filter(u => u.ownerId === 0);
    const foe = st.units.find(u => u.ownerId === 1);
    if (!foe) throw new Error('Brak jednostki wroga w sandboxie ?playtest=' + MODE);
    const hexDist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
    const atk = mine.filter(u => hexDist(u, foe) === 1).sort((a, b) => a.id < b.id ? -1 : 1)[0];
    if (!atk) throw new Error('Brak jednostki gracza sasiadujacej z wrogiem: ' + JSON.stringify({ mine, foe }));
    console.log('  atakujacy', JSON.stringify(atk), '| obronca', JSON.stringify(foe), '| kamera', JSON.stringify(st.cam));

    const pAtk = hexToPixel(atk.q, atk.r, st.cam, st.W, st.H, 0);
    const pDef = hexToPixel(foe.q, foe.r, st.cam, st.W, st.H, 0);
    console.log('  piksele: atk', JSON.stringify(pAtk), 'def', JSON.stringify(pDef));

    // KROK 1 — prawdziwy klik w heks jednostki gracza (zaznaczenie).
    await page.mouse.click(Math.round(pAtk.x), Math.round(pAtk.y));
    await wait(1200);
    await page.screenshot({ path: path.join(shots, '01-zaznaczenie.png') });
    console.log('  [diag po kliku atk] ' + JSON.stringify((await page.evaluate(() => (document.body.innerText||'').replace(/\s+/g,' ').slice(0,600)))));

    // KROK 2 — prawdziwy klik w heks wroga (atak).
    await page.mouse.click(Math.round(pDef.x), Math.round(pDef.y));
    await wait(1500);
    await page.screenshot({ path: path.join(shots, '02-po-kliku-wroga.png') });
    console.log('  [diag po kliku def] ' + JSON.stringify((await page.evaluate(() => (document.body.innerText||'').replace(/\s+/g,' ').slice(0,900)))));
    console.log('  [diag przyciski] ' + JSON.stringify((await page.evaluate(() => Array.from(document.querySelectorAll('button,[role=\"button\"],[data-act]')).filter(b=>b.offsetParent!==null).map(b=>((b.getAttribute('data-act')||'')+'|'+(b.textContent||'').trim()).slice(0,50)).slice(0,40)))));

    // KROK 3 — ewentualna zgoda na wojne (withPlayerWarConsent) — klik w realny przycisk.
    const consent = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"], .btn'));
      const t = btns.find(b => /wypowiedz|wypowiedź|tak|potwierd|zaatakuj|wojn/i.test(b.textContent || '')
        && b.offsetParent !== null);
      if (t) { t.click(); return (t.textContent || '').trim().slice(0, 60); }
      return null;
    });
    if (consent) { console.log('  zgoda na wojne: klik "' + consent + '"'); await wait(1500); }

    // KROK 3b — realny dialog "ATAK NA MIASTO" (mapFieldBattle.ts, trzeci realny wolajacy
    // BattleScene z zarzutu Evaluatora): wybor SZTURM = klawisz "2", dokladnie ten sam
    // skrot, ktory pokazuje gracz w dialogu ("1 = Oblegaj · 2 = Szturm · Esc = Wycofaj").
    const cityAssault = await page.evaluate(() => /ATAK NA MIASTO/i.test(document.body.innerText || ''));
    if (cityAssault) {
      console.log('  dialog ATAK NA MIASTO -> klik SZTURM ([data-act="storm"])');
      await page.click('[data-act="storm"]');
      await wait(2500);
      await page.screenshot({ path: path.join(shots, '03a-po-szturmie.png') });
    }

    // KROK 4 — preBattle: klik "Pole bitwy" (realny przycisk gracza).
    const hasDeploy = await page.evaluate(() => !!document.querySelector('[data-act="deploy"]'));
    if (hasDeploy) {
      await page.screenshot({ path: path.join(shots, '03-prebattle.png') });
      await page.click('[data-act="deploy"]');
      await wait(4000);
    } else {
      console.log('  brak preBattle ([data-act="deploy"]) -- bitwa startuje wprost ze szturmu');
      await wait(4000);
    }
    await page.screenshot({ path: path.join(shots, '04-bitwa-pasek.png'), fullPage: false });

    // KROK 4b — faza rozstawiania (BattleScene deploy=true): realny przycisk "START WALKI".
    const started = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button,div,span'))
        .filter(e => e.offsetParent !== null && /^start walki$/i.test((e.textContent || '').trim()));
      const t = b[b.length - 1];
      if (t) { t.click(); return true; }
      return false;
    });
    console.log('  faza rozstawiania -> klik "START WALKI": ' + started);
    await wait(2000);
    await page.screenshot({ path: path.join(shots, '04b-start-walki.png') });

    // Pasek naglowka (buildCommanderCorner) pojawia sie z zywym podsumowaniem w trakcie
    // walki -- czekamy az realnie sie wyrenderuje (max 120 s realnej bitwy).
    // RUNDA 3 (zarzut Evaluatora 5a): rog musi byc namierzony PRECYZYJNIE. Poprzednia
    // wersja lapala takze srodkowy tytul popupu ("Stan oddzialow", cx=720), ktory
    // wpadal do `rightC` i osłabiał asercje prawej strony. Rog to element wewnatrz
    // `buildCommanderCorner`: absolutnie pozycjonowany wrapper (top 30px, left/right
    // 30px) z medalionem 84x84 obok. Wymagamy wiec medalionu w dziadku ORAZ realnego
    // przylegania do krawedzi ekranu -- tytul na srodku odpada strukturalnie.
    const readCorners = () => page.evaluate(() => {
      const out = [];
      for (const el of Array.from(document.querySelectorAll('div'))) {
        const cs = getComputedStyle(el);
        if (cs.fontSize !== '22px' || el.children.length !== 0) continue;
        const t = (el.textContent || '').trim();
        if (!t) continue;
        const r = el.getBoundingClientRect();
        if (r.top < 10 || r.top > 160 || r.width === 0) continue;
        const wrap = el.parentElement && el.parentElement.parentElement;
        if (!wrap) continue;
        // Krawedz liczona na WLASNYM prostokacie napisu: `buildCommanderCorner` kotwiczy
        // rog absolutnie na left/right 30px, wiec bold siedzi przy krawedzi. Srodkowy
        // tytul popupu ("Stan oddzialow") ma ten sam fontSize i medalion w dziadku
        // (panel rozciaga sie na caly ekran), ale jego wlasny prostokat jest na srodku.
        const nearEdge = r.left < 400 || (window.innerWidth - r.right) < 400;
        const medal = wrap.querySelector('img, svg');
        if (!medal || !nearEdge) continue;
        // Podtytul rogu (11px, UPPERCASE) -- zarzut Evaluatora 4 (duplikacja tozsamosci).
        const sub = el.nextElementSibling;
        out.push({
          text: t,
          cx: r.left + r.width / 2,
          medal: medal.tagName.toLowerCase(),
          // RUNDA 3 (zarzut Evaluatora 2): sam tagName NIE odroznia trzech galezi doboru
          // ikony -- `civIconSvg` (miasto-panstwo), `brandIconSvg('chip-death')`
          // (barbarzynca) i `PB_SVG.commander` (fallback) to WSZYSTKO <svg>. Zapisujemy
          // wiec podpis TRESCI medalionu, zeby dalo sie porownywac ikony miedzy
          // scenariuszami, a nie tylko nazwy tagow.
          medalSig: (medal.tagName.toLowerCase() === 'img'
            ? 'img:' + String(medal.getAttribute('src') || '').slice(0, 48)
            : 'svg:' + (medal.outerHTML || '').replace(/\s+/g, '').slice(0, 160)),
          sub: sub ? (sub.textContent || '').trim() : null,
        });
      }
      return { corners: out, verdict: (document.body.innerText || '').match(/[^\n]*wygrywa[^\n]*/i)?.[0] ?? null };
    });
    // KROK 4c — "I" = stan oddzialow: TEN SAM widok postBattleSummary (pasek naglowka
    // + werdykt), ktory gracz widzi na koncu bitwy -- karmiony przez
    // _buildBattleSummaryData -> _sideDisplayLabel, czyli DOKLADNIE sporna wartosc.
    let corner = { corners: [], verdict: null };
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('i');
      await wait(1200);
      corner = await readCorners();
      if (corner.corners.length >= 2) break;
      await page.keyboard.press('i');      // zamknij i sprobuj ponownie po kolejnej turze
      await page.keyboard.press('Space');  // nastepna tura bitwy
      await wait(1500);
    }
    await page.screenshot({ path: path.join(shots, '05-pasek-naglowka.png') });

    // KROK 5 — odczyt PASKA NAGLOWKA BITWY (buildCommanderCorner, postBattleSummary.ts):
    // medalion + bold nazwa 22px w gornych rogach. Namierzany po realnej geometrii i
    // stylu (top ~30px, fontSize 22px), nie po tekscie -- test nie zna z gory oczekiwanej
    // etykiety, wiec nie moze jej sobie "znalezc".
    console.log('  rogi paska bitwy: ' + JSON.stringify(corner.corners));
    const W = st.W;
    const leftC = corner.corners.filter(c => c.cx < W / 2);
    const rightC = corner.corners.filter(c => c.cx >= W / 2);
    const unitNames = /^(Hastati|Łucznik|Lucznik|Wojownik|Skład \(\d+\)|Sklad \(\d+\))$/i;
    const atkType = atk.typeId, defType = foe.typeId;

    assert('pasek bitwy renderuje OBA rogi (lewy + prawy)', leftC.length === 1 && rightC.length === 1,
      { leftC, rightC });
    assert(`bold LEWA (gracz/atakujacy) NIE jest nazwa typu jednostki ("${atkType}")`,
      leftC.length >= 1 && !leftC.some(c => unitNames.test(c.text)), leftC.map(c => c.text));
    assert(`bold PRAWA (obronca) NIE jest nazwa typu jednostki ("${defType}")`,
      rightC.length >= 1 && !rightC.some(c => unitNames.test(c.text)), rightC.map(c => c.text));

    // ── ASERCJE NA DOKLADNY STRING (zarzut Evaluatora 5a) ────────────────────────
    // Sandbox `?playtest=walka` jest deterministyczny (PLAYTEST_WALKA_SEED=424242,
    // buildPlaytestWalkaMapy: Rzym=ownerId 0, Grecja=ownerId 1), wiec `ownerDiploLabel`
    // ma DOKLADNIE jedna poprawna wartosc per strona. Rownosc, nie dopasowanie wzorca:
    // stara asercja "4+ liter" przechodzila na "Przeciwnik" i na "rzymianie".
    const EXPECT_LEFT = 'Rzymianie';   // ownerDiploLabel(0) -> data.civs.cywilizacje.Cywilizacja
    const EXPECT_RIGHT = 'Grecy';      // ownerDiploLabel(1), ta sama funkcja, ten sam format
    const BLACKLIST = ['Gracz', 'Przeciwnik', 'Wróg', 'Wrog', 'Atakujący', 'Obrońca',
      'rzymianie', 'grecy', 'Rzym', 'Grecja'];
    const leftText = leftC.length === 1 ? leftC[0].text : null;
    const rightText = rightC.length === 1 ? rightC[0].text : null;

    assert(`bold LEWA === "${EXPECT_LEFT}" DOKLADNIE (ownerDiploLabel, wielka litera; KRYTERIUM 1)`,
      leftText === EXPECT_LEFT, { leftText, EXPECT_LEFT });
    assert(`bold PRAWA === "${EXPECT_RIGHT}" DOKLADNIE (ownerDiploLabel, KRYTERIUM 1)`,
      rightText === EXPECT_RIGHT, { rightText, EXPECT_RIGHT });
    assert('zadna strona nie pokazuje zaimka/surowego id z czarnej listy (Gracz/Przeciwnik/rzymianie/...)',
      !BLACKLIST.includes(String(leftText)) && !BLACKLIST.includes(String(rightText)),
      { leftText, rightText, BLACKLIST });

    // ── Zarzut Evaluatora 4: rog nie powtarza tozsamosci dwa razy ────────────────
    // Bold niesie tozsamosc, wiec podtytul ma pokazac SKLAD (nazwa jednostki przy
    // 1-osobowym rosterze), nie ta sama nazwe cywilizacji drugi raz.
    const subLeft = leftC.length === 1 ? String(leftC[0].sub || '') : '';
    const subRight = rightC.length === 1 ? String(rightC[0].sub || '') : '';
    assert('podtytul LEWY nie powtarza tozsamosci z bold (pokazuje sklad + role)',
      subLeft.length > 0 && !new RegExp('^' + EXPECT_LEFT + '\\s*·', 'i').test(subLeft), subLeft);
    assert('podtytul PRAWY nie powtarza tozsamosci z bold (pokazuje sklad + role)',
      subRight.length > 0 && !new RegExp('^' + EXPECT_RIGHT + '\\s*·', 'i').test(subRight), subRight);
    assert('podtytul LEWY niesie sklad (nazwa jednostki przy 1-osobowym rosterze) + role',
      new RegExp('^' + atkType + '\\s*·', 'i').test(subLeft), { subLeft, atkType });
    assert('podtytul PRAWY niesie sklad + role',
      new RegExp('^' + defType + '\\s*·', 'i').test(subRight), { subRight, defType });

    // ── KRYTERIUM 3 (polowa: atakujacy = pelna cywilizacja) ──────────────────────
    // Portret wladcy renderuje sie jako <img>; generyczny PB_SVG.commander to <svg>.
    // Ta asercja przechodzi TYLKO gdy civIconId + era + isCityState=false +
    // isBarbarian=false doszly cala droga main.ts -> BattleScene ->
    // _buildBattleSummaryData -> BattleSummarySide -> buildCommanderCorner.
    assert('medalion LEWY (pelna cywilizacja) to portret wladcy <img>, NIE generyczny PB_SVG.commander',
      leftC.length === 1 && leftC[0].medal === 'img', leftC.map(c => c.medal));
    assert('medalion PRAWY (pelna cywilizacja) to portret wladcy <img>, NIE generyczny PB_SVG.commander',
      rightC.length === 1 && rightC[0].medal === 'img', rightC.map(c => c.medal));

    // ── KROK 6 — KRYTERIUM KONCA 2: WERDYKT, ZYWO, NA SKONCZONEJ BITWIE ─────────
    // RUNDA 3, zarzut Evaluatora 3: poprzednia asercja byla PUSTA (vacuous):
    //   `!corner.verdict || !RegExp(atkType|defType + ' wygrywa').test(corner.verdict)`
    // Bitwa NIGDY nie dobiegala tu konca (`corner.verdict === null`, zrzut
    // `05-pasek-naglowka.png` pokazywal STATUS „Bitwa w toku"), wiec lewa strona
    // alternatywy byla ZAWSZE prawdziwa i asercja przechodzila bezwarunkowo — przeszlaby
    // takze przy werdykcie „Hastati wygrywa", czyli dokladnie przy bugu, ktory ma lapac.
    // Teraz doprowadzamy bitwe do FAKTYCZNEGO konca REALNYMI skrotami gracza
    // (`R` = AUTO-rozegranie -> `_toggleManualMode`, battleScene.ts:15894;
    //  `3` = najszybsze tempo, `SPACJA` = start kolejnej tury) i asertujemy ROWNOSC
    // z jedna z DWOCH dopuszczalnych wartosci (`battle-summary.ts:154-155`:
    // `label + ' wygrywa'`, gdzie `label` = `_sideDisplayLabel`, czyli sporna wartosc).
    // Brak werdyktu w twardym limicie = TWARDY FAIL, nie ciche przejscie.
    await page.keyboard.press('i');   // zamknij zywe podsumowanie (blokuje sterowanie)
    await wait(800);
    // AUTO + maksymalne tempo REALNYMI przyciskami panelu „Tempo" przy minimapie
    // (battleScene.ts:10370-10376: `_adjustSpeedIdx(+1)` / `_toggleManualMode()`), a nie
    // skrotami klawiszowymi -- pierwszy bieg tej wersji pokazal zywo, ze `3` NIE ustawia
    // tempa (HUD nadal „x1"), wiec bitwa szla 1x i po 240 s stala na turze 11.
    // SPEED_STEPS = [1,2,4,...,512] (battleScene.ts:2407), wiec 9 klikniec „Przyspiesz"
    // wysyca drabine na 512x.
    const autoOn = await page.evaluate(() => {
      const b = document.querySelector('button[title^="AUTO-rozegranie"]');
      if (!b) return false;
      b.click(); return true;
    });
    await wait(800);
    // Tempo: klawisz „V" = `_cycleSpeed()` (battleScene.ts:9432-9440, `_onKeySpeed`),
    // drabina SPEED_STEPS = [1,2,4,...,512] (battleScene.ts:2407). Klawisz, nie przycisk
    // panelu: bieg diagnostyczny pokazal, ze `button[title="Przyspiesz"]` bywa niedostepny
    // w DOM w tym momencie (0 klikniec), a `V` dziala niezaleznie od focusu (handler na
    // `window`). 9 nacisniec = 1x -> 512x.
    for (let i = 0; i < 9; i++) { await page.keyboard.press('v'); await wait(150); }
    const speedLbl = await page.evaluate(() => {
      const m = (document.body.innerText || '').match(/\bx(\d+)\b/);
      return m ? m[0] : null;
    });
    console.log(`  AUTO=${autoOn} · tempo HUD=${speedLbl}`);
    // Sekwencja konca bitwy (ta sama, ktora pinuje `tools/bitwa-podsumowanie-dispose-test.cjs`):
    // koniec walki -> EKRAN KONCA BITWY 3D („Zwyciestwo" + „POWROT NA MAPE") -> dopiero
    // REALNY klik „POWROT NA MAPE" odpala `onFinishCb` -> `showPostBattleSummary` NA MAPIE,
    // czyli widok z werdyktem „<label> wygrywa". Bieg diagnostyczny tej rundy potwierdzil to
    // zywo: przy 512x bitwa konczyla sie na turze 4 z ekranem „Zwyciestwo · TWOJE STRATY -1 ·
    // STRATY WROGA -16", ale slowo „wygrywa" nie pada, dopoki gracz nie wroci na mape.
    const VERDICT_DEADLINE_MS = 240000;   // twardy limit; po nim FAIL, nie „przechodzi"
    const tVerdict = Date.now();
    let verdict = null;
    let spins = 0;
    let backClicks = 0;
    while (Date.now() - tVerdict < VERDICT_DEADLINE_MS) {
      const snapshot = await page.evaluate(() => {
        const txt = document.body.innerText || '';
        const hit = Array.from(document.querySelectorAll('button,div,span')).find(
          e => e.offsetParent !== null && /^powr[oó]t na map[eę]$/i.test((e.textContent || '').trim()));
        return {
          verdict: txt.match(/[^\n]*wygrywa[^\n]*/i)?.[0] ?? null,
          endScreen: !!hit,
        };
      });
      verdict = snapshot.verdict;
      if (verdict) break;
      if (snapshot.endScreen && backClicks < 3) {
        const clicked = await page.evaluate(() => {
          const hit = Array.from(document.querySelectorAll('button,div,span')).find(
            e => e.offsetParent !== null && /^powr[oó]t na map[eę]$/i.test((e.textContent || '').trim()));
          if (!hit) return false;
          hit.click(); return true;
        });
        backClicks += clicked ? 1 : 0;
        console.log(`  ekran konca bitwy -> realny klik "POWROT NA MAPE" (#${backClicks})`);
        await wait(3000);
        continue;
      }
      if (spins % 4 === 0) {
        const snap = await page.evaluate(() => {
          const t = (document.body.innerText || '').replace(/\s+/g, ' ');
          const i2 = t.search(/CZAS BITWY|Bitwa w toku|Zwyci[eę]stwo|Pora[zż]ka/i);
          return i2 >= 0 ? t.slice(Math.max(0, i2 - 60), i2 + 180) : t.slice(-200);
        });
        console.log(`  [werdykt ${Math.round((Date.now() - tVerdict) / 1000)}s] ${JSON.stringify(snap)}`);
      }
      await wait(2500);
      spins++;
    }
    await page.screenshot({ path: path.join(shots, '06-werdykt.png') });
    const EXPECT_VERDICTS = [EXPECT_LEFT + ' wygrywa', EXPECT_RIGHT + ' wygrywa'];
    const verdictLine = String(verdict || '').trim();
    assert('bitwa DOBIEGLA KONCA -- werdykt jest widoczny (brak = FAIL, nie ciche przejscie)',
      verdictLine.length > 0, { verdict, spins, deadlineMs: VERDICT_DEADLINE_MS });
    assert(`werdykt === "${EXPECT_VERDICTS[0]}" albo "${EXPECT_VERDICTS[1]}" DOKLADNIE (KRYTERIUM 2)`,
      EXPECT_VERDICTS.includes(verdictLine), { verdictLine, EXPECT_VERDICTS });
    assert('werdykt NIE brzmi "<typ jednostki> wygrywa" (bug ze zgloszenia wlasciciela)',
      verdictLine.length > 0
      && !new RegExp('(' + atkType + '|' + defType + ')\\s+wygrywa', 'i').test(verdictLine),
      { verdictLine, atkType, defType });

    // ── KROK 7 — PASEK NAGLOWKA W MAPOWYM PODSUMOWANIU (widok ze ZGLOSZENIA) ────
    // To jest DOKLADNIE ekran ze zrzutu wlasciciela: popup „Wynik bitwy" na mapie,
    // po „POWROCIE NA MAPE". Jest budowany INNA sciezka niz pasek w trakcie bitwy
    // (main.ts `applyMapBattleOutcomeWithSummary` zamiast
    // `battleScene._buildBattleSummaryData`), wiec MUSI byc asertowany osobno --
    // pierwszy bieg tej wersji pokazal zywo, ze mial tu jeszcze „Hastati wygrywa"
    // i generyczny medalion, mimo poprawnego paska w trakcie walki.
    const mapCorner = await readCorners();
    console.log('  rogi MAPOWEGO podsumowania: ' + JSON.stringify(mapCorner.corners));
    const mLeft = mapCorner.corners.filter(c => c.cx < W / 2);
    const mRight = mapCorner.corners.filter(c => c.cx >= W / 2);
    assert('mapowe podsumowanie renderuje OBA rogi', mLeft.length === 1 && mRight.length === 1,
      { mLeft, mRight });
    assert(`mapowe podsumowanie: bold LEWA === "${EXPECT_LEFT}" (KRYTERIUM 1 na widoku ze zgloszenia)`,
      mLeft.length === 1 && mLeft[0].text === EXPECT_LEFT, mLeft.map(c => c.text));
    assert(`mapowe podsumowanie: bold PRAWA === "${EXPECT_RIGHT}" (KRYTERIUM 1 na widoku ze zgloszenia)`,
      mRight.length === 1 && mRight[0].text === EXPECT_RIGHT, mRight.map(c => c.text));
    assert('mapowe podsumowanie: zaden bold nie jest nazwa typu jednostki',
      mapCorner.corners.length > 0 && !mapCorner.corners.some(c => unitNames.test(c.text)),
      mapCorner.corners.map(c => c.text));
    assert('mapowe podsumowanie: medalion LEWY to portret wladcy <img>, NIE generyczny PB_SVG.commander (KRYTERIUM 3)',
      mLeft.length === 1 && mLeft[0].medal === 'img', mLeft.map(c => c.medalSig));
    assert('mapowe podsumowanie: medalion PRAWY to portret wladcy <img>, NIE generyczny PB_SVG.commander (KRYTERIUM 3)',
      mRight.length === 1 && mRight[0].medal === 'img', mRight.map(c => c.medalSig));

    fs.writeFileSync(path.join(shots, 'dom.txt'), await page.evaluate(() => document.body.innerText || ''), 'utf8');
    console.log('  Zrzuty + DOM: ' + shots);
    console.log('  Bledy konsoli: ' + errors.length);
    return { pass, fail, shots };
  } finally {
    await browser.close();
  }
}

(async () => {
  try {
    if (MUTACJA) {
      console.log('[live-atak] MUTACJA ' + MUTACJA + ': '
        + (MUTACJA === '3' ? 'mapowe podsumowanie bierze bold/werdykt z nazwy jednostki (zarzut 3)'
          : MUTACJA === '2' ? 'civLabelForOwner(0) zwraca SUROWE id (zarzut 2)'
            : 'odwracam priorytet w _sideDisplayLabel (zarzut GOAL 1)'));
      applyMutation();
    }
    buildBundle();
  } finally { if (MUTACJA) restoreSource(); }
  // RUNDA 3 (zarzut Evaluatora 2 + 5a): DWA sandboxy, bo prowadza przez DWIE ROZNE
  // sciezki liczenia civLabel i tylko razem pokrywaja oba realne zrodla bold-etykiety:
  //  · ?playtest=walka  -> jednostka vs jednostka -> openPlayerMapUnitAttackCore
  //                        (civLabel z `ownerDiploLabel` wprost, main.ts:~23559/23566)
  //  · ?playtest=mapa   -> jednostka vs MIASTO (Ateny) -> dialog "ATAK NA MIASTO" ->
  //                        mapFieldBattle.ts:332/343 -> `civLabelForOwner` — to jest
  //                        DOKLADNIE ta sciezka, na ktorej Evaluator zobaczyl zywo bold
  //                        "rzymianie" (surowe id) obok "Grecy". Mutacja 2 musi ja
  //                        zaczerwienic; bieg tylko na ?playtest=walka jej NIE lapal.
  const modes = ['walka', 'mapa'];
  let total = { pass: 0, fail: 0 };
  for (const m of modes) {
    pass = 0; fail = 0;
    const r = await run(m);
    total.pass += r.pass; total.fail += r.fail;
    console.log(`  [${m}] ${r.pass} pass / ${r.fail} fail`);
  }
  const res = total;

  if (MUTACJA) {
    if (res.fail > 0) { console.log(`\nMUTACJA ${MUTACJA}: bramka poprawnie CZERWONA (${res.fail} fail) — test nietautologiczny.`); process.exit(0); }
    console.error(`\nMUTACJA ${MUTACJA}: bramka ZOSTALA ZIELONA mimo cofnietej naprawy — TEST TAUTOLOGICZNY.`); process.exit(1);
  }
  if (res.fail > 0) { console.error(`\nR-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1 (live-atak): FAIL (${res.fail})`); process.exit(1); }
  console.log(`\nR-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1 (live-atak): PASS (${res.pass} asercji)`);
})().catch(e => { restoreSource(); console.error(e); process.exit(1); });
