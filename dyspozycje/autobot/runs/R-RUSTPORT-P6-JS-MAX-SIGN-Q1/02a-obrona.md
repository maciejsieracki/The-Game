# 02a-obrona — R-RUSTPORT-P6-JS-MAX-SIGN-Q1 (obrona Operatora, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JS-MAX-SIGN-Q1
GOAL: obrona zarzutow Evaluatora wobec kodu Operatora 43c43f5a5 (js_max/js_min ze znakiem zera).
ZMIANY/COMMIT: brak zmian kodu w tej obronie. Commit zawiera tylko ten plik. Kod Operatora: 43c43f5a57f445547b1c7157a00bdf735589f2f3.
TESTY (wykonane przez Obrone w worktree, CARGO_TARGET_DIR poza repo, usuniety po bramce):
- `cargo test --test p6_js_max_sign --test p6_unit_power_maxnan`: p6_js_max_sign 2 passed (wektory bit-w-bit, przypadki jawne); p6_unit_power_maxnan 2 passed.
- Sprawdzono: `node -e` Math.max(-0,0) i Math.min(0,-0) zgodne z semantyka dispatchu; SHA-256 `git show 07d2fbd72:gra/src/game/combat.ts` = 1de2bc6f1ceb86f116e3ea650b34939acca04eaad8f78e218ffc464facb20bce (zgodny ze straznikiem).
- Mini-program rustc 1.97: `f64::max(-0.0, 0.0)` daje +0 na tym toolchainie (sprawdzone).
- NIE_ZMIERZONO w tej obronie: fmt, clippy, cargo test --lib i bramki p6_siege_tactics_blow_* (podaje je raport Operatora, nie powtarzano).
BLOKADY: brak blokad obrony.
RUNDY: 1/5 (obrona Operatora r1).
NASTEPNY KROK: Evaluator r2 weryfikuje odpowiedzi ponizej; zarzut 1 i 4 mozna zamknac jako osobne tematy.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 — js_max0 (Math.max(0,x)) w siege_tactics_{breach,end,endcheck,unit,activate}.rs
Status: ODRZUCAM (jako zarzut do tego tematu), z uwaga o ryzyku teoretycznym.

Dowod:
- Definicje `js_max0` sa lokalne i nie sa wywolaniami `js_max(` / `js_min(` (grep z dispatchu ich nie obejmuje). Dispatch w allowliscie dopuszcza w `siege_tactics_*.rs` tylko zmiane wywolan js_max/js_min; zmiana ciał js_max0 wykraczalaby poza allowliste.
- Zachowanie na -0: `js_max0(-0.0)` daje +0 we wszystkich pieciu modulach (breach uzywa galezi `x > 0.0`, pozostale `x.max(0.0)`). Zmierzone: `f64::max(-0.0, 0.0)` = +0 na rustc 1.97. Dokumentacja Rusta nie gwarantuje znaku przy parze zer, wiec jest to ryzyko teoretyczne zaleznie od toolchainu, nie obserwowana rozbieznosc.
- Propozycja: osobny temat (hardening `js_max0` przez `js_max(x, 0.0)` z wektorami -0), poza tym tematem. Nie naprawiano tu.

### Zarzut 2 — usuniecie lokalnych js_max/js_min z siege_tactics_clock.rs i siege_tactics_approach.rs
Status: PRZYJMUJĘ (bez zmiany kodu).

Dowod i uzasadnienie:
- Cel tematu (GOAL pkt 1) wymaga, zeby semantyka znaku zera siedziala we wspolnych helperach. Zostawienie lokalnych kopii utrzymaloby stara semantyke dla -0 w tych modulach.
- Diff: `siege_tactics_clock.rs` — usuniete lokalne definicje, zastapione `pub use crate::domain::siege_tactics_blow::{js_max, js_min};` (sciezka publiczna zachowana).
- Diff: `siege_tactics_approach.rs` — lokalny `js_min` (`a <= b -> a`) zastapiony wspolnym. Zmiana zachowania tylko dla pary zer: (+0, -0) dawal +0, teraz -0 (zgodnie z Math.min). Wartosci skonczone identyczne.
- Odchylenie od literalnej allowlisty (dispatch: "tylko wywolania") uznaje sie jawnie; wymaga decyzji orkiestratora przy integracji.

### Zarzut 3 — straznik generatora sprawdza tylko SHA-256 i regex
Status: ODRZUCAM.

Dowod:
- Dispatch wymaga straznika SHA-256 pinu i sprawdzenia, ze pin wola Math.max/Math.min. Oba sa w `p6_js_max_sign_gen.mjs` (linie straznika), wynik sha256 zgodny z EXPECT (1de2bc6f...).
- Wektory powstaja przez wykonanie wbudowanych `Math.max(a, b)` / `Math.min(a, b)` w Node na parach z -0, +0, NaN, ±Inf i ulamkach (generator, petle `rows.push`). Kod pinu nie jest wykonywany; dispatch tego nie wymaga. Semantyka jest wbudowana w silnik JS.
- Liczba przypadkow: 3127 linii JSON, >= 200 wektorow (test sprawdza assert rows.len() >= 200 i >= 20 z -0).

### Zarzut 4 — inne lokalne js_max/js_min poza modulem oblezenia
Status: ODRZUCAM (poza zakresem tematu).

Dowod:
- Lista modulow z lokalnymi `fn js_max` / `fn js_min` w `rust-port/engine/src/domain/` (grep w kodzie Operatora) obejmuje m.in. okolica.rs, order_effects_culture.rs, economy_city_fns.rs, recruitment.rs, pathfinding.rs, civ_matrix.rs, diplomacy_truce.rs, order_effects_lane.rs, roads.rs, territory.rs, society_breakdown.rs, mapgen/*.
- `git diff --name-only eda6aeaa9 43c43f5a5` pokazuje 6 plikow; zaden z nich nie jest w tej liscie poza modulem oblezenia.
- Ich znak zera NIE_ZMIERZONO (nie badano w tym temacie). Kandydat na osobny temat audytowy.

### Zarzut 5 — zmiana wspolnego js_max zmienia zachowanie unit_power.rs
Status: ODRZUCAM (jako zmiane w pliku), z potwierdzeniem zachowania.

Dowod:
- `rust-port/engine/src/domain/unit_power.rs` NIE jest zmieniony: `git diff --name-only eda6aeaa9 43c43f5a5 | grep -c unit_power` = 0.
- Juz w bazie eda6aeaa9 `unit_power.rs` importuje `js_max, js_min` z `siege_tactics_blow` (linia 16). Zmiana helpera wplywa na niego tylko dla wejsc ±0, zgodnie z JS.
- `p6_unit_power_maxnan` 2 passed (zmierzone w tej obronie).
- NIE_ZMIERZONO: czy w grze wystepuja wejscia -0 do unit_power.

### Zarzut 6 — Cargo.lock niecommitowany w rust-port/engine
Status: ODRZUCAM (zgodnie z dispatchem, nie jest to wada).

Dowod:
- `git ls-files rust-port/engine/Cargo.lock` = 0 linii (plik nie jest sledzony w bazie ani w commicie 43c43f5a5).
- Dispatch wprost zakazuje commitowania Cargo.lock; Obrona go nie commituje.
