# 30 — Obrona Operatora (odpowiedź na FC r2), R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1

STATUS: PASS-WITH-NOTES (zarzuty 1 i 4 przyjęte i naprawione; zarzut 2 przyjęty częściowo; zarzuty 3 i 5 przyjęte, NIE ZROBIONE w tej rundzie; zarzut 6 przyjęty — merge wykonany, dokumentacja NIE ZROBIONE)
DOMAIN: GAME (dyplomacja, wycena koszyka handlu, epoka umowy)
TEMAT: R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1
GOAL: krok/blok handlu surowcem zależny od epoki umowy (Kamień 10 / Brąz 50 / Żelazo 100 szt. na 1 PN; epoka umowy = wyższa z epok stron); ta sama epoka w oknie, ocenie propozycji, Szybkiej umowie i ofertach AI.
ZMIANY-COMMIT:
- baza kandydata: 969edd214 (runda 2 Operatora)
- 230fd049f — poprawka zarzutu 1 (okno: onSubmit w epoce umowy) i zarzutu 2 (opakowania ocen propozycji w main.ts + hooki testowe)
- b3bef1f0b — merge origin/main 115422be5 (bez konfliktów)
- 185562f8f — merge origin/main 807ecebdd (FALA 741, QTY-CAP r2); konflikt w gra/src/game/ai-trade-proposal.ts rozwiązany wersją origin/main + ponownie dodany parametr `tradeEra` (krok i normalizacja ilości w `selectAiTradeBarter`, 4 miejsca)
- Pliki zmienione względem origin/main w tej rundzie (tylko gra/src): main.ts, ui/diplomacyTradeBasket.ts, game/ai-trade-proposal.ts. Allowlista zachowana; `gra/` nie zmieniane przez build.
- Ten plik raportu: osobny commit (hash w odpowiedzi orkiestratora).

## Odpowiedzi na zarzuty FC r2

**Zarzut 1 (epoka umowy ustawiona tylko globalnie na czas okna; closeModal przywraca epokę gracza przed onSubmit): PRZYJMUJĘ — NAPRAWIONE.**
- `gra/src/ui/diplomacyTradeBasket.ts` (przycisk zatwierdzenia, ok. l.3182-3186): po `closeModal()` (które przywraca epokę gracza) `onSubmit(payload)` jest wołane w `withDiplomacyTradeEra(ctx.tradeEra, ...)`. Ocena propozycji, `resolveProposalPn` i walidacja po stronie `onSubmit` liczą więc w epoce umowy. Gdy `ctx.tradeEra == null`, zachowanie jak dotąd.
- Dowód kodu: `grep -n "withDiplomacyTradeEra(ctx.tradeEra, () => onSubmit" gra/src/ui/diplomacyTradeBasket.ts`.
- Brak testu DOM tej ścieżki (patrz zarzut 3). Dowód jest na poziomie kodu, nie na poziomie klikniętego przycisku.

**Zarzut 2 (diplomacy-proposals.ts i diplomacy-ai-offer-balance.ts zależą od globalu; brak jawnej epoki/kontekstu): PRZYJMUJĘ CZĘŚCIOWO — NAPRAWIONE na poziomie wejść do oceny w main.ts; pełna jawna epoka w funkcjach diplomacy-*.ts NIE ZROBIONA.**
- Dodany helper `dealTradeEraForOwners(a, b) = diplomacyDealTradeEra(empireEpochForOwner(a), empireEpochForOwner(b))` obok `empireEpochForOwner` (main.ts).
- Funkcje main.ts, które oceniają propozycję, zostały owinięte w `withDiplomacyTradeEra(dealTradeEraForOwners(...), ...)` przez opakowanie `...args` (oryginał przemianowany na `*Impl`):
  - `enqueueNegotiationFromAiCmd` (AI -> gracz; para AI, ME()),
  - `packageSiblingPn` (proposer, responder),
  - `previewNegotiationEntry` (owners z wpisu negocjacji; sygnatura jawna, bo test źródłowy `diplomacy-fairness-gate-package-q2-test` czyta jej tekst),
  - `applyProposalOutcome` (proposer, responder),
  - `previewNegotiatedProposal` (0, ownerId).
