# 02a-obrona — R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (runda 3, odpowiedź na zarzuty Evaluatora)

ROLA: Obrona Operatora (Haiku). Odpowiedź na każdy zarzut: PRZYJMUJĘ albo ODRZUCAM.
BAZA wg dispatchu r3: `origin/rust-port/parity-v2` = `760be518775254a030ca252d7b43bba667689050`.
HEAD worktree w chwili obrony: `d44d5b982` (ROBOCZA, nie baza). Zarzut 6 to potwierdza.

## Pomiar dysku (df -h /, 2 odczyty w tej rundzie obrony)
- Odczyt 1: 2.9 GB wolne (`/dev/vda`, 252G rozmiar).
- Odczyt 2: 6.3 GB wolne.
- Wymóg dispatchu: >= 8 GB. Oba odczyty są poniżej progu. Nie uruchamiałem bramek ani mutacji.

## Odpowiedzi na zarzuty

### Zarzut 1: BLOCK INFRA niezależnie potwierdzony, bramki nie wystartowały
PRZYJMUJĘ. Dysk jest poniżej 8 GB w obu odczytach (2.9 GB i 6.3 GB), więc BLOCK INFRA jest zgodny z dispatchem. Operator nie uruchomił fmt/clippy/cargo test i nie ma plików wyjścia bramek w runs/. Nie uruchamiam bramek na pół (zgodnie z dispatchem). Przed rundą 4 orkiestrator musi zwolnić dysk do >= 8 GB.

### Zarzut 2: Zero dostarczonego kodu (d8bfb1d3e zmienia tylko 03-operator-r3.md, +11 linii)
PRZYJMUJĘ. Potwierdzone: `git show --stat d8bfb1d3e` = 1 plik, 11 insertions (`03-operator-r3.md`), rodzic `760be5187`. Brak wpięcia `advance_step_decide` -> `do_move_effects`, brak `terrain`/`occ_by_key` w `ProdBody`, brak `mounted` w `ProdMoveWorld`. Nie naprawiam tego w obronie, bo obrona nie pisze kodu.

### Zarzut 3: Brak testu p6_k5doc_t4e i wektorów z generatora
PRZYJMUJĘ. Potwierdzone: w drzewie bazy `760be5187` nie ma `rust-port/engine/tests/p6_k5doc_t4e*` (grep po `t4e` w `tests/` nic nie zwraca). Brak też `p6_k5doc_t4e_gen.mjs` i `p6_k5doc_t4e_vectors/`. Brak #[ignore] i osłabionych asercji jest prawdziwy tylko dlatego, że nie ma kodu. Nie traktuję tego jako zalety.

### Zarzut 4: Brak mutacji (a)-(d)
PRZYJMUJĘ. Mutacje wymagają kodu i testów (zarzuty 2 i 3). Nie wykonano żadnej. Wynik: NIE_ZMIERZONO.

### Zarzut 5: Patch wip-r2 (a60791ba2) nieskompilowany i nieużyty
PRZYJMUJĘ. Potwierdzone: `a60791ba2` (parent `760be5187`) zawiera `wip-r2-nieskompilowane.patch` (493 linie) i `02-operator-r2.md`. Patch nie został zastosowany w tej rundzie. Bez kompilacji nie uznaję go za działający kod; to tylko punkt wyjścia do przepisania na bazie.

### Zarzut 6 (uwaga końcowa): HEAD worktree = d44d5b982, nie baza 760be5187
PRZYJMUJĘ. Potwierdzone: `git log` w worktree zaczyna się od `d44d5b982` (ROBOCZA, FALA 791), a nie od `760be5187`. Dispatch r3 wymaga worktree detached na bazie. Nie zmieniam tego w obronie. Wpis do rundy 4: najpierw przełączenie na `760be5187` (detached). Zarzut Evaluatora mówi o lokalnym commicie 02-evaluator.md; w historii HEAD tego worktree go nie ma (sprawdzone `git log -3`), więc nie potwierdzam, gdzie ten commit leży.

## Stan po obronie
- Kod Rust: brak zmian w tej rundzie. Allowlista nienaruszona (poza plikiem raportu).
- Testy/bramki/mutacje: NIE_ZMIERZONO (BLOCK INFRA, dysk < 8 GB).
- Push/integracja: NIE WYKONANO. Nie dotykałem `gra/`, `origin/main`, `rust-port/parity-v2`.
- Następny krok: orkiestrator zwalnia dysk do >= 8 GB i wystawia rundę 4 (DODATEK r4, baza `760be5187`, detached). Ten sam ID.
