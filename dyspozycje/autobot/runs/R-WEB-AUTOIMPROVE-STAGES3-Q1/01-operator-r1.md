STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-STAGES3-Q1
GOAL: Wdrożyć decyzje właściciela 2026-10-31: S3-1 (tartak/obóz nigdy na rzece ani na heksie z dostępem do rzeki; usunięta blokada D-R5-1; preferencja wzgórz) oraz S3-2 (zdjęty limit 3 budowli na etap na miasto na turę dla wszystkich); S3-3 bez zmian.
ZMIANY/COMMIT: baza = `1b6dc1c08` (origin/main, ROBOCZA f5b7b1b3). Allowlista: `gra/src/game/auto-improvements.ts`, `gra/src/game/ai.ts` (tylko komentarz przy wywołaniu pickera), `gra/tools/autoimprove-stages-q1-test.cjs`, `gra/tools/ai-improvements-test.cjs`, `gra/tools/ai2-heks-po-heksie-test.cjs`, `dyspozycje/autobot/runs/R-WEB-AUTOIMPROVE-STAGES3-Q1/**`. `improvement-build.ts` NIE ruszany (definicja dostępu odtworzona w pickerze). SHA: sekcja 7.
TESTY: sekcja 2 (wszystkie bramki zielone, tsc EXIT=0).
BLOKADY: brak technicznych. Pytania ABC dla orkiestratora: sekcja 5 (nie zadane przeze mnie).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1 (niezależna weryfikacja bramek, mutacji, definicji „dostęp do rzeki”, pomiaru AI), potem Obrona i Final Control.
DEPLOY/PUSH: NIE WYKONANO

# 1. Co zmieniono (plik:linia = stan po commicie)

## 1.1 S3-1 — tartak/obóz a rzeka
- Definicja „dostęp do wody” (jedna, wspólna z irygacją): heks leży NA rzece (własny `rzeka.obecna` lub wpis w `map.riverPaths`) ALBO sąsiaduje (6 sąsiadów) z heksem z `riverPaths`. To odpowiada `isRiverAdjacent` w `gra/src/map/improvement-build.ts` (ok. 940-950; irygacja „pole sąsiadujące z rzeką lub na rzece”). Zaimplementowane w pickerze jako `hasRiverAccess` (`auto-improvements.ts` ok. 953-967, liczone raz na wywołanie, memoizowane), bo `isRiverAdjacent` jest wewnętrzne w `createQualifier` (bez eksportu) — dzięki temu `improvement-build.ts` nie jest zmieniany. Test `(s6)` sprawdza, że źródło `isRiverAdjacent` ma tę postać (regex na pliku).
- `keyBlockedOnHex` (`auto-improvements.ts` ok. 1395-1415): `tartak`/`oboz_lowiecki` zablokowane gdy `hasRiverAccess(hexKey)` — WE WSZYSTKICH profilach automatu (Żywność/Zrównoważone/Surowce/Infrastruktura, AI, państwa-miasta). Dotychczasowy zakaz tylko na heksie rzeki (D-R5-2) rozszerzony na sąsiadów rzeki. Ręczna budowa gracza nie przechodzi przez picker — bez zmian.
- Usunięta blokada D-R5-1: funkcja `farmWouldClaimForest` i jej użycie (`demandActive && key === 'tartak' && farmWouldClaimForest(...)`). Tartak (w kroku niedoboru) może stać na lesie nadającym się pod farmę, jeśli heks nie ma dostępu do rzeki.
- Preferencja miejsca (`hillTartakPending`, ok. 1375-1394): tartak na heksie innym niż Wzgórza czeka, dopóki w zasięgu miasta jest kandydat „las na Wzgórzach bez dostępu do rzeki” kwalifikujący się do tartaku (te same bramki: onlyWorked/złoże `hexAllowsKey`, `qualifies`, brak istniejącego tartaku, brak zaplanowanej wycinki). Memo po `picks.length` w obrębie miasta. Efekt: w jednej turze idą najpierw wzgórza; las-równina bez dostępu do rzeki dostaje tartak w KOLEJNEJ turze (po zbudowaniu wzgórz) — patrz test `(s6)` i pomiar.
- (d) bez niedoboru tartak nadal NIE powstaje (`tartakDozwolony` bez zmian); wycinka pod farmy (E2/E5) bez zmian; K1 bez tartaku/obozu (`FOREST_BUILDING_KEYS` bez zmian).
- Zakres „woda”: wyłącznie rzeki. Jezioro/morze NIE liczą się do dostępu (patrz ABC-1).

