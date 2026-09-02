TEMAT:  R-AI-KONCENTRACJA-ARMII-WIELE-KLASTROW-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: temat LOGIKI/STRATEGII AI (nie wizualny) —
Operator Sonnet 5 effort=high / Evaluator Sonnet 5 effort=high / Final
Control Sonnet 5 effort=high. Effort podniesiony do High na obu rolach
(zamiast domyślnego Medium dla Operatora) — zmiana dotyka rdzenia decyzji
bojowych AI (`ai.ts`), wysokie ryzyko subtelnej regresji balansu.

## WYZWALACZ
Właściciel, zrzut mapy (Elefantyna/Lothal/Harappa/Sais, kilka rozproszonych
grup 1-3 jednostek AI): "AI nadal unika generowania dużych armii złożonych
z większej liczby jednostek na rzecz rozproszonych wielu armii. Powinien,
w miarę możliwości, starać się skupiać całą armię w jednym miejscu, a nie
rozdrabniać. Dodatkowo wszystko zależy od tego, z ilu stron jest atakowany.
Jeśli jest atakowany z dwóch stron, musi podzielić armię na dwie części —
jedna idzie w jedną, druga w drugą — ale powinien starać się połączyć
wszystkie mniejsze armie w jedną dużą, aby się bronić i atakować."

## RECON (wykonany, nie powtarzaj)
Mechanizm koncentracji armii JUŻ ISTNIEJE: `game/army-concentration.ts`
(`planArmyConcentration`, `ARMY_CONCENTRATION_MIN_UNITS=3`,
`ARMY_CONCENTRATION_RADIUS=4`), wołany z `ai.ts:2597-2601`, WYŁĄCZNIE dla
`isMajorAiOwner(opts)` (pełne cywilizacje AI, nie miasta-państwa/kopie
obronne/barbarzyńcy — `ai.ts:1150-1152`).

**Dokładny mechanizm i jego ograniczenie (przyczyna zgłoszenia):**
`planArmyConcentration` wybiera TYLKO JEDEN, NAJLEPSZY lokalny klaster
(kandydat = heks jednej jednostki, klaster = wszystkie jednostki własne w
promieniu 4 od kandydata, warunek ≥3 jednostek), maksymalizując liczbę
jednostek w klastrze, potem minimalizując sumę odległości. Jednostki
NALEŻĄCE do zwycięskiego klastra, które nie stoją jeszcze na wspólnym
heksie, dostają rozkaz marszu do punktu zbiórki (`concentration.rallyPoint`)
i są wyłączone (`concentrationDeferred`) z normalnej logiki tury (atak/marsz
własny) na tę turę.

**Luka:** to jest WYŁĄCZNIE "zbieranie tego, co już jest blisko siebie" (≤4
heksy) — NIE łączy odrębnych, oddalonych od siebie klastrów. Jeśli AI ma
np. trzy grupy po 2 jednostki, każda dalej niż promień 4 od pozostałych,
ŻADNA nie osiąga progu 3 jednostek w swoim promieniu, `planArmyConcentration`
zwraca `null` dla całej sytuacji, i WSZYSTKIE jednostki wracają do zwykłej
logiki per-jednostka (marsz/atak indywidualny) — stąd trwałe rozdrobnienie
widoczne na zrzucie właściciela. Funkcja też wybiera TYLKO jeden klaster na
turę — przy wielu rozdrobnionych grupach nie próbuje w ogóle połączyć
pozostałych w tej samej turze.

**Obrona domu już wyłączona z koncentracji poprawnie:** `homeDefenderAssignments`
(jednostki przydzielone do obrony miasta pod bezpośrednim zagrożeniem) są
przekazywane jako `excludedUnitIds` do `planArmyConcentration` — NIE są
wciągane do zbiórki. To już częściowo realizuje wymóg właściciela "obrona
ma priorytet", ale WYŁĄCZNIE dla obrony miast, nie dla ogólnego pojęcia
"wielu frontów ataku" (np. dwie oddzielne wrogie armie w polu, żadna nie
zagraża bezpośrednio miastu wg `isHomeDefenseThreatForCity`, obie wymagają
osobnej odpowiedzi) — to NIE jest dziś rozpoznawane jako powód do
utrzymania dwóch osobnych grup.

Istniejący test referencyjny do rozbudowy: `gra/tools/
army-concentration-test.cjs` (testuje dzisiejszy pojedynczy-klaster
mechanizm) i `gra/tools/army-merge-separate-return-mainguard-test.cjs`.

