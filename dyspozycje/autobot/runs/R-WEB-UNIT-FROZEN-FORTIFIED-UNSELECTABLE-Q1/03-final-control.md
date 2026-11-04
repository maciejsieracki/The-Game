STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-FROZEN-FORTIFIED-UNSELECTABLE-Q1
GOAL: Jednostka/armia w fortify/garnizon zawsze wybieralna; laczenie nie przenosi blokady; samoleczenie gracz=AI.
ZMIANY/COMMIT: SHA do integracji: 2f75af9cf (baza 7c0c57a2a; cf0770d5b + 9d25f704a + 2f75af9cf). Allowlista OK: armyMerge.ts, main.ts, nowy test, runs/<ID>/**. Zero gra-robocza, rust-port, WERSJE.md. git diff --check czysty.
KOLEJNOSC: baza jest za origin/main (5fa0c1a84); git merge-tree z origin/main bez konfliktow. Integrowac przez merge/rebase na origin/main i powtorzyc bramki po integracji. Brak zaleznosci od origin/rust-port/parity-v2 (zmiany tylko gra/src web) -- mozna przed lub po parity-v2.

WERDYKTY ZARZUTOW (r2 Obrona):
1 brak testu merge -> ODDAL (naprawione: normalizeMergedFortify, A8-A13 na prawdziwych funkcjach, D7-D10 realny panel Chromium, M7-M10).
2 ufortyfikowanyWPolu / group.some -> ODDAL (przyczyna pula=MIN, enterFieldFortify idempotentne, przycisk liczy stack.some; A9/A10/D8/D10).
3 hover/split/follow -> ODDAL (D11 hover, D9/D9b split, D12 zero pageerror; follow-leader NIE_ZMIERZONO).
4 pomiar 5 ziaren / organiczna sierota -> ODDAL jako NIE_ZMIERZONO (jawnie; LIVE_RED=1 daje RED warstwy D, pula=MIN odtworzona na zywo).
5 hak __frozenTestDebug -> ODDAL (za isCivTestEnabled, test C12).
Zadnego NAPRAW -> PASS.

TESTY (zweryfikowane samodzielnie na 2f75af9cf):
- unit-frozen-fortified-unselectable-test.cjs: pass=76 fail=0, EXIT=0 (Chromium D0-D12, zero pageerror).
- BASELINE=1 --no-live: pass=2 fail=1 (RED A2).
- tsc --noEmit: 0 bledow.
- army-merge-panel-list-visibility 104/0, production-mount 9/0, army-merge-separate-return-mainguard 73/0 (z PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium).
- Logi gate-*-r2.txt: po jednej linii EXIT=.
- Regresja 14 FAIL przed i po (ten sam zbior, czerwone na origin/main): liczba Operatora, nie powtorzona.
BLOKADY: brak
NIE_ZMIERZONO: pomiar 5 ziaren x 100+ tur; organiczne odtworzenie sieroty; zywy follow-leader; tresc tooltipu; pelna regresja *army*/*save* nie powtorzona.
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora (2f75af9cf na origin/main, powtorzyc bramki)
DEPLOY/PUSH: NIE WYKONANO
