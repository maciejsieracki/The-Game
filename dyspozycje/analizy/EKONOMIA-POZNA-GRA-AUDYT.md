# Audyt: wzrost produkcji i zasobów w późnej grze (R-WEB-ECONOMY-LATE-GAME-RESOURCE-GROWTH-AUDIT-Q1)

Status: runda 1/5, Operator (HAIKU 5.5). Tylko analiza; bez zmian w `gra/src/**`, `gra/data/**`, balansie.
Baza: origin/main `0c3fa0747abc9b9776c082259c2c4378dd2fd6a0`.
Dowody: `runs/R-WEB-ECONOMY-LATE-GAME-RESOURCE-GROWTH-AUDIT-Q1/evidence/analiza-jsonl.txt` (wynik `gra/tools/econ-growth-analyze.cjs`) i `.../model-produkcji.txt` (wynik `gra/tools/econ-growth-model.cjs`).

## 0. Zakres pomiaru (co jest, a czego nie ma)

- Dane: `/tmp/terr-out/seed4242.jsonl` (tury 2–76), `/tmp/terr-out/seed777.jsonl` (tury 2–80), `/tmp/war-out/seed7.jsonl` (tury 2–76). Tylko właściciele AI.
- **Gracz: NIE ZMIERZONO.** Harness (`window.__aiEconomyMeasure`, `gra/tools/ai-economy-measure-README.md`) nie ma wiersza gracza.
- Tury 100/125/150 **NIEZMIERZONO**: pliki kończą się na 76–80. Wartości dla t100+ w tabeli są powtórzeniem tury 76/80 (oznaczone w analizie jako „zmierz.”).
- Wiersz jsonl zawiera: skarbiec i spichlerz (zapas), utrzymanie budynków/jednostek/garnizonu (Pieniądz i Surowce), miasta, hexy, obywateli. **Nie zawiera:** przychodu na turę (Skarb, Praca, Nauka PN), zapasów żelaza/brązu/cegły/drewna/kamienia/ceramiki, Pracy i Nauki. Te pola są **NIEZMIERZONO**; wymagają rozszerzenia haka pomiarowego (osobny temat).

## 1. Krzywe wzrostu (AI, średnia / mediana / max na właściciela z miastem)

| Tura | n (AI) | Skarbiec mean / med / max (seed4242) | Skarbiec mean / med / max (seed777) | Spichlerz mean / max (4242) | Utrzymanie budynków Pieniądz mean (4242) | Utrzymanie jednostek Pieniądz mean (4242) | Miasta mean |
|---|---|---|---|---|---|---|---|
| 10 | 41 | 48,8 / 8 / 254 | 51,7 / 22 / 323 | 4,4 / 15 | 0,2 | 4,2 | 1,0 |
| 25 | 15 | 157,4 / 53 / 622 | 120,9 / 45 / 986 | 9,9 / 44 | 20,4 | 12,0 | 4,3 |
| 50 | 15 | 1 437 / 392 / 4 962 | 1 647 / 1 382 / 5 714 | 3 994 / 14 130 | 370 | 112 | 11,9 |
| 75 | 14 (15) | 9 006 / 8 707 / 22 453 | 9 038 / 6 768 / 25 435 | 45 061 / 85 000 | 1 482 | 560 | 16,3 |
| 100 | NIEZMIERZONO (użyto t76/t80) | 9 328 / 8 830 / 23 696 (t76) | 11 059 / 7 757 / 31 948 (t80) | 47 222 / 85 000 (t76) | 1 509 | 583 | 16,6 |

Tempo wzrostu (średnia skarbca, seed4242): t25→t50 ×9,1; t50→t75 ×6,3. Mediana (seed777): t50→t75 ×4,9.
Wykładnik potęgowy S ∝ t^k: k ≈ 3,2 (t25→t50) i ≈ 4,5 (t50→t75). Są to wzrosty **wielomianowe / przyspieszające**, nie dowiedziono wykładniczych (brak składania w konwerterach, patrz §2).

Spichlerz (żywność) max = 85 000 (seed4242, t75) i 95 000 (seed777, t80): okrągłe wartości zgodne z limitem; **NIE potwierdzone** w kodzie (limit Spichlerza jest per miasto, `economy-upkeep.ts` ~l.340–370). Jeśli to limit, to żywność jest już ograniczona przez magazyn, nie przez produkcję.

