# Balans AI po FALI 930 — skutek poziomów „Kultura i religia” (gracz / AI)

Temat: R-WEB-AI-CULT-BALANCE-MEASURE-Q1 (tag AIBAL). Pomiar na żywo, zero zmian w `gra/src` i `gra/data`.
Baza kodu: `c0a55450945535a0680b569b0cf5c650314c86f9` (origin/main, FALA 930).

## Warunki pomiaru (na poziomie maksymalnym reszty ustawień)

- Runner: `gra/tools/ai-cult-rel-measure-run.cjs --pace wysoki --koszt-jednostek wysoki --difficulty trudny --city-state 1 --unit-flow 1 --every 5 --turns 90`, `--kr <gracz> --kr-ai <AI>`.
- Gra: Trudny (poziom najwyższy). Koszty jednostek: Wysoki (×4, najwyższy). Tryb miasta-państwa: 1.
- Poziom „Kultura i religia” gracza i AI: trudny / latwy (najwyższy = trudny; w ustawieniach są trzy poziomy).
- Dyplomacja: flagi dyplomacji są domyślnie ON (FALA 888). Poziom „Dyplomacja i wojna”: runner **nie ustawia** go (zostaje domyślny `latwa`). Najwyższy poziom to `trudna`. Ustawienie wymagałoby zmiany `startGame` w `gra/src/main.ts`, czego zakaz tego tematu nie dopuszcza. Wpływ poziomu `trudna` jest NIE ZMIERZONO.
- Readback ustawień: każdy bieg zapisuje w `run.txt` linię `[readback]` z `__settingsLive.getSettings()` (dodana w tym temacie do `ai-cult-rel-measure-run.cjs`). Przykład, wariant trudny/trudny: `kulturaReligiaLevel: trudny`, `kulturaReligiaLevelAI: trudny`, `kosztJednostekPace: wysoki`, `difficulty: hard`, `diplomacyWarLevel: latwa`.
- Build: `vite build` do `/tmp/aibal-dist` (poza repo). Chromium `/opt/pw-browsers/chromium-1243`.
- Dane surowe (jsonl, state, summary, logi `run.txt`, zestawienia): `dyspozycje/autobot/runs/R-WEB-AI-CULT-BALANCE-MEASURE-Q1/dane/<wariant>-s<ziarno>/`, plus `zestawienie-flow.txt` i `zestawienie-wojny-miasta.txt`.

Oznaczenia wariantów (gracz / AI): **tt** = trudny/trudny, **tl** = trudny/łatwy, **ll** = łatwy/łatwy.

## Tabela: wariant × ziarno × tura

Miasta AI i jednostki wojskowe AI są sumą po właścicielach AI (owner > 0). „Porządek śr.” to średni Porządek AI (z biegu flow). „<14%” to liczba miast AI poniżej progu buntu skrajnego. „Bunt” to miasta w buncie z biegu flow. „Puste” to miasta AI bez garnizonu.

| Wariant | Ziarno | Tura | Jedn. AI | Miasta AI | Cywilizacje AI bez miast | Puste (udział) | Porządek AI śr. | Miasta AI <14% | Bunt | Wojny aktywne (z graczem / AI↔AI) |
|---|---|---|---|---|---|---|---|---|---|---|
| tt | 4242 | 30 | 172 | 126 | 0 z 15 | 42 (33%) | 62,9 | 0 | 0 | 0 (0 / 0) |
| tt | 4242 | 60 | 216 | 187 | 0 z 15 | 51 (27%) | 55,5 | 1 | 0 | 6 (0 / 6) |
| tt | 4242 | 90 | 260 | 196 | 0 z 15 | 66 (34%) | 55,7 | 5 | 3 | 5 (1 / 4) |
| tl | 4242 | 30 | 183 | 133 | 0 z 15 | 34 (26%) | 65,0 | 0 | 0 | 0 (0 / 0) |
| tl | 4242 | 60 | 230 | 193 | 0 z 15 | 63 (33%) | 57,1 | 1 | 1 | 7 (0 / 7) |
| ll | 4242 | 30 | 183 | 133 | 0 z 15 | 34 (26%) | 65,0 | 0 | 0 | 0 (0 / 0) |
| ll | 4242 | 60 | 226 | 192 | 0 z 15 | 64 (33%) | 57,4 | 1 | 0 | 7 (0 / 7) |
| tt | 7 | 30 | 190 | 127 | 0 z 15 | 19 (15%) | 66,0 | 0 | 0 | 0 (0 / 0) |
| tt | 7 | 60 | 262 | 184 | 0 z 15 | 44 (24%) | 52,3 | 0 | 0 | 5 (1 / 4) |
| tl | 7 | 30 | 184 | 134 | 0 z 15 | 28 (21%) | 66,8 | 0 | 0 | 0 (0 / 0) |
| tl | 7 | 60 | 272 | 187 | 0 z 15 | 32 (17%) | 54,2 | 0 | 1 | 5 (2 / 3) |
| ll | 7 | 30 | 184 | 134 | 0 z 15 | 28 (21%) | 66,8 | 0 | 0 | 0 (0 / 0) |
| ll | 7 | 60 | 266 | 186 | 0 z 15 | 42 (23%) | 52,9 | 0 | 1 | 5 (2 / 3) |

