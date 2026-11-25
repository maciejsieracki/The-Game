STATUS: BLOCK
DOMAIN: GAME (pomiar)
TEMAT: R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1
GOAL: Zmierzyć FORTRING (wydajność tury AI ON/OFF, liczba fortów, round-trip zapisu) i FLEEMANUAL (ręczny odwrót: limit ruchu, brak odwrotu poza mapą, stan po odwrocie) i zapisać dokument z werdyktami.
ZMIANY/COMMIT: tylko ten raport (bez zmian w gra/src, bez nowych runnerów). Baza: origin/main 547ca34b56f45a7d81da262c4720289b90d01cd2. Brak zmian w gra/.

TESTY:
- tsc --noEmit (gra/): exit 0 (zmierzone).
- FLEEMANUAL punkt odniesienia, istniejący test gra/tools/battle-flee-manual-test.cjs, uruchomiony solo na każdym przypadku (FLEE_CASE=0/1/2), Chromium headless przez Playwright, Vite dev:
  - Przypadek 0 Wojownik: normalny zasięg 4, limit ucieczki 2, max kroków/turę 2 (rundy 1-5 po 2), 9 kroków łącznie; 6 PASS, 0 FAIL.
  - Przypadek 1 Rydwan konny (War Chariot): zasięg 6, limit 3, max 3; 6 PASS, 0 FAIL.
  - Przypadek 2 Strażnik bram Harappy (Harappan Gate Guard): zasięg 3, limit 1, max 1; 6 PASS, 0 FAIL.
  - Wynik: limit ruchu odwrotu jest egzekwowany w trzech przypadkach (liczby z surowego wyjścia).
- Pozostałe bramki z dispatchu (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0, hotseat-etap6d-podetap-e-source 77/0, bramki-tmpdir-unikalnosc): NIE ZMIERZONO (nie uruchamiane w tej rundzie, bo nie wprowadzono zmian w kodzie gry).

FORTRING - werdykt: NIE ZMIERZONO (blokada techniczna)
- Pierścień fortów (gra/src/map/territory.ts: fortRingShield, fortRingHasOwnImprovement, fortRingBuildBlockReason) to stała reguła własności, bez przełącznika (flagi, ustawienia, data/*.json). Grep po gra/src i gra/data nie znajduje żadnego przełącznika.
- Minimalny hak ON/OFF pod ?civTest=1 wymaga zmian poza allowlistą dispatchu: gating wywołań w territory.ts oraz gra/src/map/improvement-build.ts (linia 1091, fortRingBuildBlockReason). Allowlista dopuszcza tylko gra/src/main.ts.
- Runner gra/tools/fortring-measure.cjs nie został napisany: bez przełącznika pomiar ON/OFF nie ma sensu; 2 pełne biegi AI 60 tur nie zostały uruchomione.
- Propozycja (kandydat R-WEB-*): dopuścić do allowlisty territory.ts i improvement-build.ts jako jedyne miejsca gatingu (flaga domyślnie ON, zmiana tylko pod ?civTest=1), potem runner ON/OFF i test źródłowy hooka.

FLEEMANUAL - werdykt: CZĘŚCIOWO DZIAŁA / CZĘŚCIOWO NIE ZMIERZONO
- Limit ruchu odwrotu (odwrót nie przekracza limitu z combat-params.json ucieczka.mnoznik_ruchu=0.5): DZIAŁA, dane jak wyżej (3 przypadki, 0 FAIL w teście referencyjnym).
- Brak odwrotu poza mapą: NIE ZMIERZONO. Istniejące testy battle-flee-manual* tego nie sprawdzają; nowy runner gra/tools/flee-manual-measure.cjs nie został napisany w tej rundzie.
- Stan po odwrocie na mapie i animacja: NIE ZMIERZONO (j.w.).
- Brak nowego runnera i brak pliku dane/*.jsonl.gz; dokument dyspozycje/analizy/POMIAR-FORTRING-FLEEMANUAL-2026-11-25.md nie został utworzony.

BLOKADY:
1. FORTRING: brak przełącznika; wymagana zmiana allowlisty (territory.ts, improvement-build.ts) - decyzja orkiestratora.
2. FLEEMANUAL: brak runnera dla przypadków off-map i stanu mapy po odwrocie (zakres do zrobienia w następnej rundzie).
3. Bramki poza tsc: NIE ZMIERZONO.

RUNDY: 1/5 (ostatni werdykt: BLOCK z techniczną blokadą FORTRING; FLEEMANUAL częściowo zmierzony)
NASTĘPNY KROK: orkiestrator decyduje o rozszerzeniu allowlisty dla gatingu fortRing (territory.ts, improvement-build.ts) i o zakresie runnera FLEEMANUAL (off-map, stan po odwrocie). Po decyzji: nowa runda z tym samym ID.
UWAGI-DLA-ORKIESTRATORA: brak.
DEPLOY/PUSH: NIE WYKONANO
