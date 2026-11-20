# Pomiar: „Koszty jednostek” (Niski ×1 vs Normalny ×2) — skutek na armię AI i skarbiec

Temat: R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1 (runda 1, Operator). Baza kodu: origin/main `8f50028c3`.
Zakres: POMIAR. Zmiana kodu tylko w haku pomiarowym `?civTest=1` (`gra/src/main.ts`, `setUnitCostPace`, `unitCostPaceState`, pole `zywnoscArmiiTura`) i w runnerze (`--pace`). Wartości balansu NIE zmienione.

## 1. Status pomiaru (uczciwie)

| Element | Stan |
|---|---|
| Ziarno 4242, 90 tur, pace NISKI, rebalans ON | ZMIERZONE (89 wierszy, tury 2–90) |
| Ziarno 4242, 90 tur, pace NORMALNY, rebalans ON | ZMIERZONE (89 wierszy, tury 2–90) |
| Ziarno 7 | NIE ZMIERZONO (brak czasu w tej rundzie) |
| Liczba dezercji / rozwiązanych jednostek | NIE ZMIERZONO (runner tego nie liczy; widać tylko spadek liczby jednostek) |
| Przyczyna spadku liczby jednostek (mechanizm) | NIE ZMIERZONO przyczynowo |
| Gracz (owner 0) | NIEINFORMACYJNY (gracz nie jest autopilotem; bez wojny i rozbudowy) |
| Pace PRZED pierwszą turą | ZMIERZONE: runner asertuje `setUnitCostPace(p) === p` przed startem |

Uwaga o sterowaniu przebiegiem: Chromium padało przy wznawianiu slotu (SIGSEGV, zgodnie z notatką CHROMEHELPER). Przebiegi wznawiano z tym samym `--out` i `--profile`, a od tury 10 w górę z flagami `MEASURE_CHROME_ARGS="--disable-gpu --mute-audio"`. Pierwszy odcinek NISKIEGO (t1–t10) był bez tych flag. Wpływu flag na wynik NIE ZMIERZONO (brak porównania).

## 2. Najważniejsze zastrzeżenie: zmiana liczby właścicieli AI

W obu przebiegach około 25 właścicieli AI znika z wierszy metryk (nie ma miasta ani jednostki) w krótkim oknie tur:

| Przebieg | Właściciele AI z wierszem (AI z jednostką) |
|---|---|
| NISKI | t2 41/41, t15 41/40, t30 41/40, **t35 15/14**, t50 15/15, t70 14/14, t90 14/14 |
| NORMALNY | t2 41/41, t15 41/39, **t25 16/16**, t35 16/15, t50 15/15, t70 15/15, t90 15/15 |

Zniknięcia zachodzą w różnych turach (NISKI ok. t30–35, NORMALNY ok. t20–25). Zjawisko było obserwowane także w r3 (`ai-economy-measure-README.md`, „Obserwacje”), przyczyna NIE ZMIERZONO. Porównanie t30 między przebiegami jest więc **niewspółmierne** (41 vs 16 właścicieli), a porównanie t90 dotyczy różnych zbiorów (14 vs 15). Wskaźnik „na przetrwałego właściciela” w t90: NISKI 465/14 = 33,2 jednostki; NORMALNY 317/15 = 21,1 jednostki (−36%). Oba sposoby liczenia dają spadek powyżej progu 30%, ale na jednym ziarnie i przy nierównych zbiorach właścicieli. To NIE jest dowód rozpadu.

## 3. Tabele (surowe liczby z JSONL; suma po właścicielach AI, owner ≠ 0)

Epoki: 1 = Kamień, 2 = Brąz, 3 = Żelazo (mapowanie wg `war-rules-multiwar.ts` i `research.ts`). Utrzymanie w Pieniądzu i żywności w jednostkach na turę. Złoto = skarbiec właściciela. Spichlerz = zapas żywności państwa.

### NISKI (×1), seed 4242, rebalans ON

| Tura | Właściciele AI (z jednostką) | Jednostki (suma) | Jednostki per epoka | Utrzymanie Pieniądz/t | Żywność armii/t | Złoto suma | Złoto mediana | AI w deficycie złota | AI w głodzie | Spichlerz suma | Spichlerz mediana | Żelazo: jednostki / właściciele |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 30 | 41 (40) | 47 | Brąz 47 | 200 | 200 | 2 567 | 14 | 0 | 0 | 534,5 | 6 | 0 / 0 |
| 60 | 15 (15) | 208 | Brąz 208 | 1 220 | 1 204 | 16 413 | 320 | 0 | 0 | 3 287,5 | 46,5 | 0 / 0 |
| 90 | 14 (14) | 465 | Żelazo 303, Brąz 162 | 4 904 | 4 776 | 72 563,2 | 3 995,5 | 0 | 0 | 189 468,5 | 10 926,8 | 303 / 7 |

### NORMALNY (×2), seed 4242, rebalans ON

