// R-RUSTPORT-P6-ZWYCIESTWO-IMPL-Q1: generator wektorow warunkow zwyciestwa i porazki gracza 0.
// Generator WYKONUJE tekst z pinu 07d2fbd72 (`gra/src/game/victory.ts`) w node: typy usuwa
// `stripTypeScriptTypes`, importy zastepuje stubami wartosci z `e-start-params` (fallbacki z pinu,
// sprawdzone regexem na zrodle loadera, oraz wartosci z `rust-port/engine/data/e-start-params.json`).
// Straznik SHA-256: generator odmawia pracy, gdy `victory.ts` rozni sie od zapisanego skrotu.
//
// Zakres wektorow: checkVictory, checkDefeat, isEliminated, powerShare (tolerancja), isDominacjaVictory,
// isNaukaVictory, victoryModeAllowsDominacja/Moc, techIdsInGameScope. Przypadki: losowe (LCG) + reczne.
// Wejscie miast = tablica ownerId (Rust nie trzyma obiektow City w tej funkcji; pole `ownerId` jest jedynym
// uzywanym przez `citiesOf`/`isEliminated`).
//
// Uzycie (WEB_ROOT = `git archive 07d2fbd72 gra/src | tar -x -C <katalog>`, poza repo; Node 22+; cwd = korzen repo):
//   node rust-port/engine/tests/p6_victory_gen.mjs <WEB_ROOT> > rust-port/engine/tests/p6_victory_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen.mjs <WEB_ROOT>');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const EXPECTED_SHA256 = '2f22949ba00bbfb754410f66fc5e1856b67dc0621d31ea310c6df39e6517bb8a';
const VICTORY_REL = path.join('gra', 'src', 'game', 'victory.ts');
const LOADER_REL = path.join('gra', 'src', 'data', 'e-start-params-loader.ts');
const PIN_DATA_REL = path.join('gra', 'data', 'e-start-params.json');

const rawText = readFileSync(path.join(WEB_ROOT, VICTORY_REL), 'utf8');
const sha = createHash('sha256').update(rawText).digest('hex');
if (sha !== EXPECTED_SHA256) throw new Error(`strazik SHA-256 victory.ts: ${sha} != ${EXPECTED_SHA256} (pin ${PIN})`);

// Wartosci zwyciestwa: z PLIKU DANYCH PINU (gra/data/e-start-params.json w WEB_ROOT), nie z kopii Rust.
// Dzieki temu test Rust porownuje stale Rust z pinem, a nie z samym soba.
const pinEStart = JSON.parse(readFileSync(path.join(WEB_ROOT, PIN_DATA_REL), 'utf8'));
const Z = pinEStart.zwyciestwo;
if (!Z) throw new Error('brak bloku zwyciestwo w danych pinu');
const loaderText = readFileSync(path.join(WEB_ROOT, LOADER_REL), 'utf8');
for (const frag of ['? v : 3;', 'v < 1 ? v : 0.5;', '!== false']) {
  // Fallbacki pinu musza istniec w zrodle loadera (inaczej stub przestaje odpowiadac pinowi).
  if (!loaderText.includes(frag)) throw new Error(`fragment fallbacku loadera nie znaleziony: ${frag}`);
}
const CONSTS = {
  ostatnia: Z.ostatnia_epoka_v1,
  prog: Z.prog_dominacji_power,
  dominacjaWymaga: Z.dominacja_wymaga_ostatniej_epoki,
  naukaWymaga: Z.nauka_wymaga_rakiety,
};

// Usuniecie importow (wielolinijkowych tez) i eksportow; stuby zamiast loadera.
let src = rawText.replace(/^import[\s\S]*?from '[^']+';$/gm, '');
src = src.replace(/^export /gm, '');
const stubs = `
const eStartOstatniaEpokaV1 = () => ${CONSTS.ostatnia};
const eStartProgDominacjiPower = () => ${CONSTS.prog};
const eStartDominacjaWymagaOstatniejEpoki = () => ${CONSTS.dominacjaWymaga};
const eStartNaukaWymagaRakiety = () => ${CONSTS.naukaWymaga};
`;
const js = stripTypeScriptTypes(stubs + src, { mode: 'strip' });

