# R-WEB-UI-DIPLO-RELATION-DEAL-TEXT-CONSISTENT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-DIPLO-RELATION-DEAL-TEXT-CONSISTENT-Q1
GOAL: w oknie dyplomacji wiersz „Wpływ Relacji na deal" nie może pisać „musisz dać więcej (×N PW), by oferta była uczciwa", gdy werdykt pod spodem mówi „Możesz przyjąć" (przycisk „Przyjmij" aktywny) — oferta AI→gracz. Oferta gracz→AI zostaje bez zmian. Tylko wyświetlanie; reguły handlu, bramki i wartości bez zmian.
BAZA: origin/main = 6b9bcaf2b (FALA 660). Kod w commicie na gałęzi detached (SHA w polu sha raportu orkiestratora).

## ZMIANY
- `gra/src/ui/diplomacyAcceptanceBalance.ts`:
  - nowy wariant kontekstu `'incomingAccepted'` w `RelationDealContext` (tylko wyświetlanie);
  - w `renderPnBalancePanelHtml`: gdy `incomingTrade && data.canAccept !== false`, wiersz Relacji renderowany wariantem `'incomingAccepted'` zamiast `relationRowFromBalance(...)`. Dla `'incomingAccepted'` ton (`better`/`worse`/`neutral`) idzie za modyfikatorem % (jak w traktacie), a tekst nie zawiera gałęzi „musisz dać więcej" (ta jest tylko w `'trade'`).
  - nieobjęte: gracz→AI (`own`), `canAccept=false`, widok traktatu, koszyk budowany (`renderPnBalancePanelFromBasket`, używa `'trade'` dla własnej oferty).
- `gra/tools/diplomacy-relation-deal-text-consistent-test.cjs` (nowy): 6 asercji na renderze panelu (esbuild-bundle źródła, bez przeglądarki).

## TESTY
- `npm ci --ignore-scripts` w `gra/`: OK (ostrzeżenia audytu npm, bez wpływu).
- Nowy test: `node tools/diplomacy-relation-deal-text-consistent-test.cjs` → **6 pass / 0 fail** (po poprawce).
- Mutacja (kontrola nietautologiczności): w źródle wyłączono warunek (`false && incomingTrade && …`) → **4 pass / 2 fail** (czerwone: „incoming+accept: brak musisz dać więcej", „incoming+accept, net<0: brak musisz dać więcej"). Źródło przywrócone, ponowny przebieg → 6/0.
- `tsc --noEmit` (`gra/`): brak komunikatów o błędach. Uwaga: kod wyjścia zmierzono przez `tail`, więc potwierdzam brak wyjścia, nie sam kod wyjścia tsc.
- Bramki referencyjne (surowe wyniki):
  - `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
  - `node tools/tech-tree-test.cjs` → `20 pass, 0 fail` (wzorzec §6 mówi 19/19; liczba testów wzrosła w bazie, 0 FAIL)
  - `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
  - `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)` (wzorzec 13/13; liczba testów wzrosła w bazie)
  - `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- **NIE_ZMIERZONO:** realny test w Chromium na oknie dyplomacji (Playwright, zrzut ekranu, obejrzenie zrzutu). Nie wykonano w tej rundzie. Wymóg §6 pkt 6 (dowód wizualny) jest więc NIESPEŁNIONY — FC nie powinien traktować tematu jako gotowego bez tej części.

## BLOKADY
- Brak dowodu w Chromium i brak zrzutu (patrz wyżej). Do domknięcia: live-test wzorowany na `gra/tools/ai-trade-wiring-e2e-live-test.cjs` (oferta AI→gracz 40 cegły za 10 żelaza) + zrzut + mutacja w przeglądarce.

## ZAŁOŻENIA (luki w dispatchu)
- Wariant 'incomingAccepted' dobrano tak, by ton i tekst wiersza zgadzały się z werdyktem „Możesz przyjąć". Przy aktywnym „Przyjmij" tekst opisuje stronę relacji (silniejsza/słabsza/baza), bez żądania dopłaty.
- Dla `isIncomingBasketTradePanel` z `canAccept !== false` werdykt zawsze daje tone `ok`, więc zmiana nie dotyka kolorów werdyktu.

## NASTĘPNY KROK
Evaluator: przegląd diffu (jeden plik źródłowy + test), dowód live w Chromium (zrzut + mutacja w przeglądarce), potem Final Control.

RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
