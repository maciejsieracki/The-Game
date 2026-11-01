STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1
GOAL: farma przed trzoda przy rzece (rejestr #1: E1 farma -> E2 wycinka+farma -> E3 trzoda -> E4 irygacja); r2: heks SASIADUJACY z rzeka liczy sie jak heks nad rzeka (decyzja orkiestratora ABC-B).
ZMIANY/COMMIT: SHA w sekcji na dole (commit zbiorczy r2). Baza: `f0fa961dd` + merge `origin/main` (`50edcc264`); konflikt komentarza w `auto-improvements.ts` rozwiazany (zachowany NOWY komentarz main + kod poprawki).

## Uwaga procesowa
Zlecenie obliczone przez skrypt mowilo „Runda 1/5, raport 01-operator-r1.md”, ale `01-operator-r1.md`, Obrona r1 i FC r1 juz istnieja, a dispatch zawiera sekcje RUNDA 2/5. Wykonano RUNDE 2 wg dispatchu; raport zapisano jako `02-operator-r2.md` (nie nadpisano r1). Runda = 2/5.

## Zmiana kodu (`gra/src/game/auto-improvements.ts`)
- `onRiverHex = hasRiverAccess` (~:1185) — jedno zrodlo definicji (heks NA rzece: `riverPaths` albo `rzeka.obecna`, LUB sasiad heksu z `riverPaths`). Uzycie bez zmian w E1 (filtr ~:1361), E2 (`riverKrok0Ok` ~:1517, `rzekiDoZagospodarowania` ~:1543), E3 (~:1553, `keyBlockedOnHex` ~:1637), wycinka poza rzeka (~:1672).
- Nowe `isOnRiver` (pierwszy czlon `hasRiverAccess`, bez duplikacji) + 3-stopniowy klucz sortowania: NA rzece (0) < tylko sasiad (1) < reszta (2). Powod: bez tego sasiad blizej centrum wyprzedzal heks na rzece (padl `ai2-heks-po-heksie-test` B/I); sortowanie zachowuje dotychczasowa kolejnosc wewnatrz E1/E2.
- Komentarz specyfikacji E3 zaktualizowany.

## Testy kontraktu (zmiany; zadne asercje nie osłabione)
- `autoimprove-stages-q1-test.cjs`: helper `placedE1Done()` (stan wyjsciowy „E1+E3 juz wykonane” rowniez na pracowanych sasiadach rzeki) w 3 scenariuszach budzetu E4 (limit 20%, irygacja czeka, 10% x 400) i `placed` w scenariuszu „KROK 0 (rzeka+las)”. Uzasadnienie: przy ABC-B farmy/trzoda na sasiadach (E1/E3) slusznie poprzedzaja E4 i (koszt 20 > sufit) wstrzymuja nizsze etapy; to zmiana kontraktu E4, asercje sufitu/budzetu bez zmian. 302/0.
- `autoclear-priority-q1-test.cjs`: (d) odwrocone na kontrakt ABC-B (sasiad = E1, farma przed trzoda i irygacja; K1/K2); NOWE (m) Rodos (1 obywatel, trawa bez lasu przy rzece, centrum przy rzece: pierwsza budowa = farma, 3 farmy przed trzoda; K1/K2). 54/0 (bylo 44).
- POZA ALLOWLISTA (wymuszone przez ABC-B, minimalne, fixture/oczekiwanie zgodne z nowa definicja — do oceny FC): `ai-food-improvement-priority-stages-test.cjs` (stan wyjsciowy farm na centrum i sasiadach rzeki; kolejnosc AI: `farma,farma,wyrab,wyrab,farma,farma` zamiast `wyrab,wyrab,farma,farma`), `wyrab-rzeka-r2-test.cjs` test 5 („bez hodowli na heksach BEZ DOSTEPU do rzeki” zamiast „bez rzeki”). Bez nich bramki bylyby czerwone.

## TESTY (logi `gate-*-r3.txt`, kazdy z `EXIT=`)
- autoclear-priority-q1 54/0; autoimprove-stages-q1 302/0; auto-improvements-test 46/0; `tsc --noEmit` EXIT=0 (`gate-tsc-r3.txt`).
- Pokrewne (15 plikow): zielone, w tym `ai-food-improvement-priority-stages` 13/0, `ai2-heks-po-heksie`, `wyrab-rzeka-r2` 10/0, `hodowla-las`, `farma-nie-w-lesie`, `ulepszenia-praca-percent`. Czerwone bez zmian wzgledem bazy (zmierzone na kodzie r1 po merge): `ai4-popyt-obywatele` (1), `oboz-lowiecki-las` (19), `praca-jeden-podzial-kontrakt` (3) — identyczne.
- Mutacja (`evidence/mutacja-r2.txt`): `onRiverHex = isOnRiver` (forma r1, bez sasiedztwa) -> autoclear-priority 50/4 FAIL ((d) i (m), K1+K2) — test wykrywa regresje.

## Sweep (`evidence/sweep-r2-mapa-generowana.cjs/.txt`)
Zrzut mapy z Chromium z r1 jest nieosiagalny; uzyto `generujSwiat(778899,'standardowy','kontynenty')` (168x120, rzeka.obecna 4597), 200 miejsc, pop 2, K2, pula 300, +25/tura, 33%, pelne technologie. Metryka „trzoda przed otwarta farma na pracowanym heksie”: PRZED (kod r1) 37/200 -> PO 16/200. Rozbicie PO: 11x heks sasiadujacy z rzeka wylacznie przez `rzeka.obecna` (bez sasiada w `riverPaths`, wiec bez `hasRiverAccess`), 5x heks daleko od rzeki (E5, po E3/E4 — zgodne z #1). Dla heksow z `hasRiverAccess`: 0/200 (przed: 32). Cel „0/200” osiagniety dla definicji `hasRiverAccess`; reszta to luka definicji — patrz DECYZJA_WYMAGANA.

## NIE_ZMIERZONO
Zywy pomiar w Chromium (brak przegladarki w srodowisku Operatora; wymaga bundla z nowym kodem — build robi orkiestrator).

## DECYZJA_WYMAGANA (ABC, zgłasza orkiestrator)
A: sasiedztwo liczone jak irygacja/tartak (`hasRiverAccess`: sasiad w `riverPaths`; dzis, spojne z S3-1) — B: rozszerzyc sasiedztwo o sasiadow z `rzeka.obecna` (pokrywa 11/200 pozostalych przypadkow; zmienia tez blokade tartaku/obozu i definicje irygacji `isRiverAdjacent`, wiec osobny temat).

## BLOKADY
Brak.
## RUNDY: 2/5
## NASTĘPNY KROK: Evaluator (diff `auto-improvements.ts`, mutacje, ocena zmian poza allowlista, zywy build z poprawka).
## DEPLOY/PUSH: NIE WYKONANO
