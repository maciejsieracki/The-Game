'use strict';
/**
 * empire-recruit-all-live-test.cjs — R-WEB-UI-EMPIRE-RECRUIT-ALL-LIVE-VERIFY-Q1 (dług #187).
 * ŻYWA gra (vite build -> serwer HTTP -> Chromium, ?playtest=mapa&civTest=1): panel imperium "Rekrutacja" ->
 * licznik z UI (+) -> "Rekrutuj wszystkie" z wybranym "Generałem rekrutującym": zamówienie -> kolejki miast
 * (rozkład równomierny) -> zrodzenie w REALNYM endTurn -> jednostki do WYBRANEGO generała; koszty złota, limit złota
 * (częściowy sukces), brak manpower, zapis/wczytanie, licznik domyślny 0.
 * Run z gra/: PLAYWRIGHT_CHROMIUM_EXECUTABLE=... node tools/empire-recruit-all-live-test.cjs [--shot] [--mutant=default1|rally]
 * --mutant: tymczasowo psuje kod gry (git checkout przywraca) — test MUSI wtedy zaświecić się na czerwono.
 */
const fs = require('fs'), path = require('path'), http = require('http'), { execSync } = require('child_process');
const GRA = path.resolve(__dirname, '..');
const SHOT_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-EMPIRE-RECRUIT-ALL-LIVE-VERIFY-Q1', 'evidence');
const mutArg = (process.argv.find(a => a.startsWith('--mutant=')) || '').slice(9);
const SHOT = process.argv.includes('--shot');
let pass = 0, fail = 0;
const ok = (c, n, d) => { if (c) { pass++; console.log('PASS: ' + n); } else { fail++; console.log('FAIL: ' + n + (d !== undefined ? ' — ' + (typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 500) : '')); } };
const MUTANTS = {
  default1: ['src/ui/empireRecruitPanel.ts', 'const DEFAULT_QTY = 0;', 'const DEFAULT_QTY = 1;'],
  rally: ['src/main.ts', "{ origin: 'army', rallyGeneralId: rallyId }", "{ origin: 'army' }"],
};
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };

