STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1
GOAL: Przez pierwsze 25 tur główne AI nie wypowiadają sobie "zwykłej" wojny (Priorytet 4
decideAIDiplomacy); ataki na miasta-państwo i wojny wymuszone (era) bez zmian; po turze
25 zachowanie wraca do normy. Dodatkowo: sprawdzić czy AI wystarczająco agresywnie dąży
do limitu miast per epokę.

ZARZUTY: brak.

Adwersaryjna weryfikacja (Evaluator, niezależna od kodu/testów Operatora — nowy plik
testowy napisany od zera, plus niezależna rekonstrukcja baseline z historii Git, nie z
`git stash` Operatora):

(1) Niezależny test `eval-early-war-window.cjs` (bundlowany świeżo esbuild z żywego
    `gra/src/game/ai.ts` na SHA 8b013fb1) — 6 nowych scenariuszy, różnych od
    `ai-early-no-major-war-test.cjs` Operatora:
    - Mieszana tablica relacji w JEDNYM wywołaniu (major zablokowany + miasto-państwo
      dozwolone + gracz partnerId='0' dozwolony) w turze 12 — wynik zgodny z GOAL:
      major-vs-major brak wojny, CS i gracz nadal atakowani. Potwierdza, że warunek
      działa per-relacja (pętla `for (const rel of inp.relacje)`), nie globalnie.
    - Granica okna dokładnie: tura 25 zablokowana, tura 26 odblokowana (brak off-by-one).
    - Wszystkie 4 ścieżki wymuszonej wojny (cluster/bronze/stone/iron ForceWarTargetId)
      przetestowane RAZEM w turze 5 z partnerem MAJOR — każda nadal wypowiada wojnę
      (odczytane też źródłowo: cztery wczesne `return` w `decideAIDiplomacy` linie
      5090-5176 stoją PRZED pętlą per-relacja i nie odwołują się w ogóle do
      `AI_MAJOR_EARLY_NO_WAR_TURNS`/`isMinorCivPartner` — okno strukturalnie nie może
      ich dotknąć).
    - `isMinorCivPartner` całkowicie brakujące (undefined) w relacji traktowane jak
      `false` (major) → bezpieczna strona (blokuje), nie odwrotnie.
    - Tura odległa (9999) identyczna z turą 26 — brak dryfu/trwałego efektu.
    - Jeden kandydat-zarzut wygenerowany przez mój własny test (scenariusz (3):
      "okno nie tłumi całej dyplomacji, tylko P4") odrzucony po weryfikacji: ten sam
      zestaw relacji zwraca PUSTĄ listę komend RÓWNIEŻ poza oknem (tura 100) — czyli
      pusty wynik wynika z samego doboru progów w moim scenariuszu (nie spełnia P5/P6),
      nie z nowego warunku. Fałszywy alarm mojego testu, nie defekt kodu — odnotowuję
      dla przejrzystości metodyki, nie jako zarzut.
    Wynik: 12/12 przeszło po odrzuceniu fałszywego alarmu (11 pierwotnych asercji +
    weryfikacja że (3) nie jest realną regresją).

(2) Niezależna rekonstrukcja PRZED (bez polegania na `git stash` Operatora): wyciągnięty
    `git show 1ddbf133:gra/src/game/ai.ts` (rodzic commitu naprawy) do osobnego pliku,
    zbundlowany świeżym esbuild, uruchomiony mój własny scenariusz wrogiej relacji na
    turach 1/10/24/25/30 → wojna major-vs-major wypowiadana we WSZYSTKICH tych turach.
    Potwierdza niezależnie od zera (inny plik testowy, inna metoda ekstrakcji baseline
    niż Operatora) że regresja przed naprawą faktycznie istniała dokładnie jak
    zdiagnozowano w dispatchu — zgodnie z REGUŁĄ PRZECIW SAMOOSZUKIWANIU.

(3) Reprodukcja liczb z raportu Operatora (nie tylko zaufanie raportowi):
    - `ai-early-no-major-war-test.cjs`: 14/14 PASS (potwierdzone).
    - `tsc --noEmit`: 0 błędów (potwierdzone).
    - 5 bramek referencyjnych z R-PROC-AUTOBOT.md §6 (logic-test 213/213, tech-tree-test
      19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6) — wszystkie
      zielone, potwierdzone niezależnym uruchomieniem.
    - `ai-test.cjs`: 291 passed / 4 failed, dokładnie T2S-b (x2)/T2S-b2/T10b — potwierdzone
      IDENTYCZNIE. Dodatkowo zweryfikowałem (metodą inną niż `git stash`: `git archive`
      commitu 1ddbf133 do izolowanego katalogu wewnątrz `gra/` z `AI_SRC_DIR` env-override
      wspieranym natywnie przez `ai-test.cjs`, żeby zachować rozwiązywalność `node_modules`)
      że TE SAME 4 asercje failują też na czystym baseline sprzed JAKIEJKOLWIEK zmiany tego
      tematu — potwierdzone niezależnie, nie tylko powtórzone za Operatorem.
    - `ai-war-gate-test.cjs` (istniejąca bramka dyplomacji/wojny, nie wymieniona explicite
      w raporcie Operatora, ale w zakresie "diplomacy/wojna" sweep): 24/24 PASS.
    - Trzy pliki zgłoszone przez Operatora jako czerwone przed tym tematem
      (`diplomacy-audience-close-flush-test`, `diplomacy-negotiation-table-test`,
      `diplomacy-proposal-test`) uruchomione niezależnie — treść błędów (liczenie
      gołych wywołań `hideDiplomacyAudience()` w main.ts, logika kontroferty w
      negocjacjach, akceptacja pokoju bez koszyka) potwierdza że dotyczą wyłącznie
      main.ts/UI negocjacji, zero związku z `decideAIDiplomacy`/Priorytetem 4 — main.ts
      niedotknięty w tym temacie, więc to nie może być regresja tej zmiany.
    - `ai-early-city-founding-pace-test.cjs`: uruchomiona, 2/2 PASS. Uwaga metodologiczna
      (nie zarzut, bo pkt 3 ZADANIA jest poza BINARNYM KRYTERIUM): profile ekspansywność
      0/2/5 dają IDENTYCZNY wynik (121 miast po 60 turach, te same tury założenia) — test
      mierzy wyłącznie górny pułap kadencji przy hojnych zasobach, nie realne
      zróżnicowanie archetypów; wniosek "brak deficytu" jest zasadny dla pytania
      dispatchu (czy founding jest górnym priorytetem — tak, strukturalnie, osobna
      komenda przed kolejką budowy), ale dowód nie mówi nic o różnicach międzyprofilowych.
      Nie wpływa na PASS tego tematu (poza zakresem binarnego kryterium), zostawiam do
      wiedzy Final Control.

