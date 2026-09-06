# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Operator, Obrona rundy 2/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po
BuildingDef.grupa, zero zaszytych id budynków jako źródła kandydatów. Odpowiedź na 4 zarzuty
Evaluatora rundy 2.

Guard: HEAD startowy `ad05adbd` (Evaluator, runda 2/5), potomek `f9294ac0` (Operator runda 2),
potomek `6a40594b` (ratyfikacja). Drzewo czyste na starcie. Wszystkie mutacje weryfikacyjne
(bisekcja stałych) cofane KOPIĄ pliku z backupu, nigdy `git checkout`, zweryfikowane `git diff`
po każdej — poza jednym wyjątkiem: `docs/decyzje/AI-BALANS-STEP2-SMOKE.md` (poza allowlistą,
regenerowany jako efekt uboczny uruchomienia `ai-balans-step2-smoke.cjs`) cofnięty `git checkout --`
natychmiast po wykryciu w `git status`.

## Zarzut 1 — PRZYJMUJĘ (poprawka z dowodem)

Potwierdzone niezależnie: `almostAllBuilt` (39/42, brak tylko mury/fort/baszta) sprawia, że mury
są JEDYNYM afordowalnym kandydatem niezależnie od bonusu — zmierzone przez podstawienie
`AI_MAJOR_SPICHLERZ_PRIORITY_BONUS=0`-analogiczny eksperyment na progach zagrożenia/granicy nie
był nawet potrzebny, sama struktura `almostAllBuilt` to gwarantuje (kandydatów budynkowych zostaje
dokładnie 3, wszystkie w tej samej grupie, każdy dostaje ten sam bonus warunkowy — który więc nie
różnicuje wyboru). Poprawka: dodałem komentarz w bramce D wyjaśniający, że (a)/(a2) mierzą WYŁĄCZNIE
pokrycie (P-AI-008 usunięta, mury wybieralne), nie mechanizm bonusu — i dodałem **T8h** w
`ai-threat-mode-test.cjs`, dokładna kopia scenariusza konkurencyjnego T8d (świeże miasto, katalog
mury/koszary/stolarnia/spichlerz, `cityBuildings: []`) ale z `territoryNodes` obcego właściciela
zamiast wroga — realny test mechanizmu granicznego w polu konkurencyjnym. Zielony (12/12,
`ai-threat-mode-test.cjs`, było 11/11).

## Zarzut 2 — PRZYJMUJĘ (poprawka z dowodem, magnitude podniesiona 60→120)

Zweryfikowałem niezależnie mutacyjnie (własny harness, scenariusz identyczny z T8d): przy bonusie
60 scenariusz konkurencyjny wybiera `koszary`, NIE `mury` — bonus graniczny rzeczywiście bez efektu
w polu konkurencyjnym, zarzut trafny. Zbisekowałem próg przełamania bazy grupy "Wojsko i obrona"
(90+militaryScore) w TYM SAMYM scenariuszu: 100→koszary, 110→mury (próg leży 100–110). Podniosłem
`AI_MAJOR_WALL_BORDER_BONUS` z 60 na **120** (margines nad 110, analogiczny do marginesu progu
zagrożenia 180 nad jego własnym progiem przełamania — patrz komentarz w kodzie). Zweryfikowałem że
120 NIE psuje żadnego chronionego gate: pełna rodzina `ai-*.cjs` (38 plików, `ai-buduje-budynki-test`
pominięty jak zawsze) + `tsc --noEmit` (0 błędów) + 5 bramek referencyjnych — patrz TESTY. T8h
(dodany w zarzucie 1) teraz PRZECHODZI z realnym marginesem (nie degeneracko).

## Zarzut 3 — PRZYJMUJĘ (dostarczona niżej)

Tabela priorytetów wszystkich 42 budynków per epoka — patrz sekcja poniżej (poza limitem słów).
Nie dostarczyłem jej w `01-operator-runda2.md` mimo wprost zamówionego przez ratyfikację
obowiązku — luka potwierdzona, naprawiona teraz. Przyjąłem wyliczenie Evaluatora jako bazę
(zweryfikowałem niezależnie formułę i stałe z `ai.ts` — zgodne), zaktualizowałem wiersz `mury`
o nową wartość bonusu granicznego (120, nie 60).

