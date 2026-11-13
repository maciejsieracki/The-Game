STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — HUD brutto/netto (reszta), baner 640 px
TEMAT: R-WEB-HUD-GROSS-NET-REST-Q1
GOAL: dokończyć brutto/netto z TOPBAR-GRID (karta miasta, tooltipy Kultura/Religia/Obywatele), baner bez nachodzenia na medalion Mocy przy 640 px, spójny skrót liczb w komunikacie main.ts.

ZMIANY/COMMIT: baza origin/main 37402ebe1; kod a54729b1c (SHA tego raportu: `git log -1` brancha). PUSH nie wykonano. Allowlista czysta: hud.ts, hudChip6c.ts, cityPanel.ts, main.ts (HUD-state + komunikat), nowy test `gra/tools/hud-gross-net-rest-test.cjs`, run.

POMIAR PRZED (Chromium, ciemny motyw): baner kończył się na x=276, medalion Mocy zaczynał się na x=200 przy 640 px (nachodzenie 76 px); 1280/1024/800 bez nachodzenia (478<520, 378<392, 276<280). Tooltipy Kultura/Religia/Obywatele/Miasta (hud.ts ~1046-1070): tylko „Zielone +N", bez BRUTTO/NETTO. Karta miasta (cityPanel.ts, `buildCityOnlyW3FlankChips`): tooltipy 6 chipów bez zapisu BRUTTO → NETTO. Komunikat rozwiązania jednostki (main.ts ~6768; numer ~6733 z dispatchu był nieaktualny): `formatManpower` („tys./mln").

NAPRAWY:
- `hudChip6c.ts`: nowa wspólna `formatGrossNet(brutto, netto, jednostka)` → „BRUTTO +12 → NETTO +9 …".
- `hud.ts`: media ≤700 px (węższe kolumny + zwarty medalion Mocy, po regułach bazowych). PO: 640 px baner kończy się na 238, Moc od 245; brak przycięć, ikony ≥12 px. Tooltipy Kultura/Religia/Obywatele/Miasta przez `formatGrossNet`.
- `cityPanel.ts`: tooltipy 6 chipów (Praca, Żywność, Skarbiec, Nauka, Kultura, Religia) z BRUTTO → NETTO dla miasta i cywilizacji, gdzie dane są (Praca: wzór jak `pracaWplywBrutto`; Żywność: produkcja − racje oraz nadwyżka miast; Skarbiec: `bogactwoWplywyBrutto` → `bogactwoRate`). `EmpireHudSnap` +3 opcjonalne pola.
- `main.ts`: `getEmpireHud` podaje istniejące pola HUD-state (`pracaAutoUlepszeniaKoszt`, `pracaCudaKoszt`, `zywnoscWplywMiast`); komunikat używa `formatManpowerCompact` (k/M jak HUD); usunięty nieużywany import.

TESTY:
- tsc --noEmit: EXIT=0 (`gate-tsc.txt`).
- Nowy test: 346 ok / 0 fail (`gate-test-PO.txt`); PRZED na kopii hud.ts z origin/main: 6 czerwonych (640 px ×2, 4 tooltipy) (`gate-test-PRZED.txt`). Mutacje: 8/8 wykryte (usunięcie media, brak zmniejszenia Mocy, 3 tooltipy, stary formatManpower, brak BRUTTO w karcie Kultury i Pracy).
- Zrzuty PRZED/PO 1280/1024/800/640 (small/huge), każdy ≤ 47 KB.
- Regresje (glob hud|city-panel|empire-panel|tooltip|praca-pula-rate, 44 testów): `hud-topbar-grid-gross-net` 159/0, `hud-number-abbrev`, `praca-pula-rate-parity` zielone. Czerwone PO (10) = IDENTYCZNY zbiór PRZED na origin/main: dyplo-warunek, empire-panel-miasto-obywatele, empire-panel-moc-scroll, heks-panel-tooltip, hud-moc-warstwa, hud-obywatele-chip, hud-skarbiec, trade-routes-hud-filter (EXIT=1) oraz timeouty 150 s hint-toast-zindex, sidepanel-hud-deadzone. Zero nowych czerwieni. Pierwszy przebieg 6-równoległy miał OOM-kill (fałszywe czerwone), powtórzony sekwencyjnie po 2.

BLOKADY/NOTATKI:
1. Prognoza Pracy NIE rozszerzona: `pracaAutoUlepszeniaKoszt`/`pracaCudaKoszt` w HUD-state to koszty OSTATNIEJ tury, nie prognoza — dopisanie zmieszałoby wielkości; opis zostaje w tooltipie (zgodnie z dispatchem).
2. Kultura/Religia/Obywatele: brak osobnych strat w HUD-state, więc BRUTTO = NETTO z jawną adnotacją; tylko w tooltipach (widoczna liczba chipa bez zmian, jedna wartość).
3. Karta miasta: BRUTTO → NETTO tylko w tooltipach, nie jako widoczna linia chipa; brutto miasta dla Skarbca NIE_ZMIERZONO (tylko poziom cywilizacji).
4. Żywa gra (netto == endTurn) NIE_ZMIERZONO w tej rundzie (brak vite build; zmiana tylko prezentacja).
5. Okna <640 px NIE_ZMIERZONO. Testy uruchomione przez regresje nadpisały trwałe PNG innych runów — cofnięte `git checkout`.
6. Sprzątnięto `gra/node_modules`.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
