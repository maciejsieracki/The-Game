STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-REGEN-COOLDOWN-Q1
GOAL: Po CAŁKOWITYM zniszczeniu Milicji miasta — okres odnowy 5 tur (parametr w danych), w którym miasto nie wystawia Milicji; potem pełna odnowa (liczba = aktualna ludność).

## Pomiar stanu (baza origin/main db9433d62)
- Milicja powstaje WYŁĄCZNIE w `collectCityDefRoster` (gra/src/game/siegeDefenders.ts, budowa składu syntetycznie z ludności). Wszystkie ścieżki (taktyczna 3D, Pomiń/Auto, oblężenie, szturm gracz/AI/barbarzyńcy/państwa-miasta) wchodzą przez `cityDefenderOptions` + `collectSiegeDefRoster`/`hasCityDefenders`/`canCaptureCityWithoutBattle` w main.ts (~31673-31695, 32921, 33321-33409, 38744) i barbarians.ts:416 — jeden punkt zbiórki.
- Straty Milicji: `applyMapBattleOutcome` main.ts (~31447-31495): `fallenMilitiaIds` -> `applyMilitiaPopulationLoss` (min. 1 mieszkaniec). Brak jakiegokolwiek stanu "zniszczona" — stąd pełny skład przy każdym ataku.
- Miasta serializowane w całości (save.ts:719 przekazuje `City[]`), więc nowe opcjonalne pole zapisuje się/wczytuje bez zmian formatu.

## Zmiany
- `gra/data/combat-params.json`: `oblężenie.militia_regen_turns = 5` (+opis).
- `gra/src/game/siege.ts`: eksport `MILITIA_REGEN_TURNS`.
- `gra/src/game/cities.ts`: `City.militiaRegenAtTurn?: number` (tura, od której Milicja znów walczy).
- `gra/src/game/siegeDefenders.ts`: opcja `currentTurn`; `militiaRegenTurnsLeft`, `markMilitiaDestroyed`, `applyMilitiaDestroyedCooldown`; blokada Milicji w `collectCityDefRoster` i `hasCityDefenders` (spójnie => `canCaptureCityWithoutBattle`, AI, barbarzyńcy).
- `gra/src/main.ts`: `cityDefenderOptions` przekazuje `currentTurn: turn` (tura globalna, odporna na kolejność graczy); `applyMapBattleOutcome` ustawia licznik po bitwie; estymator panelu uwzględnia odnowę.
- `gra/src/ui/siegeMapPanel.ts`: wiersz "Milicja odnawia się: za N tur" (tylko w panelu oblężenia, gdzie jest wiersz Milicji).
- `PROJEKT-GRY-master.md` §9c: jedno zdanie.
- NOWY `gra/tools/city-militia-regen-cooldown-test.cjs`.

## ZAŁOŻENIA
- "Zniszczona" = wszyscy wirtualni milicjanci rosteru polegli (każdy w `fallenIds`); straty częściowe jedynie zmniejszają ludność jak dotąd i NIE uruchamiają odnowy. Milicjant bez wpisu w logu zdarzeń nie jest uznany za poległego (zachowanie istniejące) => nie uruchamia odnowy.
- Odnowa: `militiaRegenAtTurn = tura_zniszczenia + 5`; Milicja zablokowana gdy `turn < militiaRegenAtTurn` (T+1..T+4 brak, T+5 pełna).
- Brak `currentTurn` w opcjach lub brak pola (stary zapis) = brak odnowy.
- Zasady zdobycia miasta (machiny oblężnicze) bez zmian. Wynik auto-bitwy (% strat przegranego) nie zmieniany — jeśli przy Pomiń przegrany nie traci 100%, część Milicji może przeżyć i odnowa się nie włączy (do oceny Evaluatora; osobny temat jeśli właściciel chce 100% strat obrońcy).
- Nie ruszano `cityAttackChoice.ts` (brak wiersza obrońców). `panele-sterowania/export-c.py` (źródło combat-params.json wg `_opis`) nie w allowliście — klucz może wymagać dopisania tam przy regeneracji (NIE_ZMIERZONO).

## TESTY
- `node tools/city-militia-regen-cooldown-test.cjs`: GREEN 40 PASS / 0 FAIL; na bazie origin/main (MILITIA_TEST_ROOT) RED 3 FAIL (+API); 6 mutacji (ignorowanie cooldownu w roster/hasDefenders, off-by-one x2, częściowe uruchamia, brak +5) — każda łamie test.
- `node ./node_modules/typescript/bin/tsc --noEmit` (po `npm ci --ignore-scripts`): czysto, 0 błędów.
- Regresje (militia/siege/oblez/defender/garnizon/save, 28 testów bez *live*): PRZED vs PO identycznie — wszystkie EXIT=0 poza 3 padającymi tak samo na bazie (budynek-garnizon-test, pre-battle-save-test, wall-defenders-bonus-range-test: środowisko/vite/Chromium, nie regresja). city-militia-no-defenders-test 113/0, militia-garrison-* 17/0 i 8/0, siege-defenders 12/0, oblezenie* przechodzą.
- NIE ZMIERZONO: weryfikacja wizualna w przeglądarce (wiersz w panelu oblężenia), testy *live* wymagające Chromium; nie uruchamiano `npm run build/dev`.

## BLOKADY
Brak. node_modules usunięte po pracy.

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (weryfikacja założenia "zniszczona = zero żywych", pokrycie ścieżek Pomiń/Auto, ewentualna weryfikacja UI w Chromium).
## DEPLOY/PUSH: NIE WYKONANO
