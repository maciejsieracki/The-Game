STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HEX-TOOLTIP-IMPROVEMENT-PRODUCTION-TEXT-Q1
GOAL: w tooltipie heksu ulepszenie surowcowe najpierw podaje produkcję („+50 Kamień/t”); bez „magazyn państwa” / „DO MAGAZYNU PAŃSTWA”.
ZMIANY/COMMIT: SHA commitu: `git log -1` brancha worktree-wf_90ccd579-5fe-1 (commit zawierający ten raport; SHA podany w odpowiedzi końcowej). Pliki: `gra/src/ui/hexContextTooltip.ts`, NOWY `gra/tools/hex-tooltip-improvement-production-text-test.cjs`, zrzuty `przed|po-{desktop,mobile}.png` (każdy <= 104 KB), ten raport. Baza: origin/main 1247214fd.

## Znaleziska (plik:linia na bazie 1247214fd)
- hexContextTooltip.ts:182 `formatImprovementDesc` — wiersz „magazyn państwa: … · bez 👤” pod plonami miasta.
- :188-198 `formatHexMagazynSummary` + :593-604 sekcja „Do magazynu państwa” („… · automatycznie”).
- :507 lista „Możliwe ulepszenia (teren)” — „· magazyn państwa: … · bez 👤”.
- :623 stopka „Magazyn → ulepszenia …”.
- `improvementAdapter.ts`: brak takich tekstów (git grep). `cityPanel.ts:1170/3813/5566/5676`, `empireDetailPanel.ts:3348`, `hud.ts:143/983` — „magazyn” w innym znaczeniu (utrzymanie budynków, żywność, HUD), nie opis produkcji ulepszeń → bez zmian.

## Zmiany (hexContextTooltip.ts)
1. `formatImprovementDesc`: nazwa (tag) → `<br>` linia produkcji (ikona + „+N Surowiec/t”, klasa `cp-magazyn-line cp-prod-line`) → `<br>→ plony miasta: …`. Ulepszenia bez produkcji (np. Obóz łowiecki) — format bez zmian.
2. Usunięto `formatHexMagazynSummary` i wiersz „magazyn państwa”.
3. Sekcja „Do magazynu państwa” usunięta; zostają tylko plony terenu (drewno/kamień/glina „przy 👤”) pod nagłówkiem „Surowce z terenu (przy 👤)” — to informacja o terenie, nie o ulepszeniu, więc nie „zawiera się w linii produkcji” (ZAŁOŻENIE).
4. Lista możliwych ulepszeń: „→ +N Surowiec/t · plony miasta: …”.
5. Stopka bez słowa „Magazyn”/„automatycznie”.
Liczby i reguły produkcji bez zmian. „bez 👤”/„automatycznie” pominięte — reguła domyślna dla ulepszeń (ZAŁOŻENIE: brak warunku obsadzenia w `territoryResourceYieldForImprovement`, więc brak różnicy dla gracza).

## Testy
- Nowy test (21 asercji: string + Chromium 340/320 px, kolejność DOM, brak poziomego scrolla, zrzuty <= 1 MB): RED na starym pliku 10 PASS / 11 FAIL (EXIT=1), GREEN po zmianie 21/0 (EXIT=0).
- tsc `--noEmit`: EXIT=0.
- Regresje PRZED vs PO (`*tooltip*`, `*hex-context*`, `*improvement-adapter*`, `*entity-card*`, `*resource-visibility*`, + hex-plony-magazyn, deposit-building-gate): wyniki PASS/FAIL identyczne. Czerwone PRZED i PO (niezwiązane): dyplo-warunek-niespelniony-czerwony-tooltip, hex-tooltip-mozliwe-ulepszenia-zloze (1 FAIL), entity-card-action-buttons-real-render, hex-plony-magazyn, deposit-building-gate; hud-tooltip-body-mounted-panels = timeout 150 s (PRZED i PO). entity-card-cross-links-nested-overlay: FAIL PRZED, PASS PO (niestabilny, niezwiązany). Żaden test nie oczekiwał starych tekstów — brak aktualizacji testów.
- Ograniczenie: render używa stubu `icons/brandAssets` (import vite `?raw`), ikony puste w zrzutach; test sprawdza obecność `.cp-yield-ic`. CSS realny z `sidePanelHud.ts`. Weryfikacja w pełnej aplikacji — NIE_ZMIERZONO (zakaz build/dev).
- `node_modules` usunięty po pracy.

## Uwaga
Przy ulepszeniach z produkcją nadal doklejany jest `labelsForImprovementUnlock` („· Drewno”) — dubluje etykietę surowca; poza zakresem, do oceny Evaluatora.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
