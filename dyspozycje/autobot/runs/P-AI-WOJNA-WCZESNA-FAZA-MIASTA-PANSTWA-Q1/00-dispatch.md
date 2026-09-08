STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1
GOAL: Przez pierwsze 25 tur gry główne cywilizacje AI NIE wypowiadają sobie nawzajem wojny
"zwykłej" (niewymuszonej, priorytet 4 w `decideAIDiplomacy`) — jedyne wojny między głównymi
AI w tym oknie to wojny WYMUSZONE (era/forced war, mechanizm już istniejący, poza zakresem tej
zmiany). Ataki na miasta-państwa POZOSTAJĄ dozwolone bez zmian przez cały ten okres. Po
zakończeniu okna (tura > 25 LUB gdy wymuszona wojna epoki już wystąpiła danej cywilizacji,
cokolwiek pierwsze) AI wraca do dzisiejszego zachowania. Dodatkowo: AI ma priorytetowo dążyć
do jak najszybszego założenia maksymalnej możliwej liczby miast (osiągnięcia limitu miast per
epokę, patrz `R-MIASTA-LIMIT-PER-EPOKA-Q1`) — zweryfikuj czy to już się dzieje wystarczająco
agresywnie, wzmocnij tylko jeśli dowód pokaże realny deficyt.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (dosłowne, 2026-09-08, po obserwacji własnej rozgrywki): "Dziwna
  sprawa. Dwie cywilizacje bardzo szybko opanowały wszystkie sąsiednie, co jest dosyć
  ciekawe, ale z drugiej strony chyba nieoczekiwane. Była zasada, że po wypowiedzeniu wojny,
  po zdobyciu dwóch miast miałby nastąpić pokój, ale to w wyniku wojny epoki. A tu widać, że
  były wojny nieepokowe, tylko po prostu jedna cywilizacja atakowała wcześniej, niezależnie
  od wojny epoki, inną cywilizację. Dajmy może taką opcję, że przez pierwsze 25 tur, dopóki
  nie będzie wojny epoki, inne cywilizacje się nie atakują, zjadają tylko miasta państwa, a
  potem dążą jak najszybciej do maksymalnej budowy maksymalnej liczby miast, czyli założenia
  nowych miast, ile mogą w danym momencie założyć."
