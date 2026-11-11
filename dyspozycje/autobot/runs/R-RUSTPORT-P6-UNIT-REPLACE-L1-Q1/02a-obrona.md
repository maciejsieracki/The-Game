STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1 (zadanie 20: awanse INFANTRY 21/23), runda 1/5, obrona Operatora (Operator, odpowiedź na zarzuty Evaluatora r1)
GOAL: uzupelnic awanse INFANTRY w danych Rust zgodnie z pinem 07d2fbd72, test behawioralny na wektorach z generatora z pinu
BAZA: adf30a705 (commit Operatora r1, na 83ac67875 = origin/rust-port/parity-v2). Obrona na detached HEAD, bez pusha, bez integracji.

ZMIANY/COMMIT:
- rust-port/engine/tests/p6_unit_replace_l1.rs (allowlista): poprawka DROBNE 1 (SHA: patrz raport orkiestratora; commit obrony zawiera tylko ten plik i ten dokument).
- rust-port/engine/data/units.json: BEZ ZMIAN w tej obronie (zob. zarzut BLOKUJACY).
- Cargo.lock: wygenerowany lokalnie, NIE commitowany.

ODPOWIEDZI NA ZARZUTY:

1. BLOKUJACY: zmiana units.json lamie 2 testy p6_1d_civ_bonuses.rs (linia 161, linia 219).
   PRZYJMUJE (potwierdzone odtworzeniem).
   - tests/p6_1d_civ_bonuses.rs:161 porownuje dataFnv.units z web-vectors.json z FNV units.json. Plik wektorow ma naglowek "pin":"edb8fb56".
   - tests/p6_1d_civ_bonuses.rs:219 porownuje dataStringXor, czyli XOR po wszystkich stringach z units.json (w tym "Zastąp specjalnie"). Zmiana awansow zmienia ten XOR, wiec test pada rownie.
   - Test p6_1d_civ_bonuses na 83ac67875 (units.json z bazy): 14 passed. Po adf30a705: 12 passed, 2 failed (te same dwa testy). Potwierdzone.
   - NAPRAWA POZA ALLOWLISTA, NIE WYKONANO. Wymaga zmiany rust-port/engine/tests/p6_1d_vectors/web-vectors.json (dataFnv.units, strip.dataStringXor, strip.bmpHash bez zmiany, ale XOR tak) poza allowlista tematu.
   - Decyzja, ktorej nie podejmuje Operator: wektory p6_1d pochodza z pinu edb8fb56, a awanse z pinu 07d2fbd72. Regeneracja wektorow z units.json z innego pinu mieszalaby piny w jednym tescie. Operator nie zmienia wektorow samodzielnie.
   - Opcje dla orkiestratora: (a) rozszerzyc allowlist o web-vectors.json i jawnie zdecydowac, ktory pin danych jest prawda dla p6_1d; (b) przeniesc awanse do osobnego pliku danych (decyzja architektoniczna); (c) wstrzymac temat do decyzji wlasciciela.

2. ISTOTNY: units.json Rust rozni sie od pinu w 50 polach poza awansami; test porownuje tylko Typ i Zastąp specjalnie.
   PRZYJMUJE (zweryfikowane skryptem porownujacym 75 jednostek, skrypt poza repo).
   - Rust po zmianie (adf30a705) vs pin 07d2fbd72: 35 jednostek z roznicami, 50 komorek. Rozklad: Tech:27, fieldPower:9, Top3:3, Epoka:2, Historia:2, Atak:1, Obrona:1, Przebicie:1, Bonus vs Spearman %:1, meleeAttack:1, meleeDefence:1, piercing:1.
   - Baza 83ac67875 vs pin: 71 komorek = te 50 + 21 x "Zastąp specjalnie".
   - Zmiana adf30a705 vs baza: dokladnie 21 komorek, wszystkie "Zastąp specjalnie". Operator nie zmienil zadnego innego pola.
   - Te 50 rozbieznosci istnialo przed ta zmiana i NIE jest w GOAL tematu. Nie naprawiam ich tutaj. Zapisuje to jawnie: zgodnosc z pinem dotyczy w tym temacie wylacznie Typ i "Zastąp specjalnie". Rekomendacja: osobny temat danych (zob. blokada 1 wyzej, dotyczy tez pola Tech/Epoka).

