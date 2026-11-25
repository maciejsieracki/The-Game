# POMIAR: limit wojen, limit sojuszy, FORTRING, FLEEMANUAL (2026-11-25)

Temat: R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1 (runda 1/5, Operator HAIKU 5.5).
Baza: origin/main 35f601ae304471593c4921a61bfecbddbb9de14a. Zero zmian w `gra/src` i `gra/data`.
Pomiar na żywej grze (Chromium `/usr/bin/google-chrome`, bundle vite zbudowany poza repo).

## Tabela wyników

| Funkcja | Co zmierzono | Wynik liczbowy | Werdykt |
|---|---|---|---|
| (a) Limit wojen (1 epoki + 1 naturalna per cywilizacja) | Seed 4242, flagi `limitWojen`=ON (`--all-flags 1`), tury 2–67; maks. jednoczesnych wojen per cywilizacja AI | Epoki: maks. 1. Naturalne: maks. **2** u AI 28 w turach 60–67 (8 tur naruszenia, 0 naruszeń w turach 2–59). Wojny gracza (owner 0): epoki maks. 1, naturalne maks. 0 | **NIE DZIAŁA w tym biegu** (naruszenie limitu u AI, patrz niżej). Przyczyna nieustalona. |
| (a') To samo, kontrola OFF | Seed 4242, `--all-flags 0`, tury 2–67 | Epoki AI maks. 1, naturalne AI maks. 1, gracz naturalne maks. 1; brak naruszeń | Kontrola: brak naruszenia (bez flagi limit nie działa, więc nie jest to dowód skuteczności) |
| (b) Limit 2 sojuszy AI↔AI | Seed 4242, `sojuszTor`=ON, tury 2–67 | Maks. sojuszy per AI: **2** (pierwszy sojusz w turze 42). 0 naruszeń w 66 turach. Sojusze z graczem: 0 | **DZIAŁA w tym biegu** (jeden seed, 66 tur; limit 2 osiągnięty i nieprzekroczony; seed 7 niezmierzony) |
| (b') Kontrola OFF | Seed 4242, `--all-flags 0` | 0 sojuszy w turach 2–67 | Kontrola (brak sojuszy przy OFF) |
| (c) FORTRING (wydajność tury z/bez pierścienia, round-trip zapisu) | Nie uruchomiono scenariusza | brak | **NIE ZMIERZONO**: w tej rundzie nie napisano hooka przełączania pierścienia fortów ani runnera wydajności. Round-trip zapisu nie dał się zmierzyć: wznowienie slotu w `diplomacy-harder-measure-run.cjs` kończy się SIGSEGV Chromium (patrz „Harness”). |
| (d) FLEEMANUAL (odwrót ręczny, limit ruchu, animacja na mapie) | Nie uruchomiono scenariusza | brak | **NIE ZMIERZONO**: brak runnera scenariusza bitwy/odwrotu; nie wykonano w tej rundzie. |

## Metoda (a) i (b)

- Runner: `gra/tools/diplomacy-harder-measure-run.cjs --all-flags 1|0 --seed 4242 --turns 67` (bez `--stop-at`), gracz = autopilot AI (domyślnie). Flagi ustawiane hakiem `__diploAllFlagsMeasure.setAll` przed pierwszym endTurn; odczyt `flagi` w każdym wierszu potwierdza stan (ON: `limitWojen`, `sojuszTor`, `koalicja`, `zeroZaufania`, `wojnaSilaSojuszu`, `harder` = true; OFF: wszystkie false).
- Analizator: `gra/tools/limits-measure.cjs` (nowy, tylko odczyt JSONL). Liczy per cywilizacja pozycje `wojna` (typ `epoki`/`naturalna`) i `sojusz` w każdej turze. Wiersze zawierają wszystkie pary inne niż `neutralni` oraz sąsiadów, więc wojny i sojusze są kompletne.
- Dane surowe (poza repo): `<scratchpad>/runB1/seed4242-all1.jsonl` (ON, 66 wierszy), `<scratchpad>/runB0/seed4242-all0.jsonl` (OFF, 66 wierszy).

## Szczegóły naruszenia (a), ON

- Tura 59: AI 28 nie ma żadnej wojny; wojny to: gracz↔25 `epoki` oraz 16↔19 `naturalna`.
- Tura 60: AI 28 ma dwie wojny `naturalna`: **1↔28** i **22↔28** (limit 1). Pozostałe w t60: gracz↔25 `epoki`, 16↔19 `naturalna`.
- Tury 61–67: nadal pary 1↔28 i 22↔28 (t67: 1↔28, 7↔37, 22↔28); naruszenie u AI 28 utrzymuje się.
- Pary ze statusem `wojna` są w danych wiersza z polami `typWojny`, `sasiad`, `aiAi`. Nie ma w danych pola „kto wypowiedział”, więc nie da się stwierdzić z wiersza, która strona deklarowała wojnę 22↔28.

Kod: `warLimitAllowsDeclaration` (main.ts ~26077) sprawdza limit po obu stronach (`warLimitAllows`, `diplomacy-war-limit.ts` ~113), więc zwykła deklaracja AI przeciw AI 28 przy 1 wojnie naturalnej powinna być odrzucona. Ścieżki bez tej bramki, które warto zbadać w R-WEB-*: `ownerDeclareWarOn(..., force = true)` (main.ts ~14318; `!force` pomija limit), oraz przyłączanie do wojny przez sojusz (`mustDeclareWarOn`, main.ts ~26237, sprawdzana tylko strona sojusznika). Nie zweryfikowano, która ścieżka wygenerowała parę 22↔28. Nie naprawiano gry.

Kandydat na minimalne odtworzenie: seed 4242, `--all-flags 1`, do tury 60; w wierszu tury 60 para 22↔28 `naturalna` przy obecnej 1↔28 `naturalna`.

Reguła obowiązująca (nagłówek `gra/src/game/diplomacy-war-limit.ts`, Reguła wojen C, ABC 2026-11-18): „maks. 1 wojna epoki + 1 wojna naturalna naraz per cywilizacja”.

## Harness (ważne dla wznawialności)

- Bieg ON do tury 10 w jednym wywołaniu, potem `--stop-at 90` z tym samym `--out` i `--profile`: wznowienie działało raz (tury 10→59), kolejne dwa wznowienia kończyły się `SIGSEGV_MAPERR` Chromium przed pierwszą turą (log: `[pid=…][err] Received signal 11`). To jest znany problem harnessu (`#90`, „crash Chromium przy wznowieniu zapisu”).
- Wskutek tego bieg 90-turowy nie został zrealizowany: fresh bieg (jedno wywołanie, limit 588 s) osiągnął turę 67 (ON), a OFF do tury 67 (508 s).
- Limit pojedynczego polecenia (590 s) nie pozwala na 90 tur bez wznowienia.

## Bramki (kod gry bez zmian)

Wynik z surowego wyjścia (`gra/`, node/tsc z worktree na 35f601ae3):

- `npx tsc --noEmit`: exit 0
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs`: `20 pass, 0 fail`
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`
- `node tools/ai-test.cjs`: `ai-test: 297 passed, 0 failed`

## Nie zrobione (jawnie)

- Seed 7 (wymagane „seed 4242 i 7 gdzie dotyczy”): NIE ZMIERZONO, brak czasu w tej rundzie.
- 90 tur: osiągnięto 67 (ON i OFF) z powodu limitu polecenia i crashu wznowienia.
- (c) FORTRING i (d) FLEEMANUAL: brak runnerów scenariuszy (patrz tabela).
- Round-trip zapisu (c): NIE ZMIERZONO (SIGSEGV harnessu).
