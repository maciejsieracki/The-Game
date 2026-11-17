STATUS: BLOCK
DOMAIN: INFRA
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (T4e-0, runda 2 wg DODATKU r2)
GOAL: ProdBody: MoveTerrain, pola terrain i occ_by_key, jedna sciezka ruchu (krok -> do_move_effects), wektory passable/occ.
BAZA: origin/rust-port/parity-v2 = 760be518775254a030ca252d7b43bba667689050 (worktree przelaczony z d44d5b982 na te baze; nie pushowano).
ZMIANY/COMMIT: BRAK commita z kodem. Niezweryfikowany kod zapisany jako patch: dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING/wip-r2-nieskompilowane.patch
  - rust-port/engine/src/domain/siege_tactics_move_effects.rs: trait MoveTerrain (passable, move_cost, is_ford, combat_terrain_name, cavalry_mult) wg D1. UWAGA: plik spoza allowlisty r1/r2; wprowadzony swiadomie wg wprost podanego D1.
  - rust-port/engine/src/domain/siege_tactics_loop.rs: pola ProdBody terrain: Option<Box<dyn MoveTerrain>> i occ_by_key (init z pozycji jednostek w new()), set_terrain, occ_by_key(), move_step() -> do_move_effects, ProdMoveError::MissingTerrain (bez domyslnej wartosci), adapter ProdMoveWorld. Odmowa (refused) nie czyta terenu.
  - rust-port/engine/tests/p6_k5doc_t4e.rs (NOWY): 9 testow: init occ, ruch zwykly (occ + pozycja + move_left = 10-2), clamp Infinity -> 99, brod na celu /0.5, MissingTerrain bez zmiany stanu, odmowa bez terenu, kolejnosc occ przed facing (rejestr wywolan), dwa kroki bez starego klucza. Wektory wpisane w kod testu z odwolaniem do pina; NIE generowane przez *_gen.mjs.
TESTY: NIE_ZMIERZONO. cargo nie uruchomiono (patrz BLOKADY). Wykonano tylko: rustfmt --edition 2021 (zastosowany) i rustfmt --check na 3 plikach: OK, pliki sparsowane poprawnie.
  Bramki wymagane (fmt, clippy -D warnings, p6_k5doc_t4e, --all-targets) ORAZ mutacje (a) pominiecie occ_mut, (b) brak MissingTerrain, (c) odwrocenie occ/facing: NIE WYKONANO.
BLOKADY: DYSK (wymog >= 8 GB przed bramkami i mutacjami, df -h /):
  - start rundy: 8.2G wolne (df -h), po zapisie patcha: 8.0G (df -h) = 8 491 106 304 B = 7,91 GiB.
  - przed koncem: 8 342 016 000 B = 7,77 GiB (8,34 GB). Ponizej progu 8 GB -> BLOK INFRA, bez uruchamiania na pol.
  - Zrodlo zuzycia poza tym tematem: /tmp/claude-0 (3,9 G), nie usuwano cudzych katalogow.
  - Decyzje D1-D4 zrealizowane; D2 (czas kroku) nie dotyczy T4e-0 i nie wprowadzono STEP_GAP_MS. Brak wiringu AdvanceDecision::Move -> move_step (to zakres T4e-1, wedlug D4).
RUNDY: 2/5 (DODATEK r2). Ostatni werdykt: BLOCK INFRA (dysk), bez FAIL FC.
NASTEPNY KROK: zwolnic dysk do >= 8 GB (decyzja orkiestratora/sprzatanie); potem na bazie 760be5187 zaaplikowac patch (git apply), uruchomic bramki (fmt, clippy -D warnings, test p6_k5doc_t4e, --all-targets w tle) i mutacje a/b/c z przywroceniem kopii i zerowym diffem; dopiero wtedy commit z jawnym git add (bez Cargo.lock), bez push do parity.
UWAGI ORKIESTRATORA (do zgody): (1) trait MoveTerrain w siege_tactics_move_effects.rs jest poza allowlista r1/r2 (wprost wskazany w D1); (2) hook update_facing w adapterze jest no-op (#107 zablokowany); (3) wektory T4e-0 sa wpisane w test, bez generatora.
DEPLOY/PUSH: NIE WYKONANO.
