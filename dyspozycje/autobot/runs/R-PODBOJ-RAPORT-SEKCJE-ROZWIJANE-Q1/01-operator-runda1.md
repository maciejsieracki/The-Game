STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-PODBOJ-RAPORT-SEKCJE-ROZWIJANE-Q1
GOAL: (A) zdiagnozować brak "Drewna" w bilansie zdobycia; (B) przeprojektować panel
raportu zdobycia/eliminacji na sekcje: główne pozycje zawsze widoczne, surowce w
rozwijanej sekcji, zero utraconych pozycji.

WERDYKT-CZĘŚĆ-A: NIE POTWIERDZONO BUGA — zachowanie zgodne z projektem.
Dowód: `EMPIRE_STOCK_RESOURCE_KEYS` zaczyna się od `'drewno'` (building-stock-cost.ts:96),
`buildCityCaptureReportRows` iteruje WSZYSTKIE klucze identycznie (main.ts:1444-1453) i
pomija WYŁĄCZNIE wartość ≤0 (zasada 1, świadomy design z R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1)
— test `miasto-zdobycie-raport-test.cjs` 13a/13c dowodzi, że przy `{drewno:42, kamien:0}`
drewno JEST, a kamień (zero) jest pominięty — mechanizm nie ma stronniczości wobec
konkretnego klucza. Kontekst ekonomiczny, dlaczego drewno akurat mogło być 0 podczas gdy
kamień/glina >0: `data/citizen-resource-upkeep.json` — drewno i glina są surowcem
WYMAGANYM od epoki 1 (drenowane co turę z magazynu civ-wide przez
`computeCitizenResourceDrain`, `drained=min(required,stock)`), kamień dopiero od epoki 2;
gdy produkcja drewna miasta-państwa nie nadążała za zużyciem obywateli, magazyn realnie
schodzi do 0, podczas gdy nadwyżkowa produkcja gliny/kamienia akumuluje się. To w pełni
tłumaczy zrzut właściciela (Kamień +50, Glina +130, brak Drewna) bez defektu kodu. NIE
naprawiono nic w części A (brak regresu do naprawienia) — priorytet zgłoszenia zamknięty
poprzednim tematem R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1 (0283fa60, już w bazie
`ebb24d78`), który dodał sam mechanizm wiersza surowców.

ZMIANY-COMMIT:
- `gra/src/ui/cityCaptureNotice.ts`: nowe pole `CaptureReportRow.collapsible?: boolean`
  (rozszerzenie, nie łamie kontraktu — domyślnie falsy = sekcja główna, wsteczna
  zgodność). `reportRowsHtml` dzieli wiersze na główne (zawsze widoczne) i `collapsible`
  (natywny `<details>/<summary>` "Pokaż wszystkie surowce (N)", domyślnie ZWINIĘTY, zero
  JS na toggle). Nowy helper `rowHtml()`.
- `gra/src/main.ts`: `pushSurowiec()` w `buildCityCaptureReportRows` oznacza wiersze
  surowców jako `collapsible: true`. Ludność/Budynki/Złoto ze skarbca/Punkty
  nauki/Technologie/Moc/Pula pracy/Łup zostają główne (mały, stały zestaw — decyzja:
  tylko rosnąca lista surowców trafia do rozwijanej sekcji, zgodnie z uzasadnieniem
  dispatchu).
- `gra/tools/miasto-zdobycie-raport-test.cjs`: wycięcie BLOKU rozszerzone o nowy helper
  `rowHtml`; nowe asercje 13j/13k (`collapsible` na surowcach, brak na Ludności) i cała
  sekcja 14 (10 asercji) — <details> zwinięty domyślnie, licznik w nagłówku, kolejność
  główne→rozwijane, zero utraty pozycji w obu trybach, wsteczna zgodność bez flagi.
  Kontrakt NIE cofnięty — rozszerzony.
Commit: patrz SHA w `git log` po tym zapisie (allowlista, bez `git add -A`).

TESTY:
- `node tools/miasto-zdobycie-raport-test.cjs`: 117 passed, 0 failed (było 100, +17 nowych).
- `node ./node_modules/typescript/bin/tsc --noEmit`: 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.

DOWÓD-CHROMIUM-PRZED-PO: `dyspozycje/autobot/runs/R-PODBOJ-RAPORT-SEKCJE-ROZWIJANE-Q1/dowod-chromium/`
(Playwright + Chromium realny, harness esbuild bundlujący faktyczny plik UI ze stubem
WYŁĄCZNIE `brandIconSvg`, scenariusz z dispatchu — eliminacja Trojzeny, Ludność+1/Nauka
+22/Pula pracy+38/Kamień+50/Glina+130/Żelazo+9/Łup:brak):
- `before-flat.png` — DZISIEJSZY wygląd (plik z HEAD `ebb24d78`): 7 wierszy płasko, panel
  rośnie z każdym nowym surowcem.
- `after-collapsed.png` — PO zmianie, domyślnie: główne pozycje (Ludność/Nauka/Pula
  pracy/Łup) widoczne, "Pokaż wszystkie surowce (3)" zwinięte, panel krótszy.
- `after-expanded.png` — po jednym kliknięciu: Kamień/Glina/Żelazo widoczne, nic nie
  zniknęło.

BLOKADY: brak. Uwaga proceduralna: worktree nie miał `node_modules` (świeży checkout) —
wykonano `npm install` (dozwolone, nie jest to `npm run build/dev`) z zachowaniem C-001.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
