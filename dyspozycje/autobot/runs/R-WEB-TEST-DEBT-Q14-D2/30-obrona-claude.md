# R-WEB-TEST-DEBT-Q14-D2 — obrona Operatora (runda 3/5, odpowiedź na FAIL r2 Evaluatora i Final Control)

STATUS: FAIL
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D2 (kat. D, 2. połowa; zarzuty 1–7 z rundy 2)
GOAL: każdy z 5 czerwonych testów z zarzutu 1 ma klasyfikację z dowodem albo jest naprawiony; asercje nie osłabione; bramki zielone.
BAZA: kandydat c25dc4b8ff6ebbb4d4283d85cad66f2cb47fbc71 (raport r2). Zero zmian w gra/src i gra/data.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ — 5 czerwonych testów. Stan po rundzie 3: zelazo-gate 24/24 (naprawiony), manual-rebalance-owner-era 6/0 (naprawiony), pozostałe 3 nadal czerwone z klasyfikacją (rydwan-bierny-atak, trade-routes-income H2e, war-allin-capital) — patrz pkt 3, 4, 5. Status FAIL, bo war-allin nie ma klasyfikacji z dowodem.
2. PRZYJMUJĘ i NAPRAWIONO — zelazo-gate-test. Przyczyna z dowodem: od commita e06ad53c8 `availableProduction` (src/game/production.ts, blok „Koszary gate") wymaga `koszary` w `builtBuildingIds` dla jednostek epoki Brązu i wyższych. Fixture (`builtBuildingIds: ['odlewnia_zelaza']` / `[]`) nie zawierał `koszary`, więc Legionista i Procarz odpadały przed bramką żelaza. Sprawdzone: fixture z samą zmianą `Epoka: 'Żelazo'` nadal daje 4/24 (więc nazwa epoki NIE jest przyczyną — `EPOCH_BY_NAME` zawiera 'Zelazo' = 3). Dodanie `koszary` do wszystkich fixture'ów: 24/24 zielone. Asercje nie zmienione. Klasyfikacja: HARNESS (fixture). Commit feff53ab6.
   Nie wykonano mutacji zelaza (brak sprawdzenia, że negatywne asercje padają po usunięciu bramki) — NIE-ZMIERZONO.
3. PRZYJMUJĘ i NAPRAWIONO — manual-rebalance-owner-era-test. Przyczyna z dowodem: dane `gra/data/econ-era-rebalance-params.json` mają `eraRebalansAktywny: true` i `przychodyUlepszenStałeEpoka1: true` (commit e3898a7be / FALA 871), więc `isEraRebalanceImprovementFlat()` = true i `improvementYieldForEra` zwraca plony stałe. Probe `yieldOfMapHex` dla kopalnia_zlota/kopalnia_miedzi/oboz_lowiecki daje ten sam wynik dla epoki undefined, 1, 2, 3 (zloto praca 4/handel 11; miedz praca 4/handel 6; oboz praca 3/handel 4), więc ranking era3 = era1 jest zgodny z flagą, a nie błędem przekazania epoki. Naprawa: test przypina flagę OFF (`setEraRebalanceEnabledForTest(false)`) dla asercji przekazania epoki i dodaje asercję z flagą ON (ranking era3 = era1). Wynik: `pass=6 fail=0`; mutacja `MUTATE=noera` daje `FAIL` (exit 1). Klasyfikacja: HARNESS (konfiguracja flagi). Commit feff53ab6.
4. PRZYJMUJĘ — war-allin-capital-test 6b. Obie czerwone asercje podaję w całości: `aiVsAi: got d28c8b7ffce7a3ec, want 20a5bc2c7abcba1b` i `noLandPath: got e565af36b3773765, want 3484217518ceb4ba`. Wynik surowy: `96 passed, 2 failed`. Bisect (git bisect, ręczny, predykat z ustalonymi kopiami plików testu z HEAD, tylko gra/src i gra/data się zmieniają): punkt odniesienia 24ab89a1e zweryfikowany — `98 passed, 0 failed`, aiVsAi OFF = 20a5bc2c7abcba1b. Punkt HEAD — czerwony. Pierwsze dwa punkty pośrednie (7d8ba4d32 — czerwony; 0a6746fdb — test się nie uruchamia, bo harness nie pasuje do silnika tamtej epoki; pominięto). Kolejny punkt pośredni też nie uruchamia testu. Bisect NIEROZSTRZYGNIĘTY w ~3 krokach, bo harness przestaje działać na starszych drzewach (błąd uruchomienia, nie wynik). Klasyfikacja: NIE-ZMIERZONO. Nie zmieniono pinów (zgadywanie). Stan repo po bisect: `git bisect reset`, worktree czysty (HEAD feff53ab6).
5. PRZYJMUJĘ — rydwan-bierny-atak-test i trade-routes-income H2e nie mają jeszcze cytatu reguły w poprzedniej rundzie; poniżej dowody.
   - rydwan-bierny-atak (2 asercje: C „wróg poza zasięgiem nie wymusza zbliżenia”, D „rydwan z 1 punktem nie goni”). Test i kod dodane w tym samym commicie 64d5ac663 („rydwany aktywnie atakują/okrążają”, 2026-09-27). Opis commita mówi: rydwan bez celu-miasta „aktywnie zbliża się do najbliższej wrogiej jednostki w zasięgu ruchu”. Asercja C zakazuje zbliżenia do wroga w odległości 8 (zasięg ruchu rydwanu = 4). Asercja D zakazuje ruchu o 1 heks przy ruchLeft=1, a sam tytuł testu mówi „uses remaining points”; ruch o dokładnie 1 heks respektuje ten tytuł. Żadna reguła w docs/PORADNIK-GRACZA nie opisuje pościgu rydwanów (sprawdzone grep-em). Wniosek: intencja zapisana w commicie i asercje testu są sprzeczne. Klasyfikacja: DECYZJA WŁAŚCICIELA (nie BŁĄD-GRY bez reguły, nie STARY-PIN bez decyzji). Test zostaje czerwony; kod nie zmieniony.
   - trade-routes-income H2e (`one capital Mint raises tax cash in another city of the owner (mint=2, noMint=2)`). Cytat obowiązującej reguły: docs/PORADNIK-GRACZA/08-ekonomia-imperium.md §49.3b, linia 71: „Gdy cywilizacja odkryje Walutę i zbuduje Mennicę w stolicy, dzieją się dwie rzeczy naraz, dla **całej** cywilizacji (wszystkich miast tego właściciela)”. Commit 8ad10c70a zmienił tylko wartość mnożnika (per civ), NIE zasięg — zakres „całej cywilizacji” zostaje w przewodniku (diff 8ad10c70a tego akapitu nie dotyka). Test H2e (fixture: pH z Mennicą + Waluta, pH2 bez Mennicy, zysk podatku pH2 mint=2 = noMint=2) łamie tę regułę. Klasyfikacja: BŁĄD-GRY (kandydat z cytatem reguły i odtworzeniem w teście H2e). Test zostaje czerwony; kod gry NIE poprawiany (zakaz). Do potwierdzenia przez właściciela, że cytowany przewodnik jest obowiązujący.
6. PRZYJMUJĘ jako notę — stone-research-costs-test. Dowód zmiany pinu: skrót 3b7ab35b… (prefiks) był stanem tech.json przed commitami d3216eb2a / 0764ab4d6 (2026-11-10). Późniejsze commity zmieniające gra/data/tech.json (`git log -- gra/data/tech.json`): 0764ab4d6, d3216eb2a (2026-11-10), a33354586 (mury/cegła), 38d6ba0ec (kawaleria/oblężnicze za Żelazem), 2ca45a090 (ID/gramatyka), 361b35c11 i 2b15ae891 (merge, wikiBundle). Zmiany są zamierzone (opisy commitów). Pin zaktualizowany do db84a9b6…c795 pozostaje w rundzie 2 — ta runda nie zmienia testu.
7. PRZYJMUJĘ — kosmetyka. W raporcie r2 sekcja „Podsumowanie klasyfikacji” miała błędną liczbę. Prawidłowo wg numeracji r2: STARY-PIN 6 testów (#1, #3, #8, #10, #11, #16) + E1 w #2; HARNESS 9 (#2-A, #4, #5, #6, #7, #9, #13, #14, #17); BŁĄD-GRY kandydat 1 (#18 H2e, z cytatem); DECYZJA WŁAŚCICIELA 1 (#15 rydwan); NIE-ZMIERZONO 1 (#19 war-allin). Zielone: 15 z r2 + #20 zelazo (HARNESS w tej rundzie) = 16, a #12 manual-rebalance (HARNESS w tej rundzie) = 17. Czerwone: #15, #18, #19 (3). Suma: 17 + 3 = 20.

## Tabela (test | przed | przyczyna z dowodem | klasyfikacja | co zmieniono | po)

| test | przed (r2, solo) | przyczyna z dowodem | klasyfikacja | co zmieniono | po (solo, surowe) |
|---|---|---|---|---|---|
| zelazo-gate-test | exit 1, `NIEUDANE: 4/24` | brak `koszary` w fixture; bramka koszar (e06ad53c8) | HARNESS | `koszary` w builtBuildingIds (7 miejsc) | exit 0, `WSZYSTKIE TESTY ZIELONE (24/24)` |
| manual-rebalance-owner-era-test | exit 1, `pass=4 fail=1` | flaga ECONREBAL (dane) = plony stale; ranking era3 = era1 | HARNESS | przypięcie flagi OFF dla asercji epoki + asercja ON | exit 0, `pass=6 fail=0`; MUTATE=noera exit 1 |
| rydwan-bierny-atak-test | exit 1, `4 passed, 2 failed` | sprzeczne asercje vs opis commita 64d5ac663 | DECYZJA WŁAŚCICIELA | — (test czerwony) | exit 1, `4 passed, 2 failed` |
| trade-routes-income-test (H2e) | exit 1, `133 passed, 1 failed` | docs 08 §49.3b l.71: Mennica dla całej cywilizacji | BŁĄD-GRY (kandydat z cytatem) | — (test czerwony) | exit 1, `133 passed, 1 failed` |
| war-allin-capital-test | exit 1, `96 passed, 2 failed` | NIE ZMIERZONO (bisect nierozstrzygnięty, harness nie działa na starszych drzewach) | NIE-ZMIERZONO | — | exit 1, `96 passed, 2 failed` |

## Bramki
Ta runda zmienia wyłącznie gra/tools/zelazo-gate-test.cjs i gra/tools/manual-rebalance-owner-era-test.cjs (zero zmian w src/data). Bramki tsc/logic/tech-tree/research/unit-replace/combat/ai-test/era-war/ai-ai nie były ponownie uruchamiane w tej rundzie — NIE-ZMIERZONO w tej rundzie (wynik r2 zachowany: zielone na bazie Operatora). Przed integracją: orkiestrator powinien uruchomić je na SHA czubka.

## BLOKADY
- Techniczna: brak.
- Procesowa: (a) rydwan-bierny-atak wymaga decyzji właściciela (która zasada obowiązuje: brak pościgu poza zasięgiem vs aktywne zbliżenie z commita 64d5ac663); (b) H2e wymaga potwierdzenia, że przewodnik §49.3b (zasięg Mennicy na całe imperium) obowiązuje; (c) war-allin-capital 6b nie ma klasyfikacji z dowodem — wymaga bisecta na innym środowisku/harnessie zgodnym z historią albo akceptacji NIE-ZMIERZONO przez orkiestratora.

## UWAGI-DLA-ORKIESTRATORA
- Pytanie ABC do właściciela (proponowana rekomendacja): (1) rydwan — rekomendacja: zachować obecny kod (aktywne zbliżenie do wroga w zasięgu ruchu, zgodnie z commitem 64d5ac663) i przepisać asercje C/D do tej reguły; (2) Mennica H2e — rekomendacja: potwierdzić zasięg „cała cywilizacja” z przewodnika; jeśli tak, to BŁĄD-GRY do R-WEB-*.
- Kandydat BŁĄD-GRY: trade-routes-income H2e (repro: test H2e, cytat docs/PORADNIK-GRACZA/08-ekonomia-imperium.md l.71).
- Bisect war-allin: zapisane zerowe punkty: 24ab89a1e good (98/0), HEAD bad; punkt 7d8ba4d32 bad; dwa kolejne punkty pośrednie nieuruchamialne (harness). Ręczny bisect wymaga sprawdzenia harnessu na starszych drzewach.
- Mutacja zelazo nie wykonana (NIE-ZMIERZONO).
- Po tej rundzie w gra/ zostaje node_modules (sprzątane przed zakończeniem).

NASTĘPNY KROK: orkiestrator decyduje o pytaniach ABC (rydwan, H2e) i ewentualnie o war-allin (akceptacja NIE-ZMIERZONO albo kolejny temat bisecta). Operator r4 (jeśli orkiestrator zleci) — tylko war-allin i mutacja zelaza; rydwan/H2e zostają czerwone do decyzji.
RUNDY: 3/5
DEPLOY/PUSH: NIE WYKONANO
