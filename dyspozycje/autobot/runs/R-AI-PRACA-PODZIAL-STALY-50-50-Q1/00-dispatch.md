TEMAT:  R-AI-PRACA-PODZIAL-STALY-50-50-Q1
RUNDA:  1/5
DATA:   2026-09-03
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat logiki AI/ekonomii (nie wizualny) — Operator
Sonnet 5 effort=high / Evaluator Sonnet 5 effort=high / Final Control Sonnet 5
effort=high (rdzen main.ts + ai.ts, zmiana zachowania ekonomicznego wszystkich
AI cywilizacji i miast-panstw przez cala gre — wysokie ryzyko regresji balansu).

## WYZWALACZ
Właściciel, po zamknięciu R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 (ta naprawa zapobiegła
trwałemu zeru w puli, ale NIE zwiększyła tempa budowy ulepszeń terenu widocznych
na mapie — jawnie zgłoszone jako ograniczenie tamtej naprawy): "W takim razie ten
temat zbadaj i ustaw dla AI cywilizacji oraz państw-miast sztywny limit 50 na 50:
50% na ulepszenia, 50% na budynki, żeby miał z czego zarówno budować budynki, jak
i generować ulepszenia. Temat: rozpoznaj i napraw."

## RECON (wykonany subagentem Explore, nie powtarzaj — pełny raport w historii
## dyspozycji tego tematu, tu tylko wnioski operacyjne)

**Kluczowe odkrycie wyjaśniające pierwotny objaw ("AI buduje mało ulepszeń
widocznych na mapie"), którego R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1 NIE adresowało:**
Podział Pracy miasta na budynki/ulepszenia (`city.podzialPracy.procentBudynki`,
`gra/src/game/production.ts::splitPraca`) jest dziś DYNAMICZNY, nie stały, i
klamrowany WYŁĄCZNIE asymetrycznie: `clampPodzialPracyBudynkiPercent`
(`gra/src/game/cities.ts:495-501`) wymusza `procentBudynki ∈ [50, 100]` —
czyli budynki NIGDY nie dostają mniej niż 50%, ale MOGĄ dostać do 100% (pula
ulepszeń → 0%). Sterownik tej wartości to `decideAIEconomySliders`
(`gra/src/game/ai.ts:4874-4964`), wołany per-właściciel co `minOdstepTur` tur
(`gra/src/main.ts:28461-28553`, zapis `:28535`+broadcast `:28540`):
- w stanie wojny: `procentBudynki += krok` (do 100) — pula ulepszeń może
  spaść do ZERA na czas wojny (a wojny wymuszone trwają dziś do 25 tur,
  R-WOJNA-WYMUSZONA-REGULY-Q1 z tej samej sesji);
- w pokoju, wczesna gra, główna AI: cel `AI_MAJOR_EARLY_PROCENT_BUDYNKI=40`
  (`ai.ts:1146`) — i tak PRZYCINANY w górę do 50 przez klamrę, więc de facto
  martwy;
- w pokoju, środek/koniec gry, główna AI: cel
  `AI_MAJOR_MID_PROCENT_BUDYNKI=50` (`ai.ts:1148`);
- miasta-państwa (`opts.defensiveCopy`/`typCityCopyOwners`): TA SAMA funkcja,
  bez fazowych celów 40/50, ale z tym samym mechanizmem podbijania w wojnie/
  obniżania w pokoju.
Wniosek: sufit 50% na ulepszenia JUŻ istnieje strukturalnie (nigdy nie
przekracza 50%), ale PODŁOGA na ulepszenia to dziś efektywnie 0% (wojna może
zepchnąć budynki do 100%). To jest prawdziwa przyczyna niskiej widocznej
budowy ulepszeń — nie sam floor ZASADY 3 (naprawiony poprzednio), tylko
strukturalna możliwość zepchnięcia całej puli do zera przez heurystykę
suwaka w dowolnym momencie (zwłaszcza podczas wojny).

**ZASADA 3** (`gra/src/main.ts` ok. 29643-29719, `MIN_PROCENT_PULI_IMPERIUM_
ZASADA3_NADWYZKA=10`, temat poprzedni) to ODRĘBNY mechanizm — przekierowanie
NADWYŻKI puli na budynki, gdy w danej turze faktycznie brak sensownych
kandydatów na ulepszenia (nie problem budżetu, tylko brak celu). Świadomie
wykluczone dla miast-państw (`opts.defensiveCopy`). To NIE jest sprzeczne ze
"sztywnym 50/50" jako stanem STANDARDOWYM — to wyjątek na turę, gdy pula i
tak nie miałaby czego finansować.

**Cztery miejsca zapisujące `procentBudynki` dla AI/miast-państw** (patrz
recon): suwak AI (`main.ts:28535`), ZASADA 3 on/off (`main.ts:29697,29709`),
migracja zapisu (`main.ts:33552`). Piąte miejsce, `main.ts:20213-20222`
(`configureEmpireGlobalDefaults`), jest jawnie ograniczone do gracza
(`if (ownerId !== 0) return;`) — NIE ruszać, gracz zachowuje pełną kontrolę
swojego suwaka (UI panel imperium, `cityPanel.ts:4900-4955`).

## GOAL
Dla KAŻDEGO właściciela AI (cywilizacja główna LUB miasto-państwo,
`ownerId>0`) ustaw sztywny, NIEDYNAMICZNY podział `procentBudynki=50` jako
stan STANDARDOWY (żaden wpływ wojny/pokoju/fazy gry na tę wartość) — zamiast
dzisiejszej heurystyki suwaka (`decideAIEconomySliders`) podbijającej ją do
100 w wojnie lub chodzącej między 40/50 w pokoju. Konkretnie:
1. Usuń/wyłącz dynamiczne dostosowywanie `procentBudynki` przez
   `decideAIEconomySliders` dla AI cywilizacji i miast-państw — zdecyduj
   najczystszy sposób (np. funkcja zawsze zwraca 50 dla tych właścicieli,
   albo wywołanie w `main.ts:28461-28553` jest pominięte i wartość ustawiana
   wprost na 50) — uzasadnij wybór w raporcie.
2. ZASADA 3 (przekierowanie nadwyżki, `main.ts` ok. 29643-29719) POZOSTAJE
   bez zmian logiki — nadal może chwilowo podnieść `procentBudynki` do 90
   (`MAX_PODZIAL_PRACY_BUDYNKI_PERCENT - MIN_PROCENT_PULI_IMPERIUM_ZASADA3_
   NADWYZKA`) na turę faktycznego braku kandydatów na ulepszenia, i
   przywrócić po ustaniu nadwyżki. Zweryfikuj ŻYWO że "przywrócenie po
   ustaniu nadwyżki" teraz przywraca do STAŁEGO 50 (nie do starej wartości
   heurystyki suwaka, która już nie istnieje) — sprawdź `aiSliderStateByOwner`/
   fallback default w miejscu przywracania (`main.ts:29705-29714`).
