STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-START-AT-ERA-ENTRY-Q1
GOAL: Wojna epoki Brązu i Żelaza może wybuchnąć w pierwszej turze po wejściu właściciela w epokę (próg 0 z JSON); przy trwającej wojnie innej epoki (np. Kamienia) nowa wojna startuje dopiero po pokoju tamtej, bez przepadku. Kamień bez zmian (40). Zapisy legacy bez znaczników wejścia nie wywołują serii wojen przy wczytaniu.
ZMIANY-COMMIT: baza e2b06492d (origin/main), kandydat wejściowy e42be7d48. Poprawki obrony (SHA czubka: pole sha). Allowlista obrony:
  - gra/src/game/war-rules-multiwar.ts: stała LEGACY_ERA_ENTRY_WAIT_TURNS = 40; backfillMissingEraEntryTurns dostaje parametr waitTurns (domyślnie 0 = zachowanie runtime bez zmian); komentarz zaktualizowany.
  - gra/src/main.ts: import LEGACY_ERA_ENTRY_WAIT_TURNS oraz DWA wywołania load-time backfill (Brąz, Żelazo) z waitTurns = 40 (zarzut 2). UWAGA: poza dosłowną allowlistą "TYLKO bloki parowania/puli" — zmiana dotyczy wyłącznie bloku wczytania zapisu, nie parowania ani puli. Do decyzji orkiestratora.
  - gra/tools/era-war-start-at-entry-test.cjs: dodane D3 (gracz w wojnie Kamienia, przez playerFirst), L0-L6 (zapisy legacy), G1-G5 (strażnik źródłowy main.ts). Eksporty do bundla: backfillMissingEraEntryTurns, LEGACY_ERA_ENTRY_WAIT_TURNS.
  - gra/tools/era-war-delays-test.cjs: sekcja E2 przepięta na semantykę serii: backfill z waitTurns 40 -> wejście 259 (wczytanie 219 + 40); asercje "39 tur blokada / 40 tur otwarcie"; usunięta asercja "eligible w turze wczytania".
  - gra/tools/forced-war-iron-test.cjs: poprawione wcięcie linii eq(startTuryOdEpoki, 0, ...) (zarzut 6).
  - dyspozycje/autobot/runs/R-WEB-ERA-WAR-START-AT-ERA-ENTRY-Q1/30-obrona-claude.md (ten raport).
  - Nie dotknięto: gra/data/war-rules-params.json (już 0/0/40 z rundy 1), dokumentacji, rejestrów, WERSJE.md, rust-port, gra-robocza, gra-kanon.

