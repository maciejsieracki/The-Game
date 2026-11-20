# Pomiar na żywo: poziomy ustawienia „Dyplomacja i wojna” (Łatwa / Normalna / Trudna)

Temat: R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1 (Operator, runda 2 — obrona)
Baza kodu: origin/main 83da0fb18; runner ze zmianą `--diplo-level` z commita e5edebb45.
Bundle: zbudowany z bieżącego main poza repo (vite, EXIT 0).
Status danych: **sześć biegów wykonanych w całości: 2 ziarna (4242, 7) × 3 poziomy, 90 tur, co 5 tur (18 wierszy na bieg, tury 5..90).**

## Warunki pomiaru

- Gracz = autopilot (`--player-ai 1`), wszystkie flagi pakietu dyplomacji ON (`--all-flags 1`), tryb szybki, bypass zasobów (złoto 200, żywność 200).
- Poziom ustawiany prawdziwą ścieżką nowej gry: `window.__settingsLive.startNewGame(params)` z `advanced.diplomacyWarLevel`. Potwierdzenie odczytem `__settingsLive.getSettings().diplomacyWarLevel` po starcie (runner kończy się błędem, gdy odczyt nie zgadza się z żądanym poziomem). Pole `diploLevel` jest w każdym wierszu jsonl; w każdym z sześciu plików odczytano wyłącznie żądany poziom.
- Wartości w pamięci nie są omijane — jedyna ścieżka to ustawienie nowej gry.

## Tabela: tury 30 / 60 / 90

Kolumny: **wojny** = pary w statusie „wojna” (łącznie, także z graczem); **AI↔AI** = z tego pary AI-AI w wojnie; **epoki** = wojny z typem „epoki” (z tych wojen); **sojusze AI↔AI** = pary AI-AI w statusie sojusz w danej turze; **zerwania zero-zaufania** = licznik kumulatywny od startu; **współbieżne max** = kumulatywne maksimum liczby równoległych wojen; **mediana zaufania sąsiadów** = mediana `zaufanie` po parach z flagą sąsiedztwa.

| Ziarno | Poziom | Tura | wojny | AI↔AI | epoki | sojusze AI↔AI | zerwania zero-zaufania (kum.) | współbieżne max (kum.) | mediana zaufania sąsiadów |
|---|---|---|---|---|---|---|---|---|---|
| 4242 | Łatwa | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 37,9 |
| 4242 | Łatwa | 60 | 4 | 3 | 0 | 1 | 6 | 1 | 0 |
| 4242 | Łatwa | 90 | 5 | 3 | 2 | 12 | 22 | 3 | 30,6 |
| 4242 | Normalna | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 15,5 |
| 4242 | Normalna | 60 | 4 | 3 | 1 | 0 | 20 | 1 | 0 |
| 4242 | Normalna | 90 | 3 | 3 | 0 | 0 | 38 | 1 | 3,7 |
| 4242 | Trudna | 30 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| 4242 | Trudna | 60 | 7 | 5 | 1 | 0 | 38 | 2 | 0 |
| 4242 | Trudna | 90 | 3 | 3 | 0 | 0 | 104 | 1 | 0 |
| 7 | Łatwa | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 24,1 |
| 7 | Łatwa | 60 | 2 | 1 | 1 | 2 | 0 | 2 | 0 |
| 7 | Łatwa | 90 | 3 | 3 | 0 | 11 | 2 | 2 | 11,3 |
| 7 | Normalna | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 20,5 |
| 7 | Normalna | 60 | 4 | 3 | 1 | 2 | 6 | 2 | 0 |
| 7 | Normalna | 90 | 3 | 3 | 0 | 7 | 22 | 2 | 0 |
| 7 | Trudna | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 17,0 |
| 7 | Trudna | 60 | 5 | 4 | 1 | 0 | 12 | 1 | 0 |
| 7 | Trudna | 90 | 5 | 5 | 0 | 2 | 22 | 2 | 0 |

Szczyty po wszystkich wierszach (co 5 tur, tury 5..90):

| Ziarno | Łatwa: sojusze AI↔AI / wojny | Normalna: sojusze AI↔AI / wojny | Trudna: sojusze AI↔AI / wojny |
|---|---|---|---|
| 4242 | 12 / 8 | 0 / 6 | 0 / 7 |
| 7 | 11 / 3 | 7 / 5 | 2 / 5 |

Wyeliminowane cywilizacje: 0 we wszystkich sześciu biegach (liczba właścicieli stała na 14).

## Komendy powtórzenia

Z katalogu `gra/`, bundle poza repo (`--dist`), jedna przeglądarka naraz, polecenia pojedyncze < 590 s:

