STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-PLAYER-LASTCITY-REVOLT-Q1 (tag PLRREVOLT)
GOAL: pomiar, czy gracz moze stracic OSTATNIE miasto przez bunt i jak czesto (bez zmiany balansu).
ZMIANY/COMMIT: kandydat cd587eb82 (baza a9e68894e). Sprawdzone: `git merge-base --is-ancestor a9e68894e cd587eb82` = OK; `git diff --stat a9e68894e cd587eb82` = 5 plikow, 228 wstawien, 0 usuniec: dyspozycje/analizy/GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md, runs/.../10-operator-claude.md, 30-obrona-claude.md, analiza-zapisow-aibal2.txt, gra/tools/plrrevolt-analyze.cjs. Wszystko w allowliscie; gra/src i gra/data = 0 zmian; `git diff --check` czysty.
TESTY (wlasne, z surowego wyjscia):
- Kod na a9e68894e potwierdzony grepem: REVOLT_CRITICAL_POR_PCT=12 (society-breakdown.ts:218), REVOLT_GRACE_TURNS=3 (:219), REBEL_FACTION_OWNER_ID=-99 (:232), aiKeepsLastCity = ownerIsAi && ownerOtherCities<1 (:530), warunek `ownerIsHuman || (...)` (:532) => dla gracza brak ochrony ostatniego miasta; BARBARIAN_OWNER_ID=-1 (barbarians.ts:51); main.ts: rebelByPlayer :45254, shouldStartCityRebellion :45260, transfer :45272, galaz gracza :45287, transferCityToRebelFactionWithLedger :41833, pokazEkranPorazki :39043/:49553; victory.ts:215-217 zwraca 'przegrana'. Numeracja linii w poprawionym dokumencie zgodna.
- node plrrevolt-analyze.cjs na danych AIBAL2: 10 wierszy zgodnych z analiza-zapisow-aibal2.txt (V4/4242 playerZeroFromTurn=29, brak cityTransfers z z=0).
- Reczny odczyt V4/4242 t27-t31: t28 owner 0 miasta 1 porPctSuma 49; t29 owner -1 miasta 1 czlowiek 0, cityTransfers {z:21,na:25} (nie z gracza); t30-31 owner -1 "Bunt skrajny", krytyczne 1, osiedle 1. Zgodne z dokumentem. Nowa obserwacja: miasto -1 ma flage `osiedle`, mozliwy trop dla mechanizmu t29 i etykiety "Bunt skrajny" (nie dowod).
- tsc / logic 213 / ai-test 297: NIE URUCHOMIONO (brak gra/node_modules w worktree; nie instalowalem). Kod gry bez zmian, wiec wynik rowny bazie, ale bramka formalnie niezamknieta.
- Poziom maksymalny (zasada testowania): nie dotyczy, brak zywych biegow.
OCENA ZARZUTOW:
1. 9 zywych biegow do t60: NAPRAW. Kryterium binarne dispatchu wymaga tabeli 9 biegow; dane AIBAL2 (inne cele, inne ustawienia) jej nie zastepuja. Obrona sama to przyjmuje i odklada do osobnego tematu, co nie domyka tego tematu.
2. Ziarno 778899 bez pokrycia: NAPRAW (jak 1).
3. Porzadek gracza min: ODDAL - poprawione, kolumna z danych potwierdzona; to odczyt z zapisow, nie z zywej gry, dokument mowi to jawnie.
4. Teza t29 = barbarzyncy: ODDAL - zdowngradowana do wniosku posredniego; kod dowodzi, ze petla buntu nie daje owner -1; mechanizm NIE ZMIERZONO uczciwie opisany. Etykieta "Bunt skrajny" przy -1 nadal niewyjasniona (trop: flaga osiedle).
5. Cel 3 (odtworzenie + skutek w UI): NAPRAW w czesci zywej; czesc statyczna (victory.ts, main.ts) dodana i zweryfikowana, UI NIE ZMIERZONO.
6. Numeracja linii: ODDAL - poprawione, zweryfikowane.
7. Bramki tsc/logic/ai-test: NAPRAW (uruchomic w rundzie ze srodowiskiem z node_modules); uzasadnienie "kod bez zmian" przyjmuje, ale dispatch wymagal bramek.
Wniosek merytoryczny (dokument jest uczciwy): w danych gracz nie stracil ostatniego miasta przez bunt; porzadek gracza min 26,1-49,0% wobec progu 12%; kod nie chroni gracza (aiKeepsLastCity tylko AI), wiec mozliwosc istnieje; czestosc NIE ZMIERZONO. Dokument i narzedzie moga zostac jako baza, ale kryterium binarne niespelnione.
BLOKADY: (a) 9 zywych biegow t60 (kultura gracza x ziarna 4242/7/778899) NIE WYKONANO - brak node_modules, build vite w /tmp i niestabilny Chromium; blokada techniczna, wg procesu wraca do Operatora z tym samym ID; (b) odtworzenie i UI NIE ZMIERZONO; (c) mechanizm przejecia t29 NIE ZMIERZONO; (d) bramki tsc/logic/ai-test NIE URUCHOMIONO.
RUNDY: 2/5 zuzyte (Evaluator FAIL, obecny FC FAIL). Pozostaja 3 rundy.
UWAGI-DLA-ORKIESTRATORA: (1) przed runda 3 zapewnic srodowisko z gra/node_modules i dzialajacym Chromium albo zawezic zakres (runner zdarzen "miasto gracza -> -99/-1 z powodem" + 9 biegow); (2) sprawdzic w kodzie barbarians/osiedla, czy flaga osiedle przy owner -1 wyjasnia t29 i etykiete "Bunt skrajny"; (3) poprawic w rejestrze AIBAL2 opis "owner -1 = bunt" (owner -1 = barbarzyncy, bunt = -99); (4) pytanie ABC o ochrone ostatniego miasta gracza dopiero po pomiarze, wg zasad ABC.
NASTEPNY KROK: runda 3 Operatora (ten sam ID, baza cd587eb82) z zywymi biegami i bramkami; potem Evaluator i FC.
DEPLOY/PUSH: NIE WYKONANO
