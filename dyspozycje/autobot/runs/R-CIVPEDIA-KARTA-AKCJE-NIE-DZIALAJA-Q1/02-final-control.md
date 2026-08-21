# 02-final-control — R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1

```
STATUS: PASS
TEMAT: R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1
GOAL: przyciski akcji „Rozpocznij badanie" i „Otwórz drzewo" w karcie odkrycia/
      podglądu technologii MUSZĄ realnie reagować na kliknięcie w prawdziwej
      przeglądarce — naprawić prawdziwą przyczynę na `main` (branch), nie
      tylko w bundlu.
```

## Zakres weryfikacji

Osobny subagent (Final Control), niezależny od Operatora/Evaluatora. Worktree
`.claude/worktrees/wf_74ec3695-be5-1`, branch
`autobot/R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1`, HEAD
`a3ec60463d283b6afbd2d29631d1654cd8ee0a97` (working tree czysty przez cały
audyt, zweryfikowano `git status --short` na końcu).

### 1. Zakres diffu (uwaga proceduralna)

`git diff main..HEAD -- gra/` w chwili audytu pokazywał 12 plików / ~500 linii —
ale to dlatego, że lokalny `main` poszedł naprzód (zmerge'owane
`R-SCIENCEHUB-KLIK-WIERSZA-ENQUEUE-Q1`, `R-UI-WYKONAJ-DECYZJA-OVERLAP-Q1`,
`R-TECHTREE-SCIENCEPICKER-JEDNOSTKI-STALE-Q1` — niezwiązane tematy) od czasu
gdy ten branch się odgałęził. Właściwy zakres to
`git diff $(git merge-base main HEAD)..HEAD -- gra/` (merge-base =
`186bb6da`, punkt rozgałęzienia): dokładnie 5 plików —
`gra/src/ui/techDiscoveryNotice.ts` (+18/−2), dwa nowe pliki testowe
(`gra/tools/tech-discovery-card-click-test.cjs`,
`gra/tools/tech-discovery-card-real-click-test.cjs`) i dwa nowe stuby
(`gra/tools/.stubs/tech-discovery-click-{brandAssets,scienceOwlIcon}-stub.ts`).
Zero zmian w `entityCards/renderer.ts` (T4 nietknięty, jak deklarował
Operator). Zero zmian w danych (`tech.json` i inne).

Sam commit naprawy (`a3ec6046`) to jedna linia CSS:
`#${HOST_ID} .entity-card{...}` → dodane `position:relative;` na początku
reguły, plus obszerny komentarz wyjaśniający mechanizm. Diagnoza (przyczyna:
`.tdn-back{position:fixed}` tworzy kontekst stackowania na "stack level 0"
niezależnie od z-index; `.entity-card` bez własnego `position` maluje się w
CSS2.1 Appendix E kroku 3, czyli PRZED/POD tłem malowanym w kroku 6, mimo
że jest później w DOM) jest poprawna i w pełni zgodna z zachowaniem, które
sam zaobserwowałem w kroku 3 niżej.

### 2. Statyczne bramki

- `cd gra && npx tsc --noEmit` — **0 błędów.**
- `node tools/tech-tree-test.cjs` — 19/19 (zgodne z referencją).
- `node tools/research-test.cjs` — 33/33 (zgodne z referencją).
- `node tools/unit-replace-test.cjs` — 13/13 (zgodne z referencją).
- `node tools/combat-test.cjs` — 6/6 (zgodne z referencją).
- `node tools/logic-test.cjs` — 213/213 (zgodne z referencją).
- `node tools/technology-discovery-card-visual-test.cjs` — 48/48 (bez regresu).
- `node tools/entity-card-contract-test.cjs` — 75/75 (bez regresu we
  współdzielonym `entityCards/renderer.ts`).
- `node ./node_modules/vite/bin/vite.js build --outDir <tmp> --emptyOutDir` —
  sukces, 844 moduły, 0 błędów. Zweryfikowałem też wprost w wygenerowanym
  `index.html`, że string `entity-card{position:relative` faktycznie trafia
  do bundla produkcyjnego (nie tylko do źródła) — fix nie ginie w buildzie.

### 3. Niezależna weryfikacja "prawdziwe kliknięcie działa" (własny harness)

Uruchomiłem oba testy Operatora bezpośrednio, potem POSZEDŁEM DALEJ i
przeprowadziłem własny test mutacyjny, żeby wykluczyć fałszywy zielony wynik
(czy test w ogóle wykrywa regres, czy tylko zawsze przechodzi):

