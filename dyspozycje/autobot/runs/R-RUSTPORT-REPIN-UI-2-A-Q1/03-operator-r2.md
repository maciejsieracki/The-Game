STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-A-Q1
GOAL: Faza U3, część A: (1) pomiar dryfu UI v2 względem pinów edb8fb56/dc8a3adc i origin/main 86d510c66 (z wyceną); (2) port partii UI-2-A; (3) odświeżony dryf bloków K01–K09.

ZMIANY-COMMIT: gałąź `operator/R-RUSTPORT-REPIN-UI-2-A-Q1-r2`, odtworzona od commita Operatora r1 `002579fe5` (baza `612ad455e`).
- `5578c6238`: `dyspozycje/rust-port/p5/P5-REPIN-UI-2.md` (+§1a wycena, +kolumna wyceny w §4, nota b) oraz komentarz nagłówka `src-tauri/frontend-v2/tools/dom-harness/run-repin-ui2a.mjs` (nota d).
- Ten raport w osobnym commicie.
- Kod partii UI-2-A (`ea5d9e7f7`) bez zmian.

ODPOWIEDZI NA ZARZUTY:
- Z1 (brak wyceny): PRZYJMUJĘ.
  - Dodany §1a z wejściem zmierzonym: `L=(+)+(−)` z `git diff --numstat edb8fb56 86d510c66` i `H` z liczby `^@@` w `git diff -U0`. Odtworzone dla 26/26 plików, zgodne z kolumną e→m w §1.
  - Wzór per klasa (ZAŁOŻENIE Z3):
    - KB: `0,5+0,1H+L/400` (+1 h za scenę PNG);
    - PD: `1+0,15H+L/50` (+1 h za DTO);
    - AD: `0,5+0,15H+L/50`;
    - K: `0,5·bloki+±/50+2 h`.
  - Tabela per plik zawiera L, H, LP (linie portu) i h. Razem 2709 L, 1945 LP, 129,25 h.
  - §4 ma kolumnę Σh/ΣLP/rundy per partia: B 14 h, C 30,5 h, D 15,25 h, E 25,5 h, F 21 h, G 20 h. Dla C i E jest zalecany podział na osobne ID.
  - Dowód: grep `wycen|koszt|estym` daje 8 trafień (wcześniej 0).
- Notatki b i d (bez wpływu na werdykt): naniesione. Nota a jest już udokumentowana, nota c to uwaga metodyczna; obie bez zmian.

TESTY:
- `git diff --check`: czysty.
- `node --check run-repin-ui2a.mjs`: OK. Zmiana dotyczy tylko komentarza.
- Bramki kodu (tsc, npm run check, run-repin-ui2a, mutacje, harnessy): niepowtarzane, bo r2 nie zmienia kodu wykonywalnego. Wyniki r1 potwierdził niezależnie Evaluator r1.

BLOKADY: brak.
- Wycena to ZAŁOŻENIE Z3, a nie pomiar czasu. Do rekalibracji po każdej partii.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-UI-2-A-Q1 r2.
DEPLOY-PUSH: NIE WYKONANO
