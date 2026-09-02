TEMAT:  P-CIVPEDIA-INFRA-TEST-FIXTURE-DRIFT-Q1
RUNDA:  1/5
DATA:   2026-09-02
DOMAIN: PROCESS
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Po integracji 6 batchy treści CivPedii (budynki/cuda/ulepszenia/technologie/
jednostki J1+J2), `node gra/tools/civpedia-historia-infra-test.cjs` (napisany
w ramach `R-CIVPEDIA-HISTORIA-INFRA-Q1`, GDY ŻADNA encja nie miała jeszcze
pola `historia`) zaczął dawać FAIL: 15 pass, 1 fail.

## RECON (wykonany, nie powtarzać)
Kryterium [4] tego testu ma zaszytą asercję "WSZYSTKIE dzisiejsze wpisy
encyklopedii: depth 'm'/'full' bez sekcji '## Rys historyczny' (zero regresu
— pole historia jeszcze nigdzie niewypełnione)" — to była poprawna asercja
regresyjna w momencie napisania (żaden wpis nie miał jeszcze treści), ale
stała się fałszywa, gdy późniejsze, osobne tematy (6 batchy treści CivPedii)
poprawnie wypełniły pole `historia` w 168 wpisach. To JEST oczekiwana zmiana
stanu danych, NIE regresja mechanizmu. Identyczna klasa błędu ("fixture
drift" — test zakłada stan danych z chwili napisania zamiast czytać stan
faktyczny) wystąpiła już wcześniej w tej sesji wielokrotnie (m.in.
`entity-card-historia-section-test.cjs`, `entity-card-wonder-test.cjs`) —
ustalony wzorzec naprawy: zamiast twardego "wszystko puste", asercja
warunkowa `renderedExists === (pole niepuste w realnych danych)`.

## GOAL
W `gra/tools/civpedia-historia-infra-test.cjs`, kryterium [4]: zamiast
sprawdzać że WSZYSTKIE wpisy NIE pokazują sekcji "Rys historyczny", przeczytaj
realny stan `gra/src/data/wikiBundle.json` dla każdego wpisu i zweryfikuj
WARUNKOWO: jeśli wpis ma niepuste pole `historia` — sekcja MA być widoczna w
DOM na depth 'm'/'full' (i NIE widoczna na 's'); jeśli `historia` jest puste
— sekcja NIE ma być widoczna na żadnej głębokości. To jest silniejszy,
zawsze-aktualny test (sprawdza właściwy związek przyczynowy: obecność pola
↔ obecność sekcji w DOM), a nie migawkę stanu danych z jednego dnia.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. `node gra/tools/civpedia-historia-infra-test.cjs` → wszystkie testy PASS
   na aktualnym stanie `main` (168 wpisów, ~145 z realną `historia`, reszta
   pusta — dokładna liczba nieistotna, test ma czytać stan faktyczny, nie
   zakładać konkretnej liczby).
2. Dowód nietautologiczności: zmutuj (na chwilę, w kopii/tymczasowo) jeden
   wpis z niepustym `historia` tak, żeby sekcja NIE renderowała się w DOM
   (np. cofnij fix z `P-CIVPEDIA-WIKIHUBHUD-RYS-HISTORYCZNY-DUPLIKACJA-Q1`
   albo inny sposób na wywołanie realnego regresu) — test MUSI się
   zaczerwienić na tym konkretnym wpisie. Przywróć stan po dowodzie.
3. Pozostałe kryteria testu (ekstrakcja z fixture, kolizja z "## Historia /
   decyzje", itd.) — bez zmian, nadal PASS.
4. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu.

## ALLOWLISTA — nic poza tym
`gra/tools/civpedia-historia-infra-test.cjs` (WYŁĄCZNIE kryterium [4]/sekcja
odpowiedzialna za "zero regresu na dzisiejszym wikiBundle.json" — nie ruszaj
pozostałych kryteriów [1]-[3], [5] które nadal działają poprawnie). Zakazane
bezwzględnie: `gra/tools/bundle-wiki-for-game.cjs`, `gra/src/ui/wikiHubHud.ts`,
`docs/encyklopedia/**`, `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/P-CIVPEDIA-INFRA-TEST-FIXTURE-DRIFT-Q1`, baza
JAWNIE `origin/main` (zawiera już 6 zintegrowanych batchy treści CivPedii +
2 poprawki). Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1 za spełnione przez proste "rozluźnienie" asercji
do zawsze-prawdziwej (np. usunięcie sprawdzenia zamiast poprawienia go na
warunkowe) — kryterium 2 wymaga wprost dowodu, że test nadal łapie realny
regres.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/`. Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
