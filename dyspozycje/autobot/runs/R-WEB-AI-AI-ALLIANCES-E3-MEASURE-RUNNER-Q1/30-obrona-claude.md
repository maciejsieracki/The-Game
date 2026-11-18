STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzie pomiarowe i minimalny hak; zero zmian zasad, progów, balansu; flaga torSojuszyAktywny pozostaje false)
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1
GOAL: obrona rundy 1: odpowiedź na 3 zarzuty Evaluatora (commit 2d0e3b9bf) i poprawka w tej samej rundzie.
BAZA: kandydat 2fbac795f (origin/main d1dae2355 + commit operatora).
ZMIANY/COMMIT: patrz pole sha w StructuredOutput (czubek tej rundy).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. aiAiAllianceMeasureState() czytało wojny przez getDiploRelation(), które leniwie zapisuje relację.
   Poprawka (gra/src/main.ts, pętla wojen): odczyt `diplomacyRelations.get(\`${owners[i]}_${owners[j]}\`)?.status === 'wojna'`.
   Uzasadnienie równoważności: owners są posortowane rosnąco (klucz zgodny z getDiploRelation); brak wpisu = defaultNeutralRelation
   (status 'neutralni'), czyli nie-wojna, tak jak wynik getDiploRelation. Hak nie tworzy już relacji i nie zamraża zaufania D4.
   Test: H9 + mutant M5c (przywrócenie getDiploRelation) wykryty.
2. PRZYJMUJĘ. M5 i M7 miały identyczny fragment (`aiAiAllianceOdmowyLacznie += plan.odmowy;`), więc M5 nie była mutantem liczenia.
   Poprawka (gra/tools/ai-ai-alliance-measure-hook-test.cjs): dodane H8a/H8b (liczenie sojuszy per cywilizacja +1 na obie strony),
   H9 (wojny bez getDiploRelation); M5 = +5 zamiast +1 (wykryte przez H8a), M5b = brak liczenia strony b (H8b), M5c = wojny przez
   getDiploRelation (H9). Zarzut z dowodem Evaluatora (+5 przy zielonym teście) jest już wykrywany.
   ZASTRZEŻENIE: test pozostaje STATYCZNY (dopasowanie tekstu źródła). Nie spełnia dispatchu p.4 (test budujący bundle albo SKIP) —
   NIE ZMIERZONO w teście behawioralnym. Poprawność liczb per cywilizacja potwierdza wyłącznie bieg dymny + analizator.
3. PRZYJMUJĘ. Analizator czytał wyłącznie /^seed\d+\.jsonl$/. Poprawka (gra/tools/ai-ai-alliance-measure-analyze.cjs):
   akceptowany dowolny `*.jsonl`, ziarno z `seed(\d+)` (fallback: pierwsza liczba w nazwie). Dowód: `--in .../dowody` zwraca tabelę
   (ziarno 4242, ostatnia tura 30, flaga true, wymuszona true, max sojuszy/cyw. 0, próby 302, odmowy 302).

PONOWNY BIEG DYMNY (kod po poprawce, bundle zbudowany POZA repo: vite build --outDir <scratchpad>/ai-alliance-dist):
 - `tools/ai-ai-alliance-measure-run.cjs --alliances 1 --seed 4242 --turns 30`: exit 0, 29 wierszy jsonl (tury 2..30), NaN = 0,
   błędy/exception w logu = 0. Wynik: sojusze AI↔AI = 0, próby 302, odmowy 302, wojny AI↔AI = 0 (tak jak w biegu przed poprawką).
 - Zastąpiono dowody/smoke-alliances1-seed4242-t30.jsonl (+ .summary.json) wynikiem tego biegu. Bajtowo różni się od poprzedniej wersji
   (pola czasowe/kolejność); liczby kluczowe identyczne.
 - NIE ZMIERZONO: brak wiersza tury 1 (jsonl zaczyna od tury 2); przyczyny nie zbadano.

TESTY (wszystkie na poprawionym kodzie, surowe wyniki):
 - tsc --noEmit: exit 0 (node_modules = symlink do worktree wf_c81d82eb-f30-1, nie commitowany).
 - logic-test: LOGIC OK (213/213).
 - tech-tree-test: 20 pass, 0 fail.
 - research-test: PASSED 33 / FAILED 0 / TOTAL 33.
 - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
 - combat-test: COMBAT TEST 6/6 pass.
 - ai-ai-alliance-tick-test: suite 19/19 OK; mutanty 8/8 wykryte.
 - ai-ai-alliance-measure-hook-test: WYNIK ZIELONY; mutanty M1, M2, M3, M4, M5, M5b, M5c, M6, M7 wykryte (każdy czerwieni).
 - analyzer --in dowody: exit 0, tabela wyświetlona.
 - Długich biegów (100-150 tur, OFF vs ON) NIE uruchamiano (zakaz >30 tur; robi orkiestrator).

