STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-TICKDIPLO-GEN-Q1
GOAL: obrona Operatora R1 wobec zarzutów Evaluatora (02-evaluator.md, commit 39d4cbff7); rozstrzygnięcie każdego zarzutu jako PRZYJMUJĘ albo ODRZUCAM z dowodem.
ZMIANY/COMMIT: BRAK zmian w kodzie i wektorach. Kod operatora bez zmian: dc9fd0ae8 (baza fdd24d04a). Raport operatora: 1c134273c. Ta obrona: commit dokumentacyjny na gałęzi R-RUSTPORT-P6-TICKDIPLO-GEN-Q1-wip/operator (SHA w odpowiedzi orkiestratora). Allowlista zachowana (tylko dyspozycje/autobot/runs/R-RUSTPORT-P6-TICKDIPLO-GEN-Q1/02a-obrona.md). Cargo.lock nie commitowany (usunięty z worktree).
TESTY (odtworzone przez Operatora w tej rundzie obrony):
  - cargo test --test p6_tickdiplo: EXIT 0, 1 passed (tick_pair_matches_pinned_web_tick_diplomacy_on_vectors); CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo.
  - Regeneracja z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (git archive gra/src gra/data do katalogu poza repo, esbuild 0.24.2 poza repo): 2000 wierszy, pokrycie war 794 / peace 1206, warPositiveDelta 0, md5 cdb127682eb36f0714217080500ffe0b = commitowany tick.json. Trzecia niezależna regeneracja, wynik identyczny.
  - MUTACJA (zarzut 6, odtworzona): rust-port/engine/src/domain/diplomacy.rs linia 764 `if at_war && delta > 0.0` zmieniona na `> 0.5`; cargo test --test p6_tickdiplo: EXIT 101, FAILED, panic tests/p6_tickdiplo.rs:115. Źródło przywrócone (git checkout -- pliku); git status czysty poza usuniętym Cargo.lock.
  - NIE powtórzono cargo fmt / clippy / cargo test --lib w tej obronie: kod testu i src nie zmieniły się od rundy 1 (dc9fd0ae8), a bramki były zielone w R1 i u Evaluatora. Jeśli orkiestrator wymaga świeżego dowodu bramek na SHA obrony, trzeba je ponowić.

ODPOWIEDZI NA ZARZUTY:

Zarzut 1 (luka parytetu karaWspolnaGranicaDelta): PRZYJMUJĘ, z dowodem. Zarzut jest prawdziwy; Operator nie wymienił go w NIE_ZMIERZONO w R1 (błąd raportu).
  Dowody:
  - web, pin 07d2fbd72 gra/src/game/diplomacy.ts:1744 `karaWspolnaGranicaDelta?: number`, :1800 `dZ += ctx.karaWspolnaGranicaDelta ?? p.ekspansjaGranica_zaufanie_perTura`.
  - web, gra/src/game/diplomacy.ts:598-605 sharedBorderPenaltyForEpochs: epoka pary >=3 -> ekspansjaGranicaZelazo_zaufanie_perTura = -4; >=2 -> ekspansjaGranicaBraz_zaufanie_perTura = -3; inaczej ekspansjaGranica_zaufanie_perTura = -2 (gra/src/game/diplomacy.ts:162-166).
  - produkcja, gra/src/main.ts:22879 i :41356 ustawia karaWspolnaGranicaDelta z sharedBorderPenaltyForEpochs(empireEpochForOwner(a), empireEpochForOwner(b), ...).
  - Rust, rust-port/engine/src/domain/diplomacy.rs:701-710 TickContext: brak pola stawki, jest tylko `common_border: bool`; kara z diplomacy.rs:760-761 to stały `params.common_border_trust_per_turn` = -2.0 (diplomacy.rs:357).
  - Generator: rust-port/engine/tests/p6_tickdiplo_gen.mjs:108 ustawia wyłącznie `ctx.karaWspolnaGranica`; `karaWspolnaGranicaDelta` nie jest emitowane (0/2000, grep). Web więc zawsze używa -2, czyli stawki epoki 1.
  - Test: tests/p6_tickdiplo.rs:68 mapuje `karaWspolnaGranica` -> `common_border` bez odwzorowania stawki.
  Skutek: test przechodzi, bo generator nie wytwarza przypadków epoki 2/3. Dla par z epoką >=2 web daje -3 lub -4, a Rust zawsze -2. Test nie ujawnił tego błędu, więc wg kryterium 3 nie jest to BLOCK tego tematu, ale parytet tickDiplomacy NIE jest zamknięty dla tej gałęzi.
  Rozstrzygnięcie w tym temacie: brak zmian kodu (allowlista; src/ zakazany). Rozbieżność zapisana jako NIE_ZMIERZONO (patrz niżej). Poprawka wymaga osobnego tematu: (a) pole stawki w Rust TickContext (src/), (b) generator emituje epokowe stawki (-2/-3/-4), (c) wektory i test rozszerzone. Propozycja ID: R-RUSTPORT-P6-TICKDIPLO-BORDER-EPOCH-Q1. Decyzja, czy traktować to jako BLOCK parytetu, należy do orkiestratora.

