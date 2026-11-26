# AI „Kultura i religia: trudny” — diagnoza przyczyn (R-WEB-AI-CULT-REL-DIAG-Q1)

Data: 2026-11-26. Baza: origin/main `5748b924f` (FALA 926). Tylko pomiar i diagnoza: zero zmian reguł, parametrów i balansu.

## Pytanie

Na poziomie maksymalnym (gra „Trudny”) AI ma ok. 30% mniej jednostek i dużo pustych miast względem trybu zgodności. Ustalić liczbami, która przyczyna to tłumaczy.

## Metoda

- Runner `gra/tools/ai-cult-rel-measure-run.cjs` (headless Chromium, żywy bundle vite zbudowany poza repo, realny `endTurn`, `?civTest=1`).
- Dwa warianty, ta sama trudność gry (`difficulty=trudny` w obu), różni się WYŁĄCZNIE ustawienie „Kultura i religia”:
  - `trudny` (poziom maksymalny),
  - `zgodnosc` (odniesienie).
- Ziarna 4242 i 7, 60 tur każdy (4 biegi).
- Nowe, tylko odczytowe liczniki:
  - hak `__aiEconomyMeasure.cityStateTurn(prog)` w `gra/src/main.ts`, wewnątrz istniejącego bloku `?civTest=1` (linia ok. 34350): per właściciel miasta, bunt skrajny (`bunt`), rebelia (`rebelState`), ostrzeżenie (`revoltWarning`), Porządek poniżej progu, suma PorPct, pasma (`bandLabel`);
  - flaga `--city-state 1` w runnerze (próg = `porzadek_prog_bunt_skrajny_pct.hard` = 14 %, z `data/society-params.json`);
  - przyrost jednostek i przyczyny zejścia (`--unit-flow 1`, istniejący hak) — produkcja i straty per przyczyna.
