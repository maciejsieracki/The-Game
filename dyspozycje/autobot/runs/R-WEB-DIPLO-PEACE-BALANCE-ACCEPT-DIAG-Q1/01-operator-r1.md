STATUS: DECISION_REQUIRED (część DODATEK 1 zaimplementowana i zielona; część DIAGNOZA: zachowanie ze zrzutu wynika z ZASAD wyceny, nie z błędu — zmiana wymaga ABC)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-BALANCE-ACCEPT-DIAG-Q1
GOAL: (1) diagnoza „pokój na minus, a gracz może przyjąć”; (2) czy zwycięzca może żądać okupu/miasta; (3) poprawka tylko przy błędzie; (4) DODATEK 1: AI z przewagą militarną > 20% nie chce pokoju do czasu zmęczenia wojną, AI słabsza o >= 20% może sama proponować pokój (próg w pliku danych).
ZMIANY/COMMIT: patrz sekcja „Zmiany” (SHA kodu: wpisany w sekcji COMMIT na końcu). Brak zmian w main.ts, WERSJE.md, gra-robocza/. Brak `npm run build/dev`. Dodane tylko pliki z allowlisty + plik danych (patrz ZAŁOŻENIA).
TESTY: patrz sekcja „Testy”.
BLOKADY: brak techniczny. DECYZJE do orkiestratora (ABC) — sekcja „DECISION_REQUIRED”.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (kod + test `gra/tools/diplo-peace-balance-accept-test.cjs`), równolegle orkiestrator zadaje właścicielowi ABC D1/D2/D3.
DEPLOY/PUSH: NIE WYKONANO

---------------------------------------------------------------------
## 1. DIAGNOZA przypadku ze zrzutu (Chińczycy, stan WOJNA)

### 1.1 Tabela: kto proponuje | wartość PW stron | bilans | reguła akceptacji | źródło

| Element | Wartość / zachowanie | Źródło |
|---|---|---|
| Rodzaj pozycji | „Propozycja pokoju / zawieszenia broni” = traktat `rozejm` (baza 200 PW; `pokoj` ma bazę 500) | `diplomacy-proposals.ts` case `'pokoj'/'rozejm'` (ok. l. 1253) |
| „Oni oferują … 200 PW” | strona AI liczona płaską bazą, bez modyfikatora Relacji: `partnerTreatyPnRequired(basePn)` = 200 | `diplomacy-pn-engine.ts:174` |
| „My oferujemy … 58 PW (baza 200)” | strona gracza = baza × (1 + mod Relacji); przy Relacji 29 (clamp wojenny `clampRelationForWar` <= 29) mod −71% => 200 × 0,29 = 58 | `diplomacy-pn-engine.ts:164` (`effectiveTreatyPnRequired`), `treatyBaseFairnessGap` `diplomacy-proposals.ts:875` |
| Bilans (`pwBalance`) | `-gap`, gdzie gap = (strona AI) − (strona gracza). Z samej bazy: 200 − 58 = 142 => ok. −142; panel pokazał −98. **Dokładnej liczby −98 nie odtworzyłem** (panel bierze minimum/sumę po wierszach stołu, `balancePanelDataFromRows`, `diplomacyAcceptanceBalance.ts:229`; w zrzucie mogły być dodatkowe pozycje) — NIE_ZMIERZONO. Znak i sens (ujemny dla strony gracza, tj. gracz „płaci” mniej niż AI „oddaje” wg wyceny) potwierdzone testem Z2. | `diplomacy-proposals.ts:1394-1403`, test Z2 |
| Kto jest autorem | W zrzucie obie pozycje to ta sama propozycja widziana dwustronnie; to AI ją złożyła (sygnał (a) `rw <= progPokojSlabosc`, Chińczycy `progPokojSlabosc` = 0,54 — AI w prawie równej sile uważa się za „słabszą”). | `ai.ts` ok. l. 6832 (`zaproponuj_pokoj`), `diplomacy-war-peace-params.json` progPokojSlabosc, `diplomacy-war-peace-profile.ts` `aiPeaceSignals` |
| Reguła akceptacji gracza | `accepted:true` BEZ zależności od `pwBalance` dla pokoju/rozejmu **gdy autorem warunków NIE jest gracz**. Bramka „Brakuje N PW” wraca tylko gdy autorem aktualnych warunków jest gracz (`authorIsPlayer`). | `diplomacy-proposals.ts:1470-1482` |
| Panel UI | wiersz `uiActionId === '10'` (pokój) jawnie pomija generyczną bramkę „pwBalance<0 => blokada”; stąd „Spełnia warunki (bilans −98 PW)” i aktywne „Przyjmij”. | `diplomacyAcceptanceBalance.ts:366` |
| Czy AI zaakceptowałoby tę propozycję | To propozycja AI — AI ją sama złożyła, więc (spójność R5↔R3) ją akceptuje: AI proponuje pokój tylko gdy spełnia te same bramki, które stosuje do pokoju gracza (`aiFeelsStronger`, `aiPeaceTimeOk`). Gracz „Przyjmij” = realna zgoda AI (propozycja pochodzi od AI). Przy propozycji **gracza** do AI panel ma osobną bramkę R5 (`evaluatePeaceAiGate`) i walidację PW (autor = gracz). | `ai.ts` ~6828, `diplomacy-proposals.ts` ~1300 |
| Czyj minus | Ujemny bilans oznacza, że wg wyceny PW gracz dostaje więcej wartości niż „płaci” (AI „oddaje” 200, gracz „wnosi” 58) — czyli strata po stronie AI, nie gracza. Dlatego dla gracza to „dobry deal”, a nie błąd walidacji. | j.w. |