ODPOWIEDZI NA ZARZUTY:
  1. PRZYJMUJĘ. Test D1 używał stuba. Dodany strażnik źródłowy G2 (era-war-start-at-entry-test.cjs): definicja `const isEraWarExhausted = (oid, era) =>` w main.ts musi zawierać `isOwnerInActiveEraWar(oid)`; G3 sprawdza, że assignForcedWarPairings dostaje tę funkcję. Mutacja main.ts (isEraWarExhausted = false zamiast isOwnerInActiveEraWar(oid)) -> G2 FAIL (31 OK / 1 FAIL); plik przywrócony (cmp OK). Test silnikowy pozostaje na czystych funkcjach; pełnego przebiegu silnika nie mierzono.
  2. PRZYJMUJĘ. Przy progu 0 owner Brązu/Żelaza bez znacznika w zapisie był eligible w turze wczytania (ryzyko serii). Poprawka: load-time backfill ustawia wejście = wczytanie + LEGACY_ERA_ENTRY_WAIT_TURNS (40), czyli zachowanie sprzed zmiany dla zapisów legacy. ZAŁOŻENIE: historycznej tury wejścia nie da się odtworzyć, więc dla zapisów bez danych zachowujemy dotychczasowy harmonogram. Testy: L1-L5 oraz E2 (wejście 259; eligible od 259, nie w 258). Runtime (domyślne waitTurns = 0, np. gracz bez wpisu w epoce) bez zmian: wpis = tura bieżąca. DO POTWIERDZENIA przez orkiestratora. NIE ZMIERZONO wczytania zapisu w grze na żywo.
  3. PRZYJMUJĘ jako brak dowodu w testach (kod był poprawny). Gracz wchodzi do parowania przez `playerFirst` (forced-war-common.ts:353-378) tylko jako subject z warlessAll; warlessAll filtruje `!exhausted(s.ownerId, s.era)` (forced-war-common.ts:340-342), więc aktywna wojna Kamienia (isOwnerInActiveEraWar(0) w isEraWarExhausted) wyklucza gracza z pary. playerEraPoolEligible (próg 0, licznik tylko tej epoki) nie blokuje, blokuje dopiero parowanie. Dodany D3a/D3b: w wojnie Kamienia brak pary; po pokoju para (ownerId 3, targetId 0, era bronze). Zielone.
  4. PRZYJMUJĘ jako brak dowodu w raporcie. Grep po docs/, gra/src i wikiBundle.json: NIE ZNALEZIONO tekstów gracza o "40 tur od wejścia w epokę" dla wojen Brązu/Żelaza. Trafienia "40 tur" dotyczą zmęczenia wojną (wiarygodnosc.md, zmeczenie-wojna.md), karencji pokoju (rozejm-pokoj.md) i wojen Kamienia (bez zmian). Zadanie 5: BEZ ZMIAN w dokumentacji (brak miejsc do aktualizacji).
  5. PRZYJMUJĘ. Bramki z dispatchu uruchomione w tej rundzie (wyniki niżej, liczby z surowego wyjścia). Brakujące nazwy z raportu r1 znalezione: logic-test.cjs, tech-tree-test.cjs, research-test.cjs, unit-replace-test.cjs, combat-test.cjs, hud-me-literal-zero-test.cjs, hotseat-etap6d-podetap-e-source-test.cjs, bramki-tmpdir-unikalnosc-test.cjs.
  6. PRZYJMUJĘ. Tabela przed/po poniżej; wcięcie w forced-war-iron-test.cjs poprawione.

TABELA PRZED/PO (progi wojen epoki, tury od wejścia w epokę):
  | Parametr | Przed (e2b06492d) | Po (ta runda) | Gdzie |
  |---|---|---|---|
  | eraForcedWarStartTurnsFromEra.stone | 40 | 40 (bez zmian) | gra/data/war-rules-params.json |
  | eraForcedWarStartTurnsFromEra.bronze | 40 | 0 | gra/data/war-rules-params.json |
  | eraForcedWarStartTurnsFromEra.iron | 40 | 0 | gra/data/war-rules-params.json |
  | Load-time wait zapisu legacy (Brąz i Żelazo) | wejście = tura wczytania (próg 40 => wojna po 40 turach od wczytania) | wejście = wczytanie + 40 (LEGACY_ERA_ENTRY_WAIT_TURNS); ten sam efekt co przed zmianą | war-rules-multiwar.ts, main.ts (boot) |
  | WOJNA_WYMUSZONA_START_TURY_OD_EPOKI (Brąz) | 40 | 0 (czyta JSON) | forced-war-bronze.ts |
  | WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI (Żelazo) | 40 | 0 (czyta JSON) | forced-war-iron.ts |

ZMIENIONE TESTY (przepięcie progu 40 -> 0 dla Brązu/Żelaza; decyzja właściciela, nie osłabienie asercji; uzasadnienie: próg zmieniony z 40 na 0):
  - gra/tools/era-war-delays-test.cjs: E1 i E2 przepięte; asercje 40 dla Brązu/Żelaza w P przepięte na 0.
  - gra/tools/forced-war-bronze-test.cjs: stała = 0; przykłady 139/140/274 przepięte.
  - gra/tools/forced-war-iron-test.cjs: próg = 0; kryterium 1 odwrócone (0 tur = eligible); granice >= zachowane.
  - gra/tools/forced-war-reguly-multi-turn-simulation-test.cjs: K5 (Brąz A w t10 -> t10; B w t40 -> t40).
  - gra/tools/era-war-bronze-player-target-test.cjs: S6 = 0; S4 (AI1 kandydatem); S2e (gracz poza pulą przez OFF zamiast progu).
  - gra/tools/era-war-engine-scenario-test.cjs: S1, S3, S7, S8, S8b przepięte na 0.
  - NOWY gra/tools/era-war-start-at-entry-test.cjs: A1-A4, D1-D3, L0-L6, G1-G5.

