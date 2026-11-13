STATUS: PASS-WITH-NOTES (cel >=30 NIE osiagniety: 28/30; 7 testow z grupy 2 zielonych, B bez potwierdzonej przyczyny nie liczone)
DOMAIN: GAME (WEB) — dług testowy
TEMAT: R-WEB-TEST-DEBT-PREEXISTING-B-Q1
GOAL: runda 5/5 (ostatnia). Klasyfikacja grupy 2 z dowodem, przyczyny 4 adnotacji B, tabela per test, pelny przebieg zielonych.
BAZA: origin/web-wip/tdebtb-r4-fc = 284adedbf (FC r4 nad de6e0323a). Zachowano wszystkie zmiany r2–r4.
ZMIANY/COMMIT: commit r5 (SHA w sekcji DEPLOY/PUSH). Allowlista: gra/tools/{auto-battle-simultaneous,empire-panel-moc-scroll-preserve,empire-armia-produkcja,empire-panel-miasto-obywatele-content,era-change-toast-defer,era-cud-main-ts-integracja,diplomacy-negotiation-table,diplomacy-audience-close-flush}-test.cjs (tylko harness/kotwice/komentarze) + ten plik. Zero zmian w gra/src, gra/data, WERSJE.md, rust-port, gra-robocza.
UWAGA NUMERACJI: dispatch r5 podaje zapis do 01-operator-r1.md; ten plik to 06-operator-r5.md, bo 01-operator-r1.md jest raportem historycznym rundy 1 i nie nadpisuje sie go.

## Tabela per test (grupa 2 + zmienione w r5)

| Test | Klasa | Akcja | Dowod | Przed -> po |
|---|---|---|---|---|
| auto-battle-simultaneous | A (harness) | dodano pola fixture `_queuedOrderUnitIds: new Set()` i `_refreshQueuedOrderVisuals()` (zrodlo: battleScene.ts:5884-5933 `_activateNext` czyta `_queuedOrderUnitIds.delete`); asercje bez zmian | crash TypeError (battleScene.ts:76061 w bundlu) | crash, exit 1 -> 29 OK, exit 0 |
| empire-panel-moc-scroll-preserve | A (harness, E1) | `snap` (lokalna render()) przekazywany jako RUNNER_CONTEXT do wycinka; E1 uznaje go za rozwiazany; mutacje bez zmian | empireDetailPanel.ts:4258-4299; `snap` tylko jako argument `mountMassRecruitmentControls` (E3: nie dotyka scrollTop) | 12 FAIL (E1 + kaskada S1–S4) -> 59 PASS / 0 FAIL |
| empire-armia-produkcja | A (kotwica) | kotwica `ownerReligionForOwnerId(0)` -> `(ME())` (migracja Etap 6d aeb247bb1; ME() = humanSeats.activeHumanOwnerId, main.ts:12977) | blok B5–B9b byl pusty (indexOf = -1) | 7 FAIL -> 51 PASS / 0 FAIL |
| empire-panel-miasto-obywatele-content | A (kotwica R2-2) | `r.ownerId === 0` -> `isMe(r.ownerId)` (main.ts:18862-18868, migracja 93040dbe0) | main.ts:18866 | 1 FAIL -> 116 PASS / 0 FAIL |
| era-change-toast-defer | A (okna regexow + cele mutacji) | okno {0,100}->{0,800} (Blok 2); {0,2200}->{0,3500} (Blok 4, dystans 3110 zmierzony); sygnatura showHintMessage wieloliniowa + `...ctx` (Blok 5); okno aiCmdResume->pending {0,2500} (Blok 6); cele M5/M7/M8 zaktualizowane do obecnego kodu | main.ts:41895-41939 (finally), 16485-16500, 16429-16440, 9182-9225 | 4 FAIL + 5 MUT niezlapanych -> 7/7 PASS, 8/8 mutacji zlapanych, 4/4 sondy OK |
| era-cud-main-ts-integracja | A (regex + marker M4) | `researchGateForOwner(0)` -> `(0|humanOwnerId)` (ETAP6C); okno 785 zmierzone -> {0,1000}; marker M4 = drugie wystapienie dowolnej z dwoch postaci | main.ts:30335 (0), 37302-37312 (humanOwnerId) | 1 FAIL + M4 niezlapany -> 15 PASS / 0 FAIL, M4 zlapany |
| diplomacy-negotiation-table | A (zalozenie scenariusza) | scenariusz 2: relacja (40,35) -> (50,45). Powod: progNapRelacja = 110 (data/diplomacy.json:46, diplomacy.ts:208), nie 90 jak w komentarzu; przy score 75 kontroferta jest niemozliwa (75+20<110). Probe: (40,35) -> null, (50,45) -> countered | diplomacy-proposals.ts:1146-1158 | 1 FAIL -> 62/62 PASS |
| diplomacy-audience-close-flush | B (kandydat, dalej CZERWONY) | tylko komentarz w naglowku z lista goli wywolan wg grep | main.ts:6914 (wrapper, dozwolone), 24227 (onBack), 27108 (hak), 13160 (switchActiveHuman KROK 1, bez flush), 27749 (obiekt testowy, bez flush) | A4/A4f bez zmian (2 FAIL) |
| ai-zdobycie-miasta-adiacencja | NIE_USTALONE (B kandydat) | brak zmiany | K1b: plan.move na heks miasta (5,5) bez targetCityId; K2: brak przejecia; A5c/A5d/A6c/K9e/K9f/K6b czerwone | ~10 FAIL -> ~10 FAIL (bez zmian) |
| mgla-sciezka-inwariant | B (kandydat) | brak zmiany | 3 FAIL: miejsca zapisu poza whitelista; przypadki legalne/bledne NIE rozstrzygniete w r5 | bez zmian |
| ai-fog | B (kandydat) | brak zmiany | nie analizowano w r5 | bez zmian |
| diplomacy-proposal | B (kandydat) | brak zmiany | nie analizowano w r5 (diplomacy-proposals.ts:1296-1330) | bez zmian |
| ai-test | A/C (z r3–r4) | brak zmian w r5 | — | 289 / 0 -> 289 / 0 |

