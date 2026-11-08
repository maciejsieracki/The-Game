STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-PEACE-RULES-R8R9-Q1
GOAL: R8 blokada wojny epoki przy Relacji >= 100; R9 usunięcie automatycznego końca wojen wymuszonych (czas i 2 miasta), koniec wyłącznie pokojem.
ZMIANY/COMMIT: r1 e08a76a61 (baza 2d3f49d0d); r2 52aed5fb3 (kod, testy, sonda usunięta). Raport: ten commit. Nie wypchnięto.
Allowlista r2: gra/src/game/forced-war-{bronze,common,iron,stone}.ts, gra/src/main.ts (hak testowy + komentarze R9), gra/tools/**, runs/R-WEB-PEACE-RULES-R8R9-Q1/**. Zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri.

ODPOWIEDZI NA ZARZUTY:
1. Kryt. 4 (żywy Chromium) -- PRZYJMUJĘ. tools/forced-war-r9-no-auto-end-live-test.cjs (NOWY): dla Brązu, Kamienia, Żelaza: startTurn cofnięty o 30 tur, realny endTurn, 2 miasta przez applyCityCaptureToMap, pokój przez finalizePeaceTreatyBetween. Wynik 22 pass / 0 fail, 0 pageerror.
2. Test zachowania R9 + mutacja -- PRZYJMUJĘ. Ten sam test. Mutacja (przywrócony auto-koniec po 2 miastach i po 25 turach, tylko Brąz, poza repo kopią main.ts, potem cmp przywrócił): 2 FAIL (po endTurn i po zdobyciu 2 miast), exit 1.
3. Duplikaty asercji -- PRZYJMUJĘ częściowo. Bronze: 7 kopii R9 -> 1 (main-guard 28->22 PASS). Stone: 4 kopie -> 1 (15 PASS). Iron: 4 -> 1 (35 PASS). Przywrócone: "Kamień i Brąz zachowują własne moduły i rejestry" (iron-main-guard, sekcja 8; stone-main-guard "Kamień zachowuje..."), "resolveSiegeSurrender nadal przypisuje city.ownerId = newOwner" (stone i iron), "zwykła wojna AI↔AI nietknięta" (iron). ODRZUCAM przywrócenie asercji kolejności względem hooka: hak nie istnieje po R9, asercja nie ma przedmiotu.
4. Bramki NIE_ZMIERZONO -- PRZYJMUJĘ. Zmierzone na bazie (git archive 2d3f49d0d) i na HEAD:
   - ring 15 = tools/unit-owner-emblem-ring-civ-color-test.cjs: 15/0 (baza) = 15/0 (HEAD).
   - diplo-tick-war-brake 17 = tools/diplo-tick-war-brake-mutation-test.cjs: 17/0 (baza) = 17/0 (HEAD); brake-test 51/0 i brake-unit 69/0 bez zmian.
   - forced-war-waves: 16/1 baza = 16/1 HEAD (ta sama porażka).
   - forced-war-bronze-new-game-reset: ReferenceError forcedEraPeaceUntilNextEraByPairKey baza = HEAD (błąd sprzed tematu).
   - load-game-blockers-exec 15/0 baza = HEAD.
   - bronze-main-guard: baza 28/0 (nie 27/1 jak w dispatchu; nie odtworzono). HEAD 22/0.
   - war-rules-multiwar-live-test: NIE_ZMIERZONO. Baza: exit 124 po 580 s (przebieg OFF nie kończy się w limicie). HEAD nie mierzono z tego samego powodu.
5. Martwy kod / sonda / pola -- PRZYJMUJĘ częściowo. Sonda tools/forced-war-iron-mutant-probe.cjs USUNIĘTA (52aed5fb3). Stałe WOJNA_*_MAX_CZAS_TRWANIA_TUR zostają (importują je testy i praca-podzial-staly-50-50-test.cjs) i są oznaczone komentarzem "NIEUŻYWANA w runtime" w forced-war-{bronze,iron,stone}.ts:89-95. capturedBy* w ForcedWarPairState opisane w forced-war-common.ts (zostają dla formatu zapisu; nowe wojny 0/0).
   ODRZUCAM zarzut o imporcie shouldEndForcedWarByCityCount: NIE jest martwy. Używany przez ścieżkę zwykłych wojen: main.ts:1237 (import), main.ts:31533 (maybeResolveRegularWarOnCityCapture, regularWarCapturedByPairKey).
6. Format raportu -- PRZYJMUJĘ. Ten plik. SHA w treści. Zmiany testów wypisane plik:linia poniżej.

ZMIANY TESTÓW (plik:linia, HEAD 52aed5fb3):
- tools/forced-war-bronze-main-guard-test.cjs:51 (jedyna asercja R9; sekcja 1 przepisana)
- tools/forced-war-stone-main-guard-test.cjs:80-87 (R9 jedyna + siege), :112 przywrócony "Kamień zachowuje moduł i rejestry"; usunięta const stoneSurrenderHook
- tools/forced-war-iron-main-guard-test.cjs:183 (jedyna R9), :187 (siege), :191 (zwykła wojna), :258 (Kamień i Brąz moduły/rejestry); usunięta const ironSurrenderHook
- Usunięte wcześniej w r1 (pure-funkcje shouldEnd*): bronze-test, iron-test, stone-test (sekcje "R-WOJNA-WYMUSZONA-REGULY-Q1"), zastąpione kontraktem źródła lub stałą; miasto-zdobycie-raport-test.cjs:252,268,431 (koniec sliceu na komentarz R9).

BRAMKI (HEAD 52aed5fb3, working tree czysty poza raportem):
- tsc --noEmit: PASS (exit 0).
- forced-war-relation-gate-test 14/0; war-era-counter-test 82/0; war-rules-multiwar-test 57/0; multiwar-main-guard 21/0.
- diplo-war-peace: profile-unit 198/0, gate 11/0, main-guard 28/0, sim 22/0, d7 8/0, live 17/0 (jeden przebieg 15/2, rerun 17/0; niepowtórzone).
- diplomacy-test 148/0; peace-lock 9/0; hotseat-etap6d 'WSZYSTKIE TESTY PASS'; flaga-mp-nie-gasnie 32/0; trojstronna 23/0 i main-guard 14/0; iron-era-enter-turn-save-load 20/0; miasto-zdobycie 117/0; reguly-sim ALL GREEN.
- Nowe: forced-war-r9-no-auto-end-live-test 22/0 (live).

MUTACJE (dowód czerwienienia):
- R8: próg 100->101 w forced-war-common.ts:206 -> forced-war-relation-gate-test exit 1 (5+ FAIL, w tym "Relacja 100 BLOKUJE"). Przywrócone, cmp OK.
- R9: przywrócenie auto-końca Brązu (2 miasta + limit czasu) -> r9-no-auto-end-live-test 20/2 FAIL, exit 1. Przywrócone, cmp OK.

RYZYKO R8: domyślna Relacja startowa = startZaufanie 20 + startRespekt 30 = 50 (data/diplomacy.json:37-38); korekta perNacja <= +9 (civ-ai-data.ts:202). Statycznie < 100. Modyfikator wiarygodności D4 (applyWiarygodnoscD4ToRelation, diplomacy-layers.ts:166) NIE_ZMIERZONO.
ZAŁOŻENIA: (1) R8 dotyczy każdej pary (relationScore(getDiploRelation)). (2) Stałe MAX_CZAS zostają jako parametry. (3) Live test zapisuje screenshoty do runs/R-WEB-PEACE-RULES-Q1/evidence przy domyślnym argumencie (diplo-war-peace-live-test) -- po jego uruchomieniu wycofano zmiany PNG; to nie jest zmiana tematu.
BLOKADY: war-rules-multiwar-live-test NIE_ZMIERZONO (timeout >580 s, baza też). Brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje 52aed5fb3 i ten raport; FC po PASS. Integracja orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO
