# R-WEB-TEST-MEASURE-WARRIOR-DEFENDER-ADVANTAGE-Q1 — raport obrony Operatora (runda 2)

STATUS: PASS-WITH-NOTES (zarzuty 3, 6, 7 przyjęte i naprawione; 1 i 4 odrzucone częściowo z dowodem; 2 odrzucony z dowodem; 5 przyjęty jako diagnoza hipotezy z lokalizacjami; pkt (2) zamiany stron i pkt (3) trybu ręcznego pozostają NIE ZMIERZONO z udokumentowanym powodem)
DOMAIN: GAME (tylko narzędzia pomiarowe; zero zmian zasad, balansu, statystyk i gra/src)
TEMAT: R-WEB-TEST-MEASURE-WARRIOR-DEFENDER-ADVANTAGE-Q1
GOAL: odpowiedź liczbami na pytanie, czy w bitwie Wojownik vs Wojownik 10 vs 10 obrońca ma przewagę; zarzuty Evaluatora (report_sha 9413ffdab) przyjęte lub odrzucone z dowodem
BAZA/KANDYDAT: 782e033d7a7db4900fbd7030f725ee9a6d5ba4fd (zweryfikowany: `git cat-file -t` = commit; ancestor 32c13e63f = origin/main)
KOMMIT KODU OBRONY: 86e39d30233d0748dbce9f56df4fde15980358ef (gra/tools + evidence); ten plik to commit następny

## ODPOWIEDZI NA ZARZUTY EVALUATORA

### Zarzut 1 — kontrola zamiany stron (gracz = obrońca), hak civTest niedodany
ODRZUCAM jako naruszenie kryterium (b) — kryterium brzmi „kontrola zamiany stron wykonana LUB jawne NIE ZMIERZONO z powodem” i Evaluator sam potwierdził, że jawne NIE ZMIERZONO spełnia (b).
PRZYJMUJĘ, że zakres pkt (2) pozostaje niewykonany: hak civTest (≤20 linii) nie został dodany.
Powód NIE ZMIERZONO teraz ma dowód live: sterownik w roli `def` (tryb auto, ziarna 1 i 2, wykonane 2026-11-17 na Chromium/xvfb, build z scratchpada) — w obu przypadkach AI nie otworzyło okna przed bitwą; raw: `evidence/live-def-s1-s2-auto.json`, pole `error` = „brak okna przed bitwa (AI nie zaatakowal)”. Wcześniejsza próba z rundy 1 (ziarno 1, losowe) nie była zapisana w evidence; ta powtórka zastępuje ją w dowodzie.

### Zarzut 2 — tryb ręczny (pkt 3): „bez próby”
ODRZUCAM: próba została wykonana w scenie. Po kliknięciu „Wejdź na pole” sterownik zapisuje stan sceny; raw (np. `evidence/live-stats-atk-s1-auto.json`, `afterDeployClick`): `manualCommanderGate: true`, `playerHasCommander: false`, `manual: false`, `deployMode: false`, `atk: 10`, `def: 10`. Tryb ręczny jest wyłączony z konstrukcji: `gra/src/battle/battleScene.ts:3667` `this._manualMode = !this._manualCommanderGate || (this._manualCommanderGate && hasCommander)`; gate ustawiana z `opts.manualControlAllowed` w `battleScene.ts:2799`; `noGeneralManualBlocked` w `battleScene.ts:3585`.
Korekta: komentarz w sterowniku podawał „battleScene.ts ~3662”; właściwe miejsce to 3667 (warunek) i 3585 (flaga blokady).
Hak ustawiający generała (`isGeneral`) zmieniałby warunek wejścia w tryb ręczny, więc nie jest testem bez zmiany zasady; kryterium (3) dopuszcza jawne NIE ZMIERZONO z powodem. Decyzja dla właściciela — patrz UWAGI.