(async () => {
  const outDir = '/dev/shm/erall-' + process.pid;
  let mut = null;
  if (mutArg) {
    mut = MUTANTS[mutArg];
    if (!mut) { console.log('nieznany mutant ' + mutArg); process.exit(2); }
    const f = path.join(GRA, mut[0]);
    const src = fs.readFileSync(f, 'utf8');
    if (!src.includes(mut[1])) { console.log('mutant: brak wzorca w ' + mut[0]); process.exit(2); }
    fs.writeFileSync(f, src.replace(mut[1], mut[2]));
    console.log('MUTANT ' + mutArg + ' zastosowany w ' + mut[0]);
  }
  try { execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 520000 }); }
  catch (e) { ok(false, 'L0 build bundla', String(e.message).slice(0, 300)); process.exit(1); }
  finally { if (mut) { execSync('git checkout -- ' + mut[0], { cwd: GRA }); console.log('MUTANT cofnięty (git checkout ' + mut[0] + ')'); } }
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(outDir, p === '/' ? 'index.html' : p);
    if (!f.startsWith(outDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(base + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__empireRecruitTestDebug, null, { timeout: 180000 });
    await page.waitForTimeout(2000);
    const D = (fn, ...a) => page.evaluate(([f, a]) => window.__empireRecruitTestDebug[f](...a), [fn, a]);
    const turn = () => page.evaluate(() => window.__eraTestDebug.endTurn());
    const queues = async (ids) => Promise.all(ids.map(c => D('queue', c)));
    const dropVictory = () => page.evaluate(() => { const v = document.getElementById('__victory_screen__'); if (v) v.remove(); });
    const panel = '#civ-empire-recruit-panel';
    const qty = async (id) => Number(await page.locator(`${panel} [data-unit="${id}"] [data-erp="qty"]`).inputValue());
    const inc = async (id, n) => { for (let i = 0; i < n; i++) await page.locator(`${panel} [data-unit="${id}"] [data-erp="inc"]`).click(); };

    let ids = await D('playerCityIds');
    if (ids.length < 3) await D('cloneCityForTest', ids[0], 3 - ids.length);
    ids = await D('playerCityIds');
    ok(ids.length === 3, 'L1 3 miasta gracza', ids);
    await D('clearQueues');
    await D('setResources', 1000000, 1000000);

    // Dwóch generałów; wybrany = dalszy od miasta.
    await D('ensureAndSelectGeneral', 0);
    await D('ensureAndSelectGeneral', 1);
    const cp = await D('cityPos', ids[0]);
    const gens = (await D('generalInfo')).map(g => ({ ...g, d: Math.abs(g.q - cp.q) + Math.abs(g.r - cp.r) })).sort((a, b) => a.d - b.d);
    ok(gens.length >= 2, 'L2 co najmniej 2 generałów', gens);
    const chosen = gens[gens.length - 1];
    await D('selectGeneral', null);

    const rows = await D('rows');
    const full = rows.filter(r => r.capableCities === 3);
    const A = full.find(r => r.id === 'Wojownik') || full[0];
    const B = full.find(r => r.id !== A.id && r.id === 'Taran') || full.find(r => r.id !== A.id);
    ok(!!A && !!B, 'L3 dwa typy dostępne we wszystkich 3 miastach', rows.map(r => [r.id, r.capableCities, r.manpowerCost]));

    // --- Panel: licznik domyślny 0, "Rekrutuj wszystkie" nieaktywny ---
    await dropVictory();
    await page.locator('[data-act="empire-recruit"]').click();
    await page.waitForSelector(`${panel} [data-unit]`, { timeout: 10000 });
    const allQty0 = await page.locator(`${panel} [data-erp="qty"]`).evaluateAll(els => els.map(e => e.value));
    ok(allQty0.length > 0 && allQty0.every(v => v === '0'), 'L4 wszystkie liczniki domyślnie 0 w żywej grze', allQty0);
    const goAll = page.locator(`${panel} [data-erp="go-all"]`);
    ok(await goAll.count() === 1 && await goAll.isDisabled(), 'L5 "Rekrutuj wszystkie" nieaktywny przy samych zerach');
    ok(await page.locator(`${panel} [data-erp="gen"]`).count() >= 2, 'L6 panel pokazuje listę generałów (>= 2)');
    await inc(A.id, 5); await inc(B.id, 4);
    ok(await goAll.isDisabled(), 'L7 bez wybranego generała "Rekrutuj wszystkie" nadal nieaktywny mimo liczników');
    await page.locator(`${panel} [data-erp="gen"][data-gen="${chosen.id}"]`).click();
    ok((await D('selectedGeneral')) === chosen.id, 'L8 klik w generała ustawia wybór w grze', await D('selectedGeneral'));
    ok(!(await goAll.isDisabled()), 'L9 po wyborze generała "Rekrutuj wszystkie" aktywny');
    if (SHOT) await page.screenshot({ path: path.join(SHOT_DIR, '01-panel-przed-rekrutuj-wszystkie.png') });

    // --- "Rekrutuj wszystkie" ---
    const g0 = await D('gold');
    await goAll.click();
    const g1 = await D('gold');
    const qs = await queues(ids);
    const cntA = qs.map(q => q.filter(x => x === A.id).length), cntB = qs.map(q => q.filter(x => x === B.id).length);
    ok([...cntA].sort().join() === '1,2,2', `L10 5 x ${A.id} rozłożone równomiernie 2/2/1`, cntA);
    ok([...cntB].sort().join() === '1,1,2', `L11 4 x ${B.id} rozłożone równomiernie 2/1/1`, cntB);
    ok(g0 - g1 === 5 * A.koszt + 4 * B.koszt, `L12 złoto pobrane: 5x${A.koszt} + 4x${B.koszt}`, { g0, g1 });
    ok(await qty(A.id) === 0 && await qty(B.id) === 0, 'L13 liczniki przyjętych typów wróciły do 0');
    const intents = (await Promise.all(ids.map(c => D('queueIntents', c)))).flat();
    ok(intents.length === 9 && intents.every(i => i.rallyGeneralId === chosen.id && i.followGeneral === true), 'L14 wszystkie 9 wpisów kolejek niesie id WYBRANEGO generała', intents);
    if (SHOT) await page.screenshot({ path: path.join(SHOT_DIR, '02-panel-po-rekrutuj-wszystkie.png') });

    // --- Zapis / wczytanie z zamówieniem w kolejkach ---
    ok((await D('quickSave', 'erall-live-slot')) === true, 'L15 zapis gry udany');
    const qsSaved = JSON.stringify(await queues(ids));
    await D('clearQueues'); await D('selectGeneral', null);
    ok((await queues(ids)).flat().length === 0, 'L16 po wyczyszczeniu kolejki puste (stan przed wczytaniem)');
    await page.evaluate(() => window.__empireRecruitTestDebug.loadSlot('erall-live-slot'));
    await page.waitForTimeout(1500);
    ids = await D('playerCityIds');
    ok(JSON.stringify(await queues(ids)) === qsSaved, 'L17 po wczytaniu kolejki identyczne jak w zapisie');
    ok((await D('selectedGeneral')) === chosen.id, 'L18 po wczytaniu wybrany generał przywrócony', await D('selectedGeneral'));
    const intentsL = (await Promise.all(ids.map(c => D('queueIntents', c)))).flat();
    ok(intentsL.length === 9 && intentsL.every(i => i.rallyGeneralId === chosen.id), 'L19 po wczytaniu wpisy nadal niosą wybranego generała', intentsL);

    // --- Zrodzenie w REALNYM endTurn ---
    // Uwaga (pomiar): na mapie ?playtest=mapa Rzymianie wygrywają dominacją po 1. turze świata (gameOver, "Gra zakonczona"),
    // więc dalsze endTurn są niemożliwe. Tempo rekrutacji to 1 jednostka/miasto/turę (RECRUIT_UNITS_PER_TURN) —
    // w jednej turze powstaje więc pierwsza fala 3 sztuk (po 1 z każdego miasta), a reszta zostaje w kolejkach.
    const qBefore = (await queues(ids)).map(q => q.length);
    await turn();
    let spawned = [];
    for (let i = 0; i < 40 && spawned.length < 3; i++) { await page.waitForTimeout(300); spawned = await D('rallyUnits'); }
    await dropVictory();
    ok(spawned.length === 3, 'L20 pierwsza fala: 3 jednostki (po 1 z każdego z 3 miast) zrodziły się w realnym endTurn', spawned.length);
    ok(spawned.every(u => u.rally === chosen.id), 'L21 każda zrodzona jednostka niesie rallyGeneralId wybranego generała', spawned.map(u => u.rally));
    const qAfter = (await queues(ids)).map(q => q.length);
    // Planowanie marszu jest odroczone do końca animacji tury — czekamy (jak w army-auto-recruit-general-live-test).
    for (let i = 0; i < 40 && !(spawned.length && spawned.every(u => u.march)); i++) { await page.waitForTimeout(500); spawned = await D('rallyUnits'); }
    const marching = spawned.filter(u => u.march);
    ok(marching.length === spawned.length && marching.every(u => u.march.generalTargetId === chosen.id), 'L22 marsz zaplanowany do WYBRANEGO generała, nie najbliższego', { n: marching.length, of: spawned.length, chosen: chosen.id, gens });
    ok(qAfter.every((n, i) => n === qBefore[i] - 1), 'L23 z kolejki każdego miasta zeszła dokładnie 1 sztuka (równomiernie)', { qBefore, qAfter });
    // Atak wrogiej AI z mapy playtestowej może zostawić ekran bitwy — zamykamy go (AUTO -> KONTYNUUJ), by nie zasłaniał panelu.
    for (let i = 0; i < 6; i++) {
      const auto = page.locator('.pb-overlay button', { hasText: /^\s*auto\s*$/i });
      const cont = page.locator('button', { hasText: /^\s*kontynuuj\s*$/i });
      if (await auto.count()) { await dropVictory(); await auto.first().click({ timeout: 10000 }); await page.waitForTimeout(1500); }
      else if (await cont.count()) { await dropVictory(); await cont.first().click({ timeout: 10000 }); await page.waitForTimeout(800); }
      else break;
    }
    if (SHOT) await page.screenshot({ path: path.join(SHOT_DIR, '03-po-turze-zrodzone.png') });

    // Po turze świata (era/zapis) lista typów się zmieniła — bierzemy najtańszy dostępny typ z żywego panelu.
    // --- Limit złota: częściowy sukces, reszta zostaje w liczniku ---
    await D('clearQueues');
    const rows2 = (await D('rows')).filter(r => r.capableCities >= 1 && r.koszt > 0).sort((x, y) => x.koszt - y.koszt);
    const A2 = rows2[0];
    ok(!!A2, 'L24a po turze panel nadal ma typ dostępny do zamówienia', rows2.map(r => r.id));
    await D('setResources', 3 * A2.koszt, 1000000);
    await dropVictory();
    if (await page.locator(`${panel} [data-unit]`).count() === 0) {
      if (await page.locator(panel).count() > 0) await page.evaluate(() => window.__empireRecruitTestDebug.toggleViaHud()); // zamknij nieświeży panel
      await page.locator('[data-act="empire-recruit"]').click(); await page.waitForSelector(`${panel} [data-unit]`);
    }
    await D('selectGeneral', chosen.id);
    await inc(A2.id, 5);
    await page.locator(`${panel} [data-erp="go-all"]`).click();
    const totA = (await queues(ids)).flat().filter(x => x === A2.id).length;
    ok(totA === 3 && await qty(A2.id) === 2 && (await D('gold')) === 0, 'L24 złoto na 3 z 5: przyjęto 3, licznik = 2, złoto 0', { totA, qty: await qty(A2.id), gold: await D('gold') });
    if (SHOT) await page.screenshot({ path: path.join(SHOT_DIR, '04-limit-zlota-czesciowy.png') });

    // --- Brak złota: nic nie przyjęte, licznik zostaje ---
    const before = (await queues(ids)).flat().length;
    const goAll2 = page.locator(`${panel} [data-erp="go-all"]`);
    const disabledAt0 = await goAll2.isDisabled();
    if (!disabledAt0) await goAll2.click();
    ok((await queues(ids)).flat().length === before && await qty(A2.id) === 2, 'L25 przy 0 złota nic nie przyjęte, licznik zostaje 2', { disabledAt0 });

    // --- Brak manpower (jeśli typ go wymaga) ---
    if ((A2.manpowerCost || 0) > 0) {
      await D('clearQueues');
      await D('setResources', 1000000, 0);
      await page.waitForTimeout(500);
      if (!(await goAll2.isDisabled())) await goAll2.click();
      ok((await queues(ids)).flat().length === 0, 'L26 brak rekrutów (manpower 0): zamówienie nie wchodzi do kolejek');
    } else console.log('INFO: L26 pominięty — typ ' + A2.id + ' nie ma kosztu manpower');

    // --- Śmierć wybranego generała: panel znów nie rekrutuje ---
    await D('setResources', 1000000, 1000000);
    await D('clearQueues');
    await D('killGeneral', chosen.id);
    const afterKill = await D('order', A2.id, 1);
    ok(afterKill.changed === false && /generała/.test(afterKill.message) && (await queues(ids)).flat().length === 0, 'L27 po śmierci generała zamówienie odrzucone', afterKill);
    ok(errs.length === 0, 'L28 zero pageerror', errs.join('|'));
  } finally { await browser.close(); server.close(); fs.rmSync(outDir, { recursive: true, force: true }); }
  console.log(`\nempire-recruit-all-live-test${mutArg ? ' [MUTANT ' + mutArg + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
