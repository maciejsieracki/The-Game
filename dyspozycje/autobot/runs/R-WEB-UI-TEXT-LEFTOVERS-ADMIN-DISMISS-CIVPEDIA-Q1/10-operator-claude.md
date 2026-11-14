# R-WEB-UI-TEXT-LEFTOVERS-ADMIN-DISMISS-CIVPEDIA-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-TEXT-LEFTOVERS-ADMIN-DISMISS-CIVPEDIA-Q1
GOAL: (1) tekst okna potwierdzenia zwolnienia administratora zgodny z nagłówkiem panelu (miasta / państwa-ulepszeń); (2) w hasłach Civpedii brak wyrażenia „jeszcze niewdrożone” tam, gdzie reguły są wdrożone; wikiBundle zregenerowany istniejącym narzędziem.
BAZA: 38d145144b980c8840fd86c41834aab9bb9b8826 (origin/main)

## ZMIANY-COMMIT

Allowlista: wykonana. Zmienione pliki:
- `gra/src/ui/administratorPanel.ts` — `administratorDismissConfirmText`: dla administratora nie-miejskiego rzeczownik zmieniony z „ulepszeń” na „państwa” (ten sam co nagłówek `titleFor`: „Administrator państwa”). Dla miasta bez zmian („miasta”).
- `docs/encyklopedia/pojecia/zaufanie.md` — nagłówek „Zasady zatwierdzone, jeszcze niewdrożone” → „Zasady z decyzji właściciela 2026-11-13 (wdrożone)”; zdanie w historii hasła dopasowane do nowego nagłówka. Treść zasad (kara za sąsiedztwo −3/−4/−5, religia bez wpływu, 10/20 po rozejmie/pokoju, zaufanie 0 w wojnie) już stwierdzała wdrożenie; nie zmieniano reguł.
- `gra/src/data/wikiBundle.json` — wyłącznie przez `node gra/tools/bundle-wiki-for-game.cjs` (diff: jedna linia JSON, zmiana wpisu Zaufania).
- `gra/tools/ui-text-leftovers-test.cjs` — NOWY test statyczny (A: spójność nagłówek/tekst; B: brak „jeszcze niewdrożone” w sekcji `encyklopedia` bundla, w zaufanie.md i w docs/encyklopedia; C: bundle zawiera nowy nagłówek).
- `dyspozycje/autobot/runs/R-WEB-UI-TEXT-LEFTOVERS-ADMIN-DISMISS-CIVPEDIA-Q1/10-operator-claude.md` — ten raport.

Istniejący `gra/tools/admin-dismiss-confirm-test.cjs` zielony bez zmian (warunki E nadal spełnione).

## TESTY

