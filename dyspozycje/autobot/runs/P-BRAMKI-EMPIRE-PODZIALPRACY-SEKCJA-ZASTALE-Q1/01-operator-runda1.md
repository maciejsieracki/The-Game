# P-BRAMKI-EMPIRE-PODZIALPRACY-SEKCJA-ZASTALE-Q1 — Operator runda 1/5

## Ustalenie stanu kodu (GOAL pkt 1)

`renderDefaultPodzialPracySection()` faktycznie nie istnieje w `gra/src` (potwierdzone grepem
całego `src/ui/*.ts` — jedyny ślad to nazwa w komentarzu `empirePanelSectionMap.ts:102`).
Mechanizm suwaka „Domyślny podział pracy" **działa poprawnie**, ale pod inną nazwą i w innym
kształcie niż zakładały bramki:

- Dziś: `renderEmpirePracaBudgetSplitSection()` w `empireDetailPanel.ts`, wywołane raz wewnątrz
  `renderPracaSection()` (linia ~1311), renderowane bezwarunkowo w treści tej funkcji.
- Widoczność nie jest już bramkowana przez `if (sliderVis.showLaborSplit)` wewnątrz sekcji
  „ZASOBY IMPERIUM" — R-DESIGN-11-ZAKLADEK faza 2 (Maciej, zatwierdzony refaktor, liczne komentarze
  w kodzie z datami 2026-08-1x) przeniosła Pracę (analogicznie do Skarbca w fazie 1) do WŁASNEGO
  bloku top-level. O widoczności decyduje dziś wyłącznie routing `body`:
  `if (block === 'praca') body += praca;` (empireDetailPanel.ts ~3956).
- `sliderVis.showLaborSplit` (empirePanelSectionMap.ts) nadal istnieje i jest liczone, ale **nic
  go dziś nie konsumuje** do bramkowania tego suwaka — pole osierocone przez refaktor. Nie jest to
  realna regresja: dublowanie między zakładkami (pierwotny zgłoszony błąd 469f3152) jest dziś
  strukturalnie niemożliwe (jedna zmienna `block`, wykluczające się gałęzie), więc gwarancja
  „nigdy oba suwaki na filtrowanej zakładce" jest silniejsza niż przedtem, nie słabsza. Klasyfikacja:
  test podążający za już wdrożoną i zatwierdzoną zmianą architektury (`PROCEDURA-NUMER-ABC-COMMIT-
  DEPLOY.md` §3b) — bez ABC-first, zero zmiany balansu/mechaniki.

## Zmiany (GOAL pkt 2)

Przekotwiczono obie bramki na aktualny kod, zachowując semantykę każdej asercji (dokładnie jedno
wystąpienie, warunkowe dołączenie, dowód mutacyjny):

- `gra/tools/empire-panel-econ-slider-visibility-test.cjs` — Wymóg 4 (część Pracy) przepisany:
  sprawdza `renderEmpirePracaBudgetSplitSection()` (1x w pliku, nieobecne w sekcji ZASOBY
  IMPERIUM) oraz guard `if (block === 'praca') body += praca;`. MUT3 rozdzielony na MUT3a (podatek,
  guard niezmieniony) i MUT3b (Praca, mutuje guard bloku na bezwarunkowy) — oba realnie czerwienią
  bramkę i są przywracane po teście. 57→**65/65** (3 naprawione + 5 nowych z rozbicia MUT3, zero
  osłabionych).
- `gra/tools/empire-panel-sliders-always-visible-test.cjs` — 2 asercje Pracy przekotwiczone
  analogicznie (obecność w całym pliku, guard blokowy zamiast `sliderVis.showLaborSplit`),
  kontrola przytomności zaktualizowana. 6→**8/8**.

Zero zmian w `gra/src/**` (potwierdzone `git status`/`git diff --stat` — brak wpisów poza dwoma
plikami `.cjs`). `git diff --check` czyste.

## Status SUPERSEDED drugiej bramki (GOAL pkt 3)

Nagłówek `empire-panel-sliders-always-visible-test.cjs` dosłownie deklaruje SUPERSEDED przez
469f3152/`empire-panel-econ-slider-visibility-test.cjs` już od 2026-08-12, zredukowany do „cienkiej,
uzupełniającej warstwy" chroniącej wyłącznie regres b80426ff (suwak nigdy globalnie martwy) + filtr
`onlyEconId` (C-PANEL=B). Po dzisiejszym przekotwiczeniu plik **pokrywa się niemal 1:1** z Wymogiem 4
tamtej bramki, oferując słabszy dowód (bez mutacji na żywym subprocess). Jedyny unikalny wkład to
Wymóg 1 (filtr `onlyEconId`). **DECISION_REQUIRED (nie wykonano samodzielnie)**: rozważyć usunięcie
tego pliku i przeniesienie Wymogu 1 do głównej bramki — dopisano notę w nagłówku, bramka zielona
niezależnie od finalnej decyzji.

## Testy

- `node tools/empire-panel-econ-slider-visibility-test.cjs` → 65 pass / 0 fail (x3 powtórzenia,
  stabilne).
- `node tools/empire-panel-sliders-always-visible-test.cjs` → 8 pass / 0 fail.
- `npx tsc --noEmit` (z `gra/`) → czyste, exit 0.
- 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19, `research-test.cjs`
  33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 — wszystkie zielone.

## DECISION_REQUIRED

Jedna pozycja: los `empire-panel-sliders-always-visible-test.cjs` (usunąć jako duplikat czy
zostawić jako cienką warstwę) — patrz sekcja wyżej. Nie blokuje zamknięcia rundy — bramka jest
zielona niezależnie od decyzji.
