STATUS: DISPATCH
DOMAIN: GAME
TEMAT: P-AI-EKSPANSJA-ODBUDOWA-MIAST-PO-WOJNIE-Q1
GOAL: Zdiagnozuj i napraw brak proaktywnej odbudowy liczby miast przez AI po stratach
wojennych. Zgłoszenie właściciela: szybkie osiągnięcie maksymalnej liczby miast powinno
być jednym z głównych priorytetów każdej cywilizacji — zwłaszcza gdy AI straci miasta w
wyniku wojny, powinno zakładać kolejne, jeśli ma taką możliwość, żeby uzupełnić pulę. Dziś
tego nie widać.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- Zgłoszenie właściciela (dosłowne): "Jednym z głównych elementów każdej cywilizacji powinno
  być szybkie osiągnięcie maksymalnej liczby miast. To widzę, że się nie dzieje, zwłaszcza
  gdy stracą jakieś miasta w wyniku wojny, powinni budować kolejne miasta, jeżeli mają taką
  możliwość, żeby uzupełnić pulę."
- Świeżo zweryfikowany przez orkiestratora mechanizm zakładania miast przez AI:
  `gra/src/game/ai.ts::planCityFounding()` (ok. linia 2648-2716) — AI zakłada miasta przez
  panel budowy (`foundCityAt`, BEZ jednostki osadnika), max 1 miasto/turę/cywilizację,
  bramkowane przez (sprawdź świeżo KAŻDĄ z tych bramek, mogły się przesunąć):
  1. `opts.defensiveCopy` → zero foundingu (świadome, dla kopii obronnych — NIE dotyczy tego
     tematu).
  2. `isLocalExpansionPhase(opts, myCities, map, units, playerId, cities)` → jeśli true,
     ZERO foundingu w tej turze (znajdź definicję tej funkcji, sprawdź warunki wejścia/wyjścia
     z tej fazy — czy uwzględniają niedawną utratę miast, czy tylko fazę wczesnej gry).
  3. `clusterConsolidationPhase` (`opts.clusterStateTargets.length > 0`) → blokuje founding,
     chyba że `aiMayBypassClusterConsolidation(ekspansywnosc, opts)` lub tryb agresywnej
     kolonizacji z aktywnym deadline'em wojny o klaster. Sprawdź czy ta faza może
     "utknąć" na cywilizacji, która właśnie straciła miasta w wojnie, blokując jej powrót
     do zdrowej liczby miast.
  4. `evaluateFoundCityAffordance()` (`gra/src/game/city-founding.ts:84-127`) — wymaga Pracy
     w skarbcu (`foundCityWorkCost()`) ORAZ miasta-źródła z minimalną populacją
     (`AI_FOUNDING_SOURCE_MIN_POP`) — sprawdź świeżo te progi i czy cywilizacja po
     stratach wojennych (mniej miast, mniejsza populacja per miasto) realnie je spełnia.
  5. `findCityFoundingHex()` — wymaga `withinTerritory` względem WŁASNYCH istniejących miast
     (`P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI`, 2026-08-09) — jeśli cywilizacja straciła
     wszystkie miasta blisko wolnego terytorium (np. zepchnięta do rogu mapy), może NIE MIEĆ
     żadnego kwalifikującego się heksu mimo posiadania środków — to może być realna,
     nienaprawialna bez zmiany reguły przyczyna w niektórych scenariuszach (odróżnij od
     bugu).
- ŻADNA z powyższych bramek NIE WYGLĄDA na uwzględniającą KONTEKST "właśnie straciłem miasta
  w wojnie, powinienem przyspieszyć odbudowę" — cadence jest dziś taka sama niezależnie od
  tego, czy cywilizacja jest na historycznym szczycie liczby miast, czy właśnie spadła z 8 do
  3. To może być DOKŁADNIE luka, o której mówi właściciel — potwierdź lub obal to świeżym
  pomiarem, nie zgadnij.

ZADANIE:
1. Odtwórz problem z dowodem — headless symulacja: cywilizacja AI z kilkoma miastami,
   wymuszona utrata 2-3 miast w wojnie (np. bezpośrednia manipulacja stanu testowego albo
   symulowana wojna), obserwacja per-turę czy `planCityFounding` zwraca komendę founding w
   kolejnych turach PO stracie, mimo posiadanych środków (Praca, populacja miasta-źródła,
   wolne kwalifikujące się terytorium). Zmierz: ile tur mija od utraty miasta do pierwszej
   próby odbudowy (jeśli w ogóle).
