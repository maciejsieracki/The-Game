STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING (runda 2, Evaluator)
GOAL: wiring apply_dipl_deltas_to_state w advance_turn, parytet brak wpisu = 0, wektory >=150 (apply i D3), mutacje (a)-(e) FAIL.
BAZA/SHA: 3169406857bc (detached), baza f0eb32ab8.
TESTY (EXIT 0): fmt --check; clippy --all-targets -D warnings; lib 127/127; p6_r7k7c 7/7; p6_r7k7c_d3 4/4; p6_r7k7c_owner_pools 15/15. Pelny all-targets: NIE_ZMIERZONO (dysk ok. 8,5 GB, prog 8).

ZARZUTY:
1. Mutant wlasny PRZEZYWA: przywrocenie starego kodu Work (bez podlogi) w apply_cyclic_outcome (turn_war_dipl_steps.rs:407) -> lib, p6_r7k7c, d3, owner_pools, p6_wire_war_pipeline, p6_wire_war_stores, diplomacy: wszystko zielone. Wektory D3 (220) wolaja tylko pub pay_work_floored, nigdy sciezki produkcyjnej (apply_cyclic_outcome/run_dipl_steps), wiec nie dowodza, ze produkcja z niej korzysta. Mutacja (d) Operatora usuwa podloge wewnatrz helpera, nie na wolajacym.
2. Brak wymaganego dispatchem (ZARZUT 3) scenariusza wiringu Work/praca i handlu cyklicznego zasobami w advance_turn: p6_r7k7c.rs ma jeden scenariusz (danina zlota), zero Pracy; wartosci 50/60/90/20 wpisane recznie, nie z generatora.
3. Wektory apply (apply.json, 232) bez sekwencji przeplywow jednej tury dla tego samego wlasciciela (ZARZUT 4); Operator przyznal pominiecie i przesunal na D3 (helper). Wymaganie dispatchu niespelnione.
4. Mutant (c) zredefiniowany przez Operatora (zamiana zapisow w helperze) zamiast "zamiana kolejnosci apply wzgledem poprzedniego kroku tury"; kolejnosc faz w advance_turn nie ma testu wzgledem pinu.
5. Informacyjnie: "saldo platnika sprawdzane" niewdrozone; pin (main.ts:24015-24016, podloga main.ts:34879-34882) nie sprawdza salda Pracy - zgodne z pinem, wymaga zapisu orkiestratora w REJESTR-RUST.md.
6. NIE_ZMIERZONO: p6_cred_hak_kolejnosc, p6_unit_replace_l3_state, pelny all-targets.

POZYTYWY: brak #[ignore] w p6_r7k7c*; generator d3 wykonuje tekst pinu (straznik zakresow linii, sha256); allowlista zachowana; test rollbacku (e) sensowny; brak zaleznosci od W8.

RUNDY: 2/5
NASTĘPNY KROK: runda 3 Operatora: wektory D3 przez sciezke produkcyjna, scenariusz advance_turn z Praca + handel cykliczny z generatora, sekwencje apply.
DEPLOY/PUSH: NIE WYKONANO
