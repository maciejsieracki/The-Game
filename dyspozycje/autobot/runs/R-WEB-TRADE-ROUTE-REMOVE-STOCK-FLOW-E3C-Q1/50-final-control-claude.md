# R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 — Final Control

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1
GOAL: aktywny szlak handlowy nie zmienia zapasow zadnej strony; zostaje dochod, boolean-grant dostepu, limity i kontakt szlaku.
ZMIANY/COMMIT: oceniany kandydat 9e25e4713 (potomek bazy 005cd9ab0: `git merge-base --is-ancestor` = OK). Diff vs baza: main.ts (usuniety blok E3c + 3 importy), trade-routes.ts (komentarze), surow-civ-storage-test, trade-ilosc-test, poradnik 08, szlaki-handlowe.md, wikiBundle.json, raporty; wszystko w allowliscie. Uwaga: baza 005cd9ab0 NIE jest potomkiem obecnego origin/main (06fcc8526; wspolny przodek 50f607fe3) — integracja wymaga decyzji orkiestratora.

TESTY (ZMIERZONE przeze mnie na 9e25e4713, gra/ po npm ci):
- tsc --noEmit: exit 0
- trade-ilosc 42/0, trade-grant 62/0, zloto-szlak 54/0, trade-routes 96/0, income 134/0, contact-only 36/0, limit 76/0, ownership-income 18/0, hud-filter 58/0
- surow-civ-storage: 63 passed, 4 failed (sekcja G wyrebu lasu, dlug bazowy, poza zakresem; sekcja I nowa zielona)
- 5 bramek referencyjnych: NIE ZMIERZONO (dysk 5,4 GB < 6 GB)
- test w realnej turze (Chromium jest: /usr/bin/chromium): NIE WYKONANO — nikt go nie zrobil

ROZSTRZYGNIECIE ZARZUTOW:
1. (a) brak testu w realnej turze z pomiarem zapasow/dochodu przed i po — NAPRAW (kryterium binarne dispatchu; Operator i Obrona zapisali NIE ZMIERZONO).
2. (b) mutacja tylko tekstowa; zloto-szlak-test sekcja 4 nadal asercjonuje stary przeplyw — NAPRAW (zaktualizowac do zasady „szlak nie przenosi”; mutacja = przywrocenie wywolania w realnym przebiegu). Czesc o trade-ilosc-test ODDALONA (juz 42/0).
3. Martwy kod computeTradeRouteResourceFlow / loadTradeRouteResourceFlowParams / TRADE_ROUTE_STOCK_FLOW_KEYS / DEFAULT_*_FLOW_PARAMS oraz komentarze (citizen-resource-upkeep.ts l.48/63/312, main.ts) — NAPRAW. ZALOZENIE: „nic poza testami” = wolno usunac, gdy uzywaja go wylacznie testy starego zachowania; testy przepisac. citizen-resource-upkeep.ts do allowlisty.
4. Teksty dla gracza/dokumentacja — NAPRAW: Mennica cityPanel.ts:11612 („Kopalnia zlota, szlak handlowy lub zapas”) wprowadza gracza w blad; zloto-access.ts naglowek, trade-routes.ts ~1842-1847 (czesc o „sztukach”), poradnik 08 ~l.406 dwuznaczny. Wymaga rozszerzenia allowlisty (cityPanel.ts, zloto-access.ts) — decyzja orkiestratora. Krok (4) resource-ledger.ts: ODDALONY (plik nie istnieje w bazie).
5. perf-large-empire-stress-live-test.cjs l.468-472 robi replaceOnce na usunietym bloku (potwierdzone grepem) — NAPRAW (allowlista do rozszerzenia).
6. (c) brak testu realnej tury dla grantu rownolegle z brakiem przeplywu — NAPRAW razem z pkt 1.
7. (d) dysk: ODDAL (warunek srodowiskowy, 5,4 GB), ale dlug Rust REPIN nie zapisany w raporcie Operatora — NAPRAW (jedna linia: REPIN — dane i logika przeplywu usunieta).

Kod usuniecia bloku E3c w main.ts jest poprawny (diff przeczytany, tsc 0, grant dostepu nietkniety, testy szlaku zielone); brakuje dowodu realnej tury i domkniecia martwego kodu/tekstow/skryptu pomiarowego.

BLOKADY: brak pomiaru live (a, c); martwy kod; teksty gracza i perf-skrypt poza allowlista; baza starsza niz origin/main.
RUNDY: FC 1; lacznie Operator 2/5 zuzyte — nastepna runda 3/5.
NASTEPNY KROK: Operator (to samo ID) — pkt 1-7 z rozszerzona allowlista (cityPanel.ts, zloto-access.ts, citizen-resource-upkeep.ts, perf-large-empire-stress-live-test.cjs); potem Evaluator → FC; przed integracja merge z origin/main.
UWAGI-DLA-ORKIESTRATORA: dispatch tematu jest tylko w galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0; rozszerzenie allowlisty wymaga Twojej decyzji.
DEPLOY/PUSH: NIE WYKONANO
