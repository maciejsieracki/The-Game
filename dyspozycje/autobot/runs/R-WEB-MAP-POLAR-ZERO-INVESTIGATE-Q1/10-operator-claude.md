STATUS: DECISION_REQUIRED
DOMAIN: GAME (analiza; kod gry i test NIE zmienione)
TEMAT: R-WEB-MAP-POLAR-ZERO-INVESTIGATE-Q1
GOAL: ustalić, czy climate-band-test (0 heksów polarnych) to regresja generatora (A), stary pin testu (B), czy zamierzona zmiana (C).
ZMIANY/COMMIT: dyspozycje/analizy/MAP-POLAR-ZERO-2026-11-20.md, dyspozycje/autobot/runs/R-WEB-MAP-POLAR-ZERO-INVESTIGATE-Q1/10-operator-claude.md. Baza a3651d373bef071857150b3369e3cbe168995150. Test nie zmieniony (werdykt nie jest B).
TESTY:
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed (exit 0)
- pangea-land-determinism-test: PASS (hashe 3 typów identyczne z bazą, Pangea 59-61%)
- pangea-land-fraction-test: 3 seedów PASS (0 fail)
- relief-grid-coverage-test: NIE ZMIERZONO do końca (limit czasu 280 s i 585 s; częściowo PASS do „Standard Ziemia: miedź 15×15 (3/3)")
- climate-band-test (bieżący, bez zmian): FAIL: map has polar terrain (0 hexes); FAIL (1); pozostałe asercje PASS
POMIAR (realne generujSwiat): polar=0 dla kontynenty/standardowy przy seed 1, 7, 42, 4242; kontynenty/malenki seed 42 = 0; ziemia/standardowy seed 42 = 0 (projektowo bez Antarktydy); pangea/standardowy seed 42 = 146.
MECHANIZM: na kontynenty/standardowy wiersze 0–21 są morzem (ląd od wiersza 22); środki kontynentów mają borderMargin 0.12 (gen-helpers.ts ~l. 336–349), więc pas polarny (wiersze 6–11 i 108–113) leży poza zasięgiem lądu.
HISTORIA: test pojawia się w a99445016 (2026-11-13) i już tam daje polar=0 (git archive + ten sam bundle); 851fc3fd8 i baza też 0. gen-helpers.ts/generator.ts nie zmieniły się w tym zakresie. Nie znaleziono commitu zmieniającego wynik z zielonego na czerwony → brak dowodu regresji (A).
BLOKADY: decyzja produktowa, czy kontynenty mają zawierać ląd polarny (ABC). Rekomendacja Operatora: wariant B — asercja polarna przeniesiona na pangea seed 42 (146 heksów), dla kontynentów jawny zapis „brak pasa polarnego w układzie kontynentów". Bez decyzji nie zmieniam asercji (byłoby to osłabienie testu).
PYTANIE ABC (dla orkiestratora): A — kontynenty z lądem polarnym (zmiana borderMargin/promieni, ryzyko hashy map i determinizmu); B (rekomendacja) — test wg obecnego generatora; C — zostawić czerwony jako dług kategorii D.
RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana)
NASTĘPNY KROK: decyzja właściciela A/B/C; po niej osobny temat implementacyjny (A: generator, B: gra/tools/climate-band-test.cjs).
UWAGI-DLA-ORKIESTRATORA: (1) płytki klon — pobrano --deepen=200 origin main (bez zmian w kodzie); (2) pliki artefaktów gra/tools/.climate-band-* i symlink gra/node_modules są w worktree (ignorowane przez .gitignore lub poza commitem); (3) relief-grid-coverage wymaga osobnego długiego przebiegu (>10 min) poza limitem 590 s.
DEPLOY/PUSH: NIE WYKONANO
