TEMAT:  R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat LOGIKI AI/EKONOMII (nie wizualny) — Operator
Sonnet 5 effort=high / Evaluator Sonnet 5 effort=high / Final Control
Sonnet 5 effort=high. Effort podniesiony — temat jest DIAGNOZĄ w pierwszej
kolejności (nie zakładaj z góry że coś jest zepsute), dotyka rdzenia
budżetowania Pracy AI, ma udokumentowaną historię poważnego bugu o
identycznym objawie.

## WYZWALACZ
Właściciel, zrzut mapy (kilka miast egipskich, mało widocznych ulepszeń
terenu): "Cywilizacje budują bardzo mało ulepszeń. Nie wiem, z czego to
wynika, czy z naszych ostatnich zmian, bo kiedyś po prostu zalewali
wszystko ulepszeniami. Być może więcej środków przekierowują na budynki.
Zresztą inne cywilizacje też powinny obowiązywać zasadę maksymalnie 50%
na ulepszenia, reszta na budynki. Temat do sprawdzenia."

## RECON (wykonany, nie powtarzaj — NIE jest ostatecznym rozpoznaniem,
## Operator MUSI potwierdzić żywą, wieloturową symulacją)

**Reguła "max 50% na ulepszenia" JUŻ ISTNIEJE jako domyślna:**
`MAX_PROCENT_PULI_IMPERIUM = 100 - MIN_PODZIAL_PRACY_BUDYNKI_PERCENT`
(`game/cities.ts:428`, gdzie `MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = 50` —
`cities.ts:418`) = **50**. Używana w `game/ai.ts:1997,2130` jako FALLBACK:
`improvementBudget = Number.isFinite(opts.improvementBudgetCap) ?
opts.improvementBudgetCap : Math.floor(pracaAvailable *
MAX_PROCENT_PULI_IMPERIUM / 100)`. Czyli: gdy `improvementBudgetCap` NIE
jest jawnie przekazane, AI już dziś ma limit dokładnie 50% — pytanie brzmi,
czy `improvementBudgetCap` (przekazywane z `main.ts::aiImprovementBudgetByOwner`)
jest w praktyce ustawiane na coś dużo NIŻSZEGO niż 50%, co dawałoby dokładnie
zgłoszony objaw.

**Udokumentowany w kodzie, HISTORYCZNY bug o IDENTYCZNYM objawie
("AI buduje bardzo mało/zero ulepszeń"):** `main.ts` ok. linii 25575-25581,
komentarz przy serializacji `aiSurplusRedirectedOwners`:
> "[...] w ktorym ZASADA 3 przekierowala Prace na budynki. Stan [...] byl
> trwaly, a znacznik sterujacy POWROTEM — nie. Zapis w turze z nadwyzka
> gubil go, wiec galaz `else if (redirected)` nie wykonywala sie juz nigdy
> i AI zostawalo na `procentBudynki = MAX` (`procentPuliImperiumZBudynkow(100)
> = 0` -> zero Pracy do puli imperium -> **zero ulepszen terenu**) NA STALE."

Ten KONKRETNY bug (utrata flagi `aiSurplusRedirectedOwners` przy zapisie/
wczytaniu) jest oznaczony jako NAPRAWIONY (pole dodane do serializacji).
Mechanizm, który go powodował — "ZASADA 3" (`R-AI-WYRAB-PRZY-RZECE-FARMY-Q1`,
runda 4) — nadal ISTNIEJE i aktywnie przekierowuje Pracę AI z ulepszeń na
budynki, gdy `pickAutoImprovements` zgłosi "nadwyżkę" budżetu ulepszeń
(`aiSurplusReportByOwner`, odczytywane przez `applyAiImprovementSurplusRedirect`
zaraz po `decideAITurn`). "Nadwyżka" to sytuacja, w której AI ma budżet na
ulepszenia, ale NIE ZNAJDUJE wystarczająco dużo sensownych miejsc do ich
postawienia (patrz `freshSurplusReport`/`AutoImprovementSurplusReport` w
`game/auto-improvements.ts`) — w takim wypadku ZASADA 3 podnosi
`procentBudynki` (czyli obniża udział Pracy idący na ulepszenia) dla TEGO
WŁAŚCICIELA, dopóki nadwyżka trwa.

