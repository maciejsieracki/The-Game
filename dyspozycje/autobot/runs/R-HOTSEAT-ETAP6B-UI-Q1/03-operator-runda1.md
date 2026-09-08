STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6B-UI-Q1
GOAL: Obrona (runda 1) — odpowiedź na ZARZUT 1 Evaluatora dot. `gra/src/ui/cityPanel.ts:7575`.

ZMIANY/COMMIT: Brak zmian w kodzie w tej rundzie (decyzja: ODRZUCAM migrację teraz, patrz OBRONA).
Commit tego raportu na `autobot/R-HOTSEAT-ETAP6B-UI-Q1` (bez push).

TESTY: Weryfikacja zarzutu przez Read/grep (bez ponownego uruchamiania bramek — brak zmian w
kodzie produkcyjnym):
- `sed -n '7550,7600p' gra/src/ui/cityPanel.ts` — potwierdzono `_legacyBuildBuildingDetailCard`,
  linia 7575: `const ownerId = 0;` → `buildingWorkCost(baseWork, undefined, pace, ownerId, difficulty)`.
- `grep -n "ownerId:\s*0\b" cityPanel.ts` → DRUGI, wcześniej nieujawniony hardcode: linia 7476,
  `buildBuildingDetailCardViaEntityCard` (ścieżka PODSTAWOWA, T5, entityCards), pole
  `ownerId: 0,` w `cityState`, z komentarzem w kodzie: „1:1 ze świadomym hardcode'em dawnego
  buildBuildingDetailCard". Czyli hardcode występuje symetrycznie w OBU ścieżkach (nowej i
  legacy-fallback), nie tylko w legacy — `_legacyBuildBuildingDetailCard` jest wywoływana
  wyłącznie przy wyjątku (linia 7498), więc w normalnym działaniu to linia 7476 jest aktywna.
- `grep -n "ownerId\s*=\s*0\b"` w całym V1-V11 (cityPanel/siegeMapPanel/preBattle/powerOverlayHud):
  wyłącznie ta jedna para miejsc (7476/7575) — brak dalszych nieujawnionych trafień tego typu.
- Prześledzono łańcuch wywołań: `buildingWorkCost` (game/production.ts:501) → parametr
  `ownerId` → `applyDifficultyCostMultiplier` (game/difficulty-cost.ts:62) →
  `isPlayerOwner(ownerId)` (game/difficulty-cost.ts:44-46): `return ownerId === 0;` —
  SAMA `isPlayerOwner` jest jeszcze niezmigrowana (nieświadoma `human-owners.ts`/`humanOwnerIds`),
  identycznie jak `sumEconomyForPlayerCities` w `game/turn-economy.ts:1219`, już ujawnione przez
  Operatora i potwierdzone przez Evaluatora jako poza allowlistą i przypisane Etapowi 6c.

BLOKADY (uzupełnione o wynik obrony):
- `game/turn-economy.ts:1219` (`sumEconomyForPlayerCities`, ownerId===0) — jak w R2, poza
  allowlistą, Etap 6c.
- NOWA, jawnie rozliczona: `game/difficulty-cost.ts:44-46` (`isPlayerOwner`, ownerId===0) —
  plik poza allowlistą tego tematu (allowlista obejmuje wyłącznie `ui/cityPanel.ts`,
  `ui/siegeMapPanel.ts`, `ui/preBattle.ts`, `ui/powerOverlayHud.ts` + main.ts U1-U14).
  Konsumowana przez DWA miejsca w cityPanel.ts: 7476 (ścieżka podstawowa
  `buildBuildingDetailCardViaEntityCard`) i 7575 (`_legacyBuildBuildingDetailCard`, fallback).
  Przypisuję do Etapu 6c/6d razem z `turn-economy.ts:1219` — to ta sama kategoria
  (ekonomia/trudność, nie UI) i ten sam brak: samo podanie realnego `ownerId` z `city.ownerId`
  w cityPanel.ts NIE naprawiłoby podglądu kosztu przy `humanOwnerIds≠[0]`, bo `isPlayerOwner`
  nadal sprawdzałaby `===0` — zmiana tylko w cityPanel.ts byłaby kosmetyczna i myląca
  (sugerowałaby naprawę, której realnie by nie było, bez migracji `difficulty-cost.ts`).

RUNDY: 1/5

OBRONA:
1 -> ODRZUCAM (migrację w tej rundzie), PRZYJMUJE (jawne rozliczenie/ujawnienie).
   Dowód, że migracja samego `cityPanel.ts:7575` (i symetrycznie 7476) byłaby myląca bez
   migracji `game/difficulty-cost.ts` — patrz łańcuch wywołań w TESTY wyżej: `isPlayerOwner`
   (difficulty-cost.ts:44-46) jest zaszyta na `ownerId === 0` i JEST poza allowlistą tego
   tematu. Podmiana lokalnego literału na `city?.ownerId ?? 0` przekazałaby realny ownerId
   do `buildingWorkCost`, ale funkcja docelowa i tak zredukowałaby go z powrotem do
   pytania "czy to 0" — więc żadna obserwowalna zmiana zachowania by nie nastąpiła, a
   diff sugerowałby naprawę poza zakresem. Zgadzam się z Evaluatorem, że brak ujawnienia
   był realnym przeoczeniem w moim raporcie R1 (metoda regex `===`/`!==` rzeczywiście nie
   łapie formy `ownerId = 0` ani `ownerId: 0`) — stąd PRZYJMUJE część "jawne rozliczenie":
   oba miejsca (7476 i 7575) dopisane do BLOKAD wyżej i przypisane do Etapu 6c/6d, tym samym
   traktowane identycznie jak już zaakceptowany precedens `turn-economy.ts:1219`. Kod
   produkcyjny NIE zmieniony w tej rundzie (brak w allowlist dla `difficulty-cost.ts`,
   a migracja samego wywołania bez tego byłaby kosmetyczna).

NASTĘPNY KROK: Final Control (ocena obrony zarzutu 1 i decyzja o READY_FOR_DEPLOY/dalszych rundach)
DEPLOY/PUSH: NIE WYKONANO
