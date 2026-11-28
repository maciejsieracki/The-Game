STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDGATE-RATION-LEVER-Q1
GOAL: Odpowiedzieć na zarzuty Evaluatora (ebf887f8c) dowodem: czy komunikat bramki „Zakończ turę” obiecuje obniżkę racji, której gracz nie może wykonać; poprawka minimalna i test wiązania z mutacją.
ZMIANY-COMMIT: baza a447f25ac (kandydat, poprawka main.ts bez zmian w tej rundzie). Zmiany tej rundy: `gra/tools/endgate-lever-baseline-test.cjs` (wzmocnienie (b), komentarz o (e)); `dyspozycje/analizy/BRAMKA-ZYWNOSCI-DZWIGNIA-RACJI-2026-11-28.md` (sekcja 8 — pomiar na żywo, zaktualizowane sekcje 0/3/6); `runs/R-WEB-ENDGATE-RATION-LEVER-Q1/30-obrona-claude.md`; logi `31-*.txt` i `32-*.txt` (surowe odczyty dźwigni, baza vs poprawka). SHA: czubek tej rundy w polu sha odpowiedzi (commit po merge-tree z a447f25ac).

## Odpowiedzi na zarzuty

1. **Brak dowodu liczbowego TAK/NIE — PRZYJMUJĘ, naprawione pomiarem na żywo.** Odtworzenie: runner `gra/tools/grace15fx-active3-live.cjs`, seed 11, tax100, tura 16, Chromium headless, konfiguracja maksymalna (jak r3). Wynik w dokumencie, sekcja 8. Najważniejsze liczby:
   - baza c834d3eb8: w komunikacie „obniżka racji żywności: +12”; `_nnsRacjeZysk` = 12; prognoza −30 przed otwarciem panelu, −18 po przycięciu racji 1,5 → 0 przez automat; suwak Wyżywienia min 0 / max 0 / wartość 0;
   - poprawka a447f25ac: dźwignia racji nieobecna; komunikat „zabraknie 18. Pomogą: rozwiązanie jednostek (złoto) +32; (żywność) +32”; kolejne przeliczenie −18 + 32 = 14 zgadza się z logiem;
   - werdykt: TAK w bazie (gracz nie może wykonać dźwigni z suwaka; +12 już siedzi w prognozie −18).
   Surowe dane: `31-zywe-baza-c834d3eb8-levers-s11.txt`, `32-zywe-poprawka-a447f25ac-levers-s11.txt`, `*-result-s11.txt`.

2. **Test tekstowy, (e) nie zależy od poprawki — PRZYJMUJĘ, poprawione.**
   - Wzmocniono (b): przypisanie `_nnsRacjeZysk` nie może zawierać `fZero.spichlerzPo − (_nnsHumanForecast.spichlerzPo)` ani wariantu z nawiasem. Wcześniej regex wymagał braku nawiasu, więc częściowe cofnięcie przechodziło.
   - Mutacje (przywracanie `gra/src/main.ts` z kopii, po każdej wartość zweryfikowana):
     - poprawka: `5 passed, 0 failed` (exit 0);
     - MUT1 pełne cofnięcie do bazy: `2 passed, 3 failed` (FAIL a, b, c);
     - MUT2 częściowe cofnięcie, wariant z nawiasem (Evaluatorowa luka): `2 passed, 3 failed` (FAIL a, b, c).
   - (e) przechodzi też na bazie; dopisano w komentarzu, że jest to strażnik zachowania bramki, a nie dowód naprawy. Dowodem naprawy są (a)–(c) i pomiar na żywo.

3. **Ścieżka AI (`rationZysk`, l. 7945–7991) — ODRZUCAM z dowodem (kod).** `rationZysk = project({ rationsZero: true }).spPo − cur.spPo`. `project()` to zwykła projekcja bez członu automatu (l. 7881–7916), więc nie ma tu dodawanego zysku automatu, czyli nie ma podwójnego liczenia. Dźwignia AI jest zastosowana realnie: `ov.rations` przycina racje do 0, a potem pętla robi `cur = project()` (l. ~7988) i decyduje na świeżym stanie. Pomiar AI na żywo: NIE ZMIERZONO (opisane w dokumencie).

