# R-HOTSEAT-ETAP6E-RENDER-Q1 — Evaluator, runda 1

Niezależna weryfikacja raportu Operatora (BLOCK, commit `4513aac9`). Świeże `git diff`/
`grep`/`Read`, świeże uruchomienie bramek — nie streszczenie raportu Operatora.

## Co zweryfikowano niezależnie

1. **`main.ts` faktycznie bez zmian**: `sha256sum gra/src/main.ts` w worktree ==
   `git show 0272c3d2:gra/src/main.ts | sha256sum` (identyczne). Commit Operatora
   dotyka wyłącznie `01-operator-runda1.md` + nowy
   `gra/tools/hotseat-etap6e-render-noop-test.cjs` — zgodnie z allowlistą, brak
   `git add -A`, `git diff --check` czysty.
2. **Wszystkie 27 pozycji recon nadal istnieją, niezmigrowane** — świeży grep
   potwierdza 6 funkcji-rezolwerów (`civTypeForOwner` 3429, `relationColorFn` 3450,
   `unitRingStanceForPlayer` 7970, `portraitForceCultureIcon` 8072,
   `civDisplayNameForOwner` 8081, `cityMapOutlineKindForOwner` 17765) z literałami
   `ownerId===0`/`civTypeForOwner(0)`/`getDiploRelation(0,...)`; `_cityRenderOpts`
   getCiv/getCivIconId/playerOwnerId (2450-2487); `syncWorkerFieldOverlay(...,0)`
   (11732); `refreshTerritoryBorderOverlay` guard `ownerId===0` (11851);
   `syncOkolicaOverlay` guard `city.ownerId!==0` (5372); 4 pozostałe literalne
   `playerOwnerId: 0` w `cityRenderer.sync` (15891/16033/19377/19424) — potwierdzam
   też korektę Operatora: dwie z pierwotnych 6 (24543/24599 wg recon) są dziś
   `playerOwnerId: ME()` (24551/24607), już zmigrowane wcześniej. render/*.ts:
   dokładnie 6 fallbacków (`units.ts:5798,6464`; `cities.ts:656,784,803`;
   `cityOkolicaOverlay.ts:298`) — zgodne z BLOKADĄ (2) Operatora.
3. **TDZ — zreprodukowałem NIEZALEŻNIE, od zera**, poza worktree: skopiowałem
   drzewo, zmieniłem WYŁĄCZNIE `main.ts:2487` (`playerOwnerId: 0`→`playerOwnerId:
   ME()`), zbudowałem `vite build`, odpaliłem headless Chromium. Wynik identyczny
   jak w raporcie: `ReferenceError: Cannot access 'lw' before initialization`,
   `.civ-menu` nigdy się nie pojawia. Potwierdza to mechanizm: `let humanSeats`
   (main.ts~10362, wewnątrz `boot()`) jest w TDZ do swojej deklaracji, a
   `_cityRenderOpts()`/`cityRenderer.sync()` (main.ts:2506) wykonuje się
   bezwarunkowo WCZEŚNIEJ w tym samym przebiegu `boot()`. Diagnoza Operatora jest
   trafna i zweryfikowana od podstaw, nie tylko na słowo.
4. **5 bramek referencyjnych + tsc**: uruchomione świeżo (symlink `node_modules`
   z `/home/user/The-Game/gra`, wzorzec z `.gitignore`) — `tsc --noEmit`: 0 błędów;
   `logic-test` 213/213; `tech-tree-test` 19/19; `research-test` 33/33;
   `unit-replace-test` 13/13; `combat-test` 6/6 — wszystkie zgodne z wartością
   referencyjną §6.
5. **Brak nakładania z 6b**: `git diff e76adba2 HEAD -- gra/src/main.ts` w
   `/home/user/wt-hotseat-etap6b-ui` (6b już Final Control PASS, `bfc3a39a`) — 71
   hunków; baza main.ts 6b (`e76adba2`) i 6e (`0272c3d2`) bajt-identyczne (sha256
   zgodne), więc numery linii porównywalne wprost. Żaden z 71 zakresów hunków nie
   pokrywa się z żadną z 27 pozycji (najbliższe: 17748-17756 vs
   `cityMapOutlineKindForOwner` od 17765 — bez nakładania). 6b nie dotyka
   `render/units.ts`/`cities.ts`/`cityOkolicaOverlay.ts` w ogóle.

## ZARZUT 1

Uruchomiłem scommitowaną bramkę dokładnie tak jak jest w repo:
`node tools/hotseat-etap6e-render-noop-test.cjs` (`HOTSEAT6E_TURNS=2` dla czasu,
mechanizm bez zmian). Wynik: `PRZED vs PO: 2/2 identycznych` (oczekiwane — main.ts
niezmieniony), ALE `PO vs ZEPSUTY: 2/2 identycznych (oczekiwana ROZBIEŻNOŚĆ)` →
`BLOCK: bramka nie wykryła celowo zepsutego isMe() -- test jest tautologiczny` →
`FAIL`, exit 1. Przyczyna: dziś żadne z 27 miejsc render nie wywołuje `isMe()`
(nadal literały), a jedyne realne wywołanie `isMe()` osiągalne w scenariuszu testu
(klik stolicy bez zaznaczonej jednostki, `main.ts:24574 openCityPanelForPlayer`)
nie wpływa na hash liczony wyłącznie ze zrzutu `<canvas>` (panel miasta to HTML
poza canvasem). Nie podważa to diagnozy TDZ (§3 wyżej), ale oznacza, że
scommitowany plik `.cjs` NIE jest dziś demonstracyjnie nietautologiczny — dowód
przywołany w raporcie Operatora (§6: "wykryła prawdziwą różnicę... na pierwszej
próbie") pochodzi z osobnej, skasowanej reprodukcji jednoliniowej, nie z
mechanizmu PRZED/PO/ZEPSUTY zaszytego w pliku. Ktoś, kto odpali tę bramkę w
kolejnej rundzie bez pełnego kontekstu, dostanie mylący sygnał "regresja" zamiast
"oczekiwane, migracja jeszcze nie istnieje" — nagłówek pliku (linie 25-40) o tym
nie ostrzega. Miejsce: `gra/tools/hotseat-etap6e-render-noop-test.cjs`, cała
funkcja `main()`/mechanizm ZEPSUTY (linie 95-109, 420-433).

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6E-RENDER-Q1
GOAL: zgodny z 00-dispatch.md — potwierdzam brak rozjazdu GOAL w raporcie Operatora
TESTY: patrz §1-5 wyżej — wszystkie niezależnie odtworzone, wliczając reprodukcję
TDZ od zera poza worktree
BLOKADY: (1) potwierdzona — TDZ realny, migracja main.ts wymaga prerekwizytu poza
allowlistą; (2) potwierdzona — 6 fallbacków w render/*.ts niemigrowalnych bez
eksportu ME/isMe
RUNDY: 1/5
ZARZUTY: 1 (patrz wyżej — bramka no-op tautologiczna dziś, brak ostrzeżenia w
nagłówku)
NASTĘPNY KROK: Obrona Operatora do zarzutu 1 (R-PROC-AUTOBOT §3c) — decyzja
właściciela o prerekwizycie (przeniesienie/wczesny alias humanSeats/ME/isMe)
pozostaje otwarta niezależnie od zarzutu
DEPLOY/PUSH: NIE WYKONANO
