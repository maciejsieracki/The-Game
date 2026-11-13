STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), pamięć renderu
TEMAT: R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1
GOAL: (A) wspólne materiały z obrazem identycznym piksel w piksel; (B) prototyp scalenia statycznych części jednostek
z rzetelnym pomiarem do decyzji właściciela.

RUNDA 2: obrona wobec FAIL Evaluatora (Z1–Z3). Stan odtworzony z `a1bc877a5` (branch
`autobot/R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1-op-r2`, baza `ca289d8ce`). Kod gry `gra/src/**` w r2: BEZ ZMIAN.

## Z1: PRZYJMUJĘ
Log `gate-memory-static-unit-merge-prototype.txt` z r1 pochodził ze starszej wersji narzędzia (scalenie 59,19 MB,
10 824 meshy). Wygenerowałem go ponownie z bieżącego narzędzia, 2 przebiegi, każdy z `EXIT=0`:
`geoMatMerge` 21,41 MB, meshe 62,6 → 14,8 na żeton, draw calls 11 106 → 2 720, piksele 52/101/5 z 1,6 mln, picking 170/170.

## Z2: PRZYJMUJĘ (z doprecyzowaniem przyczyny)
- Liczba −18,2 MB z r1 nie jest powtarzalna, więc ją wycofuję.
- Liczba Evaluatora (−9,05 MB) też nie jest stała.
- Przyczyna: stary pomiar był bimodalny. Mierzył tryby po kolei w jednym procesie, z równoległym GC.
  - W tym samym kontenerze `mat` wychodziło 51,06 / 51,06 / 60,26 / 60,26 / 51,07 / 51,07 MB.
  - Różnica między trybami to skok ok. 9,2 MB.
  - Świeży proces bez flagi dawał w trybie `geo` 57,82 albo 67,01 MB, mniej więcej po połowie.
- Poprawka w `gra/tools/memory-static-unit-merge-prototype.cjs`:
  - każdy tryb mierzony jest w osobnym procesie Node z `--single-threaded-gc`;
  - przed pomiarem jest przebieg rozgrzewkowy;
  - 5 powtórzeń w zmiennej kolejności, wynikiem jest mediana.
  - Stara metoda zostaje w wyniku jako `sequentialInProcess`, tylko do porównania.
- Wyniki (2 przebiegi × 5 powtórzeń, rozrzut ≤ 0,02 MB dla geo/mat, ≤ 0,6 MB dla merge):

| tryb | sterta Node, 475 żetonów |
|---|---|
| geo (pula geometrii) | 67,01 MB |
| geo + materiały (A) | 60,19 MB → **(A) −6,8 MB** |
| geo + mat + scalenie (B) | 21,41 MB → **(B) −38,8 MB ponad (A)**, −45,6 MB razem |

- Poprawione: `memory-attribution.md` i `01-operator-r1.md` (oznaczone „KOREKTA r2”).
- Do pytania ABC o (B) obowiązuje: **~39 MB sterty Node przy 475 żetonach**, ~4× mniej draw calls, koszt do 101 px
  z 1,6 mln oraz zmiana `SmallPartLod`.
- MB w grze (A): −8,4 MB w t.1 i −5,9 MB w t.50, po jednym przebiegu. Nie zmieniłem ich, bo pomiar w grze to inne
  narzędzie i nie jest objęty Z2. Surowe dane są w `raw-*.jsonl`. Raport r1 nie nazwał narzędzia; format zapisu
  (`ev:start/world-ready/snap`) odpowiada `gra/tools/memory-growth-rootcause-q1-measure.cjs`. To ZAŁOŻENIE, nie sprawdziłem go.

## Z3: PRZYJMUJĘ
Uruchomiłem wszystkie 84 narzędzia `gra/tools/*render*`, log `gate-render-all.txt` z `EXIT=0`.
- Wersja POST to `a1bc877a5`.
- Narzędzia FAIL powtórzyłem na BASE: pliki `gra/src/render/*` przywrócone z `ca289d8ce` na czas przebiegu, potem
  z powrotem HEAD.

| wynik | liczba |
|---|---|
| PASS | 55 |
| ten sam FAIL co na BASE | 22 |
| niestabilne, w powtórce POST `EXIT=0` | 2 |
| przebiegi z r1 | 5 |
| **regresje** | **0** |

- Niestabilne: `sidepanel-diplo-dismiss` (35/0) i `render-unit-sharpness-measure`.
  - W `render-unit-sharpness-measure` wartości ostrości POST są równe BASE we wszystkich 48 konfiguracjach.
- `zelazo-zrzuty-25 --no-shots`: 59/0.
- Wszystkie `zelazo-*`, czyli modele jednostek: POST = BASE.
- Bez argumentów nic nie testują (uzasadnienie w logu): `siege-surrender-forecast-live` (wymaga `--dist`),
  `hud-topbar-bigger-numbers` (wymaga pliku w `gra/src`), `river-render-diag` (diagnostyka).
- Narzędzia nadpisują zrzuty innych runów i zostawiają śmieci w `gra/`. Wszystko przywróciłem albo usunąłem;
  `git status` pokazuje tylko pliki tematu.

## ZMIANY-COMMIT
- r2: `gra/tools/memory-static-unit-merge-prototype.cjs` (pomiar izolowany), `gate-memory-static-unit-merge-prototype.txt`,
  `gate-render-all.txt`, `memory-attribution.md`, `01-operator-r1.md` (korekty), ten plik. SHA w odpowiedzi Operatora.
- Bez zmian: `gra/src/**`, `main.ts`, `gra/data/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `battle/**`, `vite.config.ts`.

## TESTY r2
- `memory-static-unit-merge-prototype` ×2: EXIT=0, liczby jak wyżej.
- `*render*`: 84/84 rozliczone, 0 regresji.
- Pozostałe bramki z r1 (pula pikseli 7/0, model-pool 6/0, visual-parity `any=0`, tsc, logic 213/213, ai-test 274/20,
  war-allin): kod gry się nie zmienił, więc wyniki z r1 są aktualne.

NIE_ZMIERZONO:
- Powtarzalność MB w grze przed-vs-przed.
- Ponowny pomiar t.1/t.50 (ponad 10 min na przebieg).

BLOKADY: brak dla (A). (B) czeka na decyzję właściciela (ABC zadaje orkiestrator), z liczbami z r2.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (runda 2), potem Final Control.
DEPLOY-PUSH: NIE WYKONANO
