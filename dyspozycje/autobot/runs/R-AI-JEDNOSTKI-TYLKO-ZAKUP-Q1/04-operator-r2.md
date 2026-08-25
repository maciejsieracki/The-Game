# 04 — OPERATOR (runda 2)

STATUS: PASS
DOMAIN: GAME
TEMAT: `R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`
GOAL: AI nie buduje jednostek w kolejce produkcji miasta za Pracę — jednostki AI powstają
wyłącznie przez zakup za Skarbiec, wspólną ścieżką z graczem. Ustalić, czy dzisiejszy stan
jest regresem wobec FALI 299, i przywrócić kontrakt.
(brzmienie sprawdzone słowo w słowo z `00-dispatch.md` — §16a pkt 9, brak dryfu)

Zakres rundy 2 = dokładnie dwie uwagi: **N1 (dowód)** i **N2 (zakres)**. Nic poza tym.

## N1 — tautologiczny test zastąpiony behawioralnym

Guard był blokiem inline w pętli tury, więc nie dało się go wykonać w teście — stąd `grep`
po własnym tekście. Wydzieliłem go do nazwanej funkcji `stripLegacyUnitsFromPracaQueue`
(`main.ts:3626`, obok kanonicznej `sanitizeProductionQueue`); w ticku został sam wywołanie.
Nowa **sekcja D** bramki wycina PRAWDZIWĄ treść tej funkcji z bieżącego `main.ts` i wykonuje ją
przez `new Function` na prawdziwej `sanitizeBuildQueue`, po czym puszcza wynik przez prawdziwy
`advanceProduction` (wzorzec kanoniczny repo: `road-hook-mainguard-test.cjs` §2/§3).

Scenariusz = stan ze starego zapisu: Wojownik na froncie kolejki Pracy, 7 zebranej Pracy,
za nim budynek, opłacona kolejka rekrutacji. Asercje: **(a)** jednostka znika (D1),
**(b)** 7 Pracy wraca do puli właściciela (D2), **(c)** żadna jednostka nie kończy się za Pracę
przez 3 realne ticki (D4). D7 pokazuje, że BEZ guardu ten sam stan faktycznie kończy Wojownika
za Pracę — czyli D4 coś mierzy. D8: identyczny wynik dla gracza (0), AI (7) i MP (9).

Mutacje **rzeczywistego `main.ts`** (nie kopii), wyniki surowe:

| Mutacja | Czerwienieje |
|---|---|
| M1: guard zachowuje CAŁY tekst kotwic rundy 1, ale zwraca `prod` zamiast `migrated.prod` | **D1a, D1b, D4, D5, D13b** — 38/6 |
| M2: guard usunięty z `main.ts` | D0, D1a, D2, D4 — 24/4 |
| M3: guard istnieje, ale nie jest wołany w ticku | D10 — 43/1 |

M1 jest rozstrzygające: kotwice rundy 1 (`prod0.kolejka.some(...)`, `sanitizeBuildQueue(prod0)`)
zostają w źródle i **przeszłyby na zielono**, a zachowanie jest zepsute. Stare C2/C3 usunięte.

**D13 = dokładny zrzut właściciela** („Wojownik · Koszt: 40 · Zebrana Praca: 2/40"), z liczbami
wskazanymi przez Final Control (§3/§5 raportu 03): bez guardu `unitsCompletedFromPraca` **1**,
`refunded` **0**; z guardem **0** i **2**. Zacommitowane jako asercja, nie jako zdanie w raporcie.

## N2 — zakres rozstrzygnięty: świadome, opisane odstępstwo (nie milczenie)

**Werdykt: logika zostaje w `main.ts`, ale przeniesiona do regionu objętego allowlistą.**
Allowlista nazywa `purchaseRecruitmentUnit` (3461) i `tryDeductUnitSpawnCostsEmpire` (3391/3509);
helper stoi w tym samym bloku (3626), obok `sanitizeProductionQueue`. W ticku (26715) zostały
**2 linie kodu** wywołania — i to jest odstępstwo, które zgłaszam jawnie.

Dlaczego to miejsce, z pomiarem zamiast opinii:
1. `advanceProduction` ma dziś **dwóch** odbiorców. `allocateEmpirePracaToBuildings`
   (`production.ts:1940`) ma już bramkę `kind`. Tick per-miasto to **jedyny** niebroniony punkt
   zużycia — bramka D11 pilnuje, że w `main.ts` istnieje dokładnie jedno takie wywołanie.
2. Wariant „warstwa gry" (guard wewnątrz `advanceProduction`) **zmierzyłem**: czerwieni
   4 dziś ZIELONE asercje `promote-to-front-test` i psuje księgowanie zbankowanej Pracy Cudu
   (510 zamiast 500 — zwrot liczony dwa razy), plus A2/D7 w bramce tematu. Wymagałby też
   przepchnięcia zwrotu przez `overflowToPool`, czyli zmiany kontraktu funkcji.
   To **większe** odstępstwo (`production.ts` nie jest w allowliście w ogóle) i większy promień rażenia.

Do decyzji orkiestratora: przyjąć te 2 linie w ticku, albo poszerzyć allowlistę wprost.

ZMIANY/COMMIT: `gra/src/main.ts` (helper + wywołanie), `gra/tools/ai-jednostki-tylko-zakup-test.cjs`
(sekcja D, usunięte C2/C3). Commity rundy 2: `f5a1a67f` + `ea8857f2` (D13), na `6c339fee`. Zero zmian w `gra/data/**`, `WERSJE.md`, ścieżce gracza, `production.ts`.
`git diff --check` czysty; `merge-base` z `origin/main` = `7e53fdb5`.

TESTY: `ai-jednostki-tylko-zakup-test` **44/44** · `tsc --noEmit` **0 błędów** ·
`vite build` (C-001, `--outDir` poza repo) **✓ 23,40 s** · bramki referencyjne §6:
**213/213, 19/19, 33/33, 13/13, 6/6** · 31 bramek `ai-*` + `rekrutacja-skarbiec-only` **13/13**,
`surrender-rekrutacja-build-gate` **11/11**, `promote-to-front` **121/4**. Czerwone
pre-istniejąco, liczby co do sztuki jak w rundzie 1: `ai-test` 285/8, `ai-recruit-upkeep-gate`
18/9, `ai-balans-step3` 7/1, `promote-to-front` 121/4. **Zero regresji, zero nowych czerwieni.**

BLOKADY: brak technicznych. Do rozstrzygnięcia przez orkiestratora: N2 (2 linie wywołania
w ticku). Do właściciela: pytanie ABC z §7 raportu Evaluatora — nadal otwarte, nie moje.

POZA ZAKRESEM RUNDY 2 (świadomie nietknięte, zgodnie z dyspozycją): uwagi (a)/(b)/(c),
cztery pre-istniejące czerwone bramki, N3 (duplikat wobec `sanitizeProductionQueue` — jednolinijkowe
uproszczenie, ale nie jest ani N1, ani N2), N7 (scenariusz „ubogie AI" do bramki albo poza tabelę).
Raport `03-final-control.md` (rundy 1) był w chwili startu tylko na `origin` — dociągnąłem go
i przerebasowałem tę rundę na `6c339fee`, żeby ślad runu był kompletny i liniowy.

RUNDY: 2/5.
NASTĘPNY KROK: Evaluator (runda 2), następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO. Push wyłącznie gałęzi roboczej `autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`; `main` nietknięty.