// Fabryka: zwraca funkcje pinu. console nie jest uzywany przez victory.ts.
const factory = new Function(`${js}
return {
  OSTATNIA_EPOKA_GRY_V1, PROG_DOMINACJI_POWER, DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI, NAUKA_WYMAGA_RAKIETY,
  victoryModeAllowsDominacja, victoryModeAllowsMoc, playersOfType, citiesOf, isEliminated, powerShare,
  isDominacjaVictory, isNaukaVictory, allTechInScopeResearched, techIdsInGameScope, checkDefeat, checkVictory,
};`);
const V = factory();

// Deterministyczny LCG.
let seed = 0x5a17c0de;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const rb = () => rnd() < 0.5;
const maybe = (f) => (rnd() < 0.35 ? undefined : f());
const MODES = [undefined, 'moc', 'dominacja', 'moc_i_dominacja'];

// Wejscie w postaci JSON (bez undefined: pole pomijane, gdy undefined).
function buildInput(raw) {
  const input = {
    cities: raw.cityOwners.map(o => ({ ownerId: o })),
    gracz: raw.gracz,
  };
  const opt = {
    victoryMode: raw.victoryMode,
    potegaGracza: raw.potegaGracza,
    potegiWszystkich: raw.potegiWszystkich,
    graczEra: raw.graczEra,
    ostatniaEpoka: raw.ostatniaEpoka,
    wszystkieTechZbadane: raw.wszystkieTechZbadane,
    rakietaWystrzelona: raw.rakietaWystrzelona,
    epokaKoncowa: raw.epokaKoncowa,
    naukaUkonczona: raw.naukaUkonczona,
    graczKiedysMialMiasto: raw.graczKiedysMialMiasto,
  };
  for (const [k, v] of Object.entries(opt)) if (v !== undefined) input[k] = v;
  return input;
}

// Wynik w postaci JSON (null albo {winner, rodzaj}).
const res = r => (r === null ? null : { winner: r.winner, rodzaj: r.rodzaj });

function expectOf(input) {
  const sh = input.potegiWszystkich ?? [];
  const share = V.powerShare(input.potegaGracza ?? 0, sh);
  return {
    victory: res(V.checkVictory(input)),
    defeat: res(V.checkDefeat(input)),
    eliminated: V.isEliminated(input.gracz, input.cities),
    // Udzial liczony w JS; porownanie w Rust z tolerancja (parsowanie JSON->f64 bywa o 1 ulp).
    share,
    dominacja: V.isDominacjaVictory(input.potegaGracza ?? 0, sh, input.graczEra ?? 1, input.ostatniaEpoka ?? V.OSTATNIA_EPOKA_GRY_V1),
  };
}

