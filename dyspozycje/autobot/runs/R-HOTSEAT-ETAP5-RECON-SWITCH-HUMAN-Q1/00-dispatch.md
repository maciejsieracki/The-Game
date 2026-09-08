STATUS: DISPATCH
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1
GOAL: Recon-only (ZERO zmian kodu) dla Etapu 5 planu hot-seat
(`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`, §C, wiersz "5"): `switchActiveHuman()` (reset
19+ cache'y, zamknięcie paneli, `refreshFog`, kamera) + `ui/hotSeatHandoff.ts`
(pełnoekranowa zasłona przekazania). Ryzyko wg planu: **"wysokie (wyciek info)"** —
analogiczne traktowanie jak recon Etapu 4 (`R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1`, zamknięty
2026-09-07, wzorzec metody: pełna mapa + świeże numery linii + konkretny, automatyzowalny
plan dowodu no-op).

KONTEKST — PLAN HOT-SEAT (przeczytaj w całości sekcje C i D):
`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`:
- §C wiersz Etap 5: "`switchActiveHuman()` (reset 19 cache'y, zamknięcie paneli,
  `refreshFog`, kamera) + `ui/hotSeatHandoff.ts` (pełnoekranowa zasłona)". Kryterium
  gotowości: "po przekazaniu żaden panel/mgła/minimapa poprzednika".
- §D ryzyko #3: "Wyciek informacji poza mgłą: 19 cache'y `_last*` (10054-10142),
  `warEventLog` (7909), `villageEventLog` (13401), `borderMarchEventLog`, otwarte panele,
  `selectedId` (9846), `plannedMarches` (21821), pozycja kamery, overlaye tras/terytorium."
  **UWAGA: te numery linii są z DATY NAPISANIA PLANU, nie dzisiejsze — main.ts zmienia się
  ~3.4 commity/dzień, zweryfikuj WSZYSTKO świeżym grepem, dokładnie jak zrobił to recon
  Etapu 4.**

STAN DZISIEJSZY (potwierdzone przez orkiestratora PRZED dispatchem):
- `ui/hotSeatHandoff.ts` **NIE ISTNIEJE** (zweryfikowane: `grep -rn "hotSeatHandoff"
  gra/src` → zero trafień).
- `switchActiveHuman` **NIE ISTNIEJE** jako identyfikator w kodzie (zero trafień).
- Etapy 0-3 są zintegrowane (`human-owners.ts`, `humanSeats`, `isHuman`/`isAiOwner`
  akcesory ekonomiczne) — Etap 5 może z nich korzystać.
- Etap 4 (rozcięcie `triggerPlayerEndTurn`) jest W TRAKCIE (pod-etap 4a zintegrowany,
  4b jeszcze nie) — **Etap 5 NIE zależy funkcjonalnie od ukończenia Etapu 4**: jest to
  NOWY, NIEWPIĘTY moduł (dokładnie ten sam wzorzec co Etap 0 — `human-owners.ts` powstał
  jako "zero podmian", zanim cokolwiek go wołało). `switchActiveHuman()`/
  `ui/hotSeatHandoff.ts` będą faktycznie WOŁANE dopiero przez przyszły `advanceSeat()`
  (Etap 4b) — do tego czasu istnieją jako martwy, ale w pełni przetestowalny kod.

ZADANIE TEJ RUNDY (WYŁĄCZNIE recon, zero kodu produkcyjnego):
1. **Zainwentaryzuj WSZYSTKIE źródła stanu, które muszą być zresetowane/przełączone przy
   zmianie aktywnego człowieka**, świeżym grepem/odczytem, z dzisiejszymi numerami linii:
   a. Wszystkie `_last*` cache'y w `main.ts` (świeży `grep -n "let _last\|const _last"`)
      — dla KAŻDEGO ustal: czy jest per-owner już dziś (bezpieczny), czy globalny
      (wymaga resetu/przełączenia przy handoff). Plan mówi "19" — potwierdź dokładną
      dzisiejszą liczbę, nie ufaj cudzej liczbie sprzed tygodni.
   b. `warEventLog`, `villageEventLog`, `borderMarchEventLog`, `tradeRouteEventLog`,
      `rationAutoEventLog` i inne logi zdarzeń wspomniane w recon Etapu 4 (sekcja 1,
      wiersz 8 tamtego dokumentu) — czy są globalne czy per-owner, czy handoff wymaga
      ich filtrowania/przełączenia widoku.
   c. `selectedId` (zaznaczona jednostka/miasto), `plannedMarches`, pozycja kamery,
      otwarte panele/modale (jakie identyfikatory stanu je opisują dziś?).
   d. Overlaye mapy: trasy handlowe, terytorium, mgła wojny (`exploredByHuman` z Etapu 2
      — potwierdź że handoff MUSI wywołać coś typu `refreshFog()` po przełączeniu, bo
      inaczej ekran nadal pokazuje mgłę poprzedniego człowieka).
   e. Minimapa (`getMinimapData` — z Etapu 2, sprawdź czy jest już per-owner czy wymaga
      przełączenia parametru).
