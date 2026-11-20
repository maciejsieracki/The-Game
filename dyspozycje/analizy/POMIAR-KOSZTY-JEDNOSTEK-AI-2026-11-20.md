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
- **Brak deficytu złota; głód wojska tylko w Normalnym i tylko wczesną grą (KOREKTA Obrony r2).** Deficyt złota = 0 w każdej turze obu przebiegów. Flaga `glodWojska` w JSONL (surowe dane, tura po turze): Niski = 0 wierszy AI w głodzie w całym przebiegu; Normalny = głód u 1–4 z 41 AI w turach 2–23 (szczyt 4 właścicieli w t8–t15; po t23 brak), łącznie 58 par właściciel-tura. Pierwotne zdanie „0 AI w głodzie w każdej turze” było błędne (sprawdzano tylko t30/t60/t90). Próg „> 50% AI w deficycie” NIE został osiągnięty (max 4/41 ≈ 10%).
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

## 7. Obrona r2 (zarzuty Evaluatora): przeliczenie z committowanego JSONL

Wszystkie liczby poniżej przelicza `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1/analyze-pace.cjs` (czyta wyłącznie `*.jsonl.gz` z repo; md5 nieskompresowanego JSONL zgodne z §6).

Polecenie: `node dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-A-UNIT-COSTS-AI-MEASURE-Q1/analyze-pace.cjs <niski.jsonl.gz> 30,60,90 --pair <normalny.jsonl.gz>`

**Jednostki per epoka** (epoka właściciela = `owner.hud.epoka`; zarzut 1 — teraz odtwarzalne):
- t90 Niski: Brąz 162, Żelazo 303 (suma 465; 14 AI).
- t90 Normalny: Brąz 191, Żelazo 126 (suma 317; 15 AI).
- t30/t60: wyłącznie Brąz (Niski 47 / 208; Normalny 40 / 159).

**Wspólni właściciele** (zarzut 3 — porównanie niewspółmierne usunięte; wspólny = AI z rekordem w obu przebiegach w tej samej turze):
- t30: 16 wspólnych. Niski 23 jednostki, Normalny 40 (kierunek ODWROTNY do pozostałych tur; traktuję jako szum trajektorii jednego ziarna, NIE jako efekt).
- t60: 15 wspólnych. Niski 208, Normalny 159 (−23,6%).
- t90: 14 wspólnych. Niski 465, Normalny 315 (−32,3%).

Wniosek z tabeli: próg „spadek >30% w t90” przekroczony także na wspólnych właścicielach, ale na jednym ziarnie, a w t30 kierunek jest odwrotny, więc szum jednego ziarna jest tego samego rzędu co efekt. Mechanizm NIE ZMIERZONO. Rozpadu przez deficyt złota nie ma (0 w każdej turze).

**Utrzymanie i żywność per właściciel** — w JSONL są sumy AI (`utrzymanieJednostekPieniadz`, `zywnoscArmiiTura`), rozbicia per właściciel per epoka nie liczono (NIE ZMIERZONO w tej rundzie).

**Liczba rozwiązanych jednostek (dezercja/głód)** (zarzut 2): NIE ZMIERZONO. Runner nie zlicza rozwiązań. Proxy z JSONL (spadki liczby jednostek właściciela między kolejnymi turami, bez rozróżnienia walki od dezercji): Niski 14 zdarzeń / 20 jednostek; Normalny 18 zdarzeń / 20 jednostek; wzrosty 234 vs 185. Proxy nie jest miarą dezercji.

**Głód wojska** (korekta do §4): patrz §4, punkt „Brak deficytu złota; głód wojska tylko w Normalnym”.

**Stan pozostałych zarzutów Obrony r2:** zarzut 4 — dodano do `gra/tools/ai-economy-measure-hook-test.cjs` asercje na `setUnitCostPace`/`unitCostPaceState` i `zywnoscArmiiTura` oraz pole `zywnoscArmiiTura` w `OWNER_KEYS`; wynik zielony 25/25; mutacja dowodowa (hak ignoruje tempo) daje 2 czerwone asercje, 23/25. Zarzut 5 — seed 7 i pierwszy odcinek bez flag Chromium NIE ZMIERZONO; nie ponawiano biegów.

## 8. Licznik rozwiązań jednostek, seed 7 i mechanizm spadku (R-WEB-VERIFY-LIVE-A2-UNIT-COST-DISBAND-COUNTER-SEED7-Q1)

Baza: `origin/main` 2ae9a3b87 (kod gry w tym przebiegu; bundle zbudowany poza repo). Warunki: 90 tur, rebalans ON (`--rebalance 1`), tempo `niski` vs `normalny`, ziarna 4242 i 7, runner `--unit-flow 1`. Dane surowe: `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-A2-UNIT-COST-DISBAND-COUNTER-SEED7-Q1/*.jsonl.gz` (89 wierszy tur 2–90 na bieg, bez duplikatów). Analiza: `analyze-unit-flow.cjs` w tym samym katalogu (wynik: `analysis.json`).

**Uwaga o porównaniu z §3:** liczby poniżej pochodzą z NOWEGO biegu na bieżącym main (po FALACH 880–888), nie z biegu VERIFYLIVEA; nie są bezpośrednio porównywalne z tabelą §3.

