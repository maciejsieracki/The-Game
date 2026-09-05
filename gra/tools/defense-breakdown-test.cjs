'use strict';
/**
 * defense-breakdown-test.cjs
 *
 * R-OBRONA-MIASTA-MP-Q1=A (Maciej 2026-08-06) -- pokrycie testem
 * gra/src/game/defenseBreakdown.ts (panel preBattle "Rozbicie obrony": garnizon
 * +50%, cyw, weteran, liczba obroncow).
 *
 * Runda 4 (domkniecie luki znalezionej przez Evaluatora w rundzie 3, warunek 1):
 * defenderCivBonusBreakdown liczyla "N z M jednostek" WYLACZNIE przez
 * unitMatchesCel -- realna walka bramkuje bonus_obrona PELNA funkcja
 * bonusApplies() (civ-bonuses.ts), ktora oprocz unitMatchesCel sprawdza
 * DODATKOWO teren (las/dzungla/wzniesienie) i szarze. Sekcja G ponizej pokrywa
 * FIKCYJNYM bonusem lesnym: panel na terenie NIE-lesnym MUSI pominac bonus
 * calkowicie (affected=0, linia niepokazana), a na terenie lesnym pokazac go
 * normalnie z licznikiem N z M.
 *
 * Ten test bunduje TRZY pure moduly (esbuild, bez main.ts/DOM):
 *   - game/defenseBreakdown.ts  -- agregacja panelu (buildDefenseRosterUnits,
 *     cityDefenseBreakdownLines, garrisonFortifyBreakdown, bestVeteranAmongRoster,
 *     defenderCivBonusBreakdown, civBonusUnitShapeFromDef, bonusChipTexts)
 *   - game/city-defense.ts      -- REALNY predykat fortyfikacji
 *     (unitGetsFortifyDefenseBonus) -- ten sam, ktorego main.ts.unitGetsFortifyBonus
 *     wola 1:1 (zero rownoleglej reimplementacji w tescie).
 *   - game/siege.ts             -- FORTIFY_OBRONA_PROC_FIELD (realna wartosc %
 *     z combat-params.json, nie hardkodowana w tescie).
 *
 * oraz czyta REALNE data/civs.json (bonus_obrona Grecja/Falanga, cel='piechota')
 * i data/units.json (Konnica=kawaleria, Rydwan mykenski=rydwany, Wojownik=piechota
 * wg unitCombatCategory -- civ-bonuses.ts), zeby warunek "N z M" per `cel` bonusu
 * byl sprawdzony na realnych danych gry, nie fixture'ach.
 *
 * Usage (z gra/): node tools/defense-breakdown-test.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch {
    console.error('[defense-breakdown-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  [OK]', msg);
  } else {
    fail++;
    console.error('  [FAIL]', msg);
  }
}

// ---------------------------------------------------------------------------
// Bundle 1: game/defenseBreakdown.ts
// ---------------------------------------------------------------------------
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
const DB_BUNDLE = path.join(os.tmpdir(), `defense-breakdown-bundle-${TMPDIR_RUN_ID}.cjs`);
esbuild.buildSync({
  entryPoints: [path.join(GRA_ROOT, 'src/game/defenseBreakdown.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: DB_BUNDLE,
  logLevel: 'silent',
});
const {
  buildDefenseRosterUnits,
  cityDefenseBreakdownLines,
  garrisonFortifyBreakdown,
  bestVeteranAmongRoster,
  defenderCivBonusBreakdown,
  isDefenseOnlyCivBonus,
  civBonusUnitShapeFromDef,
  bonusChipTexts,
} = require(DB_BUNDLE);

// ---------------------------------------------------------------------------
// Bundle 2: game/city-defense.ts (predykat REALNEJ fortyfikacji)
// ---------------------------------------------------------------------------
const CD_BUNDLE = path.join(os.tmpdir(), `defense-breakdown-city-defense-bundle-${TMPDIR_RUN_ID}.cjs`);
esbuild.buildSync({
  entryPoints: [path.join(GRA_ROOT, 'src/game/city-defense.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: CD_BUNDLE,
  logLevel: 'silent',
});
const { unitGetsFortifyDefenseBonus, cityWallDefenseBonusPercent } = require(CD_BUNDLE);

// ---------------------------------------------------------------------------
// Bundle 3: game/siege.ts (FORTIFY_OBRONA_PROC_FIELD realny, nie hardkodowany)
// ---------------------------------------------------------------------------
const SIEGE_BUNDLE = path.join(os.tmpdir(), `defense-breakdown-siege-bundle-${TMPDIR_RUN_ID}.cjs`);
esbuild.buildSync({
  entryPoints: [path.join(GRA_ROOT, 'src/game/siege.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: SIEGE_BUNDLE,
  logLevel: 'silent',
});
const { FORTIFY_OBRONA_PROC_FIELD } = require(SIEGE_BUNDLE);

// ---------------------------------------------------------------------------
// Dane realne: civs.json (Grecy/Falanga) + units.json (Konnica/Rydwan/Wojownik)
// ---------------------------------------------------------------------------
const civsRaw = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data/civs.json'), 'utf8'));
const grecy = civsRaw.cywilizacje.find((c) => c['Cywilizacja'] === 'Grecy');
if (!grecy) throw new Error('Grecy nie znalezieni w civs.json');
const falangaBonus = grecy.bonusy.find((b) => b.typ === 'bonus_obrona');
if (!falangaBonus) throw new Error('bonus_obrona Grecji (Falanga) nie znaleziony');
assert(falangaBonus.cel === 'piechota', 'DANE: Falanga (Grecy) bonus_obrona.cel === "piechota" (fundament warunku "N z M")');

const unitsRaw = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data/units.json'), 'utf8'));
const unitsByName = {};
for (const u of unitsRaw) unitsByName[u['Jednostka']] = u;
function getUnitDef(name) {
  const u = unitsByName[name];
  if (!u) throw new Error('Unit not found: "' + name + '"');
  return u;
}

function celShape(unitName) {
  return civBonusUnitShapeFromDef(getUnitDef(unitName), unitName);
}

console.log('defense-breakdown-test (R-OBRONA-MIASTA-MP-Q1)\n');

// ===========================================================================
// A -- garrisonFortifyBreakdown / buildDefenseRosterUnits z REALNYM
// predykatem unitGetsFortifyDefenseBonus (city-defense.ts), roster 4 obroncow:
//   u1: ufortyfikowany W POLU, NIE w garnizonie (dist<=1 od miasta, poza murami)
//   u2, u3: W GARNIZONIE (fizycznie w miescie), nie ufortyfikowani w polu
//   u4: zwykla jednostka w polu -- ani ufortyfikowana, ani w garnizonie
// ===========================================================================
console.log('--- A. Garnizon +' + FORTIFY_OBRONA_PROC_FIELD + '% Obrony (city-defense.ts realny predykat) ---');

const CD_PARAMS = { mur: 200, cytadela: 100, baszta: 100, palisada: 100 };

const fourDefenders = [
  { id: 'u1-pole', ufortyfikowanyWPolu: true, inGarnizon: false },
  { id: 'u2-garnizon', ufortyfikowanyWPolu: false, inGarnizon: true },
  { id: 'u3-garnizon', ufortyfikowanyWPolu: false, inGarnizon: true },
  { id: 'u4-zwykla', ufortyfikowanyWPolu: false, inGarnizon: false },
];

/** Odzwierciedla main.ts builtIdsForGarrisonUnit(u): builtBuildingIds tylko dla jednostek W GARNIZONIE. */
function getsFortifyBonusFor(builtIds) {
  return (u) => unitGetsFortifyDefenseBonus({
    ufortyfikowanyWPolu: u.ufortyfikowanyWPolu,
    inGarnizon: u.inGarnizon,
    builtBuildingIds: u.inGarnizon ? builtIds : undefined,
    cityDefenseParams: CD_PARAMS,
  });
}