**Wniosek 1:** to NIE jest błąd. To jawna decyzja właściciela z 2026-09-07 (komentarz `R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1` w `diplomacy-proposals.ts` ~l. 1450: „Jeżeli inna cywilizacja … proponuje mi pokój, to nawet jeżeli bilans jest ujemny, powinienem mieć możliwość zaakceptowania”), poprzedzona decyzją rundy 4 „Pokój bez bramki PW”. Panel i handler zachowują się zgodnie z zasadą. Test charakteryzujący: `diplo-peace-balance-accept-test.cjs` Z1/Z2/Z3 (rozejm złożony przez AI w wojnie: `accepted=true`, `pwBalance<0`, jednorazowy handel bez żądania miasta/okupu).

### 1.2 Czy pokój jest wyceniany jak zwykły towar, kiedy zwycięzca może żądać miasta/okupu/trybutu

Tak — „zwykły pokój/rozejm” to towar o stałej bazie PW z modyfikatorem Relacji po stronie gracza; **składnik roszczenia zwycięzcy (miasto/okup) nie jest częścią tej propozycji**. Roszczenia to osobne gałęzie `decideAIDiplomacy`, uruchamiane wąskimi warunkami:

| Gałąź | Warunki uruchomienia | Źródło |
|---|---|---|
| `zada_miasto_za_pokoj` (N1b, żądanie miasta, FALA 556) | wojna z graczem, `aiPeaceTimeOk`, `rw >= AI_MIASTO_ZADANIE_RW` (0,7) ORAZ (tury wojny >= 20 LUB AI zdobyło miasto gracza w tej wojnie) ORAZ gracz ma niezakazane miasto pokrywające cenę pokoju; osobny cooldown `miasto_za_pokoj` | `ai.ts` ok. l. 6772-6790 |
| `oferuj_miasto_za_pokoj` (N1a, AI oddaje miasto) | `rw <= aiMiastoPrzekazRwProg(agresja) + bonus zmęczenia` (bazowo ok. 0,15), !aiFeelsStronger, aiPeaceTimeOk, >= 3 miasta (lub `minMiastAi` przy zmęczeniu) | `ai.ts` ok. l. 6745-6770 |
| `oferuj_trybut_za_pokoj` | `rw <= progTrybutKrytyczny`, złoto > 0 | `ai.ts` ok. l. 6798 |
| `zaproponuj_pokoj` (zwykły pokój/rozejm — przypadek ze zrzutu) | wojna, `!aiFeelsStronger`, `aiPeaceTimeOk`, i (`rw <= progPokojSlabosc` lub sygnały a/b/c/d/e) | `ai.ts` ok. l. 6832 |

