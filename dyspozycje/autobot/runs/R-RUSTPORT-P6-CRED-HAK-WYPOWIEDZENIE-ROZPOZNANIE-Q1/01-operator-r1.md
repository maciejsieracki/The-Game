STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 (CRED-HAK-WYPOWIEDZENIE, #120), runda 1, rozpoznanie
GOAL: ustalić, jak pin wywołuje chargeWarDeclarationCredibility przy wypowiedzeniu gracza (main.ts:13168/13205), obowiązku sojuszniczym (main.ts:23806) i klastrze (main.ts:40441), oraz czego brakuje w Rust. Pełna tabela i plan: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1-ROZPOZNANIE.md`.
ZMIANY/COMMIT: tylko dokument (2 pliki w allowliście: rozpoznanie w `dyspozycje/rust-port/p6/` i ten raport); zero zmian w `rust-port/**`, `gra/**`, testach, Cargo.toml. Baza `fc2ed160f`, gałąź `wip/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1`. SHA commita: podany w odpowiedzi operatora (commit po zapisie).
TESTY: NIE DOTYCZY (rozpoznanie, bez zmian kodu, bez uruchamiania cargo).
BLOKADY: brak blokad operatora. Jawne NIE_ZMIERZONO: odmowy AI (`aiHonorsAllianceWarObligation`), `interCivWarBlockedForAi` i pętla klastrów PM w Rust; ścieżka rebel-war w produkcji; nie czytano całego `main.ts`.
RUNDY: 1/5
NASTĘPNY KROK: Final Control rozpoznania; po PASS: propozycja tematów T1 (CRED-HAK-DECLARE-OPTS, N2 sojusz/NAP, odwet, P4 przy wypowiedzeniu) jako pierwszy, potem T2/T3/T5 równolegle, T4 po T3. Dwa pytania ABC do właściciela: format komendy wypowiedzenia gracza (T3) i zakres wojny klastra graczowi (T5).
DEPLOY/PUSH: NIE WYKONANO (dispatch: NIE pushuj do rust-port/parity-v2; push gałęzi roboczej poza zakresem operatora).