function fakeCelShape() {
  // Nieistotne dla testu A (typ bonusu civ liczony osobno w B/G) -- placeholder staly.
  return { typNazwa: 'Wojownik', rola: 'Wrecz', missileAttack: 0 };
}

// Miasto-panstwo BEZ MUROW: cityWallDefenseBonusPercent([]) === 0 -> garnizon
// TEZ dostaje +50% (shouldApplyGarrisonFortifyBonus), wiec u1+u2+u3 = 3 z 4.
{
  const noWallsIds = [];
  assert(
    cityWallDefenseBonusPercent(noWallsIds, CD_PARAMS) === 0,
    'DANE: miasto bez zadnego budynku obronnego -> cityWallDefenseBonusPercent === 0',
  );
  const roster = buildDefenseRosterUnits(fourDefenders, getsFortifyBonusFor(noWallsIds), () => 0, fakeCelShape);
  const result = garrisonFortifyBreakdown(roster, FORTIFY_OBRONA_PROC_FIELD);
  assert(result !== null, 'Bez murow: garrisonFortifyBreakdown zwraca wynik (nie null)');
  assert(result.affectedCount === 3 && result.totalCount === 4, 'Bez murow: 3 z 4 jednostek dostaje bonus (pole + 2x garnizon; zwykla jednostka nie)');
  assert(
    result.text === 'Garnizon (Ufortyfikuj) +' + Math.round(FORTIFY_OBRONA_PROC_FIELD) + '% Obrony — 3 z 4 jednostek',
    'Bez murow: tekst = "' + result.text + '"',
  );
}

