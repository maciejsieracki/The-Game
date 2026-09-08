STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP4B-SPLIT-Q1
GOAL: Final Control — niezależna weryfikacja Kroku 2-4 z recon (`R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1`
§6.1): wydzielenie `endActiveHumanTurn(humanOwnerId)`, orkiestrator `advanceSeat()`, przepięcie
WSZYSTKICH TRZECH zewnętrznych call-site'ów, zachowanie identycznego try/catch/finally (cztery
flushe fazy 15), no-op behawioralny przy jednym fotelu, Krok 5 (bitwy/zwycięstwo) nietknięty.
**To jest OSTATNI pod-etap Etapu 4 planu hot-seat — po tym PASS, Etap 4 (Kroki 0-4) jest
KOMPLETNY.**

## Metoda (niezależna od raportów Operatora/Evaluatora)

Cały diff `dfb051d3..df76db7f -- gra/src/main.ts` przeczytany linia po linii (`git show
df76db7f`, potwierdzone dokładnie 5 hunków, zero zmian poza nimi via `git diff --stat`).
Przeczytane w całości ciała: `endActiveHumanTurn` (32999-33166), `advanceSeat` (33174-33176),
alias `triggerPlayerEndTurn` (33181-33183). Trzy call-site'y odczytane w kontekście (21030-21044,
21620-21634, 33296-33311). Przeczytany w całości recon §2 „Struktura sterowania" i §4 „Miejsca
wywołania" jako punkt odniesienia. Uruchomione SAMODZIELNIE, na świeżych worktree (nie na
worktree Operatora dla baseline'u): `git worktree add --detach /tmp/wt-fc-baseline-etap4b
dfb051d3` (usunięty po zakończeniu, `git worktree remove --force`).

## (a) Ciało `endActiveHumanTurn` bajt-w-bajt identyczne z dawnym `triggerPlayerEndTurn`

Potwierdzone diffem: jedyne zmiany w hunku 32988-33004 to nagłówek komentarza, rename
`triggerPlayerEndTurn`→`endActiveHumanTurn(humanOwnerId: number)` i wstawka `void
humanOwnerId;`. ZERO linii ciała (guard, `endTurnInProgress`, cały `try`/`catch`/`finally`,
cztery flushe fazy 15) usuniętych/zmienionych — potwierdzone też niezależnie liczeniem `git
diff ... | grep "^-"` (dokładnie 4 usunięte linie: 3 stare wywołania + stara deklaracja).
Literał `0` w `runScoutsAutoExplore` (main.ts:33085) i sąsiednie `u.ownerId===0` w bloku
anim/scout celowo nietknięte, zgodnie z dyspozycją (Etap 6) — potwierdzone.

## (b)-(d) `advanceSeat()`, alias, trzy call-site'y

`advanceSeat()` (33174-33176) woła `endActiveHumanTurn(HUMAN_OWNER_PRIMARY)` —
`HUMAN_OWNER_PRIMARY` zweryfikowany jako realny import z `game/human-owners.ts` (main.ts:1169),
nie literał. `triggerPlayerEndTurn` (33181-33183) to dziś cienki alias `advanceSeat()`. Trzy
call-site'y potwierdzone odczytem kontekstu: HUD `onEndTurn` (21042), `__eraTestDebug.endTurn`
(21630), keydown „N" (33309) — wszystkie trzy wołają `advanceSeat()`. Grep całego `src/`
(`triggerPlayerEndTurn|advanceSeat|endActiveHumanTurn`) potwierdza zero wywołań poza `main.ts`
(jedyne trafienie w `cityPanel.ts` to dwa komentarze, nie kod). Zero zmian w `gra/tools/`.

## (e) Krok 5 nietknięty

Pełny diff = dokładnie 5 hunków (`git diff dfb051d3 df76db7f -- gra/src/main.ts | grep "^@@"`):
21039, 21627, 32988, 33156, 33280 — żaden nie dotyka bloku bitwy/zwycięstwa (32802-32891
w bieżącym pliku: `ownerId===0` @ 32105/32766, `VictoryInput.gracz: 0` @ 32891, wszystkie poza
zasięgiem zmiany).

## Ocena własna wyboru architektury (a) vs (b) — Krok 3

Dyspozycja rekomendowała (b) (advanceSeat przejmuje wywołanie `runWorldEndTurn()` PO
`endActiveHumanTurn()`, trzy rozłączne funkcje). Operator wybrał (a) (`runWorldEndTurn()`
zostaje wołana z WEWNĄTRZ `endActiveHumanTurn`, `advanceSeat` to dziś cienki punkt wejścia) —
z pisemnym uzasadnieniem w `01-operator-runda1.md`. Moja niezależna ocena, nie powtórzenie za
Evaluatorem: uzasadnienie jest solidne. Właściwa (b) wymagałaby rozbicia DZISIEJSZEGO jednego
`try/catch/finally` (obejmującego razem fazę gracza i `runWorldEndTurn()`) na dwie funkcje, przy
zachowaniu DZIŚ istniejącej gwarancji, że (1) guard `canPlayerInitiateEndTurn()` odrzucający
PRZED ustawieniem `endTurnInProgress` nigdy nie uruchamia flushy/`runWorldEndTurn()` (czysty
early-return), oraz (2) błąd w fazie gracza NIGDY nie dociera do `runWorldEndTurn()`. Zaimplementowanie
(b) poprawnie wymaga, by `endActiveHumanTurn` zwracała sygnał odróżniający „guard odrzucił,
brak startu" od „faza zakończona"/„faza rzuciła wyjątek" — inaczej `advanceSeat` albo uruchomi
`runWorldEndTurn()` mimo odrzucenia przez guard, albo połknie błąd fazy gracza i i tak przejdzie
dalej. To jest realna zmiana zachowania na ścieżce błędu/guard-reject, której 30-turowa bramka
no-op (happy path, zero wstrzykniętych błędów) NIE wykrywa — dokładnie ten rodzaj przeoczenia, na
który ostrzega REGUŁA PRZECIW SAMOOSZUKIWANIU dyspozycji. Wybór (a) nie jest unikiem: Krok 3
wymagał nazwanych `endActiveHumanTurn`/`advanceSeat` z jasnymi rolami ORAZ przepięcia wszystkich
trzech call-site'ów — oba warunki spełnione. Jedyne co odłożone to wewnętrzne miejsce wywołania
`runWorldEndTurn()`, co i tak wymaga przeprojektowania dopiero w Etapie 8 (gdy `advanceSeat`
dostanie realny warunek „ostatni fotel"), z własną bramką błędów. Zgadzam się z tą decyzją.

## Testy (uruchomione SAMODZIELNIE, niezależnie od Operatora/Evaluatora)

- `node ./node_modules/typescript/bin/tsc --noEmit` (5.9.3) na worktree Operatora: **0 błędów**.
- `hotseat-etap4-noop-test.cjs` — TRZY niezależne pełne przebiegi (każdy A vs B wewnętrznie):
  (1) na ŚWIEŻO utworzonym worktree `@ dfb051d3` (main PRZED Etapem 4b, baseline) — **PASS
  30/30**; (2) na worktree Operatora `df76db7f` (run 1) — **PASS 30/30**; (3) na worktree
  Operatora ponownie (run 2, druga niezależna próba) — **PASS 30/30**. WSZYSTKIE 30 unikalnych
  hashy z każdego z trzech przebiegów porównane programowo (`sort -u` + `diff`, nie wizualnie):
  baseline vs run1 **IDENTYCZNE**, baseline vs run2 **IDENTYCZNE**, run1 vs run2 **IDENTYCZNE**.
  Przykład (turn 1/15/30): `5a812a3ce327...`/`eda5d87add4c...`/`96600506c3be...` — identyczne we
  wszystkich trzech przebiegach. `jsExceptions` 0/0 we wszystkich, console.error() gry 7/7
  (informacyjne, „Wojna wymuszona") identyczne wszędzie.
- `end-turn-modal-sequencing-test.cjs`: worktree Operatora **39 pass / 1 fail** (`[A6]`). TEN SAM
  test na ŚWIEŻYM worktree `@ dfb051d3` (main przed zmianą): **identyczny wynik 39 pass / 1
  fail, `[A6]` czerwony** — potwierdzone NIEZALEŻNIE (własny tymczasowy worktree, nie
  powtórzenie za Operatorem/Evaluatorem), że `[A6]` jest pre-istniejący, nie regresja tego
  tematu. `[A7]` (pin struktury `finally`) PASS w obu.
- Pięć bramek referencyjnych (worktree Operatora): `logic-test` **213/213**, `tech-tree-test`
  **19/19**, `research-test` **33/33**, `unit-replace-test` **13/13**, `combat-test` **6/6** —
  wszystkie zgodne z wynikiem referencyjnym §6 `R-PROC-AUTOBOT.md`.
- `git diff --check dfb051d3 df76db7f -- gra/src/main.ts`: czyste.

## Allowlista

`git diff --stat dfb051d3 a806c20e`: wyłącznie `gra/src/main.ts` + trzy pliki runu
(`00-dispatch.md`, `01-operator-runda1.md`, `02-evaluator-runda1.md`) — zero zmian w
`gra/tools/`, zero w `docs/decyzje/R-PROC-AUTOBOT.md`/`PLAN-HOT-SEAT-2-GRACZY.md`. Zgodne
z allowlistą dyspozycji.

BLOKADY: brak.

ZMIANY/COMMIT: brak nowych zmian kodu od Final Control (weryfikacja czysto odczytowa +
uruchomienia testów na worktree Operatora i tymczasowym worktree baseline, usuniętym po
weryfikacji). Weryfikowany commit: `df76db7f` (Operator), baza `dfb051d3` (Etap 4a
zintegrowany). Ten raport dopisany do worktree Operatora i zacommitowany osobno.

TESTY: patrz sekcja wyżej — pełne, samodzielne, niezależne od raportów Operatora/Evaluatora.

RUNDY: 1/5

NASTĘPNY KROK: gotowość do integracji: TAK. Orkiestrator: integracja allowlist-only
(`gra/src/main.ts` + trzy pliki runu) do `main`. **Po integracji: Etap 4 CAŁEGO planu hot-seat
(Kroki 0-4) jest KOMPLETNY** — kolejne w kolejności: Etap 6 (migracja ~272 `ownerId===0`) i/lub
Etap 5 (`switchActiveHuman`/`hotSeatHandoff`, recon w toku równolegle), w dowolnej kolejności
względem siebie.

DEPLOY/PUSH: NIE WYKONANO
