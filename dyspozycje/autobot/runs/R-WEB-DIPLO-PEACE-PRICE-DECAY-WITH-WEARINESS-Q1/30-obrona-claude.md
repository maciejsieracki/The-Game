# 30 — Obrona Operatora (runda 3), R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1

STATUS: FAIL-NADAL-OTWARTE (obrona częściowa; 4 zarzuty PRZYJĘTE z dowodem, 3 ODRZUCONE z dowodem, 5 ZABLOKOWANE przez allowlistę lub wymagające decyzji właściciela; Chromium i symulacja weary40 NIE ZMIERZONO)
DOMAIN: GAME (dyplomacja, balans)
TEMAT: R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1
GOAL: cena pokoju `cenaStartPn × (1 − L)` (6000 PN na starcie, 0 przy L=1), jedna funkcja w ofertach gracza, AI dobrowolnych, AI↔AI i pokoju wymuszonego; miasta oddawane do pokrycia ceny, stolica nigdy, bez progu min. 3 miast.
BAZA: origin/main 76a1739fddb415edc2204c404e9aab43e6cf5b30; startowy kandydat dd51d4899eea1508e28a704f6c3c9bcadfc2a054.
ZMIANY-COMMIT: patrz sekcja „Zmiany w tej rundzie” (SHA końcowy w polu `sha` odpowiedzi).

## Zmiany w tej rundzie (allowlista zachowana)

Pliki: `gra/src/game/diplomacy-proposals.ts`, `gra/tools/diplo-weariness-pw-behavior-test.cjs`, `gra/tools/ai-war-weariness-peace-test.cjs`, `gra/tools/diplo-peace-price-table-a.cjs` (nowy), `docs/encyklopedia/pojecia/zmeczenie-wojna.md`, `gra/src/data/wikiBundle.json` (regeneracja `node tools/bundle-wiki-for-game.cjs`).

Próba zmiany `gra/src/game/ai.ts` (AI dobrowolne i żądanie miasta na `wearinessPeaceCashPn`) została COFNIĘTA: `ai.ts` nie jest w allowliście dispatchu (allowlista: war-weariness.ts, diplomacy-proposals.ts, diplomacy-ai-forced-peace.ts, punktowo main.ts tylko ścieżka AI↔AI, pliki UI, dane, docs, gra/tools). Naruszenie granicy = FAIL, więc zmiana nie wchodzi bez poszerzenia allowlisty przez orkiestratora. Testy zależne od tej zmiany (`diplomacy-city-cession-r3-test.cjs`, `diplo-peace-weaker-seeks-city-only-test.cjs`) przywrócone do bazy.

## Odpowiedzi na zarzuty Evaluatora

1. **PRZYJMUJĘ CZĘŚCIOWO.** Wiersz Z (`wearinessPeaceItemPw`) usunięty w kierunku AI→gracz (`diplomacy-proposals.ts`, gałąź `aiToPlayerLevel`: `wearyPwItem = undefined`, zostaje tylko informacja `wearinessInfo`). Test `diplo-weariness-pw-behavior-test.cjs` (f) przepisany na: brak pozycji Z (147/0). ZOSTAJE: w tej gałęzi `basePn` (informacyjne 615 z `treatyBasePnFromConfig`) nie jest jeszcze zamienione na cenę `wearinessPeaceCashPn` — to ta sama gałąź, którą kod oznacza jako „informacyjnie”. Panel pokazuje więc jeszcze stałą 615 w tej jednej ścieżce. Wymaga decyzji orkiestratora (poszerzenie na tę gałąź jest w allowliście, ale zmienia wynik akceptacji — DECISION_REQUIRED, nie robię samowolnie).

