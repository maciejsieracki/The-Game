STATUS: PASS
DOMAIN: GAME (WEB) — prezentacja tooltipu heksu
TEMAT: R-WEB-HEX-TOOLTIP-UNLOCK-LABEL-DEDUP-Q1
GOAL: etykieta odblokowania ulepszenia nie powtarza surowca już podanego w wierszu produkcji.

## Pomiar PRZED (baza origin/main f54fb5c18, epoka 3, prawdziwy buildHexContextTooltipHtml)
Dubel (surowiec w produkcji i w etykiecie odblokowania) w dwóch miejscach `gra/src/ui/hexContextTooltip.ts`:
- `formatImprovementDesc` (ulepszenia postawione, przed zmianą l.183 `labelsForImprovementUnlock`): „+113 Drewno/t → plony miasta: … · Drewno” (tartak); analogicznie kopalnia cyny „+45 Ruda cyny/t … · Ruda cyny”, stadnina „+56 Koń/t … · Koń”, kamieniołom „Kamień”, kopalnia miedzi „Ruda”, kopalnia żelaza „Ruda żelaza”.
- lista „Możliwe ulepszenia” (l.502): „Kamieniołom → +113 Kamień/t · plony miasta … · odblok. Kamień”.
- Obóz łowiecki i farma: brak etykiety odblokowania (brak dubla). Pozostałe 6 przypadków: dubel potwierdzony.
- NIE ZMIERZONO/poza zakresem: linia „Surowce / zasoby” (`collectResourceLabels`, l.345) to osobna lista złóż/dostępu, nie tekst produkcji; nie ruszana (np. „Kon · Koń” przy stadninie to osobny temat).

## Zmiana
`gra/src/ui/hexContextTooltip.ts`: nowa `unlockLabelsBeyondProduction(key, zloze, ownerEra)` — z etykiet `labelsForImprovementUnlock` odrzuca te równe etykiecie surowca z `territoryResourceYieldForImprovement` (wiersz produkcji); używana w obu miejscach. Etykieta zostaje, gdy nie ma wiersza produkcji (bydło/owce/lama „Trzoda…”) albo dotyczy innego surowca. ZAŁOŻENIE zapisane w kodzie i teście. `resource-access.ts` bez zmian; zero zmian w logice gry.

## Testy
- NOWY `gra/tools/hex-tooltip-unlock-label-dedup-test.cjs` (prawdziwy kod + render Chromium, CSS tooltipu): RED na bazie 21 pass / 7 fail (`gate-red-before.txt`); GREEN po zmianie 28/0 (`gate-green-after.txt`).
- Mutacje: A (filtr usunięty) -> 7 FAIL; B (zawsze puste etykiety) -> 1 FAIL (bydło zachowane). Obie zabite.
- `tsc --noEmit`: EXIT=0 (`gate-tsc.txt`).
- Regresje `gra/tools/*tooltip*|*resource-access*|*unlock*|*improvement-adapter*` (15 plików) PRZED vs PO: identyczne. 11 PASS w obu; 4 FAIL w OBU (bez związku ze zmianą, preegzystujące): dyplo-warunek-niespelniony-czerwony-tooltip (22/26), heks-panel-tooltip-warstwa (`tileYieldLabel()`), hex-tooltip-mozliwe-ulepszenia-zloze (warunek `oboz_lowiecki`), hud-tooltip-body-mounted-panels. Żaden test nie wymagał aktualizacji.
- Uwaga: test dyplo nadpisuje PNG dowodów w runie R-DYPLO-…; przywrócone `git checkout`.

## ZMIANY/COMMIT
Allowlista: `gra/src/ui/hexContextTooltip.ts`, `gra/tools/hex-tooltip-unlock-label-dedup-test.cjs`, `dyspozycje/autobot/runs/R-WEB-HEX-TOOLTIP-UNLOCK-LABEL-DEDUP-Q1/**` (00-dispatch, 01, gate-*.txt). SHA: patrz commit (git log -1 tej gałęzi worktree). `gra/node_modules` usunięty.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (te same ID); sprawdzić 4 preegzystujące FAIL jako niezależne.
DEPLOY-PUSH: NIE WYKONANO
