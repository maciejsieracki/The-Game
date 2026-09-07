# R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1 — Operator runda 1 — analiza `triggerPlayerEndTurn()`

**Metoda:** cały plik `gra/src/main.ts` przeczytany linia po linii w zakresie funkcji,
Read w kawałkach ~300-500 linii, offsety podane niżej są rzeczywiste z chwili tej
rundy (2026-09-07, worktree `/home/user/wt-hotseat-etap4-recon`, baza `origin/main`
`dfdc026d`). **main.ts zmienia się codziennie (103 commity/30 dni) — przed rundą 2
odśwież WSZYSTKIE numery linii świeżym grepem, nie ufaj tym liczbom.**

## 0. Granice funkcji (potwierdzone świeżo)

```
grep -n "function triggerPlayerEndTurn" gra/src/main.ts   → 28497
```
Deklaracja: `function triggerPlayerEndTurn(): void {` @ **28497**.
Ciało: guard synchroniczny (28498-28518) + `void (async () => { try { ... } finally
{ ... } })();` (28519-28965). Zamykający nawias całej funkcji zweryfikowany wprost
odczytem końcówki pliku (cytat, linie 32964-32966):
```
32964	        }
32965	      })();
32966	    }
```
— `})();` @ **32965** zamyka `void (async () => {...})();`, `}` @ **32966** zamyka
`function triggerPlayerEndTurn`. **Długość funkcji: 32966 − 28497 = 4469 linii pliku**
— zgodne z "ok. 4600 linii"/"4500 linii" cytowanymi w dyspozycji i w planie (drobna
różnica to naturalny dryf pliku między napisaniem planu a dziś, nie sprzeczność).
Najbliższa kolejna deklaracja funkcji w pliku, `startRenderLoop()` @ **33103**, leży
JUŻ POZA `triggerPlayerEndTurn` — między 32966 a 33103 jest wyłącznie listener
`keydown` (32968-33095), który NIE jest częścią tej funkcji; dyspozycja podawała
`~33103` jako orientacyjny górny limit bloku do przeczytania (bezpieczny margines
w górę), nie jako faktyczny koniec funkcji — potwierdzone.

(Poprawka robocza tej samej rundy: pierwszy szkic tej sekcji pomylił numer zamykającej
klamry — wpisał 28966 zamiast 32966 — co dawało absurdalną długość „469 linii" w
sprzeczności z planem. Błąd wykryty i naprawiony PRZED zapisaniem finalnej wersji
raportu: „4500 linii" z planu było zbyt rozbieżne od wyliczenia, by zignorować bez
ponownego sprawdzenia źródła — dokładnie reguła anty-halucynacyjna w działaniu.)

## 1. Mapa faz (kolejność wykonania, numery linii DZISIEJSZE)

Faza = zakres + krótki opis + klasyfikacja: **[GRACZ]** = dotyczy wyłącznie aktywnego
człowieka (kandydat `endActiveHumanTurn`), **[ŚWIAT]** = dotyczy całej gry/wszystkich
ownerów raz na turę (kandydat `runWorldEndTurn`), **[MIESZANE]** = tekstowo w jednym
miejscu, ale semantycznie zawiera oba typy efektu (najważniejsza kategoria dla ryzyka
rozcięcia — patrz sekcja 3).

