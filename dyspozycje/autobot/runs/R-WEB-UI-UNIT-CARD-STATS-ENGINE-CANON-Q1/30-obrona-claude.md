# R-WEB-UI-UNIT-CARD-STATS-ENGINE-CANON-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-UNIT-CARD-STATS-ENGINE-CANON-Q1
GOAL: karty, tooltipy i panel miasta pokazują bojowe statystyki jednostki z tych samych pól co silnik (`combatUnitFromDef`), a nie z kolumn PL w `units.json`. Zmiana tylko wyświetlania (ABC nr 8 = A).
BAZA: e96196fce (kandydat Operatora r1, parent b3e74f414 = origin/main). Obrona: HAIKU 5.5.
ZMIANY-COMMIT: patrz sekcja „Commit obrony" na końcu (SHA podany w polu `sha` odpowiedzi).

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 — canon-test częściowo tautologiczny, regex może ominąć destrukturyzację
Odpowiedź: PRZYJMUJĘ (poprawka + dowód).
- Część 1 testu (75/75) z założenia sprawdza helper `unitEngineStats` względem `combatUnitFromDef`. To świadomie: helper ma być jedynym mapowaniem. Dowód, że adapter używa helpera, to migracja (`unit-detail-card-entitycard-migration-test.cjs`, 40/0), która uruchamia adapter i porównuje wiersze karty z `unit.meleeAttack` / `unit.meleeDefence` / `unit.weaponDamage`.
- Próba zbundlowania `unitAdapter.ts` do węzła w celu wykonania adaptera na 75 jednostkach NIE powiodła się: `import.meta.glob is not a function` (zależność od Vite w łańcuchu importów). Nie wprowadzam tego do testu, bo wymagałby stubowania Vite. NIE_ZMIERZONO w pełnym sensie „adapter na 75 jednostkach w węźle".
- Poprawka wykonana: wzorzec PL w teście rozszerzony z wąskiego `unit.`/`u.` na: zapis z kropką przy dowolnym obiekcie (`.Atak`), zapis z nawiasami (`['Atak dystansowy']`) i destrukturyzację (`const { Atak } = unit`). Zweryfikowane:
  - `node -e` na plikach z `b3e74f414` (kopie w scratchpad): `base-unitAdapter.ts` = 7 trafień (linie 239,240,241,242,243,252,253), `base-unitInfoCard.ts` = 6 (291,292,293,296,297,298), `base-cityPanel.ts` = 7 (8208,8209,8210,8211,8212,8214,8215), zdanie `const { Atak, Obrona } = unit;` = flagged true.
  - Na kandydacie po poprawce: 0 trafień w trzech plikach UI (grep z tym samym wzorcem, pusty wynik).
- Test po poprawce: `node tools/unit-card-stats-engine-canon-test.cjs` → exit 0, `PASS unit-card-stats-engine-canon-test`.

### Zarzut 2 — „czerwony na bazie" to inspekcja linii, nie przebieg
Odpowiedź: PRZYJMUJĘ (dowód dołączony).
- Przebieg testu na bazie nadal kończy się błędem bundlingu (brak `unitEngineStats.ts`), co jest zgodne z tym, co Evaluator opisał.
- Semantyczny dowód czerwieni na bazie: mutacja `unitAdapter.ts` do bazy → migracja 38/2 (wg Evaluatora, nie powtarzałem), a nowy regex na plikach bazowych daje trafienia (zarzut 1). Oba dowody to przebiegi, nie inspekcja.

