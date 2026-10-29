# Final Control — wspólny kandydat ustawień i priorytetów żywności

Werdykt: **PASS-WITH-NOTES**, etap 8/11. Kandydat: `autobot/integration-settings-20261029`.

## Zakres i skład

- Przesunięcie ustawień udziału lądu/ofert oraz zachowanie trudności miast-państw.
- Ustawienie trybu bitew: zawsze dostępny wybór w trybie mieszanym, auto-only omija modal, ręczna bez wodza nadal prowadzi do pola bitwy z rozstrzygnięciem Auto; wersjonowanie chroni stare zapisy.
- Priorytety ulepszeń żywności: przygotowanie lasów nad rzekami → farmy → trzoda → irygacja/tarasy → pozostałe ulepszenia żywności.

## Dowody końcowe na kandydacie

- Chromium: `newgame-settings-layout-reposition-test.cjs` PASS; wspólnie potwierdza rozmieszczenie, land/diplomacy/battle persistence i game-start params.
- `battle-mode-save-reload-contract-test.cjs` PASS dla obu nowych trybów oraz starego zapisu.
- `battle-manual-choice-contract-test.cjs` 12/12; `pre-battle-defender-retreat-test.cjs` PASS; `battle-mode-choice-labels-test.cjs` PASS.
- `ai-food-improvement-priority-stages-test.cjs` 11/11; `ai-improvements-test.cjs` 53/53; `auto-improvements-test.cjs` 45/45.
- TypeScript PASS; pełny Vite build: 918 modułów PASS; `git diff --check origin/main...HEAD` PASS po usunięciu pustego wiersza końcowego rejestru.

## Ograniczenia

- Nie wykonano jednego pełnego live gameplay save→load→battle w Chromium dla obu ustawień; serializację/odtworzenie ustawień pokrywa produkcyjny contract roundtrip.
- Test tooltipów przez `file://` pozostaje zablokowany przez Chromium `ERR_BLOCKED_BY_ADMINISTRATOR`; nie dotyczy zmienionych kontrolek, a właściwy test UI używa HTTP.

Decyzja: gotowe do merge do lokalnego `main`. Deploy i push wstrzymane do zakończenia pozostałych zarejestrowanych poprawek, zgodnie z celem wspólnego wydania.
