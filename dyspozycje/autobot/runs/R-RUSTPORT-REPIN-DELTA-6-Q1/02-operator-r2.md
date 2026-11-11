STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-REPIN-DELTA-6-Q1
GOAL: Odpowiedź na zarzuty FAIL rundy 1 (werdykt Evaluatora) — poprawka `dyspozycje/rust-port/p6/REPIN-DELTA-6.md`. Bez zmian kodu.
BAZA: runda 1 = commit `5353b023a` (cherry-pick na `638e90bea` = `73e924f06`); runda 2 = commit w tej gałęzi (SHA w sekcji ZMIANY-COMMIT).
RUNDA: 2/5

## Odpowiedzi na zarzuty

1. BŁĄD FAKTYCZNY — konwertery (`converterThroughputsForEra` / `CONVERTER_ERA_SCALING_PCT`). PRZYJMUJĘ. Port ISTNIEJE: `rust-port/engine/src/domain/turn_economy_resources.rs:142` (`CONVERTER_ERA_SCALING_PCT` = 0.10), `:197`, `:351` (`converter_throughputs_for_era`), używane w `turn_economy_advance.rs:320` i `turn_economy_preview.rs:196`. Szukałem po nazwie z webu, nie po snake_case. Temat „R-RUSTPORT-REPIN-PRZETWORNIKI-EPOKA-Q1” usunięty z propozycji; wiersz `converters.ts` w tabeli #8 poprawiony na „ISTNIEJE, stała ZGODNA”. Dryf wartości zmierzony: 0.10 = 0.10; cegielnia throughput 50 = 50, wyjście 2 = 2 (`turn_economy_resources.rs:54–62`, `converters.ts:86`); mnożnik odlewni = ta sama formuła `citizen_consumption_era_multiplier` (`:182–187`). Pozostały NIE_ZMIERZONO: pełny zbiór 6 id odlewni i `throughputFallback` odlewni.

2. BŁĄD FAKTYCZNY — `planned-march.ts` / `plannedMarchesToSave`. PRZYJMUJĘ. Port ISTNIEJE: `rust-port/engine/src/domain/pathfinding.rs:2250` `planned_marches_to_save`, użycie `general_quick_follow.rs:191`. Web: `gra/src/game/planned-march.ts:485` (operator podał :502 — błąd linii). Temat usunięty z „nowych”; wiersz przeniesiony do #9 (ZAPIS-MIGRACJE). Semantyka zapisu NIE_ZMIERZONO.

3. BŁĄD FAKTYCZNY — `pokojAiAi` / `przewagaMilitarna`. PRZYJMUJĘ. Cytowanie `diplomacy_truce.rs` było błędne (0 trafień). Poprawiona prawda, ZMIERZONO: 0 trafień `pokojAiAi|pokoj_ai_ai|minBilans|min_bilans` w `rust-port`; sekcja `przewagaMilitarna` (prog 0.20) nieobecna w `engine/data/derived/diplomacy-war-peace-params.json`. Trafienia `przewaga_militarna` dotyczą innego parametru `przewagaMilitarna_respekt` = 15 (`engine/data/diplomacy.json:14`, `engine/src/data/civilizations.rs:292–293`, `engine/src/domain/diplomacy.rs:236,341,557,601`). Oba wiersze = LUKA (ZMIERZONO), nie „poza wzmiankami”.

4. NIE_ZMIERZONO przy rzeczach mierzalnych:
   (a) `sojusz_pelny` — PRZYJMUJĘ, ZMIERZONO: web `gra/data/diplomacy-acceptance-points.json:6` = 130; Rust `rust-port/engine/data/diplomacy-acceptance-points.json:5` = 151. DRYF DANYCH.
   (b) `eraForcedWarStartTurnsFromEra` — PRZYJMUJĘ, ZMIERZONO: web `gra/data/war-rules-params.json:5` = 40 (stone/bronze/iron); Rust `diplomacy_multiwar_gate.rs:58` = 20.0, `:60` = 20.0 (komentarz `war_era_pool.rs:7` też „20”). DRYF DANYCH.
   (c) `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE` — ODRZUCAM wniosek „zgodne”. Wartość 5.0 w Rust (`turn_economy.rs:1675`) jest prawdziwa, ale web NIE MA stałej 5/typ: `grep UNITS_PER_TYPE gra/src` = 0 trafień; web `economy-upkeep.ts:688` `DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO = 1`, `:716–748` `buildingResourceUpkeep` = `floor(surowe utrzymanie Pieniądza × ratio)` na typ + `utrzymanie_surowce`. Model Rust jest sprzed commitów `956c9a6b7`/`c8ee037fb` (proporcjonalny) i `b1a5c1e80` (ceramika). Wiersz oznaczony DRYF LOGIKI (ZMIERZONO). Temat #8 dostaje ten dryf jako priorytet.
   (d) `AI_REJECTED_OFFER_COOLDOWN_TURNS` — PRZYJMUJĘ zgodność, ZMIERZONO: web `diplomacy-rejection-cooldown.ts:12` = 3; Rust `diplomacy_rejection_cooldown.rs:17` = 3.0.

