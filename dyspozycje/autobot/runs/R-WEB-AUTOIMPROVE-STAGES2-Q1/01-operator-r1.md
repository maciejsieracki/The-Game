STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-STAGES2-Q1
GOAL: Dopasować automat ulepszeń do decyzji właściciela z 2026-10-31: (1) budżet % jako TWARDY SUFIT dla gracza, AI i państwa-miasta = 100% puli; (2) D-R5-1 farma pierwsza na lesie pod farmę; (3) D-R5-2 tartak/obóz nigdy na rzeka+las we wszystkich profilach; (4) przycisk „Wolno wycinać las” OFF = zero wycinek gracza (AI/miasta-państwa bez przycisku).
ZMIANY/COMMIT: baza = origin/main 0f9f60a10 + merge a6bd3712c (commit 77e554803). Kod + testy + logi: commit „STAGES2-Q1 R1” (SHA w stopce, sekcja „SHA”). Pliki (allowlista): `gra/src/game/auto-improvements.ts`, `gra/src/game/ai.ts` (patrz uwaga o allowliście), `gra/tools/autoimprove-stages-q1-test.cjs`, `gra/tools/ai-improvements-test.cjs`, `gra/tools/ai2-heks-po-heksie-test.cjs`, `gra/tools/ai-food-improvement-priority-stages-test.cjs`, `dyspozycje/autobot/runs/R-WEB-AUTOIMPROVE-STAGES2-Q1/**`. ZERO zmian: `main.ts`, `gra-robocza/**`, `WERSJE.md`, `rust-port/**`.
TESTY: tak, patrz sekcja „Bramki”.
BLOKADY: brak blokad technicznych. Pytania ABC dla orkiestratora: sekcja „Pytania ABC”. Nie uruchomiono `saveload-praca-pool-live` (test żywy, wymaga zbudowanej aplikacji, a `npm run build` w `gra/` jest zabroniony).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1 (niezależna weryfikacja bramek, mutacji i luk z sekcji „Założenia”), potem Obrona i Final Control.
DEPLOY/PUSH: NIE WYKONANO

# 1. Co zmieniono (plik:linia = stan po commicie)

## 1.1 Budżet sztywno (korekta + doprecyzowanie właściciela)
- `auto-improvements.ts` `FOOD_STAGES` (514-521): usunięte pole `exemptPercentCap` i wyjątek E3/E4 (stary kod wyłączał procent: `pracaBudgetPercent:100, getPracaBudgetPercent:undefined, improvementBudgetCap:undefined`). Trzoda i irygacja mieszczą się teraz w procencie jak reszta. D-R5-3 i Q2=B ODWOŁANE.
- `auto-improvements.ts` ok. 1432-1440: usunięte `reserveBudgetForMostExpensive` / `budgetReservedForExpensive` (opcja, pętla `for city`, break po rezerwacji). Pozycja, której koszt przekracza budżet (procent × pula, rezerwa 30), jest po prostu pomijana (`continue`) — nie ma „rezerwacji na najdroższą”, tańsze pozycje nie są wstrzymywane.
- `ai.ts` 2597 i 2760: fallback budżetu AI `floor(pula × MAX_PROCENT_PULI_IMPERIUM/100)` (=50%) zamieniony na 100% puli; import `MAX_PROCENT_PULI_IMPERIUM` usunięty z `ai.ts`. Ścieżka silnika (`main.ts:36166` `computeAiImprovementBudgetCapForOwner` → polityka AI = 100%, `cities.ts` `AI_MAJOR_ULEPSZENIA_PRACA_PERCENT`) już dawała 100% i obejmuje każdego właściciela AI, w tym państwa-miasta i kopie obronne (`main.ts:7309` `isAiImprovementOwner`: ownerId>0 i nie człowiek/barbarzyńca/rebelianci).
- Państwa-miasta używają pickera: tak — przez `decideDefensiveCopyTurn` → `planCityImprovements` → `pickAutoImprovements` (`ai.ts:4377`, komentarz `ai.ts:2530-2531`). Test s2 obejmuje `defensiveCopy:true`.

