STATUS: DECISION_REQUIRED (bez zmian kodu; zarzuty Evaluatora rozstrzygnięte poniżej; decyzja A/B/C nadal po stronie właściciela)
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-DESPAIR-PANEL-VS-LOGIC-AUDIT-Q1
GOAL: audyt bez zmiany reguł: skąd panel bierze Zmęczenie/Desperację, czy wejścia = logika, czy 0% poprawne, etykiety stron.
ZMIANY-COMMIT: tylko ten plik (30-obrona-claude.md). Kod gry bez zmian (baza 64b8cac44 = efda558ac + raport Operatora). Commit: patrz SHA w odpowiedzi orkiestratora.

ODPOWIEDZI NA ZARZUTY EVALUATORA (3e38233c9):

Zarzut 1 (brak pomiaru parytetu). PRZYJMUJĘ — pomiar wykonany teraz.
Probe poza repo (scratchpad, esbuild, bez zmiany kodu) wywołuje warWearinessPairView(reference 'ai') i loserDespair na 24 przypadkach (tury 11/24/40 × udział przegrywającego 0,27/0,45/0,60 × utraty 0/3). Wynik: w KAŻDYM wierszu desperacja panelu = loserDespair z bramką (isWarWeary ? wzór : 0): TAK (24/24). Kluczowe wiersze (surowe wyjście):
  turns=11 level=28% udział=0,27 utraty=0 → zmęczenie gracza 28%, desperacja AI 0% | wzór bez bramki 34% | wzór z bramką 0%
  turns=11 level=28% udział=0,45 utraty=0 → desperacja 0% | wzór bez bramki 14% | z bramką 0%
  turns=24 level=60% udział=0,27 utraty=0 → 50% | 50%
  turns=40 level=100% udział=0,27 utraty=3 → 100% | 100%
Wniosek: 0% przy poziomie 28% wynika WYŁĄCZNIE z bramki isWarWeary (28% < 50%), niezależnie od udziału siły (dla każdego udziału ≤0,45 wzór bez bramki daje >0).
Uwaga: test już istnieje — gra/tools/diplo-weariness-display-test.cjs uruchomiony teraz: PASSED 52 / FAILED 0 (w tym E3a/E3b/E4a/E4b).

Zarzut 2 (pominięta asercja E4a i decyzja #364). PRZYJMUJĘ.
Potwierdzam: gra/tools/diplo-weariness-display-test.cjs:346-356 asercja [E4a] „ai: poniżej progChetnosci desperacja = 0 (bramka isWarWeary, jak ai.ts)” przechodzi. Bramka jest więc testowaną intencją widoku, nie przypadkiem. Dopisuję do wad opcji A: A zmienia zachowanie zatwierdzone asercją E4a (wymaga jej zmiany) i wymaga decyzji, czy bramka miała być celowa. Zastrzeżenie: wpis rejestru #364 (w kolejce zadań) mówi o pokazaniu zmęczenia i desperacji w obu parach, NIE wspomina o progu 50%. Źródłem bramki jest więc asercja E4a i komentarz widoku, nie jawna decyzja właściciela z #364 — to ma wejść do ABC.

Zarzut 3 (Moc vs siła militarna; 11/40 = 28%). PRZYJMUJĘ.
Mam tę różnicę w raporcie (ŹRÓDŁA: panel używa sila z computeMilitaryStrength, nie Power). Ręczna tabela z raportu liczyła udział z Power (6969/2611), więc „34%” to wynik dla udziału Power, a nie dla siły. Korekta: zdanie „wzór daje 34%” należy traktować jako warunkowe. Wniosek o 0% nie zależy od tej miary (patrz pomiar przy zarzucie 1: bramka wyłącza desperację przy poziomie 28% dla dowolnego udziału). Zgodność 11/40 = 0,275 → 28% przy lostCities = 0 (warWearinessLevel: turns/pelneTur + 0,1·utraty) potwierdzam jako najlepsze założenie dla zrzutu; wartość sila w zrzucie nieznana (NIE ZMIERZONO).

Zarzut 4 (jednoznaczność etykiet, tooltip Desperacji). PRZYJMUJĘ FAKT, ODRZUCAM WYKONANIE W TYM TEMACIE.
Fakt potwierdzony: warWearinessLabelPl (gra/src/game/diplomacy-display.ts:383-392) — tooltip Desperacji („rośnie ze zmęczeniem wojną, słabością militarną i utratą miast”) nie wspomina progu 50%, więc 0% przy 28% nie jest wyjaśnione. Etykiety stron: „Ty” / nazwa rozmówcy (gra/src/ui/diplomacyAudience.ts:1620-1622), warWearinessSideView mapuje po aId/bId — strony nie są mylone w kodzie.
Dlaczego nie poprawiam: diplomacy-display.ts NIE jest na allowliście tego tematu (allowlista: gra/src/ui, war-weariness.ts, war-weariness-view.ts tylko przy błędzie wejść, gra/tools). Zmiana tooltipu to zmiana poza zakresem; rekomenduję osobny temat tekstowy po decyzji ABC (tooltip + komentarze war-weariness-view.ts:5/:12/:112 o ai.ts, którego kod desperacji nie zawiera).

TESTY (surowe wyjście, ten worktree, HEAD = 64b8cac44 po detach):
- npm ci --ignore-scripts w gra/ (71 pakietów, bez build/dev): OK.
- npx tsc --noEmit (gra/): brak wyjścia = 0 błędów.
- node gra/tools/diplo-weariness-display-test.cjs: PASSED 52 / FAILED 0 / TOTAL 52, EXIT=0.
- Probe parytetu (24 przypadki): 24/24 TAK (scratchpad, poza repo).
- Bramki logic-test, tech-tree-test, research-test, unit-replace-test, combat-test, testy dyplomacji (poza diplo-weariness-display): NIE ZMIERZONO — kod gry nie zmieniony względem efda558ac, pozostają wynikiem bazy.
- Mutacja i żywy Chromium: NIE ZMIERZONO (brak zmiany kodu; panel na żywo wymagałby zrzutu z wojny, którego nie ma).

BLOKADY: decyzja A/B/C (właściciel), zwłaszcza czy bramka 50% dla gracz↔AI była celowa (E4a). Brak zrzutu panelu audiencji z wierszami Zmęczenie/Desperacja (zrzuty -30/-31 to tabela PW i stół).
ZALECENIE (bez zmiany kodu): najpierw ABC z wadą z zarzutu 2; po decyzji osobny temat tekstowy (tooltip, komentarze view:5/12/112).
RUNDY: 2/5 (odpowiedź Obrony r1)
NASTĘPNY KROK: pytanie ABC do właściciela (opcje A/B/C z 10-operator-claude.md + wada A z zarzutu 2); po odpowiedzi temat poprawki.
UWAGI-DLA-ORKIESTRATORA: środowisko — dysk / po npm ci wolne ok. 5,2 GB z 252 GB (poniżej progu 6 GB z dispatchu w chwili startu); node_modules w gra/ zostawiony (gitignored), do sprzątania po temacie.
DEPLOY/PUSH: NIE WYKONANO
