# 30-obrona-claude — R-WEB-DIPLO-FORCED-PEACE-MANDATORY-ACCEPT-ENDTURN-GATE-Q1 (obrona, runda 4)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-FORCED-PEACE-MANDATORY-ACCEPT-ENDTURN-GATE-Q1
GOAL: pokój wymuszony z graczem czeka na akceptację; bramka „Zakończ turę”; okno z pełnym uzasadnieniem.
BAZA: 89a5e25cc (origin/main). Kandydat zarzutów: 4ab2b1869. Start obrony: 4ab2b1869.
ZMIANY-COMMIT: commit obrony r4 (SHA w polu sha wyniku), pliki: gra/src/game/war-weariness.ts, gra/src/game/war-weariness-view.ts, gra/src/main.ts, gra/tools/diplo-forced-peace-pending-test.cjs, ten raport.

## Odpowiedź na zarzuty Evaluatora (r4)

1. PRZYJMUJĘ CZĘŚCIOWO. Dodano test kolejki (f2): dwa pokoje z graczem w jednym ticku → dwa `deferred`, zero pay/finalize, obie pary usunięte ze stanu. Nadal NIE ZMIERZONO w teście jednostkowym: canEndTurn w `boot()`, round-trip zapisu, klik w tło/Esc w DOM, plan miast w pełnym main.ts. To pokrywa live S2 (pkt niżej) i kontrola źródłowa.
2. ODRZUCAM (ZAŁOŻENIE). Okno pokazuje całą treść inline (tytuł, partner, lead, why, terms, przycisk) — `forcedPeaceModalTextPl` + `showForcedPeaceModal`. Nic nie jest ukryte w tooltipach, więc nie ma luki R1 ani problemu z fokusem. Okno nie ma zamknięcia, a tooltipy byłyby jedynym źródłem „z czego to wynika” — gorsze dla klawiatury. Odchylenie od DODATKU 1 jawne; do oceny FC.
3. PRZYJMUJĘ CZĘŚCIOWO. Dodano powód z siły militarnej: przegrywający to strona słabsza wg `weakerOf` (compareMilitaryStrength), wygrywający — silniejsza. Dodano „zmęczenie wspólne dla obu stron”. ODRZUCAM liczbę drugiej strony: model ma jedną wartość zmęczenia na parę (`warWearinessPairView`: zwycięzca `zmeczenie = level`, przegrany `desperacja`), więc drugiego poziomu nie ma. NIE ZMIERZONO: remis (tekst „wyższa/niższa” nie obejmuje remisu, o którym rozstrzyga reguła gry).
4. PRZYJMUJĘ. Przywrócono kolejność z bazy: `d.pay` w bloku przed `none()`, z warunkiem `d.deferForcedPeace?.(loser, winner) !== true`. Pokoje AI↔AI zachowują bazową kolejność dokładnie; pokój z graczem nie płaci przed akceptacją. Osiągalność: przy progu 1,0 `wearinessPeaceCashPn` = 0, więc gałąź `cashPn > 0 && !full` jest nieosiągalna przy domyślnych parametrach (zgodnie z komentarzem w kodzie). Testy b/c zielone.
5. PRZYJMUJĘ. Wprowadzono `pendingPeaceItems(p)` — jeden filtr `cityCessionPlanFor` używany zarówno przez okno (`cityNames`), jak i przez akceptację (`items`). Okno pokazuje dokładnie to, co zostanie przeniesione. NIE ZMIERZONO scenariusz z miastami w pełnym main.ts (cena 0 przy 100%).

## TESTY (surowe wyniki)
- `npx tsc --noEmit` (gra/): exit 0
- `node tools/diplo-forced-peace-pending-test.cjs`: PASS=40 FAIL=0
- `node tools/diplo-weariness-stages-view-test.cjs`: 22 pass / 0 fail
- `node tools/peace-vazne-always-test.cjs`: WYNIK: ZIELONE
- Bramki: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0 / TOTAL: 33`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `COMBAT TEST: 6/6 pass`
- Live S2: oryginalny `diplo-peace-auto-stale-offer-live-test.cjs` nie startuje w tej sesji (Chromium SIGTRAP przy domyślnym launchu). Uruchomiono kopię w scratchpadzie z tym samym kodem, zmieniono tylko ścieżkę przeglądarki na `chromium_headless_shell-1194` i świeży build: `PASS=15 FAIL=0`. Repo nie zmienione.

## BLOKADY
- Brak harnessu zachowania dla `boot()` (canEndTurn, zapis z oczekującym traktatem, klik w tło/Esc w DOM).
- DODATEK właściciela (kolejność płatności miasta→surowce, „ludy”) — decyzja ABC, poza zakresem.

## UWAGI-DLA-ORKIESTRATORA
- Baza (AI↔AI, poza zakresem): `d.pay` przed `none()` przekazuje miasta także wtedy, gdy wojna nie kończy się pokojem (cashPn>0 && !full). Zachowano bazę; do osobnego tematu.
- Live: launch w oryginalnym teście wymaga poprawki środowiska (ścieżka przeglądarki); nie zmieniałem repo.
- Środowisko: `gra/node_modules` zainstalowane przez `npm ci` (niezacommitowane, nie usunięte — zakaz rm). Dysk `df -h /`: 4,4 GB przed, 3,3 GB po instalacji.
- NIE ZMIERZONO: Chromium (okno, fokus, tooltipy), zapis z oczekującym traktatem.

RUNDY: 4/5 (Operator, Haiku; licznik porażek tematu 2, poprawki wąskie — bez Sonneta)
NASTĘPNY KROK: Evaluator/Final Control — weryfikacja commita obrony r4.
DEPLOY/PUSH: NIE WYKONANO
