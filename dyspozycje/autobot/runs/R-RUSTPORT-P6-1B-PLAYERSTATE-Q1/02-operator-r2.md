STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-1B-PLAYERSTATE-Q1
GOAL: Obrona r2 po FAIL Evaluatora r1 (commit 95883b31): zarzuty 1-7 rozpatrzone.

ZARZUTY:
1. PRZYJMUJE. Poprawne: 32 wiersze x 15 = 480 komorek kosztu; 577 sprawdzen grupy `table` (verify-p61b-r2.log). Poprawiono P6-1B.md §1/§4.2 i symbols-p61b-r1.tsv (wiersz scaledResearchCost). 01-operator-r1.md to historyczny raport r1 (nie edytowany; blad jest tam odnotowany w P6-1B.md §4.2).
2. PRZYJMUJE. mutate-rust.sh przepisany: sciezki wzgledem repo, mutate-subst.py z repo (python -I), oba warianty M9 (M9a rownowazny, M9b zabity) w jednym przebiegu; mutation-rust-r2.log: 13/13 nierownowaznych zabitych + 1 rownowazny.
3. PRZYJMUJE. verify-control-corrupt4-r2.log: 4 zepsute koszty -> 4 rozbieznosci, EXIT=1; verify-p61b-r2.log: 17051 sprawdzen, 0 rozbieznosci, EXIT=0.
4. PRZYJMUJE. research_step pracuje na kopii (research_step_inner), nadpisanie state po sukcesie. Test error_research_step_is_atomic_on_missing_cost; mutacja M11 zabita.
5. PRZYJMUJE. Test table_research_cost_rows_agree_with_tech_json (koszt_bazowy, epoka vs tech.json, bez pinow); mutacja M13 zabita.
6. PRZYJMUJE. `#[serde(rename = "researchQueue", default)]`; test serde_missing_research_queue_defaults_to_empty; mutacja M12 zabita.
7. ODNOTOWANE (P6-1B.md §4.12): tempo spoza osi tabeli -> MissingResearchCost; fallback nalezy do P6.2/P6.20.
8. Bez zarzutu.

TESTY: fmt EXIT=0; clippy -D warnings EXIT=0; cargo test EXIT=0, 425 ok / 0 failed (406 + 19). Pelne logi: gate-*-r2.log.
BLOKADY: brak
RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO
