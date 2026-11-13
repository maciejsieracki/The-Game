# R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1 — Obrona Operatora (odpowiedź na zarzuty Evaluatora, runda 1)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1
GOAL: przepisać gra/tools/diplo-war-peace-sim-test.cjs tak, by sprawdzał zatwierdzone zachowanie kodu (3 FAIL na bazie: S3, S4b, M_TUR), bez osłabiania asercji. Kryterium (a) 22/22 zależy od decyzji właściciela (A/B/C) o bramce pokoju AI w turach 7-9 (S7b, poza allowlistą kod ai.ts).
BAZA: f0c32fe1e (origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0, raport Operatora 10-operator-claude.md). Checkout: `git checkout --detach f0c32fe1e`.
ZMIANY-COMMIT: patrz sekcja "Commit" na końcu (jeden commit: gra/tools/diplo-war-peace-sim-test.cjs + ten raport). Kod gry (gra/src, gra/data) nietknięty.

## Odpowiedzi na zarzuty Evaluatora (45d42fb35)

| Nr | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Kryterium 22/22 niespełnione (19/3) | PRZYJMUJĘ jako fakt; poprawiłem wszystko, co nie zależy od decyzji. Po poprawkach: 23 pass / 1 fail. Jedyny FAIL to S7b, świadomie zostawiony czerwony (patrz niżej). | Surowe wyjście `node tools/diplo-war-peace-sim-test.cjs` poniżej. |
| 2 | Operator nie zrobił części test-side (regex, S3, S4b, M_TUR) | PRZYJMUJĘ i wykonałem w tym commicie: regex `isTooEarly`, S3 przepisane, S4b przeniesione na turę 10, mutanty M_GATE i M_STRONG dopisane dla przepisanych scenariuszy. | `git diff --stat`: 1 plik, 29+/6-. |
| 3 | Ścieżka 00-dispatch.md nie istnieje na origin/main | PRZYJMUJĘ jako uwagę dokumentacyjną. Treść odczytano z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (plik tam istnieje). Rozstrzyga orkiestrator. | `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1/00-dispatch.md` zwraca dispatch. |

## Zmiany w teście (wyłącznie gra/tools/diplo-war-peace-sim-test.cjs)

| Scenariusz | Przyczyna starego FAIL | Zatwierdzona reguła (dispatch) | Nowa asercja |
|---|---|---|---|
| S3 | Test oczekiwał „czuje się silniejsze" w turach 7-9. Kod zwraca „Pokój i rozejm dostępne po 10 pełnych turach wojny", bo `peaceProposalBlocked` (diplomacy-proposals.ts:1131-1133) wyprzedza bramkę siły. | „pierwsze propozycje pokoju od tury 10" | Tury 7-9 dla silnej AI bez utraty: powód pasuje do `/po 10 pełnych turach/`. Mutant: M_GATE. |
| S4b | Kontrola w turze 8 trafia w bramkę czasu (8 < 10). | jw. | Kontrola przeniesiona na turę 10 (`pvs[9]`, pierwsza tura po bramce): powód „militarnie silniejsza". Mutant: M_STRONG. |
| M_TUR | (1) Regex `/za wcześnie/` nie trafia w tekst kodu, więc `earlyViolations` zawsze 0 i S7b jest puste. (2) Mutant rzeczywiście składa propozycję w turze 1 (`t:1`). | „AI nie proponuje pokoju przed 10 turą" | Regex `isTooEarly` = `/za wcześnie|po 10 pełnych turach/`. Mutant bez zmian (wykrywa t=1). |

Nowe mutanty (kryterium c):
- M_GATE: `PEACE_PROPOSAL_MIN_WAR_TURNS = 10` → `= 1` (diplomacy-peace-proposal-timing.ts). Wykrywa S3.
- M_STRONG: `if (r5Gate.verdict === 'stronger') {` → `if (false) {` (diplomacy-proposals.ts). Wykrywa S3b/S4b. Każdy mutant ma sprawdzenie `applied === 1` w check (0).

## Świadomie czerwone: S7b (błąd w KODZIE, decyzja właściciela)

