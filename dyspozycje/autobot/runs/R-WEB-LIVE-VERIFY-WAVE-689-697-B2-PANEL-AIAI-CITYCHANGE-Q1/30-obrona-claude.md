STATUS: BLOCK (częściowo: P1 DOM PASS, P1 zrzuty NIE_ZMIERZONO, P2 FAIL, P3 NIE_ZMIERZONO, P4 NIE_ODTWORZONO; patrz tabela)
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1
GOAL: żywa gra (Chromium, ?civTest=1, tryb przyspieszony) — P1 panel dyplomacji gracz↔AI (zmęczenie/desperacja DOM + zrzut bez nakładki, ≥2 ziarna), P2 wojna AI↔AI ≥16 tur, P3 zmiana właściciela miasta (+10%), P4 anomalia „neutralni/240 s” (wariant bez trybu przyspieszonego). Odpowiedź na 8 zarzutów Evaluatora (d13f620).

BAZA: origin/main 8e97928df; kandydat startowy 59fb011e6 (r1 Operatora). Zmiany gra/src i gra/data: ZERO.

ZMIANY/COMMIT:
- NOWY runner: gra/tools/live-verify-wave-689-697-b2-panel-run.cjs (allowlista b2-*.cjs). Tryby SCEN=war|aiwar|speed. Odczyt karty AI przez __truceTestDebug.openAudience (ta sama ścieżka co klik w kartę), zrzuty, checkpoint JSON po każdej turze.
- SETUP odkrycia AI: __aiTradeWiringTestDebug.prepare(ai) PRZED realnym declareWar (karta AI bez odkrycia pokazuje „Brak danych audiencji” — zmierzone w runie 1 r2). Skutki uboczne prepare (istniejący hak W4): tech Wymiany obu stron, skarbiec AI ≥300, wyciszenie cooldownów handlu AI. Brak zmian w logice gry.
- Wojna gracz↔AI: __truceTestDebug.declareWar(ai, me) (ownerDeclareWarOn, nie setWar). Wojna AI↔AI: __truceTestDebug.declareWar(a0, a1).
- Dowody (dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1/):
  b2-war-seed271828.json, b2-war-seed271828-rep.json (powtórka), b2-war-seed314159.json, b2-aiwar-seed271828.json, b2-aiwar-seed314159.json, b2-speed-seed271828.json (T2–T5), b2-speed-seed271828-T22.json (T2–T22), b2-war-seed271828-clean.json (próba czystego zrzutu, nieudana), b2-*-T*-aud1.png (zrzuty karty AI), probe-seed271828.json (r1, ścieżki bezwzględne zastąpione <WT>), 10-operator-claude.md (r1, BLOCK).
