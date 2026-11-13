# OBRONA Operatora — R-RUSTPORT-P6-K5I2B2-POKRYCIE-R2-Q1 (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-RUSTPORT-P6-K5I2B2-POKRYCIE-R2-Q1 (#111/#143)
GOAL: obrona zarzutów Evaluatora (02-evaluator.md, commit c46d21bca) dla commitu Operatora a8d331fff. Bez zmian kodu.
ZMIANY/COMMIT: brak zmian w kodzie gry i testach w tej obronie. Commit obrony zawiera tylko ten plik (02a-obrona.md). Commit operatora bazowy: a8d331fff (baza cfa1edd31).
RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Final Control, z uwagami 1–3 z sekcji „Uwagi dla FC” poniżej.
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja przed obroną (wszystko uruchomione ponownie na a8d331fff)

- Generator `node rust-port/engine/tests/p6_siege_tactics_blow_full_gen.mjs` na a8d331fff: `git status` czysty po uruchomieniu, czyli vectors.json odtwarza się bajt-w-bajt. Licznik: `total 1200`, `slingerRanged 1`, `lucznikRanged 69`.
- Baza cfa1edd31 (generator z bazy, uruchomiony i przywrócony): `total 1200`, `slingerRanged 4`, `lucznikRanged 11`.
- `cargo fmt --check` (engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings` (engine): EXIT 0.
- `cargo test --lib`: 100 passed, 0 failed.
- `cargo test --test p6_siege_tactics_blow_full`: 3 passed, 0 failed (w tym `zgodnosc_z_pinem_end_to_end`).
- Pełny `cargo test --no-fail-fast` (engine), CARGO_TARGET_DIR poza repo: EXIT 0, sumarycznie 3261 passed, 0 failed, 1 ignored.
- Uwaga o pierwszej próbie pełnego testu: pierwszy przebieg w tej sesji padł na etapie linkowania (`ld terminated with signal 7 [Bus error]`, test `data_compliance`). Przyczyną było zapełnienie dysku (0 MB wolnego w czasie linkowania), a nie kod. Po zwolnieniu miejsca przebieg powtórzono i zakończył się EXIT 0.
- Czas pełnego przebiegu: NIE_ZMIERZONO (nie mierzono dokładnie).

## Odpowiedzi na zarzuty

### Zarzut 1: pokrycie procarza (slinger) spadło z 4 do 1 na 1200 wektorów
**Odpowiedź: ODRZUCAM jako zarzut blokujący tę rundę. Fakt przyjmuję jako uwagę dla FC.**

Dowód faktu: zmierzone 4 (baza cfa1edd31) → 1 (a8d331fff). Asercja `n > 0` nadal przechodzi (1 > 0). Spadek jest skutkiem przesunięcia strumienia PRNG przy dodaniu losowania piesego łucznika (patrz zarzut 2), a nie celowej zmiany gałęzi procarza.

Dlaczego odrzucam jako blokujący:
- Dispatch (sekcja GOAL i ALLOWLISTA) ogranicza temat do gałęzi łuczników: „Generator obejmuje gałąź łuczników z pinu”. Procarz nie jest w GOAL ani w kryteriach końca.
- Dodanie wymuszenia procarza analogicznego do łucznika to nowa gałąź generatora i kolejna pełna regeneracja vectors.json. To wykracza poza zakres dispatchu i wymagałoby ponownej regeneracji, której dispatch nie przewiduje.
- Zalecenie Evaluatora (osobny temat albo próg dla slingera) przyjmuję jako właściwą drogę. Proponuję osobny temat `R-RUSTPORT-P6-…-SLINGER-POKRYCIE` do decyzji orkiestratora.

### Zarzut 2: zmiana losowania przesunęła strumień PRNG, wszystkie 1200 wektorów się zmieniły (diff ok. 193k linii)
**Odpowiedź: PRZYJMUJĘ jako uwagę dla FC (fakt potwierdzony, bez zmiany kodu).**

- Dowód: `git diff --stat cfa1edd31 a8d331fff` → 4 pliki, 96829 insertions, 96413 deletions; vectors.json to głównie diff 193205 linii.
- Regeneracja jest wymagana przez dispatch (kryterium 1: „Generator odtwarza vectors.json bajt-w-bajt”). Zmiana nie jest niezamierzona, bo dodanie losowania przed `unitDraw` zmienia kolejność wywołań PRNG dla wszystkich przypadków.
- Stare przypadki nie są w pliku vectors.json po zmianie. Pozostają w historii Git: w cfa1edd31 oraz w poprzednim commicie operatora 9c1d39991 (zachowanym w `refs/keep/K5I2B2-POKRYCIE-R2-Q1-prev`). Sprawdzono, że commit 9c1d39991 istnieje w repo.

### Zarzut 3: próg `lucznik >= 14` jest dużo niższy niż zmierzone 69
**Odpowiedź: ODRZUCAM zmianę progu w tej rundzie. Zarzut przyjmuję jako ryzyko do decyzji.**

- Kryterium 2 dispatchu wprost wymaga `lucznik >= 14`. Zmiana progu na inną wartość to decyzja liczbowa, nie wykonawcza. Zgodnie z zasadą 3 CLAUDE.md taką decyzję podejmuje orkiestrator lub właściciel, nie Operator.
- Fakt potwierdzony: próg 14 nie chroni przed spadkiem 69 → 15. Przyjmuję to jako znany niedomiar.
- Zalecenie dla orkiestratora: pytanie ABC do właściciela o próg „ratchet” (np. `>= 60` albo dokładnie `== 69` przy regeneracji) jako osobną decyzję testową. Nie zmieniam progu bez tej decyzji.

### Zarzut 4: pełny `cargo test` nie zakończył się w 580 s (EXIT 124), wynik 3261 niepotwierdzony
**Odpowiedź: PRZYJMUJĘ zarzut jako słuszny w odniesieniu do dowodu z raportu Operatora, i potwierdzam wynik przez ponowny pełny przebieg.**

- Raport Operatora (01-operator-r1.md) podawał EXIT 0 i 3261 passed. Evaluator słusznie zauważył, że w jego przebiegu nie zakończono całości w 580 s. Przyjmuję, że czas przebiegu był dłuższy niż limit.
- Potwierdzenie: w tej obronie uruchomiono pełny `cargo test --no-fail-fast` od zera (świeży CARGO_TARGET_DIR poza repo). Wynik: EXIT 0, 3261 passed, 0 failed, 1 ignored. Log lokalny, poza repo.
- Ograniczenie: czas przebiegu NIE_ZMIERZONO. Pierwszy przebieg w tej sesji padł na zapełnionym dysku (patrz „Weryfikacja przed obroną”), nie na kodzie.

### Zarzut 5 (potwierdzenie bez zarzutu, do odnotowania)
Evaluator potwierdził: generator odtwarza vectors.json bajt-w-bajt, lucznikRanged=69 przy total=1200, fmt EXIT 0, clippy -D warnings EXIT 0, lib 100/100, blow_full 3/3, brak nowych `#[ignore]` i osłabionych asercji, test behawioralny na wektorach z pinu, Cargo.lock nie zacommitowany.
Potwierdzam to niezależnie w tej obronie (patrz „Weryfikacja przed obroną”). Cargo.lock pozostaje untracked i nie jest częścią commitów.

## Uwagi dla FC

1. Procarz (slinger) spadł z 4 do 1 (nadal > 0). To skutek PRNG, nie celowa zmiana. Wymaga osobnego tematu, nie blokuje tego tematu.
2. Regeneracja vectors.json zmieniła wszystkie 1200 przypadków (zgodna z dispatchem). Stare przypadki są w historii Git.
3. Próg `lucznik >= 14` jest niski wobec 69. Przed zamknięciem FC potrzebna jest decyzja orkiestratora o progu (ABC).
4. Pełny `cargo test` potwierdzony: 3261 passed, 0 failed, 1 ignored, EXIT 0.

## BLOKADY
brak

## Pytania
Brak pytań do właściciela w tej obronie. Decyzja o progu (zarzut 3) i osobny temat dla procarza (zarzut 1) to propozycje dla orkiestratora.