S7b („AI nigdy nie proponuje pokoju w stanie 'za wcześnie'") nie zostało osłabione. Po poprawce regexu wykrywa realne naruszenie zatwierdzonej reguły: AI składa `zaproponuj_pokoj` w turach 7-9. Przyczyna: `ai.ts` `aiPeaceTimeOk = turnsAtWarRel >= warProfile.minTurWojny` (zulusi = 7), a gracz ma bramkę globalną 10. Pierwsze 5 naruszeń z surowego wyjścia:
`[{"rw":0.2,"lost":0,"t":7},{"rw":0.2,"lost":0,"t":8},{"rw":0.2,"lost":0,"t":9},{"rw":0.2,"lost":1,"t":7},{"rw":0.2,"lost":1,"t":8}]`

Ta sama rozbieżność dotyka S1: test nadal oczekuje propozycji AI od tury 7 (zgodne z obecnym kodem, sprzeczne z „od tury 10"). S1 NIE zostało zmienione, bo to decyzja A/B/C z raportu 10-operator:
- A (rekomendacja Operatora): AI od tury 10 → S1 zmienić na tury 10,13,16...; S7b zielone.
- B: bramka per cywilizacja (zmiana gracza) → S3/S4b/S7b do przepisania po decyzji.
- C: rozbieżność zamierzona → S7b przepisać jako oczekiwanie „AI od minTurWojny".

## Wynik testu (surowe wyjście, po zmianach)

```
PASS: (0) każdy mutant podmienił dokładnie 1 miejsce
PASS: S1 ... (zulusi: tury 7,10,13,16,19,22,25,28)
PASS: S1a / S1b / S2 / S2b
PASS: S3: gracz (silna AI, bez utraty) w turach 7-9 dostaje odrzucenie czasowe „po 10 pełnych turach wojny"
PASS: S3b / S3c / S4 / S4b (kontrola: tura 10)
PASS: S5 / S5b / S6 / S6b / S7
FAIL: S7b: spójność — AI nigdy nie proponuje pokoju w stanie „za wcześnie" — [pierwsze 5 naruszeń jak wyżej]
PASS: M_SIG / M_FEEL / M_WEAR / M_TUR (wykryty: t=1)
PASS: M_GATE wykryty: bramka czasu gracza zdjęta do 1 tury — S3 (tury 7-9) nie dostaje już odrzucenia czasowego
PASS: M_STRONG wykryty: bez odrzucenia „militarnie silniejsza" gracz dostaje odrzucenie inne niż siła w turze 10
PASS: M_HEALTH (przeniesiony)

diplo-war-peace-sim-test: 23 pass / 1 fail
```

Baza f0c32fe1e przed zmianami (ta sama komenda, surowe wyjście Operatora): `19 pass / 3 fail` (S3, S4b, M_TUR).

Kontrola składni: `node --check tools/diplo-war-peace-sim-test.cjs` → OK. `git diff --check` → czysto.

## TESTY i BRAMKI

- Test celowy: 23 pass / 1 fail (S7b). Kryterium (a) 22/22: NIESPEŁNIONE, wymaga decyzji właściciela.
- Kryterium (c) mutacje: każdy przepisany scenariusz ma mutant, który go czerwieni (M_GATE → S3, M_STRONG → S3b/S4b, M_TUR → S7b/S1). Zachowane istniejące mutanty.
- tsc 0, 5 bramek, diplomacy-test 149/0, ai-test 297/0: NIE_ZMIERZONO. Powód: zmiana dotyczy tylko pliku narzędziowego tools/*.cjs, kod gry (gra/src, gra/data) nie zmieniony; bramki nie zmieniają się przez ten commit.

## BLOKADY

- DECISION_REQUIRED: S7b czerwone, bo `ai.ts` (poza allowlistą) używa `minTurWojny` (zulusi 7) zamiast zatwierdzonej bramki „od tury 10". Wymagana decyzja właściciela A/B/C (raport 10-operator-claude.md).
- Po decyzji A: runda 2 (Haiku) — S1 na tury 10+, S7b zielone, kryterium 22/22 do sprawdzenia.

## RUNDY

1/5 (obrona). Werdykt Evaluatora r1: PASS-WITH-NOTES. Ta odpowiedź: 3 zarzuty przyjęte (1 częściowo, 2 w pełni, 3 jako uwaga).

## UWAGI-DLA-ORKIESTRATORA

- Ścieżka `00-dispatch.md` w zadaniu wskazuje origin/main, a pliku tam nie ma (zarzut 3). Dispatch jest na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.
- Zadanie #352 (dług sim) zostaje in_progress do decyzji A/B/C. Powiązane: #372 (bramka pokoju AI liczy słabość respektem, nie siłą militarną).
- Zgodnie z dispatchem nie zmieniano ai.ts ani diplomacy-*.ts; mutanty M_GATE/M_STRONG działają tylko w bundlach testowych.
- Zainstalowano `gra/node_modules` (npm ci) w worktree na potrzeby testu. Usunięto po zakończeniu.

## NASTĘPNY KROK

Decyzja właściciela A/B/C dla bramki pokoju AI (ai.ts minTurWojny vs PEACE_PROPOSAL_MIN_WAR_TURNS). Po decyzji: runda 2 zgodnie z wybraną opcją.

## Commit

Commit obejmuje wyłącznie: `gra/tools/diplo-war-peace-sim-test.cjs` oraz `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1/30-obrona-claude.md`. Push nie wykonany.

DEPLOY/PUSH: NIE WYKONANO
