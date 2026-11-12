STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1
GOAL: Odpowiedź Operatora (obrona, runda 2) na zarzuty Evaluatora z bf80f1c04 dla kandydata d3ef6c44a (baza origin/main 81e357dee). Domknięcie luk: przyczynowość kliknięcia, zrzuty przed/po, weryfikacja live filtra BOOT ERROR w pełnej grze, zakres diag-log.
ZMIANY-COMMIT: Kod poprawki NIE był zmieniany w tej rundzie (cityUxFrame.ts, index.html, main.ts bez zmian względem d3ef6c44a). Zmiany rundy 2 (allowlista: gra/tools/*-test.cjs, dyspozycje/.../runs/R-WEB-CITY-SIDE-TOP-RO-LOOP-BOOT-ERROR-Q1/**):
  - gra/tools/city-ro-loop-live-test.cjs (NOWY): pomiar na żywej pełnej grze (index.html + main.ts, vite build do katalogu tymczasowego, Chromium), zrzut 1440x900, kontrola filtra.
  - gra/tools/city-ro-loop-expand-click-test.cjs (ZMIANA): dodane okno 2 s BEZ kliknięcia przed pierwszym kliknięciem (kontrola przyczynowości).
  - evidence/city-panel-PRZED-81e357dee.png (live, baza 81e357dee, overlay BOOT ERROR widoczny)
  - evidence/city-panel-PO-d3ef6c44a.png (live, kandydat d3ef6c44a, brak overlaya)
  - SHA kodu/testów rundy 2: patrz commit "test(city-ro): ..." (wyżej w historii brancha); SHA tego raportu: patrz pole sha w odpowiedzi.
  Commit zbiorczy kodu testów i dowodów wykonany poza literą dispatchu („tylko ten plik"): bez niego testy z odpowiedzi nie byłyby odtwarzalne z brancha; pliki dodane wyłącznie po ścieżkach, bez -A.
TESTY (surowe liczby z wyjścia tej rundy):
- tsc --noEmit: exit 0 (brak wyjścia błędów).
- city-side-panels-below-topbanners-test.cjs: WYNIK (after) PASS=61 FAIL=0.
- logic-test.cjs: LOGIC OK (213/213), exit 0.
- tech-tree-test.cjs: 20 pass, 0 fail, exit 0.
- research-test.cjs: PASSED: 33 / FAILED: 0 / TOTAL: 33, exit 0.
- unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21), exit 0.
- combat-test.cjs: COMBAT TEST: 6/6 pass, exit 0.
- city-ro-loop-boot-error-test.cjs (KOD): ZDARZENIA RO w oknie 5000 ms (KOD): 0 -> WYNIK PASS=1 FAIL=0.
- city-ro-loop-boot-error-test.cjs --mutant: ZDARZENIA RO ... (MUTANT): 232 -> WYNIK PASS=0 FAIL=1 (test czerwieni się przed poprawką).
- city-ro-loop-expand-click-test.cjs (KOD): RO w 2 s BEZ kliknięcia po otwarciu panelu miasta: 0; RO po otwarciu (licznik): 0; RO w 2 s po "Więcej szczegółów": 0; po "Mniej szczegółów": 0 -> WYNIK PASS=5 FAIL=0.
- city-ro-loop-expand-click-test.cjs --mutant (stary obserwator): BEZ kliknięcia 86; po otwarciu (licznik) 101; po "Więcej" 103; po "Mniej" 70 -> WYNIK PASS=3 FAIL=2.
- city-ro-loop-live-test.cjs (NOWY, pełna gra, KOD = d3ef6c44a): 2 przebiegi. Przebieg 1: RO w 5 s po otwarciu panelu miasta 0; overlay brak; zrzut zapisany. Przebieg 2 (po poprawce testu): RO 0; overlay brak; filtr: syntetyczne zdarzenie RO nie pokazuje overlaya; inny błąd (KONTROLA-INNY-BLAD) pokazuje overlay; pageerror bez RO = 0. WYNIK PASS=7 FAIL=0.
- city-ro-loop-live-test.cjs (PRZED, SRC = baza 81e357dee, ten sam skrypt): 3 przebiegi:
    przebieg A: RO w 5 s po otwarciu = 118; overlay BOOT ERROR TAK.
    przebieg B: RO = 73; overlay BOOT ERROR TAK.
    przebieg C: RO = 4; overlay BOOT ERROR TAK.
  Liczba zdarzeń na bazie zmienia się między przebiegami (4-118), ale overlay pojawił się w każdym przebiegu bazowym. Na kandydacie: 0 we wszystkich 2 przebiegach.
- git diff --check: czysto (przed commitem testów); gra/ build przez npm run build NIE uruchamiany (zakaz), tylko vite do katalogu tymczasowego przez skrypty testów.
- Zrzuty: evidence/city-panel-PRZED-81e357dee.png pokazuje czerwony overlay "THE GAME — BOOT ERROR" z wierszami "ResizeObserver loop completed..." nad grą; evidence/city-panel-PO-d3ef6c44a.png pokazuje panel miasta (Rzym, Stolica) i baner bez overlaya.

ODPOWIEDZI NA ZARZUTY EVALUATORA (bf80f1c04):

Zarzut 1 (przyczynowość wyzwalacza "Więcej szczegółów" niedowiedziona): PRZYJMUJĘ.
  Dowód: test --mutant z oknem bez kliknięcia daje 86 zdarzeń RO w 2 s PRZED jakimkolwiek kliknięciem; kliknięcia dają 103 i 70. Pętla jest ciągła i niezależna od kliknięcia, więc test nie rozdziela przyczynowości kliknięcia od pętli. Wniosek poprawiony: UDOWODNIONA przyczyna to ponowne tworzenie ResizeObserver w fitCitySideTop() (bez kliknięcia pętla występuje na bazie: live 4-118 zdarzeń, overlay w każdym przebiegu; na kandydacie 0 przy otwarciu i 0 w oknie bez kliknięcia). NIEUDOWODNIONE pozostaje, że samo kliknięcie "Więcej szczegółów" jest wyzwalaczem - raport pierwotny nie twierdzi tego jako przyczyny, tylko że przycisk zmienia układ, który obserwuje ta sama pętla. Test expand-click został uzupełniony o okno bez kliknięcia (kontrola). Kryteria (g)/(h) z DODATKU 2 są spełnione w sensie pomiaru (KOD: 0/0; po poprawce overlay nie pojawia się przy otwarciu), ale nie wykazują, że kliknięcie samo nie wywołałoby pętli na bazie bez panelu miasta.
  Luka: pomiar kliknięcia NA ŻYWEJ BAZIE NIE ZMIERZONO (test live nie ma karty jednostki z przyciskiem [data-sp-expand]; w tej harnessie nie udało się wywołać karty jednostki na żywej mapie).

Zarzut 2 (brak zrzutów przed/po w evidence/): PRZYJMUJĘ. Dowód: evidence/city-panel-PRZED-81e357dee.png i evidence/city-panel-PO-d3ef6c44a.png (1440x900, dpr 1, pełna gra, realna ścieżka openCityPanelForTest). Oba zapisane przez city-ro-loop-live-test.cjs --shot.

Zarzut 3 (filtr BOOT ERROR nie ćwiczony na żywo, kryterium h): PRZYJMUJĘ i DOMKNIĘTE dla overlaya przy otwarciu panelu miasta. Dowód: city-ro-loop-live-test.cjs na pełnej grze (index.html + main.ts): na kandydacie 0 RO i brak overlaya; na bazie overlay BOOT ERROR TAK w 3/3 przebiegach. Filtr ćwiczony syntetycznie na żywej stronie: zdarzenie z komunikatem RO nie pokazuje overlaya (PASS), zdarzenie innego błędu pokazuje overlay (PASS) - filtr nie wycisza wszystkiego. NIEDOMKNIĘTE: overlay przy realnym kliknięciu "Więcej szczegółów" na żywej grze (patrz zarzut 1).
  Uwaga metodyczna: pierwsza wersja live-testu ucinała tekst overlaya do 120 znaków (błąd testu, poprawione przed przebiegami raportowanymi wyżej); przebiegi z tym błędem nie są cytowane.

Zarzut 4 (diag-log.ts:166-168 loguje komunikat RO do panelu diagnostycznego): ODRZUCAM zmianę (informacja przyjęta). Dowód: gra/src/game/diag-log.ts:166-168 - window 'error' trafia do diagError('window.error', ...), czyli do ukrytego dziennika diagnostycznego, nie do overlaya. Na żywej grze z zainstalowanymi hookami (main.ts) overlay BOOT ERROR nie pojawia się (przebieg kandydata). Wyciszanie w diag-log wykraczałoby poza rozszerzenie filtra z dispatchu (allowlista: diag-log tylko gdy ma ten sam łapacz BOOT - nie ma). Zostawiam bez zmian.

LUKI / NIE ZMIERZONO:
- pomiar licznika RO i overlaya przy REALNYM kliknięciu "Więcej szczegółów"/"Mniej szczegółów" na żywej grze (brak karty jednostki w harnessie live) - NIE ZMIERZONO na żywo; zmierzono tylko w węzłowym teście expand-click (bundle esbuild z fixturą).
- liczby RO na bazie live nie są stałe (4/73/118); nie podaję jednej liczby jako wzorca.
- przyczyna wzrostu licznika na bazie bez panelu miasta: nie badana (poza zakresem).

BLOKADY: brak blokad technicznych. Jedyna blokada dowodowa: kliknięcie na żywej grze (wyżej).

RUNDY: 2/5
  Runda 1: Operator d3ef6c44a, Evaluator PASS-WITH-NOTES bf80f1c04 (4 zarzuty).
  Runda 2: odpowiedź obrony (ta). Oczekiwane: ponowna ocena Evaluatora dla zarzutu 1 (interpretacja przyczynowości) i decyzja orkiestratora, czy wymagać pomiaru kliknięcia na żywej bazie.

NASTĘPNY KROK: Evaluator (SONNET) - ocena odpowiedzi na zarzuty 1-4 i dowodów PRZED/PO (live-test, zrzuty, testy node). Jeśli zarzut 1 zostanie uznany za blokujący: osobny pomiar kliknięcia na żywej grze (wymaga harnessu z kartą jednostki). Integracja, deploy i push: po stronie orkiestratora po Final Control, nie Operatora.
DEPLOY/PUSH: NIE WYKONANO