| # | Zakres (linie) | % (setTurnTransition) | Opis | Klasyfikacja |
|---|---|---|---|---|
| 0 | 28497-28518 | — (guard) | `canPlayerInitiateEndTurn()`, `healStuckDeferredPreBattleQueueOnEndTurnAttempt()`, log, PERF_DEBUG snapshot | **[GRACZ]** (blokada wydania rozkazu przez AKTYWNEGO człowieka) |
| 1 | 28519-28579 | 0% (start) | `beginTurnTransition`, snap trwającej animacji jednostki gracza (`anim`), `deductStackRuchLeft`, `applyEmbarkStateAfterMove`, nagrody z chatek/zniszczenie obozu wzdłuż ścieżki — WSZYSTKO odnosi się do `anim`, a komentarz P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1 **potwierdza wprost**: „`anim` jest zawsze jednostką gracza (jedyne miejsce ustawiające `anim` to `startAnimatedMove`/`playerStackAt`)" | **[GRACZ]** czysty |
| 2 | 28580-28626 | — | Auto-zwiedzanie skautów gracza (`runScoutsAutoExplore(..., 0, ...)` — literał `0` na 4. arg = `playerOwnerId`), `checkVillageRewardAt`/`checkBarbCampDestroyedAt` z twardym komentarzem „zawsze gracza, nigdy barbarzyńcy" | **[GRACZ]** czysty (ALE: literał `0` — Etap 6 musi zamienić na `ME()`) |
| 3 | **28627** | — | `evictForeignUnitsFromCityHexes()` — **PĘTLA PO WSZYSTKICH `units` BEZ FILTRA OWNERA** (zweryfikowano treść funkcji @ main.ts:10811-10839: `for (const u of units)`, żaden warunek na `ownerId===0`) | **[ŚWIAT] w środku bloku [GRACZ]** — patrz sekcja 3, ryzyko #1 |
| 4 | 28628-28630 | — | `runPlannedMarchesAtPlayerEndTurn()` — kontynuacja wieloturowej trasy gracza (nazwa funkcji jawnie mówi "Player") | **[GRACZ]** (do potwierdzenia w rundzie 2 przez odczyt ciała funkcji — dziś tylko nazwa + komentarz to potwierdzają, ciało NIE było czytane w tej rundzie z powodu poza-allowlisty-czasowej priorytetu; **DŁUG dla rundy 2**) |
| 5 | **28631-28643** | — | **Reset ruchu DLA WSZYSTKICH JEDNOSTEK**: `movedByPlayerThisTurn.clear()`; `for (const u of units) { u.ruchLeft = u.ruch; ...; u.replaceUsedThisTurn=false; u.retreatedThisTurn=false; }` — bez filtra ownera, dotyczy też jednostek AI/barbarzyńców/wszystkich ludzi | **[ŚWIAT] w bloku [GRACZ]** — **RYZYKO #1 (patrz sekcja 3), NAJWAŻNIEJSZE ZNALEZISKO TEJ RUNDY** |
| 6 | 28644-28646 | 6% | `clearPlayerUnitSelectionStateOnly()`, `setTurnTransition(6, 'Zakończenie ruchów gracza…', 'Gracz', nextTurnNum)` | **[GRACZ]** |
| 7 | **28647** | — | **`turn++`** — jedyne wystąpienie w całym pliku (świeży grep: `grep -n "turn++" gra/src/main.ts` → wyłącznie linia 28647) | **[ŚWIAT]** z definicji — to jest DOKŁADNIE granica "raz na turę świata" |
| 8 | 28648-28691 | — | `sweepLegacyFarmsOnForest` (globalny sweep mapy, idempotentny), czyszczenie logów zdarzeń (`villageEventLog`/`tradeRouteEventLog`/`rationAutoEventLog`/`borderMarchEventLog` — **wszystkie GLOBALNE, nie per-owner**), `pruneVeteranEnemyEducationJournal`, `dismissedSidePanelEventIds.clear()`, **rotacyjny autozapis** `if (turn % getAutosaveFrequency()===0)` (używa `turn` PO incremencie), `pendingImprovementsTurn.commitTurn()` | **[ŚWIAT]** (logi/autosave/sweep) — ale POZYCJONOWANE zaraz po `turn++`, więc semantycznie już "świat", tekstowo wciąż przed `setTurnTransition(10, 'Dyplomacja...')` |
| 9 | 28692-28701 | 10% | `resetTrustPnGainedForPlayerTurn()` (nazwa sugeruje gracza, ale wywoływana raz na world-turn tutaj), `runDiplomacyTurnTick()` w try/catch | **[ŚWIAT]** (dyplomacja tyka RAZ na turę świata, dotyczy wszystkich par ownerów — potwierdzone przez ABC-1/plan §G) |
| 10 | 28702-30422 | 14%→38% | **BLOK EKONOMIA** — `advanceCityEconomy` (WSZYSTKIE miasta wszystkich ownerów, zgodnie z ABC-2), głód wojska/deficyt złota (pętle `for (const tick of efTickResult.perOwner)` / `gdTickResult.perOwner` — jawnie per-owner, komunikaty HUD filtrowane `if (tick.ownerId===0)` do gracza), bank skarbca gracza I AI (`aiSkarbiecByOwner`), auto-research gracza, pętla PORZĄDEK/KULTURA/RELIGIA/PRODUKCJA per-miasto (`for (const city of cities)` — WSZYSTKIE miasta, wszyscy właściciele), rekrutacja/spawn jednostek (per-miasto, `city.ownerId` dowolny) | **[ŚWIAT]** w całości — jedna wspólna faza ekonomii dla wszystkich ownerów (zgodnie z ABC-2 „RAZ, PO TURACH OBU LUDZI") — ALE zawiera **osadzone `deferredPlayerUnitRevealIds.add(newUnitId)`** @ 30095 gdy `city.ownerId===0 && endTurnInProgress` — patrz ryzyko #4 |
| 11 | 30423-32476 | 38%→~92% | **BLOK AI** — `runAiPhase()` (funkcja rekurencyjna, patrz sekcja 2 niżej), `ownerLoop` po `aiOwnerList` (WSZYSTKIE ownery `isAiOwner(humanSeats, ...)`), dyplomacja AI↔gracz i AI↔AI, `decideAITurn`, egzekucja komend (`move`/`attack`/`build`/`buildImprovement`/`foundCityAt`) | **[ŚWIAT]** w całości (dotyczy wyłącznie AI, zero gracza jako aktora) — ALE atak AI→gracz **WSTRZYMUJE CAŁĄ FUNKCJĘ ASYNCHRONICZNIE** przez modal bitwy — patrz ryzyko #2 (NAJWIĘKSZE RYZYKO STRUKTURALNE) |
| 12 | 32477-32801 | 94% | **BLOK BARBARZYŃCY** — spawn obozów, tick obozów, ruch/atak barbarzyńców | **[ŚWIAT]** — atak barbarzyńcy→gracz ma TEN SAM wzorzec modal-bitwy co AI (linia 32766: `if (defRoster.some(u => u.ownerId === 0))`) |
| 13 | 32802-32867 | 98% | **SPRAWDZENIE ZWYCIĘSTWA** — `VictoryPlayer[]` budowane ze WSZYSTKICH ownerów (`allOwners`), `checkVictory` per gracz=0 explicite (`gracz: 0` w `VictoryInput`) | **[ŚWIAT]** (lista wszystkich), ale **hardkodowane `gracz: 0`** w `VictoryInput` — w hot-seat trzeba by sprawdzać zwycięstwo per KAŻDY człowiek, nie tylko owner 0 — DŁUG dla Etapu 4/8, nieujęty w dyspozycji tej rundy explicite, ale realny |
| 14 | 32868-32930 | 100% | `markCityStateDirty()`, `updateHud()`, `cityRenderer.sync`, `refreshWorkerFieldOverlay`, `refreshTradeRoutesOverlay` (no-op udokumentowany), `refreshFog()`, `wakeSentryUnitsOnEnemyContact()`, flush `pendingAutoRationForNextTurn`, flush `deferredEotHints` do `warEventLog`, `setTurnTransition(100, ...)` | **[MIESZANE]** — `updateHud`/`cityRenderer.sync`/`refreshFog` to RENDER dla AKTYWNEGO człowieka (kandydat `isMe`/`ME()` po Etapie 2/6), reszta (`markCityStateDirty`, flush logów) jest globalna/jednorazowa |
| 15 | 32931-32964 | — (finally) | `catch (errEndTurn)`, **`finally`**: `endTurnTransition()`, `endTurnInProgress=false`, `endTurnStartedAt=0`, **`flushDeferredPlayerUnitReveals()`, `flushDeferredMergePrompts()`, `flushDeferredAutoPreBattle()`, `flushPendingEraChangeToast()`**, `syncPlayerUnitSelectionOnMap()`, log DONE | **[GRACZ]** (wszystkie flushe explicite odnoszą się do rzeczy pokazywanych NA EKRANIE — patrz sekcja 4) |
| 16 | 32965-32966 | — | zamknięcie `})();` i `}` funkcji | — |

## 2. Struktura sterowania — NIE jest to liniowy blok kodu (KLUCZOWE dla planu cięcia)

`triggerPlayerEndTurn()` to **jeden `void (async () => { try {...} finally {...} })()`**,
ale wewnątrz niego `runAiPhase` (zdefiniowana lokalnie @ 30429, wywołana `await
runAiPhase()` @ 32472) jest **funkcją REKURENCYJNĄ przez callback**:

- Gdy AI atakuje jednostkę gracza (`defRoster.some(u => u.ownerId === 0)` @ **32105**),
  funkcja:
  1. zapisuje `aiCmdResume = { ownerList, ownerIdx: oi, commands, cmdIdx: ci+1 }` (32106-32111),
  2. ustawia `aiTurnAwaitingBattle = true` (32112),
  3. wywołuje `launchIncomingMapFieldBattle(..., () => { void runAiPhase(); }, ...)` (32113-32123) —
     **callback wznawiający `runAiPhase()` PO zamknięciu modala bitwy przez gracza**,
  4. `break ownerLoop` (32124) — przerywa pętlę AI, ale **NIE kończy `triggerPlayerEndTurn`**
     — reszta `async` IIFE (barbarzyńcy, zwycięstwo, HUD, `finally`) **wykonuje się
     natychmiast dalej, ZANIM gracz kliknie cokolwiek w modalu bitwy** (bo
     `launchIncomingMapFieldBattle` nie jest `await`-owane — callback jest
     asynchroniczny względem reszty funkcji).
- Identyczny wzorzec dla ataku barbarzyńcy→gracz @ **32766-32780** —
  `launchIncomingMapFieldBattle(..., () => { /* reszta tury już poszła — tylko odśwież
  mapę */ }, ...)` — komentarz w kodzie WPROST przyznaje: „reszta tury już poszła".

**Konsekwencja krytyczna dla Etapu 4:** `endTurnInProgress` gaśnie w `finally` (32936)
**ZANIM** modal bitwy AI→gracz (uruchomiony w środku fazy AI) faktycznie się zamknął —
to jest DOKŁADNIE to, co opisuje komentarz P-KONIEC-TURY-ZDARZENIA-NACHODZA-NA-SIEBIE
@ 32938-32952 w kodzie: „`preBattle` otwarty w trakcie fazy AI/barbarzyńców... może
wciąż wisieć na ekranie" gdy `finally` już strzela. To NIE jest teoretyczne ryzyko
rozcięcia — to jest **udokumentowany, świadomie zaadresowany w PRODUKCJI wzorzec
race**, na którym plan Etapu 4 musi się oprzeć, nie wynajdywać na nowo.

**Znaczenie dla podziału `endActiveHumanTurn`/`runWorldEndTurn`/`advanceSeat`:** faza
AI (i faza barbarzyńców) NIE JEST atomowa — może się zawiesić w połowie i wznowić
dowolnie później (nawet po wielu klatkach/interakcjach gracza z modalem bitwy).
Jeśli `runWorldEndTurn()` ma być "czystą symulacją" (patrz plan §H5b, kandydat na
silnik serwerowy), **musi rozwiązać ten sam problem asynchroniczności** — modal
bitwy dziś jest UI (wymaga kliknięcia gracza), więc "czysta symulacja" bez UI
wymagałaby albo (a) auto-rozstrzygania walk AI→człowiek bez pytania (zmiana
zachowania, poza zakresem no-opu), albo (b) `runWorldEndTurn` samo w sobie zostaje
asynchroniczne i CZEKA na wynik walki dostarczony z zewnątrz (przez
`endActiveHumanTurn`/UI) — co oznacza, że granica `runWorldEndTurn` vs UI nie jest
tak czysta, jak plan zakłada, przynajmniej dopóki bitwy AI→człowiek pozostają
interaktywne. **To jest osobne ryzyko od punktu cięcia gracz/świat — dotyczy
GRANICY między światem-symulacją a UI-modalem, i powinno być jawną pozycją w planie
rundy 2, nie ukrytym założeniem.**

## 3. Efekty uboczne wrażliwe na kolejność (GOAL pkt 3) — potwierdzone świeżym grepem

Świeży grep w zakresie funkcji (28497-33103, żeby objąć margines):
```
grep -n "preBattle|deferredEotHints|deferredMergePrompts|flushDeferredPlayerUnitReveals|deferredPlayerUnitRevealIds|aiTurnAwaitingBattle|aiCmdResume =" gra/src/main.ts
```
Wynik (patrz transkrypt narzędzi tej rundy) potwierdza WSZYSTKIE cztery identyfikatory
z dyspozycji NADAL ISTNIEJĄ pod tymi nazwami:

- **`deferredEotHints`** — deklaracja `const deferredEotHints: DeferredEotHint[] = []`
  @ **13936** (NIE 9196 jak w starym planie — main.ts się przesunął). Flush @
  **32922-32929**, WEWNĄTRZ `async` IIFE, PRZED `finally`, warunkowany
  `deferredEotHints.length > 0` — konwertowane na karty `warEventLog` przez
  `deferredHintsToSidePanelEvents`.
- **`deferredMergePrompts`** — deklaracja `const deferredMergePrompts:
  DeferredMergePrompt[] = []` @ **9504** (poza funkcją, moduł-scope). Funkcja
  `flushDeferredMergePrompts()` @ **11066**, z guard `if (deferredMergePrompts.length
  === 0 || endTurnInProgress) return;` @ **11067** — **ten guard jest SEDNEM ryzyka
  #4/#5 niżej: flush explicite ODMAWIA działania dopóki `endTurnInProgress===true`**,
  woła się dopiero w `finally` @ **32954**, PO `endTurnInProgress=false` (32936).
- **`flushDeferredPlayerUnitReveals`** — definicja @ **11100**, wołana w `finally` @
  **32953**, ustawia widoczność jednostek gracza dodanych do
  `deferredPlayerUnitRevealIds` (deklaracja `const deferredPlayerUnitRevealIds = new
  Set<string>()` @ **9493**) w trakcie fazy ekonomii (@ **30095**, gdy
  `city.ownerId===0 && endTurnInProgress`, wołane z pętli rekrutacji per-miasto).
- **`preBattle`** — nie jest pojedynczą zmienną, tylko modułem/panelem
  (`showPreBattle`/`hidePreBattle`/`isPreBattleOpen`/`configurePreBattle`/
  `flushDeferredAutoPreBattle`, import @ **630**). `flushDeferredAutoPreBattle()`
  wołana WIELOKROTNIE w całym pliku (11 miejsc), w tym w `finally` @ **32957**.

**Dlaczego te cztery MUSZĄ zostać w `endActiveHumanTurn` (blok "gracza"), nie
`runWorldEndTurn`** — dokładnie z uzasadnienia już WPISANEGO w kod (cytat @
32938-32952, PL+EN): flushowanie dzieje się świadomie w `finally`, PO
`endTurnInProgress=false`, właśnie dlatego, że dopiero wtedy ekran należy do
gracza (żaden modal bitwy/dyplomacji AI-inicjowany nie ma prawa być otwarty —
`isPreBattleOpen()`/`isDiplomacyAudienceOpen()` sprawdzane WEWNĄTRZ
`promptMergeIfCoLocated`/`flushDeferredMergePrompts` przed pokazaniem czegokolwiek).
**Jeśli w Etapie 4 te cztery flushe trafią do `runWorldEndTurn()` (bo tekstowo są
na "końcu funkcji", blisko fazy zwycięstwa/HUD), złamią dokładnie tę gwarancję** —
world-symulacja (potencjalnie serwerowa, bez UI, patrz plan §H5b) próbowałaby
pokazywać modale scaleniowe/odkrycia jednostek/preBattle na maszynie bez ekranu, lub
— gorzej — w hot-seat 2-graczowym pokazałaby je na ekranie NIEWŁAŚCIWEGO człowieka
(bo `runWorldEndTurn` z definicji biegnie PO obu turach ludzi, nie wie "czyj" jest
aktualnie ekran). **Wniosek: te cztery flushe muszą zostać semantycznie związane z
`endActiveHumanTurn` konkretnego człowieka (lub z krokiem `advanceSeat` który
przełącza ekran NA tego człowieka), nigdy z `runWorldEndTurn`.**

### Ryzyko #1 (NOWE, nieujęte wprost w planie/dyspozycji) — pętle bez filtra ownera w bloku "gracza"

Dwa miejsca w tekstowym bloku "przed `turn++`" (czyli w strefie, którą plan/dyspozycja
klasyfikuje jako `endActiveHumanTurn` 27416-27543/dziś ~28497-28647) operują na
**WSZYSTKICH jednostkach niezależnie od ownera**:

1. `evictForeignUnitsFromCityHexes()` @ **28627** — ciało (main.ts:10811-10839,
   zweryfikowane w tej rundzie) iteruje `for (const u of units)` bez żadnego warunku
   na `ownerId`.
2. Reset ruchu @ **28631-28643** — `for (const u of units) { u.ruchLeft = u.ruch; ...
   }` bez filtra ownera — dotyczy jednostek AI, barbarzyńców i (w hot-seat) OBU ludzi
   jednym zamachem.

**Dlaczego to jest ryzyko, a nie nieszkodliwy szczegół:** w single-player dziś to
jest niewidoczne, bo `triggerPlayerEndTurn()` woła się dokładnie raz na turę świata —
te dwie globalne pętle i tak wykonują się raz na turę. **W hot-seat, jeśli
`endActiveHumanTurn()` (wywoływane per-fotel-człowieka) zachowa te dwie pętle w
swoim ciele, wykonają się DWA RAZY na jedną turę świata** (raz gdy człowiek 1 kończy
turę, raz gdy człowiek 2 kończy turę) — dla `evictForeignUnitsFromCityHexes` to
prawdopodobnie nieszkodliwe (idempotentne — jednostka już wypchnięta zostaje na
miejscu), ale dla resetu ruchu (`u.ruchLeft = u.ruch`, `u.replaceUsedThisTurn =
false`, `u.retreatedThisTurn = false`) **oznacza to, że jednostki człowieka 1
dostają PEŁNY ruch z powrotem w momencie, gdy człowiek 2 kończy SWOJĄ turę** — czyli
w środku tej samej tury świata, PRZED fazą AI/ekonomii. To nie zmienia zachowania
przy `humanOwnerIds=[0]` (no-op dla dzisiejszego trybu — jedna pętla to i tak
identyczny efekt), więc **nie blokuje Etapu 4 dla samego pojedynczego człowieka**,
ale **MUSI zostać przeniesione do `runWorldEndTurn()`** (wykonywane raz, po tym jak
OSTATNI człowiek zakończył turę) — inaczej w Etapie 8 (hot-seat aktywny) powstanie
realny bug (darmowy dodatkowy ruch/reset flag dla gracza, który już skończył turę,
zanim świat w ogóle się rozstrzygnął). **Rekomendacja repozycji obu bloków do
`runWorldEndTurn()` musi trafić do planu implementacji rundy 2 jawnie — dziś ich
tekstowa pozycja (przed `turn++`) jest myląca.**

### Ryzyko #2 — bitwa AI→gracz / barbarzyńca→gracz twardo zakodowana na `ownerId===0`

Dwa miejsca (**32105**: `if (defRoster.some(u => u.ownerId === 0))` w pętli AI, i
**32766**: `if (defRoster.some(u => u.ownerId === 0))` w pętli barbarzyńców) decydują,
czy atak na jednostkę wymaga modala bitwy (bo broni jej CZŁOWIEK) czy może być
rozstrzygnięty automatycznie (`doAutoPowerMapBattle`, bo broni jej AI). **W hot-seat
z dwoma ludźmi, atak AI/barbarzyńcy na jednostkę CZŁOWIEKA #2 (ownerId>0) DZIŚ
przeszedłby przez auto-rozstrzygnięcie zamiast pokazać modal bitwy temu człowiekowi**
— dokładnie ten sam rodzaj pułapki, co „31 miejsc `ownerId>0`==AI" z Etapu 1 (już
naprawionych), tylko że TA konkretna para (32105, 32766) **NIE była wymieniona w
liście 31 miejsc Etapu 1 z planu** (plan cytuje `29332-29333`, `1863-1864`, `6128`
itd. — inny zestaw). **To jest NOWE odkrycie tej rundy, nieujęte w oryginalnym planie
Etapu 1 ani w dyspozycji Etapu 4** — musi trafić albo do uzupełnienia Etapu 1 (jeśli
zakres tamtego tematu miałby zostać poszerzony), albo jako jawny punkt planu
implementacji Etapu 4/5 (zamiana `u.ownerId === 0` → `isHumanOwner(humanSeats,
u.ownerId)` w OBU miejscach, 32105 i 32766). Bez tej naprawy: w hot-seat AI/
barbarzyńcy atakujący człowieka #2 rozstrzygają walkę automatycznie bez pytania go
o nic — poważny regres w rozgrywce, nie tylko kosmetyczny.

