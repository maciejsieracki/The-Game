STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SEA-PEOPLES-BRONZE-TURN20-TRIPLE-Q1
GOAL: Epoka Ludów Morza startuje w 20. turze OD WEJŚCIA gracza (owner 0) w Brąz i trwa do jego wejścia w Żelazo; w oknie liczba jednostek barbarzyńców (limit na obóz i limit rajdów morskich) x3 względem bazy trudności; komunikat raz, dedup po save/load; wyłączeni barbarzyńcy pozostają wyłączeni; istniejących jednostek nie kasuję.

BAZA: origin/main cfa5d1e65 (ROBOCZA 603c7016). KANDYDAT (start obrony): 93726cafbb56ce62c889b0a1d9469c5a2f9e1850. Model Operatora: Haiku 5.5. Runda obrony: 2 (odpowiedź na raport Evaluatora 299907759 / zarzuty 1-3).

ZMIANY-COMMIT:
- Nowy plik: gra/tools/sea-peoples-wiring-test.cjs (23 asercje: sekcja A = symulacja tur na prawdziwych tickCamps i spawnSeaPeoplesRaiders; sekcja B = kontrakt źródła gra/src/main.ts).
- Kod gry (barbarians.ts, main.ts) NIE zmieniony w tej rundzie. Kandydat 93726cafb zostaje bez zmian w kodzie.
- Ten raport: dyspozycje/autobot/runs/R-WEB-SEA-PEOPLES-BRONZE-TURN20-TRIPLE-Q1/30-obrona-claude.md.
- Allowlista rundy 2: gra/tools/sea-peoples-wiring-test.cjs, dyspozycje/.../30-obrona-claude.md. Brak WERSJE.md, gra-robocza, danych. Commit przez git add ścieżek (bez -A).

ODPOWIEDŹ NA ZARZUTY EVALUATORA:

Zarzut 1 (okablowanie main.ts bez dowodu; mutacja barbLiveBoosted = barbLive nie czerwieni testu): PRZYJMUJĘ.
- Poprawka: tools/sea-peoples-wiring-test.cjs.
  A1 (tickCamps, obóz lądowy, normal baza unitsPerCamp=2, spawnInterval=1, okno z wejściem Brąz=100, Żelazo=150): żywych przed oknem 119 = 2; tura 120 = 3; tura 125 = 6; szczyt = 6; tura 149 = 6; tura 150 (Iron) = 6; tura 160 = 6 (brak kasowania, brak spawnów ponad bazę).
  A2 (spawnSeaPeoplesRaiders, maxSeaCamps=2): tura 119 = 4 (2x2); tura 125 = 10 (narastanie 1/turę od 120); tura 127 = 12 (2x6); szczyt = 12; tura 160 = 12 (po Iron bez kasowania).
  B (kontrakt źródła main.ts, asercje na tekst): B1 seaPeoplesActive = player.era===2 && seaPeoplesBoostActive(bronzeEraEnterTurnByOwner.get(0), ironEraEnterTurnByOwner.get(0), turn); B2 barbLiveBoosted = boost(barbLive, seaPeoplesActive); B3 barbLiveForSpawn z barbLiveBoosted w obu gałęziach; B4 tickCamps(..., barbLiveForSpawn); B5 spawnSeaPeoplesRaiders(..., barbLiveBoosted, ...); B6 flaga ustawiana przed warEventLog.unshift; B7 seaPeoplesNoticeShown w save meta; B8 odczyt saved.meta?.seaPeoplesNoticeShown === true; B9 reset przy nowej grze.
- Dowód mutacyjny (kopia main.ts przywrócona przez git checkout po każdej mutacji, git status czysty):
  M1 barbLiveBoosted = barbLive -> FAIL B2, wynik 22 passed / 1 failed, rc=1.
  M2 tickCamps(..., barbLive) zamiast barbLiveForSpawn -> FAIL B4, 22/1, rc=1.
  M3 usunięte seaPeoplesNoticeShown z save meta -> FAIL B7, 22/1, rc=1.
- Ograniczenie uczciwie: pełnego boot() gry nie da się uruchomić w Node (DOM, THREE). Sekcja B sprawdza kontrakt źródła, nie wykonanie w grze. Dedup po realnym save/load nadal NIE_ZMIERZONO w runtime; wykonanie pokrywa tylko kontrakt B7-B9 i symulacja w teście sea-peoples-boost-test (kopia logiki).

Zarzut 2 (zakres owner-relative / parity AI i shared-owner): ODRZUCAM jako błąd, PRZYJMUJĘ jako decyzję zakresu do potwierdzenia.
- Dowód zakresu: sygnatury spawnCamps / tickCamps / spawnSeaPeoplesRaiders (gra/src/game/barbarians.ts) nie mają parametru właściciela. Barbarzyńcy są globalni (BARBARIAN_OWNER_ID), nie per właściciel. Komunikat i bramka epoki (player.era===2) dotyczą gracza. Zmiana na okno per-owner wymagałaby nowej semantyki spawnu, poza zakresem tego tematu.
- Dowód pinu: asercja B1 blokuje zmianę na inny klucz właściciela bez świadomej decyzji; dwa różne wpisy właściciela dają różne wyniki helpera (sea-peoples-boost-test, sekcja 4: owner A Bronze 50 vs owner B Bronze 100, tura 70).
- ZAŁOŻENIE (zapisane w 10-operator-claude.md jako luka dispatchu): okno = gracz. Parity z AI NIE wdrożona. DECYZJA WŁAŚCICIELA (ABC, do zadania przez orkiestratora): (a) okno = wejście GRACZA (rekomendacja: zgodne z komunikatem i z bramką era gracza); (b) okno = pierwsze wejście w Brąz spośród wszystkich nacji (większe zmiany w spawnie globalnym).