3. UWAGA: available_replacements_for nie ma wolajacego w src; efekt w grze nie jest pokryty.
   PRZYJMUJE (doprecyzowanie, bez zmiany kodu).
   - grep po rust-port/: definicja production_units.rs:2656; wolajacy: tylko testy (tests/p6_8b_c2b_vectors.rs, tests/p6_unit_replace_l1.rs). Brak wolajacego w rust-port/engine/src.
   - Test infantry_promotion_targets_available_in_rust_logic dziala na izolowanym wywolaniu z kontekstem (epoka 3, koszary, techy z pinu, nacja celu). Jego argument `units` to wiersze PINU, nie units.json Rust. Test sprawdza wiec logike Rust na danych pinu, a nie dane Rust.
   - Efekt w grze (podpiecie w produkcji, zalezność od W8) NIE jest pokryty i NIE jest zaliczany do tego tematu. Zmiana podpiecia wykracza poza allowliste i GOAL.

4. DROBNE 1: test infantry_promotion_targets_available_in_rust_logic sprawdza tylko "any", nie zbior.
   PRZYJMUJE (poprawka, czesciowa).
   - Dodano w tests/p6_unit_replace_l1.rs asercje: zbior wynikow o innym Typ niz zrodlo (got_cross) musi byc podzbiorem celow z pinu o innym Typ (exp_cross). Wykrywa nadmiarowe cele cross-Typ. Podstawa: galaz A (ten sam Typ) z production_units.rs:2677-2697 nie moze wniesc celu innego Typ, wiec kazdy taki wynik pochodzi z "Zastąp specjalnie" (galaz B).
   - NIE jest to pelna rownosc zbiorow: galaz A zwraca wszystkie odblokowane jednostki tego samego Typ, a ich zbior zalezy od bramek. Pelna rownosc wymagalaby przepisania bramek w tescie. Zaznaczam to jako ograniczenie.
   - NIE_ZMIERZONO: sciezki porazki nowej asercji nie sprawdzilem mutantem (test z niepoprawnym celem). Potwierdzono tylko, ze obecny zestaw danych przechodzi.

5. DROBNE 2: negatywna kontrola Operatora (HEAD units.json -> test pada) nie zostala odtworzona.
   PRZYJMUJE (odtworzone).
   - Podmiana rust-port/engine/data/units.json na wersje z 83ac67875: rust_units_json_promotion_field_matches_pin FAILED (tests/p6_unit_replace_l1.rs:93, Typ/Zastąp specjalnie rozni sie od pinu). Pozostale 2 testy passed. Plik przywrocony (cmp zgodny z adf30a705).

6. PROCES: runda 2 wymaga decyzji orkiestratora o allowliscie.
   PRZYJMUJE. Operator nie rozszerza allowlisty samodzielnie.

BRAMKI PO OBRONIE (katalog celu poza repo, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0):
- cargo fmt --check (rust-port/engine): exit 0
- cargo clippy --all-targets -- -D warnings: exit 0
- cargo test --lib: 37 passed, 0 failed
- cargo test --test p6_unit_replace_l1: 3 passed, 0 failed
- cargo test --test p6_1d_civ_bonuses: 12 passed, 2 failed (embedded_data_is_byte_identical_to_data_used_for_vectors, strip_diacritics_matches_web_function_cut_verbatim) - te same dwa co w r1
- Pelny cargo test --no-fail-fast po obronie: NIE_ZMIERZONO (zmieniony jest tylko plik testu p6_unit_replace_l1; wynik pozostalych binarek z adf30a705: 1569 passed, 2 failed wg raportu Operatora r1)

BLOKADY:
1. Dwa testy p6_1d_civ_bonuses czerwone; naprawa wymaga zmiany poza allowlista i decyzji o pinie danych (zarzut 1).
2. Rozbieznosci 50 pol poza awansami w units.json wzgledem pinu (zarzut 2), poza GOAL.
3. Podpiecie available_replacements_for w produkcji nieobecne (zarzut 3), poza GOAL.

RUNDY: 1/5 (obrona w tej samej rundzie; kolejna runda po decyzji orkiestratora)
NASTEPNY KROK: decyzja orkiestratora o zakresie allowlisty dla p6_1d (opcje a/b/c w zarzucie 1); po niej Evaluator i Final Control z tym samym ID.
DEPLOY/PUSH: NIE WYKONANO (brak pusha do rust-port/parity-v2, brak integracji)
