'use strict';
/**
 * city-upgrade-all-button-test.cjs — R-WEB-UI-CITY-UPGRADE-ALL-BUTTON-Q1
 *
 * Przycisk „Ulepsz wszystko” w nagłówku sekcji „Ulepsz” panelu miasta (renderBuildList).
 * Test działa na PRAWDZIWYM src/ui/cityPanel.ts (bundel esbuild + jsdom), bez mocków
 * logiki: wszystkie oczekiwania wynikają z tego, co renderer sam pokazuje (stan przycisków
 * „Ulepsz” wierszy) i z referencyjnej serii pojedynczych kliknięć „Ulepsz”.
 *
 * Przypadki:
 *  A. N aktywnych ulepszeń -> „Ulepsz wszystko” dodaje dokładnie te N (kolejność listy),
 *     złoto bez zmian, Kup NIE wywołane, skutek (kolejka + magazyn) = seria pojedynczych „Ulepsz”.
 *  B. Wiersze z nieaktywnym „Ulepsz” są pomijane (fikstura musi mieć ≥1 taki wiersz).
 *  C. 0 aktywnych -> przycisk nieaktywny, klik nic nie dodaje.
 *  D. Ponowny klik (także ze starej, nieodświeżonej referencji przycisku) nie dubluje kolejki.
 *  E. Komunikat „Dodano do kolejki: N …” z poprawną polską odmianą.
 *
 * Mutacja: wariant kopii src/ bez wywołania enqueueActiveUpgradeRows (klik robi n = 0).
 * Test MUSI czerwienić na wariancie zmutowanym (dowód nietautologiczności).
 *
 * Uruchomienie: cd gra && node tools/city-upgrade-all-button-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require(path.resolve(__dirname, '..', 'node_modules', 'jsdom'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const CALL = 'const n = enqueueActiveUpgradeRows(city, activeUpgrades);';

// --- DOM (jsdom) — globalne przed załadowaniem bundla (cityPanel używa document/window) ---
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis;
g.window = dom.window;
g.document = dom.window.document;
for (const k of ['HTMLElement', 'HTMLButtonElement', 'HTMLInputElement', 'Node', 'Element', 'MouseEvent', 'Event', 'getComputedStyle']) {
  if (dom.window[k] !== undefined) g[k] = dom.window[k];
}
g.localStorage = dom.window.localStorage;

function buildBundle(outName, mutate) {
  let srcDir = SRC;
  if (mutate) {
    const tmpSrc = path.resolve(GRA_ROOT, `.${outName}-src`);
    fs.rmSync(tmpSrc, { recursive: true, force: true });
    fs.cpSync(SRC, tmpSrc, { recursive: true });
    const target = path.resolve(tmpSrc, 'ui/cityPanel.ts');
    const orig = fs.readFileSync(target, 'utf8');
    if (!orig.includes(CALL)) {
      console.error('BŁĄD HARNESSU: nie znaleziono wywołania enqueueActiveUpgradeRows w cityPanel.ts');
      process.exit(2);
    }
    fs.writeFileSync(target, orig.replace(CALL, 'const n = 0;'), 'utf8');
    srcDir = tmpSrc;
  }
  const entryFile = path.resolve(__dirname, `.${outName}-entry.ts`);
  const bundleFile = path.resolve(__dirname, `.${outName}-bundle.cjs`);
  fs.writeFileSync(entryFile, `
export { configureCityPanel, renderBuildList } from ${JSON.stringify(srcDir + '/ui/cityPanel')};
export { buildingTypeQueued } from ${JSON.stringify(srcDir + '/game/production')};
`, 'utf8');
  esbuild.buildSync({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundleFile,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
    define: { 'import.meta.glob': '__viteGlob', 'import.meta.env': '{}' },
    banner: { js: 'var __viteGlob = function () { return {}; };' },
    loader: { '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl', '.mp3': 'empty', '.ogg': 'empty', '.wav': 'empty', '.css': 'empty' },
  });
  if (mutate) fs.rmSync(path.resolve(GRA_ROOT, `.${outName}-src`), { recursive: true, force: true });
  return require(bundleFile);
}

const DATA = {
  buildings: JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data/buildings.json'), 'utf8')),
  units: [],
  tech: JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data/tech.json'), 'utf8')).technologie,
};
const TECHS = DATA.tech.map((t) => t.Technologia).filter(Boolean);
const BUILT = ['studnia', 'kamienne_kregi', 'stolarnia', 'targowisko', 'garncarnia', 'kamieniarski'];

/** Środowisko renderu: świeży stan produkcji, skarbiec, magazyn i spy na Kup. */
function makeEnv(M, { surowce, skarb = 500, built = BUILT }) {
  const city = { id: 'c1', name: 'Test', ownerId: 0, population: 5, q: 0, r: 0, surowce: { ...surowce } };
  const state = { prod: { kolejka: [], postep: 0 }, skarb, kupCalls: 0 };
  M.configureCityPanel({
    getCities: () => [city],
    getProduction: () => state.prod,
    setProduction: (_id, p) => { state.prod = p; },
    onChange: () => {},
    getTreasury: () => state.skarb,
    getUnlockedTechs: () => TECHS,
    getEpoch: () => 2,
    getBuiltBuildingIds: () => built,
    getBuildingCostPace: () => 'niski',
    getDifficulty: () => 'normal',
    isMe: (ownerId) => ownerId === 0,
    onPurchaseBuilding: () => { state.kupCalls++; },
    getGold: () => state.skarb,
  });
  const mount = document.createElement('div');
  document.body.appendChild(mount);
  const render = () => {
    mount.innerHTML = '';
    M.renderBuildList(mount, city, DATA, { praca: 999 });
  };
  return {
    city, state, mount, render,
    stock: () => ({ ...city.surowce }),
    queue: () => state.prod.kolejka.map((it) => it.id),
    dispose: () => { M.configureCityPanel({ getProduction: undefined }); mount.remove(); },
  };
}