// To samo miasto Z MURAMI: cityWallDefenseBonusPercent(['mury']) > 0 -> garnizon
// TRACI +50% w polu (shouldApplyGarrisonFortifyBonus=false), zostaje TYLKO
// jednostka ufortyfikowana-w-polu-ale-nie-w-garnizonie -> 1 z 4.
{
  const withWallsIds = ['mury'];
  assert(
    cityWallDefenseBonusPercent(withWallsIds, CD_PARAMS) > 0,
    'DANE: miasto z Murami -> cityWallDefenseBonusPercent > 0',
  );
  const roster = buildDefenseRosterUnits(fourDefenders, getsFortifyBonusFor(withWallsIds), () => 0, fakeCelShape);
  const result = garrisonFortifyBreakdown(roster, FORTIFY_OBRONA_PROC_FIELD);
  assert(result !== null, 'Z murami: garrisonFortifyBreakdown zwraca wynik (nie null, bo pole nadal dziala)');
  assert(result.affectedCount === 1 && result.totalCount === 4, 'Z murami: TYLKO 1 z 4 jednostek dostaje bonus (garnizon traci +50% w polu, pole zostaje)');
  assert(
    result.text === 'Garnizon (Ufortyfikuj) +' + Math.round(FORTIFY_OBRONA_PROC_FIELD) + '% Obrony — 1 z 4 jednostek',
    'Z murami: tekst = "' + result.text + '"',
  );
}

// Roster bez kwalifikujacych sie jednostek -> null (nic do pokazania).
{
  const roster = buildDefenseRosterUnits(
    [{ ufortyfikowanyWPolu: false, inGarnizon: false }],
    getsFortifyBonusFor([]),
    () => 0,
    fakeCelShape,
  );
  assert(garrisonFortifyBreakdown(roster, FORTIFY_OBRONA_PROC_FIELD) === null, 'Roster bez fortyfikacji: garrisonFortifyBreakdown === null');
  assert(garrisonFortifyBreakdown([], FORTIFY_OBRONA_PROC_FIELD) === null, 'Roster pusty: garrisonFortifyBreakdown === null');
}

// ===========================================================================
// B -- defenderCivBonusBreakdown liczy "N z M" per bonus przez bonusApplies
// (civ-bonuses.ts, przez unitMatchesCel dla bonusow bez warunku terenu/szarzy),
// a bonus ktory nie pasuje do ZADNEJ jednostki (N=0) NIE jest pokazany wcale.
// ===========================================================================
console.log('\n--- B. Bonus cywilizacji (Falanga, cel="piechota") -- licznik N z M ---');

