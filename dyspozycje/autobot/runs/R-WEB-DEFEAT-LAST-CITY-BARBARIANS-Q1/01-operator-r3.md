STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1
GOAL: utrata ostatniego miasta gracza (także na rzecz barbarzyńców) = przegrana: ekran `przegrana`, `gameOver=true`, brak dalszych tur; bez regresji (start przed stolicą, hot-seat, scenariusze testowe).
ZMIANY/COMMIT: baza `4d1916f2c`; start `e613d2e8f` (ocalone zmiany); commit Operatora R3 `dc376caff` (branch `web-wip/DEFEAT-r3-op`, bez push).
 - `gra/src/game/victory.ts` (z e613d2e8f): `checkDefeat` = brak miast i `graczKiedysMialMiasto` (domyślnie true); klauzula osadników USUNIĘTA (`liczbaOsadnikow` @deprecated, bez wpływu), komentarz z decyzją właściciela 2026-10-31.
 - `gra/src/main.ts` (z e613d2e8f + R3): `sprawdzPrzegranaPoUtracieMiasta` wołane w onResolved bitwy barbarzyńców (async `launchIncomingMapFieldBattle`, po bloku VICTORY CHECK); JEDEN hak `__defeatTestDebug`; R3: dodano `setPlayerEraForTest`/`getPlayerEra` (playtest startuje w ostatniej epoce -> samotny gracz wygrywa DOMINACJĄ w 1. turze, co wyprzedza przegraną w `checkVictory`; bez tego S1-S3 były nierozstrzygalne).
 - `gra/tools/defeat-last-city-test.cjs` (jednostkowy 14/0), `gra/tools/defeat-last-city-live-test.cjs` (Chromium; R3: izolacja epoki, `endTurnAndSettle` timeout 45 s).
 - dowody: `evidence/defeat-S1-osadnik-utrata-miasta.png`, `gate-*.txt` (jedna linia `EXIT=` na końcu).
 - Hak z wip1 (`__...barbarians-live`) NIE przenoszony: jeden hak, scenariusze S1-S3 pokryte.
DIAGNOZA (zmierzone):
 - H1 potwierdzona: `victory.ts` (baza) `isEliminated && osadnicy===0 && kiedysMial` - osadnik blokował przegraną (main.ts ~38866 przekazuje `liczbaOsadnikow`). `kiedysMial` NIE blokował: w S1/S2 `playerEverOwnedCityByOwner` ustawione po starcie (przegrana wykryta).
 - H2 potwierdzona: atak barbarzyńców na bronione miasto -> async bitwa, onResolved po bloku VICTORY CHECK (main.ts ~38833+) -> przegrana dopiero w następnej turze; naprawione wywołaniem po bitwie. Ścieżka `captureCityWithoutBattle` (S1/S2) jest wykrywana przez końcowy check tej samej tury.
 - H3: `ownerId=-1` po zdobyciu (S1 `ownerIdAfter=-1`), `isEliminated` liczy `ownerId===0` poprawnie.
 - H4: reguła zmieniona zgodnie z dispatchem.
TESTY (PRZED = na `4d1916f2c`, PO = na HEAD; logi `gate-przed-*`/`gate-po-*`):
 - tsc --noEmit EXIT=0.
 - `defeat-last-city-test` 14/0; mutacje: M1 `&& false` 6/8, M2 bez `kiedysMial` 12/2, M3 klauzula osadników 13/1 (wszystkie padają); oryginał identyczny, 14/0.
 - `defeat-last-city-live-test` (realny bundle do scratch, Chromium, 1 przeglądarka, `finally`): 18/0 (S1 osadnik+1 miasto -> przegrana; S2 bez osadnika -> przegrana; S3 dwa miasta -> gra trwa, tura rośnie; 0 pageerror); mutacja `&& false` -> 14/4 (pada). Pierwszy bieg przed dodaniem izolacji epoki: 15/3 (dominacja w t.2) - zmierzone i naprawione.
 - PRZED=PO: diplo-truce-r1, city-cession 79 + r3, aggressor 73+15, war-era-counter-test 37/0, multiwar 57/21, peace profile 198, gate/sim/main-guard/d7 EXIT=0, peace-lock, barbarians-test 213/0, victory-test 12/0, victory-screen 11/0, miasto-zdobycie-raport 117/0, hotseat-etap7 59/0, hotseat-human-owners 29/0, unit-owner-emblem-ring 15/0; znane czerwone bez zmian: civ-matrix-ai-diplomacy-wiring 42/1, ai-test 274/20.
BLOKADY / NOTATKI:
 - `hotseat-drugi-fotel-tura-test` (Chromium) EXIT=2 identycznie PRZED i PO (timeout `.civ-newgame .start`, 3 próby) - infra środowiska, nie regresja.
 - ZAŁOŻENIA: nazwy dispatchowych bramek "diplomacy 148", "truce-live 23", "ring 15" dopasowano do istniejących plików (`diplomacy-*` bez jednego pliku 148, `diplo-truce-live` Chromium i `war-era-counter-live` NIE_ZMIERZONE - koszt/ryzyko infra); diplomacy-148 NIE_ZMIERZONE. Hak `setPlayerEraForTest` zeruje `zbadane` (tylko playtest).
 - Czyszczenie: `gra/node_modules` usunięty, artefakty w scratch.
RUNDY: 3/5
NASTĘPNY KROK: Evaluator (niezależnie: tsc, defeat-last-city-test, defeat-last-city-live-test z `npm ci` + mutacje, przegląd diffu `dc376caff` vs `4d1916f2c`).
DEPLOY/PUSH: NIE WYKONANO