Dlaczego nie uruchomiła się gałąź żądania miasta w zrzucie: ta AI (Chińczycy) miała `rw` w okolicy 0,5 (moc 2282 / 2038 w panelu => udział ok. 0,53), a N1b wymaga `rw >= 0,7`. Między `rw` ok. 0,15 (oddanie miasta) a 0,7 (żądanie miasta) nie ma gałęzi z roszczeniem — jest tylko zwykły pokój wyceniany jako towar. To luka wynikająca z zasad (progów), nie z błędu kodu.

## 2. DODATEK 1 — reguła chęci pokoju AI wg przewagi militarnej

### 2.1 Tabela: istniejące miary i progi „siły”/chęci pokoju (zadanie 1)

| Miara / próg | Wartość | Źródło |
|---|---|---|
| `rw` (respektWzgledny) = udział mocy AI: `potAI/(potAI+potDruga)`; moc = `objectivePowerByOwner` (`buildObjectivePowerForOwner`) | wspólna miara wszystkich gałęzi pokoju | `main.ts:39763` (AI→gracz), `:39842` (AI↔AI), `:23319` |
| Panel „Moc militarna” (`playerPower`/`otherPower`) | ta sama moc w wariancie `...Effective` — jedyna różnica: `jednostki` przez `sumArmyMForOwnerEffective` (mnożnik walki) | `main.ts:2762`, `:24218` |
| `progPokojSlabosc` (per cywilizacja, sygnał a) | 0,2–0,55 (baza 0,4; Chińczycy 0,54, Zulusi 0,33) | `diplomacy-war-peace-params.json`, `resolveWarPeaceProfile` |
| `isFeelingStronger` (R5b) | `rw >= 0,55` ∧ brak utraty miasta ∧ tury < 10 | `diplomacy-war-peace-profile.ts` |
| `cenaPokoju.turyBezOgraniczenAi` | 20 tur: po nich R5b i premia siły wyłączone | j.w. |
| `progSilyWysoki / Niski` (mnożnik ceny) | 0,55 / 0,25 | j.w. |
| `sygnalyPokoju` | (b) `rw <= 0,5` po utracie miasta; (d) pat >= 15 tur i >= 10 bez zmiany miast; (e) ułamek zmęczenia >= 0,4 | j.w. |
| `warWearinessLevel` (poziom 0–1) | `tury/200 + 0,03·utraty + do 0,3 stagnacji`; `progChetnosci` 0,5; `progWzajemnyPokoj` 0,8 | `war-weariness-params.json`, `war-weariness.ts:59` |
| Istniejący próg względnej przewagi | **brak** (były tylko progi bezwzględne udziału `rw`) | — |

### 2.2 Wybór miary (ZAŁOŻENIE do akceptacji)
Siła = `rw` (objectivePower) — ta sama co w pozostałych gałęziach pokoju. Stosunek siły AI do drugiej strony = `rw/(1-rw)`. Panel „Moc militarna” liczy tę samą moc w wariancie Effective (tylko mnożnik walki armii); przełączenie dostarczania `rw` do AI na wariant Effective wymagałoby zmiany `main.ts` poza allowlistą handlera akceptacji i zmieniłoby WSZYSTKIE gałęzie AI — nie zrobione. Różnica jest wąska (tylko składnik „jednostki”). Do decyzji: D3 niżej.