5. Niespełnione GOAL „plik:linia” — PRZYJMUJĘ częściowo, ODRZUCAM pełną tabelę 206 hunków:
   - Nowe pliki mają długość (ZMIERZONO `git show | wc -l`): `siege-engine-build.ts` 109, `ai-army-composition.ts` 210, `army-follow-auto-merge.ts` 43, `ai-unit-replace-plan.ts` 92, `diplomacy-peace-proposal-timing.ts` 10. Wiersze `:1` zastąpione zakresem `:1–N`.
   - `combat.ts:472/` poprawiony na `combat.ts:514–516` (alias deprecated; `rangeDamageTw` def `:468`, mnożnik `:491`).
   - Nagłówki funkcji ZMIERZONE i poprawione (rundy 1 błędne): `ai.ts:1928` chooseCityProduction (było 2410), `ai-era-unit-promotion.ts:52` (było 26–62), `diplomacy-ai-forced-peace.ts:261,324` (było 249–364), `diplomacy-war-peace-profile.ts:381` (było 396), `empire-recruit-plan.ts:139` (było 144–198), `economy.ts:1214` (było 1226–1243), `economy-upkeep.ts:662` (było 674–808), `ai-resource-needs.ts:93` (było 104,136), `war-weariness.ts:218` (było 231–292), `siegeDefenders.ts:96,309` (było 36,99–101,314), `turn-economy.ts:2325` (było 85–2988), `diplomacy-proposals.ts:1071` (było 1092–1327), `diplomacy-peace-lock.ts:106` (ZMIERZONO), `siegeMachines.ts:29` (było :40).
   - Zakresy z rundy 1, których nie zmierzono, oznaczone NIE_ZMIERZONO w tabeli.
   - ODRZUCAM: pełne mapowanie 206 hunków na linie — wymaga semantycznego porównania każdego hunku, poza zakresem tej rundy; wpisane jako NIE_ZMIERZONO (sekcja 5 raportu).

6. FALA per wiersz — PRZYJMUJĘ częściowo. Dodana kolumna „Commit” z `git log 2339b3dab^..origin/main -- <plik>` dla wierszy kluczowych (np. `5f3b48852`, `e135f923f`, `c8ee037fb`, `956c9a6b7`, `b1a5c1e80`, `3f691a2f3`, `17be3f180`, `a259012fa`, `c8e3e4664`, `6218f2ab1`, `871762a74`, `a70768498`, `dc2292740`). FALA numer podawany tylko gdy jest w temacie commitu; w pozostałych wierszach `—` = NIE_ZMIERZONO. Usunięte niepotwierdzone przypisania FALA 547/504+/505+/531/585/587 z tabel jako pewne (zostają jako dług NIE_ZMIERZONO).

7. Wektory `meta.pin` — PRZYJMUJĘ. Lista plików z polem `"pin"` (ZMIERZONO `git grep -l '"pin"' rust-port/engine/tests rust-port/engine/data`) przypisana do tematów #5–#10 jako KANDYDACI (dopasowanie po nazwie/teście), z jawnym zastrzeżeniem, że przypisanie hunk→plik i zawartość `meta.pin` NIE_ZMIERZONO. Dodatkowo testy `.rs` z trafieniami słów kluczowych (ZMIERZONO).

8. Sekcja #9 brakowała — PRZYJMUJĘ: dodana (`cities.ts:866,884`; `planned-march.ts:485` ↔ `pathfinding.rs:2250`; Rust `has_siege_machines` `turn_economy_attrition.rs:126–127`).

9. Zakres 556 vs 563 — PRZYJMUJĘ wyjaśnienie: zakres 556–606 (szerszy), wiersze 556–562 nie są usuwane. Wiersz CITYCD/cooldown: `diplomacy_rejection_cooldown.rs` ZGODNY (ZMIERZONO, pkt 4d). Nie potwierdzam „CITYCD FALA 557 już w Rust” bez osobnego pomiaru — NIE_ZMIERZONO.

10. Nagłówek GOAL i wnioski: korekty wpisane w `REPIN-DELTA-6.md` (sekcje 1, 2 „korekty rundy 2”, 3, 4, 5).

## Wnioski po rundzie 2 (dla orkiestratora)
- Zmierzone DRYFY DANYCH: `sojusz_pelny` 151 vs 130; `eraForcedWarStart` 20 vs 40.
- Zmierzony DRYF LOGIKI: utrzymanie surowcowe budynków (model 5/typ vs proporcjonalny do Pieniądza) — #8.
- Zmierzone LUKI: `pokojAiAi`, `przewagaMilitarna.prog`, `bez_wylomu_max_tur`, `unitsPerSiegeEngine`, budowa machin, `ranged_damage_mult` (wg rundy 1, potwierdzone przez Evaluator).
- Zmierzone ZGODNOŚCI: konwertery (stała 0.10, cegielnia 50/2, formuła odlewni), `AI_REJECTED_OFFER_COOLDOWN_TURNS` 3, `BUILDING…` (nie dotyczy — model zmieniony).
- Usunięte fałszywe nowe tematy: PRZETWORNIKI-EPOKA, planowane marsze.

## Ograniczenia
- Cargo, testy i build NIE uruchomione (zakaz dispatchu). Pomiary = git grep / git show / git log.
- Pełna semantyka 206 hunków NIE_ZMIERZONO.

NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje rundę 2 względem commitu tej gałęzi i wskazanych linii; po PASS orkiestrator integruje (merge-base + diff --stat).
TESTY: git grep / git show / git log / wc -l (lista w REPIN-DELTA-6.md §1–§3). Cargo: NIE_ZMIERZONO.
BLOKADY: brak. Pytania ABC nie zadawano (zgodnie z dispatchem).
RUNDY: 2/5 (werdykt rundy 1: FAIL; ta runda: odpowiedź na wszystkie zarzuty)
DEPLOY/PUSH: NIE WYKONANO
