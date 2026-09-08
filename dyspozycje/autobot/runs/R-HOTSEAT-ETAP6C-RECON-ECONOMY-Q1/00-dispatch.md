STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1
GOAL: Recon-only (ZERO zmian kodu) dla trzeciego pod-etapu Etapu 6 planu hot-seat
(`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §C, wiersz "6": "(c) ekonomia ~50"). Kategoria
z §A5/§B2: "Funkcja liczy/pisze skarbiec/Praca/Nauka/era/zbadane per WŁAŚCICIEL (nie
zawsze aktywny człowiek) → `isHuman(id)` ('obaj ludzie liczeni tej samej fazie EOT')" —
**UWAGA, INNY WZORZEC NIŻ (a)/(b): tu docelowy alias to `isHuman(id)`, NIE `isMe(id)`**,
bo ekonomia liczy WSZYSTKICH właścicieli-ludzi (dziś tylko jeden, docelowo dwóch fotelów
jednocześnie w tej samej fazie końca tury), w odróżnieniu od input/UI gdzie liczy się
wyłącznie AKTYWNY człowiek. Kryterium gotowości §C: "po każdym podetapie: typecheck +
bramki + 20 tur" (behawioralny no-op przy `humanOwnerIds=[0]`).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED DISPATCHEM RUND KOLEJNYCH:
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §A5 ("Ekonomia per-właściciel — JUŻ per-owner")
  — plan TWIERDZI że rdzeń (`advanceCityEconomy`, mapy `aiSkarbiecByOwner` itd.) już liczy
  wszystkich ownerów i rozdziela wynik po `tick.ownerId` — **zweryfikuj to twierdzenie
  świeżo, nie przyjmuj z automatu**: sprawdź czy naprawdę NIE MA żadnego `ownerId===0`
  wewnątrz samego rdzenia liczącego, czy tylko warstwa WYŻEJ (odczyt/HUD/decyzje) filtruje
  po `0`. To rozstrzyga czy podetap (c) jest głównie w `main.ts` (odczyt/decyzje) czy w
  plikach `game/turn-economy.ts`/`game/empire-food.ts`/`game/society-inputs.ts`/
  `game/cities.ts`/`game/difficulty-cost.ts` (rdzeń liczący) wymienionych w planie.
- `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §B2 (tabela decyzyjna, wiersz "ekonomia").
- **Ta sama uwaga co przy KAŻDYM poprzednim etapie: main.ts (i pliki game/*) zmieniają się
  codziennie, numery linii z planu z dużym prawdopodobieństwem martwe.** Etapy 0-5 i 6a/6b
  są zintegrowane lub w równoległym dispatchu — sprawdź `git log`/rejestr na start, żeby
  wiedzieć co dokładnie już istnieje w kodzie w momencie Twojej pracy (Etap 6a input może
  być już zintegrowany LUB wciąż w równoległym worktree — NIE zakładaj żadnego stanu bez
  `git merge-base --is-ancestor`, wzorem korekty z recon Etapu 6a §0).
- **Etap 3 (`R-HOTSEAT-ETAP-3-AKCESORY-EKONOMIA-Q1`, zintegrowany) JUŻ zmigrował 8 funkcji-
  akcesorów ekonomicznych** (main.ts, skarbiec/Praca/Nauka/era/zbadane technologie) na
  `isHuman(ownerId)` — NIE dubluj tej pracy. Sprawdź świeżym grepem/`git show` które
  dokładnie funkcje to były (rejestr, commit `302ea837`) i wyklucz je jawnie z inwentaryzacji
  tego recon, tak jak Etap 6a wykluczył zakres Etapu 4.
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6A-RECON-INPUT-Q1/01-operator-runda1-analiza.md`
  i `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6B-RECON-UI-Q1/01-operator-runda1-analiza.md`
  — wzorzec formatu (klastry z cytatem linii przed/po, rozliczenie liczby z planem,
  sprawdzenie nakładania z innymi etapami, plan dowodu no-op) — powtórz identyczną
  strukturę. Etap 6b recon jest szczególnie istotny jako PRZESTROGA: jego Evaluator znalazł
  ukryty TRZECI write-site cache (`runWorldEndTurn()`) pominięty przy pierwszym przebiegu —
  przy ekonomii, gdzie logika jest rozproszona między `main.ts` i 5 plików `game/*.ts`,
  ryzyko podobnego przeoczenia jest WYŻSZE, nie niższe — sprawdzaj każdy plik z listy §A5
  osobno, nie tylko `main.ts`.

ZADANIE TEJ RUNDY (WYŁĄCZNIE recon, zero kodu produkcyjnego):
1. **Zweryfikuj twierdzenie planu §A5** ("rdzeń już per-owner") świeżym `Read`/`grep` w
   `game/turn-economy.ts`, `game/empire-food.ts`, `game/society-inputs.ts`, `game/cities.ts`,
   `game/difficulty-cost.ts` — dla KAŻDEGO miejsca z listy planu (i każdego nowego,
   znalezionego świeżym grepem `ownerId\s*(===|!==)\s*0` w tych plikach) ustal: czy to
   naprawdę generyczna funkcja per-owner (nie wymaga migracji, tylko float call-site), czy
   zawiera własny literał `0` (kandydat `isHuman(id)`).
2. **Zainwentaryzuj WSZYSTKIE miejsca w `main.ts` dotyczące ekonomii per-właściciel**
   (skarbiec/Praca/Nauka/era/zbadane technologie/głód/deficyt złota/korupcja/utrzymanie) —
   POZA 8 już zmigrowanymi akcesorami Etapu 3 — z dzisiejszymi numerami linii.
3. **Potwierdź/skoryguj liczbę "~50"** z planu — policz realnie (wzorem 42/78 z Etapów
   6a/6b) — jeśli liczba się różni, wyjaśnij dlaczego, z rozbiciem main.ts vs game/*.ts.
4. **Dla każdego znalezionego miejsca zaproponuj konkretną podmianę** — `isHuman(id)` (NIE
   `isMe(id)` — patrz uzasadnienie w GOAL wyżej) dla miejsc liczących/piszących dane
   właściciela-człowieka niezależnie od tego, który fotel jest dziś aktywny; jeśli
   znajdziesz miejsce, które semantycznie powinno być `isMe` (np. decyzja/komunikat
   pokazywany TYLKO aktywnemu), oznacz to jawnie jako pozycję graniczną z (a)/(b), nie
   milcz o niejednoznaczności.
5. **Sprawdź nakładanie z Etapami 3/4/6a/6b** — czy którekolwiek miejsce jest już
   zmigrowane (Etap 3) albo leży w kodzie przepisanym przez Etap 4 (`endActiveHumanTurn`/
   `runWorldEndTurn`) lub dotknięte przez równoległy Etap 6a (input) — nie dublować pracy.
   Zwróć szczególną uwagę na ewentualny odpowiednik znaleziska Etapu 6b (write-site cache
   ukryty w `runWorldEndTurn()`) — economy tick jest fizycznie WEWNĄTRZ `runWorldEndTurn()`.
6. **Zaproponuj plan dowodu no-op** — behawioralny no-op przy `humanOwnerIds=[0]`, z
   konkretną, wykonywalną metodą. Ekonomia jest w dużej mierze CZYSTA logika (nie DOM-bound)
   — rozstrzygnij czy da się dowieść no-opa headless Node (jak `game/ai.ts`) zamiast
   Chromium, i dla której części dokładnie (main.ts vs game/*.ts).

BINARNE KRYTERIUM SUKCESU TEJ RUNDY: jawna weryfikacja twierdzenia planu §A5 (potwierdzona
lub obalona dowodem), kompletna świeżo zweryfikowana lista miejsc kategorii "ekonomia" z
dzisiejszymi numerami linii i konkretną podmianą (`isHuman`, nie `isMe`) per miejsce, jawne
rozliczenie z liczbą "~50", jawne sprawdzenie nakładania z Etapami 3/4/6a/6b, konkretny plan
dowodu no-op z rozstrzygnięciem headless vs Chromium.

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1/*` (WYŁĄCZNIE dokument recon —
  zero zmian w `gra/`)
Zakaz `git add -A`. Zakaz jakiegokolwiek kodu w `gra/src/**`/`gra/tools/**` w tej rundzie.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przyjęcia twierdzenia planu §A5 ("już per-owner") bez
świeżego dowodu kodowego dla KAŻDEGO z 5 plików `game/*.ts` z osobna. Zakaz przepisywania
starych numerów linii bez weryfikacji. Zakaz spłaszczenia listy do jednej niezróżnicowanej
tabeli — grupuj w klastry z uzasadnieniem, jak recon Etapów 6a/6b.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6c-recon`, gałąź
`autobot/R-HOTSEAT-ETAP6C-RECON-ECONOMY-Q1`, baza `origin/main` @ `9c7580f1`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit` (nie powinno być nawet potrzebne — zero
zmian kodu).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów (niezależnie od etykiety STATUS w nagłówku) — zawsze wymagana
runda Obrony przed kolejnym Evaluatorem (R-PROC-AUTOBOT.md §3c) — nie pomijaj tego kroku.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty, ta sama runda) → kolejny
Evaluator jeśli była Obrona (Ścieżka A, Workflow). Final Control NIE dispatchowany
(dokument, nie kod). Po zamknięciu: dispatch `R-HOTSEAT-ETAP6C-ECONOMY-Q1` (implementacja)
jako osobny temat, gdy zwolni się lania.
DEPLOY/PUSH: NIE WYKONANO
