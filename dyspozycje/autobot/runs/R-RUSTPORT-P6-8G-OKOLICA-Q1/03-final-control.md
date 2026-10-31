STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8G-OKOLICA-Q1
GOAL: Port okolica.ts (pin 91dc998a) do rust-port/engine/src/domain/okolica.rs z wektorami z weba, mutacjami, tabela symboli i wpietym hakiem rebalansu.
ZMIANY/COMMIT: ocena SHA ee46da1e5 (branch lokalny p6-8g-okolica-r3), baza 72491e442 = origin/rust-port/parity-v2 (bez zmian). Allowlista czysta (okolica.rs, okolica/*.rs, terrain/start_position/improvement_build/mod.rs, tests/p6_8g_*, vectors, run). city_growth.rs i state.rs bez zmian. Brak gra/, Cargo.toml, WERSJE.md.
TESTY (zweryfikowane samodzielnie): cargo fmt --check EXIT=0; cargo test --test p6_8g_okolica 19 passed; --test p6_8g_web_vectors 10 passed (0 failed). Clippy i pelny cargo test opieram na raporcie Operatora (1869/0). Pliki okolica*.rs: 500/168/303/156 LOC (<=600). okolica.json 542 KB (<=6 MB).
ZARZUTY r2 -> ocena:
- Z1 wektory z weba: OK dla funkcji pokrytych (10 testow). Reszta NAPRAW (brak wektorow: adjust/toggle/collect*/computeLost/resolve reczny/effectiveIsWorkable).
- Z2 tabela symboli: ODDAL (36 wierszy w 03-operator-r3.md; P6-8-MIASTA-PODZIAL.md istnieje na galezi docs). Wymog: po domknieciu statusow zaktualizowac tabele.
- Z3 hak rebalansu: NAPRAW. okolica:: nie ma uzycia poza modulem; PopulationChangeHooks (city_growth.rs:1447) bez implementacji. Dwa zrodla prawdy odrzucone przez Operatora (trait bez ciala) - to poprawne, ale dispatch wymaga wpiecia haka. ZALOZENIE: adapter przyjmuje mape okolica_reczne wstrzykiwana przez implementacje (bez state.rs); jesli konieczne pole w state::City - rozszerzenie allowlisty o state.rs jest dopuszczalne ZALOZENIEM, to nie jest decyzja produktowa.
- Z4 M3: ODDAL (zabita, testy ujemnej populacji).
- Z5 partie 600 LOC: ODDAL.
- Z6 dedup hex_keys_within_radius: ODDAL (hex_disk_offsets, testy zielone, N-1/N/N+1 z weba).
- Z7 zalozenia: localeCompare ODDAL (3136 par); sort NaN n>=64 NAPRAW (wektor z weba n>=64 z NaN albo dowod); yieldOfMapHex ODDAL pod warunkiem wektorow konsumenta (sa).
- Z8 pin/weryfikator: ODDAL (pin uruchomiony, generator odtwarzalny); niezalezna weryfikacje robi Evaluator.
- Mutacje na pozostalych galeziach sterujacych (rebalance, toggle, adjust, collect, computeLost, resolve reczny, js_cmp_diff): NAPRAW albo dowod rownowaznosci plik:linia.
DO DECYZJI CZLOWIEKA: brak.
BLOKADY: hak rebalansu niewpiety; brak wektorow dla 6 funkcji; n>=64 z NaN; mutacje niepelne.
RUNDY: 3/5 (r1 BLOCK, r2 BLOCK, r3 BLOCK, FC FAIL); decyzja wymagana: NIE
NASTEPNY KROK: runda 4 Operatora (ten sam ID): adapter/impl PopulationChangeHooks z pamiecia okolica_reczne (allowlista +state.rs jako ZALOZENIE), wektory z weba dla brakujacych funkcji i n>=64+NaN, mutacje wszystkich galezi, aktualizacja tabeli; potem Evaluator i Final Control. Kolejnosc wzgledem origin/rust-port/parity-v2: rebase/merge na 72491e442 (merge-base = 72491e442, galaz liniowo na nim) - integracja dopiero po PASS.
DEPLOY/PUSH: NIE WYKONANO

---

# Final Control r5 (po Obronie Operatora r5, kod `baca6b222`)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8G-OKOLICA-Q1
GOAL: P6.8G okolica.ts -> Rust; werdykt po Evaluator r4 FAIL (mutant NaN) i Obronie r5.
ZMIANY/COMMIT: kod `baca6b222` (tylko `okolica/sort/tests.rs`, +2 testy, produkcja bez zmian) na `09def9222`.
TESTY (wlasne, FC): fmt --check EXIT=0; clippy --all-targets -D warnings EXIT=0; test --no-fail-fast EXIT=0, 246 suite'ow, 1880 passed, 0 failed; `git diff --check 09def9222 HEAD` EXIT=0. Mutant `d > 0.0` -> `!(d < 0.0) && d != 0.0` (okolica.rs:175): 2 nowe testy FAILED (js_cmp_diff_nan_is_equal_like_v8_compare, compare_scored_nan_score_is_tie_without_further_criteria) -> zabity; po przywroceniu 3/3 PASS. Pin 91dc998a i pozostale mutacje M1-M19 nie byly przeze mnie powtarzane (przyjete z Evaluator r4, ktory zweryfikowal pin bajt-identycznie).

WERDYKTY PER ZARZUT:
1. Mutant NaN w js_cmp_diff: ODDAL (rozstrzygniete przez Operatora, zweryfikowane mutacja). Brak wektora n>=64 jest uzasadniony empirycznie (Node 22.22.0, ~80 000 tablic: NaN->0 vs NaN->1 bez rozbieznosci), wiec zabicie testem jednostkowym wystarcza.
2. M12 rownowazny: ODDAL (potwierdzone przez Evaluatora; guardy `!=`).
3. `tests/p6_6b_vectors/common.rs` poza allowlista: ODDAL jako ZALOZENIE. Jednolinijkowa zmiana (`okolica_reczne: None`) wymuszona kompilacja przez pole `City::okolica_reczne` dopuszczone w r4 (state.rs); zero zmiany zachowania. Flaga dla orkiestratora: potwierdzic przy integracji.
4. N1 hak niewpiety do zywej sciezki: ODDAL jako NASTEPNA-PARTIA. Dowod Operatora: `apply_central_food_population_growth` i `apply_post_central_population_growth` nie maja wywolujacych poza testami; wpiecie zalezy od P6.7A. Hak zaimplementowany i testowany przez `dyn PopulationChangeHooks`.
5. N4 tabela symboli w dokumencie tematu na galezi docs: ODDAL jako uwaga (tabela w 04-operator-r4.md); orkiestrator przenosi do P6-8-MIASTA-PODZIAL.md przy integracji docs.
NAPRAW: brak. DO DECYZJI CZLOWIEKA: brak.

BLOKADY: brak technicznych.
RUNDY: 5/5 zuzyte; ostatni werdykt PASS-WITH-NOTES; decyzja wymagana: NIE.
NASTEPNY KROK: integracja orkiestratora. Kolejnosc wzgledem origin/rust-port/parity-v2 (2f35f68bc): merge-base = f4c89d008; zmiany parity-v2 od 72491e442 to wylacznie mapgen/rivers_a, testy p6_m07a_* i docs, rozlaczne z plikami 8G, wiec merge/cherry-pick `baca6b222` (i poprzedzajace commity galezi p6-8g-okolica-r5) bez konfliktow; po merge powtorzyc fmt/clippy/test.
DEPLOY/PUSH: NIE WYKONANO
