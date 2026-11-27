# VERIFY-LIVE-MAX (R-WEB-VERIFY-LIVE-MAX-Q1, tag VLIVE) — pomiary live na poziomie MAKSYMALNYM

Data: 2026-11-27. Baza: origin/main `6319eaf66`. Operator: runda 1/5.
Zakres: zamknięcie pozycji NIE ZMIERZONO z zadań #38/#79 na poziomie maksymalnym ustawień (reguła właściciela 26.11).
Zmiany w `gra/src`: brak. Zmiany w `gra/tools`: brak nowych plików (użyto istniejących runnerów).

## Poziom maksymalny (przyjęty)

- „Dyplomacja i wojna” = **Trudna** (kary ×3, bonusy ÷3; najwyższy z trzech poziomów w `gra/src/ui/newGameFlow.ts`).
- Flagi dyplomacji (pakiet 6 flag, `--all-flags 1`): ON (zgodnie z domyślnymi wartościami od FALI 888).
- Gracz: autopilot (`--player-ai 1`, domyślnie w runnerze diplomacy-harder).
- „Koszty jednostek”, „Wzrost surowców” itd. — nie są zmieniane w tych biegach (runner startuje ustawieniami z kreatora `doStartGame`; poziom „Koszty jednostek” w biegu = niski, jak w `__nnsMeasureDebug.startGame`). Dla pozycji 1–2 poziom maksymalny dotyczy wyłącznie dyplomacji.

## Tabela wyników

