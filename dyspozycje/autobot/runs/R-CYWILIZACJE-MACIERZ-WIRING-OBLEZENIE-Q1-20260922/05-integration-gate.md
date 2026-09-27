# INTEGRATION GATE — R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922

STATUS: INTEGRATION_PENDING (workerless — czeka na jawną zgodę właściciela)
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
GOAL: Nadpisanie 45 komórek (obl_mur_proc, obl_obrona_miasta_proc,
obl_machines_proc × 15 cyw.) wartościami z zatwierdzonej rundy
historycznej (kalibracja: standing non-compounding ±0.20, rekomendacja
agenta) + podłączenie ich jako realny konsument w trzech miejscach:
main.ts (bitwa błyskawiczna na mapie), battleScene.ts (interaktywna bitwa),
oraz siegeAi.ts/siege.ts (produkcyjna decyzja AI o oblężeniu).

## Łańcuch governance — pełna historia, wszystkie fazy zamknięte

ROUND 1:
- Operator (t_98be7b59): PASS
- Evaluator (t_50735eaf): PASS, zero zarzutów blokujących
- Final Control round1 (t_b6600158 pierwsze uruchomienie, rate-limited
  3x → recovery na OpenAI, t_d678ac72): **FAIL**, jeden zarzut blokujący —
  produkcyjna ścieżka decyzji AI o oblężeniu (main.ts → siegeAi.ts →
  siege.ts:cityDefenseBonus) ignorowała obl_mur_proc/obl_obrona_miasta_proc

NARROW CORRECTION (automatyczny dispatch systemu po FAIL):
- Operator narrow-correction (t_9e798cc8): PASS — podłączono AI-ścieżkę
  przez nowy opcjonalny `includeStructure` flag w applyCityBonus, bez
  podwójnego liczenia z realną bitwą (resolveSiegeAttack nie jest wołana
  produkcyjnie — potwierdzone dwukrotnie, niezależnie)
- Evaluator narrow-correction (t_fb7db0be): PASS, zero zarzutów, w tym
  samodzielne potwierdzenie braku podwójnego naliczenia bonusu
- Final Control round2 (t_b6600158 wznowienie po rate-limit reset): **PASS-WITH-NOTES**
  — luka AI-siege-path uznana za zamkniętą; jedna nieblokująca notatka:
  AI-heurystyka stosuje mnożnik szerzej (Obrona+Pancerz) niż realna bitwa
  (tylko Obrona) — świadome uproszczenie modelu AI, nie błąd

## Co czeka na integrację

- WORKTREE: /home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922
- BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
- HEAD: f52f3b76b4761136a43dc0ab32dde50552a176fe (niepushowany)
- BASE: origin/main=0caa4dfa31d37337cd74fdbab95ee77da4806d98
- Zmienione pliki produktu: gra/data/civ-matrix.json,
  gra/src/battle/battleScene.ts, gra/src/game/city-defense.ts,
  gra/src/game/siege.ts, gra/src/game/siegeAi.ts,
  gra/src/game/siegeMachines.ts, gra/src/main.ts,
  gra/tools/civ-matrix-oblezenie-wiring-test.cjs (nowy)
- Bramki: tsc --noEmit PASS, 83 asercje nowego testu + 8 istniejących
  plików testowych bez regresji (siege-ai-test 17, logic-test 213,
  city-defense-terrain-gate 34, mur-paradoks 29, defense-breakdown 44,
  fortify-pole 41, militia-garrison-router-siege 8), git diff --check
  czyste, 45/45 komórek civ-matrix zweryfikowane niezależnie 3× (Evaluator
  round1, Final Control round1/recovery, Evaluator+Final Control round2).
- Dwie preexisting, niezwiązane awarie testów (empire-panel-miasto-
  obywatele-content-test 1 fail, koszty-surowcowe-test 3 fail) — obecne
  już na czystym origin/main, potwierdzone wielokrotnie przez git stash,
  niezwiązane z tym tematem.

## Uwaga dla integratora (z Final Control PASS-WITH-NOTES)

AI-siege-heurystyka (siegeAi.ts/siege.ts) stosuje civ-matrix mnożnik muru
na CAŁOŚĆ (Obrona+Pancerz) garnizonu, podczas gdy realna bitwa
(main.ts/battleScene.ts) stosuje go WYŁĄCZNIE na składową Obrony. To
świadome, udokumentowane uproszczenie modelu decyzyjnego AI (inny cel:
szacunkowa ocena siły przed bitwą, nie rozstrzygnięcie starcia) — nie błąd,
ale integrator powinien mieć tego świadomość przy przyszłych zmianach tej
ścieżki.

## Ważna uwaga: mergeability z równoległym gate'em Manpower

Ta gałąź i hermes/R-CYWILIZACJE-MACIERZ-WIRING-MANPOWER-Q1-20260922 (gate
t_3a0bc8f9) obie bazują na origin/main niezależnie i modyfikują
civ-matrix.json w rozłącznych kluczach (obl_* vs mp_*, przecięcie puste,
zweryfikowane programowo przez Final Control). Potencjalny konflikt przy
mergu dwóch branchy do main byłby czysto formatowy/liniowy (sąsiadujące
linie w tym samym obiekcie cywilizacji), nie semantyczny — integrator
powinien to zweryfikować przy faktycznym mergu, ale ryzyko jest niskie.

## Wymagana akcja

Ta karta jest CELOWO zablokowana i bez przypisanego workera. Merge do
`main` i push wymagają osobnej, jawnej zgody właściciela w czacie.

DEPLOY/PUSH: NIE WYKONANO — czeka na zgodę.
