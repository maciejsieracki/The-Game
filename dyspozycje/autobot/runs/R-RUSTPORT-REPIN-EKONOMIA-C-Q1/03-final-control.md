STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-EKONOMIA-C-Q1
GOAL: REPIN 4b czesc C (C1/C2: mnoznik budowy ulepszen 0.5/1/2, web 91dc998a) + wektory M16/P6.23.
RUNDY: 1/5

## Werdykt: PASS-WITH-NOTES (zero NAPRAW)

Zarzuty:
1. C5/C6 niezportowane -> ODDAL (dispatch: osobna partia; NASTEPNA-PARTIA w dokumencie tematu).
2. Opis 22/40 w rules.json -> ODDAL (obrona: 22 kosztPraca w meta + 40 work_cost_scale era + 8 base; opis doprecyzowany, bez wplywu na kod).
3. Weryfikatory Python czerwone (280 / 11037) -> ODDAL (poza allowlista; osobny temat).
4. Literal pin_web edb8fb56 w gen-p623 (improvements.json: reczny 91dc998a) -> ODDAL (poza allowlista; osobny temat).
5. Brak konsumenta upkeep 1/2/4 w Rust (turn-economy.ts:937) -> ODDAL (sledzona luka, stan sprzed zmiany; nowy temat).
Decyzji produktowych brak (DO DECYZJI CZLOWIEKA: nic).

## Dowody (wlasne, na b6242f3d)
- Allowlista: 84136f57..b6242f3d = 19 plikow (improvements.rs, p6_repin_c_construction.rs, 3 wektory, P6-REPIN-EKONOMIA-C.md, run dir). Brak gra/, renderer, src-tauri, Cargo.toml, WERSJE.md, Cargo.lock. git diff --check czysty.
- Kod vs web: terrain-improvements.ts@91dc998a:91-114 == improvements.rs terrain_improvement_construction_era_multiplier / scale_terrain_improvement_work_cost (floor, brak/nieskonczona->1, <=1 0.5, ==2 1, reszta 2*2^(e-3)). Upkeep 1/2/4 nietkniety.
- cargo fmt --check EXIT=0; cargo clippy --all-targets -D warnings EXIT=0; cargo test --no-fail-fast EXIT=0, 1276 passed / 0 failed (baseline 1272 + 4).
- Wektory: qualifier 7 737 658 B, rules 3 999 579 B (<10 MB). Evaluator odtworzyl generatory z weba 91dc998a: qualifier/rules/gallery bajt-w-bajt, p6_23 roznica wylacznie meta.pin_web.
- Mutacje A/B: FAILED (5 i 2 testy), przywrocone.
- Integracja: parity-v2 (dcd3eadb) od merge-base 84136f57 nie dotyka improvements.rs ani plikow p6_m16_*/p6_23_*/p6_repin_c_* -> czysty merge spodziewany.

## Do integracji
SHA koncowy: b6242f3d (lancuch 720f91f2 [kod+wektory] -> bfc79e73 -> d5ede61e -> b6242f3d [docs]) + ten dokument (commit FC). Baza 84136f57; origin/rust-port/parity-v2 = dcd3eadb (przesunieto, brak kolizji plikow). Kolejnosc: zintegrowac na parity-v2, ponowic 3 bramki, potem partie C5, C6(a/b/c), potem tematy: weryfikatory Python, pin literal gen-p623, luka upkeep. Pinu w manifestach nie przesuwac (po krokach 1-5).
DEPLOY/PUSH: NIE WYKONANO
