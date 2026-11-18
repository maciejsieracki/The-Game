# 30-obrona-claude — R-WEB-DIPLO-FORCED-PEACE-MANDATORY-ACCEPT-ENDTURN-GATE-Q1 (obrona, runda 2)

STATUS: PASS-WITH-NOTES (częściowa obrona: przyjęte 6 zarzutów, 3 częściowo, 1 nie wykonany — szczegóły niżej)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-FORCED-PEACE-MANDATORY-ACCEPT-ENDTURN-GATE-Q1
GOAL: pokój wymuszony z graczem czeka na akceptację; bramka „Zakończ turę”; okno z uzasadnieniem.
ZMIANY-COMMIT: 006268ea8 (kod + test; allowlista: gra/src/main.ts, gra/src/ui/diplomacyAudience.ts, gra/src/game/war-weariness-view.ts, gra/tools/diplo-forced-peace-pending-test.cjs). Baza kandydata: e6522d8a9 (kod operatora r1), baza main 89a5e25cc.

## Odpowiedź na zarzuty Evaluatora

1. PRZYJMUJĘ — wpis „Nie można zakończyć tury” w Ważne. Dodany wpis `end-turn-block-forced-peace` (tytuł `END_TURN_BLOCK_EVENT_TITLE`, ważny, negatywny) w budowaniu zdarzeń panelu, dopóki wisi pokój wymuszony. Treść: „najpierw zaakceptuj warunki pokoju wymuszonego z <cywilizacja>”.
2. PRZYJMUJĘ — auto-otwarcie: (a) po wczytaniu zapisu z oczekującym traktatem okno otwiera się przez `setTimeout(showNextPendingForcedPeace, 0)`; (b) po `turn++` (początek tury) okno wraca, jeśli traktat wciąż wisi. Okno jest idempotentne (poprzednie usuwane).
3. CZĘŚCIOWO — tekst okna rozszerzony o: formułę („5% za każdą turę wojny i 10% za każde miasto, które zmieniło właściciela”), kto przegrywa/wygrywa, liczbę tur wojny i zmienionych miast, karencję (`lockTurns`), „Zapłata: 0 PN” przy braku miast, „Zaufanie po pokoju: 20”. Liczby formuły są wpisane w tekst z decyzji #363, NIE czytane z parametrów — do weryfikacji. NIE WYKONANO: tooltipy z diplomacyTipText.ts i rozwijany „Szczegóły” — tekst jest w całości widoczny bez tooltipów, więc nic nie jest ukryte, ale brak warstwy tooltipów.
4. PRZYJMUJĘ — nieaktualne pokoje: `prunePendingForcedPeace()` usuwa wpisy, gdy para nie jest już w wojnie albo któraś strona wyeliminowana. Wołane przy: oknie, akceptacji, bramce „Zakończ turę”, budowaniu wpisu Ważne. Akceptacja nie wykonuje już pokoju dla nieaktualnej pary (prune przed `shift`).
5. PRZYJMUJĘ — wyciek Esc: strażnik `forcedPeaceEscGuard` zdejmowany przy każdym ponownym otwarciu (`clearForcedPeaceEscGuard`) i przy akceptacji; dodatkowo strażnik sam się zdejmuje, gdy okno nie jest już w DOM (`overlay.isConnected`).
6. CZĘŚCIOWO — testy: dodano 7 asercji źródłowych (r2-1..r2-7: wpis Ważne, auto-otwarcie x2, prune, zdjęcie Esc, walidacja zapisu, tekst). Test: `diplo-forced-peace-pending-test` PASS=33 FAIL=0. NIE WYKONANO: testów zachowania (canEndTurn, transfer miast przed akceptacją, 2 traktaty naraz, round-trip zapisu, przegrywający/wygrywający z planem miast) — wymagają harnessu uruchamiającego `boot()`; nie zbudowano go w tej rundzie.
7. NIE WYKONANO — DODATEK właściciela (miasta → surowce od najdroższych → nigdy ostatnia stolica). Nie zmieniono planu zapłaty. Stan kodu: `acceptPendingForcedPeace` filtruje miasta przez `cityCessionPlanFor` i pomija odrzucone po cichu (bez replanu). Interpretacja „ludy” (kruszce czy luksusy) pozostaje do decyzji właściciela — proponuję DECISION_REQUIRED (ABC) przed implementacją. Przy progu 100% wg wearinessPeaceCashPn cena = 0, więc w praktyce pokój zapada bez oddawania miast; ten fakt nie został zmierzony scenariuszem w tej rundzie.
8. NIE ZMIERZONO — Chromium (xvfb, hak civTest) nie wykonane w tej rundzie. Zrzutów PRZED/PO nie ma. Potwierdzono tylko: tsc --noEmit exit 0; vite build exit 0.
9. CZĘŚCIOWO — walidacja odczytu zapisu: każdy wpis wymaga `pairKey: string`, `loser/winner: number`, `level/lockTurns: number`; uszkodzone wpisy są pomijane, reszta pól ma wartości domyślne. NIE WYKONANO: test round-trip zapisu/odczytu.

