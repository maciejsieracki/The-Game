STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MARCH-END-OF-TURN-ONLY-Q1
GOAL: Zaplanowane marsze jednostek gracza wykonuja sie wylacznie w fazie konca tury gracza (przed ekonomia/AI/dyplomacja); nowa tura startuje z jednostkami tam, gdzie je zostawiono, z pelnym MP.

## Diagnoza (plik:linia, baza origin/main 80919e2ae)
Faza konca tury (`runPlannedMarchesAtPlayerEndTurn`, main.ts ~29308, wolana ~40847/~40991) byla juz synchroniczna. Marsze POZA oknem konca tury wykonywaly 4 sciezki:
1. `flushDeferredPlayerUnitReveals` (~13793, wolane po fazie AI = w NOWEJ turze) -> `planDeferredGeneralMarchBatch(..., enqueueMarchSegments)` -> `processMarchQueue` -> animowany ruch nowych jednostek do wodza na starcie nowej tury.
2. `afterPlayerUnitSpawned` (~13789) -> `enqueueMarchSegments([newUnitId])` (nowo wyprodukowana jednostka idzie do wodza od razu).
3. Koniec animacji w `renderLoop` (~41244, ~41321) -> `processMarchQueue()` odpalal kolejne marsze innych jednostek w trakcie tury / w nowej turze.
4. `syncGeneralMarchTargets` (~29037) pchal nowo zaplanowanych podopiecznych wodza do `marchExecQueue` w dowolnej chwili (po ruchu wodza w trakcie tury) -> wykonanie przez (3).

## Zmiany (gra/src/main.ts, minimalne)
- (1)(2): usuniete natychmiastowe enqueue; nowa jednostka ma tylko ZAPLANOWANY marsz (wykona sie na koncu tury). Dodana no-op `deferMarchToEndOfTurn` jako callback batcha.
- (3): usuniete oba `processMarchQueue()` po animacji (zostaje `syncGeneralMarchTargets()`).
- (4): `syncGeneralMarchTargets(enqueueNewlyPlanned=false)` kolejkuje tylko w fazie konca tury (`applyMarchSegmentInstant`, `runPlannedMarchesAtPlayerEndTurn` wolaja z `true`).
- Kolejka konca tury pomija jednostki `movedByPlayerThisTurn` (kontrakt pkt 3).
- Bez zmian: `planMarchTo` -> `executeMarchSegmentForUnit` (patrz BLOKADY), hot-seat (ta sama funkcja per fotel), zapis/odczyt, balans.

## Testy
- NOWY gra/tools/march-end-of-turn-only-test.cjs: asercje E1-E6 + 5 mutacji (M1-M5), wszystkie wykryte; EXIT=0.
- Zaktualizowane: army-panel-recruit-rally-general-test.cjs (callback batcha = deferMarchToEndOfTurn) 5 pass; player-moves-before-ai-turn-test.cjs --no-live (kotwice mutacji M1 na `syncGeneralMarchTargets(true)`) 6 OK / 0 FAIL.
- planned-march-test 18/0; march-attack-queue-persist-test 57/0; rally-point-automarch-test 30/0; general-quick-follow-action-test: czesc bezprzegladarkowa PASS, czesc live nie uruchomiona (brak /usr/bin/chromium).
- tsc --noEmit: EXIT=0 (node_modules usuniete po pracy).
- RED na bazie: mutacje M1-M4 odtwarzaja stary kod i sa wykrywane (E1-E4).

## NIE_ZMIERZONO
- Pomiar PRZED/PO w realnym `endTurn` w Chromium (scenariusze a-f, rejestr wywolan ze stack trace), determinizm hashy `war-allin-capital-quick`, `ai-test` 274/20, regresje `*end-turn*`, `army-*`, `hotseat-*` -- wymagaja przegladarki/bundla (swiat >8 min); nie uruchomione. Diagnoza jest z analizy kodu, nie z pomiaru. Zmiana nie dotyka kodu AI/swiata/RNG (hashe nieweryfikowane).

## BLOKADY / DECYZJA PRODUKTOWA
`planMarchTo` (~28979) po `plannedMarches.set` wykonuje natychmiast pierwszy segment (rozkaz gracza w tej turze). Opcje: A = zostaje natychmiastowy pierwszy segment, kontynuacja tylko na koncu tury; B = rozkaz tylko planuje, wszystko na koniec tury; C = jak A z potwierdzeniem. WDROZONO rekomendowana A (jednostka jest movedByPlayerThisTurn, wiec na koncu tury nie maszeruje drugi raz). Sciezka `general-follow` z UI (~24064) to tez rozkaz gracza -> A; reszta zakolejkowanych w jednym rozkazie nie jest juz dopalana po animacji.
Martwy kod `executePlannedMarchesEndTurn` zostawiony.

## RUNDY: 1/5
## NASTEPNY KROK: Evaluator (zywy pomiar Chromium a-f + regresje).
## DEPLOY/PUSH: NIE WYKONANO
