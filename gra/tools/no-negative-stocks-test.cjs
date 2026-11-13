'use strict';
/**
 * no-negative-stocks-test.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-Q1 (czysta logika).
 *
 * Sprawdza src/game/no-negative-stocks.ts:
 *  - wolne tury 1–10 (bez blokady),
 *  - blokada od tury 11 przy prognozie < 0 i pogorszeniu (skarbiec i spichlerz),
 *  - komunikat zawiera kwotę braku,
 *  - bezpieczny wyjątek dla starego zapisu (ujemny stan, prognoza nie gorsza),
 *  - ruch naprawczy gracza znosi blokadę (brak zakleszczenia),
 *  - plan AI: tańsze środki najpierw, bez eliminacji cywilizacji, deterministyczny.
 *
 * Run: node tools/no-negative-stocks-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  NNS_WOLNE_TURY,
  evaluateEndTurnStocks,
  czyRuchNaprawczy,
  planAiBalance,
} from '../src/game/no-negative-stocks';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const base = { skarbiecObecny: 100, skarbiecPo: 100, spichlerzObecny: 100, spichlerzPo: 100 };

// 1) Wolne tury 1–10: nawet przy ujemnej prognozie brak blokady.
for (const t of [1, 5, 10]) {
  const v = M.evaluateEndTurnStocks({ ...base, turn: t, skarbiecPo: -50 });
  ok(v.wyjatekTur === true && v.blokada === false, `tura ${t} zwolniona z blokady`);
}

// 2) Tura 11: skarbiec prognozowany poniżej zera i gorszy niż obecny -> blokada z kwotą.
{
  const v = M.evaluateEndTurnStocks({ ...base, turn: 11, skarbiecObecny: 30, skarbiecPo: -20 });
  ok(v.blokada === true, 'tura 11 skarbiec<0 blokuje');
  ok(v.brakuje.length === 1 && v.brakuje[0].stock === 'skarbiec' && v.brakuje[0].ile === 20,
    'brak skarbca = 20');
  ok(v.komunikat.includes('20') && v.komunikat.includes('Skarbiec'), 'komunikat zawiera kwotę i nazwę');
}

// 3) Spichlerz państwa (żywność) analogicznie.
{
  const v = M.evaluateEndTurnStocks({ ...base, turn: 12, spichlerzObecny: 10, spichlerzPo: -7 });
  ok(v.blokada === true && v.brakuje[0].stock === 'spichlerz' && v.brakuje[0].ile === 7,
    'spichlerz<0 blokuje z brakiem 7');
}

// 4) Brak blokady gdy obie prognozy >= 0.
{
  const v = M.evaluateEndTurnStocks({ ...base, turn: 40 });
  ok(v.blokada === false && v.komunikat === '', 'dodatnie prognozy bez blokady');
}

// 5) Bezpieczny wyjątek: stan już ujemny i prognoza nie gorsza -> nie blokuje.
{
  const v = M.evaluateEndTurnStocks({ ...base, turn: 80, skarbiecObecny: -30, skarbiecPo: -25 });
  ok(v.blokada === false, 'stary zapis, prognoza lepsza -> brak blokady');
  ok(v.wyjatekStarego === true, 'wyjatekStarego ustawione');
}
// ...a pogorszenie ujemnego stanu już blokuje.
{
  const v = M.evaluateEndTurnStocks({ ...base, turn: 80, skarbiecObecny: -30, skarbiecPo: -45 });
  ok(v.blokada === true && v.brakuje[0].ile === 45, 'ujemny stan pogarszany -> blokada');
}

// 6) Ruch naprawczy gracza (podatek) znosi blokadę: brak zakleszczenia.
{
  const brak = [{ stock: 'skarbiec', ile: 20 }];
  const podatek = { id: 'podatek_+10', rodzaj: 'podatek', stock: 'skarbiec', zysk: 25, koszt: 0, eliminujeCywilizacje: false };
  ok(M.czyRuchNaprawczy(brak, [podatek]) === true, 'podatek pokrywa brak');
  // Wynik po dźwigni wyliczany z planu (nie ręcznie dodawany zysk): plan -> saldo po -> ocena.
  const planGracza = M.planAiBalance(brak, [podatek]);
  const poPlanie = planGracza.akcje.reduce((s, a) => s + a.zysk, 0);
  const poPodatku = M.evaluateEndTurnStocks({ ...base, turn: 11, skarbiecObecny: 30, skarbiecPo: -20 + poPlanie });
  ok(planGracza.pokryte === true && poPlanie === 25, 'plan z podatkiem pokrywa brak 20 (zysk 25)');
  ok(poPodatku.blokada === false, 'po podatku blokada znika');
  ok(M.czyRuchNaprawczy(brak, []) === false, 'bez dźwigni brak ruchu naprawczego');
  // Dźwignia eliminująca cywilizację nie liczy się jako ruch naprawczy gracza.
  const eliminacja = { ...podatek, id: 'elim', rodzaj: 'rozwiazanie', eliminujeCywilizacje: true, zysk: 999 };
  ok(M.czyRuchNaprawczy(brak, [eliminacja]) === false, 'dźwignia eliminująca nie jest ruchem naprawczym');
}

// 6b) Wyjątek starego zapisu nie zmienia się przez dźwignie: ruch naprawczy niezbędny tylko przy blokadzie.
{
  const v = M.evaluateEndTurnStocks({ ...base, turn: 80, skarbiecObecny: -30, skarbiecPo: -25 });
  ok(v.wyjatekStarego === true && v.blokada === false, 'stary zapis bez blokady (decyzja dispatch: prognoza nie gorsza)');
}

// 7) Plan AI: podatki, potem wstrzymanie, potem najdroższe jednostki; bez eliminacji.
{
  const brak = [{ stock: 'skarbiec', ile: 30 }];
  const levers = [
    { id: 'jedn_tania', rodzaj: 'rozwiazanie', stock: 'skarbiec', zysk: 40, koszt: 5, eliminujeCywilizacje: false },
    { id: 'jedn_droga', rodzaj: 'rozwiazanie', stock: 'skarbiec', zysk: 40, koszt: 90, eliminujeCywilizacje: false },
    { id: 'wstrzymaj_zakup', rodzaj: 'wstrzymanie', stock: 'skarbiec', zysk: 12, koszt: 0, eliminujeCywilizacje: false },
    { id: 'podatek_+5', rodzaj: 'podatek', stock: 'skarbiec', zysk: 15, koszt: 0, eliminujeCywilizacje: false },
    { id: 'jedn_ostatnia', rodzaj: 'rozwiazanie', stock: 'skarbiec', zysk: 999, koszt: 999, eliminujeCywilizacje: true },
  ];
  const plan = M.planAiBalance(brak, levers);
  const ids = plan.akcje.map(a => a.leverId);
  ok(ids[0] === 'podatek_+5', 'AI: podatek jako pierwszy');
  ok(ids[1] === 'wstrzymaj_zakup', 'AI: wstrzymanie zakupu jako drugie');
  ok(ids[2] === 'jedn_droga', 'AI: najdroższa jednostka przed tanią');
  ok(!ids.includes('jedn_ostatnia'), 'AI nie rozwiązuje ostatniej jednostki/cywilizacji');
  ok(plan.pokryte === true, 'plan pokrywa brak 30');
  const plan2 = M.planAiBalance(brak, levers);
  ok(JSON.stringify(plan) === JSON.stringify(plan2), 'plan AI deterministyczny');
}

// 8) Plan AI nie przekracza potrzeb: po pokryciu kolejne dźwignie nie są użyte.
{
  const plan = M.planAiBalance(
    [{ stock: 'spichlerz', ile: 5 }],
    [
      { id: 'a', rodzaj: 'podatek', stock: 'spichlerz', zysk: 9, koszt: 0, eliminujeCywilizacje: false },
      { id: 'b', rodzaj: 'rozwiazanie', stock: 'spichlerz', zysk: 9, koszt: 50, eliminujeCywilizacje: false },
    ],
  );
  ok(plan.akcje.length === 1 && plan.akcje[0].leverId === 'a', 'plan kończy po pokryciu');
}

// 9) Brak dźwigni -> plan niepokryty (wołający musi wtedy użyć siatki z gold-deficit).
{
  const plan = M.planAiBalance([{ stock: 'skarbiec', ile: 10 }], []);
  ok(plan.pokryte === false && plan.pozostalo.skarbiec === 10, 'brak dźwigni = niepokryte');
}

try { fs.unlinkSync(ENTRY); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`no-negative-stocks-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
