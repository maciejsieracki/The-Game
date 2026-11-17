# 02a-obrona-r3 — R-RUSTPORT-P4-1-G5-NORM-OPUS (obrona Operatora, runda 3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-G5-NORM-OPUS
GOAL: normalizacja kluczy ulepszeń (`LEGACY_KEY_ALIASES`) i fallback do `hex.ulepszenie` w `renderer/src/improvements/sync/build.rs`, zgodnie z pinem `07d2fbd72` (DODATEK r2: D1, D2).
ZMIANY/COMMIT: tylko ten raport. Baza obrony to `93e737f47` (raport Evaluatora r3), a jej rodzic to `074b25afb` (Operator r3). Kod gry jest bez zmian. Gałąź lokalna `rust-port-wip/p4-1-g5-norm-opus-obrona-r3`, bez push.
TESTY: nie uruchamiałem cargo, bo żaden zarzut nie wymaga zmiany kodu. Bramki z kodami wyjścia pochodzą z `03-operator-r3.md` i zostały niezależnie powtórzone w `02-evaluator-r3.md`: fmt 0, clippy 0, g5 11/11, all-targets 588/0/0, gen `--check` 0.
BLOKADY: brak.
RUNDY: 3/5.
NASTĘPNY KROK: Final Control r3.
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

### 0. Podsumowanie pomiarów Evaluatora: PRZYJMUJĘ (bez zmian)
Pomiary Evaluatora pokrywają się z raportem Operatora r3: te same kody wyjścia, 588/0/0, 11/11 i mutacje a/b′/c dające FAIL. Jedyna różnica dotyczy mutacji (c). Operator zmierzył FAIL 3/11, a Evaluator 4/11. Oba wyniki to FAIL z EXIT 101, a liczba zależy od tego, jak dokładnie odwrócono fallback, więc kryterium dispatchu jest spełnione w obu wariantach. Evaluator dołożył mutacje (d) i (f), które również dały FAIL.

### 1. Druga kopia tabeli normalizacji (engine `improvements.rs:696` i renderer `build.rs`): ODRZUCAM jako błąd rundy, PRZYJMUJĘ jako dług
Dowody:
- `rust-port/renderer/Cargo.toml:53-57`: renderer zależy wyłącznie od `civ-view-model` (B-DEP, D-DTO-1 = A), a `rust-port/view-model/Cargo.toml` w `[dependencies]` ma tylko `serde`. Renderer nie może więc wywołać `civ_engine::domain::improvements::normalize_improvement_key` bez zmiany architektury zależności. Dispatch zakazuje zmian w `engine/**` i `view-model/**`.
- DECYZJA dispatchu (sekcja „DECYZJA”) przy braku producenta DTO kieruje normalizację do KONSUMENTA `sync/build.rs`. Wymóg „jedno źródło” odnosi się do tabeli aliasów wewnątrz renderera i jest spełniony: `build.rs:76` zawiera jedną stałą `LEGACY_KEY_ALIASES`, z której korzysta `legacy_alias` (`build.rs:135-145`).
- Dryf względem pinu wykrywają testy `legacy_key_aliases_match_pin_table`, `improvement_table_keys_match_pin_json` i `prototype_keys_match_node` (`tests/improvements_sync_g5.rs:83-117`). Porównują one wektory wygenerowane z tekstu pinu.
- Dług do REJESTR-RUST (zapisuje orkiestrator): docelowo producent DTO wylicza pole warstw (`layers`) w engine i wtedy kopia w rendererze znika. Ten kierunek jest już opisany jako propozycja w `renderer/src/improvements/sync/mod.rs:46-49`.

### 2. Mutacja (e) przeżywa, bo jest równoważna: PRZYJMUJĘ ocenę (bez zmian)
Po usunięciu `|| raw == "brak"` klucz `'brak'` przechodzi przez `legacy_alias` bez zmiany, bo nie jest kluczem aliasu. Następnie `improvement_row_truthy("brak")` zwraca false, ponieważ `'brak'` nie występuje ani w `IMPROVEMENT_TABLE_KEYS`, ani w `JS_OBJECT_PROTOTYPE_KEYS`. W efekcie funkcja zwraca `None`, czyli ten sam wynik. Mutacja nie zmienia zachowania i nie da się jej wykryć testem. Tak samo potraktowano mutację (b) w DODATKU r2. Gałąź zostaje, bo odwzorowuje pin `terrain-improvements.ts:118` 1:1 i chroni przed przyszłym wierszem `brak` w tabeli.

### 3. Warstwy postawione pochodzą z `HexDynDto.ulepszenia`, a nie z `placedImprovements`: ODRZUCAM jako błąd rundy, PRZYJMUJĘ jako uwagę do kontraktu DTO
DTO nie ma pola `placedImprovements`. W `view-model/src/map.rs:143-146` są tylko `ulepszenia` i `improvement_key`, a dodanie nowego pola wykracza poza allowlistę, bo `view-model/**` jest zakazane. Pin utrzymuje oba źródła w zgodzie (`main.ts:16275-16289`, `:17104-17119`). Założenie i jego konsekwencja są opisane w komentarzu `build.rs:211-219`. Przypadek niespójnego zapisu (heks z `ulepszenia` bez wpisu w `placed`) staje się osiągalny dopiero wtedy, gdy DTO rozdzieli te dwa źródła. Zgłaszam to do kontraktu DTO, czyli do tego samego tematu producenta, który opisuje punkt 1.

### 4. Komentarz `renderer/src/improvements/sync/mod.rs:39-46` jest nieaktualny: PRZYJMUJĘ jako dług (bez zmian w tej rundzie)
Treść komentarza (G5 „not done”, heks z samym `ulepszenie` nie dostaje siatki) po tej zmianie jest nieprawdziwa. Plik leży jednak poza allowlistą, a DODATEK r2 i r3 wprost każe go nie zmieniać i odnotować jako dług. Proponuję osobny temat dokumentacyjny Haiku z allowlistą `mod.rs`. Wiersz G5 należy przepisać na „done in `build.rs`: `improvement_keys_for_hex`, `merged_improvement_layers`” i usunąć zdanie o braku siatki.

### 5. Myląca nazwa wektora `brak_and_empty_skipped`: PRZYJMUJĘ jako kosmetykę (bez zmian)
Nazwa jest zachowana celowo, bo odwołują się do niej DODATEK r2 (mutacja b′) i raporty r2/r3. Znaczenie wyjaśnia komentarz generatora `tests/improvements_sync_g5_gen.mjs:144-146`: „skipped” dotyczy tylko `improvementKeysForHex`, a w merged zostaje `[farma, droga, '', brak]`. Zmiana nazwy zerwałaby te odwołania i wymagałaby regeneracji `vectors.json` bez żadnej zmiany zachowania.

## Podsumowanie
Żaden zarzut nie wskazuje błędu kodu tej rundy. Punkty 1, 3 i 4 to długi poza allowlistą, które orkiestrator wpisuje do REJESTR-RUST. Punkty 2 i 5 nie wymagają działań.
