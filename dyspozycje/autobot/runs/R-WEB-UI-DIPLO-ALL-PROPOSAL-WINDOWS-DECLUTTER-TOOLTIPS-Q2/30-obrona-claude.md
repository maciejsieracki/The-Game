# R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2 — Operator (obrona, runda 2)

STATUS: OBRONA-R2-CZĘŚCIOWA (zarzut 1 niedomknięty; zarzuty 2–5 przyjęte z dowodem)
DOMAIN: GAME (UI dyplomacji, wyłącznie prezentacja)
TEMAT: R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2
GOAL: wyjaśnienia okien dyplomacji do tooltipów; widoczne tylko liczby, nazwy, przyciski; nic nie usunięte (R1–R6).
BAZA: 89a5e25cc (origin/main). Start: kandydat a08419bee (r1). Gałąź: autobot/R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2.
ZMIANY-COMMIT: SHA końcowy — zwrócony w polu `sha` (commit na tej gałęzi, ponad a08419bee).
  Pliki: gra/src/ui/diplomacyAudience.ts (usunięte 4 martwe reguły CSS), gra/src/ui/diplomacyNegotiationModal.ts (Pakt, Handel, Dar, Wasal → tooltip), gra/tools/diplo-all-windows-declutter-tooltips-test.cjs (30/0, mutacje dla 12/12 wzorców), gra/tools/diplo-all-windows-declutter-real-render-test.cjs (nowy; Chromium + DOM), dowody/ (14 PNG PRZED/PO).
  Commit dołączono wyłącznie po ścieżkach (bez -A). Kod w gra/ jest częścią commita, bo bez niego wynik nie jest zamknięty.

## Odpowiedzi na zarzuty
1. PRZYJĘTY CZĘŚCIOWO. Zrobione w tej rundzie: Pakt (Złamanie → title etykiety „Czas paktu”), Handel/Umowa wymiany/Dar (instrukcja „zamknij to okno…” → title; widoczna krótka wskazówka), Wasal (opis roli → title). Poprzednio zrobione: wojna, sojusz, zerwanie, baner, relacja, wiarygodność, aktywne traktaty, stół, karty negocjacji. NIEZROBIONE (do decyzji FC): Wchłonięcie (formularz nie zbadany w tej rundzie), panel PW w diplomacyNegotiationModal („Zwiększa szansę akceptacji…”), Pokój/Zawieszenie (okno propozycji), desperacja/zmęczenie w nagłówku audiencji, showWarConfirm/BreakTreaty — pytanie „Czy na pewno?” zostaje; linie `info` w penaltyBlockHtml zostają widoczne (klasyfikacja: komunikat blokujący czy wyjaśnienie). Nie ma tu decyzji produktowej, więc luki traktuję jako niedokończony zakres, nie jako DECISION_REQUIRED.
2. PRZYJĘTY. Zrzuty Chromium PRZED/PO dla 7 okien: wojna, sojusz, zerwanie, pakt, handel, dar, audiencja (runs/.../dowody/PRZED-*.png i PO-*.png). PRZED = kod bazy 89a5e25cc (git archive gra/src + gra/data). Zrzut z widocznym dymkiem gry NIE ZMIERZONO (harness nie ładuje hudTitleTooltip).
3. PRZYJĘTY. Nowy test real-render (esbuild + playwright/chromium): asercje na textContent (widoczny tekst) i na atrybutach title (wyjaśnienia w elemencie). Limit „≤ N znaków” NIE wdrożony jako liczba; zastąpiony sprawdzeniem zakazanych fraz widocznych (R2/R3).
4. PRZYJĘTY. Test grep: mutacja dla każdego z 12 wzorców (12/12 czerwienieje). Test real-render: 10 mutantów (M1–M7, M11–M13) wykrytych. M8–M10 wymagają fixture z pending/treaties — pokryte tylko mutacją grep.
5. PRZYJĘTY. Usunięte martwe reguły CSS: .da-rel-sum-hint, .da-credibility-hint, .da-negot-edit-hint, .da-treaty .da-pen.

## TESTY (surowe wyniki)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: ALL GREEN; unit-replace-test: 21/21; combat-test: All sanity checks passed.
- diplo-all-windows-declutter-tooltips-test: 30 pass, 0 fail (przed zmianą wzorców: 17/0)
- diplo-all-windows-declutter-real-render-test: baza fail=0; mutacje wykryte 10/10 → PASS (PRZED na kodzie bazy: fail=18, zgodnie z oczekiwaniem)
- diplo-deal-boards-declutter-tooltips-test (Q1): 13 pass, 0 fail
- wiarygodnosc-test: 270 pass, 0 fail; diplomacy-penalty-preview: 9 pass, 0 fail
- NIE ZMIERZONO: szerokie zestawienie 155 skryptów diplo*/dyplo* (poza powyższymi). Bazowe czerwone skrypty z r1 (8 sztuk) nie były ponownie zbadane w tej rundzie.

## BLOKADY / NOTATKI
- Dysk: 3.2 GB wolnego po zakończeniu (poniżej progu 4 GB dla web). gra/node_modules (npm ci --ignore-scripts, 134 MB) zostawiony — ignorowany przez git; usunięcie wymaga zgody orkiestratora (ZAKAZ rm).
- Nie zmieniono gra/src/game ani logiki, cen, progów, showForcedPeaceModal.
- Tymczasowy base-q2 (git archive) poza repo: /tmp/claude-0/base-q2 — do usunięcia przez orkiestratora.

RUNDY: 2/5 (obrona). Ostatni werdykt Evaluatora: FAIL (rekomendacja).
NASTĘPNY KROK: Evaluator r2 na commicie; zarzut 1 wymaga decyzji FC, czy domknąć pozostałe okna (Wchłonięcie, panel PW negocjacji, Pokój/Zawieszenie, nagłówek desperacji/zmęczenia) w kolejnej rundzie.
DEPLOY/PUSH: NIE WYKONANO
