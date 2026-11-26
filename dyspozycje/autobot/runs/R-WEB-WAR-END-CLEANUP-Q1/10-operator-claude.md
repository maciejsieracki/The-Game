# R-WEB-WAR-END-CLEANUP-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (porządek kodu + jedna poprawka wycieku stanu, zero zmian balansu)
TEMAT: R-WEB-WAR-END-CLEANUP-Q1 (WARENDCLEAN, #127)
GOAL: (L6) licznik zmęczenia wojną par (warWearinessByPairKey) czyszczony dla par wyeliminowanego właściciela — WYKONANE. (L2) usunięcie martwych stałych i nieaktualnych komentarzy wojen epoki — NIE WYKONANE w zakresie allowlisty (szczegóły niżej).
BAZA: 73798f8b3043a774f1a7304a163451a2faddff79 (origin/main), worktree wf_af453cb5-9d1-1, detach.
ZMIANY/COMMIT: patrz sekcja COMMIT na końcu (commit zawiera tylko: gra/src/game/war-weariness.ts, gra/src/main.ts, gra/tools/war-weariness-elimination-test.cjs, ten raport).

## L6 — WYKONANE

- `gra/src/game/war-weariness.ts`: nowa czysta funkcja `pruneWarWearinessPairs(store, keyHasOwner)` — usuwa wpisy, dla których `keyHasOwner(key)` jest true; zwraca liczbę usuniętych.
- `gra/src/main.ts`: import `pruneWarWearinessPairs` (linia 1754) i wywołanie w `eliminateOwner` (ok. linia 40456), po pętli `diplomacyFactorLog`, przed blokiem WIARYGODNOSC:
  `pruneWarWearinessPairs(warWearinessByPairKey, key => diploPairKeyHasOwner(key, ownerId));`
- Dotychczas `eliminateOwner` kasował `diplomacyRelations`, `diplomacyPairMeta`, `diplomacyFactorLog`, ale NIE wpisy `warWearinessByPairKey`. Stan trafiał do zapisu (`meta.warWearinessByPairKey`) jako duch. Wpisy innych par nie są ruszane (test sprawdza to).
- Test: `gra/tools/war-weariness-elimination-test.cjs` (nowy). 10/0:
  1. okablowanie: ciało `eliminateOwner` w main.ts zawiera wywołanie z właściwym kluczem;
  2. zachowanie funkcji na prawdziwym module (esbuild bundle z gra/src): usuwa 2 pary z właścicielem 5 (3-5, 5-7), zostawia 1-2 i 0-4;
  3. właściciel bez par: 0 usunięć;
  4. idempotencja: drugie wywołanie 0.
- Mutacja czerwona: kopia `gra/src` z usuniętą linią wywołania w main.ts, uruchomienie testu z `AI_SRC_DIR` → asercja okablowania FAIL, exit 1. Kopia usunięta po teście.

## L2 — NIE WYKONANE (blokada zakresu, decyzja do orkiestratora)

Analiza `dyspozycje/analizy/WOJNA-SCIEZKI-KONCA-2026-11-25.md` §3 L2 wskazuje dwa obiekty:

1. Martwe stałe `WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR`, `WOJNA_ZELAZO_WYMUSZONA_MAX_CZAS_TRWANIA_TUR`, `WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR` (= 20) w `gra/src/game/forced-war-bronze.ts:100`, `forced-war-iron.ts:93`, `forced-war-stone.ts:32`. Nie są używane w runtime (R9), ale SĄ importowane i przypięte przez testy: `tools/forced-war-bronze-test.cjs:172` (`eq(WOJNA_WYMUSZONA_MAX_CZAS_TRWANIA_TUR, 20, ...)`), `tools/forced-war-stone-test.cjs`, `tools/forced-war-iron-test.cjs`, `tools/forced-war-reguly-multi-turn-simulation-test.cjs`, `tools/praca-podzial-staly-50-50-test.cjs` (używa stałej jako WAR_END). Usunięcie złamałoby te testy, a dispatch zabrania osłabiania asercji (wyjątek tylko gdy test koduje nieistniejący kod). Nie usuwano.
2. Nieaktualne komentarze „2 miasta = koniec wojny” w `gra/src/game/forced-war-bronze.ts:19` oraz `gra/src/game/forced-war-iron.ts:38-46`. Pliki `forced-war-*.ts` NIE są w allowliście tematu (allowlista: main.ts, war-rules-multiwar.ts, diplomacy-*.ts, war-weariness*.ts, testy wojen w tools/). Nie edytowano — wymagana decyzja orkiestratora: dopisać `gra/src/game/forced-war-*.ts` do allowlisty (komentarze, bez zmiany kodu) albo wykonać w osobnym temacie.

Pozostałe kandydaty z dispatchu, sprawdzone i odrzucone (brak martwego kodu po FALI 908):
- Komentarz w `main.ts` ~41139 („wojny epoki kończą się tak samo jak klasyczne”) jest już aktualny (wpis z FALI 908).
- `isForcedPeaceEligiblePair` / `aiAiForcedPeacePairEligible` nie mają już wyłączeń epoki; wszystkie parametry są używane.
- `WAR_ERA_STONE` / `WAR_ERA_BRONZE` / `concurrentWarLimitForEra` z `war-rules-multiwar.ts`: używane (concurrentWarLimitForEra w evaluateInterCivWarGate), stałe WAR_ERA_* są eksportem używanym przez logikę epoki — nie są martwe po FALI 908. Nie usuwano.
- Brak innych wystąpień `forcedEra`/`WAR_END_EXCLUDE`/„pominięte P12/P20” w allowliście.

## TESTY (liczby z surowego wyjścia)

- `npx tsc --noEmit` → exit 0
- logic-test → `LOGIC OK (213/213)`
- tech-tree-test → `20 pass, 0 fail`
- research-test → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- unit-replace-test → `WSZYSTKIE TESTY ZIELONE (21/21)`
- combat-test → `All sanity checks passed.` (rc 0)
- ai-test → `297 passed, 0 failed`
- war-rules-multiwar-main-guard-test → `21 PASS / 0 FAIL`
- era-war-end-like-classic-test → `PASS 17 / FAIL 0`
- war-end-reason-log-test → `PASS=41 FAIL=0`
- forced-war-iron-test → `PASSED: 54 / FAILED: 0 / TOTAL: 54`
- diplo-forced-peace-pending-test → `PASS=40 FAIL=0`
- era-war-bronze-player-target-test → `45 passed, 0 failed`
- war-limit-truce-count-test → `19 pass / 0 fail`
- war-weariness-elimination-test (nowy) → `10 ok / 0 FAIL`
- ai-war-weariness-peace-test → `PASS=96 FAIL=0`
- diplo-weariness-forced-peace-test → `PASS=14 FAIL=0`
- diplo-weariness-migration-peak-test → `PASS=7 FAIL=0`
- `git diff --check` → czysto

Nie uruchamiano `npm run build`/`dev` (zakaz). Instalacja zależności: `npm ci` w worktree (bez builda).

## BLOKADY

- L2 w całości poza allowlistą (forced-war-*.ts) i z testami przypiętymi do stałych. Wymaga decyzji orkiestratora (patrz wyżej).

## RUNDY

1/5 — ostatni werdykt: brak (runda operatora). Decyzja wymagana: TAK — zakres L2 (allowlista forced-war-*.ts) do potwierdzenia.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wymienia `gra/src/main.ts` i `war-rules-multiwar.ts` jako miejsca L2, ale analiza lokalizuje L2 w `forced-war-*.ts`. Rozbieżność dokumentu z allowlistą.
- Stałe `WOJNA_*_MAX_CZAS_TRWANIA_TUR` są oznaczone w kodzie jako „parametr dla testów” (R9). Proponuję uznać je za zamierzone i zamknąć L2 bez usuwania (tylko komentarze).

## NASTĘPNY KROK

Evaluator: przegląd diffu (war-weariness.ts, main.ts, war-weariness-elimination-test.cjs) i mutacji. Orkiestrator: decyzja o zakresie L2 (dopisać forced-war-*.ts do allowlisty na same komentarze, albo zamknąć L2 jako nieaktualne/zamierzone).

DEPLOY/PUSH: NIE WYKONANO
