# 30 — Obrona Operatora (runda 4, odpowiedź na zarzuty Evaluatora r3), R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1

STATUS: PASS-WITH-NOTES (zarzut 1 PRZYJĘTY i naprawiony z testem mutacyjnym; zarzut 2 PRZYJĘTY i naprawiony; zarzut 3 ODRZUCONY z dowodem; zarzuty 4 i 5 informacyjne, bez zmian kodu)
DOMAIN: GAME (dyplomacja, wycena koszyka handlu)
TEMAT: R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1
GOAL: blok handlu surowcem zależy od epoki UMOWY (wyższa z epok stron): Kamień 10 / Brąz 50 / Żelazo 100 szt. za ten sam PN. Umowa cykliczna trzyma epokę z chwili zawarcia i nie jest obcinana po awansie.
BAZA: 2235dd6f30cc8ad0fa814e9256801b1d96a00b00 (kandydat Operatora r3, potomek origin/main 807ecebdd)
ZMIANY-COMMIT: `9f56ea8cf` (kod + test; 4 pliki, +94/−14), ten raport w osobnym commicie.
RUNDY: 4/5 (obrona po Evaluatorze r3; Operator Sonnet uzasadniony po 2 nieudanych rundach Haiku)
NASTĘPNY KROK: Evaluator r4 (weryfikacja zarzutów 1-2 i testu H), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Zarzut 1 (istotny, cykliczne umowy) — PRZYJĘTY, naprawiony

Przyczyna (potwierdzona odczytem kodu): `tickCyclicResourceTradeDeals` (main.ts ok. 25347) normalizował `it.pakietyPerTura` w globalnej epoce gracza i zapisywał wynik trwale. `diplomacyNormalizeSurowiecIlosc` zwraca 0 poniżej bloku, więc umowa 10 szt. drewna zawarta w Kamieniu zerowała się po awansie gracza do Brązu.

Poprawka (commit `9f56ea8cf`):
- `diplomacy-treaties.ts`: nowe pole `epokaUmowy?: 1|2|3` na `HandelSurowiecCyklicznyItem` (zamrożona epoka umowy).
- `diplomacy-proposals.ts`: `buildHandelSurowiecCykliczny` zapisuje `epokaUmowy` (wyższa z epok stron, jak przy wycenie). Nowe funkcje `cyclicItemTradeEra` (zamrożona epoka, a dla zapisu sprzed r4 epoka pary `dealTradeEraForOwners`) i `cyclicSelfHealPakiety` (`diplomacyClampQtyToEraBlock` — wielokrotność bloku, min. 1 blok, 0 zostaje 0).
- `main.ts` (self-heal, ok. 25347): `if (it.epokaUmowy === undefined) it.epokaUmowy = cyclicItemTradeEra(it, dealTradeEraForOwners); normalized = cyclicSelfHealPakiety(it, dealTradeEraForOwners)`. Zamiast globalnej epoki gracza.
- `main.ts` (jednorazowy transfer, `transferBasketItems` ok. 13415): normalizacja w `withDiplomacyTradeEra(dealTradeEraForOwners(fromOwnerId, toOwnerId), ...)`.

Założenie (ZAŁOŻENIE, DO POTWIERDZENIA przez właściciela): zapisy sprzed r4 nie mają pola `epokaUmowy`; ich epoka to wyższa z epok pary w chwili pierwszego ticku po wczytaniu, a ilość jest podnoszona do min. 1 bloku (nie zerowana). Zgodne z 3(b) DODATKU 3 („min. 1 blok; nie usuwaj oferty”). Pole zapisuje się przez zwykłą serializację `activeDeals` (brak whitelisty w `diplomacy-treaties.ts`; NIE ZMIERZONO round-trip zapisu z nowym polem w przeglądarce).

