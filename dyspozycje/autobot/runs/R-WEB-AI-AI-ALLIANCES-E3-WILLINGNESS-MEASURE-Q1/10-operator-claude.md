STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar, bez zmian zasad, progów i flagi)
TEMAT: R-WEB-AI-AI-ALLIANCES-E3-WILLINGNESS-MEASURE-Q1
GOAL: rozłożyć gotowość do sojuszu (willingnessAlly) prób toru AI↔AI na wejścia i pokazać, dlaczego tor odmawia.
ZMIANY/COMMIT: baza 77b103c7f (origin/main). Allowlista: gra/src/game/ai-ai-alliance-tick.ts (pola odczytowe w wyniku planu, typy pomiarowe), gra/src/main.ts (hak: pomiar pary, zapis ostatniego kroku, pole probyOstatniaTura w stanie), gra/tools/ai-ai-alliance-measure-analyze.cjs (tabela kubełków, per tura, mediana per archetyp, min/mediana/max per para, 5 par przy progu, wejścia nad/pod progiem), gra/tools/ai-ai-alliance-measure-hook-test.cjs (H16-H20, mutanty M15-M19), dowody/ (wycinek jsonl 29 wierszy, wynik analizatora). Flaga torSojuszyAktywny = false bez zmian. Runner ai-ai-alliance-measure-run.cjs NIE zmieniony (diag.sojusze niesie nowe pole automatycznie).
TESTY:
- tsc --noEmit: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: ALL GREEN (exit 0; liczby nie odczytano z wyjścia).
- unit-replace-test: 21/21.
- combat-test: exit 0.
- ai-ai-alliance-tick-test: suite 19/19, mutanty 8/8.
- ai-ai-coalition-test: WYNIK: ZIELONE.
- ai-ai-alliance-measure-hook-test: WYNIK ZIELONY; reguły H1-H20 zielone; 19 mutantów wykrytych.
- bieg dymny: 30 tur, seed 4242, --alliances 1 (flaga wymuszona pod civTest): 29 wierszy jsonl, 0 wystąpień NaN, sojusze AI↔AI = 0, próby 302, odmowy 302. Bundle zbudowany poza repo (vite, 33 s).
- analizator na wycinku: rozkład 300/302 prób w kubełku 0,0-0,1; 2 próby w 0,6-0,7; odmowy: 300 „gotowość poniżej progu”, 2 „brak PN w skarbcu”.
BLOKADY: brak.
NIE_ZMIERZONO:
- Składniki gotowości (archetyp, Relacja, Zaufanie, Respekt, agresja): aiDiplomacyStance zwraca tylko cztery wartości końcowe, więc rozbicie to WEJŚCIA funkcji plus flagi granicy i wrogów, a nie jej wewnętrzne składowe.
- Test behawioralny haka (bez statycznego dopasowania tekstu): nie wykonany.
- Biegi 3 ziarna × 90 tur: nie wykonane (zadanie orkiestratora).
- Histogram liczony jest w analizatorze z wierszy jsonl, nie w runnerze (runner-wrapper nie agreguje; allowlista nie obejmuje runnera ekonomii).
- Przyczyna duplikatów prób w jsonl (324 surowe, 302 unikalne po ziarnie, turze, parze i wartości): analizator deduplikuje, źródła nie zbadano.
WYNIK POMIARU (ziarno 4242, 30 tur):
- Gotowość 0,0 w 322 z 324 surowych prób. Próby z zerem mają Relację 41-129,6 i Zaufanie 11-99,6. Wartość 0 wynika z bramki sojuszu w aiDiplomacyStance (poniżej dynamicznych minimów Zaufania i Relacji), a nie z progu 0,54.
- Dwie próby > 0,54 mają Relację 130 i Zaufanie 100 (gotowość 0,60 i 0,66).
- Wspólna granica: 8% prób poniżej progu, 0% nad progiem. Wspólny wróg i sojusznik wroga: 0%.
- Mediana per archetyp i per para: 0 (większość par).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja kodu, testów i zgodności z allowlistą). Decyzja właściciela (ABC): czy progiem jest gotowość 0,54, czy dolna bramka Zaufanie/Relacja w aiDiplomacyStance.
DEPLOY/PUSH: NIE WYKONANO