TESTY (liczby z surowego wyjścia tej rundy; npm ci w gra/ (bez build/dev); tsc i testy na worktree):
  - npx tsc --noEmit: exit 0
  - era-war-start-at-entry-test: 32 OK / 0 FAIL; mutacja G2 (isEraWarExhausted = false): 31 OK / 1 FAIL, plik przywrócony
  - era-war-delays-test: 55 OK / 0 FAIL
  - forced-war-bronze-test: 48 PASS / 0 FAIL
  - forced-war-reguly-multi-turn-simulation-test: 48 PASS / 0 FAIL
  - era-war-engine-scenario-test: 27 OK / 0 FAIL
  - forced-war-iron-test: 53 PASS / 2 FAIL — "sojusz z celem nadal blokuje wojnę Żelaza", "sojusz z celem blokuje DOW". PRE-EXISTING: identyczny wynik na e2b06492d (git archive do katalogu scratchpad, te same node_modules). Przyczyna: FALA 891 (sojusz nie blokuje), poza tematem.
  - era-war-bronze-player-target-test: 43 passed / 1 FAIL "S5: sojusz formalny blokuje wojnę epoki z graczem" — PRE-EXISTING, identyczny wynik na e2b06492d (FALA 891).
  - forced-war-bronze-main-guard-test: 22 PASS / 0 FAIL
  - forced-war-iron-main-guard-test: 36 PASS / 0 FAIL
  - forced-war-stone-main-guard-test: 15 PASS / 0 FAIL
  - war-rules-multiwar-main-guard-test: 21 PASS / 0 FAIL
  - forced-war-bronze-new-game-reset-test: 41 PASS / 0 FAIL
  - era-war-defer-not-cancel-test: 29 passed / 0 failed
  - era-war-all-eras-test: 10 pass / 0 fail
  - era-war-ignore-treaties-test: 22 pass / 0 fail
  - era-war-pairing-alliance-test: PASS (E1, E2 mutacja źródła czerwona)
  - era-war-player-included-test: 10 OK / 0 FAIL
  - wszystkie *peace*test.cjs (58 plików war/era/peace łącznie z *war-rules*): czerwone TYLKO pre-existing: diplo-forced-peace-pending-test 39/1 ("okno wraca na początku tury po turn++", identyczne na e2b06492d); diplo-forced-peace-d2-live-test i diplo-forced-peace-pending-live-paths-test (live, EXIT 1, identyczne na e2b06492d). Pozostałe zielone.
  - logic-test: LOGIC OK (213/213)
  - tech-tree-test: 20 pass / 0 fail
  - research-test: PASSED 33 / FAILED 0
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
  - combat-test: 6 PASS / 0 FAIL
  - ai-test: 297 passed / 0 failed
  - hud-me-literal-zero-test: Wynik 150 PASS / 0 FAIL
  - hotseat-etap6d-podetap-e-source-test: 77 PASS / 0 FAIL
  - bramki-tmpdir-unikalnosc-test: PASS=18 FAIL=0
  - NIE URUCHOMIONO: testy live (Chromium) poza dwoma wymienionymi; pomiary 90/120 tur; wczytanie zapisu w grze.

BLOKADY: brak blokady kodu. Otwarte punkty:
  - DO POTWIERDZENIA: interpretacja "wszyscy AI po własnym wejściu" (jak w dispatchu); harmonogram zapisów legacy (ZAŁOŻENIE: 40 tur od wczytania, odpowiedź na zarzut 2).
  - Zakres: zmiana main.ts w bloku wczytania (import + 2 wywołania) jest poza dosłowną allowlistą. Decyzja orkiestratora.
  - Pełny przebieg silnika dla wojny Kamienia AI<->AI przy wejściu w Brąz: NIE ZMIERZONO (test na czystych funkcjach + strażnik źródłowy).
RUNDY: 2/5 (runda 1: e42be7d48; runda 2: ta obrona)
NASTĘPNY KROK: Evaluator (ponowna ocena zarzutów 1-6 wg tej odpowiedzi), następnie Final Control. Bramki live i pomiary NIE uruchomione.
DEPLOY/PUSH: NIE WYKONANO
