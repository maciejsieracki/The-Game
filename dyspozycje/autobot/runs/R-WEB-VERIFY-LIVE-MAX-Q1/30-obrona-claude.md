STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-VERIFY-LIVE-MAX-Q1 (tag VLIVE), runda obrony 2/5
GOAL: odpowiedź na 9 zarzutów Evaluatora (kandydat 1a16d0406, raport 61eb13797); poprawa dokumentu i dowodów. Zamknięcie pozycji NIE ZMIERZONO w tej rundzie NIE było możliwe (patrz BLOKADY).
ZMIANY/COMMIT: dyspozycje/analizy/VERIFY-LIVE-MAX-2026-11-27.md (przepisany), dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q1/30-obrona-claude.md, dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q1/dane/ (jsonl, summary, state, flee json, run.log, analiza-limitow.py, analiza-limitow.wynik.txt). Brak zmian w gra/src i gra/tools. Symlink gra/node_modules (lokalny, nieśledzony, do ./node_modules innego worktree) nie jest częścią commita.
SHA: patrz pole sha w StructuredOutput (czubek commita obrony).

ODPOWIEDZI NA ZARZUTY
1. PRZYJĘTY, wykonany. Bramki uruchomione przez Operatora (surowe wyjście): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/0; combat 6/6; unit-replace 21/21; ai-test 297 passed / 0 failed.
2. PRZYJĘTY. Pomiar 1: 98 wierszy, tury 2–99. Tury 100–120 NIE ZMIERZONO (Chromium SIGSEGV przy wznowieniu; load 6–25). Brak poprawy w tej rundzie.
3. PRZYJĘTY. Pomiar 2: 0 sojuszy AI↔AI w 98/98 turach (`sojuszeAiAi` = {0}); limit 2 nieprzetestowany przy wartości > 0. Seed 7 i tury 100–150 NIE ZMIERZONO.
4. PRZYJĘTY. Pomiar 3: brak nowego runnera żywej tury z Targowiskiem; zostaje NIE ZMIERZONO.
5. PRZYJĘTY. Pomiar 4: cesja >1 miasta na żywo NIE ZMIERZONO; dokument to jawnie rozdziela (żywo 1 miasto, logika >1).
6. PRZYJĘTY. Pomiar 5b FORTRING: brak udokumentowanej próby; zostaje NIE ZMIERZONO, dokument to mówi.
7. PRZYJĘTY (częściowo naprawione). Dane źródłowe 1–2 i 5a skopiowane do repo z sumami sha256 (jsonl dbe92930…, flee eda3b50d…); skrypt weryfikacji `analiza-limitow.py` odtwarza wyniki z jsonl. Animacja odwrotu NIE ZMIERZONO.
8. PRZYJĘTY. Koszty jednostek maksimum = Wysoki (×4) wg `gra/src/ui/newGameFlow.ts`; biegi 1–2 były na Niski (NIE maksimum), pomiary 3–5 na domyślnych (NIE maksimum). Dokument mówi to wprost. Brak dowodu, że maksimum nie dotyczy pomiarów 1–2, więc nie podaję tego jako zamkniętego.
9. ODRZUCAM część „niespójności” z DOWODEM: „7 par” to liczba wszystkich par w wojnie naraz (maks. 7 w t85; t88 też 7 par, lista par w jsonl). `wojnyRownolegleMax` to maks. wojen jednej cywilizacji — wyliczenie z jsonl zgodne z licznikiem w każdym z 98 wierszy (max 2 w t69). Definicje dopisane do dokumentu. `zerwaniaZeroZaufania` = licznik skumulowany (0 → 40 w t93, bez zmian do t99), opisany w dokumencie.

TESTY
- Bramki ogólne: tsc 0; logic 213/213; tech-tree 20/0; research 33/0; combat 6/6; unit-replace 21/21; ai-test 297/0 (wszystkie uruchomione w tej rundzie w pierwszym planie).
- analiza-limitow.py na jsonl seed 4242: max pary w wojnie 7 (t85); max wojen jednej cywilizacji 2 (t69); licznik zgodny w 98/98 wierszach; sojusze 0; wojny gracza max 1 na typ (naturalna, epoki); zerwania 0 → 40.
- Pomiary live w tej rundzie: NIE uruchamiano (brak czystej maszyny; patrz BLOKADY).

BLOKADY
- Pozycje NIE ZMIERZONO pozostają otwarte: 1 (tury 100–120, seed 7), 2 (tury 100–150, seed 7, limit > 0), 3 (żywa tura z Targowiskiem), 4 (żywa cesja >1 miasta), 5a (animacja odwrotu), 5b (FORTRING). Przyczyna: Chromium SIGSEGV przy wznowieniach ze slotu (#90) i obciążenie maszyny (load 6–25 na 4 rdzeniach) — wymagają czystej maszyny lub osobnego tematu.
- Brak decyzji właściciela potrzebnej do tej rundy.

RUNDY: 2/5 (runda 1: FAIL Evaluatora; runda 2: ta odpowiedź).
NASTĘPNY KROK: orkiestrator decyduje: (a) przyjąć częściowe zamknięcie (PASS-WITH-NOTES) i rozbić pozostałe pozycje na R-WEB-VERIFY-LIVE-MAX-Q2 na czystej maszynie (runnery: pozycja 1 tury 100–120 + seed 7; pozycja 2 tury 100–150 seed 7 z sojuszami >0 lub poziomem porównawczym; pozycja 3; pozycja 4 >1 miasto live; pozycja 5b; animacja 5a), albo (b) nową rundą tego samego tematu. Osobna uwaga: „Koszty jednostek” na Wysokim (×4) do zmierzenia przy pomiarach 1–2.
UWAGI-DLA-ORKIESTRATORA: 0 sojuszy AI↔AI przy Trudnej (seed 4242, t2–99) — wymaga porównania z Łatwą/Normalną w tym samym ziarnie, zanim będzie uznane za błąd lub zamierzone (pytanie dla właściciela tylko jeśli zostanie potwierdzone jako wpływające na grę).
DEPLOY/PUSH: NIE WYKONANO