2. **ZABLOKOWANE (allowlista).** AI dobrowolne (`ai.ts` ~6617–6667, ~7145): stała `AI_MIASTO_CENA_POKOJU_PN` = 615 nadal w użyciu. Próbowałem podpiąć `wearinessPeaceCashPn(wearyLevel)`; działa (tsc 0), ale poza allowlistą — cofnięte. Dowód skutku, gdyby podpiąć: przy L=0,25 cena 4500 PN, jedno miasto 1840 PN × waga 1,5 = 2760 < 4500 → brak oferty miasta; test `diplomacy-city-cession-r3-test` pada 9/72 (asercje z 615 i tur 10/20). Wniosek: DR-2 w praktyce oznacza, że AI nie oddaje pojedynczego miasta przy wczesnej wojnie. Do decyzji właściciela (patrz DECISION-1).

3. **ODRZUCAM w części dowodem / ZABLOKOWANE.** Oferta dobrowolna AI↔AI i limit ≤2 miast leżą w `ai.ts` i `war-weariness.ts` (`maxMiastNaPokoj`). Zmiana limitu to decyzja właściciela (DECISION-2). Mnożnik `offerMultiplier` nie został zmieniony.

4. **PRZYJMUJĘ jako fakt, nie jako błąd.** Gałąź „cena > 0 bez oddawalnego miasta → wojna trwa” w `runWarWearinessTick` (wymuszenie) jest nieosiągalna przy `progWymuszonyPokoj = 1,0`, bo `wearinessPeaceCashPn(1) = 0`. Zostawiam gałąź w kodzie (guard `cashPn > 0 && !forcedPlan.full`), oznaczam komentarzem i w DECISION-3. Test wymagający tej gałęzi nie jest możliwy bez zmiany progu.

5. **CZĘŚCIOWO ODRZUCAM.** Mutant „powrót do progu 3 miast w wymuszeniu” jest czerwony behawioralnie: `diplo-peace-price-decay-test` P7 (łapie `minMiastPoOddaniu` w ścieżce wymuszenia) i P9 („mutant prog 3 miast czerwieni P7” — PASS, wynik 12/0 po zmianach). Mutanty w `main.ts` (AI↔AI) i usunięty guard pokrycia są łapane tylko przez wiring-test (regex po źródle). Pełny harness behawioralny `runAiAiPeaceTick` nie był w zakresie tej rundy — NIE ZMIERZONO jako test behawioralny.

6. **CZĘŚCIOWO ODRZUCAM.** (a) Zmiana asercji 7c (`ai-war-weariness-peace-test`) wynika z decyzji właściciela „bez progu min. 3 miast” (ZAKAZ progu 3 w `minMiastPoOddaniu` w ofercie); asercja „3 miasta → oddaje 2” jest jawnie udokumentowana w teście. (b) Zmiana F1/F7 w `diplo-weariness-forced-peace-test` (cena 0 przy 100% → brak `pay`) wynika z tego, że cena przy L=1 to 0 (DR-1 = A). Gałąź „wymuszony oddaje przy cenie>0” jest nieosiągalna (pkt 4). Luka „bez oddawalnego miasta + cena>0 → brak pokoju” w ścieżce dobrowolnej: istnieje guard `if (ownCities <= 1 && !priceZero) none()` w tick (linia ~355), ale bez dedykowanego testu w tej rundzie — przyjmuję jako lukę testową.

7. **NIE ZMIERZONO / PRZYJMUJĘ zarzut.** `tools/weary40-sim-measure.cjs` nie został zmieniony i nie był uruchomiony po zmianie. Nie mam wyniku przed/po zgodnego z kodem. Kryterium (d) pozostaje NIE ZMIERZONE.

8. **PRZYJMUJĘ.** Tabela (a) została przeniesiona do repo i odtwarza się z kodu gry: `gra/tools/diplo-peace-price-table-a.cjs` (bundle esbuild z `war-weariness.ts`). Wynik (surowy, 1840 PN/miasto, stolica zakazana, cap = liczba miast):