### Zarzut 3 — statystyki Wojownika nie porównane pole po polu
PRZYJMUJĘ i NAPRAWIONO. Sterownik rozszerzony (`gra/tools/live-verify-wojownik-map-q1.cjs`, probe): dla KAŻDEJ jednostki obu stron zapisywane są pola `bu.stats` (17 pól). Przebieg live: ziarno 1, tryb auto, atakujący, `evidence/live-stats-atk-s1-auto.json` → `probe.statsAtk` (10) i `probe.statsDef` (10).
Wynik: wszystkie 20 wpisów są identyczne (1 unikalny słownik). Zgodność z `gra/data/units.json` (jedyny wiersz „Wojownik”, obie strony z tej samej pozycji):
- health 22 (units.json 22), meleeAttack 4 (4), meleeDefence 4 (4), weaponDamage 4 (4), piercing 1 (1), armor 2 (2), Atak 6 (6), Obrona 6 (6), Uderzenie 4 (4), Pancerz 4 (4), Przebicie 0 (0), Morale bazowe 50 (50), Morale ucieczki 22 (22), Próg dezercji 0.4 (0.4), Ruch w bitwie 4 (4), Rola Wręcz (Wręcz).
Różnica między stronami: brak. Zgodność scena ↔ units.json: potwierdzona dla wszystkich 17 pól.
Uwaga: `typeId` w scenie nadal `null` (wcześniej też); identyfikacja typu po `Jednostka`.

### Zarzut 4 — brak testu haków i mutacji (W_HIT)
ODRZUCAM żądanie testu haków: w tym temacie nie dodano żadnego haka do `gra/src` (`git diff --stat 32c13e63f..782e033d7 -- gra/src` pusty; `git diff 782e033d7..86e39d3 --stat` obejmuje tylko `gra/tools` i evidence). Kryterium (d) dotyczy haków pod flagą civTest — nie ma ich przedmiotu.
PRZYJMUJĘ lukę dla przełącznika `W_HIT` w sterowniku: nie ma testu ani mutacji. Pośrednia obserwacja (nie dowód mutacyjny): te same ziarna w obu trybach dają różne wyniki (ziarno 1: losowe → atakujący, 26 rund; pewne → obrońca, 17 rund; `evidence/losowe-raw.json`, `evidence/pewne-raw.json`). Formalny test: NIE ZMIERZONO.

### Zarzut 5 — diagnoza przyczyny z numerami linii
PRZYJMUJĘ jako diagnozę HIPOTEZY, nie jako potwierdzoną przewagę. Warunek z dispatchu („≥70% przy ≥20 ziarnach”) jest formalnie spełniony przez 14/20 w trybie pewne, ale wynik nie jest niezależny — patrz zarzut 6a: 20 ziaren daje 8 unikalnych przebiegów. Przewagi obrońcy nie uznaję za potwierdzoną.
Lokalizacje kandydatów (zweryfikowane grepem w `gra/src/battle/battleScene.ts`, NIE przez eksperyment):
- kolejność inicjatywy w AUTO: linie 5767–5772 — w każdym indeksie pary najpierw dodawany jest atakujący (`if (au) order.push(au)`), potem obrońca (`if (du) order.push(du)`);
- rzut trafienia: linie 9540–9546 — w trybie pewne `hitPct = 100`, `roll = 0`, więc każdy cios trafia; przewaga w pewne nie może więc wynikać z rzutu, tylko z kolejności, bonusów obrony (`defFinalObrona`, `defMods`) i geometrii — który z nich, NIE ZMIERZONO;
- bramka trybu ręcznego (linie 2799, 3667) nie wpływa na AUTO.
Opcje dla właściciela: (A) zmierzyć wpływ kolejności inicjatywy (wymaga haka testowego w civTest — zmiana scenariusza, nie reguł); (B) zmierzyć wpływ bonusów obrony w trybie pewne (wymaga odczytu `defFinalObrona`/`defMods`); (C) nie diagnozować, zamknąć jako „pomiar bez przewagi potwierdzonej”.

### Zarzut 6 — błędy metodyczne
- (a) PRZYJMUJĘ. Tryb pewne jest deterministyczny: 20 ziaren daje 8 unikalnych wyników (liczba ziaren na wynik: 4 ziarna → [1,7,9,17] obr 17/10/2; 5 → [2,8,10,13,19] obr 15/10/3; 1 → [3]; 1 → [5]; 1 → [11]; 4 → [4,14,18,20] atk 15/3/10; 2 → [6,15] obr 7/10/0; 2 → [12,16] atk 15/5/10). Przedział Wilsona liczony na 20 był zawyżony. Dla 8 unikalnych wyników: atakujący 2/8 = 25%, Wilson 95% 7,1–59,1% (heurystyka, nie test niezależności). Losowe: 20 różnych wyników (każde ziarno inne), Wilson 29,9–70,1% bez zmian.
- (b) PRZYJMUJĘ. Losowe ziarno 5: wzajemna eliminacja (atak 10/10, obrona 10/10; `remaining` 0/0); wpis sterownika „zwyciestwo OBRONCY”. Liczone jako remis. Bez remisu (n=19): atakujący 10, obrońca 9, Wilson 31,7–72,7%.
- (c) PRZYJMUJĘ definicje. „Straty” = `res.atk.eliminated` / `res.def.eliminated` (wpisy „wyeliminowany” w logu). „Ucieczki” w tabeli = `res.logRouted` (wpisy „uciekl z pola bitwy”); pole `res.fled` jest zawsze 0 (sterownik go nie wypełnia) i nie jest używane.
- (d) PRZYJMUJĘ jako notę: zwycięstwa PAT po morale przy zbliżonych stratach są szumem rozstrzygnięcia (np. losowe ziarno 1: 6 vs 7 strat, PAT, wygrywa atakujący). Tabela oznacza to w kolumnie „rundy”.