### Zarzut 3 — zmiana etykiety „Obrażenia broni" (Uderzenie → weaponDamage) i niespójność „Bonus szarży"
Odpowiedź: ODRZUCAM zmianę kodu; zostawiam jako decyzję do potwierdzenia przez orkiestratora.
- Zmiana „Uderzenie → weaponDamage" wynika z ABC nr 8 = A (dispatch, nagłówek: „statystyki SILNIKA są kanoniczne"). Wartości różnią się dla 67 z 75 jednostek; to zamierzony skutek, nie błąd. Wymaga świadomej akceptacji orkiestratora (DECISION_REQUIRED w UWAGACH).
- „Bonus szarży": wiersz `unitAdapter.ts:257` (`extra(unit,'Bonus szarży')`) i `cityPanel.ts:8216` (`unitExtraField(u,'Bonus szarży')`) NIE zmieniły się w diffie r1 (linie identyczne z bazą). Kolumna `Bonus szarży` nie istnieje w `units.json` (`grep -c '"Bonus szarży"' data/units.json` = 0), więc wiersz jest zawsze pusty. Test `unit-detail-card-entitycard-migration-test.cjs` ma to jako założenie i asercje (linie 99–105, 152–153: „Bonus szarży … pominięty jako pusty wiersz"). Silnik używa `chargeBonus` (`combat.ts:219`: `unitRowStat(def,'chargeBonus','Uderzenie',0)`, 50 jednostek ma jawne `chargeBonus`). Karta nie pokazuje więc `chargeBonus`. To jest osobny, istniejący brak (nie wprowadzony przez ten temat) i jego naprawa zmienia udokumentowane asercje oraz wymaga decyzji, czy karta ma pokazywać `chargeBonus` z fallbackiem `Uderzenie` (zmiana zakresu). Nie wdrażam bez decyzji — patrz UWAGI-1.

### Zarzut 4 — brak weryfikacji live w Chromium
Odpowiedź: NIE_ZMIERZONO (z powodem, dopuszczalne wg kryterium 4 dispatchu).
- Powód: w tej rundzie nie uruchomiono builda vite do `/tmp` ani nie wykonano zrzutu karty Wojownika. Przeglądarka `/usr/bin/chromium` jest dostępna, ale worktree nie miała `node_modules` (dołączony symlink z sąsiedniego worktree tylko na czas testów, nie w commicie). Zrzut karty wymaga nawigacji po grze do widoku jednostki — poza czasem tej rundy.
- Oczekiwane wartości do sprawdzenia przez FC na żywo: Wojownik Atak 4 / Obrona 4 / HP 22 / Pancerz 2 (wartości z `combatUnitFromDef`, potwierdzone testem: `atak=4 obrona=4 hp=22 pancerz=2`).

### Zarzut 5 — zakres inwentarza (wikiBundle/Civpedia)
Odpowiedź: PRZYJMUJĘ jako uzupełnienie inwentarza (grep wykonany w tej rundzie).
- `grep -rlE "\.(Atak|Obrona|Health|Pancerz|Przebicie|Uderzenie)\b|\['(Atak|…)'\]"` po `gra/src` i `gra/tools` (poza `src/game/`): trafienia w `battle/battleScene.ts`, `battle/testBattle.ts`, `oblezenie/main.ts`, `main.ts` (wszystkie EN-first z fallbackiem PL, wg inwentarza r1: 18944–18946, 34547, 34592) oraz w narzędziach `tools/*` (testy, audyty, skrypty pomiarowe — poza zakresem kart).
- Brak trafień w `src/wiki*` / Civpedii w tym wzorcu. Wiki/Civpedia nie generuje tekstów liczbowych ze statystyk PL w `gra/src` (poza czytnikami wymienionymi wyżej). Generatora `wikiBundle` nie zmieniano (zgodnie z dispatchem).
- NIE_ZMIERZONO: czy `wikiBundle` (dane wygenerowane) zawiera liczby statystyk z kolumn PL. Nie sprawdzono zawartości bundla (brak regeneracji w tej rundzie).

### Zarzut 6 — „Atak dystansowy" ukrywany przy 0
Odpowiedź: ODRZUCAM (zachowanie zamierzone, nie regresja).
- Dowód: `unitAdapter.ts:255` (`es.atakDystansowy > 0 ? text(es.atakDystansowy) : ''`) oraz `unitInfoCard.ts` / `cityPanel.ts` (`es.atakDystansowy > 0 ? … : null`). Silnik czyta `missileAttack` z domyślnym 0 (`combat.ts:224`: `combatNormField(def['missileAttack'], 0)`), czyli brak wpisu i wartość 0 są dla silnika tym samym: brak pocisku. Ukrycie wiersza przy 0 nie zmienia żadnej wartości, którą liczy walka. Opisane w UWAGA 2 raportu Operatora r1.
- Brak zmiany kodu.