- Diagnoza właściciela jest TRAFNA i już zweryfikowana przez orkiestratora źródłowo: istnieje
  DOKŁADNIE JEDNA ścieżka "zwykłego" (niewymuszonego) wypowiedzenia wojny AI↔AI w
  `gra/src/game/ai.ts::decideAIDiplomacy` — "Priorytet 4: wypowiedz_wojne" (komentarz w kodzie:
  "Agresywna AI (agresja >= PROG_WOJNA_AGRESJA=0.5) przy wrogiej, słabej relacji i przewadze
  militarnej (rw >= PROG_WOJNA_SILA=0.6) wypowiada wojnę"), warunek mniej więcej: `!stanWojny
  && !peaceLocked && !hasNapTreaty && willingnessWar>0 && rw>=effProgWojnaSila &&
  effAgresja>=effProgWojnaAgresja && score<progMinimalnyRelacja`. TEN warunek NIE rozróżnia
  dziś czy `rel.partnerId` to inna główna cywilizacja czy miasto-państwo, ani nie sprawdza
  numeru tury — działa identycznie od tury 1. Reguła "pokój po zdobyciu 2 miast" (wspomniana
  przez właściciela) istnieje WYŁĄCZNIE w mechanizmach `forced-war-*.ts`
  (`shouldEndXForcedWarByCityCount`) — wojny z priorytetu 4 NIE MAJĄ tego bezpiecznika, więc
  mogą eskalować bez ograniczeń aż do całkowitego podboju sąsiada, dokładnie jak zaobserwował
  właściciel.
- Dane wejściowe dla `decideAIDiplomacy` (`RelacjaWejscie[]`) są budowane w `main.ts`, blok
  "AI↔AI relacje (C-AI-WOJNA: wypowiedzenie wojny między AI)" (świeżo znajdź dokładną linię,
  szukaj komentarza `// AI↔AI relacje` i pętli `for (const otherId of aiOwnerList)`) — TU jest
  jedyne miejsce, gdzie main.ts ma jednocześnie dostęp do `ownerId`, `otherId`, numeru `turn` i
  do predykatu `isCityStateOwner(otherId)` (funkcja już istnieje w main.ts, ~linia 6427) —
  naturalne miejsce do dodania nowego pola na `RelacjaWejscie` (np. `partnerIsCityState:
  boolean`, `currentTurn` już prawdopodobnie dostępne pośrednio przez `inp.currentTurn` w
  `DiplomacjaInputs` — zweryfikuj świeżo czy pole tury już tam jest, czy trzeba je dodać
  analogicznie).

ZADANIE:
1. Odtwórz problem z dowodem — headless symulacja: kilka głównych cywilizacji AI + kilka
   miast-państw, wiele tur od startu, mierz KIEDY i MIĘDZY KIM wybuchają wojny (rozróżniając
   źródło: wymuszona (bronze/stone/iron ForceWarTargetId ustawiony) vs zwykła (priorytet 4)).
   Potwierdź że dziś zwykłe wojny AI↔AI (nie miasto-państwo) mogą wybuchać od wczesnych tur,
   BEZ bezpiecznika "pokój po 2 miastach".
2. Dodaj do `RelacjaWejscie` (i odpowiadającego wejścia budowanego w `main.ts`) informację
   pozwalającą `decideAIDiplomacy` rozróżnić: (a) czy partner to inna główna cywilizacja czy
   miasto-państwo, (b) bieżącą turę (jeśli jeszcze nie ma). W "Priorytecie 4: wypowiedz_wojne"
   dodaj warunek: jeśli `turn <= 25` (nowa nazwana stała, np. `AI_MAJOR_EARLY_NO_WAR_TURNS =
   25` w `ai.ts`, obok istniejących `AI_MAJOR_EARLY_MAX_TURN*`) I partner to INNA GŁÓWNA
   CYWILIZACJA (nie miasto-państwo) — NIE wypowiadaj wojny tą ścieżką (pomiń komendę). Ataki
   na miasta-państwa (partner = miasto-państwo) POZOSTAJĄ bez zmian przez całe okno — zero
   nowego warunku dla tego przypadku. Ścieżki wymuszonej wojny (priorytety wyżej w funkcji,
   `clusterForceWarTargetId`/`bronzeForceWarTargetId`/`stoneForceWarTargetId`/
   `ironForceWarTargetId`) pozostają CAŁKOWICIE bez zmian — to jest wyraźnie POZA zakresem
   (właściciel explicite mówi "dopóki nie będzie wojny epoki", czyli wojna epoki ma działać
   normalnie, tylko zwykłe wojny mają być wstrzymane).
3. Sprawdź (bez zgadywania z góry) czy istniejąca logika ekspansji/zakładania miast przez
   główne AI (settler production, wybór celu osiedlenia, `R-MIASTA-LIMIT-PER-EPOKA-Q1`) już
   dziś priorytetyzuje szybkie osiągnięcie limitu miast per epokę wystarczająco agresywnie —
   żywa symulacja: ile tur zajmuje głównej AI osiągnięcie limitu miast danej epoki, czy
   produkcja osadników jest górnym priorytetem czy konkuruje nisko z innymi celami budowy. Jeśli
   dowód pokaże realny deficyt (AI nie dąży aktywnie do limitu mimo wolnych terenów/zasobów),
   zaproponuj i zaimplementuj wzmocnienie priorytetu produkcji osadników — jeśli dowód pokaże
   że już działa wystarczająco dobrze, NIE zmieniaj nic w tej części, udokumentuj to w
   raporcie zamiast wymuszać zmianę bez potrzeby.
4. Żywy dowód PRZED/PO: ta sama symulacja z punktu 1 — po naprawie, w oknie pierwszych 25 tur,
   ŻADNA para głównych cywilizacji nie wchodzi w stan wojny przez ścieżkę priorytetu 4 (wojny
   wymuszone/era, jeśli wystąpią naturalnie w tym oknie, są DOZWOLONE i nie są regresją),
   ataki na miasta-państwa nadal występują normalnie (brak regresji), a po turze 25 (lub po
   wystąpieniu wymuszonej wojny epoki danej cywilizacji) zwykłe wojny AI↔AI znów mogą się
   zdarzać jak dziś.

BINARNE KRYTERIUM SUKCESU: (1) 0 wojen AI↔AI (główna cywilizacja vs główna cywilizacja) przez
ścieżkę priorytetu 4 w oknie tur 1-25, potwierdzone PRZED/PO w żywej symulacji; (2) wojny
wymuszone (era) i ataki na miasta-państwa w tym samym oknie NIEZMIENIONE (brak regresji); (3)
po turze 25 zwykłe wojny AI↔AI wracają do dzisiejszego zachowania (brak trwałego wyłączenia).
`tsc --noEmit` czysty, 5 bramek referencyjnych zielone, istniejące testy dyplomacji AI (pliki
z "diplomacy"/"dyplomacja"/"wojna" w nazwie w `gra/tools/`) nadal zielone lub świadomie
rozszerzone o nowy scenariusz.

ALLOWLISTA:
- `gra/src/game/ai.ts` (WYŁĄCZNIE: nowa stała `AI_MAJOR_EARLY_NO_WAR_TURNS` lub podobna, nowe
  pole na `RelacjaWejscie`/`DiplomacjaInputs` jeśli potrzebne, warunek w "Priorytecie 4:
  wypowiedz_wojne" wewnątrz `decideAIDiplomacy` — NIE dotykaj ścieżek wymuszonej wojny/innych
  priorytetów bez wyraźnej potrzeby)
- `gra/src/main.ts` (WYŁĄCZNIE blok budowy `relacjeDip`/"AI↔AI relacje" — dodanie nowego pola
  z `isCityStateOwner(otherId)`/turą; WYŁĄCZNIE logika produkcji osadników/priorytetu
  ekspansji jeśli diagnoza z ZADANIA pkt 3 pokaże realny deficyt)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo rozszerzenie istniejącej)
