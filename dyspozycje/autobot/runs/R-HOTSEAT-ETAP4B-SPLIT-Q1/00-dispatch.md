STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP4B-SPLIT-Q1
GOAL: Drugi i ostatni pod-etap właściwego rozcięcia `triggerPlayerEndTurn()` (Etap 4 planu
hot-seat, "najwyższe ryzyko całego planu"). Wykonaj Krok 2-4 z planu implementacji recon
(`dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/01-operator-runda1-analiza.md`,
sekcja 6.1) — wydzielenie `endActiveHumanTurn()`, orkiestrator `advanceSeat()`, przepięcie
trzech call-site'ów. **Krok 5 (bitwy AI/barbarzyńca→gracz, zwycięstwo) POZOSTAJE POZA
ZAKRESEM tej rundy** — recon explicite ostrzega, że to są zmiany zachowania, nie no-op,
należą do Etapu 5/8. NIE ruszaj `ownerId === 0` w kontekście bitew/zwycięstwa.

WYMAGANY WSTĘP — PRZECZYTAJ W CAŁOŚCI PRZED ROZPOCZĘCIEM PRACY:
1. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/01-operator-runda1-analiza.md`
   (555 linii, pełny recon — sekcja 2 "Struktura sterowania" jest KRYTYCZNA, opisuje
   asynchroniczną naturę `runAiPhase`/modal bitwy, którą ten pod-etap musi respektować,
   nie próbować naprawiać).
2. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1/01-operator-runda1.md`
   (raport z poprzedniego pod-etapu, JUŻ ZINTEGROWANY do `main` — `runWorldEndTurn()` już
   istnieje, wołana z `triggerPlayerEndTurn()` przez `await runWorldEndTurn();`).

**OSTRZEŻENIE (jak zawsze w tym planie): main.ts zmienia się codziennie. Numery linii
poniżej są z chwili integracji Etapu 4a — zweryfikuj WSZYSTKO świeżym grepem PRZED edycją,
nie ufaj tym liczbom.** Stan po Etapie 4a (dla orientacji, do potwierdzenia): funkcja
`triggerPlayerEndTurn` zaczyna się ok. main.ts:28643 (nowa `runWorldEndTurn` tam wstawiona
jako pierwsza deklaracja w domknięciu), call-site `await runWorldEndTurn();` ok. main.ts:33122
w miejscu dawnego `turn++`, koniec funkcji ok. main.ts:33153.

ZADANIE (dokładnie Krok 2-4 z sekcji 6.1 recon):

**Krok 2 — wydziel `endActiveHumanTurn(humanOwnerId: number)`** jako nazwę dla faz 0-6
(dzisiejszy blok "gracza" od guardu synchronicznego do wywołania `await runWorldEndTurn()`),
BEZ trzech bloków już przeniesionych w Etapie 4a (nie przenoś ich ponownie — już są w
`runWorldEndTurn()`). Sygnatura z argumentem `humanOwnerId` (dziś zawsze
`HUMAN_OWNER_PRIMARY`, importowane z `game/human-owners.ts`, już używane w Etapach 0-3).
**Literał `0` w `runScoutsAutoExplore(...)` (recon sekcja 1, wiersz 2, 4. argument
`playerOwnerId`) ZOSTAJE NIETKNIĘTY w tej rundzie** — recon jawnie mówi że ta podmiana
"MOŻE poczekać do Etapu 6" (migracja ~272 `ownerId===0` wg tabeli B2 planu) — orkiestrator
decyduje: robimy to w Etapie 6, nie tutaj, żeby nie poszerzać zakresu tego już-ryzykownego
tematu. Jeśli znajdziesz analogiczne literały `0` w tym samym bloku faz 0-6, którym recon
nie poświęcił uwagi — zostaw je również nietknięte i odnotuj w raporcie (nie naprawiaj przy
okazji).

