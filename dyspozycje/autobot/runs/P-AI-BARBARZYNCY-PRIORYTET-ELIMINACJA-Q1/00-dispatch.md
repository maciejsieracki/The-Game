STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-AI-BARBARZYNCY-PRIORYTET-ELIMINACJA-Q1
GOAL: Zdiagnozuj i napraw przypadek, w którym cywilizacja AI (Rzym, zrzut właściciela)
ignoruje obecność barbarzyńców na/przy własnym terytorium i zamiast likwidacji zagrożenia
kupi wojska w innym miejscu państwa, mimo istniejącej, udokumentowanej decyzji właściciela
że obrona/likwidacja barbarzyńców ma NAJWYŻSZY priorytet nad innymi wojnami/celami.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (dosłowne, ze zrzutem mapy — cywilizacja Rzym, miasta
  Ostia/Sutrium/Pompeje/Kapua/Norba/Tarent): "Jakiś czas temu ustaliliśmy, że większym
  zagrożeniem dla danej cywilizacji AI jest barbarzyńca i powinna w pierwszej kolejności
  skupić się na likwidacji barbarzyńców, a dopiero w drugiej kolejności zajmować się innymi
  wojnami. W przykładowym zdjęciu cywilizacja Rzymu, zamiast wziąć i zrobić porządek z
  barbarzyńcami, skupia wojska w nieznanym miejscu, w innej części państwa, i w ogóle nie
  atakuje barbarzyńców. To powinien być pierwszy cel – likwidacja barbarzyńców."