## TESTY (surowe wyniki)
- `npx tsc --noEmit` (gra/): exit 0
- `node tools/diplo-forced-peace-pending-test.cjs`: `PASS=33 FAIL=0`
- `node tools/ai-war-weariness-peace-test.cjs`: `PASS=96 FAIL=0`
- `node tools/diplo-peace-price-decay-test.cjs`: `PASS=13 FAIL=0`
- `node tools/diplo-peace-auto-stale-offer-test.cjs`: `PASS=6 FAIL=0`
- `node tools/diplo-peace-balance-accept-test.cjs`: `32 pass / 0 fail`
- `node tools/diplo-peace-price-wiring-test.cjs`: `PASS=14 FAIL=0`
- vite build do katalogu poza repo (scratchpad): exit 0, `built in 16.74s`
- Chromium: NIE ZMIERZONO

## BLOKADY
- Brak harnessu zachowaniowego dla `boot()` (main.ts jest jednym wielkim closure) — kryteria (a)(b)(c)(e)(h) z dispatchu pokrywa tylko kod, nie wykonanie.
- DODATEK właściciela (kolejność płatności) — wymaga decyzji ABC i osobnego tematu.
- Chromium niedostępne w tej rundzie.

## Uwagi
- Operator nie integruje i nie pushuje. Commit lokalny w gałęzi `autobot/R-WEB-DIPLO-FORCED-PEACE-MANDATORY-ACCEPT-ENDTURN-GATE-Q1-obrona` (worktree).
- Drobne: przeniesiono komentarz JSDoc `logPeaceVazne` na właściwe miejsce (wcześniej wisiał nad `showNextPendingForcedPeace`).
- Zależności instalowane wyłącznie lokalnie w worktree (`npm ci --ignore-scripts`) i usunięte po teście.

## RUNDY
Runda 2 (obrona po FAIL-ZARZUTY e6522d8a9 / raport 11ab3d24a). Poprzednia runda: Operator r1.

NASTĘPNY KROK: Evaluator r3 — weryfikacja zmian 006268ea8; decyzja właściciela: kolejność płatności (DODATEK) i liczby formuły (czy czytać z parametrów).
DEPLOY/PUSH: NIE WYKONANO
df -h / : 6,8 GB przed, 5,6 GB po (po usunięciu gra/node_modules i katalogu buildu)

## RUNDA 3 (obrona po FC FAIL rundy 2; zarzuty R2 + regresje testów)
- R2 (jedyny zarzut): okno pokoju wymuszonego podawało literał „5% za każdą turę”. Naprawa: `forcedPeaceModalTextPl` (gra/src/game/war-weariness-view.ts) liczy liczby z parametrów: `100 / P.zmeczenie.pelneTur` (= 2,5) i `P.zmeczenie.wagaStratMiasta * 100` (= 10). Parametr `P` domyślnie `WAR_WEARINESS_PARAMS`. Inne miejsca komunikatu: diplomacy-display.ts:426 już liczy z parametrów; main.ts i diplomacyAudience.ts bez literału. grep `o 5% za` w gra/src i gra/tools: brak trafień poza testem.
- Test r2-7 (diplo-forced-peace-pending-test.cjs): asercja behawioralna — tekst `why` zawiera „2,5%” i „10%” wyliczone z `gra/data/war-weariness-params.json`; literał `(^|[^0-9,])5% za każdą turę` nieobecny. Mutacja (`perTurnPct = fmtPct(5)` w źródle) → FAIL 2, przywrócone.
- Regresje z zarzutów R1 (czerwone na kandydacie), naprawione w testach bez zmiany kodu gry: diplo-weariness-stages-view-test mt1–mt3 (dopasowanie `startsWith` + sufiksy „Zaufanie po pokoju: 20.” i „Zapłata: 0 PN.”); peace-vazne-always-test P3/M3 (wpis pokoju wymuszonego idzie przez logPeaceVazne w acceptPendingForcedPeace, brak wpisu forced-peace-<tura>; mutant M3 celuje w to wywołanie).
- Zmieniono tylko: gra/src/game/war-weariness-view.ts, gra/tools/diplo-forced-peace-pending-test.cjs, gra/tools/diplo-weariness-stages-view-test.cjs, gra/tools/peace-vazne-always-test.cjs.

### TESTY (surowe wyniki, ta runda)
- `npx tsc --noEmit`: exit 0
- `node tools/diplo-forced-peace-pending-test.cjs`: PASS=36 FAIL=0
- `node tools/diplo-weariness-stages-view-test.cjs`: 22 pass / 0 fail
- `node tools/peace-vazne-always-test.cjs`: WYNIK: ZIELONE
- Bramki referencyjne: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0`; combat-test `All sanity checks passed`; unit-replace-test `[OK]` (exit 0).
- 16 testów weariness/peace/forced-peace/balance/winner-proposal: 16/16 exit 0.
- Pełny przebieg 155 testów diplo*/peace* przerwany (przekroczenie limitu czasu w pierwszym planie, zatrzymany); NIE ZMIERZONO.
- NIE ZMIERZONO: Chromium; fokus i tooltipy okna.

### ZMIANY/COMMIT
Commit lokalny w worktree (gałąź detached z 082a7477b); tylko 4 pliki gra/ + ten raport. Pliki PNG z dowodami regenerowane przez testy przywrócone (`git checkout`), nie są w commicie. `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` (brak `rm` w tej rundzie) — do usunięcia przez orkiestratora przy sprzątaniu worktree.

RUNDY: 3/5 (Operator, Haiku). Poprzednie zarzuty: R1 naprawione w testach; R2 naprawione.
NASTĘPNY KROK: Evaluator/Final Control — weryfikacja commita; DODATEK (kolejność płatności miasta→surowce) poza zakresem, do ABC.
DEPLOY/PUSH: NIE WYKONANO