## Zarzut 4 — PRZYJMUJĘ (poprawka z dowodem, pełny ślad odtwarzalny)

Dostarczam dokładny, wydrukowany, ponumerowany ślad budowy — metoda identyczna jak
`ai-produkcja-pokrycie-katalogu-test.cjs` (`chooseCityProduction` w pętli, `canAfford` odrzuca
WYŁĄCZNIE jednostki, budynek trafia do `built` natychmiast po wyborze), scenariusz: 3 miasta
(c1/c2/c3, siatka 20×20, `laka` wszędzie), miasto **c1**, `currentTurn: 60`, `data`/`diff`
identyczne jak bramka pokrycia (poziom trudności 2). Skrypt: patrz "Tabela dowodowa" niżej —
zapisany w tym raporcie w całości, odtwarzalny 1:1.

Wynik: **bonus=0 → Spichlerz na 12/42**; **bonus=8 (stała obecna) → Spichlerz na 11/42**.
Przesunięcie: **12→11** (jedna pozycja), NIE "11→10" (błąd w raporcie rundy 2 — poprzedni opis nie
podawał parametrów scenariusza i był nieodtwarzalny) i NIE zgodne dosłownie z komentarzem w kodzie
("8-11. pozycji, nie na 4") — TA linia komentarza opisywała inny, wcześniejszy, nieodtwarzalny
szacunek z rundy 1/rundy 2 (bez ścisłego scenariusza). Naprawiłem OBA miejsca w kodzie
(`AI_MAJOR_SPICHLERZ_PRIORITY_BONUS` i miejsce użycia w `chooseCityProduction`) tak, by podawały
IDENTYCZNE, zweryfikowane liczby (12/42 → 11/42) z odniesieniem do tego raportu. Evaluator miał
rację, że oba miejsca w kodzie nie zgadzały się ze sobą ANI z raportem — teraz zgadzają się
wszystkie trzy.

## Testy

`tsc --noEmit`: 0 błędów. 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
unit-replace 13/13, combat 6/6. Cała rodzina `ai-*.cjs` (39 plików, `ai-buduje-budynki-test.cjs`
pominięty jak w rundach 1/2 — Vite/Chromium, niezwiązany z tą zmianą) uruchomiona indywidualnie po
zmianie: `ai-threat-mode-test` 12/0 (było 11/0, +1 T8h), `ai-produkcja-pokrycie-katalogu-test` 6/0
(bez zmiany liczby asercji), 4 pliki z PRZEDISTNIEJĄCYM czerwonym — identyczne liczby przed i po
zmianą granicznego bonusu: `ai-balans-step3-test` 7/1, `ai-praca-split-parity-test` 21/1,
`ai-slider-test` 33/5, `ai-test.cjs` 291/4 (potwierdzone dwukrotnie — przed i po edycji `ai.ts`).
Wszystkie pozostałe pliki rodziny `ai-*` zielone bez regresji (m.in. `ai-jednostki-tylko-zakup-test`
44/0 — chroniony gate NIETKNIĘTY, bo zmiana dotyczyła wyłącznie stałej granicznej, nie
Spichlerzowej).

## BLOKADY

Dziedziczony DECISION_REQUIRED (Spichlerz, §3 rundy 2): magnitude bonusu Spichlerza wciąż
ograniczona przez chroniony gate `ai-jednostki-tylko-zakup-test` (8 max, pełne odtworzenie 2.-4.
pozycji wymagałoby ~15-30 i psuje gate) — bez zmian tą rundą, Właściciel decyduje. Poza tym brak
nowych blokad.

## ZMIANY/COMMIT

Allowlist: `gra/src/game/ai.ts` (bonus graniczny 60→120, dwa reconciled komentarze Spichlerza),
`gra/tools/ai-produkcja-pokrycie-katalogu-test.cjs` (komentarz wyjaśniający zakres a/a2, zero zmian
asercji), `gra/tools/ai-threat-mode-test.cjs` (NOWA asercja T8h + komentarz nagłówkowy), ten raport.
Commit SHA — patrz `git log` po zapisie.

