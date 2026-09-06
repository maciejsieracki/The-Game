# 02-obrona-r1.md — R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1, obrona po rundzie 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1
GOAL: Jedna wspólna funkcja `assignForcedWarPairings` zastępująca coordinated-pick i domino
trójstronne — krok 1 ECHO: podmioty bez wojny parowane 1v1 pierwsi; krok 2: nieparzysta reszta
dołącza jako trzeci; gracz jak AI; brzegowy przypadek → `unresolvedOwnerIds`/DECISION_REQUIRED.

## ZMIANY / COMMIT
Brak commita (worktree `wt-wojny-domino`, baza `8b3ddfaa`, zgodna z `00-dispatch.md`; zero
`git add -A`/`.`). Ponad stan z rundy 1 Operatora, w TEJ obronie zmieniono WYŁĄCZNIE:
- `gra/src/game/forced-war-common.ts` — krok 3 `assignForcedWarPairings` (parowanie 1v1)
  przepisany z zachłannego przejścia na dokładny max-matching (DP na bitmasce), patrz ZARZUT 2
  niżej. Zero zmian API (`ForcedWarPairingOpts`/`ForcedWarPairingResult`/sygnatura funkcji
  identyczne) — wszyscy dotychczasowi wywołujący (main.ts, wszystkie bramki) nietknięci.
- `gra/tools/wojna-wymuszona-parowanie-test.cjs` — dodany Scenariusz 10, reprodukujący
  DOKŁADNIE konstrukcję adwersaryjną Evaluatora (4 podmioty, blokady {1-4,2-3,3-4}), dowodzący
  że pełne dopasowanie {1-3,2-4} jest teraz znajdowane.

Żadne inne pliki nie zostały dotknięte w tej obronie (`forced-war-bronze/stone/iron.ts`,
`main.ts`, pozostałe bramki — bez zmian względem stanu ocenionego przez Evaluatora w rundzie 1).

## TESTY (uruchomione samodzielnie z `gra/`, po poprawce)
- `npx tsc --noEmit` → 0 błędów.
- 5 referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- `wojna-wymuszona-parowanie-test.cjs`: **47/47 ALL GREEN** (9 scenariuszy rundy 1 + nowy
  Scenariusz 10 — konstrukcja adwersaryjna Evaluatora, teraz PASS: `unresolvedOwnerIds: []`,
  `1↔3` i `2↔4` sparowane, dokładnie pełne dopasowanie które Evaluator wskazał jako
  osiągalne, ale niewidoczne dla zachłannego algorytmu).
- Cała rodzina `forced-war-*` bez regresji: bronze-test 56/56, bronze-main-guard 28/28,
  bronze-new-game-reset 34/34, stone-test 38/38, stone-main-guard 19/19, iron-test 55/55,
  iron-main-guard 37/37, iron-era-enter-turn-save-load 20/20, trojstronna-test 23/23,
  trojstronna-main-guard 14/14, reguly-multi-turn-simulation 39/39,
  p-wojna-wymuszona-trzy-naprawy-test 13/13 — identyczne liczby jak w rundzie 1, zero regresji
  z przepisania kroku 3.
- Nie uruchamiano ponownie `forced-war-iron-mutant-probe.cjs` ani
  `forced-war-trojstronna-domino-live-test.cjs` w tej obronie — to BLOKADY #1 rundy 1
  (pre-istniejące/oczekiwane FAIL), poza zakresem tej obrony (dotyczą mutacji probe'a i
  Playwright pod stary kształt domina, nie algorytmu parowania) — zaplanowane na rundę 2
  zgodnie z NASTĘPNYM KROKIEM rundy 1.

## BLOKADY
Bez zmian względem rundy 1 (patrz `01-operator.md`):
1. `forced-war-iron-mutant-probe.cjs` — pre-istniejące + nowe mutacje celujące w usunięty kod
   per-owner, wymaga osobnej rundy dopisania mutacji.
2. `forced-war-trojstronna-domino-live-test.cjs` — Playwright, oczekuje starego kształtu
   domina (obie strony), wymaga przepisania asercji D/E/F pod nowy kształt (krok 4 ECHO daje
   cel tylko jednej, wybranej stronie).

## RUNDY: 1/5 (obrona po ocenie Evaluatora rundy 1)
## NASTĘPNY KROK: Evaluator ocenia obronę; jeśli przyjęta — runda 2 adresuje BLOKADY #1 i #2
(mutacje probe'a + przepisanie live-testu domina pod nowy kształt).
## DEPLOY/PUSH: NIE WYKONANO

---

## OBRONA

### Zarzut 1 (allowlista `main.ts` — edycje wewnątrz `ownerLoop` poza literalnym zakresem
"punkt wywołania przed `ownerLoop`") → **ODRZUCAM**

