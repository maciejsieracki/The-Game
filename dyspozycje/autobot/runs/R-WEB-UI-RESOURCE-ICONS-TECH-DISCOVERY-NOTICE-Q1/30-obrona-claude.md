# R-WEB-UI-RESOURCE-ICONS-TECH-DISCOVERY-NOTICE-Q1 — obrona Operatora (runda 1/5, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-ICONS-TECH-DISCOVERY-NOTICE-Q1
GOAL: okno odkrycia technologii (`gra/src/ui/techDiscoveryNotice.ts`) pokazuje surowce i plony jako chipy ikona+liczba, bez gołych nazw w sekcjach „Co możesz teraz zrobić”, odblokowań i efektów. Obrona: odtworzenie bramek Evaluatora na kandydacie, odpowiedź na 7 zarzutów z dowodem.
BAZA: origin/main `6ade0f0ec`. KOD OPERATORA: `57d1c7d3b`. KANDYDAT (raport Operatora): `08b90489e`. Ta obrona NIE zmienia kodu: żadnego commita z kodem, tylko commit tego raportu na szczycie `08b90489e`. SHA końcowy = SHA commita tego pliku (podany w odpowiedzi orkiestratorowi).

## ODTWORZONE BRAMKI NA `08b90489e` (surowe wyjście, nie z pamięci)

- `npx tsc --noEmit` → EXIT=0 (bez wyjścia).
- `logic-test.cjs` → `LOGIC OK (213/213)`, exit 0.
- `tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `research-test.cjs` → `ALL GREEN`, exit 0.
- `unit-replace-test.cjs` → `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `combat-test.cjs` → `All sanity checks passed.`, exit 0.
- NOWY `tech-discovery-notice-resource-chips-test.cjs` → `6 pass, 0 fail (technologii: 32, chipów łącznie: 348)`, exit 0.
- `tech-cards-top5-test.cjs` → `[tech-cards-top5-test] 595 pass, 0 fail`, exit 0 (zgodnie z raportem Operatora).
- `tech-discovery-badge-diorama-test.cjs` na `08b90489e` → `61 PASS, 2 FAIL`, exit 1.
- `tech-discovery-badge-diorama-test.cjs` na bazie `6ade0f0ec` → `61 PASS, 2 FAIL`, exit 1. Te same dwa błędy: `FAIL: (B2) [Hutnictwo żelaza] kind:"preview" — przecięcie z elipsą gruntu` oraz `FAIL: (c1) domyślna karta encji (budynek) ma NADAL diaromę 190px z renderer.ts — defaultDioramaHeight 209`.
- Mutacji w tej rundzie nie powtarzano (kod nie był zmieniany; mutacje 1 i 2 z raportu Operatora dotyczą kodu z `57d1c7d3b` i nie były odtwarzane).

## ODPOWIEDZI NA ZARZUTY

**Zarzut 1 (kryterium 2 literalnie: Vite HTTP, prawdziwe ikony brandu): PRZYJMUJĘ, NIE NAPRAWIONO.**
- Test idzie przez esbuild bundle + `page.setContent`, nie przez Vite HTTP. Odstępstwo było zgłoszone w raporcie Operatora (założenie 5).
- Próba włączenia prawdziwych ikon w bundlerze esbuild (ten sam test z `CHIPS_STUB_ICONS=0` i pluginem `?raw`) zakończyła się błędem w przeglądarce: `TypeError: import_meta.glob is not a function`. Źródło: `gra/src/ui/icons/brandAssets.ts` używa Vite-owego `import.meta.glob`. Realna weryfikacja z prawdziwymi ikonami wymaga Vite. Próbę wycofano (`git checkout --` na pliku testu), w commicie nic nie zostało.
- Efekt: prawdziwe ikony brandu NIE zweryfikowane w przeglądarce. NIE_ZMIERZONO. Propozycja: osobny temat R-WEB-* z testem na Vite (`vite build --outDir` poza repo albo dev server).

**Zarzut 2 (test XSS nie podstawia wrogiej nazwy): PRZYJMUJĘ, NIE NAPRAWIONO (próba odrzucona jako pusta).**
- Dodałem sprawdzenie `window.__show('<img src="x" onerror="window.__xssHit=1">…')`. Wynik: `hostPresent: false` — okno dla nieznanej nazwy się nie otwiera, więc asercja „brak wstrzykniętych elementów” była pusta. Ta wersja została wycofana, w commicie nie ma.
- Dane technologii są statyczne (`tech.json`), a nazwa idzie z tabeli. Bez zmiany danych nie da się podstawić wrogiej nazwy do okna, które się otwiera. NIE_ZMIERZONO w zakresie „nazwy z danych escapowane”. Ponownie nie czytałem `renderer.ts:185-192` w tej rundzie — opieram się na ocenie Evaluatora.

