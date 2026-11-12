# 10 — Operator (Claude) — R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1 — runda 1/5

STATUS: PASS-WITH-NOTES (z punktami DECISION_REQUIRED/ABC dla dwóch wartości przyjętych ZAŁOŻENIEM — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1
GOAL: zinwentaryzować i zmierzyć (headless, wiele tur, wszystkie cywilizacje, kilka ziaren) każde źródło
miedzi (Ruda miedzi `ruda` i Brąz `braz`) per cywilizacja, znaleźć przyczynę przecieku (~24 tys. szt.
krótko po wejściu w epokę Brązu), naprawić przyczynę, nie objaw, i dodać test regresji, który pod
mutacją robi się czerwony.

Baza: `81e357dee` (origin/main), worktree izolowany, `git checkout --detach 81e357dee`.

## 1. Wynik w skrócie

Zgłoszenie się **potwierdziło**. Są **dwa niezależne przecieki**. Oba przechodzą przez
legalne mechanizmy, a nie przez jakieś „darmowe” źródło:

| # | Surowiec | Mechanizm | Dokładne miejsce | Skutek zmierzony (PRE) |
|---|---|---|---|---|
| L1 | Brąz `braz` | Szlak handlowy przenosi z dawcy **całą nadwyżkę ponad rezerwę** w każdej turze. W łańcuchu/sieci szlaków (AI↔AI, sam kontakt wystarczy) cały brąz sieci spływa do jednej cywilizacji, a pozostałe stoją na rezerwie 2. | `gra/src/game/trade-routes.ts` → `computeTradeRouteResourceFlow`, dawne `const amount = Math.floor(surplus);` (teraz l. 2220–2221) | Grecy 17 478 (t55, ziarno 4242), Zulusi **77 915** (t91, 4242), Egipt **79 243** (t80, 1234), MP Rzymianie **100 000 = cap** (1234, nadwyżka kasowana). W ledgerze ok. 10 mln szt. „przerzuconych” per cywilizacja przy produkcji ~40 tys. |
| L2 | Ruda miedzi `ruda` | Odlewnie zjadają rudę poniżej pakietu 10. To uruchamia niedobór `ruda` (`detectPricedResourceDeficits`), a krok KROK 1 „brakujący surowiec” w pickerze stawia Kopalnię miedzi na **wszystkich złożach naraz**. Każda kopalnia daje 20×1,5^(epoka−1) = 30/turę w Brązie. | `gra/src/game/auto-improvements.ts` → `pickAutoImprovements`, krok deficytowy przy `demandDriven: true` (AI: `ai.ts` ~l. 2989; gracz z administratorem ulepszeń: ta sama funkcja) | Skoki kopalń w jednej turze: Egipt 5→47 (t35), Chiny 5→63 (t42), Egipt 3→30 (t31, 777), Inkowie 4→41 (t54, 777), Inkowie 17→41 (t67, 1234). Zapasy: Egipt **25 075**, Chiny **29 085** (t57, 4242). Chiny 94 890 (t91), Inkowie 57 630 (t98, 777). |

Wartość ~24 tys. ze zgłoszenia mieści się dokładnie w L2 (25 075 / 29 085 około 20 tur po
wejściu w Brąz) albo w L1 (17 478 Brązu w t55).

## 2. Inwentaryzacja źródeł miedzi (kod + ledger z pomiaru)

Ledger to log każdego wywołania kredytu/debetu zapasu ze stosem wywołań, zbierany przez
`copper-income-audit-hook.cjs` **wyłącznie w kopii** gry. Dla `ruda` i `braz` widać w nim tylko
poniższe ścieżki:

| Źródło | Funkcja | `ruda` | `braz` | Ocena |
|---|---|---|---|---|
| Kopalnia miedzi na terytorium | `turn-economy.ts` `tickEmpireResourcePipeline` faza 1 → `creditTerritory` | **+** (jedyne źródło netto rudy) | — | poprawne per sztukę; przeciek = **liczba** kopalń (L2) |
| Odlewnia brązu (konwerter) | `converters.ts`, faza 2 | − 1/cykl | + 1/cykl | zachowuje masę (sprawdzone: converter-era 117/0, converters 49/0) |
| Szlak handlowy (przepływ surowca) | `trade-routes.ts` `computeTradeRouteResourceFlow` → `main.ts` ~38844 `deductBuildingStockCostAcrossCities` + `creditOwnerResourceStock` | — | ± | zachowuje masę, ale **koncentruje** (L1) |
| Koszyk dyplomatyczny | `diplomacy-basket-transfer.ts` `transferSurowiecIlosc` | ± | ± | ograniczony zapasem dawcy, poprawne |
| Łupy z bitwy | `battle-loot.ts` | — | + (do 100% kosztu rekrutacji) | poprawne, małe kwoty |
| Zdobycie / aneksja miasta | `capital-capture.ts`, aneksja MP | ± | ± | zapas idzie z miastem (to jedyna „NIEOPISANA” reszta w ledgerze, tura 22 = wchłonięcie MP) |
| Koszty rekrutacji i budowy | `deductBuildingStockCostAcrossCities` | − | − | zużycie |
| Przycięcie do capu magazynu | `economy-upkeep.ts` | − | − | kasuje nadwyżkę ponad cap (100 000 w epoce 2) |
| Premie cywilizacji / cudy | dane | brak `ruda`/`braz` | brak | — |
| Kwalifikator ulepszenia | `improvement-build.ts` | kopalnia wymaga złoża `miedz` | — | poprawne |

Nie znaleziono źródła „z niczego”. Reszta niewyjaśniona przez ledger (delta zapasu minus suma
ledgera) wynosi 0 we wszystkich turach poza wchłonięciem MP. Szczegóły:
`pomiar-PRE-seed{4242,777,1234}.md` i `pomiar-POST-seed{4242,777,1234}.md`.

## 3. Naprawa przyczyny

### L1 — `trade-routes.ts` `computeTradeRouteResourceFlow`

```ts
const halfGap = Math.floor((donorStock - Math.min(ownerStockNow, toOwnerStockNow)) / 2);
const amount = Math.min(Math.floor(surplus), halfGap);
if (amount <= 0) continue;
```

Szlak **wyrównuje** zapasy: przenosi co najwyżej połowę różnicy, więc odbiorca nigdy nie
przegoni dawcy. Rezerwa dawcy zostaje bez zmian. Masa jest zachowana. Reguła jest identyczna
dla gracza i AI, bo to jedna funkcja i jedna ścieżka w `main.ts`.

### L2 — `auto-improvements.ts` `capDeficitMinePicks`

- `pickAutoImprovements` zwraca teraz `capDeficitMinePicks(picks, opts)` (l. 844).
- Przy `demandDriven: true` i kluczu niedoboru, który mapuje na kopalnię (`kopalnia_miedzi`,
  `kopalnia_cyny`, `kopalnia_zelaza`), przepuszczane jest najwyżej
  `DEFICIT_MINE_PICKS_PER_KEY_PER_TURN = 1` (l. 863) kopalnia danego typu na turę.
- Pozostałe picki zostają bez zmian. Poza trybem `demandDriven` nic się nie zmienia.
- Zasada „tylko w miarę potrzeby, nie na zapas” (ECHO właściciela 2026-08-27) jest dzięki temu
  respektowana także wtedy, gdy niedobór utrzymuje się, bo odlewnie stale zjadają rudę.
- Parytet AI/gracz jest zachowany: ten sam picker obsługuje AI (`decideAITurn`) i gracza z
  administratorem ulepszeń. Test K2/K3 sprawdza obie ścieżki.

## 4. Pomiar przed i po (surowe liczby)

Pomiar wykonano narzędziem `gra/tools/copper-income-audit-measure.cjs`. Gra jest zbudowana Vite
w **kopii poza repo** (`--minify false`), z hookiem ledgera, i uruchamiana w headless Chromium
przez `?civTest=1`. Ustawienia: mapa Standardowa/kontynenty, 6 głównych cywilizacji, wszystkie
AI (autoplay), start w epoce 2 (Brąz).

### 4.1 Zapas per główna cywilizacja: `ruda` / `braz` / liczba Kopalń miedzi (rN/bN/kN)

| ziarno | tura | PRE | POST |
|---|---|---|---|
| 4242 | 30 | egipt r840/b62/k5 · zulusi r580/b476/k2 · inkowie r100/b202/k1 · chiny r1040/b410/k4 · grecy r630/b0/k3 | egipt r840/b97/k5 · zulusi r630/b65/k2 · inkowie r100/b288/k1 · chiny r1040/b410/k4 · grecy r210/b37/k1 |
| 4242 | 40 | **egipt r5080/k46** · zulusi r100/b312/k10 · inkowie r1010/k16 · chiny r210/b192/k5 · grecy r1180/b767/k3 | egipt r40/b654/k10 · zulusi r0/b783/k3 · inkowie r20/b699/k9 · chiny r0/b884/k5 · grecy r130/b591/k1 |
| 4242 | 45 | **egipt r9980/b0/k46** · zulusi r930/k22 · inkowie r1910/b652/k16 · **chiny r4620/b22/k63** · grecy r1180/b42/k3 | egipt r0/b569/k14 · zulusi r0/b671/k8 · inkowie r0/b1204/k11 · chiny r0/b611/k10 · grecy r20/b410/k4 |
| 777 | 40 | egipt r4900/k30 · **chiny b5061**/k19 · zulusi r1470/b112 | egipt r60/b536/k11 · chiny r40/b520/k9 · zulusi r1530/b267/k4 |
| 777 | 45 | egipt r7370/k29 · **zulusi b5511** · chiny r4010/b0/k19 | egipt r40/b511/k14 · zulusi r980/b388/k4 · chiny r20/b5/k12 |
| 1234 | 40 | egipt r2040/k21 · chiny r1170/k21 · inkowie r1010/k17 | egipt r0/b936/k10 · chiny r0/b465/k9 · inkowie r0/b906/k11 |
| 1234 | 45 | egipt r2840/b402/k21 · grecy r760/k25 | zulusi b1501 · egipt b1522 · chiny b931 · inkowie b1542 · grecy b1501 (równo) |

### 4.2 Maksima w całym biegu (główne cywilizacje)

| ziarno | PRE: tury | PRE: max skok kopalń w 1 turze | PRE: max `ruda` | PRE: max `braz` | POST: tury | POST: max skok | POST: max `ruda` | POST: max `braz` |
|---|---|---|---|---|---|---|---|---|
| 4242 | 2–91 | **+58** (chiny 5→63, t42) | **94 890** (chiny t91) | **77 915** (zulusi t91) | 2–45 | +4 (t22, wchłonięcie MP) | 1 190 | 1 204 |
| 777 | 2–98 | **+37** (inkowie 4→41, t54) | **57 630** (inkowie t98) | 11 719 (egipt t96) | 2–48 | +2 (t22) | 1 980 | 960 |
| 1234 | 2–91 | **+24** (inkowie 17→41, t67) | 19 735 (chiny t91) | **79 243** (egipt t80) | 2–48 | +2 (t22) | 490 | 1 814 |

- W PRE pierwszy skok ≥ 10 kopalń wystąpił w t31–t35 we wszystkich trzech ziarnach.
- POST przeszedł ten punkt we wszystkich ziarnach (t45–48) bez żadnego skoku ≥ 10. Brąz rozkłada
  się równo (np. 1234/t45: 931–1542 u wszystkich 5).
- Do t20 PRE i POST są identyczne, bo przed pierwszymi odlewniami/szlakami nic się nie zmienia.
  To dowód, że poprawka nie rusza innych ścieżek.

## 5. Cap z pomiaru (nie zgadywany)

- **L2:** liczba przyjęta = 1 kopalnia danego typu na turę na niedobór (ZAŁOŻENIE).
- Uzasadnienie z pomiaru: przy 1/turę narastanie POST to 5→10→14 kopalń w ~15 tur, a zapas
  rudy oscyluje wokół 0–2 000. Odlewnie zużywają rudę na bieżąco, a niedobór dalej powoduje
  dobudowę, ale stopniowo.
- Wartość „1” jest jednak **parametrem balansu** → ABC niżej. Nie przeniosłem jej do JSON balansu,
  bo dispatch zabrania tego bez ABC. Jest stałą eksportowaną w kodzie z komentarzem ZAŁOŻENIE.
- **L1:** reguła „połowa różnicy” nie wprowadza nowej liczby. To warunek fizyczny: przepływ nie
  może odwrócić kolejności zapasów.
- Cap magazynu (100 000 w epoce 2) pozostał bez zmian. Po poprawce nikt się do niego nie zbliża
  (max 2 059 w POST, MP Rzymianie t49).

## ZMIANY/COMMIT

Allowlista jest dotrzymana. Nie było zmian w `WERSJE.md`, w JSON balansu ani w `rust-port`.

- `gra/src/game/trade-routes.ts`: L1, wyrównanie połową różnicy plus docstring.
- `gra/src/game/auto-improvements.ts`: L2, `capDeficitMinePicks` i `DEFICIT_MINE_PICKS_PER_KEY_PER_TURN`.
- `gra/tools/zloto-szlak-test.cjs`: sekcja 4 oczekuje teraz `min(nadwyżka, floor(różnica/2))`
  (5 zamiast 8). To zmiana kontraktu wynikająca z L1.
- `gra/tools/trade-route-flow-no-concentration-test.cjs` (NOWY): regresja L1.
- `gra/tools/deficit-mine-cap-test.cjs` (NOWY): regresja L2 z wbudowaną mutacją.
- `gra/tools/copper-income-audit-hook.cjs`, `-measure.cjs`, `-summarize.cjs` (NOWE): narzędzia
  pomiaru. Hook patchuje **tylko kopię** gry poza repo.
- `dyspozycje/autobot/runs/R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1/`: ten raport plus
  `pomiar-PRE-seed*.md` i `pomiar-POST-seed*.md`.

SHA: zwracane w polu `sha` (commit zawierający ten plik).

## TESTY

Liczby pochodzą z surowego wyjścia, a pliki leżą w scratchpadzie `gates/`.

**Bramki:**

| Bramka | Wynik |
|---|---|
| `npx tsc --noEmit` (TS 5.9.3) | exit 0, 0 linii |
| logic-test | 213/213 |
| tech-tree-test | 20/0 |
| research-test | 33/33 |
| unit-replace-test | 21/21 |
| combat-test | 6/6 |
| unit-power-test | 6/0 |

**Testy regresji (nowe):**

- `trade-route-flow-no-concentration-test`: **10/0**. Ręczna mutacja (przywrócone
  `Math.floor(surplus)`) daje **4 passed, 6 failed**.
- `deficit-mine-cap-test`: **9/0**. Wbudowana mutacja (limit = Infinity) daje 14 kopalń w 1 turze
  i symulację 14,0,0,0,0,0. Asercje D potwierdzają, że A i C byłyby czerwone.

**Handel, ekonomia i dyplomacja:**

| Test | Wynik |
|---|---|
| zloto-szlak | 54/0 |
| converter-era-scaling | 117/0 |
| converters | 49/0 |
| diplomacy-basket-transfer | 24/24 |
| diplomacy-basket-duplicate | 21/21 |
| diplomacy-basket-edit | 25/25 |
| empire-diplo-resource-flow | 7/0 |
| handel-wymiana-tech-gate | 35/0 |
| trade-grant | 62/0 |
| trade-routes-contact-only | 36/0 |
| trade-routes-hud-filter | 58/0 |
| trade-routes-income | 134/0 |
| trade-routes-ownership-income | 18/0 |
| trade-routes | 96/0 |
| trade-routes-limit | **76/0** (w pierwszym przebiegu pod obciążeniem 75/1: K9 to asercja czasu, zimny start 7306 ms > 5000 ms; powtórka zielona) |
| trade-sea-bonus-requires-port | 30/0 |
| trade-treaty-free-break-after-10 | 35/0 |
| ai-trade-oneshot-overpay-limit | 10 pass |
| ai-trade-proposal-branch | 10/0 |
| ai-trade-proposal-to-player | 25 pass |
| battle-loot | 12/0 |
| diplomacy-ai-balance | 36/36 |
| diplomacy-ai-offer-balance | 29/0 |
| diplomacy-currency-trade | 5/0 |
| diplomacy-deposit-trade | 9/0 |
| diplomacy-economy | 21/21 |
| diplomacy-goods-kat | exit 0 |
| diplomacy-resource-cyclic-trade | 53/0 |
| diplomacy-resource-trade-pick | 13/0 |
| cyna-surowiec | **78/0** (w tym K: AI deficyt Rudy cyny → Kopalnia cyny) |

**AI i auto-ulepszenia:**

| Test | Wynik |
|---|---|
| ai-food-improvement-priority-stages | 13/0 |
| ai-food-only-worked-hexes | 69/0 |
| ai-improvements | 56/0 |
| ai-resource-needs | 6/0 |
| ai-test | 296/0 |
| auto-improve-no-item-cap | 15/0 |
| auto-improve-q3 | 41/0 |
| auto-improvements | 46/0 |
| auto-manage | OK |
| auto-manage-ulepszenia-fallback | 11/11 |
| autoimprove-irrigation-after-farms | 42/0 |
| autoimprove-pasture-irrigation-q2 | 17/0 |
| autoimprove-river-forest-clear-no-citizen-q1-unit | 17/0 |
| autoimprove-river-forest-first-q1 | 12/0 |
| autoimprove-stages-q1 | 299/0 |

**Czerwone niezależnie od zmiany** (ten sam zestaw FAIL na bazie `81e357dee` przed poprawką):

- `surow-civ-storage-test` 64/4.
- `trade-ilosc-test` 35/5 (nieaktualne oczekiwania `capacityPerRoutePerTurn`).
- Proponowany dług testowy: osobny temat R-WEB-TEST-DEBT-*.

## BLOKADY

1. **ABC — model przepływu surowca na szlaku (L1).** Rekomendacja: **A**.
   - **A** (wdrożone): wyrównanie połową różnicy, czyli nadwyżka ponad rezerwę, ale nie więcej
     niż połowa różnicy zapasów.
   - **B**: stały limit sztuk na szlak/turę albo limit względem produkcji dawcy.
   - **C**: brak przepływu surowców AI↔AI, tylko z udziałem gracza.
2. **ABC — limit kopalń z niedoboru (L2).** Rekomendacja: **A**.
   - **A** (wdrożone ZAŁOŻENIEM): 1 kopalnia/typ/turę.
   - **B**: 1 na miasto na turę.
   - **C**: limit proporcjonalny do liczby odlewni.
   - Wartość ewentualnie przenieść do `ai-params.json`, ale dopiero po decyzji.
3. Ten sam wzorzec „krok deficytowy stawia ulepszenie na wszystkich kwalifikujących się
   hexach” prawdopodobnie dotyczy też `kamieniolom`, `glinianka`, `tartak` i innych. Te klucze
   **NIE_ZMIERZONO**. Limit objął tylko trzy kopalnie metali, czyli obszar zgłoszenia. Proponuję
   osobny temat audytu.
4. Długość pomiaru:
   - PRE dotarł do t91–98, a nie do 150, z powodu limitu CPU.
   - POST w chwili commita jest na t45–48, ale minął już punkt, w którym PRE eksplodował (t31–35).
   - Zachowanie POST w t50–150 to **NIE_ZMIERZONO**. Biegi trwają dalej (nohup) w scratchpadzie
     `cu/out/post-kontynenty-*.jsonl`, a Evaluator może je dokończyć tym samym narzędziem.
5. Nie sprawdzałem hex po hexie, czy każda kopalnia stoi na złożu. Opieram się na kwalifikatorze
   `improvement-build.ts`, który wymaga `zloze: miedz`.
6. **Dług REPIN dla rust-port:**
   - Port przepływu surowca na szlaku nie istnieje (grep pusty), więc nie ma czego przepinać teraz.
   - Limit kopalń w pickerze auto-ulepszeń wymaga REPIN do `rust-port` (picker `pick.json`).

## RUNDY

1/5

## NASTĘPNY KROK

1. Evaluator (SONNET): weryfikacja diffu, testów regresji z mutacją i pomiaru.
2. Final Control.
3. ABC właściciela dla punktów 1–2 z BLOKAD.

## DEPLOY/PUSH

NIE WYKONANO