- `dyspozycje/autobot/runs/P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1/*`
Zakaz `git add -A`. Zakaz zmiany mechanizmu wymuszonej wojny epoki (forced-war-*.ts) — to jest
osobny, działający mechanizm, który ma pozostać całkowicie nietknięty w tym temacie (uwaga:
temat równoległy `P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1` NAPRAWIA ten mechanizm z innego
powodu — jeśli oba tematy dotykają main.ts w tym samym obszarze budowy `triggeredSubjects`/
relacji, zgłoś to jawnie w raporcie, integracja będzie sekwencyjna).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji naprawy bez żywego dowodu pokazującego
ZAROWNO że zwykłe wojny AI↔AI faktycznie NIE wybuchają w oknie 25 tur PO naprawie, JAK i że
przed naprawą FAKTYCZNIE wybuchały (nie zakładaj regresji z samego czytania kodu). Zakaz
przypadkowego wyłączenia ataków na miasta-państwa przy okazji tej zmiany — to jest jawnie
wykluczone przez właściciela ("zjadają tylko miasta państwa" ma pozostać możliwe).

IZOLACJA: nowy worktree `/home/user/wt-ai-wojna-wczesna-faza`, gałąź
`autobot/P-AI-WOJNA-WCZESNA-FAZA-MIASTA-PANSTWA-Q1`, baza `origin/main` @ najświeższy commit
w chwili startu (sprawdź `git fetch origin main` przed założeniem worktree).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki AI/balansu, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