### Audyt miejsc, w których automat mógł wydać więcej niż ustalony procent (dla każdego plik:linia, status)
| # | Miejsce | Status |
|---|---|---|
| 1 | `auto-improvements.ts` E3/E4 `exemptPercentCap` (R3, Q2=B) | USUNIĘTE |
| 2 | `reserveBudgetForMostExpensive` (R3 „koniec starvation”) | USUNIĘTE (nie przekraczało %, ale oszczędzało ponad %; dispatch kazał usunąć) |
| 3 | `FOOD_STAGE_MAX_ITEMS_PER_CITY=3` (`:480`, `maxItemsStage` `:598`) | NIE omija capu (limit LICZBY, nie kwoty) — ZOSTAJE; wpływ na AI w pytaniu ABC-1 |
| 4 | Kroki poza `globalSpent < effectiveCityCap`: FAZA 0 obrona (`:1168`), krok 0 wycinki, FAZA 1 (`:1440`), FAZA 2 (`:1505`) | KAŻDY sprawdza `globalSpent + koszt > effectiveCityCap`; mutacja M6 (usunięty test w FAZIE 1) → pada |
| 5 | Kolejne przebiegi pickera (niedobór, etapy, ścieżka zapasowa, drogi, inne profile): `after()` `:619` ustawia `improvementBudgetCap = totalBudget − spent` (`totalBudget` `:599`) | OK — suma przebiegów ≤ `totalBudget`; per-miasto override nie przebija (`effectiveCityCap = min(...)` `:1014`, `imperiumBudgetCap` `:869`) |
| 6 | Sondy istnienia celu (`probePicks` `:678`, `fallbackIsPending`, `deficitIsPending`) z `MAX_SAFE_INTEGER` | tylko sprawdzają istnienie; ich picki są wyrzucane, nie wchodzą do wyniku — OK |
| 7 | „Drugie wywołanie pickera” AI | już zlikwidowane w R4 (`ai.ts` komentarz po `foodPicks`); jedno wywołanie |
| 8 | AI `improvementBudgetCap` / `MAX_PROCENT_PULI_IMPERIUM` w `ai.ts` | fallback 50% → 100% (ZMIENIONE) |
| 9 | `pracaBudgetPercent: 100` w `ai.ts:2647` | zamierzone: AI = 100%; cap absolutny = pula |
| 10 | Budżet liczony po kroku zamiast przed | pula zamrożona na wejściu (`globalPracaPulaAtEntry`), brak dryfu |
| 11 | `main.ts` (wykonanie picków gracza): `playerPracaPool - koszt < AUTO_ULEPSZENIA_PRACA_RESERVE → continue` | tylko zaostrzenie (wydaje mniej); koszt = `pick.kosztPraca`, brak dopłat |
| 12 | Rezerwa 30 (`AUTO_ULEPSZENIA_PRACA_RESERVE`) | dolny próg zachowania Pracy, nie dodatek do wydatku — bez zmian. Dla AI: bramka wejścia `AI_IMPROVEMENT_PRACA_SURPLUS=30` (`ai.ts:2507`; 10 dla wczesnego major AI) to rezerwa techniczna, nie %; opis w ABC-2 |

Akumulacja puli (niewykorzystany budżet NIE przepada): `main.ts:36368` zapisuje resztę puli (`setOwnerPracaPool(hOid, playerPracaPool)`); picker liczy % od skumulowanej puli na wejściu. Pomiar tura po turze (33%, pula 200, +40/tura): irygacja 60 startuje w turze 3 (PRZED: tura 2) — wcześniej pula zbierana nie jest „zjadana” przez wyjątek; test (h) pokazuje 20% × 200 = 40 < 60 → 0 budów, a przy +60/turę start dopiero gdy 20% skumulowanej puli ≥ 60.

UI (punkt 4 dispatchu): wskaźnik „Praca na auto-ulepszenia” istnieje (`empireDetailPanel.ts:1376-1412`) i pokazuje tylko wydatek (−X Praca w tej turze), NIE powód braku wydatku (koszt > budżet). Nie dodawałem paneli — pytanie ABC-3.

