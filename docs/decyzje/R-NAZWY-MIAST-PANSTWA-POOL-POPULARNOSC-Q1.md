# R-NAZWY-MIAST-PANSTWA-POOL-POPULARNOSC-Q1 — wspólna kolejka nazw

**Data zapisu:** 2026-09-15
**Status:** `OWNER DECISION A+C — IMPLEMENTACJA ZINTEGROWANA LOKALNIE / READY_FOR_DEPLOY`
**Domena:** `GAME`
**Implementacja tej specyfikacji:** `ZINTEGROWANO LOKALNIE; commit baa7c3ef; BRAK PUSHU I DEPLOYU`
**Projekt/board:** `p_9ae9ac64` / `the-game-real24` / profil `default`

## Obowiązująca zasada rosteru

Na mapie nadal nie można wybrać dwóch cywilizacji tego samego typu. Właściciel
pozostawił ten limit bez zmian. Ta implementacja nie zmienia wyboru cywilizacji,
liczby typów ani spawnu rosteru.

## Obowiązująca zasada nazw

1. `miasta_cywilizacji[0..109]` jest jedną uporządkowaną kolejką 110 nazw dla
   jednego `ikonaId`. Dane źródłowe nie zostały przestawione ani zmienione;
   `civs.json.nazwyMiast` pozostaje lustrem tej kolejki.
2. Stolica, miasto-państwo, stolica obcego klastra, founding gracza, founding AI
   oraz podgląd startu pobierają pierwszy wolny wpis tej samej kolejki.
3. Zajęte nazwy są odtwarzane z żywych `City.name`, po typie cywilizacji
   (`civTypeForOwner`). Nie ma osobnego kursora do utrwalania w save/load;
   wczytanie stanu rekonstruuje kolejkę z zapisanych nazw miast.
4. Caller dodaje nazwę do zbioru dopiero po udanym utworzeniu miasta. Nieudana
   próba nie zużywa pozycji kolejki.
5. Po wyczerpaniu wszystkich 110 pozycji wybierana jest pierwsza baza z
   kolizyjnie bezpiecznym suffixem: `Ateny II`, następnie `Ateny III` itd.;
   zajęte suffixy i nazwy obecne w kolejce są pomijane.
6. Jedno miasto ma jedną nazwę w obrębie kolejki swojej cywilizacji. Dawny
   podział `100` nazw founding + `10` nazw państw-miast pozostaje tylko
   kompatybilnym widokiem danych, nie osobnym alokatorem.

## Zakres implementacji

- `gra/src/game/city-names-pool.ts` — kanoniczny first-free, zbiór żywych
  nazw, wspólna pula i bezpieczny overflow suffixów.
- `gra/src/game/civ-names.ts` — wspólna semantyka dla stolicy, państwa-miasta,
  founding i fallbacków bez eksportu puli.
- `gra/src/map/cluster-spawn.ts` — nazwanie stolic i miast obcych klastrów
  jedną kolejką per cywilizacja.
- `gra/src/game/start-preview.ts` — podgląd konsumuje tę samą kolejność co
  runtime.
- `gra/src/main.ts` — player founding, AI founding, deferred city-state/foreign
  spawn oraz etykiety korzystają z żywych `City.name`.
- Testy allowlisty: `city-names-pool-test.cjs`, `civ-names-test.cjs`,
  `start-preview-test.cjs`, `shared-city-name-queue-test.cjs` oraz bounded
  assertion w `cluster-start-test.cjs`.

## Weryfikacja recovery Operatora

Karta `t_e0c1e240`, run `337`, zachowała istniejący partial diff i wykonała
wyłącznie bounded gates:

- `node tools/city-names-pool-test.cjs` — `123 passed, 0 failed`;
- `node tools/civ-names-test.cjs` — `109 passed, 0 failed`;
- `node tools/start-preview-test.cjs` — `6 passed, 0 failed`;
- `node tools/shared-city-name-queue-test.cjs` — `10 passed, 0 failed`;
- `npx tsc --noEmit` — exit `0`;
- `git diff --check` — exit `0`.

## Granice i następna bramka

Final Control `t_521cda84` / run `347` potwierdził `PASS-WITH-NOTES` bez
ponumerowanych zarzutów. Integracja Orkiestratora została wykonana w czystym
worktree od `origin/main` `30409fdb` jako commit `baa7c3ef`. Po integracji
przeszły focused cluster-plan `6/6`, city pool `9/9`, civ names `109/109`,
start preview `6/6`, shared queue `10/10`, `tsc --noEmit` oraz build Vite.
Pełny map-gen harness przekroczył bounded limit (`INFRA-043`), ale jego szybki
contract test przeszedł; zmiana nie dotyka generatora geometrii. Push i deploy
pozostają osobną bramką.

## Kanban / proweniencja

```text
Pierwotny Operator: t_7a01b0bf / run 308 — TIMEOUT
Recovery Operator:  t_c375f3d9 / run 317 — DECISION_REQUIRED
Operator recovery:  t_e0c1e240 / run 337 — PASS-WITH-NOTES
```

Historyczny raport recovery pozostaje bez zmian:
`dyspozycje/autobot/runs/R-NAZWY-MIAST-PANSTWA-POOL-POPULARNOSC-Q1/recovery-r1/recovery-report.md`.
