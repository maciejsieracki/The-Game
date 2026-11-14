# 30-obrona-claude — R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1 (obrona, runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane + dokumentacja + test)
TEMAT: R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1
GOAL: Ceramika zużywana przez obywateli już w epoce Kamień (1 na obywatela na turę), z karą −2 Szczęścia / −1% Rozwoju za brakujący surowiec do czasu Garncarni.
BAZA: 3c428164d7795a35123d53dcc32dc0f9f87857b8 (kandydat evaluatora), gałąź robocza `obrona/R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1`.

## Odpowiedzi na zarzuty Evaluatora (92b05cd2)

1. **_opis w citizen-resource-upkeep.json — PRZYJMUJĘ.** Dopisano na początku `_opis` wpis R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1 (Kamień = drewno + glina + ceramika, stawka 1,0). Commit d5a908f5f. Dowód: `json.load` przechodzi.

2. **Civpedia / poradnik — PRZYJMUJĘ z doprecyzowaniem.** Grep po docs/encyklopedia i docs/PORADNIK-GRACZA (frazy: „drewno i glina", „zużywa", „na obywatela", „obywatel" + surowce) nie znalazł ŻADNEGO hasła o zużyciu surowców przez obywateli. Wskazuję miejsca, w których kara za brak surowca już jest opisana (Szczęście), i uzupełniam je:
   - `docs/PORADNIK-GRACZA/06-miasto-spoleczenstwo.md` §35.2 (wiersz „Surowce utrzymania obywateli" +2 za każdy surowiec) i §35.3 (wiersz „Brak surowca utrzymania obywateli" −2 za każdy, z ceramiką w epoce Kamień, dodatkowo −1% Rozwoju).
   - `docs/encyklopedia/pojecia/szczescie.md` Wiki-M: wiersze w tabeli plusów (+2) i minusów (−2).
   Nowego hasła encyklopedii nie tworzę (poza zakresem tego tematu). Commit d5a908f5f.

3. **wikiBundle.json — PRZYJMUJĘ.** Regeneracja narzędziem: `node gra/tools/bundle-wiki-for-game.cjs` → „wikiBundle.json: 22 rozdz. + 181 haseł (~1273 KB)". W diffie jedna linia zmieniona. Commit d5a908f5f.