## Przyczyny B (zadanie 2) — stan
- mgla-sciezka-inwariant: NIE_ZWERYFIKOWANO per miejsce (siege-enter-city.ts:99-100, main.ts:4275, 26414, 34805-34806, battleScene.ts:8607-8608). Brak rozstrzygniecia legalne/bledne w tej rundzie.
- ai-fog, diplomacy-proposal: NIE_ZWERYFIKOWANO (nie analizowano w r5).
- diplomacy-audience-close-flush: czesciowo ustalone (lista goli wyzej). 13160 — nie wiadomo, czy zamkniecie audiencji przy przelaczeniu fotela ma wymagac flush (bledy reguly czy wyjatek). 27749 — obiekt testowy, kandydat klasy A po decyzji orkiestratora.
- ai-zdobycie-miasta-adiacencja: przyczyna nie ustalona. Probe w scratchpadzie nie dal wyniku (zakonczony z bledem narzedzia); K1b pozostaje do zbadania.

## Grupa 2 — werdykt
Klasyfikacja A z dowodem: 7 pozycji (auto-battle, moc-scroll, armia-produkcja, miasto-obywatele, era-change-toast, era-cud, negotiation-table). Klasa B bez przyczyny: ai-zdobycie (NIE_USTALONE).

## Bramki (dokladne wyniki, przebieg na koncu rundy, na commit r5)
- ai-test: 289 passed, 0 failed (EXIT 0)
- logic-test: LOGIC OK (213/213), EXIT 0
- tsc --noEmit: EXIT 0
- auto-battle-simultaneous: 29 OK, EXIT 0
- empire-panel-moc-scroll-preserve: 59 PASS / 0 FAIL, EXIT 0
- empire-armia-produkcja: 51 passed / 0 failed, EXIT 0
- empire-panel-miasto-obywatele-content: 116 passed / 0 failed, EXIT 0
- era-change-toast-defer: 7 passed / 0 failed; 8/8 mutacji zlapanych; 4/4 sond OK, EXIT 0
- era-cud-main-ts-integracja: 15 passed / 0 failed, EXIT 0
- diplomacy-negotiation-table: 62/62 PASS, EXIT 0
- mgla-sciezka-inwariant: EXIT 1 (B, oczekiwane)

## Liczenie celu
Runda 4: 21 (13 + 7 + ai-test). Runda 5: +7 (grupa 2, klasa A). Razem 28 z 30. Pozostale 2 wymagaja potwierdzonej przyczyny B (np. mgla lub ai-fog); bez niej nie sa liczone.

## BLOKADY
- Cel 30 NIE osiagniety (28/30).
- ai-zdobycie-miasta-adiacencja: przyczyna B nieustalona (K1b/K2).
- Przyczyny B mgla, ai-fog, diplomacy-proposal, audience-close-flush: NIE_ZWERYFIKOWANO.
- Do decyzji orkiestratora (nie moje): (a) czy progNapRelacja=110 jest zamierzony (test dostosowany do wartosci z data/diplomacy.json, nie do komentarza z 90); (b) czy 27749 dopisac do nazwanych miejsc (klasa A) lub uznac za blad.
- Dysk: po pracy 3.3 GB wolne; node_modules gra/ usuniety.

RUNDY: 5/5 (ostatnia; limit wyczerpany)
NASTEPNY KROK: Evaluator (Sonnet) weryfikuje klasy A z tabeli i zmiany harnessu (zwlaszcza era-change-toast: nowe okna regexow). Decyzja orkiestratora: tematy R-WEB-* dla B (ai-zdobycie, mgla, audience-close-flush 13160) albo nowa runda na B.
DEPLOY/PUSH: NIE WYKONANO
