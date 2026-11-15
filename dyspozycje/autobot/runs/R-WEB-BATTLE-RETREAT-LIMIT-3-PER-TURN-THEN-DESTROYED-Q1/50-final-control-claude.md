# R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1 — raport Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1
GOAL: armia do trzech odwrotów w jednej turze; kolejna przegrana w tej turze = unicestwienie; reset w następnej turze; gracz i AI.
ZMIANY/COMMIT: oceniony kandydat 338c990098364c8ce88c7cab55255aa035159d4b (kod 5a971c1e6, baza 50f607fe3 jest jego przodkiem: `merge-base --is-ancestor` = OK). Integrować: 338c99009. FC nie zmienia kodu; ten raport to jedyny commit FC (na gałęzi worktree).

## TESTY (własne uruchomienia FC, surowe wyjście)
- tsc --noEmit na kandydacie: exit 0. Po `git merge --no-commit origin/main` (42a93543a, merge automatyczny bez konfliktów): exit 0.
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0.
- battle-retreat-limit-test 43/0; pre-battle-retreat-exhausted 37/0; battle-defeat-survivor-retreat-two-hex 44/0; retreat-garnizon-fortyfikacja 27/0; battle-undeployed-units PASS=37 FAIL=0; pre-battle-defender-retreat OK.
- Na drzewie po merge z origin/main: battle-retreat-limit 43/0, pre-battle-retreat-exhausted 37/0, two-hex 44/0, battle-undeployed 37/0, logic 213/213, unit-power 6/0 (merge porzucony po pomiarze, nic nie zacommitowano).
- Chromium (Playwright, vite przez HTTP): battle-retreat-limit-browser-test = BROWSER PASS (licznik 0 i 2: ocaleli przegranej zostają, odwrót 2 heksy x17; licznik 3: atkOnMap=0, atkAnnihilated=true) na prawdziwym BattleScene + applyPostBattleMap.
- Chromium, własny pomiar FC (jednorazowy harness, usunięty): prawdziwy showPreBattle z retreatExhaustedThisTurn=true -> przycisk `Wycofaj` renderowany i `disabled=true`, tekst „Wycofanie niedostępne — wyczerpano trzy odwroty w tej turze, rozstrzygnij bitwę (przegrana = unicestwienie armii)”, 0 błędów strony.
- Mutacja własna FC: `&& retreatBudgetExhausted(defRoster),` -> `&& false,` w main.ts: battle-retreat-limit-test 42/1 (FAIL 3d). Przywrócone (cmp OK, status czysty). Mutacje M2/M7/M8 Operatora: nie powtarzane (NIE ZMIERZONO przez FC).
- Referencyjne bramki niewymienione w dispatchu (map-gen, mgła-inwariant itd.): NIE URUCHAMIANO; zmiana nie dotyka ich plików (diff: post-battle-map.ts, main.ts, preBattle.ts, setup.ts, nowy battle-retreat-limit.ts, combat-params.json, testy).

## WERDYKT PER ZARZUT
1. Chromium: ODDAL częściowo. Unicestwienie na prawdziwej bitwie + wyszarzony przycisk z powodem zmierzone w Chromium. NIE ZMIERZONO: toast showHintMessage z komunikatem w pełnej grze (main.ts, brak haka testowego; wiązanie pinowane tekstowo, helper stałej wykonany w harnessie) i zrzut pełnego ekranu gry. Ryzyko niskie (istniejący showHintMessage).
2. Atakujący nie liczony: NAPRAWIONE w r2 (gałąź `obronca`, atkRetreatBudgetExhausted, testy 2g/2h, Chromium). Potwierdzone.
3. Remis: ODDAL. retreatDefendersOnTie nie jest odwrotem 2-heksowym i remis nie jest przegraną; dispatch mówi o przegranej. ZAŁOŻENIE: remis nie liczy. Nie jest to decyzja produktowa wymagająca ABC.
4. Testy wiązania: NAPRAWIONE na tyle, na ile możliwe (piny na kod bez komentarzy, M4 czerwone — potwierdzone przez FC). Brak testu behawioralnego main.ts = ograniczenie (main.ts nie do wykonania w node).
5. Komunikat tylko hint 6 s, bez wpisu w podsumowaniu/wydarzeniach: ODDAL z notą. Rozróżnienie stron (gracz/wróg) wdrożone. Wpis w dzienniku bitwy = NIE WYKONANO (brak punktu wpięcia) — kandydat na osobny temat; nie blokuje GOAL pkt 2 w sensie widocznego komunikatu dla gracza.
6. Civpedia/wikiBundle: ODDAL. Brak hasła opisującego odwrót; nie ma co aktualizować.
7. Semantyka licznika (max po rosterze): ODDAL. Test 2i dodany; rozdzielanie armii NIE ZMIERZONO, ryzyko niskie.
8. Zgodność z nowszym main: ROZSTRZYGNIĘTE pomiarem (merge czysty, tsc 0, testy tematu zielone na drzewie po merge).

Żaden zarzut nie wymaga NAPRAWY ani realnej decyzji produktowej.

## UWAGI-DLA-ORKIESTRATORA
- Reset licznika stoi w tym samym miejscu co dawny reset `retreatedThisTurn` (start fazy świata w runWorldEndTurn), więc odwroty gracza wykonane w fazie AI przechodzą do jego następnej tury aż do kolejnego „Zakończ turę” — semantyka zgodna ze starym zachowaniem i dispatchem; warto potwierdzić z właścicielem, że o to chodziło.
- Osobne tematy: wpis unicestwienia w podsumowaniu/wydarzeniach bitwy; ewent. hasło Civpedii o odwrocie; zrzut pełnej gry z toastem.
- Przed integracją: `git merge-base --is-ancestor 338c99009 <integracja>` i `git diff --stat` (13 plików). Po merge: ponowić bramki na drzewie.
- node_modules w worktree FC (gra/node_modules, nie commitowane) do sprzątnięcia.

BLOKADY: brak blokad technicznych.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: integracja orkiestratora (merge 338c99009 z origin/main + bramki), wpis w rejestrze, deploy na ROBOCZĄ po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