- Wszystkie JSON: ścieżki bundla zastąpione <BUNDLE>. Brak ?playtest=mapa, brak grantPlayerGold (nnsGrants puste we wszystkich plikach).

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. Zrzuty T5/T10/T16/T20 zasłonięte nakładką „Tworzenie świata” — PRZYJMUJĘ. Dowód: b2-war-seed314159-T16-aud1.png obejrzany: nakładka „Tworzenie świata 7/10 · Rzeki — uzupełnianie, Upłynęło 1:48” nad kartą AI. Nakładka pochodzi z doStartGame (init-script: appendChild w __nnsMeasureDebug.startGame → doStartGame), nie z ?playtest=mapa (URL: ?civTest=1&civSeed=N). Poprawka: runner czeka na zniknięcie nakładki (OVERLAY_START_SEC, domyślnie 60 s; w runie czystym 360 s). Wynik: nakładka znika dopiero ok. 210 s po starcie (10/10 „Pozycje st…”); w tym samym runie pierwszy endTurn po jej zniknięciu nie zakończył się w 120 s (błąd, b2-war-seed271828-clean.json). Czyste zrzuty NIE uzyskane → NIE_ZMIERZONO (powód techniczny; defekt kandydat, nie naprawiany).
2. Runner nie otwiera panelu Dyplomacja; T17+ nieobsłużone — PRZYJMUJĘ. Poprawka: openAudience(ai) przed odczytem DOM; probes 5,10,16,17,18,20 (aiwar: 5,10,16,20,22); odczyt DOM sekcji „Relacje z Tobą”. Wynik: zmęczenie/desperacja odczytane (patrz P1-DOM).
3. Tylko ziarno 271828; brak powtarzalności — PRZYJMUJĘ. Dodano ziarno 314159. Powtarzalność: b2-war-seed271828-rep.json vs b2-war-seed271828.json: digesty tur 2–23 równe 22/22, odczyty DOM równe 6/6. Ziarna są różne: digesty 271828 vs 314159 równe 0/22.
4. P2 niepodjęte, „brak hooka” nieprawdziwy — PRZYJMUJĘ. Hak istnieje (ownerDeclareWarOn dla dowolnych owner id). Wykonano declareWar(AI1, AI2) w turze 1 (aiwar), na obu ziarnach. Wynik: wojna trwała do pokoju zawartego przez AI (patrz P2) — kryterium ≥16 tur nie spełnione.
5. P3 „bez działań wojskowych” nie jest powodem technicznym — PRZYJMUJĘ. Powód techniczny (poprawiony): w tej ścieżce startu AI nie zakłada miast — cities w świecie = 1 (miasto gracza) przez tury 2–23 na obu ziarnach (rec.cityCounts: me=1, ai0=0, citiesLen=1). Brak miasta AI = brak celu oblężenia/zdobycia. Zob. UWAGI-DLA-ORKIESTRATORA #2.
6. P4 „240 s” niepodjęte — PRZYJMUJĘ. Wykonano: tryb przyspieszony wyłączony (setFastMode(false)), ziarno 271828, tury 2–22: czas tury 0,3–0.8 s (b2-speed-seed271828-T22.json, turnTiming). Anomalii nie odtworzono — ograniczenie: jedno ziarno, jedna ścieżka wojny, brak AI-miast.
7. Ścieżki bezwzględne do cudzego worktree w JSON — PRZYJMUJĘ. Poprawiono: r1 probe-seed271828.json (<WT>), wszystkie nowe JSON (<BUNDLE>); zrzuty w JSON jako nazwy plików względne.
8. r1 zacommitowano bez wyniku P1 — PRZYJMUJĘ. Wynik P1 (DOM) jest w tej rundzie; zrzuty NIE_ZMIERZONO z powodem.

ODRZUCAM: nic — poza tym, że „brak hooka” (pkt 4) był błędną oceną i jest przyjęty.

