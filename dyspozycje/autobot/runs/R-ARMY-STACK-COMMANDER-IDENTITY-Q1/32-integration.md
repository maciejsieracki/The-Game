# Integracja lokalna — R-ARMY-STACK-COMMANDER-IDENTITY-Q1

**Etap 9/11 — zintegrowano do lokalnego `main`.**

- Produkcja + Defense + evaluator r2 + Final Control r2 są w lokalnym `main` (HEAD `578c7058`); źródłowy kod: `armyStackCardIdentity()` używany przez builder HUD.
- Na kandydacie opartym o lokalny main przed integracją: Chromium 5/5, w tym 89-kartowy roster oraz produkcyjny serialize/deserialize `isGeneral`; TypeScript PASS; Vite build 918 modułów PASS; diff-check PASS.
- Wódz/Generał jest wyróżniony i wybierany po dokładnym ID, zwykła jednostka tego samego typu zachowuje nazwę typu i nie dostaje oznaczenia.
- Pozostaje ograniczenie: nie przeprowadzono wieloturowego save/load pełnej rozgrywki; sprawdzono roundtrip pola roli w produkcyjnej serializacji.

Deploy do Roboczej i push pozostają na końcu wspólnej fali.
