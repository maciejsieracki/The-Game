# 02-evaluator — independent implementation gate

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1
GOAL: Niezależnie zweryfikować Normal-only semantic profile, statusy konsumentów, Greece provenance oraz realny render konfiguratora.
ZMIANY/COMMIT: brak zmian produktu i brak commita; zapisano wyłącznie ten raport oraz `02-evidence.json` w katalogu runu. Operator worktree pozostaje niescommitowany.
TESTY: TypeScript 5.9.3 PASS; semantic focused PASS 41/0; Greece regression PASS 390/0; difficulty regression 16/0; direct Vite production build PASS, 891 modules, 69,806.34 kB HTML; Chromium na zbudowanym artefakcie PASS: 1 profil, 113 wierszy, 11 aktywnych domyślnie, 102 nieaktywne w jednym zamkniętym `<details>`, search 3, filtr NEGATYWNY 11, 0 błędów; `git diff --check` PASS.
BLOKADY: 97 parametrów pozostaje jawnie `UNWIRED`/`D_REQUIRED-001..097`; nie są deklarowane jako podłączone. Osobno: `INFRA/ROUTING_ERROR` — karta Evaluatora została utworzona i uruchomiona z `project_id=null`, mimo że kontrakt projektu wymaga `p_9ae9ac64`; aktywnego runu nie zmieniano ani nie duplikowano. Brak `push`, `merge` i `deploy`.
RUNDY: 1/5
NASTĘPNY KROK: Final Control może niezależnie rozstrzygnąć kompletność tej bramki, ale Orkiestrator musi najpierw naprawić/readback routing projektu dla następnej fazy; nie traktować tego raportu jako dowodu zgodnego routingu Kanbana.
DEPLOY/PUSH: NIE WYKONANO

## 1. Guard i zakres

