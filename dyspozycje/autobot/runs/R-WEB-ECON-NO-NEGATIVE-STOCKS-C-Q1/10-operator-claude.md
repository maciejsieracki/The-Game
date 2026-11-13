# R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 — raport Operatora (runda 2/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (podtemat C2: wpięcie równoważenia AI w turę + runner headless 15×3×150)
GOAL: skarbiec i spichlerz AI nie schodzą poniżej zera od tury 11; wpięcie w main.ts; flaga; runner headless; test kar deficytu; mutacja pomiarowa.

BAZA: kandydat ecb341abe (C1 + tools/no-negative-stocks-ai-test.cjs 8/0), po MERGE origin/main d419d3eaf (merge commit ed6fb99d0 na gałęzi worktree). Main ma już bramkę gracza (canPlayerInitiateEndTurn / nnsGateForPlayer) — nie ruszana.

## ZMIANY-COMMIT
Zakres zrealizowany w tej rundzie (allowlista: gra/src/game/no-negative-stocks.ts, gra/src/main.ts, gra/tools/no-negative-stocks-c2-test.cjs, raport):
1. `gra/src/game/no-negative-stocks.ts`: dopisano `NNS_AI_BALANCE_TURN_MIN` (=11), flagę `setNnsAiBalanceEnabled` / `isNnsAiBalanceEnabled` (jedno miejsce, domyślnie włączona) oraz czystą funkcję `decideAiOwnerBalance(turn, skarbiecPo, spichlerzPo, levers)` → {aktywne, wstrzymajZakupy, rozwiazJednostki, plan}.
2. `gra/src/main.ts` (bankowanie AI, tuż przed `aiSkarbiecByOwner.set(oid, aiSkarb)`): dla AI z `aiSkarb < 0` lub `getEmpireFoodReserve(oid) < 0` buduje dźwignie (`buildAiLevers`: wsparcie = cywilne jednostki poza garnizonem i oblężeniem, koszt złota = `utrzymanieJednostki / liczba jednostek`, bez podatków, bez jednostek obronnych) i wywołuje `decideAiOwnerBalance`. Gdy aktywne: dodaje owner do `aiNnsHoldOwners` i rozwiązuje wybrane jednostki przez nową `disbandAiSupportUnit(unitId, ownerId)` (nie rusza ownerId 0, nie rusza `disbandPlayerUnit`).
3. `gra/src/main.ts` (ownerLoop, zakup jednostki AI): `wantsPurchase = !aiNnsHoldOwners.has(ownerId) && shouldAIPurchaseUnit(...)`.
4. `gra/tools/no-negative-stocks-c2-test.cjs` (nowy): 15/0 — brama tury (10 wolne, 11 aktywne), brak minusu = nic, najdroższe wsparcie pierwsze, jednostka obronna nigdy nie rozwiązywana, flaga off = nic, plus asercje statyczne na wiązanie w main.ts (wywołanie, bramka zakupów, definicja i wpięcie disband).

Commit zawiera powyższe pliki + ten raport.

## TESTY (surowe wyjścia, na zmienionym drzewie)
- `npx tsc --noEmit -p .` (gra/): rc=0, bez komunikatów.
- `node tools/no-negative-stocks-c2-test.cjs`: `no-negative-stocks-c2-test: 15 passed, 0 failed`
- `node tools/no-negative-stocks-ai-test.cjs`: `no-negative-stocks-ai-test: 8 passed, 0 failed`
- `node tools/no-negative-stocks-test.cjs`: `no-negative-stocks-test: 25 passed, 0 failed`
- `node tools/no-negative-stocks-projection-test.cjs`: `no-negative-stocks-projection-test: 49 passed, 0 failed`
- `node tools/gold-deficit-test.cjs`: `gold-deficit-test: 55 pass, 0 fail` (istniejący test kar deficytu; NIE jest to test wymuszonego minusa w turze — patrz BLOKADY)
- `npm ci --ignore-scripts` w gra/: wykonane. NIE uruchamiano `npm run build/dev` (zakaz).

## KRYTERIA — STAN
- (a) runner headless 15 AI × 3 ziarna × 150 tur, surowe liczby po każdej turze od tury 11: NIE_ZROBIONE. Brak runnera (patrz BLOKADY 1).
- (b) brak eliminacji przez równoważenie: NIE_ZMIERZONO (brak pomiaru). Projektowo: dźwignie `eliminujeCywilizacje` nie trafiają do planu, jednostki obronne nie są przekazywane do dźwigni, `disbandAiSupportUnit` odrzuca nie-cywilne jednostki.
- (c) test kar deficytu przy wymuszonym minusie: NIE_ZROBIONE jako osobny test (istniejący gold-deficit-test 55/0 nie wymusza minusu w tej ścieżce).
- (d) mutacja pomiarowa (flaga off → minusy): NIE_ZROBIONE. Flaga istnieje i działa w testach jednostkowych (`flaga off: brak działania`), ale bez runnera nie ma pomiaru trajektorii.
- Test wiązania z main.ts: tylko STATYCZNY (regex na źródle main.ts), nie mutacja zachowania. Usunięcie wywołania spowoduje FAIL testu c2, ale nie była to mutacja wykonana w grze.

