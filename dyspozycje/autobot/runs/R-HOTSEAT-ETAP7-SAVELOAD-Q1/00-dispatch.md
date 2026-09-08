STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP7-SAVELOAD-Q1
GOAL: Implementacja Etapu 7 planu hot-seat (save/load v3) na podstawie zamkniętego
recon `dyspozycje/autobot/runs/R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1/01-operator-runda1.md`
(zintegrowany, commit `b29c6972`). **Zgodnie z ABC-4** (decyzja właściciela,
`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`, cytat na początku pliku): format zapisu
dostaje wersję **v3**, **BEZ funkcji migrującej v2→v3** — stare zapisy PRZESTAJĄ
DZIAŁAĆ, ale gra ma **jasno komunikować** użytkownikowi że zapis jest w starym
formacie, zamiast wywalać się po cichu albo wczytywać śmieci.

**Dlaczego ten temat jest dispatchowany NIEZALEŻNIE od podetapów 6c-6f**: recon 7
projektuje format v3 na bazie struktur JUŻ zintegrowanych w Etapach 0/2/3/5
(`human-owners.ts`, `exploredByHuman`, `playerStateByHuman`, `humanSeats`) — NIE zależy
od literalnych migracji `isMe`/`isHuman` w main.ts, które robią podetapy 6b-6f (te
dotyczą POPRAWNOŚCI ZACHOWANIA podczas gry w hot-seat, nie tego co się serializuje).
Zweryfikowano: brak nakładania linii z równoległymi `R-HOTSEAT-ETAP6C-ECONOMY-Q1`
(main.ts rozproszone + `runWorldEndTurn()`) i `R-HOTSEAT-ETAP6E-PREREQ-BOOT-TDZ-Q1`
(main.ts ok. 2400-2520/10380-10400) — `buildSaveGameSnapshot()`/`restoreGameFromSave()`
leżą w zupełnie innym regionie main.ts.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ KODU:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP7-RECON-SAVELOAD-Q1/01-operator-runda1.md`
  (dokument źródłowy, PO 2 rundach poprawek Evaluatora — projekt `GraczSaveV3` z
  poprawnymi typami `*Pace` jako string-union, poprawna kolejność
  `openStartupMainMenu()` PRZED `showHintMessage()` przy komunikacie o niekompatybilnym
  zapisie — czytaj CAŁY dokument z poprawkami §4/§5, nie pierwszą wersję).
- **ABC-4, przeczytaj OSOBIŚCIE** (`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`, sekcja na
  samej górze pliku) — to jest wiążąca decyzja właściciela, nie sugestia.
- Potwierdzone w recon: bug `aiSkarbiecByOwner`/`aiNaukaPoolByOwner` (Audyt #44) opisany
  w planie **JEST JUŻ NAPRAWIONY** w dzisiejszym kodzie (main.ts ok. 28389/28392
  serializują, main.ts ok. 36285-36289/35896-35899 odtwarzają) — NIE MASZ nic do
  naprawienia tutaj, tylko potwierdź świeżo że nadal tak jest (main.ts się przesunął od
  integracji Etapów 6b/6f).
- **main.ts zmienia się codziennie — WSZYSTKIE numery linii z recon MUSZĄ zostać
  zweryfikowane świeżym grepem przed każdą zmianą.** Recon cytuje `buildSaveGameSnapshot()`
  main.ts ok. 28256 i `restoreGameFromSave()` main.ts ok. 35646 — zweryfikuj świeżo,
  main.ts urósł/przesunął się od integracji Etapów 6b i 6f.
- Projekt formatu v3 z recon §4 (po poprawkach): `gracze: Array<[ownerId, GraczSaveV3]>`
  (zamiast pojedynczego `gracz`), `exploredByHuman: Array<[ownerId, string[]]>` (zamiast
  pojedynczego `explored`), `humanOwnerIds`, `activeHumanOwnerId` — pełne typy pól
  `GraczSaveV3` (w tym `*Pace` jako string-union, nie `number`) są w dokumencie recon §4,
  skopiuj je dosłownie, nie odtwarzaj z pamięci.
- Mechanizm detekcji niekompatybilnego formatu z recon §5/§7b: `IncompatibleSaveFormatError`
  z twardym progiem `ver < 3` (NIE generyczne `ver < SAVE_VERSION` — dzisiejszy
  `deserializeGame` robi to źle, patrz recon §5 dla dokładnego opisu buga), dedykowana
  gałąź w `loadGameFromSlot` wzorem istniejącej gałęzi `fatal.length > 0`, z KOLEJNOŚCIĄ
  `openStartupMainMenu()` PRZED `showHintMessage()` (recon §5, poprawione po zarzucie
  Evaluatora — dokładnie ten sam bug co historyczny N-ZINDEX-TOAST).

ZADANIE TEJ RUNDY:
1. Zweryfikuj świeżym grepem/Read `buildSaveGameSnapshot()`/`restoreGameFromSave()` pod
   dzisiejszymi numerami linii — potwierdź że projekt recon nadal pasuje do struktury
   kodu (main.ts się zmienił od integracji 6b/6f).
2. Zaimplementuj format v3 zgodnie z projektem recon §4: `gracze[]`, `exploredByHuman`,
   `humanOwnerIds`, `activeHumanOwnerId`, poprawne typy `GraczSaveV3.*Pace`.
3. Zaimplementuj `IncompatibleSaveFormatError` + dedykowaną gałąź w `loadGameFromSlot`
   z komunikatem czytelnym dla użytkownika, w POPRAWNEJ kolejności wywołań (recon §5/§7b).
4. **ZERO funkcji migrującej v2→v3** — zgodnie z ABC-4, stary zapis ma dać czytelny błąd,
   nie próbę wczytania.
5. Potwierdź świeżo że `aiSkarbiecByOwner`/`aiNaukaPoolByOwner` nadal są poprawnie
   serializowane/odtwarzane (Audyt #44 już naprawiony, nie dubluj pracy).
6. Napisz bramkę dowodu: (a) no-op roundtrip przy `humanOwnerIds=[0]` — zapis→wczytanie
   v3 daje identyczny stan gry co dziś (mimo nowego formatu); (b) test komunikatu przy
   STARYM formacie — spreparowany zapis v2 (albo bez pola `ver`/`gracze`) daje czytelny
   komunikat błędu, NIE crash/cichą awarię/wczytanie śmieci. Metoda z recon §7 (test
   bezpośredni `deserializeGame` na v2 JSON + strukturalny test main.ts wzorem
   `gra/tools/load-fail-toast-zindex-test.cjs` — sprawdź czy ten plik istnieje i użyj go
   jako wzorca).

BINARNE KRYTERIUM SUKCESU: zapis w formacie v3 zawiera `gracze[]`/`exploredByHuman`/
`humanOwnerIds`/`activeHumanOwnerId`, roundtrip zapis→wczytanie przy `humanOwnerIds=[0]`
daje identyczny stan gry (no-op), wczytanie zapisu w starym formacie daje czytelny
komunikat (nie crash, nie cichą awarię, nie próbę wczytania śmieci), kolejność
`openStartupMainMenu()`/`showHintMessage()` poprawna. `tsc --noEmit` czysty. 5 bramek
referencyjnych zielone.

ALLOWLISTA:
- `gra/src/main.ts` (wyłącznie `buildSaveGameSnapshot()`, `restoreGameFromSave()`,
  `loadGameFromSlot`, `deserializeGame`, definicja `GraczSaveV3`/`IncompatibleSaveFormatError`
  — funkcje save/load, NIE dotykaj `runWorldEndTurn()`/regionu bootstrapu renderu ani
  żadnych innych funkcji zajętych przez równoległe lany)
- `gra/src/game/save.ts` (jeśli tam leżą typy/funkcje pomocnicze save — zweryfikuj
  świeżo strukturę pliku)
- `gra/tools/hotseat-etap7-saveload-test.cjs` (NOWY plik, bramka dowodu)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP7-SAVELOAD-Q1/*`
Zakaz `git add -A`. Zakaz pisania funkcji migrującej v2→v3 (sprzeczne z ABC-4).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz wdrożenia formatu v3 sprzecznego z ABC-4 (żadnej
migracji, zawsze czytelny komunikat dla starego formatu). Zakaz testu no-op z tylko
jednym stanem gry (przetestuj z niepustym stanem — miasta, jednostki, technologie, nie
tylko świeży start). Zakaz deklaracji "komunikat czytelny" bez żywego zrzutu Chromium
pokazującego rzeczywisty tekst na ekranie.

IZOLACJA: worktree `/home/user/wt-hotseat-etap7-saveload`, gałąź
`autobot/R-HOTSEAT-ETAP7-SAVELOAD-Q1`, baza `origin/main` @ `eadb3d44`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`; jedyna dozwolona komenda buildu do
bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo>
--emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED. Jeśli Evaluator zwraca
NIEPUSTĄ listę zarzutów — zawsze wymagana runda Obrony przed kolejnym Evaluatorem.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Po PASS: integracja allowlist-only przez orkiestratora. To jest OSTATNI etap
całego planu hot-seat — po jego zamknięciu (i domknięciu pozostałych podetapów 6c/6d/6e/
6f-część-ii) cały temat hot-seat będzie kompletny.
DEPLOY/PUSH: NIE WYKONANO
