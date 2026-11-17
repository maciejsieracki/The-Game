# 03 — Operator r3 — R-RUSTPORT-P4-1-G5-NORM-OPUS

Nazwa raportu i baza zgodnie z DODATKIEM r3 dispatchu (ma pierwszeństwo przed
nazwą `01-operator-r1.md` z zadania workflow, bo `01-operator-r1.md` należy już do rundy 1).

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES) i fallback do `ulepszenie` w sync/build.rs, parytet z pinem 07d2fbd72
ZMIANY/COMMIT: kod bez zmian względem bazy r3 02b07a83e (kod r1 0671e292d + komentarz generatora z r2); ta runda dodaje wyłącznie ten raport (commit nad 02b07a83e, SHA w wyniku workflow); Cargo.lock nie commitowany (zmiana po buildzie cofnięta)
TESTY: fmt EXIT 0; clippy EXIT 0; improvements_sync_g5 11/11 EXIT 0; cargo test --all-targets --no-fail-fast EXIT 0 (588 passed, 0 failed, 0 ignored, 71 zestawów); generator --check EXIT 0; mutacje (a), (b′), (c) FAIL
BLOKADY: brak
RUNDY: 3/5
NASTĘPNY KROK: Evaluator r3, potem Final Control r3
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i warunki startu

- Worktree detached na `02b07a83e` (DODATEK r3). `git diff --stat f85622878 02b07a83e -- rust-port`:
  tylko `sync/build.rs`, `sync/input.rs`, `tests/improvements_sync_g5.rs`,
  `tests/improvements_sync_g5_gen.mjs`, `tests/improvements_sync_g5_vectors/vectors.json`
  (wszystko z allowlisty).
- Przed bramką (08:06 UTC): `df -h /` = **17 GB** wolnego (≥ 12 GB); `ps` bez procesów
  `cargo`/`rustc` z innych worktrees.
- Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
  `CARGO_TARGET_DIR` w scratchpadzie sesji (poza repo), usunięty po bramkach.
- Po bramkach: 16–17 GB wolnego; dysk ani cudzy build nie przerwały pomiaru.

## Bramki (crate `rust-port/renderer`)

| Bramka | Wynik | Czas (UTC) |
|---|---|---|
| `cargo fmt --check` | EXIT 0 | 08:06 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 | 08:06–08:06:45 |
| `cargo test --test improvements_sync_g5` | EXIT 0, 11 passed / 0 failed / 0 ignored | 08:07 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0, 588 passed / 0 failed / 0 ignored (suma 71 linii `test result`) | 08:07–08:09 |
| `node tests/improvements_sync_g5_gen.mjs --check` | EXIT 0 (33 heksy, 44 klucze) | po mutacjach |

Testy G5 (11): `every_alias_has_vectors`, `fallback_only_without_ulepszenia`,
`improvement_key_is_not_read`, `improvement_table_keys_match_pin_json`,
`improvement_keys_for_hex_matches_pin`, `legacy_key_aliases_match_pin_table`,
`merged_improvement_layers_match_pin`, `ulepszenie_web_matches_dto_names`,
`prototype_keys_match_node`, `normalize_improvement_key_matches_pin`,
`fallback_layers_feed_the_improvement_group`.

## Mutacje (każda na kopii `build.rs`, przywrócona `cp` + `cmp` = identyczny; na końcu `git status` czysty)

| Mutant | Zmiana | Wynik `cargo test --test improvements_sync_g5` |
|---|---|---|
| (a) | `LEGACY_KEY_ALIASES` bez wpisu `("pastwisko", "bydlo")` (tablica `[_; 0]`) | **FAIL**, EXIT 101: 6/11 FAILED (`legacy_key_aliases_match_pin_table`, `normalize_improvement_key_matches_pin`, `improvement_keys_for_hex_matches_pin`, `fallback_only_without_ulepszenia`, `merged_improvement_layers_match_pin`, `fallback_layers_feed_the_improvement_group`) |
| (b′) | filtr `if k.is_empty() \|\| k == "brak" { continue; }` przy dokładaniu warstw postawionych (`merged_improvement_layers`, pętla `for k in hex.ulepszenia…`, `build.rs:230-232`) | **FAIL**, EXIT 101: `merged_improvement_layers_match_pin` — pierwszy rozjazd `ulepszenia_brak_no_fallback` (left `[]`, right `["brak"]`, pin `terrain-improvements.ts:371-376`). Wektory z `''`/`'brak'` w `merged` to dokładnie trzy: `ulepszenia_brak_no_fallback` `['brak']`, `ulepszenia_empty_key_no_fallback` `['']`, `brak_and_empty_skipped` `['farma','droga','','brak']` — wszystkie tracą te warstwy pod mutantem; asercja zatrzymuje się na pierwszym |
| (c) | odwrócony fallback: `hex.ulepszenie` dokładany zawsze i jako pierwszy, gałąź pustego `ulepszenia` bez fallbacku | **FAIL**, EXIT 101: 3/11 FAILED (`fallback_only_without_ulepszenia`, `improvement_keys_for_hex_matches_pin`, `merged_improvement_layers_match_pin`) |

Po mutacjach `git status --short` pokazał jedynie `rust-port/renderer/Cargo.lock`
(zmiana z buildu) — cofnięta `git checkout --`, nie commitowana.

## Decyzje obowiązujące (bez zmian, z DODATKU r2/r3)

- D1: fallback do `ulepszenie` tylko przy pustym/nieobecnym `ulepszenia`; `improvement_key` nieczytany (pin `terrain-improvements.ts:365-377`).
- D2: `''` i `'brak'` zostają w warstwach postawionych (pin `main.ts:3132-3135`); mutacja (b) zastąpiona (b′).
- Normalizacja w konsumencie `sync/build.rs` (odstępstwo od „producenta DTO” udokumentowane w r1).

## Dług (poza allowlistą, bez zmian)

- `rust-port/renderer/src/improvements/sync/mod.rs:39,46` nadal opisuje G5 jako lukę — osobny temat lub rozszerzenie allowlisty.
- Raport Evaluatora r2 (`02-evaluator-r2.md`) leży na lokalnej gałęzi `eval-g5-r2`, poza łańcuchem bazy — do scalenia przy integracji raportów.
