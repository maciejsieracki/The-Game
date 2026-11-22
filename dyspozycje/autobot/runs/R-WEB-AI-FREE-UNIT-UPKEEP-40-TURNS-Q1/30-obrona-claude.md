# R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1 — raport obrony Operatora (runda 2/5, Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1
GOAL: AI nie płaci utrzymania jednostek wojskowych (złoto, surowce, żywność) w turach 1..40 włącznie; od tury 41 pełny koszt; rekrutacja płatna; gracz bez zmian.
BAZA: kandydat b090128c6088c76e2a3ca069a8d798d7d4176103 (detach); poprawki na tej gałęzi.
ZMIANY-COMMIT: f0880002c8c1d157ff1779135618df8134b068dc (kod + test + analiza); czubek tej rundy = commit raportu (pole sha).
ALLOWLISTA: gra/src/main.ts, gra/tools/ai-free-unit-upkeep-test.cjs, dyspozycje/analizy/AI-DARMOWE-UTRZYMANIE-40-TUR-2026-11-22.md, dyspozycje/autobot/runs/R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1/**. Commitowane tylko te ścieżki (git add <ścieżka>).

## Odpowiedzi na zarzuty Evaluatora

1. **Off-by-one okna (turn++ przed tickiem). PRZYJMUJĘ, naprawione.** Potwierdzone czytaniem kodu: `turn++` w `runWorldEndTurn` (main.ts ok. L43298) jest przed `advanceCityEconomy` (ok. L43482), więc tick kończący turę 40 widział 41. Poprawka: `aiUpkeepTickTurnOverride = turn - 1` ustawiane tuż po `turn++`; `getTurn` zwraca `aiUpkeepTickTurnOverride ?? turn`; override zdejmowany tuż przed `await runAiPhase()` (faza AI działa już w nowej turze, więc bramka rekrutacji widzi bieżącą turę) i w `finally` przy wywołaniu `runWorldEndTurn`. Tick kończący turę 40 liczy się jako 40 (darmowy), tick kończący 41 jako 41 (płatny). Okno obejmuje 40 ticków (końce tur 1..40). Zastrzeżenie: nie wykonano ticku w teście, to pin tekstowy plus czytanie kodu.

2. **Brak liczbowej asercji surowców; mutacja przechodziła. PRZYJMUJĘ, naprawione.** Dodano liczbowe asercje `totalUnitResourceUpkeep` z `paceUtrzymaniaWlasciciela` (AI t40 = 0, AI t41 > 0 i = 4× niski, gracz t40 > 0). Pin tekstowy zmieniono z `includes` na liczenie wystąpień: tick ma dokładnie 2 wystąpienia `paceUtrzymaniaWlasciciela(oid, unitPace)` (upkeepBalance i surowce). Mutacja usunięcia jednego z nich (`unitPace,` na L3335 turn-economy.ts) daje teraz `FAIL` (wynik: `33 ok, 1 FAIL`).

3. **Bramka rekrutacji (d) syntetyczna. PRZYJMUJĘ, częściowo naprawione.** Dodano test (d2), który buduje wejście bramki z prawdziwego `previewTurn`: przed = 3 jednostki, po = 4, `unitGoldUpkeep = max(0, after − before)`. Wynik: tura 40 -> zakup dozwolony, tura 41 -> zablokowany. Wiring w `aiUpkeepRunwayAllows` pokryty pinem liczącym (4 wystąpienia `paceUtrzymaniaWlasciciela(ownerId, kosztJednostekPaceUtrzymania())`). Nie uruchomiono `aiUpkeepRunwayAllows` z main.ts, bo jest zamknięta w `boot()`.

4. **Niepodpięte miejsca. PRZYJMUJĘ, częściowo naprawione.** Podpięte w tej rundzie (main.ts):
   - L4161 (fallback `unitResourceUpkeepByOwner`, właściciel znany),
   - L7707 (NNS wybór garnizonu, `ownerId`),
   - L7888–7889 (NNS zloto/żywność jednostki AI, `oid`),
   - L34232–34236 (`unitCosts`: `foodPerTurn`, `pieniadzUpkeep`, `resourceUpkeep` — utrzymanie wg właściciela; `recruitPaced` celowo NIE, bo wzięłoby 0 zamiast tempa rekrutacji),
   - L34374, L34417, L34434 (statystyki per właściciel `o`: pieniądz, żywność armii, surowce).

   Nadal NIE podpięte (uczciwie, poza minimalnym zbiorem):
   - karty jednostek `src/ui/unitInfoCard.ts` (L320) i `src/ui/entityCards/unitAdapter.ts` (L306 i pokrewne) — sygnatura nie przyjmuje właściciela; karta jednostki AI w oknie może pokazać koszt, którego AI nie płaci,
   - `main.ts` L34636 (`spawnAiUnits`, hak testowy `?civTest=1`) — celowo bez zmiany, bo to scenariusz testu turowego,
   - `economy-upkeep.ts` L1037/1110/1252/1308/1349 — pomocnicze funkcje wołane z `previewOwnerUpkeep` (już wrapped) i z kodu, którego nie prześledzono w tej rundzie; wymaga audytu wywołań,

   Oceniono także L43700 i L46100 (`recomputeCityFoodBalancesInEcon`, `previewOwnerUpkeep` z suwakiem AI przy `econUnitsSlider`): pierwsza nie liczy utrzymania, druga już dostaje `kosztJednostekPaceUtrzymania()` i wymaga wrapa (`paceUtrzymaniaWlasciciela(ownerId, ...)`) — NIE zrobiono; oznaczone jako pozostałe.

   **Uwaga do orkiestratora:** pozostałe miejsca (karty jednostek, economy-upkeep pomocnicze, L46100 suwak AI) to realne rozjazdy HUD/AI, które dispatch wymagał zamknąć („HUD/karty nie mogą pokazywać AI rozbieżnych liczb”). Nie są zamknięte w tej rundzie. Wymagają osobnej decyzji (przekazanie właściciela do kart i suwaka) albo kolejnej rundy.

5. **Brak pomiaru i brak dokumentu analizy. PRZYJMUJĘ jako NIE ZMIERZONO.** Utworzono `dyspozycje/analizy/AI-DARMOWE-UTRZYMANIE-40-TUR-2026-11-22.md` ze statusem NIE ZMIERZONO (pomiar live PRZED/PO nie wykonany w tej rundzie; Chrome dostępny, nie uruchomiono). Dokument zawiera tylko liczby z testu silnika.

6. **Wyjątki państwa-miasta / bariery. PRZYJMUJĘ jako dokumentację, bez zmiany logiki.** Dispatch: wyjątki tylko jeśli istnieje gotowy helper. Przeszukano `gra/src`: `isOwnerClusterCityState` (`gra/src/game/display-names.ts` L50) to predykat do nazw i wyświetlania (nie do ekonomii, z komentarzem o celu nazewniczym), a `isCityStateEligibleForPlayerWar` (`city-state-difficulty.ts` L95) dotyczy wojny. Nie znaleziono helpera „bariery” ani „państwo-miasto → wyjątek utrzymania”. Zatem wyjątków nie zastosowano; utrzymanie darmowe obejmuje każdego właściciela, który nie jest człowiekiem (w tym państwa-miasta, jeśli są grywalne jako AI). To świadome zachowanie zgodne z literą dispatchu, do potwierdzenia przez orkiestratora.

## ZMIANY (ta runda)
- `gra/src/main.ts`: override tury tiku (3 miejsca + finally), 10 podpięć utrzymania per właściciel (patrz pkt 4). Brak zmian mnożników, kosztów, progów, zasad gracza.
- `gra/tools/ai-free-unit-upkeep-test.cjs`: 34 asercje (było 28): +2 surowce liczbowe, +2 bramka z silnika (d2), piny liczone zamiast `includes`, pin override tury.
- `dyspozycje/analizy/AI-DARMOWE-UTRZYMANIE-40-TUR-2026-11-22.md`: NIE ZMIERZONO + liczby z testu.
- Moduł `gra/src/game/ai-free-unit-upkeep.ts`, dane `gra/data/ai-free-unit-upkeep-params.json`, `gra/src/game/economy-upkeep.ts`, `gra/src/game/turn-economy.ts`: bez zmian w tej rundzie.

## TESTY (surowe wyniki, worktree po `npm ci` w gra/, tsc --noEmit exit 0)
- `npx tsc --noEmit`: exit 0.
- `node tools/ai-free-unit-upkeep-test.cjs`: `34 ok, 0 FAIL`.
- MUTACJE (ręczne, każda przywrócona z kopii i zweryfikowana `cmp`):
  - M1: usunięcie `&& turn <= params.tury` w `ai-free-unit-upkeep.ts` -> `27 ok, 7 FAIL` (test (a), (b), (c), (d) czerwone).
  - M2: tick `paceUtrzymaniaWlasciciela(oid, unitPace),` zamieniony na `unitPace,` (turn-economy.ts L3335) -> `33 ok, 1 FAIL` (pin tiku: `FAIL turn-economy: tick ... = 2 pinы`).
  - M3: `getTurn: () => aiUpkeepTickTurnOverride ?? turn` zamienione na `() => turn` (main.ts) -> `33 ok, 1 FAIL` (pin override).
- Bramki (wszystkie rc=0, wynik z surowego wyjścia):
  - logic-test `LOGIC OK (213/213)`;
  - tech-tree-test `20 pass, 0 fail`;
  - research-test `ALL GREEN` (33);
  - unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`;
  - combat-test `All sanity checks passed.`;
  - unit-resource-upkeep-test `7 passed, 0 failed`;
  - ai-upkeep-runway-test `17 passed, 0 failed`;
  - ai-upkeep-wiring-test `4 passed, 0 failed`;
  - unit-cost-tempo-test `9 zaliczone, 0 niezaliczone`;
  - upkeep-test `91 passed, 0 failed`;
  - recruitment-no-upkeep-gate-test `37 passed, 0 failed`;
  - ai-recruit-upkeep-gate-test `23 passed, 0 failed`;
  - upkeep-difficulty-per-owner-test `19 passed, 0 failed`;
  - garrison-upkeep-tooltip-explain-test `28 OK, 0 FAIL`;
  - unit-upkeep-era-scale-test `24 ok, 0 FAIL`.
- PRE-EXISTING (nie od tej zmiany): `unit-upkeep-cost-pace-test` -> `WYNIK: 80 ok, 1 FAIL`, ten sam wynik co na bazie raportowany przez Operatora w rundzie 1.
- Nie uruchomiono: pomiar live (Chromium), pełny `runWorldEndTurn`.

## BLOKADY
- Pomiar live PRZED/PO: NIE ZMIERZONO.
- Karty jednostek, L46100 (suwak AI) i część pomocniczych funkcji economy-upkeep: niepodpięte (patrz pkt 4).
- Helper wyjątków państwa-miasta/barier: nie istnieje; wyjątków nie zastosowano.

## UWAGI-DLA-ORKIESTRATORA
1. Hak testowy `spawnAiUnits` (main.ts L34636) nadal liczy utrzymanie globalnym tempem; nie jest w ścieżce gry.
2. `unit-upkeep-cost-pace-test` ma pre-existing FAIL (asercja o tempie w 27 miejscach); osobny temat.
3. `main.ts` ma wiele wystąpień `totalUnitUpkeep`/`unitFoodPerTurn` w kodzie UI/debug; audyt pełny nie był w zakresie tej rundy.

RUNDY: 2/5 (obrona Haiku, runda 1 → Evaluator → obrona 2)
NASTĘPNY KROK: Evaluator (ponowna weryfikacja poprawek: override tury, pin liczony, pozostałe punkty) → Final Control; pomiar live jako osobny odcinek.
DEPLOY-PUSH: NIE WYKONANO
