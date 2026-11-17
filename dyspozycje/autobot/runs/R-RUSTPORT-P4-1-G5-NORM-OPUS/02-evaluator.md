# 02-evaluator — R-RUSTPORT-P4-1-G5-NORM-OPUS, runda 1

STATUS: FAIL (bramki renderera nieodtworzone: BLOCK INFRA; kod statycznie zgodny z pinem)
DOMAIN: GAME (renderer Rust, grafika)
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES / normalizeImprovementKey) i fallback do `hex.ulepszenie` w rendererze, 1:1 z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany HEAD d5a47e288 (kod 0671e292d), baza f85622878 = origin/rust-port/parity-v2 (zgodne z dispatchem, f85622878 jest przodkiem). Ten raport: commit bez push.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Bramki odtworzone przez Evaluatora

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (rust-port/renderer) | EXIT 0 |
| `node rust-port/renderer/tests/improvements_sync_g5_gen.mjs --check` | EXIT 0, „OK … (33 hexes, 44 keys)” |
| `git diff --check f85622878 HEAD` | czysto |
| allowlista (`git diff --name-only f85622878 HEAD`) | 6 plików, wszystkie na allowliście; brak `Cargo.lock`, `engine/**`, `view-model/**`, `gra/` |
| `#[ignore]` w nowych testach | brak |
| `cargo clippy --all-targets -- -D warnings` | NIE_ZMIERZONO |
| `cargo test --test improvements_sync_g5` | NIE_ZMIERZONO |
| `cargo test --all-targets --no-fail-fast` | NIE_ZMIERZONO |
| mutacje (a), (b), (c) | NIE_ZMIERZONO (kompilacja niemożliwa) |

Powód: dispatch wymaga ≥ 12 GB wolnego i braku równoległych buildów. Pomiar: `df -h /` = 8,1 GB na starcie, potem 12 GB. Przez cały czas działały cudze buildy: `cargo test --test p6_k5doc_t7a` (rustc civ_engine), `cargo clippy --all-targets -- -D warnings` z 4 procesami clippy-driver. Bramki nie uruchomiłem, żeby nie łamać reguły i nie zagrozić innym workerom.

## Weryfikacja statyczna względem pinu (wykonana)

- `LEGACY_KEY_ALIASES` w pinie (`terrain-improvements.ts:32-34`) ma jeden wpis `pastwisko → bydlo`. Rust ma ten sam wpis.
- `IMPROVEMENT_TABLE_KEYS` (24 klucze) porównałem z `Object.keys` z `git show 07d2fbd72:gra/data/terrain-improvements.json`: kolejność i zawartość identyczne. `JS_OBJECT_PROTOTYPE_KEYS` jest identyczne z `Object.getOwnPropertyNames(Object.prototype)` w Node.
- `normalizeImprovementKey` (`:117-123`): pusty klucz i `'brak'` dają undefined. Potem alias, potem `IMPROVEMENTS[raw]`, nieznany klucz daje undefined. Rust robi to samo, łącznie z nazwami prototypu (dla `constructor` i `__proto__` przeanalizowałem ścieżkę non-string → `raw`).
- `improvementKeysForHex` (`:358-380`): niepusty `ulepszenia` rozstrzyga sam, bez fallbacku nawet wtedy, gdy wszystkie klucze odpadną. Do `hex.ulepszenie` sięga tylko przy braku lub pustym `ulepszenia`. Rust jest zgodny.
- `mergedImprovementLayers` (`main.ts:3126-3137`): klucze, potem złoże, potem warstwy postawione bez normalizacji. Rust jest zgodny, `ulepszenia` pełni rolę `placedImprovements`, tak jak w R4 (`syncHexUlepszenieFields`, `main.ts:16275-16289`).
- Wektory R4 (`tests/fixtures/improvements_sync/r4_vectors.json`) mają wszędzie `ulepszenie: "brak"` i tylko poprawne klucze w `ulepszenia`. Nowy fallback i brak pomijania `''`/`'brak'` na warstwach postawionych nie zmieniają więc oczekiwań R4. Tego wniosku nie potwierdziłem uruchomieniem.
- Testy są behawioralne na wektorach z wykonanego tekstu pinu (generator robi `git show` i `transpileModule`, a SHA-256 fragmentów trafia do `sources`). Asercje porównują całe wartości dokładnie, bez osłabień.
- Analiza mutacji: (a) usunięcie aliasu daje FAIL w `legacy_key_aliases_match_pin_table` i `normalize_improvement_key_matches_pin`. (c) odwrócenie kolejności daje FAIL w `ulepszenia_over_ulepszenie`. (b) usunięcie `raw.is_empty() || raw == "brak"` w `normalize_improvement_key` jest **równoważne**: `''` i `'brak'` nie są kluczami tabeli ani prototypu, więc wynik i tak jest `None`. Teza Operatora jest poprawna. Mutacja (b′), czyli `''`/`'brak'` na warstwach postawionych, powinna dać FAIL na `brak_and_empty_skipped` i `ulepszenia_*_no_fallback`.

