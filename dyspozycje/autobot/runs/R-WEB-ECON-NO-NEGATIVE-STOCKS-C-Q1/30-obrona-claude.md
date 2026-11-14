# R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 — raport Obrony (runda 3, Operator Sonnet, obrona Haiku)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (podtemat C: równoważenie AI + runner headless)
GOAL: od tury 11 skarbiec i spichlerz każdego AI >= 0 po każdej turze; równoważenie przed końcem tury, bez eliminacji cywilizacji.
BAZA: kandydat 233f2c4cb (checkout detached, worktree wf_e1d87e65-e7f-3). Kod NIE zmieniany w tej rundzie obrony.
Środowisko: `npm ci --ignore-scripts` w gra/ (rc=0); bundle budowany poza repo (`vite build --outDir <scratchpad>`).

## ZMIANY-COMMIT
- Kod gry: brak zmian (żaden zarzut nie wymagał poprawki kodu; wyjątek: poniżej dowód mutacji wykonany na tymczasowej zmianie `src/main.ts` linia 39738, cofniętej `git checkout`, drzewo czyste).
- Commit tylko tego raportu (`git add dyspozycje/.../30-obrona-claude.md`). SHA w polu `sha` wyniku.

## TESTY (surowe wyjścia, odtworzone przez Obronę na 233f2c4cb)
- `npx tsc --noEmit` (gra/): rc=0, bez komunikatów.
- `node tools/no-negative-stocks-ai-test.cjs`: 8 passed, 0 failed
- `node tools/no-negative-stocks-c2-test.cjs`: 43 passed, 0 failed
- `node tools/no-negative-stocks-projection-test.cjs`: 49 passed, 0 failed
- `node tools/no-negative-stocks-endturn-test.cjs`: 19 passed, 0 failed
- `node tools/no-negative-stocks-c3-turn-test.cjs --dist <bundle bazowy>` (realny Chromium, realne „Zakończ turę”): `16 passed, 0 failed` (czas 51 s). ON: AI oid 1, tura 13, skarbiec po turze 16.200000000000003, bank.glod=false, akcje 41, pokryte=true. OFF: oid 4, tura 14, skarbiec -163, spichlerz surowy -152, glod=true.
- MUTACJA REALNA (zarzut 3): w `src/main.ts` linia 39738 zamieniono `nnsAiPreTickBalance({` na `void ({` (usunięcie wywołania równoważenia z pętli tury AI), przebudowa bundla i ponowny przebieg c3-turn-test: `10 passed, 6 failed`. Czerwone asercje: „ON: liczba jednostek ownera zmalała po turze (44 -> 44)”, „ON: skarbiec po bankowaniu ticku >= 0 (jest -148)”, „ON: skarbiec po całej turze >= 0 (jest -148)”, „ON: kary deficytu złota nie weszły (licznik tur deficytu = 1)” i dwie pokrewne. Test wykrywa usunięcie wywołania w realnej grze.
- Pomiar headless 15×3×150 NIE był powtarzany przez Obronę (ok. 1 h na komórkę). Dane źródłowe: `pomiar-r3/` (cytowane liczby zweryfikowane przez Evaluatora; Obrona nie dokłada nowych danych pomiarowych).

## ODPOWIEDZI NA ZARZUTY EVALUATORA (09ab6b4a5)

### Zarzut 1 — kryterium (a) niespełnione dosłownie (450/6922 wierszy < 0 w turach 11–30)
STATUS: PRZYJMUJĘ (fakt), nie da się zamknąć w tej rundzie bez decyzji właściciela.
- Liczby potwierdzone: 445 wierszy to dług z tur wolnych 1–10 (AI nie równoważy przed turą 11 — reguła produktowa), 5 to „nowy minus”. Od tury 31 zero naruszeń we wszystkich trzech komórkach ON.
- Zamknięcie literalne wymaga zmiany reguły produktowej (AI równoważy od tury 1, opcja B z UWAG-DLA-ORKIESTRATORA nr 1) — to decyzja ABC właściciela (zasada 3 CLAUDE.md). Obrona jej nie podejmuje.
- „Nowy minus” (fenicjanie T14 ziarno 11 przy skarbcu +322; grecy T15): Obrona NIE re-mierzyła, ale claim „brak dostępnych dźwigni” jest zgodny z projektem dźwigni: `buildAiLevers` (no-negative-stocks.ts ok. l.216–238) wpuszcza do planu tylko podatek skarbca, suwak żywności, wstrzymania i jednostki WSPARCIA; jednostki obronne dostają `eliminujeCywilizacje: true`, a `planAiBalance` nigdy po nich nie sięga (wymóg dispatchu: nigdy ostatnie jednostki obronne). Racje (żywność) są już na 0. Zatem przy głodzie wojska z samych jednostek obronnych dźwigni legalnie nie ma. To jest ograniczenie wynikające z dispatchu, nie błąd implementacji. Weryfikacja konkretnego przypadku T14/T15 = NIE_ZMIERZONO.
- Wniosek: wynik „SPEŁNIONE WARUNKOWO + ABC” pozostaje; decyzja ABC do właściciela (opcje A/B/C z UWAG nr 1 r3 operatora).

