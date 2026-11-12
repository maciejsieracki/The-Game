# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (pomiar, tylko odczyt; zero zmian w gra/src, JSON, WERSJE.md, rust-port)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: zmierzyć, jak często AI składa graczowi ofertę handlową (cykliczną i jednorazową) w pełnej grze: ≥3 ziarna × ≥150 tur × ≥3 relacje. Stan wykonania: NIE w pełnym zakresie (patrz BLOKADY).
BAZA: origin/main = ef27be007 (detached).

## ZMIANY-COMMIT
- gra/tools/measure-ai-trade-offer-frequency.cjs (nowy; jedyny plik kodu, w allowlistcie)
- dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/10-operator-claude.md (ten raport)
- dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/evidence/natural-150-run1-partial.json
- dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/evidence/prepared-150-run1-partial.json

Brak zmian w gra/src. `npm ci --ignore-scripts` w gra/ (node_modules poza commitem). Bundle vite zbudowany poza repo (`vite build --outDir` w katalogu scratchpad), bez `npm run build/dev`.

## TESTY (surowe wyniki z terminala)
- `node --check tools/measure-ai-trade-offer-frequency.cjs` → SYNTAX_OK
- `npx tsc --noEmit -p .` (gra/) → TSC_EXIT=0
- `vite build` (bundle poza repo) → EXIT=0, „built in 23.35s”
- Przebieg A „natural” (bez prepare), limit 480 s: turnsRun=52, offers=0, activePrzyjmij=0, pairs={}, cyclicDealsMax=0, tableGrowth=0, scriptRejected=0, stoppedBy=limit czasu, consoleErrors=0
- Przebieg B „prepared” (prepare raz na starcie: kontakt, technologia Wymiany, wyciszenie innych klas ofert), limit 460 s: turnsRun=49, offers=1, per100=2.04, activePrzyjmij=1, pairs={"sol->glina":1}, cyclicDealsMax=0, tableGrowth=0, scriptRejected=0, stoppedBy=limit czasu, consoleErrors=0
- Powtarzalność: NIE_ZMIERZONO (po jednym przebiegu na ramię; ziarno stałe).

Surowe dane: evidence/*.json (perTurn, offerLog).

## POKRYCIE vs GOAL (NIE_ZMIERZONO)
- Ziarna: 1 z ≥3. Hak `?playtest=mapa` używa stałego PLAYTEST_MAPA_SEED; brak parametru URL ani haka zmiany ziarna.
- Relacje: 1 z ≥3. Brak haka ustawiania poziomu relacji; mierzona relacja naturalna po setupie.
- Tury: 49–52 z ≥150. Koszt ~7–8 s/tura w headless Chromium + ~90 s startu. Limit bash 590 s nie mieści 150 tur w jednym wywołaniu, a zakaz run_in_background wyklucza przebieg w tle. Przebiegu nie da się wznowić (każdy start od zera).
- Oferty jednorazowe: NIE_ZMIERZONO. Hak zwraca tylko tableLen, bez typu wpisu; skrypt liczy wyłącznie aiCyclicBarter. tableGrowth=0 w obu przebiegach.
- „Przyjmij aktywne”: mierzone przez previewAccept (ta sama funkcja co przycisk gracza), tylko dla wymiany cyklicznej.

## WNIOSKI (bez progu)
- Naturalny przebieg (52 tury): 0 ofert. Zgodne z tym, że kontakt i technologia Wymiany nie powstają same w tym czasie.
- Przebieg z prepare (49 tur): 1 oferta (≈2 na 100 tur), aktywny „Przyjmij”, para sol→glina. Pojedyncza próbka, nie podstawa do wniosku o częstości.
- Wiarygodnej częstości w pełnej grze nie da się wyciągnąć bez: haka ziarna, haka relacji, dłuższego przebiegu i rozróżnienia typów ofert w hooku.

## BLOKADY / DECYZJA WYMAGANA
1. Brak haka ziarna i relacji. Dodanie wymaga zmiany gra/src (poza allowlistą tego tematu). Decyzja: osobny, mały hak `?civTest=1` (ziarno z URL, ustawienie relacji) albo zawężenie GOAL do 1 ziarna i 1 relacji.
2. Czas: ~8 s/tura uniemożliwia 150 tur × 9 przebiegów w limitach bash bez tła. Potrzebny osobny runner z dłuższym limitem albo przyspieszenie tury.
3. Brak klasyfikacji ofert jednorazowych w hooku (ten sam powód co 1).

## NASTĘPNY KROK
Orkiestrator: decyzja w sprawie blokad 1–3 (ABC albo osobny temat hakowy). Bez tego temat nie daje danych do pytania ABC z #274.

## RUNDY
1/5 (runda 1, Operator Haiku). Evaluator i Final Control nie wykonane (poza zakresem Operatora).

DEPLOY/PUSH: NIE WYKONANO
