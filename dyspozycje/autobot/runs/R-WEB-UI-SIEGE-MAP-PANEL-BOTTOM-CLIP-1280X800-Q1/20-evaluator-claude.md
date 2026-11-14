# R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1 — raport Evaluatora (adwersarialny, runda 1/5)

STATUS: PASS-WITH-NOTES (Evaluator nie wydaje werdyktu końcowego; poniżej 4 zarzuty do rozstrzygnięcia przez Obronę/FC)
DOMAIN: GAME
TEMAT: R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1
GOAL: panel oblężenia (gra/src/ui/siegeMapPanel.ts) przy 1280×800 i 1024×768 z blokiem budowy machin nie jest przycięty u dołu; przyciski Oblegaj/Szturm/Odwrót w pełni widoczne nad dolnym banerem (≤ bar.top − 4 px).
BAZA: 75e238e52 · KANDYDAT: 4fb1dec3a (odtworzone samodzielnie; własny `npm ci --ignore-scripts`, własne buildy Vite do katalogu scratchpad, nie `npm run build`).

## ZMIANY/COMMIT (allowlista)
`git diff --name-only 75e238e52 4fb1dec3a` = 8 plików: gra/src/ui/siegeMapPanel.ts, gra/tools/siege-map-panel-bottom-clip-1280x800-test.cjs, 6 plików w runs/<ID>/ (10-operator-claude.md, 5 evidence). Wszystko w allowliście; brak WERSJE.md, gra-robocza/, rust-port/, JSON, logiki oblężenia. `git diff --check 75e238e52 4fb1dec3a`: czysto (brak wyjścia).
Ten raport: jedyny dodany plik tej rundy.