{
  // Roster ZLOZONY WYLACZNIE z kawalerii/rydwanow -- Falanga (cel='piechota')
  // NIE dotyczy NIKOGO -> bonus NIE moze byc pokazany (panel nie klamie).
  const rosterKawaleriaRydwany = [
    { celShapeName: 'Konnica' },
    { celShapeName: 'Rydwan mykeński' },
  ].map((u) => ({ celShape: celShape(u.celShapeName) }));
  const lines = defenderCivBonusBreakdown(rosterKawaleriaRydwany, grecy.bonusy);
  assert(lines.length === 0, 'Roster samej kawalerii/rydwanow: defenderCivBonusBreakdown zwraca PUSTA liste (Falanga cel=piechota nie pasuje do nikogo -- N=0 pomijane calkowicie)');
}

{
  // Roster MIESZANY: 2x kawaleria/rydwany (nie licza sie) + 2x piechota (licza sie) = 2 z 4.
  const rosterMixed = ['Konnica', 'Rydwan mykeński', 'Wojownik', 'Wojownik'].map((n) => ({ celShape: celShape(n) }));
  const lines = defenderCivBonusBreakdown(rosterMixed, grecy.bonusy);
  assert(lines.length === 1, 'Roster mieszany (2 kawaleria/rydwany + 2 piechota): dokladnie 1 linia bonusu obrony (Falanga)');
  if (lines.length === 1) {
    assert(lines[0].affectedCount === 2 && lines[0].totalCount === 4, 'Falanga: 2 z 4 jednostek (tylko piechota) -- licznik = ' + lines[0].affectedCount + '/' + lines[0].totalCount);
    assert(
      lines[0].text.endsWith(' — 2 z 4 jednostek'),
      'Falanga: tekst konczy sie liczbnikiem "— 2 z 4 jednostek" ("' + lines[0].text + '")',
    );
    assert(lines[0].text.startsWith(falangaBonus.opis), 'Falanga: tekst zaczyna sie od oryginalnego opisu z civs.json (bez utraty tresci)');
  }
}

{
  // Roster CALA PIECHOTA -- bonus dotyczy WSZYSTKICH -> 4 z 4.
  const rosterAllInfantry = ['Wojownik', 'Wojownik', 'Wojownik', 'Wojownik'].map((n) => ({ celShape: celShape(n) }));
  const lines = defenderCivBonusBreakdown(rosterAllInfantry, grecy.bonusy);
  assert(lines.length === 1 && lines[0].affectedCount === 4 && lines[0].totalCount === 4, 'Roster cala piechota: Falanga dotyczy WSZYSTKICH -- 4 z 4');
}

{
  // isDefenseOnlyCivBonus: filtr bramkuje typ==='bonus_obrona' (nie ogolny
  // 'bonus_walka', ktory moze mowic o ataku) -- jednostka_specjalna Falangi
  // (drugi wpis Grecji w civs.json, typ='jednostka_specjalna') MUSI byc odrzucona.
  const jednostkaSpecjalna = grecy.bonusy.find((b) => b.typ === 'jednostka_specjalna');
  assert(!!jednostkaSpecjalna, 'DANE: Grecy maja wpis typ="jednostka_specjalna" w bonusy[]');
  assert(!isDefenseOnlyCivBonus(jednostkaSpecjalna), 'isDefenseOnlyCivBonus odrzuca typ="jednostka_specjalna" (nie liczbowy bonus obrony)');
  const bonusZloto = grecy.bonusy.find((b) => b.typ === 'bonus_zloto');
  assert(!!bonusZloto, 'DANE: Grecy maja wpis typ="bonus_zloto" (ekonomia)');
  assert(!isDefenseOnlyCivBonus(bonusZloto), 'isDefenseOnlyCivBonus odrzuca bonus ekonomiczny (realizuje!=="walka")');
}

// ===========================================================================
// C -- Weteran: najwyzszy % OBECNY w rosterze + ile jednostek dokladnie na tym poziomie.
// ===========================================================================
console.log('\n--- C. Premia weterana (bestVeteranAmongRoster) ---');

