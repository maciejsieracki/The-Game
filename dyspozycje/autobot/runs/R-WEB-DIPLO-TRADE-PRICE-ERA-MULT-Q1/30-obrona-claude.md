# 30 — Obrona Operatora (runda 2), R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1

STATUS: FAIL (runda 2 wykonana i zacommitowana; zarzuty 1, 2 i 3 domknięte tylko częściowo lub wcale — szczegóły niżej)
DOMAIN: GAME (dyplomacja, wycena koszyka handlu)
TEMAT: R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1
GOAL: krok/blok handlu surowcem zależny od epoki (Kamień 10, Brąz 50, Żelazo 100 szt. na 1 PN), epoka umowy = wyższa z dwóch stron; testy zgodne z kryteriami (a)–(h) dispatchu.
ZMIANY-COMMIT: kod `770aa4fed` (poprawki zarzutów; pliki po allowliście). Raport: ten plik, osobny commit (podany w odpowiedzi SHA). Baza: `7cee14d3a` (kandydat z rundy 1). Nie integrowano z `origin/main` `45ded9579` — to zadanie orkiestratora (zarzut 0 z Evaluatora: origin/main jest o rundę dalej).

## Odpowiedź na zarzuty Evaluatora (35317ecf8)

| # | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Epoka umowy = wyższa z dwóch stron nie działa w grze | PRZYJMUJĘ CZĘŚCIOWO | Dodano `diplomacyDealTradeEra(playerEra, partnerEra)` i `withDiplomacyTradeEra(era, fn)` (gra/src/game/diplomacy-value-catalog.ts). `pickAiPlayerCyclicBarter` w main.ts liczy epokę umowy `max(player.era, empireEpochForOwner(ownerId))` i wykonuje cały wybór pary w tej epoce; `selectAiTradeBarter` dostał `tradeEra` (gra/src/game/ai-trade-proposal.ts). **Niedomknięte:** okno umowy (`diplomacyTradeBasket.ts`), `diplomacy-ai-offer-balance.ts`, bramka uczciwości w UI, `computeQuickDealBasket` (ziarno jest w epoce gracza) — nadal czytają globalną epokę gracza. Zarzut Evaluatora co do tych ścieżek jest trafny. |
| 2 | Brak testu bramki uczciwości (c) w epokach 2/3 | PRZYJMUJĘ CZĘŚCIOWO | `tools/diplomacy-trade-era-table-test.cjs`: sekcja „zgodnosc jawna/globalna" — dla epok 2 i 3 i każdego z 13 kluczy blokowych wycena jawną epoką równa wycenie globalną. To NIE jest test samej bramki `diplomacyFairGivePn` w grze; brak testu bramki w UI. |
| 3 | Brak testu DOM okna „Umowa wymiany surowców" (d, Playwright) | ODRZUCAM jako NIE ZROBIONE (blokada środowiska) | `require('playwright')` działa, ale `npx playwright install chromium` kończy się „Download failure, code=1" (wynik zmierzony w tej sesji). `/usr/bin/chromium` istnieje, ale dispatch wymaga `chromium.launch()` bez opcji. Build vite (`gra/dist`) nie był robiony. Kryterium (d) pozostaje OTWARTE. |
| 4 | Brak testu AI w Brązie (e); blok 10 w pn-engine:454 | PRZYJMUJĘ | Nowy test `tools/diplomacy-trade-era-ai-test.cjs` (14/0): `selectAiTradeBarter` z `tradeEra=2`, stock 1234 → `giveQty` 1200, `receiveQty % 50 == 0`, PN > 0 po obu stronach; kontrola Kamień 1234→1230, Żelazo 1234→1200 (blok 100); epoka umowy (gracz Kamień + AI Brąz) → blok 50; mutacja „blok 10 w Brązie" nie przechodzi. Bug z pn-engine: `Math.min(10, maxQty)` zastąpiono `Math.min(diplomacyHandelSurowiecKrok(pick.id), maxQty)` (diplomacy-pn-engine.ts, `computeQuickDealBasket`) — w Kamieniu identyczne (krok 10), w Brązie daje 50 zamiast 0. **Ta poprawka nie ma testu** (bundlowanie diplomacy-pn-engine.ts nie było robione). |
| 5 | Wczytanie zapisu i nowa gra nie ustawiają epoki handlu | PRZYJMUJĘ | main.ts: `setDiplomacyTradeEra(player.era)` po `player.era = ERA_MAP[params.epochId]` (nowa gra) i po `overlayDepositEra = player.era` w `restoreGameFromSave` (wczytanie). Stare zapisane propozycje/oferty (obcinanie do kroku epoki) — NIE zrobione; wymaga decyzji właściciela (ABC: czy obcinać, czy odrzucać). |
| 6 | Poradnik i wikiBundle nieaktualne | PRZYJMUJĘ | `docs/PORADNIK-GRACZA/12-dyplomacja.md` (akapit „Epoka handlu surowcami"), `docs/encyklopedia/pojecia/handel-surowcami-dyplomacja.md` (akapit „Epoka umowy" z zakresem wdrożenia), `node gra/tools/bundle-wiki-for-game.cjs` → „22 rozdz. + 182 haseł (~1292 KB)`, `gra/src/data/wikiBundle.json` (diff 2 linie, jednolinijkowy JSON). Civpedia: ta sama encyklopedia; nie weryfikowano osobno w przeglądarce. |
| 7 | `pn_per_szt` w `tools/.dip-audit-bundle.cjs` i w `dyspozycje/rust-port/*` | ODRZUCAM w tym temacie | `gra/tools/.dip-audit-bundle.cjs:57` (`pn_per_szt:` — pole generatora audytu) nie pasuje do allowlisty (`gra/tools/diplo*|trade*|ai-trade*`). Dokumenty `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` i `p3/P3-5A-DATA-CIV-DIPLO.md` poza allowlistą. Zgłaszam do orkiestratora jako dług (patrz UWAGI). |
| 8 | Mutacja tylko na warstwie danych | PRZYJMUJĘ CZĘŚCIOWO | Mutacja na ścieżce AI (`selectAiTradeBarter` z tradeEra=2 i blokiem 10 → 1230 ≠ 1200) jest w teście AI. Mutacji na ścieżce UI/gry NIE zrobiono (zarzut 1 nie zamknięty). |

## Pozostałe kryteria dispatchu

- (a) tabela 15 kluczy × epoki 1/2/3: `diplomacy-trade-era-table-test.cjs` 185 pass / 0 fail (wcześniej 151/0 — dopisano sekcje umowy, zgodności i przywracania epoki).
- (b) mieszane epoki: test używa teraz `diplomacyDealTradeEra` (prawdziwa funkcja): (2,1)→2, (1,2)→2, (3,2)→3, (1,1)→1; `pn(drewno,50, epoka umowy)=1`; kontrola epoki Kamienia `pn(drewno,50,1)=5`.
- (c) bramka uczciwości — tylko zgodność jawna/globalna (patrz zarzut 2). NIE ZROBIONE jako test bramki.
- (d) DOM — NIE ZROBIONE (zarzut 3).
- (e) AI w Brązie — ZROBIONE (`diplomacy-trade-era-ai-test.cjs`, 14/0).
- (f) mutacja blok 10 w Brązie — ZROBIONE w obu testach (warstwa danych i AI). Wynik: nie przechodzi.
- (g) determinizm — NIE ZMIERZONO w tej rundzie (funkcje czyste; brak osobnego uruchomienia 2×).
- (h) bramki: patrz TESTY.

## TESTY (surowe wyniki, uruchomione w worktree na `770aa4fed` po edycjach)

- `npx tsc --noEmit` → exit 0 (bez wyjścia).
- logic-test: `LOGIC OK (213/213)`
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`
- combat-test: `COMBAT TEST: 6/6 pass`
- diplomacy-trade-era-table-test: `185 pass, 0 fail`
- diplomacy-trade-era-ai-test (nowy): `14 pass, 0 fail`
- Rodzina trade/diplomacy/ai-trade (35 plików `tools/ai-trade-*`, `tools/trade-*`, `diplo*trade*`, `diplomacy-*basket*`, `diplomacy-*proposal*` i pokrewne): exit 0 dla 32 (w tym `diplomacy-basket-*`, `diplomacy-proposal-test`, `diplomacy-resource-cyclic-trade-test`, `diplomacy-tech-trade-*`, `ai-trade-proposal-branch-test`, `ai-trade-proposal-to-player-test`, `ai-trade-need-from-surplus-test`, `ai-trade-offer-frequency-up-test`, `trade-routes-*`, `trade-grant-test`, `trade-ilosc-test`, oba testy ery). Exit != 0 dla 3 (opisane niżej).
  - `ai-trade-oneshot-overpay-limit-test`: exit 1, `FAIL: main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer(...) -> return`. Ta asercja tekstowa jest czerwona od wcześniej (backlog #379). Wywołanie istnieje w `7cee14d3a:gra/src/main.ts` (grep count 1), czyli to nie moja zmiana. Oznaczam jako PRE-EXISTING (zweryfikowane grepem na bazie, nie pełnym uruchomieniem bazy).
  - `ai-trade-wiring-e2e-live-test`: exit 1, `brak propozycji barteru na stole po realnym endTurn` (test live, tura 2, epoka 1). Ścieżka epoki 1 jest bitowo równa poprzedniej (tradeEra=1 → krok 10, brak zmiany normalizacji), więc uważam za niezwiązane — NIE ZMIERZONO na bazie.
  - `trade-route-remove-stock-flow-live-test`: exit 2, `brak BUNDLE_DIR z index.html (zbuduj vite --outDir poza repo)` — infra (brak builda), NIE ZMIERZONO.
- `git diff --check` → exit 0 (przed commitem kodu; `git diff --check` po commicie nie było potrzebne, diff pusty).
- Brak `npm run build` (vite) — NIE ZMIERZONO.

## BLOKADY

1. Okno umowy, `diplomacy-ai-offer-balance`, bramka UI i Szybka umowa nadal używają epoki gracza. Ryzyko rozjazdu: oferta AI wybrana w epoce umowy (np. blok 50 przy graczu w Kamieniu) może wyglądać inaczej w podglądzie gracza (blok 10 → inna wycena). Wymaga domknięcia przed deployem albo wstrzymania części AI.
2. Test DOM (d) — Playwright Chromium nie zainstalowany (download failure); build vite nie wykonany.
3. Stare zapisane propozycje i oferty (obcinanie ilości do kroku epoki) — brak decyzji właściciela (ABC).
4. Dług `pn_per_szt` poza allowlistą (`gra/tools/.dip-audit-bundle.cjs`, dokumenty Rust).
5. Kompatybilność z `origin/main` (45ded9579): NIE ZMIERZONO — wymaga merge przez orkiestratora.

## RUNDY

2/5 (runda 1 = 7cee14d3a; runda 2 = ten raport).

## NASTĘPNY KROK

Orkiestrator decyduje, czy:
(a) przyjąć tę rundę jako częściowo domkniętą i zlecić rundę 3 na: okno umowy + AI offer balance + Szybka umowa w epoce umowy, test DOM (po zainstalowaniu przeglądarki lub zgodzie na `executablePath` systemowego chromium), test bramki uczciwości w epokach 2/3, pytanie ABC o stare oferty;
(b) albo wstrzymać część AI (`pickAiPlayerCyclicBarter` wrap) do czasu domknięcia podglądu.
Przed merge z origin/main: rebase/merge `770aa4fed` na `45ded9579` (konflikt możliwy w `diplomacy-value-catalog.ts`, `main.ts`).

## UWAGI-DLA-ORKIESTRATORA

- Commit: zgodnie z dispatchem commit raportu dotyczy wyłącznie tego pliku, ale poprawki kodu zostały zacommitowane osobno (`770aa4fed`, explicit paths), bo bez tego praca nie istniała w gałęzi.
- Usunięto `gra/node_modules` po teście (zgodnie z zasadą sprzątania) — patrz ostatni krok.
- `pn_per_szt` w `gra/tools/.dip-audit-bundle.cjs:57` i w dokumentach `dyspozycje/rust-port/` — dług do REPIN/osobnego tematu.
- Stare pliki w `/home/user/The-Game/.claude/worktrees/` (`wf_npm_ci.log`, `wf_tsc.log`, `wf_tsc2.log`, `wf_pw.log`) to moje logi poza repo — usunięte.

DEPLOY/PUSH: NIE WYKONANO
