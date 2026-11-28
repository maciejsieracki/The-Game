STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-BLOCK-PRE-CAPITAL-Q43B (tag SAVEBLOCKQ43B)
GOAL: przed założeniem pierwszego miasta (stolicy) zapis gry niedostępny z komunikatem „Zapis niedostępny przed założeniem pierwszego miasta”; po stolicy bez zmian; wczytywanie nieblokowane (decyzja Q43 = B).
BAZA: 42992edde48ccf32da3065ebf4924cafa291371e (origin/main), merge-base OK (worktree detached od bazy).
ZMIANY/COMMIT: patrz SHA w polu `sha` raportu StructuredOutput (commit operatora na gałęzi detached).
  - gra/src/main.ts: nowe `isSaveBlockedByFirstCity()` (per fotel ludzki, isAwaitingFirstPlayerCity) i `notifySaveBlockedByFirstCity()`; bramki w `persistSaveToSlot`, `doQuickSave`, `openSaveGameDialog` (+ gałąź komunikatu w `onSave` dialogu), `doRotatingAutosave`. Wczytywanie bez zmian. Format zapisu bez zmian.
  - gra/tools/save-block-pre-capital-test.cjs (nowy): test statyczny z 9 mutantami semantycznymi.
  - dyspozycje/analizy/ZAPIS-BLOKADA-PRZED-STOLICA-2026-11-28.md (stan wiążący, ścieżki zapisu, predykat, hotseat, NIE ZMIERZONO).
  - dyspozycje/autobot/runs/R-WEB-SAVE-BLOCK-PRE-CAPITAL-Q43B/10-operator-claude.md (ten raport).
TESTY:
  - tsc --noEmit: EXIT=0
  - logic-test: LOGIC OK (213/213)
  - tech-tree-test: 20 pass, 0 fail
  - research-test: PASSED 33 / FAILED 0
  - unit-replace-test: 21/21
  - combat-test: 6/6
  - ai-test: 297 passed, 0 failed
  - save-load-ai-cs-absorption-state-test: 27 PASS / 0 FAIL
  - save-load-ai-state-fields-test: 29 PASS / 0 FAIL
  - save-block-pre-capital-test (nowy): PASS=26 FAIL=0; mutanty 9/9 czerwone
  - battle-save-disabled-test: 8 PASS / 0 FAIL; pre-battle-save-test OK; fsa-autosave-test 55/0; autosave-quota-fail-test 22/0; save-load-player-owned-city-test PASS; save-load-sort-test 4/4; save-load-ledger-history-test 4/0; save-load-budowa-priorytet-on-load-test 6/0; saveload-hud-cache-hotseat-wiring-test 9/0; hotseat-etap7-saveload-test 59/0; resource-ledger-save-history-test 15/0; recruit-rally-default-save-test PASS
  - save-load-deserialize-fields-audit i save-load-roundtrip-state-drift-test: NIE URUCHOMIONE POPRAWNIE (wymagają --dist / argumentów; nie są bramką tego tematu)
  - LIVE (Chromium, dist vite w /tmp, Trudny, rivals=9, civTypesCount=14): NIE ZMIERZONO. Wejście do gry i awaitingFirstCity()=true osiągnięte; Ctrl+S (keyboard i dispatchEvent) nie dało żadnej reakcji w konsoli ani DOM, także po foundFirstCity(). Test nie rozstrzyga blokady. Menu pauzy live nie testowane. Continuity B==A ≥6 tur nie uruchomione.
BLOKADY: brak blokad technicznych. Live Ctrl+S wymaga dalszego debugu harnessu (listener klawiatury).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o FC (zmiana kodu gry, FC wymaga live-dowodu lub jawnej decyzji o pominięciu live). Proponuje się rundę 2 operatora tylko na debug harnessu live (Ctrl+S) — bez zmian w logice gry.
UWAGI-DLA-ORKIESTRATORA:
  - Bundle zawiera teksty komunikatów; przy szukaniu w DOM trzeba filtrować SCRIPT/STYLE (inaczej fałszywe trafienia).
  - Gating listenera Ctrl+S (gra/src/main.ts ok. linia 50234) — warto zbadać, czemu zdarzenie klawiatury nie dociera w harnessie.
  - Zapis po założeniu stolicy w hotseat (drugi fotel) — predykat sprawdza wszystkie fotele; decyzja w analizie (założenie 1).
DEPLOY/PUSH: NIE WYKONANO
