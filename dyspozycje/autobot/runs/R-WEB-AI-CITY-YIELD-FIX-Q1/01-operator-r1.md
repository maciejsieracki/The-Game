STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-YIELD-FIX-Q1
GOAL: Naprawić dopasowanie terenu w `hexCityScore` (plon heksu pod miasto AI = 0 dla każdego terenu) + zmierzyć wpływ na tempo ekspansji AI + ograniczyć skalowaniem, jeśli próg przekroczony. Decyzja o wdrożeniu do ROBOCZEJ: orkiestrator/właściciel.

## 1. Skala błędu (dowody plik:linia, baza `c99ac58cd`)
- Błąd: `ai.ts:1230` (przed zmianą) `t.Teren === hex.terenBazowy` — etykieta „Łąka" vs id `laka` (terrain-yields.json ma 8 etykiet z diakrytykami). Plon = 0 dla wszystkich terenów.
- `hexCityScore` ma JEDNEGO konsumenta: `findCityFoundingHex` (ai.ts:4855) <- `planCityFounding` (jedyne wywołanie) <- `decideAITurn` Step 1b. Nie znalazłem ścieżki „osadnicy" ani „miasto bonusowe" używającej tej funkcji (`git grep hexCityScore` = 2 trafienia). Start AI (stolice) NIE używa tego: `startScoring.ts`/`cluster-start.ts` bez odwołań.
- Skutek: przy `ekspansja_min_score_hex`=3 kandydat przechodzi tylko dzięki rzece/złożom/bonusom (+25 powerGoal, +50 klaster); ranking ślepy na teren.