**Krok 3 — orkiestrator `advanceSeat()`.** Nowa funkcja, dziś (jeden fotel, `humanSeats.
humanOwnerIds.length === 1`): woła `await endActiveHumanTurn(HUMAN_OWNER_PRIMARY);`, potem
BEZWARUNKOWO (bo jeden fotel = zawsze ostatni) już nic więcej — `runWorldEndTurn()` jest
JUŻ wołana WEWNĄTRZ `endActiveHumanTurn`/`triggerPlayerEndTurn` po Etapie 4a, nie osobno z
`advanceSeat`. **Rozstrzygnij i udokumentuj JEDNĄ z dwóch poprawnych architektur**:
(a) `triggerPlayerEndTurn()` zostaje cienkim aliasem woła jącym `advanceSeat()`, a
`advanceSeat()` woła `endActiveHumanTurn()` (która sama w sobie kończy się wywołaniem
`runWorldEndTurn()` jak dziś po Etapie 4a) — najmniejsza zmiana strukturalna, ALBO
(b) `advanceSeat()` przejmuje ODPOWIEDZIALNOŚĆ za wywołanie `runWorldEndTurn()` PO
`endActiveHumanTurn()` zamiast zostawiać to wewnątrz `endActiveHumanTurn`/starej funkcji —
czystsza separacja zgodna z docelową architekturą planu (`endActiveHumanTurn`/
`runWorldEndTurn`/`advanceSeat` jako TRZY rozłączne funkcje, żadna nie woła drugiej
bezpośrednio, tylko `advanceSeat` orkiestruje obie). **Rekomendacja: (b), bo to jest
DOSŁOWNIE cel architektury z planu §C — jeśli wybierzesz (a), napisz wprost w raporcie
dlaczego i czy to nie jest tylko odłożenie Kroku 3 na później.** Podłącz WSZYSTKIE TRZY
zewnętrzne call-site'y `triggerPlayerEndTurn()` (main.ts, HUD przycisk „Zakończ turę" /
`__eraTestDebug.endTurn` / skrót klawiszowy „N" — recon sekcja 4, zweryfikuj świeżym grepem
że to nadal dokładnie trzy miejsca) na `advanceSeat()` zamiast `triggerPlayerEndTurn()`
bezpośrednio.

