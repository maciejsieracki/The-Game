# R-RUSTPORT-P4-364-FOG-SAVE-R1 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-FOG-SAVE-R1 (DŁUG-364-FOG-SAVE)
GOAL: odkryta mgła sesji (`PlayableFogSession::explored_by_human`) przeżywa rundę zapis → wczytanie jak web `exploredByHuman` (pin `07d2fbd72`).
OCENIANY COMMIT: `8f0a005fa` (gałąź `rust-port-wip/p4-364-fog-save-r1`), rodzic = BAZA `5a1ddc10b9b894161e6f4e84694693b459dc992f`
(`git merge-base --is-ancestor` OK; `origin/rust-port/parity-v2` = `5a1ddc10b` w chwili oceny).
ZMIANY/COMMIT: Evaluator nie zmienia kodu; jedyny zapis = ten raport (gałąź `rust-port-wip/p4-364-fog-save-r1-eval`).

## Bramki odtworzone przez Evaluatora (worktree własny, `CARGO_TARGET_DIR` w scratchpadzie, usunięty)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Dysk przed pełną bramką: 9,5 GB wolnego (>= 8 GB); po sprzątaniu 11 GB.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_364_fog_save` | EXIT 0, 6 passed / 0 failed / 0 ignored |
| pełny `cargo test --all-targets --no-fail-fast` (engine, `setsid nohup`, EXIT w logu) | EXIT=0; 530 × `test result: ok`, 0 nie-ok; suma 3982 passed, 0 failed, 1 ignored (zgodne z raportem Operatora) |

## Allowlista

`git diff --stat 5a1ddc10b 8f0a005fa`: `save_load.rs` (+186/-2), `playable.rs` (+11, tylko nowa metoda `restore_explored_by_human` sesji mgły),
nowy `tests/p4_364_fog_save.rs`, `01-operator-r1.md`. Brak zmian w `zapis_loader.rs`, `dto_bridge.rs`, `bridge.rs`, `Cargo.toml`, `Cargo.lock`, `gra/**`.
Sekcja „Pliki spoza allowlisty”: brak (zgodne z diffem — żadnych gałęzi `match` poza listą). Istniejące testy i wektory zapisu: nietknięte
(diff w `tests/` = wyłącznie nowy plik). `#[ignore]` w nowym teście: brak. Osłabionych asercji: brak (nic istniejącego nie zmieniono).

## Zgodność z D-FOGSAVE

- D-FS-1: OK. Pole `exploredByHuman` w `SaveSnapshot`, `#[serde(default, skip_serializing_if = "Vec::is_empty")]`, kształt `[[ownerId, ["q,r",…]]]`
  (własny `Serialize` przez krotkę). `SaveSnapshot` bez `Deserialize` (wczyt przez `RawSnapshot`/`SnapshotWire` → `load_save_snapshot` z migracją).
  Wersja zapisu bez zmian. Bajt w bajt: test (c) compact + pretty + ponowny zapis starego zapisu.
- D-FS-2: OK. Brak zmian w `GameStateDto`/`EngineState`/replay; stan tylko w metadanych zapisu i w `PlayableFogSession`; test (f).
- D-FS-3: OK. `restore_explored_by_human` ustawia mapę z zapisu (każdy fotel osobno; powtórzony fotel → ostatni jak `Map.set`), fotel główny zawsze ma wpis,
  `reveal_all_land = false` (web `main.ts:46393-46411`, sprawdzone na pinie). Zły wpis / zły klucz → jawny `LoadError::Json` z pozycją
  `exploredByHuman[e]` / `exploredByHuman[e][1][k]`; brak cichego pominięcia w tablicy. Nie-tablica / brak / `null` → `[]` = web `normalize` (`save.ts:725`).
- D-FS-4: OK. Źródło = `PlayableGame::fog_session()`; API wyłącznie addytywne (`with_playable_explored_by_human`, `with_explored_by_human`,
  `explored_by_human`, `restore_explored_by_human`, wolne `playable_explored_by_human_to_save` / `restore_playable_explored_by_human`).

## Mutacje odtworzone przez Evaluatora (własne, każda → `cargo test --test p4_364_fog_save`, plik przywrócony, `git status` czysty)

| Mutant | Wynik |
|---|---|
| E1 restore bez pustego wpisu fotela głównego | EXIT 101, FAIL b, e |
| E2 restore bez `reveal_all_land = false` | EXIT 101, FAIL b |
| E3 parser akceptuje klucze niekanoniczne (bez porównania `format!`) | EXIT 101, FAIL d |
| E4 zapis także pustych foteli (bez filtra) | EXIT 101, FAIL c |
| E5 pominięcie restore (pusta mapa) | EXIT 101, FAIL a, e |
| E6 restore tylko fotela głównego | EXIT 101, FAIL e |

Mutanty M1–M4 dispatchu pokryte (E5 = M2, E6 = M3; M4 ≈ E3 + test d dla nie-stringa; M1 sprawdzone przez test a/e z JSON-em klucza). Zestaw testów czuły.

## Zgodność wsteczna i ciche pominięcia

- Zapis bez klucza wczytuje się, mgła = tylko pusty wpis fotela głównego (test b; śmieci sesji wyczyszczone).
- Klucz nie-tablica → `[]` bez błędu — to parytet z web `normalize`, nie ciche pominięcie danych w poprawnym formacie.
- W tablicy: każdy wpis i każdy klucz walidowany; brak `filter_map`/`if let` gubiących pozycje (sprawdzone w kodzie i mutacją E3).

## UWAGI (nieblokujące, do FC / orkiestratora)

- U1 (zakres GOAL): brak produkcyjnego wołającego zapisu/wczytania `PlayableGame` (grep: `with_playable_*`/`restore_*`/`load_save_snapshot` poza
  `save_load.rs`/`zapis_loader.rs` nie są wołane w `src/`). Runda zapis→odczyt istnieje jako API + test, nie jako komenda mostu — tak samo jak
  `citySiege`/`plannedMarches`; Operator zgłosił to jawnie (decyzja 5). Do rejestru jako osobny temat wpięcia Save/Load w most.
- U2 (odstępstwo kształtu): web zapisuje także puste zbiory (`[[0, []]]`); Rust je pomija. Bezstratne obserwowalnie: oba konsumenci
  (`session_render_layers`, `build_render_frame`) robią `entry(seat).or_default()`, a restore zawsze tworzy wpis fotela głównego. Uzasadnione D-FS-1 (bajt w bajt).
- U3 (przestrzeń id): `ownerId` w zapisie = `PlayerId` Rust (fotel główny 1), web = 0. Spójne z resztą zapisu Rust; zapis z webu z `0` trafiłby do fotela 0
  (nie głównego) — istotne tylko, jeśli kiedyś Rust ma czytać zapisy web.
- U4 (brzeg): `ownerId` jako liczba z częścią `.0` (np. `1.0`) → `BadEntry`, choć JS by przyjął; web zapisuje liczby całkowite, więc praktycznie nieosiągalne.
- U5: restore nie zmienia `active_seat` (web odtwarza `activeHumanOwnerId` z zapisu w tym samym bloku); poza zakresem dispatchu — kandydat do tematu wpięcia z U1.

TESTY: jak w tabelach wyżej (fmt 0, clippy 0, p4_364_fog_save 6/0, pełny engine EXIT 0 3982/0/1, mutanty E1–E6 FAIL).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (odniesienie do U1–U5), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
