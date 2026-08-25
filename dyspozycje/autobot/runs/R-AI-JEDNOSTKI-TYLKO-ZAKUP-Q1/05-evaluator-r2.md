# 05 — EVALUATOR (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`
GOAL: AI nie buduje jednostek w kolejce produkcji miasta za Pracę — jednostki AI powstają
**wyłącznie przez zakup za Skarbiec** (pieniądze z podatków), wspólną ścieżką z graczem.
Ustalić, czy dzisiejszy stan jest regresem wobec decyzji FALI 299, i przywrócić kontrakt.

Czwarty, własny worktree `/home/user/wt-EVAL-R-AI-JEDN` (detached `6bab84b9`). Każda liczba
niżej pochodzi z uruchomienia u mnie. Zakres oceny: wyłącznie **N1 (dowód)** i **N2 (zakres)**.

## 1. N1 — test jest naprawdę behawioralny (4 własne mutacje realnego `main.ts`)

| Moja mutacja | Bramka | Czerwienieje |
|---|---|---|
| MUT-1: helper **i** wywołanie usunięte | **23/5** | D0, D1a, D2, D4, D10 |
| MUT-2: helper zostaje, wywołanie usunięte | **43/1** | D10 |
| MUT-3: `return prod;` zamiast `return migrated.prod;` | **38/6** | D1a, D1b, D4, D5, D-MUT2b, D13b |
| MUT-4: wywołanie zostaje, **wynik wyrzucony** | **44/0 — ZIELONE** | nic (N-A niżej) |

MUT-3 rozstrzyga: hunk zachowuje pełny tekst kotwic rundy 1, zachowanie jest zepsute, bramka
czerwieni 6 asercji — stara bramka przepuściłaby to. Sekcja D wykonuje **prawdziwą** treść
`stripLegacyUnitsFromPracaQueue` wyciętą z `main.ts` (`new Function`) na prawdziwych
`sanitizeBuildQueue`/`advanceProduction`. C2/C3 faktycznie usunięte; C4–C6 dotyczą kodu spoza tej
zmiany, więc nie są tautologiami. **N1 spełnione.**

Postęp wraca do puli, nie znika — dwie drogi: D2/D13c (7 i 2 Pracy) oraz odczyt
`setOwnerPracaPool` (`main.ts:23321`): owner 0 → `playerPracaPool`, reszta → `aiPracaPoolByOwner`,
realnie konsumowana przez utrzymanie i budżet budynków AI/MP (`26996/27015/27048`) — nie ślepy zlew.

Parytet gracz/AI/MP sprawdziłem strukturalnie, nie tylko przez D8: wywołanie stoi w pętli
`for (const city of cities)` (`main.ts:26398`), a w zakresie 26398–26716 **nie ma żadnego filtru
właściciela ani `continue`** — guard biegnie dla gracza, majora AI i MP identycznie.

## 2. N2 — rozstrzygnięte jawnie, uzasadnienie zweryfikowane pomiarem

Operator nie przemilcza sprawy: nazywa 2 linie wywołania (`main.ts:26721-26722`) świadomym
odstępstwem i oddaje decyzję orkiestratorowi. **Odtworzyłem odrzucony wariant „warstwa gry"**
(bramka `kind` wewnątrz `advanceProduction`): `promote-to-front-test` przewraca się z `TypeError`
(Cud gubi 500 zbankowanej Pracy), bramka tematu spada do 39/5 — wariant gorszy, w pliku
**w ogóle nieobjętym allowlistą**. Werdykt Operatora oparty na pomiarze, nie na preferencji.
**N2 spełnione w formie dopuszczonej dyspozycją rundy 2.** Formalna decyzja (przyjąć 2 linie czy
poszerzyć allowlistę) należy do orkiestratora.

## 3. Regresja, zakres, granice §9

`git diff origin/main...HEAD --numstat`: `main.ts` **46/0 — czysto addytywnie**; nowy plik bramki;
`gra/data/**`, `WERSJE.md`, `production.ts`, ścieżka gracza nietknięte. Bramka tematu **44/44**;
`tsc --noEmit` **0**; `vite build` przez binarkę `node_modules`, `--outDir /tmp/civ-dist-eval-r2`
(C-001) **✓ 21,84 s**; referencyjne **213/213, 19/19, 33/33 ALL GREEN, 13/13, 6/6**; wszystkie 32
bramki `ai-*` + `rekrutacja-skarbiec-only` 13/13, `surrender-rekrutacja-build-gate` 11/11,
`ai-rekrutacja-parytet` 7/7, `ai-praca-split-parity` 19/19, `ai-mp-rekrutacja-build-gate` 21/21.
Czerwone co do sztuki jak w rundzie 1: `ai-test` 285/8, `ai-recruit-upkeep-gate` 18/9,
`ai-balans-step3` 7/1, `promote-to-front` 121/4 — **zero nowych czerwieni**; (a)/(b)/(c) i cztery
pre-istniejące czerwienie nietknięte (dowodzi tego addytywny diff). Próbny merge
(`merge-tree --write-tree`): z `origin/main` `a79614db` czysto, z `autobot/R-PRACA-JEDEN-PODZIAL-Q1`
`f4ab424c` czysto. §9: żadna granica nienaruszona (`merge-base` jawny: `7e53fdb5`).

