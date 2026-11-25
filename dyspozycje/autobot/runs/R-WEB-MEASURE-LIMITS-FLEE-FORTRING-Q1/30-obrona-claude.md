STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar, bez zmian gry)
TEMAT: R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1
GOAL: Zmierzyć cztery funkcje (limit wojen, limit 2 sojuszy, FORTRING, FLEEMANUAL) na żywej grze i zapisać werdykty z liczbami albo NIE ZMIERZONO z konkretnym powodem i śladem. Ta runda: odpowiedź na zarzuty Evaluatora (d6c011747).
ZMIANY/COMMIT: BAZA kandydata 8415aae57 (checkout --detach). Commit tylko ścieżek: `dyspozycje/analizy/POMIAR-LIMITY-FLEE-FORTRING-2026-11-25.md` (przepisany), `dyspozycje/autobot/runs/R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1/30-obrona-claude.md` (ten raport), `dyspozycje/autobot/runs/R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1/dane/` (surowe JSONL gz, summary, analiza, SHA256). Zero zmian w gra/src, gra/data, gra/tools (`gra/tools/limits-measure.cjs` bez zmian). SHA commita: patrz pole SHA w wyniku StructuredOutput.
TESTY (surowe wyjście, worktree na 8415aae57, `npm ci` w gra/ z lockfile, node_modules usunięty po bramkach):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed.
- ai-test: 297 passed, 0 failed (exit 0)
- Analizator na surowych plikach: `node tools/limits-measure.cjs` -> ON: maxWojnEpokiAI 1, maxWojnNaturalnychAI 2, naruszeniaWojenAI 8 (tury 60–67), maxWojnNaturalnychGracz 0, maxSojuszyAI 2, naruszeniaSojuszyAI 0; OFF: maxWojnNaturalnychAI 1, naruszeniaWojenAI 0, maxSojuszyAI 0.
BLOKADY:
- (c) FORTRING: NIE ZMIERZONO (brak runnera i hooka przełączania pierścienia; round-trip zapisu: SIGSEGV harnessu, #90).
- (d) FLEEMANUAL: NIE ZMIERZONO (brak runnera live scenariusza odwrotu w gra/tools).
- Seed 7: NIE ZMIERZONO. 90 tur: NIE ZMIERZONO (zmierzono 67).
- Źródło deklaracji pary 22↔28 (naruszenie a1): NIE USTALONE (ZAŁOŻENIE: ownerDeclareWarOn force=true, main.ts:14386).
RUNDY: 2/5 (obrona)
NASTĘPNY KROK: Orkiestrator decyduje: (1) osobny temat runnera FORTRING (hook wyłączenia pierścienia + pomiar tury) i FLEEMANUAL (scenariusz odwrotu live); (2) R-WEB-* na naruszenie limitu wojen AI↔AI z logiem zdarzeń deklaracji (seed 4242, flagi ON, tura 60) i ustaleniem ścieżki force=true; (3) naprawa harnessu wznowień (#90) przed kolejnym biegiem 90 tur; (4) seed 7 do zmierzenia.
DEPLOY/PUSH: NIE WYKONANO

ODPOWIEDZI NA ZARZUTY EVALUATORA:

1. (c) i (d) bez runnerów, „brak czasu” jako powód — PRZYJMUJĘ. Powód „brak czasu” usunięty. Zastąpiony śladem technicznym w dokumencie (sekcja „Dlaczego (c) i (d) nie są zmierzone”): w gra/src istnieją fortRingShield/fortRingBlock/fortRingBuildBlockReason, brak w gra/tools runnera live i przełącznika pierścienia; dla (d) brak zidentyfikowanego runnera live (są testy jednostkowe battle-flee-*). Werdykty pozostają NIE ZMIERZONO — nie napisano runnerów w tej rundzie. Kryterium binarne dla tych 2 funkcji NIE jest spełnione; to jest otwarta praca dla orkiestratora (punkt 1 NASTĘPNEGO KROKU).

2. Brak wznawialnego runnera; limits-measure.cjs to analizator — PRZYJMUJĘ. Dokument nazywa teraz `limits-measure.cjs` analizatorem (nie runnerem). Runnerem jest `diplomacy-harder-measure-run.cjs`. Test „dwa odcinki = bieg ciągły” NIE ZMIERZONO (nie powtórzono wznowień w obronie; wynik rundy 1: SIGSEGV po pierwszym udanym wznowieniu).

3. Werdykt (a) myli limit z graczem z limitem AI↔AI — PRZYJMUJĘ. Dokument rozdzielony: (a1) AI↔AI: NIE DZIAŁA w tym biegu (naruszenie 8 tur, maks. 2 wojny naturalne u AI 28); (a2) limit wobec gracza: NIE ZMIERZONO (maxWojnNaturalnychGracz = 0, reguła wobec gracza nie wyzwolona). Dane: dane/analiza-limits-measure.json.

4. Brak minimalnego odtworzenia i ścieżki naruszenia; złe odwołanie do mustDeclareWarOn — PRZYJMUJĘ częściowo.
   - Odwołanie poprawione na rzeczywiste linie: warLimitPermits 26068–26075; warLimitAllowsDeclaration 26077; applyAllianceObligationsOnWar, sprawdzenie limitu sojusznika 26237; ownerDeclareWarOn 14317 (bramka limitu w 14325 pod `!force`); jedyne force=true 14386 (triggerRebelProtectionWarConsequence); obowiązek wejścia w wojnę (wywołanie z ob.mustDeclareWarOn) 26229–26235. Wcześniejsze „main.ts ~26237 / mustDeclareWarOn” było zbyt ogólne.
   - Zarzut o sprawdzaniu tylko strony sojusznika w ścieżce sojuszu — OBALONY przez kod: warLimitPermits sprawdza obie strony (26068–26075). Ten fragment dokumentu wycofany.
   - Minimalne odtworzenie NIE wykonane (wymaga runu z logiem zdarzeń deklaracji): NIE ZMIERZONO, opisany kandydat.
   - Ścieżka pary 22↔28 pozostaje ZAŁOŻENIEM (kandydat: force=true przy przejęciu miasta), bez dowodu. Nie ma w danych zdarzeń przejęcia ani pola „deklarujący”.

5. Zakres poniżej dispatchu (67 tur, seed 4242, seed 7 NIE ZMIERZONO), werdykt (b) zbyt mocny — PRZYJMUJĘ. Werdykt (b) zmieniony na „DZIAŁA w tym biegu (wstępnie)”: jeden seed, 66 wierszy, tury 2–67, limit 2 osiągnięty (t42) i nieprzekroczony.

6. Nie sprawdzono faktycznego domyślnego stanu flag — PRZYJMUJĘ i UZUPEŁNIONO odczytem z danych: `gra/data/diplomacy-war-limit-params.json` limitWojenAktywny.wartosc = true; `gra/data/ai-ai-treaty-params.json` torSojuszyAktywny = true (linia 11). Wniosek: bieg ON odpowiada domyślnemu stanowi gry; OFF jest kontrolą.

7. Surowe dane tylko w scratchpadzie — PRZYJMUJĘ. Dodano do repo w `dyspozycje/autobot/runs/R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1/dane/`: seed4242-all1.jsonl.gz (47407 B), seed4242-all0.jsonl.gz (46646 B), seed4242-all0.summary.json, analiza-limits-measure.json (wynik analizatora na tych plikach), SHA256-nieskompresowane.txt (ON 9b900f84…b72efa, OFF 9a164595…711). Summary dla runu ON nie istniał w scratchpadzie (jest tylko JSONL) — NIE dodano wymyślonego summary.

8. Jeden commit zamiast commita po każdej funkcji — PRZYJMUJĘ jako odstępstwo procesowe. Historii nie przepisywano; ta runda to jeden commit obrony (ścieżki jawnie wymienione). Dla przyszłych rund: commit per funkcja.

UWAGI-DLA-ORKIESTRATORA:
- Nie wywoływano spawn_task, dismiss_task, create_session, create_trigger, send_later ani innych narzędzi tworzących sesje/zadania. Nie użyto run_in_background. Każde Bash w pierwszym planie.
- gra/node_modules zainstalowany na czas bramek (npm ci, 71 pakietów) i usunięty po nich.
- Dane runów ON/OFF: JSONL zawierają tylko flagi wymuszone hakiem; domyślne wartości potwierdzono w gra/data (punkt 6).
- Kandydat R-WEB-* (naruszenie limitu AI↔AI): ścieżka force=true przy przejęciu miasta (main.ts:14386) jest najmocniejszym założeniem, nie dowodem; warto dodać log zdarzeń deklaracji w runie 60 tur.
- Nie naprawiano gry (zakaz).
