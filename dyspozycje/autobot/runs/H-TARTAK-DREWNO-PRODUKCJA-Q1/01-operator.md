STATUS: PASS
DOMAIN: GAME
TEMAT: H-TARTAK-DREWNO-PRODUKCJA-Q1
GOAL: Tartak produkuje 200 Drewna/turę w epoce 1, 300 w epoce 2 i 450 w epoce 3; +50% multiplikatywnie na epokę właściciela.
ZMIANY/COMMIT: allowlista: gra/data/terrain-improvements.json, gra/src/game/terrain-improvements.ts, gra/src/game/turn-economy.ts, gra/src/main.ts, gra/tools/tartak-drewno-epoka-test.cjs, 02-production-audit.md; stan bazowy przed obroną eb7df3d3; commit naprawy obrony zostanie wpisany po zapisie zmian.
TESTY: `npm run typecheck` PASS; `node tools/tartak-drewno-epoka-test.cjs` PASS 14 assertions (0/1/2 Tartaki, epoki 1-3, niepoprawna epoka 0, wykonywalna mutacja formuły 1.5→1.0 = 4 czerwone przypadki, mutacja mapy, Kamieniołom bez regresji); `node tools/logic-test.cjs` PASS 213/213; `node tools/tech-tree-test.cjs` PASS 19/19; `node tools/research-test.cjs` PASS 33/33; `node tools/unit-replace-test.cjs` PASS 13/13; `node tools/combat-test.cjs` PASS 6/6; `git diff --check` PASS.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator ma sprawdzić diff i audyt; operator nie integruje, nie pushuje i nie deployuje.
DEPLOY/PUSH: NIE WYKONANO

## Implementacja

- `terrain-improvements.json`: Tartak `surowiec_ilosc_tura` 50 → 200.
- `terrain-improvements.ts`: jawny mnożnik Tartaku `1.5^(epoka_właściciela-1)`; inne ulepszenia pozostają płaskie.
- `turn-economy.ts`: rzeczywista ścieżka `computeTerritoryResourceYieldByCity` przyjmuje `resolveOwnerEra`; runtime i preview przekazują ten sam resolver.
- `main.ts`: pomocniczy odczyt stawek imperium używa `empireEpochForOwner`, więc HUD nie omija skalowania.
- Test jest bundlowany z rzeczywistych źródeł przez esbuild i ma czerwieniącą mutację (dodanie drugiego Tartaku zmienia 450 → 900).

## Audyt

Pełna tabela wszystkich 9 ulepszeń produkujących surowiec terytorialny oraz sumy 0/1/2 Tartaków znajdują się w `02-production-audit.md`.
