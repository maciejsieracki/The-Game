# R-WEB-HUD-ME-POWERRANK-RELIGION-Q1 — ranking Mocy, nakładka zasięgu religii i lista graczy zwycięstwa: literał właściciela 0 → aktywny gracz (hotseat)

DOMAIN: GAME (naprawa błędu) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 0ad95c3050bfc28102321e35bd7fead4722e6556. Wdrożenie jako kolejna FALA po FC (zmiana gra/src); w grze jednoosobowej zachowanie bit-w-bit bez zmian.

## Kontekst
Pozostałość migracji hotseat po FALACH 894/895/899 (FC HUDREM, kandydaci). W gra/src/main.ts (numery linii dla bazy 0ad95c305, przybliżone — kotwicz po funkcjach):
- ~20518/20522 ranking Mocy: `civ: oid === 0 ? civDisplayNameForKey(civKeyForOwner(0)) : ownerDiploLabel(oid)`, `isPlayer: oid === 0`;
- ~20607 `labelForOwner: (oid) => oid === 0 ? …civKeyForOwner(0)…`;
- ~16844–16851 nakładka zasięgu religii: `ownerReligionForOwnerId(0)`, `collectReligionRangeHexKeys(…, 0)`;
- ~48978 lista graczy zwycięstwa: `typCywilizacji: oid === 0 ? player.civType …`, `ai: oid !== 0` (sprawdź, czy to rola „gracz aktywny”, czy „gracz-człowiek jednoosobowy”; w hotseat wielu ludzi — zdecyduj z dowodem).
Zasada: zamieniaj WYŁĄCZNIE tam, gdzie 0 jest podstawieniem gracza aktywnego (ME() / ownerId parametru). Gdzie 0 znaczy co innego (zamierzony fotel 0 w trybie bez hotseat, indeks, wartość domyślna, np. 26718, 45175) — zostaw i wypisz z uzasadnieniem.
## Zadanie
1. Dla każdego miejsca z listy i pokrewnych (grep `oid === 0`, `civKeyForOwner(0)`, `ForOwnerId(0)`): plik:linia przed/po, uzasadnienie.
2. Rozszerz test strażnik gra/tools/hud-me-literal-zero-test.cjs i/lub hud-owner-hotseat-source-test.cjs (kotwice po sygnaturach funkcji; mutacja czerwona dla KAŻDEJ zmienionej linii).
3. Dowód hotseat: dla ownerId≠0 ranking Mocy oznacza jako „gracz” właściwą cywilizację, a nakładka religii liczy zasięg tego właściciela (test źródłowy lub behawioralny jak hotseat-etap6d-d).
## Allowlista
gra/src/main.ts (TYLKO wskazane miejsca), gra/tools/hud-me-literal-zero-test.cjs, gra/tools/hud-owner-hotseat-source-test.cjs, dyspozycje/autobot/runs/R-WEB-HUD-ME-POWERRANK-RELIGION-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana logiki poza podstawieniem właściciela, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; hud-moc-warstwa 28/0; hud-me-literal-zero zielony; hud-owner-hotseat-source 48/0 (lub więcej); moc-ranking-rozjazd 19/0; war-rules-multiwar-main-guard 21/0; hotseat-etap6d e-source 77/0, B 48/0, D 46/0, E 24/0; bramki-tmpdir PASS. Zacommituj i zwróć SHA.
## Binarne kryterium
Brak literału 0 w roli gracza aktywnego w rankingu Mocy, nakładce religii i liście graczy zwycięstwa (grep + test strażnik z mutacjami); w grze jednoosobowej bit-w-bit jak dziś; bramki zielone.