### 2.3 Implementacja
- Próg w danych: `gra/data/diplomacy-war-peace-params.json` → `przewagaMilitarna.prog = 0.2` (komentarz źródła: decyzja właściciela 2026-11-09), `epsilon` 1e-9 (tolerancja zmiennoprzecinkowa na granicy).
- Klasyfikacja `militaryAdvantageClass(rw)`: `przewaga` gdy stosunek > 1,2; `niedobor` gdy stosunek <= 0,8; inaczej `posrednia`. Granica: dokładnie +20% to NIE przewaga (wymóg „większa niż 20%”), dokładnie −20% JEST niedoborem („co najmniej o 20% mniejsza”).
- (a) `peaceBlockedByMilitaryAdvantage(rw, wearinessLevel)` = `przewaga` ∧ `!isWarWeary(level)` (zmęczenie wojną >= `progChetnosci` 0,5 zdejmuje blokadę; progi zmęczenia NIE zmienione). Zastosowania:
  - `ai.ts` `decideAIDiplomacy`: AI **nie proponuje** `zaproponuj_pokoj` (tylko wojna z graczem `partnerId === '0'`, AI↔AI bez zmian);
  - `evaluatePeaceAiGate` (nowe pole `wearinessLevel`, podawane tylko przez `diplomacy-proposals.ts` dla pokoju gracz→AI): AI **odrzuca** pokój gracza werdyktem `stronger` (komunikat „AI czuje się silniejsze (przewaga militarna większa niż 20%) …”). Wywołanie AI↔AI w `main.ts` (`tickAiAiPeaceRequests`) nie przekazuje pola, więc bez zmian.
- (b) sygnał `f` w `ai.ts`: AI z `niedobor` wobec gracza ma `wantsPeace` (nadal obowiązują `!aiFeelsStronger`, `aiPeaceTimeOk`, cooldowny); „cena miasta/okupu” — istniejące gałęzie N1a/trybut pozostają bez zmian i mają pierwszeństwo przed zwykłym pokojem.
- (c) przedział pośredni: bez zmian.

### 2.4 Dokumentacja: zmęczenie wojną przełamujące (a)
Przy `warWearinessLevel >= 0,5` (`war-weariness-params.json` `zmeczenie.progChetnosci`) przewaga > 20% przestaje blokować pokój. Przy samym upływie czasu to ok. 100 tur wojny (`tury/200`); szybciej przy utratach miast (0,03/miasto, obie strony) i stagnacji (do +0,3 po >= 30 turach bez zmiany miast, pełna waga przy 130 turach). W wywołaniu z `diplomacy-proposals.ts` poziom liczony jest z `lostCitiesResponder` (straty AI), w `ai.ts` z sumy strat obu stron — AI może więc nieco wcześniej „chcieć” niż bramka gracza przyjmie (bezpieczna asymetria; nie wpływa na spójność, bo zdejmowanie blokady jest tylko po stronie bramki gracza stricte surowsze).

## 3. DECISION_REQUIRED (ABC dla właściciela — zadaje orkiestrator)

**D1 — „Pokój na minus” ze zrzutu (zasada wyceny).** Czy zmienić zasadę „oferowany przez AI pokój/rozejm gracz zawsze może przyjąć, nawet przy ujemnym bilansie PW” (decyzje 2026-09-07 i rundy 4)?
- A (rekomendacja): zostawić — pokój od AI to dar/okazja dla gracza; ujemny bilans oznacza stratę AI; zero ryzyka regresji; wada: AI w niemal równej sile oferuje „tanio”.
- B: AI w sile >= (np.) 40–45% dodaje do swojej propozycji pokoju żądanie (miasto/okup/trybut) — spójne z priorytetem „oddanie miasta” (FALA 556); zaleta: pokój ma cenę; wada: nowe progi liczbowe (decyzja właściciela), ryzyko snowballa, dużo testów.
- C: zablokować „Przyjmij” przy ujemnym bilansie AI-pokoju; wada: gracz traci opcję zgodną z wcześniejszą wolą właściciela; sprzeczne z 2026-09-07.

