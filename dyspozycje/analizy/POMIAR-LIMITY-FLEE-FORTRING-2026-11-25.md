# POMIAR: limit wojen, limit sojuszy, FORTRING, FLEEMANUAL (2026-11-25)

Temat: R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1 (Operator HAIKU 5.5, runda obrony 2/5 po Evaluatorze d6c011747).
Baza: origin/main 35f601ae304471593c4921a61bfecbddbb9de14a. Zero zmian w `gra/src` i `gra/data` (kandydat 8415aae57 zmienia tylko `gra/tools/limits-measure.cjs`, ten dokument i katalog runu).
Pomiar na żywej grze (Chromium przez helper, bundle vite zbudowany poza repo): bieg 67 tur, seed 4242, jedna przeglądarka naraz.

## Stan domyślny flag (odczyt z danych gry, nie z hooka)

- `limitWojenAktywny`: `gra/data/diplomacy-war-limit-params.json`, pole `limitWojenAktywny.wartosc` = **true** (domyślnie ON). Odczyt w kodzie: `isWarLimitEnabled()` w `gra/src/game/diplomacy-war-limit.ts` (58–61).
- `torSojuszyAktywny` (tor sojuszy AI↔AI): `gra/data/ai-ai-treaty-params.json`, linia 11 = **true** (domyślnie ON). Odczyt: `isAiAiAllianceTickEnabled()` w `gra/src/game/ai-ai-alliance-tick.ts` (45–48).
- Wniosek: bieg „ON” (`--all-flags 1`) odpowiada domyślnemu stanowi gry; bieg „OFF” (`--all-flags 0`) wymusza wyłączenie i jest kontrolą.

## Tabela wyników

| Funkcja | Co zmierzono | Wynik liczbowy (seed 4242, tury 2–67, 66 wierszy) | Werdykt |
|---|---|---|---|
| (a1) Limit wojen AI↔AI (1 epoki + 1 naturalna per cywilizacja) | `limitWojen`=ON, maks. równoczesnych wojen per AI, dane `dane/analiza-limits-measure.json` | maxWojnEpokiAI **1**; maxWojnNaturalnychAI **2** (AI 28, tury 60–67, łącznie 8 tur naruszenia `turyNaruszenWojen` = [60..67]); 0 naruszeń w turach 2–59 | **NIE DZIAŁA w tym biegu** (naruszenie limitu u AI). Źródło deklaracji pary 22↔28 NIEUSTALONE (patrz niżej). |
| (a1-kontrola) To samo, OFF | `--all-flags 0` | maxWojnEpokiAI 1; maxWojnNaturalnychAI 1; 0 naruszeń | Kontrola. Bez flagi limit nie działa, więc to nie jest dowód skuteczności. |
| (a2) Limit wojen z graczem | jw., wiersze owner 0 | ON: maxWojnEpokiGracz **1**; maxWojnNaturalnychGracz **0** (gracz autopilot AI nie miał wojny naturalnej w żadnej turze) | **NIE ZMIERZONO**: reguła „naturalna per cywilizacja” wobec gracza nie została wyzwolona w tym biegu, więc nie da się stwierdzić, czy działa. Wojny epoki gracza (max 1) są zgodne z limitem, ale nie testują części naturalnej. |
| (b) Limit 2 sojuszy AI↔AI | `torSojuszyAktywny`=ON, jw. | maxSojuszyAI **2** (pierwszy sojusz w turze 42); naruszeniaSojuszyAI **0**; sojuszyZGraczemMax 0 | **DZIAŁA w tym biegu (wstępnie)**: jeden seed, 66 tur (nie 90), seed 7 NIE ZMIERZONO. |
| (b-kontrola) To samo, OFF | `--all-flags 0` | maxSojuszyAI 0 | Kontrola (bez flagi brak sojuszy). |
| (c) FORTRING (wydajność tury z/bez pierścienia; round-trip zapisu) | Nie wykonano pomiaru | brak | **NIE ZMIERZONO**. Powód techniczny i ślad: patrz „Dlaczego (c) i (d) nie są zmierzone”. |
| (d) FLEEMANUAL (odwrót ręczny, limit ruchu, animacja na mapie) | Nie wykonano pomiaru | brak | **NIE ZMIERZONO**. Powód techniczny i ślad: patrz niżej. |

