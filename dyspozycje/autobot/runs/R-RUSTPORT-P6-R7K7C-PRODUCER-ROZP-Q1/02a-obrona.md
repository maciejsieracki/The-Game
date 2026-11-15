STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-PRODUCER-ROZP-Q1
GOAL: Odpowiedzi na zarzuty Evaluatora r1 (FAIL, 039857a2d): każdy zarzut PRZYJĘTY (poprawka + dowód + commit) albo ODRZUCONY (dowód).
ZMIANY/COMMIT: `a03ef8d70` (poprawki dokumentu `dyspozycje/rust-port/p6/R7K7C-PRODUCER-ROZPOZNANIE.md`, zero kodu), na gałęzi `wip/R7K7C-PRODUCER-ROZP-Q1-obrona` (od `482c64d3e`). Ten plik to commit następny. Nie wypchnięto.
TESTY: NIE_ZMIERZONO. Zmiana to dokument. Pomiar: `git grep` i `git show` na `1b8b67173` (Rust) i `07d2fbd72` (pin). Zweryfikowano wszystkie zarzuty 1-6 i cytaty z nimi związane.
BLOKADY: brak. Nie ma pytania ABC (zob. zarzut 3).
RUNDY: 2/5 (Operator r1 → Evaluator r1 FAIL → obrona r1). Ostatni werdykt: FAIL.
NASTĘPNY KROK: Evaluator r2 na `a03ef8d70` (dokument) i ten plik. Potem FC, bo rozpoznanie jest czytane przy #106.
DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push, bez integracji).

## Odpowiedzi na zarzuty

### 1. [BLOKUJĄCY] siege_capital_plunder.rs i puli Pracy: PRZYJMUJĘ

Zarzut jest prawdziwy. Rozpoznanie błędnie napisało, że plik obsługuje wyłącznie skarbiec.

Dowód (`git show 1b8b67173:rust-port/engine/src/domain/siege_capital_plunder.rs`):
- trait `OwnerResourceAccess` ma `get_praca_pool` / `set_praca_pool` (l. 59-60),
- gałąź eliminacji przelewa pulę do zwycięzcy (l. 224-229, `transfer_whole_estate_to_winner`),
- gałąź Zdarzenie 1 (przejęcie stolicy, cywilizacja przeżywa) zeruje pulę `access.set_praca_pool(old_owner, 0.0)` (l. 372), komentarz „pula pracy przepada” (l. 365). Zgodne z pinem `main.ts:35641-35642` („pula pracy NADAL przepada bez transferu”).

