# R-WEB-TEST-DEBT-BASE-RED-MAIN-Q2 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (6 z 7 pozycji zielonych lub sklasyfikowanych; diplo-truce-live: U1/L1 zielone, L2 zablokowane harnessem — NIE_ZMIERZONO w pełni)
DOMAIN: GAME (tylko testy/narzędzia; kod gry NIETKNIĘTY)
TEMAT: R-WEB-TEST-DEBT-BASE-RED-MAIN-Q2
GOAL: po merge doprowadzić do zielonego albo jawnie sklasyfikować 7 czerwonych testów na main (klasy A/B/C/D).

## Baza i merge
- Dispatch (DODATEK) wskazuje bazę kandydata r1 `7b7f97682` + `git merge origin/main`. Workflow wskazuje `63a26921c`; ten SHA NIE jest przodkiem origin/main (merge-base 005cd9ab0). Przyjęto wariant z DODATKU.
- `git checkout --detach 7b7f97682`, potem `git merge origin/main` (79abbf0bf): merge czysty, bez konfliktów, wikiBundle nie wymagał regeneracji. SHA merge: `c11432926` (commit z zmianami testów i raportem: patrz pole sha w odpowiedzi).
- `npm ci` w `gra/` wykonane w worktree (71 pakietów). `tsc --noEmit` w gra: exit 0 (po zmianach też).

