STATUS: PASS-WITH-NOTES
DOMAIN: GAME/PROCESS
TEMAT: R-WEB-TEST-DEBT-BUDYNEK-GARNIZON-AI1-E4-DIAG-Q1
GOAL: odpowiedzieć na każdy zarzut Evaluatora (f24ce5883, raport 20-evaluator-claude.md) przyjęciem z poprawką i dowodem albo odrzuceniem z dowodem; zachować kod testu bez zmian, o ile zarzuty nie wykażą błędu.
BAZA/KANDYDAT: 0f4e7711b (detached HEAD w worktree), baza e39dcd1f8 (origin/main).
ZMIANY/COMMIT: allowlista tej rundy = wyłącznie ten raport (dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BUDYNEK-GARNIZON-AI1-E4-DIAG-Q1/30-obrona-claude.md). Kod gra/tools/budynek-garnizon-test.cjs i gra/src NIE zmienione w tej rundzie (mutacje w gra/src cofnięte przez git checkout, git status czysty przed commitem). SHA: pole sha w odpowiedzi.

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (nieścisły opis mutacji M2 w 10-operator-claude.md) — PRZYJMUJĘ (korekta opisu, bez zmiany kodu)
Operator w 10-operator-claude.md opisał M2 jako zmianę `if (opts.defensiveCopy && !csGarrisonMet)` na `if (opts.defensiveCopy)` i napisał, że daje czerwone [AI2]. Ponowny pomiar na kandydacie 0f4e7711b daje dokładnie to:
- M2a (zaostrzenie, zmiana z raportu Operatora): `if (opts.defensiveCopy)` -> `budynek-garnizon-test: 82 pass, 1 fail`, jedyny FAIL: `[AI2] miasto-państwo z garnizonem: AI wybiera garnizon` (wynik zgodny z raportem Operatora).
- M2b (wyłączenie bramki, wariant, o który pyta Evaluator): `if (false && opts.defensiveCopy && !csGarrisonMet)` -> `82 pass, 1 fail`, jedyny FAIL: `[AI3] miasto-państwo bez garnizonu: garnizon stłumiony` (zgodnie z pomiarem Evaluatora). Pod M2b [AI2] pozostaje zielone.
Wniosek: oba warianty są wykrywane przez test, różnią się tym, która asercja czerwieni. Raport Operatora opisywał wariant M2a, ale nazwał go „wyłączeniem bramki”, co było nieścisłe; ta runda to koryguje. Kod testu bez zmian.
Kod po mutacjach: `git checkout -- gra/src/game/ai.ts`, `git status --short` puste.

### Zarzut 2 ([AI1] jako negatywna asercja tekstowa) — ODRZUCAM zmianę (przyjmuję jako ograniczenie, nieblokujące)
Asercja [AI1] (gra/tools/budynek-garnizon-test.cjs ~l. 334-341) jest zamierzonym strażnikiem: ma wykryć ponowne wprowadzenie zaszytej listy `const infraOrder = [ ... ]`, którą commit 25c44acde usunął świadomie (kryterium 1 R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1). Zachowanie gwarantują asercje [AI2] i [AI3], co potwierdza mutacja M2a/M2b powyżej. Evaluator sam zaznacza, że zarzut jest nieblokujący i że intencja nie jest osłabiona. Zmiana na test behawioralny nie jest częścią tego tematu. Zostawiam jako świadome ograniczenie.

### Zarzut 3 (kruchość matchera [E4] na etykiecie „Pieniądz”) — ODRZUCAM zmianę
Matcher `/Koszt utrzymania\s*Co turę\s*\d+\s*Pieniądz/` (test ~l. 632-644) pilnuje kontraktu wiersza utrzymania karty budynku: sekcja + wiersz „Co turę” + wartość w walucie. Zmiana etykiety waluty lub nazwy sekcji jest zmianą UI, którą test ma zgłosić; Evaluator sam potwierdza, że mutacja buildingAdapter.ts:444 daje czerwone [E4] (zgodnie z celem testu). Matcher nie jest luźniejszy niż intencja tematu (wiersz istnieje, ma wartość). Brak zmiany.

### Zarzut 4 (5 bramek referencyjnych oznaczone NIE ZMIERZONO) — PRZYJMUJĘ (luka domknięta, własne pomiary)
Pomiary na 0f4e7711b w tej rundzie, z surowego wyjścia:
- `node tools/logic-test.cjs` -> `LOGIC OK (213/213)`, exit 0
- `node tools/tech-tree-test.cjs` -> `tech-tree-test: 20 pass, 0 fail`, exit 0
- `node tools/research-test.cjs` -> `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0
- `node tools/unit-replace-test.cjs` -> `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- `node tools/combat-test.cjs` -> `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`, exit 0
- `node tools/budynek-garnizon-test.cjs` -> `budynek-garnizon-test: 83 pass, 0 fail`, exit 0
- `node ./node_modules/typescript/bin/tsc --noEmit` (w gra/, po `npm ci --ignore-scripts`) -> exit 0, bez błędów
Wszystkie zielone, porównanie z bazą niepotrzebne. Pozostałe bramki z §6 R-PROC-AUTOBOT (mapa, AI-budynki, walka na polu, karta encji itd.) NIE ZMIERZONO w tej rundzie: temat dotyka wyłącznie gra/tools/budynek-garnizon-test.cjs, a nie kodu gry.

## Mutacje (ponowny pomiar tej rundy)
- M2a `if (opts.defensiveCopy && !csGarrisonMet)` -> `if (opts.defensiveCopy)`: 82 pass / 1 fail, czerwone [AI2].
- M2b `if (opts.defensiveCopy && !csGarrisonMet)` -> `if (false && opts.defensiveCopy && !csGarrisonMet)`: 82 pass / 1 fail, czerwone [AI3].
- M1 (z 10-operator-claude.md, nie powtarzana): buildingAdapter.ts tytuł sekcji -> E4 czerwone (wynik zgłoszony przez Operatora i Evaluatora: 82 pass / 1 fail).

## TESTY
- budynek-garnizon-test na kandydacie: 83 pass, 0 fail, exit 0 (baza 79/2 wg 10-operator-claude.md).
- 5 bramek referencyjnych i tsc: zielone, patrz zarzut 4.
- Mutacje M2a/M2b: wykonane z przywróceniem pliku, git status czysty.

## BLOKADY
Brak blokad merytorycznych. Commit tej rundy zawiera wyłącznie ten raport.

## RUNDY
2/5 (runda obrony Operatora po zarzutach Evaluatora r1; ostatni werdykt Evaluatora: PASS-WITH-NOTES, bez blokady).

## UWAGI-DLA-ORKIESTRATORA
- W worktree zostały artefakty ignorowane przez git do sprzątnięcia przez orkiestratora: gra/node_modules (npm ci --ignore-scripts) oraz gra/tools/.budynek-garnizon-* (bundle wygenerowane przez test). Plik gra/.ai-orig.bak usunięty.
- Worktree ustawiony na detached HEAD 0f4e7711b, a po commicie tej rundy będzie na SHA raportu.
- Poza zakresem (nie wpisywane do kolejki): wynik karty garnizonu 4 Pieniądz/turę przy utrzymaniu bazowym 2 (R_STAWKI_FALA2_MULT x era, economy-upkeep.ts:640) — decyzja właściciela, nie błąd testu.

NASTĘPNY KROK: ponowny przegląd Evaluatora (zarzuty 1 i 4 przyjęte z korektą; 2 i 3 odrzucone z dowodem), potem Final Control. Integracja i deploy nie wykonywane przez Operatora.
DEPLOY/PUSH: NIE WYKONANO
