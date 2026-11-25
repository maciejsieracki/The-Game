# R-WEB-DIPLO-WORLD-NEWS-IN-DIPLOMACY-WINDOW-Q1 — „Co dzieje się na świecie” w oknie dyplomacji (wojny i pokoje innych odkrytych cywilizacji)

DOMAIN: GAME (UI; dokończenie polecenia właściciela 2026-11-25) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main po FALI 905 (SHA podaje orkiestrator). Wdrożenie jako FALA po FC PASS.

## Polecenie właściciela (dosłownie)
„Gracz w dyplomacji powinien widzieć informację o tym, że jakieś cywilizacje zaczęły ze sobą wojnę lub zawarły pokój. Oczywiście, jeżeli ma odkrytą tą cywilizację.”
## Stan (FALA 905, R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1)
Wpis powstaje w dzienniku „Wydarzenia” (warEventLog; żyje jedną turę, dziennik przycinany do 8; recordAiAiWarPeaceNews w setDiploRelation, gra/src/game/diplo-world-news.ts), NIE w oknie dyplomacji. Gracz, który nie patrzy na panel Wydarzeń akurat w tej turze, nic nie zobaczy.
## Zadanie
1. Ustal, co gracz widzi w „dyplomacji” (ekran/okno listy cywilizacji, stół/audiencja, skrzynka — sprawdź w kodzie i na zrzucie z Chromium, gdzie gracz rozumie „dyplomację”) i dodaj tam trwałą, krótką listę „Wydarzenia na świecie” (np. ostatnie 20 wpisów: tura, kto z kim, wojna/pokój/rozejm/sojusz), z tym samym warunkiem widoczności (obie cywilizacje odkryte; bez przecieku nieodkrytych). Wpisy już istniejące w dzienniku Wydarzeń zostają (jedno źródło prawdy: hook w setDiploRelation zasila też trwałą listę).
2. Rozróżnij rozejm od pokoju w treści wpisu, jeśli stan silnika na to pozwala (relacja 'pokoj' + truceUntilTurn); jeśli nie — zostaw „Pokój” i opisz ograniczenie.
3. Powód (jeśli tani): pokój wymuszony 100% zmęczenia, wojna epoki — przekazanie powodu do wpisu tylko tam, gdzie wołający zna powód (bez zmiany sygnatury setDiploRelation dla 63 wywołań; użyj kontekstu „ostatni powód” ustawianego tuż przed wywołaniem w kilku ścieżkach, jeśli to proste; inaczej NIE ZMIERZONO/pominięte).
4. Zapis/wczytanie: lista zapisywana w save (migracja: brak pola = pusta) albo — jeśli lista ma być tylko sesyjna — jawnie opisz; stare zapisy działają.
5. Weryfikacja wizualna w żywym Chromium (zrzut ekranu okna dyplomacji z wpisem), jeśli środowisko pozwala; w razie crasha Chromium oznacz NIE ZMIERZONO i opisz.
6. Testy: źródłowy/behawioralny (czerwony po cofnięciu): wpis trafia do listy dla pary odkrytych AI, nie trafia dla nieodkrytej, nie dubluje par z graczem, lista przycinana, zapis/wczytanie.
## Allowlista
gra/src/main.ts (TYLKO hook/lista/okno dyplomacji), gra/src/game/diplo-world-news.ts, gra/src/ui/*dyplomac* (okno dyplomacji — wskaż pliki), teksty PL (konwencja sąsiednich wpisów), nowy/rozszerzony gra/tools/diplo-world-news-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-WORLD-NEWS-IN-DIPLOMACY-WINDOW-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana logiki wojny/pokoju/dyplomacji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules. Commituj wcześnie.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat e-source 77/0, B 48/0, D 46/0, E 24/0; hud-me-literal-zero zielony; bramki-tmpdir PASS=18; testy gra/tools/diplo*test.cjs. Zacommituj i zwróć SHA.
## Binarne kryterium
Gracz widzi w oknie dyplomacji trwałą listę wojen/pokojów innych odkrytych cywilizacji; brak wpisów dla nieodkrytych; zapis/wczytanie działa; testy zielone, mutacja czerwona.
