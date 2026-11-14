# R-WEB-UI-LEFT-BANNER-OVERFLOW-NARROW-WINDOW-Q1 (domain GAME/UI, Sonnet)
GOAL: lewy baner HUD nie wychodzi poza okno przy szerokościach 1366 i 1280 px (i 1024): wszystkie pola mieszczą się, bez poziomego przewijania i bez ucięcia; układ A zachowany przy szerszych oknach.
KRYTERIA: (1) pomiar Chromium (getBoundingClientRect) przy 1366/1280/1024: prawa krawędź banera ≤ szerokość okna, brak nakładania na prawy baner; (2) zrzuty przed/po obejrzane; (3) test czerwieni po mutacji; (4) tsc + 5 bramek referencyjnych; (5) zakaz zmiany treści/wartości HUD.
ALLOWLISTA: gra/src/ui/hud.ts, hudLayout.ts i style HUD, nowy test w gra/tools, raport.
Uwaga: Z_MAP_CONTROLS=309 (FALA 652) nie ruszać.