**Hipoteza do zweryfikowania żywo (NIE zakładać z góry, czy prawdziwa):**
czy mechanizm wykrywania "nadwyżki" (`pickAutoImprovements`) po niedawnych
zmianach w tej sesji (np. `R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1`,
w toku równolegle, dotyka tego samego obszaru terenu/ulepszeń — SPRAWDŹ czy
to jeszcze nie jest zintegrowane i nie koliduje) albo we wcześniejszych
rundach zaczął ZBYT ŁATWO/ZBYT CZĘSTO zgłaszać nadwyżkę (np. przez zbyt
surowe kryterium "sensownego miejsca"), co uruchamiałoby ZASADĘ 3 częściej
niż powinno i utrzymywało AI trwale przy niskim udziale Pracy na ulepszenia
— DUŻO subtelniejszy wariant tego samego pierwotnego problemu, tym razem
NIE przez utratę flagi przy zapisie, tylko przez zbyt agresywne WYKRYWANIE
nadwyżki w pierwszej kolejności.

## GOAL
Krok 1 (diagnoza, obowiązkowa PRZED jakąkolwiek zmianą kodu): uruchom żywą,
WIELOTUROWĄ symulację (dziesiątki tur, kilka głównych cywilizacji AI, różne
epoki) i zmierz FAKTYCZNY udział Pracy AI idący na ulepszenia terenu w
czasie — czy jest trwale bliski 0%, czy oscyluje wokół oczekiwanych ≤50%,
czy inny wzorzec. Ustal, czy zgłoszony objaw w ogóle się potwierdza na
aktualnym kodzie (main, PRZED zmianami z tej sesji dot. obozu łowieckiego
czy innych równoległych tematów — użyj bazy tego dispatchu, `origin/main`
w chwili dispatchu). Jeśli objaw się NIE potwierdza (AI buduje ulepszenia w
rozsądnym tempie) — zgłoś to jawnie z dowodem (liczby z symulacji), NIE
wymyślaj poprawki dla niepotwierdzonego problemu, i przejdź do Kroku 3.

Krok 2 (WARUNKOWY, tylko jeśli Krok 1 potwierdzi realny problem): znajdź
DOKŁADNĄ przyczynę (czy to ZASADA 3 nadmiernie/trwale przekierowuje Pracę,
czy `aiSurplusRedirectedOwners`/powrót po ustaniu nadwyżki nadal ma lukę
mimo naprawionej serializacji, czy coś innego) i napraw w najwęższym
możliwym miejscu — NIE wyłączaj ZASADY 3 całkowicie (ma uzasadniony cel:
nie marnować Pracy, gdy naprawdę nie ma gdzie budować), tylko zapewnij że
faktycznie WRACA do normalnego podziału, gdy nadwyżka ustaje, i że nie
zaniża budżetu ulepszeń poniżej sensownego minimum na trwałe.

Krok 3: zaimplementuj explicite żądanie właściciela — upewnij się, że
`MAX_PROCENT_PULI_IMPERIUM` (istniejący limit 50%) jest FAKTYCZNIE
respektowany jako TWARDY sufit dla WSZYSTKICH głównych cywilizacji AI
(nie tylko domyślny fallback, gdy `improvementBudgetCap` nie jest
przekazane) — czyli `aiImprovementBudgetByOwner`/ZASADA 3 NIGDY nie
powinny obniżać efektywnego udziału ulepszeń PONIŻEJ tego co wynikałoby z
50% ORAZ, jeśli Krok 1/2 wykaże że ZASADA 3 może zepchnąć AI do np. 0-10%
na wiele tur, dodaj sensowną DOLNĄ granicę (np. minimalny % Pracy zawsze
dostępny na ulepszenia, nawet w trybie "nadwyżka przekierowana") — Twoja
decyzja projektowa co do dokładnej wartości dolnej granicy, uzasadniona w
raporcie, jeśli nie wynika wprost z istniejących stałych.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Żywy dowód symulacyjny (nowy/rozszerzony test w `gra/tools/`, wiele tur,
   kilku właścicieli AI): zmierzony FAKTYCZNY procent Pracy AI idący na
   ulepszenia terenu w czasie — z liczbami, nie ogólnikiem.
