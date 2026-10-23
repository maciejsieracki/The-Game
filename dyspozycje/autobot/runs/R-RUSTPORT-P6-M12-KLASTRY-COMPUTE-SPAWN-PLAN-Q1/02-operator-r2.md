STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1
GOAL: Port `computeClusters` (`clusters.ts:3373-4250`) i `buildClusterSpawnPlan` (`cluster-spawn.ts`) do Rust, parytet z uruchomionym webem (pin `edb8fb56`) - Obrona po FAIL Evaluatora R1.

ZMIANY/COMMIT: commit w worktree `wf_40eda632-8b0-3` (jawne `git add`, bez push); SHA w odpowiedzi koncowej. Kod produkcyjny (`cluster_compute.rs`, `derived.rs`, tabela JSON) BEZ zmian. Zmiany: `tests/p6_m12_vectors/web-vectors.json` (+24 compute, +13 spawn, +24 mapy; prefiks R1 bajt w bajt), `p6_m12_integration.rs` (+1 test), `p6_m12_spawn.rs`, `p6_m12_vectors/common.rs` (`names_limit`), `p6_m12_tables.rs` (bez pinu relacji i martwej linii), dokument `P6-M12-...md`, skrypty i logi runu.

ZARZUTY:
1. PRZYJMUJE - 17 przebadanych: 7 zabitych wektorami (topup-player-dist-le, topup-centers-local-land, topup-region-lt, repack-final-and, plan-capital-name-swap, table-topup-min-9, table-topup-div-3), 5 rownowaznych z dowodem z kodu (min-dyst-order-sep, fill-centers-player-gate, topup-dedupe-removed, enforce-hard-removed, player-cap-xor-retry), 5 nadal przezywa jako NIE_ZMIERZONO (player-cap-xor-1, plan-dropped-typ-not-skipped, player-growth-reserve-0-initial, player-pending-from-layout, foreign-growth-no-or). Dowod: doc §7, `mutations-r2a.log`, `mutations-r2b.log`.
2. PRZYJMUJE - wartosci top-up pinowane wynikiem weba (`table-topup-*` WYKRYTE).
3. PRZYJMUJE - statusy galezi rozdzielone (doc §6.9): PORTOWANY z wektorem (`forced`/`fixed==null`/`skipNoHex`/`retryNull`/`prefMoved`/`spawnSkipLand`), martwy kod z dowodem (5 wpisow), NIE_ZMIERZONO (wnetrza `if (forced)`, `if (fixed)`, 2 odrzucenia sep w spawnie). R1 bledne co do osiagalnosci - poprawione.
4. PRZYJMUJE jako ograniczenie (doc §9.2 pkt 4), bez zmiany.
5. PRZYJMUJE - asercja relacji i martwa linia usuniete.
6. PRZYJMUJE - `mutations-final.log` (scalony r1 -> r1c -> r2a -> r2b).
7. PRZYJMUJE - `EXPECTED_SURVIVORS` zawezone do wpisow z dowodem.
8. Decyzja orkiestratora - port bez zmian (`Err(DiagnosticRegionMissing)`).

TESTY (surowe logi w runie, kazdy z `EXIT=`): fmt `EXIT=0` (`gate-fmt-r2.log`); clippy `--all-targets -D warnings` `EXIT=0` (`gate-clippy-r2.log`); `cargo test --no-fail-fast` `EXIT=0`, 1011 passed, 0 failed (`gate-test-r2.log`); generator `EXIT=0` (678 compute, 385 spawn, 70 map; SHA-256 `21a5ce34...980b`, determinizm potwierdzony drugim przebiegiem); weryfikator Python 55173 sprawdzen, 0 rozbieznosci, `EXIT=0` (`verify-m12-r2.log`), test negatywny 3 rozbieznosci `EXIT=1`; pokrycie V8 706/776 i 182/204; mutacje: 64 = 52 wykryte + 7 rownowaznych z dowodem + 5 bez dowodu (`mutations-final.log`).

BLOKADY: brak blokad technicznych. 5 mutacji nadal przezywa (luka wektorow, nie blad portu: 0 rozbieznosci). Duplikat `shuffle_in_place_with` (M11) poza allowlista. Decyzja o bledzie weba `regiony[ci]!.length` nalezy do orkiestratora.

RUNDY: 2/5

NASTEPNY KROK: Evaluator R2 w tym samym ID, potem Final Control; zasilenie `build_cluster_start_plan` wynikiem Rust opisane w doc §10 (RUNDA-2 z P6.1C).

DEPLOY/PUSH: NIE WYKONANO