## Pozostałe zarzuty: brak

## Wyniki bramek (surowe wyjście, ta runda, kandydat e96196fce + poprawka testu)
- `./node_modules/.bin/tsc --noEmit` (tsc 5.9.3, lokalny): exit 0. (`npx tsc` pobrał inną wersję i zwrócił błąd `baseUrl` TS5101 — to nie dotyczy kodu, użyto lokalnej wersji z pakietu.)
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, exit 0.
- `node tools/unit-card-stats-engine-canon-test.cjs`: `PASS`, exit 0 (75/75 jednostek; Wojownik 4/4/22/2; 0 PL reads w 3 plikach UI).
- `node tools/unit-detail-card-entitycard-migration-test.cjs`: `40 pass, 0 fail`, exit 0.

## Zmiany w tej rundzie (allowlista)
- `gra/tools/unit-card-stats-engine-canon-test.cjs` — poprawiony wzorzec wykrywania odczytów PL (zarzut 1).
- `dyspozycje/autobot/runs/R-WEB-UI-UNIT-CARD-STATS-ENGINE-CANON-Q1/30-obrona-claude.md` — ten raport.
- Kod gry (`gra/src/**`, `gra/data/**`, `gra/src/game/**`) NIE zmieniony w tej rundzie.
- Nie tknięto: `gra/data/units.json`, silnik walki (`combat.ts`, `unit-power.ts`, `auto-battle-power.ts`), `WERSJE.md`, `gra-robocza/`, `rust-port/`. `git add -A` nie użyto.

## UWAGI-DLA-ORKIESTRATORA
1. DECISION_REQUIRED — „Bonus szarży": karta nie pokazuje `chargeBonus` (silnik), a wiersz czyta nieistniejącą kolumnę PL. Propozycja: osobny temat, który doda `chargeBonus` (z fallbackiem `Uderzenie`, jak `combat.ts:219`) do `unitEngineStats` i zmieni trzy asercje w `unit-detail-card-entitycard-migration-test.cjs` (linie 99–105, 152–153). Ten temat tego NIE robi.
2. DECISION_REQUIRED — potwierdzić ABC nr 8 = A dla etykiety „Obrażenia broni" = `weaponDamage` (67/75 jednostek zmienia wartość na karcie).
3. NIE_ZMIERZONO — Chromium (zarzut 4): zrzut karty Wojownika (oczekiwane 4/4/22/2) do zrobienia przez FC przed deployem albo jako osobny temat weryfikacji live.
4. NIE_ZMIERZONO — zawartość `wikiBundle` pod kątem liczb PL (zarzut 5). Generator nietknięty.
5. Dług testu: adapter nie jest wykonywany w węźle (import.meta.glob). Asercja „adapter = silnik" opiera się na migracji (40/0), nie na pełnym przebiegu 75 jednostek.
6. Kandydat e96196fce nie zawiera raportu Evaluatora `20-evaluator-claude.md` w tym branchu (zarzuty przekazano w dispatchu); cytaty z niego nie były weryfikowane niezależnie poza mutacją podaną w zarzutach.

## TESTY (podsumowanie)
- Bramki referencyjne 5/5 zielone; tsc exit 0; nowy test PASS; migracja 40/0.

## BLOKADY
- Zarzut 4 (Chromium) NIE_ZMIERZONO — nie blokuje wg kryterium 4 (dopuszczalne z powodem), ale FC powinien to rozstrzygnąć przed deployem.
- Decyzje z UWAG 1–2 wymagają odpowiedzi właściciela/orkiestratora.

## RUNDY
2/5 (obrona r2 po r1 Operatora; poprzedni werdykt Evaluatora: PASS-WITH-NOTES, bez blokad krytycznych).

## NASTĘPNY KROK
Evaluator: przegląd tej obrony (zarzut 1 — poprawka testu; zarzut 3 — UWAGA 1–2 do decyzji). Następnie Final Control.

## DEPLOY/PUSH: NIE WYKONANO

## Commit obrony
Commit zawiera tylko dwa pliki (`git add <ścieżka>`): `gra/tools/unit-card-stats-engine-canon-test.cjs` i ten raport. SHA w polu `sha` odpowiedzi.