## 4. Uwagi — żadna nie blokuje

- **N-A.** MUT-4: gdy guard jest wołany, ale wynik wyrzucony, wyciek wraca w całości, a bramka
  świeci 44/44. D10 pilnuje obecności i kolejności wywołania, nie przypisania zwrotu; `tsc` też nie
  (`noUnusedLocals` wyłączone). Domknięcie to jedna asercja obok D10, np.
  `/const prod0BezLegacy = stripLegacyUnitsFromPracaQueue\([^;]*\);\s*if \(prod0BezLegacy !== prod0\)/`
  — kotwica na **wpięciu**, nie na własnym tekście hunku, więc nie ta klasa, którą FC odrzucił w rundzie 1.
- **N-B.** Docstring wskazuje „stary zapis", ale ścieżka wczytania już go sanityzuje
  (`main.ts:32101` → `setCityProduction` → `sanitizeProductionQueue`). Realna wartość guardu to
  obrona w głąb nad ~12 miejscami piszącymi `cityProd.set(...)` bez sanityzacji + efekt kolejności
  zmierzony przez FC. Zdanie w docstringu warto poprawić przy integracji.
- **N-C (§16a pkt 9).** „sprawdzone słowo w słowo", a z GOAL wypadło „(pieniądze z podatków)" —
  bez dryfu znaczeniowego, zgłaszam bo kontrakt każe zgłaszać każdą rozbieżność cytatu.
- **N-D (§11).** Raport Operatora ~700 słów wobec orientacyjnych 400 (ten raport ~830 — zgłaszam obie, nie tylko cudzą).
- **N-E.** D11 (`/advanceProduction\(/g` === 1) zaczerwieni się od zwykłego komentarza z nawiasem.
- **N-F (dla integratora).** `ai-balans-step2-smoke` modyfikuje w drzewie
  `docs/decyzje/AI-BALANS-STEP2-SMOKE.md` (efekt uboczny pre-istniejący) — nie commitować.

## 5. Dlaczego `PASS-WITH-NOTES`

Oba blokery rundy 1 zamknięte: N1 dowodem wykonywanym, N2 jawnym, zmierzonym odstępstwem.
Kryterium rundy („usunięcie guardu MUSI zaczerwienić te asercje") spełnione literalnie
(MUT-1/2/3). N-A nie jest luką w dowodzie **bieżącego** drzewa — wpięcie zweryfikowałem odczytem
kodu i D10 — lecz utwardzeniem bramki przeciw przyszłemu refaktorowi: ryzyko niskie, naprawa
jednolinijkowa. Dlatego uwagi klasyfikuję jako nieblokujące i nie zużywam rundy 3. Rozstrzyga
Final Control: albo N-A jako micro-fix przy kontroli (z weryfikacją, że MUT-4 wtedy czerwienieje),
albo — jeśli uzna to za dotknięcie „dowodu" wg §3b — powrót do Operatora z dokładnie tą jedną
linią. N-B…N-F są kosmetyczne i wymagają wpisu do rejestru przez orkiestratora (§3b).

ZMIANY/COMMIT: Evaluator nie zmienia kodu ani testów. Mutacje MUT-1…MUT-4 i kontr-wariant N2
wykonane tylko w moim worktree i wycofane (`git status` czysty). Ten raport: `05-evaluator-r2.md`
na `autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`, na `6bab84b9`.
TESTY: §1 i §3 wyżej, uruchomione niezależnie w `/home/user/wt-EVAL-R-AI-JEDN`.
BLOKADY: brak. Do orkiestratora: N2 (2 linie w ticku poza literalną allowlistą) + wpis rejestrowy
dla uwag kosmetycznych. Do Final Control: sposób domknięcia N-A. Pytanie ABC z rundy 1 nadal otwarte.
RUNDY: 2/5.
NASTĘPNY KROK: Final Control (runda 2).
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi roboczej; `main` nietknięty).
