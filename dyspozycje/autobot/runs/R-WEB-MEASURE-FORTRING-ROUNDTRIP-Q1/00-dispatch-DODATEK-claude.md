# R-WEB-MEASURE-FORTRING-ROUNDTRIP-Q1 — pierścień fortów: bieg ciągły, powtórka round-trip zapisu (różnica cityProd), pomiar z fortami

DOMAIN: GAME (pomiar; ewentualny kandydat BŁĄD-GRY) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main bb3a824ca4cd493dc60012c466247c729858fa00 (FALA 902). Zero zmian logiki gry; dopuszczalny TYLKO hak civTest/runner pomiarowy.

## Kontekst
FC FORTFLEE (runs/R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1/50-final-control-claude.md, 20-evaluator-claude.md zarzuty 1–5; dokument dyspozycje/analizy/POMIAR-FORTRING-FLEEMANUAL-2026-11-25.md): w seed 4242, 59 tur, pierścień fortów ON/OFF — 0 fortów w obu biegach (wpływ NIE ZMIERZONO); biegi dzielone na 6–7 wznowień ze slotu; round-trip zapisu przy ON NIE tożsamy (pole cityProd, miasta 105/106 — kolejka produkcji z cudem, firstDiffAt 9182), przy OFF tożsamy — niezweryfikowane (brak powtórki, wpływ wznowień). Runner: gra/tools/fortring-measure.cjs; hak: window.__… setFortRingOff (civTest, territory.ts setCivTestFortRingOff).
## Zadanie
1. Powtórz round-trip ON i OFF (zapis→wczytanie→porównanie stanu) NA TYM SAMYM stanie, 3 powtórzenia każdy, w trybie bez wznowień ze slotu; wskaż, czy różnica cityProd jest powtarzalna. Jeśli powtarzalna: minimalne odtworzenie (który element kolejki produkcji, czy związany z fortem/pierścieniem, czy z cudem) — NIE naprawiaj; to kandydat BŁĄD-GRY (osobny temat naprawczy).
2. Bieg ciągły seed 4242 ON i OFF do tury 60 (setsid nohup timeout 1800 …, Monitor; bez ręcznych wznowień); jeśli forty nadal się nie pojawiają, dodaj hak civTest stawiający fort (tylko pod ?civTest=1, domyślnie bez zmiany zachowania) i zmierz czas tury z fortem(ami) vs bez.
3. Test „gate”: bez haka/z hakiem OFF-wyłączonym stan po 30 turach (liczba fortów, hash stanu) identyczny z bazą.
4. Dokument wyników: dyspozycje/analizy/POMIAR-FORTRING-ROUNDTRIP-2026-11-25.md (NIE ZMIERZONO tam, gdzie nie zmierzono).
## Allowlista
gra/tools/fortring-measure.cjs, nowe gra/tools/fortring-*.cjs, ewentualnie hak civTest w gra/src/main.ts i gra/src/map/territory.ts (tylko pod ?civTest=1), dyspozycje/analizy/POMIAR-FORTRING-ROUNDTRIP-*.md, dyspozycje/autobot/runs/R-WEB-MEASURE-FORTRING-ROUNDTRIP-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana logiki gry, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash (użyj setsid nohup timeout … & i Monitor). Dysk >= 4 GB; po pomiarach usuń gra/node_modules i /tmp tematu.
## Bramki
tsc 0 (jeśli zmieniono src); logic 213; ai-test 297/0; fortring-civtest-hook 8/0; war-rules-multiwar-main-guard 21/0; hotseat e-source 77/0; bramki-tmpdir PASS=18. Zacommituj i zwróć SHA.
## Binarne kryterium
Round-trip ON/OFF: 3 powtórzenia z wynikiem (identyczny/różny + powtarzalność); bieg ciągły ON i OFF do t60 z czasami tury; test gate; dokument z uczciwym NIE ZMIERZONO.

---
## DODATEK runda 2/5 (po FC FAIL r1: BLOK bez dostarczonej pracy) — BAZA = origin/main bb3a824ca (bez zmian)
Przyczyna FAIL r1: Operator nie zacommitował NICZEGO (kandydat == baza); pomiary trwały dłużej niż jedna runda; wznowienia slotu w fortring-measure.cjs wywalają Chromium (SIGSEGV, tura ~16) — NIE używaj wznowień ze slotu.
ZASADY r2 (twarde):
1. COMMITUJ WCZEŚNIE I CZĘSTO (git add <ścieżki tematu>; commit po każdym kamieniu: runner round-trip, wynik round-trip, raport 10-operator-claude.md ze stanem NIE ZMIERZONO). Zwrot BEZ commita = BLOCK = ta sama runda stracona. Raport z częściowymi wynikami i uczciwym NIE ZMIERZONO jest lepszy niż brak raportu.
2. Bieg ciągły ON seed 4242 do t60 JUŻ DZIAŁA (proces node tools/fortring-measure.cjs --variant on --turns 60, PID 11723, start ~19:52, budżet 3300 s, wynik: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/fr-out i /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/fr-on2/run.log, rows: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/fr-scratch). NIE kasuj go i NIE uruchamiaj drugiego ON (sprawdź `ps aux | grep fortring-measure`). Dist bundle ON/OFF: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/fr-dist. Bieg OFF uruchom dopiero po zakończeniu ON (czasy tury nierównoległe), też detached: setsid nohup timeout 3400 node tools/fortring-measure.cjs --variant off --seed 4242 --turns 60 --budget-sec 3300 --dist … --scratch … --out … > log 2>&1 & — i czekaj Monitorem z until-loop (nie sleep), max 35 min na bieg.
3. Round-trip x3 (zadanie 1) wykonaj NAJPIERW (jest szybki, nie wymaga t60): zapis→wczytanie→porównanie stanu w tej samej sesji Chromium BEZ restartu przeglądarki między zapisem a odczytem (SIGSEGV przy wznowieniu); ON i OFF po 3 powtórzenia, ta sama tura (np. t30 lub taka jak w fortring-measure.cjs round-trip). Wynik: identyczny/różny + powtarzalność różnicy cityProd (miasta 105/106) → dokument analizy.
4. Jeśli biegi t60 nie zdążą — zwróć wynik round-trip + stan biegu (do której tury, czasy tury) i oznacz resztę NIE ZMIERZONO; FC oceni częściowy wynik.
5. Dokument dyspozycje/analizy/POMIAR-FORTRING-ROUNDTRIP-2026-11-25.md — zawsze (nawet częściowy).
Allowlista bez zmian (+ nowe gra/tools/fortring-roundtrip*.cjs).
