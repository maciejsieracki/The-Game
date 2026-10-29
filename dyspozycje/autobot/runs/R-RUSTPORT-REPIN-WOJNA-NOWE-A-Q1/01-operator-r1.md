STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-A-Q1
GOAL: REPIN krok 2a, czesc A - port od zera trzech NOWYCH modulow weba (pin 91dc998a) do rust-port/engine/src/domain/: formation_rules.rs, army_leadership.rs, ai_era_unit_promotion.rs z cytowaniami web file:line, wektorami z uruchomionego weba i testami.
ZMIANY/COMMIT: 9a042fac (kod, dane derived, wektory, testy, dossier). Allowlista zachowana; zero zmian w gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md. Cargo.lock wygenerowany lokalnie, NIE zacommitowany. Dossier: dyspozycje/rust-port/p6/P6-REPIN-WOJNA-NOWE-A.md (tabela zmiana -> web -> Rust -> test).
  Web: gra/src/battle/formationRules.ts (A), gra/src/game/army-leadership.ts (A), gra/src/game/ai-era-unit-promotion.ts (A) - wszystkie nowe w 91dc998a.
  Rust: src/domain/formation_rules.rs, army_leadership.rs, ai_era_unit_promotion.rs; mod.rs +3 linie `pub mod`.
  Dane: data/derived/formation-role-keywords.json, data/derived/war-leadership-params.json.
  Wektory (generator: dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-NOWE-A-Q1/gen-repin-wojna-a-web-vectors.mjs, node --experimental-strip-types na drzewie git archive 91dc998a poza repo): tests/p6_repin_wojna_a_vectors/{formation-rules,army-leadership,ai-era-unit-promotion}.json (1.59 MB / 1.39 MB / 0.27 MB; SHA256 zrodel w naglowku).
TESTY:
  - cargo test --test p6_repin_wojna_a_{formation,leadership,promotion}: 12/12 ok.
  - cargo test --no-fail-fast (rust-port/engine): 1277 passed / 0 failed (baseline 1265 + 12). Log: run/test-r1.log, EXIT=0.
  - cargo clippy --all-targets -- -D warnings: EXIT=0 (po poprawce manual_contains). Log: run/clippy-r1.log.
  - cargo fmt --all -- --check: EXIT=0. Log: run/fmt-r1.log.
  - git diff --check: czysty.
  - Mutacja kontrolna compact line (+1.0 -> +2.0): test zabity (FAILED), kod przywrocony.
BLOKADY: brak blokad technicznych.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet 5.5) - weryfikacja wektorow (ponowne uruchomienie generatora na 91dc998a daje te same pliki) i tabeli zmiana -> plik:linia. Nastepnie Final Control. Integracja wylacznie przez orkiestratora.
ZALOZENIA (luki rozstrzygniete zalozeniem, nie pytania):
  - Normalizacja diakrytykow: Latin-1 + Latin Extended-A (zakres PL). Pelny Unicode: NIE_ZMIERZONO.
  - Wspolrzedne siatki i progi calkowite; NaN w wejsciach ukladu: NIE_ZMIERZONO.
  - commandersToWithdrawAfterArmyBreak zwraca indeksy zamiast obiektow.
  - promoteAiUnitForEra: deps jako trait, epoka liczbowa po stronie adaptera; hp null == undefined (??).
  - Mutacje poza jedna kontrolna (12 w tym temacie): NIE_ZMIERZONO.
DEPLOY/PUSH: NIE WYKONANO
