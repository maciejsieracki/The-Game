# 01-operator — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1

STATUS: PASS-WITH-NOTES
TEMAT: R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1
RUNDA: 1/5
GOAL: Rekrutacja sprawdza wyłącznie jednorazowy koszt zakupu jednostki; przyszłe utrzymanie nie blokuje zakupu i jest rozliczane w następnej turze wraz z istniejącymi konsekwencjami niedoboru.

## IZOLACJA I ZAKRES

- README potwierdzony w `Civ-clean-main-2026-08-20`.
- Dispatch target: HEAD `47cdca15757efb89d5e634e9e9ddff370925708d`; FALA 300 `ROBOCZA / VERIFY OK`.
- Checkout tematu to `work/clean-main-2026-08-20`, HEAD `47cdca15757efb89d5e634e9e9ddff370925708d`,
  zgodny z bazą dispatchu `47cdca15`; nie wykonano resetu ani checkoutu destrukcyjnego.
- Stary katalog `Civ` nie był używany.
- Tematyczna allowlista pozostaje ograniczona do `gra/src/game/economy-upkeep.ts`,
  `gra/src/ui/cityPanel.ts`, istniejących zmian rekrutacji/upkeep,
  `gra/tools/ai-recruit-upkeep-gate-test.cjs`, `gra/tools/recruitment-no-upkeep-gate-test.cjs`
  oraz artefaktów runu. Cudze zmiany worktree zostały pozostawione i nie są włączone
  do zakresu ani raportu jako zmiany tego tematu; nie wykonano resetu/usuwania.
- `gra/src/game/economy-upkeep.ts` rozdziela bramkę zakupu od rezerwy upkeepu; UI w
  `gra/src/ui/cityPanel.ts` pokazuje wyłącznie brak kosztu jednorazowego.
- `unitRecruitFullStockCost()` i rezerwa upkeepu pozostają jako diagnostyka/legacy, ale nie
  uczestniczą w zakupie; upkeep pozostaje w następnym ticku ekonomii.
- Dodano `pre-existing-test-drift.md` jako osobny raport artefaktu runu.

## ZMIANY/COMMIT

- Zaktualizowano `gra/tools/ai-recruit-upkeep-gate-test.cjs` z progów ×1 do kanonicznych
  danych FALI 300 ×5: Włócznik stock `50`, upkeep `10`, legacy full `60`, w tym
  scenariusze AI/MP/parytetu i chip/UI.
- Mechanika używa `unitStockCost` przy zakupie, a `totalUnitResourceUpkeep`/
  `resourceUpkeepUnitsByOwner` rozlicza utrzymanie dopiero w następnym ticku.
- AI/MP korzysta z tej samej owner-agnostycznej bramki i `rekrutacja[]`; kolejka Pracy,
  migracja legacy oraz `cityProd` w save/load pozostają spójne z tym kontraktem.
- Brak commita; zgodnie z dyspozycją bez commit/push/deploy.

## TESTY

- `node tools/ai-recruit-upkeep-gate-test.cjs` — **27 passed, 0 failed**.
- `node tools/recruitment-no-upkeep-gate-test.cjs` — **10 passed, 0 failed**.
- `node tools/upkeep-test.cjs` — **73 passed, 0 failed** (istniejący dowód z rundy poprzedniej; bez zmian mechaniki w tej korekcie).
- `node tools/unit-resource-upkeep-test.cjs` — **3 passed, 4 failed**; pre-existing ×1/×5 drift, pełny rozkład w `pre-existing-test-drift.md`.
- `node tools/unit-stock-cost-test.cjs` — **41 passed, 17 failed**; pre-existing ×1/×5 drift, pełny rozkład w `pre-existing-test-drift.md`.
- `node tools/ai-mp-rekrutacja-build-gate-test.cjs` — **21 passed, 0 failed**.
- `node tools/rekrutacja-skarbiec-only-test.cjs` — **13 passed, 0 failed**.
- `node tools/ai-rekrutacja-parytet-test.cjs` — **7 passed, 0 failed**.
- `node node_modules/typescript/bin/tsc --noEmit` — **exit 0**.
- Wcześniej potwierdzone i bez zmian: save/load `fort-nodes-save-load-test.cjs` 18/18,
  `fsa-autosave-test.cjs` 55/55; w tej rundzie `save-load-sort-test.cjs` **4/4**.
- `git diff --check` na całym współdzielonym worktree wskazuje wyłącznie istniejące
  trailing whitespace w cudzych dokumentach; brak wskazania na plik tematu.
- Nie użyto `npm run build` ani `npm run dev`.

## BLOKADY

- Worktree nadal zawiera mieszane, niezależne zmiany innych tematów; zostały odseparowane
  raportowo, pozostawione nietknięte i nie są na allowliście tego tematu.
- Dwa sąsiednie testy pozostają czerwone jako jawnie sklasyfikowany pre-existing drift;
  nie są raportowane jako PASS i wymagają osobnego tematu, jeśli mają zostać naprawione.
- Nie jest to blokada mechaniki: tematyczne bramki AI/MP i typecheck są zielone.
- Integrację pełnego worktree blokują mieszane zmiany innych tematów; do dalszego obiegu wolno
  przekazać wyłącznie zakres allowlisty.

## RUNDY

Runda 1/5 — implementacja/audyt Operatora.

## NASTĘPNY KROK

Evaluator — niezależna kontrola tego samego ID, allowlisty, raportu driftu,
AI/gracz/MP, następnej tury upkeep/deficytu, UI gate i save/load.

## DEPLOY/PUSH

NIE WYKONANO
