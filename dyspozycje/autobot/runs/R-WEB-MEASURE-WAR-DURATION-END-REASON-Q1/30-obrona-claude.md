STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar)
TEMAT: R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1
GOAL: zmierzyć w pełnej grze (realny bundle, headless Chromium, seed 4242 i 7, do t120), ile trwają wojny, czym się kończą i ile dobiega do pokoju wymuszonego (100%). Gra bez zmian (zero zmian w gra/src i gra/data).
ZMIANY/COMMIT: runner wznawialny gra/tools/war-duration-measure.cjs (wersja 2); analizator gra/tools/war-duration-summarize.cjs; dane runs/.../dane/ (3 pliki jsonl.gz + summary.json + SHA256SUMS.txt). Commit: patrz sekcja SHA w odpowiedzi orkiestratorowi.
TESTY:
- tsc --noEmit (kopia gra/ na kandydacie b89aeb96f, zależności npm ci poza repo): exit 0.
- logic-test.cjs: LOGIC OK (213/213) (surowe wyjście: linia "LOGIC OK (213/213)").
- ai-test.cjs: "ai-test: 297 passed, 0 failed".
- Pomiar pełnej gry: 3 przebiegi do t120 (tabela niżej). Bundle: vite build poza repo z kopii gra/ + committed hook ai-war-weariness-live-audit-hook.cjs (dodaje window.__wwDump).
BLOKADY:
1. Ciągłość: nie udało się jednym procesem przejść 120 tur (bieg A zatrzymany przez limit 590 s Bash na turze 117). Wznowienie działa (slot gry + state.json), ale PRNG jest reseedowany ziarnem przy każdym wczytaniu slotu, więc odcinki wznawiane NIE są bit-identyczne z biegiem ciągłym. Dane B i C to przebiegi segmentowane (wznowienia przy t40/t45/t55/t60/t110/t115).
2. Miasta: w 3 przebiegach ŻADNA wojna nie zmieniła właściciela miasta (lostA/lostB = 0 w każdym rekordzie) i nie było eliminacji. Pytanie właściciela o wpływ zajętych miast NIE ZOSTAŁO ZMIERZONE empirycznie (tylko odczyt kodu z poprzedniej odpowiedzi).
3. Straty bitewne: __wwDump nie zawiera strat jednostek, więc wpływ przegranych przeciwników NIE ZMIERZONO (pozostaje odczyt kodu: poza licznikiem zmęczenia).
4. Powód końca wojny: gra go nie loguje. Klasyfikacja w summarize jest WNIOSKIEM z ostatniego rekordu wojny (poziom zmęczenia >= 1 = pokój wymuszony; brak wojny bez 100% = „inne/nieznane”). Pojedynczy przypadek bez 100% (seed 7, para 1-7) pozostaje nieustalony.
5. Liczba próbek mała: 7 wojen w 3 przebiegach. Wnioski liczbowe mają charakter wskazówki, nie rozkładu.
RUNDY: 2/5 (runda 1: BLOCK; ta runda: odpowiedź na zarzuty 1–6, poprawki i pomiar).
NASTĘPNY KROK: orkiestrator decyduje: (a) zaakceptować dane jako wstępny pomiar z blokadami 1–5, albo (b) osobny temat na pomiar ciągły bez limitu Bash (wymaga decyzji o czasie/limicie) i na zapis powodu końca wojny w grze (osobna zmiana w gra/src, nie w tym temacie).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedź na zarzuty Evaluatora

1. Brak tabeli/rozkładu/danych: PRZYJMUJĘ i uzupełniam. Tabela, rozkład czasu i liczby powodów są niżej; dane jsonl.gz i SHA256 w runs/.../dane/. Dokument w dyspozycje/analizy/ NIE został utworzony (zakres: wynik w tym raporcie) — NIE WYKONANO.
2. Runner wymaga __wwDump, którego nie ma w repo; patch nie zacommitowany: ODRZUCAM częściowo z dowodem. __wwDump jest wstrzykiwany przez COMMITOWANY skrypt gra/tools/ai-war-weariness-live-audit-hook.cjs (linie 16–17, dopisuje window.__wwDump do kopii main.ts). Runner nie wymaga osobnego .patch; wymaga kroku hook na kopii poza repo (opisany w nagłówku runnera). Przy budowaniu w tej rundzie hook zadziałał na kopii (zapatchowano src/main.ts kopii; repo bez zmian).
3. Brak wznawiania: PRZYJMUJĘ i naprawiam. Dodano slot gry (quickSave/loadSlot, slot `wwm-<seed>`), trwały profil (IndexedDB), state.json, obcinanie jsonl do tury slotu, tryb --stop-at. Zweryfikowane: wznowienia 40→45→55→60→110→120 (seed 4242), 60→115→120 (seed 7). Dodatkowo: retry klikania modali (closeEndTurnModals z ai-economy-measure-run.cjs), auto-rozstrzyganie bitew (clearBattles jak w diplomacy runner), odrzucanie ofert AI (measure-reject-offers.cjs), akceptacja pokoju wymuszonego przez pasywnego gracza (measure-forced-peace.cjs). Ograniczenie: reseed PRNG przy wznowieniu (patrz BLOKADA 1).
4. Pola końca wojny nie są w logu gry: PRZYJMUJĘ jako ograniczenie. Klasyfikacja jest w summarize (wniosek z rekordów), gra nie została zmieniona. Zapis powodu w grze to osobny temat (poza zakresem pomiaru).
5. Odpowiedź na pytanie właściciela to odczyt kodu: PRZYJMUJĘ. W tej rundzie nie ma pomiaru miast (BLOKADA 2) — pozostaje oznaczone NIE ZMIERZONO.
6. Bramki logic i ai-test oznaczone NIE ZMIERZONO: PRZYJMUJĘ i zmierzone w tej rundzie: tsc 0; logic 213/213; ai-test 297 passed, 0 failed (na czystym src z HEAD, kopia poza repo).