const cases = [];
// Reczne przypadki (kazdy punkt z kryteriow konca).
const manual = [
  // Dominacja: 60 z 100, era 3 (ostatnia), tryb undefined.
  { name: 'dominacja_60_z_100', cityOwners: [0], gracz: 0, potegaGracza: 60, potegiWszystkich: [60, 40], graczEra: 3 },
  // Dominacja wymaga ostatniej epoki: era 2 nie wygrywa mimo 60%.
  { name: 'dominacja_era2_brak', cityOwners: [0], gracz: 0, potegaGracza: 60, potegiWszystkich: [60, 40], graczEra: 2 },
  // Przyciecie Math.max(0,...) w sumie: ujemna moc AI nie zmniejsza sumy (sum=100), gracz 40 -> 0.4 (bez przyciecia 0.8).
  { name: 'przyciecie_suma_ujemnych', cityOwners: [0], gracz: 0, potegaGracza: 40, potegiWszystkich: [-50, 40, 60], graczEra: 3 },
  // Przyciecie ujemnej mocy gracza: Math.max(0,-5)=0 -> udzial 0.
  { name: 'przyciecie_moc_gracza_ujemna', cityOwners: [0, 1], gracz: 0, potegaGracza: -5, potegiWszystkich: [-10, 30, 70], graczEra: 3 },
  // Suma zerowa -> udzial 0, brak dominacji.
  { name: 'suma_zero', cityOwners: [0], gracz: 0, potegaGracza: 0, potegiWszystkich: [0, 0], graczEra: 3 },
  // Brak potegi wszystkich: dominacja nieaktywna (potegi.length === 0).
  { name: 'brak_potegi_wszystkich', cityOwners: [0], gracz: 0, potegaGracza: 100, potegiWszystkich: [], graczEra: 3 },
  // Eliminacja po utracie ostatniego miasta: przegrana (domyslnie kiedysMial = true).
  { name: 'przegrana_po_eliminacji', cityOwners: [1, 2, 2], gracz: 0, graczEra: 2 },
  // Przed pierwszym miastem gracz nie przegrywa (flaga false).
  { name: 'brak_przegranej_przed_miastem', cityOwners: [1], gracz: 0, graczKiedysMialMiasto: false },
  // Flaga true jawnie + brak miast -> przegrana.
  { name: 'przegrana_flaga_true', cityOwners: [], gracz: 0, graczKiedysMialMiasto: true },
  // Przegrana ma pierwszenstwo przed nauka (kolejnosc 10=A*).
  { name: 'przegrana_przed_nauka', cityOwners: [], gracz: 0, wszystkieTechZbadane: true, rakietaWystrzelona: true },
  // Nauka: wszystkie tech + rakieta (NAUKA_WYMAGA_RAKIETY=true).
  { name: 'nauka_z_rakieta', cityOwners: [0], gracz: 0, wszystkieTechZbadane: true, rakietaWystrzelona: true },
  // Nauka nieosiagalna przy rakiecie false (parytet: rakieta nigdy nie ustawiana na true).
  { name: 'nauka_bez_rakiety', cityOwners: [0], gracz: 0, wszystkieTechZbadane: true, rakietaWystrzelona: false },
  // Nauka: brak wszystkich tech, rakieta true -> brak.
  { name: 'nauka_bez_tech', cityOwners: [0], gracz: 0, wszystkieTechZbadane: false, rakietaWystrzelona: true },
  // Fallbacki deprecated: epokaKoncowa + naukaUkonczona -> tech i rakieta z jednej flagi.
  { name: 'fallback_naukaUkonczona', cityOwners: [0], gracz: 0, epokaKoncowa: true, naukaUkonczona: true },
  { name: 'fallback_tylko_epokaKoncowa', cityOwners: [0], gracz: 0, epokaKoncowa: true, naukaUkonczona: false },
  // Nowe pola maja pierwszenstwo nad fallbackiem (?? nie ||).
  { name: 'nowe_pola_przed_fallbackiem', cityOwners: [0], gracz: 0, wszystkieTechZbadane: false, epokaKoncowa: true, naukaUkonczona: true, rakietaWystrzelona: false },
  // Tryb 'dominacja' blokuje nauke.
  { name: 'tryb_dominacja_blokuje_nauke', cityOwners: [0], gracz: 0, victoryMode: 'dominacja', wszystkieTechZbadane: true, rakietaWystrzelona: true },
  // Tryb 'moc' blokuje dominacje.
  { name: 'tryb_moc_blokuje_dominacje', cityOwners: [0], gracz: 0, victoryMode: 'moc', potegaGracza: 90, potegiWszystkich: [90, 10], graczEra: 3 },
  // Tryb 'moc_i_dominacja' pozwala na obie.
  { name: 'tryb_moc_i_dominacja_nauka', cityOwners: [0], gracz: 0, victoryMode: 'moc_i_dominacja', wszystkieTechZbadane: true, rakietaWystrzelona: true },
  // Ostatnia epoka nadpisana (ostatniaEpoka=2): era 2 wystarcza do dominacji.
  { name: 'ostatnia_epoka_2', cityOwners: [0], gracz: 0, potegaGracza: 70, potegiWszystkich: [70, 30], graczEra: 2, ostatniaEpoka: 2 },
  // Domyslna era gracza = 1 (brak graczEra): < 3 -> brak dominacji.
  { name: 'domyslna_era', cityOwners: [0], gracz: 0, potegaGracza: 99, potegiWszystkich: [99, 1] },
  // Remis dokladnie 50% -> NIE dominacja (ostro > 0.5).
  { name: 'dokladnie_50_nie_dominacja', cityOwners: [0], gracz: 0, potegaGracza: 50, potegiWszystkich: [50, 50], graczEra: 3 },
  // Przypadek kolejnosci: gracz bez miast (kiedysMial domyslnie true), 60% mocy, era 3 -> dominacja pierwsza.
  { name: 'eliminowany_dominacja_pierwsza', cityOwners: [1, 2], gracz: 0, potegaGracza: 60, potegiWszystkich: [60, 40], graczEra: 3 },
  // Ulamkowy prog: udzial dokladnie 0.5 (1.5/3.0) -> NIE dominacja (ostro >).
  { name: 'ulamkowe_dokladnie_0_5', cityOwners: [0], gracz: 0, potegaGracza: 1.5, potegiWszystkich: [1.5, 1.5], graczEra: 3 },
  // Ulamkowy: udzial 0.53 > 0.5 -> dominacja.
  { name: 'ulamkowe_powyzej_0_5', cityOwners: [0], gracz: 0, potegaGracza: 1.6, potegiWszystkich: [1.6, 1.4], graczEra: 3 },
  // Ujemne ulamki w sumie przycinane do 0 (JS Math.max).
  { name: 'ulamkowe_ujemne_przyciete', cityOwners: [0], gracz: 0, potegaGracza: 0.4, potegiWszystkich: [-0.7, 0.4, 0.6], graczEra: 3 },
  // AI nie wygrywa: gracz 1 bez miast (eliminowany), gracz 0 ma miasta i dominacje -> winner 0.
  { name: 'ai_nie_wygrywa_gracz_1', cityOwners: [0], gracz: 1, potegaGracza: 10, potegiWszystkich: [90, 10], graczEra: 3 },
];
for (const m of manual) cases.push({ name: m.name, raw: m });

