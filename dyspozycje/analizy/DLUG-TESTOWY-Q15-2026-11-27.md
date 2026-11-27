# Dług testowy Q15 (R-WEB-TEST-DEBT-Q15, tag TDQ15) — 2026-11-27

Baza: `22f69d901f6cdad09df024225e3105553e3f177d` (origin/main). Zero zmian w `gra/src/**` i `gra/data/**`.
Bramki (runda 2, po obronie): `tsc --noEmit` exit 0; `tools/logic-test.cjs` LOGIC OK (213/213); `tools/ai-test.cjs` 297 passed, 0 failed (po `npm ci --ignore-scripts`).

## 1. unit-upkeep-cost-pace-test.cjs: było 80 ok / 1 FAIL, jest 81 ok / 0 FAIL

Padała asercja „wszystkie wywołania silnika utrzymania w 27 miejscach niosą tempo”.
Skaner zgłosił trzy miejsca:

| Miejsce (main) | Wywołanie | Przyczyna |
|---|---|---|
| `gra/src/main.ts:34614` | `unitUpkeep(... paceUtrzymaniaWlasciciela(ownerId, pace))` | tempo podane (zmienna `pace` = `kosztJednostekPaceUtrzymania()`, linia 34601), owinięte owner-aware wrapperem; skaner szukał tylko `kosztJednostekPace` lub `Pace\b` |
| `gra/src/main.ts:34617` | `totalUnitResourceUpkeep(... paceUtrzymaniaWlasciciela(ownerId, pace))` | jak wyżej |
| `gra/src/main.ts:34927` (zgłoszone jako 34926) | `unitFoodPerTurn` w KOMENTARZU JSDoc `/** ... unitFoodPerTurn (tempo wliczone). */` | fałszywy alarm: skaner pomijał linie `/* ...` tylko gdy zaczynały się od `*`; prawdziwe wywołanie w 34927 niesie tempo |

Ustalenie: kod NIE jest błędny. Owner-aware wrapper `paceUtrzymaniaWlasciciela` (`gra/src/game/ai-free-unit-upkeep.ts:83`) jest celowym, udokumentowanym punktem wejścia dla utrzymania per właściciel: zwraca 0 w oknie darmowego utrzymania AI (R-WEB-AI-FREE-UNIT-UPKEEP-40-TURNS-Q1, `dyspozycje/analizy/AI-DARMOWE-UTRZYMANIE-40-TUR-2026-11-22.md`) oraz w oknie łaski gracza (R-WEB-EARLY-GRACE-15-IMPL-Q1, decyzja Q41-A, FALA 935); w pozostałych przypadkach zwraca tempo bez zmian. Pin był stary: nie znał wrappera.

Zmiana (tylko `gra/tools/unit-upkeep-cost-pace-test.cjs`, skaner):
- wrapper `paceUtrzymaniaWlasciciela(` niesie tempo TYLKO wtedy, gdy DRUGI argument jest tempem (`kosztJednostekPace*`, `pace`, `*Pace*`); sama nazwa tokenu już nie wystarcza (poprawka zarzutu Evaluatora 1);
- luźny warunk `\bpace\b` zawężony do pozycji argumentu: `[(,]\s*pace\s*[,)]` (zarzut 2);
- pomijanie linii komentarza objęło `/*` i `/**` (nie tylko `*` i `//`); to usuwa fałszywy alarm z 34926/34927 (liczba wywołań 27 → 26).

Mutacje (każda przywrócona, `main.ts` odtworzony z kopii, `git status` czysty poza testami):
- `main.ts:34616` `paceUtrzymaniaWlasciciela(ownerId, pace)` → `(ownerId, 1)`: `80 ok, 1 FAIL` (przed poprawką skanera: 81 ok / 0 FAIL, czyli mutacja była niewidoczna);
- `main.ts:34617` → `(ownerId, undefined)`: `80 ok, 1 FAIL`;
- obie naraz: `80 ok, 1 FAIL`.

## 2. wydarzenia-eliminacja-podboj-karta-test.cjs: przed 24 pass / 4 fail, po poprawce 25 pass / 3 fail

### 2a. (0.5c) kicker modalu: PRZYCZYNA USTALONA, naprawione w tescie (zero zmian gra/src)

Odtworzenie (minimalne): karta dyplomatyczna `elim-cs-diplo-regres-r3` zaseedowana przez hak `__sidePanelLinkTestDebug`, klik trafia w kartę ((0.5b) OK), ale karta ma klasę `sp-no-link` i `linkFor(id) === null`, więc klik nie otwiera modalu.

Linia przyczyny: `gra/src/main.ts:31358` — hak `seedEvents` wykonuje `civElimEventDetails.clear()`. Test wołał `setCivElimDetails` PRZED `seedEvents` (komentarz testu twierdził odwrotnie), więc szczegóły były kasowane. Dowód diagnostyczny (kopia testu, usunięta po badaniu): po `seedEvents` + `setCivElimDetails` + `closeAll()` karta ma `civ-elim` / „Szczegóły”, a klik otwiera modal.

Poprawka (tylko `gra/tools/wydarzenia-eliminacja-podboj-karta-test.cjs`, asercja 0.5c bez zmian): kolejność `seedEvents` → `setCivElimDetails` → `closeAll()` (przerenderowanie). Komentarz testu skorygowany.

Mutacja: w `gra/src/ui/civElimNotice.ts` domyślny kicker `'Dyplomacja'` zamieniony na `'Podbój'` → `FAIL (0.5c) ... -- "Podbój"`. Plik przywrócony z kopii; `git status` bez zmian w `gra/src`. Po poprawce: (0.5c) OK.

