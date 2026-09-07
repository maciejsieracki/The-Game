STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1
GOAL: Limit liczby miast per cywilizacja (`canFoundCity`/`countsTowardCityFoundingLimit`,
`gra/src/game/cities.ts`) ma rozróżniać PROWENIENCJĘ zdobytego miasta: miasto przejęte
BEZPOŚREDNIO od niezależnego (jeszcze nieprzejętego przez żadną cywilizację) miasta-
-państwa LICZY SIĘ do limitu zdobywcy (jak dziś); miasto odebrane siłą INNEJ CYWILIZACJI
(czy to jej własne, od zawsze założone miasto, czy miasto-państwo, które ta cywilizacja
WCZEŚNIEJ sama przejęła) NIE LICZY SIĘ do limitu zdobywcy, bo jest wynikiem wojny z inną
cywilizacją, nie organicznej ekspansji.

ECHO WŁAŚCICIELA (żywa rozmowa 2026-09-07, wiążąca decyzja, CYTAT DOSŁOWNY):
> "Zasada powinna być następująca: wszystkie państwa i miasta liczą się do limitu, a
> miasta zdobyte z innej cywilizacji nie liczą się do limitu. Mówię tu zarówno o
> państwach-miastach własnej cywilizacji, jak i o innych; one wliczają się do limitu.
> Jednak zdobyte miasta w innej cywilizacji, nawet jeśli wcześniej były państwem-
> -miastem zdobytym przez tę cywilizację, nie zalicza się do limitu, ponieważ są
> wynikiem wojny z inną cywilizacją."

INTERPRETACJA (do potwierdzenia/doprecyzowania przez Operatora jeśli coś nie zgadza się
z architekturą — patrz REGUŁA PRZECIW SAMOOSZUKIWANIU niżej, nie zgaduj cicho):
Kryterium rozstrzygające to WŁAŚCICIEL BEZPOŚREDNIO PRZED TĄ KONKRETNĄ KONKWISTĄ:
- jeśli miasto było w momencie zdobycia NIEZALEŻNYM miastem-państwem (nigdy wcześniej
  nie przejętym przez żadną cywilizację, `startCityState===true` i nigdy nie zmieniało
  ownera przez podbój) → LICZY SIĘ do limitu zdobywcy (zachowanie BEZ ZMIAN),
- jeśli miasto było w momencie zdobycia własnością INNEJ CYWILIZACJI (niezależnie od
  tego, czy ta cywilizacja sama je założyła, czy wcześniej przejęła jako miasto-
  -państwo) → NIE LICZY SIĘ do limitu zdobywcy (ZMIANA — dziś liczy się identycznie
  jak każde inne, na mocy `R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1`, 2026-09-01,
  `2a95f7dd` — TA decyzja zostaje częściowo odwrócona, WYŁĄCZNIE dla tego jednego
  podprzypadku: "zdobyte OD INNEJ CYWILIZACJI", NIE dla przypadku "zdobyte od
  niezależnego miasta-państwa", który zostaje bez zmian).

WAŻNE — świadomie NIE zmieniać: zdobycie miasta-państwa BEZPOŚREDNIO z rąk niezależnej
(nigdy wcześniej nieprzejętej) frakcji miasta-państwa nadal LICZY się do limitu
zdobywcy — to jest część reguły którą właściciel explicite potwierdził jako pozostającą
("Mówię tu... o państwach-miastach własnej cywilizacji, jak i o innych; one wliczają
się do limitu" — czyli KAŻDE miasto-państwo przejmowane od stanu niezależnego liczy się,
niezależnie od tego czy będzie "moje" czy któregoś sojusznika/rywala w przyszłości).

KONTEKST TECHNICZNY (zlokalizowany przez recon, oszczędza czas Operatorowi):
- `gra/src/game/cities.ts:1066-1069`, `countsTowardCityFoundingLimit(city)` — dziś
  wyłącznie `city.foundedByOwner !== false`, zero odwołania do prowieniencji.
- `gra/src/game/cities.ts:968-973` — pole `foundedByOwner` (`false` = przejęte,
  brak/`true` = założone).
- `gra/src/game/cities.ts:982` — pole `startCityState` ("Startowe miasto-państwo"),
  gaszone przy KAŻDYM przejęciu przez `clearCityStateFlagOnCapture`
  (`gra/src/ui/display-names.ts:88-92`, wołane z `main.ts:13429`) — DZIŚ używane
  wyłącznie do nazewnictwa/dystansu zakładania, NIE do limitu.
- Miejsca zmiany `city.ownerId` przy podboju: `gra/src/game/post-battle-map.ts:484-489`
  (`applyCityCaptureAfterBattle`, podbój bitewny) i `gra/src/main.ts:13425-13433`
  (`resolveSiegeSurrender`, kapitulacja głodowa) — OBA mają komentarz odsyłający do
  `R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1` i OBA dziś NIE dotykają `foundedByOwner`
  (zostaje niezmieniony, zwykle `true`) — tu trzeba dodać logikę rozróżniającą.
- KLUCZOWE BRAKUJĄCE OGNIWO (do ustalenia przez Operatora, recon tego nie sprawdzał):
  czy w момencie wywołania tych dwóch funkcji `city.ownerId` (SPRZED nadpisania) daje
  się jednoznacznie sklasyfikować jako "była to CYWILIZACJA" vs "był to NIEZALEŻNY
  właściciel miasta-państwa" — sprawdź rejestr właścicieli/frakcji (analogicznie do
  `isMajorAiOwner(ownerId, isCityState)` używanego gdzie indziej w kodzie — poszukaj
  źródła prawdy "czy dany ownerId to independent city-state faction czy pełnoprawna
  cywilizacja" per konkretny moment/city, nie tylko per globalny rejestr, bo miasto-
  -państwo RAZ przejęte przez cywilizację przestaje być "niezależne" nawet jeśli
  `startCityState` bywa gaszone dopiero PRZY TYM przejęciu — kolejność operacji ma
  znaczenie, sprawdź czy stary stan `startCityState`/ownera jest czytany PRZED czy PO
  zmianie w obu funkcjach).

