# R-WEB-HUD-ME-REMAINING-Q1 — dokończyć migrację literału właściciela 0 → aktywny gracz w HUD i podglądach (hotseat)

DOMAIN: GAME (naprawa błędu) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main b610e71a62f68c5c3052d456facc0deebd86af72. Wdrożenie jako kolejna FALA po FC (zmiana gra/src); w grze jednoosobowej zachowanie bez zmian.

## Kontekst
Błąd tej samej klasy co FALA 894 i 895 (pozostałość migracji hotseat: HUD pokazuje dane właściciela 0 zamiast aktywnego gracza). Kandydaci z FC HUDFOOD (runs/R-WEB-HUD-ME-FOODRESERVE-Q1/50-final-control-claude.md, 10-operator-claude.md sekcja „Literały 0 ZOSTAWIONE”): w gra/src/main.ts: buildEmpireFoodSnap (~l. 20666–20667: getEmpireFoodReserve(0), getEmpireFoodMaxCap(0)), empirePoborTotals / civManpowerMultsForOwner(0), w buildHudStateRaw: ownerReligionForOwnerId, buildEmpireResourceRows, wonderTradeRouteBonusForOwner, civKolorHexFn, leaderNameForOwnerId, civDisplayNameForOwner; player.era i player.zbadane w podglądzie (preview) z fotela gracza; inne *ForOwner(0) w roli gracza aktywnego (grep `ForOwner(0)`, `(0)` w HUD). Zasada: zamieniaj WYŁĄCZNIE tam, gdzie 0 jest podstawieniem gracza aktywnego (ME() lub ownerId parametru buildHudStateRaw); gdzie 0 znaczy co innego (indeks, wartość domyślna, gracz-człowiek jednoosobowy z zamierzonym fotelem 0 w trybie bez hotseat) — zostaw i wypisz z uzasadnieniem.
## Zadanie
1. Przejrzyj wszystkie wystąpienia z listy i pokrewne; dla każdego: plik:linia przed/po, uzasadnienie (gracz aktywny vs inne znaczenie); zmień poprawne.
2. Rozszerz test strażnik gra/tools/hud-me-literal-zero-test.cjs o nowe miejsca (kotwice po sygnaturach funkcji, nie stałe okna znaków); mutacja czerwona dla KAŻDEJ zmienionej linii.
3. Hotseat: dodaj/rozszerz test źródłowy lub behawioralny (spye jak w hotseat-etap6d-d), który dowodzi, że dla ownerId≠0 HUD czyta dane tego właściciela (kilka reprezentantów: zasoby, religia, nazwa przywódcy, kolor).
## Allowlista
gra/src/main.ts (TYLKO wskazane miejsca), gra/tools/hud-me-literal-zero-test.cjs, nowy test hotseat HUD w gra/tools/, dyspozycje/autobot/runs/R-WEB-HUD-ME-REMAINING-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana logiki poza podstawieniem właściciela, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; hud-moc-warstwa 28/0; hud-me-literal-zero zielony; moc-ranking-rozjazd 19/0; war-rules-multiwar-main-guard 21/0; hotseat-etap6d-source 77/0; hotseat-B 48/0, D 46/0, E 24/0; granice-relacja 52/0; bramki-tmpdir PASS. Zacommituj i zwróć SHA.
## Binarne kryterium
Brak literału 0 w roli gracza aktywnego w HUD i podglądach (grep + test strażnik z mutacjami); nowy test hotseat HUD; w grze jednoosobowej bit-w-bit jak dziś; bramki zielone.
