'use strict';
/**
 * walka-jeden-kontratak-test.cjs
 *
 * R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 GOAL 1 -- obronca oddaje kontratak TYLKO
 * PIERWSZEMU atakujacemu w danej turze bitwy taktycznej 3D.
 *
 * Co ten test sprawdza (i dlaczego nie jest tautologia):
 *   CZESC A -- REALNY obiekt DefenderCounterBudget z src/game/combat.ts
 *     (bundlowany esbuildem, nie kopia logiki) przepuszczony przez scenariusz
 *     "N atakujacych uderza jednego obronce w jednej turze" dla N=1,2,5,20.
 *   CZESC B -- reset na poczatku nastepnej tury (licznik wraca do zera).
 *   CZESC C -- BEZ WYJATKU dla ufortyfikowanego / broniacego miasta.
 *   CZESC D -- WIAZANIE w src/battle/battleScene.ts: bez trzech konkretnych
 *     wywolan (beginTurn w _beginTurn, canCounter w _defenderCounters,
 *     consume przy oddanym kontrataku) mechanika nie trafia do gry, wiec
 *     sama zielona CZESC A niczego by nie dowodzila. Cofniecie ktorejkolwiek
 *     z tych linii czerwieni ten test.
 *   CZESC E -- ANTY-SAMOOSZUKIWANIE (dispatch, drugi tryb): dowod, ze naprawa
 *     NIE poszla o poziom za nisko. Wewnatrz JEDNEGO starcia resolveCombat
 *     kontratak obroncy NADAL pada w KAZDEJ rundzie tego pojedynku. Gdyby
 *     ktos wylaczyl kontratak wewnatrz resolveCombat, ta czesc czerwieni.
 *
 * Usage (z gra/): node tools/walka-jeden-kontratak-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const COMBAT_TS = path.join(GRA_DIR, 'src/game/combat.ts');
const SCENE_TS = path.join(GRA_DIR, 'src/battle/battleScene.ts');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');
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
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();
const BUNDLE = path.join(os.tmpdir(), `walka-jeden-kontratak-bundle-${TMPDIR_RUN_ID}.cjs`);

let failed = 0;
let passed = 0;

function check(cond, label, extra) {
  if (cond) {
    passed++;
    console.log('  OK:', label);
  } else {
    failed++;
    console.error('  FAIL:', label, extra === undefined ? '' : '— ' + extra);
  }
}

function eq(actual, expected, label) {
  check(actual === expected, label, 'oczekiwano ' + expected + ', jest ' + actual);
}

// ---------------------------------------------------------------------------
// Bundle
// ---------------------------------------------------------------------------
try {
  execSync(
    '"' + ESBUILD_BIN + '" "' + COMBAT_TS + '" --bundle --platform=node --format=cjs --outfile="' + BUNDLE + '"',
    { stdio: 'pipe' },
  );
} catch (e) {
  console.error('esbuild failed:', e.message);
  process.exit(1);
}
const combat = require(BUNDLE);

console.log('walka-jeden-kontratak-test.cjs\n');

// ---------------------------------------------------------------------------
// CZESC A -- N atakujacych, jeden obronca, jedna tura
// ---------------------------------------------------------------------------
console.log('CZESC A -- N atakujacych w JEDNEJ turze');

if (typeof combat.DefenderCounterBudget !== 'function') {
  console.error('  FAIL: combat.ts nie eksportuje DefenderCounterBudget (GOAL 1 niewdrozony)');
  process.exit(1);
}
eq(combat.COUNTERS_PER_DEFENDER_PER_TURN, 1, 'COUNTERS_PER_DEFENDER_PER_TURN === 1');

/**
 * Odtwarza DOKLADNIE punkt wpiecia z battleScene._doMeleeAttack:
 * kontratak pada wtedy i tylko wtedy, gdy _counterBudget.canCounter(id) jest
 * prawda; po oddaniu kontrataku wolane jest consume(id).
 */
function countersInOneTurn(budget, defenderId, attackers) {
  let counters = 0;
  for (let i = 0; i < attackers; i++) {
    if (budget.canCounter(defenderId)) {
      budget.consume(defenderId);
      counters++;
    }
  }
  return counters;
}

for (const N of [1, 2, 5, 20]) {
  const budget = new combat.DefenderCounterBudget();
  budget.beginTurn();
  eq(countersInOneTurn(budget, 'D1', N), 1, 'N=' + N + ' atakujacych -> dokladnie 1 kontratak');
}

// ---------------------------------------------------------------------------
// CZESC B -- reset na poczatku nastepnej tury
// ---------------------------------------------------------------------------
console.log('CZESC B -- reset licznika na nowej turze');
{
  const budget = new combat.DefenderCounterBudget();
  budget.beginTurn();
  eq(countersInOneTurn(budget, 'D1', 20), 1, 'tura 1: 20 atakujacych -> 1 kontratak');
  eq(budget.usedThisTurn('D1'), 1, 'tura 1: licznik obroncy = 1');
  budget.beginTurn();
  eq(budget.usedThisTurn('D1'), 0, 'tura 2: licznik wrocil do zera');
  eq(countersInOneTurn(budget, 'D1', 20), 1, 'tura 2: obronca znow kontratakuje raz');
}

