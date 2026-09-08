STATUS: DISPATCH (RUNDA 2 — kontynuacja po zarzucie Evaluatora rundy 1, przyjętym w Obronie)
DOMAIN: GAME
TEMAT: P-AI-BADANIA-ZACOFANIE-Q1
GOAL RUNDY 2: Domknij lukę zgłoszoną i przyjętą w Obronie rundy 1 (Zarzut 1) — `procentNauka`
NIE jest faktycznie stałe 60% w turze 1 gry (ani analogicznie dla nowo powstałego ownera AI
w trakcie gry, np. cesja/rewolta) dla żadnej cywilizacji AI, bo `ownerDefaultPodzialHandlu`
jest seedowane wartością domyślną `DEFAULT_PODZIAL_HANDLU.procentNauka=20` bez gałęzi
AI-specyficznej, a `advanceCityEconomy` czyta ten seed PRZED pierwszym wywołaniem
`decideAIEconomySliders` w tej samej turze.

DECYZJA ORKIESTRATORA (bez eskalacji do właściciela — uzasadnienie): Obrona Operatora
zgłosiła dwie opcje: (a) rozszerzyć allowlistę o 3 konkretne miejsca w `main.ts` i naprawić
analogicznie do już zaakceptowanego, identycznego wzorca `AI_FIXED_PROCENT_BUDYNKI`/
`ownerDefaultPodzialPracy` (main.ts:5045-5058), albo (b) zaakceptować wyjątek "60% od tury 2".
Orkiestrator wybiera (a): to jest DOKŁADNIE ten sam, już raz zaakceptowany bez ABC wzorzec
naprawy (ten sam plik, ta sama klasa błędu — luka pierwszej tury przy seedowaniu domyślnych
wartości suwaka AI), zerowe ryzyko nowej decyzji produktowej — cel dispatchu ("STAŁE 60%")
nie zawierał wyjątku "poza turą 1", więc (b) byłoby cichym osłabieniem GOAL bez potrzeby.
Rozszerzenie allowlisty jest wąskie i precyzyjnie wskazane (3 miejsca, nie "main.ts w całości").

KONTEKST — PRZECZYTAJ RUNDĘ 1 W CAŁOŚCI (`01-operator-runda1.md` w tym katalogu jeśli istnieje,
oraz raport Evaluatora/Obrony rundy 1 w historii commitów tej gałęzi) PRZED PIERWSZĄ ZMIANĄ:
- `main.ts:5017-5024` (`initOwnerDefaultPodzialHandlu`, świeżo zweryfikuj numery linii) —
  seeduje `ownerDefaultPodzialHandlu` dla WSZYSTKICH ownerów (gracz + każdy AI z
  `aiStartHexes`) tą samą `freshOwnerDefaultPodzialHandlu()` = `DEFAULT_PODZIAL_HANDLU`
  (`procentNauka: 20`), BEZ gałęzi AI-specyficznej.
- Wzorzec do skopiowania 1:1 (już zaakceptowany, ten sam plik): `main.ts:5045-5058`
  (`ownerDefaultPodzialPracy` seeding) — gałąź `ai.ownerId === 0 ? freshOwnerDefaultPodzialPracy()
  : { procentBudynki: AI_FIXED_PROCENT_BUDYNKI }`, z komentarzem wyjaśniającym dokładnie tę
  samą klasę błędu (R-AI-PRACA-PODZIAL-STALY-50-50-Q1).
- Dwa dodatkowe miejsca analogiczne (nowo powstający owner AI w trakcie gry — cesja/rewolta):
  `main.ts:8813-8815` i `main.ts:22004-22006` (świeżo zweryfikuj — Obrona rundy 1 je
  zidentyfikowała, ale mogły się przesunąć).
- Sprawdź też `main.ts:5119-5129` (`seedCityOwnerDefaults`) — ma już gałąź AI TYLKO dla
  `ownerDefaultPodzialPracy`, brak analogicznej dla `ownerDefaultPodzialHandlu` — może wymagać
  tej samej poprawki jeśli to osobna, realna ścieżka seedowania (zweryfikuj czy jest wołana
  niezależnie od trzech miejsc wyżej, czy to duplikat tej samej luki w innym punkcie startu).

ZADANIE:
1. W KAŻDYM z ustalonych miejsc dodaj gałąź analogiczną do `ownerDefaultPodzialPracy`: dla
   AI (nie gracza, `ownerId !== 0`) seeduj `ownerDefaultPodzialHandlu.procentNauka` od razu
   wartością `AI_FIXED_PROCENT_NAUKA` (z `cities.ts`, dodane w rundzie 1) zamiast
   `DEFAULT_PODZIAL_HANDLU.procentNauka` (20), zachowując resztę pól `CityPodzialHandlu`
   (luksus itd.) bez zmian.
