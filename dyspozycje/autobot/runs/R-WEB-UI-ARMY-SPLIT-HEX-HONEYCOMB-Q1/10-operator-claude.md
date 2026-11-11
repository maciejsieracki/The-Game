STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-UI-ARMY-SPLIT-HEX-HONEYCOMB-Q1
GOAL: 7 identycznych regularnych heksow w panelu "Rozdziel armie", scisle przylegajacych (jednakowa szczelina na 12 stykach), z jednego wzoru.
ZMIANY/COMMIT: gra/src/ui/armySplitPanel.ts (geometria z jednego wzoru), gra/tools/army-split-hex-honeycomb-test.cjs (nowy), evidence/ (zrzuty, pomiary). SHA: patrz pole sha zwrotu.
TESTY:
- Pomiar Chromium (/opt/pw-browsers/chromium-1194), kontenery 340/300/260 px, 6 dostepnych i 3 dostepne (NW,E,SW; reszta disabled zachowuje miejsce): 30 pass / 0 fail. Surowe tabele: evidence/measure-after.txt. Np. @340: komorki 110.27x127.31 (zakres 0.00), odleglosci srodkow 114.85-114.88, szczeliny 4.59-4.61 (zakres 0.02); @260: 84.31x97.36, dist 87.83-87.84, szczelina 3.51-3.53.
- Mutacja (stare procenty pozycji): 12 FAIL / 18 pass (evidence/mutation-run.txt). Stary kod w calosci: 18 FAIL / 12 pass (evidence/measure-before-oldcode.txt).
- tsc --noEmit: czysto. army-split-graphical-hex-picker 14/0, army-split-ruch-icons 7/0, army-split-movement 4/0, army-merge-panel-scroll-real-render 27/0, army-merge-panel-production-mount 9/0, army-merge-split-direction-icons PASS.
- army-split-panel-scroll-grid: 16 PASS / 2 FAIL ("PRZED ... RED-PRE") - IDENTYCZNIE na origin/main (16/2 sprzed zmiany), dlug niezwiazany.
- Bramki: logic 213/213, tech-tree 20/0, research 33/33, unit-replace 21/21, combat 6/6.
- Zrzuty: evidence/before-panel-{340,280}px.png (stary kod), after-panel-{340,280}px.png, after-map-*.png.
BLOKADY: brak
ZALOZENIA: (1) Dispatch kaze zachowac orientacje flat-top, ale jednoczesnie mapowanie E/NE/NW/W/SW/SE (uklad pointy-top jak mapa gry: W/E w jednym rzedzie). Ksztalty flat-top NIE moga scisle przylegac w tym ukladzie - to zrodlo bledu. Zachowano mapowanie kierunkow i logike wyboru; ksztalt zmieniono na pointy-top (wierzcholki gora/dol), clip-path polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%). (2) Szczelina = 4% rozstawu (staly ulamek, ok. 4.6 px @340), obwodka :before 3px bez zmian. (3) Mapa wyzsza (340x326 zamiast 340x224), bo heksy pointy-top 2:sqrt3; body panelu ma scroll, scroll-grid bez regresji.
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
