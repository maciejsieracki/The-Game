# 01-operator-impl — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1 (runda 2, po FAIL Evaluatora r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1 (wypowiedzenie wojny przez gracza, pierwszy wycinek)
GOAL: wrapper `declare_war_by_player` w kolejności webu (a)->(b)->(c)->(d), komenda `declare_war` w mostku, testy wektorowe z pinu `07d2fbd72` i test mutacji. Zakres węższy niż pełne wypowiedzenie: patrz BRAK.
ZMIANY/COMMIT: baza `a01363d5f` (origin/rust-port/parity-v2). Kod z WIP `ff6392336` (zachowana praca Operatora r1, 6 plików), na nim commit obrony r2 (SHA podany w `02a-obrona.md`). Zmieniony w r2: wyłącznie `rust-port/engine/tests/p6_cred_hak_kolejnosc.rs` (dopiski testów, literał 0,4, rustfmt) oraz nowe pliki `01-operator-impl.md` i `02a-obrona.md`. Commit z jawnym `git add` (bez `-A`, bez `Cargo.lock`).
TESTY: patrz sekcja 2.
BLOKADY: patrz sekcja 3 (BRAK). Brak blokad procesowych.
RUNDY: 2/5 (r1 = Operator + Evaluator FAIL procesowy; r2 = ten raport).
NASTĘPNY KROK: Evaluator r2 (weryfikacja zarzutów 1-5 i bramek), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji, brak deployu; worktree zostaje do decyzji orkiestratora).

## 1. Allowlista (`git diff --name-only a01363d5f HEAD`, bez WIP-rebase)

- `rust-port/engine/src/domain/diplomacy_player_war.rs` — NOWY (wrapper, kroki a/b/c/d, komentarze z numerami linii pinu).
- `rust-port/engine/src/domain/mod.rs` — `pub mod diplomacy_player_war;` (+1).
- `rust-port/engine/src/bridge.rs` — dopisany wariant `EngineCommand::DeclareWar { declarer, target }` oraz gałęzie w obu adapterach (zwracają `engine_rejected`, patrz BRAK-2). Istniejące komendy bez zmian.
- `rust-port/engine/tests/p6_cred_hak_kolejnosc.rs` — NOWY (16 testów po r2).
- `rust-port/engine/tests/p6_cred_hak_bridge.rs` — NOWY (4 testy kształtu serde/mostka).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1/01-parametry.md` — NOWY (KROK 0).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1/01-operator-impl.md` — NOWY (ten plik).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1/02a-obrona.md` — NOWY.

Zero zmian w `gra/`, `renderer/`, `view-model/`, `src-tauri/`, `diplomacy.rs`, `diplomacy_truce_flow.rs`. `Cargo.lock` jest nieśledzony (artefakt buildu), NIE commitowany.

## 2. Decyzja o wersji kontraktu mostka (`CONTRACT_VERSION`)

Decyzja: NIE podbijano. `CONTRACT_VERSION` pozostaje `1`.

Uzasadnienie (`rust-port/engine/src/bridge.rs`, sprawdzone w pliku):
- Walidacja wersji (linia ~69) jest równością: `if self.contract_version != CONTRACT_VERSION` zwraca `unsupported_version`. Podbicie odrzuciłoby KAŻDE żądanie klienta wysłane z wersją 1, w tym całego obecnego frontendu.
- Lustro frontendu (`src-tauri/frontend-v2/src/controller/commands.ts`) wysyła wersję 1 i jest POZA allowlistą tego tematu, więc nie da się go zaktualizować tutaj.
- Zmiana jest addytywna: nowy wariant enumu `DeclareWar` jest osiągalny wyłącznie, gdy klient sam wyśle `kind = "declare_war"`. Istniejące komendy i ich kształt JSON nie zmieniają się.
- Wniosek: podbicie wersji należy do tematu integracji mostka, który jednocześnie zaktualizuje lustro TS (wpis w sekcji 3, pozycja 2).

## 3. Bramki (wynik zmierzony na drzewie po r2)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (rust-port/engine) | EXIT 0 (po `rustfmt --edition 2021` na pliku testów r2) |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (pełny) | EXIT 0; 469 binariów `test result: ok`; passed 3401, failed 0, ignored 1 (pre-existing `e2e::dump_tick1_econ_for_web_generator`, spoza tematu) |
| `cargo test --test p6_cred_hak_kolejnosc` | 16/16 PASS (r1: 12) |
| `cargo test --test p6_cred_hak_bridge` | 4/4 PASS (raport Evaluatora r1 podawał 3/3; zmierzone teraz 4 testy w pliku z WIP `ff6392336`, którego nie zmieniano) |
| `git diff --check` | EXIT 0 |

Uwagi do bramek:
- Wszystkie cargo z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo (katalog tymczasowy w scratchpadzie). Po bramkach katalog build do usunięcia przez orkiestratora.
- Logi bramek zapisane w prywatnym katalogu `…/scratchpad/obrona-credhak-q1/` (wspólny scratchpad sesji był nadpisywany przez inne procesy; pierwszy przebieg pełnego testu z tego katalogu został odrzucony i powtórzony).
- Brak `#[ignore]` w `p6_cred_hak_*.rs` i w `diplomacy_player_war.rs`. Brak osłabionych asercji (zmiany r2 tylko dodają asercje).

