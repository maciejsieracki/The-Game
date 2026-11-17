# 02-operator-r2 — R-RUSTPORT-P4-1-G5-NORM-OPUS, runda 2

```text
STATUS: BLOCK (INFRA) — bramka renderera nieuruchomiona: dysk 8,8 GB < 12 GB i 3 równoległe buildy cargo innych workerów
DOMAIN: GAME (renderer Rust, grafika)
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES / normalizeImprovementKey) i fallback do hex.ulepszenie w renderer sync/build.rs, 1:1 z pinem 07d2fbd72
ZMIANY/COMMIT: kod bez zmian względem r1 (0671e292d); gałąź robocza rust-port-wip/p4-1-g5-norm-opus-op-r2 od 8472cdeb0 (FC r1); ten raport = jedyny nowy plik; SHA commitu raportu w odpowiedzi Operatora (nie da się wpisać SHA commitu do jego własnej treści)
TESTY: fmt --check EXIT 0; generator --check EXIT 0; git diff --check czysto; clippy / test g5 / all-targets / mutacje (a), (b′), (c): NIE_ZMIERZONO (BLOCK INFRA)
BLOKADY: INFRA — `df -h /` = 8,8 GB wolnego (dwa pomiary), wymagane ≥ 12 GB; `pgrep -a cargo`: `cargo clippy --all-targets -- -D warnings` (pid 11558), `cargo check --all-targets` (pid 11567), `cargo test --all-targets --no-fail-fast` (pid 31789) — cudze tematy
RUNDY: 2/5
NASTĘPNY KROK: r3 tego samego ID (ta sama baza f85622878, kod 0671e292d) dopiero przy ≥ 12 GB wolnego i bez cudzych buildów: pełna bramka + mutacje (a), (b′), (c). Bez tego kolejne rundy będą powtarzać BLOCK INFRA.
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i ancestry

- Baza z dispatchu: `origin/rust-port/parity-v2` = `f85622878a1bed0bee8090253d3214e12407bdea` (sprawdzone `git rev-parse`, bez zmian względem r1).
- Punkt wyjścia r2 (DODATEK r2: „kod r1 jest punktem wyjścia, przenieś go”): `origin/rust-port-wip/p4-1-g5-norm-opus-fc-r1` = `8472cdeb0` (zawiera kod `0671e292d` + raporty r1). `git merge-base --is-ancestor f85622878 HEAD` → OK.
- Nazwa raportu: wg DODATKU r2 = `02-operator-r2.md` (zadanie workflow wskazywało `01-operator-r1.md`, ale samo każe brać nazwę „wg dispatchu/dodatku”; `01-operator-r1.md` już istnieje i należy do r1).

## Decyzje DODATKU r2 — stan kodu

| Decyzja | Stan w kodzie 0671e292d |
|---|---|
| D1: fallback do `ulepszenie` tylko przy pustym `ulepszenia`; `improvement_key` nieczytany | Zgodne: `improvement_keys_for_hex` (build.rs); testy `improvement_key_is_not_read`, `fallback_only_without_ulepszenia` |
| D2: `''` i `'brak'` z `ulepszenia` zostają warstwami | Zgodne: `merged_improvement_layers` (`build.rs:230-232`) dokłada `hex.ulepszenia` bez filtra; wektor `brak_and_empty_skipped` → `["farma","droga","","brak"]` |
| `sync/mod.rs:39,46` (opis G5 jako luki) | NIE zmieniony (poza allowlistą, zgodnie z dodatkiem) — **dług**: do osobnego tematu dokumentacyjnego |

Brak zmian kodu w r2 — dodatek nie wymaga zmian merytorycznych, tylko pomiaru bramek i mutacji.

## Bramki wykonane (bez kompilacji)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (rust-port/renderer) | EXIT 0 |
| `node tests/improvements_sync_g5_gen.mjs --check` | EXIT 0, „OK … (33 hexes, 44 keys)” |
| `git diff --check f85622878 HEAD` | czysto |
| Allowlista (`git diff --name-only f85622878 HEAD`) | build.rs, input.rs, improvements_sync_g5.rs, improvements_sync_g5_gen.mjs, improvements_sync_g5_vectors/vectors.json + raporty w runs/; brak Cargo.lock, engine/**, view-model/**, gra/, sync/mod.rs |

## Bramki NIE uruchomione (BLOCK INFRA)

| Bramka | Wynik |
|---|---|
| `cargo clippy --all-targets -- -D warnings` | NIE_ZMIERZONO |
| `cargo test --test improvements_sync_g5` | NIE_ZMIERZONO |
| `cargo test --all-targets --no-fail-fast` | NIE_ZMIERZONO |
| Mutacja (a) usunięcie wpisu aliasu `pastwisko→bydlo` | NIE_ZMIERZONO (oczekiwany FAIL: `legacy_key_aliases_match_pin_table`, `normalize_improvement_key_matches_pin`) |
| Mutacja (b′) filtr `''`/`'brak'` w `build.rs:230-232` | NIE_ZMIERZONO (oczekiwany FAIL: `ulepszenia_brak_no_fallback`, `ulepszenia_empty_key_no_fallback`, `brak_and_empty_skipped`) |
| Mutacja (c) odwrócenie kolejności fallbacku | NIE_ZMIERZONO (oczekiwany FAIL: `ulepszenia_over_ulepszenie`) |

Powód: dispatch, sekcja BRAMKI i DODATEK r2: „Wymaga ≥ 12 GB wolnego i braku równoległych buildów … Przy < 12 GB: BLOCK INFRA z liczbą GB”. Pomiar: 8,8 GB (dwukrotnie) i 3 aktywne procesy cargo innych tematów. Uruchomienie łamałoby regułę i mogło zabrać dysk innym workerom (budowa renderera z testami potrzebuje kilku GB targetu).

## Uwaga dla orkiestratora

Ten temat trzeci raz z rzędu (Operator r1, Evaluator r1, FC r1, Operator r2) kończy się BLOCK INFRA z tego samego powodu. Kod jest statycznie zweryfikowany przez Evaluatora i FC; brakuje wyłącznie kompilacji, testów i mutacji. Kolejną rundę warto uruchomić w oknie, gdy pozostali workerzy nie budują (np. zaraz po sprzątnięciu targetów zakończonego tematu), inaczej wynik się powtórzy. Decyzje D1/D2 i zamianę mutacji (b)→(b′) trzeba wpisać do `REJESTR-RUST.md` (czynność orkiestratora).