## Zarzuty

1. **Bramki niezmierzone (blokujące).** Nie uruchomiłem clippy -D warnings, testu g5 (11 testów), all-targets ani mutacji (a), (b′), (c). Nie zrobił tego ani Operator, ani Evaluator. Kodu nigdy nie skompilowano. Bez tego nie można wystawić PASS. Następna runda (BLOCK INFRA → ten sam ID) musi wykonać pełną bramkę, gdy będzie ≥ 12 GB i nie będzie cudzych buildów, i podać kody wyjścia oraz wyniki mutacji.
2. **Odstępstwo od dispatchu: fallback.** Dispatch: „fallback tylko gdy `improvement_key` pusty; `improvement_key` obecny → klucz z aliasem”. Implementacja: fallback, gdy pusty jest `ulepszenia`, a `improvement_key` nie jest czytany. Pin (`terrain-improvements.ts:358-380`) potwierdza wersję Operatora. Odstępstwo jest uzasadnione, ale wymaga akceptacji orkiestratora i wpisu w `REJESTR-RUST.md`.
3. **Odstępstwo od dispatchu: `''` i `'brak'` jako warstwy.** Dispatch: „pusty klucz i 'brak' → brak warstwy”. W `merged_improvement_layers` pozostają one warstwami, jeśli są w `ulepszenia` (wektor `brak_and_empty_skipped` → `["farma","droga","","brak"]`). To regresja zachowania względem bazy, która je pomijała, ale zgodna z pinem (`main.ts:3132-3135` dodaje `placed` surowo). Wymaga akceptacji orkiestratora. Mutację (b) z dispatchu trzeba formalnie zastąpić mutacją (b′).
4. **Nieaktualna dokumentacja modułu.** `rust-port/renderer/src/improvements/sync/mod.rs:39` i `:46` nadal opisują G5 jako lukę i „proposed fix”. Plik jest poza allowlistą, więc trzeba go zmienić osobnym tematem albo rozszerzyć allowlistę w następnej rundzie.
5. **Drugie źródło tabeli kluczy (uwaga, nieblokująca).** `IMPROVEMENT_TABLE_KEYS` i `JS_OBJECT_PROTOTYPE_KEYS` są wpisane na stałe w `build.rs`. Pin czyta je z JSON, a `engine/data/derived/ulepszenia-reguly.json` ma `klucze_prototypu_js`. Dryf wyłapują testy na wektorach, ale dispatch prosił o „jedno źródło” (dotyczyło aliasów; aliasy spełniają ten warunek).

## Wołający w Rust

`merged_improvement_layers` jest wołane produkcyjnie przez `build_improvement_group` (`build.rs:325`) i reeksportowane w `sync/mod.rs:84`. `improvement_keys_for_hex` jest wołane przez `merged_improvement_layers`. Wpięcie samego `build_improvement_group` do produkcyjnej ścieżki DTO→renderer zależy od audytu L6 i jest poza zakresem tego tematu.

NASTĘPNY KROK: runda 2 tego samego ID (DODATEK r2, baza d5a47e288). Zakres: pełna bramka renderera (fmt, clippy -D warnings, test g5, all-targets) z kodami wyjścia oraz mutacje (a), (b′), (c) z wynikiem FAIL. Wcześniej decyzja orkiestratora o zarzutach 2–3 (rekomendacja: przyjąć wersję pinu).