```
L    | miasta | cena PN | oddane | nadplata PN | pokryte PN
0    | 1      | 6000    | 0      | 0           | 0
0    | 2      | 6000    | 1      | 0           | 1840
0    | 3      | 6000    | 2      | 0           | 3680
0    | 5      | 6000    | 4      | 1360        | 7360
0    | 8      | 6000    | 4      | 1360        | 7360
0.25 | 1      | 4500    | 0      | 0           | 0
0.25 | 2      | 4500    | 1      | 0           | 1840
0.25 | 3      | 4500    | 2      | 0           | 3680
0.25 | 5      | 4500    | 3      | 1020        | 5520
0.25 | 8      | 4500    | 3      | 1020        | 5520
0.5  | 1      | 3000    | 0      | 0           | 0
0.5  | 2      | 3000    | 1      | 0           | 1840
0.5  | 3      | 3000    | 2      | 680         | 3680
0.5  | 5      | 3000    | 2      | 680         | 3680
0.5  | 8      | 3000    | 2      | 680         | 3680
0.75 | 1      | 1500    | 0      | 0           | 0
0.75 | 2      | 1500    | 1      | 340         | 1840
0.75 | 3      | 1500    | 1      | 340         | 1840
0.75 | 5      | 1500    | 1      | 340         | 1840
0.75 | 8      | 1500    | 1      | 340         | 1840
1    | 1..8   | 0       | 0      | 0           | 0
```

Uwaga do właściciela: przy L=0 (6000 PN) trzy miasta przegrywającego (5520 PN) NIE pokrywają ceny; potrzebne są 4 miasta poza stolicą (7360 PN, nadpłata 1360). Plan wymuszony zwraca 0 oddanych miast, gdy `full` jest fałszem — wtedy pokój nie zapada.

9. **CZĘŚCIOWO PRZYJMUJĘ.** `docs/encyklopedia/pojecia/zmeczenie-wojna.md` (sekcja „Cena pokoju od gracza”) przepisana na model `cenaStartPn × (1 − L)`; dopisek w „Historia / decyzje” oznacza wpisy o „615 PW” i „x²” jako historyczne. `wikiBundle.json` regenerowany (22 rozdz. + 185 haseł); w bundlu 0 wystąpień „nie obniża ceny pokoju”. ZOSTAJE: komentarze w `ai.ts:6617` i `diplomacy-war-peace-profile.ts:396/419/441` (poza allowlistą); `zmeczenie-wojna.md` l. 122 (martwy parametr — opis zostawiony zgodnie z wpisem).

10. **NIE ZMIERZONO (Chromium).** Nie uruchomiłem żywego Chromium (xvfb) z ceną ≈6000 w turze 1 wojny. `pw-weary-table-browser-test` daje BROWSER FAIL również na bazie 76a1739 (ten sam wynik) — środowisko, nie regresja.

11. **PRZYJMUJĘ — ryzyka rozstrzygnięte w tej rundzie na poziomie danych (nie gry).** (1) Gracz vs 6000 PN: cena pokrywana wyłącznie miastami; złoto/surowce nie wchodzą w ofertę zmęczenia (bez zmiany). (2) Bramki chęci AI (`progChetnosci` 0,5, `ochronaMaxMiast`) — bez zmian; nie testowane w grze. (3) Interakcja z miastami zdobytymi: `cityCap = ownCities` (bez odejmowania zdobytych). (4) Zapisy sprzed zmiany: cena liczona na bieżąco z `warWearinessLevel`, brak migracji zapisu — zgodne z `runWarWearinessTick` (stan pary w zapisie zostaje).

12. **PRZYJMUJĘ częściowo.** Komentarz `diplomacy-proposals.ts` ~1427 (kierunek AI→gracz, „wiersz Z”) przepisany; komentarz ~1436 wyjaśnia usunięcie Z. `war-weariness-params.json` `minMiastPoOddaniu` (martwy) — opisany jako NIEUŻYWANY. Komentarze ~1537–1553 zawierają blok „AKTUALIZACJA” z historią (500/Z) — zostawiam jako historię, nie jako obowiązujący opis. Martwy `przegrywajacy.minMiastPoOddaniu` nadal czytany przez testy wiringowe (`diplo-weariness-forced-peace-wiring-test`, `diplo-weariness-city-table-measure.cjs`) — do osobnego sprzątania.

## Decyzje do właściciela (DECISION_REQUIRED)

