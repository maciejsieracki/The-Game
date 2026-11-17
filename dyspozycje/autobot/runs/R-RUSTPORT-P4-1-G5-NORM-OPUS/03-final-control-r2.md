# 03 — Final Control r2 — R-RUSTPORT-P4-1-G5-NORM-OPUS

Plik ma sufiks `-r2`, bo `03-final-control.md` należy do rundy 1.

```text
STATUS: FAIL (BLOCK INFRA — bramki renderera niezmierzone)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES) i fallback do `ulepszenie` w sync/build.rs, parytet z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany SHA 72ededb4c (obrona r2) <- d43c203a4 (Operator r2) <- 8472cdeb0 (FC r1); kod Rust bez zmian od r1 (0671e292d); jedyna zmiana r2 w kodzie testów = komentarz w improvements_sync_g5_gen.mjs; ten raport = commit FC nad 72ededb4c (lokalnie, bez push)
TESTY: patrz niżej
BLOKADY: INFRA — df -h / = 4,2 GB wolnego (wymagane >= 12 GB); cudzy build cargo test --all-targets (pid 31788/31789) w toku
RUNDY: 2/5
NASTĘPNY KROK: runda r3 tego samego ID WYŁĄCZNIE w oknie >= 12 GB wolnego i bez cudzych buildów (orkiestrator: zwolnić dysk / wstrzymać inne bramki Rust przed startem)
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i ancestry

- Baza z dispatchu: `origin/rust-port/parity-v2` = `f85622878`.
- `git merge-base --is-ancestor f85622878 72ededb4c` → prawda (ANC_OK).
- `git diff --stat f85622878 72ededb4c`: tylko pliki z allowlisty (`sync/build.rs`, `sync/input.rs`, `tests/improvements_sync_g5.rs`, `tests/improvements_sync_g5_gen.mjs`, `tests/improvements_sync_g5_vectors/vectors.json`, raporty w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-G5-NORM-OPUS/`). Brak `Cargo.lock`, `engine/`, `view-model/`, `gra/`, `sync/mod.rs`.
- Raport Evaluatora r2 (`02-evaluator-r2.md`, a8f228171) leży na osobnej lokalnej gałęzi `eval-g5-r2` i nie jest w łańcuchu 72ededb4c — do scalenia przez orkiestratora przy integracji raportów.

## Bramki zmierzone samodzielnie przez FC (na 72ededb4c)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (renderer) | EXIT 0 |
| `node tests/improvements_sync_g5_gen.mjs --check` | EXIT 0 (33 heksy, 44 klucze) |
| `git diff --check f85622878 72ededb4c` | czysto |
| `#[ignore]` w `improvements_sync_g5.rs` | brak |
| `df -h /` przed bramką | 4,2 GB wolnego (< 12 GB) |
| `cargo clippy --all-targets -- -D warnings` | NIE_ZMIERZONO (INFRA) |
| `cargo test --test improvements_sync_g5` | NIE_ZMIERZONO (INFRA) |
| `cargo test --all-targets --no-fail-fast` | NIE_ZMIERZONO (INFRA) |
| Mutacje (a), (b′), (c) | NIE_ZMIERZONO (INFRA) |

Zgodnie z dispatchem przy < 12 GB bramki nie uruchomiono na pół.

## Orzeczenia

1. **Bramki renderera niezmierzone (Evaluator z.1) — NAPRAW (INFRA).** Kod 0671e292d nadal nigdy nie był skompilowany ani przetestowany; kryterium końca 1 niespełnione. Potwierdzone pomiarem FC: 4,2 GB wolnego, cudzy `cargo test --all-targets` w toku. Nie jest to wada kodu, ale bez bramek nie ma PASS. Szósty/siódmy z rzędu BLOCK INFRA — kolejna runda bez zmiany warunków dysku jest marnowaniem rundy.
2. **Myląca nazwa wektora `brak_and_empty_skipped` (Evaluator z.2) — ODDAL.** Nazwa pochodzi z DODATKU r2 i jest kotwicą mutacji (b′); obrona dodała komentarz w generatorze wyjaśniający, że „skipped” dotyczy tylko `improvementKeysForHex`, a merged = `[farma, droga, '', brak]`. `--check` EXIT 0 potwierdza brak zmiany wektorów.
3. **Komentarz `sync/mod.rs:39,46` opisuje G5 jako lukę (Evaluator z.3) — ODDAL w tym temacie.** Plik poza allowlistą; DODATEK r2 wprost zakazuje zmiany. Dług dla orkiestratora: osobny temat lub rozszerzenie allowlisty w r3.
4. **Weryfikacja statyczna wobec pinu (Evaluator z.4)** — brak zarzutu; nic do orzeczenia.

Werdykt: jeden NAPRAW → **FAIL**.

## Dla orkiestratora

- Wpisać D1, D2 i zamianę mutacji (b)→(b′) do `REJESTR-RUST.md` (zgłaszane przez Operatora r2, nie widać tego w łańcuchu).
- Przed r3 zapewnić >= 12 GB wolnego i brak równoległych buildów cargo; w przeciwnym razie nie startować r3.