(4) Sprawdzenie źródłowe granic allowlisty: `git diff 1ddbf133 8b013fb1 --stat` potwierdza
    zmiany WYŁĄCZNIE w `ai.ts` (+28 linii), dwóch nowych plikach `ai-early-*-test.cjs` i
    `ai-test.cjs` (+10 linii) — main.ts rzeczywiście niedotknięty (potwierdzone niezależnie,
    nie tylko z raportu), zero ryzyka kolizji z `P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1`
    jak zadeklarowano. `isMinorCivPartner`/`currentTurn` na `RelacjaWejscie`/
    `DiplomacjaInputs` faktycznie istniały już przed tym tematem (potwierdzone `grep` w
    main.ts, zasilane przez `isOwnerClusterCityState` — funkcja pre-istniejąca, używana
    w >20 innych miejscach main.ts, nie coś nowo wprowadzonego przez ten temat, co obniża
    ryzyko błędnej klasyfikacji major/miasto-państwo).

(5) Prozaiczny warunek z GOAL "LUB gdy wymuszona wojna epoki już wystąpiła danej
    cywilizacji" (linia 8-9 dispatchu) rzeczywiście NIE jest zaimplementowany — ale
    literalne BINARNE KRYTERIUM SUKCESU (linie 81-84 dispatchu) wymaga wyłącznie
    powrotu po turze 25, nie tego dodatkowego warunku, i konkretna specyfikacja kodu
    w ZADANIU pkt 2 też go nie żąda. Operator to już jawnie zgłosił w BLOKADY z
    uzasadnieniem (stone forced war i tak startuje w turze 25, bronze rzadko < t.25).
    Nie podnoszę tego jako zarzut (kryterium binarne go nie wymaga), ale odnotowuję dla
    Final Control/orkiestratora: jest to rozjazd między prozą GOAL a formalnym kryterium
    końca, wart jednego zdania ABC do właściciela przy integracji, nie blokujący tej rundy.

TESTY:
- Wszystkie testy z sekcji wyżej uruchomione osobiście z `/home/user/wt-ai-wojna-wczesna-faza/gra`
  na SHA 8b013fb1 (branch `autobot/P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1`).
- Tymczasowe pliki mojej weryfikacji (`.eval-*-bundle.cjs`, `.eval-*-entry.ts`,
  `gra/.eval-baseline/`) utworzone i usunięte w tej samej rundzie — `git status` na
  koniec czysty poza pozycjami już zgłoszonymi przez Operatora w BLOKADY.

BLOKADY:
- Potwierdzam (niezależnie) dwie pozycje BLOKAD Operatora: zmodyfikowane PNG w
  `R-DYPLO-WARUNEK-NIESPELNIONY-CZERWONY-TOOLTIP-Q1/dowody/` i nowy `render.png` w
  `P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1/dowody/` — nadal obecne, nie moje, nie
  Operatora, poza allowlistą tego tematu.
- NOWE (nie w raporcie Operatora): w drzewie roboczym jest DODATKOWO niezacommitowana
  modyfikacja `gra/src/game/forced-war-iron.ts` (`serializeIronForcedWarState`:
  `pendingOwners` zamienione na `new Set<number>()`) — zidentyfikowana jako pozostałość
  mutacji `M20-save-gubi-pending` z `gra/tools/forced-war-iron-mutant-probe.cjs`,
  niecofnięta po jakimś wcześniejszym przebiegu. Poza allowlistą tego tematu, nie
  wpływa na wynik tej weryfikacji (`ai.ts` nie importuje `forced-war-iron.ts`,
  potwierdzone `grep` — tylko komentarz odsyła do tego pliku), ale to osobna,
  niezacommitowana zmiana w worktree, o której orkiestrator powinien wiedzieć przed
  integracją (ryzyko przypadkowego "posprzątania" albo odwrotnie, przypadkowego
  scommitowania tej mutacji razem z czymś innym).
- Rozjazd prozy GOAL vs binarnego kryterium (patrz punkt (5) wyżej) — do jednozdaniowego
  ABC przy integracji, nie blokuje tej rundy.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (Ścieżka A, Workflow) — zero zarzutów Evaluatora, temat
gotowy do przekazania dalej; zwrócić uwagę Final Control na dwie pozycje BLOKAD (stary
render.png/PNG-e nie z tego tematu ORAZ nowa: niezacommitowana mutacja
forced-war-iron.ts) oraz na rozjazd prozy GOAL/kryterium binarnego (punkt 5) do ABC przy
integracji.
DEPLOY/PUSH: NIE WYKONANO
