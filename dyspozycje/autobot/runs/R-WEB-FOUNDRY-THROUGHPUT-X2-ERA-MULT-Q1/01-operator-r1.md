# 01 — Operator R1 — R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — ekonomia: przepustowość odlewni
TEMAT: R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1
GOAL: Odlewnia brązu, Odlewnia żelaza i Wielka odlewnia: 25 → 50 cykli/turę (baza) oraz mnożnik epoki WŁAŚCICIELA m(e) = 1 + 0,5 × (e−1) na cykle (1 / 1,5 / 2 / 2,5 / 3). Receptury i koszty bez zmian.

ZMIANY/COMMIT: `9855553fa` (kod + testy). Allowlista zachowana; `gra-robocza/`, `WERSJE.md`, `rust-port/`, `src-tauri/`, `battle/` nietknięte. Bazą był `origin/main` (BRICK już scalony, `ef8a01445`).
- `gra/data/econ-params.json`: `budynek_huta_przepustowosc`, `budynek_odlewnia_zelaza_przepustowosc`, `budynek_wielka_odlewnia_przepustowosc` 25 → 50 (easy/normal/hard); opisy zaktualizowane.
- `gra/src/game/converters.ts`: fallbacki 8 receptur 25 → 50 (wszystkie odlewnie + huta, bo huta dzieli klucz z odlewnią brązu); nowy zbiór `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` (6 receptur: `odlewnia_brazu`, `odlewnia_zelaza__braz/__zelazo`, `wielka_odlewnia__braz/__zelazo/__stal`) skalowany przez `citizenConsumptionEraMultiplier` (ta sama funkcja co konsumpcja obywateli, jedna definicja wzoru). Huta płaska. Garncarnia (+10%) i Cegielnia (mnożnik wyjścia z BRICK) bez zmian. Import `citizen-consumption-era` (czysty moduł) — nagłówek pliku zaktualizowany.
- Testy: nowy `gra/tools/foundry-throughput-x2-era-mult-test.cjs`; zaktualizowano stare liczby w `converter-era-scaling-test.cjs`, `citypanel-konwerter-produkcja-test.cjs`, `hud-konwerter-dopasowanie-test.cjs` (pinowały 25 / płaskie odlewnie z R-EKONOMIA-SUROWCE-SKALA-5X-Q1).
- Dokumentacja runu: `dyspozycje/autobot/runs/R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1/` (ten plik, `gate-tests.txt`) — w osobnym commicie.

ZMIERZONO PRZED / PO (mechanizm):
- PRZED: przepustowość odlewni płaska 25 niezależnie od epoki. Test nowy na kodzie bazowym: 84 pass / 69 fail (RED).
- PO, przy pełnych wejściach (silnik `advanceCityEconomy`, test sekcja E): odlewnia brązu gracz era1 = 50 brązu/turę, AI era3 = 100 (parytet owner-era).
- Odlewnia brązu epoka 2 = 75 cykli (50 × 1,5), epoka 3 = 100, epoka 4 = 125, epoka 5 = 150. Interpretacja „jeden, jeden i pół” = m(1)=1 — zgodna z dispatchem.
- Ograniczenie wejściem: `runConverter` z rudą 30 daje produkcję 30 w każdej epoce (wejście wiąże, nie cykle). Realny tick gry w przeglądarce: NIE_ZMIERZONO (brak uruchomienia UI w tej rundzie).

TESTY: (pełne wyniki w `gate-tests.txt`)
- `tsc --noEmit` (gra/, po `npm ci --ignore-scripts`): EXIT=0.
- `foundry-throughput-x2-era-mult-test.cjs`: 153 passed, 0 failed.
- Regresja zielona (EXIT=0): brick-x2, converter-era-scaling (123/0), converters-test, citypanel-konwerter-produkcja, hud-konwerter-dopasowanie, cyna-surowiec, ai-prod-fallback, ai-production-priority, deposit-building-gate, grupy-budynkow, magazyn-era-scaling, r-wzrost-szczescie, spichlerz-hud-params-parity, spichlerz-widocznosc, citizen-consumption-era-mult, wire-ekonomia, building-stock-visibility.
- Testy czerwone już na `origin/main` (pre-existing): ai-test 274/20 (zgodnie z dispatch), ekonomia-5x 197/50, eko-tech-paczka3 2 fail, koszty-surowcowe 3 fail, mennica-magazyn 7 fail, szczescie-przebudowa 4 fail, zelazo-gate 4 fail, resource-usage-breakdown 2 fail. Zbiór linii FAIL przed i po zmianie: **identyczny** (diff pusty).
- Determinizm: `war-allin-capital-quick.cjs` na danych origin/main vs po zmianie — hashe ON/OFF identyczne.
- `git diff --check`: czysto.
- Nie uruchomiono `npm run build`/`dev`.

BLOKADY / ZAŁOŻENIA:
1. Wielka odlewnia (3 receptury) w tej samej rodzinie co odlewnie — ZAŁOŻENIE wg dispatchu; wszystkie trzy klucze ustawione na 50.
2. Huta (receptura bez budynku) dostała fallback 50 (wspólny klucz z odlewnią brązu), ale pozostaje płaska — jej era nie ma znaczenia, bo nie działa w silniku.
3. Mnożnik epoki dla odlewni liczony przez `citizenConsumptionEraMultiplier`, który zaokrągla epokę ułamkową w dół; Garncarnia zachowuje dotychczasową formułę bez zmian.
4. Nie zmieniano komentarzy poza allowlistą, które po zmianie są nieaktualne (do korekty w osobnym temacie):
   - `gra/src/game/turn-economy.ts` ok. l. 2343: „Odlewnie NIE są w CONVERTER_ERA_SCALING_RECIPE_IDS — zostają płaskie”;
   - `gra/src/main.ts` ok. l. 3552 (HUD): „Odlewnie płaskie”;
   - nagłówek `converter-era-scaling-test.cjs` (l. 8–24) opisuje stare płaskie odlewnie.
   Funkcjonalnie poprawne (wołają wspólne helpery), tylko komentarze.
5. `ekonomia-5x-inwariant-test.cjs` ma 50 czerwonych linii sprzed tego tematu (m.in. stare pinowanie odlewni do 5); nie naprawiano — poza zakresem; zbiór FAIL bez zmian.
6. Nie znaleziono zaszytych liczb odlewni w `gra/src/ui/` ani w `gra/src/data/wikiBundle.json` (grep); teksty produkcji w UI pochodzą z silnika (`converterProductionDisplayForBuilding`), więc nie wymagały zmian. `gra/src/game/ai.ts` nie ma własnych szacunków przepustowości — nie zmieniano.
7. Realny tick w przeglądarce — NIE_ZMIERZONO.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1 — weryfikacja diffu `9855553fa` względem allowlisty i dispatchu; ocena założeń 1–3; decyzja o komentarzach z pkt 4.
DEPLOY/PUSH: NIE WYKONANO
