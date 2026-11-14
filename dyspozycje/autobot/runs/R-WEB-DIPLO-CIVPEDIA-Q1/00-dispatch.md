# R-WEB-DIPLO-CIVPEDIA-Q1 — dispatch (2026-11-13)

GOAL (polecenie właściciela): encyklopedia (Civpedia) i poradnik gracza opisują dyplomację: zaufanie, respekt, relację, wiarygodność, Power i jego podział na wojskowy i gospodarczy, wypowiadanie wojny, rozejm, pokój, zmęczenie wojną — z WSZYSTKIMI parametrami, plusami i minusami. Dokumentacja opisuje OBECNY stan gry zweryfikowany w kodzie (baza zawiera krok 1: w wojnie zaufanie spada do zera). Nowe zasady (krok 2–4) są zapisane osobno jako „Zasady zatwierdzone, jeszcze niewdrożone”. Szczegóły: DODATEK.

BAZA: origin/main d09df3e0b. Operator: HAIKU. Evaluator/FC: SONNET.
ALLOWLISTA: docs/encyklopedia/pojecia/*.md (nowe i edycja istniejących: wiarygodnosc.md, handel-surowcami-dyplomacja.md, manpower-rekruci.md oraz nowe hasła), docs/encyklopedia/indeks.md, docs/PORADNIK-GRACZA/12-dyplomacja.md, gra/src/data/wikiBundle.json (WYŁĄCZNIE regeneracja skryptem node gra/tools/bundle-wiki-for-game.cjs), NOWY gra/tools/diplo-civpedia-values-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-CIVPEDIA-Q1/**.
ZAKAZ: kodu gry (gra/src/**/*.ts poza wikiBundle.json), JSON balansu, WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A.
