# R-WEB-SETTINGS-DEFAULT-LABOR-SPLIT-50-50-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-DEFAULT-LABOR-SPLIT-50-50-Q1
GOAL: nowa gra startuje z podziałem Pracy Ulepszenia (pula) 50% / Budynki 50%; logika puli i budynków bez zmian; stare zapisy nie są migrowane. (Kod kandydata 947a4a487 nie zmieniany; w tej obronie zmieniony tylko komentarz w `gra/src/game/ai.ts`.)
BAZA: kandydat 947a4a4870e6dee74402f78bc4e4384a7b5d5da6 (rodzic edaba111f). Worktree: `wf_13fd11a4-4b1-3`, gałąź `obrona/labor-split-50-50-q1`.
RAPORT EWALUATORA: 20-evaluator-claude.md (commit 6f3c07b01, lokalna gałąź eval/labor-split-50-50-claude).

## Odpowiedzi na zarzuty (każdy zarzut: PRZYJMUJĘ albo ODRZUCAM z dowodem)

### Zarzut 1 — brak realnej weryfikacji wizualnej panelu „Podział pracy" w Chromium — PRZYJMUJĘ (wykonane)
Dowód wykonany w tej rundzie:
- Build `vite build --outDir <scratchpad>/dist-obrona` (bez `npm run build`) z drzewa 947a4a487 + komentarz z commitu obrony.
- Chromium 141 (`/usr/bin/chromium`), Playwright z `gra/node_modules`, skrypt poza repo: `<scratchpad>/obrona/ingame-labor.cjs`.
- Odczyt runtime przed startem: `snapshotOwnerSettingsForTest(0).work` = `{"procentBudynki":50}`; po starcie nowej gry: to samo `{"procentBudynki":50}`.
- Gra po starcie: założone pierwsze miasto (klik na hex startowy), otwarty panel Praca (chip „Praca" w górnym pasku).
- Odczytany DOM panelu: `PODZIAŁ PRACY` → `Ulepszenia (pula) 50%`; suwak: etykiety `Ulepszenia (pula) 50%` (lewa) i `Budynki 50%` (prawa), znaczniki `MIN 0%` / `MAX 50%`, uchwyt na prawym końcu.
- Zrzut ekranu: `dyspozycje/autobot/runs/R-WEB-SETTINGS-DEFAULT-LABOR-SPLIT-50-50-Q1/30-obrona-zrzut-panel-praca-50-50.png` (kopia z `<scratchpad>/obrona/ingame-praca.png`). Wzrokowo: panel pokazuje 50% / 50%, uchwyt na końcu zakresu.
- Obserwacja (NIE błąd tej zmiany): miasto „Rzym" ma pustą kolejkę budynków, więc „DO BUDYNKÓW" = 0, a cała Praca (+7) idzie do puli. To działanie reguły „pusta kolejka → praca do puli" (W23, FALA 656), nie wartości domyślnej.
- Wniosek: wartość 50/50 widoczna w realnym UI nowej gry; zarzut zamknięty dowodem.

### Zarzut 2 — `hotseat-ustawienia-kopiowane-test.cjs` niezweryfikowany end-to-end — PRZYJMUJĘ jako fakt, NIE da się zamknąć w tym temacie
- Odtworzone na bazie edaba111f (osobny worktree, usunięty po teście): `node tools/hotseat-ustawienia-kopiowane-test.cjs` → `BLOCK/FAIL: locator.click: Timeout 30000ms exceeded ... waiting for locator('.civ-newgame .start')`, linia 98 w kodzie bazowym. Identycznie na kandydacie 947a4a487 (linia 98, ta sama treść błędu). Dług bazowy, nie regresja.
- Próba naprawy nawigacji (pętla „Dalej" w `openWizardToSettingsStep`) NIE rozwiązała: po dojściu do przełącznika fotela 2 przycisk `.civ-newgame .start` nie jest na tym samym kroku (`seat2-toggle-row` pojawia się bez `.start`, `.start` bez `seat2-toggle-row`). Test jest nieaktualny względem obecnego kreatora. Zmianę cofnięto — commit obrony nie zawiera zmian w tym pliku.
- Zmiany w tym teście (fixture 60 zamiast 50, oczekiwane 50 dla fotela 2) są logicznie spójne z nową wartością domyślną (fixture 60 ≠ default 50 zachowuje sens testu „niedomyślne"). Pokrycie wartości domyślnych daje nowy test `gra/tools/default-labor-split-test.cjs` (16/0 po obronie), który nie korzysta z kreatora.
- DŁUG do rejestru: naprawa nawigacji `hotseat-ustawienia-kopiowane-test.cjs` (kreator zmienił kroki) — osobny temat testowy.

### Zarzut 3 — wyjście poza ścisłą allowlistę — PRZYJMUJĘ jako uzasadnione (bez zmiany kodu)
- `gra/src/ui/cityPanel.ts` — lustro `DEFAULT_PODZIAL_PRACY` (ostateczny fallback UI bez danych). Bez zmiany panel domyślny pokazywałby 70 mimo 50 w silniku; dispatch wymaga, by panel domyślny gracza też był 50. To ta sama wartość, nie logika.
- Testy `praca-jeden-podzial-kontrakt-test.cjs`, `ai-praca-podzial-tura1-seed-test.cjs`, `hotseat-ustawienia-kopiowane-test.cjs` nie pasują do globów `*labor*` / `*work*split*` — zmieniono wyłącznie asercje z 70 na 50 (zakres zgodny z dispatchem „testy zakładające starą wartość zaktualizuj i wypisz każdy").
- Prośba do orkiestratora: formalnie zaakceptować te cztery pliki jako poza globami, z uzasadnieniem jak wyżej.

### Zarzut 4 — `suwak_praca_teren_domyslnie` = 30 przy budynkach 50 — ODRZUCAM zmianę, zgłaszam DECISION
Dowód (grep na kandydacie):
- `suwaakPracaTeren` jest tylko przypisywany: `gra/src/game/economy.ts:186` (typ), `:264` (odczyt parametru), `gra/src/game/turn-economy.ts:344`, plus fixture'y `growthmult-compound-test.cjs:139`, `trade-routes-income-test.cjs:528`, `wire-ekonomia-test.cjs:73`. Żadna ścieżka logiki nie czyta tego pola (brak użycia w obliczeniach pracy).
- Zmiana wartości teren nie jest wymagana przez GOAL (dotyczy wyłącznie pula/budynki) i dispatch zakazuje zmian mechaniki. Pozostawiono 30.
- DECISION dla właściciela/Final Control: pole teren (30) i pula (50) nie sumują się do 100 po zmianie (wcześniej 70+30=100). Pole jest martwe w logice, więc nie ma skutku gameplay; do decyzji, czy je usunąć lub zsynchronizować.

### Zarzut 5 — niedokończona synchronizacja opisów starej wartości 70 — PRZYJMUJĘ częściowo
Przyjęte i wykonane:
- `gra/src/game/ai.ts` ok. 7814–7816 (komentarz): „fallback DEFAULT_PODZIAL_PRACY.procentBudynki=70 tam NIE jest już osiągalny" → zmieniono na `=50`. Jedyna zmiana w commicie obrony (komentarz, bez kodu).

Odrzucone (dowód):
- `docs/encyklopedia/pojecia/spichlerz.md:50` „SP5 Domyślnie suwak 70/30 rozwój/wojsko" — to suwak ŻYWNOŚCI (rozwój miast / wojsko), a nie podział pracy; potwierdza `docs/encyklopedia/pojecia/suwak-zywnosci.md:13` („domyślnie 70% rozwój miast · 30% wojsko"). Bez zmian.
- `docs/encyklopedia/budynki/biblioteka.md:33` i `akademia.md:41` „ustaw suwak pracy **70% budynki**" — to rada taktyczna dla miasta naukowego (gracz ustawia 70% ręcznie); nie opisuje wartości domyślnej, więc nie jest nieaktualna. Zmiana byłaby decyzją treściową — DECISION (owner), nie wykonano.
- 14 plików `docs/encyklopedia/budynki/*.md` „Scenariusz: … (suwak pracy 70%, miasto produkuje ~14 pracy/t)" — przykłady liczbowe, nie domyślne. Bez zmian.
- `docs/encyklopedia/pojecia/suwak-pracy.md` tabela „70/30 → 9,8 / 4,2" — przykład obliczeniowy oznaczony jako przykład (14 pracy/t). Bez zmian; opis domyślny w nagłówku sekcji już zmieniony na 50/50.
- `gra/src/game/production.ts:2479` („przy domyslnych ustawieniach (70% budynki / 33% ulepszen)…") i `gra/src/game/turn-economy.ts:2225` („domyślnych 70/30 … DOKŁADNIE zgłoszony rozjazd") — opisy zmierzonego, datowanego stanu historycznego (błąd z 2026-08-25), a nie aktualnej wartości. Zostawione jako historia.
- `gra/src/main.ts:6344–6346` (komentarz z „=70") — NIE zmieniano: plik `main.ts` jest na liście zakazów (dispatch: „ZAKAZ: main.ts (jeśli da się uniknąć)"; komentarz nie wymagał edycji). Zgłoszone orkiestratorowi jako drobny follow-up komentarza.
- Stare liczby 70 w komentarzach/komunikatach testów: `gra/tools/praca-global-default-live-test.cjs:119,128,219,221`, `gra/tools/praca-miasto-limit-50-cap-test.cjs`, `gra/tools/production-overflow-test.cjs` (scenariusze z wejściowymi 70/30 — dane testu, nie domyślne), `gra/tools/currency-test.cjs:100`. Nie w allowlistcie (nazwy plików) i nie wpływają na wynik. Zgłoszone jako dług komentarzy testowych.
- Dodatkowo `gra/src/data/wikiBundle.json` był regenerowany narzędziem w kandydacie; w obronie nie ruszany.

### Zarzut 6 — dług Rust i `/a.out` — PRZYJMUJĘ (weryfikacja wykonana w tym worktree)
- `rust-port/` w tym checkoucie: 32 pliki (podzbiór `engine`). Grep `procent_?budynki|suwak_praca|podzial_?pracy|DEFAULT_PODZIAL|labor_?split` po `*.rs|*.json|*.toml|*.ts`: 0 trafień. Jedyny związany wpis: `rust-port/engine/src/domain/improvements.rs:181` `#[serde(rename = "praca", alias = "work")]` (nazwa pola, nie wartość domyślna). Wniosek: w tym drzewie nie ma kopii wartości domyślnej → REPIN nie jest wymagany według tego checkoutu. Zakres: tylko ten checkout (pełnego drzewa Rust nie przeszukiwano poza `rust-port/`).
- `/a.out`: plik istnieje w katalogu głównym systemu (1220 B, 2026-11-14 20:25), poza repozytorium. NIE usunięto (poza worktree, brak polecenia). Do decyzji orkiestratora/właściciela.

## Bramki wykonane w obronie (surowe wyniki)
- `npx tsc --noEmit` (w `gra/`) → exit 0.
- `node tools/default-labor-split-test.cjs` → `=== default-labor-split-test: 16 pass, 0 fail ===`, exit 0.
- `git diff --check` → czysty (`DIFFCHECK_OK`).
- Chromium: zob. zarzut 1 (runtime `work={"procentBudynki":50}` przed i po starcie; DOM „Ulepszenia (pula) 50%").
- `hotseat-ustawienia-kopiowane-test.cjs`: FAIL na bazie edaba111f i na kandydacie 947a4a487 (identyczny timeout) — dług bazowy.
- NIE_PONOWIONO: pięć bramek referencyjnych (logic/tech-tree/research/unit-replace/combat) po edycji komentarza. Zmiana w obronie to wyłącznie komentarz w `ai.ts` (diff: 1 linia), wyniki operatora dla 947a4a487 pozostają wiążące dla kodu.

## Pliki zmienione w tej obronie
- `gra/src/game/ai.ts` — komentarz (`=70` → `=50`).
- `dyspozycje/autobot/runs/R-WEB-SETTINGS-DEFAULT-LABOR-SPLIT-50-50-Q1/30-obrona-claude.md` — ten raport.
- `dyspozycje/autobot/runs/R-WEB-SETTINGS-DEFAULT-LABOR-SPLIT-50-50-Q1/30-obrona-zrzut-panel-praca-50-50.png` — zrzut z Chromium.

## TESTY
- tsc: exit 0. default-labor-split-test: 16/0. diff --check: czysty. Chromium: DOM i runtime = 50/50 (zob. zarzut 1). hotseat: FAIL także na bazie (dług).

## BLOKADY
- Brak blokad merytorycznych. Otwarte: (a) test hotseat wymaga przepisania nawigacji kreatora (dług testowy); (b) DECISION: `suwak_praca_teren_domyslnie` = 30 (martwe pole, niesumujące się z pulą 50); (c) DECISION: opisy „70% budynki" jako rada w `biblioteka.md`/`akademia.md` (treść, nie domyślna); (d) follow-up komentarza `main.ts:6344`; (e) `/a.out` poza repo.

## RUNDY
2/5 (runda obrony 1; Evaluator r1 = PASS-WITH-NOTES, bez FAIL/BLOCK).

## UWAGI-DLA-ORKIESTRATORA
1. Formalna allowlista: zaakceptować `cityPanel.ts` oraz trzy pliki testów jako poza globami (zob. zarzut 3).
2. Zasada procesowa: worktree `wf_13fd11a4-4b1-3` jest zablokowany (`locked`) przez sesję wykonawczą; tymczasowy worktree bazowy został usunięty po teście (`git worktree remove --force`).
3. Nie utworzono żadnej sesji, zadania ani triggera (zakaz z dispatchu zachowany).
4. Dysk: `gra/node_modules` zainstalowane `npm ci --ignore-scripts` w tym worktree (do usunięcia przy sprzątaniu); bundle w `<scratchpad>/obrona/` i `<scratchpad>/dist-obrona/` (do usunięcia).

NASTĘPNY KROK: Evaluator (SONNET) weryfikuje odpowiedzi i zrzut; po PASS → Final Control (SONNET) na commicie obrony.
DEPLOY/PUSH: NIE WYKONANO