/** Wiersze sekcji „Ulepsz”: nazwa wiersza + przycisk „Ulepsz” (wyłączony/włączony). */
function upgradeRows(mount) {
  const rows = [];
  for (const row of mount.querySelectorAll('.bld-compact-row')) {
    const btn = [...row.querySelectorAll('button')].find((b) => b.textContent === 'Ulepsz');
    if (!btn) continue;
    rows.push({ name: row.querySelector('.bld-compact-name')?.textContent ?? '', btn, enabled: !btn.disabled });
  }
  return rows;
}

function bulkButton(mount) {
  return [...mount.querySelectorAll('button')].find((b) => b.textContent === 'Ulepsz wszystko') ?? null;
}

function message(mount) {
  const m = [...mount.querySelectorAll('[role="status"]')].map((x) => x.textContent);
  return m.find((t) => t.startsWith('Dodano do kolejki') || t.startsWith('Brak ulepszeń')) ?? null;
}

/** Referencja: seria POJEDYNCZYCH kliknięć „Ulepsz” aktywnych wierszy, w kolejności listy. */
function referenceSingleClicks(M, opts) {
  const env = makeEnv(M, opts);
  env.render();
  const names = upgradeRows(env.mount).filter((r) => r.enabled).map((r) => r.name);
  for (const name of names) {
    env.render();
    const row = upgradeRows(env.mount).find((r) => r.name === name && r.enabled);
    if (row) row.btn.click();
  }
  const out = { queue: env.queue(), stock: env.stock(), gold: env.state.skarb, kup: env.state.kupCalls, names };
  env.dispose();
  return out;
}

function polishPlural(n) {
  const m10 = n % 10, m100 = n % 100;
  if (n === 1) return 'ulepszenie';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'ulepszenia';
  return 'ulepszeń';
}

