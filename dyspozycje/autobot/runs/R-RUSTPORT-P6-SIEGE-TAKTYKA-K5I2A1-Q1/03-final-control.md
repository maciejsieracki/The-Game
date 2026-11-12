STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A1-Q1
GOAL: port 1:1 pieciu czystych funkcji terenowych (normTerrain, parseDefenseBonusPct, terrainDefenseMultiplier, terrainRiverAttackMultiplier, cityGatedTerrainMultiplier) do siege_tactics_inputs_terrain.rs
ZMIANY/COMMIT: kod e5fd83368e596600b1093641fd747adfded6fd84; obrona 0f1eb3b7385e30ae20dff51172438d2f91dc0aab (tylko dokumenty). Ancestry: a097600e1 (baza) -> e5fd83368 -> 0f1eb3b73 (is-ancestor OK dla obu). Allowlista zgodna (modul, mod.rs +1, test, gen, vectors, runs/**); gra/, Cargo.toml, WERSJE.md nietkniete; Cargo.lock nieskomitowany; git diff --check czysty.
TESTY (samodzielnie, FC): fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib 57 ok; blow 3, end 8, endcheck 9, inputs_terrain 7 ok. Regeneracja wektorow z pinu (node gen) daje identyczny vectors.json (brak diffu); liczniki galezi wszystkie > 0 (norm 631, bonus 340, def/river/city po 700).
ROZSTRZYGNIECIE ZARZUTOW:
- Z1 brak produkcyjnych wolajacych: ODDAL (dispatch wymaga wolajacego w tescie; zaleznosc od a2-a4 jawna).
- Z2 kolizja nazwy terrain_river_attack_multiplier: ODDAL (rozne moduly, brak glob importu; uwaga dla a2-a4: sciezka kwalifikowana).
- Z3 NFD bez przestawiania ccc poza U+0300..U+036F: ODDAL (udokumentowane ograniczenie, poza zakresem nazw terenu). Dlug NFD-CCC do zalozenia recznie przez orkiestratora.
- Z4 test liczniki tylko JSON: ODDAL (galezie asertowane w testach funkcji).
- Z5 nazwa raportu/SHA: ODDAL (naprawione w obronie).
- NAPRAW: brak.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (e5fd83368 / 0f1eb3b73), potem K5I2a2.
DEPLOY/PUSH: NIE WYKONANO