- Istniejąca, UDOKUMENTOWANA decyzja właściciela, dokładnie na ten temat: rejestr
  `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, wpis `P-AI-NIE-BRONI-WLASNYCH-MIAST-PRZED-
  BARBARZYNCAMI — ECHO A (2026-08-09)`: "Obrona własnego terytorium (w tym barbarzyńcy) ma
  najwyższy priorytet nad atakiem obcego celu, niezależnie od stanu pokoju/wojny z innymi."
- Świeżo zweryfikowana przez orkiestratora implementacja tej decyzji: `gra/src/game/ai.ts`
  ok. linia 2777-2846, funkcje `isHomeDefenseThreatForCity()` i `assignHomeDefenders()`.
  **KLUCZOWA WŁAŚCIWOŚĆ do zweryfikowania świeżo**: ten mechanizm jest dziś REAKTYWNY i
  LOKALNY — wykrywa zagrożenie TYLKO jeśli wróg (w tym barbarzyńca) jest w promieniu
  `cityTerritoryRadius(miasto) + 2×AI_HOME_DEFENSE_VICINITY_HEX` od KTÓREGOŚ własnego miasta.
  Jeśli obóz/jednostka barbarzyńska siedzi na terytorium AI, ale POZA tym promieniem (np.
  głęboko w lesie/górach między miastami, nie bezpośrednio przy żadnym z nich) — ten mechanizm
  wcale go nie widzi jako zagrożenia. To może być DOKŁADNIE ta luka, którą pokazuje zrzut
  właściciela (potwierdź lub obal to świeżym pomiarem, nie zgadnij).
- Sprawdź też PORZĄDEK WYWOŁAŃ w głównej pętli AI (`decideAITurn` i wołający ją kod w
  `main.ts` per-owner) — czy `assignHomeDefenders`/przydział obrońców jest wołany PRZED
  przydziałem jednostek do innych celów ofensywnych (marsz na wojnę z inną cywilizacją), czy
  PO — jeśli po, jednostki mogły już dostać inny rozkaz i przydział obrońcy nigdy ich nie
  dosięga (nadpisanie/konflikt rozkazów, nie tylko brak wykrycia zagrożenia).
- Rozróżnij dwa różne mechanizmy, nie myl ich: (a) REAKCJA na zagrożenie blisko miasta
  (istniejąca, `isHomeDefenseThreatForCity`) vs (b) PROAKTYWNE poszukiwanie i niszczenie
  ZNANYCH obozów barbarzyńskich na własnym terytorium, nawet gdy nie zagrażają jeszcze
  bezpośrednio żadnemu miastu — właściciel może chcieć (b), nie tylko (a). Jeśli (b) w ogóle
  nie istnieje w kodzie — to jest osobna, większa luka niż sam prefiltr odległości.

ZADANIE:
1. Odtwórz problem z dowodem — headless symulacja lub żywa gra z trace'em stanu AI: ustaw
   scenariusz zbliżony do zrzutu (cywilizacja AI z obozem/jednostką barbarzyńską na swoim
   terytorium + aktywną inną wojną/celem ofensywnym gdzie indziej), prześledź per-turę czy
   `isHomeDefenseThreatForCity` zwraca true/false dla tego zagrożenia i czy `assignHomeDefenders`
   faktycznie przydziela obrońcę, i czy ten przydział przeżywa do finalnych rozkazów jednostek
   (nie jest nadpisany przez inną ścieżkę decyzyjną).
2. Ustal DOKŁADNĄ przyczynę (z dowodem, nie domysłem): (a) barbarzyńca poza promieniem
   wykrywania, (b) przydział obrońcy wykryty ale nadpisany/zignorowany dalej w pipeline,
   (c) brak jakiegokolwiek mechanizmu proaktywnego niszczenia obozów poza promieniem miast,
   (d) inna przyczyna.
3. Napraw źródło problemu z dowodem PRZED/PO (ta sama symulacja, PRZED i PO naprawie —
   jednostki AI faktycznie ruszają na zlikwidowanie barbarzyńskiego zagrożenia zamiast
   ignorować je). Jeśli naprawa wymaga rozszerzenia zakresu wykrywania (promień) lub dodania
   proaktywnego wyszukiwania obozów — zrób to najmniejszym możliwym, testowalnym krokiem,
   zgodnym z duchem istniejącej, udokumentowanej decyzji (barbarzyńcy = priorytet nad inną
   wojną), nie wymyślaj nowej polityki wykraczającej poza to zdanie właściciela.
4. Parytet gracz↔AI (bariera krytyczna, `R-PROC-AUTOBOT.md` §9 poz. 11): to jest reguła
   DOTYCZĄCA WYŁĄCZNIE AI (gracz sam decyduje czym się zajmuje) — nie dotyczy tu bariery
   parytetu, ale i tak sprawdź czy naprawa nie psuje istniejącego zachowania gracza
   (nie powinna go w ogóle dotykać).

BINARNE KRYTERIUM SUKCESU: jawny, udowodniony werdykt przyczyny (a/b/c/d z dowodem —
pomiar/trace, nie deklaracja), naprawa zaimplementowana i udowodniona PRZED/PO w tej samej
symulacji. `tsc --noEmit` czysty, 5 bramek referencyjnych zielone, istniejące testy dla
home-defense (jeśli istnieją, np. plik z "home-defense"/"barbarz" w nazwie w `gra/tools/`)
nadal zielone lub świadomie rozszerzone.

ALLOWLISTA:
- `gra/src/game/ai.ts` (WYŁĄCZNIE `isHomeDefenseThreatForCity`, `assignHomeDefenders`,
  bezpośrednio powiązane stałe/wywołania w pętli decyzyjnej AI — nie przepisuj całej logiki
  wojny/celów ofensywnych)
- `gra/src/main.ts` (WYŁĄCZNIE miejsce wołające `assignHomeDefenders`/kolejność przydziału
  rozkazów per-owner, jeśli diagnoza wskaże że to jest przyczyna — nie zgaduj z góry)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo rozszerzenie istniejącej, jeśli jest)
- `dyspozycje/autobot/runs/P-AI-BARBARZYNCY-PRIORYTET-ELIMINACJA-Q1/*`
Zakaz `git add -A`. Zakaz zmiany innych mechanizmów AI (dyplomacja, ekonomia, suwaki) —
temat jest wąsko o priorytecie barbarzyńcy nad inną wojną.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej
symulacji/trace'u (nie samo czytanie kodu i domysł). Zakaz deklaracji "naprawiono" bez
dowodu PRZED/PO że jednostki AI faktycznie zmieniają zachowanie (nie tylko że funkcja
zwraca inną wartość w izolacji). Jeśli okaże się że przyczyna to (c) brak mechanizmu
proaktywnego — nie buduj całej nowej architektury bez zatrzymania się i przedstawienia
ABC właścicielowi, jeśli skala zmiany wykracza poza allowlistę wyżej.

IZOLACJA: worktree `/home/user/wt-ai-barbarzyncy-priorytet`, gałąź
`autobot/P-AI-BARBARZYNCY-PRIORYTET-ELIMINACJA-Q1`, baza `origin/main` @ `0297dd28`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium (jeśli potrzebna): `node ./node_modules/vite/bin/vite.js build --outDir
<poza repo> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
