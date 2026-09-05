# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Operator, runda 4

STATUS: PASS
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
MODEL+EFFORT: Opus 5, effort high.
GOAL: Domknąć werdykt 1 Final Control — fallback `SZ_MAX_POP_WSP_DEFAULT` zrównany
z danymi (0,04) ORAZ asercja `normalizacja:249` przestaje być tautologią. Zero zmian balansu.
BAZA: `ed6b73e2`, drzewo czyste przed pracą (`git status --short` puste).

## ZMIANY/COMMIT

Dwa pliki allowlisty, nic więcej (`git diff --stat`: 24 ins / 3 del):

1. `gra/src/game/society-breakdown.ts:252` — `SZ_MAX_POP_WSP_DEFAULT` **0.048 → 0.04**
   plus blok komentarza dokumentujący ratyfikację R4 (skąd rozjazd, dlaczego to nie balans,
   która bramka tego pilnuje) — konwencja 1:1 z R3-C przy `SZMAX_BY_ERA_DEFAULT`.
2. `gra/tools/szczescie-skala-normalizacja-test.cjs` — tautologia zastąpiona wiązaniem
   kod↔dane. Było: `eq(bezWsp.szMaxPopWsp, M.FALLBACK_SOCIETY_SCALE.szMaxPopWsp)` — obie
   strony z tego samego modułu. Jest: `eq(bezWsp.szMaxPopWsp, wspNormalJSON)`, gdzie
   `wspNormalJSON` to `szczescie_max_pop_wspolczynnik.normal` wczytane z
   `gra/data/society-params.json`. Jedna asercja pomocnicza pilnuje, że ten wiersz w JSON
   **istnieje** — bez niej usunięcie wiersza przywróciłoby tautologię (obie strony spadłyby
   na ten sam fallback; to jest resztkowa luka wzorca R3-C, tu domknięta).

Nadal sprawdzana jest ta sama właściwość co przed zmianą: fallback ISTNIEJE i jest brany,
gdy wiersza brak. Zmienił się wyłącznie drugi operand porównania.

## TESTY

**Kryterium 1** — `SZ_MAX_POP_WSP_DEFAULT` = 0,04. `grep 0.048` w `gra/src/game/`: **zero**;
w całym `gra/src/` poza `render/`: **zero**. W `gra/src/render/` trafienia zostają — to
literały geometrii 3D modeli jednostek, bez związku ze Szczęściem (nie ruszałem).

**Kryterium 2 — powtórzenie mutacji FC-M10 (rdzeń rundy).** Fallback podmieniony na `0.5`:

| bramka | pod FC-M10 przed R4 (pomiar FC) | pod FC-M10 po R4 |
|---|---|---|
| **szczescie-skala-normalizacja** | ZIELONA 146/0 | **CZERWONA 146 OK, 1 FAIL** |
| szczescie-przebudowa-skali | ZIELONA | zielona 519/0 |
| szczescie-zamoznosc | ZIELONA | zielona 88/0 |
| society-breakdown | ZIELONA | zielona 53/0 |
| happiness-breakdown | ZIELONA | zielona 38/38 |
| porzadek-panel-czytelnosc | ZIELONA | zielona 81/0 |

**Liczba faili: 1**, i jest to dokładnie nowa asercja R4:
`got 0.5 expected 0.04`. Pozostałych pięć bramek zostaje zielonych i **tak ma być** —
wszystkie podają `society` jawnie, więc fallback nie leży na ich ścieżce; to jest właśnie
powód, dla którego FC-M10 był niewidzialny. Strażnikiem jest bramka normalizacji i ona
teraz czerwienieje.

**Kryterium 3 — mutacja od strony DANYCH.** `szczescie_max_pop_wspolczynnik.normal`
0,04 → 0,05: normalizacja **141 OK, 6 FAIL**, a wśród nich ta sama asercja R4
(`got 0.04 expected 0.05`). Wiąże obie strony, nie jedną. Pozostałe 5 faili to istniejące
asercje R3-A i tabela mnożnika 1,48× — spodziewane przy zmianie liczby właściciela.

Obie mutacje cofnięte **kopią pliku** (`cp` z backupu w scratchpadzie), nigdy
`git checkout`. Po każdym cofnięciu `git status --short` pokazuje wyłącznie dwa pliki
allowlisty, a `git diff --quiet -- gra/data/society-params.json` jest czysty.

**Kryterium 4** — liczba asercji normalizacji **146 → 147**. Nie spadła.

**Kryterium 5** — `node ./node_modules/typescript/bin/tsc --noEmit`: **zielony** (exit 0).
Rodzina Szczęścia/Porządku, 16 bramek, wszystkie zielone, liczby identyczne z pomiarem
Final Control poza podniesioną normalizacją: building-happiness 14 · citizen-resource-upkeep
109 · culture-religion 65 · happiness-breakdown 38 · porzadek-panel 81 · r-wzrost 59 ·
society-breakdown 53 · przebudowa-skali 519 · **normalizacja 147** · zamożność 88 ·
war-parity 21 · wealth 36 · religia-panel 15 · orderstate-restore 9 · ai-dług-porządki 17 ·
upkeep 73. Referencyjne: logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace
13/13 · combat OK. Znane czerwone spoza rodziny bez zmian wobec `origin/main`:
`border-march-wygasanie` 22/4, `unit-resource-upkeep` 3/4.

`git diff --check` czysty. Żadnego `git add -A`; dodawane jawne ścieżki.
Nie uruchamiałem `npm run build`/`dev` (C-001).

## BLOKADY

Brak. Jedna obserwacja poza allowlistą, **nie ruszona**: `PRAW_MAX_POP_WSP_DEFAULT = 0.041`
sprawdzone wobec danych — `prawo_max_pop_wspolczynnik.normal` = 0,041. **Zgodne**, nie ma
drugiego rozjazdu do domknięcia. Prawo per trudność (0,033/0,041/0,049) nie było przedmiotem
R3-A i nie tykam go.

## RUNDY

4/5.

## NASTĘPNY KROK

Evaluator rundy 4 — w szczególności niezależne powtórzenie obu mutacji.

DEPLOY/PUSH: NIE WYKONANO
