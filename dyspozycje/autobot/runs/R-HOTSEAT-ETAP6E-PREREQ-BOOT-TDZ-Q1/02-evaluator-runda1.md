# R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1 — Evaluator, runda 1

Niezależna weryfikacja: świeży `git show`/diff, świeży `tsc`, świeży `vite build`,
własny headless Chromium (Playwright), własne 5 bramek referencyjnych.

## Co zweryfikowano

1. **Diff commitu `b41f1172`**: dokładnie 14 wstawień/1 usunięcie w `gra/src/main.ts`
   (+ nowy `01-operator-runda1.md`) — forward-declare `let meForRender: (() => number)
   | undefined;` (L2444, w bloku z `cityBuiltIdsForRender`/`cityProdForRender`),
   `playerOwnerId: meForRender?.() ?? HUMAN_OWNER_PRIMARY` (L2494, było `playerOwnerId: 0`),
   `meForRender = ME;` zaraz po `function ME()` (L10396). Wzorzec bajt-identyczny
   z istniejącym `cityBuiltIdsForRender`. `HUMAN_OWNER_PRIMARY === 0` (`game/human-owners.ts:21`)
   — fallback identyczny z dawnym literałem `0`, zero zmiany zachowania potwierdzone czytaniem.
2. **Allowlist/git diff --check**: czyste; tylko `main.ts` + własny raport dotknięte,
   brak `git add -A`, `git status` czysty po commicie Operatora.
3. **Brak migracji pozostałych 26 miejsc**: `getCiv`/`getCivIconId`/`isCityStateOwner`
   w `_cityRenderOpts()` nadal na literale `ownerId === 0` / `portraitForceCultureIcon` —
   niezmienione, zgodnie z zakresem tematu.
4. **`tsc --noEmit`**: czysty (0 błędów), świeże uruchomienie (symlink `node_modules`
   z `/home/user/The-Game/gra`, zgodnie z `.gitignore`).
5. **`vite build`**: OK, single-file bundle wygenerowany.
6. **Reprodukcja Chromium (Playwright, headless) — DWIE gałęzie porównawcze**:
   a) commit Operatora `b41f1172`: boot czysty, log sekwencyjny (`mapGen`→`buildScene`→
   HUD), `.civ-menu`/HUD obecne w DOM, **zero** `[TheGame] FATAL`, zero `pageerror`.
   b) kontrola negatywna: skopiowałem bazę `302b6a96` (przed fixem), zmieniłem WYŁĄCZNIE
   `main.ts:2487` `playerOwnerId: 0`→`playerOwnerId: ME()` (dokładna reprodukcja
   jednoliniowa z `R-HOTSEAT-ETAP6E-RENDER-Q1/02-evaluator-runda1.md`), zbudowałem,
   uruchomiłem — realnie odtworzyłem `[TheGame] FATAL: ReferenceError: Cannot access
   'ew' before initialization` (app łapie wyjątek własnym handlerem, stąd nie leci jako
   `pageerror`, tylko `console.error` — pierwsze podejście z filtrem tylko na `pageerror`
   to przeoczyło, poprawiłem test). Kontrola negatywna potwierdza, że test faktycznie
   wykrywa TDZ, a fix Operatora go usuwa.
7. **5 bramek referencyjnych**, świeże uruchomienie: `logic-test` 213/213,
   `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13,
   `combat-test` 6/6 — identyczne z raportem Operatora.

STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1
GOAL: zgodny z 00-dispatch.md — czysta infrastruktura forward-declare, zero migracji
27 miejsc render, zero zmiany zachowania (fallback = dotychczasowy literał 0/HUMAN_OWNER_PRIMARY)
TESTY: tsc czysty; vite build OK; headless Chromium — build Operatora bez FATAL/pageerror,
kontrola negatywna (jednoliniowa reprodukcja bez fixu) faktycznie crashuje identycznym
`ReferenceError` co potwierdza trafność testu; 5/5 bramek referencyjnych zielonych
(213/213, 19/19, 33/33, 13/13, 6/6)
BLOKADY: brak
RUNDY: 1/5
ZARZUTY: brak
NASTEPNY KROK: Final Control (Ścieżka A) → integracja → wznowienie
R-HOTSEAT-ETAP6E-RENDER-Q1 na tej samej gałęzi bez blokady TDZ
DEPLOY/PUSH: NIE WYKONANO
