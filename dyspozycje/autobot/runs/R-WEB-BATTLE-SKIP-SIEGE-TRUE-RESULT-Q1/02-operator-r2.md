STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SKIP-SIEGE-TRUE-RESULT-Q1
GOAL: wynik "Pomin do wyniku" w oblezeniu ma byc taki sam jak wynik AUTO; poprawka nie moze zostawic exploita (atak bierze miasto bez wylomu).
ZMIANY/COMMIT: kod poprawki bez zmian w tej rundzie (b9d38ce30, gra/src/battle/battleScene.ts). Nowy test zywy: 9e26a913d (gra/tools/battle-skip-siege-parity-live-test.cjs). Lokalny symlink gra/node_modules -> worktree wf_7aea9d5e-ab6-1 (gitignored, nie commitowany). Brak push, deploy, WERSJE.md, git add -A.
BAZA: b9d38ce30 nalezy do galezi worktree-wf_7aea9d5e-ab6-1 (NIE do claude/sprawdzenie-funkcjonalnosci-ek4ra0, tip bc890e1fe nie zawiera b9d38ce30). 1d068199 jest przodkiem b9d38ce30; miedzy nimi 12 commitow tej galezi. Wlasny diff Operatora = 2 pliki z allowlisty.

TESTY (pomiar w tej rundzie, Chromium 1194 z /opt/pw-browsers, headless, zegar deterministyczny, dt=16 ms, sufit FF_MAX_ROUNDS=400):
- Zywa scena ?playtest=oblezenie-duze, SKIP, NOWY kod (b9d38ce30), seedy 1-8: zwyciezca=obronca, tura 400, breached=true (8/8), straty atk 25-27, def 10-11. Sciezka konca: "PAT: 400 tur ... rozstrzygniecie po morale armii".
- Zywa scena, SKIP, KOD PRZED POPRAWKA (b9d38ce30^ = 1d068199 battleScene.ts, mutant w buildzie), seedy 1-8: IDENTYCZNE z nowym kodem na wszystkich 8 seedach (zwyciezca, tura, breached, straty, pozostali zywi, HP).
- Zywa scena, AUTO 1x, nowy kod, seed 1: NIE_ZMIERZONO. Przebieg do tury 86 zajal 480 s wall; do sufitu 400 tur ok. 24 min wall (limit narzedzia 590 s na wywolanie, bez tla).
- Zywa scena, AUTO 8x (WSKIP_AUTO_SPEED_IDX=3), nowy kod, seed 1: zwyciezca=obronca, tura 400, PAT po morale, breached=true; straty atk 25 / def 11, HP 2666/746. SKIP 1x na tym samym seedzie: atk 26 / def 11, HP 2591/733. Parytet NIE jest dokladny (roznica 1 strata i 75 HP): krok czasu 8x rozni sie od kroku 16 ms skipa. Nie wolno tego traktowac jako PASS parytetu.
- tsc --noEmit (gra/): exit 0.
- battle-skip-siege-parity-test.cjs (statyczny S1-S7): 7 PASS, 0 FAIL, 1 NIE_ZMIERZONO (czesc B przeniesiona do nowego testu zywego).
- auto-battle-simultaneous-test: 29 pass, 0 fail.
- battle-standoff-two-warriors-test: 9 PASS, 0 FAIL.
- siege-surrender-forecast-test: RESULT pass=57 fail=0.
- siege-last-stand-sortie-test: WYNIK 71 OK, 0 FAIL.
- battle-cap-500-test: PASS 59 asercji.
- battle-skip-equals-auto-resolve-test (czesc B, zywa scena bitwa-duza): NIE_ZMIERZONO w tej rundzie (czas).

