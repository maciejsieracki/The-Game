STATUS: BLOCK (INFRA) — obrona r1; zarzuty merytoryczne 2, 3 i 5 odrzucone z dowodem pinu, zarzuty 1 i 4 przyjęte jako ustalenia, ale poprawki nie da się wykonać w tej rundzie
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES, normalizeImprovementKey) i fallback hex.ulepszenie w renderer sync/build.rs, 1:1 z pinem 07d2fbd72
ZMIANY/COMMIT: tylko ten plik (dyspozycje/autobot/runs/R-RUSTPORT-P4-1-G5-NORM-OPUS/02a-obrona.md); kod bez zmian: 0671e292d; oceniany HEAD 31d337258; baza f85622878
TESTY: patrz zarzut 1 (bramka renderera nieuruchomiona, BLOCK INFRA z pomiarem)
BLOKADY: INFRA — 11 GB wolnego (< 12 GB) i 2 równoległe `cargo test` innych workerów (p6_k5doc_t7a, p6_k5doc_t7b)
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: runda r2 tego samego ID: pełna bramka renderera i mutacje (a), (b′), (c), gdy będzie co najmniej 12 GB wolnego i nie będą działać inne buildy; w dodatku r2 orkiestrator rozstrzyga zarzuty 2 i 3 (wpis do REJESTR-RUST) i decyduje o rozszerzeniu allowlisty o sync/mod.rs (zarzut 4)
DEPLOY/PUSH: NIE WYKONANO

## Pomiar infrastruktury w obronie (2026-11-17)

- `df -h /`: `/dev/vda 252G 29G 11G 73% /` (dwa pomiary: 11G i 11G).
- `pgrep -a cargo`: `cargo test --test p6_k5doc_t7a` (pid 29131) i `cargo test --test p6_k5doc_t7b` (pid 29659), oba z innych tematów.
- Dispatch, sekcja BRAMKI: „wymaga ≥ 12 GB wolnego i braku równoległych buildów … Przy < 12 GB: BLOCK z liczbą GB (nie uruchamiaj na pół)”. Dlatego bramki nie uruchomiłem.

## Odpowiedzi na zarzuty

