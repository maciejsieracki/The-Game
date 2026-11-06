STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — AI dyplomacja: zmęczenie wojną, pokój przegrywającego, ochrona przed snowballem
TEMAT: R-WEB-AI-WAR-WEARINESS-LIVE-AUDIT-Q1
GOAL: wojny AI↔AI kończą się pokojem (osłabienie przegranego, nie eliminacja), przegrywający szybko oferuje pokój z eskalacją złoto→surowce→miasta, zmęczenie działa na obie strony, brak snowballa jednej AI.

## ZMIANY/COMMIT
Baza: origin/main 80919e2ae. Commit implementacji: d6eced336 (raport dopisany kolejnym commitem docs).
Allowlista: `gra/src/game/war-weariness.ts`, `gra/data/war-weariness-params.json`, `gra/tools/ai-war-weariness-peace-test.cjs` (test, uzasadnienie niżej), NOWE `gra/tools/ai-war-weariness-live-audit-{hook,measure,summarize}.cjs`, dane w runie. Zero zmian w main.ts / ai.ts / diplomacy-*.ts / gra-robocza / WERSJE.md / rust-port / battle.

## POMIAR (realny endTurn, Chromium, bundle vite poza repo, `?civTest=1`, gracz-obserwator, Standardowy/kontynenty)
Tylko JEDNO ziarno (4242), nie 3: tura z 6 cywilizacjami to 1–3 min pod obciążeniem 20 na 4 rdzeniach (świat 17 min), a Chromium jeden naraz. Pozostałe ziarna: NIE_ZMIERZONO.
Tabele: `pomiar-PRE-seed4242.md` (T1..129), `pomiar-POST-seed4242.md` (T1..157), surowe `dane-*.jsonl`.

| metryka | PRE (T1..129) | POST (T1..157) |
|---|---|---|
| wojny AI↔AI (zwykłe+wymuszone) | 2 (Zulusi–Grecy, Zulusi–Inkowie) | 5 |
| zakończone pokojem | 1 (T128, po 88 turach, zmęczenie 0,50) | 3 (T82 po 42 t., T122 po 82 t., T137 po 45 t.) |
| eliminacje cywilizacji | 0 | 0 |
| największa cywilizacja (udział miast) | 0,20–0,29, HHI 0,20–0,22 | 0,20–0,29, HHI 0,20–0,22 |
Snowball w tym ziarnie NIE wystąpił (po 157 turach: Egipt 20, Zulusi 20, Inkowie 21, Chińczycy 20, Grecy 21 miast; rozkład płaski). Objaw zgłoszony przez właściciela (eliminacja/pochłanianie) NIE został odtworzony na żywo — ochrona jest potwierdzona wyłącznie realnym tickiem w teście (niżej), nie w grze. Wojny z graczem-obserwatorem (1 miasto, udział siły 0,04) trwają 117+ tur — tor AI→gracz (`decideAIDiplomacy`) NIE_ZMIERZONO (obserwator nie odpowiada na oferty).

## PRZYCZYNY (plik:linia, potwierdzone pomiarem)
1. `war-weariness.ts` (stary tick, bramka `if (!isWarWeary(lvl)) { none }` PRZED analizą przegrywającego): oferta przegrywającego możliwa dopiero przy zmęczeniu pary ≥ 0,5, czyli min. ~100 tur wojny (`pelneTur` 200). PRE: jedyny pokój w T128 (tury wojny 88, bo stagnacja dodała ~0,07). Przegrywający nie mógł "szybko dążyć do pokoju".
2. Brak ochrony słabego: zwycięzca odrzucał ofertę przy niepokrytej cenie (`balanceFor < -tolerancePn`); wyjście awaryjne dopiero przy zmęczeniu ≥ 0,8 + 3 odrzuceniach. Test 7f (symulacja wojny w czasie, zwycięzca nieprzejednany, przegrywający traci miasto co 6 tur): bez mechanizmu przegrywający dociera do 0 miast (pokój w T106, eliminacja); z mechanizmem pokój w ≤ 40 turach, ≥ 5 z 9 miast.
3. Asymetria: tolerancja zwycięzcy nie zależała od zmęczenia (tylko przegrywający "tracił cierpliwość").
4. Progi stopni za wysokie: przegrywający z udziałem 0,1 i 3 utratami dochodził do stopnia 2 dopiero po ~0,55 desperacji.
5. Cykl wojna→pokój→ta sama wojna (POZA allowlistą, nienaprawione): Zulusi wypowiadają wojnę tej samej parze ~10 tur po pokoju (Grecy T82→T92, Inkowie T122→T132, Grecy T137→T147). Obserwowana luka to stałe 10 tur; źródło to karencja `peaceUntilTurn` ustawiana w `finalizePeaceTreatyBetween` (main.ts:10864) — jej wartości nie weryfikowałem (NIE_ZMIERZONO), wniosek z pomiaru; w odczuciu gracza wojna "nie kończy się". Zob. BLOKADY.
6. Bariery sprawdzone: `tickAiAiWarWeariness` wołany co turę (main.ts:40198), pary niepuste, `battlePending` nie blokuje (tylko bez miast), `forbidden` chroni stolicę. Wojny wymuszone epoki kończą się pokojem z blokadą epoki (test 6b). Nie blokują w nieskończoność (PRE: Grecy–Zulusi pokój w T128). Auto-pokój po 2 miastach działa tylko dla wojen zwykłych (`maybeResolveRegularWarOnCityCapture`, main.ts ~:33430; R9 usunęło go dla wymuszonych — decyzja właściciela, bez zmian).

