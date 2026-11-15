# R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 — raport Operatora, runda 3/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja, wycena koszyka handlu)
TEMAT: R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1
GOAL: blok handlu surowcem zależy od epoki UMOWY (wyższa z epok stron): Kamień 10 / Brąz 50 / Żelazo 100 szt. za ten sam PN (cena za blok bez zmian); jedna epoka w oknie, podglądzie, ocenie AI, bramce uczciwości, Szybkiej umowie, ofertach AI, zatwierdzeniu i zapisie.
BAZA: kandydat Obrony r2 `692147055` (potomek origin/main 807ecebdd; `git merge-base --is-ancestor origin/main HEAD` = OK). Uwaga: SHA 8cd4b02a1 z zadania to commit gałęzi dispatchów (bez kodu), kod pochodzi z 692147055 zgodnie z DODATKIEM 3.
ZMIANY/COMMIT: SHA czubka w polu `sha` StructuredOutput. Pliki:
- gra/src/game/diplomacy-value-catalog.ts — `DiplomacySumPnOptions.tradeEra` (jawna epoka w wycenie koszyka), `diplomacyClampQtyToEraBlock`, `diplomacyClampBasketItemsToEraBlock` (migracja zapisów: floor do bloku, min. 1 blok).
- gra/src/game/diplomacy-pn-engine.ts — `ResolveProposalPnOptions.tradeEra` -> `buildProposalPnSumOpts`; `QuickDealInput.tradeEra` przekazane do `trimQuickDealGiveToTolerance`.
- gra/src/game/diplomacy-proposals.ts — `ProposalEvalContext.tradeEra`; `evaluateProposal` i `generateCounterOffer` wyceniają w `ctx.tradeEra` (domyślnie epoka globalna), `pnOpts.tradeEra`; `buildHandelSurowiecCykliczny(…, tradeEra)`; `resolvePlayerAcceptsAiPending(opts.tradeEra)`.
- gra/src/game/diplomacy-ai-offer-balance.ts — krok bloku z `pnOpts.tradeEra` (2 miejsca), `peaceOfferAiRequestBasket(…, tradeEra)`, `trimQuickDealGiveToTolerance(…, tradeEra)`.
- gra/src/main.ts — `buildProposalEvalContext` nadaje `tradeEra = dealTradeEraForOwners(proposer, responder)` (jedyny punkt budowy kontekstu oceny: pokrywa 9 wywołań evaluateProposal); 7 wywołań `resolvePlayerAcceptsAiPending` z jawną epoką; `pnOpts` wyboru oferty AI z `tradeEra`; `peaceOfferAiRequestBasket` z epoką; nowa `syncDiplomacyTradeEra()` używana wszędzie, gdzie zmienia się `player.era` (awans, nowa gra, wczytanie zapisu, hooki testowe 28786/29588/30001 oraz DWA hooki `player.era = 2` — poprzednio bez synchronizacji); migracja zapisu: `negotiationTable` (obie strony koszyka) i `pendingDiplomacyInbox` obcinane w dół do bloku epoki umowy (min. 1 blok, oferta nie znika); hak testowy `__tradeEraSaveLoadTestDebug`.
- docs/encyklopedia/pojecia/handel-surowcami-dyplomacja.md, docs/PORADNIK-GRACZA/12-dyplomacja.md — tabela bloków/cen, zakres jednej epoki umowy, zachowanie starych ofert; gra/src/data/wikiBundle.json zregenerowany po merge (`node tools/bundle-wiki-for-game.cjs`: 22 rozdz. + 182 haseł).
- nowe testy: gra/tools/diplomacy-trade-era-dom-test.cjs, diplomacy-trade-era-explicit-test.cjs, diplomacy-trade-era-saveload-live-test.cjs.