| Tura | Właściciele AI (z jednostką) | Jednostki (suma) | Jednostki per epoka | Utrzymanie Pieniądz/t | Żywność armii/t | Złoto suma | Złoto mediana | AI w deficycie złota | AI w głodzie | Spichlerz suma | Spichlerz mediana | Żelazo: jednostki / właściciele |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 30 | 16 (16) | 40 | Brąz 40 | 320 | 320 | 1 417 | 20 | 0 | 0 | 105 | 5 | 0 / 0 |
| 60 | 15 (15) | 159 | Brąz 159 | 1 528 | 1 512 | 13 424,6 | 202 | 0 | 0 | 3 028 | 31 | 0 / 0 |
| 90 | 15 (15) | 317 | Żelazo 126, Brąz 191 | 4 936 | 4 888 | 67 183,6 | 2 417 | 0 | 0 | 152 896,5 | 6 489 | 126 / 5 |

Gracz (owner 0), tura 90: NISKI 1 jednostka, NORMALNY 1 jednostka. NIEINFORMACYJNY.

## 4. Czytanie wyników

- **Utrzymanie ×2 działa.** Przy zbliżonej liczbie jednostek Pieniądz/t rośnie około ×2 (t30: 320 vs 200 przy 40 vs 47 jednostkach, czyli ok. 8,0 vs 4,3 na jednostkę). Żywność armii idzie tym samym śladem.
- **Brak deficytu i głodu.** W obu przebiegach w każdej turze 0 AI w deficycie złota i 0 AI w głodzie wojska. Próg „> 50% AI w deficycie” NIE został osiągnięty.
- **Skarbiec nie jest ograniczeniem.** Mediana złota AI w t90: 3 995 (Niski) i 2 417 (Normalny). Spichlerz AI nie zbliża się do zera.
- **Armia AI jest mniejsza w Normalnym**, w t60 (159 vs 208) i w t90 (317 vs 465). Spadek zbiega się z zjawiskiem zniknięcia właścicieli (§2), więc nie da się go jeszcze przypisać kosztom.
- **Rekrutacja w Żelazie działa w obu przebiegach** (t90: Niski 303 jednostki u 7 właścicieli; Normalny 126 u 5). AI rekrutuje w epoce Żelaza, koszt ×2 tego nie blokuje całkowicie.

## 5. Wniosek (próg z dispatchu)

Próg: spadek liczby jednostek AI > 30% względem Niski w t90, lub > 50% AI w deficycie.

- Spadek w t90 = 31,8% (suma) i 36% (na przetrwałego właściciela). Próg przekroczony **na jednym ziarnie i przy różnych zbiorach właścicieli**. Nie uznaję tego za potwierdzony rozpad.
- Deficyt/głód = 0%. Drugi próg NIE przekroczony.
- Mechanizm: NIE ZMIERZONO. Brak deficytu i głodu sugeruje, że spadek pochodzi z rekrutacji (koszt ×2, `applyUnitCostPace` w `production.ts`), a nie z rozpadu przez utrzymanie. To hipoteza, nie wynik pomiaru.
- Sugestia mnożnika: NIE ZMIERZONO. Runner obsługuje tylko trzy tempa, a ta runda nie wykonała przebiegu z pośrednim mnożnikiem. Nie wskazuję wartości liczbowej.

**Rekomendacja:** przed decyzją o zmianie Normalnego powtórzyć pomiar na ziarnie 7 (oba tempa) i policzyć armię tylko dla właścicieli przetrwałych w obu przebiegach. Dodać w runnerze licznik rekrutacji i utraty jednostek, żeby oddzielić koszt rekrutacji od utrzymania.

## 6. Powtórzenie (komendy)

Build poza repo (z `gra/`):

    node ./node_modules/vite/bin/vite.js build --outDir <abs-dist-poza-repo> --emptyOutDir

Przebieg (wznawialny, to samo `--out` i `--profile`; kolejne wywołania z rosnącym `--stop-at`):

    MEASURE_CHROME_ARGS="--disable-gpu --mute-audio" CHROME_PATH=/usr/bin/google-chrome \
      node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil-niski> --out <abs-wyniki-niski> \
      --seed 4242 --turns 90 --every 10 --pace niski --rebalance 1 --stop-at 90

Zamiana `--pace niski` na `--pace normalny` (własny `--profile` i `--out`) daje drugi przebieg. Analiza: skrypt poza repo (`analyze-pace.cjs`, czyta `seed4242.jsonl`).

Dane surowe (skróty gzip, w repo): `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1/niski-seed4242.jsonl.gz` (md5 nieskompresowanego: `1013014ddae83195b0ea24ca9e7e803f`) i `normalny-seed4242.jsonl.gz` (md5: `4668ad5aac0410049b905dfc34058794`). Pełne przebiegi poza repo: katalogi `run-niski` i `run-normalny` w scratchpadzie sesji.
