STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-ROADS-CITY-LINKS-ONLY-Q1
GOAL: Automat (AI i auto-ulepszenia gracza) buduje `droga`/`droga_brukowana` tylko jako połączenia między miastami tej samej cywilizacji, bez wypełniania terytorium siatką.

ROLA: Operator (obrona), odpowiedź na werdykt Evaluatora R1 (PASS-WITH-NOTES, 7 zarzutów).
Baza: stan Operatora R1 `4ffcbf59b` scalony z `origin/main` 15c99e09f (merge bez konfliktów). Gałąź `op-roads-r2`.

ODPOWIEDZI NA ZARZUTY

1. Dowód wizualny nie jest zrzutem canvasu mapy. PRZYJMUJĘ, poprawione.
   Zbudowano bundle vite poza repo (outDir w scratchpadzie) z drzewa po scaleniu i z `origin/main` (PRZED). Realna gra w Chromium, realny endTurn, 5 miast gracza, automatyzacja budowy włączona (`setAutoBuild`), profil Zrównoważone, 50 tur. Zrzut elementu `canvas` (3D mapa), nie render snapshotu:
   - `zrzut-canvas-realna-mapa-PRZED-t51.png`: gęsta siatka trójkątów dróg na całym terytorium.
   - `zrzut-canvas-realna-mapa-PO-t51.png`: pojedyncze linie między miastami (Rzym-Akwileja, Rzym-Weje, Rzym-Mediolan, Rzym-Rawenna), węzeł Y przy Rzymie.
   Skrypt: `live-roads-r2.cjs`.

2. Pomiar live na wersji sprzed optymalizacji. PRZYJMUJĘ, powtórzone na HEAD (planista z 5-NN i cache).
   Live, tura 51, 5 miast, ta sama konfiguracja, ziarno 7:
   - PRZED (origin/main): 93 heksy dróg, 142 trójkąty, 0 ślepych końców.
   - PO (HEAD): 12 heksów dróg, 1 trójkąt, 0 ślepych końców.
   Czas endTurn (cała tura gry, ms): PO mediana 8652 / p90 9881; PRZED mediana 7433 / p90 10740. Rozrzut między przebiegami (okno na końcu 8470 vs 10645, a w poprzednich pomiarach live odwrotnie 5922 vs 7256 ms) jest większy niż różnica, więc nie da się z tego wnioskować o koszcie planisty. Koszt samego wyboru AI zmierzono wcześniej w symulacji (121,9 -> 113,5 ms/turę). Wniosek: brak dowodu na wzrost; precyzyjnego narzutu planisty w żywej grze NIE_ZMIERZONO.
   Uwaga: pomiar dotyczy gracza z włączoną automatyzacją; w tym horyzoncie skaner nie wykazał dróg AI (byOwner zawiera tylko właściciela 0), AI pokrywa test symulacyjny (`ai/*`).

3. Test kołowy i luźny. PRZYJMUJĘ, poprawione w `gra/tools/roads-city-links-only-test.cjs`.
   - `offPlanClean === 0 || offPlanNow === 0` rozbite na dwie osobne, ścisłe asercje (obie `=== 0`).
   - `roadHexes <= planSize + 2` zaostrzone do `roadHexes <= planSize`.
   - Dodana asercja niezależna od planisty: zero ślepych końców (heks drogi z <= 1 sąsiadem w grafie drogi+miasta), bo sieć między miastami nie ma odnóg donikąd.
   Wynik: 57 OK, 0 FAIL (było 45). Mutacja na `gra/src` z `53733cd34`: 25 OK, 32 FAIL, EXIT=1 (`gate-r2-mutation.txt`).

4. Trójkąt/węzeł Y, nie 100% bez wielokątów. ODRZUCAM jako błąd, PRZYJMUJĘ jako udokumentowane ograniczenie.
   Dowód: wygładzanie usuwa heks z trójkąta tylko, gdy jego sąsiedzi zostają połączeni (kod kroku 4 w `road-network-plan.ts`). W węźle, gdzie 3 odnogi schodzą się w sąsiadujących heksach, usunięcie rozłączyłoby sieć. Skala w żywej grze: 142 trójkąty -> 1; test ogranicza do `<= miasta-2` i mierzy komórki >= 4 sąsiadów. Przeplanowanie węzłów to większa zmiana algorytmu bez wpływu na cel (brak wypełnienia siatką); zostawione do decyzji Final Control/właściciela. Zero cykli długich: sieć to drzewo MST.