## 1.2 D-R5-1 farma pierwsza (`auto-improvements.ts` `farmWouldClaimForest` 1352, użycie w `keyBlockedOnHex` 1366-1380)
W K2 (gracz „Zrównoważone”) i K3 (AI + państwa-miasta) tartak w kroku niedoboru jest zablokowany na lesie, który „nadaje się pod farmę” (`isFarmBaseTerrain` Łąka/Równina), więc las zostaje wycince E2/E5 i farmie; tartak powstaje na lesie bez możliwości farmy (Wzgórza itp.). Dodana opcja wewnętrzna `farmPriorityOnlyWorked` (przebieg niedoboru ma własny `onlyWorked`, a „przejęcie” lasu rozstrzyga filtr etapów żywności).

## 1.3 D-R5-2 (`keyBlockedOnHex`, 1366-1371)
Zakaz tartak/obóz na rzeka+las jest bezwarunkowy (usunięty `demandActive &&`): obowiązuje w profilach Żywność/Zrównoważone/Surowce/Infrastruktura, AI i miastach-państwach. Ręczna budowa gracza nie przechodzi przez picker i NIE jest zmieniona.

## 1.4 Przycisk „Wolno wycinać las” (`auto-improvements.ts:951`)
`citySkipWyrab = getSkipWyrab ? getSkipWyrab(city) : skipWyrab` — usunięty wyjątek `riverForestClearingOnly ? false : …`. Gracz z przyciskiem OFF (empire i override miasta, `main.ts:36214-36215` bez zmian) nie wycina nigdzie: krok 0, E2, E5, FAZA 2. AI/miasta-państwa: `ai.ts` nie podaje `getSkipWyrab` i ustawia `skipWyrab:false` (ai.ts:2651 — picker nie czyta żadnej flagi gracza; test strażnik tekstowy: `ai.ts` nie zawiera `wolnoWycinacLas`/`getSkipWyrab`).

## 1.5 Komentarze (stare „1 na 10”): `auto-improvements.ts:170-185` (JEDEN_NA_ILU_OBYWATELI), `:503-515` (specyfikacja etapów E3/E4/E6), `:1289-1293` (MINIMUM LEŚNE). Pozostałe pliki (`buildModeHud.ts:211`, `types/resources.ts:18`, `fort-territory.ts:4-6`, `food-hodowla-test`) — nie ruszane, zgodnie z dispatchem.

# 2. Bramki (logi `gate-r1-*.txt`, każdy z jedną linią `EXIT=`; baza `base-*.txt` na 77e554803)
Wszystko na wyniku merge + zmiany, `tsc --noEmit` EXIT=0 (`gate-r1-tsc.txt`).
- autoimprove-stages-q1: baza 218/0 → po 255/0 (nowe: s1 budżet globalny, s2 AI 100%, s3 D-R5-1, s4 D-R5-2, c3/c3b przycisk, h budżet sztywno; zmiany oczekiwań uzasadnione decyzją plik:linia w nagłówku testu i komentarzach)
- wyrab-rzeka-krok0 EXIT=0, wyrab-rzeka-r2 EXIT=0, wyrab-rzeka-d1 2/0
- auto-improvements 46/0, ai-improvements 53 → 54/0 (zmienione oczekiwania capu 50% dla AI na 100%: test 2/10/11)
- ai-food-improvement-priority-stages 13/0 (zmieniony pin E2: „toggle OFF → zero wycinek”)
- ai2-heks-po-heksie 37/0 (zmieniona asercja „minimum leśne: tartak I obóz” — nieaktualne ECHO; wymaga teraz tylko tartaku)
- hodowla-las 113/0, ai4-popyt-obywatele 55/0, ai-ulepszenia-malo-budowane EXIT=0, spichlerz-hud-params-parity EXIT=0, city-clears-forest EXIT=0, fort-outpost-hard-territory 80/0
- diplomacy 148/0, war-era-counter EXIT=0, unit-owner-emblem-ring-civ-color 15/0
- saveload-praca-pool-live: NIE URUCHOMIONO (test żywy, wymaga buildu — zakaz `npm run build` w `gra/`).
- Dodatkowo szersza grupa (praca-*, auto-manage*, oboz-lowiecki-*, map-improvement-qualify…): bez regresji; 6 testów czerwonych JUŻ NA BAZIE 77e554803 z identycznym wynikiem (ai-major-economy i tartak-oboz-wyscig-race: błąd uruchomienia Node; ai-praca-split-parity 23/4; food-hodowla 20/4; oboz-lowiecki-las 72/19; praca-jeden-podzial-kontrakt 635/2) — nie związane z tematem, nie ruszane.

