STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-POLISH-LANGUAGE-AUDIT-Q1
GOAL: poprawność języka polskiego w tekstach danych/dokumentów (runda 1), bez zmian kluczy/ID/liczb
ZMIANY/COMMIT: baza eba63da08; commit obrony = SHA zwracany w polu sha (git log -1 tej gałęzi)
  - docs/encyklopedia/ulepszenia/kamieniolom.md (l.27, l.40), docs/PORADNIK-GRACZA/45-katalog-budynkow.md (Swiatynia x3),
    docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md (3 frazy z wonders.json, niezałatwione przez operatora),
    dyspozycje/analizy/karty-odkryc/narzedzia/techdata.py (Brama narodów -> Brama wszystkich narodów),
    gra/src/data/wikiBundle.json (regeneracja bundle-wiki-for-game.cjs), nowy gra/tools/polish-language-audit-q1-guard-test.cjs

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ. kamieniolom.md l.27 "odblokowuje **kamien**" -> "**kamień**"; l.40 "+1 kamien/t" -> "+1 kamienia/t". wikiBundle zregenerowany (0 trafień "kamien/t").
   Uwaga/ABC: ASCII-owe "kamien" zostaje w miejscach będących nazwą zasobu/klucza w tekście wygenerowanym (murarstwo.md l.34 "Surowce: kamien, ruda", kamieniarski.md l.31 i 45-katalog l.79 "kamien w zasiegu", 28-katalog-ulepszen l.160, wladcy.md/13-cywilizacje = klucze JSON w backtickach). Nie ruszam: poza zarzutem, część to klucze/generator; do decyzji, czy generować etykiety zasobów z nazw.
2. PRZYJMUJĘ. "Swiatynia" -> "Świątynia" w 45-katalog-budynkow.md (tabela l.36, nagłówek l.148, treść l.150); ścieżki linków (swiatynia.md) bez zmian. Brak kotwic #swiatynia w repo (grep). wikiBundle zregenerowany: 0 trafień.
   Przy okazji (ta sama klasa, wykryta strażnikiem): 91-katalog-cudow-antyk.md miał niepoprawione frazy z wonders.json: "+3 Zaufanie — wyrocznia" -> "+3 Zaufania", "+3 Pieniądz/turę (cywilizacja)" -> "Pieniądza", "+15% wzrost populacji" -> "wzrostu", "+2 bazowe Zaufanie" -> "bazowego Zaufania".
3. PRZYJMUJĘ. Dodano gra/tools/polish-language-audit-q1-guard-test.cjs: 9 zakazanych fraz x ~190 plików (encyklopedia, poradniki, dane, wikiBundle, CSV, techdata.py). Wynik: 1674 ok, 0 fail. Dowód mutacyjny: cofnięcie "+1 kamienia/t" -> "+1 kamien/t" w kamieniolom.md dało "FAIL docs/encyklopedia/ulepszenia/kamieniolom.md ... 1673 ok, 1 fail"; po przywróceniu 0 fail.
   Źródła analityczne: techdata.py poprawione (to wejście regeneracji CSV; py ast.parse OK). ANALIZA-KART-ODKRYC.md i turnieje/*.md to archiwalne zapisy wyników turniejów - celowo NIE zmieniane (historia); ryzyko cofnięcia dotyczyło tylko techdata.py.

TESTY (surowe wyjście, po zmianach, w worktree z npm ci):
  tsc --noEmit: exit 0
  ids-leak-audit-test: 1648 ok, 0 FAIL
  wonder-text-no-raw-ids-test: 132 ok, 0 FAIL
  city-administrator-test: 117 passed, 0 failed
  terminology-trade-vs-tax-test: 798 pass, 1 fail ([G] gen-building-cards-top5 --check) = dług bazowy, poza zakresem (temat R-WEB-TEST-DEBT-BUILDING-CARDS-TOP5-GENERATOR-Q1)
  polish-language-audit-q1-guard-test: 1674 ok, 0 fail
  wikiBundle: odtwarzalny (generator uruchomiony po edycji docs; 22 rozdz. + 174 haseł)
  NIE URUCHAMIANO ponownie: logic/tech-tree/research/unit-replace/combat/tech-cards-top5 (zmiany tylko w tekstach docs/bundle/py, bez kodu gry; Evaluator potwierdził zielone na kandydacie).
BLOKADY: brak
RUNDY: 2/5 (obrona po FC-evaluator)
NASTĘPNY KROK: ponowny Evaluator/Final Control na SHA obrony
DEPLOY/PUSH: NIE WYKONANO