**D2 — Żądanie miasta (N1b) a reguła (a).** N1b (`zada_miasto_za_pokoj`, `rw >= 0,7`) jest też „propozycją pokoju”, ale NIE objąłem go regułą przewagi > 20% (objęcie wyłączyłoby żądanie miasta aż do poziomu zmęczenia 0,5 i złamałoby zatwierdzoną FALĘ 556 oraz testy `diplomacy-city-cession-r3`, `diplo-city-offer-reject-own-cooldown`).
- A (rekomendacja): zostawić N1b bez zmian (silny zwycięzca może żądać miasta od razu; zgodne z FALĄ 556 „priorytet: oddanie miasta”).
- B: objąć N1b regułą (a): silny AI żąda miasta dopiero po zmęczeniu >= 0,5; wada: zwycięzca nie ma roszczeń przez ~100 tur wojny.

**D3 — Miara „siły”.** A (rekomendacja): `rw`/objectivePower (jak dziś, ZAŁOŻENIE tego raportu). B: przełączyć `rw` dostarczane AI na wariant Effective (zgodny 1:1 z panelem „Moc militarna”); wymaga zmiany `main.ts` i wpływa na wszystkie decyzje AI.

## 4. Zmiany (pliki)
- `gra/data/diplomacy-war-peace-params.json` — sekcja `przewagaMilitarna` (prog 0,2; epsilon).
- `gra/src/game/diplomacy-war-peace-profile.ts` — `militaryPowerRatio`, `militaryAdvantageClass`, `peaceBlockedByMilitaryAdvantage`; pole `wearinessLevel` w `PeaceAiGateInput`; gałąź w `evaluatePeaceAiGate`.
- `gra/src/game/diplomacy-proposals.ts` — podanie `wearinessLevel` do bramki R5 (pokój gracza→AI).
- `gra/src/game/ai.ts` — `aiAdvantageBlocksPeace` (blokada `zaproponuj_pokoj`), sygnał `f` dla niedoboru; tekst warunku `rel.stanWojny && !aiFeelsStronger && aiPeaceTimeOk && (rw <= progPokojSlabosc || peaceSignals.wantsPeace)` zachowany bajt w bajt (strażniki `diplo-war-peace-main-guard-test`).
- `gra/tools/diplo-peace-balance-accept-test.cjs` — NOWY (29 asercji: granica 19/20/21, ±25%, zmęczenie, bramka, evaluateProposal, charakteryzacja zrzutu).
- Aktualizacje testów (bez osłabiania asercji): `diplo-war-peace-gate-test.cjs`, `diplo-war-peace-sim-test.cjs`, `diplo-truce-r1-test.cjs` — bundle esbuild liczy z wyłączonym progiem (`przewagaMilitarna.prog = 1000` przez plugin `ADVANTAGE_OFF`), bo testują reguły R3/R5 niezależne od nowej reguły (stare asercje zakładały, że silna AI po 20 turach/utracie miasta przyjmuje pokój — dokładnie to zmienia decyzja właściciela). Nowa reguła ma własny test.

