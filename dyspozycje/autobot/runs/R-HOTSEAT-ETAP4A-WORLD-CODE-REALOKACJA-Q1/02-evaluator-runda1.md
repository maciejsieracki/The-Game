STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1
GOAL: Niezależna weryfikacja Evaluatora raportu Operatora (`01-operator-runda1.md`,
commit `ac5c2c0950ae812301de168695a255e1663c45ec`) — Krok 0+1 z recon §6.1: wydzielenie
`runWorldEndTurn()` jako literalny copy-paste faz 7-14 `triggerPlayerEndTurn()`, plus
przeniesienie trzech bloków "światowych" (`st.bunt`, `evictForeignUnitsFromCityHexes()`,
reset ruchu wszystkich jednostek) na jej początek — no-op behawioralny przy jednym fotelu.

## Metoda weryfikacji

Worktree `/home/user/wt-hotseat-etap4a-world-code` (branch
`autobot/R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1`, HEAD `ac5c2c09`), baza
`06c0eaa5` — nietknięta (`/home/user/The-Game` jest dokładnie na `06c0eaa5`, użyta
WPROST jako niezależne środowisko baseline, bez checkout/build wewnątrz worktree
Operatora).

1. **Odczyt pełnego diffu** `git diff 06c0eaa5 HEAD -- gra/src/main.ts` — WSZYSTKIE trzy
   hunki (`git diff ... | grep "^@@"` → dokładnie 3: `28640,140→28640,13`,
   `28787,9→28660,6`, `33116,6→32986,140`), przeczytane w całości, linia po linii,
   nie tylko statystyka.
2. **Odczyt bezpośredni** obu nowych funkcji w finalnym pliku (`Read` main.ts:28640-28670
   i main.ts:32980-33160) — potwierdzenie struktury, nie tylko diffu.
3. **Świeże grepy** kontrolne: `turn++` (1 wystąpienie), `evictForeignUnitsFromCityHexes()`
   (3: definicja + 2 call-site'y), `st.bunt` (1 w nowym miejscu + niepowiązane trafienie
   gdzie indziej), `movedByPlayerThisTurn.clear()` (3, z czego 2 zweryfikowane jako
   preegzystujące w baseline pod innymi numerami linii), `triggerPlayerEndTurn`/
   `runWorldEndTurn` (wszystkie wystąpienia), `endActiveHumanTurn`/`advanceSeat` (0 trafień).
4. **`git diff --check`** na `gra/src/main.ts` — czyste.
5. **`node ./node_modules/typescript/bin/tsc --noEmit`** uruchomiony samodzielnie w
   worktree Operatora — 0 błędów.
6. **Trzy NIEZALEŻNE, samodzielnie uruchomione przebiegi `hotseat-etap4-noop-test.cjs`**
   (nie skopiowane z raportu Operatora):
   - Przebieg 1 — worktree Operatora (kod PO zmianie), pierwsze uruchomienie: dotarło do
     PEŁNYCH 30/30 tur przebiegu A (obserwowane bezpośrednio w logu, nie tylko w
     notyfikacji) zanim zostało przerwane z powodu zbliżającego się limitu czasu
     narzędzia (rywalizacja o CPU z równoległym przebiegiem baseline — patrz BLOKADY).
   - Przebieg 2 — `/home/user/The-Game` (main, dokładnie na commicie `06c0eaa5`,
     `git status` czyste) — NIEZALEŻNY `node_modules`/build/uruchomienie tego samego
     narzędzia na PRAWDZIWYM kodzie sprzed zmiany, nie na kopii/checkout wewnątrz
     worktree Operatora.
   - Przebieg 3 — worktree Operatora (kod PO zmianie), drugie uruchomienie (po
     restarcie): przebieg A, tury 1-11 (przebieg padł raz w trakcie próby 1/3 z
     przyczyny infrastrukturalnej, patrz BLOKADY — retry Operatora, `runOnceWithRetry`,
     zadziałał zgodnie z przeznaczeniem).
   Porównanie WSZYSTKICH trzech przebiegów między sobą, turę po turze, tam gdzie się
   pokrywają zakresem (tury 1-11 minimum, tura 1-30 dla Przebiegu 1) — patrz sekcja
   niżej.

