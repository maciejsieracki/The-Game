# 30 — Obrona Operatora (runda 2) — R-WEB-DATA-GARNCARNIA-THROUGHPUT-30-PLUS-20-PER-ERA-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane + mała zmiana kodu)
TEMAT: R-WEB-DATA-GARNCARNIA-THROUGHPUT-30-PLUS-20-PER-ERA-Q1
GOAL: Garncarnia 30 / 50 / 70 / 90 / 110 ceramiki na turę dla epok 1–5 właściciela (liniowo +20 na epokę), ta sama wartość dla gracza i AI.
ZMIANY-COMMIT: patrz sekcja „Commity" niżej (merge origin/main + poprawka testu + raport).
RUNDY: 2/5 (runda 1 = 10-operator-claude.md; ta runda = odpowiedź na zarzuty Evaluatora z d9feced38).
DEPLOY/PUSH: NIE WYKONANO (orkiestrator po Final Control).
NASTĘPNY KROK: Evaluator r2 na tym SHA, potem Final Control. Baza zmieniona: kod operatora jest teraz rodzicem nowego merge z origin/main (78af786ed).

Baza: kandydat 418558ff7 scalony z origin/main 78af786ed (merge commit w gałęzi `garncarnia-obrona-r2`, worktree wf_1116cee8-5c9-3). Konflikt tylko w `gra/data/building-cards-top5.json`, rozstrzygnięty (opis Garncarni z liczbami 30–110 od kandydata, liczby Spichlerza 10 / Królewski 20 od origin/main). Wszystkie bramki poniżej liczone na scalonym drzewie.

---

## Odpowiedzi na zarzuty Evaluatora (d9feced38)

Zarzut 1 (converterThroughputForEra zwraca bazę 30, nie 30/50/70/90/110) — ODRZUCAM (częściowo z dowodem).
- Funkcja `converterThroughputForEra(recipeId, baseThroughput, era)` (converters.ts:206) dostaje już rozwiązany `baseThroughput` i nie zna wierszy epoki. Dla Garncarni zwraca bazę, bo jej skalowanie zostało usunięte (`CONVERTER_ERA_SCALING_RECIPE_IDS` usunięte).
- Wszystkie ścieżki silnika czytają wiersz epoki PRZED wywołaniem tej funkcji: `converterThroughputEraParamKey` + `loadThroughput` (main.ts:3819–3821; converters.ts ~421 w `converterThroughputsForEra`; turn-economy przez `baseOf`).
- Wartości 30/50/70/90/110 są sprawdzane na ścieżce silnika: `garncarnia-throughput-30-plus-20-test.cjs` sekcja (a) używa `converterThroughputsForEra` z tym samym `baseOf` co turn-economy — 28/28 PASS. Era 7 (carry-forward) = 110 sprawdzone w `converter-era-scaling-test.cjs` C2.
- Dispatch podawał strukturę jako „np." (baza + parametr kroku). Parametr kroku wymagałby i tak zmiany sygnatury (funkcja nie ma dostępu do econ-params), a dwa źródła (wiersze + krok) naruszałyby „jedno źródło prawdy". Nie zmieniam.

Zarzut 2 (baza przestarzała, konflikt w building-cards-top5.json) — PRZYJMUJĘ.
- Scalone z origin/main (78af786ed). Konflikt rozstrzygnięty (JSON walidowany `json.load`, brak znaczników konfliktu). `econ-params.json` auto-scalony: Spichlerz I = 10, Spichlerz Królewski = 20 (wartości main).
- Wszystkie bramki uruchomione na scalonym drzewie (sekcja TESTY).

Zarzut 3 (tabela bilansu Operatora nieaktualna/myląca) — PRZYJMUJĘ.
- Tabela w 10-operator-claude.md jest nieaktualna. Poprawna tabela — zmierzona poniżej.
- Poprzedni wpis „Spichlerz I+II 25+25=50" był błędny: kod płaci JEDNĄ wypłatę na miasto, a przy I+II wysokość wypłaty to wartość Spichlerza Królewskiego (20), nie suma.
- Brak konsumpcji ceramiki przez obywateli w silniku (zmierzone: delta = produkcja − drenaż Spichlerza, przy 20 obywatelach dokładnie). Zapotrzebowanie „20 obywateli × 2,0" z dispatchu nie jest zaimplementowane w tym kodzie; zadanie #404 („Ceramika obywateli w epoce Kamienia") jest poza tym tematem.

Zarzut 4 (Chromium testuje izolowaną stronę, nie kartę miasta) — PRZYJMUJĘ ZAKRES (bez zmiany kodu).
- Test renderuje PRAWDZIWĄ funkcję `formatConverterProductionRowHtml` z cityPanel.ts (ta sama, którą karta miasta woła w cityPanel.ts:9775), z prawdziwym `converterProductionDisplayForBuilding` i econ-params.json. 13/13 PASS.
- NIE_ZMIERZONO: pełny zrzut karty miasta w działającej grze (nie uruchamiałem gry w tej rundzie).