### Ryzyko #3 — `VictoryInput.gracz: 0` hardkodowane

@ **32834**: `const vInput: VictoryInput = { ..., gracz: 0, ... }`. Sprawdzenie
zwycięstwa/porażki liczy WYŁĄCZNIE dla ownera 0. W hot-seat trzeba by rozstrzygać
zwycięstwo per człowiek (dwóch ludzi może mieć różny wynik — jeden wygrywa, drugi
przegrywa, albo obaj przegrywają razem z AI dominującym) — **poza zakresem GOAL tej
rundy (nie było w dyspozycji), ale zbyt istotne, żeby przemilczeć**: zgłaszane jako
osobna rekomendacja (sekcja 7), nie zmieniam założeń planu cichcem.

### Ryzyko #4 (potwierdzenie z dyspozycji, nie nowe) — kolejka rewelacji jednostek gracza

`deferredPlayerUnitRevealIds` (9493) wypełniana WYŁĄCZNIE dla `city.ownerId===0` @
30095 — w hot-seat, jednostki wyprodukowane przez człowieka #2 potrzebowałyby
analogicznej kolejki (albo generalizacji tej samej na `isHumanOwner`) — inaczej
`flushDeferredPlayerUnitReveals()` nigdy nie odkryje jednostek człowieka #2. Powiązane
z tabelą B2 planu (`isHuman(id)` dla akcesorów, ale TU chodzi o kolejkę odłożoną, nie
akcesor ekonomiczny — osobny mechanizm, wart wymienienia explicite w planie rundy 2).

