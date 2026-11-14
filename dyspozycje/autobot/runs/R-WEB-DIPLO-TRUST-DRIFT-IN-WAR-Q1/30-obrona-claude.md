# R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1 — obrona Operatora (runda 2/5, odpowiedź na zarzuty Evaluatora ae9bffe54)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1
GOAL: (a) tabela tiku zaufania dla pary w wojnie / neutralnej / w pokoju; (b) przyczyna wzrostu 0→1 z cytatem; (c) bez naprawy produkcyjnej — dowód mutacją, że test wychwytuje guard; (d) N=5 vs 6 jednym zdaniem z dowodem. Zmiana N i progu = decyzja właściciela.
BAZA: f6e1669b9 (kandydat Operatora r1), kod = fbafec4b3 (origin/main).

## Źródła wejścia (zarzut 6)

- `00-dispatch.md` istnieje tylko w commicie `2dbfdc8a5` na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (10 linii; GOAL, kryteria a–d, allowlista, zakazy). Nie ma go na `origin/main`.
- `00-dispatch-DODATEK-claude.md` NIE istnieje ani na `origin/main`, ani na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (sprawdzone `git show` i `git ls-tree`). Zakres tej rundy = kryteria a–d z `00-dispatch.md`. NIE_ZMIERZONO: czy orkiestrator ma inną instrukcję w DODATKU. Orkiestrator proszony o potwierdzenie.

## Odpowiedzi na zarzuty

### Zarzut 1 (DECISION_REQUIRED: dryf w neutralności vs próg kryzysu 0) — PRZYJMUJĘ

Zmierzone na żywej ścieżce tiku (`tickDiplomacy` + krok licznika jak w `main.ts` `diploBrakeCrisisStep` → `crisisStepForPair`, kolejność: tik, potem licznik):

| scenariusz | warTriggerReady (N) |
|---|---|
| neutralna, W=0 (zaufanie stale 0) | tura 6 (N=6); tura 5 dla N=5 |
| neutralna, W=20, 20 tur | nigdy (dryf +0,66/tura zeruje licznik) |
| neutralna, W=100, 20 tur | nigdy (dryf +3/tura) |
| neutralna, kara granicy −3/tura, W=20 | tura 6 |
| neutralna, kara granicy −3/tura, W=100 (dryf +3 = kara, netto 0) | tura 6 |
| wojna (dowolne W) | nigdy (`crisisStepForPair` zwraca 0 przy `atWar`) |

Wniosek: reguła „zaufanie 0 przez N tur → wojna" jest nieosiągalna w neutralności WYŁĄCZNIE dla pary bez ujemnych czynników (dryf W×0,03 ≥ +0,6 zawsze podnosi zaufanie powyżej 0). Osiągalna jest, gdy ujemne czynniki (kara za wspólną granicę −3/−4/−5, `diplomacy.json`) przewyższają dryf. Patrz decyzja D1 niżej.

### Zarzut 2 (obserwacja 0→1 pochodziła z neutralności, nie z wojny) — PRZYJMUJĘ

Potwierdzone w evidence: `R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1/10-operator-claude.md`, wiersz S3: „status `neutralni`", „Po turze 1 licznik 5 … status `neutralni`". Wzrost 0→1 w grze = dryf Wiarygodności przy statusie neutralnym (`diplomacy.ts:1809-1810`), zgodnie z REL-WIARYG-DRIFT-Q1. Wspominanie `main.ts:12091` (P7) jako kandydata usuwam z wniosków: nie jest potwierdzone i nie jest potrzebne do wyjaśnienia obserwacji.

