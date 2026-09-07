STATUS: PASS
DOMAIN: GAME
TEMAT: R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1
GOAL: Limit miast per cywilizacja rozróżnia prowenincję zdobytego miasta: zdobyte
BEZPOŚREDNIO od niezależnego (nigdy wcześniej nieprzejętego) miasta-państwa nadal
liczy się do limitu zdobywcy (bez zmian); zdobyte OD INNEJ CYWILIZACJI (czy to jej
własne miasto, czy miasto-państwo które ta cywilizacja WCZEŚNIEJ sama przejęła) NIE
liczy się do limitu zdobywcy — CZĘŚCIOWE odwrócenie R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1
(2026-09-01), na wyraźne ECHO właściciela z 2026-09-07 zacytowane w 00-dispatch.md.

USTALENIE ARCHITEKTURY (punkt 1 zadania — brak BLOCK, ogniwo istnieje):
Kod PRZECHOWUJE dokładnie tę informację, jednoznacznie i bez heurystyki. Pole
`city.startCityState` (gra/src/game/cities.ts:982) jest ustawiane na `true` WYŁĄCZNIE
w main.ts przy generacji mapy startowych miast-państw klastra (dwa miejsca:
main.ts:8571 `spawnClusterSameTypeRivals`, main.ts:8691 `spawnPendingForeignClusters`
— potwierdzone grepem `startCityState = true` w całym gra/src, poza tymi dwoma jest
tylko warunkowe przypisanie w `foundCityAt`, cities.ts:1213, sterowane tym samym
`foundingCityState` z tych samych dwóch wywołań) i NIGDY nie jest ponownie ustawiane
na `true` po tym momencie. Gaśnie NA MIEŚCIE przy KAŻDYM przejęciu przez
`clearCityStateFlagOnCapture` (game/display-names.ts:88-94) i zostaje zgaszone trwale
— cytat z JSDoc tej funkcji: „Gasimy oznaczenie NA MIEŚCIE, nie na właścicielu —
zbiory spawnowe... zostają nietknięte, więc PRAWDZIWE miasta-państwa dalej są
miastami-państwami... Mechanizm nie jest wyłączany; przestaje tylko zarażać
zdobywcę.". Zweryfikowałem KOLEJNOŚĆ operacji w obu funnelach zdobycia (dokładnie to,
o co prosiło "KLUCZOWE BRAKUJĄCE OGNIWO" w dispatchu):
- `applyCityCaptureAfterBattle` (post-battle-map.ts): `clearCityStateFlagOnCapture`
  NIE jest wołane wewnątrz tej funkcji wprost — jest wołane z main.ts przez hak
  `captureOpts.onOwnerChanged` (main.ts:26983), który wykonuje się DOPIERO po
  `city.ownerId = atkOwner;` (post-battle-map.ts, wewnątrz tej samej funkcji, przed
  `onOwnerChanged?.(city)`). Czyli `city.startCityState` odczytane na SAMYM POCZĄTKU
  `applyCityCaptureAfterBattle` (razem z `prevOwner = city.ownerId`) jest wartością
  SPRZED tego konkretnego przejęcia — dokładnie to, czego potrzeba.
- `resolveSiegeSurrender` (main.ts): `clearCityStateFlagOnCapture(city)` jest wołane
  na linii ~13429, PO `city.ownerId = newOwner;` (linia ~13425) i PO odczycie
  `oldOwner = city.ownerId;` (linia ~13415, PRZED zmianą). Odczyt `startCityState` w
  tym samym miejscu co `oldOwner` (zaraz po nim) jest więc również bezpieczny.

Wniosek: `city.startCityState === true` odczytane na początku obu funnelów zdobycia
(przed nadpisaniem `ownerId` i przed `clearCityStateFlagOnCapture`) jest dokładnym,
niezguessowanym predykatem „ta cywilizacja/gracz jest PIERWSZYM zdobywcą tego miasta w
całej partii" — czyli dokładnie kryterium z INTERPRETACJI dispatchu. Brak potrzeby
BLOCK: to nie jest heurystyka typu "ownerId>2" — to istniejący, udokumentowany,
purpose-built flag, którego semantyka (ustawiany tylko przy spawnie, gaszony trwale
przy pierwszym przejęciu) jest w pełni zweryfikowana kodem i komentarzami.

ŚWIADOMIE POZA ZAKRESEM (nie BLOCK, udokumentowane w kodzie): kryterium nie
rozróżnia barbarzyńców/rebeliantów jako poprzedniego właściciela — miasto-państwo
schwytane przez barbarzyńców (co też gasi `startCityState`, bo `onOwnerChanged` jest
wołane niezależnie od `atkOwner`) i odbite później przez prawdziwą cywilizację
wypadnie z limitu tej cywilizacji tak samo jak odebranie od "innej cywilizacji" —
ECHO właściciela mówi wyłącznie o „innej cywilizacji", nie o barbarzyńcach/rebeliantach,
a trzy binarne scenariusze z dispatchu (punkt 3) nie obejmują tego przypadku. Nie
zgadywałem tu dodatkowej heurystyki — zostawiłem istniejące, udokumentowane
zachowanie i opisałem je wprost w komentarzu JSDoc `wasIndependentCityStateBeforeCapture`
(cities.ts).

