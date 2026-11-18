STATUS: PASS
DOMAIN: GAME (UI, tekst dla gracza)
TEMAT: R-WEB-UI-DIPLO-TOOLTIP-DUPLICATE-ROWS-Q1
GOAL: tooltip bilansu okna traktatu zawiera wiersz „Dopłata traktatu" (D) i wiersz „Podział PW pokoju" co najwyżej raz.
ZMIANY-COMMIT: 3206b38ec (kod + test), baza db29c24d1 (origin/main). Pliki: gra/src/ui/diplomacyTipText.ts (plainTextWithTitles: tytuł zawarty w tekście elementu lub duplikat pomijany), gra/tools/diplo-tooltip-duplicate-rows-test.cjs (nowy, bez Chromium, bez zapisu plików).
PRZYCZYNA (zmierzona): plainTextWithTitles dokładała atrybut title do tekstu elementu; wiersze D i PW mają title równy tekstowi (<div title="X">X</div>), więc tooltip dostawał "X · X". Kandydatów (ii) i (iii) nie potwierdzono w teście: fixture z samym treatyPowerSplit daje dokładnie 2 wystąpienia, nie 4.
TOOLTIP PRZED (surowy, fragment): "Dopłata traktatu: złoto 40 (pokrywa 40 PN; oddane razem z zawarciem traktatu) · Dopłata traktatu: złoto 40 (pokrywa 40 PN; oddane razem z zawarciem traktatu)"; PW: "Podział PW pokoju wg mocy (Power): ... (po rabacie relacji: 20 PW) · Podział PW pokoju wg mocy (Power): ..." D=2, PW=2.
TOOLTIP PO: D=1, PW=1 (wiersze i ich treść bez zmian; zmieniło się tylko powtórzenie).
TESTY:
- node tools/diplo-tooltip-duplicate-rows-test.cjs: PRZED poprawką (surowy) T1 FAIL {"D":2}, T2 FAIL {"PW":2}, U2 FAIL "A B · A B", U3 FAIL "Dopłata X: 40 · Dopłata X"; PO poprawce: 6 PASS / 0 FAIL (T1, T2, U1, U2, U3, M).
- Mutacja w pamięci (stara plainTextWithTitles przez plugin esbuild, bez zapisu plików): D==2 i PW==2 -> czerwono.
- npx tsc --noEmit: exit 0, brak wyjścia.
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: 33/33; unit-replace-test: 21/21; combat-test: 6/6.
- diplo-forced-peace-window-declutter-test: PASS=16 FAIL=0.
- diplo-deal-boards-declutter-tooltips-test: 13 pass, 0 fail.
- diplomacy-bilans-unifikacja-test: 27 PASS, 0 FAIL.
- diplo-weariness-pw-row-ui-test: PASS (wszystkie linie, exit 0).
- diplomacy-stol-pw-sum-test: exit 0, 0 FAIL.
- Żywy Chromium (diplo-treaty-pay-window-live-verify-2-test.cjs, 29/29): NIE ZMIERZONO (nie uruchomiono w tej rundzie).
- git diff --check: czysto.
BLOKADY: brak. Uwaga: npm ci --ignore-scripts w gra/ wykonane (df / 25 GB wolne przed startem). Plik zapisany przez pomyłkę poza worktree: ../../wf_tt.log (katalog worktrees/, poza repo) — do usunięcia przez orkiestratora; nie usunięto (zakaz rm). Plik /tmp/x (wynik tsc) także do sprzątnięcia.
RUNDY: 1/5
NASTĘPNY KROK: FC: weryfikacja testu i diffu 3206b38ec; opcjonalnie żywy Chromium.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: brak znalezisk poza zakresem.
