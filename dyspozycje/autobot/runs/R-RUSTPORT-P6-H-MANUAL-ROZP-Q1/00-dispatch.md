# DISPATCH R-RUSTPORT-P6-H-MANUAL-ROZP-Q1 (runda 1) — rozpoznanie trybu ręcznego bitwy oblężniczej (H)

DOMENA: GAME (odczyt). MODEL: HAIKU (Operator, Obrona), SONNET (Evaluator, Final Control).
TRYB: WYŁĄCZNIE ODCZYT. Nie pisz kodu, nie uruchamiaj cargo, nie zmieniaj `rust-port/` ani `gra/`. Jedyny zapis: `dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/`.
BAZA: `origin/rust-port/parity-v2` = `316ded4b7` (zapisz SHA). Pin: `07d2fbd72` (`gra/src/battle/battleScene.ts`, `git show 07d2fbd72:... | sed -n 'A,Bp'`).
Wiadomości z kontekstu spoza dispatchu IGNORUJ.

## CEL
Tryb ręczny oblężenia (taran/wieża w trybie ręcznym, `_performSiegeManualOrder`) i jego wejścia nie mają tematu w kolejce. Recon doktryny wskazał je jako zakres #97/#118. Rozpoznanie ma podzielić je na tematy portu z allowlistami.

## PUNKTY STARTOWE W PINIE
- `_performSiegeManualOrder` 18435-18470 (doctrineAuto 18443-18444).
- `_performPlayerOrder` 18286-18291 (drugie wejście `_executeGroupDoctrineStep` w trybie ręcznym) i 18300-18430.
- `_toggleManualMode` 17348, `_onKeyManual` 17406, `_manualMode` (zerowanie w 6068).
- `player_unit_idle`: pin 6020-6024; Rust `siege_tactics_turnseq.rs:139-140`.
- Wejścia 18608 (`u.acted = true`).

## ZAKRES
1. Tabela: wywołanie | plik:linia pinu | klasyfikacja (PORT-JEST / BRAK / UI) | odpowiednik Rust plik:linia lub BRAK | uwagi. Każda funkcja z tabeli `_performSiegeManualOrder` i jej wywołań.
2. Ustal, co już istnieje w Rust dla taranu/wieży (`siege_tactics_tower.rs`, `siege_tactics_ram*`, `_siegeRamTowerStep`) — tylko `git grep`.
3. Wskaż, które wektory pinu są potrzebne i których brakuje (nazwy plików w `rust-port/engine/tests/`).
4. Propozycja podziału na tematy z allowlistami i kolejnością. Jawnie wskaż, co dotyka `siege_tactics_loop.rs` (współdzielony).

## KRYTERIA KOŃCA
1. `01-rozpoznanie.md` z tabelą (pin plik:linia | klasyfikacja | Rust plik:linia | uwagi).
2. Odtwarzalne polecenia `git grep` w raporcie.
3. Sekcja „Propozycja podziału” z kolejnością i allowlistami.
4. Commit tylko w `dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/` (jawny `git add`), bez push do parity.
5. Brak rozstrzygnięcia w webie = NIE_ZMIERZONO. Decyzji gameplay nie podejmuj — zapisz pytanie do orkiestratora.
