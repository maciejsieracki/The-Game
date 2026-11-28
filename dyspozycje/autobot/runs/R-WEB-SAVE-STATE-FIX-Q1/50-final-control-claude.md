STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-STATE-FIX-Q1
GOAL: zapis i odtworzenie aiWonderStuckTurnsByOwner i aiGarrisonUnitIdByOwner (opcjonalne pola meta, stary zapis OK) + przebadanie pozostalych pozycji audytu
ZMIERZONE-NA: kandydat c6e5ea55fae7461162705263755486abc3535c65 (baza aaae7b4f811c87a56bcb4ec7d4841d3ae3147419)
ZMIANY/COMMIT:
- merge-base --is-ancestor aaae7b4f8 c6e5ea55f: OK.
- diff --stat (5 plikow, +375): gra/src/main.ts (+21), gra/tools/save-load-ai-state-fields-test.cjs (+160, nowy), dyspozycje/analizy/ZAPIS-STAN-POPRAWKI-2026-11-28.md, runs/.../10-operator-claude.md, 30-obrona-claude.md. Wszystko w allowliscie; brak gra/data, WERSJE.md, rust-port.
- main.ts: zapis obu pol w meta (Array.from(map.entries()), 42917-42924); clear garnizonu przy resecie swiata (51332); w restore clear -> odczyt -> set z guardem ?.length, kolejnosc set(oid,wartosc) poprawna (53118-53128). Stary zapis = pusta mapa. Brak zmian logiki gry.
TESTY (wlasne uruchomienia, node_modules zainstalowane npm ci w worktree; surowe wyniki):
- tsc --noEmit: exit 0
- save-load-ai-state-fields-test: 29 PASS / 0 FAIL (18 mutacji czerwonych, T5 prog 1.6667 vs 1 = zgodne z 1,667/1,000)
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace-test 21/21; combat 6/6; ai-test 297/0; early-grace-15 33/0; society-breakdown 56/0; ai-city-order-need-wiring 267/0; save-load-ai-cs-absorption-state 27/0; save-load-podzial-pracy-representation 5/0
OCENA ZARZUTOW:
1. (mutacje T2) PRZYJETY i naprawiony przez obrone (T2b + 3 mutacje/pole); potwierdzone: 29/0.
2. (test live 4c, warstwa B) NIE ZMIERZONO (brak Chromium w worktree; obrona to uczciwie opisala). Oddaj jako uwage: skutek w grze B==A przy liczniku > 0 niezmierzony; zmiana jest mala i wzorowana na AICSFIX, ryzyko niskie.
3. (brak SHA w raporcie) drobne, oddane (SHA w polu sha obrony).
BLOKADY: brak Chromium -> live NIE ZMIERZONO. DECISION_REQUIRED z rundy 1 (pendingForeignSpawnCities / pendingSameTypeRival* niezapisywane) otwarte dla wlasciciela.
UWAGI-DLA-ORKIESTRATORA: (a) przed deployem/FALA 938 zalecany test live 4c na maks. (rivals 9, civTypes 14, Trudny) przy dostepnym Chromium; (b) DECISION_REQUIRED o kolejkach pendingForeign*/pendingSameTypeRival* do redakcji pytania ABC wg zasad; (c) bramka dispatchu "unit-replace 21" = unit-replace-test.cjs (ai-unit-replace-same-rules ma 45).
RUNDY: 2/5 (operator r1, obrona r2), FC 1
NASTEPNY KROK: integracja orkiestratora (merge c6e5ea55f), ewentualnie live 4c, FALA 938
DEPLOY/PUSH: NIE WYKONANO
