# R-WEB-TEST-DEBT-Q14-MUTATIONS-Q1 — brakujące mutacje czerwone w naprawionych testach Q14 (dowód, że testy łapią regresję)

DOMAIN: INFRA (testy) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main f69561351f34503ff8983d473640c6eec5565904. Bez deployu, zero zmian w gra/src i gra/data (mutacje TYLKO na kopii poza repo; po pracy repo bez zmian).

## Kontekst
FC Q14-D1 oznaczył NIE ZMIERZONO: mutacje czerwone dla wierszy 5, 11, 13 i 21 tabeli (runs/R-WEB-TEST-DEBT-Q14-D1/10-operator-claude.md i 50-final-control-claude.md — odczytaj z git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:...), oraz mutacje A/B w Q14-D1B nie przez FC; w Q14-D2/E2 kilka naprawionych testów bez mutacji (war-allin-capital pin REF_OFF, atrybucja do f038fbd2c nie zreprodukowana — pre-f038 ai.ts się nie kompiluje). Cel: dla KAŻDEGO naprawionego testu bez mutacji pokazać, że czerwienieje po zmianie kodu gry, której pilnuje.
## Zadanie
1. Ustal listę testów z raportów Q14-B/C/D1/D1B/D1C/D2/Q15 oznaczonych „mutacji nie pokazano” albo „NIE ZMIERZONO mutacji” (dokładnie wypisz: test, wiersz, powód).
2. Dla każdego: znajdź w gra/src regułę, której test pilnuje (jedna linia/warunek), zrób mutację NA KOPII poza repo (np. katalog w /tmp, kopia pliku źródłowego + uruchomienie testu na kopii przez zmienną środowiskową/ścieżkę, albo worktree poza repo), pokaż surowy wynik: test czerwony po mutacji, zielony bez. Jeśli test nie da się uruchomić na kopii (czyta wprost gra/src) — wykonaj mutację w osobnym worktree poza repo i usuń go po użyciu; NIGDY nie mutuj plików w głównym worktree pracy.
3. Test, który NIE czerwienieje po sensownej mutacji → klasyfikacja SŁABY TEST (nie osłabiaj; dopisz asercję pilnującą tej reguły z mutacją czerwoną w ramach allowlisty) albo MUTANT RÓWNOWAŻNY (dowód jak w HARDEN: brak różnic).
4. Tabela: test | reguła | mutacja | wynik przed/po | werdykt. Commit po każdej paczce 5 testów.
## Allowlista
gra/tools/*-test.cjs testów z listy (tylko dopisanie asercji dla SŁABYCH testów), dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-MUTATIONS-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data w repo, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Testy Chromium po jednym; po pracy usuń kopie/worktree/logi z /tmp i git status czysty. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; ai-test 297/0; testy z listy zielone bez mutacji. Zacommituj i zwróć SHA.
## Binarne kryterium
Każdy test z listy ma mutację czerwoną (surowy wynik) albo klasyfikację SŁABY/RÓWNOWAŻNY z dowodem; repo czyste po pracy; bramki zielone.