**Zarzut 3 (zmiany poza dosłowną allowlistą: `gra/tools/entity-card-chip-text.cjs` i `resourceRows.ts`): PRZYJMUJĘ jako odchylenie formalne, do decyzji orkiestratora.**
- `gra/src/ui/entityCards/resourceRows.ts` (dopisek `ALIASES`): mieści się w allowliście jako „wspólny helper chipów w `gra/src/ui/` (tylko dopisek, bez zmiany sygnatur)”. Nie jest odchyleniem.
- `gra/tools/entity-card-chip-text.cjs` (dopisek `FORMS`): NIE mieści się w literalnej allowliście (`gra/tools/*-test.cjs` dotyczące okna odkrycia). Jest to dane testów kart encji, wspólne dla innych testów.
- Uzasadnienie zmiany: bez niej istniejące testy kart encji zmieniają wynik (raport Operatora: `tech-cards-top5-test` 592/3 przed poprawką, 595/0 po). Nie reprodukowałem stanu „bez FORMS”; reprodukuję tylko wynik z FORMS: 595/0.
- Decyzja dla orkiestratora: zaakceptować poszerzenie allowlisty o ten jeden plik danych testu (zalecane), albo wydzielić `FORMS` do osobnego tematu.

**Zarzut 4 (luki w pokryciu testu [A]): CZĘŚCIOWO ODRZUCAM, CZĘŚCIOWO PRZYJMUJĘ.**
- „Brąz/brązu w BARE_RE” — ODRZUCAM. W danych `brąz` to nazwa epoki („epoka Brązu”, „w Brązie”, np. `ai-params.json`, `building-cards-top5.json`), nie surowiec ani plon. Dodanie go do BARE_RE wprowadziłoby fałszywe trafienia na nazwy epok.
- „Wielka litera w środku zdania wyłącza dopasowanie” — PRZYJMUJĘ jako znane ograniczenie, NIE ZMIENIONO. Reguła jest celowa: bez niej wychodzi „Żelaza” z nazwy epoki w Wojskowości (potwierdzenie Evaluatora). Zmiana wymagałaby listy wyjątków lub analizy składni.
- „`properNames` wycina każde wystąpienie Trzoda/Owce/Lama” — PRZYJMUJĘ jako ograniczenie, NIE ZMIENIONO. Mutacje z raportu Operatora (1 i 2) pokazały, że test czerwienieje na realnych regresjach.

**Zarzut 5 (ścieżka zapasowa `_legacyShowTechDiscoveryNotice` niezmieniona i nieobjęta testem): PRZYJMUJĘ jako NIE_ZMIERZONO, NIE ZMIENIONO.**
- Ścieżka uruchamia się wyłącznie przy wyjątku w ścieżce `entityCards`. Nie była w zakresie ani w teście. Nie zmieniano. Propozycja: osobny temat, jeśli orkiestrator uzna, że awaryjny render też musi być „bez gołych nazw”.

**Zarzut 6 (chip bez kwoty — gramatyka z prawdziwymi ikonami nie sprawdzona): PRZYJMUJĘ, NIE_ZMIERZONO.** Konsekwencja zarzutu 1. Test nie renderuje prawdziwych ikon.

**Zarzut 7 (`tech-discovery-badge-diorama-test` nie odtworzony): ODRZUCAM — odtworzone.**
- Na kandydacie `08b90489e`: `61 PASS, 2 FAIL`.
- Na bazie `6ade0f0ec` (checkout w tym samym worktree): `61 PASS, 2 FAIL`, te same dwa błędy (B2 Hutnictwo żelaza, (c1) 209px).
- Wniosek: dwa błędy są przed-istniejące, nie wynikają z tematu.

## ZMIANY W TEJ RUNDZIE

- Kod: BRAK (zero commitów z kodem). Próby (real icons, hostile-name probe) wycofane `git checkout --` przed końcem.
- Zainstalowano `gra/node_modules` przez `npm ci --ignore-scripts` (katalog ignorowany; ZAKAZ `npm run build`/`dev` zachowany).
- Commit tego pliku raportu: wyłącznie `dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-ICONS-TECH-DISCOVERY-NOTICE-Q1/30-obrona-claude.md` (`git add <ścieżka>`, bez `-A`).

## ZAŁOŻENIA

1. Plik `00-dispatch.md` nadal nie istnieje w `origin/main`. Zakres wzięty z DODATKU na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, zgodnie z założeniem 1 Operatora.
2. Zarzuty 1, 2, 5, 6 pozostają otwarte. Nie zamieniam ich na PASS; zostają jako NIE_ZMIERZONO / odstępstwo.

## BLOKADY

- Wymagana decyzja orkiestratora: akceptacja poszerzenia allowlisty o `gra/tools/entity-card-chip-text.cjs` (zarzut 3).
- Otwarte NIE_ZMIERZONO (zarzuty 1, 2, 5, 6): prawdziwe ikony w przeglądarce (wymaga Vite), wroga nazwa w danych, awaryjna ścieżka, gramatyka z ikonami.

## RUNDY

1/5 (obrona Operatora, Haiku 5.5). Kolejna runda Evaluatora nie została uruchomiona w tej sesji.

## NASTĘPNY KROK

Evaluator (Sonnet): sprawdzić, czy odpowiedzi na zarzuty 4, 7 i odrzucenie zarzutu 3 (akceptacja FORMS) są wystarczające. Zarzuty 1, 2, 5, 6 pozostają otwarte jako NIE_ZMIERZONO. Po PASS: Final Control, potem orkiestrator (integracja z `git merge-base --is-ancestor 57d1c7d3b <SHA integracji>`).

DEPLOY/PUSH: NIE WYKONANO
