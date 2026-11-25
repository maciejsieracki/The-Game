# R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1 — gracz widzi w dyplomacji, że inne cywilizacje zaczęły wojnę lub zawarły pokój

DOMAIN: GAME (nowa funkcja informacyjna; polecenie właściciela 2026-11-25) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main e2b06492da239f25dd5421dd57231e139f43c55e. Wdrożenie jako FALA po FC PASS (zmiana gra/src, gra/data tekstów/i18n).

## Polecenie właściciela (dosłownie)
„Gracz w dyplomacji powinien widzieć informację o tym, że jakieś cywilizacje zaczęły ze sobą wojnę lub zawarły pokój. Oczywiście, jeżeli ma odkrytą tą cywilizację.”
## Kontekst
dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md: wojny i pokoje AI↔AI (P10 pokój wymuszony, P11, P12, P20 oraz wypowiedzenia wojny przez AI, wojny epoki) kończą się/zaczynają dziś tylko w console.log; logPeaceVazne (gra/src/main.ts ~27029) ignoruje pary bez gracza (gate: if (a !== ME() && b !== ME()) return); applyDiploEventTracked (~13397) nie dopisuje wpisu do warEventLog; declareWarAfterTruce ~13109 bez wpisu. Gracz nie widzi więc zmian stanu wojny/pokoju między innymi cywilizacjami.
## Zadanie
1. Znajdź istniejący mechanizm, który najlepiej służy temu celowi w widoku dyplomacji gracza (lista „Ważne”/dziennik zdarzeń/warEventLog/skrzynka — sprawdź, co gracz realnie widzi w ekranie dyplomacji i w którym miejscu UI) i użyj go (nie buduj nowego okna, jeśli istniejący dziennik wystarczy); uzasadnij wybór.
2. Zdarzenia: dla pary cywilizacji (A,B), z których żadna nie jest graczem (ME()): (a) wybuch wojny (wypowiedzenie, wojna epoki, wojna po rozejmie, bunt/zdobycie), (b) pokój lub rozejm (w tym pokój wymuszony 100%, oferty AI↔AI, auto-pokój po 2 miastach). Najlepiej jeden centralny punkt zmiany relacji pary (setDiploRelation / finalizePeaceTreatyBetween / declareWar…) zamiast łatania każdej ścieżki osobno; wypisz pokryte i niepokryte ścieżki (P1–P21 z dokumentu).
3. Warunek widoczności („jeżeli ma odkrytą tę cywilizację”): wpis pokazuje się graczowi tylko, gdy gracz ma ODKRYTE (spotkane) obie cywilizacje pary; gdy jedna jest nieodkryta — wpisu NIE pokazuj (brak przecieku informacji). Użyj istniejącego predykatu „odkryta cywilizacja” z dyplomacji (zob. jak lista cywilizacji w dyplomacji decyduje o widoczności; nie wymyślaj nowego). Zaznacz w raporcie tę interpretację (obie odkryte) jako DO POTWIERDZENIA przez właściciela.
4. Dla pary z udziałem gracza zachowanie bez zmian (istniejące wpisy), bez duplikatów.
5. Redukcja szumu: jeden wpis na zdarzenie i parę na turę (bez powtórzeń przy wieloetapowych ścieżkach); wpis zawiera: tura, nazwy cywilizacji (z nazw używanych w dyplomacji), rodzaj (wojna/pokój/rozejm), jeśli łatwo dostępny — powód (pokój wymuszony, wojna epoki). Tekst PL i EN zgodnie z konwencją i18n projektu.
6. Zapis/wczytanie: wpisy mają przeżyć zapis (jeśli istniejący dziennik jest zapisywany) albo nie psuć wczytania starego zapisu (brak pola = pusta lista).
7. Testy: źródłowy/behawioralny test (czerwony po cofnięciu): wpis powstaje dla pary AI↔AI przy odkrytych obu stronach, nie powstaje gdy jedna nieodkryta, nie dubluje wpisów pary z graczem; gra/tools/diplo-world-news-test.cjs.
## Allowlista
gra/src/main.ts (TYLKO miejsca wskazane), ewentualnie gra/src/game/*.ts i pliki i18n/tekstów, gra/data (teksty), nowy gra/tools/diplo-world-news-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-WORLD-WAR-PEACE-NEWS-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana logiki wojny/pokoju/dyplomacji (tylko dopisanie wpisów), git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules. Commituj wcześnie (git add <ścieżki tematu>).
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat e-source 77/0, B 48/0, D 46/0, E 24/0; hud-me-literal-zero zielony; bramki-tmpdir PASS=18; testy gra/tools/*peace*test.cjs, *truce*test.cjs, *diplo*test.cjs dotykające zmienionych funkcji (stub ME() w testach vm jeśli potrzebny). Zacommituj i zwróć SHA.
## Binarne kryterium
Gracz widzi wpis o wojnie/pokoju między dwiema odkrytymi cywilizacjami w dyplomacji; brak wpisu przy nieodkrytej; brak duplikatów dla par z graczem; zapis/wczytanie nie psuje; testy zielone (czerwone po cofnięciu).