**Krok 4 — flushe `finally` (dzisiejsza faza 15: `endTurnTransition()`,
`endTurnInProgress=false`, `flushDeferredPlayerUnitReveals()`, `flushDeferredMergePrompts()`,
`flushDeferredAutoPreBattle()`, `flushPendingEraChangeToast()`, `syncPlayerUnitSelectionOnMap()`)
MUSZĄ zostać związane z `endActiveHumanTurn()` (albo z `advanceSeat()` bezpośrednio po
`endActiveHumanTurn()` zwróci — NIGDY z `runWorldEndTurn()`.** Uzasadnienie z recon (sekcja
3, akapit po tabeli 4 identyfikatorów, cytat kodu @ main.ts ok. 32938-32952 sprzed Etapu 4a —
zweryfikuj nowy numer): te flushe świadomie czekają na `endTurnInProgress===false`, bo
dopiero wtedy ekran należy do gracza. Jeśli trafią do `runWorldEndTurn()`, złamią tę
gwarancję. **KRYTYCZNE: `try`/`catch`/`finally` dziś otacza CAŁY `async IIFE` (obie fazy,
gracz+świat) — musisz zdecydować, jak rozłożyć try/catch/finally między
`endActiveHumanTurn()` i `advanceSeat()` tak, żeby błąd w `runWorldEndTurn()` WCIĄŻ
skutkował tymi samymi flushami/resetem `endTurnInProgress` co dziś (nie zgub obsługi
błędów przy rozcinaniu).**

**NIE RUSZAJ** (Krok 5, poza zakresem, jawny dług — dopisz komentarz TODO z odsyłaczem do
recon w kodzie, jeśli naturalnie pasuje, ale NIE zmieniaj logiki): bitwy AI/barbarzyńca→gracz
(`ownerId===0` @ main.ts, recon Ryzyko #2), `VictoryInput.gracz: 0` (recon Ryzyko #3),
`pendingAutoRationForNextTurn`/`promptMergeIfCoLocated` guard (recon Ryzyka #4b/#4c —
te dwa zostają jak są, migracja na `isHumanOwner` to Etap 6/8).

WERYFIKACJA no-op (OBOWIĄZKOWA, identyczna metoda co Etap 4a):
Bramka `gra/tools/hotseat-etap4-noop-test.cjs` (już istnieje, zintegrowana). Uruchom PRZED
zmianą (baseline na dzisiejszym `main`, PO Etapie 4a) i PO zmianie — porównaj WSZYSTKIE 30
hashy, nie tylko A==B wewnątrz jednego przebiegu. Jeśli po zmianie hashe się różnią od
baseline — zatrzymaj się, zbadaj która tura i dlaczego (prawdopodobna przyczyna: coś w
try/catch/finally wykonuje się w innej kolejności albo innej liczbie razy niż dziś).

BINARNE KRYTERIUM SUKCESU:
1. `endActiveHumanTurn(humanOwnerId)`, `advanceSeat()` istnieją jako nazwane funkcje z
   jasno rozdzielonymi odpowiedzialnościami (patrz Krok 3, wybór architektury (a)/(b)
   udokumentowany).
2. Wszystkie TRZY zewnętrzne call-site'y `triggerPlayerEndTurn()` wołają teraz
   `advanceSeat()` (bezpośrednio albo przez cienki alias — zdecyduj i udokumentuj).
3. Cztery flushe z fazy 15 (deferred reveals/merge prompts/pre-battle/era-change-toast)
   nadal wykonują się w tym samym miejscu względem `endTurnInProgress=false` co dziś —
   zero regresji obsługi race'u preBattle/modal (recon sekcja 3).
4. `hotseat-etap4-noop-test.cjs` PO zmianie daje IDENTYCZNE 30 hashy jak baseline (main po
   Etapie 4a, PRZED tą zmianą) — nie tylko A==B.
5. Krok 5 (bitwy/zwycięstwo) jawnie nietknięty — potwierdzone diffem, zero zmian poza
   zakresem Kroków 2-4.

ALLOWLISTA:
- `gra/src/main.ts` (WYŁĄCZNIE Krok 2-4 z recon — zakaz Kroku 5)
- `gra/tools/*.cjs` (jeśli potrzebne nowe asercje potwierdzające istnienie/wywołanie
  `endActiveHumanTurn`/`advanceSeat` — NIE modyfikuj logiki `hotseat-etap4-noop-test.cjs`
  bez wyraźnej potrzeby)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP4B-SPLIT-Q1/*`
Zakaz `git add -A`. Zakaz dotykania `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` (aktualizacja
statusu to zadanie orkiestratora przy integracji).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania rozcięcia za poprawne na podstawie SAMEGO
czytania kodu — wymagany realny przebieg bramki no-op PRZED i PO, z zachowanym baseline do
porównania. Dodatkowo: zakaz uznania obsługi błędów (try/catch/finally) za zachowaną bez
JAWNEGO prześledzenia, gdzie dziś ląduje `catch`/`finally` względem nowego podziału funkcji
— to jest dokładnie ten rodzaj przeoczenia (Zarzut 4 rundy 2 recon dla `nextTurnNum`), który
już raz umknął w tym samym temacie.

IZOLACJA: worktree `/home/user/wt-hotseat-etap4b-split`, gałąź
`autobot/R-HOTSEAT-ETAP4B-SPLIT-Q1`, baza `origin/main` @ `dfb051d3` (Etap 4a już
zintegrowany na tym commicie — `runWorldEndTurn()` istnieje w `main.ts`).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only. Po zielonym Etapie 4b: Etap 4 planu
hot-seat jest KOMPLETNY (Krok 0-4 wszystkie zintegrowane); następny w kolejności jest
Etap 6 (migracja ~272 `ownerId===0`), Etap 5 (switchActiveHuman/hotSeatHandoff, recon w
toku równolegle) może być integrowany niezależnie w dowolnej kolejności względem Etapu 6.
DEPLOY/PUSH: NIE WYKONANO
