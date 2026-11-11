STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BRAKE-VECTORS-Q1
GOAL: rozszerzyc wektory computeObjectivePower o FlatCount (wygrane_bitwy), niestandardowe wspolczynniki, militaryKeys i polowki dla Math.round, wykonane z pinu 07d2fbd72 (nie recznie); test bez oslabiania asercji; przy rozbieznosci Rust vs pin: BLOCK z lista przypadkow, bez zmian w kodzie produkcyjnym.
ZMIANY/COMMIT: lokalny commit 8d93c34dd na gałęzi rust-port-wip/P6-BRAKE-VECTORS-Q1-operator-r1 (baza detached a91b3b766). Allowlista: rust-port/engine/tests/p6_brake_inputs_vectors.rs (+110, dopisany nowy test, istniejace asercje nietkniete); rust-port/engine/tests/p6_brake_inputs_vectors/gen-objective-variants.mjs (nowy generator, patrz odchylenia); rust-port/engine/tests/p6_brake_inputs_vectors/objective-variants.json (nowe, 160 przypadkow); dyspozycje/autobot/runs/R-RUSTPORT-P6-BRAKE-VECTORS-Q1/00-dispatch.md i 01-operator-r1.md. NIE zmieniano: p6_brake_inputs_gen.mjs, vectors.json, src/**, gra/**, Cargo.toml, Cargo.lock (wygenerowany przez cargo, nieśledzony, NIE commitowany), origin/main, WERSJE.md. Nie pushowano.
TESTY:
- cargo fmt --check: PASS (exit 0; rustfmt objal wylacznie dopisana sekcje testu).
- cargo clippy --all-targets -- -D warnings: PASS (exit 0).
- cargo test --lib: PASS, 48 passed, 0 failed.
- cargo test --test p6_brake_inputs: PASS, 10 passed, 0 failed.
- cargo test --test p6_brake_inputs_vectors: FAIL, 8 passed, 1 failed. Jedyny czerwony: objective_power_variants_match_pinned_compute_objective_power (pierwsza rozbieznosc: idx 0, enemy_m_sum, klucz zdobycze w militaryKeys: Rust military=true, pin false).
- Skan rozbieznosci (tymczasowy plik testowy, usuniety po skanie): 40 z 160 przypadkow rozbiezne, WSZYSTKIE wylacznie w polu military skladnika "zdobycze" (idx: 0,3,6,19,20,21,26,27,30,34,42,45,46,50,51,54,55,61,63,75,85,90,104,105,115,117,118,119,123,124,125,127,136,137,141,142,148,149,151,159). Power, powerBase, rawCount, coefficient i points zgodne z pinem we wszystkich 160 przypadkach (w tym 76 flat_count, 56 z polowka w powerBase dla Math.round, wspolczynniki niestandardowe).
- Regeneracja vectors wariantow na pinie (node gen-objective-variants.mjs ... 07d2fbd72): EXIT 0, cmp identyczny z commitowanym objective-variants.json (CMP_SAME).
- Regeneracja p6_brake_inputs_gen.mjs na pinie + cmp: NIE_ZMIERZONO (patrz odchylenia).
- df -h / przed startem: 12 GB wolne.
BLOKADY:
1. ROZBIEZNOSC RUST vs PIN (kod produkcyjny NIE poprawiany): compute_objective_power w rust-port/engine/src/domain/brake_power.rs ustawia military dla skladnika "zdobycze" z przekazanego zbioru militaryKeys (row("zdobycze", ..., military.contains(key))). Pin (gra/src/game/power-objective.ts) zawsze podaje false dla "zdobycze" (row('zdobycze', ..., 2, false)). Zasieg: tylko przy jawnym przekazaniu "zdobycze" w zbiorze; produkcyjne military_component_keys / loadMilitaryComponentKeys nie zwracaja "zdobycze" (brak wpisu w JSON), wiec w biezacym przeplywie nie wystepuje. Decyzja: czy Rust ma ignorowac militaryKeys dla "zdobycze" (poprawka produkcyjna, osobny temat), czy test ma wymuszac to tylko przez wejscie produkcyjne.
2. Lista przypadkow: 40 idx podanych wyzej (ten sam blad we wszystkich).
ODCHYLENIA OD DISPATCHA (jawnie):
- Baza: dispatch wskazuje a91b3b766 (BRAKE-INPUTS r2); tresc zlecenia wskazuje origin/rust-port/parity-v2 (f207ea6b1 lub nowszy). Pliki p6_brake_inputs_* istnieja tylko na a91b3b766 (nie na parity-v2 eba816b4e; a91b3b766 nie jest przodkiem parity-v2). Uzyto a91b3b766, zgodnie z allowlista dispatcha.
- Generator: NIE rozszerzono p6_brake_inputs_gen.mjs. Powod: sandbox odrzuca git archive pinu (a takze przekierowania wyjscia git poza worktree), a pelne domkniecie importow p6_brake_inputs_gen.mjs (barbarians -> units/setup -> ...) wymaga dziesiatek plikow pinu. Zamiast tego dodano osobny generator gen-objective-variants.mjs w katalogu vectors (allowlista p6_brake_inputs_vectors/*), ktory wykonuje wylacznie power-objective.ts z pinu (jedyny import: power-params.json, oba skopiowane z pinu do katalogu poza repo). Istniejacy generator i vectors.json nietkniete; ich regeneracja NIE_ZMIERZONO.
- Pin: wycinek power-objective.ts i power-params.json odczytany przez git show z pinu 07d2fbd72; zadnych plikow pinu w repo.
- Pliki allowlist: brak; wszystkie zmiany w allowliscie dispatcha.
NASTEPNY KROK: decyzja orkiestratora o rozbieznosci "zdobycze" (poprawka Rust w osobnym temacie albo akceptacja i zawezenie testu). Nie integrowac, nie pushowac przed decyzja. Bramka po decyzji: ponowny Evaluator/FC z tym samym ID.
DEPLOY/PUSH: NIE WYKONANO