- Istniejące opakowanie `pickAiPlayerCyclicBarterImpl` (round 1) pozostaje.
- Okno koszyka (ctx.tradeEra) ustawia epokę na czas otwarcia (round 1), więc podgląd UI w `diplomacyAcceptanceBalance.ts` (l.753, 849) też liczy w epoce umowy, dopóki okno jest otwarte.
- NIE ZWERYFIKOWANO: pełnej listy wywołań `diplomacyFairGivePn`, `diplomacyNormalizeSurowiecIlosc`, `handelRequiredPn` z innych ścieżek (np. tury AI bez przejścia przez powyższe funkcje). Nie zrobiono grep-audytu każdego wywołania; pokrycie jest wnioskowane z wejść.
- Dług: parametr `tradeEra` nie został dodany do `diplomacy-proposals.ts` i `diplomacy-ai-offer-balance.ts` (zarzut dispatchu: jawny kontekst). Zostaje w kolejnej rundzie.

**Zarzut 3 (brak testu DOM okna w Brązie i Żelazie; brak testu bramki w epokach 2 i 3 na ścieżce UI; brak mutacji UI): PRZYJMUJĘ — NIE ZROBIONE w tej rundzie.**
- Powód: test DOM wymaga zbudowania aplikacji (vite build poza repo) i Chromium oraz otwarcia okna z mapy. Nie wykonano tego w tej rundzie.
- Zostaje jako zadanie kolejnej rundy: (d) DOM okna w Brązie i Żelazie, (c) bramka uczciwości w epokach 2 i 3 na ścieżce UI, mutacja „blok 10 w Brązie" na ścieżce UI.

**Zarzut 4 (zapis/wczytanie; obcięcie starych ofert; miejsca ustawiające player.era): PRZYJMUJĘ CZĘŚCIOWO.**
- Zrobione: `setDiplomacyTradeEra` jest wołane przy nowej grze (main.ts ok. l.46924), przy wczytaniu zapisu (ok. l.48948) i przy zmianie epoki gracza (ok. l.2630). Dodane w tej rundzie: hooki testowe `setPlayerEra`, `setPlayerEraForTest` i reset epoki w hooku ok. l.28756 wołają `setDiplomacyTradeEra(era)`.
- NIE ZROBIONE: dwa miejsca testowe `player.era = 2;` (ok. l.48054 i 48276, scenariusze testowe) nadal nie wołają `setDiplomacyTradeEra`. Wzorzec z edycją nie był jednoznaczny (dwa identyczne trafienia); zostaje do poprawy w kolejnej rundzie.
- NIE ZROBIONE: obcięcie ilości starych zapisanych propozycji i ofert do kroku epoki przy wczytaniu (DODATEK 2 pkt 3). Brak implementacji i brak testu snapshot/restore.
- NIE ZROBIONE: test realnej ścieżki zapisu (buildSaveGameSnapshot/restore).

**Zarzut 5 (test mieszanych epok tylko dla computeQuickDealBasket i selectAiTradeBarter): PRZYJMUJĘ — NIE ZROBIONE.**
- Zostaje: test mieszanych epok (Brąz+Kamień = blok 50) dla okna, oceny propozycji po zatwierdzeniu, bramki i walidacji. Wymaga testu DOM lub testu wywołania `applyProposalOutcome`, których nie ma.

**Zarzut 6 (merge z FALA 740; Civpedia/poradnik; dług Rust pn_per_szt): PRZYJMUJĘ — merge WYKONANY, dokumentacja NIE ZROBIONA.**
- Merge: origin/main 807ecebdd (zawiera FALA 740 i FALA 741) scalony do kandydata, bez regeneracji wikiBundle (nie zmieniano dokumentacji w tej rundzie). Konflikt w `ai-trade-proposal.ts` rozwiązany zgodnie z zasadą dispatchu „nie zmieniaj logiki ilości z tematu QTY-CAP": logika QTY-CAP z origin/main zachowana, dodano tylko parametr epoki.
- Dług Rust `pn_per_szt` w `gra/tools/.dip-audit-bundle.cjs` (poza allowlistą): nie ruszany, tylko wypisany.
- Civpedia i poradnik gracza (handel, punkty negocjacji, bloki 10/50/100): NIE ZROBIONE, NIE ZMIERZONO treści.

## Dowody (surowe wyniki, uruchomione w tej rundzie)