- **DECISION-1 (AI dobrowolne, DR-2):** czy poszerzyć allowlistę o `ai.ts` (6617–6667, 7145, `aiPickMiastoDoZadania` ~6661/7179) i podpiąć `wearinessPeaceCashPn`. Skutek: AI przestaje oddawać pojedyncze miasto przy L<~0,6 (9 asercji w `diplomacy-city-cession-r3-test` pada). Alternatywa: zostawić 615 w AI i zmienić tylko panel (to rozjazd z DR-2).
- **DECISION-2 (limit miast w ofercie dobrowolnej):** `maxMiastNaPokoj = 2` i `offerMultiplier` przy L=0 (6000 PN) — czy oferta ma mieć wielomiastowy plan jak wymuszenie (cena 6000 = 4 miasta poza stolicą).
- **DECISION-3 (próg wymuszenia):** `progWymuszonyPokoj = 1,0` sprawia, że cena>0 w wymuszeniu nigdy nie występuje. Czy próg ma być niżej (np. 0,95, wtedy cena ≈300) czy gałąź „wojna trwa” ma być usunięta.
- **DECISION-4 (panel AI→gracz):** czy w gałęzi `aiToPlayerLevel` wyświetlać cenę `wearinessPeaceCashPn` zamiast informacyjnego 615 (pkt 1).

## Testy (surowe wyniki, na kandydacie po zmianach tej rundy)

- `node_modules/.bin/tsc --noEmit`: TSC_EXIT=0
- Bramki referencyjne: `logic-test.cjs` LOGIC OK (213/213); `tech-tree-test.cjs` 20 pass, 0 fail; `research-test.cjs` ALL GREEN; `unit-replace-test.cjs` WSZYSTKIE TESTY ZIELONE (21/21); `combat-test.cjs` All sanity checks passed.
- `diplo-peace-price-decay-test.cjs`: PASS=12 FAIL=0
- `diplo-peace-price-wiring-test.cjs`: PASS=14 FAIL=0
- `diplo-weariness-pw-behavior-test.cjs`: 147 pass / 0 fail
- `diplo-weariness-forced-peace-test.cjs`: PASS=14 FAIL=0
- `diplo-weariness-forced-peace-wiring-test.cjs`: 13 pass / 0 fail
- `diplo-weariness-as-pw-peace-item-test.cjs`: PASS=194 FAIL=0
- `diplo-weariness-c615-both-cities-test.cjs`: PASS=11 FAIL=0
- `diplo-weariness-20-turns-test.cjs`: PASS=31 FAIL=0; `diplo-weariness-city-only-test.cjs`: PASS=30 FAIL=0; `diplo-weariness-display-test.cjs`: 52/0; `diplo-weariness-migration-peak-test.cjs`: PASS=7; `diplo-weariness-pw-row-ui-test.cjs`: 10/0; `diplo-weariness-stages-view-test.cjs`: 22/0; `diplo-peace-balance-accept-test.cjs`: 32/0; `diplo-panel-aiai-both-labels-test.cjs`: 17 OK / 0 FAIL
- `ai-war-weariness-peace-test.cjs`: PASS=101 FAIL=0
- `diplomacy-city-cession-r3-test.cjs`: 72 pass / 0 fail (jak baza)
- `diplo-peace-weaker-seeks-city-only-test.cjs`: 35 pass / 0 fail (jak baza)
- `diplo-peace-gate-mutation-run.cjs`: 15/16 na bazie 76a1739 i na kandydacie (M16 przeżywa na obu — dług bazowy, nie regresja)
- `pw-weary-table-browser-test.cjs`: BROWSER FAIL na bazie i na kandydacie (środowisko)

## Blokady (jawna lista)

1. `ai.ts` poza allowlistą — AI dobrowolne i żądanie miasta nadal na 615 (pkt 2, 3).
2. Gałąź informacyjna AI→gracz nadal pokazuje basePn=615 (pkt 1).
3. Chromium NIE ZMIERZONO (pkt 10).
4. weary40-sim przed/po NIE ZMIERZONO (pkt 7).
5. Mutanty AI↔AI (`main.ts`) — tylko wiring, brak harnessu behawioralnego (pkt 5).
6. Gałąź „cena>0 w wymuszeniu” nieosiągalna przy progu 1,0 (pkt 4, DECISION-3).
7. Dług bazowy: `diplo-peace-gate-mutation-run` 15/16 (M16) — na bazie tak samo.

