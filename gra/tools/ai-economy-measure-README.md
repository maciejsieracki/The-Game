# Harness pomiaru ekonomii AI (R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1, runda 2 obrony)

Pomiar tylko do odczytu. Hak `window.__aiEconomyMeasure` istnieje wyłącznie przy `?civTest=1`
(gra/src/main.ts, blok `__nnsMeasureDebug`). Gra bez tego parametru nie zmienia się (kontrola negatywna
w `ai-economy-measure-hook-test.cjs`).

## Stan (r2) w jednym miejscu

| Kryterium | Stan | Dowód |
|---|---|---|
| (a) test haka: kształt, kontrola negatywna, mutacja | ZIELONE, z jedną CZERWONĄ asercją wartości AI | `runs/.../evidence/r2-hook-test.log` (8/9) |
| (a) wartość: AI owner ma miasto i jednostkę | **CZERWONE**: AI 1..6 mają 0 miast i 0 jednostek przez 12 tur (i przez 100 tur w przebiegach) | `r2-seed4242-100t.jsonl`, `r2-seed777-100t.jsonl` |
| (b) 100 tur × 2 ziarna | ZMIERZONE: tura końcowa 100 na obu ziarnach; bramka NNS aktywna 1 raz (tura 1), dosypki 1 raz | tabela poniżej |
| (c) wznowienie | CZERWONE: `allEqual=false`, 0/10 porównań zgodnych (przyczyna wg diagnozy r1: SAVE-LOAD, poza tym tematem) | `r2-resume-test-seed4242-summary.json` |
| (c) mutacja wznowienia | NIE ZMIERZONO (dispatch: dopiero przy zielonej bazie) | — |
| (d) tsc, 5 bramek referencyjnych, `resource-ledger-hook-gate-test` | ZMIERZONE, wszystkie zielone | sekcja „Bramki” w raporcie 30-obrona |
| #415 instrukcja jednego polecenia ON/OFF | NIE DODANA (flaga nie istnieje w main; patrz niżej) | — |

## Tabela przebiegów (r2, runner `--start newgame`, `--every 10`, `--bypass 1`)

| Ziarno | Tura końcowa | Tury z aktywną bramką NNS (przed endTurn) | Dosypki (tury) | Czas |
|---|---|---|---|---|
| 4242 | 100 | 1 (tura 1) | 1 | 69 s |
| 777 | 100 | 1 (tura 1) | 1 | 73 s |

Wiersze JSONL: 99 na ziarno (tura 2..100; tura 1 nie ma wiersza, bo stan startowy nie jest mierzony).

## Jedno polecenie (przebieg 100 tur, wznawialny)

Bundle buduje się poza repo (`vite build --outDir <abs-dist>`), potem z katalogu `gra/`:

    node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 100 --every 10

- Start: prawdziwa nowa gra (`__nnsMeasureDebug.startGame`), potem `foundFirstCity` (jak w runnerze `fresh`).
  Bramka „Zakończ turę” blokuje dopiero po założeniu miasta gracza (zweryfikowane w r2: tura 1, canEnd=false
  po założeniu miasta; po dosypce 200/200 canEnd=true i tura przechodzi 1 -> 2).
- Wynik: `<out>/seed4242.jsonl` (wiersz na turę: metryki każdego właściciela, `diag`, bramka przed endTurn,
  dosypki, automatyczne bitwy), `<out>/seed4242.state.json`, `<out>/seed4242.summary.json`.
- Zapis co `--every` tur (quickSave przez realną ścieżkę gry) w trwałym profilu. Ponowne wywołanie z tym samym
  `--out` i `--profile` wznawia od zapisanej tury. Limit Bash 590 s; 100 tur ≈ 70 s.
- Bramka NNS gracza: przed endTurn, jeśli `nnsGateBlocked()`, runner dosypuje `--gold` / `--food` (domyślnie
  200/200) przez `grantPlayerGold/grantPlayerFood` i zapisuje to w wierszu. `--bypass 0` wyłącza dosypki
  (przebieg zatrzymuje się z powodem `gate-blocked`). Harness nie ukrywa blokady AI.

## Metryki na właściciela (kolumny JSONL)

skarbiec, spichlerz (zapas państwa), jednostkiWojskowe, jednostkiCywilne, rekruci, sumaLudkow,
glodWojska / glodWojskaAtrycja (flagi), **glodKaraStatProc** (% kary statystyk bojowych = (1 − glodWojskaStatMult)·100,
0 gdy brak głodu), **glodAtrycjaHpProc** (% maxHP tracony na turę = glodWojskaHpFrac·100, 0 gdy brak atrycji),
deficytZlota, miasta, obywatele, utrzymanieBudynkowPieniadz / Surowce, utrzymanieGarnizonuPieniadz,
**utrzymanieJednostekPieniadz** (totalUnitUpkeep po jednostkach wojskowych), **utrzymanieJednostekSurowce**
(totalUnitResourceUpkeep po jednostkach wojskowych).
Pola `przychodNaTure` i `utratyNaTure` NIE są mierzone (lista `niezmierzone`) — brak zweryfikowanego źródła.