### Zarzut 7 — drobne nieścisłości
- (i) PRZYJMUJĘ. Różnice auto vs skip z JSON (`evidence/*-raw.json`, skrypt przeliczenia w scratchpadzie): losowe — ziarno 4: tylko runda (21 vs 22), zwycięzca i straty te same; ziarno 10: runda 26 vs 28 ORAZ strata obrońcy 4 vs 5. Nie „dwa ziarna ze stratami”, tylko jedno (10). Pewne — ziarna 1, 3, 7, 9, 17: różnią się tylko rundą (17/19, 12/11, 17/19, 17/19, 17/19), zwycięzca i straty identyczne.
- (ii) PRZYJMUJĘ wyjaśnienie: `meta.runda = 4` to numer rundy NARZĘDZIA pomiarowego (nagłówek sterownika: „runda 4” serii R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1), a nie rundy tego tematu (obrona/operator = 1/5 → runda 2/5 tej obrony).
- (iii) PRZYJMUJĘ. Średnia rund w trybie pewne = 14,45 (nie 14,4).

## POPRAWIONE PODSUMOWANIE POMIARU (tryb auto; liczby z surowego JSON)

| tryb trafień | ziarna | wygrane atakującego | wygrane obrońcy | remis (wzajemna eliminacja) | unikalne wyniki | Wilson 95% atakującego (n=20) | średnia rund | średnie straty atk / def |
|---|---|---|---|---|---|---|---|---|
| losowe | 20 | 10 | 10 (w tym ziarno 5 = remis) | 1 | 20 | 29,9–70,1% | 20,80 | 7,15 / 6,55 |
| pewne | 20 | 6 | 14 | 0 | 8 | 14,5–51,9% (n=20; zawyżone) / 7,1–59,1% (n=8 unikalnych, 2/8) | 14,45 | 8,10 / 4,70 |

Losowe bez remisu (n=19): atakujący 10, obrońca 9, Wilson 31,7–72,7%.
Wnioski (tylko opis): w trybie losowe 10/10 — brak przewagi obrońcy; w trybie pewne obrońca wygrywa 6 z 8 unikalnych wyników, ale 8 wyników to nie 20 niezależnych prób; przewagi obrońcy nie uznaję za potwierdzoną. Auto vs skip (40 par ziaren): zwycięzca zgodny we wszystkich 40 parach; straty zgodne we wszystkich poza jedną parą (losowe ziarno 10: obrońca 4 vs 5); rundy różne w 7 parach (losowe ziarna 4 i 10; pewne ziarna 1, 3, 7, 9, 17). Pomiń nie jest więc w pełni równoważne auto (różnica liczby rund), zgodnie z #501.

## TESTY / BRAMKI (surowe wyniki; kod wyjścia; pliki w evidence/)

- `npx tsc --noEmit -p tsconfig.json` (gra/): exit 0, brak wyjścia — `evidence/gate-tsc.txt` (pusty = brak błędów).
- `node tools/logic-test.cjs`: exit 0, „LOGIC OK (213/213)”.
- `node tools/tech-tree-test.cjs`: exit 0, „tech-tree-test: 20 pass, 0 fail”.
- `node tools/research-test.cjs`: exit 0, „PASSED: 33 / FAILED: 0 / TOTAL: 33”, „ALL GREEN”.
- `node tools/unit-replace-test.cjs`: exit 0, „WSZYSTKIE TESTY ZIELONE (21/21)”.
- `node tools/combat-test.cjs`: exit 0, „COMBAT TEST: 6/6 pass”.
Środowisko: `npm ci --ignore-scripts` w gra/ (wykonane w worktree; katalog `gra/node_modules` nieśledzony, pozostawiony do sprzątania przez orkiestratora). Przed npm ci: /dev/vda 4,1 GB wolnego; po: 3,1 GB.