### 2b. (6a)-(6c): PRZYCZYNA USTALONA, NIE pin do naprawy bez decyzji (DECISION_REQUIRED)

Mechanizm: wpis `elim-cs-1-1` powstał w turze 1 (`recordCivElimEvent`, `gra/src/main.ts:11525–11527`, `turnCreated` = 1). Przy przejściu tury (`turn++`) `expireInformationalEventsBeforeTurn(turn)` (`gra/src/main.ts:43933`) wywołuje `expireEventsBeforeTurn` (`gra/src/game/event-lifetime.ts:43–53`), które usuwa wpisy o `turnCreated < currentTurn`. Obowiązuje reguła właściciela R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1 (2026-11-04, opisana w nagłówku `event-lifetime.ts`): wydarzenie informacyjne żyje jedną turę gracza. Wpis `eot-hint-2-0` w logu po EOT to wpis NOWEJ tury (turn 2), nie zamiana wpisu eliminacji. Poprzednia hipoteza (odroczenie `eot-event-defer.ts`) jest błędna dla tego przypadku.

Test (6a)-(6c) sprawdza wpis PO zakończeniu tury (turn 2), a oczekuje, że przeżyje. To konflikt pinu z regułą właściciela, nie zwykła regresja.

DECISION_REQUIRED (jedno zdanie na wariant; asercje 6a–6c NIE zmienione):
- A: karta eliminacji znika przy przejściu tury jak pozostałe wydarzenia dziennika; wtedy 6a–6c zostają zaktualizowane do asercji wygaśnięcia (nowa tura ma wpis `eot-hint-*`), bez zmian w grze.
- B: karta eliminacji ma zostać po przejściu tury do kliknięcia; wtedy wymagana zmiana `event-lifetime.ts` dla `elim-cs-*` (gra/src), co zmienia zasadę one-turn dla jednej kategorii.

## 3. Skan szybkich testów (FAL 931–935), foreground, timeout 30 s

Dobór: 18 testów z tematów capital/plunder/endturn/barbarzyńcy/ai-difficulty/early-grace/upkeep/save-load/society/rebel/elim (plus 2 już opisane wyżej). Pełny skan wszystkich ~200 pasujących plików w tej rundzie NIE ZMIERZONO (limit czasu i zakres).

| Test | rc | Czas | Wynik | Klasyfikacja |
|---|---|---|---|---|
| capital-recapture-stale-designation-test | 0 | 1 s | PASS=12 FAIL=0 | OK |
| capital-resolver-economy-test | 0 | 2 s | 10/0 | OK |
| mint-capital-only-test | 0 | 1 s | 8/0 | OK |
| ai-city-rebellion-gate-test | 0 | 1 s | PASS=37 FAIL=0 | OK |
| ai-difficulty-bonus-test | 0 | 1 s | 97/0 | OK |
| barbarians-test | 0 | 1 s | 213/0 | OK |
| early-grace-15-test | 0 | 0 s | 33/0 | OK |
| upkeep-test | 0 | 1 s | 91/0 | OK |
| unit-upkeep-era-scale-test | 0 | 1 s | 24 ok/0 | OK |
| society-breakdown-test | 0 | 0 s | 56 OK/0 | OK |
| endturn-quiet-test | 0 | 0 s | 10/0 | OK |
| eliminacja-lup-kwoty-test | 0 | 0 s | 38/0 | OK |
| elimination-full-spoils-test | 0 | 0 s | 114/0 | OK |
| barbarian-cooperation-grace-test | 0 | 1 s | 30/0 | OK |
| ai-free-unit-upkeep-test | 0 | 1 s | 34 ok/0 | OK |
| capital-capture-test | 0 | 0 s | brak linii podsumowania | OK wg kodu wyjścia; wynik do potwierdzenia |
| save-load-sort-test | 0 | 0 s | brak linii podsumowania | OK wg kodu wyjścia; wynik do potwierdzenia |
| save-load-roundtrip-state-drift-test | 1 | 1 s | „--dist <abs-dist> z index.html jest wymagany” | ŚRODOWISKO: test wymaga argumentu `--dist` (zbudowany dist); bez wywołania z dist to nie regresja gry |
| unit-upkeep-cost-pace-test | 0 | 0 s | 81 ok/0 | po naprawie pinu (pkt 1) |
| wydarzenia-eliminacja-podboj-karta-test | 1 | ~1 min | po poprawce 25 pass / 3 fail (0.5c OK; 6a–6c = DECISION_REQUIRED, pkt 2b) |

Brak wyników podsumowania w capital-capture-test i save-load-sort-test: kod wyjścia 0, nie potwierdzono liczby asercji.

## 4. Stan zmian

- Zmienione pliki: `gra/tools/unit-upkeep-cost-pace-test.cjs` (skaner tempa, pkt 1); `gra/tools/wydarzenia-eliminacja-podboj-karta-test.cjs` (kolejność seed/details/closeAll, pkt 2a); ten dokument.
- `gra/src/**`, `gra/data/**`: bez zmian (mutacje w `gra/src` były przywracane z kopii; `git status` czysty poza testami).
- Testów nie usunięto; asercji nie osłabiono. Asercje 0.5c, 6a–6c, skanera tempa niezmienione co do warunku oczekiwanego; skaner tylko precyzyjniej wykrywa tempo.
- Otwarte: 6a–6c — DECISION_REQUIRED (pkt 2b). Skan tabelą nie obejmuje wszystkich ~200 pasujących testów (pkt 3).
