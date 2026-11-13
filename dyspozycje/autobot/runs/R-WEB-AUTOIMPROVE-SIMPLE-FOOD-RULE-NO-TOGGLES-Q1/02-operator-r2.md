STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1
GOAL: Usunąć dwa przyciski; żywność tylko przy obywatelach (wyjątek: obóz łowiecki); wycinka zawsze dozwolona, ale tylko pod żywność; AI tak samo; las pod obywatelami ma być realnie wycinany.
RUNDA: 2/5 (obrona zarzutów Evaluatora r1)

## Odpowiedzi na zarzuty
1. GŁÓWNY CEL (przyczyna niewycinania) — PRZYJMUJĘ, NAPRAWIONE. Odtworzone w Chromium (`?civTest=1`, realny koniec tury, ziarno 311, obywatele na lesie na Wzgórzach, Żywność, 100% puli): PRZED 0 wycinek w 20 turach, w logu pickera „teren nie jest baza pod farme” (`wyrabMaSens`, auto-improvements.ts). Przyczyna: filtr `wyrabMaSens` = tylko Łąka/Równina (teren farmy), a las na Wzgórzach z obywatelem jest pod tarasy i owce (ulepszenia żywnościowe wzgórz, `FOOD_IMPROVEMENT_KEYS`) — odcinany na stałe. Na Łące/Równinie (ziarno 18) wycinka działała już przed zmianą, więc r1 jej nie widział. Poprawka: `wyrabMaSens` przepuszcza też `Wzgorza` (nadal nigdy Góry/inne, nigdy pod ulepszenia niezwiązane z żywnością, nigdy poza polami obywateli). PO: tura 3 wycięto 10 pól lasu na Wzgórzach, tura 4 owce na wszystkich (trzoda 12), potem farmy/irygacja.
   Sekwencyjne etapy E1–E6: ODRZUCAM jako przyczynę — dispatch nakazuje „kolejność E1–E6 bez zmian”; w pomiarze żaden heks z obywatelem na lesie nie czekał na etap (jedyny powód odrzucenia to teren).
   ZAŁOŻENIE do potwierdzenia w ABC (orkiestrator): wycinka lasu na Wzgórzach pod tarasy/owce. Wprost przeczy dawnej decyzji R5 (2026-10-31, „wycinka tylko pod farmy, nie na Wzgórzach”), więc test R5 w `autoimprove-stages-q1` odwróciłem z uzasadnieniem. Cofnięcie = usunięcie jednego warunku `|| hx.terenBazowy === TerenBazowy.Wzgorza`.
2. Brak dowodu PO — PRZYJMUJĘ. `evidence/chromium-r2-wzgorza.txt` (Chromium, realny koniec tury, ziarno 311, 22–24 tur): Żywność PRZED/PO, Zrównoważone PO (22 tury), Surowce PO (12 tur: 0 wycinek, 0 farm, las 64 bez zmian). foodOffWorked = 0 we wszystkich. Wycinka AI: NIE_ZMIERZONO w żywej grze (AI w pełnej grze rozjeżdża się przebiegiem wojen, liczby las przed/po niewiarygodne); zamiast tego dowód silnikowy `decideAITurn` (niżej).
3. Pomiar AI w realnej turze — CZĘŚCIOWO PRZYJMUJĘ. 7/104 vs 5/115 to pomiar po przesunięciach obywateli, nie dowód reguły; dowodem jest test z `decideAITurn` (realna funkcja AI, bez atrap pickera): sekcja (H) w `ai-food-only-worked-hexes-test`: las na Wzgórzach, obywatele na lesie — AI wycina 6 pól, 0 poza obywatelami, powstaje 5 heksów owiec/tarasów; Góry: 0 wycinek. Mutacja (usunięcie warunku Wzgórz): 4 FAIL.
4. Regresje — PRZYJMUJĘ, WYJAŚNIONE I ZIELONE:
   - `autoimprove-stages-q1`: 8 asercji R5 (Wzgórza) zaktualizowanych do punktu 1; 1 FAIL „definicja dostępu do rzeki” = nieaktualny grep źródła po tym, jak R-WEB-IRRIGATION-RIVER-DEFINITION-UNIFY (d7b8b7548) przeniósł definicję do `isHexNearRiver`. Test zaktualizowany. 302/0.
   - `tartak-oboz-wyscig-race`: przyczyna `ReferenceError: setOwnerLastPraca is not defined` — harness wycina blok komitu z main.ts, który od R-HOTSEAT-ETAP6C używa cache per-fotel; dodane stuby w harnessie. 13/0 (strażnik lasu tartaku/obozu działa).
   - `cities-buildings-production-owner-contract`: nieaktualny regex (`rushCost(prod, rushCostModifierForCity(city))`). 53/0.
   - `hex-tooltip-mozliwe-ulepszenia-zloze`: nieaktualny grep po OBOZ-LOWIECKI-TYLKO-LAS-Q1. 67/0.
   - `autoimprove-irrigation-after-farms`: 173 s (wcześniej 76 s) — więcej legalnych kandydatów nie-żywnościowych; 42/0. Wolniejszy, nie wadliwy.
5. Pliki poza allowlistą — bez zmian względem r1 (`ai.ts`, `civ-test-hooks.ts` zgłoszone). Nowe w r2: tylko `auto-improvements.ts` (allowlista) i testy.
6. Surowce/Infrastruktura nie wycinają — ODRZUCAM jako wadę: wprost z dispatchu punkt (3) „NIGDY pod inne ulepszenia”; Surowce PO: 0 wycinek (pomiar). Uwaga trafiona dla ABC: właściciel może chcieć wycinki pod drewno w tych profilach, ale to osobna decyzja.
7. `git diff --check` — PRZYJMUJĘ: usunięto trailing whitespace z `evidence/chromium-pomiar.txt`.

## ZMIANY/COMMIT
Kod r1: 1c19e0aba, af9cc8198 (baza 488d94364). r2: SHA w sekcji końcowej / `git log`. Push NIE.
Pliki r2: `gra/src/game/auto-improvements.ts`; testy: `simple-food-rule-no-toggles`, `ai-food-only-worked-hexes`, `autoimprove-stages-q1`, `tartak-oboz-wyscig-race`, `cities-buildings-production-owner-contract`, `hex-tooltip-mozliwe-ulepszenia-zloze`, skrypt `live-verify-simple-food-rule.cjs` (diagnostyka powodów per heks), `evidence/chromium-r2-wzgorza.txt`, `gate-*.txt`.

## TESTY
tsc EXIT=0; wszystkie bramki z `gate-*.txt` EXIT=0 (simple-food 38/0, ai-food-only 70/0, auto-improve-q3, autoclear-*, auto-improvements, ai-improvements, no-item-cap, stages-q1 302/0, irrigation-after-farms 42/0, farma-*, city-clears-forest, oboz-lowiecki, river-definition-unify, build-mode-hud, praca-percent). Mutacje: usunięcie warunku Wzgórz — 2 FAIL (simple-food) i 4 FAIL (ai-food-only).

## BLOKADY
Decyzja ABC dla orkiestratora: potwierdzić wycinkę lasu na Wzgórzach pod tarasy/owce (odwraca R5). NIE_ZMIERZONO: zapis właściciela (Sumer/Ateny) — przyczyna wskazana na odtworzonym stanie, nie na jego zapisie. Prośba o symbol oblężenia poza dispatchem — pominięta.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2; ABC w sprawie Wzgórz; po deployu REPIN Rust.
DEPLOY/PUSH: NIE WYKONANO
