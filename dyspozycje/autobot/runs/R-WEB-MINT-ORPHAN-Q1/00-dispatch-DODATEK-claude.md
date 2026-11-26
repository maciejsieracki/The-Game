# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = args.cand)
## Stan (FALA 914)
gra/src/game/turn-economy.ts: setOwnerCapitalCityResolver + ownersWithMennica liczy bonus z Mennicy w stolicy (capitalCityIdForOwner z main.ts); gra/src/ui/cityPanel.ts: etykieta „Mennica poza stolicą — nieaktywna”, ownerHasMennica tylko stolica; production.ts buildingLocationAllowed: lokalizacja „stolica”; budowa w nowej stolicy przy osieroconej dozwolona (kod dopuszcza); testy gra/tools/mint-capital-only-test.cjs (8/0), waluta-mennica-test (61/0). Raporty: runs/R-WEB-MINT-CAPITAL-ONLY-Q1.
## Zadanie
1. (4) Po UKOŃCZENIU budowy Mennicy w mieście będącym stolicą: usuń wszystkie inne Mennice tej cywilizacji stojące w miastach niebędących stolicą (budynek znika, bez zwrotu; wpis „Ważne”/komunikat po polsku: „Mennica w <miasto> została zastąpiona nową w stolicy”). Znajdź miejsce ukończenia budynku w main.ts/production.ts (grep „budynek ukończony”, completeBuilding, addBuilding) i dodaj wąski hook; dotyczy gracza i AI. NIE usuwaj Mennicy w mieście, które jest stolicą.
2. (2) Sprawdź i opisz, czy Mennicę można wyburzyć (demolish) w dowolnym mieście, także nieaktywną; jeśli budynek ma flagę zakazu wyburzenia — zdejmij dla Mennicy; test.
3. (5) Test: stolica przeniesiona do miasta A (Mennica w B osierocona) → bonus 0; stolica z powrotem do B (Mennica stoi) → bonus wraca; po zbudowaniu nowej w A stara w B znika, a powrót stolicy do B nie przywraca bonusu (Mennicy w B już nie ma; wymagana nowa budowa).
4. (6) upewnij się, że nowa Mennica może być zbudowana tylko w stolicy (bez zmian) i że w jednej stolicy nie można zbudować drugiej (jeśli już stoi).
5. Testy: rozszerz gra/tools/mint-capital-only-test.cjs (lub nowy mint-orphan-test.cjs) o przypadki 1–4 z mutacjami czerwonymi (zdjęcie hooka usuwającego starą; zamiana warunku stolicy); waluta-mennica 61/0 i trade-routes-income 135/0 zielone.
## Allowlista
gra/src/game/production.ts, gra/src/game/turn-economy.ts, gra/src/ui/cityPanel.ts, gra/src/main.ts (tylko hook po ukończeniu budynku i ewentualnie wyburzanie), gra/data/buildings.json (tylko jeśli flaga wyburzenia), testy Mennicy w gra/tools/, dyspozycje/autobot/runs/R-WEB-MINT-ORPHAN-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana wartości balansu, osłabianie asercji (tylko kodujące stary kontrakt, wypisz), git add -A, push, spawn_task/create_session/create_trigger/send_later (ZAKAZANE), run_in_background w Bash. Dysk >= 6 GB; usuń node_modules po bramkach.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; mint-capital-only; waluta-mennica 61/0; trade-routes-income 135/0; nowy test z mutacją czerwoną. Zacommituj i zwróć SHA.
## Binarne kryterium
Po ukończeniu nowej Mennicy w stolicy stara znika; osierocona nieaktywna ale istnieje i da się wyburzyć; powrót stolicy reaktywuje nie usuniętą; testy z mutacjami; bramki zielone.