2. Jeśli Krok 1 potwierdził problem: żywy dowód PO poprawce — AI wraca do
   budowania ulepszeń w rozsądnym tempie (nie utyka trwale na ~0%).
3. Żywy dowód: żaden główny właściciel AI nie przekracza 50% udziału Pracy
   na ulepszenia terenu w dłuższym oknie symulacji (respektowanie
   `MAX_PROCENT_PULI_IMPERIUM`).
4. Żywy dowód braku regresu: pierwotny cel ZASADY 3 (nie marnować Pracy,
   gdy naprawdę nie ma gdzie budować ulepszeń — np. terytorium w pełni
   zabudowane) nadal działa — AI z faktycznie zerową liczbą sensownych
   miejsc na ulepszenia nadal przekierowuje nadwyżkę na budynki, nie
   marnuje jej.
5. Diff ograniczony do plików w ALLOWLIŚCIE, zakres zmiany proporcjonalny
   do faktycznie potwierdzonej przyczyny (nie przepisuj całego mechanizmu
   "na wszelki wypadek", zwłaszcza jeśli Krok 1 nie potwierdzi problemu).
6. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu
   + istniejące testy budżetu Pracy/auto-ulepszeń AI w `gra/tools/`
   (znajdź po nazwie, np. `*praca-split*`, `*auto-improvement*`,
   `*surplus*`) bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/game/ai.ts` (WYŁĄCZNIE funkcje budżetu ulepszeń/ZASADY 3 —
`pickAutoImprovements` i bezpośrednio powiązane), `gra/src/main.ts`
(WYŁĄCZNIE `aiImprovementBudgetByOwner`, `applyAiImprovementSurplusRedirect`,
`aiSurplusRedirectedOwners` i bezpośrednio powiązana logika — zero zmian w
niepowiązanej ekonomii/AI), `gra/src/game/auto-improvements.ts` (WYŁĄCZNIE
jeśli przyczyna leży w wykrywaniu nadwyżki, `AutoImprovementSurplusReport`/
`freshSurplusReport` i bezpośrednio powiązane), `gra/src/game/cities.ts`
(WYŁĄCZNIE jeśli Krok 3 wymaga nowej stałej dolnej granicy — nie zmieniaj
`MAX_PROCENT_PULI_IMPERIUM`/`MIN_PODZIAL_PRACY_BUDYNKI_PERCENT` bez
jawnego uzasadnienia, właściciel prosił o "max 50%", nie o zmianę tej
wartości), nowy/rozszerzony plik testowy w `gra/tools/`. Zakazane
bezwzględnie: `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-AI-ULEPSZENIA-MALO-BUDOWANE-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz "naprawiania" niepotwierdzonego problemu — jeśli żywa symulacja
Kroku 1 nie potwierdza, że AI buduje anomalnie mało ulepszeń, powiedz to
wprost i NIE zmieniaj kodu "na wszelki wypadek" poza Krokiem 3 (twardy
sufit 50%, który właściciel wyraźnie zażądał niezależnie od diagnozy).
Zakaz wyłączenia ZASADY 3 jako "najprostszej naprawy" — ma realny,
udokumentowany cel; usunięcie jej całkowicie to inna, nieautoryzowana
zmiana produktowa. Zakaz zgadywania wartości dolnej granicy w Kroku 3 bez
uzasadnienia — jeśli nie wynika z istniejących stałych, uzasadnij liczbowo
lub zgłoś DECISION_REQUIRED.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`).
Zakaz `git add -A`.

## OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high,
zarzuty, lista może być pusta) → Operator (Obrona, Sonnet 5, tylko gdy
zarzuty niepuste) → Final Control (Sonnet 5, osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