Nowe ustalenie (wnioskowane z kolejności wywołań, NIE_ZMIERZONO w grze): probe S3c ustawiał zaufanie na 0 PRZED każdą turą i odczytywał licznik 4→5→6. Licznik dla par gracz↔AI jest krokiem `runDiplomacyTurnTick` (`main.ts:24825`, wołany z `runWorldEndTurn` w `main.ts:39169`), a tik pary gracz↔AI z dryfem jest później w tej samej funkcji (`main.ts:42327`). Licznik więc czyta zaufanie sprzed dryfu tej tury. Przy naturalnej grze (bez ręcznego resetu) zaufanie po turze wynosi już +0,66 i licznik się zeruje. Czyli liczba „N=6 w grze" z probe S3 jest artefaktem harnessu, a nie zmierzonym zachowaniem naturalnej gry. Korekta do r1: punkt (d) „live" z LIVE-VERIFY należy traktować jako NIE_ZMIERZONO w naturalnym przebiegu.

### Zarzut 3 (kryterium b niedomknięte: ścieżki AI-AI, podgląd, guard factors) — PRZYJMUJĘ, uzupełnione cytatami

Wszystkie miejsca, w których `wiarygodnoscSelf` trafia do tiku lub podglądu zaufania:

- AI↔AI (tik): `main.ts:12029-12040` `tickDiploAiAiPairsWithBrake` (tik, potem `diploBrakeCrisisStep`). Kontekst: `main.ts:23349-23351`: `wiarygodnoscAiAi = isDiploTickWarBrakeEnabled() && !playerInPair && !atWar ? średnia : undefined`. W wojnie AI↔AI dostaje `undefined` — to drugi, niezależny guard (poza `diplomacy.ts:1809`).
- Gracz↔AI (tik główny): `main.ts:42327` `wiarygodnoscSelf: relStatus === 'wojna' ? undefined : getWiarygodnosc(ME())`.
- Podgląd / audience: `main.ts:25888` (`computeTickZaufanieDelta(tickCtxAudience, atWarAudience)`) i `main.ts:29693` (`previewDelta`). Te ścieżki NIE mają drugiego guardu: chroni je tylko `diplomacy.ts:1809` (`!atWar &&` w `computeTickZaufanieDelta`).
- Rozbicie wpływów (UI): `diplomacy-factors.ts:165-166` `if (!continuous.atWar && continuous.wiarygodnoscSelf !== undefined)` — ten sam warunek, osobna kopia.

Wniosek: w wojnie dryf jest blokowany dwukrotnie w tiku (`main.ts:23350` dla AI↔AI, `main.ts:42327` dla gracza) i raz w funkcji podglądu (`diplomacy.ts:1809`, także `diplomacy-factors.ts:165`).

### Zarzut 4 (kryterium d niedomknięte: brak testu na żywej ścieżce) — PRZYJMUJĘ częściowo

Kod (zmierzone wartości):
- Obowiązujące N w grze = `hamulecN` profilu: `main.ts:11876` przekazuje `{ ...diploTickP6, kryzysTurDoWojny: w.n }`, więc wartość `p6.kryzysTurDoWojny=5` z `diplomacy-tick-params.json` jest w ścieżce gry NADPISYWANA (martwa dla gry).
- `w.n` = `diploBrakeWarParams(a,b).n` (`main.ts:11859-11866`) = `hamulecRelacji` z `diplomacy-war-peace-params.json:104-111`: `clamp(round(bazaN − wagaProgWojny × dip_prog_wojny), minN=3, maxN=7)` = `clamp(round(8 − 0,5 × dip_prog_wojny), 3, 7)`. Domyślne `dip_prog_wojny = 5` daje `round(5,5) = 6` (JS: `Math.max(3, Math.min(7, Math.round(8-0.5*5)))` = 6). Zakres w zależności od profilu: 3–7.
- Off-by-one: brak. `warTriggerReady` = `counter >= N`, czyli wojna po N kolejnych turach zaufania ≤ 0 (test: N=5 → tura 5, N=6 → tura 6).
- Live: NIE_ZMIERZONO w naturalnym przebiegu (patrz zarzut 2 — probe S3 wymuszał zero).

### Zarzut 5 (test nie izoluje guardu `!atWar`) — PRZYJMUJĘ, naprawione w teście

