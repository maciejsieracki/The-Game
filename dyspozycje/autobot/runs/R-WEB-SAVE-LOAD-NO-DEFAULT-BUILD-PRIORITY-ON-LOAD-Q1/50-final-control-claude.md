STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-NO-DEFAULT-BUILD-PRIORITY-ON-LOAD-Q1
GOAL: wczytanie nie dopisuje domyslnej listy budowaPriorytetTypow miastom "zrownowazone"; zapisana lista zachowana; whitelista hash bez tego pola.
ZMIANY/COMMIT: kandydat ca4d3ca2d4d95cf8c200e6c7dec78673321d7325 (potomek bazy 459354a12 -- merge-base --is-ancestor: tak). Diff vs baza: cities.ts (7 linii), ai-economy-measure-run.cjs, save-load-roundtrip-state-drift-test.cjs, nowy save-load-budowa-priorytet-on-load-test.cjs, raporty runs/. Wszystko w allowliscie.
TESTY (wlasny pomiar na kandydacie, npm ci): tsc --noEmit EXIT=0; nowy test regresji 6 PASS/0 FAIL (mutacja na kopii czerwona); load-game-regression 34/0; resource-ledger-save-history 15/0; save-load-ledger-history 4/0; save-load-player-owned-city-test PASS; auto-manage 45/45; auto-manage-ulepszenia-fallback 11/11; save-load-roundtrip-state-drift-test statyczny OK; dynamiczny --turns 16 --save-at 6: seed 4242 10/10 tur rowne, seed 777 10/10 tur rowne, BEZ budowaPriorytetTypow w whiteliscie. Konsumenci (auto-manage.ts:136 ?? fallback, main.ts:9613, cityPanel.ts:11962 ?.length) obsluguja undefined.
ZARZUTY: 1 ODDAL (test dodany w obronie, mutacja czerwona); 2 ODDAL (dynamiczny 10/10 na 4242 i 777 zmierzony przeze mnie); 3 ODDAL (testy (2),(3) pokrywaja stare zapisy z lista i bez, bez wyjatku); 4 ODDAL (kryteria 3-5 spelnione); 5 ODDAL jako uwaga: tools/ai-economy-measure-README.md l.105 nieaktualne, poza allowlista, drobna poprawka dokumentacji; 6 uwaga: legacy migracja priorytet-tylko-zrownowazone -> DEFAULT (cities.ts ~757) niezmieniona, nieosiagalna w zywej grze, zgodna z dispatchem.
BLOKADY: brak.
RUNDY: FC 1.
NASTEPNY KROK: integracja orkiestratora ca4d3ca2d; opcjonalnie poprawic README l.105.
UWAGI-DLA-ORKIESTRATORA: ai-economy-measure-README.md l.105 do aktualizacji.
DEPLOY/PUSH: NIE WYKONANO