Wszystkie wyniki z surowego wyjścia tej sesji:
- `npx tsc --noEmit` (projektowe tsc 5.9.3 po `npm ci` w `gra/`): exit 0, 0 błędów.
- Bramki z tabeli §6 R-PROC-AUTOBOT: `logic-test` 213/213; `tech-tree-test` 20 pass 0 fail; `research-test` 33/33; `unit-replace-test` 21/21; `combat-test` 6/6 — wszystkie exit 0.
- `admin-dismiss-confirm-test.cjs`: WSZYSTKO ZIELONE (exit 0).
- `ui-text-leftovers-test.cjs` na zmienionym drzewie: WSZYSTKO ZIELONE (10 PASS, exit 0).
- `ui-text-leftovers-test.cjs` na BAZIE (pliki z 38d14514 podane jako argumenty): FAIL 5 (A2, A3, B1, B2, C1), exit 1 — czerwony na bazie.
- `diplo-civpedia-values-test.cjs`: 129 sprawdzeń, exit 0.
- `civpedia-*` i `pr141-matrix-only-data-wiki-test.cjs`: 11 zielonych, 3 czerwone: `civpedia-budynki-historia-test` (mury.md, 150/1), `civpedia-jednostki-j1-test` i `civpedia-jednostki-j2-test` (jezdziec-chinski, katapulta, taran, wieza-obleznicza: brak sekcji „## Rys historyczny”). Te testy czytają pliki `docs/encyklopedia/budynki|jednostki/*.md` oraz `buildings.json`/`units.json`, których ten temat NIE dotyka (diff nie zawiera tych plików). Uznaję to za zastany stan bazy — NIE_ZMIERZONO na bazie osobno (nie uruchamiałem tych trzech testów na 38d14514; dowód jest pośredni: pliki poza diffem).
- `git diff --check`: czysty (exit 0).

## ZAŁOŻENIA (luki rozstrzygnięte)

1. „3 warianty” w GOAL: kod ma dwa rodzaje panelu (`city` i `improvements`). Nagłówek panelu ulepszeń w grze to już „Administrator państwa” (także przycisk w panelu budowy „Administrator państwa +” i chip w cityPanel). Przyjąłem: tekst okna dopasowuje się do nagłówka, nie odwrotnie. Słowo „ulepszeń” zostaje w opisie skutków („automatyczne ulepszanie terenu”), gdzie dotyczy działania, nie nazwy administratora.
2. Dispatch wskazywał „hasło Model relacji” z nagłówkiem „jeszcze niewdrożone”. W docs/encyklopedia nagłówek o tej treści jest w `pojecia/zaufanie.md` (sekcja „Zasady zatwierdzone, jeszcze niewdrożone”, to zgadza się z TaskList #353). Hasło „Model relacji” z bundla (wiarygodnosc.md) nie zawiera tej frazy — naprawiono sekcję, którą faktycznie zawiera.

## BLOKADY

- POZA ALLOWLISTĄ, NIE RUSZANE: zdanie w `docs/PORADNIK-GRACZA/12-dyplomacja.md` (linia 8): „Sekcje oznaczone „DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku” opisują zasady jeszcze niewdrożone — nie obecny stan gry.” Ta fraza jest w sekcji `poradnik` wikiBundle (22 rozdziały). Test B1 został zawężony do sekcji `encyklopedia` (hasła Civpedii, zgodnie z GOAL), więc jest zielony. Pełne usunięcie frazy z bundla wymaga zmiany poradnika — decyzja orkiestratora (dodać do allowlisty albo osobny temat).
- Zdania „Zasady niewdrożone: DECYZJA WŁAŚCICIELA 2026-11-13” w `pojecia/moc-podzial.md` i `pojecia/respekt.md` oraz „osobna siła wojskowa … to zasada niewdrożona” w hasłach dyplomacji — NIE są dokładną frazą „jeszcze niewdrożone”, więc nie zmieniałem. Wg TaskList #337–#339 i #347 (siła militarna, krok 4b) mogą być nieaktualne; NIE_ZMIERZONO w tym temacie — do weryfikacji w osobnym temacie.
- Test `civpedia-budynki-historia`, `civpedia-jednostki-j1`, `civpedia-jednostki-j2` czerwone (opis w TESTY).

## UWAGI-DLA-ORKIESTRATORA

- Środowisko: worktree nie miał `gra/node_modules`; wykonano `npm ci` w `gra/` (71 pakietów, 2 s). Katalog jest ignorowany przez git, nie jest częścią commita.
- Nie tworzono sesji, tasków, triggerów ani karty „Suggested task”.
- Nie uruchamiano `npm run build/dev`, nie dotykano WERSJE.md, nie użyto `git add -A`.

## RUNDY

1/5. Ostatni werdykt: — (Operator). Decyzja wymagana: brak.

## NASTĘPNY KROK

Evaluator (SONNET): weryfikacja diffu (3 pliki + test), potwierdzenie czerwieni na bazie, decyzja o poradniku (BLOKADY, pozycja 1).

## DEPLOY/PUSH: NIE WYKONANO
