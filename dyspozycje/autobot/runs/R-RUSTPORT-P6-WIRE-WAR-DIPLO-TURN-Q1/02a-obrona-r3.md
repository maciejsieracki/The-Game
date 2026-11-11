# 02a — Obrona r3 (Operator), R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1

STATUS: PASS-WITH-NOTES (częściowo: zarzut 4 PRZYJĘTY; zarzut 1 ODRZUCONY jako przesłanka dispatchu, BLOCK z propozycją podziału)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1 (W6), runda 3/5
GOAL: jak w dispatchu r1; dodatek r3: punkty 1 i 4 do naprawy albo jawny BLOCK
BAZA: 4c92ee0a7 (kod obrony r1). Pin web: 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (bez zmian).
NIE pushowano. NIE integrowano. Cargo.lock nieskommitowany (untracked).

## Odpowiedzi na zarzuty

### Zarzut 1 — GOAL r3 niezrealizowany (lock, siege, cooldown `miasto_za_pokoj`, oferta miasta za pokój nie są wołane w `ai_diplomacy_turn.rs`)
Decyzja: ODRZUCAM jako wymóg implementacyjny w tym temacie; zapisuję BLOCK z przyczyną (nie udaję wykonania).

Dowód (pin 07d2fbd72, `git archive`, `gra/src/main.ts`):
- `resolveDiplomacyActionLock` — wywołania l.1195 (import), l.25124 (komentarz opisowy); brak wywołania w `runDiplomacyTurnTick` (l.24229–24400).
- `siegeAllowedBetween` — l.17504, 17984, 18027, 18156, 36735 (ścieżki atakowania/oblężenia AI, nie faza dyplomacji).
- `isOfferRejectedOnCooldown` / `recordRejectedOffer` — l.20272, 20656 (ścieżka ofert AI), l.1524–1525 (import).
- `decideAIDiplomacy` — l.41787 (pętla AI poza fazą brake).
- Oferta miasta za pokój (`ai_peace_city_offer`) — wołana w ścieżce ofert AI, nie w `runDiplomacyTurnTick`.

Dowód po stronie Rust: `grep -c 'resolve_diplomacy_action_lock\|siege\|rejection_cooldown\|ai_peace_city_offer\|miasto_za_pokoj' rust-port/engine/src/domain/ai_diplomacy_turn.rs` daje 0 wywołań (trafienia tylko w komentarzach/nazwach opisowych, a `tick_pair` jest osobnym punktem zarzutu 4).

