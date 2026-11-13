STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1
GOAL: Panel dyplomacji pokazuje prawdziwe Zaufanie/Respekt AI (bez obcięcia wojennego do 29). Limit wojenny zostaje tylko w etykiecie „Wrogi” i w dopisku „(limit wojenny 29)”. Mechanika silnika bez zmian.
ZMIANY/COMMIT: baza runda 1 = ffefa9df737431d4a9029d9fb119116db375c723; commit rundy 2 = SHA podany w odpowiedzi orkiestratora (niewypchnięty, gałąź worktree-wf_bd3e77db-e4e-3).
  - gra/src/ui/diplomacyAudience.ts: import WAR_RELATION_SCORE_CAP z ../game/diplomacy; dopisek używa stałej zamiast 29; tooltip wyjaśnia, że limit dotyczy SUMY Zaufania i Respektu; dopisek w wierszu Relacja wyniesiony poza span .da-rel-sum-hint; nowa reguła CSS .da-war-cap-note (bursztynowy, 0.8em) dla czytelności.
  - gra/tools/diplomacy-display-test.cjs: ODSTĘPSTWO od allowlisty (do zatwierdzenia przez orkiestratora lub FC): zmienione są wyłącznie dwie stare asercje (effectiveNastawienieScores zwraca prawdziwą wartość, 74 i 54), bo kodowały obcinanie wojenne. Usunięte są eksport warRelationCapApplies i trzy asercje o dopisku oraz jedna o etykiecie, przeniesione do nowego testu. Plik zmieniony jest więc o 2 asercje.
  - gra/tools/diplomacy-respect-true-value-real-render-test.cjs (NOWY): test renderu w żywym Chromium, z dwoma wariantami mutanta.
  - dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1/dowody/ (NOWE): 01-wojna-respekt-prawda-74-54.png, 02-pokoj-bez-dopisku-74-54.png, mutant-clamp-A.png, mutant-note-A.png.
  - dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1/02-operator-r2.md (ten raport).
  - Nie zmieniano: WERSJE.md, gra-robocza/, silnika (diplomacy.ts), żadnych plików poza powyższą allowlistą. Pliki dowodów P-* z testów innych tematów cofnięto (git checkout), nie wchodzą do commita.
ODPOWIEDZI NA ZARZUTY:
  1. Brak weryfikacji w przeglądarce — PRZYJMUJĘ. Nowy test uruchamia prawdziwy showDiplomacyAudience z bundla esbuild w headless Chromium (prawdziwy CSS, DOM). Zrzuty: 01 (wojna 74/54, dopisek widoczny) i 02 (pokój, bez dopisku). Dowód nietautologiczności: --mutant=clamp (przywraca obcinanie w bundlu) → 4 asercje czerwone, np. „pasek Respektu … 29”; --mutant=note (usuwa dopisek) → 3 asercje czerwone. Oba warianty: „MUTANT WYKRYTY”. Mutanty działają tylko w bundlu, pliki w repo nietknięte.
  2. Odstępstwo od allowlisty — PRZYJMUJĘ jako odstępstwo wymagające zatwierdzenia. Zmieniona jest tylko konieczna minimalna część istniejącego testu (dwie asercje kodujące obcinanie). Pozostałe asercje przeniesione do nowego pliku. Jeśli orkiestrator woli zero zmian w starym pliku, te dwie asercje można usunąć zamiast zmieniać (wynik: 33 OK zamiast 35 OK, pozostałe bez zmian).
  3. Twarde 29 w UI — PRZYJMUJĘ. diplomacyAudience.ts importuje WAR_RELATION_SCORE_CAP (= progMinimalnyRelacja-1); test sprawdza, że limit równa się stałej, a tekst dopisku jest generowany ze stałej.
  4. Dwuznaczny dopisek przy Relacji — PRZYJMUJĘ częściowo. Tooltip mówi teraz wprost „suma Zaufania i Respektu nie może przekroczyć 29”. Dopisek w wierszu Relacja był niemal nieczytelny (span .da-rel-sum-hint ma 0.58em), więc wyniesiono go i nadano czytelny styl (zrzut 01: bursztynowy „(limit wojenny 29)” obok 128 / 200 i pod etykietą WROGI). Brzmienie dopisku zostaje zgodne z dispatchem.
TESTY (wszystkie na commicie rundy 2, exit 0; tsc z node_modules podlinkowanym z sąsiedniego worktree):
  - npx tsc --noEmit (gra): exit 0
  - node tools/diplomacy-respect-true-value-real-render-test.cjs: 17 OK, 0 FAIL (Chromium headless)
  - --mutant=clamp: 13 OK, 4 FAIL → MUTANT WYKRYTY
  - --mutant=note: 14 OK, 3 FAIL → MUTANT WYKRYTY
  - node tools/diplomacy-display-test.cjs: 35 OK, 0 FAIL
  - diplo-quick-actions-labels-test: 38 OK, 0 FAIL
  - diplomacy-proposal-test: 199/199 PASS
  - diplomacy-infografiki-tooltipy-test: 12 OK, 0 FAIL
  - diplomacy-tech-chip-filter-and-multi-deal-test: 66/66 PASS
  - diplo-panel-recruits-level-test: ALL GREEN
  - diplo-active-treaties-resource-deals-test: 15 OK, 0 FAIL
  - diplomacy-audience-deals-active-first-real-render-test: 15 PASS, 0 FAIL
  - diplomacy-audience-zoom-cutoff-real-render-test: exit 0 (wszystkie PASS)
  - budmode-ulepszenia-sort-locked-real-render-test: exit 0 (wszystkie PASS)
  - git diff --check: czysto
  - Zrzuty 01 i 02 powstały po ostatniej zmianie CSS. mutant-*-A.png powstały przed tą zmianą i dowodzą efektu mutanta na wartościach, nie wyglądu.
BLOKADY: brak. Ograniczenie: dysk w chwili pracy 3,5–4 GB wolnego (poniżej progu 4 GB dla weba); nie uruchamiano pełnych bramek, tylko testy wymienione wyżej.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet): zatwierdzić lub odrzucić odstępstwo od allowlisty (diplomacy-display-test.cjs, 2 asercje); potem Final Control; integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
