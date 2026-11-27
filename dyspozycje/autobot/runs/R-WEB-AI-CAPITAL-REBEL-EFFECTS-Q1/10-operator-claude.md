STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CAPITAL-REBEL-EFFECTS-Q1 (tag CAPREBEL)
GOAL: skutki buntu stolicy AI przy ≥ 2 miastach — nowa stolica, Pałac/budynki, Mennica, efekty stolicy, zwycięstwo/eliminacja, dyplomacja, crash, round-trip; tabela skutek | z kodu | zmierzone żywo | ocena
ZMIANY/COMMIT: baza 659e2d01c (origin/main). Nowe: gra/tools/caprebel-capital-live.cjs (runner), dyspozycje/analizy/AI-BUNT-STOLICY-SKUTKI-2026-11-27.md (dokument z tabelą), dane/capital-s4242-3t.txt. Zmiana gra/src/main.ts: WYŁĄCZNIE read-only hak `__capRebelReadTestDebug` (buildingsOf, ownerMennicaInCapital, ownerOrphanMennica, cityIdsWithMennicaAnyOwner), bez zapisu stanu gry. Brak zmian logiki gry, balansu, gra/data.
TESTY:
- tsc --noEmit (gra/): exit 0
- ai-city-rebellion-gate-test.cjs: PASS=37 FAIL=0
- ai-city-rebellion-news-test.cjs: PASS 24/0
- logic-test.cjs: LOGIC OK (213/213)
- tech-tree-test.cjs: 20 pass, 0 fail
- research-test.cjs: ALL GREEN (liczba przypadków nie wypisana)
- ai-test, combat, unit-replace: NIE URUCHOMIONO (zmiana gra/src ograniczona do read-only hooka)
- Żywy bieg: `node tools/caprebel-capital-live.cjs --dist /tmp/caprebel-dist-BmdB --turns 3 --seed 4242` (maksimum: Trudny, kultura trudny, koszty jednostek wysoki ×4, dyplomacja trudna). Wynik: owner 13, stolica city16 → city17 od tury 2, owner ma 1 miasto, eliminated=false, errors=[] (surowe: runs/.../dane/capital-s4242-3t.txt).
- Żywy pomiar Mennicy/budynków: NIE ZMIERZONO (w biegu brak budynków w miastach; Mennica nie zbudowana).
- Żywy bieg z włączonym sprawdzeniem zwycięstwa: NIE ZMIERZONO (runner wyłącza checkVictory przez disableVictoryCheckForTest).
BLOKADY:
- Mennica, efekty stolicy w skarbcu (c), zapis/wczytanie (g): NIE ZMIERZONO w tej rundzie (brak budynków w biegu; poza zakresem hooka). Ocena z kodu w dokumencie.
- Relacja właściciela z rebeliantami (−99 z dispatchu): zmierzono 'neutralni' przed i po buncie (tury 1–4). Nie ma w kodzie ustawiania relacji przy buncie — do potwierdzenia przez właściciela tylko jeśli ma wpływ na grę (nie jest decyzją gry, bo to stan obserwowany).
- Pełny runner 60 tur: NIE ZMIERZONO (poprzednie próby kończyły się zatrzymaniem tury, kandydat ENDSTALL #199).
RUNDY: 1/5
NASTĘPNY KROK: (1) dłuższy bieg z zbudowaną Mennicą w stolicy przed buncie i odczytem skarbca przed/po zmianie stolicy; (2) bieg z włączonym sprawdzeniem zwycięstwa; (3) round-trip zapisu po buncie. Decyzja gry (DECISION_REQUIRED) NIE wymagana na tym etapie: wszystkie zaobserwowane skutki (nowa stolica = najstarsze miasto; owner żywy z 1 miastem) są zgodne z komentarzem kodu. Jeśli właściciel chce inną politykę stolicy po buncie, to pytanie ABC o grę (poza tym tematem).
UWAGI-DLA-ORKIESTRATORA: runner `caprebel-capital-live` i hook `__capRebelReadTestDebug` nadają się do ponownego użycia w kolejnej rundzie (budowa Mennicy wymaga osobnego hooka lub kilku tur bez buntu, decyzja orkiestratora). Zauważono: `__rebelProtectionTestDebug` nie ma `isGameOver` (runner czyta gameOver jako null).
DEPLOY/PUSH: NIE WYKONANO