WYNIKI KRYTERIÓW (liczby z surowego JSON):
| Punkt | Status | Dowód |
|---|---|---|
| P1 DOM zmęczenie/desperacja, tury 5/10/16/17/18/20, 2 ziarna | PASS (odczyt) | war-271828 i war-314159: zmęczenie 20/45/75/80/85/95%; desperacja 0/0/88/90/93/98% (T5/10/16/17/18/20). Wartości zgodne z regułą +5%/turę od wypowiedzenia (T5 = 4 tury wojny = 20%). Dispatch podawał 25/50/80/100 i 0/75/90/100 — różnica przesunięcia o turę i wartości desperacji zanotowane, nie dopasowywane na siłę. |
| P1 zrzut bez nakładki | NIE_ZMIERZONO | Nakładka obecna na wszystkich zrzutach (war-314159-T16 obejrzany). Czysty run: nakładka znika ~210 s; następny endTurn nie kończy się w 120 s. |
| P1 widoczność propozycji pokoju AI od T17 | FAIL (w zakresie sprawdzonym) | negotiationEntries = 0 w turach 2–23 na obu ziarnach; karta AI T17/T18/T20: brak propozycji AI, przyciski „Zaproponuj pokój” zablokowane („zablokowany — trwa wojna”). Panelu powiadomień NIE sprawdzono (NIE_ZMIERZONO w tym zakresie). |
| P1 ≥2 ziarna + powtarzalność | PASS | 271828 i 314159; 271828 powtórzone: digesty 22/22, DOM 6/6. |
| P2 wojna AI↔AI ≥16 tur | FAIL | Ziarno 271828: wojna w T5, T10; pokój w T16 (peaceUntilTurn 51). Ziarno 314159: wojna T2–T10, pokój od T11 (pairStates per tura). Zmęczenie w chwili pokoju ~45–50%; ≥0,8 nie wystąpiło. Pokój zawarty przez AI, nie przez runner. |
| P3 zmiana właściciela miasta (+10%) | NIE_ZMIERZONO | Brak miast AI (citiesLen=1 do T23); brak zmiany właściciela; brak ścieżki militarnej w tym czasie. Powód techniczny: UWAGI #2. |
| P4 neutralni/240 s, bez trybu przyspieszonego | NIE_ODTWORZONO | Ziarno 271828, tury 2–22, tryb przyspieszony wyłączony: 0,3–0,8 s/turę (b2-speed-seed271828-T22.json). Jedno ziarno, krótka ścieżka. |
| Zero grantPlayerGold ujemnych | PASS | nnsGrants puste we wszystkich b2-*.json; runner dodaje tylko dodatnie dosypki (B1/W80B), których nie było. |
| Zero ?playtest=mapa | PASS | URL: ?civTest=1&civSeed=N we wszystkich runach. |
| Allowlista, git diff --check | PASS (patrz TESTY) | Nowe pliki: gra/tools/live-verify-wave-689-697-b2-panel-run.cjs + runs/<ID>/**. |

TESTY (surowe wyniki):
- npm ci w gra/: EXIT 0 (71 pakietów, „npm audit” — ostrzeżenia nieistotne dla tematu).
- vite build --outDir <scratchpad>/b2bundle --emptyOutDir: „✓ built in 24.18s”, index.html 14681858 B.
- Runy (stoppedBy / lastTurn / elapsedSec): war-271828 koniec zakresu/23/240; war-271828-rep koniec zakresu/23/150; war-314159 koniec zakresu/23/148; aiwar-271828 koniec zakresu/23/137; aiwar-314159 koniec zakresu/23/136; speed-271828-T22 koniec zakresu/23/152; war-271828-clean blad endTurn (timeout 120 s)/—/341.
- Błędy strony (pageErrors): 0 we wszystkich runach poza „clean” (błąd endTurn po zniknięciu nakładki, nie błąd strony).
- Digest porównanie: powtórka 22/22; 271828 vs 314159 0/22.
- git diff --check (nowe pliki staged): patrz sekcja DEPLOY/PUSH / log wykonania.
- tsc i testy referencyjne: NIE uruchamiane — brak zmian w gra/src ani gra/data.

BLOKADY:
- Czysty zrzut P1: nakładka do ~210 s i brak odpowiedzi endTurn w 120 s po jej zniknięciu (UWAGI #1).
- P2/P3: AI nie zakłada miast w tej ścieżce; AI kończy wojnę pokojem przy ~50% zmęczenia.

RUNDY: 2/5 (r1 BLOCK d13f620-zarzuty; r2 = ta odpowiedź).

UWAGI-DLA-ORKIESTRATORA (defekty kandydaci — NIE naprawiane w tym temacie):
1. Nakładka „Tworzenie świata” po startGame (doStartGame, bez ?playtest) trwa ~210 s (generacja 6/10 → 7/10 → 10/10), zasłania ekran w każdym zrzucie tur 2–23; po zniknięciu pierwszy endTurn nie kończy się w 120 s (b2-war-seed271828-clean.json). Do osobnego tematu (powiązać z R-WEB-WORLD-CREATION-OVERLAY-MIDGAME-DIAG-Q1 i #376).
2. AI nie zakłada miast w ścieżce __nnsMeasureDebug.startGame → foundFirstCity: citiesLen = 1 w turach 2–23 (oba ziarna), info().aiCities = 0. Zbadać przed kolejnymi testami wojen AI/P3. Możliwa przyczyna: AI founding poza zakresem 23 tur lub brak osadników AI (komentarz main.ts ~9794 „bez osadników AI na mapie”) — NIE zweryfikowane.
3. Propozycje pokoju od AI nie pojawiają się w stole/karcie T17–T20 (kandydat #376). Powiadomienia nie sprawdzone.
4. AI↔AI wojna kończy się pokojem przy ~50% zmęczenia (T11 ziarno 314159; T11–T16 ziarno 271828). Zgodne z mechaniką? — do oceny właściciela; nie oceniam.
5. Desperacja AI w war-314159 rośnie do 98% w T20 przy zmęczeniu 95% — zgodne z progami 50/80/100 w docs; wartości nie zweryfikowane z formułą.

ZAŁOŻENIA (luki):
- prepare(ai) jako setup odkrycia (sekcja ZMIANY) — założenie Operatora, zgłoszone.
- Odrzucanie ofert AI blokujących koniec tury PO odczycie każdej tury (kolejność obserwacja → odrzucenie), jak w B1.
- „Zmęczenie wojną” odczytywane z karty AI (sekcja „Relacje z Tobą”), nie z hooka stanu.

NASTĘPNY KROK: integracja/Final Control r2 (Evaluator r2). Dla P2/P3 wymagany osobny temat na AI-miasta (UWAGI #2), dla P1 zrzuty — temat nakładki (UWAGI #1).

DEPLOY/PUSH: NIE WYKONANO
