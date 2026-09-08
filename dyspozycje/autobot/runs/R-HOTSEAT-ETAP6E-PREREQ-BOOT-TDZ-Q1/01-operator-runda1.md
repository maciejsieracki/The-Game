STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1
GOAL: Usunąć blokadę TDZ w `_cityRenderOpts()` (main.ts) wzorcem forward-declare+wire
identycznym z `cityBuiltIdsForRender`/`cityProdForRender`, bez migracji 27 miejsc
kategorii render na `isMe`/`ME()`.

ZMIANY/COMMIT: `gra/src/main.ts`, 3 miejsca:
1. Po `cityProdForRender` (~L2436): forward-declare
   `let meForRender: (() => number) | undefined;` z komentarzem wyjaśniającym wzorzec.
2. W `_cityRenderOpts()`: `playerOwnerId: 0` → `playerOwnerId: meForRender?.() ?? HUMAN_OWNER_PRIMARY`
   (jedyne z 27 miejsc recon 6e fizycznie osiągalne przed pierwszym bezwarunkowym
   `cityRenderer.sync(cities, _cityRenderOpts())` ~L2506 — sprawdzone: `getCiv`/`getCivIconId`
   nie odwołują się do ME/isMe, tylko do `player.civType`; `isCityStateOwner` to alias
   `portraitForceCultureIcon`, nie ME-zależny; `cityFogVisible`/`_visCache` mają już
   istniejący guard TDZ sprzed tego tematu — nie dotknięte).
3. Zaraz po prawdziwej deklaracji `function ME()` (~L10391): `meForRender = ME;`
   (analogicznie do `cityBuiltIdsForRender = ...`/`cityProdForRender = ...` przy L2905-2906).
Zero zmiany zachowania: dziś zawsze `ME() === HUMAN_OWNER_PRIMARY === 0`, fallback
identyczny z dawnym literałem.

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` (worktree bez `node_modules` —
  symlink do `/home/user/The-Game/gra/node_modules`, lockfile identyczny, zweryfikowane
  diffem) → 0 błędów.
- `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir` → sukces,
  887 modułów, build OK.
- ŻYWY Chromium (Playwright, `/opt/pw-browsers/chromium-1194`, serwowane przez
  `python3 -m http.server` z katalogu builda): brak `pageerror`, brak `ReferenceError`
  w konsoli, menu główne renderuje się poprawnie ("ROZPOCZNIJ GRĘ", "KONTYNUUJ",
  "WERSJA 0.9" itd. w treści strony). Jedyny wpis konsoli to nieszkodliwe `404` dla
  zasobu (favicon/font), niezwiązane z tematem. To DOKŁADNIE reprodukcja z
  `02-evaluator-runda1.md` Etapu 6e (`playerOwnerId: 0` → coś czytającego `ME()`),
  zaaplikowana teraz jako trwała infrastruktura zamiast punktowej łatki testowej.
- 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19,
  `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 —
  wszystkie zielone, zgodne z wartościami referencyjnymi z R-PROC-AUTOBOT.md §6.

BLOKADY: brak.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator — weryfikacja niezależna (świeży build + Chromium), potwierdzenie
że tylko `playerOwnerId` było osiągalne przed L2506 z 27 miejsc recon 6e, kontrola
allowlisty i `git diff --check`.
DEPLOY/PUSH: NIE WYKONANO
