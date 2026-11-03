STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ECON-TICK-HEAL-MAXHP-Q1
GOAL: zrodlo `getMaxHp` dla leczenia jednostek w ticku ekonomii (dlug -Q7 pkt 4), 1:1 z webem (pin `4bbef081d`), baza `b0057c1c9`.

ZMIANY/COMMIT: kod+dowody `4cd71f94f` (WIP `897a1130e`), baza `b0057c1c9`.
* NOWE: `domain/unit_health.rs` (`effective_max_hp`, `round_card_stat`, `unit_health`, `unit_health_value`, `norm_field_val`, `js_parse_float`, `veteran_*`, `heal_max_hp`, `UnitHealthSource::as_get_max_hp` nad `UnitRecord`), `tests/p6_heal_maxhp_wire.rs` (9 testow) + `tests/p6_heal_maxhp_vectors/maxhp.json` (0,7 MB), doc `dyspozycje/rust-port/p6/P6-ECON-TICK-HEAL-MAXHP.md` (tabela lancucha 100%, zalozenia Z-HM-1..4, dlug).
* ISTNIEJACE (diffy w commicie): `domain/mod.rs` +1 `pub mod`; `turn_economy_advance.rs` pole `get_max_hp` -> `&dyn Fn(&str, &ManpowerHealUnit) -> f64`, wrapper przekazuje je wprost (wczesniej odrzucal zywa jednostke); `turn_economy_tick.rs` ten sam typ w `HealRequest` (plik spoza allowlisty - ZALOZENIE Z-HM-1); 3 istniejace testy: closure `|t|` -> `|t, _u|` (mechaniczne). `turn_economy_wire.rs`, `trade*.rs`, `gra/**` nietkniete.

WNIOSKI: lancuch to `effectiveMaxHp(unitHealth(def), unitParametryBonusFrac(u), veteranCombatBonusFrac(u))` (`main.ts:34561`); weteran (0/.10/.15/.20) nie istnial w Rust. Pulapka danych: web czyta `health ?? Health`, a `units.json` ma oba klucze rozne w 49/75 wierszy (Wojownik 22 vs 60) - Rust uzywa `health_lc`.

TESTY:
* `cargo test --test p6_heal_maxhp_wire`: 9/9; z URUCHOMIONEGO weba (generator z czystego `git archive`, esbuild w `mktemp -d`): 148 `normFieldVal`, 196 `unitHealth`, 1176 `effectiveMaxHp`, weteran/parametry, 390 closure na 75 wierszach, 400 scenariuszy e2e (343 leczace, 1640 wywolan `getMaxHp` w kolejnosci weba, HP, `onUnitHpChanged`, pule MP) - bit w bit.
* Weryfikator `verify-p6-heal-maxhp.py` (`python3 -I`): 6283 sprawdzen, 0 rozbieznosci; kontrola negatywna 871 rozbieznosci (wykryta).
* Mutacje: 38, zabitych 32, rownowaznych 6 (dowody w doc sek. 5), COMPILE 0; brutto 84,2%, netto 100%.
* Bramki (logi z jedna linia `EXIT=`): fmt 0, clippy `--all-targets -D warnings` 0, `diff --check` po `add -N` 0, pelny `cargo test -j 2` (lib + 6 shardow): 2066 passed / 0 failed (baza 2057/0 + 9).

BLOKADY: brak. NIE_ZMIERZONO: e2e przez `run_economy_tick_for_game` z adapterem (sciezka `advance_manpower_heal` ta sama co w ticku); PRZED w osobnym worktree nie powtarzano (baza 2057/0 z Q6, PO = 2066 = +9 nowych). `normFieldVal`/`unitHealth`/closure przepisane z `main.ts` (nieimportowalny), oznaczone numerami linii. Nieskomitowany `Cargo.lock` pominiety. Dlug -Q2 w doc sek. 7 (stan `RuntimeUnit`, HP bitwy `combat.ts:925`).

RUNDY: 1/5

NASTEPNY KROK: Evaluator R1 (sprawdzic: zgodnosc przepisanych funkcji z `main.ts:29777,29877,34561`, zalozenie Z-HM-1 i zmiana typu `get_max_hp`, dowody mutantow rownowaznych H10/H11/H21/H26-28).

DEPLOY/PUSH: NIE WYKONANO
