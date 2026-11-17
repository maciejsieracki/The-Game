# 02 — Evaluator r2, R-RUSTPORT-P4-1-G5-NORM-OPUS

Nazwa pliku: `02-evaluator.md` jest już zajęty przez raport Evaluatora r1 (31d337258).
Żeby nie nadpisywać historii, raport r2 ma sufiks `-r2`, tak jak `02-operator-r2.md`.

```text
STATUS: FAIL (BLOCK INFRA: bramki renderera nadal niezmierzone, kod nigdy nie był kompilowany)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES) i fallback do hex.ulepszenie w rendererze, zgodnie z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany HEAD d43c203a4 (kod 0671e292d bez zmian od r1); baza f85622878 = origin/rust-port/parity-v2; Evaluator dopisuje tylko ten raport
TESTY: fmt EXIT 0; generator --check EXIT 0; diff --check czysto; clippy, test g5, all-targets i mutacje: NIE_ZMIERZONO
BLOKADY: df -h / = 7,7 GB wolnego (wymagane ≥ 12 GB); równoległe cudze buildy: cargo clippy --all-targets (pid 11558), cargo check --all-targets (pid 11567), cargo test --all-targets --no-fail-fast (pid 31789)
RUNDY: 2/5
NASTĘPNY KROK: obrona i FC r2; potem r3 tego samego ID, uruchomiona przez orkiestratora w oknie z ≥ 12 GB i bez cudzych buildów (jedyna treść r3: bramki i mutacje)
DEPLOY/PUSH: NIE WYKONANO
```

## Pomiary własne Evaluatora (gałąź lokalna `eval-g5-r2` = d43c203a4)

| Pomiar | Wynik |
|---|---|
| `df -h /` | 7,7 GB wolnego (dwa pomiary), wymagane ≥ 12 GB |
| Równoległe buildy (`ps`) | clippy 11558, check 11567, test --all-targets 31789 (cudze tematy) |
| `cargo fmt --check` (renderer) | EXIT 0 |
| `node tests/improvements_sync_g5_gen.mjs --check` (TYPESCRIPT_JS z dispatchu) | `OK … (33 hexes, 44 keys)`, EXIT 0 |
| `git diff --check f85622878 HEAD` | czysto, EXIT 0 |
| `#[ignore]` / `ignore` w `tests/improvements_sync_g5.rs` | 0 |
| Allowlista (`git diff --name-only f85622878 HEAD`) | build.rs, input.rs, g5.rs, g5_gen.mjs, g5_vectors/vectors.json, raporty w `runs/R-RUSTPORT-P4-1-G5-NORM-OPUS/`; bez Cargo.lock, engine/**, view-model/**, gra/, sync/mod.rs |
| `cargo clippy --all-targets -- -D warnings` | NIE_ZMIERZONO (dispatch zabrania bramki przy < 12 GB) |
| `cargo test --test improvements_sync_g5` | NIE_ZMIERZONO |
| `cargo test --all-targets --no-fail-fast` | NIE_ZMIERZONO |
| Mutacje (a), (b′), (c) | NIE_ZMIERZONO |

## Weryfikacja statyczna wobec pinu 07d2fbd72

- `terrain-improvements.ts:32-34`: `LEGACY_KEY_ALIASES = { pastwisko: 'bydlo' }`. W Rust jest jeden wpis `("pastwisko", "bydlo")`. Zgodne.
- `:117-123` `normalizeImprovementKey`: `''`/`'brak'` → undefined, alias, potem `IMPROVEMENTS[key]`, potem `IMPROVEMENTS[raw]`. `normalize_improvement_key` odwzorowuje kolejność. Klucze prototypu JS są traktowane jako „prawdziwe”, co jest zgodne z semantyką JS. Zgodne.
- `:358-380` `improvementKeysForHex`: niepuste `ulepszenia` decyduje samo (map, filter, Set). Fallback `hex.ulepszenie ?? 'brak'` działa tylko przy pustym lub nieobecnym `ulepszenia`. `improvement_keys_for_hex` to odwzorowuje, a `improvement_key` nie jest czytany. Zgodne z DECYZJĄ 1 z DODATKU r2.
- `main.ts:3126-3137` `mergedImprovementLayers`: Set(keysForHex), potem warstwa złoża, potem `placed` bez filtra. W Rust `build.rs:227-232` daje tę samą kolejność, a pętla po `ulepszenia` nie ma filtra. Zgodne z DECYZJĄ 2.
- Wektory (`vectors.json`): `ulepszenia_brak_no_fallback` → keys `[]`, merged `["brak"]`; `ulepszenia_empty_key_no_fallback` → `[]`, `[""]`; `brak_and_empty_skipped` → keys `["farma","droga"]`, merged `["farma","droga","","brak"]`. Wynik zgadza się z DODATKIEM r2. Wektory powstają przez wykonanie tekstu pinu, a nie ręcznie (`--check` przechodzi).
- Wołający w Rust: `merged_improvement_layers` jest wołany w `build.rs` przez ścieżkę sync renderera. Pośrednio pokazuje to test `fallback_layers_feed_the_improvement_group`, ale do czasu kompilacji pozostaje to NIE_ZMIERZONO.

## Zarzuty

1. **Bramki renderera i mutacje niezmierzone (NAPRAW, przyczyna INFRA).** Clippy `-D warnings`, `cargo test --test improvements_sync_g5`, `cargo test --all-targets --no-fail-fast` i mutacje (a), (b′), (c) nie zostały uruchomione ani przez Operatora r2, ani przez Evaluatora r2. Powód: 7,7 GB < 12 GB oraz 3 cudze buildy. Kod 0671e292d nigdy nie był kompilowany. Bez tych pomiarów nie ma podstaw do PASS. To piąty z rzędu BLOCK INFRA (r1: Operator, Evaluator, FC; r2: Operator, Evaluator). Kolejna runda ma sens dopiero wtedy, gdy orkiestrator zapewni okno z ≥ 12 GB i bez równoległych buildów (zasada 4 z CLAUDE.md: bramka renderera czeka).
2. **Nazwa wektora `brak_and_empty_skipped` jest myląca (drobne, nie blokuje).** Po DECYZJI 2 `''` i `'brak'` NIE są pomijane w `merged`, tylko w `keysForHex`. Nazwa sugeruje odwrotne zachowanie. Proponuję zmienić ją w generatorze (np. na `brak_and_empty_kept_as_placed`) przy najbliższej rundzie z kodem albo zostawić i opisać w komentarzu testu. Wymóg nazwy pochodzi z DODATKU r2, więc to decyzja orkiestratora.
3. **Dług `sync/mod.rs:39,46` (odnotowany, poza allowlistą).** Komentarz nadal opisuje G5 jako lukę. Operator słusznie go nie zmienił. Orkiestrator powinien założyć osobny temat albo rozszerzyć allowlistę.

## Werdykt

FAIL. Merytorycznie kod i wektory są zgodne z pinem i z decyzjami D1/D2, a statyczna weryfikacja nie wykazała błędów. Brakuje jednak dowodu kompilacji, testów i mutacji (zarzut 1), a przyczyną jest INFRA, nie jakość kodu.
