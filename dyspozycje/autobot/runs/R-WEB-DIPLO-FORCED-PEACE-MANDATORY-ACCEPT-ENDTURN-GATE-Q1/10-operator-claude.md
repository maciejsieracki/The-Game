# R-WEB-DIPLO-FORCED-PEACE-MANDATORY-ACCEPT-ENDTURN-GATE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (kod + testy zielone; Chromium NIE ZMIERZONO; kilka punktów z dispatchu zostawionych, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-FORCED-PEACE-MANDATORY-ACCEPT-ENDTURN-GATE-Q1
GOAL: pokój wymuszony (zmęczenie 100%) z udziałem gracza czeka na akceptację „Akceptuję warunki pokoju”; bez akceptacji nie da się zakończyć tury; okno podaje z czego wynika pokój.
BAZA: 89a5e25cc47b8a6af5ede7a24c0c36930eda0eff (origin/main), HEAD = commit z kodem i raportem (SHA w polu sha zwrotki).

ZMIANY-COMMIT:
- gra/src/game/war-weariness.ts: opcjonalny hak `deferForcedPeace(loser, winner)`; przy odroczeniu tick zwraca `forced_peace` z `deferred: true` i `lockTurns`, bez pay/finalize. Progi, ceny i formuły bez zmian.
- gra/src/game/war-weariness-view.ts: forcedPeaceModalTextPl dostaje `why` (zmęczenie %, tury wojny, zmienione miasta), `acceptLabel`, opcjonalne pola liczbowe.
- gra/src/main.ts: lista `pendingForcedPeaceTreaties` (stan + zapis w meta, migracja: brak pola = pusta lista, reset przy nowej grze); wiring `deferForcedPeace` dla par z graczem; kolejka okien; `acceptPendingForcedPeace` (zapłata, finalizePeaceTreatyBetween, jeden wpis „Pokój zawarty” w Ważne przez logPeaceVazne); bramka `canPlayerInitiateEndTurn` i podpowiedź „Najpierw zaakceptuj warunki pokoju wymuszonego z <cywilizacja>”. Usunięto wpis `forced-peace-…` dla par z graczem.
- gra/src/ui/diplomacyAudience.ts: showForcedPeaceModal(opts + onAccept): jedyny przycisk, brak zamknięcia kliknięciem w tło, Esc blokowany (capture).
- gra/tools/diplo-forced-peace-pending-test.cjs (nowy): 26 asercji (zachowanie ticka, tekst, źródło bramki/zapisu/okna, mutant).

TESTY:
- tsc --noEmit: 0 błędów (pusty wynik).
- vite build do /tmp/claude-0/fpend-build: exit 0.
- diplo-forced-peace-pending-test.cjs: PASS=26 FAIL=0 (mutant bez odroczenia czerwieni asercję a).
- Regresja: diplo-weariness-forced-peace-test 14/0; diplo-weariness-forced-peace-wiring-test 13/0; diplo-weariness-city-only-test 26/0; diplo-weariness-20-turns-test 31/0; diplo-peace-price-decay-test 13/0; diplo-weariness-migration-peak-test 7/0; diplo-peace-auto-stale-offer-test 6/0.
- Chromium (xvfb) NIE ZMIERZONO: brak czasu w tej rundzie; okno, bramka i zapis w żywej grze niesprawdzone.

BLOKADY / NIE ZROBIONE:
1. Tooltipy (diplomacyTipText.ts, wyliczenia formuły 5%/turę + 10%/miasto, karencja, zaufanie): NIE wdrożone. Cała treść jest w widocznych liniach okna (why/terms), więc nic nie znika, ale brak rozwijanego „Szczegóły”.
2. Wpis „Nie można zakończyć tury” w zakładce Ważne (endTurnBlockEventOf): NIE dodany. Blokada działa przez bramkę i podpowiedź, nie przez kartę.
3. Wczytanie zapisu z oczekującym pokojem: stan wraca (meta), ale okno NIE otwiera się automatycznie po load; otwiera się przy próbie „Zakończ turę” lub po kolejnym ticku. Do domknięcia.
4. Otwarcie okna przy początku tury gracza: okno otwiera się zaraz po ticku końca tury (AI-faza jest synchroniczna), nie w osobnym hooku „start tury”. NIE ZMIERZONO w przeglądarce.
5. Akceptacja z zapłatą: plan miast liczony w ticku; w chwili akceptacji miasta, których cityCessionPlanFor nie zalicza, są pomijane (pokój zapada). Brak ponownego planu.
6. DODATEK właściciela („jeśli miastami nie da się wyrównać — surowce: złoto, potem kruszce/„ludy”; nigdy ostatnia stolica”): NIE zaimplementowane. Ustalenie z kodu: przy progu 100% cena = wearinessPeaceCashPn(1) = 0, więc pokój zapada bez miast i bez surowców (okno pokazuje „Pokój bez wymiany miast”). Interpretacja „ludy” niejasna. DECISION_REQUIRED: czy przy 100% ma być jakakolwiek zapłata (surowce/złoto), a słowo „ludy” = kruszce czy luksusy?
7. Nie dotykano cen, progów, formuł zmęczenia ani reguł AI↔AI (zgodnie z ZAKAZ).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator — sprawdzić wpisy 1 i 3 (load), 6 (DECISION_REQUIRED) oraz uruchomić Chromium z hakiem zmęczenia 100%; ewentualna runda 2 na tooltipy i wpis Ważne.
DEPLOY/PUSH: NIE WYKONANO