Powtórka reprodukowalności (dowód, że pomiar jest odtwarzalny): ziarno 1, losowe, atakujący uruchomiony ponownie na tym samym buildzie → atakujący wygrywa w rundzie 26, straty 6 vs 7 — identycznie jak `evidence/losowe-raw.json` (`atk-s1|auto`).

## ZMIANY / COMMIT
- `gra/tools/live-verify-wojownik-map-q1.cjs`: probe rozszerzony o `statsAtk` / `statsDef` (17 pól bu.stats, wszystkie jednostki). Składnia sprawdzona (`node --check`). Bez zmian logiki walki.
- `evidence/live-stats-atk-s1-auto.json` — live probe statystyk (zarzut 3).
- `evidence/live-def-s1-s2-auto.json` — live próba roli obrońcy, ziarna 1–2 (zarzut 1).
- `evidence/gate-*.txt` — surowe wyjścia pięciu bramek + tsc (zarzut: kryterium (e)).
- `30-obrona-claude.md` — ten plik.
- gra/src: BEZ ZMIAN (`git diff --stat 782e033d7..HEAD -- gra/src` pusty).
- `evidence/*-raw.json` z rundy 1: BEZ ZMIAN (pomiary nie były powtarzane poza powyższymi próbami).
- Pliki `gate-*.log` w evidence są lokalnymi kopiami (ignorowane przez .gitignore); commitowane są kopie `.txt`.

## BLOKADY
1. Pkt (2) zamiana stron — hak civTest (≤20 linii) nie dodany; live def: AI nie atakuje w oknie (ziarna 1–2). NIE ZMIERZONO z powodem.
2. Pkt (3) tryb ręczny — bramka `_manualCommanderGate` (battleScene.ts:3667) wyłącza tryb bez generała; hak generała = zmiana warunku wejścia w tryb ręczny (decyzja właściciela). NIE ZMIERZONO.
3. Test haków / mutacja W_HIT — brak haków w src (zgodnie z zakresem), brak testu przełącznika W_HIT. NIE ZMIERZONO.
4. Diagnoza przyczyny (pkt 5) — tylko hipotezy z lokalizacjami; przewaga nie potwierdzona (8 unikalnych wyników).
5. Zgłoszenie #286 (barbarzyńca „z supermocą”) — nierozstrzygnięte tym pomiarem.
6. Live w pełnej grze poza sterownikiem — NIE ZMIERZONO.

## RUNDY
Runda obrony 1/… (odpowiedź na zarzuty Evaluatora z report_sha 9413ffdab); pierwsza runda operatora = 1/5 (`10-operator-claude.md`). Ostatni werdykt Evaluatora: PASS-WITH-NOTES (bez werdyktu końcowego). Decyzja wymagana: tak (patrz UWAGI).

## NASTĘPNY KROK
Evaluator/Final Control: zweryfikować commit 86e39d30 (tylko gra/tools + evidence) i ten raport; potwierdzić, że pozycje (2) i (3) są jawnie NIE ZMIERZONO z powodem zgodnie z kryteriami (b) i (3). Decyzja właściciela (ABC): pkt (2)/(3) hak civTest (tak/nie) i wybór opcji diagnozy pkt (5) A/B/C.

DEPLOY/PUSH: NIE WYKONANO

---

UWAGI-DLA-ORKIESTRATORA
- Zgłoszenie #501 (różnica strat/rund auto vs skip) potwierdzone w JSON: losowe ziarna 4 i 10; pewne ziarna 1, 3, 7, 9, 17 (szczegóły wyżej). Do osobnego tematu, nie w tym temacie.
- Komentarz w sterowniku „battleScene.ts ~3662” skorygowany w raporcie do 3667 (kod sterownika nieruszony w tej kwestii).
- Dla decyzji właściciela: (a) czy dodać hak civTest pod pkt (2) i (3) (zmiana scenariusza testowego, nie reguł) czy zamknąć jako NIE ZMIERZONO; (b) opcja diagnozy pkt (5) A/B/C; (c) czy #286 (barbarzyńca „z supermocą”) ma osobny temat audytu z live danymi.
- Sprzątanie: `gra/node_modules` w worktree (npm ci) — do usunięcia przez orkiestratora po zamknięciu tematu; dysk 3,1 GB wolnego (poniżej progu 4 GB dla web — przed startem kolejnego tematu web wymagane sprzątanie).
- Nie tworzono żadnych sesji, zadań ani harmonogramów.
