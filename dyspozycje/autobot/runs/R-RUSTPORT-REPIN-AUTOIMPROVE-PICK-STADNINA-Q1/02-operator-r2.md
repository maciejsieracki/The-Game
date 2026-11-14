STATUS: FAIL
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-AUTOIMPROVE-PICK-STADNINA-Q1
GOAL: runda 2 — stadnina (bramka epoki), regeneracja pick.json z weba cffe39cb9, pin, przywrócenie 4 scenariuszy, M16 droga; reszta jako dług z liczbami.
BAZA: worktree na rust-port/parity-v2 a006068f1 (detached); web = origin/main cffe39cb9.
ZMIANY/COMMIT: patrz commit na detached HEAD (SHA w odpowiedzi orkiestratora). Zmienione: rust-port/engine/src/domain/improvement_build.rs (STADNINA_FREE_FROM_ERA=3, parametr era w is_livestock_unlocked_for_placement_hex, przekazanie self.player_era); rust-port/engine/tests/p6_8i_vectors/pick.json + helpers.json (regeneracja, pin cffe39cb9); rust-port/engine/tests/p6_8i_pick.rs (nazwa i asercje pinu); dyspozycje/rust-port/p6/P6-REPIN-AUTOIMPROVE-PICK.md (tabela pomiarów, nowy); runs/R-RUSTPORT-REPIN-AUTOIMPROVE-PICK-STADNINA-Q1/tools/ (generator z PIN cffe39cb9, loader, log pełnego biegu, lista 947 niezgodnych).
TESTY:
- rustfmt --check (improvement_build.rs, p6_8i_pick.rs): OK.
- cargo test --lib: 28 passed, 0 failed.
- cargo test --test p6_8i_pick: 4 passed, 1 FAILED (pick_auto_improvements_matches_pinned_web_vectors): 947 niezgodnych z 5128; 406 s.
- P6_8I_ONLY=stadnina: 0 niezgodnych.
- Cztery przywrócone (rnd-961, ra-rnd-1, ra-rnd-24, ra-rnd-247): obecne w pick.json, wszystkie niezgodne.
- clippy --all-targets: NIE_ZMIERZONO. Pozostałe binarki (p6_m16_*, p6_8i_relief, p6_repin_autoimpr_terrain): NIE_ZMIERZONO.
- Pomiar M16 droga: 502 wpisy "key":"droga" w qualifier.json (grep); wpływ na wektory NIE_ZMIERZONO.
BLOKADY:
- Test pick jest CZERWONY: 947 niezgodności (bydło/inne/kolejność, zakres D2/D3). Bramka "0 failed" nieosiągnięta; nie maskowano asercji.
- Regeneracja zmieniła wektory na nowy web: bez D2/D3 zielony test nie jest możliwy w tej rundzie.
- Pin mieszany nadal w relief/terrain/m16 (nieregenerowane).
- Klasyfikacja przyczyn 947 nie wykonana (NIE_ZMIERZONO).
RUNDY: 2/5, ostatni werdykt: FAIL (runda 1, brak zmian kodu).
NASTĘPNY KROK: runda 3 (ten sam ID): D2 bydło/pastwiska i D3 inne/kolejność w partiach ≤600 LOC, z klasyfikacją 947 wg przyczyny (skrypt w runs/.../tools); regeneracja relief/terrain/m16 do jednego pinu cffe39cb9; M16 droga.
DEPLOY/PUSH: NIE WYKONANO
