# P6-REPIN-AUTOIMPROVE-PICK — tabela pomiarów (R-RUSTPORT-REPIN-AUTOIMPROVE-PICK-STADNINA-Q1, runda 3/5)

Pin web: `origin/main` = `cffe39cb9` (wektory: `gra/src` + `gra/data` z `git archive cffe39cb9`, Node 22, generatory w
`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-AUTOIMPROVE-PICK-STADNINA-Q1/tools/`: `gen-pick-vectors-cffe39cb9.mjs`,
`gen-relief-vectors-cffe39cb9.mjs`, `gen-terrain-vectors-cffe39cb9.mjs`, `gen-m16-vectors-cffe39cb9.mjs`).

## Wynik rundy 3

| Pozycja | Stan | Wynik |
|---|---|---|
| (a) Stadnina: bramka epoki `STADNINA_FREE_FROM_ERA=3` (r2) | WYKONANE | `P6_8I_ONLY=stadnina`: 0 niezgodnych; stała przeniesiona do `auto_improvements.rs` (test `p6_m16_tables` zabrania literałów liczbowych w `improvement_build.rs`) |
| (b) `pick.json` z weba cffe39cb9 | WYKONANE | 5128 scenariuszy; `p6_8i_pick`: **5 passed, 0 failed** (pełny bieg 551 s albo 2 partie `P6_8I_SHARD=0/2`, `1/2`: 209 s + 185 s) |
| (b) 4 przywrócone scenariusze (rnd-961, ra-rnd-1, ra-rnd-24, ra-rnd-247) | ZGODNE | wszystkie 4 zielone; wszystkie wymagały portu D2 (hodowla poza rzeką) |
| (c) Jeden pin `cffe39cb9` | WYKONANE | `p6_8i_pick`, `p6_8i_relief`, `p6_repin_autoimpr_terrain` (terrain/gate/roadplan), `p6_m16_*` (qualifier, gallery, rules, common) — `grep 180c08305` w `tests/*.rs` tych plików: 0; nazwy testów pinu: `vectors_pin_is_web_main_cffe39cb9` |
| (d) M16 `droga` | WYKONANE | `SUPERSEDED_KEY` usunięty z `p6_m16_qualifier.rs`; `qualifier.json` zregenerowany z cffe39cb9: 482 wpisy `"key":"droga"` (dawniej 502, pin edb8fb56), `droga` porównywana na każdym heksie/stanie; 4 testy `p6_m16_qualifier` zielone |
| Klasyfikacja 947 niezgodności | WYKONANE | niżej |

## Klasyfikacja 947 niezgodności (Rust r2 vs web cffe39cb9)

Metoda: ablacja trzech portów (skrypt `tools/classify/classify-947.py`, wyniki `tools/classify/abl-*.txt`,
tymczasowe wyłączniki `ABL` w `tools/classify/abl-hooks.patch` — NIE ma ich w kodzie końcowym). Baseline
(wszystkie 3 porty wyłączone) odtworzył dokładnie **947** niezgodnych (`baseline-bad-947.txt`). Dla każdego scenariusza:
które pojedyncze wyłączenie portu przywraca niezgodność = port jest niezbędny.

| Port (commit weba) | Przyczyna | Scenariuszy zależnych | Rodziny (przykłady) |
|---|---|---|---|
| D2 `a4396c3d8` (Q2 r1) — `auto-improvements.ts` `qualifies`: bydło poza rzeką tylko na farmie, owce/lama bez wymogu rzeki; usunięty `!onRiverHex` w `hexHasPotential` | bydło/pastwiska | **835** (B) | rnd 158, rcd-b 144, ci 74, ra-rnd 70, rc-rnd 26, hc 16; m.in. rnd-961, ra-rnd-1, ra-rnd-24, ra-rnd-247 |
| D3a `9420ae1da` (Q2 r2; sprawca błędu `cf236dafc`) — `pickAutoImprovementsStaged`: kaskada etapów E1-E6 po wyczerpaniu etapu (zamiast `break` po pierwszym etapie z pickami) | kolejność etapów | **279** (A) | rnd, stg, rc-rnd, rp, fort, kz-gory-*, ai-max1 |
| D3b `a4396c3d8` — `unlimitedBudgetProbe`: sonda „etap czeka na Pracę” pomija miasta o efektywnym % puli = 0 | inne (sonda) | **11** (C) | ra-rnd-213, ra-rnd-66, rnd-1117, rnd-87, stg-210 |

Rozkład wyłączny (które pojedyncze porty są niezbędne): tylko B 662; A+B 167; tylko A 107; tylko C 5; A+B+C 5; B+C 1
(razem 947). Stadnina (r2) i droga (`8064ad744`) nie dają niezgodności pick — stadnina zamknięta w r2, droga dotyczy
M16/qualifier. Nie ma niezgodności „nieklasyfikowanych”.

## Zmiany kodu (partie ≤600 LOC)

Partia 1 (D2, port bydła/pastwisk): `city_phases.rs` +3/−6. Partia 2 (D3a kaskada + D3b sonda): `pick.rs` +50/−19.
Stała stadniny: `auto_improvements.rs` +4, `improvement_build.rs` +2/−1. Testy: `p6_8i_pick.rs` (+27/−4: `P6_8I_SHARD`,
`P6_8I_NAMES`, pełne nazwy w `P6_8I_LIST`), `p6_m16_qualifier.rs` (−19), `p6_repin_autoimpr_terrain.rs` (+33/−3, dług niżej).

## DŁUG (jawny)

1. **Łodzie rybackie 6/6/6** (web `R-WEB-FISHING-BOATS-YIELD-6-6-6-Q1`): wektory `terrain.json` cffe39cb9 kodują bonus
   `lodzie_rybackie` = 6/6/6; dane Rust (`data/terrain-improvements.json`, poza allowlistą) zostają 2/3/3, bo starsze wektory pinowane
   (`economy_city_vectors_r3/r4`, `p6_23_improvements`) koduje 2/3/3 (próba zmiany danych: 4 FAIL w tych binarkach — wycofana).
   Pominięto w `p6_repin_autoimpr_terrain.rs`: `improvementBonusForKey` 17, `applyImprovementBonus` 51, `applyImprovementBonuses` 13
   przypadków (łącznie 81; liczby wymuszone `assert_eq!` — test jest zielony i nie maskuje innych kluczy). Wymaga osobnego tematu
   REPIN ekonomii (dane + regeneracja starszych wektorów).
2. `p6_m16_doc.rs` (inwentarz symboli `improvement-build.ts`) nadal cytuje inwentarz z `edb8fb56` w komentarzu; nowe symbole weba
   `roadAdjacencyOk`/`roadBuildBlockReason` są pokryte w `p6_repin_ai_drogi_qualifier.rs`. Test zielony, brak pinu wartości.
3. Pełny `p6_8i_pick` trwa 551 s (limit wywołania 590 s) — zalecane uruchamianie partiami `P6_8I_SHARD=k/2`.

## Bramki

`cargo fmt --check` OK; `cargo clippy --all-targets -- -D warnings` OK; `cargo test --no-fail-fast` partiami: lib + 348 binarek
testowych bez `p6_8i_pick` = 2564 passed, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, istniejący generator, nie nowy);
`p6_8i_pick` 5 passed 0 failed (2 partie). Brak nowych `#[ignore]`.