## 5. Testy (`gra/`, node_modules z `npm ci --ignore-scripts`, usunięte po pracy)
- `npx tsc --noEmit`: 0 błędów.
- `logic-test.cjs`: 213/213. `ai-test.cjs`: 289/0.
- Nowy `diplo-peace-balance-accept-test.cjs`: 29/0; po wyłączeniu progu (mutacja `prog=1000`) pada 10 asercji (P0, G3, G5, G6, G7, A1, A4, A5, B1, C1) — test jest czuły na regułę.
- Bez regresji: ai-losing-war-asks-peace-vs-player 12/0; ai-war-weariness-peace 90/0; diplo-city-offer-reject-own-cooldown 28/0; diplo-war-peace-gate 11/0; diplo-war-peace-profile-unit 198/0; diplo-war-peace-d7 8/0; diplo-truce-r4-ai 24/0; diplo-war-peace-sim 22/0; diplo-war-peace-main-guard 28/0; ai-war-nearest-city-peace-2t PASS; diplomacy-city-cession-r3 73/0; diplomacy-acceptance-points 304/0; diplomacy-ai-offer-balance 29/0; diplomacy-audience-actions 20/0; diplo-truce-r1 30/0; diplomacy-peace-lock 9/0; diplo-aggressor-unit 73/0; ai-early-no-major-war 14/0; pr141-matrix-only-ai 40/0; pr141-ai-strategy-behavior 19/0; diplomacy-resource-cyclic-trade 53/0; forced-war-bronze 31/0, -stone 55/0, -iron 23/0; city-state-cluster-diff 31/0; diplo-nap-trust-30 25/25; era-war-ignore-treaties 22/0.
- Dwa FAIL spoza zakresu, w plikach, których nie dotykałem: `civ-matrix-ai-diplomacy-wiring-test` (1 FAIL: strażnik tekstu `main.ts` „civAiProfileForTyp(data, aiTyp, difficulty)”; main.ts bez zmian) i `civ-matrix-greece-test` (2 FAIL: rozdzielność pól agresji Rzymian 0,75 vs 0,8). Obu NIE porównano z bazą (brak worktree bazowego), ale dotyczą danych macierzy/tekstu main.ts, nie zmienionych plików — NIE_ZMIERZONO na bazie.
- `ai-wojny-zwykle-cap-dwa-miasta-test`: nie zakończył się w kilka minut (CPU ok. 1 s — wygląda na oczekiwanie na zasób, np. przeglądarkę), przerwany; wynik NIE_ZMIERZONO (test nie dotyczy dyplomacji pokoju).
- `diplomacy-war-gates-test`: exit 0.
- Chromium / test na żywo: NIE_ZMIERZONO (brak przeglądarki w tej rundzie; zmiany są logiką AI/bramki, bez UI).

## 6. ZAŁOŻENIA do akceptacji
1. Miara siły = `rw` (objectivePower), patrz D3.
2. Plik danych: `diplomacy-war-peace-params.json` (obok progów pokoju) zamiast ai-params/war-rules-params; dispatch dopuszczał „np.”.
3. Reguła (a)/(b) tylko AI vs gracz (`partnerId === '0'`), AI↔AI bez zmian (zachowanie ochrony przed snowballem).
4. Granice: +20% dokładnie nie blokuje; −20% dokładnie jest niedoborem.
5. Zmęczenie „wystarczające” = istniejące `isWarWeary` (poziom >= 0,5).
6. N1b nie objęty (D2).
7. Przy `turnsAtWar >= 20` dawne wyłączenie R5b/premii siły NIE zdejmuje blokady przewagi (blokada sprawdzana przed tym wyjściem).

## 7. Ryzyka / uwagi dla Evaluatora
- Od teraz mnożnik ceny siły (`peaceStrengthPriceMultiplier`, rw >= 0,55) dla pokoju gracz→AI jest osiągalny tylko przy zmęczeniu >= 0,5; reguła R5b `isFeelingStronger` jest dla ścieżki AI→gracz zasłonięta nową regułą (zostaje w AI↔AI).
- Sygnał `f` poszerza chęć pokoju AI o niskim `progPokojSlabosc` (np. ~0,2–0,33) przy rw <= 0,444 — to wprost wola właściciela (b).

## COMMIT
Kod + testy: e135f923f (gałąź worktree-wf_88fc76cf-f82-1, baza 1493bb5c9). Raport: osobny commit następny po e135f923f. Zakres: 8 plików gra/ (patrz „Zmiany”), `git diff --check` czysty, bez `git add -A`.