function runAll(M, label) {
  let pass = 0, fail = 0;
  const ok = (c, msg) => { if (c) { pass++; console.log(`  PASS: ${msg}`); } else { fail++; console.error(`  FAIL: ${msg}`); } };
  console.log(`\n== ${label} ==`);

  const RICH = { drewno: 9999, kamien: 9999, glina: 9999, zloto: 9999, zywnosc: 9999, zelazo: 9999, woda: 9999 };
  const POOR = { drewno: 9999 };

  // --- A: wszystkie aktywne -> bulk === seria pojedynczych ---
  {
    const ref = referenceSingleClicks(M, { surowce: RICH });
    const env = makeEnv(M, { surowce: RICH });
    env.render();
    const before = upgradeRows(env.mount);
    const activeBefore = before.filter((r) => r.enabled).map((r) => r.name);
    const bAll = bulkButton(env.mount);
    ok(bAll !== null, 'A: przycisk „Ulepsz wszystko” jest w sekcji „Ulepsz”');
    ok(bAll && !bAll.disabled, 'A: przycisk aktywny przy N>0 aktywnych');
    ok(activeBefore.length >= 3, `A: fikstura ma ≥3 aktywne ulepszenia (jest ${activeBefore.length})`);
    const skarbBefore = env.state.skarb;
    const stockBefore = env.stock();
    bAll.click();
    const addedBulk = env.queue();
    ok(addedBulk.length === ref.queue.length, `A: kolejka po „Ulepsz wszystko” ma ${ref.queue.length} pozycji (jest ${addedBulk.length})`);
    ok(JSON.stringify(addedBulk) === JSON.stringify(ref.queue), 'A: kolejność i zawartość kolejki = seria pojedynczych „Ulepsz”');
    ok(JSON.stringify(env.stock()) === JSON.stringify(ref.stock), 'A: magazyn po zbiorczym = magazyn po serii pojedynczych');
    ok(stockBefore && env.stock().drewno !== undefined, 'A: magazyn czytelny (sanity)');
    ok(env.state.skarb === skarbBefore && skarbBefore === ref.gold, 'A: złoto bez zmian (brak zakupu)');
    ok(env.state.kupCalls === 0 && ref.kup === 0, 'A: Kup (onPurchaseBuilding) NIE wywołane');
    ok(JSON.stringify(activeBefore) === JSON.stringify(ref.names), 'A: zbiór aktywnych wierszy = referencja');
    env.render();
    const msg = message(env.mount);
    ok(msg !== null, 'E: po kliknięciu pojawia się komunikat (status)');
    const expectedMsg = `Dodano do kolejki: ${ref.names.length} ${polishPlural(ref.names.length)}`;
    ok(msg === expectedMsg, `E: komunikat „${expectedMsg}” (jest „${msg}”)`);

    // --- D: ponowny klik nie dubluje (nowy i stary uchwyt) ---
    const stale = bulkButton(env.mount);
    const qBefore = env.queue().length;
    env.render();
    const again = bulkButton(env.mount);
    ok(!again || again.disabled, 'D: po zakolejkowaniu wszystkich przycisk nieaktywny (lub brak)');
    if (again) again.click();
    if (stale) stale.click();
    ok(env.queue().length === qBefore, 'D: ponowny klik (nowy i stary uchwyt) nie dubluje kolejki');
    env.dispose();
  }

  // --- B: wiersze z nieaktywnym „Ulepsz” pomijane ---
  {
    const ref = referenceSingleClicks(M, { surowce: POOR });
    const env = makeEnv(M, { surowce: POOR });
    env.render();
    const rows = upgradeRows(env.mount);
    const inactive = rows.filter((r) => !r.enabled).map((r) => r.name);
    ok(inactive.length >= 1, `B: fikstura ma ≥1 wiersz z nieaktywnym „Ulepsz” (jest ${inactive.length})`);
    const bAll = bulkButton(env.mount);
    ok(bAll && !bAll.disabled, 'B: przycisk aktywny (są aktywne wiersze)');
    bAll && bAll.click();
    const names = env.queue();
    ok(JSON.stringify(names) === JSON.stringify(ref.queue), 'B: dodane dokładnie aktywne (kolejność = referencja)');
    ok(ref.names.every((n) => !inactive.includes(n)), 'B: żaden nieaktywny wiersz nie trafił do kolejki (sanity referencji)');
    env.dispose();
  }

  // --- C: 0 aktywnych -> przycisk nieaktywny, klik nic nie robi ---
  {
    const env = makeEnv(M, { surowce: {} });
    env.render();
    const rows = upgradeRows(env.mount);
    const anyActive = rows.some((r) => r.enabled);
    ok(!anyActive, 'C: fikstura bez zasobów — żadne „Ulepsz” nieaktywne');
    const bAll = bulkButton(env.mount);
    ok(bAll !== null, 'C: przycisk widoczny nawet przy 0 aktywnych (lista ma wiersze)');
    ok(bAll && bAll.disabled, 'C: przycisk nieaktywny przy 0 aktywnych');
    bAll && bAll.click();
    ok(env.queue().length === 0, 'C: klik nieaktywnego przycisku nic nie dodaje');
    env.dispose();
  }

  // --- F: pozycja już w kolejce NIE liczy się jako aktywna (wiersz pojedynczy też nic nie robi) ---
  {
    const env = makeEnv(M, { surowce: RICH });
    env.render();
    const first = upgradeRows(env.mount).find((r) => r.enabled);
    const initialActive = upgradeRows(env.mount).filter((r) => r.enabled).length;
    first.btn.click();
    const queuedFirst = env.queue().length;
    env.render();
    const bAll = bulkButton(env.mount);
    ok(queuedFirst === 1, 'F: pojedynczy „Ulepsz” dodał 1 pozycję');
    ok(bAll !== null && !bAll.disabled && bAll.title.includes(`do ${initialActive - 1},`), 'F: tooltip liczy tylko niezakolejkowane');
    bAll && bAll.click();
    ok(env.queue().length === initialActive, 'F: zbiorczy dodaje tylko pozostałe (bez dubla w kolejce)');
    env.dispose();
  }

  console.log(`  -> ${label}: PASS ${pass} / FAIL ${fail}`);
  return fail;
}

const real = buildBundle('city-upgrade-all-button-test', false);
const realFail = runAll(real, 'WARIANT PRAWDZIWY (src/ui/cityPanel.ts)');

const mutated = buildBundle('city-upgrade-all-button-test-MUT', true);
const mutFail = runAll(mutated, 'WARIANT ZMUTOWANY (wywołanie enqueueActiveUpgradeRows usunięte w kopii)');

console.log(`\nPrawdziwy: ${realFail === 0 ? 'ZIELONY' : 'CZERWONY'} (fail=${realFail})`);
console.log(`Zmutowany: ${mutFail > 0 ? 'CZERWONY (oczekiwane — test wykrywa mutację)' : 'ZIELONY (BŁĄD — test nie wykrywa mutacji)'} (fail=${mutFail})`);
const okRun = realFail === 0 && mutFail > 0;
console.log(okRun ? 'CITY-UPGRADE-ALL-BUTTON OK' : 'CITY-UPGRADE-ALL-BUTTON FAIL');
process.exit(okRun ? 0 : 1);
