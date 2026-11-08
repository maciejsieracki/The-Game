STATUS: PASS
DOMAIN: GAME (WEB — gra/)
TEMAT: R-WEB-SPICHLERZ-HUD-PARAMS-Q1
GOAL: panel miasta pokazuje zużycie Spichlerza z TYCH SAMYCH parametrów co silnik (loadSpichlerzDrainParams wg trudności); parametr wymagany (brak ciszy 25 przy pominięciu); wartości JSON bez zmian.
ZMIANY/COMMIT: kod+testy+logi `1d31fa318` (baza detached `37148c80a`). Raport: ten plik (commit osobny).
- `gra/src/game/building-resource-gate.ts`: `paySpichlerzDrainForCity(…, dryRun: boolean, params: SpichlerzDrainParams)` — usunięte defaulty `dryRun = false` i `params = SPICHLERZ_DRAIN_DEFAULT_PARAMS`; usunięta stała `SPICHLERZ_DRAIN_DEFAULT_PARAMS`; `resolveOwnedBuildingInactiveStatus` opts `drainParams` wymagany (było `?`). `SPICHLERZ_DRAIN_FALLBACK_PER_TURN` zostaje (używa go tylko loader przy złym kluczu JSON).
- `gra/src/ui/cityPanel.ts`: import `loadSpichlerzDrainParams`; wywołanie w `computeView` (~1281) i w `appendOwnedBuildingRow` (~9278) podają `loadSpichlerzDrainParams(data.econParams as unknown as RawConverterParamsJson, cfg.difficulty ?? 'normal')` — ten sam wzorzec co `turn-economy.ts:1406`.
- `gra/src/game/turn-economy.ts`: BEZ zmian (był już wymagany param w pipeline; jedyne wołanie 1358/1797 podaje params).
- Testy: NOWY `gra/tools/spichlerz-hud-params-parity-test.cjs`; poprawki `owned-building-inactive-test.cjs` (podaje drainParams), `spichlerz-drain-keys-test.cjs` (bez DEFAULT_PARAMS; asercja że stała nie istnieje; 44 asercje jak przed), `spichlerz-panel-food-parity-test.cjs` (podaje params 25/25/25).
- Logi: `gates-pre/` (34, baza 37148c80a) i `gates-post/` (35), każdy z jedną linią `EXIT=`. `gra/node_modules` usunięty po etapie.
- Zero zmian w: gra-robocza, WERSJE.md, rust-port, econ-params.json, auto-improvements.ts, citizen-resource-upkeep.*.
TESTY:
- K1 parytet: spichlerz-hud-params-parity-test 66 pass / 0 fail — easy/normal/hard z danymi 10/40/60 (wszystkie 3 klucze), Spichlerz I i II, magazyn val-1/val/val+1/25: podgląd HUD (dryRun + loadSpichlerzDrainParams, jak cityPanel) == realna wypłata w `advanceCityEconomy` (Ceramika, Sól, tooltip nieaktywności).
- K2 mutacja: (a) w teście podgląd z 25 rozjeżdża się z silnikiem w >=3 przypadkach (asercja); (b) realna mutacja źródła — w cityPanel.ts podmieniłem wywołanie na literał {25,25,25} → test wiringu 64 pass / 2 FAIL (plik przywrócony z kopii). Dodatkowo pominięcie parametru = błąd kompilacji (TS2554), potwierdzone w R2 poprzedniego tematu i przez wymagany typ.
- K3 `npx tsc --noEmit` EXIT=0 po zmianach.
- K4 bramki PRE vs POST (34 wspólne testy): wszystkie podsumowania i EXIT identyczne; wymagane: spichlerz-drain-keys 44/0, spichlerz-drain-pipeline 21/0, owned-building-inactive 4/0, spichlerz-panel-food-parity 11/0, empire-food-b5 34/0, owner-economy 20/0, diplomacy 148/0, war-era-counter 82/0, ring (unit-owner-emblem-ring-civ-color) 15/0. Czerwone jak na bazie (PRE=POST): deposit-building-gate 1F, hex-plony 4F, mennica 7F, resource-usage 2F, spichlerz-deficyt 4F, spichlerz-widocznosc 8F, spichlerz-wzrost 7F, cities-buildings-production-owner-contract 1F; EXIT=1 bez podsumowania: ai-major-economy, pr141-matrix-only, szczescie-przebudowa-skali. (spichlerz-drain-keys po poprawce testu przeliczony ponownie: 44/0 EXIT=0; pierwszy bieg POST padał na `undefined` params w teście — poprawione.)
BLOKADY: brak. Nie zweryfikowano w przeglądarce (zmiana bez UI-wizualnej: te same wartości 25/25/25) — NIE_ZMIERZONO wizualnie.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (ta sama ID), potem Final Control; integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