- `npx tsc --noEmit -p .` (gra/): brak wyjścia, kod wyjścia 0 — po każdej zmianie oraz po merge (807ecebdd).
- Wyniki testów Node w `gra/tools/`:
  - diplomacy-trade-era-deal-test: 14 pass, 0 fail
  - diplomacy-trade-era-ai-test: 14 pass, 0 fail
  - diplomacy-trade-era-table-test: 185 pass, 0 fail
  - diplomacy-fairness-gate-package-q2-test: 24 pass, 0 fail (po poprawce tekstu sygnatury `previewNegotiationEntry`; przed poprawką 23/1)
  - diplomacy-acceptance-points-test: 304 pass, 0 fail
  - diplomacy-value-catalog-test: 82 pass, 0 fail
  - diplomacy-resource-cyclic-trade-test: 53 pass, 0 fail
  - diplomacy-ai-offer-balance-test: 29 passed, 0 failed
  - ai-trade-oneshot-overpay-limit-test: 10 assertions passed (na kandydacie po merge z 807ecebdd; przed merge czerwony, bo kandydat miał starą wersję testu względem main.ts)
- Przegląd całej rodziny `tools/diplomacy-*.cjs`, `tools/trade*.cjs`, `tools/ai-trade*.cjs` na kandydacie po merge (kod wyjścia != 0):
  - testy live (Chromium / timeout 60 s): diplomacy-border-era-penalty-live-test (124), diplomacy-city-cession-live-test (124), diplomacy-relation-value-mismatch-live-test (124), diplomacy-direct-negotiation-live-test (1), diplomacy-relation-deal-text-consistent-live-test (1), ai-trade-wiring-e2e-live-test (1), trade-route-remove-stock-flow-live-test (2). NIE ZMIERZONO na bazie, poza dwoma z listy niżej.
  - testy nie-live, czerwone również na bazie origin/main (kopia `git archive origin/main gra`, ten sam node_modules): diplomacy-city-cession-r3-test (1 na bazie, 1 na kandydacie), diplomacy-stol-pw-sum-test (1 na bazie, 1 na kandydacie). Nie są regresją tej rundy.
  - na bazie origin/main także: diplomacy-direct-negotiation-live-test (1), diplomacy-relation-deal-text-consistent-live-test (124), ai-trade-wiring-e2e-live-test (124) — czerwone też na bazie, zatem nie regresja.
- Brak testów zmienionych w tej rundzie: `main.ts` i `diplomacyTradeBasket.ts` nie mają nowego testu DOM (zarzut 3).

## BLOKADY

- Test DOM okna (Brąz, Żelazo, bramka, mutacja UI) — NIE ZROBIONE (zarzut 3).
- Test mieszanych epok na ścieżce zatwierdzenia i oceny — NIE ZROBIONE (zarzut 5).
- Jawna epoka w `diplomacy-proposals.ts` i `diplomacy-ai-offer-balance.ts` — NIE ZROBIONE (zarzut 2, część).
- Obcięcie starych zapisanych ofert/propozycji do kroku epoki — NIE ZROBIONE (zarzut 4).
- Dwa testowe `player.era = 2;` bez `setDiplomacyTradeEra` (ok. l.48054, 48276) — NIE ZROBIONE (zarzut 4).
- Civpedia / poradnik / wikiBundle — NIE ZROBIONE (zarzut 6).
- Testy live (Chromium) — NIE ZMIERZONO w pełnym zakresie.

## Założenia (DO POTWIERDZENIA)

- Epoka umowy dla wrapperów = `diplomacyDealTradeEra(empireEpochForOwner(a), empireEpochForOwner(b))`, gdzie owner 0 = gracz.
- Wrappery w main.ts są opakowaniami (`...args`) z zachowaniem sygnatur; funkcje `*Impl` zachowują dotychczasowe zachowanie.

## RUNDY

2/5 (ta odpowiedź na FC r2). Poprzednia runda: FC r2 FAIL, zarzuty 1–6.

## NASTĘPNY KROK

Runda 3: (a) DOM test okna Brąz/Żelazo + bramka + mutacja (Chromium, build poza repo); (b) jawny kontekst epoki w diplomacy-proposals.ts i diplomacy-ai-offer-balance.ts; (c) hooki `player.era = 2` w testach; (d) obcięcie zapisanych ofert przy wczytaniu; (e) test mieszanych epok na ścieżce zatwierdzenia; (f) Civpedia i poradnik; regeneracja wikiBundle.

## DEPLOY/PUSH

NIE WYKONANO (commit lokalny w worktree; bez push na main, bez integracji, bez deployu).
