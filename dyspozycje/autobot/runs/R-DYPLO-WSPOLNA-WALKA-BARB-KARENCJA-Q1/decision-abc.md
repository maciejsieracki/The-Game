# DECISION_REQUIRED — R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1, runda 1

Zgłoszenie zgodnie z playbook C-054 (ścieżka lekka (a) — konflikt czysto
inżynierski/zakresu allowlisty, nie wybór balansu/gameplay).

## Co mówi dispatch (GOAL 2)
Okres karencji ma być **żywym mechanizmem gry**: przez `BARBARIAN_COOPERATION_TURNS`
tur po wygaśnięciu/usunięciu traktatu `hasAuthorizedBorderCrossing` ma nadal
traktować parę jak autoryzowaną — struktura ma żyć "tam, gdzie dziś żyje
`activeDeals`" (main.ts).

## Co mówi allowlista tego dispatchu
`main.ts` nie jest wymieniony wcale (allowlista: `diplomacy-barbarian-
cooperation.ts`, `diplomacy-proposals.ts`, `diplomacy-treaties.ts`,
`diplomacy-border-march.ts`, `diplomacyTradeBasket.ts`, `diplomacyAudience.ts`
warunkowo, nowe testy).

## Co pokazuje kod (recon tej rundy, z dowodem)
1. `activeDeals` żyje jako `let` w `main.ts`; jedyne miejsca wywołania
   `expireTreaties`/`removeTreatiesById` dla tego tematu to
   `runDiplomacyTurnTick()` (main.ts:17844) i `breakTreatyVoluntarily()`
   (main.ts:16696-16724) — oba poza allowlistą.
2. Panel "Aktywne traktaty" (`activeTreatiesForPair`, main.ts:16743) buduje
   listę WPROST z `activeDeals`. Próba osadzenia stanu karencji jako
   zmodyfikowanego "kikuta" traktatu w `activeDeals` (żeby uniknąć edycji
   main.ts) ma DWA potwierdzone defekty: (a) łamie chroniony test
   `diplomacy-barbarian-cooperation-test.cjs` (`expireTreaties(deal,
   3).length === 0` — zweryfikowane uruchomieniem, FAIL potwierdzony przed
   odrzuceniem tego wariantu); (b) wygasły/zerwany traktat pokazywałby się
   w "Aktywne traktaty" jako wciąż w pełni aktywny z działającym przyciskiem
   "Zerwij" — drugi klik naliczyłby karę zerwania PONOWNIE.
3. `breakTreatyVoluntarily(dealId)` NIE przyjmuje parametru tury — dodanie go
   wymaga edycji main.ts (jedynego wywołującego).

## Wniosek
GOAL 2 **nie da się** wpiąć end-to-end (żywy mechanizm w grze, nie tylko
projekt) bez edycji `main.ts` w co najmniej 3 punktach:
- `runDiplomacyTurnTick()` — wywołanie `recordBarbarianCooperationGrace` przy
  naturalnym wygaśnięciu (dziś: `expireTreaties(activeDeals, turn)`),
- `breakTreatyVoluntarily(dealId, ...)` — to samo przy jednostronnym zerwaniu,
- miejsce budujące `resolveCtx` dla `applyUnauthorizedBorderPenalties` —
  wątek `barbarianCooperationGrace`/`turn` do `BorderMarchCheckContext`.

## Co zrobiono w tej rundzie (w pełni w allowliście, zero ryzyka regresji)
- GOAL 1 w pełni wpięte end-to-end (nie wymagało main.ts — reużyto już
  istniejącego, bezwarunkowo forwardowanego `payload.treatyTurns`).
- GOAL 2: projekt + kompletna implementacja czystych funkcji
  (`recordBarbarianCooperationGrace`/`pruneExpiredBarbarianCooperationGrace`/
  `isBarbarianCooperationGraceActive` w `diplomacy-treaties.ts`,
  `hasAuthorizedBorderCrossing` rozszerzone opcjonalnym, backward-compatible
  polem) + test `barbarian-cooperation-grace-test.cjs` (30/30, każda z 3 tur
  karencji i tura 4 z osobna, oba wektory: naturalne wygaśnięcie i
  jednostronne usunięcie). Mechanizm jest gotowy do wpięcia, ale DZIŚ nie
  wpływa na żywą rozgrywkę.
- GOAL 3: recon zamiast zgadywania — istniejący generyczny przycisk "Zerwij"
  (diplomacyAudience.ts + `breakTreatyVoluntarily`) już działa dla
  `WspolnaWalkaBarbarzyncy` (brak filtra po rodzaju traktatu). Zero nowego UI.

## Decyzja wymagana
Czy w rundzie 2 (to samo ID, ta sama gałąź) rozszerzyć allowlistę o
main.ts, **wyłącznie** w trzech punktach wymienionych wyżej (nie ogólny
dostęp do pliku)? Alternatywa: zostawić GOAL 2 jako "zaprojektowane,
nie wpięte" i zamknąć temat na tym — ale wtedy okres karencji fizycznie
nie działa w grze mimo zielonych testów jednostkowych (ryzyko dokładnie
tego typu, przed którym ostrzega C-016/C-040: kod istnieje, gracz go nie
doświadcza).
