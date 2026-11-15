# 02a — Obrona Operatora — R-RUSTPORT-P4-1F1-OVERLAY-TYPES (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F1-OVERLAY-TYPES
GOAL: kształt DTO nakładek (pathRoute.turnStops, BuildHighlightKind, cultureRange/religionRange, SiegeCampDto) zgodny z pinem 07d2fbd72; CONTRACT_VERSION 2.
ZMIANY/COMMIT: kod bez zmian (ea84a130b). W obronie dochodzi tylko ten raport, gałąź `obrona/R-RUSTPORT-P4-1F1-OVERLAY-TYPES` na d81eaba5a. Baza b90894920 (= origin/rust-port/parity-v2 według dispatchu).
TESTY: bramki nie były ponownie uruchamiane, bo kod się nie zmienił. Obowiązują wyniki Operatora i Evaluatora: view-model fmt/clippy/test 0 (85/0/0), renderer 0 (537/0/0).
BLOKADY: brak. Uwagi spoza allowlisty są przekazane orkiestratorowi (pkt 3, 4, 7).
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

**0. Weryfikacja Evaluatora (baza, allowlista, bramki, wektory, mutacje).** To nie jest zarzut, więc nie wymaga odpowiedzi. Wynik zgadza się z raportem 01-operator-r1.md.

**1. PathRouteDto, SiegeCampDto, nowe BuildHighlightKind i zasięgi nie mają jeszcze wołającego w Rust.** ODRZUCAM jako wadę tego tematu. Dispatch, sekcja ZAKRES, zleca F1 jako zmianę samych typów DTO. Producenci i konsumenci są w P4-1F2/F3/F5/F6, P4-1G Q5/Q6 i P4-1H Q5 (rozpoznanie P4-1F, wiersz F1). Evaluator sam uznaje to za dopuszczalne. Wpis w rejestrze (REJESTR-RUST / kolejka P4-1F) należy do orkiestratora, bo pliku nie ma na allowliście.

**2. Testy (c) i territory nie porównują wyników z rustowym producentem (engine/src/domain/territory.rs:493,523).** ODRZUCAM jako wadę tego tematu. Dispatch, sekcja WEKTORY, wymaga wektorów z pinu, kształtu JSON i round-trip. Nie wymaga różnicowania wyników z silnikiem. Allowlista nie obejmuje `rust-port/engine/**`, więc taki test nie mógł tu powstać. Porównanie z producentem należy do P4-1F2. Evaluator wskazuje to samo.

**3. lib.rs nie reeksportuje PathRouteDto, PathTurnStopDto ani SiegeCampDto.** ODRZUCAM zmianę w tym temacie. `rust-port/view-model/src/lib.rs` jest poza allowlistą dispatchu, a zmiana pliku spoza allowlisty to FAIL według R-PROC-AUTOBOT §9. Typy są publiczne przez `pub mod overlays;` (lib.rs:34 @ d81eaba5a), więc API jest kompletne, choć niespójne kosmetycznie. Dopisanie reeksportu w kolejnym temacie, który dotyka lib.rs (np. P4-1F2), jest jednolinijkową zmianą. Przekazuję to orkiestratorowi.

**4. Kontrakt P4-1-RENDER-DTO-CONTRACT.md §3.5/§3.7 nie zgadza się z CONTRACT_VERSION=2.** ODRZUCAM zmianę w tym temacie, bo plik jest poza allowlistą. Raport 01 zgłasza to w uwagach. Potrzebny jest osobny temat dokumentacyjny, do rozpisania przez orkiestratora.

**5. Brak walidacji spójności właściciela przy duplikatach heksu w campHexes i brak scalania między miastami.** ODRZUCAM jako wadę DTO. Dowody z pinu 07d2fbd72:
- `render/siegeCampSync.ts:30-45`: `campOwnerByHex` dla każdego heksu bierze `units.find(...)`, czyli pierwszą jednostkę na heksie, której właściciel jest różny od właściciela miasta. Duplikaty tego samego heksu w obrębie jednego miasta dostają więc z konstrukcji tego samego właściciela. Producent, który odtworzy tę funkcję 1:1, nie wygeneruje niespójności.
- Scalanie między miastami (`main.ts:17514-17517`, `allCampOwners.set`, wygrywa ostatnie miasto) dzieje się po stronie renderera w webie, przy budowie mapy dla `siegeMarkerRenderer.sync`. DTO jest celowo per miasto (§5 pkt 1 rozpoznania P4-1F), a regułę „wygrywa ostatnie miasto w kolejności cities[]” musi odwzorować adapter P4-1G Q5.
- Dispatch ogranicza zmiany w `validate.rs` wyłącznie do walidacji `turn` („TYLKO walidacja turn”), więc dodatkowa walidacja byłaby naruszeniem allowlisty.

Przekazuję orkiestratorowi do zapisania w dispatchu P4-1G Q5: adapter ma przyjąć regułę webu (ostatnie miasto wygrywa), a producent P4-1F ma odtworzyć `units.find` (pierwsza jednostka).

**6. turnStops nie są walidowane względem hexes.** ODRZUCAM. Dispatch, sekcja ZAKRES (a) i allowlista, dopuszcza w `validate.rs` wyłącznie walidację `turn`. Pin gwarantuje przynależność przez samą konstrukcję: `game/planned-march.ts:116-141` dodaje stopy tylko z `clamped[i-1]` i `clamped[last]`, czyli z elementów samej trasy. Rozszerzenie walidacji to osobna decyzja kontraktu, którą można dopisać do tematu dokumentacyjnego z pkt 4. Sprawdziłem też ponownie zakodowaną regułę `turn`: `turnNum` startuje od 1 i rośnie tylko przez `turnNum++` po każdym push. Push z deduplikacją nie powtarza tej samej wartości, więc reguła „≥ 1 i ściśle rosnąco” jest poprawna względem pinu.

**7. Cargo.lock renderera w bazie bez civ-view-model.** ODRZUCAM jako zarzut tematu. Evaluator sam określa to jako stan bazy. Cargo.lock nie jest commitowany (dispatch: „NIE commituj Cargo.lock”), a w diffie b90894920..ea84a130b go nie ma. Do wiadomości orkiestratora.

## Podsumowanie

Przyjętych zarzutów z poprawką kodu jest 0, odrzuconych z dowodem 7 (pkt 1–7), a pkt 0 to weryfikacja. Kod ea84a130b pozostaje bez zmian. Uwagi dla orkiestratora: rejestr zależności (pkt 1), temat dokumentacyjny dla kontraktu §3.5/§3.7 oraz ewentualnej walidacji turnStops względem hexes (pkt 4 i 6), reeksport w lib.rs przy najbliższym temacie z lib.rs na allowliście (pkt 3), reguła scalania właścicieli obozów do dispatchu P4-1G Q5 (pkt 5).
