STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1
GOAL: Implementacja WYŁĄCZNIE części (i) — "prosta migracja" — pod-etapu 6f planu
hot-seat, na podstawie zamkniętego recon
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-RECON-START-Q1/01-operator-runda1.md`
(zintegrowany, commit `8a541a57`). Ten temat NIE dotyka części (ii) — "nowa
funkcjonalność" (drugi heks startowy, drugi wybór cywilizacji w menu) — to zostaje
osobnym, przyszłym tematem projektowym po decyzji właściciela. Wzorzec migracji: "wyklucz
cywilizację OBU ludzi z puli AI" (nie tylko właściciela 0).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-RECON-START-Q1/01-operator-runda1.md`
  (dokument źródłowy, PO poprawkach Obrony — 3 pozycje część (i): `fillAiOwnerCivMap`,
  `repairAiRosterFromMap`, `restoreAiRosterFromSave`, wszystkie w main.ts).
- **main.ts zmienia się codziennie — świeżo zweryfikowane dzisiejsze linie (orkiestrator,
  tuż przed tym dispatchem)**:
  - `repairAiRosterFromMap(startEra)` — definicja `main.ts:2129`, call site `main.ts:36110`.
    Świeży `Read` NIE pokazał w niej bezpośredniego literału `ownerId===0`/`!==0` —
    zweryfikuj to ponownie sam; jeśli funkcja jest już strukturalnie generyczna (operuje
    na `missing`/`allAiOwnerIdsOnMap()`, nie na hardkodowanym 0), może nie wymagać zmiany
    kodu, tylko potwierdzenia że jest poprawna dla dwóch ludzi — udokumentuj wniosek.
  - `fillAiOwnerCivMap(playerCivId, rosterSeed)` — definicja `main.ts:7524`, call sites
    `main.ts:10568` i `main.ts:34075`. Buduje `aiOwnerIds` z `aiStartHexes.map(a =>
    a.ownerId)` — sprawdź czy `aiStartHexes` już z definicji wyklucza WSZYSTKICH ludzi,
    czy tylko właściciela 0 (to rozstrzyga czy potrzebna zmiana tutaj, czy w
    `game/cluster-start.ts`, poza allowlistą tego tematu — jeśli tak, jawnie odłóż z
    uzasadnieniem, nie zgaduj).
  - `restoreAiRosterFromSave(saved)` — definicja `main.ts:7546`, call site
    `main.ts:36094`. **Realny cel migracji znaleziony świeżo**: linia ok. `main.ts:7554`
    — `.filter(id => id !== 0)` przy budowaniu `ownerIds` z `saved.cities`/`saved.units`
    (ścieżka legacy-save bez zapisanego rosteru) — to jest DOKŁADNIE "wyklucz cywilizację
    (obu) ludzi z puli AI" — zmień na wykluczenie WSZYSTKICH `humanOwnerIds`, nie tylko
    `0` (np. `.filter(id => !humanSeats.humanOwnerIds.includes(id))` albo analogiczny
    alias, jeśli istnieje — sprawdź czy w main.ts jest już gotowa funkcja/alias do tego,
    zamiast pisać nową logikę). Funkcja JUŻ używa `isAiOwner(humanSeats, c.ownerId)` kilka
    linii niżej (Etap 1, zintegrowany) — reużyj ten sam wzorzec/import.
- **Uwaga o równoległych lanach**: w chwili tego dispatchu mogą równolegle trwać
  `R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1` (main.ts ok. 2400-2520 + 10380-10400) i
  `R-HOTSEAT-ETAP6C-ECONOMY-Q1` (main.ts ok. 22-32 miejsc rozproszonych + `runWorldEndTurn()`
  + `game/*.ts`). Twoje 3 funkcje (main.ts:2129, 7524, 7546) są w INNYCH liniach niż oba —
  zweryfikuj to świeżo (`git status`/`git diff` w tamtych worktree jeśli istnieją) przed
  edycją, żeby potwierdzić brak nakładania.

ZADANIE TEJ RUNDY:
1. Zweryfikuj świeżym `Read`/grep wszystkie 3 funkcje pod wskazanymi liniami — potwierdź
   dokładną treść i czy main.ts się przesunął od czasu tego dispatchu.
2. Dla `restoreAiRosterFromSave`: zmigruj `.filter(id => id !== 0)` na wykluczenie
   wszystkich `humanOwnerIds` (nie tylko `0`).
3. Dla `fillAiOwnerCivMap`/`repairAiRosterFromMap`: zweryfikuj czy wymagają zmiany kodu
   (patrz KONTEKST) — jeśli tak, zmigruj analogicznie; jeśli nie, udokumentuj dlaczego
   (np. "już generyczne, `aiStartHexes` z definicji nie zawiera ludzi") zamiast milczeć.
4. Napisz bramkę dowodu no-op: ten kod jest CZYSTĄ logiką (budowanie mapy AI-cywilizacji
   z listy ownerów) — headless Node (nie Chromium) powinien wystarczyć, wzorem
   `gra/tools/*-test.cjs` bez DOM. Scenariusz: symuluj `humanOwnerIds=[0,1]` (nawet jeśli
   dziś produkcyjnie zawsze `[0]`) i potwierdź że drugi human NIE trafia do
   `aiOwnerCivMap`/puli AI — to jest właściwy dowód że migracja działa, nie tylko że
   `humanOwnerIds=[0]` daje dziś ten sam wynik co wcześniej (co byłoby tautologią przy
   jednym-elementowej liście).

BINARNE KRYTERIUM SUKCESU: `restoreAiRosterFromSave` wyklucza WSZYSTKICH `humanOwnerIds`
(nie tylko `0`) z puli AI przy wczytaniu legacy-save, potwierdzone testem z symulowanym
`humanOwnerIds=[0,1]` (nie tylko `[0]`). Jawna decyzja/dokumentacja dla pozostałych 2
funkcji. `tsc --noEmit` czysty. 5 bramek referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` (WYŁĄCZNIE 3 funkcje: `repairAiRosterFromMap`, `fillAiOwnerCivMap`,
  `restoreAiRosterFromSave` — BEZ dotykania regionu bootstrapu renderu main.ts~2400-2520/
  10380-10400 ani ekonomii main.ts rozproszonej/`runWorldEndTurn()` — te są POZA
  zakresem, zajęte równolegle)
- `gra/tools/hotseat-etap6f-start-migracja-test.cjs` (NOWY plik, headless Node)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1/*`
Zakaz `git add -A`. Zakaz dotykania części (ii) — nowej funkcjonalności (drugi heks
startowy, drugi wybór cywilizacji) — poza zakresem tego tematu.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz testu no-op z jednoelementowym `humanOwnerIds=[0]`
jako jedynym dowodem (tautologiczne przy jednym człowieku) — MUSISZ przetestować z
symulowanym `humanOwnerIds=[0,1]` i pokazać że oba są wykluczone z puli AI.

IZOLACJA: worktree `/home/user/wt-hotseat-etap6f-start`, gałąź
`autobot/R-HOTSEAT-ETAP6F-START-MIGRACJA-Q1`, baza `origin/main` @ `f4f745f4`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Po PASS: integracja allowlist-only przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