| Pomiar | Wynik | Poziom ustawień | NIE ZMIERZONO |
|---|---|---|---|
| 1. Limit wojen z graczem (seed 4242, tury 2–99 z 120) | **0 naruszeń** limitu (naturalne ≤1 i epoki ≤1 na cywilizację, gracz i AI). Pierwsza wojna gracza: tura 40 (pokój wymuszony epoki). Pary-tury z wojną gracza: 72. Łącznie w wojnie do 7 par jednocześnie (wszystkie cywilizacje, t88) | Dyplomacja = Trudna; flagi ON | Tury 100–120 (Chromium SIGSEGV przy wczytaniu slotu; obciążenie maszyny load 9–25). Seed 7: NIE ZMIERZONO (czas). |
| 2. Limit 2 sojuszy AI↔AI (seed 4242, tury 2–99 z 150) | **0 sojuszy** AI↔AI w całym biegu; max sojuszy na cywilizację = 0; **0 naruszeń** limitu 2. Licznik `sojuszeAiAi` = 0 w 98/98 turach | Dyplomacja = Trudna; flagi ON | Pomiar nie testuje limitu przy wartości >0 w tym biegu. Tury 100–150 i seed 7: NIE ZMIERZONO (czas, Chromium). |
| 3. Żywa zamiana Żywność→Podatek (kurs 0,2) | Harness na modułach gry (`verify-live-food-to-tax-test.cjs`): **PASS**. Kurs 0,2 na poziomach easy/normal/hard; 100 żywności → 20 podatku; 30 → 6; mutacja kursu normal = CZERWONA. Żywa gra bez Targowiska: bramka zamknięta (`enabled=false`, zużycie 0) | Kurs z danych (0,2) | **Żywa tura z zbudowanym Targowiskiem (jedna tura, UI/hak)**: NIE ZMIERZONO — brak czasu na budowę i tury w żywej grze na obciążonej maszynie. |
| 4. Pokój z cesją miast | **Żywo (Chromium, `diplomacy-city-cession-live-test.cjs`): 17 PASS / 0 FAIL.** T1: AI oddaje 1 miasto → gracz (pokój zawarty, AI straciło dokładnie 1). T2: gracz oddaje 1 miasto → AI (kierunek poprawny). T3: cesja stolicy odrzucona, pokój NIE zawarty, komunikat „Pokój nie zawarty”. Zero pageerror. **Wielomiastowa (>1) logika: `peace-city-cession-negotiated-test.cjs` 19 PASS / 0 FAIL** (dawca z 8 miastami oddaje 2; druga sekwencja: ostatnie miasto). | Gra domyślna, pokój z cesją | Cesja >1 miasta **na żywej grze** (Chromium, skryptowany hak): NIE ZMIERZONO — test żywy obejmuje tylko 1 miasto na stronę; wielomiastowość sprawdzona testem logiki, nie na żywo. |
| 5a. FLEEMANUAL (ręczny odwrót, bitwa 3D) | `flee-manual-measure.cjs`: **28 PASS / 0 FAIL**, plik `flee-manual-measure-caseall.json` sha256 `eda3b50dc7f6cfc52a3b3bdfa7ef4299b03b3035177998c4ee89e2bb58c6094e`. Limit ruchu, brak wyjścia poza planszę (0), brak kroków bez punktów (0) | Scenariusz bitwy (nie zależy od poziomu dyplomacji) | Animacja odwrotu: NIE ZMIERZONO (runner nie ma hooka na koniec animacji). |
| 5b. FORTRING (pierścień fortów, round-trip zapisu przy flagach ON) | — | — | **NIE ZMIERZONO**: `fortring-measure.cjs` to 2 warianty × 60 tur z round-trip zapisu; na obciążonej maszynie (load 9–25 przy 4 rdzeniach) i przy niestabilnym Chromium nie udało się zamknąć biegu. Wcześniej (#119) round-trip t8 tożsamy 5/5 (wartość historyczna, nie z tego biegu). |

## Przebieg techniczny (ślad)

- Bundle: `vite build --outDir /tmp/vlive-q1-dist` (poza repo), 18 s.
- Bieg diplomacy: `tools/diplomacy-harder-measure-run.cjs --diplo-level trudna --all-flags 1 --seed 4242 --every 1 --player-ai 1`, odcinki `--stop-at` (30, 71, 82, 88, 93, 99). Wznowienia ze slotu `dipl-measure-seed4242-all1-lvl-trudna`.
- Crash Chromium (SIGSEGV / „Target page … has been closed”): przy t~18 nie wystąpił w tym biegu; wystąpił przy t~71, t~81, t~88, t~97 i przy wznowieniach; część wznowień wymagała ponowień (3 próby `openWithRetry`), część padła w całości. Tempo tury: ok. 2 s/turę na początku (t2–30), potem 40–90 s/turę przy load 9–25 (współbieżne workflow).
- Dane surowe (poza repo): `/tmp/claude-0/vlive-q1/diplo-trudna-s4242/seed4242-all1-lvl-trudna.jsonl` (98 wierszy, tury 2–99), `…state.json`, `…summary.json`.
- Analiza (poza repo): `/tmp/claude-0/vlive-q1/an/limits.py`.

## Uwagi dla orkiestratora

1. **Sojusze AI↔AI = 0 przy Dyplomacji „Trudna” (t2–99, seed 4242).** Trudna dzieli bonusy przez 3 (w tym za sojusze, wg hintu ustawienia). To jest obserwacja pomiarowa, nie dowód błędu. Zasługuje na osobne pytanie: czy brak sojuszy na poziomie trudnym jest zamierzony. Nie zgłaszam jako błędu gry bez odtworzenia z porównaniem poziomów (łatwy/normalny w tym samym ziarnie).
2. **Crash Chromium przy wczytaniu slotu i przy długich biegach** jest znany (harness, #90). Pod obciążeniem maszyny (load 25) tempo spada do 1–2 tur na 9 minut. Pomiary 100–150 tur wymagają czystej maszyny albo osobnej sesji.
3. Pozycje 4 i 5b są zamknięte częściowo: żywa cesja >1 miasta i FORTRING są do zrobienia w czystym środowisku (nie w tym temacie; brak zmian kodu).
4. Seed 7 nie był mierzony w żadnej pozycji tego tematu.
