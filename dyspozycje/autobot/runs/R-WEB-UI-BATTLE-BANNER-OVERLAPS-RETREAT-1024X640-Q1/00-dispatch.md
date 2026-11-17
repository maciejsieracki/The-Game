# R-WEB-UI-BATTLE-BANNER-OVERLAPS-RETREAT-1024X640-Q1 (BANNER)

DOMAIN: GAME (UI bitwy; błąd wykryty w testach — stała zgoda właściciela z 2026-11-01 na naprawę błędów webowych bez ABC) · Operator HAIKU · Evaluator SONNET · Obrona HAIKU · FC SONNET · max 5 rund.

## Zgłoszenie
Przy rozdzielczości **1024×640** baner bitwy zasłania przycisk **„WYCOFAJ SIĘ”** i wynik (zauważone przez Operatora i Evaluatora w DMGCOLORS r2 na zrzucie z `gra/tools/battle-damage-colors-live-test.cjs`; ten driver dochodzi do realnej walki w Chromium — użyj go jako wzorca/repro).

## GOAL
W bitwie (ręcznej/AUTO) przy 1024×640, 1280×720 i 1440×900 żaden element UI nie zasłania przycisku „WYCOFAJ SIĘ”, wyniku/licznika ani innych przycisków akcji; układ nie psuje większych rozdzielczości (brak regresji layoutu).

## Zakres
- Znajdź (rg) baner bitwy i panel przycisków (np. `gra/src/battle/battleHud*.ts`, `battleScene.ts`, style HUD) i przyczynę nakładania (pozycja/z-index/wysokość banera przy małej wysokości okna). Minimalna zmiana CSS/układu; bez zmiany logiki bitwy, danych, balansu.
- Nowy test `gra/tools/battle-banner-retreat-overlap-live-test.cjs` (Chromium, xvfb, vite `--outDir` poza repo wg C-001): w 3 rozdzielczościach po starcie walki sprawdza `getBoundingClientRect` banera vs przycisku „WYCOFAJ SIĘ” (brak przecięcia) i klikalność przycisku (`elementFromPoint` w jego środku = przycisk); test czerwienieje po mutacji (kopia pliku, NIE `git checkout`). Zrzuty do /tmp i obejrzane (nie do repo).

## Kryteria binarne
- 3 rozdzielczości: baner nie przecina przycisku, `elementFromPoint` = przycisk; test zielony + RED po mutacji.
- Istniejące testy HUD bitwy bez nowej czerwieni (battle-tempo-minimap-brand, battle-hp-display, battle-damage-colors-test, ambush-ui-reason); tsc bez nowych błędów; 5 bramek referencyjnych.
- Brak zmian w `gra/data`, `gra-robocza`, `WERSJE.md`.

## Zakazy
`npm run build/dev` w `gra/`, `git add -A`, `rm/rmdir/unlink` w komendach, logi do /tmp, PNG nie do repo. Model Operatora HAIKU.