Zarzut 5 (docs/Civpedia/wikiBundle nie zmienione; brak regeneracji) — ODRZUCAM (dowód z przeszukania).
- `grep` po `docs/encyklopedia`, `docs/PORADNIK-GRACZA`, `gra/src`, `gra/data`, `gra/tools` na frazy „+10% bazy", „50 cykli", „10% bazy", `CONVERTER_ERA_SCALING`: jedyne trafienia to `docs/archiwum-ux/*.html` (historyczne migawki, poza allowlistą, nietknięte) oraz stara sekcja w `econ-params.json` (już zaktualizowana w opisie).
- `gra/src/data/wikiBundle.json` nie zawiera żadnej liczby przepustowości Garncarni ani tekstu karty „Wytwarza ceramikę" (grep: brak trafień dla „Wytwarza ceramik"). Regeneracja nie zmieniłaby treści Garncarni. NIE_ZMIERZONO: czy regeneracja zmieniłaby coś innego (bundle ma datę 2026-09-05; nie uruchamiałem generatora, żeby nie wprowadzać niezwiązanych zmian).
- Źródło karty (`building-cards-top5.json`) zostało zaktualizowane.

Zarzut 6 (osłabione pokrycie testowe; sekcja (d) tautologiczna) — PRZYJMUJĘ (d), ODRZUCAM usunięcie C5.
- (d): PRZYJMUJĘ. Sekcja porównywała dwa identyczne wywołania z tymi samymi wejściami — to był test determinizmu, nie parytetu. Zmieniłem nazwę i komentarz (commit poprawki). Realny parytet gracz/AI (dwa różne ownery i dwie epoki w jednym `advanceCityEconomy`) pokrywa `converter-era-scaling-test.cjs` sekcja E: gracz era2 = 50 ceramiki, AI era3 = 70 — PASS.
- C5 (`garncarnia: baza=7, era3 → 8,4`): ODRZUCAM usunięcie. Ta asercja testowała wyłącznie retirowany mechanizm `CONVERTER_ERA_SCALING_PCT` (+10%/epokę), który decyzją ABC został usunięty dla Garncarni. Nie ma już formuły Garncarni, którą można by testować. Wartość 8,4 zostaje jako stała w teście `Math.floor` w `runConverter` (ta sama ścieżka zaokrąglania).

Zarzut 7 (niezweryfikowane punkty) — częściowo PRZYJMUJĘ z pomiarami:
- era > 5 (carry-forward 110): ZMIERZONO — `converter-era-scaling-test` C2 `era7 → 110` PASS.
- `citypanel-konwerter-produkcja-test` — 107 pass, 1 FAIL (N2). ZMIERZONO: test szuka literalu `convInactive = inactiveStatus?.inactive === true`, a w origin/main (i w bazie f1886bacf) jest `toggledOff || inactiveStatus?.inactive === true` (cityPanel.ts:9784 main; 9781 baza). To dług bazowy, nie skutek tego tematu (plik cityPanel.ts nie zmieniony przez kandydat). Asercje pozostałe 1–5 Garncarni (30/50/70/90/110) — PASS.
- `mennica-magazyn-test`: NIE_ZMIERZONO (nie uruchamiałem w tej rundzie).
- Wpis REPIN Rust: dług do zapisania przez orkiestratora w rejestrze: parametry `budynek_garncarnia_przepustowosc` oraz `budynek_garncarnia_epoka2..5_przepustowosc` (econ-params.json) muszą trafić do REPIN Rust (wiersze per era + wartość 30 jako baza).
- Ryzyko dublowania z #402: to ten sam temat (#402 w rejestrze zadań obejmuje Garncarnię 30/50/70/90/110); brak innego tematu o tej samej allowliście — NIE_ZMIERZONO w rejestrze orkiestratora.

---

## Tabela bilansu ceramiki (ZMIERZONO, nie z pamięci)

Pomiar: jedno miasto, 20 obywateli (`city.population = 20`), jedna tura `advanceCityEconomy` (poziom trudności normal, ziarno mapy 7331), ceramika startowa 1000 (NIE 100000 — przy zapasie powyżej capu epoki produkcja jest obcinana i pomiar byłby zafałszowany), glina/drewno 5000. Wartości = zmiana zapasu ceramiki po jednej turze (netto).

Epoki: 1 = Kamień, 2 = Brąz (wiersze `budynek_huta_braz_epoka2`/`budynek_garncarnia_epoka2`), 3 = Żelazo. (ZAŁOŻENIE — nazwy epok z komentarzy testu i dispatchu; nie sprawdzałem tabeli nazw epok w danych.)

