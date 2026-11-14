# R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1 — Final Control (Claude, Sonnet)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1 (#373)
GOAL: gra wznowiona z zapisu daje ten sam przebieg co nieprzerwana (to samo ziarno).
ZMIANY/COMMIT: kandydat 54301d815211f09ae7b9f51675048f1163fcba81 (potomek bazy 85f7961b1: `merge-base --is-ancestor` = tak). Diff vs baza: main.ts (+36: zapis/odczyt detIdSeq/autoBattleSeqTurn/autoBattleSeq w meta + hak `__detHarness` tylko przy ?civTest=1), determinism-save-load-resume-test.cjs, determinism-save-load-resume-live.cjs, raporty runs/**. W allowliscie. Brak WERSJE.md, gra-robocza, rust-port.
Uwaga: DODATEK `00-dispatch-DODATEK-claude.md` nie istnieje w origin/main ani w origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0; zalozenie: obowiazuje 00-dispatch.md z f734ed0e6.

TESTY (surowe wyjscie, worktree detached na 54301d815):
- tsc --noEmit: exit 0
- determinism-save-load-resume-test: WYNIK PASS; determinism-same-seed-test: WYNIK PASS
- logic 213/213; tech-tree 20/0; research 33/0 ALL GREEN; unit-replace 21/21; combat 6/6
- WLASNY pomiar live (bundle vite z kopii poza repo, headless Chromium, ziarno 3131 — inne niz Obrona; zapis w t6, tury 7-16):
  - A (nieprzerwana) vs B (swieza sesja + restoreGameFromSave): EQUAL 10 of 10, restore detIdSeq 4 = snap 4, pageErrors=0
  - C (stary zapis bez 3 pol meta): wczytanie bez bledu (pageErrors=0), EQUAL 7 of 10 (rozjazd od t14) — jawne ograniczenie, rowniez efekt "mutacji" (brak pol) widoczny w przebiegu
  - Przed naprawa (baza): wg Obrony 7/10 dla ziaren 2222 i 4242; C powyzej odtwarza ten sam wzorzec.

ZARZUTY:
1-4 (kryteria a-d): ODDAL — domkniete pomiarem live (tabela w 30-obrona-claude.md, potwierdzone moim ziarnem 3131), test przebiegowy czerwienieje bez poprawki.
5 (_detIdSeq nie zerowany przy Nowa gra): ODDAL — poza allowlista/zakresem (dotyczy nowej gry, nie wznowienia); do UWAG.
6 (walka taktyczna): DO DECYZJI CZLOWIEKA — stan faktyczny podany przez Obrone (resolveCombat bez rng -> Math.random), druga czesc dispatchu zalezna od decyzji produktowej; nie blokuje.
7 (_dipUnitSeq): ODDAL — scenariusz bez jednostek dyplomatycznych, wplyw NIE_ZMIERZONO; do UWAG.
Zero NAPRAW => nie FAIL.

BLOKADY: brak
RUNDY: FC 1
NASTEPNY KROK: integracja orkiestratora 54301d815 -> READY_FOR_DEPLOY po bramkach na main.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: U1 reset _detIdSeq przy Nowa gra (osobny temat); U2 _dipUnitSeq do meta po scenariuszu z dyplomacja; U3 DECYZJA: determinizm walki taktycznej; U4 restore wpisuje podzialPracy do miast bez pola (semantyka niezweryfikowana); stary zapis nie odtwarza ID (7/10); pomiar live wymaga dist z kopii gra/. NIE_ZMIERZONO: pelna serializacja stanu (AI-closure, dyplomacja, negocjacje).
