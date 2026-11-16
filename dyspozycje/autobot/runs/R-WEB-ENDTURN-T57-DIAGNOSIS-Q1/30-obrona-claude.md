STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza; kod gry w gra/src NIE zmieniany)
TEMAT: R-WEB-ENDTURN-T57-DIAGNOSIS-Q1
GOAL: odtworzyć timeout endTurn (tura ~57) na harnessie z AI z miastami; ustalić turę, stan, przyczynę; albo wpisać „nieodtworzone w N przebiegach”.
BAZA: 770f9c8b2 (kandydat Operatora r1; kod gry = f6b09c76b / origin/main, MD5 70828a6b).
RUNDA: obrona (odpowiedź na zarzuty Evaluatora r1, FAIL bb7401fcc).

## ZMIERZONO (live, Chromium headless, bundle vite zbudowany POZA repo, `?civTest=1`, seed 4242, 41 AI z miastami, bramka NNS gracza obchodzona dosypką 200/200, `--every 10`)

| Przebieg | Opis | Wynik |
|---|---|---|
| A (runner bez zmian, 570 s) | start od t1 | t51 zakończone (211 s od startu); potem zawisło w turze 52, ubicie po limicie 570 s (brak rekordu stop) |
| B (zapis t50 wznowiony, probe) | wznowienie ze slotu t50 | t51–t60 przeszło bez zawieszenia (177 s). Wznowienie NIE odtwarza stanu ciągłego (zgodnie z #424, dryf zapis/wczytanie), więc to nie jest kontrprzykład dla ciągłego przebiegu |
| C (probe, DOM co 30 s) | start od t1, 570 s | ubicie po t30 przez wolne tury z sondą (nie stall); zbędne, zostawione jako ślad |
| D (probe, clearBattles) | start od t1 | t51 zakończone (281 s); potem 400 iteracji clearBattles z `pendingAuto=true`, `preBattleOpen=false`, `sceneOpen=false`, `summaryOpen=false`, `canEnd=false`, `pending=0`; w DOM widoczna wyłącznie `civ-diplo-aud` („Audiencja dyplomatyczna … Stan: POKÓJ … Wróć”), `tech=false`, brak panelu scalenia armii; przycisk „Zakończ turę” visible, disabled=false, aria-disabled=true, klasa `is-disabled`; ubicie po limicie 570 s |
| E (probe + zamknięcie audiencji przyciskiem „Wróć”, tylko gdy blokuje kolejkę) | start od t1 | t51 → t56 przeszło (354 s), `stop: null`, `stuckQueueHeals: 0`, `battlesAuto: 0`; w logu 2 zrzuty `probe-cb` z tą samą sygnaturą, potem postęp tur |

Wniosek z ZMIERZONEGO (seed 4242, t51): stan blokady „kolejka odłożonych bitew (pendingAuto=true), nic nie otwarte, canEnd=false” ma w tej turze jedną przyczynę widoczną w DOM: OTWARTĄ AUDIENCJĘ DYPLOMATYCZNĄ. Po jej zamknięciu (przycisk „Wróć”) tura przechodzi bez leczenia kolejki. Harness nie zamyka audiencji (runner nie ma do tego kroku), więc zawisa. Gracz-człowiek zamknie ją ręcznie i stan się rozładuje — do potwierdzenia w przebiegu bez kodu harnessu (NIE ZMIERZONO w tej formie, zob. niżej).

## Mechanizm (kod, zweryfikowany cytatami)

- `gra/src/main.ts:33403-33405` — `isOtherEndTurnModalOpen: () => isDiplomacyAudienceOpen() || isArmyMergePanelOpen() || isTechDiscoveryNoticeOpen()`. Poprawka do r1: r1 opisywał tylko audiencję; pełny warunek ma TRZY wyzwalacze. W zmierzonym przypadku aktywny był tylko pierwszy (DOM: `tech=false`, brak panelu scalenia).
- `gra/src/ui/preBattle.ts:257-261` — automatyczne żądanie bitwy (`opts.auto===true`) trafia do `deferredAutoRequests`, gdy `isPreBattleOpen()` LUB `isOtherEndTurnModalOpen()`.
- `gra/src/ui/preBattle.ts:350-351` — `hasPendingAutoPreBattle()` = kolejka niepusta.
- `gra/src/ui/preBattle.ts:418-424` — `flushDeferredAutoPreBattle()` jest no-op, dopóki blokada trwa.
- `gra/src/main.ts:40678-40680` (`canPlayerInitiateEndTurn`) — koniec tury odrzucany, gdy `hasPendingAutoPreBattle()`.
- `gra/src/main.ts:40796` — `healStuckDeferredPreBattleQueueOnEndTurnAttempt()` wychodzi wcześnie przy `isDiplomacyAudienceOpen() || isArmyMergePanelOpen()`. Czyli leczenie kolejki (czyszczenie po 8 s) NIE działa, póki audiencja jest otwarta. To zamierzone: kolejka czeka na zamknięcie modala.
- `gra/src/main.ts:40729` — podpowiedź przy zablokowanym końcu tury przy zalegającej kolejce: „Zakończ ekran bitwy, potem zakończ turę.” Przy otwartej audiencji nie ma widocznego ekranu bitwy, więc tekst jest mylący (kandydat na poprawkę UX — decyzja orkiestratora, NIE zmieniane tutaj).

Ocena: to NIE jest trwały deadlock gry dla gracza, który zamknie modal (przebieg E). Jest to zachowanie zamierzone kolejki (czeka na modal) + brak obsługi audiencji w harnessie. Defekt gry, jeśli jest, to: (a) podpowiedź wskazująca nieistniejący ekran bitwy zamiast modala; (b) brak sygnału, że blokadą jest audiencja (NIE ZMIERZONO: co gracz realnie widzi po kliknięciu, zob. niżej).

## Odpowiedź na zarzuty Evaluatora (bb7401fcc)

1. (brak reprodukcji live, ≥5 ziaren) — PRZYJMUJĘ CZĘŚCIOWO. Dodano live: seed 4242, 4 przebiegi od t1 (A, D, E + C), zawieszenie w t51 odtworzone 2× (A, D), zamknięcie audiencji usuwa je (E). Pozostałe ziarna NIE ZMIERZONO: 5 ziaren × 100 tur nie mieściło się w budżecie tej rundy (każdy przebieg 100 tur to ok. 40–50 min w foreground po 590 s limicie na polecenie Bash; ograniczenie „bez run_in_background”). Tabela 5-ziarnowa NIE WYKONANA.
2. (brak narzędzia do powtarzania w jednym poleceniu) — PRZYJMUJĘ. Dodano `gra/tools/endturn-t57-repro.cjs` (allowlista `gra/tools/endturn-t57-*.cjs`), `node --check` OK. Zawiera zrzuty DOM i opcjonalne zamknięcie audiencji blokującej kolejkę. Polecenie jest w nagłówku pliku. Nie zmienia gry ani runnera.
3. (analiza mechanizmu niekompletna: trzy wyzwalacze) — PRZYJMUJĘ. Poprawiony opis w sekcji Mechanizm. Dla zmierzonego przypadku: audiencja była jedyną aktywną blokadą (DOM).
4. (błędne twierdzenie „runner nie zlicza stuckQueueHeals po wznowieniu”) — PRZYJMUJĘ. Runner odtwarza licznik z zapisu (`gra/tools/ai-economy-measure-run.cjs:242`) i zwiększa go w `:188`. Zero w r3 wynika z tego, że zapis slotu t50 powstał PRZED zawieszeniem, a przebieg z zawieszeniem został ubity przed wpisaniem podsumowania. Licznik w przebiegu zawieszonym nie jest więc utrwalany (luka raportowania, nie gubienie zdarzeń w pamięci). Krok 3 NASTĘPNEGO KROKU r1 (zapis licznika) jest zasadny, ale z tym uzasadnieniem.
5. (brak rozstrzygnięcia: defekt czy zamierzone; klikalność przycisku; co widzi gracz) — CZĘŚCIOWO PRZYJMUJĘ. Rozstrzygnięcie: zamierzone wstrzymanie kolejki przez modal (ocena w sekcji Mechanizm). Zmierzone: przycisk jest widoczny, disabled=false, aria-disabled=true, klasa `is-disabled` (DOM, przebieg D). NIE ZMIERZONO: tekst podpowiedzi po realnym kliknięciu (nie wykonano kliknięcia „Zakończ turę” przy otwartej audiencji; sonda tego nie robi) oraz pokaz modala dla gracza.
6. (związek t51/t89 z pierwotnym t57 niepotwierdzony) — PRZYJMUJĘ. Stan t57 NIE jest odtworzony (żaden przebieg nie dobiegł do t57 z zawieszeniem; przebieg E przeszedł t56). t89 (seed 777) NIE zmierzone. GOAL „odtworzyć timeout ~t57” NIE SPEŁNIONY; t51 (seed 4242) jest ustalonym przypadkiem tej samej klasy (endTurn zablokowany kolejką bitew za otwartym modalem).

## Ustalenia dla orkiestratora

- Harness (`ai-economy-measure-run.cjs`) nie obsługuje otwartej audiencji dyplomatycznej. To dług harnessu, nie gry. Trzeba: zamykać audiencję (lub wykrywać ją jako blokadę) w `clearBattles`, i zapisywać liczniki także w przebiegu zawieszonym (ubicie = brak podsumowania).
- Kandydat R-WEB-* (wymaga decyzji ABC, NIE zrobiony): podpowiedź przy zalegającej kolejce bitew, gdy blokuje audiencja (`main.ts:40729`), powinna wskazywać modal, a nie „ekran bitwy”. Pytanie ABC: czy audiencja AI, która wisi w turze, ma w ogóle blokować koniec tury (obecnie blokuje przez kolejkę bitew).
- Wiedza o t57 wymaga przebiegu seed 777 (t89) i/lub seed 4242 do ~t57 z zapisem `--every 2` z kodem zamykającym audiencję osobno; to osobny temat (koszt ok. 1 h foreground).

## ZMIANY/COMMIT

- `gra/tools/endturn-t57-repro.cjs` (nowy; allowlista `gra/tools/endturn-t57-*.cjs`).
- `dyspozycje/autobot/runs/R-WEB-ENDTURN-T57-DIAGNOSIS-Q1/30-obrona-claude.md` (ten raport).
- `dyspozycje/autobot/runs/R-WEB-ENDTURN-T57-DIAGNOSIS-Q1/evidence/r2-stall-t51-probe-bez-zamkniecia.txt` (dowód zawieszenia, przebieg D).
- `dyspozycje/autobot/runs/R-WEB-ENDTURN-T57-DIAGNOSIS-Q1/evidence/r2-t51-z-zamknieciem-audiencji.txt` (dowód przejścia, przebieg E).
- `gra/src` NIEZMIENIONE. `WERSJE.md`, manifest, `gra-robocza/`, `rust-port/` NIEZMIENIONE. Commit tylko przez `git add <ścieżki>`.

## TESTY (liczby z surowego wyjścia, po `npm ci` w gra/, kod gry = 770f9c8b2 = f6b09c76b w src)

- `npx tsc --noEmit` → exit 0.
- `node tools/logic-test.cjs` → „LOGIC OK (213/213)”.
- `node tools/tech-tree-test.cjs` → „tech-tree-test: 20 pass, 0 fail”.
- `node tools/research-test.cjs` → „PASSED: 33 / FAILED: 0 / TOTAL: 33”.
- `node tools/unit-replace-test.cjs` → „WSZYSTKIE TESTY ZIELONE (21/21)”.
- `node tools/combat-test.cjs` → „COMBAT TEST: 6/6 pass”.
- Live: przebiegi A–E (tabela wyżej), seed 4242. Pozostałe ziarna NIE ZMIERZONO.
- `git diff --check` — do wykonania przed commitem (patrz niżej).

## BLOKADY

- Brak pomiaru 5 ziaren × 100 tur (budżet rundy, limit 590 s na Bash, zakaz run_in_background).
- t57 nieodtworzone; związek z t51 to hipoteza klasy, nie dowód dla t57.
- Nieznane: co gracz widzi po kliknięciu „Zakończ turę” przy otwartej audiencji (NIE ZMIERZONO).

## RUNDY

2/5 (runda 1: BLOCK bez live; runda 2: odpowiedź na FAIL, live częściowe, PASS-WITH-NOTES).

## NASTĘPNY KROK

Orkiestrator decyduje: (a) temat harnessu R-WEB-ENDTURN-HARNESS-AUDIENCE-Q1 (zamykanie audiencji w `clearBattles` + zapis liczników w zawieszeniu); (b) pytanie ABC o podpowiedź `main.ts:40729` i o to, czy audiencja AI ma blokować koniec tury; (c) dopiero potem 5-ziarnowy pomiar t57 na poprawionym harnessie.

## DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA

- Sesje/zadania nie były tworzone (zakaz z dispatchu).
- Brak run_in_background; wszystkie przebiegi foreground, ≤570 s na polecenie.
- Przebieg E zmienił zachowanie tylko w sondzie (`gra/tools/endturn-t57-repro.cjs`), nie w grze ani w runnerze.
