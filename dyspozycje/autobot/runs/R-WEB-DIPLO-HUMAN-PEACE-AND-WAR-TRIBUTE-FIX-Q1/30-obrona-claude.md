# R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1 — obrona (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1
GOAL: pokój między fotelami ludzkimi tylko w trwającej wojnie (P21c); w wojnie „zaproponuj trybut” z modala jednorazowy (P17b); testy behawioralne i czerwone mutacje.
BAZA: d629d2d4e (origin/main); kandydat r1: 69c08a5cc; poprawki r2: 69b688a3a (SHA czubka do integracji).

## Odpowiedzi na zarzuty Evaluatora

1. Czerwony peace-vazne-always-test (P5) — PRZYJMUJĘ. Kotwica P5 przepięta na blok `if (p.cmd.type === 'zaproponuj_pokoj') { // P21c ...` (gra/tools/peace-vazne-always-test.cjs:132). Wynik: `WYNIK: ZIELONE`. Pin nie został osłabiony: nadal wymaga `logPeaceVazne(p.fromOwnerId, p.toOwnerId` w tym samym bloku. Uwaga: na bazie d629d2d4e ten pin jest czerwony (brak markera P21c) — to skutek zmiany kodu, nie regresja.
2. Testy niebehawioralne — PRZYJMUJĘ. Oba testy P21c/P17b przepisane tak, by WYKONYWAŁY produkcyjne ciała funkcji wyciągnięte z źródła (`humanPeaceRejectReason`, `proposeToHuman`, gałąź `case '8'` z readPayload) z atrapami zależności. Dwa sprawdzenia pozostają źródłowe (kolejność strażnika przed finalizePeaceTreatyBetween w respondToHumanProposal; wynik kontrpropozycji), co zaznaczono w nagłówku testu.
3. Raport bez NIE ZMIERZONO dla bramek i mutacji — PRZYJMUJĘ. Wyniki poniżej z surowego wyjścia.
4. Brak strażnika w finalizePeaceTreatyBetween — ODRZUCAM z dowodem. Funkcja jest wołana również przy końcu rozejmu (gra/src/main.ts:13178 `finalize: (proposerId, responderId) => { finalizePeaceTreatyBetween(...)` w mostku `enqueueTruceEndOffer`; main.ts:27377 gałąź `cywAction === 'pokoj'`; wpis P4 „koniec rozejmu -> pokoj” w peace-vazne-always-test). Tam status pary to 'rozejm', nie 'wojna', więc strażnik „tylko w wojnie” w finalize zablokowałby uprawnioną ścieżkę pokoju po rozejmie. Wejścia dla par ludzkich są zabezpieczone w proposeToHuman i respondToHumanProposal, które są jedynymi wejściami z UI hotseat. Zastrzeżenie: nie dowiodłem testem, że żadna ścieżka z ludzką parą i statusem innym niż 'wojna' nie dochodzi do finalize poza rozejmem (np. acceptPendingForcedPeace, main.ts:27092, dotyczy wojny wymuszonej — status wojny przed zakończeniem). Oznaczam jako NIE ZBADANO w pełnym zakresie.
5. Brak UI/blokady dla pary bez wojny — ODRZUCAM częściowo z dowodem. Wspólny mechanizm blokad już istnieje: gra/src/game/diplomacy-locks.ts:348-350 (`case '10'`: `if (!ctx.atWar) return { locked: true, note: 'niedostępna — nie trwa wojna' }`), stosowany w gra/src/game/diplomacy-audience-actions.ts:83 do każdego wiersza audiencji. Nie zmieniałem UI. NIE ZBADANO: czy wiersz pokoju dla pary dwóch fotelów hotseat przechodzi przez tę audiencję (wtedy blokada działa); w razie braku — gracz dostaje podpowiedź po akcie (showHintMessage w proposeToHuman), bez blokady w HUD. Do decyzji orkiestratora.
6. Kontrpropozycja zwraca true mimo odrzucenia — PRZYJMUJĘ. `respondToHumanProposal(action='counter')` zwraca `wyslano !== ''` (main.ts ~23064). Test źródłowy w diplo-human-peace-no-war-test.cjs sprawdza ten wzór.
7. Test P17b tylko regex — PRZYJMUJĘ. diplo-war-tribute-once-test.cjs wykonuje gałąź case '8' (6 przypadków: offer/demand × wojna/pokój).

