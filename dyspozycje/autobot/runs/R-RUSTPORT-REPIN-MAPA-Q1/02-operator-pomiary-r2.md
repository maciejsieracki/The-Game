STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-MAPA-Q1
GOAL: REPIN krok 4d: odswiezenie portu mapgen do pinu weba `91dc998a` (8 hunkow gen-helpers poza 3186–4374) oraz regeneracja wektorow M04/M05A/M05B/M16 z weba 91dc998a z 0 rozbieznosci.
ZMIANY/COMMIT: baza `52fb5b4e` (detached). Zmiana: `dyspozycje/rust-port/p6/P6-REPIN-MAPA.md` (sekcja 5a, korekta 11613 → 11551), ten raport, logi `gate-fmt-r2.log`, `gate-clippy-r2.log`, `gate-test-r2.log`. Kod Rust: 0 zmian. Wektory w repo: bez zmian (pin edb8fb56). SHA: patrz nastepny commit tej rundy.
TESTY:
- Niezalezna weryfikacja H1–H8: eksport `91dc998a:gra/src/map/gen-helpers.ts`; 8 hunkow = `queue.shift()` → `queue[queueHead++]`; `queue` czytana tylko w warunku petli i przez indeks glowy. Rownowaznosc FIFO z kodu.
- Szkielety `rivers_a/d/e1/e2.rs`: po 3 linie, zero kodu (potwierdzone).
- Dane wektorow (skrypt porownania lisci JSON, pominiete `meta`): M04 stored=gen@edb8 0; M04 gen@edb8 vs gen@91dc 0 danych (3 liscie meta); M05A 0/0; M05B 0/0; M16 gallery 0/0; M16 qualifier 0 vs 11551 rozbieznosci (kosztPraca); M16 rules 0 vs 40 lisci (work_cost_scale/era; operator podal 62, metoda NIE_ZMIERZONO).
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test --no-fail-fast`: EXIT=0, 1265 passed / 0 failed (baseline 1265/0).
- Mutacje: nieprowadzone na Rust (brak portu H1–H8); dowod rownowaznosci z kodu.
BLOKADY: M16 0-rozbieznosci NIEOSIAGNIETE. Przyczyna poza allowlista: `gra/src/game/terrain-improvements.ts` (`terrainImprovementConstructionEraMultiplier`, linie 90–99) i `gra/data/units.json` (Rydwan, linie 523–576). Port w `rust-port/engine/src/domain/improvements.rs` oraz kopii danych. Nie ruszano (ZAŁOŻENIE: runda 3 rozszerza allowliste).
RUNDY: 2/5 (ostatni werdykt: FAIL runda 1; w tej rundzie: FAIL, cel REPIN-MAPA nieosiagniety).
NASTEPNY KROK: runda 3 (ten sam ID): port zmian terrain-improvements/units do improvements.rs i kopii danych (rozszerzenie allowlisty), potem regeneracja M16 z 91dc998a z 0 rozbieznosci; Evaluator i Final Control po zmianie.
DEPLOY/PUSH: NIE WYKONANO