## RUNDY
3/5 (ten dispatch). Ostatni werdykt Evaluatora: FAIL (12 zarzutów). Decyzja wymagana: DECISION-1 do DECISION-4 przed rundą 4.

NASTĘPNY KROK: orkiestrator — Final Control po decyzjach właściciela lub poszerzeniu allowlisty o `gra/src/game/ai.ts` (i zgodzie na DECISION-1). Bez tego kolejny Operator nie domknie DR-2.

DEPLOY/PUSH: NIE WYKONANO (push tylko przez orkiestratora po Final Control; Operator nie pushuje na main).

## Uwagi dla orkiestratora (poza zakresem, bez tworzenia sesji)

- `gra/node_modules` zainstalowany lokalnie (`npm ci --ignore-scripts`) — nieśledzony, nie commitowany.
- Testy na żywo (`diplomacy-city-cession-live-test.cjs`, uruchomione przypadkiem w pętli) zmodyfikowały pliki PNG w `dyspozycje/autobot/runs/R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1/evidence/` i `R-WEB-PEACE-CITY-CESSION-Q1/evidence/` — przywrócone `git checkout`, nie commitowane.
- Czas wykonania harnessów: `diplo-peace-gate-mutation-run` ~minuty; nie puszczać w pętli z innymi.
- W `/tmp` zostały logi (`/tmp/wf84-*.log`, `/tmp/peace-price-table-a`), do sprzątania przez orkiestratora.

---

## Obrona — runda po ocenie Evaluatora (kandydat 638ff517c, baza 5bafaa3c3)

Kod wynikowy tej rundy: `d9aa131dc` (commit: P9 behawioralny, poprawka dokumentacji zmeczenie-wojna.md + wikiBundle, stan t1 w fixturze Chromium). Raport przed commitem tej rundy nie zmienia zachowania gry.

### Odpowiedzi na zarzuty Evaluatora

**Zarzut 1 (brak żywego Chromium) — PRZYJMUJĘ CZĘŚCIOWO.**
- Uruchomiłem `gra/tools/pw-weary-table-browser-test.cjs` (Playwright, headless, `/usr/bin/chromium`, Vite dev server). Wynik: `BROWSER PASS`, exit 0.
- Panel w Chromium pokazuje cenę z realnego `evaluateProposal`: t11 = 4350 PN, t20 = 3000 PN, t30 = 1500 PN, t40 = 0 PN (zmęczenie 28/50/75/100%). Brak starego wiersza Z.
- Dodałem stan t1 do fixtury (`gra/tools/pw-weary-table-browser-entry.ts`). Chromium pokazuje dla t1 powód: „Pokój i rozejm dostępne po 10 pełnych turach wojny". Czyli cena ~5850–6000 w t1 NIE jest widoczna gracza z powodu istniejącej bramki 10 tur. To jest obserwacja, nie błąd kodu.
- Ograniczenie: to fixture (stan składany w stronie), a nie pełna partia od startu. Żywa gra od t1 do t40 w Chromium: NIE ZMIERZONO.
- Dowód: `$S/chromium-run2.log` (`$S` = scratchpad), linia z `"id":"t1"` i `BROWSER PASS`.

