# 03 — FINAL CONTROL (runda 1)

STATUS: FAIL
**GOTOWOŚĆ DO INTEGRACJI: NIE.**

DOMAIN: GAME
TEMAT: `R-PRACA-JEDEN-PODZIAL-Q1`
GOAL (zgodny z `00-dispatch.md`, bez zmian): jeden podział Pracy budynki/ulepszenia,
suma 100%, stosowany dokładnie raz, cap ulepszeń ≤50%, identyczny globalnie i w
mieście, zero duplikatu liczenia, nazwy opisujące realny adresat.

ZMIANY/COMMIT: zweryfikowane `f4ab424c` (kod `1f158649`), merge-base `6e3e872e`.
Własny worktree `/home/user/wt-FC-R-PRACA-PODZIAL`, symlink `node_modules` z
głównego drzewa, żadne narzędzie/harness Operatora ani Evaluatora nieużyte
bezpośrednio — wszystkie bramki odpalone od nowa. Dopisany **integration
micro-fix** `d14d160b` (spushowany do `autobot/R-PRACA-JEDEN-PODZIAL-Q1`):
fałszywy komentarz `pracaImperialPoolGain` w `production.ts` twierdził
„kolejka pusta (albo wstrzymana) → CAŁOŚĆ Pracy do puli"; wywołujący w
`main.ts:26754` uruchamia tę funkcję wyłącznie pod `!prodPaused` — wstrzymana
kolejka nie dostaje Pracy ani do budynków, ani do puli (potwierdza to
istniejący, osobny komentarz `main.ts:13922-13927`). Zdanie było NOWE w tym
diffie (Operator dopisał „albo wstrzymana"), nie preistniejące — poprawione,
bez zmiany logiki/geometrii. `tsc --noEmit` po poprawce nadal 0 błędów.

## Co zweryfikowałem samodzielnie (uruchomienia, nie odczyt raportów)

- `tsc --noEmit`: 0 błędów.
- Bramki tematu (własne uruchomienie): `praca-jeden-podzial-kontrakt` 600/0,
  `praca-jeden-podzial-real-render` 35/0 (Chromium, MUT-1/2/3 realnie czerwienią
  swoje asercje), `praca-limit-50` 34/0, `praca-miasto-limit-50-cap` 50/0,
  `praca-pula-rate-parity` 20/0, `ai-praca-split-parity` 20/0,
  `auto-improvements` 43/0, `production-overflow` 203/0, `praca-split-ui` 25/0,
  `praca-budmode-slider-max-real-render` 13/0, `praca-cap-migracja-luka` 11/0,
  `praca-global-default-live` 7/0, `ulepszenia-praca-percent` 28/0.
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6.
- 4 bramki czerwone pre-istniejąco: `empire-panel-econ-slider-visibility` 57/3,
  `empire-panel-sliders-always-visible` 6/2, `spichlerz-wzrost` 2/7,
  `unit-power` 4/2 — liczby identyczne z raportem Operatora, diff tematu nie
  dotyka żadnego z tych obszarów.
- Próbny merge (`git merge-tree --write-tree HEAD origin/main`, `origin/main`
  = `9c6eef00`, przesunięty od dispatchu): **czysty, exit 0, zero konfliktów.**
  Rekomendacja: zwykły `git merge --no-ff` bez rozwiązywania czegokolwiek.
- Kryterium 1 (siatka X%→X%) jest przypięte NA PRAWDZIWEJ funkcji `splitPraca`
  (6 % × 13 rozmiarów Pracy, reguła zaokrąglenia), nie regexem — to jest
  solidne i faktycznie łapie nawrót (sprawdzone: mutacja capu 50→40 czerwieni
  17 asercji bramki tematu, potwierdzone samodzielnym uruchomieniem).

## Dlaczego mimo to FAIL — oba blokery Evaluatora POTWIERDZONE własnym śladem w kodzie

**F1 (CONFIRMED, blokujące).** `main.ts:26993`:
`playerImprovementBudget = pracaPoolInflowByOwner.get(0)` — TEGOROCZNY wpływ do
puli, nie saldo. To trafia jako `improvementBudgetCap` do `pickAutoImprovements`,
gdzie (`auto-improvements.ts:325-329`) **zastępuje** procentowy cap absolutną
liczbą. Sprawdziłem koszty realnie: `data/terrain-improvements.json` ×
`scaleImprovementWorkCost()` (`×2`, `r-stawki-strojenie.ts:50`) — najtańsze
dostępne ulepszenia po skalowaniu to rząd 30-60+ Pracy. Tegoroczny wpływ do
puli jednego ownera (suma po wszystkich jego miastach) przy realistycznych
wielkościach miast i domyślnym 30% zwykle NIE osiąga tego progu w jednej
turze, a budżet nie jest kopertą narastającą (mapa `pracaPoolInflowByOwner`
tworzona od nowa co turę, `main.ts:26348`) — niewykorzystana reszta nie
przechodzi na kolejną turę. Efekt: `improvementBudgetCap` bywa strukturalnie
niższy niż koszt JAKIEGOKOLWIEK ulepszenia, więc auto-ulepszenia (gracz I AI,
ta sama ścieżka) budują **zero**, niezależnie od wielkości skumulowanej puli —
dokładnie objaw, dla którego temat powstał, w nowej postaci. Sprzeczne wprost
z udokumentowaną, nietkniętą decyzją `R-AUTO-PRACA-BUDZET-PROCENT-Q1=B`
(cytat z komentarza w `auto-improvements.ts`, nadal w pliku): „% budżetu Pracy
liczonym od SKUMULOWANEJ puli Pracy na WEJŚCIU do wywołania (**nie od
przyrostu**)". Kryterium końca 5 dispatchu („konsumenci puli działają dalej —
potwierdzone testem/pomiarem") nie jest spełnione dla konsumenta
auto-ulepszenia terenu: podłączenie jest nominalne, zużycie — praktycznie
zerowe przy typowych wielkościach miast.

**F2 (CONFIRMED, blokujące — pkt 6 dispatchu wprost tego wymaga).** Zweryfikowałem
bezpośrednio: `empireDetailPanel.ts:1306` — tooltip nadal „Nadrzędny podział
całej puli Pracy imperium" (opisuje USUNIĘTY drugi podział, nie podział Pracy
miasta na pulę), a hero/etykiety w tym samym pliku (`:1312-1314`) używają
samego „Ulepszenia" bez kwalifikatora „pula" — inaczej niż `cityPanel.ts`
(„Ulepszenia (pula imperium)") i `buildModeHud.ts` („Ulepszenia — pula
imperium"). Trzecia rozjechana etykieta tej samej liczby. Dodatkowo
`buildModeHud.ts:80`: `onEmpirePracaSplitChange?: (procentUlepszenia: number)`
— parametr nazwany „ulepszenia" niesie % podziału do puli, czyli dokładnie
wzorzec `doUlepszen = doPuli`, dla którego ten temat istnieje, przeniesiony do
innego pliku z tej samej allowlisty. Real-render (35/0) sprawdza WYŁĄCZNIE
`cityPanel`/`buildModeHud` slider — nie pokrywa `empireDetailPanel.ts`, więc
zielona bramka nie jest dowodem naprawy tego miejsca.

**F3 (potwierdzone, jakość dowodu, nie samodzielny bloker).** Konsumenci puli
w bramce kontraktu (`praca-jeden-podzial-kontrakt-test.cjs:236-247`) są
sprawdzani wyłącznie regexem po tekście `main.ts` — świeci, choć zmierzone
wywołanie via `auto-improvements` (F1) realnie daje 0 picków. Linia 231:
`ok(!/ownerDefaultPracaSplit\.set\(/.test('') === true, ...)` sprawdza regex
przeciw pustemu stringowi — tautologia, nie test niczego. Nie podnoszę tego do
osobnego blokera, bo F1/F2 już przesądzają FAIL, ale poprawka rundy 2 powinna
to zamknąć razem (Evaluator już to zalecił).

## Kontrola checklisty §16b

1. `00-dispatch.md` istnieje, GOAL niezmieniony — TAK. 2. ID identyczne we
wszystkich rundach — TAK. 3. Werdykt Evaluatora oparty na artefaktach —
zweryfikowałem niezależnie F1/F2 na kodzie, nie na jego deklaracji — TAK,
potwierdzone. 4. N/D (nie `PASS-WITH-NOTES`). 5. Licznik rund: 1/5, bez
cichego resetu — TAK. 6. Rejestr: temat jeszcze nie ma wpisu w
`REJESTR-PROSB-I-ZADAN.md` — normalne dla rundy 1 bez `ABC-OCZEKUJE`, nie
naprawiam (zmiana rejestru nie jedzie w allowliście tematu GAME — granica §9
pkt 4). 7. N/D (bez węzłów). 8. Gotowość do integracji: **NIE**.

BLOKADY: F1 (budżet ulepszeń terenu praktycznie nieosiągalny przy typowych
wielkościach miast — sprzeczne z udokumentowaną decyzją Q1=B) i F2 (pkt 6
dispatchu niedokończony w `empireDetailPanel.ts`/`buildModeHud.ts`) wymagają
naprawy logiki/wiringu przez Operatora — nie kwalifikują się jako micro-fix
Final Control. Rekomendacja naprawy zgodna z propozycją Evaluatora: koperta
narastająca (`pracaPoolInflowByOwner`→stan trwały, wchodzi do save/load,
bramka behawioralna „N Pracy/turę × T tur → ≥1 pick") + dokończenie
nazewnictwa w obu plikach UI + zamiana regexowych dowodów konsumentów na
asercję zachowania + usunięcie tautologii linii 231.

RUNDY: 1/5.
NASTĘPNY KROK: Operator, runda 2, to samo ID i gałąź — poprawka F1+F2 wyżej.
DEPLOY/PUSH: NIE WYKONANO (push micro-fixu `d14d160b` do gałęzi roboczej —
tak; merge do `main` i deploy — nie, i nie powinny nastąpić przy tym werdykcie).
