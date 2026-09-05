# R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B — Evaluator, runda 1/5

STATUS: ZARZUTY — lista niepusta (4). Werdyktu PASS/FAIL nie wydaję (§3c); idzie do Obrony Operatora.
DOMAIN: GAME
TEMAT: R-AUTOWYZYWIENIE-STAN-PRZYCISKU-Q1-B
MODEL+EFFORT: Opus 5, effort high
GOAL: zgodny z `00-dispatch.md` co do zdania (§16a pkt 9) — stan przełącznika wyżywienia czytelny bez klikania, aktywny świeci, nieaktywny wygaszony, we wszystkich miejscach.
ZMIANY-COMMIT: `4b0aeec5` zweryfikowany co do pliku: `gra/src/ui/cityPanel.ts`, `gra/tools/autowyzywienie-stan-przycisku-test.cjs` (nowy), `01-operator.md` + 6 zrzutów. `empire-food.ts`, `main.ts`, `WERSJE.md`, `playbook.json` nietknięte. Diff wyłącznie `classList`/`dataset`/CSS — **logika przełączania niezmieniona** (pkt iii sprawdzony na diffie: `onCityAutoWyzywienieChange(city.id, !city.autoWyzywienie)` i `onToggle()` bez zmian). Bez sekretów, bez usunięć.

TESTY (uruchomione przeze mnie, nie streszczone z raportu):
- nowa bramka 57/57; tsc 0 błędów; logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6.
- panel miasta: 29/29, 83/83, 35/35, 12/12, spichlerz-cap-wiring 12/12, praca-real-render 37/37, praca-kontrakt 637/637.
- panel imperium: autofeed-btn-label 25/25, miasta-table 96/96, panel-split 25/25, city-defaults 53/53, drobiazgi-r2 33/33.
- trzy czerwone (econ-slider-visibility 57/3, sliders-always-visible 6/2 SUPERSEDED, empire-food-b5 25/3) — **pre-istniejące potwierdzone niezależnie**: cityPanel.ts cofnięty do `bec25312`, przebiegi sekwencyjne, liczby identyczne.
- **Własne zrzuty z żywego Chromium** (nie cudze): różnica czytelna bez kodu — WYŁ `rgb(138,128,112)` bez poświaty vs zwykły `.hbtn` `rgb(232,224,200)`; przed poprawką WYŁ był z nim tożsamy.
- **Pkt (ii) — własne mutacje.** M1: obie połówki dostają `active` przy nietkniętych kotwicach bloku (A) → bramka łapie, 14 FAIL (blok (D) XOR). M2: reguła `.hbtn.off` obecna, ale wizualnie pusta → 7 FAIL (blok (E) SEDNO). Bramka mierzy RÓŻNICĘ, nie obecność klasy.
- Na pełnym cofnięciu poprawki bramka jest czerwona (exit 1, 5 FAIL w (A)), ale kończy się stack trace'em z kotwicy (F) zamiast pełnym bilansem — nota, nie zarzut.

ZARZUTY:
1. **Kryterium 4 dispatchu (cztery zrzuty) niespełnione w części Spichlerza.** `zrzuty/przed-spichlerz.png` i `po-spichlerz.png` mają identyczny md5 `c58af2b0…` — to jeden stan, nie dwa. Powód jest realny (`empireDetailPanel.ts:172-187` to jednorazowa akcja; `EmpireFoodCityUiRow`, `empireDetailTypes.ts:531-539`, nie niesie `autoWyzywienie`, a producent snapshotu siedzi w zakazanym `main.ts`). Znaczenie: kryterium binarne zostaje otwarte, a runda naprawcza Operatora go nie domknie — potrzebna decyzja orkiestratora/właściciela (N1).
2. **Dowód pokrywa 1 z 3 zmienionych kontrolek.** Bramka asertuje wyłącznie `SEL_AUTO`/`SEL_IND` (`gra/tools/autowyzywienie-stan-przycisku-test.cjs:216-217`, grupa Żywność). Pozostałe wywołania współdzielonego komponentu — `cityPanel.ts:4515` (`indywidualne-row-handlu`) i `cityPanel.ts:4979` (`indywidualne-row-praca`) — nie mają ani asercji, ani zrzutu. `praca-jeden-podzial-real-render-test.cjs` ich NIE pokrywa: nie wpina `onPodzialPracyOverrideToggle`, więc przycisk się tam nie renderuje i 37/37 nic o nim nie mówi. Znaczenie: kryteria 2-4 mówią „dla każdego miejsca", a własna inwentaryzacja Operatora wymienia 4. Sprawdziłem obie sam w żywym Chromium — wychodzą poprawnie (WYŁ `rgb(138,128,112)`, WŁ świeci), więc to brak dowodu, nie defekt wyglądu. Poprawka: dwa selektory do bloków (C)/(D).
3. **Ten sam defekt został nienaprawiony i niezgłoszony w tym samym panelu.** `cs-manager` „Zarządca automatyczny" (`cityPanel.ts:9871`, stan w `cityPanel.ts:11495-11500`, źródło `main.ts:6598 autoManageCities`) to trwały przełącznik WŁ/WYŁ: WŁ dostaje `.active`, WYŁ wraca do gołego `.hbtn`. Naprawa tutaj byłaby poszerzeniem zakresu (C-025), ale §14 wymaga wpisu do rejestru — Operator nie zgłosił go ani notą, ani tematem. Znaczenie: właściciel skarżył się na konwencję; po tej naprawie zobaczy w NAGŁÓWKU tego samego panelu przycisk z dokładnie tą wadą.
4. **Raport przekracza limit.** `01-operator.md` — 604 słowa wobec „ok. 400" z §11 i z dispatchu (+50%). Wraca do skrócenia.

BLOKADY: N1 (zarzut 1) wymaga decyzji poza allowlistą tematu. N2 Operatora (Auto i Indywidualne to dwa niezależne przełączniki, nie para wykluczająca się) — potwierdzam, należy do węzła A.

RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora do zarzutów 1-4, potem Final Control (Sonnet 5, effort high).
DEPLOY/PUSH: NIE WYKONANO