## Dlaczego (c) i (d) nie są zmierzone

Ta runda NIE napisała runnerów dla (c) i (d). Nie jest to wynik pomiaru, tylko stan wykonania. Ślad sprawdzeń:

- (c): w `gra/src/main.ts` istnieją `fortRingShield` i `fortRingBlock`, a w `gra/src/map/improvement-build.ts` `fortRingBuildBlockReason`. Zależne testy są w `gra/tools/territory-improvement-owner-test.cjs` (testy jednostkowe). Nie znaleziono w `gra/tools` runnera live ani przełącznika ustawienia, który wyłączałby pierścień na potrzeby pomiaru wydajności tury. Dlatego pomiar z/bez pierścienia wymaga nowego hooka i runnera (osobny temat R-WEB-*).
- (c) round-trip zapisu: w tej rundzie był próbowany wyłącznie wariant wznowienia biegu (`--stop-at`) z `diplomacy-harder-measure-run.cjs`. Według rundy 1 wznowienia kończyły się `SIGSEGV_MAPERR` Chromium (znany problem #90). Nie powtórzono tej próby w obronie.
- (d): w `gra/tools` są testy jednostkowe `battle-flee-manual-test.cjs`, `battle-flee-move-half-test.cjs` oraz wejście przeglądarkowe `battle-flee-manual-browser-entry.ts`. Nie zidentyfikowano runnera live, który wykonuje scenariusz odwrotu ręcznego i mierzy limit ruchu oraz animację. Wykorzystanie wejścia przeglądarkowego do pomiaru live nie było sprawdzone.

## Metoda (a) i (b)

- Runner: `gra/tools/diplomacy-harder-measure-run.cjs --all-flags 1|0 --seed 4242 --turns 67`, gracz = autopilot AI. Flagi ustawiane hakiem `__diploAllFlagsMeasure.setAll` przed pierwszym endTurn; pole `flagi` w każdym wierszu i w pliku `*.summary.json` potwierdza stan (ON: `limitWojen`, `sojuszTor` = true; OFF: wszystkie false).
- Analizator: `gra/tools/limits-measure.cjs` (nowy; TYLKO analizator JSONL, nie jest runnerem i nie jest wznawialny). Liczy per cywilizacja pozycje `wojna` (typ `epoki`/`naturalna`) i `sojusz` w każdej turze.
- Dane surowe (w repo, skompresowane): `dyspozycje/autobot/runs/R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1/dane/`:
  - `seed4242-all1.jsonl.gz` (ON, 66 wierszy), `seed4242-all0.jsonl.gz` (OFF, 66 wierszy), `seed4242-all0.summary.json`;
  - `analiza-limits-measure.json` (wynik analizatora na tych plikach);
  - `SHA256-nieskompresowane.txt`: 9b900f8457e3f8fe0100cbb33d5afe7f246230b26cabfde8b5f8f2b18cb72efa (ON), 9a164595a6e4958fcbbee03c1449392dfec35f97012c3c08899d0f891e4b7711 (OFF).
- Wiersze zawierają wszystkie pary inne niż `neutralni` oraz sąsiadów, więc wojny i sojusze są kompletne (wg definicji analizatora).

## Szczegóły naruszenia (a1), ON

- Tura 59: AI 28 nie ma wojny; wojny: gracz↔25 `epoki` oraz 16↔19 `naturalna`.
- Tura 60: AI 28 ma dwie wojny `naturalna`: **1↔28** i **22↔28** (limit 1). Pozostałe w t60: gracz↔25 `epoki`, 16↔19 `naturalna`.
- Tury 61–67: naruszenie u AI 28 utrzymuje się (t67: 1↔28, 7↔37, 22↔28).
- Dane wiersza nie zawierają pola „kto wypowiedział wojnę”, więc z wiersza nie da się ustalić, która strona zadeklarowała 22↔28.

### Ścieżka deklaracji (ZAŁOŻENIE, nie potwierdzone)

Sprawdzone w kodzie `gra/src/main.ts`:

- `warLimitPermits` (26068–26075) sprawdza limit dla OBU stron (`warTypesForOwner(attacker)` i `warTypesForOwner(victim)`). Poprzednie zdanie dokumentu „sprawdzana tylko strona sojusznika” było błędne i jest wycofane.
- Przyłączanie sojusznika w `applyAllianceObligationsOnWar` (~26223–26237) wywołuje `warLimitAllowsDeclaration(allyId, ob.mustDeclareWarOn, typWojny)` (26237), czyli też sprawdza obie strony.
- Deklaracja z pominięciem limitu: `ownerDeclareWarOn(attackerId, defenderId, force = false, cause)` (14317); sprawdzenie limitu jest w linii 14325 pod warunkiem `!force`. Jedyne wywołanie z `force = true` w tym pliku to `ownerDeclareWarOn(newOwner, rebelPrevOwnerId, true, 'wymuszona_inna')` (14386), w `triggerRebelProtectionWarConsequence` (przejęcie miasta buntowniczego w oknie ochrony). To jest najmocniejszy kandydat na ścieżkę bez bramki limitu, ale NIE zweryfikowano, że para 22↔28 pochodzi z przejęcia miasta. Dane nie mają zdarzeń przejęcia.
- Kandydat na minimalne odtworzenie: seed 4242, `--all-flags 1`, do tury 60, z logiem zdarzeń deklaracji wojny. NIE wykonano w tej rundzie. Werdykt (a1) pozostaje „NIE DZIAŁA w tym biegu”, a źródło naruszenia jest nieustalone. Nie naprawiano gry (zakaz tematu).

Reguła obowiązująca (nagłówek `gra/src/game/diplomacy-war-limit.ts`, Reguła wojen C, ABC 2026-11-18): „maks. 1 wojna epoki + 1 wojna naturalna naraz per cywilizacja”.

## Harness (wznawialność)

- Runner `diplomacy-harder-measure-run.cjs` jest wznawialny z `--stop-at`. W rundzie 1 wznowienie działało raz (tury 10→59), dwa kolejne kończyły się `SIGSEGV_MAPERR` Chromium przed pierwszą turą (`[err] Received signal 11`), znany problem #90.
- Test „bieg w dwóch odcinkach = bieg ciągły” NIE ZMIERZONO: w obronie nie powtórzono wznowień; wynik wzięto z rundy 1.
- Analizator `limits-measure.cjs` nie jest runnerem, więc nie spełnia wymogu „runner wznawialny” sam z siebie.

## Bramki (kod gry bez zmian; wynik z surowego wyjścia, worktree na 8415aae57)

- `npx tsc --noEmit`: exit 0
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs`: `20 pass, 0 fail`
- `node tools/research-test.cjs`: `ALL GREEN`
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs`: `All sanity checks passed.`
- `node tools/ai-test.cjs`: `ai-test: 297 passed, 0 failed` (exit 0)

## Nie zrobione (jawnie)

- Seed 7: NIE ZMIERZONO (nie wykonano w tej rundzie).
- 90 tur: NIE ZMIERZONO; zmierzono 67 tur (ON i OFF).
- (c) FORTRING i (d) FLEEMANUAL: NIE ZMIERZONO, patrz „Dlaczego (c) i (d) nie są zmierzone”. Brak runnerów w tej rundzie; decyzja o osobnym tematu należy do orkiestratora.
- Round-trip zapisu (c): NIE ZMIERZONO.
- Minimalne odtworzenie naruszenia (a1): NIE ZMIERZONO (kandydat opisany wyżej).
- Ustalenie ścieżki deklaracji dla pary 22↔28: NIE ZMIERZONO (ZAŁOŻENIE wyżej).
