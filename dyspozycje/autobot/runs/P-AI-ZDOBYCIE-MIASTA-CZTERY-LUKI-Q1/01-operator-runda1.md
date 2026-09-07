# P-AI-ZDOBYCIE-MIASTA-CZTERY-LUKI-Q1 — Operator, runda 1

## ZMIANY

Wyłącznie `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs`:

- **FC-N2** — nowy blok K9: `targetVisible=false` liczony z REALNEJ `aiCityCaptureAllowed`
  na pustym zbiorze widocznych heksów (mgła) musi blokować ruch/przejęcie w egzekutorze
  (K9a-d). Dowód mutacyjny K9e/f: mutant `MUT-8` (pole `opts.targetVisible` w
  `canEnterEmptyCity` podmienione na sztywne `true`) faktycznie PRZEŁAMUJE mgłę —
  `captured` zmienia się z `false`→`true`, `ownerId` z 2→1. Bez tej zmiany bramka nie
  miała ŻADNEJ asercji z niepełną widocznością (K1-K8 zawsze liczą świat w pełni widoczny).
- **FC-N1** — komentarz dokumentacyjny przy `K4-DYSTANS`: mutacja bramki adiacencji jest
  tu tautologiczna, realne pokrycie leży w `city-hex-movement-test.cjs` (12/13) i
  `ai-city-capture-integration-test.cjs` (10/14). Zero zmiany logiki/wyniku asercji.
- **FC-N4** — nowe asercje A5i/A5j: podmiana `isCivilianUnit` na atrapę zwracającą
  string-sentinel (`FC-N4-ATRAPA-CYWIL`/`-WOJSKO`) i sprawdzenie, że wynik wykonania
  wyrażenia z main.ts to dokładnie ten sentinel — kopia formuły zwróciłaby zawsze
  `true`/`false`, nigdy sentinel atrapy. Dowodzi, że A5f-A5h opierają się na PRZEKAZANEJ
  funkcji, nie na behawioralnie równoważnej kopii.
- **F4** — wypisanie wyniku końcowego (`console.log(fail ? ... : ...)`) opakowane w
  try/catch; przy crashu komunikat diagnostyczny trafia na stderr zamiast zniknąć.
  Exit code bez zmian (`process.exit(fail ? 1 : 0)` poza blokiem try).

## TESTY

- `node tools/ai-zdobycie-miasta-adiacencja-test.cjs` → **96/96 OK** (było 88/88; +8: A5i,
  A5j, K9a-K9f). Zero asercji usuniętych/osłabionych.
- Dowód mutacyjny FC-N2 zweryfikowany ręcznie w trakcie pracy: pierwsza wersja K9 miała
  wczesny bail-out w harnessie MASKUJĄCY mutację MUT-8 (K9e/f fałszywie czerwone —
  `got false, want true`); poprawiono usuwając pre-check harnessu, tak by mutacja objawiała
  się przez WŁASNĄ bramkę egzekutora na `opts.targetVisible`, nie przez duplikat sprawdzenia
  w teście. Po poprawce: REAL blokuje (K9a-d zielone), MUT-8 przełamuje (K9e/f zielone,
  bo dowodzą że MUT-8 faktycznie zmienia wynik).
- `node tools/city-hex-movement-test.cjs` → 13/13 (niezmieniony, kontrolnie).
- `node tools/ai-city-capture-integration-test.cjs` → 14/14 (niezmieniony, kontrolnie).
- `npx tsc --noEmit` → czysto.
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test`
  33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone.
- `git diff --check` → czysto.

## BLOKADY

Brak. Żadne ze znalezisk nie wymagało zmiany `gra/src/**`.

## RUNDY

1/5.

## NASTĘPNY KROK

Evaluator.

## DEPLOY/PUSH

NIE WYKONANO.