## TESTY (odtworzone przeze mnie na kandydacie 4fb1dec3a, surowe wyjście)
- `npx tsc --noEmit` (gra/): exit 0, brak wyjścia.
- logic-test: `LOGIC OK (213/213)` RC=0
- tech-tree-test: `20 pass, 0 fail` RC=0
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN` RC=0
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)` RC=0
- combat-test: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.` RC=0
- Wszystkie 5 bramek zielone na kandydacie — brak potrzeby rozróżniania regresji od długu bazowego.
- Test tematu na buildzie kandydata: RC=0, verdict PASS, errors [] (1280×800: przyciski 525–653, bar.top 704, limit 700, stopka bottom 693; 1024×768: 493–621, bar.top 672, limit 668, stopka 661). Zgodne z raportem Operatora.
- Dowód mutacyjny (odtworzony): ten sam test na buildzie z siegeMapPanel.ts z 75e238e52: RC=1, verdict FAIL, na obu viewportach 4 niezaliczone sprawdzenia (3 przyciski + stopka); przyciski 814–942 przy limicie 700/668. Kryterium 3 spełnione (cofnięcie całego pliku). Nie rozdzielono wkładu dwóch zmian (dock vs fitOverlayAboveBottomBar) — NIE_ZMIERZONO.
- Zrzut kandydata 1280×800 OBEJRZANY: przyciski w pełni widoczne nad banerem, stopka widoczna. Zrzut bazy OBEJRZANY: przyciski poza widokiem, stopka pod banerem. Kryterium 1 i 2 (pomiar getBoundingClientRect) spełnione dla przycisków i stopki.

## ZARZUTY (ponumerowane)

1. Blok budowy machin jest po naprawie całkowicie poza widocznym obszarem przewijanej treści. Własna sonda (getBoundingClientRect na kandydacie): 1280×800 — ciało `.civ-smp-body` ma widoczne 284 px z 591 px (scrollTop 0), a wszystkie 4 przyciski machin (top 555–717) leżą poniżej dolnej krawędzi ciała (497): `machVisibleInBody` = [false,false,false,false]; 1024×768 — ciało 252/591 px, też 4× false. Na zrzucie PO nagłówek „Zbuduj machinę w oblężeniu" i przyciski machin w ogóle nie są widoczne i nie ma żadnej wskazówki przewijania. Na bazie ≥3 machiny były widoczne od razu. Dispatch dopuszcza „przewijanie wewnątrz panelu", ale kryterium 2 mówi „przy wszystkich 4 widocznych machinach" — Operator mierzył tylko przyciski akcji, nie osiągalność machin. Ocena sporna (UX-regresja vs dozwolone przewijanie) — do rozstrzygnięcia przez FC.

2. Dla niskich okien panel degeneruje się: nowy `.civ-smp-dock` ma stałe ~166 px (prompt + 128 px przyciski + padding) i nie kurczy się (flex-shrink:0), a stopka 30 px. Sonda 1280×600 (poza zakresem dispatchu, ale realna): ciało `.civ-smp-body` ma 84 px z 591 px. Brak `min-height` dla ciała. Dla 1280×800 i 1024×768 zostaje 284/252 px. Zakres kryteriów nie obejmuje <768 px, więc to ryzyko, nie niespełnienie kryterium.

3. Test regresji ma luki asercji: (a) zbiera `machines` (nazwy 4 przycisków), ale nie sprawdza ich liczby ani widoczności/osiągalności — przy 0 machin przejdzie (warunek „przy 4 widocznych machinach" z kryterium 2 nie jest w ogóle asercją, tylko wejściem scenariusza); w mojej sondzie machiny były 4 w DOM; (b) selektor `.civ-smp-overlay` w `#civ-siege-map-panel` zwraca null (sam `#civ-siege-map-panel` jest nakładką), więc pole `overlay` w JSON jest zawsze null — martwy pomiar, bez wpływu na werdykt; (c) `bodyScrollable` zbierane, nie asertowane; (d) pomiar po 1,2 s, a w kandydacie rects 1280×800 i 1024×768 miały przesunięcie poziome +24 px (foot 935–1293 przy viewport 1280, root 922–1282), którego nie ma na zrzucie i w 1280×600 — prawdopodobnie animacja `smp-in` (translateX 12 px, dwie zagnieżdżone) jeszcze nie zakończona w swiftshader; przyczyny nie rozstrzygnięto (NIE_ZMIERZONO). Sprawdzenia pionowe (bottom ≤ bar.top−4) nie zależą od translateX, więc werdykt PASS dla kryterium 2 stoi.

4. Nie przetestowano ścieżki telefonu (≤480 px, gdzie `fitOverlayAboveBottomBar` celowo nie nadpisuje CSS `bottom:64px`) ani ponownego dopasowania po zmianie wysokości baneru poza zdarzeniem `resize` (np. zmiana zawartości baneru, otwarcie innego panelu). NIE_ZMIERZONO; deklaracja Operatora o telefonie to założenie. Test używa wyłącznie Chromium/swiftshader, dsf 1 (jak w dispatchu).

## Uczciwe NIE_ZMIERZONO
- wkład osobny: dock vs `fitOverlayAboveBottomBar` (mutacja częściowa nie wykonana);
- przyczyna +24 px poziomo w pomiarze;
- viewporty ≤480 px, <700 px wysokości, inne przeglądarki;
- klikalność przycisków akcji (nie wykonano click) — mierzono wyłącznie geometrię; przyciski są poza przewijaniem, więc kolizja z elementami HUD o wyższym z-index nie została sprawdzona (elementFromPoint nie użyte).

BLOKADY: brak (infrastruktura: brak node_modules w worktree — `npm ci --ignore-scripts` wystarczył).
RUNDY: 1/5 (Evaluator).
UWAGI-DLA-ORKIESTRATORA: w repo brak `00-dispatch.md` na origin/main (jest tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); DODATEK nie zawierał treści odmiennej od dispatchu (zawartość identyczna). Nie tworzono sesji ani zadań.
NASTĘPNY KROK: Obrona (HAIKU) na zarzuty 1–4, potem Final Control (SONNET).
DEPLOY/PUSH: NIE WYKONANO
