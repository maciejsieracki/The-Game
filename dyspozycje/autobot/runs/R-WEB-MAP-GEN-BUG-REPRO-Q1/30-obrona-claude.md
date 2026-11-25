STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-MAP-GEN-BUG-REPRO-Q1
GOAL: Minimalne odtworzenia 5 kandydatów BŁĄD-GRY generatora map z Q14-E2 i klasyfikacja. Obrona po zarzutach Evaluatora (commit 8985804a2fcc2fe68efc47669293cea6485f87ec): poprawki skryptów, metryk, czasów i klasyfikacji oraz odpowiedź na każdy zarzut.
ZMIANY/COMMIT: kandydat operatora 9d3db2656 (checkout --detach); poprawki w tej rundzie: `repro/bundle.cjs`, `repro/r5-density-monotone.cjs`, `dyspozycje/analizy/GENERATOR-MAP-BLEDY-REPRO-2026-11-25.md`, ten raport. Commit: patrz SHA w StructuredOutput (commit obrony zawiera tylko te cztery ścieżki).
TESTY (surowe liczby z wyjścia uruchomień w tej rundzie):
- r1 Ziemia seed 777: `offMaskLand":72,"byTerrain":{"laka":72}`, 68 of 72 przy brzegu; seed 42: ta sama liczba 72 i ta sama lista (sample identyczny). Czas 44 s i 43 s.
- r4 wyspy 108×74 seed 42: `openOceanLandSpecks":1` (74 s). r4 kontynenty 168×120 seed 42: `openOceanLandSpecks":0` (122 s).
- r3 kontynenty 42: `limitMaxGap":7`, 8 z 20 mas złych, `worstGapAll":18` (121 s). r3 pangea 7: `badMasses":[{"size":7056,"worstGap":15}]` (20 s).
- r5 gęstość (metryki zgodne z world-density-test.cjs:48–72): `depLow=3233 depMed=4711 depHigh=6311 monoDep=true`; `rivLow=602 rivMed=571 rivHigh=584 monoRiv=false`; `desLow=504 desMed=503 desHigh=503 monoDes=false`; `forLow=4262 forMed=6421 forHigh=8020 monoFor=true` (118 s).
- Referencja `node gra/tools/world-density-test.cjs` (243 s): `world-density-test: 29 pass, 2 fail`, FAIL: `rzeki sum low=602 med=571 high=584`, FAIL: `pustynia sum low=504 med=503 high=503`.
- `npm ci --ignore-scripts` w gra/ (potrzebne do esbuild), node_modules usunięty po pracy.
BLOKADY: brak blokady technicznej. NIE ZMIERZONO: „15 FAIL z 3” stranded-land (nie uruchomiono stranded-land-test.cjs); przyczyny etapowe pkt 1 i 5; źródło wymogu monotonii tierów; trzeci seed dla listy łąk Ziemi; ponowienie earth-template-test (Antarktyda) w tej rundzie.

ODPOWIEDŹ NA ZARZUTY:

1. (bundle.cjs, ścieżka do cudzego worktree) — PRZYJĘTE i poprawione. `bundle.cjs` wyznacza `gra/` względem własnego położenia (`path.resolve(HERE, '..'×5, 'gra')`, zweryfikowane: wynik to `<worktree>/gra`), z opcjonalnym nadpisaniem `GRA_DIR`. Uruchomienia r1, r3, r4, r5 w tej rundzie szły na kodzie z bieżącego checkoutu (SHA 9d3db2656). Wyniki są zgodne z wcześniejszymi, bo źródło `gra/src` nie zmieniło się.

2. (czasy zaniżone) — PRZYJĘTE. Czasy w dokumencie zastąpione zmierzonymi (tabela „Czasy” w analizie): Standard 43–122 s, Mała 74 s, r5 118 s, pełny world-density-test 243 s. Kryterium < 10 min spełnione.