### Zarzut 1 — bramki renderera niezmierzone: PRZYJMUJĘ (stan faktyczny); poprawki nie da się wykonać w tej rundzie
Zarzut jest prawdziwy: kod 0671e292d nie był kompilowany, a mutacje nie zostały uruchomione. Warunek dispatchu nadal nie jest spełniony (pomiar wyżej: 11 GB i 2 cudze buildy), więc uruchomienie bramki byłoby jej łamaniem. Nie wystawiam PASS. Temat pozostaje w stanie BLOCK INFRA, a pierwszym krokiem r2 jest w tej kolejności: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test improvements_sync_g5`, `cargo test --all-targets --no-fail-fast`, a potem mutacje (a), (b′), (c).

### Zarzut 2 — fallback zależy od `ulepszenia`, a nie od `improvement_key`: ODRZUCAM jako wadę kodu (implementacja odpowiada pinowi)
Dowód z pinu:
- `git show 07d2fbd72:gra/src/game/terrain-improvements.ts | sed -n '358,380p'` → `improvementKeysForHex` czyta wyłącznie `hex.ulepszenia` i `hex.ulepszenie`. Fallback `normalizeImprovementKey(String(hex.ulepszenie ?? 'brak'))` (linia 377) zadziała tylko wtedy, gdy `!hex.ulepszenia?.length` (linie 365 i 371).
- `git grep -n improvementKey 07d2fbd72 -- gra/src`: pole `improvementKey` pojawia się wyłącznie w `city-hex-clear.ts:21,70,77`, gdzie jest typowane i usuwane, oraz jako pole DTO podpowiedzi w `farm-assign-hint.ts:81`. Nigdzie na ścieżce renderu warstw ulepszeń nie jest czytane.
- Testy to zabezpieczają: `improvement_key_is_not_read` (wektory `improvement_key_not_read` i `improvement_key_alias_not_read`) oraz `fallback_only_without_ulepszenia`.
Zasada 9 i 11 z CLAUDE.md mówią, że parytet z pinem ma pierwszeństwo przed opisem w dispatchu. Sformułowanie dispatchu „gdy `improvement_key` jest pusty” jest nieścisłe względem pinu. Zgadzam się, że orkiestrator powinien wpisać tę decyzję techniczną do REJESTR-RUST. To jest jednak czynność orkiestratora, a nie zmiana kodu.

### Zarzut 3 — `''` i `'brak'` zostają warstwami po stronie warstw postawionych, a mutacja (b) jest równoważna: ODRZUCAM jako wadę kodu (implementacja odpowiada pinowi)
Dowód z pinu:
- `git show 07d2fbd72:gra/src/main.ts | sed -n '3128,3137p'` → `mergedImprovementLayers` robi `keys.add(k)` dla każdego `k` z `placedImprovements.get(hexKey)` bez normalizacji i bez filtrowania.
- `main.ts:3139-3142`: `hex.ulepszenia`/`ulepszenie` są „utrzymywane w zgodzie z `placedImprovements` przez syncHexUlepszenieFields”. Dlatego w Rust warstwy postawione odczytuje się z `hex.ulepszenia`. Tak było już w bazie f85622878 i ten temat tego odwzorowania nie zmienia.
- Wektor `brak_and_empty_skipped` → `[farma, droga, '', brak]` jest wyjściem pinu wykonanego przez TypeScript (generator `--check` daje EXIT 0), a nie wartością wpisaną ręcznie. Część `improvementKeysForHex` pomija `''` i `'brak'`, co wymaga dispatch, a zwraca je dopiero dokładka `placed`, zgodnie z pinem.
- Mutacja (b) „pominięcie skipu `'brak'` w normalizeImprovementKey” jest równoważna, bo `''` i `'brak'` nie są kluczami tabeli IMPROVEMENTS ani prototypu, więc i tak trafiają do gałęzi „nieznany → None”. Pin mówi to wprost w `terrain-improvements.ts:367` („Równoważne ścieżce poniżej”). Formalnym zastępstwem jest mutacja (b′): filtrowanie `''`/`'brak'` przy dokładaniu warstw postawionych w `merged_improvement_layers` (`build.rs:230-232`). Powinna dać FAIL na `ulepszenia_brak_no_fallback`, `ulepszenia_empty_key_no_fallback` i `brak_and_empty_skipped`. Pomiar w r2.
Zgadzam się, że zamianę (b)→(b′) i „regresję względem bazy” zgodną z pinem orkiestrator musi wpisać do REJESTR-RUST (zasada 8, decyzja o równoważności mutantów).

### Zarzut 4 — nieaktualna dokumentacja `sync/mod.rs:39,46`: PRZYJMUJĘ (stan faktyczny); bez poprawki, bo plik jest poza allowlistą
`grep -n 'G5' rust-port/renderer/src/improvements/sync/mod.rs` → linie 39 i 46 nadal opisują G5 jako lukę i proponują poprawkę. Allowlista dispatchu nie obejmuje `sync/mod.rs`, a zmiana pliku poza nią oznaczałaby natychmiastowy FAIL (R-PROC-AUTOBOT §9). Proponuję, żeby dodatek r2 rozszerzył allowlistę o `rust-port/renderer/src/improvements/sync/mod.rs` (tylko komentarze `//!` w liniach 39 i 46). Wtedy poprawię to w r2 jednym commitem.

### Zarzut 5 (nieblokujący) — `IMPROVEMENT_TABLE_KEYS` i `JS_OBJECT_PROTOTYPE_KEYS` wpisane na stałe: ODRZUCAM potrzebę zmiany
- Dispatch nakazuje: „tabela stała w Rust, jedno źródło”. Odczyt `engine/data/derived/ulepszenia-reguly.json` w czasie kompilacji renderera tworzyłby zależność renderera od plików `engine/**`, których dispatch zabrania zmieniać, i zmieniałby kontrakt danych.
- Dryf jest zabezpieczony testami: `improvement_table_keys_match_pin_json` porównuje z JSON pinu, a `prototype_keys_match_node` z `Object.getOwnPropertyNames(Object.prototype)` w Node (wektory generatora). Evaluator sam potwierdził statycznie, że obie listy są zgodne.

## Podsumowanie
Kod 0671e292d pozostaje bez zmian. Zarzuty 2, 3 i 5 odrzucam z dowodem pinu. Zarzut 1 przyjmuję jako stan faktyczny: BLOCK INFRA trwa, bo jest 11 GB wolnego i działają 2 cudze buildy. Zarzut 4 przyjmuję i odsyłam do r2 z rozszerzeniem allowlisty. Do orkiestratora należą wpisy w REJESTR-RUST (fallback według `ulepszenia`, mutacja (b′) zamiast (b), `''`/`'brak'` z warstw postawionych) oraz rozszerzenie allowlisty w dodatku r2.
