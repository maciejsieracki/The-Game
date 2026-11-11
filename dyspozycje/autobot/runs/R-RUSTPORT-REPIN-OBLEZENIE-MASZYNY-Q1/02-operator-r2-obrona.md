STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1
GOAL: Obrona rundy 1 (baza c2805c97d): odpowiedź na 5 zarzutów Evaluatora.
RUNDA: 2/5 (obrona)

ODPOWIEDZI NA ZARZUTY
1. Kolejność trim / `-` — PRZYJMUJĘ. Web origin/main gra/src/game/siege-engine-build.ts:78 sprawdza `unit.Tech !== '-'` i `!== '—'` na surowej wartości, a unlockedTechs na wartości po trimie. Dla Tech ' - ' web daje technology_locked, Rust w c2805c97d nie. Poprawka: rust-port/engine/src/domain/siege_engine_build.rs (warunek `tech_locked`). Dowód: nowe wektory tech_dash_with_spaces_locked (' - ') i tech_em_dash_with_spaces_locked (' — '), obie technology_locked, wygenerowane z weba.
2. Syntetyczne jednostki — PRZYJMUJĘ. Dodano 16 wektorów z realnych wpisów gra/data/units.json Typ 'Siege': Taran (Kamień, Drewno 19), Taran okuty (Brąz, Brąz 38), Katapulta (Żelazo, Żelazo 38), Wieża oblężnicza (Brąz, Brąz 38). Dla każdej: allowed, tech_state, stock_empty, quota_20. Koszt epokowy z weba: Brąz x2 (braz 76), Żelazo x4 (zelazo 152). Nie pokrywa epok Klasycznej/Średniowiecznej (nieobecnych w danych).
3. Liczba 35 vs 34 — PRZYJMUJĘ jako korektę. Raport rundy 1 błędnie podawał 35. Stan po poprawce: 52 przypadki (policzone z JSON).
4. Z-SEM-5 (brak siege-engine-params.json) — PRZYJMUJĘ jako dług, allowlisty NIE zmieniam. Zapisane jako D-OBL-MACH-1 w dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-MASZYNY.md. DECYZJA ORKIESTRATORA: rozszerzyć allowlistę o tests/data_loader.rs i tests/data_compliance.rs albo zaakceptować stałą Rust.
5. Kolejka siegeMachines.ts — PRZYJMUJĘ jako dług D-OBL-MACH-2 (osobny temat). Allowlista dopuszcza moduł tylko warunkowo, warunek nie był spełniony.

ZMIANY-COMMIT: poprawka rundy 2 (commit po obronie): siege_engine_build.rs (tech_locked, rustfmt), tests/p6_repin_oblezenie_maszyny_web_vectors.json (regeneracja, 52 przypadki), dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-MASZYNY.md (długi D-OBL-MACH-1..4, pokrycie powodów), vectors-gen/gen.ts i vectors.json, ten plik. Poza allowlistą: brak. Cargo.lock nie commitowany.
Generator: Node 22.22.0, esbuild 0.24.2 (bundle), źródło `git archive origin/main gra/src gra/data`.

TESTY (runda 2):
- cargo fmt --check: OK (po rustfmt na siege_engine_build.rs).
- cargo clippy --all-targets -- -D warnings: OK, rc 0.
- cargo test --lib: 22 passed, 0 failed, 0 ignored.
- cargo test --test p6_repin_oblezenie_maszyny_web_parity: 4 passed, 0 failed, 0 ignored.
- data_loader, data_compliance: NIE_ZMIERZONO w tej rundzie (nie dotknięte).
- Że nowy wektor ' - ' padałby na kodzie rundy 1: wnioskowanie z kodu web i Rust, NIE uruchomione.

BLOKADY: brak blokad procesowych. Decyzja orkiestratora wymagana tylko w D-OBL-MACH-1 (allowlista).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje poprawkę tech_locked i wektory realnych jednostek; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
