STATUS: PASS
DOMAIN: INFRA
TEMAT: P-HOTSEAT-ETAP7-FIXTURE-BUMP-Q1
GOAL: Naprawić fixture'y `barb-camp-blacklist-test.cjs` i `fsa-autosave-test.cjs` do
formatu zapisu v3, bez zmian w `gra/src/**`.

BAZA: zweryfikowano świeżo — `origin/main` przesunął się na `3070c777` (dispatch
podawał `e9837db6`), ale `SAVE_VERSION=3` i strażnik `if (ver < 3) throw
IncompatibleSaveFormatError` (`gra/src/game/save.ts`) są niezmienione od integracji
`R-HOTSEAT-ETAP7-SAVELOAD-Q1`. Oba testy na świeżej bazie dawały dokładnie te same
2 usterki co w dispatchu: `barb-camp-blacklist-test.cjs` crashował
(`IncompatibleSaveFormatError: wersja 1`, wyjątek nieobsłużony w teście, nie FAIL
asercji), `fsa-autosave-test.cjs` miał 2/55 FAIL na fixturze `wersja:2`. Problem
potwierdzony jako czysty fixture, nie regres.

DIAGNOZA: `deserializeGame()` rzuca `IncompatibleSaveFormatError` dla KAŻDEGO
`wersja < 3` (ABC-4: brak migracji v2→v3), więc fixture'y z `wersja:1`/`wersja:2`
przekazywane bezpośrednio do `deserializeGame` (nie przez `serializeGame`, który
sam nadpisuje `wersja` na `SAVE_VERSION`) muszą crashować.

ZMIANY:
- `gra/tools/barb-camp-blacklist-test.cjs` (sekcja 3, save/load): oba obiekty
  zapisu zmienione na `wersja:3` + `gracze:[]`/`exploredByHuman:[]`/
  `humanOwnerIds:[0]`/`activeHumanOwnerId:0` zamiast `gracz`/`explored`. Test
  „stary zapis bez blacklisty" przeformułowany na „ważny zapis v3 bez OPCJONALNEGO
  pola `clearedBarbCampHexes`" (ta sama semantyka: bezpieczny default, nie
  wymyślanie zablokowanych heksów) — bo dosłowny „stary zapis" (`wersja<3`) już
  nie ładuje się wcale. Dodana NOWA asercja: `wersja:2` faktycznie rzuca
  `IncompatibleSaveFormatError` (pokrywa nowe zachowanie ABC-4, nie tylko usuwa
  stary przypadek).
- `gra/tools/fsa-autosave-test.cjs`: 3 literały zapisu (`fsaRotatingAutosaveWrite`
  payload, `civ-autosave-3.json`, `civ-autosave-7.json`) przestawione z
  `wersja:1/2` + `explored:[]` na `wersja:3` + `gracze`/`exploredByHuman`/
  `humanOwnerIds`/`activeHumanOwnerId`, te same `tura`/`seed`/`meta`.

TESTY:
- `node tools/barb-camp-blacklist-test.cjs`: 19 passed, 0 failed (wcześniej: crash).
- `node tools/fsa-autosave-test.cjs`: 55 pass, 0 fail (wcześniej: 53 pass, 2 fail).
- Nietautologiczność (świadome zepsucie → cofnięcie):
  - `save.ts` `if (ver < 3)` → `if (ver < 0)`: barb-test 16 passed / 1 FAILED
    (nowa asercja IncompatibleSaveFormatError poprawnie czerwienieje). Cofnięte,
    diff czysty, ponownie 19/0.
  - `save.ts` `tura: typeof obj.tura...` → `tura: 1`: fsa-test 54 pass / 1 FAIL
    (asercja `tura=42` poprawnie czerwienieje). Cofnięte, diff czysty, ponownie
    55/0.
  - Istniejący mutation-guard sekcji 5 `barb-camp-blacklist-test.cjs`
    (spawn/destroy blacklist w `barbarians.ts`/`main.ts`) działał bez zmian —
    nie dotyczy fixture'ów sekcji 3, więc nie wymagał aktualizacji.
- `node ./node_modules/typescript/bin/tsc --noEmit`: 0 błędów.
- 5 bramek referencyjnych (z `gra/`): `logic-test.cjs` 213/213,
  `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs`
  13/13, `combat-test.cjs` 6/6 — wszystkie zgodne z wynikiem referencyjnym
  §6 R-PROC-AUTOBOT.md.

UWAGA TECHNICZNA (bez zmiany w allowliście): worktree nie miał `gra/node_modules`
(gitignored, nie dziedziczone per-worktree) — dowiązany symlink do
`/home/user/The-Game/gra/node_modules` (ten sam `package-lock.json`, `cmp`
potwierdził identyczność) wyłącznie na potrzeby uruchomienia testów/`tsc` w tej
sesji; symlink jest ignorowany przez `.gitignore`, nic z niego nie trafia do
commita.

BLOKADY: brak.
RUNDY: 1/5
ZMIANY/COMMIT: `git diff --stat` = wyłącznie 2 pliki z allowlisty
(`gra/tools/barb-camp-blacklist-test.cjs`, `gra/tools/fsa-autosave-test.cjs`),
zero zmian w `gra/src/**`. Commit do wykonania zaraz po tym raporcie.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