## 4. Miejsca wywołania `triggerPlayerEndTurn()` poza nią samą (GOAL pkt 5)

Świeży grep całego pliku (`grep -n "triggerPlayerEndTurn"`) — poza definicją @ 28497 i
samo-referencjami w komentarzach (10477-28345, opisowe, NIE wywołania), dokładnie
**TRZY miejsca wywołania**:

1. **main.ts:20910** — `onEndTurn: () => triggerPlayerEndTurn()`, wewnątrz obiektu
   przekazywanego do `showHud({...})` — to jest przycisk „Zakończ turę" w HUD.
2. **main.ts:21498** — `endTurn: () => triggerPlayerEndTurn()`, wewnątrz
   `(window as any).__eraTestDebug = {...}` (deklaracja obiektu @ 21476) — hak
   testowy dla Playwright, dokładnie ten opisany w dyspozycji jako
   `__eraTestDebug.endTurn`.
3. **main.ts:33092** — `triggerPlayerEndTurn();` wewnątrz listenera `keydown`, gałąź
   `if (e.code === 'KeyN' || e.key.toLowerCase() === 'n')` — skrót klawiszowy „N =
   koniec tury".

**Wszystkie trzy muszą zostać zaktualizowane w rundzie implementacyjnej** — dziś
wołają `triggerPlayerEndTurn()` bezpośrednio; po rozcięciu powinny wołać
`advanceSeat()` (orkiestrator z planu §A4), NIE bezpośrednio
`endActiveHumanTurn()`/`runWorldEndTurn()` — `advanceSeat()` musi sam zdecydować,
czy to koniec tury dla aktywnego człowieka (przełącz fotel) czy koniec tury świata
(ostatni fotel skończył → uruchom `runWorldEndTurn()`). Żadnych INNYCH call-site'ów w
pliku (m.in. brak wywołań z `game/*.ts` czy `ui/*.ts` — funkcja jest lokalna do
domknięcia w `main.ts`, niewyeksportowana).