Mutacja wykonana: usunięto `!atWar &&` w `gra/src/game/diplomacy.ts:1809` (`if (ctx.wiarygodnoscSelf !== undefined)`).
- Stary test (r1) i rozszerzony test bez asercji funkcji: PASS=9 FAIL=0 — mutacja PRZEŻYŁA. Powód: `tickDiplomacy` clampuje wynik (`diplomacy.ts:1865-1866` `clamp(rdip.zaufanie + dZ, 0, 100)`, potem `clampRelationForWar` `diplomacy.ts:1137-1141`), więc w wyniku tiku w wojnie guard jest nadmiarowy.
- Dodane asercje funkcji `computeTickZaufanieDelta(atWar=true, W=−20) === 0` i `(W=+20) === 0` (`computeTickZaufanieDelta` używana przez podgląd/audience `main.ts:25888, 29693`, więc guard ma realny skutek). Po mutacji: `FAIL: computeTickZaufanieDelta(atWar=true, W=-20) = 0` → PASS=10 FAIL=1 (mutacja WYCHWYCONA).
- Asercja `(W=+20)` NIE czerwieni się po mutacji (dodatni dryf w wojnie jest zerowany przez `if (atWar && dZ > 0) dZ = 0`, `diplomacy.ts:1830-1831`). Zapisane jako redundancja, nie jako izolacja.
- Źródło przywrócone: `git diff -- gra/src` puste (potwierdzone po przywróceniu; przed commitem).

### Zarzut 6 (DODATEK nieobecny) — PRZYJMUJĘ jako fakt

Patrz sekcja „Źródła wejścia". Zakres rundy wzięty z `00-dispatch.md` (commit `2dbfdc8a5`). NIE_ZMIERZONO: instrukcje DODATKU.

## Zmiany w tej rundzie

- `gra/tools/diplo-trust-war-drift-test.cjs` — rozszerzony (allowlista: nowy test):
  - scenariusze wojny z W=+20 i W=−20;
  - licznik kryzysu (`crisisStepForPair`, ta sama funkcja co `main.ts:11876`) dla N=6 i N=5, neutralna W=0 / W=20 / W=100, kara granicy −3 z W=20 i W=100, wojna;
  - asercje funkcji `computeTickZaufanieDelta` dla wojny (izolacja guardu).
- Produkcja (`gra/src/**`): BEZ ZMIAN (`git diff -- gra/src` puste). Uzasadnienie: nie znaleziono błędu w tiku; sprzeczność z intencją (zarzut 1) to DECISION_REQUIRED, nie błąd kodu.
- Raport: ten plik.

## Tabela tiku (a) — wynik surowy `node gra/tools/diplo-trust-war-drift-test.cjs`

| scenariusz | po t1 | po t3 | po t6 |
|---|---|---|---|
| wojna (W=undefined) | 0 | 0 | 0 |
| wojna (W=+20) | 0 | 0 | 0 |
| wojna (W=−20) | 0 | 0 | 0 |
| neutralna (W=20) | 0.66 | 1.98 | 3.96 |
| pokój (W=20) | 0.66 | 1.98 | 3.96 |

Wynik końcowy: `PASS=14 FAIL=0`, exit 0.

## Odpowiedź na pytanie (b) — przyczyna wzrostu 0→1

- W WOJNIE zaufanie nie rośnie: dryf pominięty przez `!atWar` (`diplomacy.ts:1809`), dodatkowo `main.ts:23350` (AI↔AI, `undefined`) i `main.ts:42327` (gracz, `undefined`), a wynik clampowany (`diplomacy.ts:1865-1866`, `clampRelationForWar` 1137-1141).
- Wzrost 0→1 w grze (probe S3, status `neutralni`) = dryf Wiarygodności W×0,03 (`diplomacy-credibility.ts:635-642`, parametr `wiarygodnoscZaufanieDryfNa100`), zgodnie z REL-WIARYG-DRIFT-Q1. Nie jest to błąd.

## DECYZJE WŁAŚCICIELA (DECISION_REQUIRED z liczbami)

