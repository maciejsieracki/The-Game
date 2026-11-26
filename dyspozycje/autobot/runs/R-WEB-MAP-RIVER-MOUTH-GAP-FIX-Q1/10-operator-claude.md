# RUNDA 2/5 — diagnoza przyczyny ujść (kandydat 7b75309011bdd91b01426d2bc953bd55f78d062f)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-MAP-RIVER-MOUTH-GAP-FIX-Q1
GOAL: wymusić ujście głównej rzeki, gdy odstęp wzdłuż wybrzeża > limit (Standard 7, Mała 5); kontynenty 42 i pangea 7 do worstGap <= 7.
ZMIANY/COMMIT: brak zmian w gra/src (kod gry wycofany do 7b7530901 po eksperymentach). Commit zawiera: ten raport oraz repro/diag-patch.diff (eksperymentalna instrumentacja i wariant awansu rzeki, NIEZASTOSOWANY w kodzie gry; do odtworzenia diagnozy).
TESTY (surowe wyjścia, kontynenty seed 42, 168x120, Standard):
- Baza 7b75309 + liczniki diagnostyczne (bez zmiany zachowania): worstGapAll=18, złe masy (rozmiar:worst) 265:15, 145:11, 12:12, 12:9, 10:10, 590:10, 1011:8, 19:18 (8 z 20 mas). Czas: total=113774 ms (riversMain 75319, riversFill 33527) oraz 111649 ms przy drugim biegu z instrumentacją (różnica szumu ~2%).
- Wydajność PO naprawie: NIE ZMIERZONO (brak naprawy zgodnej z regułami).
- Test gra/tools/river-mouth-gap-enforce-test.cjs: czerwony na bazie (wg rundy 1), nie zmieniany w tej rundzie.
- Pangea 7, mała mapa, 3 dodatkowe mapy, bramki (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, climate-band, river-sea-buffer, rodzina rzek), piny, earth-template: NIE ZMIERZONO (brak zmiany kodu do weryfikacji).

DIAGNOZA (liczniki globalne z całej generacji kontynenty 42; NIE ZMIERZONO per masa — liczniki nie były rozbite na masy):
1. Ścieżka dopinania: topUpMainRiverCoastMouthGaps (gra/src/map/gen-helpers.ts:9781) -> topUpMainRiverCoastMouthGapsOnce (:9708) -> tryPlaceMainRiverAtMouth (:9931) -> traceRiverFromCoast (:6453) -> growRiverFromCoastInland (:6401) -> collectCoastInlandGrowCandidates (:6318).
2. Wywołania tryPlaceMainRiverAtMouth: 21763. Sukces (OK): 103. Porażki:
   - trace pusta ścieżka (path.length=0): 19691 (90%)
   - ścieżka zbyt krótka (<3 lub <6): 1266 + 379
   - zbyt blisko głównych (isPathTooCloseToRiverHexes): 15
   - growRiverFromCoastInland zwraca tylko ujście (length 1): 17750 (przyczyna dominująca); nie wychodzi nawet pierwszy krok w głąb lądu.
   - pathEndsAtSea odrzuca: 1941 (przy długości ≥2).
3. Powód pierwszego kroku (liczniki odrzuceń kandydatów sąsiednich ujścia, tylko pierwszy krok, suma po wszystkich wywołaniach): riverGrowStepPassesSep (sep 2 wobec rzek głównych, blockRiverKeys=mainKeys) 75879; canRiverFlowThrough z blockExisting (sąsiad ma już jakąkolwiek rzekę) 60215; seaDist<2 62731; flowOther (relief/Morze/nieprzepuszczalny) 32238.
4. Eksperyment A (awans istniejącej rzeki nie-głównej dochodzącej do brzegu w luce na main, ta sama kontrola sep 2): próby 16, odrzucone przez bliskość głównych 16, sukcesów 0. Worst bez zmian (18). Wniosek: rzeki nie-główne wchodzące na brzeg w lukach leżą przy rzekach głównych (sep<2); awans nie jest wykonalny zgodnie z regułą sąsiedztwa.
5. Eksperyment B (diagnostyczny, ŁAMIE regułę: gapPathSep 2 -> 1): worstGapAll 18 -> 16; złe masy 265, 145, 1011 naprawione; 19: 18 -> 9; nadal złe 12:12, 12:9, 10:10, 9:9, 590:10, 17:16, 19:9. Wniosek: sama reguła sep nie jest jedyną przeszkodą, a jej obniżenie nie domyka limitu i jest zakazane dispatchem.
6. Wniosek ogólny: na tych mapach brzeg w lukach jest zablokowany przez główne rzeki (sep 2) i przez istniejące rzeki w pierwszym kroku w głąb lądu. Lokalne wymuszenie ujścia bez zmiany topologii rzek nie istnieje w obecnym algorytmie. Usuwanie rzek nie-głównych w promieniu 3 (runda 1 i 2) nie zmienia dominującego blokera (sep wobec głównych).