## BLOKADY
1. Runner headless 15×3×150 nie istnieje. Istniejące narzędzia (`tools/measure-ai-trade-offer-frequency.cjs`) działają na żywym bundle w Chromium z hakami `window.__…` (`?civTest=1`). Wymagają nowego haka (15 cywilizacji AI, ziarno, zapis/wczytanie slotu). Nie zbudowano go w tej rundzie. Szacunek z r1 pozostaje: wielogodzinny pomiar w kawałkach ≤480 s.
2. Podatki AI nie są równoważone. `podatekSkarbiec: 0` — brak modelu zysku z podniesienia podatku w jednej turze (`decideAIEconomySliders` ma cooldown `minOdstepTur` i nie zwraca przewidywanego zysku). Dźwignia podatkowa jest więc NIE_ZMIERZONO i pominięta.
3. Wstrzymanie zakupów jest ograniczone do zakupu jednostek (`shouldAIPurchaseUnit` / `purchaseRecruitmentUnit`). Wstrzymania kolejki budowy (gold/food w kolejce produkcji) nie są dźwignią (`wstrzymania: []`); to świadome zawężenie.
4. Kolejność tury: bankowanie AI (main.ts ok. 39799) następuje PO `advanceEmpireFood` (ok. 39408), więc wartości `aiSkarb` i `getEmpireFoodReserve` w tym punkcie są już poticzkowe. Równoważenie działa więc na stanie po ticku tej tury, a efekt rozwiązania jednostek (zmniejszenie utrzymania) dotyka dopiero NASTĘPNEJ tury. Ruch ten nie zmienia bieżącego minusu skarbca — dźwignie tej tury to wstrzymanie zakupów i zwolnienie przyszłego utrzymania. To jest zgodne z dispatchem tylko częściowo (dispatch zakładał projekcję przed tickiem i ponowne liczenie econ — nie wdrożone; to decyzja wymagająca orkiestratora).
5. Spichlerz: brak dźwigni żywnościowej. Dla spichlerza AI działa tylko wstrzymanie zakupów; nie ma wsparcia spichlerza.
6. `disbandAiSupportUnit` nie zwraca złota ani surowców i nie sprząta oblężeń/zapisów poza `syncUnitsRender()`. Dispatch wymagał „minimalnego wariantu, bez zmian zachowania gracza” — spełnione, ale sprzątanie stanu (np. `plannedMarches`, `marchAttackTargets`, referencje w garnizonie) NIE_ZWERYFIKOWANE w grze.
7. Nie uruchomiono gry w przeglądarce ani żadnego testu turowego AI. Wpięcie jest zweryfikowane wyłącznie typowo (tsc) i statycznie.

## ZAŁOŻENIA (luki rozstrzygnięte w raporcie)
- Jednostka wsparcia = `isCivilianUnit(u)` z `units/setup.ts`, poza garnizonem i oblężeniem. Pozostałe jednostki = obronne (nie przekazywane do dźwigni).
- Koszt złota jednostki wsparcia = średnie utrzymanie jednostek ownera (`utrzymanieJednostki`) na jednostkę cywilną — przybliżenie, nie pomiar.

## UWAGI-DLA-ORKIESTRATORA
- Kandydat ecb341abe był bazą; merge origin/main d419d3eaf (ed6fb99d0) jest w gałęzi worktree. Nie pushowano.
- Brak zmian w ai.ts (dispatch dopuszczał). Brak zmian w `disbandPlayerUnit`, `canPlayerInitiateEndTurn`, hud.ts.
- Do decyzji: czy wymagać projekcji PRZED tickiem (ponowne liczenie econ) — to zmiana architektury tury, nie została zrobiona.
- Rekomendacja modelu: runda 3 wymaga runnera (nowy hak) — orkiestrator decyduje o modelu (zasada 2: Sonnet po 2 nieudanych rundach Haiku TEGO tematu; to jest runda 2, więc Haiku domyślnie).

NASTĘPNY KROK: Evaluator/Final Control oceniają wpięcie C2; runda 3 — runner headless + test kar deficytu + mutacja pomiarowa (flaga off) + decyzja o projekcji przed tickiem.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 2/5 (r1 BLOCK bez kodu; r2 C1 + częściowe C2 — runner NIE wykonany)