## GOAL
Rozszerz mechanizm koncentracji armii AI (`isMajorAiOwner`, poza
barbarzyńcami/miastami-państwami — zakres BEZ ZMIAN) o dwa elementy, w
KOLEJNOŚCI priorytetu:
1. **Rozpoznawanie liczby aktywnych frontów zagrożenia**: policz DZIŚ
   ISTNIEJĄCYMI danymi (widoczne wrogie jednostki/armie w polu,
   analogicznie do `engageableEnemyUnits`/`homeThreats` już używanych w
   `ai.ts`) ile ODRĘBNYCH, wystarczająco odległych od siebie skupisk
   zagrożenia istnieje wokół własnego terytorium/armii — to jest docelowa
   LICZBA klastrów własnych jednostek, nie zawsze 1. Gdy zagrożenie jest
   jednym frontem (albo brak realnego zagrożenia w polu) — dąż do JEDNEJ
   dużej armii.
2. **Łączenie ODDALONYCH klastrów w kierunku siebie**, gdy docelowa liczba
   klastrów (z punktu 1) jest MNIEJSZA niż liczba dzisiejszych faktycznych
   skupisk jednostek AI — wybierz sensowny sposób grupowania (np. każdy
   mniejszy klaster maszeruje w stronę najbliższego większego/preferowanego
   klastra lub wspólnego punktu środkowego) i rusz tam jednostki NIE
   zaangażowane już w bezpośrednią walkę/obronę domu (nie przerywaj ataku
   w toku ani obrony realnie atakowanego miasta).
Zero zmian w zachowaniu dla barbarzyńców/miast-państw/`defensiveCopy` (poza
zakresem `isMajorAiOwner`). Zero zmian w istniejącej logice obrony domu
(`homeDefenderAssignments`/`isHomeDefenseThreatForCity`) — punkt 1 ma być
DODATKOWĄ warstwą ponad nią, nie zamiennikiem.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Nowy/rozszerzony test symulacyjny w `gra/tools/` (na bazie
   `army-concentration-test.cjs`): scenariusz z 3 małymi, ODDALONYMI (>4
   heksy między sobą) grupami jednostek AI, BRAK zagrożenia w polu (0 lub 1
   front) — PO kilku turach symulacji jednostki realnie zbliżają się do
   siebie / łączą w jedną większą grupę (zmierzone: rosnąca maks. liczba
   jednostek AI na wspólnym heksie/w promieniu koncentracji między turą 1 a
   turą N), bez regresji dzisiejszego zachowania przy pojedynczym klastrze.
2. Analogiczny scenariusz z DWOMA wyraźnie odrębnymi frontami zagrożenia
   (wrogie jednostki w dwóch, odległych od siebie miejscach wokół
   terytorium AI) — AI utrzymuje/tworzy DWIE osobne grupy odpowiadające na
   oba fronty, NIE łączy ich sztucznie w jedną (weryfikacja że punkt 1
   GOAL realnie ogranicza łączenie z punktu 2 GOAL).
3. Żywy dowód braku regresji: obrona miasta pod bezpośrednim atakiem
   (`homeDefenderAssignments`) działa identycznie jak dziś — obrońca NIE
   zostaje odciągnięty do zbiórki kosztem obrony.
4. Diff ograniczony do plików w ALLOWLIŚCIE. Zakres zmiany proporcjonalny
   do GOAL — nie przepisuj całego `ai.ts`.
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych (w tym
   `combat-test`) bez regresu + `army-concentration-test.cjs` +
   `army-merge-separate-return-mainguard-test.cjs` bez regresu (dopuszczalna
   udokumentowana aktualizacja asercji, jeśli wprost testują dzisiejsze,
   świadomie zmieniane ograniczenie jednego-klastra) + nowy test z punktu 1-2.

## ALLOWLISTA — nic poza tym
`gra/src/game/army-concentration.ts`, `gra/src/game/ai.ts` (WYŁĄCZNIE
funkcje/wywołania bezpośrednio zaangażowane w koncentrację armii i
rozpoznawanie frontów — nie dotykaj niezwiązanej logiki AI), nowy/
rozszerzony plik testowy w `gra/tools/`. Zakazane bezwzględnie: `gra/data/**`,
`docs/decyzje/<ID>.md`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-AI-KONCENTRACJA-ARMII-WIELE-KLASTROW-Q1`,
baza JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`,
`gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1/2 za spełnione na podstawie samego czytania kodu
— uruchom REALNĄ symulację tur (silnik AI, nie ręczne wyliczenia) i
zmierz faktyczne pozycje jednostek. Zakaz "naprawy" przez zwykłe
zwiększenie `ARMY_CONCENTRATION_RADIUS`/usunięcie limitu jednego klastra
bez zaadresowania punktu 1 GOAL (rozpoznawanie frontów) — to złamałoby
wymóg właściciela o dzieleniu się przy wielu frontach. Zakaz zgadywania
jak policzyć "front zagrożenia" — użyj/rozbuduj istniejące struktury danych
o wrogich jednostkach w polu, udokumentuj dokładną definicję odrębności
frontu (np. próg odległości) w raporcie z uzasadnieniem liczbowym.

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