### Zarzut 2 — zakres pomiaru (ziarno 22 pominięte; „15 cywilizacji” = civTypesCount 15)
STATUS: PRZYJMUJĘ jako odstępstwo od litery dispatchu (uwaga, bez zmiany kodu).
- Dispatch: „15 cywilizacji AI × 3 ziarna”. Raport: 13 pełnych AI + 28 państw-miast (ownersMajor=13, ownersCityState=28 w cell-*.json). Obrona potwierdza, że literalne 15 pełnych AI nie zostało osiągnięte; w scenariuszu c3 log podaje „typów cywilizacji AI w świecie: 14; właścicieli AI: 41” (inny ziarno, seed 11), co też nie jest 15 pełnych AI.
- Ziarno 22: zawieszenie strony po założeniu pierwszego miasta — NIE_ZMIERZONO przez Obronę; przekazane jako UWAGA (osobny temat R-WEB, nie ten).

### Zarzut 3 — dowód mutacyjny słaby (c2 = replace w pamięci)
STATUS: PRZYJMUJĘ (zarzut słuszny w części c2), dowód uzupełniony.
- c2-test wiązanie statyczne pozostaje jako test regex (nie jest dowodem mutacyjnym; nie zmieniam jego nazwy, ale nie powołuję się na nią jako na mutację).
- Realną mutację wykonano (patrz TESTY): usunięcie wywołania z main.ts → c3-turn-test czerwieni 6 asercji. To zamyka luka „NIE_ZMIERZONO” z zarzutu.
- Różnica ON/OFF w c3 dotyczy różnych ownerów (oid 1 vs 4) i tur (13 vs 14): PRZYJMUJĘ jako ograniczenie porównania (ten sam scenariusz, nie ten sam stan); mutacja „usunięcie wywołania” porównuje tę samą sytuację (ta sama konfiguracja scenariusza) i daje tę samą klasę wyników.

### Zarzut 4 — allowlista main.ts przekroczona (hak `window.__nnsMeasureDebug`, usunięty blok bankowania AI)
STATUS: PRZYJMUJĘ, że poza literalną allowlistą; ODRZUCAM zarzut, że hak jest niedozwolonym wzorcem.
- Fakt: w `main.ts` jest 47 odwołań do `civTest` (bramka `?civTest=1`), a hooki testowe tego typu są w repo od dawna (np. `window.__civTest`, ok. l.30232; `R-WEB-*-LIVE-HOOKS`). Hak pomiarowy `__nnsMeasureDebug` jest tą samą klasą i powstaje wyłącznie przy `?civTest=1` (uzasadnienie: runner headless wymaga wywołania realnej tury i stanu). Bez niego pomiar 15×3×150 nie działa.
- Usunięcie starego bloku bankowania AI (po ticku) jest konieczne: równoważenie ma działać PRZED tickiem (zarzut FC r2 nr 1); stary blok zostałby przy tym martwy.
- Decyzja o akceptacji poza literalną allowlistą należy do FC/orkiestratora (zapisane w UWAGI-DLA-ORKIESTRATORA).

### Zarzut 5 — niedeterminizm pomiaru (wznowienia z quickSave, #373)
STATUS: PRZYJMUJĘ jako ograniczenie. Wnioski dotyczą własności „>= 0”, nie trajektorii. Znane zadanie #373 (determinizm wznowień). Brak zmian kodu. Bierny gracz w pomiarze (dosypywane złoto, odrodzenia 1/1/3) — dotyczy scenariusza pomiarowego, nie gry aktywnego gracza; zaznaczone.