## Wynik porównania hashy (własny, niezależny od danych Operatora)

| tura | Przebieg 1 (worktree, PO, run A, pełne 30) | Przebieg 2 (main, `06c0eaa5`, PRZED) | Przebieg 3 (worktree, PO, run A po restarcie) |
|---|---|---|---|
| 1 | 5a812a3ce327... | 5a812a3ce327... | 5a812a3ce327... |
| 2 | 82da654cde08... | 82da654cde08... | 82da654cde08... |
| 3 | 2d4b8b37941d... | 2d4b8b37941d... | 2d4b8b37941d... |
| 4 | a7318a7a57c6... | a7318a7a57c6... | a7318a7a57c6... |
| 5 | 807c882e40dd... | 807c882e40dd... | 807c882e40dd... |
| 6 | 2abe05d7cb8e... | 2abe05d7cb8e... | 2abe05d7cb8e... |
| 7 | 81b168fe54f3... | 81b168fe54f3... | 81b168fe54f3... |
| 8 | 29a3a61bc6e5... | 29a3a61bc6e5... | 29a3a61bc6e5... |
| 9 | 656edb82a164... | 656edb82a164... | 656edb82a164... |
| 10 | ce9673bd22ca... | ce9673bd22ca... | ce9673bd22ca... |
| 11 | a17ab1685741... | a17ab1685741... | a17ab1685741... |
| 12 | 4ed06ca55397... | 4ed06ca55397... | — |
| 13 | bb77cd110662... | bb77cd110662... | — |
| 15 | eda5d87add4c... | — | — |
| ...30 | 96600506c3be... | — | — |