```
export CHROME_PATH=/usr/bin/google-chrome MEASURE_CHROME_ARGS="--mute-audio"
node tools/diplomacy-harder-measure-run.cjs --dist <abs-dist> --out <abs-out> --profile <abs-profil> \
  --seed <4242|7> --turns 90 --every 5 --all-flags 1 --player-ai 1 \
  --diplo-level <latwa|normalna|trudna> --stop-at <30|60|90>
```

Wznowienie: to samo polecenie z tym samym `--out` i `--profile` (wczytuje slot `dipl-measure-<TAG>`). Przy awarii Chromium (patrz niżej) ponawiano odcinek od ostatniego slotu; odcinki zapisywano co 5 tur.

## Stabilność przeglądarki (NIE ZMIERZONO przyczyny)

Chromium kończył się sygnałem SIGSEGV w trakcie startu nowej gry lub wczytania slotu (`page.waitForFunction: Target page, context or browser has been closed`). Liczba komunikatów BLAD w logach: 6–15 na bieg. Obejście: `MEASURE_CHROME_ARGS="--mute-audio"` (bez `--disable-gpu`, który w tych warunkach również padał), ponawianie odcinka ze slotu. Wszystkie sześć biegów doszło do tury 90; wiersze jsonl są bez duplikatów (18 tur na bieg, 5..90).

## Surowe dane

Skompresowane wiersze jsonl (jeden wiersz na wybraną turę):
`dyspozycje/autobot/runs/R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1/seed<S>-all1-lvl-<poziom>.jsonl.gz` (6 plików).

## WNIOSEK (po polsku, bez progów decyzyjnych)

1. **Poziomy realnie różnicują dynamikę dyplomacji.** Różnica jest widoczna w obu ziarnach, choć zbiór ziaren jest mały (2 biegi na poziom).
2. **Sojusze AI↔AI:** na Łatwej powstają najwięcej (szczyt 12 i 11 par), na Normalnej mniej (0 i 7), na Trudnej najmniej (0 i 2). Na Trudnej sojusze AI↔AI **powstają**, ale tylko w biegu ziarna 7 (2 pary w turze 90); w biegu ziarna 4242 na Trudnej nie powstał żaden sojusz AI↔AI w żadnym z pomiarów co 5 tur.
3. **Zerwania zero-zaufania** (kumulatywnie w turze 90): Trudna 104 i 22, Normalna 38 i 22, Łatwa 22 i 2 (ziarno 4242 / ziarno 7). Kierunek jest zgodny z poziomem w obu ziarnach, lecz w ziarnie 7 Normalna i Trudna dają tę samą wartość.
4. **Liczba wojen:** nie ma jednoznacznego kierunku. W turze 60 Trudna ma najwięcej wojen (7 i 5 wobec 4 i 4 na Normalnej oraz 4 i 2 na Łatwej), w turze 90 wartości są zbliżone (3 i 5 na Trudnej, 5 i 3 na Łatwej). Wojny epoki w turze 60: po 1 w pięciu z sześciu biegów (wyjątek: Łatwa, ziarno 4242 — 0); nie ma w tym wyraźnego wzorca poziomu.
5. **Zaufanie sąsiadów:** mediana spada do 0 po turze 30 w większości biegów; nie wyróżnia poziomu w sposób stabilny.

Czy na Trudnej powstają sojusze AI↔AI (pytanie właściciela z KOLEJKI): **tak, w jednym z dwóch ziaren (7: 2 pary w turze 90)**; w drugim ziarnie nie powstały.

## NIE ZMIERZONO

- Pomiar działa z dwoma ziarnami i jednym biegiem na poziom; nie ma przedziałów niepewności ani testu istotności. Wyniki traktować jako obraz kierunkowy.
- Próbkowanie co 5 tur: zdarzenia krótsze niż 5 tur (np. krótkie sojusze) mogły zostać pominięte; szczyty z tabeli są szczytami próbkowanymi, nie ciągłymi.
- Porównanie R/C (ciągły bieg vs. wznowiony) z `diplomacy-measure-resume-test.cjs --run 1`: część P (pin tekstowy, 8/8 zielonych) wykonana; część R i C **NIE ZMIERZONO** — dwie próby uruchomienia testu zakończyły się awarią Chromium przy pierwszym, świeżym biegu runnera. Wznowienie w prawdziwych biegach dało jednak wiersze bez duplikatów (18 tur na bieg).
- Brak pomiaru pieniędzy, badań, wojen epoki na poziomie gracza i wpływu na wynik gry.
- Wpływ poziomów na gracza-człowieka (nie autopilot) NIE ZMIERZONO.
