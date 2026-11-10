'use strict';
/**
 * battle-skip-siege-parity-test.cjs -- R-WEB-BATTLE-SKIP-SIEGE-TRUE-RESULT-Q1 (runda 3).
 *
 * TEST STATYCZNY struktury (szybki, bez przegladarki). Dowod BEHAWIORALNY (AUTO vs Pomin,
 * N ziaren, mutant z 1d068199) to battle-skip-siege-parity-live-test.cjs (Chromium).
 *
 * Przyczyna (diagnoza): w oblezeniu bez wylomu silnik nie konczy bitwy (_updateStallWatch pomija
 * oblezenie, _stalled nigdy true). Pomin przewijal do FF_MAX_ROUNDS=400 i rozstrzygal PAT samym
 * morale armii -> atakujacy z wyzszym ulamkiem morale bral miasto BEZ wylomu (exploit), a AUTO
 * nie konczylo sie wcale.
 *
 * Decyzje wlasciciela (ABC 2026-11-10): (a) krotszy sufit tur dla oblezenia bez wylomu
 * (ZALOZENIE 150, parametr combat-params.json oblezenie.bez_wylomu_max_tur); (b) po suficie
 * REMIS (odparty szturm): atakujacy sie wycofuje, miasto zostaje przy obroncy.
 *
 * Run z gra/: node tools/battle-skip-siege-parity-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.join(GRA, 'src/battle/battleScene.ts'), 'utf8');
const PARAMS = JSON.parse(fs.readFileSync(path.join(GRA, 'data/combat-params.json'), 'utf8'));

let pass = 0; let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/** Zwraca tresc metody (od sygnatury do pierwszej linii '  }' na tym samym poziomie). */
function methodBody(sig) {
  const start = SRC.indexOf(sig);
  if (start < 0) return null;
  const end = SRC.indexOf('\n  }\n', start);
  return end < 0 ? null : SRC.slice(start, end + 4);
}

// S1 -- parametr sufitu w danych, osobny od FF_MAX_ROUNDS.
const capParam = PARAMS['oblężenie'] && PARAMS['oblężenie'].bez_wylomu_max_tur;
check('S1 combat-params.json: oblezenie.bez_wylomu_max_tur jest liczba calkowita > 0 i < 400', Number.isInteger(capParam) && capParam > 0 && capParam < 400, capParam);
check('S1b battleScene czyta parametr z combat-params.json', /bez_wylomu_max_tur/.test(SRC) && /siegeNoBreachMaxRounds\s*:\s*number\s*=\s*SIEGE_NO_BREACH_MAX_ROUNDS/.test(SRC));

// S2 -- jedyny werdykt sufitu.
const verdict = methodBody('private _roundCapVerdict(');
check('S2 _roundCapVerdict istnieje', !!verdict);
check(
  'S2b oblezenie bez wylomu (siegeWallCol>=0 && !wallEverBreached) -> REMIS po sufitcie siegeNoBreachMaxRounds',
  !!verdict && /siegeWallCol\s*>=\s*0\s*&&\s*!this\.wallEverBreached[\s\S]*?siegeNoBreachMaxRounds[\s\S]*?winner:\s*'remis'/.test(verdict),
  verdict && verdict.slice(0, 500),
);
check('S2c poza oblezeniem bez wylomu: sufit FF_MAX_ROUNDS i morale (remis morale -> obronca)',
  !!verdict && /FF_MAX_ROUNDS/.test(verdict) && /ratioA\s*<=\s*ratioD\s*\?\s*'obronca'\s*:\s*'atakujacy'/.test(verdict));

// S3 -- wszystkie sciezki (AUTO/reczna: _checkEnd, Pomin: _runFastForward/_ffRoundCapResult) uzywaja go.
const endBody = methodBody('private _checkEnd(): boolean {');
check('S3 _checkEnd uzywa _roundCapVerdict i konczy remisem przez _finishDraw',
  !!endBody && /_roundCapVerdict\(\)/.test(endBody) && /_finishDraw\(/.test(endBody));
const ffBody = methodBody('private _ffRoundCapResult(');
check('S3b _ffRoundCapResult uzywa _roundCapVerdict, bez wlasnego porownania morale',
  !!ffBody && ffBody.includes('this._roundCapVerdict()') && !/ratioA\s*<=\s*ratioD/.test(ffBody));
const runFf = methodBody('private _runFastForward(): void {');
check('S3c _runFastForward sprawdza sufit przez _roundCapVerdict (nie surowe FF_MAX_ROUNDS)',
  !!runFf && runFf.includes('this._roundCapVerdict()') && !/roundNo\s*>=\s*FF_MAX_ROUNDS/.test(runFf));

// S4 -- remis: ocalali OBU stron wracaja na mape, wynik 'remis' trafia do BattleResult.
const drawBody = methodBody('private _finishDraw(');
check('S4 _finishDraw: _endWinner=remis i ocalali obu stron',
  !!drawBody && /_endWinner\s*=\s*'remis'/.test(drawBody) && /_battleUnitsForMapExport\(this\.atk\)/.test(drawBody) && /_battleUnitsForMapExport\(this\.def\)/.test(drawBody));
check('S4b ekran konca nie liczy remisu jako wygranej gracza', /const isDraw = winner === 'remis'/.test(SRC) && /const playerWon = !isDraw && /.test(SRC));

// S5 -- skip() w trakcie gry nie wola osobnego rachunku (poza awaryjnym !started).
const skipBody = methodBody('  skip(): void {');
const instantCalls = skipBody ? (skipBody.match(/_skipInstantFallback\(\)/g) || []).length : -1;
check('S5 skip() uzywa FF (jedna sciezka awaryjna !started)', instantCalls === 1, { instantCalls });

// S6 -- test behawioralny obecny.
check('S6 test zywy battle-skip-siege-parity-live-test.cjs obecny', fs.existsSync(path.join(GRA, 'tools/battle-skip-siege-parity-live-test.cjs')));
check('S6b battle-skip-equals-auto-resolve-test.cjs obecny', fs.existsSync(path.join(GRA, 'tools/battle-skip-equals-auto-resolve-test.cjs')));

console.log(`RESULT pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
