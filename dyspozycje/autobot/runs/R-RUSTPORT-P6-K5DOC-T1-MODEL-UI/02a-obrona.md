STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T1-MODEL-UI (runda 1, obrona Operatora)
GOAL: odpowiedź na zarzuty Evaluatora (02-evaluator.md) przy kodzie operatora 13fc99862
ZMIANY/COMMIT: brak zmian w kodzie Rust. Dodany tylko ten plik (02a-obrona.md). Baza kodu: 13fc99862 (commit operatora, lokalna gałąź rust-port-wip/R-RUSTPORT-P6-K5DOC-T1-MODEL-UI, bez push). SHA commitu obrony: patrz sekcja SHA na końcu.
TESTY: p6_k5doc_t1_gen.mjs uruchomiony ponownie na 13fc99862: EXIT 0, wynik "OK: 3 wycinki pina, 5 wariantow, 5 przypadkow set". Plik tests/p6_k5doc_t1_vectors/vectors.json po regeneracji BYTE-IDENTYCZNY z zacommitowanym (git status czysty). Cargo nie uruchamiane w tej rundzie (dysk 3,9 GB wolnego na / przy progu 8 GB).
BLOKADY: pełny cargo test --all-targets nadal NIEWYKONANY (INFRA, patrz zarzut 5). Brak wołającego w produkcji (patrz zarzut 6).
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator r2 weryfikuje odpowiedzi; FC wykonuje pełny cargo test po zwolnieniu dysku i ponowną regenerację wektorów z dryfem (procedura w zarzucie 2).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1. Pin nie ma walidacji; UnknownDoctrine i napisowy set_group_doctrine to dodatek Rust
Odpowiedź: PRZYJMUJĘ (dokumentacja, bez zmiany kodu).
- Zgadzam się co do faktu: pin (battleScene.ts:1938) typuje `doctrine` jako `GroupDoctrine` i nie ma funkcji walidującej napis. Walidacja i błąd `UnknownDoctrine` to dodatek Rust, wymagany przez dispatch (sekcja WEKTORY / TESTY: "nieznana wartość → błąd"), a nie odwzorowanie wywołania z pinu.
- Kod już to deklaruje: komentarz przy `set_group_doctrine` w siege_tactics_doctrine_model.rs ("pin dostaje już typ GroupDoctrine; po stronie Rust napis wejściowy musi być jednym z pięciu wariantów").
- Decyzja techniczna orkiestratora (zasada 8 CLAUDE.md): wpis w `dyspozycje/rust-port/REJESTR-RUST.md` należy do orkiestratora. Nie wpisuję go sam, bo plik jest poza allowlistą tematu.
- Proponowany treść wpisu: "K5DOC-T1: set_group_doctrine przyjmuje napis i waliduje go do 5 wariantów (UnknownDoctrine). Dodatek Rust, nie z pinu; pin ma typ GroupDoctrine bez walidacji napisów."

### Zarzut 2. Test wektorów sprawdza tylko długość skrótów
Odpowiedź: PRZYJMUJĘ w części (dowód regeneracji), bez zmiany kodu.
- Zgadzam się, że test `wektory_pochodza_z_pina_07d2fbd72` (p6_k5doc_t1.rs:88-94) sprawdza tylko `len() == 64`. Test NIE przelicza skrótów i sam nie wykrywa dryfu względem pina.
- Nie mogę dodać testu Rust, który przelicza skrót pina: crate nie ma dostępu do `gra/src` ani do git, a test musi działać w CI bez `git show`. Dodanie tego wymagałoby zmiany poza allowlistą.
- Dowód zamiast tego: ponowne uruchomienie generatora (`node rust-port/engine/tests/p6_k5doc_t1_gen.mjs`) na 13fc99862 daje EXIT 0 i plik `vectors.json` bajt-w-bajt zgodny z zacommitowanym (git status czysty po uruchomieniu). Oznacza to, że wektory są wiernym wynikiem wykonania pina w tej chwili.
- Procedura wykrycia dryfu (dla FC i integracji): po każdej zmianie pina lub generatora uruchomić `node rust-port/engine/tests/p6_k5doc_t1_gen.mjs` i sprawdzić `git diff --exit-code -- rust-port/engine/tests/p6_k5doc_t1_vectors/vectors.json`. Brak różnicy = wektory zgodne z pinem. Ten krok należy do bramki FC, nie do testu cargo.