- Dane surowe: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aicult/{trudny-4242,trudny-7,zgod-4242,zgod-7}/seed*.jsonl`; skrypt zestawień: `.../scratchpad/aicult/analyze.py`.

## Wyniki: tura 60, suma AI (owner > 0)

| Wielkość | trudny s4242 | zgodn. s4242 | trudny s7 | zgodn. s7 |
|---|---|---|---|---|
| Miasta AI | 159 | 190 (+19%) | 165 | 194 (+18%) |
| Jednostki wojskowe AI | 187 | 273 (+46%) | 205 | 337 (+64%) |
| Jednostki na miasto | 1,18 | 1,44 | 1,24 | 1,74 |
| Puste miasta (0 wojska) | 50 (31%) | 56 (29%) | 57 (35%) | 38 (20%) |
| Budynki Prawa (sumarycznie) | 40 | 68 | 26 | 47 |
| Budynki Szczęścia (sumarycznie) | 91 | 155 | 80 | 170 |
| Skarbiec AI (suma) | 5 515 | 13 755 | 11 828 | 14 286 |
| Spichlerz AI (suma) | 2 923 | 12 991 | 5 791 | 27 422 |
| Utrzymanie jednostek, pieniądz (suma) | 1 840 | 3 408 | 2 424 | 4 368 |
| Porządek, średnio PorPct | 21,3 | 41,5 | 19,5 | 39,0 |
| Miasta z PorPct < 14 % (bunt skrajny) | 63 (40%) | 7 (4%) | 81 (49%) | 0 |
| Miasta w buncie (flaga `bunt`) | 0 | 1 | 0 | 2 |
| Miasta w rebelii (`rebelState`) | 0 | 0 | 0 | 0 |
| Miasta frakcji rebeliantów (owner -99) | 0 | 0 | 0 | 0 |
| Ostrzeżenia rebelii (`revoltWarning`) | 13 | 3 | 14 | 0 |

Różnica w liczbie jednostek: −31 % (s4242) i −39 % (s7).

## Oś czasu (suma AI; trudny vs zgodnosc, seed 4242)

| Tura | Miasta | Jednostki | Porządek śr. (PorPct) | Miasta < 14 % |
|---|---|---|---|---|
| 10 | 42 / 42 | 57 / 58 | 19,5 / 51,5 | 15 / 0 |
| 20 | 48 / 60 | 79 / 91 | 35,1 / 59,5 | 5 / 0 |
| 30 | 67 / 118 | 120 / 175 | 34,8 / 50,8 | 7 / 0 |
| 40 | 116 / 163 | 182 / 283 | 26,8 / 47,7 | 23 / 0 |
| 50 | 143 / 182 | 197 / 255 | 24,5 / 43,6 | 45 / 0 |
| 60 | 159 / 190 | 187 / 273 | 21,3 / 41,5 | 63 / 7 |

Seed 7 ma ten sam kształt (t10 Porządek 21,6 vs 51,2; t60 miasta 165 vs 194, jednostki 205 vs 337).

## Przyczyny strat i produkcji (kumulatywnie, AI, tury 2–60)

| Przyczyna | s4242 trudny | s4242 zgodn. | s7 trudny | s7 zgodn. |
|---|---|---|---|---|
| Nowe jednostki (produkcja + zakup, `noweId`) | 220 | 335 | 248 | 345 |
| Rozwiązane przez AI (`rozwiazanie-ai`) | 37 | 58 | 47 | 12 |
| Zejście bez przyczyny (walka/inne) | 1 | 9 | 4 | 5 |
| Głód armii / głód oblężenie / deficyt złota | 0 | 0 | 0 | 0 |
| Eliminacja właściciela | 1 | 1 | 1 | 1 |
| Bunt miasta / przejęcie przez rebeliantów | 0 | 0 | 0 | 0 |

## Rozstrzygnięcie

1. Główna różnica jest po stronie PRODUKCJI, nie strat. Nowe jednostki: −34 % (s4242) i −28 % (s7). Straty wojskowe z przyczyn mierzalnych są zerowe (głód, deficyt) lub nieduże (walka: 1–9 na bieg). Rozwiązania przez AI idą w przeciwnych kierunkach na dwóch ziarnach (37 vs 58; 47 vs 12), więc nie tłumaczą −30 % systematycznie.
2. Rebelia nie jest przyczyną. Przez 60 tur nie wystąpiła ani jedna rebelia AI (0 miast rebeliantów, 0 miast w `rebelState`), mimo 40–49 % miast poniżej progu bunt skrajny. Brak potwierdzonej przyczyny tego zjawiska — patrz „NIE ZMIERZONO”.
3. Źródłem różnicy jest Porządek, a nie budynki. Już w turze 10, przed jakimkolwiek budynkiem Prawa lub Szczęścia (oba zero w obu wariantach), Porządek AI wynosi 19,5 (trudny) vs 51,5 (zgodn.). Ustawienie „Kultura i religia: trudny” obniża Porządek startowy o ok. 30 pkt. Ten sam kierunek widać na s7 (21,6 vs 51,2).
4. Mechanizm (z parametrów `data/society-params.json`, NIE ZMIERZONO bezpośrednio): w niepokoju (Porządek < T1) produkcja ×0,80, Pieniądz ×0,80, wzrost ×0,65 przy poziomie „hard”. Tempo produkcji i wzrostu miast spada, a z nim tempo nowych jednostek (220 vs 335) i liczba miast (159 vs 190; w t30 aż 67 vs 118). Budynki Prawa i Szczęścia są też mniejsze (40 vs 68; 91 vs 155), co jest skutkiem albo częścią tej pętli.
5. Przy tym samym poziomie trudności gry wariant „trudny” ma o 34 % (s4242) i 28 % (s7) mniej nowych jednostek (220 vs 335; 248 vs 345), co przekłada się na 31–39 % mniej jednostek na stanie w t60. Wniosek: główna przyczyna −30 % to niższy Porządek wynikający z ustawienia „Kultura i religia”, przenoszący się na produkcję i wzrost. Hipoteza wymaga potwierdzenia wariantem bez kary Porządku (NIE ZMIERZONO).

## Decyzja wymagana (DECISION_REQUIRED)

Przyczyna leży w wartościach balansu (parametry kultury i Porządku), więc nie jest błędem AI i nie wdrażam zmiany. Warianty do decyzji właściciela (jedno zdanie skutku per wariant):
- A: zostawić „Kultura i religia: trudny” jako jest — AI na poziomie maksymalnym dalej ma ok. 30–40 % mniej jednostek i ok. 15 % mniej miast niż przy zgodności, a połowa miast AI pracuje w strefie buntu skrajnego.
- B: zmienić wartości parametrów kultury lub Porządku dla „trudny” — AI zbliża się do trybu zgodności, ale zmiana dotyka wszystkich poziomów trudności i wymaga osobnego pomiaru (zmiana wartości nie należy do tego tematu).

## NIE ZMIERZONO

- Podział −30 % na udział poszczególnych mechanizmów (brak wariantu z wyłączoną karą Porządku; wymagałby osobnego haka pomiarowego, nie zmiany reguł).
- Dlaczego przy 40–49 % miast w strefie buntu skrajnego nie wystąpiła żadna rebelia (możliwe: warunek grace, ochrona garnizonem z FALI 926, czy licznik zamykany przed progiem — do sprawdzenia w osobnym temacie).
- Utracone miasta AI (kto zdobył): brak licznika per przyczyna dla AI; widoczny jest tylko bilans netto liczby miast.
- Osobne liczby zakupu i produkcji jednostek (`noweId` łączy oba).
- Ziarna inne niż 4242 i 7; poziomy „Kultura i religia” inne niż trudny i zgodność.
- Seed 4242 w wariancie zgodnym wykazuje 1 bunt w t40 i 1 bunt + 3 ostrzeżenia w t60 — pojedyncze zdarzenia, nie analizowane.

## Zmiany w kodzie (tylko odczyt, za `?civTest=1`)

- `gra/src/main.ts`: hak `__aiEconomyMeasure.cityStateTurn(prog)` (bez wpływu na grę).
- `gra/tools/ai-cult-rel-measure-run.cjs`: flaga `--city-state 1` oraz pole `cityState` w rekordzie tury.

## Bramki (surowe wyjścia)

- `tsc --noEmit`: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: PASSED 33 / FAILED 0.
- combat-test: 6/6 pass.
- ai-test: 297 passed, 0 failed.
- ai-city-order-need-wiring-test: 231 passed, 0 failed (of 231).
- ai-unit-replace-same-rules-test: 45 passed, 0 failed.
