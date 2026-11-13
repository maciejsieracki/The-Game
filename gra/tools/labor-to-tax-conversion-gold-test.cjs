'use strict';
/**
 * R-WEB-LABOR-TO-TAX-CONVERSION-NO-GOLD-Q1 -- zamiana Pracy na podatek musi byc widoczna i zgodna ze stanem.
 * Przyczyna (zmierzona): (1) akcja nie ustawiala `empireEconDirty`, wiec HUD "+N/ture" nie doliczal
 * zakolejkowanego podatku (brak widocznego wplywu na Skarbiec), (2) komunikaty byly ciche/nie mowily,
 * ze do Skarbca idzie tylko udzial "Podatek" suwaka (po korupcji i Mennicy).
 * Run z gra/: node tools/labor-to-tax-conversion-gold-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const SRC = process.env.LABOR_TAX_SRC_DIR || path.join(ROOT, 'src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'labor-tax-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export { convertWorkPoolToTax, executeManualWorkTaxConversion } from ${JSON.stringify(SRC + '/game/work-tax')};`,
  `import * as W from ${JSON.stringify(SRC + '/game/work-tax')}; export const workTaxResultMessage = (W as any).workTaxResultMessage; export const runManualWorkTaxAction = (W as any).runManualWorkTaxAction;`,
  `export { loadEconParams, cityYieldPerTurn } from ${JSON.stringify(SRC + '/game/economy')};`,
  `export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};`,
].join('\n'));
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  absWorkingDir: ROOT, logLevel: 'silent', nodePaths: [path.join(ROOT, 'node_modules')] });
const { convertWorkPoolToTax, executeManualWorkTaxConversion, workTaxResultMessage, runManualWorkTaxAction, loadEconParams, cityYieldPerTurn, TerenBazowy, Nakladka } = require(bundle);

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('PASS: ' + m); } else { failed++; console.error('FAIL: ' + m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${a}, want ${b})`); }

// --- (A) sondy zrodlowe main.ts / panel -------------------------------------------------------
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const main = stripComments(fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8'));
const hookStart = main.indexOf('onConvertOwnerWorkToTax: (ownerId, requested) =>');
const hookEnd = main.indexOf('getOwnerDefaultPodzialPracy:', hookStart);
const hook = hookStart > 0 && hookEnd > hookStart ? main.slice(hookStart, hookEnd) : '';
ok(hook.length > 0, 'hook onConvertOwnerWorkToTax istnieje w main.ts');
ok(/runManualWorkTaxAction\(ownerId, requested, rate, enabled,/.test(hook), 'hook deleguje do runManualWorkTaxAction (testowanej behawioralnie w sekcji F)');
ok(/markDirty:\s*\(\)\s*=>\s*markCityStateDirty\(\)/.test(hook), 'io.markDirty = markCityStateDirty (ustawia empireEconDirty)');
ok(/refreshRates:\s*\(\)\s*=>\s*refreshLiveEmpireRates\(\)/.test(hook), 'io.refreshRates = refreshLiveEmpireRates');
ok(/readRates:[^\n]*_lastPieniadzRate[^\n]*_lastNaukaRate/.test(hook), 'io.readRates czyta _lastPieniadzRate/_lastNaukaRate');
ok(/showMessage:\s*\(msg\)\s*=>\s*showHintMessage\(msg/.test(hook), 'io.showMessage = showHintMessage');
ok(/previewOwnerWorkTaxEffect:/.test(main) && /finally\s*\{[\s\S]*pendingManualWorkTaxByOwner\.(set|delete)\(ownerId/.test(main), 'main udostepnia panelowi podglad wplywu z silnika i przywraca kolejke (finally)');
const panelRaw = fs.readFileSync(path.join(SRC, 'ui', 'empireDetailPanel.ts'), 'utf8');
const panel = stripComments(panelRaw);
ok(!/amount < 1 \|\| tax < 1 \|\| !window\.confirm/.test(panel), 'panel nie gubi cicho odmowy (0 Pracy / 0 Podatku)');
ok(/udział „Podatek” \(Zamożność dodatkowo go mnoży\)/.test(panelRaw), 'panel mowi, ze do Skarbca idzie udzial "Podatek" (Zamoznosc mnozy)');
ok(/na koniec tury: \+\$\{[^}]*eff\.skarb[^}]*\} do Skarbca/.test(panel) && /addEventListener\('change'[\s\S]*previewText\(work, true\)/.test(panel), 'panel: podglad "+X do Skarbca na koniec tury" (z silnika) przed akcja');

// --- (B) przeplyw konwersji: 20 000 Pracy ------------------------------------------------------
let pool = 25000; const queued = [];
const deps = { getWorkPool: () => pool, setWorkPool: (_o, v) => { pool = v; }, queueTax: (o, t) => queued.push([o, t]) };
const c20 = executeManualWorkTaxConversion(0, 20000, 1, true, deps);
eq(pool, 5000, 'Praca maleje o 20 000');
eq(c20.workSpent, 20000, 'workSpent = 20 000');
eq(queued.length === 1 && queued[0][1], 20000, 'zakolejkowano 20 000 Podatku (kurs 1:1 z danych)');
// bilans: Praca przed = Praca po + wydana
eq(25000, pool + c20.workSpent, 'bilans Pracy zgodny');

// --- (C) silnik: ile z 20 000 Podatku trafia do Skarbca (domyslny podzial 60/20/20, bez korupcji) ----
const econ = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/econ-params.json'), 'utf8'));
const params = loadEconParams(econ, 'normal');
const tiles = Array.from({ length: 10 }, () => ({ terenBazowy: TerenBazowy.Rownina, nakladka: Nakladka.Brak, maRzeke: false }));
const city = { id: 'c', ludnosc: 3, zdrowie: 0, czyStolica: true, maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
  specjalisci: [], kolejkaProdukcji: [],
  podziałHandlu: { procentNauka: 20, procentPieniadz: 60, procentLuksus: 20 }, podziałPracy: { procentBudynki: 0 } };
const yf = (tax, strata = 0) => cityYieldPerTurn(city, tiles, [], params, {
  wojskoZuzycieZywnosci: 0, strataFraction: strata, maMlyn: false, maCegielnia: false, maTargowisko: true,
  maBiblioteka: false, maAkademia: false, maMennica: false, walutaOdkryta: false, additionalTax: tax });
const base = yf(0), withTax = yf(20000);
eq(withTax.pieniadz - base.pieniadz, 12000, '20 000 Podatku -> +12 000 Skarbca (udzial 60%)');
eq(withTax.nauka - base.nauka, 4000, '... +4 000 Nauki (udzial 20%)');
eq(withTax.luksus - base.luksus, 4000, '... +4 000 Zamoznosci/Luksusu (udzial 20%)');
const wc = yf(20000, 0.2);
{
  // (base tez podlega korupcji + floor/float, stad tolerancja 2 zamiast rownosci)
  const d = wc.pieniadz - yf(0, 0.2).pieniadz;
  ok(Math.abs(d - 9600) <= 2, `z korupcja 20%: ~+9 600 Skarbca (got ${d})`);
}

// --- (D) komunikat zgodny ze stanem -------------------------------------------------------------
ok(typeof workTaxResultMessage === 'function', 'workTaxResultMessage wyeksportowana');
if (typeof workTaxResultMessage === 'function') {
  const m = workTaxResultMessage(c20, 20000, true, 25000, 12000, 4000);
  ok(m.includes('20000 Pracy') && m.includes('20000 Podatku') && m.includes('+12000 do Skarbca') && m.includes('+4000 do Nauki'), 'komunikat sukcesu: Praca, Podatek, Skarbiec, Nauka');
  const none = (req, en, poolB, rate) => workTaxResultMessage(convertWorkPoolToTax(poolB, req, rate, en), req, en, poolB, 0, 0);
  ok(/Targowiska/.test(none(10, false, 100, 1)), 'bez Targowiska: komunikat z powodem');
  ok(/większą od 0/.test(none(0, true, 100, 1)), 'ilosc 0: komunikat z powodem');
  ok(/większą od 0/.test(none(-5, true, 100, 1)), 'ilosc ujemna: komunikat z powodem');
  ok(/większą od 0/.test(none(NaN, true, 100, 1)), 'ilosc NaN: komunikat z powodem');
  ok(/Brak Pracy/.test(none(10, true, 0, 1)), 'pusta pula: komunikat z powodem');
  ok(/0 Podatku/.test(none(1, true, 100, 0.5)), 'kurs daje 0 Podatku: komunikat z powodem');
}

// --- (E) wartosci graniczne: Praca nie jest odejmowana bez efektu ------------------------------
function run(req, rate, en, poolStart) {
  let p = poolStart; let q = 0;
  const r = executeManualWorkTaxConversion(0, req, rate, en, { getWorkPool: () => p, setWorkPool: (_o, v) => { p = v; }, queueTax: (_o, t) => { q += t; } });
  return { p, q, r };
}
let r = run(20000, 1, true, 20000);
eq(r.p, 0, 'cala pula: Praca = 0'); eq(r.q, 20000, 'cala pula: 20 000 Podatku');
r = run(30000, 1, true, 20000); eq(r.p, 0, 'zadanie ponad pule: obciete do puli'); eq(r.q, 20000, 'zadanie ponad pule: Podatek = pula');
r = run(0, 1, true, 100); eq(r.p, 100, '0: pula nietknieta'); eq(r.q, 0, '0: brak podatku');
r = run(-7, 1, true, 100); eq(r.p, 100, 'ujemna: pula nietknieta'); eq(r.q, 0, 'ujemna: brak podatku');
r = run(NaN, 1, true, 100); eq(r.p, 100, 'NaN: pula nietknieta'); eq(r.q, 0, 'NaN: brak podatku');
r = run(1, 0.5, true, 100); eq(r.p, 100, 'kurs 0.5, 1 Praca: nie marnuje Pracy'); eq(r.q, 0, 'kurs 0.5, 1 Praca: brak podatku');
r = run(5, 1, true, 100); eq(r.p, 95, 'mala kwota: Praca -5'); eq(r.q, 5, 'mala kwota: +5 Podatku');


// --- (F) BEHAWIORALNIE: prawdziwa runManualWorkTaxAction + model HUD z bramka `empireEconDirty` -----
// Model odtwarza main.ts: refreshLiveEmpireRates() jest no-op gdy !empireEconDirty; przelicza projekcje
// prawdziwym cityYieldPerTurn z additionalTax = zakolejkowany podatek; markCityStateDirty ustawia dirty.
function makeHud(startPool, startQueued) {
  const st = { pool: startPool, queued: startQueued, dirty: false, skarb: 0, nauka: 0, msgs: [], log: [], hud: 0 };
  const recompute = () => { const y = yf(st.queued); st.skarb = y.pieniadz; st.nauka = y.nauka; };
  recompute(); // stan poczatkowy ekranu
  const io = {
    getWorkPool: () => st.pool, setWorkPool: (_o, v) => { st.pool = v; },
    queueTax: (_o, t) => { st.queued += t; st.log.push('queue'); },
    refreshRates: () => { st.log.push('refresh'); if (!st.dirty) return; st.dirty = false; recompute(); },
    markDirty: () => { st.log.push('dirty'); st.dirty = true; },
    readRates: () => ({ skarb: st.skarb, nauka: st.nauka }),
    showMessage: (m) => st.msgs.push(m), updateHud: () => { st.hud++; },
  };
  return { st, io };
}
ok(typeof runManualWorkTaxAction === 'function', 'F: runManualWorkTaxAction wyeksportowana');
if (typeof runManualWorkTaxAction === 'function') {
  let h = makeHud(25000, 0);
  const skarbScreenBefore = h.st.skarb;
  const spent = runManualWorkTaxAction(0, 20000, 1, true, h.io);
  eq(spent, 20000, 'F: zwrocono 20 000 wydanej Pracy');
  eq(h.st.pool, 5000, 'F: Praca w puli -20 000');
  eq(h.st.skarb - skarbScreenBefore, 12000, 'F: "+N/ture" Skarbca na ekranie rosnie o 12 000 zaraz po zamianie');
  eq(h.st.nauka, yf(20000).nauka, 'F: Nauka na ekranie zgodna z silnikiem');
  eq(h.st.msgs.length, 1, 'F: dokladnie jeden komunikat');
  ok(/\+12000 do Skarbca/.test(h.st.msgs[0] || ''), 'F: komunikat podaje +12000 do Skarbca (zgodny z ekranem)');
  eq(h.st.hud, 1, 'F: updateHud wywolany raz');
  eq(h.st.log.join(','), 'refresh,queue,dirty,refresh', 'F: kolejnosc: refresh(baza) -> queue -> markDirty -> refresh(po)');
  // brak markDirty = pierwotny blad (HUD nie widzi podatku)
  h = makeHud(25000, 0);
  const noDirty = { ...h.io, markDirty: () => {} };
  const before0 = h.st.skarb;
  runManualWorkTaxAction(0, 20000, 1, true, noDirty);
  eq(h.st.skarb - before0, 0, 'F: bez markDirty ekran NIE rosnie (odtworzenie pierwotnego bledu w modelu)');
  ok(/\+0 do Skarbca/.test(h.st.msgs[0] || ''), 'F: ... a komunikat zdradza brak wplywu (+0)');
  // odmowy: brak markDirty, brak zmiany Pracy, komunikat z powodem
  for (const [req, en, pool, re] of [[0, true, 100, /większą od 0/], [-3, true, 100, /większą od 0/], [NaN, true, 100, /większą od 0/],
    [10, false, 100, /Targowiska/], [10, true, 0, /Brak Pracy/]]) {
    const hh = makeHud(pool, 0);
    const sp = runManualWorkTaxAction(0, req, 1, en, hh.io);
    ok(sp === 0 && hh.st.pool === pool && !hh.st.log.includes('dirty') && hh.st.msgs.length === 1 && re.test(hh.st.msgs[0]),
      `F: odmowa (req=${req}, enabled=${en}, pula=${pool}): 0 wydane, pula nietknieta, bez markDirty, komunikat z powodem`);
  }
  { const hh = makeHud(100, 0); const sp = runManualWorkTaxAction(0, 1, 0.5, true, hh.io);
    ok(sp === 0 && hh.st.pool === 100 && /0 Podatku/.test(hh.st.msgs[0]), 'F: kurs 0.5 / 1 Praca: Praca nie odjeta, komunikat z powodem'); }
  // druga zamiana sumuje sie z pierwsza
  h = makeHud(40000, 0);
  runManualWorkTaxAction(0, 20000, 1, true, h.io);
  const mid = h.st.skarb;
  runManualWorkTaxAction(0, 10000, 1, true, h.io);
  eq(h.st.skarb - mid, 6000, 'F: druga zamiana 10 000 -> kolejne +6 000 na ekranie');
}

console.log(`\n${passed} passed, ${failed} failed`);
fs.rmSync(tmp, { recursive: true, force: true });
if (failed) process.exit(1);
