# R-WEB-HUD-ME-FOODRESERVE-Q1 — dokończyć migrację literału 0 → ME() w HUD (zapas żywności i sąsiedztwo)

DOMAIN: GAME | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 6fc5e88b5898ffaae158a9b227dfeb7ef638609b. Wdrożenie jako kolejna FALA po FC (zmiana gra/src).

## Kontekst
FC tematu R-WEB-HUD-ME-MIGRATION-Q1 (FALA 894) zauważył: w gra/src/main.ts, funkcja buildHudState (okolice linii 24044–24046), obok już poprawionego objectivePowerForOwnerEffective(ME()) zostało getEmpireFoodReserve(0) z literałem 0. W grze 1-graczowej ME()=0 (zero skutku); w hotseat HUD pokazuje zapas żywności właściciela 0 zamiast aktywnego gracza. To ta sama klasa błędu (pozostałość migracji hotseat) — stała zgoda właściciela na błędy webowe R-WEB-*.
## Zadanie
1. W buildHudState i funkcjach HUD/respektu w main.ts znajdź WSZYSTKIE wywołania z literałem właściciela 0 w roli „gracz aktywny” (np. getEmpireFoodReserve(0), projectPlayerFoodMaxCap, inne *(0) w HUD) — grep po main.ts i plikach, z których HUD czerpie dane. Zmieniaj tylko te, które są podstawieniem gracza aktywnego, każde uzasadnij w raporcie (plik:linia przed/po); wywołania, w których 0 oznacza coś innego (np. indeks tablicy, wartość domyślna), zostaw i wypisz.
2. Dodaj do istniejącego testu strażnika gra/tools/hud-me-literal-zero-test.cjs asercje dla nowych miejsc (okno wyszukiwania bez kruchości: nie stałe 600 znaków — uwaga Evaluatora z FALI 894) i pokaż mutację (przywrócenie 0 w każdym zmienionym miejscu → czerwony).
3. Bramki jak niżej; zielone bez osłabiania asercji.
## Allowlista
gra/src/main.ts (TYLKO wskazane miejsca), gra/tools/hud-me-literal-zero-test.cjs, gra/tools/hud-moc-warstwa-test.cjs (tylko dopisanie, bez osłabiania), dyspozycje/autobot/runs/R-WEB-HUD-ME-FOODRESERVE-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background, git log -S nad całym repo bez ścieżki. Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; hud-moc-warstwa 28/0; hud-me-literal-zero zielony; moc-ranking-rozjazd 19/0; era-war-pairing 19/0; hotseat-etap6d-podetap-e-source 77/0; granice-relacja-dyplomatyczna 52/0. Zacommituj i zwróć SHA.
## Binarne kryterium
Brak literału 0 w roli gracza aktywnego w HUD (dowód: grep + test strażnik); mutacja czerwona; bramki zielone; diff main.ts = podstawienia ME() z uzasadnieniem.
