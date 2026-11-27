STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian gra/src)
TEMAT: R-WEB-PLAYER-LASTCITY-REVOLT-Q1 (runda 4/5, Operator HAIKU)
GOAL: readback ustawien w commicie (3 biegi maksimum), A/B inercja haka civTest, ownerChangesTail w summary.json, aktualizacja dokumentu GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md
ZMIANY/COMMIT: zmiany w allowliscie: gra/tools/plrrevolt-run.cjs (readback do .txt i summary, ownerChangesTail, helper); dyspozycje/analizy/GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md (sekcja 00 STAN WIAZACY r4); dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/dane-r4/ (5 katalogow biegow, *.jsonl.gz, *.readback.txt, *.summary.json, *.state.json, *.events.log, run.txt, ab-compare.txt); ten raport. Zero zmian gra/src (git diff bf299e885 -- gra/src = 0 linii). Commit: patrz "SHA" w StructuredOutput.
TESTY:
- readback (maksimum: difficulty trudny, kosztJednostekPace wysoki, diplomacyWarLevel trudna, barbariansLevel trudny, kulturaReligiaLevel gracza normalny, kulturaReligiaLevelAI TRUDNY): 3/3 biegow ziarno 4242, 7, 778899, do t30, zapisany readback.txt + summary.readback. Odczyt z gry potwierdzony w gameSettings: kulturaReligiaLevelAI "trudny", difficulty "hard", barbariansLevelGra "trudny".
- A/B inercja haka (ziarno 4242, kultura normalny, pasywny gracz, t2-t16): bundle A z 909a057fa (bez haka) vs bundle B z bf299e885 (z hakiem). stateHash identyczny w 15/15 turach; digest bez plr/sec/load1 identyczny 15/15. Tabela: dane-r4/ab-compare.txt.
- tsc --noEmit: exit 0 (17 s).
- logic-test: LOGIC OK (213/213).
- ai-test: 297 passed, 0 failed.
- society-breakdown-test: 56 OK, 0 FAIL.
- Wyniki utraty miasta gracza (readback, 3 biegi, do t30): ziarno 4242 utrata t16 (Rzym 0 -> -1, applyCityCaptureToMap); ziarno 7 utrata t29 (Rzym 0 -> -1); ziarno 778899 utrata t12 (Rzym 0 -> -1). Zmian na -99 (bunt): 0. Tury zgodne z r3.
- Porzadek miasta gracza (porPct) min/sr do utraty: 4242 52,9/52,9; 7 44,9/54,9; 778899 59,5/59,5. Zadne miasto gracza nie weszlo w skrajny bunt (prog 12).
- Populacja miasta gracza: max 2 (4242), 3 (7), 1 (778899).
BLOKADY: brak wymaganych blokad. Chromium SIGSEGV przy starcie/wczytaniu slotu: wznowienie 4242 padlo 2x (przy ponownym wywolaniu takze), ab-nohook 2x przed sukcesem (3. proba). Pomimo tego wszystkie biegi koncowe wykonano jako swieze (bez wznowienia), segmenty <= 30 tur. Plik ab-nohook: 2 nieudane proby (run.txt nadpisany przy 3. probie).
RUNDY: 4/5 (r4). Poprzednie rundy: r1 FAIL, r2 FAIL, r3 FC FAIL formalny.
NASTEPNY KROK: Final Control r4 — sprawdzic readback.txt i summary.json w dane-r4 oraz ab-compare.txt; decyzja o pop >= 5 (NIE ZMIERZONO) i o rozbieznosci z REALDEF4 (NIE ZWERYFIKOWANO, ktore ziarno REALDEF4 przezylo).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Baza bf299e885 nie zawiera (w gra/src/main.ts) okna lacznosci barbarzyncow 15 tur (GRACE15). Jesli na origin/main jest pozniejsza wersja, pomiar trzeba powtorzyc na biezacym main. NIE ZWERYFIKOWANO.
2. ownerChangesTail w summary.json pokazuje ostatnie 3 zmiany wlasciciela wszystkich miast (nie tylko gracza). Dla gracza uzywac pola oldOwner 0 w jsonl.
3. Dane biegow sa w dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/dane-r4/. Buildy vite (w /tmp) usuniete po pracy.
4. Wszystkie liczby pochodza z surowych plikow (jsonl.gz, summary.json, ab-compare.txt).
