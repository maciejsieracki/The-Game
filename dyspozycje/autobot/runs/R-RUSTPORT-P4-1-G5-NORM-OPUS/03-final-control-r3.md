# Final Control r3 — R-RUSTPORT-P4-1-G5-NORM-OPUS

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer Rust, ulepszenia per heks)
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (`LEGACY_KEY_ALIASES`, `normalizeImprovementKey`) i fallback do `hex.ulepszenie` w `sync/build.rs`, parytet z pinem `07d2fbd72`
ZMIANY/COMMIT: ocenione `e76b8963f` (Obrona r3) → kod Operatora `074b25afb` (kod r1 `0671e292d` plus komentarz generatora r2). Ten raport jest jedynym nowym plikiem i trafia na lokalną gałąź `rust-port-wip/p4-1-g5-norm-opus-fc-r3`, bez push. Nazwa pliku ma sufiks `-r3`, bo `03-final-control.md` należy do r1, a `03-final-control-r2.md` do r2.
TESTY: zmierzone samodzielnie (szczegóły niżej). Wszystkie bramki dały EXIT 0, a mutacje (a), (b′) i (c) dały FAIL.
BLOKADY: brak
RUNDY: 3/5
NASTĘPNY KROK: integracja orkiestratora (merge na `rust-port/parity-v2`) i wpis długów 1, 3 i 4 do REJESTR-RUST
DEPLOY/PUSH: NIE WYKONANO

## Baza i ancestry

- Baza dispatchu: `f85622878` (`origin/rust-port/parity-v2` w r1/r2). Baza r3: `02b07a83e` (FC r2).
- `git merge-base --is-ancestor f85622878 e76b8963f` daje OK, a `git merge-base --is-ancestor 02b07a83e e76b8963f` też daje OK.
- Łańcuch: `02b07a83e` → `074b25afb` (Op r3) → `93e737f47` (Eval r3) → `e76b8963f` (Obrona r3) → raport FC r3.
- Uwaga dla integracji: `origin/rust-port/parity-v2` stoi dziś na `7fcef940b`, a nie na `f85622878`. Przed FF albo merge trzeba więc zrobić merge-tree i uruchomić bramkę na nowej bazie (to zadanie orkiestratora).

## Allowlista (`git diff --stat f85622878 e76b8963f`)