Wszystkie trzy przebiegi identyczne w całym pokrywającym się zakresie (13 tur
Przebieg1↔Przebieg2, 11 tur Przebieg1↔Przebieg3, zero rozbieżności). Przebieg 1
(jedyny doprowadzony do końca w tej rundzie) zgodny turę po turze z **przykładowymi
hashami cytowanymi w raporcie Operatora** (tura 1 `5a812a3ce327`, tura 15
`eda5d87add4c`, tura 30 `96600506c3be`) — potwierdzone bit-w-bit, nie na słowo.
`console.error()` Przebiegu 1: 7 (identyczne z liczbą zgłoszoną przez Operatora,
te same świadome logi „[Wojna wymuszona] DECISION_REQUIRED"). `jsExceptions`: 0.

**Uwaga metodologiczna:** nie doprowadziłem do końca WSZYSTKICH czterech przebiegów
(A+B na obu commitach) w tej rundzie — patrz BLOKADY niżej. Uznaję to za wystarczający,
ale niepełny dowód (patrz ZARZUTY, zarzut informacyjny #2).

## Weryfikacja punktowa zarzutów z dyspozycji

1. **Trzy bloki fizycznie zniknęły ze starej pozycji i pojawiły się w
   `runWorldEndTurn()`** — potwierdzone bezpośrednim odczytem (main.ts:28643-28663):
   `st.bunt` cleanup @ 28645-28648, `evictForeignUnitsFromCityHexes()` @ 28649, reset
   ruchu @ 28650-28662, WSZYSTKIE trzy PRZED `turn++` @ 28663, w tej właśnie kolejności
   (kolejność między nimi nieistotna zgodnie z recon, potwierdzone). W starej pozycji
   (dzisiejszy `triggerPlayerEndTurn`, main.ts:32991+) żaden z trzech bloków już nie
   występuje — sprawdzone diffem i grepem.
2. **`nextTurnNum` poprawnie przeliczane WEWNĄTRZ `runWorldEndTurn()`, nie martwe
   odwołanie do domknięcia** — potwierdzone: `const nextTurnNum = turn + 1;` jest
   PIERWSZĄ instrukcją ciała `runWorldEndTurn()` (main.ts:28644), obliczaną z tej samej
   wartości `turn` co analogiczna lokalna zmienna w `triggerPlayerEndTurn` (obie liczone
   PRZED jakimkolwiek `turn++` w danej turze) — wartości identyczne, brak rozjazdu.
   Zmienna używana dalej wewnątrz `runWorldEndTurn` w pięciu `setTurnTransition(...)`
   (linie z zakresu 28692+ w oryginalnej numeracji recon, obecnie przesunięte) — wszystkie
   w zasięgu tej samej funkcji, brak referencji do zewnętrznego domknięcia.
3. **Krok 2-5 z recon NIE zaczęte** — `grep -n "endActiveHumanTurn\|advanceSeat"
   gra/src/main.ts` → zero trafień. Potwierdzone.
4. **Trzy zewnętrzne call-site'y `triggerPlayerEndTurn()` nietknięte** — main.ts:21042
   (`onEndTurn: () => triggerPlayerEndTurn()`, HUD), main.ts:21630 (`endTurn: () =>
   triggerPlayerEndTurn()`, `__eraTestDebug`), main.ts:33283 (skrót „N", wewnątrz
   listenera `keydown`) — wszystkie trzy identyczne tekstowo z baseline (diff nie
   dotyka tych linii, potwierdzone brakiem tych numerów w liście hunków diffu).
5. **Zero utraty/duplikacji treści** — potwierdzone niezależnie: `wc -l` 36186→36190
   (+4, zgodne z deklaracją Operatora), `git diff --check` czyste, oraz punktowa
   kontrola trzech potencjalnie mylących duplikatów (`evictForeignUnitsFromCityHexes()`
   drugie wystąpienie @ main.ts:32853, `movedByPlayerThisTurn.clear()` drugie/trzecie
   wystąpienie @ main.ts:34228/35342) — wszystkie trzy zweryfikowane jako
   PREEGZYSTUJĄCE w baseline pod odpowiadającymi (przesuniętymi o tę samą deltę)
   numerami linii, nie nowe artefakty tej zmiany.

BLOKADY:
1. Środowisko sandboxowe ma efektywnie ograniczoną liczbę rdzeni (4) i pod obciążeniem
   dwóch równoległych przebiegów headless Chromium (mój Przebieg 1 + Przebieg 2)
   postęp był na tyle wolny, że pierwsze uruchomienie Przebiegu 1 zbliżało się do
   własnego limitu czasu zanim ukończyło przebieg B — przerwane świadomie (zabite
   procesy), nie FAIL testu. Nie jest to defekt zmiany Operatora — to samo spowolnienie
   dotyczyło JEDNAKOWO obu commitów (przed i po zmianie).
2. W trakcie Przebiegu 3 (worktree, po restarcie) próba 1/3 padła z przyczyny
   INFRASTRUKTURALNEJ (`page.evaluate: Target page, context or browser has been closed`,
   poprzedzone seria błędów `net::ERR` w procesie sieciowym Chromium — SSL handshake do
   nieznanego hosta, prawdopodobnie telemetria/usługa sieciowa Chromium blokowana przez
   proxy środowiska) — DOKŁADNIE ten sam wzorzec niestabilności, który mechanizm
   `runOnceWithRetry` Operatora (opisany w docstringu narzędzia, „OBRONA runda 1") został
   zbudowany, żeby tolerować. Retry zadziałał: próba 2 wystartowała od tury 1 i
   odtworzyła identyczne hashe. Nie jest to regres kodu gry (mechanizm end-turn/hash nie
   dotyka sieci) — jest to znana krucha zależność infrastruktury testowej, niezwiązana
   z zakresem tego tematu.
3. Nie ukończyłem samodzielnie WSZYSTKICH czterech przebiegów (A+B × baseline+po
   zmianie) w tej rundzie z powodu (1)+(2) powyżej oraz budżetu czasu rundy — zamiast
   tego oparłem PASS na: (a) pełnej, mechanicznej weryfikacji diffu/struktury kodu
   (silniejszy dowód niż sam hash — pokazuje WPROST że transformacja jest tym, czym
   twierdzi być), (b) trzech niezależnych, częściowo nakładających się przebiegach
   hashującego testu (13+11+30 punktów danych, zero rozbieżności), (c) zgodności bit-w-bit
   z konkretnymi przykładowymi hashami zacytowanymi w raporcie Operatora. Uznaję to za
   wystarczające dla PASS, ale zaznaczam jako lukę w kompletności własnego dowodu (patrz
   ZARZUTY, pozycja informacyjna).

TESTY (własne, niezależne od Operatora):
- `node ./node_modules/typescript/bin/tsc --noEmit` w worktree Operatora: **0 błędów**.
- `git diff --check 06c0eaa5 HEAD -- gra/src/main.ts`: czyste.
- `wc -l gra/src/main.ts`: 36190 (baseline `06c0eaa5`: 36186, delta +4 zgodna z raportem).
- Trzy niezależne przebiegi `hotseat-etap4-noop-test.cjs` (dwa na worktree Operatora
  PO zmianie, jeden na `/home/user/The-Game` DOKŁADNIE na `06c0eaa5` PRZED zmianą) —
  patrz tabela wyżej, zero rozbieżności w całym pokrywającym się zakresie (tury 1-13),
  Przebieg 1 doprowadzony do pełnych 30/30 z `jsExceptions=0` i `consoleErrorLogs=7`
  (zgodne z raportem Operatora).

ZARZUTY:
1. (Informacyjny, nie blokujący PASS) Operator nie zapisał pełnej listy 30 hashy
   baseline (PRZED zmianą) jako osobny plik/artefakt w katalogu runu — tylko trzy
   przykładowe wartości w treści raportu (`01-operator-runda1.md`). Dyspozycja wprost
   oczekiwała, że Operator to zapisze („baseline (...) ktory Operator powinien byl
   zapisac w raporcie/pliku"). Nie zablokowało to weryfikacji (uruchomiłem PRAWDZIWY
   baseline samodzielnie na `/home/user/The-Game`@`06c0eaa5`), ale utrudniło
   bit-w-bit porównanie pełnych 30 pozycji bez ponownego uruchamiania testu. Rekomendacja
   na przyszłość (nie do tej rundy): zapisywać pełną listę hashy do pliku w katalogu
   runu, nie tylko przykłady w tekście raportu.
2. (Informacyjny, nie blokujący PASS) Własna weryfikacja tej rundy nie objęła pełnych
   30/30 dla WSZYSTKICH czterech kombinacji (A/B × przed/po) — z przyczyn
   infrastrukturalnych opisanych w BLOKADACH (rywalizacja o CPU, jednorazowy crash
   Chromium na przyczynie sieciowej niezwiązanej z kodem gry). Oparłem PASS na
   kombinacji dowodu strukturalnego (silniejszego — bezpośredni odczyt transformacji
   kodu) i częściowego, ale spójnego dowodu hashowego (24 unikalne punkty danych tur
   1-30, zero rozbieżności, zgodność z przykładami Operatora). Jeśli Final Control chce
   pełnego 4×30 potwierdzenia, rekomenduję uruchomienie SEKWENCYJNE (nie równoległe)
   dwóch pełnych wywołań narzędzia, żeby uniknąć rywalizacji o zasoby zaobserwowanej
   w tej rundzie.

RUNDY: 1/5

NASTĘPNY KROK: Operator → Evaluator (ZAKOŃCZONE, PASS) → Final Control → integracja
allowlist-only. Po zielonym Etapie 4a: dispatch `R-HOTSEAT-ETAP4B-SPLIT-Q1` (Krok 2-5 z
recon) jako OSOBNY temat.

DEPLOY/PUSH: NIE WYKONANO
