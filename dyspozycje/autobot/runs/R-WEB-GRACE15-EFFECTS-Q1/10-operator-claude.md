STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-GRACE15-EFFECTS-Q1 (tag GRACE15FX)
GOAL: zmierzyć na maksimum skutki okna łaski 15 tur (FALA 935) na AI (t30/t60, 2 ziarna), przeżycie pasywnego gracza po oknie z bramką skarbca, oraz listę rozbieżności tekstów gry z nową regułą. Zero zmian gra/src.

ZMIANY/COMMIT:
- Nowe narzędzia (allowlista gra/tools/grace15fx-*.cjs): gra/tools/grace15fx-run.cjs (kopia aibal2-measure-run.cjs, jedna zmiana: poziom barbarzyńców z --barb, domyślnie trudny), gra/tools/grace15fx-summary.cjs (zestawienie AI t30/t60 i tabela gracza t1–30).
- Dokument: dyspozycje/analizy/OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md.
- Dane runów: dyspozycje/autobot/runs/R-WEB-GRACE15-EFFECTS-Q1/dane/ (A-s4242, A-s7, B-s4242, B-s7, Akn-s4242 — JSONL gzip, summary, state, events, run.txt z readbackiem; zestawienia *.txt).
- Baza kodu: fc7d74290 (PO) i 3b23b2d4f (PRZED, git archive do katalogu tymczasowego). gra/src w repo: bez zmian (git diff gra/src = 0).
- SHA commita z kodem/raportem: patrz pole sha w StructuredOutput (commit tego raportu).

TESTY:
- Bramki (wyniki z surowego wyjścia):
  - npx tsc --noEmit (gra/): exit 0.
  - node tools/logic-test.cjs: „LOGIC OK (213/213)”.
  - node tools/ai-test.cjs: „ai-test: 297 passed, 0 failed”.
  - node tools/early-grace-15-test.cjs: „early-grace-15-test: 33 passed, 0 failed”.
- Pomiar AI, maksimum (Trudny, Dyplomacja trudna, Kultura trudny/trudny, Koszty wysoki, miasta-państwa 1, barbarzyńcy trudny), tury 30 i 60:
  - PO (B) s4242: t30 puste 43/89 (48,3%), t60 puste 139/178 (78,1%), civs 14→13, jedn AI t60 163.
  - PO (B) s7: t30 puste 43/99 (43,4%), t60 puste 125/180 (69,4%), civs 14→13, jedn AI t60 186.
  - PRZED (A) s4242: t30 puste 59/87 (67,8%), t60 puste 123/165 (74,5%), jedn AI t60 182.
  - PRZED (A) s7: t30 puste 43/86 (50,0%), t60 puste 141/170 (82,9%), jedn AI t60 134.
  - Kontrola PRZED, barbarzyńcy normalny, s4242: t30 puste 16/94 (17,0%), t60 puste 55/174 (31,6%).
- Pasywny gracz (B), miasto gracza: t16–t41 żyje (4242) / t16–t47 (7), skarbiec wyzerowany t42 / t48, miasto znika w tej samej turze. PRZED (A): miasto ginie t16 (4242) i t29 (7).
- NIE ZMIERZONO: gracz aktywny (zakup obrońcy, podatek) — harness nie ma automatyzacji zakupu jednostki ani suwaka; patrz BLOKADY.
- Zastrzeżenie odczytu: readback gry (getSettings) nie zawiera poziomu barbarzyńców; wartość „trudny” przekazano w startNewGame i NIE ZWERYFIKOWANO odczytem.

BLOKADY:
- Gracz aktywny (dispatch §2): NIE ZMIERZONO — brak w harnessie kliknięć zakupu obrońcy i suwaka podatku, a dispatch zakazuje hak zmieniających stan. Wymaga osobnego tematu z klikaniem UI.
- Przyczyna pustych miast AI przy barbarzyńcach trudnych: NIE ZMIERZONO (brak pól barbarzyńców w JSONL; skarb AI nie tłumaczy większości pustych miast).
- Mechanizm utraty miasta pasywnego gracza w t42/t48 (wyzerowanie skarbca vs barbarzyńcy): NIE ROZSTRZYGNIĘTO.
- Ryzyko przy wznowieniu: drugi start z tego samego profilu Chromium (wznowienie slotu) padł SIGSEGV; każdy bieg zrobiono jako jeden przebieg od zera do t60 (czas ok. 6 min).

RUNDY: 1/5

NASTĘPNY KROK:
- Orkiestrator decyduje o zakresie tematu klikanego (gracz aktywny po t16: zakup obrońcy + podatek, tabela tura × skarbiec/prognoza/blokada/atak) oraz o pytaniu ABC do właściciela (co dalej po t16, czy wiki ma opisać okno łaski). Dane do pytania są w dokumencie analizy §5.
- Rozbieżności tekstów (§3 dokumentu) do decyzji właściciela; NIE poprawiano.

UWAGI-DLA-ORKIESTRATORA (znaleziska poza zakresem, bez tworzenia zadań):
1. Harness: runner `grace15fx-run.cjs` (jak aibal2) zawsze startuje nową grę (startNewGame) przed loadSlot; drugi start z istniejącego profilu w tej samej turze dał SIGSEGV Chromium. Warto rozważyć ścieżkę wznowienia bez nowej gry.
2. Hak `__settingsLive.getSettings()` nie zwraca `barbariansLevel` — readback nie potwierdza poziomu barbarzyńców.
3. Różnica barbarzyńców normalny/trudny zmienia puste miasta AI w t30 z 17% na 68% (ten sam kod). Wcześniejsze wartości 25–47% w AIEMPTY/AIBAL2 dotyczyły barbarzyńców normalny; w tym temacie nie rozstrzygnięto, czy to zamierzone.
4. Rozbieżności wiki (dokument §3): §90.2 i §90.3 poradnika „Barbarzyńcy” (wczesna faza: zwiadek) oraz poradnik/08 linia 28 (utrzymanie jednostek bez wyjątku 1–15) — do decyzji właściciela.

DEPLOY/PUSH: NIE WYKONANO