## Tabela pokrycia

| Zakres | Wynik |
|---|---|
| Major AI, pełny katalog | 42/42 (mury/fort/baszta odblokowane, P-AI-008 usunięta) |
| Miasto-państwo (defensiveCopy) | 42/42 (nietknięte, gałąź bez zmian tą rundą) |
| Katalog łącznie (`buildings.json`) | 42 |
| `ai-threat-mode-test.cjs` | 12/12 (było 11/11, +T8h border-only konkurencyjny) |

## Tabela priorytetów wszystkich 42 budynków per epoka

Metoda: `base(grupa) + archetypeBonus − 0.3×kosztBudowy + wyjątek udokumentowany`, stałe z `ai.ts`
(`GROUP_BUILDING_BASE`, `GROUP_BUILDING_COST_WEIGHT`), profil neutralny 5/5/5, trudność normal
(economyScore=120, militaryScore=100, scienceScore=100), bez bonusu zagrożenia/granicy (warunkowe,
nie bazowe). Bazowa Evaluatora zweryfikowana niezależnie i przyjęta, wiersz `mury`/`fort`/`baszta`
zaktualizowany na nową wartość granicznego bonusu (120, nie 60).

| Epoka | Budynek | Grupa | Koszt | Score (bez wyjątku) | Wyjątek | Score końcowy |
|---|---|---:|---:|---:|---|---:|
| 1 | studnia | Zdrowie | 15 | 265.5 | — | 265.5 |
| 1 | garncarnia | Produkcja surowców | 18 | 254.6 | — | 254.6 |
| 1 | stolarnia | Produkcja surowców | 20 | 254.0 | — | 254.0 |
| 1 | kamieniarski | Produkcja surowców | 20 | 254.0 | — | 254.0 |
| 1 | spichlerz | Żywność | 20 | 244.0 | +8 (runda 2) | 252.0 |
| 1 | targowisko | Handel i pieniądz | 25 | 232.5 | — | 232.5 |
| 1 | dom_starszyzny | Prawo i administracja | 25 | 222.5 | — | 222.5 |
| 1 | garnizon | Prawo i administracja | 30 | 221.0 | — | 221.0 |
| 1 | palac | Prawo i administracja | 40 | 218.0 | — | 218.0 |
| 1 | kamienne_kregi | Wiara | 18 | 184.6 | — | 184.6 |
| 1 | palisada | Wojsko i obrona | 22 | 183.4 | — | 183.4 |
| 1 | stela | Nauka i kultura | 15 | 175.5 | — | 175.5 |
| 2 | koszary | Wojsko i obrona | 25 | 182.5 | +110 | 292.5 |
| 2 | biblioteka | Nauka i kultura | 25 | 172.5 | +90 | 262.5 |
| 2 | akwedukt | Zdrowie | 30 | 261.0 | — | 261.0 |
| 2 | cegielnia | Produkcja surowców | 22 | 253.4 | — | 253.4 |
| 2 | odlewnia_brazu | Produkcja surowców | 28 | 251.6 | — | 251.6 |
| 2 | kuznia | Produkcja surowców | 30 | 251.0 | — | 251.0 |
| 2 | spichlerz_ii | Żywność | 35 | 239.5 | — | 239.5 |
| 2 | magazyn | Handel i pieniądz | 20 | 234.0 | — | 234.0 |
| 2 | mennica | Handel i pieniądz | 28 | 231.6 | — | 231.6 |
| 2 | port | Handel i pieniądz | 30 | 231.0 | — | 231.0 |
| 2 | trybunal | Prawo i administracja | 30 | 221.0 | — | 221.0 |
| 2 | dwor_zarzadcy | Prawo i administracja | 45 | 216.5 | — | 216.5 |
| 2 | palac_ii | Prawo i administracja | 60 | 212.0 | — | 212.0 |
| 2 | swiatynia | Wiara | 25 | 182.5 | — | 182.5 |
| 2 | mury | Wojsko i obrona | 35 | 179.5 | +180 pod zagrożeniem / **+120** przygraniczne (warunkowo, podniesione tą rundą z 60) | 179.5 (bazowo) |
| 3 | laznia_publiczna | Zdrowie | 50 | 255.0 | — | 255.0 |
| 3 | odlewnia_zelaza | Produkcja surowców | 35 | 249.5 | — | 249.5 |
| 3 | akademia | Nauka i kultura | 70 | 159.0 | +90 | 249.0 |
| 3 | kuznia_zelaza | Produkcja surowców | 60 | 242.0 | — | 242.0 |
| 3 | port_wielki | Handel i pieniądz | 55 | 223.5 | — | 223.5 |
| 3 | sad | Prawo i administracja | 55 | 213.5 | — | 213.5 |
| 3 | pretorium | Prawo i administracja | 75 | 207.5 | — | 207.5 |
| 3 | palac_iii | Prawo i administracja | 90 | 203.0 | — | 203.0 |
| 3 | warsztat_oblezniczy | Wojsko i obrona | 65 | 170.5 | (poza MAJOR_FORTIFICATION_IDS, brak bonusu) | 170.5 |
| 3 | fort | Wojsko i obrona | 70 | 169.0 | +180/+120 (warunkowo) | 169.0 (bazowo) |
| 3 | baszta | Wojsko i obrona | 70 | 169.0 | +180/+120 (warunkowo) | 169.0 (bazowo) |
| 3 | akademia_wojskowa | Wojsko i obrona | 80 | 166.0 | — | 166.0 |
| 3 | teatr | Nauka i kultura | 55 | 163.5 | — | 163.5 |
| 4 | wielka_odlewnia | Produkcja surowców | 80 | 236.0 | — | 236.0 |
| 4 | wielka_kuznia | Produkcja surowców | 90 | 233.0 | — | 233.0 |

