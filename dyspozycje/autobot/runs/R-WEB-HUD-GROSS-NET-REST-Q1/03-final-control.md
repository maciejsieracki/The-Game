STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HUD-GROSS-NET-REST-Q1
GOAL: Dokończyć brutto/netto w HUD, naprawić baner przy 640 px, ujednolicić skrót liczb w komunikacie main.ts.

WERDYKT ZARZUTÓW:
1. Prawy baner 640 px pusty -> NAPRAW wykonane w obronie (6616c22b4): max-width max(150px,...), zawijanie, ukryte etykiety. Zweryfikowane testem. Zamknięte.
2. BRUTTO/NETTO tylko w tooltipach dla Kultura/Religia/Obywatele/Miasta -> ODDAL: HUD-state nie ma osobnych strat; widoczna linia powtórzyłaby tę samą liczbę, a dodanie strat to zmiana logiki gry poza allowlistą. Tooltipy mają adnotację BRUTTO = NETTO. Brutto miasta dla Skarbca: NIE_ZMIERZONO.
3. Test nie sprawdzał prawego banera -> NAPRAW wykonane w obronie (4 szerokości, 5 chipów, >=100 px, brak wylewania/nachodzenia, 2 mutanty). Zamknięte.
4. Informacyjnie (czerwone testy baseline) -> ODDAL, niezwiązane (identyczne na origin/main wg Operatora; FC nie odtwarzał baseline).

Brak otwartego NAPRAW -> PASS-WITH-NOTES.

ZMIANY/COMMIT: SHA końcowy kodu do integracji: 6616c22b4 (FC dokłada tylko ten raport). Diff 37402ebe1..6616c22b4: wyłącznie gra/src/ui/hud.ts, hudChip6c.ts, cityPanel.ts, gra/src/main.ts (3 pola HUD-state + formatManpowerCompact), gra/tools/hud-gross-net-rest-test.cjs, runs/R-WEB-HUD-GROSS-NET-REST-Q1/**. Zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle. Zrzuty < 100 KB.
KOLEJNOŚĆ: baza 37402ebe1 jest przodkiem; origin/main = 7d2dccf42 (merge testowy R-WEB-TEST-DEBT-AI-Q2, tylko testy); origin/rust-port/parity-v2 = b520768b0. Zmiana dotyczy tylko gra/ (web), integrować na origin/main (merge/rebase na 7d2dccf42, po integracji powtórzyć tsc i test), niezależnie od parity-v2.

TESTY (własne, FC):
- npm ci --ignore-scripts; tsc --noEmit: EXIT=0.
- hud-gross-net-rest-test: 756 ok, 0 fail, EXIT=0, mutanty wykryte (w tym prawy baner).
- hud-topbar-grid-gross-net 1190 ok / 0 fail; hud-number-abbrev OK; praca-pula-rate-parity 20/0.
- Pełnej regresji 44 testów FC nie powtarzał (10 czerwonych baseline wg Operatora).
BLOKADY: kolizja stosu prawego banera z minimapą/dockiem przy <=800 px NIE_ZMIERZONO; żywa gra i okna <640 px NIE_ZMIERZONO; przyciski Civpedia/Menu w teście symulowane.
RUNDY: FC 1/5
NASTĘPNY KROK: integracja orkiestratora
DEPLOY/PUSH: NIE WYKONANO