Zarzut 3 (brak weryfikacji wizualnej; próg elapsed>=20 vs "20. tura"): CZĘŚCIOWO PRZYJMUJĘ.
- Klasyfikacja zakładki: POTWIERDZONA w kodzie: gra/src/ui/sidePanelEventTabs.ts:80 `if (ev.blocking === true || ev.kind === 'enemy' || ev.important === true) return 'wazne';`. Wpis kind 'enemy' trafia do zakładki Ważne.
- Próg: ODRZUCAM jako błąd, zostaje ZAŁOŻENIEM. Dispatch GOAL mówi wprost "start at elapsed20" i "start od elapsed20"; elapsed = turn - entryTurn; aktywne od elapsed >= 20 (tura 120 przy wejściu w 100). Definicja "20. tury" (entry+20 vs entry+19) jest decyzją właściciela, jedna stała SEA_PEOPLES_BOOST_ELAPSED_TURNS.
- Weryfikacja wizualna: NIE_ZMIERZONO. Przeglądarka/Chromium nie uruchamiana w tej rundzie. Wykonano tylko vite build (PASS, patrz TESTY). Komunikat w grze, także wyświetlenie w zakładce Ważne i ponowne pokazanie w starym zapisie, wymaga realnej weryfikacji przed READY_FOR_DEPLOY (R-PROC §9, tematy wizualne).

Pytanie: czy trzy testy guard są czerwone już na bazie (zarzut Evaluatora "dług bazowy")? POTWIERDZONE NA cfa5d1e65 (wykonane w worktree przez checkout bazy i powrót do 93726cafb):
- forced-war-bronze-main-guard-test: WYNIK: 21 PASS, 1 FAIL (finalizePeaceTreatyBetween / bronzeForceWarActiveByPairKey).
- forced-war-iron-main-guard-test: WYNIK: 34 PASS, 1 FAIL (finalizePeaceTreatyBetween uzbraja odpoczynek Żelaza).
- ai-dlug-porzadki-q1-test: ReferenceError: regularWarCapturedByPairKey is not defined.
Wniosek: dług bazowy, identyczny jak na kandydacie. NIE jest regresją tego tematu.

TESTY (surowe wyniki, na 93726cafb + nowy plik testu):
- node ./node_modules/typescript/bin/tsc --noEmit (gra/): exit 0, bez wyjścia.
- node tools/sea-peoples-boost-test.cjs: 42 passed, 0 failed.
- node tools/sea-peoples-wiring-test.cjs (NOWY): 23 passed, 0 failed, rc=0.
- node tools/barbarians-test.cjs: 213 passed, 0 failed.
- node tools/logic-test.cjs: LOGIC OK (213/213).
- node tools/tech-tree-test.cjs: 20 pass, 0 fail.
- node tools/research-test.cjs: PASSED 33 / FAILED 0 / TOTAL 33.
- node tools/unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21).
- node tools/combat-test.cjs: COMBAT TEST: 6/6 pass.
- Dług bazowy (na cfa5d1e65 i na kandydacie identycznie): forced-war-bronze-main-guard 21/1, forced-war-iron-main-guard 34/1, ai-dlug-porzadki-q1 ReferenceError.
- npx vite build --outDir <scratchpad>/vite-sea --emptyOutDir (gra/): rc=0, "built in 17.35s", index.html 14452.86 kB. Wyjście poza repo (scratchpad), zakaz npm run build/dev nie naruszony. Log: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/vite-sea.log (0 linii z "error").
- Chromium: NIE_ZMIERZONO (nie uruchamiano).
- Mutacje: M1/M2/M3 jak wyżej (wiring test). Mutacje czystych helperów z rundy 1 (SEA_PEOPLES_UNIT_MULT 3->1: 38/4 FAIL; próg -> return true: 39/3 FAIL) pozostają aktualne dla sea-peoples-boost-test.

BLOKADY:
- Decyzja właściciela (ABC): zakres okna (gracz vs pierwsza nacja w Brązie; zarzut 2). Do rozstrzygnięcia przed deployem.
- Decyzja właściciela (ABC): definicja "20. tury" (elapsed >= 20 vs entry+1 >= 20; zarzut 3).
- NIE_ZMIERZONO: Chromium / wizualna weryfikacja komunikatu i zakładki Ważne; dedup po realnym save/load w grze.
- Dług bazowy (3 testy guard/ai-dlug) poza zakresem tematu; do osobnego tematu naprawczego, nie blokuje tego tematu.

RUNDY: 2/5 (runda obrony; runda Operatora 1 + obrona 1 = zgłoszone jako "obrona r2" w logu orkiestratora).
NASTĘPNY KROK: Final Control (Sonnet) na SHA tej obrony: sprawdzić allowlistę (gra/tools/sea-peoples-wiring-test.cjs + raport), uruchomić bramki z sekcji TESTY, potwierdzić ZAŁOŻENIA; zarzut 2 i 3 (próg) do ABC właściciela przez orkiestratora; przed READY_FOR_DEPLOY wymagany dowód Chromium (wizualny) albo wyraźna decyzja orkiestratora o pominięciu.
DEPLOY/PUSH: NIE WYKONANO