Uwaga: `warsztat_oblezniczy` NIE jest w `MAJOR_FORTIFICATION_IDS` (tylko mury/fort/baszta) — zgodne
z zakresem ratyfikacji (dotyczyła wyłącznie fortyfikacji), nie regresja.

## Tabela dowodowa — ślad pełny, odtwarzalny 1:1 (zarzut 4)

Scenariusz: `chooseCityProduction('c1', [c1,c2,c3], [], 1, dataFull, ZERO_MODS, { currentTurn: 60,
cityBuildings: { c1: built }, canAfford: (_c,id)=>!unitNames.has(id) }, map, diff)` w pętli, `diff =
loadDifficultyParams(dataFull, 2)`, mapa 20×20 `laka`. **Bonus Spichlerza = 8 (stała obecna):**

```
1. stolarnia        12. odlewnia_zelaza   23. port_wielki      34. palisada
2. koszary           13. biblioteka        24. dom_starszyzny   35. swiatynia
3. studnia           14. akademia          25. trybunal         36. mury
4. akwedukt          15. kuznia_zelaza     26. garnizon         37. stela
5. laznia_publiczna  16. spichlerz_ii      27. palac            38. warsztat_oblezniczy
6. kamieniarski      17. wielka_odlewnia   28. dwor_zarzadcy    39. fort
7. garncarnia        18. magazyn           29. sad              40. baszta
8. cegielnia         19. wielka_kuznia     30. palac_ii         41. akademia_wojskowa
9. kuznia            20. targowisko        31. pretorium        42. teatr
10. odlewnia_brazu   21. mennica           32. palac_iii
11. spichlerz  <--   22. port              33. kamienne_kregi
```

Spichlerz: **11/42**. Z `AI_MAJOR_SPICHLERZ_PRIORITY_BONUS=0` (przywrócone natychmiast do 8 po
pomiarze, `git diff` potwierdza czyste przywrócenie) ten sam ślad daje Spichlerz na pozycji 3 w
kolejce miejsc 10-12 zamienioną z `odlewnia_brazu` — **12/42**. Przesunięcie: 12→11.

Bisekcja bonusu granicznego (T8d-owy scenariusz konkurencyjny: świeże miasto, katalog
mury/koszary/stolarnia/spichlerz, `territoryNodes` obcego właściciela): 60→koszary, 100→koszary,
110→mury, 120→mury, 150→mury, 180→mury, 200→mury. Wybrano 120.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator ocenia Obronę rundy 2.
DEPLOY/PUSH: NIE WYKONANO
