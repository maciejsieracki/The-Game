STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-STAN-TERYTORIUM-VEC-Q1
GOAL: wektory pinu dla skladnika heksy_terytorium z fortami/posterunkami (>=200 przypadkow, >=40 z remisem) + test na PlayableState
ZMIANY/COMMIT: kod Operatora 88dd74796 (baza 4d348e9ac, ancestry OK); Evaluator fafcc3365; obrona 51dd809de. Allowlista zachowana: 4 pliki (01-operator-r1.md, p6_stan_ulepszenia_territory.rs, _gen.mjs, _vectors/vectors.json), src/ nietkniete, Cargo.lock niezacommitowany. SHA oceniany: fafcc336555421ea4da9777b6fc7dced69491619 (potomek 88dd74796, rozni sie tylko raportem 02).
TESTY (zmierzone samodzielnie przez FC): cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib 88 passed; p6_stan_ulepszenia_territory 2 passed; p6_stan_ulepszenia_border 2 passed; p6_stan_ulepszenia 10 passed. NIE_ZMIERZONO: pelny cargo test wszystkich targetow (runda integracyjna).
BLOKADY: brak

ORZECZENIA (zarzuty Evaluatora):
1. Remis builtAtTurn/seq nie wplywa na skladnik (pin filtruje tylko owner i contested_useless) -> ODDAL. 80 przypadkow to test niezaleznosci od seq; regule remisu pokrywa p6_stan_ulepszenia_border (zielony). Odchylenie od dispatchu uzasadnione pomiarem na pinie. Nazwa stalej TERRITORY_MIN_TIE_CASES wprowadza w blad: DO DECYZJI CZLOWIEKA/integracji (kosmetyka, przemianowanie).
2. Wlasciciele tylko 1..3, brak 0 -> ODDAL (logika identyczna; do rozszerzenia przy regeneracji).
3. Dane syntetyczne, bez dziur w map.hexes -> ODDAL (dispatch nie wymagal; forty poza mapa pokryte, 47).
4. Inwariant reversed-seq tylko po stronie Rusta -> ODDAL (pin nie czyta seq; wariant no_order ma lustro).
5. Brak clippy/pelnego testu przez dysk -> ODDAL w czesci wykonanej: FC uruchomil clippy --all-targets i testy sasiednie, wszystkie zielone; pelny cargo test zostaje integracji.
Zero NAPRAW => PASS.

RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (merge fafcc3365, pelny cargo test, ewentualne przemianowanie stalej)
DEPLOY/PUSH: NIE WYKONANO