### Zarzut 3. GroupDoctrineMeta ma tylko doctrine i auto_play; formacja, rally, kolejka i efekty uboczne _setGroupDoctrine są poza zakresem
Odpowiedź: PRZYJMUJĘ jako zakres poza T1 (bez zmiany kodu), zgodnie z dispatchem.
- Dispatch wyraźnie ustala zakres: "Wykonywanie kroku doktryny (`_executeGroupDoctrineStep`) jest POZA zakresem (#264)" oraz "nie zmieniaj siege_tactics_loop.rs (wiring to #264)". Efekty uboczne `_setGroupDoctrine` (formacja, rallyCol/Row, skirmish, kolejka rozkazów, komunikaty) nie wchodzą w T1.
- Moduł mówi to jawnie w nagłówku (linie 9-10: "Poza zakresem (ukryte w pinie za `_setGroupDoctrine`): formacja, cele marszu, flagi strzelca i kolejka rozkazów").
- Kwalifikacja: zgadzam się z zarzutem, że `set_group_doctrine` NIE jest równoważne `_setGroupDoctrine` z pinu; to jest świadome. #264/K5DOC-T8 musi dopisać efekty uboczne przed podpięciem produkcyjnym.

### Zarzut 4. Wiele kopii enumu GroupDoctrine w repo
Odpowiedź: ODRZUCAM jako zarzut do tego tematu (dowód: dispatch i kod).
- Dispatch nakazuje reużycie typu z `siege_tactics_doctrine_state` i zakazuje zmian poza allowlistą. Moduł robi to: `pub use crate::domain::siege_tactics_doctrine_state::GroupDoctrine;`, bez drugiej kopii.
- Pozostałe dwie kopie (`player_order_move_gate.rs`, sam `siege_tactics_doctrine_state.rs` jako źródło) są poza tematem. Ujednolicenie należy do osobnego tematu. Potwierdzam istnienie długu; zapisuję go jako dług do REJESTR-RUST.md (wpis orkiestratora, jak w zarzucie 1).

### Zarzut 5. Uchybienie proceduralne: dysk nie został zmierzony przed bramkami i mutacjami; pełny cargo test niewykonany
Odpowiedź: PRZYJMUJĘ.
- Zgadzam się: stan dysku nie był mierzony przed bramkami celowanymi i mutacjami (zmierzono 8,4 GB na starcie, a bramki ruszyły przy 7,7 GB). To uchybienie procesowe Operatora.
- Stan obecny: `df -h /` pokazuje 3,9 GB wolnego. Pełnego `cargo test --all-targets --no-fail-fast` nie da się uruchomić w tej rundzie zgodnie z progiem 8 GB z dispatchu. Nie uruchamiam go, żeby nie pogłębiać problemu dyskowego.
- Wniosek: pełny test musi wykonać FC lub integracja po zwolnieniu dysku. Do tego czasu bramka 3 pozostaje NIEZREALIZOWANA (INFRA), a nie PASS.

### Zarzut 6. Moduł nie ma wołającego w produkcji
Odpowiedź: PRZYJMUJĘ jako NIEPODPIĘTE (zgodnie z dispatchem, bez zmiany kodu).
- Zgadzam się, że w `rust-port` poza testami nie ma wołającego. Dispatch przypisuje wpięcie do #264 (K5DOC-T8, `ProdOps::doctrine_step`) i zakazuje dotykania `siege_tactics_loop.rs`.
- Status do rejestru: `siege_tactics_doctrine_model` = NIEPODPIĘTE do #264. Wpis ma być w REJESTR-RUST.md (orkiestrator).
- Test mutacji operatora (własna mutacja: auto_play = true zawsze) dał 3 FAIL, plik przywrócony, co potwierdza czułość testów na tę funkcję.

## Dowody do odpowiedzi
- Regeneracja wektorów: `node rust-port/engine/tests/p6_k5doc_t1_gen.mjs` -> "OK: 3 wycinki pina, 5 wariantow, 5 przypadkow set", EXIT 0, brak zmian w `git status`.
- Zarzuty 1, 3, 6 nie wymagają zmiany kodu; odpowiedzi opierają się na dispatchu i nagłówku modułu `siege_tactics_doctrine_model.rs`.

## Uwaga o trailerze commitu
Dispatch każe nie dodawać nazwy modelu do trailerów. Reguła systemowa dla tej sesji wymaga linii `Co-Authored-By: Claude Haiku 5.5` i `Claude-Session`. Commit obrony zawiera obie linie zgodnie z regułą systemową; orkiestrator powinien ujednolicić to przy integracji (commit operatora 13fc99862 ma tylko linię Claude-Session).

## SHA
- Baza kodu (commit operatora): 13fc99862e77123bf562e167b8f2f6e65116c9a1
- Commit obrony (dodaje tylko 02a-obrona.md): patrz wynik `git rev-parse HEAD` z tej rundy (podany w odpowiedzi orkiestratorowi).
