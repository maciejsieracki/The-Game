STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K2-Q1
GOAL: Obrona Operatora (runda 1) na zarzuty Evaluatora (02-evaluator.md, commit 54aa14e60): dla każdego zarzutu PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: 9fbb677fc (poprawki zarzutów 2 i 4; kod K2 bez zmian, SHA kodu 05093c1d5). Gałąź detached, nie pushowana. Allowlista: `rust-port/engine/tests/p6_siege_city_fortification_gen.mjs`, `.../p6_siege_city_fortification_vectors/vectors.json` (tylko linia `generator`), `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`, katalog runu. Cargo.lock nie commitowany.
SHA: 9fbb677fc (fix) na bazie f64211229 (Operator r1, kod 05093c1d5 jest przodkiem: `git merge-base --is-ancestor 05093c1d5 f64211229` = TAK).

## Odpowiedzi na zarzuty

### Zarzut 1 — baza i konflikt w mod.rs: PRZYJMUJĘ jako blokadę integracji (bez poprawki w gałęzi)
Dowody:
- `git merge-base --is-ancestor 0bd7fcc99 origin/rust-port/parity-v2` = NIE (tip parity-v2 = b9800e0a7).
- `git merge-tree --write-tree origin/rust-port/parity-v2 f64211229` = `CONFLICT (content): Merge conflict in rust-port/engine/src/domain/mod.rs` (obie strony dopisują rejestrację modułu).
- `git merge-base --is-ancestor 05093c1d5 f64211229` = TAK.
Nie rozwiązuję konfliktu w tej gałęzi: dispatch wskazuje bazę 0bd7fcc99 (FC K0b), a Operator nie integruje i nie zmienia bazy. Wybór bazy (0bd7fcc99 czy parity-v2) i rozwiązanie konfliktu w `mod.rs` należą do orkiestratora przy integracji, z ponownymi bramkami na wyniku.

### Zarzut 2 — generator kopiuje funkcje, straznik SHA obejmuje tylko zakresy linii: PRZYJMUJĘ, poprawka w 9fbb677fc
Zmiana: oczekiwane wartości (`expect`) pochodzą teraz z WYKONANIA pinu. Wycięte zakresy 29-36, 61-70, 76-79, 96-98 są zdejmowane z typów przez `module.stripTypeScriptTypes` (Node v22.23.4), `export` usuwany i wykonywane przez `new Function`. Lokalne kopie zostały tylko jako etykiety galęzi (pokrycie). Funkcja `checked()` przerywa generowanie przy jakiejkolwiek rozbieżności kopia-vs-pin.
Dowody:
- `node rust-port/engine/tests/p6_siege_city_fortification_gen.mjs` EXIT 0; liczności: kind 214, melee 324, entry 206 (jak poprzednio).
- `vectors.json` vs. wersja sprzed zmiany (sha256 pliku poprzedniego: 9456cc7f...): różnica tylko w linii `generator` (`diff` po odfiltrowaniu tej linii = pusty).
- `PRINT_DIGEST=1`: digest fragmentów = 6a22a8e2f3eb56a65bbe7f357219bd490b9935b38eacbfbe8db8e1c29a2dec4b (zgodny z FRAGMENT_SHA256).
- `CARGO_TARGET_DIR` poza repo: `cargo test --test p6_siege_city_fortification` = 5/5 OK.
NIE_ZMIERZONO: negatywny test straznika (celowo zmieniona kopia/pin, oczekiwany błąd `dryf kopii`) nie został wykonany w tej rundzie. Mechanizm jest w kodzie, ale nie widziałem go zadziałać.
Uwaga: `stripTypeScriptTypes` jest API eksperymentalnym Node (ExperimentalWarning na stderr); wynik dla obecnego pinu jest zweryfikowany, ale zależy od wersji Node.