Wniosek: przesłanka dispatchu r1/r3 („te cztery punkty są w fazie tury `runDiplomacyTurnTick`") jest błędna dla strony webowej. Podpięcie ich do `run_brake_phase` zmieniałoby zachowanie względem weba, czyli byłoby nową logiką, nie portem. Dodanie wrapperów bez wywołań dałoby martwy kod (zakazany dispatchem).

BLOCK (do decyzji orkiestratora), propozycja:
- (a) wyjąć te cztery punkty z GOAL W6 i przydzielić osobnym tematom wg ich realnych miejsc wywołania (ścieżka ofert AI, ścieżka oblężenia AI, ścieżka ataku), albo
- (b) zawęzić W6 do fazy brake + tyku pary (stan po tej rundzie), a cztery punkty przenieść do W8 razem z podpięciem pętli tury.

### Wpis 3 listy FC — BLOCK Operatora uzasadniony (zob. 02b-operator-r3.md)
PRZYJMUJĘ ocenę: BLOCK w r2 był uzasadniony przesłanką z punktu 1. Brak zmian w kodzie pod ten wpis. Potwierdzone na pinie: l.24229–24400 nie wołają czterech funkcji.

### Wpis 5 listy FC — uwaga o wierności transkrypcji fazy (nie blokada)
PRZYJMUJĘ jako uwagę: `phase.json` jest transkrypcją na funkcjach `brake.ts`, nie wykonaniem `runDiplomacyTurnTick` (main.ts nie uruchomi się poza przeglądarką). Nie poprawiam w tej rundzie; wierność jest NIE_ZMIERZONO.

### Zarzut 4 — `tick_pair` nie jest wołany przez adapter w pliku tematu
Decyzja: PRZYJMUJĘ (poprawka + test + commit). Zakres ograniczony do tego, co da się zmierzyć w tej rundzie (zob. NIE_ZMIERZONO niżej).

Poprawka (commit SHA poniżej):
- `rust-port/engine/src/domain/ai_diplomacy_turn.rs`, funkcja `tick_pairs_relation_scores` (l.104): dla każdej pary wywołuje `DiplomacyState::tick_pair` (zapis stanu), potem `relation_score_with_params` i wynik trafia do `BrakePhaseInput::relation_after_tick`.
- `rust-port/engine/tests/p6_wire_war_diplo.rs`, test `tick_adapter_writes_state_and_returns_score_of_ticked_relation`: sprawdza, że stan pary po adapterze równa się `tick_relation(...)`, a zwrócony wynik równa się `relation_score_with_params` z tej samej ścieżki.

UCZCIWIE, czego test NIE dowodzi: to NIE jest wektor z weba. Oczekiwanie pochodzi z funkcji Rust (`tick_relation`), nie z `tickDiplomacy` (`gra/src/game/diplomacy.ts:1810`). Web `tickDiplomacy` ma dodatkowe wejścia (urazy co 20 tur, traktaty, dryf wiarygodności, `getEffectiveDiplomacyParams` z poziomem trudności), których Rust `TickContext` nie niesie. Generator wektorów `tickDiplomacy` z pinu nie został dopisany w tej rundzie (zakres allowlisty i brak mapowania `TickCtx` -> `TickContext`), więc zgodność tyku z webem NIE_ZMIERZONO. To wymaga osobnego tematu (generator + mapowanie pól + ewentualnie poprawka `compute_trust_delta`).

## Zmiany (allowlista)
- `rust-port/engine/src/domain/ai_diplomacy_turn.rs` (+29, 234 -> 263 LOC)
- `rust-port/engine/tests/p6_wire_war_diplo.rs` (+41; plik 457 -> 498 LOC)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1/02a-obrona-r3.md` (ten plik)

## Bramki (EXIT, tym samym worktree i CARGO_TARGET_DIR poza repo)
- `cargo fmt --check`: EXIT 0 (po `cargo fmt` zmienione tylko dwa pliki allowlisty; `git status` czysty poza nimi)
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: EXIT 0, 28 passed
- `cargo test --test p6_wire_war_diplo`: EXIT 0, 13 passed, 0 ignored
- sąsiednie: p6_wire_war_declare 15 ok, p6_wire_war_state 14 ok, p6_wire_war_view 6 ok, p6_wire_war_forced_step 24 ok, p6_wire_war_march_core 12 ok

## NIE_ZMIERZONO
- Zgodność `tickDiplomacy` (web) z Rust `tick_relation` na wektorach: nie zmierzona.
- Wiarygodność transkrypcji fazy `phase.json` względem prawdziwego `runDiplomacyTurnTick`: nie zmierzona (zarzut 3, już odnotowany).
- Cztery punkty z zarzutu 1: nie wykonane (BLOCK, zob. wyżej).

## Zależność do W8
Podpięcie `run_brake_phase` i `tick_pairs_relation_scores` do pętli tury Rust: W8.

## Commit
SHA: podany w raporcie zbiorczym (commit na detached HEAD od 4c92ee0a7; bez push).

RUNDY: 3/5
NASTĘPNY KROK: orkiestrator decyduje o zakresie zarzutu 1 (opcja a lub b); Evaluator r3 ocenia zarzut 4 i BLOCK zarzutu 1
DEPLOY/PUSH: NIE WYKONANO
