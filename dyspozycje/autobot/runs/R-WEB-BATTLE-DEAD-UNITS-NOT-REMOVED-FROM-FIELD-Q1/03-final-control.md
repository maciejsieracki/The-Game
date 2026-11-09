STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEAD-UNITS-NOT-REMOVED-FROM-FIELD-Q1
GOAL: Jednostka z HP <= 0 znika z pola bitwy; reguła ucieczki z morale bez zmian.
ZMIANY/COMMIT: SHA do integracji f59c7815691a23f0d49676881cae253f7ffc1940 (przodek: 3e5d54efe -> baza 74ba2cb38). Allowlista: battleScene.ts, battle-dead-units-removed-test.cjs, raporty 01/02 w runie. `git diff --check` OK.
TESTY (własne, f59c78156): tsc --noEmit EXIT 0; battle-dead-units-removed-test PASS; battle-dead-unit-disappearance-test PASS; walka-morale-przewaga-mocy-test 123/123. NIE_ZMIERZONO: testy Chromium, weryfikacja wizualna, auto-battle-*, battle-loot-test.
Zarzuty: 1 tsc (ODDAL, tsc zielony), 2 Chromium (ODDAL, NIE_ZMIERZONO), 3 regex (ODDAL, usunięty w obronie), 4 balans (DO DECYZJI WŁAŚCICIELA przez orkiestratora: dawne ucieczki z hp=1 stają się zgonami; próg bez zmian). Zero NAPRAW.
BLOKADY: brak
RUNDY: 1/5
KOLEJNOŚĆ: baza 74ba2cb38 NIE jest w origin/rust-port/parity-v2 (inna linia historii; merge-base a6133784). Zmiana dotyczy tylko gra/ (web), rust-port nie ma tej ścieżki -> integrować do main, niezależnie od parity-v2 (brak konfliktu plikowego do sprawdzenia przez orkiestratora).
NASTĘPNY KROK: integracja orkiestratora (sprawdzić merge-base --is-ancestor, diff --stat), deploy na ROBOCZĄ po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
