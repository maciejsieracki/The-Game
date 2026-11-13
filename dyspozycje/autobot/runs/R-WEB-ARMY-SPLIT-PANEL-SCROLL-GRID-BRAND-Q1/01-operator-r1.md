STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-SPLIT-PANEL-SCROLL-GRID-BRAND-Q1
GOAL: Panel „ROZDZIEL ARMIĘ": (1) klik jednostki nie cofa przewijania listy, (2) siatka 3 kolumny x 5 rzędów, (3) zgodność z brandbookiem, (4) test real-render RED przed / GREEN po; logika podziału bez zmian.

ZMIANY/COMMIT: SHA w sekcji końcowej (commit z jawnym `git add`, PUSH NIE).
- `gra/src/ui/armySplitPanel.ts` (przepisany render i CSS; interfejs `ArmySplitPanelOpts`/eksporty bez zmian, `main.ts` bez zmian).
- NOWY `gra/tools/army-split-panel-scroll-grid-test.cjs`.
- `dyspozycje/autobot/runs/R-WEB-ARMY-SPLIT-PANEL-SCROLL-GRID-BRAND-Q1/**` (raport, zrzuty, logi `gate-*.txt`).
Baza: `ae292911f`. Zero zmian w `gra-robocza/**`, `WERSJE.md`, `rust-port/**`.

PRZYCZYNA (1): stary `renderInner()` (armySplitPanel.ts, wersja przed zmianą, ok. l.100-160) przy każdym `change` robił `box.innerHTML = ...` — niszczył kontener listy, więc `scrollTop` wracał do 0. Zmierzone testem: PRZED scrollTop po kliku = 0 (przy wcześniejszym maksimum > 0).
NAPRAWA: DOM budowany RAZ; zaznaczenie/cel aktualizuje `sync()` (klasy `.on`, `checked`, `aria-pressed`, licznik, `aria-disabled` przycisku). Nie ma re-renderu, więc nie ma co przywracać.

UKŁAD (2): `.civ-asp-units` = `grid`, 3 kolumny, `grid-auto-rows:46px`, `max-height` = 5 rzędów + odstępy, `overflow-y:auto`. Responsywnie (założenie z dispatchu): 3 kol. >= 560 px, 2 kol. <= 559 px, 1 kol. <= 359 px (`@media`, viewport). Kafel: pole wyboru (własny znacznik SVG), ikona jednostki (`u.icon`/`unitIconSvg`), nazwa z ellipsis + `title`. HP/siła: NIE dodane (`ArmyMergeUnitRow` nie ma tych pól; poza allowlistą). „Zaznacz wszystko" nie dodane. Dodany pasek statusu „Zaznaczono N z M · zostaje na heksie: K" (`role=status`), ostrzeżenie w `--tg-orange` gdy zaznaczenie niepoprawne; stały hint o min. 1 jednostce zachowany.

