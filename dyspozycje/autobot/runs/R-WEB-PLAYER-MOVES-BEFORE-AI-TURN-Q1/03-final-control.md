STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PLAYER-MOVES-BEFORE-AI-TURN-Q1
GOAL: Po "Koniec tury" najpierw wszystkie mozliwe ruchy gracza, potem AI/PM, potem ekonomia i nowa tura gracza.

ZMIANY/COMMIT: oceniany 68fa1ad6bf7055c2243a8bb5d29e908a6ab97868 (baza f568e1ed3, przez c76886bc0). Allowlista OK (main.ts, nowy test, run-dir). Brak zmian gra-robocza/WERSJE.md/rust-port. FC dopisuje tylko ten plik.

WERYFIKACJA WLASNA (detached 68fa1ad6b):
- tsc --noEmit: EXIT=0.
- Test nowy: 44 OK / 0 FAIL, EXIT=0 (GREEN).
- Live RED na bazie f568e1ed3 + red-baza-instrumentacja.diff (patch OK): 26 OK / 18 FAIL, EXIT=1; live FAIL L1b-d, L2a/c, L3b/d, L5b/c, L6c/e, L7b/c; mutacje M1,M3,M4,M5 nowe porazki, M2 nowa porazka S3.
- Petla oczekiwania na bitwe konczy sie przy resecie pipeline (main.ts diff: while ... endTurnInProgress && activeWorldEndTurnPipeline).
- Logi gate-* maja po jednej linii EXIT= (RED=1, GREEN=0, tsc=0).

ROZSTRZYGNIECIE ZARZUTOW:
1. Live RED niepowtarzalny: ODDAL (obrona dostarczyla RED na bazie, FC odtworzyl 26/18).
2. Slaba mutacja M2: ODDAL (kryterium nowej porazki, M5 dodana; FC potwierdzil).
3. RED konczy sie EXIT=0: ODDAL (zarzut nieprawdziwy, EXIT=1).
4. Regresje live/statyczne: ODDAL (zbiory FAIL PRZED=PO, przyczyny srodowiskowe/istniejace; zero testow PASS->FAIL). Reszta live NIE_ZMIERZONO, bez zwiazku z koncem tury.
5. Brak live dla bitwy z marszu: ODDAL (L6 dodany, potwierdzony RED/GREEN).
6. Hot-seat bez ataku z marszu: DO DECYZJI CZLOWIEKA (nieblokujaca; domyslnie obecne zachowanie, wczesniej marsz przepadal calkowicie).
Uchybienie kosmetyczne: trailing whitespace w 2 logach/diffie artefaktow (nie kod).

NAPRAW: 0 -> werdykt PASS-WITH-NOTES.

BLOKADY: brak
RUNDY: 1/5 (Final Control)
NASTEPNY KROK: integracja orkiestratora: cherry-pick c76886bc0 + 68fa1ad6b (SHA koncowy do integracji: 68fa1ad6bf7055c2243a8bb5d29e908a6ab97868) na origin/rust-port/parity-v2 (776bede1) NIE dotyczy -- zmiana w gra/ (web), integrowac na main/web-baze (f568e1ed3+); sekwencyjnie PO R-WEB-EVENTS-DEFER-TO-TURN-START-Q1 lub przed nim z rebase (ten sam obszar main.ts), rust-port/parity-v2 niezalezny (merge-base f4c89d00, brak konfliktu plikow).
DEPLOY/PUSH: NIE WYKONANO
