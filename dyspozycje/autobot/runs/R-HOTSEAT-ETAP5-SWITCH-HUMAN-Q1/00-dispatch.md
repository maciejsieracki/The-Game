STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1
GOAL: Implementacja Etapu 5 planu hot-seat (`docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` §C) na
podstawie zamkniętego recon (`dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/
01-operator-runda1-analiza.md`, 1015 linii, 4 rundy, PASS): nowa funkcja
`switchActiveHuman(newActiveOwnerId: number): void` w `main.ts` + nowy moduł
`ui/hotSeatHandoff.ts` (pełnoekranowa zasłona przekazania kontroli). **Dokładnie wzorzec
Etapu 0: nowy, IZOLOWANY kod, ZERO call-site'u produkcyjnego w tej rundzie** — obie funkcje
będą faktycznie wołane dopiero przez przyszły `advanceSeat()` (Etap 4b, dispatchowany
równolegle, może się integrować w dowolnej kolejności względem tego tematu — recon §5
potwierdza brak twardej zależności w żadną stronę).

WYMAGANY WSTĘP — PRZECZYTAJ W CAŁOŚCI PRZED ROZPOCZĘCIEM PRACY:
`dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/01-operator-runda1-analiza.md`
w CAŁOŚCI (wszystkie 4 rundy, dokument końcowy). Ten dokument ZAWIERA już: kompletną listę
źródeł stanu (§1a-e, §1e-bis), gotowy projekt `switchActiveHuman()` z 7 krokami i pełnym
uzasadnieniem kolejności (§2, kod referencyjny — użyj jako bazę, NIE wymyślaj od zera),
kontrakt `ui/hotSeatHandoff.ts` (§3.3), analizę bezpieczeństwa synchroniczności (§3.2),
kompletny plan bramki "no leak" z dwoma scenariuszami A/B i konkretnymi asercjami (§4.2).
**Twoja praca w tej rundzie to W GŁÓWNEJ MIERZE PRZENIESIENIE już zaprojektowanego kodu do
main.ts + implementacja `ui/hotSeatHandoff.ts` + napisanie bramki — NIE projektowanie od
zera.**

**OSTRZEŻENIE (jak zawsze w tym planie): main.ts zmienia się codziennie. Numery linii w
dokumencie recon są sprzed integracji Etapu 4a i innych zmian — zweryfikuj WSZYSTKO świeżym
grepem PRZED edycją.** Stan dzisiejszy (do potwierdzenia): Etap 4a JEST już zintegrowany w
`main` (commit `3fe8c232`/`dfb051d3` w historii) — `runWorldEndTurn()` istnieje. Recon
(§0, §5) explicite ostrzega, że to zmieni numery linii `triggerPlayerEndTurn()` względem
tego, co recon widział — ale **NIE zmienia projektu `switchActiveHuman()`/
`hotSeatHandoff.ts`, które nie odwołują się do `triggerPlayerEndTurn()`/`runWorldEndTurn()`
wprost** (recon §5, potwierdzone).

ZADANIE:

1. **Zaimplementuj `switchActiveHuman(newActiveOwnerId: number): void`** w `main.ts`,
   dokładnie wg projektu z recon §2 (7 kroków: KROK 0 seed trzech map `XByHuman`, KROK 1
   zamknij 17 paneli + hint toast (KROK 1b) + build-mode z gałęzią
   `isAwaitingFirstPlayerCity()` (KROK 1c), KROK 2 zaznaczenie/marsze, KROK 3 wyczyść logi
   zdarzeń, KROK 4 przełącz fotel, KROK 5 zeruj cache HUD `_last*`, KROK 6 kamera, KROK 7
   fog/HUD). Zweryfikuj świeżym grepem KAŻDĄ nazwę funkcji/zmiennej cytowaną w §2 recon —
   main.ts mógł się zmienić od czasu napisania dokumentu. **Lokalizacja: nowa funkcja
   wewnątrz domknięcia main.ts, obok `ME()`/`isHuman()` (recon sugeruje ~10360-10400,
   zweryfikuj). BEZ eksportu, BEZ call-site'u produkcyjnego.**
2. **Zaimplementuj `ui/hotSeatHandoff.ts`** wg kontraktu z recon §3.3
   (`HotSeatHandoffInfo`, `showHotSeatHandoff`, `hideHotSeatHandoff`, `isHotSeatHandoffOpen`),
   wzorując się na `ui/preBattle.ts` (scrim + overlay + `pushOverlay`/`popOverlay` na
   `escapeOverlayStack`, Escape BEZ akcji — ekran nie może być pominięty bez kliknięcia,
   recon §3.3 uzasadnia dlaczego). Z-index wyższy niż `preBattle`/`pb-map-scrim` — sprawdź
   realną wartość w CSS przy implementacji (recon flagował to jako "do sprawdzenia").
3. **Dopisz hak testowy `__hotSeatTestDebug`** w `main.ts`, dokładnie wg wzorca z recon §4.2
   (`seedSecondSeat`, `switchActiveHuman`, `snapshotVisibleState` — rozszerz o WSZYSTKICH
   17 paneli z recon §1c, nie tylko przykładowy podzbiór z dokumentu; dopisz też
   `isAwaitingFirstPlayerCity` do haka, potrzebne dla Scenariusza B testu).