// ---------------------------------------------------------------------------
// CZESC C -- brak wyjatku dla fortyfikacji i miasta
// ---------------------------------------------------------------------------
console.log('CZESC C -- ufortyfikowany / w miescie: TEZ dokladnie 1');
{
  const budget = new combat.DefenderCounterBudget();
  budget.beginTurn();
  // Trzej obroncy w tej samej turze: zwykly, ufortyfikowany w polu, na murze
  // miasta. Budzet jest identyczny dla kazdego -- nie zna zadnej z tych flag.
  eq(countersInOneTurn(budget, 'D-zwykly', 20), 1, 'obronca zwykly -> 1');
  eq(countersInOneTurn(budget, 'D-ufortyfikowany', 20), 1, 'obronca ufortyfikowany w polu -> 1');
  eq(countersInOneTurn(budget, 'D-miasto-mur', 20), 1, 'obronca na murze miasta -> 1');
}

// ---------------------------------------------------------------------------
// CZESC D -- wiazanie w battleScene.ts
// ---------------------------------------------------------------------------
console.log('CZESC D -- wiazanie w battleScene.ts (mechanika trafia do gry)');
const scene = fs.readFileSync(SCENE_TS, 'utf8');

function fnBody(src, header) {
  const i = src.indexOf(header);
  if (i < 0) return '';
  // Od naglowka do konca ciala metody: licz nawiasy klamrowe.
  let depth = 0;
  let started = false;
  for (let j = i; j < src.length; j++) {
    const ch = src[j];
    if (ch === '{') { depth++; started = true; }
    else if (ch === '}') {
      depth--;
      if (started && depth === 0) return src.slice(i, j + 1);
    }
  }
  return src.slice(i);
}

check(
  /_counterBudget\s*=\s*new DefenderCounterBudget\(\)/.test(scene),
  'battleScene ma pole _counterBudget (DefenderCounterBudget)',
);

const beginTurnBody = fnBody(scene, 'private _beginTurn(): void {');
check(beginTurnBody.length > 0, '_beginTurn znaleziony');
check(
  /this\._counterBudget\.beginTurn\(\)/.test(beginTurnBody),
  '_beginTurn resetuje budzet kontratakow (beginTurn)',
);

const defCountersBody = fnBody(
  scene,
  'private _defenderCounters(defender: RuntimeBattleUnit, _attacker: RuntimeBattleUnit): boolean {',
);
check(defCountersBody.length > 0, '_defenderCounters znaleziony');
check(
  /if \(!this\._counterBudget\.canCounter\(defender\.bu\.id\)\) return false;/.test(defCountersBody),
  '_defenderCounters pyta budzet o kontratak (canCounter)',
);
// BEZ WYJATKU: zadna sciezka fortyfikacji/miasta nie omija budzetu.
for (const flaga of ['fortifiedInField', 'onWallWalkway', 'isCityDefenseBattle']) {
  check(
    !defCountersBody.includes(flaga),
    '_defenderCounters nie czyta "' + flaga + '" (brak wyjatku dla fortyfikacji/miasta)',
  );
}

const meleeBody = fnBody(
  scene,
  'private _doMeleeAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {',
);
check(meleeBody.length > 0, '_doMeleeAttack znaleziony');
check(
  /this\._counterBudget\.consume\(defender\.bu\.id\)/.test(meleeBody),
  'oddany kontratak zuzywa budzet (consume) w _doMeleeAttack',
);

// ---------------------------------------------------------------------------
// CZESC E -- ANTY-SAMOOSZUKIWANIE: resolveCombat nietkniety
// ---------------------------------------------------------------------------
console.log('CZESC E -- wewnatrz JEDNEGO starcia kontratak dziala w KAZDEJ rundzie');
{
  const unit = (nazwa) => ({
    typNazwa: nazwa,
    counterTyp: nazwa,
    rola: 'Wrecz',
    meleeAttack: 10,
    meleeDefence: 10,
    weaponDamage: 6,
    armor: 4,
    piercing: 2,
    chargeBonus: 0,
    health: 200,
    'Prog dezercji (% health)': null,
    missileAttack: 0,
    'Zasieg ataku (hex)': null,
    'Ilosc pociskow': null,
    'Ruch w bitwie (heksy)': 4,
    'Kara obrony z flanki (%)': 50,
    'Kara obrony z tylu (%)': 80,
  });
  // Deterministyczny LCG -- ten sam wynik przy kazdym uruchomieniu.
  let seed = 12345;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const res = combat.resolveCombat(unit('ATK'), unit('DEF'), { rng, maxRounds: 12 });
  const atkLines = res.log.filter((l) => /^R\d+\[(Szarza|Zwarcie)\] ATK /.test(l)).length;
  const defLines = res.log.filter((l) => /^R\d+\[(Szarza|Zwarcie)\] DEF /.test(l)).length;
  check(atkLines >= 2, 'pojedynek trwal wiecej niz jedna runde wrecz (rundy=' + atkLines + ')');
  eq(defLines, atkLines, 'obronca kontratakuje w KAZDEJ rundzie tego samego starcia');
}

// ---------------------------------------------------------------------------
console.log('\nwalka-jeden-kontratak-test: ' + passed + '/' + (passed + failed));
if (failed > 0) process.exit(1);