Poprawka: §1b P-C i §0 pkt 7 dokumentu. Stan wpisany jako „ZGODNE w logice; BRAK wpięcia (#115)”. Brakującą częścią jest produkcyjna implementacja `OwnerResourceAccess` dla `PlayableState`. Nie istnieje (jedyne implementacje to test `tests/p6_siege_capital_plunder.rs:46` i opakowanie barbarzyńskie `:78`). Ten wniosek potwierdzam.

Commit: `a03ef8d70`.

### 2. [BLOKUJĄCY] Błędne cytaty pin 36146 / 36180: PRZYJMUJĘ

Zarzut prawdziwy. Sprawdzone w pinie:
- `main.ts:36146` to zwrot `refundedPraca` z `sanitizeBuildQueue` do `oldOwner` (kolejka produkcji, nie stolica),
- `main.ts:36180` to `totalForfeitedCapture` doliczane do `atkOwner` (zdobywca przejmujący kolejkę z budynkiem stołecznym).

Właściwe źródła, teraz zacytowane: komentarz `main.ts:34874-34877` (`setPracaPool(oldOwner, 0)` w `applyCapitalCapturePlunder`), `main.ts:35641-35642` (Zdarzenie 1, `pracaPoolPrzejeta: 0`), `main.ts:35711-35718` (Zdarzenie 2, transfer do zwycięzcy), `capital-capture.ts:314` (sama funkcja). Dokument §1b pod tabelą.

Commit: `a03ef8d70`.

### 3. [ISTOTNY] Pytanie ABC o „brak wpisu = 0 czy błąd”: PRZYJMUJĘ

Zarzut prawdziwy. Pin rozstrzyga to jednoznacznie: `?? 0` przy odczytach (`main.ts:22642`, `:34865`, `:34877`). Zasady 9 i 11 zabraniają pytać, gdy web rozstrzyga. Dopisałem w obronie także dowód, że opcja B nie odtwarza pinu:
- pin nie seeduje mapy przy starcie. Jedyne `set` to leniwe zapisy (`main.ts:10246`, `:22642`, `:34870`, `:34892`, `:38978`, `:39755`, `:42572`, `:42941`, `:42992`, `:39984`, `:40009`) oraz odtworzenie z zapisu (`:46531`, `:47120`),
- eliminacja kasuje wpisy (`main.ts:35380-35381`), więc po eliminacji pin zwraca 0, a opcja B dalej zwróciłaby błąd.

Poprawka dokumentu: §4 zastąpione decyzją techniczną „parytet 1:1 (brak wpisu = 0)”, do zapisu w `REJESTR-RUST` przy #106. Opcja B odrzucona. Pytanie ABC: brak.

Commit: `a03ef8d70`.

### 4. [ISTOTNY] NIE_ZMIERZONO tam, gdzie dało się zmierzyć: PRZYJMUJĘ w części

- **eliminacja.rs (T-E, PR-8):** zmierzone. `git grep` po `ai_treasury_by_owner` i `praca_pool_by_owner` w `eliminacja.rs` na `1b8b67173` daje 0 trafień. Pin kasuje je w `main.ts:35380-35381` (oraz naukę i badania `:35382-35384`). Rozbieżność jest rzeczywista, stan zmieniony z NIE_ZMIERZONO na ROZBIEŻNE.
- **T-I (czyszczenie):** uzupełnione o pulę Pracy AI, której brakowało: `main.ts:10961` (nowa gra), `:45039` (nowa gra, drugi wariant), `:46528-46531` (wczytanie: clear i odtworzenie z `saved.meta.aiPracaPoolByOwner`).
- **T-B (bankowanie AI):** częściowo. `turn_economy.rs` ma `treasury: u64` w strukturach ekonomii (`:30`, `:79`, `:125`). Pierwszy f64 skarbca właściciela w tym pliku to `GoldDeficitTick.skarbiec` (`:486`), czyli konsument po bankowaniu, nie producent. Czy bankowanie AI jest podpięte: nadal NIE_ZMIERZONO, bo nie prześledziłem całego modułu.

Commit: `a03ef8d70`.

### 5. [DROBNY] T1/W3 niewykonalny; luka settera skarbca człowieka: PRZYJMUJĘ

- Zarzut trafny. `set_owner_treasury` odrzuca człowieka (`playable.rs:961`, `EconomyOwnerIsHuman`). W3 nie da się wykonać w tej formie. Przepisany (§3 T1): wektor sprawdza, że nadal jest `Err(EconomyOwnerIsHuman)`, a pin podłoguje człowieka w `setOwnerTreasury` (`main.ts:34868`, gałąź `isHuman`).
- Luka dopisana w §1a jako H-S: brak podłogowanego setera skarbca człowieka w Rust.
- Wektory W1-W11 dostały wejścia i oczekiwane wartości z pinu (§3). Każdy ma teraz dane wejściowe i oczekiwanie.

Commit: `a03ef8d70`.

### 6. [DROBNY] Pominięte `main.ts:40271`; handel i koszyk: PRZYJMUJĘ

- Dodany wiersz P-X: `main.ts:40271` (`setOwnerPracaPool(hOid, playerPracaPool)`, zapis reszty puli fotela w pętli produkcji). Stan NIE_ZMIERZONO, bo pełnej ścieżki zużycia Pracy fotela w Rust nie prześledziłem.
- Rozdzielone producenty. `main.ts:12586-12589` to `transferBasketItems`, gałąź `praca` przy wykonaniu umowy z koszykiem. Rust: `transfer_basket_items` (`diplomacy_basket.rs:74`) i gałąź praca (`:144-157`), ZGODNE. `main.ts:24015-24016` to NIE koszyk, tylko `applyCyclicDeliveryOutcome` (zapłata Pracą w dostawie cyklicznej). Rust: pola `zaplata_typ` / `zaplata_per_tura` istnieją wyłącznie jako serde w `diplomacy.rs:1461-1463`, konsumenta nie ma (`git grep` 0 trafień). Stan BRAK, nowy producent PR-11.

Commit: `a03ef8d70`.

## Uwaga Evaluatora: bramki NIE_ZMIERZONO (nie zarzut)

Zgadzam się, że bramek nie uruchomiono. Zmiana nie dotyka kodu Rust (diff: jeden plik dokumentu w allowlisty). Odnotowane w dokumencie §5. Nie wymagam bramek dla zmiany bez kodu.

## Zmiany względem allowlisty

- `dyspozycje/rust-port/p6/R7K7C-PRODUCER-ROZPOZNANIE.md` (zmodyfikowany, w allowliście).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-PRODUCER-ROZP-Q1/02a-obrona.md` (nowy, w allowliście).

Cargo.lock, gra/, origin/main, rust-port/parity-v2: nietknięte.