## 1.2 S3-2 — limit etapu zdjęty
- `auto-improvements.ts` ok. 480: `FOOD_STAGE_MAX_ITEMS_PER_CITY = Infinity` (eksport zostaje wyłącznie dla narzędzi pomiarowych, np. `verify-decisions-picker.cjs`); `maxItemsStage = Math.min(maxItems, Infinity) = maxItems` (ok. 598). Dotyczy etapów E1-E6, kroku niedoboru i dróg dla gracza K1/K2, AI K3 i miast-państw (jeden kod).
- Budżet: bez zmian — gracz sztywny sufit % puli (testy s1+s5 z STAGES2 zielone), AI/miasta-państwa 100% puli. Parytet K2↔K3 zachowany (jeden picker; test (j) zielony).
- Bramka wejścia AI (`ai.ts` `AI_IMPROVEMENT_PRACA_SURPLUS = 30`, wczesny major 10 — `ai.ts` ok. 2507 i 1286, użycie ok. 2578-2584): sprawdzone. Warunek `pracaAvailable <= pracaSurplusGate → return []`: picker dostaje `pracaSurplusThreshold: 0` i `improvementBudgetCap` = budżet, więc po przekroczeniu progu AI może wydać pulę do końca (100%). Bramka blokuje wydatek wyłącznie, gdy cała pula ≤ 30 (10), czyli to rezerwa techniczna ≤ rezerwie 30 — ZOSTAWIONA zgodnie z dispatchem.
- Komentarz przy wywołaniu pickera w `ai.ts` (ok. 2650) uzupełniony; zero zmian logiki w `ai.ts`.

## 1.3 S3-3
Wskaźnik „Praca na auto-ulepszenia” w panelu imperium: BEZ ZMIAN (nie dotykano `empireDetailPanel.ts`).

# 2. Bramki (logi `gate-r1-*.txt`, każdy z jedną linią `EXIT=`)
- tsc --noEmit: EXIT=0 (`gate-r1-tsc.txt`)
- autoimprove-stages-q1 **298/0** (baza 269/0 + nowe: s3 przepisane, s6 dostęp do rzeki/preferencja wzgórz/solo-rzeka/K1/bez niedoboru, s7 limit etapu; oczekiwania zmienione i uzasadnione decyzją S3-1/S3-2 w nagłówku testu: `r5-river`, `(o)` limit ≤5, `(s3)`, `(s4)` fixture bez dostępu do rzeki)
- auto-improvements 46/0, ai-improvements **56/0** (1 asercja zmieniona: „≤3 rozkazy” → „>3, brak limitu”), ai-food-improvement-priority-stages 13/0, ai2-heks-po-heksie **37/0** (asercja „≤3 na miasto” zmieniona na „brak limitu 3”), hodowla-las 113/0, ai4-popyt-obywatele 55/0, ai-ulepszenia-malo-budowane 13/0
- wyrab-rzeka-krok0 3/0, wyrab-rzeka-r2 10/0, wyrab-rzeka-d1 2/0, city-clears-forest 18/0
- fort-outpost-hard-territory 80/0, defeat-last-city 14/0, spichlerz-hud-params-parity 66/0, diplomacy 148/0, war-era-counter 82/0, unit-owner-emblem-ring-civ-color 15/0
- Nie uruchomiono testów żywych wymagających buildu (zakaz `npm run build` w `gra/`).

## Czerwony PRZED / zielony PO
- `red-przed-autoimprove-stages-q1-test.txt`: nowy test na kodzie bazowym `1b6dc1c08` → 278 OK / **20 FAIL** (D-R5-1 usunięta, tartak/obóz na dostępie do rzeki, tartak na lesie pod farmę, preferencja wzgórz, limit etapu 3, stała limitu). PO: 298/0.

## Mutacje (`mutacje-stages3-q1.txt`, na kopii `gra/src` poza repo; wszystkie ZABITE, EXIT=1)
- M1 zakaz tylko na heksie rzeki (bez sąsiadów) → 7 FAIL
- M2 brak preferencji wzgórz → 4 FAIL
- M3 limit etapu przywrócony (3) → 4 FAIL
- M4 definicja dostępu bez własnego heksu rzeki (tylko sąsiedzi) → 2 FAIL (dodałem test „solo-rzeka”, bo pierwotnie M4 przeżywała — wszystkie rzeki fixture były wielo-heksowe)

