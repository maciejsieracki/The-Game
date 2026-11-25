# R-WEB-WAR-END-PATHS-Q1 — wszystkie ścieżki, którymi kończy się wojna (odpowiedź na zgłoszenie właściciela: „wojny kończą się znacznie szybciej niż po 40 turach”)

DOMAIN: GAME (analiza kodu + istniejące dane; bez długich biegów) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main (SHA podaje orkiestrator). Zero zmian w gra/src i gra/data.

## Kontekst
Właściciel 2026-11-25: po wprowadzeniu pokoju wymuszonego (~40 tur) w swojej grze go nie widzi, wojny kończą się znacznie szybciej. Pomiar WARDUR (dyspozycje/autobot/runs/R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1/30-obrona-claude.md, dane/summary.json): wojna epoki 0 vs 1 dochodzi do 100% po 40 turach (2/2), wojna naturalna AI↔AI 1 vs 7 skończyła się po 9 turach z nieustalonego powodu (gra nie loguje powodu końca). Kod: gra/src/game/war-weariness.ts (poziom = tury/40 + 0,1 × miasta zmienione; desperacja przegrywającego; oferty od tury 3/6; próg 50%/80%), diplomacy-proposals.ts, ai.ts (~7342/7393), forced-war-*.ts (wojny epoki: „2 miasta → pokój wymuszony + 20 tur karencji”), main.ts.
## Zadanie
1. Znajdź w gra/src WSZYSTKIE miejsca, które kończą stan wojny między dwiema cywilizacjami (pokój, rozejm, zawieszenie broni, pokój wymuszony, wygaśnięcie wojny epoki, eliminacja strony, zerwanie wojny przy sojuszu/wasalizacji, oddanie miasta za pokój, reset przy wczytaniu): tabela plik:linia, funkcja, warunek, kto inicjuje (gracz / AI / tick / silnik), minimalna tura wojny, zależność od zmęczenia/strat/miast/siły.
2. Dla każdej ścieżki: czy działa wobec GRACZA (cywilizacja 0 lub aktywny fotel) i czy gracz to widzi (komunikat/powiadomienie w UI — wskaż plik:linia; brak = „niewidoczne dla gracza”).
3. Odpowiedz tabelą na pytanie: które ścieżki mogą skończyć wojnę gracza PRZED 40 turą i przy jakich warunkach (np. oferta pokoju przegrywającego od tury 3/6, pokój z cesją miast, wojna epoki 2 miasta, eliminacja)? Dla każdej: czy gracz musi potwierdzić, czy dzieje się automatycznie.
4. Użyj danych WARDUR (summary.json) do sprawdzenia zgodności z kodem dla wojny 1 vs 7 (9 tur, zmęczenie 0,225): która ścieżka jest najbardziej prawdopodobna i dlaczego (hipoteza z dowodem w kodzie; NIE ZMIERZONO bez logu powodu).
5. Wynik: dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md + lista luk do osobnych tematów (np. brak logu powodu końca wojny, niewidoczne dla gracza zakończenia). Pytań do właściciela NIE zadawaj — opisz (ABC robi orkiestrator).
## Allowlista
dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-*.md, dyspozycje/autobot/runs/R-WEB-WAR-END-PATHS-Q1/**.
## Zakazy
gra/ (poza odczytem), gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, uruchamianie biegów dłuższych niż 10 min, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB.
## Bramki
Dokument + raport; commituj od razu (git add <ścieżki tematu>); `git diff --stat` = tylko dyspozycje/.
## Binarne kryterium
Tabela wszystkich ścieżek końca wojny z plik:linia (grep-weryfikowalna, żadna ścieżka pominięta); odpowiedź „przed 40 turą: które i kiedy”; widoczność dla gracza; luki.
