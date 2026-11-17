# R-RUSTPORT-P4-1-G5-NORM-OPUS — Evaluator r3 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer Rust, ulepszenia per heks)
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (`LEGACY_KEY_ALIASES`, `normalizeImprovementKey`) i fallback do `hex.ulepszenie` w `improvementKeysForHex` / `mergedImprovementLayers` renderera, 1:1 z pinem `07d2fbd72`.
ZMIANY/COMMIT: oceniany commit Operatora r3 `074b25afb` (kod = r1 `0671e292d` + komentarz generatora r2; baza r3 `02b07a83e`, baza kodu `f85622878`). Ten raport: nowy plik `02-evaluator-r3.md` (nazwa `02-evaluator.md` należy do r1, nie nadpisuję historii). Commit lokalny na `rust-port-wip/p4-1-g5-norm-opus-eval-r3`, bez push.
TESTY: niżej (odtworzone samodzielnie, z kodami wyjścia).
BLOKADY: brak.
RUNDY: 3/5.
NASTĘPNY KROK: Obrona Operatora (zarzuty 1–5 są uwagami, żaden nie blokuje) → Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Warunki bramki

- `df -h /` przed bramką: 16 GB wolnego (≥ 12 GB). `ps`: brak cudzych procesów `cargo`/`rustc`.
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo), usunięty po bramkach.
- Zmiana `rust-port/renderer/Cargo.lock` po buildzie cofnięta (`git checkout --`), nie commitowana.

## 2. Bramki (crate `rust-port/renderer`, HEAD `074b25afb`)

| Bramka | Wynik | EXIT |
|---|---|---|
| `cargo fmt --check` | czysto | 0 |
| `cargo clippy --all-targets -- -D warnings` | brak ostrzeżeń | 0 |
| `cargo test --lib` | 109 passed, 0 failed, 0 ignored | 0 |
| `cargo test --test improvements_sync_g5` | 11 passed, 0 failed, 0 ignored | 0 |
| `cargo test --all-targets --no-fail-fast` | 71 zestawów, 588 passed, 0 failed, 0 ignored | 0 |
| `node rust-port/renderer/tests/improvements_sync_g5_gen.mjs --check` | OK (33 heksy, 44 klucze) — wektory = wynik wykonania tekstu pina | 0 |

Liczby zgodne z raportem Operatora r3 (588 / 71 / 11/11 / 33 / 44).

## 3. Mutacje (każda przywrócona z kopii, `cmp` identyczny)

| Mutacja | Wynik | EXIT |
|---|---|---|
| (a) `LEGACY_KEY_ALIASES` bez wpisu `pastwisko→bydlo` (tabela pusta) | FAIL 6/11 (m.in. `legacy_key_aliases_match_pin_table`, `normalize_improvement_key_matches_pin`, `merged_improvement_layers_match_pin`) | 101 |
| (b′) filtr `''`/`'brak'` przy dokładaniu warstw postawionych (`build.rs:230-232`) | FAIL 1/11 (`merged_improvement_layers_match_pin`) | 101 |
| (c) odwrócona kolejność fallbacku (`hex.ulepszenie` przed `ulepszenia`) | FAIL 4/11 | 101 |
| (d, dodatkowa) `normalize_improvement_key` zachowuje nieznane klucze | FAIL 5/11 | 101 |
| (e, dodatkowa) usunięcie `|| raw == "brak"` w `normalize_improvement_key` | PASS 11/11 — mutacja równoważna (zarzut 2) | 0 |
| (f, dodatkowa) brak deduplikacji w `improvement_keys_for_hex` | FAIL 2/11 | 101 |

## 4. Zgodność z pinem (sprawdzone w tekście `07d2fbd72`)

- `gra/src/game/terrain-improvements.ts:32-34` — `LEGACY_KEY_ALIASES = { pastwisko: 'bydlo' }`: jedyny wpis; Rust `LEGACY_KEY_ALIASES: [(&str,&str);1]` identyczny, test porównuje z tabelą wyczytaną z wykonanego pina.
- `:117-123` `normalizeImprovementKey`: `!raw || 'brak'` → undefined; alias; `IMPROVEMENTS[key]` truthy → key; inaczej `IMPROVEMENTS[raw] ? raw : undefined`. Rust `normalize_improvement_key` odwzorowuje to wraz z nazwami `Object.prototype` (prawdziwe w obiekcie JS) i wierszami `_meta`/`_miasto_zasieg_ref`.
- `:358-380` `improvementKeysForHex`: niepuste `ulepszenia` decyduje samo (`new Set` = pierwsza pozycja), fallback do `hex.ulepszenie` tylko przy braku/pustej liście. Rust zgodny; `improvement_key` nieczytany (D1 z DODATKU r2 — zgodne z pinem).
- `gra/src/main.ts:3126-3137` `mergedImprovementLayers`: Set(keysForHex) + warstwa złoża + `placedImprovements` bez filtra. Rust zgodny (D2 z DODATKU r2: `''`/`'brak'` zostają jako warstwy postawione).