2. Żywy dowód PRZED/PO w TYM SAMYM harnessie co runda 1 (`diag-nauka-fixed-60.cjs`), ale
   ZMIENIONYM tak, żeby odtwarzał PRAWDZIWĄ kolejność z `main.ts` (ekonomia tury 1 liczona
   PRZED pierwszym wywołaniem `decideAIEconomySliders`, nie po) — Evaluator rundy 1 wskazał
   że dotychczasowy skrypt miał odwróconą kolejność i dlatego nie złapał tej luki. Zmierz
   `procentNauka` faktycznie użyte przez ekonomię w turze 1 dla nowej cywilizacji AI: PRZED
   naprawą powinno być 20, PO naprawie 60.
3. Rozszerz `ai-slider-test.cjs` (albo dodaj nowy plik) o asercję sprawdzającą dokładnie ten
   scenariusz (tura 1, świeży owner AI, brak wpisu w `aiSliderStateByOwner`) — bez niej ta
   klasa błędu jest niewidoczna dla żadnej istniejącej bramki (potwierdzone przez Evaluatora
   rundy 1).

BINARNE KRYTERIUM SUKCESU: `procentNauka` dla KAŻDEJ cywilizacji AI jest 60% w KAŻDEJ turze,
włącznie z turą 1 i momentem powstania nowego ownera AI w trakcie gry — zero udokumentowanych
wyjątków. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone, `ai-slider-test.cjs` zielone
(nowa asercja + wszystkie z rundy 1, poza pre-istniejącymi, niepowiązanymi 5 failami w
sekcjach B/C — zweryfikowanymi przez Evaluatora rundy 1 jako identyczne na bazie sprzed tego
tematu, nie regresja tego tematu).

ALLOWLISTA (RUNDA 2 — rozszerzona względem rundy 1):
- `gra/src/game/ai.ts`, `gra/src/game/cities.ts` (z rundy 1, bez zmian zakresu)
- `gra/src/main.ts` — WYŁĄCZNIE trzy miejsca seedowania `ownerDefaultPodzialHandlu` wskazane
  wyżej (`initOwnerDefaultPodzialHandlu` ok. 5017-5024, i dwa analogiczne ok. 8813-8815 i
  22004-22006) plus `seedCityOwnerDefaults` (ok. 5119-5129) JEŚLI diagnoza potwierdzi że to
  osobna, realna ścieżka tej samej luki — NIC WIĘCEJ w main.ts.
- `gra/tools/ai-slider-test.cjs`, `dyspozycje/autobot/runs/P-AI-BADANIA-ZACOFANIE-Q1/*`
Zakaz `git add -A`. Zakaz zmiany `MAX_PROCENT_NAUKA`/`AI_FIXED_PROCENT_BUDYNKI`/jakiejkolwiek
innej liczby balansu. Zakaz zmiany zachowania GRACZA (ownerId===0) w którymkolwiek z tych
miejsc — gałąź istnieje TYLKO dla AI, dokładnie jak wzorzec `ownerDefaultPodzialPracy`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "STAŁE 60%" bez dowodu z harnessu
odtwarzającego PRAWDZIWĄ kolejność main.ts (ekonomia PRZED korektą suwaka w tej samej turze) —
dokładnie ta usterka metodyki zawiodła w rundzie 1, nie powtarzaj jej.

IZOLACJA: worktree `/home/user/wt-ai-badania-zacofanie` (JUŻ ISTNIEJE z rundy 1, ta sama
gałąź `autobot/P-AI-BADANIA-ZACOFANIE-Q1`, HEAD `7eef00bf`) — kontynuuj na tej samej gałęzi,
NIE zakładaj nowej.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Liczy się jako RUNDA 2 (runda 1 = Operator+Evaluator+Obrona
zakończona DECISION_REQUIRED, rozstrzygniętym tu przez orkiestratora).

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry, wymaga Final Control. Final Control MUSI też ponownie
sprawdzić nakładanie z `P-AI-BARBARZYNCY-PRIORYTET-ELIMINACJA-Q1` (już zintegrowane/w
integracji, dotyka ai.ts) i `P-AI-ULEPSZENIA-BUDOWA-ZNIKOMA-Q1` runda 2 (aktywna, dotyka
ai.ts) — żeby uniknąć konfliktu scalania.
DEPLOY/PUSH: NIE WYKONANO
