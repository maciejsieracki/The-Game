STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-UNDEPLOYED-UNITS-LOST-Q1
GOAL: jednostki spoza limitu pola bitwy (120/strone) nie znikaja po bitwie; komunikat o rezerwie; test niezmiennika

## PRZYCZYNA (plik:linia, baza a66a8480c)
- `gra/src/battle/battleScene.ts:5381-5382` -- `attackers.slice(0, MAX_PER_SIDE)`; `this.atk/this.def` = tylko wystawieni. `BattleResult.eventLog` (battleScene.ts ~10401) = `buildBattleEventLog(this.atk, this.def)` = tylko wystawieni; `survivors` tez tylko z wystawionych.
- `gra/src/main.ts` ~31814 (bitwa gracza-atakujacego, reczna): `applyMapBattleOutcomeWithSummary(..., res.survivors, {battleQ,battleR,atkStart})` BEZ `battleEventLog`. W `applyMapBattleOutcome` (main.ts ~32726) brak logu => fallback `buildBattleEventLog(atkRoster, defRoster)` = PELNY sklad (300/200).
- `gra/src/battle/mapFieldBattle.ts` ~543 (bitwa polowa/otwarte miasto, reczna): ten sam brak `battleEventLog`.
- `gra/src/game/post-battle-map.ts:applyManualSurvivors` (~140): dla jednostki z logu, ktorej nie ma w `survivors` => `removeUnitById`. Niewystawiona jednostka jest w pelnym logu, a nie w survivors => KASOWANA. Stad 300 -> 120.
- Sciezki, ktore juz przekazywaly `res.eventLog` (main.ts ~32537 bitwa przychodzaca; ~34745 szturm/oblezenie) -- poprawne, bez zmian. Auto-bitwa nie ma wystawiania (strata % na calym skladzie) -- bez utraty z powodu limitu. AI-obrona: ta sama sciezka reczna/auto; nadwyzki AI gineli identycznie tylko w sciezkach recznych bez logu (poprawione tym samym przekazaniem).

## ZMIANY/COMMIT
Pliki (jawny git add): gra/src/main.ts, gra/src/battle/mapFieldBattle.ts, gra/src/battle/battleScene.ts, gra/src/game/post-battle-map.ts, gra/tools/battle-undeployed-units-test.cjs, ten raport. SHA: patrz `git log` galezi worktree (commit "R-WEB-BATTLE-UNDEPLOYED-UNITS-LOST-Q1 R1"); SHA uzupelnia orkiestrator z wyniku tego etapu.
1. main.ts: `battleEventLog: res.eventLog` w sciezce recznej gracza-atakujacego; komunikat o rezerwie w 2 sciezkach (`showHintMessage`); import `BATTLE_MAX_PER_SIDE`, `battleReserveNotice`; `battleMaxPerSide` do deps mapFieldBattle.
2. mapFieldBattle.ts: `battleEventLog: res.eventLog` + typ w deps + komunikat (`deps.showHint`, tylko gdy `battleMaxPerSide` podane).
3. post-battle-map.ts: nowa czysta `battleReserveNotice(...)`; `registerVeteranProgressAfterBattle` pomija jednostki spoza logu (rezerwa nie dostaje "wygranej bitwy" -- nie walczyla).
4. battleScene.ts: tylko `export const BATTLE_MAX_PER_SIDE = MAX_PER_SIDE` (wartosc 120 BEZ ZMIAN) + komentarz typu.
Odstepstwo od allowlisty (ZALOZENIE, konieczne wg dowodu): `gra/src/battle/mapFieldBattle.ts` nie byl wymieniony, ale zawiera identyczna wadliwa sciezke; zmiana = 3 linie przekazania.

## TESTY
Log: gate-tsc.txt `EXIT=0` (tsc --noEmit).
- NOWY `gra/tools/battle-undeployed-units-test.cjs`: 23/23 PASS. Scenariusze 300 vs 200: atak reczny (300-20=280 wlasnych, wrog traci tylko 120), obrona miasta (obronca wygrywa), przegrana (odwrot, rezerwa na heksie startu), remis, auto (0% strat -> 300), weterani, komunikat, kontrakt zrodlowy (kazde reczne wywolanie przekazuje res.eventLog).
- PADA na bazie: po cofnieciu src/ test konczy sie bledem (`battleReserveNotice is not a function`; ponadto kontrakt zrodlowy by oblal). MUTACJA: usuniecie `battleEventLog: res.eventLog` z mapFieldBattle.ts => FAIL "reczne wywolanie #3" (22/1); po przywroceniu 23/0.
- Regresje: post-battle-map-test 32/0; auto-battle-loss-audit-test 52/0; auto-battle-active-roster-event-test 6/0; map-field-battle-test 24/0; pre-battle-defender-retreat OK; siege-manual-battle-behavior 40/0; logic-test 213/213; ai-test 274 passed / 20 failed (bez zmian wzgledem bazy).
- NIE_ZMIERZONO: testy live w Chromium (brak koniecznosci -- zmiana logiki + tekstu hintu; wymagana weryfikacja wzrokowa komunikatu przez Evaluatora jesli uzna za potrzebna); pelny przebieg wszystkich ~tysiecy testow tools/.

## UWAGI / ZALOZENIA
- Wygrana atakujacego w MIESCIE: istniejaca regula `wipeDefenderOnCityCenter` usuwa cala zaloge na centrum miasta (rowniez ocalalych i rezerwe) -- to zasada zdobycia miasta, nie ta usterka; NIE zmieniana (zmiana = decyzja wlasciciela).
- Rezerwa zwyciezcy przechodzi dalsze reguly mapy (np. wejscie na heks bitwy dla stosu kotwicy, odwrot przegranych) tak jak inne zywe jednostki.
- Limit 120 i model walki bez zmian (osobna decyzja ABC A/B/C/D).
- MIGRACJA: utraconych jednostek NIE da sie odzyskac z zapisow (usuniete z `units[]`, brak sladu); poprawka dziala tylko na przyszle bitwy.
- Sprzatanie: node_modules usuniete; build nie uruchamiany.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ten sam ID), w tym weryfikacja komunikatu w UI i decyzja o odstepstwie mapFieldBattle.ts
DEPLOY/PUSH: NIE WYKONANO