Metryki bez pozycji w tabeli, bo runner ich nie zlicza: straty jednostek (NIE ZMIERZONO), liczba zakończonych buntów AI (NIE ZMIERZONO, jest tylko liczba miast w buncie), Porządek i Szczęście gracza (NIE ZMIERZONO, pola nie ma w jsonl). Ziarno 7 nie zostało przeprowadzone do t90 (NIE ZMIERZONO). Wariant ll i tl na ziarnie 4242 do t90 nie zostały przeprowadzone (NIE ZMIERZONO).

Liczba jednostek na cywilizację AI (15 cywilizacji): tt/4242 t60 ≈ 14,4; tl/4242 t60 ≈ 15,3; tt/7 t60 ≈ 17,5; tl/7 t60 ≈ 18,1.

## Kontrola powtarzalności z wcześniejszym pomiarem

Analiza `dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md` podaje dla tego samego wariantu (trudny/trudny, PO) t60: jednostki 214 (4242) i 259 (7, t58), Porządek 55,4 i 52,4, miasta 188 i 183, miasta poniżej 14%: 1 i 1.
W tym pomiarze tt t60: jednostki 216 (4242) i 262 (7), Porządek 55,5 i 52,3, miasta 187 i 184, poniżej 14%: 1 i 0. Różnice mieszczą się w zakresie tury 58 kontra 60 i w szumie; wynik jest powtarzalny na tym samym kodzie.

Baza sprzed FALI 926 to tabela PRZED z `dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md` (bundle `3608af1ce`, t60, tt): jednostki AI 142 / 133, Porządek AI 19,3 / 19,8, miasta poniżej 14%: 67 / 75. Nie są to trzy dokumenty wskazane w dispatchu. Ta tabela jest przed garnizonem i budynkami AI (FALA 926) i przed pakietem kultury (FALA 930), więc kierunek zmian jest przybliżony. Pomiar pre-926 nie jest powtórzony w tym temacie (NIE ZMIERZONO).

## Wnioski (opisowo, z liczbami)

1. **Poziom kultury gracza prawie nie zmienia AI.** Przy AI na poziomie łatwym porównanie ll (gracz łatwy) z tl (gracz trudny) daje: jednostki 226 vs 230 (4242) i 266 vs 272 (7), Porządek 57,4 vs 57,1 i 52,9 vs 54,2. Różnice są rzędu 2–6 jednostek i 0–1 punktu Porządku przy dwóch ziarnach, więc są w granicach szumu.
2. **Poziom kultury AI zmienia AI słabo.** Przy graczu trudnym porównanie tt (AI trudny) z tl (AI łatwy): jednostki 216 vs 230 (4242) i 262 vs 272 (7), czyli o 4–6% mniej przy AI trudnym. Porządek AI 55,5 vs 57,1 i 52,3 vs 54,2, czyli o 1,6–1,9 punktu mniej. Miasta AI 187 vs 193 i 184 vs 187. Liczba miast AI poniżej 14% jest równa (1 vs 1; 0 vs 0).
3. **Względem bazy przed FALĄ 926 AI jest mocniejsze, nie słabsze.** Na trudnej kulturze Porządek AI wzrósł z ok. 19–20% do 52–55% przy t60, a miasta AI poniżej 14% spadły z 67–75 do 0–1. Liczba jednostek AI wzrosła z 133–142 do 214–262 (+50–95%). Kierunek zmiany jest zgodny na obu ziarnach.
4. **Dynamika buntów i jednostek (tt/4242, z zestawienie-flow.txt).** Bunt AI pojawia się już w t40 (1 miasto w buncie), w t50 wraca do 0, w t60 wynosi 0 dla tt/4242 i 1 dla tl/4242, w t70 jest 2, szczyt w t80 (6 miast w buncie), a w t90 3. Liczba miast AI poniżej 14% rośnie: 0 w t30, 1 w t60, 5 w t90. Jednostki AI nie rosną monotonicznie: 269 w t40, 200 w t50, 216 w t60, 254 w t70 i t80, 260 w t90. Ten odczyt pochodzi z jednego ziarna i jednego wariantu. Dla tt/7 po t60 oraz dla wariantów tl/ll po t60 dynamika nie została zmierzona (NIE ZMIERZONO), więc nie wiadomo, czy zjawisko się powtarza.
5. **Puste miasta.** Udział pustych miast AI przy t60 wynosi 17–33% (tt/4242 27%, tt/7 24%, tl/7 17%). Pomiar nie zawiera porównania z wcześniejszą wersją gry o tych samych warunkach, więc nie ma podstaw, by przypisać ten poziom konkretnej falii. Przyczyna pustych miast nie była badana (NIE ZMIERZONO). Gracz może zobaczyć, że wiele miast AI nie ma garnizonu w t30–t60 (w t30 udział pustych to 15–33%).
6. **Wojny.** W t60 jest 5–7 aktywnych wojen na wariant, prawie wszystkie AI↔AI. Wojny z graczem: 0 w tt/4242 do t60, 1 w tt/7, 2 w tl/7 i ll/7. Liczba cywilizacji AI bez miast jest zerowa we wszystkich biegach (15 z 15 ma miasta).

