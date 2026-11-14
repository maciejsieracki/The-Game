# 50 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/CSS lewego banera HUD)
TEMAT: R-WEB-UI-LEFT-BANNER-CHIP-GRID-TOP-CLIP-Q1
GOAL: siatka chipow lewego banera (tryb 2x3, .hud-left-fallback) nie wystaje nad okno takze przy 800x720 i 800x900; 1000x700 bez zmian (56 px).
ZMIANY-COMMIT: kandydat 6206ba1f2e59fe15ccf3dcd93ae152f0f44d1ee5 (potomek bazy 7aaa231d6, merge-base --is-ancestor = tak). Diff vs baza: gra/src/ui/hud.ts (+9, CSS @media (max-width:999px) -> powloka 88 px dla .hud-left-fallback), gra/tools/left-banner-chip-grid-clip-test.cjs (nowy), dokumenty runu + 4 zrzuty evidence. Zgodne z allowlista; tylko CSS, bez zmian logiki.
ZARZUT 1 (bramka po wysokosci): ODDAL — rozwiazany w obronie (bramka szerokosci <1000 px; 800x720 i 800x900 w tescie, wszystkie PASS). Brak pozycji NAPRAW.
TESTY (surowe wyniki, Chromium przez harness esbuild+playwright):
- left-banner-chip-grid-clip-test: exit 0, 204 ok / 0 fail.
- mutant (--mutant, 56 px): exit 1, 13 linii FAIL.
- left-banner-overflow-narrow 74/0; hud-panels-below-banner 130/0; hud-topbar-layout-a 144/0; hud-topbar-one-row 140/0; hud-topbar-no-labels 94/0.
- tsc: pelny tsc w tym srodowisku daje bledy TS2352/TS2554 w src/audio/filePlayer.ts (brak typow vite w srodowisku, niezwiazane); 0 bledow w hud.ts.
BLOKADY: brak.
NIE_ZMIERZONO: pelna gra na zywo; testy logiki/combat (zmiana CSS); tsc z node_modules projektu; pozostale bramki referencyjne (hud-topbar-grid-gross-net, bigger-numbers, city-side-panels) — wg raportu Obrony zielone.
UWAGI-DLA-ORKIESTRATORA: (1) 00-dispatch.md i 00-dispatch-DODATEK-claude.md nie istnieja pod podanymi sciezkami; ocena wg tresci zadania. (2) Znane zachodzenie ok. 5,6 px dolu siatki w panele boczne (104 px) przy fallbacku 800 px — swiadoma decyzja, poza zakresem.
RUNDY: FC 1.
NASTEPNY KROK: integracja orkiestratora (FF kandydata 6206ba1f2), bramki.
DEPLOY/PUSH: NIE WYKONANO
