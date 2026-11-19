STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-AI-ALLIANCE-LIMIT-2-VIOLATED-Q1
GOAL: wspolne sprawdzenie limitu 2 sojuszy na cywilizacje AI we wszystkich sciezkach zawierania sojuszu, za flaga torSojuszyAktywny (OFF bez zmian).
ZMIANY/COMMIT: kandydat fffd41afe5769cbc895e46e3d85e49f12f9f3d3f; merge-base --is-ancestor f6f4df37d -> TAK. diff --stat: 6 plikow (+417/-11): gra/src/game/ai-ai-alliance-limit.ts (nowy), gra/src/main.ts, gra/tools/ai-ai-alliance-limit-{audit,test}.cjs, 2 raporty runs/. Wszystko w allowliscie; brak zmian w gra-robocza/kanon/WERSJE/rust-port/JSON.
TESTY (wlasne, surowe wyjscie): tsc --noEmit EXIT 0; limit-test SUMMARY OK, mutanty 4/4 + wiazan 4/4; alliance-tick 19/19 + mutanty 8/8; zero-trust 43/0; coalition 0 bledow, mutanty 9/9; alliance-strength 33 OK/0 FAIL; war-limit 57/0; logic 213/213; research 33/33; unit-replace 21/21; combat 6/6; tech-tree 20/0.
OCENA ZARZUTOW:
1 (brak biegu runtime): zasadny, NIE ZMIERZONO. Max sojuszy/civ <=2 w t100 nieudowodnione; jedyna luka dowodowa. Nie blokuje kodu, blokuje twierdzenie "bug usuniety".
2 (wnioski gracz-AI): naprawiony. Wszystkie addTreaty z sojuszem: tick (main.ts ~25785, licznik z pelnego stanu), siostry (~24787, bramka), applyProposalOutcomeImpl (bramka na wejsciu). Pozostale applyAcceptedProposal (15715, 25254) dotycza przemarszu/handlu. Hak 27153 to tylko Playwright.
3 (wiazania main.ts): naprawiony - test czyta main.ts, 4 mutanty wiazan wykryte (uruchomione).
4 (OFF bit-w-bit): NIE ZMIERZONO biegiem. Z przegladu kodu: 3 nowe bramki sa za isAiAiAllianceTickEnabled(), tick wychodzi wczesniej przy OFF - OFF niezmienione z konstrukcji.
5 (licznik liczy tez sojusze z graczem): zapisane zalozenie w module, zgodne z dispatchem; wplyw na liczbe sojuszy NIE ZMIERZONO.
6 (przyczyna to hipoteza): zasadny; sciezka pary 1-19 niepotwierdzona. Naprawa jest szeroka (wszystkie sciezki), wiec nie zalezy od trafnosci hipotezy; diagnoza niepotwierdzona.
BLOKADY: brak blokad kodu. Dowod runtime (100 tur seed 4242, ON) NIE WYKONANO (~2,5 h CPU).
RUNDY: FC po rundzie 2/5.
NASTEPNY KROK: orkiestrator decyduje o biegu 100 tur ON seed 4242 przed READY_FOR_DEPLOY; integracja za flaga OFF nie zmienia domyslnej gry.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: formSisterAlliancesIfThreatened nie jest bramkowana flaga torSojuszy poza nowa bramka limitu (decyzja wlasciciela). Jesli bieg ON nadal pokaze >2: podejrzane pary zawarte przed bramka lub wczytane z zapisu.
