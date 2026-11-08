STATUS: PASS-WITH-NOTES (kod i testy gotowe do Evaluatora; 5 pytań ABC do właściciela — stare reguły zostawione, nic nie blokuje; pomiar na żywej grze NIE_ZMIERZONO)
DOMAIN: GAME (WEB — `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-STAGES-Q1
GOAL: auto-ulepszenia (K1 gracz „Żywność”, K2 gracz „zrównoważone”, K3 AI cywilizacji) stawiają farmę → trzodę → irygację przy rzece, wycinają las przy rzece i poza nią bez tartaku/obozu na wycinanym heksie, nie są wstrzymywane przez niedobór surowca (K1) ani przez brak technologii etapu; niedobór działa tylko tam, gdzie wolno (K2/K3), jedną wspólną logiką.
ZMIANY/COMMIT: baza = ocalony WIP `a4034f59f` (na `4d1916f2c`). Commit kodu i testów: `0eacc66bf` (allowlista: `gra/src/game/auto-improvements.ts`, `gra/src/game/ai.ts`, `gra/src/main.ts`, `gra/src/map/improvement-build.ts`, `gra/data/terrain-improvements.json`, `gra/tools/autoimprove-stages-q1-test.cjs` (nowy), `gra/tools/ai2-heks-po-heksie-test.cjs`, `gra/tools/hodowla-las-test.cjs`, `dyspozycje/autobot/runs/R-WEB-AUTOIMPROVE-STAGES-Q1/**`). Commit raportu: patrz ostatnia linia pliku. Zero zmian: `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `newGameFlow.ts`, `econ-params.json`, `citizen-resource-upkeep.*`. Brak push, brak buildu w `gra/`.
TESTY: patrz sekcja 5 (tsc EXIT=0; wszystkie bramki z dispatchu zielone; nowy test 108/0, czerwony PRZED 61/32, mutacje 10/10 zabite).
BLOKADY: brak techniczny. Żywa gra: NIE_ZMIERZONO (brak Chromium: `PLAYWRIGHT_CHROMIUM_EXECUTABLE` pusty, `~/.cache/ms-playwright` nie istnieje; build w `gra/` zakazany). Pytania ABC: sekcja 4.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1 (niezależny), potem Obrona, Final Control, integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

---------------------------------------------------------------------------------
## 0. Stan wejściowy (zweryfikowany)
`git checkout --detach a4034f59f` (WIP R5). Na WIP uruchomiłem bramki PRZED moimi zmianami: krok0 3/0, r2 10/0, d1 2/0, auto-improvements 45/0, ai-improvements 53/0, ai-food-stages 13/0, **ai2-heks-po-heksie 35/1** (czerwony: „BEZ niedoboru tartak nie powstaje ani razu (1 szt.)”; wynik odtworzony w sesji przed zmianami, log nie zachowany). Przeczytałem dispatch, audyt `de497a721` (60 bramek) i diff WIP.

Co w WIP było sprzeczne z decyzjami właściciela i zostało przerobione:
- WIP: etapy żywnościowe ZAWSZE pierwsze, „reszta listy” po nich przy niedoborze. Decyzja K2/K3 (dosłownie): „gdy brakuje surowca, priorytet przestawia się na surowiec … po zaspokojeniu wraca do żywności” ⇒ niedobór NA PRZÓD. Przerobione (sekcja 2, wiersz 1).
- WIP: E5 zawierał `tartak`/`oboz_lowiecki` z minimum leśnym. ABC-3=B + uwaga „nie wycinamy tam, gdzie są tartaki; nie stawiamy tartaku na każdym lesie” ⇒ E5 = tylko `wyrab`+`farma`, bez `lesneMinSpelnione` i bez `WYRAB_MIN_FOREST_IN_RADIUS`.
- WIP nie podawał `playerEra` (przyczyna 3 audytu) — dodane.

## 1. Przyczyny z audytu → naprawa (plik:linia stanu po `0eacc66bf`)
| # | Przyczyna (audyt) | Naprawa | Gdzie | Dowód (test) |
|---|---|---|---|---|
| 1 | niedobór „którykolwiek z 15 kluczy <10” wyłączał etapy żywnościowe (`main.ts` stary 35767-35772, `auto-improvements.ts:556,701`) | etapy zawsze aktywne dla K1/K2/K3; niedobór działa wyłącznie jako krok „brakujący surowiec NA PRZÓD”, tylko dla `getFocus==='zrownowazone'`, tylko dla surowców z ulepszeniem terenu (`actionableDeficitKeys`: złoto/stal/żywność nic nie otwierają) | `auto-improvements.ts:505-545` (mapa, `deficitImprovementKeys`, `actionableDeficitKeys`), `:556-` `pickAutoImprovements`; `ai.ts:2641`, `:2676`; `main.ts` komentarz przy `foodImprovementStages` | (a) K1/K2/K3 bez i z niedoborem; (d); (i); (l) |
| 2 | tartak+obóz na każdym lesie zamiast wyrębu (`:73-75, 823-827`, `lesneMinSpelnione`, bramki :1011,1016) | E5 bez tartaku/obozu i bez `lesneMinSpelnione`/progu lasu (`offRiverClearing`), strażnik „heks z tartakiem/obozem nie idzie pod topór” zachowany; tartak/obóz w pozostałych ścieżkach ograniczone do `ceil(pop/10)` na miasto (`keyBlockedOnHex`) | `auto-improvements.ts:489-` (FOOD_STAGES), `:1205`, `:1240-1245`, `:1213` | (b), (c), (c2), (k) |
| 3 | brak `playerEra` w pickerze gracza (Nowy Świat bez trzody) | `playerEra: empireEpochForOwner(hOid)` | `main.ts:35751` | (e) + strażnik tekstowy |
| 4 | zakładnik technologii (sonda dodawała technologię etapu) | sonda NIE dodaje technologii (ABC-5=A): etap bez odblokowanego typu nie blokuje następnych | `auto-improvements.ts` pętla etapów (sonda `probePicks`) | (g) K1/K2/K3 |
| 5 | starvation irygacji 60 przy limicie % i rezerwie 30 | E3/E4 poza limitem % (Q2=B, `exemptPercentCap`, rezerwa 30 zostaje) + rezerwacja budżetu na najdroższą kwalifikującą się pozycję etapu (`reserveBudgetForMostExpensive`, `budgetReservedForExpensive` `:839`) | `auto-improvements.ts:489-`, `:839`, pętla klucza w FAZIE 1 | (h), (h2) |
| 6 | kolejność globalna zamiast dwupoziomowej | etapy E1 farma(rzeka) → E2 wycinka(rzeka) → E3 trzoda(rzeka) → E4 irygacja(+tarasy; irygacja dopiero po farmie na heksie: `irrigationNeedsFarm`) → E5 poza rzeką wycinka+farma → E6 obóz/łodzie/sól; jedna implementacja dla gracza i AI; limit 3 rozkazy/etap/miasto zachowany | `auto-improvements.ts:489-`, `:556-` | (a)-(c), (f), (j) |

Dodatkowo: ABC-2 (kod bez zmian, komentarze) w `improvement-build.ts` (komentarz przy `FOREST_COEXIST_IMPROVEMENT_KEYS` i `FOREST_BLOCKED_IMPROVEMENT_KEYS`); Q1 (JSON): teksty `bydlo`/`owce`/`lama` w `gra/data/terrain-improvements.json` (`surowiecOdblokowany_uwaga`, `teren`, `warunek`, `uwagi`/`historia`) — weryfikacja skryptem: po rozbiorze JSON zmieniły się WYŁĄCZNIE łańcuchy znaków w kluczach `bydlo`, `owce`, `lama`, wszystkie liczby/wartości identyczne. Hint `getImprovementForestBlockHint('bydlo')` NIE zmieniony (pinuje go `tools/hodowla-las-test.cjs:233`).

## 2. Tabela K1/K2/K3 (kontekst → kod → zachowanie ZMIERZONE → zgodność z decyzjami)
| Kontekst | Który kod steruje (plik:linia) | Zachowanie zmierzone (test) | Zgodne z decyzjami? |
|---|---|---|---|
| **K1** gracz „Żywność” (`ulepszeniaFocus==='zywnosc'`) | `main.ts:35751-35780` (`foodImprovementStages` dla `zywnosc`); `auto-improvements.ts:556-` krok 1 pomija miasta spoza `zrownowazone` (`deficitCities`); etapy E1-E6 | (a) farma<trzoda<irygacja na 3/3 heksach rzecznych z niedoborem i bez; (d) sekwencja z niedoborem `{drewno,kamien,glina,ruda}` IDENTYCZNA jak bez niedoboru, 0 tartaków/kamieniołomów/glinianek | TAK. UWAGA: ścieżka zapasowa po wyczerpaniu etapów (fallback) używa starej listy `ULEPSZENIA_FOCUS_ZYWNOSC` z tartakiem/obozem (`:71-75`) → pytanie ABC-A |
| **K2** gracz „zrównoważone” | ta sama funkcja `pickAutoImprovements`: krok 1 (niedobór na przód) → etapy; `main.ts` poda `resourceDeficitKeysForOwner(hOid)` | (i) niedobór t0 → kamieniołom w TEJ SAMEJ turze i PRZED farmą; po zaspokojeniu (t1-11) tylko żywność, kamieniołom 1 raz; po ponownym niedoborze brak zakleszczenia (brak histerezy); (l) niedobór `{zloto,stal}` == brak niedoboru | TAK |
| **K3** AI cywilizacji | `ai.ts:2641` (`actionableDeficitKeys`), `:2660-2676` (wspólne wywołanie, `getResourcePassOnlyWorked: () => false`), reszta jak K2; `maxItemsPerCity: 1` | (f) farma<trzoda<irygacja; (j) PARYTET: sekwencja K2 (z `maxItemsPerCity:1`) == sekwencja AI (`decideAITurn`) w 14 turach, bez niedoboru i z niedoborem kamienia t<3; (k) tartaki 1..`ceil(12/10)=2` zamiast 6 | TAK z dwoma różnicami technicznymi → ABC-D |
Test parytetu K2↔K3: `gra/tools/autoimprove-stages-q1-test.cjs`, blok „(j)”.

## 3. Pomiar niedoboru na REALNYM stanie gry (ABC-1 pkt iii)
- NIE_ZMIERZONO na żywej grze (brak przeglądarki, patrz BLOKADY). Czego brakuje: Chromium z `PLAYWRIGHT_CHROMIUM_EXECUTABLE` albo realnej pętli tury `main.ts` w node, żeby odczytać `resourceDeficitKeysForOwner(0)` od T1 do T40+ w nowej grze.
- Fakty z kodu (nie pomiar): `resourceDeficitKeysForOwner` (`main.ts:20750-20767`) → `detectOwnerResourceNeeds` → `detectPricedResourceDeficits` (`diplomacy-resource-trade-pick.ts:34-49`): niedobór = KAŻDY z 15 wycenionych kluczy (`diplomacy-value-catalog.ts:258-274`) z zapasem <10 (`econ-params.json:834`); magazyn miasta startuje jako `{}` (`cities.ts:827`) ⇒ w T1 wszystkie 15 kluczy to niedobór. Klucze `zloto`, `wegiel`, `stal`, `braz`, `zelazo`, `ceramika`, `kon`, `sol`, `cegla` nie mają ulepszenia terenu w `IMPROVEMENT_FOR_DEFICIT`, a ich zapas zależy od budynków/złóż, więc warunek „którykolwiek <10” jest logicznie prawdopodobnie stale prawdziwy — co potwierdza zarzut właściciela, że stary sygnał nie odpowiadał „realnemu niedoborowi” (hipoteza do potwierdzenia pomiarem).
- Skutek tej zmiany (nie zmieniłem progu <10): automat reaguje tylko na niedobór surowca, dla którego istnieje ulepszenie terenu (`drewno`, `kamien`, `glina`, `ruda`, `ruda_zelaza`, `ruda_cyny`); reszta kluczy nie wpływa na kolejność ani nie otwiera listy. Zmiana samego progu = pytanie ABC-C.

## 4. Pytania ABC (NIE rozstrzygnięte; stara reguła zostawiona; każde z jawnym kontekstem)
**ABC-A (K1, gracz „Żywność”): czy `tartak` i `oboz_lowiecki` mają zostać na liście profilu „Żywność”?** Dziś: `ULEPSZENIA_FOCUS_ZYWNOSC` (`auto-improvements.ts:71-75`) zawiera oba; w K1 trafiają do gry dopiero w ścieżce zapasowej po wyczerpaniu etapów E1-E6 (E6 zawiera obóz tylko na heksie z istniejącym tartakiem, w granicach `ceil(pop/10)`). Właściciel: „tylko żywność, bez priorytetu na surowce”. A) zostają (obóz = żywność z polowania; tartak jako wymóg obozu na heksie) — REKOMENDACJA; B) tylko obóz, tartak wyłącznie gdy stoi już na heksie; C) usunąć oba z K1.
**ABC-B (K2/K3, dotyczy też K1 w ścieżce zapasowej): kiedy powstaje tartak — reguła „1 na 10 obywateli” czy wyłącznie przy niedoborze drewna?** Fakt zmierzony (nie zmieniony): BEZ niedoboru tartak nadal powstaje w drugim wywołaniu AI (`ai.ts` wywołanie „resource” z `foodOnly ∩ ULEPSZENIA_FOCUS_ZYWNOSC`), teraz najwyżej `ceil(pop/10)` na miasto (zamiast na każdym lesie: baza `4d1916f2c` tartak=6 → 1 w `ai4-popyt-obywatele-test` Z1a, `po-r1-ai4-popyt-obywatele-test.txt`); to rozbieżność z ZASADĄ 1 (build tylko przy niedoborze). A) zostaje „1 na 10” (stara reguła, REKOMENDACJA do czasu decyzji); B) tartak tylko przy niedoborze drewna (obóz wtedy bez nowego tartaku). Uwaga: ta sama sprawa jest pre-istniejącym czerwonym `ai4-popyt-obywatele-test` (Z1a/Z1d/Z1g, baza 4 fail, teraz 4 fail ale tartak 6→1).
**ABC-C (K2/K3): czy zmieniać próg niedoboru <10 szt. dla którejkolwiek z 15 kluczy?** Patrz sekcja 3: bez pomiaru nie zmieniam. A) zostaje <10 (REKOMENDACJA do czasu pomiaru na żywej grze); B) próg per surowiec wg zużycia/produkcji; C) niedobór dopiero gdy blokuje kolejkę budowy (`resourceKeysNeededForBuildingQueue` itp. już liczy kolejkę).
**ABC-D (K2 vs K3): dwie różnice techniczne między graczem a AI:** (1) `maxItemsPerCity: 1` (AI) vs bez limitu (gracz; w etapach i tak ≤3/etap/miasto); (2) krok „brakujący surowiec”: AI buduje surowce poza heksami z obywatelami (ECHO 2026-09-08: surowce wszędzie), gracz wg własnego przełącznika `onlyWorked` (D2: bez obywatela nie budujemy; wyjątek: złoże). Czy AI ma zachować limit 1 i „surowce wszędzie”? A) tak, oba zostają (REKOMENDACJA — parytet kolejności i zestawu zachowany, test (j)); B) AI bez limitu; C) „surowce wszędzie” także dla gracza.
**ABC-E (K2/K3/K1): lama na lesie.** ABC-2 mówi „trzoda i owce NA LESIE NIE”; w kodzie `lama` nadal współistnieje z lasem (`improvement-build.ts` `FOREST_COEXIST_IMPROVEMENT_KEYS`). Zostawione (komentarz doprecyzowany, JSON `lama` nadal „także z nakładką Las”). A) lama na lesie zostaje (Inkowie, REKOMENDACJA); B) też blokada.

## 5. Testy (komendy z `gra/`, logi `gate-r1-*.txt` w katalogu runu, każdy z jedną linią `EXIT=`)
tsc: `npx tsc --noEmit` → EXIT=0 (`gate-r1-tsc.txt`).
Bramki (PO, `0eacc66bf`) vs punkt odniesienia dispatchu:
| Bramka | Wynik PO | Ref. | Log |
|---|---|---|---|
| wyrab-rzeka-krok0-test | 3 PASS / 0 FAIL | 3/0 | gate-r1-wyrab-rzeka-krok0-test.txt |
| wyrab-rzeka-r2-test | 10 PASS / 0 FAIL | 10/0 | gate-r1-wyrab-rzeka-r2-test.txt |
| wyrab-rzeka-d1-test | 2 passed, 0 failed | 2/0 | gate-r1-wyrab-rzeka-d1-test.txt |
| auto-improvements-test | 45/0 | 45/0 | gate-r1-auto-improvements-test.txt |
| ai-improvements-test | 53/0 | 53/0 | gate-r1-ai-improvements-test.txt |
| ai-food-improvement-priority-stages-test | 13/0 | — | gate-r1-ai-food-improvement-priority-stages-test.txt |
| ai2-heks-po-heksie-test | 36/0 | — (WIP 35/1) | gate-r1-ai2-heks-po-heksie-test.txt |
| hodowla-las-test | 113/0 | 113/0 (baza) | gate-r1-hodowla-las-test.txt |
| diplomacy-test | 148/0 | 148 | gate-r1-diplomacy-test.txt |
| war-era-counter-test | 82/0 | 82 | gate-r1-war-era-counter-test.txt |
| unit-owner-emblem-ring-civ-color-test | 15/0 | 15 | gate-r1-unit-owner-emblem-ring-civ-color-test.txt |
| **autoimprove-stages-q1-test (NOWY)** | **108/0** | — | gate-r1-autoimprove-stages-q1-test.txt |

CZERWONY PRZED / ZIELONY PO nowego testu: na `4d1916f2c` (src+data z `git archive`) **61 pass / 32 FAIL** (`red-przed-4d1916f2c-...txt`), na WIP `a4034f59f` **74/19** (`red-przed-a4034f59f-wip-...txt`), na `0eacc66bf` **108/0**. Scenariusze → bloki testu: (a) „(a) [K1|K2|K3]” (bez/z niedoborem); (b) „(b)”; (c)/(c2)/(c3) wycinka poza rzeką, tartak nietykany, bez progu lasu, przełącznik „wolno wycinać” OFF; (d) K1 identyczna sekwencja; (e) Nowy Świat (Inkowie era 1/3, AI civEra, strażnik tekstowy `main.ts`); (f) AI; (g) ABC-5; (h)/(h2) Q2=B i starvation; (i) cykl niedobór→zaspokojenie→żywność→ponowny niedobór; (j) parytet K2↔K3; (k) tartak ≤ `ceil(pop/10)`; (l) niedobór bez ulepszenia terenu.
MUTACJE (kopia `src` z jedną zmianą, `STAGES_Q1_SRC_DIR`; `mutacje-autoimprove-stages-q1-test.txt`): M1 brak kroku niedoboru → czerwony; M2 zakładnik technologii → czerwony; M3 brak `playerEra` w `main.ts` → czerwony; M4 wycinka z progiem lasu → czerwony; M5 brak rezerwacji budżetu → czerwony (pierwotnie PRZEŻYŁA — test (h2) zaostrzony po tej obserwacji); M6 trzoda/irygacja pod limitem % → czerwony; M7 tartak na każdym lesie → czerwony; M8 K1 odwołuje się do niedoborów → czerwony; M9 irygacja przed farmą (pierwotnie PRZEŻYŁA — dodano asercję kolejności w (c)) → czerwony; M10 niedobór bez ulepszenia otwiera listę → czerwony. 10/10 zabitych.

Zmiany oczekiwań istniejących testów (każda uzasadniona):
- `tools/ai2-heks-po-heksie-test.cjs:242` okno strażnika tekstowego `main.ts` 2500→5000 znaków (dłuższy komentarz w wywołaniu pickera przesunął `pracaBudgetPercent` poza okno; asercja nietknięta).
- `tools/ai2-heks-po-heksie-test.cjs:343` heks centrum miasta nie jest lasem (fikstura nierealna; przy niedoborze drewna tartak „wszędzie” trafiał na heks miasta, na którym obozu nie ma jak postawić). Asercja „tartak>0 i obóz>0” zachowana.
- `tools/hodowla-las-test.cjs:275` heks testowy leży na ścieżce rzeki (hodowla auto tylko przy rzece — decyzja właściciela E3 z PRIORITY-Q1; baza 113/0 przed WIP, bez tego 111/2); kontrole „lama w górach z lasem TAK”, „owce na wzgórzu z lasem NIE” pozostają merytoryczne.
- WIP już zmienił `ai2-heks-po-heksie-test.cjs:93-126` (E3 hodowla tylko przy rzece) i `ai-food-improvement-priority-stages-test.cjs` — przejrzane, zgodne z E1-E6.

Znane odchyłki NIE z mojej zmiany albo do oceny Evaluatora (porównanie z bazą `4d1916f2c`, logi `base-4d1916f2c-*.txt` vs `po-r1-*.txt`):
- `ai-test` T10b i `ai-praca-split-parity-test` (mutacja) — czerwone IDENTYCZNIE na bazie (pre-istniejące, poza tematem).
- `ai4-popyt-obywatele-test` Z1a/Z1d/Z1g/Q2o — czerwone na bazie; Q2o to regex na twardo `resourceDeficitKeysForOwner(0)` (pre-istniejące); Z1a/d/g patrz ABC-B (tartak 6→1). Z3b (surplus-report) zielony po wyrównaniu sondy nadwyżki z bramkami `keyBlockedOnHex`.
- `ai-ulepszenia-malo-budowane-test`: baza 13/0, PO **12/1** — czerwona asercja „Obrona zarzutu 1: wzrost jest spójny na WIĘKSZOŚCI ziaren”: PO>PRZED na 3 ziarnach z 5 (wymagane ≥4: 7:64→72, 99:68→81, 512:13→86, 4242:92→90, 1337:93→85). Jest to metryka zakładania miast przy nadwyżce Pracy (inny temat); zmiana kolejności ulepszeń zmienia wskaźnik o kilka sztuk na ziarno. NIE rozstrzygam sam — do oceny Evaluatora/właściciela (próg ≥4/5 vs szum ±8). Log: `po-r1-ai-ulepszenia-malo-budowane-test.txt`.

## 6. Czego NIE zrobiono / ryzyka
- Brak żywego przebiegu w Chromium (sekcja 3, BLOKADY).
- Wieloturowa wycinka gracza: picker dostaje `clearingHexKeys: new Set(hexClearingStates.keys())` (`main.ts`, WIP) — przetestowane w symulacji natychmiastową wycinką; realny tick `hexClearingStates` NIE_ZMIERZONO.
- `wyrab` świadomie wyłączony z kroku „brakujący surowiec” (`deficitImprovementKeys`): wycinka ma własną ścieżkę (E2/E5); brak wycinania wszystkich lasów z powodu niedoboru drewna.
- Tarasy (E4) są poza rzeką przed E5 (zgodnie ze specyfikacją E4 „irygacja (+tarasy)”); tylko Chińczycy/Inkowie.
- Sprzątanie: po etapie usunięto `gra/node_modules` i scratch.