# 3. Pomiar skutku (AI cywilizacji, `ai4-popyt-obywatele-measure.cjs`, 5 ziaren 7/99/512/4242/1337 × 40 tur, `decideAITurn`)
Pliki: `pomiar-przed-ai4-measure.txt` (baza), `pomiar-po-ai4-measure.txt` (po S3-1+S3-2), `pomiar-s31-z-limitem3-ai4-measure.txt` (po S3-1, limit etapu 3 przywrócony — izoluje S3-2).
- Scenariusz A (bez niedoboru): 228 → 228 rozkazów, skład identyczny (farma 57, irygacja 53, łodzie 41, bydło 31, wyrąb 18) — S3-1/S3-2 bez wpływu bez niedoboru.
- Scenariusz B (niedobór drewna przez 40 tur): rozkazów 374 → 263; tartak 123 → 34, obóz 29 → 5, farma 55 → 55, wyrąb 16 → 16. Skutek S3-1: na mapach pomiarowych większość lasu leży przy rzekach (dostęp do wody) i jest teraz zamknięta dla tartaków/obozów (wg decyzji właściciela, „te tereny lepiej na farmy”). Tartak 34 vs 123 to koszt reguły rzeki, nie limitu.
- Scenariusz C (niedobór t10-19): rozkazów 376 → 263; tartak 121 → 32, obóz 27 → 3.
- S3-2 izolowany (PO vs „S3-1 z limitem 3”): sumy identyczne we wszystkich scenariuszach (228/263/263, ten sam skład); zmienia się TEMPO — w scenariuszu C tury 0-6 żywność 131 → 152 rozkazy (więcej w pierwszych turach), tury 10-14 niedobór: rozkazów nie-żywnościowych (tartak/obóz/wyrąb itd.) `29/11/10/8/2` (limit) → `29/7/14/0/0` (bez limitu; niedobór domknięty do t12 zamiast do t14).
- Żywność: sumy rozkazów żywnościowych bez zmian (S3-2 zmienia kolejność w czasie, nie sumę); brak pomiaru stanu zapasów Drewna/Żywności w magazynie — NIE_ZMIERZONO (narzędzie liczy rozkazy).
- Kompromis S3-2: AI wydaje pulę szybciej i bardziej „falowo” (mniej akumulacji puli między turami), a gracz sam ogranicza się %-em. Sufit puli bez zmian.

# 4. Założenia (luki rozstrzygnięte ZAŁOŻENIEM)
Z1. „Dostęp do wody” = rzeka na heksie lub w sąsiednim heksie (definicja irygacji). Jezioro/morze nie liczą się (ABC-1).
Z2. Preferencja wzgórz = blokada tartaku na heksie nie-wzgórzowym, póki istnieje kwalifikujący się kandydat „las na wzgórzu bez dostępu do rzeki” (czekanie tylko tury, bez zastoju budżetu — ten sam koszt). Pozostałe heksy z lasem bez dostępu dostają tartak po wzgórzach.
Z3. Obóz łowiecki (wymaga tartaku na tym samym heksie) dziedziczy zakaz „dostęp do rzeki” przez ten sam warunek w `keyBlockedOnHex`.
Z4. Zdjęcie limitu w pickerze dotyczy wszystkich wywołań (też roads pass i ścieżki zapasowej) — jedna stała `Infinity` zamiast osobnych gałęzi.

# 5. Pytania ABC dla orkiestratora (NIE zadane właścicielowi przeze mnie)
ABC-1 (definicja „dostęp do wody”, `auto-improvements.ts` ok. 953-967): A) tylko rzeka (na heksie lub sąsiad) = jak irygacja (przyjęte); B) także jezioro/morze (sąsiad wody), C) tylko heks NA rzece + jego sąsiedzi nie, bez zmian względem D-R5-2. Rekomendacja A. Kontekst K1/K2/K3: dotyczy K2 gracz „Zrównoważone” i K3 AI oraz profili Surowce/Infrastruktura automatu; K1 bez tartaku. Do odpowiedzi działa A.
ABC-2 (skutek S3-1 dla AI): tartak 123 → 34 / obóz 29 → 5 w niedoborze drewna na mapach 36x28 z licznymi rzekami (pomiar sekcji 3). A) zostaw (decyzja właściciela wprost), B) dopuść tartak także na heksie z dostępem do rzeki, gdy w zasięgu miasta brak innego lasu (awaryjnie, bez tego niedobór drewna może nie zostać zaspokojony), C) j.w. tylko dla AI. Rekomendacja A (decyzja wiążąca), B do rozważenia po pomiarze zapasów Drewna (NIE_ZMIERZONO). K2/K3.

# 6. Czyszczenie
`gra/node_modules` i pliki scratch usunięte po etapie (kopie bazowe/mutantów tylko w scratchpadzie poza repo). `git diff --check` czysty.

# 7. SHA
Kod + testy + logi + raport: commit w gałęzi worktree `worktree-wf_f2152901-e93-1` (SHA w stopce odpowiedzi; commit nie może zawierać własnego SHA). Push NIE wykonano.