## Czerwony PRZED / zielony PO
- `red-przed-autoimprove-stages-q1-test.txt`: nowe testy na kodzie bazowym → 228 OK / 27 FAIL (przycisk, budżet, AI 100%, D-R5-1, D-R5-2 — każda decyzja ma czerwone asercje). `red-przed-ai-improvements-test.txt`: 2 FAIL na bazie.
- Po zmianie: zielono (powyżej).

## Mutacje (`mutacje-stages2-q1.txt`; wszystkie ZABITE, EXIT=1)
M1 przywrócony wyjątek E3/E4 od capu → 11 FAIL; M2 limit 50% dla AI przywrócony → 2 FAIL; M3 przycisk ignorowany przy rzece → 8 FAIL; M4 zakaz rzeka+las tylko w K2/K3 → 2 FAIL; M5 usunięte pierwszeństwo farmy → 4 FAIL; M6 brak sprawdzenia capu w FAZIE 1 → 10 FAIL.
Mutacja „przywrócenie limitu % dla AI” = M2 (AI fallback 50%); „wyjątek od limitu dla gracza” = M1; „pomijanie flagi przycisku” = M3.

# 3. Pomiar skutku
## Gracz 33% (`pomiar-gracz-przed.txt` / `pomiar-gracz-po.txt`, K1/K2, pula 200, +40/tura, 40 tur)
- PRZED: wydatek jednej tury do 75% puli przy nominalnych 33% (K1 i K2 bez niedoboru), 66,7% przy niedoborze — dowód łamania sufitu przez wyjątek E3/E4.
- PO: max 30,0% (K1) / 31,3-31,8% (K2) — pod 33%.
- Tempo: irygacja pierwsza w turze 2 → 3 (K1, K2 bez niedoboru), 5 → 4 (K2 z niedoborem); łączny wydatek w 40 turach identyczny (445 K1, 1020 K2) — budżet nie jest „gubiony”, pula kumuluje się (pula końcowa 1355 K1).
- K2 niedobór drewna (D-R5-1, wycinka ON): farma 8 → 10, wyrąb 0 → 2, tartak 4 → 2, obóz 4 → 2 (las na równinie idzie pod farmę).
## AI cywilizacji (`pomiar-przed-ai4-measure.txt` → `pomiar-po-ai4-measure.txt`, 5 ziaren × 40 tur, `decideAITurn`)
- Bez niedoboru: bez zmian (228 rozkazów; farma 57, wyrąb 18).
- Niedobór drewna: tartak 128 → 123, farma 50 → 55, irygacja 48 → 51, wyrąb 11 → 16, obóz 34 → 29 (rozkazów 371 → 374).
- WARIANT ŚCISŁY D-R5-1 (tartak zablokowany na KAŻDYM lesie na równinie, także poza heksami obywateli; `pomiar-wariant-scisly-D-R5-1-ai4-measure.txt`): tartak 128 → 26, obóz 34 → 14, farma 57, wyrąb 18, rozkazów 268. To jest kompromis D-R5-1: ścisła wersja prawie wyłącza tartaki AI w niedoborze (−80%).
- Stan Drewna w magazynie NIE jest mierzony przez to narzędzie (liczy rozkazy, nie zapasy) — NIE_ZMIERZONO.

