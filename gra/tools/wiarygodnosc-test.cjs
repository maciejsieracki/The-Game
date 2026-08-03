'use strict';
/**
 * wiarygodnosc-test.cjs — Wiarygodność cywilizacji, Etap 1 (rdzeń) + Etapy 2–4 (haki).
 * Pokrycie wg `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` §7 "Testy (bramki)":
 *   - klamrowanie do [-100,100] dla skrajnych wartości i sum;
 *   - krzywa zapominania: t=0 pełna, t>=czasZapomnienia dokładnie 10% (podłoga), liniowość pomiędzy;
 *   - wiarygodnoscBand/wiarygodnoscLabelPl na granicach pasm;
 *   - test parytetu (ownerId=0 vs ownerId=N daje identyczną deltę);
 *   - różnice między poziomami trudności (start, czasy zapomnienia).
 *   - Etap 2–4: STRUMIEŃ (fresh/tick, bez trwałej podłogi), Wiarygodność CAŁKOWITA
 *     (zdarzenia jednorazowe + strumień, klamrowana), Dźwignia 1 (tickDiplomacy +
 *     wiarygodnoscSelf → ΔZaufanie, C-WIAR-SUMA=A: dodaje się do dZ).
 * Haki silnika (main.ts — N1–N7, S1–S4, P1–P5, save/load) nie są tu wprost jednostkowo
 * testowalne (żyją w domknięciu main.ts) — pokryte pośrednio przez zielone bramki
 * ai-test/logic-test/diplomacy-*-test (brak regresji) i manualny playtest (raport).
 *
 * Uruchom z gra/: node tools/wiarygodnosc-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch {
    console.error('[wiarygodnosc-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.wiarygodnosc-entry.ts');
const BUNDLE = path.resolve(__dirname, '.wiarygodnosc-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  wiarygodnoscBand,
  wiarygodnoscLabelPl,
  wiarygodnoscStartowa,
  credibilityEventSign,
  appendCredibilityEvent,
  wartoscBiezaca,
  sumaWiarygodnosci,
  credibilityStreamWeight,
  sumaStrumienia,
  strumienWiarygodnoscDoZaufania,
  modyfikatorZaufaniaD4OdWiarygodnosci,
  zaufaniePierwszyKontaktZD4,
  freshCredibilityStreamEntry,
  tickCredibilityStreamEntry,
  sumaWiarygodnosciCalkowita,
} from '../src/game/diplomacy-credibility';
export { DIPLOMACY_PARAMS, tickDiplomacy } from '../src/game/diplomacy';
export {
  diplomacyMaxZaufanieNaTureForWiarygodnosc,
  diplomacyPnRelacjaParams,
  diplomacyClampTrustGainNaTure,
} from '../src/game/diplomacy-value-catalog';
export { evaluateProposal } from '../src/game/diplomacy-proposals';\n`,
  'utf8',
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[wiarygodnosc-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const WC = require(BUNDLE);
const P = WC.DIPLOMACY_PARAMS;

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}
function approxEqual(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

// ---------------------------------------------------------------------------
// 1) Klamrowanie do [-100, 100] — wartości skrajne i sumy
// ---------------------------------------------------------------------------

ok(P.wiarygodnoscSkalaMin === -100, 'DIPLOMACY_PARAMS.wiarygodnoscSkalaMin = -100');
ok(P.wiarygodnoscSkalaMax === 100, 'DIPLOMACY_PARAMS.wiarygodnoscSkalaMax = 100');

{
  // Startowa +100 (spoza realnych wartości startowych, ale sprawdza klamrowanie
  // niezależnie od tego skąd suma pochodzi) + jedno gigantyczne zdarzenie dodatnie.
  const zdarzeniaOgromnaNagroda = [
    { typ: 'pomoc_sojusznikowi_realna', wartoscPierwotna: 100000, turaWystapienia: 0, znak: 'nagroda' },
  ];
  const suma = WC.sumaWiarygodnosci(zdarzeniaOgromnaNagroda, 100, 0, 'normal');
  ok(suma === 100, `suma klamrowana do +100 dla ogromnej nagrody świeżej (got ${suma})`);
}

{
  const zdarzeniaOgromnaKara = [
    { typ: 'zlamanie_paktu_sojusz', wartoscPierwotna: -100000, turaWystapienia: 0, znak: 'kara' },
  ];
  const suma = WC.sumaWiarygodnosci(zdarzeniaOgromnaKara, -100, 0, 'normal');
  ok(suma === -100, `suma klamrowana do -100 dla ogromnej kary świeżej (got ${suma})`);
}

{
  // Suma wielu trwałych śladów przekraczająca -100 (10 zdrad sojusznika, dawno wygasłych do podłogi -2.5 każda = -25,
  // powtórzone tak by suma trwałych śladów sama w sobie przebiła -100).
  const wieleZdarzen = [];
  for (let i = 0; i < 50; i++) {
    wieleZdarzen.push({ typ: 'zlamanie_paktu_sojusz', wartoscPierwotna: -25, turaWystapienia: 0, znak: 'kara' });
  }
  const tura = P.wiarygodnoscCzasZapomnieniaKaraNormalny + 1000; // dawno za czasem zapomnienia -> podłoga na każdym
  const suma = WC.sumaWiarygodnosci(wieleZdarzen, 0, tura, 'normal');
  ok(suma === -100, `suma wielu trwałych śladów klamrowana do -100 (got ${suma})`);
}

ok(WC.strumienWiarygodnoscDoZaufania(100000) === 100 / P.wiarygodnoscZaufanieDzielnikPerTura,
  'strumienWiarygodnoscDoZaufania klamruje wejście > 100 przed dzieleniem');
ok(WC.strumienWiarygodnoscDoZaufania(-100000) === -100 / P.wiarygodnoscZaufanieDzielnikPerTura,
  'strumienWiarygodnoscDoZaufania klamruje wejście < -100 przed dzieleniem');

// ---------------------------------------------------------------------------
// 1b) Dźwignia 4 — pierwszy kontakt (C-WIAR-D4=A): round(W/20) per strona
// ---------------------------------------------------------------------------

ok(WC.modyfikatorZaufaniaD4OdWiarygodnosci(0) === 0, 'D4: W=0 → 0 pkt');
ok(WC.modyfikatorZaufaniaD4OdWiarygodnosci(20) === 1, 'D4: W=20 → +1 pkt');
ok(WC.modyfikatorZaufaniaD4OdWiarygodnosci(-40) === -2, 'D4: W=-40 → -2 pkt');
ok(WC.modyfikatorZaufaniaD4OdWiarygodnosci(100) === 5, 'D4: W=100 → +5 pkt (klamrowane)');
ok(WC.zaufaniePierwszyKontaktZD4(15, 20, -40) === 14,
  'D4 para: baza 15 +1 -2 = 14 (symetria obu stron)');
ok(WC.zaufaniePierwszyKontaktZD4(98, 100, 100) === 100,
  'D4 clamp górny 100');

// ---------------------------------------------------------------------------
// 2) Krzywa zapominania — t=0 pełna, t>=czasZapomnienia dokładnie podłoga, liniowość
// ---------------------------------------------------------------------------

{
  const czas = P.wiarygodnoscCzasZapomnieniaKaraNormalny; // 80 tur, normalny, kara
  const zdarzenie = { typ: 'wypowiedzenie_wojny_bez_ostrzezenia', wartoscPierwotna: -10, turaWystapienia: 10, znak: 'kara' };

  const vAtZero = WC.wartoscBiezaca(zdarzenie, 10, 'normal');
  ok(vAtZero === -10, `wartoscBiezaca w chwili 0 = wartość pełna (got ${vAtZero})`);

  // Wzór §4 (dosłowny): mnoznik = max(podłoga, 1 - frac) — w połowie czasu
  // (frac=0.5) to zwykłe 1-0.5=0.5, bo 0.5 > podłoga 0.10 (floor jeszcze nieaktywny).
  const vAtHalf = WC.wartoscBiezaca(zdarzenie, 10 + czas / 2, 'normal');
  const oczekiwanaPolowa = -10 * 0.5;
  ok(approxEqual(vAtHalf, oczekiwanaPolowa), `wartoscBiezaca liniowa w połowie czasu zapomnienia (got ${vAtHalf}, want ${oczekiwanaPolowa})`);

  // Punkt kontrolny bliżej podłogi: frac=0.95 -> 1-frac=0.05 < podłoga 0.10,
  // więc mnoznik już zaklamrowany na podłodze (matematyczna konsekwencja
  // dosłownego wzoru max(0.10, 1-frac): podłoga osiągana przy frac=0.90, nie
  // dopiero przy frac=1.0 — zgłoszone w raporcie końcowym jako obserwacja,
  // nie sprzeczność z bramką §7 "w chwili >=czasZapomnienia dokładnie 10%").
  const vNearFloor = WC.wartoscBiezaca(zdarzenie, 10 + czas * 0.95, 'normal');
  ok(approxEqual(vNearFloor, -10 * P.wiarygodnoscTrwalaPodlogaProcent),
    `wartoscBiezaca już na podłodze przy frac=0.95 (1-frac=0.05 < podłoga 0.10) (got ${vNearFloor})`);

  const vAtFull = WC.wartoscBiezaca(zdarzenie, 10 + czas, 'normal');
  ok(approxEqual(vAtFull, -10 * P.wiarygodnoscTrwalaPodlogaProcent),
    `wartoscBiezaca w chwili >=czasZapomnienia = dokładnie podłoga 10% (got ${vAtFull}, want ${-10 * P.wiarygodnoscTrwalaPodlogaProcent})`);

  const vLongAfter = WC.wartoscBiezaca(zdarzenie, 10 + czas * 5, 'normal');
  ok(approxEqual(vLongAfter, -10 * P.wiarygodnoscTrwalaPodlogaProcent),
    `wartoscBiezaca zostaje na podłodze NA ZAWSZE (5x czas zapomnienia, got ${vLongAfter})`);
}

{
  // Nagroda: ta sama mechanika, znak dodatni.
  const czas = P.wiarygodnoscCzasZapomnieniaNagrodaNormalny; // 80 tur, normalny, nagroda
  const zdarzenie = { typ: 'dotrwanie_sojuszu', wartoscPierwotna: 10, turaWystapienia: 0, znak: 'nagroda' };
  const vAtZero = WC.wartoscBiezaca(zdarzenie, 0, 'normal');
  ok(vAtZero === 10, `wartoscBiezaca nagroda w chwili 0 = wartość pełna (got ${vAtZero})`);
  const vAtFull = WC.wartoscBiezaca(zdarzenie, czas, 'normal');
  ok(approxEqual(vAtFull, 10 * P.wiarygodnoscTrwalaPodlogaProcent),
    `wartoscBiezaca nagroda w chwili >=czasZapomnienia = dokładnie podłoga (got ${vAtFull})`);
}

// ---------------------------------------------------------------------------
// 3) wiarygodnoscBand / wiarygodnoscLabelPl na granicach pasm
// ---------------------------------------------------------------------------

ok(WC.wiarygodnoscBand(-40) === 'wiarolomny', 'band(-40) = wiarolomny');
ok(WC.wiarygodnoscBand(-39) === 'chwiejny', 'band(-39) = chwiejny');
ok(WC.wiarygodnoscBand(-1) === 'chwiejny', 'band(-1) = chwiejny');
ok(WC.wiarygodnoscBand(0) === 'uczciwy', 'band(0) = uczciwy');
ok(WC.wiarygodnoscBand(39) === 'uczciwy', 'band(39) = uczciwy');
ok(WC.wiarygodnoscBand(40) === 'wzor_cnoty', 'band(40) = wzor_cnoty');
ok(WC.wiarygodnoscBand(-100) === 'wiarolomny', 'band(-100) = wiarolomny (granica skali)');
ok(WC.wiarygodnoscBand(100) === 'wzor_cnoty', 'band(100) = wzor_cnoty (granica skali)');

ok(WC.wiarygodnoscLabelPl(-40) === 'Wiarołomny', 'label(-40) = Wiarołomny');
ok(WC.wiarygodnoscLabelPl(-39) === 'Chwiejny', 'label(-39) = Chwiejny');
ok(WC.wiarygodnoscLabelPl(-1) === 'Chwiejny', 'label(-1) = Chwiejny');
ok(WC.wiarygodnoscLabelPl(0) === 'Uczciwy', 'label(0) = Uczciwy');
ok(WC.wiarygodnoscLabelPl(39) === 'Uczciwy', 'label(39) = Uczciwy');
ok(WC.wiarygodnoscLabelPl(40) === 'Wzór cnoty', 'label(40) = Wzór cnoty');

// ---------------------------------------------------------------------------
// 4) Test parytetu — KLUCZOWY: ten sam event dla ownerId=0 i ownerId=N daje
//    identyczną deltę. Żadna funkcja w diplomacy-credibility.ts przyjmuje
//    ownerId, więc parytet dowodzimy wywołując te same funkcje z tymi samymi
//    danymi zdarzenia "w imieniu" dwóch różnych właścicieli (ownerId to tylko
//    klucz mapy u wywołującego — nie wchodzi do żadnego wzoru tutaj).
// ---------------------------------------------------------------------------

function simulateOwnerDelta(ownerId, eventStore) {
  // Symuluje silnik: aplikuje event 'zlamanie_paktu_sojusz' (N2) w turze 5 dla
  // danego ownerId, licząc deltę Wiarygodności między tura=5 (przed) i tura=6 (po).
  const before = WC.sumaWiarygodnosci(eventStore.get(ownerId) || [], 20, 5, 'normal');
  const nextEvents = WC.appendCredibilityEvent(eventStore.get(ownerId) || [], 'zlamanie_paktu_sojusz', P.wiarygodnoscN2ZlamaniePaktuSojusz, 5);
  eventStore.set(ownerId, nextEvents);
  const after = WC.sumaWiarygodnosci(eventStore.get(ownerId) || [], 20, 5, 'normal');
  return after - before;
}

{
  const store = new Map();
  const deltaGracz = simulateOwnerDelta(0, store); // ownerId=0 = gracz
  const deltaAI = simulateOwnerDelta(7, store); // ownerId=7 = dowolne AI
  ok(deltaGracz === deltaAI, `parytet: delta ownerId=0 (${deltaGracz}) === delta ownerId=7 (${deltaAI})`);
  ok(deltaGracz === P.wiarygodnoscN2ZlamaniePaktuSojusz, `parytet: delta = waga N2 sojusz świeża (got ${deltaGracz})`);
}

{
  // Parytet również dla credibilityEventSign i wartoscBiezaca bezpośrednio —
  // te same argumenty, różne "właściciele" (funkcje nie przyjmują ownerId
  // wcale, więc wynik jest identyczny z definicji; test dokumentuje to jawnie).
  const zdarzenieA = { typ: 'odmowa_obowiazku_sojuszu', wartoscPierwotna: P.wiarygodnoscN4OdmowaObowiazkuSojuszu, turaWystapienia: 12, znak: 'kara' };
  const zdarzenieB = { ...zdarzenieA }; // "ten sam event" dla innego ownerId
  const vA = WC.wartoscBiezaca(zdarzenieA, 40, 'hard');
  const vB = WC.wartoscBiezaca(zdarzenieB, 40, 'hard');
  ok(vA === vB, `parytet wartoscBiezaca: identyczne wejście -> identyczny wynik (${vA} === ${vB})`);
}

// ---------------------------------------------------------------------------
// 5) Różnice między poziomami trudności — start i czasy zapomnienia
// ---------------------------------------------------------------------------

ok(WC.wiarygodnoscStartowa('easy') === P.wiarygodnoscStartLatwy && WC.wiarygodnoscStartowa('easy') === 40,
  'start Łatwy = +40');
ok(WC.wiarygodnoscStartowa('normal') === P.wiarygodnoscStartNormalny && WC.wiarygodnoscStartowa('normal') === 20,
  'start Normalny = +20');
ok(WC.wiarygodnoscStartowa('hard') === P.wiarygodnoscStartTrudny && WC.wiarygodnoscStartowa('hard') === 0,
  'start Trudny = 0');
ok(WC.wiarygodnoscStartowa('easy') > WC.wiarygodnoscStartowa('normal')
  && WC.wiarygodnoscStartowa('normal') > WC.wiarygodnoscStartowa('hard'),
  'start maleje monotonicznie easy > normal > hard');

ok(P.wiarygodnoscCzasZapomnieniaKaraLatwy === 40, 'czas zapomnienia kar, Łatwy = 40 tur');
ok(P.wiarygodnoscCzasZapomnieniaKaraNormalny === 80, 'czas zapomnienia kar, Normalny = 80 tur');
ok(P.wiarygodnoscCzasZapomnieniaKaraTrudny === 120, 'czas zapomnienia kar, Trudny = 120 tur');
ok(P.wiarygodnoscCzasZapomnieniaNagrodaLatwy === 120, 'czas zapomnienia nagród, Łatwy = 120 tur');
ok(P.wiarygodnoscCzasZapomnieniaNagrodaNormalny === 80, 'czas zapomnienia nagród, Normalny = 80 tur');
ok(P.wiarygodnoscCzasZapomnieniaNagrodaTrudny === 40, 'czas zapomnienia nagród, Trudny = 40 tur');

{
  // Ten sam N2-sojusz event, ta sama tura odczytu, różne trudności -> różne
  // wartości bieżące (bo różny czas zapomnienia kar wg trudności).
  const zdarzenie = { typ: 'zlamanie_paktu_sojusz', wartoscPierwotna: -25, turaWystapienia: 0, znak: 'kara' };
  const tura = 60; // < 80 (normalny), < 120 (trudny), > 40 (łatwy, już na podłodze)
  const vEasy = WC.wartoscBiezaca(zdarzenie, tura, 'easy');
  const vNormal = WC.wartoscBiezaca(zdarzenie, tura, 'normal');
  const vHard = WC.wartoscBiezaca(zdarzenie, tura, 'hard');
  ok(approxEqual(vEasy, -25 * P.wiarygodnoscTrwalaPodlogaProcent), `t=60, Łatwy już na podłodze kar (got ${vEasy})`);
  ok(vNormal < vEasy && vNormal > -25, `t=60, Normalny bardziej wygaszone niż Łatwy, ale nie na podłodze jeszcze mniej niż pełne (got ${vNormal})`);
  ok(vHard < vNormal, `t=60, Trudny pamięta karę mocniej niż Normalny (mniej wygaszone, got ${vHard} < ${vNormal})`);
}

// ---------------------------------------------------------------------------
// 6) Rejestr S1-S4 strumienia (osobna struktura) — sanity, poza formalnymi
//    bramkami §7, ale pokrywa "struktury: ... osobna, prostsza struktura dla
//    wpisów STRUMIENIA" z §7/A tego zlecenia.
// ---------------------------------------------------------------------------

ok(WC.credibilityStreamWeight('strumien_sojusz') === P.wiarygodnoscS1SojuszPerTure, 'S1 sojusz waga = wiarygodnoscS1SojuszPerTure');
ok(WC.credibilityStreamWeight('strumien_nap') === P.wiarygodnoscS2NapPerTure, 'S2 nap waga = wiarygodnoscS2NapPerTure');
ok(WC.credibilityStreamWeight('strumien_handel') === P.wiarygodnoscS3HandelPerTure, 'S3 handel waga = wiarygodnoscS3HandelPerTure');
ok(WC.credibilityStreamWeight('strumien_przemarsz') === P.wiarygodnoscS4PrzemarszPerTure, 'S4 przemarsz waga = wiarygodnoscS4PrzemarszPerTure');

{
  const wpisy = [
    { typ: 'strumien_sojusz', wartoscNaTure: P.wiarygodnoscS1SojuszPerTure, sumaAktywna: 10 },
    { typ: 'strumien_handel', wartoscNaTure: P.wiarygodnoscS3HandelPerTure, sumaAktywna: 3 },
  ];
  ok(WC.sumaStrumienia(wpisy) === 13, `sumaStrumienia sumuje sumaAktywna wpisów (got ${WC.sumaStrumienia(wpisy)})`);
  ok(WC.sumaStrumienia([]) === 0, 'sumaStrumienia([]) === 0');
}

// ---------------------------------------------------------------------------
// 7) Etap 2-4: STRUMIEŃ tick/fresh (bez trwałej podłogi — C-WIAR-SLAD=A) i
//    sumaWiarygodnosciCalkowita (startowa + zdarzenia jednorazowe + strumień).
// ---------------------------------------------------------------------------

{
  const fresh = WC.freshCredibilityStreamEntry('strumien_sojusz');
  ok(fresh.wartoscNaTure === P.wiarygodnoscS1SojuszPerTure, 'freshCredibilityStreamEntry: waga = S1 sojusz');
  ok(fresh.sumaAktywna === 0, 'freshCredibilityStreamEntry: sumaAktywna startuje od 0');

  const t1 = WC.tickCredibilityStreamEntry(fresh);
  ok(t1.sumaAktywna === P.wiarygodnoscS1SojuszPerTure, `tickCredibilityStreamEntry: +1 tura = +waga (got ${t1.sumaAktywna})`);
  const t2 = WC.tickCredibilityStreamEntry(t1);
  ok(approxEqual(t2.sumaAktywna, 2 * P.wiarygodnoscS1SojuszPerTure), `tickCredibilityStreamEntry: +2 tury = 2x waga (got ${t2.sumaAktywna})`);
  ok(t1 !== fresh, 'tickCredibilityStreamEntry: immutable (nowy obiekt, nie mutacja)');

  // §3/§4 C-WIAR-SLAD=A: strumień nie ma krzywej zapominania ani podłogi — po
  // 1000 tur wpis nadal rośnie liniowo, nigdy się nie "zamraża" jak zdarzenia jednorazowe.
  let acc = WC.freshCredibilityStreamEntry('strumien_nap');
  for (let i = 0; i < 1000; i++) acc = WC.tickCredibilityStreamEntry(acc);
  ok(approxEqual(acc.sumaAktywna, 1000 * P.wiarygodnoscS2NapPerTure), 'strumień: 1000 tur = 1000x waga, bez podłogi/zamrożenia');
}

{
  // sumaWiarygodnosciCalkowita = startowa + Σ wartoscBiezaca(zdarzenia) + sumaStrumienia.
  const zdarzenia = [
    { typ: 'zlamanie_paktu_sojusz', wartoscPierwotna: -25, turaWystapienia: 0, znak: 'kara' },
  ];
  const wpisyStrumienia = [
    { typ: 'strumien_sojusz', wartoscNaTure: P.wiarygodnoscS1SojuszPerTure, sumaAktywna: 4 },
  ];
  const suma = WC.sumaWiarygodnosciCalkowita(zdarzenia, wpisyStrumienia, 20, 0, 'normal');
  ok(approxEqual(suma, 20 - 25 + 4), `sumaWiarygodnosciCalkowita: startowa+zdarzenia+strumien (got ${suma}, want ${20 - 25 + 4})`);

  // Klamrowanie: strumień ogromny (np. dziesiątki jednoczesnych zobowiązań przez setki tur, §9.2=C bez limitu) nie ucieka poza +100.
  const wpisyOgromne = [
    { typ: 'strumien_sojusz', wartoscNaTure: 1, sumaAktywna: 100000 },
  ];
  const sumaKlamrowana = WC.sumaWiarygodnosciCalkowita([], wpisyOgromne, 20, 0, 'normal');
  ok(sumaKlamrowana === 100, `sumaWiarygodnosciCalkowita klamruje do +100 (got ${sumaKlamrowana})`);
}

// ---------------------------------------------------------------------------
// 8) Etap 4: Dźwignia 1 — tickDiplomacy + TickCtx.wiarygodnoscSelf (C-WIAR-SUMA=A:
//    dodaje się do dZ, nie zastępuje reszty; C-WIAR-WROG/WOJNA — gating jest
//    obowiązkiem WOŁAJĄCEGO (main.ts), tickDiplomacy tylko dodaje gdy pole podane).
// ---------------------------------------------------------------------------

function freshRdip(zaufanie, status) {
  return { zaufanie, respekt: 30, status, traktaty: [], urazyHistoryczne: 0, relacjaOgolna: zaufanie + 30 };
}

{
  const before = freshRdip(50, 'neutralni');
  const after = WC.tickDiplomacy(before, { turn: 1, wiarygodnoscSelf: 50 });
  const expectedDelta = 50 / P.wiarygodnoscZaufanieDzielnikPerTura; // = 2.5
  ok(approxEqual(after.zaufanie, 50 + expectedDelta), `tickDiplomacy: wiarygodnoscSelf=50 -> dZ=+2.5 (got ${after.zaufanie})`);
}

{
  // Undefined = brak wpływu W na dZ. Status pokoju (nie wojna): clampRelationForWar
  // na 'wojna' zeruje zaufanie niezależnie od wiarygodnoscSelf — to nie ten kontrakt.
  const before = freshRdip(50, 'neutralni');
  const after = WC.tickDiplomacy(before, { turn: 1 });
  ok(after.zaufanie === 50, `tickDiplomacy: wiarygodnoscSelf undefined -> brak zmiany (got ${after.zaufanie})`);
}

{
  // C-WIAR-SUMA=A: strumień DODAJE SIĘ do istniejących składników dZ (np. sojusz +3), nie zastępuje.
  const before = freshRdip(50, 'neutralni');
  const after = WC.tickDiplomacy(before, { turn: 1, pokojTrustTier: 'sojusz', wiarygodnoscSelf: 40 });
  const expectedDelta = P.sojusz_zaufanie_perTura + 40 / P.wiarygodnoscZaufanieDzielnikPerTura;
  ok(approxEqual(after.zaufanie, 50 + expectedDelta), `tickDiplomacy: sojusz(+3) + wiarygodnoscSelf(+2) sumują się (got ${after.zaufanie}, want ${50 + expectedDelta})`);
}

{
  // Klamrowanie wejścia: W spoza -100..100 (nie powinno się zdarzyć w praniu ownera
  // Wiarygodności, ale funkcja musi być odporna) nie psuje wyniku — identyczne z
  // strumienWiarygodnoscDoZaufania.
  const before = freshRdip(10, 'neutralni');
  const after = WC.tickDiplomacy(before, { turn: 1, wiarygodnoscSelf: 100000 });
  ok(approxEqual(after.zaufanie, 10 + 100 / P.wiarygodnoscZaufanieDzielnikPerTura), `tickDiplomacy: klamruje W>100 przed dzieleniem (got ${after.zaufanie})`);
  ok(approxEqual(after.zaufanie, WC.strumienWiarygodnoscDoZaufania(100000) + 10), 'tickDiplomacy: spójne ze strumienWiarygodnoscDoZaufania (ta sama formuła)');
}

// ---------------------------------------------------------------------------
// 8d) Dźwignia 3 — twarde progi sojusz/NAP (WIARYGODNOSC §5)
// ---------------------------------------------------------------------------

function baseEvalCtx(overrides) {
  return {
    relation: { zaufanie: 80, respekt: 50, status: 'neutralni', traktaty: [] },
    stanWojny: false,
    turn: 5,
    proposerRespekt: 60,
    responderRespekt: 40,
    militaryRatio: 1,
    respektWzgledny: 0.5,
    activeDeals: [],
    difficulty: 'normal',
    proposerWiarygodnosc: 20,
    responderWiarygodnosc: 20,
    ...overrides,
  };
}
function evalNap(payload, ctxOverrides) {
  return WC.evaluateProposal(
    { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload },
    baseEvalCtx(ctxOverrides),
  );
}
function evalSojusz(ctxOverrides) {
  return WC.evaluateProposal(
    { actionId: 'sojusz_pelny', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
    baseEvalCtx(ctxOverrides),
  );
}
{
  const napLow = evalNap({ turns: 15 }, { proposerWiarygodnosc: -50 });
  ok(!napLow.accepted && napLow.reason.includes('Wiarygodność'), 'NAP odrzucony gdy W proponenta < -40');
  const napOk = evalNap({ turns: 15 }, { proposerWiarygodnosc: -40 });
  ok(napOk.accepted, 'NAP akceptowany gdy W proponenta = -40 (próg)');
  const sojuszLow = evalSojusz({ proposerWiarygodnosc: -1 });
  ok(!sojuszLow.accepted && sojuszLow.reason.includes('Wiarygodność'), 'Sojusz odrzucony gdy W proponenta < 0');
  const sojuszOk = evalSojusz({ proposerWiarygodnosc: 0 });
  if (!sojuszOk.accepted) {
    ok(!sojuszOk.reason.includes('Wiarygodność'), 'Sojusz W=0 nie pada na bramkę Wiarygodności (inne progi mogą odrzucić)');
  } else {
    ok(sojuszOk.accepted, 'Sojusz akceptowany gdy W proponenta = 0 i progi relacji spełnione');
  }
}

// ---------------------------------------------------------------------------
// 9) Dźwignia 2 (§5, WIAR-9.5b=B) — limit Zaufania kupowalnego na turę zależny
//    od Wiarygodności SPRAWCY (proposera), nie od Wiarygodności odbiorcy.
//    Reputacja dodatnia = limit dzisiejszy (5), nietknięty; zła reputacja
//    zawęża limit w czterech pasmach (siatka §5 raportu wdrożeniowego).
// ---------------------------------------------------------------------------

{
  const pn = WC.diplomacyPnRelacjaParams();
  ok(pn.max_zaufanie_na_ture === 5, 'pn_relacja.max_zaufanie_na_ture domyślnie 5 (dzisiejszy, nietknięty)');
  ok(pn.wiarygodnosc_limit_zaufanie_chwiejny === 3, 'siatka Dźwigni 2: pasmo Chwiejny = 3 pkt Zaufania/turę');
  ok(pn.wiarygodnosc_limit_zaufanie_wiarolomny === 1, 'siatka Dźwigni 2: pasmo Wiarołomny (górne) = 1 pkt Zaufania/turę');
  ok(pn.wiarygodnosc_limit_zaufanie_dno === 0, 'siatka Dźwigni 2: dno (W<=-70) = 0 pkt Zaufania/turę');
  ok(pn.wiarygodnosc_limit_prog_dno === -70, 'siatka Dźwigni 2: próg dna = -70');

  // Reputacja dodatnia/zero -> limit BEZ ZMIAN (kara złej reputacji, nigdy nagroda za dobrą).
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(100) === 5, 'W=+100 (Wzór cnoty) -> limit 5, bez zmian');
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(40) === 5, 'W=+40 (próg Wzór cnoty) -> limit 5');
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(1) === 5, 'W=+1 (Uczciwy) -> limit 5');
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(0) === 5, 'W=0 (brak historii) -> limit 5, NIE obniżony');

  // Pasmo Chwiejny: W<0 i > próg Wiarołomny (-40).
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-1) === 3, 'W=-1 (Chwiejny) -> limit 3');
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-39) === 3, 'W=-39 (Chwiejny, granica) -> limit 3');

  // Pasmo Wiarołomny górne: -70 < W <= -40.
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-40) === 1, 'W=-40 (próg Wiarołomny) -> limit 1');
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-69) === 1, 'W=-69 (Wiarołomny, tuż nad dnem) -> limit 1');

  // Dno: W <= -70 -> zakup Zaufania darem/nadwyżką całkowicie zablokowany.
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-70) === 0, 'W=-70 (próg dna) -> limit 0');
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-100) === 0, 'W=-100 (dno skali) -> limit 0');

  // Monotoniczność: im niższe W, tym limit nigdy nie rośnie.
  const grid = [100, 40, 0, -1, -39, -40, -69, -70, -100].map(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc);
  let monotone = true;
  for (let i = 1; i < grid.length; i++) if (grid[i] > grid[i - 1]) monotone = false;
  ok(monotone, `siatka Dźwigni 2 monotonicznie nierosnąca wraz ze spadkiem W (got ${grid.join(',')})`);

  // Klamrowanie wejścia (§4 pkt 10 — obowiązkowe wszędzie, gdzie W wchodzi do wzoru).
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(100000) === 5, 'W>100 klamrowane do +100 -> limit 5');
  ok(WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-100000) === 0, 'W<-100 klamrowane do -100 -> limit 0');

  // diplomacyClampTrustGainNaTure respektuje limit nadpisany przez params (tak jak
  // main.ts.applyPnTrustForPair go przekazuje, patrz applyPnTrustForPair) — sufit
  // realnie egzekwowany dla proponenta Wiarołomnego (-70<W<=-40 -> limit 1), nie
  // tylko poprawnie WYLICZONY.
  const wiarolomnyLimit = WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-50); // pasmo Wiarołomny -> 1
  ok(wiarolomnyLimit === 1, 'W=-50 (Wiarołomny) -> limit wyliczony = 1');
  const clamped = WC.diplomacyClampTrustGainNaTure(5, 0, { max_zaufanie_na_ture: wiarolomnyLimit });
  ok(clamped === 1, `diplomacyClampTrustGainNaTure honoruje limit obniżony przez Dźwignię 2 (got ${clamped}, want 1)`);
  const clampedDno = WC.diplomacyClampTrustGainNaTure(5, 0, {
    max_zaufanie_na_ture: WC.diplomacyMaxZaufanieNaTureForWiarygodnosc(-100),
  });
  ok(clampedDno === 0, `diplomacyClampTrustGainNaTure: proponent na dnie (W=-100) -> 0 Zaufania kupowalnego (got ${clampedDno})`);
}

console.log(`wiarygodnosc-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
