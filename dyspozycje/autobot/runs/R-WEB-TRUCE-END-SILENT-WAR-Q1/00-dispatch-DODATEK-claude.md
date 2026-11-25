# R-WEB-TRUCE-END-SILENT-WAR-Q1 — koniec rozejmu bez oferty wraca do wojny po cichu (luka L4 z WARENDP)

DOMAIN: GAME (naprawa błędu UX/komunikatu) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 76c0fbc6b55816399ccbe8d6ac5c3240b99e70ee. Wdrożenie jako FALA po FC PASS (zmiana gra/src).

## Kontekst
dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (P7, L4): declareWarAfterTruce (gra/src/main.ts ~13109–13113) zmienia relację na wojnę przez applyDiploEventTracked(..., 'wojna_wypowiedziana') (~13397–13412), który nie dopisuje wpisu do warEventLog; gdy truceEndOffer nie powstał, gracz (strona pary) nie dostaje żadnego komunikatu, że wojna wróciła. Porównaj z innymi ścieżkami, które dla pary z graczem dają wpis „Ważne” (logPeaceVazne ~27029; finalizePeace ~13119) i z deklaracją wojny przez AI (jaki komunikat widzi gracz).
## Zadanie
1. Ustal dokładnie: kiedy gracz (cywilizacja 0 / ME()) nie widzi, że rozejm wygasł i wojna wróciła (które gałęzie truceExpiryAction: revert_to_war, brak oferty, odmowa AI, brak zgody wojskowej); udokumentuj w analizie (plik:linia).
2. Dodaj dla pary z udziałem ME() jeden wpis dla gracza (ten sam mechanizm i styl co sąsiednie wpisy „Ważne” o pokoju/wojnie — zacytuj, który wybrałeś i dlaczego), tylko gdy gracz jest stroną pary; zero zmian dla par AI↔AI i zero zmian logiki wojny/rozejmu. Tekst po polsku i w EN zgodnie z konwencją i18n projektu (sprawdź jak są tłumaczone sąsiednie wpisy).
3. Test: źródłowy lub behawioralny (czerwony po cofnięciu wpisu) w gra/tools/truce-end-war-notice-test.cjs.
## Allowlista
gra/src/main.ts (TYLKO gałąź declareWarAfterTruce/ścieżka wygaśnięcia rozejmu i ewentualne pliki i18n/tekstów wskazane w zadaniu), nowy gra/tools/truce-end-war-notice-test.cjs, dyspozycje/autobot/runs/R-WEB-TRUCE-END-SILENT-WAR-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana logiki wojny/rozejmu, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules. Commituj wcześnie (git add <ścieżki tematu>).
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat e-source 77/0; hud-me-literal-zero zielony; bramki-tmpdir PASS=18; wszystkie testy gra/tools/*truce*test.cjs i *rozejm*test.cjs (w tym diplo-truce live nie wymagany); uwaga: testy wycinające main.ts do vm mogą wymagać stuba ME() — przeskanuj grep po nazwach zmienionych funkcji. Zacommituj i zwróć SHA.
## Binarne kryterium
Gracz dostaje jeden wpis przy powrocie do wojny po rozejmie w każdej gałęzi bez oferty; AI↔AI bez zmian; test czerwony po cofnięciu; bramki zielone.