## ZMIANY-COMMIT
- 69b688a3a — gra/src/main.ts (kontrpropozycja), gra/tools/peace-vazne-always-test.cjs (pin P5), gra/tools/diplo-human-peace-no-war-test.cjs (przepisany, behawioralny), gra/tools/diplo-war-tribute-once-test.cjs (przepisany, behawioralny).
- Ten raport: dyspozycje/autobot/runs/R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1/30-obrona-claude.md.
- Brak zmian w gra/src/ui/diplomacyNegotiationModal.ts i gra/src/game/diplomacy-locks.ts w tej rundzie.

## TESTY (surowe wyniki)
- tsc --noEmit (z `--ignoreDeprecations 6.0`, po `npm ci` w gra/): exit 0, 0 błędów. Bez npm ci tsc zgłaszał 177 błędów z braku modułu 'three' — środowisko, nie kod.
- diplo-human-peace-no-war-test.cjs: PASS=13 FAIL=0.
- diplo-war-tribute-once-test.cjs: PASS=8 FAIL=0.
- peace-vazne-always-test.cjs: ZIELONE.
- Mutacje (każda w osobnym przebiegu, po przywróceniu pliku z git):
  - M1 `cmd.type !== 'zaproponuj_pokoj'` → `===`: peace PASS=6 FAIL=7.
  - M2 status `'wojna'` obejście (`if (true) return null`): peace PASS=8 FAIL=5.
  - M3 wyłączony strażnik w proposeToHuman (`if (false)`): peace PASS=10 FAIL=3.
  - M4 kontrpropozycja `return true`: peace PASS=12 FAIL=1.
  - M5 goldOnce bez warunku wojny (`offer ?`): tribute PASS=7 FAIL=1.
  - M6 usunięty goldOnce: tribute PASS=7 FAIL=1.
- Czerwone na bazie d629d2d4e (kopia plików bazowych w scratchpad): tribute PASS=7 FAIL=1; peace-no-war kończy się wyjątkiem (brak funkcji humanPeaceRejectReason) — czerwone; peace-vazne CZERWONE (1) (patrz pkt 1).
- Non-live testy peace/tribut/vassal/diplo (171 plików, bez live/measure/sim/analyze/run/export/real-render): 171/171 exit 0.
- Bramki z dispatchu uruchomione: war-rules-multiwar-main-guard 21 PASS / 0 FAIL; hud-me-literal-zero 150/0; bramki-tmpdir PASS=18 FAIL=0; hotseat-etap6d-podetap-e-source 77/0; podetap-b-exec 48/0; podetap-d-exec 46/0; podetap-e-exec 24/0; truce-end-war-notice PASS; diplo-world-news zielony (w zbiorze 171).
- NIE ZMIERZONO: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0 (nie uruchamiane w tej rundzie); hotseat-etap8-dyplomacja-dane i -ui (testy przeglądarkowe, vite build, timeout Chromium — środowisko); hotseat-etap6d-diplomacy-engine (exit 0, bez linii podsumowania); pełne testy live.

## BLOKADY
- Brak. Dwie pozycje do decyzji orkiestratora: pkt 4 (zakres strażnika w finalize) i pkt 5 (czy hotseat pokazuje wiersz pokoju przez audiencję).
- Test peace-vazne jest czerwony na czystej bazie d629d2d4e — oczekiwane, bo marker P21c istnieje tylko po zmianie.

## RUNDY
2/5 (runda 1: 69c08a5cc; runda 2: 69b688a3a + ten raport).

## NASTĘPNY KROK
Evaluator: ponowna ocena 69b688a3a. Orkiestrator: decyzja w pkt 4 i 5 (ewentualnie osobny temat na audiencję hotseat).

DEPLOY/PUSH: NIE WYKONANO