## 5. Potwierdzenie stanu Etapów 0-3 (istotne dla realizmu planu Etapu 4)

Świeży grep potwierdza plan/genezę dyspozycji: `human-owners.ts` **istnieje**
(`gra/src/game/human-owners.ts`), importowany @ main.ts:1168
(`import { type HumanSeats, HUMAN_OWNER_PRIMARY, isAiOwner, isHumanOwner } from
'./game/human-owners';`). `humanSeats` deklarowane @ **10284**:
```ts
let humanSeats: HumanSeats = { humanOwnerIds: [HUMAN_OWNER_PRIMARY], activeHumanOwnerId: HUMAN_OWNER_PRIMARY };
```
— DZIŚ zawsze jeden fotel (zgodnie z komentarzem @ 10282-10286). `isAiOwner(humanSeats,
...)` używane w WIELU miejscach wewnątrz `triggerPlayerEndTurn` samej (m.in. **29291**,
**29430**, **30442-30443** — budowa listy `aiOwnerList` dla pętli AI) — **potwierdza, że
Etap 1 (31× `ownerId>0` → `isAiOwner`) jest już częściowo zintegrowany WEWNĄTRZ tej
konkretnej funkcji**, co jest DOBRĄ wiadomością dla Etapu 4: funkcja już dziś rozróżnia
"AI" przez `isAiOwner(humanSeats, ...)`, nie przez surowy `ownerId>0`, więc w wielu
miejscach jest bliżej gotowości na wielu-ludzi niż plan (napisany wcześniej) zakładał.
**ALE** — jak pokazują ryzyka #1 i #2 wyżej — nie WSZĘDZIE: dwie globalne pętle bez
filtra i dwa miejsca `ownerId===0` (bitwy) nadal zakładają dokładnie jednego człowieka.

## 6. Plan implementacji dla rundy 2 (tego samego tematu albo nowego)

### 6.1 Kolejność kroków (od najbezpieczniejszego)

1. **Krok 0 — literalny copy-paste bez zmiany semantyki.** Wydziel `runWorldEndTurn()`
   jako nową funkcję zawierającą DOKŁADNIE fazy 7-14 (od `turn++` @ 28647 do końca
   `try` @ 32930, WYŁĄCZAJĄC finally-flushe z fazy 15) — na razie WOŁANĄ z tego
   samego miejsca co dziś (bezpośrednio po fazie "gracza"), bez żadnej zmiany
   warunkowej ("czy to ostatni fotel"). To jest formalnie no-op przy jednym fotelu.