// Moc ulamkowa (jedno miejsce po przecinku): ri(-200,1200)/10 daje wartosci -20.0..120.0 z krokiem 0.1.
const pwr = () => ri(-200, 1200) / 10;
// Losowe przypadki (LCG): 200 sztuk.
for (let i = 0; i < 200; i++) {
  const nCities = ri(0, 4);
  const cityOwners = Array.from({ length: nCities }, () => ri(0, 3));
  const nPot = ri(0, 5);
  const potegiWszystkich = maybe(() => Array.from({ length: nPot }, pwr));
  cases.push({
    name: `losowy_${i}`,
    raw: {
      cityOwners,
      gracz: ri(0, 2),
      victoryMode: rnd() < 0.5 ? undefined : MODES[ri(0, 3)],
      potegaGracza: maybe(pwr),
      potegiWszystkich,
      graczEra: maybe(() => ri(1, 3)),
      ostatniaEpoka: maybe(() => ri(1, 4)),
      wszystkieTechZbadane: maybe(rb),
      rakietaWystrzelona: maybe(rb),
      epokaKoncowa: maybe(rb),
      naukaUkonczona: maybe(rb),
      graczKiedysMialMiasto: maybe(rb),
    },
  });
}

// Id tech w zakresie gry (scope wedlug ostatniej epoki).
const TECHS = [
  { Technologia: 'Rolnictwo', Epoka: 'Kamień' },
  { Technologia: 'Garncarstwo', Epoka: 'Kamień' },
  { Technologia: 'Miedz', Epoka: 'Brąz' },
  { Technologia: 'Zelazo', Epoka: 'Żelazo' },
  { Technologia: 'Pismo', Epoka: ' Brąz ' },
  { Technologia: '', Epoka: 'Kamień' },
  { Technologia: null, Epoka: 'Żelazo' },
  { Technologia: 'Nieznana', Epoka: 'Inna' },
];
const scope = [1, 2, 3, 4].map(e => ({ ostatniaEpoka: e, ids: V.techIdsInGameScope(TECHS, e) }));

const out = {
  pin: PIN,
  sources: { 'gra/src/game/victory.ts': EXPECTED_SHA256 },
  constants: {
    ostatnia_epoka_gry_v1: V.OSTATNIA_EPOKA_GRY_V1,
    prog_dominacji_power: V.PROG_DOMINACJI_POWER,
    dominacja_wymaga_ostatniej_epoki: V.DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI,
    nauka_wymaga_rakiety: V.NAUKA_WYMAGA_RAKIETY,
  },
  techs: TECHS,
  tech_scope: scope,
  cases: cases.map(c => {
    const input = buildInput(c.raw);
    return { name: c.name, input: c.raw, expect: expectOf(input) };
  }),
};

process.stdout.write(`${JSON.stringify(out, null, 1)}\n`);
