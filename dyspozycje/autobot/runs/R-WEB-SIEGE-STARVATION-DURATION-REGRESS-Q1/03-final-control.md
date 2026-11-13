STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-STARVATION-DURATION-REGRESS-Q1
GOAL: Oblezenie miasta z jednostka w srodku trwa ~2 tury zapasow + glod garnizonu (6/8/10% HP/ture) do SigmaHP<50%; plakietka zgodna z faktycznym poddaniem.
ZMIANY/COMMIT: kod operatora be505e7c2 (baza b497fd0df, jest przodkiem); dopisek r2 a2ae70caa (tylko 02-operator-r2.md). SHA do integracji: a2ae70caa (+ commit 03-final-control.md). Allowlista: siege-starvation.ts, main.ts (import + 2 miejsca), nowy siege-starvation-duration-test.cjs, siege-starvation-test.cjs, runy 01/02. git diff --check czysty. Brak WERSJE.md.
TESTY (u mnie, a2ae70caa, npm ci w gra/): siege-starvation-duration 27/0, siege-starvation 54/0, siege-surrender-forecast 57/0, siege-defenders 12/0, tsc 0. Pozostale bramki (logic 213, ai 289, siege-ai, oblezenie, army-hunger-combat, empire-food-b5 itd.) odtworzone przez Evaluatora na be505e7c2 (kod identyczny); u mnie nie powtarzane.
WERDYKTY ZARZUTOW:
- Z1 (brak bisectu/dowodu przyczyny): ODDAL. Diagnoza uczciwie oznaczona jako statyczna; sciezka "garnizon=0 -> poddanie po ~2 turach" odpowiada objawowi i prognozie "za 1/2 tury"; progi nietkniete. Brak harnessu pelnej gry. Weryfikacja zywa -> notatka dla integracji.
- Z2 (tabela Harappy): ODDAL jako NIE ZMIERZONO (brak zapisu stanu dla Operatora).
- Z3 (test strukturalny dla main.ts): ODDAL jako ograniczenie; main.ts objety wzorcami + replika N3 na realnych modulach; "10 FAIL" dotyczy cofniecia funkcji, cofniecie samego main.ts daje 3 FAIL strukturalne.
- Z4 (zuzycie zapasow liczy tylko inGarnizon): ODDAL. Skutek to dluzszy etap zapasow, kierunek zgodny z celem wlasciciela; plakietka i poddanie spojne. Zmiana zuzycia = osobny temat/decyzja produktowa.
- Z5 (pozostale inGarnizon): ODDAL jako swiadomie pominiete (garnizonCountForCity, syncGarnizonForCity, sprzatanie po glodzie); wplyw na zuzycie/bonusy, nie na progi HP.
- Z6: ODDAL. Dlug #112 (glod-wojska-karencja 29/10) poza zakresem wg dispatchu.
DO DECYZJI CZLOWIEKA (przez orkiestratora, nie blokuje integracji): (1) zuzycie zapasow dla nieufortyfikowanych obroncow; (2) zapis stanu Harappy do potwierdzenia przyczyny.
BLOKADY: brak. Zywa weryfikacja w przegladarce: NIE ZMIERZONO.
RUNDY: 2/5 (Final Control: PASS-WITH-NOTES, zero NAPRAW)
NASTEPNY KROK: integracja orkiestratora: merge a2ae70caa (sprawdz git merge-base --is-ancestor be505e7c2 i git diff --stat) do main. Wzgledem origin/rust-port/parity-v2 (d6414fcf1): niezalezne (zmiana tylko web gra/); kolejnosc dowolna, sprawdzic konflikty w gra/src/main.ts. Potem deploy ROBOCZA po osobnej autoryzacji i test na zywo: plakietka vs tura poddania.
DEPLOY/PUSH: NIE WYKONANO