ODPOWIEDZI NA ZARZUTY:
Z1 (brak behawioralnego dowodu, test tylko statyczny): PRZYJMUJE czesciowo. Dodano zywy test 9e26a913d. Dowod: skip przed/po poprawce identyczny na 8/8 seedach. Dowod parytetu AUTO == SKIP NIE zostal dostarczony (AUTO 1x poza limitem czasu). Otwarte.
Z2 (diagnoza i poprawka niepotwierdzone; czy exploit powstaje na wylomie/limitach): PRZYJMUJE jako fakt pomiaru. W scenie oblezenia atakujacy zawsze wylamuja mur (breached=true 8/8 przed i po poprawce), wiec poprawka (galaz "oblezenie bez wylomu") NIE zmienia zmierzonego wyniku tej sceny. Exploit (slabsza armia bierze duze miasto bez wylomu) NIE zostal odtworzony. Ta galaz wymaga scenariusza bez wylomu, ktorego w testach nie ma. NIE_ZMIERZONO.
Z3 (przyczyna zrodlowa: AUTO bez sufitu; poprawka dodaje sufit do AUTO, co zmienia zachowanie AUTO): PRZYJMUJE. Sufit 400 tur w AUTO to zmiana zachowania (wczesniej AUTO w oblezeniu bez wylomu nie konczyl sie). To decyzja balansowa, nie techniczna — pytanie ABC do wlasciciela (patrz NASTEPNY KROK). ODRZUCAM twierdzenie, ze skip uzywa innej symulacji: skip() (battleScene.ts ok. 3660) uruchamia _runFastForward (ok. 9380), ktory wola te same _checkEnd i kroki walki co AUTO; roznica to krok czasu i sufit.
Z4 (model Haiku zamiast Sonnet): PRZYJMUJE jako fakt. Ta runda i poprzednia dzialaly na Haiku 5.5. Decyzja o modelu nalezy do orkiestratora.
Z5 (regresja niezweryfikowana, brak node_modules): PRZYJMUJE i ROZWIAZANE: symlink do node_modules z sasiedniego worktree; wyniki regresji podane wyzej (exit 0 / liczniki zgodne z raportem r1: 57/0, 71/0). Nie uruchomiono: battle-skip-equals-auto-resolve-test (czesc B, NIE_ZMIERZONO).
Z6 (niejasna baza): PRZYJMUJE opis faktu: b9d38ce30 jest na galezi worktree-wf_7aea9d5e-ab6-1; baza 1d068199 jest przodkiem; 12 commitow posrednich nie pochodzi z allowlisty. Orkiestrator powinien integrowac przez SHA b9d38ce30 i sprawdzic `git merge-base --is-ancestor b9d38ce30 <SHA integracji>` oraz `git diff --stat 1d068199 <SHA>` przed merge.

NIE ZMIENIONO w tej rundzie (swiadomie): logika poprawki w battleScene.ts (b9d38ce30). Zmiana tego wymaga decyzji ABC.

BLOKADY:
1. Brak dowodu parytetu AUTO 1x == SKIP (wymaga ~24 min wall na przebieg; limit narzedzia 590 s na wywolanie bez tla). Do zrobienia: przebieg w osobnej sesji z WSKIP_SEEDS=1 WSKIP_MODES=auto bez limitu, potem WSKIP_COMPARE=1.
2. Brak scenariusza bez wylomu, na ktorym mozna odtworzyc exploit i sprawdzic galaz poprawki (mutant: pre-fix ma dac zwyciezce atakujacego).
3. Decyzja ABC: czy sufit 400 tur w AUTO i regula "oblezenie bez wylomu po sufitcie = obronca" maja obowiazywac (zmiana zachowania AUTO).

RUNDY: 2/5 (r1 FAIL przez Evaluatora; r2 = ta runda, model Haiku 5.5). Ostatni werdykt: FAIL (zarzuty Z1-Z6).
DECYZJA WYMAGANA: ABC: (a) sufit 400 tur w AUTO dla oblezenia bez wylomu: TAK/NIE; (b) regula po sufitcie: obronca (rekomendacja Operatora) / morale; (c) czy zlecic scenariusz bez wylomu do dowodu exploita.
NASTEPNY KROK: orkiestrator: ABC do wlasciciela; po decyzji i pomiarze AUTO 1x (osobny przebieg) — Evaluator (Sonnet) weryfikuje 9e26a913d i ten raport.
DEPLOY/PUSH: NIE WYKONANO
