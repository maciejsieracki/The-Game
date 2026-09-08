# R-HOTSEAT-ETAP6E-RECON-RENDER-Q1 — Evaluator, runda 1

Niezależna weryfikacja: świeży `grep`/`Read` `render/*.ts` i `main.ts` w
`/home/user/wt-hotseat-etap6e-recon`, oraz `git status`/`git diff` w
`/home/user/wt-hotseat-etap6a-input`.

## Potwierdzone bez zastrzeżeń
- `render/camera.ts`: `grep -n "owner"` → 0 trafień, 309 linii — twierdzenie planu
  i Operatora POTWIERDZONE.
- 6 funkcji-rezolwerów main.ts (linie i liczba hardkodów per funkcja) — zweryfikowane
  `Read` co do linii i treści, zgodne 1:1 z tabelą Operatora (9 hardkodów łącznie).
- `_cityRenderOpts()` (2449-2500 dziś) — pełny `Read` obiektu potwierdza DOKŁADNIE
  3 literały (`getCiv`, `getCivIconId`, `playerOwnerId: 0`), reszta pól to czyste
  przekazanie `ownerId` do już policzonych rezolwerów. Zgodne z Operatorem.
- `syncWorkerFieldOverlay(...,0)` (11724) i `refreshTerritoryBorderOverlay` domknięcie
  (11844) — zweryfikowane, zgodne.
- `render/units.ts:6464 setSelectionHex(..., ownerId = 0)` — zweryfikowane: wszystkie
  6 wywołań w `main.ts` (5817/5959/11207/23496/27625/33748) podają jawny `ownerId`,
  default rzeczywiście martwy.
- Wykluczenie 5 „akcesorów" 6c (`civKeyForOwnerId`, `civBonusyForOwnerId`,
  `unlockedTechsForOwner`, `civKeyForOwner`, `civLabelForOwner`) z sumy render —
  zweryfikowane `grep` w `render/*.ts`: zero użyć; ich odbiorcy to HTML medalion
  (`unitOwnerMedallionHtml`), panel ekonomii miasta i `__eraTestDebug` — nie render.
- `civKolorHexFn`/`civColorFn` — potwierdzone jako czyste przekaźniki bez własnego
  hardkodu.
- Alias `ME()`: 21 użyć w bazowym `main.ts` — zgodne z Operatorem.
- 6a worktree: `isMe()` rzeczywiście nie istnieje w bazowym `main.ts`, istnieje tylko
  w `wt-hotseat-etap6a-input` (main.ts:10390, blisko podanej linii 10386). Migracja
  klików (`panelCity.ownerId===0` itd.) na `isMe()` faktycznie już wykonana w 6a i
  faktycznie nie pokrywa się z żadną z 16 pozycji Operatora — potwierdzone `grep`.
  `setSelectionHex` w 6a nadal dostaje dynamiczny `u.ownerId` — brak konfliktu.

## ZARZUTY

1. **Regex w §2 dla `render/*.ts` jest ślepy na hardkody spoza wzorca `===`/`!==`
   — dokładnie ten sam kształt błędu co C-031 z CLAUDE.md.** Operator użył
   wyłącznie `grep -rn "ownerId\s*(===|!==)\s*0" gra/src/render/` i na tej
   podstawie stwierdził: „Reszta `render/*.ts` jest już sparametryzowana". Fałsz —
   świeży `grep -rnE "(ownerId|playerOwnerId)\s*(=|\?\?)\s*0\b" gra/src/render/*.ts`
   znajduje 4 DODATKOWE, pominięte miejsca w `render/*.ts` (nie main.ts):
   - `render/cities.ts:656` — `applyFogVisibility(vis, fogOn, playerOwnerId = 0)`
     (domyślny parametr eksportowanej metody `cityRenderer`).
   - `render/cities.ts:784` — `options?.playerOwnerId ?? 0` (fallback w
     `_buildBadgeInput`, zasila `isPlayerCity = city.ownerId === playerId`).
   - `render/cities.ts:803` — analogiczny `options?.playerOwnerId ?? 0` (druga
     kopia tej samej logiki, inna funkcja tego samego pliku).
   - `render/cityOkolicaOverlay.ts:298` — `params.ownerId ?? 0`, gdzie
     `ownerId?: number` w `CityOkolicaOverlayParams` (linia 58) jest jawnie
     OPCJONALNY — to nie martwy kod z definicji typu, to realny fallback API.
   Dziś wszystkie 4 są faktycznie nieaktywne (main.ts zawsze podaje jawny `ME()`/
   `city.ownerId`), więc ta sama kategoria co policzony przez Operatora martwy
   default `units.ts:6464` — ale Operator POLICZYŁ tamten i POMINĄŁ te cztery,
   mimo identycznej natury. To podważa kompletność §2 i sumę 16.

