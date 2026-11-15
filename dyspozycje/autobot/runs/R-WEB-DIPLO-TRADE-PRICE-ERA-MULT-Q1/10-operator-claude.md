# R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 — raport Operatora, runda 2/5

STATUS: BLOCK (częściowo: kod i testy dodane, pełne kryteria FC r1 NIE domknięte)
DOMAIN: GAME (dyplomacja, wycena koszyka handlu)
TEMAT: R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1
GOAL: handel surowcami blokowymi: krok/blok zależy od EPOKI UMOWY (Kamień 10 / Brąz 50 / Żelazo 100 szt. za 1 PN; cena za blok bez zmian); epoka umowy = wyższa z epok stron; jedna epoka w całym handlu (okno, Szybka umowa, AI, bramka, walidacja).
BAZA: kandydat Obrony `51f996d6e` (kod `770aa4fed`), merge `origin/main` (08b7f67b4) → commit `74823da9e` (merge bez konfliktów, wikiBundle nie wymagał regeneracji w tym merge).
ZMIANY-COMMIT: kod operatora dodany w commicie na gałęzi detached HEAD (SHA czubka: patrz pole `sha` w StructuredOutput); pliki:
- gra/src/game/diplomacy-pn-engine.ts — `QuickDealInput.tradeEra?`; `computeQuickDealBasket` opakowany w `withDiplomacyTradeEra(input.tradeEra ?? globalna)`, logika przeniesiona do `computeQuickDealBasketImpl` (ziarno ilości = blok epoki, nie stałe 10).
- gra/src/ui/diplomacyNegotiationModal.ts — pole `NegotiationModalContext.tradeEra?`.
- gra/src/ui/diplomacyTradeBasket.ts — `showTradeBasketModal` ustawia epokę umowy z `ctx.tradeEra` na czas otwarcia okna, `closeModal` przywraca poprzednią; `openQuickDealBasket` liczy Szybką umowę w epoce umowy.
- gra/src/main.ts — ctx okna handlu dostaje `tradeEra: diplomacyDealTradeEra(player.era, empireEpochForOwner(ownerId))`; Szybka umowa AI→gracz (ok. l.20982) liczona w epoce umowy z partnerem.
- gra/tools/diplomacy-trade-era-deal-test.cjs (nowy) — 14 asercji: ziarno Szybkiej umowy 10/50/100, zapas poniżej bloku = 0, jawna epoka niezależna od globalnej, mieszane Braz+Kamień = blok 50, mutacja blok 10 w Brązie, determinizm, przywracanie epoki po wyjątku.