3. Gracz (`ownerId===0`) BEZ ŻADNYCH zmian — jego suwak pozostaje w pełni
   pod jego kontrolą, z tym samym zakresem UI `[50,100]` co dziś.
4. Domyślne/startowe seedowanie (`initOwnerDefaultCityFields`,
   `seedCityOwnerDefaults`, `main.ts:4738-4765,4775-4790`) dla AI/miast-
   państw powinno też dawać 50 od startu (dziś `DEFAULT_PODZIAL_PRACY=70`) —
   zweryfikuj czy to wymaga osobnej zmiany, czy wystarczy że pierwszy
   przebieg `decideAIEconomySliders`/nowej stałej logiki nadpisze to i tak
   w pierwszej turze; jeśli jest okno (np. tura 1 przed pierwszym wywołaniem
   suwaka) w którym AI ma 70/30 zamiast 50/50 — napraw też seedowanie.
5. Sufit `MAX_PROCENT_PULI_IMPERIUM=50`/`clampPodzialPracyBudynkiPercent`
   zakres `[50,100]` — BEZ zmian (nadal poprawny zakres dla gracza i dla
   maksimum ZASADY 3).

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód (symulacja wieloturowa w `gra/tools/`, prawdziwy silnik przez
   `decideAITurn`/`decideDefensiveCopyTurn`, nie reimplementacja): AI
   cywilizacja główna, POZA turami ZASADY 3 (bez nadwyżki), ma
   `procentBudynki===50` na KAŻDEJ zmierzonej turze, w tym W STANIE WOJNY
   (skonstruuj żywy scenariusz wojny, np. przez istniejący mechanizm
   wymuszonej wojny albo bezpośrednie ustawienie stanu wojny) — potwierdź że
   wartość NIE rośnie do 100 jak dziś.
2. To samo dla miasta-państwa (`opts.defensiveCopy`/`typCityCopyOwners`).
3. Żywy dowód: gracz (`ownerId===0`) nadal ma w pełni działający, interaktywny
   suwak `[50,100]` w panelu imperium/miasta — zero regresu (test istniejący
   lub nowy, `page.screenshot()` jeśli wymaga potwierdzenia wizualnego stanu
   UI, żywa symulacja jeśli wystarczy).
4. Żywy dowód: ZASADA 3 nadal działa (podnosi do 90 na turę faktycznej
   nadwyżki, potem przywraca do 50 — NIE do jakiejś nieaktualnej wartości
   suwaka) — dla AI cywilizacji; miasta-państwa nadal WYKLUCZONE z ZASADY 3
   (bez regresu istniejącego wykluczenia `opts.defensiveCopy`).