### 8.1 Jednostki AI (wspólni właściciele żywi w obu biegach; suma `jednostkiWojskowe`)

| Ziarno | Tura | Wspólnych | Niski | Normalny | Różnica |
|---|---|---|---|---|---|
| 4242 | 30 | 15 | 63 | 39 | −38,1% |
| 4242 | 60 | 15 | 224 | 163 | −27,2% |
| 4242 | 90 | 14 | 499 | 315 | −36,9% |
| 7 | 30 | 15 | 68 | 42 | −38,2% |
| 7 | 60 | 15 | 224 | 180 | −19,6% |
| 7 | 90 | 14 | 467 | 334 | −28,5% |

Spadek w t90 na wspólnych właścicielach: −36,9% (4242) i −28,5% (7). Progu decyzyjnego tu nie wskazuję (zgodnie z dispatchem); liczby podane surowo.

### 8.2 Przepływ jednostek AI od tury 2 do 90 (skumulowany, wspólni właściciele)

| Ziarno | Tempo | Nowe id (`noweId`) | Rozwiązane (`rozwiazanie-ai`) | Zniknięte bez przyczyny | Zmiana stanu |
|---|---|---|---|---|---|
| 4242 | niski | 508 | 5 | 14 | +489 |
| 4242 | normalny | 333 | 14 | 15 | +304 |
| 7 | niski | 484 | 14 | 14 | +456 |
| 7 | normalny | 357 | 21 | 14 | +322 |

- Brak usunięć z przyczyną `glod-armii`, `glod-oblezenie` i `deficyt-zlota` we wszystkich czterech biegach (0 zdarzeń).
- `eliminacja-wlasciciela` (wszystkie właściciele, nie tylko wspólni): 24–26 zdarzeń jednostek na bieg; nie wchodzi do tabeli wspólnych.
- Zniknięte bez przyczyny = walka po bitwie (`post-battle-map.ts` `removeUnitById`) i inne ścieżki bez znacznika (w tym przejęcie miasta, `main.ts` ok. linii 19115); NIE ROZDZIELONO walki od pozostałych — NIE ZMIERZONO osobno.
- `noweId` = każde nowe id jednostki od poprzedniej tury (rekrutacja i ewentualne inne tworzenie); NIE rozdzielono rekrutacji od innych źródeł.

### 8.3 Główna przyczyna różnicy Niski vs Normalny

Różnica zmiany stanu (niski − normalny) w t90: 4242 = 185; 7 = 134. Różnica `noweId` (niski − normalny) w t90: 4242 = 175 (95% różnicy stanu); 7 = 127 (95%). Różnica usunięć jest mała i w obu ziarnach ma znak przeciwny (Normalny usuwa 10 i 7 jednostek więcej). Wniosek: główną przyczyną różnicy jest mniej nowych jednostek w tempie Normalnym (rekrutacja), a nie rozpad armii. Dlaczego rekrutacja jest mniejsza (koszt ×2 vs popyt na armię) — NIE ZMIERZONO.

### 8.4 Utrzymanie armii per epoka (AI, owner-tury z jednostkami; średnia na właściciela-turę)

| Ziarno | Tempo | Epoka | Owner-tury | Pieniądz | Żywność | Surowce (suma) | Tury z głodem |
|---|---|---|---|---|---|---|---|
| 4242 | niski | 2 | 1746 | 41,3 | 40,5 | 28,6 | 1 |
| 4242 | niski | 3 | 79 | 324,6 | 319,4 | 208,3 | 0 |
| 4242 | normalny | 2 | 1840 | 56,2 | 55,6 | 39,8 | 58 |
| 4242 | normalny | 3 | 42 | 377,0 | 367,8 | 246,5 | 0 |
| 7 | niski | 2 | 1829 | 45,0 | 43,8 | 30,4 | 0 |
| 7 | niski | 3 | 83 | 408,8 | 401,5 | 260,4 | 0 |
| 7 | normalny | 2 | 1789 | 64,6 | 63,5 | 44,8 | 45 |
| 7 | normalny | 3 | 50 | 505,1 | 491,0 | 323,2 | 0 |

Epoka 3 ma mało owner-tur (późne tury, mało właścicieli); epoka 1 i 4 nie występują w tych biegach z jednostkami AI.

### 8.5 Wniosek (tylko liczby)

- Spadek liczby jednostek AI w t90 na wspólnych właścicielach: −36,9% (4242) i −28,5% (7). Na ziarnie 7 spadek jest poniżej 30%, więc nie powtarza się z progiem dispatchu.
- Mechanizm w obu ziarnach: mniej NOWYCH jednostek w tempie Normalnym (95% różnicy stanu), usunięcia podobne lub mniejsze. Rozpad armii przez głód lub deficyt złota nie wystąpił (0 zdarzeń z przyczyną).
- Głód wojska w tempie Normalnym: 58 (4242) i 45 (7) owner-tur z głodem; w Niskim 1 i 0. Ten głód nie usuwa jednostek w tym pomiarze (atrycja HP nie była liczona).
- NIE ZMIERZONO: powód mniejszej rekrutacji; osobny udział walki w `zniknięte bez przyczyny`; wpływ głodu na HP.