ZADANIE:
1. Ustal DOKŁADNIE, jak dziś kod odróżnia (czy w ogóle) "ownerId niezależnego miasta-
   -państwa" od "ownerId pełnoprawnej cywilizacji" W MOMENCIE zdobycia (przed zmianą
   `city.ownerId`) — opisz to w raporcie z cytatem, zanim zaczniesz zmieniać logikę.
2. W obu miejscach zdobycia (`post-battle-map.ts:484-489`, `main.ts:13425-13433`) —
   PRZED nadpisaniem `city.ownerId`, sprawdź czy poprzedni właściciel był "pełnoprawną
   cywilizacją" (nie niezależnym miastem-państwem). Jeśli TAK → ustaw
   `city.foundedByOwner = false` (miasto przestaje liczyć się do limitu zdobywcy). Jeśli
   NIE (poprzedni właściciel to wciąż niezależne miasto-państwo) → zostaw
   `foundedByOwner` bez zmian (liczy się, jak dziś).
3. Napisz/rozszerz test pokrywający OBA scenariusze: (i) podbój zwykłego miasta innej
   cywilizacji → nowe miasto NIE liczy się do limitu zdobywcy, (ii) podbój miasta-
   -państwa, które WCZEŚNIEJ zostało przejęte przez inną cywilizację (czyli w momencie
   TEJ konkwisty jego właściciel to już cywilizacja, nie stan niezależny) → też NIE
   liczy się (to jest właśnie rozróżnienie, którego właściciel się domaga), (iii) podbój
   NIEZALEŻNEGO miasta-państwa (nigdy wcześniej nieprzejętego) → NADAL liczy się do
   limitu zdobywcy (regres zachowania z `R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1`, TEN
   podprzypadek zostaje bez zmian).

BINARNE KRYTERIUM SUKCESU: trzy scenariusze z punktu 3 wyżej, każdy ze sprawdzalnym
`canFoundCity`/`countsTowardCityFoundingLimit` przed i po konkwiście, potwierdzające
dokładnie opisane rozróżnienie.

ALLOWLISTA:
- `gra/src/game/cities.ts` (`countsTowardCityFoundingLimit`, ewentualnie nowe pole/
  parametr wspierające rozróżnienie — NIE zmieniać samej formuły limitu `base + (era-1)*5`)
- `gra/src/game/post-battle-map.ts` (`applyCityCaptureAfterBattle`)
- `gra/src/main.ts` (WYŁĄCZNIE `resolveSiegeSurrender`, linie ok. 13425-13433 — nie
  ruszać reszty pliku)
- `gra/tools/*.cjs` (nowa albo rozszerzona bramka)
- `dyspozycje/autobot/runs/R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1/*`
Zakaz zmiany formuły samego limitu (`cityLimitBase`, mnożnik per epokę). Zakaz zmiany
zachowania dla podboju NIEZALEŻNEGO miasta-państwa (musi zostać jak dziś — liczy się).
Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: jeśli okaże się, że kod NIE PRZECHOWUJE informacji
pozwalającej odróżnić w momencie zdobycia "poprzedni właściciel był niezależnym
miastem-państwem" od "poprzedni właściciel był cywilizacją" (np. bo `startCityState`
bywa gaszone ZANIM ta informacja jest czytana, albo bo nie ma żadnego rejestru
"independent city-state faction" per ownerId) — zgłoś to jako BLOCK z dokładnym opisem
brakującego ogniwa, zamiast wymyślać przybliżoną heurystykę po cichu (np. "sprawdzę czy
ownerId>2" czy inny zgadywany warunek bez pokrycia w architekturze).

IZOLACJA: worktree `/home/user/wt-miasta-limit-prowenienencja`, gałąź
`autobot/R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1`, baza `origin/main` @
`3f7c68e3` (sprawdź `git fetch origin main` przed rozpoczęciem, main mógł się przesunąć).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