ZMIANY/COMMIT:
- gra/src/game/cities.ts: nowa eksportowana funkcja `wasIndependentCityStateBeforeCapture(city)`
  (JSDoc z pełnym uzasadnieniem powyżej) — `countsTowardCityFoundingLimit` NIE zmieniona
  (formuła limitu nietknięta, jak wymagała allowlista).
- gra/src/game/post-battle-map.ts: `applyCityCaptureAfterBattle` — odczyt
  `wasIndependentCityState = wasIndependentCityStateBeforeCapture(city)` na samym
  początku (obok istniejącego `prevOwner`), i `if (!wasIndependentCityState) city.foundedByOwner = false;`
  tuż po `city.ownerId = atkOwner;` (miejsce dawnego komentarza
  R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1, komentarz zaktualizowany, nie usunięty).
- gra/src/main.ts: WYŁĄCZNIE `resolveSiegeSurrender` — analogiczny odczyt
  `wasIndependentCityState` zaraz po `oldOwner = city.ownerId;`, i analogiczne
  `if (!wasIndependentCityState) city.foundedByOwner = false;` zaraz po
  `clearCityStateFlagOnCapture(city)`. Reszta main.ts nietknięta (import nowej
  funkcji dodany do istniejącego bloku importu z './game/cities').
- gra/tools/city-limit-conquered-test.cjs: rozszerzony o trzy binarne scenariusze z
  dispatchu (i/ii/iii) + zaktualizowane recon-asercje na ciałach funkcji (stare
  asercje `!includes('city.foundedByOwner = false')` zastąpione asercjami że NOWY
  kod jest obecny — stare asercje broniły dokładnie tego zachowania, które ten temat
  celowo częściowo odwraca).
- SHA: brak (jeszcze niescommitowane w chwili pisania raportu — commit poniżej,
  patrz też `git log` po zakończeniu tej rundy).

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` w gra/ — 0 błędów.
- `node tools/city-limit-conquered-test.cjs` — 24 passed, 0 failed (obejmuje
  wszystkie trzy scenariusze z BINARNEGO KRYTERIUM SUKCESU dispatchu + kontrolę
  annexCityStateToOwner poza zakresem).
- `node tools/logic-test.cjs` — 213/213 (baseline z R-PROC-AUTOBOT.md §6 bez zmian).
- Regresja sąsiednich bramek dotykających tych samych funnelów zdobycia — WSZYSTKIE
  zielone poza dwoma PRE-ISTNIEJĄCYMI (potwierdzone `git stash`/porównanie przed-po,
  identyczne wyniki bez moich zmian):
  - `tools/post-battle-map-test.cjs` — 32/32
  - `tools/barb-city-owner-contract-test.cjs` — 3/3
  - `tools/barb-city-behavior-test.cjs` — 177/177
  - `tools/forced-war-bronze-main-guard-test.cjs` — 28/28 (PO poprawce długości
    komentarza w main.ts — patrz BLOKADY niżej, naprawione w tej samej rundzie)
  - `tools/forced-war-iron-main-guard-test.cjs` — 37/37
  - `tools/forced-war-stone-main-guard-test.cjs` — 19/19
  - `tools/flaga-mp-nie-gasnie-test.cjs` — 31 PASS / 1 FAIL (T14, PRE-ISTNIEJĄCY:
    identyczny wynik z `git stash` przed moimi zmianami — liczy literalne
    przypisania `startCityState = true` w main.ts, nie dotyczy tego tematu)
  - `tools/okolica-ownership-change-reconcile-test.cjs` — 12/15 (3 FAIL,
    PRE-ISTNIEJĄCE: identyczny wynik z `git stash` przed moimi zmianami)
- `git diff --check` — czysto, brak whitespace errors.
- `git status` po allowlist-only zapisach — tylko 4 zmienione pliki z allowlisty.

BLOKADY: Jedna samo-naprawiona podczas rundy: mój pierwszy wariant komentarza w
`resolveSiegeSurrender` przesunął odległość `function resolveSiegeSurrender(...){` →
`city.ownerId = newOwner;` do 2085 znaków, przekraczając twardy limit `{0,2000}` w
regexie bramki `tools/forced-war-bronze-main-guard-test.cjs` (bramka NIE dotyczy
tego tematu — łapie kolejność `maybeResolveBronzeForcedWarOnCityCapture` względem
zmiany ownerId, niepowiązaną funkcjonalność w tym samym funnelu). Skróciłem swój
komentarz (1 linia zamiast 4), odległość spadła do 1970/2063 znaków, bramka wróciła
do 28/28 bez zmiany samej bramki. Brak BLOKAD wymagających decyzji właściciela.

RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
