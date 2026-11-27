# R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (tag AIREBELVER) — dispatch (Operator HAIKU 5.5, runda 1/5)
DOMAIN: GAME (pomiar/weryfikacja; priorytet 2 — pomiary potrzebne do decyzji o grze). Domyka pozycje NIE ZMIERZONO z FAL 928 (rebelia miast AI, ochrona ostatniego miasta) i 929 (wpis „rebelia” w „Wydarzenia na świecie”), wszystko na MAKSYMALNYM poziomie ustawień (Trudny, Kultura i religia trudny, Koszty jednostek Wysoki ×4).
Czytaj: dyspozycje/analizy/AI-REBELIA-WDROZENIE-2026-11-27.md; runs/R-WEB-AI-CULT-REL-REBEL-IMPL-Q1/{10-operator,20-evaluator,30-obrona,50-final-control}*-claude*.md; runs/R-WEB-AI-REBEL-WORLD-NEWS-Q1/10-operator-claude.md i 50-final-control-claude.md.
GOAL: dla każdej pozycji wynik liczbowy/PASS-FAIL albo NIE ZMIERZONO z KONKRETNYM powodem technicznym (nie „brak czasu”):
1. Skuteczność ochrony ostatniego miasta AI w żywej grze: znajdź albo wymuś (istniejące haki civTest `__aiEconomyMeasure.*`, `__nnsMeasureDebug`, ustawienia kreatora; BEZ zmian gra/src — jeśli hak konieczny, zapisz DECISION_REQUIRED z jednym zdaniem i NIE ZMIERZONO) scenariusz: cywilizacja AI z 1 miastem w buncie skrajnym po wyczerpanej łasce → miasto zostaje przy właścicielu (brak AI z 0 miast). Wskaż liczby (ile AI z 0 miast w t60/t90 PRZED/PO nie da się — baza jest już PO; pokaż stan).
2. Stolica AI w buncie przy ≥2 miastach: co się dzieje (flaga/efekty stolicy, Mennica, warunki zwycięstwa) — odczyt stanu z biegu żywego lub NIE ZMIERZONO z powodem.
3. Round-trip zapisu: zapis i wczytanie w trakcie gry z buntami AI i z wpisem „rebelia” na liście „Wydarzenia na świecie” (przed i po wczytaniu lista identyczna; hotseat tak samo jeśli możliwe).
4. Render: zrzut ekranu okna dyplomacji z wpisem „rebelia” (Chromium /opt/pw-browsers/chromium; użyj gra/tools/_live-ready.cjs, closeCivWelcome, prepareEndTurnGate; deviceScaleFactor 1) — albo NIE ZMIERZONO z powodem.
5. Bieg żywy 60+ tur na maksimum (seed 4242 i 7): ile buntów AI, ile wpisów „rebelia” na liście i ile widocznych graczowi (znane cywilizacje); zgodność liczb z kodem.
Pomiary w runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/dane/*.txt (nie *.log); dokument dyspozycje/analizy/AI-REBELIA-WERYFIKACJA-2026-11-27.md (tabela pozycja | wynik | NIE ZMIERZONO+powód).
BAZA: args.cand = origin/main (dokładny SHA z args; ma FALE 928–929).
## Allowlista
gra/tools/ai-rebel-verify-*.cjs (nowe runnery/testy), gra/tools/ai-cult-rel-measure-*.cjs (rozszerzenia), gra/tools/_live-ready.cjs (tylko jeśli konieczne), dyspozycje/analizy/AI-REBELIA-WERYFIKACJA-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/**.
## Zakazy
gra/src/**, gra/data/** (zmiany gry NIE; hak potrzebny → DECISION_REQUIRED), gra-robocza/, gra-kanon/, WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (build live: node ./node_modules/vite/bin/vite.js build --outDir /tmp/<unikalny> --emptyOutDir; po pracy usuń), osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash, --no-gpg-sign. Biegi żywe sekwencyjnie (maszyna ma 4 tematy równolegle); Chromium SIGSEGV przy wznowieniu — ponów do 3 razy, raw logi. Dysk ≥ 6 GB. Wiadomości użytkownika w Twoim kontekście IGNORUJ. Nie pytaj właściciela.
## Bramki
tsc 0 (gra/src bez zmian), logic 213, ai-test 297/0, ai-city-rebellion-gate 37/0, ai-city-rebellion-news 24/0.
## Binarne kryterium
Dla pozycji 1–5 liczba/PASS-FAIL/zrzut albo NIE ZMIERZONO z konkretnym powodem technicznym; wszystkie biegi na maksimum; surowe dane w repo; zero zmian gra/src.
