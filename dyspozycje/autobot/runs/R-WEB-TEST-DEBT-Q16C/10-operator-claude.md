STATUS: BLOCK
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16C (runda 2/5, Operator HAIKU 5.5)
GOAL: Dla trzech czerwonych testów: zielony z mutacją czerwoną (klasa A) albo klasyfikacja B/C z dowodem; zero zmian gra/src; dokument DLUG-TESTOWY-Q16C zapisany.
ZMIANY/COMMIT: baza 8b98d9f414c27b729ed26289e64c020cece8d4f4 (`git merge-base --is-ancestor dbcc12f71 HEAD` = tak). Zmienione pliki: gra/tools/hotseat-drugi-fotel-tura-test.cjs (+4 linie: closeCivWelcome przed kliknięciami), gra/tools/hotseat-etap4-noop-test.cjs (closeCivWelcome przed zapisem tury, diagnostyka modala w komunikacie błędu), dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md, runs/R-WEB-TEST-DEBT-Q16C/** (logi 40–54). `gra/src` i `gra/data`: 0 zmian. Commit: patrz pole sha odpowiedzi (podpis commitów nie był modyfikowany).
TESTY (surowe wyjście z plików w runs/…):
- tsc --noEmit (gra/): RC 0.
- logic-test.cjs: LOGIC OK (213/213) — runs/52.
- ai-test.cjs: 297 passed, 0 failed — runs/53.
- ai-wojny-zwykle-cap-dwa-miasta-test.cjs: 22 PASS / 0 FAIL (runs/50). Mutacja A1 (bez prepareEndTurnGate): 2 PASS / 2 FAIL, t17 nie settled (runs/51). Mutacja A2 (regex F na kopii main.ts): BASE match true, MUTANT match false (runs/54). KLASA A: ZAMKNIĘTE.
- hotseat-drugi-fotel-tura-test.cjs: próba 1 (bez poprawki) — PASS 4/5, FAIL scenariusz R-HOTSEAT-RECZNY-RUCH-GRACZ2-Q1 (runs/40); diagnoza: modal „Odkryłeś nową cywilizację” (civ-welcome-screen-root, z-index 9650) przechwytuje klik zamiast CANVAS (runs/41, 42). Po poprawce: PASS 5/5 (runs/43) i PASS 5/5 (runs/44). KLASA A: ZAMKNIĘTE.
- hotseat-etap4-noop-test.cjs: NIEZAMKNIĘTE. Każda próba (3 wewnętrzne) pada na zapisie tury 23 (runs/45, 47, 48); tury 2–22 zapisują się (runs/49). Ctrl+S (doQuickSave) nie zapisuje w turze 23, rotacyjny autozapis zapisuje. Możliwa przyczyna: otwarta bitwa/podsumowanie (isSaveBlockedByBattle), NIE POTWIERDZONA. Jedna próba: „Target page … closed” (runs/45).
- Pytanie B (skok Spichlerza −11 → −108): NIE ZMIERZONO w runtime (narzędzie r1 nie zostało zacommitowane). Analiza kodu w dokumencie, bez poprawki gry.
BLOKADY:
- hotseat-etap4-noop: brak dowodu, czy blokada zapisu tury 23 to artefakt testu (bitwa/podsumowanie nie obsłużone) czy zachowanie gry. Wymaga kolejnej rundy z obsługą nakładki bitwy w teście.
- Pytanie B: brak pomiaru per miasto w turach 17–18 przy racji 0 (runtime). Do r3.
RUNDY: 2/5 (ta runda). Ostatni werdykt FC (r1): FAIL.
NASTĘPNY KROK: r3 (Operator, HAIKU): (1) etap4 — w teście przed Ctrl+S rozstrzygnąć otwartą nakładkę bitwy/podsumowania realnym klikiem i potwierdzić wynik logiem (3 próby); (2) pytanie B — zmierzyć per miasto i per owner (produkcja, racja, koszt armii, spichlerzStolicy) w turach 17–18 po setRationAll(0), z cytatami plik:linia; bez poprawki gry. Hotseat-drugi-fotel i ai-wojny: zostają zielone (nie powtarzać).
DEPLOY/PUSH: NIE WYKONANO