Zmienione są wyłącznie te pliki:
- `rust-port/renderer/src/improvements/sync/build.rs`
- `rust-port/renderer/src/improvements/sync/input.rs` (tylko komentarz doc)
- nowe `rust-port/renderer/tests/improvements_sync_g5.rs`, `improvements_sync_g5_gen.mjs` i `improvements_sync_g5_vectors/vectors.json`
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-G5-NORM-OPUS/**`

Nie ma zmian w `Cargo.lock`, `gra/`, `engine/`, `view-model/` ani w `mod.rs`. Allowlista jest dotrzymana.

## Zgodność z pinem (sprawdzona w tekście pinu)

- `terrain-improvements.ts:31-33`: `LEGACY_KEY_ALIASES = { pastwisko: 'bydlo' }`. W Rust to `[("pastwisko","bydlo")]`, zgodnie z pinem.
- `:117-123` `normalizeImprovementKey`: `!raw || 'brak'` daje undefined, potem alias, potem `IMPROVEMENTS[key]`, a na końcu `IMPROVEMENTS[raw]`. Rust robi to samo, łącznie z kluczami prototypu JS.
- `:358-380` `improvementKeysForHex`: niepuste `ulepszenia` decyduje (normalizacja, filtr, `Set`), a fallback do `ulepszenie` działa tylko przy pustym `ulepszenia`. Rust jest zgodny z decyzją D1 z DODATKU r2.
- `main.ts:3126-3137` `mergedImprovementLayers`: najpierw `Set(improvementKeysForHex)`, potem złoże, potem warstwy postawione bez filtrowania. Rust jest zgodny z decyzją D2.

## Bramki (crate `rust-port/renderer`, zmierzone przez FC)

Warunki: `df -h /` pokazywał 13 GB wolnego (≥ 12 GB), `ps` nie pokazywał żadnych cudzych `cargo`/`rustc`. `CARGO_TARGET_DIR` leżał w scratchpadzie poza repo i został usunięty po bramkach; `CARGO_INCREMENTAL=0`, bez debuginfo.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test improvements_sync_g5` | EXIT 0, 11/11 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0, 71 zestawów, 588 passed, 0 failed, 0 ignored |
| `node tests/improvements_sync_g5_gen.mjs --check` | EXIT 0 (33 heksy, 44 klucze) |

Zmianę `Cargo.lock` wprowadzoną przez build cofnąłem, więc drzewo zostało czyste.

## Mutacje (FC samodzielnie; każdą przywróciłem z kopii, `cmp` potwierdził identyczność)

| Mutacja | Wynik |
|---|---|
| (a) `LEGACY_KEY_ALIASES` puste | FAIL 6/11, EXIT 101 |
| (b′) filtr `''`/`'brak'` przy warstwach postawionych | FAIL 1/11, EXIT 101 |
| (c) fallback `ulepszenie` dokładany zawsze i jako pierwszy | FAIL 4/11, EXIT 101 |

## Orzeczenia zarzutów Evaluatora r3

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 0 | Podsumowanie pomiarów | ODDAL (to nie jest zarzut) | FC zmierzył to samo: 588/0/0, 11/11, mutacje dają FAIL. |
| 1 | Druga kopia tabeli normalizacji (engine `improvements.rs:696` i renderer `build.rs`) | ODDAL jako błąd rundy, dług do REJESTR-RUST | Renderer zależy tylko od `civ-view-model`. Użycie engine wymagałoby zmian w `engine/**` albo `view-model/**`, których dispatch zabrania. Dispatch (sekcja DECYZJA) każe w takim wypadku normalizować u konsumenta. Dryf względem pinu wykrywają wektory. Dług: producent DTO ma wyliczać pole warstw. |
| 2 | Mutacja (e), czyli usunięcie `\|\| raw == "brak"`, przeżywa | ODDAL | Mutant jest równoważny: `'brak'` nie ma aliasu, nie jest wierszem `IMPROVEMENTS` ani nazwą prototypu, więc wynikiem i tak jest `None`. Zachowanie jest identyczne i żaden test go nie odróżni. |
| 3 | Warstwy postawione brane z `HexDynDto.ulepszenia`, a nie z `placedImprovements` | ODDAL jako błąd rundy, uwaga do kontraktu DTO | DTO nie ma pola placed (`view-model/src/map.rs`). Pin trzyma oba źródła w zgodzie (`main.ts:16275-16289`). Założenie jest opisane w `build.rs`. Przypadek niespójnego zapisu należy do kontraktu DTO, nie do tej rundy. |
| 4 | Nieaktualny komentarz `sync/mod.rs:39-46` (G5 opisane jako luka) | ODDAL w tej rundzie, dług | Plik jest poza allowlistą, a DODATKI r2 i r3 jawnie zabraniają go zmieniać. Potrzebny osobny temat dokumentacyjny. |
| 5 | Myląca nazwa wektora `brak_and_empty_skipped` | ODDAL | Nazwa nie zmienia zachowania. Odwołuje się do niej DODATEK r2, a znaczenie wyjaśnia komentarz w generatorze. |

Żaden zarzut nie dostał orzeczenia NAPRAW ani DO DECYZJI CZŁOWIEKA.

## Długi dla orkiestratora (REJESTR-RUST)

1. Producent DTO powinien sam wyliczać warstwy ulepszeń, żeby tabela aliasów była w Rust tylko raz (engine `improvements.rs` i renderer `build.rs`).
2. Kontrakt DTO: brak pola `placedImprovements`, więc renderer zakłada, że `ulepszenia` jest równe placed.
3. Komentarz `rust-port/renderer/src/improvements/sync/mod.rs:39-46` trzeba zaktualizować (G5 jest już zrobione).

## Werdykt

PASS-WITH-NOTES. SHA kodu: `074b25afb`; SHA ocenianego łańcucha: `e76b8963f`. Oba są potomkami `f85622878` i `02b07a83e`.
