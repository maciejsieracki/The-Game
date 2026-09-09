# 01-operator — H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1
GOAL: Produkcja Kamieniołomu 200/300/450 Kamienia na turę w epokach 1/2/3,
      z pełnym audytem produkcji surowców.
ZMIANY/COMMIT: 7068e7a80a2e9232b59924b93ab99adfb764e0a6
  - gra/data/terrain-improvements.json
  - gra/src/game/terrain-improvements.ts
  - gra/src/game/turn-economy.ts
  - gra/tools/kamieniolom-kamien-epoka-test.cjs
  - dyspozycje/autobot/runs/H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1/02-production-audit.md
  - dyspozycje/autobot/runs/H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1/00-dispatch.md (nazwa testu)
TESTY:
  - npm run typecheck: PASS (tsc --noEmit, 0 błędów)
  - node tools/kamieniolom-kamien-epoka-test.cjs: 20 PASS, 0 FAIL
  - MUTATE_FORMULA=1 node tools/kamieniolom-kamien-epoka-test.cjs: FAIL oczekiwany,
    mutacja zaczerwienia test
  - node tools/logic-test.cjs: LOGIC OK (213/213)
  - node tools/tech-tree-test.cjs: 19/19 pass
  - node tools/research-test.cjs: 33/33 pass
  - node tools/unit-replace-test.cjs: 13/13 pass
  - node tools/combat-test.cjs: 6/6 pass
  - git diff --check: PASS
BLOKADY: brak blokady implementacji. Uwaga: historyczny
  gra/tools/tartak-glinianka-rate-Q1-test.cjs jest zakotwiczony na stawkach 50
  i po zmianie właścicielskiej decyzji 200/300/450 zgłasza 5 rozbieżności
  (Tartak/Kamieniołom). Plik jest poza allowlistą, więc nie został zmieniony.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator na commicie 7068e7a80a2e9232b59924b93ab99adfb764e0a6.
DEPLOY/PUSH: NIE WYKONANO
```

## Wynik

Rzeczywisty resolver `territoryResourceYieldForImprovement` dostał jawny parametr
epoki i bezpieczny fallback epoki 1. Rzeczywiste naliczanie
`computeTerritoryResourceYieldByCity` przekazuje do niego ten sam resolver epoki
właściciela, którego używa runtime (`main.ts::empireEpochForOwner` przez
`advanceCityEconomy`). Kamieniołomy dają 200/300/450, dwa dają 400/600/900,
a brak ulepszenia 0. Test obejmuje także epokę 0/99 i regresję Tartaku.

Audyt `02-production-audit.md` obejmuje wszystkie 9 ulepszeń produkujących
surowiec terytorialny, z kluczem, surowcem, bazą i wartościami epok 1–3.

Nie uruchamiano `npm run build` ani `npm run dev`. Nie wykonywano pushu,
deployu ani integracji do `main`.
