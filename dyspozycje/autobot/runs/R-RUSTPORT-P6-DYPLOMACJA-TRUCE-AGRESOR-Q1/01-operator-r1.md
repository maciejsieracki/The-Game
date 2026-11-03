STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1
GOAL: rozejmy, blokada pokoju, bramki wojny, zobowiązania sojusznicze, flaga agresora, casus belli i serializowalny stan pary 1:1 z webem (pin `4bbef081d`), baza `origin/rust-port/parity-v2` `c0e8ee7d5`.

ZMIANY/COMMIT: WIP `ca78d861c`; commit końcowy (gate-logi, mutacje, weryfikator, doc, ten raport) = HEAD gałęzi `wf/p6-dypl-1` (SHA w odpowiedzi orkiestratorowi).
* NOWE: `domain/{diplomacy_truce,diplomacy_aggressor,diplomacy_war_gates,alliance_war_obligation}.rs`, `data/derived/diplomacy-aggressor-params.json` (`cmp` z pinem zgodna), `tests/p6_dyplomacja_truce_aggressor.rs`, `tests/p6_dyplomacja_truce_aggressor_vectors/{truce,gates,honor_treaties,aggressor}.json` (5,6 MB razem), `dyspozycje/rust-port/p6/P6-DYPL-1.md`, narzędzia i logi w katalogu runu.
* ISTNIEJĄCE z diffem: `domain/mod.rs` +4 linie `pub mod`. `diplomacy.rs`, `session.rs`, `state.rs`, `Cargo.toml`, `gra/**`, `WERSJE.md` NIETKNIĘTE. `Cargo.lock` wygenerowany przez cargo i usunięty (poza allowlistą).

MAPOWANIE: każda funkcja ma web plik:linia w nagłówku modułu (tabela w `P6-DYPL-1.md` sek. 1). Zaportowane: 8 funkcji rozejmu/blokady, 5 bramek wojny, `shouldHonorAllianceWarObligation`, 6 funkcji traktatów (`allianceObligations`, `allianceObligationsForWarDeclaration`, `isDefensiveAllianceWarObligation`, `treatiesBrokenByRefusal`, `treatiesBrokenByWar`, `dealsForPair`), 11 funkcji agresora/casus belli + 6 metod singletonu (`AggressorEngineState`), stan pary `PairMetaWeb` z zapisem/odczytem.

DUPLIKAT `diplomacy.rs:2726`: NIE da się reużyć 1:1; różni się od pinu w 3 punktach (is_finite, quantity > 0, brak akcji `rozejm`), zmierzone testem różnicowym. Nowa wersja wierna pinowi, stara bez zmian dla `diplomacy.rs:3182`. DŁUG: przepięcie `evaluate_proposal` w temacie 5.

TESTY:
* `cargo test --test p6_dyplomacja_truce_aggressor` 13/13; wektory z URUCHOMIONEGO weba (esbuild z `git archive 4bbef081d`), ok. 27 tys. przypadków: N-1/N/N+1, NaN, Infinity, undefined, sekwencje singletonu, pełna runda serde stanu pary i `aggressorFlagUntilByOwner`/`casusBelliUntilByPair`.
* Weryfikator `python3 -I`: 117 208 sprawdzeń, 0 rozbieżności (`verify-output.txt`); kontrola negatywna wykryła 2/2 zepsute wyniki (`verify-neg-output.txt`).
* Mutacje: 90 mutantów, 87 zabitych (brutto 96,7%), 3 równoważne z dowodem (#17 `diplomacy_truce.rs` normalize `is_finite`, #48 `alliance_war_obligation.rs` martwa gałąź po `is_alliance()`, #66 `diplomacy_aggressor.rs` `prev >= / >` daje ten sam stan); netto 100%. Jeden mutant (#45) początkowo przeżył; dodano wektory `minTrustHonor` = Infinity/NaN i zabito (wektory poprzednie bit-w-bit niezmienione).
* Bramki: `gate-fmt.txt` EXIT=0, `gate-clippy.txt` (`--all-targets -D warnings`) EXIT=0, pełny `cargo test -j 2` w 8 shardach PO ostatniej zmianie kodu: 2106 passed / 0 failed (`gate-test-full.txt`), baza z audytu 2093/0 + 13. `git diff --check` (po `git add -N`) czysty.

BLOKADY: brak. NIE_ZMIERZONO: PRZED (baza) w tym samym worktree: przyjęto 2093/0 z audytu podziału; brak podpięcia do sesji (poza zakresem).

ZAŁOŻENIA do akceptacji (pełne w `P6-DYPL-1.md` sek. 3): Z-D1-1 `f64`/`Option<f64>`; Z-D1-2 nowy `PairMetaWeb` zamiast edycji `DiploPairMeta`; Z-D1-3 singleton = wartość; Z-D1-4 klucz `js_number_to_string`; Z-D1-5 `rozejm`/`wasal` poza `TreatyKind`; Z-D1-7 funkcje traktatów w `alliance_war_obligation.rs`; Z-D1-8 `trustToRequestingAlly = null` poza modelem.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator R1 (sprawdzić: równoważność 3 mutantów, wektory `PairMetaWeb` wobec zapisu `main.ts:33540`, decyzję o duplikacie bramki walutowej, założenia Z-D1-1..8).

DEPLOY/PUSH: NIE WYKONANO