2. Ustal DOKŁADNĄ przyczynę braku odbudowy z dowodem (która bramka blokuje, w jakich
   warunkach) — może być więcej niż jedna równoległa przyczyna.
3. Zaimplementuj mechanizm PRZYSPIESZONEJ odbudowy: gdy liczba miast cywilizacji jest PONIŻEJ
   jej niedawnego szczytu (np. spadek w ostatnich N turach, licz konkretnie — zdecyduj
   rozsądny, testowalny próg i udokumentuj go w raporcie) ORAZ cywilizacja ma środki
   (Praca+populacja+kwalifikujący się heks), founding powinien mieć WYŻSZY priorytet — np.
   pomijać/łagodzić `clusterConsolidationPhase`/`isLocalExpansionPhase` w tym konkretnym
   stanie (analogicznie do istniejącego `aiMayBypassClusterConsolidation`/agresywnej
   kolonizacji — możliwe że da się to podłączyć do już istniejącego mechanizmu bypass zamiast
   pisać nowy od zera, sprawdź świeżo). NIE zmieniaj limitu "max 1 miasto/turę" (to osobna,
   udokumentowana decyzja C-AI-EKSP-Q1, poza zakresem tego tematu).
4. Parytet gracz↔AI (bariera krytyczna, `R-PROC-AUTOBOT.md` §9 poz. 11): to jest reguła
   dotycząca decyzyjności AI (gracz sam decyduje kiedy zakłada miasta) — upewnij się że
   naprawa nie zmienia niczego w ścieżce gracza.
5. Żywy dowód PRZED/PO: ta sama symulacja z punktu 1 — PO naprawie cywilizacja powinna
   wyraźnie szybciej odbudować utracone miasta (mniej tur do pierwszej próby founding po
   stracie), przy zachowaniu istniejącego zachowania gdy cywilizacja NIE straciła miast
   (brak regresji na normalnej ekspansji).

BINARNE KRYTERIUM SUKCESU: jawny, udowodniony werdykt przyczyny (z dowodem — pomiar/trace,
nie deklaracja). AI po utracie miast w wojnie wyraźnie przyspiesza zakładanie nowych, mierzone
i porównane PRZED/PO w tej samej symulacji. `tsc --noEmit` czysty, 5 bramek referencyjnych
zielone, istniejące testy foundingu (jeśli istnieją, np. plik z "founding"/"ekspansja" w
nazwie w `gra/tools/`) nadal zielone lub świadomie rozszerzone.

ALLOWLISTA:
- `gra/src/game/ai.ts` (WYŁĄCZNIE `planCityFounding`, `isLocalExpansionPhase`,
  `aiMayBypassClusterConsolidation`, `aiColonizationAggressiveMode` i bezpośrednio powiązane
  stałe/wywołania — nie przepisuj całej logiki ekspansji)
- `gra/src/game/city-founding.ts` (WYŁĄCZNIE jeśli diagnoza wskaże że przyczyna leży w
  `evaluateFoundCityAffordance`/progach tam zdefiniowanych — nie zgaduj z góry)
- `gra/tools/*-test.cjs` (nowa bramka dowodu albo rozszerzenie istniejącej)
- `dyspozycje/autobot/runs/P-AI-EKSPANSJA-ODBUDOWA-MIAST-PO-WOJNIE-Q1/*`
Zakaz `git add -A`. Zakaz zmiany limitu "max 1 miasto/turę" (C-AI-EKSP-Q1) i zakaz zmiany
`withinTerritory`/zasady odległości (`P-AI-ZAKLADANIE-MIAST-BEZ-ZASADY-ODLEGLOSCI`,
2026-08-09) — to są osobne, udokumentowane decyzje, poza zakresem tego tematu.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji przyczyny bez dowodu z rzeczywistej
symulacji/trace'u. Zakaz deklaracji "naprawiono" bez dowodu PRZED/PO pokazującego realnie
szybszą odbudowę. Jeśli zmierzysz że przyczyna to (5) brak kwalifikującego się terytorium
w danym scenariuszu (nie bug, realne ograniczenie geograficzne) — zgłoś to wprost jako
osobny, nienaprawialny w tym temacie przypadek, nie udawaj że naprawiłeś coś czego nie dało
się naprawić.

IZOLACJA: worktree `/home/user/wt-ai-ekspansja-odbudowa`, gałąź
`autobot/P-AI-EKSPANSJA-ODBUDOWA-MIAST-PO-WOJNIE-Q1`, baza `origin/main` @ `d602c99f`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow) — zmiana logiki gry, wymaga Final Control.
DEPLOY/PUSH: NIE WYKONANO
