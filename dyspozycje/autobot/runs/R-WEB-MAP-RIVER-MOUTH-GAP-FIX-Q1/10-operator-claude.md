# RUNDA 3/5 (Operator SONNET 5.5; baza 4ec8fe4b4) — CZĘŚCIOWA NAPRAWA + DECYZJA

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-MAP-RIVER-MOUTH-GAP-FIX-Q1
GOAL: odstęp ujść głównych rzek wzdłuż wybrzeża <= limit (Standard 7, Mała 5); kontynenty 42 i pangea 7.
ZMIERZONE: kontynenty 42: złe masy 8 -> 3 (worst 18 -> 15); pangea 7: worst 15 -> 10; cel (<=7) NIE osiągnięty bez zmiany reguły.

## 1. PRZYCZYNA GŁÓWNA (znaleziona w r3; nie była widoczna w r1-r2)
Rzeki 'main' z fazy dopełniania suchych płatów (tryDrainDryPatchFromRelief, pushMain, relaxSeaBuffer=true)
miały CIAŁO przechodzące po wodzie: collectInlandDrainGrowCandidates (gra/src/map/gen-helpers.ts, ok. :6383)
przy relaxSeaBuffer nie odrzucał heksów wody (Płytkie Morze, seaDist 0; canRiverFlowThrough wpuszcza Płytkie).
Na szerokim szelfie polarnym (wiersze r<=11 i r>=108) main szedł 6-25 heksów po wodzie; jego ujście (ogon,
ostatnie 5 hex) lądowało daleko od wyspy, więc wyspa nie miała ujścia (coveredCoastalKeysFromMainRivers).
Dowód (kontynenty 42, baza): maski ogonów wodnych main: 13 (źródło 61,109), 25 (64,110), 17 (55,11), 6 (67,8);
masa 19 hex = 2 takie rzeki, żadna nie wchodzi do morza na tej wyspie -> luka 18. Mniejsze masy 10-12 (r 8-11) tak samo.
NAPRAWA: `if (nd < 1) continue;` w collectInlandDrainGrowCandidates (ciało nie wchodzi na wodę; ujście dokłada
faza drenażu). Wynik kontynenty 42: ogon wodny main: histogram {0:103, 1:2, 3:6, ..., 13,17,25} -> {0:103, 1:20}.

## 2. DRUGA ZMIANA (częściowa): odnoga ujściowa (wariant (b) z dispatchu)
tryForkMouthAtGap (gen-helpers.ts, tylko etap refill, flaga allowForkMouth): gdy brak legalnego pierwszego
kroku, main dostaje 3-hexowe ramię [hex istniejącego main -> wolny heks brzegowy -> Płytkie Morze] jako trasa
'main' (<=5 hex, bufor morski nie dotyczy; wymaga sep 2 od INNYCH main, finalizeMainRiverPath/trim krawędzi).
Efekt: pangea 7: 15 -> 10 (3 odnogi z 51 prób; 48 odrzuconych przez limit krawędzi trimRiverPathRings na gęstych
heksach). Kontynenty 42: 0 odnóg (6 prób, wszystkie odrzucone przez limit krawędzi).

## 3. TABELA PER MASA (kontynenty 42, standard 168x120; surowe: repro/raw-r3-diag-kontynenty42.txt)
| masa (hex) | luka baza | luka po r3 | przyczyna / powód odrzucenia kandydatów ujścia |
|---|---|---|---|
| 19 | 18 | OK | 2 main z ogonem wodnym 13/25 hex (polarna wyspa); naprawione przez zakaz wody w ciele |
| 12, 12, 10 (r 8-11) | 12/9/10 | OK | jak wyżej (ogony 17/6/5) |
| 265 (pas r6-11, polar, ~5 wierszy) | 15 | 15 | wąski pas: kandydaci odrzuceni: seaLt2 (45), river:main sąsiad (44), river:medium (34), river:? (52), sepMain1 (13); main 83 (40 hex) biegnie równolegle do brzegu, ujście na końcu; mouth_hasStep 0 |
| 145 (r 9-11) | 11 | OK po r3 | ogon wodny (214/216) |
| 590 | 10 | 10 | 12 kandydatów mainD1, 8 na heksie main; pierwszy krok: river:main 39, river:medium 22, river:? 56, seaLt2 30 |
| 1011 | 8 | 8 | 1 daleki heks; 5 kandydatów: wszyscy sąsiedzi = river:main/medium/? lub seaLt2 |
| pangea 7 (7056) | 15 | 10 | równoległy main przy brzegu (seaDist 2) przy (38-39, 55-60); 36 dalekich heksów; kandydaci: river:main 101, river:medium 61, river:? 106, seaLt2 185 |
Wspólny wzorzec pozostałych luk: pas za brzegiem (seaDist 2) zajęty przez równoległy main/inne rzeki, brzeg
(seaDist 1) bez legalnego pierwszego kroku; ujście tego main leży daleko. Limity krawędzi (trim) blokują też odnogi.

## 4. WARIANTY (pomiary)
- (a) rezerwacja ujść PRZED rzekami nie-głównymi: NIE przetestowana w kodzie (wymaga przebudowy kolejności etapów generatora);
  pomiar r2: usuwanie rzek nie-głównych w promieniu 2-3 nie poprawia (0 poprawy) — dominuje sep wobec main.
