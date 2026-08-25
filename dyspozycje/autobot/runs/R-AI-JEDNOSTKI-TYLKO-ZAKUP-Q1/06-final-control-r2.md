# 06 — FINAL CONTROL (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`
GOAL: AI nie buduje jednostek w kolejce produkcji miasta za Pracę — jednostki AI powstają
wyłącznie przez zakup za Skarbiec, wspólną ścieżką z graczem.

**Gotowość do integracji: TAK.** Piąty, niezależny worktree (`/home/user/wt-FC-R-AI-JEDN-r2`,
detached `918caa22`, świeży `node_modules` przez symlink do kanonu). Oba blokery rundy 1 (N1,
N2), które sam wystawiłem jako FAIL w `03-final-control.md`, zweryfikowałem od zera — N1
wyłącznie mutacją realnego `main.ts`, nie odczytem testu.

## N1 — dowód: zamknięty (zweryfikowany mutacją, nie kodem)

Wykonałem dwie WŁASNE mutacje na `git diff`-czystym drzewie (nie przez `git stash`/`checkout`,
tylko bezpośrednią edycją i przywróceniem, `git diff --stat` zerowe po każdej):

1. **Usunięcie wywołania guardu** w ticku per-miasto (`prod0BezLegacy = ...` + `if` niżej
   zastąpione komentarzem) → bramka **43 passed, 1 failed** — czerwienieje dokładnie D10
   („guard wołany PRZED `advanceProduction`"). Identyczny wynik jak Operatora M3 i
   Evaluatora MUT-2.
2. **`return migrated.prod` → `return prod`** wewnątrz `stripLegacyUnitsFromPracaQueue`
   (wszystkie kotwice tekstowe rundy 1 — `prod0.kolejka.some(...)`, `sanitizeBuildQueue(prod0)`
   — zostają w źródle nietknięte) → bramka **38 passed, 6 failed**: D1a, D1b, D4, D5,
   D-MUT2b, D13b. Identyczny wynik jak Operatora M1 i Evaluatora MUT-3.

To rozstrzyga sprawę z rundy 1: gdyby bramka nadal sprawdzała tylko tekst hunku (stare C2/C3,
faktycznie usunięte — potwierdzone `grep`), mutacja 2 przeszłaby na zielono mimo zepsutego
zachowania. Zamiast tego bramka wykonuje PRAWDZIWĄ treść funkcji wyciętą z bieżącego `main.ts`
(`extractFunction` po sygnaturze, nie po numerze linii) przez `new Function` na prawdziwych
`sanitizeBuildQueue`/`advanceProduction` — przeczytałem mechanizm i widzę, że nie da się go
oszukać samym tekstem. **N1 zamknięte.**

## N2 — zakres: zamknięty jako jawne, zmierzone odstępstwo

Sprawdziłem allowlistę w `00-dispatch.md`: `main.ts` jest ograniczony do „miejsc wołających
`purchaseRecruitmentUnit`/`tryDeductUnitSpawnCostsEmpire`". Nowy helper (linia 3626) i 2-liniowe
wywołanie w ticku (linia ~26719) formalnie wykraczają poza to dosłowne brzmienie — Operator tego
nie ukrył, nazwał to wprost i oddał decyzję orkiestratorowi, dokładnie jak wymagała runda 2.
Sprawdziłem u źródła: helper faktycznie stoi w tym samym bloku funkcji co
`purchaseRecruitmentUnit` (3461) i `sanitizeProductionQueue` (3586), a `advanceProduction` w
`production.ts` (odczytałem funkcję) rzeczywiście zwraca `completed: front` bez bramki `kind` i
banking `postep`/`overflowToPool` w sposób, który czyni wariant „guard wewnątrz
`advanceProduction`" bardziej inwazyjnym niż twierdzi Operator — reklamowana awaria
`promote-to-front-test` i podwójne liczenie zwrotu Cudu są więc wiarygodne strukturalnie, choć
nie przeliczyłem tego wariantu sam (nie było to wymagane rundą 2: obie poprzednie role już to
zmierzyły niezależnie, zgodnie).

**Rekomendacja (§10 — technika bez konsekwencji dla gry, decyduje orkiestrator, nie właściciel):**
przyjąć 2-liniowe wywołanie w `main.ts` jako opisane odstępstwo od allowlisty, bez rozszerzania
jej formalnie ani bez ABC. Uzasadnienie: (a) zero wpływu na gameplay/balans/UX — sam mechanizm
ochronny, nie decyzja produktowa; (b) jedyna zmierzona alternatywa (`production.ts`) jest gorsza
i sama leży całkowicie poza jakąkolwiek allowlistą; (c) zakres pozostaje wąski — 2 linie
wywołania + nazwana funkcja w tym samym bloku co już-dozwolone funkcje. **N2 zamknięte.**

## Niezależna weryfikacja reszty (nie tylko N1/N2)

- `tsc --noEmit`: **0 błędów**. `vite` przez binarkę `node_modules`, `--outDir /tmp` (C-001):
  **✓ 20,46 s**.
- 5 bramek referencyjnych: **213/213, 19/19, 33/33 ALL GREEN, 13/13, 6/6**.
- Bramka tematu: **44/44**. Wszystkie 31 bramek `ai-*` (uruchomione pojedynczo, z osobna) +
  `rekrutacja-skarbiec-only` **13/13** + `surrender-rekrutacja-build-gate` **11/11**: zielone co
  do liczby zgodnie z raportami. Cztery czerwone pre-istniejąco — **liczby identyczne**:
  `ai-test` **285/8**, `ai-recruit-upkeep-gate` **18/9**, `ai-balans-step3` **7/1**,
  `promote-to-front` **121/4**. Zero nowych czerwieni, zero regresji.
- `git diff --check` czysty. `git merge-base origin/main HEAD` = `7e53fdb5` (zgodne z dispatchem).
- Próbne merge (`git merge-tree --write-tree`, exit 0, bez konfliktu) z:
  **`origin/main`** (dziś na `9c6eef00`, poza bazą dispatchu — scala się czysto mimo to),
  **`origin/autobot/R-PRACA-JEDEN-PODZIAL-Q1`**, **`origin/autobot/P-BUDOWA-MENU-ULEPSZEN-NIE-SCROLLUJE-Q1`**
  — obie gałęzie istnieją na `origin` i zażądane w tej rundzie były sprawdzone jawnie.
- `gra/data/**`, `WERSJE.md`, `production.ts`, ścieżka gracza: diff pusty na całym zakresie
  `7e53fdb5..HEAD`. Żadna granica §9 nienaruszona: brak `npm run build/dev`, brak `git add -A`,
  brak sekretów, brak mieszania procesu z produktem, `WERSJE.md` nietknięty, diff liczony od
  właściwego merge-base.

## Uwagi rundy 2 — żadna nie blokuje (§3b: nie dotyczą GOAL/dowodu/zakresu/granic)

- **N-A (Evaluator)** — słuszna, ale to hardening testu na PRZYSZŁY refaktor (scenariusz
  „wywołanie zostaje, wynik wyrzucony"), nie luka w dowodzie DZISIEJSZEGO kodu: sam sprawdziłem
  odczytem wywołania w `main.ts`, że wynik JEST przypisywany i zapisywany do `cityProd`. Nie
  koduję tego jako osobnej asercji — to jest zmiana testu, nie „drobiazg tekstowy", i nie była
  częścią zakresu rundy 2 (N1/N2). Do rejestru dla przyszłego tematu/refaktoru.
- **N-B (Evaluator, docstring)** — naprawiłem sam jako integration micro-fix (komentarz,
  zero zmiany zachowania): dopisałem do docstringu `stripLegacyUnitsFromPracaQueue`
  w `main.ts`, że ścieżka wczytania zapisu jest już sanityzowana (`setCityProduction` →
  `sanitizeProductionQueue`) i że realna wartość guardu to obrona w głąb nad wieloma
  miejscami `cityProd.set(...)` w pliku, nie wyłącznie „stary zapis". Zweryfikowałem po
  zmianie: `tsc --noEmit` 0 błędów, bramka tematu nadal 44/44, `git diff --check` czysty.
- **N-C, N-D, N-E, N-F** — kosmetyczne/informacyjne uwagi Evaluatora (drobna nieścisłość
  cytatu GOAL w raporcie Operatora, długość raportów, krucha kotwica regex D11 na przyszłość,
  efekt uboczny `ai-balans-step2-smoke.cjs` w drzewie) — potwierdzam ich trafność, ale nie
  wymagają zmiany kodu ani testu; do wpisu w rejestrze przez orkiestratora, nie do naprawy
  w tym runie.
- Otwarte pytanie ABC z §7 raportu Evaluatora (runda 1) — nadal nierozstrzygnięte, poza moim
  mandatem tej rundy (dotyczy premisy dispatchu, nie N1/N2); do orkiestratora/właściciela.

ZMIANY/COMMIT: `gra/src/main.ts` (wyłącznie docstring, +5 linii komentarza, zero zmiany
zachowania) — mój micro-fix N-B na tym runie. Reszta bez zmian względem `918caa22`
(Operator+Evaluator runda 2). Commit tego raportu + micro-fixu: `81a89e3e`, na `918caa22`,
wypushowany na `autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`.
TESTY: opisane wyżej, wszystkie uruchomione niezależnie w `/home/user/wt-FC-R-AI-JEDN-r2`
(świeży worktree od `918caa22`, nie od raportu Operatora ani Evaluatora).
BLOKADY: brak. Do orkiestratora: decyzja N2 (rekomendacja: przyjąć 2 linie jako odstępstwo,
bez ABC — kategoria §10 „technika bez konsekwencji"); wpis rejestrowy dla N-C/N-D/N-E/N-F;
routing pytania ABC z rundy 1.
RUNDY: 2/5. Temat gotowy do integracji orkiestratora (Sonnet 5 Medium) po tym raporcie.
NASTĘPNY KROK: integracja orkiestratora → `READY_FOR_DEPLOY` (jeśli integracja czysta) →
osobna, jawna autoryzacja deploy/push.
DEPLOY/PUSH: NIE WYKONANO. Push wyłącznie gałęzi roboczej `autobot/R-AI-JEDNOSTKI-TYLKO-ZAKUP-Q1`;
`main` nietknięty.
