STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTO-FORT-LIVE-U2-Q1
GOAL: Domknac U-2 zywym biegiem z logiem E-FORT na gotowym bundlu ROBOCZEJ e3f08be6 (MD5 e3f08be6b0dcc31e55c45234dcb92d78, kopia w mktemp -d, bez budowania gra/).

## Wynik w skrocie
U-2 (0 fortow gracza w 33 turach): werdykt ZGODNE z regula, ale z istotnym ustaleniem — bramka NIE jest ani jedna z wymienionych w dispatchu
(E1-E6, zapasowa, deficit, koszt, rezerwa, sufit), tylko wejsciowa: `e-fort bramka: limit miast NIE wyczerpany (cityLimitExhausted!==true)`
(`auto-improvements.ts:1027`; wejscie liczone w `main.ts:36319` `isCityLimitExhausted`), w KAZDEJ turze obu ziaren.
Przyczyna: artefakt harnessu — `unlockAllTech` podnosi epoke gracza do 3, wiec limit = 1+(3-1)*5 = 11, nie 1. Scenariusz "limit wyczerpany" nie zachodzil.

## Tabela tura -> powod (log `fortDec`, tylko `reason` z prefiksem `e-fort`, cityId city0; filtr naprawiony w skrypcie)
| Ziarno | Tury | Powod | detail |
|---|---|---|---|
| 18 | T2..T33 (32 wpisy, 1 wpis/ture) | limit miast NIE wyczerpany | cityLimitExhausted=false (32/32) |
| 7 | T2..T39 (38 wpisow) | limit miast NIE wyczerpany | cityLimitExhausted=false (38/38) |
Zadne inne powody nie wystapily (zero wpisow `e-fort: brak kandydata/koszt/rezerwa/sufit/wybrany`). Gracz: 0 fortow w obu biegach; AI: 8 (s18) i 10 (s7) posterunkow, T27-T34.
Surowe dane: `evidence/fort-zrownowazone-s18.json`, `...-s7.json`.

## Pomiar przyczyny (limit-probe, ziarno 18)
- bez unlockAllTech, preferencje limit=1: 8/8 prob zalozenia 2. miasta odrzucone "limit miast na tej epoce" w T1, T2, T7 (era=1).
- unlockAllTech + limit=1: T1 odrzucone, po 1 turze era=3 (zbadane=32) -> Mediolan zalozony T2, Akwileja T7.
- bez preferencji (kontrola): limit 10, miasta zakladane od razu.
(`evidence/limit-probe-*.json`, `gate-limit-probe-*.txt`)

## Werdykt wzgledem decyzji wlasciciela
- #27 (forty "gdy limit miast wyczerpany") — ZGODNE: wstrzymanie wynika wprost z warunku #27; kod `isCityLimitExhausted` poprawny.
- #24 (sztywny sufit % gracza) — NIE_ZMIERZONO: bramka sufitu (`e-fort: sufit % budzetu`, `auto-improvements.ts:756`) nie byla osiagnieta.
- Obowiazek stawiania fortow (#27) przy faktycznie wyczerpanym limicie NIE zostal sprawdzony zywa gra (patrz usterki.md, U-HARNESS-ERA-LIMIT; wymaga haka testowego w src — poza allowlista). Usterki gry: brak.

## U-3 (profil "infrastruktura", `fort.cjs 14 infrastruktura`, ziarno 18, T2..T15)
fort (14,34) r5 T3 i posterunek (13,37) r3 T4; dystans = 3; `overlaps`: shared=33 przy nHex posterunku=37 (shared < nHex) -> posterunek NIE stoi w calosci
w kole fortu (4 heksy ladowe poza kolem, water=0). Parytet terytorium: 224 porownan, 0 niezgodnosci. POTWIERDZONE (poprawka U-3 dziala w zywej grze).
Zastrzezenie: wlasciciel tych 4 heksow przed T4 — NIE_ZMIERZONO.

## Parytet / bledy
Parytet terytorium s18: 750/0 niezgodnosci; s7: 1127/0. pageErrors: 0 we wszystkich biegach.

## ZMIANY/COMMIT
Allowlista: `gra/tools/live-verify-autoimprove-common.cjs` (EVID_DIR z env), `gra/tools/live-verify-autoimprove-fort.cjs` (filtr `e-fort`+city0 zamiast slice(0,12); plik wyniku z ziarnem),
nowy `gra/tools/live-verify-autoimprove-fort-limit-probe.cjs`, katalog runu. Zero zmian w gra/src, gra/data, gra-robocza, rust-port, WERSJE.md.
SHA commitu (narzedzia + dowody + raport): aa0004d93b9ad52ef19d5a7f16d34ac0f54e27e0 (gałąź worktree-wf_5da4cc34-15c-1; dopisek SHA w kolejnym commicie).

## Komendy (odtwarzalne)
T=$(mktemp -d); cp gra-robocza/Gra-ROBOCZA.html $T/   # MD5 e3f08be6...
export ROBOCZA_HTML=$T/Gra-ROBOCZA.html NODE_PATH=/usr/lib/node_modules:/opt/node-tools/node_modules EVID_DIR=<katalog runu>/evidence
SEED=18 node gra/tools/live-verify-autoimprove-fort.cjs 38 zrownowazone
SEED=7  node gra/tools/live-verify-autoimprove-fort.cjs 38 zrownowazone
SEED=18 node gra/tools/live-verify-autoimprove-fort.cjs 14 infrastruktura
SEED=18 PREFS=1|none UNLOCK=0|1 node gra/tools/live-verify-autoimprove-fort-limit-probe.cjs 6

## TESTY
Logi gate-*.txt (EXIT=0 wszystkie 7). Seed 18 zakonczony gameOver w T33 (wojna ze skryptu) — dane T2-T33 kompletne (usterki.md, NOTA-S18-GAMEOVER).
BLOKADY: brak (ograniczenie: scenariusz z wyczerpanym limitem wymaga haka w src — poza allowlista, zgloszone w usterki.md).
RUNDY: 1/5
NASTEPNY KROK: Evaluator; decyzja orkiestratora o temacie haka testowego (unlockTechs bez zmiany epoki / wymuszenie limitu) i powtorce U-2.
DEPLOY/PUSH: NIE WYKONANO
