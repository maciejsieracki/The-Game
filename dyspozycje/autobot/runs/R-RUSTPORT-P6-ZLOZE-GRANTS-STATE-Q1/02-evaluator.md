STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1 (#104 część 1)
GOAL: pole DiplomacyState::zloze_grants + suspend/deactivate zgodne z pinem 07d2fbd72 (bez wiringu).
ZMIANY/COMMIT: oceniany d2d49a6a4 (baza a381dd13f jest przodkiem). git diff --stat: tylko allowlista (diplomacy.rs, p6_zloze_grants_state.rs, _gen.mjs, vectors.json, 01-operator-r1.md). gra/, Cargo.toml, diplomacy_basket.rs nietknięte; Cargo.lock niekomitowany.
TESTY (odtworzone przez Evaluatora, kody wyjścia):
- cargo fmt --check: 0
- cargo clippy --all-targets -- -D warnings: 0
- cargo test --lib: 0 (114 passed, 0 ignored)
- cargo test --test p6_zloze_grants_state: 0 (7 passed, 0 ignored)
- cargo test --test p6_r7k7b_zloze_sync: 0 (3 passed); p6_zloza_basket: 0 (14); diplomacy, p6_wire_war_diplo, p6_wire_war_dipl_steps, p6_tickdiplo, p6_eliminacja, p6_wire_war_state_owner, p6_r7k7c_owner_pools, p6_dyplomacja_truce_aggressor: wszystkie 0 (brak regresji serializacji stanu dyplomacji).
- Pełne `cargo test` bez filtra: przekroczyło 585 s (NIE_ZMIERZONO w całości; zmierzono wyłącznie testy dotykające DiplomacyState/ZlozeGrant).
- Generator na tekście pina (git show 07d2fbd72, SHA-256 ee1b1aab... zgodny): OK suspend=240 deactivate=200; cmp z commitowanym vectors.json: identyczny bajt w bajt.
- Mutacja (usunięcie kierunku odwrotnego w suspend): suspend_..._matches_pin_vectors i state_methods_delegate FAIL (susp-5) — testy czułe. Mutacja cofnięta.
Przegląd kodu vs pin 331–352: suspend i deactivate semantycznie identyczne (para w obu kierunkach, tylko aktywne, a==b obsłużone i pokryte co 12. przypadkiem). Brak #[ignore], brak osłabionych asercji, liczniki niepustości > 0 obecne. Wektory pochodzą z wykonania tekstu pina (nie ręczne).
Brak wołającego w produkcji: zgodny z dispatchem (kryterium 3), wiring = #104 część 2; brak jawnej zależności od W8.

ZARZUTY (nieblokujące):
1. Klucz stanu serializuje się jako `zloze_grants` (snake_case), a nie `zlozeGrants` z pinu; dispatch wymaga camelCase tylko dla kluczy ZlozeGrant. Jeśli część 2 ma wczytywać zapis webowy 1:1, potrzebny `#[serde(alias = "zlozeGrants")]` — decyzja do #104 cz. 2 (Operator zgłosił to sam).
2. Test (c) nie sprawdza aliasu `zlozeGrants` ani wczytania prawdziwego zapisu webowego z grantami (poza zakresem; konsekwencja zarzutu 1).
3. vector_grants_round_trip_through_json to round-trip własnego typu (słaby dowód parytetu), ale dublowany przez testy (a)/(b) na pinie; nie szkodzi.
4. Generator ma domyślną ścieżkę typescript.js na sztywno (/opt/node22/...); nadpisywalna argumentem/TYPESCRIPT_JS. Kosmetyka.
Brak zarzutów blokujących.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
