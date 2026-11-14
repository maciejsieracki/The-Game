STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-AIAI-LABELS-CARD-Q1
GOAL: dowód na żywo (zrzut + odczyt DOM), że karta AI w wojnie AI<->AI pokazuje OBA znaczniki zmęczenia/desperacji, a wojna gracz<->AI bez regresji.
ZMIANY/COMMIT: oceniony kandydat 4eb5ff9dac677d7a1ca80aa481e0ed217135794b (potomek bazy 3cc49c07b: git merge-base --is-ancestor = tak). git diff --name-only 3cc49c07b..4eb5ff9da = 24 plików: gra/tools/live-verify-aiai-labels-run.cjs, runs/<ID>/10-operator-claude.md, 30-obrona-claude.md, evidence/ (3 JSON + 18 PNG). Zero zmian w gra/src, gra/data, WERSJE.md, gra-robocza/, rust-port/ -> allowlista zachowana. git diff --check: czysty (exit 0).
TESTY:
- tsc --noEmit i 5 bramek referencyjnych: NIE URUCHOMIONO; kandydat nie zmienia żadnego pliku kodu gry (diff vs baza = tylko nowy skrypt tools + dowody), więc wynik byłby tożsamy z bazą. Dowodem jest diff-allowlista.
- Samodzielna weryfikacja surowych JSON (node, odczyt probes[].audience_1):
  * aiwar-271828: T5 warWear = 2 elementy ("Celtowie: Desperacja 16%", "Zulusi: Zmęczenie wojną 20%"); T10 = 2 (Celtowie 45%, Zulusi 45%); T16 = [] (pokój). pageErrors = [].
  * aiwar-314159: T5 = 2 (Chińczycy/Hetyci 20%); T10 = 2 ("Chińczycy: Desperacja 23%", "Hetyci: Zmęczenie wojną 45%"); T16 = []. pageErrors = [].
  * war-271828-player-regress: audienceTextFull sekcji "RELACJE Z TOBĄ": T5 "Ty / Zmęczenie wojną 20% / Celtowie / Zmęczenie wojną 20%"; T10 45%/45%; T16 "Ty Desperacja 43% / Celtowie Zmęczenie wojną 75%". Dwa wiersze (Ty, AI) obecne -> brak regresji. Pole warWear w tym JSON jest puste, bo runner czyta klasę .da-rel-war-wear tylko w sekcji relacji AI<->AI; dowód wynika z tekstu DOM.
- Zrzuty PNG i kod panelu (diplomacyAudience.ts) nie były ponownie oglądane/budowane przez FC; powtórzenie runnera na żywo: NIE_ZMIERZONO (200-260 s/ziarno; dowód mutacyjny nie dotyczy, brak poprawki w gra/src).
ZARZUTY:
1. Raport Operatora (l.16) błędnie twierdzi, że w wojnie gracz<->AI nie ma wiersza z nazwą AI -> ODDAL (cel spełniony, dwa wiersze potwierdzone w JSON); błąd opisowy w raporcie 10 skorygowany w 30-obrona-claude.md i tutaj. Linię 16 raportu 10 czytać jako nieaktualną.
2. Runner nie wyciąga strukturalnie wierszy gracz<->AI -> ODDAL (uwaga na przyszłość; nie wymagane przez dispatch).
3. Zrzuty pełnoekranowe; wojna AI<->AI kończy się pokojem w T11 (brak dowodu dla tur >=11) -> ODDAL (NIE_ZMIERZONO jawnie w raporcie; cel dotyczy trwającej wojny, pokryty T5/T10 na 2 ziarnach).
4. Brak powtórzenia runnera/mutacji -> ODDAL (dispatch tego nie wymaga).
5. Brak 00-dispatch.md w origin/main -> ODDAL (proces; bez wpływu na wynik).
Żaden NAPRAW, żaden DO DECYZJI CZŁOWIEKA.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja przez orkiestratora (runner + evidence + raporty) do main bez wdrożenia; integration_sha = SHA commita tego raportu (potomek 4eb5ff9da).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Przy integracji uwzględnij 30-obrona-claude.md jako korektę linii 16 raportu 10.
- Opcjonalny dług: runner mógłby strukturalnie odczytywać wiersze gracz<->AI.
