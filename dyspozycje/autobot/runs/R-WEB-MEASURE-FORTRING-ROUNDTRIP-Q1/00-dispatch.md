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