## Miejsca wywołań (grep diplomacyHandel*, diplomacyNormalizeSurowiecIlosc, diplomacyFairGivePn, computeQuickDealBasket, selectAiTradeBarter)
Wszystkie ścieżki liczą w TEJ SAMEJ epoce umowy:
- Okno „Umowa wymiany surowców” (diplomacyTradeBasket.ts): `showTradeBasketModal` ustawia epokę z `ctx.tradeEra` na czas okna (krok, ±, podgląd PN, Fair min), `onSubmit` w `withDiplomacyTradeEra(ctx.tradeEra)` po closeModal; `openQuickDealBasket` w epoce umowy. ctx.tradeEra nadaje main.ts (`diplomacyDealTradeEra(player.era, empireEpochForOwner(ownerId))`).
- Ocena propozycji/bramka uczciwości/walidacja zatwierdzenia: `evaluateProposal`/`generateCounterOffer` z `ctx.tradeEra` (jawnie) + opakowania w main.ts (`applyProposalOutcome`, `previewNegotiationEntry`, `previewNegotiatedProposal`, `packageSiblingPn`, `enqueueNegotiationFromAiCmd`, `pickAiPlayerCyclicBarter`) + `resolvePlayerAcceptsAiPending(opts.tradeEra)`.
- `diplomacyFairGivePn` jest niezależna od epoki (operuje na PN) — rozjazd mógł powstać tylko przez PN, więc wystarcza spójna epoka PN (test D niżej).
- Szybka umowa: `computeQuickDealBasket(input.tradeEra)`; ziarno = blok epoki (poprawione w r2).
- Oferty AI: `selectAiTradeBarter({tradeEra})`; generatory ofert pokoju `peaceOfferAiRequestBasket(tradeEra)`.
- Cykliczne umowy: `buildHandelSurowiecCykliczny(…, tradeEra)` (ilość zamrożona w bloku epoki).
Nie zmieniono: logiki ilości QTY-CAP w ai-trade-proposal.ts (tylko krok/wycena).

