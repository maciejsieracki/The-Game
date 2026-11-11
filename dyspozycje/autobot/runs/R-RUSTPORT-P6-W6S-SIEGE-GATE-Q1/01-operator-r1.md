STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-W6S-SIEGE-GATE-Q1 (W6 wariant A, punkt 2: bramka oblężenia w dyplomacji, runda 1/5, Operator)
GOAL: port `siegeAllowedBetween` (web, pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75) do `rust-port/engine/src/domain/diplomacy_siege_war_gate.rs` + test behawioralny na wektorach z pinu.
ZMIANY/COMMIT: baza origin/rust-port/parity-v2 = f207ea6b1.
  - NOWE `rust-port/engine/tests/p6_w6s_siege_gen.mjs`: generator; esbuild bundluje web `game/diplomacy-siege-war-gate.ts` z pinu do pliku tymczasowego poza repo i wykonuje prawdziwe `siegeAllowedBetween`.
  - NOWE `rust-port/engine/tests/p6_w6s_siege_vectors/siege.json`: 6 macierzy wrogosci kierunkowej, owners [0,1,2,3,4,9], 216 przypadkow.
  - NOWE `rust-port/engine/tests/p6_w6s_siege.rs`: 3 testy (wektory pinu; kierunkowosc wojny / pokoj; wolajacy `enemy_units_adjacent_to_city` filtrujacy przez `siege_allowed_between`).
  - `rust-port/engine/src/domain/diplomacy_siege_war_gate.rs` i `mod.rs` BEZ ZMIAN: `siege_allowed_between` juz istnial w Rust (port z R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1), zgodny z webem (oblegajacy == wlasciciel -> false, inaczej `are_enemies(oblegajacy, wlasciciel)`).
  - Cargo.lock wygenerowany przez cargo (nieśledzony), NIE commitowany.
  - Commit na galezi roboczej (SHA w sekcji DEPLOY/PUSH). Brak push.
TESTY:
  - cargo fmt --check (p6_w6s_siege.rs): EXIT 0
  - cargo clippy --test p6_w6s_siege -- -D warnings: EXIT 0
  - cargo test --test p6_w6s_siege: 3 passed, 0 failed, 0 ignored, EXIT 0
  - cargo test --lib: 28 passed, 0 failed, 0 ignored, EXIT 0
  - Uwaga: istniejacy test p6_dyplomacja_multiwar3_d (1500 wektorow z origin/main) juz pokrywal `siege_allowed_between`; nowy test dokladza wektory z pinu 07d2fbd72 i sprawdzenie wolajacego.
BLOKADY:
  - Wolajacy web `siegeBattleSideOwners` (diplomacy-siege-war-gate.ts:33; uzycie main.ts:34749) NIE ma odpowiednika w Rust (grep `side_owners|SideOwners` w rust-port/engine/src: zero trafien). Poza zakresem tej bramki; decyzja orkiestratora: osobny temat portu albo jawna zaleznosc do W8.
  - Wolajacy web w main.ts (17504, 17984, 18027, 18156, 18209, 36735): wywolania w petli tury/AI/akcjach gracza, podpiecie do W8. Brak wolajacego w Rust poza wewnetrznymi funkcjami modulu.
  - `aiAutoSiegeAllowed` / `autoSiegeCandidateForScan` sa w Rust, ale ich wolajacy w main.ts tez czekaja na W8.
  - Wektory generowane lokalnie (esbuild 0.25.0 w katalogu poza repo, node v22.23.4). Nie mierzono wydajnosci.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet): (a) zgodnosc wektorow z pinem (ponowne uruchomienie generatora z `git archive 07d2fbd72f758705f8e1d59cc4968027ffbafe75 gra/src gra/data`), (b) decyzja w sprawie `siegeBattleSideOwners` (port albo W8).
DEPLOY/PUSH: NIE WYKONANO