Dowód testowy (`gra/tools/diplomacy-trade-era-explicit-test.cjs`, sekcja H, 11 nowych asercji):
- umowa zawarta w Kamieniu: 10 szt., `epokaUmowy=1`;
- para w Żelazie, zamrożona umowa: `cyclicSelfHealPakiety` = 10 (nie 0, nie 100);
- legacy, para w Brązie: 50 (min. 1 blok); legacy z globalną epoką gracza w Żelazie nie zmienia wyniku (10);
- legacy: `cyclicItemTradeEra` bierze parę (seller, buyer);
- ilość 0 zostaje 0;
- wiring w `main.ts` (asercje na źródło): self-heal w `dealTradeEraForOwners`, brak starego wzorca `diplomacyNormalizeSurowiecIlosc(it.surowiecKey, it.pakietyPerTura)`, transfer koszyka i wypłata AI w epoce pary.

Mutacje (ZMIERZONO):
- `TRADE_ERA_EXPLICIT_MUTATE=cyclic-global` (epoka gracza zamiast pary): 49 pass / 2 fail (czerwone);
- `TRADE_ERA_EXPLICIT_MUTATE=cyclic-nofreeze` (bez zamrożenia): 50 pass / 1 fail, „got 100, want 10” (czerwone).

## Zarzut 2 (średni, pozostałe wywołania bez epoki pary) — PRZYJĘTY, naprawiony

Zweryfikowane miejsca (grep + odczyt kodu):
- `main.ts` `aiPeacePaymentAssets` (ok. 38247): wypłata za pokój liczona w epoce PARY przegrany↔zwycięzca (`payEra = dealTradeEraForOwners(loserId, winnerId)`) — NAPRAWIONE; normalizacja i `diplomacyPnSurowiecIlosc` dostają `payEra`.
- `main.ts` `pickResourceTradeRelOffer` (ok. 24408): owinięte w `withDiplomacyTradeEra(dealTradeEraForOwners(proposerOwnerId, partnerOwnerId), ...)` — pokrywa `pickResourceDeficitForOwnerPair` (ok. 24461), wywołania w `pickResourceTradeRelOfferRaw` i wywołanie z 44032 (oferta AI→gracz). NAPRAWIONE.
- `main.ts` `pickResourceSurplusForOwnerPair` (ok. 24648): owinięte w epokę pary sprzedawca↔kupujący. NAPRAWIONE.
- `main.ts` `formAiAiTradeAgreementsIfEligible` (ok. 24838–24862): cztery wyceny (deficyt i nadwyżka, obie kierunki) owinięte w `withDiplomacyTradeEra(dealTradeEraForOwners(a, b), ...)`. NAPRAWIONE.
- `diplomacy-ai-balance.ts:247` (`clampAiResourceTradeCommand`): wywoływane z `main.ts:21005` wewnątrz `enqueueNegotiationFromAiCmdImpl`, a ta jest owinięta w `withDiplomacyTradeEra(dealTradeEraForOwners(args[0], ME()), ...)` (ok. 20979). POKRYTE (odczyt kodu, nie dynamicznie).
- `diplomacy-resource-trade-pick.ts:62` (`buildOffer`): wołane tylko z funkcji pick, które teraz mają epokę pary na wejściu wywołania. POKRYTE jak wyżej.
- `main.ts:24528` (`pickAiPlayerCyclicBarterImpl`): w `withDiplomacyTradeEra(tradeEra, ...)` (ok. 24576). POKRYTE.

Test: sekcja H (wiring, asercje na źródło `main.ts`) pilnuje wzorców wypłaty AI, transferu koszyka i oferty AI↔gracz. Brak dynamicznego testu każdej ścieżki AI↔AI (NIE ZMIERZONO w grze).

## Zarzut 3 (drobny, test `computeQuickDealBasket`) — ODRZUCONY z dowodem

Kod nie przecieka epoki gracza: `main.ts:21023` podaje epokę jawnie (`withDiplomacyTradeEra(diplomacyDealTradeEra(player.era, empireEpochForOwner(ownerId)), () => computeQuickDealBasket(...))`), a `diplomacy-pn-engine.ts` polega na tym wrapperze. Brak defektu, więc nie dodaję testu. Uwaga: to nie jest test regresji dla samego wywołania bez epoki (jeśli pojawi się w przyszłości wywołanie bez wrappera, pokryje to tylko przegląd kodu).

