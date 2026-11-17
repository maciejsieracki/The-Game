STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING
GOAL: T4e-0 — wiring jednego kroku ruchu pieszego/jazdy w ProdBody (move_step -> do_move_effects), koszt per mounted, occ_by_key, MoveTerrain/MissingTerrain
ZMIANY/COMMIT: SHA oceniany 278e16c45 (Operator r4 732ef51a0 + poprawka Z5 253a9de46 + 02a-obrona). Baza c120f2373 jest przodkiem (merge-base --is-ancestor OK). Pliki: siege_tactics_loop.rs, siege_tactics_move_effects.rs (tylko trait MoveTerrain), tests/p6_k5doc_t4e.rs, p6_k5doc_t4e_gen.mjs, p6_k5doc_t4e_vectors/vectors.json, runs/**. Brak zmian w gra/, renderer/, Cargo.lock. Allowlista zachowana.
TESTY (odtworzone samodzielnie): cargo fmt --check -p civ-engine exit 0; clippy --all-targets -D warnings exit 0; p6_k5doc_t4e 7/7 ok, 0 ignored; cargo test --all-targets --no-fail-fast exit 0: 521 binarek, 3888 passed, 0 failed, 1 ignored (poza plikami tematu, wcześniej istniejący).
BLOKADY: brak (dysk 8.8 GB przed bramkami)

ORZECZENIA ZARZUTÓW
Z1 bramki zielone: ODDAL (potwierdzone).
Z2 kolejność occ/facing testowana na do_move_effects (T4c), nie na wiringu: ODDAL. Facing w adapterze to no-op (#107), nieobserwowalne; zakres T4c.
Z3 cavalry_multiplier to stub wg komentarza pina, combat.ts:756 niewykonany: ODDAL jako NIE_ZMIERZONO; dług do rejestru (T4e-1: wektory mnożnika z terrain-combat.json). Test rozróżniający jazdę i piechotę istnieje i przechodzi.
Z4 brak produkcyjnego wołającego move_step / e2e: ODDAL. DODATEK r2 D4 i r3 ograniczają zakres do T4e-0; pełny krok 1-10 i SiegeLoop (#113) = T4e-1.
Z5 MissingTerrain przy refused: NAPRAWIONE w 253a9de46 (gałąź refused przed wymogiem terenu, test refusal_needs_no_terrain_and_changes_nothing). Zweryfikowane w kodzie i teście. Nie jest otwartym NAPRAW.
Z6 occ_by_key seedowane także z martwych/uciekających, brak usuwania wpisów (pin :7709, :7726, :9812, :9915, :10498): ODDAL do T4e-1/#113 jako blokada techniczna dla orkiestratora; brak produkcyjnego wołającego, więc brak skutku w grze teraz. Do wpisania w REJESTR-RUST.
Z7 linia "Cla" w trailerze 732ef51a0: ODDAL (kosmetyka; nazwy modelu brak).
Uwaga dodatkowa: martwy warunek `if !refused` po wczesnym return w move_step — kosmetyka, ODDAL.

DO DECYZJI CZŁOWIEKA: brak (Z6 to decyzja techniczna orkiestratora).
NASTĘPNY KROK: integracja orkiestratora (FF na parity-v2 po pełnym teście), wpis długów Z3/Z6 w REJESTR-RUST, T4e-1.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 4/5
