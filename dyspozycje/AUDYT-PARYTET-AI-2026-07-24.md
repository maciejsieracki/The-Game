# AUDYT PARYTETU AI — 2026-07-24

**Zakres:** czy reguły ekonomiczne/gameplayowe wprowadzone w bieżącej fali prac (magazyn=pula
państwa, koszty surowcowe budynków, upkeep Pracy za ulepszenia, handel surowcami w dyplomacji,
bonusy cudów, bonusy budynków civ-wide, koszty jednostek/super-jednostek, trudność miast-państw)
działają **identycznie** dla gracza (ownerId=0) i dla AI (ownerId≠0), zgodnie z zasadą nadrzędną
Macieja: **zero uproszczeń dla AI, ownerId to zwykły parametr.**

Metoda: lokalizacja funkcji/ścieżki gracza i ścieżki AI dla każdego obszaru, porównanie kodu.
Audyt READ-ONLY — nic nie zmieniono w repo.

## Tabela wyników

| # | Obszar | Status | Plik:linia | Opis |
|---|--------|--------|-----------|------|
| 1 | Magazyn = pula PAŃSTWA (cap 100+100/Magazyn) | ✅ | `game/building-stock-cost.ts:120-221` (`ownerResourceStockAll`, `deductBuildingStockCostAcrossCities`, `reconcileOwnerResourceCaps` w `economy-upkeep.ts:395-410`) | Funkcje pure, przyjmują `ownerId` jako zwykły parametr; brak gałęzi `if (ownerId===0)`. `reconcileOwnerResourceCaps` iteruje po WSZYSTKICH ownerId obecnych w `cities` (turn-economy.ts:1704). |
| 2 | Koszty surowcowe budynków — pobór przy starcie budowy | ✅ | Gracz: `ui/cityPanel.ts:4291-4308` (`addItem`). AI: `main.ts:4183-4227` (`tryAutoEnqueueBuild`), `main.ts:14355-14368` (`opts.canAfford` w kontekście AI), `main.ts:14822-14841` (enqueue realny AI) | Identyczna para funkcji (`buildingStockCost` + `canAffordBuildingStock` + `deductBuildingStockCostAcrossCities`) wołana z obu ścieżek, różni się tylko `ownerId` przekazywany jako argument. Komentarze w kodzie explicite potwierdzają "zero specjalnej ścieżki AI". |
| 3 | Upkeep −1 Praca/turę za ulepszenie surowcowe | ✅ | `game/turn-economy.ts:753-764` (`computePracaUpkeepByOwner`, zwraca `Map<ownerId,koszt>` dla WSZYSTKICH ownerów) · pobór: `main.ts:14269-14283` (`playerPracaPool` dla ownerId=0, `aiPracaPoolByOwner` pętlą po reszcie ownerId, ten sam `Math.max(0, …)` clamp) | Ta sama funkcja liczy koszt dla gracza i AI; jedyna różnica to nazwa zmiennej-akumulatora (`playerPracaPool` scalar vs `aiPracaPoolByOwner` Map) — czysto techniczna, nie gameplayowa. |
| 4 | Handel surowcami — jednorazowy i cykliczny (X tur) | ✅ | `game/diplomacy-treaties.ts:24-36` (`HandelSurowiecCyklicznyItem` — `sellerOwnerId`/`buyerOwnerId` dowolna kombinacja) · silnik: `main.ts:8549-8581` (`tickCyclicResourceTradeDeals`, brak `if ownerId===0`) · propozycje AI→gracz: `game/ai.ts:2449-2477` · propozycje AI↔AI: `main.ts:8381-8460` (`formAiAiTradeAgreementsIfEligible`, deterministyczne, `pickResourceSurplusForOwnerPair` symetryczna) | Pełny parytet ekonomiczny (transfer surowca + zapłata identyczne wzory dla obu kierunków). ⚠️ patrz uwaga niżej — zakres dyplomacji AI↔AI jest węższy niż gracz↔AI (nie jest to luka ekonomiczna, ale ogranicza kiedy do handlu AI↔AI w ogóle dochodzi). |
| 5 | Bonusy cudów w ekonomii (`applyWonderCityYields`) | ✅ | `game/turn-economy.ts:149-160` (funkcja czysta po `bonus`), wywołania `turn-economy.ts:1158` i `:1449` kluczowane `city.ownerId` · mapa wejściowa: `main.ts:1878-1898` (`buildWonderCityYieldsByOwnerMap(cities.map(c=>c.ownerId))`) budowana ze WSZYSTKICH ownerId, `wonders-data.ts:216-231` (`sumWonderCityYieldsForOwner`) też ownerId-agnostyczna | Bonus cudu doliczany do KAŻDEGO miasta właściciela cudu, niezależnie czy to gracz czy AI. |
| 6 | Bonusy budynków civ-wide (Stolarnia +10% drewno, Warsztat kamieniarski +10% kamień) | ✅ | `game/turn-economy.ts:1313-1325` (`stolarniaCountByOwner`/`kamieniarskiCountByOwner` — `Map<ownerId,count>` budowana z pętli po WSZYSTKICH miastach) · zastosowanie: `turn-economy.ts:1629-1630` (`drewnoMultCiv`/`kamienMultCiv` liczone per `city.ownerId`) | Ten sam mnożnik civ-wide liczony identycznie dla imperium gracza i każdej cywilizacji AI osobno. |
| 7 | Koszty jednostek (Surowiec/Pieniądz) + super-jednostki (max 1 żywa/cyw, koszt 0 Pieniądz) | ✅ z jedną realną luką ❌ | Gate max-1: `game/production.ts:392-396` (`aliveUnitTypeNames` — pole kontekstu ownerId-agnostyczne), `production.ts:760-763` i `:850-852` (ta sama bramka w `availableProduction`/`availableReplacementsFor`). AI buduje z `aliveUnitTypeNames` filtrowanym po `ownerId` (`main.ts:14786-14788`), analogicznie do gracza (`main.ts:3385`, `:3412`). Koszt 0 Pieniądz dla `Super-jednostka=TAK`: `production.ts:234-239`, ta sama funkcja `itemCost`/`unitMoneyCost` dla obu ścieżek. | **❌ LUKA:** gracz ma dodatkową ścieżkę **natychmiastowego zakupu jednostki za złoto** (`main.ts:2054-2092` `purchaseRecruitmentUnit`, na stałe `if (city.ownerId !== 0) return false`, wywoływana z `cityPanel.ts` przyciskiem „Kup"/zloty). **AI nie ma odpowiednika** — `AICommand` (`game/ai.ts:95-101`) ma tylko `Move/FoundCity/Attack/Build/BuildImprovement/EndTurn`, brak komendy zakupu za złoto. AI może tylko kolejkować jednostkę do produkcji Pracą (`build`), nigdy nie przyspiesza/nie kupuje jej za skarbiec — złoto AI w tym kontekście jest martwe. To NIE dotyczy kosztu surowcowego/Pracy (te są parytetowe), ale realnie ogranicza AI do jednej z dwóch dróg akwizycji jednostek, które ma gracz. |
| 8 | Trudność miast-państw (nowy suwak) vs trudność globalna | ✅ | `main.ts:4007-4010` (`aiDiffLevelForOwner`) — `typCityCopyOwners` (kopie obronne = miasta-państwa) dostają `_menuCityStateDifficulty`, zwykłe AI dostają `_menuDifficulty`; obie ścieżki karmią `loadDifficultyParams` identycznie (`bonusProdukcja` realnie konsumowane w `chooseCityProduction` dla OBU ścieżek wg komentarza w kodzie) | Brak przecieku globalnej trudności do walki miast-państw potwierdzony komentarzem w kodzie: pole `bonusWalka` w `DifficultyParams` jest dziś w ogóle nieużywane w `combat.ts`/`ai.ts` (martwe pole) — więc nie ma mechanizmu przez który globalna trudność mogłaby dziś wpływać na walkę miast-państw. Separacja jest poprawna tam, gdzie coś faktycznie jest konsumowane (produkcja). |
| 9 | Produkcja jednostek NIE konsumuje surowca z puli (decyzja A — jeszcze niewdrożone) | ❌ (potwierdzone, jak zgłoszono) | `data/units.json` — brak pola `koszt_surowce` w ogóle · `buildingStockCost()` wołane WYŁĄCZNIE dla `item.kind === 'budynek'`: `ui/cityPanel.ts:4278-4281`, `main.ts:4218-4224`, `:14829-14840` (komentarz explicite: „Jednostki i budynki bez koszt_surowce zawsze «affordable»") | Potwierdzone: dziś `Surowiec(ilość)` przy jednostkach jest tylko WYŚWIETLANE (brak konsumpcji z puli — ani dla gracza, ani dla AI, brak asymetrii dzisiaj). Gdy zostanie wdrożone: implementacja MUSI powielić dokładnie ten sam wzorzec co budynki — `ownerResourceStockAll`/`canAffordBuildingStock`/`deductBuildingStockCostAcrossCities` wywołane symetrycznie w `cityPanel.ts addItem` (gracz) ORAZ w obu miejscach main.ts gdzie AI enqueue'uje jednostkę (`tryAutoEnqueueBuild` ok. linii 4218 i handler `cmd.type==='build'` ok. linii 14829) — a NIE tylko w jednym z dwóch miejsc. Nie znaleziono żadnej trzeciej ścieżki, którą AI budowałoby jednostki (poza `build`/auto-enqueue) — więc zaczep do wdrożenia jest ten sam punkt co dla budynków, bez dodatkowego ryzyka pominięcia AI. |

## Dodatkowa obserwacja (poza listą 9 punktów, znaleziona przy audycie)

**⚠️ Wyrąb lasu (`wycinka`) — AI rozwiązuje natychmiast, gracz w wielu turach.**
`main.ts:5918` (`hexClearingStates`, wieloturowy stan śledzony WYŁĄCZNIE dla `ownerId 0` — pętla
tick w `main.ts:13615` operuje na tej samej mapie, ale populowana jest tylko przez ścieżkę gracza
`requestBuildImprovement`, `main.ts:6231-6242`). AI (`main.ts:14863-14893`, komentarz „TEMAT #8")
**nie ma** per-owner wieloturowego odpowiednika — commituje efekt końcowy (usunięcie lasu) od razu
w jednej turze, z netto-zerowym kosztem Pracy (koszt startu vs `clearing.pracaPerTura × tury`
zwrócone od razu). Ekonomicznie zbilansowane (ten sam koszt netto), ale **mechanika czasowa się
różni** — gracz czeka X tur na wynik, AI dostaje go natychmiast. To jest uproszczenie ścieżki AI
względem gracza, nawet jeśli końcowy koszt Pracy jest identyczny — wart odnotowania jako odstępstwo
od zasady „zero uproszczeń dla AI", choć nie ma efektu ekonomicznego (nie daje AI przewagi
kosztowej, tylko przewagę czasową / brak ryzyka przerwania w trakcie wielu tur).

## LUKI DO NAPRAWY

1. **[Punkt 7] Brak ścieżki „kup jednostkę za złoto" dla AI.** Gracz ma `purchaseRecruitmentUnit`
   (`main.ts:2054-2092`, na stałe zablokowane do `ownerId===0`) jako alternatywę dla kolejkowania
   Pracą. `AICommand` (`game/ai.ts:95-101`) nie ma żadnego odpowiednika — AI nigdy nie wydaje złota
   na natychmiastowy zakup jednostki, tylko kolejkuje przez `build`. Do decyzji Macieja: czy to
   zamierzone ograniczenie designu (złoto AI ma inne zastosowania — trybuty, dary, handel) czy
   realna luka parytetu wymagająca komendy `AICmdPurchaseUnit` analogicznej do gracza.
2. **[Uwaga dodatkowa] Wyrąb lasu (`wycinka`) — AI rozwiązuje natychmiast (jedna tura), gracz przez
   wieloturowy `hexClearingStates`.** Netto-koszt Pracy identyczny, ale mechanika czasu różna
   (`main.ts:5918-6242` vs `:14863-14893`, komentarz „TEMAT #8" w kodzie już to opisuje jako świadomy
   skrót). Do rozważenia: czy warto dorobić AI per-owner `hexClearingStates`, czy zostawić jako
   akceptowalne uproszczenie (brak przewagi ekonomicznej, tylko czasowa).
3. **[Punkt 4, nota, nie ❌] Zakres dyplomacji AI↔AI węższy niż gracz↔AI.** Komentarz w kodzie
   (`main.ts:8367-8368`) wprost mówi: „dyplomacja AI↔AI poza gracz↔AI dziś NIE ISTNIEJE inaczej"
   — AI↔AI ma tylko sojusze sióstr zagrożonych (`formSisterAlliancesIfThreatened`) i Umowy Handlowe
   (`formAiAiTradeAgreementsIfEligible`), ale NIE ma wojen/NAP/pełnych sojuszy poza-klastrowych
   AI↔AI. Nie jest to luka EKONOMICZNA (gdy handel AI↔AI się zawiąże, jest w pełni symetryczny —
   patrz punkt 4 ✅), ale ogranicza częstość/warunki w jakich do takiego handlu AI↔AI w ogóle
   dochodzi. Do odnotowania, nie do pilnej naprawy.
4. **[Punkt 9, przypomnienie na przyszłość]** Gdy Maciej zdecyduje o wdrożeniu konsumpcji surowca
   przez jednostki (decyzja A) — implementacja MUSI dotknąć symetrycznie `ui/cityPanel.ts addItem`
   (gracz) ORAZ obu miejsc w `main.ts` gdzie AI enqueue'uje jednostkę (`tryAutoEnqueueBuild` ok.
   L4218 i handler `cmd.type==='build'` ok. L14829) — analogicznie do wzorca już istniejącego dla
   budynków (`koszt_surowce`). Nie jest to dziś luka (bo nic nie konsumuje), ale ryzyko przy
   wdrażaniu, jeśli ktoś doda konsumpcję tylko po stronie gracza.

---

**Podsumowanie liczbowe:** 7× ✅ pełny parytet (punkty 1, 2, 3, 4, 5, 6, 8) · 1× ✅ z jedną
realną luką ❌ w środku (punkt 7 — brak zakupu jednostki za złoto dla AI) · 1× ❌ potwierdzona,
znana i już zgłoszona luka nie do naprawy teraz (punkt 9 — jednostki nie konsumują surowca,
czeka na wdrożenie decyzji A) · 1 dodatkowa obserwacja ⚠️ (wyrąb lasu, mechanika czasowa) + 1 nota
o zakresie dyplomacji AI↔AI (nieekonomiczna).
