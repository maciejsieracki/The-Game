STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-PODBOJ-ELIMINACJA-PULA-PRACY-TRANSFER-Q1
GOAL: Przy ELIMINACJI cywilizacji (zdobycie jej OSTATNIEGO miasta/stolicy) — pula pracy
CAŁEJ eliminowanej cywilizacji przechodzi (DODAJE SIĘ) do puli pracy zdobywcy, zamiast
być zerowana. Przy zdobyciu stolicy BEZ eliminacji (obrońca przeżywa z innymi miastami)
zachowanie zostaje BEZ ZMIAN (pula pracy nadal przepada, jak dziś).

ECHO WŁAŚCICIELA (żywa rozmowa 2026-09-07, wiążąca decyzja, ŚWIADOMIE ODWRACA CZĘŚĆ
wcześniejszej decyzji `P-PODBOJ-PRZEJECIE-SUROWCOW-PANSTWA-MIASTA` z 2026-08-09, commit
`036173f7`, która mówiła: "pula pracy zawsze przepada zamiast trafić do zwycięzcy —
dotyczy to obu typów właścicieli jednakowo"):
> "Powinniśmy zarówno przejmować pracę tej cywilizacji po zajęciu ostatniego miasta,
> czyli ostatniej stolicy, jak i przejmować pracę poszczególnych miast, przeznaczoną
> na budynki. Budynki, które były wcześniej budowane, powinny być zachowane na takim
> etapie, na jakim były budowane przez inną cywilizację lub państwo-miasto."
Właściciel wybrał wprost: "Tak, wprowadź obie zmiany" (transfer puli przy eliminacji +
zachowanie postępu budynku w budowie przy zwykłym zdobyciu).

WAŻNE — recon (Explore agent) już ustalił, że CZĘŚĆ (b) tej prośby JEST JUŻ SPEŁNIONA:
budynek w budowie w mieście NIE-stołecznym, NIE-cudzie już DZIŚ zachowuje swój `postęp`
(`item.postep`) po zdobyciu — `applyCityCaptureAfterBattle` (post-battle-map.ts:411-497)
zmienia wyłącznie `city.ownerId`, nie rusza kolejki produkcji; sanityzacja
(`sanitizeBuildQueue`/`sanitizeProductionQueue`) forfeituje TYLKO: legacy jednostki w
kolejce (postęp → pula PRZEGRANEGO), budynki `lokalizacja:'stolica'` niebudowalne u
nowego właściciela (postęp → pula ZDOBYWCY), cuda zablokowane bramką (postęp → pula
zdobywcy). Zwykły budynek — zostaje z niezmienionym postępem. TA RUNDA MA WYŁĄCZNIE
zweryfikować to (istniejącym albo nowym testem) — NIE trzeba tu nic zmieniać w tej
części, chyba że weryfikacja ujawni wyjątek, którego recon nie złapał.

CZĘŚĆ DO FAKTYCZNEJ ZMIANY KODU — WYŁĄCZNIE (a): transfer puli pracy CAŁEJ eliminowanej
cywilizacji na zdobywcę.

KONTEKST TECHNICZNY (zlokalizowany przez recon):
- `gra/src/game/capital-capture.ts`, `applyCapitalCapturePlunder()` (linie ok. 174-231) —
  rdzeń logiki. Dziś: `access.setPracaPool(oldOwner, 0)` (linia ok. 197) — BEZ TRANSFERU,
  identycznie dla przypadku "stolica przeżywa" i "eliminacja". TRZEBA rozróżnić te dwa
  przypadki (funkcja/wywołujący prawdopodobnie już wie, czy to eliminacja — sprawdź
  parametr/flagę `kind`/`isElimination` w wywołaniu, analogiczną do `kind` używanego w
  `buildCityCaptureReportRows` main.ts:1403).
- Pula pracy jest EMPIRE-WIDE (per-owner, nie per-miasto) — `ownerPracaPool`/
  `setOwnerPracaPool` (main.ts ~L26046-26057), symetryczne gracz/AI/miasto-państwo
  (`aiPracaPoolByOwner` — istnieje realnie, komentarz w capital-capture.ts sugerujący że
  "AI nie ma takiej puli" jest NIEAKTUALNY, zignoruj go, zweryfikuj sam w kodzie).
- Wywołujące miejsca: `runCapitalCapturePlunder()` main.ts ~L26583 i ~L13528 (kapitulacja
  głodowa), ścieżka bitwy ~L27116.
- Popup: `gra/src/main.ts:1403-1433` (`buildCityCaptureReportRows()`) — wiersz "Pula
  pracy: przepadła — nie przechodzi na zdobywcę" generowany dla `kind !== 'zwykle'`
  (stolica LUB eliminacja) — PO tej zmianie, wiersz MUSI się różnicować: dla eliminacji
  pokazać ile puli przeszło do zdobywcy (np. "Pula pracy: +N — przejęta od
  wyeliminowanej cywilizacji"), dla zwykłej kapitulacji stolicy (bez eliminacji) —
  zostaje BEZ ZMIAN ("przepadła...").

ZADANIE:
1. W `applyCapitalCapturePlunder()` (capital-capture.ts) — przy eliminacji: zamiast
   `setPracaPool(oldOwner, 0)`, wykonaj `setPracaPool(newOwner, ownerPracaPool(newOwner)
   + ownerPracaPool(oldOwner))` (DODAJ do istniejącej puli zdobywcy, analogicznie do
   transferu złota "100% do zwycięzcy" — sprawdź dokładny wzorzec transferu złota w tej
   samej funkcji i powiel go dla puli pracy), NASTĘPNIE `setPracaPool(oldOwner, 0)`
   (przegrany i tak już nie istnieje/nie ma miast, ale dla spójności stanu wyzeruj).
   Przy NIE-eliminacji (stolica przeżywa gdzie indziej) — zostaw `setPracaPool(oldOwner,
   0)` bez transferu, DOKŁADNIE jak dziś.
2. Zaktualizuj `buildCityCaptureReportRows()` (main.ts:1403-1433) — wiersz "Pula pracy"
   ma dwa warianty zależnie od `kind==='eliminacja'` vs `kind==='stolica'` (bez
   eliminacji): dla eliminacji pokaż przejętą kwotę, dla zwykłej kapitulacji stolicy
   zostaw istniejący tekst "przepadła — nie przechodzi na zdobywcę" bez zmian.
3. Napisz/rozszerz test weryfikujący OBA scenariusze: (i) eliminacja — pula pracy
   ofiary faktycznie trafia do zdobywcy (dodana, nie zastąpiona), (ii) kapitulacja
   stolicy BEZ eliminacji — pula pracy ofiary nadal zerowana bez transferu (regres
   zachowania z 2026-08-09 dla TEGO przypadku, celowo niezmienionego).
4. Zweryfikuj (osobnym testem albo re-użyciem istniejącego) część (b) — budynek w
   budowie w zwykłym, nie-stołecznym mieście zachowuje `postęp` po zdobyciu — jeśli
   weryfikacja to potwierdzi, NIE zmieniaj nic w tej części, tylko udokumentuj dowód w
   raporcie.

BINARNE KRYTERIUM SUKCESU: test symulujący eliminację cywilizacji z niezerową
`ownerPracaPool` pokazuje, że PO zdarzeniu `ownerPracaPool(zdobywca)` wzrosła o dokładnie
wartość puli ofiary sprzed eliminacji (nie zerowa, nie zastąpiona). Test symulujący
zdobycie stolicy BEZ eliminacji pokazuje, że pula ofiary nadal się zeruje bez transferu
(regres poprzedniego zachowania dla tego jednego przypadku).

ALLOWLISTA:
- `gra/src/game/capital-capture.ts`
- `gra/src/main.ts` (WYŁĄCZNIE `buildCityCaptureReportRows()` i najbliższe wywołania
  przekazujące jej dane — nie ruszać reszty pliku)
- `gra/tools/*.cjs` (nowa albo rozszerzona bramka)
- `dyspozycje/autobot/runs/R-PODBOJ-ELIMINACJA-PULA-PRACY-TRANSFER-Q1/*` (raporty własne)
Zakaz zmiany zachowania dla przypadku "stolica przeżywa BEZ eliminacji" — to zostaje
identyczne z dzisiejszym (kanon 2026-08-09 nadal wiążący dla TEGO podprzypadku). Zakaz
`git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania transferu za działający bez pokazania w
raporcie KONKRETNYCH liczb przed/po (`ownerPracaPool(zdobywca)` i `ownerPracaPool(ofiara)`
przed i po zdarzeniu, dla obu scenariuszy — eliminacja i nie-eliminacja) — nie ogólnikowe
"transfer działa poprawnie".

IZOLACJA: worktree `/home/user/wt-podboj-eliminacja-pula-pracy`, gałąź
`autobot/R-PODBOJ-ELIMINACJA-PULA-PRACY-TRANSFER-Q1`, baza `origin/main` @ `c469c7b5`
(UWAGA: main mógł się przesunąć od czasu założenia worktree — sprawdź `git fetch origin
main` i zdecyduj czy rebase'ować na nowszy main przed rozpoczęciem pracy, żeby nie
integrować na przestarzałej bazie).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
