# P-BRAMKI-BUDYNKI-DWIE-CZERWONE-ZASTANE-Q1 — dispatch

TEMAT: `P-BRAMKI-BUDYNKI-DWIE-CZERWONE-ZASTANE-Q1`
RUNDA: 1/5
DOMAIN: INFRA (podejrzenie: bramki opisujące nieaktualny stan — POTWIERDŹ, nie zakładaj;
możliwy realny defekt prereq/łańcuchów ulepszeń, traktuj ostrożniej niż typową naprawę testu)
ŚCIEŻKA: A (Workflow)
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a; nie wizualny).

## GENEZA

Znalezisko Final Control tematu `R-BUDYNEK-GARNIZON-NOWY-Q1` (2026-09-06, mutacja FC7):
`gra/tools/prereq-budynkow-test.cjs` (51/8) i `gra/tools/upgrade-budynki-test.cjs` (48/1) są
czerwone i ŻADNA z trzech rund tematu Garnizonu tego nie zgłosiła, mimo że obie leżą w rodzinie
budynków.

**Dowód pre-istnienia (FC7, mutacja Final Control):** usunięcie całego rekordu `garnizon` z
`buildings.json` zostawia obie bramki BEZ ZMIANY — `prereq` nadal 51/8, `upgrade` nadal 48/1.
Czyli zero związku z Garnizonem — te 9 faili istniały przed tym tematem i niezależnie od niego.

## GOAL

1. Uruchom obie bramki, przeczytaj DOKŁADNĄ treść każdej z 9 failujących asercji (8 w
   `prereq-budynkow-test.cjs`, 1 w `upgrade-budynki-test.cjs`) — nie zgaduj, przeczytaj log.
2. Dla KAŻDEJ z 9 asercji ustal, czy failuje bo:
   (a) opisuje stary stan `buildings.json`/kodu prereq, który się legalnie zmienił od
   napisania bramki (kategoria „test podążający za już wdrożoną zmianą",
   `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` §3b, bez ABC-first) — wtedy przekotwicz na aktualny
   stan, zachowując SEMANTYKĘ sprawdzenia;
   (b) ujawnia REALNY defekt w łańcuchach prerequisite/upgrade budynków (np. budynek odblokowuje
   się bez wymaganego poprzednika, albo łańcuch ulepszeń jest przerwany/niespójny) — to NIE jest
   naprawa testu, to możliwa regresja mechaniki.
3. Napraw WYŁĄCZNIE kategorię (a). Dla KAŻDEJ asercji w kategorii (b) — **STOP,
   DECISION_REQUIRED** z pełnym opisem: która asercja, co dokładnie sprawdza, jaki jest
   rzeczywisty stan danych/kodu, dlaczego to wygląda na realny defekt a nie stary test.
4. Możliwe, że część z 9 asercji jest (a), a część (b) — traktuj każdą osobno, nie zakładaj że
   wszystkie mają tę samą przyczynę.

## BINARNE KRYTERIUM SUKCESU

- `node tools/prereq-budynkow-test.cjs` → 59/59 (dziś 51/8) I/LUB
  `node tools/upgrade-budynki-test.cjs` → 49/49 (dziś 48/1) — **WYŁĄCZNIE dla asercji
  jednoznacznie kategorii (a)** — LUB jawny `DECISION_REQUIRED` per-asercja dla każdej
  kategorii (b)/niepewnej.
- **Zakaz osłabiania i usuwania asercji** — liczba całkowita (pass+fail) nie może spaść w
  żadnej z dwóch bramek.
- Zero zmian w `gra/src/**`/`gra/data/**` w tej rundzie (naprawa kodu/danych wymaga osobnej
  decyzji, jeśli okaże się że to (b) — nie naprawiaj samodzielnie nawet gdy wydaje się oczywiste).
- `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
  unit-replace-test, combat-test) zielone.

## ALLOWLISTA

- `gra/tools/prereq-budynkow-test.cjs`
- `gra/tools/upgrade-budynki-test.cjs`
- `dyspozycje/autobot/runs/P-BRAMKI-BUDYNKI-DWIE-CZERWONE-ZASTANE-Q1/**`

Zakazane bezwzględnie: `gra/src/**` (diagnoza TAK, zmiana kodu wymaga DECISION_REQUIRED),
`gra/data/**` (diagnoza TAK, zmiana danych wymaga DECISION_REQUIRED), pliki z sekretami,
`docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/**`,
`ROBOCZA-MANIFEST.json`, `playbook.json`. Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-bramki-budynki-dwie`, gałąź
`autobot/P-BRAMKI-BUDYNKI-DWIE-CZERWONE-ZASTANE-Q1`, baza jawnie `origin/main` (commit
`3f06cba6` w chwili założenia, może być nowszy przy starcie pracy — potwierdź `git log -1`
PRZED pracą, SS2b).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki budynków w tej rundzie — to jest zadanie diagnostyczne + ewentualna
  naprawa TYLKO dwóch testów.
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Każda niepewność co do stanu kodu/danych produkcyjnych → DECISION_REQUIRED, nigdy zgadywanie.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