# 4. Założenia (luki rozstrzygnięte ZAŁOŻENIEM — do potwierdzenia przez Evaluatora/właściciela)
Z1. „Farma możliwa na lesie” (D-R5-1) = teren nadaje się pod farmę ORAZ wycinka włączona dla miasta (przycisk ON; AI zawsze) ORAZ heks w zasięgu etapów żywności (obrabiany, gdy `onlyWorked`). Gracz z wycinką OFF → tartak NIE jest blokowany (inaczej niedobór drewna byłby nierozwiązywalny przy domyślnym OFF). AI: las na równinie poza heksami obywateli nie jest „przejęty” przez farmę (E5 buduje tylko na obrabianych), więc tartak tam wolno.
Z2. Rezerwa 30 (gracz) i bramka wejścia AI 30/10 (ai.ts:2507, 1286) zostają jako rezerwy techniczne, nie wlicza się ich do procentu.
Z3. Etap czekający na samą Pracę (E-stage pending) nadal wstrzymuje niższe (kolejność E1-E6) — to czysta akumulacja puli, żaden procent nie jest przekraczany; item-level „rezerwacja najdroższej” usunięta.
Z4. `ai.ts` poza literą allowlisty („TYLKO wywołanie pickera”): zmieniono 2 linie fallbacku budżetu + import, bo DOPRECYZOWANIE (2) nakazuje usunąć `MAX_PROCENT_PULI_IMPERIUM` w `ai.ts`. Silnik (`main.ts`) już dawał AI 100%, więc zachowanie w grze nie zmienia się — zmiana dotyczy ścieżki bez silnika (testy, kopie).
Z5. Skutki uboczne D-R5-1 w testach starych kontraktów: `ai2-heks-po-heksie` (obóz 0 na mapie z lasem tylko na równinie — obóz jest kategorią żywności tylko na obrabianych heksach); zaktualizowane oczekiwania opisane wyżej.

# 5. Pytania ABC dla orkiestratora (NIE zadane właścicielowi przeze mnie; nie przekraczam % do odpowiedzi)
ABC-1 (D-R5-1, kompromis): przyjęta wersja (Z1) daje AI w niedoborze tartak 123 (PRZED 128). Wersja ŚCISŁA (zakaz na każdym lesie pod farmę) daje 26 (−80%) i drewno może długo nie dochodzić z braku lasów niefarmowych (stan Drewna NIE_ZMIERZONO). A) zostaw Z1 (domyślna, stosowana), B) ścisła, C) ścisła tylko dla gracza z wycinką ON.
ABC-2 (AI 100%): `FOOD_STAGE_MAX_ITEMS_PER_CITY=3` (limit liczby budów etapu na miasto na turę, `auto-improvements.ts:480`) i bramka wejścia AI 30/10 pozostają — nie są limitem %, ale AI nie wyda 100% puli w JEDNEJ turze, gdy pula jest duża (test s2 wydaje 100% przy puli = 3 farmy). A) zostaw, B) zdejmij limit 3 dla AI (wymaga rozróżnienia AI/gracz w pickerze, naruszy parytet K2=K3), C) zdejmij dla wszystkich.
ABC-3 (UI): wskaźnik „Praca na auto-ulepszenia” (`empireDetailPanel.ts:1376-1412`) nie pokazuje „nic nie zbudowano, bo koszt > budżet”. A) bez zmian, B) dopisać jedną linię w istniejącym wierszu (osobny temat UI, poza allowlistą).

# 6. Czyszczenie
Po etapie usunięto `gra/node_modules` i pliki scratch (`gra/tools/.*-bundle.cjs`, `.*-entry.ts`, ignorowane przez git). `git diff --check` czysty.

# 7. SHA
Kod + testy + logi: commit 40e9fc240 (na 77e554803 = merge a6bd3712c do origin/main 0f9f60a10). Ten raport jest dodany w osobnym, następnym commicie (HEAD gałęzi worktree `worktree-wf_01d30164-ba6-1`). Push NIE wykonano.
