# 01 — OPERATOR (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: `P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`
GOAL: Lista „ULEPSZENIA TERENU" w panelu budowy ma być **w całości osiągalna i klikalna**
przy każdym realistycznym powiększeniu przeglądarki i rozmiarze okna.

## Które hipotezy faktycznie zachodzą (pomiar, nie zgadywanie)

Siatka 28 punktów w żywym Chromium: powiększenie przeglądarki 100/125/150/175/200%
(viewport `W/zoom × H/zoom` + `deviceScaleFactor:zoom` przy stałym oknie fizycznym — to
dokładnie tak Chrome realizuje Ctrl+, w odróżnieniu od CSS `zoom`, które nie kurczy `100vh`)
× wysokość okna 1080/900/768/640, plus powiększenie UI gry 125/150% × te same wysokości.

- **Hipoteza 1 — ZACHODZI, ale dla powiększenia UI gry, nie przeglądarki.** `hud.ts::applyUiZoom`
  skaluje `<body>` transformem, więc body staje się blokiem zawierającym dla `position:fixed`,
  a `vh` w `max-height:calc(100vh - 180px)` nadal liczy się od viewportu. Przy 125/150% panel
  kończył się na y=1238 / y=1485 w oknie 1080 px, `scrollTop` już na maksimum (515/515) —
  **suwak dojeżdżał do końca, a ostatnie pozycje nadal leżały pod krawędzią ekranu**. 8/8
  punktów: (b) nieosiągalna, (c) `elementFromPoint` = `null`. Przy samym powiększeniu
  przeglądarki 20/20 punktów było OK — ta połowa hipotezy 1 jest fałszywa.
- **Hipoteza 2 — ZACHODZI, niezależnie od powiększenia.** `180px` < realne `turnStackBottomPx()`
  = 172 + odstęp: prostokąt panelu wchodził **75 px** w stos WYKONAJ/ZAKOŃCZ TURĘ w KAŻDYM z 28
  punktów (181/218 px przy powiększeniu UI). Kierunek zasłonięcia odwrotny niż sugerował zrzut:
  panel ma z-index 311, pasek 310, więc to **lista połykała kliknięcie w WYKONAJ**
  (`elementFromPoint` na środku WYKONAJ → `.civ-build-item`).
- **Hipoteza 3 — NIE ZACHODZI.** Realne `mouse.wheel` nad listą: `scrollTop` rośnie, licznik
  `wheel` na kanwie = 0. Kamera słucha `wheel` na kanwie (`render/camera.ts:229`), nie na
  `window`. Nic nie naprawiano — zgodnie z §14 nie poszerzam zakresu o nieistniejący błąd.

## Naprawa

Rezerwa dolna z jednego źródła prawdy (`hudLayout.ts::turnStackBottomPx` + ten sam odstęp co
panel wydarzeń) i limit wysokości w `%` zamiast `vh` — `%` liczy się od bloku zawierającego,
więc jest poprawny w obu układach współrzędnych. Osobna reguła `html.civ-ui-zoom-active`, jak
w `.civ-side-panel` i `.civ-bottom-bar`. Warstwa suwaków budżetu automatu nietknięta.

ZMIANY/COMMIT: `gra/src/ui/buildModeHud.ts` (+42/−3, wyłącznie CSS/layout panelu),
`gra/tools/build-panel-ulepszenia-scroll-real-render-test.cjs` (nowy), dwa prywatne stuby
`gra/tools/.stubs/build-panel-scroll-*`. SHA: d0fd2301. Gałąź `autobot/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`.

TESTY:
- `build-panel-ulepszenia-scroll-real-render-test.cjs` — **przed** naprawą 19 pass / 6 fail,
  **po** 25/25; 28/28 punktów siatki a=b=c=1, `overlap` panel↔pasek = 0 wszędzie.
- Nietautologiczność, dwie chirurgiczne mutacje po JEDNEJ wartości:
  M1 `%`→`vh` (rezerwa bez zmian) → czerwienieją WYŁĄCZNIE C(b)/C(c) (powiększenie UI) + A2/A7;
  B(b)/B(c) (powiększenie przeglądarki) zostają zielone. M2 rezerwa 184→90 (jednostka bez zmian)
  → czerwienieją WYŁĄCZNIE asercja o nachodzeniu na pasek i klikalność WYKONAJ; wszystkie cztery
  asercje o osiągalności ostatniej pozycji zostają zielone. Asercje są rozłączne, nie jednym blokiem.
- Przy okazji naprawiona luka w samym teście: ekstraktor reguły CSS urywał się na `}` wstawki
  `${HUD_EDGE_PX}`, przez co asercja o `vh` była zielona zawsze (potwierdzone: po poprawce M1 ją czerwieni).
- `tsc --noEmit` 0 błędów; `vite build` (binarka z `node_modules`, `--outDir /tmp`, C-001) OK.
- Bramki referencyjne: logic 213/213, tech-tree 19/19, research ALL GREEN, unit-replace 13/13, combat 6/6.
- Defensywnie, ten sam plik: `build-mode-lock-tip-position` 21/21, `praca-budmode-slider-max` 13/13.
- Zrzut z żywej przeglądarki (BR 150% × 900): „Warzelnia soli / Tarasy / Fort" w całości nad
  przyciskami — `scratchpad/build-panel-po-naprawie.png` (dowód wizualny, nie do repo).

BLOKADY: brak. Uwaga poza zakresem, do rejestru orkiestratora (nie regresja — relacja
istniała przed zmianą): pasek podpowiedzi blokad `.et-hint` dolnego paska wystaje ponad stos
tury i nadal potrafi wejść pod panel budowy; jego wysokość jest dynamiczna, więc nie da się
jej objąć stałą rezerwą.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5 High — temat wizualny, §5a).
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi tematu, bez `main`, bez deployu).
