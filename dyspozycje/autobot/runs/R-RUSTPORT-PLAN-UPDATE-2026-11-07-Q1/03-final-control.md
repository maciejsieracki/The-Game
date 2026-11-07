STATUS: FAIL
DOMAIN: PROCESS (dokumentacja planu portu Rust/Tauri, bez zmian kodu)
TEMAT: R-RUSTPORT-PLAN-UPDATE-2026-11-07-Q1
GOAL: Zaktualizować plan Tauri (stan 2026-11-07, różnice WEB->RUST, kolejka zadań) + dispatche pozycji 1-4.

WERYFIKACJA WŁASNA (commit a5c8c1b93, baza ced4a31e0):
- Allowlista: 8 plików (plan, LEDGER, 4x 00-dispatch, 01-operator-r1, 02-obrona-r1). Zero zmian w rust-port/**, src-tauri/**, gra/**, gra-robocza/**, WERSJE.md. `git diff --check` czysty.
- Zarzut 1 (M10/M15/M16/M17 w LEDGER): poprawione w planie §0a.2 i LEDGER; LEDGER linia 199 potwierdzona. -> ODDAL (naprawione).
- Zarzut 2 (40 vs 56): `git ls-tree` na 783c6b766 = 56. Plan poprawiony. -> ODDAL.
- Zarzut 3 (35e9ec5a): `git cat-file -t 35e9ec5a` = błąd; plan opisuje jako etykietę deployu. -> ODDAL.
- Zarzut 5 (suma §6): poprawiona do 24-45 tyg. z jawnym założeniem. -> ODDAL.
- Zarzut 4 (procenty bez metody): NAPRAW. Obrona twierdzi, że usunięto "≈35%" z §0a, ale linia 59 planu nadal ma `**CZĘŚĆ (≈35%)**` (wiersz P6.11-P6.12). Bilans (linia 71) odsyła do "uwaga pod tabelą", której w pliku nie ma (wiszące odwołanie).

WYMAGANE POPRAWKI (runda korekty, to samo ID):
1. Plan linia 59: zamienić `CZĘŚĆ (≈35%)` na `CZĘŚĆ`; przeszukać plan i LEDGER pod kątem pozostałych `≈N%` o postępie.
2. Plan: dodać pod tabelą §0a.2 jednozdaniową uwagę "procent postępu nie jest miarą (brak metody)" albo usunąć odwołanie w Bilansie.
3. Skorygować pkt 4 w 02-obrona-r1.md, by zgadzał się ze stanem po poprawce.

BLOKADY: brak (poprawki kosmetyczne, bez zmian kodu).
RUNDY: FC po rundzie 2/5; następna korekta 3/5.
KOLEJNOŚĆ względem origin/rust-port/parity-v2 (783c6b766): zmiany tylko w dyspozycje/**, niezależne od parity-v2; brak wpływu na kolejność merge. SHA do integracji: brak (FAIL).
NASTĘPNY KROK: Operator (korekta) -> Evaluator -> Final Control.
DEPLOY/PUSH: NIE WYKONANO
