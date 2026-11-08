STATUS: FAIL (runda 4/5, to samo ID; B2 nie domknięte, C nie wykonane, D zablokowane allowlistą; pomiary i ZAŁOŻENIA domknięte)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1
GOAL: jedna wersja reguł ekonomii 1:1 z webem origin/main w turn_economy; usunięte martwe duplikaty po przepięciu.
ZMIANY/COMMIT: baza 0b37cf183 (kod = 9612c0b8e). Kod Rust i wektory bez zmian (git diff -- rust-port pusty). Zmiany r4: dyspozycje/rust-port/p6/P6-REPIN-EKONOMII.md (sekcja 8), dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1/05-operator-r4.md, tools/ (generatory i probe), logs/. SHA: patrz commit r4 (podany w odpowiedzi). PUSH NIE WYKONANO.
TESTY (świeże, na 0b37cf183):
- cargo fmt --check: exit 0.
- cargo clippy --all-targets -- -D warnings: exit 0.
- 5 binarek B1 ponownie: 6 FAIL (q2a 2, q4_pipeline 1, q4_preview 1, q6_wire 1, empirefood 1) — zgodnie z r3.
- Web origin/main wykonany (probe): glina era 2 = 75 = Rust B1 → B1 zgodne z origin/main dla reguły surowców terytorium.
- Regeneracja empirefood: origin/main → FAIL pieniadz (ef-1 city23 rust=18 web=17); 8769854ff → FAIL popCap (ef-0 city3 rust=21 web=13), także pre-B1; hybryda 331ef699b+era-scaling → FAIL popCap (ef-1 city16 rust=14 web=10). Generator na własnym pinie 331ef699b NIE odtwarza pinowanego pliku (113/347 różnic).
- Pełny cargo test per binarka (300) i baseline pre-B1: NIE_ZMIERZONO (czas, dysk 2,8 GB). p6_8i_pick (>400 s): NIE_ZMIERZONO, nie zdiagnozowane.
BLOKADY:
1. B2: regeneracja nie zamyka testów. Rozbieżności w pieniądzu i popCap (web vs Rust) są poza tematem i poza allowlistą. Generator niepowtarzalny na swoim pinie.
2. C (epoka w economy_yield.rs): NIE wykonane. Luka zmierzona: economy_yield.rs:867 woła apply_improvement_bonuses bez epoki; web economy.ts:468 przekazuje tile.wlascicielEra. Zmiana zmienia wyniki dla epok 2–3 i unieważnia wektory, więc idzie razem z B2.
3. D: NIE wykonane. Trzy rodziny funkcji (R1 resource_production.rs u32, R2 improvements.rs migawka, R3 *_all_producers). Wołający R1/R2 w tests/resource_production.rs, tests/parity_suite.rs, benches/engine_modules.rs — POZA allowlistą (tylko p6_*). Potrzebna decyzja orkiestratora o rozszerzeniu allowlisty.
ZAŁOŻENIA (rozstrzygnięte w dokumencie, bez pytania):
- Z-R4-1: 1:1 dla reguły surowców terytorium (9 kluczy, ×1,5/epokę, round) zamknięte dowodem wykonanego weba. 1:1 całego weba poza tematem.
- Z-R4-2: popCap, pieniądz morski i żywność między Rust a origin/main to dług D-R4-1 (38 commitów web w zakresie 331ef699b..247f1ef2a dotykających ekonomii).
- Z-R4-3: naprawa powtarzalności generatora to dług D-R4-3, przed regeneracją wektorów.
ODPOWIEDZI NA ZARZUTY FC r3:
1 (B2/C/D nie zrobione) — PRZYJMUJĘ. Dowód: sekcja 8.2 i 8.4–8.5 w P6-REPIN-EKONOMII.md.
2 (bramki czerwone z winy B1) — CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM. Przyjmuję: stan jest czerwony i nie nadaje się do integracji. Odrzucam: B1 nie jest błędne. Glina era 2 = 75 wykonane z web origin/main; czerwień wynika z wektorów pinowanych na stary web oraz z popCap/pieniądza, które widać także pre-B1.
3 (przyczyna czerwieni to założenie) — PRZYJMUJĘ, DOMKNIĘTE dowodem: tabela web wykonanego, sekcja 8.1 (probe, log logs/probe-web-yield-r4.log).
4 (baseline niekompletny) — PRZYJMUJĘ jako NIE_ZMIERZONO; pełnego baseline nie wykonano w r4.
5 (pytanie zamiast ZAŁOŻENIA) — PRZYJMUJĘ. Pin origin/main wykonany (generator naprawiony o sygnaturę sea-bonus); wynik w 8.2. Decyzja zapisana jako Z-R4-1..3.
6 (C nierozpoczęte) — PRZYJMUJĘ. Luka zmierzona (8.4). Nie zrobione, bo zmiana wyniku produkcji bez wektorów byłaby nieuczciwa; plan w r5 razem z B2.
7 (dowód pomiarów A) — PRZYJMUJĘ. Tabela symboli i wołający git grep w 8.5 (liczby z git grep, baza 0b37cf183). Fallback 10 i null/None jak w r3.
8 (bramki niezweryfikowane) — CZĘŚCIOWO PRZYJMUJĘ. fmt i clippy odtworzone (exit 0). Pełny cargo test per binarka NIE_ZMIERZONO; 5 binarek odtworzone (6 FAIL).
RUNDY: 4/5 (r5 = ostatnia; LIMIT-5-EXCEEDED, jeśli nie domknie B2)
NASTĘPNY KROK: r5: (a) decyzja orkiestratora o allowlistcie (tests/resource_production.rs, tests/parity_suite.rs, benches/engine_modules.rs); (b) naprawa powtarzalności generatora empirefood (D-R4-3); (c) B2 razem z C (wlasciciel_era w WorkedTileImpInput, 17 literałów); (d) D po zielonych bramkach; pełny cargo test per binarka z baseline pre-B1.
DEPLOY/PUSH: NIE WYKONANO