Wniosek ogólny: po FALI 930 AI na trudnej kulturze jest w sensie Porządku i buntów wyraźnie stabilniejsze niż przed FALĄ 926 (Porządek AI z ok. 19–20% do 52–55%, miasta poniżej 14% z 67–75 do 0–1, jednostki AI +50–95%; patrz wniosek 3). Poziom AI-kultury (trudny vs łatwy) ma przy tym niewielki wpływ na jednostki i Porządek (4–6% jednostek, około 2 punkty Porządku; wniosek 2). Czy AI jest „zbyt mocne” lub „zbyt słabe” jest kwestią oceny balansu, a nie pomiaru. Dane nie zawierają strat ani liczby buntów zakończonych, więc nie ma podstaw do oceny siły bojowej.

## DECISION_REQUIRED

Czy AI na trudnym poziomie „Kultura i religia” ma zostać, jaka jest, czy ma się różnić od AI na łatwym poziomie bardziej, czy mniej? Warianty opisane skutkiem dla gracza:

- A) Zostaje (rekomendowane, bez zmian parametrów): AI na trudnym poziomie ma Porządek ok. 55% w t60 i trochę mniej jednostek (ok. 5%) niż na łatwym; gracz zobaczy małe różnice między poziomami AI, a kilka miast AI wpada w bunt po t60.
- B) Większa różnica: AI na trudnym poziomie kultury jest wyraźnie słabsza w Porządku i buntach niż teraz, a AI na łatwym poziomie wyraźnie słabsza od AI na trudnym; gracz odczuje, że poziom AI-kultury zmienia sąsiadów wyraźnie.
- C) Mniejsza różnica: AI na obu poziomach zachowuje się prawie tak samo; gracz nie zobaczy różnicy w sąsiadach po wyborze poziomu AI-kultury, a wybór ustawienia będzie ważny tylko dla gracza.

Uwaga do decyzji: różnica między A a C (4–6% jednostek, ok. 2 punkty Porządku) jest bliska szumu przy dwóch ziarnach, więc dane słabo uzasadniają wybór między nimi. B i C wymagają zmiany parametrów kultury (poza tym tematem, który nie zmienia parametrów).

## Zakres i zastrzeżenia

- Zero zmian w `gra/src` i `gra/data`. Jedyna zmiana w kodzie to readback `[readback]` w `gra/tools/ai-cult-rel-measure-run.cjs` (narzędzie pomiaru, nie gra).
- Dwa ziarna (4242 i 7). Różnice poniżej kilku procent między wariantami nie są rozstrzygalne bez większej liczby ziaren.
- Poziom „Dyplomacja i wojna” w biegach to `latwa` we wszystkich sześciu biegach (readback w `run.txt`: `diplomacyWarLevel: latwa`). To NIE jest poziom maksymalny (`trudna`). Runner nie przekazuje tego ustawienia: hak `window.__nnsMeasureDebug.startGame` w `gra/src/main.ts` nie przyjmuje `diplomacyWarLevel`, a zmiana tego haka leży poza allowlistą (zakaz `gra/src`). Wpływ poziomu `trudna` jest NIE ZMIERZONO; wszystkie wyniki tej tabeli dotyczą poziomu `latwa` dla dyplomacji i wojny. Kandydat na osobny temat: dodać przekazanie ustawienia w haku pomiarowym (po decyzji orkiestratora).
- Zakres wariantów jawnie niepełny względem GOAL: nie zmierzono normalny/normalny ani latwy/trudny; warianty ll i tl tylko do t60; seed 7 tylko do t60 (tt/7 też do t60); brak strat, zakończonych buntów i Porządku/Szczęścia gracza. Kryterium binarne z dispatchu (3 warianty × 2 ziarna do t60 z surowymi danymi i readbackiem) jest spełnione.
- Przerwy w Chromium: segmenty biegów kończyły się SIGSEGV przy wznowieniu w openGame; ponawiano do trzech razy, wszystkie biegi wznowiono ze slotu bez utraty tur.
- Bramki (zmierzone na kandydacie `fba205a66`, worktree z `npm ci` w `gra/`, bez `npm run build`/`dev`): `npx tsc --noEmit` exit 0 (wyjście puste); `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0; `node tools/ai-test.cjs` → `ai-test: 297 passed, 0 failed`, exit 0.
