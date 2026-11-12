STATUS: FAIL
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-WIRE-WAR-R7-AUDYT-Q1
GOAL: dokument dyspozycje/rust-port/p6/P6-W8-R7-AUDYT.md (audyt kolejności tury pin vs Rust, tabela wpięcia, ROZNICE B, wejścia, podział r7, pytania gameplay)
ZMIANY/COMMIT: oceniany 48f2853b8 (baza 46c42deab); diff = 2 pliki dokumentacyjne (P6-W8-R7-AUDYT.md, 01-operator-r1.md), zero .rs; allowlista OK
TESTY: git diff --check 46c42deab 48f2853b8 = kod 0 (czysto). Cargo nie uruchamiane (temat dokumentacyjny, brak zmian .rs). Zweryfikowane grepem na pinie 07d2fbd72 i bazie: 24 odwołań plik:linia Rust (playable.rs:565, events.rs:44, siege_*, war_turn_ai_ai, order_effects_lane, ai_diplomacy_turn, ...) zgodne; linie pinu funkcji i wywołań (38214, 38865-38873, 39131, 39276, 39515, 39552, 39564, 39637, 43035/43041/43046, 24229, 11734) zgodne. Claim "W8 nie wpina oblężenia/AI w run_war_turn" potwierdzony na 9164ab7d7 (turn_war_pipeline.rs nagłówek + brak wywołań poza testami).
BLOKADY: zarzuty niżej
RUNDY: 1/5 (Evaluator)
NASTĘPNY KROK: Operator r2 (to samo ID) — poprawić zarzuty Z1-Z5, potem Evaluator r2
DEPLOY/PUSH: NIE WYKONANO

ZARZUTY

Z1 (kryterium 1, krytyczne). Brak fazy barbarzyńców w kolejności pinu (sekcja 1). W runWorldEndTurn pin ma blok barbarzyńców po fazie AI i przed zwycięstwem: barbariansActive main.ts:43081, spawnCamps :43095, tickCamps :43137, decideBarbarianMoves :43266, sweepFortCaptures po ruchach AI/barbarzyńców :43428, a także sweepFortCaptures po fazie AI :43062. Tabela E0-E15 tego kroku nie ma (E13 kończy się na :43049, skok do E14 :43441). Konsekwencja błędna: ROZNICA B6 twierdzi, że pin "nie ma fazy Barbarians" / NIE_ZMIERZONO — to fałsz, dane były w pinie. Wiersz "Faza ... Barbarians" w tabeli (2) i pytanie o kolejność Barbarians (Rust 6 po Ai 5, pin: barbarzyńcy po AI-AI/auto-oblężeniach) pominięte. Wymagane: dopisać krok E13b z liniami i poprawić B6 (pozycja zgodna: po AI; ale brak handlera w Rust).

Z2 (kryterium 2, krytyczne). NIE_ZMIERZONO tam, gdzie odpowiednik jest w repo na bazie 46c42deab (dispatch zakazuje). Odpowiedniki istniejące, a w tabeli oznaczone NIE_ZMIERZONO/BRAK bez wskazania:
 - cleanupRegularWarOnPeace (:11884) i finalizePeaceTreatyBetween (:11911): war_turn_declare.rs:325 cleanup_regular_war_on_peace, :361 finalize_peace_between (oraz diplomacy_truce_flow.rs:116 finalize_peace_between);
 - breakTreatiesOnWar (:23688): alliance_war_obligation.rs:251 treaties_broken_by_war (do oceny pokrycia);
 - tickTruceExpiries (:12122): diplomacy_truce.rs:199 truce_expiry_action (+ diplomacy_truce_flow.rs);
 - tickCyclicResourceTradeDeals (:24077): diplomacy.rs:2620 build_cyclic_resource_transfers;
 - dobra wola D7: diplomacy_tick_war_brake.rs:350 dobra_wola_turn_step;
 - zarejestrujWypowiedzenie (:11713): diplomacy_aggressor.rs:309 zarejestruj_wypowiedzenie (tabela cytuje tylko declare_war);
 - deklaracja wymuszona, koniec wojny wg miast, maybeResolveRegularWarOnCityCapture: war_turn_declare.rs:105 declare_forced_wars, :385 register_regular_war_city_loss, war_turn_forced.rs:231 forced_war_step.
Dokument w ogóle nie wymienia modułów war_turn_declare.rs / war_turn_forced.rs (W4), choć siege_surrender.rs:33 i siege_transfer.rs:97 na nie wskazują. Dla każdego: podać plik:linia i status wpięcia (BRAK w run_war_turn jest prawdopodobny, ale musi być oparty na dowodzie, nie na NIE_ZMIERZONO). Wiersze E14 checkVictory: pin importuje checkVictory z ./game/victory (main.ts:1366), użycie :43481 — sprawdzić gra/src/game/victory.ts i potwierdzić BRAK portu w Rust (grep "victory" w engine/src: tylko pole victory_mode) zamiast NIE_ZMIERZONO. tickSiegeMachinesForCity (:18328), maybeAiAssaultAfterMachines (:18126): przeczytać ciało na pinie i wskazać odpowiedniki (siege_engine_build.rs, siege_sortie.rs, siege_enter_city.rs istnieją) lub jawnie BRAK z uzasadnieniem.

Z3 (kryterium 1). Nieprecyzyjne zakresy linii tabeli E: E6 "38683-38956" zawiera E7 "38820-38878" (nakładanie), E13 "40352-43049" nie obejmuje :43062-43430 (sweep forta, barbarzyńcy), a "E12 produkcja 39800-40100" nieanalizowane (kolejność względem E13 i B5 oparta na domyśle). Podać kroki z numerami linii bez nakładania; wskazać, że E7 jest wewnątrz pętli miast oblężonych, nie po E6 sumach.

Z4 (kryterium 1, drobne). Kroki D1/D2 mają wywołanie expireTreaties :24231 ale funkcja jest importem (main.ts:1531); tickDiplomacyPayments import :1560, wywołanie :24277 — poprawne, ale zarejestrujWypowiedzenie ma też wywołania :13177, :13221, :23816, :40449, :41940 (efekty deklaracji poza hamulcem — dokument w "efektach deklaracji wojny" ich nie wylicza, a dispatch żąda "efekty deklaracji wojny" w kolejności faz). Dopisać kroki deklaracji w fazie AI (:40449, :41940) do kolejności.

Z5 (kryterium 3, ryzyko planu). Podział r7: K4 ("efekty deklaracji") i K7 (D1-D7) opisane jako pisanie nowych funkcji, tymczasem część logiki jest już zportowana (Z2); bez korekty klocki zdublują pracę lub pominą W4. Ponadto K1 nazwany "W" i zależny od "ABC-2", a pytania Q1-Q4 w sekcji 6 nie mapują się na numery ABC; w dokumencie brak wyraźnego powiązania K→Q (K1/K2↔Q2, K4↔Q3, K5↔Q1, K6↔Q4). Uzupełnić po poprawce Z2.

Sprawdzone bez zarzutu: brak plików .rs i gra/ w diffie; brak Cargo.lock; kolejność Rust faz TurnPhase zgodna z events.rs:44; pytania Q1-Q4 dotyczą gameplayu; zależności K1->K2->K3/K6 spójne.

WERDYKT: FAIL (naruszone kryteria binarne 1 i 2). Poprawki wyłącznie dokumentacyjne; wrócić do Operatora z tym samym ID.