Test mutacji nowych testów (NIE pełny zestaw): usunięcie gałęzi `if truce_breach` (drugie zdarzenie -18 okna rozejmu) w `charge_war_declaration_credibility` daje FAIL w 3 testach: `okno_rozejmu_karze_nap...`, `oferta_konca_rozejmu...`, `okno_rozejmu_z_nap_daje_dwa_zdarzenia_n2`. Plik produkcyjny przywrócony i zweryfikowany `cmp`.

## 4. BRAK / NIE_ZMIERZONO (jawna lista)

BRAK-1 (wiring stanu, najważniejsze). `declare_war` nie jest podpięte do stanu sesji: oba adaptery (`CivEngineAdapter`, `MockEngineAdapter`) zwracają `engine_rejected("declare_war: wiring stanu dyplomacji poza zakresem …")`. `declare_war_by_player` nie ma wołającego w kodzie produkcyjnym (grep `declare_war_by_player` w `rust-port/`: tylko definicja i testy). Zmierzono: tak. Zakres tego tematu to kształt komendy i wrapper kroków, nie wiring.

BRAK-2 (lustro TS, dług poza allowlistą). `src-tauri/frontend-v2/src/controller/commands.ts` (`EngineCommand`, 6 wariantów) nie zawiera `DeclareWar` i rozjeżdża się z Rustem. Nie zmieniano (poza allowlistą). Do wpisania jako dług w temacie integracji mostka.

BRAK-3 (obowiązki sojusznicze). `applyAllianceObligationsOnWar` (web `main.ts:13170`) NIE jest wykonywane. Publiczny wrapper `declare_war_by_player` może więc być wywołany z pominięciem tego kroku. Udokumentowane w komentarzu modułu (`diplomacy_player_war.rs`, linie 17-21) i tutaj. Do osobnego tematu.

BRAK-4 (guard i stan dyplomacji). `diplomacyLayerForOwner` + `playerDiplomacyActionAllowed` (web `main.ts:13158-13163`) NIE są w zakresie. Guard pokoju (`isPeaceLockedBetween`, `main.ts:13153-13156`) przyjmowany jako wejście `peace_locked` od wołającego.

BRAK-5 (kroki po wypowiedzeniu). `pruneTributeNegotiationsBetween`, `recordWarDeclarationEvent`, `pruneInvalidNegotiations` (web `main.ts:13178-13181`) NIE są w zakresie.

BRAK-6 (tracking zaufania). `recordDiploFactor` (tracking zaufania/respektu w `applyDiploEventTracked`) NIE jest zaimplementowany; wpływa tylko na raporty czynników, nie na wartości stanu.

BRAK-7 (ścieżki poza wojną). Krok N3 (`setDiploPairMeta(n3Window)`) i N5 (`appendWiarygodnoscEvent` przy dobrowolnym zerwaniu) należą do ścieżki dobrowolnego zerwania, nie wojny. N1 (`wiarygodnoscN1BezOstrzezenia`) liczy się w kontekście ataku. Wszystkie poza tematem.

BRAK-8 (UI). Hinty i odświeżenia UI (web `main.ts:13182-13185`) poza silnikiem.

BRAK-9 (rejestr). Wpis BRAK do `dyspozycje/rust-port/REJESTR-RUST.md` NIE został wykonany: plik jest poza allowlistą tego tematu. Orkiestrator przy integracji dopisuje pozycje BRAK-1..BRAK-8.

BRAK-10 (supresje lintów). `#[allow(clippy::too_many_arguments)]` na `declare_war_by_player` (`diplomacy_player_war.rs`, 8 argumentów) oraz `#[allow(dead_code)]` w `tests/p6_cred_hak_bridge.rs:5` (test mostka włączany przez `#[path]`). Zaakceptowane: bramka clippy zielona, a grupowanie argumentów w strukturę zmieniłoby publiczne API wrappera. Wniosek do rejestru: wrapper jest `pub`, więc luka z BRAK-3 jest możliwa również przez bezpośrednie wywołanie.

NIE_ZMIERZONO-1: kolejność (c)->(d) (relacja wojna przed rejestracją przyczyny) nie jest wymuszona testami. Mutant zamiany (c)<->(d) przeżywa, bo `ma_casus_belli_aktywne` nie zależy od relacji (potwierdzone w raporcie Evaluatora r1, sekcja 5, M6). Zmiana obserwowalna dopiero po wprowadzeniu zależności.

NIE_ZMIERZONO-2: mutacje pozostałych nowych testów (oprócz gałęzi truce_breach z sekcji 3) nie były uruchamiane w r2.

## 5. Kolejność kroków i wartości (skrót; pełne linie w `01-parametry.md`)

Kolejność w `declare_war_by_player` (`diplomacy_player_war.rs`): peace_locked -> (a) `charge_war_declaration_credibility` -> (b) `break_treaties_on_war_by_player` -> (c) `apply_war_declaration_relation` -> (d) `register_player_war_declaration`. Pin: `gra/src/main.ts:13168-13177` (potwierdzone `git show 07d2fbd72`). Wartości: N2 NAP -18 (`diplomacy.ts:327`), N2 sojusz -25 (:329), okno odwetu 10 (:347), `zlamanaPaktGracz_zaufanie` -40 (`diplomacy.ts:865`).
