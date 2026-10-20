STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-18-HOTSEAT-MATRIX-Q1
GOAL: P1.18 z PLAN-PORT-RUST-TAURI-20261020.md §4 — macierz hot-seat "zachowanie web → moduł Rust docelowy → scenariusz akceptacyjny" na piny web main=edb8fb56 i Rust rust-port/parity-v2=9e33fc77 (HEAD po poprawce terenu).
ZMIANY/COMMIT: Zapis: `dyspozycje/rust-port/p1/P1-18-HOTSEAT-MATRIX.md` (nowy, 4 sekcje A-D, 25 wierszy, każdy z ścieżką+linią web, stanem Rust i scenariuszem), ten raport. Brak commita. Zero zapisu w `gra/**` i `rust-port/engine/**`. Odczyt przez `git archive` do scratchpadu.
TESTY: Brak uruchomionych testów (tematy dokumentacyjne/read-only). Weryfikacja: grep na obu pinach (hot-seat/humanSeats/is_human/seat), odczyt konkretnych linii web (main.ts, human-owners.ts, hotSeatHandoff.ts, newGameFlow.ts) i Rust (playable.rs, bridge.rs, player.rs, save_load.rs, turn_economy.rs). Brak trailing whitespace w pliku.
BLOKADY: brak. Uwaga do Evaluatora: (1) zasłona przekazania `hotSeatHandoff.ts` nie jest podpięta w produkcji (tylko hak testowy `__hotSeatTestDebug`, main.ts:24543) — wymaga decyzji właściciela, czy port ma ją implementować; (2) `refreshLiveEmpireRatesUnsafe` wg komentarzy web nadal na fotela 0.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) weryfikuje wiersze matrycy na pinach edb8fb56 i 9e33fc77.
DEPLOY/PUSH: NIE WYKONANO
