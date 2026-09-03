TEMAT: R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: recon wymagany w mechanizmach wojny wymuszonej (gra/src/game/forced-war-stone.ts,
forced-war-bronze.ts, forced-war-iron.ts jeśli już zintegrowany z tematem równoległym) —
WYŁĄCZNIE te trzy, zgodnie z ECHO właściciela zawężającym zakres
MODEL+EFFORT: claude-sonnet-5, effort high (nowy mechanizm gry z realnym wpływem na trudność —
wymaga starannej weryfikacji poprawności warunku wyjątku sojuszu i braku niezamierzonych
efektów ubocznych na inne mechanizmy wojny wymuszonej)

WYZWALACZ (dosłownie od właściciela, rozszerzenie R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1)
"Jeżeli jakaś cywilizacja ma już parę i z kimś walczy, a gracz nie ma swojej pary do walki —
obie cywilizacje, które ze sobą walczą, wypowiadają jednocześnie wojnę graczowi, tak żeby jedna
cywilizacja nie musiała walczyć z dwoma, a reszta tylko z jedną. Wchodzą w konflikt trzy
cywilizacje między sobą, chyba że jedną z nich łączy sojusz lub padnie agresja."

ECHO właściciela na 3 pytania zawężające zakres (2026-09-03):
1. Zakres: WYŁĄCZNIE wojny wymuszone (Kamień/Brąz/Żelazo) — NIE ogólna ścieżka decyzyjna AI
   (`ai.ts` Priorytet 4). Zero zmian poza mechanizmem wojny wymuszonej.
2. Wyjątek sojuszu: uruchamia się WYŁĄCZNIE gdy ŻADNA ze stron pary (AI-A, AI-B) nie ma
   aktywnego sojuszu z graczem. Jeśli KTÓRAKOLWIEK ze stron ma sojusz z graczem — mechanizm się
   NIE uruchamia (sojusznik nigdy nie dołącza do wojny przez ten efekt domina).
3. Trudność: zamierzone zaostrzenie, BEZ dodatkowego łagodzenia (bez ograniczenia do wyższych
   poziomów trudności, bez dodatkowych progów częstości).

RECON WYMAGANY (Operator musi wykonać — orkiestrator nie zrobił pełnego reconu kodu dla tego
konkretnego mechanizmu)
- Znajdź dokładny mechanizm koordynowanego wyboru celu wojny wymuszonej (`candidatesAlready
  AtWarIds` lub analogiczny, wspomniany w recon `R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1`) —
  to jest miejsce, gdzie para AI-A/AI-B "już walczy ze sobą" jest wykrywana.
- Znajdź istniejący fallback-na-gracza (`playerActiveForcedWarCount`, wspomniany w recon tego
  samego tematu, `main.ts:29418-29420,29505-29507,29602-29604`) — TEN mechanizm jest bazą do
  rozszerzenia: dziś JEDNA AI z wyczerpanej puli kandydatów wypowiada wojnę graczowi; nowy
  mechanizm ma sprawić, że gdy AI-A i AI-B JUŻ walczą ze sobą (para wymuszona), OBIE
  jednocześnie wypowiadają wojnę graczowi (nie tylko jedna z puli).
- Znajdź jak sprawdzić aktywny sojusz gracz↔AI (prawdopodobnie `RodzajTraktatu.Sojusz` lub
  analogiczne pole stanu dyplomacji) — potrzebne do warunku wyjątku z ECHO 2.
- Sprawdź limit jednoczesnych wojen wymuszonych per trudność (łatwy: mechanizm wyłączony;
  normalny: max 1 naraz; trudny: bez limitu — wg wcześniejszego reconu) — ECHO 3 mówi "bez
  dodatkowego łagodzenia", czyli ten NOWY mechanizm (trójstronny) ma działać na WSZYSTKICH
  poziomach trudności gdzie wojna wymuszona w ogóle jest aktywna, bez nowego, dodatkowego progu
  — ale istniejący limit "max jednoczesnych wojen wymuszonych" per trudność NIE jest tym samym
  co "dodatkowe łagodzenie tego tematu" — potwierdź reconem czy ten limit koliduje z GOAL 1
  (potrzeba wypowiedzenia DWÓCH wojen naraz może przekroczyć istniejący limit "max 1") i opisz
  w raporcie jak to rozwiązujesz (np. ten konkretny scenariusz liczy się jako wyjątek od
  ogólnego limitu, bo to jedna, skoordynowana decyzja, nie dwie niezależne).

