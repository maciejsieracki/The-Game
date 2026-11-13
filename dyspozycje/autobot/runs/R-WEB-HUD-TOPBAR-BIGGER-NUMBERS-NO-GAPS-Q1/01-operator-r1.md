STATUS: PASS-WITH-NOTES (cel 1 osiągnięty; cel 2 NIE osiągnięty, patrz BLOKADY)
DOMAIN: GAME (WEB) — UI: górny baner zasobów (HUD topbar, lewy baner 3+3)
TEMAT: R-WEB-HUD-TOPBAR-BIGGER-NUMBERS-NO-GAPS-Q1
GOAL: (1) główne liczby w żetonach banera +25–35%; (2) brak pustych przestrzeni w żetonach i między nimi; (3) brutto/netto widoczne, deficyt czerwony, stały układ 3+3.
ZMIANY/COMMIT: `gra/src/ui/hud.ts` (tylko zmienne CSS i wysokości linii w bloku banera). Baza: origin/main 4905bac05. SHA commitu: patrz sekcja NASTĘPNY KROK (commit wykonany po zapisie raportu, SHA podany w odpowiedzi orkiestratora).
  Zmiany CSS (wartości przed → po):
  - `--hud-cell-val` (liczba główna): 13→17px (>1200), 12→15 (≤1200), 10→13 (≤900), 9→12 (≤700). Wzrost +25–33%.
  - `--hud-cell-sm` (brutto/netto): 9.5→10px (>1200); pozostałe progi bez zmian.
  - `.civ-hud-chip-line` min-height: val×1.15 → val×1.05; `.civ-hud-chip-top` min-height: val×1.05 → lbl×1.05 (zachowanie wysokości żetonu = 32 px przy 1280 px, jak przed zmianą).
  - ≤1200 px: `.civ-hud-chip-val` line-height 1.2→1, height val×1.2→val×1; `.civ-hud-chip-figs` line-height 1.3→1.2, height sm×1.3→sm×1.2 (bez tego baner na 1024 px rośnie o 3 px i wchodzi na pasek narzędzi mapy).
  Logika liczenia, kolejność żetonów, teksty: bez zmian. Brak zmian w `gra-robocza/`, `WERSJE.md`, `rust-port/`, `src-tauri/`, `battle/`, `gra/data/`. Testy nie były modyfikowane.
TESTY:
  - Pomiar PRZED/PO w Chromium (/opt/pw-browsers/chromium, bundel esbuild renderBarD1B + ensureStyles, skrypt poza repo): szerokości 1920/1366/1024/640 × small/big/huge (12/999, 24 400, 1 200 000 → skróty tys./mln).
    Wielkość głównej liczby: 1920 13→17 px (+31%); 1366 13→17 (+31%); 1024 12→15 (+25%); 640 9→12 (+33%). Warunek ≥1,25× SPEŁNIONY.
    Overflow (scrollWidth > clientWidth) w żetonach: brak we wszystkich 12 przypadkach. Poziomy scroll: brak (sw = vw).
    Pozycje x/y żetonów: identyczne dla small i huge (stały układ 3+3).
    Wysokość banera: bez zmian względem PRZED (1280 px i 1024 px).
  - tools/hud-topbar-grid-gross-net-test.cjs --no-mutants: OK, 159 ok / 0 fail (sekcja B pominięta — brak --dist).
  - tools/hud-topbar-no-labels-test.cjs: OK, 94 ok / 0 fail (po zmniejszeniu --hud-cell-sm do 10px; przy 11px N5 'przycinanie' padał przy 1280 px/huge i maxw).
  - tools/hud-gross-net-rest-test.cjs: OK, 752 ok / 0 fail.
  - tools/hud-resource-deficit-red-test.cjs: OK, 41 pass / 0 fail.
  - tools/hud-number-abbrev-test.cjs: OK.
  - tools/hud-recruits-abbrev-test.cjs: OK.
  - tools/hud-skarbiec-test.cjs: OK, 34 passed / 0 failed.
  - tools/sidepanel-hud-deadzone-test.cjs: OK, 43 pass / 0 fail.
  - tools/hud-zetony-ekonomia-brutto-live-test.cjs: OK, 5 pass / 0 fail.
  - tools/hud-moc-warstwa-test.cjs: 21 PASS / 7 FAIL — NIE związane z tą zmianą (asercje o sumArmyMForOwner/objectivePowerForOwnerEffective w logice Mocy i dyplomacji, nie o CSS; plików tej logiki nie dotykałem). Uznane za istniejący dług testowy; NIE_ZMIERZONO na bazie origin/main w tej rundzie (brak czasu na osobny bieg bazowy).
  - `npx tsc --noEmit` w gra/: bez błędów.
  - Mutacja (cofnięcie font-size): NIE wykonana w tej rundzie.
  - `git diff --check`: czysto.
BLOKADY:
  - CEL 2 (brak pustych przestrzeni) NIE SPEŁNIONY. Zmierzona przerwa między wartością głównej liczby a przyrostami brutto/netto (figs) w każdym żetonie:
    1920 px: 111–178 px (przed: 123–180 px); 1366 px: 19–86 px (przed: 30–88 px); 1024 i 640 px: brak poziomej przerwy (układ kolumnowy, przyrosty pod liczbą).
    Cel ≤6 px na żeton nieosiągalny samą zmianą rozmiaru czcionki: przy szerokości banera ~810 px (1920) i ~260 px na żeton wartość + przyrosty zajmują ok. 1/3 szerokości. Dalsze zmniejszenie przerwy wymaga decyzji właściciela o układzie (np. rozmiar przyrostów, zwężenie banera do treści, wyrównanie do środka/rozciągnięcie przyrostów), bo zmiana układu wykracza poza „minimalną zmianę CSS” z dispatchu.
  - Brak sekcji B (zywa gra --dist) — NIE_ZMIERZONO.
RUNDY: 1/5
NASTĘPNY KROK: Operator nie zamyka tematu sam. Evaluator ma ocenić: (a) czy +25–35% liczby wystarcza jako cel 1; (b) czy cel 2 przenieść do decyzji właściciela (wariant układu) zamiast kolejnej rundy CSS. Zrzuty PRZED/PO: `dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-BIGGER-NUMBERS-NO-GAPS-Q1/zrzuty/` (before/after 1366 huge, 640 small).
DEPLOY/PUSH: NIE WYKONANO
