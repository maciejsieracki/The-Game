# 02a — Obrona Operatora — R-RUSTPORT-P4-1H-PREVIEW-Q5 (#251), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-PREVIEW-Q5
GOAL: zapytanie `preview_path` (czysta funkcja) zwracające `PathRouteDto { hexes, turn_stops }` zgodnie z `refreshPlannedMarchPreview` / `refreshHoverPathPreview` (pin `07d2fbd72`).
ZMIANY/COMMIT: wyłącznie ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-PREVIEW-Q5/02a-obrona.md`); kod bez zmian względem Operatora `8408a2535`. Gałąź `wip/R-RUSTPORT-P4-1H-PREVIEW-Q5-ob` (rodzic `8408a2535`, baza `b3c0b2209`).
TESTY: nie uruchamiano ponownie (brak zmian w kodzie; wolne na dysku 2,3 GB, `df -h /` przy starcie obrony). Wyniki Operatora (`01-operator-r1.md`) i Evaluatora (`02-evaluator.md`) obowiązują bez zmian.
BLOKADY: brak blokujących. NIE_ZMIERZONO: Żegluga (zarzut 3), pełny jednorazowy `cargo test --all-targets` silnika (zarzut 4).
RUNDY: 1/5 (obrona do rundy 1)
NASTĘPNY KROK: Final Control — pełny `cargo test --all-targets --no-fail-fast` w `rust-port/engine` przy ≥ 8 GB wolnego.
DEPLOY/PUSH: NIE WYKONANO

Źródło Evaluatora: `02-evaluator.md` (commit `66c968055`, gałąź `wip/R-RUSTPORT-P4-1H-PREVIEW-Q5-ev`).

## Zarzut 1 — brak strażnika `isMe(uSel.ownerId)` w zapytaniu

**ODRZUCAM jako defekt tego tematu; PRZYJMUJĘ jako zapis przekazania do #237/#242.**

Dowód (pin `07d2fbd72`, `gra/src/main.ts`):
- `refreshHoverPathPreview` (`:31181-31209`) NIE sprawdza właściciela. Strażnik `if (!uSel || !isMe(uSel.ownerId))` stoi w wywołującym handlerze hovera (`:32301-32306`), który czyści trasę i wychodzi, zanim wywoła podgląd.
- `refreshPlannedMarchPreview` (`:31146-31179`) również nie ma `isMe`: rysuje trasę dla dowolnej jednostki z wpisem w `plannedMarches`.
- `preview_path` jest odpowiednikiem tych dwóch funkcji (zakres dispatchu pkt 1), więc przeniesienie `isMe` do zapytania byłoby odejściem od struktury pinu. Dodatkowo wymagałoby mapowania „ja” na surowe `PlayerId` (erratum P4-1H: gracz = 1, web = 0). Dispatch zabrania zgadywania tego mapowania.

Przekazanie (wiążące dla producenta warstwy `path_route` w #237/#242): wywołujący hover MUSI sprawdzić, że wybrana jednostka należy do gracza lokalnego (w Rust `owner_id == PlayerId(1)` wg erraty), zanim wywoła `preview_path`. W przeciwnym razie ma ustawić `path_route = None`. Test „jednostka wroga → brak trasy” należy do testów wywołującego, nie do testów zapytania.

## Zarzut 2 — gałąź garnizonu `activeUnitStack` (`armyMerge.ts:248-250`) nieprzeniesiona

**ODRZUCAM (nieosiągalna dziś); zapisuję warunek zamknięcia.**

Dowód: adapter Q4 (`playable_movement.rs`, komentarz przy budowie `RuchJednostka`, linie ~124-128 w `8408a2535`) ustawia `in_garnizon = false` dla każdej jednostki, bo `PlayableState` nie ma pojęcia garnizonu. Gałąź `active.inGarnizon === true → garrisonUnitsOnHex` jest więc martwa w obecnym modelu. Nie da się jej przetestować ani zmierzyć bez pola w stanie, a dopisanie jej „na zapas” wyszłoby poza zakres i allowlistę (zmiana `PlayableState`).

Warunek zamknięcia: temat, który doda garnizony do `PlayableState`, MUSI w `player_stack_at` przenieść gałąź `garrisonUnitsOnHex(units, q, r, ownerId, groupId)` (`armyMerge.ts:248-250`). Musi też dodać test: jednostka w garnizonie dostaje niepusty stos i pulę ruchu > 0, gdy ma ruch. Do zapisania w `REJESTR-RUST.md` przez orkiestratora przy integracji.

## Zarzut 3 — Żegluga: `ownerHasSeafaring = false`, `cost_fn = None` (NIE_ZMIERZONO)

**ODRZUCAM jako defekt; potwierdzam NIE_ZMIERZONO zgodnie z dispatchem.**

Dowód: `ownerHasSeafaring` (`main.ts:14589-14593`) rozgałęzia się na `ownerId === 0` (gracz weba) i `isAiOwner(...)`. Dispatch (Erratum P4-1H) każe przy logice `ownerId === 0` zatrzymać się i zapisać NIE_ZMIERZONO zamiast zgadywać. Tak zrobiono w `01-operator-r1.md` §BLOKADY oraz w dokumentacji `preview_path_plan` (linie ~306-309). Dla właściciela bez Żeglugi wynik jest zgodny z webem. Trasa przez wodę dla właściciela z Żeglugą (`embarkMoveCost × civEmbarkationMovementMultiplier`) czeka na Q6 i mapowanie `PlayerId`.

## Zarzut 4 — pełny `cargo test --all-targets` silnika nie uruchomiony jednym poleceniem

**ODRZUCAM jako brak pokrycia; przyjmuję NIE_ZMIERZONO dla formy „jedno polecenie” i przekazuję do FC.**

Dowód: Operator uruchomił ten sam zakres w częściach: lib/bins/examples/benches EXIT 0 (124 testy lib) oraz każdy z 485 binariów `tests/*.rs` osobno, 485/485 EXIT 0, 3449 passed, 0 failed, 1 ignored (spoza tematu, `p6_order_lane`). Evaluator powtórzył fmt, clippy `--all-targets -D warnings` (kompiluje wszystkie testy), `test --lib` oraz testy sąsiednie, wszystkie EXIT 0. Obrona nie może powtórzyć pełnego testu: wolne miejsce 2,3 GB, poniżej progu 8 GB dla Rust (zasada 5 CLAUDE.md). Rekomendacja: FC uruchamia `cargo test --all-targets --no-fail-fast` w `rust-port/engine` przy ≥ 8 GB wolnego.

## Zarzut 5 — brak testu przepuszczającego wynik `preview_path` przez `validate.rs`

**ODRZUCAM (inwariant jest już przypięty dokładnymi wektorami).**

Dowód: `validate.rs:351-366` (baza `b3c0b2209`) wymaga, żeby `turn_stops[i].turn` zaczynał się od 1 i rósł ściśle. Testy `engine/tests/p4_1h_preview_path.rs` porównują `turn_stops` przez `assert_eq!` z pełnymi wektorami z pinu:
- W1 `[stop(2,1), stop(4,2)]` (`:114`, `:215`),
- W2 `[stop(1,1), stop(2,2), stop(3,3), stop(4,4)]` (`:133-135`),
- W3 `[stop(3,1), stop(5,2)]` (`:146`),
- jednoprzystankowe `[stop(2,1)]` (`:155`, `:167`, `:203`).

Każdy z tych wektorów spełnia regułę walidatora. Mutacja `turn+1` daje FAIL (potwierdzone w `02-evaluator.md`). Walidator ma własne testy. Test przez `validate.rs` wymagałby zależności testowej engine → view-model, której ten temat nie ma, i nie dodałby pokrycia ponad dokładną równość wektorów. Docelowo właściwe miejsce na taki test to producent `path_route` (#237/#242), gdzie DTO trafia do `ViewModel` i walidacji.

## Podsumowanie

Zarzuty 1–5 nie wymagają zmian w kodzie. Zarzut 1 i zarzut 2 zostają jako jawne przekazania (#237/#242 oraz przyszły temat garnizonów). Zarzuty 3 i 4 zostają jako NIE_ZMIERZONO z przypisanym właścicielem (Q6 / mapowanie `PlayerId`; FC). Kod do oceny FC: `8408a2535`.