2. **Pominięta bramka renderu w `main.ts` — `syncOkolicaOverlay()`.** Linia 5372:
   `if (!city || city.ownerId !== 0) { disposeOkolicaOverlay(); return; }` —
   dosłownie gałąź decydująca, czy `syncCityOkolicaOverlay(scene, ...)` (funkcja
   `render/cityOkolicaOverlay.ts`, dodaje/usuwa grupę do sceny 3D) w ogóle się
   wykona. Strukturalnie identyczna do `refreshTerritoryBorderOverlay` (11844),
   którą Operator POLICZYŁ jako pozycję B5 — ta, mimo analogicznej roli
   (bramka widoczności overlayu renderu po `ownerId`), nie znalazła się w
   inwentarzu. Razem z zarzutem 1 pokazuje, że lista 16 nie jest kompletna, a
   rozliczenie „16, zgodne z ~15" nie stoi na solidnym gruncie — realna liczba to
   co najmniej ~21, przy niewykluczonym ryzyku kolejnych przeoczeń (main.ts ma
   276 surowych wystąpień `ownerId === 0`/`!== 0`, nie wszystkie skrzyżowane z
   grafem wywołań renderu poza funkcjami już znanymi z planu/6b/6c/6d).

3. **Nieścisłe uzasadnienie wykluczenia `computePotegaComponents`.** Operator
   pisze, że funkcja „liczy panel Mocy HUD (DOM, nie render)" — świeży
   `grep -rn "computePotegaComponents" gra/src/` znajduje WYŁĄCZNIE definicję
   (main.ts:14952), zero wywołań gdziekolwiek w kodzie. Funkcja jest dziś
   martwa/nieużywana, nie zasila żadnego panelu HUD. Sam wynik wykluczenia
   (nie należy do render) zostaje słuszny, ale podana przyczyna jest fałszywa —
   drobna nieścisłość, niska waga, ale przy trzecim już takim „uzasadnieniu przez
   analogię bez `grep` na callera" w tym raporcie (patrz zarzuty 1-2) staje się
   wzorcem, nie przypadkiem.

4. **Nieprecyzyjny opis stanu roboczego 6a — „NIEZACOMMITOWANE" jest fałszywe.**
   §6 raportu Operatora: „`git status`/`git diff` w
   `/home/user/wt-hotseat-etap6a-input` ... pokazuje NIEZACOMMITOWANE zmiany w
   `gra/src/main.ts` i `gra/src/game/army-cycle.ts`". Niezależne sprawdzenie:
   `git status` w tym worktree zwraca „nothing to commit, working tree clean" —
   zmiany są already ZACOMMITOWANE lokalnie (commit `621f353a`, „migracja 42
   miejsc «input» na isMe/ME()"), tylko jeszcze niezmergowane do `origin/main`.
   Wniosek merytoryczny Operatora (izolacja od 16 pozycji render, reużycie nazwy
   `isMe`) pozostaje trafny, ale to dokładnie ten fragment dispatchu, który
   explicite kazał sprawdzić „STAN ROBOCZY, nie tylko zintegrowany main" jako
   wzorowaną na błędzie 6d lekcję — błędna etykieta stanu (niezacommitowane vs.
   zacommitowane-ale-niezmergowane) w tym właśnie miejscu obniża zaufanie, że
   kontrola została wykonana z rygorem, jakiego dispatch żądał.

STATUS: FAIL
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6E-RECON-RENDER-Q1
GOAL: Recon-only (zero kodu) kategorii render/kamera Etapu 6 planu hot-seat (§C
podpunkt e, §A8)
TESTY: brak (docs-only); zarzuty 1-3 wsparte świeżym `grep`/`Read` w tym worktree,
zarzut 4 świeżym `git status`/`git log` w `/home/user/wt-hotseat-etap6a-input`
BLOKADY: brak
RUNDY: 1/5
ZARZUTY:
1. §2 „Reszta render/*.ts jest już sparametryzowana" fałszywe — regex ślepy na
   `= 0`/`?? 0`; 4 pominięte miejsca: render/cities.ts:656,784,803,
   render/cityOkolicaOverlay.ts:298.
2. Pominięta bramka renderu main.ts:5372 (`syncOkolicaOverlay`/
   `syncCityOkolicaOverlay`), analogiczna do policzonej pozycji
   `refreshTerritoryBorderOverlay` — podważa kompletność sumy 16.
3. Uzasadnienie wykluczenia `computePotegaComponents` („zasila panel Mocy HUD")
   nieprawdziwe — funkcja ma zero wywołań w całym repo, jest martwa.
4. §6 opis stanu 6a jako „NIEZACOMMITOWANE zmiany" fałszywy — `git status`
   pokazuje „working tree clean", zmiany są zacommitowane (621f353a),
   tylko niezmergowane do origin/main.
NASTĘPNY KROK: Obrona (runda 1, ten sam temat/gałąź) — lista zarzutów niepusta,
R-PROC-AUTOBOT.md §3c wymaga rundy Obrony przed kolejnym Evaluatorem.
DEPLOY/PUSH: NIE WYKONANO