## 5. Allowlista, testy, wołający

- `git diff --stat f85622878 074b25afb`: tylko `renderer/src/improvements/sync/build.rs`, `renderer/src/improvements/sync/input.rs` (wyłącznie komentarz doc pola `ulepszenie`), `renderer/tests/improvements_sync_g5.rs`, `improvements_sync_g5_gen.mjs`, `improvements_sync_g5_vectors/vectors.json` (nowe) i raporty w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-G5-NORM-OPUS/`. Bez `Cargo.lock`, bez `gra/`, `engine/`, `view-model/`. Allowlista dotrzymana.
- Brak `#[ignore]` w `improvements_sync_g5.rs` i `src/improvements/sync/`. Testy R4 (`improvements_sync_r4*.rs`) niezmienione względem bazy (diff pusty) i zielone w pełnym przebiegu — brak osłabionych asercji.
- Wektory behawioralne z wykonania pina (TypeScript `transpileModule` na wycinkach z `git show 07d2fbd72`, SHA-256 wycinków i JSON-a danych w `sources`, `--check` = EXIT 0); asercje dokładne (`Vec<String>`/`Option` z kolejnością). Wartości oczekiwane nie są ręczne (wyjątek: `fallback_only_without_ulepszenia` ma literały, ale najpierw sprawdza je przeciw wektorom pina).
- Wołający produkcyjny: `merged_improvement_layers` ← `build_improvement_group` (`build.rs:325`) ← `sync` w `renderer/src/improvements/sync/mod.rs:199`. Funkcje nie wiszą wyłącznie w testach.

## 6. Zarzuty (ponumerowane; wszystkie na poziomie uwag, żaden nie łamie kryteriów końca)

1. **Druga kopia normalizacji w Rust.** `engine/src/domain/improvements.rs:696` (`normalize_improvement_key`, aliasy z `engine/data/derived/ulepszenia-reguly.json`) i nowa `renderer/.../build.rs` (`LEGACY_KEY_ALIASES`, `IMPROVEMENT_TABLE_KEYS`, `JS_OBJECT_PROTOTYPE_KEYS` jako stałe) to dwa źródła tej samej tabeli. Dispatch: „jedno źródło”. Łagodzenie: renderer zależy tylko od `civ-view-model` (`renderer/Cargo.toml`, decyzja B-DEP), więc nie może wołać engine; dryf wobec pina wykrywa test (porównanie z wykonanym pinem). Ryzyko: zmiana danych w engine bez regeneracji wektorów renderera nie zostanie zauważona przez test engine. Do rejestru jako dług (docelowo producent DTO `layers`, zgodnie z propozycją w `mod.rs`).
2. **Mutacja (e) przeżywa.** Usunięcie `|| raw == "brak"` nie zmienia wyniku, bo `'brak'` nie jest wierszem `IMPROVEMENTS` ani nazwą prototypu — mutacja równoważna (jak mutacja (b) r1, uznana za równoważną w DODATKU r2). Nie wymaga zmiany kodu; odnotować, że gałąź `'brak'` w `normalize_improvement_key` jest nietestowalna behawioralnie.
3. **Warstwy postawione brane z `HexDynDto.ulepszenia`, nie z `placedImprovements`.** Pin trzyma je równe przez `syncHexUlepszenieFields` (`main.ts:16275-16289`) i `restorePlacedImprovementsFromSave` (`:17104-17119`); jednak `mapSnapshot.ts:333` odtwarza `hex.ulepszenia` niezależnie, więc w niespójnym zapisie (heks z `ulepszenia` w snapszocie, bez wpisu w `placedImprovements`) pin dałby `['bydlo']`, a Rust `['bydlo','pastwisko']`. Generator wektorów przyjmuje to samo założenie (`placedImprovements = ulepszenia`), więc przypadek nie jest pokryty. Założenie jest jawnie opisane w komentarzu `build.rs` — uwaga do kontraktu DTO, nie błąd tej rundy.
4. **Dług poza allowlistą (znany):** `renderer/src/improvements/sync/mod.rs:39-46` nadal opisuje G5 jako niezrobione („not done; … gets no improvement mesh here”), co po tej zmianie jest nieprawdą. Do osobnej poprawki komentarza.
5. **Nazwa wektora `brak_and_empty_skipped`** jest myląca (w `merged` `''` i `'brak'` NIE są pominięte); komentarz w generatorze to wyjaśnia, nazwa zachowana, bo odwołuje się do niej DODATEK r2. Kosmetyka.

## 7. Werdykt

PASS-WITH-NOTES: bramki zielone przy realnym pomiarze (fmt/clippy/lib/g5/all-targets EXIT 0, 588/0/0), wektory zgodne z wykonaniem pina, wymagane mutacje (a), (b′), (c) dają FAIL, allowlista dotrzymana, wołający produkcyjny istnieje. Zarzuty 1–5 to dług/uwagi do rejestru.
