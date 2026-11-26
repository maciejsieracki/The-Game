# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = args.cand)
## Stan kodu (z rejestru, KOREKTA FAKTÓW MENNICA)
- gra/data/buildings.json: lokalizacja „stolica”; bramka w production.ts (buildingLocationAllowed) i cityPanel.ts; waluta-mennica-test §11 (decyzja 70/B 2026-07-25). Bonus: gra/src/game/turn-economy.ts ownersWithMennica — działa na całą cywilizację.
- Luka: po przeniesieniu/utracie stolicy Mennica stoi w mieście niebędącym stolicą i dalej działa; można dobudować drugą w nowej stolicy.
## Zadanie
1. ownersWithMennica (i wszystkie inne miejsca liczące bonus Mennicy — grep Mennic w gra/src) liczą bonus tylko z Mennicy w mieście będącym AKTUALNĄ stolicą właściciela; bonus raz na cywilizację nawet gdy stoją dwie (dziś możliwe po zmianie stolicy).
2. Budowa: tylko w stolicy (bez zmian) oraz tylko jedna AKTYWNA na cywilizację: nie można budować Mennicy w stolicy, jeśli w niej już jest; Mennica osierocona poza stolicą NIE blokuje budowy nowej w nowej stolicy (ZAŁOŻENIE orkiestratora do potwierdzenia przez właściciela — opisz w raporcie skutki i sprawdź, czy kod zwraca na to uwagę przy limicie „1 na cywilizację” w production.ts).
3. UI: karta/panel pokazują Mennicę poza stolicą jako nieaktywną (krótka etykieta po polsku) — jeśli istniejąca infrastruktura (cityPanel.ts) pozwala to zrobić małym kosztem; jeśli nie, opisz i nie rób.
4. Podatek w miastach ≤5 mieszkańców = 0 (zaokrąglenie) zostaje bez zmian.
## Testy
Nowe przypadki w gra/tools/waluta-mennica-test.cjs lub nowy mint-capital-only-test.cjs: bonus tylko ze stolicy; po zmianie stolicy bonus znika do czasu zbudowania nowej; dwie Mennice = jeden bonus; mutacje czerwone na rdzeniu. Zielone: waluta-mennica-test, trade-routes-income 135/0, economy testy dotykające Mennicy.
## Allowlista
gra/src/game/turn-economy.ts, gra/src/game/production.ts, gra/src/ui/cityPanel.ts (tylko etykieta), gra/src/main.ts (tylko jeśli konieczne), nowe/zmienione testy Mennicy, dyspozycje/autobot/runs/R-WEB-MINT-CAPITAL-ONLY-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana wartości balansu poza zakresem, osłabianie asercji (zmiana asercji dozwolona WYŁĄCZNIE dla testów kodujących stary kontrakt — wypisz je w raporcie z uzasadnieniem), git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash. Dysk >= 4 GB; usuń node_modules po bramkach.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; testy tematu; nowy test z mutacją czerwoną na rdzeniu. Zacommituj i zwróć SHA.
## DECISION_REQUIRED
Jeśli napotkasz konflikt reguł (np. dwa wymagania wykluczają się przy utracie stolicy), zwróć DECISION_REQUIRED z jednym zdaniem konfliktu per wariant.
## Binarne kryterium
Bonus tylko z Mennicy w aktualnej stolicy, raz na cywilizację; testy z mutacją czerwoną; bramki zielone.
