STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-B-Q1
GOAL: Port nowych modulow web `army-consolidation.ts` (+177) i `ai-general-war-campaign.ts` (+164, pin 91dc998a) do `rust-port/engine/src/domain/{army_consolidation,ai_general_war_campaign}.rs`, wektory z uruchomionego weba, mutacje, dokument tabeli zmian.
ZMIANY-COMMIT:
- 571d33db feat(rust-port): port army-consolidation (flaga, parametry, pickRallyCity, buildRallyCandidates, assignRallyTargets, warArmyCount, splitIntoWarArmies)
- 0c26dcd2 feat(rust-port): port ai-general-war-campaign (7 funkcji)
- 3d75c8b4 docs(rust-port): dokument P6-REPIN-WOJNA-NOWE-B.md, cytaty linii, logi bramek i mutacji
- Allowlista: domain/{army_consolidation,ai_general_war_campaign}.rs (NOWE), domain/mod.rs, data/derived/army-consolidation-params.json (NOWY), tests/p6_repin_wojna_b_* + vectors (NOWE), dyspozycje/rust-port/p6/P6-REPIN-WOJNA-NOWE-B.md (NOWY), run dir. Brak zmian w gra/, renderer/, src-tauri/, Cargo.toml, WERSJE.md, manifestach pinu.
- Wektory: army-consolidation.json (1,57 MB), ai-general-war-campaign.json (2,62 MB), z `git archive 91dc998a gra/src gra/data`, generator `gen-repin-wojna-b-web-vectors.mjs` (sha256 zrodel w polu sourceSha256).
TESTY:
- cargo fmt --all -- --check: OK (fmt-b.log)
- cargo clippy --all-targets -- -D warnings: OK (clippy-b-final.log)
- cargo test --no-fail-fast: 1297 passed / 0 failed (baseline 1284 + 13 nowych; test-b.log)
- Nowe testy wektorowe: p6_repin_wojna_b_army_consolidation (6), p6_repin_wojna_b_ai_general (7); 0 rozbieznosci z webem.
- Mutacje: 28 zmian w galeziach sterujacych (G01-G18, A01-A10), 28 KILLED, 0 SURVIVED (mut-b-*.log).
- git diff --check: czysty.
BLOKADY: brak.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet 5.5) weryfikuje tabele zmian i mutacje; Final Control; integracja orkiestratora. Kolejne partie (osobne ID): ai-move-range.ts, diplomacy-tick-war-brake.ts, WOJNA-ZMIANY.
UWAGI (ZALOZENIA):
1. Commit cadence: partia 1 (army) to 4 zmiany w jednym commicie, zgodnie z dispatchem. Partia 2 (ai-general) to 7 funkcji w jednym commicie, a nie <=4 osobnych; kazda funkcja ma wlasny zestaw wektorow i mutacji, wiec zmiana nie wplywa na dowod, ale odstepstwo jest jawne.
2. Flaga webu (zmienna modulu) przeniesiona do argumentu `flag_override: Option<bool>`; brak stanu globalnego.
3. `GameMap.hexes` + `terrainMoveCost` zastapione mapa `hex_costs` (obecnosc = klucz w hexes, wartosc = koszt; Infinity = nieprzejezdny). `terrainMoveCost` nie jest portowane w tym temacie; wektory generowane na obiektach `{terenBazowy}` bez rzeki/lasu/drog.
4. Sortowanie napisow: kody UTF-16 (jak `<` w JS). Wartosci distance/strength zakladane skonczone; NaN NIE_ZMIERZONO.
5. Loader do uruchomienia weba (hooks.mjs, register.mjs) jest w run dir; wymaga `typescript` z /opt/node22 i katalogu WEB_ROOT poza repo.
DEPLOY/PUSH: NIE WYKONANO
