STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1
GOAL: Pierwszy, najbezpieczniejszy pod-etap właściwego rozcięcia `triggerPlayerEndTurn()`
(Etap 4 planu hot-seat, `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`, "najwyższe ryzyko całego
planu" wg recon). Wykonaj WYŁĄCZNIE Krok 0 i Krok 1 z planu implementacji rundy 2 recon
(`dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/01-operator-runda1-analiza.md`,
sekcja 6.1) — NIC WIĘCEJ. Krok 2-5 (właściwy split na `endActiveHumanTurn`/`advanceSeat`,
podłączenie 3 call-site'ów) to OSOBNY, PÓŹNIEJSZY temat — NIE zaczynaj go w tej rundzie.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED ROZPOCZĘCIEM PRACY:
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1/01-operator-runda1-analiza.md`
(555 linii, recon zamknięty 2026-09-07, Operator→Evaluator, zero kodu). Ten dokument ma
KOMPLETNĄ mapę 16 faz funkcji, dokładne cytaty kodu, i uzasadnienie każdej decyzji. NIE
zgaduj niczego, co tam już jest odpowiedziane.

**KRYTYCZNE OSTRZEŻENIE Z RECON (dosłowny cytat, linia 6-7 dokumentu): "main.ts zmienia
się codziennie (103 commity/30 dni) — przed rundą 2 odśwież WSZYSTKIE numery linii świeżym
grepem, nie ufaj tym liczbom."** Wszystkie numery linii poniżej są z chwili napisania
recon (2026-09-07) — main.ts poszedł od tego czasu przez ~11 kolejnych integracji tej samej
sesji. Zweryfikuj KAŻDY cytat świeżym `grep -n`/odczytem PRZED edycją.

ZADANIE (dokładnie sekcja 6.1 recon, Krok 0 + Krok 1):

**Krok 0 — wydziel `runWorldEndTurn()` jako nową funkcję, literalny copy-paste bez
zmiany semantyki.**
- Zawiera DOKŁADNIE fazy 7-14 z tabeli sekcji 1 recon: od `turn++` do końca bloku `try`
  PRZED `finally` (fazy 15-16 zostają w `triggerPlayerEndTurn`/przyszłym
  `endActiveHumanTurn` — NIE przenoś ich).
- Na razie WOŁANA z tego samego miejsca co dziś (bezpośrednio po dzisiejszej fazie
  "gracza"), BEZ ŻADNEJ zmiany warunkowej ("czy to ostatni fotel") — to jest formalnie
  no-op przy jednym fotelu, nic więcej.
- **OBOWIĄZKOWA poprawka z rundy 2 recon (Zarzut 4, sekcja "Zarzut 4" dokumentu)**:
  `nextTurnNum` jest dziś deklarowana w fazie "gracza" (`const nextTurnNum = turn + 1`),
  ale używana w wielu miejscach PO `turn++` (w fazach, które trafiają do
  `runWorldEndTurn()`). Jeśli `runWorldEndTurn()` stanie się osobną funkcją najwyższego
  poziomu (nie zagnieżdżonym domknięciem), `nextTurnNum` przestanie być widoczna —
  **`runWorldEndTurn()` musi PRZELICZYĆ `const nextTurnNum = turn + 1` na WŁASNYM
  starcie, PRZED `turn++` wewnątrz siebie** (opcja (b) z dokumentu — prostsza,
  bezpieczniejsza niż przekazywanie parametrem).

**Krok 1 — przenieś TRZY bloki kodu "światowego" osadzonego tekstowo w bloku "gracza"
(przed `turn++`) na SAM POCZĄTEK `runWorldEndTurn()`:**
1. Czyszczenie `st.bunt` dla WSZYSTKICH miast (`for (const st of cityOrderState.values())
   { if (st.bunt) st.bunt = undefined; }`) — Ryzyko #1b recon.
2. `evictForeignUnitsFromCityHexes()` — Ryzyko #1 recon (ciało main.ts:10811-10839 w
   chwili recon, iteruje `for (const u of units)` bez filtra ownera).
3. Reset ruchu WSZYSTKICH jednostek (`movedByPlayerThisTurn.clear()`;
   `for (const u of units) { u.ruchLeft = u.ruch; ...; u.replaceUsedThisTurn=false;
   u.retreatedThisTurn=false; }`) — Ryzyko #1 recon, "NAJWAŻNIEJSZE ZNALEZISKO" tamtej rundy.
Kolejność między tymi trzema blokami a `turn++` wewnątrz `runWorldEndTurn()` NIE ma
znaczenia funkcjonalnego (żaden z nich nie czyta `turn`) — recon to potwierdza wprost.

DLACZEGO TO MA ZNACZENIE (nie kosmetyka): w single-player dziś te trzy bloki wykonują się
raz na turę świata przypadkiem (bo `triggerPlayerEndTurn` woła się raz na turę). Gdyby
zostały w przyszłym `endActiveHumanTurn()` (wołanym per-fotel-człowieka w Etapie 8),
wykonałyby się DWA RAZY na jedną turę świata w hot-seat — dla resetu ruchu oznaczałoby to
darmowy dodatkowy ruch dla jednostek człowieka, który już skończył turę. Ten temat
zapobiega temu z wyprzedzeniem, PRZED właściwym rozcięciem na `endActiveHumanTurn`.

WERYFIKACJA no-op (OBOWIĄZKOWA, konkretna, nie "powinno działać"):
Bramka `gra/tools/hotseat-etap4-noop-test.cjs` (zintegrowana w tej samej sesji, commit
`2a99ec69`) już istnieje DOKŁADNIE do tego celu — 30-turowa headless symulacja, hash
SHA-256 stanu po każdej turze, deterministyczny `Math.random` (mulberry32), run A vs run B.
Uruchom ją PRZED zmianą (baseline, 30/30 identycznych A/B — to już jest zielone, potwierdź
że nadal jest) i PO zmianie (potwierdź że WCIĄŻ 30/30, identyczne z baseline — nie tylko
"A==B", ale te same konkretne hashe co przed zmianą, bo to dowodzi że rearanżacja kodu nie
zmieniła KOLEJNOŚCI efektów ubocznych, nie tylko że A i B się zgadzają ze sobą nawzajem).
Jeśli którakolwiek tura da inny hash niż baseline — to jest REALNY dowód, że przeniesienie
zmieniło kolejność/efekt któregoś z trzech bloków względem reszty tury — zatrzymaj się,
zbadaj która tura i dlaczego, NIE uznawaj tematu za gotowy dopóki hashe nie są identyczne
z baseline.

BINARNE KRYTERIUM SUKCESU:
1. `runWorldEndTurn()` istnieje jako osobna nazwana funkcja zawierająca fazy 7-14 (patrz
   wyżej), wołana z tego samego miejsca co dziś wołane były te fazy.
2. Trzy bloki (st.bunt, evictForeignUnitsFromCityHexes, reset ruchu) fizycznie przeniesione
   na początek `runWorldEndTurn()`, usunięte ze swojej starej pozycji w bloku "gracza".
3. `hotseat-etap4-noop-test.cjs` PO zmianie daje IDENTYCZNE 30 hashy jak PRZED zmianą
   (nie tylko A==B wewnątrz jednego przebiegu — porównaj z zapisanym baseline z przebiegu
   na kodzie sprzed tej zmiany).
4. Trzy miejsca wywołania `triggerPlayerEndTurn()` (main.ts, HUD przycisk / `__eraTestDebug.
   endTurn` / skrót klawiszowy „N") NIETKNIĘTE w tej rundzie — nadal wołają
   `triggerPlayerEndTurn()` wprost, funkcja nadal istnieje pod tą samą nazwą i wywołuje
   teraz `runWorldEndTurn()` wewnętrznie zamiast mieć fazy 7-14 inline.

ALLOWLISTA:
- `gra/src/main.ts` (WYŁĄCZNIE: wydzielenie `runWorldEndTurn()`, przeniesienie trzech
  bloków, dopisanie lokalnego przeliczenia `nextTurnNum` w nowej funkcji — zakaz
  jakiejkolwiek innej zmiany semantyki, w szczególności zakaz zaczynania Kroku 2-5 z
  recon: nie wydzielaj `endActiveHumanTurn()`, nie twórz `advanceSeat()`, nie zmieniaj
  call-site'ów)
- `gra/tools/*.cjs` (jeśli potrzebne nowe asercje potwierdzające przeniesienie — NIE
  modyfikuj samej logiki `hotseat-etap4-noop-test.cjs` bez wyraźnej potrzeby, to jest
  gotowa, zweryfikowana bramka)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1/*`
Zakaz `git add -A`. Zakaz dotykania `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` (dokument
planu — aktualizacja statusu etapu to zadanie orkiestratora przy integracji, nie Twoje).

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania tematu za gotowy na podstawie SAMEGO
odczytania kodu ("wygląda na no-op") — wymagany REALNY przebieg `hotseat-etap4-noop-test.cjs`
PRZED i PO zmianie z zachowanym baseline do porównania (nie tylko finalny wynik PASS/FAIL,
ale konkretne listy 30 hashy, identyczne). Jeśli po zmianie test nadal daje "30/30 A==B"
ale hashe są INNE niż przed zmianą — to NIE jest dowód no-op, to jest dowód że coś się
zmieniło konsekwentnie w obu przebiegach (np. kolejność efektów w danej turze) — taki
wynik wymaga zatrzymania się i zbadania przyczyny, nie automatycznego PASS.

IZOLACJA: worktree `/home/user/wt-hotseat-etap4a-world-code`, gałąź
`autobot/R-HOTSEAT-ETAP4A-WORLD-CODE-REALOKACJA-Q1`, baza `origin/main` @ `7393d5aa`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only → dopiero PO zielonym Etapie 4a,
dispatch Kroku 2-5 (właściwy split `endActiveHumanTurn`/`advanceSeat`) jako
R-HOTSEAT-ETAP4B-SPLIT-Q1.
DEPLOY/PUSH: NIE WYKONANO
