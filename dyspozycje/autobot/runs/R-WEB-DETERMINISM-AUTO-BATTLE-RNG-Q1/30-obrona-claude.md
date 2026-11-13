# R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1 — Obrona Operatora (runda 2, HAIKU)

STATUS: FAIL (kryterium pomiaru nadal niespelnione; zarzut 7 naprawiony, bramki PASS)
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1
GOAL: walki automatyczne (resolveAutoBattleByPower) losuja z ziarna gry zamiast Math.random; ten sam przebieg dla tego samego ziarna takze przy bitwach; pomiar: wszystkie przebiegi jednej konfiguracji maja ten sam skrot stanu.
BAZA: kandydat 38752ec01 (potomek ff25b42ad). Worktree przestawiony `git checkout --detach 38752ec01` (wczesniej e6776801b).
Kryterium binarne pomiaru (ten sam skrot we wszystkich przebiegach) NIE JEST SPELNIONE — patrz sekcja ZARZUTY, pozycja 1. Status FAIL oznacza, ze temat nie jest zamkniety; zmiany kodu/testu z tej rundy przeszly bramki.

## ZMIANY-COMMIT
- gra/tools/determinism-same-seed-test.cjs: D1 przepisany (odpowiedz na zarzut 7). Zamiast regex `[^}]*` i sprawdzenia samej obecnosci klucza `rng:` — dopasowanie nawiasow (funkcja callArgs) i wymog, zeby wartosc `rng` byla wywolaniem `autoBattleRng(...)` / `deps.autoBattleRng?.(...)` bez `Math.random`. Komunikat FAIL zmieniony na „RNG NIE Z ZIARNA”.
- Ten raport (30-obrona-claude.md).
- Kod gry (main.ts, mapFieldBattle.ts, auto-battle-power.ts, combat.ts, siege.ts, ai.ts) — BEZ ZMIAN w tej rundzie.
- SHA: patrz `sha` w odpowiedzi StructuredOutput (commit na 38752ec01).

## ODPOWIEDZI NA ZARZUTY EVALUATORA (8a535b7e9)

1. Kryterium binarne pomiaru (6/6 przebiegow z roznym skrotem) — ODRZUCAM jako naprawialne w tej rundzie; PRZYJMUJE jako otwarte. Dowod: evidence/f2222-1..6.json, trajectorySha256_12 nadal rozne (dane z 10-operator, nie powtarzane). Dispatch (pkt 3) dopuszcza raportowanie pierwszej tury rozbieznosci, jesli zostanie: pierwsza rozbieznosc tura 22 (przebiegi 3,5,6), tura 23 (2), tura 25 (4), pole `digest.treasury["1"]` (skarbiec AI wlasciciela 1). Zrodla nie zidentyfikowano. Podejrzane (poza allowlista tego tematu): Date.now() w gra/src/game/armyMerge.ts:75 i gra/src/game/cities.ts:89. Bisekcja wymaga zmian poza allowlista lub osobnej rundy pomiarowej — patrz UWAGI.

2. Tryb normalny (3 przebiegi po 13/18/15 tur, limit 200 s) — PRZYJMUJE: NIE_ZMIERZONO w tej rundzie. Przyczyna: budzet czasu rundy; runner w trybie normalnym ~10 s/tura, do 40 tur potrzeba MEAS_MAX_SEC >= 450 i trzech przebiegow w osobnych wywolaniach (≤590 s na Bash). Nie uruchomiono.

3. Drugie ziarno (1717) — PRZYJMUJE: NIE_ZMIERZONO (budzet).

4. Mutacja zmieniajaca wynik pomiaru — PRZYJMUJE: NIE_ZMIERZONO. Zgadzam sie z ustaleniem Evaluatora: w 40 turach scenariusza autoBattles = 0 (evidence/f2222-*.json), wiec sciezka auto-walki nie jest wykonywana i mutacja pomiaru nie moze zmienic skrotu. Wymagany jest scenariusz z auto-walkami (barbarzyncy/wojna), ktorego ta runda nie przygotowala.

5. resolveCombat (combat.ts:890) bez rng z battleScene.ts:20795 i manualBattle.ts:1062 — PRZYJMUJE jako otwarte ograniczenie, ODRZUCAM jako blad tej rundy. battleScene.ts jest w ZAKAZIE dispatchu (tylko wylistowac), manualBattle.ts jest poza ALLOWLISTA. Wyjatek w WYJATKI pozostaje uzasadniony opisem wplywu (TAK) i wskazaniem osobnego tematu. Decyzja dla orkiestratora: rozszerzenie allowlisty (manualBattle.ts) i zgoda na battleScene.ts, albo osobny temat.

6. Hook `digest` w main.ts poza allowlista — ODRZUCAM zarzut co do merytoryki: hook jest wymagany przez pkt 3 dispatchu (rozszerzenie skrotu stanu o jednostki/skarbiec/zasoby) i jest tylko do odczytu. PRZYJMUJE, ze formalnie wykracza poza zapis allowlisty „WYLACZNIE wywolania resolveAutoBattleByPower i podawanie rng” — orkiestrator musi to zaakceptowac wprost. Blad sciezki w allowliscie (`gra/src/ui/mapFieldBattle.ts` -> faktycznie `gra/src/battle/mapFieldBattle.ts`) — PRZYJMUJE, zmiana w kodzie jest w poprawnym pliku.