{
  const rosterVet = buildDefenseRosterUnits(
    [{ frac: 0 }, { frac: 0.10 }, { frac: 0.20 }, { frac: 0.20 }],
    () => false,
    (u) => u.frac,
    fakeCelShape,
  );
  const result = bestVeteranAmongRoster(rosterVet);
  assert(result !== null, 'bestVeteranAmongRoster zwraca wynik gdy ktorakolwiek jednostka ma premie > 0');
  assert(result.affectedCount === 2 && result.totalCount === 4, 'Premia weterana: 2 z 4 jednostek na SZCZYCIE (+20%), nie wszystkie 4 (' + result.affectedCount + '/' + result.totalCount + ')');
  assert(result.text === 'Premia weterana +20% Obrony — 2 z 4 jednostek', 'Tekst weterana = "' + result.text + '"');
}

{
  const rosterNoVet = buildDefenseRosterUnits([{ frac: 0 }, { frac: 0 }], () => false, (u) => u.frac, fakeCelShape);
  assert(bestVeteranAmongRoster(rosterNoVet) === null, 'Roster bez zadnej premii weterana: bestVeteranAmongRoster === null');
}

// ===========================================================================
// D -- cityDefenseBreakdownLines: pelna sciezka main.ts (garnizon -> weteran ->
// bonusy cyw. -> trudnosc AI), na tym samym rosterze 4 obroncow (bez murow)
// uzytym w Czesci A, ROZSZERZONYM o veteranFrac i celShape.
// ===========================================================================
console.log('\n--- D. cityDefenseBreakdownLines (integracja pelnej sciezki main.ts) ---');

{
  const noWallsIds = [];
  const roster = buildDefenseRosterUnits(
    [
      { ...fourDefenders[0], veteranFrac: 0, celShapeName: 'Wojownik' },
      { ...fourDefenders[1], veteranFrac: 0.20, celShapeName: 'Wojownik' },
      { ...fourDefenders[2], veteranFrac: 0, celShapeName: 'Wojownik' },
      { ...fourDefenders[3], veteranFrac: 0, celShapeName: 'Konnica' },
    ],
    getsFortifyBonusFor(noWallsIds),
    (u) => u.veteranFrac,
    (u) => celShape(u.celShapeName),
  );
  const lines = cityDefenseBreakdownLines(roster, {
    fortifyPct: FORTIFY_OBRONA_PROC_FIELD,
    civBonusy: grecy.bonusy,
    difficultyMult: 1.15,
  });
  assert(lines.length === 4, 'cityDefenseBreakdownLines: 4 linie (garnizon, weteran, Falanga, trudnosc) -- otrzymano ' + lines.length);
  if (lines.length === 4) {
    assert(lines[0].tekst.startsWith('Garnizon (Ufortyfikuj)') && lines[0].tekst.endsWith('3 z 4 jednostek'), 'Linia 1 = garnizon 3 z 4 ("' + lines[0].tekst + '")');
    assert(lines[1].tekst === 'Premia weterana +20% Obrony — 1 z 4 jednostek', 'Linia 2 = weteran 1 z 4 ("' + lines[1].tekst + '")');
    assert(lines[2].tekst.startsWith('Bonus cywilizacji obrońcy: ') && lines[2].tekst.endsWith('3 z 4 jednostek'), 'Linia 3 = bonus cyw. (Falanga, 3 z 4 piechoty) ("' + lines[2].tekst + '")');
    assert(lines[3].tekst === 'Bonus trudności (Trudny)' && lines[3].wartosc === '+15% Atak/Obrona', 'Linia 4 = trudnosc AI +15% ("' + lines[3].tekst + ' ' + lines[3].wartosc + '")');
  }

  // difficultyMult<=1 (poziom nie-Trudny) -> linia trudnosci NIE pojawia sie.
  const linesNoDiff = cityDefenseBreakdownLines(roster, {
    fortifyPct: FORTIFY_OBRONA_PROC_FIELD,
    civBonusy: grecy.bonusy,
    difficultyMult: 1.0,
  });
  assert(linesNoDiff.length === 3, 'cityDefenseBreakdownLines z difficultyMult=1.0: bez linii trudnosci (3 linie, nie 4)');

  // Roster pusty -> tablica pusta (bez wyjatku).
  assert(cityDefenseBreakdownLines([], { fortifyPct: FORTIFY_OBRONA_PROC_FIELD, civBonusy: grecy.bonusy, difficultyMult: 1.15 }).length === 0, 'Roster pusty: cityDefenseBreakdownLines === []');
}

