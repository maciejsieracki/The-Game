STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B1-AI-PEACE-GATE-TRACE-Q1
GOAL: rozstrzygnąć w żywej grze, dlaczego AI nie wysyła graczowi bezwarunkowego `zaproponuj_pokoj` przy zmęczeniu wojną >= 0,8 (od tury 16 wojny).
ZMIANY/COMMIT: hak read-only + ślad (gra/src/main.ts, wyłącznie gdy `peaceTraceState.on`, ustawiany tylko hakiem przy ?civTest=1); runner gra/tools/live-verify-wave-689-697-b1-peace-trace.cjs; dowód evidence-seed271828-obrona-r2.json. SHA: patrz sekcja „SHA” na końcu. Brak zmian logiki gry, brak zmian gra/data, WERSJE.md, gra-robocza/, rust-port/.
TESTY:
- `node node_modules/typescript/bin/tsc --noEmit -p .` (w gra/): czysto, 0 błędów.
- tools/logic-test.cjs: LOGIC OK (213/213)
- tools/tech-tree-test.cjs: tech-tree-test: 20 pass, 0 fail
- tools/research-test.cjs: ALL GREEN
- tools/unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21)
- tools/combat-test.cjs: All sanity checks passed.
- `git diff --check`: czysto.
- Przebieg live (bundle vite z /tmp/claude-0/b1-dist, poza repo; Chromium headless, ?playtest=mapa&civTest=1&civSeed=271828, setFastMode(true), wojna przez __truceTestDebug.declareWar = ownerDeclareWarOn): 11 zakończonych tur gry (wojna od tury 1, turnsAtWar 1..10), potem blokada endTurn (szczegóły niżej). Dowód: evidence-seed271828-obrona-r2.json.
- NIE_ZMIERZONO: zakres 20+ tur wojny (turnsAtWar >= 16 nieosiągnięte); drugie ziarno; porównanie skrótu stanu z hakiem i bez (kryterium 3).
BLOKADY:
1. Blokada techniczna harnessu: od tury 11 `canPlayerInitiateEndTurn()` = false z powodem `[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)` (karta gry „Ważne 1” z blokadą; hak do ustawienia skarbca gracza nie istnieje w __aiTradeWiringTestDebug/__truceTestDebug/__workPoolTestDebug). Bez obejścia nie da się przejść do tur 16+.
2. Ścieżka pokoju zdarzyła się dotąd tylko jako `oferuj_miasto_za_pokoj/rozejm` (tura 11), nie jako `zaproponuj_pokoj`. Przyczyna wymaga tur >= 16.
3. Zakłócenia harnessu (jawne założenia, nie są czystą grą): (a) runner odrzuca wiszącą ofertę blokującą koniec tury (w turze 11 odrzucono `rozejm` AI→gracz; to zmienia rejectedOfferCooldowns i może wpływać na kolejne decyzje AI); (b) runner uzupełnia pustą kolejkę miasta „Kolejka pusta” (prod-empty-city0) 5 budynkami (stolarnia, kamieniarski, kuznia, odlewnia_brazu, odlewnia_zelaza), co jest czynnością gracza.
4. Odczyt `turnsAtWar` w wierszach jest po endTurn (pair), a decyzja AI czyta wartość z chwili decyzji; przy progu 0,8 (T=16) różnica o jedną turę jest dokładnie kandydatem (c) — wymaga pomiaru w turach 15–17.
RUNDY: 2/5 (runda 1: BLOCK analiza statyczna; runda 2 = ta odpowiedź na zarzuty Evaluatora c554370d9)
NASTĘPNY KROK: runda 3 Operatora z tym samym ID (wąski zakres B1a): (1) hak do ustawienia skarbca/prognozy gracza w testach (np. setTreasury w __aiTradeWiringTestDebug, tylko ?civTest=1) albo podniesienie dochodu w tym samym hooku, żeby bramka NNS nie blokowała tury; (2) 20+ tur wojny z checkpointem, seed 271828 i drugie ziarno; (3) tabela kandydatów a–d z tych danych; (4) pomiar skrótu stanu z hakiem i bez (kryterium 3). B1b (osobno): decyzja o przyczynie i ewentualna poprawka po pomiarze.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora (c554370d9)