D1. Reguła „zaufanie 0 przez N tur → wojna" a dryf W×0,03 w neutralności (krok 3 zasad). Z liczbami: dryf +0,6/tura (W=20), +3/tura (W=100), kara za granicę −3..−5/tura. Przy W=20 i bez ujemnych czynników wojna z zerowego zaufania NIE nastąpi nigdy; przy karze granicy −3 następuje w turze N. Opcje:
  - A) zostawić kod (dryf działa zawsze; wojna z zera tylko przy ujemnych czynnikach) i opisać to w Civpedii. REKOMENDACJA Operatora: A, bo dryf jest zatwierdzoną mechaniką (REL-WIARYG-DRIFT-Q1), a test pokazuje konkretnie, kiedy reguła działa.
  - B) wyłączyć dryf przy liczeniu licznika zerowego zaufania (zmiana w `main.ts` poza allowlistą tego tematu — wymaga zgody).
  - C) zmienić próg `kryzysProgZaufania` (poza zakresem tej rundy).

D2. N: obowiązuje w grze `hamulecN` profilu = 6 przy domyślnym `dip_prog_wojny=5` (zakres 3–7). Wartość `p6.kryzysTurDoWojny=5` w `diplomacy-tick-params.json` jest martwa dla gry (nadpisywana w `main.ts:11876`). Rekomendacja: zostawić 6; oznaczyć/usunąć martwe pole w osobnym temacie (bez zmiany wartości gry). Zmiana N = decyzja właściciela.

## Bramki

- Nie uruchomiono `tsc`, 5 bramek, `ai-test`, `diplomacy-test`, `diplo-weariness-*`, `diplo-war-peace-*`: NIE_WYKONANO. Powód: brak zmiany w `gra/src/**` (kryterium c dotyczy naprawy). Jeżeli FC wymaga bramek na kandydacie, uruchomię je w następnej rundzie.
- Test nowy: `node gra/tools/diplo-trust-war-drift-test.cjs` → `PASS=14 FAIL=0`.
- Mutacja (guard `!atWar` usunięty): przed dodaniem asercji funkcji `PASS=9 FAIL=0` (przeżyła); po dodaniu `PASS=10 FAIL=1` (wychwycona). Źródło przywrócone.

## ZMIANY/COMMIT

- `gra/tools/diplo-trust-war-drift-test.cjs` (zmodyfikowany, w allowliście) — commit obejmuje też ten plik, bo jest to poprawka zarzutu 5 (zakres: tylko ten plik + ten raport, `git add <ścieżka>`, bez `-A`).
- `dyspozycje/autobot/runs/R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1/30-obrona-claude.md` (ten raport).
- Produkcja: brak zmian.
- SHA: patrz pole `sha` w odpowiedzi StructuredOutput (commit tej rundy).

## BLOKADY

1. Brak DODATKU (zakres rundy) — orkiestrator musi potwierdzić zakres.
2. Naturalny przebieg licznika w grze (bez resetu zaufania) NIE_ZMIERZONO; probe S3 jest zanieczyszczony resetem.
3. Decyzje D1 i D2 wymagają właściciela.
4. Bramki na kandydacie nieuruchomione (brak zmiany src).

## RUNDY

2/5 — poprzedni werdykt Evaluatora: FAIL (ae9bffe54). Ta runda: odpowiedź na zarzuty 1–6. Ostateczny werdykt FC poza Operatorem.

## NASTĘPNY KROK

Evaluator: ponowna ocena testu (czy asercje funkcji wystarczają jako izolacja guardu) i D1/D2 jako DECISION_REQUIRED do właściciela. Bez zmian w `gra/src`.

UWAGI-DLA-ORKIESTRATORA:
- Zauważono rozbieżność dokumentacji: `R-WEB-DIPLO-LIVE-VERIFY-STEPS-1-4-Q1/10-operator-claude.md` (S3c) podaje „N=6 live" — wynik zależy od resetu zaufania w harnessie (zob. zarzut 2). Rekomendacja: poprawić opis tej pozycji w osobnym temacie dokumentacyjnym.
- Martwe pole `p6.kryzysTurDoWojny=5` (D2) — temat porządkowy do decyzji.

DEPLOY/PUSH: NIE WYKONANO