4. **Czerwony `no-negative-stocks-endturn-test` (f) — ODRZUCAM z dowodem.** Uruchomione samodzielnie: w worktree poprawki `18 passed, 1 failed` (f) `canPlayerInitiateEndTurn`; w rozpakowanym `c834d3eb8` (git archive poza repo) ta sama porażka `18 passed, 1 failed`. Nie wynika z tej zmiany, osobny temat.

5. **Komentarz o suwaku „zablokowanym na limicie” bez pomiaru — PRZYJMUJĘ, zmierzone.** Na żywo suwak Wyżywienie: min 0 / max 0 / wartość 0 (lever `a-wyzywienie-min`, obie wersje). Kod komentarza nie wymaga zmiany.

## Bramki (surowe wyjście, worktree po zmianie testu; kod gry niezmieniony)
- `tsc --noEmit`: exit 0
- logic-test: `LOGIC OK (213/213)`
- ai-test: `297 passed, 0 failed`
- early-grace-15-test: `33 passed, 0 failed`
- no-negative-stocks-end-turn-gate-levers-test: `34 passed, 0 failed`
- no-negative-stocks-c2-test: `44 passed, 0 failed`
- no-negative-stocks-test: `25 passed, 0 failed`
- no-negative-stocks-projection-test: `49 passed, 0 failed`
- end-turn-gate-projection-only-test: `49 passed, 0 failed`
- no-negative-stocks-endturn-test: `18 passed, 1 failed` (f) — pre-existing, potwierdzone na bazie
- endgate-lever-baseline-test: `5 passed, 0 failed`
- tech-tree-test: `20 pass, 0 fail`; research-test: `ALL GREEN`; unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test: `All sanity checks passed.`
- NIE WYKONANO: no-negative-stocks-ai-t2-behavior-test i c3-turn (wymagają bundla `--dist`, build wykluczony regułami).

## Zakres i granice
- Zero zmian w `gra/data`, `WERSJE.md`, manifestach, `no-negative-stocks.ts`. Allowlista zachowana.
- Poziom pomiaru: maksimum ustawień jak GRACE15FX r3 (runner trudności/barbarzyńców/kultury/dyplomacji na najwyższym poziomie, Wysoki ×4). Maksimum przyjęte jak w runnerze; nie zbadano innych poziomów (poza zakresem zasady).
- Granice pomiaru: jedno ziarno (11), jedna tura (16), tryb tax100. Tury 17–30 i inne ziarna NIE ZMIERZONO.
- Pomiar: 4 wywołania Bash na pierwszym planie (po 2 na bazę i na poprawkę, każde ≤ 400 s budżetu runnera, sesja wznawialna; Chromium nie padł). Bez run_in_background.

## Pliki wspierające
- Worktree bazy: `git archive c834d3eb8` do katalogu poza repo; symlink do `node_modules` poprawki. Katalog usunąć przy sprzątaniu (nie jest w repo).

BLOKADY: brak (AI-live NIE ZMIERZONO — opisane, nie blokuje werdyktu TAK w bazie ani poprawki).
RUNDY: 2/5 (runda 1: Operator; runda 2: obrona).
NASTĘPNY KROK: Final Control: kontrola diffu (test + dokumenty), ocena, że poprawka nie zmienia kodu gry; ewentualny bieg na żywo tur 17–30 jako osobny temat, jeśli orkiestrator uzna za potrzebny.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Pre-existing czerwony `no-negative-stocks-endturn-test` (f) — osobny temat do przydziału.
- Runda 2 była prowadzona na tej samej gałęzi worktree; nie integrowano, nie pushowano.
- Podpis commitów: commit wykonywany zwykłym `git commit` bez zmian konfiguracji; przy błędzie podpisu zakończyć jako INFRA.