### Zarzut 6 — pole `wstrzymania?` w `NnsAiLeverInput` jako martwe
STATUS: ODRZUCAM (dowód niżej).
- Pole jest opcjonalnym wejściem czystej funkcji `buildAiLevers` (no-negative-stocks.ts l.199, l.231 `for (const w of input.wstrzymania ?? [])`) i jest świadomie testowane w `no-negative-stocks-ai-test.cjs` (linie 46, 62, 76, 87, 100 — 5 użyć: zysk dodatni, zerowy, NaN, pusta lista, kolejność).
- Nie jest atrapą: `grep -n "wstrzymania" gra/src/main.ts` nie zwraca żadnego `wstrzymania:` w wywołaniu (produkcja nie przekazuje pozycji; wstrzymanie zakupów jest flagą per tura `aiNnsHoldOwners`, nie dźwignią salda — deklarowane w raporcie operatora). Usunięcie pola złamałoby test ai-test bez zmiany zachowania gry.
- Zarzut o atrapach `podatekSkarbiec: 0` / `wstrzymania: []` w main.ts: potwierdzony jako nieobecny (c2-test l.153: `!/podatekSkarbiec: 0/` i `!/wstrzymania: \[\]/` na main.ts — PASS).

### Zarzut 7 — wydajność tylko headless i do T90
STATUS: ODRZUCAM jako defekt (wymóg dispatchu spełniony), zapisuję ograniczenie.
- Dispatch, pkt 4: „zmierz koszt (ms/turę) w runnerze” — zmierzono: avgPreTickMs 394,97 / 374,35 / 382,54; maxPreTickMs 936,1 / 750,5 / 750,6 (cell-on-*.json, zgodnie z zarzutem Evaluatora).
- Projekcja raz na właściciela na turę (zgodnie z dispatchem); koszt nie jest O(owners²) w tym miejscu.
- Po T90 NIE_ZMIERZONO (zapisane jako ograniczenie, nie jako błąd kodu).

## BRAK ZMIAN KODU W TEJ RUNDZIE — uzasadnienie
Żaden zarzut nie wskazał błędu implementacyjnego, który da się naprawić bez decyzji właściciela (zarzut 1) lub bez wyjścia poza ograniczenia dispatchu (zarzut 4/zarzut 1). Zmiana kodu „dla zapełnienia” byłaby nieuczciwa wobec zasady 3 (produkt) i kosztownego pomiaru.

## UWAGI-DLA-ORKIESTRATORA
1. DECYZJA ABC (właściciel): dług z tur 1–10 (445/450) — opcja A (bez zmian), B (AI równoważy od tury 1, rekomendacja operatora: stała `NNS_AI_BALANCE_TURN_MIN`), C (wyzerowanie długu AI na T11 — niezalecane). Bez tej decyzji kryterium (a) literalnie NIE jest spełnione.
2. FC/orkiestrator: akceptacja haka `__nnsMeasureDebug` poza literalną allowlistą (zarzut 4) — precedens: 47 odwołań `civTest` w main.ts.
3. Ziarno 22: strona przestaje odpowiadać po założeniu pierwszego miasta — osobny temat R-WEB (NIE_ZMIERZONO przyczyna).
4. Bierny gracz w runnerze bywa podbijany (odrodzenia) i blokada „Zakończ turę” gracza zatrzymuje turę przy prognozie spichlerza < 0 — runner wykonuje ruch naprawczy. Do sprawdzenia w temacie B (poza zakresem C).
5. `playerEverOwnedCityByOwner` nie jest w zapisie gry — po wczytaniu i utracie ostatniego miasta gracz nie jest odradzany (poza zakresem C, do osobnego tematu).
6. Czas tury po T90 rośnie do 50–60 s (R-WEB-PERF-LATE-GAME, nie równoważenie).

RUNDY: 3/5 (runda Obrony r3; decyzja ABC wymagana przed FC)
NASTĘPNY KROK: Final Control (Sonnet) — rozstrzygnąć zarzut 4 (allowlista) i przyjąć/odrzucić status warunkowy kryterium (a) wobec decyzji ABC właściciela.
DEPLOY/PUSH: NIE WYKONANO
