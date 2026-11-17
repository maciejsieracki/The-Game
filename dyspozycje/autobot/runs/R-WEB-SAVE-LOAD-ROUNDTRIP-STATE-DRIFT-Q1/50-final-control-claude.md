STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-ROUNDTRIP-STATE-DRIFT-Q1
GOAL: zapis -> wczytanie -> t+1..t+10 daje ten sam skrot co przebieg ciagly (>=2 ziarna); stare zapisy sie wczytuja; test regresji + mutacja.
ZMIANY/COMMIT: kandydat c1024adc56d992f77f247d96115e36844bcf1c75 (potomek bazy cb29ce7af, is-ancestor OK). Zmiany kodu: gra/src/main.ts (+47, tylko sciezka save/load: orderMultByCity, orderGrowthMultByCity, orderValueByCity, nnsAiOverrides; pola dopisywane warunkowo, odczyt chroniony Array.isArray + clear()), gra/tools/ai-economy-measure-run.cjs (normalizacja stackGroupId w hashu), gra/tools/save-load-roundtrip-state-drift-test.cjs (nowy). Reszta = raporty. W allowliscie.
TESTY (surowe, wlasne): npm ci 0; tsc --noEmit 0; logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; load-game-regression 34/0; git diff --check czysty; test statyczny OK exit 0; mutacja orderMultByCity->orderMultByCityX na kopii main.ts: FAIL(2) exit 1; dynamika (build vite poza repo, save-at 6, turns 16): seed 4242 10/10 rowne, seed 777 10/10 rowne.
ZARZUTY: 1 ODDAL (naprawione w obronie, mutacja czerwona potwierdzona); 2 ODDAL (domyslne --turns 16, 10/10 potwierdzone); 3 DO DECYZJI CZLOWIEKA (budowaPriorytetTypow = ABC; resourceLedgerHistory = #432; jawna whitelista); 4 ODDAL (info, NIE ZMIERZONO wczytania starego zapisu w przegladarce; load-game-regression 34/0); 5 ODDAL (proceduralne). Zero NAPRAW.
BLOKADY: brak. Otwarte (nie blokuja): #432, #433, ABC budowaPriorytetTypow, dlugi horyzont 40-50 tur NIE ZMIERZONO, stary zapis w przegladarce NIE ZMIERZONO.
RUNDY: r3 Operatora, rundy zuzyte wg orkiestratora 4/5 przed FC
NASTEPNY KROK: integracja orkiestratora c1024adc5 (merge, bramki), potem READY_FOR_DEPLOY.
UWAGI-DLA-ORKIESTRATORA: hash runnera pomija budowaPriorytetTypow i resourceLedgerHistory (jawnie); przed integracja sprawdz is-ancestor i diff --stat.
DEPLOY/PUSH: NIE WYKONANO