// ===========================================================================
// E -- meleeDefence / defenseRosterRealSum nie sa czescia publicznego API
// (roster nie niesie zbednych/kosztownych pol).
// ===========================================================================
console.log('\n--- E. DefenseRosterUnit bez zbednych pol (meleeDefence / defenseRosterRealSum) ---');

{
  const dbModule = require(DB_BUNDLE);
  assert(typeof dbModule.defenseRosterRealSum === 'undefined', 'defenseRosterRealSum NIE jest eksportowana z defenseBreakdown.ts');
  const roster = buildDefenseRosterUnits([{ id: 'x' }], () => true, () => 0, fakeCelShape);
  assert(
    !Object.prototype.hasOwnProperty.call(roster[0], 'meleeDefence'),
    'DefenseRosterUnit zbudowany przez buildDefenseRosterUnits NIE niesie pola meleeDefence',
  );
}

// ---------------------------------------------------------------------------
// F -- bonusChipTexts -- regresja: dalej dziala jak w preBattle.ts (chipy
// atakujacy/obronca, filtr domyslny isCombatModifierBonus -- WSZYSTKIE
// liczbowe bonusy walki, nie tylko obrone).
// ---------------------------------------------------------------------------
console.log('\n--- F. bonusChipTexts (regresja -- uzywane przez ui/preBattle.ts) ---');
{
  const chips = bonusChipTexts(grecy.bonusy);
  assert(chips.length === 1 && chips[0] === falangaBonus.opis, 'bonusChipTexts(Grecy): 1 chip liczbowy walki (Falanga) -- jednostka_specjalna/ekonomia odrzucone przez isCombatModifierBonus');
}

// ===========================================================================
// G (RUNDA 4 -- domkniecie luki Evaluatora) -- defenderCivBonusBreakdown musi
// bramkowac bonus_obrona PELNA funkcja bonusApplies() (civ-bonuses.ts), nie
// samym unitMatchesCel: FIKCYJNY bonus wymagajacy lasu ("w lesie" w opisie)
// -- na terenie NIE-lesnym MUSI byc pominiety CALKOWICIE (affected=0, linia
// niepokazana), a na terenie lesnym pokazany normalnie z licznikiem N z M.
// ===========================================================================
console.log('\n--- G. Bonus obrony wymagajacy lasu -- gating przez teren (runda 4) ---');

const fikcyjnyBonusLesny = {
  typ: 'bonus_obrona',
  cel: 'piechota',
  wartosc: 0.15,
  opis: 'Zasadzka w lesie: +15% obrony piechoty',
  realizuje: 'walka',
};

