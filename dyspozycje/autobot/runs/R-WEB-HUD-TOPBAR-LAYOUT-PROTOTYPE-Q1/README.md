# R-WEB-HUD-TOPBAR-LAYOUT-PROTOTYPE-Q1 — prototyp układu banera (bez zmian kodu gry)

Baza: origin/main 9b019a7d8. Zmieniono wyłącznie ten katalog; `gra/**` nietknięte.

## Co widać
Zrzuty PRAWDZIWEGO banera (`renderBarD1B` + prawdziwy CSS z `gra/src/ui/hud.ts`, bundlowane esbuildem poza repo, Chromium headless, tło ciemne zamiast mapy). W runtime wstrzyknięty tylko CSS (`uklad-wspolne.css` + `uklad-A/B/C.css`) i podmienione teksty wartości. Plusy = dokładnie 70% liczby (kolumna `plusy_do_liczby` = 0.7 w `pomiary.csv`; liczba 22 px, plusy 15,4 px na oknach >1200 px; dziś w grze 17/9,5 px = 56%).

- `kolaz-A.png`, `kolaz-B.png`, `kolaz-C.png` — 4 szerokości (1920/1366/1024/640), wartości 20 000 / +2 000 / +2 000.
- `kolaz-porownanie-1366.png` — A/B/C pod sobą przy 1366 px.
- 48 zrzutów `zrzut-<wariant>-<szer>-<zestaw>[-fallback][-PRZYCIETE].png` (zestawy: male, 20000, duze, deficyt z czerwonym netto).
- `pomiary.csv`, `pomiary-skan-szerokosci.csv` (skan co 20 px 640–3000 px).

## Wnioski z pomiarów
- A i C (jedna linia): przy 20 000 / +2 000 / +2 000 potrzebują 865 px, baner ma dostępne 792 px przy 1920 px (limit = medalion Mocy) — NIE mieszczą się w jednej linii na 1920. Mieszczą się dopiero od ok. 2080 px (duże liczby 2 345 678: od 2360 px; małe „12”: od 1420 px, a przy 1920 px tak).
- Dlatego A/C na 1920/1366/1024/640 przy 20 000 pokazują fallback 2 rzędy po 3 (A: wysokość 123 px, C: 102 px). Fallback jest czytelny przy 1920 i 1366; przy 1024 i 640 plusy są przycięte (`-PRZYCIETE`).
- B (2×3, plusy obok): mieści się przy 1920 px; przy 1366 i niżej plusy i ikony są przycięte (potrzebuje ok. 1600 px dla 20 000). Najniższy baner (89 px).
- Brak nakładania żetonów i brak zachodzenia na medalion Mocy w żadnej kombinacji; brak poziomego scrolla.
- Obejrzałem zrzuty: plusy faktycznie ok. 70% liczby, nic się nie nakłada; w B przy 1366 ikony są ściśnięte/ucięte.

## Rekomendacja
C-fallback (2×3, bez etykiet, plusy pod liczbą 70%) jest najniższy i czytelny od 1366 px; prawdziwa jedna linia wymaga szerszego banera niż dziś (limit 50vw−150 px) albo skrótu liczb (k/M) przy dużych wartościach. Decyzja po stronie właściciela.

Powtórzenie: `npm ci --ignore-scripts` w `gra/`, potem `node render-prototypy.mjs` z tego katalogu.
