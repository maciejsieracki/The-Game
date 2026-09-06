'use strict';
/**
 * walka-morale-przewaga-mocy-test.cjs
 *
 * R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 GOAL 2 -- startowa kara morale slabszej
 * strony od stosunku MOCY (nie liczebnosci), MOC wazona BIEZACYM HP.
 *
 *   r = MOC silniejszej / MOC slabszej      (r <= 1 -> brak kary)
 *   spadek = min(sufit_proc, wspolczynnik_proc * log10(r))
 *
 * Co ten test sprawdza (funkcje sa REALNE, bundlowane esbuildem z
 * src/game/combat.ts -- nie kopia logiki w tescie):
 *   CZESC A -- tabela kalibracyjna wlasciciela (r = 1,5 / 2 / 3 / 5 / 10 /
 *     20 / 100), tolerancja +-0,2 p.p.; sufit 65%; r <= 1 -> spadek 0.
 *   CZESC B -- KRYTERIUM 4 / PULAPKA GOAL 2 pkt 5: moraleMax i fleeMorale
 *     slabszej strony pozostaja NIETKNIETE, a ulamek morale strony
 *     (suma biezacych / suma startowych, jak _armyMoraleRatio) startuje
 *     PONIZEJ 100%. Gdyby moraleMax spadalo razem z morale, ulamek wrocilby
 *     do 100% i ta czesc czerwieni.
 *   CZESC C -- KRYTERIUM 5 / wazenie HP: dwie armie o identycznych
 *     definicjach jednostek, jedna pobita do 10% HP -> stosunek mocy to
 *     odzwierciedla. Plus parytet: na pelnym HP hpWeightedFieldPower ===
 *     sumRosterFieldM (ta sama definicja MOCY co auto-bitwa mapy).
 *   CZESC D -- parametry mieszkaja w data/combat-params.json (jedna liczba do
 *     przestrojenia), nie jako magiczne wartosci w kodzie.
 *   CZESC E -- WIAZANIE w src/battle/battleScene.ts: kara liczona RAZ na
 *     starcie bitwy i NIGDY nie dotykajaca moraleMax/fleeMorale.
 *
 * Usage (z gra/): node tools/walka-morale-przewaga-mocy-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const COMBAT_TS = path.join(GRA_DIR, 'src/game/combat.ts');
const AUTOPOWER_TS = path.join(GRA_DIR, 'src/game/auto-battle-power.ts');
const SCENE_TS = path.join(GRA_DIR, 'src/battle/battleScene.ts');
const PARAMS_JSON = path.join(GRA_DIR, 'data/combat-params.json');
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
const BUNDLE_COMBAT = path.join(os.tmpdir(), `walka-morale-combat-bundle-${TMPDIR_RUN_ID}.cjs`);
const BUNDLE_POWER = path.join(os.tmpdir(), `walka-morale-power-bundle-${TMPDIR_RUN_ID}.cjs`);

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

function bundle(src, out) {
  try {
    execSync(
      '"' + ESBUILD_BIN + '" "' + src + '" --bundle --platform=node --format=cjs --outfile="' + out + '"',
      { stdio: 'pipe' },
    );
  } catch (e) {
    console.error('esbuild failed for', src, ':', e.message);
    process.exit(1);
  }
  return require(out);
}

const combat = bundle(COMBAT_TS, BUNDLE_COMBAT);
const power = bundle(AUTOPOWER_TS, BUNDLE_POWER);

console.log('walka-morale-przewaga-mocy-test.cjs\n');

for (const name of [
  'startingMoralePenaltyFrac',
  'loadStartingMoralePowerParams',
  'hpWeightedFieldPower',
  'powerAdvantage',
  'applyStartingMoralePenalty',
]) {
  if (typeof combat[name] !== 'function') {
    console.error('  FAIL: combat.ts nie eksportuje ' + name + ' (GOAL 2 niewdrozony)');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CZESC A -- tabela kalibracyjna wlasciciela
// ---------------------------------------------------------------------------
console.log('CZESC A -- tabela spadkow morale (tolerancja +-0,2 p.p.)');

// r -> spadek w PUNKTACH PROCENTOWYCH (00-dispatch.md GOAL 2)
const TABELA = [
  [1.5, 8.8],
  [2, 15.1],
  [3, 23.9],
  [5, 34.9],
  [10, 50.0],
  [20, 65.0], // 65,1% -> sufit 65,0%
  [100, 65.0], // sufit
];

for (const [r, oczekiwanePp] of TABELA) {
  const pp = combat.startingMoralePenaltyFrac(r) * 100;
  const delta = Math.abs(pp - oczekiwanePp);
  check(
    delta <= 0.2,
    'r=' + r + ' -> spadek ' + pp.toFixed(2) + ' p.p. (oczekiwane ' + oczekiwanePp + ')',
    'roznica ' + delta.toFixed(3) + ' p.p. > 0,2',
  );
  // Morale startowe przy bazie 100 (kolumna trzecia tabeli z dispatchu).
  const moraleStart = Math.round(100 * (1 - combat.startingMoralePenaltyFrac(r)));
  check(
    Number.isFinite(moraleStart) && moraleStart >= 0 && moraleStart <= 100,
    'r=' + r + ' -> morale startowe (baza 100) = ' + moraleStart,
  );
}

console.log('CZESC A2 -- sufit i brak kary przy r <= 1');
check(combat.startingMoralePenaltyFrac(1000000) <= 0.65 + 1e-9, 'sufit 65% trzyma przy r=1e6');
check(
  Math.abs(combat.startingMoralePenaltyFrac(1000000) - 0.65) < 1e-9,
  'sufit 65% jest OSIAGANY (r=1e6 -> dokladnie 0,65)',
);
for (const r of [1, 0.5, 0.01, 0]) {
  eq(combat.startingMoralePenaltyFrac(r), 0, 'r=' + r + ' (<=1) -> spadek 0');
}
eq(combat.startingMoralePenaltyFrac(Infinity), 0, 'r=Infinity -> spadek 0 (brak dzielenia przez zero)');

// ---------------------------------------------------------------------------
// CZESC B -- KRYTERIUM 4: pulapka z GOAL 2 punkt 5
// ---------------------------------------------------------------------------
console.log('CZESC B -- KRYTERIUM 4: moraleMax / fleeMorale NIETKNIETE');
{
  const mk = (side, id) => ({ id, side, morale: 100, moraleMax: 100, fleeMorale: 30 });
  const units = [mk('atk', 'A1'), mk('atk', 'A2'), mk('def', 'D1'), mk('def', 'D2')];

  // Slabsza strona: def (r = 10 -> spadek 50%).
  const frac = combat.startingMoralePenaltyFrac(10);
  const n = combat.applyStartingMoralePenalty(units, 'def', frac);
  eq(n, 2, 'kara objela dokladnie 2 jednostki slabszej strony');

  const def = units.filter((u) => u.side === 'def');
  const atk = units.filter((u) => u.side === 'atk');

  for (const u of def) {
    eq(u.moraleMax, 100, u.id + ': moraleMax NIETKNIETE (100)');
    eq(u.fleeMorale, 30, u.id + ': fleeMorale NIETKNIETE (30)');
    eq(u.morale, 50, u.id + ': biezaca pula morale obnizona do 50');
  }
  // Punkt 4: zadnej premii dla silniejszego -- silniejsza strona nietknieta.
  for (const u of atk) {
    eq(u.morale, 100, u.id + ': silniejsza strona BEZ premii (morale 100)');
    eq(u.moraleMax, 100, u.id + ': silniejsza strona moraleMax 100');
  }

  // Ulamek morale strony jak battleScene._armyMoraleRatio.
  const ratio = (arr) => {
    let cur = 0;
    let start = 0;
    for (const u of arr) {
      cur += u.morale;
      start += u.moraleMax;
    }
    return start > 0 ? cur / start : 1;
  };
  const rDef = ratio(def);
  check(rDef < 1, 'ulamek morale slabszej strony startuje PONIZEJ 100% (' + (rDef * 100).toFixed(1) + '%)');
  check(Math.abs(rDef - 0.5) < 1e-9, 'ulamek morale slabszej strony = 50% przy r=10');
  eq(ratio(atk), 1, 'ulamek morale silniejszej strony nadal 100%');
}
console.log('CZESC B2 -- brak slabszej strony / brak kary');
{
  const units = [
    { side: 'atk', morale: 100, moraleMax: 100, fleeMorale: 30 },
    { side: 'def', morale: 100, moraleMax: 100, fleeMorale: 30 },
  ];
  eq(combat.applyStartingMoralePenalty(units, null, 0.5), 0, 'weakerSide=null -> nikt nie dostaje kary');
  eq(combat.applyStartingMoralePenalty(units, 'def', 0), 0, 'frac=0 -> nikt nie dostaje kary');
  eq(units[1].morale, 100, 'morale nietkniete gdy brak kary');
}

// ---------------------------------------------------------------------------
// CZESC C -- KRYTERIUM 5: MOC wazona biezacym HP
// ---------------------------------------------------------------------------
console.log('CZESC C -- KRYTERIUM 5: wazenie biezacym HP');
{
  // Ta sama definicja jednostki po obu stronach -- rozni je WYLACZNIE HP.
  const def = {
    meleeAttack: 10,
    meleeDefence: 8,
    weaponDamage: 6,
    piercing: 2,
    armor: 4,
    chargeBonus: 0,
    health: 100,
    missileAttack: 0,
    'Rola (linia)': 'Wrecz',
  };
  const roster = (hpFrac, n) =>
    Array.from({ length: n }, (_, i) => ({
      typeId: 'Miecznik',
      def,
      hp: Math.round(100 * hpFrac),
      maxHp: 100,
    }));

  const swieza = combat.hpWeightedFieldPower(roster(1, 10));
  const pobita = combat.hpWeightedFieldPower(roster(0.1, 10));
  check(swieza > 0, 'moc swiezej armii > 0 (' + swieza + ')');
  check(
    Math.abs(pobita / swieza - 0.1) < 0.02,
    'armia pobita do 10% HP ma ~10% mocy swiezej (' + pobita + ' / ' + swieza + ')',
  );

  const adv = combat.powerAdvantage(swieza, pobita);
  eq(adv.weakerSide, 'def', 'slabsza strona = pobita do 10% HP');
  check(Math.abs(adv.ratio - 10) < 0.25, 'stosunek mocy ~10 (' + adv.ratio.toFixed(2) + ')');
  check(
    Math.abs(combat.startingMoralePenaltyFrac(adv.ratio) * 100 - 50) < 1.5,
    'kara morale dla armii pobitej do 10% HP ~50 p.p.',
  );

  // Bez wazenia HP obie armie mialyby TE SAMA moc -> r=1 -> brak kary.
  const bezWazenia = combat.powerAdvantage(swieza, swieza);
  eq(bezWazenia.weakerSide, null, 'bez wazenia HP stosunek = 1 (dowod, ze wazenie robi robote)');

  // PARYTET z definicja MOCY auto-bitwy: na pelnym HP ta sama liczba.
  const rosterFull = roster(1, 10);
  const canon = power.sumRosterFieldM(rosterFull.map((u) => ({ typeId: u.typeId, def: u.def })));
  eq(swieza, canon, 'na pelnym HP hpWeightedFieldPower === sumRosterFieldM (jedna definicja MOCY)');

  // Kryterium to MOC, nie liczebnosc: 20 slabych vs 4 silne.
  const slaby = { ...def, meleeAttack: 3, meleeDefence: 3, weaponDamage: 2, piercing: 0, armor: 1, health: 40 };
  const silny = { ...def, meleeAttack: 20, meleeDefence: 20, weaponDamage: 14, piercing: 6, armor: 10, health: 160 };
  const mSlabi = combat.hpWeightedFieldPower(
    Array.from({ length: 20 }, () => ({ typeId: 'Wojownik', def: slaby, hp: 40, maxHp: 40 })),
  );
  const mSilni = combat.hpWeightedFieldPower(
    Array.from({ length: 4 }, () => ({ typeId: 'Falanga', def: silny, hp: 160, maxHp: 160 })),
  );
  check(
    combat.powerAdvantage(mSlabi, mSilni).ratio < 2,
    '20 slabych vs 4 silne: stosunek MOCY zostaje niski (' +
      combat.powerAdvantage(mSlabi, mSilni).ratio.toFixed(2) +
      '), nie 5 jak liczebnosc',
  );

  // Jednostki oblezniczne i wykluczone nie wchodza do MOCY (filtr auto-bitwy).
  const oblez = { ...def, 'Rola (linia)': 'Oblężnicza' };
  eq(
    combat.hpWeightedFieldPower([{ typeId: 'Taran', def: oblez, hp: 100, maxHp: 100 }]),
    0,
    'jednostka oblezniczna nie wnosi MOCY (filtr jak w sumRosterFieldM)',
  );
  eq(
    combat.hpWeightedFieldPower([{ typeId: 'Zwiadowca', def, hp: 100, maxHp: 100 }]),
    0,
    'Zwiadowca nie wnosi MOCY (filtr jak w sumRosterFieldM)',
  );
  eq(
    combat.hpWeightedFieldPower([{ typeId: 'Miecznik', def, hp: 0, maxHp: 100 }]),
    0,
    'jednostka na 0 HP nie wnosi MOCY',
  );
}

// ---------------------------------------------------------------------------
// CZESC D -- parametry w data/combat-params.json
// ---------------------------------------------------------------------------
console.log('CZESC D -- parametry w data/combat-params.json');
{
  const raw = JSON.parse(fs.readFileSync(PARAMS_JSON, 'utf8'));
  const m = raw.morale_przewaga_mocy;
  check(!!m, 'combat-params.json ma sekcje morale_przewaga_mocy');
  if (m) {
    eq(m.wspolczynnik_proc, 50, 'wspolczynnik_proc = 50');
    eq(m.sufit_proc, 65, 'sufit_proc = 65');
  }
  const p = combat.loadStartingMoralePowerParams();
  eq(p.wspolczynnikProc, 50, 'loadStartingMoralePowerParams -> wspolczynnikProc 50');
  eq(p.sufitProc, 65, 'loadStartingMoralePowerParams -> sufitProc 65');

  // Parametr jest FAKTYCZNIE czytany (przestrojenie zmienia wynik), nie jest
  // magiczna wartoscia zaszyta w wyrazeniu.
  const przestrojone = combat.startingMoralePenaltyFrac(10, { wspolczynnikProc: 20, sufitProc: 65 });
  check(Math.abs(przestrojone - 0.2) < 1e-9, 'przestrojenie wspolczynnika na 20% zmienia wynik (r=10 -> 20%)');
  const sufitInny = combat.startingMoralePenaltyFrac(100, { wspolczynnikProc: 50, sufitProc: 40 });
  check(Math.abs(sufitInny - 0.4) < 1e-9, 'przestrojenie sufitu na 40% zmienia wynik');

  // ZAKAZ z dispatchu: te liczby NIE trafiaja do auto-battle-params.json.
  const auto = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data/auto-battle-params.json'), 'utf8'));
  check(
    !JSON.stringify(auto).includes('morale'),
    'auto-battle-params.json (wezel W1) nie zawiera parametrow morale',
  );
}

// ---------------------------------------------------------------------------
// CZESC E -- wiazanie w battleScene.ts
// ---------------------------------------------------------------------------
console.log('CZESC E -- wiazanie w battleScene.ts');
{
  const scene = fs.readFileSync(SCENE_TS, 'utf8');
  check(
    /this\._applyStartingMoralePowerPenalty\(\);/.test(scene),
    'battleScene wola _applyStartingMoralePowerPenalty()',
  );
  const i = scene.indexOf('private _startBattle(): void {');
  const j = scene.indexOf('this._applyStartingMoralePowerPenalty();');
  check(i >= 0 && j > i, 'wywolanie stoi w _startBattle (start bitwy, nie co runde)');

  // Liczone RAZ -- jednorazowa flaga.
  const start = scene.indexOf('private _applyStartingMoralePowerPenalty(): void {');
  check(start >= 0, 'metoda _applyStartingMoralePowerPenalty istnieje');
  let depth = 0;
  let end = start;
  for (let k = start; k < scene.length && start >= 0; k++) {
    if (scene[k] === '{') depth++;
    else if (scene[k] === '}') {
      depth--;
      if (depth === 0) { end = k + 1; break; }
    }
  }
  const body = start >= 0 ? scene.slice(start, end) : '';
  check(
    /if \(this\._startMoralePenaltyApplied\) return;/.test(body),
    'kara liczona RAZ (guard _startMoralePenaltyApplied) -- brak spirali smierci',
  );
  check(/hpWeightedFieldPower\(/.test(body), 'MOC liczona z wazeniem biezacym HP');
  check(/startingMoralePenaltyFrac\(/.test(body), 'spadek liczony kanoniczna formula');
  // KRYTERIUM 4 raz jeszcze, na poziomie zrodla: nigdzie w tej sciezce nie ma
  // przypisania do moraleMax ani fleeMorale.
  check(!/\.moraleMax\s*=/.test(body), 'metoda NIE przypisuje do moraleMax');
  check(!/\.fleeMorale\s*=/.test(body), 'metoda NIE przypisuje do fleeMorale');

  const combatSrc = fs.readFileSync(COMBAT_TS, 'utf8');
  const s2 = combatSrc.indexOf('export function applyStartingMoralePenalty');
  const body2 = s2 >= 0 ? combatSrc.slice(s2, s2 + 1200) : '';
  check(s2 >= 0, 'applyStartingMoralePenalty znaleziona w combat.ts');
  check(!/u\.moraleMax\s*=/.test(body2), 'applyStartingMoralePenalty NIE przypisuje do moraleMax');
  check(!/u\.fleeMorale\s*=/.test(body2), 'applyStartingMoralePenalty NIE przypisuje do fleeMorale');
}

// ---------------------------------------------------------------------------
// CZESC F -- "Rozegraj ponownie": kara startowa musi WROCIC w powtorce.
// Flaga _startMoralePenaltyApplied jest jednorazowa NA BITWE, nie na instancje
// sceny. _replayBattle() to nowa bitwa: _placeUnits(klony) nadaje swieze
// morale/moraleMax = moraleBaseFor(bu). Bez resetu flagi w
// _resetBattleRuntimeState() guard wycina kare i slabsza strona startuje w
// powtorce z ulamkiem morale 100% -- czyli dokladnie stan, ktory KRYTERIUM 4
// uznaje za niedomkniecie tematu, tylko innym wejsciem.
// ---------------------------------------------------------------------------
console.log('CZESC F -- reset kary na "Rozegraj ponownie"');
{
  const scene = fs.readFileSync(SCENE_TS, 'utf8');

  const bodyOf = (sig) => {
    const s = scene.indexOf(sig);
    if (s < 0) return '';
    let depth = 0;
    for (let k = s; k < scene.length; k++) {
      if (scene[k] === '{') depth++;
      else if (scene[k] === '}') {
        depth--;
        if (depth === 0) return scene.slice(s, k + 1);
      }
    }
    return '';
  };

  const resetBody = bodyOf('private _resetBattleRuntimeState(): void {');
  check(resetBody.length > 0, '_resetBattleRuntimeState istnieje');
  check(
    /this\._startMoralePenaltyApplied\s*=\s*false;/.test(resetBody),
    '_resetBattleRuntimeState zeruje _startMoralePenaltyApplied (kara wraca w powtorce)',
  );

  const replayBody = bodyOf('private _replayBattle(): void {');
  check(replayBody.length > 0, '_replayBattle istnieje');
  check(
    /this\._resetBattleRuntimeState\(\);/.test(replayBody),
    '_replayBattle przechodzi przez _resetBattleRuntimeState (sciezka resetu flagi)',
  );
  check(
    /this\._startBattle\(\);/.test(replayBody),
    '_replayBattle wola _startBattle (a wiec i _applyStartingMoralePowerPenalty)',
  );

  // Symulacja sekwencji: bitwa -> powtorka. Guard + reset odtworzone 1:1 ze
  // zrodla; kara musi zadzialac DWA razy, nie raz.
  const resetuje = /this\._startMoralePenaltyApplied\s*=\s*false;/.test(resetBody);
  let flaga = false;
  const rozegrajBitwe = () => {
    // _placeUnits(klony): swieze morale = moraleBase
    const u = { side: 'def', morale: 100, moraleMax: 100, fleeMorale: 30 };
    if (!flaga) {
      flaga = true;
      const frac = combat.startingMoralePenaltyFrac(10);
      combat.applyStartingMoralePenalty([u], 'def', frac);
    }
    return u.morale / u.moraleMax;
  };
  const pierwsza = rozegrajBitwe();
  if (resetuje) flaga = false; // _resetBattleRuntimeState()
  const powtorka = rozegrajBitwe();

  check(Math.abs(pierwsza - 0.5) < 0.01, 'bitwa 1: ulamek morale slabszej strony 50%');
  eq(powtorka, pierwsza, 'powtorka ("Rozegraj ponownie") daje TEN SAM ulamek co bitwa 1');
  check(powtorka < 1, 'powtorka: ulamek morale slabszej strony NIZSZY niz 100%');
}

// ---------------------------------------------------------------------------
// CZESC G -- R2-1 KRYTERIUM 1: KLAMP DOLNY DO PROGU UCIECZKI, na WSZYSTKICH
// rekordach z morale w data/units.json (nie na probce -- probka jest dokladnie
// tym, co przepuscilo ten problem za pierwszym razem).
//
// Prog ucieczki to `morale <= fleeMorale`, wiec ROWNOSC juz oznacza rout:
// asercja jest na OSTRA nierownosc morale_startowe > fleeMorale.
// ---------------------------------------------------------------------------
console.log('CZESC G -- R2-1 KRYT.1: klamp dolny, WSZYSTKIE rekordy units.json');
{
  const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
  const rows = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
  check(Array.isArray(rows), 'units.json to tablica rekordow');

  const num = (v) => {
    const x = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(x) ? x : null;
  };
  // Te same klampy co battleScene moraleBaseFor / fleeMoraleFor (bez weterana:
  // weteran podnosi morale bazowe i OBNIZA prog ucieczki, wiec wariant bez
  // weterana jest najtrudniejszy dla tej asercji).
  const rekordy = [];
  for (const r of rows) {
    const mb = num(r['Morale bazowe']);
    const fm = num(r['Morale ucieczki']);
    if (mb === null || fm === null) continue;
    rekordy.push({
      nazwa: String(r['Jednostka'] ?? '?'),
      mb: Math.max(10, Math.min(300, mb)),
      fm: Math.max(0, Math.min(295, fm)),
    });
  }
  eq(rekordy.length, 71, 'units.json ma 71 rekordow z morale bazowym i progiem ucieczki');

  // Kara SUFITOWA (65%) -- najgorszy mozliwy przypadek dla klampu.
  const fracSufit = combat.startingMoralePenaltyFrac(1e9);
  check(Math.abs(fracSufit - 0.65) < 1e-9, 'przypadek testowy uzywa kary sufitowej 65%');

  let zle = [];
  let dotkniete = [];
  for (const rec of rekordy) {
    const u = { side: 'def', morale: rec.mb, moraleMax: rec.mb, fleeMorale: rec.fm };
    const przedKlampem = Math.round(rec.mb * (1 - fracSufit));
    combat.applyStartingMoralePenalty([u], 'def', fracSufit);
    if (!(u.morale > rec.fm)) zle.push(rec.nazwa + ' (mb=' + rec.mb + '/fm=' + rec.fm + ' -> ' + u.morale + ')');
    if (przedKlampem <= rec.fm) dotkniete.push(rec);
    // KRYTERIUM 4 nadal: klamp nie dotyka moraleMax ani fleeMorale.
    if (u.moraleMax !== rec.mb || u.fleeMorale !== rec.fm) {
      zle.push(rec.nazwa + ': klamp ruszyl moraleMax/fleeMorale');
    }
  }
  check(
    zle.length === 0,
    'wszystkie 71 rekordow: morale startowe OSTRO wieksze od fleeMorale przy karze 65%',
    zle.length ? 'lamia to: ' + zle.join('; ') : '',
  );
  check(dotkniete.length > 0, 'klamp jest FAKTYCZNIE potrzebny (rekordy schodzace na prog istnieja): ' + dotkniete.length);
}

// ---------------------------------------------------------------------------
// CZESC H -- R2-1 KRYTERIUM 2: cztery rekordy z ratyfikacji, wartosc PRZED
// klampem i PO -- zeby regres byl czytelny w logu bramki.
// ---------------------------------------------------------------------------
console.log('CZESC H -- R2-1 KRYT.2: cztery rekordy graniczne (przed klampem / po)');
{
  const fracSufit = combat.startingMoralePenaltyFrac(1e9); // 0,65
  const eps = combat.loadStartingMoralePowerParams().epsilonPonadFlee;
  // [morale bazowe, fleeMorale] -- z ratyfikacji orkiestratora (00-dispatch.md)
  const GRANICZNE = [
    [50, 22],
    [40, 25],
    [30, 25],
    [60, 22],
  ];
  for (const [mb, fm] of GRANICZNE) {
    const przed = Math.round(mb * (1 - fracSufit));
    const u = { side: 'def', morale: mb, moraleMax: mb, fleeMorale: fm };
    combat.applyStartingMoralePenalty([u], 'def', fracSufit);
    check(
      przed <= fm,
      'mb=' + mb + '/fm=' + fm + ': PRZED klampem ' + przed + ' <= progu ' + fm + ' (rout przed pierwszym ciosem)',
    );
    eq(u.morale, fm + eps, 'mb=' + mb + '/fm=' + fm + ': PO klampie morale = ' + (fm + eps) + ' (prog + epsilon)');
    check(u.morale > fm, 'mb=' + mb + '/fm=' + fm + ': PO klampie OSTRO powyzej progu (' + przed + ' -> ' + u.morale + ')');
    eq(u.moraleMax, mb, 'mb=' + mb + '/fm=' + fm + ': moraleMax NIETKNIETE');
    eq(u.fleeMorale, fm, 'mb=' + mb + '/fm=' + fm + ': fleeMorale NIETKNIETE');
  }
}

// ---------------------------------------------------------------------------
// CZESC I -- R2-1 KRYTERIUM 3: klamp NIE zmienia wyniku tam, gdzie nie jest
// potrzebny. Dla r = 1,5 / 2 / 3 / 5 / 10 tabela z GOAL 2 odtwarza sie
// BEZ ZMIAN dla jednostki o typowym progu ucieczki.
// ---------------------------------------------------------------------------
console.log('CZESC I -- R2-1 KRYT.3: tabela GOAL 2 odtworzona bez zmian');
{
  // Typowy prog ucieczki wg units.json (mediana pola 'Morale ucieczki').
  const TYPOWY_FLEE = 22;
  const TABELA_R2 = [
    [1.5, 91],
    [2, 85],
    [3, 76],
    [5, 65],
    [10, 50],
  ];
  for (const [r, oczekiwane] of TABELA_R2) {
    const frac = combat.startingMoralePenaltyFrac(r);
    const bezKlampu = Math.round(100 * (1 - frac));
    const u = { side: 'def', morale: 100, moraleMax: 100, fleeMorale: TYPOWY_FLEE };
    combat.applyStartingMoralePenalty([u], 'def', frac);
    eq(bezKlampu, oczekiwane, 'r=' + r + ': wartosc tabelaryczna (baza 100) = ' + oczekiwane);
    eq(u.morale, oczekiwane, 'r=' + r + ': PO klampie bez zmian = ' + oczekiwane + ' (klamp nieaktywny)');
    check(u.morale > TYPOWY_FLEE, 'r=' + r + ': ' + u.morale + ' > progu ' + TYPOWY_FLEE);
  }
  // Klamp nigdy nie PODNOSI morale ponad wartosc wejsciowa.
  {
    const u = { side: 'def', morale: 5, moraleMax: 100, fleeMorale: 30 };
    combat.applyStartingMoralePenalty([u], 'def', 0.5);
    check(u.morale <= 5, 'klamp nie PODNOSI morale jednostki juz ponizej progu (5 -> ' + u.morale + ')');
  }
  // Epsilon jest FAKTYCZNIE czytany z parametrow, nie zaszyty w wyrazeniu.
  {
    const u = { side: 'def', morale: 50, moraleMax: 50, fleeMorale: 22 };
    combat.applyStartingMoralePenalty([u], 'def', 0.65, {
      wspolczynnikProc: 50,
      sufitProc: 65,
      epsilonPonadFlee: 7,
    });
    eq(u.morale, 29, 'przestrojenie epsilon na 7 zmienia podloge (22+7=29)');
  }
  // CZESC D uzupelnienie: parametr mieszka w data/combat-params.json.
  {
    const raw = JSON.parse(fs.readFileSync(PARAMS_JSON, 'utf8'));
    eq(raw.morale_przewaga_mocy && raw.morale_przewaga_mocy.epsilon_ponad_flee, 1,
      'combat-params.json: epsilon_ponad_flee = 1 (jedna liczba do przestrojenia)');
    eq(combat.loadStartingMoralePowerParams().epsilonPonadFlee, 1,
      'loadStartingMoralePowerParams -> epsilonPonadFlee 1');
  }
  // Klamp musi byc w applyStartingMoralePenalty, nie obok -- i nadal bez
  // przypisan do moraleMax/fleeMorale (KRYTERIUM 4 rundy 1).
  {
    const combatSrc = fs.readFileSync(COMBAT_TS, 'utf8');
    const s2 = combatSrc.indexOf('export function applyStartingMoralePenalty');
    const body2 = s2 >= 0 ? combatSrc.slice(s2, s2 + 1600) : '';
    check(/fleeMorale/.test(body2), 'applyStartingMoralePenalty CZYTA fleeMorale (klamp dolny)');
    check(!/u\.moraleMax\s*=/.test(body2), 'klamp NIE przypisuje do moraleMax');
    check(!/u\.fleeMorale\s*=/.test(body2), 'klamp NIE przypisuje do fleeMorale');
  }
}

// ---------------------------------------------------------------------------
console.log('\nwalka-morale-przewaga-mocy-test: ' + passed + '/' + (passed + failed));
if (failed > 0) process.exit(1);
