# R-WEB-MAP-POLAR-COMPARE-Q1 — skrócone porównanie metryk mapy PRZED/PO polarze (kandydat POLAR A1)

DOMAIN: GAME (pomiar generatora) | Operator HAIKU 5.5 | runda 1/5 | KANDYDAT = origin/POLAR-ON-MAIN-wip c93090bc5cf938fb6d71baf64be9399425cd3c39; BAZA PORÓWNAWCZA = pierwszy rodzic merge'a kandydata (git rev-parse c93090bc5cf938fb6d71baf64be9399425cd3c39^1; to main bez polaru). Bez deployu, zero zmian w gra/src i gra/data.

## Kontekst
FC polaru (R-WEB-MAP-POLAR-RESTORE-CONTINENTS-Q1) żąda przed deployem pomiaru ciężkich testów generatora; Q14-E r1 wykazał, że pełne testy (np. land-sea-ratio) przekraczają 1800 s nawet na samej bazie, więc pełne PRZED/PO jest niewykonalne. Poprawka polaru zmienia kolejność erozji lądu: 3805–5103 z 20160 heksów kontynentów różni się od bazy (nie tylko pas polarny); typy wyspy/ziemia/pangea bajt-identyczne z bazą (pangea-land-determinism PASS).
## Zadanie
1. Przeczytaj 8 ciężkich testów: land-sea-ratio, map-gen-regression, stranded-land, map-continents-rivers, relief-grid-coverage, world-density, deposit-coast, map-coast-buffer (gra/tools/*-test.cjs) i ustal, jakie METRYKI/niezmienniki sprawdzają oraz które parametry (rozmiar mapy, seedy) wymuszają czas.
2. Napisz gra/tools/polar-before-after-measure.cjs: dla typu mapy „kontynenty” (jedyny dotknięty), rozmiarów malenki, maly, standardowy (NIE superogromny) i seedów 1, 7, 42, 99, 4242 generuje mapę na bazie i na kandydacie (dwa worktree; bundlowanie generatora esbuildem jak w istniejących testach) i liczy metryki z pkt 1: udział lądu vs cel suwaka, odcięte skrawki lądu (stranded), naruszenia bufora brzegu, liczba heksów polarnych, liczba i długość rzek (jeśli test tego pilnuje), zasięg złóż przy wybrzeżu (deposit-coast), pokrycie siatki reliefu/rzek. Wynik: tabela PRZED/PO per rozmiar×seed + zbiorczo (różnica średnia, maks. pogorszenie).
3. Werdykt per metryka: BEZ REGRESJI (PO ≤ PRZED lub w granicach asercji testu) / REGRESJA (z konkretnymi seedami) / NIE ZMIERZONO. Każdy bieg max 10 min; bez równoległych biegów; zapisz czasy. Zbyt ciężkie metryki → NIE ZMIERZONO z powodem.
4. Dokument dyspozycje/analizy/POLAR-PRZED-PO-2026-11-25.md + dane (jsonl.gz + SHA256) w runs/…/dane/.
## Allowlista
nowy gra/tools/polar-before-after-measure.cjs, dyspozycje/analizy/POLAR-PRZED-PO-2026-11-25.md, dyspozycje/autobot/runs/R-WEB-MAP-POLAR-COMPARE-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/ (jeśli trzeba bundle: vite --outDir poza repo), zmiana gra/src i gra/data, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash, uruchamianie pełnych ciężkich testów (nie mierzyć ich — to dowiedzione jako niewykonalne), uruchamianie runnerów w tle. Jeden proces ciężki naraz. Po pracy usuń node_modules, worktree, logi z /tmp. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; ai-test 297/0 (kod gry bez zmian). Zacommituj i zwróć SHA.
## Binarne kryterium
Tabela PRZED/PO z werdyktem per metryka i seedami; REGRESJA lub BEZ REGRESJI z dowodem liczbowym, albo NIE ZMIERZONO z powodem; dane z SHA256 w repo.