ZMIERZONO (liczby z surowego wyjścia):
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/diplomacy-trade-era-table-test.cjs`: 185 pass / 0 fail.
- `node tools/diplomacy-trade-era-ai-test.cjs`: 14 pass / 0 fail (w tym: oferta AI w Brązie giveQty 1200 = wielokrotność 50).
- `node tools/diplomacy-trade-era-deal-test.cjs`: 14 pass / 0 fail (nowy).
- `node tools/diplomacy-value-catalog-test.cjs`: 82 / 0.
- `node tools/diplomacy-acceptance-points-test.cjs`: 304 / 0.
- `node tools/diplomacy-ai-offer-balance-test.cjs`: 29 passed / 0 failed.
- `node tools/diplomacy-ai-balance-test.cjs`: 36/36 PASS.
- `node tools/ai-trade-proposal-to-player-test.cjs`: 25 assertions passed.
- `node tools/ai-trade-need-from-surplus-test.cjs`: 12 passed / 0 failed.
- Cała rodzina `diplo*|diplomacy*|trade*|ai-trade*` (153 skrypty) uruchomiona: 133 zakończone exit 0. Pozostałe niezielone:
  - Czerwone także na bazie `origin/main` (zmierzone w wyeksportowanym drzewie `origin/main`, ta sama komenda, exit 1/2): `ai-trade-oneshot-overpay-limit-test` (dług #379), `diplo-truce-r1-test` (exit 1), `diplomacy-city-cession-r3-test` (exit 1), `diplomacy-stol-pw-sum-test` (exit 1), `trade-route-remove-stock-flow-live-test` (exit 2). Nie są związane z epoką handlu. Brak nowej czerwieni względem bazy w tych pięciu.
  - Live (Chromium, `require('playwright')` działa): ~13 skryptów `*-live-test` przekroczyło limit 25–60 s (exit 124) — NIE ZMIERZONO (nie zdążono przeanalizować; nie wiadomo, czy to infra czy regresja).
- `git diff --check`: czysto.

NIE ZMIERZONO / NIE ZROBIONE (wprost, zgodnie z FC r1):
- (c) bramka uczciwości w UI (diplomacyFairGivePn w epokach 2 i 3, podgląd = bramka) — brak testu DOM, nie zweryfikowano.
- (d) realny DOM okna „Umowa wymiany surowców” w Brązie i Żelazie (Chromium) — NIE ZROBIONE. Brak testu; okno ustawia epokę przez `ctx.tradeEra`, ale nie ma dowodu w przeglądarce.
- Walidacja przy zatwierdzeniu (payload gracza → silnik): NIE sprawdzona. `validateTradeBasketSides` i ścieżka `onSubmit` w main.ts (ok. l.13192/13440/21929) nadal mogą liczyć w epoce globalnej gracza — możliwy rozjazd okno vs silnik dla mieszanych epok. Do domknięcia.
- Stare zapisane propozycje/oferty (obcięcie ilości do kroku epoki przy wczytaniu) — NIE ZROBIONE.
- Ładowanie zapisu / nowa gra ustawiają epokę (main.ts ~46885, ~48909) — obecne z r1, NIE zweryfikowane nowym testem.
- Mutacja na ścieżce UI i gry (blok 10 w Brązie ⇒ czerwono w teście DOM/grze) — NIE ZROBIONE (mutacja tylko na poziomie katalogu/silnika).
- `diplomacy-proposals.ts` (wiele `diplomacyNormalizeSurowiecIlosc`/`diplomacyFairGivePn` bez jawnej epoki, ~l.627/637) i `diplomacy-ai-offer-balance.ts` (bez jawnej epoki w `diplomacyHandelSurowiecCenaZaBlok`) — nie przepięte jawnie; działają na epoce globalnej ustawionej w oknie/przez wrapper.
- `gra/data/diplomacy-acceptance-points.json` (opis `pn_per_szt` → `pn_per_blok`) — NIE ZROBIONE.
- Dokumentacja (Civpedia, poradnik gracza, wikiBundle regeneracja) — NIE ZROBIONE.
- Dług Rust: `gra/tools/.dip-audit-bundle.cjs` (l.105, opis `pn_per_szt`) i opisy rust-port — poza allowlistą, tylko wypisane (REPIN).

ZAŁOŻENIA (DO POTWIERDZENIA):
- Okno handlu ustawia globalną epokę na czas otwarcia i przywraca przy zamknięciu (`closeModal`). Założenie: w trakcie okna nie ma tur AI, które liczyłyby w epoce gracza.
- Epoka umowy dla AI→gracz (main.ts ~20982) = `diplomacyDealTradeEra(player.era, empireEpochForOwner(ownerId))`, zgodnie z `pickAiPlayerCyclicBarter`.

BLOKADY:
- Brak dowodu DOM (d) i (c); brak testu walidacji przy zatwierdzeniu; live-testy Chromium nie przeszły w limicie czasu. Bez tego FC r1 pkt 1 (jedna epoka w CAŁYM handlu) nie jest domknięty.

RUNDY: 2/5 (r1: FC FAIL; r2: ten raport, Operator HAIKU; brak eskalacji do Sonnet — pierwsza nieudana runda Haiku tego tematu, więc Sonnet dopiero po kolejnej nieudanej).

NASTĘPNY KROK: Evaluator (Sonnet) + Obrona: (1) przepiąć walidację przy zatwierdzeniu i `diplomacy-proposals`/`diplomacy-ai-offer-balance` na jawną epokę umowy; (2) test DOM okna w Brązie/Żelazie (Chromium, build vite poza repo); (3) zmierzyć live-testy na bazie i po zmianie.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch wskazywał BAZĘ `4b72baf86` (FC report commit na origin/main-linii, bez kodu). Kod kandydata to `51f996d6e`; zastosowano dodatek (merge origin/main do `51f996d6e`), nie zerowanie od `4b72baf86`.
- Live-testy nadpisują pliki `dyspozycje/.../dowody/*.png` przy uruchomieniu. Przywrócono je `git checkout` przed commitem; warto, żeby Evaluator robił to samo.
- `gra/node_modules` zainstalowane `npm ci` (tylko do tsc/testów); do usunięcia po pracy zgodnie z zasadą sprzątania.
