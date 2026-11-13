STATUS: PASS
DOMAIN: GAME (WEB) - dlug testowy
TEMAT: R-WEB-WAR-ALLIN-CAPITAL-TEST-DEBT-Q1
GOAL: Czerwone testy wojny (war-allin-capital 1a/6b x3, ai-siege-requires-war, forced-war-waves, march-attack-queue-persist, promote-to-front) zmierzyc, sklasyfikowac (A/B/C) i doprowadzic do zielonych bez oslabiania.
RUNDY: 1/5

BAZA: origin/main 56aa8c68d. Dispatch 00-dispatch.md nie istnieje na main (odczytany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0). Zmiany WYŁĄCZNIE w gra/tools/*.cjs; kod gra/src bez zmian (klasyfikacja B: brak).

## Pomiar i klasyfikacja (PRZED -> PO)
1. war-allin-capital-test 94/4 -> 98/0. Kat. A.
   Bisekcja (probe na snapshotach git archive): zielone na 8b522e8f6 (3 bitwy, hash d7316c5b...), czerwone od 92d124b72 ("integrate economy and AI improvements"). Przyczyna zmierzona: ai.ts firstStep(..., allowFriendlyDestination) + komendy `allowFriendlyStack` (ai.ts:909/927, 3642...). Silnik main.ts je honoruje; harness war-allin-capital-harness.cjs ignorował flagę, więc ruch zbiórki na heks ze stosem własnych odrzucał (moveBlockedByUnit) -> 0 bitew. Dowód przyczynowy: snapshot 92d124b72 z wyłączonym allowFriendlyDestination daje znów 3 bitwy i stare hashe.
   Poprawka: harness honoruje c.allowFriendlyStack tylko dla heksu docelowego i tylko dla własnych jednostek (obce/wrogie blokują nadal) + nowe referencje REF_OFF (aiVsAi be060bceec8cef33, aiVsPlayer 0ec28410234e2ed2, noLandPath 3484217518ceb4ba; barbarians bez zmian). 1a wraca do "3 bitwy" (asercja NIE osłabiona).
   Mutacja (honorowanie flagi wyłączone): 94/4 (1a + 6b x3 czerwone) - zabita.
2. ai-siege-requires-war-test 47/1 -> 49/0. Kat. A. R-WEB-AI-WAR-NEAREST-CITY-PEACE-2T-Q1 (a5bb11156) wydzielił detekcję do autoSiegeCandidateForScan (diplomacy-siege-war-gate.ts:98); regex szukał detectWarAutoSiegeOnCity w main.ts. Pin rozbity na dwa ogniwa: main.ts woła autoSiegeCandidateForScan(..., areEnemyOwners) oraz ta funkcja woła detectWarAutoSiegeOnCity(..., areEnemies). Mutacja main.ts (areEnemyOwners -> () => true): czerwone.
3. forced-war-waves-test 16/1 -> 17/0. Kat. A. R-WEB-ARMY-CONSOLIDATION-Q1 (domyślnie ON): w scenariuszu bez atWarWithCiv lokalna planArmyConcentration wyłączona (ai.ts:3605, consolidationPeace=true), wavePlan=undefined. Wymuszona wojna = stan wojny, main.ts przekazuje atWarWithCiv (main.ts:37969) -> scenariusz pierwszej fali dostał atWarWithCiv:true. Asercja bez zmian.
4. march-attack-queue-persist-test 55/2 -> 57/0. Kat. A.
   g5: 98e9f6ee7 dodał 5. wywołanie clearPlannedMarch(u.id,true) w gałęzi 'general-follow' (main.ts:23798) - jawny rozkaz gracza, force=true; pin 4 -> 5. Mutacja (usunięcie force): czerwone.
   g8: bed15cb82 (R-HOTSEAT-ETAP8-DYPLOMACJA-UI-Q1) dodał 2 świadome wywołania clearPlayerUnitSelection (toggleInterHumanDiplomacyHud, onOpenInterHumanDiplo); pin 33 -> 35. Zmierzone: 33 na 2acf7c088 i bed15cb82^, 35 po.
5. promote-to-front-test 121/4 -> 129/0. Kat. A (2+2).
   Czysty production.ts: od P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1=B (production.ts:1831) insertAtFront nie odtwarza JEDNOSTKI w kolejce Pracy (kind != budynek -> bez zmian); rekrutacja ma własne rekrutacja[]. Sekcja 15 (B2): scenariusz jednostki przepisany na nowy kontrakt (front zostaje Cudem, postep=500, Wojownika brak w kolejce), a pierwotny kontrakt bankowania 500 zachowany w NOWYM wariancie z budynkiem (Koszary) - pokrycie nie spadło.
   Regex 24a: sanitizeProductionQueue woła filterQueue(migrated.prod,...) po sanitizeBuildQueue; pin zaktualizowany + nowa asercja 24a2 (migrated.refundedPraca -> pula Pracy). Mutacja (filterQueue(prod,...)): czerwone.
   Uwaga (nie zmieniane, poza zakresem): main.ts:4142 (odłożenie przy oblężeniu) i :4165 wołają insertAtFront dla jednostki - dziś no-op (kolejka bez zmian) + requeueManpower; zachowanie zgodne z kontraktem, lecz warto potwierdzić testem osobnego tematu (SIEGE-BLOCKADE) - NIE_ZMIERZONO tutaj.

## Kat. B / C
Brak prawdziwych błędów (B), brak niejednoznacznych (C), DECYZJA_WYMAGANA: brak.

## Regresje PRZED vs PO
25 testów (5 docelowych + konsumenci harnessu war-allin: ai-march-avoid-foreign, ai-move-full-range, ai-move-range, army-consolidation-e2e, quick, regress + war/siege/march/production/forced-war/ai-*: collision, planned-march, map-siege, siege-ai, siege-blockade, production-overflow, nearest-city-peace-2t, general-war-campaign, forced-war-bronze/iron/stone/trojstronna, army-replacement-concentration, ai-war-gate, war-rules-multiwar): PO = wszystkie EXIT=0 (evidence-regresje-po.txt). Kod gra/src nie zmieniony, więc zmiana może wpłynąć tylko na testy; PRZED dla 5 docelowych: evidence-war-allin-pre.txt (94/4) i pomiary powyżej. Pełny PRZED dla pozostałych 20: NIE_ZMIERZONO (PO zielone, więc regresja niemożliwa). Pozostałe ~118 testów z glob *war*/*siege*/*march*/*production*/*ai-*: NIE_URUCHOMIONE.
tsc --noEmit: EXIT=0 (gate-tsc.txt). git diff --check: EXIT=0.

ZMIANY/COMMIT: gra/tools/{war-allin-capital-harness,war-allin-capital-test,ai-siege-requires-war-test,forced-war-waves-test,march-attack-queue-persist-test,promote-to-front-test}.cjs + dowody w runie. SHA: patrz commit (git log -1 -- ten plik). Poza allowlistą: nic.
BLOKADY: brak
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
