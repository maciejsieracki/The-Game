# R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiar)
TEMAT: R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1
GOAL: pomiar na żywo limitu odwrotów armii (FALA 732) w kampanii; dopuszczone NIE_ZMIERZONO z powodem, gdy ścieżka żywa nieosiągalna.
ZMIANY-COMMIT: kandydat 567ceb91292f2630ede2434630fdbdef42fff711 (potomek bazy ef6e8ea1e — potwierdzone `merge-base --is-ancestor`). Diff vs baza: tylko `gra/tools/battle-retreat-limit-measure.cjs` (allowlista), `10-operator-claude.md`, `30-obrona-claude.md`. Zero zmian w gra/src, gra/data.
TESTY: `node --check` narzędzia: exit 0. `grep -c "battle|attack|retreat" gra/src/game/civ-test-hooks.ts` = 0 (potwierdza brak haka bitewnego). `git diff --name-only` baza..kandydat: 3 pliki, wszystkie w allowliście. tsc: nie dotyczy (zmiana tylko .cjs). Ponownego uruchomienia Chromium nie wykonałem (brak gra/node_modules; wyniki wg raportów Operatora/Obrony: SUMMARY runs=9 pageErrors=0 timedOut=0 oraz 6+3 w obronie) — NIE_ZMIERZONO przeze mnie.

## Zarzuty
1. Pomiar kampanii NIE_ZMIERZONO — ODDAL. Dispatch wprost dopuszcza NIE_ZMIERZONO z powodem; hak ruchu/ataku w civTest nie istnieje (grep=0), a jego dodanie wymaga gra/src poza allowlistą. Kryteria (1),(3) niespełnione, uczciwie zadeklarowane; to temat kolejny, nie błąd tej rundy.
2. Wiersze retreat=0/2 nie dowodzą odwrotu — ODDAL (naprawione w r2): dodane pola loserSurvivorsExported/loserDeadStillOnMap/atkOnMap/defOnMap oraz nagłówek z ograniczeniem; raport Operatora jawnie opisuje, że 0/2 oznacza "brak unicestwienia przez limit", nie "odwrót wykonany".
3. Niewyczerpana próba sterowników — ODDAL: obrona wykonała przegląd 5 sterowników (żaden nie wymusza bitwy kampanijnej), a brak haka potwierdziłem grepem. Nie jest to defekt do naprawy w tej allowliście.

Brak pozycji NAPRAW.

## Co zmierzono (poziom bitwy, Chromium, wg raportów)
3 ziarna x licznik 0/2/3: przy 3 flaga unicestwienia przegranego ustawia się (3/3), przy 0 i 2 nie (6/6); 0 błędów strony. Pomiar kampanii i faktycznego odwrotu o 2 hexy: NIE_ZMIERZONO.

BLOKADY: brak techniczny; pomiar kampanii wymaga nowego tematu (hak civTest w gra/src: seria przegranych bitew w turze + odczyt licznika odwrotów, ewentualnie rozszerzenie entry o przeżywającego przegranego).
RUNDY: 2/5 (obrona r2); FC werdykt końcowy.
NASTĘPNY KROK: integracja kandydata (tylko narzędzie + raporty, bez wpływu na grę); zadanie #437 zamknąć jako częściowe; decyzja orkiestratora o temacie haka kampanijnego.

UWAGI-DLA-ORKIESTRATORA:
- Dispatch 00-dispatch.md istnieje tylko w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie w origin/main.
- Narzędzie wchodzi bez wpływu na grę; nie wpisywać do WERSJE.md.

DEPLOY/PUSH: NIE WYKONANO