4. **Komentarze JSDoc w citizen-resource-upkeep.ts — PRZYJMUJĘ częściowo.** Dopisano listę surowców per epoka do nagłówka modułu (linie 9–11: Kamień = drewno + glina + ceramika, Brąz = + kamień, Żelazo = + cegła). Linie ze stawkami (81, 83, 153, 279: „Kamień 1,0 / Brąz 1,5 / Żelazo 2,0") ODRZUCAM jako błędne do zmiany: opisują stawkę per epoka, która się NIE zmieniła i jest poprawna (m(e) = 1 + 0,5·(e−1)); nie zawierają listy surowców, więc nie ma w nich nieaktualnej listy Kamienia.

5. **Pomiar wpływu w grze (d) — PRZYJMUJĘ, wykonany.** Narzędzie: istniejący tryb `sim` w `gra/tools/citizen-consumption-era-live-measure.cjs` (headless Chromium, realny endTurn, build vite do scratch). Rozszerzony o zapis ceramiki per tura (gracz: `upkeep['0'].missing` i stock; AI: liczba właścicieli z ceramiką w `missing`). Trzy ziarna × 60 tur, gracz PASYWNY (bez budowy Garncarni), 14 AI. Surowe wyniki (pliki w `dyspozycje/autobot/runs/R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1/evidence/`):

   | Ziarno | Gracz: tury z brakiem ceramiki | Gracz: pierwsza tura z ceramiką | AI: pierwsza tura z ceramiką | AI: połowa (7/14) ma ceramikę od tury | AI: udział właściciel×tur z brakiem ceramiki |
   |---|---|---|---|---|---|
   | 1 | 60/60 | brak (nigdy) | 15 | 23 | 57% (482/840) |
   | 2 | 60/60 | brak (nigdy) | 13 | 39 | 61% (513/840) |
   | 3 | 60/60 | brak (nigdy) | 15 | 47 | 71% (600/840) |

   Numer tury = licznik tury gry z odczytu po endTurn (pierwszy odczyt = 2). Wnioski: (a) gracz pasywny nie ma ceramiki przez cały pomiar — kara trwa dopóki nie zbuduje Garncarni (to zgodne z decyzją właściciela, ale trwa nieproporcjonalnie długo dla gracza, który nie buduje); (b) AI dostają ceramikę od tury 13–15 (Garncarnie AI), ale połowa dopiero po 23–47 turze. Zmiany balansu NIE wykonywałem. → **DECISION_REQUIRED** (patrz NASTĘPNY KROK). Uwaga: pomiar AI jest pośredni (z `upkeep` z odczytu gry, nie z magazynów poszczególnych miast).
   Pierwsza próba ziarna 3 zakończyła się błędem przeglądarki („Target page, context or browser has been closed"); log zachowany w `evidence/sim-seed3-proba1-BLAD-przegladarka.log`, pomiar powtórzony (`sim-seed3-60t.json`).

6. **Zrzut Chromium panelu pokrycia (e) — NIE_ZMIERZONO.** Nie wykonałem zrzutu panelu: nie zdążyłem ustalić w headless nawigacji do panelu imperium (w `citizen-consumption-era-live-measure.cjs` jest tylko sterowanie endTurn i odczyt `__ccMeas`). Dowód pośredni przez kod (NIE zrzut): lista surowców w panelu nie jest zapisana w UI — `empireDetailTypes.ts:113` i `empireDetailPanel.ts:3407` mówią, że panel używa stawki i werdyktu silnika (`citizen-resource-upkeep.ts`), a lista pochodzi z `citizenRequiredResourcesForEra` ← `data/citizen-resource-upkeep.json`. Zrzut do wykonania osobnym krokiem przed PASS końcowym.

7. **Parytet AI i drenaż 20 = 20 (c) — PRZYJMUJĘ.** Dodano sekcję L w `gra/tools/citizen-resource-upkeep-test.cjs` (commit d5a908f5f):
   - L1–L1d: Kamień, pop 20, pełny magazyn → `deductions.ceramika === 20` (także drewno/glina = 20), wszystkie 3 surowce available.
   - L2–L8 (zachowanie kary, zadanie b): ceramika=0 → missing=[ceramika], happinessDelta = 2·(+2) + (−2) = +2, growthPctDelta = −1; ceramika>0 → +6 i growth 0; stałe kary −2 / −1.
   - L9–L11 (parytet AI): `computeCitizenResourceDrain` (3 parametry) i `resolveCitizenResourceCoverage` (3 parametry, w tym opcjonalne `population`) nie przyjmują ownerId; ten sam magazyn → identyczny wynik. UWAGA: to kontrola sygnatury i wyniku, nie test wywołania przez ścieżkę AI w grze (ta jest pokryta pomiarem w pkt 5).
   Wynik: `citizen-resource-upkeep-test: 122 passed, 2 failed` (2 czerwone = bazowe: kotwica `const ordPctRaw = evaluateOrderFromBreakdown(` w main.ts oraz „F1 (mutant 1)" — identyczne na bazie d4c3c39d3/3c428164).

## Bramki i testy (surowe wyniki z tego przebiegu, worktree gra/, node_modules: `npm ci --ignore-scripts`)

- `npx tsc --noEmit`: exit 0, 0 linii wyjścia.
- Bramki referencyjne (R-PROC-AUTOBOT §6): logic-test 213/213 (LOGIC OK); tech-tree-test 20 pass 0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test „All sanity checks passed"; unit-power-test 6 pass 0 fail. (Bramka „Mgła/inwariant", „AI stawia budynki" itd. nie były w zakresie tej rundy — NIE_ZMIERZONO.)
- citizen-resource-upkeep-test: 122 passed, 2 failed (2 bazowe — opisane wyżej).
- citizen-upkeep-era-mult-test: 681 passed, 0 failed.
- citizen-consumption-era-mult-test: PASS.
- szczescie-przebudowa-skali-test: 516 OK, 4 FAIL — te same 4 co na bazie (katalog budynków 44 vs 41; komplet epok 12/24/32 vs 11/23/31); nowe asercje ceramiki przechodzą.
- `git diff --check`: exit 0.
- wikiBundle: zregenerowany (patrz pkt 3).

## Zmiany (commit d5a908f5f, pliki z allowlisty + evidence)

- gra/data/citizen-resource-upkeep.json (_opis)
- gra/src/game/citizen-resource-upkeep.ts (JSDoc nagłówka, bez zmiany kodu)
- gra/src/data/wikiBundle.json (regeneracja)
- docs/PORADNIK-GRACZA/06-miasto-spoleczenstwo.md (§35.2, §35.3)
- docs/encyklopedia/pojecia/szczescie.md (Wiki-M)
- gra/tools/citizen-resource-upkeep-test.cjs (sekcja L)
- gra/tools/citizen-consumption-era-live-measure.cjs (zapis ceramiki w trybie sim)
- dyspozycje/autobot/runs/R-WEB-DATA-CITIZEN-CERAMICS-STONE-AGE-Q1/evidence/ (3 pliki JSON + log)
- Kod gry (gra/src/game/*, UI) NIE zmieniony poza komentarzem; rust-port i WERSJE.md nietknięte.

## BLOKADY

- Zarzut 6 (zrzut Chromium panelu pokrycia) — NIE_ZMIERZONO.
- DECISION_REQUIRED (pkt 5): gracz pasywny bez Garncarni nie ma ceramiki przez 60/60 tur (kara −2 Szczęścia i −1% Rozwoju przez cały pomiar). Balans nie zmieniany — wymaga decyzji właściciela.
- Dług czerwony na bazie (citizen-resource-upkeep-test 2 FAIL, szczescie-przebudowa 4 FAIL) — osobne tematy, nie w tym temacie.

## RUNDY

2/5 (obrona r2). Poprzedni werdykt: FAIL (Evaluator 92b05cd2).

## UWAGI-DLA-ORKIESTRATORA

1. Wiadomość użytkownika relayowana w tej turze („Nie można w mieście zbudować więcej niż jednej garncarni") NIE jest częścią tego dispatchu i NIE została zaimplementowana. Wymaga osobnego dispatchu z decyzją właściciela o zakresie (czy limit dotyczy budynku Garncarnia na miasto, co z istniejącymi miastami, czy blokada przy budowie czy przy kolejce).
2. DECISION_REQUIRED z pkt 5 — proponowane pytanie ABC: „Gracz bez Garncarni nie ma ceramiki przez cały pomiar (60 tur); zostawić, czy dać ceramikę startową / przyspieszyć Garncarnię w epoce Kamień?" — opcje z rekomendacją po stronie właściciela.
3. node_modules w gra/ zainstalowane w worktree (ignorowane przez git); sprzątanie po stronie orkiestratora.
4. Pomiar wykonany na gałęzi obrony; wyniki nie zostały zweryfikowane na innym ziarnie niż 1–3.

## NASTĘPNY KROK

Evaluator r2 (SONNET): weryfikacja commitu d5a908f5f i tego raportu; zrzut Chromium (zarzut 6) jako osobny krok przed FC; decyzja właściciela w sprawie DECISION_REQUIRED (pkt 5) przed deployem.

DEPLOY/PUSH: NIE WYKONANO