NAJMNIEJ INWAZYJNE OPCJE DLA ORKIESTRATORA (żadna nie jest zrealizowana):
- A: przebudowa wyboru tras rzek głównych przed top-up (kolejność etapów generatora) tak, by zostawić wolne pasy przy brzegu w lukach; zmienia układ rzek na wszystkich typach map; wymaga testów river-density, river-path-adjacency, river-loop, cluster-plan i pinów. Wielorundowe (ryzyko kolejnej BLOCK bez gwarancji).
- B: zmiana reguły (limit 7/5 lub próg mas) — decyzja właściciela (pytanie ABC: wariant „dotrzymać 7” vs „zostawić obecne mapy i poluzować obietnicę”).
- C (dispatch pkt 2c): wyjątek dla małych mas (10–12 heksów) — NIE przetestowany w tej rundzie; masy 9–12 w diagnozie (12:12, 12:9, 10:10, 9:9) są poza progiem ≥50 heksów z dispatchu, więc wyjątek nie usunie większości przypadków dla mas 19 i 265 (19 i 265 nadal wymagają A lub B).

SKUTEK DLA GRY (do pytania ABC, sformułowany bez mechanizmu): na części wybrzeży kontynentów na mapie Standard odcinek bez ujścia rzeki ma do 18 pól, a obietnica to 7 pól. Naprawa zmieni rozmieszczenie rzek na wszystkich typach map (nowe mapy dla tych samych ustawień). Decyzja: czy dotrzymywać obietnicę kosztem układu rzek (A), czy zmienić obietnicę (B).
Szczegóły: gra/src/map/gen-helpers.ts:5727 (stała), :9708, :9931, :6401, :6318; test gra/tools/river-mouth-gap-enforce-test.cjs.

RUNDY: 2/5 (runda 1: BLOCK; runda 2: BLOCK z diagnozą per liczniki globalne). Ostatni werdykt Evaluatora: BLOCK/FAIL (r1). Decyzja wymagana: wybór A lub B (nie jest decyzją inżynierską bez wpływu na grę: zmienia układ rzek lub obietnicę).
NASTĘPNY KROK: orkiestrator: pytanie ABC do właściciela (A vs B) wg skutku powyżej; przy wyborze A kolejna runda Operatora (Sonnet po 2 nieudanych rundach Haiku, z uzasadnieniem: przebudowa kolejności etapów rzek). Diagnozy per masa (rozbicie liczników po masach) — do zrobienia w rundzie, jeśli wybór A.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Poprzednie liczby z rundy 1 (424/299/254 — odrzucenia kandydatów) są potwierdzone tylko jakościowo tym pomiarem (tu: 75879/60215/62731 sumy po wszystkich wywołaniach, inne okno liczenia).
- Node_modules w gra/ zainstalowano (npm ci --ignore-scripts) na potrzeby repro; usunięte po zapisie raportu.
- Test czerwony nie został uruchomiony w tej rundzie (czas ~2 min); wynik rundy 1: 0 pass / 2 fail.

---

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-MAP-RIVER-MOUTH-GAP-FIX-Q1
GOAL: wymusić ujście głównej rzeki, gdy odstęp wzdłuż wybrzeża > limit (Standard 7, Mała 5); kontynenty 42 i pangea 7 do worstGap <= 7.
ZMIANY/COMMIT: brak zmian w kodzie gry (gra/src wycofane do e80d07efb po diagnozie). Commit zawiera wyłącznie ten raport. Baza: e80d07efb.
TESTY:
- Odtworzenie bazy (r3, kontynenty 42, 168x120): worstGapAll=18, 8 z 20 mas łamie limit (zgodnie z dispatchem). Czas generacji total=114778 ms (riversMain 75351 ms, riversFill 34347 ms).
- NIE ZMIERZONO: pangea 7 po naprawie, 3 dodatkowe mapy, test river-sea-buffer, tsc i pozostałe bramki (brak kodu do weryfikacji).
- NIE ZMIERZONO: test czerwony/zielony i mutacja (nie napisano).
BLOKADY: naprawa wymaga decyzji projektowej (patrz niżej); lokalne wymuszenie ujścia nie jest możliwe bez złamania reguły sąsiedztwa rzek.