BRANDBOOK (3) — źródło kanonu: `gra/src/ui/icons/brand/tokens.css` (`--tg-*`, FROZEN v1.0); wzorce: `armyMergePanel.ts`, `cityForeignPick.ts`. Tokeny użyte z fallbackami równymi kanonowi (jak `bottomBarHud.ts:69`).
| element | obecnie | wg brandbooku / zmiana |
|---|---|---|
| ramka panelu | 1px, promień 14px | `--tg-border-gold` 2px, `--tg-radius-panel` 12px |
| tło | gradient niebieski rgba(14,20,36) | `--tg-panel-grad` |
| kolory | #e8d88a/#7a8498/#e8ebf0 na sztywno | `--tg-gold-primary`, `--tg-text-muted`, `--tg-text-primary` |
| akcent zaznaczenia | błękit #6bc4e8 | złoto `--tg-gold-primary` (kafel, cel) |
| przycisk główny | niebieski gradient | `--tg-btn-primary` + `--tg-btn-primary-ink`, kapitaliki, tracking .14em |
| przycisk pomocniczy | szary półprzezroczysty | styl `.tg-btn-default` (ciemny gradient, rant złoty 2px) |
| nagłówek | brak ornamentu | ornament złoty jak `armyMergePanel` (.civ-amp-orn), Georgia kapitaliki (`--tg-font-title`) |
| fokus | brak | `outline:2px solid --tg-focus-ring` (kafle, cele, przyciski) |
| pole wyboru | natywne `accent-color` niebieski | własne pole + znacznik SVG (złote) |
| dostępność | brak ról | `role=dialog/aria-modal/aria-label`, `role=group`, `aria-label` kafli, `aria-pressed` celów, `aria-disabled` Rozdziel, roving tabindex, strzałki/Home/End, spacja |
| animacje | brak | przejścia tylko w `prefers-reduced-motion:no-preference` |
Ikony: jednostki z biblioteki (`unitIconSvg`/`mergeUnitRow`), znacznik wyboru = inline SVG (brak znaków unicode). Kontrast: NIE_ZMIERZONO numerycznie (tokeny kanonu).

TESTY (logi w `dowody/`):
- `gate-split-grid.txt`: 18 PASS / 0 FAIL, EXIT=0 (>= 45 jednostek, Chromium `/opt/pw-browsers/chromium`; PO: scrollTop bez zmian po zaznaczeniu i odznaczeniu, 3 kol. x 5 rzędów = 15 kafli widocznych i dalej przewijanie, 2 kol. @500/360, 1 kol. @340, brak overflow-x @360, strzałki ±1/±3, Home/End, spacja, roving tabindex; logika: domyślnie ostatnia jednostka, 0/wszystkie -> brak `onSplit`, 3 jednostki + cel -> `onSplit`, Anuluj -> `onCancel`).
- RED-PRE (ten sam test na `ae292911f`): scrollTop wraca do 0 po kliku, brak siatki 3x5 — potwierdzone; parytet logiki PRZED = PO (identyczny JSON wyników).
- `gate-tsc.txt`: `tsc --noEmit` EXIT=0 (pierwszy przebieg wykrył TS2488 na NodeList, poprawione `Array.from`).
- Regresje PO: `army-split-movement` EXIT=0, `army-split-ruch-icons` EXIT=0, `army-merge-split-direction-icons` EXIT=0, `split-output` EXIT=0, `army-merge-panel-production-mount` 9/0 EXIT=0, `army-merge-panel-scroll-real-render` 34/0 EXIT=0 (`gate-r1..r6.txt`; r3/r4 po ustawieniu `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`, pierwszy przebieg = INFRA brak `/usr/bin/chromium`). Wzorzec `*unit-split*`/`*armySplit*`: brak plików. PRZED nie uruchamiano osobno dla regresji: `git grep` potwierdza, że żaden test poza nowym nie importuje `armySplitPanel`/`civ-asp` (wynik PRZED = PO z konstrukcji; przyznaję NIE_ZMIERZONO).
- Zrzuty: `dowody/PRZED-1280.png`, `PO-1280.png`, `PRZED-360.png`, `PO-360.png` (każdy < 100 KB).

BLOKADY: brak. Uwagi: (a) na 360 px nazwy skracane ellipsis (2 kol.); (b) Escape nie testowany w izolacji (obsługa w `escapeOverlayStack`, niezmieniona); (c) test domyślnie porównuje z `origin/main`, nadpisywalne `ARMY_SPLIT_PRE_REF`; (d) test regresji merge zapisuje PNG w `runs/R-ARMY-MERGE-...` — przywrócone `git checkout`; (e) `gra/node_modules` usunięte.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (te same ID) — niezależne uruchomienie `army-split-panel-scroll-grid-test.cjs`, przegląd zrzutów w 1280/360, weryfikacja tabeli brandbooku.
DEPLOY/PUSH: NIE WYKONANO
