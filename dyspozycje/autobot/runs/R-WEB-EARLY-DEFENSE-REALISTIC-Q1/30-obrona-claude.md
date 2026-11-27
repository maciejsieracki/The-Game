STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-EARLY-DEFENSE-REALISTIC-Q1
GOAL: zmierzyć przeżywalność pierwszych 20 tur przy grze rozsądnego gracza na maksimum (P1 budowa jednostki obronnej, P2/P3). Obrona: odpowiedź na zarzuty Evaluatora z rundy 1.
ZMIANY/COMMIT: baza 50b41e268 (detach). Zmienione tylko: gra/tools/realdef-live.cjs (readback faktycznych ustawień `__settingsLive.getSettings` w linii `start`), dyspozycje/analizy/OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27.md (poprawki i test Fishera), ten raport. Zero zmian w gra/src, gra/data, WERSJE.md, manifeście, rust-port.
TESTY:
- node --check gra/tools/realdef-live.cjs: OK (składnia).
- Fisher dwustronny P0 r1 (39/40) vs DEFEAT r2 (34/37): p = 0,346 (python stdlib, comb). Brak istotnej różnicy.
- tsc --noEmit: NIE URUCHOMIONO. Worktree nie ma gra/node_modules, a zmiany nie dotykają TypeScriptu (tylko .cjs i dokumentacja).
- logic 213 / ai-test 297: NIE URUCHOMIONO (brak zmian w kodzie gry).
- Nowe pomiary live: NIE WYKONANO w tej rundzie (brak P1; patrz BLOKADY).
ODPOWIEDZI NA ZARZUTY:
1. P1/P2/P3 niezmierzone — PRZYJMUJĘ. Kryterium binarne nie jest spełnione. Blokada bez zmiany poza allowlistą (wybór jednostki w haku zakupu = zmiana gra/src/main.ts) pozostaje.
2. Uzasadnienie BLOCK niewerifikowalne — PRZYJMUJĘ. Pole `tries` nie istnieje w commitowanym runnerze; usunięte jako dowód z dokumentu, zastąpione wskazaniem z kodu: gra/src/ui/cityPanel.ts (~9604–9660) przy pustej liście kupowalnych jednostek pokazuje „(brak jednostek do kupienia — zbadaj technologie / Koszary)”. To hipoteza do sprawdzenia na żywo, NIE ZMIERZONO.
3. Obserwacja skarbca z haka tryPurchase (cheat) — PRZYJMUJĘ. Obserwację usunięto z dokumentu; wskazano źródło (gra/src/main.ts ~30276–30290 ustawia skarbiec 999999 i manpower 99999).
4. Readback ustawień niepełny — PRZYJMUJĘ. Runner zapisuje teraz w linii `start` pole `settingsReadback` z `__settingsLive.getSettings()` (read-only) obok `adv`. Dane r1 (40 wierszy) tego pola nie mają — zapisano to w dokumencie.
5. Brakujące metryki w JSONL — PRZYJMUJĘ. Barbarzyńcy w pobliżu w turze utraty, tura pierwszej jednostki gracza i siły NIE są w wierszach result; oznaczono jako NIE ZMIERZONO w dokumencie. Naprawa wymaga ponownego biegu (nie zrobiono w tej rundzie).
6. Brak testu Fishera — PRZYJMUJĘ, uzupełniono: p = 0,346, różnica nieistotna (wniosek „w granicach losowości” jest teraz poparty obliczeniem; porównanie dotyczy tylko P0 vs DEFEAT, nie P1).
7. Wymuszony fort zmienia stan gry — PRZYJMUJĘ jako ograniczenie zakresu. Dopisano w dokumencie, że wnioski dotyczą gry z wymuszonym fortem; hak nie został usunięty (jest wspólną bazą z DEFEAT r2).
8. Runner ogranicza politykę do p0 — PRZYJMUJĘ. Konsekwencja pkt 1; bez zmiany allowlisty P1–P3 nie da się dodać.
BLOKADY:
1. P1 (budowa jednostki obronnej): wymaga decyzji orkiestratora o rozszerzeniu allowlisty o minimalny parametr hooka wyboru jednostki (gra/src/main.ts, tylko ?civTest=1) ALBO o potwierdzeniu, czy w widoku miasta w turze 1 w ogóle istnieje kupowalna jednostka wojskowa (kod sugeruje, że wymagane są technologie lub Koszary). Bez tego P1 pozostaje NIE ZMIERZONO.
2. P2 i P3: zależą od P1; NIE ZMIERZONO.
3. Dane P0 r1 nie zawierają metryk z pkt 5 zarzutów.
RUNDY: 2/5 (obrona; ta sama temat, bez zmian logiki gry). Decyzja wymagana: DECISION_REQUIRED (orkiestrator) — patrz BLOKADY 1.
NASTĘPNY KROK: decyzja orkiestratora w sprawie allowlisty hooka zakupu oraz wskazanie, czy sprawdzić na żywo dostępność kupowalnych jednostek wojskowych w turze 1 (bez zmiany gry). Po decyzji: P1 ≥ 20 przebiegów na seed, ponowny zapis metryk, P2/P3.
UWAGI-DLA-ORKIESTRATORA:
- Tymczasowy symlink do node_modules nie został utworzony; tsc pominięto (patrz TESTY).
- Obserwacja z kodu cityPanel.ts (Koszary/technologie) może wyjaśniać brak karty Rekrutuj w turze 1 bez błędu harnessu — warto to potwierdzić przed decyzją o hooku.
DEPLOY/PUSH: NIE WYKONANO
