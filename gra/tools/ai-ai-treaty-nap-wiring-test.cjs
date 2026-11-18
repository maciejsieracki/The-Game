'use strict';
/**
 * ai-ai-treaty-nap-wiring-test.cjs -- R-WEB-AI-AI-TREATIES-E2-NAP-WIRING-FLAGGED-Q1 (etap E2).
 * Logika kroku NAP AI↔AI (gra/src/game/ai-ai-treaty-tick.ts) + statyczne sprawdzenie wpięcia w main.ts.
 *
 *  (B1)  przełącznik: torAktywny w danych = false; isAiAiTreatyTickEnabled() = false domyślnie, true po nadpisaniu testowym;
 *  (B2)  równe moce: NAP powstaje, czas 15 tur, wygasaTura = tura + 15, D = 0, brak płatnika;
 *  (B3)  słabsza strona płaci D ZŁOTEM: płatnik = słabszy, odbiorca = silniejszy, skarbce zmienione dokładnie o D, suma zachowana;
 *  (B4)  skarbiec płatnika za mały (0) => brak NAP i brak zmian skarbców;
 *  (B5)  wojna => brak NAP; rozejm => brak NAP (obrona w planerze);
 *  (B6)  wstępna kwalifikacja (brak wspólnej granicy / istniejący NAP) => brak NAP (prefilter);
 *  (B7)  gotowość 0,53 (poniżej 0,54) => brak NAP; 0,54 => NAP;
 *  (B8)  max 1 próba na proponenta: odmowa pierwszego celu nie kończy się próbą drugiego celu tego samego proponenta;
 *  (B9)  brak dwóch NAP tej samej pary w jednej turze (A→B i B→A);
 *  (B10) skarbiec nigdy poniżej zera nawet, gdy wstrzyknięta ocena chce D > skarbiec (ostatnia linia obrony);
 *  (B11) kara P-4: −30 Relacji przeliczona na Respekt (mnożnik 1 i 2), clamp 0..100; wartość kary z danych = −30;
 *  (B12) wygaśnięcie NAP po 15 turach: expireTreaties zostawia w turze +14, usuwa w +15 (istniejący mechanizm);
 *  (B13) determinizm: 100 powtórzeń tego samego wejścia => identyczny wynik;
 *  (B14) źródło: brak Math.random / Date w ai-ai-treaty-tick.ts;
 *  (B15) wpięcie main.ts (statycznie): tickAiAiTreatyRequests() po tickAiAiWarWeariness, przed scanAutoSiegesAfterAiTurn,
 *        jedno wywołanie w turze; kara breakTreatiesOnWar wyłącznie za isAiAiTreatyTickEnabled().
 *  Mutanty (kopia źródła w pamięci, esbuild; NIE git checkout): M1 brak przelewu D odbiorcy; M2 zamiana płatnika;
 *  M3 brak ostatniej linii obrony skarbca; M4 zła długość NAP (+1); M5 brak blokady pary zawartej w tej turze;
 *  M6 brak obrony przed rozejmem w planerze. Każdy musi czerwienić test.
 *
 *   node tools/ai-ai-treaty-nap-wiring-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const SRC_FILE = path.resolve(GAME_DIR, 'ai-ai-treaty-tick.ts');
const MAIN_FILE = path.resolve(GRA_ROOT, 'src', 'main.ts');
const PARAMS_FILE = path.resolve(GRA_ROOT, 'data', 'ai-ai-treaty-params.json');
const ORIG = fs.readFileSync(SRC_FILE, 'utf8');

/** Buduje moduł z kopii źródła; `replacements` = mutacje tekstu (w pamięci). Dołącza eksporty pomocnicze testu. */
function loadModule(replacements) {
  let src = ORIG;
  for (const [from, to] of replacements || []) {
    if (!src.includes(from)) throw new Error('mutacja: brak tekstu w źródle: ' + from);
    src = src.replace(from, to);
  }
  src += "\nexport { expireTreaties } from './diplomacy-treaties';\nexport { RodzajTraktatu } from '../types/diplomacy';\n";
  const res = esbuild.buildSync({
    stdin: { contents: src, resolveDir: GAME_DIR, sourcefile: 'ai-ai-treaty-tick.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

/** Wejście planera: owners [1,2] (lub podane), moce, skarbce, kwalifikacja pary i stan pary. */
function makeInput(mod, over) {
  const power = (over && over.power) || { 1: 1000, 2: 1000 };
  const base = {
    turn: 100,
    owners: [1, 2],
    pairPrefilter: () => true,
    pairInfo: () => ({
      warStatus: 'pokoj', hasNap: false, hasAlliance: false, sharesBorder: true,
      relacja: 150, zaufanie: 60, willingness: 0.6,
    }),
    sideOf: (oid) => ({ power: power[oid] ?? 1000, treasuryGold: 0, allies: [], enemies: [] }),
    treasury: new Map([[1, 500], [2, 500]]),
  };
  return Object.assign(base, over || {});
}

const checks = [];
function check(name, cond, extra) {
  checks.push({ name, ok: !!cond, extra: extra === undefined ? '' : extra });
}

/** Zestaw testów zachowania; zwraca listę nazw nieudanych testów. */
function suite(mod) {
  const failed = [];
  const run = (label, fn) => {
    const before = checks.length;
    try {
      fn();
    } catch (e) {
      checks.push({ name: label + ' (wyjątek)', ok: false, extra: String(e && e.message) });
    }
    for (let i = before; i < checks.length; i++) if (!checks[i].ok) failed.push(checks[i].name);
  };

  run('B2', () => {
    const r = mod.planAiAiNapTreatyTick(makeInput(mod));
    check('B2 równe moce: jeden NAP', r.length === 1, JSON.stringify(r));
    if (r.length === 1) {
      check('B2 czas 15 tur', r[0].durationTurns === 15, r[0].durationTurns);
      check('B2 wygasaTura = tura+15', r[0].wygasaTura === 115, r[0].wygasaTura);
      check('B2 D = 0, brak płatnika', r[0].paymentGold === 0 && r[0].payer === null && r[0].payee === null);
    }
  });

  run('B3', () => {
    const input = makeInput(mod, { power: { 1: 1000, 2: 500 }, treasury: new Map([[1, 1e6], [2, 1e6]]) });
    const r = mod.planAiAiNapTreatyTick(input);
    check('B3 jeden NAP przy nierównych mocach', r.length === 1, JSON.stringify(r.map(x => [x.proposer, x.target])));
    if (r.length === 1) {
      const t = r[0];
      check('B3 D > 0', t.paymentGold > 0, t.paymentGold);
      check('B3 płatnik = słabszy (owner 2)', t.payer === 2 && t.payee === 1, `${t.payer}->${t.payee}`);
      // Planer nie zmienia wejścia (przelew wykonuje wołający); wejście ma 1e6 u obu stron.
      check('B3 wejście skarbców nietknięte', input.treasury.get(1) === 1e6 && input.treasury.get(2) === 1e6, JSON.stringify([...input.treasury]));
    }
  });

  run('B3b', () => {
    // Przelew: po planie skarbiec płatnika maleje o D, odbiorcy rośnie o D. Odtwarzamy przelew tak jak wołający.
    const input = makeInput(mod, { power: { 1: 1000, 2: 500 }, treasury: new Map([[1, 1e6], [2, 1e6]]) });
    const plan = mod.planAiAiNapTreatyTickFull(input);
    const r = plan.accepted;
    if (r.length === 1) {
      const t = r[0];
      const tr = plan.treasuryPo;
      check('B3b płatnik pomniejszony o D', tr.get(t.payer) === 1e6 - t.paymentGold, tr.get(t.payer));
      check('B3b odbiorca powiększony o D', tr.get(t.payee) === 1e6 + t.paymentGold, tr.get(t.payee));
      check('B3b suma skarbców zachowana po przelewie', tr.get(1) + tr.get(2) === 2e6, `${tr.get(1)}+${tr.get(2)}`);
      check('B3b płatnik ≥ 0', tr.get(t.payer) >= 0, tr.get(t.payer));
    }
  });

  run('B4', () => {
    const input = makeInput(mod, { power: { 1: 1000, 2: 500 }, treasury: new Map([[1, 500], [2, 0]]) });
    const before = JSON.stringify([...input.treasury]);
    const r = mod.planAiAiNapTreatyTick(input);
    check('B4 brak NAP przy skarbcu płatnika 0', r.length === 0, JSON.stringify(r));
    check('B4 skarbce nietknięte', JSON.stringify([...input.treasury]) === before);
  });

  run('B5', () => {
    const wojna = mod.planAiAiNapTreatyTick(makeInput(mod, { pairInfo: () => ({ warStatus: 'wojna', hasNap: false, hasAlliance: false, sharesBorder: true, relacja: 150, zaufanie: 60, willingness: 0.6 }) }));
    check('B5 wojna => brak NAP', wojna.length === 0);
    const rozejm = mod.planAiAiNapTreatyTick(makeInput(mod, { pairInfo: () => ({ warStatus: 'rozejm', hasNap: false, hasAlliance: false, sharesBorder: true, relacja: 150, zaufanie: 60, willingness: 0.6 }) }));
    check('B5 rozejm => brak NAP', rozejm.length === 0);
  });

  run('B6', () => {
    const r = mod.planAiAiNapTreatyTick(makeInput(mod, { pairPrefilter: () => false }));
    check('B6 prefilter (brak granicy / istniejący NAP) => brak NAP', r.length === 0);
    const nap = mod.planAiAiNapTreatyTick(makeInput(mod, { pairInfo: () => ({ warStatus: 'pokoj', hasNap: true, hasAlliance: false, sharesBorder: true, relacja: 150, zaufanie: 60, willingness: 0.6 }) }));
    check('B6 istniejący NAP (ocena E1) => brak NAP', nap.length === 0);
  });

  run('B7', () => {
    const mk = (w) => mod.planAiAiNapTreatyTick(makeInput(mod, { pairInfo: () => ({ warStatus: 'pokoj', hasNap: false, hasAlliance: false, sharesBorder: true, relacja: 150, zaufanie: 60, willingness: w }) }));
    check('B7 gotowość 0,53 => brak NAP', mk(0.53).length === 0);
    check('B7 gotowość 0,54 => NAP', mk(0.54).length === 1);
  });

  run('B8', () => {
    // Owners [1,2,3]. Proponent 1 ma pierwszy cel 2 (gotowość 0,3 => odmowa). Próba na 3 byłaby drugą próbą 1 — zakazana.
    const input = makeInput(mod, {
      owners: [1, 2, 3],
      pairInfo: (p, t) => ({ warStatus: 'pokoj', hasNap: false, hasAlliance: false, sharesBorder: true, relacja: 150, zaufanie: 60, willingness: (p === 1 && t === 2) ? 0.3 : 0.6 }),
    });
    const r = mod.planAiAiNapTreatyTick(input);
    check('B8 proponent 1 nie ma próby na drugi cel', !r.some(x => x.proposer === 1), JSON.stringify(r.map(x => [x.proposer, x.target])));
    check('B8 proponent 2 zawiera NAP z 1', r.some(x => x.proposer === 2 && x.target === 1), JSON.stringify(r.map(x => [x.proposer, x.target])));
  });

  run('B9', () => {
    // Owners [1,2]: proponent 1 zawiera NAP z 2; proponent 2 nie może ponownie zawrzeć NAP z 1 w tej samej turze.
    const r = mod.planAiAiNapTreatyTick(makeInput(mod));
    const pary = r.map(x => [x.proposer, x.target].sort((a, b) => a - b).join('-'));
    check('B9 jedna para = jeden NAP w turze', r.length === 1 && new Set(pary).size === r.length, JSON.stringify(pary));
  });

  run('B10', () => {
    // Wstrzyknięta ocena zwraca akceptację z D = 100 przy skarbcu płatnika 50 => planer nie może zejść poniżej zera.
    const input = makeInput(mod, {
      treasury: new Map([[1, 50], [2, 50]]),
      evaluate: () => ({
        accept: true, reason: 'OK', paymentGold: 100, payer: 'proposer',
        parity: { S: 0, W: 0, D: 100, r: 2 }, durationTurns: 15,
      }),
    });
    const r = mod.planAiAiNapTreatyTick(input);
    check('B10 brak NAP, gdy D > skarbiec płatnika', r.length === 0, JSON.stringify(r.length));
    check('B10 skarbce nietknięte', input.treasury.get(1) === 50 && input.treasury.get(2) === 50);
  });

  run('B11', () => {
    const rel = { respekt: 50, zaufanie: 60, status: 'pokoj' };
    const r1 = mod.applyAiAiNapBreachRelacja(rel, -30, 1);
    check('B11 −30 Relacji przy mnożniku 1 => Respekt 20', r1.respekt === 20, r1.respekt);
    const r2 = mod.applyAiAiNapBreachRelacja(rel, -30, 2);
    check('B11 −30 Relacji przy mnożniku 2 => Respekt 35', r2.respekt === 35, r2.respekt);
    const low = mod.applyAiAiNapBreachRelacja({ respekt: 10, zaufanie: 0, status: 'pokoj' }, -30, 1);
    check('B11 clamp dolny 0', low.respekt === 0, low.respekt);
    // OGRANICZENIE UDOKUMENTOWANE (zarzut 1 Evaluatora): przy Respekcie 10 kara −30 Relacji daje realną utratę
    // Relacji 10 (nie 30), bo clamp obcina Respekt do 0. Pełna kara wymaga decyzji właściciela (reszta do Zaufania?).
    check('B11 ograniczenie: Respekt 10 => realna utrata Relacji 10 z 30 (clamp)', (10 - low.respekt) === 10, 10 - low.respekt);
    const hi = mod.applyAiAiNapBreachRelacja({ respekt: 95, zaufanie: 0, status: 'pokoj' }, 30, 1);
    check('B11 clamp górny 100', hi.respekt === 100, hi.respekt);
    check('B11 kara z danych = −30', mod.aiAiNapBreachRelacjaDelta() === -30, mod.aiAiNapBreachRelacjaDelta());
    check('B11 nie zmienia zaufania', r1.zaufanie === 60);
  });

  run('B12', () => {
    const r = mod.planAiAiNapTreatyTick(makeInput(mod));
    check('B12 NAP do wykonania', r.length === 1);
    if (r.length === 1) {
      const deal = { id: 'nap_aiai_1_2_t100', rodzaj: mod.RodzajTraktatu.PaktNieagresji, strony: [1, 2], wygasaTura: r[0].wygasaTura, zawartaTura: 100 };
      check('B12 w turze +14 NAP jeszcze żyje', mod.expireTreaties([deal], 114).length === 1);
      check('B12 w turze +15 NAP wygasa', mod.expireTreaties([deal], 115).length === 0);
    }
  });

  run('B13', () => {
    const input = makeInput(mod, { power: { 1: 1000, 2: 500 }, treasury: new Map([[1, 1e6], [2, 1e6]]) });
    const first = JSON.stringify(mod.planAiAiNapTreatyTick(input));
    let same = true;
    for (let i = 0; i < 100; i++) {
      if (JSON.stringify(mod.planAiAiNapTreatyTick(input)) !== first) { same = false; break; }
    }
    check('B13 100 powtórzeń = ten sam wynik', same);
  });

  run('B14', () => {
    check('B14 brak Math.random/Date w źródle', !/Math\.random|new Date\(|Date\.now\(/.test(ORIG));
  });

  return failed;
}

// ---- Testy statyczne (nie wykonują gry) ----
function staticChecks() {
  const params = JSON.parse(fs.readFileSync(PARAMS_FILE, 'utf8'));
  check('B1 torAktywny w danych = false', params.torAktywny === false, params.torAktywny);
  const mod = loadModule(null);
  check('B1 isAiAiTreatyTickEnabled() domyślnie false', mod.isAiAiTreatyTickEnabled() === false);
  mod.setAiAiTreatyTickEnabledForTest(true);
  check('B1 nadpisanie testowe true', mod.isAiAiTreatyTickEnabled() === true);
  mod.setAiAiTreatyTickEnabledForTest(null);
  check('B1 null wraca do danych (false)', mod.isAiAiTreatyTickEnabled() === false);

  const main = fs.readFileSync(MAIN_FILE, 'utf8');
  const callRe = /tickAiAiWarWeariness\(aiTurnAwaitingBattle\);[\s\S]*?tickAiAiTreatyRequests\(\);[\s\S]*?scanAutoSiegesAfterAiTurn\(\);/;
  check('B15 wywołanie tickAiAiTreatyRequests po zmęczeniu, przed skanem oblężeń', callRe.test(main));
  const callCount = (main.match(/^\s*tickAiAiTreatyRequests\(\);/gm) || []).length;
  check('B15 jedno wywołanie w pętli tury', callCount === 1, callCount);
  check('B15 kara breakTreatiesOnWar tylko za przełącznikiem', /napAiAiZerwany = isAiAiTreatyTickEnabled\(\)/.test(main));
}

// ---- Uruchomienie ----
const baselineFailed = suite(loadModule(null));
staticChecks();
const failedChecks = checks.filter(c => !c.ok);
for (const c of checks) {
  if (!c.ok) console.log('FAIL', c.name, c.extra);
}
console.log(`[baseline] testy zachowania: nieudane = ${baselineFailed.length}; wszystkie sprawdzenia: ${checks.length - failedChecks.length}/${checks.length} OK`);

const MUTANTS = [
  ['M1 brak przelewu D odbiorcy', [["treasury.set(payee, (treasury.get(payee) ?? 0) + D);", '']]],
  ['M2 zamiana płatnika', [["payer = result.payer === 'proposer' ? p : target;", "payer = result.payer === 'proposer' ? target : p;"]]],
  ['M3 brak obrony skarbca', [["if (D > have) continue;", '']]],
  ['M4 zła długość NAP', [['wygasaTura: input.turn + durationTurns,', 'wygasaTura: input.turn + durationTurns + 1,']]],
  ['M5 brak blokady pary zawartej', [['if (t === p || zawartePary.has(kluczPary(p, t))) continue;', 'if (t === p) continue;']]],
  ['M6 brak obrony przed rozejmem', [["if (info.warStatus === 'rozejm') continue;", '']]],
];
let mutantsMissed = 0;
for (const [label, repl] of MUTANTS) {
  checks.length = 0;
  const f = suite(loadModule(repl));
  if (f.length > 0) {
    console.log(`[mutant ${label}] wykryty (${f.length} nieudanych: ${f.slice(0, 3).join(', ')})`);
  } else {
    mutantsMissed++;
    console.log(`[mutant ${label}] NIE WYKRYTY`);
  }
}

const ok = baselineFailed.length === 0 && failedChecks.length === 0 && mutantsMissed === 0;
console.log(ok ? 'WYNIK: ZIELONE (zachowanie + statyka + mutanty wykryte)' : 'WYNIK: CZERWONE');
process.exit(ok ? 0 : 1);