3. (metryki złóż i lasu w r5 inne niż w teście) — PRZYJĘTE. `countDeposits` i `countForest` w r5 przepisane wg `world-density-test.cjs:48–72` (las = nakładka `Las`, nie typ terenu; złoże = `zloze` lub nakładka inna niż Brak/Las). Teraz las i złoża dają wartości niezerowe i są monotoniczne (`monoFor=true`, `monoDep=true`). Wcześniejsze `monoFor=true` z zerami było artefaktem — usunięte, w dokumencie wpisano nowe liczby.

4. (klasyfikacja pkt 5 zbyt mocna; pustynia 504 vs 503) — PRZYJĘTE. Pkt 5 zmieniony na NIEJEDNOZNACZNE. Podstawy: pustynia 1 heks na 5 ziarnach; rzeki odwrócone per ziarno w obu kierunkach (ziarno 7: 122/111/127; ziarno 99: 138/114/128); źródło wymogu „AC-7” w `dyspozycje/_handoff/MASTER-do-MAPA_E2-gestosc-generator.md:34` nie zawiera jawnej monotonii tierów. Potwierdzone pozostaje to, że test zgłasza 2 FAIL na tych liczbach (raw output powyżej). Pkt 4 (samotne lądy) zostawiony jako BŁĄD GRY, ale z jawnym zastrzeżeniem: postwarunek z komentarza kodu (`gen-helpers.ts:5177–5179`) został naruszony w 1 z 2 zbadanych przypadków; częstość NIE ZMIERZONO.

5. („Odtworzone? TAK” szersze niż dowód) — PRZYJĘTE. Kolumna w tabeli podsumowania przepisana: pkt 3 „częściowo” (8/20 mas, 1/1), pkt 4 „częściowo” (1 heks w 1 z 2 map; „15 FAIL z 3” NIE odtworzono), pkt 5 „TAK” tylko dla dwóch FAIL zgłaszanych przez sam test, z klasyfikacją NIEJEDNOZNACZNE.

6. (seed 42 dla tezy o Ziemi nie podany w surowym wyjściu) — PRZYJĘTE i uzupełnione. Surowe wyjście r1 dla seed 42 wklejone do analizy (sekcja 1). Wynik identyczny z seed 777: `offMaskLand: 72`, ta sama lista heksów. Teza „układ lądu nie zależy od seeda” pozostaje obserwacją dla dwóch seedów (N=2), a nie dowodem; w dokumencie oznaczona jako NIE ZMIERZONO (brak trzeciego seeda).

7. (STATUS PASS mimo niezmierzonych elementów; liczby Q14 z dispatchu) — PRZYJĘTE. Status zmieniony na PASS-WITH-NOTES. Liczby „15/18 hex” i „15 FAIL z 3” pochodzą z dispatchu/Q14-E2 i nie są potwierdzone w tej rundzie; w dokumencie oznaczone jako NIE ZMIERZONO. Pliki `R-WEB-TEST-DEBT-Q14-E2-Q1/10-operator-claude.md` i `30-obrona-claude.md` nie zostały odczytane z origin (zob. UWAGI).

NASTĘPNY KROK: orkiestrator decyduje o integracji po Evaluatorze (ten raport jest wejściem dla rundy 2 Evaluatora). Tematy P1–P4 i dług testowy z dokumentu analizy; pytania ABC wyglądu (Antarktyda na Ziemi; limit ujść dla Ziemi) przekazać wg zasad ABC. Przed P2 potwierdzić źródło wymogu monotonii.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch wskazywał `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-E2-Q1/10-operator-claude.md` jako źródło kandydatów; w tej rundzie nie był potrzebny do odtworzeń, a liczby Q14 pozostają nie zweryfikowane.
- Bundler `repro/bundle.cjs` tworzy pliki pomocnicze `.entry-*.ts` i `.bundle-*.cjs` w `repro/` — nie są commitowane; trzeba je ignorować przy `git add`.
- `gra/tools/world-density-test.cjs` przy uruchomieniu zapisuje `gra/tools/.world-density-*` (nieśledzone, usunięte po pracy).
- Dla typu Ziemia wszystkie zmierzone łąki są w tym samym miejscu dla dwóch seedów — warto sprawdzić, czy generator Ziemi w ogóle używa seeda na etapie lądu (osobny temat, nie w tym zakresie).
