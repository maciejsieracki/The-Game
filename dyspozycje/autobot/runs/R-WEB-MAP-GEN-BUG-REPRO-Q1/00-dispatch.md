# R-WEB-MAP-GEN-BUG-REPRO-Q1 — generator map: minimalne odtworzenia 5 kandydatów BŁĄD-GRY z Q14-E2 i ocena, które są błędem gry

DOMAIN: GAME (diagnoza; bez naprawy w tym temacie) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 069de0d41f8fee134579ec286028ede02cb9e002. Zero zmian w gra/src i gra/data.

## Kontekst
dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-E2-Q1/10-operator-claude.md i 30-obrona-claude.md (sekcje „Kandydaci BŁĄD-GRY”, „Dowody”): (1) 72 heksy typu „łąka” poza maską lądu szablonu Ziemi (earth-template-test, seed 777); (2) brak lądu na Antarktydzie r=85 w szablonie Ziemi (found 0); (3) ujście głównej rzeki 18 (lub 15) hex od wybrzeża przy limicie MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7 (gra/src/map/gen-helpers.ts ~5727, river-sea-buffer-test / river-mouth); (4) pojedyncze lądy na oceanie (stranded-land-test: 15 FAIL z 3 [dispatch 16/2], „Małe wyspy seed=42”); (5) monotonia gęstości (world-density-test.cjs:141-142). Wszystkie z ciężkich testów generatora (limity czasu); część asercji to STARY-PIN (naprawione: autoimprove, earth-template i map-coast-buffer liczą teraz tylko suchy ląd).
## Zadanie
Dla KAŻDEGO z 5 kandydatów (osobno): (a) minimalne odtworzenie = jedna komenda node gra/tools/... z konkretnym seedem/rozmiarem/typem mapy, czas < 10 min, z oczekiwanym i faktycznym wynikiem (liczby), uruchom i wklej surowe wyjście; (b) klasyfikacja: BŁĄD GRY (naruszona reguła z przewodnika/rejestru/komentarza kodu — zacytuj regułę i plik:linia) / STARY-PIN (asercja przestarzała — wskaż commit zmieniający regułę przez git log -S) / NIE ZMIERZONO z powodem; (c) skutek dla gracza (co zobaczy: wyspa-plamka, rzeka bez ujścia, Antarktyda bez lądu itd.), częstość (na ilu z N map), waga (niska/średnia/wysoka); (d) propozycja naprawy w 1–3 zdaniach (BEZ implementacji) i które testy trzeba będzie zmienić.
Wynik: dyspozycje/analizy/GENERATOR-MAP-BLEDY-REPRO-2026-11-25.md + lista tematów naprawczych (priorytet) i pytania do właściciela TYLKO dla zmian wyglądu mapy (opisz, ABC robi orkiestrator).
Nie uruchamiaj pełnych ciężkich testów (deposit-coast, map-gen-regression itd.); używaj pojedynczych seedów. Uruchamiaj kolejno, nie równolegle (obciążenie hosta).
## Allowlista
dyspozycje/analizy/GENERATOR-MAP-BLEDY-REPRO-*.md, ewentualnie skrypty odtworzeń w dyspozycje/autobot/runs/R-WEB-MAP-GEN-BUG-REPRO-Q1/repro/ (nie w gra/), dyspozycje/autobot/runs/R-WEB-MAP-GEN-BUG-REPRO-Q1/**.
## Zakazy
gra/ (poza uruchamianiem istniejących narzędzi i odczytem; zmiany plików w gra/ zabronione), gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash (długie uruchomienia: setsid nohup timeout ... & + Monitor). Dysk >= 4 GB; po pracy usuń gra/node_modules. Commituj wcześnie (git add <ścieżki tematu>).
## Bramki
Dokument + raport; commituj od razu; git diff --stat = tylko dyspozycje/.
## Binarne kryterium
Dla każdego z 5 kandydatów: komenda odtworzenia z surowym wynikiem, klasyfikacja z dowodem, skutek dla gracza, propozycja naprawy; uczciwe NIE ZMIERZONO tam, gdzie nie odtworzono.
