# R-WEB-HUD-ME-EMPIREHUD-Q1 — getEmpireHud: literał właściciela 0 → aktywny gracz (hotseat)

DOMAIN: GAME (naprawa błędu) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main po FALI 900 (SHA podaje orkiestrator w uruchomieniu). Wdrożenie jako kolejna FALA po FC; w grze jednoosobowej zachowanie bit-w-bit bez zmian.

## Kontekst
Kandydat z FC HUDRANK (R-WEB-HUD-ME-POWERRANK-RELIGION-Q1, 10-operator-claude.md UWAGA 2, 20-evaluator zarzut 3): w gra/src/main.ts funkcja getEmpireHud (~l. 9663–9666): `oid !== 0` → null, `c.ownerId === 0`, `ownerReligionForOwnerId(0)` — rola gracza aktywnego (panel imperium). Kotwicz po nazwie funkcji, nie po numerach linii.
Zasada: zamieniaj WYŁĄCZNIE tam, gdzie 0 = gracz aktywny (ME() / ownerId parametru); gdzie 0 ma inne znaczenie — zostaw i wypisz z uzasadnieniem. Dodatkowo sprawdź (grep `ForOwnerId(0)`, `=== 0` w funkcjach getEmpire*/build*Hud*/panel imperium), czy w pokrewnych funkcjach nie zostały inne literały o roli gracza aktywnego; zmień poprawne, resztę wypisz.
## Zadanie
1. Przegląd getEmpireHud i pokrewnych; dla każdego miejsca plik:linia przed/po + uzasadnienie.
2. Rozszerz gra/tools/hud-me-literal-zero-test.cjs (kotwice po sygnaturze funkcji; mutacja czerwona dla KAŻDEJ zmienionej linii).
3. Hotseat: test źródłowy/behawioralny (jak hotseat-etap6d-d lub hud-owner-hotseat-source-test.cjs) — dla ownerId≠0 getEmpireHud zwraca dane tego właściciela.
## Allowlista
gra/src/main.ts (TYLKO wskazane miejsca), gra/tools/hud-me-literal-zero-test.cjs, gra/tools/hud-owner-hotseat-source-test.cjs, dyspozycje/autobot/runs/R-WEB-HUD-ME-EMPIREHUD-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana logiki poza podstawieniem właściciela, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; hud-moc-warstwa 28/0; hud-me-literal-zero zielony; hud-owner-hotseat-source 48/0 (lub więcej); moc-ranking-rozjazd 19/0; war-rules-multiwar-main-guard 21/0; hotseat-etap6d e-source 77/0, B 48/0, D 46/0, E 24/0; bramki-tmpdir PASS. Zacommituj i zwróć SHA.
## Binarne kryterium
Brak literału 0 w roli gracza aktywnego w getEmpireHud i pokrewnych (grep + test strażnik z mutacjami); jednoosobowa bit-w-bit jak dziś; bramki zielone.