5. Plan ograniczony do własnego terytorium (komponenty [7,2,2,1]). ODRZUCAM.
   Dowód: kwalifikator budowy w `map/improvement-build.ts` wymaga własnego terytorium; droga poza nim nie może powstać, więc łączność przez cudze/neutralne pola nie jest wykonalna bez zmiany zasad budowy (poza zakresem). Zgodne z założeniem w raporcie R1 ("Ścieżki tylko po własnym terytorium"). Test mierzy `planDisconnectedPairs` i sprawdza łączność tam, gdzie ląd jest osiągalny.

6. Dwa testy z `ROBOCZA_HTML` nieuruchomione. PRZYJMUJĘ, uruchomione na bundlu z tego drzewa i na bundlu `origin/main` (PRZED).
   - `autoimprove-river-forest-live-verify-q1-test` (ziarno 18, 20 tur): wynik PO i PRZED identyczny dla gracza (sumWorkedBefore 266, sumCut 0, sumMissed 266, rfOwned0 66), AI: aiRfOwned 325->256 (PO) vs 325->246 (PRZED), aiPersistMissedSum 1 vs 2. EXIT=0 oba.
   - `autoimprove-river-forest-clear-no-citizen-q1-test` (ziarno 7, 30 tur, ASSERT=1): PO i PRZED dają ten sam wynik i te same 2 FAIL ("pierwsza wycinka widoczna najpozniej w turze 2", "wycieto pola BEZ obywatela"), bo gracz ma 0 wycinek w obu bundlach. To stan niezależny od tej zmiany: na `origin/main` automatyzacja budowy gracza jest domyślnie wyłączona (R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1), a test jej nie włącza. AI: cut 228 (PO) vs 232 (PRZED), różnica na poziomie szumu. Nie jest to regresja z tej zmiany (ta sama awaria na bazie), ale test wymaga osobnej naprawy fikstury (`setAutoBuild(true)`), poza allowlistą tego tematu.

7. Ryzyko integracyjne z AUTOBLD2. PRZYJMUJĘ, sprawdzone.
   `git merge origin/main` (15c99e09f) czysto, bez konfliktów; `auto-improvements.ts` nie był zmieniony na `origin/main` względem bazy `53733cd34` (brak hunków do rozjazdu na dziś). Po scaleniu przeszły wszystkie bramki poniżej. Jeśli AUTOBLD2 wyląduje później, scalić na świeżym `origin/main` ponownie.

ZMIANY/COMMIT: allowlista tej rundy: `gra/tools/roads-city-links-only-test.cjs` oraz `dyspozycje/autobot/runs/R-WEB-AI-ROADS-CITY-LINKS-ONLY-Q1/**`. Kodu produkcyjnego nie zmieniano. SHA w raporcie końcowym.

TESTY (HEAD po scaleniu z origin/main, wszystkie EXIT=0):
roads-city-links-only 57/0; autoimprove-stages-q1 299/0; auto-improvements 46/0; ai-improvements 56/0; auto-improve-q3 41/0; auto-improve-no-item-cap 15/0; irrigation-after-farms 42/0; live-hooks 37/0; river-forest-first-q1 12/0; ai-food-improvement-priority-stages 13/0; road-connectivity 99/0; road-hook-mainguard 19/0; map-improvement-qualify, improvement-territory-gate EXIT=0; `tsc --noEmit` EXIT=0. `ai-test` i `war-allin-capital-quick` nie powtarzane (kod produkcyjny bez zmian od R1, wynik R1: 274/20 = punkt odniesienia, hashe identyczne). Logi: `gate-r2-*`.

BLOKADY: brak blokujących. NIE_ZMIERZONO: precyzyjny narzut czasowy planisty w żywej grze (szum), 100 tur live (limit 590 s na wywołanie; zmierzono 50 tur).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator R2 / Final Control (uwagi 4 i 6 do decyzji).
DEPLOY/PUSH: NIE WYKONANO
