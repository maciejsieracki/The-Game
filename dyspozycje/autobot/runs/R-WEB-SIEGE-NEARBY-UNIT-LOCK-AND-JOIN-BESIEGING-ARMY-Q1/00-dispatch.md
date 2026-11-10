# R-WEB-SIEGE-NEARBY-UNIT-LOCK-AND-JOIN-BESIEGING-ARMY-Q1 — dispatch (2026-11-09)

GOAL (zgłoszenie właściciela, 2 błędy):
1. Jednostka stojąca OBOK obleganego miasta, ale NIEUCZESTNICZĄCA w oblężeniu, jest zablokowana (ruch/akcje) razem z armią oblegającą. Ma być wolna: blokada oblężenia dotyczy wyłącznie jednostek faktycznie oblegających (członków armii oblegającej).
2. Nie można dołączyć własnej jednostki do własnej armii, która oblega inne miasto. Ma być odwrotnie niż dziś: do armii w MIEŚCIE dołączać nie wolno (obecna reguła), ale do armii OBLEGAJĄCEJ (poza miastem, na heksie oblężenia) dołączyć ZAWSZE można i wzmocnić ją.
BAZA: origin/main po FALI 589. Operator: SONNET 5.5 (uzasadnienie: dwie reguły w stanie oblężenia/łączenia armii, powiązanie z BATTLE-SIEGE-NEARBY — zachować spójność, bez nakładania zmian).
ZAKRES:
1. Diagnoza: gdzie ustawiana jest blokada oblężenia (siege*.ts, ruch, canMove/lock po oblegaCityId, filtr „jednostki w pobliżu miasta”) i dlaczego obejmuje sąsiadów; gdzie jest walidacja łączenia armii (join/merge, zakaz przy oblężeniu lub „armia ma cel”) i dlaczego odrzuca armię oblegającą.
2. Naprawa wg GOAL; łączenie wzmacnia oblężenie (nowa jednostka przejmuje stan oblężenia armii, nie resetuje liczników głodu/tur); dołączenie do armii w mieście nadal zabronione.
3. Test `gra/tools/siege-nearby-lock-join-test.cjs`: sąsiad nieoblegający rusza się; jednostka dołącza do armii oblegającej; do armii w mieście nie; liczniki oblężenia nie resetują się; brak regresji siege testów. Chromium jeśli dostępny, inaczej NIE_ZMIERZONO. LEDGER (REPIN Rust).
ALLOWLISTA: gra/src/game/siege*.ts, ruch/łączenie armii, ui łączenia (tylko komunikaty), nowy test, runs/<ID>/. Zakaz: WERSJE.md, gra-robocza/, build/dev, git add -A, push/deploy.
KONFLIKT: grupa battle/siege — start po BATTLE-SIEGE-NEARBY lub sekwencyjnie z nim.
