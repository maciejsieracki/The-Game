STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1
GOAL: Niezalezna weryfikacja partii 1 rodziny ulamka lądu (kod 9c704a78, raport 63aad766): wektory, bramki, mutacje, dowody rownowaznosci dla przezytych mutacji.
ZMIANY/COMMIT: kod nie zmieniony (worktree = 63aad766; `git status` po pomiarach: tylko dokument tematu + run dir). Commit pomiarow: patrz sekcja DEPLOY/PUSH. Allowlista: `dyspozycje/rust-port/p6/P6-M06A5-LAD-MORZE-ULAMEK.md`, run dir. Cargo.lock lokalny, nie dodany.
TESTY:
  - Regeneracja wektorow z weba (pin edb8fb56, swiezy git archive): `cmp` identyczny z commitowanym JSON (EXIT 0). Log: `verify-m06a5-r2.log`.
  - cargo fmt --check: EXIT=0 (`gate-fmt-r2.log`)
  - cargo clippy --all-targets -- -D warnings: EXIT=0 (`gate-clippy-r2.log`)
  - cargo test: EXIT=0, 1270 passed, 0 failed (`gate-test-r2.log`); p6_m06a5_landfrac uruchomiony
  - git diff --check: czysty
  - Mutacje (46, cargo test --test p6_m06a5_landfrac, plik przywracany, SHA zgodne): 34 KILLED, 12 SURVIVED (`mutations-r2.log`)
  - Przezyte EKWIWALENTNE z dowodem: grow-lt-to-le, erode-gt-to-ge, interior-pass-off, interior-no-border-gate, interior-threshold-ge, interior-threshold-minus1, interior-sort-reversed (przebieg 2 jest martwy: kandydaci interiorOk ⊂ borderOk, ten sam filtr), rebal-caps-enforce-swap (caps/sort zaleza tylko od woda/lad dla d>=2; cap(d<2)=0).
  - Przezyte EKWIWALENTNE EMPIRYCZNIE: sort-center-tol-ge (0 trafien f64 |ca-cb|==0.015 dla siatek 1..24).
  - Przezyte NIEEKWIWALENTNE (LUKI): nan-guard-off (Z-4: web NaN -> brak zmian; bez straznika Rust erozja calego ladu, z odczytu kodu), tol-score-ge (dokladny remis 0.04 w f64 nieobecny w wektorach), sort-default-score-1 (brak wektora z brakujacym score, web `?? 0`).
  - Granice wektorow: max odleglosc od brzegu w apply = 4 (prog 10); score-remisy 0.04: 2542 par; remisy Math.round: 55 (apply).
BLOKADY: brak blokad technicznych. Trzy luki testowe (wyzej) blokuja PASS.
  Zalozenia (bez pytan): Z-4 nadal przyjety jako semantyka webu (NaN -> brak zmian), ale wymaga testu.
RUNDY: 1/5 (Operator-impl r1 + Operator-pomiary r2 = ten sam obieg). Po FAIL wraca do Operatora: runda 2/5.
NASTEPNY KROK: Operator-impl (runda 2): (1) test NaN dla apply i rebalance (0 zmian, mapa bez zmian); (2) wektor z dokladnym remisem score 0.04 w f64 (np. pary 0.0/0.04); (3) wektor z brakujacym kluczem w scores (web `?? 0`). Potem ponowny pomiar mutacji nan-guard-off, tol-score-ge, sort-default-score-1 (musza byc KILLED). Nastepnie Evaluator i Final Control.
Uwagi: stale progi (clamp 0.8501/0.8499/0.1501, tol-score 0.0401, tol-centrum 0.0151, pangea-min) zabite tylko testem stalych (`landfrac_data_matches_web_constants`); wektory nie rozrozniaja N+1/N-1. Strefa wewnetrzna (przebieg 2) nie jest pokryta wektorami; dowod martwosci wystarcza dla rownowaznosci, ale wektory z dims >= 23x23 zamkna pokrycie, jesli Evaluator tego zazada. Dwa zrodla MAP_MARGIN_LAND_ZONE_HEXES (masks.rs `strefa_marginesu_heksy`, terrain_class.rs `strefa_stopniowanego_ladu_hex`; obie 10); landsea.rs uzywa wersji terrain_class.
DEPLOY/PUSH: NIE WYKONANO
