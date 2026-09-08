# R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1 — Final Control, runda 1

Niezależna weryfikacja: świeży diff, świeży tsc, świeży vite build, własny headless
Chromium (Playwright), własna kontrola negatywna, własne 5 bramek referencyjnych,
kontrola nakładania z równoległymi lanami.

## Co zweryfikowano

1. **`git diff --stat 302b6a96`**: WYŁĄCZNIE `gra/src/main.ts` (+14/-1) poza raportami
   Operatora/Evaluatora. Pełny `git diff` odczytany bajt po bajcie: forward-declare
   `let meForRender: (() => number) | undefined;` (blok obok `cityBuiltIdsForRender`/
   `cityProdForRender`, ~L2438-2444), `playerOwnerId: meForRender?.() ?? HUMAN_OWNER_PRIMARY`
   (było `playerOwnerId: 0`, ~L2494), `meForRender = ME;` zaraz po prawdziwej deklaracji
   `function ME()` (~L10391-10396). Wzorzec identyczny z istniejącym
   `cityBuiltIdsForRender`/`cityProdForRender`. Zero migracji pozostałych 26 miejsc recon
   6e — `getCiv`/`getCivIconId`/`isCityStateOwner` niezmienione. `HUMAN_OWNER_PRIMARY = 0`
   (`game/human-owners.ts:21`) potwierdzone — fallback = dzisiejszy literał, zero zmiany
   zachowania. `git diff --check` czysty.
2. **`tsc --noEmit`** (świeże uruchomienie, worktree z symlinkiem `node_modules`): 0 błędów.
3. **`vite build`** (świeży build do katalogu poza repo): sukces, 887 modułów.
4. **Żywy Chromium (Playwright, `/opt/pw-browsers/chromium-1194`, serwowane przez lokalny
   HTTP server)** na builcie z fixem: zero `pageerror`, zero `console.error` poza
   niegroźnym 404 zasobu; DOM zawiera pełny HUD gry (Skarbiec/Praca/Spichlerz/Nauka/
   Armia/Miasta/CIVPEDIA/MENU/ZAKOŃCZ TURĘ, "TURA 1 · 4000 P.N.E."). Boot bez śladu TDZ.
5. **Własna kontrola negatywna** (niezależna od Evaluatora): nowy detached worktree na
   bazie `302b6a96` (SPRZED fixu), ręczna podmiana WYŁĄCZNIE `main.ts:2487`
   `playerOwnerId: 0` → `playerOwnerId: ME()` (bez forward-declare), świeży `vite build`,
   świeży Chromium → realnie odtworzony `[TheGame] FATAL: ReferenceError: Cannot access
   'ew' before initialization`. Potwierdza: (a) test faktycznie wykrywa TDZ, (b) fix
   Operatora go usuwa — nie fałszywie-zielona bramka. Worktree tymczasowy usunięty po teście.
6. **5 bramek referencyjnych** (świeże uruchomienie na worktree z fixem): `logic-test`
   213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13,
   `combat-test` 6/6 — identyczne z raportami Operatora i Evaluatora.
7. **Brak nakładania z równoległymi lanami**: `wt-hotseat-etap6c-economy` (branch
   `R-HOTSEAT-ETAP6C-ECONOMY-Q1`) ma niezacommitowane zmiany w `main.ts` wyłącznie
   w regionach L1986/2168/3463/7554/7722/29091-30852 — poza regionem tego tematu
   (~2400-2520, ~10380-10400). `wt-hotseat-etap7-saveload` (branch
   `R-HOTSEAT-ETAP7-SAVELOAD-Q1`) ma dotąd tylko 1-liniową zmianę w `main.ts:7554`
   (`isAiOwner` filter) — również poza regionem tego tematu. Zero konfliktu.

STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1
GOAL: zgodny z `00-dispatch.md` — czysta infrastruktura forward-declare usuwająca TDZ
w `_cityRenderOpts()`, zero migracji 27 miejsc kategorii render, zero zmiany zachowania.
TESTY: tsc czysty; vite build OK (887 modułów); żywy Chromium bez pageerror/ReferenceError,
HUD gry renderuje się poprawnie; własna kontrola negatywna (baza 302b6a96 + ręczna podmiana
`playerOwnerId: 0`→`ME()` bez fixu) realnie odtwarza `ReferenceError: Cannot access 'ew'
before initialization`; 5/5 bramek referencyjnych zielonych (213/213, 19/19, 33/33, 13/13,
6/6); `git diff --check` czysty; brak nakładania z `R-HOTSEAT-ETAP6C-ECONOMY-Q1` i
`R-HOTSEAT-ETAP7-SAVELOAD-Q1`.
BLOKADY: brak
RUNDY: 1/5
WERDYKT KOŃCOWY: PASS — diff ograniczony wyłącznie do allowlisty (region `_cityRenderOpts()`
+ punkt podpięcia po `ME()`), wzorzec forward-declare bajt-identyczny z istniejącym
`cityBuiltIdsForRender`/`cityProdForRender`, fallback = dzisiejszy literał (zero zmiany
zachowania), własna niezależna reprodukcja żywym Chromium potwierdza zarówno naprawę jak
i trafność testu (kontrola negatywna crashuje identycznym błędem na bazie sprzed fixu),
5 bramek referencyjnych zielonych, zero nakładania z równoległymi lanami 6c i 7. Gotowe
do integracji.
NASTĘPNY KROK: integracja przez orkiestratora → wznowienie `R-HOTSEAT-ETAP6E-RENDER-Q1`
na tej samej gałęzi/ID (bez blokady TDZ).
DEPLOY/PUSH: NIE WYKONANO
