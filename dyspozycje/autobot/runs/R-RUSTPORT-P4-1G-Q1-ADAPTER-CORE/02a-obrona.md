# 02a — Obrona Operatora, R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE (runda 1)

STATUS: PASS
DOMAIN: GAME (grafika / DTO renderera)
TEMAT: R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE
GOAL: rdzeń adaptera DTO → wejścia renderera (konwersje §2, FogSets, wspólne `to_int32`)
BAZA: `be49ff3c3` (origin/rust-port/parity-v2), kod Operatora `aa66e8384`, raport `9cdb62ba7`
ZMIANY/COMMIT: `rust-port/renderer/src/view/fog.rs` (usunięty `Default` z `FogSets` + doc-komentarz),
ten raport; commit na lokalnej gałęzi `op/R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE-obrona` (rodzic `9cdb62ba7`)
TESTY (rust-port/renderer, CARGO_TARGET_DIR poza repo, usunięty po bramkach):
- `cargo fmt --check` EXIT 0
- `cargo clippy --all-targets -- -D warnings` EXIT 0
- `cargo test --all-targets --no-fail-fast` EXIT 0 — 64 zestawy, 502 passed, 0 failed, 0 ignored
  (te same liczby co u Operatora i Evaluatora; usunięcie `Default` nie zmienia żadnego testu, bo nikt go nie wołał)
BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. **Funkcje `view::*` i `FogSets` nie mają jeszcze wołającego w produkcji.** ODRZUCAM jako wadę Q1,
   ale przyjmuję jako uwagę do przekazania dalej. Dispatch Q1 (§ZAKRES 1–5) obejmuje rdzeń konwersji
   i testy. Nie obejmuje wpięcia w sceny: na allowliście nie ma plików scen, a `view.rs` jawnie wskazuje
   Q2–Q6. Evaluator sam pisze, że zarzut nie blokuje. `to_int32` ma realnego wołającego w `earcut::z_order`
   (kryterium końca 2). Q2 musi wpiąć adapter. To przypomnienie dla orkiestratora do dispatchu Q2.

2. **`FogSets` ma `#[derive(Default)]`, który nie odpowiada żadnemu stanowi pinu.** PRZYJMUJĘ.
   Usunąłem `Default` z `rust-port/renderer/src/view/fog.rs`. Doc-komentarz struktury mówi teraz, że
   pusta wartość (`fog_on=false`, puste zbiory) nie istnieje w pinie, bo „bez mgły” w pinie to `ALL_KEYS`
   z `fogOn=false` (`main.ts:13506-13513`). Jedynym konstruktorem jest więc `FogSets::from_dto(…, false)`.
   Dowód: nikt nie wołał `FogSets::default()` (`grep` po `src/` i `tests/` nic nie znajduje). Po zmianie
   fmt, clippy i test dają EXIT 0, 502/502. Każda próba użycia `FogSets::default()` przestaje się
   kompilować, więc pomyłka z zarzutu jest niemożliwa.

3. **`fog_on` pochodzi z `fog_active`, a pin liczy `useFogRender = fogOn || revealAllLand`; DTO nie niesie
   `revealAllLand` ani `riverRevealKeys` (L1/L2).** ODRZUCAM w zakresie Q1. Rozszerzenie DTO o te pola
   wymaga zmian w `rust-port/view-model`, a tego nie ma na allowliście Q1. Luka jest jawnie opisana w
   nagłówku `fog.rs` (linie 16–18) i w `01-operator-r1.md`. Zgadzam się, że trzeba ją zamknąć, zanim
   adapter mgły trafi do produkcji. Zalecenie dla orkiestratora: zamknięcie L1/L2 jako warunek wejścia
   tematu, który wpina `FogSets` w sceny.

4. **Test `unknown_enum_values_are_errors` sprawdza serde w `civ-view-model`, nie adapter.**
   ODRZUCAM jako wadę, bo Evaluator sam stwierdza, że wymóg jest spełniony. Adapter ma wyczerpujący
   `match` bez wildcard, więc nowy wariant DTO bez odpowiednika nie skompiluje się. Nieznana wartość
   z JSON daje błąd parsowania już na granicy DTO, czyli nigdy nie dostaje domyślnego wariantu.

5. **`serde_json` w dev-dependencies.** ODRZUCAM jako wadę, bo Evaluator to potwierdza. `Cargo.toml`
   jest na allowliście, zależność jest tylko testowa, a wersja i feature są takie jak w `civ-view-model`.

6. **NIE_ZMIERZONO: zakres realnych id graczy.** ODRZUCAM jako wadę, to uwaga informacyjna.
   Zgodnie z dispatchem przepełnienie `OwnerRef` daje błąd, nie saturację ani obcięcie. Mutacja M3
   to potwierdza. Pomiar zakresu id pozostaje NIE_ZMIERZONO i przechodzi do rozpoznania §8 pkt 1.

Ostatni element listy zarzutów to wynik odtworzenia przez Evaluatora (fmt/clippy/test EXIT 0,
mutacje M1–M5 dają FAIL), a nie zarzut. Nie wymaga odpowiedzi.

Allowlista: zmieniony tylko `rust-port/renderer/src/view/fog.rs` (pozycja `src/view/**`) i ten raport.
`Cargo.lock` zmieniony lokalnie, niezacommitowany.