5. Żywy dowód mierzący FAKTYCZNY efekt: wieloturowa symulacja (np. 5 ziaren
   x 100 tur, różne trudności, z co najmniej jedną cywilizacją przechodzącą
   przez wymuszoną wojnę w trakcie symulacji) pokazująca że łączny udział
   puli imperium (pool share) AI cywilizacji NIE spada poniżej ok. 50%
   podczas wojny tak jak dziś (przed poprawką) — miarą sukcesu jest
   PORÓWNANIE przed/po na tym samym scenariuszu wojny, nie tylko odczyt
   stałej.
6. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   pełny zestaw testów budżetu Pracy/AI-suwaka/ZASADY 3 w `gra/tools/`
   wymienionych w recon (m.in. `ai5-zasada3-harness.cjs`,
   `ai5-z3-fc2-probe.cjs`, `ev5-z3-fc2-kontrola.cjs`,
   `ai4-popyt-obywatele-test.cjs`, `ai4-mutacje.cjs`,
   `ai-ulepszenia-malo-budowane-test.cjs`, `ai-praca-split-parity-test.cjs`,
   `praca-limit-50-test.cjs`, `praca-miasto-limit-50-test.cjs`,
   `praca-miasto-limit-50-cap-test.cjs`, `city-state-prod-audit-test.cjs`,
   `praca-global-default-live-test.cjs`) bez regresu — jeśli którykolwiek
   asercjonuje dzisiejszą DYNAMICZNĄ wartość (np. `AI_MAJOR_EARLY_PROCENT_
   BUDYNKI=40` faktycznie stosowane, albo podbicie do 100 w wojnie jako
   OCZEKIWANE zachowanie) — jawnie zaktualizuj te konkretne asercje zgodnie
   z nowym, zamierzonym zachowaniem (nie kasuj testu, popraw oczekiwaną
   wartość z uzasadnieniem w raporcie).
7. Diff ograniczony do plików w ALLOWLIŚCIE.

## ALLOWLISTA — nic poza tym
`gra/src/game/ai.ts` (WYŁĄCZNIE `decideAIEconomySliders` i jej bezpośrednie
wywołanie/konsumpcję — NIE ruszaj `chooseCityProduction`, `planCityImprovements`,
ani innej logiki wyboru celów), `gra/src/main.ts` (WYŁĄCZNIE punkt wywołania
suwaka AI ok. `:28461-28553`, ZASADA 3 ok. `:29643-29719` TYLKO jeśli
weryfikacja z Kroku 2 wymaga poprawki w logice przywracania — NIE zmieniaj
warunku wykluczenia `opts.defensiveCopy`, i seedowanie domyślnych
`initOwnerDefaultCityFields`/`seedCityOwnerDefaults` TYLKO jeśli Krok 4
wykaże realną potrzebę), `gra/src/game/cities.ts` (WYŁĄCZNIE jeśli potrzebna
nowa nazwana stała, np. `AI_FIXED_PROCENT_BUDYNKI=50` — NIE zmieniaj
`clampPodzialPracyBudynkiPercent`/zakresu `[50,100]`/`MAX_PROCENT_PULI_
IMPERIUM`), nowy/rozszerzony plik testowy w `gra/tools/`, aktualizacja
istniejących testów wymienionych w kryterium 6 gdy asercjonują starą
dynamikę. Zakazane bezwzględnie: `gra/data/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`, jakakolwiek zmiana ścieżki gracza (`ownerId===0`) poza
weryfikacją braku regresu.

## IZOLACJA
worktree własny, gałąź `autobot/R-AI-PRACA-PODZIAL-STALY-50-50-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 5 (faktyczny efekt) za spełnione na podstawie
samego odczytu `procentBudynki===50` ze stanu — wymagane jest ŻYWE
porównanie przed/po na scenariuszu z realną wojną, pokazujące że pula
ulepszeń faktycznie NIE zostaje zepchnięta do zera tak jak dziś. Zakaz
założenia że usunięcie heurystyki suwaka nie ma żadnych skutków ubocznych
dla `aiSliderStateByOwner`/ZASADY 3 bez żywej weryfikacji ścieżki
przywracania (Krok 2) — to dokładnie ten rodzaj załamania, które w temacie
R-DYPLO-TRAKTAT-HANDLOWY-WYBOR-CZASU-Q1 (ta sama sesja) wielokrotnie
umykało zielonym testom. Zakaz cichego wyłączenia ZASADY 3 "przy okazji" —
GOAL wymaga że ZASADA 3 nadal działa dla AI cywilizacji.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Sonnet 5) → Evaluator (Sonnet 5, zarzuty, lista może być pusta) →
Operator (Obrona, Sonnet 5, tylko gdy zarzuty niepuste) → Final Control
(Sonnet 5, osobne wywołanie Workflow) → orkiestrator integruje
allowlist-only i cutuje kolejną FALĘ ROBOCZA.