1. `node tools/tech-discovery-card-click-test.cjs` (jsdom) — 13/13 PASS.
2. `node tools/tech-discovery-card-real-click-test.cjs` (żywy headless
   Chromium, `/opt/pw-browsers/chromium-1194/...`) — **12/12 PASS.**
   `elementFromPoint()` na środku obu przycisków zwraca `BUTTON` (nie
   `.tdn-back`), `page.mouse.click()` na tych współrzędnych wywołuje spy
   dokładnie raz dla `onStartResearch` i `onOpenTree`, karta zamyka się po
   "Rozpocznij badanie", zero błędów konsoli.
3. **Mutacja kontrolna (mój własny krok, niezależny od raportu Operatora):**
   edytowałem `techDiscoveryNotice.ts`, usuwając `position:relative;` z
   `.entity-card` (przywracając stan sprzed naprawy), uruchomiłem
   `tech-discovery-card-real-click-test.cjs` ponownie →
   **6 PASS / 6 FAIL**, dokładnie w miejscach hit-testu i wywołania spy:
   `elementFromPoint` zwracał `{"hitTag":"DIV","hitClassName":"tdn-back"}`,
   `researchCalls: 0`, `treeCalls: 0` dla obu przycisków i wariantu
   zablokowanej technologii. Przywróciłem plik do stanu z commita
   (`position:relative;` z powrotem), zweryfikowałem `git status --short`
   pusty (brak resztek zmian), uruchomiłem test jeszcze raz →
   z powrotem 12/12 PASS.

To potwierdza dwie rzeczy jednocześnie, na prawdziwym DOM w prawdziwej
przeglądarce: (a) przed naprawą przycisk faktycznie nie odpala callbacku —
klik trafia w tło i je zamyka, dokładnie objaw ze zgłoszenia właściciela;
(b) po naprawie oba przyciski („Rozpocznij badanie" i „Otwórz drzewo")
faktycznie odpalają swoje callbacki przy realnym `page.mouse.click()`, i to
zarówno dla technologii odblokowanej (oba przyciski) jak i zablokowanej
(tylko „Otwórz drzewo", `onStartResearch=undefined` — karta poprawnie NIE
renderuje martwego przycisku).

### 4. Uwaga proceduralna (nie blokuje PASS)

W `dyspozycje/autobot/runs/R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1/` istnieją
`00-dispatch.md` i `01-operator.md`, ale brak pliku raportu Evaluatora mimo
że dyspozycja tej roli podaje "Evaluator: status=PASS, issues=[]". Nie
namierzyłem żadnego pliku `*evaluator*` nowszego niż dispatch nigdzie w
repo/worktree. To odchylenie od "Minimalny kontrakt raportu" w CLAUDE.md
(każdy etap zapisuje raport w `runs/<ID>/`) — zgłaszam do naprawienia w
procesie, ale NIE traktuję jako blokady tego PASS, bo własna, niezależna
weryfikacja w §3 (włącznie z testem mutacyjnym) potwierdza rzeczywisty
efekt naprawy niezależnie od tego, czy/jak Evaluator udokumentował swoją
turę.

## ZMIANY/COMMIT

Brak nowych zmian kodu od Final Control — tylko odczyt, uruchamianie testów
i tymczasowa mutacja-i-przywrócenie (zweryfikowane `git status --short` puste
przed i po). Ten plik (`02-final-control.md`) to jedyny nowy artefakt,
zapisany w allowlistowanym katalogu `dyspozycje/autobot/runs/`.
SHA branchu bez zmian: `a3ec60463d283b6afbd2d29631d1654cd8ee0a97`.

## TESTY

Patrz §2–§3 wyżej — pełny zestaw bramek + oba testy tematu (jsdom i żywy
Chromium) + własny test mutacyjny (revert-and-reapply) na żywym Chromium.
Wszystko zielone po stronie stanu z commita; test mutacyjny potwierdza
6/12 FAIL bez naprawy, więc bramka faktycznie coś testuje, nie jest ślepa.

## BLOKADY

Brak blokad merytorycznych. Uwaga proceduralna w §4 (brak pliku raportu
Evaluatora w `runs/`) — do naprawienia w procesie, nie blokuje tego tematu.

## NASTĘPNY KROK

Integracja orkiestratora (merge do `main`) — poza zakresem tej roli. Ten
subagent NIE mergeuje i NIE pushuje.

## DEPLOY/PUSH: NIE WYKONANO

## Werdykt

**PASS — readyForDeploy=true.** Naprawa jest minimalna (1 linia CSS),
poprawnie wyjaśniona, nie dotyka współdzielonego `entityCards/renderer.ts`
(T4 bezpieczny), zero regresu w pełnym zestawie bramek referencyjnych, a
oba przyciski karty odkrycia technologii faktycznie odpalają swoje
callbacki przy realnym kliknięciu myszy w żywym Chromium — potwierdzone
niezależnie, włącznie z testem mutacyjnym dowodzącym, że bramka faktycznie
wykrywa ten regres, a nie tylko zawsze świeci na zielono.
