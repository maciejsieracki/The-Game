# R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1 — obrona Operatora (runda 3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy live; gra/src bez zmian; dodany tylko runner pomiarowy w gra/tools)
TEMAT: R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1
GOAL: odpowiedzieć na zarzuty Evaluatora (kandydat 9d6b8e89f, raport 7b7dc10f2) i domknąć pomiar na poziomie maksymalnym tam, gdzie się da.
BAZA: checkout --detach 9d6b8e89f94a586df2e8839ac09d2ca7690cfeaf (przed commitem obrony).

## Odpowiedzi na zarzuty

1. Poziom maksymalny nie zmierzony, uzasadnienie operatora nieprawdziwe — PRZYJMUJĘ (poprawiono, pomiar częściowy).
   - Dowód: `window.__settingsLive` istnieje w `gra/src/main.ts` (blok `?civTest=1`, `startNewGame` = `doStartGame`); używa go `verify-live-*`. Poprzednie zdanie obrony r2 było błędne.
   - Pomiar na maksimum: `gra/tools/live-playtest-gate-max-measure.cjs` (nowy). Ustawienia: Dyplomacja `trudna`, Koszty jednostek `wysoki`, Kultura i religia `trudny`, poziom `Trudny`, mapa `Super Huge`. Echo ustawień potwierdzone (`difficulty: hard`, `diplomacyWarLevel: trudna`, `kulturaReligiaLevel: trudny`, `kosztJednostekPace: wysoki`).
   - Wynik: `canEnd: false` w turze 1 mimo podniesienia skarbca i spichlerza. Log konsoli gry: 10× `[EndTurn] blocked: awaitingFirstPlayerCity` — gracz musi najpierw założyć miasto. Bramka skarbca/spichlerza NIE jest tu blokadą.
   - Surowe wyjście: `logi/MAX-live-playtest-gate-r3.txt`. Status pomiaru: rc=1 (diagnostyka, nie PASS). NIE ZMIERZONO: bramka na maksimum przy założonym pierwszym mieście. Do osobnego tematu.
   - Testy forced-war/sidepanel/era nadal działają na domyślnym scenariuszu `?playtest=mapa`, bo jego bootstrap daje miasto; przepięcie testów NIE zmienia ich poziomu ustawień (to NIE jest pomiar na maksimum dla tych testów).

2. forced-war-player-target-live-test ponad limitem 280 s — PRZYJMUJĘ (bez skracania testu).
   - Pomiary: 364 s (operator r2) i 457 s (Evaluator, maszyna współdzielona). Test NIE skrócony (skrócenie = osłabienie kroków albo rozbicie scenariusza — decyzja orkiestratora).
   - Zgłoszony wyjątek limitu czasu. Wynik rc=0, 12/0 zachowany.

3. Sprzeczne sekcje w dokumencie analizy — PRZYJMUJĘ.
   - `dyspozycje/analizy/TESTY-LIVE-BRAMKA-PLAYTEST-2026-11-27.md`: dodany nagłówek STATUS (wiążące: sekcja „Runda 2 (baza 5c187d3be)” i „Runda 3”), sekcje rundy 1 i obrony r2 oznaczone NIEAKTUALNE, tezy „prepareEndTurnGate nie jest wpięty” i „bez civTest=1 nie da się” skorygowane wpisami [KOREKTA r3]. Kolumna „blokuje ekran powitalny” = hipoteza z grep.

4. era-change-toast: sekcja F i Escape — PRZYJMUJĘ (przyczyna NIEZBADANA).
   - PRE: C/D/E FAIL, Escape OK (wątpliwe, karta F pusta). PO: C/D/E PASS, F FAIL (`sections:0`, jak w PRE), Escape FAIL, TimeoutError na `[data-act=tree]`.
   - Nie zbadano przyczyny FAIL Escape w PO. Nie twierdzę, że era-change-toast zmienia wynik w całości — zmienia się do sekcji E.
   - Zdanie r2 „Jego fail w F nie jest skutkiem tej zmiany” wycofane jako nieudowodnione.

5. Pełne bramki oznaczone NIE ZMIERZONO — PRZYJMUJĘ (uruchomione teraz, surowe wyniki):
   - `tsc --noEmit`: rc=0
   - `tools/logic-test.cjs`: LOGIC OK (213/213), rc=0
   - `tools/tech-tree-test.cjs`: 20 pass, 0 fail, rc=0
   - `tools/research-test.cjs`: PASSED 33 / FAILED 0 / TOTAL 33, rc=0
   - `tools/combat-test.cjs`: COMBAT TEST 6/6 pass, rc=0
   - `tools/ai-test.cjs`: ai-test 297 passed, 0 failed, rc=0
   - `tools/unit-replace-*-test.cjs` (5 plików): rc=0 każdy; liczby z surowego wyjścia: archer-slinger 51 OK/0 FAIL; full-cost 40 passed/0 failed; multitype-walk 25 OK/0 FAIL; promotion-table PASS 32 wpisów/63 krawędzi; army-multi-select: Chromium/live NIE_ZMIERZONO (brak playwright/jsdom w piaskownicy), pozostałe pokrycie logiką rc=0.

## Zmiany w commicie obrony
- `gra/tools/live-playtest-gate-max-measure.cjs` (nowy; allowlista `live-playtest-gate-*.cjs`; uruchamia się z `LIVE_WORK` wskazującym katalog poza repo).
- `dyspozycje/analizy/TESTY-LIVE-BRAMKA-PLAYTEST-2026-11-27.md` (status, korekty, sekcja „Runda 3”).
- `dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1/logi/MAX-live-playtest-gate-r3.txt` (surowe wyjście).
- ten raport.
- `gra/src` bez zmian; testy forced-war/sidepanel/era bez zmian w tej rundzie.

## Hygiena
- `gra/node_modules` z `npm ci` (gitignored) usuwany po pracy; build live w katalogu poza repo.

BLOKADY:
- Pomiar bramki na poziomie maksymalnym wymaga założonego pierwszego miasta; brak haka/akcji w `civTest` do tego (NIE ZMIERZONO).
- forced-war przekracza limit 280 s (zgłoszony wyjątek, nie skrócony).
- Przyczyna FAIL Escape w era-change-toast (PO) nieznana.

RUNDY: 3/5 (runda 2 = FC FAIL; ta runda odpowiada na zarzuty Evaluatora)

NASTĘPNY KROK (dla orkiestratora): decyzja o wyjątku czasu forced-war (akceptacja vs rozbicie testu); osobny temat na hak zakładania pierwszego miasta w `civTest` (wtedy pomiar bramki na maksimum); zbadać Escape w era-change-toast.

UWAGI-DLA-ORKIESTRATORA:
- Blokujący czynnik `Zakończ turę` w świeżej grze to `awaitingFirstPlayerCity` (`gra/src/main.ts`, `canPlayerInitiateEndTurn`), nie skarbiec/spichlerz. Wniosek dla tematów LIVEGATE/VLIVE: sprawdzić, czy scenariusze na maksimum wymagają zakładania miasta.
- Wzrost surowców z epoką: przyjęto WYŁ. (wartość domyślna); WŁ. nie zmierzono.

DEPLOY/PUSH: NIE WYKONANO
