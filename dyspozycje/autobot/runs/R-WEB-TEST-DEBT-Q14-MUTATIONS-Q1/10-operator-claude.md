# R-WEB-TEST-DEBT-Q14-MUTATIONS-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES (CZĘŚCIOWO: kryterium binarne tematu NIE spełnione — pozostają tematy z listy bez mutacji; wymagana runda 2)
DOMAIN: INFRA (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-MUTATIONS-Q1
GOAL: dla naprawionych testów Q14 bez mutacji czerwonej pokazać, że czerwienieją po zmianie kodu gry, której pilnują (albo klasyfikacja SŁABY/RÓWNOWAŻNY z dowodem).
BAZA: origin/main f69561351f34503ff8983d473640c6eec5565904 (worktree wf_5968fe09-1b3-1, detached).

## Metoda (poza repo)
- Mutacje wykonywane WYŁĄCZNIE na kopii: `scratchpad/mir/gra/` (src, data, tools, package.json, tsconfig; node_modules zainstalowane `npm ci` w kopii). Repo nie dostało node_modules ani zmian w gra/src i gra/data.
- Przed każdą serią sprawdzono `diff -r mir/gra/src` vs repo `gra/src` (identyczne), a każda mutacja była przywracana z kopii `*.orig` i sprawdzana `cmp`.
- Pliki testów z listy uruchamiane w kopii (`node <test>.cjs`), wynik = surowy exit code i wyjście.

## Tabela (test | reguła | mutacja | wynik przed/po | werdykt)

| # | test | reguła (plik:linia w gra/src) | mutacja (na kopii) | przed | po | werdykt |
|---|---|---|---|---|---|---|
| 1 | ambush-deploy-wiring-test | deploy gracza = generał LUB zasadzka (main.ts:38281) | usunięto `|| ambushSurprised` | exit 0, 15 OK / 0 FAIL | exit 1, `FAIL atak gracza: deploy = generał LUB zasadzka` | CZERWONY |
| 2 | battle-manual-choice-contract-test | deploy generała po stronie gracza (main.ts:38281) | `isGeneral === true` -> `=== false` | exit 0, 12/0 | exit 1, AssertionError „all three player-controlled map-battle entry paths skip manual deployment controls without a commander” | CZERWONY |
| 3 | commander-star-emblem-test | wywołanie applyUnitCommanderStar z hasCmd (units.ts:6212) | `applyUnitCommanderStar(tokenObj, unit.isGeneral === true)` | exit 0, 12/0 | exit 1, `FAIL renderer uwzględnia zarówno dowódcę w reprezentancie, jak i w reszcie stosu` | CZERWONY |
| 3b | commander-star-emblem-test | usuwanie gwiazdy gdy !hasCommander (unitVeteranBadges.ts:277) | `if (!hasCommander)` -> `if (false && !hasCommander)` | exit 0, 12/0 | exit 1, 2x FAIL (produkcyjne stackVitals bez dowódcy; po usunięciu dowódcy znikają stan i symbol) | CZERWONY |
| 4 | ai-home-war-sees-own-land-test | bramka mgły ataku: wyjątek targetOnOwnTerritory (main.ts:48201) | usunięto `&& !targetOnOwnTerritory` | exit 0, PASS 4/4 | exit 1, AssertionError „fog gate must be guarded by !targetOnOwnTerritory …” (asercja statyczna) | CZERWONY |
| 5 | ai-jednostki-tylko-zakup-test | bramka ceny zakupu AI: skarbiec >= cena (ai.ts:8007) | usunięto `|| inp.treasury < inp.goldCost` | exit 0, 45/0 | PRZED wzmocnieniem: exit 0 (SŁABY — symulacja B/B' nie schodzi poniżej ceny). PO dopisaniu asercji bezpośrednich: exit 1, `FAIL A-PRICE: zakup odrzucony, gdy skarbiec (10) < cena (50) (got true, want false)` | SŁABY -> WZMOCNIONY (asercja dopisana), CZERWONY |
| 6 | citypanel-tech-tile-dead-effects-test | [C] Oblężnictwo „Odblokowuje budynek” = Warsztat oblężniczy (data/tech.json:372) | tekst zmieniony na „Warsztat inny” (w kopii data) | exit 0, 17/0 | exit 1, `FAIL [C] Oblężnictwo „Odblokowuje budynek” nadal pokazuje Warsztat oblężniczy`, 16 pass / 1 fail | CZERWONY |
| 7 | ai-balans-step3-test | T1d: prog_koszt_x L3 = 80 (data/ai-params.json) | cuda_poziom3_prog_koszt_x 80 -> 70 (w kopii) | exit 0, 8/0 | exit 1, `FAIL T1d: L3 prog_koszt_x = 80 … (got 70, want 80)`, 7 passed / 1 failed | CZERWONY |
| 8 | conquest-stability-test | kara G5 niestabilności = 0 (conquest-stability.ts:162) | `return 0;` -> `return -2;` | exit 0, 29/0 | exit 1, `FAIL unstable happiness penalty: kara G5 usunięta -> 0 (got -2, want 0)` | CZERWONY |

Uwaga do wiersza 5: test po zmianie ma 49 asercji (dopisano 2 w bloku „A-PRICE”, przed blokiem B). Asercje B4b/B'4 (minTreasury w symulacji) dodane w próbie NIE dawały czerwieni pod mutacją i zostały świadomie wycofane (`git checkout` przed ostatnią edycją); w commicie są tylko asercje bezpośrednie.

## Zmiana w repo (jedyny plik)
- `gra/tools/ai-jednostki-tylko-zakup-test.cjs` (+10): blok `A-PRICE` / `A-PRICE-EQ` — bezpośrednie asercje `shouldAIPurchaseUnit` (skarbiec < cena -> false; skarbiec == cena -> true). Nic nie osłabiono, nic nie usunięto.

## Bramki (w kopii, src/data identyczne z repo; surowe wyniki)
- `npx tsc --noEmit` -> exit 0 (bez komunikatów)
- logic-test.cjs -> `LOGIC OK (213/213)`, exit 0
- ai-test.cjs -> `ai-test: 297 passed, 0 failed`, exit 0
- ai-jednostki-tylko-zakup-test.cjs (po zmianie) -> `47 passed, 0 failed` (po dopisaniu A-PRICE; wynik końcowy po ostatniej edycji: `47 passed, 0 failed`)

## NIE zrobione w tej rundzie (pozostaje z listy — runda 2)
- Testy z listy bez mutacji (wiersze D1 wg tabeli): 1 administracja-stolica-test (STARY-PIN, pin zapasu 1000), 4 ai-city-render-batch-test (HARNESS, brak mutacji), 9 ai-praca-split-parity-test (STARY-PIN, cap 25 — mutacja cap w kopii), 15 budynki-koszt-pracy-50-test, 18 citypanel (zrobione, patrz wiersz 6), 23 culture-religion-test (B9 fallback), 24 currency-test (largest-remainder), 25 drewno-gate-test (pin Wojownik 13 — nie zlokalizowano jednoznacznie w pliku testu, do wyjaśnienia).
- Wiersz 7 (ai-march-avoid-foreign-territory-test): mutacja w scenariuszu wojennym zweryfikowana w kopii przez Q14-D1 (got 0), ale nie powtórzona w tej rundzie.
- Wiersze NIE ZMIERZONO z D1: 2 ai-army-replacement-concentration-test (próg 10% vs zmierzone 9,1% — decyzja progu, nie mutacja), 8 ai-move-full-range-test (decyzja), 17 city-state-alliance-test, 20 cluster-plan-name-test, 10 ai4-popyt-obywatele-test, 12 autoimprove-pasture-irrigation-q2-test, 19 civ-matrix-greece-test (BŁĄD-GRY/DECYZJA) — poza tym zakresem (nie są naprawionymi testami bez mutacji).
- D2: war-allin-capital-test — 4 warianty mutacji w gra/src/game/ai.ts NIE dały czerwieni (test nieczuły na te decyzje AI w harnessie) -> klasyfikacja SŁABY/RÓWNOWAŻNY NIEROZSTRZYGNIĘTA (wymaga analizy gałęzi forcedWar/general campaign; nie wykonano w tej rundzie).
- D2: zelazo-gate-test — mutacja (bramka Odlewni zdjęta) czerwona 3/24 z Q14-D2 — zapis z poprzedniej rundy, nie powtórzony tutaj.
- D1B: mutacje A (warzelnia_soli z FOOD_IMPROVEMENT_KEYS -> Z2c/Z2d czerwone) i B (skipWyrab w main.ts -> Q2n czerwone) — zapis z Q14-D1B, nie powtórzony tutaj.
- Dodatkowe z DODATKU: forced-war-iron-test, era-war-bronze-player-target-test, diplo-forced-peace-pending-test (kruchy regex), autoimprove-irrigation-after-farms-test, earth-template-test, map-coast-buffer-test — NIE wykonano.

## UWAGI-DLA-ORKIESTRATORA
1. Kryterium „każdy test z listy ma mutację czerwoną albo klasyfikację” nie jest spełnione dla całej listy; w rundzie 1 zrobiono 8 testów z mutacją i 1 wzmocnienie (wiersz 5). Proponuję rundę 2 z pozostałymi pozycjami powyżej.
2. War-allin-capital (D2): test nie czerwienieje pod żadną z 4 mutacji w ai.ts. To może być SŁABY TEST albo MUTANT RÓWNOWAŻNY — decyzja wymaga osobnego dowodu (nie zgadywano).
3. Surowe liczby z mutacji i bramek są w sekcji „Tabela” i „Bramki” powyżej; logi lokalne w scratchpad (poza repo).
4. Wykryty dług poza zakresem (nie zgłaszany jako ABC): wiersz 25 drewno-gate-test wskazuje pin „Wojownik Surowiec (ilość) = 13”, którego miejsca w pliku nie znaleziono jednoznacznie — do wyjaśnienia przez runda 2.

NASTĘPNY KROK: runda 2 — mutacje dla pozostałych pozycji z sekcji „NIE zrobione”, w tym war-allin-capital (klasyfikacja).
DEPLOY/PUSH: NIE WYKONANO