- Worktree: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-semantic-labels-implementation-20260921`.
- Branch: `hermes/R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1-20260921`.
- `HEAD` i baza z receiptu: `f4c89d0081c622c16b207d338b49c8bacafc4553`.
- Operator pozostawił tylko oczekiwane zmiany: `gra/src/ui/newGameFlow.ts`, nowy `gra/src/game/civ-matrix-semantic.ts`, nowy test `gra/tools/civ-matrix-semantic-labels-test.cjs` oraz sześć artefaktów `01-*` w katalogu runu. Nie znaleziono zmian poza allowlistą.
- Nie wykonano resetu, stash, clean, pull, commit, push, merge, deploy ani zmian w `gra/` poza odczytem/weryfikacją.
- Hashy źródłowych z `01-evidence.json` odtworzyłem 1:1 dla wszystkich pięciu deklarowanych plików implementacji/źródła.

## 2. Rekonsyliacja zakresu i consumerów

| Kontrola | Wynik |
|---|---:|
| Definicje parametrów | 113 |
| Cywilizacje | 15 |
| Oczekiwane komórki | 1695 |
| Faktyczne komórki | 1695 |
| Unikalne pary cywilizacja/parametr | 1695 |
| `REAL_GAMEPLAY` parametrów/komórek | 11 / 165 |
| `UI_ONLY` parametrów/komórek | 5 / 75 |
| `UNWIRED` parametrów/komórek | 97 / 1455 |
| `D_REQUIRED` | 97, kolejno `D_REQUIRED-001`…`D_REQUIRED-097` |

Niezależny skan exact parameter-ID w `gra/src/**/*.ts`, z wyłączeniem tylko generycznego `civ-matrix.ts` i nowego klasyfikatora `civ-matrix-semantic.ts`, dał 16 parametrów z trafieniami runtime/UI oraz 97 bez trafień. Call-site’y dla Greece/provenance są obecne dla wzrostu ludności, AI/dyplomacji oraz pięciu tagów UI. Pole `modul`, loader, accessor i sam snapshot nie zostały uznane za konsument.

Dla każdego z 97 wierszy `01-allocation.json` ma aktora, warunek, formułę, precedencję i test jako `UNRESOLVED`; brak zerowych adapterów, fikcyjnych efektów i cichego fallbacku do Grecji. To spełnia wymaganie, by nie relabelować nierozstrzygniętych konsumentów jako zaimplementowanych.

## 3. Kontrakt semantyczny

- Klasyfikator jest osobnym, niemutującym modułem i liczy z macierzy Normal.
- Baseline jest medianą wszystkich 15 cywilizacji, osobno dla każdego parametru.
- Polarity jest per parametr; harmful obejmuje koszty, korupcję, dezercję/attrition i `lud_spadek_proc`.
- Exact median zachowuje kontrakt właściciela: `POZYTYWNY`, signed intensity `+1`.
- Signed intensity jest ograniczone do `-10..+10`, liczone z polarity-corrected delta względem najbardziej odległej wartości.
- AI/relacje pozostają `NEUTRALNY` z oddzielnym opisem profilu/relacji.
- Brak wartości/nieznana cywilizacja daje jawny stan zablokowany i komunikat; nie ma fallbacku do Grecji.
- Etykiety są wyliczane przy renderze i nie są zapisywane w stanie gry ani sejwie.

Focused test niezależnie potwierdził medianę dla wejścia nieparzystego/parzystego, exact median, oba kierunki reverse polarity dla `lud_spadek_proc`, harmful dla korupcji/dezercji/kosztu, zakres intensity, neutralność AI/relacji, liczności statusów, brak persistence, brak Easy/Hard w panelu oraz brak fallbacku.

## 4. Konfigurator — real Chromium readback

Zbudowałem artefakt przez bezpośrednie `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-matrix-evaluator-dist --emptyOutDir` (bez `npm run build`) i uruchomiłem świeży headless Chromium na tym dokładnym pliku pod osobnym portem. `node --check` przeszedł dla tymczasowego harnessu.

Odczyt ścieżki menu → nowa gra → konfiguracja → epoka kamienia → cywilizacja:

- 1 wybrany profil;
- 113 wierszy łącznie;
- 11 `REAL_GAMEPLAY` widocznych domyślnie;
- 102 pozostałe w jednym zamkniętym `<details>`;
- rozwinięcie daje 102 wiersze;
- wyszukiwanie `meta_epoka` otwiera panel i pokazuje 3 wiersze;
- filtr `NEGATYWNY` otwiera panel i pokazuje 11 wierszy, wszystkie mają `data-label="NEGATYWNY"`;
- tekst panelu nie zawiera etykiet Easy/Hard;
- aria/status text jest obecny;
- page errors i console errors: 0.

Operatorowy dev server na porcie 4173 był już zajęty przez proces Vite przed próbą uruchomienia własnego serwera; nie użyłem go jako rozstrzygającego dowodu. Decydujący readback wykonano na świeżo zbudowanym artefakcie pod portem 4174.

## 5. Zarzuty Evaluatora

Lista zarzutów: pusta (0). Nie znalazłem produktu wymagającego poprawki w obrębie bieżącego allowlistu.

Uwaga nieblokująca domenowo: status `UNWIRED` pozostaje jawny przy wierszu i w artefakcie; nie wolno z tego raportu wyprowadzać tezy, że 97 pól ma aktywny efekt gameplay. Ich dalsze podłączenie wymaga osobnego rozstrzygnięcia aktora/warunku/formuły/precedencji/testu.

## 6. Routing i granica werdyktu

Native event/readback karty wykazał, że child Evaluator `t_02f263c1`/run `892` został utworzony z `project_id=null`, choć karta Operatora i kontrakt The-Game wskazują projekt `p_9ae9ac64`. To jest osobny `INFRA/ROUTING_ERROR`, nie zmiana produktu i nie dowód porażki testów. Zachowano aktywny run zgodnie z zasadą nieprzejmowania/mutowania działającej karty. Orkiestrator musi naprawić routing/readback przed legalnym następnym etapem; nie tworzę duplikatu ani nie zmieniam karty z tego runu.

Werdykt domenowy: `PASS-WITH-NOTES` dla zweryfikowanego zakresu implementacji i prezentacji, z jawnym `DECISION_REQUIRED` dla 97 nierozstrzygniętych consumerów oraz osobnym routingowym `INFRA`. To nie jest akceptacja integracji, `READY_FOR_DEPLOY` ani deploy.