2. **Krok 1 — przenieś dwie globalne pętle (ryzyko #1) do `runWorldEndTurn()`.**
   `evictForeignUnitsFromCityHexes()` (28627) i reset ruchu wszystkich jednostek
   (28631-28643) — przenieś na SAM POCZĄTEK `runWorldEndTurn()` (przed `turn++` lub
   zaraz po, kolejność między nimi a `turn++` nie ma znaczenia funkcjonalnego, bo
   żadna z nich nie czyta `turn`). Weryfikacja no-op: identyczne przy jednym fotelu
   (dokładnie ta sama kolejność wykonania jak dziś, tylko inna nazwa funkcji
   otaczającej).
3. **Krok 2 — wydziel `endActiveHumanTurn()`** jako nazwę dla fazy 0-6 (28497-28646),
   BEZ dwóch przeniesionych pętli z kroku 1. Podpisz argumentem `humanOwnerId`
   (dziś zawsze `HUMAN_OWNER_PRIMARY`), zamień literał `0` w `runScoutsAutoExplore`
   (28587) na ten argument (przygotowanie pod Etap 6/`ME()`, ale MOŻE poczekać do
   Etapu 6 — decyzja orkiestratora, czy robić tu czy tam, nie ujmuję cichcem).
4. **Krok 3 — orkiestrator `advanceSeat()`.** Dziś (jeden fotel): woła
   `endActiveHumanTurn(HUMAN_OWNER_PRIMARY)`, potem BEZWARUNKOWO `runWorldEndTurn()`
   (bo jest tylko jeden fotel = zawsze ostatni). Podłącz WSZYSTKIE TRZY call-site'y z
   sekcji 4 (20910, 21498, 33092) na `advanceSeat()` zamiast `triggerPlayerEndTurn()`
   bezpośrednio; usuń/zdeprecjonuj nazwę `triggerPlayerEndTurn` albo zostaw jako
   cienki alias `= advanceSeat` (decyzja stylu, nie funkcjonalna).
5. **Krok 4 — flushe finally (fazy 15) zostają związane z `endActiveHumanTurn` albo
   z `advanceSeat`, NIGDY z `runWorldEndTurn`** (patrz uzasadnienie sekcja 3, akapit
   po tabeli 4 identyfikatorów) — muszą wykonać się PO KAŻDYM przełączeniu ekranu na
   człowieka (czyli i po `endActiveHumanTurn`, i po `runWorldEndTurn` gdy wraca do
   aktywnego człowieka), nie tylko raz na koniec.
6. **Krok 5 (dopiero gdy krok 1-4 przejdą dowód no-op) — NIE ruszać jeszcze
   bitew (ryzyko #2) ani zwycięstwa (ryzyko #3) w tej rundzie implementacyjnej** —
   to są zmiany zachowania (nie no-op), należą do etapu, w którym `humanOwnerIds`
   faktycznie ma >1 element (Etap 5 lub 8 wg numeracji planu), nie do samego
   rozcięcia funkcji. Zostawić jako udokumentowany, jawny dług (TODO z odsyłaczem do
   tego dokumentu) w kodzie po rozcięciu.

### 6.2 Dowód no-op — konkretna, automatyzowalna propozycja

Plan cytuje kryterium „30 tur bez różnicy w logach EOT przy 1 człowieku" — poniżej
konkretyzacja:

**Mechanizm: multi-turn headless simulation z hashem stanu, PRZED i PO rozcięciu, dla
ustalonego seeda — jako NOWY plik `gra/tools/hotseat-etap4-noop-test.cjs`, tego
samego wzorca co istniejące `gra/tools/*-test.cjs`** (zweryfikowane w planie §H2 pkt 1:
cały silnik już się bunduje esbuildem i uruchamia headless w Node, zero DOM).

1. **Wejście:** nowa gra z ustalonym seedem mapy (ten sam `_menuAdvanced`/seed co
   istniejące testy sesyjne używają — sprawdzić `tools/logic-test.cjs` jako wzorzec
   inicjalizacji stanu gry headless).
2. **Pętla:** wywołaj `__eraTestDebug.endTurn()` (albo bezpośrednio
   `triggerPlayerEndTurn`/`advanceSeat` po rozcięciu — TEN SAM hak testowy z sekcji 4
   pkt 2, już istnieje, już używany przez inne testy Playwright wg komentarzy w kodzie
   @ 19228/22231/22333) **30 razy pod rząd** (kryterium planu).
3. **Po KAŻDEJ turze policz hash stanu** z deterministycznego, kanonicznego
   serializowanego zrzutu — NAJLEPIEJ ponownie użyć `buildSaveGameSnapshot()` (main.ts
   ~26713+, już istnieje, już dowiedziony jako kompletny wg planu §H2 pkt 4) ZAMIAST
   pisać nowy serializer — zastosuj `JSON.stringify` na obiekcie zwróconym przez
   `buildSaveGameSnapshot()` z kluczami posortowanymi (`JSON.stringify(obj, Object.keys(obj).sort())`
   albo dedykowany stabilny stringifier) i policz np. SHA-256 tego stringa (Node
   `crypto.createHash('sha256')`).
4. **Uruchom dwukrotnie**: raz na kodzie SPRZED rozcięcia (checkout/build z commita
   przed rundą 2), raz PO rozcięciu (bieżący branch) — **z tym samym seedem i tymi
   samymi (deterministycznymi) rozkazami gracza w każdej turze** (najprościej: brak
   żadnych rozkazów poza samym `endTurn` — gracz nic nie robi poza kończeniem tury,
   co eliminuje zmienność wynikającą z ręcznych akcji i testuje WYŁĄCZNIE silnik
   EOT, dokładnie to, co rozcięcie zmienia).
5. **Porównaj listę 30 hashy** (jedna lista per uruchomienie) — **identyczne
   sekwencje hashy = dowód, że rozcięcie jest no-opem behawioralnym dla 1 fotela,
   turę po turze, nie tylko "na końcu"** (wykrywa też przejściowe rozjazdy, które
   zniknęłyby po wielu turach — mocniejszy dowód niż samo porównanie stanu końcowego).
6. **Uwaga na `Math.random()`** (plan §H3 pkt 2: 11 wystąpień w `main.ts`, w tym 6
   generatorów ID jednostek i `pickVillageReward`) — te ID zawierają
   `Math.random().toString(36)`, więc identyczne pola `id` między dwoma uruchomieniami
   NIE są gwarantowane nawet bez żadnej zmiany kodu. **Rozwiązanie dla TEGO testu
   (nie dla całego H3, poza zakresem):** hash powinien pomijać/normalizować pola `id`
   jednostek wygenerowane z `Math.random()` (np. zastąp każdy `id` pasujący do wzorca
   `_[a-z0-9]{X}$` (fragment z `Math.random().toString(36)`) placeholderem przed
   hashowaniem), ALBO (prościej, mocniej) **wstrzyknij deterministyczny
   `Math.random` na czas testu** (monkey-patch `Math.random = mulberry32(seed)` przed
   uruchomieniem obu wariantów, w tym samym pliku testowym) — to jest DOKŁADNIE
   wzorzec, który plan §H3 rekomenduje ogólnie dla multiplayera, tu użyty punktowo,
   tylko na czas tego jednego testu, bez zmiany kodu produkcyjnego.
7. **Kryterium PASS:** 30/30 identycznych hashy w obu uruchomieniach. Jakakolwiek
   rozbieżność = FAIL, z dokładnym numerem tury pierwszej rozbieżności (ułatwia
   debug — different od "porównaj stan końcowy", który nie mówi KIEDY rozjazd
   powstał).

To spełnia "konkretny, zweryfikowalny dowód no-op" z reguły anty-halucynacyjnej —
nie jest to "powinno działać", to jest wykonywalny skrypt z jednoznacznym PASS/FAIL.

## 7. Rekomendacja osobna (NIE zmieniam założeń planu cichcem — zgłaszam do decyzji)

1. **Długość funkcji potwierdzona na 4469 linii pliku (32966−28497), zgodna z
   "ok. 4500-4600 linii" z planu/dyspozycji** — brak rozbieżności do wyjaśniania
   (pierwszy szkic tej rundy miał tu błąd transkrypcji numeru klamry zamykającej,
   naprawiony w sekcji 0 przed zapisem finalnej wersji — patrz notka tamże). Zostawiam
   ten punkt w sekcji rekomendacji wyłącznie jako ślad audytowy, że taka pomyłka
   powstała i została złapana WEWNĄTRZ tej samej rundy, a nie przez Evaluatora.
2. **Ryzyko #2 (bitwy AI/barbarzyńca→gracz hardkodowane na `ownerId===0`, main.ts:32105
   i 32766) nie było wymienione w liście 31 miejsc Etapu 1 planu** — rekomendacja:
   albo doklejić do zakresu Etapu 1 (jeśli ten temat ma być jeszcze otwierany), albo
   jawnie ująć w planie implementacji Etapu 4/5 jako osobny punkt (nie milczący
   side-effect rozcięcia).
3. **Ryzyko #3 (`VictoryInput.gracz: 0` hardkodowane, main.ts:32834)** — nieujęte w
   dyspozycji ani w §D planu (dziesięć ryzyk planu nie wymienia zwycięstwa explicite),
   ale realne dla hot-seat 2-graczowego — rekomendacja: dopisać do §D planu jako
   ryzyko #11 albo do zakresu Etapu 4/8.
4. **Reset ruchu WSZYSTKICH jednostek i eviction (ryzyko #1)** — rekomendacja
   skonkretyzowana już w §6.1 krok 1 (przenieść do `runWorldEndTurn`), ale samo
   ISTNIENIE tego wzorca (kod "światowy" tekstowo osadzony w bloku "gracza", przed
   `turn++`) sugeruje, że MOGĄ istnieć inne, jeszcze nieznalezione takie miejsca w
   fazach 1-6 (28497-28646) — `runPlannedMarchesAtPlayerEndTurn()` (poz. 4 w tabeli
   sekcji 1) NIE została zweryfikowana od środka w tej rundzie (tylko po nazwie/
   komentarzu) — **jawny dług do zamknięcia na START rundy 2, PRZED napisaniem kodu
   rozcięcia**, żeby nie powtórzyć tego samego typu przeoczenia.

## 8. Binarne kryterium sukcesu tej rundy — checklist

- [x] Kompletna mapa faz z numerami linii — sekcja 1 (16 wierszy, cała funkcja
      28497-32966 pokryta bez luk).
- [x] `turn++` zlokalizowane świeżym grepem — jedno wystąpienie, 28647 (sekcja 1,
      wiersz 7; potwierdzenie w sekcji 0).
- [x] Cztery identyfikatory z dyspozycji potwierdzone świeżym grepem pod tymi
      nazwami, z numerami linii DZIŚ — sekcja 3.
- [x] Konkretny punkt cięcia z uzasadnieniem per-fazowym, NIE ogólnikowym — sekcja
      1 (kolumna Klasyfikacja) + sekcja 6.1 (kroki 1-4), z dwoma jawnie nazwanymi
      wyjątkami (ryzyko #1) które trzeba PRZESUNĄĆ względem granicy tekstowej
      `turn++`, nie zostawić "gdzieś w środku".
- [x] Lista WSZYSTKICH miejsc wywołania `triggerPlayerEndTurn()` poza nią samą —
      sekcja 4, trzy miejsca, świeży grep, zero pominięć.
- [x] Konkretny, automatyzowalny plan dowodu no-op — sekcja 6.2, wykonywalny
      przepis (hash SHA-256 po 30 turach, dwa uruchomienia, deterministyczny RNG).
- [x] Zero zmian w `gra/src/**` — WYŁĄCZNIE ten plik zapisany, `git status` do
      weryfikacji przez Evaluatora pokaże jeden nowy plik w allowlisście.

## 9. Runda 2 — odpowiedź na 5 zarzutów Evaluatora (wszystkie PRZYJĘTE)

Wszystkie pięć zarzutów zweryfikowane samodzielnie świeżym odczytem/grepem w tej
rundzie, PRZED napisaniem tej sekcji. Wszystkie pięć — **PRZYJMUJĘ**, żaden nie jest
kwestionowany. Uzupełnienia poniżej, plan implementacji (sekcja 6) traktować jako
zaktualizowany o punkty 4 i 5 niżej.

### Zarzut 1 — PRZYJMUJĘ: pętla czyszcząca `st.bunt` to RYZYKO #1b, ta sama klasa co Ryzyko #1

Świeży odczyt main.ts:28524-28528 (dziś, po przesunięciu o ~1 linię względem
cytatu Evaluatora z rundy 1 — treść identyczna):
```ts
// B2-Q5: wyczyść flagi buntu z poprzedniej tury (chip/ikona do końca tury).
for (const st of cityOrderState.values()) {
  if (st.bunt) st.bunt = undefined;
}
```
Trafna korekta sekcji 1, wiersz 1: klasyfikacja „WSZYSTKO odnosi się do `anim`" była
NIEŚCISŁA — ten fragment nie ma nic wspólnego z `anim`, operuje na
`cityOrderState: Map<string, OrderState>` (potwierdzone deklaracją main.ts:4303,
key = `city.id`, BEZ klucza ownera) — czyli na WSZYSTKICH miastach w grze, nie tylko
gracza. To dokładnie ten sam wzorzec strukturalny co Ryzyko #1 (kod „światowy"
tekstowo osadzony w bloku „gracza", przed `turn++` @ 28647). Nazywam go **Ryzyko #1b**
i dopisuję do listy przenoszonych bloków w §6.1 Krok 1 (patrz aktualizacja niżej).
Efekt praktyczny przy podwójnym wywołaniu w hot-seat: prawdopodobnie nieszkodliwy
(ten sam argument idempotencji co dla `evictForeignUnitsFromCityHexes` — między
dwoma wywołaniami w tej samej turze świata żaden mechanizm jeszcze nie ustawia
nowych flag `bunt`), ale **musi zostać przeniesiony do `runWorldEndTurn()`** razem z
resztą Ryzyka #1, z tego samego powodu: tekstowa pozycja przed `turn++` nie
gwarantuje semantyki „raz na turę świata" gdy blok „gracza" zacznie się wykonywać
per-fotel. **Aktualizacja §6.1 Krok 1:** przenieść TRZY bloki, nie dwa —
`evictForeignUnitsFromCityHexes()` (28627), reset ruchu wszystkich jednostek
(28631-28643), ORAZ czyszczenie `st.bunt` (28524-28528) — wszystkie trzy na sam
początek `runWorldEndTurn()`.

### Zarzut 2 — PRZYJMUJĘ: `pendingAutoRationForNextTurn` to drugi przypadek klasy Ryzyka #4

Świeży grep + odczyt main.ts:28907-28909 (blok ekonomii, faza 10):
```ts
if (autoRationResult.adjusted) {
  autoRationAnyAdjusted = true;
  if (ownerId === 0) {
    pendingAutoRationForNextTurn = autoRationResult;
  }
}
```
— ustawiane WYŁĄCZNIE dla `ownerId === 0`, mimo że `autoRationResult.adjusted` jest
liczone dla KAŻDEGO ownera (pętla per-owner). Flush potwierdzony main.ts:32915-32920,
wewnątrz `try`, TUŻ PRZED `finally` (32931+):
```ts
if (pendingAutoRationForNextTurn?.adjusted) {
  rationAutoEventLog.unshift(
    buildAutoRationSidePanelEvent(pendingAutoRationForNextTurn, turn),
  );
  ...
  pendingAutoRationForNextTurn = null;
}
```
Strukturalnie identyczne do Ryzyka #4 (`deferredPlayerUnitRevealIds`, main.ts:30095,
też `ownerId===0`-owe mimo per-owner źródła danych). Konsekwencja w hot-seat: dla
człowieka #2 komunikat HUD „Auto-dostosowano racje" (side panel event) nigdy się nie
pojawi, mimo że mechanizm auto-wyrównania faktycznie zadziałał na jego ekonomii —
regres widoczności, nie regres mechaniki. **Dopisuję jako Ryzyko #4b** (obok #4
istniejącego), z tą samą rekomendacją naprawy: zamienić na strukturę keyowaną
ownerem (np. `Map<ownerId, AutoRationResult>` albo analogiczny wzorzec do
`deferredPlayerUnitRevealIds` po generalizacji na `isHumanOwner`) — do §7 listy
rekomendacji, nie blokuje Kroku 0-4 planu (kod ekonomii NIE jest częścią cięcia
gracz/świat, jest już `[ŚWIAT]` w całości wg tabeli sekcji 1, wiersz 10).

### Zarzut 3 — PRZYJMUJĘ: `promptMergeIfCoLocated` ma guard `ownerId !== 0` PRZED warunkiem, który cytowałem

Świeży odczyt main.ts:10908-10909 (sygnatura i pierwsza linia ciała
`promptMergeIfCoLocated`):
```ts
if (movedUnitIds.length === 0) return;
const movedSet = new Set(movedUnitIds);
const rep = units.find(x => x.id === movedUnitIds[0]);
if (!rep || rep.ownerId !== 0) return;
```
— potwierdzone: ten `return` wykonuje się PRZED dotarciem do warunku
`endTurnInProgress || isPreBattleOpen() || isDiplomacyAudienceOpen()` (main.ts:10928,
ten sam warunek, który zacytowałem w sekcji 3 rundy 1 jako „SEDNO ryzyka #4/#5" —
cytat rundy 1 był prawdziwy, ale NIEKOMPLETNY, bo pomijał wcześniejszy guard
ownera). Konsekwencja w hot-seat: dla jednostek człowieka #2 (`ownerId !== 0`)
funkcja `return`-uje na linii 10909, więc scalenie NIGDY nie trafia do
`deferredMergePrompts` (kolejka pozostaje pusta dla tego ownera niezależnie od stanu
`endTurnInProgress`/modali) — to jest TA SAMA klasa ryzyka co #4/#4b, tylko dla
identyfikatora już nazwanego w dokumencie rundy 1 bez zauważenia tej konkretnej
bramki. **Dopisuję jako Ryzyko #4c.** Rekomendacja naprawy: `rep.ownerId !==
activeHumanOwnerId` (po podłączeniu `humanSeats`), analogicznie do #4/#4b.

### Zarzut 4 — PRZYJMUJĘ: `nextTurnNum` to nienazwana zależność między-fazowa przez granicę cięcia

Świeży grep całego zakresu funkcji potwierdza:
```
28521:  const nextTurnNum = turn + 1;
28522:  beginTurnTransition(nextTurnNum);
28645:  setTurnTransition(6, ..., nextTurnNum);   ← PRZED turn++ (28647), blok "gracz"
28647:  turn++;
28692:  setTurnTransition(10, ..., nextTurnNum);  ← PO turn++, blok "świat"
28703:  setTurnTransition(14, ..., nextTurnNum);
30426:  setTurnTransition(38, ..., nextTurnNum);
30715:  setTurnTransition(aiPct, ..., nextTurnNum);
32480:  setTurnTransition(94, ..., nextTurnNum);
32806:  setTurnTransition(98, ..., nextTurnNum);
```
Potwierdzone: `nextTurnNum` zadeklarowana @ 28521 (wewnątrz fazy 1, którą tabela
sekcji 1 klasyfikuje jako `[GRACZ]`/`endActiveHumanTurn`), ale UŻYWANA w pięciu
miejscach z sześciu PO `turn++` (28647) — czyli wewnątrz zakresu, który §6.1 Krok 0
planuje wyciąć DOSŁOWNIE do `runWorldEndTurn()`. Krok 0 w obecnym brzmieniu
("literalny copy-paste... fazy 7-14") faktycznie zostawia martwe odwołanie do
zmiennej z domknięcia funkcji-matki, jeśli `runWorldEndTurn()` stanie się osobną
funkcją najwyższego poziomu (nie zagnieżdżonym domknięciem) — `nextTurnNum` przestaje
być widoczna. **Aktualizacja §6.1 Krok 0 (obowiązkowa, nie kosmetyczna):** dopisać
explicite, że `runWorldEndTurn()` musi albo (a) przyjąć `nextTurnNum` jako parametr
wejściowy przekazany przez `advanceSeat()`/`endActiveHumanTurn()`, albo (b) przeliczyć
`const nextTurnNum = turn + 1` na WŁASNYM starcie, PRZED `turn++` wewnątrz tej nowej
funkcji (opcja (b) jest prostsza i bezpieczniejsza — nie wymaga zgodności sygnatur
między krokami cięcia). Bez tej poprawki Krok 0 nie jest w praktyce "dosłownym"
copy-paste, jak zakładało pierwotne sformułowanie.

### Zarzut 5 — PRZYJMUJĘ: 10 wywołań `flushDeferredAutoPreBattle()`, nie 11

Świeży grep (`grep -n "flushDeferredAutoPreBattle()" gra/src/main.ts`) daje 12
trafień: 5815, 10991, 11060, 11297, 11305, 11371, 11375, 19905, 25585, 28325, 28341,
32957. Z tych, **28325 i 28341 są liniami komentarza** (tekst „...flushDeferredAuto
PreBattle() hasn't fired..." / polski odpowiednik), nie wywołaniami. Faktycznych
wywołań: **10**, nie 11 jak podałem w rundzie 1 (sekcja 3, akapit `preBattle`).
Korekta: „wołana wielokrotnie w całym pliku (10 miejsc, potwierdzone grepem z
wykluczeniem 2 linii komentarza @ 28325, 28341)". Nie wpływa na żaden wniosek
dokumentu — liczba miejsc wywołania nie zmienia klasyfikacji fazowej ani ryzyk.

### Podsumowanie zmian stanu dokumentu po rundzie 2

- Sekcja 1, wiersz 1: klasyfikacja doprecyzowana — zawiera też Ryzyko #1b (`st.bunt`).
- Sekcja 3, akapit `preBattle`: liczba wywołań poprawiona 11→10.
- Sekcja 6.1 Krok 0: dopisany wymóg jawnej obsługi `nextTurnNum` (parametr albo
  przeliczenie lokalne) — bez tego Krok 0 nie jest bezpiecznym no-opem.
- Sekcja 6.1 Krok 1: rozszerzony z dwóch na TRZY przenoszone bloki (dodane Ryzyko #1b).
- Nowe pozycje długu: Ryzyko #4b (`pendingAutoRationForNextTurn`), Ryzyko #4c
  (`promptMergeIfCoLocated` guard ownera) — obie do §7 listy rekomendacji, ta sama
  kategoria co #4 (hardkodowany `ownerId===0` na kolejce/fladze zamiast per-owner).
- Żadna z pięciu poprawek nie zmienia głównego wniosku dokumentu (punkt cięcia,
  16 faz, 3 call-site'y, plan dowodu no-op) — wszystkie pięć to doprecyzowania
  dokładności/kompletności w ramach już przyjętej struktury.