## Tabela (ZMIERZONO: liczby z surowego wyjścia)
| Skrypt | Wynik PRZED (po merge) | Klasa | Działanie | Wynik PO |
|---|---|---|---|---|
| diplomacy-city-cession-r3-test | 56 pass / 17 fail | A | Scenariusz `runAI` dostaje pozycję SIŁY MILITARNEJ (`silaMilitarnaAI/Partner`); oddanie bramkuje `peacePosMil==='slabsza'` (rw nie bramkuje, ai.ts ~7075). Progi żądania (rw, C) na 10 tur + 1 zdobyte miasto (zmęczenie 0,6 < 0,8). Asercje „20 tur” zamienione na: 20 tur → NIE + pokój bezwarunkowy (zmęczenie ≥0,8 wyprzedza, ai.ts ~7050). „2 miasta → NIE” zamienione na „2 miasta przy zmęczeniu → oddaje” (desperacja obniża minimum do minMiastAi=2, ai.ts ~7077) + „1 miasto → NIE”. | 72 pass / 0 fail |
| json-descriptions-sync-test | 17 pass / 2 fail | A | a1: usunięty `czlowiek.rabatCenyPokojuMax` (celowy ubytek, R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1) dodany do dozwolonych ubytków. c1: sprawdza `wearinessPeaceX` (progKoncaZmeczenia) i `wearinessUnconditionalEndDue` = `wearinessPeaceX >= 1` (stara forma nie istnieje). | 19 pass / 0 fail |
| diplo-truce-r1-test | 28 pass / 3 fail | A | P2b: parytet komunikatu bramki po zamianie liczb na `#` (dawny podział po „ — miasta” nie pasuje do tekstu). P7/M2: `pwBalance` jest tylko na ścieżce odrzucenia; scenariusz na WAR_MID (12 tur, poziom 0,6). P10: przy poziomie ≥0,8 pokój jest bezwarunkowy (#361), więc bramkę PW testujemy na WAR_MID. | 31 pass / 0 fail |
| diplomacy-stol-pw-sum-test | 167 pass / 1 fail | A | Asercja „2 umów” → „2 umowy” (poprawna odmiana; zgodna z formatUmowyCount i polish-language-audit-q1-guard-test). Kod poprawny, niezmieniany. | 168 pass / 0 fail |
| trade-route-remove-stock-flow-live-test | exit 2 (brak BUNDLE_DIR) | D | Test sam buduje bundle vite poza repo, gdy BUNDLE_DIR nie wskazuje index.html (brak kroku przygotowania, nie defekt gry). | 12 passed / 0 failed |
| diplo-truce-live-test | przed: U1 OK, L1 OK, L2 zawieszony (run zabity po >15 min); pierwszy przebieg po poprawkach: U1g wyjątek click (timeout 10 s) | D (harness) | (a) endOneTurn czeka na stan `isEndTurnInProgress` zamiast stałych 150 ms; (b) U1g: klik DOM po potwierdzeniu `!disabled` (sonda: przycisk widoczny, włączony, `elementFromPoint` = przycisk); (c) przed L2 zamknięcie audiencji (`closeAudience`) i czekanie na brak overlay; (d) L2b (odmowa) jawnie NIE_ZMIERZONO w tym scenariuszu. | U1 8/8 OK, L1 4/4 OK, L2 FAIL (BLOKADA 1) |
| r-bitwa-etykieta-tozsamosc-strony-real-render-test | PASS (1/1 przebieg) | D (czas bootu) | Niestabilności nie odtworzono; test już czeka na stan (menu obecne + stabilna liczba dzieci body, 3 próbki). Brak zmiany testu. | PASS (1/1) — niestabilność NIE_ZMIERZONO na N>1 |

## Pięć bramek referencyjnych (po `npm ci`, ZMIERZONO)
- logic-test: exit 0, 213 linii PASS, 0 FAIL.
- tech-tree-test: exit 0, „20 pass, 0 fail”.
- research-test: exit 0, „PASSED: 33 / FAILED: 0 / TOTAL: 33”.
- unit-replace-test: exit 0, 0 linii FAIL.
- combat-test: exit 0, „All sanity checks passed.”

## git diff --check
Exit 0.

## BLOKADY
1. diplo-truce-live-test, L2 (okno rozejmu/wygaśnięcie): po zamknięciu audiencji tura zatrzymuje się na 2 (cel 5). Stan przy przerwaniu: `inProgress=false`, `overlays=1`, bez tekstu bramki. Objaw zgodny z otwartym tematem #390/#415 („harness nie domyka tury”). Nie naprawiono bez diagnozy endTurn (osobny temat). Asercje L2a–L2e NIE zostały zweryfikowane.
2. L2b (gałąź odmowy po wygaśnięciu rozejmu): NIE_ZMIERZONO w tym scenariuszu (wymaga zasiewu armii; oznaczone jawnie w teście).
3. r-bitwa real-render: 1 przebieg PASS; flaky nie odtworzony — NIE_ZMIERZONO na N>1.

## DECYZJA_DO_ORKIESTRATORA (nie rozstrzygnięte w kodzie)
- Gałąź „tury wojny ≥20” żądania miasta (`AI_MIASTO_ZADANIE_TURY_WOJNY`) jest martwa: zmęczenie ≥0,8 (tura 16) wyprzedza ją bezwarunkowym pokojem (ai.ts ~7050). Test dostosowany do OBECNEGO zachowania (klasa A, z notą). Zmiany kodu NIE wykonano.
- Desperacja zmęczenia obniża minimum miast AI do 2 już przy turze 10 — zachowanie zgodne z kodem; do potwierdzenia przez właściciela, czy zamierzone.

## Kandydaci klasy B (błąd kodu) — do osobnych tematów R-WEB-*
- Brak. Żadna z 7 pozycji nie wykazała błędu kodu gry. Obserwacja (nie B): #376 (AI nie proponuje pokoju bezwarunkowego przy zmęczeniu ≥0,8) — w ai.ts ~7050 bezwarunkowa propozycja istnieje; rozstrzygnięcie #376 należy do W80B, nie do tego tematu.

## UWAGI-DLA-ORKIESTRATORA
- Baza: patrz sekcja „Baza i merge” (rozbieżność dispatch vs DODATEK).
- Testy live zapisują do katalogów tymczasowych; nie nadpisano `dyspozycje/**/dowody/*.png`.
- Po pracy usunięte: bundle w scratchpadzie oraz `gra/node_modules` (patrz końcowy krok).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet): zweryfikować klasy A z dowodem (diff testów); decyzja o L2 (diagnoza endTurn w #390) i ewentualne wydzielenie L2b na osobny temat.
DEPLOY/PUSH: NIE WYKONANO
