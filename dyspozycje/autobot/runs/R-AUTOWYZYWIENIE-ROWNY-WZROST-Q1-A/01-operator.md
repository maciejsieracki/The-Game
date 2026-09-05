# R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A — raport Operatora (runda 1/5)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-AUTOWYZYWIENIE-ROWNY-WZROST-Q1-A
GOAL: funkcją celu autowyżywienia przestaje być „podnoś racje wszystkim, dopóki się da",
a staje się wyrównywanie WZROSTU między miastami przy twardym warunku braku głodu, wraz
z własnościami (B) miasto na limicie ludności i (C) skalowanie tempa całej cywilizacji.
MODEL+EFFORT: Opus 5, effort high (C-052)
BAZA: bec25312, worktree `/home/user/wt-autowyzywienie-a`

## 1. Hipoteza „wszystko-albo-nic" — OBALONA jako przyczyna (pomiar przed naprawą)

Pomiar: 12 miast ze zrzutu, start Wyżywienie 4 u wszystkich, pula 279/1000, armia 20,
prawdziwa pętla (`autoBalance` → `autoRaise` → clamp Q3=A → `advanceEmpireFood` →
`applyPostCentralPopulationGrowth` → live-clamp), 12 tur.

- **Tury 1–5: wszystkie 12 miast stoi na dokładnie tym samym poziomie 4.** Lockstep raise jest
  symetryczny — nie potrafi wytworzyć rozrzutu, więc nie może być przyczyną objawu.
- Rozrzut pojawia się dopiero po pierwszym przyroście ludności, czyli po `maxSafePoziomRacjiForCity`.
- **Rozstrzygający pomiar (H2b):** to samo imperium, ta sama tura, ten sam deficyt (flow −22):
  `maxSafePoziomRacjiForCity` zwraca **0 dla Sparty** i **2 dla Jin**. Funkcja pyta „jak nisko musi
  zejść TO JEDNO miasto, żeby CAŁE imperium się zbilansowało" — więc pierwsze odpytane miasto
  pochłania całą korektę imperium. Wynik zależy od kolejności iteracji.
- Hipoteza jest prawdziwa tylko jako **blokada powrotu**: raise podnosi krok we wszystkich
  miastach naraz i cofa go globalnie (H1a: flow−armia = 0 → `adjusted=false`), więc miasto zbite
  do 0,5 wraca dopiero, gdy na krok stać całe imperium.

**Prawdziwa przyczyna: asymetria.** Obniżanie per-miasto i zależne od kolejności, podnoszenie
lockstep — zapadka. Miasto zbite do 0 przestaje płacić za racje (DODATNI bilans lokalny) i dostaje
−10% wzrostu; miasta nietknięte zostają na 4 (ujemny bilans, dopłacany z puli) z +4,5%.
Odtworzony objaw ze zrzutu, T12 przed naprawą: Sparta bilans **+11 → −2%**, Ateny **+17 → +3%**,
a Chu **−12 → +5,5%**, Wei **−16 → +6,5%**.
Redystrybucja z puli (`empire-food.ts:257-265`) działa poprawnie i **nie została ruszona**.

## 2. Naprawa (allowlista, `gra/src/game/empire-food.ts`)

- `resolveEqualGrowthRationPlan` (NOWA) — rdzeń: najwyższy **wspólny** poziom Wyżywienia, przy
  którym JEDNOCZEŚNIE nikt nie głoduje i kryterium bilansu jest spełnione. Stąd (A) i (C).
- `simulateCityFoodAllFed` (NOWA) — twardy warunek „żadne miasto nie głoduje".
  `simulateCityFoodCentralPool` tego nie mówi: klampuje pokrycie, więc `pool >= 0` było puste.
- `WYZYWIENIE_POZIOM_NA_LIMICIE` (NOWA, wyprowadzona z `WYZYWIENIE_GROWTH_PCT`, nie magiczna
  liczba) + opcjonalne `popCapByCityId` — własność (B). Bez mapy zachowanie wsteczne. **Mapę
  limitów przekazuje węzeł B (`main.ts`) — poza tą allowlistą.**
- `autoRaiseRationsForGrowth`, `autoBalanceRationsToSolvency` — zamiast zapadki rozwiązują poziom
  docelowy (wyrównanie w obie strony). Bramki gracz/AI (flow vs stock) zachowane bez zmian.
- `maxSafePoziomRacjiForCity` — sprawiedliwy kontrfaktyk: pozostałe miasta schodzą do
  `min(ich poziom, level)`, więc odpowiedź nie zależy od kolejności i nie wybiera ofiary.

