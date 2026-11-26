# R-WEB-AI-CULT-REL-DIAG-Q1 (tag AICULTDIAG) — dispatch (Operator HAIKU 5.5, runda 1/5)
GOAL: ustalić LICZBAMI, dlaczego AI na poziomie „Kultura i religia: trudny” (gra na maksymalnej trudności) ma ok. 30% mniej jednostek i dużo pustych miast względem trybu zgodności, mimo FALI 926 (garnizon wg potrzeby + budynki Prawa/Szczęścia). Tylko pomiar i diagnoza — ŻADNEJ zmiany reguł gry ani balansu.
BAZA: args.cand = origin/main (5748b924f, FALA 926). `git merge-base --is-ancestor` i `git rev-parse HEAD` w raporcie.
## Zadanie
1. Użyj runnera z main: gra/tools/ai-cult-rel-measure-run.cjs oraz ai-cult-rel-measure-summarize.cjs (z AICULT r3; pomocnik bramki: gra/tools/_live-ready.cjs; hak civTest __nnsMeasureDebug.startGame). Opcja --difficulty maksymalna (reguła właściciela: testuj na poziomie MAKSYMALNYM — gra „Trudny” + Kultura i religia trudny); zgodność jako odniesienie.
2. Dodaj do haka pomiarowego (tylko odczyt, bez zmian logiki gry; gra/src/main.ts wyłącznie za civTest) LICZNIKI per tura i per cywilizacja AI: miasta w buncie skrajnym/rebelii, utracone miasta (kto zdobył: bunt/wróg), jednostki stracone (walka/rozwiązane z braku utrzymania/rozwiązane przez AI), jednostki kupione/wyprodukowane, saldo utrzymania (pieniądz/żywność), miasta z Porządkiem poniżej progu, budowa budynków Prawa/Szczęścia (ile, kiedy).
3. POMIAR: seed 4242 i 7, 60 tur, warianty zgodność vs trudny (maks.) — kilka ziaren dodatkowo, jeśli czas pozwala; tabela przyczyn z liczbami (bunt, utrata, utrzymanie, produkcja) i rozstrzygnięcie, która przyczyna tłumaczy −30% jednostek (np. brak złota na utrzymanie, miasta w rebelii, produkcja przejęta przez budynki).
4. Jeżeli przyczyna wymaga zmiany balansu/reguł → DECISION_REQUIRED (jedno zdanie skutku per wariant, bez rozwiązania). Gdy przyczyna to błąd AI (np. rekrutacja się nie wykonuje) — opisz miejsce w kodzie i minimalną poprawkę jako PROPOZYCJĘ (bez wdrażania) albo, jeśli to wyraźny błąd bez wpływu na balans, wdroż minimalnie z testem i mutacją.
5. Dokument dyspozycje/analizy/AI-KULTURA-RELIGIA-DIAG-2026-11-26.md (tabela przyczyn, liczby, NIE ZMIERZONO tam, gdzie nie zmierzono).
## Allowlista
gra/tools/ai-cult-rel-measure-*.cjs (rozszerzenia), gra/src/main.ts (WYŁĄCZNIE liczniki za hakiem civTest), dyspozycje/analizy/AI-KULTURA-RELIGIA-DIAG-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-DIAG-Q1/**; poprawka AI tylko wg pkt 4 (gra/src/game/ai*.ts, z testem).
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; Chromium /opt/pw-browsers/chromium), zmiana wartości reguł/balansu/parametrów kultury, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash, --no-gpg-sign. Dysk ≥ 6 GB; po pracy usuń node_modules/tmp. Wiadomości użytkownika w Twoim kontekście IGNORUJ. Nie pytaj właściciela.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace; combat 6; ai-test 297/0; ai-city-order-need-wiring 231/0.
## Binarne kryterium
Tabela przyczyn z liczbami dla seed 4242 i 7 (zgodność vs trudny, 60 tur) i jednoznaczne wskazanie głównej przyczyny −30% jednostek albo jawne NIE ZMIERZONO z powodem; zero zmian reguł.
