# R-RUSTPORT-P4-364-FOG-SAVE-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-FOG-SAVE-R1 (DŁUG-364-FOG-SAVE)
GOAL: odkryta mgła sesji (`PlayableFogSession::explored_by_human`) przeżywa rundę zapis → wczytanie jak web `exploredByHuman` (pin `07d2fbd72`).
OCENIANY COMMIT: `14833c8e7` (obrona; rodzic `8f0a005fa` = kod Operatora; rodzic `5a1ddc10b9b894161e6f4e84694693b459dc992f` = BAZA dispatchu, `origin/rust-port/parity-v2`).
ZMIANY/COMMIT: FC nie zmienia kodu; jedyny zapis = ten raport (gałąź `rust-port-wip/p4-364-fog-save-r1-fc`, commit nad `14833c8e7`).

## Allowlista (sprawdzona samodzielnie: `git diff --stat 5a1ddc10b 14833c8e7`)

| Plik | Zmiana | Ocena |
|---|---|---|
| `rust-port/engine/src/domain/save_load.rs` | +187/-2 | na liście |
| `rust-port/engine/src/domain/playable.rs` | +11 (tylko `PlayableFogSession::restore_explored_by_human`) | na liście (akcesor sesji mgły) |
| `rust-port/engine/tests/p4_364_fog_save.rs` | nowy | na liście |
| `dyspozycje/autobot/runs/.../01-operator-r1.md`, `02a-obrona.md` | nowe | katalog runs |

Bez zmian: `zapis_loader.rs`, `dto_bridge.rs`, `bridge.rs`, `Cargo.toml`, `Cargo.lock`, `gra/**`, istniejące testy i wektory. Brak `#[ignore]` w nowym teście.

## Bramki odtworzone przez FC (worktree własny na `14833c8e7`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

Dysk przed pełną bramką: 12 GB wolnego (>= 8 GB).

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_364_fog_save` | EXIT 0, 6 passed / 0 failed |
| pełny `cargo test --all-targets --no-fail-fast` (engine, `setsid nohup`, EXIT w logu) | EXIT=0; 530 × `test result: ok`, 0 nie-ok, 0 `FAILED`; suma 3982 passed / 0 failed / 1 ignored |

## Mutant własny FC

- F1: loader ignoruje klucz (`explored_by_human_from_save(None)` w `RawSnapshot::deserialize`) → `p4_364_fog_save` FAILED 4/6 (a, d, e, f). Plik przywrócony (`git status` czysty).
Razem z M1–M4 Operatora, E1–E6 Evaluatora i mutantem U4 obrony: zestaw testów czuły na zapis, wczytanie, restore, fotel główny, wiele foteli i ciche pominięcie.

## Zgodność z webem (sprawdzone na pinie `07d2fbd72`)

`main.ts:37227-37240` (zapis `Array.from(exploredByHuman.entries())`) i `:46393-46412` (`clear`, każdy wpis ustawia swój fotel, powtórzony fotel = ostatni, fotel główny zawsze ma wpis, `revealAllLand = false`) — odwzorowane w `restore_playable_explored_by_human` + `PlayableFogSession::restore_explored_by_human`. D-FS-1..D-FS-4: zgodne (potwierdzam ustalenia Evaluatora). `PlayerId::new(0)` nie panikuje (`ids.rs`, zwykły `u64`), więc zapis z `ownerId 0` się wczytuje.

## Orzeczenia zarzutów

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| U1 brak produkcyjnego wołającego Save/Load `PlayableGame` | ODDAL (w tym temacie) | Zakres dispatchu = klucz + serializacja + loader + restore jako API (D-FS-4 „parametr/metoda”); `bridge.rs` tylko mechanicznie. Ten sam stan co `citySiege`/`plannedMarches`. Do rejestru: osobny temat wpięcia Save/Load w most. |
| U2 puste zbiory foteli nie są zapisywane (web zapisuje `[[0, []]]`) | ODDAL | Wymóg D-FS-1 (bajt w bajt), bezstratne: restore tworzy pusty wpis fotela głównego, inne fotele `or_default` przy zapytaniu warstw; test (b)(c)(e). |
| U3 `ownerId` = `PlayerId` Rust (fotel główny 1), web 0 | ODDAL | Spójne z resztą zapisu Rust (`placedWorldWonders.ownerId`, `players`); mapowanie przestrzeni id dotyczy ewentualnego importu zapisów web, poza zakresem. |
| U4 `ownerId` `2.0` → `BadEntry` | ODDAL (już naprawione w obronie) | `js_owner_id` jak `placedWorldWonders`; asercja w teście (d); mutant zabity. |
| U5 restore nie odtwarza aktywnego fotela | ODDAL | `activeHumanOwnerId` to inny klucz, poza dispatchem; `active_seat` w Rust jest parametrem `GetRenderLayers`. Kandydat do tematu z U1. |

NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak.

## NOTATKI dla orkiestratora (nieblokujące)

1. Wpis w `REJESTR-RUST.md`: decyzje techniczne Operatora 1–5 (pomijanie pustych foteli, przestrzeń id Rust, kolejność rosnąca, poza `EngineState`, brak wołającego produkcyjnego).
2. Nowy temat: wpięcie Save/Load `PlayableGame` w most (wszystkie klucze addytywne naraz: `citySiege`, `placedWorldWonders`, `plannedMarches`, `exploredByHuman`, aktywny fotel).

TESTY: fmt 0, clippy 0, `p4_364_fog_save` 6/0, pełny engine EXIT 0 3982/0/1, mutant F1 zabity.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge `14833c8e7` + ten raport na `rust-port/parity-v2`, pełna bramka po merge), refs/keep, wpis w rejestrze.
DEPLOY/PUSH: NIE WYKONANO