DIAGNOZA (zmierzona instrumentacją tymczasową, wycofaną):
1. Mechanizm dopinania już istnieje: topUpMainRiverCoastMouthGaps (gra/src/map/gen-helpers.ts:9787) -> topUpMainRiverCoastMouthGapsOnce (:9708), wołany z generatePhase1MainRivers (:11517, :11594) oraz z refillMainRiverCoastMouthGapsOnMap (:9822, po flattenFalseCoastalRiverNotches; wywołanie gra/src/map/generator.ts:571). Pętla kończy się, gdy żaden z 16 najdalszych heksów ani żaden z pozostałych kandydatów dalszych niż limit nie przyjmuje ujścia.
2. Konkretna przyczyna (kontynenty 42, masa 1011 heksów, runda 11: wszystkie kandydaty odrzucone): tryPlaceMainRiverAtMouth (:9931) dostaje 0 hex z traceRiverFromCoast (:6453), bo growRiverFromCoastInland (:6401) nie wykonuje nawet pierwszego kroku w głąb lądu. Filtr collectCoastInlandGrowCandidates (:6318) odrzuca sąsiadów: ok. 424 razy canRiverFlowThrough (:6038) — sąsiad już ma rzekę (rzeka.obecna: rownina 237, laka 165, pustynia 22); ok. 299 razy riverGrowStepPassesSep (:6290) przy minPathSep=2; ok. 254 razy seaDist < RIVER_MIN_INLAND_FROM_SEA=2 (:5688).
3. Wniosek: na tych odcinkach brzeg i pas tuż za nim są zajęte przez istniejące rzeki (dowolnego rodzaju). Nowa główna rzeka nie może tam wejść bez złamania reguły sąsiedztwa (sep 2 od głównych, brak nakładania na rzekę). Dla najdalszych heksów w tym stanie rzeka nie kończy się na brzegu w gapie (endsMain=0, endsNonMain w większości 0); blokuje ją rzeka biegnąca tuż za brzegiem.
4. Próg minPathSep=2 i RIVER_MIN_INLAND_FROM_SEA=2 nie są przyczyną samą w sobie. Obniżenie sep do 1 złamałoby regułę sąsiedztwa rzek (zakaz w dispatchu). Ujście wymuszone w heksie, który nie spełnia tych reguł, też je łamie.
5. Czas: pętla top-up nie dominuje czasu (riversMain 75 s). Pomiar wydajności po ewentualnej naprawie NIE ZMIERZONO.

OPCJE DLA ORKIESTRATORA (każda łamie zasadę lub zmienia układ rzek, więc to decyzja, nie lokalna poprawka):
A. Przed top-up odsunąć lub przeprowadzić rzeki nie-główne biegnące wzdłuż wybrzeża w odcinku gapy. Skutek dla gry: inne rozmieszczenie wody na wszystkich typach map. Wymaga testów river-density, river-path-adjacency, river-loop.
B. Awansować istniejącą rzekę nie-główną dochodzącą do brzegu do rodzaju „main” w gapie. Słabsze: w zmierzonych gapach takie ujścia prawie nie występują, więc nie rozwiązuje większości przypadków.
C. Zaakceptować lukę i zmienić regułę limitu (7/5) lub tolerancję testu. Decyzja właściciela, bo zmienia obietnicę „ujście w zasięgu 7 heksów”.
Rekomendacja Operatora: kierunek A jako techniczny, ale jej wpływ na układ rzek wymaga ABC do właściciela (A czy C) przed rundą 2. Wyboru nie dokonuję sam.

RUNDY: 1/5 (ostatni werdykt: BLOCK; decyzja wymagana: wybór A/C przed rundą 2)
NASTĘPNY KROK: orkiestrator: pytanie ABC do właściciela (A vs C); po odpowiedzi kolejna runda Operatora wg wybranej opcji.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Stałe: gra/src/map/gen-helpers.ts:5727 (MAIN_RIVER_COAST_MOUTH_MAX_GAP=7), :5730 (mainRiverCoastMouthMaxGapForDims).
- Test river-sea-buffer-test.cjs:84 (coastTol dla Ziemi) pozostaje bez zmian.
- Sekcja 3 dokumentu GENERATOR-MAP-BLEDY-REPRO-2026-11-25.md sugerowała wymuszenie ujścia jako prostą naprawę; diagnoza tego nie potwierdza.
- Plik repro/.bundle-r3.cjs i .entry-r3.ts (artefakty bundlera) usunięte z worktree; gra/node_modules usunięte.