| Epoka właściciela | Tylko Garncarnia (brutto = netto) | Garncarnia + Spichlerz I (drenaż 10) | Garncarnia + Spichlerz I + II (drenaż 20, jedna wypłata) |
|---|---|---|---|
| 1 — Kamień | +30 | +20 | +10 |
| 2 — Brąz | +50 | +40 | +30 |
| 3 — Żelazo | +70 | +60 | +50 |
| 4 | +90 | +80 | +70 |
| 5 | +110 | +100 | +90 |

Wnioski z pomiaru:
- Kamień (epoka 1), jedno miasto, 20 obywateli, z Spichlerzem I: netto +20 ceramiki na turę; z I+II: +10.
- Brąz (epoka 2), jedno miasto, 20 obywateli, z Spichlerzem I: +40; z I+II: +30.
- Obywatele w tym kodzie nie zużywają ceramiki (delta = produkcja − drenaż, dokładnie). Dlatego bilans jest dodatni we wszystkich epokach.
- Drenaż Spichlerza: 10 (I) i 20 (II, gdy miasto ma II; jedna wypłata na miasto) — zgodnie z `budynek_spichlerz_zuzywa_ceramika` = 10 i `budynek_spichlerz_ii_zuzywa_ceramika` = 20 w econ-params.json (scalone z origin/main).

---

## TESTY (surowe wyjście, scalone drzewo z origin/main 78af786ed)

Środowisko: `npm ci` w `gra/` (exit 0), Node v22, Chromium z `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Bez `npm run build`/`dev`.

Bramki referencyjne:
- `npx tsc --noEmit` — exit 0.
- `node tools/logic-test.cjs` — exit 0, „LOGIC OK (213/213)".
- `node tools/tech-tree-test.cjs` — „20 pass, 0 fail".
- `node tools/research-test.cjs` — „PASSED: 33 / FAILED: 0 / TOTAL: 33".
- `node tools/unit-replace-test.cjs` — „WSZYSTKIE TESTY ZIELONE (21/21)".
- `node tools/combat-test.cjs` — „COMBAT TEST: 6/6 pass".
- `node tools/unit-power-test.cjs` — „6 pass, 0 fail".

Testy tematu i pokrewne:
- `garncarnia-throughput-30-plus-20-test.cjs` — „28 passed, 0 failed" (po poprawce sekcji (d)).
- `garncarnia-throughput-chromium-render-test.cjs` — „13 passed, 0 failed".
- `converter-era-scaling-test.cjs` — „115 passed, 0 failed" (exit 0).
- `converters-test.cjs` — „49 passed, 0 failed".
- `brick-production-x2-test.cjs` — „69 passed, 0 failed".
- `brick-cycles-75-100-test.cjs` — „46 passed, 0 failed".
- `foundry-throughput-x2-era-mult-test.cjs` — „159 passed, 0 failed".
- `hud-konwerter-dopasowanie-test.cjs` — „20 passed, 0 failed".
- `resource-building-utilization-test.cjs` — „52 passed, 0 failed".
- `resource-amount-chip-icons-real-render-test.cjs` — „29 PASS, 0 FAIL".
- `citypanel-konwerter-produkcja-test.cjs` — „107 pass, 1 fail": N2 (dług bazowy, patrz zarzut 7). Asercje Garncarni 30/50/70/90/110 — PASS.
- `git diff --check` — czysto (exit 0).
- NIE_ZMIERZONO w tej rundzie: `mennica-magazyn-test`, pełny zestaw `tools/*` (poza powyższymi).

---

## Commity

- Merge: `origin/main` (78af786ed) do kandydata 418558ff7 — rozstrzygnięty konflikt w `gra/data/building-cards-top5.json`; poprawka testu (sekcja d) w `gra/tools/garncarnia-throughput-30-plus-20-test.cjs`. SHA: patrz pole `sha` w StructuredOutput (commit po zapisaniu tego pliku).
- Raport: ten plik, osobny commit (git add tylko tej ścieżki).

## BLOKADY
- Brak. Dług bazowy: `citypanel-konwerter-produkcja-test` N2 (czerwony na bazie i na origin/main).

## UWAGI-DLA-ORKIESTRATORA
- Rust REPIN: dodać `budynek_garncarnia_przepustowosc` (baza 30) i `budynek_garncarnia_epoka2..5_przepustowosc` (50/70/90/110) do rejestru REPIN.
- Zadanie #404 (ceramika obywateli w Kamieniu) jest poza tym tematem; pomiar pokazuje, że obecny silnik nie zużywa ceramiki przez obywateli.
- Nie tworzyłem żadnych sesji/zadań (zakaz właściciela).