## Test wznowienia (kryterium c) — CZERWONY

    node tools/ai-economy-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-wyniki> --seed 4242 --turns 50 --save-at 40 --resume-test 1

Stan obecny: `allEqual = false`, `compared = 10`, zgodnych 0. Diagnoza z r1 (NIE ponownie zmierzona w r2):
po wczytaniu zapisu `ensureCityPodzialDefaults` (gra/src/game/cities.ts, ok. l. 707-720) dopisuje miastu domyślne
`podzialPracy`, a żywe miasto bez pola korzysta z globalnego podziału. Błąd jest po stronie gry (SAVE-LOAD),
poza allowlistą tego tematu. Harness nie obchodzi tego, nie zmienia danych gry.

## Test haka (kryterium a)

    node tools/ai-economy-measure-hook-test.cjs --dist <abs-dist> [--mutant-dist <abs-zepsuty-dist>]

- Start: nowa gra + `foundFirstCity`. Asercje: kształt metryk (7 właścicieli, komplet pól i typów); bramka NNS
  blokuje w turze 1; dosypka 0/0 NIE odblokowuje (kontrola negatywna); dosypka 200/200 odblokowuje i endTurn
  przechodzi turę; kontrola negatywna bez `?civTest=1`.
- **Wartość AI: CZERWONA.** Każdy AI owner z `aiStartHexes` powinien mieć co najmniej jedno miasto i jednostkę
  po kilku turach. Tak nie jest (diagnoza niżej). Asercja jest celowo czerwona, nie została osłabiona.
- `--mutant-dist` = bundle z celowo przemianowanym polem (`glodKaraStatProc`); test MUSI zgłosić błąd kształtu
  (potwierdzone w r2: „owner 0 bez glodKaraStatProc”).

## Dlaczego AI nie ma miast w tym harnessie (diagnoza r2, NIE rozstrzygnięta do końca)

- Ścieżka `?playtest=mapa&civTest=1` NIE jest lekiem: w 11 turach z endTurn AI nadal 0 miast i 0 jednostek
  (powtórzone dwukrotnie). Obserwacja z oceny Evaluatora („miasto AI po turze 8”) pochodziła z szybkiego wywołania endTurn
  bez czekania na zmianę tury, przy którym licznik tury skoczył z 8 na 1 (stan niespójny); przy czekaniu na
  zmianę tury (11 tur) AI nadal ma 0 miast — nie uznaję tego za wynik.
- Tura startowa w nowej grze jest zablokowana bramką NNS gracza (nie AI) — to jest przyczyna wcześniejszego
  „stoi na turze 1”; dosypka ją odblokowuje (patrz wyżej).
- `setTaxSplit` NIE istnieje w tym bundlu (sprawdzone: `typeof … === 'function'` → `undefined`); wcześniejsze
  próby z `setTaxSplit(60,30,10)` były bezskuteczne.
- Stan AI w `diag`: `aiStartHexes`=6, `pendingForeignSpawnCities`=0, `citiesAll`=1, `ownersOfCities`=[0],
  `ownersBezMiastIJednostek`=[1..6]. Źródło defektu: start gry poza allowlistą tego tematu
  (gra/src/main.ts, `spawnPendingForeignClusters` / `applyClusterStartPlan`). Kandydat do osobnego tematu GAME;
  reprodukcja: `node` probe w raporcie 30-obrona (scenariusz 15 tur, `ownersBezMiastIJednostek` niepuste).

## Ograniczenia (jawnie)

- Wynik „AI=0” oznacza, że w tym przebiegu AI nie gra ekonomii — pomiar obejmuje wyłącznie gracza.
  Nie wolno go używać jako dowodu ekonomii AI, dopóki kryterium wartości AI nie jest zielone.
- Gracz w obu przebiegach ma 1 miasto i 7 obywateli po 100 turach (obserwacja, NIE zbadana w tym temacie).
- #415 (flaga bramki utrzymania armii AI): instrukcji jednego polecenia NIE dodano. Kod bramki jest tylko w
  `refs/keep/R-WEB-AI-UPKEEP-Q2-*`, którego baza to starsza historia (diff obejmuje setki zmian poza bramką),
  więc wprowadzenie flagi do main to osobny temat. Bez tego pomiar ON/OFF nie jest możliwy.
- Bramka NNS gracza wystąpiła tylko w turze 1 obu przebiegów; mechanizm dosypek jest zmierzony w teście haka,
  nie w długim przebiegu.
