# 50 — Final Control — R-WEB-DATA-GARNCARNIA-THROUGHPUT-30-PLUS-20-PER-ERA-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane + mała zmiana kodu)
TEMAT: R-WEB-DATA-GARNCARNIA-THROUGHPUT-30-PLUS-20-PER-ERA-Q1
GOAL: Garncarnia 30 / 50 / 70 / 90 / 110 ceramiki na turę dla epok właściciela 1-5, ta sama wartość dla gracza i AI.
ZMIANY/COMMIT: kandydat 387a14d3a48519d8c56ac95923098ee62abe8cb1 do integracji (potomek bazy f1886bacf i origin/main 78af786ed; `git merge-base --is-ancestor` potwierdzone dla obu). Ten raport: osobny commit tylko tego pliku. Diff vs origin/main: 17 plików, w allowliście (econ-params, converters.ts, testy converter/garncarnia, building-cards-top5.json uzasadnione konfliktem z FALA 723, runs/**, rejestr). `git diff --check origin/main HEAD` czysto.
RUNDY: 3/5 (FC po Obronie r2).
DEPLOY/PUSH: NIE WYKONANO

## Pomiar wykonany samodzielnie (ZMIERZONO, advanceCityEconomy, 1 miasto, population=20, ceramika start 1000, 1 tura)

Wynik identyczny dla easy / normal / hard:

| Epoka właściciela | Garncarnia | + Spichlerz I (10) | + Spichlerz I + II (20, jedna wypłata) |
|---|---|---|---|
| 1 Kamień | +30 | +20 | +10 |
| 2 Brąz | +50 | +40 | +30 |

Obywatele (20) w tym kodzie NIE zużywają ceramiki; delta = produkcja - drenaż Spichlerza. Tabela Operatora z "25+25=50" była błędna (Obrona poprawiła).

## TESTY (surowe wyjście, drzewo kandydata, npm ci w gra/)
- `npx tsc --noEmit`: exit 0
- garncarnia-throughput-30-plus-20: 28 passed, 0 failed
- garncarnia-throughput-chromium-render (Chromium, realna funkcja formatConverterProductionRowHtml): 13 passed, 0 failed
- converter-era-scaling: 115/0; converters: 49/0; brick-production-x2: 69/0; brick-cycles-75-100: 46/0; foundry-throughput-x2-era-mult: 159/0; hud-konwerter-dopasowanie: 20/0; resource-building-utilization: 52/0
- logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0
- citypanel-konwerter-produkcja: 107 pass, 1 fail (N2: test szuka literalu w cityPanel.ts; cityPanel.ts nie jest w diffie kandydata, wiec to dlug bazowy, nie regresja tematu)

## Werdykt per zarzut
1. Brak funkcji z krokiem +20: ODDAL. Wartości per era z wierszy econ-params (jedno źródło prawdy), przetestowane na ścieżce silnika; wynik w grze zgodny z GOAL.
2. Przestarzała baza: ODDAL (naprawione merge'em 1bc545694; kandydat jest potomkiem origin/main 78af786ed, testy na scalonym drzewie zielone).
3. Tabela bilansu: ODDAL (poprawiona i potwierdzona moim pomiarem powyżej).
4. Chromium: ODDAL w zakresie (test realnej funkcji karty, uruchomiony przeze mnie 13/13); pełny zrzut karty w działającej grze NIE_ZMIERZONO.
5. Docs/wikiBundle: ODDAL (brak przestarzałych liczb Garncarni w docs/wikiBundle wg grep Obrony).
6. Pokrycie testów: ODDAL (sekcja (d) poprawiona na determinizm; parytet pokrywa converter-era-scaling sekcja E, uruchomiona 115/0).
7. Niezweryfikowane: ODDAL; N2 dług bazowy; REPIN Rust do rejestru.
Zero zarzutów NAPRAW.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch zakładał zużycie ceramiki przez obywateli (20 x 2,0); kod tego nie ma (to temat #404). Bilans właściciela "+10 w Żelazie" nie zachodzi do czasu #404: obecnie netto = produkcja - drenaż Spichlerza.
- REPIN Rust: budynek_garncarnia_przepustowosc (30) oraz budynek_garncarnia_epoka2..5_przepustowosc (50/70/90/110).
- Dług bazowy: citypanel-konwerter-produkcja N2; mennica-magazyn-test NIE_ZMIERZONO.
- Nie tworzyłem żadnych sesji/zadań.

NASTĘPNY KROK: integracja orkiestratora (FF/merge 387a14d3a + ten raport), deploy ROBOCZA po osobnej autoryzacji.