## Dane pomiarowe (summarize, surowe wyjście)

Oznaczenia: A = seed 4242, bieg ciągły do t117 (wyłączony limitem Bash, 116 rekordów); B = seed 4242, bieg segmentowany 1–40 świeży, 40–120 wznowienia; C = seed 7, bieg segmentowany 1–60 świeży, 60–120 wznowienia.

| bieg | para | start | koniec | czas (tury w wojnie) | typ | powód końca (wniosek) | zmęczenie w chwili końca | miasta zmienione |
|---|---|---|---|---|---|---|---|---|
| A | 0 vs 1 | 42 | 83 | 40 | wymuszona-epoki (bronze) | pokój 100% (wymuszony) | 1,00 | 0 |
| A | 4 vs 7 | 111 | trwa | 6 (koniec danych) | naturalna | trwa | 0,15 | 0 |
| B | 0 vs 1 | 42 | 83 | 40 | wymuszona-epoki (bronze) | pokój 100% (wymuszony) | 1,00 | 0 |
| B | 0 vs 7 | 113 | trwa | 7 (koniec danych) | wymuszona-epoki (iron) | trwa | 0,175 | 0 |
| B | 1 vs 4 | 120 | trwa | 0 (koniec danych) | wymuszona-epoki (iron) | trwa | 0 | 0 |
| C | 0 vs 1 | 42 | 83 | 40 | wymuszona-epoki (bronze) | pokój 100% (wymuszony) | 1,00 | 0 |
| C | 1 vs 7 | 108 | 118 | 9 | naturalna | inne/nieznane | 0,225 | 0 |
| C | 1 vs 4 | 119 | trwa | 1 (koniec danych) | wymuszona-epoki (iron) | trwa | 0,025 | 0 |

Rozkład czasu trwania (zakończone wojny, n małe):
- wojny naturalne: n=1, mediana 9, min 9, maks 9 (C 1-7);
- wojny wymuszone epoki: n=2 (A 0-1 i C 0-1; ten sam przebieg, bronze), mediana 40, min 40, maks 40.
- Zakończenia powodem: pokój 100% = 2; inne/nieznane = 1; trwa (koniec danych) = 4.
- Liczba wojen dobiegłych do 100% (pokój wymuszony): 2 z 3 zakończonych wojen (obie wymuszone bronze po 40 turach, zero zmian miast). Wojna naturalna nie dobiegła do 100%.

Odpowiedź liczbowa na pytanie „ile dobiega do pokoju wymuszonego i po ilu turach”: w 3 przebiegach do t120 — 2 wojny (ten sam wzorzec epoki brązu 0 vs 1) dobiegły do 100% dokładnie po 40 turach; żadna wojna naturalna nie dobiegła do 100% w obserwowanym oknie.

Obserwacja do sprawdzenia (nie wniosek): oba ziarna (4242 i 7) dają identyczną wojnę epoki 0 vs 1 w turach 42–83. Może to oznaczać, że mechanizm epoki nie zależy od ziarna (lub że ziarno nie zmienia tej ścieżki). Wymaga sprawdzenia przed interpretacją.

## Odpowiedź na pytanie właściciela (kontekst, NIE ZMIERZONO w zakresie miast i strat)

- Z danych: w 3 przebiegach miasta nie zmieniały właściciela w czasie wojny, więc nie ma danych o skróceniu przez miasta. Zakończenie „przed 40 turami” wystąpiło raz (C 1-7, 9 tur) bez zmiany miast i bez 100%.
- Z kodu (poprzednia odpowiedź Operatora, nadal aktualna): licznik zmęczenia = tury wojny/40 + 0,1 × miasta zmienione; straty bitewne poza licznikiem. Ta odpowiedź NIE jest pomiarem.

## DECISION_REQUIRED (jedno zdanie na wariant)
- Wariant A (kod): straty bitewne nie wchodzą do zmęczenia ani do desperacji; liczą się tylko miasta.
- Wariant B (dispatch): straty bitewne mają wchodzić do desperacji (wagaStrat × straty/3) — decyzja właściciela.
- Wariant C: czy miasta zmienione w obu kierunkach mają przyspieszać pokój wymuszony (obecnie tak).

## Pliki
- gra/tools/war-duration-measure.cjs (runner v2: wznawialny, nagłówek opisuje kroki bundla i ograniczenia)
- gra/tools/war-duration-summarize.cjs (analizator: tabela, rozkład, powody końca jako wniosek)
- dyspozycje/autobot/runs/R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1/dane/ (A-cont-4242.jsonl.gz, B-segm-4242.jsonl.gz, C-segm-7.jsonl.gz, summary.json, SHA256SUMS.txt)