## 3. Dowód nietautologiczności i regułą przeciw samooszukiwaniu

Bramka **na czystej bazie (bec25312) czerwienieje: 23/34, exit 1** — z komunikatami
„18 naruszeń odwrotnej zależności", „rozrzut WZROST% = 4,5", „poziomy 1,5/0,5/2/3/4",
„miasto spychane na 0". Po naprawie **57/57**. Bramka nie liczy własnego wzoru na przyrost —
woła `applyPostCentralPopulationGrowth`, czyli pętlę, która w grze faktycznie zmienia `population`.
Sekcja E przepuszcza wariant **„zatrzymaj wszystkich"** przez TĘ SAMĄ funkcję oceny: ma zerowy
rozrzut (E2) i nie głodzi (E3), a mimo to **NIE PRZECHODZI** — przyrost imperium 2 nie jest ostro
większy od progu z wariantu zamrożonego; naprawa daje 10. Wariant „racje 0 wszystkim" też nie
przechodzi.

## 4. ZMIANY/COMMIT

- `gra/src/game/empire-food.ts`
- `gra/tools/autowyzywienie-rowny-wzrost-test.cjs` (NOWA bramka, 57 asercji)
- `gra/tools/auto-wyzywienie-kosztarmii-kryterium-test.cjs` — **aktualizacja 3 zaszytych wartości**
  (Ateny 4,0 → 1,0; Milet 0,0 → 1,0; Nadwyżka 23 → 31). Powód: pinowały wynik lockstep-owego
  obniżania, czyli DOKŁADNIE objaw zgłoszony przez właściciela (Milet z dodatnim bilansem na
  poziomie 0 = −10%, Ateny z ujemnym na 4 = +4,5%). Istota tego testu (`kosztArmii` w kryterium,
  `Nadwyżka − kosztArmii ≥ 0`) nietknięta i nadal asertowana (31 ≥ 20).
- SHA: `2a2e909d`

## 5. TESTY

- `tsc --noEmit` — **zielone**.
- NOWA `autowyzywienie-rowny-wzrost-test` — **57/57** (na bazie: 23/34, exit 1).
- Bramki dotykające `empire-food.ts`, zielone: `auto-wyzywienie-kosztarmii-kryterium` 18/18,
  `auto-wyzywienie-flow-balance` 17/17, `auto-wyzywienie-bilans-clamp` 22/22,
  `auto-wyzywienie-live-recalc` 60/60, `auto-wyzywienie-population-growth-live-recalc` 42/42,
  `ai-major-economy` 33/33, `city-state-mp-growth` 9/9, `army-hunger-combat` 13/13,
  `gold-deficit` 55/55, `magazyn-era-scaling` 58/58, `okolica-multi-city-overlap` 55/55,
  `spichlerz-deficyt-scalenie` 58/58.
- **Czerwone JUŻ NA CZYSTEJ BAZIE (identyczne liczby przed i po, brak regresji z tej zmiany):**
  `empire-food-b5` 25/28, `glod-wojska-karencja` 29/39, `population-growth-v85` 48/50,
  `population-growth-v85-bonus` 18/20, `population-growth-tempo` FAIL, `grupa-b-lane` 45/49,
  `spichlerz-wzrost` 2/9.
- Pięć bramek referencyjnych: logic **213/213**, tech-tree **19/19**, research **33/33**,
  unit-replace **13/13**, combat **6/6**.

## 6. BLOKADY

Brak blokad zatrzymujących. Dwie noty dla Evaluatora:
1. **Rozjazd allowlisty z kryterium 6.** Allowlista dopuszcza aktualizację zaszytych wartości
   w „istniejących bramkach `empire-food*`", a kryterium 6 wymaga zielonych „pozostałych bramek
   dotykających `empire-food.ts`". Zaktualizowany plik (`auto-wyzywienie-kosztarmii-kryterium-test.cjs`)
   dotyka `empire-food.ts`, ale nie pasuje do wzorca `empire-food*`. Zmiana ograniczona do trzech
   liczb + komentarz uzasadniający.
2. **Własność (B) wymaga jednej linii w węźle B.** `popCapByCityId` jest opcjonalne i dziś nikt go
   nie przekazuje (`main.ts` poza allowlistą), więc (B) jest w pełni pokryte bramką, ale w grze
   uaktywni się dopiero po podpięciu `cityPopulationCap(...)` w `main.ts`.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