Zarzut 2 (test tylko DiplomacyParams::default(), brak poziomów trudności i getEffectiveDiplomacyParams): PRZYJMUJĘ jako zakres. Operator zgłosił to w R1 w NIE_ZMIERZONO. Dowód: web getEffectiveDiplomacyParams (gra/src/game/diplomacy.ts:591) i DIPLOMACY_DIFFICULTY_DELTA (:487) wpływają na parametry; generator używa 'normal' (delta 0) i Rust default. Bez zmian kodu w tym temacie; osobny temat, jeśli owner chce pokrycia poziomów.

Zarzut 3 (dispatch wskazuje nieistniejące pliki i złą linię): PRZYJMUJĘ jako korektę zakresu, zgodnie z oceną Evaluatora.
  Dowody: git grep na fdd24d04a nie znajduje ai_diplomacy_turn.rs ani tick_pairs_relation_scores w rust-port/. W pinie 07d2fbd72 tickDiplomacy jest w linii 1810 (zgodnie z dispatchem), w bazie fdd24d04a w linii 1719 (ten sam kod, inna wersja pliku). Jedyny konsument tick_pair w src/ to DiplomacyState::tick_pair (rust-port/engine/src/domain/diplomacy.rs:1658). Test wywołuje tick_pair bezpośrednio, zgodnie z intencją dispatchu.

Zarzut 4 (zanik urazów co 20 tur, wygasanie traktatów, relacjaOgolna, stanWojny, NaN/Infinity nieobjęte): PRZYJMUJĘ jako zakres, nie błąd. Wszystkie pozycje są w nagłówku generatora i w NIE_ZMIERZONO R1. Bez zmian.

Zarzut 5 (test nie uruchamia generatora; zgodność z pinem chroni tylko pole pin i md5): PRZYJMUJĘ jako ograniczenie, ODRZUCAM jako defekt kryterium. Kryterium 1 wymaga, by wektory były generowane z pinu (nie ręcznie) i by regeneracja była identyczna (md5 w raporcie). Oba warunki spełnione i potwierdzone trzykrotnie (Operator R1 dwukrotnie, Evaluator, Operator w obronie). Test nie uruchamia generatora, bo ten wymaga Node, esbuild i wypakowania gra/ poza repo; dispatch tego nie wymaga. Ograniczenie: zmiana wektorów bez zmiany pola pin nie zostanie wykryta przez `cargo test`. Propozycja: osobny check CI, poza tym tematem.

Zarzut 6 (testy mutacyjne nieobjęte; asercje, ignore, wektory ręczne): ODRZUCAM zarzut o słabości testu; PRZYJMUJĘ, że pełny mutation testing nie był zmierzony przez Operatora w R1. Dowód w tej obronie: zmiana `delta > 0.0` na `> 0.5` w diplomacy.rs:764 powoduje FAIL testu (EXIT 101, panic p6_tickdiplo.rs:115); źródło przywrócone. Brak #[ignore] w p6_tickdiplo.rs. Porównanie bitowe (f64), wektory z regeneracji (md5 zgodny).

Zarzut 7 (bramki odtworzone, EXIT 0): PRZYJMUJĘ jako potwierdzenie. Operator w tej rundzie odtworzył cargo test --test p6_tickdiplo (EXIT 0). fmt/clippy/lib nie powtórzono w tej obronie (patrz TESTY).

NIE_ZMIERZONO (dopisek do R1; stan na tę obronę):
  - karaWspolnaGranicaDelta / epokowe stawki granicy (-3 w epoce 2, -4 w epoce 3) po stronie web; Rust zawsze -2. Generator i test pokrywają tylko epokę 1. [NOWE, zarzut 1]
  - poziomy trudności easy/hard i getEffectiveDiplomacyParams. [zarzut 2]
  - mutation testing: zmierzono jedną mutację (diplomacy.rs:764, `> 0.5`), FAIL testu. To nie jest pełny mutation testing. [zarzut 6]
  - regeneracja wektorów nie jest częścią `cargo test`; zgodność z pinem = md5 + ręczna regeneracja. [zarzut 5]
  - pozostałe pozycje z R1 bez zmian.

BLOKADY: brak blokad merytorycznych dla tego tematu (kod operatora nietknięty, test zielony, mutacja wykryta). Otwarta decyzja dla orkiestratora: rozbieżność stawki granicy (zarzut 1) to realna luka parytetu w kodzie produkcyjnym Rust, nieujawniona przez test. Trzeba zdecydować, czy oznaczyć parytet tickDiplomacy jako niepełny i uruchomić R-RUSTPORT-P6-TICKDIPLO-BORDER-EPOCH-Q1. Nie rozstrzygam tego sam.
RUNDY: 2/5 (obrona R1; kolejna runda Evaluatora/FC wg orkiestratora)
NASTĘPNY KROK: Evaluator i Final Control na SHA obrony (dokumentacja); decyzja orkiestratora w sprawie zarzutu 1 (osobny temat BORDER-EPOCH vs. BLOCK parytetu). Bez zmian w kodzie w tej rundzie.
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi wip R-RUSTPORT-P6-TICKDIPLO-GEN-Q1-wip/operator; rust-port/parity-v2 i origin/main nietknięte).