GOAL
1. Gdy dwie cywilizacje AI (A i B) są już we wzajemnej wojnie WYMUSZONEJ (Kamień/Brąz/Żelazo) i
   gracz nie ma własnej "pary" w tej samej rundzie kojarzenia kandydatów (czyli byłby pominięty
   przez dzisiejszy mechanizm parzystości) — OBIE cywilizacje A i B wypowiadają JEDNOCZEŚNIE
   wojnę graczowi, tworząc trójstronny konflikt (A vs B, A vs gracz, B vs gracz jednocześnie).
2. Wyjątek: jeśli KTÓRAKOLWIEK z cywilizacji A/B ma w danym momencie aktywny sojusz z graczem —
   mechanizm się NIE uruchamia dla tej pary (żadna z nich nie wypowiada wojny graczowi przez
   ten efekt).
3. Zero zmian w ogólnej (niewymuszonej) ścieżce decyzyjnej AI (`ai.ts` Priorytet 4) — mechanizm
   wyłącznie w ramach istniejącego systemu wojny wymuszonej.
4. Brak dodatkowego ograniczenia do poziomów trudności — mechanizm aktywny wszędzie tam, gdzie
   wojna wymuszona jest w ogóle aktywna na danym poziomie trudności (zgodnie z istniejącym
   `citySupportByDifficulty`/analogicznym rozróżnieniem, nietkniętym).
5. Zero regresji w istniejącym fallback-na-gracza (pojedyncza AI z wyczerpanej puli) — ten
   mechanizm zostaje jako fallback dla przypadków BEZ pary już-w-wojnie; nowy mechanizm to
   DODATKOWA ścieżka, nie zamiennik.

KRYTERIA KOŃCA (binarne)
1. Test: żywa/symulowana sytuacja z parzystą liczbą AI, gdzie AI-A i AI-B trafiają w parę
   wymuszoną między sobą, a gracz zostaje bez pary — OBIE A i B wypowiadają wojnę graczowi w
   TEJ SAMEJ turze/rundzie koordynacji (nie tylko jedna).
2. Test: identyczna sytuacja, ale AI-A ma aktywny sojusz z graczem — mechanizm się NIE
   uruchamia (ani A, ani B nie wypowiada wojny graczowi przez ten efekt; A i B mogą nadal
   walczyć ze sobą normalnie).
3. Test: zero regresji na istniejącym fallback-na-gracza (`P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1`)
   dla sytuacji BEZ pary już-w-wojnie (nieparzysta liczba AI, gracz dostaje pojedynczą wojnę
   jak dziś).
4. Zero regresji na ogólnej ścieżce decyzyjnej AI — istniejące testy `ai-test.cjs` (lub
   analogiczne) bez zmian wyników.
5. Zero regresji na istniejących testach wojny wymuszonej (`forced-war-stone-test.cjs`,
   `forced-war-bronze-test.cjs`, ewentualnie `forced-war-iron-test.cjs` jeśli już
   zintegrowany).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test, research-test,
   unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/forced-war-stone.ts, forced-war-bronze.ts, forced-war-iron.ts (jeśli istnieje w
  momencie dispatchu — sprawdź reconem) — WYŁĄCZNIE logika koordynacji celu/fallbacku na
  gracza.
- gra/src/main.ts — WYŁĄCZNIE punkty wywołania fallbacku (`playerActiveForcedWarCount` i
  okoliczne linie wg reconu wcześniejszego tematu), warunkowane sprawdzeniem sojuszu.
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana ogólnej
(niewymuszonej) ścieżki decyzyjnej AI (`ai.ts` Priorytet 4), zmiana limitu jednoczesnych wojen
wymuszonych per trudność poza minimalnym, udokumentowanym wyjątkiem z GOAL 1/RECON.

IZOLACJA
worktree /home/user/wt-wojna-trojstronna, gałąź autobot/R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1, baza
jawnie: origin/main (najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-wojna-trojstronna --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1/2 za spełnione bez żywej symulacji dokładnie opisanego scenariusza
(para wymuszona + gracz bez pary; osobno z i bez sojuszu) — nie czytania samego kodu warunku.
Zakaz założenia, że limit jednoczesnych wojen wymuszonych per trudność nie koliduje z GOAL 1
bez faktycznego sprawdzenia reconem i jawnego opisania w raporcie, jak kolizja jest
rozwiązana.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