Zapasy surowców (żelazo, cegła itd.): **NIEZMIERZONO** w jsonl. Teoretyczny limit państwa: `cap = 50 000 × (1 + 0,2 × Magazyny) × (mnożnik epoki, NIEZMIERZONY)` (`economy-upkeep.ts` ~l.315–372). Zapas „>20× przychodu” nie da się policzyć bez przychodu.

Utrzymanie (AI, t75): budynki Pieniądz śr. 1 482 (max 4 586), jednostki Pieniądz śr. 560 (max 1 392), surowce budynki śr. 854 / jednostki 346 (sumy po typach). Przy skarbcu śr. 9 006 utrzymanie stanowi ułamek stanu, ale **nie jest znany ułamek przychodu** (NIEZMIERZONO).

## 2. Dekompozycja źródeł (plik:linia)

| Czynnik | Źródło | Sposób łączenia |
|---|---|---|
| Mnożnik epoki Odlewni żelaza: `m(e) = 1 + 0,5(e−1)` | `citizen-consumption-era.ts:19,24`; `converters.ts:206-213` | **Liniowo** w epoce (×1…×3 dla e=1..5) |
| Cegielnia: cykle wg epoki 50/75/100 | `econ-params.json` `budynek_cegielnia_*` | Tabela, nie mnożnik |
| Cegielnia: mnożnik wyjścia cegły `1+0,5(e−1)` | `converters.ts:171-194` (`CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE`) | **Mnoży** cykle × 2 wyjścia; liniowo w e |
| Garncarnia: 30/50/70/90/110 cykli | `econ-params.json` `budynek_garncarnia_*` | Tabela, liniowo +20/epokę |
| Huta brązu: 50 (e2), 75 (e3+) | `econ-params.json` `budynek_huta_braz_*` | Tabela |
| Stolarnia / Warsztat: +10% za sztukę (civ-wide) | `econ-params.json` (drewno/kamień) | **Addytywnie** między budynkami (`1+0,1·n`) |
| Magazyn: +20% bazy na cap | `economy-upkeep.ts` | **Addytywnie** między Magazynami |
| Liczba miast | pomiar: 4,3 (t25) → 11,9 (t50) → 16,3 (t75) | **Mnożąco** (wszystkie miasta produkują) |
| Odrzucony wariant składany (×(1+PCT)^(e−1)) | `converters.ts:127-136` | nieużyty |

Model (`gra/tools/econ-growth-model.cjs`, założenie: 1 Cegielnia + 1 Garncarnia + 1 Odlewnia żelaza na miasto; liczby wyprowadzone, nie zmierzone):

| Epoka | m(e) | Cegła/t na miasto | Żelazo/t na miasto | Ceramika/t na miasto |
|---|---|---|---|---|
| 1 | 1,0 | 100 | 50 | 30 |
| 3 | 2,0 | 400 | 100 | 70 |
| 5 | 3,0 | 600 | 150 | 110 |

Imperium (N = 16,3 miast, e=4): żelazo 2 037,5/t; cegła 8 150/t. Od (N=4,3; e=1) do (N=16,3; e=4): żelazo ×9,5 = **×3,8 (miasta) × ×2,5 (epoka)**. Cegła: ×5 epoka (cykle × wyjście).

Wniosek z dekompozycji: wzrost jest **iloczynem czynników liniowych** (miasta × epoka × bonusy addytywne), nie kompozycją wykładniczą. Największy udział: liczba miast (×3,8) i epoka (×2,5 żelazo, ×5 cegła, bo wyjście cegły skaluje się z epoką podwójnie: cykle ×1,5…2 oraz wyjście ×1,5…2).

## 3. Sinki i ograniczniki

Obecne sinki (z kodu / danych): utrzymanie budynków, jednostek i garnizonu w Pieniądzu i w Surowcach (`ai-upkeep-params.json`, `citizen-resource-upkeep.json`); racje żywności z mnożnikiem `m(e)` (`citizen-consumption-era.ts`); zakupy za Pieniądz; limit Spichlerza (żywność).

Czego brakuje w późnej grze (potwierdzone brakiem w danych i w `econ-params.json`):
- brak sinka rosnącego z liczbą miast (koszt administracji imperium);
- brak inflacji cen zakupu z epoką lub liczbą miast;
- utrzymanie budynków/jednostek **nie skaluje się z zasobami** (stała wartość na sztukę);
- cap surowców (50 000 × Magazyny) jest rzędu wielkości zapasów z HUD (zrzut właściciela: Żelazo i Skarbiec w setkach tysięcy) — **NIEZMIERZONO**, czy cap jest osiągany; w HUD suma 157k skarbca przekracza bazę 50k, więc mnożnik epoki lub skala musi być większa (do weryfikacji).