### Zarzut 3 — undefined vs false dla wallBreached i onWallWalkway: ODRZUCAM (dowód)
Pin używa wyłącznie ścisłego porównania: `city-fortification.ts:33` `ctx.wallBreached === true`, `:53` `onWallWalkway === true`. Typy TS to `boolean | undefined`, więc inne wartości nie występują. Wektory z wykonania pinu potwierdzają równoważność: dla każdej kombinacji flag `wb-absent` i `wb-false` dają ten sam `expect` (np. `e-blocked:wb-absent` = 23, `e-blocked:wb-false` = 26, oba `true`; `a-breached` występuje tylko dla `wb-true`), a `onWallWalkway` `undefined` (`null` w JSON) daje `false` jak `false`. Mapowanie `Option`/`bool` po stronie Rust jest więc zgodne z webem.

### Zarzut 4 — stale teksty w planie (wiersze 22-24): PRZYJMUJĘ, poprawka w 9fbb677fc
- Wiersz 22: usunięto nieaktualne „Brak modułu `city_fortification` w Rust. Kandydat na klocek (K0a)”.
- Wiersz 23: usunięto „Kandydat K0a (najmniejszy czysty klocek)”.
- Wiersz 24: rozdzielony na PORTED (`cityFortificationKind`, bez opisów BRAK) oraz osobne wiersze BRAK 24a (`cityHasFortification`), 24b (`cityIsFortified`), 24c (`canCaptureCity`).
- Wiersz 23a: uzupełniony o wołania z `main.ts`.

### Zarzut 5 — wrapper `_meleeBlockedByWall` (battleScene.ts:8361-8372) nadal BRAK: ODRZUCAM (dowód)
Kryterium binarne (1) dispatchu brzmi: „wszystkie wskazane funkcje Ported z wektorami z pinu”. Wskazane funkcje to funkcje z `city-fortification.ts`. Wrapper `_meleeBlockedByWall` jest metodą sceny w `battleScene.ts`, nie funkcją z tego pliku, i wiersz 20 planu ma jawną zależność (canShoot wiersz 28 BRAK; isSiegeUnit wiersz 27 PARTIAL). Brak wołającego w Rust dotyczy pętli taktycznej (wiersze 29 `_siegeMoveRefused`, temat K1), nie K2. Zamknięcie wiersza 20 należy do klocka pętli, nie do K2.

## Dodatkowy pomiar (domyka blokadę 3 Operatora)
Grep na pinie 07d2fbd72 (NIE_ZMIERZONO w r1): `cityHasFortification`, `cityIsFortified`, `canCaptureCity`, `autoStormBreach` z `city-fortification.ts` są importowane i wołane z `gra/src/main.ts` (`:1046-1050` import; wołania `:34478-34480`, `:36363-36365`, `:36629-36631`, `:43329`). Nie są wołane z `battleScene.ts`, więc poza zakresem K2 wg dispatchu. Zapisane w wierszach 23a, 24a-24c planu.

## TESTY (po poprawkach, 9fbb677fc)
- `node rust-port/engine/tests/p6_siege_city_fortification_gen.mjs`: EXIT 0.
- `cargo test --test p6_siege_city_fortification`: 5 passed, 0 failed, EXIT 0.
- Pozostałe bramki (fmt, clippy, lib 48/48, p6_siege_tactics_*): NIE_ZMIERZONO w tej rundzie. Zmiany nie dotykają kodu Rust (tylko .mjs, vectors.json (linia generator), plan .md); kod K2 pozostaje z r1 (bramki EXIT 0 w 01-operator-r1.md).

## BLOKADY
1. Baza i konflikt merge w `rust-port/engine/src/domain/mod.rs` z parity-v2 (zarzut 1): do decyzji orkiestratora przy integracji.
2. Negatywny test straznika generatora: NIE_ZMIERZONO.
3. Wiersz 20 (wrapper sceny) BRAK do klocka pętli taktycznej (zarzut 5).

RUNDY: 1/5 (obrona). Ostatni werdykt Evaluatora: PASS-WITH-NOTES, zarzuty 1-5.
NASTĘPNY KROK: Evaluator (runda 2) weryfikuje 9fbb677fc (generator, vectors, plan); orkiestrator decyduje o bazie i integracji (zarzut 1).
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje i nie integruje; gałąź detached, lokalnie).
