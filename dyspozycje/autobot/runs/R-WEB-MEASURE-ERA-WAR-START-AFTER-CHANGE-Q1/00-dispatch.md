# R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1 — pomiar w pełnej grze po FALACH 906 i 908: kiedy zaczynają się wojny epoki, ile trwają i jak się kończą

DOMAIN: GAME (pomiar; zero zmian gry) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 069de0d41f8fee134579ec286028ede02cb9e002 (kod = FALA 908). 

## Kontekst
Polecenie właściciela 2026-11-25: wojna epoki Brązu/Żelaza zaczyna się od pierwszej tury wejścia w epokę (FALA 906, próg 0), po pokoju wcześniejszej wojny epoki; wojny epoki AI↔AI kończą się jak klasyczne (FALA 908). Wcześniejszy pomiar WARDUR (dyspozycje/autobot/runs/R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1/, dane/summary.json): wojna epoki 0 vs 1 t42–83 (40 tur, pokój wymuszony). Chcemy zobaczyć stan PO zmianach w realnej grze (NIE ZMIERZONO dotąd).
## Zadanie
1. Użyj istniejącego, wznawialnego runnera gra/tools/war-duration-measure.cjs (+ gra/tools/war-duration-summarize.cjs, hook gra/tools/ai-war-weariness-live-audit-hook.cjs; instrukcje w runs/R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1/30-obrona-claude.md). Bundle ZBUDUJ poza repo z bazy (vite build do /tmp lub scratchpad; zakaz npm run build/dev). Ziarna 4242 i 7, do tury 120 (jeśli czas nie pozwala: do t90 i napisz), tryb: preferuj bieg ciągły (setsid nohup timeout 3300 … & + Monitor, bez parametru run_in_background Bash); wznowienia ze slotu tylko gdy bieg ciągły padnie (Chromium pada w długich biegach — zapisz, w której turze).
2. Wyciągnij dla każdej wojny epoki i naturalnej: tura wejścia w epokę (Brąz/Żelazo) każdej strony, tura startu wojny epoki, opóźnienie start − wejście (oczekiwane: 0–kilka tur; w wojnie kolejnej epoki po pokoju poprzedniej), czas trwania, powód końca (wniosek z rekordów), zmęczenie przy końcu, zmienione miasta. Czy gracz (cywilizacja 0) bierze udział w wojnie epoki i od której tury (opcja nowej gry „Wojna epoki z udziałem gracza” domyślnie ON w nowej grze)? Czy wystąpiły kilka wojen epoki naraz u jednej cywilizacji (nie powinno), serie wojen przy wejściu w epokę, wojny po stronie sojuszników?
3. Odpowiedz tabelą: „oczekiwane vs zmierzone” dla reguł z FALI 906 (start od wejścia, kolejność po pokoju) i 908 (wojna epoki AI↔AI kończy się po 2 miastach/prośbą o pokój); nieprawidłowości opisz z numerem tury i parą (kandydaci BŁĄD-GRY z minimalnym odtworzeniem lub NIE ZMIERZONO).
4. Wynik: dyspozycje/analizy/WOJNY-EPOKI-PO-ZMIANACH-2026-11-25.md + dane (jsonl.gz + SHA256SUMS) w runs/R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1/dane/.
## Allowlista
dyspozycje/analizy/WOJNY-EPOKI-PO-ZMIANACH-*.md, dyspozycje/autobot/runs/R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1/**, ewentualnie drobne poprawki runnera w gra/tools/war-duration-*.cjs (tylko jeśli konieczne dla tego pomiaru).
## Zakazy
gra/src, gra/data, gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po pomiarach usuń gra/node_modules i bundle. Commituj wcześnie (git add <ścieżki tematu>), także wyniki częściowe z uczciwym NIE ZMIERZONO.
## Bramki
Dokument + dane z SHA256; tsc nie wymagany (brak zmian kodu), potwierdź git diff --stat (tylko dyspozycje/ i ewentualnie gra/tools/war-duration-*).
## Binarne kryterium
Tabela wojen epoki dla 2 ziaren z turami wejścia/startu/końca/powodem; porównanie z regułami 906/908 z werdyktem (zgodne / niezgodne / NIE ZMIERZONO); dane z SHA256.
