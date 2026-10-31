STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTO-FORT-CLAIM-Q1
GOAL: Automat ulepszen (K2 gracz „Zrownowazone", K3 AI cywilizacji) stawia fort/posterunek na cennym terenie (zloze/gory), na granicy dostepnej budowy, z maksimum nowych heksow terytorium — tylko gdy limit miast wyczerpany, po zywnosci i surowcach, przed drogami; jedna implementacja, bez nakladania zasiegow.
ZMIANY/COMMIT: kod `84e8ec4a1` (baza `a07e6916f` = origin/main, ROBOCZA 79a5ca16; STAGES2+STAGES3 w bazie). Commit raportu = HEAD brancha worktree (nastepny po 84e8ec4a1). Allowlista: `gra/src/game/auto-improvements.ts`, `gra/src/game/ai.ts` (tylko wywolanie pickera + pole opts), `gra/tools/auto-fort-claim-test.cjs` (nowy), `dyspozycje/autobot/runs/R-WEB-AUTO-FORT-CLAIM-Q1/**`. ZERO zmian: gra-robocza, WERSJE.md, rust-port, main.ts. Narzedzie pomiarowe `auto-fort-claim-measure.cjs` lezy w katalogu runu (nie w gra/tools — nazwa `*-measure.cjs` poza allowlista `*-test.cjs`); uruchomienie: skopiowac do `gra/tools/`.
TESTY: patrz sekcja 4 (PRZED/PO). Nowy test `auto-fort-claim-test.cjs` 51/0 (PRZED na kodzie sprzed zmiany: czerwony — 21 FAIL + brak eksportu). Wszystkie bramki z dispatchu zielone PRZED i PO, bez regresji.
BLOKADY: (1) WIAZANIE W SILNIKU poza allowlista: `src/main.ts` musi podac `cityLimitExhausted` (gracz, wywolanie pickera main.ts:36226) i `cityLimitBase` w `AITurnOpts` (AI) — do tego czasu krok jest NIEAKTYWNY w grze (domyslnie wylaczony, zero zmiany zachowania). Patrz sekcja 6. (2) Zalozenia do potwierdzenia — sekcja 5.
RUNDY: 1/5
NASTEPNY KROK: Evaluator R1 (ten sam ID). Do rozstrzygniecia przez orkiestratora: rozszerzenie allowlisty o `gra/src/main.ts` (2 male wiazania, sekcja 6) — bez tego ZADNE zachowanie w grze sie nie zmienia.
DEPLOY/PUSH: NIE WYKONANO

# 1. Rozpoznanie (plik:linia, stan bazy a07e6916f)

**Jak dzis gracz/AI stawia forty**
- Picker wspolny: `auto-improvements.ts` `pickAutoImprovements` (l.759). Fort/posterunek w tej sciezce wystepuja tylko w FAZIE 0 „obrona" jednostkowego przebiegu (`defensePriority`), ktora pod popytem (`demandActive`) jest PUSTA (`auto-improvements.ts` l.1360: `const defensePriority = demandActive ? [] : ...`) — czyli K2/K3 dzis NIE stawiaja fortow przez picker wcale; FAZA 0 zyje tylko dla profili „infrastruktura"/wywolan bez `demandDriven`.
- AI cywilizacji: osobna sciezka `planExpansionFortBuilding` (`ai.ts:2738`): posterunek (nie fort) przy WLASNEJ jednostce stojacej POZA zasiegiem miast+fortow, raz na ture, wylaczona dla `defensiveCopy`. Wolana po `planCityImprovements` (ai.ts ~3218 i ~4385), koszt pickera wchodzi do `plannedImprovementCost`.
- Gracz: automat EOT w `main.ts:36226` wola `pickAutoImprovements` (K1/K2); gracz ma tez reczne budowanie fortu.
- Kwalifikator: `map/improvement-build.ts:1072` (`case 'posterunek'|'fort'`): ląd (`TERENY_LADU` — zawiera Gory, l.163), nie na terytorium CUDZEGO MIASTA; wewnatrz WLASNEGO terytorium bez wymogu jednostki. Czyli „granica dostepnej budowy" = najdalszy heks WLASNEGO terytorium, na ktorym `qualifies('fort')` jest prawda.

**Konflikt/duplikacja z `planExpansionFortBuilding`** — ZMIERZONE logicznie: NIE nakladaja sie. Expansion dziala WYLACZNIE poza zasiegiem miast/fortow (`isHexWithinAnyCityReach`, ai.ts:~2796) i zalezy od stojacej tam jednostki; E-FORT dziala WYLACZNIE na heksie WEWNATRZ wlasnego terytorium (kwalifikator), bez jednostki. Rozlaczne zbiory heksow, rozny wyzwalacz, rozne cele (nowy kierunek ekspansji vs zabezpieczenie cennego terenu). Wspolne: budzet (obie sciezki ciagna z jednej koperty — `plannedImprovementCost` zawiera picki E-FORT, wiec expansion widzi ich koszt). ZALOZENIE (sekcja 5): nie scalam, bez pytania ABC — brak sprzecznosci z decyzja wlasciciela („jedna implementacja" dotyczy LOGIKI WYBORU fortu na cennym terenie: jedna funkcja `pickFortClaims`, wspolna dla K2 i K3).

**Granica dostepnej budowy / przyrost heksow**
- Zasieg: `map/territory.ts` `cityTerritoryRadius` (fort 5, posterunek 3; `FORT_TERRITORY_RADIUS`/`OUTPOST_TERRITORY_RADIUS`), wlasciciel heksa `territoryOwnerAt` (miasta wygrywaja z fortami; fort zajmuje tylko heksy wolne od miast).
- Przyrost = liczba heksow LADOWYCH w promieniu kandydata, dla ktorych `territoryOwnerAt(...)===null` w biezacym zestawie wezlow (liczone na wezlach rozszerzanych o forty postawione w tym wywolaniu).
- Limit miast: `cities.ts:1163` `canFoundCity`: `base + (era-1)*5`, liczy `foundedByOwner !== false`. Picker nie zna konfiguracji → wolajacy podaje flage.

# 2. Implementacja — krok E-FORT (`auto-improvements.ts`)

- Kolejnosc potwierdzona i opisana w kodzie (l.~928): **E1–E5 (+E6, sciezka zapasowa) → krok niedoboru → FORTY (E-FORT) → drogi**. Drogi zostaja NAJNIZSZYM priorytetem: ruszaja tylko gdy fort nie ma celu ani do postawienia, ani czekajacego na Prace (`fortIsPending`, sonda z nieograniczonym budzetem — ten sam wzorzec co etapy i drogi). (`fortSpent` l.961; drogi licza budzet od `fortSpent`.)
- Warunki wejscia: `opts.cityLimitExhausted === true` (nowe pole opts, l.429) + `demandDriven` + profil „zrownowazone" (`roadCities`) + zywnosc/zapasowa/niedobor bez pickow i bez celow czekajacych (`foodAndFallbackDone`, l.903; `deficitIsPendingNow()` z pamiecia — wyciagniete z galezi drog, zachowanie drog bez zmian). K1 „Zywnosc", „surowce", „infrastruktura": bez zmian (test I: picki identyczne z flaga i bez).
- Wybor (`pickFortClaims`, l.629): kandydat = heks Gory albo ze zlozem (`hexHasDepositReserve`: zloze/nakladka zlozowa; sam Las i Brak nie), nie heks miasta, bez istniejacego fortu/posterunku, w terytorium WLASNYM (kwalifikator). Skan wokol WSZYSTKICH wlasnych wezlow (miasta + wlasne forty/posterunki) — granica moze rosnac. Wynik = maks. NOWYCH heksow; remis → dalej od najblizszego wlasnego wezla → (q,r). Fort preferowany (r=5), posterunek (r=3) gdy fort niedostepny lub jego okrag zachodzi na inny fort a posterunku nie. Filtr `onlyWorked` nie obowiazuje (cenny teren na granicy nie jest pracowany). 1 pick na miasto na wywolanie; kolejne w tym samym wywolaniu widza wczesniejsze.
- „Jeden fort na obszar, bez nakladania": okregi (suma promieni) fortow/posterunkow DOWOLNEGO wlasciciela musza byc rozlaczne (odleglosc > r1+r2); z miastami zachodzic moga (zysk liczy tylko heksy wolne). Konsekwencja: lancuch fort-za-fortem w jednym zasiegu nie powstaje; nastepny fort tylko poza okregiem poprzedniego (np. innym kierunkiem od miasta).
- Budzet: te same pulapy co reszta pickera (`imperiumBudgetCap`, per-miasto `getPracaBudgetPercent`, rezerwa `pracaSurplusThreshold`, `globalPracaPulaAtEntry`): gracz = sztywny sufit %, AI = 100% puli (AI podaje `pracaBudgetPercent:100`).
- `ai.ts`: pole `AITurnOpts.cityLimitBase` (l.415) i w `planCityImprovements` `cityLimitExhausted: !opts.defensiveCopy && isCityLimitExhausted(myCities, opts.cityLimitBase, opts.civEra)` (l.2664). `planExpansionFortBuilding` nietkniete (nie usuniete, nie zduplikowane).
- `isCityLimitExhausted` (l.583) powiela wzor `canFoundCity` (cities.ts poza allowlista); zabezpieczenie: test parytetu P z realnym `canFoundCity` (base 10/15/20 × era 0..5 × granica ±1 + miasta zdobyte).

# 3. Testy (`gra/tools/auto-fort-claim-test.cjs`, 51 asercji)

A granica/maks. zysk (nie blizsza gora, nie blizsze zloze) · B limit nie wyczerpany/brak flagi → 0 · C brak zloz/gor, sam las → 0 · D nie nakłada (wiele wywolan; istniejacy wlasny i cudzy fort blokuja) · E budzet gracza sztywny (% < koszt → 0, rezerwa, override miasta, 0%) · F K3 przez `decideAITurn` (wyczerpany/bez `cityLimitBase`/era 3 nie wyczerpany/`defensiveCopy`/pula=koszt) · G parytet K2↔K3 (3 uklady, te same wspolrzedne i klucz) · H kolejnosc (zywnosc przed fortem; niedobor przed fortem; fort przed drogami; fort czekajacy na Prace wstrzymuje drogi; po forcie drogi ruszaja) · I K1/surowce/infrastruktura bez zmian · J zysk liczony jako heksy wolne, tech-gate · P parytet z `canFoundCity`.

# 4. Wyniki bramek (logi `gate-*.txt`, jedna linia `EXIT=`)

| Bramka | PRZED (a07e6916f) | PO (84e8ec4a1) |
|---|---|---|
| `tsc --noEmit` | EXIT=0 | EXIT=0 |
| diplomacy-test | 148/0 | 148/0 |
| war-era-counter-test | 82/0 | 82/0 |
| unit-owner-emblem-ring-civ-color-test (ring) | 15/0 | 15/0 |
| autoimprove-stages-q1-test | 302/0 | 302/0 |
| auto-improvements-test | 46/0 | 46/0 |
| ai-improvements-test | 56/0 | 56/0 |
| fort-outpost-hard-territory-test | 80/0 | 80/0 |
| saveload-praca-pool-live-test | 13/0 | 13/0 |
| defeat-last-city-test | 14/0 | 14/0 |
| **auto-fort-claim-test (nowy)** | **CZERWONY** (kod sprzed zmiany: 21 FAIL + brak `isCityLimitExhausted`, `gate-pre-auto-fort-claim-RED.txt`) | **51/0** |

Znane czerwone (civ-matrix 42/1, ai-test) nie uruchamiane (poza zakresem). „ring 15" zinterpretowano jako `unit-owner-emblem-ring-civ-color-test` (jedyny test o tej nazwie z 15 asercjami) — ZALOZENIE.

**Mutacje** (kopia `src` z jedna zmiana, `mutation-*.txt`): m1 usuniecie warunku limitu → 6 FAIL; m2a wybor blizszego zamiast dalszego → 2 FAIL; m3 brak kontroli nakladania → 4 FAIL; m4 brak sufitu budzetu → 4 FAIL; m5 drogi nie czekaja na fort → 2 FAIL; m6 brak filtra cennego terenu → 7 FAIL; m8 brak rezerwy → 1 FAIL. m7 (usuniecie `!deficitIsPendingNow()`) PRZEZYLA: mutant rownowazny przy danych kosztow (wszystkie ulepszenia niedoboru tansze od fortu: kamieniolom 22, kopalnia_zelaza 88 < fort 100, wiec cel niedoboru czekajacy na Prace implikuje fort czekajacy na Prace) — straznik defensywny na wypadek zmiany danych; NIE_ZMIERZONO osobnym testem. Uwaga: logi m1–m4, m6, m8 z wersji testu sprzed doprecyzowania fixtury drog (49 asercji); m5 z wersji koncowej (51).

# 5. Pomiar skutku na AI (K3, produkcyjny `decideAITurn`, 5 ziaren × 40 tur, 3 miasta, era 1, baza limitu 3; dochod 80/ture, pula 2000; mapa `kontynenty`) — `measure-ai-5x40.txt`

SREDNIA/ziarno: OFF (zachowanie sprzed) teren 176,4 heksow ladowych, zloza+gory w terytorium 67,6, forty 0 · ON teren 223,6, zloza+gory 87,6, forty 3,8 (3 fort + 1 posterunek typowo), Praca na forty 348.
**PRZYROST: +47,2 heksow ladowych/ziarno, +20,0 heksow ze zlozem/gorami/ziarno.** Forty pojawiaja sie w turach 3–6 (po domknieciu zywnosci). Pomiar na uproszczonej symulacji (3 miasta stale pop 6, brak wojen/rywali) — NIE jest pomiarem w pelnej grze.

# 6. Zalozenia przyjete (zamiast ABC) i luki

1. **Wiazanie main.ts poza allowlista (BLOKADA do decyzji orkiestratora).** Potrzebne dokladnie: (a) gracz — w wywolaniu `pickAutoImprovements` (main.ts:36226) dodac `cityLimitExhausted: isCityLimitExhausted(cities.filter(c => c.ownerId === hOid), _menuCityLimitBase, empireEpochForOwner(hOid))` (import z auto-improvements; `_menuCityLimitBase` jest w main.ts:1844, ten sam co `gameConfig` przy `canFoundCity` main.ts:38483); (b) AI — do `AITurnOpts` przekazywanego `decideAITurn` dodac `cityLimitBase: _menuCityLimitBase`. Bez tego flaga jest `undefined` → krok wylaczony, zero zmiany w grze (bezpieczne, ale funkcja nie dziala u gracza ani AI). Zakres wiazania ~3 linie.
2. Miasta-panstwa (`defensiveCopy`) wylaczone z E-FORT — parytet z F4 `planExpansionFortBuilding` (wylaczone z ekspansji terytorialnej). Dispatch wymienia „AI/miasta-panstwa 100%" tylko jako budzet; jesli wlasciciel chce forty takze dla panstw-miast: usunac `!opts.defensiveCopy` (ai.ts:2664).
3. `FORT_CLAIM_MIN_NEW_HEXES = 1` (dosłownie „maksimum", bez progu minimalnego zysku) — do strojenia.
4. Zlozeniem „cennego terenu" jest `hexHasDepositReserve` (zloze lub nakladka zlozowa, rowniez zloza zwierzat) + Gory; Las/Brak nie.
5. Okregi fortow rozlaczne = „bez nakladania" (strict); zachodzenie na teren MIAST dozwolone.
6. Nie zmierzono (NIE_ZMIERZONO): czy fort na heksie ze zlozem blokuje pozniejsza kopalnie na tym heksie w pelnej grze (kwalifikator dopuszcza wspolistnienie warstw, improvement-build.ts:~986; test D/H z kopalnia na tym samym heksie przechodzi, ale nie jest testem silnika); zachowanie w pelnej grze z main.ts (brak wiazania).
7. Pytania ABC: BRAK zadanych (zgodnie z zakazem); konflikt z `planExpansionFortBuilding` nie wystapil (rozlaczne warunki).

# 7. Sprzatanie
`gra/node_modules` usuniete; esbuild/tmp w `os.tmpdir()` kasowane przez testy; brak plikow w `gra/` poza allowlista; commit z jawnym `git add` (3 pliki).
