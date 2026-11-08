STATUS: DECISION_REQUIRED
DOMAIN: GAME (WEB) AI, parametr
TEMAT: R-WEB-AI-PURCHASE-RESERVE-N10-Q1
GOAL: Normal = 10 tur rezerwy (decyzja właściciela); pomiar do T100; test pilnujący 10/3/2. Pomiar pokazuje degenerację AI przy N=10 -> zgodnie z dispatchem (krok 3) nie zmieniam wartości samowolnie, zostaje 10 do decyzji właściciela.
BAZA: 529c66cf7 (claude/aireserve2-fc), worktree wf_94c8c766-b17-3, detach.
ZMIANY/COMMIT: SHA commita podany w raporcie zbiorczym orkiestratora (commit Operatora r1 na tej gałęzi). Allowlista: gra/data/ai-params.json (kupno_jednostki_rezerwa_tur_poziom2: 3 -> 10; Easy 3 i Hard 2 bez zmian; progi dochodu bez zmian), gra/tools/ai-purchase-maintenance-reserve-test.cjs (asercje 10/3/2), dyspozycje/autobot/runs/R-WEB-AI-PURCHASE-RESERVE-N10-Q1/ (ten raport, pomiar/). Zero zmian w main.ts, ai.ts, gra-robocza, WERSJE.md, rust-port, render.
TESTY:
- ai-purchase-maintenance-reserve-test.cjs: 44 passed, 0 failed (po zmianie). Z wartością bazową 3: 40 passed, 4 failed (dowód, że test pilnuje 10).
- logic-test.cjs: LOGIC OK (213/213).
- ai-test.cjs: 274 passed, 20 failed (zgodnie z bazą 274/20; brak nowych failów).
- tsc --noEmit: exit 0.
- Pomiar live (Chromium /opt/pw-browsers/chromium, seed 4242, Maly, 3 AI + państwa-miasta, gracz tylko kończy tury, T100, ta sama instrumentacja dla N=10 i N=3, jedna przeglądarka naraz). Wyniki: pomiar/wynik-analizy.txt, pomiar/n10-T100-seed4242.json, pomiar/n3-T100-seed4242.json.
BLOKADY: brak techniczne. Decyzja właściciela: czy zostaje 10 mimo degeneracji poniżej.
RUNDY: 1/5
NASTĘPNY KROK: DECISION_REQUIRED do orkiestratora/właściciela. Potwierdzić 10 albo wskazać inną wartość (Normal). Po decyzji: Evaluator, Final Control, integracja.
DEPLOY/PUSH: NIE WYKONANO

--- Odpowiedzi na zarzuty (Evaluatora/FC z 00-dispatch) ---
1. Brak commitu -> PRZYJMUJĘ. Zmiany zacommitowane z jawnym git add na allowliście (SHA w zbiorczym raporcie). Worktree wf_94c8c766-b17-3 czysty poza commitem.
2. Brak pomiaru do T100 -> PRZYJMUJĘ. Pomiar wykonany do T100 dla N=10 i N=3 w tej samej instrumentacji (wynik-analizy.txt). Baza (bez reguły) nie była ponownie mierzona w tym przebiegu; dane bazowe z poprzedniego tematu (pomiar/podsumowanie.txt w R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1) traktuję jako odniesienie z zastrzeżeniem, że to inny przebieg.
3. Brak katalogu runu -> PRZYJMUJĘ. Katalog utworzony w tej sesji (ten plik + pomiar/).
4. Raport z "czekam" -> PRZYJMUJĘ. Ten raport jest końcowy; żadnych oczekiwań na zdarzenia.
5. Testy nieodtworzone (esbuild) -> PRZYJMUJĘ. npm ci w gra/ (71 pakietów), testy odtworzone: reserve 44/0, logic 213/213, ai 274/20, tsc exit 0.
6. Zawartość zmian / allowlista -> PRZYJMUJĘ. git diff --name-only ogranicza się do allowlisty (sprawdzone przed commitem).

--- Wyniki pomiaru (AI = owner>0; m = jednostki wojskowe, c = miasta, $ = skarbiec, W = wojna) ---
T20  N=10: suma wojska 15, miasta 11, min skarbiec -5 | N=3: suma wojska 18, miasta 11, min -5
T40  N=10: suma wojska 32, miasta 34, min skarbiec 205 | N=3: suma wojska 110, miasta 33, min 65
T60  N=10: suma wojska 56, miasta 41, min 4923 | N=3: suma wojska 164, miasta 41, min 1083
T80  N=10: suma wojska 57, miasta 48, min 13134 | N=3: suma wojska 172, miasta 48, min 3515
T100 N=10: suma wojska 59, miasta 60, min 17326 | N=3: suma wojska 172, miasta 52, min 12934
Przykład T100: N=10 owner1 m21/c20/$53628 (wojna), owner7 m31/c19/$35939; N=3 owner1 m48/c16/$13502, owner7 m58/c14/$12934.
Tury (owner,tura) ze skarbcem <0: N=10 40/572, N=3 45/582. Min skarbiec: N=10 -10, N=3 -11. Tury w wojnie: 79 vs 79. (owner,tura) z 0 wojsk: N=10 50 (głównie owner 10, wczesne tury), N=3 30. Spadki liczby miast: brak w obu. Owner 10 (1 miasto) znika po ~T40 w N=10 i po ~T60-80 w N=3 (utrata miasta; czy bez walki, harness tego nie rozstrzyga).

--- Dowód degeneracji (krok 3 dispatchu) ---
- Przy N=10 AI nie buduje armii: suma wojska w T60 56 vs 164 (N=3), w T100 59 vs 172 (-66%).
- AI gromadzi złoto zamiast wydawać: owner1 53,6k vs 13,5k; owner7 35,9k vs 12,9k. Reguła rezerwy 10 tur blokuje zakup prawie zawsze.
- Owner 4 w T60: m3 (N=10) vs m61 (N=3).
- Pozytywne: liczba miast AI nie spada, skarbiec nie jest ujemny w trwałych turach, wojny toczą się (79 tur-wojen w obu).
Wniosek: AI przy N=10 nie spada do zera wojska, ale jest ~3x słabsza militarnie i nadmiernie akumuluje złoto. To zgodnie z kryterium dispatchu jest degeneracja (AI bez armii w znaczeniu osłabienia). Nie zmieniam wartości samowolnie; zostaje 10 w pliku, status DECISION_REQUIRED.
Zastrzeżenia: jeden seed, jedna mapa; nie zbadano barbarzyńców (harness nie raportuje ich jako wojsko AI); nie zbadano, czy utrata miasta owner 10 nastąpiła bez walki.