4. **Napisz bramkę `gra/tools/hotseat-etap5-no-leak-test.cjs`**, reużywając
   `buildBundle()`/`launchBrowser()`/`runOnceWithRetry`/`closeBrowserSafely` z
   `hotseat-etap4-noop-test.cjs` (ten sam wzorzec, nie budowa od zera — recon §4.1
   uzasadnia dlaczego Chromium, nie headless Node). Zaimplementuj OBA scenariusze z recon
   §4.2: **Scenariusz A** (fotel A ma już miasto, testuje normalną ścieżkę handoff — 8
   kategorii asercji: activeHumanOwnerId, selectedId, plannedMarches, exploredKeys, event
   logi, wszystkie panele, kamera, hint toast, build-mode 4 zmienne) i **Scenariusz B**
   (fotel A w trakcie `isAwaitingFirstPlayerCity()===true`, testuje gałąź guard-true
   build-mode — asercje `ghostChipVisible===false`, `escapeOverlayTopId!=='build-mode'`).
   Dopisz też dowód "brak migotania" z recon §4.2 pkt 8 (jeden `page.evaluate` wywołujący
   `showHotSeatHandoff`+`switchActiveHuman` synchronicznie, natychmiastowy odczyt
   `getBoundingClientRect()`/`zIndex` bez `await` między).
5. **Rozstrzygnij TODO z recon B2** (czy `startNewGame` zawsze daje miasto startowe — jeśli
   tak, potrzebny dodatkowy hak czyszczący `cities`/`playerEverOwnedCity` żeby wymusić
   `isAwaitingFirstPlayerCity()===true` deterministycznie dla Scenariusza B).

DECYZJE Z RECON DO ZASTOSOWANIA (nie do ponownego rozstrzygania w tej rundzie):
- **§6 pkt 1** (`refreshLiveEmpireRatesUnsafe` hardkodowana na `ownerId===0`): Etap 5
  WYŁĄCZNIE zeruje cache `_last*` (KROK 5), NIE przelicza poprawnie dla fotela #2. Pełna
  migracja na `ME()` to Etap 6 — NIE rozszerzaj zakresu tej rundy o tę migrację.
- **§6 pkt 6** (odstąpienie od invariantu `R-PIERWSZE-MIASTO` w KROKU 1c): **decyzja
  orkiestratora, autonomiczna, do potwierdzenia ABC rano** — implementuj DOKŁADNIE jak w
  recon §2 KROK 1c (wymuszony reset 4 zmiennych + `clearBuildModeVisuals()` +
  `popOverlay('build-mode')` w gałęzi `isAwaitingFirstPlayerCity()===true`), z komentarzem
  w kodzie odsyłającym do tego dispatchu i do recon §6 pkt 6, jasno nazywającym to
  świadomym odstępstwem od `R-PIERWSZE-MIASTO` (Maciej 2026-07-24) w KONTEKŚCIE handoff
  między fotelami, nie w kontekście Escape/PPM w ramach jednego fotela (którego invariant
  pierwotnie dotyczył).
- **§6 pkt 2/4** (event logi bez pola ownera, `checkVeteranEnemyFirstEncounter` hardkod):
  NIE naprawiaj — jawny dług do Etapu 6, już udokumentowany w recon, tylko odnieś się w
  raporcie że jest znany i celowo nietknięty.

BINARNE KRYTERIUM SUKCESU: bramka `hotseat-etap5-no-leak-test.cjs`, oba scenariusze A i B,
WSZYSTKIE asercje z recon §4.2 zielone — zero pola, które "przecieka" z fotela A do fotela B
po `switchActiveHuman()`.

ALLOWLISTA:
- `gra/src/main.ts` (WYŁĄCZNIE: nowa funkcja `switchActiveHuman`, nowy hak
  `__hotSeatTestDebug`, import `top` z `escapeOverlayStack` jeśli potrzebny — ZERO zmian w
  istniejących funkcjach/call-site'ach poza dopisaniem importu)
- `gra/src/ui/hotSeatHandoff.ts` (NOWY plik)
- `gra/tools/hotseat-etap5-no-leak-test.cjs` (NOWY plik)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1/*`
Zakaz `git add -A`. Zakaz dotykania `triggerPlayerEndTurn()`/`runWorldEndTurn()`/jakiegokolwiek
call-site'u istniejącej logiki końca tury — to jest temat Etapu 4b, osobny.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania bramki za dowód "no leak" bez REALNEGO
uruchomienia w Chromium z realnym, rozpoznawalnym stanem różnicującym fotel A od fotela B
(recon §4.2 krok 3 — "realny stan, nie sztuczny", żeby test łapał regresje w prawdziwych
ścieżkach kodu). Zakaz pominięcia Scenariusza B (gałąź `isAwaitingFirstPlayerCity()===true`)
— to jest DOKŁADNIE ta gałąź, w której Evaluator recon znalazł realną, poważną lukę w
rundzie 2 (przejęcie niedokończonej akcji budowy).

IZOLACJA: worktree `/home/user/wt-hotseat-etap5-switch-human`, gałąź
`autobot/R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1`, baza `origin/main` @ `cb0de8f9`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
