# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — obrona Operatora (runda 2/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (pomiar, tylko odczyt; zero zmian w gra/src)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: zmierzyć, jak często AI składa graczowi ofertę handlową (cykliczną i jednorazową) w pełnej grze: ≥3 ziarna × ≥150 tur × ≥3 relacje. Stan: NIE w pełnym zakresie (patrz BLOKADY). Wniosek o częstości w pełnej grze: NIE_ZMIERZONO.
BAZA/KANDYDAT: kandydat 21df657ca (runda 1). Runda 2 startuje od 21df657ca i zmienia wyłącznie allowlistę: gra/tools/measure-ai-trade-offer-frequency.cjs oraz dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/**.

## ZMIANY-COMMIT
- gra/tools/measure-ai-trade-offer-frequency.cjs:
  - domyślny MEAS_MAX_SEC 540 → 480 (odpowiedź na zarzut 10, margines na start i build w limicie 590 s),
  - instrumentacja odrzuceń: `rejectCooldownsMax` w raporcie i `rejCd` oraz `scriptRejectedSoFar` w każdej turze, z `state().rejectCooldowns` hooka (odpowiedź na zarzut 9: wpływ odrzuceń na kooldowny będzie widoczny w danych, nie tylko założony),
  - komentarze ograniczeń bez zmiany logiki pomiaru.
- dyspozycje/.../evidence/smoke-prepared-3t-r2.json: przebieg kontrolny 3 tury (arm prepared), potwierdza działanie nowych pól.
- dyspozycje/.../30-obrona-claude.md: ten raport.
- Brak zmian w gra/src, JSON balansu, WERSJE.md, rust-port. `npm ci --ignore-scripts` w gra/ (node_modules poza commitem). Bez `npm run build/dev`. Bundle vite do katalogu scratchpad (poza repo).

## TESTY (surowe wyniki z terminala, runda 2)
- `node --check gra/tools/measure-ai-trade-offer-frequency.cjs` → SYNTAX_OK
- smoke: `MEAS_TURNS=3 MEAS_ARM=prepared node tools/measure-ai-trade-offer-frequency.cjs` → `RESULT {"arm":"prepared","turnsRun":3,"offers":0,"per100":0,"activePrzyjmij":0,"pairs":{},"cyclicDealsMax":0,"tableGrowth":0,"scriptRejected":0,"rejectCooldownsMax":0,"stoppedBy":"koniec przebiegu","consoleErrors":0}`, EXIT=0, pole `secs: 27` (pętla, 3 tury ≈ 9 s/turę na tym przebiegu).
- evidence smoke: grep potwierdza `rejCd` (3 wystąpienia), `rejectCooldownsMax: 0`.
- Bramki gry (tsc, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6): NIE PONOWIONO w tej rundzie. Kod gry jest bit-w-bit ten sam co na 21df657ca (zmiany tylko w gra/tools i dyspozycje), wyniki z zarzutu Evaluatora dotyczą tego kodu. Weryfikacja: `git diff --stat 21df657ca HEAD` po commicie (tylko allowlista).
- Dowód mutacyjny: NIE DOTYCZY (brak poprawki w kodzie gry).

## ODPOWIEDZI NA ZARZUTY EVALUATORA (runda 1, 7d832c1ed)
1. (ziarna 1 z ≥3) — PRZYJMUJĘ fakt, ODRZUCAM naprawę w tej rundzie. Dowód: stałe ziarno `PLAYTEST_MAPA_SEED` (gra/src/game/playtestMapaSwiata.ts:29, re-export; użycie gra/src/main.ts:46343, 46367, 46369). Brak parametru URL zmieniającego ziarno. Dodanie haka wymaga zmiany gra/src, czego zakazuje dispatch i allowlista. → BLOKADA / decyzja orkiestratora.
2. (tury 52 i 49 z ≥150, przerwane limitem) — PRZYJMUJĘ fakt. Naprawy w allowliście: MEAS_MAX_SEC 480 (margines). Pełne 150 tur nie mieści się w jednym wywołaniu bash (~8–9 s/turę + start ~90 s) przy zakazie run_in_background, a skrypt nie zapisuje ani nie wczytuje stanu gry, więc przebiegu nie da się wznowić bez zmiany gra/src. → BLOKADA.
3. (relacje 1 z ≥3) — ODRZUCAM naprawę w tej rundzie: brak haka ustawiania poziomu relacji w hooku `__aiTradeWiringTestDebug` (gra/src/main.ts:29804–29925, funkcje: info, foundFirstCity, prepare, setStock, stock, probeBarter, diagPayload, diag, endTurn, isEndTurnInProgress, canEnd, clearBarterCooldown, setBarterCooldownTurn, state, previewAccept, forceAccept). Dodanie wymaga gra/src. → BLOKADA.
4. (powtarzalność dla 150 tur NIE_ZMIERZONO) — PRZYJMUJĘ. Pozostaje NIE_ZMIERZONO. Kontrola 8 tur ×2 z FC nie jest dowodem dla 150 tur.
5. (oferty jednorazowe NIE_ZMIERZONO, hak filtruje tylko aiCyclicBarter) — PRZYJMUJĘ fakt, ODRZUCAM naprawę w allowliście. Dowód: `state().pending` = `negotiationTable.filter(n => n.aiCyclicBarter)` (gra/src/main.ts ok. 29850–29860); hak zwraca tylko `tableLen` dla pozostałych wpisów, bez typu. Klasyfikacja wymaga zmiany hooka w gra/src. → BLOKADA.
6. (brak trybu przyspieszonego z GOAL) — PRZYJMUJĘ fakt. Hak `?civTest=1` (gra/src/main.ts:29804 i dalej) nie eksponuje żadnego trybu tempa; skrypt używa normalnego tempa tury i tego nie zmieniam (zmiana wymagałaby gra/src). Brak trybu przyspieszonego jest więc jawnie niezrealizowany, nie ukryty. → BLOKADA / doprecyzowanie GOAL przez orkiestratora.
7. (ramię prepared nie jest pomiarem pełnej gry; n=1) — PRZYJMUJĘ. Etykieta „NIE jest pomiarem naturalnym” jest w nagłówku skryptu. Wygasanie cooldownów ustawionych na turn 0 nie jest zmierzone. Ramię prepared nie służy do wniosku o częstości; wniosek opieramy wyłącznie na danych, których nie zmieniono.
8. (ramię natural: 0 ofert w 52 turach) — PRZYJMUJĘ. 0 nie jest informatywne o częstości w pełnej grze (kontakt i technologia Wymiany nie powstały w tym czasie). Pozostaje jako fakt surowy, bez wniosku.
9. (wpływ odrzucania wiszących ofert na cooldowny nie zmierzony; scriptRejected=0) — CZĘŚCIOWO. ODRZUCAM zarzut w części „dane”: w obu przebiegach `scriptRejected` = 0 (evidence/natural-150-run1-partial.json i evidence/prepared-150-run1-partial.json, pole `"scriptRejected": 0`). PRZYJMUJĘ w części „pomiar”: dodano `rejectCooldownsMax` i `rejCd` per tura z `state().rejectCooldowns`, więc wpływ będzie widoczny w przyszłych przebiegach. Na długich przebiegach nadal NIE_ZMIERZONO.
10. (czas: ~7 s/tura, limit 590 s bash, brak wznawiania) — PRZYJMUJĘ. Naprawa częściowa: MEAS_MAX_SEC domyślnie 480 s (commit). Pomiar czasu: smoke 3 tury = 27 s pętli (≈9 s/turę na tym przebiegu; ewaluator podał ~7 s). Całkowity wall-clock z buildem i startem: NIE_ZMIERZONO (smoke nie mierzył całości). Wznawianie wymaga zmiany gra/src (zapis/wczytanie stanu) → BLOKADA.
11. (brak liczb do ABC #274; status DECISION_REQUIRED) — PRZYJMUJĘ. Status pozostaje DECISION_REQUIRED. Liczb do ABC #274 (częstość ofert przy ścisłej równości PW) ten temat nie dostarcza.

## POKRYCIE vs GOAL (stan po rundzie 2)
- Ziarna: 1 z ≥3 (stałe) — BLOKADA.
- Tury: 49–52 z ≥150 (przebiegi z rundy 1 przerwane limitem) — BLOKADA.
- Relacje: 1 z ≥3 — BLOKADA.
- Tempo przyspieszone: NIE zrealizowane — BLOKADA.
- Oferty cykliczne: mierzone (1 oferta w 49 turach, ramię prepared, n=1; 0 w 52 turach, ramię natural).
- Oferty jednorazowe: NIE_ZMIERZONO (hook nie eksponuje typu).
- Powtarzalność dla 150 tur: NIE_ZMIERZONO.
- Wniosek o częstości w pełnej grze: NIE_ZMIERZONO.

## BLOKADY / DECYZJA WYMAGANA
1. Hak ziarna (PLAYTEST_MAPA_SEED stałe), hak relacji i hak typu oferty (jednorazowe) wymagają zmiany gra/src — poza allowlistą i poza zakazem dispatchu. Decyzja orkiestratora: osobny temat hakowy `?civTest=1` (ziarno z URL, ustawienie relacji, typ wpisu w `state().pending`) albo zawężenie GOAL do 1 ziarna i 1 relacji.
2. Czas: 150 tur × ~8 s + start nie mieści się w jednym wywołaniu bash bez tła; brak wznawiania stanu. Decyzja: osobny runner (dłuższy limit / wznawialny zapis stanu) albo zmniejszenie GOAL.
3. Tryb przyspieszony z GOAL nie istnieje w haku — decyzja: doprecyzować GOAL lub osobny temat.
4. ABC #274 (częstość ofert) nie ma danych do odpowiedzi; bez blokad 1–3 ten temat nie dostarczy wniosku.

## WNIOSKI (bez progu, bez wniosku o częstości)
- Dane z rundy 1 nie wspierają wniosku o częstości: 1 oferta w 49 turach (ramię prepared, n=1), 0 w 52 turach (ramię natural, bez kontaktu i technologii).
- Skrypt po rundzie 2 jest dokładniejszy (limit czasu z marginesem, rejectCooldowns mierzone), ale wniosek pozostaje NIE_ZMIERZONO.

## NASTĘPNY KROK
Orkiestrator: decyzja w sprawie blokad 1–3 (osobny temat hakowy w gra/src z własną allowlistą albo zawężenie GOAL i wybór runnera). Przy wyborze hakowym kolejne przebiegi 150 tur × 3 ziarna × 3 relacje z tą wersją skryptu.

## RUNDY
2/5 (obrona Operatora, Haiku). Kolejna runda: Evaluator na SHA z tego commita.

DEPLOY/PUSH: NIE WYKONANO
