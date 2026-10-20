STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-18-HOTSEAT-MATRIX-Q1
GOAL: P1.18 z PLAN-PORT-RUST-TAURI-20261020.md §4 — macierz hot-seat "zachowanie web → moduł Rust docelowy → scenariusz akceptacyjny" na piny web main=edb8fb56 i Rust rust-port/parity-v2=9e33fc77 (HEAD po poprawce terenu).
ZMIANY/COMMIT: Zapis: `dyspozycje/rust-port/p1/P1-18-HOTSEAT-MATRIX.md` (nowy, 4 sekcje A-D, 24 wiersze: A1-A5, B1-B7, C1-C7, D1-D5, każdy z ścieżką+linią web, stanem Rust i scenariuszem), ten raport. Brak commita. Zero zapisu w `gra/**` i `rust-port/engine/**`. Odczyt przez `git archive` do scratchpadu.
TESTY: Brak uruchomionych testów (tematy dokumentacyjne/read-only). Weryfikacja: grep na obu pinach (hot-seat/humanSeats/is_human/seat), odczyt konkretnych linii web (main.ts, human-owners.ts, hotSeatHandoff.ts, newGameFlow.ts) i Rust (playable.rs, bridge.rs, player.rs, save_load.rs, turn_economy.rs). Brak trailing whitespace w pliku.
BLOKADY: brak. Uwaga do Evaluatora: (1) zasłona przekazania `hotSeatHandoff.ts` nie jest podpięta w produkcji (tylko hak testowy `__hotSeatTestDebug`, main.ts:24543) — wymaga decyzji właściciela, czy port ma ją implementować; (2) `refreshLiveEmpireRatesUnsafe` (`main.ts:18487`) jest częściowo per-fotel: filtr miast i upkeep Pracy na `ME()`, ale `player.civType`/`player.era`/`player.zbadane` pozostają singletonem fotela 0 (`main.ts:18494, 18505-18506`).

OBRONA NA ZARZUTY (runda 1/5):
1. Liczba wierszy: PRZYJĘTE. Były 24 wiersze, nie 25. Raport poprawiony (powyżej).
2. Cytat `bridge.rs:28` dla AddPlayer: PRZYJĘTE. Deklaracja to `bridge.rs:29`. Obsługa są dwie: `bridge.rs:267-269` (przez `PlayableGame::add_player`, `playable.rs:472-484`) i `bridge.rs:331-345` (druga `execute`, `is_human: false` w linii 344). Wiersz A5 poprawiony.
3. Zakres `hotSeatHandoff.ts`: PRZYJĘTE. Plik na `edb8fb56` ma 135 linii. Wiersz B7 poprawiony na `1-135`.
4. Ryzyko 1 (`refreshLiveEmpireRatesUnsafe`): PRZYJĘTE częściowo. Cytowane `main.ts:11265-11279` i `7119` to komentarze o cache per-fotel, nie dowód hardkodu, więc usunięte jako dowód. Dowód przeniesiony na kod: `main.ts:18488` (isMe), `18586`/`18593` (ME()), `18494` (`player.civType`), `18505-18506` (`player.era`, `player.zbadane`), `main.ts:11120` (`createPlayerState`). Komentarz `main.ts:11416-11417` oznaczony jako nieaktualny (linia 17077 zamiast 18487). Sformułowanie „nadal na fotela 0" doprecyzowane na „częściowo per-fotel".
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) weryfikuje wiersze matrycy na pinach edb8fb56 i 9e33fc77.
DEPLOY/PUSH: NIE WYKONANO
