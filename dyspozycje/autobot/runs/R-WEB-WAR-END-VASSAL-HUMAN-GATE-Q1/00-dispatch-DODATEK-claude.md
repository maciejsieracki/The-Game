# R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1 — dwie nieprzebadane ścieżki końca wojny (L6): wasalizacja i propozycja pokoju między graczami

DOMAIN: GAME (analiza kodu + testy źródłowe; bez zmian gry; ewentualne kandydaty BŁĄD-GRY) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 9c5344dd1e670c56d46ad6078045940e9b02c294. Zero zmian w gra/src i gra/data.

## Kontekst
dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md (P17, P21, luka L6, sekcja 7a): NIE ZBADANO (a) czy wasalizacja (akcja wasala w koszyku dyplomacji, gra/src/ui/diplomacyTradeBasket.ts akcja „12”, treaty wasalizacji; breakTreatiesOnWar/ wasalizacja w main.ts) kończy wojnę między stronami (czy wasalizacja wojny z graczem/AI zmienia relację z 'wojna' na inną, czy zostawia wojnę, licznik wojen i zmęczenie), (b) czy propozycja pokoju między dwoma fotelami ludzkimi (hotseat, respondToHumanProposal ~main.ts:22998, interHumanDiplomacyInbox) jest objęta bramką 10 tur wojny (peaceProposalBlocked / diplomacy-peace-proposal-timing.ts) jak pokój gracz↔AI, i czy UI blokuje propozycję przed 10. turą.
## Zadanie
1. Wasalizacja: znajdź wszystkie miejsca (plik:linia), które ustanawiają/znoszą wasalizację i zmieniają relację pary; ustal: czy wojna pary kończy się (status relacji po wasalizacji), czy rozliczany jest stan wojny (licznik countActiveWarsForOwner*, pendingPrincipal, warTypesForOwner, wartości zmęczenia warWearinessByPairKey), czy wojny epoki z wasalem się czyszczą (cleanup*ForcedWarOnPeace), czy gracz/AI widzi wpis (świat: „Wydarzenia na świecie” po FALI 905/907/909 — czy wasalizacja daje wpis z powodem). Test źródłowy/behawioralny (jak gra/tools/*vassal*test.cjs / war-rules-*) — wynik surowy.
2. Pokój międzyludzki: czy propozycja pokoju/rozejmu między dwoma fotelami ludzkimi podlega peaceProposalBlocked (10 pełnych tur wojny) w kodzie proponowania i w UI (komunikat „dostępne za N tur”)? Dowód plik:linia + test źródłowy. Jeśli nie podlega — czy to zamierzone (komentarz/decyzja) czy luka (kandydat R-WEB-*).
3. Klasyfikacja każdej ścieżki: ZGODNA z regułą (zacytuj) / BŁĄD GRY (minimalne odtworzenie komendą/testem) / NIE ZMIERZONO. Wynik: dyspozycje/analizy/WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-2026-11-26.md + lista tematów naprawczych (priorytet) + pytania do właściciela TYLKO dla zmian wyglądu/mechaniki (opis; ABC robi orkiestrator).
## Allowlista
dyspozycje/analizy/WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-*.md, nowe gra/tools/war-end-vassal-human-*-test.cjs (tylko jeśli potrzebne jako dowód), dyspozycje/autobot/runs/R-WEB-WAR-END-VASSAL-HUMAN-GATE-Q1/**.
## Zakazy
gra/src, gra/data (poza odczytem), gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB. Commituj wcześnie.
## Bramki
Dokument + raport; git diff --stat = dyspozycje/ i ewentualnie nowe testy; tsc nie wymagany bez zmian kodu (jeśli dodano test — uruchom go i podaj wynik).
## Binarne kryterium
Dla wasalizacji i pokoju międzyludzkiego: ścieżka z plik:linia, klasyfikacja z dowodem, skutek dla gracza, propozycja naprawy (bez implementacji).