1. Kryterium 1 (przyczyna z dowodem albo NIE_ZMIERZONO z konkretną blokadą) — PRZYJMUJĘ jako NIE_ZMIERZONO z blokadą: brak przyczyny; blokada = bramka NNS (pkt BLOKADY 1). Przyczyny nie zgaduję.
2. Brak haka `__civTest.aiPeaceTrace()` — PRZYJMUJĘ: dodano hak `__aiTradeWiringTestDebug.peaceTraceStart/peaceTraceStop/peaceTraceRows/peaceTracePair` (nazwa różni się od dispatchu; hak tylko czyta, zapis wyłącznie gdy `on`). Dodatkowo: pole `id` w istniejącym `__truceTestDebug.negotiationEntries` (tylko odczyt).
3. Brak runnera i 20+ tur — PRZYJMUJĘ częściowo: runner dodany (wznawialny nie jest — brak checkpointu w profilu; zapis JSON po każdej turze). Przebieg: 11 tur, nie 20+.
4. Zero ziaren (wymagane >= 2) — PRZYJMUJĘ: wykonano 1 ziarno (271828), przebieg niepełny; drugie ziarno NIE wykonano.
5. Kryterium 3 (skrót stanu z hakiem i bez) — PRZYJMUJĘ jako NIE_ZMIERZONO: porównania nie wykonano. Hak zapisuje wiersze tylko przy `on` i nie zmienia przepływu sterowania, ale to nie jest dowód na poziomie skrótu.
6. tsc + 5 bramek nieodtworzone — PRZYJMUJĘ i uzupełniam: wszystkie zielone (pkt TESTY), uruchomione po ostatniej zmianie kodu.
7. Tabela kandydatów a–d bez rozstrzygnięcia — PRZYJMUJĘ i uzupełniam wg danych z tur 2–11:
   - (a) filtr contactedOwners / dipLayer — ODRZUCONA dla tur 2–11: w turze 11 komenda `oferuj_miasto_za_pokoj/rozejm` przechodzi bez zmian przez afterPlayerFacing = afterLayer = afterContact (dipLayer = 'full'). Dla tur 2–10 brak komend do filtrowania (raw = []).
   - (b) diplomaticContactEstablishedSet — ODRZUCONA dla tur 2–11: contactSet = True w każdym wierszu (tury 2–11). Wpisu do stołu dla zaproponuj_pokoj w tym przebiegu nie było (brak takich komend), więc ta gałąź nie została przetestowana.
   - (c) turnsAtWar widziane przez AI vs panel — NIEROZSTRZYGNIĘTA: odczyt po endTurn to turnsAtWar=1..10 dla tur 2..11 (relTotal 50, 9, 11, 13, 16, 18, 18, 18, 22, 27). Poziom zmęczenia przy 10 turach ≈ 0,5 (< 0,8); próg 0,8 wymaga ~16 tur. Hipoteza off-by-one wymaga danych z tur 15–17.
   - (d) wojna wymuszona epoki z nieodkrytym graczem — NIE_ZMIERZONO (wojna była deklarowana ręcznie hakiem ownerDeclareWarOn, bez powodu epoki; hipoteza nie była testowana).
8. Drobne (npm ci log w /tmp, krok 9 nie zbadany) — PRZYJMUJĘ: log npm ci przeniesiony do /tmp/claude-0-npmci-w.log (poza scratchpadem, do usunięcia przez orkiestratora). Krok 9 (dedup / cooldown / createNegotiation) — dodano znaczniki `ptr(...)` tylko dla `zaproponuj_pokoj` w enqueueNegotiationFromAiCmd (brak bezpośredniego dowodu, bo w przebiegu nie było `zaproponuj_pokoj`).
9. Raport bez pracy (BLOCK bez haka i pomiaru) — PRZYJMUJĘ: hak, runner i pierwszy przebieg są w tej rundzie; wynik nadal BLOCK, bo kryterium 1 i 2 nie są spełnione. Zalecany podział B1a/B1b zaakceptowany.

## Dane z przebiegu (seed 271828, dowód: evidence-seed271828-obrona-r2.json)

Odczyt po każdym endTurn (tura = numer tury po zakończeniu):

| tura | turnsAtWar (odczyt) | relTotal | komendy AI→gracz (raw) | po filtrach warstwy/kontaktu | contactSet | uwagi |
|---|---|---|---|---|---|---|
| 2 | 1 | 50 | [] | [] | True | wojna od tury 1 |
| 3 | 2 | 9 | [] | [] | True | |
| 4 | 3 | 11 | [] | [] | True | |
| 5 | 4 | 13 | [] | [] | True | |
| 6 | 5 | 16 | [] | [] | True | |
| 7 | 6 | 18 | [] | [] | True | |
| 8 | 7 | 18 | [] | [] | True | |
| 9 | 8 | 18 | [] | [] | True | |
| 10 | 9 | 22 | [] | [] | True | |
| 11 | 10 | 27 | [oferuj_miasto_za_pokoj/rozejm] | [oferuj_miasto_za_pokoj/rozejm] | True | rozejm odrzucony przez runner; potem blokada NNS |

Wnioski z danych: do tury 11 AI nie wysłała żadnej komendy `zaproponuj_pokoj`; jedyna komenda pokojowa to `oferuj_miasto_za_pokoj` (rozejm). Nie ma żadnych wpisów `zaproponuj_pokoj` do rozpatrzenia, więc przyczyna dla progu 0,8 nie była jeszcze aktywna. To tylko 11 tur, a więc nie rozstrzyga pytania z tematu.

## SHA
Commit tej rundy: zostanie podany w polu sha odpowiedzi orkiestratorowi (commit obejmuje gra/src/main.ts, gra/tools/live-verify-wave-689-697-b1-peace-trace.cjs i ten raport oraz evidence JSON).
