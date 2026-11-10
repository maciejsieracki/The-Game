STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-17-RUST-CLASSIFICATION-Q1
GOAL: P1.17 — obrona Operatora wobec zarzutów Evaluatora (runda 1/5): poprawki wskaźników dowodowych i uzasadnień w `dyspozycje/rust-port/p1/P1-17-RUST-CLASSIFICATION.md`. Etykiety bez zmian: REUSE 0 | ADAPT 8 | REPLACE 6 | UNKNOWN 169 | suma 183.
ZMIANY/COMMIT: allowlista. Zmieniono wyłącznie `dyspozycje/rust-port/p1/P1-17-RUST-CLASSIFICATION.md` i ten plik. Brak zmian w `gra/**` i `rust-port/engine/**`, brak commitów, brak `git add`.
TESTY: weryfikacja odczytem (`git show edb8fb56:…`, `git show 9e33fc77:…`, `git ls-tree`). 183 wiersze, 183 unikalne ścieżki, pokrycie = listing `gra/src/game` na edb8fb56 (brak brakujących i nadmiarowych). Każdy wiersz UNKNOWN ma `Dowód web: path:linia`. Brak końcowych spacji w pliku. `cargo test`/`tsc` nie uruchamiano (poza zakresem).
BLOKADY: brak.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE. auto-battle-power.ts (ADAPT) i combat.ts (REPLACE): reguła 25%/75% z clampem 0.10–0.25 to combat.rs:433-447 (`loss_fractions`), opis progu w combat.rs:296-300; rozstrzygnięcie w combat.rs:301. Wskaźniki poprawione. Etykiety bez zmian.
2. PRZYJMUJE. terrain-improvements.ts (REPLACE): resource_production.rs:45-55 to typy wyniku; tabela 9 kluczy to ramiona `resolve_resource_production` w resource_production.rs:121-129 (`tartak` = (Wood, 200) w :121), wejście w :118, klucze normalizacji :77-89. Wskaźnik poprawiony; liczba 9 zweryfikowana (9 ramion, :121-129).
3. PRZYJMUJE. turn-economy.ts (REPLACE): cytat „nie ma Player/treasury” nie leży w turn-economy.ts:2-3. Poprawiony wskaźnik: turn-economy.ts:2-3 (adapter per-turn tick) oraz turn-economy.ts:22 (oryginalny cytat po angielsku: „There is no Player/treasury/science runtime state yet”).
4. PRZYJMUJE. building-stock-cost.ts (ADAPT): „zgodna semantyka” zastąpiona: zbieżna struktura i moment pobrania (przy starcie, poza regułą 50% Pracy). Dane zacytowane po obu stronach: stolarnia buildings.json:56-57 ↔ building_costs.rs:122; kuznia :150-152 ↔ :124; odlewnia_brazu :198-200 ↔ :125 (kosztBudowy/przyrost 20/10, 30/10, 28/10 zweryfikowane). Źródło pobrania (magazyn państwa vs. drewno/kamien z buildings.json) oznaczone jako NIEZWERYFIKOWANE; ADAPT utrzymany.
5. PRZYJMUJE. Wszystkie 169 wierszy UNKNOWN ma teraz `Dowód web: path:linia («nagłówek»)` (odczyt pierwszej linii opisowej pliku web na edb8fb56). Uwagi zawierają pełną listę modułów `rust-port/engine/src/domain` na 9e33fc77 jako dowód negatywny. Wiersz city-hex-movement.ts przepisany: pathfinding.rs:1 pokrywa koszty ruchu i ścieżki, nie regułę wejścia na heks miasta (garnizon vs obcy); `ai_turn.rs` ma tylko flagi `garrisoned`/`occupied` (:846, :889, :132). Etykieta UNKNOWN utrzymana.

RUNDY: 1/5 (obrona w tej samej rundzie)
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) — weryfikacja poprawek 1-5 i ponowne zliczenie wierszy.
DEPLOY/PUSH: NIE WYKONANO
