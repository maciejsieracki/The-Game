# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = args.cand = origin/main)
## Fakty
- gra/src/game/turn-economy.ts ~2181–2182 i ~2819–2820: komentarze „TEJ SAMEJ heurystyki co isCapital niżej (pierwsze miasto ownera w tablicy cities; ten moduł nie ma dostępu do autorytatywnego capitalCityIdForOwner z main.ts)”; w FALI 914 (MINTCAPITAL) dodano setOwnerCapitalCityResolver i ownersWithMennica liczy stolicę resolverem. Pozostałe użycia isCapital i pre-pass D2 (rejestracja pierwszego miasta ownera, ~2291 i ~2970 „D4: redukcja”) dalej używają heurystyki. Po jawnym przeniesieniu stolicy (capitalCityIdByOwner w main.ts) efekty stolicy w tej ścieżce mogą liczyć się dla innego miasta niż stolica w UI.
## Zadanie
1. Wypisz WSZYSTKIE efekty/warunki zależne od „stolicy” w turn-economy.ts (grep isCapital, capital, stolic) oraz w innych modułach silnika tury wołanych z advanceCityEconomy (tabela: miejsce, co daje, skąd bierze stolicę).
2. Zastąp heurystykę „pierwsze miasto” resolverem (ten sam helper co Mennica, jedno źródło prawdy) tam, gdzie decyduje o efekcie stolicy. Gdy resolver nie jest ustawiony (testy bez main.ts) — zachowanie dotychczasowe (kompatybilność testów).
3. Bez zmian wartości balansu i bez zmian kolejności obliczeń poza wyborem stolicy.
4. Testy: nowy gra/tools/capital-resolver-economy-test.cjs: scenariusz „stolica przeniesiona do miasta B (nie pierwsze w tablicy)”: efekty stolicy (każdy z tabeli) liczą się dla B, nie dla pierwszego miasta; bez resolvera zachowanie jak dotąd; mutacja czerwona (zdjęcie użycia resolvera). Istniejące testy ekonomii zielone: mint-capital-only, mint-orphan, waluta-mennica 61/0, trade-routes-income 135/0, ai-test 297/0, citizen-resource-upkeep, ekonomia testy dotykające stolicy (grep w gra/tools).
## Allowlista
gra/src/game/turn-economy.ts, inne moduły silnika tury TYLKO jeśli tabela z pkt 1 to wymaga (wypisz), gra/src/main.ts (tylko jeśli resolver trzeba przekazać inaczej), nowy gra/tools/capital-resolver-economy-test.cjs, dyspozycje/autobot/runs/R-WEB-CAPITAL-RESOLVER-ECONOMY-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana wartości balansu, osłabianie asercji (tylko kodujące stary kontrakt, wypisz), git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash. Dysk >= 6 GB; usuń node_modules po bramkach.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; testy tematu; nowy test z mutacją czerwoną. Zacommituj i zwróć SHA.
## DECISION_REQUIRED
Jeśli efekt stolicy dla gracza i AI w tej ścieżce zmienia wynik ekonomii w istniejących scenariuszach testowych (zmiana wartości) — zwróć DECISION_REQUIRED z liczbami.
## Binarne kryterium
Tabela efektów stolicy; wszystkie używają resolvera; test przeniesionej stolicy z mutacją czerwoną; bramki zielone; brak zmian wartości.
