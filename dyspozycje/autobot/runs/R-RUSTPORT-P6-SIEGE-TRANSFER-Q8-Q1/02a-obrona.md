# Obrona Operatora r1 — R-RUSTPORT-P6-SIEGE-TRANSFER-Q8-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q8-Q1
GOAL: obrona na zarzuty Evaluatora r1 (ec6aa4dc7); odpowiedź na każdy zarzut: PRZYJMUJĘ albo ODRZUCAM z dowodem.
ZMIANY/COMMIT: zmiana w tej rundzie: `rust-port/engine/tests/p6_siege_wonder_watch_gen.mjs` (generator przełączony z `node:module.stripTypeScriptTypes` na esbuild `transformSync`, wersja 0.25.0 spoza repo, jak w `p6_aipeace_balans_gen.mjs`). Kod Rust i wektory bez zmian. Commit: patrz sekcja SHA niżej. Baza kodu bez zmian: 39eab30bc (rodzic: fd8e8766e).
TESTY: regeneracja wektorów po zmianie generatora: `node gen-final.mjs wonder-transfer.ts <esbuild-0.25.0>` daje plik BYTE-IDENTYCZNY z commitowanym `vectors.json` (cmp, EXIT 0). Wcześniejsza regeneracja przez `stripTypeScriptTypes` też BYTE-IDENTYCZNA (cmp). Bramki Rust nie były uruchamiane ponownie w tej rundzie: zmiana dotyczy wyłącznie pliku `.mjs` poza crate'em; bramki z r1 (fmt/clippy/test) pozostają wynikiem r1.
BLOKADY: (a) rozstrzygnięcie bazy należy do orkiestratora (integracja zakazana Operatorowi, patrz zarzut 1); (b) dług testowy z zarzutu 3 (liczby niecałkowite, NaN, ID poza i32, duplikaty wonderId w grupie chain) pozostaje otwarty jako uwaga do klocka 2, nie jako wada tej rundy.
RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: orkiestrator rozstrzyga bazę (fd8e8766e vs ceb688b0d) i wskazuje, czy dług testowy z zarzutu 3 ma wejść do klocka 2; Evaluator r2 weryfikuje SHA niżej.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — baza (fd8e8766e vs origin/rust-port/parity-v2): PRZYJMUJĘ jako fakt, bez zmiany bazy

Dowody (`git merge-base --is-ancestor`, `git log`):
- `fd8e8766e` NIE jest przodkiem `origin/rust-port/parity-v2` (ceb688b0d). Merge-base: `fc45c4797`.
- `fd8e8766e..origin/rust-port/parity-v2`: 49 commitów; `origin/rust-port/parity-v2..fd8e8766e`: 3 commity.
- Pliki allowlisty zmienione między `fd8e8766e` a `parity-v2`: `domain/mod.rs` i `domain/siege_transfer.rs` (diff: 2 pliki, +11/−19). Rebase na `parity-v2` może więc wymagać rozwiązania konfliktów w tych plikach.
- Operator wybrał `fd8e8766e` zgodnie z dispatchem (który wskazuje tę bazę wprost). Zadanie wskazywało `parity-v2`. Te dwa wymogi są sprzeczne i nie da się ich spełnić jednocześnie bez rebase.
- Rebase/merge NIE wykonano: integracja i zmiana bazy należą do orkiestratora, a rebase wymagałby ponownych bramek (NIE_ZMIERZONO na `parity-v2`).

### Zarzut 2 — generator używa stripTypeScriptTypes zamiast esbuild: PRZYJMUJĘ, naprawione w tej rundzie

Dowody:
- Konwencja repo: `p6_aipeace_balans_gen.mjs` i `p6_8h2_vectors/gen-vectors.sh` używają esbuild. Dispatch też wskazuje esbuild.
- Naprawa: generator w commicie używa `createRequire(...)('esbuild').transformSync`, a esbuild 0.25.0 jest instalowany poza repo. Użycie: `node tests/p6_siege_wonder_watch_gen.mjs <wonder-transfer.ts@pin> <katalog z esbuild>`.
- Regeneracja przez esbuild daje plik BYTE-IDENTYCZNY z commitowanym `vectors.json` (cmp, EXIT 0). Regeneracja przez `stripTypeScriptTypes` też była identyczna, więc wektory nie zmieniły się; zmienił się wyłącznie generator.
- Efekt uboczny: znika ExperimentalWarning z node.

### Zarzut 3 — brak wektorów dla liczb niecałkowitych, NaN, dużych ID i duplikatów wonderId w chain: PRZYJMUJĘ jako dług testowy, bez zmiany w tej rundzie

Sprawdzone w commitowanym `vectors.json`:
- `chain`: 80 przypadków, duplikatów `wonderId` w grupie chain: 0. Zarzut jest trafny dla tej grupy.
- Duplikaty `wonderId` występują w grupach `plan` i `apply` (generator je celowo produkuje, patrz komentarz w gen).
- Brak NaN, Infinity, liczb niecałkowitych i liczb >= 2^31 w JSON (sprawdzone regexem na całym pliku).
- Ocena ryzyka: `ownerId` w TS to `number`, a sentinele to -1 i -99. Rust używa `i32`. Dla wartości całkowitych w zakresie i32 port jest zgodny. Rozszerzenie wektorów o te przypadki jest uczciwą pracą na kolejny klocek, nie wadą tego klocka. Nie zmieniałem wektorów, bo wymagałoby to ponownego przejścia bramek bez wyraźnej potrzeby kryterium.

### Zarzut 4 — dowód braku wrappera jest tylko grepem: ODRZUCAM jako wadę, przyjmuję jako uwagę

- Lista Missing jest pilnowana asercją, nie samym grepem: `tests/p6_siege_transfer.rs` ok. linia 440 zawiera `assert_eq!(missing, vec!["beginWonderTransferWatch", "settleWonderTransfer",])` (odczyt w tym commicie).
- Wrapper nie jest w `rust-port/engine/src` jako funkcja. Wystąpienia to komentarze i wpisy Missing, co zgadza się z zarzutem.
- Brak wrappera jest zamierzony i udokumentowany w `domain/siege_wonder_watch.rs` (nagłówek: wrapper z main.ts czyta stan gry i wywołuje efekty UI).

### Zarzuty „odtworzone bramki” i „allowlista zgodna” — brak sprzeciwu

Evaluator potwierdził wynik r1. Nie zmieniam ich. Zmiana w tej rundzie dotyczy tylko `rust-port/engine/tests/p6_siege_wonder_watch_gen.mjs` (w allowliście: `tests/p6_siege_wonder_watch*`).

## SHA
- Kod operatora r1: `39eab30bc`
- Obrona r1 (generator esbuild + ten plik): patrz ostatni commit na detached HEAD worktree; SHA podany w raporcie orkiestratora.
