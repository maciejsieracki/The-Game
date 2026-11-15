STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko UI; bez logiki gry)
TEMAT: R-WEB-UI-RESOURCE-CARD-NUMBERS-ONLY-DETAILS-COLLAPSED-Q1
GOAL: Karta surowca i nagłówek Surowce pokazują same liczby brutto/netto (bez opisu i „/ turę”); „Zobacz szczegóły zużycia” i „Skąd zapasy” zawsze zwinięte (także po przerysowaniu panelu).
ZMIANY/COMMIT: kod c094e0db2 (baza 7ac79dafb); raport w tym commicie.
  - gra/src/ui/empireDetailPanel.ts: resGrossNetLineHtml → „<b>+X</b> · <b>+Y</b>” + title z wyjaśnieniem; nowa grossNetNumbersSub (nagłówek Surowce: „+1222 → +1075”, opis w title); resSkadZapasyHtml zawsze open=false; usunięte captureSkadDetailsOpen/restoreSkadDetailsOpen i ich wywołanie w render(). grossNetSub (Nauka, Żywność, Handel) bez zmian.
  - gra/tools/resource-cards-gross-net-test.cjs, resource-cards-plusx-badge-test.cjs (asercje tekstu: stary „Brutto … netto … / turę” → „+X · +Y”), resource-ledger-skad-dom-test.cjs (D1/D2 odwrócone na „zwinięte”; D6 = przerysowanie z rozwiniętymi blokami wraca zwinięte; D7 = brak capture/restore).
  - NOWY gra/tools/resource-card-numbers-only-test.cjs (14 asercji, 2 mutanty).
  - dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-CARD-NUMBERS-ONLY-DETAILS-COLLAPSED-Q1/dowody/karta-surowca-sol-360px.png (zrzut z headless Chromium).
TESTY:
  - tsc --noEmit (gra): exit 0.
  - git diff --check: czysto.
  - resource-cards-gross-net-test: 0 FAIL (po korekcie asercji tekstowych; B2c poprawiony na regex z „Brutto/Netto”).
  - resource-cards-plusx-badge-test: 31 pass, 0 fail.
  - resource-ledger-skad-dom-test: 13 passed, 0 failed (w tym D6 przerysowanie → sol=0;ceramika=0).
  - resource-card-numbers-only-test (nowy): 14 pass, 0 fail (M1 i M2 wykrywane).
  - praca-na-pieniadz-test: exit 0. trade-routes-income-test: exit 0. resource-ledger-skad-ui-test: exit 0.
  - 5 bramek referencyjnych: logic-test, tech-tree-test, research-test, unit-replace-test, combat-test — exit 0 każda.
  - resource-usage-breakdown-test: exit 1 przed zmianą NIE sprawdzano; błąd to esbuild „No loader is configured for .svg” w src/ui/icons/brandAssets.ts i scienceOwlIcon.ts (pliki nietknięte tym tematem) — NIE ZMIERZONO na bazie 7ac79dafb, zgłaszam jako dług do osobnego tematu.
  - Zrzut: karta „Sól” z headless Chromium (renderuje prawdziwe resCardHtml; fixture z testu skad-dom) — OBEJRZANY: widoczne „+5 · +3”, oba wiersze „▸ Zobacz szczegóły zużycia” i „▸ Skąd zapasy (ostatnie 1 tur)” zwinięte.
  - NIE ZMIERZONO: zrzut z ŻYWEJ gry (vite build/dev, panel Surowce z drewnem/glinou) — nie wykonano build vite; nagłówek Surowce zweryfikowany jednostkowo (N3), nie wizualnie.
BLOKADY: brak blokad kodu.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (SONNET) — przegląd diffu c094e0db2; opcjonalnie żywy zrzut panelu Surowce (vite poza repo) jako dowód (d) pełny.
UWAGI-DLA-ORKIESTRATORA:
  - Wiki (gra/src/data/wikiBundle.json, sekcja „53.1a. Karta surowca: brutto i netto na turę”) nadal opisuje stary wygląd („brutto i netto na turę”) — NIE edytowano (wiki-sync osobnym tematem).
  - Pozostałe użycia grossNetSub (wspólna, z opisem „Brutto … → netto … / turę”): Nauka (~l.1721), Żywność (~l.3266), Handel (~l.3801) — zostawione zgodnie z dispatchem; kandydaci do ujednolicenia.
  - Teksty pomocy „Zobacz szczegóły zużycia” (l.~2035, ~2899, ~3442) — nadal poprawne (nazwa summary bez zmian).
  - Dług testowy: resource-usage-breakdown-test.cjs nie buduje się (loader SVG w esbuild) — niezwiązane z tym tematem.
DEPLOY/PUSH: NIE WYKONANO