7. Slaby test D1 — PRZYJMUJE i NAPRAWIONO (commit tej rundy). Dowod: po zmianie D1 przechodzi na bazie (wolan=6), a każda z 6 pojedynczych mutacji ponizej jest wykrywana przez D1:
   | Miejsce | Mutacja | Wynik |
   |---|---|---|
   | main.ts:34228 | `rng: Math.random ?? autoBattleRng(` | FAIL C1 + FAIL D1 (WYNIK: FAIL (2)) |
   | main.ts:34707 | jw. | FAIL C1 + FAIL D1 (FAIL (2)) |
   | main.ts:34978 | jw. | FAIL C1 + FAIL D1 (FAIL (2)) |
   | main.ts:37503 | jw. | FAIL C1 + FAIL D1 (FAIL (2)) |
   | main.ts:37690 | jw. | FAIL C1 + FAIL D1 (FAIL (2)) |
   | battle/mapFieldBattle.ts:478-481 | `rng: Math.random ?? deps.autoBattleRng?.(` | FAIL D1 (WYNIK: FAIL (1)) |
   Mutacje wykonane skryptem (sed w jednej linii, pelny test, przywrocenie pliku z kopii po kazdej mutacji). Git diff po mutacjach: tylko test i raport (patrz `git status` w sekcji TESTY).
   Zastrzezenie: D2 nadal sprawdza obecnosc tekstow w main.ts (nie semantyke); `deps.autoBattleRng?.` w mapFieldBattle ma fallback do Math.random, gdy dep nie zostanie podany — D2 tego nie wykrywa. Niski priorytet, zostaje w UWAGACH.

8. Sol strumienia bez licznika (dwie auto-walki tej samej tury, ten sam hex i lider dostaja ten sam strumien) — PRZYJMUJE jako zalozenie, ODRZUCAM naprawe w tej rundzie. Licznik per tura bez zapisu w zapisie gry dawalby rozjazd po wczytaniu (ten sam problem co pkt 9). Wymaga decyzji orkiestratora (licznik zapisywany w zapisie = zmiana save/load poza allowlista).

9. Kolizja _detIdSeq po wczytaniu zapisu — PRZYJMUJE jako otwarte (analiza bez reprodukcji, jak w rundzie 1). Naprawa poza allowlista. Bez zmian.

10. Hipotezy zrodla dryfu skarbca AI — PRZYJMUJE jako NIE_ZMIERZONO. Operator nie prowadzil bisekcji w tej rundzie (budzet + allowlista). Hipotezy do osobnego tematu (patrz UWAGI).

## TESTY (surowe wyjscie, worktree 38752ec01 + zmiana testu D1)
- `npx tsc --noEmit` (gra/): exit 0, brak wyjscia.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, `ALL GREEN`.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs`: `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`
- `node tools/determinism-same-seed-test.cjs` (po zmianie D1): A1–A7 PASS, B1 PASS (trafien=10, wyjatkow=8), B2 PASS, C1 PASS (trafien=2), D1 PASS (wolan=6), D2 PASS, `WYNIK: PASS`, exit 0.
- Mutacje D1: 6/6 wykrytych (tabela w ODPOWIEDZI 7).
- Pomiar (measure-ai-trade-offer-frequency*.cjs): NIE_WYKONANO w tej rundzie (budzet; brak nowych przebiegow). Dane z rundy 1 nie zmienione: evidence/ w tym commicie pozostaje bez zmian.
- Kod gry nie zmieniony w tej rundzie, wiec bramki gry wykonane na kandydacie 38752ec01 sa wynikiem rundy 1 potwierdzonym tu ponownie.

## BLOKADY
- Kryterium pomiaru (skrot jednakowy) — niespelnione, zrodlo dryfu skarbca AI nieznane.
- Tryb normalny 40 tur, drugie ziarno, mutacja pomiarowa — NIE_ZMIERZONO.
- resolveCombat bez rng w battleScene.ts/manualBattle.ts — poza zakresem tematu (zakaz/allowlista), wymaga decyzji orkiestratora.
- Brak blokad technicznych.

## RUNDY
2/5 (runda obrony po FAIL Evaluatora 8a535b7e9). Zarzut 7 naprawiony kodem testu; pozostale zarzuty zamkniete odpowiedziami lub otwarte z jawnym zalozeniem.

## UWAGI-DLA-ORKIESTRATORA
1. Dryf skarbca AI od tury 22 (pkt 1) — wymaga osobnego tematu (proponowany: R-WEB-DETERMINISM-AI-TREASURY-DRIFT-Q1). Plan bisekcji: wylaczyc Date.now() w armyMerge.ts:75 i cities.ts:89 (ID nie powinny wplywac na stan, sprawdzic czy wplywaja na sortowanie/porownania), porownac digest tura po turze, potem zbadac ekonomie/handel/zakupy wlasciciela 1. To jest zakres poza allowlista tego tematu.
2. Hook `digest` w main.ts (pkt 6) — prosze o wyrazna akceptacje poza allowlista, albo o wpisanie do allowlisty kolejnej rundy.
3. resolveCombat bez rng (pkt 5) — decyzja: allowlista manualBattle.ts i zgoda na battleScene.ts, albo osobny temat.
4. Pozostale zalozenia otwarte: sol strumienia bez licznika (pkt 8), _detIdSeq po wczytaniu (pkt 9). Oba wymagaja zmiany zapisu i nie sa w allowliscie.
5. Runda 3 (jesli bedzie) powinna miec: pomiar w trybie normalnym z MEAS_MAX_SEC >= 450 (osobne wywolania), drugie ziarno, scenariusz z auto-walkami (autoBattles > 0) i mutacje pomiarowe — albo zgode na zamkniecie tematu z jawnym NIE_ZMIERZONO.

NASTEPNY KROK: Final Control (SONNET) — zweryfikowac commit tej rundy (test D1 + raport), potwierdzic tabele mutacji i decyzje orkiestratora w pkt 1, 3, 6.

DEPLOY/PUSH: NIE WYKONANO
