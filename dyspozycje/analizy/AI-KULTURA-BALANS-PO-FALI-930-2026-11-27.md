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

Baza sprzed FALI 926 (PRZED z tej samej analizy, bundle `3608af1ce`, t60): jednostki AI 142 / 133, Porządek AI 19,3 / 19,8, miasta poniżej 14%: 67 / 75. Jest to baza przed garnizonem i budynkami AI (FALA 926) i przed pakietem kultury (FALA 930). Pomiar pre-926 nie jest powtórzony w tym temacie (NIE ZMIERZONO).

## Wnioski (opisowo, z liczbami)

1. **Poziom kultury gracza prawie nie zmienia AI.** Przy AI na poziomie łatwym porównanie ll (gracz łatwy) z tl (gracz trudny) daje: jednostki 226 vs 230 (4242) i 266 vs 272 (7), Porządek 57,4 vs 57,1 i 52,9 vs 54,2. Różnice są rzędu 2–6 jednostek i 0–1 punktu Porządku przy dwóch ziarnach, więc są w granicach szumu.
2. **Poziom kultury AI zmienia AI słabo.** Przy graczu trudnym porównanie tt (AI trudny) z tl (AI łatwy): jednostki 216 vs 230 (4242) i 262 vs 272 (7), czyli o 4–6% mniej przy AI trudnym. Porządek AI 55,5 vs 57,1 i 52,3 vs 54,2, czyli o 1,6–1,9 punktu mniej. Miasta AI 187 vs 193 i 184 vs 187. Liczba miast AI poniżej 14% jest równa (1 vs 1; 0 vs 0).
3. **Względem bazy przed FALĄ 926 AI jest mocniejsze, nie słabsze.** Na trudnej kulturze Porządek AI wzrósł z ok. 19–20% do 52–55% przy t60, a miasta AI poniżej 14% spadły z 67–75 do 0–1. Liczba jednostek AI wzrosła z 133–142 do 214–262 (+50–95%). Kierunek zmiany jest zgodny na obu ziarnach.
4. **Problem pojawia się po t60.** Na tt/4242 w t90 jest 5 miast AI poniżej 14% i 3 miasta w buncie (w t60: 1 i 0), a Porządek śr. spada do 55,7. Ten odczyt pochodzi z jednego ziarna i jednego wariantu. Dla tt/7 i wariantów tl/ll czas t90 nie został zmierzony (NIE ZMIERZONO), więc nie wiadomo, czy zjawisko się powtarza.
5. **Puste miasta.** Udział pustych miast AI przy t60 wynosi 17–33% (tt/4242 27%, tt/7 24%, tl/7 17%). Dla odniesienia: według dispatchu FALI 857 przed poprawką garnizonu w t60 było 167 pustych z 193 miast (ok. 86%), a po niej 16 z 188 (ok. 9%). Obecne wartości (17–33%) są wyższe niż po FALI 857, co wynika z ponownego pojawiania się pustych miast po FALACH 926–930; przyczyna nie była badana (NIE ZMIERZONO). Pusta struktura miast jest cechą, którą gracz może zobaczyć: wiele miast AI nie ma garnizonu.
6. **Wojny.** W t60 jest 5–7 aktywnych wojen na wariant, prawie wszystkie AI↔AI. Wojny z graczem: 0 w tt/4242 do t60, 1 w tt/7, 2 w tl/7 i ll/7. Liczba cywilizacji AI bez miast jest zerowa we wszystkich biegach (15 z 15 ma miasta).

Wniosek ogólny: po FALI 930 AI na trudnej kulturze jest zauważalnie słabsze niż przed FALĄ 926 w sensie Porządku i buntów, ale poziom AI-kultury (trudny vs łatwy) ma niewielki wpływ na jednostki i Porządek (4–6% jednostek, około 2 punkty Porządku). Czy AI jest „zbyt mocne” lub „zbyt słabe” jest kwestią oceny balansu, a nie pomiaru. Dane nie zawierają strat ani liczby buntów zakończonych, więc nie ma podstaw do oceny siły bojowej.

## DECISION_REQUIRED

Czy AI na poziomie kultury „Trudny” ma zostać tak jak jest (Porządek ok. 55%, około 2 punkty więcej niż na łatwym, około 5% mniej jednostek, kilka buntów po turze 60), czy ma dostać mocniejszą różnicę między poziomami: A) zostaje, B) większa różnica poziomów AI, C) mniejsza różnica poziomów AI. Decyzja ma wpływ na to, jak gracz odczuje wyzwanie AI na poziomach kultury. Szczegóły: tabela wyżej; wariant A zostawia obecną wartość, B i C wymagają zmiany parametrów (poza tym tematem, który nie zmienia parametrów).

## Zakres i zastrzeżenia

- Zero zmian w `gra/src` i `gra/data`. Jedyna zmiana w kodzie to readback `[readback]` w `gra/tools/ai-cult-rel-measure-run.cjs` (narzędzie pomiaru, nie gra).
- Dwa ziarna (4242 i 7). Różnice poniżej kilku procent między wariantami nie są rozstrzygalne bez większej liczby ziaren.
- Poziom „Dyplomacja i wojna” w biegach to `latwa` (NIE ZMIERZONO na `trudna`).
- Przerwy w Chromium: segmenty biegów kończyły się SIGSEGV przy wznowieniu w openGame; ponawiano do trzech razy, wszystkie biegi wznowiono ze slotu bez utraty tur.
- Bramka tsc: `npm run typecheck` (tsc --noEmit) w worktree: exit 0. Bramki logic 213 i ai-test 297/0 NIE ZMIERZONO w tym temacie (gra/src bez zmian).
