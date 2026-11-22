# R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1
GOAL: AI nie płaci utrzymania jednostek wojskowych (złoto, surowce, żywność) w turach 1..40 włącznie; od tury 41 pełny koszt; rekrutacja płatna; gracz bez zmian.
BAZA: origin/main a6fb5061a3332215a9b42f2b8d0918ab8e8c07d4 (detach).
ZMIANY-COMMIT: SHA w polu `sha` odpowiedzi orkiestratorowi (commit na gałęzi detach worktree `wf_c8913aef-aa8-1`).

## Zmiany (allowlista)
- `gra/src/game/ai-free-unit-upkeep.ts` (nowy): `aiFreeUnitUpkeepActive(ownerId, turn, isHumanOwner, params)` (czysta funkcja; tura 1..tury, gracz zawsze false, flaga off = false); `paceUtrzymaniaWlasciciela(ownerId, pace)` = jedyny punkt wejścia: zwraca 0 dla AI w oknie, inaczej `pace`; kontekst `setAiFreeUnitUpkeepContext` (bez kontekstu = zero wpływu).
- `gra/data/ai-free-unit-upkeep-params.json` (nowy): `{ "wlaczone": true, "tury": 40 }`.
- `gra/src/game/turn-economy.ts`: tick (`upkeepBalance` i `totalUnitResourceUpkeep` per właściciel), `previewOwnerUpkeep`, `militaryFoodConsumptionWithSpichlerz` (żywność armii) przez `paceUtrzymaniaWlasciciela`.
- `gra/src/game/economy-upkeep.ts`: lokalny wrapper `mnoznikUtrzymaniaJednostek` (tempo 0 -> 0, reszta delegowana do unit-cost-tempo). Nie zmieniono `unit-cost-tempo.ts` (poza allowlistą).
- `gra/src/main.ts` (tylko podpięcia): import; instalacja kontekstu obok `setKosztJednostekPaceResolver` (tura = `turn`, fotele = `isHuman`); `garrisonUpkeepForCity` (właściciel miasta); podglądy w `aiPurchaseReserve` i `aiUpkeepRunwayAllows` (ownerId) — bramka rekrutacji AI widzi utrzymanie 0 w oknie.
- `gra/tools/ai-free-unit-upkeep-test.cjs` (nowy): 28 asercji.

Zmiana bazowa (mnożniki, koszty, progi, zasady gracza) — brak.

## TESTY (surowe wyniki, uruchomione w worktree po npm ci)
- `npx tsc --noEmit`: exit 0 (bez błędów).
- `node tools/ai-free-unit-upkeep-test.cjs`: `28 ok, 0 FAIL`, exit 0. Obejmuje: (a) funkcja czysta — tura 1 AI, 40 AI = aktywne; 41 AI, 0 AI, gracz w turze 1 i 40, flaga off, brak parametrów, NaN = nieaktywne; (b) tempo — kontekst AI t40 -> 0, AI t41 -> 'wysoki', gracz t40 -> 'wysoki'; (c) silnik (prawdziwe dane units.json/econ-params.json): zloto AI t40 wysoki = 0, AI t41 wysoki > 0 i = 4 x niski, gracz t40 wysoki = AI t41 (pełny ×4), flaga off = płatny, żywność AI t40 = 0, AI t41 > 0, żywność gracza t40 > 0; (d) bramka rekrutacji: okno (netto = przychód) -> zakup dozwolony, po oknie (utrzymanie 30/tura) -> zablokowany; (e) pin tekstowy wiringu w turn-economy.ts i main.ts.
- MUTACJA (wymagana): w `ai-free-unit-upkeep.ts` zdjęto warunek `turn <= params.tury` (`return turn >= 1;`) -> `node tools/ai-free-unit-upkeep-test.cjs`: `23 ok, 5 FAIL`, exit 1 (FAIL: tura 41 nieaktywne; kontekst AI t41; zloto AI t41 >0; gracz t40 = AI t41; żywność AI t41 >0). Plik przywrócony (grep potwierdza `turn <= params.tury`).
- Istniejące bramki, wszystkie rc=0: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `PASSED: 33 / FAILED: 0`; unit-replace-test rc=0; combat-test `All sanity checks passed.`; unit-resource-upkeep-test `7 passed, 0 failed`; ai-upkeep-runway-test `17 passed, 0 failed`; ai-upkeep-wiring-test `4 passed, 0 failed`; unit-cost-tempo-test rc=0; upkeep-test `91 passed, 0 failed`; recruitment-no-upkeep-gate-test `37 passed, 0 failed`; ai-recruit-upkeep-gate-test `23 passed, 0 failed`; upkeep-difficulty-per-owner-test `19 passed, 0 failed`; garrison-upkeep-tooltip-explain-test `28 OK, 0 FAIL`; unit-upkeep-era-scale-test `24 ok, 0 FAIL`.
- PRE-EXISTING FAIL (NIE od tej zmiany): `tools/unit-upkeep-cost-pace-test.cjs` -> `WYNIK: 80 ok, 1 FAIL` (asercja „wszystkie wywołania silnika utrzymania w 27 miejscach niosą tempo”, bez tempa: main.ts linie HUD ok. 34233/34236/34416 z `pace` lokalnym). Potwierdzone: ten sam FAIL na bazie origin/main (main.ts z a6fb5061 podmieniony na chwilę, potem przywrócony). Nie naprawiano (poza zakresem; test nie jest na liście bramek dispatchu).

## POMIAR (Chromium, seed 4242, ~60 tur, PRZED/PO)
NIE_ZMIERZONO — nie uruchomiono w tej rundzie (runner `gra/tools/ai-economy-measure-run.cjs` wymaga bundla i Chromium; nie podjęto). Brak pliku `dyspozycje/analizy/AI-DARMOWE-UTRZYMANIE-40-TUR-2026-11-22.md` — nie utworzono, bo nie ma wyników.

## BLOKADY
- Brak pomiaru kierunkowego (patrz wyżej).
- Pre-existing FAIL unit-upkeep-cost-pace-test (wyżej).

## UWAGI-DLA-ORKIESTRATORA
1. Przesunięcie o turę NIE ZWERYFIKOWANE: `turn++` jest w main.ts ok. L43298; nie prześledzono, czy tick ekonomii dla „końca tury 40” widzi `turn` = 40 czy 41. Testy zakładają tick z `turn` = numer tury gry (40 aktywne). FC / pomiar powinny to potwierdzić.
2. Miejsca NIE podpięte (poza minimalnym zbiorem; mogą pokazywać liczby AI bez zerowania): karty jednostek `unitUpkeep`/`unitFoodCardValue` w economy-upkeep (funkcje bez właściciela, używane przez karty i HUD `main.ts` ok. L34210–34427 wg globalnego tempa gracza); `main.ts` ok. L4158, L7831, L43700, L46100 (`totalUnitResourceUpkeep`/`unitFoodPerTurn` z globalnym tempem, bez ownerId w kontekście); `aiGarrisonGoldReserve(ownerId, ...)` ok. L48314 (rezerwa, nie liczy utrzymania wprost). Wymagają decyzji, czy wpływają na AI widoczne w grze.
3. Test `unit-upkeep-cost-pace-test` ma pre-existing FAIL na bazie — do osobnego tematu.
4. Nie tworzono nowych sesji/zadań/harmonogramów; run_in_background nie użyto.

NASTĘPNY KROK: Evaluator (Sonnet) -> Obrona (Haiku) -> Final Control; pomiar Chromium (NIE_ZMIERZONO) jako osobny krok przed deployem.
RUNDY: 1/5
DEPLOY-PUSH: NIE WYKONANO
