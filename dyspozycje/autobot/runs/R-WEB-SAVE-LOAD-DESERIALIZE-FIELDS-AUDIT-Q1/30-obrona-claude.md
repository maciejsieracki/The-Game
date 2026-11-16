# R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1 — raport Obrony Operatora (runda 1/5, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt i narzędzie pomiarowe; kod gry `gra/src` NIE zmieniany)
TEMAT: R-WEB-SAVE-LOAD-DESERIALIZE-FIELDS-AUDIT-Q1 (#434)
GOAL: obrona kandydata 5d22f4b23bd1e66ca54f65677d4ab4fa66a95320 wobec 5 zarzutów Evaluatora (cb45ec75f); poprawki narzędzia i raportu tam, gdzie zarzut był trafny; odrzucenia z dowodem.
ZMIANY-COMMIT: poprawka commitowana w tym temacie (ścieżki allowlisty): `gra/tools/save-load-deserialize-fields-audit.cjs` (zmodyfikowany), ten raport `30-obrona-claude.md`, nowe dowody `evidence/audit-2026-11-16T04-57-48-*` ... `04-58-02-*` oraz pary `raw-A/raw-B` dopisane przez przebiegi trybu zrzutów. SHA: patrz pole sha w StructuredOutput. Brak zmian w `gra/src`, `gra/data`, WERSJE.md, manifeście.
BAZA: 5d22f4b23 (kandydat). Dispatch `00-dispatch.md` czytano z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (w origin/main go nie ma), wraz z DODATKIEM.

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — `playerEverOwnedCityByOwner` — PRZYJMUJĘ
- Stwierdzenie z mojego raportu („pole NIE jest częścią SaveGame, nie ma go w save.ts, poza zakresem”) jest BŁĘDNE. Pole JEST w zapisie, w `meta`.
- Dowód: `gra/src/main.ts:39931` — `...(playerEverOwnedCityByOwner.size > 0 ? { playerEverOwnedCityByOwner: Array.from(...) } : {})`. Odczyt surowego zapisu A: `meta.playerEverOwnedCityByOwner` = `[0]` (jeden element, właściciel 0 = człowiek).
- W tabeli narzędzia: `a OK meta.playerEverOwnedCityByOwner`, `b OK meta.playerEverOwnedCityByOwner` (audit-2026-11-16T04-58-01-758Z.json).
- Poprawne ustalenia: pole serializowane WARUNKOWO (tylko gdy zbiór niepusty) — czyli w scenariuszu z defektu #433 (0 miast gracza) klucz w ogóle nie istnieje w zapisie. Ta ścieżka NIE jest testowana (wymaga stanu live z 0 miast gracza): NIE ZMIERZONO. Narzędzie tego przypadku nie obejmuje, bo nie ma w zapisie czego porównać.
- Mój błąd był w wnioskowaniu „narzędzie go nie widzi = nie ma go w zapisie”. Narzędzie audytuje meta, więc widzi to pole; poprawna treść: pole przechodzi serializację, deserializację i restore dla wartości niepustej.

### Zarzut 2 — niedomknięte pola z dispatchu (#424/#433) — PRZYJMUJĘ (częściowo: naming + status)
- `nnsAiOverrides`: NIE występuje w zapisie. Grep `gra/src`: jedyne wystąpienia to lokalna `new Map` w `gra/src/main.ts:7543` (oraz użycia w 7573–7718). Brak klucza w `meta` (lista kluczy meta z raw-A nie zawiera `nnsAiOverrides`). Werdykt: NIE_W_ZAPISIE (stan lokalny main.ts, poza `deserializeGame`). Poza zakresem tego audytu; kandydat do osobnej decyzji orkiestratora, jeśli ma być odtwarzany.
- Nazwy z dispatchu (`orderMultMap`, `growthMultMap`, `orderValueMap`) nie istnieją w zapisie. Rzeczywiste klucze: `meta.orderMultByCity`, `meta.orderGrowthMultByCity`, `meta.orderValueByCity`. Dowód (raw-A, 1 element `city0` w każdym): w tabeli narzędzia `a OK` i `b OK` dla wszystkich trzech.
- Odpowiedź wprost: 3 z 5 pól z dispatchu (orderMult*, orderValue*) są w zapisie i przechodzą; 1 (`playerEverOwnedCityByOwner`) przechodzi dla niepustej wartości (zarzut 1); 1 (`nnsAiOverrides`) nie jest w zapisie.

### Zarzut 3 — pokrycie pomiaru (puste tablice, nieobecne klucze) — PRZYJMUJĘ (narracja zawężona + nowe rozróżnienie w narzędziu)
- Zmiana w narzędziu: nowy werdykt `OK_PUSTA` dla zgodnej pustej tablicy (nie jest już zlepiony z `OK`). Pusta tablica po restore wygląda identycznie jak zgubiona — stąd oddzielny werdykt.
- Zmiana w narzędziu: nowy werdykt `NIEPRZETESTOWANE_BRAK_W_PROBCE` dla kluczy najwyższego poziomu zwracanych przez `deserializeGame`, których w zapisie A nie ma. Wynik: `autoMarch`, `plannedMarches`, `recruitGeneralId`, `rallyPoints` (4 wiersze, właśnie te z zarzutu). Te pola NIE są testowane tą próbką.
- Liczby (raw-A, 282 liście; surowe wyjście narzędzia `audit-2026-11-16T04-58-01-758Z.json`):
  - faza (a): OK 193, OK_PUSTA 89 (≈32% liści to puste tablice), NIEPRZETESTOWANE_BRAK_W_PROBCE 4 (klucze najwyższego poziomu, poza liczbą 282);
  - faza (b): OK 191, OK_PUSTA 86, ZMIENIONE_PO_RESTORE 4, EFEMERYCZNE 1.
- Nadal NIE rozwiązane (przyjęte jako ograniczenie, NIE ZMIERZONO): `cities`, `units`, `mapSnapshot` są liśćmi (tablice obiektów nie są rozwijane); pola wewnątrz miast/jednostek nie są porównywane pojedynczo. Rozwinięcie tablic obiektów to osobna zmiana narzędzia (poza zakresem tej poprawki).
- Wniosek ZAWĘŻONY: „brak zgubionych pól” dotyczy wyłącznie 282 liści tej jednej próbki (1 miasto, seed 4242, 2 tury), z 4 kluczami najwyższego poziomu nieprzetestowanymi i 89 liśćmi pustymi. NIE jest to dowód dla `deserializeGame` w ogóle.

### Zarzut 4 — faza (b) jako proxy; 4 pozycje ZMIENIONE_PO_RESTORE bez werdyktu — PRZYJMUJĘ (klasyfikacja w raporcie; faza (b) pozostaje proxy, jak uczciwie zadeklarowano)
Werdykty w słownictwie dispatchu (OK / GUBIONE / REGENEROWANE z innych danych / NIEISTOTNE) dla 4 pozycji `ZMIENIONE_PO_RESTORE` (narzędzie używa etykiety ZMIENIONE_PO_RESTORE):

| pozycja (raw-A → po restore) | werdykt | wpływ na tick/UI | uwagi |
|---|---|---|---|
| `cities` (1 miasto): `podzialPracy` null → `{"procentBudynki":50}` | REGENEROWANE (wartość domyślna dopisana przy restore) | NIE ZMIERZONO | źródło domyślnej wartości: `gra/src/game/cities.ts:432` (`procentBudynki: 50`); powiązane z #424 (R-WEB-SAVE-LOAD-CITY-WORK-SPLIT-ROUNDTRIP-Q1), który już istnieje. Nie zakładam nowego kandydata. |
| `meta.bronzeEraEnterTurnByOwner`: `[]` → `[[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[0,3]]` | REGENEROWANE z innych danych (źródło nie zidentyfikowane) | NIE ZMIERZONO | runtime ustawia mapę przy wejściu w epokę: `gra/src/main.ts:2605`, `:2648`; konsument wymuszonej wojny: `gra/src/game/forced-war-bronze.ts:80`. Ścieżka restore, która ją wypełnia, NIE zidentyfikowana. |
| `meta.ironEraEnterTurnByOwner`: `[]` → j.w. (tura 3 dla wszystkich) | REGENEROWANE z innych danych | NIE ZMIERZONO | jak wyżej; konsument `gra/src/game/forced-war-iron.ts:115`. |
| `meta.diplomaticContactEstablished`: `[]` → `[[0,[]]]` | NIEISTOTNE (semantycznie pusty zbiór; dodany pusty wpis właściciela 0) | NIE ZMIERZONO | brak kontaktów w obu wersjach. |

- Kandydaci R-WEB-* NIE zakładam: żadna z pozycji nie jest GUBIONA. Pozycje 2–3 wymagają osobnego pomiaru (czy runtime rekonstruuje je z bieżącej tury, czy zapis powinien je zachować) — zostawiam orkiestratorowi jako decyzję (patrz UWAGI).
- Uwaga o etykiecie: w tabeli narzędzia czwarty wiersz `ZMIENIONE_PO_RESTORE` ma pole `cities` (nie `cities.podzialPracy`), bo tablica miast jest liściem (zarzut 3).

### Zarzut 5 — usterki narzędzia (observable, zakres mutacji) — PRZYJMUJĘ (naprawione w commicie)
Poprawki w `gra/tools/save-load-deserialize-fields-audit.cjs`:
1. `observable` była prawie zawsze prawdziwa (`rawALedgerEntries !== null || …`). Teraz: `rawAText.includes('"<pole>"')` — pole musi być w zapisie A, inaczej kontrola czułości kończy się exit 1.
2. Mutacja obejmuje każde jednoliniowe przypisanie `<pole>: …obj2.<pole>…` w `deserializeGame` (wcześniej tylko `Array.isArray(obj2.<pole>)`). Teraz mutowalne są też `cityProd`, `autoMarch`, `rallyPoints` itd.
3. Wykrywanie dla pól obiektowych: porównanie po prefiksie (`cityProd.*` liczy się dla `cityProd`). Wcześniej `cityProd` nie było wykrywane mimo mutacji (exit 1 w pierwszej wersji tej poprawki — złapane przy weryfikacji i naprawione).
- Pozostałe ograniczenia (zadeklarowane w kodzie komentarzem, NIE ZMIERZONO): `meta` przypisywane całością (`meta: obj.meta`, nie `obj2`) — nie jest mutowalne tym wzorcem; pola złożone wieloliniowo (np. `recruitGeneralId`) — mutacja daje błąd składni i exit 1 (konserwatywnie, nie zielono).

## DOWODY ZMIAN (wiersze tabeli, surowe wyjście)
- Oryginał (`--raw-a/--raw-b`, raw-A/B z przebiegu live Evaluatora/Operatora): `ZIELONY`, exit 0. Liczniki: `{"a:OK":193,"a:OK_PUSTA":89,"b:OK":191,"b:ZMIENIONE_PO_RESTORE":4,"b:OK_PUSTA":86,"b:EFEMERYCZNE":1,"a:NIEPRZETESTOWANE_BRAK_W_PROBCE":4}` (`audit-2026-11-16T04-58-01-758Z.json`).
- Mutacja `resourceLedgerHistory`: `CZERWONY (1 pol)`, `wykryte=true, obecne w zapisie A=true`, exit 0 (oczekiwane: zielony oryginał + czerwony mutant) — `audit-2026-11-16T04-57-48-637Z.json`.
- Mutacja `cityProd` (pole obiektowe): `CZERWONY`, `wykryte=true, obecne w zapisie A=true`, exit 0 — `audit-2026-11-16T04-57-48-904Z.json`.
- Mutacja `autoMarch` (pole nieobecne w zapisie A): `wykryte=false, obecne w zapisie A=false`, exit 1 — `audit-2026-11-16T04-57-49-291Z.json`. Konserwatywne zachowanie: kontrola czułości nie może przejść dla pola, którego próbka nie zawiera.

## TESTY (liczby z surowego wyjścia, uruchomione w tym temacie na wt `5d22f4b23` + poprawka)
- `npx tsc --noEmit` (w `gra/`, po `npm ci` 71 pakietów): EXIT 0, 0 linii wyjścia.
- `node tools/logic-test.cjs`: EXIT 0, `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs`: EXIT 0, `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs`: EXIT 0, `ALL GREEN`.
- `node tools/unit-replace-test.cjs`: EXIT 0, `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs`: EXIT 0, `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`
- `git diff --check`: EXIT 0, pusto.
- NIE ZMIERZONO w tym temacie: nowy przebieg live (Chromium + build vite) — dowody live pochodzą z przebiegu Operatora (raw-A/B), nie były regenerowane.

## BLOKADY
brak (żadna bramka czerwona). Ograniczenia pomiaru, jawnie: jedna próbka live; tablice-liście; faza (b) jako proxy; pole `playerEverOwnedCityByOwner` dla 0 miast gracza NIE testowane; wpływ pozycji ZMIENIONE_PO_RESTORE NIE ZMIERZONO.

## RUNDY
1/5 (runda obrony Operatora, odpowiedź na zarzuty Evaluatora cb45ec75f).

## UWAGI-DLA-ORKIESTRATORA
- Zakres poprawki: wyłącznie narzędzie i raport; kod gry nietknięty. Żadnych sesji, zadań, harmonogramów ani subagentów nie tworzono.
- Decyzja do orkiestratora (poza tym tematem): czy otworzyć (a) pomiar wpływu `bronze/ironEraEnterTurnByOwner` po restore (czy runtime rekonstruuje je z bieżącej tury), (b) test dla scenariusza 0 miast gracza (#433) na żywym stanie, (c) rozwinięcie tablic obiektów w narzędziu (`cities`, `units`), (d) decyzję o `nnsAiOverrides` (stan lokalny main.ts:7543 — czy ma być w zapisie).
- Odnotowano dla orkiestratora: `gra/node_modules` zainstalowano przez `npm ci` w worktree tego tematu i usuwam po commicie (dysk).

DEPLOY/PUSH: NIE WYKONANO
