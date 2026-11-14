# R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1 — obrona Operatora (runda 1, odpowiedź na raport Evaluatora 8b6d3b84d)

STATUS: DECISION_REQUIRED (zarzut 1 — dźwignia kolejki — NIE wdrożony w tej rundzie; zarzut 2 — test w Chromium — NIE_ZMIERZONO)
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1
GOAL: „Zakończ turę” zablokowana przy prognozie skarbca/spichlerza < 0 (od tury 11), gdy istnieje ruch naprawczy; dźwignie: podatki/podział, racje (suwak AI), rozwiązanie jednostek, wycofanie kolejki; stały tooltip z liczbami; brak zakleszczenia.
ZMIANY-COMMIT: kod obrony 28f8a258e62f5b883515def0d8a3ccb08307a097 (na bazie a356f5e54edd47d484c2e4c183a0a05290278d96). Zmienione pliki: gra/src/ui/hud.ts (tooltip także w starszym pasku „Zakończ turę ▶”), gra/tools/no-negative-stocks-end-turn-gate-levers-test.cjs (nowe przypadki (g), (h) i asercja wiringu legacy hud.ts). Ten raport: osobny commit na tej samej gałęzi.

TESTY (surowe wyjście, worktree na 28f8a258e, `npm ci` w gra/):
- `npx tsc --noEmit`: rc=0
- no-negative-stocks-end-turn-gate-levers-test: 25 passed, 0 failed (kandydat miał 17; dołożone: (g) podatek 12 + jednostki 10 razem >= 20 -> blokada, sam podatek 12 -> brak blokady; (h) dwa zasoby: jeden pokryty, drugi nie -> brak blokady; oba pokryte -> blokada, komunikat wymienia OBA zasoby; asercja wiringu legacy hud.ts)
- no-negative-stocks-endturn-test 19/0; no-negative-stocks-test 25/0; no-negative-stocks-projection-test 49/0; no-negative-stocks-ai-test 8/0; no-negative-stocks-c2-test 43/0 (bez regresji)
- MUTACJA wiringu main.ts (`_nnsZyskSpichlerz, levers);` -> `_nnsZyskSpichlerz, {});`): levers-test 23 passed, 1 failed (FAIL: (f) main.ts podaje dźwignie do bramki). Plik przywrócony (`git checkout -- gra/src/main.ts`, brak różnic).
- Mutacja logiki (zysk podatku = 0 w no-negative-stocks.ts): wykonana przez Evaluatora (3 FAIL), nie powtarzano.
- NIE_ZMIERZONO: test w Chromium (?civTest=1) / c3-turn-test — wymaga bundla `--dist` z buildu gra/, a `npm run build` w gra/ jest zakazany.
- NIE_ZMIERZONO: widoczność atrybutu `title` w przeglądarce.

## Odpowiedzi na zarzuty Evaluatora

1. Dźwignia (b) wycofania kolejki — PRZYJMUJĘ, NIE WDROŻONE w tej rundzie. Powód: AI (`planAiBalance` / `buildAiLevers`) nie ma modelu kosztu utrzymania/zakupu per pozycja kolejki (`cityProd.kolejka` / `rekrutacja`); jest tylko flaga `wstrzymajZakupy`. Wdrożenie wymaga zdefiniowania, które pozycje kolejki są „zakupem” i ile złota/żywności każda oszczędza na turę — to decyzja balansowa. Do decyzji orkiestratora: (A) osobna runda Operatora po decyzji ABC o definicji „zakupu”, albo (B) zamknięcie tematu bez dźwigni (b) i zapisanie długu.

2. Brak testu w Chromium — PRZYJMUJĘ, NIE_ZMIERZONO. Kryterium (a) z realnej ścieżki niespełnione. Build w gra/ zakazany; nie wykonano builda poza repo. Pokrycie: logika bramki (node) + wiring (mutacja potwierdzona, patrz wyżej).

3. Kryterium (c) / mutacja w main.ts — PRZYJMUJĘ CZĘŚCIOWO. Wykonano realną mutację kodu main.ts (wiring `levers`) — test czerwienieje (23/1). Mutacja samego obliczenia podatku w main.ts (`_nnsPodatekZysk`) nie jest wykrywana, bo ścieżka projekcji wymaga przeglądarki. NIE_ZMIERZONO w pełnym zakresie.