BLOKADY: brak techniczny. Ograniczenie jakości: hook-test statyczny (zob. odp. 2).
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Evaluator (ponowna weryfikacja zarzutów 1-3 i mutantów), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

---

# RUNDA 2 — obrona na raport Evaluatora (commit fcaf8bffd), baza kandydat 0fafa926e

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzie pomiarowe; zero zmian zasad, progów, balansu; flaga torSojuszyAktywny pozostaje false; src/ NIE zmieniany w tej rundzie)
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1
GOAL: odpowiedź na 3 zarzuty Evaluatora i poprawki w tej samej rundzie.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Zarzut: mutacja `proby: aiAiAllianceProbyLacznie -> proby: 0` oraz `wojnyAiAi: wojny -> 0` przechodziły zielono.
   Poprawka (gra/tools/ai-ai-alliance-measure-hook-test.cjs): reguły H11 (`proby: aiAiAllianceProbyLacznie,`),
   H12 (`odmowy: aiAiAllianceOdmowyLacznie,`), H13 (`wojnyAiAi: wojny,`), H14 (`naCywilizacje: ... liczba.get(oid) ...`),
   H15 (`sojuszeAiAi,` w zwracanym obiekcie) oraz mutanty M10-M14 (zerowanie każdego z tych pól).
   ZASTRZEŻENIE: test pozostaje STATYCZNY (dopasowanie tekstu źródła). Wymóg dispatchu p.4 (test budujący bundle albo SKIP)
   NIE ZREALIZOWANY: NIE ZMIERZONO w teście behawioralnym; liczby potwierdza wyłącznie bieg dymny i analizator.
2. PRZYJMUJĘ. Zarzut: kolumny 50/75/100/150 pokazywały wartość z ostatniej tury (t30) przy biegu 30-turowym.
   Poprawka (gra/tools/ai-ai-alliance-measure-analyze.cjs): punkt kontrolny bierze wiersz o DOKŁADNIE turze kontrolnej
   (`atCheckpoint` = `rows.find(r => r.turn === cp)`); gdy bieg jest krótszy, kolumna pokazuje "poza biegiem (koniec tN)".
3. PRZYJMUJĘ jako ograniczenie zakresu (bez zmiany kodu). Pełny pomiar OFF vs ON (100-150 tur x 3 ziarna) NIE ZMIERZONO
   w tym temacie: dispatch zabrania biegów > 30 tur, a bieg wykonuje orkiestrator. Otwarty punkt dla orkiestratora.

PONOWNE BRAMKI (kod po poprawce; surowe wyjścia):
 - `node tools/ai-ai-alliance-measure-hook-test.cjs`: reguły H1..H15 zielone (nieprzechodzące: brak); mutanty M1..M14 wykryte,
   każdy czerwieni test (M10->H11, M11->H12, M12->H13, M13->H14, M14->H15); WYNIK: ZIELONY, exit 0.
 - `node tools/ai-ai-alliance-measure-analyze.cjs --in dowody`: ziarno 4242 | ostatnia tura 30 | flaga true | wymuszona true |
   tura 1. sojuszu brak | tura 1. wojny brak | max sojuszy/cyw. 0 | próby 302 | odmowy 302; powody: n=300 gotowość poniżej progu,
   n=2 brak PN w skarbcu; punkty kontrolne: t25 = 0 / 0% / 0, t50/t75/t100/t150 = "poza biegiem (koniec t30)".
 - src/ (main.ts, ai-ai-alliance-tick.ts) NIE zmieniany w tej rundzie; tsc i pozostałe bramki gry NIE uruchamiane ponownie
   (zmiany wyłącznie w gra/tools/*.cjs i raporcie) — NIE ZMIERZONO w tej rundzie.

BLOKADY: brak techniczny. Otwarte: test behawioralny (p.4 dispatchu) NIE ZREALIZOWANY; pełne biegi OFF/ON NIE ZMIERZONO.
RUNDY: 2/5 (obrona rundy 2)
NASTĘPNY KROK: Evaluator (weryfikacja H11-H15/M10-M14 i kolumn punktów kontrolnych), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