**Zarzut 2 (pomiar weary40-sim: PRZED to proxy, nie realna baza; PRZED wymaga /tmp/basegra) — PRZYJMUJĘ CZĘŚCIOWO (ujawnienie + powtarzalność), ODRZUCAM żądanie realnej ceny bazowej w tej rundzie.**
- Ujawnienie: wariant PRZED w `weary40-sim-measure.cjs` nadal używa `deps.price` = proxy `round(100*(udział-0,5)*2)` (linia ~139). To NIE jest realna cena bazy (w bazie cena siedziała w callerach `main.ts` / `diplomacy-*.ts`, nie w `war-weariness.ts`). Wynik PRZED jest MODELEM, nie pomiarem bazy. NIE ZMIERZONO realnej ceny bazowej.
- Powtarzalność: baza wyeksportowana z `git archive 5bafaa3c335fc1e00a3ab5c68128e98c14808144 gra/src gra/data` do scratchpadu (bez /tmp/basegra), uruchomienie z `--basesrc <scratchpad>/base/gra`.
- Odrzucam wymóg podpięcia realnej ceny bazowej w tej rundzie: wymagałoby zbundlowania logiki callerów bazy (main.ts, diplomacy-proposals.ts) — poza zakresem tego tematu i ryzykowne dla odbioru. Zostawiam jako dług do osobnego tematu.
- Pomiar (zmierzony, `--turns 150 --seeds 3 --variant both`, 17 s):

| ziarno | wariant | elim | wojny@koniec | śr. tur wojny | maxShareEnd (najsilniejsza civ, udział miast) |
|---|---|---|---|---|---|
| 1 | PO | 0 | 0 | 30,4 | 0,733 |
| 2 | PO | 0 | 0 | 31,93 | 0,722 |
| 3 | PO | 0 | 0 | 29 | 0,75 |
| 1 | PRZED (proxy) | 0 | 0 | 25,5 | 0,267 |
| 2 | PRZED (proxy) | 0 | 0 | 25,07 | 0,222 |
| 3 | PRZED (proxy) | 0 | 0 | 19 | 0,25 |