4. Duplikacja projekcji vs AI — ODRZUCAM (dowód). Blok `previewWithSplit` w `refreshLiveEmpireRatesUnsafe` (main.ts ~22867) wywołuje `previewCityEconomy` z TĄ SAMĄ listą argumentów co główna projekcja gracza (main.ts ~22773: `playerCities, map, data, _menuDifficulty, cityBuilt, player.era, ...`); różni się tylko mapą podziału. Projekcja AI (`nnsAiPreTickBalance`, main.ts ~7538-7549) działa na `ownerCities` i kontekście `ctx.*` (inne argumenty: `cityRelig`, `ctx.territoryNodes`, `new Map()`), więc nie jest wspólnym helperem o identycznym wejściu. Wspólny helper wymagałby zmiany ścieżki AI, poza allowlistą tematu („TYLKO gate gracza"). Pozostaje jako dług refaktoryzacyjny.

5. Dźwignia racji (suwak-zywnosc) poza dispatchem — ODRZUCAM (dowód). Dispatch pkt 1(a) wymaga „zmiany suwaków podatków/podziału (jak robi to AI w nnsAiPreTickBalance)". AI w tej samej funkcji używa dźwigni racji: `project({ rationsZero: true })` zeruje `poziomRacji`/`procentRozwoj` miast z przywróceniem (main.ts ~7538-7542, `savedR`), a `buildAiLevers` ma `suwakZywnosc` (no-negative-stocks.ts ~208-228). Gracz używa tej samej mechaniki (synchronicznie, przywracane w `finally`). Zostaje; zawężenie zakresu należy do orkiestratora.

6. Tooltip tylko w aktywnym layoucie — PRZYJMUJĘ i NAPRAWIONO (commit 28f8a258e). `renderBarLegacy` w hud.ts dostał `legacyEndTipAttr()` (ten sam escape co bottomBarHud, pusty gdy brak blokady). Asercja (f) w teście sprawdza wiring.

7. Dźwignie liczone tylko przy dirty — ODRZUCAM (dowód). `_nnsPodatekZysk` / `_nnsRacjeZysk` są zerowane WYŁĄCZNIE wewnątrz `refreshLiveEmpireRatesUnsafe` (main.ts 22862-22863 i catch 22906-22907), a ta funkcja jest wołana dopiero po przejściu `if (!empireEconDirty) return;` (main.ts ~22713-22716). Między przeliczeniami wartości się NIE zerują, więc zmiana salda bez dirty ich nie zeruje. Zysk dźwigni jest deltą projekcji (nie zależy od bieżącego salda); salda są czytane na żywo w `nnsGateForPlayer`. Pozostaje realna granica: gdy prognoza z ostatniego przeliczenia była >= 0, dźwignie nie są liczone, a saldo na żywo spadło poniżej zera — wtedy bramka liczy tylko jednostki (kierunek bezpieczny, brak zakleszczenia). Granica NIE_ZMIERZONO w grze, bez testu.

8. Brak testu łączenia dźwigni i minusu obu zasobów — PRZYJMUJĘ i NAPRAWIONO (commit 28f8a258e). Dodane przypadki: (g) podatek 12 + jednostki 10 razem pokrywają minus 20 (osobno żadna nie wystarcza); (h) minus obu zasobów: pokryty tylko jeden -> brak blokady; oba pokryte -> blokada, a komunikat wymienia OBA zasoby.

## BLOKADY
- Zarzut 1 (dźwignia kolejki) — brak wdrożenia; wymaga decyzji zakresu (pkt 1).
- Zarzut 2 / kryterium (a) — test Chromium NIE wykonany (build w gra/ zakazany).
- Kryterium (c) w pełnym zakresie (obliczenie podatku w main.ts) — NIE_ZMIERZONO.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch #368 i `00-dispatch-DODATEK-claude.md`: dispatch znaleziono na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (runs/…/00-dispatch.md) i w commicie f734ed0e6; na `origin/main` go nie ma. DODATEK nie istnieje na żadnej z tych gałęzi.
- Dług refaktoryzacyjny: wspólny helper projekcji podziału dla gracza i AI (pkt 4) — osobny temat.
- Dług testowy: test Chromium bramki Zakończ turę (kryterium a/b) — wymaga zgody na build poza repo albo zmiany zakazu.

RUNDY: 1/5 (obrona). Następny etap: decyzja zakresu (zarzut 1) albo Evaluator r2 (SONNET).
NASTĘPNY KROK: decyzja orkiestratora/właściciela: (A) runda Operatora z dźwignią kolejki po decyzji ABC o definicji „zakupu”, albo (B) zamknięcie tematu bez dźwigni (b) z długiem.
DEPLOY/PUSH: NIE WYKONANO