- (b) odnoga/mini-rzeka: zaimplementowana (pkt 2); pangea 15->10, kontynenty 0.
- (c) sep 1 przy pierwszym kroku: pomiar r2 (diagnostyka): 18->16, naprawia 265/145/1011; łamie regułę sąsiedztwa -> NIE wdrożone.
DECISION_REQUIRED (jedno zdanie skutku dla gracza per wariant, bez rekomendacji):
 A: rzeki trochę gęstsze/bliższe sobie przy ujściach (dopuszczenie bliższego sąsiedztwa tylko przy ujściu w luce);
 B: odcinki wybrzeża bez ujścia rzeki do 15 pól na części map polarnych/wąskich pasów (obecny stan po r3: kontynenty 42 max 15, pangea 7 max 10, wyspy 42/108x74 max 20);
 C: ujścia rezerwowane z góry zmieniają układ rzek na wszystkich mapach.

## 5. DODATKOWE MAPY (przed -> po; surowe: repro/raw-extra-base-1.txt, raw-extra-after-1.txt)
| mapa | worst baza | worst po | złe masy baza -> po | czas gen baza -> po |
|---|---|---|---|---|
| kontynenty 42 168x120 | 18 | 15 | 8 -> 3 | 115,9 s -> 101,5 s (-12%) |
| pangea 7 168x120 | 15 | 10 | 1 -> 1 | 20,4 s -> 20,9 s |
| wyspy 42 108x74 | 20 | 20 | 12 -> 10 | 38,3 s -> 41,7 s |
| wyspy 42 84x60 (limit w kodzie 7) | 21 | 21 | 5 -> 6 | 11,5 s -> 13,3 s |
| wyspy 99 168x120 | 12 | 9 | 10 -> 4 | 157,6 s -> 179,0 s (+14%, szum/inne rzeki; NIE zmierzono powtórzenia) |
Uwaga: wyspy 42 (masy 20, 15, 18 hex: luka = cała obwódka) i 84x60 (21:21) nadal poza limitem — małe wyspy bez
wnętrza (seaDist>=2), tu potrzebna decyzja progu (wariant 2c) — NIE zmieniano reguły.
Liczba rzek main: k42 120 -> 123; riversFill k42 36,3 s -> 22,3 s.

## 6. TESTY / BRAMKI (surowe wyjścia w repro/)
- tsc --noEmit (gra/): 0 błędów.
- gra/tools/river-mouth-gap-enforce-test.cjs: dodana grupa A (0 main z ogonem wodnym > RIVER_MOUTH_TAIL_LEN): kontynenty 42 PASS, pangea 7 PASS;
  grupa B (limit ujść) nadal FAIL (kontynenty 3 masy worst 15; pangea worst 10) — raw-enforce-test-after.txt: 2 pass / 2 fail.
  Baza: grupa A czerwona (4 main z ogonem > 5: 13/17/25/6 — z dump bazy); MUTACJA (zakomentowane `if (nd < 1) continue;`):
  raw-enforce-test-mutation.txt: kontynenty 42 grupa A FAIL (4), złe masy 7/worst 18 -> mutacja czerwona.
- gra/tools/river-sea-buffer-test.cjs po zmianie (raw-river-sea-buffer-after.txt): 6 pass / 3 fail: kontynenty 42 bufor 5 złych (baza: 10 złych, z buffer-check.cjs na dumpie bazy) + luka; pangea bufor OK; ziemia 99 PASS (worst 13 <= 42).
  Bufor 5 pozostałych złych main = polarne wyspy bez wnętrza (relaxSeaBuffer, ciało seaDist 1): to NIE nowy błąd (baza 10).
- NIE ZMIERZONO (brak czasu/budżetu rundy): logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, climate-band, river-density/loop/path-adjacency/yield-both-sides (zmiana deterministycznej generacji: piny hash/seed — cluster-plan, map-gen-regression, determinism — NIE przepięte, NIE zmierzone), earth-template r1.
  Lista wymagająca przepięcia pinów po akceptacji kierunku: każdy test przypięty do konkretnego ziarna generatora (grep po `generateMap(` z seedem w gra/tools) — do rundy 4.

## 7. ZMIANY / COMMIT
gra/src/map/gen-helpers.ts (+101: poprawka ciała rzeki + tryForkMouthAtGap), gra/tools/river-mouth-gap-enforce-test.cjs (grupa A),
runs/.../repro/*: diag-patch-r3.diff (instrumentacja per masa: __gapDiag, licznik ogonów wodnych, liczniki odnóg — NIE w kodzie gry),
r3-permass.cjs, dump-map.cjs, inspect-mass.cjs, buffer-check.cjs, surowe wyjścia.
BLOKADY: cel <=7 dla k42 (masa 265: wąski pas polarny; 590, 1011) i pangea 7 wymaga zmiany reguły sąsiedztwa/kolejności etapów (DECISION_REQUIRED powyżej).
RUNDY: 3/5. NASTĘPNY KROK: orkiestrator redaguje pytanie ABC (A/B/C); po wyborze runda 4; równolegle przepięcie pinów generatora i pełne bramki.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Wyspa/małe masy bez wnętrza (>=8 hex; luka = cała obwódka, np. wyspy 42: 20/15/18) wymagają osobnej decyzji progu (wariant 2c).
- Poprawka ciała rzeki sama w sobie to realna naprawa błędu (rzeka płynąca po wodzie) i przyspiesza fazę riversFill k42 o ~38%.
- Czas wyspy 99 168x120 +14% (jeden pomiar) — wymaga powtórzenia przy ciszy maszyny; k42 -12%.

---

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