- Wniosek balansowy (NIE zmieniam parametrów): w wariancie PO najsilniejsza civ kończy z 72–75% miast przy eliminacjach 0, a wojny trwają ~30 tur (2–2,5× PRZED-proxy). To zamierzony skutek decyzji właściciela („im dalej w las, tym koszt niższy"), ale koncentracja miast to ryzyko do decyzji właściciela.
- Dowód: `$S/weary40-both-150x3.jsonl`.

**Zarzut 3 (dokumentacja l.58 i wikiBundle: „co najmniej 3 miasta muszą zostać") — PRZYJMUJĘ.**
- Poprawiono `docs/encyklopedia/pojecia/zmeczenie-wojna.md` l.58: usunięto zdanie o progu 3 miast; podano, że chroniona jest wyłącznie stolica, a próg 3 miast został usunięty (kod: `cityCap = ownCities`).
- Regeneracja: `node tools/bundle-wiki-for-game.cjs` → `wikiBundle.json: 22 rozdz. + 185 haseł`. Jedyne trafienie frazy w bundle to nowy tekst, który mówi, że próg został usunięty.

**Zarzut 4 (P9 w diplo-peace-price-decay-test.cjs jest tautologią) — PRZYJMUJĘ.**
- P9 przepisany na test BEHAWIORALNY (`gra/tools/diplo-peace-price-decay-test.cjs`): mutant z `cityCap = ownCities - 3` jest bundlowany i uruchamiany przez `runWarWearinessTick`.
- Scenariusz: 4 miasta przegrywającego (stolica zakazana, miasta po 1840 PN), zmęczenie 0,75 (`warWearinessLevel` z tur 30, strat 0), próg wymuszenia = 0,75, cena ustawiona na ~2500 PN (tak, by pokrywały ją 2 miasta).
- P9a (kod realny): `forced_peace`, oddane ≥2 miasta, stolica zostaje — PASS.
- P9b (mutant): `none` (wojna trwa, brak pokoju) — PASS.
- Uwaga: przy bieżących parametrach (progWymuszonyPokoj = 1,0) gałąź ceny > 0 w wymuszeniu jest nieosiągalna, więc test musi ustawić próg/cenę w swoim parametrze (`P` klonowane z JSON, nie zmienia pliku danych).
- `node tools/diplo-peace-price-decay-test.cjs` → PASS=13 FAIL=0, exit 0.

**Zarzut 5 (martwe parametry: `czlowiek.*` w war-weariness-params.json, `cenaPokoju.turyBezOgraniczenAi`) — ODRZUCAM usuwanie; zostawiam jako jawnie oznaczony dług.**
- Dowód: `czlowiek` jest w typie `WarWearinessParams` (`war-weariness.ts:49`) i w JSON; `_opis` oraz `_pozycjaPW` mówią wprost „nieużywane w kodzie". Usunięcie zmienia schemat danych, a `json-descriptions-sync-test` (19/0) i wiki opisują te pola. Zakres tematu tego nie obejmuje.
- Dowód niezgodności nie ma: `docs/encyklopedia/pojecia/rozejm-pokoj.md` l.101 też oznacza `turyBezOgraniczenAi` jako nieużywany.

### Testy tej rundy (surowe wyniki)
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0 (po `npm ci --ignore-scripts`).
- `node tools/diplo-peace-price-decay-test.cjs` → PASS=13 FAIL=0, exit 0.
- `node tools/diplo-peace-price-wiring-test.cjs` → PASS=14 FAIL=0, exit 0.
- `node tools/json-descriptions-sync-test.cjs` → 19 pass / 0 fail, exit 0.
- `node tools/pw-weary-table-browser-test.cjs <scratchpad>` → BROWSER PASS, exit 0 (Chromium headless).
- `node tools/weary40-sim-measure.cjs --turns 150 --seeds 3 --variant both --basesrc <scratchpad>/base/gra` → tabela powyżej.
- NIE uruchamiałem ponownie: pełnego zestawu logic/tech-tree/research/unit-replace/combat z poprzedniej rundy (kod gry nie zmienił się w tej rundzie poza testami, dokumentacją i fixturą tool).

### Zmiany tej rundy (allowlista)
- `docs/encyklopedia/pojecia/zmeczenie-wojna.md` (l.58)
- `gra/src/data/wikiBundle.json` (regeneracja)
- `gra/tools/diplo-peace-price-decay-test.cjs` (P9 behawioralny)
- `gra/tools/pw-weary-table-browser-entry.ts` (stan t1 w fixturze, tylko narzędzie)
- `dyspozycje/autobot/runs/R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1/30-obrona-claude.md` (ten raport)

### Blokady (jawnie)
- NIE ZMIERZONO: żywa pełna gra od t1 w Chromium (tylko fixture).
- NIE ZMIERZONO: realna cena bazowa w wariancie PRZED (proxy; dług do osobnego tematu).
- DECYZJA WŁAŚCICIELA: koncentracja miast 72–75% w PO (balans), nie zmieniam sam.

### Uwagi dla orkiestratora
- Ścieżka `/tmp` nie była używana do wyników; scratchpad to `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad`.
- Brak nowych sesji, zadań ani harmonogramów (zakaz z dispatchu zachowany).

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1
GOAL: jedna cena pokoju cenaStartPn×(1−L) na wszystkich ścieżkach; wymuszony pokój bez progu 3 miast; dokumentacja i testy zgodne z kodem
ZMIANY-COMMIT: d9aa131dc (docs zmeczenie-wojna.md, wikiBundle.json, diplo-peace-price-decay-test.cjs P9, pw-weary-table-browser-entry.ts t1); raport 30-obrona-claude.md (commit osobny)
TESTY: tsc 0; price-decay 13/0; price-wiring 14/0; json-sync 19/0; Chromium BROWSER PASS; weary40 150×3 PO maxShareEnd 0,733/0,722/0,75 elim 0; PRZED (proxy) 0,267/0,222/0,25 elim 0
BLOKADY: NIE ZMIERZONO żywa gra w Chromium od t1; NIE ZMIERZONO realna cena bazowa PRZED; balans 72–75% w PO do decyzji właściciela
RUNDY: obrona po ocenie Evaluatora (kandydat 638ff517c), ten sam temat
NASTĘPNY KROK: ponowna ocena Evaluatora na d9aa131dc; decyzja właściciela o koncentracji miast w PO i o realnej bazie PRZED
DEPLOY/PUSH: NIE WYKONANO