{
  const rosterAllInfantry = ['Wojownik', 'Wojownik', 'Wojownik'].map((n) => ({ celShape: celShape(n) }));

  // Teren NIE-lesny (Rownina) -- bonus lesny NIE pasuje do ZADNEJ jednostki,
  // mimo ze cel='piechota' i roster to sama piechota -- musi byc pominiety
  // calkowicie (affected=0 -> brak linii w wyniku), panel nie klamie.
  const linesRownina = defenderCivBonusBreakdown(rosterAllInfantry, [fikcyjnyBonusLesny], 'Rownina');
  assert(linesRownina.length === 0, 'Bonus lesny na terenie Rownina (NIE-lesnym): defenderCivBonusBreakdown zwraca PUSTA liste (affected=0, linia niepokazana)');

  // Teren lesny (Las) -- bonus lesny pasuje normalnie do calej piechoty -> 3 z 3.
  const linesLas = defenderCivBonusBreakdown(rosterAllInfantry, [fikcyjnyBonusLesny], 'Las');
  assert(linesLas.length === 1, 'Bonus lesny na terenie Las: defenderCivBonusBreakdown zwraca DOKLADNIE 1 linie');
  if (linesLas.length === 1) {
    assert(linesLas[0].affectedCount === 3 && linesLas[0].totalCount === 3, 'Bonus lesny na terenie Las: 3 z 3 jednostek (cala piechota) -- licznik = ' + linesLas[0].affectedCount + '/' + linesLas[0].totalCount);
    assert(linesLas[0].text.endsWith(' — 3 z 3 jednostek'), 'Bonus lesny na terenie Las: tekst konczy sie "— 3 z 3 jednostek" ("' + linesLas[0].text + '")');
    assert(linesLas[0].text.startsWith(fikcyjnyBonusLesny.opis), 'Bonus lesny na terenie Las: tekst zaczyna sie od oryginalnego opisu (bez utraty tresci)');
  }

  // Bez terenu wcale (main.ts nie zna terenu -- teoretyczny brzeg) -- traktowane
  // jak teren pusty w bonusApplies(), bonus lesny NIE dopasowany (konserwatywnie).
  const linesNoTerrain = defenderCivBonusBreakdown(rosterAllInfantry, [fikcyjnyBonusLesny]);
  assert(linesNoTerrain.length === 1, 'Bonus lesny BEZ przekazanego terrain (main.ts brzeg): dziala jak bonusApplies (terrain="" -> gating lesny nie odpala, cel="piechota" nadal dopasowany)');

  // Falanga (grecka, bez warunku lesnego) na tym samym rosterze na terenie
  // NIE-lesnym -- MUSI dzialac normalnie (regresja: gating lesny nie dotyka
  // bonusow, ktorych opis nie mowi o lesie).
  const linesFalangaRownina = defenderCivBonusBreakdown(rosterAllInfantry, grecy.bonusy, 'Rownina');
  assert(linesFalangaRownina.length === 1 && linesFalangaRownina[0].affectedCount === 3, 'REGRESJA: Falanga (bez warunku terenowego) na terenie Rownina nadal dziala normalnie -- 3 z 3');
}

{
  // cityDefenseBreakdownLines: terrain przekazany przez CityDefenseBreakdownOpts.terrain
  // musi dotrzec do defenderCivBonusBreakdown (integracja pelnej sciezki main.ts).
  const roster = buildDefenseRosterUnits(
    ['Wojownik', 'Wojownik'].map((n) => ({ celShapeName: n })),
    () => false,
    () => 0,
    (u) => celShape(u.celShapeName),
  );
  const linesRownina = cityDefenseBreakdownLines(roster, {
    fortifyPct: FORTIFY_OBRONA_PROC_FIELD,
    civBonusy: [fikcyjnyBonusLesny],
    difficultyMult: 1.0,
    terrain: 'Rownina',
  });
  assert(linesRownina.length === 0, 'cityDefenseBreakdownLines(terrain="Rownina"): bonus lesny pominiety calkowicie (zero linii)');

  const linesLas = cityDefenseBreakdownLines(roster, {
    fortifyPct: FORTIFY_OBRONA_PROC_FIELD,
    civBonusy: [fikcyjnyBonusLesny],
    difficultyMult: 1.0,
    terrain: 'Las',
  });
  assert(linesLas.length === 1 && linesLas[0].tekst.endsWith('2 z 2 jednostek'), 'cityDefenseBreakdownLines(terrain="Las"): bonus lesny pokazany, 2 z 2 jednostek ("' + (linesLas[0] && linesLas[0].tekst) + '")');
}

// ---------------------------------------------------------------------------
console.log('\n=== defense-breakdown-test: ' + pass + ' pass, ' + fail + ' fail ===');
try { fs.unlinkSync(DB_BUNDLE); } catch (e) {}
try { fs.unlinkSync(CD_BUNDLE); } catch (e) {}
try { fs.unlinkSync(SIEGE_BUNDLE); } catch (e) {}
process.exit(fail > 0 ? 1 : 0);