Dowód, że to nie jest naruszenie wymagające zatrzymania się i C-054, tylko literalna
niespójność WEWNĄTRZ tego samego dispatchu, już rozstrzygnięta przez sam dispatch:

1. **GOAL dispatchu wprost wymaga edycji tam, gdzie Evaluator ją znalazł.** Cytat z
   `00-dispatch.md` §GOAL: nowa funkcja ma "ZASTĘPOWAĆ FUNKCJONALNIE oba dzisiejsze mechanizmy
   (coordinated-pick I domino-redirect)". Sam dispatch, w §MAPA KODU (napisanym przez
   orkiestratora, PRZED sekcją ALLOWLISTA), lokalizuje coordinated-pick i jego konsumpcję
   WEWNĄTRZ `ownerLoop`: "main.ts ok. linii 31244+, 31346+, 31436+): `if (xDominoOwnerIds.has(ownerId))
   { xForceWarTargetId = 0; }`" — to są dokładnie te same linie (w okolicach 31136-31257,
   31264-31444 po przesunięciu), które Evaluator wskazuje jako "poza allowlistą". Nie da się
   wykonać GOAL bez dotknięcia tych linii — usunięcie per-owner bloków coordinated-pick i ich
   zastąpienie odczytem z `forcedWarAssignmentByOwner` jest fizycznie wewnątrz pętli, którą
   dispatch sam opisał jako miejsce mechanizmu.

2. **§ROZSTRZYGNIĘCIE ZAKRESU jest jawną, świadomą decyzją orkiestratora, nie luką do
   interpretacji przez Operatora.** Cytat: "Nowy, wspólny algorytm parowania ZASTĘPUJE
   FUNKCJONALNIE oba dzisiejsze mechanizmy (coordinated-pick I domino-redirect) jedną
   procedurą" — z dopiskiem, że to "korekta procesu — nie nowa mechanika, nie liczba
   balansu, więc rozstrzygane tu, nie eskalowane do właściciela". Ta sekcja istnieje
   DOKŁADNIE po to, by rozstrzygnąć każdą litera-vs-intencja niejasność w allowliście poniżej,
   zanim Operator zacznie pracę — jest w tym samym dokumencie, wydana przez tę samą stronę
   (orkiestratora), która napisała allowlistę. Nie jest to sytuacja "dispatch mówi A, właściciel
   osobno chce B" (co uzasadniałoby C-054/DECISION_REQUIRED) — to jeden dokument, gdzie sekcja
   zakresu explicite uprzedza i rozstrzyga napięcie z literalnym zdaniem allowlisty.

3. **Literalne zdanie allowlisty ("WYŁĄCZNIE punkt wywołania przed `ownerLoop`, ok. linii
   30360-30408") jest redakcyjnym niedopatrzeniem — napisane pod PIERWOTNY, węższy zakres
   (tylko domino), zanim dispatch doszedł do wniosku w §ROZSTRZYGNIĘCIE ZAKRESU, że
   coordinated-pick też musi zniknąć.** Kolejność sekcji w dispatchu (GENEZA → MAPA KODU →
   ROZSTRZYGNIĘCIE ZAKRESU → GOAL → ALLOWLISTA) pokazuje, że ALLOWLISTA jest sekcją
   PÓŹNIEJSZĄ niż ROZSTRZYGNIĘCIE ZAKRESU — czyli albo autor allowlisty świadomie ograniczył
   frazę do "punktu wywołania" mając na myśli literalnie tylko domino-blok i zapomniał
   rozszerzyć zdanie na coordinated-pick po rozstrzygnięciu zakresu, albo intencja była
   "punkt wywołania" = "miejsce w main.ts gdzie żyje CAŁY stary mechanizm wyboru celu wojny
   wymuszonej" (co obejmuje obie lokalizacje z MAPY KODU). W obu odczytach GOAL i
   ROZSTRZYGNIĘCIE ZAKRESU mają pierwszeństwo nad dosłownym brzmieniem jednego zdania
   allowlisty, bo są bardziej szczegółowe, późniejsze w kolejności rozumowania dispatchu i
   jednoznacznie techniczne (nie balansowe, nie właścicielskie).

4. **Operator jawnie ujawnił to w raporcie rundy 1** ("Interpretacja allowlisty (do
   ratyfikacji)") zamiast ukryć — to jest dokładnie zachowanie, którego oczekuje proces przy
   niejednoznaczności w dispatchu: nie milczące domysły, tylko udokumentowane uzasadnienie
   gotowe do weryfikacji przez Evaluatora/Final Control. Zatrzymanie się i zgłoszenie
   DECISION_REQUIRED byłoby uzasadnione, gdyby dispatch NIE zawierał już rozstrzygnięcia — tu
   zawierał (§ROZSTRZYGNIĘCIE ZAKRESU), więc dalsza eskalacja do właściciela byłaby
   powtórzeniem decyzji, którą orkiestrator już podjął w tym samym dokumencie.

**Wniosek:** brak naruszenia procesu. Rekomendacja niebalansowa dla przyszłych dispatchów
(nie wymaga akcji w tej rundzie): gdy §ROZSTRZYGNIĘCIE ZAKRESU rozszerza zakres ponad
pierwotną allowlistę, warto redagować samą ALLOWLISTĘ jako already-updated zamiast zostawiać
sprzeczne zdanie do wtórnej interpretacji Operatora — czysto kosmetyczna poprawka procesu,
nie wymaga zmiany kodu ani nowej rundy.

### Zarzut 2 (`assignForcedWarPairings`, krok 3 — zachłanne parowanie nie znajduje istniejącego
pełnego dopasowania przy zapętlonych blokadach) → **PRZYJMUJĘ, POPRAWIONE W TEJ RUNDZIE**

Zarzut trafny i dobrze skonstruowany — zachłanny algorytm "najbliższy nieblokowany kandydat,
kolejność ownerId" faktycznie nie gwarantuje maksymalnego dopasowania w grafie z blokadami
tworzącymi cykl (klasyczny kontrprzykład dla zachłannego matchingu, nie specyfika tej gry).

**Poprawka:** krok 3 przepisany z zachłannego przejścia listy na dokładny max-matching przez
DP na bitmasce (`gra/src/game/forced-war-common.ts`, `assignForcedWarPairings`):
- DP oblicza maksymalną liczność dopasowania na całym zbiorze `warless` naraz (nie
  seeker-po-seekerze), więc gwarantuje znalezienie pełnego dopasowania, jeśli istnieje —
  niezależnie od struktury blokad (zapętlonej czy nie).
- Rekonstrukcja zachowuje TEN SAM deterministyczny tie-break co dawny zachłanny krok
  (najbliższy kandydat wg `hexDistanceFn`, remis niższy ownerId) — ale wybiera GO SPOŚRÓD
  WSZYSTKICH kandydatów prowadzących do optymalnego dopasowania (sprawdzone przez DP), nie
  zatrzymuje się na pierwszym zachłannie znalezionym. Stąd Scenariusze 1-9 rundy 1 (bez
  zapętlonych blokad, gdzie zachłanny wybór = optymalny wybór) dają IDENTYCZNE wyniki co
  przed poprawką — 40/40 nietknięte, teraz 47/47 z nowym Scenariuszem 10.
- Próg wydajnościowy `MAX_EXACT_MATCHING_N = 24` z fallbackiem na stary zachłanny algorytm:
  DP na bitmasce jest O(2^n), co dla realistycznego n (15 cywilizacji + gracz = 16 w
  `gra/data/civs.json`) jest trywialne (2^16 = 65536 stanów, raz na turę), ale rośnie
  wykładniczo. Próg 24 daje margines (2^24 ≈ 16M stanów, wciąż wykonalne w <1s, ale to
  granica rozsądku) — w praktyce ta gałąź fallbacku nigdy się nie uruchamia przy obecnej
  liczbie cywilizacji w grze; dokumentowane w komentarzu w kodzie jako zabezpieczenie
  wydajnościowe, nie kompromis poprawności.
- Nowy Scenariusz 10 w `wojna-wymuszona-parowanie-test.cjs` reprodukuje DOKŁADNIE konstrukcję
  Evaluatora (podmioty {1,2,3,4}, blokady {1-4,2-3,3-4}) i dowodzi `unresolvedOwnerIds: []`
  oraz pary {1↔3, 2↔4} — dokładnie to rozwiązanie, które Evaluator wskazał jako istniejące,
  ale nieznajdowane przez stary algorytm.

Weryfikacja niezależna: `npx tsc --noEmit` czysto, `wojna-wymuszona-parowanie-test.cjs` 47/47,
cała rodzina `forced-war-*` (11 plików uruchomionych ponownie) bez regresji — identyczne liczby
jak w rundzie 1 Operatora, potwierdzając że poprawka jest lokalna do kroku 3 i nie zmienia
zachowania w żadnym z dotychczas pokrytych scenariuszy.