2. **Zaprojektuj sygnaturę i ciało `switchActiveHuman(newActiveOwnerId)`** — funkcja,
   która: (a) zapisuje/przywraca per-człowieka stan (kamera, zaznaczenie, otwarte panele —
   zamyka je, nie przywraca, zgodnie z kryterium "żaden panel poprzednika"), (b) ustawia
   `humanSeats.activeHumanOwnerId = newActiveOwnerId`, (c) odświeża WSZYSTKIE listy z
   punktu 1 (fog/minimapa/HUD/`_last*` gdzie relevantne). Nie implementuj jeszcze —
   NAPISZ PLAN z dokładnymi nazwami funkcji do wywołania i miejscami w main.ts.
3. **Zaprojektuj `ui/hotSeatHandoff.ts`** — pełnoekranowa zasłona pokazywana MIĘDZY
   `switchActiveHuman()` a odsłonięciem HUD nowego człowieka (np. "Przekazanie kontroli:
   Gracz 2 — kliknij aby kontynuować"), tak by w UŁAMKU sekundy między przełączeniem stanu
   a wyrenderowaniem nowego widoku żaden fragment ekranu poprzednika nie był widoczny
   (ryzyko: jeśli DOM aktualizuje się asynchronicznie/w kilku klatkach, poprzedni widok
   mógłby "mignąć" — zbadaj czy istniejący wzorzec modali w kodzie (np. `preBattle`,
   `diplomacyAudience`) daje bezpieczny precedens synchronicznego pokrycia ekranu).
4. **Ustal konkretny, automatyzowalny dowód "no leak"** — analogicznie do dowodu no-op
   Etapu 4 (headless symulacja + hash), tu potrzebny jest dowód, że PO
   `switchActiveHuman(ownerB)` żadna struktura DOM/stanu widoczna dla gracza nie zawiera
   danych właściwych wyłącznie ownerowi A (np. test: ustaw dwa fotele z RÓŻNYMI stanami
   gry, wywołaj switch, sprawdź że snapshot widocznego stanu HUD/mapy pasuje WYŁĄCZNIE do
   ownera B). Zaproponuj konkretny plik `gra/tools/hotseat-etap5-*-test.cjs` i metodę
   (może być headless jak Etap 4, może wymagać Chromium jeśli dotyczy realnie
   renderowanego DOM/CSS zasłony — rozstrzygnij i uzasadnij wybór).
5. **Sprawdź nakładanie z Etapem 4b** (jeszcze niedispatchowanym) — czy cokolwiek z tego
   planu wymaga, żeby `advanceSeat()` już istniał, czy da się zbudować w pełni w izolacji
   (jak `human-owners.ts` w Etapie 0). Jeśli znajdziesz twardą zależność od `advanceSeat()`,
   zatrzymaj się i zgłoś to jawnie zamiast projektować na niepewnym gruncie.

BINARNE KRYTERIUM SUKCESU TEJ RUNDY: kompletna mapa źródeł stanu (punkt 1, z dzisiejszymi
numerami linii, żadnego pominiętego globalnego cache'a wpływającego na widoczność
informacji), konkretny plan `switchActiveHuman()`/`hotSeatHandoff.ts` z nazwami
funkcji/miejscami wywołania, i wykonywalny plan testu "no leak" — dokładnie ten sam poziom
konkretności co recon Etapu 4 (nie "powinno działać", tylko precyzyjny przepis).

ALLOWLISTA:
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/*` (WYŁĄCZNIE dokument
  recon — zero zmian w `gra/`)
Zakaz `git add -A`. Zakaz jakiegokolwiek kodu w `gra/src/**` lub `gra/tools/**` w tej
rundzie — to jest RECON, implementacja to osobny, późniejszy temat
(`R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1`, po tym dokumencie).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz przepisywania listy ryzyk z planu bez świeżej
weryfikacji każdego numeru linii i każdej struktury danych osobno (dokładnie tak jak
recon Etapu 4 znalazł dodatkowe, nieujęte w planie miejsca przez świeże czytanie kodu,
nie kopiowanie planu). Jeśli któryś z 19+ cache'y z planu już nie istnieje albo zmienił
nazwę — odnotuj to wprost, nie milcz i nie zgaduj.

IZOLACJA: worktree `/home/user/wt-hotseat-etap5-recon`, gałąź
`autobot/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1`, baza `origin/main` @ `06c0eaa5`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit` (nie powinno być nawet potrzebne — zero
zmian kodu).

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow). Final Control NIE dispatchowany
(dokument, nie kod — analogicznie do recon Etapu 4). Po zamknięciu: dispatch
`R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1` (implementacja) jako osobny temat.
DEPLOY/PUSH: NIE WYKONANO
