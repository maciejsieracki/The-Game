# 03 — Final Control, R-RUSTPORT-P4-1-G5-NORM-OPUS (runda 1)

```text
STATUS: FAIL (BLOCK INFRA: bramki renderera niezmierzone; kod nigdy nie był kompilowany)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES) i fallback do hex.ulepszenie w rendererze, zgodnie z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany HEAD 8a09c3ad5 (kod 0671e292d); baza f85622878 = origin/rust-port/parity-v2, przodek HEAD (git log f85622878..8a09c3ad5 = 4 commity); FC dopisuje tylko ten raport
TESTY: patrz niżej; clippy, test g5, all-targets i mutacje: NIE_ZMIERZONO
BLOKADY: dysk 8,6–8,7 GB < 12 GB; równoległy cudzy build (cargo test --test p6_k5doc_t7b, rustc civ_engine)
RUNDY: 1/5
NASTĘPNY KROK: r2 tego samego ID na bazie 8a09c3ad5: najpierw pełna bramka renderera i mutacje (a), (b′), (c), gdy będzie ≥ 12 GB wolnego i bez cudzych buildów; ewentualnie sync/mod.rs:39,46, jeśli orkiestrator rozszerzy allowlistę
DEPLOY/PUSH: NIE WYKONANO
```

## Pomiary własne FC (detached 8a09c3ad5)

| Pomiar | Wynik |
|---|---|
| `df -h /` | 8,7 GB, potem 8,6 GB wolnego (wymagane ≥ 12 GB) |
| Równoległe buildy | `cargo test --test p6_k5doc_t7b` + `rustc --crate-name civ_engine` (PID 30192/30193/30201) |
| `git diff --check f85622878 HEAD` | czysto |
| `cargo fmt --check` (renderer) | EXIT 0 |
| `node improvements_sync_g5_gen.mjs --check` | OK, EXIT 0 (33 heksy, 44 klucze) |
| `#[ignore]` w `tests/improvements_sync_g5.rs` | 0 |
| Allowlista (`git diff --stat f85622878 8a09c3ad5`) | 8 plików: build.rs, input.rs, g5.rs, g5_gen.mjs, g5_vectors/vectors.json, 3 raporty w runs/; bez Cargo.lock, engine/**, view-model/**, gra/ |
| clippy -D warnings, test g5, all-targets, mutacje | NIE_ZMIERZONO (bramka zabroniona przez dispatch przy < 12 GB) |

## Orzeczenia

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | Bramki renderera niezmierzone | **NAPRAW** | Kod nigdy nie był kompilowany; brak dowodu z clippy/testów/mutacji. FC też nie może ich uruchomić (8,6 GB, cudzy build). Przyczyna to INFRA, nie jakość kodu, ale bez bramek nie ma PASS. |
| 2 | Fallback zależy od `ulepszenia`, nie od `improvement_key` | **ODDAL** | Pin `terrain-improvements.ts:358-380`: fallback do `hex.ulepszenie` tylko przy pustym `hex.ulepszenia`; `improvementKey` nie jest czytany na tej ścieżce. Kod `improvement_keys_for_hex` odwzorowuje to 1:1. Wg zasady 9/11 CLAUDE.md pin ma pierwszeństwo przed błędnym założeniem dispatchu. Decyzja techniczna do wpisu w REJESTR-RUST (orkiestrator). |
| 3 | `''`/`'brak'` z warstw postawionych zostają warstwami; mutacja (b) równoważna | **ODDAL** | Pin `main.ts:3126-3137` dokłada `placed` bez filtrowania. `normalize_improvement_key` zwraca `None` dla `''`/`'brak'` (`:117-118`), więc (b) w normalizacji jest równoważna (`''`/`'brak'` nie są kluczami tabeli ani prototypu). Zastąpienie przez (b′) jest poprawne — do wpisu w REJESTR-RUST. Mutacje i tak trzeba zmierzyć w r2 (zarzut 1). |
| 4 | Nieaktualny opis G5 w `sync/mod.rs:39,46` | **DO DECYZJI CZŁOWIEKA** (orkiestratora, decyzja techniczna) | Plik poza allowlistą; Operator słusznie go nie ruszył. Orkiestrator: rozszerzyć allowlistę r2 o te komentarze albo osobny temat dokumentacyjny. |
| 5 | Listy kluczy wpisane na stałe w build.rs | **ODDAL** | Dispatch wymaga tabeli stałej w Rust; dryf pilnują testy `improvement_table_keys_match_pin_json` i `prototype_keys_match_node` (do zmierzenia w r2). |

Weryfikacja statyczna logiki: `normalize_improvement_key`, `legacy_alias` (jeden wpis `pastwisko→bydlo`, zgodny z pinem `:32-34`) i `merged_improvement_layers` (Set z `improvementKeysForHex`, potem warstwa złoża zwierzęcego, potem `placed`) zgadzają się z pinem.

## Werdykt

FAIL: jeden NAPRAW (zarzut 1, przyczyna INFRA). Merytorycznie kod jest zgodny z pinem; r2 = wyłącznie bramki + mutacje (i ewentualnie mod.rs po decyzji orkiestratora).
