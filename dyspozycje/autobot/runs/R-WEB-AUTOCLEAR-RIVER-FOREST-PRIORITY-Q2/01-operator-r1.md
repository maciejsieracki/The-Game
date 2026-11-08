STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOCLEAR-RIVER-FOREST-PRIORITY-Q2
GOAL: Automat (tryb Żywność, „Wolno wycinać las” ON, pula 100%) wycina las przy/na rzece z priorytetem (pod farmę), także gdy „Tylko pola z obywatelami” ON.
ZMIANY/COMMIT: allowlista = `gra/src/game/auto-improvements.ts` (+16 linii), `gra/tools/autoclear-river-forest-priority-test.cjs` (NOWY), `dyspozycje/autobot/runs/R-WEB-AUTOCLEAR-RIVER-FOREST-PRIORITY-Q2/**`. Baza `23dd158e9` (= origin/main). SHA: patrz ostatni wiersz (wpisany po commicie).

## Diagnoza (zmierzona)
- (a) POTWIERDZONE, to jest przyczyna. Las na heksie rzeki zwykle nie ma obywatela, a Zasada 2 (`auto-improvements.ts` `candidateHexes` filtr ~1441 + `hexAllowsKey` ~1425) wyrzuca heks bez obywatela z kandydatów (poza złożami) i odrzuca `wyrab` w `riverKrok0Ok` (~1675). E2 nie ma celu, więc picker schodzi do E3/E4 (trzoda, irygacja) i dalej. Log pickera PRZED: `kandydat odpada: heks bez obywatela (onlyWorked)`; w symulacji tura po turze wycinka wchodziła tylko na polach obywateli (np. 11,12), a las NA rzece (12,11 / 12,10 / 13,10) nie był wycinany nigdy.
- (b) martwy warunek „czeka na zagospodarowanie rzeki”: NIE jest przyczyną tu (E2 wycinka rzeczna nie zależy od `rzekiDoZagospodarowania`; gating E5 pozostaje, bez zmian).
- (c) trzoda/irygacja wyprzedzają wycinkę: skutek (a), nie osobna przyczyna — E3/E4 ruszają, bo E2 jest puste. Kolejność E1<E2<E3<E4<E5 bez zmian.
- (d) pula 100% dostępna: tak (sim: pracaAvailable 400, pct 100, wycinka wybierana przy onlyWorked OFF od tury 1). NIE_ZMIERZONO osobno wpływu progu rezerwy w realnej grze poza live (live: pula 300, pct 33).
- Z „OFF” (onlyWorked) działało już PRZED (wycinka rzeczna w turze 1).

## Poprawka
`riverForestPrepHex(q,r)` (auto-improvements.ts ~1431): w profilu `zywnosc`, gdy `wolno wycinać` nie jest wyłączone (`!citySkipWyrab`), heks z lasem na/przy rzece (`onRiverHex`) o bazie pod farmę (`isFarmBaseTerrain`) jest (1) zachowywany w `candidateHexes` mimo `onlyWorked` i (2) dopuszczany w `hexAllowsKey` wyłącznie dla klucza `wyrab`. Filtr zostaje dla wszystkich innych ulepszeń i dla wycinki poza rzeką; U-6=A (OFF blokuje całą wycinkę) bez zmian (blokada w `wyrabWlaczony`).
ZAŁOŻENIE: zakres tylko profil Żywność (K1), zgodnie z dispatchem. K2 „Zrównoważone” ma ten sam objaw potencjalnie, ale `wyrab-rzeka-d1-test.cjs` (K2, poza allowlistą) kodyfikuje zachowanie K2 — pierwsza wersja poprawki obejmująca K2 złamała ten test, więc zawężono. DECYZJA_WYMAGANA (do orkiestratora): czy rozszerzyć na K2 (wymaga zmiany testu d1).
ZAŁOŻENIE 2: po wycince farma na heksie bez obywatela nadal podlega „tylko pola z obywatelami” (filtr dla farmy zachowany); wycinka jest przygotowaniem pola, obywatel obejmie pole lub farma powstanie po jego objęciu.

## TESTY
- Nowy `gra/tools/autoclear-river-forest-priority-test.cjs` (prawdziwy `pickAutoImprovements`, symulacja tura po turze, bez mocka): PRZED 9 OK / 2 FAIL (EXIT=1, `gate-PRE-autoclear-river-forest-priority-test.txt`), PO 13 OK / 0 FAIL (EXIT=0). Kontrakt: wycinka rzeczna w <=4 turach przy onlyWorked ON i OFF; skipWyrab blokuje (ON/OFF); las bez rzeki poza polami obywateli nie wycinany; farma E1 przed wycinką; wzgórza nie wycinane; K2 bez zmian; wycinka->farma.
- Mutacje (`mut-*.txt`): M1 (usunięcie wyjątku w hexAllowsKey) EXIT=1; M2 (usunięcie wyjątku w filtrze kandydatów) EXIT=1; M3 (wyjątek dla każdego profilu) EXIT=1.
- Żywy dowód Chromium (realna nowa gra, ta sama mapa, stolica 29,49, Żywność, wolno=ON, onlyWorked ON, 15 tur, bundle zbudowany vite z kopii poza repo, harness `autoclear-priority-live-test.cjs` bez zmian): PRZED 0 wycinek w 15 turach (t2 trzoda, t3 irygacja — dokładnie objaw właściciela); PO: t2 wycinka 22 heksów, z czego 8 NA rzece (`riverPaths`), 12 PRZY rzece, 2 poza (`evidence/live-*.json`). Nie sprawdzano zrzutu UI nazwy „wycinka (rzeka+las)” (NIE_ZMIERZONO).
- Regresje PRZED vs PO (`gate-PRE-*`/`gate-PO-*`): ai-food-improvement-priority-stages, ai-improvements, auto-improvements, autoclear-priority-q1, autoimprove-stages-q1, city-clears-forest, farma-nie-w-lesie, food-hodowla, hodowla-las, oboz-lowiecki-wymaga-tartaku, wyrab-rzeka-d1/krok0/r2: EXIT=0 PRZED i PO. `oboz-lowiecki-las-test`: EXIT=1 PRZED i PO (identyczne FAIL-e, wcześniej istniejące, niezwiązane — różnią się tylko czasy mapGen).
- tsc `--noEmit`: EXIT=0 (`gate-tsc.txt`).

## BLOKADY
Brak. Nie wykonano `npm run build/dev` w `gra/`; bundle przez vite z kopii w /dev/shm (usunięta), `node_modules` usunięte po pracy.

## UWAGA DLA EVALUATORA
Wcześniejsza wersja poprawki (K1+K2) złamała `wyrab-rzeka-d1-test` — świadomie zawężona. Sprawdzić: czy 22 wycinki w jednej turze mieszczą się w budżecie (33%×pula 300) (NIE_ZMIERZONO osobno kosztu wyrębu; pula spadła 261->207 w tej turze).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r1) tego samego ID.
DEPLOY/PUSH: NIE WYKONANO
