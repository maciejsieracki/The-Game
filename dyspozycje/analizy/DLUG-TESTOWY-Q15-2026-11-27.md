# Dług testowy Q15 (R-WEB-TEST-DEBT-Q15, tag TDQ15) — 2026-11-27

Baza: `22f69d901f6cdad09df024225e3105553e3f177d` (origin/main). Zero zmian w `gra/src/**` i `gra/data/**`.
Bramki: `tsc --noEmit` exit 0 (po `npm ci --ignore-scripts`). Logic 213 i ai-test 297/0 NIE ZMIERZONO w tej rundzie (poza zakresem dispatchu).

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
- wzorzec „niesie tempo” rozszerzony o `paceUtrzymaniaWlasciciela(` i o identyfikator `pace`;
- pomijanie linii komentarza objęło `/*` i `/**` (nie tylko `*` i `//`).

Mutacja (weryfikacja, że asercja nadal jest czerwona przy realnym braku tempa): w `main.ts:34617` podmieniono `paceUtrzymaniaWlasciciela(ownerId, pace)` na `undefined` → `80 ok, 1 FAIL` (asercja „wszystkie wywołania ... niosą tempo”). Plik `main.ts` przywrócony (`git checkout --`), `git status` czysty poza testem.

## 2. wydarzenia-eliminacja-podboj-karta-test.cjs: 24 pass, 4 fail (dispatch podawał 1 FAIL — jest 4)

| Asercja | Wynik | Klasyfikacja |
|---|---|---|
| (0.5c) kicker modalu = „Dyplomacja” dla domyślnego cause | `null` (modal nie pojawia się w DOM po kliknięciu zaseedowanej karty; (0.5a) i (0.5b) OK) | NIE ROZSTRZYGNIĘTE. Ścieżka kliknięcia `civ-elim` w `gra/src/main.ts:20501–20507` wygląda poprawnie (`civElimEventDetails.get(id)` → `showCivElimNotice`). Brak modalu może być skutkiem czasu/przysłonięcia w harnessie albo realnej regresji. Nie zmieniano asercji (zakaz osłabiania bez uzasadnienia). Wymaga osobnego tematu z odtworzeniem w przeglądarce. |
| (6a) wpis `elim-cs-1-1` nadal w warEventLog po końcu tury | FAIL: log zawiera `eot-hint-2-0` zamiast wpisu | Zamierzony mechanizm, nie stary pin do bezpośredniej zamiany: `gra/src/game/eot-event-defer.ts` (odroczenie wpisów końca tury, N1, R-WYDARZENIA-FILTR-KATEGORII) zamienia wpis w `eot-hint-*`. Test z tego wynika sprzed mechanizmu. Czy karta eliminacji ma przeżyć koniec tury pod tym samym id — to decyzja produktowa, NIE ROZSTRZYGNIĘTA. Nie zmieniano asercji. |
| (6b) tytuł wpisu „ELIMINACJA: …” po turze | FAIL (wpis nieobecny, jak 6a) | jak 6a |
| (6c) resolver zwraca civ-elim po turze | FAIL (`null`, jak 6a) | jak 6a |

Do decyzji (jednozdaniowo): czy karta eliminacji ma przetrwać koniec tury pod swoim id (wtedy 6a–6c są realnym błędem po FALI z eot-event-defer), czy zastąpienie wpisem `eot-hint-*` jest zamierzone (wtedy trzeba zaktualizować 6a–6c wraz z uzasadnieniem w rejestrze).

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
| wydarzenia-eliminacja-podboj-karta-test | 1 | ~1 min | 24 pass / 4 fail | patrz pkt 2 (BŁĄD lub stary pin — NIE ROZSTRZYGNIĘTE) |

Brak wyników podsumowania w capital-capture-test i save-load-sort-test: kod wyjścia 0, nie potwierdzono liczby asercji.

## 4. Stan zmian

- Zmieniony plik: `gra/tools/unit-upkeep-cost-pace-test.cjs` (skaner tempa, pkt 1).
- `gra/src/**`, `gra/data/**`: bez zmian (zweryfikowane `git status`).
- Testów nie usunięto; asercji nie osłabiono (skaner rozszerzony o znane formy przekazania tempa, mutacja potwierdza czerwień).