## Zarzut 4 (informacyjny, decyzja ABC) — PRZEKAZANE do właściciela, bez zmian kodu

Oferta AI w Brązie/Żelazie przy małej potrzebie = 150/300 szt. przez podłogę 1 bloku w `aiNeedPerTurn`. Zgodne w PN, sprzeczne z literą „≤3× potrzeby” (QTY-CAP). Pytanie ABC do właściciela: czy podłoga 1 blok ma zostać, czy limit ma wygrać. Kod ilości z tematu QTY-CAP nie był zmieniany.

## Zarzut 5 (informacyjny, dług REPIN) — ZAPISANE, bez zmian

`pn_per_szt` → `pn_per_blok` w `gra/tools/.dip-audit-bundle.cjs` i opisach `rust-port` — poza allowlistą tematu, nie ruszane (REPIN w osobnym temacie).

## Wyniki bramek (ZMIERZONO na `9f56ea8cf`, surowe wyjścia)

- `npx tsc --noEmit` — exit 0, zero błędów.
- Bramki referencyjne: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `ALL GREEN`; unit-replace-test `21/21`; combat-test `All sanity checks passed.`
- Testy tematu: diplomacy-trade-era-table `185 pass, 0 fail`; trade-era-ai `14/0`; trade-era-deal `14/0`; **trade-era-explicit `51 pass, 0 fail`** (wcześniej 40/0; +11 w sekcji H); **trade-era-dom (Chromium, realny przycisk okna) `58 pass / 0 fail`**; **trade-era-saveload-live (świeży build poza repo) save `5 pass / 0 fail`, load `8 pass / 0 fail`**.
- Testy powiązane: value-catalog `82 pass`; acceptance-points `304 pass`; ai-offer-balance `29 passed, 0 failed`; ai-trade-proposal-to-player `25 assertions passed`; ai-trade-need-from-surplus `12 passed, 0 failed`; ai-trade-oneshot-overpay-limit `10 assertions passed`.
- Dług bazowy (identyczny z pomiarem Evaluatora na bazie, bez nowych czerwieni): diplo-truce-r1 `28 pass / 3 fail`; diplomacy-city-cession-r3 `56 pass / 17 fail`; diplomacy-stol-pw-sum `167 pass / 1 fail`.
- Mutacje: DOM blok10 / submit-global / explicit ctx-ignored / clamp-noop (z r3, bez zmian) oraz cyclic-global i cyclic-nofreeze (nowe, czerwone).
- `git diff --check`: czysto. Allowlista: 4 pliki kodu/testu w `gra/` (`diplomacy-proposals.ts`, `diplomacy-treaties.ts`, `main.ts`, `diplomacy-trade-era-explicit-test.cjs`) + ten raport.

## Nie zmierzone (NIE ZMIERZONO)

- Brak dynamicznego testu ścieżki samonaprawy cyklicznej w pełnej grze (tick w przeglądarce). Pokryte testem czystych funkcji i asercjami na źródło `main.ts`, nie realnym tickiem.
- Round-trip zapisu z polem `epokaUmowy` (serializacja `activeDeals`) — nie sprawdzony w przeglądarce.
- Testy `*-live` poza save-load (nie uruchamiane w tej rundzie).

## Uwagi dla orkiestratora (UWAGI-DLA-ORKIESTRATORA)

- Dług REPIN: `pn_per_szt` w `gra/tools/.dip-audit-bundle.cjs` (poza allowlistą).
- Pytanie ABC (zarzut 4): podłoga 1 bloku w ofertach AI vs limit ≤3× potrzeby.
- Dysk: po pracy usunięto `gra/node_modules` tego worktree i scratch bundle testu live w scratchpadzie. Stan `/tmp` i dysku na końcu raportu w odpowiedzi.