## NAPRAWA (tylko war-weariness.ts + JSON, parametry w JSON)
- Wyraźnie przegrywający (udział ≤ 0,45) składa ofertę bez czekania na zmęczenie pary: od `ofertaOdTurWojny` 8; bez straty miasta od `ofertaBezStratOdTur` 25.
- Ochrona przed snowballem: przegrywający z ≤ `ochronaMaxMiast` 3 miastami (po ≥ 1 utracie) albo ≥ `ochronaUtratyWojny` 3 utratami → zwycięzca MUSI przyjąć (`zwyciezcaMusiPrzyjac` 1); po oddaniu zostaje ≥ `minMiastPoOddaniu` 3 (było 1), maks. `maxMiastNaPokoj` 2, nigdy stolica.
- Symetria: tolerancja zwycięzcy rośnie o `tolerancjaZmeczenia` 0,5 × zmęczenie × cena.
- Wagi: `wagaSily` 0,5 (było 0,35), `wagaStrat` 0,3 (0,15), `progiStopni` [0,25; 0,45; 0,65] ([0,3; 0,55; 0,8]); stagnacja: `stagnacjaOdTur` 30 (40), `stagnacjaWaga` 0,3 (0,15).
Efekt live (POST): pokój Zulusi–Grecy w T82 zamiast T128; pokoje także w T122 i T137. Brak zapłaty ("0/0 PW", cena z `peaceOfferAiRequestPn` = 0 przy tych relacjach) — oferta z miastami w żywej grze NIE_ZMIERZONO (brak wyraźnie przegrywającej pary AI↔AI w ziarnie).

## TESTY
- `ai-war-weariness-peace-test`: PASS=81 FAIL=0 (gate-weary.txt). Test starszy zmieniony z uzasadnieniem: 4c i 4f `lostA` 3→2 (przy ≥ 3 utratach przegrywający jest teraz chroniony, zwycięzca musi przyjąć; scenariusz "odrzucenie" wymaga nie-chronionego). Nowa sekcja 7 (7a–7h) na realnym `runWarWearinessTick`, w tym 7f (wojna w czasie).
- RED na bazie origin/main: exit 1 (7a, 7c + TypeError) — gate-red.txt. Mutacje (5): `zwyciezcaMusiPrzyjac`=0, `ofertaOdTurWojny`=999, `tolerancjaZmeczenia`=0, `minMiastPoOddaniu`=0, `ochronaMaxMiast`=0 — wszystkie zabite (gate-mutacje.txt).
- `tsc --noEmit`: EXIT=0 (gate-tsc.txt). `ai-test`: 274 passed, 20 failed (= punkt odniesienia; EXIT=1 pre-istniejący) (gate-ai.txt). `diplo-war-peace-*`, `diplomacy-peace-lock/war-gates/test/ai-balance/city-cession-r3`, `ai-war-nearest-city-peace-2t`, `diplomacy-ai-offer-balance`, `ai-war-gate`: EXIT=0 (gate-weary/diplo/forced.txt). `forced-war-*` testy logiki: EXIT=0; `forced-war-bronze-main-guard` (1 FAIL: "diploInp przekazuje bronzeForceWarTargetId") i `forced-war-iron-main-guard` (1 FAIL: guard pre-pass) EXIT=1 — straże tekstowe main.ts, którego NIE zmieniałem (pre-istniejące na origin/main; nie weryfikowane osobno na czystej bazie — NIE_ZMIERZONO). `war-allin-capital-quick`: EXIT=0, hashe (np. aiVsPlayer 0b2afc75febaa727) bez zmiany względem kodu nietkniętego przez diff (diff nie dotyka tej ścieżki).

## BLOKADY (decyzje produktowe, A/B/C z liczbami z pomiaru)
1. Czas wojny statycznej (bez zmian miast): PRE Zulusi–Inkowie nadal trwała w T129 (89 tur); POST pokój w T122 (82 tury). `pelneTur`: A) 200 (wdrożone; pokój wzajemny ~110–130 tur przy stagnacji), B) 150 (~85–100), C) 120 (~65–80).
2. Cykl re-wojny po pokoju (~10 tur, 3 razy w 157 turach): A) zostawić, B) karencja niewymuszonego pokoju ≥ 30 tur w `finalizePeaceTreatyBetween`, C) wydłużenie dopiero po 2. wojnie tej pary. Wymaga main.ts (poza allowlistą) — nie wdrożone.
3. `ochronaMaxMiast`: A) 3 (wdrożone), B) 2, C) 4. `minMiastPoOddaniu` 3 oznacza, że cywilizacja z ≤ 3 miastami płaci wyłącznie złotem/surowcami.

## RUNDY: 1/5. NASTĘPNY KROK: Evaluator (weryfikacja kodu, testów, uczciwości pomiaru jednego ziarna); ewentualnie dopomiar ziaren 2–3.
## DEPLOY/PUSH: NIE WYKONANO