## TESTY (ZMIERZONO, surowe wyjście)
- `npx tsc --noEmit` (gra/): 0 błędów (po `npm ci` w worktree: added 71 packages).
- 5 bramek referencyjnych: logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- Testy tematu: trade-era-table 185/0; trade-era-ai 14/0; trade-era-deal 14/0; fairness-gate-package-q2 24/0; value-catalog 82/0; acceptance-points 304/0; ai-offer-balance 29/0; ai-trade-proposal-to-player 25; ai-trade-need-from-surplus 12/0; ai-trade-oneshot-overpay-limit 10 (zielony — dług #379 naprawiony w FALI 741).
- NOWE: `diplomacy-trade-era-explicit-test.cjs` 40/0 — A resolveProposalPn z jawną epoką (Kamień 5 bl.=15 PN, Brąz 1 bl.=3 PN, Żelazo 0); B próg akceptacji evaluateProposal dla 50 szt. kamienia: Kamień 15 vs Brąz 3 PN-zł, brak przecieku globalnej; C mieszane epoki na ścieżce zatwierdzenia (ocena w epoce umowy = próg Brązu, ocena w epoce gracza = inny próg); D bramka = podgląd w Brązie i Żelazie (próg bramki 3 == próg podglądu fairMin 3, 3 bloki ~3x); E buildHandelSurowiecCykliczny/peaceOfferAiRequestBasket/trimResourcePaymentTradeForZeroBalance z jawną epoką; F migracja (250->200, 25->100, 75->50 Brąz, złoto/węgiel bez zmian, brak mutacji wejścia); G determinizm i powrót epoki po wyjątku.
- NOWE: `diplomacy-trade-era-dom-test.cjs` 58/0 w REALNYM Chromium (`chromium.launch()` bez opcji; bundle esbuild poza repo; prawdziwy moduł diplomacyTradeBasket.ts, prawdziwe kliknięcia): krok i przyciski +N/+10N/+100N = 10/50/100 (+10/+100/+1000, +50/+500/+5000, +100/+1000/+10000); mieszane epoki gracz Kamień + umowa Brąz/Żelazo => krok 50/100, globalna epoka wraca do 1 po zamknięciu; SUMA oddaję/dostaję (UI) = PN z katalogu w epoce umowy (3 bloki drewna=3 PN, kamienia=9 PN w każdej epoce); „Fair min” w oknie = diplomacyFairGivePn(receivePn, Rel); ± wiersza koszyka +-N bloku; klik „+” 150->200 (Brąz) i 300->400 (Żelazo); zatwierdzenie: payload w blokach epoki umowy i `onSubmit` liczy w epoce umowy (eraInsideSubmit = 2/3), po zatwierdzeniu epoka wraca do gracza; 0 pageerror.
- NOWE: `diplomacy-trade-era-saveload-live-test.cjs` 5+8 pass/0 (faza save + faza load w NOWEJ sesji przeglądarki, realne persistSaveToSlot/loadGameFromSlot, bundle Vite poza repo): epoka gracza Żelazo + AI Kamień => epoka umowy 3; po wczytaniu przy celowo rozjechanej epoce handlu (1) epoka handlu = 3 z zapisu; oferta na stole 250 -> 200 (obie strony koszyka), oferta w skrzynce 25 -> 100 (min. 1 blok), obie ofert NIE zniknęły. Uwaga środowiskowa ustalona w trakcie: mapa playtest startuje w wojnie z owner 1, a wojna unieważnia propozycje handlu — hak ustawia pokój.
- MUTACJE (CZERWONE, zmierzone): DOM `blok10` (blok 10 w Brązie/Żelazie) => FAIL kroku/przycisków/ilości Brązu i Żelaza; DOM `submit-global` (onSubmit bez epoki umowy) => FAIL „onSubmit liczy w epoce UMOWY” dla 1/2 i 1/3; explicit `ctx-ignored` (evaluateProposal ignoruje ctx.tradeEra) => FAIL B i C; explicit `clamp-noop` => FAIL migracji F; live: bundle bez obcinania ofert przy wczytaniu => FAIL „250 -> 200” i „25 -> 100”; bundle bez `syncDiplomacyTradeEra()` przy wczytaniu => FAIL „epoka handlu ustawiona z zapisu”.
- Rodzina diplomacy-*/diplo-*/trade-*/ai-trade-* (nie-live): 138 plików, 135 zielonych, 3 czerwone: `diplo-truce-r1-test`, `diplomacy-city-cession-r3-test`, `diplomacy-stol-pw-sum-test` — to dług bazowy z listy (#414; Obrona r2 potwierdziła city-cession-r3 i stol-pw-sum jako czerwone na bazie); żaden z nich nie dotyka plików tematu; nie pogorszone przez ten temat (brak nowej czerwieni w testach tematu). NIE ZMIERZONO osobno wyniku tych 3 na czystym origin/main w tej rundzie (brak drugiego worktree z node_modules; ograniczenie zasad git w izolowanym worktree).
- `git diff --check`: czysto (patrz sprawdzenie przed commitem).

## Pomiar okna QTY-CAP (FALA 741, limit oferty AI <= 3x potrzeba) na cenach za blok (pkt 7)
Zmierzone `selectAiTradeBarter` (potrzeba AI na turę 5/10/40/120): odbiór = 3 bloki dla potrzeby poniżej 1 bloku/turę (30 szt. Kamień, 150 Brąz, 300 Żelazo, każdorazowo 6 PN), a przy potrzebie 120/turę: 360 Kamień (36 bl.), 350 Brąz (7 bl.), 300 Żelazo (3 bl.). Wniosek: LIMIT 3x potrzeby w PN jest zgodny (blok = jednostka PN, minimum 3 bloki = 6 PN), ale w SZTUKACH w Brązie/Żelazie oferta przy małej potrzebie (np. 5/turę) wynosi 150/300 szt. = 30x/60x potrzeby, bo `aiNeedPerTurn = max(krok_bloku, ceil(-netRate))` ma podłogę 1 bloku. To nie błąd tego tematu, ale decyzja produktowa (czy przy dużym bloku limit ma schodzić poniżej 3 bloków/1 bloku) — DO ABC właściciela, nie ruszano (zakaz zmiany logiki QTY-CAP).

## Założenia DO POTWIERDZENIA
1. Migracja zapisów: stare propozycje/oferty AI obcinane w dół do pełnego bloku epoki umowy, minimum 1 blok (robocze założenie z DODATKU 3). Nie obcinam ilości już zawartych umów cyklicznych (`activeDeals`) — poza zakresem „propozycji i ofert”.
2. Epoki powyżej Żelaza = blok 100 (jak w GOAL).
3. `diplomacyFairGivePn` pozostaje funkcją PN niezależną od epoki — rozjazd podgląd/bramka wykluczony przez spójną epokę przy wycenie PN, nie przez zmianę fairGive.

## UWAGI-DLA-ORKIESTRATORA
- Dług Rust (REPIN, poza allowlistą — tylko wypisane): `pn_per_szt` -> `pn_per_blok` w `gra/tools/.dip-audit-bundle.cjs` i w opisach rust-port; nowy kontrakt epoki umowy (blok 10/50/100, ceny złota/węgla /5 /10) do przeniesienia w porcie Rust.
- Testy live nadpisują PNG w `dyspozycje/**/dowody` i tworzą render.png — przywrócono (`git checkout`) i usunięto przed commitem.
- Decyzja produktowa do ABC: podłoga 1 bloku w limicie 3x potrzeby AI (patrz pomiar QTY-CAP).

RUNDY: 3/5 (Operator r3 — SONNET 5.5, warunek 2 nieudanych rund Haiku spełniony wg dispatchu)
NASTĘPNY KROK: Evaluator (SONNET) -> Obrona (HAIKU) -> Final Control (SONNET), to samo ID; Evaluator/FC mają uruchomić `npm ci` w gra/ i powtórzyć bramki oraz testy DOM/live (build vite do katalogu POZA repo).
DEPLOY/PUSH: NIE WYKONANO