## 2. Poprawka (`gra/src/game/ai.ts`, tylko hexCityScore + helper)
- `terrainYieldRowForId(data, id)` (ai.ts:1223): dopasowanie po znormalizowanej nazwie (NFD bez diakrytyków, `ł`->`l`, lowercase; `Wybrzeże`->`plytkie_morze`; dosłowne `Teren==id` nadal działa dla fixture'ów). Zasadniczo istnieją 3 inne mapy nazwa<->id (economy.ts:375, units/setup.ts:423, hexContextTooltip.ts:86) — poza allowlistą, nie zunifikowano (do osobnego tematu).
- Nowy klucz `gra/data/ai-params.json` `ekspansja_waga_plonu_heksu` = **0,3** (mnożnik wyłącznie części plon żywność/praca/handel; rzeka, złoża, kara granicy bez zmian; brak klucza w danych = 1 = bez skalowania). Istniejące klucze nietknięte.
- `hexCityScore` wyeksportowany (test). Konflikt z FOLLOWUPS 3a (`ai-difficulty-bonus.ts`): NIE dotykam tego pliku — brak konfliktu.

## 3. Testy
- NOWY `gra/tools/ai-city-yield-test.cjs`: 42 PASS (na kopii PRE ten sam test: EXIT=1, czyli czerwony przed naprawą). Każdy z 8 id terenu -> właściwy wiersz; score bez wagi: łąka 4, równina 3, wzgórza 2, pustynia 1, polarny 0 (dane = same zera); waga 0 = zachowanie sprzed naprawy; waga domyślna 0,3.
- `tsc --noEmit`: EXIT=0 (`gate-tsc.txt`). `gate-ai-city-yield-test.txt`: EXIT=0.
- `ai-*-test.cjs` (54 bez playwright), PRE (kopia c99ac58cd) vs POST: zero regresji. PRE 13 FAIL / POST 10 FAIL; różnice tylko in plus (yield-test, ai-city-recovery, ai-move-range — dwa ostatnie niedeterministyczne/środowiskowe w kopii PRE). Znane czerwone bez zmian: ai-major-economy, ai-praca-split-parity, ai-balans-step3, ai-fog, ai-dlug-porzadki, ai-home-defense, ai-zdobycie-miasta-adiacencja, ai-city-render-batch, ai-avoid-polar-sim/-player-parity (timeout 100 s w obu). Surowe: `evidence-ai-tests-{pre,post}.txt`. Uwaga: pierwsza wersja z domyślnym fallbackiem 0,3 psuła `ai-early-city-founding-pace-test` (fixture 6 pkt*0,3<3) — dlatego fallback w kodzie = 1, a 0,3 siedzi w JSON.

## 4. POMIAR (punkt 3 dispatchu) — CZĘŚCIOWY, uczciwie
- **PEŁNA GRA W PRZEGLĄDARCE: NIE_ZMIERZONO.** Zbudowałem bundle PRE i POST w kopiach poza repo (vite, 31 s), dołożyłem hak pomiarowy w kopii `main.ts` (`ai-city-count-sim.cjs --prepare`). Smoke: generacja świata 168×120 = 202 s, tura 2–3 ≈ 32 s (42 właścicieli, swiftshader); poprzedni 100-turowy przebieg w repo = 66 min. 30 biegów ≈ >24 h, a Bash foreground ≤ 590 s i zakaz tła — niewykonalne w rundzie. Czas tur PRE vs PO w pełnej grze: NIE_ZMIERZONO.
- **ZASTĘPCZO: symulacja silnikowa** `ai-city-count-sim.cjs --engine`: realny generator (rzeki włączone), realny plan startu klastrów, realne `planCityFounding`+`canFoundCity`, powerRank i clusterCenter odtworzone z main.ts; ATRAPA ekonomii (Praca 2/miasto/ture, wzrost +1/3 tury, koszt 20 Pracy + 1 pop), brak wojny/podboju miast-państw/jednostek. 15 map (5 ziaren {1..5} × Kontynenty/Pangea/Wyspy, Standard 168×120, domyślne udziały lądu), 5 AI major/mapę. Wartości bezwzględne NIE odpowiadają realnej grze (PRE: ~1–2 miasta/cywilizację) — ważny jest kierunek/skala względna.

| wariant | Kont. T100 | Pangea T100 | Wyspy T100 | RAZEM T50 | RAZEM T100 | zmiana T100 | założone Łąka/Równina vs inne |
|---|---|---|---|---|---|---|---|
| PRE (waga 0) | 35 | 25 | 70 | 130 | 130 | — | 48 / 7 |
| waga 1 (pełny plon) | 52 | 462 | 124 | 425 | 638 | **+391%** | 556 / 7 |
| **waga 0,3 (domyślna)** | 35 | 30 | 70 | 135 | 135 | **+4%** (Kont. 0, Pangea +20%, Wyspy 0) | 56 / 4 |

Mediana miast na cywilizację w T100: 1 (PRE) / 1 (0,3) / 2 (waga 1). Skład terenów założonych miast (0,3 vs PRE): łąka 44 vs 28, równina 12 vs 20, wzgórza 4 vs 6, pustynia 0 vs 1. Czas `planCityFounding`: 6,35 -> 6,36 ms/wywołanie (0,3); 7,87 ms (waga 1). Przebieg wagi (łącznie T100): 0,2–0,3: ~+0–4%; 0,35: Wyspy +27%; 0,5: Pangea +100% (próg +25% przekroczony); 0,75–1: eksplozja (+750%) bo Łąka sama przekracza minScore.
- WNIOSEK: pełny plon bez skalowania przekracza próg wielokrotnie (+391%) -> skalowanie OBOWIĄZKOWE; waga 0,3 mieści się w progu (-10%..+25%) w każdym typie świata i przesuwa wybór na łąki.
- OGRANICZENIA: (a) plateau wąskie (klif od 0,35); (b) czułość na bonusy (10 map Kont.+Pangea, waga 0,4): bez powerRank/clusterCenter (`--noboost`) +468% zamiast +8%; (c) atrapa ekonomii (te same 10 map): Praca 1 i 5/miasto/turę daje to samo +8% (waga 0,4) co Praca 2.

## 5. REKOMENDACJA
Wdrożyć do ROBOCZEJ z wagą 0,3 DOPIERO po jednym realnym potwierdzeniu w przeglądarce (np. 1 mapa × 100 tur, ręcznie/w tle po stronie orkiestratora; harness gotowy: `--prepare` + vite build kopii + `--dist`). DECYZJA_WYMAGANA (orkiestrator/właściciel): czy akceptować pomiar zastępczy jako wystarczający dla progu, czy zlecić pełnogrową weryfikację (~1 h/bieg).

ZMIANY/COMMIT: `gra/src/game/ai.ts`, `gra/data/ai-params.json`, `gra/tools/ai-city-yield-test.cjs` (nowy), `gra/tools/ai-city-count-sim.cjs` (nowy), `dyspozycje/autobot/runs/R-WEB-AI-CITY-YIELD-FIX-Q1/**`. SHA: patrz końcowa odpowiedź (commit zawiera ten raport). Bez zmian: gra-robocza, WERSJE.md, rust-port, generator map, clusters.ts, ai-difficulty-bonus.ts.
BLOKADY: pełna gra w przeglądarce niewykonalna w czasie rundy (NIE_ZMIERZONO); brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ponowne uruchomienie testu i symulacji `--engine`; weryfikacja progu), potem decyzja o pełnogrowej weryfikacji.
DEPLOY/PUSH: NIE WYKONANO

UWAGA do dowodów: `evidence-sim-table.txt` i `evidence-sim-w0.4.json` opisują wariant wagi 0,4 (pierwotny kandydat: Wyspy +27%, razem +18,5%); wartość domyślna 0,3 = `evidence-sim-w0.3-final.json`. Pliki sim: `ai-city-count-sim.cjs --engine --root <kopia gra> --mapcache <katalog> --label ... [--scale w]`.
