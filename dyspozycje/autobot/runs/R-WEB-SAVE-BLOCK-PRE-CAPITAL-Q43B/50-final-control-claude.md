STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-BLOCK-PRE-CAPITAL-Q43B
GOAL: zapis przed stolicą zablokowany z komunikatem "Zapis niedostępny przed założeniem pierwszego miasta"; po stolicy bez zmian; wczytywanie nieblokowane.
ZMIANY/COMMIT: kandydat acf12fb64d82853989094bcfeaf9bff8b558aa03; `git merge-base --is-ancestor 42992edde acf12fb64` = TAK. diff --stat: 8 plików, +455/-0: gra/src/main.ts (+36, tylko bramka isSaveBlockedByFirstCity w 5 miejscach: menu pauzy, callback dialogu, persistSaveToSlot, Ctrl+S, autozapis; loadGameFromSlot nietknięty), tools: save-block-pre-capital-test.cjs (nowy), save-block-pre-capital-live.cjs (nowy), ai-plus10-live-roundtrip-test.cjs (+4), verify-live-growth-toggle-test.cjs (+4), dokument analizy, 10-operator i 30-obrona. Brak zmian w gra/data, WERSJE.md, manifestach, rust-port.
TESTY (własne, surowe wyjście, gra/ na kandydacie, npm ci w worktree):
- tsc --noEmit: exit 0, 0 błędów
- save-block-pre-capital-test: PASS=26 FAIL=0 (mutanty czerwone: odwrócony predykat, zły komunikat, bramka po operacji zapisu, blokada wczytywania itd.)
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- ai-test 297/0; save-load-ai-cs-absorption-state 27/0; save-load-ai-state-fields 29/0
- Testy live (save-block-pre-capital-live, ai-plus10-live-roundtrip, verify-live-growth-toggle): NIE URUCHOMIONE przeze mnie (INFRA środowiska: brak Chromium, pobranie z cdn.playwright.dev odrzucone przez proxy HTTP 403). Polegam na wynikach obrony (live PASS, exit 0 obu przepiętych testów) i dowodzie statycznym.
OCENA ZARZUTÓW:
1 (testy live wołające saveRoundTrip bez stolicy): ODDALONY po poprawce. Sprawdziłem statycznie wszystkie testy z saveRoundTrip: ai-plus10 i verify-live-growth-toggle dostały krok założenia stolicy (wzorzec jak endstall/vlive3/defeat-cause/fortring-measure, które już zakładają stolicę przed zapisem); resource-ledger-realpath i save-load-player-owned-city-live zakładają stolicę, a ich hak saveRoundTrip używa buildSaveGameSnapshot/restoreGameFromSave, nie persistSaveToSlot (main.ts:33750); army-stack, improvement-growth, siege-engines to czyste testy serializacji. Testów nie osłabiono (dodano krok, asercje bez zmian).
2 (brak testu live): ODDALONY - dodano save-block-pre-capital-live.cjs. NOTA: menu pauzy i continuity B==A >=6 tur NIE ZMIERZONO; ścieżka menu pokryta tylko statycznie.
3 (kruchość functionBody): przyjęty i naprawiony; 9 mutantów czerwonych.
4 (hotseat): informacyjny, zamierzone założenie dispatchu (zapis zablokowany, dopóki którykolwiek fotel ludzki bez stolicy), udokumentowane; nie zmierzone live.
BLOKADY: brak blokujących.
UWAGI-DLA-ORKIESTRATORA: (a) trzy pliki gra/tools/*.cjs poza literalną allowlistą dispatchu (save-block-pre-capital-live.cjs nowy; dwa przepięte testy) - uznaję je za konieczne następstwo zmiany i nie osłabiające testów; rekomenduję przyjąć rozszerzenie allowlisty. (b) Przed deployem na ROBOCZĄ krótki live (Ctrl+S przed/po stolicy) na maszynie z Chromium, bo nie mogłem go uruchomić. (c) Efekt w grze: przed założeniem stolicy zapis ręczny jest odrzucany z komunikatem, a autozapis pomijany (ostrzeżenie w konsoli).
RUNDY: FC 1; Operator 2/5.
NASTĘPNY KROK: integracja orkiestratora (merge acf12fb64), decyzja o allowliście, FALA 939 po live na maszynie z Chromium.
DEPLOY/PUSH: NIE WYKONANO
