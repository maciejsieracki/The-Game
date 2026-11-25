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