## 4. Propozycje (NIE wdrożone)

| Wariant | Parametry do zmiany | Wpływ liczbowy (model) | Skarbiec t100/t150 | Ryzyko balansu | Ryzyko zapisów | Liczba tematów |
|---|---|---|---|---|---|---|
| **A. Spłaszczenie mnożników epok** | `CONVERTER_OUTPUT_ERA_PCT_BY_RECIPE.cegielnia` 0,50 → 0,25; `citizen-consumption-era` STEP 0,5 → 0,25 (foundry m(e)) | Żelazo e4 per miasto: 2,5 → 1,75 (**−30%**); cegła e4: 500 → 350 (−30%) | NIEZMIERZONO (brak przychodu w jsonl); kierunek: spadek przychodu ok. −30% w epokach 3+ | Racje żywności też rosną z m(e): trzeba rozdzielić klucze | niski (tylko wartości) | 1 |
| **B. Utrzymanie skalowane z epoką i miastami** | `ai-upkeep-params.json` (mnożnik po liczbie miast, np. +X%/miasto) | Utrzymanie budynków Pieniądz AI t75 śr. 1 482/turę → wzrost zależny od X (NIEZMIERZONE do kalibracji) | mniejszy wzrost skarbca; wielkość zależna od X | wpływ na AI-owe armie (utrzymanie jednostek 560/t) | średni (zapis zawiera stan utrzymania) | 1–2 |
| **C. Cap magazynów/państwa wymuszający wydatki** | `economy-upkeep.ts` `bazaSurowcePanstwo` 50 000 → np. 20 000 (+20% per Magazyn bez zmian) | Ogranicza zapas surowców; wpływ na skarbiec pośredni | przy obecnych danych NIEZMIERZONE (brak zapasów surowców) | wymusza wydatki, ale może psuć budowę Magazynów | średni (zapisy z przekroczonym capem) | 1 |
| **D. Nowy sink: koszt administracji imperium** | nowy parametr w `econ-params.json`: Pieniądz/turę = k × (miasta−1) × m(e) | Przy 16,3 miastach i e=4: koszt ~ k×15,3×2,5 (k do ustalenia przez właściciela) | obniża skarbiec proporcjonalnie do k | nowa mechanika (ryzyko UI) | niski (nowe pole, domyślne 0) | 2 |
| **E. Bez zmian** | — | Dane AI nie pokazują wzrostu poza miastami (16 miast, tempo wynika z liczby miast i epok); gracz NIEZMIERZONO | — | brak | brak | 0 |

Rekomendacja Operatora (do oceny właściciela, nie decyzja): najpierw rozszerzyć pomiar o przychód/turę i zapasy surowców (osobny temat, bez zmian gry), dopiero potem wybrać A/B/C. Wariant E jest uczciwy tylko, jeśli pomiar gracza potwierdzi, że problem dotyczy wyłącznie dużych imperiów.

## 5. Pytania ABC do właściciela (decyzje liczbowe należą do Ciebie)

1. **Spłaszczenie epok (wariant A)?** A) tak, 0,50 → 0,25 dla cegły i m(e) 0,5 → 0,25 (−30% w epoce 4); B) tylko cegła (0,50 → 0,25); C) nie zmieniać. Rekomendacja: **A** po pomiarze przychodu.
2. **Utrzymanie rosnące z miastami (wariant B)?** A) tak, +X% za miasto po 5; B) tylko po epoce; C) nie. Rekomendacja: **B** po kalibracji na danych.
3. **Cap surowców państwa (wariant C)?** A) obniżyć bazę 50 000 → 20 000; B) zostawić, dodać sink; C) zostawić. Rekomendacja: **B**, bo cap nie jest zmierzony.
4. **Sink administracji imperium (wariant D)?** A) tak, nowy parametr z wartością domyślną 0; B) nie. Rekomendacja: **A**.
5. **Pomiar gracza (przed balansem)?** A) rozszerzyć harness o przychód/turę, Pracę, Naukę i zapasy surowców (osobny temat); B) bez pomiaru gracza. Rekomendacja: **A**.

## 6. Ograniczenia tej analizy

- Liczby AI, nie gracza. Tury 100–150 nieobecne w danych.
- Model zakłada 1 budynek każdego typu na miasto; liczby budynków nie są zmierzone.
- Mapa tura→epoka nie jest w jsonl; model operuje na epoce i liczbie miast.
- Mnożnik epoki capu surowców **NIEZMIERZONY**.
